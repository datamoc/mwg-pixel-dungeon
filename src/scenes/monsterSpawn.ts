import type { Texture } from 'pixi.js';
import { AnimatedSprite, Random, SpriteSheet } from 'mwg';
import { baseCreature, type Creature } from '../combat';
import { TILE } from '../dungeonConstants';
import { SPRITE_ANIMATIONS } from '../generated/spriteAnimations';
import { MOB_KEYS, t } from '../i18n/index';
import { SPRITE_KIND_OVERRIDE, type AnyMonsterId } from '../monsters';
import { runState } from '../runState';
import { placeCharacterArt } from '../ui/characterPlacement';
import type { monsterSpawnProfile } from '../actors/monsterSpawn';
import type { Step } from '../simulation/combatState';

/**
 * `DungeonScene.spawnMonster`'s two construction halves, extracted unchanged (comments included) so the
 * scene keeps only the wiring: the animated sprite cut from the monster's own sheet, and the `Creature`
 * record built from its spawn profile.
 */
export type MonsterProfile = ReturnType<typeof monsterSpawnProfile>;
export type AllyKind = 'mirror' | 'sheep' | 'ward' | 'earthGuardian' | 'lotus' | 'ghost' | 'ninjaLog' | 'spiritHawk' | 'afterImage' | 'shadowClone' | 'prismatic';

/** An ally's persistent identity tint (`spawnMonster`'s own `sprite.colorAdd` set at spawn,
 * matched by the per-frame hit-flash fade-out below, which must restore *this* baseline rather
 * than hard-zeroing it - `colorAdd` is shared between the two effects, and a flashed ally used to
 * lose its tint for good on the very next frame since the fade-out didn't know a baseline existed
 * (found live: a hit Sheep permanently faded to its unlit art within one frame of spawning). */
export function allyIdentityColorAdd(isAlly: boolean | undefined, allyKind: string | undefined): number {
	if (!isAlly) return 0;
	switch (allyKind) {
		case 'sheep': return 0xdddddd;
		case 'earthGuardian': return 0x997744;
		case 'lotus': return 0x55aa66;
		//`mirror`/`ghost`/`ninjaLog`/`spiritHawk`/`afterImage`/`shadowClone` and any future ally
		//kind all share this one default, exactly as the original inline ternary did.
		default: return 0x5577aa;
	}
}

/** `ChampionEnemy.java`'s own per-type `color` field, in its declaration order - see
 * `spawnMonster`'s tint application for why this is a flat sprite tint rather than the real
 * `sprite.aura(color)` glow ring, a primitive this port's sprite system has no equivalent for. */
const CHAMPION_TINT: Record<NonNullable<Creature['champion']>, number> = {
	blazing: 0xFF8800,
	projecting: 0x8800FF,
	antimagic: 0x00FF00,
	giant: 0x0088FF,
	blessed: 0xFFFF00,
	growing: 0xFF2222,
};

