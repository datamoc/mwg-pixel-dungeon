export default async (game) => {
	await game.startGame(); await new Promise(r => setTimeout(r, 4500));
	await game.screenshot('tools/scratch/browser-test/level-after-merge.png');
	console.log(await game.eval('JSON.stringify([scene.depth, scene.hero.hp, scene.creatures.length])'), JSON.stringify(game.consoleErrors()));
};
