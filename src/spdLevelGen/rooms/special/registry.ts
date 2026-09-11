/**
 * Port of `levels/rooms/special/SpecialRoom.java`'s run-level selection queue
 * (`EQUIP_SPECIALS`/`CONSUMABLE_SPECIALS`/`CRYSTAL_KEY_SPECIALS`/`POTION_SPAWN_ROOMS`,
 * `initForRun`/`initForFloor`/`useType`/`createRoom`), plus the paint dispatch table for all 21
 * reachable classes (see room.ts's `SpecialRoomKind` census comment for what's excluded and why).
 *
 * Unlike `StandardRoom`'s depth-keyed `chances[]` table, `SpecialRoom` selection is queue-order
 * based across an entire *run* (`runSpecials`), not depth-gated - any of the 19 EQUIP+CONSUMABLE
 * classes can appear at any depth depending on the run's shuffle order. This module keeps that
 * queue as real module-level state (mirroring Java's own `static` fields), faithfully
 * implementing `initForRun()`'s two shuffles and `createRoom()`'s `Random.chances({6,3,1})`
 * queue-position roll, run on the real `Dungeon.init()` run-level generator (`spdRng.ts`'s
	 * `pushRunInitGenerator()` - seed+1, after the label/color/gem shuffle burns). The live
	 * `gameBridge` now performs this reset at run start; standalone verifier entry points still
	 * do it explicitly so they can control their fixture seed. `resetPitRoom()` (cancels a pending
 * PitRoom if the hero takes a different
 * route back up past the WeakFloorRoom's depth) is not modeled - out of scope for this port,
 * which has no multi-floor backtracking state.
 */
import type { SpecialRoomKind } from '../../room';
import { Room } from '../../room';
import { PaintLevel } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { MWL_TRAIT_NODES } from '../../../mwlContent';

import { paintWeakFloorRoom } from './weakFloorRoom';
import { paintMassGraveRoom } from './massGraveRoom';
import { paintRotGardenRoom } from './rotGardenRoom';
import { paintDemonSpawnerRoom } from './demonSpawnerRoom';
import { paintCryptRoom } from './cryptRoom';
import { paintPoolRoom } from './poolRoom';
import { paintArmoryRoom } from './armoryRoom';
import { paintSentryRoom } from './sentryRoom';
import { paintStatueRoom } from './statueRoom';
import { paintCrystalVaultRoom } from './crystalVaultRoom';
import { paintCrystalChoiceRoom } from './crystalChoiceRoom';
import { paintSacrificeRoom } from './sacrificeRoom';
import { paintRunestoneRoom } from './runestoneRoom';
import { paintGardenRoom } from './gardenRoom';
import { paintLibraryRoom } from './libraryRoom';
import { paintStorageRoom } from './storageRoom';
import { paintTreasuryRoom } from './treasuryRoom';
import { paintMagicWellRoom } from './magicWellRoom';
import { paintToxicGasRoom } from './toxicGasRoom';
import { paintMagicalFireRoom } from './magicalFireRoom';
import { paintTrapsRoom } from './trapsRoom';
import { paintCrystalPathRoom } from './crystalPathRoom';
import { paintLaboratoryRoom } from './laboratoryRoom';
import { paintPitRoom } from './pitRoom';

function specialRoomList(id: string, applyTo: string): SpecialRoomKind[] {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === id);
		if (!node) throw new Error(`MWL room rule is missing ${id}`);
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === applyTo);
	const values = effect?.attributes.set?.split(',').filter(Boolean) ?? [];
	if (values.length === 0) throw new Error(`MWL room rule is missing ${id}.${applyTo}`);
	return values as SpecialRoomKind[];
}

const EQUIP_SPECIALS = specialRoomList('specialRoomRules', 'equipSpecials');
const CONSUMABLE_SPECIALS = specialRoomList('specialRoomRules', 'consumableSpecials');
const CRYSTAL_KEY_SPECIALS = specialRoomList('specialRoomRules', 'crystalKeySpecials');
const POTION_SPAWN_ROOMS = specialRoomList('specialRoomRules', 'potionSpawnRooms');

let runSpecials: SpecialRoomKind[] = [];
let floorSpecials: SpecialRoomKind[] = [];
let pitNeededDepth = -1;

