// Throwaway (tools/scratch): the hero's animation now runs on the framework's `AnimatedSprite` and
// the shared `Tweener` walk tween, instead of the deleted port-local `HeroAnimation`.
//
// The clips are `HeroSprite`'s cloth-tier tables: idle `0,0,0,1,0,0,1,1` at 1 fps, run `2..7` at
// 20 fps, attack `13,14,15,0` at 15 fps once, and the death sequence `8,9,10,11,12,11` at 20 fps
// holding its last frame. The walk tween is `CharSprite.moveInterval`'s 0.1s, now the same code path
// the monsters use (`monsterMotion`), so this checks both that the hero's clips are registered and
// played and that its sprite actually interpolates between the two cells before settling.
//
// Run after `npm run build`:  node tools/scratch/hero-animation-livecheck.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));

const executablePath = path.join(
	process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local',
	'ms-playwright',
	'chromium-1193',
	'chrome-win',
	'chrome.exe'
);
const browser = await chromium.launch({
	executablePath,
	args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await context.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);

const tap = async (fx, fy) => {
	await page.evaluate(([x, y]) => {
		const c = document.querySelector('canvas');
		const r = c.getBoundingClientRect();
		const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + r.width * x, clientY: r.y + r.height * y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
		c.dispatchEvent(new PointerEvent('pointermove', opts));
		c.dispatchEvent(new PointerEvent('pointerdown', opts));
		c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
		c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
	}, [fx, fy]);
	await page.waitForTimeout(1200);
};
await tap(398 / 1024, 400 / 768);
await tap(62 / 1024, 261 / 768);
await tap(0.166, 0.921);
await page.waitForTimeout(5000);

// ---- the clips and the walk tween
const setup = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const hero = s.hero;
	const sprite = s['sprite'](hero);
	const clips = ['idle', 'run', 'attack', 'die'].map((name) => sprite.has(name));
	const free = (x, y) => s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y);
	const target = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: hero.x + dx, y: hero.y + dy })).find((c) => free(c.x, c.y));
	const before = { x: sprite.x, y: sprite.y, playing: sprite.playing };
	s['moveTo'](hero, target);
	const tweening = { x: sprite.x, y: sprite.y, playing: sprite.playing, motionTracked: s['monsterMotion'].has(sprite) };
	return { clips, before, target, tweening, tile: 16 };
});

// mid-tween: the sprite must sit strictly between the two cells at some point during the 0.1s.
// Sampled repeatedly rather than once, because each round trip to the page costs a frame or two -
// a single sample can land after the tween has already settled.
const samples = [];
for (let i = 0; i < 8; i++) {
	samples.push(await page.evaluate(() => {
		const s = window.__MWG__.currentScene;
		const sprite = s['sprite'](s.hero);
		return { x: sprite.x, y: sprite.y, playing: sprite.playing };
	}));
	await page.waitForTimeout(12);
}

// after the 0.1s tween: settled on the destination cell, back to the idle clip
await page.waitForTimeout(300);
const settled = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const sprite = s['sprite'](s.hero);
	return { x: sprite.x, y: sprite.y, playing: sprite.playing };
});

// ---- the attack clip, then the death clip holding its pose
const attack = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const hero = s.hero;
	const free = (x, y) => s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y);
	const cell = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: hero.x + dx, y: hero.y + dy })).find((c) => free(c.x, c.y));
	const mob = s.spawnMonster('rat', cell);
	mob.maxHp = mob.hp = 1000;
	s['attack'](hero, mob);
	const sprite = s['sprite'](hero);
	const playing = sprite.playing;
	mob.hp = 0;
	s.kill(mob);
	return { playing };
});

const death = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s['kill'](s.hero);
	const sprite = s['sprite'](s.hero);
	return { playing: sprite.playing, elapsed: sprite.elapsedTime };
});
await page.waitForTimeout(500);
const deathHeld = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const sprite = s['sprite'](s.hero);
	// the death clip is 6 frames at 20 fps (0.3s), so by now it must have finished and held
	return { playing: sprite.playing, finished: sprite.isFinished, alpha: sprite.alpha, visible: sprite.visible };
});

console.log('probe results:', JSON.stringify({ setup, samples, settled, attack, death, deathHeld }, null, 1));
const near = (a, b) => Math.abs(a - b) < 0.01;
const between = (value, a, b) => (value > Math.min(a, b) + 0.01 && value < Math.max(a, b) - 0.01);
const t = setup.tile;
const midBetween = samples.some((sample) => between(sample.x, setup.before.x, setup.target.x * t) || between(sample.y, setup.before.y, setup.target.y * t));
const expect = [
	['the hero sprite is the framework\'s animated sprite with all four clips', setup.clips.every(Boolean) === true],
	['it starts on the idle clip', setup.before.playing === 'idle'],
	['a step swaps it to the run clip and files a walk tween in the shared motion map',
		setup.tweening.playing === 'run' && setup.tweening.motionTracked === true],
	['mid-tween the sprite sits strictly between the two cells', midBetween],
	['and once the 0.1s is up it is exactly on the destination cell, idling',
		near(settled.x, setup.target.x * t) && near(settled.y, setup.target.y * t) && settled.playing === 'idle'],
	['attacking plays the attack clip', attack.playing === 'attack'],
	['dying plays the death clip', death.playing === 'die'],
	['and the dead hero holds its final pose rather than popping back to idle',
		deathHeld.playing === 'die' && deathHeld.finished === true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
