// Scratch: build single-line-pair patches for the two doc files (their R109
// rows sit inside multi-pair hunks with peer content). NOT committed.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('/tmp/r109', { recursive: true });

function headLines(file) {
	return execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8' }).split('\n');
}
function workLines(file) {
	return readFileSync(file, 'utf8').split('\n');
}

function pairPatch(file, oldMatch, newMatch, out, before = 3, after = 3) {
	const head = headLines(file);
	const work = workLines(file);
	const oi = head.findIndex((l) => oldMatch.test(l));
	const ni = work.findIndex((l) => newMatch.test(l));
	if (oi < 0 || ni < 0) { console.error(`${file}: anchor missing (head:${oi} work:${ni})`); process.exit(1); }
	const U = Math.max(before, after);
	const ctx = head.slice(oi - before, oi);
	const tail = head.slice(oi + 1, oi + 1 + after);
	// Sanity: worktree context around the new line must equal HEAD context.
	const wctx = work.slice(ni - before, ni);
	const wtail = work.slice(ni + 1, ni + 1 + after);
	if (JSON.stringify(ctx) !== JSON.stringify(wctx) || JSON.stringify(tail) !== JSON.stringify(wtail)) {
		console.error(`${file}: context drift - peer touched adjacent lines, abort`);
		process.exit(1);
	}
	const hunk = [
		`@@ -${oi - before + 1},${before + after + 1} +${oi - before + 1},${before + after + 1} @@`,
		...ctx.map((l) => ` ${l}`),
		`-${head[oi]}`,
		`+${work[ni]}`,
		...tail.map((l) => ` ${l}`),
	].join('\n');
	const patch = [
		`diff --git a/${file} b/${file}`,
		`--- a/${file}`,
		`+++ b/${file}`,
		hunk,
		'',
	].join('\n');
	writeFileSync(out, patch);
	console.log(`${file}: pair patch -> ${out} (head line ${oi + 1})`);
}

// ROADMAP: open R109 bullet -> closed R109 bullet (1 line before: the R107
// bullet is peer-modified, so context stops at the blank line).
pairPatch('ROADMAP.md', /^- \[ \] \*\*R109\*\*/, /^- \[x\] \*\*R109\*\*/, '/tmp/r109/ROADMAP.md.patch', 1, 3);
// Hero rows: old Cleric-system row -> new row with the R109 paragraph (the
// peer-modified WarpBeacon row sits 3 lines up, so 2 lines of context).
pairPatch('coverage/rows-hero-and-armor-abilities.md',
	/^\| The Cleric spell system entire/, /^\| The Cleric spell system entire/,
	'/tmp/r109/coverage_rows-hero-and-armor-abilities.md.patch', 2, 3);
