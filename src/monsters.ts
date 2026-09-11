import { SpriteSheet } from 'mwg';
import type { Texture2D } from 'mwg/two-d/render';
import type { GroundItemKind } from './dungeonConstants';
import type { SpdSprites } from './images';
import { MWL_MONSTERS, MWL_SCENARIO_CHAPTERS, MWL_TRAIT_NODES } from './mwlContent';

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
 * (invulnerable NPCs use very large evasion, Goo uses its base state, and Yog is balance-scaled).
 */
const MONSTER_VISUALS: Record<AnyMonsterId, Pick<MonsterDef, 'frame' | 'idle'>> = {
	rat: { frame: [16, 15], idle: 0 },
	snake: { frame: [12, 11], idle: 0 },
	gnoll: { frame: [12, 15], idle: 0 },
	swarm: { frame: [16, 16], idle: 0 },
	crab: { frame: [16, 16], idle: 0 },
	slime: { frame: [14, 12], idle: 0 },
	goo: { frame: [20, 14], idle: 2 },
	skeleton: { frame: [12, 15], idle: 0 },
	ward: { frame: [12, 15], idle: 0 },
	sheep: { frame: [16, 15], idle: 0 },
	earthGuardian: { frame: [12, 15], idle: 0 },
	thief: { frame: [12, 13], idle: 0 },
	dm100: { frame: [16, 14], idle: 0 },
	guard: { frame: [12, 16], idle: 0 },
	necromancer: { frame: [16, 16], idle: 0 },
	tengu: { frame: [14, 16], idle: 0 },
	fetidRat: { frame: [16, 15], idle: 32 },
	gnollTrickster: { frame: [12, 15], idle: 21 },
	greatCrab: { frame: [16, 16], idle: 16 },
	bat: { frame: [15, 15], idle: 0 },
	brute: { frame: [12, 16], idle: 0 },
	shaman: { frame: [12, 15], idle: 0 },
	spinner: { frame: [16, 16], idle: 0 },
	dm200: { frame: [21, 18], idle: 0 },
	dm300: { frame: [25, 22], idle: 0 },
	necroSkeleton: { frame: [12, 15], idle: 0 },
	ghost: { frame: [14, 15], idle: 0 },
	wandmaker: { frame: [12, 14], idle: 0 },
	shopkeeper: { frame: [14, 14], idle: 1 },
	blacksmith: { frame: [13, 16], idle: 0 },
	imp: { frame: [12, 14], idle: 0 },
	ghoul: { frame: [12, 14], idle: 0 },
	elemental: { frame: [12, 14], idle: 0 },
	newbornElemental: { frame: [12, 14], idle: 0 },
	warlock: { frame: [12, 15], idle: 0 },
	monk: { frame: [15, 14], idle: 1 },
	golem: { frame: [17, 19], idle: 0 },
	succubus: { frame: [12, 15], idle: 0 },
	eye: { frame: [16, 18], idle: 0 },
	scorpio: { frame: [17, 17], idle: 0 },
	king: { frame: [16, 16], idle: 0 },
	yog: { frame: [20, 19], idle: 0 },
	yogFist: { frame: [24, 17], idle: 0 },
	demonSpawner: { frame: [16, 16], idle: 0 },
	ripperDemon: { frame: [15, 14], idle: 1 },
	albino: { frame: [16, 15], idle: 16 },
	causticSlime: { frame: [14, 12], idle: 0 },
	bandit: { frame: [12, 13], idle: 21 },
	spectralNecromancer: { frame: [16, 16], idle: 0 },
	armoredBrute: { frame: [12, 16], idle: 21 },
	dm201: { frame: [21, 18], idle: 0 },
	senior: { frame: [15, 14], idle: 18 },
	acidic: { frame: [17, 17], idle: 15 },
	mimic: { frame: [16, 16], idle: 3 },
	crystalMimic: { frame: [16, 16], idle: 3 },
	piranha: { frame: [12, 16], idle: 0 },
	bee: { frame: [16, 16], idle: 0 },
	statue: { frame: [12, 15], idle: 0 },
	armoredStatue: { frame: [12, 15], idle: 0 },
	pylon: { frame: [10, 20], idle: 0 },
	sentry: { frame: [8, 15], idle: 0 },
	rotHeart: { frame: [16, 16], idle: 0 },
	rotLasher: { frame: [12, 16], idle: 0 },
	ratKing: { frame: [16, 17], idle: 0 },
};

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
export const BASE_KIND_ALIASES: Partial<Record<AnyMonsterId, MonsterId>> = (() => {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'actorFlags');
	if (!node) throw new Error('MWL actor rule is missing actorFlags');
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'base_aliases');
	const raw = effect?.attributes.set;
	if (raw === undefined) throw new Error('MWL actor rule is missing base aliases');
	const aliases: Partial<Record<AnyMonsterId, MonsterId>> = {};
	for (const entry of raw.split(';')) {
		const [variant, base] = entry.split('|');
		if (!variant || !base || aliases[variant as AnyMonsterId]) throw new Error(`MWL actor rule has invalid base alias ${entry}`);
		aliases[variant as AnyMonsterId] = base as MonsterId;
	}
	return aliases;
})();

