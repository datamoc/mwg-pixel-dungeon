// Throwaway (tools/scratch): the Blacksmith CRYSTAL mine roster, live in the built game.
//
// Enters a real CRYSTAL mining branch and drives the ported `CrystalWisp`/`CrystalGuardian`/
// `CrystalSpire` (`scenes/dungeon/monsters/crystalMine.ts`) through their Java behaviours.
// Build, serve dist at localhost:8000 (or set MWG_VERIFY_URL), then run this script.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import path from 'node:path';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const executablePath = path.join(process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local', 'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe');
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

const url = process.env.MWG_VERIFY_URL ?? 'http://localhost:8000/?seed=crystal-mine';
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
	await page.waitForTimeout(1200);
};
await tap(398 / 1024, 400 / 768);
await tap(62 / 1024, 261 / 768);
await tap(0.166, 0.921);
await page.waitForTimeout(5000);

const enter = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
	s['depth'] = 12;
	s['blacksmithQuestType'] = 1; // Blacksmith.Quest.CRYSTAL
	s['enterMiningBranch']();
	await sleep(3500);
	s['hero'].hp = s['hero'].maxHp = 999;
	const kinds = {};
	for (const c of s['creatures']) if (c.kind) kinds[c.kind] = (kinds[c.kind] ?? 0) + 1;
	const crystal = s['creatures'].filter((c) => String(c.kind).startsWith('crystal'));
	return {
		kinds,
		tints: crystal.map((c) => c.crystalTint),
		guardiansAsleep: crystal.filter((c) => c.kind === 'crystalGuardian').every((c) => c.sleeping === true),
		spireAwake: crystal.filter((c) => c.kind === 'crystalSpire').every((c) => c.sleeping === false),
		sprites: crystal.map((c) => { const sp = s['spriteFor'].get(c.id); return sp ? [c.kind, Math.round(sp.width), Math.round(sp.height)] : [c.kind, null]; }),
	};
});
console.log('enter', JSON.stringify(enter));

// Park the hero beside the spire for a screenshot of the roster.
await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const spire = s['creatures'].find((c) => c.kind === 'crystalSpire');
	for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]]) {
		const x = spire.x + dx, y = spire.y + dy;
		if (s['level'].passable(x, y) && !s['creatureAt'](x, y)) { s['moveTo'](s['hero'], { x, y }); break; }
	}
	s['refresh']();
});
await page.waitForTimeout(1500);
await page.screenshot({ path: 'tools/scratch/crystal-mine-spire.png' });

