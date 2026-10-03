export default async (game) => {
  await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout: 90000 });
  await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2500));
  await game.screenshot('tools/scratch/r109-classes.png');
  console.log('[probe] class screen captured');
};
