// node tools/browserTest.mjs --script tools/scratch/r106-occupy-livecheck.mjs
// R106 browser verification (2026-09-30): `Level.occupyCell()`'s immediate water and
// RejuvenatingSteps effects through `occupyTeleportedCharacter` (ROADMAP R106, coverage row
// `coverage/rows-terrain-traps-and-levelgen.md` "R106 water effects"/"R106 Rejuvenating
// Steps"; Java `levels/Level.java` occupyCell+pressCell, `actors/buffs/Burning.java`,
// `actors/buffs/Ooze.java`, `levels/features/HighGrass.java`, tag v3.3.8):
//  - water: an unacted Burning/Ooze is forced through exactly one tick (Burning: the port's
//    uniform `Random.int(1, 4+depth/4)` = Java's NormalIntRange(1, 3+scalingDepth()/4) since
//    int() is [min,max); Ooze: the depth curve with the sub-depth-5 coin flip) and BOTH
//    effects then detach - Java's `Burning.act()` tail detaches on water in the same call;
//    an already-acted marker (set when the effect ticked earlier in the turn) suppresses the
//    damage and only detaches (Java's `acted && water && !flying` entry cliff).
//  - RejuvenatingSteps (huntress, rank 1): GRASS/EMBERS destinations grow HIGH_GRASS, which
//    pressCell's HighGrass.trample immediately furrows for the Huntress (Java
//    FURROWED_GRASS == this port's HIGH_GRASS terrain + furrowedGrass set membership, no
//    drops) with +(3-rank) persistent counter and a 15-5*rank cooldown; a cooldown-active
//    plain-GRASS destination is untouched; counter>=200 and !regenOn both take the
//    already-furrowed branch without incrementing the counter.
// All cells are picked FOV-visible, trap/feature/web/creature-free and distinct; every case
// runs synchronously inside one eval (no turns pass, so acted markers/cooldown/counter state
// is exactly what each case set up).
const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PICKER = `const pickStats = { examined: 0, bounds: 0, exclude: 0, terrain: 0, trap: 0, feature: 0, web: 0, creature: 0, fovFail: 0, ok: 0, hist: {} };
		out.pickStats = pickStats;
		out.heroPos = [s.hero.x, s.hero.y];
		out.levelSize = [s.level.width, s.level.height];
		const pick = (terrainId, exclude, useFov = true) => {
		const want = Array.isArray(terrainId) ? terrainId : [terrainId];
		const cx = s.hero.x, cy = s.hero.y, found = [];
		for (let r = 1; r <= 14; r++) {
			for (let dy = -r; dy <= r; dy++) {
				for (let dx = -r; dx <= r; dx++) {
					if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
					const x = cx + dx, y = cy + dy;
					pickStats.examined++;
					if (x < 1 || y < 1 || x >= s.level.width - 1 || y >= s.level.height - 1) { pickStats.bounds++; continue; }
					if (exclude.some((c) => c.x === x && c.y === y)) { pickStats.exclude++; continue; }
					const tv = s.level.get(x, y);
					pickStats.hist[tv] = (pickStats.hist[tv] || 0) + 1;
					if (!want.includes(tv)) { pickStats.terrain++; continue; }
					const cell = s.level.index(x, y);
					if (s.trapKinds.has(cell)) { pickStats.trap++; continue; }
					if (s.portedFeatures.kindAt(cell)) { pickStats.feature++; continue; }
					if (s.web.volumeAt(x, y) > 0) { pickStats.web++; continue; }
					if (s.creatureAt(x, y)) { pickStats.creature++; continue; }
					if (useFov && !s.fov.isVisible(x, y)) { pickStats.fovFail++; continue; }
					pickStats.ok++;
					found.push({ x, y });
				}
			}
		}
		return found;
	};`;

