/**
 * Port of `levels/rooms/special/SentryRoom.java`'s `paint()` geometry (the `do-while (center.x
 * == entrance.x || center.y == entrance.y)` loop reuses `room.center()`'s own Random.Int(2)
 * odd-dimension rolls from room.ts, so it can burn more than one pair per attempt exactly like
 * Java). `prize()`'s leading `Random.Int(2)` roll is preserved; `Generator.randomWeapon/Armor`'s
 * internals plus the upgrade roll are skipped. `SentryRoom.canConnect()`'s extra "not the exact
 * center" door-placement restriction (an override of the graph-stage `Room.canConnect`) is NOT
 * threaded into `builder.ts`/`room.ts` this pass - a real, if narrow, divergence: Java never lets
 * a door land exactly on the room's parity-even center point, this port doesn't enforce that
 * exclusion yet. Documented in PORT_COVERAGE.md.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { floorSetForPrize, generatedGroundKind, uncursedWeaponOrArmorPrize } from '../../../spdItems/generator';

export function paintSentryRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);

	const entrance = room.entranceDoor();

	let center: { x: number; y: number };
	do { center = room.center(); } while (center.x === entrance.x || center.y === entrance.y);

	let sentryPos = { x: 0, y: 0 };
	let treasurePos = { x: 0, y: 0 };

	if (entrance.x === room.left) {
		sentryPos = { x: room.right - 1, y: center.y };
		fillXY(level, room.left + 1, room.top + 1, 1, room.height() - 2, Terrain.EMPTY);
		if (entrance.y > center.y) {
			treasurePos = { x: room.left + 1, y: Math.floor((room.top + 1 + center.y) / 2) };
			fillXY(level, room.left + 1, room.top + 1, 2, center.y - room.top - 1, Terrain.EMPTY);
		} else {
			treasurePos = { x: room.left + 1, y: Math.floor((room.bottom + center.y) / 2) };
			fillXY(level, room.left + 1, center.y + 1, 2, room.bottom - center.y - 1, Terrain.EMPTY);
		}
		for (let x = room.right - 3; x > room.left; x--) {
			const cell = x + center.y * level.w;
			set(level, x, center.y, level.map[cell] === Terrain.EMPTY_SP ? Terrain.STATUE_SP : Terrain.STATUE);
		}
	} else if (entrance.x === room.right) {
		sentryPos = { x: room.left + 1, y: center.y };
		fillXY(level, room.right - 1, room.top + 1, 1, room.height() - 2, Terrain.EMPTY);
		if (entrance.y > center.y) {
			treasurePos = { x: room.right - 1, y: Math.floor((room.top + 1 + center.y) / 2) };
			fillXY(level, room.right - 2, room.top + 1, 2, center.y - room.top - 1, Terrain.EMPTY);
		} else {
			treasurePos = { x: room.right - 1, y: Math.floor((room.bottom + 1 + center.y) / 2) };
			fillXY(level, room.right - 2, center.y + 1, 2, room.bottom - center.y - 1, Terrain.EMPTY);
		}
		for (let x = room.left + 3; x < room.right; x++) {
			const cell = x + center.y * level.w;
			set(level, x, center.y, level.map[cell] === Terrain.EMPTY_SP ? Terrain.STATUE_SP : Terrain.STATUE);
		}
	} else if (entrance.y === room.top) {
		sentryPos = { x: center.x, y: room.bottom - 1 };
		fillXY(level, room.left + 1, room.top + 1, room.width() - 2, 1, Terrain.EMPTY);
		if (entrance.x > center.x) {
			treasurePos = { x: Math.floor((room.left + 1 + center.x) / 2), y: room.top + 1 };
			fillXY(level, room.left + 1, room.top + 1, center.x - room.left - 1, 2, Terrain.EMPTY);
		} else {
			treasurePos = { x: Math.floor((room.right + center.x) / 2), y: room.top + 1 };
			fillXY(level, center.x + 1, room.top + 1, room.right - center.x - 1, 2, Terrain.EMPTY);
		}
		for (let y = room.bottom - 3; y > room.top; y--) {
			const cell = center.x + y * level.w;
			set(level, center.x, y, level.map[cell] === Terrain.EMPTY_SP ? Terrain.STATUE_SP : Terrain.STATUE);
		}
	} else {
		sentryPos = { x: center.x, y: room.top + 1 };
		fillXY(level, room.left + 1, room.bottom - 1, room.width() - 2, 1, Terrain.EMPTY);
		if (entrance.x > center.x) {
			treasurePos = { x: Math.floor((room.left + 1 + center.x) / 2), y: room.bottom - 1 };
			fillXY(level, room.left + 1, room.bottom - 2, center.x - room.left - 1, 2, Terrain.EMPTY);
		} else {
			treasurePos = { x: Math.floor((room.right + center.x) / 2), y: room.bottom - 1 };
			fillXY(level, center.x + 1, room.bottom - 2, room.right - center.x - 1, 2, Terrain.EMPTY);
		}
		for (let y = room.top + 3; y < room.bottom; y++) {
			const cell = center.x + y * level.w;
			set(level, center.x, y, level.map[cell] === Terrain.EMPTY_SP ? Terrain.STATUE_SP : Terrain.STATUE);
		}
	}

	set(level, sentryPos.x, sentryPos.y, Terrain.PEDESTAL);
	level.mobs.push({ pos: level.pointToCell(sentryPos), kind: 'sentry' });

	set(level, treasurePos.x, treasurePos.y, Terrain.PEDESTAL);
	// `Sentry`'s own construction: `sentry.room = new EmptyRoom()`. `EmptyRoom` extends
	// `StandardRoom`, whose instance initializer `{ setSizeCat(); }` burns one
	// `Random.chances(sizeCatProbs())` float per construction - the same class of missed draw
	// already found in `CrystalPathRoom`. Only the rect is used afterwards; the draw is not
	// optional. (`initialChargeDelay = dangerDist/3f + 0.1f` involves no RNG.)
	new Room('standard', 'empty');

	// prize(): `if (Random.Int(2) == 0)` guards `findPrizeItem()`; on a hit Java returns early,
	// so neither the never-cursed weapon/armor loop (whose retry count depends on the `cursed`
	// flag the real Generator rolls) nor the 33% extra-upgrade roll happens.
	let prize: string | null = null;
	if (SpdRandom.int(2) === 0) prize = level.findPrizeItem();
	if (prize === null) {
		prize = generatedGroundKind(uncursedWeaponOrArmorPrize(floorSetForPrize(1)));
		SpdRandom.int(3);
	}
	level.drop(prize, level.pointToCell(treasurePos), 'chest');

	level.drop('potionOfHaste', 0, 'itemToSpawn');

	entrance.set(DoorType.REGULAR);
}
