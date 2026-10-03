import { readFileSync, writeFileSync } from 'node:fs';

const coveragePath = 'coverage/rows-hero-and-armor-abilities.md';
let coverage = readFileSync(coveragePath, 'utf8');
const partial = '**AC_OUTFIT partially implemented (2026-09-29):**';
if (!coverage.includes(partial)) throw new Error('Rose outfit status was not in the expected state');
coverage = coverage.replace(partial, '**AC_OUTFIT ported (2026-09-29):**');
writeFileSync(coveragePath, coverage);

const roadmapPath = 'ROADMAP.md';
const roadmapRaw = readFileSync(roadmapPath, 'utf8');
const eol = roadmapRaw.includes('\r\n') ? '\r\n' : '\n';
const lines = roadmapRaw.split(/\r?\n/);
const index = lines.findIndex((line) => line.startsWith('- [ ] **R042**'));
if (index < 0) throw new Error('R042 is not open in ROADMAP.md');
lines[index] = '- [x] **R042** _(DriedRose/DriedRose.GhostHero/DriedRose.Petal (`items/artifacts/DriedRose.java` + `levels/RegularLevel.java`, tag v3.3.8))_ **Closed 2026-09-29:** `AC_OUTFIT` now equips eligible backpack weapons/armor and uses their GhostHero stats/procs; Rose-owned gear, the active ghost, defend order, and first-summon state survive save/load. The real outfit flow and weapon/armor combat were verified in Chrome. Petal cells now use Java\'s `RegularLevel.randomDropCell()` room, terrain, heap, mob, room-specific, and destructive-trap rules. The unlabeled generic fallback treats its first rectangle as entrance and the rest as standard-room stand-ins; see the documented simplification and live checks in `coverage/rows-hero-and-armor-abilities.md`.';
writeFileSync(roadmapPath, lines.join(eol));
