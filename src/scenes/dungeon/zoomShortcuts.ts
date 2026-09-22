import { Input } from 'mwg';
import { setZoomOffset, zoomOffset } from '../../settings';
import { wheelZoomStep } from '../../simulation/zoomStep';

/**
 * Ctrl++/Ctrl+-/Ctrl+wheel zoom for the dungeon scene. The `zoomIn`/`zoomOut`
 * bindings (`main.ts`: bare `Equal`/`Minus` plus numpad twins) already fire by
 * physical code with Ctrl held - MWG matches codes, not modifiers - so the key
 * half works today; what is missing is (a) the wheel half, via MWG's
 * Ctrl/Cmd+wheel-means-`zoom` convention (`Input.onWheel`), and (b) stopping
 * the browser from page-zooming alongside the game on Ctrl+plus/minus.
 *
 * Bound once per scene (a `WeakSet` guard, since the call site runs on every
 * floor entry) and unbound on scene destroy, mirroring the `Input.onAction`
 * subscription in `dungeonScene.ts`.
 */
const bound = new WeakSet<object>();

/** Minimal scene surface: the window gate plus the destroy registry. */
export interface ZoomShortcutScene {
	gameWindows: { blocksWorld: boolean };
	onDestroy: { add(cleanup: () => void): void };
}

/** Physical codes whose Ctrl/Meta press must not reach the browser's page zoom. */
const ZOOM_CODES = new Set(['Equal', 'Minus', 'NumpadAdd', 'NumpadSubtract']);

export function bindZoomShortcuts(scene: ZoomShortcutScene): void {
	if (bound.has(scene)) return;
	bound.add(scene);
	const wheel = (input: { action: string; delta: number }) => {
		if (input.action !== 'zoom') return;
		//The keyboard zoom below refuses while a window holds the input; the
		//wheel obeys the same gate so a roll over an open window (the settings
		//zoom row above all) does not move the map behind it.
		if (scene.gameWindows.blocksWorld) return;
		const step = wheelZoomStep(input.delta);
		if (step !== 0) setZoomOffset(zoomOffset() + step);
	};
	const key = (event: KeyboardEvent) => {
		if ((event.ctrlKey || event.metaKey) && ZOOM_CODES.has(event.code)) event.preventDefault();
	};
	Input.onWheel.add(wheel);
	Input.onKey.add(key);
	scene.onDestroy.add(() => {
		Input.onWheel.remove(wheel);
		Input.onKey.remove(key);
	});
}
