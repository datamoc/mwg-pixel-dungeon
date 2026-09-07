import { Rectangle, Texture } from 'pixi.js';
import { setTheme } from 'mwg';

/**
 * SPD's look, applied to `mwg/ui`'s theme.
 *
 * One `setTheme` call, made before any widget is built, so every `Window`, `ListView` and
 * `IconGrid` added later already draws SPD's frame and colours rather than mwg's default
 * dark panel - which is why this runs first in the batch.
 *
 * `Chrome.java`'s `Type.WINDOW` is `new NinePatch(chrome.png, 0, 0, 20, 20, 6)`: a 20x20
 * patch at the sheet's origin with a 6px fixed border. `mwg/ui`'s `NinePatch` takes a
 * `Texture` and one border number, so the region is cut here and handed over as-is.
 *
 * Colours are `Window.java`'s own (`TITLE_COLOR`/`SHPX_COLOR`) plus `CharSprite`'s status
 * palette, so text in a window matches text floating over a monster.
 */

/** `Window.TITLE_COLOR` - the gold SPD titles and highlights use */
export const SPD_TITLE_COLOR = 0xffff44;

/**
 * `CharSprite`'s status colours, the palette SPD uses for every piece of coloured feedback -
 * the game log, floating combat text and status flashes all read from these.
 */
export const SPD_STATUS_COLOR = {
	default: 0xffffff,
	positive: 0x00ff00,
	negative: 0xff0000,
	warning: 0xff8800,
	neutral: 0xffff00,
} as const;

export function applySpdTheme(chrome: Texture): void {
	//Chrome.Type.WINDOW: (0,0) 20x20, border 6
	const panel = new Texture({
		source: chrome.source,
		frame: new Rectangle(0, 0, 20, 20),
	});

	setTheme({
		panel,
		panelBorder: 6,
		padding: 6,
		spacing: 2,
		color: {
			text: SPD_STATUS_COLOR.default,
			//Window.java's own dimmed body text
			textDim: 0xcccccc,
			textHighlight: SPD_TITLE_COLOR,
			panelFill: 0x000000,
			panelBorder: 0x666644,
			selection: 0x8a8a6a,
			overlay: 0x000000,
		},
		//`pixel_font.ttf` is SPD's supplied scalable form of PixelScene.pixelFont. It is
		//registered before this theme is applied; system fallbacks below retain coverage for
		//the translations that the Latin bitmap face does not contain.
		//
		//The tail of the stack is script coverage, not taste. Twelve of SPD's languages need
		//glyphs no Latin monospace font has - Japanese, Korean, Chinese, Russian, Ukrainian,
		//Greek - and a browser that finds no font for a codepoint draws tofu (a hollow box)
		//rather than falling back on its own. Naming the platform CJK faces first (each OS
		//ships different ones, so all three families are listed) and then a broad sans keeps
		//those languages legible; the monospace preference still wins for Latin text, since
		//the earlier entries cover it.
		font: {
			family: [
				'"SPD Pixel"',
				'ui-monospace',
				'Consolas',
				'"DejaVu Sans Mono"',
				'monospace',
				//CJK: Windows, macOS, then the Noto family common on Linux/Android
				'"Yu Gothic"',
				'"Hiragino Kaku Gothic ProN"',
				'"Noto Sans CJK JP"',
				'"Malgun Gothic"',
				'"Noto Sans CJK KR"',
				'"Microsoft YaHei"',
				'"PingFang SC"',
				'"Noto Sans CJK SC"',
				//Cyrillic and Greek are covered by any broad sans
				'"Segoe UI"',
				'sans-serif',
			].join(', '),
			size: 8,
			lineHeight: 1.35,
		},
	});
}
