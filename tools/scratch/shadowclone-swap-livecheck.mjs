// Throwaway (tools/scratch): live-check ShadowAlly's PERFECT_COPY place-swap.
//
// Java (`ShadowAlly.interact(c)` / `canInteract`, tag `v3.3.8`): with PERFECT_COPY the
// clone free-swaps with the hero up to `max(1, points)` cells (adjacency from super,
// then the talent range), refusing on an impassable clone cell while the hero is not
// flying or when the pathfinder cannot reach the clone. Without the talent it falls
// through to Char.interact's default swap, which this port does not model for allies.
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href, { waitUntil: 'load', timeout: 120000 });
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
// title screen, class-select (Rogue-ish left column), begin
await tap(398 / 1024, 400 / 768);
await tap(62 / 1024, 261 / 768);
await tap(0.166, 0.921);
await page.waitForTimeout(5000);

const result = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	if (!s?.hero) return { fatal: 'no dungeon scene/hero' };
	const originalTalentRank = s.talentRank.bind(s);

	const clearFloor = () => {
		for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); }
	};
	const offsets = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
	/** a neighbouring (or `away`-step) passable empty cell from the hero */
	const clearCell = (away) => {
		for (const [dx, dy] of offsets) {
			const x = s.hero.x + dx * away, y = s.hero.y + dy * away;
			if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) return { x, y, dx, dy };
		}
		return null;
	};
	const snap = () => ({ hx: s.hero.x, hy: s.hero.y });
	const restore = (from) => { s['moveTo'](s.hero, { x: from.hx, y: from.hy }); };

	const cases = {};

	// takeHeroTurn takes a delta from the hero (planMovement: position + move), not an absolute cell
	const stepTo = (cell) => ({ x: cell.x - s.hero.x, y: cell.y - s.hero.y });

	// rank 0, adjacent bump: falls through to tryDefaultAllyPlaceSwap (Java Char.interact default)
	clearFloor();
	let at = clearCell(1);
	s.talentRank = (k) => (k === 'perfect_copy' ? 0 : originalTalentRank(k));
	let clone = s['spawnShadowClone'](at);
	clone.sleeping = true;
	const before0 = snap();
	const clone0 = { x: clone.x, y: clone.y };
	s['takeHeroTurn'](stepTo(clone0));
	cases.rank0Bump = {
		moved: before0.hx !== s.hero.x || before0.hy !== s.hero.y,
		swapped: s.hero.x === clone0.x && s.hero.y === clone0.y
			&& clone.x === before0.hx && clone.y === before0.hy,
		heroHp: s.hero.hp, cloneHp: clone.hp,
	};
	restore(before0);

	// rank 1, adjacent bump: free swap
	clearFloor();
	at = clearCell(1);
	s.talentRank = (k) => (k === 'perfect_copy' ? 1 : originalTalentRank(k));
	clone = s['spawnShadowClone'](at);
	clone.sleeping = true;
	const before1 = snap();
	const clone1 = { x: clone.x, y: clone.y };
	s['takeHeroTurn'](stepTo(clone1));
	cases.rank1Bump = {
		moved: before1.hx !== s.hero.x || before1.hy !== s.hero.y,
		swapped: s.hero.x === clone1.x && s.hero.y === clone1.y
			&& clone.x === before1.hx && clone.y === before1.hy,
		cloneAlive: clone.hp > 0, heroHp: s.hero.hp,
	};
	restore(before1);

	// tryShadowCloneSwap directly: distance 2 with rank 1 refuses (false), rank 2 swaps
	clearFloor();
	at = clearCell(2);
	s.talentRank = (k) => (k === 'perfect_copy' ? 1 : originalTalentRank(k));
	clone = s['spawnShadowClone'](at);
	clone.sleeping = true;
	const far1 = snap();
	const cloneFar = { x: clone.x, y: clone.y };
	const handledRank1Far = s['tryShadowCloneSwap'](clone);
	cases.rank1Far = {
		handled: handledRank1Far,
		moved: far1.hx !== s.hero.x || far1.hy !== s.hero.y,
	};
	restore(far1);

	s.talentRank = (k) => (k === 'perfect_copy' ? 2 : originalTalentRank(k));
	const handledRank2Far = s['tryShadowCloneSwap'](clone);
	cases.rank2Far = {
		handled: handledRank2Far,
		swapped: s.hero.x === cloneFar.x && s.hero.y === cloneFar.y
			&& clone.x === far1.hx && clone.y === far1.hy,
	};
	restore(far1);

	// refusal: clone cell not passable, hero not flying -> handled true, no move
	clearFloor();
	at = clearCell(1);
	s.talentRank = (k) => (k === 'perfect_copy' ? 2 : originalTalentRank(k));
	clone = s['spawnShadowClone'](at);
	clone.sleeping = true;
	const tileBefore = s.level.get(at.x, at.y);
	s.level.set(at.x, at.y, 0); // this port's WALL: not passable
	const blockBefore = snap();
	const blockedHandled = s['tryShadowCloneSwap'](clone);
	cases.blocked = {
		handled: blockedHandled,
		moved: blockBefore.hx !== s.hero.x || blockBefore.hy !== s.hero.y,
		levitating: s.hero.buffs['levitation'] !== undefined,
	};
	s.level.set(at.x, at.y, tileBefore);
	restore(blockBefore);

	// ranged map click: Hero.handle's Interact path at distance 2 with rank 2
	clearFloor();
	at = clearCell(2);
	s.talentRank = (k) => (k === 'perfect_copy' ? 2 : originalTalentRank(k));
	clone = s['spawnShadowClone'](at);
	clone.sleeping = true;
	const clickFrom = snap();
	const clickClone = { x: clone.x, y: clone.y };
	// invert camera.toWorld by scanning: handleMapPointer expects screen pixels
	let clickScreen = null;
	for (let sy = 0; sy < 768 && !clickScreen; sy += 6) {
		for (let sx = 0; sx < 1024; sx += 6) {
			const local = s.camera.toWorld(sx, sy);
			if (Math.floor(local.x / 16) === clickClone.x && Math.floor(local.y / 16) === clickClone.y) {
				clickScreen = { sx, sy };
				break;
			}
		}
	}
	if (clickScreen) s['handleMapPointer'](clickScreen.sx, clickScreen.sy);
	cases.rangedClick = {
		foundScreen: !!clickScreen,
		swapped: s.hero.x === clickClone.x && s.hero.y === clickClone.y
			&& clone.x === clickFrom.hx && clone.y === clickFrom.hy,
	};
	restore(clickFrom);

	s.talentRank = originalTalentRank;
	clearFloor();
	return cases;
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [];
if (result.fatal) {
	expect.push(['scene reachable', false]);
} else {
	expect.push(['rank 0 adjacent bump uses the default place-swap', result.rank0Bump.swapped === true]);
	expect.push(['rank 1 bump swaps hero and clone', result.rank1Bump.swapped === true]);
	expect.push(['the swap is free (nobody damaged)', result.rank1Bump.cloneAlive === true && result.rank1Bump.heroHp > 0]);
	expect.push(['rank 1 refuses a swap 2 cells away', result.rank1Far.handled === false && result.rank1Far.moved === false]);
	expect.push(['rank 2 swaps from 2 cells away', result.rank2Far.handled === true && result.rank2Far.swapped === true]);
	expect.push(['an impassable clone cell refuses without moving', result.blocked.handled === true && result.blocked.moved === false]);
	expect.push(['a ranged map click swaps within PERFECT_COPY range', result.rangedClick.foundScreen === true && result.rangedClick.swapped === true]);
}
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
