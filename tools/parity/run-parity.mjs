#!/usr/bin/env node
/**
 * Java-vs-TypeScript parity runner (BACKLOG B1 / coord T55): one command that rebuilds the Java oracle
 * from source, runs it with fixed seeds and diffs the result against this port's own traces.
 *
 *   node tools/parity/run-parity.mjs                     both stages
 *   node tools/parity/run-parity.mjs --stage combat      Char.attack() rounds, Java v3.3.8 vs TS (~4 min)
 *   node tools/parity/run-parity.mjs --stage loot        derived Mob.lootChance() drop chance, Java v3.3.8 vs TS
 *   node tools/parity/run-parity.mjs --stage levelgen    floor generation RNG draws, checkout oracle + S6 deck backport vs TS
 *   node tools/parity/run-parity.mjs --stage mobdata     every Java mob class's stats/loot (v3.3.8) vs the port's monster tables
 *   node tools/parity/run-parity.mjs --stage quest       isolated Wandmaker.Quest.spawnRoom() gate/type, v3.3.8 vs TS
 *   node tools/parity/run-parity.mjs --stage quest-floor full floor-to-quest diagnostic (room-generation reductions can shift the gate)
 *   node tools/parity/run-parity.mjs --stage ghost       Ghost spawn gate + reward rolls per (seed, depth), Java v3.3.8 vs TS
 *   node tools/parity/run-parity.mjs --stage imp         Imp spawn gate + alternative flag + reward ring per seed, checkout oracle + S6 deck backport vs TS
 *   node tools/parity/run-parity.mjs --stage blacksmith  Blacksmith spawn gate + type + reward rolls per (seed, depth), Java v3.3.8 vs TS
 *   node tools/parity/run-parity.mjs --stage tengu       Tengu.damage() HP bracket clamp + deferred jump, Java v3.3.8 vs TS
 *   options: --spd <SPD checkout>   (default $SPD_CHECKOUT or ~/dev/shattered-pixel-dungeon; a git repo with the tags/commits)
 *            --work <dir>           scratch dir for the Java trees (default <os tmp>/mwg-parity; reused between runs)
 *            --combat-ref v3.3.8    Java ref for the combat oracle
 *            --levelgen-ref 0fdcf2b2b   Java ref for the levelgen oracle (B2 decision 2026-09-26: the checkout's own tables; S6 2026-09-30: v3.3.8 deck draw-sequence backported at build time by tools/parity/patchOracleDecks.mjs)
 *            --quest-ref v3.3.8     Java ref for the Wandmaker quest oracle (target-version source)
 *            --scripts 2,3,4  --seeds 123456789,1,42   combat matrix
 *            --levelgen-tree <dir>  use an already-prepared Java tree instead of exporting one (skips export + hook install)
 *
 * What it does, per stage: `git archive <ref>` of the SPD checkout into the work dir (nothing in the checkout is modified),
 * copies the project-authored harness sources from tools/parity/java/, inserts the RNG trace hook into `Random.java` by
 * text insertion (tools/parity/java/TracingRandom.hook.txt is our own code; no SPD text is stored here), registers the
 * Gradle tasks, runs them offline, then runs the TS side and compares. Exit code 0 only when every gate holds.
 * Needs: JDK 17+, the checkout, and Gradle's dependency cache warm (first run may need the network unless `--offline` caches exist).
 * Licensing: the harness classes are ours (GPL-3.0-or-later, like the port); the exported SPD tree is only used as a build input.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const JAVA_SRC = join(ROOT, 'tools', 'parity', 'java');
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback; };
const stage = arg('--stage', 'all');
const spd = resolve(arg('--spd', process.env.SPD_CHECKOUT || join(homedir(), 'dev', 'shattered-pixel-dungeon')));
const work = resolve(arg('--work', join(tmpdir(), 'mwg-parity')));
const combatRef = arg('--combat-ref', 'v3.3.8');
const levelgenRef = arg('--levelgen-ref', '0fdcf2b2b');
const questRef = arg('--quest-ref', 'v3.3.8');
const scripts = arg('--scripts', '2,3,4').split(',');
const seeds = arg('--seeds', '123456789,1,42').split(',');
const prebuiltLevelgenTree = arg('--levelgen-tree', null);
const isWin = process.platform === 'win32';

const CORE = 'core/src/main/java/com/shatteredpixel/shatteredpixeldungeon';
const DESKTOP = 'desktop/src/main/java/com/shatteredpixel/shatteredpixeldungeon/desktop';
const results = [];
const gate = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`); };

function run(cmd, args, options = {}) {
	const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, shell: false, ...options });
	return { status: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

/** Exports `ref` of the SPD checkout into `dir` (a plain source tree, no .git) unless it is already there. */
function exportTree(dir, ref) {
	if (existsSync(join(dir, 'gradlew.bat'))) { console.log(`reusing ${dir}`); return; }
	if (!existsSync(join(spd, '.git'))) throw new Error(`no git checkout at ${spd} (pass --spd <dir>)`);
	mkdirSync(dir, { recursive: true });
	const tarFile = join(dir, '..', `export-${ref.replace(/[^A-Za-z0-9.]+/g, '_')}.tar`);
	// The SPD checkout is read-only input and may be owned by the Windows user while
	// this process runs under the sandbox identity. Trust only this explicit path for
	// this one read-only archive command; do not change global Git configuration.
	let r = run('git', ['-c', `safe.directory=${spd}`, '-C', spd, 'archive', '--format=tar', '-o', tarFile, ref]);
	if (r.status !== 0) throw new Error(`git archive ${ref} failed: ${r.out.slice(0, 300)}`);
	// Relative paths + cwd: GNU tar on Windows reads "C:" in an absolute path as a remote host.
	// Judge by result, not exit code: tar exits nonzero on git-archive pax-header entries
	// ("empty or unreadable filename") that carry no content - the tree still extracts whole
	// (S6 2026-09-30: a warning-extracted tree compiled and traced 28/28).
	r = run('tar', ['-xf', `../${tarFile.split(/[\\/]/).pop()}`], { cwd: dir });
	rmSync(tarFile, { force: true });
	if (!existsSync(join(dir, 'gradlew.bat'))) throw new Error(`tar failed: ${r.out.slice(0, 300)}`);
}

