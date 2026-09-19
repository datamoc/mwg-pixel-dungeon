import { Roguelike, Random } from 'mwg';
import type { Creature, Step } from '../combat';
import { coneCells } from '../mechanics/cone';
import { FLOOR, GRASS, HIGH_GRASS } from '../dungeonConstants';
import { Cat, randomUsingDefaults } from './generator';
import { wandDamageRange } from './wands';
import { MWL_WAND_FIREBLAST_RULES, MWL_WAND_REGROWTH_RULES, MWL_WAND_WARD_RULES, mwlItemEffectValue } from '../mwlContent';

export interface TransfusionWandContext {
	target: Creature;
	hero: Creature;
	level: number;
	isUndead: (target: Creature) => boolean;
	grantHeroShield: (amount: number, cap: number) => number;
	absorbHeroDamage: (amount: number) => number;
	showHeal: (target: Creature, amount: number) => void;
	showDamage: (target: Creature, amount: number) => void;
	kill: (target: Creature) => void;
	setCharm: (target: Creature) => void;
	addBuff: (target: Creature, id: 'charm') => void;
	reigniteBuff: (target: Creature, id: 'charm', duration?: number) => void;
	rollDamage: (min: number, max: number) => number;
	say: (message: string, level?: 'info' | 'positive' | 'negative' | 'warning') => void;
	message: string;
}

/** `WandOfTransfusion.onZap()`: the scene supplies only world effects and presentation. */
export function useTransfusionWand(context: TransfusionWandContext): void {
	const { target, hero, level } = context;
	//Java heals an ally OR an already-charmed enemy (`ch.buff(Charm) != null`) -
	//the old `isAlly`-only test re-shielded a charmed target instead of healing it.
	//Found by the 17th monster-analysis matrix.
	if (target.isAlly || target.buffs['charm'] !== undefined) {
		const selfDamage = Math.round(hero.maxHp * mwlItemEffectValue('wandTransfusion', 'selfDamageFraction'));
		const healing = selfDamage + mwlItemEffectValue('wandTransfusion', 'healingPerLevel') * level;
		const before = target.hp;
		target.hp = Math.min(target.maxHp, target.hp + healing);
		const blocked = context.absorbHeroDamage(selfDamage);
		hero.hp -= blocked;
		context.showHeal(target, target.hp - before);
		if (hero.hp <= 0) context.kill(hero);
	} else {
		context.grantHeroShield(
			mwlItemEffectValue('wandTransfusion', 'shieldBase')
			+ mwlItemEffectValue('wandTransfusion', 'shieldPerLevel') * level,
			hero.maxHp,
		);
		if (context.isUndead(target) && !target.magicImmune) {
			//`WandOfTransfusion` is one of `AntiMagic.RESISTS`' listed source classes:
			//`Char.damage()` zeroes this hit for a MagicImmune target the same way it does for
			//every other RESISTS-listed source. The `charm` branch below needs no separate
			//guard - `charm` is already one of `buffBlocked()`'s magic-immunity buffs.
			const [minDamage, maxDamage] = wandDamageRange('transfusion', level);
			const damage = context.rollDamage(minDamage, maxDamage);
			target.hp -= damage;
			context.showDamage(target, damage);
			if (target.hp <= 0) context.kill(target);
		} else if (!context.isUndead(target)) {
			//Java charms for `Charm.DURATION/2` (5), not the full 10 - and `affect`
			//keeps a longer existing charm, so this prolongs rather than sets.
			context.reigniteBuff(target, 'charm', 5);
			context.setCharm(target);
		}
	}
	context.say(context.message, 'positive');
}

export interface WardingWandContext {
	target: Creature;
	level: number;
	creatures: readonly Creature[];
	inside: (x: number, y: number) => boolean;
	passable: (x: number, y: number) => boolean;
	isChasmCell: (x: number, y: number) => boolean;
	creatureAt: (x: number, y: number) => Creature | null;
	spawnWard: (x: number, y: number, level: number) => Creature;
	setWardTexture: (ward: Creature, tier: number) => void;
	placeCharacterArt: (ward: Creature) => void;
	say: (message: string, level?: 'info' | 'positive' | 'negative' | 'warning') => void;
	messages: { success: string; empty: string; noTarget: string };
}

