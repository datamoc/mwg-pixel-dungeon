import type { DungeonScene } from '../dungeonScene';
import { noteMonsterAttack } from './monsters/monsterSpeed';
import { faceCharacter, placeCharacterArt } from '../../ui/characterPlacement';
import { AnimatedSprite, Random, Roguelike, SpriteSheet } from 'mwg';
import { preparationCanKo } from '../../simulation/preparation';
import { planHiddenMimicContact } from '../../simulation/hiddenMimicContact';
import { planShockElementalArc } from '../../simulation/shockArc';
import { applyDefenderDamageCurves } from '../../simulation/defenderDamageCurves';
import { UNSTABLE_DELEGATES } from '../../items/itemAffixes';
import { ringArcanaMultiplier, ringForceBonus, ringTenacityMultiplier } from '../../items/ringModifiers';
import { HOLY_WARD_BLOCK, HOLY_WEAPON_BONUS, auraProcBonus, auraProtectedDamage, satiatedShieldAmount, searingLightBonus, shieldOfLightRange } from '../../simulation/clericSpells';
import { capitalize, has, t } from '../../i18n/index';
import { assassinReachBonus, cleaveComboSeed, deathlessFuryTriggers, empoweredStrikeBonus, farsightMultiplier, shieldBatteryGain, weaponRechargingDamage } from '../../talentEffects';
import { Terrain, type PaintLevel } from '../../spdLevelGen/paintLevel';
import { runState } from '../../runState';
import { isChallengeEnabled } from '../../challenges';
import { spiritHawkDodges } from '../../simulation/huntressAbilities';
import { combinedLethalityTest, exposeWeaknessDuration, feignedRetreatHaste } from '../../simulation/duelistAbilities';
import { mobOnHit } from '../mobOnHit';
import { absorbEarthrootArmor } from '../../simulation/plantPools';
import { getCurse } from '../../items/itemCurses';
import { applyCapeOfThornsProc } from '../../items/artifactActions';
import { canSurpriseAttack, weaponSTRReq } from '../../items/strReq';
import { EMBERS, FLOOR, GRASS, HIGH_GRASS, VIEW_RADIUS, WATER } from '../../dungeonConstants';
import { BUFF_DURATION, INFINITE_ACCURACY, INFINITE_EVASION, NEGATIVE_BUFFS, absorbShield, addBuff, applyElementalBacklash, buffBlocked, electricDamageHalved, reigniteBuff, rollDamage, rollHit, setBleeding, stoneGlyphReduction, type Creature } from '../../combat';
import { absorbCreatureShields } from '../../simulation/allyShields';
import { liveStats, IMMOVABLE_KINDS } from '../../monsters';
import { imageSuperDefenseSkill } from '../../simulation/mirrorImage';
import { POWER_OF_MANY_ATTACK_FACTOR, powerOfManyDamageFactor } from '../../simulation/clericSpells';

/** DungeonScene methods, moved verbatim from `dungeonScene.ts` (group `combatResolution`). Each takes the scene as `this`;
 * `dungeonScene.ts` merges them back onto the class prototype. */
