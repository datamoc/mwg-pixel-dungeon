import { SpriteSheet } from 'mwg';
import type { Texture2D } from 'mwg/two-d/render';
import type { GroundItemKind } from './dungeonConstants';
import type { SpdSprites } from './images';
import { MWL_MONSTERS, MWL_MONSTER_DEPTH_STATS, MWL_SCENARIO_CHAPTERS, MWL_TABLE_ROWS, MWL_TRAIT_NODES } from './mwlContent';

function mwlActorFlagSet(flag: string): Set<AnyMonsterId> {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'actorFlags');
	if (!node) throw new Error('MWL actor rule is missing actorFlags');
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === flag);
	const value = effect?.attributes.set;
	if (value === undefined) throw new Error(`MWL actor rule actorFlags is missing ${flag}`);
	return new Set(value.split(',').map((entry) => entry.trim()).filter(Boolean) as AnyMonsterId[]);
}

/** a class's real idle-stance frame: tier row 1 (the starting cloth-armour look), column 0 - `HeroSprite.updateArmor()`'s `idle.frames(film, 0, 0, 0, 1, 0, 0, 1, 1)` */
export function heroSheet(texture: Texture2D): SpriteSheet {
	return SpriteSheet.fromTexture(texture, 12, 15);
}

export type MonsterId =
	| 'rat'
	| 'snake'
	| 'gnoll'
	| 'swarm'
	| 'crab'
	| 'slime'
	| 'goo'
	| 'skeleton'
	| 'sheep'
	| 'ninjaLog'
	| 'spiritHawk'
	| 'ward'
	| 'earthGuardian'
	| 'thief'
	| 'dm100'
	| 'guard'
	| 'necromancer'
	| 'necroSkeleton'
	| 'tengu'
	| 'fetidRat'
	| 'gnollTrickster'
	| 'greatCrab'
	| 'bat'
	| 'brute'
	| 'shaman'
	| 'spinner'
	| 'dm200'
	| 'dm300'
	| 'ghost'
	| 'wandmaker'
	| 'shopkeeper'
	| 'blacksmith'
	| 'imp'
	| 'ghoul'
	| 'elemental'
	| 'warlock'
	| 'monk'
	| 'golem'
	| 'succubus'
	| 'eye'
	| 'scorpio'
	| 'king'
	| 'yog'
	| 'yogFist'
	| 'larva'
	| 'demonSpawner'
	| 'ripperDemon'
	| 'mimic'
	| 'crystalMimic'
	| 'piranha'
	| 'bee'
	| 'statue'
	| 'armoredStatue'
	| 'pylon'
	| 'sentry'
	| 'rotHeart'
	| 'rotLasher'
	| 'newbornElemental'
	| 'ratKing';

// Bestiary.swapMobAlts() variants. They deliberately remain distinct ids even when this
// checkout has no separate texture sheet for the variant: their Java stats/loot identity and
// future combat hooks must not be collapsed back into the base mob.
export type MonsterVariantId =
	| 'albino'
	| 'causticSlime'
	| 'bandit'
	| 'spectralNecromancer'
	| 'armoredBrute'
	| 'dm201'
	| 'senior'
	| 'acidic';

export type AnyMonsterId = MonsterId | MonsterVariantId;

/** Java mob classes whose `Char.flying` flag lets them occupy avoid terrain such as chasms. */
export const FLYING_KINDS = mwlActorFlagSet('flying');

/**
 * Mobs carrying `BlobImmunity` (`BlobImmunity.java`, tag `v3.3.8`) - immunity to every harmful
 * blob in the game, fire included. Of the actors this port spawns only the spirit hawk and the
 * piranha have it; the port's only creature-facing blob is fire, so that is where the set is read.
 */
export const BLOB_IMMUNE_KINDS = mwlActorFlagSet('blobImmune');

