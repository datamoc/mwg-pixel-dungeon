// Build HEAD-blob + own-hunk splices for the R061 closure commit, so the peer-shared
// files (ROADMAP.md, CLOSED.md, coverage/rows-items-equipment-and-artifacts.md) are
// committed with ONLY this session's changes (AGENTS.md private-index protocol).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const cat = (p) => execFileSync('git', ['cat-file', 'blob', `HEAD:${p}`], { maxBuffer: 1 << 28 }).toString('utf8');
mkdirSync('tools/scratch/r061', { recursive: true });

// --- ROADMAP.md: delete the R061 open line only -----------------------------
let roadmap = cat('ROADMAP.md');
const r061Line = roadmap.split(/\r?\n/).filter((l) => l.startsWith('- [ ] **R061** '));
if (r061Line.length !== 1) throw new Error(`expected exactly 1 open R061 line in HEAD ROADMAP, got ${r061Line.length}`);
const r061 = r061Line[0];
roadmap = roadmap.replace(new RegExp(r061.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\r?\\n'), '');
if (roadmap.includes('**R061**')) throw new Error('R061 still present after deletion');
writeFileSync('tools/scratch/r061/ROADMAP.md', roadmap);

// --- CLOSED.md: append the R061 closure entry after HEAD's tail -------------
let closed = cat('CLOSED.md');
if (closed.includes('**R061**')) throw new Error('HEAD CLOSED.md already carries R061');
if (!closed.endsWith('\n')) closed += '\n';
const entry = readFileSync('tools/scratch/r061-closed-entry.md', 'utf8').replace(/^\n+/, '');
closed += '\n' + entry;
writeFileSync('tools/scratch/r061/CLOSED.md', closed);

// --- coverage row: the three stale clauses R061's closure corrects -----------
let rows = cat('coverage/rows-items-equipment-and-artifacts.md');
const old1 = "but skips Java's `Level.pressCell` hook here and applies the supported Arcane Vision leg of `tryForWandProc` (the port's all-mobs Mind Vision stand-in); Warlock SoulMark and other Wand procs remain absent), `SpawnRegrowth` (seeds Java's volume 30 at the collision cell; the persisted Regrowth field uses Java's Blob evolution, grows grass/high grass and roots occupants. **Simplified:** the port's coarse terrain grid collapses Java's `EMPTY_DECO` into floor and `FURROWED_GRASS` into high grass; Java's `Level.pressCell` on empty cells remains absent; supported Arcane Vision procs run through the port's all-mobs Mind Vision stand-in, while Warlock SoulMark and other Wand procs remain absent)";
const new1 = "but skips Java's `Level.pressCell` hook here and, at the collision cell, runs Java's whole `tryForWandProc` -> `Wand.wandProc` tail (`Arcane Vision` per-target mark, Warlock SoulMark, Priest-detonate/Searing-Light/Sunray-blind - full tail closed 2026-10-01, R061)), `SpawnRegrowth` (seeds Java's volume 30 at the collision cell; the persisted Regrowth field uses Java's Blob evolution, grows grass/high grass and roots occupants. **Simplified:** the port's coarse terrain grid collapses Java's `EMPTY_DECO` into floor and `FURROWED_GRASS` into high grass; Java's `Level.pressCell` on empty cells remains absent; its `tryForWandProc` runs the full `Wand.wandProc` tail since 2026-10-01 (R061))";
const old2 = "`positiveOnly`'s ally exemption and `tryForWandProc`'s generic wand-glyph reaction hook are never reachable from WildMagic and are not modeled, matching every other tier's stated convention.";
const new2 = "`positiveOnly`'s ally exemption is never reachable from WildMagic and is not modeled, matching every other tier's stated convention; this effect's own `tryForWandProc` call runs the full `Wand.wandProc` tail since 2026-10-01 (R061).";
const old3 = "(open residual moved to `ROADMAP.md` R061) `RandomWand` inherits `fireWandShot`'s own `magicImmune` guard";
const new3 = "(R061 closed 2026-10-01) `RandomWand` inherits `fireWandShot`'s own `magicImmune` guard";
for (const [oldS, newS] of [[old1, new1], [old2, new2], [old3, new3]]) {
	const n = rows.split(oldS).length - 1;
	if (n !== 1) throw new Error(`expected exactly 1 match, got ${n}: ${oldS.slice(0, 60)}...`);
	rows = rows.replace(oldS, newS);
}
if (rows.includes('open residual moved to `ROADMAP.md` R061')) throw new Error('stale R061 residual pointer left in row');
writeFileSync('tools/scratch/r061/rows-items-equipment-and-artifacts.md', rows);

console.log('splices written: tools/scratch/r061/{ROADMAP.md,CLOSED.md,rows-items-equipment-and-artifacts.md}');
