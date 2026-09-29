import { FogLayer, type FogColor } from 'mwg/two-d/render';
import { brightness, brightnessFogAlpha } from '../settings';
import { fogHalves } from '../spdLevelGen/fog';

/** Java's two fog pixels per tile, rendered once above terrain and characters.
 * The port still merges mapped/visited exploration, so mapped blue is available
 * here but not selected by the current field-of-view adapter.
 */
export class FogOfWar extends FogLayer {
	private readonly levelWidth: number;
	private readonly levelHeight: number;
	constructor(width: number, height: number) {
		super({ width, height, tileSize: 16, resolution: 2, palette: fogPalette() });
		this.levelWidth = width;
		this.levelHeight = height;
	}
	update(terrain: (x: number, y: number) => number, state: (x: number, y: number) => number): void {
		// `FogOfWar.updateVisibility` re-reads `SPDSettings.brightness()` on every render,
		// so the explored shade follows the slider without a cached copy.
		this.setPalette(fogPalette());
		//each tile is two fog pixels wide and two tall, the left and right halves shaded apart
		this.refresh((x, y) => {
			const [left, right] = fogHalves(x, y, this.levelWidth, this.levelHeight, terrain, state);
			return [left, right, left, right];
		});
	}
}

/** Java's `FOG_COLORS`: visible, visited, mapped, invisible - the level selects the visited-row alpha */
function fogPalette(): FogColor[] {
	const shade = brightnessFogAlpha(brightness());
	return [[0, 0, 0, 0], [0, 0, 0, shade], [25, 51, 102, shade], [0, 0, 0, 255]];
}
