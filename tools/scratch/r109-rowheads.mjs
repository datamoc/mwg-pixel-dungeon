import { readFileSync } from 'node:fs';
const t = readFileSync('coverage/rows-hero-and-armor-abilities.md', 'utf8');
const lines = t.split('\n');
lines.forEach((l, n) => console.log(n + ' len=' + l.length + ' head=' + JSON.stringify(l.slice(0, 70))));
