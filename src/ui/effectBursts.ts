import { ParticleEmitter, type ParticleEmitterOptions } from 'mwg';
import { Container, Texture } from 'mwg/two-d/pixi-interop';
import { TILE } from '../dungeonConstants';
import type { DeathBurstSpec } from '../simulation/deathBursts';
import { pourAurasFor, type PourAuraSpec } from '../simulation/pourAuras';
import type { Creature } from '../combat';
import { missingBlobCellEmitterOptions } from './blobCellEmitters';

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

/** `new Flare(6, 32).color(color, true).show(ch.sprite, 2f)` - Java's own 6-point
 * star flare, `Cleanse.onCast()` (`actors/hero/spells/Cleanse.java`, pink 0xFF4CD2)
 * and `BlessSpell.castSpell()` (`actors/hero/spells/BlessSpell.java`, yellow
 * 0xFFFF00) both use the identical shape and 2s duration, only the color differs.
 * This port has no star-sprite flare, so colored sparkles on the same 2s beat
 * stand in for both (same colour, same duration). */
export function spawnFlare(layer: Container, alive: LiveBurst[], x: number, y: number, color: number): void {
	const emitter = new ParticleEmitter({
		texture: Texture.WHITE,
		max: 8,
		rate: 0,
		life: 2,
		speed: [8, 24] as [number, number],
		angle: [-Math.PI, 0] as [number, number],
		scale: [8, 0] as [number, number],
		alpha: (t: number) => 1 - t,
		tint: color,
		spawn: { shape: 'rect', width: TILE, height: TILE },
	});
	track(layer, alive, emitter, x, y, 8, 2);
}

/** `ch.sprite.burst(0xFFFFFF44, 5)` (`Sunray.java`'s hit flash, tag `v3.3.8`):
 * `CharSprite.burst()` is a quick outward poof of `count` particles in the
 * caller's tint/alpha, life ~0.4-1s per particle - reused here (not a
 * dedicated Sunray-only shape) since Java's own method is itself generic. */
export function spawnHitFlash(layer: Container, alive: LiveBurst[], x: number, y: number, count: number, color: number): void {
	const emitter = new ParticleEmitter({
		texture: Texture.WHITE,
		max: count,
		rate: 0,
		life: 0.6,
		speed: [8, 20] as [number, number],
		angle: [-Math.PI, 0] as [number, number],
		scale: [3, 0] as [number, number],
		alpha: (t: number) => 0.27 * (1 - t),
		tint: color,
		spawn: { shape: 'rect', width: TILE, height: TILE },
	});
	track(layer, alive, emitter, x, y, count, 0.6);
}

/** A short white chip burst for `Splash.at(cell, 0xFFFFFF, 5)` (`CrystalSpire.java`, v3.3.8).
 * The port uses five shrinking white pixels in place of Java's directional splash film. */
export function spawnCrystalSplash(layer: Container, alive: LiveBurst[], x: number, y: number): void {
	const emitter = new ParticleEmitter({
		texture: Texture.WHITE, max: 5, rate: 0, life: 0.45,
		speed: [12, 34] as [number, number], angle: [0, Math.PI * 2] as [number, number],
		scale: [3, 0] as [number, number], alpha: (t: number) => 1 - t, tint: 0xffffff,
		spawn: { shape: 'rect', width: TILE / 2, height: TILE / 2 },
	});
	track(layer, alive, emitter, x, y, 5, 0.45);
}

/** Particle stand-ins for SPD trap presentation factories (`levels/traps/*.java`,
 * tag `v3.3.8`). SPD's directional film particles are not available in the generic
 * white-pixel backend; burst counts, colors and broad direction are carried where known,
 * while timed emitter cadence and film artwork are simplified. */
