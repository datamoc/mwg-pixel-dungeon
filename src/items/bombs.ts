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

/**
 * The bomb throw-aim flow, moved out of the scene behind this context - the file-size
 * refactor's twenty-fourth extraction, behavior-identical, with the scene keeping one
 * builder plus the `useBomb` adapter the item-use router calls. The detonate half
 * (`useBomb` below) already lived here; the aimer and the pending-aim cell join it, and
 * the scene's own `bombContext`/detonate call stays scene-side behind `detonateAt`.
 */
export interface BombAimContext {
	hasBomb(bombId: string, instanceId?: string): boolean;
	beginAim(opts: { range: number; validate: (cell: { x: number; y: number }) => boolean; onConfirm: (cell: { x: number; y: number }) => void }): void;
	canTargetCell(x: number, y: number): boolean;
	aimRange(): number;
	get pendingTarget(): { x: number; y: number } | null;
	set pendingTarget(cell: { x: number; y: number } | null);
	detonateAt(target: { x: number; y: number }, bombId: string, instanceId?: string): void;
}

/** The bomb's map-picker half: same aim gate and thrown range as the brews and the pot
 * (passable, non-chasm; the MWL target range). A confirmed aim re-enters here with the
 * cell pending, so the detonate half below resolves at once. */
export function aimBombFlow(ctx: BombAimContext, bombId = 'bomb', instanceId?: string): void {
	if (!ctx.hasBomb(bombId, instanceId)) return;
	if (!ctx.pendingTarget) {
		ctx.beginAim({
			range: ctx.aimRange(),
			validate: (cell) => ctx.canTargetCell(cell.x, cell.y),
			onConfirm: (cell) => {
				ctx.pendingTarget = cell;
				aimBombFlow(ctx, bombId, instanceId);
			},
		});
		return;
	}
	const target = ctx.pendingTarget;
	ctx.pendingTarget = null;
	ctx.detonateAt(target, bombId, instanceId);
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
