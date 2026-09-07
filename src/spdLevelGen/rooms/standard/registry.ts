/**
 * `StandardRoom.rooms` - the real 26-entry class-order list from `StandardRoom.java`'s static
 * initializer, used by `regularLevel.ts`'s `Random.chances(chances[depth])` roll to pick a
 * concrete class by index. Only the 20 indices reachable in Sewers depths 1-4, Prison depths
 * 6-9, and Caves depths 11-14 (per PORT_COVERAGE.md's census) map to a real `StandardRoomKind`;
 * the rest are `undefined` - they
 * can never be selected there (a zero-weight `Random.chances` index is never returned - see
 * `regularLevel.ts`'s STANDARD_ROOM_CHANCES comment), so `initRooms()` throws defensively if one
 * ever is (table/registry mismatch, not a real Java code path for this port's scope).
 */
import type { StandardRoomKind } from '../../room';
import { PaintLevel } from '../../paintLevel';
import { Room } from '../../room';
import { paintShopRoom } from '../special/shopRoom';
import { paintEmptyRoom } from './emptyRoom';
import { paintSewerPipeRoom } from './sewerPipeRoom';
import { paintRingRoom } from './ringRoom';
import { paintCircleBasinRoom } from './circleBasinRoom';
import { paintSegmentedRoom } from './segmentedRoom';
import { paintPillarsRoom } from './pillarsRoom';
import { paintCellBlockRoom } from './cellBlockRoom';
import { paintCaveRoom } from './caveRoom';
import { paintCavesFissureRoom } from './cavesFissureRoom';
import { paintCirclePitRoom } from './circlePitRoom';
import { paintRitualSiteRoom } from './ritualSiteRoom';
import { paintHallwayRoom } from './hallwayRoom';
import { paintStatuesRoom } from './statuesRoom';
import { paintSegmentedLibraryRoom } from './segmentedLibraryRoom';
import { paintRuinsRoom } from './ruinsRoom';
import { paintChasmRoom } from './chasmRoom';
import { paintSkullsRoom } from './skullsRoom';
import { paintBlacksmithRoom } from './blacksmithRoom';
import { paintPlantsRoom } from './plantsRoom';
import { paintAquariumRoom } from './aquariumRoom';
import { paintPlatformRoom } from './platformRoom';
import { paintBurnedRoom } from './burnedRoom';
import { paintFissureRoom } from './fissureRoom';
import { paintGrassyGraveRoom } from './grassyGraveRoom';
import { paintStripedRoom } from './stripedRoom';
import { paintStudyRoom } from './studyRoom';
import { paintSuspiciousChestRoom } from './suspiciousChestRoom';
import { paintMinefieldRoom } from './minefieldRoom';
import { paintEntranceRoom } from './entranceRoom';
import { paintExitRoom } from './exitRoom';
import { paintSpecialRoom } from '../special/registry';
import { paintSecretRoom } from '../secret/registry';
import { paintSewerBossEntranceRoom, paintSewerBossExitRoom } from '../sewerBoss/entranceExitRoom';
import { paintGooDiamondRoom, paintGooWalledRoom, paintGooThinPillarsRoom, paintGooThickPillarsRoom } from '../sewerBoss/gooBossRoom';
import { paintConnectionRoom } from '../connection/paint';
import { paintMazeConnection } from '../connection/mazeConnection';
import { Terrain } from '../../paintLevel';
import { Feeling } from '../../regularPainter';

export const STANDARD_ROOM_CLASS_ORDER: (StandardRoomKind | undefined)[] = [
	'empty', 'sewerPipe', 'ring', 'circleBasin',           // 0-3
	'segmented', 'pillars', 'cellBlock',                    // 4-6 (Prison)
	'cave', 'cavesFissure', 'circlePit',                    // 7-9 (Caves)
	'hallway', 'statues', 'segmentedLibrary',               // 10-12 (City)
	'ruins', 'chasm', 'skulls',                             // 13-15 (Halls)
	'plants', 'aquarium', 'platform', 'burned', 'fissure',   // 16-20
	'grassyGrave', 'striped', 'study', 'suspiciousChest', 'minefield', // 21-25
];

