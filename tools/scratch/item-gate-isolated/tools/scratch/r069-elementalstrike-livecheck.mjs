// node tools/browserTest.mjs --script tools/scratch/r069-elementalstrike-livecheck.mjs
// R069 browser verification (2026-09-30): ElementalStrike's cone presentation (ROADMAP R069,
// coverage row `coverage/rows-monsters-bosses-and-combat.md` "ElementalStrike cone sound and
// ray presentation"; Java `actors/hero/abilities/duelist/ElementalStrike.activate()` +
// `sprites/MagicMissile.java`, tag v3.3.8):
//  - the cast cues CHARGEUP and launches one shared travel sprite along EACH DISTINCT outer
//    cone ray (`cone.outer` is a set of rim cells; the loop spawns `spawnBoltTo(hero, landing,
//    0xffffff, ..., 200)` per rim whose landing differs from the source) - asserted as
//    boltCount === rimRayCount with every bolt white, dot-sprite, and at MagicMissile.SPEED
//    200 px/s;
//  - a landed primary (foe placed on the nearest-grid-direction neighbour, always inside the
//    +-32.5 deg wedge) layers HIT_STRONG over the ordinary HIT and drops the foe's hp;
//  - the charged cost is 25 (def.baseChargeUse, no discount branch on a fresh hero).
// The audio leg is observed through a window-level HTMLMediaElement.prototype.play spy
// installed before the first cast. Every clip is inlined as a `data:audio/mpeg;base64,...`
// URI (vite `assetsInlineLimit`, for `file://` support), so the cue NAME survives only as
// the URI's bytes: this script rebuilds the expected URI from
// `src/assets/audio/sounds/<cue>.mp3` on the Node side and matches the played URI against
// it exactly - a played `chargeup` URI IS the CHARGEUP cue, byte for byte. The cost check
// reads the rim-loop's recorded charge (25 is deducted before the loop), not the final
// charge, because `spendHeroAction` also runs `recoverArmorCharge`
// (`ClassArmor.Charger.act()`, 100/500 per turn = +0.2) before the activation returns.
// forceHit makes the primary swing deterministic.
// Class select is badge-gated (Java `HeroClass.isUnlocked()`), so the duelist unlock badge
// (`unlock_duelist`: counter "weapon_plus2" >= 1, `content/badges.mwl`) is granted into the
// persisted meta slot before the select scene snapshots it - test setup only.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Byte-exact data-URI fingerprints of the three cues this cast can play - the same string
// `audio.ts`'s `asset('sounds', ...)` hands to `new Audio(...)` (verified against a run
// log: every played URI in the whole session is one of these three).
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const soundUri = (name) =>
	'data:audio/mpeg;base64,' +
	readFileSync(path.join(repoRoot, 'src', 'assets', 'audio', 'sounds', name + '.mp3')).toString('base64');
const CUE = { chargeup: soundUri('chargeup'), hit: soundUri('hit'), hit_strong: soundUri('hit_strong') };

/** Deep copy with the audio data URIs reduced to their lengths, so log lines stay readable. */
const sanitize = (v) => {
	if (typeof v === 'string') return v.startsWith('data:audio/') ? 'dataURI(len ' + v.length + ')' : v;
	if (Array.isArray(v)) return v.map(sanitize);
	if (v && typeof v === 'object') {
		const out = {};
		for (const [k, val] of Object.entries(v)) out[k] = sanitize(val);
		return out;
	}
	return v;
};

const PICKER = `const aim = (() => {
		const rings = [4, 3, 5, 2];
		const scan = (r, useFov) => {
			for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
				if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
				const x = s.hero.x + dx, y = s.hero.y + dy;
				pick.examined++;
				if (x < 1 || y < 1 || x >= s.level.width - 1 || y >= s.level.height - 1) { pick.bounds++; continue; }
				const tv = s.level.get(x, y);
				if (tv !== 1 && tv !== 5) { pick.terrain++; continue; }
				const cell = s.level.index(x, y);
				if (s.trapKinds.has(cell)) { pick.trap++; continue; }
				if (s.portedFeatures.kindAt(cell)) { pick.feature++; continue; }
				if (s.web.volumeAt(x, y) > 0) { pick.web++; continue; }
				if (s.creatureAt(x, y)) { pick.creature++; continue; }
				if (useFov && !s.fov.isVisible(x, y)) { pick.fovFail++; continue; }
				// quiet sector: fewest creatures within 5 of the aim, so the cone splashes
				// as little as possible and the ring stays legible in the screenshot
				let near = 0;
				for (const c of s.creatures) { if (c === s.hero) continue; if (Math.max(Math.abs(c.x - x), Math.abs(c.y - y)) <= 5) near++; }
				pick.ok++;
				return { x, y, ring: r, fov: useFov, nearCreatures: near };
			}
			return null;
		};
		for (const r of rings) { const got = scan(r, true); if (got) return got; }
		for (const r of rings) { const got = scan(r, false); if (got) return got; }
		return null;
	})();`;

