import type { DungeonScene } from '../../dungeonScene';
import { Random, Roguelike } from 'mwg';
import { t } from '../../../i18n/index';
import { addBuff, type Creature } from '../../../combat';
import { showChoiceWindow } from '../../../ui/portWindows';
import { weaponCombat } from '../../../items/catalog';
import {
	COMBO_FURY_MULTIPLIER, COMBO_MOVES, comboCanUse, comboClobberEmpowered, comboCrushMultiplier, comboCrushSplash,
	comboHighestMove, comboLeapRange, comboParryPersists, comboSlamBonus, comboTimeAfterHit, type ComboMove,
} from '../../../simulation/combo';

/**
 * The Gladiator's `Combo` (`actors/buffs/Combo.java` + `ui/WndCombo.java`, tag `v3.3.8`): the hit
 * counter, its clock and the five finisher moves. The counter is `hero.combo`, the clock is the
 * `combo` buff's value (so the ordinary buff tick decays it a turn at a time), and a count is only
 * live while that buff is present - exactly `Buff.affect(hero, Combo.class)` creating a fresh
 * instance. Pure rules live in `simulation/combo.ts`.
 *
 * Reductions (stated in `PORT_COVERAGE.md`): no `HoldFast.buffDecayFactor` on the clock, no
 * `ActionIndicator` (the moves open from the ability key / toolbar entry instead of a floating
 * button), `Talent.LETHAL_DEFENSE`'s seal-cooldown refund is not modelled here, CRUSH's splash
 * reaches enemies within 3 by the port's passable-only flood (Java: non-solid cells), and the
 * knock-back is the port's straight shove with Java's pit rule.
 */