/** Copies our harness classes in, inserts the trace hook into Random.java and makes sure the Gradle tasks exist. */
function installHarness(dir, { combat, levelgen, loot, mobdata, ghost, imp, blacksmith, wandmaker, tengu }) {
	const put = (name, rel) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); copyFileSync(join(JAVA_SRC, name), join(dir, rel)); };
	if (combat) { put('CombatHarness.java', `${CORE}/actors/mobs/CombatHarness.java`); put('CombatHarnessLauncher.java', `${DESKTOP}/CombatHarnessLauncher.java`); }
	if (levelgen) { put('LevelGenHarness.java', `${CORE}/levels/LevelGenHarness.java`); put('LevelGenHarnessLauncher.java', `${DESKTOP}/LevelGenHarnessLauncher.java`); }
	if (mobdata) { put('MobDataHarness.java', `${CORE}/actors/mobs/MobDataHarness.java`); put('MobDataHarnessLauncher.java', `${DESKTOP}/MobDataHarnessLauncher.java`); }
	if (loot) { put('LootHarness.java', `${CORE}/actors/mobs/LootHarness.java`); put('LootHarnessLauncher.java', `${DESKTOP}/LootHarnessLauncher.java`); }
	if (ghost) { put('GhostRewardHarness.java', `${CORE}/actors/mobs/npcs/GhostRewardHarness.java`); put('GhostRewardHarnessLauncher.java', `${DESKTOP}/GhostRewardHarnessLauncher.java`); }
	if (imp) { put('ImpRewardHarness.java', `${CORE}/actors/mobs/npcs/ImpRewardHarness.java`); put('ImpRewardHarnessLauncher.java', `${DESKTOP}/ImpRewardHarnessLauncher.java`); }
	if (blacksmith) { put('BlacksmithRewardHarness.java', `${CORE}/actors/mobs/npcs/BlacksmithRewardHarness.java`); put('BlacksmithRewardHarnessLauncher.java', `${DESKTOP}/BlacksmithRewardHarnessLauncher.java`); }
	if (wandmaker) { put('WandmakerSpawnHarness.java', `${CORE}/actors/mobs/npcs/WandmakerSpawnHarness.java`); put('WandmakerSpawnHarnessLauncher.java', `${DESKTOP}/WandmakerSpawnHarnessLauncher.java`); }
	if (tengu) { put('TenguDamageHarness.java', `${CORE}/actors/mobs/TenguDamageHarness.java`); put('TenguDamageHarnessLauncher.java', `${DESKTOP}/TenguDamageHarnessLauncher.java`); }

	const randomFile = join(dir, 'SPD-classes/src/main/java/com/watabou/utils/Random.java');
	let random = readFileSync(randomFile, 'utf8');
	if (!random.includes('TracingRandom')) {
		const hook = readFileSync(join(JAVA_SRC, 'TracingRandom.hook.txt'), 'utf8');
		const anchor = /(\r?\n)([ \t]*)public static synchronized void pushGenerator\( long seed \)\{/;
		const push = /generators\.push\( new java\.util\.Random\( scrambleSeed\(seed\) \) \);/;
		if (!anchor.test(random) || !push.test(random)) throw new Error('Random.java no longer has the pushGenerator shape the hook expects; update TracingRandom.hook.txt');
		random = random.replace(anchor, (m, nl, indent) => `${nl}${hook.replace(/\r?\n/g, nl)}${nl}${indent}public static synchronized void pushGenerator( long seed ){`);
		random = random.replace(push, 'generators.push( traceDraws ? new TracingRandom( scrambleSeed(seed) ) : new java.util.Random( scrambleSeed(seed) ) );');
		writeFileSync(randomFile, random);
	}

	const gradleFile = join(dir, 'desktop/build.gradle');
	let gradle = readFileSync(gradleFile, 'utf8');
	const nl = gradle.includes('\r\n') ? '\r\n' : '\n';
	const task = (name, main) => `${nl}// parity harness (tools/parity/run-parity.mjs)${nl}tasks.register('${name}', JavaExec) {${nl}    classpath = sourceSets.main.runtimeClasspath${nl}    ignoreExitValue = true${nl}    mainClass = "com.shatteredpixel.shatteredpixeldungeon.desktop.${main}"${nl}}${nl}`;
	if (combat && !gradle.includes("'runCombatHarness'")) gradle += task('runCombatHarness', 'CombatHarnessLauncher');
	if (levelgen && !/runHarness/.test(gradle)) gradle += task('runHarness', 'LevelGenHarnessLauncher');
	if (mobdata && !gradle.includes("'runMobData'")) gradle += task('runMobData', 'MobDataHarnessLauncher');
	if (loot && !gradle.includes("'runLootHarness'")) gradle += task('runLootHarness', 'LootHarnessLauncher');
	if (ghost && !gradle.includes("'runGhostReward'")) gradle += task('runGhostReward', 'GhostRewardHarnessLauncher');
	if (imp && !gradle.includes("'runImpReward'")) gradle += task('runImpReward', 'ImpRewardHarnessLauncher');
	if (blacksmith && !gradle.includes("'runBlacksmithReward'")) gradle += task('runBlacksmithReward', 'BlacksmithRewardHarnessLauncher');
	if (wandmaker && !gradle.includes("'runWandmakerSpawn'")) gradle += task('runWandmakerSpawn', 'WandmakerSpawnHarnessLauncher');
	if (tengu && !gradle.includes("'runTenguDamage'")) gradle += task('runTenguDamage', 'TenguDamageHarnessLauncher');
	writeFileSync(gradleFile, gradle);
}

