// node tools/browserTest.mjs --script tools/scratch/r005-teleport-heaps-livecheck.mjs
// R005 browser verification (2026-09-30): AlarmTrap / TeleportationTrap /
// SummoningTrap.activate() (ROADMAP R005, coverage rows-terrain line "closes R005";
// Java source `levels/traps/{Alarm,Teleportation,Summoning}Trap.java`, tag v3.3.8):
//  - teleportation/warping move the TOP item of each plain heap on the trap's
//    NEIGHBOURS9 to an unseen (out-of-FOV) respawn cell - stacks keep the rest,
//    chests/shop stands are skipped, and the move happens even when the trap cell
//    itself is unexplored (the burst is un-gated by the hero's view)
//  - the LIGHT burst is spawned AT THE TRAP CELL (4-mote 'light' speck config,
//    effectBursts.ts; cell geometry asserted via emitter.position / TILE=16)
//  - Divergence: when no landing cell exists the payload stays put (Java's
//    Heap.pickUp() can consume it first) - asserted by patching fov.isVisible to
//    make every candidate cell "seen", which empties teleportCandidates
//  - alarm wakes every mob and points its hunt memory (lastSeen) at the trap cell
//  - summoning spawns 1-3 awake mobs on free NEIGHBOURS9 cells
// Test-cell rings are kept free of natural creatures AND heaps so burst counts and
// heap moves are attributable to the phase under test.
// The TELEPORT audio cue (`runState.audio.cue('teleport', 0.7)`) is not asserted
// live: runState is a module singleton with no page handle (window.__MWG__ exposes
// currentScene/app only - recorded in out.mwgKeys); the cue call is source-pinned.
const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const TILE = 16; // dungeonConstants.ts:6

