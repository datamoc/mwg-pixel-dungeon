import type { DungeonScene } from '../../dungeonScene';
import { Roguelike } from 'mwg';
import { t } from '../../../i18n/index';
import { addBuff, type Creature } from '../../../combat';
import { NEGATIVE_BUFFS, type BuffId } from '../../../simulation/buffs';
import { showChoiceWindow } from '../../../ui/portWindows';
import {
	MONK_ABILITIES, MONK_FLURRY_MULTIPLIER, monkAbilitiesEmpowered, monkDashRange, monkDragonKickMultiplier,
	monkDragonKickParalysis, monkEnergyAfterAbility, monkEnergyAfterGain, monkEnergyCap, monkEnergyGainMultiplier,
	monkEnergyPerKill, monkMeditateHeal, monkUnarmedRange, type MonkAbilityId,
} from '../../../simulation/monkEnergy';

/**
 * The Duelist Monk (`actors/buffs/MonkEnergy.java` + `ui/WndMonkAbilities.java`, tag `v3.3.8`): the energy
 * resource, its per-kill gain, and the five abilities. The energy is `this.monk.energy`; the `monkEnergy` buff
 * (permanent, icon 68) only carries the status-pane icon and its description. Pure rules live in
 * `simulation/monkEnergy.ts`.
 *
 * Reductions (stated in `PORT_COVERAGE.md`): no `ActionIndicator` (the moves open from the ability key /
 * toolbar entry), no cooldown text on the icon (Java's `cooldown` is unused since v2.5), Unencumbered Spirit's
 * rank-3 Cloth Armor + Gloves gift and Brawler's Stance are not modelled, corruption conversions do not feed
 * energy (`AllyBuff.affectAndLoot`), and the ability swings resolve through the port's `attack()` with the hero's
 * damage range, the target's armor and the weapon enchantment swapped for their unarmed values around the swing.
 */