function gradle(dir, task, env) {
	const args = [`:desktop:${task}`, '--offline', '--console=plain', '-q'];
	const r = isWin
		? run('cmd', ['/c', '.\\gradlew.bat', ...args], { cwd: dir, env: { ...process.env, ...env } })
		: run('./gradlew', args, { cwd: dir, env: { ...process.env, ...env } });
	return r;
}

const tsBundle = (entry, outName) => {
	const out = join(ROOT, 'tools', 'scratch', outName);
	const r = run(process.execPath, [join(ROOT, 'node_modules', 'esbuild', 'bin', 'esbuild'), join(ROOT, entry), '--bundle', '--platform=node', '--format=esm', `--outfile=${out}`, '--log-level=error']);
	if (r.status !== 0) throw new Error(`esbuild ${entry} failed: ${r.out.slice(0, 400)}`);
	return out;
};

function combatStage() {
	console.log(`\n== combat: Java ${combatRef} Char.attack() vs this port's resolveAttack (scripts ${scripts}, seeds ${seeds}) ==`);
	const dir = join(work, `spd-${combatRef}`);
	exportTree(dir, combatRef);
	installHarness(dir, { combat: true });
	const tsRunner = tsBundle('tools/parityCombatTrace.ts', 'parityCombatTrace.mjs');
	const out = join(work, 'combat-traces'); mkdirSync(out, { recursive: true });
	const det = run(process.execPath, [tsRunner, 'check']);
	gate('TS harness self-checks (determinism, positive and negative controls)', det.status === 0, det.status === 0 ? '' : det.out.slice(-300));
	for (const script of scripts) for (const seed of seeds) {
		const javaOut = join(out, `java-s${script}-${seed}.txt`), tsOut = join(out, `ts-s${script}-${seed}.txt`);
		rmSync(javaOut, { force: true });
		const g = gradle(dir, 'runCombatHarness', { COMBAT_SCRIPT: script, COMBAT_SEED: seed, COMBAT_OUT: javaOut });
		if (!existsSync(javaOut)) { gate(`combat script ${script} seed ${seed}`, false, `Java side produced no trace: ${g.out.slice(-300)}`); continue; }
		const e = run(process.execPath, [tsRunner, 'emit', '--seed', seed, '--script', script, '--out', tsOut]);
		if (e.status !== 0) { gate(`combat script ${script} seed ${seed}`, false, `TS emit failed: ${e.out.slice(-200)}`); continue; }
		const c = run(process.execPath, [tsRunner, 'compare', '--a', tsOut, '--b', javaOut]);
		gate(`combat script ${script} seed ${seed}`, c.status === 0 && /traces identical/.test(c.out), c.out.trim().split('\n').pop());
	}
}

