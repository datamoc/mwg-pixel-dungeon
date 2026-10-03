import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const out = join(process.cwd(), 'tools', 'scratch', 'king-p3-private-files');
mkdirSync(out, { recursive: true });
writeFileSync(join(process.cwd(), 'tools', 'scratch', 'king-p3-base.txt'), execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }));
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

let verify = head('tools/verifyKingPhase.mjs');
verify = replace(verify, 'assert.equal(summary.phaseTwoCases, 6);\n',
	'assert.equal(summary.phaseTwoCases, 6);\n\tassert.equal(summary.phaseTwoToThreeCases, 1);\n', 'verifyKingPhase');
verify = replace(verify, `	const phaseThree = lines.find((row) => row.kind === 'phase3');`, `	const phaseThreeEntry = lines.find((row) => row.kind === 'phase3entry');
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
	const phaseThree = lines.find((row) => row.kind === 'phase3');`, 'verifyKingPhase');
verify = replace(verify, "phaseThree.losingYells, 1", "phaseThree.yellCalls, 1", 'verifyKingPhase');
verify = replace(verify,
	"'Java emits the losing yell on the crossing below 20 HP');\n\tconsole.log('Java v3.3.8 DwarfKing damage trace: phase thresholds/clamps and P3 low-HP edge match');",
	"'Java emits the losing yell on the crossing below 20 HP');\n\tconsole.log('Java v3.3.8 DwarfKing damage trace: phase thresholds/clamps, P2->P3 transition and P3 low-HP edge match');", 'verifyKingPhase');
save('tools/verifyKingPhase.mjs', verify);

save('tools/parity/java/DwarfKingPhaseHarness.java', readFileSync('tools/parity/java/DwarfKingPhaseHarness.java', 'utf8'));

let readme = head('tools/parity/README.md');
readme = replace(readme,
`The \`king\` stage calls Java's actual \`DwarfKing.damage()\` for six phase-2 threshold/clamp cases
(normal and STRONGER_BOSSES) and one phase-3 crossing below 20 HP through Java's own
\`Viscosity.DeferedDamage\`. It compares HP, phase, summon counter, full-HT barrier and the losing
yell against \`dwarfKingPhase.ts\`. The launcher supplies a real \`MobSprite\` in a \`Group\`; the test
double suppresses only camera placement and counts the yell. The phase-2-to-phase-3 presentation
branch is not exercised by this stage.`,
`The \`king\` stage calls Java's actual \`DwarfKing.damage()\` for six phase-2 threshold/clamp cases
(normal and STRONGER_BOSSES), one phase-2-to-phase-3 crossing using Java's permitted
\`KingDamager\` source, and one phase-3 crossing below 20 HP through Java's own
\`Viscosity.DeferedDamage\`. It compares HP, phase, summon counters, full-HT barrier, transition yell,
and the boss-bar bleeding flag against \`dwarfKingPhase.ts\` across eight live cases. The launcher
supplies a real \`MobSprite\` in a \`Group\`; the test double replaces camera placement and provides
emitters/yell counting. It does not visually compare the emitter, audio, or boss-bar presentation.`, 'parity README');
save('tools/parity/README.md', readme);

let coverage = head('coverage/rows-monsters-bosses-and-combat.md');
coverage = replace(coverage,
	'`node tools/parity/run-parity.mjs --stage king` compares seven live Java cases to `dwarfKingPhase.ts`; P2-to-P3 presentation remains outside that harness.',
	'`node tools/parity/run-parity.mjs --stage king` compares eight live Java cases to `dwarfKingPhase.ts`: P1 threshold/clamp in normal and STRONGER_BOSSES, P2-to-P3 at zero shield using Java’s permitted `KingDamager` source (including summonsMade=1 and boss-bar bleeding), and the P3 crossing below 20 HP. The emitter/audio visuals are not compared.', 'coverage act row');
coverage = replace(coverage,
	'The Java-side sprite-harness comparison stays open in BACKLOG B3.',
	'Actual v3.3.8 `DwarfKing.damage()` was traced for eight cases by `--stage king`: six P1 threshold/clamp boundaries, the P2-to-P3 zero-shield transition through the permitted `KingDamager` source (phase 3, summonsMade=1, yell and BossHealthBar bleeding), and the P3 crossing below 20 HP via `Viscosity.DeferedDamage`. Java emits/audio and the boss-bar visual are outside the comparison.', 'coverage phase row');
save('coverage/rows-monsters-bosses-and-combat.md', coverage);

let backlog = head('BACKLOG.md');
backlog = replace(backlog,
	'Dwarf King damage trace (2026-10-02): six actual Java phase-2 threshold/clamp cases (normal and STRONGER_BOSSES) and one phase-3 crossing below 20 HP match the production seam, including HP, phase, summon reset, full-HT barrier and losing yell, via `node tools/parity/run-parity.mjs --stage king`. Its phase-2-to-phase-3 presentation branch remains untraced. Remaining:',
	'Dwarf King damage trace (2026-10-02): eight actual Java cases match the production seam via `node tools/parity/run-parity.mjs --stage king`: six P1 threshold/clamps, P2-to-P3 using Java’s permitted `KingDamager` source (phase, HP, summonsMade=1, transition yell and BossHealthBar bleeding), and the P3 crossing below 20 HP through `Viscosity.DeferedDamage`. The emitter/audio/boss-bar visuals are not compared. Remaining:', 'backlog progress');
backlog = replace(backlog,
	'Remaining Java presentation constraints include the Dwarf King\'s phase-2-to-phase-3 emitter/audio/BossHealthBar/render-thread branch and Goo\'s sprite emitters, idle animations, burst effects and PixelScene shake. Full Tengu arena progression also remains open. Goo, DM-300 and Yog still need production decision seams and Java fixtures that stub only their presentation boundaries.',
	'The Dwarf King\'s phase-2-to-phase-3 state transition is now traced, while its emitter/audio/boss-bar visuals are not compared. Goo\'s sprite emitters, idle animations, burst effects and PixelScene shake remain presentation constraints; Goo, DM-300 and Yog still need production decision seams and Java fixtures. Full Tengu arena progression also remains open.', 'backlog scope');
save('BACKLOG.md', backlog);

console.log(`Prepared isolated HEAD-based files at ${out}`);
