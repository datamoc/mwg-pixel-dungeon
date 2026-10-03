import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const run = (args, env = {}) => execFileSync('git', args, {
	encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
	env: { ...process.env, ...env },
}).replace(/\r\n/g, '\n');
const normalize = (s) => s.replace(/\r\n/g, '\n');
const baseByPath = new Map();
const built = new Map();
const base = (p) => {
	if (!baseByPath.has(p)) baseByPath.set(p, run(['show', `HEAD:${p}`]));
	return baseByPath.get(p);
};
const put = (p, content) => built.set(p, normalize(content));
const whole = (p) => put(p, readFileSync(resolve(p), 'utf8'));
const change = (p, from, to) => {
	let text = built.has(p) ? built.get(p) : base(p);
	from = normalize(from); to = normalize(to);
	const count = text.split(from).length - 1;
	if (count !== 1) throw new Error(`${p}: anchor count ${count}: ${from.slice(0, 100)}`);
	put(p, text.replace(from, to));
};
const workLines = (p) => normalize(readFileSync(resolve(p), 'utf8')).split('\n');
const workLine = (p, prefix) => {
	const lines = workLines(p).filter((line) => line.startsWith(prefix));
	if (lines.length !== 1) throw new Error(`${p}: expected one row ${prefix}, got ${lines.length}`);
	return lines[0];
};

// Whole-file diffs below are exclusively R043, except generated MWL output whose
// source-path metadata is regenerated from this checkout's current absolute path.
for (const p of [
	'src/items/artifactRecharge.ts', 'src/items/spells.ts', 'src/simulation/spareWands.ts',
	'src/content/buff-rules.mwl', 'src/generated/mwlContent.ts', 'src/simulation/buffs.ts',
	'src/simulation/mwlBuffDurations.ts', 'src/ui/buffInfo.ts', 'src/ui/buffOverlays.ts',
	'src/ui/statusPane.ts', 'tools/verifyBuffOverlays.mjs',
]) whole(p);

// R043-only hunks in the mixed inventory implementation.
change('src/scenes/dungeon/hero/inventoryQuickslot.ts',
	"import { Cat, randomArmor, randomArtifact, randomGold, randomUsingDefaults, randomWeapon } from '../../../items/generator';",
	"import { Cat, generatorItemOrder, randomArmor, randomArtifact, randomGold, randomUsingDefaults, randomWeapon } from '../../../items/generator';");
change('src/scenes/dungeon/hero/inventoryQuickslot.ts',
	"import { artifactRechargeEffect, bankArtifactCharge, chaliceRechargeHeal, roseRechargeGhostHeal } from '../../../items/artifactRecharge';",
	"import { artifactRechargeAmount, artifactRechargeEffect, bankArtifactCharge, chaliceRechargeHeal, roseRechargeGhostHeal } from '../../../items/artifactRecharge';\nimport { getAllArtifactIds } from '../../../items/artifacts';");
change('src/scenes/dungeon/hero/inventoryQuickslot.ts',
	"import { MWL_MISSILE_BY_CLASS, MWL_STARTING_WEAPON_FRAMES, mwlItemEffectValue } from '../../../mwlContent';",
	"import { MWL_ITEM_SPECIFIC_FRAMES, MWL_MISSILE_BY_CLASS, MWL_STARTING_WEAPON_FRAMES, mwlItemEffectValue } from '../../../mwlContent';");
change('src/scenes/dungeon/hero/inventoryQuickslot.ts',
	"\t\tapplyArtifactRecharge(this: DungeonScene, amount: number): void {\n\t\t\tfor (const item of [...this.bag.items]) {",
	"\t\tapplyArtifactRecharge(this: DungeonScene, amount: number): void {\n\t\t\t// Keep the equip signal identical to `inventoryPanel.ts`: the artifact slot\n\t\t\t// shows the first carried artifact in Generator order. A dedicated, selectable\n\t\t\t// artifact slot remains a separate UI gap; this allows every carried artifact's\n\t\t\t// charge hook to distinguish the displayed one from the others.\n\t\t\tconst artifactIds = new Set([...getAllArtifactIds(), 'holyTome']);\n\t\t\tconst equippedArtifact = this.bag.items\n\t\t\t\t.filter((item) => item.quantity > 0 && artifactIds.has(item.id))\n\t\t\t\t.sort((a, b) => generatorItemOrder((a as typeof a & { sourceClass?: string }).sourceClass, a.id, MWL_ITEM_SPECIFIC_FRAMES[a.id] ?? 0)\n\t\t\t\t\t- generatorItemOrder((b as typeof b & { sourceClass?: string }).sourceClass, b.id, MWL_ITEM_SPECIFIC_FRAMES[b.id] ?? 0))[0];\n\t\t\tfor (const item of [...this.bag.items]) {");
