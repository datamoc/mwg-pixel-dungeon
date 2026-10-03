// Live R105 check (defender half): a PowerOfMany-powered defender takes ~0.75x
// through the real scene.attack() path (ratio vs unpowered, same armor).
// Run: node tools/browserTest.mjs --script tools/scratch/r105-attack-lv.mjs
export default async (game) => {
  await game.startGame();
  const result = await game.eval(`
    const hero = scene.hero;
    const foe = scene.creatures.find((c) => !c.isHero && !c.isAlly && c.hp > 0);
    if (!foe) return { error: 'no mob on level 1' };
    foe.armor = [2, 2]; foe.maxHp = 500; foe.hp = 500;
    const swing = (n) => {
      let total = 0, hits = 0;
      for (let i = 0; i < n; i++) {
        if (foe.hp < 400) foe.hp = 500; // top up: never kill, never grant XP
        const before = foe.hp;
        const landed = scene.attack(hero, foe, 100, 1);
        if (landed) { total += Math.max(0, before - foe.hp); hits++; }
      }
      return { mean: total / Math.max(1, hits), hits };
    };
    const plain = swing(80);
    foe.buffs['powerOfMany'] = 50;
    const powered = swing(80);
    delete foe.buffs['powerOfMany'];
    return { plain, powered, ratio: powered.mean / Math.max(1e-9, plain.mean) };
  `);
  console.log(`[r105] ${JSON.stringify(result)}`);
  if (result.error) throw new Error(result.error);
  // No LIFE_LINK talent on a fresh Warrior: factor is exactly 0.75.
  if (!(result.ratio > 0.6 && result.ratio < 0.9)) throw new Error(`powered-defender ratio off: ${result.ratio}`);
  if (game.consoleErrors().length) throw new Error(`console errors: ${game.consoleErrors()[0]}`);
};