/**
 * Every real Sewers monster's own base stats (`actors/mobs/*.java`: `HP = HT`,
 * `defenseSkill`, `attackSkill()`'s return, `damageRoll()`'s `Random.NormalIntRange`, and
 * `drRoll()`'s armor addition where a class overrides it - 0 where it doesn't), plus `EXP`
 * and `maxLvl` (`Mob.java`: a kill grants nothing once `Dungeon.hero.lvl > maxLvl` - SPD's way
 * of saying "you have outgrown this floor"; `Rat`'s own `EXP` is the base `Mob` default of 1,
 * since `Rat.java` never overrides it). `frame` and `idle` are each monster's own
 * `*Sprite.java`: the `TextureFilm(w, h)` it cuts its sheet into, and which of that sheet's
 * frames its idle animation actually shows (frame 0 for all but Goo, which idles on frame 2 -
 * frame 0 there is a collapsed, half-flattened pose that reads oddly as a single static
 * portrait).
 *
 * Goo's own numbers here are its *base* (healthy, unpumped) state; `livesStats` below applies
 * its real below-half-health enrage and pump-up multipliers on top of these at combat time,
 * rather than this table trying to hold every state Goo can be in.
 *
 * `fetidRat` is `FetidRat.java` (a `Rat` subclass, reusing `rat.png` at its own sprite's frame
 * 32 rather than frame 0 - `FetidRatSprite`'s own `TextureFilm(16,15)` cut, same sheet) - the
 * unique kill target of the Sad Ghost side quest, not part of any depth's regular rotation.
 * `ghost` is the quest-giver itself: undamageable in Java (`defenseSkill()` returns
 * `INFINITE_EVASION`, `damage()` does nothing), modelled here as effectively unkillable
 * (huge HP and evasion) rather than wiring a real "cannot be targeted" flag through combat.
 */
export interface MonsterDef {
	hp: number;
	accuracy: number;
	evasion: number;
	damage: [number, number];
	armor: [number, number];
	frame: [number, number];
	idle: number;
	exp: number;
	maxLvl: number;
}

/**
 * Monster combat values are authored in `src/content/monsters.mwl` and compiled before
 * TypeScript. This map is the remaining renderer metadata: MWL currently describes portable
 * gameplay data, while sprite film dimensions and idle frame selection belong to this Pixi
 * adapter. The special actors below intentionally retain the port's documented simplifications
 * (invulnerable NPCs use very large evasion, Goo uses its base state, and Yog's HP is
 * balance-scaled to 400 from Java's 1000 - its accuracy is Java's `INFINITE_ACCURACY`, so the
 * DeathGaze always lands as it does in Java).
 */
const MONSTER_VISUALS: Record<AnyMonsterId, Pick<MonsterDef, 'frame' | 'idle'>> = Object.fromEntries(
	MWL_TABLE_ROWS('monsterSpriteFrames', 'monster').map((row) => [String(row.monster), {
		frame: [Number(row.frame_width), Number(row.frame_height)] as [number, number],
		idle: Number(row.idle),
	}]),
) as Record<AnyMonsterId, Pick<MonsterDef, 'frame' | 'idle'>>;

function requiredMonsterNumber(value: number | undefined, key: string): number {
	if (value === undefined) throw new Error(`MWL monster definition is missing ${key}`);
	return value;
}

export const MONSTERS: Record<AnyMonsterId, MonsterDef> = Object.fromEntries(
	MWL_MONSTERS.map((monster) => {
		const id = monster.id as AnyMonsterId;
		const visual = MONSTER_VISUALS[id];
		if (!visual) throw new Error(`Missing MWL monster visual metadata for ${monster.id}`);
		return [id, {
			hp: requiredMonsterNumber(monster.hp, 'hp'),
			accuracy: requiredMonsterNumber(monster.accuracy, 'accuracy'),
			evasion: requiredMonsterNumber(monster.evasion, 'evasion'),
			damage: [requiredMonsterNumber(monster.damage?.[0], 'damage_min'), requiredMonsterNumber(monster.damage?.[1], 'damage_max')],
			armor: [requiredMonsterNumber(monster.armor?.[0], 'armor_min'), requiredMonsterNumber(monster.armor?.[1], 'armor_max')],
			frame: visual.frame,
			idle: visual.idle,
			exp: requiredMonsterNumber(monster.experience, 'experience'),
			maxLvl: requiredMonsterNumber(monster.maxLevel, 'max_level'),
		}];
	}),
) as Record<AnyMonsterId, MonsterDef>;


/**
 * `Bestiary.swapMobAlts()` variants and quest/room minibosses that reuse their family's real
 * Java `extends` relationship for anything keyed off the *base* kind rather than the literal
 * spawned id (sprite-sheet reuse, AI behavior inheritance in `takeMonsterTurn`, champion-roll
 * depth exclusions). Was a 10-case ternary chain in `spawnMonster`
 * (`kind === 'albino' ? 'rat' : kind === 'causticSlime' ? 'slime' : ...`); a lookup here reads
 * as the alias table it always was. A kind with no entry is its own base kind (see
 * `spawnMonster`'s `BASE_KIND_ALIASES[kind] ?? kind` fallback).
 */
