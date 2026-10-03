// node tools/browserTest.mjs --script tools/scratch/hazard-marking-livecheck.mjs
// Live check of R005/R007 (2026-09-29): trap-scoped HazardAssistTracker marks + teleportation heap relocation.
export default async (game) => {
	await game.startGame();
	const res = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const out = {};
		const hx = s.hero.x, hy = s.hero.y;
		const free = [];
		for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
			const x = hx + dx, y = hy + dy;
			if ((dx || dy) && s.level.passable(x, y) && !s.creatureAt(x, y)) free.push({ x, y, d: Math.max(Math.abs(dx), Math.abs(dy)) });
		}
		const near = free.find((c) => c.d === 1);
		const far = free.find((c) => c.d === 2);
		const mark = (m) => m.buffs && m.buffs.hazardAssist !== undefined;
		// Frost: a mob 2 cells from the trap is marked (old 3x3 mark missed it)
		const rat = s.spawnMonster('rat', far, false);
		s.activateUtilityTrap('frost', hx, hy);
		out.frostFarMarked = mark(rat);
		delete rat.buffs.hazardAssist;
		// Gripping under a mob stepper
		const rat2 = s.spawnMonster('rat', near, false);
		s.activateUtilityTrap('gripping', near.x, near.y);
		out.grippingMarked = mark(rat2);
		// Alarm marks nobody
		delete rat2.buffs.hazardAssist;
		s.activateUtilityTrap('alarm', near.x, near.y);
		out.alarmMarked = mark(rat2);
		// Teleportation: hunting mob marked, sleeping/wandering not; heap relocated
		rat2.seesHero = true;
		s.spawnGroundItem('meat', near.x, near.y === hy ? near.y + 0 : near.y);
		const before = s.groundItems.length;
		const heapAt = s.groundItemAt(near.x, near.y);
		s.activateUtilityTrap('teleportation', near.x, near.y);
		out.teleportMarked = mark(rat2);
		out.heapMoved = heapAt ? !s.groundItemAt(near.x, near.y) || s.groundItemAt(near.x, near.y) !== heapAt : 'no heap';
		out.groundItemsBefore = before; out.groundItemsAfter = s.groundItems.length;
		return out;
	})()`);
	console.log(JSON.stringify(res));
	if (!res.frostFarMarked || !res.grippingMarked || res.alarmMarked || !res.teleportMarked) throw new Error('marking mismatch ' + JSON.stringify(res));
	await game.screenshot('hazard-marking');
	if (game.consoleErrors().length) throw new Error(`console errors: ${game.consoleErrors()[0]}`);
};
