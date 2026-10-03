// T63 armor-abilities remainder live check: the WarpBeacon `TELEFRAG` hero self-hit
// finishes through the shared applyCharacterDamage hero branch instead of hand-rolling
// absorb + HP write + showDamage. Verifies live (direct warpToBeacon() calls, same floor):
//   Phase A - rank-3 telefrag with a rat on the beacon cell: exactly two dispatch calls
//     (hero then rat), the hero call carries the Java clamp roll min(5*rank, hp+shield-1)
//     with cause 'foe' / pierceArmor / magical (the AntiMagic.RESISTS flag), the floater
//     equals the HP loss, the rat takes normalRange(10*rank, 15*rank) and dies through the
//     dispatch, the charge drops by the 35 base cost, and the hero lands on the beacon;
//   Phase B (FINDING, not a pass/fail) - the same roll while the hero is Doomed: absorb's
//     post-clamp x1.67 (combatResolution.ts:1986) pushes the clamped hit past current HP,
//     and because warpToBeacon passes deferKill: true with no tail kill, the hero is left
//     at <= 0 HP with no kill booked. Reported to coord in msg #1108; this becomes a real
//     assertion once the caller books the fatal edge.
// node tools/browserTest.mjs --script tools/scratch/telefrag-seam-livecheck.mjs
const check = (say, label, ok, detail) => {
	say(`${ok ? 'PASS' : 'FAIL'} ${label}${detail === undefined ? '' : ` -> ${JSON.stringify(detail)}`}`);
	if (!ok) globalThis.__failures = (globalThis.__failures ?? 0) + 1;
};

