import { readFileSync, writeFileSync } from 'node:fs';
const fail = (m) => { console.error('EDIT MISS: ' + m); process.exit(1); };
const p = 'src/scenes/dungeon/hero/clericSpellFlows.ts';
const t = readFileSync(p, 'utf8');
const E = '\r\n';
let out = t;
// Landing fallback: Euclidean nearest (port convention for trueDistance).
{
  const a = '\t\t\t\tconst d = Roguelike.chebyshevDistance(ally, { x, y });' + E + '\t\t\t\tif (d < bestDist) { bestDist = d; best = { x, y }; }';
  if (!out.includes(a)) fail('landing nearest');
  out = out.replace(a, '\t\t\t\tconst d = Math.hypot(x - ally.x, y - ally.y);' + E + '\t\t\t\tif (d < bestDist) { bestDist = d; best = { x, y }; }');
}
// Enemy acquisition: Euclidean nearest.
{
  const a = '\t\t\t\tconst d = Roguelike.chebyshevDistance(ally, c);' + E + '\t\t\t\tif (d < bestDist) { bestDist = d; best = c; }';
  if (!out.includes(a)) fail('enemy nearest');
  out = out.replace(a, '\t\t\t\tconst d = Math.hypot(c.x - ally.x, c.y - ally.y);' + E + '\t\t\t\tif (d < bestDist) { bestDist = d; best = c; }');
  const c = '\t\t//hostile within 4 of the landing (nearest to the ally, Java\'s trueDistance' + E + '\t\t//reads as the port\'s chebyshev here - monotonic for ordering).';
  if (!out.includes(c)) fail('enemy comment');
  out = out.replace(c, '\t\t//hostile within 4 of the landing (nearest to the ally - Euclidean, Java\'s' + E + '\t\t//trueDistance, as elsewhere in this port).');
}
writeFileSync(p, out);
console.log('nearest comparisons corrected');
