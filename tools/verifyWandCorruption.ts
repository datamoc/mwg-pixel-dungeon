// Pins `simulation/wandCorruption.ts` against `WandOfCorruption.onZap()` (tag `v3.3.8`). Run through `npm run test:corruption`.
import { corruptingPower, corruptionResistance, resolveCorruptionZap } from '../src/simulation/wandCorruption';

let failed = 0;
const check = (name: string, ok: boolean): void => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; };
const neg = (id: string): boolean => id === 'bleeding' || id === 'doom';
const target = (over: Partial<{ kind: string; hp: number; maxHp: number; exp: number; buffs: Record<string, number> }> = {}) =>
	({ kind: 'gnoll', hp: 10, maxHp: 10, exp: 2, buffs: {}, ...over });
const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;

check('power is 3 + level/3', near(corruptingPower(0), 3) && near(corruptingPower(6), 5));
check('full health: resist = (1+EXP) * 5; half: *2; quarter: *1.25', near(corruptionResistance(target(), 5, neg), 15) && near(corruptionResistance(target({ hp: 5 }), 5, neg), 6) && near(corruptionResistance(target({ hp: 2.5 }), 5, neg), 3.75));
check('a MAJOR debuff halves, a MINOR (or other negative) costs a quarter, positives cost nothing', near(corruptionResistance(target({ buffs: { amok: 5 } }), 5, neg), 7.5) && near(corruptionResistance(target({ buffs: { weakness: 5 } }), 5, neg), 11.25) && near(corruptionResistance(target({ buffs: { bleeding: 5 } }), 5, neg), 11.25) && near(corruptionResistance(target({ buffs: { haste: 5 } }), 5, neg), 15));
check('mimic/statue use 1+depth; piranha/bee 1+depth/2; wraith (1+depth/4)/5', near(corruptionResistance(target({ kind: 'statue' }), 8, neg), 9 * 5) && near(corruptionResistance(target({ kind: 'piranha' }), 8, neg), 5 * 5) && near(corruptionResistance(target({ kind: 'wraith' }), 8, neg), 3 / 5 * 5));
check('an EXP-less swarm resists as 1+3', near(corruptionResistance(target({ kind: 'swarm', exp: 0 }), 5, neg), 4 * 5));

const rolls = (...values: number[]) => { let i = 0; return { float: () => values[i++ % values.length]! }; };
const zap = (over: Partial<Parameters<typeof resolveCorruptionZap>[0]> = {}) => resolveCorruptionZap({
	power: 3, resistance: 15, buffs: {}, alreadyDoomed: false, corruptionImmune: false, immune: () => false, rolls: rolls(0.5), ...over,
});
check('power above resistance corrupts; a corruption-immune target takes Doom instead', zap({ power: 20 }).kind === 'corrupt' && zap({ power: 20, corruptionImmune: true }).kind === 'doom');
check('power below resistance: a tier roll under power/resistance is MAJOR, else MINOR', (() => {
	const major = zap({ rolls: rolls(0.1, 0.0) }); const minor = zap({ rolls: rolls(0.9, 0.0) });
	return major.kind === 'debuff' && major.id === 'amok' && minor.kind === 'debuff' && minor.id === 'weakness';
})());
check('weights: amok 3 / hex 2 / paralysis 1 (draw 0.49 -> amok, 0.6 -> hex, 0.9 -> paralysis)', ['0.49', '0.6', '0.9'].map((r) => { const o = zap({ rolls: rolls(0.0, Number(r)) }); return o.kind === 'debuff' ? o.id : o.kind; }).join() === 'amok,hex,paralysis');
check('present or immune debuffs drop out; an empty MINOR pool goes up to MAJOR', (() => {
	const all = { weakness: 1, vulnerable: 1, cripple: 1, blindness: 1, terror: 1 };
	const o = zap({ buffs: all, rolls: rolls(0.9, 0.0) });
	const immune = zap({ immune: (id) => id === 'amok', rolls: rolls(0.0, 0.0) });
	return o.kind === 'debuff' && o.id === 'amok' && immune.kind === 'debuff' && immune.id === 'hex';
})());
check('an exhausted MAJOR pool corrupts', zap({ buffs: { amok: 1, hex: 1, paralysis: 1 }, rolls: rolls(0.0) }).kind === 'corrupt');
check('an already-doomed target is debuffed, and refused once both tiers are spent', zap({ alreadyDoomed: true, rolls: rolls(0.0, 0.0) }).kind === 'debuff'
	&& zap({ alreadyDoomed: true, buffs: { doom: 1, amok: 1, hex: 1, paralysis: 1 }, rolls: rolls(0.0) }).kind === 'refuse');

if (failed > 0) { console.log(`verifyWandCorruption: ${failed} FAILED`); process.exit(1); }
console.log('verifyWandCorruption: OK');
