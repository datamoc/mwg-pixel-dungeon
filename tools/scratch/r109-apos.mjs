import { readFileSync, writeFileSync } from 'node:fs';
const p = 'src/scenes/floorState.ts';
const t = readFileSync(p, 'utf8');
const bad = 'beamingRayTarget?: string | null;';
if (!t.includes('boosted ally')) { console.error('anchor gone'); process.exit(1); }
const fixed = t.replace(/the boosted ally\u2019s target/, "the boosted ally's target");
if (fixed === t) { console.error('no fancy quote found'); process.exit(1); }
writeFileSync(p, fixed);
console.log('apostrophe normalized');
