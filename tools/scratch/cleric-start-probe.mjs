// Probe: start a Cleric and dump console errors + scene state.
export default async (game) => {
  await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout: 90000 });
  await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2500));
  await game.eval(`scene.badges.increment('amulet', 1)`);
  await game.tap(0.210, 0.494);
  await new Promise((r) => setTimeout(r, 800));
  await game.tapText('^commencer$|^start$', { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 15000));
  const info = await game.eval(`(() => ({ ctor: scene.constructor.name, hero: !!(scene.hero || scene['hero']), keys: Object.keys(scene).slice(0, 12) }))()`);
  console.log(`[probe] ${JSON.stringify(info)}`);
  console.log(`[probe] errors=${JSON.stringify(game.consoleErrors().slice(0, 3))}`);
  console.log(`[probe] logs=${JSON.stringify(game.consoleLogs().slice(-5))}`);
};
