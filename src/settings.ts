/**
 * `SPDSettings`' persisted audio/display/UI settings, ported as plain functions over an
 * injected string store so the whole thing stays testable in node
 * (`tools/verifyDisplaySettings.mjs` transpiles this file alone - no DOM, no Pixi, no
 * `mwg`).
 *
 * Java's own key strings are reused verbatim (`music`, `soundfx`, `zoom` -
 * `SPDSettings.KEY_MUSIC`/`KEY_SOUND_FX`/`KEY_ZOOM`, tag `v3.3.8`), and the stored shapes
 * match Java's: enabled flags persist as `'true'`/`'false'` (Java's `put(key, boolean)`,
 * read back default-enabled like `getBoolean(KEY_MUSIC, true)`), and zoom persists as the
 * integer offset Java's `zoom(int)` writes (default `0`, applied at
 * `GameScene.create()` as `gate(minZoom, defaultZoom + zoom(), maxZoom)`).
 *
 * Deliberate simplifications, all recorded in `PORT_COVERAGE.md`:
 * - Java's zoom gate is screen-derived (`PixelScene`'s own `minZoom`/`maxZoom` around a
 *   density-derived `defaultZoom`); this port's camera has one fixed base zoom, so the
 *   offset is gated to a fixed `[-2, +3]` instead.
 * - `visualGrid`, `cameraFollow` and `vibration` persist with Java's keys/defaults/gates
 *   but have no behavior yet (no grid seam, construction-only camera deadzone, no
 *   long-press seam) - the verifier pins the round-trip, not the effect.
 */

