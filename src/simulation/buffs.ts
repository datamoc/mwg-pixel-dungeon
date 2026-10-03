import type { SimulationRandom } from './random';
import { BUFF_DURATION_DATA, NEGATIVE_BUFF_DATA } from './mwlBuffDurations';
import { MONSTER_IMMUNITY_DATA } from './mwlMonsterImmunities';

/**
 * Buffs this port models, with Char.java's own hit/damage multipliers (Bless/Hex/Daze scale
 * the *roll*, not the stat - `acuRoll *= 1.25` etc. - so they live here as roll multipliers
 * rather than StatBlock modifiers; Fury/Berserk/Weakness/Vulnerable scale damage the same
 * way). Durations are Java's own (Bless/Hex 30, Daze 5); implementation is a plain
 * turns-left map per creature ticked by the scene's TurnClock, not mwg's applyStatusEffect,
 * because these multipliers apply to transient dice rolls rather than to named stats a
 * StatBlock resolves.
 *
 * `blindness` is the one entry with no roll multiplier of its own: `Level.updateFieldOfView`'s
 * `sighted` test makes a blinded char's field of view empty, so its whole effect is that a blinded
 * creature cannot see - or hunt - the hero (see `dungeonScene`'s monster-perception line), and a
 * blinded hero would see nothing. Duration 10 is `Blindness.DURATION`.
 *
 * `wandUseTracker` is the `ShardOfOblivion.WandUseTracker` presence flag (tag `v3.3.8`): it has no
 * MWL duration entry because nothing spends charges from it - the scene writes the full 50-turn
 * `DURATION` directly on every unidentified wand use and the generic clock ticks it down.
 * `thrownUseTracker` is the matching `ShardOfOblivion.ThrownUseTracker` flag (same tag): the scene
 * writes the same 50-turn `DURATION` on every unidentified landed throw.
 */
export type BuffId = 'bless' | 'hex' | 'daze' | 'vertigo' | 'combo' | 'monkEnergy' | 'chill' | 'frost' | 'drowsy' | 'magicalSleep' | 'fury' | 'berserk' | 'momentum' | 'weakness' | 'vulnerable' | 'doom' | 'burning' | 'poison' | 'bleeding' | 'cripple' | 'paralysis' | 'roots' | 'levitation' | 'featherFall' | 'invisibility' | 'timeStasis' | 'cloak' | 'focus' | 'recharging' | 'scrollEmpower' | 'artifactRecharge' | 'wellFed' | 'frostImbue' | 'fireImbue' | 'toxicImbue' | 'blobImmunity' | 'adrenalineSurge' | 'mindvision' | 'terror' | 'amok' | 'aggression' | 'awareness' | 'haste' | 'stamina' | 'magicalSight' | 'foresight' | 'magicImmune' | 'challengeArena' | 'dread' | 'degrade' | 'ooze' | 'charm' | 'lethalHasteCooldown' | 'wayward' | 'blindness' | 'feintConfusion' | 'counterAbility' | 'light' | 'invulnerability' | 'hazardAssist' | 'spectatorFreeze' | 'duelParticipant' | 'eliminationMatch' | 'luckyTracker' | 'soulmark' | 'prismaticGuard' | 'illuminated' | 'wasIlluminated' | 'holyWeapon' | 'holyWard' | 'powerOfMany' | 'satiatedSpells' | 'shieldOfLight' | 'divineSense' | 'recallUsed' | 'sunrayUsed' | 'sunrayRecent' | 'cleanseImmunity' | 'lanceCooldown' | 'heroDisguise' | 'auraProtection' | 'smiteTracker' | 'guidingPriestCooldown' | 'searingLightCooldown' | 'lightWallActive' | 'lockedFloor' | 'rejuvenatingStepsCooldown' | 'rejuvenatingStepsFurrow' | 'burningActed' | 'oozeActed' | 'beamingRayBoost' | 'wandUseTracker' | 'thrownUseTracker';
/** The duration catalogue is authored in MWL and emitted as an isolated simulation module. */
export const BUFF_DURATION: Record<BuffId, number> = (() => {
	const values = { ...BUFF_DURATION_DATA } as Record<string, number>;
	return values as Record<BuffId, number>;
})();

/** `Char.isImmune()`'s mob half, authored in `resistance-rules.mwl`'s `monsterStatusImmunities`
 * table: whether Java refuses to attach a buff to a monster kind (plus one yogFistType). Pure
 * data lookup so the item-suite harness can pin it without a scene; `combat.ts`'s `buffBlocked`
 * is the live gate that calls it. */
