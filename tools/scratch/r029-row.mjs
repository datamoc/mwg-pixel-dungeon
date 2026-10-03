import { readFileSync, writeFileSync } from 'node:fs';
const f = 'coverage/rows-hero-and-armor-abilities.md';
let t = readFileSync(f, 'utf8');
const a = 'Pinned by two ';
const i = t.lastIndexOf(a);
if (i < 0) { console.error('anchor missing'); process.exit(1); }
const tail = 'Pinned by two `verifyClericSpells` checks and the R029 `verifyCombat` check; **live-verified 2026-09-30** (`tools/scratch/r029a-lv.mjs`): paired live hero hits run +3.4 paladin-over-priest (band 2-6, Java 4), the wielded label applies through `ench_name`, screenshot inspected, no console errors - which also caught a start crash (`itemDisplayContext` read `hero.buffs` before the hero exists during `buildInterface`; now guarded). Opened R110 for the wielded starting-gear base name reading as its raw id. R029 stays open (tier-4, Sunray/artifactProc hooks, SearingLightCooldown zap, shield -1, non-Cleric Satiated delay; the free-cast cooldown and extends were already ported). |';
const end = t.indexOf(' |', i);
if (end < 0) { console.error('row end missing'); process.exit(1); }
t = t.slice(0, i) + tail + t.slice(end + 2);
writeFileSync(f, t);
console.log('row updated');
