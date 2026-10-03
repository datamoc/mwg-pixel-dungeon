import { Roguelike } from 'mwg';
import { isChallengeEnabled } from '../challenges';
import { BUFF_DURATION, addBuff, buffBlocked, reigniteBuff, type BuffId, type Creature } from '../combat';
import { brewNeighbourSeedPlan, SHROUDING_FOG_VOLUME } from '../simulation/brews';
import { aquaHealingDose } from '../simulation/aquaHealing';
import { WALL } from '../dungeonConstants';
import { t } from '../i18n';
import { mwlItemEffectValue } from '../mwlContent';

export interface PotionEffectsContext {
	readonly hero: Creature;
	readonly creatures: Creature[];
	readonly level: { width: number; inside(x: number, y: number): boolean; passable(x: number, y: number): boolean; get(x: number, y: number): number };
	get heroStr(): number;
	set heroStr(value: number);
	readonly progression: { level: number };
	readonly experienceFor: (level: number) => number;
	readonly depth: number;
	readonly subclass: () => string | null;
	readonly talentRank: (id: string) => number;
	readonly syncHeroFromStats: () => void;
	readonly grantExperience: (amount: number) => void;
	readonly seedFire: (x: number, y: number, volume: number) => void;
	/** `PotionOfFrost.shatter()` seeds volume 10 into each non-solid `NEIGHBOURS9` cell. */
	readonly seedFreeze: (x: number, y: number, volume: number) => void;
	readonly clearFire: (x: number, y: number) => void;
	readonly seedToxicGas: (x: number, y: number, volume: number) => void;
	readonly seedParalyticGas: (x: number, y: number, volume: number) => void;
	readonly seedSmoke: (x: number, y: number, volume: number) => void;
	/** `StormCloud` / `CorrosiveGas.setStrength(2 + scalingDepth/5)` seeds for the exotic gas potions (absent in test doubles). */
	readonly seedStormCloud?: (x: number, y: number, volume: number) => void;
	readonly seedCorrosiveGas?: (x: number, y: number, volume: number) => void;
	/** `Freezing.freeze(cell)`'s `heap.freeze()` at one cell. */
	readonly freezeHeapAt: (x: number, y: number) => void;
	readonly seedConfusionGas: (x: number, y: number, volume: number) => void;
	/** Clears every harmful blob (`BlobImmunity.immunities()`) at one cell, `PotionOfPurity.shatter`'s `blob.clear(i)`. */
	readonly clearHarmfulBlobs: (x: number, y: number) => void;
	readonly eternalFireVolumeAt: (x: number, y: number) => number;
	readonly clearEternalFire: () => void;
	/** `Dungeon.level.heroFOV[cell]` - the gate Java's shatter identify sits behind. */
	readonly cellVisible: (x: number, y: number) => boolean;
	/** `Potion.setKnown()` on a visible shatter - the scene owns the run-wide class set (R112). */
	readonly markPotionKindsKnown: (ids: string[]) => void;
	readonly showDamage: (target: Creature, amount: number) => void;
	readonly kill: (target: Creature) => void;
	readonly say: (line: string, level?: 'info' | 'positive' | 'negative' | 'warning') => void;
	get healingLeft(): number;
	set healingLeft(value: number);
	get healingPercent(): number;
	set healingPercent(value: number);
	set healingEvasionTurns(turns: number);
	get aquaHealingLeft(): number;
	set aquaHealingLeft(value: number);
	readonly grantHeroShield: (amount: number, cap: number) => void;
	/** `Barrier.setShield()` raises the pool to a minimum, without adding to a larger shield. */
	readonly setHeroBarrier: (amount: number) => void;
	/** `Barkskin.conditionallyAppend(hero, level, interval)`'s keep-max single slot. */
	/** `Healing.applyVialEffect()` after a `setHeal`. */
	readonly applyVialEffect?: () => void;
	readonly setHeroBarkskin: (level: number, interval: number) => void;
	/** `PotionOfCleansing.cleanse(ch, duration)`: detach the negative buffs, satisfy hunger, prolong `Cleanse`. */
	readonly cleanseCharacter: (target: Creature, duration: number) => void;
}

