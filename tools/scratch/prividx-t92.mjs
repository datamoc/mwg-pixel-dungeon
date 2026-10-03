// T92: commit ONLY this session's hunks through a private index.
// Blob = HEAD + my hunks (never the worktree), so peers' 70 staged files and their
// unstaged hunks inside these same files are left exactly as they are.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const git = (args, env = {}) =>
	execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, ...env } }).replace(/\r\n/g, '\n');

const worktree = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const head = (p) => git(['show', `HEAD:${p}`]);

// ---- my hunks, applied to HEAD ----
const edits = [];
const add = (path, from, to) => edits.push({ path, from, to });

add('src/scenes/dungeonScene.ts',
	`\t/** \`DirectedPowerTracker.enchBoost\`: the ElementalStrike tracker's pending proc bonus. */\n\tabilityDirectedBonus = 0;\n`,
	`\t/** \`DirectedPowerTracker.enchBoost\`: the ElementalStrike tracker's pending proc bonus. */\n\tabilityDirectedBonus = 0;\n\t/** \`Talent.StrikingWaveTracker\` (duration 0): the rank-4 \`STRIKING_WAVE\` leg of\n\t * \`genericProcChanceMultiplier()\`, \`+0.2f\` on Shockwave's own enchant procs. */\n\tabilityStrikingWaveBonus = 0;\n`);

add('src/scenes/dungeon/combatResolution.ts',
	`\t\t//Java's one-shot trackers are separate buffs that SUM at the next proc\n\t\t//roll (\`RunicSlashTracker.boost + DirectedPowerTracker.enchBoost + ...\`),\n\t\t//so the two slots add rather than overwrite - and both zero together,\n\t\t//matching the shared detach inside \`genericProcChanceMultiplier\`.\n\t\tconst bonus = this.abilityRunicBonus + this.abilityDirectedBonus;\n`,
	`\t\t//Java's one-shot trackers are separate buffs that SUM at the next proc\n\t\t//roll (\`RunicSlashTracker.boost + DirectedPowerTracker.enchBoost + ...\`),\n\t\t//so the slots add rather than overwrite - and Runic/Directed both zero\n\t\t//together, matching the shared detach inside \`genericProcChanceMultiplier\`.\n\t\t//\`StrikingWaveTracker\` (rank-4 STRIKING_WAVE) is summed but deliberately\n\t\t//NOT zeroed: Java never detaches it inside \`genericProcChanceMultiplier\`\n\t\t//- its duration-0 life simply runs out - so \`activateShockwave\` owns the\n\t\t//clear, at the point the hero could next act.\n\t\tconst bonus = this.abilityRunicBonus + this.abilityDirectedBonus + this.abilityStrikingWaveBonus;\n`);

add('src/scenes/dungeon/combatResolution.ts',
	`\t * reads all go through this without detaching the one-shot ability trackers.\n\t * The remaining tracker terms need unmodeled systems (Smite's +3, the Cleric\n\t * spell that arms it) or are recorded residuals (SpiritBlades +0.1 and\n\t * StrikingWave +0.2 at rank 4 - no tracker state for a tenth of proc chance). */\n`,
	`\t * reads all go through this without detaching the one-shot ability trackers.\n\t * The remaining tracker terms need unmodeled systems (Smite's +3, the Cleric\n\t * spell that arms it) or stay recorded residuals (SpiritBlades +0.1, whose own\n\t * rank-4 roll consumes it inside \`onAttackProc\` before this ever runs);\n\t * StrikingWave +0.2 at rank 4 now rides \`enchantProcMultiplier\` instead. */\n`);

add('src/scenes/dungeon/hero/armorAbilityUse.ts',
	`\t\t\tif (!caught || caught === this.hero || caught.isAlly || caught.isNPC || caught.hp <= 0) continue;\n`,
	`\t\t\tif (!caught || caught === this.hero || caught.isAlly || caught.isNPC || caught.hp <= 0) continue;\n\t\t\t//\`Shockwave.java\` 121-123: at STRIKING_WAVE rank 4 every caught char plants a\n\t\t\t//duration-0 \`StrikingWaveTracker\`, which \`genericProcChanceMultiplier()\` reads as\n\t\t\t//\`+0.2f\` - so this cone's own enchant procs roll 0.2 hotter. Java never detaches it\n\t\t\t//there; its life simply runs out, i.e. after this loop (cleared below).\n\t\t\tif (strikingWave === 4) this.abilityStrikingWaveBonus = 0.2;\n`);