export function monsterBuffImmune(kind: string | undefined, subtype: string | undefined, id: BuffId): boolean {
	if (kind === undefined) return false;
	for (const row of MONSTER_IMMUNITY_DATA) {
		if (row.monster !== kind) continue;
		if (row.subtype !== '' && row.subtype !== subtype) continue;
		if ((row.immunities as readonly string[]).includes(id)) return true;
	}
	return false;
}

/** `Char.Property.STATIC` holders (tag `v3.3.8`): STATIC carries `AllyBuff` immunity,
 * which is what makes them (and BOSS/MINIBOSS kinds, and the AllyBuff-immune ally
 * summons) refuse `WandOfCorruption.corruptEnemy()` into `Doom` instead.
 * `crystalSpire` is this port's mine boss rather than a v3.3.8 class; it is listed
 * here for the same STATIC-shaped reason and is independently covered by the port's
 * own `boss` actor flag. */
const CORRUPTION_IMMUNE_KINDS: ReadonlySet<string> = new Set([
	'crystalSpire', 'demonSpawner', 'pylon', 'rotHeart', 'yog',
]);

/** Ally-summon kinds carrying Java's own `immunities.add(AllyBuff.class)`
 * (`MirrorImage`, `PrismaticImage`, `ShadowClone`, `SpiritHawk`, `NinjaLog`,
 * `EarthGuardian`, `Ward`, `PowerOfMany.LightAlly`, tag `v3.3.8`). WandOfRegrowth.Lotus
 * is separately immune through `Property.STATIC`; Sheep, Ghost and AfterImage have no such
 * immunity, so corruption still takes them. */
const CORRUPTION_IMMUNE_ALLIES: ReadonlySet<string> = new Set([
	'mirror', 'prismatic', 'shadowClone', 'spiritHawk', 'ninjaLog', 'earthGuardian', 'ward', 'lightAlly', 'lotus',
]);

/**
 * Who `WandOfCorruption.corruptEnemy()` dooms instead of corrupting: anything immune
 * to `Corruption` (an `AllyBuff` subclass), i.e. BOSS/MINIBOSS properties, STATIC
 * kinds and the AllyBuff-immune ally summons above. Pure so the zap seam and the
 * suite pin the same gate.
 */
export function corruptionImmune(defender: { boss?: boolean; miniboss?: boolean; kind?: string; allyKind?: string }): boolean {
	if (defender.boss || defender.miniboss) return true;
	if (defender.kind !== undefined && CORRUPTION_IMMUNE_KINDS.has(defender.kind)) return true;
	if (defender.allyKind !== undefined && CORRUPTION_IMMUNE_ALLIES.has(defender.allyKind)) return true;
	return false;
}

/**
 * `DM300.resistances.add(Vertigo.class)` (`actors/mobs/DM300.java`, tag `v3.3.8`): `Char.resist(Vertigo.class)`
 * halves whatever duration `Buff.affect`/`prolong` were about to grant, at every application site (never a full
 * block, unlike `monsterBuffImmune` above). Java's resistances are per-instance-class, static 50%, non-stacking -
 * its own comment calls this out as a simplification it has not revisited. No other monster in this port's covered
 * content carries an instance resistance, so the table is one row; a real second case would grow this into a table
 * like `monsterBuffImmune`'s instead of adding more literal comparisons. */
export function vertigoResistFactor(kind: string | undefined): number {
	return kind === 'dm300' ? 0.5 : 1;
}

/** `Doom` damage amplification (`Char.damage()`, `DwarfKing.isImmune()`,
 * `WandOfRegrowth.Lotus`, tag `v3.3.8`). Doom persists until death. A phase 2/3 Dwarf King
 * may still carry it but is dynamically immune to its multiplier; Lotus rejects every buff.
 * Callers that model incoming HP damage use this shared rule so exceptions do not drift. */
export function doomDamage(damage: number, target: {
	buffs?: Readonly<BuffState>;
	hasDoom?: boolean;
	kind?: string;
	kingPhase?: number;
	allyKind?: string;
	isNPC?: boolean;
}): number {
	if (!(target.hasDoom || target.buffs?.doom !== undefined) || target.isNPC || target.allyKind === 'lotus') return damage;
	if (target.kind === 'king' && (target.kingPhase ?? 1) > 1) return damage;
	// `Char.damage()` keeps a float through source resistance and champion reduction, then
	// Math.rounds once. This helper models the Doom multiply followed by that rounding point.
	return Math.floor(Math.fround(damage * Math.fround(1.67)) + 0.5);
}

