import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const TMP = process.argv[2];
// panels recheck
{
  const base = git('show', 'HEAD:src/scenes/dungeon/panelsSingleUse.ts');
  const made = readFileSync(`${TMP}/panelsSingleUse.ts`, 'utf8');
  console.log(`panels: base=${base.split('\n').length} made=${made.split('\n').length} geyserInMade=${made.includes('sourceClassResistHalf')}`);
}
// roadmap: show every line in made-but-not-in-base (by content, first 8)
{
  const base = new Set(git('show', ':ROADMAP.md').split('\n'));
  const made = readFileSync(`${TMP}/ROADMAP.md`, 'utf8').split('\n');
  const extra = made.filter((l) => !base.has(l));
  console.log(`roadmap extra lines: ${extra.length}`);
  for (const l of extra.slice(0, 8)) console.log(' + ' + JSON.stringify(l.slice(0, 120)));
  const baseSet2 = new Set(made);
  const missing = [...base].filter((l) => !baseSet2.has(l));
  console.log(`roadmap missing lines: ${missing.length}`);
  for (const l of missing.slice(0, 8)) console.log(' - ' + JSON.stringify(l.slice(0, 120)));
}
