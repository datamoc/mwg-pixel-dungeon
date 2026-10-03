// Throwaway (tools/scratch): the fire model, live - does standing in fire keep a full burn armed?
//
// Java's `Fire.burn(pos)` runs for every burning cell every turn and does
// `Buff.affect(ch, Burning.class).reignite(ch)` - a *prolong* to `Burning.DURATION` (8), not a
// one-shot grant. This port granted the buff once and never refreshed it, with a table duration of
// 3, so fire was a short single burn however long the target stood in it. The check drives the
// scene's own `spreadFire()` tick (the port's `Fire.evolve()`) and reads the hero's buff map:
//
//   - igniting sets Java's 8, and a second tick still inside the fire keeps it at 8;
//   - stepping out leaves the whole clock running (the burn follows you, as it does in Java);
//   - `MagicalFireRoom`'s eternal wall fire is one of the three Java sites with its own duration,
//     so it arms 4 instead of 8;
//   - and the hero really loses HP to it.
//
// Run after `npm run build`:  node tools/scratch/fire-model-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=fire-livecheck', { waitUntil: 'load', timeout: 120000 });
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

const result = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const hero = s['hero'];
	const cell = s['level'].index(hero.x, hero.y);
	// `Blob.fromJSON` is how the scene itself rebuilds a blob; the fire field is `this.fire`
	const seedFire = (blob, volume) => {
		const volume2 = blob.toJSON().volume.slice();
		volume2[cell] = volume;
		return { blob, json: { width: s['level'].width, height: s['level'].height, volume: volume2 } };
	};
	const setBlob = (name, volume) => {
		const { blob, json } = seedFire(s[name], volume);
		const next = blob.constructor.fromJSON(json);
		s[name] = next;
		return next;
	};

	// ---- regular fire: ignite, then stay in it for a second tick
	s['fire'] = setBlob('fire', 4);
	const hpBefore = hero.hp;
	s['spreadFire']();
	const ignited = { burning: hero.buffs['burning'], burningDuration: s['hero'].buffs['burning'], hp: hero.hp };
	// the tick above decays the fire by one (volume 4 -> 3) and re-arms the burn under the hero
	s['fire'] = setBlob('fire', 4);
	s['spreadFire']();
	const sustained = { burning: hero.buffs['burning'] };
	// a third tick with the cell still burning, but the buff was set lower by hand, as if the
	// hero had nearly finished burning: Java's prolong raises it back to the full duration
	s['fire'] = setBlob('fire', 4);
	hero.buffs['burning'] = 2;
	s['spreadFire']();
	const raised = { burning: hero.buffs['burning'] };
	// ---- out of the fire: the clock keeps running rather than vanishing with the flames, and the
	// burn does its damage - both of which happen in the hero's own turn pipeline, not in the fire
	// tick, so this part drives real turns (the `wait` action) rather than `spreadFire()`
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	s['fire'] = setBlob('fire', 0);
	hero.buffs = { burning: 8 };
	const hpBeforeTurns = hero.hp;
	s['onAction']('wait');
	await sleep(1200);
	const afterLeaving = { burning: hero.buffs['burning'], hp: hero.hp };
	s['onAction']('wait');
	await sleep(1200);
	const twoTurns = { burning: hero.buffs['burning'], hp: hero.hp };
	// ---- the eternal wall fire carries Java's own 4, not the class default
	hero.buffs = {};
	s['eternalFire'] = setBlob('eternalFire', 4);
	s['spreadFire']();
	const eternal = { burning: hero.buffs['burning'] };
	delete hero.buffs['burning'];
	s['eternalFire'] = setBlob('eternalFire', 0);
	const hpAfter = hpBeforeTurns;

	return { ignited, sustained, raised, afterLeaving, twoTurns, eternal, hpBefore, hpAfter, depth: s['depth'] };
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['standing in fire ignites for Java\'s own `Burning.DURATION` (8)', result.ignited.burning === 8],
	['and a second turn in the flames keeps the full burn armed', result.sustained.burning === 8],
	['a nearly-spent burn is raised back to full rather than left alone (`reignite` is a prolong)',
		result.raised.burning === 8],
	['the burn survives leaving the fire, counting down one turn at a time instead of being cleared',
		result.afterLeaving.burning === 7 && result.twoTurns.burning === 6],
	['and it deals its damage on each of those turns',
		result.afterLeaving.hp < result.hpBefore && result.twoTurns.hp < result.afterLeaving.hp],
	['the eternal wall fire arms its own 4 (`MagicalFireRoom.EternalFire.evolve`)', result.eternal.burning === 4],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`fire model livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
