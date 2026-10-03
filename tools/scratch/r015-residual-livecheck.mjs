// R015 live verification (throwaway): the four residual quest writes land on attempts.
// Run after build: node tools/browserTest.mjs --dist <dir> --script tools/scratch/r015-residual-livecheck.mjs
export default async (game) => {
  await game.startGame();
  const shape = await game.eval(`(() => ({ depth: scene.depth }))()`);
  console.log('start: ' + JSON.stringify(shape));
  if (game.consoleErrors().length) throw new Error('boot errors: ' + game.consoleErrors()[0]);

  // --- StenchGas: unparalysed hero breathing it with a live rat is paralysed ---
  // (The `questScores[0] -= 100` write fires on the same breath through the newly
  // hooked scene seam; run totals live in a module-private map, so the write itself
  // is source-pinned while the live leg proves the breath path runs.)
  const stench = await game.eval(`(() => {
    const s = scene;
    s.stenchGas.seed(s.hero.x, s.hero.y, 10);
    const cell = { x: s.hero.x + 1, y: s.hero.y };
    let rat = null;
    if (s.level.inside(cell.x, cell.y) && s.level.passable(cell.x, cell.y) && !s.creatureAt(cell.x, cell.y)) {
      rat = s.spawnMonster('fetidRat', cell);
    }
    const unparalysedBefore = s.hero.buffs?.paralysis === undefined;
    s.spreadPlantBlobs();
    return { rat: !!rat, unparalysedBefore, paralysed: s.hero.buffs?.paralysis !== undefined };
  })()`);
  console.log('stench: ' + JSON.stringify(stench));
  if (!(stench.rat && stench.unparalysedBefore && stench.paralysed)) throw new Error('stench breath missed: ' + JSON.stringify(stench));
  if (game.consoleErrors().length) throw new Error('stench errors: ' + game.consoleErrors()[0]);

  // --- Blacksmith: turn-in computes favor and consumes the gold ---
  // (The `questScores[2] += favor` write fires beside it; totals are module-private,
  // so the write itself is source-pinned while the live leg proves favor + handover.)
  const smith = await game.eval(`(() => {
    const s = scene;
    s.bag.add({ id: 'darkGold', quantity: 10, identified: true, instanceId: 'gold-live' });
    s.bag.add({ id: 'pickaxe', quantity: 1, identified: true, instanceId: 'pick-live' });
    s.blacksmithBossBeaten = true;
    s.completeBlacksmithQuest();
    return { favor: s.blacksmithFavor, goldLeft: s.bag.items.filter((i) => i.id === 'darkGold').reduce((n, i) => n + (i.quantity ?? 0), 0) };
  })()`);
  console.log('smith: ' + JSON.stringify(smith));
  if (!(smith.favor === 1500 && smith.goldLeft === 0)) throw new Error('blacksmith favor missed: ' + JSON.stringify(smith));
  if (game.consoleErrors().length) throw new Error('smith errors: ' + game.consoleErrors()[0]);

  // --- DustWraith: attempts count 1,2,3 per wraith (scores at 2nd+3rd source-pinned) ---
  const wraith = await game.eval(`(() => {
    const s = scene;
    const hx = s.hero.x, hy = s.hero.y;
    let at = null;
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const x = hx + dx, y = hy + dy;
      if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) { at = { x, y }; break; }
    }
    if (!at) return { error: 'no cell' };
    const w = s.spawnMonster('dustWraith', at);
    w.maxHp = 100000; w.hp = 100000;
    s.hero.maxHp = 100000; s.hero.hp = 100000;
    const counts = [];
    for (let i = 0; i < 3; i++) { s.attack(w, s.hero); counts.push(w.wraithAtkCount ?? null); }
    return { counts };
  })()`);
  console.log('wraith: ' + JSON.stringify(wraith));
  if (!(JSON.stringify(wraith.counts) === '[1,2,3]')) throw new Error('wraith count missed: ' + JSON.stringify(wraith));
  if (game.consoleErrors().length) throw new Error('wraith errors: ' + game.consoleErrors()[0]);

  await game.screenshot('r015-residual.png');
  console.log('R015 LIVE OK');
};
