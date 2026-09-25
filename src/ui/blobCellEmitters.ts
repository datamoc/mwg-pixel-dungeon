import { type ParticleEmitterOptions } from 'mwg';
import { Texture } from 'mwg/two-d/pixi-interop';
import { TILE } from '../dungeonConstants';

interface BlobCellKind { id: string; tint: number; }

const DEG = Math.PI / 180;

function halfLifeSpeck(withHalf: boolean): (t: number) => number {
	return (t) => Math.sqrt(Math.min(t, 1 - t) * (withHalf ? 0.5 : 1));
}

/** Java `Blob.use(BlobEmitter)` factories for the six environmental blobs whose cell
 * particles were absent: Freezing, ParalyticGas, StenchGas, ConfusionGas, Inferno and
 * Electricity (tag `v3.3.8`). `Texture.WHITE` and a stable per-cell tint replace SPD's
 * SnowParticle/Speck/SparkParticle art; Java's random Confusion tint and Inferno spin sign
 * are fixed per cell/emitter here. */
export function missingBlobCellEmitterOptions(layer: BlobCellKind): ParticleEmitterOptions | null {
	const base = { texture: Texture.WHITE, tint: layer.tint, spawn: { shape: 'rect' as const, width: TILE, height: TILE } };
	switch (layer.id) {
		case 'plantFreeze': {
			//`Freezing.use()` starts `SnowParticle.FACTORY` every 0.05s; particles live 1.2s,
			//fall at 5-8px/s and pulse alpha triangularly to 0.75 (`SnowParticle.update()`).
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
			//These `Blob.use()` methods pour one Speck every 0.4s, with life 1-3s.
			const specs = {
				paralyticGas: { tint: 0xFFFF66, spin: -30 * DEG, half: true },
				stenchGas: { tint: 0x003300, spin: -30 * DEG, half: false },
				confusionGas: { tint: 0x500080, spin: [-20 * DEG, 20 * DEG] as [number, number], half: true },
				inferno: { tint: 0xEE7722, spin: [200 * DEG, 300 * DEG] as [number, number], half: true },
			}[layer.id as 'paralyticGas' | 'stenchGas' | 'confusionGas' | 'inferno'];
			const interval = 0.4;
			return {
				...base, tint: specs.tint,
				max: Math.ceil((1 / interval) * 3 * 2) + 8,
				rate: 1 / interval, life: [1, 3] as [number, number], speed: 0,
				angle: [0, Math.PI * 2] as [number, number], spin: specs.spin,
				scale: (t: number) => 1 + t,
				alpha: halfLifeSpeck(specs.half),
			};
		}
		case 'electricity': {
			//`Electricity.use()` starts `SparkParticle.FACTORY` every 0.05s; sparks live
			//0.5-1s, launch at 20-40px/s and fall under +50px/s² (`SparkParticle`).
			const interval = 0.05;
			return {
				...base, tint: 0xFFFFFF,
				max: Math.ceil((1 / interval) * 1 * 2) + 8,
				rate: 1 / interval, life: [0.5, 1] as [number, number],
				speed: [20, 40] as [number, number], angle: [-Math.PI, 0] as [number, number],
				gravity: { x: 0, y: 50 }, scale: (t: number) => 5 * (1 - t),
			};
		}
		default: return null;
	}
}
