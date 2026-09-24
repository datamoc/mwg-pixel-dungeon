// Pins `items/dropThrow.ts` (`Item.AC_DROP`/`AC_THROW`, `Potion.mustThrowPots`/`canThrowPots`/`doThrow`, tag `v3.3.8`).
// The scene wiring (heap drop, aim, shatter, item window) was live-checked in the built game
// (`tools/scratch/drop-throw-livecheck.mjs`, `dropthrow-ui-shot.mjs`). Run through `npm run test:dropthrow`.
import { canDropBagItem, canThrowBagItem, potionThrowsByDefault, shatterHasEffect, throwLanding, throwNeedsConfirm } from '../src/items/dropThrow';

let failed = 0;
const check = (name: string, ok: boolean): void => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; };

check('keys, equipment stand-ins, rings and the tome never drop', ['ironKey', 'goldenKey', 'crystalKey', 'armorReward', 'weaponReward', 'wand', 'ring_garnet', 'holyTome', 'missile_dart'].every((id) => !canDropBagItem(id)));
check('potions, scrolls, food and artifacts drop', ['potionHealing', 'scrollIdentify', 'food', 'talisman', 'seed'].every(canDropBagItem));
check('items with their own throw keep it (bombs, honeypot, brews, candle, runestones)', ['bomb', 'honeypot', 'shockingBrew', 'candle', 'stoneOfBlast'].every((id) => !canThrowBagItem(id)));
check('flasks and scrolls take the generic throw', canThrowBagItem('potionToxicGas') && canThrowBagItem('scrollIdentify'));
check('a known beneficial potion asks before it is thrown; must-throw and can-throw do not', throwNeedsConfirm('potionHealing', true) && !throwNeedsConfirm('potionFrost', true) && !throwNeedsConfirm('potionPurity', true) && !throwNeedsConfirm('potionHealing', false));
check('a known malevolent potion throws by default', potionThrowsByDefault('potionToxicGas', true) && !potionThrowsByDefault('potionToxicGas', false) && !potionThrowsByDefault('potionHealing', true));
check('only the five area potions shatter with an effect', ['potionFlame', 'potionToxicGas', 'potionParalyticGas', 'potionFrost', 'potionShrouding'].every(shatterHasEffect) && !shatterHasEffect('potionHealing'));

const line = [0, 1, 2, 3, 4, 5].map((x) => ({ x, y: 0 }));
check('an unobstructed throw lands on the aimed cell', throwLanding(line, () => false, () => false).x === 5);
check('a wall stops it on the last open cell', throwLanding(line, (x) => x === 3, () => false).x === 2);
check('a creature is hit at its own cell', throwLanding(line, () => false, (x) => x === 2).x === 2);

if (failed > 0) { console.error(`${failed} drop/throw check(s) failed`); process.exit(1); }
console.log('verifyDropThrow: OK');
