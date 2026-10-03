// R112 commit (opencode): private-index commit of exactly fifteen files - the four
// new/clean files hashed from the worktree (each re-verified to carry only this
// session's hunks vs HEAD), plus eleven files reconstructed from HEAD with only my
// hunks re-applied by unique anchor (the shared worktree copies carry peer edits and
// are NOT committed). HEAD is read fresh each attempt and update-ref uses
// compare-and-swap, so a concurrent peer commit fails the ref update instead of
// clobbering it; the attempt then rebuilds on the new HEAD. The tree is pinned to an
// exact numstat before it is committed. Usage: node tools/scratch/r112-commit.mjs [--commit]
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';

const MESSAGE = 'Port run-wide potion class identification (R112)';
const TMP = 'tools/scratch/r112-commit-tmp';
mkdirSync(TMP, { recursive: true });

const gf = (args, opts = {}) =>
	execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 27, ...opts }).toString();
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const norm = (t) => t.replace(/\r\n/g, '\n');
const count = (text, s) => text.split(s).length - 1;
function lineBlock(text, start, end, label) {
	const ls = text.split('\n');
	const si = ls.findIndex((l) => l.includes(start));
	assert(si !== -1, `${label}: start line not found`);
	assert(ls.findIndex((l, i) => i > si && l.includes(start)) === -1, `${label}: start line not unique`);
	const ei = ls.findIndex((l, i) => i >= si && l.includes(end));
	assert(ei !== -1, `${label}: end line not found after start`);
	return ls.slice(si, ei + 1).join('\n');
}
function insertAfter(text, anchor, block, label) {
	const n = count(text, anchor);
	assert(n === 1, `${label}: anchor count ${n} != 1`);
	return text.replace(anchor, () => anchor + '\n' + block);
}
function replaceOnce(text, oldStr, newStr, label) {
	const n = count(text, oldStr);
	assert(n === 1, `${label}: old count ${n} != 1`);
	return text.replace(oldStr, () => newStr);
}
function oneLine(text, prefix, label) {
	const hits = text.split('\n').filter((l) => l.startsWith(prefix));
	assert(hits.length === 1, `${label}: expected one line starting ${JSON.stringify(prefix)}, got ${hits.length}`);
	return hits[0];
}
function oneContaining(text, needle, label) {
	const hits = text.split('\n').filter((l) => l.includes(needle));
	assert(hits.length === 1, `${label}: expected one line containing ${JSON.stringify(needle)}, got ${hits.length}`);
	return hits[0];
}
const lineCount = (p) => {
	const ls = norm(readFileSync(p, 'utf8')).split('\n');
	if (ls[ls.length - 1] === '') ls.pop();
	return String(ls.length);
};

// --- files hashed straight from the worktree (new files, untracked = mine-only) ---
const directFiles = [
	'src/items/potionKnow.ts',
	'tools/verifyPotionKnowledge.mjs',
];

