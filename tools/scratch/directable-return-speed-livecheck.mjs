// Throwaway (tools/scratch): live-verify the 2x return speed shared by LightAlly, ShadowAlly and GhostHero when uncommanded and far from the hero.
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
	hero.hp = hero.maxHp = 50;
	s['creatures'].splice(0, s['creatures'].length, hero);
	let row = null;
	for (let y = 2; y < s['level'].height - 2 && !row; y++) for (let x = 5; x < s['level'].width - 5 && !row; x++) {
		if (Array.from({ length: 6 }, (_, k) => s['level'].passable(x - 5 + k, y)).every(Boolean)) row = { x, y };
	}
	hero.x = row.x; hero.y = row.y;
	s['fov'].update(hero.x, hero.y, 20);
	const check = (allyKind, spawnKind) => {
		s['creatures'].splice(0, s['creatures'].length, hero);
		s['spawnMonster'](spawnKind, { x: row.x - 4, y: row.y }, false, undefined, true, allyKind, false, undefined, 0);
		const ally = s['creatures'].find((c) => c.allyKind === allyKind);
		ally.hp = ally.maxHp = 80; ally.buffs = {};
		if (allyKind === 'lightAlly') ally.buffs.powerOfMany = 100;
		ally.allyDefendCell = undefined; ally.allyTargetChar = undefined;
		const before = ally.x;
		s['pendingMonsterTurnCost'] = null;
		s['takeAllyTurn'](ally);
		return { movedBy: ally.x - before, turnCost: s['pendingMonsterTurnCost'] };
	};
	out.lightAlly = check('lightAlly', 'rat');
	out.shadowClone = check('shadowClone', 'rat');
	out.ghost = check('ghost', 'rat');
	// a mirror image (an ordinary ally, no directable speed rider) gets none of this
	out.mirror = check('mirror', 'rat');
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