/** `PotionOfShielding.apply()` / `PotionOfHealing.pharmacophobiaProc()`, tag `v3.3.8`. */
export function applyPotionShielding(context: PotionEffectsContext): void {
	// Java calls identify() before applying the effect, updating shared Healing/Shielding
	// class knowledge. The port records that class state run-wide in `applyPotionEffect`
	// (`inventoryQuickslot.ts` - every quaff path marks the class before dispatching the
	// effect), so this potion inherits its identification like every other one (R112,
	// landed 2026-10-01; the store lives in `items/potionKnow.ts`).
	if (isChallengeEnabled('no_healing')) {
		if (!buffBlocked(context.hero, 'poison')) context.hero.buffs.poison = 4 + Math.floor(context.progression.level / 2);
		context.say(t('port.log.pharmacophobia'), 'negative');
		return;
	}
	const amount = Math.floor(context.hero.maxHp * mwlItemEffectValue('potionShielding', 'shieldHpRatio') + mwlItemEffectValue('potionShielding', 'shieldBase'));
	context.setHeroBarrier(amount);
	// Java shows a floating shield count and icon on the hero. The port uses its existing
	// positive shield log; it has no floating shielding-icon renderer.
	context.say(t('port.log.shield', { amount }), 'positive');
}

/** `PotionOfHealing.cure()`: the curable debuffs this port models, shared by the potion, by
 * `RegrowthBomb` (which calls the same `cure()`/`heal()` pair), by Mageroyal (whose whole
 * effect is `cure()`), by the health well (`WaterOfHealth.affectHero()` calls `cure()` first)
 * and by the blessed-ankh revive. Java detaches Poison/Cripple/Weakness/Vulnerable/Bleeding/
 * Blindness/Drowsy/Slow/Vertigo, never Burning: Slow has no model here, and Java's own Daze
 * is a different buff (accuracy ×0.5, `Daze.DURATION` 5 - this port's `daze` table value is
 * exact). Vertigo is now the real `vertigo` buff (cleared above, 2026-09-24); `daze` remains
 * only this port's Blindness stand-in and is deliberately NOT cleared, matching Java not
 * clearing Daze. */
/** `ElixirOfAquaticRejuvenation.apply()` (tag `v3.3.8`): under Pharmacophobia the
 * shared poison branch runs instead (`PotionOfHealing.pharmacophobiaProc()` -
 * Poison(4+lvl/2), no cure, no heal); otherwise the hero banks an `AquaHealing`
 * pool of `round(HT*1.5)`, keep-max like `AquaHealing.set()`. Java's `apply()`
 * has no `identify()` call (unlike Healing/Shielding), so the quaff stays
 * anonymous - quaffPotion threads `POTION_QUAFF_ANONYMOUS` through the dispatch.
 * No apply line and no floating text here (Java plays neither); the per-turn
 * payout shows the heal. The buff icon/tint stay unpresented, like every other
 * buff here. `resting = false` has no expression - the port has no rest state. */
export function applyAquaHealing(context: PotionEffectsContext): void {
	if (isChallengeEnabled('no_healing')) {
		if (!buffBlocked(context.hero, 'poison')) context.hero.buffs['poison'] = 4 + Math.floor(context.progression.level / 2);
		context.say(t('port.log.pharmacophobia'), 'negative');
		return;
	}
	context.aquaHealingLeft = Math.max(context.aquaHealingLeft, aquaHealingDose(context.hero.maxHp));
}

export function cureHeroBuffs(hero: Creature): void {
	for (const b of ['poison', 'bleeding', 'weakness', 'vulnerable', 'cripple', 'drowsy', 'blindness', 'vertigo'] as BuffId[]) delete hero.buffs[b];
}