change('src/scenes/dungeon/hero/inventoryQuickslot.ts',
	"\t\t\t\t\t\tconst cap = this.artifactRechargeCap(item.id, level, item);\n\t\t\t\t\t\tif (bankArtifactCharge(art, cap, effect.rate, amount, effect.capZeroesPartial) && effect.fullLineKey) {",
	"\t\t\t\t\t\tconst cap = this.artifactRechargeCap(item.id, level, item);\n\t\t\t\t\t\tconst chargeAmount = artifactRechargeAmount(effect, amount, item === equippedArtifact, this.talentRank('light_cloak'));\n\t\t\t\t\t\tif (bankArtifactCharge(art, cap, effect.rate, chargeAmount, effect.capZeroesPartial) && effect.fullLineKey) {");

// R043-only wand grant and synthetic HUD state in mixed scene files.
change('src/scenes/dungeon/hero/weaponSpellsGear.ts',
	"import { weaponCombat } from '../../../items/catalog';",
	"import { weaponCombat } from '../../../items/catalog';\nimport { gainSpareWandCharge } from '../../../simulation/spareWands';");
change('src/scenes/dungeon/hero/weaponSpellsGear.ts',
	"\t\t\trefundWandCharge: () => { scene.wandCharges.refund(1); },",
	"\t\t\t//`Belongings.charge(1f)` (`Belongings.java`, tag `v3.3.8`): every active\n\t\t\t//`Wand.Charger` receives a full charge grant. `wandCharges` is the wielded\n\t\t\t//pool; individually modeled carried wands each retain their own bank.\n\t\t\tchargeWands: (amount) => {\n\t\t\t\tscene.wandCharges.refund(amount);\n\t\t\t\tfor (const entry of scene.bag.items) {\n\t\t\t\t\tif (entry.id !== 'wand' || entry.instanceId === undefined) continue;\n\t\t\t\t\tconst spare = entry as typeof entry & { wandCur?: number; wandPartial?: number; wandMax?: number };\n\t\t\t\t\tif (spare.wandCur === undefined || spare.wandMax === undefined) continue;\n\t\t\t\t\tconst state = { cur: spare.wandCur, partial: spare.wandPartial ?? 0, max: spare.wandMax };\n\t\t\t\t\tgainSpareWandCharge(state, amount);\n\t\t\t\t\tspare.wandCur = state.cur;\n\t\t\t\t\tspare.wandPartial = state.partial;\n\t\t\t\t}\n\t\t\t},");
change('src/scenes/dungeon/deathSaveRefresh.ts',
	"\t\t\tbuffs: [...Object.entries(this.hero.buffs).map(([id, turns]) => ({ id: id as BuffId, turns: id === 'prismaticGuard' ? Math.floor(this.hero.prismaticGuardHp ?? 0) : turns })),\n\t\t\t\t//`LockedFloor` has no `iconTextDisplay()` override: icon only.",
	"\t\t\tbuffs: [...Object.entries(this.hero.buffs).map(([id, turns]) => ({ id: id as BuffId, turns: id === 'prismaticGuard' ? Math.floor(this.hero.prismaticGuardHp ?? 0) : turns })),\n\t\t\t\t//`ArtifactRecharge` is a scene-owned timer here; expose the same buff identity the HUD uses in Java.\n\t\t\t\t...(this.artifactRechargeTurns > 0 ? [{ id: 'artifactRecharge' as BuffId, turns: this.artifactRechargeTurns }] : []),\n\t\t\t\t//`LockedFloor` has no `iconTextDisplay()` override: icon only.");

// The workflow verifier also contains Rose and T63 work; add only R043 assertions.
const verify = 'tools/verifyItemWorkflows.mjs';
change(verify,
	"const { newSpareWandCharges } = require('./simulation/spareWands.js');",
	"const { newSpareWandCharges, gainSpareWandCharge } = require('./simulation/spareWands.js');");
