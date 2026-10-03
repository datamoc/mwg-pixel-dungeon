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
	const doorEntry = s['doors'].toJSON().doors[0];
	out.doorsOnLevel = s['doors'].toJSON().doors.length;
	// put the hero on floor beside the first door
	const W = s['level'].width;
	const dx = doorEntry.cell % W, dy = Math.floor(doorEntry.cell / W);
	const nb = [[-1,0],[1,0],[0,-1],[0,1]].map(([a,b]) => ({ x: dx + a, y: dy + b })).find((c) => s['level'].passable(c.x, c.y));
	s['hero'].x = nb.x; s['hero'].y = nb.y;
	s['fov'].update(nb.x, nb.y, s['viewRadius']());
	s['bag'].add({ id: 'skeletonkey', quantity: 1, identified: true, instanceId: 'key-1' });
	const key = s['skeletonKeyItem']();
	out.keyFound = !!key;
	// use flow with a scripted aim: capture beginAiming
	let aimOpts = null;
	const realAim = s['beginAiming'].bind(s);
	s['beginAiming'] = (o) => { aimOpts = o; };
	s['useSkeletonKey']();
	out.aimOpened = !!aimOpts;
	// confirm on the door cell: it's open/closed regular door -> locks (2 charges)
	const before = key.charge ?? 3;
	aimOpts.onConfirm({ x: dx, y: dy });
	out.afterLock = { locked: s['doors'].isLocked(dx, dy), req: s['doors'].requiredKey(dx, dy), charge: key.charge, exp: key.exp, spent: before - key.charge };
	// bump: with an uncursed key it refuses
	const bumped = s['bumpDoor'](dx, dy);
	out.bumpWithKey = { handled: bumped, stillLocked: s['doors'].isLocked(dx, dy) };
	// insert again: hero-locked opens free
	aimOpts = null; s['useSkeletonKey'](); aimOpts.onConfirm({ x: dx, y: dy });
	out.reopened = { locked: s['doors'].isLocked(dx, dy), charge: key.charge };
	// walls: aim far east/west toward open floor
	key.charge = 3;
	aimOpts = null; s['useSkeletonKey']();
	const dir = [[-1,0],[1,0],[0,-1],[0,1]].find(([a,b]) => s['level'].passable(nb.x + a, nb.y + b) && (nb.x + a !== dx || nb.y + b !== dy));
	out.dir = dir;
	const target = { x: nb.x + dir[0] * 2, y: nb.y + dir[1] * 2 };
	out.targetKnown = s['fov'].isExplored(target.x, target.y) || s['fov'].isVisible(target.x, target.y);
	const before2 = key.charge;
	aimOpts.onConfirm(target);
	out.walls = { n: s['keyWalls'].size, cells: [...s['keyWalls'].keys()].length, charge: key.charge, spent: before2 - key.charge };
	const wallCell = [...s['keyWalls'].keys()][0];
	if (wallCell !== undefined) out.wallTerrain = s['level'].get(wallCell % W, Math.floor(wallCell / W));
	// tick 10 turns -> walls gone
	for (let i = 0; i < 10; i++) s['tickSkeletonKey']();
	out.wallsAfter10 = s['keyWalls'].size;
	if (wallCell !== undefined) out.wallRestored = s['level'].get(wallCell % W, Math.floor(wallCell / W));
	// trinity case: refuses nothing, opens aim
	s['heroClass'] = 'cleric'; s['talentRanks']['spirit_form'] = 2; s['armorCharge'] = 90;
	aimOpts = null;
	s['commitTrinitySpiritArtifact'](25, 'SkeletonKey', 'Skeleton Key', () => s['trinitySpiritSkeletonKey']());
	out.trinity = { aim: !!aimOpts, spent: +(90 - s['armorCharge']).toFixed(1) };
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
