import type { DungeonScene } from '../../dungeonScene';
import { Game, Random, Roguelike } from 'mwg';
import { HOLSTER_RECHARGE_BASE, NORMAL_RECHARGE_BASE, ownsBag } from '../../../items/bags';
import { abilityFlatBoost, accrueWeaponCharge, counterAbilityRefund, gainWeaponCharge, preciseAssaultAccuracy, spendWeaponCharge, weaponAbilityChargeCost, weaponAbilityFor, weaponChargeCap } from '../../../items/weaponAbilities';
import { runAttackResolution } from '../../../adapters/attackSimulation';
import { simulationRandom } from '../../../adapters/mwgRandom';
import { ringEnergyMultiplier } from '../../../items/ringModifiers';
import { has, t } from '../../../i18n/index';
import { SPD_STATUS_COLOR } from '../../../ui/spdTheme';
import { type LogLevel } from '../../../ui/gameLog';
import { Terrain } from '../../../spdLevelGen/paintLevel';
import { runState } from '../../../runState';
import { ARMOR_CHARGE_START, armorAbilitiesFor } from '../../../armorAbilities';
import { endureBankedDamage, endureDamageTaken, endureEndingBonus } from '../../../simulation/warriorAbilities';
import { ratsistanceFactor, useRatmogrifyFlow, type RatmogrifyContext } from '../../../simulation/ratmogrify';
import { markRingTypesKnown, ringTypesKnownFor, thiefsIntuitionKnownIds } from '../../../simulation/ringKnow';
import { BADGE_DEFS, BADGE_ICON } from '../../../badges';
import { Cat, randomUsingDefaults, type GenItem } from '../../../items/generator';
import { weaponCombat } from '../../../items/catalog';
import { equipWand as equipInventoryWand, type EquipWandContext } from '../../../items/equipWand';
import { imbueStaffLevel, setStaffImbue, staffImbueFor, wandTypeFromSource } from '../../../items/wands';
import { WAND_KEYS } from '../../../i18n/spdKeys';
import { showChoiceWindow, showConfirmWindow } from '../../../ui/portWindows';
import { useChalice as useArtifactChalice, useCloak as useArtifactCloak, useHourglass as useArtifactHourglass, useKingsCrown as useArtifactKingsCrown, type ArtifactActionContext } from '../../../items/artifactActions';
import { applyScrollEffect } from '../../../items/scrollEffects';
import { useReturningBeaconFlow } from '../../../items/beacon';
import { useCurseInfusionFlow, useFeatherFallFlow, useMagicalInfusionFlow, usePhaseShiftFlow, useReclaimTrapFlow, useRecycleFlow, useTelekineticGrabFlow, useWildEnergyFlow, type CastBase, type CurseInfusionContext, type FeatherFallContext, type InfusionBase, type PhaseShiftContext, type ReclaimTrapContext, type RecycleContext, type TargetedSpellAim, type TelekineticGrabContext, type WildEnergyContext } from '../../../items/spells';
import { equipArmor as equipInventoryArmor, equipRing as equipInventoryRing, equipWeapon as equipInventoryWeapon, type GearEquipmentContext, type RingEquipmentContext } from '../../../items/equipment';
import { itemDisplayName as resolveItemDisplayName, type ItemDisplayContext } from '../../../items/displayName';
import { canSurpriseAttack, weaponSTRReq } from '../../../items/strReq';
import { FLOOR, TILE, TRAP, WALL, type TrapKind } from '../../../dungeonConstants';
import { addBuff, reigniteBuff, type Creature, type GroundItem } from '../../../combat';
import { BOSS_KINDS, MINIBOSS_KINDS, type AnyMonsterId, type MonsterId } from '../../../monsters';

/** DungeonScene methods, moved verbatim from `dungeonScene.ts` (group `weaponSpellsGear`). Each takes the scene as `this`;
 * `dungeonScene.ts` merges them back onto the class prototype. */
