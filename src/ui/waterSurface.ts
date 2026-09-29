import { Rectangle, Texture } from 'mwg/two-d/pixi-interop';
import { LiquidLayer } from 'mwg/two-d/render';

/** GameScene's scrolling water (-5 texture pixels/sec), below shoreline tiles.
 * The framework's `LiquidLayer` keeps per-cell quads, so the port's visibility tint never
 * exposes unseen water; the ripple is the effects sheet's first 16x16 frame.
 */
export class WaterSurface extends LiquidLayer {
	constructor(texture: Texture, effects: Texture, columns: number, rows: number, isWater: (x: number, y: number) => boolean) {
		super({
			texture,
			width: columns,
			height: rows,
			isLiquid: isWater,
			rippleTexture: new Texture({ source: effects.source, frame: new Rectangle(0, 0, 16, 16) }),
		});
	}
}