/** B3 / T57, loot domain: what Java's own `Mob.lootChance()` returns (the value
 * `Mob.rollToDropLoot()` rolls `Random.Float()` against) against this port's composition of the
 * same number from its authored `monsterLoot` + `limitedDropDecay` rows. */
function lootStage() {
	console.log(`== loot: Java ${combatRef} Mob.lootChance() (rollToDropLoot's decision value) vs this port's drop-chance composition ==`);
	const dir = join(work, `spd-${combatRef}`);
	exportTree(dir, combatRef);
	installHarness(dir, { loot: true });
	const outDir = join(work, 'loot'); mkdirSync(outDir, { recursive: true });
	const javaOut = join(outDir, 'loot_java_out.txt');
	rmSync(javaOut, { force: true });
	const g = gradle(dir, 'runLootHarness', { LOOT_OUT: javaOut });
	if (!existsSync(javaOut)) { gate('loot Java dump produced', false, g.out.slice(-400)); return; }
	const cases = (readFileSync(javaOut, 'utf8').match(/"mob":/g) || []).length;
	gate('loot Java dump produced', true, `${cases} cases`);
	const tsRunner = tsBundle('tools/parityLootTrace.ts', 'parityLootTrace.mjs');
	const r = run(process.execPath, [tsRunner, '--java', javaOut, '--known', join(ROOT, 'tools', 'parity', 'loot-known.json'), '--report', join(outDir, 'loot-report.txt')]);
	console.log(r.out.trim().split('\n').slice(0, 40).join('\n'));
	gate('loot: every derived drop chance matches Java (within float32 rounding) or is documented in loot-known.json', r.status === 0, `report: ${join(outDir, 'loot-report.txt')}`);
}

