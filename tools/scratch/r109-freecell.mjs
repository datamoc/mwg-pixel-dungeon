import { readFileSync } from 'node:fs';
const t = readFileSync('src/items/beacon.ts', 'utf8');
const i = t.indexOf('randomFreeCellNear');
console.log(JSON.stringify(t.slice(Math.max(0, i - 1200), i + 200)));