/** any monster in MONSTERS, cut from its own real sprite sheet at its own real frame size */
export function buildMonsterSprite(kind: AnyMonsterId, at: Step, profile: MonsterProfile, wardTexture: (texture: Texture, tier: number) => Texture): AnimatedSprite {
	const { def, adjustedDef, baseKind } = profile;
	const texture = runState.sprites[SPRITE_KIND_OVERRIDE[baseKind] ?? (baseKind as keyof typeof runState.sprites)];
	const sheet = SpriteSheet.fromTexture(texture, adjustedDef.frame[0], adjustedDef.frame[1]);
	// WardSprite's frames are variable-width and therefore cannot be represented by the
	// regular SpriteSheet grid used by ordinary mobs.
	//`MimicSprite.hideMimic()`: a hidden mimic shows its chest frames (0 and 1 of the sheet), not its idle
	//pose - the revealed frame is restored by `syncMimicVisual`.
	const sprite = new AnimatedSprite(kind === 'ward' ? wardTexture(texture, 1) : sheet.get(kind === 'mimic' ? 0 : def.idle));
	placeCharacterArt(sprite);
	// Java's base variants use MWG's player. Shaman/elemental/fist variants and
	// DM300 supercharge effects still follow the port's reduced gameplay roster.
	//SPRITE_ANIMATIONS keys off each Java sprite class's own name (SpawnerSprite -> "spawner",
	//RipperSprite -> "ripper"), not the MonsterId - same reason necroSkeleton/yogFist alias.
	const clips = SPRITE_ANIMATIONS[
		kind === 'phantomPiranha' ? '__no_phantom_clip__'
		: kind === 'necroSkeleton' ? 'skeleton'
			: kind === 'yogFist' ? 'fist'
			: kind === 'demonSpawner' ? 'spawner'
			: kind === 'ripperDemon' ? 'ripper'
			: kind === 'impShopkeeper' ? 'imp'
			: baseKind.toLowerCase()
	];
	if (clips) {
		for (const [name, clip] of Object.entries(clips)) sprite.add(name, clip.frames.map(frame => sheet.get(frame)), clip);
		sprite.play('idle');
	}
	sprite.x = at.x * TILE;
	sprite.y = at.y * TILE;
	//`ChampionEnemy.fx()`: `target.sprite.aura(color)`, a persistent glow ring this port's
	//sprite system has no equivalent primitive for (`TintedSprite` only exposes a flat
	//`tint`/`setColorAdd`, not a separate under-sprite ring layer) - approximated as a flat
	//tint in the buff's own real colour instead, the same practical stand-in this file
	//already reaches for elsewhere (e.g. an armed noisemaker's `sprite.tint = 0xff4444`).
	//Real Java colours, in `ChampionEnemy.java`'s own declaration order: Blazing 0xFF8800,
	//Projecting 0x8800FF, AntiMagic 0x00FF00, Giant 0x0088FF, Blessed 0xFFFF00, Growing
	//0xFF0000. Previously no champion type had any visual treatment at all.
	if (profile.champion) sprite.tint = CHAMPION_TINT[profile.champion];
	return sprite;
}

