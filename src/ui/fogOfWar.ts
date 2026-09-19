import { Sprite, Texture } from 'mwg/two-d/pixi-interop';
import { brightness, brightnessFogAlpha } from '../settings';
import { fogHalves } from '../spdLevelGen/fog';

/** Java's two fog pixels per tile, rendered once above terrain and characters.
 * The port still merges mapped/visited exploration, so mapped blue is available
 * here but not selected by the current field-of-view adapter.
 */
export class FogOfWar extends Sprite {
	private context: CanvasRenderingContext2D;
	private pixels: ImageData;
	constructor(private columns: number, private rows: number) {
		const canvas = document.createElement('canvas');
		canvas.width = columns * 2; canvas.height = rows * 2;
		const context = canvas.getContext('2d')!;
		super(Texture.from(canvas));
		this.context = context;
		this.pixels = context.createImageData(canvas.width, canvas.height);
		// TextureCache.create uses LINEAR for this generated mask, unlike sprite atlases.
		this.texture.source.scaleMode = 'linear';
		this.scale.set(8);
		this.eventMode = 'none';
	}
	refresh(terrain: (x: number, y: number) => number, state: (x: number, y: number) => number): void {
			// `FogOfWar.updateVisibility` re-reads `SPDSettings.brightness()` on every render,
	// so the explored shade follows the slider without a cached copy: the level maps
	// to Java's `FOG_COLORS` visited-row alpha via `brightnessFogAlpha` (0 keeps 153).
	const shade = brightnessFogAlpha(brightness());
	const colors = [[0, 0, 0, 0], [0, 0, 0, shade], [25, 51, 102, shade], [0, 0, 0, 255]];
		for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.columns; x++) {
			const halves = fogHalves(x, y, this.columns, this.rows, terrain, state);
			for (let half = 0; half < 2; half++) for (let row = 0; row < 2; row++) {
				const offset = ((y * 2 + row) * this.columns * 2 + x * 2 + half) * 4;
				this.pixels.data.set(colors[halves[half]], offset);
			}
		}
		this.context.putImageData(this.pixels, 0, 0);
		this.texture.source.update();
	}
	override destroy(): void {
		// This generated texture is owned by this floor, unlike the shared sprite atlases.
		super.destroy({ texture: true, textureSource: true });
	}
}
