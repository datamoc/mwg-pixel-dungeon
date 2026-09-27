import type { DungeonScene } from '../../dungeonScene';
import { Game } from 'mwg';
import { addBuff, type Creature, type Step } from '../../../combat';
import { POWER_OF_MANY_TURNS } from '../../../simulation/clericSpells';
import { TILE } from '../../../dungeonConstants';
import { runState } from '../../../runState';
import { t } from '../../../i18n';
import type { ArmorAbilityDef } from '../../../armorAbilities';

/** `PowerOfMany.activate()` (`PowerOfMany.java`, tag `v3.3.8`) and its owned-ally lookup. */
export const powerOfManyMethods = {
	/** Empowers one visible ally or summons the dedicated LightAlly. */
	activatePowerOfMany(this: DungeonScene, _def: ArmorAbilityDef, cost: number, cell: Step | null): boolean {
		const powered = this.poweredAlly();
		if (powered?.allyKind === 'lightAlly') {
			if (!cell) return false;
			this.directAlly(powered, cell, {
				defend: 'port.ally.order.defend', follow: 'port.ally.order.follow', attack: 'port.ally.order.attack',
			});
			return true;
		}
		// Java refuses another cast while any non-LightAlly actor already carries PowerBuff.
		if (powered) {
			this.say(t('port.ally.already_powered'), 'warning');
			return true;
		}
		if (!cell) return false;
		if (!this.fov.isVisible(cell.x, cell.y)) {
			this.say(t('port.ally.novision'), 'negative');
			return false;
		}
		const ally = this.creatureAt(cell.x, cell.y);
		if (ally && (!ally.isAlly || ally.isHero || ally.hp <= 0)) {
			this.say(t('actors.hero.abilities.armorability.no_target'), 'negative');
			return false;
		}
		// Java accepts `passable || avoid`; this Level wrapper has no separate avoid-cell map.
		if (!ally && !this.level.passable(cell.x, cell.y)) {
			this.say(t('port.ally.invalidtarget'), 'negative');
			return false;
		}
		const target = ally ?? this.spawnLightAlly(cell);
		if (!ally) this.playTeleportAppear(cell, cell, target);
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		//Java calls `armor.updateQuickslot()` immediately after spending charge. The toolbar
		//label is refreshed during scene refreshes, so sync it here before the turn animation runs.
		if (this.actionBar.setArmorAbility(this.armorAbilityLabel())) {
			this.positionInterface(Game.current.width, Game.current.height);
		}
		addBuff(target, 'powerOfMany', POWER_OF_MANY_TURNS);
		target.powerOfManyBarrier = 25;
		target.powerOfManyBarrierPartial = 0;
		//Java's `hero.sprite.zap(target)` plus `Assets.Sounds.CHARGEUP`: use the shared beam
		//overlay and original sound. Directing an existing LightAlly returns above, without them.
		this.zapBeams.push({
			x1: (this.hero.x + 0.5) * TILE, y1: (this.hero.y + 0.5) * TILE,
			x2: (cell.x + 0.5) * TILE, y2: (cell.y + 0.5) * TILE,
			timeLeft: 0.5, duration: 0.5, color: 0xffff44,
		});
		runState.audio.cue('chargeup', 0.7);
		delete this.hero.buffs['invisibility'];
		this.say(t('port.log.armorabilitychosen', { ability: t('port.armorability.powerofmany.name') }), 'positive');
		this.spendHeroAction(1);
		return true;
	},

	poweredAlly(this: DungeonScene): Creature | undefined {
		return this.creatures.find((creature) => creature.buffs['powerOfMany'] !== undefined && creature.hp > 0);
	},

	poweredLightAlly(this: DungeonScene): Creature | undefined {
		const ally = this.poweredAlly();
		return ally?.allyKind === 'lightAlly' ? ally : undefined;
	},
};