// splices: file -> builder(headText, worktreeText) -> committed text
const splices = new Map([
	['src/items/displayName.ts', (head, wt) => {
		let out = insertAfter(head, "import { potionRegularCounterpart } from './alchemy';",
			oneContaining(wt, "import { potionKindKnown } from './potionKnow';", 'displayName import'), 'displayName import anchor');
		const fieldBlock = lineBlock(wt, '/** Potion ids whose class stands revealed run-wide',
			'readonly potionKindsKnown: ReadonlySet<string>;', 'displayName field');
		out = insertAfter(out, '	readonly ringTypesKnown: ReadonlySet<string>;', fieldBlock, 'displayName field anchor');
		const projBlock = lineBlock(wt, '//`Potion.isIdentified()` (tag `v3.3.8`) returns `isKnown()`',
			"if (id.startsWith('potion')) identified = identified || potionKindKnown(scene.potionKindsKnown, id);", 'displayName projection');
		const ringTail = '		return `${t(RING_KEYS[id.slice(5)] ?? id)} +${ring?.level ?? 0}${curse}`;\n	}';
		out = insertAfter(out, ringTail, projBlock, 'displayName projection anchor');
		return out;
	}],
	['src/items/potionEffects.ts', (head, wt) => {
		let out = insertAfter(head, '	readonly clearEternalFire: () => void;',
			lineBlock(wt, '/** `Dungeon.level.heroFOV[cell]` - the gate Java', 'readonly markPotionKindsKnown: (ids: string[]) => void;', 'potionEffects ctx'),
			'potionEffects ctx anchor');
		const oldComment = [
			'	// Java calls identify() before applying the effect, updating shared Healing/Shielding',
			'	// class knowledge. The port\'s quaff workflow currently lacks that class-known store',
			'	// for all potions; this identification half remains Not ported, tracked by R112.',
		].join('\n');
		const newComment = lineBlock(wt, '// Java calls identify() before applying the effect',
			'landed 2026-10-01; the store lives in `items/potionKnow.ts`).', 'potionEffects shielding comment');
		out = replaceOnce(out, oldComment, newComment, 'potionEffects shielding comment');
		// My shatter identify block, adapted to HEAD: the worktree carries the peer's
		// in-flight anonymize threading (opts) which HEAD does not have yet - the
		// committed version gates on FOV only, exactly HEAD's shatter signature.
		let shatter = lineBlock(wt, "// Java's shatter identifies inside",
			'scene.markPotionKindsKnown([id]);', 'potionEffects shatter');
		shatter = shatter.split('\n').filter((l) => !l.includes("UnstableBrew's rolled flask")).join('\n')
			.replace(' An anonymized shatter -', '').replace('!opts?.anonymous && ', '');
		assert(shatter.includes('scene.cellVisible(cx, cy)') && shatter.includes('AREA_SHATTER_POTION_IDS.has(id)')
			&& !shatter.includes('opts'), 'potionEffects shatter adaptation wrong');
		out = insertAfter(out, 'export function shatterPotionAt(scene: PotionEffectsContext, id: string, cx: number, cy: number): void {',
			shatter, 'potionEffects shatter anchor');
		return out;
	}],
	['ROADMAP.md', (head, wt) => {
		const headLine = oneLine(head, '- [ ] **R112** ', 'HEAD ROADMAP R112');
		const wtLine = oneLine(wt, '- [x] **R112** ', 'worktree ROADMAP R112');
		assert(wtLine.includes('Ported 2026-10-01') && wtLine.includes('potionKnow'), 'worktree R112 line lacks markers');
		assert(headLine.includes('quaffPotion') && wtLine !== headLine, 'HEAD R112 line not the open one');
		return head.replace(headLine, () => wtLine);
	}],
	['coverage/rows-items-consumables-and-crafting.md', (head, wt) => {
		let out = head;
		const headRow1 = oneContaining(head, '**Not ported (R112):**', 'HEAD row R112');
		const wtRow1 = oneContaining(wt, '**Ported (2026-10-01, R112):**', 'worktree row R112');
		assert(wtRow1.includes('items/potionKnow.ts'), 'worktree R112 row lacks potionKnow');
		out = out.replace(headRow1, () => wtRow1);
		// Row 26: the shared line carries peer edits in BOTH directions (HEAD has
		// text the worktree lacks and vice versa), so swap only my sentence pair,
		// never the whole line - a full-line replace would steal peer worktree edits
		// and drop committed HEAD content.
		const headSentence = "This port's quaff-only flow (it has no potion-throw targeting) reproduces that exactly, no simplification needed.";
		const wtSentence = "This port reproduces that exactly on both routes - quaff via applyPotionEffect, a thrown flask via shatterThrownPotion's onThrow(cell) = shatter(cell) (the throw path landed with shatterThrownPotion, superseding this row's old 'no potion-throw targeting' note) - no simplification needed.";
		assert(count(out, headSentence) === 1, `row 26 HEAD sentence count ${count(out, headSentence)} != 1`);
		assert(wt.includes(wtSentence), 'worktree row 26 lacks my correction sentence');
		out = out.replace(headSentence, () => wtSentence);
		console.log('row1 HEAD :', headRow1);
		console.log('row1  wt  :', wtRow1);
		return out;
	}],
	['package.json', (head, wt) => {
		const headLine = oneLine(head, '    "test:items": "node tools/verifyItemWorkflows.mjs",', 'HEAD test:items');
		const wtLine = oneLine(wt, '    "test:items": "node tools/verifyItemWorkflows.mjs && node tools/verifyPotionKnowledge.mjs",', 'worktree test:items');
		return head.replace(headLine, () => wtLine);
	}],
	['src/items/scrollEffects.ts', (head, wt) => {
		let out = head;
		const members = lineBlock(wt, '/** `Potion.setKnown()` on identify', 'readonly potionKindKnown: (id: string) => boolean;', 'scrollEffects members');
		out = insertAfter(out, '	readonly markRingTypesKnown: (ids: string[]) => void;', members, 'scrollEffects ctx anchor');
		const oldFind = '	const unidentified = bag.items.find((i) => !i.identified && i.quantity > 0);';
		const newFind = lineBlock(wt, '//`ScrollOfIdentify` picks Java', '&& !(i.id.startsWith(\'potion\') && context.potionKindKnown(i.id)));', 'scrollEffects find');
		out = replaceOnce(out, oldFind, newFind, 'scrollEffects find');
		const potionMark = oneContaining(wt, 'if (unidentified.id.startsWith(\'potion\')) context.markPotionKindsKnown', 'worktree potion mark');
		const ringMark = "	if (unidentified.id.startsWith('ring_')) context.markRingTypesKnown([unidentified.id]);";
		out = insertAfter(out, ringMark, potionMark, 'scrollEffects mark anchor');
		return out;
	}],
	['src/scenes/dungeon/shared.ts', (head, wt) => {
		const block = lineBlock(wt, '/** Potion classes revealed run-wide this run', 'potionKindsKnown?: string[];', 'shared field');
		return insertAfter(head, '	ringTypesKnown?: string[];', block, 'shared anchor');
	}],
	['src/scenes/dungeon/deathSaveRefresh.ts', (head, wt) => {
		let out = insertAfter(head, "import { ringTypesKnownFor } from '../../simulation/ringKnow';",
			oneContaining(wt, "import { potionKindsKnownFor } from '../../items/potionKnow';", 'deathSave import'), 'deathSave import anchor');
		out = insertAfter(out, '			ringTypesKnown: [...ringTypesKnownFor(this)],',
			oneContaining(wt, 'potionKindsKnown: [...potionKindsKnownFor(this)],', 'deathSave save'), 'deathSave save anchor');
		return out;
	}],
	['src/scenes/dungeon/hero/inventoryQuickslot.ts', (head, wt) => {
		let out = insertAfter(head, "import { potionRegularCounterpart } from '../../../items/alchemy';",
			oneContaining(wt, "import { markPotionKindsKnown } from '../../../items/potionKnow';", 'iq import'), 'iq import anchor');
		const oldPair = '			say: this.say.bind(this),\n			get healingLeft() { return scene.healingLeft; },';
		// `say:` occurs several times in the worktree file - find the occurrence whose
		// `get healingLeft()` follows within a few lines (my cellVisible/mark lines sit between).
		const wtLines = wt.split('\n');
		const sayIdxs = wtLines.map((l, i) => (l === '			say: this.say.bind(this),' ? i : -1)).filter((i) => i >= 0);
		assert(sayIdxs.length >= 1, 'iq ctx: no say lines in worktree');
		let pairRange = null;
		for (const i of sayIdxs) {
			const j = wtLines.findIndex((l, k) => k > i && k <= i + 8 && l === '			get healingLeft() { return scene.healingLeft; },');
			if (j !== -1) { pairRange = [i, j]; break; }
		}
		assert(pairRange, 'iq ctx: say/get-healingLeft pair not found in worktree');
		const newPair = wtLines.slice(pairRange[0], pairRange[1] + 1).join('\n');
		assert(newPair.includes('cellVisible') && newPair.includes('markPotionKindsKnown'), 'iq ctx pair lacks my lines');
		out = replaceOnce(out, oldPair, newPair, 'iq ctx pair');
		// HEAD has `applyPotionEffect(this: DungeonScene, id: string): void {`; my mark gate
		// needs the anonymous opts channel (pinned by tools/verifyPotionKnowledge.mjs), so the
		// committed signature carries it. The worktree's downstream `effect(opts)` is NOT mine
		// (the shared dispatch is a peer's claim) - HEAD's `effect()` call stays untouched.
		const quaffBlock = lineBlock(wt, 'applyPotionEffect(this: DungeonScene, id: string, opts?',
			'if (!opts?.anonymous) markPotionKindsKnown(this, [id]);', 'iq quaff block');
		assert(quaffBlock.includes('Every Java quaff path identifies the CLASS'), 'iq quaff block lacks my comment');
		out = replaceOnce(out, '	applyPotionEffect(this: DungeonScene, id: string): void {', quaffBlock, 'iq applyPotionEffect signature');
		return out;
	}],
	['src/scenes/dungeon/hero/weaponSpellsGear.ts', (head, wt) => {
		let out = insertAfter(head, "import { markRingTypesKnown, ringTypesKnownFor, thiefsIntuitionKnownIds } from '../../../simulation/ringKnow';",
			oneContaining(wt, "import { potionKindsKnownFor } from '../../../items/potionKnow';", 'wsg import'), 'wsg import anchor');
		const oldPair = '			ringTypesKnown: ringTypesKnownFor(this),\n			armorId: this.armorId, armorInstanceId: this.armorInstanceId, armorHardened: this.armorHardened,';
		const newPair = lineBlock(wt, '			ringTypesKnown: ringTypesKnownFor(this),',
			'			armorId: this.armorId, armorInstanceId: this.armorInstanceId, armorHardened: this.armorHardened,', 'wsg ctx pair');
		assert(newPair.includes('potionKindsKnown: potionKindsKnownFor(this),'), 'wsg pair lacks my line');
		out = replaceOnce(out, oldPair, newPair, 'wsg ctx pair');
		return out;
	}],
	['src/scenes/dungeon/npcShopBlacksmith.ts', (head, wt) => {
		let out = insertAfter(head, "import { markRingTypesKnown } from '../../simulation/ringKnow';",
			oneContaining(wt, "import { markPotionKindsKnown, potionKindKnown, potionKindsKnownFor } from '../../items/potionKnow';", 'npcShop import'), 'npcShop import anchor');
		const anchor = '			markRingTypesKnown: (ids) => markRingTypesKnown(scene, ids),';
		const block = [
			oneContaining(wt, '			markPotionKindsKnown: (ids) => markPotionKindsKnown(scene, ids),', 'npcShop member 1'),
			oneContaining(wt, '			potionKindKnown: (id) => potionKindKnown(potionKindsKnownFor(scene), id),', 'npcShop member 2'),
		].join('\n');
		out = insertAfter(out, anchor, block, 'npcShop ctx anchor');
		return out;
	}],
	['src/scenes/dungeon/panelsSingleUse.ts', (head, wt) => {
		let out = insertAfter(head, "import { markRingTypesKnown } from '../../simulation/ringKnow';",
			oneContaining(wt, "import { markPotionKindsKnown } from '../../items/potionKnow';", 'panels import'), 'panels import anchor');
		out = insertAfter(out, '		markRingTypesKnown(this, s.ringTypesKnown ?? []);',
			oneContaining(wt, '		markPotionKindsKnown(this, s.potionKindsKnown ?? []);', 'panels load'), 'panels load anchor');
		const oldLine = '			markIdentified: (target) => { target.identified = true; },';
		const newBlock = lineBlock(wt, '			markIdentified: (target) => {', '			},', 'panels markIdentified');
		assert(newBlock.includes('markPotionKindsKnown(scene, [target.id])'), 'panels block lacks my line');
		out = replaceOnce(out, oldLine, newBlock, 'panels markIdentified');
		return out;
	}],
	['tools/verifyItemWorkflows.mjs', (head, wt) => {
		let out = head;
		const compileBlock = lineBlock(wt, "// R112's run-wide potion class store",
			"compile(join(root, 'src/items/potionKnow.ts'), 'items/potionKnow.js');", 'viw compile');
		out = insertAfter(out, "compile(join(root, 'src/items/alchemy.ts'), 'items/alchemy.js');", compileBlock, 'viw compile anchor');
		const storeBlock = lineBlock(wt, "// R112 `Potion`'s static `ItemStatusHandler`",
			"assert.equal(potionKindKnown(potionKnownA, 'potionInvis'), false, \"scene B's knowledge never leaks into scene A\");", 'viw store');
		out = insertAfter(out, "	const { blacksmithTurnInFavor, BLACKSMITH_FAVOR_CAP, BLACKSMITH_QUEST_BOSS_BONUS } = require('./items/blacksmith.js');",
			storeBlock, 'viw store anchor');

		// scrollReadDrive: splice inside the function only (flags + ctx members).
		const fnStart = 'function scrollReadDrive(overrides = {}) {';
		const fnEnd = 'const result = readScrollFlow(ctx, overrides.flowOpts);';
		const s = out.indexOf(fnStart);
		assert(s !== -1 && out.indexOf(fnStart, s + 1) === -1, 'viw scrollReadDrive unique');
		const e = out.indexOf(fnEnd, s);
		assert(e !== -1, 'viw scrollReadDrive end found');
		let slice = out.slice(s, e);
		const wfn = wt.indexOf(fnStart);
		assert(wfn !== -1, 'viw worktree scrollReadDrive found');
		const wend = wt.indexOf(fnEnd, wfn);
		const wslice = wt.slice(wfn, wend);

		slice = replaceOnce(slice, '		empowered: 0, weaponAffix: overrides.weaponAffix ?? null, armorGlyph: null,',
			'		empowered: 0, weaponAffix: overrides.weaponAffix ?? null, armorGlyph: null,\n		potionKnown: [],', 'viw flags');
		// HEAD already carries procIdentifyTalents/onScrollUsed; my R112 members slot in
		// right after armRecallInscription (the 3-line comment + mark + potionKindKnown).
		const ctxAnchor = '		armRecallInscription: (sourceClass) => { flags.recalled.push(sourceClass); },';
		const ctxNew = lineBlock(wslice, "readScrollFlow`'s identify branch marks the potion CLASS",
			'potionKindKnown: (id) => (overrides.potionKindsKnown ?? []).includes(id),', 'viw ctx block');
		assert(ctxNew.includes('markPotionKindsKnown') && ctxNew.includes('R112'), 'viw ctx block markers missing');
		slice = replaceOnce(slice, ctxAnchor, ctxAnchor + '\n' + ctxNew, 'viw ctx');
		out = out.slice(0, s) + slice + out.slice(e);

		const testAnchor = "	assert.ok(known.said.some((l) => l.includes('port.log.nothingunidentified')), 'saying so');";
		const testBlock = lineBlock(wt, '// R112: `Potion.isIdentified()` returns `isKnown()`',
			"'with only class-known potions left, nothing unidentified remains');", 'viw tests');
		out = insertAfter(out, testAnchor, testBlock, 'viw tests anchor');

		out = insertAfter(out, '	const smoked = [];', '	const fogMarks = [];', 'viw fog smoked');
		const fogOld = '		say: () => {},\n	};\n	createPotionEffects(fogScene).potionShrouding();';
		const fogNew = '		say: () => {},\n		cellVisible: () => true,\n		markPotionKindsKnown: (ids) => { fogMarks.push(...ids); },\n	};\n	createPotionEffects(fogScene).potionShrouding();';
		out = replaceOnce(out, fogOld, fogNew, 'viw fog scene ctx');
		const unseenBlock = lineBlock(wt, "assert.deepEqual(fogMarks, ['potionShrouding']",
			"'an unseen shatter does not identify (the heroFOV gate)');", 'viw fog unseen');
		out = insertAfter(out, "	assert.ok(smoked.some((s) => s.x === 2 && s.y === 2), 'the center seeds too');",
			unseenBlock, 'viw fog assert anchor');
		const wtWalled = oneContaining(wt, 'const walledScene = { ...fogScene', 'worktree walledScene');
		const headWalled = oneContaining(out, 'const walledScene = { ...fogScene', 'HEAD walledScene');
		assert(wtWalled.includes('markPotionKindsKnown: () => {}') && !headWalled.includes('markPotionKindsKnown'), 'walledScene delta not mine-only');
		out = out.replace(headWalled, () => wtWalled);
		return out;
	}],
]);

