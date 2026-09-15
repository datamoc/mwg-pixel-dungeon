import { Container, Graphics, Texture } from 'mwg/two-d/pixi-interop';
import { ParticleEmitter } from 'mwg';

const TILE = 16;

interface Spot {
	x: number;
	y: number;
	emitter: ParticleEmitter;
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
 *
 * MWG 0.8.0 now expresses the three details these effects need: per-particle tint ranges,
 * age curves, and flicker. Each spot owns one pooled emitter so the port can retain Java's
 * FOV rule (invisible spots stop and clear immediately), which is a presentation concern above
 * the generic emitter. `Texture.WHITE` is the same one-colour quad used to represent the old
 * Graphics squares; the remaining difference is only that MWG owns the pool and physics now.
 */
export class WallDecorationLayer extends Container {
	private readonly kind: WallDecoKind;
	private readonly spots: Spot[];

	constructor(kind: WallDecoKind, cells: { x: number; y: number }[]) {
		super();
		this.kind = kind;
		this.spots = cells.map((cell) => {
			const emitter = new ParticleEmitter(decorationOptions(kind));
			emitter.position.set(cell.x * TILE + TILE / 2, cell.y * TILE + TILE / 2 + (kind === 'sink' ? 3 : kind === 'torch' ? 2 : 0));
			this.addChild(emitter);
			return { ...cell, emitter, glow: null, visible: false };
		});

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
		for (const spot of this.spots) {
			spot.visible = isVisible(spot.x, spot.y);
			if (spot.glow) spot.glow.visible = spot.visible;
			if (spot.visible) {
				if (!spot.emitter.isEmitting) spot.emitter.burst(1);
				spot.emitter.start();
			} else {
				spot.emitter.stop();
				spot.emitter.clear();
			}
			spot.emitter.update(dt);
		}
	}
}
function decorationOptions(kind: WallDecoKind) {
	if (kind === 'sink') return {
		texture: Texture.WHITE, max: 16, rate: 10, life: 0.4, speed: [-2, 2] as const,
		angle: [-0.12, 0.12] as const, gravity: { x: 0, y: 50 }, scale: [2, 2] as const, alpha: [1, 0] as const,
		spawn: { shape: 'ellipse' as const, width: 4, height: 1 }, tint: [0xb6ccc2, 0x3b6653] as const,
	};
	if (kind === 'torch') return {
		texture: Texture.WHITE, max: 16, rate: 1 / 0.15, life: [0.4, 0.7] as const,
		speed: [6, 18] as const, angle: [-Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5] as const,
		scale: [2, 0] as const, alpha: (t: number) => t < 0.2 ? t * 5 : 1 - t,
		spawn: { shape: 'ellipse' as const, width: 2, height: 1 }, tint: 0xffcc66,
		flicker: 0.45,
	};
	if (kind === 'smoke') return {
		texture: Texture.WHITE, max: 12, rate: 5, life: 2, speed: [3, 6] as const,
		angle: [-Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6] as const, scale: (t: number) => 6 - t * 3,
		alpha: (t: number) => t < 0.2 ? t * 5 : (1 - t) * 0.25,
		spawn: { shape: 'rect' as const, width: 1, height: 1 }, tint: 0x000000,
	};
	return {
		texture: Texture.WHITE, max: 8, rate: 1 / 0.7, life: 0.5, speed: 0, angle: 0,
		scale: [3, 3] as const, alpha: [1, 0] as const,
		spawn: { shape: 'rect' as const, width: TILE, height: TILE }, tint: 0xffd36a,
	};
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
	private readonly spots: { x: number; y: number; timer: number; emitter: ParticleEmitter; visible: boolean }[];

	constructor(cells: { x: number; y: number }[]) {
		super();
		this.spots = cells.map((cell) => {
			const emitter = new ParticleEmitter({
				texture: Texture.WHITE, max: 4, life: 1, speed: 40, angle: -Math.PI / 2,
				gravity: { x: 0, y: 80 }, scale: [4, 4],
				alpha: (t: number) => t < 0.2 ? t * 5 : 1,
				spawn: { shape: 'rect', width: TILE, height: TILE }, tint: 0xee7722,
			});
			emitter.position.set(cell.x * TILE + TILE / 2, cell.y * TILE + TILE / 2);
			this.addChild(emitter);
			return { ...cell, timer: Math.random() * 2, emitter, visible: false };
		});
	}

	update(dt: number, isVisible: (x: number, y: number) => boolean): void {
		for (const spot of this.spots) {
			spot.visible = isVisible(spot.x, spot.y);

			if (spot.visible) {
				spot.timer -= dt;
				if (spot.timer <= 0) {
					spot.timer = Math.random() * 2;
					spot.emitter.burst(1);
				}
			} else {
				spot.emitter.clear();
			}
			spot.emitter.update(dt);
		}
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