const AUDIT = `if (!window.__R069audio) {
		window.__R069audio = { made: [], played: [] };
		try {
			const origAudio = window.Audio;
			const wrapped = function (src) { try { window.__R069audio.made.push(String(src)); } catch (e) {} return new origAudio(src); };
			wrapped.prototype = origAudio.prototype;
			window.Audio = wrapped;
			const origPlay = HTMLMediaElement.prototype.play;
			HTMLMediaElement.prototype.play = function () {
				try { window.__R069audio.played.push(String(this.currentSrc || this.src || '')); } catch (e) {}
				return origPlay.apply(this, arguments);
			};
		} catch (e) { out.errors.push('audio spy: ' + e.message); }
	}
	window.__R069audio.made.length = 0;
	window.__R069audio.played.length = 0;`;

export default async function (game) {
	// ---- boot + duelist unlock + class select ------------------------------
	await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout: 90000 });
	const grant = await game.eval(`(() => {
		const key = 'mwg-save:spd-meta:meta';
		let data = null;
		try { data = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { data = null; }
		if (!data || typeof data !== 'object' || !data.state || typeof data.state !== 'object') {
			data = { meta: { version: 1, savedAt: Date.now() }, state: { counts: [] } };
		}
		if (!Array.isArray(data.state.counts)) data.state.counts = [];
		const hit = data.state.counts.find((c) => Array.isArray(c) && c[0] === 'weapon_plus2');
		if (hit) hit[1] = Math.max(Number(hit[1]) || 0, 1);
		else data.state.counts.push(['weapon_plus2', 1]);
		data.meta = { version: 1, savedAt: Date.now() };
		localStorage.setItem(key, JSON.stringify(data));
		return data.state.counts;
	})()`);
	console.log('R069 duelist unlock grant (weapon_plus2 -> 1):', JSON.stringify(grant));
	await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 90000 });
	for (let i = 0; ; i++) {
		if (await game.findText('choisissez votre h|choose your hero')) break;
		if (i > 300) throw new Error('class select never appeared');
		await settle(300);
	}
	await settle(800);
	// The portrait click reads the scene's own badge snapshot, so the unlock needs an
	// increment there too. Portrait texture frames come out in classes.mwl order
	// (warrior, mage, rogue, huntress, duelist, cleric) -> index 4 is the duelist.
	const badgeState = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		s['badges'].increment('weapon_plus2', 1);
		return { unlocked: s['badges'].unlocked('unlock_duelist'), count: s['badges'].count('weapon_plus2') };
	})()`);
	console.log('R069 class-select badge state:', JSON.stringify(badgeState));
	const portrait = await game.eval(`(() => {
		const mwg = window.__MWG__, stage = mwg.app.stage, screen = mwg.app.renderer.screen;
		const hits = [];
		const walk = (n) => {
			const f = n.texture && n.texture.frame;
			if (n.visible !== false && f && f.x === 0 && f.y === 90 && f.width === 12 && f.height === 15) {
				const b = n.getBounds();
				if (b.width > 0 && b.height > 0) hits.push({ fx: (b.x + b.width / 2) / screen.width, fy: (b.y + b.height / 2) / screen.height });
			}
			for (const c of (n.children || [])) walk(c);
		};
		walk(stage);
		return { count: hits.length, hits };
	})()`);
	console.log('R069 portraits:', JSON.stringify(portrait));
	if (portrait.count !== 6 || !portrait.hits[4]) throw new Error('portrait walk failed: ' + JSON.stringify(portrait));
	await game.tap(portrait.hits[4].fx, portrait.hits[4].fy);
	await settle(800);
	const sel = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		return { selected: s['selected'], unlocked: s['badges'].unlocked('unlock_duelist') };
	})()`);
	console.log('R069 class select state:', JSON.stringify(sel));
	if (sel.selected !== 'duelist') throw new Error('duelist portrait not selected: ' + JSON.stringify(sel));
	await game.tapText('^commencer$|^start$', { timeout: 90000 });
	await game.waitFor('!!(window.__MWG__.currentScene && window.__MWG__.currentScene["hero"] && window.__MWG__.currentScene["creatures"])', { timeout: 90000 });
	// Run-start InterlevelScene curtain (same wait as the R005/R073/R075/R106 checks): a
	// screenshot taken inside the curtain captures the fade overlay instead of the level.
	let curtain = true;
	for (let i = 0; curtain && i < 50; i++) {
		await settle(200);
		curtain = await game.eval(`!!(window.__MWG__.currentScene && window.__MWG__.currentScene['interlevel'])`);
	}
	if (curtain) throw new Error('InterlevelScene curtain never cleared after start');
	await settle(400);

	// ---- eval 1: arm the ability, cast1 at range, record rays/bolts --------
	const cast1 = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const out = { errors: [] };
		const bad = (m) => out.errors.push(m);
		out.heroClass = s.heroClass;
		out.depth = s.depth;
		if (s.heroClass !== 'duelist') bad('heroClass ' + s.heroClass);
		if (typeof s.activateArmorAbility !== 'function') { bad('activateArmorAbility missing'); return out; }

		const pick = { examined: 0, bounds: 0, terrain: 0, trap: 0, feature: 0, web: 0, creature: 0, fovFail: 0, ok: 0 };
		out.pick = pick;
		${PICKER}
		if (!aim) { bad('no aim cell'); return out; }
		out.aim = aim;

		${AUDIT}

		// Force the ability slot the level-up flow would set at the Duelist's level 6
		// (test setup - the dispatch, def lookup, cost and charge gates all stay live),
		// then spy the two scene primitives the ray loop uses.
		s.armorAbility = 'elementalstrike';
		s.armorCharge = 100;
		const rays = [], bolts = [];
		const origConeRay = s.coneRay, origBolt = s.spawnBoltTo;
		s.coneRay = function (from, to, stop) {
			rays.push({ fx: from.x, fy: from.y, tx: to.x, ty: to.y, charge: s.armorCharge });
			return origConeRay.call(this, from, to, stop);
		};
		s.spawnBoltTo = function (from, to, tint, onArrive, art, speed) {
			bolts.push({ fx: from.x, fy: from.y, tx: to.x, ty: to.y, tint, art: art === undefined ? 'undefined' : art === null ? 'null' : 'object', speed });
			return origBolt.call(this, from, to, tint, onArrive, art, speed);
		};
		out.chargeBefore = s.armorCharge;
		out.projectilesBefore = s.projectiles.length;
		try { s.activateArmorAbility({ x: aim.x, y: aim.y }); } catch (e) { out.errors.push('cast1: ' + e.message); }
		out.chargeAfter = s.armorCharge;
		out.projectilesAfter = s.projectiles.length;
		delete s.coneRay;
		delete s.spawnBoltTo;
		out.heroPos = { x: s.hero.x, y: s.hero.y };
		out.rays = rays;
		out.bolts = bolts;
		out.audio = { made: window.__R069audio ? [...window.__R069audio.made] : [], played: window.__R069audio ? [...window.__R069audio.played] : [] };
		window.__R069aim = { x: aim.x, y: aim.y };
		return out;
	})()`);
	console.log('R069 cast1:', JSON.stringify(sanitize(cast1)));
	// Immediate shots: the bolt flight is only ~160 ms (32 game px at 200 px/s), so the
	// refresh/HUD roundtrip from run 1 arrived after landing and caught no dots. Two shots
	// at ~0 and ~50 ms bracket the flight window; the HUD 75% evidence comes from shot 2.
	await game.screenshot('r069-strike-a.png');
	await settle(50);
	await game.screenshot('r069-strike-b.png');
	await game.eval(`window.__MWG__.currentScene.refresh()`);

	// ---- eval 2: cast2 with a foe on the in-cone neighbour (HIT_STRONG) ----
	const cast2 = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const out = { errors: [] };
		const bad = (m) => out.errors.push(m);
		const aim = window.__R069aim;
		if (!aim) { bad('no stored aim'); return out; }
		out.aim = aim;
		window.__R069audio.made.length = 0;
		window.__R069audio.played.length = 0;

		const foe = s.creatures.find((c) => c !== s.hero && !c.isAlly && !c.isNPC && c.allyKind !== 'sheep' && c.hp > 0);
		if (!foe) { bad('no hostile creature on the level'); return out; }
		// Neighbour closest in bearing to the aim is always inside the +-32.5 deg wedge
		// (its angular sector contains the aim bearing itself), so the primary gate
		// foeInCone && chebyshev <= 1 holds once the foe stands there (the gate the
		// activation applies to the primary target).
		const adx = aim.x - s.hero.x, ady = aim.y - s.hero.y;
		const alen = Math.hypot(adx, ady) || 1;
		let best = null;
		for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
			if (!dx && !dy) continue;
			const x = s.hero.x + dx, y = s.hero.y + dy;
			if (!s.level.passable(x, y)) continue;
			const other = s.creatureAt(x, y);
			if (other && other !== foe) continue;
			const cos = (dx * adx + dy * ady) / (Math.hypot(dx, dy) * alen);
			if (!best || cos > best.cos) best = { x, y, cos };
		}
		if (!best) { bad('no open neighbour cell'); return out; }
		foe.x = best.x; foe.y = best.y;
		s.sprite(foe).position.set(best.x * 16, best.y * 16);
		foe.hp = foe.maxHp;
		out.foe = { kind: foe.kind, hpBefore: foe.hp, maxHp: foe.maxHp, cell: [best.x, best.y], cos: Math.round(best.cos * 1000) / 1000 };

		const rays = [], bolts = [];
		const origConeRay = s.coneRay, origBolt = s.spawnBoltTo;
		s.coneRay = function (from, to, stop) {
			rays.push({ fx: from.x, fy: from.y, tx: to.x, ty: to.y, charge: s.armorCharge });
			return origConeRay.call(this, from, to, stop);
		};
		s.spawnBoltTo = function (from, to, tint, onArrive, art, speed) {
			bolts.push({ fx: from.x, fy: from.y, tx: to.x, ty: to.y, tint, art: art === undefined ? 'undefined' : art === null ? 'null' : 'object', speed });
			return origBolt.call(this, from, to, tint, onArrive, art, speed);
		};
		s.armorCharge = 100;
		out.chargeBefore = s.armorCharge;
		try { s.activateArmorAbility({ x: best.x, y: best.y }); } catch (e) { out.errors.push('cast2: ' + e.message); }
		out.chargeAfter = s.armorCharge;
		delete s.coneRay;
		delete s.spawnBoltTo;
		out.foeAfter = { hp: foe.hp, alive: foe.hp > 0 };
		out.rays = rays;
		out.bolts = bolts;
		out.audio = { made: [...window.__R069audio.made], played: [...window.__R069audio.played] };
		out.finalCharge = s.armorCharge;
		return out;
	})()`);
	console.log('R069 cast2:', JSON.stringify(sanitize(cast2)));
	await game.eval(`window.__MWG__.currentScene.refresh()`);
	await settle(350);
	await game.screenshot('r069-primary.png');

	// ---- node-side assertions --------------------------------------------
	const checks = [];
	const check = (name, ok, detail = '') => checks.push({ name, ok: !!ok, detail });
	for (const e of cast1.errors ?? []) check('cast1 eval: ' + e, false);
	for (const e of cast2.errors ?? []) check('cast2 eval: ' + e, false);

	check('game state: duelist hero, armed aim', cast1.heroClass === 'duelist' && !!cast1.aim,
		JSON.stringify({ class: cast1.heroClass, aim: cast1.aim, pick: cast1.pick }));

	// coneRay split (both casts): the trace phase runs at full charge, the cost is
	// deducted, then the rim loop re-traces every rim - so rim rays are the calls whose
	// recorded charge is post-deduction. The rim-loop charge is the authoritative cost
	// reading: the returned charge also carries `recoverArmorCharge`'s +0.2
	// (`ClassArmor.Charger.act()`, 100/500 per turn), which `spendHeroAction` runs before
	// the activation returns.
	const hero = cast1.heroPos ?? { x: -1, y: -1 };
	const fromHero = (r) => r.fx === hero.x && r.fy === hero.y;
	const rimRays = (cast1.rays ?? []).filter((r) => r.charge < cast1.chargeBefore && fromHero(r));
	const traceRays = (cast1.rays ?? []).filter((r) => r.charge === cast1.chargeBefore && fromHero(r));
	const rim2 = (cast2.rays ?? []).filter((r) => r.charge < cast2.chargeBefore);
	// Byte-exact URI match: a played data URI equal to CUE[name] IS that cue.
	const cueHit = (a, name) => (a?.played ?? []).some((u) => u === CUE[name]) || (a?.made ?? []).some((u) => u === CUE[name]);
	const cueLens = (a) => (a?.played ?? []).map((u) => u.length);

	// cast1: cost, CHARGEUP, one bolt per distinct outer rim ray
	check('C1 charge cost 25 (rim-loop charge)', rimRays.length > 0 && cast1.chargeBefore - rimRays[0].charge === 25,
		'charge ' + cast1.chargeBefore + ' -> rim ' + (rimRays[0] && rimRays[0].charge) + ' -> returned ' + cast1.chargeAfter);
	check('C1 CHARGEUP cued (byte-exact data URI)', cueHit(cast1.audio, 'chargeup'),
		'played uri lengths [' + cueLens(cast1.audio).join(' ') + '], chargeup = ' + CUE.chargeup.length);
	const rimKeys = rimRays.map((r) => r.tx + ',' + r.ty);
	const distinctRims = new Set(rimKeys).size;
	check('C1 distinct outer rim rays >= 2', rimRays.length >= 2 && distinctRims === rimRays.length,
		'rim ' + rimRays.length + ' distinct ' + distinctRims + ' trace ' + traceRays.length + ' rims [' + rimKeys.join(' ') + ']');
	const bolts1 = cast1.bolts ?? [];
	check('C1 one travel sprite per rim ray', bolts1.length === rimRays.length,
		'bolts ' + bolts1.length + ' vs rims ' + rimRays.length);
	check('C1 bolts are white dot sprites at 200 px/s',
		bolts1.length > 0 && bolts1.every((b) => b.tint === 0xffffff && b.speed === 200 && b.art === 'undefined' && (b.tx !== hero.x || b.ty !== hero.y)),
		JSON.stringify(bolts1.slice(0, 4)));
	check('C1 bolts added to the projectile list', cast1.projectilesAfter - cast1.projectilesBefore >= bolts1.length,
		'projectiles ' + cast1.projectilesBefore + ' -> ' + cast1.projectilesAfter);

	// cast2: primary strike layers HIT_STRONG over the ordinary HIT and lands damage
	check('C2 foe adjacent + in bearing', cast2.foe && cast2.foe.cos >= 0.9 && cast2.foe.cell &&
		Math.max(Math.abs(cast2.foe.cell[0] - (cast1.heroPos?.x ?? -9)), Math.abs(cast2.foe.cell[1] - (cast1.heroPos?.y ?? -9))) === 1,
		JSON.stringify(cast2.foe));
	check('C2 primary strike damaged the foe', cast2.foe && cast2.foeAfter && cast2.foeAfter.hp < cast2.foe.hpBefore,
		JSON.stringify({ before: cast2.foe && cast2.foe.hp, after: cast2.foeAfter && cast2.foeAfter.hp }));
	check('C2 HIT_STRONG layered over the ordinary HIT (both cued)', cueHit(cast2.audio, 'hit_strong') && cueHit(cast2.audio, 'hit'),
		'played uri lengths [' + cueLens(cast2.audio).join(' ') + '], hit = ' + CUE.hit.length + ', hit_strong = ' + CUE.hit_strong.length);
	check('C2 charge cost 25 again + one bolt per rim', rim2.length > 0 && cast2.chargeBefore - rim2[0].charge === 25 &&
		(cast2.bolts ?? []).length === rim2.length,
		'charge ' + cast2.chargeBefore + ' -> rim ' + (rim2[0] && rim2[0].charge) + ' -> returned ' + cast2.chargeAfter + ', bolts ' + (cast2.bolts ?? []).length + ' vs rims ' + rim2.length);

	const errors = game.consoleErrors();
	check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));

	const failed = checks.filter((c) => !c.ok);
	for (const c of checks) console.log((c.ok ? 'PASS' : 'FAIL') + ' ' + c.name + (c.detail ? ' - ' + c.detail : ''));
	if (failed.length) {
		console.log('R069 FAIL: ' + failed.length + ' of ' + checks.length + ' checks (aim ' + JSON.stringify(cast1.aim) + ')');
	} else {
		console.log('R069 PASS: ' + checks.length + '/' + checks.length + ' - CHARGEUP, ' + rimRays.length + ' rim rays each with one white 200 px/s bolt, HIT_STRONG primary (fr)');
	}
}
