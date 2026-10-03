import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const out = join(process.cwd(), 'tools', 'scratch', 'king-private-files');
mkdirSync(out, { recursive: true });
const head = (path) => execFileSync('git', ['show', `HEAD:${path}`], { encoding: 'utf8' });
const replace = (text, before, after, path) => {
	if (!text.includes(before)) throw new Error(`Expected anchor missing in ${path}: ${before.slice(0, 80)}`);
	return text.replace(before, after);
};
const save = (path, text) => {
	const target = join(out, path);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, text);
};

let run = head('tools/parity/run-parity.mjs');
run = replace(run,
	' *   node tools/parity/run-parity.mjs --stage tengu       Tengu.damage() bracket clamp, deferred jump + phase-1 edge, Java v3.3.8 vs TS\n',
	' *   node tools/parity/run-parity.mjs --stage tengu       Tengu.damage() bracket clamp, deferred jump + phase-1 edge, Java v3.3.8 vs TS\n *   node tools/parity/run-parity.mjs --stage king        DwarfKing.damage() phase-2 clamp + phase-3 low-HP edge, Java v3.3.8 vs TS\n', 'run-parity');
run = replace(run,
	'function installHarness(dir, { combat, levelgen, loot, mobdata, ghost, imp, blacksmith, wandmaker, tengu }) {',
	'function installHarness(dir, { combat, levelgen, loot, mobdata, ghost, imp, blacksmith, wandmaker, tengu, king }) {', 'run-parity');
run = replace(run,
	"\tif (tengu) { put('TenguDamageHarness.java', `${CORE}/actors/mobs/TenguDamageHarness.java`); put('TenguDamageHarnessLauncher.java', `${DESKTOP}/TenguDamageHarnessLauncher.java`); }\n",
	"\tif (tengu) { put('TenguDamageHarness.java', `${CORE}/actors/mobs/TenguDamageHarness.java`); put('TenguDamageHarnessLauncher.java', `${DESKTOP}/TenguDamageHarnessLauncher.java`); }\n\tif (king) { put('DwarfKingPhaseHarness.java', `${CORE}/actors/mobs/DwarfKingPhaseHarness.java`); put('DwarfKingPhaseHarnessLauncher.java', `${DESKTOP}/DwarfKingPhaseHarnessLauncher.java`); }\n", 'run-parity');
run = replace(run,
	"\tif (tengu && !gradle.includes(\"'runTenguDamage'\")) gradle += task('runTenguDamage', 'TenguDamageHarnessLauncher');\n",
	"\tif (tengu && !gradle.includes(\"'runTenguDamage'\")) gradle += task('runTenguDamage', 'TenguDamageHarnessLauncher');\n\tif (king && !gradle.includes(\"'runDwarfKingPhase'\")) gradle += task('runDwarfKingPhase', 'DwarfKingPhaseHarnessLauncher');\n", 'run-parity');
const kingStage = `/** B3, Dwarf King: actual v3.3.8 phase-2 HP clamp (including STRONGER_BOSSES) and phase-3 low-HP edge. */
function kingStage() {
	console.log(\`\\n== king: Java \${combatRef} DwarfKing.damage() phase branches vs production TypeScript ==\`);
	const dir = join(work, \`spd-\${combatRef}\`);
	exportTree(dir, combatRef);
	installHarness(dir, { king: true });
	const outDir = join(work, 'king'); mkdirSync(outDir, { recursive: true });
	const javaOut = join(outDir, 'dwarf_king_phase_java_out.txt');
	rmSync(javaOut, { force: true });
	const g = gradle(dir, 'runDwarfKingPhase', { DWARF_KING_PHASE_OUT: javaOut });
	if (!existsSync(javaOut) || readFileSync(javaOut, 'utf8').trim().length === 0) { gate('Dwarf King Java dump produced', false, g.out.slice(-2500)); return; }
	const r = run(process.execPath, [join(ROOT, 'tools', 'verifyKingPhase.mjs'), javaOut]);
	console.log(r.out.trim());
	gate('Dwarf King Java phase-2 clamps and phase-3 low-HP edge match the production seam', r.status === 0, \`report: \${javaOut}\`);
}

`;
run = replace(run, 'function levelgenStage() {', kingStage + 'function levelgenStage() {', 'run-parity');
run = replace(run,
	"\tif (stage === 'all' || stage === 'tengu') tenguStage();\n",
	"\tif (stage === 'all' || stage === 'tengu') tenguStage();\n\tif (stage === 'all' || stage === 'king') kingStage();\n", 'run-parity');
save('tools/parity/run-parity.mjs', run);

