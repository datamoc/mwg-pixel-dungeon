import { execFileSync } from 'node:child_process';
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const t = git('show', 'HEAD:ROADMAP.md');
let i = -1, n = 0;
const spots = [];
while ((i = t.indexOf('\n\n\n', i + 1)) >= 0) { n++; if (spots.length < 6) spots.push(t.slice(Math.max(0, i - 60), i + 10).replace(/\n/g, '\\n')); }
console.log('tripleBlank count=' + n);
for (const s of spots) console.log(' @ ' + JSON.stringify(s));
