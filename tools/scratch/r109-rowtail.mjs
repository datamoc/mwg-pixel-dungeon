import { readFileSync } from 'node:fs';
const t = readFileSync('coverage/rows-hero-and-armor-abilities.md', 'utf8');
const i = t.indexOf('`Flash`');
console.log('flash idx', i);
console.log('beaming idx', t.indexOf('BeamingRay'));
if (i >= 0) {
  const end = t.indexOf('\n|', i + 10);
  const row = t.slice(i, end);
  console.log('rowlen', row.length);
  console.log(JSON.stringify(row.slice(-700)));
}
