import { readFileSync } from 'node:fs';
const src = readFileSync('tools/scratch/t52-descent-probe.mjs', 'utf8');
const fn = src.match(/const FRACTION_FN = `([\s\S]*?)`;/)[1];
const spliced = `(${fn})(26, 24)`;
console.log('head: ' + JSON.stringify(spliced.slice(0, 60)));
console.log('tail: ' + JSON.stringify(spliced.slice(-60)));
console.log('opens: (=' + (spliced.match(/\(/g) || []).length + ' {=' + (spliced.match(/\{/g) || []).length);
console.log('closes: )=' + (spliced.match(/\)/g) || []).length + ' }=' + (spliced.match(/\}/g) || []).length);
