// Throwaway (tools/scratch): live-verify the Gladiator Combo port - counter/clock, finishers, Parry + riposte.
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
	s['subclass'] = () => 'gladiator';
	let talents = { enhanced_combo: 0, cleave: 0 };
	s['talentRank'] = (n) => talents[n] ?? 0;
	s['creatures'].splice(0, s['creatures'].length, hero);
	// a 6-cell open row to fight on
	let line = null;
	for (let y = 2; y < s['level'].height - 2 && !line; y++) for (let x = 2; x < s['level'].width - 8 && !line; x++) {
		if (Array.from({ length: 6 }, (_, k) => s['level'].passable(x + k, y)).every(Boolean)) line = { x, y };
	}
	const mk = (dx, kind = 'gnoll') => {
		const at = { x: line.x + dx, y: line.y };
		s['spawnMonster'](kind, at, false, undefined, false, undefined, false, undefined);
		const m = s['creatures'].filter((c) => c.kind === kind).pop();
		m.hp = m.maxHp = 500; m.sleeping = false; m.seesHero = true; m.buffs = {};
		return m;
	};
	const reset = () => { s['creatures'].splice(0, s['creatures'].length, hero); s['comboDetach'](); s['comboParryTurns'] = 0; hero.hp = hero.maxHp = 500; hero.x = line.x; hero.y = line.y; s['fov'].update(hero.x, hero.y, s['viewRadius']()); s['syncHeroFromStats'](); };
	const hit = (m) => { s['abilityForceHit'] = true; s['attack'](hero, m); s['abilityForceHit'] = false; };
	// parry with nobody to hit: the window lapses unparried and the whole combo is lost
	reset();
	hero.buffs.combo = 5; hero.combo = 6;
	s['useComboMove']('parry');
	const mid = { turns: s['comboParryTurns'], evasionInfinite: hero.evasion > 1000, count: s['comboCount']() };
	s['spendHeroTurn'](1);
	out.parryLapse = { mid, countAfter: s['comboCount'](), buffGone: hero.buffs.combo === undefined, evasionRestored: hero.evasion < 1000, parryUsedResets: s['comboParryUsed'] === false };
	reset();
	let m = mk(1);
	hit(m); hit(m); hit(m);
	out.afterThreeHits = { count: s['comboCount'](), clock: hero.buffs.combo };
	// kill sets 15 + 15*cleave
	talents.cleave = 2;
	m.hp = 1; hit(m);
	out.afterKill = { count: s['comboCount'](), clock: hero.buffs.combo };
	talents.cleave = 0;
	// clobber: knocks back 2, +1 combo, once per session
	reset(); m = mk(1);
	hit(m); hit(m);
	m.buffs.paralysis = 50;
	const before = { x: m.x, count: s['comboCount'](), hp: m.hp, cells: [2, 3].map((d) => [s['level'].passable(line.x + d, line.y), s['creatureAt'](line.x + d, line.y) === null]) };
	s['comboStrike']('clobber', m);
	out.clobber = { cells: before.cells, movedBy: m.x - before.x, countBefore: before.count, countAfter: s['comboCount'](), used: s['comboClobberUsed'], damageDealt: before.hp - m.hp };
	// slam resets
	reset(); m = mk(1);
	for (let i = 0; i < 4; i++) hit(m);
	const hp0 = m.hp; s['comboStrike']('slam', m);
	out.slam = { countAfter: s['comboCount'](), buffGone: hero.buffs.combo === undefined, dealt: hp0 - m.hp };
	// crush splash hits a bystander
	reset(); m = mk(1); const by = mk(2);
	for (let i = 0; i < 8; i++) hit(m);
	const byHp = by.hp; s['comboStrike']('crush', m);
	out.crush = { countAfter: s['comboCount'](), bystanderHurt: byHp - by.hp > 0 };
	// fury: count strikes, resets
	reset(); m = mk(1);
	for (let i = 0; i < 10; i++) hit(m);
	const hf = m.hp; s['comboStrike']('fury', m);
	out.fury = { countAfter: s['comboCount'](), dealt: hf - m.hp };
	// parry with an awake enemy adjacent: its attack during the window is parried and riposted (count +1)
	reset(); m = mk(1);
	for (let i = 0; i < 6; i++) hit(m);
	const hh = hero.hp, mh = m.hp, before6 = s['comboCount']();
	const lines = [];
	const sayOrig = s['say'].bind(s);
	s['say'] = (l, v) => { lines.push(l); return sayOrig(l, v); };
	s['useComboMove']('parry');
	s['say'] = sayOrig;
	out.parry = { lines, heroLoss: hh - hero.hp, monsterLoss: mh - m.hp, mAlive: s['creatures'].includes(m), countBefore: before6, countAfter: s['comboCount'](), heroHpUnchanged: hero.hp === hh, monsterRiposted: m.hp < mh, parryUsed: s['comboParryUsed'] };
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
