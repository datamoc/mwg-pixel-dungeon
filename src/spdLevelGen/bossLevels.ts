/**
 * Fixed-layout boss floors.
 *
 * The four Java boss levels after the Sewers are direct `Level` subclasses, not
 * `RegularLevel`s. They therefore must not go through the room graph builder. This
 * module ports their stable geometry and transition cells into the same PaintLevel
 * surface used by regular floors. Boss phase scripts remain scene-owned.
 */
import { PaintLevel, Terrain, fillEllipse, fillXY, set } from './paintLevel';
import type { Room } from './room';
import { spdPatchGenerate } from './spdPatch';
import { SpdRandom } from '../spdRng';

export interface BossFloorData {
	paint: PaintLevel;
	rooms: Room[];
	feeling: number | null;
}

function room(left: number, top: number, right: number, bottom: number): Room {
	const r = { left, top, right, bottom } as Room;
	return r;
}

function fillRect(level: PaintLevel, left: number, top: number, right: number, bottom: number, terrain: number): void {
	fillXY(level, left, top, right - left + 1, bottom - top + 1, terrain);
}

function prisonBoss(): BossFloorData {
	// PrisonBossLevel: setSize(32,32), with the start rooms and Tengu's lower cell.
	const level = new PaintLevel(32, 32);
	fillRect(level, 0, 0, 31, 31, Terrain.WALL);
	fillRect(level, 8, 2, 13, 8, Terrain.EMPTY);
	fillRect(level, 9, 7, 12, 24, Terrain.EMPTY);
	for (const [left, top, right, bottom] of [[5, 9, 10, 16], [11, 9, 16, 16], [5, 15, 10, 22], [11, 15, 16, 22]]) {
		fillRect(level, left, top, right, bottom, Terrain.WALL);
		fillRect(level, left + 1, top + 1, right - 1, bottom - 1, Terrain.EMPTY);
	}
	fillRect(level, 6, 23, 15, 31, Terrain.EMPTY);
	set(level, 10, 4, Terrain.ENTRANCE);
	set(level, 10, 23, Terrain.LOCKED_DOOR);
	for (const [x, y] of [[10, 2], [7, 9], [13, 9], [7, 15], [13, 15], [8, 23], [12, 23]]) set(level, x, y, Terrain.WALL_DECO);
	return { paint: level, rooms: [room(6, 23, 15, 31)], feeling: null };
}

function cavesBoss(strongerBosses: boolean): BossFloorData {
	// CavesBossLevel: WIDTH=33, HEIGHT=42, mainArena=(5,14)-(28,37).
	const level = new PaintLevel(33, 42, Terrain.CHASM);
	fillEllipse(level, 5, 14, 24, 24, Terrain.EMPTY);
	// `CavesBossLevel.build()`: after the arena ellipse, scatter water and sprung traps across it
	// with the real `Patch.generate(width, height-14, 0.15f, 2, true)` and one
	// `Random.Int(challenge ? 4 : 8) == 0` roll per eligible EMPTY cell. These are exactly the
	// cells `activatePylon()`'s `PylonEnergy` seed later energizes (WATER/INACTIVE_TRAP/SIGN), so
	// without them DM-300's pylon mechanic has no terrain to work on at all. The port's wider
	// arena layout is still a hand-approximation of Java's build order, so the RNG stream position
	// here is deterministic but not Java's exact draw index.
	const patch = spdPatchGenerate(level.w, level.h - 14, 0.15, 2, true);
	const patchOffset = 14 * level.w;
	const trapBound = strongerBosses ? 4 : 8;
	for (let i = patchOffset; i < level.w * level.h; i++) {
		if (level.map[i] !== Terrain.EMPTY) continue;
		if (patch[i - patchOffset]) level.map[i] = Terrain.WATER;
		else if (SpdRandom.int(trapBound) === 0) level.map[i] = Terrain.INACTIVE_TRAP;
	}
	fillRect(level, 14, 3, 18, 12, Terrain.EMPTY);
	fillRect(level, 15, 2, 17, 4, Terrain.EMPTY_SP);
	fillRect(level, 15, 5, 17, 5, Terrain.STATUE);
	fillRect(level, 15, 7, 17, 7, Terrain.STATUE);
	fillRect(level, 15, 9, 17, 9, Terrain.STATUE);
	fillRect(level, 16, 5, 16, 10, Terrain.EMPTY_SP);
	fillRect(level, 15, 0, 17, 2, Terrain.EXIT);
	fillRect(level, 14, 13, 19, 14, Terrain.SIGN);
	set(level, 16, 25, Terrain.ENTRANCE);
	// Java's four neutral Pylon actors occupy these cells. Their actor payload is preserved
	// separately from terrain so the live bridge can restore the dedicated pylon sprite and
	// activate the pylons when DM-300's gate is triggered.
	for (const [x, y] of [[4, 13], [28, 13], [4, 37], [28, 37]]) {
		set(level, x, y, Terrain.EMPTY);
		level.mobs.push({ pos: x + y * level.w, kind: 'pylon' });
	}
	// Keep the scene's existing boss spawn convention away from the entrance cell; Java's
	// real Caves arena chooses a free point after the gate seals.
	return { paint: level, rooms: [room(8, 18, 24, 34)], feeling: null };
}

