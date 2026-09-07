// SCRATCH - splits the Java and TS dumps into per-(seed,depth) blocks and diffs their tile maps.
//
// Two parsing hazards, both of which produced WRONG answers in earlier revisions:
//  1. On a Feeling.CHASM floor, CHASM renders as a SPACE, so a map row can be entirely blank and
//     rows can have meaningful trailing spaces. Dropping blank rows / right-trimming silently
//     mangled every chasm floor (42:9 read as 20x52 instead of its real 35x56, making its
//     cell-diff count meaningless). Rows are kept verbatim and padded instead.
//  2. Summary lines are indented by two spaces just like map rows, so they must be filtered by
//     their known prefixes - NOT by "third character is a letter", since legitimate map glyphs
//     include w/W/L/P/X/s/B/A/C. That heuristic reported 51 phantom differing cells on 42:2,
//     a floor whose maps are in fact byte-identical.
import { readFileSync } from 'fs';

const SUMMARY = /^ {2}(room kinds:|room rects:|door types)/;

function parse(text) {
	const blocks = new Map();
	let key = null, header = null, rows = [];
	const flush = () => { if (key) blocks.set(key, { header, rows }); };
	for (const line of text.split('\n')) {
		const m = line.match(/^seed=(\d+) depth=(\d+)/);
		if (m) { flush(); key = `${m[1]}:${m[2]}`; header = line.trim(); rows = []; continue; }
		if (!key) continue;
		if (SUMMARY.test(line)) continue;
		if (!/^ {2}/.test(line)) continue;
		rows.push(line.slice(2));
	}
	flush();
	for (const b of blocks.values()) {
		while (b.rows.length && b.rows[b.rows.length - 1].trim() === '') b.rows.pop();
		const w = b.rows.length ? Math.max(...b.rows.map(r => r.length)) : 0;
		b.rows = b.rows.map(r => r.padEnd(w, ' '));
	}
	return blocks;
}

const java = parse(readFileSync(process.argv[2], 'utf8').replace(/\r/g, ''));
const ts = parse(readFileSync(process.argv[3], 'utf8').replace(/\r/g, ''));

let exact = 0, total = 0;
for (const [key, j] of java) {
	const t = ts.get(key);
	total++;
	if (!t) { console.log(`${key}: MISSING in TS`); continue; }
	const jm = j.rows.join('\n'), tm = t.rows.join('\n');
	if (jm === tm) { exact++; console.log(`${key}: MAP EXACT MATCH (${j.rows.length} rows)`); continue; }
	if (j.rows.length !== t.rows.length || j.rows[0].length !== t.rows[0].length) {
		console.log(`${key}: SIZE DIFF java ${j.rows[0]?.length}x${j.rows.length} vs ts ${t.rows[0]?.length}x${t.rows.length}`);
		continue;
	}
	let diffCells = 0; const kinds = new Map();
	for (let y = 0; y < j.rows.length; y++) {
		const a = j.rows[y], b = t.rows[y];
		for (let x = 0; x < a.length; x++) {
			if (a[x] !== b[x]) {
				diffCells++;
				const k = `${a[x] ?? '_'}->${b[x] ?? '_'}`;
				kinds.set(k, (kinds.get(k) ?? 0) + 1);
			}
		}
	}
	const summary = [...kinds.entries()].sort((p, q) => q[1] - p[1]).map(([k, n]) => `${k}:${n}`).join(' ');
	console.log(`${key}: ${diffCells} cells differ (same ${j.rows[0].length}x${j.rows.length}) | ${summary}`);
}
console.log(`\n${exact}/${total} maps byte-identical`);
