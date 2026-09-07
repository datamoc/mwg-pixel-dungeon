import { Rectangle, Texture } from 'pixi.js';
import { NinePatch } from 'mwg';
import { runState } from '../runState';

/** Chrome.WINDOW, in Java logical pixels. Scale the parent, never the border alone. */
export function spdPanel(width: number, height: number): NinePatch {
	const panel = new NinePatch(new Texture({ source: runState.sprites.uiChrome.source, frame: new Rectangle(0, 0, 20, 20) }), { border: 6 });
	panel.resize(width, height);
	return panel;
}
