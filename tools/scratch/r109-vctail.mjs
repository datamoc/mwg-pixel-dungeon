import { readFileSync } from 'node:fs';
const t = readFileSync('tools/verifyClericSpells.mjs', 'utf8');
console.log('head: ' + JSON.stringify(t.slice(0, 400)));
console.log('tail: ' + JSON.stringify(t.slice(-800)));
console.log('has readFileSync: ' + t.includes('readFileSync'));