export const monkAbilitiesMethods = {
	monkEnergyCap(this: DungeonScene): number {
		return monkEnergyCap(this.progression.level);
	},

	/** `abilitiesEmpowered(hero)`: energy at or above 120% / 100% / 80% / 60% of the cap by Monastic Vigor rank. */
	monkEmpowered(this: DungeonScene): boolean {
		return monkAbilitiesEmpowered(this.monk.energy, this.monkEnergyCap(), this.talentRank('monastic_vigor'));
	},

	/** Makes sure a Monk carries the `monkEnergy` icon buff (chosen subclass, or a loaded save). */
	monkEnsureBuff(this: DungeonScene): void {
		if (this.subclass() === 'monk_sub' && this.hero.buffs['monkEnergy'] === undefined) this.hero.buffs['monkEnergy'] = 9999;
	},

	/**
	 * `MonkEnergy.gainEnergy(enemy)`, called on every kill of an enemy (`Mob.rewardExp`, `AllyBuff.affectAndLoot`):
	 * 5 for a boss, 3 for a miniboss, half for Ghoul/Ripper Demon/Larva/Wraith, else 1, times Unencumbered Spirit's
	 * armor/weapon-tier bonus. Skipped while the floor is locked (`Regeneration.regenOn()`, the boss-minion farming
	 * guard). The cap is deferred while an unarmed ability is mid-use.
	 */
	monkGainEnergy(this: DungeonScene, enemy: Creature): void {
		if (this.subclass() !== 'monk_sub' || !this.regenOn()) return;
		//A melee weapon counts for the tier bonus; the fists (`startingWeapon`) are not a `MeleeWeapon`.
		const meleeTier = this.weaponId === 'startingWeapon' ? null : this.weaponTier;
		const gain = monkEnergyPerKill({
			boss: enemy.boss === true, miniboss: enemy.miniboss === true, ...(enemy.kind !== undefined ? { kind: enemy.kind } : {}),
		}) * monkEnergyGainMultiplier(this.talentRank('unencumbered_spirit'), this.armorTier, meleeTier);
		this.monk.energy = monkEnergyAfterGain(this.monk.energy, gain, this.monkEnergyCap(), this.monk.deferCap);
		this.monkEnsureBuff();
	},

	/** `abilityUsed(abil)`: pays the cost, re-caps, and feeds Combined Energy's monk half. */
	monkAbilityUsed(this: DungeonScene, cost: number): void {
		this.monk.energy = monkEnergyAfterAbility(this.monk.energy, cost, this.monkEnergyCap());
		const rank = this.talentRank('combined_energy');
		if (rank > 0 && cost >= 5 - rank) {
			if (this.monk.combinedTurns <= 0 || !this.monk.combinedWep) {
				this.monk.combinedTurns = 5;
				this.monk.combinedMonk = true;
			} else {
				this.monk.combinedMonk = true;
				this.monkProcessCombinedEnergy();
			}
		}
	},

	/**
	 * `MeleeWeapon.afterAbilityUsed()`'s Combined Energy half: a weapon ability used within 5 turns of a monk ability
	 * (or the reverse) is worth one energy (`processCombinedEnergy`). Called once per weapon ability.
	 */
	monkCombinedEnergyWeaponUsed(this: DungeonScene): void {
		if (this.subclass() !== 'monk_sub' || this.talentRank('combined_energy') <= 0) return;
		if (this.monk.combinedTurns <= 0 || !this.monk.combinedMonk) {
			this.monk.combinedTurns = 5;
			this.monk.combinedWep = true;
		} else {
			this.monk.combinedWep = true;
			this.monkProcessCombinedEnergy();
		}
	},

	monkProcessCombinedEnergy(this: DungeonScene): void {
		this.monk.energy = Math.min(this.monk.energy + 1, this.monkEnergyCap());
		this.monk.combinedTurns = 0;
		this.monk.combinedMonk = false;
		this.monk.combinedWep = false;
	},

	/** Whether an ability can be picked now: enough energy, Flurry off cooldown, Focus not already up. */
	monkUsable(this: DungeonScene, id: MonkAbilityId): boolean {
		const cost = MONK_ABILITIES.find((entry) => entry.id === id)!.cost;
		if (this.monk.energy < cost) return false;
		if (id === 'flurry' && this.monk.flurryLocked) return false;
		if (id === 'focus' && this.hero.buffs['focus'] !== undefined) return false;
		return true;
	},

	/** `Combo`-style ability key handler for a Monk: `ActionIndicator.doAction()` -> `WndMonkAbilities`. */
	openMonkMenu(this: DungeonScene): void {
		const options = MONK_ABILITIES.filter((entry) => this.monkUsable(entry.id)).map((entry) => ({
			label: t(`actors.buffs.monkenergy$monkability$${entry.id.toLowerCase()}.name`),
			onPick: () => this.useMonkAbility(entry.id),
		}));
		const status = t('actors.buffs.monkenergy.desc', { 0: Math.trunc(this.monk.energy), 1: this.monkEnergyCap() });
		if (options.length === 0) {
			this.say(status);
			return;
		}
		showChoiceWindow(this.gameWindows, t('actors.buffs.monkenergy.action'), status, options);
	},

	/** `MonkAbility.doAbility`: Focus and Meditate act at once; Flurry, Dash and Dragon Kick select a cell first. */
	useMonkAbility(this: DungeonScene, id: MonkAbilityId): void {
		if (!this.monkUsable(id)) return;
		const cost = MONK_ABILITIES.find((entry) => entry.id === id)!.cost;
		if (id === 'focus') {
			//`Buff.affect(hero, FocusBuff.class)`; free when empowered, else a turn (`spendAndNext(1f)`).
			const empowered = this.monkEmpowered();
			this.hero.buffs['focus'] = 9999;
			this.monkAbilityUsed(cost);
			if (empowered) this.refresh();
			else this.spendHeroAction(1);
			return;
		}
		if (id === 'meditate') {
			this.monkMeditate(cost);
			return;
		}
		if (id === 'dash') {
			this.monkDashAim(cost);
			return;
		}
		//Flurry / Dragon Kick: a visible enemy in reach (`hero.canAttack`).
		const reach = this.comboReach();
		const strikable = (candidate: Creature): boolean => this.comboValidTarget(candidate)
			&& Roguelike.canTarget(this.level, this.hero, candidate, { range: reach });
		if (!this.creatures.some(strikable)) {
			this.say(t('port.log.noweapontarget'), 'negative');
			return;
		}
		this.say(t('items.weapon.melee.meleeweapon.prompt'));
		this.beginAiming({
			range: reach,
			validate: (cell) => {
				const candidate = this.creatureAt(cell.x, cell.y);
				return !!candidate && strikable(candidate);
			},
			onConfirm: (cell) => {
				const enemy = this.creatureAt(cell.x, cell.y);
				if (!enemy || !strikable(enemy)) {
					this.say(t('items.weapon.melee.meleeweapon.ability_no_target'), 'negative');
					return;
				}
				if (id === 'flurry') this.monkFlurry(enemy, cost);
				else this.monkDragonKick(enemy, cost);
			},
		});
	},

	/**
	 * One unarmed ability swing (`UnarmedAbilityTracker` up): the damage roll is `1..max(STR-8, 1)`, the target's
	 * armor is ignored (`Char.attack`: `dr = 0`), the weapon's enchantment does not apply (only an empowered Flurry
	 * keeps it), and the swing never misses. The hero's own range, the target's armor and the affix are restored.
	 */
	monkUnarmedSwing(this: DungeonScene, enemy: Creature, multiplier: number, keepEnchant: boolean): boolean {
		const savedDamage = this.hero.damage;
		const savedArmor = enemy.armor;
		const savedAffix = this.weaponAffix;
		const savedPrecise = this.preciseAssaultReady;
		this.hero.damage = monkUnarmedRange(this.hero.str ?? this.heroStr);
		enemy.armor = [0, 0];
		if (!keepEnchant) this.weaponAffix = null;
		this.preciseAssaultReady = false;
		this.abilityForceHit = true;
		this.comboSuppressHit = true;
		try {
			return this.attack(this.hero, enemy, 1, multiplier);
		} finally {
			this.hero.damage = savedDamage;
			enemy.armor = savedArmor;
			this.weaponAffix = savedAffix;
			this.preciseAssaultReady = savedPrecise;
			this.abilityForceHit = false;
			this.comboSuppressHit = false;
		}
	},

	/** Flurry of Blows: two x1.5 unarmed sure-hits (the second only if the target lives); free, but not twice in a row. */
	monkFlurry(this: DungeonScene, enemy: Creature, cost: number): void {
		const empowered = this.monkEmpowered();
		this.monk.deferCap = true;
		try {
			this.monkUnarmedSwing(enemy, MONK_FLURRY_MULTIPLIER, empowered);
			if (enemy.hp > 0) this.monkUnarmedSwing(enemy, MONK_FLURRY_MULTIPLIER, empowered);
		} finally {
			this.monk.deferCap = false;
		}
		this.monkAbilityUsed(cost);
		this.monk.flurryLocked = true;
		this.refresh();
	},

	/** Dragon Kick: x6 (x9 empowered) unarmed sure-hit, then a 6-cell shove that paralyses for the cells travelled. */
	monkDragonKick(this: DungeonScene, enemy: Creature, cost: number): void {
		const empowered = this.monkEmpowered();
		const from = { x: this.hero.x, y: this.hero.y };
		const oldPos = { x: enemy.x, y: enemy.y };
		this.monk.deferCap = true;
		try {
			this.monkUnarmedSwing(enemy, monkDragonKickMultiplier(empowered), false);
		} finally {
			this.monk.deferCap = false;
		}
		this.monkKick(enemy, from, oldPos);
		this.monkAbilityUsed(cost);
		if (empowered) {
			//Every other enemy standing next to the hero is kicked away too.
			for (const other of [...this.creatures]) {
				if (other === enemy || other === this.hero || other.isNPC || other.isAlly || other.hp <= 0) continue;
				if (Roguelike.chebyshevDistance(this.hero, other) > 1) continue;
				this.monkKick(other, from, { x: other.x, y: other.y });
			}
		}
		this.spendHeroAction(1);
	},

	/** `WandOfBlastWave.throwChar(target, trajectory, 6, true, false, hero)` + `Paralysis(min(6, distance))`. */
	monkKick(this: DungeonScene, target: Creature, from: { x: number; y: number }, oldPos: { x: number; y: number }): void {
		if (target.hp <= 0 || target.x !== oldPos.x || target.y !== oldPos.y) return;
		const dx = Math.sign(oldPos.x - from.x);
		const dy = Math.sign(oldPos.y - from.y);
		if (dx === 0 && dy === 0) return;
		let travelled = 0;
		for (let step = 0; step < 6; step++) {
			const next = { x: target.x + dx, y: target.y + dy };
			if (!this.level.inside(next.x, next.y) || !this.level.passable(next.x, next.y) || this.creatureAt(next.x, next.y) !== null) break;
			this.moveTo(target, next);
			travelled++;
		}
		const turns = monkDragonKickParalysis(travelled);
		if (turns > 0 && target.hp > 0) addBuff(target, 'paralysis', turns);
	},

	/** Dash: an instant jump to an empty cell within 4 (8 empowered) along a clear line, over hazards; free. */
	monkDashAim(this: DungeonScene, cost: number): void {
		const range = monkDashRange(this.monkEmpowered());
		const clearLine = (cell: { x: number; y: number }): boolean => {
			const path = Roguelike.traceLine({ x: this.hero.x, y: this.hero.y }, cell);
			const last = path[path.length - 1];
			if (!last || last.x !== cell.x || last.y !== cell.y) return false;
			for (const step of path.slice(0, -1)) if (!this.level.passable(step.x, step.y) || this.creatureAt(step.x, step.y) !== null) return false;
			return this.level.passable(cell.x, cell.y);
		};
		this.say(t('actors.buffs.monkenergy$monkability$dash.prompt'));
		this.beginAiming({
			range,
			validate: (cell) => this.hero.buffs['roots'] === undefined && this.level.inside(cell.x, cell.y)
				&& Roguelike.chebyshevDistance(this.hero, cell) <= range && this.creatureAt(cell.x, cell.y) === null && clearLine(cell),
			onConfirm: (cell) => {
				this.monkAbilityUsed(cost);
				this.teleportHeroTo(cell.x, cell.y);
				this.refresh();
			},
		});
	},

	/**
	 * Meditate: cures every negative buff, passes five turns, and shortly before they end grants Recharging and an
	 * Artifact Recharge for 8. Empowered it also heals a fifth of the missing HP over time and cuts all damage taken to
	 * a fifth for those turns (`MeditateResistance`).
	 */
	monkMeditate(this: DungeonScene, cost: number): void {
		for (const id of Object.keys(this.hero.buffs) as BuffId[]) if (NEGATIVE_BUFFS.has(id)) delete this.hero.buffs[id];
		if (this.monkEmpowered()) {
			const heal = monkMeditateHeal(this.hero.maxHp, this.hero.hp);
			//`Healing.setHeal(toHeal, 0, 1)`: one HP per turn until spent, never lowering a bigger pool already running.
			if (heal > 0) {
				this.healingLeft = Math.max(this.healingLeft, heal);
				this.healingFlat = Math.max(this.healingFlat, 1);
			}
			//The five turns are one lump here, so the window is armed to survive that tick and end at the next.
			this.monk.resistTurns = 1;
			this.monk.resistFresh = true;
		}
		this.monk.rechargeIn = 4;
		this.monkAbilityUsed(cost);
		this.spendHeroAction(5);
	},

	/** Per-spent-turn upkeep: the Flurry cooldown, Combined Energy's window, Meditate's resistance and delayed recharge. */
	tickMonk(this: DungeonScene, turnCost: number): void {
		const m = this.monk;
		m.flurryLocked = false;
		if (m.combinedTurns > 0) {
			m.combinedTurns = Math.max(0, m.combinedTurns - turnCost);
			if (m.combinedTurns <= 0) { m.combinedMonk = false; m.combinedWep = false; }
		}
		if (m.resistFresh) m.resistFresh = false;
		else m.resistTurns = 0;
		if (m.rechargeIn > 0) {
			m.rechargeIn = Math.max(0, m.rechargeIn - turnCost);
			if (m.rechargeIn <= 0) {
				addBuff(this.hero, 'recharging', 8);
				this.artifactRechargeTurns = Math.max(this.artifactRechargeTurns, 8);
			}
		}
	},
};
