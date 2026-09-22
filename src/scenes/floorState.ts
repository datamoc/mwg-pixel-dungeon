import type { Roguelike } from 'mwg';
import type { GroundItem, BuffId } from '../combat';
import type { GroundItemKind, TrapKind } from '../dungeonConstants';
import type { AnyMonsterId } from '../monsters';

type DoorState = { doors: { cell: number; open: number; closed: number; locked?: string; isOpen: boolean }[] };
type SecretState = { revealed: [number, number][]; discovered: number[] };
type FireState = { width: number; height: number; volume: number[] };

/** JSON-only state which survives leaving a depth or saving the run. Render objects are rebuilt. */
export interface FloorState {
	terrain: number[];
	doors: DoorState;
	secrets: SecretState;
	trapKinds: [number, TrapKind][];
	/** Trap cells already triggered or claimed by ReclaimTrap; inactive traps remain visible. */
	spentTrapCells?: number[];
	/** `GatewayTrap.telePos` links: [trap cell, linked cell]. */
	gatewayTelePos?: [number, number][];
	secretDoorCells: number[];
	crystalDoorCells: number[];
	fire: FireState;
	plantGas?: FireState;
	ritualPos?: number;
	ritualCandles?: boolean[];
	plantFreeze?: FireState;
	toxicGas?: FireState;
	/** `ToxicGasRoom.ToxicGasSeed`'s persistent vent sources: [cell, current volume]. */
	toxicGasVents?: [number, number][];
	paralyticGas?: FireState;
	/** `StenchGas` volume field, including the armor-curse source. */
	stenchGas?: FireState;
	/** `CorrosiveGas` volume field; its strongest source is saved separately on the scene. */
	corrosiveGas?: FireState;
	corrosiveGasStrength?: number;
	/** `ConfusionGas` volume field. */
	confusionGas?: FireState;
	/** `Web` volume field: Spinner webs decay 1/turn without diffusing. */
	web?: FireState;
	/** `Electricity` volume field: Shocking/Storm traps seed it over `WATER` cells. */
	electricity?: FireState;
	/** `SmokeScreen` volume field: smoke-bomb blasts seed it over the distance-2 flood. */
	smokeScreen?: FireState;
	/** `Inferno`/`Blizzard` volume fields: the matching brews seed them. */
	inferno?: FireState;
	blizzard?: FireState;
	eternalFire?: FireState;
	sacrificialFire?: FireState;
	sacrificialFireCharge?: number;
	sacrificialFireCell?: number;
	sacrificialFirePrize?: GroundItem['item'];
	portedFeatures?: { cells: [number, string][] };
	groundItems: { kind: GroundItemKind; x: number; y: number; item?: GroundItem['item']; chest?: 'normal' | 'locked' | 'crystal'; forSale?: boolean; missileLevel?: number; missileSet?: string; tippedSeed?: string }[];
	fallingRocks?: { cells: { x: number; y: number }[]; turns: number }[];
	cavesBossEnergyCells?: number[];
	manualPlants?: [number, string][];
	/** Huntress furrowed-grass cells awaiting their next trample. */
	furrowedGrass?: number[];
	creatures: SavedCreature[];
	schedulerNow: number;
	/** The complete queue snapshot. Optional for saves written before queue persistence existed. */
	scheduler?: Roguelike.SchedulerSnapshot;
}

