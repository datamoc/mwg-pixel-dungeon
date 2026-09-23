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
	s['heroClass'] = 'cleric';
	s['talentRanks']['spirit_form'] = 2;
	const out = {};
	const hero = s['hero'];
	// an open row: find a spot with 5 free passable cells to the right
	let spot = null;
	for (let y = 1; y < s['level'].height - 1 && !spot; y++) for (let x = 1; x < s['level'].width - 7 && !spot; x++) {
		let ok = true;
		for (let k = 0; k <= 5; k++) if (!s['level'].passable(x + k, y) || s['creatureAt'](x + k, y)) ok = false;
		if (ok) spot = { x, y };
	}
	s['moveTo'](hero, spot); s['refresh']();
	hero.hp = hero.maxHp = 500;
	let turns = 0; const origSpend = s['spendHeroTurn'].bind(s); s['spendHeroTurn'] = (c) => { turns++; return origSpend(c); };
	const bagBefore = s['bag'].items.length;
	const cast = (fn, cls, label) => { s['armorCharge'] = 90; s[fn] && s['commitTrinitySpiritArtifact'](25, cls, label, () => s[fn]()); };
	// Chains: pull a rat 4 cells away toward the hero.
	const rat = s['spawnMonster']('rat', { x: spot.x + 4, y: spot.y }); rat.sleeping = true; rat.seesHero = false;
	cast('trinitySpiritChains', 'EtherealChains', 'chains');
	out.chainsAiming = !!s['aiming'];
	s['aiming']?.onConfirm({ x: rat.x, y: rat.y }, []);
	out.chainsPulled = { ratX: rat.x - spot.x, aimingCleared: !s['aiming'] };
	s['kill'](rat);
	// Armband: steal from an adjacent rat.
	s['moveTo'](hero, spot);
	const rat2 = s['spawnMonster']('rat', { x: spot.x + 1, y: spot.y });
	rat2.sleeping = true; rat2.seesHero = false;
	cast('trinitySpiritArmband', 'MasterThievesArmband', 'armband');
	out.armbandAiming = !!s['aiming'];
	s['aiming']?.onConfirm({ x: rat2.x, y: rat2.y }, []);
	out.armbandStolen = rat2.armbandStolen === true;
	s['kill'](rat2);
	// Sandals: plant a random seed 2 cells away.
	cast('trinitySpiritSandals', 'SandalsOfNature', 'sandals');
	out.sandalsAiming = !!s['aiming'];
	const t0 = turns; const ab = s['aiming']; s['aiming'] = null; ab?.onConfirm({ x: spot.x + 2, y: spot.y }, []);
	out.sandalsTurnSpent = turns - t0;
	// Talisman: scry toward the far end.
	cast('trinitySpiritTalisman', 'TalismanOfForesight', 'talisman');
	out.talismanAiming = !!s['aiming'];
	const t1 = turns; const at = s['aiming']; s['aiming'] = null; at?.onConfirm({ x: spot.x + 5, y: spot.y }, []);
	out.talismanTurnSpent = turns - t1;
	out.bagUnchanged = s['bag'].items.length === bagBefore;
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
