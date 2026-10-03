// R116 live verification (throwaway): rotLasher spawns and attacks without the
// fps-0 crash (R015's lasher attempt leg rides along: a dodged lash + cripple).
// Run after build: node tools/browserTest.mjs --dist <dir> --script tools/scratch/r116-lasher-livecheck.mjs
export default async (game) => {
  await game.startGame();
  const out = await game.eval(`(() => {
    const s = scene;
    const log = [];
    const hx = s.hero.x, hy = s.hero.y;
    let at = null;
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const x = hx + dx, y = hy + dy;
      if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) { at = { x, y }; break; }
    }
    if (!at) return { error: 'no cell' };
    let lash = null;
    try {
      lash = s.spawnMonster('rotLasher', at);
      log.push(['spawn', 'ok', lash.id]);
    } catch (e) { return { error: 'spawn threw: ' + String((e && e.message) || e).slice(0, 80) }; }
    lash.maxHp = 100000; lash.hp = 100000;
    s.hero.evasion = 1000000;
    let hit = null;
    try {
      hit = s.attack(lash, s.hero);
      log.push(['attack', 'ok', 'hit=' + hit]);
    } catch (e) { return { error: 'attack threw: ' + String((e && e.message) || e).slice(0, 80) }; }
    s.hero.evasion = 5;
    log.push(['crippled', String(s.hero.buffs?.cripple !== undefined)]);
    log.push(['spriteIdle', String(lash.sprite?.playing ?? null)]);
    return { log };
  })()`);
  console.log(JSON.stringify(out));
  if (out.error) throw new Error(out.error);
  if (game.consoleErrors().length) throw new Error('errors: ' + game.consoleErrors()[0]);
  await game.screenshot('r116-lasher.png');
  console.log('R116 LIVE OK');
};