export interface SavedCreature {
	kind: AnyMonsterId;
	x: number;
	y: number;
	hp: number;
	maxHp: number;
	accuracy: number;
	evasion: number;
	damage: [number, number];
	armor: [number, number];
	buffs: [BuffId, number][];
	sleeping?: boolean;
	champion?: 'blessed' | 'blazing' | 'giant' | 'growing' | 'antimagic' | 'projecting' | null;
	championPower?: number;
	pumped?: number;
	gooHealInc?: number;
	focusCooldown?: number;
	combo?: number;
	moving?: number;
	arenaJumps?: number;
	tenguPhase?: 'cell' | 'paused' | 'arena';
	tenguFire?: { direction: number; beam: Roguelike.MultiTurnBeamSave };
	tenguAbilityCd?: number;
	tenguAbilityUses?: number;
	tenguLastAbility?: number;
	tenguShockers?: { x: number; y: number; ordinals: boolean; turns: number }[];
	yogPhase?: number;
	yogFistType?: 'burning' | 'soiled' | 'rotting' | 'rusted' | 'bright' | 'dark';
	elementalType?: 'fire' | 'frost' | 'shock' | 'chaos';
	shamanType?: 'red' | 'blue' | 'purple';
	yogSummonCd?: number;
	yogSummonIndex?: number;
	yogMinionDeck?: AnyMonsterId[];
	yogBeamCd?: number;
	/** `YogDzewa.targetedCells`: aim stores cells and the next turn fires the beams. */
	yogTargeted?: number[];
	yogFistDeck?: string[];
	yogChallengeDeck?: string[];
	/** `Bee.setPotInfo`, persisted like the rest of the per-mob state. */
	potPos?: { x: number; y: number };
	potHolderId?: string;
	/** `YogFist.rangedCooldown`, persisted as a float like Java's own bundle field. */
	fistZapCd?: number;
	kingPhase?: number;
	kingSummonsMade?: number;
	kingSummonCd?: number;
	kingAbilityCd?: number;
	kingLastAbility?: number;
	kingShield?: number;
	kingWaveCd?: number;
	/** `maxLvl = -2` summons (King's servants): no XP, no loot. */
	noExp?: boolean;
	/** P2-wave King servants carrying `KingDamager` (chip the P2 shield on death). */
	kingDamager?: boolean;
	deferredDamage?: number;
	deferredDamageDelay?: boolean;
	corrosionTurns?: number;
	corrosionDamage?: number;
	kingReactionsState?: { active: string[]; spent: string[] };
	weaponLevel?: number;
	stolen?: string | null;
	mimicLoot?: string;
	armbandStolen?: boolean;
	generation?: number;
	spawnCooldown?: number;
	seesHero?: boolean;
	fleeing?: boolean;
	patrolTarget?: { x: number; y: number };
	/** Java Mob.target while hunting: the last cell where the mob saw the hero. */
	lastSeen?: { x: number; y: number };
	/** Java's per-char `Swiftthistle.TimeBubble` turn counter. */
	timeBubbleTurns?: number;
	mimicRevealed?: boolean;
	hasteTurns?: number;
	hasteBaseSpeed?: number;
	skeletonIndex?: number;
	firstSummon?: boolean;
	/** `Wraith.level` (`Wraith.java`, tag `v3.3.8`), set by `adjustStats()` at spawn. */
	wraithLevel?: number;
	impShopkeeperGreeted?: boolean;
	nextTurn: number | null;
	isAlly?: boolean;
	allyKind?: 'mirror' | 'sheep' | 'ward' | 'earthGuardian' | 'lotus' | 'ghost' | 'ninjaLog' | 'spiritHawk' | 'afterImage' | 'shadowClone' | 'prismatic';
	prismaticFade?: number;
	sheepTurns?: number;
	wardTier?: number;
	wardWandLevel?: number;
	wardTotalZaps?: number;
	earthGuardianWandLevel?: number;
	earthGuardianDefense?: number;
	/** `SpiritHawk.HawkAlly.storeInBundle()`'s 	ime_remaining` and `dodges_used` (this port
	 *  counts dodges left rather than used, so the two are mirrored). */
	spiritHawkTime?: number;
	spiritHawkDodges?: number;
	hasRaged?: boolean;
	raged?: boolean;
	/** `Sungrass.Health`'s `level`/`partialHeal`/`pos` (`plants/Sungrass.java`, tag `v3.3.8`). */
	sungrassLevel?: number;
	sungrassPartial?: number;
	sungrassPos?: number;
	/** `Earthroot.Armor`'s `level`/`pos` (`plants/Earthroot.java`, tag `v3.3.8`). */
	earthrootArmorLevel?: number;
	earthrootArmorPos?: number;
	barkskinLevel?: number;
	barkskinInterval?: number;
	barkskinCooldown?: number;
	chainUsed?: boolean;
	ventCooldown?: number;
	webCooldown?: number;
	golemTeleCooldown?: number;
	golemSelfTeleCooldown?: number;
	beamCharged?: boolean;
	beamCooldown?: number;
	/** `Succubus`' bundled `blink_cd`. */
	blinkCooldown?: number;
	/** `RipperDemon`'s bundled `leap_pos`/`leap_cd`/`last_enemy_pos` (here as steps). */
	leapTarget?: { x: number; y: number } | null;
	leapCooldown?: number;
	leapLastEnemy?: { x: number; y: number };
	leapPrevEnemy?: { x: number; y: number };
	pylonActive?: boolean;
	pylonTargetNeighbor?: number;
	rangedCooldown?: number;
	newbornTarget?: { x: number; y: number } | null;
	armoredRageTicks?: number;
	stuckAmmo?: number;
	/** `DivineIntervention.DivineShield` pool (see `Creature.divineShield`). */
	divineShield?: number;
	ratmogrifiedTurns?: number;
	ratmogrifiedPermanent?: boolean;
	deathMarkTurns?: number;
	duelTakenDmg?: number;
	deathMarkInitialHp?: number;
	sentryWarmup?: number;
	/** `SentryRoom$Sentry.initialChargeDelay`, retained when a floor is saved before first sight. */
	sentryInitialWarmup?: number;
	dmAbilityTurns?: number;
	dmAbilityCd?: number;
	dmLastAbility?: number;
	dmSupercharged?: boolean;
	dmPylonsActivated?: number;
	dmBarrier?: number;
}
