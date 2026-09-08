import { SpriteSheet } from 'mwg';
import type { Texture2D } from 'mwg/two-d/render';
import type { GroundItemKind } from './dungeonConstants';

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
	| 'armoredStatue';

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
export const MONSTERS: Record<
	AnyMonsterId,
	{
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
> = {
	//`Rat.java` itself is unchanged since this checkout (same HP/defenseSkill/maxLvl); only
	//its display name changed later, to "marsupial rat" (actors.properties, confirmed at tag
	//v4.0.0-beta) - a flavour-text update, not a new or rebalanced creature
	rat: { hp: 8, accuracy: 8, evasion: 2, damage: [1, 4], armor: [0, 1], frame: [16, 15], idle: 0, exp: 1, maxLvl: 5 },
	snake: { hp: 4, accuracy: 10, evasion: 25, damage: [1, 4], armor: [0, 0], frame: [12, 11], idle: 0, exp: 2, maxLvl: 7 },
	gnoll: { hp: 12, accuracy: 10, evasion: 4, damage: [1, 6], armor: [0, 2], frame: [12, 15], idle: 0, exp: 2, maxLvl: 8 },
	swarm: { hp: 50, accuracy: 10, evasion: 5, damage: [1, 4], armor: [0, 0], frame: [16, 16], idle: 0, exp: 3, maxLvl: 9 },
	crab: { hp: 15, accuracy: 12, evasion: 5, damage: [1, 7], armor: [0, 4], frame: [16, 16], idle: 0, exp: 4, maxLvl: 9 },
	slime: { hp: 20, accuracy: 12, evasion: 5, damage: [2, 5], armor: [0, 0], frame: [14, 12], idle: 0, exp: 4, maxLvl: 9 },
	goo: { hp: 100, accuracy: 10, evasion: 8, damage: [1, 8], armor: [0, 2], frame: [20, 14], idle: 2, exp: 10, maxLvl: 29 },
	skeleton: { hp: 25, accuracy: 12, evasion: 9, damage: [2, 10], armor: [0, 0], frame: [12, 15], idle: 0, exp: 5, maxLvl: 10 },
	thief: { hp: 20, accuracy: 12, evasion: 12, damage: [1, 10], armor: [0, 3], frame: [12, 13], idle: 0, exp: 5, maxLvl: 11 },
	dm100: { hp: 20, accuracy: 11, evasion: 8, damage: [2, 8], armor: [0, 4], frame: [16, 14], idle: 0, exp: 6, maxLvl: 13 },
	guard: { hp: 40, accuracy: 12, evasion: 10, damage: [4, 12], armor: [0, 7], frame: [12, 16], idle: 0, exp: 7, maxLvl: 14 },
	//Necromancer.java has no melee attackSkill of its own (base Char default: attackSkill 0,
	//damageRoll 1) - it is a pure ranged summoner in Java, and never really melees. Standing
	//in for that with its real ranged bolt (`blocker.damage(Random.NormalIntRange(2,10),...)`)
	//and a plain accuracy of 10, since a literal 0 would make it unable to ever land a hit here
	necromancer: { hp: 40, accuracy: 10, evasion: 14, damage: [2, 10], armor: [0, 5], frame: [16, 16], idle: 0, exp: 7, maxLvl: 14 },
	tengu: { hp: 200, accuracy: 10, evasion: 15, damage: [6, 12], armor: [0, 5], frame: [14, 16], idle: 0, exp: 20, maxLvl: 29 },
	fetidRat: { hp: 20, accuracy: 12, evasion: 5, damage: [1, 4], armor: [0, 2], frame: [16, 15], idle: 32, exp: 4, maxLvl: 5 },
	//Ghost Quest types 2/3 (Ghost.java type = depth-1): the Gnoll Trickster reuses GNOLL's
	//own sheet at its own sprite's idle frame (GnollTricksterSprite: TextureFilm(12,15),
	//idle 21 - same precedent as FetidRat reusing rat.png), the Great Crab reuses CRAB at
	//GreatCrabSprite's idle frame 16. Stats are each class's own (Trickster: HP20/eva5/
	//acc16, Gnoll's 1-6 damage; GreatCrab: HP25/eva0 - see rollHit for its block).
	gnollTrickster: { hp: 20, accuracy: 16, evasion: 5, damage: [1, 6], armor: [0, 2], frame: [12, 15], idle: 21, exp: 5, maxLvl: 8 },
	greatCrab: { hp: 25, accuracy: 12, evasion: 0, damage: [1, 7], armor: [0, 4], frame: [16, 16], idle: 16, exp: 6, maxLvl: 9 },
	//Caves roster (Bestiary cases 11-15), each mob's own HP/defenseSkill/attackSkill/
	//damageRoll/drRoll/EXP/maxLvl - films are each sprite's own TextureFilm (bat 15x15,
	//brute 12x16, shaman 12x15, spinner 16x16, dm200 21x18, dm300 25x22), all idling on 0
	bat: { hp: 30, accuracy: 16, evasion: 15, damage: [5, 18], armor: [0, 4], frame: [15, 15], idle: 0, exp: 7, maxLvl: 15 },
	brute: { hp: 40, accuracy: 20, evasion: 15, damage: [5, 25], armor: [0, 8], frame: [12, 16], idle: 0, exp: 8, maxLvl: 16 },
	shaman: { hp: 35, accuracy: 18, evasion: 15, damage: [5, 10], armor: [0, 6], frame: [12, 15], idle: 0, exp: 8, maxLvl: 16 },
	spinner: { hp: 50, accuracy: 22, evasion: 17, damage: [10, 20], armor: [0, 6], frame: [16, 16], idle: 0, exp: 9, maxLvl: 17 },
	dm200: { hp: 80, accuracy: 20, evasion: 12, damage: [10, 25], armor: [0, 8], frame: [21, 18], idle: 0, exp: 9, maxLvl: 17 },
	dm300: { hp: 300, accuracy: 20, evasion: 15, damage: [15, 25], armor: [0, 10], frame: [25, 22], idle: 0, exp: 30, maxLvl: 29 },
	//Necromancer.summonMinion's NecroSkeleton: a real Skeleton with HP 20, WANDERING, no EXP
	necroSkeleton: { hp: 20, accuracy: 12, evasion: 9, damage: [2, 10], armor: [0, 0], frame: [12, 15], idle: 0, exp: 0, maxLvl: 0 },
	ghost: { hp: 999999, accuracy: 0, evasion: 999999, damage: [0, 0], armor: [0, 0], frame: [14, 15], idle: 0, exp: 0, maxLvl: 0 },
	//Wandmaker/Shopkeeper: peaceful NPCs (defenseSkill INFINITE_EVASION, damage() no-op in
	//Java) - same unkillable modelling as the Ghost, at their own sprite films
	wandmaker: { hp: 999999, accuracy: 0, evasion: 999999, damage: [0, 0], armor: [0, 0], frame: [12, 14], idle: 0, exp: 0, maxLvl: 0 },
	shopkeeper: { hp: 999999, accuracy: 0, evasion: 999999, damage: [0, 0], armor: [0, 0], frame: [14, 14], idle: 1, exp: 0, maxLvl: 0 },
	//Blacksmith (TROLL texture at its own 13x16 film) and Imp (IMP = demon.png at its own
	//12x14 film) - quest NPCs, unkillable like the Ghost
	blacksmith: { hp: 999999, accuracy: 0, evasion: 999999, damage: [0, 0], armor: [0, 0], frame: [13, 16], idle: 0, exp: 0, maxLvl: 0 },
	imp: { hp: 999999, accuracy: 0, evasion: 999999, damage: [0, 0], armor: [0, 0], frame: [12, 14], idle: 0, exp: 0, maxLvl: 0 },
	//City roster (Bestiary cases 16-20), each mob's own HP/defenseSkill/attackSkill/
	//damageRoll/drRoll/EXP/maxLvl at each sprite's own TextureFilm (ghoul 12x14,
	//elemental 12x14, warlock 12x15, monk 15x14 idle 1, golem 17x19)
	ghoul: { hp: 45, accuracy: 24, evasion: 20, damage: [16, 22], armor: [0, 4], frame: [12, 14], idle: 0, exp: 5, maxLvl: 20 },
	elemental: { hp: 60, accuracy: 25, evasion: 20, damage: [20, 25], armor: [0, 5], frame: [12, 14], idle: 0, exp: 10, maxLvl: 20 },
	warlock: { hp: 70, accuracy: 25, evasion: 18, damage: [12, 18], armor: [0, 8], frame: [12, 15], idle: 0, exp: 11, maxLvl: 21 },
	monk: { hp: 70, accuracy: 30, evasion: 30, damage: [12, 25], armor: [0, 2], frame: [15, 14], idle: 1, exp: 11, maxLvl: 21 },
	golem: { hp: 120, accuracy: 28, evasion: 15, damage: [25, 30], armor: [0, 12], frame: [17, 19], idle: 0, exp: 12, maxLvl: 22 },
	//Halls roster (Bestiary cases 21-26: succubus 12x15, eye 16x18, scorpio 17x17)
	succubus: { hp: 80, accuracy: 40, evasion: 25, damage: [25, 30], armor: [0, 10], frame: [12, 15], idle: 0, exp: 12, maxLvl: 25 },
	eye: { hp: 100, accuracy: 30, evasion: 20, damage: [20, 30], armor: [0, 10], frame: [16, 18], idle: 0, exp: 13, maxLvl: 26 },
	scorpio: { hp: 110, accuracy: 36, evasion: 24, damage: [30, 40], armor: [0, 16], frame: [17, 17], idle: 0, exp: 14, maxLvl: 27 },
	//DwarfKing.java: HP=HT=300, acc26, eva22, dmg 15-25, dr 0-10, EXP 40 (KingSprite 16x16)
	king: { hp: 300, accuracy: 26, evasion: 22, damage: [15, 25], armor: [0, 10], frame: [16, 16], idle: 0, exp: 40, maxLvl: 29 },
	//YogDzewa, scaled for tier-1 gear: Java HP 1000, beams 20-30, fists HP 300 dmg 18-36.
	//At this port's damage output (~8/turn) real numbers are unwinnable, so HP 400, beams
	//8-16, fists HP 60 dmg 6-12 - stated balance reduction, not a claim about Java.
	yog: { hp: 400, accuracy: 30, evasion: 0, damage: [8, 16], armor: [0, 0], frame: [20, 19], idle: 0, exp: 50, maxLvl: 29 },
	yogFist: { hp: 60, accuracy: 20, evasion: 10, damage: [6, 12], armor: [0, 5], frame: [24, 17], idle: 0, exp: 10, maxLvl: 29 },
	//DemonSpawner (levels/rooms/special/DemonSpawnerRoom.java, Halls only): HP=HT=120,
	//defenseSkill=0 (a flat field, not a formula - real and depth-independent), drRoll
	//+NormalIntRange(0,12), EXP=15. Never attacks (state=PASSIVE, no attackSkill/damageRoll
	//override) - accuracy 0/damage [0,0] model that, same trick as the invincible quest NPCs
	//above but with real HP/evasion, so the hero can actually kill it (see `tickDemonSpawner`
	//for its periodic-spawn behaviour and `attack()`'s damage soft-cap, both in main.ts).
	demonSpawner: { hp: 120, accuracy: 0, evasion: 0, damage: [0, 0], armor: [0, 12], frame: [16, 16], idle: 0, exp: 15, maxLvl: 29 },
	//RipperDemon (actors/mobs/RipperDemon.java): HP=HT=60, defenseSkill(evasion)=22,
	//attackSkill=30, damageRoll Normal(15,25), drRoll +Normal(0,4). maxLvl=-2 (always below any
	//real hero level, so a kill grants 0 XP - Java's own comment marks its EXP=9 as "for
	//corrupting" instead, a system this port doesn't model). Never naturally spawns via the
	//normal per-depth roster (`spawningWeight() == 0`) - only `tickDemonSpawner` creates one.
	//Its real leap-to-target mechanic and faster attack delay aren't modeled, the same
	//"no special movement AI" simplification already applied to every other mob here.
	ripperDemon: { hp: 60, accuracy: 30, evasion: 22, damage: [15, 25], armor: [0, 4], frame: [15, 14], idle: 1, exp: 9, maxLvl: -2 },
	// Bestiary alternative mobs. Where the Java subclass inherits its parent's combat values,
	// those values are repeated here so the scene can treat every spawned id uniformly.
	albino: { hp: 15, accuracy: 8, evasion: 2, damage: [1, 4], armor: [0, 1], frame: [16, 15], idle: 16, exp: 2, maxLvl: 5 },
	causticSlime: { hp: 20, accuracy: 12, evasion: 5, damage: [2, 5], armor: [0, 0], frame: [14, 12], idle: 0, exp: 4, maxLvl: 9 },
	bandit: { hp: 20, accuracy: 12, evasion: 12, damage: [1, 10], armor: [0, 3], frame: [12, 13], idle: 21, exp: 5, maxLvl: 11 },
	spectralNecromancer: { hp: 40, accuracy: 10, evasion: 14, damage: [2, 10], armor: [0, 5], frame: [16, 16], idle: 0, exp: 7, maxLvl: 14 },
	armoredBrute: { hp: 40, accuracy: 20, evasion: 15, damage: [5, 25], armor: [4, 16], frame: [12, 16], idle: 21, exp: 8, maxLvl: 16 },
	dm201: { hp: 120, accuracy: 20, evasion: 12, damage: [15, 25], armor: [0, 8], frame: [21, 18], idle: 0, exp: 9, maxLvl: 17 },
	senior: { hp: 70, accuracy: 30, evasion: 30, damage: [16, 25], armor: [0, 2], frame: [15, 14], idle: 18, exp: 11, maxLvl: 21 },
	acidic: { hp: 110, accuracy: 36, evasion: 24, damage: [30, 40], armor: [0, 16], frame: [17, 17], idle: 15, exp: 14, maxLvl: 27 },
	// Mimic.java scales HP/defence/damage from Dungeon.depth at spawn time; the scene applies
	// that depth scaling below while this catalogue supplies the level-zero shape and chest-art
	// fallback dimensions.
	mimic: { hp: 6, accuracy: 6, evasion: 2, damage: [1, 2], armor: [0, 1], frame: [14, 12], idle: 0, exp: 0, maxLvl: 29 },
	// CrystalMimic reuses MimicSprite's sheet but flees after revealing itself instead of
	// behaving like an ordinary stationary chest ambush.
	crystalMimic: { hp: 6, accuracy: 6, evasion: 2, damage: [1, 2], armor: [0, 1], frame: [14, 12], idle: 0, exp: 0, maxLvl: 29 },
	piranha: { hp: 10, accuracy: 20, evasion: 10, damage: [1, 6], armor: [0, 1], frame: [16, 16], idle: 0, exp: 0, maxLvl: 29 },
	// Bee.java: HT=(2+depth)*4, defense/attack skill=9+depth, EXP=0. The checkout has
	// no BeeSprite asset in the web catalogue, so main.ts reuses the crab sheet dimensions.
	bee: { hp: 12, accuracy: 10, evasion: 10, damage: [1, 3], armor: [0, 0], frame: [16, 16], idle: 0, exp: 0, maxLvl: 29 },
	// Statue.java scales HP/defense from depth and uses its generated weapon for the exact
	// damage roll. The live port preserves the actor and weapon-family reward while using the
	// shared combat roll until weapon instances are attached to monsters.
	statue: { hp: 15, accuracy: 9, evasion: 4, damage: [2, 8], armor: [0, 2], frame: [16, 16], idle: 0, exp: 0, maxLvl: 29 },
	armoredStatue: { hp: 30, accuracy: 9, evasion: 4, damage: [2, 8], armor: [0, 2], frame: [16, 16], idle: 0, exp: 0, maxLvl: 29 },
};

/**
 * `Bestiary.getMobRotation`'s real per-depth entries (depth 5 is `SewerBossLevel`, depth 10
 * `PrisonBossLevel`, depth 15 `CavesBossLevel` - Goo/Tengu/DM-300 alone, handled separately).
 * A repeated id is Java's repeated `Arrays.asList` entry - `Random.element` on this array
 * reproduces the same relative odds a repeated entry gives `Random.Int(list.size())` in Java.
 */
export function mobRosterForDepth(depth: number): MonsterId[] {
	switch (depth) {
		case 1:
			return ['rat', 'rat', 'rat', 'snake'];
		case 2:
			return ['rat', 'rat', 'snake', 'gnoll', 'gnoll'];
		case 3:
			return ['rat', 'snake', 'gnoll', 'gnoll', 'gnoll', 'swarm', 'crab'];
		case 4:
			return ['gnoll', 'swarm', 'crab', 'crab', 'slime', 'slime'];
		case 6:
			return ['skeleton', 'skeleton', 'skeleton', 'thief', 'swarm'];
		case 7:
			return ['skeleton', 'skeleton', 'skeleton', 'thief', 'dm100', 'guard'];
		case 8:
			return ['skeleton', 'skeleton', 'thief', 'dm100', 'dm100', 'guard', 'guard', 'necromancer'];
		case 9:
			return ['skeleton', 'thief', 'dm100', 'dm100', 'guard', 'guard', 'necromancer', 'necromancer'];
		//Bestiary.standardMobRotation cases 11-15 (Caves): 11 is 3xBat/Brute/Shaman, 12 adds
		//a second Brute and a Spinner, 13 doubles Shamans/Spinners plus a DM200, 14-15 double
		//the DM200s
		case 11:
			return ['bat', 'bat', 'bat', 'brute', 'shaman'];
		case 12:
			return ['bat', 'bat', 'brute', 'brute', 'shaman', 'spinner'];
		case 13:
			return ['bat', 'brute', 'brute', 'shaman', 'shaman', 'spinner', 'spinner', 'dm200'];
		case 14:
			return ['bat', 'brute', 'shaman', 'shaman', 'spinner', 'spinner', 'dm200', 'dm200'];
		//Bestiary.standardMobRotation cases 16-19 (City): 3xGhoul/Elemental/Warlock,
		//then Monk joins, then Golem; 19-20 triple the Golems
		case 16:
			return ['ghoul', 'ghoul', 'ghoul', 'elemental', 'warlock'];
		case 17:
			return ['ghoul', 'elemental', 'elemental', 'warlock', 'monk'];
		case 18:
			return ['ghoul', 'elemental', 'warlock', 'warlock', 'monk', 'monk', 'golem'];
		case 19:
			return ['elemental', 'warlock', 'warlock', 'monk', 'monk', 'golem', 'golem', 'golem'];
		//cases 21-26 (Halls): Succubus/Eye, then Scorpio (the depth-19 +Succubus rare and
		//the 1/50 alt-swaps are not modelled)
		case 21:
			return ['succubus', 'succubus', 'eye'];
		case 22:
			return ['succubus', 'eye'];
		case 23:
			return ['succubus', 'eye', 'eye', 'scorpio'];
		case 24:
			return ['succubus', 'eye', 'eye', 'scorpio', 'scorpio', 'scorpio'];
		default:
			return depth < 6
				? ['skeleton', 'thief', 'dm100', 'dm100', 'guard', 'guard', 'necromancer', 'necromancer']
				: depth < 11
					? ['bat', 'brute', 'shaman', 'shaman', 'spinner', 'spinner', 'dm200', 'dm200']
					: depth < 16
						? ['elemental', 'warlock', 'warlock', 'monk', 'monk', 'golem', 'golem', 'golem']
						: ['succubus', 'eye', 'eye', 'scorpio', 'scorpio', 'scorpio'];
	}
}

// Combat formulas live in the framework-free simulation; retained export for callers.
export { liveStats } from './simulation/combat';

/** depth -> which boss owns that level, and what happens once it dies */
export const BOSSES: Record<number, { kind: MonsterId; victory: string; next: 'continue' | 'end' }> = {
	5: { kind: 'goo', victory: 'Goo bursts apart in a spray of ooze. You have slain the Sewers boss!', next: 'continue' },
	10: {
		kind: 'tengu',
		victory: 'Tengu collapses, his tricks spent at last. You have slain the Prison boss!',
		next: 'continue',
	},
	15: { kind: 'dm300', victory: 'DM-300 grinds to a halt. You have slain the Caves boss!', next: 'continue' },
	//DwarfKing.java: HP=HT=300, the City boss; YogDzewa the Halls boss, scaled (see MONSTERS.yog)
	20: { kind: 'king', victory: 'The Dwarf King crumbles from his throne. You have slain the City boss!', next: 'continue' },
	25: { kind: 'yog', victory: 'Yog-Dzewa dissolves into screaming dark. The Amulet lies before you...', next: 'continue' },
};

/**
 * Mob.java loot, simplified to ground-item kinds this port can actually drop: every entry is
 * {chance, kind} rolled once on death via the same "roll whether anything drops, then what"
 * shape as mwg/actors' rollLoot (a single-entry table each, so the call below passes a
 * one-entry LootTable rather than reimplementing the roll).
 */
export const MOB_LOOT: Record<string, { chance: number; kind: GroundItemKind }[]> = {
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
	//DM200's above, weapon-or-armor also simplified to always 'armor'), Succubus scroll 0.33,
	//Eye dewdrop 1.0, Scorpio potion 0.5. Warlock's 0.5 potion drop is handled outside this
	//table entirely (see `kill()`'s own dedicated branch) since its real Java loot picks
	//between healing and non-healing potion classes, a distinction this port's generic
	//'potion' MOB_LOOT kind can't express (drinking that generic id always heals).
	ghoul: [{ chance: 0.2, kind: 'gold' }],
	monk: [{ chance: 0.1, kind: 'food' }],
	golem: [{ chance: 0.2, kind: 'armor' }],
	succubus: [{ chance: 0.33, kind: 'scroll' }],
	eye: [{ chance: 1, kind: 'dewdrop' }],
	scorpio: [{ chance: 0.5, kind: 'potion' }],
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
	//Swarm.lootChance(): `1/(6*(generation+1)) * (5-SWARM_HP.count)/5`, `loot =
	//PotionOfHealing.class`. `generation` (how many times this exact Swarm has split) is
	//always 0 here - Swarm's on-hit split-into-two behaviour is not modeled by this port's
	//monster AI, so every swarm behaves like Java's un-split generation-0 case.
	swarm: [{ chance: 1 / 6, kind: 'potion' }],
};

/**
 * `Dungeon.LimitedDrops`: a handful of mobs further scale their own `lootChance()` down with
 * every successful drop this run, on top of the flat `MOB_LOOT` chance above - real Java's own
 * per-kind formula, keyed on how many times `n` this exact drop has already happened. Every kind
 * whose `MOB_LOOT` base chance matches Java's own `lootChance` field gets its decay here.
 */
export const LIMITED_DROP_DECAY: Partial<Record<MonsterId, (n: number) => number>> = {
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