/** `WandOfWarding.onZap()` and `Ward.zap()`, without tying item logic to scene rendering. */
export function useWardingWand(context: WardingWandContext): void {
	const { target, level } = context;
	const wards = context.creatures.filter((creature) => creature.isAlly && creature.allyKind === 'ward' && creature.hp > 0);
	const energy = wards.reduce((sum, ward) => sum + (ward.wardTier ?? 1), 0);
	const energyLimit = mwlItemEffectValue('wandWarding', 'energyBase')
		+ mwlItemEffectValue('wandWarding', 'energyPerLevel') * level;
	if (target.allyKind === 'ward') {
		const tier = target.wardTier ?? 1;
		const nextWardRule = MWL_WAND_WARD_RULES[tier + 1];
		if (tier < 6 && energy < energyLimit) {
			target.wardTier = tier + 1;
			target.wardWandLevel = Math.max(target.wardWandLevel ?? 0, level);
			//`Ward.upgrade()` (tag `v3.3.8`) does NOT heal by the `wandHeal` table on
			//promotion (tiers 1/2 gain nothing at all): 3->4 SETS hp to
			//`15+(5-totalZaps)*4` (HT 35), 4->5 adds 19 (HT 54), 5->6 adds 30
			//(HT 84). Only a tier-6 re-zap heals by the table (16). The old code
			//added the table values on every promotion (9/12/16) - over-setting 3->4
			//and under-healing 4->5/5->6. Found by the 17th monster-analysis matrix.
			if (target.wardTier >= 4 && nextWardRule) target.maxHp = nextWardRule.maxHp;
			if (target.wardTier === 4) target.hp = 15 + (5 - (target.wardTotalZaps ?? 0)) * 4;
			else if (target.wardTier === 5) target.hp += 19;
			else if (target.wardTier === 6) target.hp += 30;
			context.setWardTexture(target, target.wardTier);
			context.placeCharacterArt(target);
			context.say(context.messages.success, 'positive');
			return;
		}
		if (tier >= 4) {
			const heal = MWL_WAND_WARD_RULES[tier]?.heal ?? 0;
			target.hp = Math.min(target.maxHp, target.hp + heal);
			context.say(context.messages.success, 'positive');
			return;
		}
		context.say(context.messages.empty, 'negative');
		return;
	}
	if (energy >= energyLimit) {
		context.say(context.messages.empty, 'negative');
		return;
	}
	const candidates = [{ x: target.x, y: target.y }, ...Roguelike.neighbourOffsets(8).map(([dx, dy]) => ({ x: target.x + dx, y: target.y + dy }))]
		.filter((at) => context.inside(at.x, at.y) && context.passable(at.x, at.y) && !context.isChasmCell(at.x, at.y) && !context.creatureAt(at.x, at.y));
	const cell = candidates[0];
	if (!cell) {
		context.say(context.messages.noTarget, 'negative');
		return;
	}
	const ward = context.spawnWard(cell.x, cell.y, level);
	ward.wardTier = 1;
	ward.wardWandLevel = level;
	ward.wardTotalZaps = 0;
	ward.hp = ward.maxHp = mwlItemEffectValue('wandWarding', 'spawnHpBase')
		+ mwlItemEffectValue('wandWarding', 'spawnHpPerLevel') * level;
	ward.sleeping = false;
	context.say(context.messages.success, 'positive');
}

export interface FireblastWandContext {
	target: Creature;
	hero: Creature;
	charges: number;
	weaponLevel: number;
	width: number;
	height: number;
	traceRay: (from: Step, to: Step) => Step[];
	isClosedDoor: (x: number, y: number) => boolean;
	openDoor: (x: number, y: number) => void;
	passable: (x: number, y: number) => boolean;
	isFlammableTerrain: (x: number, y: number) => boolean;
	burnFireContents: (x: number, y: number) => void;
	seedFire: (x: number, y: number, amount: number) => void;
	fireVolumeAt: (x: number, y: number) => number;
	inside: (x: number, y: number) => boolean;
	creatureAt: (x: number, y: number) => Creature | null;
	fadeMirrorOnDamage: (target: Creature, damage: number) => boolean;
	showDamage: (target: Creature, damage: number) => void;
	setColorAdd: (target: Creature, red: number, green: number, blue: number) => void;
	refundWandCharge: (amount: number) => void;
	isWarlock: () => boolean;
	kill: (target: Creature) => void;
	rollDamage: (min: number, max: number) => number;
	addBuff: (target: Creature, id: 'burning' | 'cripple' | 'paralysis') => void;
	reigniteBuff: (target: Creature, id: 'burning' | 'cripple' | 'paralysis', duration?: number) => void;
	say: (message: string, level?: 'info' | 'positive' | 'negative' | 'warning') => void;
	message: (target: Creature, damage: number) => string;
}

