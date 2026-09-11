import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { ParticleEmitter } from 'mwg';

const FRAME = 32;

/** `Fireball.java`'s `BLIGHT`/`FLIGHT`/`FLAME1`/`FLAME2` are the four equal quadrants of
 * `effects/fireball.png` (128x32, so 32x32 each), in that left-to-right order. */
function quadrant(texture: Texture, index: number): Texture {
	return new Texture({ source: texture.source, frame: new Rectangle(index * FRAME, 0, FRAME, FRAME) });
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
 * `PixelParticle` pool. The flame stream now uses MWG's pooled `ParticleEmitter` and its
 * per-particle frame sequence; the tiny colour-only sparks remain local graphics.
 */
export class TitleFlame extends Container {
	private readonly glow: Sprite;
	private readonly flare: Sprite;
	private readonly flameEmitter: ParticleEmitter;
	private readonly sparkLayer = new Container();
	private readonly sparks: Spark[] = [];

	constructor(texture: Texture, x: number, y: number) {
		super();
		this.position.set(x, y);

		this.glow = new Sprite(quadrant(texture, 0));
		this.glow.anchor.set(0.5);
		this.glow.blendMode = 'add';
		this.addChild(this.glow);

		//`Emitter.pour(..., 0.1f)` becomes rate 10. ParticleEmitter has no spawn-position
		//range or height clamp, so the old few-pixel scatter and `heightLimit` are a deliberate
		//presentation reduction; its per-particle angle/speed/spin ranges keep the flame from
		//forming an artificial straight column while frame selection, pooling, lifetime, and
		//upward motion remain shared.
		this.flameEmitter = new ParticleEmitter({
			frames: [quadrant(texture, 2), quadrant(texture, 3)],
			max: 16,
			rate: 10,
			life: 1,
			speed: [32, 48],
			angle: [-Math.PI / 2 - 0.28, -Math.PI / 2 + 0.28],
			gravity: { x: 0, y: -20 },
			scale: [1, 0],
			alpha: [0, 1],
			spin: [-0.8, 0.8],
		});
		this.flameEmitter.blendMode = 'add';
		this.flameEmitter.start();
		this.addChild(this.flameEmitter, this.sparkLayer);

		this.flare = new Sprite(quadrant(texture, 1));
		this.flare.anchor.set(0.5);
		this.flare.blendMode = 'add';
		this.addChild(this.flare);
	}

	update(dt: number): void {
		this.glow.rotation -= dt * (Math.PI / 2);
		this.flare.rotation += dt * (Math.PI * 2);

		if (Math.random() < dt) this.spawnSpark();

		this.flameEmitter.update(dt);
		this.updateSparks(dt);
	}

	private spawnSpark(): void {
		const gfx = new Graphics();
		gfx.rect(-1, -1, 2, 2).fill({ color: Math.random() < 0.5 ? 0x66ff66 : 0xff66ff });
		gfx.blendMode = 'add';
		this.sparkLayer.addChild(gfx);
		const life = 0.5 + Math.random() * 0.5;
		this.sparks.push({ gfx, vx: Math.random() * 80 - 40, vy: Math.random() * -80 - 60, timeLeft: life, life });
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
