import { Container, Graphics } from 'pixi.js';

const TILE = 16;

interface Particle {
	gfx: Graphics;
	vx: number;
	vy: number;
	ay: number;
	timeLeft: number;
	life: number;
}

interface Spot {
	x: number;
	y: number;
	timer: number;
	particles: Particle[];
	glow: Graphics | null;
	visible: boolean;
}

export type WallDecoKind = 'sink' | 'torch' | 'smoke' | 'ore';

/**
 * `SewerLevel.addSewerVisuals`'s `Sink` and `PrisonLevel.addPrisonVisuals`'s `Torch` - a
 * cosmetic particle effect at every real `WALL_DECO` cell a ported floor's painter placed
 * (`SewerPainter`/`PrisonPainter`'s real RNG-matched decoration pass, see `gameBridge.ts`'s
 * `SPD_TERRAIN_TO_GAME_KIND` comment on why the coarse terrain map itself can't tell a
 * decorated wall apart from a plain one). Both, like their real Java counterparts, are only
 * drawn while their cell is in the hero's current field of view (`Dungeon.level.heroFOV`).
 *
 * `Sink` (real: `pour(factory, 0.1f)`, colour `ColorMath.random(0xb6ccc2, 0x3b6653)`, size 2,
 * lifespan 0.4s, `acc.y = 50`, `speed.x = Random.Float(-2,2)`) is a handful of small
 * blue-green droplets falling from the decorated wall. `Torch` (real: `pour(FlameParticle
 * .FACTORY, 0.15f)` plus a `Halo(12, 0xFFFFCC, 0.4f)` soft glow) is warm rising sparks; the
 * glow here is a plain low-alpha filled circle rather than Java's soft radial-gradient
 * sprite - a stated simplification, not a different effect. Neither reproduces the Sink's
 * own real second half (`GameScene.ripple()` on the water tile below it) - this port's
 * water tiles have no ripple system to hook into.
 *
 * `smoke` is `CityLevel.Smoke`/`SmokeParticle`: `pour(factory, 0.2f)`, a black square
 * (`color(0x000000)`, `speed.set(Random.Float(-2,4), -Random.Float(3,6))`, lifespan 2s) that
 * shrinks from size 6 to 3 (`size(6 - p*3)`, `p = left/lifespan`) and fades in via `1-p` for the
 * first 20% of its life then out via `p*0.25` for the rest - the same two-phase alpha curve as
 * `torch`'s sparks, just with the threshold flipped (0.8 vs 0.2) since a torch spark is born
 * bright and a smoke puff is born faint.
 */
export class WallDecorationLayer extends Container {
	private readonly kind: WallDecoKind;
	private readonly spots: Spot[];

	constructor(kind: WallDecoKind, cells: { x: number; y: number }[]) {
		super();
		this.kind = kind;
		this.spots = cells.map((cell) => ({ ...cell, timer: 0, particles: [], glow: null, visible: false }));

		if (kind === 'torch') {
			for (const spot of this.spots) {
				const glow = new Graphics()
					.circle(0, 0, 10)
					.fill({ color: 0xffffcc, alpha: 0.18 });
				glow.position.set(spot.x * TILE + TILE / 2, spot.y * TILE + TILE / 2);
				glow.visible = false;
				this.addChild(glow);
				spot.glow = glow;
			}
		}
	}

