import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const fail = (m) => { console.error('HUNK MISS: ' + m); process.exit(1); };
const tmp = mkdtempSync(join(tmpdir(), 'r105blobs-'));

// panels: HEAD + import + dispatch block (block end = its own doubly-indented close).
{
  const base = git('show', 'HEAD:src/scenes/dungeon/panelsSingleUse.ts');
  const work = readFileSync('src/scenes/dungeon/panelsSingleUse.ts', 'utf8');
  const E = base.includes('\r\n') ? '\r\n' : '\n';
  const WE = work.includes('\r\n') ? '\r\n' : '\n';
  const oldImp = "import { recallTrackerDuration } from '../../simulation/clericSpells';";
  if (!base.includes(oldImp)) fail('panels HEAD import');
  const newImp = "import { powerOfManyDamageFactor, recallTrackerDuration } from '../../simulation/clericSpells';";
  const startMark = '//`Char.damage()` (tag `v3.3.8`): a PowerOfMany-powered defender';
  const endMark = "powerOfManyDamageFactor(this.talentRank('life_link')));" + WE + '\t\t}';
  const s = work.indexOf(startMark);
  const e = work.indexOf(endMark, s);
  if (s < 0 || e < 0) fail('panels worktree block bounds');
  const block = work.slice(s, e + endMark.length).split(WE).join(E);
  if (block.split(E).length > 12) fail('panels block too long: ' + block.split(E).length);
  const aura = 'if (!options.skipAura) damage = this.auraProtectedDamage(c, damage);' + E;
  if (!base.includes(aura)) fail('panels HEAD aura line');
  const out = base.replace(oldImp, newImp).replace(aura, aura + block + E);
  const f = join(tmp, 'panelsSingleUse.ts');
  writeFileSync(f, out);
  console.log('PANELS=' + git('hash-object', '-w', f).trim());
}

// roadmap diff diagnostic + rebuild only if needed.
{
  const base = git('show', ':ROADMAP.md');
  console.log('index EOL=' + JSON.stringify(base.includes('\r\n') ? 'CRLF' : 'LF'));
  const i = base.indexOf('- [ ] **R105**');
  console.log('index R105 context: ' + JSON.stringify(base.slice(i - 30, i + 60)));
}
console.log('TMP=' + tmp);
