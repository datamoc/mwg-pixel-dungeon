import { Rectangle, Texture } from 'pixi.js';
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

/** PixelScene's integer zoom, constrained by its portrait/landscape minimum canvas. */
export function menuScale(width: number, height: number): number {
	const landscape = width > height;
	return Math.max(1, Math.min(3, Math.floor(Math.min(width / (landscape ? 240 : 135), height / (landscape ? 160 : 225)))));
}
