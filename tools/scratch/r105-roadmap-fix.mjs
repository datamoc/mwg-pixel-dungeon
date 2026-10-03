import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const fail = (m) => { console.error('FIX MISS: ' + m); process.exit(1); };
const count = (t, re) => (t.match(re) || []).length;

let text = git('show', 'HEAD:ROADMAP.md');
// 1. Drop the 2nd copies of the R106/R107 item lines (keep first).
for (const tag of ['R106', 'R107']) {
  const re = new RegExp(`^- \\[ \\] \\*\\*${tag}\\*\\*.*\n`, 'gm');
  const hits = text.match(re) || [];
  if (hits.length !== 2) fail(`${tag} copies=${hits.length}`);
  text = text.replace(re, (m, off, full) => (off === full.indexOf(m) ? m : ''));
}
// 2. Collapse the leftover double blank before R109 (scoped, must occur once).
const dbl = '\n\n\n- [ ] **R109**';
if (count(text, /\n\n\n- \[ \] \*\*R109\*\*/) !== 1) fail('r109 blank shape');
text = text.replace(dbl, '\n\r\n- [ ] **R109**');
// 3. De-double the heading (scoped, must occur once).
const dh = '## Definition of done\n## Definition of done';
if (count(text, /## Definition of done\n## Definition of done/) !== 1) fail('heading shape');
text = text.replace(dh, '## Definition of done');
// 4. Counts.
const checks = {
  r105x: count(text, /^- \[x\] \*\*R105\*\*/gm),
  r106: count(text, /^- \[ \] \*\*R106\*\*/gm),
  r107: count(text, /^- \[ \] \*\*R107\*\*/gm),
  r109: count(text, /^- \[ \] \*\*R109\*\*/gm),
  done: count(text, /^## Definition of done/gm),
  warp: count(text, /WarpBeacon telefrag/),
};
console.log(JSON.stringify(checks));
if (checks.r105x !== 1 || checks.r106 !== 1 || checks.r107 !== 1 || checks.r109 !== 1 || checks.done !== 1) fail('counts');
if (checks.warp !== 0) fail('resurrected peer R108');
// 5. The fixed R-region must match the worktree's except the peer R040 line.
const { readFileSync } = await import('node:fs');
const work = readFileSync('ROADMAP.md', 'utf8');
const region = (t) => {
  const s = t.indexOf('- [x] **R105**');
  const e = t.indexOf('## Definition of done');
  return t.slice(s, e);
};
if (region(text) !== region(work)) fail('region mismatch vs worktree');
console.log('region matches worktree (peer R040 lives outside it)');
const tmp = mkdtempSync(join(tmpdir(), 'r105fix-'));
const f = join(tmp, 'ROADMAP.md');
writeFileSync(f, text);
console.log('ROADMAP_FIX=' + git('hash-object', '-w', f).trim());
