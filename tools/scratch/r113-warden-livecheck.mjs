// R113 live verification (throwaway): Warden furrow on planting + warden_desc seed text.
// Run after build: node tools/browserTest.mjs --dist <dir> --script tools/scratch/r113-warden-livecheck.mjs
export default async (game) => {
  await game.startGame();
  const addSeed = `(cls) => {
    const s = scene;
    const inst = 'seed:' + cls.toLowerCase() + '-live';
    s.bag.add({ id: 'seed', quantity: 1, identified: true, instanceId: inst, sourceClass: cls });
    return inst;
  }`;

  // --- Non-warden baseline: plant text without the paragraph, planting furrows nothing ---
  const base = await game.eval(`(() => {
    const s = scene;
    ${addSeed}
    const inst = (${addSeed})('Firebloom');
    const plain = s.tradeItemBody({ id: 'seed', sourceClass: 'Firebloom' });
    const plainIcecap = s.tradeItemBody({ id: 'seed', sourceClass: 'Icecap' });
    s.requestedItemId = 'seed'; s.requestedItemInstanceId = inst;
    const furrowBefore = s.furrowedGrass.size;
    s.plantSeed();
    const planted = s.manualPlants.get(s.level.index(s.hero.x, s.hero.y));
    return { plainLen: plain ? plain.length : -1, plainIcecapLen: plainIcecap ? plainIcecap.length : -1, furrowBefore, furrowAfter: s.furrowedGrass.size, planted };
  })()`);
  console.log('baseline: ' + JSON.stringify(base));
  if (!(base.plainLen > 0)) throw new Error('seed has no description at all');
  if (!(base.planted === 'firebloom')) throw new Error('seed did not plant: ' + base.planted);
  if (!(base.furrowAfter === base.furrowBefore)) throw new Error('non-warden planting furrowed');
  if (game.consoleErrors().length) throw new Error('baseline errors: ' + game.consoleErrors()[0]);

  // --- Warden: paragraph appears, neighbours furrow ---
  const warden = await game.eval(`(() => {
    const s = scene;
    s.advancement.choose(0, 'warden');
    const isW = s.subclass() === 'warden';
    const inst = (${addSeed})('Icecap');
    const wardenBody = s.tradeItemBody({ id: 'seed', sourceClass: 'Icecap' });
    // Move to an adjacent plantable cell (start cell already holds the firebloom).
    const hx = s.hero.x, hy = s.hero.y;
    let dest = null;
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, -1]]) {
      const x = hx + dx, y = hy + dy;
      if (!s.level.inside(x, y) || !s.level.passable(x, y)) continue;
      if (s.creatureAt(x, y)) continue;
      if (s.portedFeatures.kindAt(s.level.index(x, y)) !== undefined) continue;
      dest = { x, y };
      break;
    }
    if (!dest) return { isW, error: 'no free cell' };
    s.moveTo(s.hero, dest);
    s.requestedItemId = 'seed'; s.requestedItemInstanceId = inst;
    const furrowBefore = s.furrowedGrass.size;
    s.plantSeed();
    const planted = s.manualPlants.get(s.level.index(dest.x, dest.y));
    const furrowed = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const x = dest.x + dx, y = dest.y + dy;
      if (s.furrowedGrass.has(s.level.index(x, y))) furrowed.push({ x, y, t: s.level.get(x, y) });
    }
    return { isW, wardenLen: wardenBody ? wardenBody.length : -1, planted, furrowBefore, furrowAfter: s.furrowedGrass.size, furrowed };
  })()`);
  console.log('warden: ' + JSON.stringify(warden));
  if (!warden.isW) throw new Error('subclass did not take');
  if (!(warden.planted === 'icecap')) throw new Error('warden seed did not plant: ' + warden.planted);
  if (!(warden.wardenLen > base.plainIcecapLen)) throw new Error('no warden paragraph: ' + warden.wardenLen + ' vs ' + base.plainIcecapLen);
  if (!(warden.furrowAfter > warden.furrowBefore && warden.furrowed.length > 0)) throw new Error('nothing furrowed: ' + JSON.stringify(warden));
  if (!warden.furrowed.every((c) => c.t === 6)) throw new Error('furrowed cell not HIGH_GRASS: ' + JSON.stringify(warden.furrowed));
  if (game.consoleErrors().length) throw new Error('warden errors: ' + game.consoleErrors()[0]);

  await game.screenshot('r113-warden.png');
  console.log('R113 LIVE OK');
};