/** `Elemental.add(Buff)` (`actors/mobs/Elemental.java`, tag `v3.3.8`): attaching a
 * hate-listed opposite-element buff instead deals `NormalIntRange(HT/2, HT*3/5)`
 * damage with the buff as the source, and the buff never attaches (`return false`).
 * Fire hates Frost/Chill, Frost hates Burning; Shock and Chaos hate nothing (their
 * lists are empty in Java). `NewbornFireElemental` inherits Fire's list. Pure
 * predicate so the suite pins the pairing matrix without a scene; `combat.ts`'s
 * `addBuff`/`reigniteBuff` deal the damage and refuse the attach live. */
export function elementalBacklashApplies(kind: string | undefined, elementalType: string | undefined, id: BuffId): boolean {
	if (kind !== 'elemental' && kind !== 'newbornElemental') return false;
	const type = kind === 'newbornElemental' ? 'fire' : (elementalType ?? 'fire');
	if (type === 'fire') return id === 'frost' || id === 'chill';
	if (type === 'frost') return id === 'burning';
	return false;
}

/** `Char.Property.ICY`'s damage half (`actors/Char.java`, tag `v3.3.8`): `resist()`
 * halves `WandOfFrost` (and `FrostElemental`-sourced) damage with `Math.round`.
 * The only ICY holder in Java is the frost elemental. Pure predicate so each
 * damage seam pins the same gate; the buff-immunity half (Frost/Chill never
 * attach) is a separate, still-open gap. */
export function icyDamageHalved(kind: string | undefined, elementalType: string | undefined): boolean {
	return kind === 'elemental' && (elementalType ?? 'fire') === 'frost';
}

/** `Char.Property.ICY` immunity half (`actors/Char.java`, tag `v3.3.8`): FrostElemental
 * refuses `Frost` and `Chill` through `Char.isImmune`, independently of its Burning backlash. */
export function icyBuffImmune(kind: string | undefined, elementalType: string | undefined, id: BuffId): boolean {
	return kind === 'elemental' && (elementalType ?? 'fire') === 'frost' && (id === 'frost' || id === 'chill');
}

/** `Char.Property.FIERY`'s damage half (`actors/Char.java`, tag `v3.3.8`):
 * `resist()` halves WandOfFireblast and FireElemental-sourced damage with `Math.round`.
 * Every real Elemental (including its Newborn heir) and BurningFist owns this property.
 * Brimstone separately carries only Burning immunity; it does not halve fire damage. */
export function fieryDamageHalved(kind: string | undefined, elementalType: string | undefined, yogFistType: string | undefined): boolean {
	if (kind === 'elemental' || kind === 'newbornElemental') return kind === 'newbornElemental' || (elementalType ?? 'fire') === 'fire';
	return kind === 'yogFist' && yogFistType === 'burning';
}

/** `Char.damage()` rounds once after applying FIERY's 0.5 source resistance. */
export function fieryResistedDamage(damage: number, kind: string | undefined, elementalType: string | undefined, yogFistType: string | undefined): number {
	return fieryDamageHalved(kind, elementalType, yogFistType) ? Math.round(damage * 0.5) : damage;
}

/** `Char.Property.FIERY.resist(FireElemental.class)` halves FireElemental-sourced
 * damage only when the target is itself FIERY (including BurningFist). */
export function fieryElementalSourceDamage(
	damage: number,
	sourceKind: string | undefined,
	sourceType: string | undefined,
	targetKind: string | undefined,
	targetType: string | undefined,
	targetFistType: string | undefined,
): number {
	const fireSource = sourceKind === 'newbornElemental'
		|| (sourceKind === 'elemental' && (sourceType ?? 'fire') === 'fire');
	return fireSource && fieryDamageHalved(targetKind, targetType, targetFistType) ? Math.round(damage * 0.5) : damage;
}

/** `Char.Property.ELECTRIC`'s damage half (`actors/Char.java`, tag `v3.3.8`):
 * `resist()` halves `WandOfLightning`, `Shocking` (enchant procs and the shock
 * arc), `Electricity`, `ShockingDart` and `ShockElemental`-sourced damage with
 * `Math.round`. Holders are the shock elemental, DM100, the Pylon and BrightFist.
 * Pure predicate so the wand, blob and arc seams pin the same gate; `Potential`
 * has no mob-damage seam here, and shocking darts do not exist as an item. */
