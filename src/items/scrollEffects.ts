import { Roguelike } from 'mwg';
import { addBuff, type Creature, type Step } from '../combat';
import { t } from '../i18n/index';
import { mwlItemEffectValue } from '../mwlContent';

/**
 * Scroll effects are item-domain rules. The scene supplies only world services
 * (FOV, movement, spawning and combat), keeping level orchestration out of the
 * item graph. Values and effect shape follow SPD's ScrollOf* classes.
 */
export interface ScrollEffectsContext {

	readonly hero: Creature;
	readonly creatures: Creature[];
	readonly level: { width: number; height: number; passable(x: number, y: number): boolean };
	readonly fov: { isVisible(x: number, y: number): boolean; revealAll(): void };
	readonly secrets: { isSecret(x: number, y: number): boolean; discover(x: number, y: number): void };
	isChasmCell(x: number, y: number): boolean;
	readonly creatureAt: (x: number, y: number) => Creature | null | undefined;
	readonly spawnMirrorImage: (at: Step) => void;
	readonly randomFreeCell: (exclude: Step) => Step | undefined;
	readonly moveTo: (creature: Creature, to: Step) => void;
	readonly playTeleportAppear: (from: Step, to: Step, entity: Creature) => void;
	readonly restitchAllTiles: () => void;
	readonly showDamage: (target: Creature, amount: number) => void;
	readonly kill: (target: Creature) => void;
	readonly say: (message: string, level?: 'positive' | 'negative' | 'warning') => void;
}

export function applyScrollEffect(id: string, context: ScrollEffectsContext): boolean {
	const { hero, creatures, fov } = context;
	if (id === 'scrollRage') {
		for (const creature of creatures) {
			if (creature.isHero || creature.isNPC) continue;
			creature.sleeping = false;
			creature.seesHero = true;
			if (!creature.isAlly && fov.isVisible(creature.x, creature.y)) addBuff(creature, 'amok');
		}
		context.say(t('port.log.rage'));
		return true;
	}
	if (id === 'scrollLullaby') {
		for (const creature of creatures) if (!creature.isHero && !creature.isNPC && fov.isVisible(creature.x, creature.y)) addBuff(creature, 'drowsy');
		addBuff(hero, 'drowsy');
		context.say(t('port.log.lullaby'));
		return true;
	}
	if (id === 'scrollMapping') {
		fov.revealAll();
		for (let y = 0; y < context.level.height; y++) for (let x = 0; x < context.level.width; x++) {
			if (context.secrets.isSecret(x, y)) context.secrets.discover(x, y);
		}
		context.restitchAllTiles();
		context.say(t('port.log.mapping'), 'positive');
		return true;
	}
	if (id === 'scrollMirror') {
		const cells = Roguelike.neighbourOffsets(8)
			.map(([dx, dy]) => ({ x: hero.x + dx, y: hero.y + dy }))
			.filter((at) => context.level.passable(at.x, at.y) && !context.isChasmCell(at.x, at.y) && !context.creatureAt(at.x, at.y));
		for (const at of cells.slice(0, mwlItemEffectValue('scrollMirror', 'imageCount'))) context.spawnMirrorImage(at);
		context.say(t('port.log.mirror'), 'positive');
		return true;
	}
	if (id === 'scrollRecharging') {
		addBuff(hero, 'recharging');
		context.say(t('port.log.recharging'), 'positive');
		return true;
	}
	if (id === 'scrollTeleportation') {
		delete hero.buffs['roots'];
		const destination = context.randomFreeCell(hero);
		if (destination) {
			const teleportFrom = { x: hero.x, y: hero.y };
			context.moveTo(hero, destination);
			context.playTeleportAppear(teleportFrom, destination, hero);
			context.say(t('items.scrolls.scrollofteleportation.tele'), 'positive');
		} else context.say(t('items.scrolls.scrollofteleportation.no_tele'), 'negative');
		return true;
	}
	if (id === 'scrollTerror') {
		const affected: Creature[] = [];
		for (const creature of creatures) if (!creature.isHero && !creature.isNPC && fov.isVisible(creature.x, creature.y)) {
			addBuff(creature, 'terror');
			affected.push(creature);
		}
		if (affected.length === 0) context.say(t('items.scrolls.scrollofterror.none'), 'negative');
		else if (affected.length === 1) context.say(t('items.scrolls.scrollofterror.one', { '0': affected[0]!.name }), 'positive');
		else context.say(t('items.scrolls.scrollofterror.many'), 'positive');
		return true;
	}
	if (id === 'scrollRetribution') {
		const missingHpFraction = (hero.maxHp - hero.hp) / hero.maxHp;
		const power = Math.min(mwlItemEffectValue('scrollRetribution', 'maxPower'),
			mwlItemEffectValue('scrollRetribution', 'powerPerMissingHp') * missingHpFraction);
		for (const creature of [...creatures]) {
			//`ScrollOfRetribution` is one of `AntiMagic.RESISTS`' listed source classes -
			//`Char.damage()` zeroes this blast for a MagicImmune creature the same way it does
			//for every other RESISTS-listed source.
			if (creature.isHero || creature.isNPC || !fov.isVisible(creature.x, creature.y) || creature.magicImmune) continue;
			const damage = Math.round(creature.maxHp * mwlItemEffectValue('scrollRetribution', 'baseHpFraction')
				+ creature.hp * power * mwlItemEffectValue('scrollRetribution', 'targetHpScale'));
			creature.hp -= damage;
			context.showDamage(creature, damage);
			if (creature.hp <= 0) context.kill(creature);
		}
		addBuff(hero, 'weakness');
		context.say(t('items.scrolls.scrollofretribution.blast'), 'warning');
		return true;
	}
	return false;
}
