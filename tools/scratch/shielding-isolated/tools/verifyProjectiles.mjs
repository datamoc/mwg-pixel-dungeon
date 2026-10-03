import assert from 'node:assert/strict';
import { readSceneSource } from './sceneSource.mjs';

/**
 * Thrown piles fly their own item art (`MissileSprite.reset()` flies `view(item)`
 * over `ItemSpriteSheet`, tag `v3.3.8`): `MISSILE_WEP` is slot 144 with each class
 * at its own offset, the twelve tipped darts at `DARTS` 160 plus theirs, spinning
 * at `ANGULAR_SPEEDS` (1440 boomerang/bolas, 2160 shuriken, straight otherwise).
 * `Talent.IMPROVISED_PROJECTILES` throws a carried stone when the pile is empty,
 * so the flight art must follow the thrown item - a stone used to fly past as
 * whatever dart the pile still named. And while an aim is open the map shows a
 * crosshair: Java's `CellSelector` is a plain `ScrollArea` with no cursor art of
 * its own, so the crosshair is this port's affordance for the modal aim state
 * (restored to the pointer hand the moment the aim ends either way).
 *
 * The scene cannot load in this harness (Pixi), so the art table is pinned
 * behaviorally against the real compiled `items/missiles.ts` while the two
 * call-site wirings are pinned at source level, like `verifyDoors.mjs`.
 */
export function verifyProjectiles(require, check) {
	check('a thrown stone flies stone art, not the pile dart', () => {
		const { missileFlightArt, MISSILE_ITEM_FRAMES } = require('./items/missiles');
		//`xy(1,10)` is 1-based: `(x-1) + 16*(y-1)` = 144, not 161 - a fencepost here
		//once put every flight one row too low, so a stone (164) flew as HEALING_DART.
		assert.deepEqual(missileFlightArt('ThrowingStone'), { frame: 147, spin: 0 });
		assert.equal(missileFlightArt('SpiritArrow').frame, 144);
		assert.equal(missileFlightArt('ForceCube').frame, 159);
		//every authored pile class resolves to its own frame, never the dot fallback
		for (const [sourceClass, frame] of Object.entries(MISSILE_ITEM_FRAMES)) {
			const art = missileFlightArt(sourceClass);
			assert.ok(art, `${sourceClass} has flight art`);
			assert.equal(art.frame, frame);
		}
		assert.equal(missileFlightArt('HeavyBoomerang').spin, 1440);
		assert.equal(missileFlightArt('Bolas').spin, 1440);
		assert.equal(missileFlightArt('Shuriken').spin, 2160);
		assert.equal(missileFlightArt('ThrowingKnife').spin, 0);
		assert.equal(missileFlightArt('TippedDart', 'firebloom').frame, 162);
		assert.equal(missileFlightArt('TippedDart', 'blindweed').frame, 172);
		assert.equal(missileFlightArt('TippedDart', 'rotberry').frame, 161);
		assert.equal(missileFlightArt('TippedDart'), null);
		assert.equal(missileFlightArt('NoSuchClass'), null);
	});
	check('an improvised throw hands stone art to the spawn call', () => {
		const source = readSceneSource();
		assert.match(source, /thrownSourceClass = 'ThrowingStone';/,
			'an empty pile throws the stone class, not the pile class');
		assert.match(source, /thrownTippedSeed = undefined;/,
			'a stone carries no dart tip');
		assert.match(source, /missileFlightArt\(thrownSourceClass, thrownTippedSeed\)/,
			'the flight art follows the thrown item, not the pile fields');
	});
	check('an aim shows a crosshair cursor until it ends', () => {
		const source = readSceneSource();
		assert.match(source, /this\.map\.cursor = 'crosshair';/,
			'opening an aim swaps the pointer hand for a crosshair');
		const restores = source.match(/if \(this\.map\) this\.map\.cursor = 'pointer';/g) ?? [];
		assert.equal(restores.length, 2, 'cancel and confirm both restore the pointer hand');
	});
}
