import { heroArmorStrReq } from '../strengthGear';
import type { DungeonScene } from '../../dungeonScene';
import { Game } from 'mwg';
import { runState } from '../../../runState';
import { t, titleCase } from '../../../i18n/index';
import {
	momentumAct,
	momentumActionAvailable,
	momentumDoAction,
	momentumEvasion,
	momentumFreerunning,
	momentumGainStack,
	momentumSpeedFactor,
} from '../../../simulation/momentum';
import { projectileMomentumAccuracy } from '../../../simulation/subclassPassives';
import { projectileMomentumDamageMultiplier } from '../../../talentEffects';

/**
 * The Freerunner's `Momentum` buff (`actors/buffs/Momentum.java`, tag `v3.3.8`): every completed step banks a
 * stack (cap 10), the stacks buy a `2 x stacks`-turn freerun with a `10 + 4 x stacks` cooldown alongside it, and
 * idle turns decay what the hero stopped earning. The pure transitions live in `simulation/momentum.ts`; this
 * module owns the live scene state - the icon buff, the contextual action button, the two credit seams, and the
 * speed/evasion/projectile consumers Java queries off the buff.
 *
 * The buff icon (`hero.buffs['momentum']`) attaches exactly while Java's own buff would draw an icon: attached
 * with stacks or a cooldown still showing (`Momentum.icon()` is `NONE` once both are clear). The action button
 * stands in for Java's `ActionIndicator` entry; its label carries the live stack count where Java shows that in
 * the buff's own window (stated in the R115 coverage row).
 *
 * Cadence (stated in `momentumAct`'s doc): Java runs `act()` as its own pre-hero actor; this port ticks it at
 * the end of the hero's buff phase (`turnLoopAiming`'s `momentumTurn()` call beside `rageTurn()`), which sees
 * the same turn's credit before the decay check - traced to produce Java's decay count for every move/wait
 * sequence.
 */