export default async (game) => {
	await game.startGame();
	// Run-start InterlevelScene curtain (same wait as the R068/R075 checks).
	const curtainDeadline = Date.now() + 10000;
	let curtain = true;
	while (curtain && Date.now() < curtainDeadline) {
		await settle(200);
		curtain = await game.eval(`(() => { const s = window.__MWG__.currentScene; return !!(s && s['interlevel']); })()`);
	}
	if (curtain) throw new Error('InterlevelScene curtain never cleared after startGame');

	const res = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const TILE = ${TILE};
		const out = { phases: {}, mwgKeys: Object.keys(window.__MWG__) };
		const hx = s.hero.x, hy = s.hero.y;
		const free = (x, y) => s.level.passable(x, y) && !s.creatureAt(x, y);
		const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
		const RING = [[0,0],[1,0],[0,1],[-1,0],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];

		// Candidate trap cells: nearest-first, Chebyshev >=3 from the hero (he is never
		// a victim), whole 3x3 ring free of creatures AND heaps so every burst and heap
		// move in a phase is ours. visibleOnly=true prefers cells in the current FOV
		// (the alarm say/scream and summoned mobs read in the PNG); false selects
		// cells OUTSIDE the FOV for the dark/un-gated phase.
		const collect = (visibleOnly) => {
			const list = [];
			for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) {
				const d = Math.max(Math.abs(dx), Math.abs(dy));
				if (d < 3) continue;
				const x = hx + dx, y = hy + dy;
				if (!s.level.inside(x, y)) continue;
				const visible = s.fov ? s.fov.isVisible(x, y) : false;
				if (visibleOnly ? !visible : visible) continue;
				if (s.secrets && s.secrets.isSecret(x, y)) continue;
				let ok = true, slots = 0;
				for (const [rx, ry] of RING) {
					const cx = x + rx, cy = y + ry;
					if (!s.level.inside(cx, cy)) { continue; }
					if (cx === hx && cy === hy) { ok = false; break; }
					if (s.creatureAt(cx, cy)) { ok = false; break; }
					if (s.groundItemAt(cx, cy)) { ok = false; break; }
					// Chasm cells read passable here, but spawnGroundItem drops the
					// payload to the floor below instead of leaving a heap (run3 hit
					// this) - never count them as heap slots.
					if (s.isChasmCell(cx, cy)) continue;
					if (free(cx, cy)) slots++;
				}
				if (!ok || slots < 2) continue;
				list.push({ x, y, d });
			}
			return list.sort((a, b) => a.d - b.d);
		};
		const used = [];
		const pick = (list) => {
			for (const c of list) {
				// >=3 keeps the two cells' 3x3 rings disjoint (they overlap only at
				// Chebyshev <=2), while fitting more picks into a small FOV.
				if (used.some((u) => cheb(u, c) < 3)) continue;
				used.push(c);
				return c;
			}
			return null;
		};
		const darkCells = collect(false);
		const visibleCells = collect(true);
		const pickSet = (mainList) => {
			used.length = 0;
			const t = {};
			// Visibility matters most for t7 (the alarm say/scream is gated on it),
			// then for the cells whose surviving sprites read in the PNG; t3/t5/t6
			// have no view gates and may spill into dark cells if the FOV is small.
			t.t7 = pick(mainList);
			t.t1 = pick(mainList);
			t.t2 = pick(mainList);
			t.t8 = pick(mainList);
			t.t3 = pick(mainList);
			t.t5 = pick(mainList);
			t.t6 = pick(mainList);
			t.t4 = pick(darkCells);
			return t;
		};
		let T = pickSet(visibleCells);
		if (Object.values(T).some((v) => !v)) T = pickSet(visibleCells.concat(darkCells));
		for (const [k, v] of Object.entries(T)) if (!v) return { fail: 'no spot for ' + k };
		out.spots = T;
		out.visibleCellsFound = visibleCells.length;
		out.darkCellsFound = darkCells.length;

		// Free ring slot of a trap cell for a heap (or the alarm rat).
		const slotFor = (t) => {
			for (const [rx, ry] of RING) {
				const c = { x: t.x + rx, y: t.y + ry };
				if (!s.level.inside(c.x, c.y) || !free(c.x, c.y)) continue;
				if (c.x === hx && c.y === hy) continue;
				if (s.groundItemAt(c.x, c.y)) continue;
				if (s.isChasmCell(c.x, c.y)) continue; // drop-through, no heap forms
				return c;
			}
			return null;
		};
		const burstCountAt = (t) => s.effectBursts.filter(
			(b) => b.emitter && b.emitter.position && b.emitter.position.x === t.x * TILE && b.emitter.position.y === t.y * TILE,
		).length;
		// cat 17 = Cat.POTION (const enum in items/generator.ts); cls must be a real
		// MWL consumable alias sourceClass (src/content/consumable-aliases.mwl).
		const mkItem = () => s.generatedInventoryItem({ cat: 17, cls: 'PotionOfHealing', cursed: false, level: 0, quantity: 1, hasGoodEnchant: false });
		const findEntry = (item) => s.groundItems.find((g) => g.item === item) || null;
		const arm = (cell, kind) => {
			const i = s.level.index(cell.x, cell.y);
			s.trapKinds.set(i, kind);
			s.spentTrapCells.delete(i);
		};
		const bursts = {}; // cell key -> emitter delta for this phase
		const pre = (t) => { bursts[t.x + ',' + t.y] = burstCountAt(t); };
		const delta = (t) => burstCountAt(t) - (bursts[t.x + ',' + t.y] || 0);

		try {
			// A. teleportation, single-item plain heap.
			let src = slotFor(T.t1);
			if (!src) return { fail: 'no heap slot t1' };
			const itemA = mkItem();
			s.spawnGroundItem('potion', src.x, src.y, itemA);
			pre(T.t1);
			arm(T.t1, 'teleportation');
			s.activateUtilityTrap('teleportation', T.t1.x, T.t1.y);
			const movedA = findEntry(itemA);
			out.phases.single = {
				sourceCleared: s.groundItemAt(src.x, src.y) === null,
				moved: !!movedA && (movedA.x !== src.x || movedA.y !== src.y),
				unseen: !!movedA && !s.fov.isVisible(movedA.x, movedA.y),
				burstsAdded: delta(T.t1),
			};

			// B. teleportation, two-entry stack: only the TOP moves.
			src = slotFor(T.t2);
			if (!src) return { fail: 'no heap slot t2' };
			const itemLow = mkItem();
			const itemTop = mkItem();
			s.spawnGroundItem('potion', src.x, src.y, itemLow);
			s.spawnGroundItem('potion', src.x, src.y, itemTop);
			const topBefore = s.groundItemAt(src.x, src.y);
			pre(T.t2);
			arm(T.t2, 'teleportation');
			s.activateUtilityTrap('teleportation', T.t2.x, T.t2.y);
			const movedTop = findEntry(itemTop);
			const lowAfter = s.groundItemAt(src.x, src.y);
			out.phases.stack = {
				topWasItemTop: !!topBefore && topBefore.item === itemTop,
				topMoved: !!movedTop && (movedTop.x !== src.x || movedTop.y !== src.y),
				topUnseen: !!movedTop && !s.fov.isVisible(movedTop.x, movedTop.y),
				lowRemains: !!lowAfter && lowAfter.item === itemLow,
				burstsAdded: delta(T.t2),
			};

			// C. warping: the shared branch must relocate too (hero stays >=3 away,
			// so the explored-map wipe arm does not fire).
			src = slotFor(T.t3);
			if (!src) return { fail: 'no heap slot t3' };
			const itemW = mkItem();
			s.spawnGroundItem('potion', src.x, src.y, itemW);
			pre(T.t3);
			arm(T.t3, 'warping');
			s.activateUtilityTrap('warping', T.t3.x, T.t3.y);
			const movedW = findEntry(itemW);
			out.phases.warping = {
				moved: !!movedW && (movedW.x !== src.x || movedW.y !== src.y),
				unseen: !!movedW && !s.fov.isVisible(movedW.x, movedW.y),
				burstsAdded: delta(T.t3),
			};

			// D. dark trap cell: heap move + burst are un-gated by the hero's view.
			src = slotFor(T.t4);
			if (!src) return { fail: 'no heap slot t4' };
			const itemD = mkItem();
			const placedD = s.spawnGroundItem('potion', src.x, src.y, itemD);
			const entriesAfterPlaceD = s.groundItems.filter((g) => g.item === itemD).length;
			pre(T.t4);
			arm(T.t4, 'teleportation');
			s.activateUtilityTrap('teleportation', T.t4.x, T.t4.y);
			const movedD = findEntry(itemD);
			out.phases.dark = {
				slotChasm: s.isChasmCell(src.x, src.y),
				slotPassable: s.level.passable(src.x, src.y),
				placed: !!placedD,
				entriesAfterPlace: entriesAfterPlaceD,
				trapVisible: s.fov.isVisible(T.t4.x, T.t4.y),
				moved: !!movedD && (movedD.x !== src.x || movedD.y !== src.y),
				stillAtSource: !!movedD && movedD.x === src.x && movedD.y === src.y,
				entriesForItem: s.groundItems.filter((g) => g.item === itemD).length,
				burstsAdded: delta(T.t4),
			};

			// E. negatives: a shop stand and a chest never move.
			const slotE1 = slotFor(T.t5);
			let slotE2 = null;
			if (slotE1) {
				for (const [rx, ry] of RING) {
					const c = { x: T.t5.x + rx, y: T.t5.y + ry };
					if (!s.level.inside(c.x, c.y) || !free(c.x, c.y)) continue;
					if (c.x === hx && c.y === hy) continue;
					if (s.groundItemAt(c.x, c.y)) continue;
					if (s.isChasmCell(c.x, c.y)) continue;
					if (c.x === slotE1.x && c.y === slotE1.y) continue;
					slotE2 = c;
					break;
				}
			}
			if (!slotE1 || !slotE2) return { fail: 'no slots for negatives' };
			const itemShop = mkItem();
			const itemChest = mkItem();
			const shopEntry = s.spawnGroundItem('potion', slotE1.x, slotE1.y, itemShop, undefined, true);
			const chestEntry = s.spawnGroundItem('potion', slotE2.x, slotE2.y, itemChest, 'normal');
			pre(T.t5);
			arm(T.t5, 'teleportation');
			s.activateUtilityTrap('teleportation', T.t5.x, T.t5.y);
			out.phases.negatives = {
				shopStillThere: !!shopEntry && findEntry(itemShop) === shopEntry && shopEntry.x === slotE1.x && shopEntry.y === slotE1.y,
				chestStillThere: !!chestEntry && findEntry(itemChest) === chestEntry && chestEntry.x === slotE2.x && chestEntry.y === slotE2.y,
				burstsAdded: delta(T.t5),
			};

			// F. Divergence: with every candidate cell "seen" teleportCandidates is
			// empty, so the payload must survive where Java may consume it.
			src = slotFor(T.t6);
			if (!src) return { fail: 'no heap slot t6' };
			const itemF = mkItem();
			const placedF = s.spawnGroundItem('potion', src.x, src.y, itemF);
			const entriesAfterPlaceF = s.groundItems.filter((g) => g.item === itemF).length;
			const realIsVisible = s.fov.isVisible;
			pre(T.t6);
			s.fov.isVisible = () => true;
			try {
				arm(T.t6, 'teleportation');
				s.activateUtilityTrap('teleportation', T.t6.x, T.t6.y);
			} finally {
				s.fov.isVisible = realIsVisible;
			}
			const keptF = findEntry(itemF);
			out.phases.divergence = {
				slotChasm: s.isChasmCell(src.x, src.y),
				slotPassable: s.level.passable(src.x, src.y),
				placed: !!placedF,
				entriesAfterPlace: entriesAfterPlaceF,
				itemKeptAtSource: !!keptF && keptF.x === src.x && keptF.y === src.y,
				entriesForItem: s.groundItems.filter((g) => g.item === itemF).length,
				burstsAdded: delta(T.t6),
			};

			// G. alarm: a sleeping mob wakes with its hunt memory on the trap cell.
			const alarmCell = slotFor(T.t7);
			if (!alarmCell) return { fail: 'no alarm rat cell' };
			const rat = s.spawnMonster('rat', alarmCell, false);
			rat.sleeping = true;
			pre(T.t7);
			const t7Visible = s.fov.isVisible(T.t7.x, T.t7.y);
			arm(T.t7, 'alarm');
			s.activateUtilityTrap('alarm', T.t7.x, T.t7.y);
			out.phases.alarm = {
				woke: rat.sleeping === false,
				huntAtTrap: !!rat.lastSeen && rat.lastSeen.x === T.t7.x && rat.lastSeen.y === T.t7.y,
				trapVisibleAtTrigger: t7Visible,
				screamBurstsAdded: delta(T.t7),
			};

			// H. summoning: 1-3 awake mobs on free neighbour cells.
			const before = s.creatures.slice();
			arm(T.t8, 'summoning');
			s.activateUtilityTrap('summoning', T.t8.x, T.t8.y);
			const spawned = s.creatures.filter((c) => !before.includes(c));
			out.phases.summoning = {
				count: spawned.length,
				allAwake: spawned.every((c) => c.sleeping === false),
				allNear: spawned.every((c) => cheb(c, T.t8) <= 1),
			};
		} finally {
			// safety: never leave the FOV probe patched if a phase threw.
			if (s.fov.isVisible.__r005patch) s.fov.isVisible = s.fov.isVisible.__r005original;
		}
		return out;
	})()`);
	console.log(JSON.stringify(res, null, 1));
	if (res.fail) throw new Error('R005 FAIL: ' + res.fail);

	const expectPhase = (name, cond) => {
		const p = res.phases[name];
		if (!p || !cond(p)) throw new Error(`R005 FAIL: ${name}: ` + JSON.stringify(p));
	};
	expectPhase('single', (p) => p.sourceCleared && p.moved && p.unseen && p.burstsAdded === 1);
	expectPhase('stack', (p) => p.topWasItemTop && p.topMoved && p.topUnseen && p.lowRemains && p.burstsAdded === 1);
	expectPhase('warping', (p) => p.moved && p.unseen && p.burstsAdded === 1);
	expectPhase('dark', (p) => p.placed && p.entriesAfterPlace === 1 && p.trapVisible === false && p.moved && p.burstsAdded === 1);
	expectPhase('negatives', (p) => p.shopStillThere && p.chestStillThere && p.burstsAdded === 0);
	expectPhase('divergence', (p) => p.placed && p.entriesAfterPlace === 1 && p.itemKeptAtSource && p.entriesForItem === 1 && p.burstsAdded === 0);
	expectPhase('alarm', (p) => p.woke && p.huntAtTrap && p.trapVisibleAtTrigger && p.screamBurstsAdded === 1);
	expectPhase('summoning', (p) => p.count >= 1 && p.count <= 3 && p.allAwake && p.allNear);

	await settle(700);
	await game.screenshot('r005-teleport-heaps.png');

	if (game.consoleErrors().length) throw new Error(`R005 FAIL: console errors: ${game.consoleErrors()[0]}`);
	console.log('R005 PASS: heap tops moved unseen (stack remainder kept), chest/shop skipped, dark-cell burst un-gated, no-destination payload preserved, alarm beckon + 1-3 summons (fr)');
};
