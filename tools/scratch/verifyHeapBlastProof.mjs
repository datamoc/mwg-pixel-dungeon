// src/items/heapBlastProof.ts
var SURVIVING_KINDS = /* @__PURE__ */ new Set([
  "weapon",
  "armor",
  "wand",
  "ring",
  "amulet",
  "crystalKey",
  "ironKey",
  "goldenKey",
  "dwarfToken",
  "darkGold",
  "corpseDust",
  "candle",
  "embers",
  "bag",
  "brokenSeal"
]);
var UNIQUE_PAYLOAD_IDS = /* @__PURE__ */ new Set(["potionStrength", "scrollUpgrade", "stoneOfEnchantment"]);
function survivesHeapExplosion(kind, payloadId) {
  return SURVIVING_KINDS.has(kind) || payloadId !== void 0 && UNIQUE_PAYLOAD_IDS.has(payloadId);
}

// tools/verifyHeapBlastProof.ts
var failed = 0;
var check = (name, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failed++;
};
for (const kind of ["weapon", "armor", "wand", "ring", "amulet", "crystalKey", "ironKey", "goldenKey", "dwarfToken", "darkGold", "corpseDust", "candle", "embers", "bag", "brokenSeal"]) {
  check(`heap blast spares ${kind}`, survivesHeapExplosion(kind));
}
for (const kind of ["ankh", "stylus", "torch", "gold", "scroll", "potion", "stone", "meat", "food", "seed", "bomb", "honeypot", "dewdrop", "sandBag", "alchemize"]) {
  check(`heap blast destroys ${kind}`, !survivesHeapExplosion(kind));
}
check("unique potion of strength survives", survivesHeapExplosion("potion", "potionStrength"));
check("unique scroll of upgrade survives", survivesHeapExplosion("scroll", "scrollUpgrade"));
check("unique stone of enchantment survives", survivesHeapExplosion("stone", "stoneOfEnchantment"));
check("an ordinary potion is not spared", !survivesHeapExplosion("potion", "potionHealing"));
if (failed > 0) {
  console.error(`${failed} heap-blast check(s) failed`);
  process.exit(1);
}
console.log("verifyHeapBlastProof: OK");