add('src/scenes/dungeon/hero/armorAbilityUse.ts',
	`\t\t\tif (caught.hp > 0) {\n\t\t\t\tif (shockForceParalyses(shockForce, Random.int(0, 4))) addBuff(caught, 'paralysis', 5);\n\t\t\t\telse addBuff(caught, 'cripple', 5);\n\t\t\t}\n\t\t}\n\t\tthis.shakeScreen(2, 0.5);\n`,
	`\t\t\tif (caught.hp > 0) {\n\t\t\t\tif (shockForceParalyses(shockForce, Random.int(0, 4))) addBuff(caught, 'paralysis', 5);\n\t\t\t\telse addBuff(caught, 'cripple', 5);\n\t\t\t}\n\t\t}\n\t\t//The duration-0 \`StrikingWaveTracker\` from above is spent by the time the hero could act\n\t\t//again, so it must not leak into the next ordinary swing's enchant roll.\n\t\tthis.abilityStrikingWaveBonus = 0;\n\t\tthis.shakeScreen(2, 0.5);\n`);

add('tools/file-budgets.json', `"src/scenes/dungeonScene.ts": 2568,`, `"src/scenes/dungeonScene.ts": 2571,`);
add('tools/file-budgets.json', `"src/scenes/dungeon/hero/armorAbilityUse.ts": 2100`, `"src/scenes/dungeon/hero/armorAbilityUse.ts": 2108`);

// ---- doc hunks: lifted verbatim out of MY worktree additions, re-anchored on HEAD ----
const pc = worktree('PORT_COVERAGE.md').split('\n');
const myRows = pc.filter((l) => l.startsWith('| `Shockwave.activate()`\'s `STRIKING_WAVE`')
	|| l.startsWith('| Shockwave\'s and Heroic Leap\'s target gates'));
if (myRows.length !== 2) { console.log(`ABORT: expected 2 PORT_COVERAGE rows, found ${myRows.length}`); process.exit(2); }

const ver = worktree('tools/verifyArmorAbilities.mjs');
const checkStart = ver.indexOf("\tcheck('Shockwave plants StrikingWaveTracker");
const checkEnd = ver.indexOf("\tcheck('the AfterImage decoy", checkStart);
if (checkStart < 0 || checkEnd < 0) { console.log('ABORT: cannot locate my verifier check in the worktree'); process.exit(2); }
const myCheck = ver.slice(checkStart, checkEnd);

add('PORT_COVERAGE.md',
	`| Levelling itself (\`exp\`/\`lvl\`, \`HT\` growth, \`attackSkill++\`/\`defenseSkill++\`) | see "Levelling and skill points" below | Ported/Simplified - see that section |\n`,
	myRows.map((l) => l + '\n').join('')
		+ `| Levelling itself (\`exp\`/\`lvl\`, \`HT\` growth, \`attackSkill++\`/\`defenseSkill++\`) | see "Levelling and skill points" below | Ported/Simplified - see that section |\n`);

add('tools/verifyArmorAbilities.mjs',
	`\tcheck('the AfterImage decoy takes no buffs and no direct blob damage', () => {`,
	myCheck + `\tcheck('the AfterImage decoy takes no buffs and no direct blob damage', () => {`);

// ---- build HEAD + hunks ----
const built = new Map();
for (const e of edits) {
	if (!built.has(e.path)) built.set(e.path, head(e.path));
	const base = built.get(e.path);
	const n = base.split(e.from).length - 1;
	if (n !== 1) { console.log(`ABORT ${e.path}: anchor count=${n}`); process.exit(2); }
	built.set(e.path, base.replace(e.from, e.to));
}

// ---- private index ----
const idx = join(mkdtempSync(join(tmpdir(), 'pidx-')), 'index');
git(['read-tree', 'HEAD'], { GIT_INDEX_FILE: idx });
for (const [p, content] of built) {
	const sha = execFileSync('git', ['hash-object', '-w', '--stdin'], { input: content, encoding: 'utf8' }).trim();
	git(['update-index', '--add', '--cacheinfo', `100644,${sha},${p}`], { GIT_INDEX_FILE: idx });
	console.log(`staged-privately ${p} ${sha.slice(0, 8)}`);
}
const tree = git(['write-tree'], { GIT_INDEX_FILE: idx }).trim();

// ---- commit-tree, then a HEAD-guarded update-ref so a concurrent commit cannot be clobbered ----
const parent = git(['rev-parse', 'HEAD']).trim();
const msg = "Port STRIKING_WAVE's rank-4 StrikingWaveTracker and record the Warrior ability residuals";
const commit = execFileSync('git', ['commit-tree', tree, '-p', parent, '-m', msg], { encoding: 'utf8' }).trim();
try {
	git(['update-ref', 'HEAD', commit, parent]);
} catch (e) {
	console.log(`ABORT: HEAD moved during the commit (${parent.slice(0, 8)}); leaving it alone`);
	process.exit(3);
}
console.log(`COMMITTED ${commit}`);