export interface SettingsStore {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

/** `SPDSettings.KEY_MUSIC` - persists the *enabled* flag, default on. */
export const MUSIC_KEY = 'music';
/** `SPDSettings.KEY_SOUND_FX` - persists the *enabled* flag, default on. */
export const SFX_KEY = 'soundfx';
/** `SPDSettings.KEY_ZOOM` - persists the integer zoom offset, default 0. */
export const ZOOM_KEY = 'zoom';
/** `SPDSettings.KEY_MUSIC_VOL` - 0-10 music volume, default 10, applied quadratically. */
export const MUSIC_VOL_KEY = 'music_vol';
/** `SPDSettings.KEY_SFX_VOL` - 0-10 sound volume, default 10, applied quadratically. */
export const SFX_VOL_KEY = 'sfx_vol';
/** `SPDSettings.KEY_BRIGHTNESS` - fog shade -1/0/+1, default 0. */
export const BRIGHTNESS_KEY = 'brightness';
/** `SPDSettings.KEY_GRID` - visual grid -1/0/1/2, default 0 (currently model-only). */
export const GRID_KEY = 'visual_grid';
/** `SPDSettings.KEY_CAMERA_FOLLOW` - follow tightness 1-4, default 4 (model-only). */
export const CAMERA_FOLLOW_KEY = 'camera_follow';
/** `SPDSettings.KEY_SCREEN_SHAKE` - shake magnitude 0-4, default 2. */
export const SCREEN_SHAKE_KEY = 'screen_shake';
/** `SPDSettings.KEY_MUSIC_BG` - music keeps playing while hidden, default on. */
export const MUSIC_BG_KEY = 'music_bg';
/** `SPDSettings.KEY_VIBRATION` - long-press haptics, default on (model-only: no seam). */
export const VIBRATION_KEY = 'vibration';

/** The port's `new Camera({ zoom: 3 })` base - Java's `defaultZoom` is screen-derived,
 * this port's is one fixed value, so the offset gate below is fixed too. */
export const BASE_ZOOM = 3;
/** Fixed offset gate standing in for Java's screen-derived `minZoom`/`maxZoom`. */
export const MIN_ZOOM_OFFSET = -2;
export const MAX_ZOOM_OFFSET = 3;

function memoryStore(): SettingsStore {
	const values = new Map<string, string>();
	return {
		getItem: (key) => (values.has(key) ? values.get(key)! : null),
		setItem: (key, value) => { values.set(key, value); },
	};
}

function browserStore(): SettingsStore {
	try {
		const storage = localStorage;
		return {
			getItem: (key) => {
				try {
					return storage.getItem(key);
				} catch {
					return null;
				}
			},
			setItem: (key, value) => {
				try {
					storage.setItem(key, value);
				} catch {
					//a browser with storage blocked keeps the choice for this session only
				}
			},
		};
	} catch {
		return memoryStore();
	}
}

let store: SettingsStore | null = null;

/** The live store - `localStorage` guarded like the language key, memory-backed where
 * storage is missing (node) or blocked. Tests replace it via `setSettingsStore`. */
export function settingsStore(): SettingsStore {
	if (!store) store = browserStore();
	return store;
}

export function setSettingsStore(next: SettingsStore): void {
	store = next;
}

/** `SPDSettings.music()` negated: true while Java's flag is stored `'false'`. Missing or
 * foreign values read enabled, matching Java's `getBoolean(KEY_MUSIC, true)` default. */
export function isMusicMuted(): boolean {
	return settingsStore().getItem(MUSIC_KEY) === 'false';
}

export function setMusicMuted(muted: boolean): void {
	settingsStore().setItem(MUSIC_KEY, muted ? 'false' : 'true');
}

/** `SPDSettings.soundFx()` negated, same shape and default as music above. */
export function isSfxMuted(): boolean {
	return settingsStore().getItem(SFX_KEY) === 'false';
}

export function setSfxMuted(muted: boolean): void {
	settingsStore().setItem(SFX_KEY, muted ? 'false' : 'true');
}

function gateOffset(offset: number): number {
	if (!Number.isFinite(offset)) return 0;
	return Math.min(MAX_ZOOM_OFFSET, Math.max(MIN_ZOOM_OFFSET, Math.trunc(offset)));
}

/** `SPDSettings.zoom()` - the integer offset, default 0, gated to the fixed range so a
 * foreign stored value can never push the camera outside it. */
export function zoomOffset(): number {
	const raw = settingsStore().getItem(ZOOM_KEY);
	if (raw === null) return 0;
	return gateOffset(Number.parseInt(raw, 10));
}

/** The camera zoom for an offset - Java's `defaultZoom + zoom()` with this port's fixed
 * base standing in for Java's screen-derived default. */
export function zoomForOffset(offset: number): number {
	return BASE_ZOOM + gateOffset(offset);
}

type ZoomListener = (offset: number) => void;

const zoomListeners = new Set<ZoomListener>();

/**
 * Persists the zoom offset and notifies subscribers (the dungeon scene applies it to its
 * camera live, so a settings change mid-run takes effect without a scene rebuild).
 * Returns an unsubscribe function, matching the scene's `onDestroy` cleanup shape.
 */
export function setZoomOffset(offset: number): void {
	const gated = gateOffset(offset);
	settingsStore().setItem(ZOOM_KEY, String(gated));
	zoomListeners.forEach((listener) => listener(gated));
}

export function onZoomChanged(listener: ZoomListener): () => void {
	zoomListeners.add(listener);
	return () => { zoomListeners.delete(listener); };
}

function gateInt(raw: string | null, def: number, min: number, max: number): number {
	if (raw === null) return def;
	const parsed = Number.parseInt(raw, 10);
	if (!Number.isFinite(parsed)) return def;
	return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

function gateVolume(raw: string | null): number {
	return gateInt(raw, 10, 0, 10);
}

/** `SPDSettings.musicVol()` - 0-10, default 10. */
export function musicVolume(): number {
	return gateVolume(settingsStore().getItem(MUSIC_VOL_KEY));
}

export function setMusicVolume(volume: number): void {
	settingsStore().setItem(MUSIC_VOL_KEY, String(gateVolume(String(volume))));
}

/** `SPDSettings.SFXVol()` - 0-10, default 10. */
export function sfxVolume(): number {
	return gateVolume(settingsStore().getItem(SFX_VOL_KEY));
}

export function setSfxVolume(volume: number): void {
	settingsStore().setItem(SFX_VOL_KEY, String(gateVolume(String(volume))));
}

/**
 * Java's quadratic volume curve (`Music.INSTANCE.volume(value*value/100f)`): 10 is full,
 * 5 is a quarter, 0 is silent. Applied over this port's own base volumes, so 10 keeps
 * today's levels exactly.
 */
export function volumeCurve(volume: number): number {
	const gated = Math.min(10, Math.max(0, volume));
	return (gated * gated) / 100;
}

/** `SPDSettings.brightness()` - fog shade, default 0, gated -1..1. */
export function brightness(): number {
	return gateInt(settingsStore().getItem(BRIGHTNESS_KEY), 0, -1, 1);
}

export function setBrightness(value: number): void {
	const gated = gateInt(String(value), 0, -1, 1);
	settingsStore().setItem(BRIGHTNESS_KEY, String(gated));
	brightnessListeners.forEach((listener) => listener(gated));
}

type BrightnessListener = (value: number) => void;

const brightnessListeners = new Set<BrightnessListener>();

/** Mirrors `onZoomChanged`: the scene re-renders fog live when the shade changes. */
export function onBrightnessChanged(listener: BrightnessListener): () => void {
	brightnessListeners.add(listener);
	return () => { brightnessListeners.delete(listener); };
}

/**
 * The explored-shade alpha for a brightness level: Java's `FogOfWar.FOG_COLORS` visited
 * row is `0xCC/0x99/0x55` black for -1/0/+1 (and the mapped-blue row carries the same
 * alphas over `0x112244/0x193366/0x224488`). This port's fog stores premultiplied-bytes
 * colors, so the level selects the alpha; 0 keeps today's 153.
 */
export function brightnessFogAlpha(value: number): number {
	if (value <= -1) return 204;
	if (value >= 1) return 85;
	return 153;
}

/** `SPDSettings.visualGrid()` - default 0, gated -1..2. No grid seam exists yet, so this
 * is persistence only: the value round-trips and the verifier pins it. */
export function visualGrid(): number {
	return gateInt(settingsStore().getItem(GRID_KEY), 0, -1, 2);
}

export function setVisualGrid(value: number): void {
	settingsStore().setItem(GRID_KEY, String(gateInt(String(value), 0, -1, 2)));
}

/** `SPDSettings.cameraFollow()` - default 4, gated 1..4. The mwg camera takes its
 * deadzone at construction only, so this is persistence only for now. */
export function cameraFollow(): number {
	return gateInt(settingsStore().getItem(CAMERA_FOLLOW_KEY), 4, 1, 4);
}

export function setCameraFollow(value: number): void {
	settingsStore().setItem(CAMERA_FOLLOW_KEY, String(gateInt(String(value), 4, 1, 4)));
}

/** `SPDSettings.screenShake()` - default 2, gated 0..4. 0 disables shake outright. */
export function screenShake(): number {
	return gateInt(settingsStore().getItem(SCREEN_SHAKE_KEY), 2, 0, 4);
}

export function setScreenShake(value: number): void {
	settingsStore().setItem(SCREEN_SHAKE_KEY, String(gateInt(String(value), 2, 0, 4)));
}

/** `SPDSettings.playMusicInBackground()` - default on. While off, hiding the page also
 * suspends the music (sound effects always suspend - only music has the background pass). */
export function playMusicInBackground(): boolean {
	return settingsStore().getItem(MUSIC_BG_KEY) !== 'false';
}

export function setPlayMusicInBackground(enabled: boolean): void {
	settingsStore().setItem(MUSIC_BG_KEY, enabled ? 'true' : 'false');
}

/** `SPDSettings.vibration()` - default on. Java vibrates on button *long*-press only, and
 * no long-press seam exists here, so this is persistence only for now. */
export function vibration(): boolean {
	return settingsStore().getItem(VIBRATION_KEY) !== 'false';
}

export function setVibration(enabled: boolean): void {
	settingsStore().setItem(VIBRATION_KEY, enabled ? 'true' : 'false');
}
