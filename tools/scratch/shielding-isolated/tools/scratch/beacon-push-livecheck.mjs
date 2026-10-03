//Live-verify Lloyd's Beacon same-floor return against a Mob standing on the saved anchor.
//Serve dist/ first and set MWG_VERIFY_URL if the server is not at localhost:8000.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const executablePath = path.join(process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local', 'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe');
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('console.error:', m.text()); });

try {
	const url = process.env.MWG_VERIFY_URL ?? 'http://localhost:8000/?seed=beacon-push';
	await page.goto(url, { waitUntil: 'load', timeout: 120000 });
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
		await page.waitForTimeout(1000);
	};
	await tap(.35, .49); //title screen: enter dungeon
	await tap(.06, .38); //class select: choose the highlighted hero
	await tap(.166, .921); //start
	await page.waitForTimeout(5000);

	const setup = await page.evaluate(() => {
		const s = window.__MWG__.currentScene;
		const hero = s.hero;
		const free = (x, y) => s.level.passable(x, y) && !s.creatureAt(x, y);
		let heroCell;
		for (let y = 1; y < s.level.height - 1 && !heroCell; y++) for (let x = 1; x < s.level.width - 1; x++) {
			if (!free(x, y)) continue;
			const hasAdjacentHostile = s.creatures.some(c => !c.isHero && !c.isNPC && !c.isAlly && Math.max(Math.abs(c.x - x), Math.abs(c.y - y)) <= 1);
			if (!hasAdjacentHostile) { heroCell = { x, y }; break; }
		}
		if (!heroCell) throw new Error('could not find a safe hero cell');
		s['moveTo'](hero, heroCell);
		let anchor;
		for (let y = 1; y < s.level.height - 1 && !anchor; y++) for (let x = 1; x < s.level.width - 1; x++) {
			if (!free(x, y) || Math.max(Math.abs(x - hero.x), Math.abs(y - hero.y)) <= 2) continue;
			const neighbour = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]].some(([dx,dy]) => free(x+dx,y+dy));
			if (neighbour) { anchor = { x, y }; break; }
		}
		if (!anchor) throw new Error('could not find an anchor with a free neighbour');
		const added = s.bag.add({ id: 'beacon', quantity: 1, identified: true, instanceId: 'beacon-livecheck' });
		if (!added) throw new Error('could not add test beacon');
		const beacon = s['beaconArtifactItem']('beacon-livecheck');
		beacon.returnDepth = s.depth;
		beacon.returnBranch = 0;
		beacon.returnPos = s.level.index(anchor.x, anchor.y);
		beacon.returnX = anchor.x;
		beacon.returnY = anchor.y;
		s['spawnMonster']('rat', anchor, false, undefined, false, undefined, false, undefined);
		const rat = s.creatures.find(c => c.kind === 'rat' && c.x === anchor.x && c.y === anchor.y);
		if (!rat) throw new Error('test rat did not spawn on anchor');
		s['useBeaconArtifact']('beacon-livecheck');
		return { anchor, hero: heroCell, ratId: rat.id };
	});
	await page.waitForTimeout(500);
	await tap(.5, .51); //pick RETOURNER in the artifact action dialog
	await page.waitForTimeout(1000);
	const result = await page.evaluate((ratId) => {
		const s = window.__MWG__.currentScene;
		const beacon = s['beaconArtifactItem']('beacon-livecheck');
		const rat = s.creatures.find(c => c.id === ratId);
		return { hero: { x: s.hero.x, y: s.hero.y }, anchor: { x: beacon.returnX, y: beacon.returnY }, rat: rat && { x: rat.x, y: rat.y }, landed: s.hero.x === beacon.returnX && s.hero.y === beacon.returnY, ratDisplaced: !!rat && (rat.x !== beacon.returnX || rat.y !== beacon.returnY) };
	}, setup.ratId);
	assert.deepEqual(result.hero, result.anchor, 'hero should land on the saved cell');
	assert.equal(result.ratDisplaced, true, 'Mob should be moved off the saved cell');
	console.log(JSON.stringify({ setup, result }));
} finally {
	await browser.close();
}
