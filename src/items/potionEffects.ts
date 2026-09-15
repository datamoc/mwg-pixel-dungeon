import { Random, Roguelike } from 'mwg';
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
			addBuff(scene.hero, 'invisibility');
			if (scene.subclass() === 'freerunner' && scene.talentRank('speedy_stealth') > 0) scene.hero.buffs['invisibility'] = mwlItemEffectValue('potionInvis', 'durationBase')
				+ mwlItemEffectValue('potionInvis', 'durationPerTalent') * scene.talentRank('speedy_stealth');
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
			for (const target of targets) {
				if (target.kind === 'elemental' || target.kind === 'newbornElemental') {
					const scald = Random.normalRange(
						Math.floor(target.maxHp * mwlItemEffectValue('potionFrost', 'scaldMinFraction')),
						Math.floor(target.maxHp * mwlItemEffectValue('potionFrost', 'scaldMaxFraction')),
					);
					target.hp -= scald;
					scene.showDamage(target, scald);
				}
				delete target.buffs['burning'];
				target.buffs = applyChillFreeze(target.buffs).buffs;
				if (target.hp <= 0) scene.kill(target);
			}
			scene.say(t('port.log.quafffrost'), 'positive');
		},
		potionPurity: () => scene.applyPotionPurity(),
	};
}
