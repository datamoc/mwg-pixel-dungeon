import { Random, Roguelike } from 'mwg';
import { absorbShield, addBuff, BUFF_DURATION, reigniteBuff, type Creature, type GroundItem, type Step } from '../combat';
import { isUndeadOrDemonic } from '../monsters';
import { MWL_BOMB_RULES, mwlItemEffectValue } from '../mwlContent';
import { smokeBombSeedPlan } from '../simulation/smoke';
import { SPECIALTY_BOMB_IDS } from './itemKinds';

export interface BombEffectsContext {
	readonly hero: Creature;
	readonly creatures: Creature[];
	readonly groundItems: GroundItem[];
	readonly depth: number;
	readonly progressionLevel: number;
	readonly level: { width: number; height: number; inside(x: number, y: number): boolean; passable(x: number, y: number): boolean };
	readonly isFlammableTerrain: (x: number, y: number) => boolean;
	readonly burnFlammableTerrain: (x: number, y: number) => void;
	readonly creatureAt: (x: number, y: number) => Creature | null;
	readonly groundItemAt: (x: number, y: number) => GroundItem | null;
	readonly removeGroundItem: (ground: GroundItem) => void;
	readonly explodeGroundItem: (ground: GroundItem, chained: Set<string>) => boolean;
	readonly spawnSheep: (at: Step) => void;
	readonly seedFire: (x: number, y: number, duration: number) => void;
	readonly seedSmoke: (x: number, y: number, volume: number) => void;
	readonly plantBloomingGrass: (x: number, y: number) => void;
	readonly cureHeroBuffs: () => void;
	readonly noHealing: boolean;
	readonly healHeroFromRegrowth: () => void;
	readonly onBombDeath: () => void;
	readonly onPharmacophobia: () => void;
	readonly absorbHeroDamage: (amount: number) => number;
	readonly showDamage: (target: Creature, amount: number) => void;
	readonly kill: (target: Creature, cause?: 'poison' | 'fire' | 'hunger' | 'trap' | 'foe') => void;
	readonly say: (message: string, level?: 'positive' | 'negative' | 'warning') => void;
	readonly yogShielded: (target: Creature) => boolean;
	readonly guardFist: (target: Creature) => boolean;
	readonly clampTenguBracket: (target: Creature, previousHp: number) => void;
	readonly yogDamageHook: (target: Creature, previousHp: number) => void;
	readonly kingDamageHook: (target: Creature) => void;
	readonly tenguBracketJump: (target: Creature, previousHp: number) => void;
	/** Clears `Statistics.qualifiedForBossChallengeBadge` when a bomb hurts a boss: a bomb is
	 * never a plain weapon hit. Optional so headless callers keep working. */
	readonly onNonWeaponBossDamage?: (target: Creature) => void;
	/** Clears the badge when Tengu's own bomb blast catches the hero (`BombAbility.act()`,
	 * tag `v3.3.8`, fouls on presence in radius, even at zero damage). Optional likewise. */
	readonly onTenguBombHeroHit?: () => void;
}

function applyBlastDamage(target: Creature, amount: number, pierceArmor: boolean, context: BombEffectsContext): boolean {
	//`Sheep.damage()` (tag `v3.3.8`) is a no-op - the blast passes through sheep.
	if (target.allyKind === 'sheep') return false;
	//`SentryRoom$Sentry.damage()` (tag `v3.3.8`) is likewise a no-op.
	if (target.kind === 'sentry') return false;
	if (target.isHero) {
		const damage = context.absorbHeroDamage(amount);
		context.hero.hp -= damage;
		context.showDamage(context.hero, damage);
		if (context.hero.hp <= 0) {
			context.onBombDeath();
			context.kill(context.hero, 'fire');
			return true;
		}
		return false;
	}
	if (target.kind === 'yog' && context.yogShielded(target)) return false;
	if (target.kind === 'yogFist' && context.guardFist(target)) return false;
	context.onNonWeaponBossDamage?.(target);
	let damage = amount;
	//DKBarrier absorbs on every `Char.damage()` path - the same `absorbShield` block
	//as the attack tail. The live bomb seam ran without it (like the trap/blob/DoT
	//seams before their own fix), so bursting a P2 King bled HP through a full
	//shield. Found by the 18th monster-analysis matrix (bombs).
	if (target.kind === 'king' && (target.kingShield ?? 0) > 0) {
		const absorbed = absorbShield(target.kingShield ?? 0, damage);
		target.kingShield = absorbed.shield;
		damage = absorbed.damage;
	}
	if (!pierceArmor) damage = Math.max(0, damage - Random.normalRange(target.armor[0], target.armor[1]));
	const previousHp = target.hp;
	target.hp -= damage;
	if (target.kind === 'tengu') context.clampTenguBracket(target, previousHp);
	if (target.kind === 'yog' && target.hp > 0) context.yogDamageHook(target, previousHp);
	//Phase transitions ride the damage event (`DwarfKing.damage()`), with the P1
	//`- taken/8` accel first - same order as the attack tail.
	if (target.kind === 'king' && target.hp > 0 && (target.kingPhase ?? 1) === 1) {
		const taken = Math.max(0, previousHp - target.hp);
		target.kingSummonCd = (target.kingSummonCd ?? 0) - taken / 8;
		target.kingAbilityCd = (target.kingAbilityCd ?? 0) - taken / 8;
	}
	if (target.kind === 'king' && target.hp > 0) context.kingDamageHook(target);
	context.showDamage(target, damage);
	target.sleeping = false;
	if (target.hp <= 0) context.kill(target, 'fire');
	else if (target.kind === 'tengu') context.tenguBracketJump(target, previousHp);
	return false;
}

