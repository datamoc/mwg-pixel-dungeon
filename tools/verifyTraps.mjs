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
	const { nonSolidDistanceMap } = require('./simulation/trapAreas');
	const { tenguDartPoisonAmount, tenguTrapFill } = require('./simulation/tenguDart');
	check('Tengu dart poison follows Badder Bosses fixed amounts, not the depth-scaled ordinary dart', () => {
		assert.equal(tenguDartPoisonAmount(false), 8);
		assert.equal(tenguDartPoisonAmount(true), 15);
		assert.deepEqual([0.4, 0.65, 0.9].map((fill) => tenguTrapFill(fill, false)), [0.4, 0.65, 0.9]);
		assert.deepEqual([0.4, 0.65, 0.9].map((fill) => tenguTrapFill(fill, true)), [0.775, 0.8375, 0.9]);
		const source = readSceneSource();
		assert.match(source, /seedBossTrap\(\{ x, y \}, 'tenguDart'\)/);
		assert.match(source, /tenguTrapFill\(baseFill, isChallengeEnabled\('stronger_bosses'\)\)/);
		assert.match(source, /kind === 'poisonDart' \|\| kind === 'tenguDart'[\s\S]*?tenguDartPoisonAmount\(isChallengeEnabled\('stronger_bosses'\)\)/);
		assert.match(source, /kind === 'tenguDart' && monster\.kind === 'tengu'[\s\S]*?this\.spentTrapCells\.add\(cell\)/);
		assert.match(source, /reigniteBuff\(monster, 'poison', poisonAmount\)/);
	});
	check('Frost and Rockfall flood the Java non-solid area, including chasm cells', () => {
		const offsets = [-6, -5, -4, -1, 1, 4, 5, 6];
		const distance = nonSolidDistanceMap(5, 5, 12, offsets, (cell) => cell !== 6, 2);
		assert.equal(distance[7], 1, 'chasm/non-solid bridge cell is in the flood');
		assert.equal(distance[2], 2, 'distance two from the trap is included');
		assert.equal(distance[6], -1, 'solid wall cells are excluded');
		const source = readSceneSource();
		assert.match(source, /function trapAreaDistances[\s\S]*?nonSolidDistanceMap[\s\S]*?scene\.isChasmCell/);
		assert.match(source, /kind === 'frost'[\s\S]*?trapAreaDistances\(this, x, y, 2\)/);
		assert.match(source, /kind === 'rockfall'[\s\S]*?trapAreaDistances\(this, x, y, 2\)/);
		assert.match(source, /isNonSolidTrapCell\(this, rx, ry\)/,
			'Rockfall room cells use Java !solid rather than movement passability');
	});
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
		assert.match(source, /if \(heap && !heap\.forSale && heap\.chest === undefined && heap\.item\)[\s\S]*?const destination = this\.randomFreeCell\(\);[\s\S]*?if \(destination\) \{[\s\S]*?removeGroundItem\(heap\)[\s\S]*?spawnGroundItem\(heap\.kind, destination\.x, destination\.y, heap\.item\)[\s\S]*?cue\('teleport'/,
			'TeleportationTrap moves only plain heaps and presents Java\'s heap relocation');
	});
	check('PitfallTrap waits through automatic turns, then collapses characters and heaps', () => {
		const source = readSceneSource();
		const trap = source.slice(source.indexOf('activateUtilityTrap(this: DungeonScene'), source.indexOf('triggerUnattendedTrapAt(this: DungeonScene'));
		const pitfall = trap.slice(trap.indexOf("kind === 'pitfall'"), trap.indexOf("kind === 'frost'"));
		assert.match(pitfall, /this\.schedulePitfallCollapse\(x, y\)/);
		assert.doesNotMatch(pitfall, /this\.pitfallDrop\(/, 'the trap no longer drops the hero immediately');
		assert.match(source, /awaitHeroInput: \(\) => \{[\s\S]*?resolvePendingPitfallCollapses\(\)[\s\S]*?this\.awaitingInput = true/,
			'collapse resolves at the automatic-turn boundary before the next hero input');
		assert.match(source, /target && !target\.flying[\s\S]*?this\.markHazardMob\(target\)[\s\S]*?this\.kill\(target, 'falling'\)/,
			'non-flying mobs receive Java Chasm.mobFall hazard credit before dying');
		assert.match(source, /heap\.forSale \|\| heap\.chest === 'locked' \|\| heap\.chest === 'crystal'[\s\S]*?this\.dropToChasm\(heap\.kind, heap\.item, heap\.chest\)/,
			'ordinary heap contents fall while shop and special chest heaps remain');
		assert.match(source, /if \(!heroFalls \|\| this\.hero\.buffs\['levitation'\]\) return false;[\s\S]*?this\.pitfallDrop\(\)/,
			'the hero falls last, after all affected cells are processed');
	});
}
