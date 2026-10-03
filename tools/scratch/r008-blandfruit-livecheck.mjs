// Live visual check for ROADMAP R008: cooked Blandfruit through the alchemy slot window, then its inventory glow.
export default async (game) => {
	//A screenshot right after an eval can be a stale frame and a tap before the next frame is ignored: settle with two.
	const settle = async (name) => { await game.screenshot('tools/scratch/browser-test/' + name + '-a.png'); await game.screenshot('tools/scratch/browser-test/' + name + '.png'); };
	await game.startGame();
	await game.eval(`
		scene.alchemyEnergy = 20;
		scene.bag.add({ id: 'blandfruit', quantity: 1, stackable: true, identified: true });
		scene.bag.add({ id: 'seedFirebloom', quantity: 1, stackable: true, identified: true });
		scene.refreshInventoryPanel();
		scene.trinitySpiritToolkit();
		return true;
	`);
	await settle('r008-open');
	await game.tapText('Add Item|Ajouter');
	await game.eval(`scene.chooseItemPicker(scene.itemPickerEntries.findIndex(e => e.id === 'blandfruit')); return true;`);
	await settle('r008-one');
	await game.tapText('Add Item|Ajouter');
	await game.eval(`scene.chooseItemPicker(scene.itemPickerEntries.findIndex(e => e.id === 'seedFirebloom')); return true;`);
	await settle('r008-slots');
	await game.tapText('^Fabriquer$|^Craft$');
	await settle('r008-cooked');
	const out = await game.eval(`return { fruit: scene.bag.items.filter(i => i.id === 'blandfruit').map(i => ({ q: i.quantity, attrib: i.potionAttrib })), energy: scene.alchemyEnergy };`);
	console.log(JSON.stringify(out));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
