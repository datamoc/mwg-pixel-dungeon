export default async (game) => {
	await game.startGame();
	const result = await game.eval(`(() => {
		const cells = [];
		for (let y = 1; y < scene.level.height - 1; y++) for (let x = 1; x < scene.level.width - 1; x++) {
			if (scene.level.passable(x, y) && !scene.creatureAt(x, y) && scene.fov.isVisible(x, y)
				&& Math.max(Math.abs(x - scene.hero.x), Math.abs(y - scene.hero.y)) >= 2) cells.push({ x, y });
		}
		const types = ['red', 'blue', 'purple'];
		const placed = types.map((type) => {
			const at = cells.shift();
			if (!at) throw new Error('not enough visible floor cells');
			const mob = scene.spawnMonster('shaman', at, true, undefined, false, undefined, false, undefined, undefined, type);
			const frame = scene.sprite(mob).texture.frame;
			return { type, x: at.x, y: at.y, frame: { x: frame.x, y: frame.y, width: frame.width, height: frame.height } };
		});
		return { placed, hero: { x: scene.hero.x, y: scene.hero.y } };
	})()`);
	console.log(`[${game.browser}] shaman variants ${JSON.stringify(result)}`);
	await game.screenshot('tools/scratch/browser-test/t177-shaman-colours.png');
	if (game.consoleErrors().length) throw new Error(`console errors: ${game.consoleErrors()[0]}`);
};
