import { Roguelike } from 'mwg';
import { isChallengeEnabled } from '../challenges';
import { addBuff, applyElementalBacklash, buffBlocked, reigniteBuff, type BuffId, type Creature } from '../combat';
import { applyChillFreeze } from '../simulation/buffs';
import { brewNeighbourSeedPlan, SHROUDING_FOG_VOLUME } from '../simulation/brews';
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
	readonly clearFire: (x: number, y: number) => void;
	readonly seedToxicGas: (x: number, y: number, volume: number) => void;
	readonly seedParalyticGas: (x: number, y: number, volume: number) => void;
	readonly seedSmoke: (x: number, y: number, volume: number) => void;
	readonly eternalFireVolumeAt: (x: number, y: number) => number;
	readonly clearEternalFire: () => void;
	readonly showDamage: (target: Creature, amount: number) => void;
	readonly kill: (target: Creature) => void;
	readonly say: (line: string, level?: 'info' | 'positive' | 'negative' | 'warning') => void;
	get healingLeft(): number;
	set healingLeft(value: number);
	get healingPercent(): number;
	set healingPercent(value: number);
	set healingEvasionTurns(turns: number);
	readonly grantHeroShield: (amount: number, cap: number) => void;
}

/** `PotionOfHealing.cure()`: the curable debuffs this port models, shared by the potion, by
 * `RegrowthBomb` (which calls the same `cure()`/`heal()` pair), by Mageroyal (whose whole
 * effect is `cure()`), by the health well (`WaterOfHealth.affectHero()` calls `cure()` first)
 * and by the blessed-ankh revive. Java detaches Poison/Cripple/Weakness/Vulnerable/Bleeding/
 * Blindness/Drowsy/Slow/Vertigo, never Burning: Slow has no model here, and Java's own Daze
 * is a different buff (accuracy ×0.5, `Daze.DURATION` 5 - this port's `daze` table value is
 * exact), so the `daze` this port grants as a Blindness/Vertigo stand-in is deliberately
 * NOT cleared, matching Java not clearing Daze. */
export function cureHeroBuffs(hero: Creature): void {
	for (const b of ['poison', 'bleeding', 'weakness', 'vulnerable', 'cripple', 'drowsy', 'blindness'] as BuffId[]) delete hero.buffs[b];
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
export function createPotionEffects(scene: PotionEffectsContext): Record<string, () => void> {
	return {
		potion: () => applyPotionHealing(scene),
		potionHealing: () => applyPotionHealing(scene),
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
			//(20 turns) - the freerunner duration extension that stood here was
			//invented: real `SPEEDY_STEALTH` lives in `Momentum.java` (momentum while
			//already invisible), and this port has no Momentum system for it to act
			//through. Removed; the talent does nothing until Momentum exists.
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
		potionToxicGas: () => {
			shatterPotionAt(scene, 'potionToxicGas', scene.hero.x, scene.hero.y);
			scene.say(t('port.log.quafftoxicgas'), 'negative');
		},
		potionParalyticGas: () => {
			shatterPotionAt(scene, 'potionParalyticGas', scene.hero.x, scene.hero.y);
			scene.say(t('port.log.quaffparalyticgas'), 'negative');
		},
		potionHaste: () => {
			addBuff(scene.hero, 'haste');
			scene.say(t('port.log.quaffhaste'), 'positive');
		},
		potionFrost: () => {
			shatterPotionAt(scene, 'potionFrost', scene.hero.x, scene.hero.y);
			scene.say(t('port.log.quafffrost'), 'positive');
		},
		potionPurity: () => applyPotionPurity(scene.hero, scene.say),
		//`PotionOfShroudingFog.shatter()` (tag `v3.3.8`): 180 `SmokeScreen` on every
		//open NEIGHBOURS8 cell, the center taking 180 plus 180 per solid neighbour.
		//`Potion.apply()`'s default body is `shatter(hero.pos)`, so quaffing is the
		//shatter at the hero's feet - no cell picker exists here, and none is needed.
		//Java logs nothing on the shatter (neither do this port's brews), so neither
		//does this: the fog itself is the feedback.
		potionShrouding: () => { shatterPotionAt(scene, 'potionShrouding', scene.hero.x, scene.hero.y); },
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
export const AREA_SHATTER_POTION_IDS: ReadonlySet<string> = new Set(['potionFlame', 'potionToxicGas', 'potionParalyticGas', 'potionFrost', 'potionShrouding']);

/**
 * `Potion.shatter(cell)` for the malevolent potions (tag `v3.3.8`), centred on any cell: quaffing is
 * `apply(hero) = shatter(hero.pos)` and a thrown flask is `onThrow(cell) = shatter(cell)`, so both
 * routes share this. Frost chills every creature (the hero included) within the MWL target radius of
 * the cell - the `Freezing` blob's diffusion, applied at once - and clears Fire around it.
 */
export function shatterPotionAt(scene: PotionEffectsContext, id: string, cx: number, cy: number): void {
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
		case 'potionShrouding': {
			//180 `SmokeScreen` on every open NEIGHBOURS8 cell, the centre taking 180 plus 180 per solid neighbour.
			const plan = brewNeighbourSeedPlan((x, y) => !scene.level.inside(x, y) || scene.level.get(x, y) === WALL, cx, cy, SHROUDING_FOG_VOLUME);
			for (const seed of plan.seeds) scene.seedSmoke(seed.x, seed.y, seed.volume);
			scene.seedSmoke(cx, cy, plan.centerVolume);
			return;
		}
		case 'potionFrost': {
			let touchesFire = false;
			const radius = mwlItemEffectValue('potionFrost', 'radius');
			for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
				const x = cx + dx, y = cy + dy;
				if (scene.eternalFireVolumeAt(x, y) >= 1) touchesFire = true;
				//`Freezing.evolve()` clears ordinary Fire at every affected cell; its seeds cover NEIGHBOURS9
				//only, so the clear runs at Chebyshev 1 even though the loop scans the MWL radius.
				if (scene.level.inside(x, y) && Math.max(Math.abs(dx), Math.abs(dy)) <= 1) scene.clearFire(x, y);
			}
			if (touchesFire) {
				scene.clearEternalFire();
				scene.say(t('port.log.frostfire'), 'positive');
			}
			const targetRadius = mwlItemEffectValue('potionFrost', 'targetRadius');
			//No Java source deals direct frost damage: `Freezing` only chills (see the 15th matrix).
			for (const target of new Set<Creature>([scene.hero, ...scene.creatures])) {
				if (target.hp <= 0 || Roguelike.chebyshevDistance(target, { x: cx, y: cy }) > targetRadius) continue;
				if (target !== scene.hero && !scene.level.passable(target.x, target.y)) continue;
				delete target.buffs['burning'];
				//`Elemental.add()`'s hate-listed chill backslashes instead of attaching - a fire-typed target takes the backlash.
				if (target === scene.hero || applyElementalBacklash(target, 'chill') === 0) target.buffs = applyChillFreeze(target.buffs).buffs;
				if (target.hp <= 0) scene.kill(target);
			}
			return;
		}
	}
}
