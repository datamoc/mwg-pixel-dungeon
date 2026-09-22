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
		assert.equal(buffIconText('wellFed', 449), '450');
		assert.equal(buffIconText('frost', 9), '10');
		assert.equal(buffIconText('blindness', 9), '10');
		assert.equal(buffIconText('featherFall', 49), '50');
		assert.equal(buffIconText('drowsy', 4), '5');
		assert.equal(buffIconText('amok', 4), '5');
		assert.equal(buffIconText('terror', 19), '20');
		assert.equal(buffIconText('magicalSleep', 5), null);
		assert.equal(buffIconText('mindvision', 19), '20');
		assert.equal(buffIconText('frostImbue', 14), '15');
		assert.equal(buffIconText('fireImbue', 14), '14');
		assert.equal(buffIconText('toxicImbue', 14), '14');
		assert.equal(buffIconText('blobImmunity', 9), '10');
		assert.equal(buffIconText('aggression', 19), '20');
		assert.equal(buffIconText('wayward', 9), '10');
		for (const id of ['charm', 'recharging', 'haste']) assert.equal(buffIconText(id, 4), '5');
	});

	check('the cleric trackers show the standard flavour countdown', () => {
		//ShieldOfLightTracker, DivineSenseTracker and UsedItemTracker are FlavourBuffs
		//with no iconTextDisplay() override (tag v3.3.8).
		assert.equal(buffIconText('shieldOfLight', 4), '5');
		assert.equal(buffIconText('divineSense', 50), '51');
		assert.equal(buffIconText('recallUsed', 10), '11');
		assert.equal(buffIconText('recallUsed', 300), '301');
		//PotionOfCleansing.Cleanse is the same shape (a FlavourBuff, DURATION 5).
		assert.equal(buffIconText('cleanseImmunity', 4), '5');
		assert.equal(buffIconText('cleanseImmunity', 0), '1');
		assert.equal(buffIconTextColor('cleanseImmunity'), 0x00ff00);
	});

	check('the recall fade reads the rank-appropriate duration (10 or 300)', () => {
		approx(buffIconFade('recallUsed', 10), 0);
		approx(buffIconFade('recallUsed', 5), 4 / 10);
		approx(buffIconFade('recallUsed', 300), 0);
		approx(buffIconFade('recallUsed', 150), 149 / 300);
		assert.equal(buffIconFade('divineSense', 50), 0);
		assert.equal(buffIconFade('shieldOfLight', 4), 0);
		approx(buffIconFade('cleanseImmunity', 4), 0);
		approx(buffIconFade('cleanseImmunity', 2), 2 / 5);
		approx(buffIconFade('wellFed', 450), 0);
		approx(buffIconFade('wellFed', 225), 0.5);
	});

	check('burning, ooze and poison show their own counter with no plus-one', () => {
		assert.equal(buffIconText('burning', 8), '8');
		assert.equal(buffIconText('burning', 1), '1');
		assert.equal(buffIconText('bleeding', 4.4), '4');
		assert.equal(buffIconText('bleeding', 4.6), '5');
		assert.equal(buffIconText('ooze', 20), '20');
		assert.equal(buffIconText('poison', 6), '6');
	});

	check('fury, cloak, focus, berserk and hunger show no text', () => {
		for (const id of ['fury', 'cloak', 'focus', 'berserk', 'hungry', 'starving']) {
			assert.equal(buffIconText(id, 5), null);
		}
		assert.equal(buffIconText('wellFed', 5), '6');
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
		approx(buffIconFade('frost', 5), 4 / 10);
		approx(buffIconFade('blindness', 5), 4 / 10);
		approx(buffIconFade('featherFall', 25), 24 / 50);
		approx(buffIconFade('drowsy', 2), 2 / 5);
		approx(buffIconFade('terror', 10), 9 / 20);
		assert.equal(buffIconFade('amok', 4), 0);
		assert.equal(buffIconFade('aggression', 19), 0);
		approx(buffIconFade('wayward', 5), 4 / 10);
		assert.equal(buffIconFade('magicalSleep', 5), 0);
		approx(buffIconFade('mindvision', 10), 9 / 20);
		approx(buffIconFade('frostImbue', 7), 7 / 15);
		approx(buffIconFade('fireImbue', 7), 8 / 15);
		approx(buffIconFade('toxicImbue', 7), 8 / 15);
		approx(buffIconFade('blobImmunity', 5), 4 / 10);
		assert.equal(buffIconFade('bleeding', 4), 0);
		for (const id of ['fury', 'cloak', 'focus', 'berserk', 'hungry', 'starving']) {
			assert.equal(buffIconFade(id, 5), 0);
		}
		approx(buffIconFade('charm', 4), 5 / 10);
		approx(buffIconFade('recharging', 4), 25 / 30);
		approx(buffIconFade('haste', 4), 15 / 20);
		assert.equal(buffIconFade('bless', undefined), 0);
	});

	console.log(`\nAll ${passed} buff-overlay checks passed.`);
} catch (error) {
	console.error(`FAIL after ${passed} passed:`, error);
	process.exit(1);
}
