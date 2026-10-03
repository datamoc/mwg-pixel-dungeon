// R041 part 2: options pane, seed overlay submit, custom-seed run label.
export default async (game) => {
  const meta = JSON.stringify({ meta: { version: 1, savedAt: Date.now() }, state: { counts: [['bag_velvet', 1], ['amulet', 1]] } });
  await game.eval(`localStorage.setItem('mwg-save:spd-meta:meta', '${meta}')`);
  await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2500));
  await game.tap(0.098, 0.344);
  await new Promise((r) => setTimeout(r, 1200));
  // Options gears right of Start.
  await game.tap(0.249, 0.919);
  await new Promise((r) => setTimeout(r, 1000));
  await game.screenshot('r041-pane.png');
  // Seed row (first pane row).
  await game.tap(0.420, 0.735);
  await new Promise((r) => setTimeout(r, 1000));
  const overlay = await game.eval(`!!document.getElementById('spd-seed-overlay')`);
  console.log('overlay open: ' + overlay);
  await game.screenshot('r041-overlay.png');
  if (!overlay) throw new Error('seed overlay did not open');
  await game.eval(`(() => {
    const input = document.getElementById('spd-seed-input');
    input.value = 'hello-daily';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('spd-seed-set').click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));
  const closed = await game.eval(`!document.getElementById('spd-seed-overlay')`);
  console.log('overlay closed after set: ' + closed);
  if (!closed) throw new Error('overlay did not close on set');
  await game.tapText('^commencer$|^start$', { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 6000));
  const label = await game.eval(`(() => { const s = window.__MWG__.currentScene; return s && s.runSeedLabel; })()`);
  console.log('runSeedLabel: ' + JSON.stringify(label));
  if (label !== 'hello-daily') throw new Error('custom seed label missed: ' + JSON.stringify(label));
  if (game.consoleErrors().length) throw new Error('errors: ' + game.consoleErrors()[0]);
  console.log('R041 SEED LIVE OK');
};
