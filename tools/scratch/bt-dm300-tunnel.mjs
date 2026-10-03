// R092: DM-300 supercharged wall tunnelling (DM300.getCloser), live on the depth-15 caves boss floor.
export default async (game) => {
	await game.startGame();
	const r = await game.eval(`
		const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
		scene['depth'] = 15; scene['enterLevel'](); await sleep(4000);
		const w = scene['level'].width, paint = scene['portedPaint'];
		const pylon = scene['cavesBossPylons'][0];
		scene.hero.x = pylon.x + 2; scene.hero.y = pylon.y;
		scene['checkCavesBossPylonGate'](); await sleep(500);
		const dm = scene['creatures'].find((c) => c.kind === 'dm300');
		if (!dm) return { spawned: false };
		const isWall = (x, y) => paint.map[y * w + x] === 4 || paint.map[y * w + x] === 12;
		// an arena cell inside diggableArea, free of creatures, with the most wall neighbours
		let best = null;
		for (let y = 12; y < 39; y++) for (let x = 3; x < 30; x++) {
			if (isWall(x, y) || scene['creatureAt'](x, y)) continue;
			let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (isWall(x + dx, y + dy)) n++;
			if (n > (best?.n ?? 2) && y > 14) best = { x, y, n };
		}
		if (!best) return { spawned: true, err: 'no wall-adjacent cell' };
		dm.x = best.x; dm.y = best.y; dm.dmSupercharged = true; dm.seesHero = true;
		// hero 6 cells away on the far side of whichever neighbour is wall: just a distant target
		scene.hero.x = Math.min(29, best.x + 6); scene.hero.y = Math.min(38, best.y + 6);
		const before = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) before.push(isWall(best.x + dx, best.y + dy));
		const posBefore = { x: dm.x, y: dm.y };
		const ok = scene['dm300Tunnel'](dm);
		const after = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) after.push(isWall(best.x + dx, best.y + dy));
		return { spawned: true, best, ok, wallsBefore: before.filter(Boolean).length, wallsAfter: after.filter(Boolean).length,
			posBefore, posAfter: { x: dm.x, y: dm.y }, levelPassable: scene['level'].passable(best.x, best.y) };
	`);
	console.log(JSON.stringify(r));
	await game.screenshot('tools/scratch/browser-test/dm300-tunnel.png');
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
