export default async (game) => {
	await game.startGame();
	const r = await game.eval(`
		scene.alchemyEnergy = 20;
		scene.bag.add({ id: 'blandfruit', quantity: 1, stackable: true, identified: true });
		scene.bag.add({ id: 'seedFirebloom', quantity: 1, stackable: true, identified: true });
		scene.trinitySpiritToolkit();
		return { depth: scene.depth, top: !!scene.gameWindows.top };
	`);
	console.log(JSON.stringify(r));
	await game.tapText('Add Item|Ajouter');
	console.log(JSON.stringify(await game.eval(`return { depth: scene.depth, rows: scene.itemPickerEntries.map(e=>e.id), open: scene.itemPickerOpen, lines: JSON.stringify(scene.gameLog).slice(-400), keys: Object.keys(scene).filter(k=>/log|msg|message/i.test(k)) };`)));
	console.log(game.consoleErrors());
};
