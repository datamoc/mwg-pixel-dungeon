import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// `ui/Banner.java`'s FADE_IN/STATIC/FADE_OUT timing, proved against `src/ui/bannerState.ts`
// (the pure translation `ui/banner.ts` drives). Same house pattern as verifySimulation.mjs:
// compile the actual implementation into a private temporary CommonJS tree - this module has
// no imports at all, so the test never loads Pixi, a DOM, or the framework.
const output = mkdtempSync(join(tmpdir(), 'spd-banner-'));
let passed = 0;
function check(name, run) {
	run();
	passed++;
	console.log(`PASS ${name}`);
}

const here = new URL('.', import.meta.url);
{
	const file = join(output, 'bannerState.js');
	mkdirSync(output, { recursive: true });
	writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
	writeFileSync(file, ts.transpileModule(readFileSync(new URL('../src/ui/bannerState.ts', import.meta.url), 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
	}).outputText);
}
const require = createRequire(join(output, 'package.json'));
const { showBannerState, stepBannerState } = require('./bannerState.js');

const approx = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `expected ${expected}, got ${actual}`);

try {
	check('show arms FADE_IN with the fade time', () => {
		const state = showBannerState(0.3, 5);
		assert.equal(state.phase, 'fadeIn');
		assert.equal(state.timeLeft, 0.3);
	});

	check('FADE_IN tints toward the color while alpha runs 0 to 1', () => {
		// Binary-exact steps (0.125 divides 0.5), so the boundary frame lands exactly on
		// zero - the same `>= 0` endpoint the next check asserts deliberately.
		let state = showBannerState(0.5, 5);
		let previousAlpha = 0;
		for (let step = 0; step < 4; step++) {
			const frame = stepBannerState(state, 0.125, 0.5);
			assert.equal(frame.dead, false);
			assert.equal(frame.state.phase, 'fadeIn');
			approx(frame.alpha, (step + 1) / 4);
			approx(frame.tint, 1 - (step + 1) / 4);
			assert.ok(frame.alpha >= previousAlpha);
			previousAlpha = frame.alpha;
			state = frame.state;
		}
	});

	check('the exact zero boundary still belongs to the outgoing phase', () => {
		// Java tests `time >= 0`, so a step landing exactly on zero reports the phase's own
		// endpoint (fully opaque, tint gone) rather than advancing early.
		const frame = stepBannerState(showBannerState(0.3, 5), 0.3, 0.3);
		assert.equal(frame.state.phase, 'fadeIn');
		approx(frame.alpha, 1);
		approx(frame.tint, 0);
	});

	check('a spent FADE_IN hands STATIC the full hold and resets the tint', () => {
		const frame = stepBannerState(showBannerState(0.3, 5), 0.31, 0.3);
		assert.equal(frame.state.phase, 'static');
		assert.equal(frame.state.timeLeft, 5);
		assert.equal(frame.alpha, null);
		assert.equal(frame.tint, 'reset');
	});

	check('STATIC holds alpha for the whole show time, then hands FADE_OUT the fade time', () => {
		let state = stepBannerState(showBannerState(0.3, 5), 0.31, 0.3).state;
		for (let elapsed = 0; elapsed < 5; elapsed += 0.5) {
			const frame = stepBannerState(state, 0.5, 0.3);
			assert.equal(frame.dead, false);
			assert.equal(frame.alpha, null);
			assert.equal(frame.tint, 'reset');
			state = frame.state;
		}
		assert.equal(state.phase, 'static');
		const handover = stepBannerState(state, 0.01, 0.3);
		assert.equal(handover.state.phase, 'fadeOut');
		assert.equal(handover.state.timeLeft, 0.3);
	});

	check('FADE_OUT resets the tint while alpha runs 1 to 0, then dies', () => {
		let state = { phase: 'fadeOut', timeLeft: 0.5, showTime: 5 };
		for (let step = 0; step < 4; step++) {
			const frame = stepBannerState(state, 0.125, 0.5);
			assert.equal(frame.dead, false);
			assert.equal(frame.tint, 'reset');
			approx(frame.alpha, 1 - (step + 1) / 4);
			state = frame.state;
		}
		const last = stepBannerState(state, 0.01, 0.5);
		assert.equal(last.dead, true);
	});

	check('the two-argument show never leaves STATIC', () => {
		let state = showBannerState(2);
		state = stepBannerState(state, 2.01, 2).state;
		assert.equal(state.phase, 'static');
		for (let elapsed = 0; elapsed < 1000; elapsed += 7) {
			const frame = stepBannerState(state, 7, 2);
			assert.equal(frame.dead, false);
			assert.equal(frame.state.phase, 'static');
			state = frame.state;
		}
	});

	console.log(`${passed} banner checks passed.`);
} catch (error) {
	console.error(error);
	process.exit(1);
}
