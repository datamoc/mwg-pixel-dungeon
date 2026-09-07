import { Container, Graphics, type Texture } from 'pixi.js';
import { Signal } from '../core/Signal.ts';
import { NinePatch, type NinePatchOptions } from './NinePatch.ts';
import { Label, type LabelOptions } from './Label.ts';
import { theme, themeChanged } from './theme.ts';

export type ButtonState = 'idle' | 'hover' | 'pressed' | 'disabled';

export interface ButtonSkin {
	texture: Texture;
	border: NinePatchOptions['border'];
	/** Missing states retain the standard button tint. */
	tints?: Partial<Record<ButtonState, number>>;
}

export interface ButtonOptions {
	width: number;
	height: number;

	/** the button's caption; omit for an icon-only button, the shape a title screen's
	 * rankings/badges/settings buttons usually take */
	text?: string;

	/** drawn to one side of the text, or centred alone if `text` is omitted */
	icon?: Container;

	/** Per-button chrome, independent of the window theme. Textures remain caller-owned. */
	skin?: ButtonSkin;
	/** Caption styling, also used when setText creates a caption later. */
	label?: Omit<LabelOptions, 'text'>;
	disabled?: boolean;
	onClick?: () => void;
}


/**
 * A clickable region with idle/hover/pressed/disabled states, a label, an icon, or both.
 *
 * Draws over the same `NinePatch`/theme machinery `Window` already draws its chrome from -
 * a panel texture if the theme has one, a flat rounded rectangle otherwise - so a button
 * looks like it belongs to the same interface without a game supplying separate art for it.
 *
 * `icon` alone (no `text`) is the icon-only button a title screen commonly reaches for -
 * rankings, badges, settings - where a caption would only repeat what the icon already says.
 */
export class Button extends Container {
	readonly onClick = new Signal<void>();

	private readonly skin?: ButtonSkin;
	private readonly labelOptions: Omit<LabelOptions, 'text'>;
	private background: NinePatch | Graphics;
	private labelText: Label | null;
	private icon: Container | null;

	private width_: number;
	private height_: number;
	private state: ButtonState = 'idle';
	private disabled_: boolean;

	private readonly themeListener = () => this.draw();

	constructor(options: ButtonOptions) {
		super();

		this.width_ = options.width;
		this.height_ = options.height;
		this.disabled_ = options.disabled ?? false;

		this.skin = options.skin;
		this.labelOptions = options.label ?? {};
		const t = theme();
		this.background = this.skin ? new NinePatch(this.skin.texture, { border: this.skin.border }) : t.panel ? new NinePatch(t.panel, { border: t.panelBorder }) : new Graphics();
		this.addChild(this.background);

		this.icon = options.icon ?? null;
		if (this.icon) this.addChild(this.icon);

		this.labelText = options.text !== undefined ? new Label({ align: 'center', ...this.labelOptions, text: options.text }) : null;
		if (this.labelText) this.addChild(this.labelText);

		if (options.onClick) this.onClick.add(options.onClick);

		this.eventMode = 'static';
		this.on('pointerover', () => this.setState('hover'));
		this.on('pointerout', () => this.setState('idle'));
		this.on('pointerdown', () => this.setState('pressed'));
		this.on('pointerup', () => {
			const wasPressed = this.state === 'pressed';
			this.setState('hover');
			if (wasPressed) this.onClick.dispatch();
		});
		this.on('pointerupoutside', () => this.setState('idle'));

		this.setState(this.disabled_ ? 'disabled' : 'idle');
		themeChanged.add(this.themeListener);
	}

	/** live-resize the button, for a caller whose own layout reflows on window resize rather
	 * than rebuilding buttons from scratch (`Window`'s own constructor-only sizing is fine
	 * for a fixed dialog; a title screen's responsive row of buttons is not) */
	resize(width: number, height: number): void {
		this.width_ = width;
		this.height_ = height;
		this.draw();
	}

	setText(text: string | undefined): void {
		if (text === undefined) {
			this.labelText?.destroy();
			this.labelText = null;
		} else if (this.labelText) {
			this.labelText.setText(text);
		} else {
			this.labelText = new Label({ align: 'center', ...this.labelOptions, text });
			this.addChild(this.labelText);
		}
		this.layoutContent();
	}

	get disabled(): boolean {
		return this.disabled_;
	}

	setDisabled(disabled: boolean): void {
		this.disabled_ = disabled;
		this.setState(disabled ? 'disabled' : 'idle');
	}

	private setState(state: ButtonState): void {
		if (this.disabled_ && state !== 'disabled') return;
		this.state = state;
		this.cursor = this.disabled_ ? 'default' : 'pointer';
		this.eventMode = this.disabled_ ? 'none' : 'static';
		this.draw();
	}

	/**
	 * Icon-only centres the icon; icon-plus-text sits the icon to the reading-start side
	 * (left in ltr, right in rtl) with the label following it, both vertically centred -
	 * the same icon-then-text arrangement `ListView`'s own rows already use.
	 */
	private layoutContent(): void {
		const rtl = theme().direction === 'rtl';

		if (this.icon && !this.labelText) {
			this.icon.x = Math.round((this.width_ - this.icon.width) / 2);
			this.icon.y = Math.round((this.height_ - this.icon.height) / 2);
			return;
		}

		if (this.icon && this.labelText) {
			const spacing = theme().spacing;
			const contentWidth = this.icon.width + spacing + this.labelText.width;
			const start = Math.round((this.width_ - contentWidth) / 2);

			this.icon.x = rtl ? start + this.labelText.width + spacing : start;
			this.icon.y = Math.round((this.height_ - this.icon.height) / 2);

			this.labelText.x = rtl ? start : start + this.icon.width + spacing;
			this.labelText.y = Math.round((this.height_ - this.labelText.height) / 2);
			return;
		}

		if (this.labelText) {
			this.labelText.x = Math.round((this.width_ - this.labelText.width) / 2);
			this.labelText.y = Math.round((this.height_ - this.labelText.height) / 2);
		}
	}

	private draw(): void {
		const t = theme();

		//idle/hover/pressed read as three brightness steps of the same panel rather than three
		//separate textures, which a game without dedicated button art still gets for free
		const tint =
			this.state === 'pressed'
				? 0x999999
				: this.state === 'hover'
					? 0xdddddd
					: this.state === 'disabled'
						? 0x777777
						: 0xffffff;

		if (this.background instanceof NinePatch) {
			this.background.resize(this.width_, this.height_);
			this.background.tint = this.skin?.tints?.[this.state] ?? tint;
		} else {
			const fill = this.state === 'pressed' ? t.color.selection : t.color.panelFill;
			this.background
				.clear()
				.roundRect(0, 0, this.width_, this.height_, 4)
				.fill({ color: fill, alpha: this.state === 'disabled' ? 0.5 : 1 })
				.stroke({ color: t.color.panelBorder, width: 1 });
		}

		this.labelText?.setColor(this.disabled_ ? t.color.textDim : this.labelOptions.color ?? t.color.text);
		if (this.icon) this.icon.alpha = this.disabled_ ? 0.4 : 1;
		this.layoutContent();
	}

	override destroy(options?: Parameters<Container['destroy']>[0]): void {
		themeChanged.remove(this.themeListener);
		super.destroy(options);
	}
}
