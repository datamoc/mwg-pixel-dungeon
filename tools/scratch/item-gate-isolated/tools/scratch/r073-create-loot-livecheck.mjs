// node tools/browserTest.mjs --script tools/scratch/r073-create-loot-livecheck.mjs
// R073 browser verification (2026-09-30): GnollTrickster.createLoot() and
// Eye.createLoot() (ROADMAP R073, coverage row "GnollTrickster.createLoot()";
// Java source `actors/mobs/{GnollTrickster,Eye}.java`, tag v3.3.8):
//  - GnollTrickster: `Actors.rollLoot({chance: 1})` mirrors Java's
//    `lootChance = 1f`, so every kill drops a generated MISSILE payload at the
//    death cell - reset to level 0 / uncursed / unidentified and its default
//    quantity halved rounded up (generator.ts itemRandom rolls missile defaults
//    {2,3,4}, so an observed stack of exactly 1 proves the halving ran).
//    The item id comes from MWL_MISSILE_BY_CLASS (content/missiles.mwl, 16
//    missile_* ids) - never the generic 'stone' id a generic loot row would use.
//  - Eye: `Random.Int(4)` via eyeLootOutcome - two outcomes return a Dewdrop
//    plus a second Dewdrop on a random Java-valid neighbour
//    (`inside && (get !== SOLID || passable)`, SOLID=9), one a default Seed
//    (id 'seed'), one a default Runestone (stoneOf* alias ids).
//  - Generic MOB_LOOT rows are bypassed for BOTH kinds
//    (deathSaveRefresh.ts:594), asserted as exact new-entry counts via a
//    groundItems before/after delta per kill.
//  - All kills run synchronously inside one eval: freshly spawned mobs never
//    take a turn, so cells stay put and the hero is never attacked.
//  - Candidate cells: whole 3x3 ring free of creatures/heaps/corpas at pick
//    time and >=3 apart (rings disjoint, so each kill's delta stays exact),
//    visible cells picked first so the loot piles read in the PNG.
const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Missiles: content/missiles.mwl table missileDefinitions (MWL_MISSILE_BY_CLASS).
const MISSILE_IDS = [
	'missile_bolas', 'missile_fishingspear', 'missile_forcecube', 'missile_heavyboomerang',
	'missile_javelin', 'missile_kunai', 'missile_shuriken', 'missile_throwingclub',
	'missile_throwinghammer', 'missile_throwingknife', 'missile_throwingspear',
	'missile_throwingspike', 'missile_throwingstone', 'missile_tippeddart',
	'missile_tomahawk', 'missile_trident',
];
// Runestones: content/consumable-aliases.mwl rows with category "stone".
const RUNESTONE_IDS = [
	'stoneOfAggression', 'stoneOfAugmentation', 'stoneOfBlast', 'stoneOfBlink',
	'stoneOfClairvoyance', 'stoneOfDeepSleep', 'stoneOfDetectMagic', 'stoneOfEnchantment',
	'stoneOfFear', 'stoneOfFlock', 'stoneOfIntuition', 'stoneOfShock',
];

