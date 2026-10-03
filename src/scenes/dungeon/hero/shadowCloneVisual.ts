import { AnimatedSprite } from 'mwg/two-d/render';
import { heroSheet } from '../../../monsters';
import { runState } from '../../../runState';
import { placeCharacterArt } from '../../../ui/characterPlacement';

/** Builds the Rogue `ShadowClone.ShadowSprite` animation (`ShadowClone.java`, tag `v3.3.8`).
 * Java uses these idle/run/die/attack frame sequences and fps, alpha 0.8, hides the flattened
 * shadow, and pours CityLevel smoke. The port matches the animation and alpha; generic shadows
 * remain visible. The scene's `syncPourAuras` supplies the smoke emitter.
 */
export function createShadowCloneSprite(): AnimatedSprite {
	const sheet = heroSheet(runState.sprites.rogue);
	const frame = (index: number) => sheet.get(index);
	const sprite = new AnimatedSprite(frame(0));
	sprite.add('idle', [0, 0, 0, 1, 0, 0, 1, 1].map(frame), { fps: 1 });
	sprite.add('run', [2, 3, 4, 5, 6, 7].map(frame), { fps: 20 });
	sprite.add('die', [0].map(frame), { fps: 20, loop: false });
	sprite.add('attack', [13, 14, 15, 0].map(frame), { fps: 15, loop: false });
	sprite.play('idle');
	sprite.alpha = 0.8;
	placeCharacterArt(sprite);
	return sprite;
}
