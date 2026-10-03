#!/usr/bin/env node
/**
 * Java-vs-TypeScript parity runner (BACKLOG B1 / coord T55): one command that rebuilds the Java oracle
 * from source, runs it with fixed seeds and diffs the result against this port's own traces.
 *
 *   node tools/parity/run-parity.mjs                     both stages
 *   node tools/parity/run-parity.mjs --stage combat      Char.attack() rounds, Java v3.3.8 vs TS (~4 min)
 *   node tools/parity/run-parity.mjs --stage levelgen    floor generation RNG draws, checkout oracle vs TS
 *   options: --spd <SPD checkout>   (default $SPD_CHECKOUT or ~/dev/shattered-pixel-dungeon; a git repo with the tags/commits)
 *            --work <dir>           scratch dir for the Java trees (default <os tmp>/mwg-parity; reused between runs)
 *            --combat-ref v3.3.8    Java ref for the combat oracle
 *            --levelgen-ref 0fdcf2b2b   Java ref for the levelgen oracle (B2 decision 2026-09-26: the checkout's own tables)
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
	let r = run('git', ['-C', spd, 'archive', '--format=tar', '-o', tarFile, ref]);
	if (r.status !== 0) throw new Error(`git archive ${ref} failed: ${r.out.slice(0, 300)}`);
	// Relative paths + cwd: GNU tar on Windows reads "C:" in an absolute path as a remote host.
	r = run('tar', ['-xf', `../${tarFile.split(/[\\/]/).pop()}`], { cwd: dir });
	rmSync(tarFile, { force: true });
	if (r.status !== 0) throw new Error(`tar failed: ${r.out.slice(0, 300)}`);
}

/** Copies our harness classes in, inserts the trace hook into Random.java and makes sure the Gradle tasks exist. */
function installHarness(dir, { combat, levelgen }) {
	const put = (name, rel) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); copyFileSync(join(JAVA_SRC, name), join(dir, rel)); };
	if (combat) { put('CombatHarness.java', `${CORE}/actors/mobs/CombatHarness.java`); put('CombatHarnessLauncher.java', `${DESKTOP}/CombatHarnessLauncher.java`); }
	if (levelgen) { put('LevelGenHarness.java', `${CORE}/levels/LevelGenHarness.java`); put('LevelGenHarnessLauncher.java', `${DESKTOP}/LevelGenHarnessLauncher.java`); }

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

function levelgenStage() {
	console.log(`\n== levelgen: floor-generation RNG draws, oracle ${prebuiltLevelgenTree ? prebuiltLevelgenTree : levelgenRef} vs this port (depths 3-9, 4 seeds) ==`);
	const dir = prebuiltLevelgenTree ? resolve(prebuiltLevelgenTree) : join(work, `spd-levelgen-${levelgenRef}`);
	if (!prebuiltLevelgenTree) { exportTree(dir, levelgenRef); installHarness(dir, { levelgen: true }); }
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
	if (stage === 'all' || stage === 'levelgen') levelgenStage();
} catch (e) {
	gate('runner', false, e.message);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${failed === 0 ? 'PARITY OK' : `PARITY FAILED (${failed} gate(s))`}: ${results.length - failed}/${results.length} gates`);
process.exit(failed === 0 ? 0 : 1);
