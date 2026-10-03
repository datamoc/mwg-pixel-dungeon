import { readFileSync, writeFileSync } from 'node:fs';
const f = 'ROADMAP.md';
const L = readFileSync(f, 'utf8').split('\n');
const i = L.findIndex((l) => l.startsWith('- [ ] **R029**'));
if (i < 0) { console.error('R029 bullet missing'); process.exit(1); }
L[i] += ' **Progress 2026-09-30 (R029-a):** Paladin 6/3 halves, keep-both, and the ench_name/glyph_name labels ported (pins + coverage row); the free-cast-cooldown and extends clauses were already ported.';
writeFileSync(f, L.join('\n'));
console.log('bullet noted at line ' + (i + 1));
