import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
const src = readFileSync('tools/scratch/t52-descent-probe.mjs', 'utf8');
//Grab top-level const string assignments used as eval bodies.
const consts = [...src.matchAll(/const (STATE|BFS_STEP|FRACTION_FN) = `([\s\S]*?)`;/g)];
console.log('consts found: ' + consts.map((m) => m[1]).join(','));
let bad = 0;
for (const [, name, body] of consts) {
	const flat = name === 'FRACTION_FN' ? body : body;
	try {
		new Script(`(async () => { return (${flat}\n); })`);
		console.log(name + ' expr: OK');
	} catch (e1) {
		try {
			new Script(`(async () => { ${flat} })`);
			console.log(name + ' body: OK');
		} catch (e2) {
			bad++;
			console.log(name + ' BOTH FAIL: ' + e2.message);
		}
	}
}
process.exit(bad ? 1 : 0);
