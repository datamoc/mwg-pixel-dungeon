import { Random, type Actors } from 'mwg';
import { addBuff, reigniteBuff, type Creature } from '../combat';
import { cachedRationChance, shieldingDewGain } from '../talentEffects';
import { isChallengeEnabled } from '../challenges';
import { t } from '../i18n';
import type { ClassId } from '../classes';
import { WATERSKIN_MAX } from '../dungeonConstants';
import { MWL_CONSUMABLE_STATS, mwlItemEffectValue } from '../mwlContent';

interface BarrierLike {
	total: number;
	add(amount: number): void;
}

export interface ConsumableContext {
	readonly bag: Actors.Inventory;
	readonly hero: Creature;
	readonly heroClass: ClassId;
	readonly requestedItemId: string | null;
	readonly requestedItemInstanceId?: string;
	hunger: number;
	waterskin: number;
	ammo: number;
	freeTurnNext: boolean;
	 wandBonusDamage: number;
	physicalBonusDamage: number;
	physicalBonusAttacks: number;
	readonly heroBarrier: BarrierLike;
	readonly subclass: () => string | null;
	readonly talentRank: (id: string) => number;
	readonly grantHeroShield: (amount: number, cap: number) => void;
	readonly wandCharges: { refund(amount: number): void };
	showHeal(target: Creature, amount: number): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	applyPotionEffect(id: string): void;
}

/** `MysteryMeat.effect(hero)` (tag `v3.3.8`): `Random.Int(5)` over burning
 * (`reignite`), roots at `Roots.DURATION*2`, poison `set(HT/5)`, slow, or nothing.
 * Slow has no speed-factor buff in this port, so that case stays unmodeled (see
 * `PORT_COVERAGE.md`); the other four run with Java's own durations. The poison seed
 * `total = 1` is the t=1 tick, which always deals `floor(1/3)+1` - without it the loop
 * stops one turn late (HT 20 gives clock 4 dealing 6, not clock 3 dealing exactly 4). */
function applyMysteryMeatEffect(scene: ConsumableContext): void {
	switch (Random.int(0, 4)) {
		case 0:
			reigniteBuff(scene.hero, 'burning', 8);
			break;
		case 1:
			addBuff(scene.hero, 'roots', 10);
			break;
		case 2: {
			// `Poison.set(HT/5)` is a damage pool, not a turn count, while this port's
			// poison clock deals `floor(t/3)+1` per remaining turn - so take the clock
			// whose cumulative damage first reaches `HT/5`.
			const target = scene.hero.maxHp / 5;
			let clock = 1;
			let total = 1;
			while (total < target) {
				clock++;
				total += Math.floor(clock / 3) + 1;
			}
			addBuff(scene.hero, 'poison', clock);
			break;
		}
		case 3:
			break;
		default:
			break;
	}
}

/** `Talent.onFoodEaten()` (tag `v3.3.8`): every class/meal talent that reacts to the
 * hero being fed - shared by ordinary food (`eatFood` below) and by
 * `HornOfPlenty.doEatEffect()`, which calls it with the horn as the food source. The
 * per-talent shapes are the port's own established simplifications (flat bonuses instead
 * of Java's `WandEmpower`/`Recharging`/`Haste`/`PhysicalEmpower` buffs - see the talent
 * families that ported each meal talent); what matters here is *when* they fire, and
 * Java fires all of them for horn meals exactly as for food. Returns the total healing
 * applied on top of `baseHeal`, so callers can show it; messaging stays with the caller
 * (food's eat lines vs the horn's own `eat` line). */
export function applyMealEatenEffects(scene: ConsumableContext, baseHeal: number): number {
	let heal = baseHeal;
	if (scene.heroClass === 'warrior') {
		const pts = scene.talentRank('hearty_meal');
		if (scene.hero.hp / scene.hero.maxHp < 0.334) heal += 2 + 2 * pts;
	}
	if (scene.heroClass === 'mage') scene.wandBonusDamage = Math.max(scene.wandBonusDamage, 2 * scene.talentRank('empowering_meal'));
	if (scene.heroClass === 'mage' && scene.talentRank('energizing_meal') > 0) scene.wandCharges.refund(scene.talentRank('energizing_meal') === 1 ? 5 : 8);
	if (scene.heroClass === 'duelist' && scene.talentRank('focused_meal') > 0) scene.ammo += scene.talentRank('focused_meal') === 1 ? 1 : 2;
	if (scene.heroClass === 'rogue' && scene.talentRank('mystical_meal') > 0) scene.hero.buffs['cloak'] = 9999;
	if (scene.heroClass === 'huntress' && scene.talentRank('invigorating_meal') > 0) scene.freeTurnNext = true;
	if (scene.heroClass === 'duelist' && scene.talentRank('strengthening_meal') > 0) {
		scene.physicalBonusDamage = 3;
		scene.physicalBonusAttacks = scene.talentRank('strengthening_meal') + 1;
	}
	scene.hero.hp = Math.min(scene.hero.maxHp, scene.hero.hp + heal);
	return heal;
}

