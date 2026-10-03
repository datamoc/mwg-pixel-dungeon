import { readFileSync, writeFileSync } from 'node:fs';
// R110 row + bullet close.
{
  const f = 'coverage/rows-items-equipment-and-artifacts.md';
  let t = readFileSync(f, 'utf8');
  if (!t.endsWith('\n')) t += '\n';
  t += '| Run-start weapon base name (R110) | `src/items/catalog.ts` (`STARTING_WEAPON_CLASS`), `src/items/displayName.ts`, `src/scenes/dungeon/hero/weaponSpellsGear.ts` (`itemDisplayContext`) | **Ported (2026-09-30):** the wielded `startingWeapon` names its Java class per hero class (`HeroClass.initHero()`, tag `v3.3.8`), including the Cleric cudgel via its own `port.name.cudgel` key (all locales) since it has no authored class row. Pinned by the R110 `verifyClericSpells` check; live-verified with the R029-a script (wielded base reads `une trique`, imbued wraps it). |\n';
  writeFileSync(f, t);
  console.log('row appended');
}
{
  const f = 'ROADMAP.md';
  const L = readFileSync(f, 'utf8').split('\n');
  const i = L.findIndex((l) => l.startsWith('- [ ] **R110**'));
  if (i < 0) { console.error('R110 bullet missing'); process.exit(1); }
  L[i] = L[i].replace('- [ ] **R110**', '- [x] **R110**') + ' **Closed 2026-09-30:** class-per-hero naming ported (pins + coverage row + live check).';
  writeFileSync(f, L.join('\n'));
  console.log('R110 closed at line ' + (i + 1));
}
