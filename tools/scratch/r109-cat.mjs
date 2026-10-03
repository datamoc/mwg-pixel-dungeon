import { readFileSync } from 'node:fs';
const roots = ['src/scenes/dungeonScene.ts'];
for (const p of roots) {
  const t = readFileSync(p, 'utf8');
  const i = t.indexOf('creatureAt(x: number, y: number)');
  if (i >= 0) console.log(p, JSON.stringify(t.slice(i, i + 120)));
}