/** Quest-giver/shop/crafting NPCs (`Mob.java` subclasses with `alignment = ALLY` or an
 * unkillable `defenseSkill()`/`damage()` override) - was a 6-case `||` chain in `spawnMonster`. */
export const NPC_KINDS = mwlActorFlagSet('npc');

/** Fixed-floor bosses (Goo/Tengu/DM-300/King/Yog + Yog's own summoned fists) - was a 6-case
 * `||` chain in `spawnMonster`, used to exempt them from the ordinary sleeping-on-spawn and
 * champion-roll rules every regular mob gets. */
export const BOSS_KINDS = mwlActorFlagSet('boss');

/** Kinds that never change cells (`Property.IMMOVABLE` or an equivalent never-moves turn):
 * DM201 (real `IMMOVABLE`, consumes its turn), the Sentry turret and the RotHeart/RotLasher
 * pair (all own their whole turn and never step). Used for Necromancer.summonMinion's
 * "no push if char is immovable" rule - such an occupant is never shoved aside. */
export const IMMOVABLE_KINDS = mwlActorFlagSet('immovable');

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
export const MWL_AI_PROFILES: Readonly<Record<string, string>> = (() => {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'monsterAiProfiles');
	if (!node) throw new Error('MWL actor rule is missing monsterAiProfiles');
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	const raw = effect?.attributes.set;
	if (raw === undefined) throw new Error('MWL actor rule is missing AI profile entries');
	const profiles: Record<string, string> = {};
	for (const entry of raw.split(';')) {
		const [monster, profile] = entry.split('|');
		if (!monster || !profile || profiles[monster]) throw new Error(`MWL actor rule has invalid AI profile ${entry}`);
		profiles[monster] = profile;
	}
	return profiles;
})();

/**
 * Per-kind depth-scaled stat overrides, applied on top of `MONSTERS`' base entry at spawn
 * time. Was a 6-case (7-kind, since Mimic/CrystalMimic shared one formula) nested-ternary
 * chain building `spawnMonster`'s `def`; a lookup keyed by kind reads as the table of formulas
 * it always was. A kind with no entry here spawns at its plain `MONSTERS` stats unmodified.
 */
