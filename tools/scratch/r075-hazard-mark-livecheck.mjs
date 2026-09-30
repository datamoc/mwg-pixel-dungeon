// node tools/browserTest.mjs --script tools/scratch/r075-hazard-mark-livecheck.mjs
// R075 browser verification (2026-09-30): Trap.HazardAssistTracker marking order and
// Rockfall/Explosive scope (ROADMAP R075, coverage/rows-terrain-traps-and-levelgen.md's
// "closes R075" row; Java source `Trap.java`/`RockfallTrap.java`/`ExplosiveTrap.java`,
// tag v3.3.8):
//  - PoisonDart/WornDart/Grim mark their mob stepper BEFORE applyCharacterDamage
//  - Rockfall marks each Mob in its room / 5x5 flood loop before its hit
//  - Explosive marks the Mob occupants of NEIGHBOURS9 before the triggering mob's
//    centre hit and the remaining blast hits (applyTrapBlast marks all, then hits all)
//  - a marked enemy dying awards hazard_assists (Mob.die() -> awardBadge)
//  - markHazardMob rejects dead mobs
// Instrumentation follows geyser-dispatch-livecheck.mjs: wrap
// scene.applyCharacterDamage and capture buffs.hazardAssist AT CALL TIME; traps are
// driven through the real mob-step dispatcher (triggerMobTrapAt) with trapKinds armed
// directly, so every branch under test runs its shipped code path.
const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async (game) => {
	await game.startGame();
	// Run-start InterlevelScene curtain (same wait as r068-item-picker-livecheck.mjs):
	// poll scene['interlevel'] to null so the shot shows the dungeon, not "Descente".
	const curtainDeadline = Date.now() + 10000;
	let curtain = true;
	while (curtain && Date.now() < curtainDeadline) {
		await settle(200);
		curtain = await game.eval(`(() => { const s = window.__MWG__.currentScene; return !!(s && s['interlevel']); })()`);
	}
	if (curtain) throw new Error('InterlevelScene curtain never cleared after startGame');

	const res = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const out = { recs: [], badges: [], phases: {}, spots: {} };
		const hx = s.hero.x, hy = s.hero.y;
		const heroHpBefore = s.hero.hp;
		const free = (x, y) => s.level.passable(x, y) && !s.creatureAt(x, y);
		const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
		const roomOf = (x, y) => (s.level.rooms || []).find((rm) => x >= rm.left && x <= rm.right && y >= rm.top && y <= rm.bottom) || null;
		const heroInRoom = (c) => { const rm = roomOf(c.x, c.y); return !!(rm && hx >= rm.left && hx <= rm.right && hy >= rm.top && hy <= rm.bottom); };

		// Candidate cells: Chebyshev 3..8 from the hero (nothing here reaches him), never
		// a secret cell (triggerMobTrapAt refuses secrets). Prefer cells the hero can
		// currently see so the victims land in the screenshot; fall back to any cell.
		let cand = [];
		const collect = (visibleOnly) => {
			const list = [];
			for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
				const d = Math.max(Math.abs(dx), Math.abs(dy));
				if (d < 3) continue;
				const x = hx + dx, y = hy + dy;
				if (!s.level.inside(x, y) || !free(x, y)) continue;
				if (s.secrets && s.secrets.isSecret(x, y)) continue;
				if (visibleOnly && s.fov && !s.fov.isVisible(x, y)) continue;
				list.push({ x, y, d });
			}
			// Nearest-first: spots close to the hero sit inside the camera frame and the
			// torchlit cells, so the shot actually contains the victims.
			return list.sort((a, b) => a.d - b.d);
		};
		const pick = (name, pred) => {
			for (const c of cand) {
				if (cheb(c, { x: hx, y: hy }) < 3) continue;
				// Distance 3 keeps every spot outside every other trap's reach (blast and
				// the rockfall flood span 1-2 cells) while still fitting small maps.
				if (Object.values(out.spots).some((p) => cheb(p, c) < 3)) continue;
				if (pred && !pred(c)) continue;
				out.spots[name] = c;
				return c;
			}
			return null;
		};
		const layout = () => {
			out.spots = {};
			// Area traps first: they also need a free bystander cell beside their spot.
			pick('rock', (c) => !heroInRoom(c));
			pick('blast');
			pick('poison');
			pick('worn');
			pick('grim');
			return Object.keys(out.spots).length >= 5;
		};
		cand = collect(true);
		if (!layout()) { cand = collect(false); layout(); }
		if (Object.keys(out.spots).length < 5) return { fail: 'not enough isolated spots: ' + JSON.stringify(out.spots) };

		// Rockfall bystander: inside the trap's room when it sits in one (the room loop
		// covers the whole rect), else the dist-2 flood; passable + free, off the hero.
		const rock = out.spots.rock;
		const rockRoom = roomOf(rock.x, rock.y);
		let rockBy = null;
		for (let dy = -4; dy <= 4 && !rockBy; dy++) for (let dx = -4; dx <= 4 && !rockBy; dx++) {
			const c = { x: rock.x + dx, y: rock.y + dy };
			if (cheb(c, rock) === 0 || !s.level.inside(c.x, c.y) || !free(c.x, c.y)) continue;
			if (c.x === hx && c.y === hy) continue;
			if (Object.values(out.spots).some((p) => cheb(p, c) === 0)) continue;
			if (rockRoom && !(c.x >= rockRoom.left && c.x <= rockRoom.right && c.y >= rockRoom.top && c.y <= rockRoom.bottom)) continue;
			rockBy = c;
		}
		const blast = out.spots.blast;
		let blastBy = null;
		for (const [dx, dy] of [[1,0],[0,1],[-1,0],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
			const c = { x: blast.x + dx, y: blast.y + dy };
			if (s.level.inside(c.x, c.y) && free(c.x, c.y) && !(c.x === hx && c.y === hy)
				&& !Object.values(out.spots).some((p) => cheb(p, c) === 0)) { blastBy = c; break; }
		}
		if (!rockBy || !blastBy) return { fail: 'no bystander cell (rock=' + JSON.stringify(rockBy) + ' blast=' + JSON.stringify(blastBy) + ')' };
		out.rockBystander = rockBy;
		out.blastBystander = blastBy;

		// Wrap the shared dispatch: capture the mark AT CALL TIME (the ordering claim),
		// then let the real body run. Wrap awardBadge for the badge claim.
		const recs = out.recs;
		const origDmg = s.applyCharacterDamage;
		s.applyCharacterDamage = function (target, damage, options) {
			const hpBefore = target.hp;
			const mark = target.buffs.hazardAssist !== undefined;
			const cause = (options && options.cause) || null;
			const pierce = !!(options && options.pierceArmor);
			const result = origDmg.call(this, target, damage, options);
			recs.push({ tag: target.r075 || null, kind: target.kind, isHero: target.isHero === true, mark, cause, pierce, hpBefore, hpAfter: target.hp });
			return result;
		};
		const badges = out.badges;
		const origBadge = s.awardBadge;
		s.awardBadge = function (id) { badges.push(String(id)); return origBadge.apply(this, arguments); };

		// Keep the spawned rats reachable from a later eval so the pre-screenshot
		// probe can report their positions/HP after the game loop has run turns.
		const r075rats = (s.__r075rats = []);
		const spawn = (cell, tag) => {
			const m = s.spawnMonster('rat', cell, false);
			if (m) { m.r075 = tag; r075rats.push(m); }
			return m;
		};
		const arm = (cell, kind) => {
			const i = s.level.index(cell.x, cell.y);
			s.trapKinds.set(i, kind);
			s.spentTrapCells.delete(i);
		};

		try {
			// Order matters for the shot: the area traps (whose loops sweep a room / a
			// 3x3) run first while only their own victims exist, then the single-target
			// darts, so poisoned/paralysed survivors are still on screen for the PNG.
			// Padded test rats (16 HP vs the natural 8) survive every depth-1 roll the
			// area traps can produce; the grim victim stays at 1 HP on purpose - its
			// lethality is the "lethal hit still credited" claim.

			// Rockfall: stepper on the cell + one bystander inside the room/flood.
			const rockStepper = spawn(rock, 'rockStepper');
			const rockBystander = spawn(rockBy, 'rockBystander');
			if (!rockStepper || !rockBystander) return { fail: 'rockfall rats failed' };
			rockStepper.maxHp = rockStepper.hp = 16;
			rockBystander.maxHp = rockBystander.hp = 16;
			arm(rock, 'rockfall');
			s.triggerMobTrapAt(rockStepper);
			out.phases.rock = {
				stepperMark: rockStepper.buffs.hazardAssist !== undefined,
				bystanderMark: rockBystander.buffs.hazardAssist !== undefined,
				bystanderHp: rockBystander.hp, bystanderMax: rockBystander.maxHp,
				paralysis: rockStepper.buffs.paralysis !== undefined,
			};

			// Explosive: stepper in the centre + one mob in NEIGHBOURS9.
			const blastStepper = spawn(blast, 'blastStepper');
			const blastBystander = spawn(blastBy, 'blastBystander');
			if (!blastStepper || !blastBystander) return { fail: 'explosive rats failed' };
			blastStepper.maxHp = blastStepper.hp = 16;
			blastBystander.maxHp = blastBystander.hp = 16;
			arm(blast, 'explosive');
			s.triggerMobTrapAt(blastStepper);
			out.phases.blast = {
				stepperMark: blastStepper.buffs.hazardAssist !== undefined,
				bystanderMark: blastBystander.buffs.hazardAssist !== undefined,
				bystanderHp: blastBystander.hp,
			};

			// PoisonDart: mark the stepper, then the shared-dispatch hit, then the poison.
			let m = spawn(out.spots.poison, 'poison');
			if (!m) return { fail: 'poison rat spawn failed' };
			m.maxHp = m.hp = 16;
			arm(out.spots.poison, 'poisonDart');
			s.triggerMobTrapAt(m);
			out.phases.poison = { mark: m.buffs.hazardAssist !== undefined, poison: m.buffs.poison !== undefined, hp: m.hp, max: m.maxHp };

			// WornDart: same shape without the poison.
			m = spawn(out.spots.worn, 'worn');
			if (!m) return { fail: 'worn rat spawn failed' };
			m.maxHp = m.hp = 16;
			arm(out.spots.worn, 'wornDart');
			s.triggerMobTrapAt(m);
			out.phases.worn = { mark: m.buffs.hazardAssist !== undefined, poison: m.buffs.poison !== undefined, hp: m.hp };

			// Grim: drop the victim to 1 HP so the hit is lethal - the mark must still
			// precede it and the death must credit hazard_assists (Mob.die badge gate).
			m = spawn(out.spots.grim, 'grim');
			if (!m) return { fail: 'grim rat spawn failed' };
			m.hp = 1;
			arm(out.spots.grim, 'grim');
			s.triggerMobTrapAt(m);
			out.phases.grim = { mark: m.buffs.hazardAssist !== undefined, dead: m.hp <= 0 };
		} finally {
			s.applyCharacterDamage = origDmg;
			s.awardBadge = origBadge;
		}
		out.heroHp = { before: heroHpBefore, after: s.hero.hp };
		return out;
	})()`);
	console.log(JSON.stringify(res, null, 1));
	if (res.fail) throw new Error('R075 FAIL: ' + res.fail);

	// The core ordering claim: every non-hero damage record was marked BEFORE the hit.
	const nonHero = res.recs.filter((r) => !r.isHero);
	const unmarked = nonHero.filter((r) => !r.mark);
	if (nonHero.length === 0) throw new Error('R075 FAIL: no non-hero dispatch records at all');
	if (unmarked.length) throw new Error('R075 FAIL: unmarked non-hero damage: ' + JSON.stringify(unmarked));
	// The hero is never in scope: no dispatch traffic, no HP change.
	if (res.recs.some((r) => r.isHero) || res.heroHp.after !== res.heroHp.before) {
		throw new Error('R075 FAIL: hero was hit: ' + JSON.stringify({ hero: res.heroHp, recs: res.recs.filter((r) => r.isHero) }));
	}
	const tagged = (tag) => res.recs.filter((r) => r.tag === tag);
	const expectHit = (tag, cause) => {
		const hits = tagged(tag);
		if (hits.length < 1) throw new Error('R075 FAIL: ' + tag + ' never took a dispatch hit: ' + JSON.stringify(res.recs));
		if (hits.some((h) => !h.mark)) throw new Error('R075 FAIL: ' + tag + ' damaged without pre-mark: ' + JSON.stringify(hits));
		if (cause && hits.some((h) => h.cause !== cause || !h.pierce)) throw new Error('R075 FAIL: ' + tag + ' options shape: ' + JSON.stringify(hits));
		return hits;
	};
	// PoisonDart/WornDart/Grim.
	const p = expectHit('poison', 'trap');
	if (p[0].hpAfter >= p[0].hpBefore) throw new Error('R075 FAIL: poison rat took no damage: ' + JSON.stringify(p));
	if (!res.phases.poison.mark || !res.phases.poison.poison) throw new Error('R075 FAIL: poison phase state: ' + JSON.stringify(res.phases.poison));
	const w = expectHit('worn', 'trap');
	if (w[0].hpAfter >= w[0].hpBefore) throw new Error('R075 FAIL: worn rat took no damage: ' + JSON.stringify(w));
	if (!res.phases.worn.mark || res.phases.worn.poison) throw new Error('R075 FAIL: worn phase state: ' + JSON.stringify(res.phases.worn));
	expectHit('grim', 'trap');
	if (!res.phases.grim.mark || !res.phases.grim.dead) throw new Error('R075 FAIL: grim phase state: ' + JSON.stringify(res.phases.grim));
	if (!res.badges.includes('hazard_assists')) throw new Error('R075 FAIL: lethal marked death did not award hazard_assists: ' + JSON.stringify(res.badges));
	// Rockfall room/5x5 loop: stepper and bystander both pre-marked.
	expectHit('rockStepper', 'trap');
	expectHit('rockBystander', 'trap');
	if (!res.phases.rock.stepperMark || !res.phases.rock.bystanderMark) throw new Error('R075 FAIL: rockfall mark state: ' + JSON.stringify(res.phases.rock));
	// Explosive: centre + NEIGHBOURS9 bystander, fire bucket, all pre-marked.
	expectHit('blastStepper', 'fire');
	expectHit('blastBystander', 'fire');
	if (!res.phases.blast.stepperMark || !res.phases.blast.bystanderMark) throw new Error('R075 FAIL: explosive mark state: ' + JSON.stringify(res.phases.blast));

	// Refresh the FOV (the game does this after every move) and record where the
	// test rats actually are at shot time, so the PNG can be correlated with data.
	const preShot = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		s.fov.update(s.hero.x, s.hero.y, s.viewRadius());
		const rats = s.__r075rats || [];
		return {
			hero: { x: s.hero.x, y: s.hero.y },
			rats: rats.map((m) => ({ tag: m.r075, x: m.x, y: m.y, hp: m.hp, visible: s.fov.isVisible(m.x, m.y) })),
		};
	})()`);
	console.log('pre-shot: ' + JSON.stringify(preShot));
	await settle(700);
	await game.screenshot('r075-hazard-marks.png');

	// markHazardMob rejects dead mobs (after the shot: this probe rat is left as an
	// un-died corpse, so it never appears in the verification image).
	const probe = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const hx = s.hero.x, hy = s.hero.y;
		let cell = null;
		for (let d = 3; d <= 8 && !cell; d++) for (let dy = -d; dy <= d && !cell; dy++) for (let dx = -d; dx <= d && !cell; dx++) {
			if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
			const x = hx + dx, y = hy + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) cell = { x, y };
		}
		if (!cell) return { ok: false, why: 'no free cell for probe' };
		const m = s.spawnMonster('rat', cell, false);
		m.hp = 0;
		s.markHazardMob(m);
		return { ok: m.buffs.hazardAssist === undefined };
	})()`);
	if (!probe || probe.ok !== true) throw new Error('R075 FAIL: markHazardMob accepted a dead mob: ' + JSON.stringify(probe));

	if (game.consoleErrors().length) throw new Error(`R075 FAIL: console errors: ${game.consoleErrors()[0]}`);
	console.log(`R075 PASS: ${res.recs.length} dispatch records all pre-marked (poison/worn/grim/rockfall/explosive), hazard_assists credited, dead mobs rejected (fr)`);
};
