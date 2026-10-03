// node tools/browserTest.mjs --script tools/scratch/r061-wandproc-livecheck.mjs
// R061 browser verification (2026-10-01): the cursed-wand proc path runs Java's whole
// `Wand.wandProc(target, origin.buffedLvl(), 1)` tail (`CursedWand.java:135-138`,
// `Wand.java:210-245`, tag v3.3.8) - all five legs, live, through the real scene method:
//  T1 Arcane Vision marks the *victim* on `awareCreatures` at 5+5*rank (Java's
//     CharAwareness charID), replacing the old all-mobs Mind Vision stand-in, and a
//     Warlock SoulMark lands at wandLevel 50 (0.92^51-0.07 < 0, so the roll is
//     guaranteed) with duration 10+50.
//  T2 Java's `target != null && target != hero` guard plus the port's stated corpse
//     gate: a 0-hp target gains neither mark.
//  T3 Priest detonate consumes `Illuminated` for exactly hero.lvl+5 through the
//     pierce-armor dispatch.
//  T4 Searing Light illuminates a non-ally victim and arms the hero's cooldown buff.
//  T5 Sunray's blind roll fires within 60 attempts (15%/25% Java chance), 4 turns.
// Talent ranks and subclass are method-shadowed for the duration and restored in a
// finally, so the runtime is left exactly as found.
const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async (game) => {
	await game.startGame();
	const curtainDeadline = Date.now() + 10000;
	let curtain = true;
	while (curtain && Date.now() < curtainDeadline) {
		await settle(200);
		curtain = await game.eval(`(() => { const s = window.__MWG__.currentScene; return !!(s && s['interlevel']); })()`);
	}
	if (curtain) throw new Error('R061 FAIL: InterlevelScene curtain never cleared after startGame');

	const res = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const out = {};
		const hx = s.hero.x, hy = s.hero.y;
		const cells = [];
		for (let r = 1; r <= 6 && cells.length < 3; r++) {
			for (let dx = -r; dx <= r && cells.length < 3; dx++) {
				for (let dy = -r; dy <= r && cells.length < 3; dy++) {
					if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
					const x = hx + dx, y = hy + dy;
					if (!s.level.inside(x, y) || !s.level.passable(x, y) || s.creatureAt(x, y)) continue;
					cells.push({ x, y });
				}
			}
		}
		if (cells.length < 3) { out.fail = 'only ' + cells.length + ' free passable cells near the hero'; return out; }

		const origTR = s.talentRank, origSub = s.subclass;
		const setTR = (arcane, searing, sunray) => {
			s.talentRank = (id) => id === 'arcane_vision' ? arcane : id === 'searing_light' ? searing : id === 'sunray' ? sunray : 0;
		};
		try {
			const rat1 = s.spawnMonster('rat', cells[0], false);
			const rat2 = s.spawnMonster('rat', cells[1], false);
			if (!rat1 || !rat2) { out.fail = 'spawnMonster did not return both probe rats'; return out; }
			rat1.hp = rat1.maxHp; rat2.hp = rat2.maxHp;

			// T1: Arcane Vision per-target mark + warlock SoulMark at chargesUsed = 1.
			setTR(2, 0, 0); s.subclass = () => 'warlock';
			s.applyCursedWandProc(rat1, 50);
			out.t1 = { aware: s.awareCreatures.get(rat1), mark: rat1.buffs.soulmark, hp: rat1.hp, maxHp: rat1.maxHp };

			// T2: corpse gate - a 0-hp target gains neither leg.
			rat2.hp = 0;
			s.applyCursedWandProc(rat2, 50);
			out.t2 = { aware: s.awareCreatures.get(rat2), mark: rat2.buffs.soulmark };
			rat2.hp = rat2.maxHp;

			// T3: Priest detonate consumes Illuminated for exactly hero.lvl + 5.
			setTR(0, 0, 0); s.subclass = () => 'priest';
			rat1.buffs.illuminated = 9;
			const lvl = s.progression.level, hpB = rat1.hp;
			s.applyCursedWandProc(rat1, 1);
			out.t3 = { delta: hpB - rat1.hp, expect: lvl + 5, stillLit: 'illuminated' in rat1.buffs, hpAfter: rat1.hp };

			// T4: Searing Light illuminates the victim and arms the hero cooldown.
			setTR(0, 1, 0); s.subclass = () => 'warlock';
			delete s.hero.buffs.searingLightCooldown;
			s.applyCursedWandProc(rat1, 1);
			out.t4 = { lit: rat1.buffs.illuminated, cooldown: s.hero.buffs.searingLightCooldown };

			// T5: Sunray's blind roll, repeated until it lands (15%/25% Java chance).
			setTR(0, 0, 1); s.subclass = () => null;
			delete s.hero.buffs.searingLightCooldown;
			let tries = 0;
			while (!rat1.buffs.blindness && tries < 60) { delete rat1.buffs.illuminated; s.applyCursedWandProc(rat1, 1); tries++; }
			out.t5 = { tries, blind: rat1.buffs.blindness };
		} finally {
			s.talentRank = origTR; s.subclass = origSub;
		}
		return out;
	})()`);
	console.log(JSON.stringify(res, null, 1));
	if (res.fail) throw new Error('R061 FAIL: ' + res.fail);

	// T1: per-target awareness at 5+5*2 = 15 (arcaneVisionDuration(2)), guaranteed
	// SoulMark at wandLevel 50 with duration 10+50, and no damage from either leg.
	if (res.t1.aware !== 15) throw new Error(`R061 FAIL: T1 awareCreatures=${res.t1.aware}, expected 15`);
	if (!(res.t1.mark >= 55 && res.t1.mark <= 60)) throw new Error(`R061 FAIL: T1 soulmark=${res.t1.mark}, expected ~60`);
	if (res.t1.hp !== res.t1.maxHp) throw new Error(`R061 FAIL: T1 damaged the victim (${res.t1.hp}/${res.t1.maxHp})`);
	// T2: corpse gate.
	if (res.t2.aware !== undefined || res.t2.mark !== undefined) throw new Error('R061 FAIL: T2 a 0-hp target was procced: ' + JSON.stringify(res.t2));
	// T3: exact hero.lvl+5 pierce-armor detonate, Illuminated consumed, rat survives.
	if (res.t3.delta !== res.t3.expect) throw new Error(`R061 FAIL: T3 detonate dealt ${res.t3.delta}, expected ${res.t3.expect}`);
	if (res.t3.stillLit !== false) throw new Error('R061 FAIL: T3 Illuminated not consumed');
	if (res.t3.hpAfter <= 0) throw new Error('R061 FAIL: T3 victim died, delta proof inconclusive');
	// T4: searing arm both sides.
	if (!res.t4.lit) throw new Error('R061 FAIL: T4 victim not illuminated');
	if (!res.t4.cooldown) throw new Error('R061 FAIL: T4 hero searing cooldown not armed');
	// T5: blind landed within the attempt cap, Java's 4 turns.
	if (res.t5.tries >= 60 || !res.t5.blind) throw new Error('R061 FAIL: T5 sunray never blinded in 60 rolls: ' + JSON.stringify(res.t5));
	if (res.t5.blind !== 4) throw new Error(`R061 FAIL: T5 blindness=${res.t5.blind}, expected Java's 4`);

	await settle(700);
	await game.screenshot('r061-wandproc.png');
	if (game.consoleErrors().length) throw new Error(`R061 FAIL: console errors: ${game.consoleErrors()[0]}`);
	console.log(`R061 PASS: full Wand.wandProc tail live - aware=${res.t1.aware}, soulmark=${res.t1.mark}, corpse-gate clean, detonate=${res.t3.delta}=${res.t3.expect}, searing armed, blind after ${res.t5.tries} rolls (${res.t5.blind} turns)`);
};