	/** @param isVisible reports whether a cell is in the hero's current field of view */
	update(dt: number, isVisible: (x: number, y: number) => boolean): void {
		const pourRate = this.kind === 'sink' ? 0.1 : this.kind === 'torch' ? 0.15 : this.kind === 'smoke' ? 0.2 : 0.7;

		for (const spot of this.spots) {
			spot.visible = isVisible(spot.x, spot.y);
			if (spot.glow) spot.glow.visible = spot.visible;

			if (spot.visible) {
				spot.timer -= dt;
				while (spot.timer <= 0) {
					spot.timer += pourRate;
					this.spawn(spot);
				}
			}

			for (let i = spot.particles.length - 1; i >= 0; i--) {
				const p = spot.particles[i];
				p.vy += p.ay * dt;
				p.gfx.x += p.vx * dt;
				p.gfx.y += p.vy * dt;
				p.timeLeft -= dt;
				if (p.timeLeft <= 0 || !spot.visible) {
					this.removeChild(p.gfx);
					p.gfx.destroy();
					spot.particles.splice(i, 1);
					continue;
				}
				const life = p.timeLeft / p.life;
				if (this.kind === 'sink') {
					p.gfx.alpha = life;
				} else if (this.kind === 'torch') {
					p.gfx.alpha = life > 0.8 ? (1 - life) * 5 : life;
				} else if (this.kind === 'smoke') {
					p.gfx.alpha = life > 0.8 ? 1 - life : life * 0.25;
					p.gfx.scale.set(6 - life * 3);
				} else {
					p.gfx.alpha = life;
					p.gfx.scale.set(1 + life);
				}
			}
		}
	}

	private spawn(spot: Spot): void {
		const gfx = new Graphics();
		const cx = spot.x * TILE + TILE / 2;
		const cy = spot.y * TILE + TILE / 2;

		if (this.kind === 'sink') {
			//blue-green droplet, falling
			const mix = Math.random();
			const color = lerpColor(0xb6ccc2, 0x3b6653, mix);
			gfx.rect(-1, -1, 2, 2).fill({ color });
			gfx.position.set(cx + (Math.random() - 0.5) * 4, cy + 3);
			this.addChild(gfx);
			spot.particles.push({ gfx, vx: (Math.random() - 0.5) * 4, vy: 0, ay: 50, timeLeft: 0.4, life: 0.4 });
		} else if (this.kind === 'torch') {
			//warm spark, rising
			gfx.rect(-1, -1, 2, 2).fill({ color: 0xffcc66 });
			gfx.position.set(cx + (Math.random() - 0.5) * 2, cy + 2);
			this.addChild(gfx);
			const life = 0.4 + Math.random() * 0.3;
			spot.particles.push({ gfx, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 12 - 6, ay: 0, timeLeft: life, life });
		} else if (this.kind === 'smoke') {
			//black smoke puff, drifting up and shrinking (scale set per-frame in update())
			gfx.rect(-0.5, -0.5, 1, 1).fill({ color: 0x000000 });
			gfx.position.set(cx, cy);
			this.addChild(gfx);
			spot.particles.push({
				gfx,
				vx: -2 + Math.random() * 6,
				vy: -3 - Math.random() * 3,
				ay: 0,
				timeLeft: 2,
				life: 2,
			});
		} else {
			//CavesLevel.Vein/Sparkle: a short-lived amber glint on an ore wall.
			gfx.circle(0, 0, 1.5).fill({ color: 0xffd36a });
			gfx.position.set(cx + (Math.random() - 0.5) * TILE, cy + (Math.random() - 0.5) * TILE);
			this.addChild(gfx);
			spot.particles.push({ gfx, vx: 0, vy: 0, ay: 0, timeLeft: 0.5, life: 0.5 });
		}
	}
}

/**
 * `HallsLevel.Stream`/`FireParticle` - one per real `WATER` cell on a Halls floor (not gated on
 * decoration like `WallDecorationLayer` above: every water tile gets one, matching
 * `addHallsVisuals`'s unconditional `for (i) if (map[i]==WATER) group.add(new Stream(i))`), also
 * FOV-gated. Real values: `color(0xEE7722)`, `lifespan 1f`, `acc.set(0,+80)`,
 * `speed.set(0,-40)`, `size = 4`, two-phase alpha `p>0.8 ? (1-p)*5 : 1` (born fully bright, fades
 * only in its last 20%). Unlike the fixed-`pourRate` spots above, each real `Stream` re-rolls its
 * own `Random.Float(2)` delay after every spawn (average 1 ember/second/cell, not a fixed rate) -
 * modeled here with `Math.random() * 2` per spot rather than a shared `pourRate`. `PixelParticle
 * .Shrinking`'s shrink-over-life isn't reproduced (kept at a constant size 4, since Java's own
 * `size` field here is never reassigned after `reset()` despite the shrinking base class - i.e.
 * this trap is a documented no-op in the real game too, not a simplification on this port's part).
 */
