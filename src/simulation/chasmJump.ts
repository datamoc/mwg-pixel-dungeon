/**
 * The chasm-jump confirmation gate (`Chasm.heroJump()`, tag `v3.3.8`): a
 * voluntary step onto a chasm cell pauses for a yes/no window unless the hero
 * is flying or already confirmed, and the latch clears on the fall itself
 * (`heroFall()` resets `jumpConfirmed` first, before the feather check).
 * Pure state machine behind the scene's window; the suite pins the gate.
 */
const latchedByScene = new WeakMap<object, boolean>();

/** Whether `scene`'s hero already confirmed this chasm crossing. */
export function chasmJumpLatched(scene: object): boolean {
	return latchedByScene.get(scene) === true;
}

/** Latch (`yes`) or clear (`no`/fall) the confirmation. */
export function setChasmJumpLatched(scene: object, latched: boolean): void {
	if (latched) latchedByScene.set(scene, true);
	else latchedByScene.delete(scene);
}

/**
 * Java's step condition (`Hero.java`, tag `v3.3.8`): pit, not solid, and not
 * flying - except when a levitation is about to detach mid-step, which this
 * port cannot time and so treats as flying (stated in the coverage row).
 */
export function chasmStepNeedsConfirm(isChasm: boolean, levitating: boolean, latched: boolean): boolean {
	return isChasm && !levitating && !latched;
}