export const weaponSpellsGearMethods = {
	/**
	 * `MeleeWeapon` ability modifiers on the hero's next attack (`src/items/weaponAbilities.ts`):
	 * a pending ability-attack forces the hit and adds Java's flat `dmgBoost` after the
	 * roll multiplier (consumed win or lose - the swing is spent either way), a spinning
	 * flail forces the hit with `spins*(8+2*level)` flat for as long as its tracker runs
	 * (never consumed by the swing - only expiry clears it), and `Sword Dance` adds its
	 * x1.5 accuracy while up. Ordinary attacks pass through untouched.
	 */
	resolveHeroAbilityAttack(this: DungeonScene, attacker: Creature, defender: Creature, surprise: boolean, accFactor: number, damageMultiplier: number): { hit: boolean; damage: number } {
		let force = surprise;
		let acc = accFactor;
		let mult = damageMultiplier;
		let boost = 0;
		//`TransmogRat.damageRoll()` (tag `v3.3.8`): a transformed non-ally deals
		//`damage *= 0.9^RATSISTANCE`. It rides the attack's damage multiplier rather than the
		//roll itself (Java truncates the transformed roll to int first; this port's float
		//pipeline rounds once at the end, so a `.5` boundary can differ by 1 - the same
		//standing simplification every other multiplier here already carries). Permanent
		//allies are excluded by the `isAlly` gate, matching Java's `!allied` check.
		if (!attacker.isHero && !attacker.isAlly && attacker.ratmogrifiedTurns !== undefined) {
			mult *= ratsistanceFactor(this.talentRank('ratsistance'));
		}
		if (attacker === this.hero) {
			if (this.abilityForceHit) force = true;
			if (this.abilityDamageMult !== 1) mult *= this.abilityDamageMult;
			//`Hero.attack(enemy, dmgMulti, dmgBoost, ...)`: the flat boost lands after the
			//roll multiplier, before armor - the framework owns the roll, so it is added
			//here on a hit instead of inside it.
			boost = this.abilityDamageBoostNext;
			if (this.spinSpins > 0) {
				force = true;
				boost += this.spinSpins * abilityFlatBoost(8, 2, this.degradedLevel(this.weaponLevel), this.weaponAugment, false);
			}
			if (this.swordDanceTurns > 0) acc *= 1.5;
			//`Hero.attackSkill()`: `wep.accuracyFactor` (the class's `ACC`: hand axe 1.32, mace 1.28, sickle 0.68, ...)
			//multiplies a melee swing's skill; a thrown weapon reads the missile's own factor instead.
			if (attacker.attackMode !== 'throw') {
				acc *= weaponCombat(this.weaponMeleeKey(), this.weaponTier, 0).accuracy;
			}
			//`Talent.PRECISE_ASSAULT` (`Hero.attackSkill`, tag `v3.3.8`): 2x/5x/infinite
			//at 1/2/3 on the first normal attack after a weapon ability, consumed once.
			//Java carves out a "do nothing" branch while a Flail spin is active (the
			//tracker survives untouched until spin ends) rather than treating a spin
			//swing as the consuming hit.
			if (this.preciseAssaultReady && this.spinSpins <= 0) {
				acc *= preciseAssaultAccuracy(this.talentRank('precise_assault'));
				this.preciseAssaultReady = false;
			}
		}
		const roll = runAttackResolution(attacker, defender, simulationRandom, false, force, acc, mult);
		if (roll.hit && attacker.isHero) {
			//Combo strike's window counts melee AND thrown hits (`ability_desc`: "melee or
			//thrown weapons" - the throw path reaches this same choke point on a hero copy,
			//which is why this keys on `isHero` rather than the hero reference). Landed hits
			//feed no charge: Java's `Charger` accrues over time only (`Charger.act()`),
			//never per hit - see `tickWeaponAbility`.
			this.recentHitClocks.push(this.heroActionClock);
		}
		if (attacker === this.hero) {
			//The swing's flat boost is spent either way, and so is the force-hit - but a
			//harvest whose strike misses keeps its bleeding for the next landed hit, exactly
			//like Java's `HarvestBleedTracker` (afflicted before the attack, converted on
			//the next `damage()` that runs). Spinning is the other exception: every swing
			//while the tracker runs stays forced and boosted - only `tickWeaponAbility`'s
			//expiry clears it.
			this.abilityForceHit = false;
			this.abilityDamageMult = 1;
			this.abilityDamageBoostNext = 0;
		}
		return { hit: roll.hit, damage: roll.hit ? roll.damage + boost : roll.damage };
	},

	/**
	 * The Duelist's T-key weapon ability (`MeleeWeapon` overrides, tag `v3.3.8`): spends 1
	 * charge from the `Charger` meter (partial-first, gated on `charges + partial >= cost`)
	 * and runs the ability's effect - damage strikes auto-target the nearest visible enemy,
	 * while sneak aims through the `TargetingController` like Java's cell selector. Magnitudes are each weapon's
	 * own `ability_desc` (see `weaponAbilities.ts`); sneak and the charged shot are free
	 * (`hero.next()`), guard and spin cost the turn, and damage strikes ride their own
	 * attack's turn. An armed `COUNTER_ABILITY` tracker refunds `rank*0.375` after the
	 * spend (`afterAbilityUsed`) instead of discounting it.
	 */
	useWeaponAbility(this: DungeonScene): void {
		//Java's `MeleeWeapon.execute(AC_ABILITY)`: a non-Duelist with an equipped weapon
		//does nothing at all (no message) - the T-key is dead for every other class.
		//(The port always has a weapon wielded, so the unequipped/swift-equip branches
		//are vacuous here.)
		if (this.heroClass !== 'duelist') return;
		const def = weaponAbilityFor(this.weaponSourceClass, this.weaponId);
		if (!def) {
			this.say(t('port.log.noweaponability'));
			return;
		}
		//Java's `STRReq() > STR` gate (`ability_low_str`) runs before the charge check,
		//for every ability including the self-cast ones below. That catalogue key
		//postdates this port's strings, so the fully-translated generic
		//`ability_cant_use` speaks for it ("can't use that ability right now").
		if (weaponSTRReq(this.weaponTier, this.weaponLevel) > (this.hero.str ?? 0)) {
			this.say(t('items.weapon.melee.meleeweapon.ability_cant_use'), 'negative');
			return;
		}
		//Java's `baseChargeUse`: 1 for every ability, 0 only inside the flail's spin and
		//the swords' free re-cleave windows. Surprise gates heavy blow's *bonus* only
		//(`Mace.heavyBlowAbility`), never its cost. The counter state is read for the
		//post-spend refund below (`afterAbilityUsed`).
		const counterArmed = this.hero.buffs['counterAbility'] !== undefined;
		const counterRank = this.talentRank('counter_ability');
		const cost = weaponAbilityChargeCost(def.kind, {
			cleaveFree: this.cleaveFreeTurns > 0,
			spinning: this.spinSpins > 0,
		});
		if (!spendWeaponCharge({ charges: this.weaponCharge, partial: this.weaponPartialCharge }, cost)) {
			this.say(t('port.log.lowweaponcharge'), 'negative');
			return;
		}
		switch (def.kind) {
			case 'sneak': {
				//`Dagger.sneakAbility(hero, target, maxDist, invisTurns, wep)` (tag `v3.3.8`,
				//blade 3 / dirk 4 / dagger 5 in each weapon's own call): the aimed cell must
				//be within `maxDist` path-steps, in `heroFOV`, unoccupied, with the hero
				//unrooted - else the `ability_target_range`/`ability_occupied` warnings.
				//Those two keys postdate this port's catalogue, so the controller's own
				//refusal line speaks for them (stated, not silent). The charge spends only
				//on a legal confirm (`beforeAbilityUsed` runs after validation in Java too);
				//cancelling is free. Free (`hero.next()`). Nuance: the flood is the port's
				//passable-only map where Java floods `passable|avoid`, so a path that only
				//exists through avoid cells reads one step shorter here.
				const maxDist = def.blinkRange ?? 5;
				this.beginAiming({
					range: maxDist,
					validate: (cell) => {
						if (this.hero.buffs['roots'] !== undefined) return false;
						//MWG's flood marks unreachable cells -1 where Java uses MAX_VALUE,
						//so the bound must exclude negatives explicitly.
						const distances = this.pathfinder.distanceMap({ x: this.hero.x, y: this.hero.y });
						const pathDistance = distances[this.level.index(cell.x, cell.y)] ?? -1;
						return pathDistance >= 0 && pathDistance <= maxDist
							&& this.fov.isVisible(cell.x, cell.y)
							&& this.creatureAt(cell.x, cell.y) === null;
					},
					onConfirm: (cell) => {
						this.takeAbilityCharge(cost);
						this.refundCounterAbility(counterArmed, counterRank);
						this.armPreciseAssault();
						this.armCombinedLethality();
						//`invisTurns = 2+buffedLvl()`, applied as `prolong(Invisibility,
						//invisTurns-1)` (never shortens an existing cloak).
						reigniteBuff(this.hero, 'invisibility', 1 + this.weaponLevel);
						//Java teleports then observes, updates the fog and re-checks visible
						//mobs; `teleportHeroTo` moves the sprite and brings FOV/fog with it.
						this.teleportHeroTo(cell.x, cell.y);
						this.say(t('port.log.weaponsneak'), 'positive');
					},
				});
				return;
			}
			case 'spin': {
				//Java checks the 3-spin cap before `beforeAbilityUsed`: a refused spin
				//spends nothing. The first spin costs 1, further spins are free.
				if (this.spinSpins >= (def.maxSpins ?? 3)) {
					this.say(t('items.weapon.melee.flail.spin_warn'), 'negative');
					return;
				}
				this.takeAbilityCharge(cost);
				this.refundCounterAbility(counterArmed, counterRank);
				this.armPreciseAssault();
				this.armCombinedLethality();
				this.spinSpins += 1;
				this.spinTurns = 3;
				this.say(t('port.log.weaponspin', { spins: this.spinSpins }), 'positive');
				this.spendHeroAction(1);
				return;
			}
			case 'guard': {
				this.takeAbilityCharge(cost);
				this.refundCounterAbility(counterArmed, counterRank);
				this.armPreciseAssault();
				this.armCombinedLethality();
				//`Greatshield`: `3+buffedLvl()`; `RoundShield`: `5+buffedLvl()` - and the
				//window is infinite evasion (`Hero.defenseSkill`), not one negated hit.
				this.guardTurns = (this.weaponMeleeKey() === 'roundshield' ? 5 : 3) + this.degradedLevel(this.weaponLevel);
				this.syncHeroFromStats();
				this.say(t('port.log.weaponguard'), 'positive');
				this.spendHeroAction(1);
				return;
			}
			case 'swordDance': {
				this.takeAbilityCharge(cost);
				this.refundCounterAbility(counterArmed, counterRank);
				this.armPreciseAssault();
				this.armCombinedLethality();
				this.swordDanceTurns = 3 + this.degradedLevel(this.weaponLevel);
				this.say(t('port.log.sworddance'), 'positive');
				return;
			}
			case 'defensiveStance': {
				this.takeAbilityCharge(cost);
				this.refundCounterAbility(counterArmed, counterRank);
				this.armPreciseAssault();
				this.armCombinedLethality();
				this.defensiveStanceTurns = 3 + this.degradedLevel(this.weaponLevel);
				this.syncHeroFromStats();
				this.say(t('port.log.defensivestance'), 'positive');
				return;
			}
			case 'chargedShot': {
				//Readying the shot is free (`hero.next()` in `Crossbow`), and re-readying
				//while armed is refused (`ability_cant_use`) - the charge is not spent twice.
				if (this.chargedShotArmed) {
					this.say(t('items.weapon.melee.meleeweapon.ability_cant_use'), 'negative');
					return;
				}
				this.takeAbilityCharge(cost);
				this.refundCounterAbility(counterArmed, counterRank);
				this.armPreciseAssault();
				this.armCombinedLethality();
				this.chargedShotArmed = true;
				this.say(t('port.log.chargedshot'), 'positive');
				return;
			}
			default: {
				//Damage strikes run through the next attack's own modifiers: force the hit
				//(every strike is `INFINITE_ACCURACY`), add Java's flat `dmgBoost`, and
				//stage the riders. Java opens a cell selector for the target
				//(`cleaveAbility(hero, target, ...)` takes the chosen cell); this routes
				//through the same `TargetingController` seam the throw and sneak already
				//use: confirm latches `abilityAimTarget` and re-enters, so the resolution
				//below still owns every mutation and turn cost. Cancelling spends nothing
				//- Java's `beforeAbilityUsed` (the charge spend) runs after validation,
				//inside the attack callback, so the spend stays below. Allies cannot be
				//struck, matching melee; the two catalogue-postdating refusal keys speak
				//through the controller's own line, as with sneak.
				//Aim reach is Java's `canAttack`: adjacent for reach-1 weapons, 2 for
				//spear/glaive spike, 3 for the whip's lash (its RCH).
				const range = def.kind === 'spike' ? 2 : def.kind === 'lash' ? 3 : 1;
				const validTarget = (candidate: Creature): boolean => !candidate.isHero && !candidate.isNPC
					&& !candidate.isAlly && candidate.hp > 0 && this.fov.isVisible(candidate.x, candidate.y)
					&& Roguelike.canTarget(this.level, this.hero, candidate, { range })
					//Lunge is a gap-closer: Java refuses below distance 2 and while rooted
					//(`ability_target_range` + shake). The aim simply offers no such cell.
					&& (def.kind !== 'lunge' || (Roguelike.chebyshevDistance(this.hero, candidate) >= 2
						&& this.hero.buffs['roots'] === undefined));
				if (!this.abilityAimTarget) {
					if (!this.creatures.some(validTarget)) {
						this.say(t('port.log.noweapontarget'), 'negative');
						return;
					}
					this.beginAiming({
						range,
						validate: (cell) => {
							const candidate = this.creatureAt(cell.x, cell.y);
							return !!candidate && validTarget(candidate);
						},
						onConfirm: (cell) => {
							this.abilityAimTarget = this.creatureAt(cell.x, cell.y);
							this.useWeaponAbility();
						},
					});
					return;
				}
				const target = this.abilityAimTarget;
				this.abilityAimTarget = null;
				if (!target) {
					this.say(t('port.log.noweapontarget'), 'negative');
					return;
				}
				if (def.kind === 'retribution' && this.hero.hp * 2 >= this.hero.maxHp) {
					this.say(t('port.log.retributionunready'), 'negative');
					return;
				}
				if (def.kind === 'spike' && Roguelike.chebyshevDistance(this.hero, target) < 2) {
					this.say(t('port.log.spiketoorange'), 'negative');
					return;
				}
				this.takeAbilityCharge(cost);
				this.refundCounterAbility(counterArmed, counterRank);
				this.abilityForceHit = true;
				this.abilityDamageMult = 1;
				this.lastAbilityAttack = def.kind;
				const effWeaponLevel = this.degradedLevel(this.weaponLevel);
				const flatBoost = (spec: { base: number; perLevel: number; roundSum: boolean }): number =>
					abilityFlatBoost(spec.base, spec.perLevel, effWeaponLevel, this.weaponAugment, spec.roundSum);
				if (def.kind === 'heavyBlow') {
					//`Mace.heavyBlowAbility`: no bonus damage unless the attack is a
					//surprise (`dmgBoost = 0`). Surprise here is the port's own test
					//(sleeping/unseen/invisible, `canSurpriseAttack` gated), the same one
					//`attack()` uses - daze lands regardless.
					const gate = canSurpriseAttack({
						thrown: false,
						unarmed: false,
						flail: false,
						heroStr: this.hero.str ?? 0,
						weaponTier: this.weaponTier,
						weaponLevel: this.weaponLevel,
					});
					const surprised = gate && (target.sleeping === true || target.seesHero === false
						|| this.hero.buffs['invisibility'] !== undefined);
					if (surprised && def.flatBoost) this.abilityDamageBoostNext = flatBoost(def.flatBoost);
					this.abilityDazeNext = true;
				} else if (def.kind === 'harvest') {
					//`Sickle.harvestAbility`: multi 0, the flat amount replaces the damage
					//and is applied as bleeding with it.
					if (def.flatBoost) {
						this.abilityDamageMult = 0;
						this.abilityHarvestNext = flatBoost(def.flatBoost);
						this.abilityDamageBoostNext = this.abilityHarvestNext;
					}
				} else if (def.flatBoost) {
					this.abilityDamageBoostNext = flatBoost(def.flatBoost)
						* (def.kind === 'comboStrike'
							? this.consumeComboWindow()
							: 1);
				}
				//Spike knocks back (`ability_desc`); lunge only steps the hero forward - neither
			//lunge desc mentions knockback, so it stages none.
			if (def.kind === 'spike') this.abilityKnockbackNext = true;
				//Runic slash stages the enchant-proc-chance boost the strike's own hit
				//consumes (`RunicSlashTracker`); the old double `heroOnHit(0)` re-proc is
				//gone, and so is the phantom x4 damage (Java's multi is 1, boost 0).
				if (def.kind === 'runicSlash') this.abilityRunicBonus = 3 + 0.5 * effWeaponLevel;
				if (def.kind === 'lunge') this.stepToward(target);
				this.attack(this.hero, target);
				//`afterAbilityUsed` runs after the strike, not before - see `armPreciseAssault`'s
				//own comment for why that ordering alone keeps this strike from boosting itself.
				this.armPreciseAssault();
				this.armCombinedLethality();
				if (target.hp <= 0) this.onAbilityKill(def.kind);
				//A non-killing cleave ends the free re-cleave window (`CleaveTracker`
				//detaches on both paths in `Sword.cleaveAbility`).
				if (def.kind === 'cleave' && target.hp > 0) this.cleaveFreeTurns = 0;
				if (def.kind === 'lash') this.lashOthers(target);
				//Killing cleaves and retributions are free (`hero.next()`); every other
				//strike spends the attack turn.
				if (!((def.kind === 'cleave' || def.kind === 'retribution') && target.hp <= 0)) {
					this.spendHeroAction(1);
				}
				return;
			}
		}
	},

	/** Cleave's kill refund (`ability_desc`: a killing cleave re-casts free within 5 turns). */
	onAbilityKill(this: DungeonScene, kind: string): void {
		if (kind === 'cleave') this.cleaveFreeTurns = 5;
	},

	/** Applies `beforeAbilityUsed`'s partial-first spend. The gate in `useWeaponAbility`
	 * already refused unaffordable costs, so this always succeeds. */
	takeAbilityCharge(this: DungeonScene, cost: number): void {
		const spent = spendWeaponCharge({ charges: this.weaponCharge, partial: this.weaponPartialCharge }, cost);
		if (spent) {
			this.weaponCharge = spent.charges;
			this.weaponPartialCharge = spent.partial;
		}
		//`beforeAbilityUsed`'s `AGGRESSIVE_BARRIER` half (`MeleeWeapon.java` 160-164,
		//tag `v3.3.8`): at half HP or below, using a weapon ability grants 1+2/rank
		//shield. This used to fire on the class special (`useSpecial`) instead, from
		//before this scene had a real T-key ability path at all - Java fires it here,
		//on ability use specifically, so it moved with the path's arrival.
		const barrierRank = this.talentRank('aggressive_barrier');
		if (barrierRank > 0 && this.hero.hp / this.hero.maxHp <= 0.5) {
			this.grantHeroShield(1 + 2 * barrierRank, this.hero.maxHp);
		}
	},

	/** `Sai.comboStrikeAbility`: the strike reads the tracker's recent hits, then the
	 * tracker detaches - firing consumes the window, so back-to-back combos need fresh
	 * hits. Returns the recent-hit count for the flat `boostPerHit*recentHits`. */
	consumeComboWindow(this: DungeonScene): number {
		const recent = this.recentHitClocks.filter((clock) => this.heroActionClock - clock <= 5).length;
		this.recentHitClocks.length = 0;
		return recent;
	},

	/** `afterAbilityUsed`'s `COUNTER_ABILITY` half: refund `rank*0.375` and detach. */
	refundCounterAbility(this: DungeonScene, armed: boolean, rank: number): void {
		if (!armed) return;
		const cap = this.weaponChargeCapNow();
		const gained = gainWeaponCharge(
			{ charges: this.weaponCharge, partial: this.weaponPartialCharge },
			counterAbilityRefund(rank),
			cap,
		);
		this.weaponCharge = gained.charges;
		this.weaponPartialCharge = gained.partial;
		delete this.hero.buffs['counterAbility'];
	},

	/** `afterAbilityUsed`'s `Talent.PRECISE_ASSAULT` half: arms `PreciseAssaultTracker` so the
	 * hero's *next* normal attack gets 2x/5x/infinite accuracy at 1/2/3
	 * (`MeleeWeapon.accuracyFactor()`, via `preciseAssaultAccuracy`) -
	 * consumed in `resolveHeroAbilityAttack`. Callers for a damage-strike ability must invoke
	 * this *after* that strike's own `attack()` call resolves (matching Java's real
	 * `afterAbilityUsed` position, at the end of the attack callback): the tracker does not
	 * exist yet during the strike that arms it, so there is no separate "not this weapon"
	 * guard to reproduce here - simple call-order does the same job. Every other ability kind
	 * never attacks on its own, so calling this alongside `refundCounterAbility` is safe. */
	armPreciseAssault(this: DungeonScene): void {
		if (this.talentRank('precise_assault') > 0) this.preciseAssaultReady = true;
	},

	/** `afterAbilityUsed`'s `Talent.COMBINED_LETHALITY` half (`MeleeWeapon.java` 206-213,
	 * tag `v3.3.8`): with the talent taken, using a weapon ability stores the attacking
	 * weapon on the tracker for one turn (`hero.cooldown()`); using an ability with a
	 * *different* weapon while it is armed only clears it ("we triggered the talent, so
	 * remove the tracker" - no execute fires there, the execute lives in `attack()`).
	 * Identity is the weapon object (`tracker.weapon == this`), so the port compares the
	 * equipped instance id, falling back to the bag id for uninstanced starting gear.
	 * Called at every `armPreciseAssault` site: for damage strikes that is after the
	 * strike's own `attack()` (Java's real `afterAbilityUsed` position), so a strike
	 * with a different weapon tests the *old* tracker first and re-arms after, exactly
	 * like Java's strike -> `afterAbilityUsed` order. */
	armCombinedLethality(this: DungeonScene): void {
		if (this.talentRank('combined_lethality') <= 0) return;
		const key = this.weaponInstanceId ?? this.weaponId;
		const stored = this.clAbilityWeaponInstanceId ?? this.clAbilityWeaponClass;
		if (this.clAbilityTurns <= 0 || stored === null || stored === undefined || stored === key) {
			this.clAbilityWeaponClass = this.weaponId;
			this.clAbilityWeaponInstanceId = this.weaponInstanceId;
			this.clAbilityTurns = 1;
		} else {
			this.clAbilityTurns = 0;
			this.clAbilityWeaponClass = null;
			this.clAbilityWeaponInstanceId = undefined;
		}
	},

	/** `Whip.lashAbility` (tag `v3.3.8`): the same `hero.attack(ch, 1, 0,
	 * INFINITE_ACCURACY)` against every enemy `hero.canAttack` reaches - whip RCH 3,
	 * all guaranteed (not just the closest), no extra damage. The staging resets on
	 * every swing, so each follow-up re-arms its own force-hit below. */
	lashOthers(this: DungeonScene, primary: Creature): void {
		for (const other of this.creatures.filter((c) => c !== primary && !c.isHero && !c.isNPC && c.hp > 0
			&& Roguelike.chebyshevDistance(this.hero, c) <= 3 && this.fov.isVisible(c.x, c.y))) {
			this.abilityForceHit = true;
			this.attack(this.hero, other);
		}
	},

	/** Steps the hero one cell toward a lunge target (the `Katana`/`Rapier` advance). */
	stepToward(this: DungeonScene, target: Creature): void {
		const dx = Math.sign(target.x - this.hero.x);
		const dy = Math.sign(target.y - this.hero.y);
		const at = { x: this.hero.x + dx, y: this.hero.y + dy };
		if ((dx !== 0 || dy !== 0) && this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y)) {
			this.moveTo(this.hero, at);
		}
	},

	/**
	 * Ticks the weapon-ability windows once per spent hero turn: spin, re-cleave, guard,
	 * both stances decay; the charge meter accrues over the turn per `Charger.act()`
	 * (see `accrueWeaponCharge`); combo strike's window reads the action clock, not a
	 * counter.
	 */
	tickWeaponAbility(this: DungeonScene, turnCost: number): void {
		this.heroActionClock += turnCost;
		this.spinTurns = Math.max(0, this.spinTurns - turnCost);
		if (this.spinTurns <= 0) this.spinSpins = 0;
		this.cleaveFreeTurns = Math.max(0, this.cleaveFreeTurns - turnCost);
		this.guardTurns = Math.max(0, this.guardTurns - turnCost);
		const hadStance = this.defensiveStanceTurns > 0;
		this.swordDanceTurns = Math.max(0, this.swordDanceTurns - turnCost);
		this.defensiveStanceTurns = Math.max(0, this.defensiveStanceTurns - turnCost);
		if (hadStance && this.defensiveStanceTurns <= 0) this.syncHeroFromStats();
		//`CombinedLethalityAbilityTracker`: detaches when its duration hits zero
		//(Java's FlavourBuff expiry); the execute tail normally consumes it one-shot,
		//and it ticks down if it survives the hit.
		if (this.clAbilityTurns > 0) {
			this.clAbilityTurns = Math.max(0, this.clAbilityTurns - turnCost);
			if (this.clAbilityTurns <= 0) { this.clAbilityWeaponClass = null; this.clAbilityWeaponInstanceId = undefined; }
		}
		//`Charger.act()` accrue over the spent turn (scaled by its cost, the same
		//convention the armor-Charger port uses for multi-turn actions).
		const accrued = accrueWeaponCharge(
			{ charges: this.weaponCharge, partial: this.weaponPartialCharge },
			{
				cap: this.weaponChargeCapNow(),
				champion: this.subclass() === 'champion',
				weaponRechargingRank: this.talentRank('weapon_recharging'),
				recharging: this.hero.buffs['recharging'] !== undefined,
				artifactRecharge: this.artifactRechargeTurns > 0,
				regenOn: this.regenOn(),
			},
			turnCost,
		);
		this.weaponCharge = accrued.charges;
		this.weaponPartialCharge = accrued.partial;
		this.recentHitClocks = this.recentHitClocks.filter((clock) => this.heroActionClock - clock <= 5);
	},

	weaponChargeCapNow(this: DungeonScene): number {
		return weaponChargeCap(this.progression.level, this.subclass() === 'champion');
	},

	/**
	 * The adapter's own spend path (`heroActions.spendTurn`), for the armor abilities. They are
	 * dispatched on the action table's `free` branch - opening the aim costs nothing, as Java's cell
	 * selector does - so the adapter never begins or spends a turn for them; `useArmorAbility` does
	 * the beginning and this does the spending.
	 *
	 * `freeTurnNext` (Lethal Momentum's earned free turn) is consumed by the *next* hero action
	 * whatever it is, which is why an ability has to go through this rather than calling
	 * `spendHeroTurn` directly - Java's free turn belongs to the hero's very next act.
	 */
	spendHeroAction(this: DungeonScene, turnCost: number): void {
		this.actionSpentTurn = true;
		this.awaitingInput = false;
		if (this.freeTurnNext) {
			this.freeTurnNext = false;
			return;
		}
		this.spendHeroTurn(turnCost);
	},

	/**
	 * `EndureTracker.adjustDamageTaken()`, called from the hero's single incoming-damage boundary
	 * (`absorbHeroDamage`). Java applies this before armor is subtracted for a char attacker and
	 * after it for other sources; this port has one boundary, so it is post-armor for both - stated
	 * in `PORT_COVERAGE.md` as the placement difference. The numbers are Java's: half the incoming
	 * damage, reduced further to 60/68/74/80% by `SHRUG_IT_OFF`, with half the *pre-reduction*
	 * damage banked for the counter-attack.
	 */
	endureAdjustDamageTaken(this: DungeonScene, damage: number): number {
		if (!this.endureEnduring) return damage;
		this.endureBanked += endureBankedDamage(damage);
		return endureDamageTaken(damage, this.talentRank('shrug_it_off'));
	},

	/**
	 * `EndureTracker.damageFactor()`, called once per hero attack: while enduring it does nothing;
	 * afterwards it adds the banked-per-hit bonus and consumes one of the tracker's hits.
	 */
	consumeEndureBonus(this: DungeonScene, damage: number): number {
		if (this.endureEnduring || this.endureHits <= 0) return damage;
		this.endureHits--;
		if (this.endureHits <= 0) this.endureTurns = 0;
		return damage + this.endureBanked;
	},

	/**
	 * `Hero.act()`'s `endEnduring()`, run at the start of the hero's *next* action: the endure
	 * window is the casting turn (three ticks for Endure's own `spendAndNext(3f)`) plus however
	 * long the hero waits, and what was banked in it becomes the counter-attack. Running this at
	 * the end of the casting turn instead would close the window before a single blow landed.
	 *
	 * The banked damage is scaled by `SUSTAINED_RETRIBUTION` (and by `EVEN_THE_ODDS` per hostile
	 * within distance 2) and then split evenly over `1 + SUSTAINED_RETRIBUTION` hits.
	 */
	settleEndure(this: DungeonScene): void {
		if (!this.endureEnduring) return;
		this.endureEnduring = false;
		const sustained = this.talentRank('sustained_retribution');
		const evenTheOdds = this.talentRank('even_the_odds');
		let nearby = 0;
		for (const other of this.creatures) {
			if (other.isHero || other.isNPC || other.isAlly || other.hp <= 0) continue;
			if (Roguelike.chebyshevDistance(this.hero, other) <= 2) nearby++;
		}
		const { perHitBonus, hits } = endureEndingBonus(this.endureBanked, sustained, nearby, evenTheOdds);
		this.endureBanked = perHitBonus;
		this.endureHits = hits;
		if (hits <= 0) this.endureTurns = 0;
	},

	/** `EndureTracker`'s own twelve-turn flavour countdown, on the actor clock - one tick per turn
	 *  the hero spends, whatever they spend it on. Expiry takes the counter-attack with it: in Java
	 *  both numbers live inside the tracker, so when the 12f buff runs out the tracker detaches and
	 *  `damageFactor` is never called again. (`settleEndure` is what reads the flag; the cast's own
	 *  three turns are three of the twelve, as they are in Java - the buff's `act()` ticks while the
	 *  hero is busy.) */
	tickEndureDuration(this: DungeonScene, turnCost: number): void {
		if (this.endureTurns <= 0) return;
		this.endureTurns = Math.max(0, this.endureTurns - turnCost);
		if (this.endureTurns === 0) {
			this.endureEnduring = false;
			this.endureBanked = 0;
			this.endureHits = 0;
		}
	},

	/** `HeroicLeap.DoubleJumpTracker`'s own three-turn countdown. */
	tickDoubleJump(this: DungeonScene, turnCost: number): void {
		if (this.doubleJumpTurns > 0) this.doubleJumpTurns = Math.max(0, this.doubleJumpTurns - turnCost);
	},

	/**
	 * The Rat King's half of `KingsCrown.upgradeArmor(hero, armor, new Ratmogrify())`, reached from
	 * `RatKing.interact()` with the crown already consumed by the exchange. The charge is the real
	 * `Ratmogrify.baseChargeUse` of 50; the ability's three real T4 talents (`RATSISTANCE`,
	 * `RATLOMACY`, `RATFORCEMENTS`, `Ratmogrify.java` 187) act through a `TransmogRat` actor this
	 * port's six-turn transformation does not have, so no tier-4 pool is granted here - that would
	 * hand out points with nothing to spend them on. Recorded as Not ported in `PORT_COVERAGE.md`.
	 */
	grantRatmogrify(this: DungeonScene): void {
		this.armorAbility = 'ratmogrify';
		this.armorCharge = ARMOR_CHARGE_START;
		//The Rat King spends the same crown Java's `upgradeArmor(hero, armor, new Ratmogrify())`
		//does, so the worn armor becomes the class armor here too, not just the ability.
		this.wearClassArmor();
	},

	/** `Ratmogrify.activate` (tag v3.3.8): transform one visible ordinary enemy for six
	 * turns while preserving its combat stats and disabling its specialised AI, make a
	 * transformed enemy a permanent ally (`RATLOMACY`), or spawn ally rats on an empty
	 * field (`RATFORCEMENTS`). The Java implementation uses a cell-targeting window and a
	 * separate TransmogRat actor; this port's action surface has no targeting window or
	 * alternate sprite actor, so it selects the nearest visible enemy and keeps the
	 * original sprite/kind while the state is active, and reads an empty field (no valid
	 * enemy) as the self-cast for the rat pack, since there is no cell picker to aim at
	 * the hero with. All three paths spend the real 50 charge and dispel invisibility.
	 */
	/**
	 * The `Ratmogrify` armor-ability flow lives in `simulation/ratmogrify.ts` as
	 * `useRatmogrifyFlow` behind `RatmogrifyContext` - the file-size refactor's
	 * thirty-second extraction, behavior-identical (zero runtime imports there, per
	 * the simulation confinement rule). The scene only builds the context here.
	 */
	useRatmogrify(this: DungeonScene): boolean {
		return useRatmogrifyFlow(this.ratmogrifyContext());
	},

	ratmogrifyContext(this: DungeonScene): RatmogrifyContext {
		const scene = this;
		return {
			hero: scene.hero,
			creatures: scene.creatures,
			fov: scene.fov,
			level: scene.level,
			creatureAt: (x, y) => scene.creatureAt(x, y) ?? undefined,
			isBossKind: (kind) => kind !== undefined
				&& (BOSS_KINDS.has(kind as MonsterId) || MINIBOSS_KINDS.has(kind as MonsterId)),
			ratmogrifyChargeUse: () => scene.ratmogrifyChargeUse(),
			get armorCharge() { return scene.armorCharge; },
			set armorCharge(charge: number) { scene.armorCharge = charge; },
			talentRank: (id) => scene.talentRank(id),
			shuffle: (items) => Random.shuffle(items),
			spawnAwakeAllyRat: (cell) => {
				const rat = scene.spawnMonster('rat', cell, false, undefined, true);
				rat.sleeping = false;
			},
			//The flow hands back one of the scene's own creatures, so the cast is exact.
			grantAdrenaline: (target, turns) => { addBuff(target as Creature, 'adrenalineSurge', turns); },
			say: (key, params, level) => scene.say(t(key, params ?? undefined), level),
		};
	},

	/**
	 * `KingsCrown.execute()`'s `AC_WEAR` action (tag `v3.3.8`): worn on the hero's armor, the crown
	 * opens `WndChooseAbility` over the class's three armor abilities - and with nothing worn at all
	 * it refuses with Java's own `naked` line. Wearing it consumes the crown and transforms the
	 * armor in `chooseArmorAbility`/`grantArmorAbility` (the port's `upgradeArmor()`); Java's cancel
	 * row is the panel's own, and leaves the crown in the bag.
	 *
	 * A class whose abilities are not ported yet keeps this item's earlier behaviour - the real
	 * `desc` line - rather than opening a choice with nothing in it (see `armorAbilitiesFor`).
	 */
	useKingsCrown(this: DungeonScene, _instanceId?: string): void {
		if (armorAbilitiesFor(this.heroClass).length === 0) {
			useArtifactKingsCrown({ say: this.say.bind(this) });
			return;
		}
		if (!this.hasCrownableArmor()) {
			this.say(t('items.kingscrown.naked'), 'negative');
			return;
		}
		this.armorChoiceOpen = true;
		this.talentOpen = true;
		this.refresh();
	},

	/**
	 * `TengusMask.execute(WEAR)` (`items/TengusMask.java`, tag `v3.3.8`): opens `WndChooseSubclass`.
	 * The mask is the only way to a subclass in Java - there is no level-13 prompt - so this is the
	 * whole entry point. A hero who already has a subclass has nothing to choose (Java only ever
	 * drops one mask, and it is `unique`). Cancelling leaves the mask in the bag.
	 */
	useTengusMask(this: DungeonScene, _instanceId?: string): void {
		if (this.subclass()) return;
		this.subclassChoiceOpen = true;
		this.talentOpen = true;
		this.refresh();
	},

	/** **The port's own rule, not Java's.** Java's gate is `belongings.armor() == null`, and
	 * `HeroClass.initHero` equips a `ClothArmor` at run start, so in Java the crown works on the
	 * starting cloth (and `naked` is reachable only by unequipping). This port's gear slot always
	 * holds an armor, so it treats its starting cloth as "no armor" - the same convention the Rat
	 * King's exchange has used since before the abilities existed (`src/actors/npcs.ts`, matched to
	 * the `crown_clothes` line's own joke). Recorded as a deliberate divergence in
	 * `PORT_COVERAGE.md`. */
	hasCrownableArmor(this: DungeonScene): boolean {
		return this.armorId !== 'clothArmor' && this.armorId !== 'startingArmor';
	},

	/** `ElixirOfFeatherFall.apply()` (tag `v3.3.8`): consume one alchemical spell and append
	 * its 50-turn, one-chasm marker. This inventory action spends the hero turn directly. */
	useFeatherFall(this: DungeonScene, instanceId?: string): void {
		useFeatherFallFlow(this.featherFallContext(), instanceId);
	},

	/**
	 * The FeatherFall self-cast lives in `items/spells.ts` behind `FeatherFallContext` -
	 * the file-size refactor's twenty-first extraction (with WildEnergy below),
	 * behavior-identical.
	 */
	featherFallContext(this: DungeonScene): FeatherFallContext {
		const scene = this;
		return {
			...scene.castBase(),
			applyFeatherFall: (duration) => { scene.hero.buffs['featherFall'] = duration; },
		};
	},

	useWildEnergy(this: DungeonScene, instanceId?: string): void {
		useWildEnergyFlow(this.wildEnergyContext(), instanceId);
	},

	/**
	 * The WildEnergy self-cast lives in `items/spells.ts` behind `WildEnergyContext` -
	 * the file-size refactor's twenty-first extraction (with FeatherFall above),
	 * behavior-identical.
	 */
	wildEnergyContext(this: DungeonScene): WildEnergyContext {
		const scene = this;
		return {
			...scene.castBase(),
			refundWandCharge: () => { scene.wandCharges.refund(1); },
			grantRecharging: (duration) => { addBuff(scene.hero, 'recharging', duration); },
			rechargeArtifacts: (amount) => { scene.applyArtifactRecharge(amount); },
			extendRechargeTurns: (turns) => { scene.artifactRechargeTurns = Math.max(scene.artifactRechargeTurns, turns); },
		};
	},

	/** The seams self-cast buff spells share: the carried spell, the turn, the log. */
	castBase(this: DungeonScene): CastBase {
		const scene = this;
		return {
			hasSpell: (id, instanceId) => scene.bag.find(id, instanceId) !== undefined,
			consumeSpell: (id, instanceId) => { scene.bag.remove(id, 1, instanceId); },
			spendTurn: () => { scene.actionSpentTurn = true; scene.spendHeroTurn(1); },
			say: scene.say.bind(scene),
			t,
		};
	},

	/** `TelekineticGrab.affectTarget()` (tag `v3.3.8`): target a heap and pull its contents
	 * into the hero's belongings, with the Java spell's cast cost capped at one turn. Java can
	 * hold several items in one ordinary Heap; this port has one GroundItem per cell, so one
	 * payload is the complete heap representation here. Java refuses chests and FOR_SALE heaps,
	 * which this port represents with `chest`/`forSale`; the existing pickup workflow handles the
	 * ordinary payload conversions (gold, stones, lit bombs, and generated inventory items). The
	 * beacon projectile and pickup-delay animation are not represented by this scene's UI. */
	useTelekineticGrab(this: DungeonScene, instanceId?: string): void {
		useTelekineticGrabFlow(this.telekineticGrabContext(), instanceId);
	},

	/**
	 * The TelekineticGrab aim/confirm flow lives in `items/spells.ts` behind
	 * `TelekineticGrabContext` - the file-size refactor's seventeenth extraction (with
	 * PhaseShift below), behavior-identical.
	 */
	telekineticGrabContext(this: DungeonScene): TelekineticGrabContext {
		const scene = this;
		return {
			...scene.targetedSpellBase(),
			groundItemAt: (x, y) => scene.groundItemAt(x, y),
			grabGroundItem: (x, y) => { scene.pickupGroundItemAt(x, y); },
		};
	},

	/** `PhaseShift.affectTarget()` (tag `v3.3.8`): teleport the selected character to a
	 * random free destination and paralyse non-boss characters for Java's standard duration.
	 * Java also resets a hunting Mob to wandering and beckons it toward another destination;
	 * this port has no separate Mob state/beckon system, so the normal post-teleport FOV update
	 * supplies the equivalent loss of the current target. The spell's projectile and teleport
	 * presentation are not represented by this scene's UI. */
	usePhaseShift(this: DungeonScene, instanceId?: string): void {
		usePhaseShiftFlow(this.phaseShiftContext(), instanceId);
	},

	/**
	 * The PhaseShift aim/confirm flow lives in `items/spells.ts` behind
	 * `PhaseShiftContext` - the file-size refactor's seventeenth extraction (with
	 * TelekineticGrab above), behavior-identical.
	 */
	phaseShiftContext(this: DungeonScene): PhaseShiftContext {
		const scene = this;
		return {
			...scene.targetedSpellBase(),
			creatureAt: (x, y) => scene.creatureAt(x, y),
			randomFreeCellNear: (x, y) => scene.randomFreeCell({ x, y }),
			moveCreatureTo: (x, y, cell) => {
				const creature = scene.creatureAt(x, y);
				if (creature) scene.moveTo(creature, cell);
			},
			playTeleportOn: (creature, from, to) => { scene.playTeleportAppear(from, to, creature as Creature); },
			calmCreature: (creature) => {
				const live = creature as Creature;
				live.seesHero = false;
				live.patrolTarget = scene.randomPatrolDestination(live);
			},
			isBossOrMiniboss: (kind) => BOSS_KINDS.has(kind as AnyMonsterId) || MINIBOSS_KINDS.has(kind as AnyMonsterId),
			afflictParalysis: (creature) => { addBuff(creature as Creature, 'paralysis'); },
		};
	},

	/** The seams both targeted-spell flows share: the carried spell, the aimer, the turn. */
	targetedSpellBase(this: DungeonScene): TargetedSpellAim {
		const scene = this;
		return {
			hasSpell: (id, instanceId) => scene.bag.find(id, instanceId) !== undefined,
			consumeSpell: (id, instanceId) => { scene.bag.remove(id, 1, instanceId); },
			beginAim: (opts) => scene.beginAiming(opts),
			spendTurn: () => { scene.actionSpentTurn = true; scene.spendHeroTurn(1); },
			say: scene.say.bind(scene),
			t,
		};
	},

	/** `SummonElemental.onCast()` (tag `v3.3.8`): summon an allied newborn elemental in a
	 * free adjacent cell, spending one turn only when a spawn point exists. Java lets the player
	 * imbue the spell with four consumables to choose a mature elemental subtype; this port's
	 * existing actor model has the newborn elemental's fire attack and no spell-imbue picker, so
	 * the default allied newborn is the documented playable subset. Java's temporary ally buff and
	 * summon/teleport particles are likewise not represented by the current actor state. */
		useSummonElemental(this: DungeonScene, instanceId?: string): void {
			const spell = this.summonElementalItem(instanceId);
			if (!spell) return;
			// Real Java's spell has two actions: the cast itself (the item's default use) and `AC_IMBUE`.
			// This port has no action menu, so both are rows of its generic picker, labelled with SPD's
			// own `items.spells.spell.ac_cast` and `items.spells.summonelemental.ac_imbue` strings.
			const castEntry = 'summonElemental-cast', imbueEntry = 'summonElemental-imbue';
			this.openItemPicker(this.itemDisplayName('summonElemental', true, instanceId), [
				{ id: 'summonElemental', instanceId: castEntry, identified: true, quantity: 1 },
				{ id: 'summonElemental', instanceId: imbueEntry, identified: true, quantity: 1 },
			], (entry) => {
				if (entry.instanceId === castEntry) this.castSummonElemental(instanceId);
				else if (entry.instanceId === imbueEntry) this.beginElementalImbue(instanceId);
			});
		},

	/** `ReclaimTrap.affectTarget()` and `ReclaimedTrap` (tag `v3.3.8`): first target a visible,
	 * active trap and store its class while recharging the hero's wand; a later cast redeploys
	 * that class as a concealed active trap and consumes the spell. Java's trap reflection and
	 * `reclaimed` flag collapse here to the closed `TrapKind` union. Trap activation itself stays
	 * in `triggerTrapAt`; a persisted spent-cell set prevents a reclaimed/triggered trap from
	 * firing again. Java's lightning/teleport presentation and Bestiary accounting are absent. */
	useReclaimTrap(this: DungeonScene, instanceId?: string): void {
		useReclaimTrapFlow(this.reclaimTrapContext(), instanceId);
	},

	/**
	 * The ReclaimTrap store/redeploy flow lives in `items/spells.ts` behind
	 * `ReclaimTrapContext` - the file-size refactor's eighteenth extraction, behavior-identical.
	 */
	reclaimTrapContext(this: DungeonScene): ReclaimTrapContext {
		const scene = this;
		return {
			...scene.targetedSpellBase(),
			get carriedTrap() { return scene.reclaimedTrap; },
			trapAt: (x, y) => {
				const index = scene.level.index(x, y);
				if (!scene.trapKinds.has(index) || scene.spentTrapCells.has(index)
					|| scene.secrets.isSecret(x, y)) return null;
				return scene.trapKinds.get(index) ?? null;
			},
			canPlaceTrap: (x, y) => scene.level.passable(x, y)
				&& !scene.isChasmCell(x, y) && !scene.creatureAt(x, y),
			takeTrap: (x, y) => {
				const index = scene.level.index(x, y);
				const kind = scene.trapKinds.get(index);
				if (!kind) return;
				scene.reclaimedTrap = kind;
				scene.spentTrapCells.add(index);
				const trap = scene.portedPaint?.traps.get(index);
				if (trap) trap.active = false;
				scene.wandCharges.refund(1);
			},
			placeTrap: (x, y) => {
				const kind = scene.reclaimedTrap;
				if (!kind) return;
				const index = scene.level.index(x, y);
				scene.trapKinds.set(index, kind);
				scene.spentTrapCells.delete(index);
				scene.level.set(x, y, TRAP);
				if (scene.portedPaint) scene.portedPaint.traps.set(index, { kind, hidden: true, active: true });
				scene.secrets.conceal(x, y, FLOOR, TRAP);
				scene.reclaimedTrap = null;
			},
			refreshTiles: () => { scene.restitchAllTiles(); },
		};
	},

	/** `Recycle.onItemSelected()` (tag `v3.3.8`): replace one carried potion, scroll, seed, or
	 * runestone with a different default-generated item from the same category. Java also accepts
	 * TippedDart and preserves exotic-vs-regular families; neither has a distinct complete item
	 * model here. The generic picker supplies the inventory selection, and the existing generator
	 * plus `generatedInventoryItem` preserve the category's level-stream generation and payload
	 * conversion. The transmuting particles and collection-vs-floor-drop branch are UI-only in
	 * this inventory-sized port, whose bag has no capacity limit. */
	useRecycle(this: DungeonScene, instanceId?: string): void {
		useRecycleFlow(this.recycleContext(), instanceId);
	},

	/**
	 * The Recycle pick/redraw flow lives in `items/spells.ts` behind `RecycleContext` -
	 * the file-size refactor's nineteenth extraction, behavior-identical.
	 */
	recycleContext(this: DungeonScene): RecycleContext {
		const scene = this;
		type Recyclable = { id: string; quantity: number; instanceId?: string; identified?: boolean; sourceClass?: string };
		const carried = () => scene.bag.items as Recyclable[];
		return {
			hasSpell: (id, instanceId) => scene.bag.find(id, instanceId) !== undefined,
			openPicker: (title, entries, onPick) => scene.openItemPicker(title, entries, onPick),
			recyclables: () => carried(),
			findRecyclable: (id, instanceId) => carried().find((item) => item.quantity > 0
				&& item.id === id && (item.instanceId ?? undefined) === (instanceId ?? undefined)) ?? null,
			drawReplacement: (category, source) => {
				const deck = category === 'potion' ? Cat.POTION
					: category === 'scroll' ? Cat.SCROLL
						: category === 'seed' ? Cat.SEED : Cat.STONE;
				let generated: GenItem;
				let replacement: NonNullable<GroundItem['item']>;
				do {
					generated = randomUsingDefaults(deck);
					replacement = scene.generatedInventoryItem(generated);
				} while (source.sourceClass !== undefined
					&& (generated.cls.toLowerCase() === source.sourceClass.toLowerCase() || replacement.id === source.id));
				return replacement;
			},
			replaceRecycled: (source, replacement, spellInstanceId) => {
				scene.bag.remove(source.id, 1, source.instanceId);
				scene.bag.remove('recycle', 1, spellInstanceId);
				//The flow only ever hands back the object `drawReplacement` above built, which
				//is the full generated payload narrowed to `RecycledItemView` at the seam.
				scene.bag.add({ ...(replacement as NonNullable<GroundItem['item']>), stackable: true });
			},
			replacementName: (replacement) => scene.itemDisplayName(replacement.id, false, replacement.instanceId),
			refreshPanels: () => { scene.refreshInventoryPanel(); },
			say: scene.say.bind(scene),
			t,
		};
	},

	/** `CurseInfusion.onItemSelected()` (tag `v3.3.8`): curse one carried weapon or armor,
	 * replacing its affix with a real negative pool entry, and grant the one-time infusion
	 * upgrade marker. Java's selector also exposes equipped gear and MagesStaff/SpiritBow;
	 * this port's generic picker exposes only carried weapon/armor/wand payloads, and its
	 * upgrade systems have no separate temporary-bonus field, so the marker is represented by
	 * one persistent level. Java removes that bonus when the curse is cleansed; this port's
	 * cleanse path removes the curse affix but does not yet reverse the level marker. Both
	 * omissions are recorded in PORT_COVERAGE.md rather than hidden in the action. */
	useCurseInfusion(this: DungeonScene, instanceId?: string): void {
		useCurseInfusionFlow(this.curseInfusionContext(), instanceId);
	},

	/**
	 * The CurseInfusion pick/curse flow lives in `items/spells.ts` behind
	 * `CurseInfusionContext` - the file-size refactor's twentieth extraction (with
	 * MagicalInfusion below), behavior-identical.
	 */
	curseInfusionContext(this: DungeonScene): CurseInfusionContext {
		const scene = this;
		return {
			...scene.infusionBase(),
			relabelAfterInfusion: (item) => { scene.relabelMissileStack(item); },
			burstShadowUp: () => { scene.burstShadowUp({ x: scene.hero.x, y: scene.hero.y }); },
		};
	},

	/** The seams both infusion pickers share: the carried spell, the picker, the bag. */
	infusionBase(this: DungeonScene): InfusionBase {
		const scene = this;
		type Infusable = { id: string; quantity: number; instanceId?: string; affix?: string; cursed?: boolean; level?: number; identified?: boolean; curseInfusionBonus?: boolean };
		const carried = () => scene.bag.items as Infusable[];
		return {
			hasSpell: (id, instanceId) => scene.bag.find(id, instanceId) !== undefined,
			consumeSpell: (id, instanceId) => { scene.bag.remove(id, 1, instanceId); },
			openPicker: (title, entries, onPick) => scene.openItemPicker(title, entries, onPick),
			infusables: () => carried(),
			findInfusable: (id, instanceId) => carried().find((item) => item.quantity > 0
				&& item.id === id && (item.instanceId ?? undefined) === (instanceId ?? undefined)) ?? null,
			itemName: (item) => scene.itemDisplayName(item.id, item.identified ?? false, item.instanceId),
			refreshPanels: () => { scene.refreshInventoryPanel(); },
			say: scene.say.bind(scene),
			t,
		};
	},

	/** `MagicalInfusion.onItemSelected()`/`upgradeItem()` (tag `v3.3.8`): upgrade one
	 * carried upgradable item while preserving an existing weapon enchant or armor glyph.
	 * Java's spell opens the full equipment selector, including equipped gear and every
	 * upgradable item type; this port's generic picker exposes carried weapon, armor, wand,
	 * and ring payloads only. The bag item is upgraded through MWG's affix-aware operation,
	 * which keeps the existing affix instead of rolling a new one. Java's wand-specific
	 * preservation of `curseInfusionBonus` is represented by the payload's ordinary level and
	 * cursed state; the separate temporary bonus has no independent field here. */
	useMagicalInfusion(this: DungeonScene, instanceId?: string): void {
		useMagicalInfusionFlow(this.infusionBase(), instanceId);
	},

	/** `BeaconOfReturning.onCast()`/`setBeacon()`/`returnBeacon()` (tag `v3.3.8`): a
	 * stack remembers one floor and cell, can be reset without consuming a use, and is
	 * consumed only when returning. Same-floor return moves the hero immediately; a
	 * cross-floor return rebuilds the saved floor and places the hero at the remembered
	 * cell. Java has an options window, psychic-aura checks, branch restrictions, pushing
	 * of an occupant, and a dedicated BeaconTracker buff. This port uses the item payload
	 * as the persisted tracker, rejects the unsupported mining branch implicitly, and uses
	 * the existing floor-state transition path; those presentation and edge-case reductions
	 * are recorded in PORT_COVERAGE.md. */
	useBeaconOfReturning(this: DungeonScene, instanceId?: string): void {
		useReturningBeaconFlow(this.beaconFlowContext(), instanceId);
	},

	/** `TimekeepersHourglass.timeFreeze`: freeze automatic actors while hero actions are free. */
	useHourglass(this: DungeonScene, instanceId?: string): void {
		useArtifactHourglass(this.artifactActionContext(), instanceId);
	},

	/** CloakOfShadows.execute()/cloakStealth (tag v3.3.8): toggle invisibility while
	 * consuming one charge every four actor turns. The port has no separate artifact
	 * quickslot, so the inventory row is the action surface; carried artifacts are treated
	 * as equipped, matching the Rogue starting-kit convention already used here. */
	useCloak(this: DungeonScene, instanceId?: string): void {
		useArtifactCloak(this.artifactActionContext(), instanceId);
	},

	/** `ChaliceOfBlood.execute(AC_PRICK)`: see `useChalice`'s own doc comment in
	 * `artifactActions.ts` for the real Java behavior and this port's stated simplifications. */
	useChalice(this: DungeonScene, instanceId?: string): void {
		useArtifactChalice(this.artifactActionContext(), instanceId);
	},

	artifactActionContext(this: DungeonScene): ArtifactActionContext {
		const scene = this;
		return {
			bag: this.bag, hero: this.hero,
			get timeBubbleTurns() { return scene.timeBubbleTurns; }, set timeBubbleTurns(value) { scene.timeBubbleTurns = value; },
			get hourglassFreeze() { return scene.hourglassFreeze; }, set hourglassFreeze(value) { scene.hourglassFreeze = value; },
			get hourglassTurnsToCost() { return scene.hourglassTurnsToCost; }, set hourglassTurnsToCost(value) { scene.hourglassTurnsToCost = value; },
			get cloakStealthTurnsToCost() { return scene.cloakStealthTurnsToCost; }, set cloakStealthTurnsToCost(value) { scene.cloakStealthTurnsToCost = value; },
			flushTimeBubblePresses: this.flushTimeBubblePresses.bind(this), say: this.say.bind(this),
			absorbHeroDamage: (amount) => this.absorbHeroDamage(amount),
			showHeroDamage: (amount) => this.showDamage(this.hero, amount),
			killHero: (cause) => this.kill(this.hero, cause),
			//`UnstableSpellbook.doReadEffect()`'s real effect application, shared with the
			//Arcane Catalyst's own direct `applyScrollEffect` call - see `useSpellbook`.
			castScrollEffect: (id) => applyScrollEffect(id, this.scrollEffectsContext()),
		};
	},

	cancelHourglassFreeze(this: DungeonScene): void {
		if (!this.hourglassFreeze) return;
		this.hourglassFreeze = false;
		this.timeBubbleTurns = 0;
		this.flushTimeBubblePresses();
	},

	/** `Pickaxe.execute(AC_MINE)`: scan adjacent cells for the first WALL_DECO vein,
	 * spend two turns, turn it into ordinary WALL, and auto-pick up one DarkGold. */
	mineWithPickaxe(this: DungeonScene): void {
		if (!this.canMineCavesWall() || !this.portedPaint) {
			this.say(t('port.log.pickaxenovein'), 'negative');
			return;
		}
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const x = this.hero.x + dx, y = this.hero.y + dy;
			if (!this.level.inside(x, y)) continue;
			const cell = this.level.index(x, y);
			if (this.portedPaint.map[cell] !== Terrain.WALL_DECO) continue;
			this.portedPaint.map[cell] = Terrain.WALL;
			this.bag.add({ id: 'darkGold', quantity: 1, stackable: true, identified: true });
			this.say(t('port.log.pickup', { item: t('items.quest.darkgold.name') }), 'positive');
			runState.audio.cue('evoke', 0.7);
			this.actionSpentTurn = true;
			this.spendHeroTurn(2);
			return;
		}
		this.say(t('port.log.pickaxenovein'), 'negative');
	},

	/** One ring slot for this MWG UI; the ring's real level curve is applied below. */
	equipRing(this: DungeonScene, id: string, instanceId?: string): void {
		equipInventoryRing(this.ringEquipmentContext(), id, instanceId);
	},

	ringEquipmentContext(this: DungeonScene): RingEquipmentContext {
		const scene = this;
		return {
			bag: this.bag, heroClass: this.heroClass, hero: this.hero,
			get equippedRing() { return scene.equippedRing; }, set equippedRing(value) { scene.equippedRing = value; },
			get ringHtBonus() { return scene.ringHtBonus; }, set ringHtBonus(value) { scene.ringHtBonus = value; },
			talentRank: this.talentRank.bind(this), itemDisplayName: this.itemDisplayName.bind(this),
			markRingTypesKnown: (ids) => markRingTypesKnown(this, ids),
			procIdentifyTalents: this.procIdentifyTalents.bind(this),
			syncHeroFromStats: this.syncHeroFromStats.bind(this), say: this.say.bind(this),
		};
	},

	/** Found armor replaces the cloth armor entry and preserves the current effective level. */
	equipArmor(this: DungeonScene, id: string, instanceId?: string): void {
		equipInventoryArmor(this.gearEquipmentContext(), id, instanceId);
	},

	/** Generated quest weapons feed the same upgrade level used by the active class weapon. */
	equipWeapon(this: DungeonScene, id: string, instanceId?: string): void {
		const found = this.bag.find(id, instanceId) as { sourceClass?: string } | undefined;
		if (found?.sourceClass !== undefined) this.weaponSourceClass = found.sourceClass;
		else if (id !== 'weaponReward') this.weaponSourceClass = id;
		equipInventoryWeapon(this.gearEquipmentContext(), id, instanceId);
	},

	gearEquipmentContext(this: DungeonScene): GearEquipmentContext {
		const scene = this;
		return {
			bag: this.bag, heroClass: this.heroClass, hero: this.hero,
			get armorId() { return scene.armorId; }, set armorId(value) { scene.armorId = value; },
			get armorInstanceId() { return scene.armorInstanceId; }, set armorInstanceId(value) { scene.armorInstanceId = value; },
			get armorLevel() { return scene.armorLevel; }, set armorLevel(value) { scene.armorLevel = value; },
			get armorTier() { return scene.armorTier; }, set armorTier(value) { scene.armorTier = value; },
			get armorGlyph() { return scene.armorGlyph; }, set armorGlyph(value) { scene.armorGlyph = value; },
			get armorHardened() { return scene.armorHardened; }, set armorHardened(value) { scene.armorHardened = value; },
			get armorCursed() { return scene.armorCursed; }, set armorCursed(value) { scene.armorCursed = value; },
			get armorCursedKnown() { return scene.armorCursedKnown; },
			get armorSealed() { return scene.armorSealed; }, set armorSealed(value) { scene.armorSealed = value; },
			get weaponId() { return scene.weaponId; }, set weaponId(value) { scene.weaponId = value; },
			get weaponInstanceId() { return scene.weaponInstanceId; }, set weaponInstanceId(value) { scene.weaponInstanceId = value; },
			get weaponLevel() { return scene.weaponLevel; }, set weaponLevel(value) { scene.weaponLevel = value; },
			get weaponTier() { return scene.weaponTier; }, set weaponTier(value) { scene.weaponTier = value; },
			get weaponAffix() { return scene.weaponAffix; }, set weaponAffix(value) { scene.weaponAffix = value; },
			get weaponHardened() { return scene.weaponHardened; }, set weaponHardened(value) { scene.weaponHardened = value; },
			get weaponCursed() { return scene.weaponCursed; }, set weaponCursed(value) { scene.weaponCursed = value; },
			get weaponCursedKnown() { return scene.weaponCursedKnown; },
			get weaponIdentified() { return scene.weaponIdentified; }, set weaponIdentified(value) { scene.weaponIdentified = value; },
			get armorIdentified() { return scene.armorIdentified; }, set armorIdentified(value) { scene.armorIdentified = value; },
			get weaponCurseInfusionBonus() { return scene.weaponCurseInfusionBonus; },
			set weaponCurseInfusionBonus(value) { scene.weaponCurseInfusionBonus = value; },
			get armorCurseInfusionBonus() { return scene.armorCurseInfusionBonus; },
			set armorCurseInfusionBonus(value) { scene.armorCurseInfusionBonus = value; },
			offerSealTransfer: this.offerSealTransfer.bind(this),
			effectiveWeaponLevel: this.effectiveWeaponLevel.bind(this),
			effectiveArmorLevel: this.effectiveArmorLevel.bind(this),
			setWeaponAffix: this.setWeaponAffix.bind(this),
			setArmorGlyph: this.setArmorGlyph.bind(this),
			talentRank: this.talentRank.bind(this), syncHeroFromStats: this.syncHeroFromStats.bind(this), say: this.say.bind(this),
			procIdentifyTalents: this.procIdentifyTalents.bind(this),
		};
	},

	/** A found wand refreshes the shared staff charge pool; Mage's special action consumes it.
	 * The tapped entry equips when one is named, so a spare wields its own class instead of
	 * whatever `bag.find` returns first; the untargeted pile tap keeps the old behavior. */
	equipWand(this: DungeonScene, instanceId?: string): void {
		equipInventoryWand(this.equipWandContext(), instanceId);
	},

	/**
	 * Tapping a spare wand as the Mage: wield it, or imbue the staff with it
	 * (`MagesStaff`'s own `AC_IMBUE`, whose `WndBag.ItemSelector` this picker stands in for).
	 * Non-mages, the absorb pile and unknown classes wield directly, as before.
	 */
	chooseWandUse(this: DungeonScene, instanceId?: string): void {
		const spare = instanceId ? this.bag.items.find((item) => item.id === 'wand' && item.instanceId === instanceId) : undefined;
		const spareType = spare ? wandTypeFromSource((spare as typeof spare & { sourceClass?: string }).sourceClass) : null;
		if (this.heroClass !== 'mage' || !spare || !spareType) { this.equipWand(instanceId); return; }
		const name = this.itemDisplayName('wand', spare.identified ?? false, spare.instanceId);
		const current = staffImbueFor(this);
		showChoiceWindow(this.gameWindows, name,
			t('items.weapon.melee.magesstaff.has_wand', { 0: t(WAND_KEYS[current] ?? WAND_KEYS.magicMissile) }),
			[
				{ label: t('items.equipableitem.ac_equip'), onPick: () => this.equipWand(spare.instanceId) },
				{ label: t('items.weapon.melee.magesstaff.ac_imbue'), onPick: () => this.imbueStaffConfirm(spare.instanceId) },
			]);
	},

	/**
	 * `MagesStaff`'s imbue confirm: unidentified spares refuse with `id_first`, cursed
	 * ones with `cursed` (both are selector-time refusals in Java), and an unknown curse
	 * state appends the `imbue_cursed` warning. The `imbue_desc` level is the real
	 * `imbueStaffLevel` result, and `imbue_lost` names the outgoing class going away.
	 */
	imbueStaffConfirm(this: DungeonScene, instanceId?: string): void {
		const spare = instanceId ? this.bag.items.find((item) => item.id === 'wand' && item.instanceId === instanceId) : undefined;
		const spareType = spare ? wandTypeFromSource((spare as typeof spare & { sourceClass?: string }).sourceClass) : null;
		if (!spare || !spareType) return;
		if (!(spare.identified ?? false)) { this.say(t('items.weapon.melee.magesstaff.id_first'), 'negative'); return; }
		if (spare.cursed) { this.say(t('items.weapon.melee.magesstaff.cursed'), 'negative'); return; }
		const newLevel = imbueStaffLevel(this.weaponLevel, (spare as typeof spare & { level?: number }).level ?? 0);
		let body = t('items.weapon.melee.magesstaff.imbue_desc', { 0: newLevel });
		if (staffImbueFor(this) !== 'magicMissile') body += '\n\n' + t('items.weapon.melee.magesstaff.imbue_lost');
		if (!(spare as typeof spare & { cursedKnown?: boolean }).cursedKnown) body += '\n\n' + t('items.weapon.melee.magesstaff.imbue_cursed');
		showConfirmWindow(this.gameWindows,
			this.itemDisplayName('wand', true, spare.instanceId),
			body,
			t('items.weapon.melee.magesstaff.yes'),
			t('items.weapon.melee.magesstaff.no'),
			() => this.imbueStaff(spare.instanceId));
	},

	/**
	 * `MagesStaff.imbueWand()` minus the staff item: the spare detaches into the staff
	 * (consumed, like Java), the staff takes the synced level through `weaponLevel`, and
	 * the imbue class is what `ElementalBlast` will read. The old imbue is lost outright -
	 * Java's `WAND_PRESERVATION` eject (old wand back at +0 or an arcane resin) has no
	 * system here - and a cursed spare never reaches this point (refused above). */
	imbueStaff(this: DungeonScene, instanceId?: string): void {
		const spare = instanceId ? this.bag.items.find((item) => item.id === 'wand' && item.instanceId === instanceId) : undefined;
		const spareType = spare ? wandTypeFromSource((spare as typeof spare & { sourceClass?: string }).sourceClass) : null;
		if (!spare || !spareType || spare.cursed) return;
		const name = this.itemDisplayName('wand', spare.identified ?? false, spare.instanceId);
		this.weaponLevel = imbueStaffLevel(this.weaponLevel, (spare as typeof spare & { level?: number }).level ?? 0);
		this.syncHeroFromStats();
		setStaffImbue(this, spareType);
		this.bag.remove('wand', 1, spare.instanceId);
		this.say(t('items.weapon.melee.magesstaff.imbue', { 0: name }), 'positive');
	},

	equipWandContext(this: DungeonScene): EquipWandContext {
		const thisScene = this;
		return {
			bag: this.bag, heroClass: this.heroClass,
			get wandType() { return thisScene.wandType; },
			set wandType(value) { thisScene.wandType = value; },
			get frostWand() { return thisScene.frostWand; },
			set frostWand(value) { thisScene.frostWand = value; },
			get wandCharges() { return thisScene.wandCharges; },
			set wandCharges(value) { thisScene.wandCharges = value; },
			talentRank: this.talentRank.bind(this), say: this.say.bind(this),
			procIdentifyTalents: this.procIdentifyTalents.bind(this),
		};
	},

	positionInterface(this: DungeonScene, width: number, height: number): void {
		//`infoPanel` and `talentWindow` live in the scaled `gameWindows` stack, so they place in its logical space
		if (this.infoPanel && !this.infoPanel.closed) this.infoPanel.layout(width / this.windowZoom, height / this.windowZoom);
		if (this.statusPane) {
			//`StatusPane.layout()` in Java attaches the status chrome to the bottom-left of the
			//UI camera. The port's status pane is already authored at 2x, so its rendered height
			//is 72px; keep the same small inset as the Java HUD while preserving the whole pane.
			this.statusPane.x = 8;
			this.statusPane.y = Math.max(0, height - 72 - 8);
		}
		if (this.dungeonHud) this.dungeonHud.layout(width);
		if (this.actionBar) {
			this.actionBar.layout(width, height);
			if (this.gameLog) {
				const toolbarTop = height - this.actionBar.occupiedHeight - 8 - this.gameLog.logHeight;
				//GameScene.java keeps the message log above the bottom-left StatusPane; otherwise
				//the later-added log layer covers the pane's HP/XP strips even though they are drawn.
				this.gameLog.y = Math.min(toolbarTop, this.statusPane.y - 8 - this.gameLog.logHeight);
			}
		}

		if (this.inventoryPanel) {
			this.inventoryPanel.layout(width, height);
		}
		if (this.journalWindow) {
			this.journalWindow.x = Math.floor(width / 2);
			this.journalWindow.y = Math.floor(height / 2);
		}
		if (this.talentWindow && !this.talentWindow.closed) this.talentWindow.place(width / this.windowZoom, height / this.windowZoom);
		if (this.victoryPanel) {
			this.victoryPanel.x = (width - this.victoryPanel.width) / 2;
			this.victoryPanel.y = Math.max(80, (height - this.victoryPanel.height) / 2);
		}
		if (this.bossHealthBar) {
			this.bossChrome.x = 12 + (width - this.bossChrome.width) / 2;
			this.bossChrome.y = 40;
			this.bossHealthBar.x = this.bossChrome.x + 15 * 2;
			this.bossHealthBar.y = this.bossChrome.y + 3 * 2;
			this.bossNameLabel.x = this.bossHealthBar.x + 2;
			this.bossNameLabel.y = this.bossHealthBar.y;
			this.bossNameLabel.anchor.set(0, 0);
		}
		this.badgeBanner.resize(width, height);
	},

	say(this: DungeonScene, line: string, level: LogLevel = 'info'): void {
		this.gameLog.add(line, level);
		this.positionInterface(Game.current.width, Game.current.height);
	},

	/**
	 * Status text over a creature, `CharSprite.showStatus` - a damage number, a heal, the
	 * name of a buff that just landed. Nothing was shown for any of these before: a hit was
	 * a one-frame white flash, so how hard it landed was only readable in the log.
	 */
	showStatus(this: DungeonScene, creature: Creature, text: string, color: number): void {
		if (!this.sprite(creature).visible) return;
		const [x, y] = this.worldOf(creature);
		const key = this.floaterKeys.get(creature) ?? this.nextFloaterKey++;
		this.floaterKeys.set(creature, key);
		//the stack centres text on the point; Java's sprite anchors it by its bottom edge, so half
		//a line is added back to keep the text sitting where it used to. `size`/`rise` are divided
		//by the scale because both live in the pop-up's own pre-scale space, while `scale` is passed
		//to `push` so the stack measures the pop-up at the size it is actually drawn at (0.7.7).
		this.floaters.push({
			text,
			color,
			x,
			y: y - TILE / 2 - this.floaterFontSize / 2,
			key,
			scale: this.floaterTextScale,
			size: this.floaterFontSize / this.floaterTextScale,
			duration: 1,
			rise: TILE / this.floaterTextScale,
			hold: 0.5,
		});
	},

	/** damage taken, in `CharSprite.NEGATIVE` */
	showDamage(this: DungeonScene, creature: Creature, amount: number): void {
		if (amount > 0) {
			this.showStatus(creature, String(amount), SPD_STATUS_COLOR.negative);
			//`CharSprite.flash()` (tag `v3.3.8`): `Char.attack()` calls this alongside the
			//blood-burst/damage-number pair (`enemy.sprite.bloodBurstA(...); enemy.sprite.flash();`)
			//on every landed hit - a brief full-white additive pulse (`ra=ba=ga=1`, decaying over
			//`FLASH_INTERVAL` = 50ms) this port had a half-built fade-out for (the per-frame
			//`colorAdd` clear a few screens down, whose own comment already explained the design)
			//but no trigger anywhere, so no creature ever actually flashed on taking damage. Sets
			//the same `colorAdd` field that fade-out already clears next frame - one frame's flash
			//at this port's tick rate, close enough to Java's 50ms without a real timer.
			this.sprite(creature).colorAdd = 0xffffff;
		}
	},

	/** health gained, in `CharSprite.POSITIVE` */
	showHeal(this: DungeonScene, creature: Creature, amount: number): void {
		if (amount > 0) this.showStatus(creature, String(amount), SPD_STATUS_COLOR.positive);
	},

	/**
	 * `test_subject`/`tested_hypothesis` on any identify event, not just the scroll. Every
	 * identify site (the scroll below, the intuition rank-2 equips in `items/equipment.ts`
	 * and `items/equipWand.ts`) routes through here; each site guards on the item being
	 * newly identified. PROVENANCE FLAG (2026-09-18): no upstream source for either talent
	 * could be found - absent from `Talent.java` and the `actors` strings at tags `v3.3.8`
	 * and `v4.0.0` and on master - so the "real Java talent" claim the coverage row used to
	 * carry is withdrawn pending a decision (see the row). The shared-helper shape stands
	 * regardless: whatever their source, all of this port's identify events behave alike.
	 * Banked on a full pool the advance is discarded - MWG's `Charges` drops progress at
	 * cap - so a wand-equip identify (whose pool just reset full) runs the helper but
	 * banks nothing.
	 */
	procIdentifyTalents(this: DungeonScene): void {
		//Real `test_subject`: "+1: heals 2 HP on identify, +2: heals 3 HP" - `heal + 1`.
		//Real `tested_hypothesis`: "+1: gains 2 turns of wand recharging, +2: 3 turns" -
		//`Charges.refund(N)` would grant N whole charges outright, drastically stronger than
		//N turns of recharging (`recoverWandCharge`'s own `turnsToCharge` runs 10-50 real
		//turns per charge); `Charges.advance(N)` is no better, since its argument is progress
		//*units* toward one charge while this port's `wandCharges` uses `regenRate: 1`. The
		//correct amount is what N real turns of the *current* passive regen rate would have
		//produced: that same per-turn fraction, scaled by N.
		const heal = this.heroClass === 'warrior' ? this.talentRank('test_subject') : 0;
		const charge = this.heroClass === 'mage' ? this.talentRank('tested_hypothesis') : 0;
		if (heal > 0) { this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + heal + 1); this.showHeal(this.hero, heal + 1); }
		if (charge > 0) {
			const missing = this.wandCharges.max - this.wandCharges.current;
			const rechargeBase = this.ownsBag('magicalHolster') ? HOLSTER_RECHARGE_BASE : NORMAL_RECHARGE_BASE;
			const turnsToCharge = 10 + 40 * Math.pow(rechargeBase, Math.max(0, missing));
			const perTurnRate = ringEnergyMultiplier(this.effectiveRing(), this.hero.magicImmune) / turnsToCharge;
			this.wandCharges.advance(perTurnRate * (charge + 1));
		}
	},

	/** `Talent.onTalentUpgraded()`'s three rank-2 intuition branches: identify whatever's
	 * already equipped in the relevant slot the instant the point is spent, rather than
	 * waiting for the next equip to notice. Each is class-gated the same way the equip-time
	 * check in `items/equipment.ts` already is. */
	identifyOnTalentUpgraded(this: DungeonScene, talentId: string, newRank: number): void {
		//`Talent.onTalentUpgraded()`'s Thief's Intuition half: rank 1 marks the worn
		//ring's type known, rank 2 identifies it and marks every carried ring's type
		//(the rule itself lives in `simulation/ringKnow.ts`, pinned by suite).
		if (talentId === 'thiefs_intuition' && this.heroClass === 'rogue' && (newRank === 1 || newRank === 2)) {
			const worn = this.equippedRing ? [this.equippedRing.id] : [];
			const carried = newRank === 2
				? this.bag.items.filter((item) => item.id.startsWith('ring_')).map((item) => item.id)
				: [];
			markRingTypesKnown(this, thiefsIntuitionKnownIds(worn, carried, newRank));
		}
		if (newRank !== 2) return;
		let newlyIdentified = false;
		if (talentId === 'veterans_intuition' && this.heroClass === 'warrior' && !this.armorIdentified) {
			this.armorIdentified = true;
			newlyIdentified = true;
		} else if (talentId === 'thiefs_intuition' && this.heroClass === 'rogue'
			&& this.equippedRing && !this.equippedRing.identified) {
			this.equippedRing.identified = true;
			newlyIdentified = true;
		} else if (talentId === 'adventurers_intuition' && this.heroClass === 'duelist' && !this.weaponIdentified) {
			this.weaponIdentified = true;
			newlyIdentified = true;
		}
		if (newlyIdentified) this.procIdentifyTalents();
	},

	/**
	 * Badge bookkeeping (`Badges.java`): bump a meta counter, announce whatever it newly
	 * earns, and persist the meta store at once (badges survive death, runs do not).
	 */
	awardBadge(this: DungeonScene, counter: string, amount = 1): void {
		for (const id of this.badges.increment(counter, amount)) {
			const def = BADGE_DEFS.find((b) => b.id === id);
			this.say(t('port.log.badge', { badge: def?.description ?? id }), 'positive');
			const icon = BADGE_ICON[id];
			if (icon !== undefined) this.badgeBanner.show(icon);
		}
		this.meta.save('meta', this.badges.toJSON());
	},

	/**
	 * `DwarfKing.damage()` 459-467 (and `Goo`/`DM300`/`Pylon`/`Tengu`/`YogDzewa`'s own sites):
	 * dealing boss damage that is not a plain weapon hit clears
	 * `Statistics.qualifiedForBossChallengeBadge`. Plain weapon hits are melee and thrown
	 * attacks (kept by `attack()`); unarmed hits without `RingOfForce.fightingUnarmed`, any
	 * `Wand` except `WandOfLightning`, bombs, armor abilities, and (since 2026-09-21)
	 * GuidingLight all clear - higher-tier spells have no system here yet.
	 */
	disqualifyBossChallenge(this: DungeonScene, target: Creature): void {
		if (!this.qualifiedForBossChallenge) return;
		if (target.kind === 'goo' || target.kind === 'tengu' || target.kind === 'dm300'
			|| target.kind === 'king' || target.kind === 'yog' || target.kind === 'yogFist') {
			this.qualifiedForBossChallenge = false;
		}
	},

	/**
	 * The reverse direction of `disqualifyBossChallenge` (which covers the hero's
	 * non-weapon boss damage): Java clears `Statistics.qualifiedForBossChallengeBadge`
	 * when a boss itself fouls - Goo's pumped slam and water heal (`Goo.java`, tag
	 * `v3.3.8`), Tengu's bomb blast and shocker pulses striking the hero
	 * (`Tengu.java`). Found by the 41st behavior matrix (Goo/Tengu kits), which also
	 * records what stays open: the `bossScores` Â±100/1000 economy has no equivalent
	 * here (the port's score is depth/level/gold in `rankings.ts`), and Tengu's
	 * fire-cone foul cannot be attributed (field-fire ticks carry no source).
	 */
	foulBossChallenge(this: DungeonScene): void {
		this.qualifiedForBossChallenge = false;
	},

	/**
	 * What a bag item is called before identification: its shuffled appearance plus the
	 * plain noun ("a ruby potion"), the real `ItemSpriteSheet` variant system through
	 * `mwg/actors` Appearances. Identified items (and non-potion/scroll kinds) read as-is.
	 */
	itemDisplayName(this: DungeonScene, id: string, identified: boolean, instanceId?: string): string {
		return resolveItemDisplayName(this.itemDisplayContext(), id, identified, instanceId);
	},

	itemDisplayContext(this: DungeonScene): ItemDisplayContext {
		return { bag: this.bag, appearances: this.appearances, wandType: this.wandType,
			weaponId: this.weaponId, weaponInstanceId: this.weaponInstanceId, weaponHardened: this.weaponHardened,
			ringTypesKnown: ringTypesKnownFor(this),
			armorId: this.armorId, armorInstanceId: this.armorInstanceId, armorHardened: this.armorHardened };
	},

	worldOf(this: DungeonScene, creature: Creature): [number, number] {
		return [(creature.x + 0.5) * TILE, (creature.y + 0.5) * TILE];
	},

	heroPoint(this: DungeonScene): { x: number; y: number } {
		const hero = this.hero;
		return {
			get x() {
				return (hero.x + 0.5) * TILE;
			},
			get y() {
				return (hero.y + 0.5) * TILE;
			},
		};
	},
};
