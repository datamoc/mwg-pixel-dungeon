// Throwaway (tools/scratch): live-verify Doom: WandOfCorruption dooms a corruption-immune LightAlly instead of converting it, and a doomed target takes +67% damage.
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
	for (let y = 2; y < s['level'].height - 2 && !row; y++) for (let x = 3; x < s['level'].width - 3 && !row; x++) {
		if (Array.from({ length: 4 }, (_, k) => s['level'].passable(x - 1 + k, y)).every(Boolean)) row = { x, y };
	}
	hero.x = row.x; hero.y = row.y;
	s['fov'].update(hero.x, hero.y, 20);
	// straight damage multiplier: two identical gnolls, one doomed
	s['spawnMonster']('gnoll', { x: row.x + 1, y: row.y }, false, undefined, false, undefined, false, undefined);
	const plain = s['creatures'].find((c) => c.kind === 'gnoll');
	plain.hp = plain.maxHp = 100; plain.armor = [0, 0]; plain.buffs = {};
	s['spawnMonster']('gnoll', { x: row.x - 1, y: row.y }, false, undefined, false, undefined, false, undefined);
	const doomed = s['creatures'].filter((c) => c.kind === 'gnoll')[1];
	doomed.hp = doomed.maxHp = 100; doomed.armor = [0, 0]; doomed.buffs = { doom: 9999 };
	hero.damage = [10, 10];
	s['abilityForceHit'] = true;
	s['attack'](hero, plain);
	s['attack'](hero, doomed);
	s['abilityForceHit'] = false;
	out.plainTaken = 100 - plain.hp;
	out.doomedTaken = 100 - doomed.hp;
	// WandOfCorruption on a LightAlly: dooms instead of converting
	s['creatures'].splice(0, s['creatures'].length, hero);
	s['spawnMonster']('rat', { x: row.x + 1, y: row.y }, false, undefined, true, 'lightAlly', false, undefined, 0);
	const light = s['creatures'].find((c) => c.allyKind === 'lightAlly');
	light.hp = light.maxHp = 80; light.buffs = { powerOfMany: 100 };
	out.debug = { kind: light.kind, allyKind: light.allyKind, hp: light.hp, maxHp: light.maxHp };
	const origAdd = s['addBuff'] ? null : null;
	let sawOutcome = null;
	const origAttack = s['attack'].bind(s);
	s['attack'] = (...args) => { return origAttack(...args); };
	s['fireWandShot']('corruption', 200, light, 1);
	out.afterZap = { hp: light.hp, buffs: { ...light.buffs }, allyKind: light.allyKind };

	out.lightAlly = { stillAlly: light.allyKind === 'lightAlly', doomed: light.buffs.doom !== undefined, notConverted: light.allyKind !== 'mirror' };
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
