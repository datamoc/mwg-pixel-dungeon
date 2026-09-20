import { ParticleEmitter } from 'mwg';
import { Container, Texture } from 'mwg/two-d/pixi-interop';
import { TILE } from '../dungeonConstants';
import type { DeathBurstSpec } from '../simulation/deathBursts';

/**
 * One-shot particle-burst constructors, moved verbatim from the scene as the
 * file-size refactor's forty-eighth extraction - the scene keeps thin wrappers
 * (`burstTeleportLight`, `burstShadowUp`, `playDeathBursts`) that bind its
 * emitter layer, live-burst list, FOV gate and audio cue. Behavior-identical:
 * every constant below is the scene's own, which for the shadow burst are
 * `ShadowParticle.UP`'s real values off `resetUp`/`update` (see the curse
 * infusion's coverage row) and for the death bursts are
 * `simulation/deathBursts.ts`'s Java-verified specs.
 */

/** A live one-shot burst owned by the scene's `updateEffectBursts` loop. */
export interface LiveBurst {
	emitter: ParticleEmitter;
	remaining: number;
}

function track(layer: Container, alive: LiveBurst[], emitter: ParticleEmitter, x: number, y: number, count: number, life: number): void {
	emitter.position.set(x * TILE, y * TILE);
	layer.addChild(emitter);
	emitter.burst(count);
	alive.push({ emitter, remaining: life });
}

/** `ScrollOfTeleportation.appear`'s arrival/departure light (shared by every
 * random teleport - scroll, Fadeleaf, curses, beacon, Blink, Golem, recall). */
export function spawnTeleportBurst(layer: Container, alive: LiveBurst[], x: number, y: number): void {
	const lightCurve = (t: number): number => (t < 0.2 ? t * 5 : (1 - t) * 1.25);
	const emitter = new ParticleEmitter({
		texture: Texture.WHITE,
		max: 3,
		rate: 0,
		life: 1,
		speed: 0,
		spin: Math.PI / 2,
		scale: lightCurve,
		alpha: lightCurve,
		spawn: { shape: 'rect', width: TILE, height: TILE },
	});
	track(layer, alive, emitter, x, y, 3, 1);
}

/** Rising purple motes: the curse infusion's five, and the death-burst
 * table's guard/succubus/ward counts through `spawnDeathBursts` below. */
export function spawnShadowBurst(layer: Container, alive: LiveBurst[], x: number, y: number, count: number): void {
	const emitter = new ParticleEmitter({
		texture: Texture.WHITE,
		max: count,
		rate: 0,
		life: 1,
		speed: [32, 48.7] as [number, number],
		angle: [-Math.PI / 2 - 0.245, -Math.PI / 2 + 0.245] as [number, number],
		scale: [6, 0] as [number, number],
		alpha: (t: number) => (t > 0.5 ? (1 - t) * (1 - t) * 4 : t * 2),
		tint: 0x440044,
		spawn: { shape: 'rect', width: TILE, height: TILE },
	});
	track(layer, alive, emitter, x, y, count, 1);
}

/** One-shot monster death/zap bursts from `simulation/deathBursts.ts`. */
export function spawnDeathBursts(layer: Container, alive: LiveBurst[], specs: DeathBurstSpec[], x: number, y: number, cue: (name: string) => void): void {
	for (const spec of specs) {
		const emitter = new ParticleEmitter({
			texture: Texture.WHITE,
			max: spec.count,
			rate: 0,
			life: spec.life,
			speed: [spec.speedMin, spec.speedMax] as [number, number],
			angle: [-Math.PI / 2 - spec.spread, -Math.PI / 2 + spec.spread] as [number, number],
			gravity: { x: 0, y: spec.gravity },
			scale: (spec.shrink ? [spec.size, 0] : [spec.size, spec.size]) as [number, number],
			alpha: spec.fade === 'shadow'
				? (t: number) => (t > 0.5 ? (1 - t) * (1 - t) * 4 : t * 2)
				: (t: number) => 1 - t,
			tint: spec.tint,
			spawn: { shape: 'rect', width: TILE, height: TILE },
		});
		track(layer, alive, emitter, x, y, spec.count, spec.life);
		if (spec.sound) cue(spec.sound);
	}
}
