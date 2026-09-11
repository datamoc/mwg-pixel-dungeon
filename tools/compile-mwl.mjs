import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileSources, emitModule, extractCatalog } from 'mwg/mwl';

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
const game = compileSources(files.map((file) => ({ file, source: fs.readFileSync(file, 'utf8') })));

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
validateUniqueIds(nodes, 'item');
validateUniqueIds(nodes, 'trait');

function effectSet(traitId, applyTo) {
  const trait = nodes.find((node) => node.tag === 'trait' && node.attributes?.id === traitId);
  const effect = trait?.children?.find((node) => node.tag === 'effect' && node.attributes?.apply_to === applyTo);
  if (effect?.attributes?.set === undefined) throw new Error(`MWL ${traitId} is missing ${applyTo}`);
  return effect.attributes.set;
}

function validateRosterReferences() {
  for (const row of effectSet('monsterRosters', 'entries').split(';')) {
    const [, roster] = row.split('|');
    for (const id of (roster ?? '').split(',').filter(Boolean)) {
      if (!monsterIds.has(id)) throw new Error(`MWL monster roster references unknown monster: ${id}`);
    }
  }
  for (const row of effectSet('monsterRosters', 'fallbacks').split(';')) {
    const [, roster] = row.split('|');
    for (const id of (roster ?? '').split(',').filter(Boolean)) {
      if (!monsterIds.has(id)) throw new Error(`MWL monster fallback references unknown monster: ${id}`);
    }
  }
}

function validateBossReferences() {
  for (const row of effectSet('bossTransitions', 'entries').split(';')) {
    const [, id] = row.split('|');
    if (!monsterIds.has(id)) throw new Error(`MWL boss transition references unknown monster: ${id}`);
  }
}

function validateActorReferences() {
  for (const row of effectSet('actorFlags', 'base_aliases').split(';')) {
    const [variant, base] = row.split('|');
    if (!monsterIds.has(variant) || !monsterIds.has(base)) {
      throw new Error(`MWL actor alias references unknown monster: ${row}`);
    }
  }
}

function validateHookReferences() {
  const hooks = new Set(effectSet('hookManifest', 'ai_profiles').split(',').filter(Boolean));
  for (const row of effectSet('monsterAiProfiles', 'entries').split(';')) {
    const [, hook] = row.split('|');
    if (!hooks.has(hook)) throw new Error(`MWL AI profile references undeclared hook: ${hook}`);
  }
}

/**
 * The room-rule tables are positional pipe/comma rows parsed again at runtime by
 * `spdLevelGen/regularLevel.ts` and `spdLevelGen/connectionRoom.ts`. A row whose shape does
 * not match that parser would otherwise throw while the game imports the level generator - a
 * black screen on start-up, not a build failure. Validate the shapes here so a malformed table
 * (an extra chance value, a dropped region-count field) is caught by `npm run build`.
 */
function validateRoomRuleTables() {
  const standardClassCount = effectSet('standardRoomClassOrder', 'classes').split(',').filter(Boolean).length;
  const connectionClassCount = effectSet('connectionRoomChances', 'classes').split(',').filter(Boolean).length;

  for (const row of effectSet('regionRoomCounts', 'entries').split(';').filter(Boolean)) {
    const fields = row.split('|');
    if (fields.length !== 7) {
      throw new Error(`MWL region room counts must have 7 fields (region|stdMax|stdBase|stdWeights|specMax|specBase|specWeights): ${row}`);
    }
    const [, stdMax, stdBase, stdWeights, specMax, specBase, specWeights] = fields;
    const weightsOf = (text) => (text ?? '').split(',').map(Number);
    const std = weightsOf(stdWeights);
    const spec = weightsOf(specWeights);
    const validWeightList = (weights) => weights.length > 0 && weights.every((weight) => Number.isFinite(weight) && weight >= 0);
    if (
      !Number.isInteger(Number(stdMax)) || !Number.isInteger(Number(stdBase)) ||
      !Number.isInteger(Number(specMax)) || !Number.isInteger(Number(specBase)) ||
      !validWeightList(std) || !validWeightList(spec)
    ) {
      throw new Error(`MWL region room counts are invalid: ${row}`);
    }
  }

  for (const row of effectSet('standardRoomChances', 'entries').split(';').filter(Boolean)) {
    const [depthText, values] = row.split('|');
    const chances = (values ?? '').split(',');
    if (!Number.isInteger(Number(depthText)) || chances.length !== standardClassCount) {
      throw new Error(`MWL standard room chances rows must have one entry per class (${standardClassCount}): ${row}`);
    }
  }

  for (const row of effectSet('connectionRoomChances', 'entries').split(';').filter(Boolean)) {
    const [depthText, values] = row.split('|');
    const chances = (values ?? '').split(',');
    if (!Number.isInteger(Number(depthText)) || chances.length !== connectionClassCount) {
      throw new Error(`MWL connection room chances rows must have one entry per class (${connectionClassCount}): ${row}`);
    }
  }
}