export type TrapSpeckKind = 'scream' | 'light' | 'frost' | 'ooze' | 'wool' | 'wound' | 'rock' | 'pitfall' | 'steam' | 'flame';
export function spawnTrapSpecks(layer: Container, alive: LiveBurst[], x: number, y: number, kind: TrapSpeckKind): void {
	const options: Record<TrapSpeckKind, ParticleEmitterOptions & { count: number; duration: number }> = {
		scream: { texture: Texture.WHITE, max: 3, rate: 0, life: 0.8, speed: [10, 18] as [number, number], angle: [-Math.PI * 0.72, -Math.PI * 0.28] as [number, number], scale: [4, 0] as [number, number], alpha: (t) => 1 - t, tint: 0xFFFF88, spawn: { shape: 'rect', width: TILE / 3, height: TILE / 3 }, count: 3, duration: 0.8 },
		light: { texture: Texture.WHITE, max: 4, rate: 0, life: 1, speed: [8, 20] as [number, number], angle: [0, Math.PI * 2] as [number, number], scale: [4, 0] as [number, number], alpha: (t) => 1 - t, tint: 0xFFFFAA, spawn: { shape: 'rect', width: TILE, height: TILE }, count: 4, duration: 1 },
		frost: { texture: Texture.WHITE, max: 5, rate: 0, life: 0.45, speed: [12, 34] as [number, number], angle: [0, Math.PI * 2] as [number, number], scale: [3, 0] as [number, number], alpha: (t) => 1 - t, tint: 0xB2D6FF, spawn: { shape: 'rect', width: TILE / 2, height: TILE / 2 }, count: 5, duration: 0.45 },
		ooze: { texture: Texture.WHITE, max: 5, rate: 0, life: 0.45, speed: [8, 24] as [number, number], angle: [0, Math.PI * 2] as [number, number], scale: [3, 0] as [number, number], alpha: (t) => 0.8 * (1 - t), tint: 0x000000, spawn: { shape: 'rect', width: TILE / 2, height: TILE / 2 }, count: 5, duration: 0.45 },
		wool: { texture: Texture.WHITE, max: 4, rate: 0, life: 0.7, speed: [4, 12] as [number, number], angle: [0, Math.PI * 2] as [number, number], scale: [5, 0] as [number, number], alpha: (t) => 1 - t, tint: 0xFFFFFF, spawn: { shape: 'rect', width: TILE / 2, height: TILE / 2 }, count: 4, duration: 0.7 },
		wound: { texture: Texture.WHITE, max: 5, rate: 0, life: 0.6, speed: [8, 20] as [number, number], angle: [0, Math.PI * 2] as [number, number], scale: [3, 0] as [number, number], alpha: (t) => 0.4 * (1 - t), tint: 0xCC2222, spawn: { shape: 'rect', width: TILE / 2, height: TILE / 2 }, count: 5, duration: 0.6 },
		rock: { texture: Texture.WHITE, max: 10, rate: 0, life: 0.7, speed: [28, 48] as [number, number], angle: [-Math.PI * 0.58, -Math.PI * 0.42] as [number, number], gravity: { x: 0, y: 90 }, scale: [5, 2] as [number, number], alpha: (t) => 1 - t, tint: 0x777777, spawn: { shape: 'rect', width: TILE, height: TILE / 4 }, count: 10, duration: 0.7 },
		pitfall: { texture: Texture.WHITE, max: 8, rate: 0, life: 0.8, speed: [8, 22] as [number, number], angle: [Math.PI * 0.35, Math.PI * 0.65] as [number, number], gravity: { x: 0, y: 36 }, scale: [4, 0] as [number, number], alpha: (t) => 1 - t, tint: 0x806044, spawn: { shape: 'rect', width: TILE, height: TILE }, count: 8, duration: 0.8 },
		steam: { texture: Texture.WHITE, max: 10, rate: 0, life: 1, speed: [10, 15] as [number, number], angle: [-Math.PI * 0.55, -Math.PI * 0.45] as [number, number], spin: [0, Math.PI] as [number, number], scale: (t) => 1 + t, alpha: (t) => Math.sqrt(Math.min(t, 1 - t) * 0.5), tint: 0xCCCCCC, spawn: { shape: 'rect', width: TILE / 2, height: TILE / 2 }, count: 10, duration: 1 },
		flame: { texture: Texture.WHITE, max: 10, rate: 0, life: 0.6, speed: 0, angle: [-Math.PI / 2, -Math.PI / 2] as [number, number], gravity: { x: 0, y: -80 }, scale: (t) => 4 * (1 - t), alpha: (t) => t < 1 / 5 ? t * 5 : 1 - t, tint: 0xEE7722, spawn: { shape: 'rect', width: TILE, height: TILE }, count: 10, duration: 0.6 },
	};
	const { count, duration, ...emitterOptions } = options[kind];
	const emitter = new ParticleEmitter(emitterOptions);
	track(layer, alive, emitter, x, y, count, duration);
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

/** A continuous pour aura owned by `syncPourAuras` below. */
export interface LiveAura {
	emitter: ParticleEmitter;
	key: string;
}

function auraKey(specs: PourAuraSpec[]): string {
	return JSON.stringify(specs);
}

function spawnPourAura(layer: Container, spec: PourAuraSpec, x: number, y: number): ParticleEmitter {
	//`ParticleEmitter.start()` is the pour switch: Java's `pour(factory,
	//interval)` becomes `rate: 1/interval` with the pool sized for two
	//lifetimes of headroom. `life`/`speed`/`tint` ranges are Java's own
	//`Random.Float` ranges; the `size` pair is not expressible (an emitter
	//`scale` pair reads birth-to-death, not a per-particle draw), so ranged
	//sizes settle on the midpoint, stated not silent.
	const lifeMax = Array.isArray(spec.life) ? spec.life[1] : spec.life;
	const size = Array.isArray(spec.size) ? (spec.size[0] + spec.size[1]) / 2 : spec.size;
	const emitter = new ParticleEmitter({
		texture: Texture.WHITE,
		max: Math.ceil(spec.rate * lifeMax * 2) + 8,
		rate: spec.rate,
		life: spec.life,
		speed: [spec.speedMin, spec.speedMax] as [number, number],
		angle: [-Math.PI / 2 + (spec.angleOffset ?? 0) - spec.spread, -Math.PI / 2 + (spec.angleOffset ?? 0) + spec.spread] as [number, number],
		gravity: { x: 0, y: spec.gravity },
		scale: (spec.grow ? [spec.grow[0], spec.grow[1]] : spec.shrink ? [size, 0] : [size, size]) as [number, number],
		alpha: spec.fade === 'shadow'
			? (t: number) => (t > 0.5 ? (1 - t) * (1 - t) * 4 : t * 2)
			: spec.fade === 'smoke'
				? (t: number) => { const remaining = 1 - t; return remaining > 0.8 ? 1 - remaining : remaining * 0.25; }
				: (t: number) => 1 - t,
		tint: spec.tint,
		spawn: { shape: 'rect', width: TILE, height: TILE },
	});
	emitter.position.set(x * TILE, y * TILE);
	layer.addChild(emitter);
	emitter.start();
	return emitter;
}

/** Per-scene live auras, so `syncPourAuras` never touches scene state (the
 * file-size budget leaves `dungeonScene.ts` no room for even a field). */
const aurasByScene = new WeakMap<object, Map<unknown, LiveAura[]>>();

/** Minimal scene surface the aura sync reads - everything here already exists. */
export interface PourAuraScene {
	creatures: Iterable<Creature & { x: number; y: number; allyKind?: string; elementalType?: 'fire' | 'frost' | 'shock' | 'chaos'; yogFistType?: 'burning' | 'soiled' | 'rotting' | 'rusted' | 'bright' | 'dark'; dmSupercharged?: boolean; beamCharged?: boolean; hasGnollSapper?: boolean }>;
	fov: { isVisible(x: number, y: number): boolean };
	effectLayer: Container;
	gnollHasSapper?: (creature: Creature) => boolean;
}

/**
 * Continuous pour auras (`simulation/pourAuras.ts`), synced every frame the
 * way Java's sprite `update()` re-poses its emitters: a creature whose spec
 * set changed (supercharge lit, goo bloodied, eye charged) is rebuilt, a
 * creature with none loses its emitter, and everything follows cells and FOV.
 */
export function syncPourAuras(scene: PourAuraScene, dt = 0): void {
	let live = aurasByScene.get(scene);
	if (!live) {
		live = new Map();
		aurasByScene.set(scene, live);
	}
	const seen = new Set<unknown>();
	for (const creature of scene.creatures) {
		seen.add(creature);
		const specs = pourAurasFor({
			...creature,
			hasGnollSapper: creature.kind === 'gnollGeomancer' && (scene.gnollHasSapper?.(creature) ?? false),
		});
		const key = auraKey(specs);
		const current = live.get(creature);
		if (current && current[0]?.key === key && current.length === specs.length) {
			for (let i = 0; i < specs.length; i++) {
				const aura = current[i]!;
				aura.emitter.position.set(creature.x * TILE, creature.y * TILE);
				aura.emitter.visible = scene.fov.isVisible(creature.x, creature.y);
				if (aura.emitter.visible && dt > 0) aura.emitter.update(dt);
			}
			continue;
		}
		if (current) {
			for (const aura of current) aura.emitter.destroy();
			live.delete(creature);
		}
		if (specs.length === 0) continue;
		const built: LiveAura[] = specs.map((spec) => {
			const emitter = spawnPourAura(scene.effectLayer, spec, creature.x, creature.y);
			emitter.visible = scene.fov.isVisible(creature.x, creature.y);
			if (emitter.visible && dt > 0) emitter.update(dt);
			return { emitter, key };
		});
		live.set(creature, built);
	}
	for (const [creature, auras] of live) {
		if (seen.has(creature)) continue;
		for (const aura of auras) aura.emitter.destroy();
		live.delete(creature);
	}
}

/** Minimal blob-cell surface used by the visual sync below. */
export interface BlobVisualLayer { id: string; tint: number; volumeAt: (x: number, y: number) => number; }
interface BlobVolumeSource { volumeAt(x: number, y: number): number; }
export interface BlobVisualScene {
	level: { width: number; height: number };
	fov: { isVisible(x: number, y: number): boolean };
	effectLayer: Container;
	plantFreeze?: BlobVolumeSource;
	paralyticGas?: BlobVolumeSource;
	stenchGas?: BlobVolumeSource;
	confusionGas?: BlobVolumeSource;
	inferno?: BlobVolumeSource;
	electricity?: BlobVolumeSource;
}

const blobCellsByScene = new WeakMap<object, Map<string, LiveAura>>();

/** Java's Speck gas/snow angles are in degrees/sec (`Speck.reset` cases TOXIC/CORROSION/SMOKE
 * `angularSpeed = 30`, BLIZZARD `Random.Float(200, 300) * ±1`). */
const DEG = Math.PI / 180;

/** Half-life triangle fade used by Speck TOXIC/BLIZZARD (`am = sqrt(min(p,1-p)*0.5)` with
 * Java's `p = left/lifespan` counting down, so `min(t, 1-t)` in age-forward time) and by
 * CORROSION/SMOKE without the `*0.5`. WebParticle is the plain triangle (`min(t,1-t)`). */
function speckHalfLifeAlpha(withHalf: boolean): (t: number) => number {
	return (t: number) => Math.sqrt(Math.min(t, 1 - t) * (withHalf ? 0.5 : 1));
}

/**
 * Per-kind cell factories from each blob's Java `use()` (tag `v3.3.8`):
 * Fire every 0.03s; Toxic/Corrosive/Paralytic/Stench/Confusion/Inferno/Blizzard Specks every
 * 0.4s; WebParticle every 0.25s (three particles per emit); SmokeScreen every 0.1s; Freezing
 * SnowParticle and Electricity SparkParticle every 0.05s.
 * Cadence is `rate = 1/interval` (Web multiplies by its 3-per-emit). Shapes approximate the
 * Java particle classes with `Texture.WHITE` + tint/spin/curves - no Speck/steam film frames.
 * Remaining gaps (stated, not silent): Speck STEAM film art; `CorrosionParticle`'s life-time
 * tint lerp `0xAAAAAA -> 0xFF8800` (mwg `tint` draws once at birth); FlameParticle's
 * light-mode blend; Web's Y-only stretch (`scale.y = 12 + p*6`) as a uniform scale; Java's
 * per-particle random Confusion tint is a fixed blue-purple per cell, and Inferno spin's random
 * sign is fixed positive per emitter.
 */
function blobCellEmitterOptions(layer: BlobVisualLayer): ParticleEmitterOptions {
	const missingKind = missingBlobCellEmitterOptions(layer);
	if (missingKind) return missingKind;
	const base = { texture: Texture.WHITE, tint: layer.tint, spawn: { shape: 'rect' as const, width: TILE, height: TILE } };
	switch (layer.id) {
		case 'fire': {
			//`FlameParticle`: color 0xEE7722, life 0.6, speed 0, acc (0,-80), size 4
			//shrinking (`PixelParticle.Shrinking`), alpha fades in over the first 20%
			//of age (`p > 0.8 ? (1-p)*5 : 1` with `p = left/lifespan`).
			const interval = 0.03;
			const life = 0.6;
			return {
				...base, tint: 0xEE7722,
				max: Math.ceil((1 / interval) * life * 2) + 8,
				rate: 1 / interval,
				life,
				speed: 0,
				gravity: { x: 0, y: -80 },
				scale: (t: number) => 4 * (1 - t),
				alpha: (t: number) => (t < 0.2 ? t * 5 : 1),
			};
		}
		case 'toxicGas': {
			//`Speck.TOXIC`: hardlight 0x50FF60, angularSpeed 30, life 1-3s, STEAM film.
			const interval = 0.4;
			return {
				...base, tint: 0x50FF60,
				max: Math.ceil((1 / interval) * 3 * 2) + 8,
				rate: 1 / interval,
				life: [1, 3] as [number, number],
				speed: 0,
				angle: [0, Math.PI * 2] as [number, number],
				spin: 30 * DEG,
				scale: (t: number) => 2 - t,
				alpha: speckHalfLifeAlpha(true),
			};
		}
		case 'corrosiveGas': {
			//`Speck.CORROSION`: hardlight 0xAAAAAA (Java then lerps to 0xFF8800 over
			//age in `Speck.update` - not modelled on this birth-time tint), life 1-3s.
			const interval = 0.4;
			return {
				...base, tint: 0xAAAAAA,
				max: Math.ceil((1 / interval) * 3 * 2) + 8,
				rate: 1 / interval,
				life: [1, 3] as [number, number],
				speed: 0,
				angle: [0, Math.PI * 2] as [number, number],
				spin: 30 * DEG,
				scale: (t: number) => 2 - t,
				alpha: speckHalfLifeAlpha(false),
			};
		}
		case 'blizzard': {
			//`Speck.BLIZZARD`: hardlight 0xFFFFFF, angularSpeed ±(200..300) per particle
			//in Java (sign rolled at reset); mwg picks one positive range per emitter, so
			//the spin direction is fixed here - stated, not silent.
			const interval = 0.4;
			return {
				...base, tint: 0xFFFFFF,
				max: Math.ceil((1 / interval) * 3 * 2) + 8,
				rate: 1 / interval,
				life: [1, 3] as [number, number],
				speed: 0,
				angle: [0, Math.PI * 2] as [number, number],
				spin: [200 * DEG, 300 * DEG] as [number, number],
				scale: (t: number) => 2 - t,
				alpha: speckHalfLifeAlpha(true),
			};
		}
		case 'plantFreeze': {
			//`Freezing.use()` starts `SnowParticle.FACTORY` every 0.05s; the Java flakes
			//fall at 5-8px/s for 1.2s and pulse alpha triangularly to 0.75.
			const interval = 0.05;
			return {
				...base, tint: 0xFFFFFF,
				max: Math.ceil((1 / interval) * 1.2 * 2) + 8,
				rate: 1 / interval, life: 1.2, speed: [5, 8] as [number, number],
				angle: [Math.PI / 2, Math.PI / 2] as [number, number],
				alpha: (t: number) => 1.5 * Math.min(t, 1 - t),
			};
		}
		case 'paralyticGas':
		case 'stenchGas':
		case 'confusionGas':
		case 'inferno': {
			//These `Blob.use()` methods pour one `Speck` every 0.4s (life 1-3s).
			//The Java speck film is represented by a spinning, expanding tinted square.
			const interval = 0.4;
			const specs = {
				paralyticGas: { tint: 0xFFFF66, spin: -30 * DEG, half: true },
				stenchGas: { tint: 0x003300, spin: -30 * DEG, half: false },
				confusionGas: { tint: 0x500080, spin: [-20 * DEG, 20 * DEG] as [number, number], half: true },
				inferno: { tint: 0xEE7722, spin: [200 * DEG, 300 * DEG] as [number, number], half: true },
			}[layer.id as 'paralyticGas' | 'stenchGas' | 'confusionGas' | 'inferno'];
			return {
				...base, tint: specs.tint,
				max: Math.ceil((1 / interval) * 3 * 2) + 8,
				rate: 1 / interval, life: [1, 3] as [number, number], speed: 0,
				angle: [0, Math.PI * 2] as [number, number], spin: specs.spin,
				scale: (t: number) => 1 + t,
				alpha: speckHalfLifeAlpha(specs.half),
			};
		}
		case 'electricity': {
			//`Electricity.use()` starts `SparkParticle.FACTORY` every 0.05s; Java
			//sparks launch upward at 20-40px/s, fall under +50px/s², and live 0.5-1s.
			const interval = 0.05;
			return {
				...base, tint: 0xFFFFFF,
				max: Math.ceil((1 / interval) * 1 * 2) + 8,
				rate: 1 / interval, life: [0.5, 1] as [number, number],
				speed: [20, 40] as [number, number], angle: [-Math.PI, 0] as [number, number],
				gravity: { x: 0, y: 50 }, scale: (t: number) => 5 * (1 - t),
			};
		}
		case 'web': {
			//`WebParticle`: color 0xCCCCCC, life 2s, three particles per pour tick
			//(`FACTORY.emit` recycles 3), random initial angle, triangle alpha,
			//`scale.y = 12 + p*6` (Java stretches only Y; approximated uniformly).
			const interval = 0.25;
			const perEmit = 3;
			const rate = (perEmit / interval);
			return {
				...base, tint: 0xCCCCCC,
				max: Math.ceil(rate * 2 * 2) + 8,
				rate,
				life: 2,
				speed: 0,
				angle: [0, Math.PI * 2] as [number, number],
				scale: (t: number) => 12 + (1 - t) * 6,
				alpha: (t: number) => Math.min(t, 1 - t),
			};
		}
		case 'smokeScreen': {
			//`Speck.SMOKE`: hardlight 0x000000, angularSpeed 30, life 1-1.5s.
			const interval = 0.1;
			return {
				...base, tint: 0x000000,
				max: Math.ceil((1 / interval) * 1.5 * 2) + 8,
				rate: 1 / interval,
				life: [1, 1.5] as [number, number],
				speed: 0,
				angle: [0, Math.PI * 2] as [number, number],
				spin: 30 * DEG,
				scale: (t: number) => 2 - t,
				alpha: speckHalfLifeAlpha(false),
			};
		}
		default: {
			//Unknown kind (or a caller that only supplies a tint): keep the old
			//generic rising mote so nothing silently loses its cell marker.
			return {
				...base,
				max: 5, rate: 2, life: 1.2,
				speed: [2, 8] as [number, number], angle: [-Math.PI, 0] as [number, number],
				scale: [4, 0] as [number, number], alpha: (t: number) => 1 - t,
			};
		}
	}
}

/** Continuous per-cell emitters for active blobs: Java's `Blob.use(BlobEmitter)` pours a
 * factory over every cell with volume (tag `v3.3.8` - see `blobCellEmitterOptions` for the
 * per-kind Java cites). FOV-gated; cells that empty destroy their emitter. */
export function syncBlobCells(scene: BlobVisualScene, layers: readonly BlobVisualLayer[], dt = 0): void {
	let live = blobCellsByScene.get(scene);
	if (!live) { live = new Map(); blobCellsByScene.set(scene, live); }
	const seen = new Set<string>();
	const activeLayers = [...layers];
	const present = new Set(layers.map((layer) => layer.id));
	const extra: ReadonlyArray<readonly [string, BlobVolumeSource | undefined, number]> = [
		['plantFreeze', scene.plantFreeze, 0xFFFFFF],
		['paralyticGas', scene.paralyticGas, 0xFFFF66],
		['stenchGas', scene.stenchGas, 0x003300],
		['confusionGas', scene.confusionGas, 0x500080],
		['inferno', scene.inferno, 0xEE7722],
		['electricity', scene.electricity, 0xFFFFFF],
	];
	for (const [id, blob, tint] of extra) if (blob && !present.has(id)) activeLayers.push({ id, tint, volumeAt: (x, y) => blob.volumeAt(x, y) });
	for (const layer of activeLayers) for (let y = 1; y < scene.level.height - 1; y++) for (let x = 1; x < scene.level.width - 1; x++) {
		if (layer.volumeAt(x, y) <= 0) continue;
		const key = `${layer.id}:${x}:${y}`; seen.add(key);
		let current = live.get(key);
		if (!current) {
			const emitter = new ParticleEmitter(blobCellEmitterOptions(layer));
			emitter.position.set(x * TILE, y * TILE); scene.effectLayer.addChild(emitter); emitter.start();
			current = { emitter, key }; live.set(key, current);
		} else current.emitter.position.set(x * TILE, y * TILE);
		current.emitter.visible = scene.fov.isVisible(x, y);
		if (current.emitter.visible && dt > 0) current.emitter.update(dt);
	}
	for (const [key, current] of live) if (!seen.has(key)) { current.emitter.destroy(); live.delete(key); }
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
