import assert from 'node:assert/strict';

export default async (game) => {
  await game.startGame();
  const result = await game.eval(`(() => {
    const hero = scene.hero;
    scene.equippedRing = { id: 'ring_elements', level: 0 };
    scene.applyTippedDartEffect(hero, 'sorrowmoss');
    const poison = hero.buffs.poison;
    scene.applyTippedDartEffect(hero, 'icecap');
    const chill = hero.buffs.chill;
    scene.applyTippedDartEffect(hero, 'earthroot');
    const paralysis = hero.buffs.paralysis;
    scene.applyTippedDartEffect(hero, 'rotberry');
    const corrosion = hero.corrosionTurns;
    scene.equippedRing = null;
    scene.applyTippedDartEffect(hero, 'earthroot');
    return { poison, chill, paralysis, corrosion, paralysisWithoutRing: hero.buffs.paralysis };
  })()`);
  assert.ok(Math.abs(result.poison - 2.475) < 1e-9, `poison duration: ${result.poison}`);
  assert.equal(result.chill, 4.95, 'chill duration scales through reigniteBuff');
  assert.equal(result.paralysis, 4.125, 'paralysis duration scales through addBuff');
  assert.equal(result.corrosion, 8.25, 'RotDart corrosion clock scales through resistedBuffDuration');
  assert.equal(result.paralysisWithoutRing, 5, 'duration is unchanged without the ring');
  await game.screenshot('tools/scratch/browser-test/ring-duration.png');
  if (game.consoleErrors().length) throw new Error(`console errors: ${game.consoleErrors().join(' | ')}`);
  console.log(`RingOfElements live duration results: ${JSON.stringify(result)}`);
};