function mobdataStage() {
	console.log(`\n== mobdata: every Java ${combatRef} mob class (stats, loot) vs the port's monster and loot tables ==`);
	const dir = join(work, `spd-${combatRef}`);
	exportTree(dir, combatRef);
	installHarness(dir, { combat: true, mobdata: true });
	const outDir = join(work, 'mobdata'); mkdirSync(outDir, { recursive: true });
	const javaOut = join(outDir, 'mobdata_java_out.txt');
	rmSync(javaOut, { force: true });
	const g = gradle(dir, 'runMobData', { MOBDATA_DIR: join(dir, CORE, 'actors', 'mobs'), MOBDATA_OUT: javaOut });
	if (!existsSync(javaOut)) { gate('mobdata Java dump produced', false, g.out.slice(-400)); return; }
	gate('mobdata Java dump produced', true, `${readFileSync(javaOut, 'utf8').split('\n').filter(Boolean).length} mobs`);
	const tsRunner = tsBundle('tools/parity/mobDataParity.ts', 'mobDataParity.mjs');
	const r = run(process.execPath, [tsRunner, '--java', javaOut, '--known', join(ROOT, 'tools', 'parity', 'mobdata-known.json'), '--report', join(outDir, 'mobdata-report.txt')]);
	console.log(r.out.trim().split('\n').slice(0, 60).join('\n'));
	gate('mobdata: every difference is documented in mobdata-known.json (and none is stale)', r.status === 0, `full report: ${join(outDir, 'mobdata-report.txt')}`);
}

/** B3 / T57, loot domain: what Java's own `Mob.lootChance()` returns (the value
 * `Mob.rollToDropLoot()` rolls `Random.Float()` against) against this port's composition of the
 * same number from its authored `monsterLoot` + `limitedDropDecay` rows. */

/** B3 / T57, isolated quest-domain logic: actual `Wandmaker.Quest.spawnRoom()` versus the
 * production TypeScript decision, both starting from the same Java-seeded stream. This avoids
 * attributing known room-generation RNG differences to the quest's own gate/type formula. */
function questStage() {
	console.log(`\n== quest: Java ${questRef} Wandmaker.Quest.spawnRoom() gate/type vs the port, equal RNG seed ==`);
	const dir = join(work, `spd-quest-spawn-${questRef}`);
	exportTree(dir, questRef);
	installHarness(dir, { wandmaker: true });
	const desktop = join(dir, 'desktop');
	const javaOut = join(desktop, 'wandmaker_java_out.txt');
	rmSync(javaOut, { force: true });
	const g = gradle(dir, 'runWandmakerSpawn', { WANDMAKER_OUT: javaOut });
	if (!existsSync(javaOut)) { gate('quest Java dump produced', false, g.out.slice(-400)); return; }
	const outDir = join(work, 'quest'); mkdirSync(outDir, { recursive: true });
	const report = join(outDir, 'wandmaker-spawn-report.txt');
	const r = run(process.execPath, [join(ROOT, 'tools', 'verifyWandmakerQuest.mjs'), javaOut, report]);
	console.log(r.out.trim());
	gate('quest: 40 direct spawn gate/type cases match Java', r.status === 0, `report: ${report}`);
}

/** Full-floor quest trace diagnostic. The port intentionally omits Java room-subclass selection
 * and some room classes; their draw sequence can shift the later Wandmaker gate. This stage prints
 * the differences to aid levelgen work, but does not misreport those known RNG deltas as a quest
 * formula failure. The isolated `--stage quest` above is the quest-logic gate. */
