import { readFileSync } from 'node:fs';
const t = readFileSync('tools/verifyClericSpells.mjs', 'utf8');
const i = t.indexOf('export function verifyClericSpells');
console.log(JSON.stringify(t.slice(i, i + 2500)));
