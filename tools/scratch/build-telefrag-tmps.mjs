// Build the HEAD+mine doc tmps for the telefrag armor-abilities remainder commit:
//   rows-telefrag.tmp     - WarpBeacon row: dispatch migration note (magical/RESISTS,
//                           deferKill finding, heroBarrier-vs-shielding clamp note)
//   roadmap-telefrag.tmp  - new open item R108 (telefrag fatal edge: deferKill, no tail kill)
// Both are built from CURRENT HEAD (docs in the worktree are peer-owned), with unique-anchor
// assertions so a stale base fails loudly instead of writing a wrong doc.
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const repo = process.cwd();
const sh = (args) => execFileSync('git', args, { cwd: repo, maxBuffer: 32 * 1024 * 1024 }).toString('utf8');
// `git diff --no-index` exits 1 when files differ - expected here, not an error.
const diffNumstat = (a, b) => {
	const r = spawnSync('git', ['diff', '--no-index', '--numstat', a, b], { cwd: repo, encoding: 'utf8' });
	if (r.status !== null && r.status > 1) throw new Error(`git diff failed (${r.status}): ${r.stderr}`);
	return (r.stdout ?? '').trim();
};
const lf = (s) => s.replace(/\r\n/g, '\n');

// --- rows ---
const rowsHead = lf(sh(['show', 'HEAD:coverage/rows-hero-and-armor-abilities.md']));
const ROW_ANCHOR = 'enters through `enterLevel()`. Browser verification of placement';
const rowCount = rowsHead.split(ROW_ANCHOR).length - 1;
if (rowCount !== 1) throw new Error(`rows anchor found ${rowCount} times (expected 1)`);
const ROW_OLD = 'enters through `enterLevel()`. Browser verification of placement';
const ROW_NEW = 'enters through `enterLevel()`.'
	+ ' **2026-09-30 (T63 armor-abilities remainder):** the `TELEFRAG` self-hit now finishes through the shared'
	+ ' `applyCharacterDamage` hero branch instead of a hand-rolled absorb + HP write + floater.'
	+ ' The call carries the `magical` flag because `WarpBeacon.class` sits in Java\'s `AntiMagic.RESISTS`'
	+ ' (so the hero\'s AntiMagic glyph `drRoll` applies, as in Java) and carries `deferKill`, whose fatal edge'
	+ ' is an open gap: Doom\'s post-clamp x1.67 (`absorbHeroDamage`, `combatResolution.ts:1986`) still takes'
	+ ' a 6 HP hero to -2 from the clamped roll and no tail kill in `warpToBeacon` books it (reported in coord'
	+ ' #1108, open as R108, live-checked by `tools/scratch/telefrag-seam-livecheck.mjs` phase B).'
	+ ' The roll stays Java\'s `Math.min(heroDmg, heroHP-1)` measured against this port\'s `heroBarrier` pool'
	+ ' rather than Java\'s full `shielding()` sum (the difference only shows when non-barrier pools are up'
	+ ' and HP is low; the raw roll stays non-fatal either way). Browser verification of placement';
const rowsTmp = rowsHead.replace(ROW_OLD, ROW_NEW);
if (rowsTmp === rowsHead) throw new Error('rows replacement did not apply');
writeFileSync(path.join(repo, 'tools/scratch/rows-telefrag.tmp'), rowsTmp, 'utf8');

// --- roadmap: insert R108 after HEAD's R107 line ---
const mapHead = lf(sh(['show', 'HEAD:ROADMAP.md']));
const mapLines = mapHead.split('\n');
const r107 = mapLines.findIndex((l) => l.startsWith('- [ ] **R107**'));
if (r107 < 0) throw new Error('R107 line not found in HEAD ROADMAP');
if (mapLines.some((l) => l.startsWith('- [ ] **R108**'))) throw new Error('R108 already exists in HEAD ROADMAP');
const R108 = '- [ ] **R108** _(WarpBeacon telefrag fatal edge: `deferKill` with no tail kill'
	+ ' (`armorAbilityUse.ts` `warpToBeacon`))_ **Gap found 2026-09-30 (coord #1108):** the telefrag self-hit'
	+ ' routes through `applyCharacterDamage` with `deferKill: true`, but `warpToBeacon` books no tail `kill`,'
	+ ' and `absorbHeroDamage`\'s Doom multiply (`combatResolution.ts:1986`) runs *after* the Java clamp -'
	+ ' a Doomed 6 HP hero reaches -2 HP with no kill and no game over (live-checked in'
	+ ' `tools/scratch/telefrag-seam-livecheck.mjs` phase B). Every other `deferKill` call site keeps a tail'
	+ ' kill. Fix: book the fatal edge (or drop `deferKill`), turn phase B into an assertion, and drop the stale'
	+ ' "can never kill" claim in `warpToBeacon`\'s doc comment.';
mapLines.splice(r107 + 1, 0, R108);
const mapTmp = mapLines.join('\n');
writeFileSync(path.join(repo, 'tools/scratch/roadmap-telefrag.tmp'), mapTmp, 'utf8');

// --- proof: numstat tmp vs HEAD (only my lines expected) ---
const dir = mkdtempSync(path.join(tmpdir(), 'telefrag-'));
const pairs = [
	['coverage/rows-hero-and-armor-abilities.md', 'tools/scratch/rows-telefrag.tmp', 'rows.md'],
	['ROADMAP.md', 'tools/scratch/roadmap-telefrag.tmp', 'ROADMAP.md'],
];
console.log('tmp vs HEAD numstats (only my lines expected):');
for (const [headPath, tmpPath, baseName] of pairs) {
	const base = path.join(dir, baseName);
	writeFileSync(base, sh(['show', `HEAD:${headPath}`]), 'utf8');
	const out = diffNumstat(base, path.join(repo, tmpPath));
	console.log(`  ${headPath}: ${out}`);
}
console.log('OK: tmps written');
