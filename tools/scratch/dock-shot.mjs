export default async (game) => {
	await game.startGame();
	await new Promise(r => setTimeout(r, 4000));
	await game.screenshot('tools/scratch/port-1280.png');
	console.log(JSON.stringify(await game.eval('({w:innerWidth,h:innerHeight,dock:scene.inventoryDock.visible,size:scene.interfaceSize})')));
	console.log(game.consoleErrors());
};
