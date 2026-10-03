#!/usr/bin/env node
/**
 * S6 oracle backport (BACKLOG B3 tripwire): applies the port's v3.3.8 Generator deck
 * mechanics to an EXPORTED checkout-oracle tree (never the checkout itself), so
 * `--stage levelgen` compares like with like: checkout rooms + v3.3.8 decks.
 *
 * What it changes (draw-sequence only; thresholds/weights/outcomes untouched):
 *   Generator.java: deck-mechanic fields, TRINKET enum entry (superClass Item, same
 *     package, no import), potion/scroll deck-1 + second-deck tables (values read from
 *     the port's own src/content/decks.mwl at runtime), TRINKET static block (17 x
 *     Item.class - the 0-weight category is never rolled, only its deck-seed Long
 *     matters), defaultProbsTotal loop, fullReset Int(2), reset() toggle,
 *     randomUsingDefaults Total branch.
 *   Weapon.java / Armor.java: Long-seeded substream around the effect rolls only
 *     (level rolls stay on the caller stream), mirroring the port's generator.ts.
 *   MissileWeapon.java (blacksmith slice): the whole oracle-era `random()` stack-size
 *     body is replaced with the v3.3.8 level + Long-seeded effect-substream shape
 *     (flat bare-hero thresholds - the oracle tree has no ParchmentScrap, and neither
 *     does any harness hero). Without it every oracle missile burns the wrong draws and
 *     desyncs the stream past it.
 * Deliberately NOT touched: ARTIFACT table (port already matches oracle there),
 *   bundle persistence (harness never saves), undoDrop (draw-free), the exotic-swap
 *   Float branch (dead in practice - potions/scrolls always take the Total path).
 *
 * Provenance: table NUMBERS come from the port's MWL (in-repo data); the few inserted
 * Java lines are authored here for the draw sequence they must produce. No SPD source
 * text is stored in this repo - run getTables() against the worktree, not memory.
 *
 * Usage: node tools/parity/patchOracleDecks.mjs <oracleDir> [--mwl <decks.mwl>]
 * Every anchor must hit exactly once or the script aborts without writing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const root = (p) => p.split('/').join(sep);
const arg = (n, f) => { const i = process.argv.indexOf(n); return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : f; };
const dir = resolve(process.argv[2] ?? (() => { throw new Error('usage: patchOracleDecks.mjs <oracleDir> [--mwl <decks.mwl>]'); })());
const mwlPath = resolve(arg('--mwl', join(ROOT, 'src', 'content', 'decks.mwl')));

const GEN = 'core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/Generator.java';
const WEP = 'core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/weapon/Weapon.java';
const ARM = 'core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/armor/Armor.java';
const MIS = 'core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/weapon/missiles/MissileWeapon.java';

/** Deck tables, parsed from the port's own MWL (never hardcoded from Java). */
function getTables() {
	const mwl = readFileSync(mwlPath, 'utf8');
	const deck = (id, effect) => {
		const re = new RegExp(`id:\\s*"${id}"[\\s\\S]{0,2000}?apply_to:\\s*"${effect}"[\\s\\S]{0,400}?set:\\s*"([^"]+)"`);
		const m = mwl.match(re);
		if (!m) throw new Error(`MWL ${id}/${effect} not found in ${mwlPath}`);
		const nums = m[1].split(',').map((s) => Number(s.trim()));
		if (nums.length !== 12 || nums.some((n) => !Number.isFinite(n))) throw new Error(`MWL ${id}/${effect} bad data`);
		return `{ ${nums.join(', ')} }`;
	};
	const count = (id) => {
		const re = new RegExp(`id:\\s*"${id}"[\\s\\S]{0,4000}?apply_to:\\s*"classes"[\\s\\S]{0,400}?set:\\s*"([^"]+)"`);
		const m = mwl.match(re);
		if (!m) throw new Error(`MWL ${id}/classes not found`);
		return m[1].split(',').length;
	};
	return {
		potion1: deck('potionDeck', 'default_probs'),
		potion2: deck('potionDeck', 'second_probs'),
		scroll1: deck('scrollDeck', 'default_probs'),
		scroll2: deck('scrollDeck', 'second_probs'),
		trinketN: count('trinketDeck'),
	};
}

const edits = [];
function edit(file, anchor, replacement, { count = 1, mode = 'after', label = '' } = {}) {
	edits.push({ file, anchor, replacement, count, mode, label: label || anchor.slice(0, 60) });
}

const MIS_MARKER = 'v3.3.8 missile draw sequence (oracle backport)';

