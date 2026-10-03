// R107 live verification (throwaway): every new music file resolves through asset(),
// and every selection branch replays without errors. Selection CORRECTNESS is pinned
// headlessly (exact matrix); here each branch runs live and must resolve + stay silent.
// Run after build: node tools/browserTest.mjs --dist <dir> --script tools/scratch/r107-music-livecheck.mjs
export default async (game) => {
  await game.startGame();
  const state = await game.eval(`(() => ({ depth: scene.depth, sub: scene.subclass() }))()`);
  console.log('start: ' + JSON.stringify(state));
  if (game.consoleErrors().length) throw new Error('boot errors: ' + game.consoleErrors()[0]);

  // Queues (with always-included _3) in all five regions, no conditions.
  const queues = await game.eval(`(() => {
    const s = scene;
    const depths = [1, 6, 12, 18, 22];
    const saved = s.depth;
    for (const d of depths) { s.depth = d; s.replayDungeonMusic(); }
    s.depth = saved; s.replayDungeonMusic();
    return { ok: true };
  })()`);
  console.log('queues: ' + JSON.stringify(queues));
  if (game.consoleErrors().length) throw new Error('queue errors: ' + game.consoleErrors()[0]);

  // Tense branches: ghost (sewers), wandmaker (prison), amulet (caves/city/halls + finale theme).
  const tense = await game.eval(`(() => {
    const s = scene;
    const out = {};
    try { s.quests.start('sadGhost'); } catch (e) { out.ghostStartErr = String(e).slice(0, 60); }
    out.ghost = s.quests.status('sadGhost');
    s.replayDungeonMusic();
    const saved = s.depth;
    try { s.quests.start('wandmaker'); } catch (e) { out.wandStartErr = String(e).slice(0, 60); }
    out.wandmaker = s.quests.status('wandmaker');
    s.depth = 6; s.replayDungeonMusic();
    s.gameState.setSwitch('amuletObtained', true);
    for (const d of [12, 18, 22]) { s.depth = d; s.replayDungeonMusic(); }
    s.depth = 1; s.replayDungeonMusic();
    out.amulet = true;
    s.depth = saved;
    return out;
  })()`);
  console.log('tense: ' + JSON.stringify(tense));
  if (game.consoleErrors().length) throw new Error('tense errors: ' + game.consoleErrors()[0]);

  // Boss finales: sealed + bleeding on caves/city/halls boss depths.
  const finale = await game.eval(`(() => {
    const s = scene;
    const saved = { depth: s.depth, caves: s.cavesBossSealed, city: s.cityBossSealed, halls: s.hallsBossSealed, latch: s.bossBleedLatched };
    const out = {};
    const cases = [[15, 'cavesBossSealed'], [20, 'cityBossSealed'], [25, 'hallsBossSealed']];
    for (const [d, flag] of cases) {
      s.depth = d; s[flag] = true; s.bossBleedLatched = true;
      out[d] = { locked: s.floorLocked() };
      s.replayDungeonMusic();
    }
    s.depth = saved.depth; s.cavesBossSealed = saved.caves; s.cityBossSealed = saved.city;
    s.hallsBossSealed = saved.halls; s.bossBleedLatched = saved.latch;
    s.gameState.setSwitch('amuletObtained', false);
    s.replayDungeonMusic();
    return out;
  })()`);
  console.log('finale: ' + JSON.stringify(finale));
  for (const d of [15, 20, 25]) {
    if (!finale[d] || finale[d].locked !== true) throw new Error('depth ' + d + ' did not read locked');
  }
  if (game.consoleErrors().length) throw new Error('finale errors: ' + game.consoleErrors()[0]);

  await game.screenshot('r107-music.png');
  console.log('R107 LIVE OK');
};
