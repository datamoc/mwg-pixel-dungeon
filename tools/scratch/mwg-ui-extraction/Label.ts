import { Text, TextStyle } from 'pixi.js';
import { theme, themeChanged, type Theme } from './theme.ts';

export interface LabelOptions {
	text?: string;
	color?: number;
	size?: number;
	/** wraps at this width in pixels; omit for a single unwrapped line */
	wrapWidth?: number;
	align?: 'left' | 'center' | 'right';
	bold?: boolean;
	/** Outline in texture pixels, useful for text over artwork. */
	stroke?: { color: number; width: number };
	/** Text texture resolution; omit to use the renderer default. */
	resolution?: number;
	roundPixels?: boolean;
}

/**
 * A piece of text, styled from the theme.
 *
 * This is a thin wrapper over Pixi's `Text`, and its job is to stop every call site from
 * repeating a style object. Pixi renders text to its own texture, so changing the string
 * costs a re-render: cheap enough for a label, wasteful for something updated every
 * frame, where a value that only changes on whole numbers should be guarded.
 */
export class Label extends Text {
	private readonly opts: LabelOptions;
	private readonly themeListener = (t: Theme) => this.restyle(t);

	constructor(options: LabelOptions | string = {}) {
		const opts = typeof options === 'string' ? { text: options } : options;
		const t = theme();

		super({
			text: opts.text ?? '',
			resolution: opts.resolution,
			roundPixels: opts.roundPixels,
			style: new TextStyle({
				fontFamily: t.font.family,
				stroke: opts.stroke,
				fontSize: opts.size ?? t.font.size,
				fontWeight: opts.bold ? 'bold' : 'normal',
				fill: opts.color ?? t.color.text,
				lineHeight: (opts.size ?? t.font.size) * t.font.lineHeight,
				align: opts.align ?? (t.direction === 'rtl' ? 'right' : 'left'),
				wordWrap: opts.wrapWidth !== undefined,
				wordWrapWidth: opts.wrapWidth ?? 0,
				//without this a long unbroken word overflows its window instead of wrapping
				breakWords: true,
			}),
		});

		this.opts = opts;
		themeChanged.add(this.themeListener);
	}

	/** changes the colour without rebuilding the style object */
	setColor(color: number): void {
		this.style.fill = color;
	}

	/** avoids the re-render when the text has not actually changed */
	setText(value: string): void {
		if (this.text !== value) this.text = value;
	}

	/**
	 * Reapplies whichever style fields were never given an explicit option, so an
	 * explicit `color`/`size` a game passed in survives a theme change untouched while
	 * anything left to the theme's own defaults picks up the new one.
	 */
	private restyle(t: Theme): void {
		this.style.fontFamily = t.font.family;
		if (this.opts.color === undefined) this.style.fill = t.color.text;
		if (this.opts.size === undefined) {
			this.style.fontSize = t.font.size;
			this.style.lineHeight = t.font.size * t.font.lineHeight;
		}
		if (this.opts.align === undefined) this.style.align = t.direction === 'rtl' ? 'right' : 'left';
	}

	override destroy(options?: Parameters<Text['destroy']>[0]): void {
		themeChanged.remove(this.themeListener);
		super.destroy(options);
	}
}