export const BASE_KIND_ALIASES: Partial<Record<AnyMonsterId, MonsterId>> = Object.fromEntries(
	MWL_TABLE_ROWS('actorBaseAliases', 'variant').map((row) => [String(row.variant), String(row.base) as MonsterId]),
) as Partial<Record<AnyMonsterId, MonsterId>>;

/** Quest-giver/shop/crafting NPCs (`Mob.java` subclasses with `alignment = ALLY` or an
 * unkillable `defenseSkill()`/`damage()` override) - was a 6-case `||` chain in `spawnMonster`. */
export const NPC_KINDS = mwlActorFlagSet('npc');

/** Fixed-floor bosses (Goo/Tengu/DM-300/King/Yog + Yog's own summoned fists) - was a 6-case
 * `||` chain in `spawnMonster`, used to exempt them from the ordinary sleeping-on-spawn and
 * champion-roll rules every regular mob gets. */
export const BOSS_KINDS = mwlActorFlagSet('boss');

/** Java's `Char.Property.MINIBOSS` (`CrystalGuardian`/`DemonSpawner`/`Elemental.NewbornFireElemental`/
 * `FetidRat`/`FungalSentry`/`GnollSapper`/`GnollTrickster`/`GreatCrab`/`Pylon`/`RotHeart`/`RotLasher`
 * at tag `v3.3.8`) - every one of those this port spawns. Kept separate from `BOSS_KINDS` because
 * Java checks the two properties separately in several places, and the distinction is not cosmetic:
 * `StoneOfAggression` shortens its mark to a quarter for either, `Talent.CombinedLethality` excludes
 * both, and `MonkEnergy`'s gain differs per property. The three Java classes this port does not spawn
 * (CrystalGuardian, FungalSentry, GnollSapper) are simply absent. */
export const MINIBOSS_KINDS = mwlActorFlagSet('miniboss');

/** Java's `Char.Property.UNDEAD`: `DwarfKing`/`Ghoul`/`Guard`/`Monk`/`Necromancer`/`RipperDemon`/
 * `Skeleton`/`Thief`/`Warlock`/`Wraith` at tag `v3.3.8`, with each subclass inheriting it
 * (`NecroSkeleton`, `SpectralNecromancer`, `Bandit`, `Senior`) - so every ported member is here by
 * its own id. `Wraith` is the one Java class in the list this port does not spawn.
 * `WandOfTransfusion` is the site that reads it alone (undead are harmed rather than charmed). */
export const UNDEAD_KINDS = mwlActorFlagSet('undead');

/** Java's `Char.Property.DEMONIC`: `DemonSpawner`/`Eye`/`FetidRat`/`Goo`/`Mimic`/`RipperDemon`/
 * `Scorpio`/`Succubus`/`YogDzewa`/`YogFist`, again with subclasses inheriting (`CrystalMimic`,
 * `Acidic`). Note `RipperDemon` carries *both* properties in Java - it is in both sets here. */
export const DEMONIC_KINDS = mwlActorFlagSet('demonic');

/** `Char.Property.UNDEAD || Char.Property.DEMONIC` - the test Java repeats in every holy effect:
 * `HolyBomb`, `HolyLance`, `Smite`, `Sunray`, `HolyDart` and `WandOfPrismaticLight` (whose damage
 * is x1.333 against such a target). Kept as one helper because the port's predecessors of these
 * checks were hand-written kind lists, and each of them was a different subset: a transfusion
 * wand list missing Guard/Monk/Thief and a holy-bomb list missing every demon. */
export function isUndeadOrDemonic(kind: AnyMonsterId | undefined): boolean {
	return kind !== undefined && (UNDEAD_KINDS.has(kind) || DEMONIC_KINDS.has(kind));
}

/** Kinds that never change cells (`Property.IMMOVABLE` or an equivalent never-moves turn):
 * DM201 (real `IMMOVABLE`, consumes its turn), the Sentry turret and the RotHeart/RotLasher
 * pair (all own their whole turn and never step). Used for Necromancer.summonMinion's
 * "no push if char is immovable" rule - such an occupant is never shoved aside. */
export const IMMOVABLE_KINDS = mwlActorFlagSet('immovable');

