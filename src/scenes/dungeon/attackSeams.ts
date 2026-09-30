/** DungeonScene methods: the T61 attack-pipeline seams, extracted verbatim from
 * `combatResolution.ts` so that file stays within its line budget. Each takes the
 * scene as `this`; `dungeonScene.ts` merges them back onto the class prototype.
 * Source-level pins in `tools/verifyCombat.mjs` read the whole scene directory,
 * so they cover these seams wherever the methods live. */
import type { DungeonScene } from '../dungeonScene';
import { faceCharacter, placeCharacterArt } from '../../ui/characterPlacement';
import { AnimatedSprite, Random, Roguelike, SpriteSheet } from 'mwg';
import { preparationCanKo } from '../../simulation/preparation';
import { planShockElementalArc } from '../../simulation/shockArc';
import { UNSTABLE_DELEGATES } from '../../items/itemAffixes';
import { ringArcanaMultiplier, ringForceBonus, ringTenacityMultiplier } from '../../items/ringModifiers';
import { HOLY_WARD_BLOCK, HOLY_WEAPON_BONUS, auraProcBonus, auraProtectedDamage, satiatedShieldAmount, searingLightBonus, shieldOfLightRange, trinityBodyGlyphActive } from '../../simulation/clericSpells';
import { capitalize, has, t } from '../../i18n/index';
import { assassinReachBonus, empoweredStrikeBonus, farsightMultiplier, shieldBatteryGain, weaponRechargingDamage } from '../../talentEffects';
import { weaponRechargeWindow } from '../../items/artifactRecharge';
import { runState } from '../../runState';
import { isChallengeEnabled } from '../../challenges';
import { combinedLethalityTest, exposeWeaknessDuration, feignedRetreatHaste } from '../../simulation/duelistAbilities';
import { mobOnHit } from '../mobOnHit';
import { absorbEarthrootArmor } from '../../simulation/plantPools';
import { applyCapeOfThornsProc } from '../../items/artifactActions';
import { EMBERS, FLOOR, GRASS, HIGH_GRASS, VIEW_RADIUS, WATER } from '../../dungeonConstants';
import { BUFF_DURATION, INFINITE_ACCURACY, INFINITE_EVASION, NEGATIVE_BUFFS, absorbShield, addBuff, applyElementalBacklash, buffBlocked, electricDamageHalved, reigniteBuff, rollDamage, rollHit, setBleeding, stoneGlyphReduction, type Creature } from '../../combat';
import { absorbCreatureShields } from '../../simulation/allyShields';
import { liveStats, IMMOVABLE_KINDS } from '../../monsters';
import { powerOfManyDamageFactor } from '../../simulation/clericSpells';