function questFloorStage() {
	console.log(`\n== quest-floor: full Java ${questRef} Prison level stream diagnostic ==`);
	const dir = join(work, `spd-quest-${questRef}`);
	exportTree(dir, questRef);
	installHarness(dir, { levelgen: true });
	const desktop = join(dir, 'desktop');
	const questsFile = join(desktop, 'levelgen_quests.txt');
	rmSync(questsFile, { force: true });
	const g = gradle(dir, 'runHarness', { LEVELGEN_QUESTS: 'true', LEVELGEN_TRACE: 'true' });
	if (!existsSync(questsFile)) { gate('quest-floor Java dump produced', false, g.out.slice(-400)); return; }
	gate('quest-floor diagnostic Java dump produced', true, `${readFileSync(questsFile, 'utf8').split('\n').filter(Boolean).length} lines`);
	const report = join(work, 'quest', 'quest-floor-report.txt'); mkdirSync(dirname(report), { recursive: true });
	const tsRunner = tsBundle('tools/parityQuestTrace.ts', 'parityQuestTrace.mjs');
	const r = run(process.execPath, [tsRunner, '--java', questsFile, '--report', report]);
	console.log(r.out.trim());
	gate('quest-floor diagnostic report produced', existsSync(report), `report: ${report}`);
}

/** B3, Ghost quest domain: `Ghost.Quest.spawn()`'s spawn gate (`Random.Int(5-depth)==0`,
 * depths 2-4, `type = depth-1`) plus every reward roll (armor/weapon tiers and classes,
 * the shared item level, the enchant keep) per (seed, depth) - Java v3.3.8 (fresh decks
 * per case) vs the port's gate composition + `ghostQuestReward()`. The room/position
 * loop is not walked on either side: its draws depend on level geometry. */
function ghostStage() {
	console.log(`\n== ghost: Java ${combatRef} Ghost.Quest.spawn() gate + reward rolls vs this port's gate + ghostQuestReward() ==`);
	const dir = join(work, `spd-${combatRef}`);
	exportTree(dir, combatRef);
	installHarness(dir, { ghost: true });
	const outDir = join(work, 'ghost'); mkdirSync(outDir, { recursive: true });
	const javaOut = join(outDir, 'ghost_java_out.txt');
	rmSync(javaOut, { force: true });
	const g = gradle(dir, 'runGhostReward', { GHOST_OUT: javaOut });
	if (!existsSync(javaOut)) { gate('ghost Java dump produced', false, g.out.slice(-400)); return; }
	const cases = (readFileSync(javaOut, 'utf8').match(/"depth":/g) || []).length;
	gate('ghost Java dump produced', true, `${cases} cases`);
	const tsRunner = tsBundle('tools/parityGhostRewardTrace.ts', 'parityGhostRewardTrace.mjs');
	const r = run(process.execPath, [tsRunner, '--java', javaOut, '--known', join(ROOT, 'tools', 'parity', 'ghostreward-known.json'), '--report', join(outDir, 'ghost-report.txt')]);
	console.log(r.out.trim().split('\n').slice(0, 40).join('\n'));
	gate('ghost: spawn gate, type, tiers, classes, item level and enchant keep all match Java or are documented in ghostreward-known.json', r.status === 0, `report: ${join(outDir, 'ghost-report.txt')}`);
}

