export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	const r = await game.eval(`
		const out = {};
		let picker = null; scene.openItemPicker = (title, entries, onPick) => { picker = { title, entries, onPick }; };
		scene.bag.add({ id: 'weaponReward', quantity: 1, stackable: false, identified: true, level: 0, instanceId: 'w1', tier: 2 });
		scene.bag.add({ id: 'scrollEnchantment', quantity: 1, stackable: true, identified: true, instanceId: 's1' });
		scene.requestedItemId = 'scrollEnchantment'; scene.requestedItemInstanceId = 's1';
		out.read = scene.readScroll();
		out.pickerEntries = picker?.entries.map((e) => e.id);
		picker.onPick(picker.entries[0]);
		const stack = scene.gameWindows;
		out.windowOpen = !!(stack.windows?.length ?? stack.top);
		return out;
	`);
	console.log(JSON.stringify(r));
	await game.screenshot('tools/scratch/browser-test/enchant-offers.png');
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