type PaintFn = (level: PaintLevel, room: Room) => void;
const PAINTERS: Record<StandardRoomKind, PaintFn> = {
	empty: paintEmptyRoom,
	sewerPipe: paintSewerPipeRoom,
	ring: paintRingRoom,
	circleBasin: paintCircleBasinRoom,
	segmented: paintSegmentedRoom,
	pillars: paintPillarsRoom,
	cellBlock: paintCellBlockRoom,
	cave: paintCaveRoom,
	cavesFissure: paintCavesFissureRoom,
	circlePit: paintCirclePitRoom,
	// Never in STANDARD_ROOM_CLASS_ORDER - appended by `wandmaker.ts` (quest type 2).
	ritualSite: paintRitualSiteRoom,
	hallway: paintHallwayRoom,
	statues: paintStatuesRoom,
	segmentedLibrary: paintSegmentedLibraryRoom,
	ruins: paintRuinsRoom,
	chasm: paintChasmRoom,
	skulls: paintSkullsRoom,
	blacksmith: paintBlacksmithRoom,
	plants: paintPlantsRoom,
	aquarium: paintAquariumRoom,
	platform: paintPlatformRoom,
	burned: paintBurnedRoom,
	fissure: paintFissureRoom,
	grassyGrave: paintGrassyGraveRoom,
	striped: paintStripedRoom,
	study: paintStudyRoom,
	suspiciousChest: paintSuspiciousChestRoom,
	minefield: paintMinefieldRoom,
	// Never in STANDARD_ROOM_CLASS_ORDER - placed directly by `sewerBossInitRooms()` (regularLevel.ts).
	gooDiamond: paintGooDiamondRoom,
	gooWalled: paintGooWalledRoom,
	gooThinPillars: paintGooThinPillarsRoom,
	gooThickPillars: paintGooThickPillarsRoom,
};

/** Dispatches to the concrete room's `paint()` port, including 'entrance'/'exit' (not part of
 *  the STANDARD_ROOM_CLASS_ORDER table since they're always present, not rolled), 'special'
 *  (all 21 reachable `SpecialRoom` subclasses - see rooms/special/registry.ts), and 'secret' (all
 *  12 `ALL_SECRETS` classes - see rooms/secret/registry.ts). */
export function paintStandardRoom(level: PaintLevel, room: Room, depth: number): void {
	if (room.kind === 'entrance') return room.sewerBossVariant === 'entrance' ? paintSewerBossEntranceRoom(level, room) : paintEntranceRoom(level, room);
	if (room.kind === 'exit') return room.sewerBossVariant === 'exit' ? paintSewerBossExitRoom(level, room) : paintExitRoom(level, room);
	if (room.kind === 'standard' && room.standardKind) return PAINTERS[room.standardKind](level, room);
	if (room.kind === 'special' && room.specialKind) return paintSpecialRoom(level, room, depth);
	if (room.kind === 'secret' && room.secretKind) return paintSecretRoom(level, room, depth);
	if (room.kind === 'connection' || room.kind === 'mazeConnection') {
		// All 6 ConnectionRoom subclasses + MazeConnectionRoom (see rooms/connection/paint.ts).
		// `Level.tunnelTile()` (Level.java:456) is `EMPTY_SP` on a CHASM floor and `EMPTY`
		// otherwise. This was hardcoded to EMPTY with a "Feeling isn't modeled" note that went
		// stale once sub-pass 12 wired Feeling in; the difference is load-bearing, since water
		// and grass only spread over `EMPTY`, so EMPTY corridors on a chasm floor got flooded
		// where Java's EMPTY_SP ones stay dry. Sewers never exposed it: `PerimeterRoom`/
		// `WalkwayRoom` (the subclasses that fill whole corridor runs with this tile) have
		// weight 0 in `ConnectionRoom.chances[1..5]`.
		return paintConnectionRoom(level, room, level.tunnelTile(), paintMazeConnection);
	}
	if (room.kind === 'shop') return paintShopRoom(level, room);
	genericFallbackPaint(level, room);
}

function genericFallbackPaint(level: PaintLevel, room: Room): void {
	for (let y = room.top; y <= room.bottom; y++) {
		for (let x = room.left; x <= room.right; x++) level.map[x + y * level.w] = 4 /* Terrain.WALL */;
	}
	for (let y = room.top + 1; y < room.bottom; y++) {
		for (let x = room.left + 1; x < room.right; x++) level.map[x + y * level.w] = 1 /* Terrain.EMPTY */;
	}
}