export function applyPotionHealing(context: PotionEffectsContext): void {
	//PotionOfHealing.apply(): cure() always runs first regardless of the challenge below.
	//Real cure() also detaches Bleeding/Blindness/Drowsy/Slow/Vertigo. Only Bleeding and
	//Drowsy exist in this port so far, and both are cleared here. It does NOT touch Burning; that was
	//a real, unwarranted addition here (2026-09-09 item-system audit) - a healing potion
	//does not extinguish fire in real Java, removed.
	cureHeroBuffs(context.hero);
	if (isChallengeEnabled('no_healing')) {
		//PotionOfHealing.heal()'s real NO_HEALING branch: no Healing buff at all (so none
		//of the restored_*-talent triggers below fire either, since they key off the heal
		//actually happening), instead pharmacophobiaProc() sets a fresh Poison(4+lvl/2) -
		//found dead alongside the other challenge audits this session.
		if (!buffBlocked(context.hero, 'poison')) context.hero.buffs['poison'] = 4 + Math.floor(context.progression.level / 2);
		context.say(t('port.log.pharmacophobia'), 'negative');
	} else {
		//PotionOfHealing.heal(): `Buff.affect(ch, Healing.class).setHeal((int)(0.8*HT+14), 0.25, 0)`
		//- a gradual heal-over-time, not an instant full heal (see the applyBuffDamage tick
		//in spendHeroTurn). `setHeal` only replaces `healingLeft` if the new amount is bigger,
		//so quaffing a second potion mid-heal doesn't stack additively on top of the first -
		//and it takes the property-wise maximum, so a Warden sungrass's flat 1/turn survives
		//a later potion (and vice versa) exactly as Java's `Math.max` on each field does.
		const amount = Math.round(0.8 * context.hero.maxHp + 14);
		if (amount > context.healingLeft) context.healingLeft = amount;
		context.healingPercent = Math.max(context.healingPercent, 0.25);
		context.applyVialEffect?.();
		const willpower = context.talentRank('restored_willpower');
		if (willpower > 0) context.grantHeroShield(Math.round(context.hero.maxHp * (willpower === 1 ? 0.67 : 1)), context.hero.maxHp);
		if (context.talentRank('restored_agility') > 0) { context.healingEvasionTurns = 1; context.syncHeroFromStats(); }
		const nature = context.talentRank('restored_nature');
		if (nature > 0) for (const enemy of context.creatures.filter(c => !c.isHero && !c.isNPC && Roguelike.chebyshevDistance(context.hero, c) <= 1)) addBuff(enemy, 'roots');
		context.say(t('port.log.quaffhealing'), 'positive');
	}
}

export function applyPotionPurity(hero: Creature, say: PotionEffectsContext['say']): void {
	//`PotionOfPurity.apply()` (`PotionOfPurity.java`, tag `v3.3.8`) only prolongs
	//`BlobImmunity` for its full `DURATION` (20) - it cures nothing. The poison/burning
	//deletion that stood here misattributed the *shatter* path's radius blob-clearing
	//(`shatter()` clears every blob in `affectedBlobs`, Java's `GasCloud`/`Fire`
	//extinguish) to the quaff. `reigniteBuff` is the shared prolong (keep-max)
	//primitive, matching Java's `Buff.prolong`; the duration is explicit because the
	//authored table's 10 is the Warden Mageroyal half-duration (`DURATION/2f`), not
	//this quaff's full 20. See `PORT_COVERAGE.md`.
	reigniteBuff(hero, 'blobImmunity', 20);
	say(t('items.potions.potionofpurity.protected'), 'positive');
}

