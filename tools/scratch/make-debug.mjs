import { readFileSync, writeFileSync } from 'node:fs';
let d = readFileSync('tools/browserTest.mjs', 'utf8');
d = d.replace(
	'async eval(code) { const raw = await b.evaluate(wrapEval(code));',
	'async eval(code) { console.error("EVAL-IN:" + JSON.stringify(code).slice(0, 300)); const raw = await b.evaluate(wrapEval(code));',
);
d = d.replace(
	"const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');",
	"const ROOT = 'C:/Users/miche/dev/mwg-pixel-dungeon';",
);
writeFileSync('tools/scratch/bt-debug.mjs', d);
console.log('copy written');