export function electricDamageHalved(kind: string | undefined, elementalType: string | undefined, yogFistType: string | undefined): boolean {
	if (kind === 'elemental') return (elementalType ?? 'fire') === 'shock';
	if (kind === 'dm100' || kind === 'pylon') return true;
	if (kind === 'yogFist') return yogFistType === 'bright';
	return false;
}

/** The elemental source classes `Char.damage()` resolves through `resist(srcClass)` (`Char.java` 912-913,
 * tag `v3.3.8`): `ICY` resists the `WandOfFrost`/`FrostElemental` classes, `ELECTRIC` the
 * `WandOfLightning`/`Shocking`/`Electricity`/`ShockingDart`/`ShockElemental` classes and `FIERY`
 * the `WandOfFireblast`/`FireElemental` classes - each `0.5` with one `Math.round`. */
export type DamageSourceElement = 'ice' | 'electric' | 'fire';

/** The shared source-class resistance lookup for the scene's `Char.damage()` dispatch
 * (`applyCharacterDamage`'s `sourceElement` option): one place keyed by the source's element and the
 * defender's Properties, instead of a per-source predicate at every damage seam. */
export function sourceElementResisted(
	damage: number,
	element: DamageSourceElement,
	kind: string | undefined,
	elementalType: string | undefined,
	yogFistType: string | undefined,
): number {
	const halved = element === 'ice' ? icyDamageHalved(kind, elementalType)
		: element === 'electric' ? electricDamageHalved(kind, elementalType, yogFistType)
		: fieryDamageHalved(kind, elementalType, yogFistType);
	return halved ? Math.round(damage * 0.5) : damage;
}

/** `Buff.buffType.NEGATIVE` for every buff this port grants to a *monster* (checked against
 * each buff's own Java class at tag `v3.3.8`: `Poison`/`Burning`/`Cripple`/`Weakness`/
 * `Vulnerable`/`Doom`/`Paralysis`/`Roots`/`Terror`/`Ooze`/`Charm`/`Degrade`/`Daze`/`Hex` all set
 * `type = buffType.NEGATIVE`). Used by `Mob.Sleeping.act()`'s "debuffs cause mobs to wake as
 * well" unconditional wake check - a sleeping monster with any of these active wakes
 * immediately, no detection roll needed (e.g. standing in fire/gas already ignites/poisons a
 * sleeping monster elsewhere in this port; it just didn't wake it up before this check
 * existed). `focus`/`cloak`/`lethalHasteCooldown` are this port's own invented
 * stand-ins with no real monster-facing negative equivalent, so they're excluded;
 * `frostImbue`/`fireImbue` are real Java buffs (`FrostImbue.java`/`FireImbue.java`) but
 * hero-side-only positives, excluded for the same reason. */
export const NEGATIVE_BUFFS: ReadonlySet<BuffId> = new Set<BuffId>(NEGATIVE_BUFF_DATA as unknown as BuffId[]);

export type BuffState = Partial<Record<BuffId, number>>;

export interface BuffAppliedEvent {
	type: 'buff-applied';
	id: BuffId;
	fresh: boolean;
}

/** Buff.java-style application: refresh the duration; presentation decides what to announce.
 * `duration` is the per-site override - Java's `Buff.affect(target, class, duration)` - and
 * defaults to the class's own `DURATION` from the authored table, which is what most sites use. */
export function applyBuff(previous: Readonly<BuffState>, id: BuffId, duration = BUFF_DURATION[id]): { buffs: BuffState; event: BuffAppliedEvent } {
    // Poison.set(duration) in actors/buffs/Poison.java (tag v3.3.8) keeps the
    // stronger active clock with Math.max(duration, left) instead of resetting it.
    // Poison is the only ordinary buff whose Java setter has that max semantics;
    // all other callers retain the normal Buff.affect replacement used here.
    const appliedDuration = id === 'poison' && previous[id] !== undefined
        ? Math.max(duration, previous[id] as number)
        : duration;
    return {
        buffs: { ...previous, [id]: appliedDuration },
        event: { type: 'buff-applied', id, fresh: previous[id] === undefined },
    };
}