/**
 * Java's `Char.Property.INORGANIC` members this port spawns (`Char.java`, tag `v3.3.8`),
 * authored in `actor-rules.mwl`'s `actorFlags` like every other property set: immune to
 * Bleeding/ToxicGas/Poison. The two buffs are enforced through `monsterStatusImmunities` at the
 * shared buff boundary; ToxicGas is a blob, so `dungeonScene.ts`'s `isToxicImmune` reads this
 * set (plus the rusted fist, which carries the property by subtype) directly.
 */
export const INORGANIC_KINDS = mwlActorFlagSet('inorganic');

/** Kinds that spawn already awake (real Java `state = PASSIVE`/`WANDERING` from the start,
 * never `SLEEPING`): Ghost-quest mobs (FetidRat/GnollTrickster/GreatCrab, spawned mid-quest
 * with the hero already nearby, not lying in ambush), DemonSpawner/Sentry/RotHeart/RotLasher
 * (each `PASSIVE` from spawn in real Java), and the newborn fire elemental (spawned by a lit
 * ritual, already alert). `NPC_KINDS`/`BOSS_KINDS` are exempted from ordinary sleeping-on-spawn
 * separately, so aren't repeated here. **2026-09-09 code-quality pass, user-flagged**: was an
 * 8-case `||` chain in `spawnMonster` that had grown by one clause with each newly-ported kind
 * needing this exemption - exactly the "OR-chain that grows linearly with every new case"
 * smell ROADMAP.md's own code-quality note calls out, moved into a table for the same reason
 * `NPC_KINDS`/`BOSS_KINDS`/`IMMOVABLE_KINDS` already were. */
export const NEVER_SLEEPS_KINDS = mwlActorFlagSet('never_sleeps');

/** Monster special-turn profiles are authored in MWL; TypeScript only supplies hook bodies. */
export const MWL_AI_PROFILES: Readonly<Record<string, string>> = Object.fromEntries(
	MWL_TABLE_ROWS('monsterAiProfiles', 'monster').map((row) => [String(row.monster), String(row.profile)]),
);

/**
 * Per-kind depth-scaled stat overrides, applied on top of `MONSTERS`' base entry at spawn
 * time. Was a 6-case (7-kind, since Mimic/CrystalMimic shared one formula) nested-ternary
 * chain building `spawnMonster`'s `def`; a lookup keyed by kind reads as the table of formulas
 * it always was. A kind with no entry here spawns at its plain `MONSTERS` stats unmodified.
 */
function scaledStat(base: number | undefined, perDepth: number | undefined, divisor: number | undefined, depth: number, floor = 0): number | undefined {
	if (base === undefined && perDepth === undefined) return undefined;
	const numerator = (base ?? 0) + (perDepth ?? 0) * depth;
	const value = divisor && divisor > 0 ? Math.floor(numerator / divisor) : numerator;
	return floor > 0 ? Math.max(floor, value) : value;
}

function depthScaledStats(rule: typeof MWL_MONSTER_DEPTH_STATS[string], depth: number): Partial<MonsterDef> {
	const hp = scaledStat(rule.hpBase, rule.hpPerDepth, undefined, depth);
	const accuracy = scaledStat(rule.accuracyBase, rule.accuracyPerDepth, undefined, depth);
	const evasion = scaledStat(rule.evasionBase, rule.evasionPerDepth, rule.evasionDivisor, depth);
	const damageMin = scaledStat(rule.damageMinBase, rule.damageMinPerDepth, rule.damageMinDivisor, depth, rule.damageMinFloor);
	const damageMax = scaledStat(rule.damageMaxBase, rule.damageMaxPerDepth, rule.damageMaxDivisor, depth, rule.damageMaxFloor);
	const armorMin = scaledStat(rule.armorMinBase, rule.armorMinPerDepth, rule.armorMinDivisor, depth);
	const armorMax = scaledStat(rule.armorMaxBase, rule.armorMaxPerDepth, rule.armorMaxDivisor, depth);
	return {
		...(hp === undefined ? {} : { hp }), ...(accuracy === undefined ? {} : { accuracy }),
		...(evasion === undefined ? {} : { evasion }),
		...(damageMin === undefined && damageMax === undefined ? {} : { damage: [damageMin ?? 0, damageMax ?? 0] as [number, number] }),
		...(armorMin === undefined && armorMax === undefined ? {} : { armor: [armorMin ?? 0, armorMax ?? 0] as [number, number] }),
	};
}