export const momentumMethods = {
	/** Mirrors the state onto the icon buff and the contextual freerun button. */
	momentumSync(this: DungeonScene): void {
		const m = this.momentumState;
		if (m.attached && (m.stacks > 0 || m.freerunCooldown > 0)) this.hero.buffs['momentum'] = 9999;
		else delete this.hero.buffs['momentum'];
		if (this.actionBar?.setMomentum(this.momentumButtonLabel())) {
			this.positionInterface(Game.current.width, Game.current.height);
		}
	},

	/**
	 * `Buff.affect(Momentum.class).gainStack()` (`Hero.java` 1856-1858 and `Char.java` 300-303,
	 * tag `v3.3.8`): the credit on a completed step or place-swap. Both Java call sites gate on
	 * `subclass == FREERUNNER`, so the gate lives here once rather than at each seam; a non-freerunner
	 * never attaches the buff and never scores a credit, exactly like Java's gated call.
	 */
	momentumGainStack(this: DungeonScene): void {
		if (this.subclass() !== 'freerunner') return;
		this.momentumState = momentumGainStack(this.momentumState);
		this.momentumSync();
	},

	/** `Momentum.act()` once per hero turn (see `momentumAct` for the cadence note). */
	momentumTurn(this: DungeonScene): void {
		if (!this.momentumState.attached) return;
		const wasRunning = momentumFreerunning(this.momentumState);
		this.momentumState = momentumAct(this.momentumState, {
			invisible: this.hero.buffs['invisibility'] !== undefined,
			speedyStealthRank: this.talentRank('speedy_stealth'),
		});
		//The freerun's evasion bonus is a cached stat (see `momentumEvasionBonus`), so a run
		//ending inside this tick has to re-resolve it - starting one is covered by `momentumAction`.
		if (wasRunning !== momentumFreerunning(this.momentumState)) this.syncHeroFromStats();
		this.momentumSync();
	},

	/**
	 * `Momentum.doAction()` (Momentum.java 234-245): the ability key that spends every stack on a
	 * `2 x stacks`-turn freerun. Java's body spends no turn of its own (no `spend()`), and the action
	 * only exists while the hero awaits input - so this dispatch is free, like `berserk`. The JET/
	 * SpellSprite HASTE particles have no port equivalent; the miss sound at pitch 0.8 does, and
	 * Java writes no log line for the activation.
	 */
	momentumAction(this: DungeonScene): void {
		const m = this.momentumState;
		if (!momentumActionAvailable(m)) return;
		this.momentumState = momentumDoAction(m);
		runState.audio.cue('miss', 1, 0.8);
		//Starting the run flips freerunning(): the evasion bonus below lands with it.
		this.syncHeroFromStats();
		this.momentumSync();
		//`Momentum.doAction()` ends with `BuffIndicator.refreshHero()` (Momentum.java 244,
		//tag v3.3.8): the free action spends no turn, so without this refresh the icon's
		//tint/text payload would sit stale at the building state until the next turn's
		//refresh. `refresh()` is this port's BuffIndicator payload path (R115).
		this.refresh();
	},

	/** `Momentum.speedMultiplier()` (Momentum.java 109-117) as this port's turn-cost divisor
	 * (`getActionTurnCostMod`): x2 while freerunning, or at SPEEDY_STEALTH rank 3 while invisible. */
	momentumSpeedFactor(this: DungeonScene): number {
		return momentumSpeedFactor(this.momentumState, this.hero.buffs['invisibility'] !== undefined, this.talentRank('speedy_stealth'));
	},

	/**
	 * `Momentum.evasionBonus(heroLvl, excessArmorStr)` (Momentum.java 119-125, called from
	 * `Armor.evasionFactor`): freerun-only `heroLvl/2 + excessArmorStr x EVASIVE_ARMOR`. The excess
	 * reads the FINAL `hero.str` (ring might + adrenaline + strongman), which is Java's own
	 * `Hero.STR()` composition, minus the worn armor's requirement (`Math.max(0, STR() - STRReq())`
	 * at the Java call site).
	 */
	momentumEvasionBonus(this: DungeonScene): number {
		return momentumEvasion(this.momentumState, this.progression.level,
			Math.max(0, (this.hero.str ?? this.heroStr) - heroArmorStrReq(this)),
			this.talentRank('evasive_armor'));
	},

	/** The contextual button's label: SPD's own action name with the live stack count, the same
	 * information Java carries in the buff window - `null` hides the button. */
	momentumButtonLabel(this: DungeonScene): string | null {
		const m = this.momentumState;
		return momentumActionAvailable(m) ? `${titleCase(t('actors.buffs.momentum.action_name'))} ${m.stacks}` : null;
	},

	/**
	 * `Hero.attackSkill()`'s MissileWeapon momentum branch: `x (1 + ranks/2)` accuracy while the
	 * buff is live and freerunning. Every missile attack in Java (thrown weapon, SpiritBow arrow,
	 * MindForm's conjured cast) resolves through `MissileWeapon.onThrow -> Hero.shoot`, which is
	 * what that branch keys on - so bow and throw both take this factor, melee never does.
	 */
	projectileMomentumAccFactor(this: DungeonScene): number {
		return momentumFreerunning(this.momentumState) ? projectileMomentumAccuracy(this.talentRank('projectile_momentum')) : 1;
	},

	/**
	 * `MissileWeapon.damageRoll()` (MissileWeapon.java 511-512, tag v3.3.8): `round(damage x
	 * (1 + 0.15 x ranks))` while freerunning. `SpiritArrow.damageRoll` delegates to the bow's own
	 * roll, which has no such line - so the BOW gets the accuracy factor above with no damage
	 * factor, while thrown weapons get both (the additive `+rank` bow bonus this replaces never
	 * existed in Java; see the R115 row).
	 */
	projectileMomentumDmgFactor(this: DungeonScene): number {
		return projectileMomentumDamageMultiplier(this.subclass(), this.talentRank('projectile_momentum'), momentumFreerunning(this.momentumState));
	},
};
