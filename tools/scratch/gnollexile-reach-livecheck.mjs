// Throwaway (tools/scratch): live-verify Trinity SpiritForm's Ring branch (state/expiry only -
// the ring-formula call sites themselves are a separate, larger slice, not yet wired).
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=trinity-ring', { waitUntil: 'load', timeout: 120000 });
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
	const out = {};
	const hero = s['hero'];
	const dir = [[2,0],[-2,0],[0,2],[0,-2]].find(([a,b]) => s['level'].passable(hero.x+a,hero.y+b) && s['level'].passable(hero.x+a/2,hero.y+b/2));
	const at = { x: hero.x + dir[0], y: hero.y + dir[1] };
	s['spawnMonster']('gnollExile', at, false, undefined, false, undefined, false, undefined);
	const mob = s['creatures'].find((c) => c.kind === 'gnollExile');
	mob.sleeping = false; mob.seesHero = true; mob.lastSeen = { x: hero.x, y: hero.y };
	const hp0 = hero.hp; let hit = false; const pos0 = { x: mob.x, y: mob.y };
	for (let i = 0; i < 40 && !hit; i++) { mob.x = at.x; mob.y = at.y; s['takeMonsterTurn'](mob); if (hero.hp < hp0) hit = true; }
	out.attackedFromTwo = hit; out.stayedAtRange = mob.x === at.x && mob.y === at.y;
	// blocked mid cell: no attack at range 2
	const mid = { x: hero.x + dir[0]/2, y: hero.y + dir[1]/2 };
	for (const [ox, oy] of (dir[0] !== 0 ? [[0,-1],[0,0],[0,1]] : [[-1,0],[0,0],[1,0]])) {
		const c = { x: mid.x + ox, y: mid.y + oy };
		if (s['level'].passable(c.x, c.y) && !s['creatureAt'](c.x, c.y)) s['spawnMonster']('rat', c, false, undefined, false, undefined, false, undefined);
		else if (s['level'].passable(c.x, c.y)) {} 
	}
	const hp1 = hero.hp; let hit2 = false;
	for (let i = 0; i < 10; i++) { mob.x = at.x; mob.y = at.y; s['takeMonsterTurn'](mob); if (hero.hp < hp1) hit2 = true; }
	out.attackedThroughBlocker = hit2; out.blockersPresent = s['creatures'].filter((c) => c.kind === 'rat').length;
	return out;
});
console.log(JSON.stringify(result));
await browser.close();
