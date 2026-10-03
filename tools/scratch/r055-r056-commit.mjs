// R055/R056 commit (opencode): private-index commit of exactly nine files - the seven
// code/test files hashed from the worktree (each verified to carry only this session's
// hunks vs HEAD), plus ROADMAP.md and coverage/rows-monsters-bosses-and-combat.md
// reconstructed from HEAD with only my two updated lines spliced in by R-id/tail anchor
// (the shared worktree copies carry peer edits and are NOT committed). HEAD is read
// fresh each attempt and update-ref uses compare-and-swap, so a concurrent peer commit
// fails the ref update instead of clobbering it; the attempt then rebuilds on the new
// HEAD. The resulting tree is pinned to an exact numstat before it is committed.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';

const MESSAGE = 'Port mine questScores[2] penalties (rock strikes, spire spikes, guardian attacks)';
const TMP = 'tools/scratch/r055-r056';
mkdirSync(TMP, { recursive: true });

const gf = (args, opts = {}) =>
	execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 27, ...opts }).toString();

const codeFiles = [
	'src/simulation/crystalSpire.ts',
	'src/scenes/dungeon/monsters/crystalMine.ts',
	'src/scenes/dungeon/monsters/gnollMine.ts',
	'src/scenes/dungeon/combatResolution.ts',
	'src/rankings.ts',
	'tools/verifyCrystalMine.mjs',
	'tools/verifyMiningBranch.ts',
];
const expected = new Map([
	['src/simulation/crystalSpire.ts', '16\t0'],
	['src/scenes/dungeon/monsters/crystalMine.ts', '21\t3'],
	['src/scenes/dungeon/monsters/gnollMine.ts', '8\t2'],
	['src/scenes/dungeon/combatResolution.ts', '4\t0'],
	['src/rankings.ts', '3\t3'],
	['tools/verifyCrystalMine.mjs', '15\t2'],
	['tools/verifyMiningBranch.ts', '8\t0'],
	['ROADMAP.md', '2\t2'],
	['coverage/rows-monsters-bosses-and-combat.md', '2\t2'],
]);

function oneLine(text, prefix, label) {
	const hits = text.split('\n').filter((l) => l.startsWith(prefix));
	if (hits.length !== 1) throw new Error(`${label}: expected exactly one line starting with ${JSON.stringify(prefix)}, got ${hits.length}`);
	return hits[0];
}
function oneContaining(text, needle, label) {
	const hits = text.split('\n').filter((l) => l.includes(needle));
	if (hits.length !== 1) throw new Error(`${label}: expected exactly one line containing ${JSON.stringify(needle)}, got ${hits.length}`);
	return hits[0];
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

let committed = null;
for (let attempt = 1; attempt <= 4 && !committed; attempt++) {
	const headSha = gf(['rev-parse', 'HEAD']).trim();

	// --- ROADMAP: HEAD text + the worktree's updated R055/R056 lines ---
	const headRoadmap = gf(['show', 'HEAD:ROADMAP.md']);
	assert(!headRoadmap.includes('\r'), 'HEAD ROADMAP blob carries CR');
	const wtRoadmap = readFileSync('ROADMAP.md', 'utf8');
	let roadmap = headRoadmap;
	for (const [anchor, must] of [
		['- [ ] **R055** ', ['Ported 2026-10-01', 'gnollRockStrike']],
		['- [ ] **R056** ', ['Ported 2026-10-01', 'CrystalGuardian.attack()']],
	]) {
		const headLine = oneLine(roadmap, anchor, 'HEAD ROADMAP');
		const wtLine = oneLine(wtRoadmap, anchor, 'worktree ROADMAP');
		for (const m of must) assert(wtLine.includes(m), `worktree ${anchor} line lacks ${m}`);
		assert(headLine.includes('Not ported'), `HEAD ${anchor} line already updated?`);
		assert(wtLine !== headLine, `worktree ${anchor} line not updated`);
		roadmap = roadmap.replace(headLine, wtLine);
	}
	writeFileSync(`${TMP}/roadmap.md`, roadmap);
	const shaRoadmap = gf(['hash-object', '-w', '--path=ROADMAP.md', `${TMP}/roadmap.md`]).trim();

	// --- rows: HEAD text + the worktree's two rows with my appended Ported clauses ---
	const headRows = gf(['show', 'HEAD:coverage/rows-monsters-bosses-and-combat.md']);
	assert(!headRows.includes('\r'), 'HEAD rows blob carries CR');
	const wtRows = readFileSync('coverage/rows-monsters-bosses-and-combat.md', 'utf8');
	let rows = headRows;
	for (const [tail, must] of [
		['(open residual moved to `ROADMAP.md` R055) |', ['verifyMiningBranch']],
		['(open residual moved to `ROADMAP.md` R056) |', ['verifyCrystalMine']],
	]) {
		const headLine = oneContaining(rows, tail, 'HEAD rows');
		const wtLine = oneContaining(wtRows, tail, 'worktree rows');
		assert(!headLine.includes('Ported (2026-10-01)'), `HEAD row ${tail} already updated?`);
		for (const m of must) assert(wtLine.includes(m), `worktree row ${tail} lacks ${m}`);
		assert(wtLine !== headLine, `worktree row ${tail} not updated`);
		rows = rows.replace(headLine, wtLine);
	}
	writeFileSync(`${TMP}/rows.md`, rows);
	const shaRows = gf(['hash-object', '-w', '--path=coverage/rows-monsters-bosses-and-combat.md', `${TMP}/rows.md`]).trim();

	// --- code/test files straight from the worktree (hunks pre-verified as mine-only) ---
	const entries = [
		['ROADMAP.md', shaRoadmap],
		['coverage/rows-monsters-bosses-and-combat.md', shaRows],
		...codeFiles.map((f) => [f, gf(['hash-object', '-w', f]).trim()]),
	];

	// --- pin the tree against the exact expected numstat ---
	const idx = `${TMP}/private.index`;
	try { rmSync(idx); } catch {}
	const env = { ...process.env, GIT_INDEX_FILE: idx };
	gf(['read-tree', 'HEAD'], { env });
	for (const [path, sha] of entries) gf(['update-index', '--cacheinfo', `100644,${sha},${path}`], { env });
	const tree = gf(['write-tree'], { env }).trim();

	const numstat = gf(['diff', '--numstat', headSha, tree])
		.split('\n').filter(Boolean).map((l) => { const [a, d, f] = l.split('\t'); return [f, `${a}\t${d}`]; });
	assert(numstat.length === expected.size, `tree touches ${numstat.length} files, expected ${expected.size}: ${JSON.stringify(numstat)}`);
	for (const [file, counts] of numstat) {
		assert(expected.has(file), `unexpected file in tree: ${file}`);
		assert(expected.get(file) === counts, `${file}: counts ${counts}, expected ${expected.get(file)}`);
	}

	const commit = gf(['commit-tree', tree, '-p', headSha, '-m', MESSAGE]).trim();
	const ref = spawnSync('git', ['update-ref', 'HEAD', commit, headSha], { encoding: 'utf8' });
	if (ref.status === 0) { committed = commit; break; }
	console.log(`HEAD moved during attempt ${attempt}, rebuilding on the new HEAD`);
}
if (!committed) throw new Error('could not land the commit after 4 attempts');
console.log(`committed ${committed}`);