function impStage() {
	console.log(`\n== imp: Java Imp.Quest.spawn() gate + alternative flag + reward ring per seed vs this port's gate + impQuestReward() ==`);
	const dir = join(work, `spd-imp-${levelgenRef}`);
	exportTree(dir, levelgenRef); installHarness(dir, { imp: true });
	// Same S6 deck backport as levelgenStage: the Imp composition starts from a fresh
	// fullReset, whose deck order depends on the patched static init (idempotent skip).
	const p = run(process.execPath, [join(ROOT, 'tools', 'parity', 'patchOracleDecks.mjs'), dir]);
	console.log(p.out.trim().split('\n').slice(0, 3).join('\n'));
	gate('imp deck backport applied', p.status === 0, p.status === 0 ? '' : p.out.slice(-400));
	if (p.status !== 0) return;
	const outDir = join(work, 'imp'); mkdirSync(outDir, { recursive: true });
	const javaOut = join(outDir, 'imp_java_out.txt');
	rmSync(javaOut, { force: true });
	const g = gradle(dir, 'runImpReward', { IMP_OUT: javaOut });
	if (!existsSync(javaOut)) { gate('imp Java dump produced', false, g.out.slice(-400)); return; }
	const cases = (readFileSync(javaOut, 'utf8').match(/"spawnDepth":/g) || []).length;
	gate('imp Java dump produced', true, `${cases} cases`);
	const tsRunner = tsBundle('tools/parityImpTrace.ts', 'parityImpTrace.mjs');
	const r = run(process.execPath, [tsRunner, '--java', javaOut, '--known', join(ROOT, 'tools', 'parity', 'impReward-known.json'), '--report', join(outDir, 'imp-report.txt')]);
	console.log(r.out.trim().split('\n').slice(0, 40).join('\n'));
	gate('imp: spawn depth, alternative flag, ring class and level all match Java or are documented in impReward-known.json', r.status === 0, `report: ${join(outDir, 'imp-report.txt')}`);
}

/** B3, Blacksmith quest domain: `Blacksmith.Quest.spawn()`'s spawn gate (`Random.Int(15-depth)==0`,
 * depths 12-14, `type = Random.IntRange(1, 2)`) plus every reward roll (floor-set-3 weapon/missile/armor
 * tiers and classes, the shared item level, the enchant/glyph keep) per (seed, depth) - Java v3.3.8
 * (fresh decks per case, calling the real `generateRewards(true)`) vs the port's gate + type
 * composition + `blacksmithSmithRewards()`. The room placement is not walked on either side:
 * its draws depend on level geometry. No S6 backport: the v3.3.8 tree already has the deck mechanics. */
function blacksmithStage() {
	console.log(`\n== blacksmith: Java ${combatRef} quest spawn/rewards and Quest.complete() vs this port ==`);
	const dir = join(work, `spd-${combatRef}`);
	exportTree(dir, combatRef);
	installHarness(dir, { blacksmith: true });
	const outDir = join(work, 'blacksmith'); mkdirSync(outDir, { recursive: true });
	const javaOut = join(outDir, 'blacksmith_java_out.txt');
	rmSync(javaOut, { force: true });
	const g = gradle(dir, 'runBlacksmithReward', { BLACKSMITH_OUT: javaOut });
	if (!existsSync(javaOut)) { gate('blacksmith Java dump produced', false, g.out.slice(-400)); return; }
	const cases = (readFileSync(javaOut, 'utf8').match(/"depth":/g) || []).length;
	gate('blacksmith Java dump produced', true, `${cases} cases`);
	const tsRunner = tsBundle('tools/parityBlacksmithTrace.ts', 'parityBlacksmithTrace.mjs');
	const r = run(process.execPath, [tsRunner, '--java', javaOut, '--known', join(ROOT, 'tools', 'parity', 'blacksmith-known.json'), '--report', join(outDir, 'blacksmith-report.txt')]);
	console.log(r.out.trim().split('\n').slice(0, 40).join('\n'));
	gate('blacksmith: spawn/reward fields and actual Java completion outcomes match the port', r.status === 0, `report: ${join(outDir, 'blacksmith-report.txt')}`);
}

/** B3, boss transition domain: actual `Tengu.damage()` bracket clamp + the actor it schedules
 * when a hit crosses a bracket. FIGHT_PAUSE keeps the test away from arena presentation and
 * phase progression while retaining the production override's HP and jump branches. */
