import { readFileSync, writeFileSync } from 'node:fs';
// R110: wielded starting gear names its raw id (found live during R029-a:
// the imbued label wrapped "startingWeapon", whose class never resolves).
const f = 'ROADMAP.md';
const L = readFileSync(f, 'utf8').split('\n');
const i = L.findIndex((l) => l.includes('**R109**'));
if (i < 0) { console.error('R109 anchor missing'); process.exit(1); }
L.splice(i + 1, 0, '- [ ] **R110** _(Wielded starting-gear base name)_ The equipped `startingWeapon`/`startingArmor` read as their raw ids (`itemDisplayName` only consults the slot class tracker for minted `weaponReward`/`armorReward`). Java names the class (club/cudgel, cloth armor). Found live 2026-09-30 while the R029-a imbued label wrapped the unresolved id.');
writeFileSync(f, L.join('\n'));
console.log('R110 added after line ' + (i + 1));
