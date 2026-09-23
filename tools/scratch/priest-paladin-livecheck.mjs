// Throwaway (tools/scratch): live-verify the 6 PRIEST/PALADIN subclass Cleric spells in the built
// game (owed per PORT_COVERAGE.md's Cleric-subclass row: "not yet browser-verified live").
// Run after `npm run build`:  node tools/scratch/priest-paladin-livecheck.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const executablePath = path.join(process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local', 'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe');
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=priest-paladin', { waitUntil: 'load', timeout: 120000 });
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

const setup = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	s['heroClass'] = 'cleric';
	s['bag'].add({ id: 'holyTome', quantity: 1, identified: true, level: 3, charge: 999 });
	s['hero'].hp = s['hero'].maxHp = 999;
	s['progression'].level = 20;
	return { heroClass: s['heroClass'], hasTome: s['bag'].find('holyTome') !== undefined };
});
console.log('setup', JSON.stringify(setup));

async function tryPriest() {
	return page.evaluate(async () => {
		const s = window.__MWG__.currentScene;
		const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
		s['advancement']['choices'].set(0, 'priest');
		s['talentRanks']['holy_lance'] = 3;
		s['talentRanks']['hallowed_ground'] = 3;
		s['talentRanks']['mnemonic_prayer'] = 3;
		const out = {};

		// HolyLance: spawn a target, cast at it, expect damage + lanceCooldown armed.
		const at = { x: s['hero'].x + 2, y: s['hero'].y };
		if (s['level'].passable(at.x, at.y) && !s['creatureAt'](at.x, at.y)) {
			const target = s['spawnMonster']('rat', at);
			target.hp = target.maxHp = 50;
			const before = target.hp;
			s['resolveHolyLance'](at);
			out.holyLance = { damageDealt: before - target.hp, cooldownArmed: s['hero'].buffs['lanceCooldown'] !== undefined };
			s['kill'](target);
		}
		delete s['hero'].buffs['lanceCooldown'];

		// MnemonicPrayer: put a positive buff on the hero, extend it via prayer at own cell.
		s['hero'].buffs['haste'] = 5;
		s['resolvePrayer']({ x: s['hero'].x, y: s['hero'].y });
		out.mnemonicPrayer = { hasteExtended: (s['hero'].buffs['haste'] ?? 0) > 5 };
		delete s['hero'].buffs['haste'];

		// HallowedGround: cast on own cell, expect a heal/shield burst (hero already at max hp -> shield).
		s['hero'].hp = s['hero'].maxHp;
		s['heroBarrier'].clear?.();
		s['resolveHallowedGround']({ x: s['hero'].x, y: s['hero'].y });
		out.hallowedGround = { barrierAfter: s['heroBarrier'].total };
		return out;
	});
}

async function tryPaladin() {
	return page.evaluate(async () => {
		const s = window.__MWG__.currentScene;
		s['advancement']['choices'].set(0, 'paladin');
		s['talentRanks']['lay_on_hands'] = 3;
		s['talentRanks']['aura_of_protection'] = 3;
		s['talentRanks']['wall_of_light'] = 3;
		const out = {};

		// LayOnHands: hurt the hero, heal adjacent (self).
		s['hero'].hp = Math.max(1, s['hero'].maxHp - 30);
		const before = s['hero'].hp;
		s['resolveLayOnHands']({ x: s['hero'].x, y: s['hero'].y });
		out.layOnHands = { healed: s['hero'].hp - before };

		// AuraOfProtection: cast, expect buff armed and damage reduced through auraProtectedDamage.
		delete s['hero'].buffs['auraProtection'];
		s['resolveAura']();
		out.auraOfProtection = { armed: s['hero'].buffs['auraProtection'] !== undefined };
		const raw = 100;
		out.auraOfProtection.reduced = s['auraProtectedDamage'](s['hero'], raw) < raw;

		// WallOfLight: find a passable direction with a passable perpendicular neighbour, spawn a
		// hostile there, cast toward the aim cell, expect paralysis.
		let dir = null, victimAt = null;
		for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const cand = { x: s['hero'].x + 2 * ddx, y: s['hero'].y + 2 * ddy };
			const perp = { x: cand.x - ddy, y: cand.y + ddx };
			if (s['level'].passable(cand.x, cand.y) && s['fov'].isVisible(cand.x, cand.y)
				&& s['level'].passable(perp.x, perp.y) && !s['creatureAt'](perp.x, perp.y)) { dir = cand; victimAt = perp; break; }
		}
		let paralyzed = null, victimSpawned = false;
		let victimPos = null, heroPos = null;
		if (dir) {
			const victim = s['spawnMonster']('rat', victimAt);
			victimSpawned = true;
			heroPos = { x: s['hero'].x, y: s['hero'].y };
			victimPos = { x: victim.x, y: victim.y, kind: victim.kind, isNPC: victim.isNPC, isAlly: victim.isAlly, hp: victim.hp };
			out.creatureAtCheck = s['creatureAt'](victimAt.x, victimAt.y) === victim;
			out.creatureAtOtherOrder = s['creatureAt'](victimAt.y, victimAt.x) === victim;
			out.fovAtDir = s['fov'].isVisible(dir.x, dir.y);
			out.subclassNow = s['subclass']();
			out.rankNow = s['talentRank']('wall_of_light');
			s['refresh']();
			// Direct hit: aim exactly at the victim's own cell (i=0 term), should always land.
			s['resolveWallOfLight'](victimAt);
			paralyzed = victim.buffs['paralysis'] !== undefined;
			out.wallOfLightDirectHitParalysis = paralyzed;
			delete s['hero'].buffs['lightWallActive'];
			delete victim.buffs['paralysis'];
			s['resolveWallOfLight'](dir);
			paralyzed = victim.buffs['paralysis'] !== undefined;
			out.wallOfLightVictimBuffsAfter = JSON.stringify(victim.buffs);
			out.wallOfLightHalf = Math.floor((1 + 2 * Math.min(3, s['talentRanks']['wall_of_light'])) / 2);
			// Manually replicate the exact loop from resolveWallOfLight to see where it diverges.
			const dx2 = Math.sign(dir.x - s['hero'].x), dy2 = Math.sign(dir.y - s['hero'].y);
			const perpX2 = -dy2, perpY2 = dx2;
			const w2 = 1 + 2 * Math.min(3, s['talentRanks']['wall_of_light']);
			const half2 = Math.floor(w2 / 2);
			const hits = [];
			for (let i = -half2; i <= half2; i++) {
				const cx = dir.x + perpX2 * i, cy = dir.y + perpY2 * i;
				const v = s['creatureAt'](cx, cy);
				if (v) hits.push({ i, cx, cy, kind: v.kind, isHero: v.isHero, isAlly: v.isAlly, isNPC: v.isNPC, hp: v.hp });
			}
			out.manualLoopHits = hits;
			out.dxdy2 = { dx2, dy2, perpX2, perpY2 };
			s['kill'](victim);
		}
		out.wallOfLight = { armed: s['hero'].buffs['lightWallActive'] !== undefined, paralyzed, victimSpawned, dir, victimAt, heroPos, victimPos };
		return out;
	});
}

const priest = await tryPriest();
console.log('priest', JSON.stringify(priest));
const paladin = await tryPaladin();
console.log('paladin', JSON.stringify(paladin));
console.log('problems', JSON.stringify(problems));
await browser.close();