/** Depth-scaled actor formulas are authored in `actor-rules.mwl`; this adapter only evaluates
 * their closed arithmetic shapes. Values are sourced from the corresponding SPD mob classes. */
export const DEPTH_SCALED_STATS: Partial<Record<AnyMonsterId, (depth: number) => Partial<MonsterDef>>> = Object.fromEntries(
	Object.entries(MWL_MONSTER_DEPTH_STATS).map(([kind, rule]) => [kind, (depth: number) => depthScaledStats(rule, depth)]),
) as Partial<Record<AnyMonsterId, (depth: number) => Partial<MonsterDef>>>;

/**
 * Sprite-sheet reuse for kinds with no dedicated asset of their own (a quest miniboss texturing
 * its base family's sheet at its own idle frame, or a mob standing in on a visually-similar
 * sheet - `FetidRatSprite` on `rat.png:32`, `GnollTricksterSprite` on `gnoll.png:21`,
 * `GreatCrabSprite` on `crab.png:16`, all three real Java sprite classes `texture()`-ing their
	 * base family's sheet unchanged). Was a 12-case cascade in `spawnMonster` checking both
 * `kind` and `baseKind` (`kind === 'sentry' ? ... : kind === 'ratKing' ? ... : ... : baseKind
 * === 'fetidRat' ? ... : ...`) - collapses to one lookup keyed by `baseKind` alone, since every
 * kind checked against `kind` directly (`sentry`/`ratKing`/`rotHeart`/`rotLasher`) has no
 * `BASE_KIND_ALIASES` entry of its own, so `baseKind` already equals `kind` for each of them.
 */
export const SPRITE_KIND_OVERRIDE: Partial<Record<MonsterId, keyof SpdSprites>> = Object.fromEntries(
	MWL_TABLE_ROWS('monsterSpriteOverrides', 'monster').map((row) => [String(row.monster), String(row.sprite)]),
) as Partial<Record<MonsterId, keyof SpdSprites>>;

/** Standard mob rotations are authored as typed MWL tables (`monsterRosterByDepth` /
 * `monsterRosterFallback`); this adapter preserves the Java region fallback selection. */
const rosterOf = (row: Readonly<Record<string, unknown>>): MonsterId[] =>
	(Array.isArray(row.roster) ? row.roster.map((kind) => String(kind) as MonsterId) : []);
const ROSTER_BY_DEPTH = new Map(MWL_TABLE_ROWS('monsterRosterByDepth', 'depth').map((row) => [String(row.depth), rosterOf(row)]));
const ROSTER_FALLBACK = new Map(MWL_TABLE_ROWS('monsterRosterFallback', 'region').map((row) => [String(row.region), rosterOf(row)]));

export function mobRosterForDepth(depth: number): MonsterId[] {
	const direct = ROSTER_BY_DEPTH.get(String(depth));
	if (direct) return direct;
	const region = depth < 6 ? 'sewers' : depth < 11 ? 'caves' : depth < 16 ? 'city' : 'halls';
	const fallback = ROSTER_FALLBACK.get(region);
	if (!fallback) throw new Error(`MWL dungeon roster has no fallback for ${region}`);
	return fallback;
}

// Combat formulas live in the framework-free simulation; retained export for callers.
export { liveStats } from './simulation/combat';

/** Scenario boss transitions are authored in MWL; victory handling remains executable scene code. */
export const BOSSES: Record<number, { kind: MonsterId; victory: string; next: 'continue' | 'end' }> = (() => {
	// `bossTransitions` is an MWG typed MWL table now; only the `next` column's closed set and the
	// chapter cross-check remain game-side.
	const bosses = Object.fromEntries(MWL_TABLE_ROWS('bossTransitions', 'depth').map((row) => {
		const depth = Number(row.depth);
		const kind = String(row.kind);
		const next = String(row.next);
		if (!Number.isInteger(depth) || !kind || (next !== 'continue' && next !== 'end')) {
			throw new Error(`MWL scenario rule has invalid boss transition ${kind}`);
		}
		return [depth, { kind: kind as MonsterId, victory: String(row.victory), next: next as 'continue' | 'end' }];
	})) as Record<number, { kind: MonsterId; victory: string; next: 'continue' | 'end' }>;
	for (const chapter of MWL_SCENARIO_CHAPTERS) {
		const boss = bosses[chapter.bossDepth];
		if (!boss || boss.kind !== chapter.bossKind) throw new Error(`MWL scenario chapter ${chapter.id} does not match its boss transition`);
	}
	return bosses;
})();

