import { readFileSync, writeFileSync } from 'node:fs';
const p = 'tools/scratch/r109-cast-lv.mjs';
const t = readFileSync(p, 'utf8');
const oldStart = '  await game.startGame({ hero: 5 });';
const newStart = [
  '  //Cleric start by hand: the shared startGame() slot-5 fraction misses the',
  '  //bottom-right class icon (read off a captured class screen: centre ~(0.210, 0.494)).',
  "  await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout: 90000 });",
  "  await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 90000 });",
  '  await new Promise((r) => setTimeout(r, 2500));',
  '  await game.tap(0.210, 0.494);',
  '  await new Promise((r) => setTimeout(r, 800));',
  "  await game.tapText('^commencer$|^start$', { timeout: 90000 });",
  "  await game.waitFor('!!(window.__MWG__.currentScene && window.__MWG__.currentScene[\"hero\"] && window.__MWG__.currentScene[\"creatures\"])', { timeout: 90000 });",
].join('\n');
if (!t.includes(oldStart)) { console.error('anchor gone'); process.exit(1); }
writeFileSync(p, t.replace(oldStart, newStart));
console.log('manual cleric start installed');