export const attackSeamMethods = {
	/**
	 * T61 slice 1: the swing presentation prelude of `attack()` - facing, the
	 * attack animation, and the per-kind swing shakes. Pure presentation: no
	 * rolls, no early returns, no state beyond the sprite lookup - it fires on
	 * misses too, exactly where it stood, so extracting it changes no behavior.
	 */
	presentAttackSwing(this: DungeonScene, attacker: Creature, defender: Creature): void {
		faceCharacter(this.sprite(attacker), attacker.x, defender.x);
		const attackerSprite = this.sprite(attacker);
		if (attackerSprite instanceof AnimatedSprite && attackerSprite.has('attack')) attackerSprite.play('attack', true);
		//`FistSprite.onComplete()` (tag `v3.3.8`): every Yog fist melee attack shakes
		//(`4, 0.2f`) when the swing completes - placed with the swing, like the anim,
		//so it fires on misses too. (The `yogfistslam` log nearby is the fist *summon*,
		//a different event with no Java shake of its own.)
		if (attacker.kind === 'yogFist') this.shakeScreen(4, 0.2);
		//`DM300Sprite.slam()` (tag `v3.3.8`): DM300's melee swing shakes (`3, 0.7f`)
		//with the slam anim, hit or miss. (`DM300.java` 325's *travelling* shake has
		//no expression: this port's DM300 has no travelling state.)
		if (attacker.kind === 'dm300') this.shakeScreen(3, 0.7);
	},

	/**
	 * T61 slice 2: the miss presentation of `attack()` - the whiff cue plus the
	 * hero-/third-person miss log line. The `sleeping = false` wake beside each
	 * call site stays inline: waking the victim is resolution state, not presentation.
	 */
	presentAttackMiss(this: DungeonScene, attacker: Creature, subject: string, object: string): void {
		runState.audio.cue('miss', 0.55);
		this.say(t(attacker.isHero ? 'port.log.misshero' : 'port.log.miss', { subject, object }), 'negative');
	},

	/**
	 * T61 slice 3: the pre-proc damage adjustments of a landed `attack()` - the
	 * ally PowerOfMany multiplier, the charm/spectator zeroing guards, the weapon
	 * augment and Recharging multipliers, and the RingOfForce bonus. Verbatim move;
	 * the Pylon-curve placement note stays at the call site, where it constrains
	 * what this seam may grow to cover.
	 */
	isCharmedToward(this: DungeonScene, attacker: Creature, defender: Creature): boolean {
		//Charm.recover()/Charm.object: an actor charmed toward this specific target
		//does not harm it. Shared by the damage seam and the post-damage charm-decay
		//below, which both read the same pairing.
		return attacker.buffs['charm'] !== undefined && this.charmTargets.get(attacker.id) === defender.id;
	},

	scaleAttackDamage(this: DungeonScene, attacker: Creature, defender: Creature, damage: number): number {
		//`Char.attack()` (tag `v3.3.8`): a PowerOfMany-powered ally deals 1.25x melee
		//damage. It folds into the roll multiplier at the `attack()` call site
		//(`combatResolution.ts`, R105), so it lands BEFORE the armor subtraction
		//like Java's pre-`defenseProc` chain - no copy may live on this tail, or a
		//wired T61 world would apply it twice (once in the roll, once here).
		//This also makes Affection's armor-glyph charm usable by ordinary monsters,
		//not only by the already-portable Friendly weapon path.
		if (this.isCharmedToward(attacker, defender)) damage = 0;
		//`Char.damage()` negates through `isInvulnerable()`, which a
		//`Challenge.SpectatorFreeze` carries - frozen spectators take no attack
		//damage, same zeroing shape as the charm line above. Bomb/trap/blast seams
		//apply the same guard at their own `damage()` boundaries; DoTs are negated
		//at the mob tick.
		if (defender.buffs['spectatorFreeze'] !== undefined) damage = 0;
		//Weapon.Augment: real Java's `Augment` enum (`Weapon.java`, tag `v3.3.8`) trades damage
		//against attack speed in both directions - `SPEED(0.7f damageFactor, 2/3f delayFactor)`,
		//`DAMAGE(1.5f damageFactor, 5/3f delayFactor)` - not a flat "20% up, nothing down" this
		//previously modeled (wrong numbers, and only DAMAGE's half at all). The delay half lives
		//in `getAttackTurnCostMod()`.
		if (attacker === this.hero && this.weaponAugment === 'speed') {
			damage = Math.round(damage * 0.7);
		} else if (attacker === this.hero && this.weaponAugment === 'damage') {
			damage = Math.round(damage * 1.5);
		}
		//Weapon Recharging (`Hero.damageRoll()`, Duelist T2): `round(dmg*1.025 + 0.025*points)`
		//while a Recharging-class buff is held - a melee damage multiplier, never the
		//per-hit wand-charge refund this used to be (that shape had no Java basis at all;
		//charges still refund through MysticalCharge/ExcessCharge/SoulSiphon below, which are
		//real). `ArtifactRecharge` counts too in Java (`Hero.damageRoll()`, v3.3.8); the port's
		//scene timer represents that buff and must open the same talent multiplier window.
		//note, read before "fixing": both tags gate the Java line on `heroClass != DUELIST`
		//- unsatisfiable alongside class-locked talents, so the port follows the evident
		//intent (the talent-holding class) rather than the literal gate.
		if (attacker === this.hero && this.talentRank('weapon_recharging') > 0
			&& weaponRechargeWindow(this.hero.buffs['recharging'] !== undefined, this.artifactRechargeTurns)) {
			damage = weaponRechargingDamage(damage, this.talentRank('weapon_recharging'));
		}
		//RingOfForce.armedDamageBonus(): flat +level on any armed (non-missile) melee hit -
		//`Hero.damageRoll()` gates this on `wep instanceof MissileWeapon`, which this port already
		//expresses the same way every other hero-only bonus here does: `attacker === this.hero`
		//is only true for the real bump-attack call site, never `useSpecial`'s throw/shoot/zap
		//branches (those pass a shallow copy of the hero, not the hero itself). The Monk's
		//temporary `UnarmedAbilityTracker` suppresses this armed bonus in Java; see the same
		//gate in `combatResolution.ts` and `RingOfForce.java:257-274` (v3.3.8). The no-weapon
		//`RingOfForce.damageRoll()` branch is unreachable because `startingWeapon` is always
		//present here (`Hero.java:663-676`, `RingOfForce.java:82-129`).
		if (attacker === this.hero && !this.monk.unarmedAttack) damage += ringForceBonus(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing());
		return damage;
	},

	/**
	 * T61 slice 4: the Unstable/Kinetic arming of a landed `attack()`. The delegate
	 * draw, the kill-storage arming, and the conserved-damage read-back move verbatim;
	 * downstream branches read the scene fields (`unstableDelegated`,
	 * `kineticTrackerHit`, `kineticConservedAdded`), never a local, so the seam
	 * returns only the adjusted damage.
	 */
	armStrikeAffix(this: DungeonScene, attacker: Creature, damage: number): number {
		//`Unstable.proc()`/`Kinetic.proc()`: an Unstable weapon delegates every swing to one
		//`Random.element` draw over `UNSTABLE_DELEGATES` (Java's `Random.oneOf(randomEnchants)`
		//minus the documented exclusions). The pick is stashed so `heroOnHit`'s post-damage
		//branches resolve the same enchant this swing. `Kinetic.proc()` first reads back any
		//conserved damage (`damageBonus()` is `ceil(preserved)`, not floor) and detaches it,
		//then attaches the tracker - on EVERY Kinetic swing, even at zero conserved, which is
		//why the later kill-store keys off the flag rather than the amount.
		const strikeAffix = this.weaponAffix === 'unstable' && attacker === this.hero
			? Random.element(UNSTABLE_DELEGATES)!
			: this.weaponAffix;
		this.unstableDelegated = this.weaponAffix === 'unstable' && attacker === this.hero ? strikeAffix : null;
		//`kineticTrackerHit` arms this swing's kill-storage (used below at the death check) -
		//true whenever THIS swing resolves as Kinetic, whether directly or via Unstable's
		//delegation draw, matching `KineticTracker` only ever being attached from inside
		//`Kinetic.proc()` itself.
		this.kineticTrackerHit = attacker === this.hero && strikeAffix === 'kinetic';
		this.kineticConservedAdded = 0;
		//Read-back is a different condition from arming: both `Kinetic.proc()` AND
		//`Unstable.proc()` read back and clear any conserved damage unconditionally at the
		//top of their own proc, before Unstable goes on to delegate to a random enchant - so
		//this fires on every swing of a Kinetic OR Unstable weapon, not only the swings where
		//Unstable's delegate happens to redraw Kinetic. **Found in the 2026-09-09 item-system
		//audit**: this used to gate the read-back on `kineticTrackerHit` too, silently
		//withholding the stored bonus on ~8/9 of an Unstable weapon's own swings.
		if (attacker === this.hero && (this.weaponAffix === 'kinetic' || this.weaponAffix === 'unstable') && this.kineticStored > 0) {
			this.kineticConservedAdded = Math.ceil(this.kineticStored);
			damage += this.kineticConservedAdded;
			this.kineticStored = 0;
		}
		return damage;
	},

	/**
	 * T61 slice 5: the hero talent-bonus chain of a landed `attack()` - Empowered
	 * Strike, Sucker Punch, physical bonus attacks, Patient Strike, Followup, and
	 * Deadly Followup. Verbatim move; every one-shot flag and tracker clears exactly
	 * where it did inline, so a second swing sees the same state.
	 */
	applyHeroTalentBonuses(this: DungeonScene, attacker: Creature, defender: Creature, surprise: boolean, damage: number): number {
		if (attacker === this.hero) damage += empoweredStrikeBonus(this.subclass(), this.talentRank('empowered_strike'));
		//Talent.java's SUCKER_PUNCH branch: `Random.IntRange(points, 2)` (1-2 at rank 1, flat 2
		//at rank 2), not a flat `points` bonus - found in the 2026-09-09 hero-progression audit.
		//Real Java attaches a `SuckerPunchTracker` to the enemy on the first proc, so surprising
		//the same target twice only triggers the bonus once. The port stores that tracker by the
		//creature's stable id and clears it naturally when a new run starts; it is saved with the
		//run so save/load cannot reopen the bonus.
		if (attacker.isHero && surprise) {
			const rank = this.talentRank('sucker_punch');
			if (rank > 0 && !this.suckerPunchTargets.has(defender.id)) {
				damage += Random.range(rank, 2);
				this.suckerPunchTargets.add(defender.id);
			}
		}
		if (attacker === this.hero && this.physicalBonusAttacks > 0) {
			damage += this.physicalBonusDamage;
			this.physicalBonusAttacks--;
		}
		if (attacker === this.hero && this.patientStrikeReady) {
			damage += this.talentRank('patient_strike');
			this.patientStrikeReady = false;
		}
		if (attacker === this.hero && this.followupTarget === defender) {
			damage += this.followupDamage;
			this.followupTarget = null;
			this.followupDamage = 0;
		}
		//`Talent.DEADLY_FOLLOWUP`: last in Java's own `onAttackProc` chain, multiplying the
		//whole accumulated damage rather than adding to it. `attacker === this.hero` already
		//excludes a thrown hit here (the throw path attacks with a spread copy of `this.hero`,
		//never the live reference), matching Java's own `attackingWeapon() instanceof
		//MissileWeapon` exclusion for free.
		if (attacker === this.hero && this.deadlyFollowupTarget === defender) {
			damage = Math.round(damage * (1 + 0.08 * this.talentRank('deadly_followup')));
			this.deadlyFollowupTarget = null;
		}
		return damage;
	},

	/**
	 * T61 slice 6: the hero weapon-affix procs of a landed `attack()` - Polarized,
	 * Sacrificial, Displacing. Verbatim move; the bleed/teleport side effects fire in
	 * the same order relative to the damage adjustments around them.
	 */
	applyWeaponAffixProcs(this: DungeonScene, attacker: Creature, defender: Creature, damage: number): number {
		//Polarized.proc(): real chance is a flat 1/2 - on success it amplifies to 1.5x, on
		//failure it zeroes the hit outright (a coin-flip between "hits hard" and "whiffs"),
		//reproduced exactly since it needs no subsystem beyond the damage value itself.
		if (attacker === this.hero && this.weaponAffix === 'polarized') {
			damage = Random.chance(0.5) ? Math.round(damage * 1.5) : 0;
		}
		//Sacrificial.proc(): Java rolls 1/10 x Arcana, then rolls a second time against
		//(HP/HT)^2 * HT / 8 and applies Bleeding at max(1, bleedAmt). The first draft
		//mistakenly used missing HP and a poison stand-in; both were wrong.
		if (attacker === this.hero && this.weaponAffix === 'sacrificial' && Random.chance((1 / 10) * this.enchantProcMultiplier())) {
			const bleedAmount = (attacker.hp / attacker.maxHp) ** 2 * attacker.maxHp / 8;
			if (Random.chance(bleedAmount)) setBleeding(attacker, Math.max(1, bleedAmount), 'sacrificial');
		}
		//Displacing.proc(): real chance is 1/12 x arcana, skipped against Java's IMMOVABLE targets.
		//Reuses the same free-cell search this file's Displacement armor curse already
		//uses in place of Java's ScrollOfTeleportation.teleportChar. Java also resets a fleeing
		//HUNTING mob back to WANDERING; this port has no such explicit state to reset, but the
		//next monster-turn FOV recompute (`seesHero`) naturally loses track once far enough away.
		if (attacker === this.hero && this.weaponAffix === 'displacing' && !defender.isNPC
			&& (defender.kind === undefined || !IMMOVABLE_KINDS.has(defender.kind))
			&& Random.chance((1 / 12) * this.enchantProcMultiplier())) {
			const destination = this.randomFreeCell(defender);
			if (destination) {
				const displaceFrom = { x: defender.x, y: defender.y };
				this.moveTo(defender, destination);
				this.playTeleportAppear(displaceFrom, destination, defender);
			}
		}
		return damage;
	},

	/**
	 * T61 slice 7: the defender-side glyph/curse procs of a landed `attack()` - Stone,
	 * Displacement, Friendly, and the charm-ignore consumption. Verbatim move, except
	 * the Displacement teleport now reports `consumed` instead of returning out of
	 * `attack()` directly; the call site honors it at the same point.
	 */
	applyDefenderGlyphProcs(this: DungeonScene, attacker: Creature, defender: Creature, damage: number): { damage: number; consumed: boolean } {
		//`Stone.proc()` (`items/armor/glyphs/Stone.java`, tag `v3.3.8`): the glyph
		//grants no armor - it replays the to-hit math (attacker accuracy vs the
		//wearer's evasion) and turns 75% of the dodge chance into damage
		//reduction, `ceil(damage x hitChance)` clamped to [0.25, 1]. Runs here at
		//the landed-hit boundary; Java runs it in `defenseProc` pre-armor, the
		//same stated placement every other defend effect here already carries.
		if (defender.isHero && ((this.armorGlyphActive() && this.armorGlyph === 'stone') || this.trinityBodyGlyphIs('stone')) && damage > 0) {
			damage = Math.ceil(damage * stoneGlyphReduction(liveStats(attacker).accuracy, this.hero.evasion, this.armorProcMultiplier(defender)));
		}
		//Displacement.proc(): a 1-in-20 x arcana armor-curse proc teleports the defender
		//and replaces the incoming hit with zero damage.
		if (defender.isHero && this.armorGlyphActive() && this.armorGlyph === 'displacement' && Random.chance((1 / 20) * this.armorProcMultiplier(defender))) {
			const armorDisplaceFrom = { x: defender.x, y: defender.y };
			const destination = this.randomFreeCell(defender);
			if (destination) {
				this.moveTo(defender, destination);
				this.playTeleportAppear(armorDisplaceFrom, destination, defender);
				defender.sleeping = false;
				this.say(t('port.log.armordisplace'), 'warning');
				return { damage: 0, consumed: true };
			}
		}
		//Friendly.proc()/Charm.java (checked against tag v3.3.8): an already-charmed attacker
		//deals zero damage to the specific object recorded by Charm.object. On a fresh proc,
		//Friendly attaches Charm.DURATION (10) to the attacker and Charm.DURATION/2 (5) to the
		//defender, records each object's stable id, and makes the defender ignore its next hit.
		//The generic buff map stores only durations, so the two small payloads live in these
		//scene maps and are persisted with the run. This closes the former missing Friendly curse
		//without pretending Charm is a global, target-free stun.
		if (attacker === this.hero && this.weaponAffix === 'friendly') {
			if (this.isCharmedToward(attacker, defender)) damage = 0;
			if (Random.chance((1 / 10) * this.enchantProcMultiplier())) {
				addBuff(attacker, 'charm');
				this.charmTargets.set(attacker.id, defender.id);
				addBuff(defender, 'charm');
				this.charmTargets.set(defender.id, attacker.id);
				this.charmIgnoreNextHit.add(defender.id);
			}
		}
		//Charm.ignoreNextHit is consumed by the next landed hit against that char, before
		//damage absorption. It is deliberately separate from the attacker's object charm: Java
		//allows the two flags to coexist on opposite sides of the exchange.
		if (this.charmIgnoreNextHit.has(defender.id) && defender.buffs['charm'] !== undefined) {
			this.charmIgnoreNextHit.delete(defender.id);
			damage = 0;
		}
		return { damage, consumed: false };
	},

	/**
	 * T61 slice 8: the landed-hit prelude of `attack()` - the hit cue, the rogue
	 * surprise bonus, the Corrupting conversion, and the illuminated consume with
	 * Searing Light. Verbatim move; runs after the glyph seam, before the defender
	 * damage curves, exactly where it did inline.
	 */
	openLandedHit(this: DungeonScene, attacker: Creature, defender: Creature, surprise: boolean, damage: number): number {
		runState.audio.cue('hit', 0.6);
		if (attacker.isHero && this.heroClass === 'rogue' && surprise) {
			damage += (this.subclass() === 'assassin' ? 4 : 2) + assassinReachBonus(this.subclass(), this.talentRank('assassins_reach'));
			this.awardBadge('surprises');
		}
		//Corrupting.proc() is a weapon proc, so Java runs it in `attackProc()` - before
		//`enemy.damage()`, and therefore on the pre-`damage()`-override value. Its
		//`damage >= defender.HP` guard must see that value: a hit that only reaches lethal
		//after the defender's own curves cut it down (a Slime's 4+/5 soft cap) still counts
		//as lethal in Java. A lethal hit converts a living Mob instead of killing it - the
		//port's ally model already provides the permanent controlled actor shape, so keep
		//the target, fully heal it, clear negative buffs, and mark it as an ally.
		if (attacker === this.hero && (this.weaponAffix === 'corrupting' || this.unstableDelegated === 'corrupting') && damage >= defender.hp
			&& !defender.isHero && !defender.isNPC && !defender.isAlly && Random.chance(
			((Math.max(0, this.degradedLevel(this.weaponLevel)) + 5) / (Math.max(0, this.degradedLevel(this.weaponLevel)) + 25))
				* this.enchantProcMultiplier())) {
			defender.hp = defender.maxHp;
			for (const buff of NEGATIVE_BUFFS) delete defender.buffs[buff];
			defender.isAlly = true;
			defender.allyKind = 'mirror';
			defender.sleeping = false;
			damage = 0;
			this.say(t('port.log.corrupting', { target: defender.name }), 'positive');
		}
		//`Char.attack()`'s illuminated half (tag `v3.3.8`): any landed hit on an
		//illuminated enemy consumes the debuff - Java detaches in `attack()` before
		//damage resolution, so even a fully absorbed hit clears it, and so does this.
		//The Cleric hero's own melee hit additionally deals Searing Light's `1 + 2*points`,
		//placed before the defender curves below, where Java's pre-`defenseProc` add sits
		//relative to the `damage()` overrides. Two stated placement differences remain:
		//thrown hero hits bypass it (`MissileWeapon` never calls `Char.attack()` in Java,
		//hence the `attackMode` gate, the file's melee precedent), and Berserk/Fury do not
		//multiply it (they scale the roll upstream in `simulation/combat.ts`, where the
		//defender's illuminated state is not visible). The Priest ally strike needs the
		//subclass and stays unported.
		if (defender.buffs['illuminated'] !== undefined) {
			delete defender.buffs['illuminated'];
			if (attacker.isHero && attacker.attackMode !== 'throw' && this.heroClass === 'cleric') {
				const searing = this.talentRank('searing_light');
				if (searing > 0) damage += searingLightBonus(searing);
			}
		}
		return damage;
	},

	/**
	 * T61 slice 9: the post-curve defender absorbs of a landed `attack()` - the
	 * Endure counter, mob Earthroot armor, and the PhantomPiranha remote half.
	 * Verbatim move; runs after the defender curves, before the hero-defense block.
	 */
	applyPostCurveAbsorbs(this: DungeonScene, attacker: Creature, defender: Creature, damage: number): number {
		//`Char.attack()`'s "friendly endure": the hero's own banked counter-attack adds to each
		//landed hit until the tracker's `hitsLeft` runs out (`EndureTracker.damageFactor`). Java
		//adds it before the armor subtraction; this port's `damage` is already net of armor by this
		//point, so the bonus lands a little harder here than in Java - the same stated placement
		//difference as the reduction half. See `consumeEndureBonus`.
		if (attacker === this.hero && this.endureHits > 0 && damage > 0) damage = this.consumeEndureBonus(damage);
		//`Char.defenseProc()`'s `Earthroot.Armor` half for a mob defender: the pool absorbs
		//`min(damage, earthrootBlocking())` of every landed attack hit and detaches on
		//exhaustion or once its owner has left the grant cell (see `absorbEarthrootArmor`).
		//Java runs this pre-armor; this port's damage is already net of armor here, so a hit
		//burns a little less pool than Java's - the same stated placement as the hero's own
		//`absorbHeroDamage` half. It still runs before the defender damage curves below,
		//matching Java's absorb-before-`damage()` order, and wand zaps, bombs, DoTs and traps
		//never reach `attack()`, so they bypass the pool exactly as Java's direct `damage()`
		//calls bypass `defenseProc()`.
		if (!defender.isHero && defender.earthrootArmorLevel !== undefined) {
			const absorbed = absorbEarthrootArmor(defender.earthrootArmorLevel, damage,
				this.earthrootBlocking(), this.level.index(defender.x, defender.y) !== defender.earthrootArmorPos);
			if (absorbed.level === null) {
				delete defender.earthrootArmorLevel;
				delete defender.earthrootArmorPos;
			} else defender.earthrootArmorLevel = absorbed.level;
			damage = absorbed.damage;
		}
		// `PhantomPiranha.damage()` halves damage when its source is not adjacent;
		// this is after the attack's defense/curve work, matching Java's override
		// boundary, and it triggers the post-hit relocation while still alive.
		if (this.isPhantomRemoteHit(attacker, defender)) damage = Math.round(damage / 2);
		return damage;
	},

	isPhantomRemoteHit(this: DungeonScene, attacker: Creature, defender: Creature): boolean {
		return defender.kind === 'phantomPiranha'
			&& Roguelike.chebyshevDistance(defender, attacker) > 1;
	},

	/**
	 * T61 slice 10: the hero-defense block of a landed `attack()` - the Skeleton
	 * ward cut, ShieldOfLight, CapeOfThorns (with its retaliation tally), and the
	 * hero absorb chain. Verbatim move; the tally returns alongside the damage
	 * because the post-damage retaliation branch reads it.
	 */
	applyHeroDefense(this: DungeonScene, attacker: Creature, defender: Creature, damage: number): { damage: number; capeRetaliation: number } {
		let capeRetaliation = 0;
		if (defender.isHero) {
			//`Skeleton.attackProc()` (tag `v3.3.8`): a skeleton hitting a warded hero deals
			//2 less on top of the ward's own 1 (the non-Paladin "doubled" amount; the
			//Paladin's 6 needs the subclass). Placed pre-absorb, where Java's attackProc
			//sits relative to defenseProc.
			if (attacker.kind === 'skeleton' && damage > 0 && this.hero.buffs['holyWard'] !== undefined) {
				damage = Math.max(0, damage - 2);
			}
			//`Char.defenseProc()`'s ShieldOfLight half (tag `v3.3.8`): a hit from the
			//tracked enemy loses `NormalIntRange(min, 2*min)` (`min = 1 + points`),
			//clamped at zero. The tracker's enemy id rides `shieldOfLightTarget` -
			//the buff map holds durations only. Placed pre-absorb with the ward line,
			//where Java's pre-armor `defenseProc` sits relative to `damage()`.
			if (damage > 0 && this.hero.buffs['shieldOfLight'] !== undefined && this.hero.shieldOfLightTarget === attacker.id) {
				const [shieldMin, shieldMax] = shieldOfLightRange(this.talentRank('shield_of_light'));
				damage = Math.max(0, damage - Random.normalRange(shieldMin, shieldMax));
			}
			//`Hero.damage()`: `CapeOfThorns.Thorns.proc()` runs before `super.damage()` (the
			//`Char.damage()` shield-absorption/Tenacity/AntiMagic chain `absorbHeroDamage` models),
			//so the cape sees the raw incoming hit, not what shields already reduced it to.
			damage = applyCapeOfThornsProc({
				bag: this.bag,
				say: this.say.bind(this),
				onRetaliate: (deflected) => { capeRetaliation += deflected; },
			}, damage);
			damage = this.absorbHeroDamage(damage, false, true);
		}
		return { damage, capeRetaliation };
	},

	/**
	 * T61 slice 11: the boss soak pools and link splits of a landed `attack()` -
	 * Viscosity deferral, PowerOfMany taken, the LifeLink split both ways, the
	 * DKBarrier/statue/DM-300 pools. Verbatim move; a deferred hit or a lethal
	 * King share reports `finished` instead of returning out of `attack()` directly.
	 */
	applyBossSoaks(this: DungeonScene, defender: Creature, damage: number): { damage: number; finished: boolean } {
		//`DwarfKing.damage()` (phase 3) and `RustedFist.damage()` both bank every hit into the same
		//`Viscosity.DeferedDamage` pool the glyph uses instead of losing HP, paying it out on their
		//own turns. Checked here, before the linked-add split below, so the King's LifeLink share
		//is deferred the same way.
		//
		//These are `damage()` overrides and so are source-independent: `applyBlastDamage` carries the
		//same guards (Viscosity, DKBarrier, DM-300's barrier, the inactive-pylon refusal, plus the
		//fist overrides - Rotting conversion, Soiled grass cut, Bright/Dark half-HP) for bombs and
		//armor abilities, which never come through `attack()`. If one of them changes here, it
		//changes there too - the two copies exist because this tail also carries attack-only work
		//(LifeLink, the execute mechanics, Grim) that the shared seam must not run.
		if (this.deferMonsterDamage(defender, damage)) return { damage, finished: true };
		// `Char.damage()` (tag `v3.3.8`): PowerOfMany reduces damage taken by 25%, or
		// by `30% + 5% per LIFE_LINK rank` while the powered ally has that talent.
		// This scene seam represents the attack() path; every other source shares the
		// same reduction through `applyCharacterDamage` (R105).
		if (defender.buffs['powerOfMany'] !== undefined) {
			damage = Math.round(damage * powerOfManyDamageFactor(this.talentRank('life_link')));
		}
		//LifeLink (`Char.damage()`): the hit is divided `ceil(dmg / (links+1))` across
		//every live link partner, and each partner's share lands on it directly -
		//so damage to a linked subject splits onto the King AND damage to a linked
		//King splits onto every live subject (the old code halved add damage only,
		//leaving the King whole no matter how many servants bled for him). A subject
		//carries exactly one link (the King), hence /2 on this side; the King's
		//divisor counts his live subjects. Each share runs through the King's P2
		//shield below like any hit, and the King's P1 cooldowns accelerate off his
		//own share the way `damage()`'s `taken/8` does (the add-side swing below
		//never reaches the generic accel block, which measures the ADD's loss).
		//A share lethal to the King ends the swing here (boss-death transition owns
		//the rest).
		if (defender.kind !== 'king' && !defender.isHero) {
			const linkKing = this.creatures.find((c) => c.kind === 'king' && c.hp > 0 && this.kingLinkedAdds.has(defender));
			if (linkKing) {
				const share = Math.ceil(damage / 2);
				const kingPreHp = linkKing.hp;
				if (!this.deferMonsterDamage(linkKing, share)) {
					linkKing.hp -= share;
					this.lockedFloorBossDamage(linkKing, share, kingPreHp - linkKing.hp);
				}
				if ((linkKing.kingPhase ?? 1) === 1 && linkKing.hp > 0) {
					const taken = Math.max(0, kingPreHp - linkKing.hp);
					linkKing.kingSummonCd = (linkKing.kingSummonCd ?? 0) - taken / 8;
					linkKing.kingAbilityCd = (linkKing.kingAbilityCd ?? 0) - taken / 8;
				}
				if (linkKing.hp <= 0) {
					this.kill(linkKing);
					return { damage, finished: true };
				}
				damage = share;
			}
		}
		if (defender.kind === 'king' && defender.hp > 0) {
			const live = [...this.kingLinkedAdds].filter((s) => s.hp > 0);
			if (live.length > 0) {
				const share = Math.ceil(damage / (live.length + 1));
				for (const subject of live) {
					subject.hp -= share;
					if (subject.hp <= 0) this.kill(subject);
				}
				damage = share;
			}
		}
		//DKBarrier: the P2 shield pool absorbs before HP (no per-turn regen here - the
		//`incShield` half of `DKBarrior.act()` has no modeled trigger to hang it on).
		if (defender.kind === 'king' && (defender.kingShield ?? 0) > 0) {
			const absorbed = absorbShield(defender.kingShield ?? 0, damage);
			defender.kingShield = absorbed.shield;
			damage = absorbed.damage;
		}
		//`Blocking`'s `BlockBuff` on a statue absorbs before HP (a short-lived pool, see `takeStatueTurn`).
		if ((defender.blockShield ?? 0) > 0) {
			const absorbed = absorbShield(defender.blockShield ?? 0, damage);
			defender.blockShield = absorbed.shield;
			damage = absorbed.damage;
		}
		//DM300.move()/PylonEnergy: Barrier absorbs damage before HP while the boss is
		//charged. This is a compact boss-local pool; the generic hero Barrier path cannot
		//be reused because its decay and save state are hero-specific.
		if (defender.kind === 'dm300' && (defender.dmBarrier ?? 0) > 0) {
			const blocked = Math.min(defender.dmBarrier ?? 0, damage);
			defender.dmBarrier = (defender.dmBarrier ?? 0) - blocked;
			damage -= blocked;
		}
		return { damage, finished: false };
	},

	/**
	 * T61 slice 12: the executes and damage application of a landed `attack()` -
	 * Combined/Assassin lethality, the shield absorb, the HP write, the fade
	 * transitions, and Grim. Verbatim move; a fade reports `finished` instead of
	 * returning out of `attack()` directly, and the execute flag returns alongside
	 * the damage because the Brute-revive branch reads it far below.
	 */
	/**
	 * T61 slice 13: the boss post-damage hooks of a landed `attack()` - the DM-300
	 * supercharge edge, Tengu/Gnoll/Crystal/Yog hooks, and the fist half-HP edge.
	 * Verbatim move; every hook reads the same pre-hit HP the inline code did.
	 */
	runBossDamageHooks(this: DungeonScene, defender: Creature, preHp: number): void {
		//DM300.damage()/supercharge(): normal mode stops at HT/3 after the first phase and
		//HT*2/3 after the second; the Stronger Bosses challenge uses three HT/4 brackets.
		//The threshold is checked after all armor/proc damage but before death bookkeeping,
		//matching Java's HP floor and pylon activation edge.
		this.lockedFloorBossDamage(defender, preHp - defender.hp, preHp - defender.hp);
		if (defender.kind === 'dm300') {
			const activated = defender.dmPylonsActivated ?? 0;
			const threshold = isChallengeEnabled('stronger_bosses')
				? defender.maxHp / 4 * (3 - activated)
				: defender.maxHp / 3 * (2 - activated);
			if (!defender.dmSupercharged && threshold > 0 && defender.hp <= threshold) {
				defender.hp = threshold;
				this.dm300Supercharge(defender);
			}
		}
		if (defender.kind === 'tengu') this.clampTenguBracket(defender, preHp);
		this.gnollMineAfterDamage(defender, preHp);
		this.crystalMineAfterDamage(defender);
		//`BrightFist`/`DarkFist.damage()`'s half-HP edge (see `brightDarkHalfHp`): only Bright
		//costs the hero `daze` here - Dark's price is detaching the hero's Light, which this
		//port has no model for. Java's Blindness is a cosmetic screen darkening (a FlavourBuff
		//with no mechanical effect), so the port keeps its `daze` stand-in for Bright's half.
		this.brightDarkHalfHp(defender, preHp);
		if (defender.kind === 'yog' && defender.hp > 0) this.yogDamageHook(defender, preHp);
	},

	/**
	 * T61 slice 17: the death resolution of a landed `attack()` - the ghoul/king
	 * hooks, the Brute revival, cape retaliation, combo feed, the kill block,
	 * and the swarm split. Verbatim move; every path already returned true,
	 * so the seam returns the same boolean the call site returns.
	 */
	resolveAttackDeath(this: DungeonScene, attacker: Creature, defender: Creature, damage: number, preHp: number, heroExecuted: boolean, capeRetaliation: number): boolean {
			if (defender.hp <= 0 && defender.kind === 'ghoul') this.ghoulDown(defender);
			//DwarfKing P1: taken damage accelerates both cooldowns (`-= taken/8`).
			if (defender.kind === 'king' && (defender.kingPhase ?? 1) === 1 && defender.hp > 0) {
				const taken = Math.max(0, preHp - defender.hp);
				defender.kingSummonCd = (defender.kingSummonCd ?? 0) - taken / 8;
				defender.kingAbilityCd = (defender.kingAbilityCd ?? 0) - taken / 8;
			}
			//Phase transitions ride the damage event, not the King's next turn (see
			//`kingDamageHook`): accel first, then the transition, matching Java's order.
			if (defender.kind === 'king' && defender.hp > 0) this.kingDamageHook(defender);
			//Tengu bracket jumps resolve after the hit (procs included) but before death.
			if (defender.kind === 'tengu' && defender.hp > 0) this.tenguBracketJump(defender, preHp);

			//Brute.isAlive()/triggerEnrage(): the first time it would die, it survives instead with
			//a shield of HT/2+4 (`BruteRage.setShield`) - reproduced here by giving its hp field
			//that value directly rather than tracking a separate shield pool, so the existing
			//damage-application code drains it exactly like real hp would. `raged` then boosts its
			//own damage roll (`liveStats`) and drives the flat 4/turn passive decay in
			//`takeMonsterTurn`; only ever fires once (`hasRaged`), matching Java exactly.
			//`ArmoredBrute extends Brute` and overrides `triggerEnrage()` with its own smaller
			//shield (`HT/2+1`, not `+4`) that decays far slower (1 point every 3 turns via
			//`ArmoredRage.act()`'s own `spend(3*TICK)`, vs plain `BruteRage`'s 4/turn) - previously
			//this port's check here was `kind === 'brute'` literally, so ArmoredBrute (a real,
			//spawnable alternative monster kind) never got the revival at all and could simply be
			//killed outright, the exact bug this port's own `Brute` fix once corrected for the base
			//kind. `armoredRageTicks` starts the every-3rd-turn decay counter.
			if (defender.hp <= 0 && (defender.kind === 'brute' || defender.kind === 'armoredBrute') && !defender.hasRaged && !heroExecuted) {
				defender.hasRaged = true;
				defender.raged = true;
				if (defender.kind === 'armoredBrute') {
					defender.hp = Math.round(defender.maxHp / 2 + 1);
					defender.armoredRageTicks = 0;
				} else {
					defender.hp = Math.round(defender.maxHp / 2 + 4);
				}
				this.say(t('port.log.bruterage'), 'negative');
				return true;
			}

	        // Cape of Thorns returns the deflected amount to an adjacent attacker.
	        // Defer it until this resolver has finished reading the attacker, because the
	        // direct damage may kill and remove that creature from the scene.
	        if (capeRetaliation > 0 && attacker.hp > 0 && !attacker.isHero
	            && Roguelike.chebyshevDistance(attacker, defender) <= 1) {
	            this.applyBlastDamage(attacker, capeRetaliation, true, 'foe');
	        }
			//`Hero.actAttack()`/`doThrow()`: a landed hit on an enemy feeds the Gladiator's `Combo.hit()` (which also
			//reads whether that hit killed, hence after the brute-revival block). `Combo.doAttack` swings never do.
			if (attacker.isHero && !defender.isAlly && !this.comboSuppressHit) this.comboHit(defender);
			if (defender.hp <= 0) {
				//Mob.die()'s kill triggers gate on the *cause* (`hero || Weapon || Enchantment`),
				//so missile kills count too - `isHero` (true for the hero and its thrown-missile
				//copy alike) rather than the melee-only `attacker === this.hero` reference check.
				//Lethal Momentum's own chance (0.34+0.33/point: 2/3 at rank 1, certain at 2) was
				//already exact, only its trigger was narrowed to melee; fixed the same way here.
				//Endless Rage's old free-turn line is gone outright: real `ENDLESS_RAGE` only raises
				//the Berserk rage cap (`1+0.1667x` max power), which needs the rage gain/decay clock
				//this port doesn't model (see the Berserk row) - a free turn had no Java basis.
				if (attacker.isHero && this.heroClass === 'warrior' && this.talentRank('lethal_momentum') > 0 && Random.chance(this.talentRank('lethal_momentum') >= 2 ? 1 : 2 / 3)) this.freeTurnNext = true;
				if (attacker.isHero) this.lethalHasteOnKill();
				this.kill(defender);
				return true;
			}
			if (defender.kind === 'swarm') this.swarmSplit(defender, damage, preHp);
			return true;
	},
	runHitRiders(this: DungeonScene, attacker: Creature, defender: Creature, damage: number, charmedForTarget: boolean): void {
			if (attacker.statueEnchant) this.statueEnchantProc(attacker, defender, damage);
			//Weapon-ability riders staged by `useWeaponAbility`: heavy blow dazes 5 turns
			//(`ability_desc`: "dazes for 5 turns, reducing accuracy and evasion by 50%" - the
			//port's shared `daze`), harvest bleeds the stated fraction of the dealt damage, and
			//Spike knocks the target back (the port's straight shove; lunge only steps the hero - its descs mention no knockback). Consumed on the hit.
			//`Crossbow` melee with an armed charged shot knocks back 4 and disarms on the
			//hit, kill or not (`Crossbow.proc`, tag `v3.3.8` - no alive check there either).
			if (attacker === this.hero && this.chargedShotArmed && this.weaponMeleeKey() === 'crossbow') {
				const dx = Math.sign(defender.x - this.hero.x);
				const dy = Math.sign(defender.y - this.hero.y);
				for (let step = 0; step < 4; step++) {
					const next = { x: defender.x + dx, y: defender.y + dy };
					if ((dx === 0 && dy === 0) || !this.level.passable(next.x, next.y) || this.creatureAt(next.x, next.y)) break;
					this.moveTo(defender, next);
				}
				this.chargedShotArmed = false;
			}
			if (attacker === this.hero && defender.hp > 0) {
				if (this.abilityDazeNext) addBuff(defender, 'daze', 5);
				//Harvest replaces the strike's damage with its flat amount and applies that
				//same amount as bleeding (`Char.damage` with `HarvestBleedTracker`, tag
				//`v3.3.8`): `setBleeding` retains the strongest active bleed, matching
				//`Bleeding.set`. Consumed on the hit (a missed strike keeps it for the next
				//landed one - see the resolver).
				if (this.abilityHarvestNext > 0) {
					setBleeding(defender, this.abilityHarvestNext, 'harvestBleed');
					this.abilityHarvestNext = 0;
				}
				if (this.abilityKnockbackNext) {
					//`Glaive`/`Spear` spike knockback: the port's established straight shove
					//(see Heroic Leap above), one cell directly away from the hero.
					const dx = Math.sign(defender.x - this.hero.x);
					const dy = Math.sign(defender.y - this.hero.y);
					const next = { x: defender.x + dx, y: defender.y + dy };
					if ((dx !== 0 || dy !== 0) && this.level.passable(next.x, next.y) && !this.creatureAt(next.x, next.y)) {
						this.moveTo(defender, next);
					}
				}
			}
			this.abilityDazeNext = false;
			this.abilityKnockbackNext = false;
			//Charm.recover() spends five turns when the charmed actor reaches its
			//recorded object; preserve that shortens-on-contact behavior for both
			//Affection and Friendly charms.
			if (charmedForTarget && attacker.buffs.charm !== undefined) {
				attacker.buffs.charm -= 5;
				if (attacker.buffs.charm <= 0) {
					delete attacker.buffs.charm;
					this.charmTargets.delete(attacker.id);
				}
			}
			//Repulsion.proc() (items/armor/glyphs/Repulsion.java, tag 4.0.0-beta): an
			//adjacent attacker is pushed directly away from the armor wearer with
			//round(2 * max(1, (level+1)/(level+5) * Arcana)). The port has no Ballistica/
			//WandOfBlastWave primitive, so the equivalent existing straight shove is used;
			//it still stops at walls/occupants and lets moveTo apply flying/chasm and piranha
			//post-move rules. This is deliberately after damage, while Java's armor proc is
			//inside Char.damage(), because the observable result is the same hit plus displacement.
			if (defender.isHero && ((this.armorGlyphActive() && this.armorGlyph === 'repulsion') || this.trinityBodyGlyphIs('repulsion')) && attacker.hp > 0
				&& Roguelike.chebyshevDistance(attacker, defender) <= 1) {
				const level = this.degradedLevel(this.armorLevel);
				const procChance = ((level + 1) / (level + 5)) * this.armorProcMultiplier(defender);
				if (Random.chance(procChance)) {
					const power = Math.round(2 * Math.max(1, procChance));
					const dx = Math.sign(attacker.x - defender.x);
					const dy = Math.sign(attacker.y - defender.y);
					for (let step = 0; step < power; step++) {
						const next = { x: attacker.x + dx, y: attacker.y + dy };
						//a flying attacker may be shoved out over a pit (Java: `avoid`, not `passable`),
						//but not into a cell Java forced solid - see `canStepOnto`
						if ((!this.canStepOnto(next.x, next.y) && !(attacker.flying && this.isChasmCell(next.x, next.y))) || this.creatureAt(next.x, next.y)) break;
						this.moveTo(attacker, next);
						if (attacker.hp <= 0) break;
					}
				}
			}
			// CrystalMimic.attackProc(): after its crystal-chest reveal it repositions the
			// struck hero to a neighbouring free cell instead of dealing bonus damage.
			if (attacker.kind === 'crystalMimic' && defender.isHero && defender.hp > 0) {
				const candidates = Roguelike.neighbourOffsets(8)
					.map(([dx, dy]) => ({ x: defender.x + dx, y: defender.y + dy }))
					.filter((at) => this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y));
				const at = Random.element(candidates);
				if (at) {
					this.moveTo(this.hero, at);
					this.say(t('port.log.mimicdisplace'), 'warning');
				}
			}
	},
	runOnHitHooks(this: DungeonScene, attacker: Creature, defender: Creature, damage: number): void {
			//`MirrorImage.attackProc()` (tag `v3.3.8`): the image's own landed hits deal the
			//holy bonus while the hero's buff is up. Arcana reads 1.0 on an image (no rings),
			//so the `round(2 x multiplier)` is a flat 2; the later `hp <= 0` backstop credits
			//the kill, as with every other on-hit damage block.
			if (attacker.allyKind === 'mirror' && this.hero.buffs['holyWeapon'] !== undefined
				&& !defender.magicImmune && defender.hp > 0) {
				defender.hp -= HOLY_WEAPON_BONUS;
				this.showDamage(defender, HOLY_WEAPON_BONUS);
			}
			if (attacker.isHero) this.heroOnHit(attacker, defender, damage);
			else {
				this.mobOnHit(attacker, defender, damage);
				//`Hero.defenseProc()`: a blow that lands on a Berserker builds rage.
				if (defender === this.hero) this.rageOnDamage(damage);
				// ShockElemental.meleeProc (Elemental.java, tag v3.3.8) calls
				// Shocking.arc after the primary hit, then `ch.damage(round(dmg*0.4))`
				// per arc hit - `Char.damage` never rolls armor, so the arc pierces.
				// The planner reproduces Java's solid-cell radius recursion; each
				// returned hit uses the armor-piercing blast seam plus death.
				if (attacker.kind === 'elemental' && attacker.elementalType === 'shock') {
					const arc = planShockElementalArc(
						attacker.id,
						defender,
						damage,
						this.creatures,
						(origin) => this.pathfinder.distanceMap(origin),
						(x, y) => this.level.index(x, y),
						(x, y) => !this.level.passable(x, y),
						(target) => this.level.get(target.x, target.y) === WATER,
					);
					for (const targetId of arc.targetIds) {
						const target = this.creatures.find((creature) => creature.id === targetId);
						//`Char.Property.ELECTRIC` (`Char.java`, tag `v3.3.8`): the arc hits as
					//`Shocking`, so every holder takes the `Math.round` half of the 0.4x.
					if (target && target.hp > 0) this.applyBlastDamage(target,
						electricDamageHalved(target.kind, target.elementalType, target.yogFistType) ? Math.round(arc.damage / 2) : arc.damage,
						true, 'foe');
					}
				}
			}
	},
	presentLandedHit(this: DungeonScene, attacker: Creature, defender: Creature, surprise: boolean, subject: string, object: string, damage: number): void {
	 		// FrostImbue.proc(): a surviving enemy hit receives Chill for two turns. The compact
	 		// status model uses the same short-duration movement/turn lock as the closest Chill hook.
	 		if (attacker === this.hero && this.hero.buffs['frostImbue'] && defender.hp > 0 && !defender.isHero && !defender.isNPC && !buffBlocked(defender, 'cripple')) {
	 			defender.buffs['cripple'] = 2;
	 		}
	 		//`FireImbue.proc()` (`actors/buffs/FireImbue.java`, tag `v3.3.8`): a surviving enemy
	 		//hit reignites Burning on a 1-in-2 (`Buff.affect(enemy, Burning.class).reignite(enemy)`
	 		//- prolong, never a fresh overwrite - routed through the shared gate like every
	 		//other fire source, so the holder-immunity and kind refusals still apply).
	 		if (attacker === this.hero && this.hero.buffs['fireImbue'] && defender.hp > 0 && !defender.isHero && !defender.isNPC) {
	 			if (Random.int(2) === 0) reigniteBuff(defender, 'burning');
	 		}
			//Statue.damage() (Statue.java, tag v3.3.8): any damage flips PASSIVE to HUNTING.
			//ArmoredStatue inherits it unchanged, so both kinds wake here - previously only
			//`statue` did, leaving a struck armored statue asleep forever.
			if (defender.kind === 'statue' || defender.kind === 'armoredStatue') defender.sleeping = false;
			this.showDamage(defender, damage);
			//`Mob.defenseProc()` surprise presentation (`Mob.java`, tag `v3.3.8`): a
			//surprise hit plays `HIT_STRONG` and shows the red `Wound` slash when the
			//hero attacked with Preparation up, the `!` `Surprise` mark otherwise.
			if (surprise && attacker.isHero === true && !defender.isHero && !defender.isNPC) {
				this.showSurpriseMark(defender, attacker.prepLevel !== undefined);
			}
			if (defender.kind === 'demonSpawner') {
				defender.spawnCooldown = Math.max((defender.spawnCooldown ?? 60) - damage, -20);
			}
			defender.sleeping = false;
			//`Mob.defenseProc()` (tag v3.3.8): a mob hit by an enemy `aggro`s it and sets `target = enemy.pos`,
			//so it heads for where the blow came from even when the attacker is outside its field of view
			//(a thrown dart, a wand bolt from across the room). `lastSeen` is this port's hunt target; a mob
			//that still sees the hero refreshes it every turn anyway.
			if (attacker.isHero && !defender.isHero && !defender.isNPC && !defender.isAlly && !defender.fleeing) {
				defender.lastSeen = { x: attacker.x, y: attacker.y };
			}
			//Char.damage(): incoming damage detaches MagicalSleep before normal damage
			//resolution; the port's marker/paralysis pair is the equivalent state.
			if (defender.buffs['magicalSleep'] !== undefined) {
				delete defender.buffs['magicalSleep'];
				delete defender.buffs['paralysis'];
			}
			this.sprite(defender).setColorAdd(1, 1, 1);
			//the one log line whose severity depends on which way the blow went: SPD colours
			//damage the hero takes red and leaves the hero's own hits plain
			this.say(
				t('port.log.hit', { subject, verb: t(attacker.isHero ? 'port.log.verb.hithero' : 'port.log.verb.hit'), object, damage }),
				defender.isHero ? 'negative' : 'info'
			);
	},
	applyExecutesAndDamage(this: DungeonScene, attacker: Creature, defender: Creature, phantomRemote: boolean, damage: number): { damage: number; heroExecuted: boolean; finished: boolean } {
			//The execute mechanics are Java's last step in `attack()`: they run after
			//`enemy.damage()` has applied everything above - the `damage()` overrides (including
			//`SoiledFist`'s grass reduction just above), the shield pools, and the HP bookkeeping -
			//and they set the target's HP to zero outright rather than routing a damage value
			//through steps that could still reduce it. The `defender.hp - damage > 0` guard mirrors
			//Java's own `enemy.isAlive()` check after `damage()` returned: a hit that already kills
			//does not also report an execution.
			//
			//Java's two mechanics are now both real. `Preparation.canKO` (`Char.java` 524-539) fires
			//only while the attacker's Preparation buff is up - i.e. only out of invisibility - and
			//tests the target's HP against `AttackLevel.KOThreshold()`'s table, indexed by the level
			//reached (1/3/5/9 turns invisible) and the `enhanced_lethality` rank, with a strict `<`
			//and one fifth of the threshold for a `BOSS`/`MINIBOSS`. `CombinedLethality`
			//(`Char.java` 541-561) excludes those two properties outright and uses
			//`<= 0.4*points/3`. Both mechanics test
			//the HP the hit actually leaves: every reduction above (curves, shields, pools, the
			//grass cut) lands in `damage` before this point, so `defender.hp - damage` is what the
			//`defender.hp -= damage` below writes - there is no pre-shield prediction here. Both
			//also require the hit to have left the target alive (`predictedHp > 0`, Java's own
			//`enemy.isAlive()` check after `damage()` returned): a hit that already kills reports
			//the kill below, not an execution.
			//
			//`CombinedLethality`'s arming gate is Java's own too (`Char.java` 541-542): the
			//tracker's weapon must differ from the attacking weapon (`!=`, instance identity),
			//the attacker must be the hero, and the attacking weapon a `MeleeWeapon`. The port
			//reads that as: a live tracker, a hero melee swing (never a throw - bow shots and
			//thrown hits never reach this method anyway), a wielded weapon (never the unarmed
			//`startingWeapon`), and an instance id (falling back to the bag id) that is not the
			//stored one. `enemy.alignment != alignment` is the `!defender.isAlly` below (every
			//hero-targetable creature here is hostile - the ability and throw aimers refuse
			//allies outright - so the only theoretical miss is Java's NEUTRAL sheep, which
			//this port spawns as an ally). The tracker detaches unconditionally once the gate
			//holds, whether or not the threshold fired - Java's `combinedLethality.detach()`.
			//An executed Brute must not revive (`Char.java` detaches `BruteRage` first on
			//every hero execute path): `heroExecuted` suppresses this method's own revival
			//branch below, fixed 2026-09-21 to also cover the Assassin KO half.
			const predictedHp = defender.hp - damage;
			const clStoredWeapon = this.clAbilityWeaponInstanceId ?? this.clAbilityWeaponClass;
			const clSwingWeapon = this.weaponInstanceId ?? this.weaponId;
			//`attackingWeapon() instanceof MeleeWeapon`: a hero melee swing with a wielded
			//weapon (never a throw - bow shots and thrown hits never reach this method
			//anyway - and never the unarmed `startingWeapon`).
			const clResult = combinedLethalityTest({
				trackerTurns: this.clAbilityTurns,
				storedWeapon: clStoredWeapon,
				swingWeapon: clSwingWeapon,
				isHeroMelee: attacker === this.hero && attacker.attackMode !== 'throw' && this.weaponId !== 'startingWeapon',
				targetIsAlly: defender.isAlly === true,
				targetIsBossOrMiniboss: defender.boss === true || defender.miniboss === true,
				talentPoints: this.talentRank('combined_lethality'),
				predictedHp,
				targetMaxHp: defender.maxHp,
			});
			const clGate = clResult.tests;
			const combinedLethality = clResult.executes;
			const assassinLethality = attacker.prepLevel !== undefined && predictedHp > 0 && preparationCanKo(
				predictedHp, defender.maxHp, attacker.prepLevel,
				this.subclass() === 'assassin' ? this.talentRank('enhanced_lethality') : 0,
				defender.boss === true || defender.miniboss === true,
			);
			if (attacker === this.hero && (combinedLethality || assassinLethality)) {
				damage = defender.hp;
				this.say(t('port.log.talentexecute'), 'positive');
			}
			//`Char.hit()` (tag `v3.3.8`) runs the identical `enemy.HP = 0` +
			//`enemy.buff(Brute.BruteRage.class).detach()` block for both the Assassin's
			//Preparation KO (line 523-537) and Combined Lethality (line 540-554) executes -
			//a forced kill must stick even against a Brute/ArmoredBrute's revive-with-shield,
			//not just the Combined Lethality half this port used to suppress it for alone.
			const heroExecuted = attacker === this.hero && (combinedLethality || assassinLethality);
			if (clGate) {
				this.clAbilityTurns = 0;
				this.clAbilityWeaponClass = null;
				this.clAbilityWeaponInstanceId = undefined;
			}
			damage = absorbCreatureShields(defender, damage, this.ascendedTurns > 0);
			defender.hp -= damage;
			if (phantomRemote && defender.hp > 0) this.phantomPiranhaTeleport(defender, attacker);
			if (this.fadeMirrorOnDamage(defender, damage)) {
				return { damage, heroExecuted, finished: true };
			}
			if (this.enterPrismaticFade(defender, damage)) {
				return { damage, heroExecuted, finished: true };
			}
			//`Grim.proc()`/`Char.damage()` + `GrimTracker` (tag v3.3.8): the enchant arms
			//after the hit, then rolls against `(0.5 + .05*buffedWeaponLevel) * Arcana`
			//scaled by the square of the defender's missing-HP fraction. A successful roll
			//deals `round(currentHP)` extra damage, so it can finish a target immediately.
			//The old port used a flat 15%/15-damage post-hit stand-in in `heroOnHit`; doing
			//this at the central damage boundary preserves the real pre-death ordering and
			//also handles Unstable's delegated Grim effect.
			//`Grim` is one of `AntiMagic.RESISTS`' listed enchant classes: `Char.damage()` zeroes any
			//hit whose source class is in that set for a MagicImmune defender (an AntiMagic champion),
			//so the proc's bonus execute damage must not apply to one either.
			//`Grim.proc()` returns early when the defender `isImmune(Grim.class)` (`Grim.java`, tag
			//`v3.3.8`), and `Char.Property.BOSS` lists `Grim` in its immunities (`Char.java:1364`) -
			//so bosses never suffer the execute (minibosses carry `MINIBOSS`, whose sets are empty,
			//and stay eligible). The execute itself is `round(HP*resist(Grim.class))`
			//(`Char.damage()`, tag `v3.3.8`), and `Statue` lists `Grim` in its resistances
			//(`Statue.java`, tag `v3.3.8` - inherited by `ArmoredStatue`), each halving it - so a
			//statue takes half the execute, not the full `round(currentHP)`.
			if (attacker === this.hero && (this.weaponAffix === 'grim' || this.unstableDelegated === 'grim') && defender.hp > 0 && !defender.magicImmune && defender.boss !== true) {
				const level = Math.max(0, this.degradedLevel(this.weaponLevel));
				const maxChance = (0.5 + 0.05 * level) * this.enchantProcMultiplier();
				const missingFraction = (defender.maxHp - defender.hp) / defender.maxHp;
				if (Random.chance(maxChance * missingFraction * missingFraction)) {
					const resisted = defender.kind === 'statue' || defender.kind === 'armoredStatue';
					const extra = resisted ? Math.round(defender.hp * 0.5) : Math.round(defender.hp);
					defender.hp -= extra;
					damage += extra;
				}
			}
		return { damage, heroExecuted, finished: false };
	},
};