export const DEPTH_SCALED_STATS: Partial<Record<AnyMonsterId, (depth: number) => Partial<MonsterDef>>> = {
	//Mimic.java scales HP/defence/damage from Dungeon.depth at spawn time. CrystalMimic shares
	//the exact same formula (`extends Mimic`, no override).
	mimic: (depth) => ({
		hp: (1 + depth) * 6,
		accuracy: 6 + depth,
		evasion: 2 + Math.floor(depth / 2),
		damage: [1 + depth, 2 + depth * 2],
		armor: [0, 1 + Math.floor(depth / 2)],
	}),
	crystalMimic: (depth) => DEPTH_SCALED_STATS.mimic!(depth),
	//Piranha.act(): HT=10+depth*5, defense/attack skill=20+depth*2/10+depth*2, EXP=0.
	piranha: (depth) => ({
		hp: 10 + depth * 5,
		accuracy: 20 + depth * 2,
		evasion: 10 + depth * 2,
		damage: [depth, 4 + depth * 2],
		armor: [0, depth],
	}),
	//Bee.java: HT=(2+depth)*4, defense/attack skill=9+depth, damage a 1/10-1/4 HT fraction.
	bee: (depth) => {
		const hp = (2 + depth) * 4;
		return {
			hp,
			accuracy: 9 + depth,
			evasion: 9 + depth,
			damage: [Math.max(1, Math.floor(hp / 10)), Math.max(1, Math.floor(hp / 4))],
			armor: [0, 0],
		};
	},
	//Statue.java scales HP/defense from depth; damage stays its generated-weapon roll (this
	//port's shared combat roll stands in, per the base `statue` entry's own comment above).
	statue: (depth) => ({ hp: 15 + depth * 5, accuracy: 9 + depth, evasion: 4 + depth, damage: [2, 8 + depth], armor: [0, 2 + depth] }),
	armoredStatue: (depth) => ({ hp: 30 + depth * 10, accuracy: 9 + depth, evasion: 4 + depth, damage: [2, 8 + depth], armor: [0, 4 + depth] }),
	//SentryRoom$Sentry.attackSkill(): 20 + depth*2 (HP/EXP are the NPC base 1/0 - unaffected).
	sentry: (depth) => ({ accuracy: 20 + depth * 2 }),
};

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
export const SPRITE_KIND_OVERRIDE: Partial<Record<MonsterId, keyof SpdSprites>> = {
	sheep: 'sheep',
	// `WandOfWarding.WardSprite` has its own six-tier film; it is not a skeleton variant.
	ward: 'wards',
	earthGuardian: 'guardian',
	sentry: 'sentry',
	ratKing: 'ratking',
	rotHeart: 'rotHeart',
	rotLasher: 'rotLasher',
	fetidRat: 'rat',
	gnollTrickster: 'gnoll',
	greatCrab: 'crab',
	necroSkeleton: 'skeleton',
	newbornElemental: 'elemental',
	mimic: 'mimic',
	piranha: 'piranha',
	bee: 'bee',
	statue: 'statue',
};

/** Standard mob rotations are authored in MWL; this adapter preserves the Java region fallback
 * selection while validating every authored row at module initialization. */
export function mobRosterForDepth(depth: number): MonsterId[] {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'monsterRosters');
	if (!node) throw new Error('MWL dungeon roster is missing monsterRosters');
	const effect = (key: string): string => {
		const child = node.children.find((candidate) => candidate.tag === 'effect' && candidate.attributes.apply_to === key);
		if (child?.attributes.set === undefined) throw new Error(`MWL dungeon roster is missing ${key}`);
		return child.attributes.set;
	};
	const parseRoster = (raw: string, separator: string): Map<string, MonsterId[]> => new Map(raw.split(separator).map((entry) => {
		const [key, roster] = entry.split('|');
		if (!key || !roster) throw new Error(`MWL dungeon roster has invalid entry ${entry}`);
		return [key, roster.split(',').map((kind) => kind as MonsterId)];
	}));
	const direct = parseRoster(effect('entries'), ';').get(String(depth));
	if (direct) return direct;
	const region = depth < 6 ? 'sewers' : depth < 11 ? 'caves' : depth < 16 ? 'city' : 'halls';
	const fallback = parseRoster(effect('fallbacks'), ';').get(region);
	if (!fallback) throw new Error(`MWL dungeon roster has no fallback for ${region}`);
	return fallback;
}

// Combat formulas live in the framework-free simulation; retained export for callers.
export { liveStats } from './simulation/combat';

