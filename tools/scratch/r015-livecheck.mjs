/**
 * R015 live probes against the built game: room-missed explore percent (scale steps,
 * evidence sensitivity, purity), floor-capture save of `autoExplored`, and the pylon
 * foul/score branch. Run via `npm run build` then
 * `node tools/browserTest.mjs --script tools/scratch/r015-livecheck.mjs`; the JSON
 * asserts itself (`onScale`, ladder ordering, `pure`, `fouled`, empty `errors`).
 */
export default async (game) => {
	const out = {};
	await game.startGame();

	// 1) the live floor's explore fraction must be one of Java's four scale steps
	out.p0 = await game.eval("return scene['levelExplorePercent'](scene.depth);");
	out.onScale = [1, 0.5, 0.2, 0].includes(out.p0);

	// 2) one openable key heap per room interior must bottom the fraction at 0, and
	//    removing them must restore the original value (evidence gathering is pure).
	out.forced = await game.eval(`
		const rooms = scene.level.rooms;
		const pushed = [];
		for (const r of rooms) {
			const g = { id: 'probe-' + r.left + '-' + r.top, kind: 'chest', x: r.left + 1, y: r.top + 1, chest: 'normal', item: { id: 'ironKey', quantity: 1 } };
			scene.groundItems.push(g); pushed.push(g);
		}
		const after = rooms.length ? scene['levelExplorePercent'](scene.depth) : null;
		for (const g of pushed) scene.groundItems.splice(scene.groundItems.indexOf(g), 1);
		const restored = scene['levelExplorePercent'](scene.depth);
		return { rooms: rooms.length, after, restored };
	`);

	// 3) sensitivity: the real scan must react to the evidence it reads. Clearing the
	//    ground heaps must raise the fraction (unseen/openable heaps mark rooms missed),
	//    clearing the undiscovered-secret cells must raise it again, and putting both
	//    back must reproduce the original value exactly - a pure re-read of live state.
	out.sens = await game.eval(`
		const S = scene;
		//Observation-only replication of the scan's composite conditions, same run/floor
		//as the values below, so each scale step is attributable to real live evidence.
		let ironLocked = 0, crystalLocked = 0, barricades = 0, unfoundSecret = 0;
		for (let y = 0; y < S.level.height; y++) for (let x = 0; x < S.level.width; x++) {
			const cell = S.level.index(x, y);
			const paint = S.portedPaint ? S.portedPaint.map[cell] : undefined;
			if (S.doors.isLocked(x, y)) {
				if (!S.crystalDoorCells.has(cell) && S.doors.requiredKey(x, y) !== 'heroLock') ironLocked++;
				else crystalLocked++;
			}
			if (paint === 13) barricades++;
			if (S.level.get(x, y) === 0 && S.secretDoorCells.has(cell)) unfoundSecret++;
		}
		const KEYS = ['crystalKey', 'ironKey', 'goldenKey', 'wornKey'];
		let unseenOrOpenable = 0, keyPayload = 0;
		for (const g of S.groundItems) {
			if (g.autoExplored) continue;
			const openable = g.chest === 'normal' || g.chest === 'locked';
			const seen = S.fov.explored.has(S.level.index(g.x, g.y));
			if (!seen || openable) unseenOrOpenable++;
			else if (g.item && KEYS.includes(g.item.id)) keyPayload++;
		}
		const breakdown = {
			ironLocked, crystalLocked, barricades, unfoundSecret, unseenOrOpenable, keyPayload,
			eternal: S.eternalFire.total() > 0, sacrificial: S.sacrificialFire.total() > 0,
			statues: S.creatures.filter((c) => !c.isHero && !c.isAlly && c.hp > 0 && (c.kind === 'statue' || c.kind === 'armoredStatue')).length,
			mimics: S.creatures.filter((c) => !c.isHero && c.hp > 0 && c.kind === 'mimic').length,
			crystalInBag: S.bag.items.some((i) => i.id === 'crystalKey' && i.depth === (S.activeFloorDepth ?? S.depth)),
		};
		const p0 = scene['levelExplorePercent'](scene.depth);
		const heaps = scene.groundItems.splice(0, scene.groundItems.length);
		const pNoHeaps = scene['levelExplorePercent'](scene.depth);
		const secrets = [...scene.secretDoorCells];
		scene.secretDoorCells.clear();
		const pBare = scene['levelExplorePercent'](scene.depth);
		for (const c of secrets) scene.secretDoorCells.add(c);
		for (const g of heaps) scene.groundItems.push(g);
		const pR = scene['levelExplorePercent'](scene.depth);
		return { breakdown, p0, pNoHeaps, pBare, restored: pR, pure: pR === p0, secretCells: secrets.length, heaps: heaps.length };
	`);

	// 4) floor capture runs the snapshot path and the saved ground-item list carries
	//    `autoExplored` through (the save half of the parse/save/restore plumbing).
	out.capture = await game.eval(`
		const rooms = scene.level.rooms;
		const at = rooms.length ? { x: rooms[0].left + 1, y: rooms[0].top + 1 } : { x: scene.hero.x, y: scene.hero.y };
		const probe = { id: 'probe-auto', kind: 'chest', x: at.x, y: at.y, chest: 'normal', autoExplored: true };
		scene.groundItems.push(probe);
		scene['captureActiveFloor']();
		scene.groundItems.splice(scene.groundItems.indexOf(probe), 1);
		const depth = scene.activeFloorDepth;
		const st = depth === null ? null : scene.floorStates.get(depth);
		const saved = st ? st.groundItems.find((g) => g.autoExplored === true) : null;
		return { depth, savedAutoExplored: saved ? saved.autoExplored === true : false };
	`);

	// 5) the pylon shock branch: hero-side foul clears the badge (score write runs on
	//    the same line - `addBossScore` state is WeakMap-private, so the foul flip is
	//    the observable half; `test:score` pins the counter itself).
	out.pylon = await game.eval(`
		const hero = scene.hero;
		const hp0 = hero.hp, max0 = hero.maxHp;
		hero.hp = 5000; hero.maxHp = Math.max(max0, 5000);
		scene.qualifiedForBossChallenge = true;
		const dirs = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
		let spot = null;
		for (const d of dirs) {
			const x = hero.x + d[0], y = hero.y + d[1];
			if (scene.level.passable(x, y) && !scene.creatureAt(x, y)) { spot = { x, y }; break; }
		}
		if (!spot) return { skipped: 'no free adjacent cell' };
		const pylon = { kind: 'pylon', x: spot.x, y: spot.y, hp: 100, maxHp: 100, pylonActive: true, pylonTargetNeighbor: 0 };
		for (let c = 0; c < 8; c++) { pylon.pylonTargetNeighbor = c; scene['takePylonTurn'](pylon); }
		const fouled = scene.qualifiedForBossChallenge === false;
		hero.maxHp = max0; hero.hp = Math.min(hp0, max0);
		return { fouled, heroHpDelta: hp0 - hero.hp };
	`);

	//The descend interstitial is still fading right after startGame (the smoke test
	//sleeps 1500ms for the same reason) - let the level render before capturing.
	await new Promise((resolve) => setTimeout(resolve, 2500));
	const shot = await game.screenshot('tools/scratch/browser-test/r015-after-probes.png');
	out.errors = game.consoleErrors();
	out.shotBytes = shot?.length;
	console.log(JSON.stringify(out, null, 2));
	return out;
};