export default async (game) => {
	const say = (m) => console.log(`[${game.browser}] ${m}`);
	globalThis.__failures = 0;

	await game.startGame();
	await game.waitFor('scene && scene.awaitingInput === true', { timeout: 20000 });

	// Hooks: every dispatch call, every kill, every floater. Regen off for exact HP math.
	await game.eval(`(() => {
		window.__SEAM__ = [];
		window.__KILLS__ = [];
		window.__FLOAT__ = [];
		const orig = scene.applyCharacterDamage.bind(scene);
		scene.applyCharacterDamage = (c, dmg, opts) => {
			const r = orig(c, dmg, opts);
			window.__SEAM__.push({ tag: c.__tag ?? null, dmg, cause: opts.cause,
				pierce: opts.pierceArmor === true, magical: opts.magical === true,
				deferKill: opts.deferKill === true, r });
			return r;
		};
		const origKill = scene.kill.bind(scene);
		scene.kill = (c, cause) => { window.__KILLS__.push({ tag: c.__tag ?? null, cause: cause ?? null }); return origKill(c, cause); };
		const origFloat = scene.showDamage.bind(scene);
		scene.showDamage = (c, dmg) => { window.__FLOAT__.push({ tag: c.__tag ?? null, dmg }); return origFloat(c, dmg); };
		scene.tickNaturalRegeneration = () => {};
	})()`);

	const def = `{ id: 'warpbeacon', classId: 'mage', baseChargeUse: 35, targeting: 'beacon', talents: [] }`;

	// Phase A: rank-3 telefrag, rat occupant, full HP, no barrier.
	const a = await game.eval(`(() => {
		const s = scene;
		s.hero.__tag = 'hero';
		const lvl = s.level;
		const free = (x, y) => lvl.passable(x, y) && !s.creatureAt(x, y);
		let beacon = null;
		for (let y = 1; y < lvl.height - 1 && !beacon; y++) for (let x = 1; x < lvl.width - 1; x++) {
			if (!free(x, y)) continue;
			if (![[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => free(x + dx, y + dy))) continue;
			beacon = { x, y }; break;
		}
		if (!beacon) return { error: 'no beacon cell' };
		let hcell = null;
		for (let y = 1; y < lvl.height - 1 && !hcell; y++) for (let x = 1; x < lvl.width - 1; x++)
			if (free(x, y) && Math.abs(x - beacon.x) + Math.abs(y - beacon.y) >= 3) { hcell = { x, y }; break; }
		if (!hcell) return { error: 'no hero cell' };
		s['moveTo'](s.hero, hcell);
		s['spawnMonster']('rat', beacon, false, undefined, false, undefined, false, undefined);
		const rat = s.creatures.find(c => c.kind === 'rat' && c.x === beacon.x && c.y === beacon.y);
		if (!rat) return { error: 'no rat on beacon' };
		rat.__tag = 'rat';
		rat.sleeping = true;
		s.warpBeacon = { x: beacon.x, y: beacon.y, depth: s.depth, branch: 0 };
		s.talentRanks['telefrag'] = 3;
		s.armorCharge = 100;
		s.hero.hp = s.hero.maxHp;
		const expected = Math.min(15, s.hero.hp + s.heroBarrier.total - 1);
		const hpBefore = s.hero.hp, poolBefore = s.heroShieldPoolTotal(), chargeBefore = s.armorCharge;
		const s0 = window.__SEAM__.length, f0 = window.__FLOAT__.length, k0 = window.__KILLS__.length;
		s['warpToBeacon'](${def}, s.warpBeacon);
		return { expected, hpBefore, hpAfter: s.hero.hp, poolBefore, chargeBefore, chargeAfter: s.armorCharge,
			seam: window.__SEAM__.slice(s0), floats: window.__FLOAT__.slice(f0), kills: window.__KILLS__.slice(k0),
			heroAt: { x: s.hero.x, y: s.hero.y }, beacon,
			rat: rat.hp > 0 ? { x: rat.x, y: rat.y, hp: rat.hp } : { dead: true, hp: rat.hp },
			ratMax: rat.maxHp, gameOver: s.gameOver === true };
	})()`);
	if (a.error) { say(`setup error: ${a.error}`); process.exitCode = 1; return; }
	check(say, 'A: exactly two dispatch calls (hero self, then rat occupant)',
		a.seam.length === 2, a.seam);
	check(say, 'A: hero call = Java clamp roll, cause foe, pierce, magical (RESISTS flag), deferKill',
		a.seam[0]?.tag === 'hero' && a.seam[0]?.dmg === a.expected && a.seam[0]?.cause === 'foe'
		&& a.seam[0]?.pierce === true && a.seam[0]?.magical === true && a.seam[0]?.deferKill === true
		&& a.seam[0]?.r === false, { expected: a.expected, pool: a.poolBefore, call: a.seam[0] });
	const aLoss = a.hpBefore - a.hpAfter;
	check(say, 'A: clamp = min(15, hp+barrier-1) with the floater equal to the HP loss',
		a.expected === Math.min(15, a.hpBefore + a.poolBefore - 1)
		&& a.floats.length >= 1 && a.floats[0].dmg === aLoss,
		{ expected: a.expected, hpBefore: a.hpBefore, pool: a.poolBefore, aLoss, floats: a.floats });
	check(say, 'A: rat takes normalRange(30,45) and dies through the dispatch kill',
		a.seam[1]?.tag === 'rat' && a.seam[1].dmg >= 30 && a.seam[1].dmg <= 45
		&& a.rat.dead === true && a.kills.length === 1 && a.kills[0]?.tag === 'rat',
		{ call: a.seam[1], rat: a.rat, kills: a.kills });
	check(say, 'A: charge spent the 35 base cost, hero landed on the beacon, no game over',
		a.chargeAfter === a.chargeBefore - 35 && a.heroAt.x === a.beacon.x && a.heroAt.y === a.beacon.y
		&& a.gameOver === false, { chargeBefore: a.chargeBefore, chargeAfter: a.chargeAfter, heroAt: a.heroAt, beacon: a.beacon });

	await game.screenshot('telefrag-seam-livecheck.png');

	// Phase B: FINDING - the same roll while the hero is Doomed (post-clamp x1.67).
	const b = await game.eval(`(() => {
		const s = scene;
		const lvl = s.level;
		const free = (x, y) => lvl.passable(x, y) && !s.creatureAt(x, y);
		let beacon = null;
		for (let y = 1; y < lvl.height - 1 && !beacon; y++) for (let x = 1; x < lvl.width - 1; x++) {
			if (!free(x, y) || (x === s.hero.x && y === s.hero.y)) continue;
			if (![[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => free(x + dx, y + dy))) continue;
			beacon = { x, y }; break;
		}
		if (!beacon) return { error: 'no beacon cell' };
		s['spawnMonster']('rat', beacon, false, undefined, false, undefined, false, undefined);
		const rat = s.creatures.find(c => c.kind === 'rat' && c.x === beacon.x && c.y === beacon.y && c.hp > 0);
		if (!rat) return { error: 'no rat on beacon' };
		rat.__tag = 'ratB';
		rat.sleeping = true;
		s.warpBeacon = { x: beacon.x, y: beacon.y, depth: s.depth, branch: 0 };
		s.armorCharge = 100;
		s.hero.hp = 6;
		s.hero.buffs['doom'] = 5;
		const expected = Math.min(15, s.hero.hp + s.heroBarrier.total - 1);
		const s0 = window.__SEAM__.length, f0 = window.__FLOAT__.length, k0 = window.__KILLS__.length;
		s['warpToBeacon'](${def}, s.warpBeacon);
		const out = { expected, hpAfter: s.hero.hp, seam: window.__SEAM__.slice(s0),
			floats: window.__FLOAT__.slice(f0), kills: window.__KILLS__.slice(k0),
			gameOver: s.gameOver === true, doom: s.hero.buffs['doom'] };
		// Restore so the scene stays sane for the console-error check and teardown.
		delete s.hero.buffs['doom'];
		if (s.hero.hp <= 0) s.hero.hp = Math.max(1, Math.floor(s.hero.maxHp / 2));
		return out;
	})()`);
	if (b.error) { say(`setup error: ${b.error}`); process.exitCode = 1; return; }
	check(say, 'B: Doomed hero still rolls the raw clamp call through the dispatch',
		b.seam.length === 2 && b.seam[0]?.tag === 'hero' && b.seam[0]?.dmg === b.expected
		&& b.seam[0]?.deferKill === true, { expected: b.expected, call: b.seam[0] });
	say(`FINDING: Doomed self-hit ran ${b.expected} -> HP ${b.hpAfter} (absorb x1.67 post-clamp); `
		+ `kills booked=${JSON.stringify(b.kills)} gameOver=${b.gameOver} `
		+ '- deferKill:true with no tail kill in warpToBeacon leaves a fatal telefrag unbooked (coord #1108)');

	const errors = await game.consoleErrors();
	check(say, 'no console errors', errors.length === 0, errors.slice(0, 3));
	const failures = globalThis.__failures ?? 0;
	say(failures === 0 ? 'ALL PASS' : `${failures} FAILURES`);
	if (failures > 0) process.exitCode = 1;
};
