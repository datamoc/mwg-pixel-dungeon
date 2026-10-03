import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const out = join(root, 'tools', 'scratch', 'goo-private-files');
mkdirSync(out, { recursive: true });
writeFileSync(join(root, 'tools', 'scratch', 'goo-private-base.txt'), execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }));
const head = (path) => execFileSync('git', ['show', `HEAD:${path}`], { encoding: 'utf8' });
const replace = (text, before, after, path) => {
	if (!text.includes(before)) throw new Error(`Expected anchor missing in ${path}: ${before.slice(0, 90)}`);
	return text.replace(before, after);
};
const replaceAll = (text, before, after, path) => {
	if (!text.includes(before)) throw new Error(`Expected anchor missing in ${path}: ${before.slice(0, 90)}`);
	return text.replaceAll(before, after);
};
const save = (path, text) => {
	const target = join(out, path);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, text);
};

let runner = head('tools/parity/run-parity.mjs');
runner = replace(runner,
	' *   node tools/parity/run-parity.mjs --stage king        DwarfKing.damage() phase-2 clamp + phase-3 low-HP edge, Java v3.3.8 vs TS\n',
	' *   node tools/parity/run-parity.mjs --stage king        DwarfKing.damage() phase-2 clamp + phase-3 low-HP edge, Java v3.3.8 vs TS\n *   node tools/parity/run-parity.mjs --stage goo         Goo.doAttack() pump/enrage branches, Java v3.3.8 vs TS\n', 'run-parity');
runner = replace(runner,
	'function installHarness(dir, { combat, levelgen, loot, mobdata, ghost, imp, blacksmith, wandmaker, tengu, king }) {',
	'function installHarness(dir, { combat, levelgen, loot, mobdata, ghost, imp, blacksmith, wandmaker, tengu, king, goo }) {', 'run-parity');
runner = replace(runner,
	"\tif (king) { put('DwarfKingPhaseHarness.java', `${CORE}/actors/mobs/DwarfKingPhaseHarness.java`); put('DwarfKingPhaseHarnessLauncher.java', `${DESKTOP}/DwarfKingPhaseHarnessLauncher.java`); }\n",
	"\tif (king) { put('DwarfKingPhaseHarness.java', `${CORE}/actors/mobs/DwarfKingPhaseHarness.java`); put('DwarfKingPhaseHarnessLauncher.java', `${DESKTOP}/DwarfKingPhaseHarnessLauncher.java`); }\n\tif (goo) { put('GooPhaseHarness.java', `${CORE}/actors/mobs/GooPhaseHarness.java`); put('GooPhaseHarnessLauncher.java', `${DESKTOP}/GooPhaseHarnessLauncher.java`); }\n", 'run-parity');
runner = replace(runner,
	"\tif (king && !gradle.includes(\"'runDwarfKingPhase'\")) gradle += task('runDwarfKingPhase', 'DwarfKingPhaseHarnessLauncher');\n",
	"\tif (king && !gradle.includes(\"'runDwarfKingPhase'\")) gradle += task('runDwarfKingPhase', 'DwarfKingPhaseHarnessLauncher');\n\tif (goo && !gradle.includes(\"'runGooPhase'\")) gradle += task('runGooPhase', 'GooPhaseHarnessLauncher');\n", 'run-parity');
const gooStage = `/** B3, Goo: real v3.3.8 doAttack() pump chance/enrage/target branches vs production predicates. */
function gooStage() {
	console.log(\`\\n== goo: Java \${combatRef} Goo.doAttack() pump branches vs production TypeScript ==\`);
	const dir = join(work, \`spd-\${combatRef}\`);
	exportTree(dir, combatRef);
	installHarness(dir, { goo: true });
	const outDir = join(work, 'goo'); mkdirSync(outDir, { recursive: true });
	const javaOut = join(outDir, 'goo_phase_java_out.txt');
	rmSync(javaOut, { force: true });
	const g = gradle(dir, 'runGooPhase', { GOO_PHASE_OUT: javaOut });
	if (!existsSync(javaOut) || readFileSync(javaOut, 'utf8').trim().length === 0) { gate('Goo Java dump produced', false, g.out.slice(-2500)); return; }
	const r = run(process.execPath, [join(ROOT, 'tools', 'verifyGooPhase.mjs'), javaOut]);
	console.log(r.out.trim());
	gate('Goo actual Java pump/enrage branches match the production seam', r.status === 0, \`report: \${javaOut}\`);
}

`;
runner = replace(runner, 'function levelgenStage() {', gooStage + 'function levelgenStage() {', 'run-parity');
runner = replace(runner,
	"\tif (stage === 'all' || stage === 'king') kingStage();\n",
	"\tif (stage === 'all' || stage === 'king') kingStage();\n\tif (stage === 'all' || stage === 'goo') gooStage();\n", 'run-parity');
save('tools/parity/run-parity.mjs', runner);

let verify = head('tools/verifyGooPhase.mjs');
verify = replaceAll(verify,
	'foulBossChallenge: () => {},',
	'foulBossChallenge: () => {}, noteBossScore: () => {},', 'verifyGooPhase');
