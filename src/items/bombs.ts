import { Roguelike, type Actors } from 'mwg';
import type { Creature, Step } from '../combat';
import { t } from '../i18n';
import { mwlItemEffectValue } from '../mwlContent';

export interface BombContext {
	readonly bag: Actors.Inventory;
	readonly level: { inside(x: number, y: number): boolean; passable(x: number, y: number): boolean };
	readonly isChasmCell: (x: number, y: number) => boolean;
	readonly groundItemAt: (x: number, y: number) => unknown;
	readonly nearestVisibleEnemy: (range: number) => Creature | null;
	/** A confirmed cell from the scene's map picker; absent only for legacy callers. */
	readonly target?: Step;
	spawnLitBomb(bombId: string, at: Step): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
}

/** Bomb.execute(AC_LIGHTTHROW): validate, consume, and place a lit bomb heap. */
export function useBomb(scene: BombContext, bombId = 'bomb', instanceId?: string): void {
	const bomb = scene.bag.find(bombId, instanceId);
	if (!bomb) return;
	const target = scene.target;
	const enemy = target ? undefined : scene.nearestVisibleEnemy(mwlItemEffectValue('bombs', 'targetRange'));
	if (!target && !enemy) {
		scene.say(t('port.log.bombwasted'), 'negative');
		return;
	}
	const aimed = target ?? { x: enemy!.x, y: enemy!.y };
	const candidates = [aimed, ...Roguelike.neighbourOffsets(8)
		.map(([dx, dy]) => ({ x: aimed.x + dx, y: aimed.y + dy }))];
	const at = candidates.find((cell) => scene.level.inside(cell.x, cell.y)
		&& scene.level.passable(cell.x, cell.y)
		&& !scene.isChasmCell(cell.x, cell.y)
		&& !scene.groundItemAt(cell.x, cell.y));
	if (!at) {
		scene.say(t('port.log.bombwasted'), 'negative');
		return;
	}
	scene.bag.remove(bombId, 1, instanceId);
	scene.spawnLitBomb(bombId, at);
	scene.say(t('port.log.bomblit', { target: enemy?.name ?? t('items.bombs.bomb.name') }), 'positive');
}

export interface TenguBombContext {
	hero: Creature;
	tengu: Creature;
	level: { inside(x: number, y: number): boolean; passable(x: number, y: number): boolean };
	isChasmCell: (x: number, y: number) => boolean;
	groundItemAt: (x: number, y: number) => unknown;
	spawnTenguBomb: (at: Step) => void;
	say: (line: string, level?: 'info' | 'positive' | 'negative' | 'warning') => void;
}

/** `Tengu.BombAbility`: place the delayed bomb on the nearest free hero-adjacent cell. */
export function throwTenguBomb(context: TenguBombContext): boolean {
	const cells: Step[] = [];
	for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
		const at = { x: context.hero.x + dx, y: context.hero.y + dy };
		if (!context.level.inside(at.x, at.y) || !context.level.passable(at.x, at.y)) continue;
		if (context.isChasmCell(at.x, at.y) || context.groundItemAt(at.x, at.y)) continue;
		cells.push(at);
	}
	if (cells.length === 0) return false;
	cells.sort((a, b) => Math.hypot(a.x - context.tengu.x, a.y - context.tengu.y) - Math.hypot(b.x - context.tengu.x, b.y - context.tengu.y));
	context.spawnTenguBomb(cells[0]!);
	context.say(t('port.log.tengubomb'), 'warning');
	return true;
}