change(verify,
	"\tconst spareBag = new Inventory();",
	"\tconst partial = { cur: 1, partial: 0.5, max: 3 };\n\tgainSpareWandCharge(partial, 1);\n\tassert.deepEqual(partial, { cur: 2, partial: 0.5, max: 3 }, 'Belongings.charge adds to each wand own partial bank');\n\tconst capped = { cur: 2, partial: 0.75, max: 3 };\n\tgainSpareWandCharge(capped, 1.5);\n\tassert.deepEqual(capped, { cur: 3, partial: 0, max: 3 }, 'a grant clamps at max and drops leftover partial charge');\n\tconst full = { cur: 3, partial: 0, max: 3 };\n\tgainSpareWandCharge(full, 1);\n\tassert.deepEqual(full, { cur: 3, partial: 0, max: 3 }, 'a full wand ignores an immediate grant');\n\tconst spareBag = new Inventory();");
change(verify,
	"\tassert.ok(sceneSource.includes('rechargeSpareWand(state, wandRate)'), 'spares recharge on the shared rate each hero turn');",
	"\tassert.ok(sceneSource.includes('rechargeSpareWand(state, wandRate)'), 'spares recharge on the shared rate each hero turn');\n\tassert.ok(sceneSource.includes('gainSpareWandCharge(state, amount)'), 'Wild Energy applies its immediate gain to each spare charger');");
change(verify,
	"\t\t\tfocus: 9999, recharging: 30, wellFed: 450,",
	"\t\t\tfocus: 9999, recharging: 30, artifactRecharge: 30, wellFed: 450,");
change(verify,
	"\tconst flags = { aim: null, grabbed: [], moved: [], teleports: [], calmed: [], paralysed: [], turns: 0, consumed: [], refunds: 0, restitched: 0, buffs: {}, recharged: [], extended: [] };",
	"\tconst flags = { aim: null, grabbed: [], moved: [], teleports: [], calmed: [], paralysed: [], turns: 0, consumed: [], refunds: 0, wandChargeGrants: [], restitched: 0, buffs: {}, recharged: [], extended: [] };");
change(verify,
	"\t\trefundWandCharge: () => { flags.refunds++; },",
	"\t\tchargeWands: (amount) => { flags.wandChargeGrants.push(amount); },");
change(verify,
	"// twenty-first extraction): a missing Feather Fall elixir does nothing; uses consume, buff, refund and\n// recharge, and spend exactly one turn.",
	"// twenty-first extraction): a missing Feather Fall elixir does nothing; uses consume, grant charges to\n// wand chargers, apply buffs/recharge and spend exactly one turn.");
change(verify,
	"\tassert.equal(wild.flags.refunds, 1, 'one wand charge refunded');",
	"\tassert.deepEqual(wild.flags.wandChargeGrants, [1], 'Belongings.charge(1f) grants one charge to every active Wand.Charger');");
change(verify,
	"\tconst { artifactRechargeEffect, bankArtifactCharge, chaliceRechargeHeal, roseRechargeGhostHeal, weaponRechargeWindow } = require('./items/artifactRecharge.js');",
	"\tconst { artifactRechargeAmount, artifactRechargeEffect, bankArtifactCharge, chaliceRechargeHeal, roseRechargeGhostHeal, weaponRechargeWindow } = require('./items/artifactRecharge.js');");
change(verify,
	"\tassert.equal(artifactRechargeEffect('hourglass').kind, 'none', 'the Hourglass never overrides charge()');",
	"\tassert.equal(artifactRechargeAmount(artifactRechargeEffect('cloak'), 1, true, 3), 1, 'equipped cloak receives the full ArtifactRecharge amount');\n\tassert.equal(artifactRechargeAmount(artifactRechargeEffect('cloak'), 1, false, 0), 0, 'unequipped cloak without Light Cloak receives no recharge');\n\tassert.equal(artifactRechargeAmount(artifactRechargeEffect('cloak'), 1, false, 1), 0.25, 'unequipped cloak at Light Cloak I receives 0.75*1/3');\n\tassert.equal(artifactRechargeAmount(artifactRechargeEffect('cloak'), 1, false, 2), 0.5, 'unequipped cloak at Light Cloak II receives 0.75*2/3');\n\tassert.equal(artifactRechargeAmount(artifactRechargeEffect('cloak'), 1, false, 3), 0.75, 'unequipped cloak at Light Cloak III receives 0.75*3/3');\n\tassert.equal(artifactRechargeAmount(artifactRechargeEffect('talisman'), 1, false, 1), 1, 'Light Cloak scaling applies only to the Cloak');\n\tassert.equal(artifactRechargeEffect('hourglass').kind, 'none', 'the Hourglass never overrides charge()');");

