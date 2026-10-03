import { readFileSync, writeFileSync } from 'node:fs';
const fail = (m) => { console.error('EDIT MISS: ' + m); process.exit(1); };
const p = 'src/scenes/dungeon/hero/clericSpellFlows.ts';
const t = readFileSync(p, 'utf8');
const E = '\r\n';
let out = t;
// 1. Step type.
{
  const a = 'import { addBuff, BUFF_DURATION, doomDamage, NEGATIVE_BUFFS, type BuffId, type Creature } from';
  if (!out.includes(a)) fail('combat import');
  out = out.replace(a, 'import { addBuff, BUFF_DURATION, doomDamage, NEGATIVE_BUFFS, type BuffId, type Creature, type Step } from');
}
// 2. Solidity proxy (the port has no solid[] map; teleports treat passable as enterable).
{
  const a = '\t\tlet landing: Step | undefined = !this.level.solid(cell.x, cell.y)';
  if (!out.includes(a)) fail('solid');
  out = out.replace(a, '\t\t//No `solid[]` map exists here; `passable` is the enterability test every port teleport uses.'
    + E + '\t\tlet landing: Step | undefined = !this.level.passable(cell.x, cell.y)');
}
// 3. Null-tolerant occupant.
{
  const a = '\t\tconst occupant = this.creatureAt(cell.x, cell.y);';
  if (!out.includes(a)) fail('occupant');
  out = out.replace(a, '\t\tconst occupant = this.creatureAt(cell.x, cell.y) ?? undefined;');
}
writeFileSync(p, out);
console.log('resolve fixes applied');
