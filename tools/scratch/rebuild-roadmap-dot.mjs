// Rebase my ROADMAP DoT edits onto the current HEAD's ROADMAP.md.
// The existing tools/scratch/roadmap-dot.tmp was built as (23735e8f + my 2 edits);
// peers changed ROADMAP.md since (at hunks disjoint from mine). Derive my two edits
// from the old base + tmp, apply them textually to `git show HEAD:ROADMAP.md`,
// rewrite the tmp as HEAD+mine, and prove the delta vs HEAD is exactly 2+/1-.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const repo = 'C:/Users/miche/dev/mwg-pixel-dungeon';
const OLD_BASE = '23735e8f';
const TMP = join(repo, 'tools/scratch/roadmap-dot.tmp');

const sh = (cmd) => execSync(cmd, { cwd: repo, maxBuffer: 1 << 28 });
const show = (spec) => sh(`git show ${spec}`).toString('utf8');
const count = (h, s) => h.split(s).length - 1;

const oldBase = show(`${OLD_BASE}:ROADMAP.md`);
const newBase = show('HEAD:ROADMAP.md');
const tmp = readFileSync(TMP, 'utf8');

const grab = (text, id, label) => {
  const m = text.match(new RegExp(`^- \\[ \\] \\*\\*R${id}\\*\\*.*$`, 'm'));
  if (!m) throw new Error(`${label}: R${id} line not found`);
  return m[0];
};
const oldR001 = grab(oldBase, '001', 'oldBase');
const newR001 = grab(tmp, '001', 'tmp');
const r096 = grab(oldBase, '096', 'oldBase');
const r097 = grab(tmp, '097', 'tmp');
if (oldR001 === newR001) throw new Error('my R001 edit missing from tmp');
if (count(oldBase, oldR001) !== 1) throw new Error('oldR001 not unique in oldBase');
if (count(newBase, oldR001) !== 1) throw new Error('oldR001 not unique in HEAD ROADMAP (peer edited R001?)');
if (count(newBase, r096) !== 1) throw new Error('R096 anchor not unique in HEAD ROADMAP');
if (newBase.includes(r097)) throw new Error('HEAD already has R097');

const out = newBase.replace(oldR001, newR001).replace(r096, r096 + '\n' + r097);
if (count(out, newR001) !== 1) throw new Error('R001 replacement did not land');
if (count(out, r097) !== 1) throw new Error('R097 insertion did not land');
writeFileSync(TMP, out, 'utf8');

// Prove: new tmp vs HEAD's ROADMAP == exactly my 2 insertions + 1 deletion.
const d = mkdtempSync(join(tmpdir(), 'rmchk-'));
const f = join(d, 'head-roadmap.md');
writeFileSync(f, newBase, 'utf8');
let v = '';
try {
  sh(`git diff --no-index --numstat "${f}" "${TMP.replace(/\\/g, '/')}"`);
} catch (e) {
  v = (e.stdout || '').toString('utf8');
}
rmSync(d, { recursive: true, force: true });
const line = v.trim();
if (!line.startsWith('2\t1\t')) {
  throw new Error(`unexpected delta vs HEAD: "${line}"`);
}
console.log('OK rebuilt; delta vs HEAD numstat:');
console.log(line);