// Close only R043 in the roadmap and copy its matching close record.
const roadmap = base('ROADMAP.md');
const r043Roadmap = roadmap.split('\n').find((line) => line.startsWith('- [ ] **R043**'));
if (!r043Roadmap) throw new Error('R043 roadmap row not found at HEAD');
put('ROADMAP.md', roadmap.replace(r043Roadmap + '\n', ''));
const closeLine = workLine('CLOSED.md', '- [x] **R043**');
put('CLOSED.md', base('CLOSED.md').trimEnd() + '\n' + closeLine + '\n');

// Replace only the artifact rows touched by R043. Correct the Talisman residual now
// that WildEnergy is the Java caller, and remove the obsolete open-R043 marker.
const coverage = 'coverage/rows-items-equipment-and-artifacts.md';
const cloakRow = workLine(coverage, '| `CloakOfShadows.execute()`');
const rechargeRow = workLine(coverage, '| `ArtifactRecharge` (`actors/buffs/ArtifactRecharge.java`');
const iconRow = workLine(coverage, '| `ArtifactRecharge.icon()`');
const wandRow = workLine(coverage, '| `WildEnergy.affectTarget()`');
let cov = base(coverage);
const oldCloak = cov.split('\n').find((line) => line.startsWith('| `CloakOfShadows.execute()`'));
const oldRecharge = cov.split('\n').find((line) => line.startsWith('| `ArtifactRecharge` (`actors/buffs/ArtifactRecharge.java`'));
const oldTalisman = cov.split('\n').find((line) => line.startsWith('| `TalismanOfForesight`/'));
if (!oldCloak || !oldRecharge || !oldTalisman) throw new Error('Artifact coverage anchors missing');
cov = cov.replace(oldCloak, cloakRow).replace(oldRecharge, rechargeRow.replace('(open residual moved to `ROADMAP.md` R043) ', ''));
cov = cov.replace(oldTalisman,
	oldTalisman.replace('`Artifact.charge(Hero, amount)`\'s external boost, which has no caller here; ', 'the external artifact charge source is WildEnergy\'s `ArtifactRecharge` (R043); '));
cov = cov.replace(rechargeRow.replace('(open residual moved to `ROADMAP.md` R043) ', ''),
	rechargeRow.replace('(open residual moved to `ROADMAP.md` R043) ', '') + '\n' + iconRow + '\n' + wandRow);
put(coverage, cov);

// Guard against carrying any Rose-only changes in these two mixed files.
for (const p of built.keys()) {
	const src = built.get(p);
	if (p.includes('inventoryQuickslot') && /applyRoseGhostEquipment|randomRosePetalDropCell|ROSE_DROP_SOLID/.test(src)) throw new Error('Rose work leaked into R043 candidate');
	if (p.includes('weaponSpellsGear') && /roseGhostAttackSkill/.test(src)) throw new Error('Rose work leaked into R043 candidate');
}

const idx = join(tmpdir(), `mwg-r043-${process.pid}.index`);
const parent = run(['rev-parse', 'HEAD']).trim();
run(['read-tree', parent], { GIT_INDEX_FILE: idx });
for (const [p, content] of built) {
	const blob = execFileSync('git', ['hash-object', '-w', '--stdin'], { input: content, encoding: 'utf8' }).trim();
	run(['update-index', '--add', '--cacheinfo', `100644,${blob},${p}`], { GIT_INDEX_FILE: idx });
}
const tree = run(['write-tree'], { GIT_INDEX_FILE: idx }).trim();
const commit = execFileSync('git', ['commit-tree', tree, '-p', parent, '-m', 'Complete ArtifactRecharge and document the charge hooks'], { encoding: 'utf8' }).trim();
run(['update-ref', 'HEAD', commit, parent]);
console.log(`COMMITTED ${commit}`);
console.log(run(['show', '--stat', '--oneline', commit]));