export const combatResolutionMethods = {
	/** `PhantomPiranha.damage()` (tag `v3.3.8`): a remote hit is halved before
	 * `super.damage()`, then the fish relocates to water. The scene owns the
	 * occupancy/FOV and teleport presentation seams, so the small adapter lives here. */
	phantomPiranhaTeleport(this: DungeonScene, fish: Creature, source?: Creature): void {
		const from = { x: fish.x, y: fish.y };
		const near = Roguelike.neighbourOffsets(8)
			.map(([dx, dy]) => ({ x: (source?.x ?? -1) + dx, y: (source?.y ?? -1) + dy }))
			.filter((cell) => this.level.get(cell.x, cell.y) === WATER
				&& this.level.passable(cell.x, cell.y) && !this.creatureAt(cell.x, cell.y));
		const allWater: { x: number; y: number }[] = [];
		for (let y = 1; y < this.level.height - 1; y++) for (let x = 1; x < this.level.width - 1; x++) {
			if (this.level.get(x, y) === WATER && this.level.passable(x, y) && !this.creatureAt(x, y)) allWater.push({ x, y });
		}
		const unseen = allWater.filter((cell) => !this.fov.isVisible(cell.x, cell.y));
		const destination = Random.element(near.length > 0 ? near : (unseen.length > 0 ? unseen : allWater));
		if (!destination) return;
		this.moveTo(fish, destination);
		this.playTeleportAppear(from, destination, fish);
		if (source?.isHero) fish.seesHero = true;
	},

	/** Java's `PhantomPiranha.damage()` still halves and relocates when a bomb/blob-like
	 * source reaches `Char.damage()` without a `Char` attacker. The source-less branch chooses
	 * unseen water; the direct seams below use it because their source object is not retained. */
	phantomPiranhaDamage(this: DungeonScene, target: Creature, amount: number): number {
		return target.kind === 'phantomPiranha' ? Math.round(amount / 2) : amount;
	},

	/**
	 * Melee (or missile) exchange with Java's own on-hit hooks: surprise attacks land
	 * automatically (INFINITE_ACCURACY, inside rollHit) and wake the victim; Rogue's
	 * SUCKER_PUNCH adds +2 on a surprise hit (+4 as an Assassin); Bat.attackProc heals
	 * min(damage-4, missing); Thief.attackProc steals once, then flees; FetidRat oozes
	 * (1/3 poison); GnollTrickster escalates; Monk Focus dodges once per charge; Eye's
	 * gaze triples every third hit; Succubus charms (daze) and feeds; Scorpio cripples;
	 * Warlock degrades; weapon enchants and Thorns fire; Blazing champions ignite; Swarm
	 * splits (numbers verbatim); Fury kindles below half HP.
	 */
	attack(this: DungeonScene, attacker: Creature, defender: Creature, accFactor = 1, damageMultiplier = 1): boolean {
		if (attacker.isHero) this.cancelHourglassFreeze();
		else noteMonsterAttack(attacker);
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
		//`Preparation` must be read *before* this dispel: Java reads it into a local at the top of
		//`Char.attack()` and only calls `Invisibility.dispel()` after the whole attack returns
		//(`Hero.java` 2325), so the stealth state still applies to this attack's damage roll and
		//its assassinate check. `syncPreparation` mirrors the live invisibility state onto the
		//attacker's combat data, which is what `rollDamage` reads - and that mirror is deliberately
		//*not* cleared here, because both readers come later in this function. Every attack
		//re-syncs at this point, so a dispelled invisibility still ends the state for the next one.
		this.syncPreparation();
		//`Char.attack()` 407-409: a *prepared* hero attack with the Bounty Hunter talent arms its
		//tracker, which is what lets `Mob.lootChance()` raise the drop chance for anything this same
		//attack kills. Arming happens only on this path - an ordinary attack never sets it.
		if (attacker === this.hero && this.hero.prepLevel !== undefined && this.talentRank('bounty_hunter') > 0) {
			this.bountyTrackerArmed = true;
		}
		//`Sheep` is a neutral NPC in Java: it cannot be damaged or selected as a hostile target.
		//The port stores it as an ally only so the shared scheduler/render/save path can carry it.
		if (defender.allyKind === 'sheep') return false;
		const subject = attacker.isHero ? t('port.log.subject.you') : capitalize(attacker.name);
		//Was a hardcoded English literal 'you', bypassing translation entirely - a real i18n
		//bug that showed untranslated "you" in every non-English combat log line (found while
		//verifying the Spanish locale, but it predates that work and affects French/German too).
		//A separate object-form key (not `port.log.subject.you`) is needed here: the subject
		//pronoun is capitalized and nominative ("You"/"Vous"/"Du"/"TÃº"), which is wrong both in
		//capitalization (mid-sentence) and case (German accusative "dich", Spanish's "a ti") for
		//an object position.
		const object = defender.isHero ? t('port.log.object.you') : defender.name;
		//Keep the hidden-Mimic reveal/counterattack decision pure; this scene owns only the
		//reveal presentation and the recursive attack that executes the returned plan.
		const mimicContact = planHiddenMimicContact({
			kind: defender.kind,
			mimicRevealed: defender.mimicRevealed,
			attackerIsHero: attacker.isHero === true,
			attackMode: attacker.attackMode,
			adjacent: Roguelike.chebyshevDistance(attacker, defender) <= 1,
			invisible: Boolean(attacker.buffs['invisibility']),
			timeStopped: this.timeBubbleTurns > 0,
			depth: this.depth,
		});
		const revealMimic = () => {
			if (mimicContact.reveal === 'crystal') this.revealCrystalMimic(defender);
			if (mimicContact.reveal === 'chest') this.revealMimic(defender);
		};
		if (mimicContact.revealWhen === 'beforeAttack') revealMimic();
		if (mimicContact.counterattack) {
			const original = { accuracy: defender.accuracy, damage: defender.damage };
			defender.accuracy = INFINITE_ACCURACY;
			defender.damage = [mimicContact.counterDamage, mimicContact.counterDamage];
			try { this.attack(defender, attacker); } finally { defender.accuracy = original.accuracy; defender.damage = original.damage; }
		}
		if (mimicContact.cancelHeroAttack) return false;
		// Mob.surprisedBy() is not limited to sleeping enemies: it also succeeds when the
		// target did not see the hero on its most recent turn. In particular, its FOV is
		// sampled before a chase step, so striking a snake immediately after it enters a
		// doorway is a guaranteed hit. The attacking half is `Hero.canSurpriseAttack()`
		// in full: thrown attacks read the missile (a flail in the melee slot no longer
		// vetoes a thrown surprise), unarmed qualifies, and a swung weapon needs both
		// the STR (`STR() < STRReq()` fails) and a non-flail class - the STR clause used
		// to always pass here, before the shop STR line gave this port a real requirement
		// system to read. Surprise stays hero-only (`surprisedBy` needs the attacker to be
		// the hero), and invisibility is read before `Invisibility.dispel()`, which Java
		// runs only after the whole attack resolves.
		const thrown = attacker.attackMode === 'throw';
		const attackerIsFlail = attacker.isHero === true && !thrown
			&& (this.weaponSourceClass ?? this.weaponId).toLowerCase().includes('flail');
		const gate = canSurpriseAttack({
			thrown,
			unarmed: attacker.isHero === true && this.weaponId === 'startingWeapon',
			flail: attackerIsFlail,
			heroStr: this.hero.str ?? 0,
			weaponTier: this.weaponTier,
			weaponLevel: this.weaponLevel,
		});
		//`Crossbow.ChargedShot`: the next fired dart always hits (consumed in the throw
		//branch below, which also spreads the on-hit effects over the 5x5 area).
		const chargedShotHit = attacker.attackMode === 'throw' && this.chargedShotArmed;
		//`DwarfKing.damage()` 459-467: an unarmed hit without `RingOfForce.fightingUnarmed`
		//clears the boss-challenge flag (a weapon hit keeps it; thrown hits keep it too).
		if (attacker.isHero && attacker.attackMode !== 'throw' && this.weaponId === 'startingWeapon'
			&& this.equippedRing?.id !== 'ring_force') {
			this.disqualifyBossChallenge(defender);
		}
		const surprise = attacker.isHero === true && gate
			&& (defender.sleeping === true || (!defender.isHero && !defender.seesHero) || attacker.buffs['invisibility'] !== undefined);
		// Invisibility is dispelled by an aggressive action (Invisibility.dispel()).
		if (attacker.buffs['invisibility']) delete attacker.buffs['invisibility'];
		//A spinning flail is guaranteed to hit while spinning (`ability_desc`); a charged
		//shot always hits. Both ride the surprise channel (`INFINITE_ACCURACY` inside
		//`rollHit`), which is exactly "guaranteed to hit" with no other change.
		const forceHit = chargedShotHit || (attacker === this.hero && this.spinSpins > 0) || this.abilityForceHit
			//`Crossbow.proc`: a melee swing with an armed shot never misses either.
			|| (attacker === this.hero && attacker.attackMode !== 'throw' && this.chargedShotArmed && this.weaponMeleeKey() === 'crossbow')
			//`Mob.defenseSkill()` (tag `v3.3.8`): an illuminated mob defends at 0 against
			//the Cleric's STR-sufficient physical attacks and against any non-hero attacker
			//(Java's `else return 0`) - GuidingLight's own guaranteed hit. Thrown hero
			//copies ride it too: throws resolve through this same `attack()`.
			|| (defender.buffs['illuminated'] !== undefined && this.clericIlluminatedHit(defender, attacker));
		//Monk Focus: the first attack against a focused monk always misses and spends the
		//focus (re-earned over ~6 of its own turns via combo in takeMonsterTurn). `Senior
		//extends Monk` and shares this unchanged - previously excluded here too by the same
		//literal-kind-check bug, so a Senior's Focus buff (granted at spawn, and regained via
		//the `takeMonsterTurn` fix above) never actually did anything defensively.
		if ((defender.kind === 'monk' || defender.kind === 'senior') && defender.buffs['focus']) {
			delete defender.buffs['focus'];
			//Monk.defenseVerb(): a parry starts a fresh NormalFloat(6,7) cooldown;
			//Senior inherits this and only differs in its movement reduction.
			defender.focusCooldown = Random.float(6, 7);
			defender.sleeping = false;
			this.say(t(attacker.isHero ? 'port.log.monkdodgehero' : 'port.log.monkdodge', { subject, object }), 'negative');
			return false;
		}
		//YogDzewa is invulnerable while any fist lives - the whole point of the gates.
		//Routed through the shared gate (see `yogShielded`) so bombs, DoT, traps and gas
		//below honor it exactly the way `Char.damage()` does for every source.
		if (defender.kind === 'yog' && this.yogShielded(defender)) {
			defender.sleeping = false;
			this.say(t('port.log.yogshielded'), 'negative');
			return false;
		}
		//YogFist proximity guard (see `guardFist`) - same central-choke treatment.
		if (defender.kind === 'yogFist' && this.guardFist(defender)) {
			defender.sleeping = false;
			return false;
		}
		//Pylon.isInvulnerable(): a neutral pylon cannot be damaged until the DM-300 gate
		//activates it. Active-pylon damage reduction is applied below before procs/death.
		if (defender.kind === 'pylon' && !defender.pylonActive) {
			defender.sleeping = false;
			return false;
		}
		//DM300.isInvulnerable(): a supercharged boss ignores every incoming effect until
		//an active pylon is destroyed. The Java class checks this centrally, so this gate
		//also covers melee, thrown, wand, bomb, DoT, and environmental damage routed here.
		if (defender.kind === 'dm300' && defender.dmSupercharged) {
			defender.sleeping = false;
			this.say(t('port.log.dm300overcharge'), 'negative');
			return false;
		}
		//`GnollGeomancer.isInvulnerable()`: rock-armoured (the pickaxe aside) or sapper-linked.
		if (this.gnollMineInvulnerable(defender)) return false;
		//`CrystalSpire`/a crumpled `CrystalGuardian`'s `isInvulnerable()` (`crystalMine.ts`).
		if (this.crystalMineInvulnerable(defender, attacker)) return false;

		//No `SPIRIT_BLADES` damage line here: Java's rank-4 `multi += 0.1f` lives in
		//`Weapon.Enchantment.genericProcChanceMultiplier()` - an enchant *proc-chance* term,
		//not damage - and it is unreachable in practice: at rank 4 the tracker's own
		//`Random.Int(10) < 12` roll always consumes it inside `Talent.onAttackProc` before
		//`wep.proc()` (and its chance rolls) ever runs. What stood here was a port-invented
		//`x1.1` damage bonus with no Java basis, found in the 27th matrix audit.
		//`Feint.AfterImage.defenseSkill()`: `defenseSkill == 0` in Java means the decoy is never
		//actually evaded, but the getter's real job is the side effect that runs on *every* call -
		//i.e. on every attack attempt against it, hit or miss alike, since Java queries
		//`defenseSkill()` once per attack as part of the to-hit roll itself. This port has no
		//equivalent getter to piggyback on, so the trigger is placed here instead - ahead of the
		//real roll, exactly like `SpiritHawk`'s dodge gate just below - which means it always
		//fires and the roll never runs at all (a documented reduction from "fires on every
		//attempt, then usually still connects for zero effective damage" to "fires and the
		//attempt itself never resolves"; the observable result - the decoy is never scratched -
		//is the same either way). `enemy.clearEnemy()` has no analog: this port's mobs hold no
		//persistent enemy pointer to drop (target is recomputed from field of view every turn),
		//so there is nothing to clear.
		if (defender.allyKind === 'afterImage') {
			if (!attacker.isHero && !attacker.isAlly && !attacker.isNPC) {
				addBuff(attacker, 'feintConfusion');
				const feignedRetreat = this.talentRank('feigned_retreat');
				if (feignedRetreat > 0) {
					this.hero.buffs['haste'] = Math.max(this.hero.buffs['haste'] ?? 0, feignedRetreatHaste(feignedRetreat));
				}
				const exposeWeakness = this.talentRank('expose_weakness');
				if (exposeWeakness > 0) {
					const duration = exposeWeaknessDuration(exposeWeakness);
					addBuff(attacker, 'vulnerable', Math.max(attacker.buffs['vulnerable'] ?? 0, duration));
					addBuff(attacker, 'weakness', Math.max(attacker.buffs['weakness'] ?? 0, duration));
				}
				if (this.talentRank('counter_ability') > 0) this.hero.buffs['counterAbility'] = BUFF_DURATION.counterAbility;
			}
			runState.audio.cue('miss', 0.55);
			defender.sleeping = false;
			this.say(t(attacker.isHero ? 'port.log.misshero' : 'port.log.miss', { subject, object }), 'negative');
			return false;
		}
		//`SpiritHawk.HawkAlly.defenseSkill()`: with `SWIFT_SPIRIT` ranked the hawk outright dodges
		//its first `2 * points` attackers (`Char.INFINITE_EVASION`), one dodge per attack. Java
		//reaches this through `Char.hit()`'s own short-circuit, so the attack simply misses - the
		//damage and on-hit effects never run - and the miss is presented like any other.
		if (defender.allyKind === 'spiritHawk' && (defender.spiritHawkDodges ?? 0) > 0) {
			defender.spiritHawkDodges = (defender.spiritHawkDodges ?? 0) - 1;
			runState.audio.cue('miss', 0.55);
			defender.sleeping = false;
			this.say(t(attacker.isHero ? 'port.log.misshero' : 'port.log.miss', { subject, object }), 'negative');
			return false;
		}
		//`Dagger`/`Dirk`/`AssassinsBlade` surprise passive (`damageRoll`, tag `v3.3.8`):
		//a surprised enemy is rolled from `min+round(diff*3/4|2/3|1/2)` to max instead
		//of min to max (75%/67%/50%). The framework owns the roll over `hero.damage`,
		//so the range is narrowed around the synchronous resolution and restored after
		//(melee only - thrown daggers roll missile damage, never this).
		const daggerSurpriseFrac = attacker === this.hero && attacker.attackMode !== 'throw' && surprise
			? { dagger: 0.75, dirk: 0.67, assassinsblade: 0.5 }[this.weaponMeleeKey()] ?? 0
			: 0;
		const heroDamageBefore = this.hero.damage;
		if (daggerSurpriseFrac > 0) {
			const [lo, hi] = this.hero.damage;
			this.hero.damage = [lo + Math.round((hi - lo) * daggerSurpriseFrac), hi];
		}
		// `Mob.defenseSkill(enemy)` (tag `v3.3.8`) is queried at attack time, not only
		// when an image takes its own turn. Apply its 0/1 result to the live image before
		// the shared hit roll, then restore the scene creature immediately afterward.
		const imageEvasion = defender.allyKind === 'mirror' || defender.allyKind === 'prismatic'
			? defender.evasion
			: undefined;
		if (imageEvasion !== undefined && imageSuperDefenseSkill({
			surprised: surprise,
			paralysed: defender.buffs['paralysis'] !== undefined,
			illuminated: defender.buffs['illuminated'] !== undefined,
			heroIsCleric: this.heroClass === 'cleric',
			attackerIsHero: attacker.isHero === true,
			// Ordinary monster records have no weapon STR state; this is immaterial because
			// their illumination branch is already zero and hero-facing images are zero too.
			attackerWeaponStrOk: false,
		}) === 0) defender.evasion = 0;
		let attackRoll;
		try {
			attackRoll = this.resolveHeroAbilityAttack(attacker, defender, surprise || forceHit, accFactor, damageMultiplier);
		} finally {
			if (imageEvasion !== undefined) defender.evasion = imageEvasion;
			if (daggerSurpriseFrac > 0) this.hero.damage = heroDamageBefore;
		}
		if (!attackRoll.hit) {
			runState.audio.cue('miss', 0.55);
			defender.sleeping = false;
			this.say(t(attacker.isHero ? 'port.log.misshero' : 'port.log.miss', { subject, object }), 'negative');
			return false;
		}
		//Java's `Mimic.defenseProc()` reveals ordinary hits here; do not reveal on a miss.
		if (mimicContact.revealWhen === 'onHit') revealMimic();

		let damage = attackRoll.damage;
		// `Char.attack()` (tag `v3.3.8`): a PowerOfMany-powered ally deals 1.25x melee
		// damage. The multiplier applies on the ordinary attack() exchange here.
		if (attacker.isAlly && attacker.buffs['powerOfMany'] !== undefined) {
			damage = Math.round(damage * POWER_OF_MANY_ATTACK_FACTOR);
		}
		//Charm.recover()/Charm.object: an actor charmed toward this specific target
		//does not harm it. This also makes Affection's armor-glyph charm usable by
		//ordinary monsters, not only by the already-portable Friendly weapon path.
		const charmedForTarget = attacker.buffs['charm'] !== undefined && this.charmTargets.get(attacker.id) === defender.id;
		if (charmedForTarget) damage = 0;
		//`Char.damage()` negates through `isInvulnerable()`, which a
		//`Challenge.SpectatorFreeze` carries - frozen spectators take no attack
		//damage, same zeroing shape as the charm line above. Bomb/trap/blast seams
		//apply the same guard at their own `damage()` boundaries; DoTs are negated
		//at the mob tick.
		if (defender.buffs['spectatorFreeze'] !== undefined) damage = 0;
		//No `Pylon` curve here: it is a `damage()` override, so it applies after every multiplier
		//and proc below, not before them - see `applyDefenderDamageCurves`' own note.
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
		//real). `ArtifactRecharge` counts too in Java; no such buff exists here yet. Gate
		//note, read before "fixing": both tags gate the Java line on `heroClass != DUELIST`
		//- unsatisfiable alongside class-locked talents, so the port follows the evident
		//intent (the talent-holding class) rather than the literal gate.
		if (attacker === this.hero && this.talentRank('weapon_recharging') > 0 && this.hero.buffs['recharging']) {
			damage = weaponRechargingDamage(damage, this.talentRank('weapon_recharging'));
		}
		//RingOfForce.armedDamageBonus(): flat +level on any armed (non-missile) melee hit -
		//`Hero.damageRoll()` gates this on `wep instanceof MissileWeapon`, which this port already
		//expresses the same way every other hero-only bonus here does: `attacker === this.hero`
		//is only true for the real bump-attack call site, never `useSpecial`'s throw/shoot/zap
		//branches (those pass a shallow copy of the hero, not the hero itself).
		if (attacker === this.hero) damage += ringForceBonus(this.effectiveRing(), this.hero.magicImmune);
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
		//`Stone.proc()` (`items/armor/glyphs/Stone.java`, tag `v3.3.8`): the glyph
		//grants no armor - it replays the to-hit math (attacker accuracy vs the
		//wearer's evasion) and turns 75% of the dodge chance into damage
		//reduction, `ceil(damage x hitChance)` clamped to [0.25, 1]. Runs here at
		//the landed-hit boundary; Java runs it in `defenseProc` pre-armor, the
		//same stated placement every other defend effect here already carries.
		if (defender.isHero && this.armorGlyphActive() && this.armorGlyph === 'stone' && damage > 0) {
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
				return false;
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
			if (attacker.buffs['charm'] !== undefined && this.charmTargets.get(attacker.id) === defender.id) damage = 0;
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
		runState.audio.cue('hit', 0.6);
		if (attacker.isHero && this.subclass() === 'gladiator') {
			attacker.combo = (attacker.combo ?? 0) + 1;
			if (attacker.combo % 3 === 0) {
				damage += 3 + this.talentRank('enhanced_combo');
				this.say(t('port.log.gladiatorcombo'), 'positive');
			}
		} else if (attacker.isHero) {
			attacker.combo = 0;
		}
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
		//Every defender-side `damage()` override (`Pylon` 14+/15, `Eye` /4 while charging,
		//`DemonSpawner` 19+/20, `Slime`/`CausticSlime` 4+/5) applies here, at Java's point: after
		//the attacker's multipliers and procs, before shields and HP. One call rather than four
		//inline blocks, and the `Pylon` curve is now in the same place as the rest instead of
		//above the multiplier chain where it under-reduced every charged-pylon hit.
		//`Char.attack()`'s `AuraOfProtection` clause (tag `v3.3.8`) runs after the attacker's
		//multiplier/proc chain and before the defender's damage override. Same-alignment
		//characters within distance 2 take 10/20/30% less damage. The port has no separate
		//alignment enum, so hero/ally/NPC flags are its ALLY alignment; Chebyshev range is the
		//documented stand-in for Java's path distance on this compact terrain model.
		damage = this.auraProtectedDamage(defender, damage);
		damage = applyDefenderDamageCurves(defender.kind, damage, { beamCharged: defender.beamCharged === true });
		damage = this.gnollMineDamageTaken(defender, damage);
		//The 41st matrix (Goo/Tengu kits) removed a shake here: it cited
		//`Goo.damage()` 162-164 for shaking when a pumped Goo is hit, but no such
		//code exists there - Java's only pump shake is in `Goo.attackProc()`, on a
		//landed hit while pumped (dead code in practice: `damageRoll()` already
		//consumed the pump by proc time), and Java never interrupts the charge on
		//damage. The shake told a lie, so it is gone rather than moved.
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
		const phantomRemote = defender.kind === 'phantomPiranha'
			&& Roguelike.chebyshevDistance(defender, attacker) > 1;
		if (phantomRemote) damage = Math.round(damage / 2);
		const preHp = defender.hp;
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
		if (this.deferMonsterDamage(defender, damage)) return true;
		// `Char.damage()` (tag `v3.3.8`): PowerOfMany reduces damage taken by 25%, or
		// by `30% + 5% per LIFE_LINK rank` while the powered ally has that talent.
		// This scene seam represents the attack() path; direct damage sources still need
		// a shared actor-damage entry point before they can all use the reduction.
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
					return true;
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
		//`RottingFist.damage()` converts the blow to Bleeding instead of HP damage, and
		//`SoiledFist.damage()` blunts it by the grass cut (see both helpers). Burning itself
		//does no damage to a soiled fist - see the DoT tick, which skips it.
		damage = this.rottingBleedConvert(defender, damage, attacker === this.hero && this.abilityHarvestNext > 0);
		damage = this.soiledGrassCut(defender, damage);
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
			return true;
		}
		if (this.enterPrismaticFade(defender, damage)) {
			return true;
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

		//Illuminated already detached up front at the Searing Light site (any attacker,
		//like Java's `Char.attack()`), so there is nothing left to consume here.
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
		if (defender.isHero && this.armorGlyphActive() && this.armorGlyph === 'repulsion' && attacker.hp > 0
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
		if (defender.hp <= 0) {
			const cleave = cleaveComboSeed(this.subclass(), this.talentRank('cleave'));
			if (attacker === this.hero && cleave > 0) attacker.combo = cleave;
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

	/** hero-side on-hit hooks: enchants, subclass effects, counters */
	/** `Weapon.genericProcChanceMultiplier`'s `RunicSlashTracker` leg (tag `v3.3.8`):
	 * the slash stages `3+0.5/level`, which the strike's own enchant computation
	 * consumes exactly once (Java detaches the tracker inside that same call, so a
	 * second computation never sees it). Every other strike reads plain arcana.
	 * Kinetic's conserved-damage store keeps its own direct read on purpose: the
	 * tracker's lifetime across Java's damage-vs-proc ordering is not observable
	 * here, so the boost belongs to the enchant roll only. */
	/** `Weapon.Enchantment.genericProcChanceMultiplier()` (tag `v3.3.8`): Arcana's
	 * `1.175^bonus`, plus `Berserk.enchantFactor()`'s `min(1, power) x 0.15 x
	 * ENRAGED_CATALYST ranks` while raging (Java's `power` is the rage clock; the
	 * missing-HP fraction is this port's standing approximation, already used the
	 * same way by the Kinetic store below). Non-consuming, unlike
	 * `enchantProcMultiplier` - Java's defend-side procs, reach, stealth and speed
	 * reads all go through this without detaching the one-shot ability trackers.
	 * The remaining tracker terms need unmodeled systems (Smite's +3, the Cleric
	 * spell that arms it) or are recorded residuals (SpiritBlades +0.1 and
	 * StrikingWave +0.2 at rank 4 - no tracker state for a tenth of proc chance). */
	/** `Mob.defenseSkill()`'s illuminated half (tag `v3.3.8`) as a predicate: the Cleric
	 * with the STR for the swung weapon, or any non-hero attacker, auto-hits an
	 * illuminated defender. Thrown copies carry `isHero`, so they ride the hero half. */
	clericIlluminatedHit(this: DungeonScene, defender: Creature, attacker: Creature): boolean {
		if (defender.buffs['illuminated'] === undefined) return false;
		if (!attacker.isHero) return true;
		return this.heroClass === 'cleric'
			&& weaponSTRReq(this.weaponTier, this.weaponLevel) <= (this.hero.str ?? 0);
	},

	genericProcMultiplier(this: DungeonScene): number {
		let multi = ringArcanaMultiplier(this.effectiveRing(), this.hero.magicImmune);
		if (this.hero.buffs['berserk'] !== undefined) {
			const missing = this.hero.maxHp > 0 ? 1 - this.hero.hp / this.hero.maxHp : 0;
			multi += Math.min(1, missing) * 0.15 * this.talentRank('enraged_catalyst');
		}
		return multi;
	},

	/** Defend-side proc multiplier: Java's `Armor.Glyph.genericProcChanceMultiplier()`
	 * (`Armor.java` 821-831, tag `v3.3.8`) is Arcana plus the aura term
	 * (`+0.25 + 0.25*points`) for a same-alignment defender near an active aura -
	 * NOT the Berserk/catalyst term, which lives only on Java's `Weapon` attacker-side
	 * twin. Every defend-side glyph seam below (stone, displacement, repulsion,
	 * antimagic, viscosity, the HolyWard block, obfuscation stealth) routes through
	 * here; attacker-side rolls (enchants, kinetic, holy-weapon bonus, projecting
	 * reach, mob on-hit hooks) stay on the shared `genericProcMultiplier()`. */
	armorProcMultiplier(this: DungeonScene, defender: Creature): number {
		const sameAlignment = defender.isHero === true || defender.isAlly === true || defender.isNPC === true;
		const withinRange = Roguelike.chebyshevDistance(defender, this.hero) <= 2;
		return this.genericProcMultiplier() + auraProcBonus(this.talentRank('aura_of_protection'),
			this.hero.buffs['auraProtection'] !== undefined, sameAlignment, withinRange);
	},

	enchantProcMultiplier(this: DungeonScene): number {
		//Java's one-shot trackers are separate buffs that SUM at the next proc
		//roll (`RunicSlashTracker.boost + DirectedPowerTracker.enchBoost + ...`),
		//so the two slots add rather than overwrite - and both zero together,
		//matching the shared detach inside `genericProcChanceMultiplier`.
		const bonus = this.abilityRunicBonus + this.abilityDirectedBonus;
		this.abilityRunicBonus = 0;
		this.abilityDirectedBonus = 0;
		return this.genericProcMultiplier() + bonus;
	},

	/** First free cell at the corpse or beside it for a Lucky bonus heap - Java lets the
	 * `Heap` stack the drop onto the mob's own cell; this port's one-item-per-cell rule
	 * searches the neighbours instead (the same shape the Wealth bonus drops use). */
	freeLuckyCell(this: DungeonScene, defender: Creature): { x: number; y: number } | undefined {
		return [{ x: defender.x, y: defender.y }, ...Roguelike.neighbourOffsets(8).map(([dx, dy]) => ({ x: defender.x + dx, y: defender.y + dy }))]
			.find((cell) => this.level.inside(cell.x, cell.y) && this.level.passable(cell.x, cell.y)
				&& !this.groundItemAt(cell.x, cell.y) && !this.creatureAt(cell.x, cell.y));
	},

	heroOnHit(this: DungeonScene, attacker: Creature, defender: Creature, damage: number): void {
		//Both halves of an Unstable swing resolve the same delegated enchant (see `attack()`).
		//MissileWeapon has no enchantment of its own. Sniper's Shared Enchantment is the
		//narrow Java exception: on a thrown hit, re-run the equipped SpiritBow enchant with
		//Random.Int(3) < points (MissileWeapon.java, tag v3.3.8). Previously every thrown hit
		//silently inherited the weapon affix, making the talent both unconditional and
		//unobservable. Melee keeps the ordinary Unstable/weapon-affix path.
		const sharedEnchantment = attacker.attackMode === 'throw'
			&& this.subclass() === 'sniper'
			&& this.talentRank('shared_enchantment') > 0
			&& this.weaponAffix !== null
			&& !getCurse(this.weaponAffix ?? '')
			&& Random.int(0, 2) < this.talentRank('shared_enchantment')
			? this.weaponAffix
			: null;
		//`Talent.onAttackProc`'s SpiritBladesTracker consume (`Talent.java` 896-901): while the
		//tracker is armed, a landed hero attack rolls `Random.Int(10) < 3*points` for the
		//equipped SpiritBow's own `proc()` - the nature block (plant roll + kill-extend), which
		//runs here for real - and detaches the tracker on a success only. A failed roll leaves
		//it armed for the remaining blades, matching Java (whose detach sits inside the roll's
		//branch, not after it). The melee affix below is the same attack's separate `wep.proc`.
		const spiritBladesProc = this.spiritBladesArmed && attacker === this.hero
			&& Random.int(0, 10) < 3 * this.talentRank('spirit_blades');
		if (spiritBladesProc) {
			this.spiritBladesArmed = false;
			this.applyNaturesPowerOnHit(defender);
		}
		//`SpellTrinity`'s Body Form (`SpellTrinity.java` v3.3.8): while armed, the hero's melee
		//hits proc the stored glyph/enchant affix from the same slot the ordinary weapon-affix
		//roll would have used - it rides the existing proc path (charge cost is spent up front
		//at commit time, not per-hit), so it only needs to supply the affix here when nothing
		//else already claimed the swing.
		const trinityBodyProc = attacker === this.hero && this.trinityForm === 'body' && this.trinityTurns > 0
			? this.trinityBodyAffix : null;
		const rawAffix = spiritBladesProc ? this.weaponAffix : attacker.attackMode === 'throw' ? sharedEnchantment : this.unstableDelegated ?? this.weaponAffix ?? trinityBodyProc;
		//`Weapon.proc()` (tag `v3.3.8`): HolyWeapon overrides any beneficial enchantment -
		//the weapon's own affix (including Unstable delegations and the Sniper share)
		//does not proc while the buff is up. Cursed affixes still proc, and the Paladin
		//keeping both needs the subclass - neither half is modeled beyond this gate.
		const affix = attacker === this.hero && this.hero.buffs['holyWeapon'] !== undefined
			&& !(typeof rawAffix === 'string' && getCurse(rawAffix)) ? null : rawAffix;
		//`Char.damage()`'s Kinetic block: a killing blow with the tracker attached stores the
		//overkill BEYOND this swing's conserved bonus (`-HP - tracker.conservedDamage`),
		//scaled by `genericProcChanceMultiplier()` (Arcana, plus Berserk's
		//`0.15 x catalyst-talent ranks` when raging - RunicBlade/Smite trackers don't exist
		//here) and REPLACING the old amount (`setBonus` overwrites; the old code added half
		//of every landed hit whether it killed or not, capped at 20 - neither has a Java
		//basis). Fires pre-revival, like Java's HP<0 check ahead of `isAlive()`.
		//`Char.damage()`'s Kinetic gate is `HP < 0` (strict - an exact-zero kill stores
		//nothing) with `alignment == ENEMY`, so allied kills never bank overkill.
		if (this.kineticTrackerHit && defender.hp < 0 && !defender.isHero && !defender.isNPC && !defender.isAlly) {
			const overkill = Math.max(0, -defender.hp - this.kineticConservedAdded);
			const multi = this.genericProcMultiplier();
			const stored = Math.round(overkill * multi);
			if (stored > 0) this.kineticStored = stored;
		}
		//Battlemage: staff melee feeds the wand (advance 2 per landed hit, simplified from
		//the per-wand on-hit effects)
		if (this.subclass() === 'battlemage') this.wandCharges.refund(2 + this.talentRank('mystical_charge'));
		if (this.subclass() === 'monk_sub' && this.talentRank('combined_energy') > 0) this.tomeCharges.advance(this.talentRank('combined_energy'));
		//`Weapon.proc()`'s `HolyWepBuff` clause (tag `v3.3.8`): a separate magical hit for
		//`round(2 x Enchantment.genericProcChanceMultiplier())` - Arcana plus Berserk's
		//catalyst term through the shared `genericProcMultiplier()` (Smite's +3 and the
		//one-shot trackers need unported systems). Melee bump only (`attacker === hero`
		//excludes the throw/shoot/zap copies, like the Force ring's own gate) on a live,
		//non-MagicImmune defender (`Char.damage()`'s generic magical zero-out); the later
		//`hp <= 0` backstop credits the kill, as with every other on-hit damage block.
		if (attacker === this.hero && this.hero.buffs['holyWeapon'] !== undefined
			&& !defender.magicImmune && defender.hp > 0) {
			const holy = Math.round(HOLY_WEAPON_BONUS * this.genericProcMultiplier());
			if (holy > 0) {
				defender.hp -= holy;
				this.showDamage(defender, holy);
			}
		}
		//`Blazing.proc()` (tag v3.3.8): `(level+1)/(level+3) x arcana` - 33% at level 0, 50% at 1,
		//60% at 2 - and on a proc it reignites an unlit target for `Burning`'s own 8 turns (which
		//consumes the proc's "power", since `reignite` returns 1 of it) and spends whatever power is
		//left on direct damage, `NormalIntRange(1, 3 + scalingDepth/4) * 0.67 * powerMulti`. What
		//stood here ignited unconditionally with no roll and dealt no burn damage at all.
		//`Blazing` is also one of `AntiMagic.RESISTS`' listed enchant classes - the proc must not
		//ignite or damage a MagicImmune defender at all (`Char.damage()`'s generic zero-out).
		if (affix === 'blazing' && !defender.magicImmune) {
			const level = Math.max(0, this.degradedLevel(this.weaponLevel));
			const procChance = ((level + 1) / (level + 3)) * this.enchantProcMultiplier();
			if (Random.chance(procChance)) {
				let powerMulti = Math.max(1, procChance);
				if (defender.buffs['burning'] === undefined) {
					addBuff(defender, 'burning');
					powerMulti -= 1;
				}
				if (powerMulti > 0 && defender.hp > 0) {
					const burnDamage = Math.round(Random.normalRange(1, 3 + Math.floor(this.depth / 4)) * 0.67 * powerMulti);
					if (burnDamage > 0) {
						defender.hp -= burnDamage;
						this.showDamage(defender, burnDamage);
					}
				}
			}
		}
		//`Chilling.proc()`: `(level+1)/(level+4) x arcana` - 25% at level 0, 40% at 1, 50% at 2 -
		//adding `3 * max(1, chance)` turns of `Chill` with the running total capped at
		//`6 * max(1, chance)`. This used to apply `daze` unconditionally: the wrong status
		//entirely (Java's chill slows the target and escalates into frost) and with no roll.
		if (affix === 'chilling') {
			const level = Math.max(0, this.degradedLevel(this.weaponLevel));
			const procChance = ((level + 1) / (level + 4)) * this.enchantProcMultiplier();
			if (Random.chance(procChance)) {
				const powerMulti = Math.max(1, procChance);
				const existing = defender.buffs['chill'] ?? 0;
				const added = Math.min(Math.round(3 * powerMulti), Math.round(6 * powerMulti) - existing);
				//`Elemental.add()`'s hate-listed chill backslashes instead of attaching
				//(tag `v3.3.8`) - the shared helper refuses, damages, and presents.
				if (added > 0 && applyElementalBacklash(defender, 'chill') === 0 && !buffBlocked(defender, 'chill')) defender.buffs['chill'] = existing + added;
			}
		}
		//`Shocking.proc()`: a flat `1/3 x arcana` chance, then a lightning arc spreading out from the
		//defender to every other character within 2 path cells - chaining onward from each one it
		//reaches with a radius of 2 in water and 1 elsewhere, and explicitly *excluding the
		//defender*, which Java removes from the affected list - for `round(damage/2 * max(1,
		//chance))` each. What stood here dealt 2 unconditional points to the defender itself, the
		//one character Java's arc never touches, and hit nobody else.
		if (affix === 'shocking') {
			const procChance = (1 / 3) * this.enchantProcMultiplier();
			if (Random.chance(procChance)) {
				this.shockingArc(attacker, defender, damage, Math.max(1, procChance));
			}
		}
		//`Vampiric.proc()`: `healChance = (0.05 + 0.25 * missing-HP fraction) x arcana`, so it scales
		//from 5% when unhurt to 30% when nearly dead, then heals `round(damage/2 * max(1, chance))`
		//capped by the attacker's own missing HP - and only against a non-neutral target (or a
		//Mimic, which is neutral but meant to be bitten). What stood here healed a flat 1 HP with no
		//roll, no damage scaling and no target check at all.
		if (affix === 'vampiric') {
			const missing = attacker.maxHp > 0 ? (attacker.maxHp - attacker.hp) / attacker.maxHp : 0;
			const healChance = (0.05 + 0.25 * missing) * this.enchantProcMultiplier();
			const neutralTarget = defender.isNPC || defender.isAlly;
			if (Random.chance(healChance) && !neutralTarget && attacker.hp < attacker.maxHp) {
				const healAmount = Math.min(
					Math.round(damage * 0.5 * Math.max(1, healChance)),
					attacker.maxHp - attacker.hp);
				if (healAmount > 0) {
					attacker.hp += healAmount;
					this.showHeal(attacker, healAmount);
				}
			}
		}
		//`Explosive.proc()` (`Explosive.java` v3.3.8, 48-98): every hit removes
		//`round(IntRange(0,10) x arcana)` points from a 100-point fuse (mean 5, so ~20 hits per
		//explosion), and at 0 the fuse resets by 100 and `new ExplosiveCurseBomb().explode(...)`
		//detonates - see `curseExplosiveBlast` for the position and the real `Bomb.explode` body.
		//These three weapon curses (explosive/dazzling/annoying) used to sit in `mobOnHit`, where
		//`attacker` is a *monster*: a cursed weapon therefore never procced on the hero's own
		//swings and instead fired whenever the hero was hit, which is not what `Weapon.Enchantment
		//.proc(weapon, attacker, defender, damage)` does - it runs on the wielder's attack.
		if (affix === 'explosive') {
			const fuseBefore = this.weaponCurseDurability;
			this.weaponCurseDurability -= Math.round(Random.range(0, 10) * this.enchantProcMultiplier());
			//`Explosive.proc()` warns across the 50 and 10 thresholds (`desc_warm` /
			//`desc_hot`, SPD's own catalogue strings) before the fuse blows. The
			//status icons and burst particles have no seam here; the log line
			//carries the warning instead.
			if (fuseBefore > 50 && this.weaponCurseDurability <= 50) this.say(t('items.weapon.curses.explosive.desc_warm'), 'warning');
			else if (fuseBefore > 10 && this.weaponCurseDurability <= 10) this.say(t('items.weapon.curses.explosive.desc_hot'), 'warning');
			if (this.weaponCurseDurability <= 0) {
				this.weaponCurseDurability += 100;
				this.curseExplosiveBlast(attacker, defender);
			}
		}
		//`Dazzling.proc()` (`Dazzling.java` 41-56): `1/10 x arcana`, then every char whose *own*
		//field of view contains the defender gets `Blindness` - `DURATION` (10 turns) for the
		//attacker itself, half of that for everyone else. This port has no per-creature FOV grid, so
		//the hero's case is checked exactly (`fov` covers the defender's cell) while a monster's
		//"can see the defender" is approximated by the hero's map vision of that monster; daze is the
		//available stand-in for Java's separate Blindness status (it impairs the target's rolls here).
		//Two things the old branch got wrong: it dazed the hero unconditionally (the hero always sees
		//*itself*, so its visibility test was vacuously true), and it dispelled the hero's
		//invisibility - `Invisibility.dispel()` is `Annoying`'s line, not this one's.
		if (affix === 'dazzling' && Random.chance((1 / 10) * this.enchantProcMultiplier())) {
			if (this.fov.isVisible(defender.x, defender.y) && !buffBlocked(this.hero, 'daze')) this.hero.buffs['daze'] = Math.max(this.hero.buffs['daze'] ?? 0, 10);
			for (const creature of this.creatures) {
				if (creature.isHero || creature.hp <= 0 || !this.fov.isVisible(creature.x, creature.y)) continue;
				if (!buffBlocked(creature, 'daze')) creature.buffs['daze'] = Math.max(creature.buffs['daze'] ?? 0, creature === attacker ? 10 : 5);
			}
		}
		//`Annoying.proc()` (`Annoying.java` 42-61): `1/20 x arcana`, beckoning every mob in the level
		//toward the attacker and then dispelling invisibility. `seesHero` is this port's
		//target-acquisition state, the standing stand-in for `beckon`; the crate/scream/sound
		//presentation and the 13 flavour lines remain UI gaps.
		if (affix === 'annoying' && Random.chance((1 / 20) * this.enchantProcMultiplier())) {
			for (const creature of this.creatures) {
				if (!creature.isHero && !creature.isNPC && creature.hp > 0) {
					creature.seesHero = true;
					creature.lastSeen = { x: this.hero.x, y: this.hero.y };
				}
			}
			delete this.hero.buffs.invisibility;
		}
		//`Wayward.proc()` (`Wayward.java` 41-45): a `1/4 x arcana` roll *toggles* the wielder's own
		//`WaywardBuff` - detaching it when already up, prolonging it for 10 turns otherwise. The buff
		//is what docks the weapon's accuracy by 5 (`Weapon.accuracyFactor`, read in
		//`syncHeroFromStats`), not the affix on its own.
		if (affix === 'wayward') {
			if (attacker.buffs['wayward'] !== undefined) delete attacker.buffs['wayward'];
			else if (Random.chance((1 / 4) * this.enchantProcMultiplier())) addBuff(attacker, 'wayward');
		}
		//Elastic.proc(): on a successful proc, knock the defender along the part of
		//the attack trajectory beyond its cell by `round(2 * max(1, chance))` cells.
		//The scene already owns forced movement and collision rules in `moveTo`, so a
		//straight grid shove reproduces the meaningful result without a new actor type.
		if (affix === 'elastic' && defender.hp > 0 && attacker === this.hero) {
			const level = Math.max(0, this.degradedLevel(this.weaponLevel));
			const procChance = ((level + 1) / (level + 5)) * this.enchantProcMultiplier();
			if (Random.chance(procChance)) {
				const dx = Math.sign(defender.x - attacker.x);
				const dy = Math.sign(defender.y - attacker.y);
				const distance = Math.round(2 * Math.max(1, procChance));
				for (let step = 0; step < distance; step++) {
					const next = { x: defender.x + dx, y: defender.y + dy };
					if (!this.level.passable(next.x, next.y) || this.creatureAt(next.x, next.y)) break;
					this.moveTo(defender, next);
				}
			}
		}
		//Grim is resolved at the central damage boundary above, matching Java's tracker
		//ordering; no second post-hit roll belongs here.
		//`Lucky.proc()`/`LuckProc` (tag v3.3.8): only a would-be-killing hit can arm
		//the deferred bonus. Its chance is `(buffedLvl+4)/(buffedLvl+40) * Arcana`,
		//not a flat 10%; the reward is `Lucky.genLoot()`, which is
		//`RingOfWealth.genConsumableDrop(-5)` (`Lucky.java`/`RingOfWealth.java`, tag `v3.3.8`):
		//80% low (half-gold/stone/potion/scroll @25% each) + 20% mid (doubled-low/exotic
		//potion/exotic scroll/unstable brew-or-spell/bomb/honeypot @1/6 each), 0% high -
		//consumables and gold only, never equipment. Exotics/unstables have no port items,
		//so they stand in as their regular potion/scroll (the same reduction
		//`items/wealthDrops.ts` documents for the ring's own drops); the doubled-low branch
		//doubles exactly (gold via its payload quantity, like `materialiseWealthDrop`'s own
		//`doubled` case) while a bare stone/potion/scroll heap carries no quantity, so its
		//second unit lands beside the first instead. The port has no rarity picker, so the
		//neighbour-cell search is kept for whichever heap lands first.
		if (affix === 'lucky' && defender.hp <= 0) {
			const level = Math.max(0, this.degradedLevel(this.weaponLevel));
			const chance = ((level + 4) / (level + 40)) * this.enchantProcMultiplier();
			if (Random.chance(chance)) {
				//`Gold.random()` (`Gold.java`, tag `v3.3.8`): `IntRange(30 + depth*10,
				//60 + depth*20)`; the low tier halves it (`i.quantity(i.quantity()/2)`),
				//the mid tier's doubling re-applies it.
				const luckyGold = (doubled: boolean): void => {
					const full = Random.range(30 + this.depth * 10, 60 + this.depth * 20);
					const at = this.freeLuckyCell(defender);
					if (at) this.spawnGroundItem('gold', at.x, at.y, { id: 'gold', quantity: Math.max(1, doubled ? full : Math.floor(full / 2)), identified: true });
				};
				const luckyKind = (kind: 'stone' | 'potion' | 'scroll' | 'bomb' | 'honeypot'): void => {
					const at = this.freeLuckyCell(defender);
					if (at) this.spawnGroundItem(kind, at.x, at.y);
				};
				const luckyLow = (doubled: boolean): void => {
					const low = Random.element(['gold', 'stone', 'potion', 'scroll'] as const)!;
					if (low === 'gold') luckyGold(doubled);
					else if (doubled) {
						luckyKind(low);
						luckyKind(low);
					} else luckyKind(low);
				};
				if (Random.float() < 0.8) luckyLow(false);
				else {
					switch (Random.int(6)) {
						case 0: luckyLow(true); break;
						case 1: luckyKind('potion'); break;
						case 2: luckyKind('scroll'); break;
						case 3: luckyKind(Random.int(2) === 0 ? 'potion' : 'scroll'); break;
						case 4: luckyKind('bomb'); break;
						default: luckyKind('honeypot'); break;
					}
				}
				this.say(t('port.log.lucky'), 'positive');
			}
		}
		//Blocking.proc(): real proc chance is (lvl+4)/(lvl+40) (10% at lvl 0, ~14% at lvl 2), and
		//the shield granted is round(max(1,procChance) * (2+lvl)) - both reproduced exactly. Real
		//Java grants this into its own BlockBuff (a distinct ShieldBuff from Barrier, priority 2
		//so it drains before Barrier's priority-0 pool), whose act() just detaches outright 5
		//turns after setShield() - a fixed cliff-edge, not a decay curve. This port mirrors that
		//with its own `blockingBarrier` pool (drained first in `absorbHeroDamage`, exempt from
		//the proportional decay, cliff-expired by `blockingTurnsLeft`) via grantBlockingShield,
		//which reproduces ShieldBuff.setShield()'s max-not-additive semantics plus the always-
		//reset 5-turn timer. Corrected this pass: the old code pooled Blocking into the shared
		//heroBarrier and tracked the share with an additive side counter - so repeated procs
		//stacked unboundedly where Java keeps the higher value, the proportional decay nibbled a
		//shield Java exempts from it, and drain order was recency, not priority.
		if (affix === 'blocking') {
			//Blocking.proc(): both the proc chance and the shield magnitude read
			//`weapon.buffedLvl()` (the Degrade-affected level), not the raw stored level -
			//found using raw `this.weaponLevel` instead in the 2026-09-09 item-system audit
			//(so a Degrade-hit weapon procced/shielded as if undegraded).
			const level = this.degradedLevel(this.weaponLevel);
			const procChance = ((level + 4) / (level + 40)) * this.enchantProcMultiplier();
			if (Random.chance(procChance)) {
				const powerMulti = Math.max(1, procChance);
				this.grantBlockingShield(Math.round(powerMulti * (2 + level)));
			}
		}
		//Blooming.proc(): (lvl+1)/(lvl+3) x arcana chance to plant grass at the defender's
		//cell first, then shuffled 8-neighbours with the attacker's own cell dead last (only
		//when adjacent), planting (1+0.1*lvl) x max(1,procChance) cells with stochastic
		//rounding. plantGrass() targets EMPTY/EMPTY_DECO/EMBERS/GRASS/FURROWED_GRASS cells
		//with no plant: this port's terrain has no EMPTY_DECO/EMBERS/FURROWED ids, so FLOOR
		//and GRASS are the plantable set, and FURROWED (or HIGH_GRASS under Regeneration's
		//regen - a well-water state this port doesn't model) collapses straight to HIGH_GRASS.
		//Occupancy reuses the live plant-marker maps; the leaf-burst particles have no seam.
		if (affix === 'blooming') {
			//Blooming.proc() also reads `weapon.buffedLvl()`, same Degrade fix as Blocking above.
			const level = Math.max(0, this.degradedLevel(this.weaponLevel));
			const procChance = ((level + 1) / (level + 3)) * this.enchantProcMultiplier();
			if (Random.chance(procChance)) this.applyBloomingGrass(attacker, defender, level, procChance);
		}
	},

	/** `Blooming.proc()`'s planting, once the proc chance has been rolled: `(1 + 0.1*level) * max(1, chance)` grass cells,
	 * the defender's own first, then its shuffled neighbours, the attacker's cell last. Shared by the hero's weapon and a statue's. */
	applyBloomingGrass(this: DungeonScene, attacker: Creature, defender: Creature, level: number, procChance: number): void {
		let plants = (1 + 0.1 * level) * Math.max(1, procChance);
		plants = Random.float() < (plants % 1) ? Math.ceil(plants) : Math.floor(plants);
		const cells = [{ x: defender.x, y: defender.y }];
		const around = Roguelike.neighbourOffsets(8)
			.map(([dx, dy]) => ({ x: defender.x + dx, y: defender.y + dy }))
			.filter((at) => !(at.x === attacker.x && at.y === attacker.y));
		for (let i = around.length - 1; i > 0; i--) {
			const j = Random.int(0, i + 1);
			[around[i], around[j]] = [around[j]!, around[i]!];
		}
		cells.push(...around);
		if (Roguelike.chebyshevDistance(attacker, defender) === 1) cells.push({ x: attacker.x, y: attacker.y });
		let planted = false;
		for (const cell of cells) {
			if (this.plantBloomingGrass(cell.x, cell.y)) {
				planted = true;
				if (--plants <= 0) break;
			}
		}
		if (planted) this.say(t('port.log.blooming'), 'positive');
	},

	/** the auto-decided subclass id (branch tier 0), or null before level 13 */
	subclass(this: DungeonScene): string | null {
		return this.advancement.choice(0);
	},

	/** `Degrade.reduceLevel()`: zero and negative levels pass through untouched, otherwise
	 * `round(sqrt(2*(lvl-1)) + 1)` - so 1/2/3/4/5/6+ read as 1/2/3/3/4/4. Read through
	 * `Item.buffedLevel()` by damage rolls and armor DR while the buff holds (30 turns);
	 * everything else (proc chances, upgrade-loss rolls, the stored true level itself)
	 * keeps `level()`. */
	degradedLevel(this: DungeonScene, trueLevel: number): number {
		if (!this.hero.buffs['degrade'] || trueLevel <= 0) return trueLevel;
		return Math.round(Math.sqrt(2 * (trueLevel - 1)) + 1);
	},

	/** `Level.viewDistance`: `8`, `2` under the real `DARKNESS` challenge, and `4` on the
	 * final vault (`LastLevel.viewDistance = 4`) - the same shared radius this port already
	 * uses for both the hero's own FOV and every monster's `seesHero`/AI sight check (real
	 * Java's own light-casting array backs both alike, so one shared radius is the faithful
	 * shape, not a coincidence of this port's own structure). Darkness takes the minimum,
	 * matching `updateVisibility()`'s `min(viewDistance, 2)`. The Halls boss floor is special:
	 * see the Yog branch below. */
	viewRadius(this: DungeonScene): number {
		//`HallsBossLevel` caps its own view distance at 4 (`viewDistance = min(4, viewDistance)`),
		//and while Yog lives `YogDzewa.updateVisibility()` shrinks it further as the fight advances:
		//phase 1 -> 4, then `max(4 - (phase-1), 1)` (phase 2 -> 3, 3 -> 2, 4/5 -> 1). Java assigns
		//that value straight to `hero.viewDistance` when the hero has no Light buff, so it also
		//overrides Farsight's own multiplier while Yog is alive - reproduced here by returning early.
		const yog = this.depth === 25 ? this.creatures.find((c) => c.kind === 'yog' && c.hp > 0) : undefined;
		//`YogDzewa.updateVisibility()` skips the shrink while the hero holds Light
		//(`Dungeon.hero.buff(Light.class) == null` gate) - a lit hero keeps the normal
		//radius below instead. Expiry needs no handling: the radius is recomputed statelessly,
		//so the shrink re-applies on the first call after the buff lapses, matching `detach()`.
		if (yog && !this.hero.buffs['light']) {
			const distance = Math.max(4 - ((yog.yogPhase ?? 1) - 1), 1);
			return isChallengeEnabled('darkness') ? Math.min(distance, 2) : distance;
		}
		const base = this.depth === 26 ? 4 : VIEW_RADIUS;
		//Farsight (Sniper T3, checked against tag `v3.3.8`'s `Level.updateVisibility()` and
		//`Dungeon.observe()`): sight radius scales by `1 + 0.25*points` (8/10/12/14 on the
		//shared base). Replaces a wrong-shaped stand-in that spent the talent as a +2/point
		//RANGED TARGETING range in `useSpecial` instead - Farsight never touches targeting.
		//The darkness minimum still applies on top, matching `updateVisibility()`'s own order.
		const scaled = base * farsightMultiplier(this.subclass(), this.talentRank('farsight'));
		const radius = isChallengeEnabled('darkness') ? Math.min(scaled, 2) : scaled;
		//`Light.attachTo()`: `viewDistance = max(level.viewDistance, Light.DISTANCE)` - the buff
		//floors sight at 6, which is what lets a lit torch pierce the Darkness challenge's radius of 2.
		return this.hero.buffs['light'] ? Math.max(radius, 6) : radius;
	},

	/** DM300.supercharge()/CavesBossLevel.activatePylon(): activate the pylon farthest from the
	 * hero after reserving the closest inactive pylon, then seed `PylonEnergy` on the arena's
	 * INACTIVE_TRAP/WATER/SIGN cells (from row 13 down, plus any water via `evolve()`'s spread).
	 * `eliminatePylon()` clears the field again while more than the final pylons remain. */
	dm300Supercharge(this: DungeonScene, dm300: Creature): void {
		const total = isChallengeEnabled('stronger_bosses') ? 3 : 2;
		const activated = dm300.dmPylonsActivated ?? 0;
		if (activated >= total) return;
		dm300.dmSupercharged = true;
		dm300.dmPylonsActivated = activated + 1;
		const inactive = this.creatures.filter((creature) => creature.kind === 'pylon' && !creature.pylonActive && creature.hp > 0);
		if (inactive.length > 0) {
			const closest = inactive.reduce((best, pylon) =>
				Roguelike.chebyshevDistance(this.hero, pylon) < Roguelike.chebyshevDistance(this.hero, best) ? pylon : best);
			const candidates = inactive.filter((pylon) => pylon !== closest);
			const pylon = Random.element(candidates.length > 0 ? candidates : inactive);
			if (pylon) {
				pylon.pylonActive = true;
				const sprite = this.sprite(pylon);
				const sheet = SpriteSheet.fromTexture(runState.sprites.pylon, 10, 20);
				sprite.texture = sheet.get(1);
				placeCharacterArt(sprite);
			}
		}
		//The eligible cells come from the untranslated `PaintLevel`, because the live level's
		//coarse terrain mapping collapses `INACTIVE_TRAP` (and gates) to plain floor - reading
		//`this.level.get` here would never match a single seeded cell.
		this.cavesBossEnergyCells.clear();
		const paint = this.portedPaint;
		if (paint) {
			for (let cell = 0; cell < paint.map.length; cell++) {
				const terrain = paint.map[cell];
				const y = Math.floor(cell / paint.w);
				if (terrain === Terrain.WATER || (y >= 13 && (terrain === Terrain.INACTIVE_TRAP || terrain === Terrain.SIGN))) {
					this.cavesBossEnergyCells.add(cell);
				}
			}
		}
		this.say(t('port.log.dm300overcharge'), 'warning');
	},

	/** Pylon.die()/CavesBossLevel.eliminatePylon(): destroying any active pylon
	 * immediately ends DM-300's current invulnerability window. */
	dm300LoseSupercharge(this: DungeonScene): void {
		//`eliminatePylon()`'s own first statement is `customArenaVisuals.updateState()`, before it
		//counts what is left. The dying pylon has already been removed from `Actor.chars` by
		//`Char.die()`, which is what `pylonActorAt` reads here, so its cell picks up the `38` socket
		//frame on this pass.
		this.refreshCavesBossArenaVisuals();
		const dm300 = this.creatures.find((creature) => creature.kind === 'dm300' && creature.hp > 0);
		if (!dm300) return;
		dm300.dmSupercharged = false;
		//`DM300.loseSupercharge()`: clamp the ability counter so the boss cannot fire the
		//very turn the charge ends (`Math.min(turnsSinceLastAbility, MIN_COOLDOWN-3)`).
		if ((dm300.dmAbilityTurns ?? -1) >= 0) dm300.dmAbilityTurns = Math.min(dm300.dmAbilityTurns ?? 0, 2);
		const remaining = this.creatures.filter((creature) => creature.kind === 'pylon' && creature.hp > 0).length;
		const finalPylons = isChallengeEnabled('stronger_bosses') ? 1 : 2;
		if (remaining > finalPylons) this.cavesBossEnergyCells.clear();
		dm300.dmBarrier = 0;
	},

	/** `Char.stealth()`/`Obfuscation.stealthBoost()` (tag 4.0.0-beta). */
	heroStealth(this: DungeonScene): number {
		if (this.armorGlyph !== 'obfuscation') return 0;
		const level = Math.max(0, this.degradedLevel(this.armorLevel));
		return (1 + level / 3) * this.armorProcMultiplier(this.hero);
	},

	/** `Earthroot.Armor.blocking()`: `(Dungeon.scalingDepth() + 5)/2`, integer division. This
	 * port substitutes `this.depth` for `scalingDepth()` everywhere else that formula appears, so
	 * it does the same here rather than inventing a second convention. */
	earthrootBlocking(this: DungeonScene): number {
		return Math.floor((this.depth + 5) / 2);
	},

	/** Shared `AuraOfProtection.AuraBuff` incoming-damage gate for scene-owned damage seams. */
	auraProtectedDamage(this: DungeonScene, target: Creature, damage: number): number {
		const sameAlignment = target.isHero === true || target.isAlly === true || target.isNPC === true;
		const withinRange = Roguelike.chebyshevDistance(target, this.hero) <= 2;
		return auraProtectedDamage(damage, this.talentRank('aura_of_protection'),
			this.hero.buffs['auraProtection'] !== undefined, sameAlignment, withinRange);
	},

	/** `Armor.hasGlyph()`'s HolyWard gate (tag `v3.3.8`): good glyphs are dormant while
	 * HolyWard is active, except on Paladin armor; cursed glyphs remain active. */
	armorGlyphActive(this: DungeonScene): boolean {
		const glyph = this.armorGlyph;
		return glyph !== null && (this.hero.buffs['holyWard'] === undefined || this.subclass() === 'paladin' || getCurse(glyph) !== undefined);
	},

	/** Barrier absorbs incoming damage before HP, matching Buff.Barrier's core rule. */
	absorbHeroDamage(this: DungeonScene, amount: number, magical = false, auraAlreadyApplied = false): number {
		if (!auraAlreadyApplied) amount = this.auraProtectedDamage(this.hero, amount);
		//`Hero.damage()`'s `DuelParticipant.addDamage(effectiveDamage)`: every hero hit
		//that gets past this boundary feeds the duel ledger with its HP-plus-shield pool
		//loss (Java's `preHP - postHP`, overkill included since the returned hit is
		//unclamped). All fifteen hero-HP sites route through here, deferred ticks
		//included, so this one snapshot covers them all.
		const hpBefore = this.hero.hp;
		const shieldBefore = this.heroShieldPoolTotal();
		const recordDuelDamage = (hpLoss: number): void => {
			if (this.hero.buffs['duelParticipant'] === undefined) return;
			const poolLoss = shieldBefore - this.heroShieldPoolTotal() + hpLoss;
			if (poolLoss > 0) this.hero.duelTakenDmg = (this.hero.duelTakenDmg ?? 0) + poolLoss;
		};
		//`Invulnerability` (the blessed ankh's revive shield): Java negates the damage outright.
		if (amount > 0 && this.hero.buffs['invulnerability']) return 0;
		//(Guard used to negate one damage instance here; Java's guard is infinite
		//evasion for the whole window instead, which `syncHeroFromStats` now models -
		//this block is gone with it. The `guardblocks` line goes unused with it.)
		//`EndureTracker.adjustDamageTaken()` runs at Java's own place in the chain for the sources it
		//can reach here: `Char.damage()` applies it to the attacker's rolled damage *before* the
		//armor subtraction, and `Hero.damage()` applies it after armor for non-char sources. This
		//port has one hero-damage boundary and it sits after armor for both, so the reduction is
		//slightly kinder to the hero than Java's melee case - stated in `PORT_COVERAGE.md`. It runs
		//before every shield, which is Java's order in both of its placements.
		if (amount > 0) amount = this.endureAdjustDamageTaken(amount);
		//`Earthroot.Armor.absorb()`: the pool blocks `min(damage, (scalingDepth + 5)/2)` of every
		//hit and detaches once exhausted or once its owner has left the cell it was granted on.
		//Java runs this in `Char.defenseProc()` - before the armor subtraction and ahead of every
		//shield - while this port's absorption point sits after the damage roll, which has already
		//taken armor off; a hit therefore burns a little less of the pool here than in Java (stated
		//in PORT_COVERAGE.md rather than silently). Keep-max, as Java's own `level(value)` is.
		if (this.earthrootArmor) {
			if (this.earthrootArmor.pos !== this.level.index(this.hero.x, this.hero.y)) {
				this.earthrootArmor = null;
			} else if (amount > 0) {
				const blocked = Math.min(amount, this.earthrootBlocking());
				this.earthrootArmor.level -= blocked;
				amount -= blocked;
				if (this.earthrootArmor.level <= 0) this.earthrootArmor = null;
			}
		}
		//Hero.damage(): `dmg = ceil(dmg * RingOfTenacity.damageMultiplier())` is applied before
		//Char.damage()'s own Barrier absorption, so Tenacity scales the raw hit here too.
		const tenacityMultiplier = ringTenacityMultiplier(this.effectiveRing(), this.hero.hp, this.hero.maxHp, this.hero.magicImmune);
		let scaled = tenacityMultiplier < 1 ? Math.ceil(amount * tenacityMultiplier) : amount;
		//AntiMagic.drRoll()/Char.damage() (items/armor/glyphs/AntiMagic.java and
		//actors/Char.java, tag 4.0.0-beta): listed magical sources lose a
		//NormalIntRange(level*Arcana, (3+1.5*level)*Arcana) roll before shields.
		//The port's explicit magical flag is used only at its real ranged-magic
		//callers; physical melee and unclassified environmental damage stay untouched.
		if (magical && this.armorGlyphActive() && this.armorGlyph === 'antimagic') {
			const level = Math.max(0, this.degradedLevel(this.armorLevel));
			const multiplier = this.armorProcMultiplier(this.hero);
			const reduction = Random.normalRange(Math.round(level * multiplier), Math.round((3 + level * 1.5) * multiplier));
			scaled = Math.max(0, scaled - reduction);
		}
		//`Armor.proc()`'s `HolyArmBuff` clause (tag `v3.3.8`): the imbued armor blocks 1
		//more (3 for the unported Paladin), scaled by the defend-side proc multiplier -
		//Arcana plus the aura term, never the attack-side Berserk term
		//(`Armor.Glyph.genericProcChanceMultiplier()`, `Armor.java` 821-831). Placed
		//pre-shield, where the armor stage sits in Java's `defenseProc()` chain.
		if (scaled > 0 && this.hero.buffs['holyWard'] !== undefined) {
			scaled = Math.max(0, scaled - Math.round(HOLY_WARD_BLOCK * this.armorProcMultiplier(this.hero)));
		}
		let viscosityDamage = Math.max(0, scaled);
		//Viscosity.proc()/ViscosityTracker.deferDamage() (items/armor/glyphs/Viscosity.java,
		//tag 4.0.0-beta): after the normal incoming-damage scaling, defer
		//ceil(damage * (level+1)/(level+6) * Arcana), while the remainder lands now.
		//When Arcana pushes the fraction above 1, Java instead divides the full hit
		//by that fraction and defers that reduced amount. The shared hero damage
		//boundary covers melee, missiles, wands, traps, and environmental damage.
		if (!this.applyingDeferredDamage && this.armorGlyphActive() && this.armorGlyph === 'viscosity' && viscosityDamage > 0) {
			const level = Math.max(0, this.degradedLevel(this.armorLevel));
			const percent = ((level + 1) / (level + 6)) * this.armorProcMultiplier(this.hero);
			const deferred = percent > 1 ? Math.round(viscosityDamage / percent) : Math.ceil(viscosityDamage * percent);
			if (deferred > 0) {
				this.hero.deferredDamage = (this.hero.deferredDamage ?? 0) + deferred;
				if (!this.hero.deferredDamageDelay) this.hero.deferredDamageDelay = true;
				viscosityDamage = percent > 1 ? Math.round(viscosityDamage / percent) - deferred : viscosityDamage - deferred;
			}
		}
		//WandOfLivingEarth.RockArmor.absorb(): blocks `damage - damage/2` (ceil half)
		//until its stored rock amount is exhausted, before ordinary ShieldBuff layers.
		//The port has no distinct Buff priority for RockArmor, so it drains first here;
		//the amount and half-damage rule are retained even though EarthGuardian is not.
		const livingEarthBlocked = Math.min(this.livingEarthArmor, Math.ceil(viscosityDamage / 2));
		this.livingEarthArmor -= livingEarthBlocked;
		//**Correction, 2026-09-14**: this drain order used to be justified by a
		//"`ShieldBuff.shieldUsePriority` - BlockBuff (2) before Barrier (0)" comment (also in
		//PORT_COVERAGE.md's Barrier row) that does not exist in real Java - grepped
		//`ShieldBuff.java`/`Blocking.java`/`Char.java` directly for "priority" and found zero
		//matches. Real `Char.damage()` just iterates `buffs(ShieldBuff.class)` in whatever order
		//those buffs happen to be attached, which Java never guarantees or documents; this port's
		//own fixed order (seal, then Blocking, then Barrier) is a defensible, consistent stand-in
		//for that unspecified order, not a reproduction of a real priority field - the seal drains
		//first here because `HeroClass.initHero()` affixes it before any other buff could exist
		//for a fresh Warrior, making it the earliest-attached shield in the common case.
		const afterLivingEarth = Math.max(0, viscosityDamage - livingEarthBlocked);
		const blockedSeal = this.sealBarrier.absorb(afterLivingEarth);
		const blockedBlocking = this.blockingBarrier.absorb(Math.max(0, afterLivingEarth - blockedSeal));
		const blockedAscended = this.ascendedBarrier.absorb(Math.max(0, afterLivingEarth - blockedSeal - blockedBlocking));
		const blockedBase = this.heroBarrier.absorb(Math.max(0, afterLivingEarth - blockedSeal - blockedBlocking - blockedAscended));
		const blocked = livingEarthBlocked + blockedSeal + blockedBlocking + blockedAscended + blockedBase;
		this.wandCharges.refund(shieldBatteryGain(blocked, this.talentRank('shield_battery')));
		const reduced = Math.max(0, viscosityDamage - blocked);
		if (deathlessFuryTriggers(this.subclass(), this.talentRank('deathless_fury'), this.deathlessFuryUsed, reduced, this.hero.hp)) {
			this.deathlessFuryUsed = true;
			recordDuelDamage(hpBefore - 1);
			this.hero.hp = 1;
			addBuff(this.hero, 'berserk');
			return 0;
		}
		recordDuelDamage(reduced);
		return reduced;
	},

	/** The hero's damage-soaking pools in one number (`Barrier.total` for each barrier,
	 * Earthroot's `level`, the Living Earth rock amount) - the `shielding()` half of the
	 * duel ledger's pool-loss snapshot. */
	heroShieldPoolTotal(this: DungeonScene): number {
		return this.heroBarrier.total + this.sealBarrier.total + this.blockingBarrier.total + this.ascendedBarrier.total
			+ (this.earthrootArmor?.level ?? 0) + this.livingEarthArmor;
	},

	/** Blocking.BlockBuff.setShield(): keeps the higher of the current shield and the fresh
	 * proc amount (never additive) and always resets the 5-turn cliff timer - `super.setShield`
	 * is `if (shielding <= shield) shielding = shield`, then `left = 5f`. The port-level
	 * overflow cap is measured against both pools combined (Java has no cross-buff cap; this
	 * cap is this port's own anti-overflow guard, same as grantHeroShield's). */
	grantBlockingShield(this: DungeonScene, amount: number): void {
		const room = Math.max(0, this.hero.maxHp - this.heroBarrier.total - this.blockingBarrier.total);
		const added = Math.min(room, Math.max(0, amount));
		if (added >= this.blockingBarrier.total) {
			this.blockingBarrier.clear();
			if (added > 0) this.blockingBarrier.add(added);
		}
		this.blockingTurnsLeft = 5;
		this.say(t('port.log.shield', { amount: added }), 'positive');
	},

	/** Returns the amount actually added (may be less than `amount` if capped). */
	grantHeroShield(this: DungeonScene, amount: number, cap = 999): number {
		if (amount <= 0) return 0;
		const max = cap + this.talentRank('iron_will');
		const room = Math.max(0, max - this.heroBarrier.total);
		const added = Math.min(room, amount);
		this.heroBarrier.add(added);
		//Barrier.incShield() resets partialLostShield to 0 on every addition, so a fresh top-up
		//doesn't immediately spend whatever fraction had already accrued toward the next decay tick
		this.barrierPartialLoss = 0;
		this.say(t('port.log.shield', { amount }), 'positive');
		return added;
	},
	/**
	 * `ClericSpell.onSpellCast()`'s Satiated half (tag `v3.3.8`): with the talent and
	 * a live `SatiatedSpellsTracker`, the cast grants a Barrier of `1 + 2*points`
	 * and detaches the tracker. Every tier-1 cast calls this - the base three as
	 * well as the talent spells. `Barrier.setShield()` keeps the higher of the
	 * current shield and the fresh amount (never additive), silently - Java logs
	 * nothing for the proc.
	 */
	consumeSatiatedSpells(this: DungeonScene): void {
		if (this.heroClass !== 'cleric' || this.talentRank('satiated_spells') <= 0) return;
		if (this.hero.buffs['satiatedSpells'] === undefined) return;
		delete this.hero.buffs['satiatedSpells'];
		const amount = satiatedShieldAmount(this.talentRank('satiated_spells'));
		if (amount > this.heroBarrier.total) this.heroBarrier.add(amount - this.heroBarrier.total);
	},

	/** monster-side on-hit hooks (all pre-existing, now grouped) */
	mobOnHit(this: DungeonScene, attacker: Creature, defender: Creature, damage: number): void {
		const scene = this;
		mobOnHit({
			get armorGlyph() { return scene.armorGlyph; }, set armorGlyph(value) { scene.armorGlyph = value; },
			armorGlyphActive: scene.armorGlyphActive(),
			get armorLevel() { return scene.armorLevel; },
			get hunger() { return scene.hunger; }, set hunger(value) { scene.hunger = value; },
			get earthrootArmor() { return scene.earthrootArmor; }, set earthrootArmor(value) { scene.earthrootArmor = value; },
			hero: scene.hero, level: scene.level, charmTargets: scene.charmTargets, manualPlants: scene.manualPlants,
			stenchGas: scene.stenchGas, toxicGas: scene.toxicGas, wandCharges: scene.wandCharges,
			creatureAt: (x, y) => scene.creatureAt(x, y), degradedLevel: (level) => scene.degradedLevel(level),
			genericProcMultiplier: () => scene.genericProcMultiplier(), grantHeroShield: (amount, cap) => scene.grantHeroShield(amount, cap),
			isChasmCell: (x, y) => scene.isChasmCell(x, y), placePortedFeature: (cell, kind) => scene.placePortedFeature(cell, kind),
			say: (message, level) => scene.say(message, level), shakeScreen: (magnitude, duration) => scene.shakeScreen(magnitude, duration),
			showHeal: (target, amount) => scene.showHeal(target, amount), spawnMonster: (kind, at) => scene.spawnMonster(kind, at),
			subclass: () => scene.subclass(), talentRank: (id) => scene.talentRank(id), thiefSteal: (thief) => scene.thiefSteal(thief),
			triggerPortedPlantAt: (x, y) => scene.triggerPortedPlantAt(x, y),
		}, attacker, defender, damage);
	},

	/**
	 * Ghoul lifelink, simplified: the first ghoul downed on a floor crumples and revives
	 * at a tenth of health (Java: GhoulLifeLink revive after timesDowned*5 turns near a
	 * live host); later downs stick. The timer is collapsed to immediate - stated.
	 */
	ghoulDown(this: DungeonScene, ghoul: Creature): void {
		if (this.ghoulsDowned > 0) return;
		this.ghoulsDowned++;
		ghoul.hp = Math.max(1, Math.round(ghoul.maxHp / 10));
		this.say(t('port.log.ghoulrises'), 'warning');
	},

	/**
	 * Thief.steal: one unequipped consumable (potion/scroll/food, else 10 gold), then FLEEING
	 * (fleeBelow 1 in takeMonsterTurn). Placeholders/shattering pots need the heap system -
	 * the item simply leaves the bag and rides on the thief until it dies.
	 */
	thiefSteal(this: DungeonScene, thief: Creature): void {
		const victim = this.bag.items.find((i) => ['potion', 'potionHealing', 'scrollIdentify', 'scroll', 'food', 'meat'].includes(i.id) && i.quantity > 0);
		if (victim) {
			this.bag.remove(victim.id, 1);
			thief.stolen = victim.id;
			this.say(t('port.log.thiefsteals'), 'negative');
		} else if (this.heroStats.base('gold') >= 10) {
			this.heroStats.setBase('gold', this.heroStats.base('gold') - 10);
			thief.stolen = 'gold:10';
			this.say(t('port.log.thiefgold'), 'negative');
		}
	},

	/**
	 * Swarm.defenseProc, verbatim: splits when pre-hit HP >= damage+2 into a clone holding
	 * half the post-hit HP (EXP 0 past generation 0), needing a free 4-neighbour.
	 */
	swarmSplit(this: DungeonScene, swarm: Creature, damage: number, preHp: number): void {
		if (preHp < damage + 2) return;
		for (const [dx, dy] of Roguelike.neighbourOffsets(4)) {
			const at = { x: swarm.x + dx, y: swarm.y + dy };
			if (!this.level.passable(at.x, at.y) || (this.isChasmCell(at.x, at.y) && !swarm.flying) || this.creatureAt(at.x, at.y)) continue;
			const clone = this.spawnMonster('swarm', at);
			clone.hp = Math.floor((preHp - damage) / 2);
			swarm.hp -= clone.hp;
			clone.generation = (swarm.generation ?? 0) + 1;
			// `Swarm.split()` copies Burning (reignite), Poison (set to 2), and all
			// AllyBuff/ChampionEnemy buffs to the new actor. The port has no separate
			// buff-class objects, so preserve the equivalent compact state directly.
			if (swarm.buffs['burning'] !== undefined && !buffBlocked(clone, 'burning')) clone.buffs['burning'] = swarm.buffs['burning'];
			if (swarm.buffs['poison'] !== undefined && !buffBlocked(clone, 'poison')) clone.buffs['poison'] = 2;
			clone.champion = swarm.champion;
			clone.championPower = swarm.championPower;
			clone.magicImmune = swarm.magicImmune;
			clone.sleeping = false;
			this.say(t('port.log.swarmsplits'), 'warning');
			return;
		}
	},
};
