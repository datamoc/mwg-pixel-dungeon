// Build R105 blobs with ONLY this session's hunks (peer T63-geyser and R040
// hunks stay in the worktree, out of the commit). Prints hashes; the actual
// index write + commit-tree + update-ref run in the shell step.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const EOLof = (t) => (t.includes('\r\n') ? '\r\n' : '\n');
const fail = (m) => { console.error('HUNK MISS: ' + m); process.exit(1); };
const tmp = mkdtempSync(join(tmpdir(), 'r105blobs-'));

// --- panelsSingleUse.ts: HEAD + import + dispatch block ---
{
  const base = git('show', 'HEAD:src/scenes/dungeon/panelsSingleUse.ts');
  const work = readFileSync('src/scenes/dungeon/panelsSingleUse.ts', 'utf8');
  const E = EOLof(base);
  const oldImp = "import { recallTrackerDuration } from '../../simulation/clericSpells';";
  if (!base.includes(oldImp)) fail('panels HEAD import');
  const newImp = "import { powerOfManyDamageFactor, recallTrackerDuration } from '../../simulation/clericSpells';";
  if (!work.includes(newImp)) fail('panels worktree import');
  const blockStart = work.indexOf('//`Char.damage()` (tag `v3.3.8`): a PowerOfMany-powered defender');
  if (blockStart < 0) fail('panels worktree block');
  const blockEnd = work.indexOf(EOLof(work) + '\t}', blockStart);
  if (blockEnd < 0) fail('panels worktree block end');
  const block = work.slice(blockStart, blockEnd).split(EOLof(work)).join(E);
  const aura = 'if (!options.skipAura) damage = this.auraProtectedDamage(c, damage);' + E;
  if (!base.includes(aura)) fail('panels HEAD aura line');
  if (base.includes(block.slice(0, 60))) fail('panels HEAD already has block');
  const out = base.replace(oldImp, newImp).replace(aura, aura + block + E);
  const f = join(tmp, 'panelsSingleUse.ts');
  writeFileSync(f, out);
  console.log('PANELS=' + git('hash-object', '-w', f).trim());
}

// --- verifyCombat.mjs: HEAD + R105 check only ---
{
  const base = git('show', 'HEAD:tools/verifyCombat.mjs');
  const work = readFileSync('tools/verifyCombat.mjs', 'utf8');
  const E = EOLof(base);
  const startMark = "\tcheck('PowerOfMany factors sit at Java pre/post-DR order on every attack path (R105)'";
  const s = work.indexOf(startMark);
  if (s < 0) fail('verify worktree check');
  const WE = EOLof(work);
  const e = work.indexOf(WE + '\t});', s);
  if (e < 0) fail('verify worktree check end');
  const check = work.slice(s, e + WE.length + '\t});'.length).split(WE).join(E);
  const anchor = "\tcheck('Mob.add(Amok) wakes sleeping mobs directly into HUNTING'";
  if (!base.includes(anchor)) fail('verify HEAD anchor');
  if (base.includes(startMark)) fail('verify HEAD already has check');
  const out = base.replace(anchor, check + E + anchor);
  const f = join(tmp, 'verifyCombat.mjs');
  writeFileSync(f, out);
  console.log('VERIFY=' + git('hash-object', '-w', f).trim());
}

// --- ROADMAP.md: INDEX + R105 flip + R109 insert (preserves peer staged R108 removal) ---
{
  const base = git('show', ':ROADMAP.md');
  const work = readFileSync('ROADMAP.md', 'utf8');
  const E = EOLof(base);
  const WE = EOLof(work);
  const openMark = '- [ ] **R105** _(Shared attack/damage modifiers missing from dispatch)_';
  if (!base.includes(openMark)) fail('roadmap index R105 open');
  if (base.includes('- [x] **R105**')) fail('roadmap index already closed');
  const cs = work.indexOf('- [x] **R105**');
  if (cs < 0) fail('roadmap worktree closed');
  const ce = work.indexOf(WE, cs);
  const closedLine = work.slice(cs, ce).split(WE).join(E);
  const rs = work.indexOf('- [ ] **R109**');
  if (rs < 0) fail('roadmap worktree R109');
  const re = work.indexOf(WE, rs);
  const r109Line = work.slice(rs, re).split(WE).join(E);
  if (base.includes('BeamingRay') && base.includes('R109')) fail('roadmap index already has R109');
  // replace the whole open line: find its end
  const os = base.indexOf('- [ ] **R105**');
  const oe = base.indexOf(E, os);
  if (os < 0 || oe < 0) fail('roadmap index open line bounds');
  let out = base.slice(0, os) + closedLine + base.slice(oe);
  const doneMark = E + '## Definition of done';
  if (!out.includes(doneMark)) fail('roadmap index done marker');
  out = out.replace(doneMark, E + r109Line + E + '## Definition of done');
  const f = join(tmp, 'ROADMAP.md');
  writeFileSync(f, out);
  console.log('ROADMAP=' + git('hash-object', '-w', f).trim());
}
console.log('TMP=' + tmp);
