// Example --script: node tools/browserTest.mjs --script tools/scratch/bt-example.mjs --browser both
export default async (game) => {
	await game.startGame();
	const before = await game.eval('scene.hero.hp');
	const kinds = await game.eval('[...new Set(scene.creatures.map(c => c.kind))]');
	console.log(`[${game.browser}] hero hp ${before}, creature kinds ${JSON.stringify(kinds)}`);
	if (game.consoleErrors().length) throw new Error(`console errors: ${game.consoleErrors()[0]}`);
};
