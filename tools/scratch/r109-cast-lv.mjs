// Live R109 check (cast half): resolveBeamingRay teleports the powered ally
// onto its mark, boosts it, spends charge + turn.
// Run: node tools/browserTest.mjs --browser chrome --script r109-cast-lv.mjs
export default async (game) => {
  //Cleric start by hand: the shared startGame() slot-5 fraction misses the
  //bottom-right class icon (read off a captured class screen: centre ~(0.210, 0.494)).
  await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout: 90000 });
  await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2500));
  //Fresh profiles lock the Cleric behind the `victory` badge: grant it in-page
  //(the select scene reads its own `badges` store) before tapping the icon.
  await game.eval(`scene.badges.increment('amulet', 1)`);
  await game.tap(0.210, 0.494);
  await new Promise((r) => setTimeout(r, 800));
  await game.tapText('^commencer$|^start$', { timeout: 90000 });
  await game.waitFor('!!(window.__MWG__.currentScene && window.__MWG__.currentScene["hero"] && window.__MWG__.currentScene["creatures"])', { timeout: 90000 });
  const result = await game.eval(`
    if (scene.heroClass !== 'cleric') return { error: 'not a cleric run' };
    scene.talentRanks['beaming_ray'] = 2;
    const tome = scene.bag.find('holyTome');
    if (!tome) return { error: 'no tome' };
    tome.charge = 5;
    const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    const foes = scene.creatures.filter((c) => !c.isHero && !c.isAlly && c.hp > 0
      && scene.fov.isVisible(c.x, c.y));
    if (foes.length < 2) return { error: 'need 2 visible mobs' };
    // Ally + mark pair: 2..6 apart so the teleport visibly moves within rank-2 range.
    let A = null, E = null;
    for (const a of foes) {
      const e = foes.find((c) => c !== a && cheb(a, c) >= 2 && cheb(a, c) <= 6);
      if (e) { A = a; E = e; break; }
    }
    if (!A) return { error: 'no suitable pair' };
    A.isAlly = true; A.seesHero = true; A.buffs['powerOfMany'] = 50;
    A.hp = A.maxHp;
    // Aim at the enemy's own cell: occupied, so the neighbour fallback runs.
    const tgt = { x: E.x, y: E.y };
    const ax0 = A.x, ay0 = A.y, charge0 = tome.charge;
    scene.resolveBeamingRay(tgt, undefined);
    const moved = Math.max(Math.abs(A.x - ax0), Math.abs(A.y - ay0));
    const nearEnemy = Math.max(Math.abs(A.x - E.x), Math.abs(A.y - E.y));
    return {
      moved, nearEnemy,
      boost: A.buffs['beamingRayBoost'] ?? 0,
      mark: A.beamingRayTarget ?? null,
      enemyId: E.id,
      order: A.allyTargetChar ? A.allyTargetChar.id : null,
      lastSeen: A.lastSeen ?? null,
      spent: scene.actionSpentTurn === true,
      chargeDelta: charge0 - tome.charge,
    };
  `);
  console.log(`[r109cast] ${JSON.stringify(result)}`);
  if (result.error) throw new Error(result.error);
  if (!(result.moved >= 2)) throw new Error(`ally did not teleport: moved ${result.moved}`);
  if (!(result.nearEnemy <= 1)) throw new Error(`ally not on mark: ${result.nearEnemy}`);
  if (!(result.boost > 0)) throw new Error('boost buff missing');
  if (result.mark !== result.enemyId) throw new Error(`mark ${result.mark} != enemy ${result.enemyId}`);
  if (!(result.order === result.enemyId || result.lastSeen)) throw new Error('ally not directed');
  if (!result.spent) throw new Error('turn not spent');
  if (result.chargeDelta !== 1) throw new Error(`charge delta ${result.chargeDelta}`);
  await game.screenshot('r109-cast');
  if (game.consoleErrors().length) throw new Error(`console errors: ${game.consoleErrors()[0]}`);
};
