// Throwaway (tools/scratch): live-verify the Duelist Monk port - energy gain, Flurry, Dragon Kick, Dash, Focus, Meditate.
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=combo', { waitUntil: 'load', timeout: 120000 });
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
	s['subclass'] = () => 'monk_sub';
	const talents = { unencumbered_spirit: 0, monastic_vigor: 0, combined_energy: 0 };
	s['talentRank'] = (n) => talents[n] ?? 0;
	s['creatures'].splice(0, s['creatures'].length, hero);
	hero.hp = hero.maxHp = 500;
	let line = null;
	for (let y = 2; y < s['level'].height - 2 && !line; y++) for (let x = 2; x < s['level'].width - 10 && !line; x++) {
		if (Array.from({ length: 9 }, (_, k) => s['level'].passable(x + k, y)).every(Boolean)) line = { x, y };
	}
	const mk = (dx, kind = 'gnoll') => {
		s['spawnMonster'](kind, { x: line.x + dx, y: line.y }, false, undefined, false, undefined, false, undefined);
		const m = s['creatures'].filter((c) => c.kind === kind).pop();
		m.hp = m.maxHp = 500; m.sleeping = false; m.seesHero = true; m.buffs = {};
		return m;
	};
	const reset = () => { s['creatures'].splice(0, s['creatures'].length, hero); hero.hp = hero.maxHp = 500; hero.x = line.x; hero.y = line.y; hero.buffs = {}; s['monk'].flurryLocked = false; s['monk'].resistTurns = 0; s['fov'].update(hero.x, hero.y, s['viewRadius']()); s['syncHeroFromStats'](); s['monkEnsureBuff'](); };
	// energy gain per kill, with Unencumbered Spirit 3 (armor tier 1 -> +1.0; fists -> no weapon bonus)
	reset(); s['weaponId'] = 'startingWeapon'; s['armorTier'] = 1;
	s['monk'].energy = 0;
	let m = mk(1); m.hp = 1; s['kill'](m);
	out.plainKill = { energy: s['monk'].energy, cap: s['monkEnergyCap']() };
	talents.unencumbered_spirit = 3;
	m = mk(1); m.hp = 1; s['kill'](m);
	out.unencumberedKill = { energy: s['monk'].energy };
	talents.unencumbered_spirit = 0;
	out.buffIcon = hero.buffs.monkEnergy;
	// flurry: two x1.5 unarmed sure-hits ignoring armor; free; locked until a turn passes
	reset(); s['monk'].energy = 5; m = mk(1); m.armor = [40, 40];
	const hp0 = m.hp; s['monkFlurry'](m, 1);
	out.flurry = { dealt: hp0 - m.hp, energyAfter: s['monk'].energy, locked: s['monk'].flurryLocked, usableWhileLocked: s['monkUsable']('flurry'), armorRestored: m.armor[0] === 40, damageRestored: hero.damage[1] > 8 };
	s['tickMonk'](1);
	out.flurryUnlocked = s['monkUsable']('flurry');
	// dragon kick: big hit, 6-cell shove, paralysed for the cells travelled
	reset(); s['monk'].energy = 5; m = mk(1); m.buffs.paralysis = undefined; delete m.buffs.paralysis;
	const kx = m.x, kh = m.hp; s['monkDragonKick'](m, 4);
	out.kick = { movedBy: m.x - kx, dealt: kh - m.hp, paralysis: m.buffs.paralysis, energyAfter: s['monk'].energy };
	// dash: aimed jump, free
	reset(); s['monk'].energy = 5; s['monkDashAim'](3);
	const cell = { x: line.x + 4, y: line.y };
	s['aiming'].onConfirm(cell);
	out.dash = { heroX: hero.x - line.x, energyAfter: s['monk'].energy };
	// focus: the next physical attack is parried and consumes the buff
	reset(); s['monk'].energy = 5; m = mk(1);
	s['useMonkAbility']('focus');
	const focusUp = hero.buffs.focus !== undefined; const lines = [];
	const so = s['say'].bind(s); s['say'] = (l, v) => { lines.push(l); return so(l, v); };
	const hh = hero.hp; s['attack'](m, hero); s['say'] = so;
	out.focus = { focusUp, energyAfter: s['monk'].energy, parried: lines.includes('paré') || lines.some((l) => /par/i.test(l)), heroHpUnchanged: hero.hp === hh, buffConsumed: hero.buffs.focus === undefined };
	// meditate: cures negatives, empowered heal + resistance
	reset(); s['monk'].energy = 10; hero.hp = 100; hero.buffs.poison = 10; hero.buffs.weakness = 10; hero.buffs.haste = 10;
	out.empoweredAtMax = { empowered: s['monkEmpowered'](), needsRank: (() => { talents.monastic_vigor = 1; const r = s['monkEmpowered'](); talents.monastic_vigor = 0; return r; })() };
	talents.monastic_vigor = 1;
	s['monkMeditate'](5);
	talents.monastic_vigor = 0;
	out.meditate = { poisonGone: hero.buffs.poison === undefined, weaknessGone: hero.buffs.weakness === undefined, hasteKept: hero.buffs.haste !== undefined, healingLeft: s['healingLeft'], resistTurns: s['monk'].resistTurns, energyAfter: s['monk'].energy, rechargingBuff: hero.buffs.recharging };
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