validateRosterReferences();
validateBossReferences();
validateActorReferences();
validateHookReferences();
validateRoomRuleTables();

const missingAssets = game.assets.filter((asset) => !fs.existsSync(path.join(root, 'src', asset)));
if (missingAssets.length > 0) {
  throw new Error(`MWL asset manifest references missing files:\n${missingAssets.join('\n')}`);
}

const emittedContent = emitModule(game);
const repeatGame = compileSources(files.map((file) => ({ file, source: fs.readFileSync(file, 'utf8') })));
if (emittedContent !== emitModule(repeatGame)) {
  throw new Error('MWL compilation is not deterministic for the current resource tree');
}

fs.mkdirSync(generatedRoot, { recursive: true });
fs.writeFileSync(path.join(generatedRoot, 'mwlContent.ts'), emittedContent);
const buffDurationData = Object.fromEntries(effectSet('buffDurations', 'entries').split(';').map((entry) => {
  const [id, duration] = entry.split('|');
  return [id, Number(duration)];
}));
const negativeBuffData = effectSet('buffDurations', 'negative').split(',').filter(Boolean);
for (const id of negativeBuffData) {
  if (!(id in buffDurationData)) throw new Error(`MWL negative-buff rule references unknown buff: ${id}`);
}
fs.writeFileSync(path.join(root, 'src', 'simulation', 'mwlBuffDurations.ts'),
  `// Generated by tools/compile-mwl.mjs from src/content/buff-rules.mwl.\nexport const BUFF_DURATION_DATA = ${JSON.stringify(buffDurationData, null, 2)} as const;\nexport const NEGATIVE_BUFF_DATA = ${JSON.stringify(negativeBuffData, null, 2)} as const;\n`);
// Status immunities: `combat.ts`'s `addBuff` reads these sets instead of a hardcoded id chain.
// Every referenced id must be a real buff, checked against the duration catalogue above.
const statusImmunities = Object.fromEntries(['fire', 'magic', 'chill'].map((source) => {
  const ids = effectSet('statusImmunities', source).split(',').filter(Boolean);
  for (const id of ids) {
    if (!(id in buffDurationData)) throw new Error(`MWL ${source} immunity references unknown buff: ${id}`);
  }
  return [source, ids];
}));
fs.writeFileSync(path.join(root, 'src', 'simulation', 'mwlStatusImmunities.ts'),
  `// Generated by tools/compile-mwl.mjs from src/content/resistance-rules.mwl.\nexport const STATUS_IMMUNITIES = ${JSON.stringify(statusImmunities, null, 2)} as const;\n`);
fs.writeFileSync(path.join(generatedRoot, 'mwlI18n.json'), `${JSON.stringify(extractCatalog(game), null, '\t')}\n`);
fs.writeFileSync(path.join(generatedRoot, 'mwlAssets.json'), `${JSON.stringify({ assets: game.assets }, null, '\t')}\n`);
fs.writeFileSync(path.join(generatedRoot, 'mwlAssets.ts'),
  `// Generated by tools/compile-mwl.mjs from the MWL resource tree.\nexport const MWL_ASSET_MANIFEST = ${JSON.stringify(game.assets, null, '\t')} as const;\n`);
