import { Rectangle, Sprite, Texture } from 'pixi.js';

/** HeroSprite's cloth-tier idle/run/attack frames and CharSprite's 0.1s movement.
 * Logical turns still resolve immediately; this class only animates presentation.
 */
export class HeroAnimation {
	private frames: Texture[];
	private time = 0;
	private attackTime = -1;
	private deathTime = -1;
	private motion: { x: number; y: number; tx: number; ty: number; time: number } | null = null;
	constructor(private sprite: Sprite, texture: Texture) {
		this.frames = Array.from({ length: 21 }, (_, i) => new Texture({ source: texture.source, frame: new Rectangle(i * 12, 15, 12, 15) }));
	}
	move(x: number, y: number): void { this.motion = { x: this.sprite.x, y: this.sprite.y, tx: x, ty: y, time: 0 }; }
	attack(): void { this.attackTime = 0; }
	/** HeroSprite's terminal cloth-tier death pose; the hero does not fade like mobs. */
	die(): void { this.motion = null; this.attackTime = -1; this.deathTime = 0; }
	reset(): void { this.motion = null; this.attackTime = -1; this.deathTime = -1; }
	update(dt: number): void {
		if (this.sprite.destroyed) return;
		if (this.deathTime >= 0) {
			this.deathTime += dt;
			this.sprite.texture = this.frames[[8, 9, 10, 11, 12, 11][Math.min(5, Math.floor(this.deathTime * 20))]];
			return;
		}
		this.time += dt;
		let frame = [0, 0, 0, 1, 0, 0, 1, 1][Math.floor(this.time) % 8];
		if (this.motion) {
			const m = this.motion; m.time += dt;
			const progress = Math.min(1, m.time / 0.1);
			this.sprite.position.set(m.x + (m.tx - m.x) * progress, m.y + (m.ty - m.y) * progress);
			frame = 2 + Math.floor(m.time * 20) % 6;
			if (progress === 1) this.motion = null;
		}
		if (this.attackTime >= 0) {
			this.attackTime += dt;
			const index = Math.floor(this.attackTime * 15);
			frame = [13, 14, 15, 0][Math.min(index, 3)];
			if (index >= 4) this.attackTime = -1;
		}
		this.sprite.texture = this.frames[frame];
	}
}
