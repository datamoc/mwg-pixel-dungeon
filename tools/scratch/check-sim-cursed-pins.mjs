// One-off: replicate verifySimulation.mjs's two cursedWandCast.ts pin blocks
// (lines ~1429-1431 and ~1992-2001) in isolation, because the suite aborts earlier
// at a peer's Rat King arrivalDelay pin mismatch before reaching them.
import { readFileSync } from 'node:fs';
const s = readFileSync('src/scenes/dungeon/hero/cursedWandCast.ts', 'utf8');
let fails = 0;
const t = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) fails++; };
t("healthTransfer damage tail", s.includes("this.applyCharacterDamage(victim, damage, { pierceArmor: true, cause: 'foe', skipAura: true,"));
t("curseEquipment slot branch", /effect === 'curseEquipment'[\s\S]*?this\.weaponCursedKnown = true[\s\S]*?getWeaponCurses\(\)[\s\S]*?getArmorCurses\(\)/.test(s));
t("summonMonsters utility trap", /effect === 'summonMonsters'[\s\S]*?activateUtilityTrap\('summoning', cell\.x, cell\.y\)/.test(s));
t("interFloorTeleport weights+enter", /effect === 'interFloorTeleport'[\s\S]*?Random\.weighted\(weights\)[\s\S]*?this\.enterLevel\(\)/.test(s));
t("interFloorTeleport seal/amulet gates", /this\.depth > 1 && !this\.floorLocked\(\)[\s\S]*?this\.miningBranchActive && !this\.bag\.find\('amulet'\)/.test(s));
t("returnPos=-1 beacon", /Java returnPos=-1 selects the destination entrance[\s\S]*?this\.beaconArrival = null/.test(s));
process.exit(fails ? 1 : 0);
