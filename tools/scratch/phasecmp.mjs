// SCRATCH - per-phase draw COUNTS side by side, ignoring the phase-name spelling difference
// between the two sides (Java prints Java class names, the TS port prints its own kind strings).
// Reports every phase index whose count differs, which names the Java method to go read.
import { readFileSync } from 'fs';

function load(p) {
	const ph = []; let cur = null;
	for (const line of readFileSync(p, 'utf8').replace(/\r/g, '').split('\n')) {
		const mk = line.match(/^\d+ # (.*)$/);
		if (mk) { cur = { name: mk[1], n: 0 }; ph.push(cur); continue; }
		if (/^\d+ next\(/.test(line)) { if (!cur) { cur = { name: '(pre)', n: 0 }; ph.push(cur); } cur.n++; }
	}
	return ph;
}
const skip = (p) => p.name.startsWith('grassSkip') || p.name.startsWith('grassRoom') || p.name.startsWith('grassCells');
const a = load(process.argv[2]).filter(p => !skip(p));
const b = load(process.argv[3]).filter(p => !skip(p));
let bad = 0;
for (let i = 0; i < Math.max(a.length, b.length); i++) {
	const x = a[i], y = b[i];
	if (!x || !y || x.n !== y.n) {
		bad++;
		console.log(`>>> ${i}  java: ${x ? `${x.name} n=${x.n}` : '---'}  |  ts: ${y ? `${y.name} n=${y.n}` : '---'}`);
		if (bad >= Number(process.argv[4] ?? 12)) { console.log('(truncated)'); break; }
	}
}
if (!bad) console.log('all phase counts match');
