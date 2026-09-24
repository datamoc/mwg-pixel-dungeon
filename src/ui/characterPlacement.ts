import type { Sprite2D } from 'mwg/two-d/render';

/** CharSprite.worldToCamera and turnTo. Keep logical tile positions in x/y;
 * a pivot supplies Java's centered, six-pixel-raised visual placement.
 */
export function placeCharacterArt(sprite: Sprite2D, facingLeft = sprite.scale.x < 0): void {
	const width = sprite.texture.orig.width;
	const height = sprite.texture.orig.height;
	const inset = (16 - width) / 2;
	//Java's `CharSprite.turnTo()` only changes its facing flag, so turning never erases a
	//sprite-specific scale such as `CrystalGuardianSprite`'s 1.25 (`CharSprite.java`, tag v3.3.8).
	const scaleX = Math.abs(sprite.scale.x) || 1;
	sprite.scale.x = facingLeft ? -scaleX : scaleX;
	sprite.pivot.set(facingLeft ? width + inset : -inset, height - 10);
}

export function faceCharacter(sprite: Sprite2D, fromX: number, toX: number): void {
	if (fromX !== toX) placeCharacterArt(sprite, toX < fromX);
}
