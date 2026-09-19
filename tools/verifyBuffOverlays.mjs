import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// `BuffIndicator.BuffButton`'s icon overlays (`src/ui/buffOverlays.ts`), proved against the
// Java source each rule was transcribed from: `FlavourBuff.iconTextDisplay()`'s
// `(int)visualcooldown()` (+1) shape, `Burning`/`Ooze`/`Poison`'s own `(int)left`, the
// no-text buffs (`Fury`, cloak/`Shadows`, `Berserk`, Monk `Focus`, hunger), the
// POSITIVE/NEGATIVE text tint, and each `iconFadePercent()` branch (FlavourBuffs reading
// `visualcooldown()`, `Burning`/`Ooze` reading `left`, `Poison` fading nothing even in
// Java). Same house pattern as `verifyVault.mjs`: compile the real modules - the overlay
// module plus the buff duration tables it reads, all DOM/Pixi-free - into a private
// CommonJS tree so this needs no renderer.
const output = mkdtempSync(join(tmpdir(), 'spd-buffoverlays-'));
let passed = 0;
function check(name, run) {
	run();
	passed++;
	console.log(`PASS ${name}`);
}
function compile(source, destination) {
	const file = join(output, destination);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
	}).outputText);
}
const approx = (actual, expected) => {
	assert.ok(Math.abs(actual - expected) < 1e-9, `expected ${expected}, got ${actual}`);
};

try {
	writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
	for (const file of ['ui/buffOverlays', 'simulation/buffs', 'simulation/mwlBuffDurations', 'simulation/mwlMonsterImmunities']) {
		compile(new URL(`../src/${file}.ts`, import.meta.url), `${file}.js`);
	}
	const require = createRequire(join(output, 'tests.cjs'));
	const { buffIconText, buffIconTextColor, buffIconFade, BUFF_TEXT_POSITIVE, BUFF_TEXT_NEGATIVE } =
		require('./ui/buffOverlays');

	check('flavour buffs show remaining turns plus one', () => {
		//Java's `(int)visualcooldown()` with `visualcooldown() == cooldown() + 1`
		assert.equal(buffIconText('bless', 30), '31');
		assert.equal(buffIconText('bless', 1), '2');
		assert.equal(buffIconText('hex', 29), '30');
		assert.equal(buffIconText('paralysis', 3), '4');
		assert.equal(buffIconText('invulnerability', 3), '4');
		assert.equal(buffIconText('daze', 5), '6');
	});

	check('burning, ooze and poison show their own counter with no plus-one', () => {
		assert.equal(buffIconText('burning', 8), '8');
		assert.equal(buffIconText('burning', 1), '1');
		assert.equal(buffIconText('ooze', 20), '20');
		assert.equal(buffIconText('poison', 6), '6');
	});

	check('fury, cloak, focus, berserk and hunger show no text', () => {
		for (const id of ['fury', 'cloak', 'focus', 'berserk', 'hungry', 'starving']) {
			assert.equal(buffIconText(id, 5), null);
		}
		assert.equal(buffIconText('bless', undefined), null);
	});

	check('text tint follows the buff type', () => {
		assert.equal(BUFF_TEXT_POSITIVE, 0x00ff00);
		assert.equal(BUFF_TEXT_NEGATIVE, 0xff0000);
		assert.equal(buffIconTextColor('bless'), 0x00ff00);
		assert.equal(buffIconTextColor('burning'), 0xff0000);
		assert.equal(buffIconTextColor('poison'), 0xff0000);
		assert.equal(buffIconTextColor('hex'), 0xff0000);
	});

	check('fresh buffs carry no fade, expiring ones approach one', () => {
		assert.equal(buffIconFade('bless', 30), 0);
		approx(buffIconFade('bless', 15), 14 / 30);
		approx(buffIconFade('bless', 1), 28 / 30);
		assert.equal(buffIconFade('burning', 8), 0);
		approx(buffIconFade('burning', 4), 0.5);
		approx(buffIconFade('burning', 1), 7 / 8);
		assert.equal(buffIconFade('ooze', 20), 0);
		approx(buffIconFade('ooze', 10), 0.5);
	});

	check('poison, fury, cloak, hunger and unknowns fade nothing', () => {
		//`Poison` has no `iconFadePercent()` override even in Java - text only
		assert.equal(buffIconFade('poison', 6), 0);
		for (const id of ['fury', 'cloak', 'focus', 'berserk', 'hungry', 'starving', 'recharging']) {
			assert.equal(buffIconFade(id, 5), 0);
		}
		assert.equal(buffIconFade('bless', undefined), 0);
	});

	console.log(`\nAll ${passed} buff-overlay checks passed.`);
} catch (error) {
	console.error(`FAIL after ${passed} passed:`, error);
	process.exit(1);
}
