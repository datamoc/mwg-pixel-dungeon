/**
 * `ScrollOfTeleportation.appear(ch, pos)` presentation gating
 * (`items/scrolls/ScrollOfTeleportation.java`, tag `v3.3.8`).
 *
 * Every random teleport in the game funnels through that one Java method for its
 * visuals, so the scene's `playTeleportAppear` reads this plan rather than
 * re-deriving the four gates per call site: the TELEPORT sample plays when
 * either endpoint is in the hero's FOV; the departure cell bursts only for a
 * visible non-hero traveller; the sprite fades 0 to 1 over 0.4s unless the
 * traveller is invisible; the arrival cell bursts when visible, or always for
 * the hero (whose own arrival the camera follows).
 */
export interface TeleportAppearPlan {
	sound: boolean;
	burstFrom: boolean;
	fade: boolean;
	burstTo: boolean;
}

export function teleportAppearPlan(
	fromVisible: boolean,
	toVisible: boolean,
	isHero: boolean,
	invisible: boolean,
): TeleportAppearPlan {
	return {
		sound: fromVisible || toVisible,
		burstFrom: fromVisible && !isHero,
		fade: !invisible,
		burstTo: toVisible || isHero,
	};
}
