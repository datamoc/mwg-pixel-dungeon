import { readFileSync } from 'node:fs';
const t = readFileSync('PORT_COVERAGE_I18N.md', 'utf8');
const lines = t.split('\n');
lines.forEach((l, n) => {
  if (n >= 43 && n <= 50) console.log(n + ' len=' + l.length + ' ' + JSON.stringify(l.slice(0, 100)));
});
