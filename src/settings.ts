/**
 * `SPDSettings`' persisted audio/display half, ported as plain functions over an injected
 * string store so the whole thing stays testable in node (`tools/verifyDisplaySettings.mjs`
 * transpiles this file alone - no DOM, no Pixi, no `mwg`).
 *
 * Java's own key strings are reused verbatim (`music`, `soundfx`, `zoom` -
 * `SPDSettings.KEY_MUSIC`/`KEY_SOUND_FX`/`KEY_ZOOM`, tag `v3.3.8`), and the stored shapes
 * match Java's: enabled flags persist as `'true'`/`'false'` (Java's `put(key, boolean)`,
 * read back default-enabled like `getBoolean(KEY_MUSIC, true)`), and zoom persists as the
 * integer offset Java's `zoom(int)` writes (default `0`, applied at
 * `GameScene.create()` as `gate(minZoom, defaultZoom + zoom(), maxZoom)`).
 *
 * Two deliberate simplifications, both recorded in `PORT_COVERAGE.md`:
 * - Java's 0-10 volume sliders (`musicVol`/`SFXVol`, applied quadratically as
 *   `value*value/100`) have no expression here - `mwg`'s `Music`/`Sound` take linear
 *   volumes and this port plays at fixed ones. Muting is the only persisted audio
 *   control.
 * - Java's zoom gate is screen-derived (`PixelScene`'s own `minZoom`/`maxZoom` around a
 *   density-derived `defaultZoom`); this port's camera has one fixed base zoom, so the
 *   offset is gated to a fixed `[-2, +3]` instead.
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
