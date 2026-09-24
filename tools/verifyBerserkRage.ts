// Pins `simulation/berserkRage.ts` against `Berserk.java` (tag `v3.3.8`). Run through `npm run test:berserk`.
import { NEW_RAGE, rageDeathless, rageEnchantFactor, rageRecover, rageStart, rageTakeDamage, rageTick, type Rage } from '../src/simulation/berserkRage';

let failed = 0;
const check = (name: string, ok: boolean): void => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; };
const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;
const tick = (r: Rage, over: Partial<Parameters<typeof rageTick>[1]> = {}) => rageTick(r, { hp: 40, maxHp: 40, shielding: 0, regenOn: true, roll: 0.99, ...over });

check('damage builds (damage/HT)/4, capped by Endless Rage, and re-arms the 3-turn grace; not outside NORMAL', (() => {
	const a = rageTakeDamage(NEW_RAGE, 20, 40, 0);
	const capped = rageTakeDamage({ ...NEW_RAGE, power: 0.95 }, 40, 40, 0);
	const over = rageTakeDamage({ ...NEW_RAGE, power: 1.4 }, 40, 40, 3);
	const off = rageTakeDamage({ ...NEW_RAGE, mode: 'recovering' }, 20, 40, 0);
	return near(a.power, 0.125) && a.powerLossBuffer === 3 && near(capped.power, 1) && near(over.power, 1.5001) && off.power === 0;
})());
check('the grace counts down, then the power fades by gate(0.1,p,1) x 0.05 x (HP/HT)^2 and detaches at zero', (() => {
	const grace = tick({ ...NEW_RAGE, power: 0.5, powerLossBuffer: 2 });
	const fade = tick({ ...NEW_RAGE, power: 1 });
	const gone = tick({ ...NEW_RAGE, power: 0.001 });
	return grace.rage.powerLossBuffer === 1 && grace.rage.power === 0.5 && near(fade.rage.power, 0.95) && !fade.detach && gone.detach;
})());
check('berserk drains ceil(2.5%) of the shield a turn and an empty shield ends it into RECOVERING with no power', (() => {
	const r: Rage = { ...NEW_RAGE, mode: 'berserk', power: 1 };
	const d = tick(r, { shielding: 100 });
	const last = tick(r, { shielding: 1 });
	const none = tick(r, { shielding: 0 });
	return d.drain === 3 && !d.ended && last.drain === 1 && last.ended && last.rage.mode === 'recovering' && last.rage.power === 0 && none.ended;
})());
check('start: shield boost 1x..3x by missing HP, recovery 100 turns at HP > 0 or (4 - Deathless Fury) levels at 0 HP', (() => {
	const up = rageStart({ ...NEW_RAGE, power: 1 }, { hp: 40, maxHp: 40, armorBuffedLevel: 0, deathlessFuryRank: 2 });
	const down = rageStart({ ...NEW_RAGE, power: 1 }, { hp: 0, maxHp: 40, armorBuffedLevel: 0, deathlessFuryRank: 2 });
	return up.shield === 8 && up.rage.turnRecovery === 100 && up.rage.levelRecovery === 0 && down.shield === 24 && down.rage.levelRecovery === 2 && down.rage.turnRecovery === 0 && down.rage.mode === 'berserk';
})());
check('over-cap power (Endless Rage) scales the shield and shortens the recovery by 2 - power', (() => {
	const s = rageStart({ ...NEW_RAGE, power: 1.5 }, { hp: 40, maxHp: 40, armorBuffedLevel: 0, deathlessFuryRank: 0 });
	return s.shield === 12 && s.rage.turnRecovery === 50;
})());
check('recovering: turns count down only with regen on and no level debt; levels are paid by XP, then NORMAL', (() => {
	const r: Rage = { ...NEW_RAGE, mode: 'recovering', turnRecovery: 2 };
	const one = tick(r);
	const paused = tick(r, { regenOn: false });
	const done = tick({ ...r, turnRecovery: 1 });
	const debt = tick({ ...r, levelRecovery: 2 });
	const half = rageRecover({ ...r, levelRecovery: 2 }, 0.5);
	const paid = rageRecover({ ...NEW_RAGE, mode: 'recovering', levelRecovery: 0.3, turnRecovery: 0 }, 0.5);
	return one.rage.turnRecovery === 1 && paused.rage.turnRecovery === 2 && done.rage.mode === 'normal' && debt.rage.turnRecovery === 2 && near(half.levelRecovery, 1.5) && paid.mode === 'normal';
})());
check('enchant factor adds min(1, power) x 15% x Enraged Catalyst; deathless needs NORMAL, power >= 1 and the talent',
	near(rageEnchantFactor(1, 0.5, 2), 1.15) && near(rageEnchantFactor(1, 3, 2), 1.3) && rageDeathless({ ...NEW_RAGE, power: 1 }, 1)
	&& !rageDeathless({ ...NEW_RAGE, power: 0.99 }, 1) && !rageDeathless({ ...NEW_RAGE, power: 1 }, 0) && !rageDeathless({ ...NEW_RAGE, mode: 'berserk', power: 1 }, 1));

if (failed > 0) { console.log(`verifyBerserkRage: ${failed} FAILED`); process.exit(1); }
console.log('verifyBerserkRage: OK');