function applyAll() {
	const genPath = join(dir, root(GEN));
	const genDone = readFileSync(genPath, 'utf8').includes('defaultProbs2 = null');
	const misDone = readFileSync(join(dir, root(MIS)), 'utf8').includes(MIS_MARKER);
	if (genDone && misDone) {
		console.log('already patched, skipping');
		return getTables();
	}
	for (const e of edits) e.skip = e.file === MIS ? misDone : genDone;
	const T = getTables();
	const trinketClasses = `new Class<?>[]{ ${new Array(T.trinketN).fill('Item.class').join(', ')} }`;
	const files = {};
	// Exported trees may carry CRLF; normalize (scratch build input only, javac-indifferent).
	for (const { file } of edits) if (!files[file]) files[file] = readFileSync(join(dir, root(file)), 'utf8').replace(/\r\n/g, '\n');

	for (const { file, anchor, replacement, count, mode, label, skip } of edits) {
		if (skip) continue;
		let text = files[file];
		const hits = text.split(anchor).length - 1;
		if (hits !== count) throw new Error(`${file} [${label}]: anchor hit ${hits}x, want ${count}x - tree shape changed, aborting`);
		files[file] = mode === 'replace'
			? text.split(anchor).join(replacement)
			: text.replace(anchor, mode === 'after' ? anchor + replacement : replacement + anchor);
		console.log(`ok ${file.split('/').pop()} [${label}]`);
	}
	for (const [file, text] of Object.entries(files)) writeFileSync(join(dir, root(file)), text);

	// Export the resolved tables for the report (proves MWL sourcing, no stored Java).
	console.log(`tables potion1=${T.potion1} potion2=${T.potion2}`);
	console.log(`tables scroll1=${T.scroll1} scroll2=${T.scroll2} trinketN=${T.trinketN}`);
	return T;
}