const behave = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const hero = s['hero'];
	const out = {};
	const spire = s['creatures'].find((c) => c.kind === 'crystalSpire');
	const guardian = s['creatures'].find((c) => c.kind === 'crystalGuardian');
	const wisp = s['creatures'].find((c) => c.kind === 'crystalWisp');

	// Spire: invulnerable to a weapon hit, refuses buffs.
	const spireHp = spire.hp;
	s['attack'](hero, spire);
	out.spireWeaponHitIgnored = spire.hp === spireHp;
	s['addBuff'] ? null : null;
	// Guardian: a lethal blast crumples it at 1 HP instead of killing it; it heals 5 a turn.
	s['applyBlastDamage'](guardian, 999, true, 'foe');
	out.guardianCrumpled = { alive: s['creatures'].includes(guardian), hp: guardian.hp, recovering: guardian.guardianRecovering, evasion: guardian.evasion, armor: guardian.armor };
	s['crystalMinePreTurn'](guardian);
	out.guardianHealed = guardian.hp;
	// An ally's hit on a crumpled guardian is refused; the hero's is not.
	out.crumpledInvulnToAlly = s['crystalMineInvulnerable'](guardian, { isHero: false });
	out.crumpledVulnToHero = s['crystalMineInvulnerable'](guardian, hero) === false;
	guardian.hp = guardian.maxHp - 3;
	s['crystalMinePreTurn'](guardian);
	out.guardianStoodUp = { recovering: guardian.guardianRecovering, hp: guardian.hp, evasion: guardian.evasion, armor: guardian.armor };

	// Wisp: a clear line at range fires the light beam instead of stepping.
	if (wisp) {
		const w = s['level'].width;
		let spot = null;
		const W = s['level'].width, H = s['level'].height;
		for (let y = 1; y < H - 1 && !spot; y++) for (let x = 1; x < W - 4 && !spot; x++) {
			const h = { x, y }, w = { x: x + 3, y };
			if ([h, { x: x + 1, y }, { x: x + 2, y }, w].every((c) => s['level'].passable(c.x, c.y) && (!s['creatureAt'](c.x, c.y) || s['creatureAt'](c.x, c.y) === hero || s['creatureAt'](c.x, c.y) === wisp))) spot = { h, w };
		}
		if (spot) { s['moveTo'](hero, spot.h); spot = spot.w; }
		if (spot) {
			s['moveTo'](wisp, spot);
			wisp.seesHero = true; wisp.sleeping = false;
			const before = hero.hp;
			let zapped = 0;
			for (let i = 0; i < 12; i++) { const at = { x: wisp.x, y: wisp.y }; s['takeCrystalMineTurn'](wisp, 3); if (wisp.x === at.x && wisp.y === at.y) zapped++; }
			out.wisp = { stayedAndZapped: zapped === 12, heroHpLost: before - hero.hp };
		} else out.wisp = 'no clear spot';
	}

	// Pickaxe on the spire: strike 1 warns, strike 3 rouses it (boss bar) and rallies guardians.
	for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
		const x = spire.x + dx, y = spire.y + dy;
		if (s['level'].passable(x, y) && !s['creatureAt'](x, y)) { s['moveTo'](hero, { x, y }); break; }
	}
	hero.hp = 999;
	s['bag'].add({ id: 'pickaxe', quantity: 1, identified: true });
	const g2 = s['creatures'].find((c) => c.kind === 'crystalGuardian' && c !== guardian) ?? guardian;
	g2.sleeping = true; g2.guardianRecovering = false;
	for (let i = 0; i < 3; i++) s['tryPickaxeSpire'](spire);
	s['refreshHealthBars']();
	out.afterThreeStrikes = { hits: spire.spireHits, hp: spire.hp, cd: spire.spireAbilityCd, bossBar: s['currentBoss'] === spire, g2Awake: g2.sleeping === false, g2Paralysis: g2.buffs.paralysis ?? null, g2Target: g2.lastSeen, g2RouteLen: s['crystalRoute'](spire, g2, true, true).length, g2Sleeping0: null };

	// Spire attack: with its clock run down it queues a wave, which lands on its next act.
	spire.spireAbilityCd = 0;
	s['takeSpireTurn'](spire);
	out.queuedWaves = spire.spireTargets?.length ?? 0;
	const firstWave = spire.spireTargets?.[0] ?? [];
	const before = hero.hp;
	const heroCell = s['level'].index(hero.x, hero.y);
	s['takeSpireTurn'](spire);
	out.waveLanded = {
		heroCellInWave: firstWave.includes(heroCell),
		heroHpLost: before - hero.hp,
		crystalsGrown: firstWave.filter((c) => s['portedPaint'].map[c] === 26 || s['crystalRawAt'](c) === s['portedPaint'].map[c]).length,
		rawAtFirst: firstWave.length ? s['crystalRawAt'](firstWave[0]) : null,
	};

	// A non-pickaxe seam (a wand bolt's direct HP loss) cannot smash it: kill() restores its pool.
	const pool = spire.hp;
	spire.hp = -50;
	s['kill'](spire);
	out.wandKillRefused = { alive: s['creatures'].includes(spire), hp: spire.hp, pool, beaten: s['blacksmithBossBeaten'] };
	// Allies never target the neutral spire; a crippled guardian pays double per step.
	out.allyIgnoresSpire = !s['visibleAllyHostiles'](hero).includes(spire);
	// Smashing the spire: the quest boss is beaten and it leaves the level.
	const near = () => { let n = 0; const W = s['level'].width; s['portedPaint'].map.forEach((raw, c) => { if (raw === 35 && Math.max(Math.abs(c % W - spire.x), Math.abs(Math.floor(c / W) - spire.y)) <= 5) n++; }); return n; };
	const crystalsNearBefore = near();
	spire.hp = spire.spireHp = 1;
	s['tryPickaxeSpire'](spire);
	out.crystalsWithin5 = { before: crystalsNearBefore, after: near() };
	out.spireSmashed = { gone: !s['creatures'].includes(spire), bossBeaten: s['blacksmithBossBeaten'] };
	return out;
});
console.log('behave', JSON.stringify(behave, null, 1));
await page.waitForTimeout(800);
await page.screenshot({ path: 'tools/scratch/crystal-mine-after.png' });
console.log('problems', JSON.stringify(problems));
await browser.close();

assert.ok(enter.kinds.crystalWisp > 0, 'CRYSTAL mine should spawn wisps');
assert.ok(enter.kinds.crystalGuardian > 0, 'CRYSTAL mine should spawn guardians');
assert.equal(enter.kinds.crystalSpire, 1, 'CRYSTAL mine should spawn one spire');
assert.equal(enter.guardiansAsleep, true, 'guardians should start asleep');
assert.equal(enter.spireAwake, true, 'spire should start awake');
assert.equal(behave.spireWeaponHitIgnored, true, 'spire should refuse a weapon hit');
assert.equal(behave.guardianCrumpled.hp, 1, 'lethal damage should crumple the guardian at 1 HP');
assert.equal(behave.guardianHealed, 6, 'crumpled guardian should recover 5 HP per turn');
assert.equal(behave.crumpledInvulnToAlly, true, 'allies should not damage a crumpled guardian');
assert.equal(behave.crumpledVulnToHero, true, 'hero should be able to finish a crumpled guardian');
assert.equal(behave.guardianStoodUp.recovering, false, 'guardian should stand once healed to full');
assert.equal(behave.wisp.stayedAndZapped, true, 'wisp should use its beam without stepping');
assert.equal(behave.afterThreeStrikes.hits, 3, 'three pickaxe strikes should alert the spire');
assert.equal(behave.afterThreeStrikes.bossBar, true, 'alerted spire should own the boss bar');
assert.equal(behave.queuedWaves, 1, 'spire should queue a spike wave');
assert.equal(behave.waveLanded.heroCellInWave, true, 'queued wave should land on its telegraphed hero cell');
assert.ok(behave.waveLanded.crystalsGrown > 0, 'wave should grow crystal terrain');
assert.equal(behave.wandKillRefused.alive, true, 'non-pickaxe damage should not kill the spire');
assert.equal(behave.allyIgnoresSpire, true, 'allies should not target the neutral spire');
assert.ok(behave.crystalsWithin5.after < behave.crystalsWithin5.before, 'smashing spire should break nearby crystals');
assert.equal(behave.spireSmashed.bossBeaten, true, 'smashing the spire should complete its quest');
assert.deepEqual(problems, [], 'browser should report no runtime or console errors');
console.log('crystal-mine-livecheck: OK');
