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
	s['fov'].update(hero.x, hero.y, s['viewRadius']());
	s['spawnMonster']('gnollExile', at, false, undefined, false, undefined, false, undefined);
	const mob = s['creatures'].find((c) => c.kind === 'gnollExile');
	mob.sleeping = false;
	const hp0 = hero.hp; let hitPassive = false;
	for (let i = 0; i < 30; i++) { mob.x = at.x; mob.y = at.y; mob.seesHero = true; s['takeMonsterTurn'](mob); if (hero.hp < hp0) hitPassive = true; }
	out.passiveNeverAttacks = !hitPassive;
	// hit it: it turns aggressive and attacks from two cells
	mob.hp -= 1;
	const hp1 = hero.hp; let hitAfter = false;
	for (let i = 0; i < 40 && !hitAfter; i++) { mob.x = at.x; mob.y = at.y; mob.seesHero = true; s['takeMonsterTurn'](mob); if (hero.hp < hp1) hitAfter = true; }
	out.attacksAfterBeingHit = hitAfter;
	// debuff path on a second exile
	const at2 = { x: hero.x - dir[0], y: hero.y - dir[1] };
	if (s['level'].passable(at2.x, at2.y) && s['level'].passable(hero.x - dir[0]/2, hero.y - dir[1]/2)) {
		s['spawnMonster']('gnollExile', at2, false, undefined, false, undefined, false, undefined);
		const m2 = s['creatures'].filter((c) => c.kind === 'gnollExile')[1];
		m2.sleeping = false; m2.buffs['poison'] = 5;
		const hp2 = hero.hp; let hit3 = false;
		for (let i = 0; i < 40 && !hit3; i++) { m2.x = at2.x; m2.y = at2.y; m2.seesHero = true; s['takeMonsterTurn'](m2); if (hero.hp < hp2) hit3 = true; }
		out.attacksWhenDebuffed = hit3;
	}
	return out;
});
console.log(JSON.stringify(result));
await browser.close();
