// Pins `simulation/monkEnergy.ts` against `MonkEnergy.java` (tag `v3.3.8`). Run through `npm run test:monk`.
import { MONK_ABILITIES, monkAbilitiesEmpowered, monkDashRange, monkDragonKickMultiplier, monkDragonKickParalysis, monkEnergyAfterAbility, monkEnergyAfterGain, monkEnergyCap, monkEnergyGainMultiplier, monkEnergyPerKill, monkMeditateHeal, monkUnarmedRange } from '../src/simulation/monkEnergy';

let failed = 0;
const check = (name: string, ok: boolean): void => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; };

check('abilities in window order with costs 1/2/3/4/5', MONK_ABILITIES.map((a) => `${a.id}:${a.cost}`).join() === 'flurry:1,focus:2,dash:3,dragonKick:4,meditate:5');
check('energy cap is 10 up to level 10, then 5 + level/2 (20 at 30)', [1, 10, 11, 20, 30].map(monkEnergyCap).join() === '10,10,10,15,20');
check('per-kill energy: boss 5, miniboss 3, ghoul/ripper/larva/wraith 0.5, else 1', monkEnergyPerKill({ boss: true }) === 5 && monkEnergyPerKill({ miniboss: true }) === 3 && monkEnergyPerKill({ kind: 'wraith' }) === 0.5 && monkEnergyPerKill({ kind: 'ghoul' }) === 0.5 && monkEnergyPerKill({ kind: 'rat' }) === 1);
check('unencumbered spirit: armor and weapon tiers each add 0.5/0.75/1.0 by rank', monkEnergyGainMultiplier(0, 1, 1) === 1 && monkEnergyGainMultiplier(1, 3, 3) === 2 && monkEnergyGainMultiplier(2, 2, 3) === 1 + 0.75 + 0.5 && monkEnergyGainMultiplier(3, 1, 1) === 3 && monkEnergyGainMultiplier(3, null, 4) === 1 && monkEnergyGainMultiplier(3, 4, 4) === 1);
check('gain is capped unless an ability defers the cap; spending re-caps', monkEnergyAfterGain(9.5, 1.5, 10, false) === 10 && monkEnergyAfterGain(9.5, 1.5, 10, true) === 11 && monkEnergyAfterAbility(11, 2, 10) === 9 && monkEnergyAfterAbility(11, 0, 10) === 10);
check('empowered at 120% / 100% / 80% / 60% of the cap by Monastic Vigor rank', !monkAbilitiesEmpowered(10, 10, 0) && monkAbilitiesEmpowered(10, 10, 1) && !monkAbilitiesEmpowered(7, 10, 2) && monkAbilitiesEmpowered(8, 10, 2) && monkAbilitiesEmpowered(6, 10, 3) && !monkAbilitiesEmpowered(5, 10, 3) && monkAbilitiesEmpowered(12, 10, 0));
check('unarmed range is 1..max(STR-8, 1)', monkUnarmedRange(12).join() === '1,4' && monkUnarmedRange(8).join() === '1,1' && monkUnarmedRange(10).join() === '1,2');
check('dragon kick x6 / x9, dash 4 / 8, paralysis min(6, distance)', monkDragonKickMultiplier(false) === 6 && monkDragonKickMultiplier(true) === 9 && monkDashRange(false) === 4 && monkDashRange(true) === 8 && monkDragonKickParalysis(0) === 0 && monkDragonKickParalysis(2) === 2 && monkDragonKickParalysis(9) === 6);
check('meditate heal is a fifth of the missing HP, rounded', monkMeditateHeal(20, 10) === 2 && monkMeditateHeal(20, 20) === 0 && monkMeditateHeal(23, 3) === 4);

if (failed > 0) { console.log(`verifyMonkEnergy: ${failed} FAILED`); process.exit(1); }
console.log('verifyMonkEnergy: OK');
