import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
// Rebuild fixed text (same steps), then show first divergence vs worktree region.
let text = git('show', 'HEAD:ROADMAP.md');
for (const tag of ['R106', 'R107']) {
  const re = new RegExp(`^- \\[ \\] \\*\\*${tag}\\*\\*.*\n`, 'gm');
  text = text.replace(re, (m, off, full) => (off === full.indexOf(m) ? m : ''));
}
text = text.replace('\n\n\n- [ ] **R109**', '\n\n- [ ] **R109**');
text = text.replace('## Definition of done\n## Definition of done', '## Definition of done');
const work = readFileSync('ROADMAP.md', 'utf8');
const region = (t) => t.slice(t.indexOf('- [x] **R105**'), t.indexOf('## Definition of done'));
const a = region(text), b = region(work);
let i = 0;
while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
console.log('alen', a.length, 'blen', b.length, 'firstDiff', i);
console.log('fixed  : ' + JSON.stringify(a.slice(Math.max(0, i - 80), i + 80)));
console.log('worktree: ' + JSON.stringify(b.slice(Math.max(0, i - 80), i + 80)));
