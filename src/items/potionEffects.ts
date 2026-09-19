import { Roguelike } from 'mwg';
import { addBuff, type Creature } from '../combat';
import { applyChillFreeze } from '../simulation/buffs';
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
	readonly eternalFireVolumeAt: (x: number, y: number) => number;
	readonly clearEternalFire: () => void;
	readonly showDamage: (target: Creature, amount: number) => void;
	readonly kill: (target: Creature) => void;
	readonly say: (line: string, level?: 'info' | 'positive' | 'negative' | 'warning') => void;
	readonly applyPotionHealing: () => void;
	readonly applyPotionPurity: () => void;
}

/** Potion subclasses' effects. Scene-dependent services are injected so this registry remains in the item graph. */
export function createPotionEffects(scene: PotionEffectsContext): Record<string, () => void> {
	return {
		potion: () => scene.applyPotionHealing(),
		potionHealing: () => scene.applyPotionHealing(),
		potionStrength: () => {
			scene.heroStr += mwlItemEffectValue('potionStrength', 'strengthBonus');
			scene.syncHeroFromStats();
			scene.say(t('port.log.stronger', { str: scene.heroStr }), 'positive');
		},
		// PotionOfLiquidFlame.shatter() uses NEIGHBOURS9. Quaffing has no thrown-cell picker,
		// so the hero cell is the deliberate center used by this port.
		potionFlame: () => {
			let seeded = 0;
			for (const [dx, dy] of Roguelike.neighbourOffsets(8).concat([[0, 0] as [number, number]])) {
				const x = scene.hero.x + dx, y = scene.hero.y + dy;
				if (!scene.level.inside(x, y) || scene.level.get(x, y) === WALL) continue;
				scene.seedFire(x, y, mwlItemEffectValue('potionFlame', 'fireVolume'));
				seeded++;
			}
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
			scene.seedToxicGas(scene.hero.x, scene.hero.y, mwlItemEffectValue('potionToxicGas', 'gasVolume'));
			scene.say(t('port.log.quafftoxicgas'), 'negative');
		},
		potionParalyticGas: () => {
			scene.seedParalyticGas(scene.hero.x, scene.hero.y, mwlItemEffectValue('potionParalyticGas', 'gasVolume'));
			scene.say(t('port.log.quaffparalyticgas'), 'negative');
		},
		potionHaste: () => {
			addBuff(scene.hero, 'haste');
			scene.say(t('port.log.quaffhaste'), 'positive');
		},
		potionFrost: () => {
			delete scene.hero.buffs['burning'];
			scene.hero.buffs = applyChillFreeze(scene.hero.buffs).buffs;
			let touchesFire = false;
			const radius = mwlItemEffectValue('potionFrost', 'radius');
			for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
				const x = scene.hero.x + dx, y = scene.hero.y + dy;
				if (scene.eternalFireVolumeAt(x, y) >= 1) touchesFire = true;
				//`Freezing.evolve()` (tag `v3.3.8`) clears ordinary Fire at every affected
				//cell before applying its freeze effect. The previous port only cleared the
				//hero's Burning marker and the separate EternalFire wall.
				if (scene.level.inside(x, y)) scene.clearFire(x, y);
			}
			if (touchesFire) {
				scene.clearEternalFire();
				scene.say(t('port.log.frostfire'), 'positive');
			}
			const targets = scene.creatures.filter((creature) => creature.hp > 0
				&& Roguelike.chebyshevDistance(creature, scene.hero) <= mwlItemEffectValue('potionFrost', 'targetRadius')
				&& scene.level.passable(creature.x, creature.y));
			//No Java source deals direct frost damage to elementals: `PotionOfFrost.shatter()`
			//only seeds `Freezing` blobs (tag `v3.3.8`), and `Freezing` itself only chills.
			//The maxHp-fraction scald that stood here was invented - and hit frost
			//elementals with frost besides. Removed; the chill below is what remains.
			//Found by the 15th monster-analysis matrix (potions).
			for (const target of targets) {
				delete target.buffs['burning'];
				target.buffs = applyChillFreeze(target.buffs).buffs;
				if (target.hp <= 0) scene.kill(target);
			}
			scene.say(t('port.log.quafffrost'), 'positive');
		},
		potionPurity: () => scene.applyPotionPurity(),
	};
}
