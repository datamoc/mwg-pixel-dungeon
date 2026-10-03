// Live R109 check (full): cast teleports/boosts the powered ally, and the
// boosted mark takes ~1.4x/1.25x the plain powered-ally roll (rank 2).
// Run: node tools/browserTest.mjs --browser chrome --script tools/scratch/r109-attack-lv.mjs
export default async (game) => {
  await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout: 90000 });
  await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2500));
  //Fresh profiles lock the Cleric behind the `victory` badge: grant it in-page.
  await game.eval(`scene.badges.increment('amulet', 1)`);
  await game.tap(0.210, 0.494);
  await new Promise((r) => setTimeout(r, 800));
  await game.tapText('^commencer$|^start$', { timeout: 90000 });
  await game.waitFor('!!(window.__MWG__.currentScene && window.__MWG__.currentScene["hero"] && window.__MWG__.currentScene["creatures"])', { timeout: 90000 });
  const cast = await game.eval(`
    if (scene.heroClass !== 'cleric') return { error: 'not a cleric run' };
    scene.talentRanks['beaming_ray'] = 2;
    const tome = scene.bag.find('holyTome');
    if (!tome) return { error: 'no tome' };
    tome.charge = 5;
    const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    const all = scene.creatures.filter((c) => !c.isHero && !c.isAlly && c.hp > 0);
    if (all.length < 2) return { error: 'need 2 mobs' };
    // Stage the pair next to the hero: A adjacent, E 3..6 away on a visible
    // passable cell, so the teleport visibly moves within rank-2 range.
    const hero = scene.hero;
    const adj = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => ({ x: hero.x + dx, y: hero.y + dy }))
      .find((p) => scene.level.inside(p.x, p.y) && scene.level.passable(p.x, p.y) && !scene.creatureAt(p.x, p.y));
    if (!adj) return { error: 'no adjacent cell' };
    let espot = null;
    for (let r = 3; r <= 6 && !espot; r++) {
      for (let dx = -r; dx <= r && !espot; dx++) for (let dy = -r; dy <= r && !espot; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const p = { x: hero.x + dx, y: hero.y + dy };
        if (scene.level.inside(p.x, p.y) && scene.level.passable(p.x, p.y)
          && !scene.creatureAt(p.x, p.y) && scene.fov.isVisible(p.x, p.y)
          && cheb(adj, p) >= 3) espot = p;
      }
    }
    if (!espot) return { error: 'no mark cell' };
    const A = all[0], E = all[1];
    scene.moveTo(A, adj);
    scene.moveTo(E, espot);
    A.isAlly = true; A.seesHero = true; A.buffs['powerOfMany'] = 50;
    A.hp = A.maxHp;
    const ax0 = A.x, ay0 = A.y, charge0 = tome.charge;
    scene.resolveBeamingRay({ x: E.x, y: E.y }, undefined);
    const moved = Math.max(Math.abs(A.x - ax0), Math.abs(A.y - ay0));
    const nearEnemy = Math.max(Math.abs(A.x - E.x), Math.abs(A.y - E.y));
    return {
      moved, nearEnemy,
      boost: A.buffs['beamingRayBoost'] ?? 0,
      mark: A.beamingRayTarget ?? null,
      enemyId: E.id, allyId: A.id,
      order: A.allyTargetChar ? A.allyTargetChar.id : null,
      lastSeen: A.lastSeen ?? null,
      spent: scene.actionSpentTurn === true,
      chargeDelta: charge0 - tome.charge,
    };
  `);
  console.log(`[r109cast] ${JSON.stringify(cast)}`);
  if (cast.error) throw new Error(cast.error);
  if (!(cast.moved >= 2)) throw new Error(`ally did not teleport: moved ${cast.moved}`);
  if (!(cast.nearEnemy <= 1)) throw new Error(`ally not on mark: ${cast.nearEnemy}`);
  if (!(cast.boost > 0)) throw new Error('boost buff missing');
  if (cast.mark !== cast.enemyId) throw new Error(`mark ${cast.mark} != enemy ${cast.enemyId}`);
  if (!(cast.order === cast.enemyId || cast.lastSeen)) throw new Error('ally not directed');
  if (!cast.spent) throw new Error('turn not spent');
  if (cast.chargeDelta !== 1) throw new Error(`charge delta ${cast.chargeDelta}`);
  await new Promise((r) => setTimeout(r, 3000));
  await game.screenshot('tools/scratch/browser-test/r109-cast.png');
  // Attack variant: paired landed hits with the mark on (1.4x at rank 2) and
  // off (plain 1.25x), fixed damage, no evasion, one synchronous eval so no
  // turns pass and the 10-turn boost cannot lapse mid-loop.
  const dmg = await game.eval(`
    (() => {
      const A = scene.creatures.find((c) => c.id === '${cast.allyId}');
      const E = scene.creatures.find((c) => c.id === '${cast.enemyId}');
      if (!A || !E) return { error: 'pair gone' };
      A.damage = [50, 50];
      A.accuracy = 1e9;
      E.evasion = 0;
      E.maxHp = 10000; E.hp = 10000;
      E.sleeping = true;
      const phase = (marked) => {
        if (marked) A.beamingRayTarget = E.id;
        else delete A.beamingRayTarget;
        E.hp = 10000;
        const hits = [];
        let guard = 0;
        while (hits.length < 12 && guard++ < 60) {
          const before = E.hp;
          scene.attack(A, E);
          if (E.hp < before) hits.push(before - E.hp);
          if (E.hp <= 0) return { error: 'mark died' };
        }
        if (hits.length < 12) return { error: 'too many misses' };
        return { mean: hits.reduce((a, b) => a + b, 0) / hits.length };
      };
      const on = phase(true);
      if (on.error) return on;
      const off = phase(false);
      if (off.error) return off;
      return { boosted: on.mean, plain: off.mean, ratio: on.mean / off.mean };
    })()
  `);
  console.log(`[r109attack] ${JSON.stringify(dmg)}`);
  if (dmg.error) throw new Error(dmg.error);
  if (!(dmg.boosted > dmg.plain)) throw new Error(`no boost direction: ${dmg.boosted} vs ${dmg.plain}`);
  if (!(dmg.ratio >= 1.02 && dmg.ratio <= 1.22)) throw new Error(`ratio off Java 1.12: ${dmg.ratio}`);
  if (game.consoleErrors().length) throw new Error(`console errors: ${game.consoleErrors()[0]}`);
};