export class WaterEmberLayer extends Container {
	private readonly spots: Spot[];

	constructor(cells: { x: number; y: number }[]) {
		super();
		this.spots = cells.map((cell) => ({ ...cell, timer: Math.random() * 2, particles: [], glow: null, visible: false }));
	}

	update(dt: number, isVisible: (x: number, y: number) => boolean): void {
		for (const spot of this.spots) {
			spot.visible = isVisible(spot.x, spot.y);

			if (spot.visible) {
				spot.timer -= dt;
				if (spot.timer <= 0) {
					spot.timer = Math.random() * 2;
					this.spawn(spot);
				}
			}

			for (let i = spot.particles.length - 1; i >= 0; i--) {
				const p = spot.particles[i];
				p.vy += p.ay * dt;
				p.gfx.x += p.vx * dt;
				p.gfx.y += p.vy * dt;
				p.timeLeft -= dt;
				if (p.timeLeft <= 0 || !spot.visible) {
					this.removeChild(p.gfx);
					p.gfx.destroy();
					spot.particles.splice(i, 1);
					continue;
				}
				const life = p.timeLeft / p.life;
				p.gfx.alpha = life > 0.8 ? (1 - life) * 5 : 1;
			}
		}
	}

	private spawn(spot: Spot): void {
		const gfx = new Graphics();
		const cx = spot.x * TILE + Math.random() * TILE;
		const cy = spot.y * TILE + Math.random() * TILE;
		gfx.rect(-2, -2, 4, 4).fill({ color: 0xee7722 });
		gfx.position.set(cx, cy);
		this.addChild(gfx);
		spot.particles.push({ gfx, vx: 0, vy: -40, ay: 80, timeLeft: 1, life: 1 });
	}
}

/**
 * `WellWater`'s visual ripple: a quiet pair of expanding rings over each active magic well.
 * The Java scene uses its water-surface ripple effect for this presentation; the port keeps
 * the gameplay state in the floor painter and owns this lightweight scene effect separately.
 * It is deterministic per cell and FOV-gated, so hidden wells do not animate needlessly.
 */
export class WellRippleLayer extends Container {
	private readonly wells: { x: number; y: number; phase: number; gfx: Graphics }[];
	private elapsed = 0;

	constructor(cells: { x: number; y: number }[]) {
		super();
		this.wells = cells.map((cell, index) => {
			const gfx = new Graphics();
			this.addChild(gfx);
			return { ...cell, phase: (index * 0.37) % 1.2, gfx };
		});
	}

	/** @param isVisible reports whether a cell is in the hero's current field of view */
	update(dt: number, isVisible: (x: number, y: number) => boolean): void {
		this.elapsed = (this.elapsed + dt) % 1.2;
		for (const well of this.wells) {
			if (!isVisible(well.x, well.y)) {
				well.gfx.visible = false;
				continue;
			}
			well.gfx.visible = true;
			well.gfx.clear();
			const cx = well.x * TILE + TILE / 2;
			const cy = well.y * TILE + TILE / 2;
			for (let ring = 0; ring < 2; ring++) {
				const t = ((this.elapsed + well.phase + ring * 0.6) % 1.2) / 1.2;
				well.gfx.ellipse(cx, cy, 2 + t * 5, 1.25 + t * 2.5)
					.stroke({ color: 0xb7ead5, width: 1, alpha: 0.55 * (1 - t) });
			}
		}
	}
}

function lerpColor(a: number, b: number, t: number): number {
	const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
	const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
	const r = Math.round(ar + (br - ar) * t);
	const g = Math.round(ag + (bg - ag) * t);
	const bl = Math.round(ab + (bb - ab) * t);
	return (r << 16) | (g << 8) | bl;
}
