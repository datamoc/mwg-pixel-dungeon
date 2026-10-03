import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * Map taps must reach the map TileMap (`coreSpawnTiles.ts`'s pointerdown
 * listener). Purely visual layers sit above the map in hit order, and a
 * container-level `eventMode = 'none'` does NOT disable its children: an
 * interactive-default child captures the hit, the event bubbles up its own
 * ancestor chain, and the map never hears it. The water-surface TilingSprites
 * swallowed every tap on water cells (the hero could never be tapped onto
 * water - found by the T52 bot, 2026-09-26), so every per-cell visual below
 * opts its children out explicitly.
 *
 * These files cannot load in this harness (Pixi), so the opt-outs are pinned
 * at source level the way verifyDoors does.
 */
export function verifyMapInput(require, check) {
	const ui = (file) => readFileSync(new URL(`../src/ui/${file}`, import.meta.url), 'utf8');

	check('water-surface tiles never capture pointer hits', () => {
		//the opt-outs now live in the framework's LiquidLayer (pinned by mwg's own tests)
		assert.match(ui('waterSurface.ts'), /extends LiquidLayer/,
			'the water surface is the framework LiquidLayer, whose cells and ripples opt out of pointer events');
		const layer = readFileSync(new URL('../node_modules/mwg/dist/two-d/render/LiquidLayer.js', import.meta.url), 'utf8');
		assert.match(layer, /tile\.eventMode = 'none'/);
		assert.match(layer, /sprite\.eventMode = 'none'/);
	});
	check('well ripples and torch glows never capture pointer hits', () => {
		const source = ui('wallDecorations.ts');
		assert.match(source, /gfx\.eventMode = 'none'/,
			'each well-ripple Graphics opts out');
		assert.match(source, /glow\.eventMode = 'none'/,
			'each torch-glow Graphics opts out');
		assert.match(source, /emitter\.eventMode = 'none'/,
			'decoration particle emitters opt out');
	});
}
