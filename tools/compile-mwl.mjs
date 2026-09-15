import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileAndEmitSources, compileSources, contentCatalog, validateCatalog } from 'mwg/mwl';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = path.join(root, 'src', 'content');
const generatedRoot = path.join(root, 'src', 'generated');

function mwlFiles(directory) {
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = path.join(directory, entry.name);
		return entry.isDirectory() ? mwlFiles(fullPath) : /\.mwl$/i.test(entry.name) ? [fullPath] : [];
	});
}

const files = mwlFiles(contentRoot).sort();
if (files.length === 0) throw new Error(`no .mwl files found in ${contentRoot}`);
const sources = files.map((file) => ({ file, source: fs.readFileSync(file, 'utf8') }));
const game = compileSources(sources);

/**
 * `mwg/mwl`'s own shared semantic validator: unknown equipment slots, effects without exactly one
 * operation, invalid or unknown hook references, and duplicate ids per tag. The hand-written checks
 * further down cover the cross-table invariants the framework cannot see (roster/boss/alias/AI-profile
 * references, room-rule table widths), so this is the other half of the split, not a duplicate of it.
 *
 * The `slots` list is the set this content actually declares in `[item]` rows; supplying it is what
 * turns an unknown slot into a diagnostic. `hooks: []` is deliberate too - this port's content
 * references no script hooks, so any future one must be declared here first.
 *
 * Every table carries table-unique row ids now (ROADMAP section 11's row-id item, done):
 * the restating tables (`unstableEnchants`, `alchemyRecipeManifest`, `curseDefinitions`,
 * `questDefinitions`) name their rows `table-domain` and carry the domain id in a column
 * (`enchant`, `recipe`, `curse`, `quest`), which is what the readers expose - so any diagnostic
 * at all fails the build, with no tolerated class and no pinned count. (The global id namespace
 * is why `rowIdScope: 'file'` was evaluated and rejected: scoping per file would silence a real
 * same-file collision across tables without fixing the modelling.)
 *
 * Evaluated against MWG 0.8.0's MWL additions and deliberately not taken: the hook-attribute
 * declarations (`MwlHookDeclaration`, `validateHookAttributes`) have nothing to declare - this
 * content authors tables, items and traits, no scenario scripts, so there is no `[hook]`,
 * `[set_variable]` or `[if]` anywhere under `src/content` and `hooks: []` stays the closed
 * world. Same for `[set_variable] path=`/`mode=` and the `"""..."""` multiline values: no
 * wrapped-text converter exists here to delete.
 */
