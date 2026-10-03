// Throwaway (tools/scratch): live-check ShadowAlly's SHADOW_BLADE weapon-proc delegation.
//
// Java (`ShadowAlly.attackProc`, ShadowClone.java 218-226, tag v3.3.8): a landed clone swing
// runs the *hero's* `Weapon.proc` when `Random.Int(4) < pointsInTalent(SHADOW_BLADE)` and the
// hero holds a weapon. The port wires that through `cloneGearSwing` in `combatResolution.attack()`
// plus the `heroOnHit(..., gearDelegated)` half; this drives the real built scene and proves the
// delegation fires - the `explosive` weapon-curse fuse (heroOnHit's own branch, decremented by
// `round(IntRange(0,10) x procMultiplier)`) ticks down for a clone's swings at rank 4 and must
// never move at rank 0. Rank 0 is also the control for "no hero-side state leaks through".
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
// title screen, class-select, begin (same route as shadowclone-swap-livecheck)
await tap(398 / 1024, 400 / 768);
await tap(62 / 1024, 261 / 768);
await tap(0.166, 0.921);
await page.waitForTimeout(5000);

const result = await page.evaluate(() => {
	const s = window.__MWG__?.currentScene;
	if (!s?.hero) return { fatal: 'no dungeon scene/hero' };
	const originalTalentRank = s.talentRank.bind(s);
	const offsets = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

	const clearFloor = () => { for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); } };
	const clearCell = (away) => {
		for (const [dx, dy] of offsets) {
			const x = s.hero.x + dx * away, y = s.hero.y + dy * away;
			if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) return { x, y };
		}
		return null;
	};
	const emptyNeighbour = (from) => {
		for (const [dx, dy] of offsets) {
			const x = from.x + dx, y = from.y + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) return { x, y };
		}
		return null;
	};

	// One round: fresh clone, the `explosive` curse affix armed at 100, then up to 12 swings
	// against fresh rats (evasion 0, huge HP so nothing dies) next to the clone.
	const swing = (bladePoints) => {
		clearFloor();
		const cloneCell = clearCell(1);
		if (!cloneCell) return { fatal: 'no free cell beside the hero for the clone' };
		s.talentRank = (k) => (k === 'shadow_blade' ? bladePoints : originalTalentRank(k));
		const clone = s['spawnShadowClone'](cloneCell);
		if (!clone) return { fatal: 'spawnShadowClone returned nothing' };
		s.weaponAffix = 'explosive';
		s.weaponCurseDurability = 100;
		let landed = 0;
		for (let i = 0; i < 12; i++) {
			const cell = emptyNeighbour(clone);
			if (!cell) break;
			const foe = s.spawnMonster('rat', cell);
			foe.sleeping = false;
			foe.evasion = 0;
			foe.maxHp = 5000;
			foe.hp = 5000;
			if (s.attack(clone, foe)) landed++;
			foe.maxHp = 5000;
			foe.hp = 5000;
		}
		const durability = s.weaponCurseDurability;
		s.talentRank = originalTalentRank;
		return { bladePoints, landed, durability };
	};

	const rank0 = swing(0);
	let rank4 = swing(4);
	// A round can coincidentally land on exactly 100 (0-10 per landed hit, plus the +100 wrap),
	// so repeat until the fuse moves or three rounds are in.
	for (let extra = 0; extra < 2 && rank4.durability === 100 && rank4.landed > 0; extra++) {
		rank4 = swing(4);
	}

	// Defence half: `ShadowAlly.defenseProc()` - the hero's glyph on a clone that is being hit.
	// `stone` (inline in `attack()`) cuts the damage outright whenever the gate passes, so it is
	// measurable as total HP lost; `thorns` (a `mobOnHit` site) rolls 1/6 at armor level 0 and
	// shows up as Bleeding on the attacker. The clone is healed back to full before every swing
	// so the two configurations are compared on identical HP.
	const defend = (armorPoints, glyph) => {
		clearFloor();
		const cloneCell = clearCell(1);
		if (!cloneCell) return { fatal: 'no free cell for the defence clone' };
		s.talentRank = (k) => (k === 'cloned_armor' ? armorPoints : originalTalentRank(k));
		const clone = s['spawnShadowClone'](cloneCell);
		s.armorGlyph = glyph;
		let landed = 0, lost = 0, procs = 0;
		for (let i = 0; i < 30; i++) {
			const cell = emptyNeighbour(clone);
			if (!cell) break;
			const foe = s.spawnMonster('rat', cell);
			foe.sleeping = false;
			foe.maxHp = 9999;
			foe.hp = 9999;
			clone.hp = clone.maxHp;
			const hpBefore = clone.hp;
			if (s.attack(foe, clone)) landed++;
			lost += Math.max(0, hpBefore - clone.hp);
			if (foe.buffs.bleeding !== undefined) procs++;
			foe.hp = 0;
			s.kill(foe);
		}
		s.talentRank = originalTalentRank;
		const result = { armorPoints, glyph, landed, lost, procs };
		clearFloor();
		return result;
	};
	const stone0 = defend(0, 'stone');
	const stone4 = defend(4, 'stone');
	const thorns0 = defend(0, 'thorns');
	const thorns4 = defend(4, 'thorns');
	clearFloor();
	return { rank0, rank4, stone0, stone4, thorns0, thorns4 };
});

console.log(JSON.stringify({ ...result, problems }, null, 2));
await browser.close();

const fail = (msg) => { console.error(`FAIL ${msg}`); process.exit(1); };
if (result.fatal) fail(result.fatal);
if (result.rank0.landed < 1) fail('control round landed no hits - inconclusive');
if (result.rank0.durability !== 100) fail(`rank 0 must not run the hero Weapon.proc (fuse ${result.rank0.durability})`);
if (result.rank4.landed < 1) fail('rank 4 round landed no hits - inconclusive');
if (result.rank4.durability === 100) fail('rank 4 never ran the delegated Weapon.proc (fuse unmoved)');
if (problems.length) fail(`console/page errors: ${problems.join(' | ')}`);
for (const side of ['stone0', 'stone4', 'thorns0', 'thorns4']) {
	if (result[side].fatal) fail(result[side].fatal);
	if (result[side].landed < 10) fail(`${side} landed only ${result[side].landed} hits - inconclusive`);
}
// CLONED_ARMOR rank 0 must never apply the hero's Stone reduction, so the control loses strictly more HP.
if (result.stone0.lost <= result.stone4.lost) fail(`CLONED_ARMOR gate failed: stone0 lost ${result.stone0.lost} vs stone4 lost ${result.stone4.lost}`);
// A mobOnHit glyph site (thorns): never at rank 0, at least once across 30 swings at rank 4.
if (result.thorns0.procs !== 0) fail(`rank 0 must not roll the hero thorns proc (saw ${result.thorns0.procs})`);
if (result.thorns4.procs < 1) fail(`rank 4 never ran the delegated thorns proc in ${result.thorns4.landed} hits`);
console.log('PASS SHADOW_BLADE delegates attackProc and CLONED_ARMOR delegates defenseProc (stone inline + thorns via mobOnHit), each only with its talent');
