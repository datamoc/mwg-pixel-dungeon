import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// `SPDSettings`' persisted audio/display/UI half (`src/settings.ts`), proved against the
// Java source it was transcribed from: the `music`/`soundfx`/`zoom`/`music_vol`/
// `sfx_vol`/`brightness`/`screen_shake`/`music_bg`/`vibration`/`visual_grid`/
// `camera_follow` key strings, the enabled defaults, the fixed zoom gate standing in for Java's
// screen-derived min/max, the 0-10 volume curve, the brightness fog alphas, and the
// subscriber fan-out the dungeon camera and fog rely on. Same house pattern as
// `verifyVault.mjs`: compile the real module into a private CommonJS tree (this one has no
// imports at all, so no shims) so this needs no DOM, Pixi or `mwg`.
const output = mkdtempSync(join(tmpdir(), 'spd-settings-'));
let passed = 0;
function check(name, run) {
	run();
	passed++;
	console.log(`PASS ${name}`);
}

try {
	writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
	const compiled = join(output, 'settings.js');
	mkdirSync(dirname(compiled), { recursive: true });
	writeFileSync(compiled, ts.transpileModule(readFileSync(new URL('../src/settings.ts', import.meta.url), 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
	}).outputText);
	const require = createRequire(join(output, 'tests.cjs'));
	const settings = require('./settings.js');

	/** An isolated store per check, standing in for `localStorage`. */
	const freshStore = () => {
		const values = new Map();
		return {
			getItem: (key) => (values.has(key) ? values.get(key) : null),
			setItem: (key, value) => { values.set(key, value); },
			dump: () => new Map(values),
		};
	};

	check('audio defaults to enabled, zoom to 0', () => {
		settings.setSettingsStore(freshStore());
		assert.equal(settings.isMusicMuted(), false);
		assert.equal(settings.isSfxMuted(), false);
		assert.equal(settings.zoomOffset(), 0);
	});

	check('stored false mutes, anything else stays enabled', () => {
		const store = freshStore();
		settings.setSettingsStore(store);
		store.setItem('music', 'false');
		store.setItem('soundfx', 'false');
		assert.equal(settings.isMusicMuted(), true);
		assert.equal(settings.isSfxMuted(), true);
		store.setItem('music', 'true');
		store.setItem('soundfx', 'yes-please');
		assert.equal(settings.isMusicMuted(), false);
		assert.equal(settings.isSfxMuted(), false);
	});

	check('setters persist Java-shaped enabled strings', () => {
		const store = freshStore();
		settings.setSettingsStore(store);
		settings.setMusicMuted(true);
		settings.setSfxMuted(true);
		assert.equal(store.dump().get('music'), 'false');
		assert.equal(store.dump().get('soundfx'), 'false');
		assert.equal(settings.isMusicMuted(), true);
		assert.equal(settings.isSfxMuted(), true);
		settings.setMusicMuted(false);
		settings.setSfxMuted(false);
		assert.equal(store.dump().get('music'), 'true');
		assert.equal(store.dump().get('soundfx'), 'true');
	});

	check('zoom offset defaults, gates and truncates', () => {
		const store = freshStore();
		settings.setSettingsStore(store);
		assert.equal(settings.zoomOffset(), 0);
		settings.setZoomOffset(99);
		assert.equal(settings.zoomOffset(), 3);
		settings.setZoomOffset(-99);
		assert.equal(settings.zoomOffset(), -2);
		settings.setZoomOffset(2.9);
		assert.equal(settings.zoomOffset(), 2);
		store.setItem('zoom', 'banana');
		assert.equal(settings.zoomOffset(), 0);
		store.setItem('zoom', '12');
		assert.equal(settings.zoomOffset(), 3);
	});

	check('zoomForOffset maps the offset onto the fixed base zoom', () => {
		assert.equal(settings.BASE_ZOOM, 3);
		assert.equal(settings.zoomForOffset(-2), 1);
		assert.equal(settings.zoomForOffset(0), 3);
		assert.equal(settings.zoomForOffset(3), 6);
		assert.equal(settings.zoomForOffset(99), 6);
		assert.equal(settings.zoomForOffset(-99), 1);
	});

	check('zoom subscribers hear the gated value, unsubscribes go quiet', () => {
		settings.setSettingsStore(freshStore());
		const heard = [];
		const stop = settings.onZoomChanged((offset) => heard.push(offset));
		settings.setZoomOffset(2);
		settings.setZoomOffset(50);
		stop();
		settings.setZoomOffset(-1);
		assert.deepEqual(heard, [2, 3]);
	});

	check('volume sliders default to 10 and gate 0..10', () => {
		const store = freshStore();
		settings.setSettingsStore(store);
		assert.equal(settings.musicVolume(), 10);
		assert.equal(settings.sfxVolume(), 10);
		settings.setMusicVolume(99);
		settings.setSfxVolume(-99);
		assert.equal(settings.musicVolume(), 10);
		assert.equal(settings.sfxVolume(), 0);
		assert.equal(store.dump().get('music_vol'), '10');
		assert.equal(store.dump().get('sfx_vol'), '0');
		store.setItem('music_vol', 'banana');
		assert.equal(settings.musicVolume(), 10);
	});

	check('volume curve is quadratic: 0 silent, 10 full, 5 quarter', () => {
		assert.equal(settings.volumeCurve(0), 0);
		assert.equal(settings.volumeCurve(10), 1);
		assert.equal(settings.volumeCurve(5), 0.25);
	});

	check('brightness defaults to 0, gates -1..1, and selects the fog alpha', () => {
		const store = freshStore();
		settings.setSettingsStore(store);
		assert.equal(settings.brightness(), 0);
		settings.setBrightness(99);
		assert.equal(settings.brightness(), 1);
		settings.setBrightness(-99);
		assert.equal(settings.brightness(), -1);
		assert.equal(store.dump().get('brightness'), '-1');
		store.setItem('brightness', 'banana');
		assert.equal(settings.brightness(), 0);
		assert.equal(settings.brightnessFogAlpha(-1), 204);
		assert.equal(settings.brightnessFogAlpha(0), 153);
		assert.equal(settings.brightnessFogAlpha(1), 85);
	});

	check('brightness subscribers hear the gated value, unsubscribes go quiet', () => {
		settings.setSettingsStore(freshStore());
		const heard = [];
		const stop = settings.onBrightnessChanged((value) => heard.push(value));
		settings.setBrightness(1);
		settings.setBrightness(50);
		stop();
		settings.setBrightness(-1);
		assert.deepEqual(heard, [1, 1]);
	});

	check('screen shake defaults to 2 and gates 0..4', () => {
		const store = freshStore();
		settings.setSettingsStore(store);
		assert.equal(settings.screenShake(), 2);
		settings.setScreenShake(99);
		assert.equal(settings.screenShake(), 4);
		settings.setScreenShake(-1);
		assert.equal(settings.screenShake(), 0);
		assert.equal(store.dump().get('screen_shake'), '0');
	});

	check('background music and vibration default on, anything but false stays on', () => {
		const store = freshStore();
		settings.setSettingsStore(store);
		assert.equal(settings.playMusicInBackground(), true);
		assert.equal(settings.vibration(), true);
		settings.setPlayMusicInBackground(false);
		settings.setVibration(false);
		assert.equal(settings.playMusicInBackground(), false);
		assert.equal(settings.vibration(), false);
		assert.equal(store.dump().get('music_bg'), 'false');
		assert.equal(store.dump().get('vibration'), 'false');
		store.setItem('music_bg', 'yes-please');
		assert.equal(settings.playMusicInBackground(), true);
	});

	check('grid and camera-follow persist with Java defaults and gates', () => {
		const store = freshStore();
		settings.setSettingsStore(store);
		assert.equal(settings.visualGrid(), 0);
		assert.equal(settings.cameraFollow(), 4);
		settings.setVisualGrid(99);
		settings.setCameraFollow(99);
		assert.equal(settings.visualGrid(), 2);
		assert.equal(settings.cameraFollow(), 4);
		settings.setVisualGrid(-99);
		settings.setCameraFollow(-99);
		assert.equal(settings.visualGrid(), -1);
		assert.equal(settings.cameraFollow(), 1);
		assert.equal(store.dump().get('visual_grid'), '-1');
		assert.equal(store.dump().get('camera_follow'), '1');
	});

	console.log(`\nAll ${passed} display-settings checks passed.`);
} catch (error) {
	console.error(`FAIL after ${passed} passed:`, error);
	process.exit(1);
}