/** `WandOfFireblast.onZap()`: cone traversal and damage policy, with scene effects injected. */
export function useFireblastWand(context: FireblastWandContext): void {
	const { target, hero, charges } = context;
	const rule = MWL_WAND_FIREBLAST_RULES[charges];
	if (!rule) throw new Error(`MWL Fireblast rule is missing for ${charges} charges`);
	const cone = coneCells({
		source: { x: hero.x, y: hero.y },
		target: { x: target.x, y: target.y },
		degrees: rule.degrees,
		maxDistance: rule.distance,
		width: context.width,
		height: context.height,
		trace: context.traceRay,
	});
	const heldBack: Step[] = [];
	const affected: Creature[] = [];
	for (const cell of cone.cells) {
		if (cell.x === hero.x && cell.y === hero.y) continue;
		if (context.isClosedDoor(cell.x, cell.y)) context.openDoor(cell.x, cell.y);
		const adjacentToCaster = Roguelike.chebyshevDistance(cell, hero) <= 1;
		const solid = !context.passable(cell.x, cell.y);
		if (adjacentToCaster && !(context.isFlammableTerrain(cell.x, cell.y) || solid)) {
			heldBack.push(cell);
			context.burnFireContents(cell.x, cell.y);
		} else {
			context.seedFire(cell.x, cell.y, rule.fireVolume);
		}
		const occupant = context.creatureAt(cell.x, cell.y);
		if (occupant && !occupant.isHero && !occupant.isNPC) affected.push(occupant);
	}
	if (cone.cells.length === 0) heldBack.push({ x: hero.x, y: hero.y });
	const closeness = (a: Step, b: Step): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
	for (const cell of heldBack) {
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: cell.x + dx, y: cell.y + dy };
			if (!context.inside(at.x, at.y)) continue;
			if (closeness(at, target) >= closeness(cell, target)) continue;
			if (!context.isFlammableTerrain(at.x, at.y)) continue;
			if (context.fireVolumeAt(at.x, at.y) > 0) continue;
					context.seedFire(at.x, at.y, rule.fireVolume);
		}
	}
	const minimum = rule.minLevelFactor * (1 + context.weaponLevel);
	const maximum = rule.maxBase + rule.maxPerLevel * context.weaponLevel;
	for (const victim of affected) {
		//AntiMagic.RESISTS lists WandOfFireblast: `Char.damage()` zeroes any hit whose source
		//class is in that set for a target with the immunity (an AntiMagic champion, via
		//`ChampionEnemy.AntiMagic`'s `immunities.addAll(RESISTS)`) - no damage, no burn/cripple/
		//paralysis, though the cone's own terrain fire still seeds around it as normal.
		if (victim.magicImmune) continue;
		const damage = context.rollDamage(minimum, maximum);
		victim.hp -= damage;
		if (context.fadeMirrorOnDamage(victim, damage)) continue;
		context.showDamage(victim, damage);
		victim.sleeping = false;
		context.setColorAdd(victim, 0.6, 0.7, 1);
		context.say(context.message(victim, damage), 'positive');
		if (context.isWarlock()) context.refundWandCharge(1);
		if (victim.hp <= 0 && !victim.isAlly) {
			context.kill(victim);
			continue;
		}
		//Java prolongs all three (`reignite` for Burning, `affect` with 4 for Cripple
		//and - explicitly, not `Paralysis.DURATION`'s 3 - Paralysis), never
		//overwriting a longer clock. Found by the 17th monster-analysis matrix.
		context.reigniteBuff(victim, 'burning');
		if (charges === 2) context.reigniteBuff(victim, 'cripple');
		else if (charges === 3) context.reigniteBuff(victim, 'paralysis', 4);
	}
}

export interface RegrowthWandContext {
	target: Creature;
	hero: Creature;
	level: number;
	charges: number;
	width: number;
	height: number;
	furrowedChance: number;
	traceRay: (from: Step, to: Step) => Step[];
	getTerrain: (x: number, y: number) => number;
	setTerrain: (x: number, y: number, terrain: number) => void;
	cellIndex: (x: number, y: number) => number;
	isChasmCell: (x: number, y: number) => boolean;
	hasPortedFeature: (cell: number) => boolean;
	hasManualPlant: (cell: number) => boolean;
	creatureAt: (x: number, y: number) => Creature | null;
	isImmovable: (creature: Creature) => boolean;
	restitchAround: (x: number, y: number) => void;
	spawnLotus: (cell: Step, level: number) => void;
	seedPlantKind: (sourceClass?: string) => string | null;
	placePlant: (cell: number, kind: string) => void;
	refreshFeatures: () => void;
	chargeLimit: () => number;
	getTotalCharges: () => number;
	getChargesOverLimit: () => number;
	setChargeState: (total: number, overLimit: number) => void;
	say: (message: string, level?: 'info' | 'positive' | 'negative' | 'warning') => void;
	message: string;
}

