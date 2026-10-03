// Apply the hero-DoT seam hunks (four sites in turnLoopAiming.ts) to a target file.
// Matching is whitespace-insensitive per line (the file has legacy mis-indented
// comment lines); output indentation is rebased from each block's actual first line
// onto the authored indentation. Run twice: once on the worktree file (live test)
// and once on a dump of HEAD's file (the commit blob, excluding a peer's uncommitted
// prismatic hunks elsewhere in the same file).
import { readFileSync, writeFileSync } from 'node:fs';

const [, , target, jsonPath] = process.argv;
if (!target || !jsonPath) { console.error('usage: apply-dot-hunks.mjs <target> <json>'); process.exit(1); }
const pairs = JSON.parse(readFileSync(jsonPath, 'utf8'));
const raw = readFileSync(target, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(/\r?\n/);

for (const [i, p] of pairs.entries()) {
  const oldLines = p.old.split('\n');
  const oldTrim = oldLines.map((s) => s.trim());
  const hits = [];
  for (let j = 0; j + oldLines.length <= lines.length; j++) {
    if (lines.slice(j, j + oldLines.length).every((l, k) => l.trim() === oldTrim[k])) hits.push(j);
  }
  if (hits.length !== 1) { console.error(`FATAL: pair ${i} matched ${hits.length} times`); process.exit(1); }
  const at = hits[0];
  const actualWs = lines[at].length - lines[at].trimStart().length;
  const newLines = p.new.split('\n');
  const authoredWs = newLines[0].length - newLines[0].trimStart().length;
  const delta = actualWs - authoredWs;
  if (delta < 0) { console.error(`FATAL: pair ${i} delta ${delta} < 0`); process.exit(1); }
  const out = newLines.map((l) => '\t'.repeat(delta) + l);
  lines.splice(at, oldLines.length, ...out);
}

let src = lines.join(eol);
for (const bad of ['blockedDot', 'blockedOoze', 'blockedAscension', 'const blocked = this.absorbHeroDamage', 'absorbHeroDamage(dot)', 'absorbHeroDamage(oozeDot)']) {
  if (src.includes(bad)) { console.error(`FATAL: leftover ${bad}`); process.exit(1); }
}
if ((src.match(/applyCharacterDamage\(this\.hero/g) ?? []).length !== 4) { console.error('FATAL: expected 4 hero dispatch calls'); process.exit(1); }
if (src.replace(/\r\n/g, '').includes('\r')) { console.error('FATAL: lone CR found'); process.exit(1); }
writeFileSync(target, src, 'utf8');
console.log(`applied ${pairs.length} hunks to ${target} (${eol === '\r\n' ? 'CRLF' : 'LF'}): ${lines.length} lines`);