/**
 * Mob.java loot, simplified to ground-item kinds this port can actually drop: every entry is
 * {chance, kind} rolled once on death via the same "roll whether anything drops, then what"
 * shape as mwg/actors' rollLoot (a single-entry table each, so the call below passes a
 * one-entry LootTable rather than reimplementing the roll).
 */
const LEGACY_MOB_LOOT: Record<string, { chance: number; kind: GroundItemKind }[]> = {
	//Sewers base loot, found missing entirely while auditing every real spawnable kind
	//against MOB_LOOT: Snake.loot = Generator.Category.SEED (0.25), Gnoll.loot = Gold.class
	//(0.5), Crab.loot = MysteryMeat.class (0.167, ~1/6) - Rat and Goo have no `loot` field in
	//Java at all, correctly no entry here.
	snake: [{ chance: 0.25, kind: 'seed' }],
	//RotLasher.loot = Generator.Category.SEED at 0.75.
	rotLasher: [{ chance: 0.75, kind: 'seed' }],
	gnoll: [{ chance: 0.5, kind: 'gold' }],
	crab: [{ chance: 1 / 6, kind: 'meat' }],
	// Alternative mobs inherit their base loot table unless Java replaces it with a
	// guaranteed special item; these entries make the inheritance explicit to callers.
	albino: [{ chance: 1, kind: 'meat' }],
	causticSlime: [{ chance: 0.5, kind: 'meat' }],
	bandit: [{ chance: 1, kind: 'gold' }],
	spectralNecromancer: [{ chance: 0.2, kind: 'potion' }],
	armoredBrute: [{ chance: 1, kind: 'armor' }],
	dm201: [{ chance: 0.125, kind: 'armor' }],
	senior: [{ chance: 1, kind: 'food' }],
	acidic: [{ chance: 1, kind: 'potion' }],
	piranha: [{ chance: 1, kind: 'meat' }],
	dm100: [{ chance: 0.25, kind: 'scroll' }],
	guard: [{ chance: 0.2, kind: 'armor' }],
	necromancer: [{ chance: 0.2, kind: 'potion' }],
	bat: [{ chance: 1 / 6, kind: 'potion' }],
	brute: [{ chance: 0.5, kind: 'gold' }],
	shaman: [{ chance: 0.03, kind: 'wand' }],
	spinner: [{ chance: 0.125, kind: 'meat' }],
	//DM200.lootChance() base is really 0.2 (this port previously had 0.125, an unconfirmed
	//guess with no derivation from Java's actual field); Java also picks weapon-or-armor 50/50
	//(`Random.oneOf(WEAPON,ARMOR)`), simplified here to always 'armor' - not newly introduced,
	//tracked in `PORT_COVERAGE.md`'s `MOB_LOOT`/`LIMITED_DROP_DECAY` row.
	dm200: [{ chance: 0.2, kind: 'armor' }],
	//GnollTrickster.createLoot: MISSILE at half quantity, always - a stone here
	gnollTrickster: [{ chance: 1, kind: 'stone' }],
	//GreatCrab: 2x MysteryMeat, always - one lands on the cell, the second beside it (or the
	//bag when crowded); heaps stack in Java, single-item cells here do not
	greatCrab: [{ chance: 1, kind: 'meat' }],
	//City/Halls loot: Ghoul gold 0.2, Monk food ~0.083 (rounded to 0.1), Golem armor
	//0.2 (Java's real base - the previous 0.125 here was the same unconfirmed-guess bug as
	//DM200's above, weapon-or-armor also simplified to always 'armor'), Eye dewdrop 1.0.
	//Warlock/Scorpio's 0.5 potion drops and Succubus's 0.33 scroll drop are all handled
	//outside this table entirely (see `kill()`'s own dedicated branches) since their real
	//Java loot each excludes specific classes this port's generic 'potion'/'scroll' MOB_LOOT
	//kinds can't express (drinking/reading the generic id always resolves to one of exactly
	//the classes each of these three is required to avoid).
	ghoul: [{ chance: 0.2, kind: 'gold' }],
	monk: [{ chance: 0.1, kind: 'food' }],
	golem: [{ chance: 0.2, kind: 'armor' }],
	eye: [{ chance: 1, kind: 'dewdrop' }],
	//DemonSpawner: `loot = PotionOfHealing.class; lootChance = 1f;` - a real, guaranteed drop,
	//simplified like every other potion-class loot here to the shared generic 'potion' kind
	//rather than a specific PotionOfHealing sprite/effect.
	demonSpawner: [{ chance: 1, kind: 'potion' }],
	//Slime.lootChance() base 0.2, drops a random WEP_T2 melee weapon - this port has no
	//weapon-specific ground-item kind (see `portItemKind`'s own `weapon -> 'armor'` fold), so
	//it reuses the same weapon-as-'armor' stand-in dm200/golem already use above.
	slime: [{ chance: 1 / 5, kind: 'armor' }],
	//Skeleton.lootChance() base 0.1667 (~1/6), `loot = Generator.Category.WEAPON` (any tier,
	//not just T2 like Slime) - same weapon-as-'armor' stand-in.
	skeleton: [{ chance: 1 / 6, kind: 'armor' }],
	//Thief.lootChance() base 0.03, `loot = Random.oneOf(RING, ARTIFACT)` - collapsed to the
	//single 'ring' kind (this port's `portItemKind` already folds Artifact into the shared
	//'wand' kind, which would make Thief's drop indistinguishable from a real wand pickup;
	//'ring' stays a closer, still-distinct stand-in for "rare misc treasure").
	thief: [{ chance: 0.03, kind: 'ring' }],
	//Swarm.lootChance(): `1/(6*(generation+1)) * (5-SWARM_HP.count)/5`,
	//`loot = PotionOfHealing.class`. `generation` is persisted and incremented by
	//`swarmSplit()` so split descendants receive Java's reduced loot chance.
	swarm: [{ chance: 1 / 6, kind: 'potion' }],
};

