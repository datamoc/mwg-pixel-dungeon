import { readFileSync, writeFileSync } from 'node:fs';
const p = 'src/scenes/dungeon/hero/clericSpellFlows.ts';
const t = readFileSync(p, 'utf8');
const bad = 'beamingRayBoostFactor, beamingRayRange,';
if (!t.includes(bad)) { console.error('anchor gone'); process.exit(1); }
writeFileSync(p, t.replace(bad, 'beamingRayRange,'));
console.log('unused import dropped');