export default async (game) => {
	await game.startGame();
	// Run-start InterlevelScene curtain (same wait as the R005/R075 checks).
	const curtainDeadline = Date.now() + 10000;
	let curtain = true;
	while (curtain && Date.now() < curtainDeadline) {
		await settle(200);
		curtain = await game.eval(`(() => { const s = window.__MWG__.currentScene; return !!(s && s['interlevel']); })()`);
	}
	if (curtain) throw new Error('InterlevelScene curtain never cleared after startGame');

	const res = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const out = { trickster: [], eye: [], outcomes: [], kills: 0 };
		const hx = s.hero.x, hy = s.hero.y;
		const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
		const RING = [[0,0],[1,0],[0,1],[-1,0],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];

		// Kill cells: nearest-first, Chebyshev >=2 from the hero, whole 3x3 ring
		// inside and free of creatures/heaps (and never a chasm - spawnGroundItem
		// drops payloads through those), so every kill's groundItems delta is exact.
		const collect = (visibleOnly) => {
			const list = [];
			// +/-14 so the pool holds enough cheb>=3-spaced cells for the worst case
			// (5 tricksters + 20 eye kills); the +/-9 square exhausted on a tight level.
			for (let dy = -14; dy <= 14; dy++) for (let dx = -14; dx <= 14; dx++) {
				const d = Math.max(Math.abs(dx), Math.abs(dy));
				if (d < 2) continue;
				const x = hx + dx, y = hy + dy;
				if (!s.level.inside(x, y)) continue;
				if (!s.level.passable(x, y)) continue;
				const visible = s.fov ? s.fov.isVisible(x, y) : false;
				if (visibleOnly ? !visible : visible) continue;
				if (s.secrets && s.secrets.isSecret(x, y)) continue;
				let ok = true;
				for (const [rx, ry] of RING) {
					const cx = x + rx, cy = y + ry;
					if (!s.level.inside(cx, cy)) { ok = false; break; }
					if (cx === hx && cy === hy) { ok = false; break; }
					if (s.creatureAt(cx, cy)) { ok = false; break; }
					if (s.groundItemAt(cx, cy)) { ok = false; break; }
					if (s.isChasmCell(cx, cy)) { ok = false; break; }
				}
				if (!ok) continue;
				list.push({ x, y, d });
			}
			return list.sort((a, b) => a.d - b.d);
		};
		const pool = collect(true).concat(collect(false));
		const used = [];
		let ci = 0;
		const nextCell = () => {
			for (; ci < pool.length; ci++) {
				const c = pool[ci];
				// >=3 keeps picked cells' 3x3 rings disjoint from each other, so loot
				// from earlier kills can never sit inside a later kill's delta ring.
				if (used.some((u) => cheb(u, c) < 3)) continue;
				used.push(c);
				return c;
			}
			return null;
		};
		const killAt = (kind) => {
			const cell = nextCell();
			if (!cell) return { fail: 'cells exhausted at ' + kind };
			const m = s.spawnMonster(kind, cell, false);
			if (!m) return { fail: 'spawn failed: ' + kind };
			const before = new Set(s.groundItems);
			m.hp = 0;
			s.kill(m, 'foe');
			const added = s.groundItems.filter((g) => !before.has(g));
			return { cell, added, visible: s.fov.isVisible(cell.x, cell.y) };
		};

		// T+E interleaved so both loot types share the visible cells (the PNG then
		// shows missile stacks AND dewdrops/seeds/runestones, not just one kind).
		// T. GnollTrickster x5: missile payload + resets + halving, one drop each.
		// E. Eye until all three outcomes show (honest RNG, cap 20 kills).
		const seen = new Set();
		let ti = 0, ei = 0;
		while (ti < 5 || (ei < 20 && seen.size < 3)) {
			if (ti < 5) {
				const k = killAt('gnollTrickster');
				if (k.fail) return { fail: k.fail };
				const g = k.added[0];
				out.trickster.push({
					added: k.added.length,
					atCell: !!g && g.x === k.cell.x && g.y === k.cell.y,
					visible: k.visible,
					kind: g ? g.kind : null,
					id: g && g.item ? g.item.id : null,
					q: g && g.item ? g.item.quantity : null,
					level: g && g.item ? g.item.level : null,
					cursed: g && g.item ? g.item.cursed : null,
					identified: g && g.item ? g.item.identified : null,
				});
				ti += 1;
			}
			if (ei < 20 && seen.size < 3) {
				const k = killAt('eye');
				if (k.fail) return { fail: k.fail };
				const atCell = k.added.filter((g) => g.x === k.cell.x && g.y === k.cell.y);
				const elsewhere = k.added.filter((g) => !(g.x === k.cell.x && g.y === k.cell.y));
				const rec = {
					n: k.added.length,
					visible: k.visible,
					atCellKinds: atCell.map((g) => g.kind),
					elsewhere: elsewhere.map((g) => ({ kind: g.kind, x: g.x, y: g.y })),
					id: atCell.length > 0 && atCell[0].item ? atCell[0].item.id : null,
				};
				if (atCell.length === 1 && elsewhere.length === 0 && (atCell[0].kind === 'seed' || atCell[0].kind === 'stone')) {
					rec.outcome = atCell[0].kind;
					seen.add(rec.outcome);
				} else if (atCell.length === 1 && atCell[0].kind === 'dewdrop' && elsewhere.length === 1 && elsewhere[0].kind === 'dewdrop') {
					rec.outcome = 'dewdrop';
					const nb = elsewhere[0];
					rec.nbCheb = cheb(nb, k.cell);
					// Java-valid neighbour rule from deathSaveRefresh.ts:585 (SOLID = 9).
					rec.nbValid = s.level.inside(nb.x, nb.y) && (s.level.get(nb.x, nb.y) !== 9 || s.level.passable(nb.x, nb.y));
					seen.add('dewdrop');
				} else {
					rec.unexpected = true;
				}
				out.eye.push(rec);
				ei += 1;
				out.kills += 1;
			}
		}
		out.outcomes = [...seen];
		// Every ground item still visible after the kills, in hero-relative cells -
		// the PNG's piles are then identifiable by position (hero sits at canvas
		// centre, one cell = 16px).
		out.hx = hx;
		out.hy = hy;
		out.visibleDrops = s.groundItems.filter((g) => s.fov.isVisible(g.x, g.y))
			.map((g) => {
				const rec = { dx: g.x - hx, dy: g.y - hy, kind: g.kind, id: g.item ? g.item.id : null, q: g.item ? g.item.quantity : null };
				try {
					// Rendered sprite's stage position - lets the PNG be cropped at the
					// exact pixels each recorded drop paints, so sprites and data match up.
					const sp = s.sprite(g);
					const p = sp && sp.getGlobalPosition ? sp.getGlobalPosition() : (sp ? { x: sp.x, y: sp.y } : null);
					if (p) { rec.sx = Math.round(p.x); rec.sy = Math.round(p.y); }
				} catch { rec.sx = -1; rec.sy = -1; }
				return rec;
			});
		return out;
	})()`);
	console.log(JSON.stringify(res, null, 1));
	if (res.fail) throw new Error('R073 FAIL: ' + res.fail);

	// --- GnollTrickster: exactly one missile drop per kill, resets, halved qty ---
	if (res.trickster.length !== 5) throw new Error(`R073 FAIL: expected 5 trickster kills, got ${res.trickster.length}`);
	res.trickster.forEach((t, i) => {
		const ok = t.added === 1 && t.atCell && t.kind === 'stone' && MISSILE_IDS.includes(t.id)
			&& (t.q === 1 || t.q === 2) && t.level === 0 && t.cursed === false && t.identified === false;
		if (!ok) throw new Error(`R073 FAIL: trickster[${i}]: ` + JSON.stringify(t));
	});
	// Defaults roll {2,3,4} (generator.ts), so a stack of 1 can only come from the
	// halving - it is the per-instance proof that the reset ran.
	if (!res.trickster.some((t) => t.q === 1)) {
		throw new Error('R073 FAIL: no halved-to-1 stack observed (all defaults rolled 2) - rerun');
	}

	// --- Eye: all three outcomes, exact entry counts, valid dewdrop neighbour ---
	for (const o of ['dewdrop', 'seed', 'stone']) {
		if (!res.outcomes.includes(o)) throw new Error(`R073 FAIL: eye outcome '${o}' never seen in ${res.kills} kills - rerun`);
	}
	res.eye.forEach((e, i) => {
		if (e.unexpected || e.atCellKinds.length !== 1) throw new Error(`R073 FAIL: eye[${i}]: ` + JSON.stringify(e));
		if (e.outcome === 'dewdrop') {
			if (e.elsewhere.length !== 1 || e.nbCheb !== 1 || e.nbValid !== true) {
				throw new Error(`R073 FAIL: eye[${i}] dewdrop neighbour: ` + JSON.stringify(e));
			}
		} else if (e.outcome === 'seed') {
			if (e.elsewhere.length !== 0 || e.id !== 'seed') throw new Error(`R073 FAIL: eye[${i}] seed: ` + JSON.stringify(e));
		} else if (e.outcome === 'stone') {
			if (e.elsewhere.length !== 0 || !RUNESTONE_IDS.includes(e.id)) {
				throw new Error(`R073 FAIL: eye[${i}] runestone: ` + JSON.stringify(e));
			}
		}
	});

	await settle(700);
	await game.screenshot('r073-create-loot.png');

	if (game.consoleErrors().length) throw new Error(`R073 FAIL: console errors: ${game.consoleErrors()[0]}`);
	console.log(`R073 PASS: trickster missile stacks ${res.trickster.map((t) => t.q).join('/')} halved+reset, eye outcomes ${res.outcomes.join('+')} in ${res.kills} kills, generic rows bypassed (fr)`);
};
