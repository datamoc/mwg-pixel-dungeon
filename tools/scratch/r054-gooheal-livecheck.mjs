import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const browser = await chromium.launch({
	executablePath: path.join(process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local', 'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe'),
	args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=r054-goo-heal', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
const tap = async (x, y) => {
	await page.evaluate(([fx, fy]) => {
		const c = document.querySelector('canvas'), r = c.getBoundingClientRect();
		const o = { bubbles: true, cancelable: true, clientX: r.x + r.width * fx, clientY: r.y + r.height * fy, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
		for (const type of ['pointermove','pointerdown','pointerup','click']) c.dispatchEvent(new PointerEvent(type, o));
	}, [x, y]);
	await page.waitForTimeout(1000);
};
await tap(398 / 1024, 400 / 768);
await tap(62 / 1024, 261 / 768);
await tap(0.166, 0.921);
await page.waitForTimeout(5000);
const result = await page.evaluate(() => {
	const s = window.__MWG__.currentScene, h = s.hero;
	let at;
	for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]]) {
		const x=h.x+dx,y=h.y+dy;
		if (s.level.inside(x,y) && s.level.passable(x,y) && !s.creatureAt(x,y)) { at={x,y}; break; }
	}
	if (!at) throw new Error('no adjacent passable cell for Goo');
	s.level.set(at.x, at.y, 3); // WATER
	const goo = s.spawnMonster('goo', at);
	goo.hp=8; goo.maxHp=10; goo.gooHealInc=2; goo.pumped=1;
	s.regeneration.lockLeft=20;
	const healed=[];
	const showHeal=s.showHeal;
	s.showHeal=function(target, amount) { healed.push({kind:target.kind, amount}); showHeal.call(this,target,amount); };
	s.takeGooTurn(goo);
	s.refresh();
	return { at, hp:goo.hp, healInc:goo.gooHealInc, lockLeft:s.regeneration.lockLeft, healed, fov:s.fov.isVisible(at.x,at.y) };
});
console.log(JSON.stringify({ result, errors }));
await page.screenshot({ path: 'tools/scratch/r054-gooheal-livecheck.png' });
await browser.close();
if (result.hp !== 10 || result.healInc !== 1 || result.lockLeft !== 17 || result.healed.length !== 1 || result.healed[0].amount !== 2 || !result.fov || errors.length) process.exitCode=1;
