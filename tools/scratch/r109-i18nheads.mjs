import { readFileSync } from 'node:fs';
const t = readFileSync('PORT_COVERAGE_I18N.md', 'utf8');
const lines = t.split('\n');
console.log('total: ' + lines.length);
lines.forEach((l, n) => {
  if (l.startsWith('| ') && n > 21) console.log(n + ' len=' + l.length + ' head=' + JSON.stringify(l.slice(0, 90)));
});
