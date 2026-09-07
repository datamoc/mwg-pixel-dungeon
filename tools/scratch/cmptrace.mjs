// SCRATCH - compares two RNG traces by DRAW SEQUENCE ONLY (markers are asymmetric between the
// two sides, so they're used purely as context annotation, never as diff content).
import { readFileSync } from 'fs';

function load(path) {
	const draws = [];
	let lastMark = '(none)';
	for (const line of readFileSync(path, 'utf8').replace(/\r/g, '').split('\n')) {
		const mk = line.match(/^\d+ # (.*)$/);
		if (mk) { lastMark = mk[1]; continue; }
		const dm = line.match(/^\d+ (next\(\d+\)) = (-?\d+)$/);
		if (dm) draws.push({ call: dm[1], value: dm[2], mark: lastMark });
	}
	return draws;
}

const a = load(process.argv[2]);
const b = load(process.argv[3]);
console.log(`java draws: ${a.length}   ts draws: ${b.length}`);

const n = Math.min(a.length, b.length);
let first = -1;
for (let i = 0; i < n; i++) {
	if (a[i].call !== b[i].call || a[i].value !== b[i].value) { first = i; break; }
}
if (first < 0) {
	console.log(a.length === b.length
		? 'IDENTICAL draw streams'
		: `common prefix identical; length differs at draw ${n}`);
} else {
	console.log(`\nFIRST DIVERGING DRAW: #${first}`);
	console.log(`  java: ${a[first].call} = ${a[first].value}   [phase: ${a[first].mark}]`);
	console.log(`  ts  : ${b[first].call} = ${b[first].value}   [phase: ${b[first].mark}]`);
	console.log('\ncontext (java | ts):');
	for (let i = Math.max(0, first - 4); i < Math.min(n, first + 8); i++) {
		const flag = i === first ? ' <<<' : '';
		console.log(`  ${String(i).padStart(5)}  ${a[i].call}=${a[i].value.padStart(12)} [${a[i].mark}]  |  ${b[i].call}=${b[i].value.padStart(12)} [${b[i].mark}]${flag}`);
	}
}