/** Food.satisfy() and the class talents that react to eating. */
export function eatFood(scene: ConsumableContext): boolean {
	const food = scene.requestedItemId
		? scene.bag.find(scene.requestedItemId, scene.requestedItemInstanceId)
		: scene.bag.find('food') ?? scene.bag.find('meat');
	if (!food) {
		scene.say(t('port.log.nothingtoeat'), 'negative');
		return false;
	}
	scene.bag.remove(food.id, 1);
	if (food.id === 'meat') applyMysteryMeatEffect(scene);
	const cached = cachedRationChance(scene.heroClass, scene.talentRank('cached_rations'));
	if (cached > 0 && Random.chance(cached)) scene.bag.add({ id: food.id, quantity: 1, stackable: true, identified: food.identified });
	const stats = MWL_CONSUMABLE_STATS[food.id] ?? MWL_CONSUMABLE_STATS.food;
	if (!stats) throw new Error(`MWL consumable stats are missing food fallback`);
	const energy = stats.hunger;
	scene.hunger = Math.max(0, scene.hunger - (isChallengeEnabled('no_food') ? energy / 3 : energy));
	const heal = applyMealEatenEffects(scene, stats.heal);
	scene.showHeal(scene.hero, heal);
	scene.say(food.id === 'meat'
		? t(heal > 5 ? 'port.log.eatmeathearty' : 'port.log.eatmeat', { heal })
		: t(heal > 0 ? 'port.log.eathearty' : 'port.log.eat', { heal }), 'positive');
	return true;
}

/**
 * A dew drop pickup: tops up the `Waterskin` (`WATERSKIN_MAX = 20`, matching
 * `Waterskin.volume`'s real scale), else converts the drop to a small heal plus the
 * Warden `shielding_dew` shield. Moved here verbatim from the scene as the file-size
 * refactor's thirtieth extraction, behavior-identical - the scene keeps the one-line
 * adapter the ground-pickup context calls.
 */
export function collectDewdrop(scene: ConsumableContext, force = false): boolean {
	if (scene.waterskin < WATERSKIN_MAX) {
		scene.waterskin++;
		scene.say(t('port.log.collectdew'), 'positive');
		return true;
	}

	const before = scene.hero.hp;
	const heal = Math.round(scene.hero.maxHp * mwlItemEffectValue('waterskin', 'healFractionPerDrop'));
	const effectiveHeal = Math.min(scene.hero.maxHp - scene.hero.hp, heal);
	if (effectiveHeal <= 0 && !force) return false;
	scene.hero.hp += effectiveHeal;
	scene.showHeal(scene.hero, scene.hero.hp - before);
	scene.grantHeroShield(shieldingDewGain(scene.subclass(), scene.talentRank('shielding_dew')), scene.hero.maxHp);
	scene.say(t('port.log.dewheals', { heal: scene.hero.hp - before }), 'positive');
	return true;
}

/** Potion selection plus Waterskin.DRINK; concrete potion effects remain scene services. */
export function quaffPotion(scene: ConsumableContext): boolean {
	const hurt = scene.hero.hp < scene.hero.maxHp;
	const ids = scene.requestedItemId === 'waterskin'
		? []
		: scene.bag.items.filter((i) => i.id.startsWith('potion') && i.quantity > 0).map((i) => i.id);
	if (ids.length === 0) {
		if (scene.waterskin <= 0) {
			scene.say(t('port.log.nothingtodrink'), 'negative');
			return false;
		}
		const rank = scene.talentRank('shielding_dew');
		let missingHealthPercent = 1 - scene.hero.hp / scene.hero.maxHp;
		if (rank > 0) {
			const maxShield = Math.round(scene.hero.maxHp * 0.2 * rank);
			const missingShieldPercent = Math.max(0, 1 - scene.heroBarrier.total / Math.max(1, maxShield)) * 0.2 * rank;
			missingHealthPercent += missingShieldPercent;
		}
		const healFraction = mwlItemEffectValue('waterskin', 'healFractionPerDrop');
		const dropsNeeded = Math.max(1, Math.min(scene.waterskin, Math.ceil(missingHealthPercent / healFraction - 0.01)));
		const heal = Math.round(scene.hero.maxHp * healFraction * dropsNeeded);
		const effectiveHeal = Math.min(scene.hero.maxHp - scene.hero.hp, heal);
		scene.hero.hp += effectiveHeal;
		if (rank > 0 && heal > effectiveHeal) {
			const maxShield = Math.round(scene.hero.maxHp * 0.2 * rank);
			scene.heroBarrier.add(Math.min(heal - effectiveHeal, Math.max(0, maxShield - scene.heroBarrier.total)));
		}
		scene.waterskin -= dropsNeeded;
		scene.say(t('port.log.drinkwaterskin', { heal: effectiveHeal }), 'positive');
		return true;
	}
	let id = scene.requestedItemId && ids.includes(scene.requestedItemId) ? scene.requestedItemId : ids[0];
	if (!scene.requestedItemId && hurt && ids.includes('potion')) id = 'potion';
	else if (!scene.requestedItemId && hurt && ids.includes('potionHealing')) id = 'potionHealing';
	else if (!scene.requestedItemId && ids.includes('potionStrength')) id = 'potionStrength';
	else if (!scene.requestedItemId && !hurt && (id === 'potion' || id === 'potionHealing') && ids.length === 1) {
		scene.say(t('port.log.savedraught'));
		return false;
	}
	scene.bag.remove(id, 1, scene.requestedItemInstanceId);
	scene.applyPotionEffect(id);
	return true;
}