/**
 * `Burning.reignite(ch, duration)`'s *prolong* semantics, which the shared applier above cannot
 * express: Java raises the remaining time only when the new duration is longer (`if (left <
 * duration) left = duration`), so standing in fire re-arms a full burn without ever shortening one
 * that is already longer. Presentation decides what to announce, as with `applyBuff`.
 */
export function reigniteBuff(previous: Readonly<BuffState>, id: BuffId, duration = BUFF_DURATION[id]): { buffs: BuffState; event: BuffAppliedEvent } {
	const left = previous[id];
	if (left !== undefined && left >= duration) {
		return { buffs: previous, event: { type: 'buff-applied', id, fresh: false } };
	}
	return applyBuff(previous, id, duration);
}

/**
 * Applies one Java `Freezing` impact to a target (`Freezing.freeze()`, tag `v3.3.8`).
 * Each impact *extends* Chill by a few turns (5 in water, 3 dry - `turnsToAdd`, already
 * capped so the total never passes `Chill.DURATION`), it does not refresh it to full;
 * a Chill that reaches the cap becomes the explicit Frost immobilization on the same
 * hit. Callers that compress a whole blob exposure into one application (a quaffed
 * frost potion, a frost-trap trigger) pass a single dry tick and accept the
 * under-application - the alternative this replaced, a full refresh every hit, froze
 * after two contacts where Java needs sustained exposure. Keeping this transition pure
 * prevents potion, trap, and elemental callers from disagreeing about whether the
 * impact freezes immediately or on the next hit. Water-cell callers pass 5.
 * The optional `resistanceMultiplier` is the target's `Char.resist(Chill.class)` fraction
 * for the impacted turn and the resulting Frost/Paralysis timers; Java's
 * `Freezing.freeze()` (`Freezing.java` and `Buff.affect/prolong`, tag `v3.3.8`) scales
 * these clocks before applying them.
 */
export function applyChillFreeze(previous: Readonly<BuffState>, turnsToAdd = 3, resistanceMultiplier = 1): { buffs: BuffState; frozen: boolean } {
	const total = Math.min(BUFF_DURATION.chill, (previous.chill ?? 0) + turnsToAdd * resistanceMultiplier);
	if (total >= BUFF_DURATION.chill) {
		const buffs = { ...previous };
		delete buffs.chill;
		buffs.frost = BUFF_DURATION.frost * resistanceMultiplier;
		buffs.paralysis = Math.max(buffs.paralysis ?? 0, BUFF_DURATION.frost * resistanceMultiplier);
		return { buffs, frozen: true };
	}
	return { buffs: { ...previous, chill: total }, frozen: false };
}

/**
 * Preserves the old tickBuffs order: damage is rolled before decrement/expiry, including
 * duration 0, and keys with undefined values are skipped. These are per-creature timers;
 * area-fire propagation remains a separate scene system. Existing mwg int calls have
 * exclusive upper bounds.
 *
 * `Burning.act()` rolls `NormalIntRange(1, 3 + scalingDepth/4)`, an inclusive range, so the
 * depth-scaled bound is `int(1, 4 + floor(scalingDepth/4))` here. The old fixed `int(1, 3)` was
 * this port's own invention and made fire strictly weaker than Java's at every depth.
 * Damage is returned for the caller to apply, without mutating HP or the input buff map.
 */
/**
 * `ShieldBuff.processDamage()` pool half (tag v3.3.8), shared by every `Char.damage()`
 * seam: the pool absorbs first, HP takes the rest. Pure so the suite pins it once
 * instead of once per seam. Added as the maintained collateral for the DKBarrier multi-seam
 * fix (13th matrix residual).
 */
export function absorbShield(shield: number, damage: number): { shield: number; damage: number } {
	const blocked = Math.min(shield, damage);
	return { shield: shield - blocked, damage: damage - blocked };
}

