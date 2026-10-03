// Apply the spirit-bow hunks (mine) to a dump of HEAD's turnLoopAiming.ts, producing a
// blob that is HEAD + my edits only - the worktree file also carries a peer's uncommitted
// prismatic-light work (wands import, fireWandShot buff line, one blank-line removal)
// which must NOT be blobbed into my commit.
import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('./bow-hunks.json', import.meta.url);
const pairs = JSON.parse(readFileSync(path, 'utf8'));
const target = new URL('./turnloop-bow.tmp', import.meta.url);
let src = readFileSync(target, 'utf8');

for (const [i, { old: oldStr, new: newStr }] of pairs.entries()) {
  const n = src.split(oldStr).length - 1;
  if (n !== 1) { console.error(`FATAL: pair ${i} matched ${n} times`); process.exit(1); }
  src = src.replace(oldStr, newStr);
}
if (src.includes('doomDamage(')) { console.error('FATAL: doomDamage call still referenced'); process.exit(1); }
if (src.includes('prismaticWandLightDuration')) {
  console.error('FATAL: peer prismatic content leaked in'); process.exit(1);
}
if (src.includes('\r')) { console.error('FATAL: CR found'); process.exit(1); }
writeFileSync(target, src, 'utf8');
console.log(`applied ${pairs.length} hunks, ${(src.match(/\n/g) ?? []).length} lines`);
