import { readFileSync } from 'node:fs';
for (const p of ['ROADMAP.md', 'coverage/rows-monsters-bosses-and-combat.md', 'tools/verifyCombat.mjs', 'src/scenes/dungeon/panelsSingleUse.ts']) {
  const t = readFileSync(p, 'utf8');
  let cr = 0;
  for (const c of t) if (c === '\r') cr++;
  console.log(p, 'CR=' + cr, 'len=' + t.length);
}
