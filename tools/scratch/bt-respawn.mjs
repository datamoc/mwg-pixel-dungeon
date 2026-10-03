export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	console.log(JSON.stringify(await game.eval(`
		scene.depth = 4; // depth 1 never respawns before the amulet
		for (const c of [...scene.creatures]) if (!c.isHero && !c.isNPC) { scene.kill(c); }
		const before = scene.creatures.filter((c) => !c.isHero && !c.isNPC).length;
		for (let i = 0; i < 60; i++) scene.spendHeroTurn(1);
		const after = scene.creatures.filter((c) => !c.isHero && !c.isNPC);
		return { before, after: after.length, kinds: after.map((c) => c.kind + '@' + c.x + ',' + c.y + ':' + (scene.fov.isVisible(c.x, c.y) ? 'vis' : 'hid')) };`)));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
