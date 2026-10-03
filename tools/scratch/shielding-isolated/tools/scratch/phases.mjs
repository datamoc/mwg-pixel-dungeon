// SCRATCH - per-phase draw counts on each side, to localise count mismatches.
import { readFileSync } from 'fs';

function load(path) {
	const phases = [];
	let cur = null;
	for (const line of readFileSync(path, 'utf8').replace(/\r/g, '').split('\n')) {
		const mk = line.match(/^\d+ # (.*)$/);
		if (mk) { cur = { name: mk[1], n: 0, bits: [] }; phases.push(cur); continue; }
		const dm = line.match(/^\d+ next\((\d+)\) = (-?\d+)$/);
		if (dm) {
			if (!cur) { cur = { name: '(pre)', n: 0, bits: [] }; phases.push(cur); }
			cur.n++; cur.bits.push(dm[1]);
		}
	}
	return phases;
}
const a = load(process.argv[2]);
const b = load(process.argv[3]);
const n = Math.max(a.length, b.length);
for (let i = 0; i < n; i++) {
	const x = a[i], y = b[i];
	const xs = x ? `${x.name} n=${x.n} [${x.bits.join(',')}]` : '---';
	const ys = y ? `${y.name} n=${y.n} [${y.bits.join(',')}]` : '---';
	const same = x && y && x.n === y.n && x.bits.join() === y.bits.join();
	if (process.argv[4] === 'all' || !same) console.log(`${same ? '   ' : '>>>'} ${i}\n      java: ${xs}\n      ts  : ${ys}`);
	if (!same && process.argv[4] !== 'all') { console.log('(stopping at first phase mismatch)'); break; }
}
