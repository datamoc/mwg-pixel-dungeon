/**
 * Self-targeted single-use bag items with no picker or aimer: blessing an ankh full of
 * dew and burning a torch for light. Split out of the scene so they can be checked
 * without a live game - the same split the self-buff spells use (`items/spells.ts`).
 * The scene owns the bag, the waterskin, the buffs and the turn.
 *
 * The flows themselves live here too, behind their contexts - the file-size refactor's
 * twenty-sixth extraction, behavior-identical.
 */
import { WATERSKIN_MAX } from '../dungeonConstants';

/** A carried ankh where the bless needs one: the flag writes onto the live bag item. */
export interface BlessableAnkhView {
	blessed?: boolean | undefined;
}

/**
 * The ankh-bless flow, moved out of the scene behind this context the way the spell
 * flows moved before it - behavior-identical, with the scene keeping one builder plus
 * the `useAnkh` adapter the item-use router calls.
 */
export interface AnkhContext {
	findAnkh(instanceId?: string): BlessableAnkhView | null;
	readonly waterskin: number;
	drainWaterskin(): void;
	spendTurn(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/**
 * The torch-light flow, moved out of the scene behind this context the same way -
 * behavior-identical, with the scene keeping one builder plus the `useTorch` adapter
 * the item-use router calls.
 */
export interface TorchContext {
	hasTorch(instanceId?: string): boolean;
	consumeTorch(instanceId?: string): void;
	grantLight(): void;
	spendTurn(): void;
}

/** Bless one carried ankh, which takes a full waterskin of dew: the flag latches, the
 * skin drains, the turn spends. A skin that is not full refuses with its own line and
 * spends nothing. */
export function useAnkhFlow(ctx: AnkhContext, instanceId?: string): void {
	const item = ctx.findAnkh(instanceId);
	if (!item) return;
	if (ctx.waterskin < WATERSKIN_MAX) {
		ctx.say(ctx.t('port.log.ankhneedsfull'), 'negative');
		return;
	}
	item.blessed = true;
	ctx.drainWaterskin();
	ctx.say(ctx.t('items.ankh.bless'), 'positive');
	ctx.spendTurn();
}

/** `Torch.execute(AC_LIGHT)` (tag `v3.3.8`): consume one torch and grant the 250-turn
 * Light buff (`Buff.affect(hero, Light.class, Light.DURATION)`), spending the hero's turn
 * (`TIME_TO_LIGHT = 1`). Java also plays the BURNING sample, bursts flame particles, runs
 * the operate animation and counts the use in the Catalog - this port has a seam for none
 * of those (see PORT_COVERAGE.md's torch row), so the buff icon and the sight change are
 * the whole observable effect. Java logs no message either, so neither does this. */
export function useTorchFlow(ctx: TorchContext, instanceId?: string): void {
	if (!ctx.hasTorch(instanceId)) return;
	ctx.consumeTorch(instanceId);
	ctx.grantLight();
	ctx.spendTurn();
}
