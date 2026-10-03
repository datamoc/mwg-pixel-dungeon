// Live R029-a check: Paladin holy flat 6 vs 2 via paired hero hits, and the
// imbued-weapon label through the real ench_name key.
// Run: node tools/browserTest.mjs --browser chrome --script tools/scratch/r029a-lv.mjs
export default async (game) => {
  await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout: 90000 });
  await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2500));
  await game.eval(`scene.badges.increment('amulet', 1)`);
  await game.tap(0.210, 0.494);
  await new Promise((r) => setTimeout(r, 800));
  console.log(`[r029a] selected=${await game.eval(`scene.selected ?? null`)}`);
  await game.tapText('^commencer$|^start$', { timeout: 90000 });
  console.log('[r029a] commencer tapped');
  await game.waitFor('!!(window.__MWG__.currentScene && window.__MWG__.currentScene["hero"] && window.__MWG__.currentScene["creatures"])', { timeout: 90000 });
  const result = await game.eval(`
    (() => {
      if (scene.heroClass !== 'cleric') return { error: 'not a cleric run' };
      const hero = scene.hero;
      const E = scene.creatures.find((c) => !c.isHero && !c.isAlly && c.hp > 0
        && !String(c.kind ?? '').toLowerCase().includes('swarm'));
      if (!E) return { error: 'no mob' };
      // Label: wielded name with the buff off vs on.
      const wid = scene.weaponId, winst = scene.weaponInstanceId;
      const base = scene.itemDisplayName(wid, true, winst);
      hero.buffs['holyWeapon'] = 50;
      const imbued = scene.itemDisplayName(wid, true, winst);
      delete hero.buffs['holyWeapon'];
      // Flat: paired landed hero hits, priest (2) vs paladin (6).
      hero.accuracy = 1e9;
      E.evasion = 0;
      E.maxHp = 10000; E.hp = 10000;
      const phase = (sub) => {
        scene.advancement.choice = () => sub;
        if (scene.subclass() !== sub) return { error: 'subclass did not stick' };
        hero.buffs['holyWeapon'] = 50;
        E.hp = 10000;
        const hits = [];
        let guard = 0;
        while (hits.length < 12 && guard++ < 80) {
          const before = E.hp;
          scene.attack(hero, E);
          if (E.hp < before) hits.push(before - E.hp);
          if (E.hp <= 0) return { error: 'mark died' };
        }
        delete hero.buffs['holyWeapon'];
        if (hits.length < 12) return { error: 'too many misses' };
        return { mean: hits.reduce((a, b) => a + b, 0) / hits.length };
      };
      const priest = phase(null);
      if (priest.error) return priest;
      const paladin = phase('paladin');
      if (paladin.error) return paladin;
      return { base, imbued, priest: priest.mean, paladin: paladin.mean, gap: paladin.mean - priest.mean };
    })()
  `);
  console.log(`[r029a] ${JSON.stringify(result)}`);
  if (result.error) throw new Error(result.error);
  if (result.imbued === result.base) throw new Error(`label not applied: ${result.imbued}`);
  if (result.base === 'startingWeapon') throw new Error('run-start base name unresolved (R110)');
  if (!(result.gap >= 2 && result.gap <= 6)) throw new Error(`paladin gap off Java 4: ${result.gap}`);
  await new Promise((r) => setTimeout(r, 3000));
  await game.screenshot('tools/scratch/browser-test/r029a-flat.png');
  if (game.consoleErrors().length) throw new Error(`console errors: ${game.consoleErrors()[0]}`);
};
