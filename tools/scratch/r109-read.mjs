import { readFileSync } from 'node:fs';
const show = (p, pat, before = 500, after = 500) => {
  const t = readFileSync(p, 'utf8');
  const i = t.indexOf(pat);
  console.log('=== ' + p + ' :: ' + pat + ' @' + i);
  if (i >= 0) console.log(JSON.stringify(t.slice(Math.max(0, i - before), i + after)));
};
show('src/items/displayName.ts', "spell === 'hallowedGround'");
show('src/scenes/dungeon/hero/inventoryQuickslot.ts', "spell === 'hallowedGround'");
show('src/scenes/dungeon/hero/inventoryQuickslot.ts', 'resolveFlash:');
