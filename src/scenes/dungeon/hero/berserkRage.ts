import type { DungeonScene } from '../../dungeonScene';
import { Random } from 'mwg';
import { t } from '../../../i18n/index';
import { NEW_RAGE, rageDeathless, rageRecover, rageStart, rageTakeDamage, rageTick } from '../../../simulation/berserkRage';

/**
 * The Berserker's `Berserk` buff (`actors/buffs/Berserk.java`, `Hero.defenseProc`/`isAlive`, tag `v3.3.8`): rage builds
 * from the physical damage the hero takes, adds up to +50% damage while it lasts, and at 100% can be spent on a
 * shielded berserk that then needs recovering; Deathless Fury turns a fatal blow into that berserk at 0 HP. The pure
 * transitions live in `simulation/berserkRage.ts`; this module owns the hero, the extra shield pool and the death rule.
 *
 * The `berserk` buff (permanent value, like the other state carriers) is attached exactly while Java's buff would be:
 * from the first hit taken until the rage fades to nothing. `hero.berserkPower` mirrors `power` for the damage roll.
 *
 * Reductions (stated in `PORT_COVERAGE.md`): no `ActionIndicator` (the ability key starts the berserk), no
 * `HoldFast.buffDecayFactor` on the shield drain, a death-berserk keeps the hero at 1 HP with `rageZeroHp` standing in
 * for Java's real 0 HP (`isAlive()` overriding), and Java's berserk-shield priority (-1, drained last of all) is the
 * pool order here.
 */
export const berserkRageMethods = {
	/** Mirrors the rage onto the hero (damage roll) and attaches/detaches the icon buff. */
	rageSync(this: DungeonScene): void {
		const attached = this.subclass() === 'berserker' && (this.rageState.power > 0 || this.rageState.mode !== 'normal');
		this.hero.berserkPower = attached ? this.rageState.power : 0;
		if (attached) this.hero.buffs['berserk'] = 9999;
		else delete this.hero.buffs['berserk'];
	},

	/** `Hero.defenseProc()`: every landed blow on a Berserker (after armor, before shields) builds rage. */
	rageOnDamage(this: DungeonScene, damage: number): void {
		if (this.subclass() !== 'berserker' || damage <= 0) return;
		const next = rageTakeDamage(this.rageState, damage, this.hero.maxHp, this.talentRank('endless_rage'));
		this.rageState = { ...this.rageState, ...next };
		this.rageSync();
	},

	/** `Char.damage()`'s shield drain applied to every pool, the berserk shield last (Java's shield priority order). */
	rageDrainShields(this: DungeonScene, amount: number): void {
		let left = amount;
		for (const pool of [this.sealBarrier, this.blockingBarrier, this.ascendedBarrier, this.heroBarrier, this.rageBarrier]) {
			if (left <= 0) break;
			left -= pool.absorb(left);
		}
	},

	/** `Berserk.act()`, once per hero turn. */
	rageTurn(this: DungeonScene): void {
		if (this.subclass() !== 'berserker' || (this.rageState.power <= 0 && this.rageState.mode === 'normal')) return;
		const result = rageTick(this.rageState, {
			hp: this.rageState.zeroHp ? 0 : this.hero.hp, maxHp: this.hero.maxHp, shielding: this.heroShieldPoolTotal(), regenOn: this.regenOn(), roll: Random.float(),
		});
		this.rageState = { ...this.rageState, ...result.rage };
		if (result.drain > 0) this.rageDrainShields(result.drain);
		if (result.detach) this.rageState = { ...NEW_RAGE, zeroHp: false };
		this.rageSync();
		//`act()`: an ended berserk that started at 0 HP is where the hero finally dies.
		if (result.ended && this.rageState.zeroHp) {
			this.rageState.zeroHp = false;
			this.hero.hp = 0;
			this.kill(this.hero, 'poison');
		}
	},

	/** `startBerserking()`: sets the shield (`setShield`, replacing the berserk pool) and the recovery debt. */
	rageBegin(this: DungeonScene, atZeroHp: boolean): void {
		const started = rageStart(this.rageState, {
			hp: atZeroHp ? 0 : this.hero.hp, maxHp: this.hero.maxHp,
			armorBuffedLevel: Math.max(0, this.degradedLevel(this.armorLevel)), deathlessFuryRank: this.talentRank('deathless_fury'),
		});
		this.rageState = { ...this.rageState, ...started.rage, zeroHp: atZeroHp };
		//`ShieldBuff.setShield(amount)`: keeps the higher of the current shield and the fresh amount.
		if (started.shield > this.rageBarrier.total) this.rageBarrier.add(started.shield - this.rageBarrier.total);
		this.say(t('port.log.shield', { amount: started.shield }), 'positive');
		this.rageSync();
	},

	/**
	 * `Berserk.doAction()`: the ability key. Needs the rage at 100% (the action button only exists then) and the broken
	 * seal on the worn armor, else "You need your broken seal to berserk!".
	 */
	rageAction(this: DungeonScene): void {
		if (this.rageState.mode !== 'normal' || this.rageState.power < 1) {
			this.say(t('actors.buffs.berserk.angered_desc', { 0: Math.floor(this.rageState.power * 100), 1: 0, 2: 0 }));
			return;
		}
		if (!this.armorSealed) {
			this.say(t('actors.buffs.berserk.no_seal'), 'warning');
			return;
		}
		this.rageBegin(false);
		this.refresh();
	},

	/**
	 * `Hero.isAlive()` / `Berserk.berserking()`: a fatal blow on a Berserker at 100% rage with Deathless Fury does not
	 * kill - it starts the berserk at 0 HP. Returns whether the hit was converted (the caller then leaves 1 HP).
	 */
	rageSurvivesDeath(this: DungeonScene): boolean {
		if (this.subclass() !== 'berserker' || !rageDeathless(this.rageState, this.talentRank('deathless_fury'))) return false;
		this.rageBegin(true);
		return true;
	},

	/** `Hero.earnExp()`: `Berserk.recover(percent)` pays a death-berserk's level debt. */
	rageOnExperience(this: DungeonScene, percent: number): void {
		if (this.subclass() !== 'berserker') return;
		this.rageState = { ...this.rageState, ...rageRecover(this.rageState, percent) };
		this.rageSync();
	},
};
