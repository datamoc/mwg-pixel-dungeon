// Pins `simulation/combo.ts` against `Combo.java` (tag `v3.3.8`). Run through `npm run test:combo`.
import { COMBO_MOVES, comboCanUse, comboClobberEmpowered, comboCrushMultiplier, comboCrushSplash, comboHighestMove, comboLeapRange, comboParryPersists, comboSlamBonus, comboTimeAfterHit } from '../src/simulation/combo';

let failed = 0;
const check = (name: string, ok: boolean): void => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; };

check('moves unlock at 2/4/6/8/10 in enum order', COMBO_MOVES.map((m) => `${m.id}:${m.req}`).join() === 'clobber:2,slam:4,parry:6,crush:8,fury:10');
check('highest move by count', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25].map((n) => comboHighestMove(n) ?? '-').join() === '-,-,clobber,clobber,slam,slam,parry,parry,crush,crush,fury,fury');
check('clobber and parry are once per session, the rest reusable', !comboCanUse('clobber', 5, { clobber: true, parry: false }) && comboCanUse('slam', 5, { clobber: true, parry: true }) && !comboCanUse('parry', 9, { clobber: false, parry: true }) && !comboCanUse('crush', 7, { clobber: false, parry: false }));
check('a normal hit lifts the clock to 5 and never lowers it; a kill sets 15 + 15/Cleave rank', comboTimeAfterHit(0, false, 3) === 5 && comboTimeAfterHit(12, false, 0) === 12 && comboTimeAfterHit(2, true, 0) === 15 && comboTimeAfterHit(2, true, 3) === 60);
check('slam bonus rounds drRoll * count / 5', comboSlamBonus(4, 5) === 4 && comboSlamBonus(3, 4) === 2 && comboSlamBonus(0, 9) === 0);
check('crush multiplier is 0.25 * count', comboCrushMultiplier(8) === 2 && comboCrushMultiplier(10) === 2.5);
check('crush splash: round(roll*0.25*count)/2 - dr, vulnerable x1.33 truncated, floored at 0', comboCrushSplash(10, 8, 0, false) === 10 && comboCrushSplash(10, 8, 3, false) === 7 && comboCrushSplash(10, 8, 3, true) === 9 && comboCrushSplash(2, 8, 5, false) === 0);
check('enhanced combo thresholds', comboClobberEmpowered(7, 1) && !comboClobberEmpowered(6, 1) && !comboClobberEmpowered(9, 0) && comboParryPersists(9, 2) && !comboParryPersists(8, 2) && !comboParryPersists(9, 1));
check('leap range is 1 below rank 3, 1 + count/3 at rank 3', comboLeapRange(9, 2) === 1 && comboLeapRange(9, 3) === 4 && comboLeapRange(2, 3) === 1);

if (failed > 0) { console.log(`verifyCombo: ${failed} FAILED`); process.exit(1); }
console.log('verifyCombo: OK');
