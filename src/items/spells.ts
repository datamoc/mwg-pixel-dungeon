/**
 * Targeted single-use spells, split out of the scene so they can be checked without a live
 * game - the same split `items/beacon.ts` uses. The first two `TargetedSpell` movers:
 * `TelekineticGrab` (pull a heap into the bag) and `PhaseShift` (scatter a creature and
 * paralyse it), both tag `v3.3.8`; the scene owns the aiming, the floor, and the turn.
 *
 * The flows themselves live here too, behind their contexts - the file-size refactor's
 * seventeenth extraction, behavior-identical.
 */
import type { AnyMonsterId } from '../monsters';

/** The seams every targeted spell shares: the carried spell, the aimer, the turn, the log. */
export interface TargetedSpellAim {
	hasSpell(id: string, instanceId?: string): boolean;
	consumeSpell(id: string, instanceId?: string): void;
	beginAim(opts: { range: number; validate?: (cell: { x: number; y: number }) => boolean; onConfirm: (cell: { x: number; y: number }) => void }): void;
	spendTurn(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/** A ground heap where the grab needs one: Java refuses chests and FOR_SALE heaps. Only
 *  the presence of the scene's own `chest` marker is read, never its variant. */
export interface GrabHeapView {
	chest?: string | undefined;
	forSale?: boolean | undefined;
}

/**
 * The TelekineticGrab aim/confirm flow, moved out of the scene behind this context the
 * way the beacon flows moved before it - behavior-identical, with the scene keeping one
 * builder plus the `useTelekineticGrab` adapter the item-use router calls.
 */
export interface TelekineticGrabContext extends TargetedSpellAim {
	groundItemAt(x: number, y: number): GrabHeapView | null;
	grabGroundItem(x: number, y: number): void;
}

/** A creature where PhaseShift needs one: the scatter victim and paralysis target. */
export interface PhaseShiftCreatureView {
	kind?: AnyMonsterId | undefined;
	isHero?: boolean | undefined;
}

/**
 * The PhaseShift aim/confirm flow, moved out of the scene behind this context the same
 * way - behavior-identical, with the scene keeping one builder plus the `usePhaseShift`
 * adapter the item-use router calls.
 */
export interface PhaseShiftContext extends TargetedSpellAim {
	creatureAt(x: number, y: number): PhaseShiftCreatureView | null;
	randomFreeCellNear(x: number, y: number): { x: number; y: number } | undefined;
	moveCreatureTo(x: number, y: number, cell: { x: number; y: number }): void;
	playTeleportOn(creature: PhaseShiftCreatureView, from: { x: number; y: number }, to: { x: number; y: number }): void;
	calmCreature(creature: PhaseShiftCreatureView): void;
	isBossOrMiniboss(kind: AnyMonsterId | undefined): boolean;
	afflictParalysis(creature: PhaseShiftCreatureView): void;
}

/** `TelekineticGrab.affectTarget()` (tag `v3.3.8`): target a heap and pull its contents
 * into the hero's belongings, with the Java spell's cast cost capped at one turn. Java can
 * hold several items in one ordinary Heap; this port has one GroundItem per cell, so one
 * payload is the complete heap representation here. Java refuses chests and FOR_SALE heaps,
 * which this port represents with `chest`/`forSale`; the existing pickup workflow handles the
 * ordinary payload conversions (gold, stones, lit bombs, and generated inventory items). The
 * beacon projectile and pickup-delay animation are not represented by this scene's UI. */
export function useTelekineticGrabFlow(ctx: TelekineticGrabContext, instanceId?: string): void {
	if (!ctx.hasSpell('telekineticGrab', instanceId)) return;
	ctx.beginAim({
		// Java's CellSelector does not impose a spell-specific distance limit. The port's
		// renderer-neutral targeting contract requires a finite range; six cells is the
		// established ranged-item convention used by the other map-targeted actions.
		range: 6,
		onConfirm: (target) => {
			const ground = ctx.groundItemAt(target.x, target.y);
			if (!ground) ctx.say(ctx.t('items.spells.telekineticgrab.no_target'), 'negative');
			else if (ground.chest || ground.forSale) ctx.say(ctx.t('items.spells.telekineticgrab.cant_grab'), 'negative');
			else ctx.grabGroundItem(target.x, target.y);
			// Java's `onSpellused()` consumes the spell after every confirmed path, including
			// an empty or special heap. The pickup delay is capped at one actor tick there;
			// this port has whole hero turns, so every confirmed cast spends exactly one.
			ctx.consumeSpell('telekineticGrab', instanceId);
			ctx.spendTurn();
		},
	});
}

/** `PhaseShift.affectTarget()` (tag `v3.3.8`): teleport the selected character to a
 * random free destination and paralyse non-boss characters for Java's standard duration.
 * Java also resets a hunting Mob to wandering and beckons it toward another destination;
 * this port has no separate Mob state/beckon system, so the normal post-teleport FOV update
 * supplies the equivalent loss of the current target. The spell's projectile and teleport
 * presentation are not represented by this scene's UI. */
export function usePhaseShiftFlow(ctx: PhaseShiftContext, instanceId?: string): void {
	if (!ctx.hasSpell('phaseShift', instanceId)) return;
	ctx.beginAim({
		//TargetedSpell uses CellSelector without a spell-specific range. The port's finite
		//targeting controller uses the established six-cell ranged-action convention.
		range: 6,
		validate: (cell) => ctx.creatureAt(cell.x, cell.y) !== null,
		onConfirm: (target) => {
			const creature = ctx.creatureAt(target.x, target.y);
			if (!creature) ctx.say(ctx.t('items.spells.phaseshift.no_target'), 'negative');
			else {
				const destination = ctx.randomFreeCellNear(target.x, target.y);
				if (destination) {
					const from = { x: target.x, y: target.y };
					ctx.moveCreatureTo(target.x, target.y, destination);
					ctx.playTeleportOn(creature, from, destination);
					//`PhaseShift.affectTarget`: a teleported mob is beckoned back to wandering
					//(`HUNTING -> WANDERING` plus a random destination) before the paralysis lands.
					if (!creature.isHero) ctx.calmCreature(creature);
					if (!ctx.isBossOrMiniboss(creature.kind)) ctx.afflictParalysis(creature);
				}
			}
			ctx.consumeSpell('phaseShift', instanceId);
			ctx.spendTurn();
		},
	});
}