/** Potion subclasses' effects. Scene-dependent services are injected so this registry remains in the item graph. */
// `Blandfruit.imbuePotion().anonymize()` (v3.3.8) must survive the apply-to-shatter
// path: a cooked fruit effect may shatter visibly without revealing its potion class.
export function createPotionEffects(scene: PotionEffectsContext): Record<string, (opts?: { anonymous?: boolean }) => void> {
	return {
		potion: () => applyPotionHealing(scene),
		potionHealing: () => applyPotionHealing(scene),
		potionShielding: () => applyPotionShielding(scene),
	elixirAquaticRejuvenation: () => applyAquaHealing(scene),
		potionStrength: () => {
			scene.heroStr += mwlItemEffectValue('potionStrength', 'strengthBonus');
			scene.syncHeroFromStats();
			scene.say(t('port.log.stronger', { str: scene.heroStr }), 'positive');
		},
		// PotionOfLiquidFlame.shatter() uses NEIGHBOURS9. Quaffing has no thrown-cell picker,
		// so the hero cell is the deliberate center used by this port.
		potionFlame: () => {
			const seeded = shatterFlame(scene, scene.hero.x, scene.hero.y);
			scene.say(seeded > 0 ? t('port.log.hurlflame', { target: t('port.name.you') }) : t('port.log.flaskwasted'), seeded > 0 ? undefined : 'negative');
		},
		potionMindVision: () => {
			addBuff(scene.hero, 'mindvision');
			scene.say(t(scene.creatures.some((c) => !c.isHero && !c.isNPC) ? 'port.log.mindvisionmobs' : 'port.log.mindvisionnone'), 'positive');
		},
		potionInvis: () => {
			//`PotionOfInvisibility.apply()` (tag `v3.3.8`) only prolongs `Invisibility`
			//(20 turns). `SPEEDY_STEALTH` gains its two Momentum stacks on each later
			//invisible actor tick (`Momentum.act()`), not as a potion-specific extension.
			//Found by the 15th monster-analysis matrix (potions).
			addBuff(scene.hero, 'invisibility');
			scene.say(t('port.log.invisible'), 'positive');
		},
		potionExperience: () => {
			const maxExp = scene.experienceFor(scene.progression.level + 1) - scene.experienceFor(scene.progression.level);
			scene.grantExperience(maxExp);
			scene.say(t('port.log.quaffexperience'), 'positive');
		},
		potionLevitation: () => {
			addBuff(scene.hero, 'levitation');
			delete scene.hero.buffs['roots'];
			scene.say(t('port.log.levitate'), 'positive');
		},
		potionToxicGas: (opts) => {
			shatterPotionAt(scene, 'potionToxicGas', scene.hero.x, scene.hero.y, opts);
			scene.say(t('port.log.quafftoxicgas'), 'negative');
		},
		potionParalyticGas: (opts) => {
			shatterPotionAt(scene, 'potionParalyticGas', scene.hero.x, scene.hero.y, opts);
			scene.say(t('port.log.quaffparalyticgas'), 'negative');
		},
		potionHaste: () => {
			addBuff(scene.hero, 'haste');
			scene.say(t('port.log.quaffhaste'), 'positive');
		},
		potionFrost: (opts) => {
			shatterPotionAt(scene, 'potionFrost', scene.hero.x, scene.hero.y, opts);
			scene.say(t('port.log.quafffrost'), 'positive');
		},
		potionPurity: () => applyPotionPurity(scene.hero, scene.say),
		//The exotic potions' `apply()` bodies (`items/potions/exotic/*.java`, tag `v3.3.8`). Each
		//identifies first (the shared quaff dispatch marks the class) and Java logs nothing itself;
		//the buff icon is the feedback. Thrown, they splash harmlessly like `potionHaste` does -
		//`PotionOfCleansing.shatter()`'s cleanse-the-target-at-the-cell half is not ported.
		potionEarthenArmor: () => scene.setHeroBarkskin(2 + Math.floor(scene.progression.level / 3), 50),
		potionStamina: () => { addBuff(scene.hero, 'stamina'); },
		potionMagicalSight: () => { addBuff(scene.hero, 'magicalSight'); delete scene.hero.buffs['blindness']; },
		potionCleansing: () => scene.cleanseCharacter(scene.hero, BUFF_DURATION['cleanseImmunity']),
		//`PotionOfShroudingFog.shatter()` (tag `v3.3.8`): 180 `SmokeScreen` on every
		//open NEIGHBOURS8 cell, the center taking 180 plus 180 per solid neighbour.
		//`Potion.apply()`'s default body is `shatter(hero.pos)`, so quaffing is the
		//shatter at the hero's feet - no cell picker exists here, and none is needed.
		//Java logs nothing on the shatter (neither do this port's brews), so neither
		//does this: the fog itself is the feedback.
		potionShrouding: (opts) => { shatterPotionAt(scene, 'potionShrouding', scene.hero.x, scene.hero.y, opts); },
		//`Potion.apply()`'s default body is `shatter(hero.pos)`: the three exotic gas flasks burst at the quaffer's feet.
		potionStormClouds: (opts) => { shatterPotionAt(scene, 'potionStormClouds', scene.hero.x, scene.hero.y, opts); },
		potionCorrosiveGas: (opts) => { shatterPotionAt(scene, 'potionCorrosiveGas', scene.hero.x, scene.hero.y, opts); },
		potionSnapFreeze: (opts) => { shatterPotionAt(scene, 'potionSnapFreeze', scene.hero.x, scene.hero.y, opts); },
	};
}

