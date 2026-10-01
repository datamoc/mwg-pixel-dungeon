/** Long-press gesture: Java's `Button.onLongClick()` substitute for slots that need
 * two gestures (tap = use, hold = assign). Pixi has no built-in hold event, so a
 * `pointerdown` timer stands in: firing it runs `onLongPress` and swallows the
 * `pointertap` that follows the release, while releasing early runs `onTap`.
 *
 * Typed on the narrow event-emitter surface both UI layers share (`mwg/two-d`'s
 * pixi-interop `Container` and `render`'s `Container2D`), so the toolbar and the
 * bag use the same timing rather than drifting apart.
 */
interface Pressable {
	on(event: 'pointerdown' | 'pointerup' | 'pointerupoutside' | 'pointertap', handler: () => void): void;
}

export function addLongPress(target: Pressable, opts: { onTap: () => void; onLongPress: () => void; delay?: number }): void {
	let timer: ReturnType<typeof setTimeout> | null = null;
	let fired = false;
	const delay = opts.delay ?? 450;
	target.on('pointerdown', () => {
		fired = false;
		if (timer !== null) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = null;
			fired = true;
			opts.onLongPress();
		}, delay);
	});
	const cancel = () => {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
	};
	target.on('pointerup', cancel);
	target.on('pointerupoutside', cancel);
	target.on('pointertap', () => {
		if (fired) {
			fired = false;
			return;
		}
		cancel();
		opts.onTap();
	});
}
