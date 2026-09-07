import { Rectangle, Sprite, Texture } from 'pixi.js';

/**
 * The arrow that points at the floor's exit, ported from `ui/Compass.java`.
 *
 * Java's whole implementation is an `Image` copied from `Icons.COMPASS` whose `angle` is
 * recomputed whenever the camera scrolls:
 *
 *     angle = atan2( cellCenter.x - center.x, center.y - cellCenter.y ) * 180/PI
 *
 * Note the argument order - `atan2(dx, -dy)` rather than the usual `atan2(dy, dx)` - which
 * is what makes 0 degrees point up the screen instead of right, matching art drawn pointing
 * up. `origin.set(width/2, RADIUS)` with `RADIUS = 12` puts the pivot 12px below the arrow's
 * top edge, so it swings around a point off the sprite rather than around its own centre.
 *
 * It stays hidden until the target cell is `visited` or `mapped` - you are not told where
 * the stairs are until you have seen them - and once shown it never hides again.
 *
 * The icon is `icons.png`'s 7x5 region at (16,72), `Icons.COMPASS`'s own
 * `uvRectBySize(16, 72, 7, 5)`.
 */
const RADIUS = 12;
const RAD_2_DEG = 180 / Math.PI;

export class Compass extends Sprite {
	private revealed = false;

	constructor(icons: Texture) {
		super(
			new Texture({
				source: icons.source,
				frame: new Rectangle(16, 72, 7, 5),
			})
		);
		//origin.set(width/2, RADIUS): pivot horizontally centred, RADIUS px down from the top
		this.anchor.set(0.5, 0);
		this.pivot.set(0, RADIUS);
		this.scale.set(2);
		this.visible = false;
	}

	/**
	 * @param targetWorld world-space centre of the cell being pointed at
	 * @param viewCentreWorld world-space point the camera is centred on
	 * @param targetSeen whether the target cell has been seen or magically mapped
	 */
	update(
		targetWorld: { x: number; y: number },
		viewCentreWorld: { x: number; y: number },
		targetSeen: boolean
	): void {
		if (!this.revealed) {
			this.revealed = targetSeen;
			this.visible = this.revealed;
		}
		if (!this.revealed) return;

		this.angle =
			Math.atan2(targetWorld.x - viewCentreWorld.x, viewCentreWorld.y - targetWorld.y) * RAD_2_DEG;
	}

	/** a new floor has its own exit, and its own "not yet seen" state */
	reset(): void {
		this.revealed = false;
		this.visible = false;
	}
}
