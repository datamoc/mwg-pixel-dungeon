import { Container, Rectangle, Sprite, Texture, TilingSprite } from 'pixi.js';

/** GameScene's scrolling water (-5 texture pixels/sec), below shoreline tiles.
 * Per-cell quads retain the port's visibility tint without exposing unseen water.
 */
export class WaterSurface extends Container {
	private cells = new Map<number, TilingSprite>();
	private ripples: { sprite: Sprite; age: number }[] = [];
	private offset = 0;
	private readonly rippleTexture: Texture;
	constructor(texture: Texture, effects: Texture, private columns: number, rows: number, isWater: (x: number, y: number) => boolean) {
		super();
		this.eventMode = 'none';
		this.rippleTexture = new Texture({ source: effects.source, frame: new Rectangle(0, 0, 16, 16) });
		for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) if (isWater(x, y)) {
			const tile = new TilingSprite({ texture, width: 16, height: 16 });
			tile.position.set(x * 16, y * 16); tile.tilePosition.set(-x * 16, -y * 16); tile.visible = false;
			this.cells.set(x + y * columns, tile); this.addChild(tile);
		}
	}
	setCellColor(x: number, y: number, tint: number): void {
		const tile = this.cells.get(x + y * this.columns);
		if (tile) { tile.tint = tint; tile.visible = tint !== 0; }
	}
	ripple(x: number, y: number): void {
		if (!this.cells.get(x + y * this.columns)?.visible) return;
		const sprite = new Sprite(this.rippleTexture); sprite.anchor.set(0.5); sprite.position.set(x * 16 + 8, y * 16 + 8);
		sprite.scale.set(0); this.addChild(sprite); this.ripples.push({ sprite, age: 0 });
	}
	update(dt: number): void {
		this.offset += 5 * dt;
		for (const tile of this.cells.values()) if (tile.visible) tile.tilePosition.y = -tile.y + this.offset;
		for (let i = this.ripples.length - 1; i >= 0; i--) {
			const ripple = this.ripples[i]; ripple.age += dt;
			if (ripple.age >= 0.5) { ripple.sprite.destroy(); this.ripples.splice(i, 1); }
			else { ripple.sprite.scale.set(ripple.age / 0.5); ripple.sprite.alpha = 1 - ripple.age / 0.5; }
		}
	}
}
