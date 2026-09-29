// src/items/cloak.ts
function cloakChargeCap(level) {
  return Math.min(level + 3, 10);
}
function cloakTurnsToCharge(level, charge, energyMultiplier) {
  let missing = cloakChargeCap(level) - charge;
  if (level > 7) missing += 5 * (level - 7) / 3;
  return (45 - missing) / energyMultiplier;
}
function cloakExpPerCharge(heroLevel, cloakLevel) {
  let diff = heroLevel - (1 + cloakLevel * 2);
  if (cloakLevel >= 7) diff -= cloakLevel - 6;
  return diff >= 0 ? Math.round(10 * Math.pow(1.1, diff)) : Math.round(10 * Math.pow(0.75, -diff));
}
function cloakGainExp(item, heroLevel) {
  const level = item.level ?? 0;
  item.exp = (item.exp ?? 0) + cloakExpPerCharge(heroLevel, level);
  if (item.exp >= (level + 1) * 50 && level < 10) {
    item.level = level + 1;
    item.exp -= item.level * 50;
    return true;
  }
  return false;
}

// tools/verifyCloak.ts
var failed = 0;
var check = (name, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failed++;
};
check("charge cap is level+3, capped at 10", [0, 1, 7, 8, 10].map(cloakChargeCap).join() === "3,4,10,10,10");
check("turns to charge: 45 - missing at level 0", cloakTurnsToCharge(0, 0, 1) === 42 && cloakTurnsToCharge(0, 2, 1) === 44);
check("past +7 the missing count grows by 5*(level-7)/3", Math.abs(cloakTurnsToCharge(9, 0, 1) - (45 - (10 + 10 / 3))) < 1e-9);
check("a Ring of Energy divides the turns", cloakTurnsToCharge(0, 0, 2) === 21);
check("exp per charge: level-1 hero on a +0 cloak is on target (10)", cloakExpPerCharge(1, 0) === 10);
check("exp per charge grows 1.1^diff above target and shrinks 0.75^diff below", cloakExpPerCharge(6, 0) === Math.round(10 * Math.pow(1.1, 5)) && cloakExpPerCharge(1, 2) === Math.round(10 * Math.pow(0.75, 4)));
check("the target level shifts one more per cloak level past 6", cloakExpPerCharge(20, 7) === Math.round(10 * Math.pow(1.1, 20 - 15 - 1)));
{
  const c = { level: 0, exp: 45 };
  check("crossing (level+1)*50 levels up and carries level*50 off", cloakGainExp(c, 1) && c.level === 1 && c.exp === 55 - 50);
  const capped = { level: 10, exp: 0 };
  check("a level-10 cloak never levels", !cloakGainExp(capped, 40) && capped.level === 10);
}
if (failed > 0) {
  console.error(`${failed} cloak check(s) failed`);
  process.exit(1);
}
console.log("verifyCloak: OK");
