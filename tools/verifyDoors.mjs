import assert from 'node:assert/strict';
import { readSceneSource } from './sceneSource.mjs';

/**
 * Doors shut behind whoever walks through them (`Door.leave()`, called from
 * `Char.move()` BEFORE `pos = step` - `levels/features/Door.java`, tag `v3.3.8`):
 * an open door left behind closes again unless a heap lies on it or another
 * creature is still standing on it. That is what lets the hero break line of
 * sight through a doorway and surprise what comes after (snakes especially).
 *
 * dungeonScene.ts cannot load in this harness (Pixi), so the guards and the call
 * sites are pinned at source level: the three early returns plus the registry
 * close in `leaveDoor`, and one call with pre-move coordinates on each voluntary
 * step path (hero, monster, three ally turns). Teleports and knockbacks set
 * position directly and must never appear - the occurrence count below is the
 * guard rail against a drive-by hookup on a forced relocation.
 */
export function verifyDoors(require, check) {
	check('leaving an open door shuts it behind the mover', () => {
		const source = readSceneSource();
		assert.match(source, /if \(this\.level\.get\(x, y\) !== DOOR\) return;/,
			'only an open door cell can shut');
		assert.match(source, /if \(this\.groundItemAt\(x, y\)\) return;/,
			'a heap on the cell props the door open, like Java');
		assert.match(source, /c !== mover && c\.hp > 0 && c\.x === x && c\.y === y/,
			'another creature still on the cell props it open, like Java\'s chars <= 1 with the mover counted');
		assert.match(source, /if \(!this\.doors\.close\(x, y\)\) return;/,
			'the registry flips the cell to its closed kind');
		assert.match(source, /this\.leaveDoor\(from\.x, from\.y, this\.hero\);/,
			'the hero\'s voluntary step passes its pre-move cell');
		assert.match(source, /this\.leaveDoor\(from\.x, from\.y, monster\);/,
			'a monster\'s voluntary step passes its pre-move cell');
		assert.match(source, /this\.leaveDoor\(from\.x, from\.y, ally\);/,
			'an ally\'s voluntary step passes its pre-move cell');
		assert.match(source, /this\.leaveDoor\(from\.x, from\.y, guardian\);/,
			'the earth guardian\'s voluntary step passes its pre-move cell');
		const calls = source.match(/this\.leaveDoor\(from\.x, from\.y, /g) ?? [];
		assert.equal(calls.length, 5, 'exactly the five voluntary step paths hook up - no teleport or knockback');
	});
	check('entering a shut door opens it under whoever steps on it', () => {
		const source = readSceneSource();
		assert.match(source, /moved && !immaterial && this\.doors\.isDoor\(to\.x, to\.y\) && !this\.doors\.isOpen\(to\.x, to\.y\)/,
			'moveTo opens a shut door for any material mover (Level.occupyCell -> Door.enter), not just the hero via bumpDoor');
		assert.match(source, /IMMATERIAL_KINDS\.has\(creature\.kind\)/,
			'bodiless kinds (ghosts, wraiths, spectral necromancers) pass a wooden door without opening it');
		assert.match(source, /!this\.doors\.isLocked\(to\.x, to\.y\) && !this\.secrets\.isSecret\(to\.x, to\.y\)/,
			'locked and secret doors stay shut');
	});
	check('monster pathing crosses a shut door, so a hunt survives the hero closing it', () => {
		const source = readSceneSource();
		assert.match(source, /new Roguelike\.Pathfinder\(doorAwareLevel\(this\.level, this\.doors, this\.secrets\)\)/,
			'the floor pathfinder reads a door-aware view of the level');
		assert.match(source, /\.isDoor\(x, y\) && !doors\.isOpen\(x, y\) && !doors\.isLocked\(x, y\) && !secrets\.isSecret\(x, y\)/,
			'only shut, unlocked, non-secret doors are passable to pathing');
	});
}
