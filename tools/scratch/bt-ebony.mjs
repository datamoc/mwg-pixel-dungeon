export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	console.log(JSON.stringify(await game.eval(`
		scene.bag.add({ id: 'trinketMimicTooth', quantity: 1, stackable: false, identified: true, level: 3, instanceId: 'tooth1' });
		scene.refreshInventoryPanel();
		let found = null;
		for (let i = 0; i < 12 && !found; i++) {
			scene.depth = 3 + i; scene.enterLevel();
			await new Promise((r) => setTimeout(r, 400));
			found = scene.creatures.find((c) => c.ebonyMimic) ?? null;
		}
		if (!found) return { found: false };
		return { found: true, name: found.name, hidden: found.mimicRevealed === false, x: found.x, y: found.y, prizes: JSON.parse(found.ebonyPrizes).map((p) => p.id + ':L' + (p.level ?? 0)), stealthy: true };`)));
	await game.screenshot('tools/scratch/browser-test/ebony.png');
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