export function buildMonsterCreature(kind: AnyMonsterId, at: Step, profile: MonsterProfile, isAlly: boolean, allyKind: AllyKind | undefined, mimicLoot: string | undefined): Creature {
	const { def, adjustedDef } = profile;
	return baseCreature({
		//a base mimic starts hidden (`Mimic`: NEUTRAL + PASSIVE) and is named for the chest it imitates
		name: kind === 'mimic' ? t('items.heap.chest') : t(MOB_KEYS[kind] ?? MOB_KEYS.statue),
		x: at.x,
		y: at.y,
		hp: adjustedDef.hp,
		maxHp: adjustedDef.hp,
		accuracy: def.accuracy,
		evasion: def.evasion,
		damage: def.damage,
		armor: def.armor,
		kind,
		//`Char.Property.BOSS`/`MINIBOSS` as plain combat data, so `rollDamage` can key the
		//rules Java keys on them (the Aggression half-damage branch) without importing the
		//monster catalogue into `simulation/`. Java checks the two properties *separately*,
		// so they stay two flags rather than one `isBoss` - see `MINIBOSS_KINDS`.
		boss: profile.isBoss,
		miniboss: profile.miniboss,
		//Java's Bat/Bee/Elemental/Eye/Swarm/Ghost classes set flying=true (Newborn
		//Elemental inherits it); YogFist.java does not and remains grounded.
		flying: profile.flying,
		//Elemental.random() selects one of four concrete kits; this port keeps one shared
		//elemental actor/sprite but preserves the subtype for its real loot consequence.
		elementalType: profile.elementalType,
		//Shaman.random() (Shaman.java, tag v3.3.8): 40% red/Weakness, 30% blue/Vulnerable,
		//30% purple/Hex, selected by one draw.
		shamanType: profile.shamanType,
		pumped: kind === 'goo' ? 0 : undefined,
		gooHealInc: kind === 'goo' ? 1 : undefined,
		focusCooldown: kind === 'monk' || kind === 'senior' ? 0 : undefined,
		isNPC: profile.isNPC,
		isAlly,
		allyKind,
		npcKind: profile.isNPC ? (kind as 'ghost' | 'wandmaker' | 'shopkeeper' | 'blacksmith' | 'imp' | 'ratKing' | 'impShopkeeper') : undefined,
		//Mob.java: everything spawns SLEEPING (bosses and NPCs excepted); champions are a
		//flat 10% roll here (real `rollForChampion` instead scales the roster-wide budget
		//by depth via `Dungeon.mobsToChampion`, not modeled). All 6 real ChampionEnemy types
		//are now represented (`Random.Int(6)` in Java, `Random.element` on all 6 here),
		//**including Giant/Projecting's `canAttackWithExtraReach()`** (clear-line range 2/4 -
		//see the `takeMonsterTurn` extra-reach branch and `PORT_COVERAGE.md`'s dedicated row;
		//the sentence that used to stand here calling it "still not modeled" was stale).
		//**`rollForChampion` only ever assigns a champion at all when the real
		//`Challenges.CHAMPION_ENEMIES` challenge is active** - found this pass auditing why
		//this port's own selectable "Champion Enemies" challenge toggle (`isChallengeEnabled`,
		//already wired for `stronger_bosses`) did nothing either way: champions spawned at the
		//same flat 10% whether the challenge was on or off. Gated behind that toggle now, so
		//toggling it actually changes anything - the flat-10%-vs-real-depth-scaled-budget
		//simplification itself is unchanged and still tracked above.
		//NEVER_SLEEPS_KINDS: spawn already awake (real Java state=PASSIVE/WANDERING, never
		//SLEEPING) - DemonSpawner/Sentry/RotHeart/RotLasher/the newborn elemental, plus the
		//Ghost-quest mobs spawned mid-quest with the hero already nearby.
		sleeping: profile.sleeping,
		//rollForChampion() also blocks certain standout enemies from becoming champions on
		//shallow floors (`instanceof` checks, so Java's own GreatCrab/Bandit subclasses are
		//covered by the Crab/Thief checks too) - `this.depth` substitutes for `scalingDepth()`
		//the same way every other depth-scaled formula in this file already does.
		//Java rolls a champion in exactly one place: `Level.createMob()`, the path that draws
		//from the floor's mob rotation (`mobsToSpawn`, `MobSpawner.getMobRotation`). Every
		//other mob in Java is built by direct construction - a quest miniboss, a mimic, a
		//pylon, a summon, a swarm split, a bag ally - and so is never championed, which is
		//also why `rollForChampion` needs no NPC/boss test of its own. `championEligible`
		//carries that distinction here: true only for the roster spawn in `populate()`, this
		//port's analogue of `createMob()`. Until 2026-09-12 the guard was a hand-written kind
		//list instead, so a fetidRat/greatCrab/gnollTrickster/pylon/mimic/larva/ripperDemon/
		//bee/piranha - or any summoned ally - could roll a champion, and only the real
		//by-depth blocks below held. `rollForChampion`'s own `Random.Int(6)` type draw is
		//still approximated by a flat 10% roll on the gameplay stream (see PORT_COVERAGE.md).
		champion: profile.champion,
		//`ChampionEnemy.AntiMagic` grants the same `MagicImmune` buff the AntiMagic armor
		//glyph gives the hero (`Char.buff(MagicImmune.class)` is what `Char.isImmune()` reads
		//to test `AntiMagic.RESISTS`), so an AntiMagic champion should refuse the same
		//`buffBlocked()` gate the hero's own `magicImmune` field already drives - previously
		//only ever set on the hero, so an AntiMagic champion could still be Weakened/
		//Vulnerable/Hexed/Degraded/put to sleep/Charmed like any ordinary monster despite
		//real Java making it immune to all six. RESISTS' other ~19 entries (specific wands,
		//scrolls, bombs, and boss ranged bolts becoming full no-ops against a MagicImmune
		//target) remain unmodeled - this only wires the buff-attachment half `buffBlocked()`
		//already had machinery for.
		magicImmune: profile.champion === 'antimagic',
		championPower: 1.19,
		combo: 0,
		moving: 0,
		skeleton: null,
		firstSummon: true,
		arenaJumps: 0,
		//DM300's opening `abilityCooldown = NormalIntRange(5, 9)` rolls in its Java
		//constructor (levelgen time); here it rolls once at spawn on the gameplay
		//stream instead (restored floors overwrite it from the save right after).
		dmAbilityTurns: -1,
		dmAbilityCd: Random.normalRange(5, 9),
		dmLastAbility: 0,
		dmSupercharged: false,
		dmPylonsActivated: 0,
		dmBarrier: 0,
		yogSummonCd: kind === 'yog' ? Random.normalRange(10, 15) : undefined,
		yogSummonIndex: kind === 'yog' ? 0 : undefined,
		yogBeamCd: kind === 'yog' ? Random.normalRange(10, 15) : undefined,
		tenguPhase: kind === 'tengu' ? 'cell' : undefined,
		pylonActive: false,
		pylonTargetNeighbor: kind === 'pylon' ? Random.int(0, 8) : undefined,
		generation: 0,
		mimicLoot,
		mimicRevealed: kind === 'crystalMimic' || kind === 'mimic' ? false : undefined,
	});
}