/** `PotionOfLiquidFlame.shatter()`: Fire on the `NEIGHBOURS9` cells around `(x, y)` that are not wall. */
function shatterFlame(scene: PotionEffectsContext, cx: number, cy: number): number {
	let seeded = 0;
	for (const [dx, dy] of Roguelike.neighbourOffsets(8).concat([[0, 0] as [number, number]])) {
		const x = cx + dx, y = cy + dy;
		if (!scene.level.inside(x, y) || scene.level.get(x, y) === WALL) continue;
		scene.seedFire(x, y, mwlItemEffectValue('potionFlame', 'fireVolume'));
		seeded++;
	}
	return seeded;
}

/** The potions whose `shatter(cell)` has an area effect here; every other potion breaks harmlessly. */
export const AREA_SHATTER_POTION_IDS: ReadonlySet<string> = new Set(['potionFlame', 'potionToxicGas', 'potionParalyticGas', 'potionFrost', 'potionShrouding', 'potionLevitation', 'potionPurity', 'potionStormClouds', 'potionCorrosiveGas', 'potionSnapFreeze']);

/**
 * `Potion.shatter(cell)` for the malevolent potions (tag `v3.3.8`), centred on any cell: quaffing is
 * `apply(hero) = shatter(hero.pos)` and a thrown flask is `onThrow(cell) = shatter(cell)`, so both
 * routes share this. Frost chills every creature (the hero included) within the MWL target radius of
 * the cell - the `Freezing` blob's diffusion, applied at once - and clears Fire around it.
 */