const expected = new Map([
	['ROADMAP.md', '1\t1'],
	['coverage/rows-items-consumables-and-crafting.md', '2\t2'],
	['package.json', '1\t1'],
	['src/items/displayName.ts', '9\t0'],
	['src/items/potionEffects.ts', '16\t2'],
	['src/items/potionKnow.ts', `${lineCount('src/items/potionKnow.ts')}\t0`],
	['src/items/scrollEffects.ts', '11\t1'],
	['src/scenes/dungeon/deathSaveRefresh.ts', '2\t0'],
	['src/scenes/dungeon/hero/inventoryQuickslot.ts', '13\t1'],
	['src/scenes/dungeon/hero/weaponSpellsGear.ts', '2\t0'],
	['src/scenes/dungeon/npcShopBlacksmith.ts', '3\t0'],
	['src/scenes/dungeon/panelsSingleUse.ts', '10\t1'],
	['src/scenes/dungeon/shared.ts', '2\t0'],
	['tools/verifyItemWorkflows.mjs', '74\t1'],
	['tools/verifyPotionKnowledge.mjs', `${lineCount('tools/verifyPotionKnowledge.mjs')}\t0`],
]);
const expectedFiles = [...expected.keys()].sort();

let committed = null;
for (let attempt = 1; attempt <= 4 && !committed; attempt++) {
	const headSha = gf(['rev-parse', 'HEAD']).trim();
	const entries = [];

	// direct files: new/untracked files whose whole content is mine
	for (const f of directFiles) {
		const inHead = spawnSync('git', ['cat-file', '-e', `HEAD:${f}`], { encoding: 'utf8' });
		assert(inHead.status !== 0, `${f}: exists at HEAD - it must be spliced, not hashed`);
		entries.push([f, gf(['hash-object', '-w', f]).trim()]);
	}

	// spliced files: HEAD text + only my hunks
	for (const [f, build] of splices) {
		const head = gf(['show', `HEAD:${f}`]);
		assert(!head.includes('\r'), `${f}: HEAD blob carries CR`);
		const wt = norm(readFileSync(f, 'utf8'));
		const text = build(head, wt);
		assert(text.includes('\r') === head.includes('\r'), `${f}: CR mismatch after splice`);
		const tmp = `${TMP}/${f.replace(/[\\/]/g, '_')}`;
		writeFileSync(tmp, text);
		entries.push([f, gf(['hash-object', '-w', `--path=${f}`, tmp]).trim()]);
	}

	const idx = `${TMP}/private.index`;
	try { rmSync(idx); } catch {}
	const env = { ...process.env, GIT_INDEX_FILE: idx };
	gf(['read-tree', 'HEAD'], { env });
	for (const [path, sha] of entries) gf(['update-index', '--add', '--cacheinfo', `100644,${sha},${path}`], { env });
	const tree = gf(['write-tree'], { env }).trim();

	const numstat = gf(['diff', '--numstat', headSha, tree])
		.split('\n').filter(Boolean).map((l) => { const [a, d, f] = l.split('\t'); return [f, `${a}\t${d}`]; });
	assert(numstat.length === expectedFiles.length,
		`tree touches ${numstat.length} files, expected ${expectedFiles.length}: ${JSON.stringify(numstat)}`);
	for (const [file, counts] of numstat) {
		assert(expected.has(file), `unexpected file in tree: ${file} (${counts})`);
		assert(expected.get(file) === counts, `${file}: counts ${counts}, expected ${expected.get(file)}`);
	}
	console.log('numstat pin ok:');
	for (const [f, c] of numstat) console.log(`  ${c.replace('\t', '/')}\t${f}`);

	if (!process.argv.includes('--commit')) { console.log('dry run only (pass --commit to land)'); break; }

	const commit = gf(['commit-tree', tree, '-p', headSha, '-m', MESSAGE]).trim();
	const ref = spawnSync('git', ['update-ref', 'HEAD', commit, headSha], { encoding: 'utf8' });
	if (ref.status === 0) { committed = commit; break; }
	console.log(`HEAD moved during attempt ${attempt}, rebuilding on the new HEAD`);
}
if (process.argv.includes('--commit') && !committed) throw new Error('could not land the commit after 4 attempts');
if (committed) console.log(`committed ${committed}`);