export const comboMovesMethods = {
	/** The live hit count: `hero.combo`, but only while the `combo` buff (the clock) exists. */
	comboCount(this: DungeonScene): number {
		return this.hero.buffs['combo'] !== undefined ? (this.hero.combo ?? 0) : 0;
	},

	/** `Combo.detach()`: the count is lost and both once-per-session flags reset with the buff. */
	comboDetach(this: DungeonScene): void {
		delete this.hero.buffs['combo'];
		this.hero.combo = 0;
		this.comboClobberUsed = false;
		this.comboParryUsed = false;
	},

	/**
	 * `Combo.hit(enemy)`, called for a landed hit of a Gladiator on an enemy (`Hero.actAttack`, a thrown
	 * hit, Shockwave, and Clobber/Parry's own hit). `enemy.hp <= 0` is Java's `!enemy.isAlive()`: the
	 * clock jumps to 15 + 15 x Cleave ranks.
	 */
	comboHit(this: DungeonScene, enemy: Creature): void {
		if (this.subclass() !== 'gladiator') return;
		if (this.hero.buffs['combo'] === undefined) {
			this.hero.combo = 0;
			this.comboClobberUsed = false;
			this.comboParryUsed = false;
		}
		this.hero.combo = (this.hero.combo ?? 0) + 1;
		const time = comboTimeAfterHit(this.hero.buffs['combo'] ?? 0, enemy.hp <= 0, this.talentRank('cleave'));
		this.hero.buffs['combo'] = time;
		this.comboInitialTime = time;
		if (comboHighestMove(this.hero.combo) !== null) this.say(t('actors.buffs.combo.combo', { 0: this.hero.combo }), 'positive');
	},

	/** Whether the hero may strike this creature with a combo move: a visible, hostile, uncharmed foe. */
	comboValidTarget(this: DungeonScene, candidate: Creature): boolean {
		return !candidate.isHero && !candidate.isNPC && !candidate.isAlly && candidate.hp > 0
			&& this.fov.isVisible(candidate.x, candidate.y)
			&& !(this.hero.buffs['charm'] !== undefined && this.charmTargets.get(this.hero.id) === candidate.id);
	},

	/** `Hero.canAttack(enemy)` for these moves: the wielded weapon's reach (`RCH`, plus Projecting). */
	comboReach(this: DungeonScene): number {
		const reach = weaponCombat(this.weaponMeleeKey(), this.weaponTier, 0).reach;
		return reach + (this.weaponAffix === 'projecting' ? Math.round(this.genericProcMultiplier()) : 0);
	},

	/**
	 * `ActionIndicator.doAction()` -> `WndCombo`: lists the moves the count has unlocked (Java also draws the
	 * locked ones greyed out; here a locked or spent move is simply absent). With nothing unlocked the buff's own
	 * description is shown, as clicking its icon does.
	 */
	openComboMenu(this: DungeonScene): void {
		const count = this.comboCount();
		const used = { clobber: this.comboClobberUsed, parry: this.comboParryUsed };
		const options = COMBO_MOVES.filter((move) => comboCanUse(move.id, count, used)).map((move) => ({
			label: t(`actors.buffs.combo$combomove.${move.id}.name`),
			onPick: () => this.useComboMove(move.id),
		}));
		if (options.length === 0) {
			this.say(t('actors.buffs.combo.desc', { 0: count, 1: Math.ceil(this.hero.buffs['combo'] ?? 0) }));
			return;
		}
		const move = comboHighestMove(count);
		const body = move === null ? '' : t(`actors.buffs.combo$combomove.${move}.desc`, { 0: move === 'slam' ? count * 20 : count * 25 });
		showChoiceWindow(this.gameWindows, t('actors.buffs.combo.action_name'), body, options);
	},

	/** `Combo.useMove(move)`: Parry acts at once, every other move selects a target first. */
	useComboMove(this: DungeonScene, move: ComboMove): void {
		if (!comboCanUse(move, this.comboCount(), { clobber: this.comboClobberUsed, parry: this.comboParryUsed })) return;
		if (move === 'parry') {
			//`parryUsed = true; comboTime = 5; ParryTracker for one tick; spendAndNext(TICK)`. The tracker is armed for
			//two ticks because this port ticks its hero windows before the monsters act (see `tickComboParry`), so the
			//second is the one the monsters' attacks actually meet.
			this.comboParryUsed = true;
			this.hero.buffs['combo'] = 5;
			this.comboParryTurns = 2;
			this.comboParryLanded = false;
			this.syncHeroFromStats();
			this.spendHeroAction(1);
			return;
		}
		const reach = this.comboReach();
		const count = this.comboCount();
		const rank = this.talentRank('enhanced_combo');
		const leap = comboLeapRange(count, rank);
		const strikable = (candidate: Creature): boolean => this.comboValidTarget(candidate)
			&& (Roguelike.canTarget(this.level, this.hero, candidate, { range: reach })
				|| (leap > 1 && Roguelike.chebyshevDistance(this.hero, candidate) <= leap && this.comboLeapCell(candidate) !== null));
		if (!this.creatures.some(strikable)) {
			this.say(t('actors.buffs.combo.bad_target'), 'negative');
			return;
		}
		this.say(t('actors.buffs.combo.prompt'));
		this.beginAiming({
			range: Math.max(reach, leap),
			validate: (cell) => {
				const candidate = this.creatureAt(cell.x, cell.y);
				return !!candidate && strikable(candidate);
			},
			onConfirm: (cell) => {
				const enemy = this.creatureAt(cell.x, cell.y);
				if (!enemy || !strikable(enemy)) {
					this.say(t('actors.buffs.combo.bad_target'), 'negative');
					return;
				}
				//Enhanced Combo 3's leap: the hero jumps to the cell before the enemy, then strikes.
				if (!Roguelike.canTarget(this.level, this.hero, enemy, { range: reach })) {
					const leapCell = this.comboLeapCell(enemy);
					if (leapCell === null) { this.say(t('actors.buffs.combo.bad_target'), 'negative'); return; }
					this.teleportHeroTo(leapCell.x, leapCell.y);
				}
				this.comboStrike(move, enemy);
			},
		});
	},

	/**
	 * The cell Java's leap lands on, `path.get(dist-1)` of a PROJECTILE ballistica: the cell just short of the
	 * enemy, which must be passable, empty, and the hero unrooted. `null` when the line is blocked.
	 */
	comboLeapCell(this: DungeonScene, enemy: Creature): { x: number; y: number } | null {
		if (this.hero.buffs['roots'] !== undefined) return null;
		const path = Roguelike.traceLine({ x: this.hero.x, y: this.hero.y }, { x: enemy.x, y: enemy.y });
		const last = path[path.length - 1];
		if (!last || last.x !== enemy.x || last.y !== enemy.y || path.length < 2) return null;
		const cell = path[path.length - 2]!;
		if (!this.level.passable(cell.x, cell.y) || this.creatureAt(cell.x, cell.y) !== null) return null;
		return cell;
	},

	/** One swing of a move (`Combo.doAttack`): `INFINITE_ACCURACY`, the move's own multiplier and flat bonus. */
	comboSwing(this: DungeonScene, enemy: Creature, multiplier: number, bonus: number): boolean {
		this.abilityForceHit = true;
		this.abilityDamageBoostNext = bonus;
		this.comboSuppressHit = true;
		let landed: boolean;
		try {
			landed = this.attack(this.hero, enemy, 1, multiplier);
		} finally {
			this.abilityForceHit = false;
			this.abilityDamageBoostNext = 0;
			this.comboSuppressHit = false;
		}
		return landed;
	},

	/** `Combo.doAttack(enemy)` for CLOBBER / SLAM / CRUSH / FURY, then its post-attack behaviour and the turn. */
	comboStrike(this: DungeonScene, move: ComboMove, enemy: Creature): void {
		const count = this.comboCount();
		const rank = this.talentRank('enhanced_combo');
		const from = { x: this.hero.x, y: this.hero.y };
		const oldPos = { x: enemy.x, y: enemy.y };
		let multiplier = 1;
		let bonus = 0;
		if (move === 'clobber') multiplier = 0;
		else if (move === 'slam') bonus = comboSlamBonus(Random.normalRange(this.hero.armor[0], this.hero.armor[1]), count);
		else if (move === 'crush') multiplier = comboCrushMultiplier(count);
		else if (move === 'fury') multiplier = COMBO_FURY_MULTIPLIER;
		const landed = this.comboSwing(enemy, multiplier, bonus);
		if (landed) {
			if (move === 'clobber') {
				this.comboHit(enemy);
				this.comboKnockBack(enemy, from, oldPos, comboClobberEmpowered(count, rank));
			} else if (move === 'crush') this.comboCrushSplashAround(enemy, count);
		}
		if (move === 'clobber') {
			this.comboClobberUsed = true;
		} else if (move === 'fury') {
			//`furyHitsLeft = count; count = 0`: one swing per combo count, each x0.6, all for a single attack delay.
			this.hero.combo = 0;
			for (let left = count - 1; left > 0 && enemy.hp > 0 && this.comboValidTarget(enemy)
				&& Roguelike.canTarget(this.level, this.hero, enemy, { range: this.comboReach() }); left--) {
				this.comboSwing(enemy, multiplier, 0);
			}
			this.comboDetach();
		} else {
			this.comboDetach();
		}
		this.spendHeroAction(1);
	},

	/**
	 * CLOBBER's `WandOfBlastWave.throwChar(enemy, trajectory, dist, true, false, hero)`: shoved `dist` cells straight
	 * away from where the hero struck (2, or 3 when empowered), stopping at walls and occupants, and - unless
	 * empowered or the target flies - never landing in a pit. Empowered also prolongs Vertigo 3. Only when the
	 * enemy is still where it was struck (`enemy.pos == oldPos`).
	 */
	comboKnockBack(this: DungeonScene, enemy: Creature, from: { x: number; y: number }, oldPos: { x: number; y: number }, empowered: boolean): void {
		if (empowered && enemy.hp > 0) addBuff(enemy, 'vertigo', 3);
		if (enemy.x !== oldPos.x || enemy.y !== oldPos.y || enemy.hp <= 0) return;
		const dx = Math.sign(oldPos.x - from.x);
		const dy = Math.sign(oldPos.y - from.y);
		if (dx === 0 && dy === 0) return;
		let reachable = 0;
		let x = enemy.x;
		let y = enemy.y;
		const cells: { x: number; y: number }[] = [];
		for (let step = 0; step < (empowered ? 3 : 2); step++) {
			x += dx;
			y += dy;
			if (!this.level.inside(x, y) || !this.level.passable(x, y) || this.creatureAt(x, y) !== null) break;
			cells.push({ x, y });
			reachable++;
		}
		if (!empowered && !enemy.flying) while (reachable > 0 && this.isChasmCell(cells[reachable - 1]!.x, cells[reachable - 1]!.y)) reachable--;
		for (let i = 0; i < reachable; i++) this.moveTo(enemy, cells[i]!);
	},

	/**
	 * CRUSH's `BlastWave.blast(enemy.pos)` splash: every other hostile within 3 of the hero takes
	 * `comboCrushSplash` (half the crush damage less its armor roll, x1.33 truncated when Vulnerable).
	 */
	comboCrushSplashAround(this: DungeonScene, primary: Creature, count: number): void {
		const distances = this.pathfinder.distanceMap({ x: this.hero.x, y: this.hero.y });
		for (const other of [...this.creatures]) {
			if (other === primary || other === this.hero || other.isNPC || other.isAlly || other.hp <= 0) continue;
			const distance = distances[this.level.index(other.x, other.y)] ?? -1;
			if (distance < 0 || distance > 3) continue;
			const roll = Random.normalRange(this.hero.damage[0], this.hero.damage[1]);
			const dr = Random.normalRange(other.armor[0], other.armor[1]);
			const damage = comboCrushSplash(roll, count, dr, other.buffs['vulnerable'] !== undefined);
			if (damage <= 0) continue;
			this.applyAbilityDamage(other, damage);
		}
	},

	/**
	 * `Hero.defenseSkill()`'s ParryTracker branch, reached from `attack()`'s miss path: the blow was parried.
	 * The tracker detaches on the first parry unless Enhanced Combo 2 keeps it at count >= 9, and an adjacent
	 * attacker in reach is riposted at once (`RiposteTracker` -> `doAttack` with the PARRY move: x1, infinite
	 * accuracy, and it counts as a combo hit).
	 */
	comboParried(this: DungeonScene, attacker: Creature): void {
		this.comboParryLanded = true;
		this.say(t('actors.mobs.monk.parried'), 'positive');
		if (!comboParryPersists(this.comboCount(), this.talentRank('enhanced_combo'))) {
			this.comboParryTurns = 0;
			this.syncHeroFromStats();
		}
		if (this.comboValidTarget(attacker) && Roguelike.canTarget(this.level, this.hero, attacker, { range: this.comboReach() })) {
			if (this.comboSwing(attacker, 1, 0)) this.comboHit(attacker);
		}
	},

	/**
	 * Ends the parry window once its ticks run out (`ParryTracker.detach()`): nothing parried means the whole combo
	 * is lost. Called from `tickWeaponAbility` with the spent turn cost.
	 */
	tickComboParry(this: DungeonScene, turnCost: number): void {
		if (this.comboParryTurns <= 0) return;
		this.comboParryTurns = Math.max(0, this.comboParryTurns - turnCost);
		if (this.comboParryTurns > 0) return;
		if (!this.comboParryLanded) this.comboDetach();
		this.comboParryLanded = false;
		this.syncHeroFromStats();
	},
};
