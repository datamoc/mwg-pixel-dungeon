import { Game, Input, registerColorTransform } from 'mwg';
import { registerBuiltinPipes } from 'mwg/two-d/pixi-interop';
import { loadSpdSprites } from './images';
import { initI18n } from './i18n';
import { applySpdTheme } from './ui/spdTheme';
import { SpdAudio } from './audio';
import { runState, LANGUAGE_KEY } from './runState';
import { TitleScene } from './scenes/titleScene';
import pixelFontUrl from './assets/pixel_font.ttf';

/** Registers SPD's bundled font before any Pixi Text/Label is constructed. */
async function loadSpdFont(): Promise<void> {
	if (!('fonts' in document)) return;
	try {
		const face = new FontFace('SPD Pixel', `url(${pixelFontUrl})`);
		await face.load();
		document.fonts.add(face);
	} catch {
		//Text remains readable through the comprehensive system fallback stack in the theme.
	}
}

/**
 * The Java game lets its platform asset pipeline cover startup loading. A browser build has
 * no equivalent native curtain, so this small DOM layer makes the real async font/sprite work
 * visible before `Game.start(TitleScene)` reveals the title splash; it is intentionally removed
 * only after the splash scene has been created, keeping the splash screen last in the sequence.
 */
function updateStartupProgress(progress: number, status: string): void {
	const value = Math.max(0, Math.min(100, Math.round(progress * 100)));
	const fill = document.getElementById('loading-fill');
	const label = document.getElementById('loading-status');
	const percent = document.getElementById('loading-percent');
	const track = document.getElementById('loading-track');
	if (fill) fill.style.width = `${value}%`;
	if (label) label.textContent = status;
	if (percent) percent.textContent = `${value} %`;
	track?.setAttribute('aria-valuenow', String(value));
}

async function revealTitleSplash(): Promise<void> {
	updateStartupProgress(1, 'Le donjon est prêt.');
	// Let the completed bar paint before its curtain fades; the title splash is then the last
	// startup surface the player sees, rather than competing with a half-loaded canvas.
	await new Promise<void>(resolve => setTimeout(resolve, 180));
	await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
	const screen = document.getElementById('loading-screen');
	if (!screen) return;
	screen.classList.add('is-hidden');
	await new Promise<void>(resolve => setTimeout(resolve, 240));
	screen.remove();
}

async function main(): Promise<void> {
	updateStartupProgress(0.05, 'Initialisation…');
	//before any table is read or any widget built: a catalog installed later would leave
	//already-built strings in the previous language
	initI18n(localStorage.getItem(LANGUAGE_KEY));
	runState.audio = new SpdAudio();
	updateStartupProgress(0.14, 'Chargement de la police…');
	await loadSpdFont();
	updateStartupProgress(0.24, 'Préparation du moteur…');

	const game = new Game({
		canvas: document.getElementById('game') as HTMLCanvasElement,
		// Java clears the scene to black, including space outside the dungeon map.
		background: 0x000000,
		//
		//`extensions` is mwg's escape hatch for extensions the *game* defines, and the framework's
		//own contract (`mwg/two-d/Game.d.ts`: "TintedSprite ... registers its own colour-transform
		//pipe automatically, at module scope, the moment a game imports it; a game never has to
		//pass anything here for that") says none of these three are needed: mwg whitelists
		//`dist/two-d/render/TintedSprite.js` in its `sideEffects` field precisely so the
		//module-scope registration survives bundling, and Pixi marks its own `sprite-tiling`/
		//`sprite-nine-slice` init modules the same way. Verified empirically against 0.7.8 by
		//loading the *built* bundle with this array emptied of all three (`extensions: []`): the
		//live renderer still reports `mwg-tinted-sprite`, `tilingSprite` and `nineSliceSprite`,
		//and the game reaches depth 1 with monsters on screen, no page error
		//(`tools/scratch/pipe-registration-livecheck.mjs`). They are kept anyway, deliberately:
		//when this did break (against mwg 0.7.x before `Game` gained the option back, and again
		//in the era of the `file:`-linked framework with two `pixi.js` copies), the symptom was a
		//black screen with `renderPipes[renderPipeId] is undefined` / `validateRenderable` deep
		//inside Pixi's render-group walk - one whole session to diagnose, and Pixi only accepts a
		//pipe that was registered before the renderer exists, so it cannot be repaired lazily.
		//Two idempotent lines are cheaper than that diagnosis; the port's `window.onerror` overlay
		//(`index.html`) is the durable mitigation for the same class of failure.
		extensions: [registerColorTransform, registerBuiltinPipes],
	});
	updateStartupProgress(0.42, 'Préparation des commandes…');

	Input.bind('search', ['KeyF']);
	Input.bind('examine', ['KeyL']);
	Input.bind('special', ['KeyT']);
	Input.bind('eat', ['KeyE']);
	Input.bind('quaff', ['KeyQ']);
	Input.bind('read', ['KeyR']);
	Input.bind('upgrade', ['KeyU']);
	Input.bind('buyHeal', ['KeyB']);
	Input.bind('buyId', ['KeyN']);
	Input.bind('sellFood', ['KeyV']);
	Input.bind('buyback', ['KeyG']);
	Input.bind('save', ['KeyO']);
	Input.bind('load', ['KeyP']);
	//No `menu` binding on purpose: SPD opens `WndGame` from the back key (`SPDAction.BACK` -
	//Escape/Backspace, which is MWG's own `cancel` action), and only when nothing else consumed
	//it - see `onAction`. Binding that same key to MWG's `menu` action instead would both clobber
	//the action's own defaults (KeyI/Tab) and make a single Escape close an open window and
	//immediately reopen the menu, because a keydown fans out to every action bound to it.

	updateStartupProgress(0.48, 'Chargement des sprites…');
	runState.sprites = await loadSpdSprites();
	updateStartupProgress(0.90, 'Assemblage de l’interface…');
	//before any widget is constructed, so every Label/Window/IconGrid built from here on
	//already carries SPD's frame and palette instead of mwg's default dark panel
	applySpdTheme(runState.sprites.uiChrome);
	await game.start(TitleScene);
	await revealTitleSplash();
}

main().catch((error) => {
	console.error(error);
	document.body.insertAdjacentHTML(
		'afterbegin',
		`<pre style="color:#c66;font:12px monospace;padding:16px">${String(error?.stack ?? error)}</pre>`
	);
});