const MWL_MOB_LOOT: Array<[string, { chance: number; kind: GroundItemKind }[]]> = MWL_TABLE_ROWS('monsterLoot', 'monster').map((row) => [
	String(row.monster),
	[{ chance: Number(row.chance), kind: String(row.kind) as GroundItemKind }],
]);

/** Runtime loot data is read from MWL; the legacy table above remains only as an audit fixture
 * until the remaining Java-specific category and multi-item drops are represented. */
export const MOB_LOOT: Record<string, { chance: number; kind: GroundItemKind }[]> = Object.fromEntries(MWL_MOB_LOOT);

/**
 * `Dungeon.LimitedDrops`: a handful of mobs further scale their own `lootChance()` down with
 * every successful drop this run, on top of the flat `MOB_LOOT` chance above - real Java's own
 * per-kind formula, keyed on how many times `n` this exact drop has already happened. Every kind
 * whose `MOB_LOOT` base chance matches Java's own `lootChance` field gets its decay here.
 * `mode`/`value` are authored in `limitedDropDecay` (`loot-rules.mwl`): `linear` is `(value-n)/
 * value` (`Bat.lootChance()` value=7, `Necromancer.lootChance()` value=6, `Swarm.lootChance()`'s
 * `SWARM_HP` counter value=5), everything else is `(1/value)^n` (`Guard`/`DM200`/`Golem`/
 * `Shaman.lootChance()` value=3, `Slime.lootChance()`'s `SLIME_WEP` counter value=4,
 * `Skeleton.lootChance()`'s `SKELE_WEP` counter and `Thief.lootChance()`'s `THEIF_MISC` counter
 * both value=3). **2026-09-14:** removed this file's own dead `LEGACY_LIMITED_DROP_DECAY` object
 * literal, which hand-duplicated these same ten formulas and had no remaining reader anywhere -
 * this comment now carries forward the Java citations it used to hold.
 */
const MWL_LIMITED_DROP_DECAY = Object.fromEntries(MWL_TABLE_ROWS('limitedDropDecay', 'monster').map((row) => {
	const value = Number(row.value);
	const mode = String(row.mode);
	const decay = mode === 'linear' ? (n: number) => (value - n) / value : (n: number) => Math.pow(1 / value, n);
	return [String(row.monster), decay];
}));

/** The Java-specific decay formulas stay executable hooks; their authored parameters come from
 * MWL and are validated above. */
export const LIMITED_DROP_DECAY: Partial<Record<MonsterId, (n: number) => number>> = MWL_LIMITED_DROP_DECAY;
