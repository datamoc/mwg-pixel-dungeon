// Throwaway (tools/scratch): live-verify DirectableAlly.Hunting's give-up-the-spontaneous-chase override -
// a defend-ordered ally paths back to its post instead of chasing a spontaneously-seen hostile it can't reach.
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const executablePath = path.join(process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local', 'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe');
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('console.error:', m.text()); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=allyorders', { waitUntil: 'load', timeout: 120000 });
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
	const out = {};
	// a long, straight open corridor: defend post 5 west, hostile 5 east, ally starts adjacent to hero
	let row = null;
	for (let y = 2; y < s['level'].height - 2 && !row; y++) for (let x = 5; x < s['level'].width - 5 && !row; x++) {
		if (Array.from({ length: 10 }, (_, k) => s['level'].passable(x - 5 + k, y)).every(Boolean)) row = { x, y };
	}
	hero.x = row.x; hero.y = row.y;
	s['fov'].update(hero.x, hero.y, 20);
	s['creatures'].splice(0, s['creatures'].length, hero);
	s['spawnMonster']('rat', { x: row.x + 1, y: row.y }, false, undefined, true, 'mirror', false, undefined, 0);
	const ally = s['creatures'].find((c) => c.allyKind === 'mirror');
	ally.hp = ally.maxHp = 50;
	const defend = { x: row.x - 4, y: row.y };
	ally.allyDefendCell = defend;
	ally.allyTargetChar = undefined;
	s['spawnMonster']('gnoll', { x: row.x + 4, y: row.y }, false, undefined, false, undefined, false, undefined);
	const hostile = s['creatures'].find((c) => c.kind === 'gnoll');
	hostile.hp = hostile.maxHp = 50; hostile.sleeping = false; hostile.seesHero = true;
	out.before = { ally: { x: ally.x, y: ally.y }, hostile: { x: hostile.x, y: hostile.y }, defend };
	s['takeAllyTurn'](ally);
	out.after = { x: ally.x, y: ally.y };
	out.movedTowardDefend = ally.x < out.before.ally.x;
	out.movedTowardHostile = ally.x > out.before.ally.x;
	// control: no defend order -> chases the spontaneous hostile normally
	ally.x = row.x + 1; ally.y = row.y;
	ally.allyDefendCell = undefined;
	s['takeAllyTurn'](ally);
	out.controlMovedTowardHostile = ally.x > row.x + 1;
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
