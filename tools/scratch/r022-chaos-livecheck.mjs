// R022 live verification (throwaway): chaos cursed-wand table + ShockingDart halving.
// Run after build: node tools/browserTest.mjs --dist <dir> --script tools/scratch/r022-chaos-livecheck.mjs
export default async (game) => {
  await game.startGame();

  const probe = await game.eval(`(() => {
    const keys = { withSeed: typeof mwg?.Random?.withSeed, spawn: typeof scene.spawnMonster };
    return keys;
  })()`);
  console.log('probe: ' + JSON.stringify(probe));
  if (game.consoleErrors().length) throw new Error('setup errors: ' + game.consoleErrors()[0]);

  // --- Spawn subjects: chaos elemental (melee + ranged), shock elemental, rat ---
  const setup = await game.eval(`(() => {
    const s = scene;
    s.hero.maxHp = 100000; s.hero.hp = 100000;
    const hx = s.hero.x, hy = s.hero.y;
    const free = [];
    for (let dy = -4; dy <= 4 && free.length < 6; dy++) for (let dx = -4; dx <= 4 && free.length < 6; dx++) {
      if (dx === 0 && dy === 0) continue;
      const x = hx + dx, y = hy + dy;
      if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) free.push({ x, y });
    }
    if (free.length < 6) return { ok: false, free: free.length };
    const melee = s.spawnMonster('elemental', free[0]);
    melee.elementalType = 'chaos'; melee.maxHp = 100000; melee.hp = 100000;
    const ranged = s.spawnMonster('elemental', free[1]);
    ranged.elementalType = 'chaos'; ranged.maxHp = 100000; ranged.hp = 100000;
    const shock = s.spawnMonster('elemental', free[2]);
    shock.elementalType = 'shock'; shock.maxHp = 100000; shock.hp = 100000;
    const rat = s.spawnMonster('rat', free[3]);
    rat.maxHp = 100000; rat.hp = 100000;
    return { ok: true, meleeId: melee.id, rangedId: ranged.id, shockId: shock.id, ratId: rat.id };
  })()`);
  console.log('setup: ' + JSON.stringify(setup));
  if (!setup.ok) throw new Error('no room to spawn subjects');
  if (game.consoleErrors().length) throw new Error('spawn errors: ' + game.consoleErrors()[0]);

  // --- Chaos melee: 24 direct melee-flag casts, collect outcome signatures ---
  // The old stand-in could only ever add exactly one buff (never damage, move or spawn),
  // so variety plus at least one structural outcome (damage taken, displacement, roster
  // change) proves the table roll. Tiers are 60/30/9/1, so 24 trials give ample margin.
  const melee = await game.eval(`(() => {
    const s = scene;
    const el = s.creatures.find((c) => c.id === '${setup.meleeId}');
    const sigs = new Set();
    let structural = 0;
    for (let i = 0; i < 24; i++) {
      const h = s.hero;
      const before = { b: Object.keys(h.buffs).sort().join(','), hp: h.hp, x: h.x, y: h.y, d: s.depth, n: s.creatures.length };
      s.castCursedChaosEffect(h, { x: h.x, y: h.y }, el, true);
      const after = { b: Object.keys(h.buffs).sort().join(','), hp: h.hp, x: h.x, y: h.y, d: s.depth, n: s.creatures.length };
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        sigs.add(JSON.stringify(after));
        if (after.hp < before.hp || after.x !== before.x || after.y !== before.y || after.n !== before.n) structural++;
      }
      if (s.hero.hp <= 0) return { error: 'hero died' };
    }
    return { distinct: sigs.size, structural, sample: [...sigs].slice(0, 3) };
  })()`);
  console.log('melee: ' + JSON.stringify(melee));
  if (melee.error) throw new Error(melee.error);
  if (!(melee.distinct >= 2 && melee.structural >= 1)) throw new Error('chaos melee shows no table roll: ' + JSON.stringify(melee));
  if (game.consoleErrors().length) throw new Error('melee errors: ' + game.consoleErrors()[0]);

  // --- Chaos ranged: scattered subjects, several ranged turns each ---
  const ranged = await game.eval(`(() => {
    const s = scene;
    const hx = s.hero.x, hy = s.hero.y;
    const cells = [];
    for (let dy = -7; dy <= 7 && cells.length < 6; dy++) for (let dx = -7; dx <= 7 && cells.length < 6; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      if (d < 2 || d > 5) continue;
      const x = hx + dx, y = hy + dy;
      if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) cells.push({ x, y });
    }
    const els = cells.map((at) => {
      const el = s.spawnMonster('elemental', at);
      el.elementalType = 'chaos'; el.maxHp = 100000; el.hp = 100000;
      return el;
    });
    let fired = 0, noTarget = 0, structural = 0;
    const sigs = new Set();
    for (const el of els) for (let i = 0; i < 4; i++) {
      const h = s.hero;
      const before = { b: Object.keys(h.buffs).sort().join(','), hp: h.hp, x: h.x, y: h.y, d: s.depth, n: s.creatures.length };
      const ok = s.elementalRangedTurn(el);
      if (!ok) { noTarget++; continue; }
      fired++;
      const after = { b: Object.keys(h.buffs).sort().join(','), hp: h.hp, x: h.x, y: h.y, d: s.depth, n: s.creatures.length };
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        sigs.add(JSON.stringify(after));
        if (after.hp < before.hp || after.x !== before.x || after.y !== before.y || after.n !== before.n) structural++;
      }
      if (s.hero.hp <= 0) return { error: 'hero died' };
    }
    return { fired, noTarget, distinct: sigs.size, structural, sample: [...sigs].slice(0, 3) };
  })()`);
  console.log('ranged: ' + JSON.stringify(ranged));
  if (ranged.error) throw new Error(ranged.error);
  if (!(ranged.fired >= 10)) throw new Error('chaos ranged rarely fired: ' + JSON.stringify(ranged));
  if (!(ranged.distinct >= 2 && ranged.structural >= 1)) throw new Error('chaos ranged shows no table roll: ' + JSON.stringify(ranged));
  if (game.consoleErrors().length) throw new Error('ranged errors: ' + game.consoleErrors()[0]);

  // --- ShockingDart: stormvine proc halves on ELECTRIC holders ---
  const dart = await game.eval(`(() => {
    const s = scene;
    const shock = s.creatures.find((c) => c.id === '${setup.shockId}');
    const rat = s.creatures.find((c) => c.id === '${setup.ratId}');
    let ratDealt = 0, shockDealt = 0;
    for (let i = 0; i < 6; i++) {
      let h0 = rat.hp;
      s.applyTippedDartEffect(rat, 'stormvine');
      ratDealt += Math.max(0, h0 - rat.hp);
      h0 = shock.hp;
      s.applyTippedDartEffect(shock, 'stormvine');
      shockDealt += Math.max(0, h0 - shock.hp);
    }
    return { ratDealt, shockDealt };
  })()`);
  console.log('dart: ' + JSON.stringify(dart));
  if (!(dart.ratDealt > 0)) throw new Error('stormvine dealt no damage at all');
  if (!(dart.shockDealt < dart.ratDealt * 0.75)) throw new Error('no electric halving: ' + JSON.stringify(dart));
  if (game.consoleErrors().length) throw new Error('dart errors: ' + game.consoleErrors()[0]);

  await game.screenshot('r022-chaos.png');
  console.log('R022 LIVE OK');
};