/** `SpecialRoom.initForRun()`. See module comment - not auto-invoked; callers opt in. */
export function resetSpecialRoomRunState(): void {
	const equip = EQUIP_SPECIALS.slice();
	const cons = CONSUMABLE_SPECIALS.slice();
	SpdRandom.shuffle(equip);
	SpdRandom.shuffle(cons);

	runSpecials = [cons.shift()!];
	while (equip.length > 0 || cons.length > 0) {
		if (equip.length > 0) runSpecials.push(equip.shift()!);
		if (cons.length > 0) runSpecials.push(cons.shift()!);
	}
	pitNeededDepth = -1;
}

/** `SpecialRoom.initForFloor()`. `runSeed % 3` matches Java's `Dungeon.seed % 3` (no RNG - a
 *  deterministic property of the run seed, not a generator draw). */
export function initSpecialRoomFloor(depth: number, runSeed: bigint): void {
	floorSpecials = runSpecials.slice();
	const mod3 = Number(((runSeed % 3n) + 3n) % 3n);
	if (depth % 5 === mod3 + 2) floorSpecials.unshift('laboratory');
}

function useType(kind: SpecialRoomKind): void {
	floorSpecials = floorSpecials.filter(k => k !== kind);
	if (CRYSTAL_KEY_SPECIALS.includes(kind)) floorSpecials = floorSpecials.filter(k => !CRYSTAL_KEY_SPECIALS.includes(k));
	if (POTION_SPAWN_ROOMS.includes(kind)) floorSpecials = floorSpecials.filter(k => !POTION_SPAWN_ROOMS.includes(k));
	const idx = runSpecials.indexOf(kind);
	if (idx !== -1) { runSpecials.splice(idx, 1); runSpecials.push(kind); }
}

/** `SpecialRoom.createRoom()`. `bossNext` mirrors `Dungeon.bossLevel(depth+1)` - Sewers-only
 *  scope means this is just `depth === 4` (SewerBossLevel is depth 5), passed in by the caller. */
export function createSpecialRoom(depth: number, bossNext: boolean): SpecialRoomKind {
	if (depth === pitNeededDepth) {
		pitNeededDepth = -1;
		useType('pit');
		return 'pit';
	}
	if (floorSpecials.includes('laboratory')) {
		useType('laboratory');
		return 'laboratory';
	}

	if (bossNext) floorSpecials = floorSpecials.filter(k => k !== 'weakFloor');

	let index = SpdRandom.chances([6, 3, 1]);
	while (index >= floorSpecials.length) index--;
	const kind = floorSpecials[index];

	if (kind === 'weakFloor') pitNeededDepth = depth + 1;
	useType(kind);
	return kind;
}

type PaintFn = (level: PaintLevel, room: Room, depth: number) => void;
const PAINTERS: Record<SpecialRoomKind, PaintFn> = {
	weakFloor: (l, r) => paintWeakFloorRoom(l, r),
	crypt: (l, r) => paintCryptRoom(l, r),
	pool: (l, r) => paintPoolRoom(l, r),
	armory: (l, r) => paintArmoryRoom(l, r),
	sentry: (l, r) => paintSentryRoom(l, r),
	statue: (l, r) => paintStatueRoom(l, r),
	crystalVault: (l, r) => paintCrystalVaultRoom(l, r),
	crystalChoice: (l, r) => paintCrystalChoiceRoom(l, r),
	sacrifice: (l, r) => paintSacrificeRoom(l, r),
	runestone: (l, r) => paintRunestoneRoom(l, r),
	garden: (l, r) => paintGardenRoom(l, r),
	library: (l, r) => paintLibraryRoom(l, r),
	storage: (l, r) => paintStorageRoom(l, r),
	treasury: paintTreasuryRoom,
	magicWell: (l, r) => paintMagicWellRoom(l, r),
	toxicGas: (l, r) => paintToxicGasRoom(l, r),
	magicalFire: (l, r) => paintMagicalFireRoom(l, r),
	traps: paintTrapsRoom,
	crystalPath: paintCrystalPathRoom,
	laboratory: (l, r, d) => paintLaboratoryRoom(l, r, d),
	pit: (l, r) => paintPitRoom(l, r),
	// Wandmaker quest rooms - appended by `wandmaker.ts`, never produced by `createRoom()`
	// below, but they paint through this same `'special'` dispatch.
	massGrave: (l, r) => paintMassGraveRoom(l, r),
	rotGarden: (l, r) => paintRotGardenRoom(l, r),
	demonSpawner: (l, r) => paintDemonSpawnerRoom(l, r),
};

export function paintSpecialRoom(level: PaintLevel, room: Room, depth: number): void {
	if (!room.specialKind) throw new Error('paintSpecialRoom: room has no specialKind set');
	PAINTERS[room.specialKind](level, room, depth);
}
