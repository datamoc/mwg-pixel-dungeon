// T63 hero-DoT live check: the four hero DoT sites in turnLoopAiming.ts (Viscosity
// deferred tick, the merged burning/poison/bleeding tick, Ooze, AscensionChallenge)
// now finish through the shared applyCharacterDamage dispatch instead of calling
// absorbHeroDamage + hero.hp -= + showDamage + kill themselves. Verifies, via direct
// spendHeroTurn() calls (hero-side pipeline only - runHeroTurn never advances mob
// turns, so the phases are deterministic with every mob asleep):
//   1. poison with a Barrier up: dispatch attribution (raw tick 3 as the dmg arg,
//      cause 'poison', pierceArmor true, magical false, no skipAura, survived), the
//      HP loss equals the floater value (the merged site used to float the RAW roll
//      while only losing the post-absorb amount), shield drained by min(tick, pool),
//      buff clock decremented, no kill;
//   2. Viscosity deferred: pool spent max(1, floor(50*0.1))=5 inside the dispatch,
//      floater = HP loss = 5, pool left 45, no re-defer, no kill;
//   3. AscensionChallenge at a non-boss depth: one point through the dispatch,
//      inc accumulator rebalanced to 0, no kill;
//   4. Ooze at depth 5 with 1 HP: the dispatch rolls the kill (cause 'poison') and
//      returns died=true, and the caller's affliction+ondeath log lines land AFTER
//      kill() - recorded as say() entries following the 'kill' marker (kill itself
//      speaks first: the death-floor line plus the badge/panel line, then the two
//      caller lines, so the fatal phase reads kill, say, say, say, say).
// node tools/browserTest.mjs --script tools/scratch/dot-seam-livecheck.mjs
const check = (say, label, ok, detail) => {
	say(`${ok ? 'PASS' : 'FAIL'} ${label}${detail === undefined ? '' : ` -> ${JSON.stringify(detail)}`}`);
	if (!ok) globalThis.__failures = (globalThis.__failures ?? 0) + 1;
};

