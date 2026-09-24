// Pins `simulation/sealShield.ts` against `BrokenSeal.WarriorShield` (tag `v3.3.8`). Run through `npm run test:seal`.
import { SEAL_COOLDOWN_START, sealActivate, sealMaxShield, sealReduceCooldown, sealShouldActivate, sealTick } from '../src/simulation/sealShield';

let failed = 0;
const check = (name: string, ok: boolean): void => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; };

check('max shield is 3 + 2 x armor tier + Iron Will (5-15), armor level is irrelevant', sealMaxShield(1, 0) === 5 && sealMaxShield(5, 3) === 16 && sealMaxShield(3, 2) === 11);
check('activates when HP is already half or below, or the hit (net of shield) takes it there', sealShouldActivate({ damage: 1, hp: 10, maxHp: 20, shielding: 0, coolingDown: false }) && sealShouldActivate({ damage: 5, hp: 15, maxHp: 20, shielding: 0, coolingDown: false }) && !sealShouldActivate({ damage: 4, hp: 15, maxHp: 20, shielding: 0, coolingDown: false }) && !sealShouldActivate({ damage: 5, hp: 15, maxHp: 20, shielding: 3, coolingDown: false }));
check('never with a zero hit or while cooling down', !sealShouldActivate({ damage: 0, hp: 5, maxHp: 20, shielding: 0, coolingDown: false }) && !sealShouldActivate({ damage: 3, hp: 5, maxHp: 20, shielding: 0, coolingDown: true }));
check('activate: cooldown +150 (kept if already negative-floored at 0), counter reset, initial shield remembered', (() => { const s = sealActivate({ cooldown: 0, turnsSinceEnemies: 4, initialShield: 0 }, 9); const n = sealActivate({ cooldown: -100, turnsSinceEnemies: 4, initialShield: 0 }, 9); return s.cooldown === SEAL_COOLDOWN_START && s.turnsSinceEnemies === 0 && s.initialShield === 9 && n.cooldown === 50; })());
check('cooldown ticks only while regeneration is on', sealTick({ cooldown: 10, turnsSinceEnemies: 0, initialShield: 5 }, { regenOn: true, shielding: 0, enemiesVisible: false, comboActive: false }).state.cooldown === 9 && sealTick({ cooldown: 10, turnsSinceEnemies: 0, initialShield: 5 }, { regenOn: false, shielding: 0, enemiesVisible: false, comboActive: false }).state.cooldown === 10);
check('five quiet turns with shield up drop it, refunding cooldown by 150 x (left/initial)/2', (() => {
	let state = { cooldown: 150, turnsSinceEnemies: 0, initialShield: 10 };
	let dropped = false;
	for (let i = 0; i < 5; i++) { const r = sealTick(state, { regenOn: true, shielding: 5, enemiesVisible: false, comboActive: false }); state = r.state; dropped = r.dropShield; }
	//4 cooldown ticks (150->146), then the fifth: 146-1=145, refund trunc(145 - 150*0.25)=107
	return dropped && state.cooldown === 107;
})());
check('an enemy in view or a live Combo keeps the count at zero', sealTick({ cooldown: 5, turnsSinceEnemies: 4, initialShield: 5 }, { regenOn: true, shielding: 3, enemiesVisible: true, comboActive: false }).state.turnsSinceEnemies === 0 && sealTick({ cooldown: 5, turnsSinceEnemies: 4, initialShield: 5 }, { regenOn: true, shielding: 3, enemiesVisible: false, comboActive: true }).state.turnsSinceEnemies === 0);
check('lethal defense cools down by round(150 x rank/3), floored at -150', sealReduceCooldown(100, 1 / 3) === 50 && sealReduceCooldown(100, 1) === -50 && sealReduceCooldown(-140, 1) === -150);

if (failed > 0) { console.log(`verifySealShield: ${failed} FAILED`); process.exit(1); }
console.log('verifySealShield: OK');