/** `WandOfRegrowth.onZap()`; map and feature ownership stay in the scene adapter. */
export function useRegrowthWand(context: RegrowthWandContext): void {
	const { target, hero, level, charges } = context;
	const rule = MWL_WAND_REGROWTH_RULES[charges];
	if (!rule) throw new Error(`MWL Regrowth rule is missing for ${charges} charges`);
	const boltPath = Roguelike.traceLine({ x: hero.x, y: hero.y }, { x: target.x, y: target.y });
	const cone = coneCells({
		source: { x: hero.x, y: hero.y },
		target: { x: target.x, y: target.y },
		degrees: rule.degrees,
		maxDistance: rule.distance,
		width: context.width,
		height: context.height,
		trace: context.traceRay,
	});
	let eligible = cone.cells.filter(({ x, y }) => {
		const cell = context.cellIndex(x, y);
		const terrain = context.getTerrain(x, y);
		if (terrain !== FLOOR && terrain !== GRASS && terrain !== HIGH_GRASS) return false;
		if (context.isChasmCell(x, y) || context.hasPortedFeature(cell) || context.hasManualPlant(cell)) return false;
		const occupant = context.creatureAt(x, y);
		return !occupant || !context.isImmovable(occupant);
	});
	for (const { x, y } of eligible) {
		const creature = context.creatureAt(x, y);
		if (context.getTerrain(x, y) !== HIGH_GRASS) {
			context.setTerrain(x, y, GRASS);
			context.restitchAround(x, y);
		}
		if (creature) creature.buffs['roots'] = Math.max(creature.buffs['roots'] ?? 0, rule.rootsPerCharge * charges);
	}
	Random.shuffle(eligible);
	if (charges >= rule.lotusMinCharges) {
		const free = (cell: Step): boolean => eligible.some((e) => e.x === cell.x && e.y === cell.y) && !context.creatureAt(cell.x, cell.y);
		const lotusAt = free(target) ? { x: target.x, y: target.y } : [...boltPath].reverse().find(free) ?? null;
		if (lotusAt) {
			context.spawnLotus(lotusAt, level);
			eligible = eligible.filter((cell) => !(cell.x === lotusAt.x && cell.y === lotusAt.y));
		}
	}
	const grassToPlace = Math.round((rule.grassBase + rule.grassPerLevel * level) * charges);
	const line = boltPath.filter((cell) => eligible.some((e) => e.x === cell.x && e.y === cell.y)).slice(0, grassToPlace);
	for (const { x, y } of line) {
		if (Random.float() > context.furrowedChance) context.setTerrain(x, y, HIGH_GRASS);
	}
	const remaining = eligible.filter(({ x, y }) => !line.some((cell) => cell.x === x && cell.y === y));
	for (const { x, y } of remaining.slice(0, Math.max(0, grassToPlace - line.length))) {
		if (context.getTerrain(x, y) !== HIGH_GRASS && Random.float() > context.furrowedChance) context.setTerrain(x, y, HIGH_GRASS);
	}
	const plant = (cell: Step, kind: string): void => {
		const index = context.cellIndex(cell.x, cell.y);
		if (context.hasPortedFeature(index) || context.hasManualPlant(index)) return;
		context.placePlant(index, kind);
	};
	if (remaining.length > 0 && Random.float() > context.furrowedChance && Random.int(0, 6) < charges) {
		plant(remaining[0]!, Random.int(0, 2) === 0 ? 'seedpod' : 'dewcatcher');
	}
	if (remaining.length > 1 && Random.float() > context.furrowedChance && Random.int(0, 3) < charges) {
		const seed = randomUsingDefaults(Cat.SEED);
		plant(remaining[1]!, context.seedPlantKind(seed.cls) ?? 'sungrass');
	}
	context.restitchAround(target.x, target.y);
	context.refreshFeatures();
	const limit = context.chargeLimit();
	const previousTotal = context.getTotalCharges();
	if (previousTotal < limit) {
		const nextTotal = previousTotal + charges;
		context.setChargeState(Math.min(limit, nextTotal), Math.max(0, nextTotal - limit));
	} else {
		context.setChargeState(limit, context.getChargesOverLimit() + charges);
	}
	context.say(context.message, 'positive');
}