export default async (game) => {
	const say = (m) => console.log(`[${game.browser}] ${m}`);
	globalThis.__failures = 0;

	await game.startGame();
	await game.waitFor('scene && scene.awaitingInput === true', { timeout: 20000 });

	// Hooks: every dispatch call, every kill, every floater, every log line (order).
	await game.eval(`(() => {
		window.__SEAM__ = [];
		window.__KILLS__ = [];
		window.__FLOAT__ = [];
		window.__SEQ__ = [];
		const orig = scene.applyCharacterDamage.bind(scene);
		scene.applyCharacterDamage = (c, dmg, opts) => {
			const r = orig(c, dmg, opts);
			window.__SEAM__.push({ tag: c.__tag ?? null, dmg, cause: opts.cause,
				pierce: opts.pierceArmor === true, magical: opts.magical === true,
				skipAura: opts.skipAura === true, r });
			return r;
		};
		const origKill = scene.kill.bind(scene);
		scene.kill = (c, cause) => { window.__KILLS__.push({ tag: c.__tag ?? null, cause: cause ?? null }); window.__SEQ__.push('kill'); return origKill(c, cause); };
		const origFloat = scene.showDamage.bind(scene);
		scene.showDamage = (c, dmg) => { window.__FLOAT__.push({ tag: c.__tag ?? null, dmg }); return origFloat(c, dmg); };
		const origSay = scene.say.bind(scene);
		scene.say = (line, lvl) => { window.__SEQ__.push('say'); return origSay(line, lvl); };
		// Natural regen would pollute the exact-HP assertions below.
		scene.tickNaturalRegeneration = () => {};
	})()`);

	const setup = await game.eval(`(() => {
		scene.hero.__tag = 'hero';
		for (const c of scene.creatures) if (!c.isHero) c.sleeping = true;
		for (const id of ['poison', 'burning', 'bleeding', 'ooze']) delete scene.hero.buffs[id];
		scene.hero.deferredDamage = 0;
		scene.hero.deferredDamageDelay = false;
		return { hp: scene.hero.hp, max: scene.hero.maxHp, pool: scene.heroShieldPoolTotal(), mobs: scene.creatures.length - 1 };
	})()`);
	check(say, 'setup: hero tagged, mobs asleep, DoTs clear, regen disabled', setup.hp === setup.max && setup.pool !== undefined, setup);

	// Phase 1: poison tick behind a 2-point Barrier - the floater must equal the HP loss.
	const p1 = await game.eval(`(() => {
		const s0 = window.__SEAM__.length, f0 = window.__FLOAT__.length, k0 = window.__KILLS__.length;
		const poolBefore = scene.heroShieldPoolTotal();
		const added = scene.grantHeroShield(2);
		const poolAfter = scene.heroShieldPoolTotal();
		const hpBefore = scene.hero.hp;
		scene.hero.buffs['poison'] = 6;
		scene['spendHeroTurn'](1);
		return { added, poolGained: poolAfter - poolBefore, poolAfter, hpBefore, hpAfter: scene.hero.hp,
			seam: window.__SEAM__.slice(s0), floats: window.__FLOAT__.slice(f0), kills: window.__KILLS__.slice(k0),
			poisonLeft: scene.hero.buffs['poison'] };
	})()`);
	check(say, 'P1 poison: exactly one dispatch call, raw tick 3', p1.seam.length === 1 && p1.seam[0]?.dmg === 3, p1.seam);
	check(say, 'P1 poison: attribution cause poison / pierce / !magical / !skipAura / survived',
		p1.seam[0]?.tag === 'hero' && p1.seam[0]?.cause === 'poison' && p1.seam[0]?.pierce === true
		&& p1.seam[0]?.magical === false && p1.seam[0]?.skipAura === false && p1.seam[0]?.r === false, p1.seam[0]);
	const p1Loss = p1.hpBefore - p1.hpAfter;
	check(say, 'P1 poison: floater equals HP loss (post-absorb, not the raw roll)',
		p1.floats.length === 1 && p1.floats[0].dmg === p1Loss, { floats: p1.floats, p1Loss });
	check(say, 'P1 poison: shield drained by min(tick, pool), pool before+2',
		p1.added === 2 && p1.poolGained === 2 && p1Loss === Math.max(0, 3 - p1.poolAfter),
		{ added: p1.added, poolAfter: p1.poolAfter, p1Loss });
	check(say, 'P1 poison: buff clock 6->5, no kill', p1.poisonLeft === 5 && p1.kills.length === 0, { poisonLeft: p1.poisonLeft, kills: p1.kills });

	// Phase 2: Viscosity deferred pool - the scheduled tick through the dispatch.
	const p2 = await game.eval(`(() => {
		const s0 = window.__SEAM__.length, f0 = window.__FLOAT__.length, k0 = window.__KILLS__.length;
		delete scene.hero.buffs['poison'];
		scene.hero.deferredDamage = 50;
		scene.hero.deferredDamageDelay = false;
		const hpBefore = scene.hero.hp;
		scene['spendHeroTurn'](1);
		return { hpBefore, hpAfter: scene.hero.hp, seam: window.__SEAM__.slice(s0),
			floats: window.__FLOAT__.slice(f0), kills: window.__KILLS__.slice(k0),
			pool: scene.hero.deferredDamage, delay: scene.hero.deferredDamageDelay };
	})()`);
	const p2Loss = p2.hpBefore - p2.hpAfter;
	check(say, 'P2 viscosity: one dispatch call, dmg 5, cause poison, survived',
		p2.seam.length === 1 && p2.seam[0]?.dmg === 5 && p2.seam[0]?.cause === 'poison' && p2.seam[0]?.r === false, p2.seam);
	check(say, 'P2 viscosity: HP loss = floater = 5, pool 50->45, no kill',
		p2Loss === 5 && p2.floats.length === 1 && p2.floats[0].dmg === 5 && p2.pool === 45 && p2.kills.length === 0,
		{ p2Loss, floats: p2.floats, pool: p2.pool, kills: p2.kills });

	// Phase 3: AscensionChallenge point on a non-boss depth (screenshot while alive).
	const p3 = await game.eval(`(() => {
		const s0 = window.__SEAM__.length, f0 = window.__FLOAT__.length, k0 = window.__KILLS__.length;
		scene.hero.deferredDamage = 0;
		scene.depth = 4;
		scene.ascensionChallengeActive = true;
		scene.ascensionStacks = 8;
		scene.hero.hp = scene.hero.maxHp;
		const hpBefore = scene.hero.hp;
		scene['spendHeroTurn'](1);
		return { hpBefore, hpAfter: scene.hero.hp, seam: window.__SEAM__.slice(s0),
			floats: window.__FLOAT__.slice(f0), kills: window.__KILLS__.slice(k0),
			inc: scene.ascensionDamageInc };
	})()`);
	const p3Loss = p3.hpBefore - p3.hpAfter;
	check(say, 'P3 ascension: one dispatch call, dmg 1, cause poison, survived',
		p3.seam.length === 1 && p3.seam[0]?.dmg === 1 && p3.seam[0]?.cause === 'poison' && p3.seam[0]?.r === false, p3.seam);
	check(say, 'P3 ascension: HP loss = floater = 1, inc back to 0, no kill',
		p3Loss === 1 && p3.floats.length === 1 && p3.floats[0].dmg === 1 && p3.inc === 0 && p3.kills.length === 0,
		{ p3Loss, floats: p3.floats, inc: p3.inc, kills: p3.kills });

	await game.screenshot('dot-seam-livecheck.png');

	// Phase 4: Ooze at depth 5 with 1 HP - in-dispatch hero kill, says after kill().
	const p4 = await game.eval(`(() => {
		const s0 = window.__SEAM__.length, k0 = window.__KILLS__.length, q0 = window.__SEQ__.length;
		scene.ascensionChallengeActive = false;
		scene.depth = 5;
		// Duration must survive tickBuffs (left <= 1 is deleted there) before the
		// depth-scaled ooze block reads the buff later in the same turn.
		scene.hero.buffs['ooze'] = 5;
		scene.hero.hp = 1;
		scene['spendHeroTurn'](1);
		return { seam: window.__SEAM__.slice(s0), kills: window.__KILLS__.slice(k0),
			seq: window.__SEQ__.slice(q0), hp: scene.hero.hp, gameOver: scene.gameOver === true };
	})()`);
	check(say, 'P4 ooze fatal: dispatch call dmg 1 cause poison, reported died',
		p4.seam.length === 1 && p4.seam[0]?.dmg === 1 && p4.seam[0]?.cause === 'poison' && p4.seam[0]?.r === true, p4.seam);
	check(say, 'P4 ooze fatal: kill() booked with cause poison, hero at 0 HP, gameOver',
		p4.kills.length === 1 && p4.kills[0]?.tag === 'hero' && p4.kills[0]?.cause === 'poison' && p4.hp <= 0 && p4.gameOver,
		{ kills: p4.kills, hp: p4.hp, gameOver: p4.gameOver });
	const killAt = p4.seq.indexOf('kill');
	check(say, 'P4 ooze fatal: affliction+ondeath says land after the kill (kill first, 4 says follow: death-floor/badge from kill() plus the two caller lines)',
		killAt === 0 && p4.seq.length === 5 && p4.seq.slice(1).every((x) => x === 'say'), p4.seq);

	const errors = await game.consoleErrors();
	check(say, 'no console errors', errors.length === 0, errors.slice(0, 3));
	const failures = globalThis.__failures ?? 0;
	say(failures === 0 ? 'ALL PASS' : `${failures} FAILURES`);
	if (failures > 0) process.exitCode = 1;
};
