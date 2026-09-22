import { Container, Graphics, Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';
import { Game, Input, NinePatch, theme, Window, WindowStack } from 'mwg';
import { detectLanguage } from '../i18n/languages';
import { LANGUAGES, language, setLanguage, t, titleCase, type Language } from '../i18n/index';
import { LANGUAGE_KEY, runState } from '../runState';
import { applySpdDirection, SPD_TITLE_COLOR } from './spdTheme';
import { menuScale, SpdRedButton } from './spdButton';
import { SpdLabel as Label } from './spdLabel';
import { titleIcon, type TitleIconName } from './titleIcons';
import {
	betasEnabled, brightness, cameraFollow, colorblind, controllerSensitivity, flipTags, isFullscreen,
	isMusicMuted, isSfxMuted, movementSensitivity, musicVolume, newsEnabled, playMusicInBackground,
	screenShake, setBetasEnabled, setBrightness, setCameraFollow, setColorblind, setControllerSensitivity,
	setFlipTags, setFullscreen, setMovementSensitivity, setMusicVolume, setNewsEnabled,
	setPlayMusicInBackground, setScreenShake, setSfxVolume, setSystemFont, setUiMode, setUiScale,
	setUpdatesEnabled, setVibration, setVisualGrid, setWifiOnly, setZoomOffset, sfxVolume,
	systemFont, uiMode, uiScale, updatesEnabled, vibration, visualGrid, wifiOnly, zoomOffset,
} from '../settings';

/**
 * `windows/WndSettings.java` (tag `v3.3.8`): the tabbed settings window - Display, UI,
 * Input, Data, Audio and Langs tabs behind `Icons` icon tabs, built from `RedButton`,
 * `CheckBox` (+`CHECKED`/`UNCHECKED` icons) and `OptionSlider` (red `RED_BUTTON`
 * background, ticked track, red thumb) inside a `TAB_SET` chrome frame.
 *
 * Beauty parity: every row here wears the same art - `SpdRedButton` (`RED_BUTTON`
 * 38,0 6x6/border 2) for buttons and checkbox bodies, the check icons cut from the
 * port's own `icons.png` row (`titleIcons.ts`), sliders with Java's 4x7 red thumb on
 * a ticked `0x222222` track, `TITLE_COLOR` (gold) titles and 1px black separators.
 * The frame itself stays MWG `Window`'s themed `WINDOW` chrome - MWG gives a window
 * one theme panel, not per-window chrome, and the two stones are near-identical.
 * The tab strip sits as the content's last row rather than hanging below the frame
 * like Java's `WndTabbed` tabs (same icons, same `TAB_SELECTED`/`TAB_UNSELECTED`
 * art, same order, same `last_index` memory).
 *
 * Item parity: every row Java's desktop build shows is here. Rows that only make
 * sense on another platform are omitted like Java omits them (landscape checkbox
 * is Android-only, `ignore_silent` iOS-only, the Input tab's key/controller
 * binding editors need a binding system this port has none of, and the toolbar
 * sub-window needs toolbar modes this port's fixed toolbar has none of). Everything
 * else persists under Java's own keys/defaults/gates (`src/settings.ts`); rows with
 * no behavior seam yet (grid, follow, ui prefs, connectivity, sensitivities) are
 * persistence-only, each said so at its setting. The port-original `- zoom +`
 * stepper stays at the Display tab's foot (this port's camera has one fixed base
 * zoom where Java's is screen-derived - see `settings.ts`), and the old
 * single-window's Challenges button and version row are gone (Java reaches
 * challenges from the in-game menu, which this port already does, and shows the
 * version on the title screen instead).
 */

// `WndSettings`: portrait 122, landscape 223, two columns past 200, 21px sliders,
// 16px buttons/checkboxes, 1px gaps.
const WIDTH_P = 122;
const WIDTH_L = 223;
const SLIDER_HEIGHT = 21;
const BTN_HEIGHT = 16;
const GAP = 1;

/** `WndSettings.last_index` - the tab the window reopens on, kept across opens. */
let lastTab = 0;

function windowWidth(cap: number): number {
	return Math.min(cap, Game.current.width / menuScale(Game.current.width, Game.current.height) - 16);
}

/** `new ColorBlock(1, 1, 0xFF000000)` sized `(width, 1)` - Java's tab separators. */
function separator(width: number): Graphics {
	const line = new Graphics();
	line.rect(0, 0, width, 1).fill(0x000000);
	return line;
}

/** Centered gold tab title - `title.hardlight(TITLE_COLOR)`. */
function tabTitle(text: string, width: number): Label {
	const title = new Label({ text, size: 9, color: SPD_TITLE_COLOR });
	title.position.set(Math.round((width - title.width) / 2), GAP);
	return title;
}

/** Red-button chrome cut for the widgets below (`Chrome.Type.RED_BUTTON`). */
function redPatch(): Texture {
	return new Texture({ source: runState.sprites.uiChrome.source, frame: new Rectangle(38, 0, 6, 6) });
}

/** `WndTabbed` tab art: `TAB_SELECTED` (65,22) vs `TAB_UNSELECTED` (75,22), 8x13. */
function tabPatch(selected: boolean): NinePatch {
	const frame = selected ? new Rectangle(65, 22, 8, 13) : new Rectangle(75, 22, 8, 13);
	return new NinePatch(
		new Texture({ source: runState.sprites.uiChrome.source, frame }),
		{ border: { left: 3, top: 7, right: 3, bottom: 5 } },
	);
}

/**
 * `ui/Checkbox.java`: a full-width red button with the label left and the
 * `CHECKED`/`UNCHECKED` icon right. The text shrinks until it fits, like Java's
 * `while (text.right() > icon.x) size--` loop (floored at 5px so a label can
 * never vanish entirely - Java has no floor, this is the one deliberate guard).
 * Toggles in place - no window rebuild.
 */
export class SpdCheckBox extends Container {
	private checked: boolean;
	private readonly box: NinePatch;
	private icon: Sprite;
	private readonly onToggle: (checked: boolean) => void;
	private readonly width_: number;

	constructor(width: number, text: string, checked: boolean, onToggle: (checked: boolean) => void) {
		super();
		this.width_ = width;
		this.checked = checked;
		this.onToggle = onToggle;
		this.box = new NinePatch(redPatch(), { border: 2 });
		this.box.resize(width, BTN_HEIGHT);
		this.box.eventMode = 'static';
		this.box.cursor = 'pointer';
		this.box.hitArea = new Rectangle(0, 0, width, BTN_HEIGHT);
		this.addChild(this.box);
		let size = 9;
		let label = new Label({ text, size, color: theme().color.text });
		while (size > 5 && label.width > width - 12 - 6) {
			size -= 1;
			label = new Label({ text, size, color: theme().color.text });
		}
		label.position.set(3, Math.round((BTN_HEIGHT - label.height) / 2));
		this.addChild(label);
		this.icon = this.makeIcon();
		this.addChild(this.icon);
		this.box.on('pointertap', () => this.setChecked(!this.checked, true));
	}

	private makeIcon(): Sprite {
		const icon = titleIcon(runState.sprites.uiIcons, this.checked ? 'checked' : 'unchecked', 1);
		icon.position.set(this.width_ - 3 - 12, Math.round((BTN_HEIGHT - 12) / 2));
		return icon;
	}

	setChecked(checked: boolean, fire = false): void {
		this.checked = checked;
		this.removeChild(this.icon);
		this.icon = this.makeIcon();
		this.addChild(this.icon);
		if (fire) this.onToggle(checked);
	}

	isChecked(): boolean {
		return this.checked;
	}

	setEnabled(enabled: boolean): void {
		//`StyledButton.enable`: content dims to 0.3 and input stops.
		this.alpha = enabled ? 1 : 0.3;
		this.box.eventMode = enabled ? 'static' : 'none';
	}
}

/**
 * `ui/OptionSlider.java`: red button background at half alpha, centered title
 * (9px, 6px past 60% width), 6px min/max labels, a `0x222222` track with one tick
 * per step and a 4x7 red thumb. The thumb follows the drag; the value snaps and
 * `onChange` fires on release, like Java's pointer-up commit.
 */
export class SpdOptionSlider extends Container {
	private value: number;
	private readonly min: number;
	private readonly max: number;
	private readonly width_: number;
	private readonly thumb: NinePatch;
	private readonly hit: Graphics;
	private dragging = false;
	private readonly onChange: (value: number) => void;

	constructor(width: number, title: string, minLabel: string, maxLabel: string, min: number, max: number, value: number, onChange: (value: number) => void) {
		super();
		this.width_ = width;
		this.min = min;
		this.max = max;
		this.value = value;
		this.onChange = onChange;
		const bg = new NinePatch(redPatch(), { border: 2 });
		bg.resize(width, SLIDER_HEIGHT);
		bg.alpha = 0.5;
		this.addChild(bg);
		const titleSize = new Label({ text: title, size: 9 }).width > 0.6 * width ? 6 : 9;
		const titleLabel = new Label({ text: title, size: titleSize, color: theme().color.text });
		titleLabel.position.set(Math.round((width - titleLabel.width) / 2), 2);
		this.addChild(titleLabel);
		const trackY = SLIDER_HEIGHT - 7;
		const span = Math.max(1, max - min);
		const tickDist = (width - 5) / span;
		const track = new Graphics();
		track.rect(2, trackY, width - 5, 1).fill(0x222222);
		for (let i = 0; i <= span; i++) track.rect(Math.round(2 + tickDist * i), trackY - 4, 1, 9).fill(0x222222);
		this.addChild(track);
		const minText = new Label({ text: minLabel, size: 6, color: theme().color.text });
		minText.position.set(1, Math.round(trackY - 5 - minText.height));
		this.addChild(minText);
		const maxText = new Label({ text: maxLabel, size: 6, color: theme().color.text });
		maxText.position.set(Math.round(width - maxText.width - 1), Math.round(trackY - 5 - maxText.height));
		this.addChild(maxText);
		this.thumb = new NinePatch(redPatch(), { border: 2 });
		this.thumb.resize(4, 7);
		this.placeThumb(value);
		this.addChild(this.thumb);
		this.hit = new Graphics();
		this.hit.rect(0, 0, width, SLIDER_HEIGHT).fill({ color: 0xffffff, alpha: 0 });
		this.hit.eventMode = 'static';
		this.hit.cursor = 'pointer';
		this.addChild(this.hit);
		this.hit.on('pointerdown', (event) => {
			this.dragging = true;
			this.placeThumb(this.valueAt(event));
		});
		this.hit.on('pointermove', (event) => {
			if (this.dragging) this.placeThumb(this.valueAt(event));
		});
		const release = (event: { global: { x: number; y: number } }) => {
			if (!this.dragging) return;
			this.dragging = false;
			const next = this.valueAt(event);
			this.placeThumb(next);
			if (next !== this.value) {
				this.value = next;
				this.onChange(next);
			}
		};
		this.hit.on('pointerup', release);
		this.hit.on('pointerupoutside', release);
	}

	private placeThumb(value: number): void {
		const span = Math.max(1, this.max - this.min);
		this.thumb.position.set(Math.round(2 + ((this.width_ - 5) / span) * (value - this.min) - 2), SLIDER_HEIGHT - 7 - 3);
	}

	private valueAt(event: { global: { x: number; y: number } }): number {
		const local = this.hit.toLocal({ x: event.global.x, y: event.global.y });
		const frac = Math.min(1, Math.max(0, (local.x - 2) / (this.width_ - 5)));
		return this.min + Math.round(frac * (this.max - this.min));
	}

	getValue(): number {
		return this.value;
	}

	/** Keyboard-adjustment counterpart to dragging the thumb: steps by one tick, clamped to
	 * `[min, max]`, moves the thumb and fires `onChange` exactly like a completed drag does. */
	step(delta: number): void {
		const next = Math.max(this.min, Math.min(this.max, this.value + delta));
		if (next === this.value) return;
		this.value = next;
		this.placeThumb(next);
		this.onChange(next);
	}
}

interface SettingsContext {
	windows: WindowStack;
	/** Language picks need a full relabel: close and let the caller rebuild. */
	applyLanguage: () => void;
}

interface SettingsTab {
	id: string;
	icon: TitleIconName;
	build: (width: number, ctx: SettingsContext) => { node: Container; height: number };
}

/** Fullscreen through the browser API; the row reverts when the browser refuses. */
function applyFullscreen(enabled: boolean, box: SpdCheckBox): void {
	setFullscreen(enabled);
	try {
		if (typeof document === 'undefined') {
			box.setChecked(false);
			return;
		}
		if (enabled) {
			const request = (document.documentElement as HTMLElement & { requestFullscreen?: () => Promise<void> }).requestFullscreen;
			if (typeof request !== 'function') {
				box.setChecked(false);
				return;
			}
			const result = request.call(document.documentElement);
			if (result && typeof result.catch === 'function') result.catch(() => box.setChecked(false));
		} else if (typeof document.exitFullscreen === 'function' && document.fullscreenElement) {
			void document.exitFullscreen().catch(() => undefined);
		}
	} catch {
		box.setChecked(false);
	}
}

function displayTab(): SettingsTab {
	return {
		id: 'display',
		icon: 'displayPort',
		build: (width) => {
			const node = new Container();
			let y = 0;
			const title = tabTitle(t('windows.wndsettings$displaytab.title'), width);
			node.addChild(title);
			y += title.height + 3 * GAP;
			const sep1 = separator(width);
			sep1.position.set(0, y);
			node.addChild(sep1);
			y += 1 + GAP;
			//`DisplayTab.chkFullscreen`: `supportsFullScreen` is a mobile-platform
			//query in Java; here the Fullscreen API is the capability probe, and an
			//unchecked-by-default row disables itself when the browser has none.
			const supportsFullscreen = typeof document !== 'undefined'
				&& typeof (document.documentElement as { requestFullscreen?: unknown }).requestFullscreen === 'function';
			let fullscreenBox: SpdCheckBox;
			fullscreenBox = new SpdCheckBox(width, t('windows.wndsettings$displaytab.fullscreen'), supportsFullscreen && isFullscreen(), (checked) => {
				applyFullscreen(checked, fullscreenBox);
			});
			if (!supportsFullscreen) fullscreenBox.setEnabled(false);
			fullscreenBox.position.set(0, y);
			node.addChild(fullscreenBox);
			y += BTN_HEIGHT + GAP;
			//Port-original accessibility row (ROADMAP.md section 8) - Java has no such
			//setting; swaps `ui/spdTheme.ts`'s `SPD_STATUS_COLOR` and `ui/buffOverlays.ts`'s
			//buff-text tint to a colorblind-safe palette (see `settings.colorblind()`'s doc).
			const colorblindBox = new SpdCheckBox(width, t('port.ui.colorblind'), colorblind(), (checked) => setColorblind(checked));
			colorblindBox.position.set(0, y);
			node.addChild(colorblindBox);
			y += BTN_HEIGHT + GAP;
			const sep2 = separator(width);
			sep2.position.set(0, y);
			node.addChild(sep2);
			y += 1 + GAP;
			const rows: { title: string; min: string; max: string; minVal: number; maxVal: number; value: number; onChange: (v: number) => void }[] = [
				{
					title: t('windows.wndsettings$displaytab.brightness'),
					min: t('windows.wndsettings$displaytab.dark'),
					max: t('windows.wndsettings$displaytab.bright'),
					minVal: -1, maxVal: 1, value: brightness(),
					onChange: (v) => setBrightness(v),
				},
				{
					title: t('windows.wndsettings$displaytab.visual_grid'),
					min: t('windows.wndsettings$displaytab.off'),
					max: t('windows.wndsettings$displaytab.high'),
					minVal: -1, maxVal: 2, value: visualGrid(),
					onChange: (v) => setVisualGrid(v),
				},
				{
					title: t('windows.wndsettings$displaytab.camera_follow'),
					min: t('windows.wndsettings$displaytab.low'),
					max: t('windows.wndsettings$displaytab.high'),
					minVal: 1, maxVal: 4, value: cameraFollow(),
					onChange: (v) => setCameraFollow(v),
				},
				{
					title: t('windows.wndsettings$displaytab.screenshake'),
					min: t('windows.wndsettings$displaytab.off'),
					max: t('windows.wndsettings$displaytab.high'),
					minVal: 0, maxVal: 4, value: screenShake(),
					onChange: (v) => setScreenShake(v),
				},
			];
			if (width > 200) {
				for (let i = 0; i < rows.length; i += 2) {
					const half = (width - GAP) / 2;
					for (let c = 0; c < 2 && i + c < rows.length; c++) {
						const s = rows[i + c]!;
						const slider = new SpdOptionSlider(half, s.title, s.min, s.max, s.minVal, s.maxVal, s.value, s.onChange);
						slider.position.set(c * (half + GAP), y);
						node.addChild(slider);
					}
					y += SLIDER_HEIGHT + GAP;
				}
			} else {
				for (const s of rows) {
					const slider = new SpdOptionSlider(width, s.title, s.min, s.max, s.minVal, s.maxVal, s.value, s.onChange);
					slider.position.set(0, y);
					node.addChild(slider);
					y += SLIDER_HEIGHT + GAP;
				}
			}
			//Port-original game-zoom stepper: Java has no settings row for zoom (its
			//zoom is screen-derived), but this port's camera sits at one fixed base
			//zoom, so the persisted offset needs a row to live on - kept from the old
			//single-window settings, restyled to match.
			const zoomStep = 40;
			const offset = zoomOffset();
			const zoomLabel = new Label({
				text: offset === 0 ? '0' : `${offset > 0 ? '+' : ''}${offset}`,
				size: 8,
				align: 'center',
				color: theme().color.text,
			});
			const zoomOut = new SpdRedButton({ width: zoomStep, height: 22, text: '-' });
			zoomOut.position.set(0, y);
			const zoomIn = new SpdRedButton({ width: zoomStep, height: 22, text: '+' });
			zoomIn.position.set(width - zoomStep, y);
			zoomLabel.position.set(zoomStep + 4, y + 11 - zoomLabel.height / 2);
			node.addChild(zoomOut, zoomIn, zoomLabel);
			const refreshZoom = (): void => {
				const next = zoomOffset();
				zoomLabel.setText(next === 0 ? '0' : `${next > 0 ? '+' : ''}${next}`);
				zoomLabel.position.set(zoomStep + 4, y + 11 - zoomLabel.height / 2);
			};
			zoomOut.onClick.add(() => {
				setZoomOffset(zoomOffset() - 1);
				refreshZoom();
			});
			zoomIn.onClick.add(() => {
				setZoomOffset(zoomOffset() + 1);
				refreshZoom();
			});
			y += 22 + GAP;
			return { node, height: y - GAP };
		},
	};
}

function uiTab(): SettingsTab {
	return {
		id: 'ui',
		icon: 'prefs',
		build: (width) => {
			const node = new Container();
			let y = 0;
			const title = tabTitle(t('windows.wndsettings$uitab.title'), width);
			node.addChild(title);
			y += title.height + 3 * GAP;
			const sep1 = separator(width);
			sep1.position.set(0, y);
			node.addChild(sep1);
			y += 1 + GAP;
			//`UITab`'s mode/scale sliders: Java gates them on spare screen space and
			//rebuilds the scene on change; the desktop browser always has the space,
			//and with no interface-mode/scale seam the rows persist only (see
			//`settings.ts`), so no rebuild is needed either.
			const mode = new SpdOptionSlider(width, t('windows.wndsettings$uitab.mode').replace(/:$/, ''),
				t('windows.wndsettings$uitab.mobile'), t('windows.wndsettings$uitab.full'),
				0, 2, uiMode(), (v) => setUiMode(v));
			mode.position.set(0, y);
			node.addChild(mode);
			y += SLIDER_HEIGHT + GAP;
			const scale = new SpdOptionSlider(width, t('windows.wndsettings$uitab.scale'),
				'1X', '4X', 1, 4, uiScale(), (v) => setUiScale(v));
			scale.position.set(0, y);
			node.addChild(scale);
			y += SLIDER_HEIGHT + GAP;
			//No toolbar-mode seam exists (fixed actions plus the expandable menu), so
			//the `toolbar_settings` sub-window has nothing to edit; the flip-tags row
			//Java shows beside it in full mode is shown unconditionally instead.
			const flip = new SpdCheckBox(width, t('windows.wndsettings$uitab.flip_indicators'), flipTags(), (checked) => setFlipTags(checked));
			flip.position.set(0, y);
			node.addChild(flip);
			y += BTN_HEIGHT + GAP;
			const sep2 = separator(width);
			sep2.position.set(0, y);
			node.addChild(sep2);
			y += 1 + GAP;
			const font = new SpdCheckBox(width, t('windows.wndsettings$uitab.system_font'), systemFont(), (checked) => setSystemFont(checked));
			const vibe = new SpdCheckBox(width, t('windows.wndsettings$uitab.vibration'), vibration(), (checked) => {
				setVibration(checked);
				//`UITab.chkVibrate`: `Game.vibrate(250)` on check - the web equivalent.
				if (checked && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
					try {
						navigator.vibrate(250);
					} catch {
						//haptics are best-effort; the preference still persists
					}
				}
			});
			if (width > 200) {
				const half = (width - GAP) / 2;
				font.position.set(0, y);
				vibe.position.set(half + GAP, y);
				node.addChild(font, vibe);
				y += BTN_HEIGHT + GAP;
			} else {
				font.position.set(0, y);
				node.addChild(font);
				y += BTN_HEIGHT + GAP;
				vibe.position.set(0, y);
				node.addChild(vibe);
				y += BTN_HEIGHT + GAP;
			}
			return { node, height: y - GAP };
		},
	};
}

function inputTab(): SettingsTab {
	return {
		id: 'input',
		icon: 'keyboard',
		build: (width) => {
			const node = new Container();
			let y = 0;
			const title = tabTitle(t('windows.wndsettings$inputtab.title'), width);
			node.addChild(title);
			y += title.height + 3 * GAP;
			const sep1 = separator(width);
			sep1.position.set(0, y);
			node.addChild(sep1);
			y += 1 + GAP;
			//The key/controller binding editors need a rebindable-action system this
			//port has none of, so the tab carries Java's two sensitivity sliders only.
			const sens = new SpdOptionSlider(width, t('windows.wndsettings$inputtab.controller_sensitivity'),
				'1', '10', 1, 10, controllerSensitivity(), (v) => setControllerSensitivity(v));
			sens.position.set(0, y);
			node.addChild(sens);
			y += SLIDER_HEIGHT + GAP;
			const hold = new SpdOptionSlider(width, t('windows.wndsettings$inputtab.movement_sensitivity'),
				t('windows.wndsettings$inputtab.off'), t('windows.wndsettings$inputtab.high'),
				0, 4, movementSensitivity(), (v) => setMovementSensitivity(v));
			hold.position.set(0, y);
			node.addChild(hold);
			y += SLIDER_HEIGHT + GAP;
			return { node, height: y - GAP };
		},
	};
}

function dataTab(): SettingsTab {
	return {
		id: 'data',
		icon: 'data',
		build: (width) => {
			const node = new Container();
			let y = 0;
			const title = tabTitle(t('windows.wndsettings$datatab.title'), width);
			node.addChild(title);
			y += title.height + 3 * GAP;
			const sep1 = separator(width);
			sep1.position.set(0, y);
			node.addChild(sep1);
			y += 1 + GAP;
			//Connectivity rows persist under Java's keys; no feed/updater/wifi seam
			//exists, so they are preference-only (see `settings.ts`).
			const news = new SpdCheckBox(width, t('windows.wndsettings$datatab.news'), newsEnabled(), (checked) => setNewsEnabled(checked));
			const updates = new SpdCheckBox(width, t('windows.wndsettings$datatab.updates'), updatesEnabled(), (checked) => setUpdatesEnabled(checked));
			const betas = new SpdCheckBox(width, t('windows.wndsettings$datatab.betas'), betasEnabled(), (checked) => setBetasEnabled(checked));
			const wifi = new SpdCheckBox(width, t('windows.wndsettings$datatab.wifi'), wifiOnly(), (checked) => setWifiOnly(checked));
			if (width > 200) {
				const half = (width - GAP) / 2;
				news.position.set(0, y);
				updates.position.set(half + GAP, y);
				node.addChild(news, updates);
				y += BTN_HEIGHT + GAP;
			} else {
				news.position.set(0, y);
				node.addChild(news);
				y += BTN_HEIGHT + GAP;
				updates.position.set(0, y);
				node.addChild(updates);
				y += BTN_HEIGHT + GAP;
			}
			betas.position.set(0, y);
			node.addChild(betas);
			y += BTN_HEIGHT + GAP;
			wifi.position.set(0, y);
			node.addChild(wifi);
			y += BTN_HEIGHT + GAP;
			return { node, height: y - GAP };
		},
	};
}

function audioTab(): SettingsTab {
	return {
		id: 'audio',
		icon: 'audio',
		build: (width) => {
			const node = new Container();
			let y = 0;
			const title = tabTitle(t('windows.wndsettings$audiotab.title'), width);
			node.addChild(title);
			y += title.height + 3 * GAP;
			const sep1 = separator(width);
			sep1.position.set(0, y);
			node.addChild(sep1);
			y += 1 + GAP;
			const audio = runState.audio;
			const musicSlider = new SpdOptionSlider(width, t('windows.wndsettings$audiotab.music_vol'),
				'0', '10', 0, 10, musicVolume(), (v) => audio.setMusicVolume(v));
			const musicMute = new SpdCheckBox(width, t('windows.wndsettings$audiotab.music_mute'), isMusicMuted(), (checked) => audio.setMusicMuted(checked));
			const sfxSlider = new SpdOptionSlider(width, t('windows.wndsettings$audiotab.sfx_vol'),
				'0', '10', 0, 10, sfxVolume(), (v) => {
					audio.setSfxVolume(v);
					//`AudioTab` previews the level with a click on every slider change.
					audio.cue('click');
				});
			const sfxMute = new SpdCheckBox(width, t('windows.wndsettings$audiotab.sfx_mute'), isSfxMuted(), (checked) => audio.setSfxMuted(checked));
			if (width > 200) {
				const half = (width - GAP) / 2;
				musicSlider.position.set(0, y);
				sfxSlider.position.set(half + GAP, y);
				musicMute.position.set(0, y + SLIDER_HEIGHT + GAP);
				sfxMute.position.set(half + GAP, y + SLIDER_HEIGHT + GAP);
				node.addChild(musicSlider, sfxSlider, musicMute, sfxMute);
				y += SLIDER_HEIGHT + GAP + BTN_HEIGHT + GAP;
			} else {
				musicSlider.position.set(0, y);
				node.addChild(musicSlider);
				y += SLIDER_HEIGHT + GAP;
				musicMute.position.set(0, y);
				node.addChild(musicMute);
				y += BTN_HEIGHT + GAP;
				const sep2 = separator(width);
				sep2.position.set(0, y);
				node.addChild(sep2);
				y += 1 + GAP;
				sfxSlider.position.set(0, y);
				node.addChild(sfxSlider);
				y += SLIDER_HEIGHT + GAP;
				sfxMute.position.set(0, y);
				node.addChild(sfxMute);
				y += BTN_HEIGHT + GAP;
			}
			const sep3 = separator(width);
			sep3.position.set(0, y);
			node.addChild(sep3);
			y += 1 + GAP;
			//Desktop branch (`music_bg`); the iOS `ignore_silent` row cannot apply here.
			const musicBg = new SpdCheckBox(width, t('windows.wndsettings$audiotab.music_bg'), playMusicInBackground(), (checked) => setPlayMusicInBackground(checked));
			musicBg.position.set(0, y);
			node.addChild(musicBg);
			y += BTN_HEIGHT + GAP;
			return { node, height: y - GAP };
		},
	};
}

/** Native language first (Java moves the device locale to the top), then SPD order. */
function orderedLanguages(): Language[] {
	let prefs: readonly string[] = [];
	try {
		if (typeof navigator !== 'undefined') prefs = navigator.languages;
	} catch {
		prefs = [];
	}
	const native = detectLanguage(prefs);
	return [native, ...LANGUAGES.filter((lang) => lang.code !== native.code)];
}

function langsTab(): SettingsTab {
	return {
		id: 'langs',
		icon: 'langs',
		build: (width, ctx) => {
			const node = new Container();
			let y = 0;
			const title = tabTitle(t('windows.wndsettings$langstab.title'), width);
			node.addChild(title);
			y += title.height + 3 * GAP;
			const sep1 = separator(width);
			sep1.position.set(0, y);
			node.addChild(sep1);
			y += 1 + GAP;
			//`_Name_ - status`: English names the source language in hardcoded
			//English like Java; the rest read the `langstab` status keys, tinted
			//`WARNING` orange / `NEGATIVE` red like Java's highlight.
			const current = language();
			const statusText = current.code === 'en'
				? 'This is the source language, written by the developer.'
				: current.status === 'complete'
					? t('windows.wndsettings$langstab.completed')
					: current.status === 'unreviewed'
						? t('windows.wndsettings$langstab.unreviewed')
						: t('windows.wndsettings$langstab.unfinished');
			const info = new Label({
				text: `_${titleCase(current.nativeName)}_ - ${statusText}`,
				size: 6,
				wrapWidth: width,
				color: current.status === 'complete' || current.code === 'en'
					? theme().color.textDim
					: current.status === 'unreviewed'
						? 0xff8800
						: 0xff0000,
			});
			info.position.set(0, y);
			node.addChild(info);
			y += info.height + 2 * GAP;
			const sep2 = separator(width);
			sep2.position.set(0, y);
			node.addChild(sep2);
			y += 2;
			//Language grid: 3 columns portrait, 6 landscape, current in
			//`TITLE_COLOR`, unfinished grey, unreviewed pale (`LangsTab`).
			const cols = width > 200 ? 6 : 3;
			const btnWidth = Math.floor((width - (cols - 1)) / cols);
			let x = 0;
			for (const lang of orderedLanguages()) {
				const isCurrent = lang.code === current.code;
				const color = isCurrent
					? theme().color.textHighlight
					: lang.status === 'unfinished'
						? 0x888888
						: lang.status === 'unreviewed'
							? 0xbbbbbb
							: undefined;
				const button = new SpdRedButton({
					width: btnWidth,
					height: 11,
					text: titleCase(lang.nativeName),
					label: { size: 6, ...(color !== undefined ? { color } : {}) },
					onClick: () => {
						setLanguage(lang);
						applySpdDirection();
						try {
							localStorage.setItem(LANGUAGE_KEY, lang.code);
						} catch {
							//a browser with storage blocked still gets the language for this session
						}
						ctx.applyLanguage();
					},
				});
				button.position.set(x, y);
				node.addChild(button);
				x += btnWidth + 1;
				if (x + btnWidth > width) {
					x = 0;
					y += 12;
				}
			}
			if (x > 0) y += 12;
			const sep3 = separator(width);
			sep3.position.set(0, y);
			node.addChild(sep3);
			y += 2;
			if (current.code !== 'en') {
				const creditsLabel = titleCase(t('windows.wndsettings$langstab.credits'));
				const credits = new SpdRedButton({
					width: Math.min(width, creditsLabel.length * 6 + 12),
					height: 16,
					text: creditsLabel,
					label: { size: 6 },
					onClick: () => showLangCredits(ctx, current),
				});
				credits.position.set(width - credits.width, y);
				const transifex = new Label({
					text: t('windows.wndsettings$langstab.transifex'),
					size: 5,
					wrapWidth: Math.max(20, width - credits.width - 4),
					color: theme().color.textDim,
				});
				transifex.position.set(0, y);
				node.addChild(transifex, credits);
				y += Math.max(credits.height, transifex.height);
			} else {
				const transifex = new Label({
					text: t('windows.wndsettings$langstab.transifex'),
					size: 5,
					wrapWidth: width,
					color: theme().color.textDim,
				});
				transifex.position.set(0, y);
				node.addChild(transifex);
				y += transifex.height;
			}
			return { node, height: y };
		},
	};
}

/**
 * `LangsTab`'s credits popup: reviewers then translators, Java's entries verbatim
 * (`languages.ts`). Java underscores the section headers through text markup; this
 * port's labels carry no markup, so the headers are their own gold labels instead.
 */
function showLangCredits(ctx: SettingsContext, lang: Language): void {
	const width = windowWidth(160);
	const window = new Window({ width, height: 100, title: titleCase(t('windows.wndsettings$langstab.credits')), anchor: 'center', blocker: true });
	const chrome = window.height - window.contentHeight;
	let y = 0;
	const addSection = (key: string, names: readonly string[]): void => {
		if (names.length === 0) return;
		const header = new Label({ text: titleCase(t(key)), size: 7, color: SPD_TITLE_COLOR });
		header.position.set(0, y);
		window.content.addChild(header);
		y += header.height + 2;
		const body = new Label({ text: names.join(', '), size: 6, wrapWidth: window.contentWidth, color: theme().color.text });
		body.position.set(0, y);
		window.content.addChild(body);
		y += body.height + 6;
	};
	addSection('windows.wndsettings$langstab.reviewers', lang.reviewers);
	addSection('windows.wndsettings$langstab.translators', lang.translators);
	const close = new SpdRedButton({ width: window.contentWidth, height: 16, text: t('port.window.close'), onClick: () => window.close() });
	close.position.set(0, y);
	window.content.addChild(close);
	y += 16;
	window.resize(width, chrome + y + 8);
	ctx.windows.push(window);
}

/**
 * Settings: `WndSettings`' six tabs under real Java labels, chrome and layout.
 *
 * A language change rebuilds the whole interface, which the title screen does by
 * switching to itself; `onLanguageChanged` is what a caller wants to happen instead -
 * the title passes its own scene switch, the in-game menu keeps the run and just
 * closes the menu, so a mid-run language change does not abandon the hero
 * (`WndSettings` changes language in place in Java).
 */
export function showSettingsWindow(windows: WindowStack, onLanguageChanged: () => void): void {
	const landscape = Game.current.width > Game.current.height;
	const width = landscape ? windowWidth(WIDTH_L) : windowWidth(WIDTH_P);
	const window = new Window({ width, height: 100, anchor: 'center', blocker: true });
	const chrome = window.height - window.contentHeight;
	const contentWidth = window.contentWidth;
	const tabs: SettingsTab[] = [displayTab(), uiTab(), inputTab(), dataTab(), audioTab(), langsTab()];
	//`DISPLAY` is two images in Java, picked by orientation - same rule as the
	//in-game menu's own display icon (`gameMenu.ts`).
	tabs[0]!.icon = landscape ? 'displayLand' : 'displayPort';
	if (lastTab < 0 || lastTab >= tabs.length) lastTab = 0;
	const ctx: SettingsContext = {
		windows,
		applyLanguage: () => {
			window.close();
			onLanguageChanged();
		},
	};
	const built = tabs.map((tab) => tab.build(contentWidth, ctx));
	const maxHeight = Math.max(...built.map((b) => b.height));
	const stripHeight = 20;
	const strip: { selected: NinePatch; unselected: NinePatch }[] = [];
	//Filled in below once `drawCheckboxFocus` exists - `select` is used by both the mouse
	//tab-click handlers (further down) and the keyboard tab-switch handler, so both need the
	//checkbox focus reset that follows a tab change, not just the keyboard path.
	let onTabSelected: () => void = () => {};
	const select = (index: number): void => {
		lastTab = index;
		built.forEach((b, i) => {
			b.node.visible = i === index;
		});
		strip.forEach((s, i) => {
			s.selected.visible = i === index;
			s.unselected.visible = i !== index;
		});
		onTabSelected();
	};
	built.forEach((b, i) => {
		b.node.visible = i === lastTab;
		window.content.addChild(b.node);
	});
	const tabWidth = Math.floor(contentWidth / tabs.length);
	tabs.forEach((tab, i) => {
		const holder = new Container();
		//The tap target lives on the chrome patches themselves (the checkbox
		//pattern), not on the bare holder: a bare `Container` with a hit area
		//never saw the tap in the live build, while the same hit area on a
		//`NinePatch` fires reliably.
		const selected = tabPatch(true);
		selected.resize(tabWidth, stripHeight);
		const unselected = tabPatch(false);
		unselected.resize(tabWidth, stripHeight);
		const icon = titleIcon(runState.sprites.uiIcons, tab.icon, 1);
		icon.position.set(Math.round((tabWidth - icon.width) / 2), Math.round((stripHeight - icon.height) / 2));
		holder.addChild(unselected, selected, icon);
		selected.visible = i === lastTab;
		unselected.visible = i !== lastTab;
		holder.position.set(i * tabWidth, maxHeight + GAP);
		for (const patch of [selected, unselected]) {
			patch.eventMode = 'static';
			patch.cursor = 'pointer';
			patch.hitArea = new Rectangle(0, 0, tabWidth, stripHeight);
			patch.on('pointertap', () => {
				select(i);
			});
		}
		window.content.addChild(holder);
		strip.push({ selected, unselected });
	});
	window.resize(width, chrome + maxHeight + GAP + stripHeight + 8);
	//Port-original keyboard-navigation accessibility work (ROADMAP.md section 8 - Java has
	//no such system), fourth/sixth slices: up/down moves a focus ring over the current tab's
	//own checkboxes and sliders (direct children of its `node` - every existing tab builder
	//adds them flat, not nested, so a shallow scan finds them all, in visual order since
	//that is add order too). Confirm toggles a focused checkbox through its own
	//`setChecked(!checked, true)`; left/right adjusts a focused slider through its own new
	//`step(delta)` (one tick per press) - and only falls back to switching tabs when nothing
	//adjustable is focused, so the same keys serve both jobs without a mode switch. The
	//language grid (`langsTab`, a plain `SpdButton` grid) stays mouse-only still - not a
	//checkbox or a slider, so this scan does not reach it.
	const widgetFocusRing = new Graphics();
	widgetFocusRing.eventMode = 'none';
	window.content.addChild(widgetFocusRing);
	let focusedWidget = 0;
	const focusablesIn = (tabIndex: number): (SpdCheckBox | SpdOptionSlider)[] =>
		built[tabIndex]!.node.children.filter((c): c is SpdCheckBox | SpdOptionSlider =>
			c instanceof SpdCheckBox || c instanceof SpdOptionSlider);
	const drawWidgetFocus = (): void => {
		const widgets = focusablesIn(lastTab);
		widgetFocusRing.clear();
		if (widgets.length === 0) return;
		focusedWidget = Math.min(focusedWidget, widgets.length - 1);
		const w = widgets[focusedWidget]!;
		widgetFocusRing.rect(w.x - 2, w.y - 2, w.width + 4, w.height + 4)
			.stroke({ width: 2, color: 0xffffff, alpha: 0.9 });
	};
	onTabSelected = () => { focusedWidget = 0; drawWidgetFocus(); };
	//Registered after `windows.push` so it sits in front of every listener already on
	//`Input.onAction` (a stack-mode `Signal` offers the newest listener first) while this
	//window is the top of the stack; removed on close so a lower window (or the scene
	//itself) gets the keys back untouched.
	const onTabAction = (action: string): boolean => {
		const widgets = focusablesIn(lastTab);
		const focused = widgets[focusedWidget];
		if (focused instanceof SpdOptionSlider && (action === 'left' || action === 'right')) {
			focused.step(action === 'left' ? -1 : 1);
			return true;
		}
		if (action === 'left') { select((lastTab - 1 + tabs.length) % tabs.length); return true; }
		if (action === 'right') { select((lastTab + 1) % tabs.length); return true; }
		if (widgets.length > 0) {
			if (action === 'up') { focusedWidget = (focusedWidget - 1 + widgets.length) % widgets.length; drawWidgetFocus(); return true; }
			if (action === 'down') { focusedWidget = (focusedWidget + 1) % widgets.length; drawWidgetFocus(); return true; }
			if (action === 'confirm' && focused instanceof SpdCheckBox) { focused.setChecked(!focused.isChecked(), true); return true; }
		}
		return false;
	};
	drawWidgetFocus();
	Input.onAction.add(onTabAction);
	window.onClose.add(() => Input.onAction.remove(onTabAction));
	windows.push(window);
}