const ITEM_SLOTS = ['artifact', 'consumable', 'weapon', 'armor', 'wand', 'missile', 'ring'];
const catalogDiagnostics = validateCatalog(game, { slots: ITEM_SLOTS, hooks: [] });
if (catalogDiagnostics.length > 0) {
	throw new Error(`MWL semantic errors:\n${catalogDiagnostics.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message} (${diagnostic.location?.file}:${diagnostic.location?.line})`).join('\n')}`);
}

function allNodes(nodes) {
  return nodes.flatMap((node) => [node, ...allNodes(node.children ?? [])]);
}

function validateUniqueIds(nodes, tag) {
  const seen = new Map();
  for (const node of nodes.filter((candidate) => candidate.tag === tag)) {
    const id = node.attributes?.id;
    if (!id) throw new Error(`MWL ${tag} is missing an id`);
    if (seen.has(id)) throw new Error(`duplicate MWL ${tag} id: ${id}`);
    seen.set(id, node);
  }
  return seen;
}

const nodes = allNodes(game.roots ?? []);
const monsterIds = validateUniqueIds(nodes, 'monster');
// Display names are authored on the monster nodes (`spdKeys.ts` derives MOB_KEYS from them),
// so a nameless mob would render its bare id in every language - the cloak/hourglass bug class.
for (const [id] of monsterIds) {
  const node = nodes.find((candidate) => candidate.tag === 'monster' && candidate.attributes?.id === id);
  if (!node?.attributes?.name) throw new Error(`MWL monster is missing its display-name key: ${id}`);
}
const itemIds = validateUniqueIds(nodes, 'item');
validateUniqueIds(nodes, 'trait');

function effectSet(traitId, applyTo) {
  const trait = nodes.find((node) => node.tag === 'trait' && node.attributes?.id === traitId);
  const effect = trait?.children?.find((node) => node.tag === 'effect' && node.attributes?.apply_to === applyTo);
  if (effect?.attributes?.set === undefined) throw new Error(`MWL ${traitId} is missing ${applyTo}`);
  return effect.attributes.set;
}

/** Typed rows of a `[table]` authored in MWL, via the framework's own catalog reader. */
const catalog = contentCatalog(game);
function tableRows(id) {
  const table = catalog.tables.find((candidate) => candidate.id === id);
  if (!table) throw new Error(`MWL table is missing: ${id}`);
  return table.rows;
}

function validateRosterReferences() {
  for (const tableId of ['monsterRosterByDepth', 'monsterRosterFallback']) {
    for (const row of tableRows(tableId)) {
      for (const id of row.roster ?? []) {
        if (!monsterIds.has(String(id))) throw new Error(`MWL roster ${tableId} references unknown monster: ${id}`);
      }
    }
  }
}

function validateBossReferences() {
  for (const row of tableRows('bossTransitions')) {
    if (!monsterIds.has(String(row.kind))) throw new Error(`MWL boss transition references unknown monster: ${row.kind}`);
  }
}

function validateActorReferences() {
  for (const row of tableRows('actorBaseAliases')) {
    if (!monsterIds.has(String(row.variant)) || !monsterIds.has(String(row.base))) {
      throw new Error(`MWL actor alias references unknown monster: ${row.variant}|${row.base}`);
    }
  }
}

function validateHookReferences() {
  const hooks = new Set(effectSet('hookManifest', 'ai_profiles').split(',').filter(Boolean));
  for (const row of tableRows('monsterAiProfiles')) {
    if (!hooks.has(String(row.profile))) throw new Error(`MWL AI profile references undeclared hook: ${row.profile}`);
  }
}

/**
 * `monsterLoot`'s `kind` column names a `GroundItemKind` (`src/dungeonConstants.ts`), which
 * `monsters.ts`'s `MWL_MOB_LOOT` reads with a bare `as GroundItemKind` cast - a typo'd kind would
 * previously compile clean and only surface as a wrong/missing dropped item at runtime. This list
 * is a duplicate of `GROUND_ITEM_KINDS` (this script runs standalone via plain `node`, before
 * `tsc`, so it cannot import the `.ts` source directly - same reason `ITEM_SLOTS` above is
 * hand-copied rather than imported); keep both lists in sync when a kind is added or removed.
 */
const GROUND_ITEM_KINDS = new Set([
  'dewdrop', 'stone', 'potion', 'scroll', 'meat', 'gold', 'armor', 'wand', 'food', 'seed',
  'darkGold', 'dwarfToken', 'amulet', 'ring', 'crystalKey', 'ironKey', 'goldenKey', 'bomb',
  'corpseDust', 'candle', 'embers', 'ankh', 'stylus', 'brokenSeal', 'honeypot', 'alchemize', 'bag', 'sandBag',
]);
function validateLootKindReferences() {
  for (const row of tableRows('monsterLoot')) {
    if (!GROUND_ITEM_KINDS.has(String(row.kind))) {
      throw new Error(`MWL monsterLoot row for ${row.monster} references unknown ground item kind: ${row.kind}`);
    }
  }
}

/**
 * `itemGroundKindAliases`'s `groundKind` column and `specialItemGroundKinds`'s `groundKind`
 * column both name a `GroundItemKind` (`src/dungeonConstants.ts`), the same closed union
 * `validateLootKindReferences` above checks for `monsterLoot`. Unlike `monsterLoot`, these two
 * tables' readers in `src/mwlContent.ts` hand the raw string straight to `src/items/itemKinds.ts`,
 * which does a bare `as GroundItemKind` cast at both call sites (`groundKindForItem`'s
 * `authoredAlias as GroundItemKind` and `portItemKind`'s `authoredGroundKind as GroundItemKind`)
 * with no runtime check at all - a typo'd `groundKind` here would compile clean under both `tsc`
 * and `npm run build` and only surface as a live item rendering/behaving as the wrong ground-item
 * family (or a `GroundItemKind` value nothing else recognizes). Nothing previously verified either
 * column against the closed kind set.
 */
function validateGroundKindAliasReferences() {
  for (const row of tableRows('itemGroundKindAliases')) {
    if (!GROUND_ITEM_KINDS.has(String(row.groundKind))) {
      throw new Error(`MWL itemGroundKindAliases row for ${row.itemId} references unknown ground item kind: ${row.groundKind}`);
    }
  }
  for (const row of tableRows('specialItemGroundKinds')) {
    if (!GROUND_ITEM_KINDS.has(String(row.groundKind))) {
      throw new Error(`MWL specialItemGroundKinds row for ${row.sourceClass} references unknown ground item kind: ${row.groundKind}`);
    }
  }
}

/**
 * `consumableClassAliases`'s `item` column names a `[item]` id read by `src/mwlContent.ts`'s
 * `MWL_CONSUMABLE_CLASS_ALIASES` (and, since 2026-09-14, `journalContent.ts`'s scroll catalogue -
 * the bug that motivated this check: a stale hand-typed list once silently diverged from this very
 * table). Nothing previously verified that every aliased `item` actually exists as an authored
 * `[item]` id; a typo or a renamed/removed item here would compile clean and only surface as a
 * `null`/wrong lookup at runtime, the same missing-reference shape `validateLootKindReferences`
 * above closes for loot kinds.
 */
function validateConsumableAliasReferences() {
  for (const row of tableRows('consumableClassAliases')) {
    if (!itemIds.has(String(row.item))) {
      throw new Error(`MWL consumableClassAliases row for ${row.sourceClass} references unknown item: ${row.item}`);
    }
  }
}

/**
 * The room-rule tables are MWG typed MWL tables now, so their row shape and cell types are
 * validated by the framework at compile time. What remains game-side is the one cross-table
 * invariant MWG cannot see: every row of a chance table must carry exactly one value per class in
 * the region's class-order list. A mismatch would otherwise throw while the game imports the level
 * generator - a black screen on start-up, not a build failure.
 */
function validateRoomRuleTables() {
  const standardClassCount = effectSet('standardRoomClassOrder', 'classes').split(',').filter(Boolean).length;
  const connectionClassCount = effectSet('connectionRoomChances', 'classes').split(',').filter(Boolean).length;

  for (const row of tableRows('regionRoomCounts')) {
    const validWeights = (weights) => weights.length > 0 && weights.map(Number).every((weight) => Number.isFinite(weight) && weight >= 0);
    if (!validWeights(row.standardWeights ?? []) || !validWeights(row.specialWeights ?? [])) {
      throw new Error(`MWL region room counts for ${row.region} need non-negative weight lists`);
    }
  }

  for (const row of tableRows('standardRoomChances')) {
    if ((row.chances ?? []).length !== standardClassCount) {
      throw new Error(`MWL standard room chances row for depth ${row.depth} must have one entry per class (${standardClassCount})`);
    }
  }

  for (const row of tableRows('connectionRoomChanceRows')) {
    if ((row.chances ?? []).length !== connectionClassCount) {
      throw new Error(`MWL connection room chances row for depth ${row.depth} must have one entry per class (${connectionClassCount})`);
    }
  }
}

validateRosterReferences();
validateBossReferences();
validateActorReferences();
validateHookReferences();
validateLootKindReferences();
validateGroundKindAliasReferences();
validateConsumableAliasReferences();
validateRoomRuleTables();

const missingAssets = game.assets.filter((asset) => !fs.existsSync(path.join(root, 'src', asset)));
if (missingAssets.length > 0) {
  throw new Error(`MWL asset manifest references missing files:\n${missingAssets.join('\n')}`);
}

const buffDurationData = Object.fromEntries(tableRows('buffDurations').map((row) => [String(row.buff), Number(row.duration)]));
const negativeBuffData = effectSet('buffDurations', 'negative').split(',').filter(Boolean);
for (const id of negativeBuffData) {
  if (!(id in buffDurationData)) throw new Error(`MWL negative-buff rule references unknown buff: ${id}`);
}
// Status immunities: `combat.ts`'s `addBuff` reads these sets instead of a hardcoded id chain.
// Every referenced id must be a real buff, checked against the duration catalogue above.
const statusImmunities = Object.fromEntries(['fire', 'magic', 'chill'].map((source) => {
  const ids = effectSet('statusImmunities', source).split(',').filter(Boolean);
  for (const id of ids) {
    if (!(id in buffDurationData)) throw new Error(`MWL ${source} immunity references unknown buff: ${id}`);
  }
  return [source, ids];
}));

// Per-monster status immunities (`Char.isImmune()`'s mob half): `combat.ts`'s `addBuff` refuses
// these buffs for the named kind, with `subtype` selecting one yogFistType (empty matches every
// instance). Monster ids must exist, subtypes must be real fist types, and immunity ids must be
// real buffs - a typo'd kind would otherwise compile clean and only surface as a live immunity
// that never fires (or fires on the wrong mob).
const MONSTER_IMMUNITY_SUBTYPES = ['', 'burning', 'soiled', 'rotting', 'rusted', 'bright', 'dark'];
const monsterImmunitiesSeen = new Set();
const monsterImmunities = tableRows('monsterStatusImmunities').map((row) => {
  const monster = String(row.monster);
  if (!monsterIds.has(monster)) throw new Error(`MWL monsterStatusImmunities references unknown monster: ${monster}`);
  const subtype = String(row.subtype ?? '');
  if (!MONSTER_IMMUNITY_SUBTYPES.includes(subtype)) throw new Error(`MWL monsterStatusImmunities has unknown subtype: ${subtype}`);
  if (monsterImmunitiesSeen.has(`${monster}:${subtype}`)) throw new Error(`MWL monsterStatusImmunities has a duplicate row: ${monster}:${subtype}`);
  monsterImmunitiesSeen.add(`${monster}:${subtype}`);
  const immunities = Array.isArray(row.immunities) ? row.immunities.map(String) : [];
  for (const id of immunities) {
    if (!(id in buffDurationData)) throw new Error(`MWL monsterStatusImmunities references unknown buff: ${id}`);
  }
  return { monster, subtype, immunities };
});

// MWG owns deterministic emission now: `compileAndEmitSources` compiles the same source set twice
// and fails if any artifact differs, and `emitArtifacts` provides the standard game-data/i18n/
// assets outputs plus the game-owned generated modules below (name -> content) in stable order.
const artifacts = compileAndEmitSources(sources, {}, {
  variable: 'gameData',
  artifacts: {
    'mwlAssets.ts': `// Generated by tools/compile-mwl.mjs from the MWL resource tree.\nexport const MWL_ASSET_MANIFEST = ${JSON.stringify(game.assets, null, '\t')} as const;\n`,
    'mwlBuffDurations.ts': `// Generated by tools/compile-mwl.mjs from src/content/buff-rules.mwl.\nexport const BUFF_DURATION_DATA = ${JSON.stringify(buffDurationData, null, 2)} as const;\nexport const NEGATIVE_BUFF_DATA = ${JSON.stringify(negativeBuffData, null, 2)} as const;\n`,
    'mwlStatusImmunities.ts': `// Generated by tools/compile-mwl.mjs from src/content/resistance-rules.mwl.\nexport const STATUS_IMMUNITIES = ${JSON.stringify(statusImmunities, null, 2)} as const;\n`,
    'mwlMonsterImmunities.ts': `// Generated by tools/compile-mwl.mjs from src/content/resistance-rules.mwl.\nexport const MONSTER_IMMUNITY_DATA = ${JSON.stringify(monsterImmunities, null, 2)} as const;\n`,
  },
});
const ARTIFACT_PATHS = {
  'game-data.ts': ['src', 'generated', 'mwlContent.ts'],
  'i18n.json': ['src', 'generated', 'mwlI18n.json'],
  'assets.json': ['src', 'generated', 'mwlAssets.json'],
  'mwlAssets.ts': ['src', 'generated', 'mwlAssets.ts'],
  'mwlBuffDurations.ts': ['src', 'simulation', 'mwlBuffDurations.ts'],
  'mwlStatusImmunities.ts': ['src', 'simulation', 'mwlStatusImmunities.ts'],
  'mwlMonsterImmunities.ts': ['src', 'simulation', 'mwlMonsterImmunities.ts'],
};
fs.mkdirSync(generatedRoot, { recursive: true });
for (const artifact of artifacts) {
  const target = ARTIFACT_PATHS[artifact.name];
  if (!target) throw new Error(`unmapped MWL artifact: ${artifact.name}`);
  fs.writeFileSync(path.join(root, ...target), artifact.content);
}
