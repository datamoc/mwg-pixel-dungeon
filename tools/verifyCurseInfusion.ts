// Pins R004 (CurseInfusion's SpiritBow clause, tag `v3.3.8`): Java's
// `SpiritBow.isUpgradable()` is false while `CurseInfusion.usableOnItem()`
// admits the bow through its explicit `|| item instanceof SpiritBow` clause -
// so the bow stays a curse target but must fail every upgradable-item
// selector (notably MagicalInfusion's). Run through `npm run test:curseinfusion`.
import {
	isUpgradableItem,
	usableForCurseInfusion,
	usableForMagicalInfusion,
} from '../src/items/itemKinds';
import { staffCurseChargePool } from '../src/items/wands';
import { useCurseInfusionFlow, type CurseInfusionContext, type InfusableView } from '../src/items/spells';
import { Actors } from 'mwg';

let failed = 0;
const check = (name: string, ok: boolean, detail = ''): void => {
	console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok || !detail ? '' : ` - ${detail}`}`);
	if (!ok) failed++;
};

//`SpiritBow.isUpgradable()` is false: the bow is not an upgrade target.
check('spiritBow is not upgradable', !isUpgradableItem({ id: 'spiritBow' }));
check('spiritBow fails the MagicalInfusion selector', !usableForMagicalInfusion({ id: 'spiritBow' }));

//...but `CurseInfusion.usableOnItem()` names it explicitly, so it stays admitted.
check('spiritBow passes the CurseInfusion selector', usableForCurseInfusion({ id: 'spiritBow' }));

//Guards: the ordinary set is untouched - wands, weapons and armor stay admitted
//to both selectors, and artifacts stay out of both.
check('wand stays upgradable', isUpgradableItem({ id: 'wand' }));
check('wand passes the CurseInfusion selector', usableForCurseInfusion({ id: 'wand' }));
check('wand passes the MagicalInfusion selector', usableForMagicalInfusion({ id: 'wand' }));
check('weaponReward passes the CurseInfusion selector', usableForCurseInfusion({ id: 'weaponReward' }));
check('armorReward passes the CurseInfusion selector', usableForCurseInfusion({ id: 'armorReward' }));

//`MagesStaff.updateWand(true)`'s charge half: one max charge (cap 10) and one
//current charge (cap max), on the real pool object.
{
	const grown = staffCurseChargePool(new Actors.Charges({ max: 4, current: 2, regenRate: 1 }));
	check('a 4/2 pool grows to 5/3', grown.max === 5 && grown.current === 3);
	const full = staffCurseChargePool(new Actors.Charges({ max: 4, current: 4, regenRate: 1 }));
	check('a full 4/4 pool grows to 5/5', full.max === 5 && full.current === 5);
	const capped = staffCurseChargePool(new Actors.Charges({ max: 10, current: 10, regenRate: 1 }));
	check('a 10/10 pool stays 10/10', capped.max === 10 && capped.current === 10);
	const nearly = staffCurseChargePool(new Actors.Charges({ max: 10, current: 8, regenRate: 1 }));
	check('a 10/8 pool stays capped at 10/9', nearly.max === 10 && nearly.current === 9);
}

//The flow leg: cursing a staff calls through, cursing anything else does not.
function curseOne(item: InfusableView): { staffCalls: number; relabelCalls: number } {
	const calls = { staffCalls: 0, relabelCalls: 0 };
	const ctx: CurseInfusionContext = {
		hasSpell: () => true,
		consumeSpell: () => {},
		openPicker: (_title, _entries, onPick) => { onPick({ id: item.id, instanceId: item.instanceId }); },
		infusables: () => [item],
		findInfusable: () => item,
		itemName: (entry) => entry.id,
		refreshPanels: () => {},
		say: () => {},
		t: (key) => key,
		relabelAfterInfusion: () => { calls.relabelCalls++; },
		burstShadowUp: () => {},
		infuseStaffCharges: () => { calls.staffCalls++; },
	};
	useCurseInfusionFlow(ctx);
	return calls;
}
{
	const staff: InfusableView = { id: 'weaponReward', quantity: 1, level: 0, sourceClass: 'MagesStaff' };
	const calls = curseOne(staff);
	check('a cursed staff is cursed with the bonus and +1 level',
		staff.cursed === true && staff.curseInfusionBonus === true && staff.level === 1 && calls.relabelCalls === 1);
	check('a cursed staff runs the wand-charge leg', calls.staffCalls === 1);
	const plain: InfusableView = { id: 'weaponReward', quantity: 1, level: 0 };
	const plainCalls = curseOne(plain);
	check('a cursed plain weapon skips the wand-charge leg', plainCalls.staffCalls === 0 && plain.cursed === true);
}

if (failed > 0) {
	console.error(`${failed} curse infusion check(s) failed`);
	process.exit(1);
}
console.log('verifyCurseInfusion: OK');
