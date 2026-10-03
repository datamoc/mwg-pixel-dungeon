import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Pins the DwarfKing phase-transition seam (`src/simulation/dwarfKingPhase.ts`) against
// `DwarfKing.damage()`'s branches (actors/mobs/DwarfKing.java, tag `v3.3.8`) and pins the
// scene table to the seam: `kingPhaseRules` must delegate, never carry a second copy.
const source = new URL('../src/simulation/dwarfKingPhase.ts', import.meta.url);
const output = mkdtempSync(join(tmpdir(), 'spd-king-phase-'));
writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
writeFileSync(join(output, 'dwarfKingPhase.cjs'), ts.transpileModule(readFileSync(source, 'utf8'), {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText);
const { kingPhase2Threshold, kingPhase2Entry, kingPhase3Entry, kingLosingYell } = createRequire(import.meta.url)(join(output, 'dwarfKingPhase.cjs'));

// P1->P2 threshold: HP <= 50, or 100 on STRONGER_BOSSES (DwarfKing.java: `HP <= (challenge ? 100 : 50)`).
assert.equal(kingPhase2Threshold(false), 50);
assert.equal(kingPhase2Threshold(true), 100);
assert.equal(kingPhase2Entry(1, 50, false), true);
assert.equal(kingPhase2Entry(1, 51, false), false);
assert.equal(kingPhase2Entry(1, 100, true), true);
assert.equal(kingPhase2Entry(1, 101, true), false);
assert.equal(kingPhase2Entry(2, 0, false), false, 'one-way: phase 2 never re-enters');

// P2->P3 on the drained barrier (`phase == 2 && shielding() == 0`; the port barrier floors
// at zero through the shared absorb, so `<= 0` fires on the same crossing).
assert.equal(kingPhase3Entry(2, 0), true);
assert.equal(kingPhase3Entry(2, 1), false);
assert.equal(kingPhase3Entry(1, 0), false);

// P3 losing yell under 20 HP.
assert.equal(kingLosingYell(19), true);
assert.equal(kingLosingYell(20), false);

// The scene table runs these predicates, not a second copy of the arithmetic.
const table = readFileSync(new URL('../src/scenes/dungeon/bosses/bossLogic.ts', import.meta.url), 'utf8');
for (const name of ['kingPhase2Entry', 'kingPhase2Threshold', 'kingPhase3Entry', 'kingLosingYell']) {
	assert.ok(table.includes(name), `kingPhaseRules delegates to ${name}`);
}
assert.ok(!table.includes('? 100 : 50'), 'no duplicated threshold ternary remains in the table');

// Optional live trace from the project-authored Java harness, which invokes the real v3.3.8
// DwarfKing.damage() under a small GDX launcher. Compare its post-damage HP/phase and the
// P3 one-time yell edge against these same production predicates.
if (process.argv[2]) {
	const javaFile = process.argv[2];
	assert.ok(existsSync(javaFile), `Java trace exists: ${javaFile}`);
	const lines = readFileSync(javaFile, 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
	assert.equal(lines[0].tool, 'parityDwarfKingPhase-java');
	const summary = lines.at(-1);
	assert.equal(summary.phaseTwoCases, 6);
	assert.equal(summary.phaseTwoToThreeCases, 1);
	assert.equal(summary.phaseThreeCases, 1);
	const phaseTwo = lines.filter((row) => row.kind === 'phase2');
	assert.equal(phaseTwo.length, 6);
	for (const row of phaseTwo) {
		const afterDamage = row.preHp - row.damage;
		const enters = kingPhase2Entry(1, afterDamage, row.stronger);
		assert.equal(row.phase, enters ? 2 : 1, `Java P1->P2 phase at ${row.preHp}-${row.damage}, stronger=${row.stronger}`);
		assert.equal(row.hp, enters ? kingPhase2Threshold(row.stronger) : afterDamage,
			`Java HP clamp at ${row.preHp}-${row.damage}, stronger=${row.stronger}`);
		if (enters) {
			assert.equal(row.summonsMade, 0, 'phase 2 resets summonsMade');
			assert.equal(row.shield, 400, 'phase 2 grants a full-HT barrier');
		}
	}
	const phaseThreeEntry = lines.find((row) => row.kind === 'phase3entry');
	assert.ok(phaseThreeEntry, 'Java P2->P3 trace exists');
	assert.equal(kingPhase3Entry(phaseThreeEntry.prePhase, phaseThreeEntry.preShield), true);
	assert.equal(phaseThreeEntry.prePhase, 2);
	assert.equal(phaseThreeEntry.preShield, 0);
	assert.equal(phaseThreeEntry.hp, 119);
	assert.equal(phaseThreeEntry.phase, 3);
	assert.equal(phaseThreeEntry.summonsMade, 1);
	assert.equal(phaseThreeEntry.shield, 0);
	assert.equal(phaseThreeEntry.yellCalls, 1, 'Java yells on entry to phase 3');
	assert.equal(phaseThreeEntry.bleeding, true, 'Java marks the boss health bar bleeding on phase 3 entry');
	const phaseThree = lines.find((row) => row.kind === 'phase3');
	assert.ok(phaseThree, 'Java P3 edge trace exists');
	assert.equal(phaseThree.hp, 19);
	assert.equal(phaseThree.phase, 3);
	assert.equal(kingLosingYell(phaseThree.hp), true);
	assert.equal(phaseThree.yellCalls, 1, 'Java emits the losing yell on the crossing below 20 HP');
	console.log('Java v3.3.8 DwarfKing damage trace: phase thresholds/clamps, P2->P3 transition and P3 low-HP edge match');
}

console.log('king phase seam: all checks pass');