/** Scenario boss transitions are authored in MWL; victory handling remains executable scene code. */
export const BOSSES: Record<number, { kind: MonsterId; victory: string; next: 'continue' | 'end' }> = (() => {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'bossTransitions');
	if (!node) throw new Error('MWL scenario rule is missing bossTransitions');
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	const raw = effect?.attributes.set;
	if (raw === undefined) throw new Error('MWL scenario rule is missing boss transitions');
	const bosses = Object.fromEntries(raw.split(';').map((entry) => {
		const [depthText, kind, next, ...victoryParts] = entry.split('|');
		const depth = Number(depthText);
		const victory = victoryParts.join('|');
		if (!Number.isInteger(depth) || !kind || (next !== 'continue' && next !== 'end') || !victory) {
			throw new Error(`MWL scenario rule has invalid boss transition ${entry}`);
		}
		return [depth, { kind: kind as MonsterId, victory, next: next as 'continue' | 'end' }];
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

const MWL_MOB_LOOT: Array<[string, { chance: number; kind: GroundItemKind }[]]> = (() => {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'monsterLoot');
	if (!node) throw new Error('MWL monster loot rule is missing monsterLoot');
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	const raw = effect?.attributes.set;
	if (raw === undefined) throw new Error('MWL monster loot rule is missing entries');
	return raw.split(';').map((entry) => {
		const [monster, chanceText, kind] = entry.split('|');
		const chance = Number(chanceText);
		if (!monster || !kind || !Number.isFinite(chance) || chance < 0 || chance > 1) {
			throw new Error(`MWL monster loot rule has invalid entry ${entry}`);
		}
		return [monster, [{ chance, kind: kind as GroundItemKind }]];
	});
})();

/** Runtime loot data is read from MWL; the legacy table above remains only as an audit fixture
 * until the remaining Java-specific category and multi-item drops are represented. */
export const MOB_LOOT: Record<string, { chance: number; kind: GroundItemKind }[]> = Object.fromEntries(MWL_MOB_LOOT);

/**
 * `Dungeon.LimitedDrops`: a handful of mobs further scale their own `lootChance()` down with
 * every successful drop this run, on top of the flat `MOB_LOOT` chance above - real Java's own
 * per-kind formula, keyed on how many times `n` this exact drop has already happened. Every kind
 * whose `MOB_LOOT` base chance matches Java's own `lootChance` field gets its decay here.
 */
const LEGACY_LIMITED_DROP_DECAY: Partial<Record<MonsterId, (n: number) => number>> = {
	//Bat.lootChance(): (7-n)/7
	bat: (n) => (7 - n) / 7,
	//Necromancer.lootChance(): (6-n)/6
	necromancer: (n) => (6 - n) / 6,
	//Guard.lootChance(): (1/3)^n
	guard: (n) => Math.pow(1 / 3, n),
	//DM200.lootChance()/Golem.lootChance()/Shaman.lootChance(): all (1/3)^n too
	dm200: (n) => Math.pow(1 / 3, n),
	golem: (n) => Math.pow(1 / 3, n),
	shaman: (n) => Math.pow(1 / 3, n),
	//Slime.lootChance(): SLIME_WEP counter, (1/4)^n
	slime: (n) => Math.pow(1 / 4, n),
	//Skeleton.lootChance(): SKELE_WEP counter, (1/3)^n
	skeleton: (n) => Math.pow(1 / 3, n),
	//Thief.lootChance(): THEIF_MISC counter, (1/3)^n
	thief: (n) => Math.pow(1 / 3, n),
	//Swarm.lootChance(): SWARM_HP counter, (5-n)/5
	swarm: (n) => (5 - n) / 5,
};

const MWL_LIMITED_DROP_DECAY = (() => {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'limitedDropDecay');
	if (!node) throw new Error('MWL monster loot rule is missing limitedDropDecay');
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	const raw = effect?.attributes.set;
	if (raw === undefined) throw new Error('MWL monster loot rule is missing limited-drop entries');
	return Object.fromEntries(raw.split(';').map((entry) => {
		const [monster, mode, valueText] = entry.split('|');
		const value = Number(valueText);
		if (!monster || !mode || !Number.isFinite(value) || value <= 0 || (mode !== 'linear' && mode !== 'power')) {
			throw new Error(`MWL limited-drop rule has invalid entry ${entry}`);
		}
		const decay = mode === 'linear' ? (n: number) => (value - n) / value : (n: number) => Math.pow(1 / value, n);
		return [monster, decay];
	}));
})();

/** The Java-specific decay formulas stay executable hooks; their authored parameters come from
 * MWL and are validated above. */
export const LIMITED_DROP_DECAY: Partial<Record<MonsterId, (n: number) => number>> = MWL_LIMITED_DROP_DECAY;
