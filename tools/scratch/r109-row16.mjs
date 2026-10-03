import { readFileSync } from 'node:fs';
const t = readFileSync('coverage/rows-hero-and-armor-abilities.md', 'utf8');
const row = t.split('\n')[16];
console.log('has Flash: ' + row.includes('Flash'));
console.log('tail: ' + JSON.stringify(row.slice(-800)));
