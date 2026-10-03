// R041 part 3: daily confirm flow (date label) + chevron fade/restore.
export default async (game) => {
  const meta = JSON.stringify({ meta: { version: 1, savedAt: Date.now() }, state: { counts: [['bag_velvet', 1], ['amulet', 1]] } });
  await game.eval(`localStorage.setItem('mwg-save:spd-meta:meta', '${meta}')`);
  await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2500));
  await game.tap(0.098, 0.344);
  await new Promise((r) => setTimeout(r, 1200));
  // Chevron fade: tap chevron, UI must fade; tap empty canvas, UI restores.
  await game.tap(0.071, 0.920);
  await new Promise((r) => setTimeout(r, 1200));
  await game.screenshot('r041-faded.png');
  await game.tap(0.65, 0.4);
  await new Promise((r) => setTimeout(r, 1200));
  await game.screenshot('r041-restored.png');
  // Daily row -> confirm dialog -> Yes starts a date-labelled run.
  await game.tap(0.249, 0.919);
  await new Promise((r) => setTimeout(r, 1000));
  await game.tap(0.420, 0.821);
  await new Promise((r) => setTimeout(r, 1200));
  await game.screenshot('r041-confirm.png');
  await game.tapText('^Yes$|^Oui$', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 6000));
  const label = await game.eval(`(() => { const s = window.__MWG__.currentScene; return s && s.runSeedLabel; })()`);
  console.log('daily runSeedLabel: ' + JSON.stringify(label));
  const expected = new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(label ?? '')) throw new Error('daily label missed: ' + JSON.stringify(label));
  console.log('expected date: ' + expected);
  if (game.consoleErrors().length) throw new Error('errors: ' + game.consoleErrors()[0]);
  console.log('R041 DAILY+FADE LIVE OK');
};
