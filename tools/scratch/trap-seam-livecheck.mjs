// T63 batch-2 live check: the mob trap tails in `environmentFireTraps.ts` route
// through the shared `applyCharacterDamage` dispatch - the four direct-damage
// branches of `triggerMobTrapAt` (poisonDart/wornDart/grim/explosive else), the
// rockfall mob tail of `activateUtilityTrap`, and the whole `applyTrapBlast`
// neighbour loop. Verifies: cause mapping ('trap', 'fire' for explosive/blast),
// pierceArmor (Java traps roll DR at the caller), HP equations against the
// dispatch's dmg argument, the dispatch's NPC/sheep gates, grim's caller-side
// magicImmune gate, the caller-side spectatorFreeze rockfall gate, the dispatch
// wake, death buckets in `kill()`, and the trap still spending itself.
// node tools/browserTest.mjs --script tools/scratch/trap-seam-livecheck.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (say, label, ok, detail) => {
	say(`${ok ? 'PASS' : 'FAIL'} ${label}${detail === undefined ? '' : ` -> ${JSON.stringify(detail)}`}`);
	if (!ok) failures++;
};

export default async (game) => {
	const say = (m) => console.log(`[${game.browser}] ${m}`);
	const shots = 'tools/scratch/browser-test';

	await game.startGame();
	await game.waitFor('scene && scene.awaitingInput === true', { timeout: 20000 });

	// Attribution: every shared-dispatch call (target tag, damage, cause, armor flag)
	// and every `kill()` with its death bucket.
	await game.eval(`(() => {
		window.__SEAM__ = [];
		window.__KILLS__ = [];
		const orig = scene.applyCharacterDamage.bind(scene);
		scene.applyCharacterDamage = (c, dmg, opts) => {
			const r = orig(c, dmg, opts);
			window.__SEAM__.push({
				tag: c.__tag ?? null, kind: c.kind ?? null, ally: c.allyKind ?? null,
				hero: !!c.isHero, npc: !!c.isNPC, dmg, cause: opts.cause,
				pierce: opts.pierceArmor === true, r,
			});
			return r;
		};
		const origKill = scene.kill.bind(scene);
		scene.kill = (c, cause) => {
			window.__KILLS__.push({ tag: c.__tag ?? null, kind: c.kind ?? null, cause: cause ?? null });
			return origKill(c, cause);
		};
	})()`);

	// Cell pool + tagged spawns. The rockfall trio gets its own site: an origin
	// outside every room (path-flood <= 2 branch) at chebyshev >= 3 from the hero,
	// or failing that three cells of a room the hero is not in (room branch), so
	// the flood can only catch what this check puts there. The explosive trigger
	// keeps two tagged neighbours for the blast and every singleton sits chebyshev
	// >= 2 away, so no other assertion can be hit by stray blast damage.
	const setup = await game.eval(`(() => {
		const w = scene.level.width, h = scene.level.height;
		const idx = (x, y) => x + y * w;
		const hx = scene.hero.x, hy = scene.hero.y;
		const cheby = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
		const busy = new Set(scene.creatures.map(c => idx(c.x, c.y)));
		const freeCell = (x, y) => x >= 1 && y >= 1 && x < w - 1 && y < h - 1
			&& scene.level.passable(x, y) && !busy.has(idx(x, y)) && !scene.creatureAt(x, y)
			&& !scene.secrets.isSecret(x, y);
		const roomOf = (x, y) => scene.level.rooms.find(rm => x >= rm.left && x <= rm.right && y >= rm.top && y <= rm.bottom) ?? null;
		const heroRoom = roomOf(hx, hy);

		// rockfall site, level-wide: a corridor origin (no room => the <= 2 path-flood
		// branch) at chebyshev >= 3 from the hero with two free adjacent mates, else
		// three free cells of a room the hero is not in (the whole-room branch).
		let rock = null;
		for (let y = 1; y < h - 1 && !rock; y++) for (let x = 1; x < w - 1 && !rock; x++) {
			if (!freeCell(x, y) || roomOf(x, y)) continue;
			if (Math.max(Math.abs(x - hx), Math.abs(y - hy)) < 3) continue;
			const mates = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
				.map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
				.filter(p => freeCell(p.x, p.y));
			if (mates.length >= 2) rock = { origin: { x, y }, mates: mates.slice(0, 2) };
		}
		if (!rock) {
			for (const rm of scene.level.rooms.filter(rm => rm !== heroRoom)) {
				const cells = [];
				for (let y = rm.top; y <= rm.bottom; y++) for (let x = rm.left; x <= rm.right; x++) {
					if (freeCell(x, y)) cells.push({ x, y });
				}
				if (cells.length >= 3) rock = { origin: cells[0], mates: cells.slice(1, 3) };
			}
		}
		if (!rock) return { error: 'no rockfall site' };
		busy.add(idx(rock.origin.x, rock.origin.y));
		rock.mates.forEach(m => busy.add(idx(m.x, m.y)));

		// near-hero pool for the remaining spawns (rock cells are already busy above).
		const pool = [];
		for (let r = 1; r <= 16 && pool.length < 40; r++) {
			for (let dy = -r; dy <= r && pool.length < 40; dy++) {
				for (let dx = -r; dx <= r && pool.length < 40; dx++) {
					if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
					const x = hx + dx, y = hy + dy;
					if (freeCell(x, y)) pool.push({ x, y });
				}
			}
		}
		if (pool.length < 20) return { error: 'cell pool', found: pool.length };
		const take = (cell) => { const i = pool.indexOf(cell); if (i >= 0) pool.splice(i, 1); };

		// explosive trigger: a free cell with two free neighbours for blast targets.
		let blast = null;
		for (const z of pool) {
			const neighbours = pool.filter(p => p !== z && cheby(p, z) === 1);
			if (neighbours.length >= 2) { take(z); take(neighbours[0]); take(neighbours[1]); blast = { z, b1: neighbours[0], b2: neighbours[1] }; break; }
		}
		if (!blast) return { error: 'no blast site' };

		// singletons, clear of the blast by chebyshev >= 2.
		const singles = pool.filter(c => cheby(c, blast.z) >= 2).slice(0, 6);
		if (singles.length < 6) return { error: 'singletons', found: singles.length };
		singles.forEach(take);

		const spawn = (tag, cell) => { const m = scene.spawnMonster('rat', cell); m.__tag = tag; return m; };
		const ratA = spawn('ratA', singles[0]);
		const npcA = spawn('npcA', singles[1]); npcA.isNPC = true;
		const sheepA = scene.spawnMonster('sheep', singles[2], false, undefined, true, 'sheep'); sheepA.__tag = 'sheepA';
		const dartD = spawn('dartD', singles[3]);
		const grimR = spawn('grimR', singles[4]);
		const grimR2 = spawn('grimR2', singles[5]);
		const zapZ = spawn('zapZ', blast.z);
		const ratB = spawn('ratB', blast.b1);
		const npcB = spawn('npcB', blast.b2); npcB.isNPC = true;
		const rockRat = spawn('rockRat', rock.origin);
		const rockNpc = spawn('rockNpc', rock.mates[0]); rockNpc.isNPC = true;
		const rockSpec = spawn('rockSpec', rock.mates[1]);
		rockSpec.buffs['spectatorFreeze'] = {};
		window.__T__ = { ratA, npcA, sheepA, dartD, grimR, grimR2, zapZ, ratB, npcB, rockRat, rockNpc, rockSpec };
		return {
			pool: pool.length, rock, blast,
			hp: { ratA: ratA.hp, npcA: npcA.hp, sheepA: sheepA.hp, dartD: dartD.hp, grimR: grimR.hp, grimR2: grimR2.hp, zapZ: zapZ.hp, ratB: ratB.hp, npcB: npcB.hp, rockRat: rockRat.hp, rockNpc: rockNpc.hp, rockSpec: rockSpec.hp },
			max: { ratA: ratA.maxHp, grimR2: grimR2.maxHp },
		};
	})()`);
	say(`setup: ${JSON.stringify(setup)}`);
	check(say, 'spawns and both trap sites ready', !setup.error, setup);
	if (setup.error) { say(`${failures} FAILURE(S)`); return; }

	const clear = () => game.eval('window.__SEAM__.splice(0); window.__KILLS__.splice(0);');
	const seam = () => game.eval('window.__SEAM__.splice(0)');
	const seed = (tag, kind) => game.eval(`(() => {
		const c = window.__T__.${tag};
		const i = scene.level.index(c.x, c.y);
		scene.trapKinds.set(i, '${kind}');
		scene.spentTrapCells.delete(i);
		return { secret: scene.secrets.isSecret(c.x, c.y), spent: scene.spentTrapCells.has(i) };
	})()`);
	const fire = (tag) => game.eval(`scene['triggerMobTrapAt'](window.__T__.${tag})`);
	const hp = (tag) => game.eval(`window.__T__.${tag}.hp`);
	const at = (log, tag) => log.find(e => e.tag === tag);

	// --- A. poisonDart: dispatch attribution, exact HP equation, poison buff, wake.
	await clear();
	let s = await seed('ratA', 'poisonDart');
	check(say, 'ratA trap seeded unspent and unhidden', !s.secret && !s.spent, s);
	await game.eval('window.__T__.ratA.hp = 50; window.__T__.ratA.sleeping = true;');
	const aBefore = await hp('ratA');
	await fire('ratA');
	let log = await seam();
	let e = at(log, 'ratA');
	check(say, 'poison dart hit is attributed to the dispatch (cause trap, pierceArmor)', !!e && e.cause === 'trap' && e.pierce === true, e);
	const aAfter = await hp('ratA');
	check(say, 'ratA paid exactly the dispatched dmg', e && aAfter === aBefore - e.dmg, { before: aBefore, dmg: e && e.dmg, after: aAfter });
	check(say, 'ratA carries the dart poison and woke in the dispatch', await game.eval("window.__T__.ratA.buffs['poison'] !== undefined && window.__T__.ratA.sleeping === false"));
	check(say, 'surviving target still gets its hazard-assist mark after the dispatch', await game.eval("window.__T__.ratA.buffs['hazardAssist'] !== undefined"));

	// --- B. NPC never reaches the tail: entry gate, no dispatch call, no HP change.
	await clear();
	await seed('npcA', 'poisonDart');
	const bBefore = await hp('npcA');
	await fire('npcA');
	log = await seam();
	check(say, 'NPC trap step never reaches the dispatch', !at(log, 'npcA') && log.every(x => x.tag !== 'npcA'), log);
	check(say, 'NPC took no trap damage', (await hp('npcA')) === bBefore, await hp('npcA'));

	// --- C. sheep reaches the dispatch and is gated there (hp untouched, no poison).
	await clear();
	await seed('sheepA', 'poisonDart');
	const cBefore = await hp('sheepA');
	await fire('sheepA');
	log = await seam();
	e = at(log, 'sheepA');
	check(say, 'sheep reached the dispatch and was gated there', !!e && e.npc === false && (await hp('sheepA')) === cBefore, e);
	check(say, 'sheep refused the dart poison too', await game.eval("window.__T__.sheepA.buffs['poison'] === undefined"));

	// --- D. lethal wornDart: kill inside the dispatch with cause 'trap', trap spends.
	await clear();
	s = await seed('dartD', 'wornDart');
	await game.eval('window.__T__.dartD.hp = 1');
	await fire('dartD');
	log = await seam();
	const kills = await game.eval('window.__KILLS__.splice(0)');
	e = at(log, 'dartD');
	const k = kills.find(x => x.tag === 'dartD');
	check(say, 'worn dart hit is attributed to the dispatch', !!e && e.cause === 'trap' && e.pierce === true, e);
	check(say, 'lethal dart killed with the trap death bucket', !!k && k.cause === 'trap', kills);
	check(say, 'dead rat left the creature list', await game.eval(`!scene.creatures.includes(window.__T__.dartD)`));
	check(say, 'the trap spent itself despite the kill', await game.eval(`scene.spentTrapCells.has(scene.level.index(window.__T__.dartD.x, window.__T__.dartD.y))`));

	// --- E1. grim's caller-side AntiMagic gate: no dispatch call, hp untouched, trap spends.
	await clear();
	await seed('grimR', 'grim');
	await game.eval('window.__T__.grimR.magicImmune = true');
	const e1Before = await hp('grimR');
	await fire('grimR');
	log = await seam();
	check(say, 'magicImmune mob refused grim at the caller, before the dispatch', !at(log, 'grimR'), log);
	check(say, 'magicImmune mob took no grim damage', (await hp('grimR')) === e1Before, await hp('grimR'));
	check(say, 'grim still spent itself for the AntiMagic target', await game.eval(`scene.spentTrapCells.has(scene.level.index(window.__T__.grimR.x, window.__T__.grimR.y))`));

	// --- E2. live grim rides the dispatch too: Java's own mix with no armor
	//     subtraction, and per GrimTrap.java 95-101 the 90%-of-HT cap is hero-only,
	//     so `round(HT/2 + HP/2)` is an instant kill on a mob (>= HP whenever HP <= HT).
	await clear();
	await seed('grimR2', 'grim');
	const e2Before = await hp('grimR2');
	await fire('grimR2');
	log = await seam();
	e = at(log, 'grimR2');
	const e2After = await hp('grimR2');
	const killsE2 = await game.eval('window.__KILLS__.splice(0)');
	const kE2 = killsE2.find(x => x.tag === 'grimR2');
	check(say, 'live grim attributed to the dispatch (cause trap, pierceArmor)', !!e && e.cause === 'trap' && e.pierce === true, e);
	check(say, 'grim mix applied exactly: the full-HP mob died inside the dispatch', e && e2After === e2Before - e.dmg && e2After <= 0, { before: e2Before, dmg: e && e.dmg, after: e2After });
	check(say, 'grim kill used the trap death bucket', !!kE2 && kE2.cause === 'trap', killsE2);
	check(say, 'grim victim left the creature list', await game.eval(`!scene.creatures.includes(window.__T__.grimR2)`));

	// --- F. explosive else: direct hit cause 'fire', blast neighbours through the
	//     dispatch (rat damaged + woken, NPC spared), killer dies with 'fire'.
	await clear();
	await seed('zapZ', 'explosive');
	await game.eval('window.__T__.zapZ.hp = 3; window.__T__.ratB.hp = 50; window.__T__.ratB.sleeping = true;');
	const fRatB = await hp('ratB');
	const fNpcB = await hp('npcB');
	await fire('zapZ');
	log = await seam();
	const killsF = await game.eval('window.__KILLS__.splice(0)');
	const ez = at(log, 'zapZ');
	check(say, 'explosive direct hit uses the fire death bucket', !!ez && ez.cause === 'fire' && ez.pierce === true, ez);
	const kZ = killsF.find(x => x.tag === 'zapZ');
	check(say, 'the exploding stepper died with cause fire', !!kZ && kZ.cause === 'fire', killsF);
	const eb = at(log, 'ratB');
	const ratBH = await hp('ratB');
	check(say, 'blast neighbour hit through the dispatch (cause fire)', !!eb && eb.cause === 'fire' && eb.pierce === true, eb);
	check(say, 'blast neighbour paid exactly the dispatched dmg and woke', eb && ratBH === fRatB - eb.dmg && await game.eval('window.__T__.ratB.sleeping === false'), { before: fRatB, dmg: eb && eb.dmg, after: ratBH });
	const en = at(log, 'npcB');
	check(say, 'blast NPC reached the dispatch and was gated there', !!en && en.r === false && (await hp('npcB')) === fNpcB, en);

	// --- G. rockfall: mob tail via the dispatch, NPC gated, spectatorFreeze stays a
	//     caller-side short-circuit (no dispatch call), paralysis + wake still run.
	await clear();
	await seed('rockRat', 'rockfall');
	await game.eval('window.__T__.rockRat.hp = 50; window.__T__.rockRat.sleeping = true;');
	const gRat = await hp('rockRat');
	const gNpc = await hp('rockNpc');
	const gSpec = await hp('rockSpec');
	await fire('rockRat');
	log = await seam();
	const gr = at(log, 'rockRat');
	const grH = await hp('rockRat');
	check(say, 'rockfall mob tail attributed to the dispatch (cause trap, pierceArmor)', !!gr && gr.cause === 'trap' && gr.pierce === true, gr);
	check(say, 'rockfall victim paid exactly the dispatched dmg, woke and was paralysed', gr && grH === gRat - gr.dmg && await game.eval("window.__T__.rockRat.sleeping === false && window.__T__.rockRat.buffs['paralysis'] !== undefined"), { before: gRat, dmg: gr && gr.dmg, after: grH });
	const gn = at(log, 'rockNpc');
	check(say, 'rockfall NPC reached the dispatch and was gated there', !!gn && gn.r === false && (await hp('rockNpc')) === gNpc, gn);
	check(say, 'spectator-freeze victim never reached the dispatch (caller gate kept)', !at(log, 'rockSpec') && (await hp('rockSpec')) === gSpec, log);

	// Floaters/paralysis on screen for the visual record.
	await sleep(400);
	await game.screenshot(`${shots}/trap-seam-livecheck.png`);

	const errs = game.consoleErrors();
	if (errs.length) { say(`console errors: ${JSON.stringify(errs.slice(0, 5))}`); failures++; }
	else say('no console errors');
	say(failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`);
};
