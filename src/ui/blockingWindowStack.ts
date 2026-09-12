import { Container, Rectangle } from 'pixi.js';
import { Window, WindowStack } from 'mwg';

/**
 * `WindowStack` with Java's `Window` blocker layer.
 *
 * Java's `Window` puts a full-screen `PointerArea` under its chrome, and that blocker's click
 * closes the window unless it landed on the window itself (`Window`'s `PointerArea.onClick` ->
 * `onBackPressed`). That is what makes a click *outside* a window dismiss it - and, just as
 * importantly, what stops a window open over the map or the toolbar from letting clicks through to
 * whatever is underneath.
 *
 * MWG's `WindowStack` has neither half: its overlay only draws, and Pixi does not hit-test a plain
 * `Container` at all without a `hitArea` (`EventBoundary.hitTestFn`). So this stack inserts one
 * hit-area'd, non-drawing blocker directly beneath each window it pushes - the same place Java's
 * blocker sits, which is also what keeps it *under* that window's own buttons - sizes it to the
 * viewport, and drops it with its window. The blocker draws nothing on purpose: the stack's dimming
 * overlay is still the only thing that dims the world.
 */
export class BlockingWindowStack extends WindowStack {
	private viewport = { width: 0, height: 0 };
	private readonly blockers = new Map<Window, Container>();

	override setViewport(width: number, height: number): void {
		this.viewport = { width, height };
		super.setViewport(width, height);
		for (const blocker of this.blockers.values()) {
			blocker.hitArea = new Rectangle(0, 0, width, height);
		}
	}

	override push(window: Window): Window {
		const blocker = new Container();
		//a bare `Container` is invisible and non-drawing, but `static` plus a `hitArea` is exactly
		//what Pixi's hit test needs to make it a click target
		blocker.eventMode = 'static';
		blocker.hitArea = new Rectangle(0, 0, this.viewport.width, this.viewport.height);
		blocker.on('pointerdown', (event) => {
			//Java's blocker is a child of the window, and the chrome sits above it, so its click only
			//runs for the part of the screen the window does *not* cover
			const inside = event.global.x >= window.x && event.global.x <= window.x + window.width &&
				event.global.y >= window.y && event.global.y <= window.y + window.height;
			if (!inside) window.close();
		});
		const pushed = super.push(window);
		//directly beneath the window, above the dimming overlay
		this.addChildAt(blocker, Math.max(0, this.getChildIndex(pushed) - 1));
		this.blockers.set(pushed, blocker);
		pushed.onClose.add(() => {
			const held = this.blockers.get(pushed);
			this.blockers.delete(pushed);
			held?.parent?.removeChild(held);
			held?.destroy({ children: true });
			return false;
		});
		return pushed;
	}
}