function tenguStage() {
	console.log(`\n== tengu: Java ${combatRef} Tengu.damage() HP bracket clamp + deferred jump vs production TypeScript ==`);
	const dir = join(work, `spd-${combatRef}`);
	exportTree(dir, combatRef);
	installHarness(dir, { tengu: true });
	const outDir = join(work, 'tengu'); mkdirSync(outDir, { recursive: true });
	const javaOut = join(outDir, 'tengu_damage_java_out.txt');
	rmSync(javaOut, { force: true });
	const g = gradle(dir, 'runTenguDamage', { TENGU_DAMAGE_OUT: javaOut });
	if (!existsSync(javaOut)) { gate('tengu Java dump produced', false, g.out.slice(-500)); return; }
	const r = run(process.execPath, [join(ROOT, 'tools', 'verifyTenguPhase.mjs'), javaOut]);
	console.log(r.out.trim());
	gate('tengu: actual Java damage clamp and jump scheduling match the production seam', r.status === 0, `report: ${javaOut}`);
}

function levelgenStage() {

	console.log(`\n== levelgen: floor-generation RNG draws, oracle ${prebuiltLevelgenTree ? prebuiltLevelgenTree : levelgenRef} vs this port (depths 3-9, 4 seeds) ==`);
	const dir = prebuiltLevelgenTree ? resolve(prebuiltLevelgenTree) : join(work, `spd-levelgen-${levelgenRef}`);
	if (!prebuiltLevelgenTree) {
		exportTree(dir, levelgenRef); installHarness(dir, { levelgen: true });
		// S6 (2026-09-30): the checkout oracle predates the v3.3.8 deck mechanics the port
		// now models, so backport the draw sequence into the exported tree (idempotent skip
		// when already patched). --levelgen-tree users run patchOracleDecks.mjs themselves.
		const p = run(process.execPath, [join(ROOT, 'tools', 'parity', 'patchOracleDecks.mjs'), dir]);
		console.log(p.out.trim().split('\n').slice(0, 14).join('\n'));
		gate('levelgen deck backport applied', p.status === 0, p.status === 0 ? '' : p.out.slice(-400));
		if (p.status !== 0) return;
	}
	const desktop = join(dir, 'desktop');
	for (const f of ['levelgen_java_dump.txt']) rmSync(join(desktop, f), { force: true });
	const g = gradle(dir, 'runHarness', { LEVELGEN_TRACE: 'true' });
	if (!existsSync(join(desktop, 'levelgen_java_dump.txt'))) { gate('levelgen Java dump produced', false, g.out.slice(-400)); return; }
	gate('levelgen Java dump produced', true);
	const tsRunner = tsBundle('tools/levelgenParity.ts', 'levelgenParity.mjs');
	const tsTraces = join(work, 'levelgen-ts-traces');
	const r = run(process.execPath, [tsRunner, '--java-dump', join(desktop, 'levelgen_java_dump.txt'), '--java-traces', desktop, '--write-ts-traces', tsTraces]);
	const identical = (r.out.match(/TRACE-IDENTICAL/g) || []).length;
	const diffs = (r.out.match(/TRACE-DIFF/g) || []).length;
	const summary = r.out.trim().split('\n').pop();
	gate('levelgen RNG traces: every deterministic floor (depths 3-9) identical', identical === 28 && diffs === 0, `${identical} identical, ${diffs} differing; ${summary}`);
	gate('levelgen structural parity on the deterministic set', /\(28\/28 on depths 3\+/.test(summary), summary);
}

try {
	if (stage === 'all' || stage === 'combat') combatStage();
	if (stage === 'all' || stage === 'mobdata') mobdataStage();
	if (stage === 'all' || stage === 'loot') lootStage();
	if (stage === 'all' || stage === 'quest') questStage();
	if (stage === 'quest-floor') questFloorStage();
	if (stage === 'all' || stage === 'ghost') ghostStage();
	if (stage === 'all' || stage === 'imp') impStage();
	if (stage === 'all' || stage === 'blacksmith') blacksmithStage();
	if (stage === 'all' || stage === 'tengu') tenguStage();
	if (stage === 'all' || stage === 'levelgen') levelgenStage();
} catch (e) {
	gate('runner', false, e.message);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${failed === 0 ? 'PARITY OK' : `PARITY FAILED (${failed} gate(s))`}: ${results.length - failed}/${results.length} gates`);
process.exit(failed === 0 ? 0 : 1);