export default async function (game) {
	// Class select is badge-gated on a fresh save (Java `HeroClass.isUnlocked()`: only Warrior
	// opens by default, every other class needs its unlock badge - `classes.ts`), so a bare
	// tap on slot 3 is a no-op and the run silently starts a Warrior (the trample leg then
	// correctly reverts the growth to plain grass, as any non-Huntress would). Grant the
	// huntress badge (`unlock_huntress`: counter "throws" >= 10, `content/badges.mwl`) straight
	// into the persisted meta slot BEFORE class select constructs its `loadBadges()` snapshot,
	// then drive `startGame`'s own flow by hand so the grant lands first. Test setup only -
	// nothing about the port is bypassed.
	await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout: 90000 });
	const grant = await game.eval(`(() => {
		const key = 'mwg-save:spd-meta:meta';
		let data = null;
		try { data = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { data = null; }
		if (!data || typeof data !== 'object' || !data.state || typeof data.state !== 'object') {
			data = { meta: { version: 1, savedAt: Date.now() }, state: { counts: [] } };
		}
		if (!Array.isArray(data.state.counts)) data.state.counts = [];
		const hit = data.state.counts.find((c) => Array.isArray(c) && c[0] === 'throws');
		if (hit) hit[1] = Math.max(Number(hit[1]) || 0, 10);
		else data.state.counts.push(['throws', 10]);
		data.meta = { version: 1, savedAt: Date.now() };
		localStorage.setItem(key, JSON.stringify(data));
		return data.state.counts;
	})()`);
	console.log('R106 huntress unlock grant (throws -> 10):', JSON.stringify(grant));
	await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 90000 });
	// wait for the class select heading without tapping it (startGame uses the internal pollText)
	for (let i = 0; ; i++) {
		if (await game.findText('choisissez votre h|choose your hero')) break;
		if (i > 300) throw new Error('class select never appeared');
		await settle(300);
	}
	await settle(800);
	// Unlock on the scene's OWN badge snapshot too (its `loadBadges()` could predate the
	// localStorage grant; the portrait click reads `this.badges` live, so an increment here
	// is enough to open the slot). Tap the huntress portrait at its real bounds - browserTest's
	// fixed slot fractions silently miss (a missed slot-0 tap still starts the default Warrior,
	// so staleness there is undetectable by the smoke path).
	const badgeState = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		s['badges'].increment('throws', 10);
		return { unlocked: s['badges'].unlocked('unlock_huntress'), count: s['badges'].count('throws') };
	})()`);
	console.log('R106 class-select badge state:', JSON.stringify(badgeState));
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
	console.log('R106 portraits:', JSON.stringify(portrait));
	if (portrait.count !== 6 || !portrait.hits[3]) throw new Error('portrait walk failed: ' + JSON.stringify(portrait));
	await game.tap(portrait.hits[3].fx, portrait.hits[3].fy); // classes.mwl order: warrior, mage, rogue, huntress, duelist, cleric
	await settle(800);
	const sel = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		return { selected: s['selected'], unlocked: s['badges'].unlocked('unlock_huntress'), raw: localStorage.getItem('mwg-save:spd-meta:meta') };
	})()`);
	console.log('R106 class select state:', JSON.stringify(sel));
	if (sel.selected !== 'huntress') throw new Error('huntress portrait not selected: ' + JSON.stringify(sel));
	await game.tapText('^commencer$|^start$', { timeout: 90000 });
	await game.waitFor('!!(window.__MWG__.currentScene && window.__MWG__.currentScene["hero"] && window.__MWG__.currentScene["creatures"])', { timeout: 90000 });
	// Run-start InterlevelScene curtain (same wait as the R005/R073/R075 checks): the dungeon
	// scene is current and live before the curtain clears, but a screenshot taken inside it
	// captures the fade overlay instead of the level (run 5's water PNG did exactly that).
	let curtain = true;
	for (let i = 0; curtain && i < 50; i++) {
		await settle(200);
		curtain = await game.eval(`!!(window.__MWG__.currentScene && window.__MWG__.currentScene['interlevel'])`);
	}
	if (curtain) throw new Error('InterlevelScene curtain never cleared after start');
	await settle(400);

	// ---- eval 1: sanity, cell picks, water cases (A1-A5) -------------------
	const water = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const out = { errors: [] };
		const bad = (m) => out.errors.push(m);
		const WATER = 3, FLOOR = 1, GRASS = 5, TILE = 16;
		out.depth = s.depth;
		out.heroClass = s.heroClass;
		// only monsters carry a 'flying' field (monsterSpawn.ts); the hero has none, so the
		// seam's '!creature.flying' reads undefined - coerce for a meaningful record
		out.flying = !!s.hero.flying;
		out.ring = s.effectiveRing();
		out.rank = s.talentRank('rejuvenating_steps');
		out.regenOn = s.regenOn();
		if (s.heroClass !== 'huntress') bad('heroClass ' + s.heroClass);
		if (s.hero.flying) bad('hero is flying');
		if (typeof s.occupyTeleportedCharacter !== 'function') { bad('seam missing'); return out; }

		${PICKER}

		// Water cell: natural first (FOV-visible, then any visibility), else converted floor.
		// The 'used' accumulator claims every cell so later picks stay distinct; the FOV tiering
		// and the water last-resort tier exist because one spawn (run 3) found neither grass
		// nor floor inside its visible radius - FOV only affects PNG legibility, not the logic.
		const used = [];
		const take = (terrain, useFov = true) => {
			const got = pick(terrain, used, useFov);
			used.push(...got);
			return got;
		};
		let w = take(WATER)[0] || take(WATER, false)[0] || null;
		if (!w) {
			w = take(FLOOR)[0] || take(FLOOR, false)[0];
			if (!w) { bad('no convertible floor'); return out; }
			s.level.set(w.x, w.y, WATER);
			s.restitchTilesAround(w.x, w.y);
			w.converted = true;
		}
		out.water = { x: w.x, y: w.y, converted: !!w.converted };

		// four distinct grass cells (natural grass first, then converted floor/water) + one
		// spare cell for the embers case (eval 2 re-sets its terrain, any cell will do)
		let grass = take(GRASS).concat(take(GRASS, false));
		const conv = take(FLOOR).concat(take(FLOOR, false)).concat(take(WATER, false));
		while (grass.length < 4 && conv.length) {
			const c = conv.shift();
			s.level.set(c.x, c.y, GRASS);
			s.restitchTilesAround(c.x, c.y);
			c.converted = true;
			grass.push(c);
		}
		if (grass.length < 4) { bad('only ' + grass.length + ' grass cells'); return out; }
		const emb = conv.shift() || take(FLOOR, false)[0] || take(WATER, false)[0];
		if (!emb) { bad('no spare cell for embers'); return out; }
		out.cells = { water: w, grass: grass.slice(0, 4), embers: emb };
		out.converted = [w, ...grass.slice(0, 4)].filter((c) => c.converted).length;
		window.__R106 = { cells: out.cells };

		// ---- phase A: water forced act then detach ------------------------
		const place = () => s.sprite(s.hero).position.set(s.hero.x * TILE, s.hero.y * TILE);
		s.hero.x = w.x; s.hero.y = w.y; place();
		const occupy = () => s.occupyTeleportedCharacter(s.hero);
		const buff = (k) => s.hero.buffs[k] !== undefined;
		let hp0 = 0;

		// A1 fresh Burning: forced tick (1..3 at depth<5) then detach
		delete s.hero.buffs.burningActed;
		s.hero.buffs.burning = 6;
		s.hero.hp = s.hero.maxHp;
		hp0 = s.hero.hp;
		occupy();
		out.A1 = { delta: hp0 - s.hero.hp, burning: buff('burning'), acted: buff('burningActed') };

		// A2 already-acted Burning: detach only, no second hit
		s.hero.buffs.burning = 6;
		s.hero.buffs.burningActed = 1;
		s.hero.hp = s.hero.maxHp;
		hp0 = s.hero.hp;
		occupy();
		out.A2 = { delta: hp0 - s.hero.hp, burning: buff('burning'), acted: buff('burningActed') };

		// A3 fresh Ooze x8: coin-flip tick (0..1 below depth 5) then detach each time
		out.A3 = { deltas: [], gone: true };
		for (let i = 0; i < 8; i++) {
			delete s.hero.buffs.oozeActed;
			s.hero.buffs.ooze = 9999;
			s.hero.hp = s.hero.maxHp;
			hp0 = s.hero.hp;
			occupy();
			out.A3.deltas.push(hp0 - s.hero.hp);
			if (buff('ooze')) out.A3.gone = false;
		}

		// A4 already-acted Ooze: detach only
		s.hero.buffs.ooze = 9999;
		s.hero.buffs.oozeActed = 1;
		s.hero.hp = s.hero.maxHp;
		hp0 = s.hero.hp;
		occupy();
		out.A4 = { delta: hp0 - s.hero.hp, ooze: buff('ooze'), acted: buff('oozeActed') };

		// A5 both fresh on one landing: Java occupyCell runs both act()s - both tick, both detach
		s.hero.buffs.burning = 6;
		s.hero.buffs.ooze = 9999;
		delete s.hero.buffs.burningActed;
		delete s.hero.buffs.oozeActed;
		s.hero.hp = s.hero.maxHp;
		hp0 = s.hero.hp;
		occupy();
		out.A5 = { delta: hp0 - s.hero.hp, burning: buff('burning'), ooze: buff('ooze') };

		out.finalHp = s.hero.hp;
		out.maxHp = s.hero.maxHp;
		return out;
	})()`);
	console.log('R106 water phase:', JSON.stringify(water));
	// Push display state (scene.refresh() -> statusPane.update) before the shot: the forced
	// ticks above run outside the turn loop, so the HUD would otherwise screenshot its
	// pre-eval values (run 6's water PNG still read 20/20 with hero.hp already 17).
	await game.eval(`window.__MWG__.currentScene.refresh()`);
	await settle(700);
	await game.screenshot('r106-water.png');

	// ---- eval 2: RejuvenatingSteps cases (B1-B5) --------------------------
	const cells = water.cells;
	const steps = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const out = { errors: [] };
		const bad = (m) => out.errors.push(m);
		const GRASS = 5, HIGH = 6, EMBERS = 8, TILE = 16;
		const cells = ${JSON.stringify(cells)};
		if (!cells) { bad('no cells from eval 1'); return out; }
		const place = () => s.sprite(s.hero).position.set(s.hero.x * TILE, s.hero.y * TILE);
		const occupy = () => s.occupyTeleportedCharacter(s.hero);
		const idx = (c) => s.level.index(c.x, c.y);
		const get = (c) => s.level.get(c.x, c.y);
		const rec = (c) => ({
			terrain: get(c),
			furrowed: s.furrowedGrass.has(idx(c)),
			counter: s.hero.buffs.rejuvenatingStepsFurrow ?? 0,
			cooldown: s.hero.buffs.rejuvenatingStepsCooldown,
		});

		// rank 1 => counter +2, cooldown 10; fresh regeneration (regenOn true)
		s.talentRanks['rejuvenating_steps'] = 1;
		out.rank = s.talentRank('rejuvenating_steps');
		out.regenOnStart = s.regenOn();
		delete s.hero.buffs.rejuvenatingStepsCooldown;
		delete s.hero.buffs.rejuvenatingStepsFurrow;

		// B1 grow + immediate furrow on plain GRASS
		const g1 = cells.grass[0];
		s.hero.x = g1.x; s.hero.y = g1.y; place();
		occupy();
		out.B1 = rec(g1);

		// B2 cooldown still active: the next plain-GRASS destination stays untouched
		const g2 = cells.grass[1];
		s.hero.x = g2.x; s.hero.y = g2.y; place();
		occupy();
		out.B2 = rec(g2);

		// B3 counter >= 200: already-furrowed branch, counter unchanged
		delete s.hero.buffs.rejuvenatingStepsCooldown;
		s.hero.buffs.rejuvenatingStepsFurrow = 200;
		const g3 = cells.grass[2];
		s.hero.x = g3.x; s.hero.y = g3.y; place();
		occupy();
		out.B3 = rec(g3);

		// B4 EMBERS destination grows too, fresh counter
		delete s.hero.buffs.rejuvenatingStepsCooldown;
		delete s.hero.buffs.rejuvenatingStepsFurrow;
		const emb = cells.embers;
		s.level.set(emb.x, emb.y, EMBERS);
		s.restitchTilesAround(emb.x, emb.y);
		out.embersPre = get(emb);
		s.hero.x = emb.x; s.hero.y = emb.y; place();
		occupy();
		out.B4 = rec(emb);

		// B5 !regenOn: already-furrowed branch, counter unchanged
		delete s.hero.buffs.rejuvenatingStepsCooldown;
		delete s.hero.buffs.rejuvenatingStepsFurrow;
		s.regeneration.lockLeft = 0;
		out.regenOff = s.regenOn();
		const g4 = cells.grass[3];
		s.hero.x = g4.x; s.hero.y = g4.y; place();
		occupy();
		out.B5 = rec(g4);
		s.regeneration.lockLeft = null; // restore the fresh state

		out.finalBuffs = {
			cooldown: s.hero.buffs.rejuvenatingStepsCooldown,
			counter: s.hero.buffs.rejuvenatingStepsFurrow ?? 0,
		};
		return out;
	})()`);
	console.log('R106 steps phase:', JSON.stringify(steps));
	// Same display-state push: shows hero.hp 17/20 and the rejuvenatingStepsCooldown buff
	// icon (time cell, dark-green tint) that the data above already proves is armed.
	await game.eval(`window.__MWG__.currentScene.refresh()`);
	await settle(700);
	await game.screenshot('r106-steps.png');

	// ---- node-side assertions --------------------------------------------
	const checks = [];
	const check = (name, ok, detail = '') => checks.push({ name, ok: !!ok, detail });
	for (const e of water.errors ?? []) check('water eval: ' + e, false);
	for (const e of steps.errors ?? []) check('steps eval: ' + e, false);

	const burnMax = 3 + Math.floor((water.depth ?? 1) / 4); // Random.int(1, 4+depth/4) exclusive top
	check('game state: huntress, grounded, no ring', water.heroClass === 'huntress' && water.flying === false && water.ring === null,
		JSON.stringify({ class: water.heroClass, flying: water.flying, ring: water.ring, depth: water.depth }));
	check('game state: rank 1 + regen on before steps', steps.rank === 1 && steps.regenOnStart === true,
		JSON.stringify({ startRank: water.rank, rank: steps.rank, regenOn: steps.regenOnStart }));

	// water phase
	check('A1 fresh Burning: forced tick then detach', water.A1 && water.A1.delta >= 1 && water.A1.delta <= burnMax && !water.A1.burning && !water.A1.acted,
		'delta ' + (water.A1 ? water.A1.delta : '?') + ' (want 1..' + burnMax + '), burning/acted flags ' + JSON.stringify(water.A1));
	check('A2 acted Burning: no second hit, detach', water.A2 && water.A2.delta === 0 && !water.A2.burning && !water.A2.acted,
		JSON.stringify(water.A2));
	const a3sum = water.A3 ? water.A3.deltas.reduce((a, b) => a + b, 0) : -1;
	check('A3 fresh Ooze x8: tick 0/1 each, at least one hit, all detached',
		water.A3 && water.A3.gone && water.A3.deltas.length === 8 && water.A3.deltas.every((d) => d === 0 || d === 1) && a3sum >= 1,
		'deltas [' + (water.A3 ? water.A3.deltas.join(',') : '?') + '] gone ' + (water.A3 ? water.A3.gone : '?'));
	check('A4 acted Ooze: no second hit, detach', water.A4 && water.A4.delta === 0 && !water.A4.ooze && !water.A4.acted,
		JSON.stringify(water.A4));
	check('A5 both fresh: both tick (1..' + (burnMax + 1) + ') and both detach',
		water.A5 && water.A5.delta >= 1 && water.A5.delta <= burnMax + 1 && !water.A5.burning && !water.A5.ooze,
		JSON.stringify(water.A5));

	// steps phase: expected net states (terrain 6 = HIGH_GRASS storage for Java FURROWED_GRASS)
	const want = (r, terrain, furrowed, counter, cooldown, label) =>
		check(label, r && r.terrain === terrain && r.furrowed === furrowed && r.counter === counter && r.cooldown === cooldown,
			JSON.stringify(r) + ' want t' + terrain + ' f' + furrowed + ' c' + counter + ' cd' + cooldown);
	want(steps.B1, 6, true, 2, 10, 'B1 grass grows + furrows, counter +2 (3-rank), cooldown 10');
	want(steps.B2, 5, false, 2, 10, 'B2 cooldown active: plain grass untouched');
	want(steps.B3, 6, true, 200, 10, 'B3 counter>=200: furrowed branch, counter unchanged');
	check('B4 embers pre-state is EMBERS', steps.embersPre === 8, 'got ' + steps.embersPre);
	want(steps.B4, 6, true, 2, 10, 'B4 embers grows + furrows, counter reset then +2');
	check('B5 regen locked', steps.regenOff === false, 'regenOn() after lockLeft=0: ' + steps.regenOff);
	want(steps.B5, 6, true, 0, 10, 'B5 !regenOn: furrowed branch, no counter gain');

	const errors = game.consoleErrors();
	check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));

	const failed = checks.filter((c) => !c.ok);
	for (const c of checks) console.log((c.ok ? 'PASS' : 'FAIL') + ' ' + c.name + (c.detail ? ' - ' + c.detail : ''));
	if (failed.length) {
		console.log('R106 FAIL: ' + failed.length + ' of ' + checks.length + ' checks (depth ' + water.depth + ', water ' + JSON.stringify(water.water) + ')');
	} else {
		console.log('R106 PASS: water forced ticks (fresh 1-' + burnMax + ' dmg then detach, acted 0 dmg detach, ooze x8) + RejuvenatingSteps grow/furrow/counter/cooldown ladder (fr)');
	}
}
