import { readFileSync, writeFileSync } from 'node:fs';
const p = 'src/scenes/dungeon/attackSeams.ts';
const t = readFileSync(p, 'utf8');
const oldLine = "import { POWER_OF_MANY_ATTACK_FACTOR, powerOfManyDamageFactor } from '../../simulation/clericSpells';";
const newLine = "import { powerOfManyDamageFactor } from '../../simulation/clericSpells';";
if (!t.includes(oldLine)) { console.error('ANCHOR MISS'); process.exit(1); }
writeFileSync(p, t.replace(oldLine, newLine));
console.log('import trimmed');
