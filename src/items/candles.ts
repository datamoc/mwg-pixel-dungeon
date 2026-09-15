import { Random, Roguelike, type Actors } from 'mwg';
import type { Creature, Step } from '../combat';
import { t } from '../i18n';

export interface CandleContext {
	readonly bag: Actors.Inventory;
	readonly ritualPos: number;
	readonly level: { width: number; height: number; passable(x: number, y: number): boolean };
	readonly hero: Step;
	readonly ritualCandles: boolean[];
	isChasmCell(x: number, y: number): boolean;
	creatureAt(x: number, y: number): Creature | null;
	spawnNewbornElemental(at: Step): Creature;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
}

/** CeremonialCandle placement and RitualSiteRoom's four-candle activation. */
export function useCandle(scene: CandleContext, instanceId?: string): void {
	if (scene.ritualPos < 0) {
		scene.say(t('port.log.candleneeded'), 'negative');
		return;
	}
	const w = scene.level.width;
	const cx = scene.ritualPos % w;
	const cy = Math.floor(scene.ritualPos / w);
	const slots = [
		{ x: cx, y: cy - 1 }, { x: cx + 1, y: cy },
		{ x: cx, y: cy + 1 }, { x: cx - 1, y: cy },
	];
	const slot = slots.findIndex((s) => s.x === scene.hero.x && s.y === scene.hero.y);
	if (slot < 0 || scene.ritualCandles[slot]) {
		scene.say(t('port.log.candleneeded'), 'negative');
		return;
	}
	const candle = scene.bag.find('candle', instanceId);
	if (!candle) return;
	scene.bag.remove('candle', 1, instanceId);
	scene.ritualCandles[slot] = true;
	scene.say(t('port.log.candleplaced'), 'positive');
	if (!scene.ritualCandles.every(Boolean)) return;

	// CeremonialCandle.checkCandles(): clear the four placements before spawning the
	// newborn elemental, so a re-entrant action cannot consume an already completed ritual.
	scene.ritualCandles.fill(false);
	let at = { x: cx, y: cy };
	if (scene.creatureAt(cx, cy) || !scene.level.passable(cx, cy) || scene.isChasmCell(cx, cy)) {
		const free = Roguelike.neighbourOffsets(8)
			.map(([dx, dy]) => ({ x: cx + dx, y: cy + dy }))
			.filter((c) => scene.level.passable(c.x, c.y) && !scene.isChasmCell(c.x, c.y) && !scene.creatureAt(c.x, c.y));
		if (free.length > 0) at = Random.element(free)!;
	}
	const elemental = scene.spawnNewbornElemental(at);
	elemental.sleeping = false;
	elemental.rangedCooldown = Random.normalRange(3, 5);
	scene.say(t('port.log.ritualfire'), 'warning');
}