// ---- Generator.java ----
const P1 = 'POTION.defaultProbs = new float[]{ 0, 6, 4, 3, 3, 3, 2, 2, 2, 2, 2, 1 };';
const S1 = 'SCROLL.defaultProbs = new float[]{ 0, 6, 4, 3, 3, 3, 2, 2, 2, 2, 2, 1 };';
function buildEdits() {
	const T = getTables();
	const trinketClasses = `new Class<?>[]{ ${new Array(T.trinketN).fill('Item.class').join(', ')} }`;
	edit(GEN, '\t\tpublic float[] defaultProbs = null;',
		'\n\n\t\t//some items types have two decks and swap between them (S6 oracle backport)\n' +
		'\t\tpublic float[] defaultProbs2 = null;\n' +
		'\t\tpublic boolean using2ndProbs = false;\n' +
		'\t\tpublic float[] defaultProbsTotal = null;', { label: 'deck fields' });
	edit(GEN, '\tpublic enum Category {',
		'\n\t\tTRINKET ( 0, 0, Item.class ), //S6: 0-weight slot only (deck-seed Long); classes never rolled',
		{ label: 'TRINKET enum' });
	edit(GEN, P1,
		`POTION.defaultProbs  = new float[]${T.potion1};\n` +
		`\t\t\tPOTION.defaultProbs2 = new float[]${T.potion2};`,
		{ mode: 'replace', label: 'potion decks' });
	edit(GEN, S1,
		`SCROLL.defaultProbs  = new float[]${T.scroll1};\n` +
		`\t\t\tSCROLL.defaultProbs2 = new float[]${T.scroll2};`,
		{ mode: 'replace', label: 'scroll decks' });
	edit(GEN, 'ARTIFACT.probs = ARTIFACT.defaultProbs.clone();',
		'\n\n\t\t\t//S6: TRINKET slot (draws only; Item stubs, never rolled)\n' +
		`\t\t\tTRINKET.classes = ${trinketClasses};\n` +
		`\t\t\tTRINKET.defaultProbs = new float[]{ ${new Array(T.trinketN).fill(1).join(', ')} };\n` +
		'\t\t\tTRINKET.probs = TRINKET.defaultProbs.clone();\n' +
		'\n\t\t\tfor (Category cat : Category.values()){\n' +
		'\t\t\t\tif (cat.defaultProbs2 != null){\n' +
		'\t\t\t\t\tcat.defaultProbsTotal = new float[cat.defaultProbs.length];\n' +
		'\t\t\t\t\tfor (int i = 0; i < cat.defaultProbs.length; i++){\n' +
		'\t\t\t\t\t\tcat.defaultProbsTotal[i] = cat.defaultProbs[i] + cat.defaultProbs2[i];\n' +
		'\t\t\t\t\t}\n' +
		'\t\t\t\t}\n' +
		'\t\t\t}',
		{ label: 'TRINKET block + Totals' });
	edit(GEN, '\t\tgeneralReset();\n\t\tfor (Category cat : Category.values()) {\n\t\t\treset(cat);',
		'\t\tgeneralReset();\n\t\tfor (Category cat : Category.values()) {\n' +
		'\t\t\tcat.using2ndProbs =  cat.defaultProbs2 != null && Random.Int(2) == 0;\n' +
		'\t\t\treset(cat);',
		{ label: 'fullReset Int(2)', mode: 'replace' });
	edit(GEN, '\t\tif (cat.defaultProbs != null) cat.probs = cat.defaultProbs.clone();',
		'\t\tif (cat.defaultProbs != null) {\n' +
		'\t\t\tif (cat.defaultProbs2 != null){\n' +
		'\t\t\t\tcat.using2ndProbs = !cat.using2ndProbs;\n' +
		'\t\t\t\tcat.probs = cat.using2ndProbs ? cat.defaultProbs2.clone() : cat.defaultProbs.clone();\n' +
		'\t\t\t} else {\n' +
		'\t\t\t\tcat.probs = cat.defaultProbs.clone();\n' +
		'\t\t\t}\n' +
		'\t\t}',
		{ mode: 'replace', label: 'reset() toggle' });
	edit(GEN, '\t\t} else {\n\t\t\treturn ((Item) Reflection.newInstance(cat.classes[Random.chances(cat.defaultProbs)])).random();',
		'\t\t} else if (cat.defaultProbsTotal != null){\n' +
		'\t\t\treturn ((Item) Reflection.newInstance(cat.classes[Random.chances(cat.defaultProbsTotal)])).random();\n' +
		'\t\t} else {\n' +
		'\t\t\treturn ((Item) Reflection.newInstance(cat.classes[Random.chances(cat.defaultProbs)])).random();',
		{ mode: 'replace', label: 'Total branch' });
	// ---- Weapon.java / Armor.java: substream around effect rolls only ----
	edit(WEP, '\t\tfloat effectRoll = Random.Float();',
		'\t\tRandom.pushGenerator(Random.Long());\n', { mode: 'before', label: 'weapon push' });
	edit(WEP, '\t\t\tenchant();\n\t\t}',
		'\n\t\tRandom.popGenerator();', { label: 'weapon pop' });
	edit(ARM, '\t\tfloat effectRoll = Random.Float();',
		'\t\tRandom.pushGenerator(Random.Long());\n', { mode: 'before', label: 'armor push' });
	edit(ARM, '\t\t\tinscribe();\n\t\t}',
		'\n\t\tRandom.popGenerator();', { label: 'armor pop' });
	// ---- MissileWeapon.java: full v3.3.8 body (the oracle-era stack roll shares nothing) ----
	edit(MIS, '\tpublic Item random() {\n\t\tif (!stackable) return this;\n\t\t\n\t\t//2: 66.67% (2/3)\n\t\t//3: 26.67% (4/15)\n\t\t//4: 6.67%  (1/15)\n\t\tquantity = 2;\n\t\tif (Random.Int(3) == 0) {\n\t\t\tquantity++;\n\t\t\tif (Random.Int(5) == 0) {\n\t\t\t\tquantity++;\n\t\t\t}\n\t\t}\n\t\treturn this;\n\t}\n', '\tpublic Item random() {\n\t\t//+0: 75% (3/4)\n\t\t//+1: 20% (4/20)\n\t\t//+2: 5%  (1/20)\n\t\tint n = 0;\n\t\tif (Random.Int(4) == 0) {\n\t\t\tn++;\n\t\t\tif (Random.Int(5) == 0) {\n\t\t\t\tn++;\n\t\t\t}\n\t\t}\n\t\tlevel(n);\n\n\t\t//v3.3.8 missile draw sequence (oracle backport): level rolls stay on the caller\n\t\t//stream, effect rolls on a Long-seeded substream, flat bare-hero thresholds\n\t\t//(the oracle tree has no ParchmentScrap; no harness hero carries one either).\n\t\tRandom.pushGenerator(Random.Long());\n\n\t\t//30% chance to be cursed\n\t\t//10% chance to be enchanted\n\t\tfloat effectRoll = Random.Float();\n\t\tif (effectRoll < 0.3f) {\n\t\t\tenchant(Enchantment.randomCurse());\n\t\t\tcursed = true;\n\t\t} else if (effectRoll >= 0.9f){\n\t\t\tenchant();\n\t\t}\n\n\t\tRandom.popGenerator();\n\n\t\treturn this;\n\t}\n', { mode: 'replace', label: 'missile v3.3.8 body' });
}

function run() {
	buildEdits();
	return applyAll();
}

run();
