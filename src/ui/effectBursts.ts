import { ParticleEmitter } from 'mwg';
import { Container, Texture } from 'mwg/two-d/pixi-interop';
import { TILE } from '../dungeonConstants';
import type { DeathBurstSpec } from '../simulation/deathBursts';
import { pourAurasFor, type PourAuraSpec } from '../simulation/pourAuras';

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

/** `Cleanse.onCast()`'s `new Flare(6, 32).color(0xFF4CD2, true).show(ch.sprite, 2f)`
 * (`actors/hero/spells/Cleanse.java`, tag `v3.3.8`): a pink 6-point star flashing
 * two seconds over every affected character. This port has no star-sprite flare,
 * so pink sparkles on the same 2s beat stand in (same colour, same duration). */
export function spawnCleanseFlare(layer: Container, alive: LiveBurst[], x: number, y: number): void {
	const emitter = new ParticleEmitter({
		texture: Texture.WHITE,
		max: 8,
		rate: 0,
		life: 2,
		speed: [8, 24] as [number, number],
		angle: [-Math.PI, 0] as [number, number],
		scale: [8, 0] as [number, number],
		alpha: (t: number) => 1 - t,
		tint: 0xff4cd2,
		spawn: { shape: 'rect', width: TILE, height: TILE },
	});
	track(layer, alive, emitter, x, y, 8, 2);
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
	return JSON.stringify(specs.map((spec) => [spec.rate, spec.tint, spec.life]));
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
		angle: [-Math.PI / 2 - spec.spread, -Math.PI / 2 + spec.spread] as [number, number],
		gravity: { x: 0, y: spec.gravity },
		scale: (spec.grow ? [spec.grow[0], spec.grow[1]] : spec.shrink ? [size, 0] : [size, size]) as [number, number],
		alpha: spec.fade === 'shadow'
			? (t: number) => (t > 0.5 ? (1 - t) * (1 - t) * 4 : t * 2)
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
	creatures: Iterable<{ x: number; y: number; kind?: string; allyKind?: string; elementalType?: 'fire' | 'frost' | 'shock' | 'chaos'; yogFistType?: 'burning' | 'soiled' | 'rotting' | 'rusted' | 'bright' | 'dark'; dmSupercharged?: boolean; beamCharged?: boolean; hp?: number; maxHp?: number }>;
	fov: { isVisible(x: number, y: number): boolean };
	effectLayer: Container;
}

/**
 * Continuous pour auras (`simulation/pourAuras.ts`), synced every frame the
 * way Java's sprite `update()` re-poses its emitters: a creature whose spec
 * set changed (supercharge lit, goo bloodied, eye charged) is rebuilt, a
 * creature with none loses its emitter, and everything follows cells and FOV.
 */
export function syncPourAuras(scene: PourAuraScene): void {
	let live = aurasByScene.get(scene);
	if (!live) {
		live = new Map();
		aurasByScene.set(scene, live);
	}
	const seen = new Set<unknown>();
	for (const creature of scene.creatures) {
		seen.add(creature);
		const specs = pourAurasFor(creature);
		const key = auraKey(specs);
		const current = live.get(creature);
		if (current && current[0]?.key === key && current.length === specs.length) {
			for (let i = 0; i < specs.length; i++) {
				current[i]!.emitter.position.set(creature.x * TILE, creature.y * TILE);
				current[i]!.emitter.visible = scene.fov.isVisible(creature.x, creature.y);
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
export interface BlobVisualScene { level: { width: number; height: number }; fov: { isVisible(x: number, y: number): boolean }; effectLayer: Container; }

const blobCellsByScene = new WeakMap<object, Map<string, LiveAura>>();

/** `FireParticle`/gas `Speck` cell emitters (tag `v3.3.8`): Java shows a small
 * continuous particle stream for each active blob cell. The port has no sprite-specific
 * particle factories, so a tinted white emitter preserves the cell, cadence and FOV gate. */
export function syncBlobCells(scene: BlobVisualScene, layers: readonly BlobVisualLayer[]): void {
	let live = blobCellsByScene.get(scene);
	if (!live) { live = new Map(); blobCellsByScene.set(scene, live); }
	const seen = new Set<string>();
	for (const layer of layers) for (let y = 1; y < scene.level.height - 1; y++) for (let x = 1; x < scene.level.width - 1; x++) {
		if (layer.volumeAt(x, y) <= 0) continue;
		const key = `${layer.id}:${x}:${y}`; seen.add(key);
		let current = live.get(key);
		if (!current) {
			const emitter = new ParticleEmitter({ texture: Texture.WHITE, max: 5, rate: 2, life: 1.2,
				speed: [2, 8] as [number, number], angle: [-Math.PI, 0] as [number, number],
				scale: [4, 0] as [number, number], alpha: (t: number) => 1 - t, tint: layer.tint,
				spawn: { shape: 'rect', width: TILE, height: TILE } });
			emitter.position.set(x * TILE, y * TILE); scene.effectLayer.addChild(emitter); emitter.start();
			current = { emitter, key }; live.set(key, current);
		} else current.emitter.position.set(x * TILE, y * TILE);
		current.emitter.visible = scene.fov.isVisible(x, y);
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
