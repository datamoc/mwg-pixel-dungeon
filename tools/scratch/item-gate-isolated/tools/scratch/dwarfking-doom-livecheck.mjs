// Throwaway (tools/scratch): live-verify DwarfKing's phase 2+ Doom immunity: the multiplier is skipped once phase > 1, though Doom still attaches.
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
	hero.damage = [10, 10];
	s['creatures'].splice(0, s['creatures'].length, hero);
	let row = null;
	for (let y = 2; y < s['level'].height - 2 && !row; y++) for (let x = 3; x < s['level'].width - 3 && !row; x++) {
		if (Array.from({ length: 4 }, (_, k) => s['level'].passable(x - 1 + k, y)).every(Boolean)) row = { x, y };
	}
	hero.x = row.x; hero.y = row.y;
	s['fov'].update(hero.x, hero.y, 20);
	const mk = (dx) => {
		s['spawnMonster']('king', { x: row.x + dx, y: row.y }, false, undefined, false, undefined, false, undefined);
		return s['creatures'].filter((c) => c.kind === 'king').pop();
	};
	// phase 1: doom still amplifies
	let k1 = mk(1);
	k1.hp = k1.maxHp = 200; k1.armor = [0, 0]; k1.kingPhase = 1; k1.buffs = {};
	const r1 = s['resolveHeroAbilityAttack'](hero, k1, true, 1, 1);
	out.phase1Undoomed = r1.damage;
	k1.buffs = { doom: 9999 };
	const r2 = s['resolveHeroAbilityAttack'](hero, k1, true, 1, 1);
	out.phase1Doomed = r2.damage;
	// phase 2+: doom attaches but the multiplier is skipped
	let k2 = mk(2);
	k2.hp = k2.maxHp = 200; k2.armor = [0, 0]; k2.kingPhase = 2; k2.buffs = { doom: 9999 };
	const r3 = s['resolveHeroAbilityAttack'](hero, k2, true, 1, 1);
	out.phase2Doomed = r3.damage;
	out.matchesUndoomed = r3.damage === r1.damage;
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
