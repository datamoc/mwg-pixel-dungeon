// Probe v4: step logging to find the hang.
export default async (game) => {
  console.log('[probe] waiting for app');
  await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout: 90000 });
  console.log('[probe] tapping enter');
  await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 90000 });
  console.log('[probe] sleeping');
  await new Promise((r) => setTimeout(r, 2500));
  console.log('[probe] simple eval');
  const ctor = await game.eval(`scene.constructor.name`);
  console.log(`[probe] ctor=${JSON.stringify(ctor)}`);
  console.log('[probe] badges eval');
  const badged = await game.eval(`!!(scene.badges && scene.badges.increment)`);
  console.log(`[probe] hasIncrement=${JSON.stringify(badged)}`);
  console.log('[probe] calling increment');
  const inc = await game.eval(`scene.badges.increment('victory', 1)`);
  console.log(`[probe] inc=${JSON.stringify(inc)}`);
  console.log('[probe] unlocked check');
  const un = await game.eval(`scene.badges.unlocked('victory')`);
  console.log(`[probe] unlocked=${JSON.stringify(un)}`);
};