/** Item-domain implementation of Bomb.explode(), including specialty payloads and chaining. */
export function detonateBomb(ground: GroundItem, chained: Set<string>, context: BombEffectsContext): boolean {
	chained.add(ground.id);
	const at = { x: ground.x, y: ground.y };
	context.removeGroundItem(ground);
	const variant: string | undefined = ground.item?.id;
	const tengu = ground.item?.tenguBomb === true;
	// Values mirror `Bomb.explode()` and `TenguBomb.explode()` in SPD's Bomb.java/TenguBomb.java;
	// MWL owns the portable scalar parameters while this adapter retains the stateful payloads.
	const ruleKey = tengu ? 'tengu' : variant === 'shrapnelBomb' || variant === 'regrowthBomb' || variant === 'arcaneBomb' ? variant : variant && SPECIALTY_BOMB_IDS.has(variant) ? 'specialty' : 'standard';
	const rule = MWL_BOMB_RULES[ruleKey] ?? MWL_BOMB_RULES.standard;
	if (!rule) throw new Error(`MWL bomb rule is missing: ${ruleKey}`);
	const lo = rule.minBase + rule.minPerDepth * context.depth;
	const hi = rule.maxBase + rule.maxPerDepth * context.depth;
	let heroDied = false;
	//`Bomb.MagicalBomb` (a marker `ArcaneBomb`/`HolyBomb` both implement) is one of
	//`AntiMagic.RESISTS`' listed source classes - `Char.damage()` zeroes the whole blast for a
	//MagicImmune target, base damage included, unlike an ordinary (non-magical) bomb.
	const magicalBomb = variant === 'arcaneBomb' || variant === 'holyBomb';
	// `Bomb.explode()` destroys every affected `flamable` cell before resolving
	// character damage. Specialty bombs with non-destructive subclasses skip it.
	if (rule.baseBlast) {
			for (let y = at.y - rule.affectedRadius; y <= at.y + rule.affectedRadius; y++) {
			for (let x = at.x - rule.affectedRadius; x <= at.x + rule.affectedRadius; x++) {
				if (!context.level.inside(x, y) || Roguelike.chebyshevDistance(at, { x, y }) > rule.affectedRadius) continue;
				if (context.isFlammableTerrain(x, y)) context.burnFlammableTerrain(x, y);
			}
		}
	}
	// `Heap.explode()` runs before character damage. This port has one payload per
	// cell, so recurse bombs and remove only ordinary, non-equipment payloads.
	if (rule.baseBlast) {
		for (const other of [...context.groundItems]) {
			if (other === ground || !context.groundItems.includes(other)
				|| Roguelike.chebyshevDistance(at, other) > rule.affectedRadius) continue;
			if (context.explodeGroundItem(other, chained)) heroDied = true;
		}
	}
	if (rule.baseBlast) for (const target of [...context.creatures]) {
		if (target.isNPC || target.hp <= 0 || !context.level.passable(target.x, target.y) || Roguelike.chebyshevDistance(at, target) > rule.affectedRadius) continue;
		if (magicalBomb && target.magicImmune) continue;
		if (applyBlastDamage(target, Math.max(0, Random.normalRange(lo, hi)), false, context)) heroDied = true;
	}
	//`BombAbility.act()` fouls the hero on mere presence in the blast, outside the
	//`dmg > 0` guard - so this presence check ignores the damage roll entirely.
	if (tengu && context.level.passable(context.hero.x, context.hero.y)
		&& Roguelike.chebyshevDistance(at, context.hero) <= rule.affectedRadius) {
		context.onTenguBombHeroHit?.();
	}
	const affected = [...context.creatures].filter((target) => !target.isNPC && target.hp > 0 && context.level.passable(target.x, target.y) && Roguelike.chebyshevDistance(at, target) <= rule.affectedRadius);
	const payload: string = String(variant ?? '');
	if (payload === 'frostBomb') for (const target of affected) {
		delete target.buffs['burning'];
		if (target.buffs['chill']) target.buffs['paralysis'] = Math.max(target.buffs['paralysis'] ?? 0, BUFF_DURATION.frost);
		else addBuff(target, 'chill');
	}
	else if (payload === 'fireBomb') {
		const radius = mwlItemEffectValue('fireBomb', 'fireRadius');
		const duration = mwlItemEffectValue('fireBomb', 'fireDuration');
		for (let y = at.y - radius; y <= at.y + radius; y++) for (let x = at.x - radius; x <= at.x + radius; x++) if (context.level.inside(x, y) && context.level.passable(x, y) && Roguelike.chebyshevDistance(at, { x, y }) <= radius) context.seedFire(x, y, duration);
	}
	else if (payload === 'flashbang') for (const target of affected) {
		//`FlashBangBomb.explode()` (tag `v3.3.8`): the pre-`v3.3.8` blinder (daze here) is
		//gone - every char in the flood takes a fresh `NormalIntRange(4 + depth/2, 6 +
		//depth)` quartered as `Electricity` damage plus a `Paralysis` prolong, with no LOS
		//gate (the old ShockBomb's `Ballistica` check went with it). `Char.damage()` takes
		//no armor, so the electric hit pierces; the Ring-of-Elements resistance the blob
		//path models does not reach this adapter (stated gap). The prolong lands the
		//port's 3-turn paralysis rather than Java's 10 (global buff-table reduction).
		const electric = Math.round(Random.normalRange(4 + Math.floor(context.depth / 2), 6 + context.depth) / 4);
		applyBlastDamage(target, electric, true, context);
		reigniteBuff(target, 'paralysis');
	}
	else if (payload === 'smokeBomb') {
		//`SmokeBomb.explode()`'s smoke half: 40 per distance-2 flood cell, the unplaced
		//share of the 1000-volume budget piled onto the center. The blast above is the
		//shared `super.explode()`; the pre-v3.3.8 electric ShockBomb this id replaced
		//(arcs + paralysis, no smoke at all) is gone with it - see `PORT_COVERAGE.md`.
		const plan = smokeBombSeedPlan(context.level.width, context.level.height,
			(x, y) => !context.level.inside(x, y) || !context.level.passable(x, y), at.x, at.y);
		for (const seed of plan.seeds) context.seedSmoke(seed.x, seed.y, seed.volume);
		if (plan.centerVolume > 0) context.seedSmoke(at.x, at.y, plan.centerVolume);
	}
	else if (payload === 'regrowthBomb') {
		context.cureHeroBuffs();
		if (context.noHealing) {
			context.hero.buffs['poison'] = mwlItemEffectValue('regrowthBomb', 'noHealingPoisonBase')
				+ Math.floor(context.progressionLevel / mwlItemEffectValue('regrowthBomb', 'noHealingPoisonLevelDivisor'));
			context.onPharmacophobia();
		} else context.healHeroFromRegrowth();
		const radius = mwlItemEffectValue('regrowthBomb', 'bloomRadius');
		for (let y = at.y - radius; y <= at.y + radius; y++) for (let x = at.x - radius; x <= at.x + radius; x++) if (context.level.inside(x, y) && Roguelike.chebyshevDistance(at, { x, y }) <= radius) context.plantBloomingGrass(x, y);
	}
	else if (payload === 'arcaneBomb') {
		for (const target of affected) if (!target.magicImmune && applyBlastDamage(target, Math.round(Random.normalRange(lo, hi)), rule.piercesArmor, context)) heroDied = true;
	}
	else if (payload === 'shrapnelBomb') {
		for (const target of affected) if (applyBlastDamage(target, Math.max(0, Random.normalRange(lo, hi)), rule.piercesArmor, context)) heroDied = true;
	}
	else if (payload === 'woollyBomb') {
		let sheepCount = 0;
		const maxSheep = mwlItemEffectValue('woollyBomb', 'sheepCount');
		for (const [dx, dy] of [[0, 0], ...Roguelike.neighbourOffsets(8)]) {
			if (sheepCount >= maxSheep) break;
			const cell = { x: at.x + dx, y: at.y + dy };
			if (!context.level.inside(cell.x, cell.y) || !context.level.passable(cell.x, cell.y) || context.creatureAt(cell.x, cell.y) || context.groundItemAt(cell.x, cell.y)) continue;
			context.spawnSheep(cell); sheepCount++;
		}
	}
	else if (payload === 'holyBomb') for (const target of affected) if (isUndeadOrDemonic(target.kind) && !target.magicImmune) {
		const bonus = Math.round(Random.normalRange(4 + context.depth, 12 + 3 * context.depth) * mwlItemEffectValue('holyBomb', 'damageFraction'));
		if (applyBlastDamage(target, bonus, true, context)) heroDied = true;
	}
	for (const other of [...context.groundItems]) if (other.kind === 'bomb' && other.item && !chained.has(other.id) && context.level.passable(other.x, other.y) && Roguelike.chebyshevDistance(at, other) <= rule.chainRadius) if (detonateBomb(other, chained, context)) heroDied = true;
	return heroDied;
}