let verify = head('tools/verifyKingPhase.mjs');
verify = replace(verify, "import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';", "import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';", 'verifyKingPhase');
verify = replace(verify, "console.log('king phase seam: all checks pass');", `// Optional live trace from the project-authored Java harness, invoking the real v3.3.8
// DwarfKing.damage() under a small GDX launcher and checking the same production predicates.
if (process.argv[2]) {
	const javaFile = process.argv[2];
	assert.ok(existsSync(javaFile), \`Java trace exists: \${javaFile}\`);
	const lines = readFileSync(javaFile, 'utf8').trim().split(/\\r?\\n/).map((line) => JSON.parse(line));
	assert.equal(lines[0].tool, 'parityDwarfKingPhase-java');
	const summary = lines.at(-1);
	assert.equal(summary.phaseTwoCases, 6);
	assert.equal(summary.phaseThreeCases, 1);
	const phaseTwo = lines.filter((row) => row.kind === 'phase2');
	assert.equal(phaseTwo.length, 6);
	for (const row of phaseTwo) {
		const afterDamage = row.preHp - row.damage;
		const enters = kingPhase2Entry(1, afterDamage, row.stronger);
		assert.equal(row.phase, enters ? 2 : 1, \`Java P1->P2 phase at \${row.preHp}-\${row.damage}, stronger=\${row.stronger}\`);
		assert.equal(row.hp, enters ? kingPhase2Threshold(row.stronger) : afterDamage,
			\`Java HP clamp at \${row.preHp}-\${row.damage}, stronger=\${row.stronger}\`);
		if (enters) {
			assert.equal(row.summonsMade, 0, 'phase 2 resets summonsMade');
			assert.equal(row.shield, 400, 'phase 2 grants a full-HT barrier');
		}
	}
	const phaseThree = lines.find((row) => row.kind === 'phase3');
	assert.ok(phaseThree, 'Java P3 edge trace exists');
	assert.equal(phaseThree.hp, 19);
	assert.equal(phaseThree.phase, 3);
	assert.equal(kingLosingYell(phaseThree.hp), true);
	assert.equal(phaseThree.losingYells, 1, 'Java emits the losing yell on the crossing below 20 HP');
	console.log('Java v3.3.8 DwarfKing damage trace: phase thresholds/clamps and P3 low-HP edge match');
}

console.log('king phase seam: all checks pass');`, 'verifyKingPhase');
save('tools/verifyKingPhase.mjs', verify);

let readme = head('tools/parity/README.md');
readme = replace(readme,
	'override\'s `progress()` call and switches to FIGHT_PAUSE; it does not run arena map/layout presentation.\n',
	'override\'s `progress()` call and switches to FIGHT_PAUSE; it does not run arena map/layout presentation.\n\nThe `king` stage calls Java\'s actual `DwarfKing.damage()` for six phase-2 threshold/clamp cases\n(normal and STRONGER_BOSSES) and one phase-3 crossing below 20 HP through Java\'s own\n`Viscosity.DeferedDamage`. It compares HP, phase, summon counter, full-HT barrier and the losing\nyell against `dwarfKingPhase.ts`. The launcher supplies a real `MobSprite` in a `Group`; the test\ndouble suppresses only camera placement and counts the yell. The phase-2-to-phase-3 presentation\nbranch is not exercised by this stage.\n', 'parity README');
save('tools/parity/README.md', readme);

let coverage = head('coverage/rows-monsters-bosses-and-combat.md');
coverage = replace(coverage,
	"with Java's own yell gates, counters, and 3-turn/1-turn spend pacing. Simplified:",
	"with Java's own yell gates, counters, and 3-turn/1-turn spend pacing. The damage phase seam is also verified: `DwarfKing.damage()` clamps P1 HP to 50 (100 with STRONGER_BOSSES), enters phase 2, resets summonsMade, and grants a full-HT barrier; the phase-3 crossing below 20 HP triggers the losing yell. `node tools/parity/run-parity.mjs --stage king` compares seven live Java cases to `dwarfKingPhase.ts`; P2-to-P3 presentation remains outside that harness. Simplified:", 'coverage');
save('coverage/rows-monsters-bosses-and-combat.md', coverage);

let backlog = head('BACKLOG.md');
backlog = replace(backlog,
	"full Tengu arena progression remains open. Remaining: Java boss traces for Goo, DM-300, Dwarf King and Yog still lack runtime parity; Tengu arena progression is untraced; the Imp confirmation-window UI flow remains simplified.",
	"full Tengu arena progression remains open. Dwarf King damage trace (2026-10-02): six actual Java phase-2 threshold/clamp cases (normal and STRONGER_BOSSES) and one phase-3 crossing below 20 HP match the production seam, including HP, phase, summon reset, full-HT barrier and losing yell, via `node tools/parity/run-parity.mjs --stage king`. Its phase-2-to-phase-3 presentation branch remains untraced. Remaining: Java boss traces for Goo, DM-300 and Yog still lack runtime parity; Tengu arena progression is untraced; the Imp confirmation-window UI flow remains simplified.", 'backlog progress');
const scopeStart = backlog.indexOf('  - **Scoping note for the boss-transitions domain (2026-09-27, read before starting it):**');
const scopeEnd = backlog.indexOf('  - **Scoping for the remaining quest halves', scopeStart);
if (scopeStart < 0 || scopeEnd < 0) throw new Error('Boss scoping block missing in HEAD backlog');
backlog = backlog.slice(0, scopeStart) + `  - **Scoping note for remaining boss-transition gaps (updated 2026-10-02):** the original blanket claim that both sides were blocked for node-only parity is retired. Java GDX launchers with real sprites in a Group support live traces: Tengu phase-1 and Dwarf King phase-2 threshold/phase-3 low-HP behavior now have extracted TypeScript decision seams and passing Java stages. Remaining Java presentation constraints include the Dwarf King's phase-2-to-phase-3 emitter/audio/BossHealthBar/render-thread branch and Goo's sprite emitters, idle animations, burst effects and PixelScene shake. Full Tengu arena progression also remains open. Goo, DM-300 and Yog still need production decision seams and Java fixtures that stub only their presentation boundaries.\n` + backlog.slice(scopeEnd);
save('BACKLOG.md', backlog);

for (const path of ['tools/parity/java/DwarfKingPhaseHarness.java', 'tools/parity/java/DwarfKingPhaseHarnessLauncher.java']) {
	save(path, readFileSync(path, 'utf8'));
}
console.log(`Prepared isolated HEAD-based files at ${out}`);