export function shatterPotionAt(scene: PotionEffectsContext, id: string, cx: number, cy: number, opts?: { anonymous?: boolean }): void {
	// Java's shatter identifies inside `if (Dungeon.level.heroFOV[cell])` for every override
	// that says so (`PotionOfFrost.java:44`, `PotionOfToxicGas.java:43`, `PotionOfLiquidFlame.java:44`,
	// `PotionOfParalyticGas.java:43`, `PotionOfLevitation.java:48`, `PotionOfPurity.java:86`,
	// `ExoticPotion`'s `PotionOfShroudingFog.java:44` - tag `v3.3.8`) - exactly this port's
	// area set; base `Potion.shatter` splashes without identifying. A thrown flask reaches
	// here directly (`onThrow(cell) = shatter(cell)`), beyond `applyPotionEffect`'s quaff-only
	// mark, so the class record is written here too (R112). An anonymized shatter -
	// the UnstableBrew's rolled flask - suppresses that mark like `setKnown()` does.
	if (!opts?.anonymous && AREA_SHATTER_POTION_IDS.has(id) && scene.cellVisible(cx, cy)) scene.markPotionKindsKnown([id]);
	switch (id) {
		case 'potionFlame':
			shatterFlame(scene, cx, cy);
			return;
		case 'potionToxicGas':
			scene.seedToxicGas(cx, cy, mwlItemEffectValue('potionToxicGas', 'gasVolume'));
			return;
		case 'potionParalyticGas':
			scene.seedParalyticGas(cx, cy, mwlItemEffectValue('potionParalyticGas', 'gasVolume'));
			return;
		case 'potionLevitation':
			//`PotionOfLevitation.shatter()`: a flask of 1000 `ConfusionGas` at the cell (not a harmless splash).
			scene.seedConfusionGas(cx, cy, 1000);
			return;
		case 'potionPurity': {
			//`PotionOfPurity.shatter()`: every harmful blob is cleared from the cells within path distance 3
			//(a flood over non-solid cells), then SPD's own `freshness` line when the cell is in view.
			const seen = new Map<number, number>([[cy * scene.level.width + cx, 0]]);
			const queue: [number, number][] = [[cx, cy]];
			for (let head = 0; head < queue.length; head++) {
				const [x, y] = queue[head]!;
				scene.clearHarmfulBlobs(x, y);
				const d = seen.get(y * scene.level.width + x)!;
				if (d >= 3) continue;
				for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
					const nx = x + dx, ny = y + dy, key = ny * scene.level.width + nx;
					if (seen.has(key) || !scene.level.inside(nx, ny) || scene.level.get(nx, ny) === WALL) continue;
					seen.set(key, d + 1);
					queue.push([nx, ny]);
				}
			}
			scene.say(t('items.potions.potionofpurity.freshness'));
			return;
		}
		case 'potionShrouding': {
			//180 `SmokeScreen` on every open NEIGHBOURS8 cell, the centre taking 180 plus 180 per solid neighbour.
			const plan = brewNeighbourSeedPlan((x, y) => !scene.level.inside(x, y) || scene.level.get(x, y) === WALL, cx, cy, SHROUDING_FOG_VOLUME);
			for (const seed of plan.seeds) scene.seedSmoke(seed.x, seed.y, seed.volume);
			scene.seedSmoke(cx, cy, plan.centerVolume);
			return;
		}
		case 'potionStormClouds':
		case 'potionCorrosiveGas': {
			//`PotionOfStormClouds.shatter()` seeds 120 `StormCloud` and `PotionOfCorrosiveGas.shatter()` 25 `CorrosiveGas` (strength
			//`2 + scalingDepth/5`) on every open NEIGHBOURS8 cell; the centre takes the same amount plus one more per solid neighbour.
			const each = id === 'potionStormClouds' ? 120 : 25;
			const seed = id === 'potionStormClouds' ? scene.seedStormCloud : scene.seedCorrosiveGas;
			if (!seed) return;
			const plan = brewNeighbourSeedPlan((x, y) => !scene.level.inside(x, y) || scene.level.get(x, y) === WALL, cx, cy, each);
			for (const s of plan.seeds) seed(s.x, s.y, s.volume);
			seed(cx, cy, plan.centerVolume);
			return;
		}
		case 'potionSnapFreeze': {
			//`PotionOfSnapFreeze.shatter()`: `Freezing.affect` on every non-solid NEIGHBOURS9 cell, and whatever stands there is rooted
			//for twice `Roots.DURATION`.
			scene.clearFire(cx, cy);
			for (const [dx, dy] of Roguelike.neighbourOffsets(8).concat([[0, 0]])) {
				const x = cx + dx, y = cy + dy;
				if (!scene.level.inside(x, y) || !scene.level.passable(x, y)) continue;
				scene.seedFreeze(x, y, 10);
				for (const c of scene.creatures) if (c.x === x && c.y === y && c.hp > 0) addBuff(c, 'roots', 2 * BUFF_DURATION['roots']);
			}
			return;
		}
		case 'potionFrost': {
			//`items/potions/PotionOfFrost.java:shatter()` (tag `v3.3.8`) seeds volume 10
			//into each non-solid `PathFinder.NEIGHBOURS9` cell. `actors/blobs/Freezing.java:evolve()` then clears Fire and
			//calls `Freezing.freeze()` on each live cell over subsequent blob ticks.
			//The former direct radius-2 chill was an approximation that skipped this
			//persistent cadence and affected cells Java never seeds.
			//`Potion.splash()` clears ordinary Fire immediately at the impact cell.
			scene.clearFire(cx, cy);
			for (const [dx, dy] of Roguelike.neighbourOffsets(8).concat([[0, 0]])) {
				const x = cx + dx, y = cy + dy;
				if (scene.level.inside(x, y) && scene.level.passable(x, y)) scene.seedFreeze(x, y, 10);
			}
			return;
		}
	}
}
