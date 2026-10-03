// src/simulation/environmentalBlobs.ts
function emitToxicImbueGas(seedGas, passable, center, neighbour8) {
  let centerVolume = 6;
  for (const [dx, dy] of neighbour8) {
    const x = center.x + dx, y = center.y + dy;
    if (passable(x, y)) seedGas(x, y, 6);
    else centerVolume += 6;
  }
  seedGas(center.x, center.y, centerVolume);
}
var STENCH_PARALYSIS_DURATION = 2;
function applyEnvironmentalBlobs(context) {
  const isSolid = (x, y) => !context.passable(x, y);
  context.advance("plantGas", isSolid);
  context.advance("plantFreeze", isSolid);
  context.advance("toxicGas", isSolid);
  context.advance("paralyticGas", isSolid);
  context.advance("stenchGas", isSolid);
  context.advance("corrosiveGas", isSolid);
  context.advance("confusionGas", isSolid);
  context.advance("web", isSolid);
  context.advance("electricity", isSolid);
  context.advance("smokeScreen", isSolid);
  context.advance("inferno", isSolid);
  context.advance("blizzard", isSolid);
  for (const cell of context.cellsAbove("inferno", 1e-4)) {
    context.clearFireCell?.(cell.x, cell.y);
    context.clearCell?.("plantFreeze", cell.x, cell.y);
    if (context.amountAt("blizzard", cell.x, cell.y) > 0) {
      context.clearCell?.("blizzard", cell.x, cell.y);
      context.clearCell?.("inferno", cell.x, cell.y);
      continue;
    }
    const target = context.creatureAt(cell.x, cell.y);
    if (target && !context.isBlobImmune?.(target)) context.reigniteBurning?.(target);
    if (context.isFlammableCell?.(cell.x, cell.y)) context.destroyFlammableCell?.(cell.x, cell.y);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = cell.x + dx, y = cell.y + dy;
      if (context.isFlammableCell?.(x, y) && (context.fireAmountAt?.(x, y) ?? 0) <= 0) {
        context.seedFireCell?.(x, y, 4);
      }
    }
  }
  for (const cell of context.cellsAbove("blizzard", 1e-4)) {
    context.clearFireCell?.(cell.x, cell.y);
    context.clearCell?.("plantFreeze", cell.x, cell.y);
    if (context.amountAt("inferno", cell.x, cell.y) > 0) {
      context.clearCell?.("inferno", cell.x, cell.y);
      context.clearCell?.("blizzard", cell.x, cell.y);
      continue;
    }
    const target = context.creatureAt(cell.x, cell.y);
    if (target && !context.isBlobImmune?.(target)) {
      context.applyChill?.(target);
      context.applyChill?.(target);
    }
    context.freezeHeapCell?.(cell.x, cell.y);
  }
  for (const cell of context.cellsAbove("plantGas", 1)) {
    const target = context.creatureAt(cell.x, cell.y);
    if (target && !context.isBlobImmune?.(target)) context.addBuff(target, "poison");
  }
  for (const cell of context.cellsAbove("plantFreeze", 0.5)) {
    context.clearFireCell?.(cell.x, cell.y);
    const target = context.creatureAt(cell.x, cell.y);
    if (target && !context.isBlobImmune?.(target)) context.applyChill?.(target);
    context.freezeHeapCell?.(cell.x, cell.y);
  }
  for (const cell of context.cellsAbove("toxicGas", 1e-4)) {
    const target = context.creatureAt(cell.x, cell.y);
    if (!target || target.hp <= 0 || context.isToxicImmune(target) || context.isBlobImmune?.(target)) continue;
    if (!context.applyDamage(target, context.toxicDamage(target))) return;
  }
  for (const cell of context.cellsAbove("paralyticGas", 1e-4)) {
    const target = context.creatureAt(cell.x, cell.y);
    if (target && !context.isBlobImmune?.(target)) context.addBuff(target, "paralysis");
  }
  for (const cell of context.cellsAbove("stenchGas", 1e-4)) {
    const target = context.creatureAt(cell.x, cell.y);
    if (target && !context.isBlobImmune?.(target)) context.addBuff(target, "paralysis", STENCH_PARALYSIS_DURATION);
  }
  for (const cell of context.cellsAbove("corrosiveGas", 1e-4)) {
    const target = context.creatureAt(cell.x, cell.y);
    if (target && !context.isBlobImmune?.(target)) context.applyCorrosion(target, context.corrosiveStrength());
  }
  for (const cell of context.cellsAbove("confusionGas", 1e-4)) {
    const target = context.creatureAt(cell.x, cell.y);
    if (!target || context.isVertigoImmune?.(target) || context.isBlobImmune?.(target)) continue;
    if ((target.buffs?.["vertigo"] ?? 0) < 2) context.addBuff(target, "vertigo", 2);
  }
  for (const cell of context.cellsAbove("web", 1e-4)) {
    const target = context.creatureAt(cell.x, cell.y);
    if (!target || target.kind === "spinner" || context.isBlobImmune?.(target)) continue;
    context.clearCell?.("web", cell.x, cell.y);
    context.addBuff(target, "roots", 5);
  }
  for (const cell of context.cellsAbove("electricity", 1e-4)) {
    const target = context.creatureAt(cell.x, cell.y);
    if (!target || target.hp <= 0 || target.allyKind === "afterImage" || context.isBlobImmune?.(target)) continue;
    const charge = context.amountAt("electricity", cell.x, cell.y);
    if (target.buffs?.["paralysis"] === void 0) context.addBuff(target, "paralysis", charge);
    if (charge % 2 === 1 && !context.applyDamage(target, context.electricDamage(target), "electricity")) return;
  }
}
function spreadSacrificialFire(ctx) {
  if (!ctx.prize() || ctx.charge() <= 0) return;
  ctx.fire.spread(ctx.passable, 0.25, 0.9);
}
function sacrificeCost(kind, generation, ctx) {
  let exp = ctx.monsterExp(kind);
  if (kind === "statue" || kind === "mimic") exp = 1 + ctx.depth;
  else if (kind === "piranha") exp = 1 + Math.floor(ctx.depth / 2);
  else if (kind === "swarm" && (generation ?? 0) > 0) exp = 1;
  return exp * ctx.rollRange(2, 3);
}
function processSacrifice(creature, ctx) {
  const prize = ctx.prize();
  if (!prize || ctx.charge() <= 0) return;
  if (ctx.fire.volumeAt(creature.x, creature.y) <= 0) return;
  ctx.setCharge(ctx.charge() - sacrificeCost(creature.kind, creature.generation, ctx));
  if (ctx.charge() > 0) return;
  const reward = ctx.cell() >= 0 ? { x: ctx.cell() % ctx.levelWidth, y: Math.floor(ctx.cell() / ctx.levelWidth) } : { x: creature.x, y: creature.y };
  ctx.spawnReward(prize, reward.x, reward.y);
  ctx.say(ctx.t("port.log.sacrificialfirereward"), "positive");
  ctx.setPrize(void 0);
  ctx.setCharge(0);
  ctx.resetFire();
}
function emitToxicGasVents(ctx) {
  for (const [cell, amount] of ctx.vents) {
    const x = cell % ctx.width;
    const y = Math.floor(cell / ctx.width);
    if (!ctx.inside(x, y) || ctx.terrainAt(x, y) !== ctx.trapTerrain) continue;
    if (ctx.gasTotal() === 0 || ctx.gasAmountAt(x, y) <= 9 * amount) {
      ctx.seedGas(x, y, amount);
    }
  }
}
export {
  applyEnvironmentalBlobs,
  emitToxicGasVents,
  emitToxicImbueGas,
  processSacrifice,
  sacrificeCost,
  spreadSacrificialFire
};
