// Throwaway (tools/scratch): does an Unstable weapon really delegate to every one of Java's
// enchantments - Elastic included, which this port's delegate list was missing?
//
// `Unstable.proc()` is `Random.oneOf(randomEnchants).proc(...)`, and this port's list is authored MWL
// read by `Random.element`. The list is asserted against Java's array in the item suite; what that
// cannot show is that the delegated pick actually *reaches* each proc on a real swing. This drives
// the scene's own `attack()` with `weaponAffix = 'unstable'` and records `unstableDelegated` per
// swing, so both the list and the reachability are facts rather than readings of the code.
//
// Run after `npm run build`:  node tools/scratch/unstable-delegates-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=unstable-delegates', { waitUntil: 'load', timeout: 120000 });
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

const result = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const hero = s['hero'];
	const target = s['spawnMonster']('rat', { x: hero.x + 1, y: hero.y });
	target.hp = target.maxHp = 5000;   // survives the sample; each swing restores it anyway
	const at = { x: hero.x + 1, y: hero.y };
	const swings = 440;
	const counts = new Map();
	s['weaponAffix'] = 'unstable';
	for (let i = 0; i < swings; i++) {
		// Elastic's own proc shoves the target away, so put it back in reach before each swing -
		// the delegation draw is what this measures, not the chase
		target.x = at.x; target.y = at.y; target.hp = target.maxHp;
		s['attack'](hero, target);
		const delegated = s['unstableDelegated'];
		counts.set(delegated, (counts.get(delegated) ?? 0) + 1);
	}
	return { swings, counts: Object.fromEntries(counts), expected: s['UNSTABLE_DELEGATES'] ?? null };
});

// the scene keeps `UNSTABLE_DELEGATES` as a module import, not a field - read the list from the
// probe's own module graph instead by asserting the observed keys cover Java's eleven
const JAVA_LIST = ['blazing', 'blocking', 'blooming', 'chilling', 'kinetic', 'corrupting', 'elastic', 'grim', 'lucky', 'shocking', 'vampiric'];
console.log('probe results:', JSON.stringify(result, null, 1));
const observed = Object.keys(result.counts);
const missing = JAVA_LIST.filter((id) => !(id in result.counts));
const extra = observed.filter((id) => !JAVA_LIST.includes(id));
const expectedEach = result.swings / JAVA_LIST.length;
const elastic = result.counts['elastic'] ?? 0;
const expect = [
	['every one of Java\'s eleven delegates appeared on a real swing', missing.length === 0],
	['and nothing outside that list did', extra.length === 0],
	[`Elastic is one of them, at roughly its share (observed ${elastic} of an expected ~${Math.round(expectedEach)})`,
		elastic > 0 && Math.abs(elastic - expectedEach) < 4 * Math.sqrt(expectedEach)],
	['no swing left the delegation unset', !observed.includes('null') && !observed.includes('undefined')],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
if (missing.length) console.log(`missing: ${missing.join(', ')}`);
console.log(`unstable delegate livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
