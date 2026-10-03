import { readFileSync, writeFileSync } from 'node:fs';

// ROADMAP: R108 (collides with HEAD's WarpBeacon R108) -> R109.
{
  const p = 'ROADMAP.md';
  const t = readFileSync(p, 'utf8');
  const a = 'stays open as R108.';
  const b = '- [ ] **R108** _(Cleric `BeamingRay`';
  if (!t.includes(a) || !t.includes(b)) { console.error('RM ANCHOR MISS'); process.exit(1); }
  writeFileSync(p, t.replace(a, 'stays open as R109.').replace(b, '- [ ] **R109** _(Cleric `BeamingRay`'));
  console.log('roadmap R109');
}
// Coverage clause: (R108) -> (R109).
{
  const p = 'coverage/rows-monsters-bosses-and-combat.md';
  const t = readFileSync(p, 'utf8');
  const a = 'stays unported with the rest of that spell (R108).';
  if (!t.includes(a)) { console.error('ROW ANCHOR MISS'); process.exit(1); }
  writeFileSync(p, t.replace(a, 'stays unported with the rest of that spell (R109).'));
  console.log('coverage R109');
}