function cityBoss(): BossFloorData {
	// CityBossLevel: WIDTH=15, HEIGHT=48, entry=(1,37)-(14,48), arena=(1,25)-(14,38).
	const level = new PaintLevel(15, 48, Terrain.CHASM);
	fillRect(level, 1, 37, 13, 47, Terrain.EMPTY);
	fillRect(level, 2, 38, 12, 46, Terrain.BOOKSHELF);
	fillRect(level, 4, 42, 10, 46, Terrain.EMPTY);
	set(level, 7, 44, Terrain.ENTRANCE);
	fillEllipse(level, 1, 25, 14, 14, Terrain.EMPTY);
	for (const [x, y] of [[4, 31], [10, 31], [10, 37], [4, 37]]) set(level, x, y, Terrain.PEDESTAL);
	for (const x of [3, 4, 10, 11]) set(level, x, 32, Terrain.STATUE);
	set(level, 7, 25, Terrain.LOCKED_DOOR);
	fillRect(level, 4, 5, 10, 22, Terrain.EMPTY);
	fillRect(level, 4, 5, 10, 8, Terrain.EXIT);
	set(level, 7, 13, Terrain.EXIT);
	return { paint: level, rooms: [room(1, 25, 13, 38)], feeling: null };
}

function hallsBoss(): BossFloorData {
	// HallsBossLevel: a 32x32 cross-shaped approach and a central 9x9 boss room.
	const level = new PaintLevel(32, 32, Terrain.WALL);
	for (let i = 0; i < 5; i++) {
		const left = 4 + i * 5;
		const top = i === 2 ? 2 : i === 1 || i === 3 ? 3 : 4;
		const bottom = i === 2 ? 24 : i === 1 || i === 3 ? 22 : 20;
		fillRect(level, left, top, left + 4, bottom, Terrain.EMPTY);
	}
	fillRect(level, 12, 8, 20, 16, Terrain.EMPTY_SP);
	fillRect(level, 15, 10, 17, 13, Terrain.EMPTY);
	set(level, 16, 16, Terrain.ENTRANCE);
	set(level, 16, 9, Terrain.EXIT);
	for (const [x, y] of [[12, 8], [13, 8], [19, 8], [20, 8], [12, 15], [13, 15], [19, 15], [20, 15]]) set(level, x, y, Terrain.WALL_DECO);
	return { paint: level, rooms: [room(12, 8, 20, 16)], feeling: null };
}

function lastLevel(): BossFloorData {
	// LastLevel: a 16x64 chasm shaft, entrance chamber, and the lower Amulet vault.
	const level = new PaintLevel(16, 64, Terrain.CHASM);
	const mid = 8;
	fillRect(level, mid - 1, 10, mid + 1, 62, Terrain.EMPTY);
	fillRect(level, mid - 2, 61, mid + 2, 61, Terrain.EMPTY);
	fillRect(level, mid - 3, 62, mid + 3, 62, Terrain.EMPTY);
	fillRect(level, 0, 54, 15, 55, Terrain.WALL);
	fillRect(level, 0, 56, 15, 63, Terrain.EMPTY);
	// LastLevel's transition spans the two wall rows before the lower chamber;
	// the chamber itself repeats the entrance on its centre three cells.
	set(level, mid, 54, Terrain.ENTRANCE);
	set(level, mid, 55, Terrain.ENTRANCE);
	fillRect(level, mid - 1, 56, mid + 1, 56, Terrain.ENTRANCE);
	fillRect(level, mid - 2, 9, mid + 2, 15, Terrain.EMPTY);
	fillRect(level, mid - 3, 10, mid + 3, 14, Terrain.EMPTY);
	return { paint: level, rooms: [room(mid - 1, 10, mid + 1, 62)], feeling: null };
}

export function generateBossFloor(depth: number, strongerBosses = false): BossFloorData {
		switch (depth) {
		case 10: return prisonBoss();
		case 15: return cavesBoss(strongerBosses);
		case 20: return cityBoss();
		case 25: return hallsBoss();
		case 26: return lastLevel();
		default: throw new Error(`generateBossFloor: unsupported depth ${depth}`);
	}
}
