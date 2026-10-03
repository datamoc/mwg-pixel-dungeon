import { readFileSync, writeFileSync } from 'node:fs';
const f = 'src/items/catalog.ts';
const L = readFileSync(f, 'utf8').split('\n');
const idx = [];
L.forEach((l, n) => { if (l.includes("cleric: 'cudgel'")) idx.push(n); });
console.log('cudgel lines: ' + JSON.stringify(idx));
// Drop the second copy (lines idx[1]-3 .. idx[1], the 3 comment lines + entry).
if (idx.length === 2) {
  L.splice(idx[1] - 3, 4);
  writeFileSync(f, L.join('\n'));
  console.log('duplicate removed');
} else {
  console.log('nothing to do');
}