verify = replace(verify, "console.log('goo phase seam: all checks pass');", `// Optional Java runtime trace: actual Goo.doAttack() calls with fixed Java RNG seeds exercise
// the same enrage/pump predicates and challenge target used by takeGooTurn().
if (process.argv[2]) {
	const lines = readFileSync(process.argv[2], 'utf8').trim().split(/\\r?\\n/).map((line) => JSON.parse(line));
	assert.equal(lines[0].tool, 'parityGooPhase-java');
	assert.equal(lines.at(-1).cases, 64);
	const rows = lines.filter((row) => row.kind === 'pump');
	assert.equal(rows.length, 64);
	for (const row of rows) {
		const enraged = gooEnraged(row.hp, 400);
		const bound = enraged ? 2 : 5;
		assert.equal(row.bound, bound, \`Java Random.Int bound at HP \${row.hp}\`);
		assert.ok(row.roll >= 0 && row.roll < bound, \`Java roll is inside bound \${bound}\`);
		assert.equal(gooPumpChance(enraged), 1 / bound);
		const startsPump = row.roll === 0;
		assert.equal(row.pumped, startsPump ? gooPumpTarget(row.stronger) : 0,
			\`Java pump target at seed \${row.seed}, HP \${row.hp}, stronger=\${row.stronger}\`);
		assert.equal(row.attackCalls, startsPump ? 0 : 1, 'only a failed pump roll calls the attack path');
		assert.equal(row.pumpWarns, startsPump ? gooPumpTarget(row.stronger) : 0,
			'Java warns at the charge distance selected by the challenge');
		assert.equal(row.returned, startsPump, 'pump turn spends immediately; visible attack animation yields');
		assert.ok(Math.abs(row.spent - (startsPump ? (row.stronger ? 3 : 1) : 0)) < 0.001,
			'Java challenge pump uses the clamped one-to-three turn spend');
	}
	console.log('Java v3.3.8 Goo.doAttack trace: enrage, pump probability/target and challenge spend match');
}

console.log('goo phase seam: all checks pass');`, 'verifyGooPhase');
save('tools/verifyGooPhase.mjs', verify);

save('tools/parity/java/GooPhaseHarness.java', readFileSync('tools/parity/java/GooPhaseHarness.java', 'utf8'));
save('tools/parity/java/GooPhaseHarnessLauncher.java', readFileSync('tools/parity/java/GooPhaseHarnessLauncher.java', 'utf8'));

let readme = head('tools/parity/README.md');
readme = replace(readme,
	'It does not visually compare the emitter, audio, or boss-bar presentation.\n',
	`It does not visually compare the emitter, audio, or boss-bar presentation.

The \`goo\` stage invokes Java's actual \`Goo.doAttack()\` for 64 fixed-seed cases: HP 200/201 around the enrage boundary, normal and STRONGER_BOSSES, and seeds 0-15. It checks the Java \`Random.Int(2|5)\` bound/roll, resulting pump target, attack-animation call, and actor spend against \`gooBoss.ts\`. The sprite test double records animation requests and suppresses only rendering/emitter work; the stage does not compare the later pumped attack or Goo's water-heal path.
`, 'parity README');
save('tools/parity/README.md', readme);

let coverage = head('coverage/rows-monsters-bosses-and-combat.md');
coverage = replace(coverage,
	'The challenge pump applies Java\'s gated spend through the scene scheduler, mapping the unavailable actor cooldown to the hero attack cost.  **Seam (2026-09-30):**',
	'The challenge pump applies Java\'s gated spend through the scene scheduler, mapping the unavailable actor cooldown to the hero attack cost. The actual v3.3.8 `Goo.doAttack()` pump branch passes 64 fixed-seed Java cases across HP 200/201 and both challenge states via `node tools/parity/run-parity.mjs --stage goo`: Int bound/roll, normal-vs-challenge target, attack-animation branch and challenge spend match the production seam. Later pumped-attack damage and water healing are not part of this trace. **Seam (2026-09-30):**', 'coverage Goo row');
save('coverage/rows-monsters-bosses-and-combat.md', coverage);

let backlog = head('BACKLOG.md');
backlog = replace(backlog,
	'Java boss traces for Goo, DM-300 and Yog still lack runtime parity;',
	'Goo\'s actual `doAttack()` pump/enrage branch now matches the production seam for 64 Java seed cases; its later pumped-attack damage and water-heal runtime remain untraced. Java boss traces for DM-300 and Yog still lack runtime parity;', 'backlog progress');
backlog = replace(backlog,
	'Goo\'s sprite emitters, idle animations, burst effects and PixelScene shake remain presentation constraints; Goo, DM-300 and Yog still need production decision seams and Java fixtures.',
	'Goo\'s pump state transition now has a production seam and Java fixture. Its sprite emitters, idle animations, burst effects and PixelScene shake plus the later pumped attack/water-heal runtime remain outside the comparison; DM-300 and Yog still need production decision seams and Java fixtures.', 'backlog scoping');
save('BACKLOG.md', backlog);

console.log(`Prepared isolated HEAD-based files at ${out}`);