export function advanceBuffs(previous: Readonly<BuffState>, random: SimulationRandom, scalingDepth = 0, poisonResistant = false): { buffs: BuffState; damage: number } {
	const buffs = { ...previous };
	let damage = 0;
	for (const id of Object.keys(buffs) as BuffId[]) {
		const left = buffs[id];
		if (left === undefined) continue;
		// Java's WellFed.act() owns both its clock and its healing, while Hunger.act() is
		// skipped entirely. `DungeonScene.hungerStep()` ticks it before hunger, so the
		// generic creature-buff clock must leave it untouched.
		if (id === 'wellFed') continue;
		//Java's Burning/Ooze `acted` bits persist for the active buff instance; these
		//serialized markers are state, not clocks of their own.
		if (id === 'burningActed' || id === 'oozeActed') continue;
		// `Doom` has no duration or act method in Java: it lasts until the target dies.
		if (id === 'doom') continue;
		//`RejuvenatingStepsFurrow` is a revive-persistent CounterBuff in Talent.java, not a timer.
		if (id === 'rejuvenatingStepsFurrow') continue;
		if (id === 'burning') {
			//`Burning.act()` removes `Chill` before ticking damage (Burning.java:100, tag `v3.3.8`).
			delete buffs.chill;
			damage += random.int(1, 4 + Math.floor(scalingDepth / 4));
			//`Burning.act()` sets acted before damage (`Burning.java`, tag `v3.3.8`).
			buffs.burningActed = 1;
		}
		//`Poison.act()` (tag v3.3.8): `(int)(left/3)+1` deals off the *remaining*
		//duration, not a flat roll - a fresh 6-turn poison hits for 3, decaying as the clock
		//runs down. The old flat `int(1, 2) (exclusive upper bound: always 1) had no Java
		//behind it and made every poison roughly a third as strong as Java's. Found by the
		//14th monster-analysis matrix (DoT buffs). The tick routes through
		//`Char.damage()`, so a `Poison`-resistant target (the spinner) halves it
		//with `Math.round` - the same `resist()` shape as every other damage
		//class, not a shorter duration.
		if (id === 'poison') {
			const tick = Math.floor(left / 3) + 1;
			damage += poisonResistant ? Math.round(tick / 2) : tick;
		}
		//Bleeding.act(): Java redraws the intensity from NormalFloat(level/2, level),
		//deals round(level), and keeps the new intensity until the next actor turn.
		if (id === 'magicalSleep') continue;
		if (id === 'bleeding') {
			const next = random.normalRange(left / 2, left);
			const tick = Math.round(next);
			if (tick > 0) { damage += tick; buffs[id] = next; }
			else delete buffs[id];
			continue;
		}
		if (left <= 1) {
			delete buffs[id];
			if (id === 'burning') delete buffs.burningActed;
			if (id === 'ooze') delete buffs.oozeActed;
		}
		else buffs[id] = left - 1;
	}
	return { buffs, damage };
}


/** A monster where the turn-end tick needs one: kind, sight, cooldowns and speeds. */
export interface TurnEndMonsterView {
	kind?: string | undefined;
	buffs: { focus?: number | undefined };
	seesHero?: boolean | undefined;
	focusCooldown?: number | undefined;
	ratmogrifiedTurns?: number | undefined;
	ratmogrifiedPermanent?: boolean | undefined;
	hasteTurns?: number | undefined;
	hasteBaseSpeed?: number | undefined;
	speed?: number | undefined;
}

/**
 * Java's Buff.act() boundary for temporary monster speed effects, moved here verbatim
 * from the scene's `afterMonsterTurn` as the file-size refactor's thirty-fourth
 * extraction, behavior-identical (the death-mark tick and the time-bubble spend stay
 * scene-side; the focus attach arrives as a callback since `addBuff` lives outside
 * this directory). The scene keeps the one-line tail.
 */
export function tickMonsterTurnEnd(monster: TurnEndMonsterView, attachFocus: (monster: TurnEndMonsterView) => void): void {
	if (monster.ratmogrifiedTurns !== undefined && !monster.ratmogrifiedPermanent) {
		monster.ratmogrifiedTurns--;
		if (monster.ratmogrifiedTurns <= 0) delete monster.ratmogrifiedTurns;
	}
	if (monster.kind === 'monk' || monster.kind === 'senior') {
		//Monk.spend(): Focus cooldown loses the action time after every own turn.
		//Focus is attached by Monk.act() after that action when the mob is hunting.
		monster.focusCooldown = (monster.focusCooldown ?? 0) - 1;
		if (!monster.buffs['focus'] && monster.seesHero && (monster.focusCooldown ?? 0) <= 0) {
			attachFocus(monster);
		}
	}
	if (monster.hasteTurns) {
		monster.hasteTurns--;
		if (monster.hasteTurns <= 0) {
			monster.speed = monster.hasteBaseSpeed ?? 1;
			delete monster.hasteTurns;
			delete monster.hasteBaseSpeed;
		}
	}
}
