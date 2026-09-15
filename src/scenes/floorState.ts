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
	eternalFire?: FireState;
	sacrificialFire?: FireState;
	sacrificialFireCharge?: number;
	sacrificialFireCell?: number;
	sacrificialFirePrize?: GroundItem['item'];
	portedFeatures?: { cells: [number, string][] };
	groundItems: { kind: GroundItemKind; x: number; y: number; item?: GroundItem['item']; chest?: 'normal' | 'locked' | 'crystal'; forSale?: boolean; missileLevel?: number; missileSet?: number }[];
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
	yogBeamCd?: number;
	/** `YogDzewa.targetedCells`: aim stores cells and the next turn fires the beams. */
	yogTargeted?: number[];
	yogFistDeck?: string[];
	yogChallengeDeck?: string[];
	kingPhase?: number;
	kingSummonsMade?: number;
	kingSummonCd?: number;
	kingAbilityCd?: number;
	kingLastAbility?: number;
	kingShield?: number;
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
	mimicRevealed?: boolean;
	hasteTurns?: number;
	hasteBaseSpeed?: number;
	skeletonIndex?: number;
	firstSummon?: boolean;
	nextTurn: number | null;
	isAlly?: boolean;
	allyKind?: 'mirror' | 'sheep' | 'ward' | 'earthGuardian' | 'lotus' | 'ghost';
	sheepTurns?: number;
	wardTier?: number;
	wardWandLevel?: number;
	wardTotalZaps?: number;
	earthGuardianWandLevel?: number;
	earthGuardianDefense?: number;
	hasRaged?: boolean;
	raged?: boolean;
	chainUsed?: boolean;
	ventCooldown?: number;
	webCooldown?: number;
	golemTeleCooldown?: number;
	golemSelfTeleCooldown?: number;
	beamCharged?: boolean;
	beamCooldown?: number;
	pylonActive?: boolean;
	pylonTargetNeighbor?: number;
	rangedCooldown?: number;
	newbornTarget?: { x: number; y: number } | null;
	armoredRageTicks?: number;
	stuckAmmo?: number;
	ratmogrifiedTurns?: number;
	ratmogrifiedPermanent?: boolean;
	sentryWarmup?: number;
	dmAbilityTurns?: number;
	dmAbilityCd?: number;
	dmLastAbility?: number;
	dmSupercharged?: boolean;
	dmPylonsActivated?: number;
	dmBarrier?: number;
}
