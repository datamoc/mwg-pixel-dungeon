// Live check for ROADMAP R012: the alchemy slot window (three slots, live findRecipes preview, craft button).
export default async (game) => {
	await game.startGame();
	const count = `(id) => scene.bag.items.filter(i => i.id === id).reduce((a, i) => a + i.quantity, 0)`;
	await game.eval(`
		scene.alchemyEnergy = 40;
		scene.bag.add({ id: 'seedSungrass', quantity: 3, stackable: true, identified: true });
		scene.bag.add({ id: 'scrollMirror', quantity: 1, stackable: true, identified: true });
		scene.bag.add({ id: 'potionLevitation', quantity: 1, stackable: true, identified: true });
		scene.refreshInventoryPanel();
		window.__alch = { crafted: [] };
		scene.trinitySpiritToolkit();
		true;
	`);
	await game.screenshot('tools/scratch/browser-test/r012-empty.png');
	// Add the scroll through the slot button and its picker.
	await game.screenshot('tools/scratch/browser-test/r012-empty2.png'); await game.tapText('Add Item|Ajouter');
	await game.screenshot('tools/scratch/browser-test/r012-picker.png');
	const rows = await game.eval(`scene.itemPickerEntries.map(e => e.id)`);
	console.log('picker rows', JSON.stringify(rows));
	await game.eval(`scene.chooseItemPicker(scene.itemPickerEntries.findIndex(e => e.id === 'scrollMirror')); true`);
	await game.screenshot('tools/scratch/browser-test/r012-scroll-slotted.png');
	const names = await game.eval(`scene.gameWindows.top ? 'window' : 'none'`);
	console.log('top window', names);
	await game.tapText('^Fabriquer$|^Craft$');
	await game.screenshot('tools/scratch/browser-test/r012-crafted.png');
	const out = await game.eval(`({
		mirror: (${count})('scrollMirror'),
		stone: scene.bag.items.filter(i => /^stoneOf/.test(i.id)).map(i => i.id + 'x' + i.quantity),
		prismatic: (${count})('scrollPrismatic'),
		energy: scene.alchemyEnergy,
	})`);
	console.log(JSON.stringify(out));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
