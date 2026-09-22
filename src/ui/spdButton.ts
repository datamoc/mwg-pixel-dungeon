import { Rectangle, Texture } from 'mwg/two-d/pixi-interop';
import { Button, type ButtonOptions } from 'mwg';
import { runState } from '../runState';

/** Chrome.java GREY_BUTTON_TR. Keep MWG's input handling, with SPD's button art. */
export class SpdButton extends Button {
	constructor(options: ButtonOptions) {
		super({
			...options,
			skin: {
				texture: new Texture({ source: runState.sprites.uiChrome.source, frame: new Rectangle(20, 9, 9, 9) }),
				border: 4,
				tints: { idle: 0xffffff, hover: 0xffffff, pressed: 0xaaaaaa },
			},
			label: { stroke: { color: 0x000000, width: 0.65 }, resolution: 3, roundPixels: true, ...options.label },
		});
	}
}

/**
 * `ui/RedButton.java` - `StyledButton` over `Chrome.Type.RED_BUTTON` (`chrome.png`
 * 38,0 6x6, border 2). Java builds almost every dialog, settings row and title-menu
 * entry from this; the grey skin above stays for the title icon buttons and toolbar
 * slots (`TitleScene.SettingsButton(GREY_TR...)`, `Toolbar.Tool`), exactly like Java.
 */
export class SpdRedButton extends Button {
	constructor(options: ButtonOptions) {
		super({
			...options,
			skin: {
				texture: new Texture({ source: runState.sprites.uiChrome.source, frame: new Rectangle(38, 0, 6, 6) }),
				border: 2,
				tints: { idle: 0xffffff, hover: 0xffffff, pressed: 0xaaaaaa },
			},
			label: { stroke: { color: 0x000000, width: 0.65 }, resolution: 3, roundPixels: true, ...options.label },
		});
	}
}

/** PixelScene's integer zoom, constrained by its portrait/landscape minimum canvas. */
export function menuScale(width: number, height: number): number {
	const landscape = width > height;
	return Math.max(1, Math.min(3, Math.floor(Math.min(width / (landscape ? 240 : 135), height / (landscape ? 160 : 225)))));
}
