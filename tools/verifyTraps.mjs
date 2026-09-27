import assert from 'node:assert/strict';
import { readSceneSource } from './sceneSource.mjs';

/**
 * Trap triggering (`environmentFireTraps.ts`, tag `v3.3.8`).
 *
 * Java's `Level.pressCell` only fires a registered trap (`traps.get(cell)`):
 * stepping on a trapless cell does nothing. The port's `triggerTrapAt` is
 * called on every hero step and every chasm landing, so its `?? 'poisonDart'`
 * fallback must never be reachable for a trapless cell - without the
 * `trapKinds.has` guard every step fired a phantom poison dart (4-8 minus
 * armor plus poison), found by the T52 bot dying to trapless darts, 2026-09-26.
 *
 * dungeonScene.ts cannot load in this harness (Pixi), so the guard and the
 * fallback are pinned at source level the way verifyDoors does.
 */
export function verifyTraps(require, check) {
	check('stepping on a trapless cell fires no trap', () => {
		const source = readSceneSource();
		const start = source.indexOf('triggerTrapAt(this: DungeonScene, x: number, y: number)');
		assert.ok(start >= 0, 'triggerTrapAt is defined');
		const body = source.slice(start, start + 1200);
		const guard = body.indexOf('if (!this.trapKinds.has(this.level.index(x, y))) return;');
		const fallback = body.indexOf('const kind = this.trapKinds.get(this.level.index(x, y))');
		assert.ok(guard >= 0, 'triggerTrapAt returns early for cells with no registered trap');
		assert.ok(fallback >= 0, 'the kind lookup still exists for genuinely registered traps');
		assert.ok(guard < fallback, 'the trapless-cell guard runs before the kind fallback');
	});
	check('fired traps stay spent', () => {
		const source = readSceneSource();
		assert.match(source, /if \(this\.spentTrapCells\.has\(this\.level\.index\(x, y\)\)\) return;/,
			'spent cells never re-fire');
	});
}
