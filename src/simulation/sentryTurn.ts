import type { Creature } from '../combat';

/**
 * `SentryRoom$Sentry.act()` (tag `v3.3.8`): an immobile beam turret - it never
 * moves or melees, so this owns its whole turn (even an adjacent hero takes
 * the beam, never a melee swing). The trigger is the sentry's own field of
 * view over its room, collapsed here to line-of-sight like every other ranged
 * mob (the EMPTY_SP/room-rect/lost-inventory conditions have no seam here);
	 * invisibility never hides the hero. The first sighting charges for the room's
	 * `dangerDist/3+0.1` delay (the scene supplies that initial value), then it fires EVERY visible turn
 * (`curChargeDelay` resets to 1), and looking away resets the slow charge.
 * Shots are the real `NormalIntRange(2+depth/2, 4+depth)` DeathGaze: a magic
 * hit roll at `20+depth*2` accuracy that bypasses armor entirely. Not modeled:
 * the Bestiary.setSeen tick, the travel-interrupt pity, and the charge/zap
 * particles (a port log line stands in for all three). Terror handling stays
 * with the caller (an immobile turret cannot flee, so the generic flee
 * override is skipped for this kind instead).
 *
 * Moved here from the scene as the file-size refactor's forty-fifth
 * extraction, behavior-identical: the scene only binds its callbacks.
 */
export interface SentryTurnContext {
	readonly depth: number;
	readonly seesHero: boolean;
	readonly canTargetHero: () => boolean;
	readonly warmup: number | undefined;
	readonly setWarmup: (value: number | undefined) => void;
	readonly sayCharge: () => void;
	readonly sayMiss: () => void;
	readonly sayGaze: () => void;
	readonly rollHit: (attacker: Creature, defender: Creature) => boolean;
	readonly strikeHero: (minDamage: number, maxDamage: number) => void;
}

export function takeSentryTurn(monster: Creature, hero: Creature, context: SentryTurnContext): void {
	if (!context.seesHero || !context.canTargetHero()) {
		context.setWarmup(undefined);
		return;
	}
	const warmup = context.warmup ?? 2;
	if (warmup > 0) {
		context.setWarmup(warmup - 1);
		context.sayCharge();
		return;
	}
	if (!context.rollHit(monster, hero)) {
		context.sayMiss();
		return;
	}
	context.strikeHero(2 + Math.floor(context.depth / 2), 4 + context.depth);
	context.sayGaze();
}
