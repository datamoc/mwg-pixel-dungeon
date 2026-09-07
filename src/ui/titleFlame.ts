import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';

const FRAME = 32;

/** `Fireball.java`'s `BLIGHT`/`FLIGHT`/`FLAME1`/`FLAME2` are the four equal quadrants of
 * `effects/fireball.png` (128x32, so 32x32 each), in that left-to-right order. */
function quadrant(texture: Texture, index: number): Texture {
	return new Texture({ source: texture.source, frame: new Rectangle(index * FRAME, 0, FRAME, FRAME) });
}

interface FlameParticle {
	sprite: Sprite;
	vx: number;
	vy: number;
	ay: number;
	timeLeft: number;
	grounded: boolean;
}

interface Spark {
	gfx: Graphics;
	vx: number;
	vy: number;
	timeLeft: number;
	life: number;
}

/**
 * `Fireball.java`'s title-screen torch: a slow-spinning glow (`bLight`, `angularSpeed = -90`),
 * a fast-spinning flare (`fLight`, `angularSpeed = 360`), a stream of rising flame quads
 * capped at `heightLimit` (`Fireball.this.y - 30`) via `Emitter.pour(..., 0.1f)` (one every
 * 0.1s), and sparks at `Random.Float() < Game.elapsed` (~1/s), colored between pink
 * (`0xFF66FF`) and green (`0x66FF66`) with gravity `acc = (0, +80)`. This port reimplements
 * the same spawn rates and the `Flame.update`/spark motion and fade curve (`p > 0.8f ? (1-p)*5
 * : p*1.25f`) with a small local particle array rather than the engine's `Emitter`/
 * `PixelParticle` pool - same visible behavior, no shared particle-pool machinery.
 */
export class TitleFlame extends Container {
	private readonly texture: Texture;
	private readonly glow: Sprite;
	private readonly flare: Sprite;
	private readonly flameLayer = new Container();
	private readonly sparkLayer = new Container();
	private readonly particles: FlameParticle[] = [];
	private readonly sparks: Spark[] = [];
	private flameTimer = 0;
	private readonly heightLimit = -30;

	constructor(texture: Texture, x: number, y: number) {
		super();
		this.texture = texture;
		this.position.set(x, y);

		this.glow = new Sprite(quadrant(texture, 0));
		this.glow.anchor.set(0.5);
		this.glow.blendMode = 'add';
		this.addChild(this.glow);

		this.addChild(this.flameLayer, this.sparkLayer);

		this.flare = new Sprite(quadrant(texture, 1));
		this.flare.anchor.set(0.5);
		this.flare.blendMode = 'add';
		this.addChild(this.flare);
	}

	update(dt: number): void {
		this.glow.rotation -= dt * (Math.PI / 2);
		this.flare.rotation += dt * (Math.PI * 2);

		this.flameTimer -= dt;
		while (this.flameTimer <= 0) {
			this.flameTimer += 0.1;
			this.spawnFlame();
		}
		if (Math.random() < dt) this.spawnSpark();

		this.updateParticles(dt);
		this.updateSparks(dt);
	}

	private spawnFlame(): void {
		const sprite = new Sprite(quadrant(this.texture, Math.random() < 0.5 ? 2 : 3));
		sprite.anchor.set(0.5);
		sprite.blendMode = 'add';
		sprite.x = (Math.random() - 0.5) * FRAME * 0.5;
		sprite.y = (Math.random() - 0.5) * FRAME * 0.5;
		this.flameLayer.addChild(sprite);
		this.particles.push({ sprite, vx: 0, vy: -40, ay: -20, timeLeft: 1, grounded: false });
	}

	private spawnSpark(): void {
		const gfx = new Graphics();
		gfx.rect(-1, -1, 2, 2).fill({ color: Math.random() < 0.5 ? 0x66ff66 : 0xff66ff });
		gfx.blendMode = 'add';
		this.sparkLayer.addChild(gfx);
		const life = 0.5 + Math.random() * 0.5;
		this.sparks.push({ gfx, vx: Math.random() * 80 - 40, vy: Math.random() * -80 - 60, timeLeft: life, life });
	}

	private updateParticles(dt: number): void {
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.vy += p.ay * dt;
			p.sprite.x += p.vx * dt;
			p.sprite.y += p.vy * dt;
			if (!p.grounded && p.sprite.y < this.heightLimit) {
				p.sprite.y = this.heightLimit;
				p.vx = Math.random() * 40 - 20;
				p.vy = 0;
				p.ay = 0;
				p.grounded = true;
			}
			p.timeLeft -= dt;
			if (p.timeLeft <= 0) {
				this.flameLayer.removeChild(p.sprite);
				p.sprite.destroy();
				this.particles.splice(i, 1);
				continue;
			}
			p.sprite.scale.set(p.timeLeft);
			p.sprite.alpha = p.timeLeft > 0.8 ? (1 - p.timeLeft) * 5 : p.timeLeft * 1.25;
		}
	}

	private updateSparks(dt: number): void {
		for (let i = this.sparks.length - 1; i >= 0; i--) {
			const s = this.sparks[i];
			s.vy += 80 * dt;
			s.gfx.x += s.vx * dt;
			s.gfx.y += s.vy * dt;
			s.timeLeft -= dt;
			if (s.timeLeft <= 0) {
				this.sparkLayer.removeChild(s.gfx);
				s.gfx.destroy();
				this.sparks.splice(i, 1);
				continue;
			}
			const p = s.timeLeft / s.life;
			s.gfx.alpha = p;
			s.gfx.scale.set(p);
		}
	}
}
