import { Container } from 'mwg/two-d/pixi-interop';
import { Label } from 'mwg';
import { SPD_TITLE_COLOR } from './spdTheme';

export interface MarkedTextOptions {
	readonly size: number;
	readonly maxWidth: number;
	readonly align?: 'left' | 'center';
	readonly color?: number;
	/** `RenderedTextBlock`'s highlight colour (`Window.TITLE_COLOR`, 0xFFFF44). */
	readonly highlight?: number;
}

/**
 * `RenderedTextBlock` with SPD's `_highlight_` markup (`Messages` strings toggle a highlight colour at every
 * underscore; `PixelScene.renderTextBlock` applies it, tag `v3.3.8`): word-wrapped to `maxWidth`, each word a
 * label coloured by the toggle state at that word, optionally centred per line. `\n` breaks a line and a blank
 * `\n\n` leaves a paragraph gap. Pixi's plain `Text` has no per-run colour, hence one label per word.
 */
export function markedText(markup: string, options: MarkedTextOptions): Container {
	const box = new Container();
	const base = options.color ?? 0xffffff;
	const highlight = options.highlight ?? SPD_TITLE_COLOR;
	const probe = new Label({ text: ' ', size: options.size, resolution: 6, roundPixels: true });
	const space = Math.max(1, Math.round(probe.width || options.size * 0.4));
	probe.destroy();
	type Word = { text: string; hl: boolean };
	const lines: Word[][] = [];
	let current: Word[] = [];
	let currentWidth = 0;
	let hl = false;
	const widthOf = (text: string): number => {
		const label = new Label({ text, size: options.size, resolution: 6, roundPixels: true });
		const w = label.width;
		label.destroy();
		return w;
	};
	const flush = (): void => { lines.push(current); current = []; currentWidth = 0; };
	for (const paragraph of markup.split('\n')) {
		if (paragraph.length === 0) { flush(); continue; }
		for (const raw of paragraph.split(' ')) {
			//An underscore toggles the highlight; it may sit inside a word (`_seal_,`).
			const parts = raw.split('_');
			let word = '';
			let firstHl: boolean | null = null;
			parts.forEach((part, index) => {
				if (index > 0) hl = !hl;
				if (part.length > 0) { word += part; if (firstHl === null) firstHl = hl; }
			});
			if (word.length === 0) continue;
			const w = widthOf(word);
			if (currentWidth > 0 && currentWidth + space + w > options.maxWidth) flush();
			current.push({ text: word, hl: firstHl ?? hl });
			currentWidth += (currentWidth > 0 ? space : 0) + w;
		}
		flush();
	}
	if (lines.length > 0 && lines[lines.length - 1]!.length === 0) lines.pop();
	let y = 0;
	for (const line of lines) {
		const labels = line.map((word) => new Label({ text: word.text, size: options.size, color: word.hl ? highlight : base, resolution: 6, roundPixels: true }));
		const total = labels.reduce((sum, label, i) => sum + label.width + (i > 0 ? space : 0), 0);
		let x = options.align === 'center' ? Math.round((options.maxWidth - total) / 2) : 0;
		let height = Math.round(options.size * 1.2);
		for (const label of labels) {
			label.position.set(x, y);
			box.addChild(label);
			x += label.width + space;
			height = Math.max(height, Math.round(label.height));
		}
		y += line.length === 0 ? Math.round(options.size * 0.8) : height;
	}
	return box;
}
