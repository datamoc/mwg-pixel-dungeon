import { execFileSync } from 'node:child_process';
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const t = git('show', 'HEAD:ROADMAP.md');
const i = t.indexOf('- [x] **R105**');
const j = t.indexOf('## Definition of done');
console.log(JSON.stringify(t.slice(j - 2600, j + 60)));
