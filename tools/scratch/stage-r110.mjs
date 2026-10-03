import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
// Scratch: stage the R110 slice. NOT committed.
const git = (args, input) => execFileSync('git', args, { encoding: 'utf8', input });
const head = (file) => git(['show', `HEAD:${file}`]);
const work = (file) => readFileSync(file, 'utf8');
function stageBlob(file, content) {
  const hash = git(['hash-object', '-w', '--stdin'], content).trim();
  git(['update-index', '--cacheinfo', `100644,${hash},${file}`]);
  console.log(`staged ${file} -> ${hash.slice(0, 8)}`);
}
function once(text, anchor, file) {
  const n = text.split(anchor).length - 1;
  if (n !== 1) { console.error(`${file}: anchor x${n}: ${anchor.slice(0, 80)}`); process.exit(1); }
}
for (const f of ['src/items/catalog.ts', 'src/items/displayName.ts', 'tools/verifyClericSpells.mjs']) {
  stageBlob(f, work(f));
}
// weaponSpellsGear: HEAD + the heroClass context line only.
{
  const f = 'src/scenes/dungeon/hero/weaponSpellsGear.ts';
  const h = head(f);
  const a = 'ringTypesKnown: ringTypesKnownFor(this),';
  once(h, a, f);
  const w = work(f);
  const mine = w.split('\n').find((l) => l.includes('heroClass: this.heroClass,'));
  if (!mine) { console.error('heroClass line missing in worktree'); process.exit(1); }
  // Store LF (repo norm); the worktree line may ride peer CRLF.
  const clean = mine.replace(/\r$/, '');
  stageBlob(f, h.replace(a, `${clean}\n\t\t\t${a}`));
}
// rows-items: HEAD + my appended tail row only.
{
  const f = 'coverage/rows-items-equipment-and-artifacts.md';
  const strip = (s) => { const a = s.split('\n'); return a[a.length - 1] === '' ? a.slice(0, -1) : a; };
  const h = strip(head(f));
  const w = strip(work(f));
  const myRow = w.find((l) => l.includes('(R110)'));
  if (!myRow) { console.error('R110 row missing in worktree'); process.exit(1); }
  stageBlob(f, [...h, myRow, ''].join('\n'));
}
// ROADMAP: close-pair line only.
{
  const f = 'ROADMAP.md';
  const h = head(f).split('\n');
  const w = work(f).split('\n');
  const nl = w.find((l) => l.startsWith('- [x] **R110**'));
  const oi = h.findIndex((l) => l.startsWith('- [ ] **R110**'));
  if (!nl || oi < 0) { console.error('R110 pair anchor missing'); process.exit(1); }
  h[oi] = nl;
  stageBlob(f, h.join('\n'));
}
console.log('all R110 blobs staged');
