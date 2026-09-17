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

/**
 * `CeremonialCandle.checkCandles()`' four slots: the cardinal neighbours of `ritualPos`
 * in N/E/S/W order (`ritualPos - width`, `+1`, `+width`, `-1`).
 */
export function candleRitualSlots(ritualPos: number, width: number): Step[] {
	const cx = ritualPos % width;
	const cy = Math.floor(ritualPos / width);
	return [
		{ x: cx, y: cy - 1 }, { x: cx + 1, y: cy },
		{ x: cx, y: cy + 1 }, { x: cx - 1, y: cy },
	];
}

/**
 * Place one carried candle onto an empty ritual slot. `CeremonialCandle`'s
 * `defaultAction = AC_THROW` throws the candle, so the scene aims this through the
 * `TargetingController` and only calls here for a validated slot - the old stand-on-the-
 * slot bag use is gone. Heap intermediaries stay collapsed (bag-direct, no ground heap),
 * which is the stated simplification, not the aimed placement this closes.
 */
export function placeCandleAtSlot(scene: CandleContext, slot: number, instanceId?: string): void {
	const candle = scene.bag.find('candle', instanceId);
	if (!candle || slot < 0 || slot > 3 || scene.ritualCandles[slot]) return;
	scene.bag.remove('candle', 1, instanceId);
	scene.ritualCandles[slot] = true;
	scene.say(t('port.log.candleplaced'), 'positive');
	if (!scene.ritualCandles.every(Boolean)) return;

	// CeremonialCandle.checkCandles(): clear the four placements before spawning the
	// newborn elemental, so a re-entrant action cannot consume an already completed ritual.
	scene.ritualCandles.fill(false);
	const cx = scene.ritualPos % scene.level.width;
	const cy = Math.floor(scene.ritualPos / scene.level.width);
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
