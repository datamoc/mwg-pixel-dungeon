import { readFileSync, writeFileSync } from 'node:fs';
const f = 'src/scenes/dungeon/hero/weaponSpellsGear.ts';
let t = readFileSync(f, 'utf8');
// During scene create() -> buildInterface() the hero does not exist yet, so
// the buff reads must tolerate an absent hero (found live: Cleric start died
// in refreshInventoryPanel).
const pairs = [
  ["holyWeaponUp: this.hero.buffs['holyWeapon'] !== undefined", "holyWeaponUp: this.hero?.buffs['holyWeapon'] !== undefined"],
  ["holyWardUp: this.hero.buffs['holyWard'] !== undefined", "holyWardUp: this.hero?.buffs['holyWard'] !== undefined"],
];
for (const [a, b] of pairs) {
  if (t.split(a).length !== 2) { console.error('anchor off: ' + a); process.exit(1); }
  t = t.replace(a, b);
}
writeFileSync(f, t);
console.log('guarded');
