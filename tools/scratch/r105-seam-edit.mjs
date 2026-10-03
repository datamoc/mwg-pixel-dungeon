import { readFileSync, writeFileSync } from 'node:fs';
const p = 'src/scenes/dungeon/attackSeams.ts';
const t = readFileSync(p, 'utf8');
const oldBlock = [
  "\t\t// `Char.attack()` (tag `v3.3.8`): a PowerOfMany-powered ally deals 1.25x melee",
  "\t\t// damage. The multiplier applies on the ordinary attack() exchange here.",
  "\t\tif (attacker.isAlly && attacker.buffs['powerOfMany'] !== undefined) {",
  "\t\t\tdamage = Math.round(damage * POWER_OF_MANY_ATTACK_FACTOR);",
  "\t\t}",
].join('\r\n');
const newBlock = [
  "\t\t//`Char.attack()` (tag `v3.3.8`): a PowerOfMany-powered ally deals 1.25x melee",
  "\t\t//damage. It folds into the roll multiplier at the `attack()` call site",
  "\t\t//(`combatResolution.ts`, R105), so it lands BEFORE the armor subtraction",
  "\t\t//like Java's pre-`defenseProc` chain - no copy may live on this tail, or a",
  "\t\t//wired T61 world would apply it twice (once in the roll, once here).",
].join('\r\n');
if (!t.includes(oldBlock)) { console.error('ANCHOR MISS'); process.exit(1); }
writeFileSync(p, t.replace(oldBlock, newBlock));
console.log('scaleAttackDamage deduped');
