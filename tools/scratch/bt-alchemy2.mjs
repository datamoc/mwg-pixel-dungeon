export default async (game) => {
	await game.startGame();
	const r = await game.eval(`
		let calls = [];
		scene.openItemPicker = (title, entries, onPick) => { calls.push({ title, entries, onPick }); };
		const bag = scene.bag; const out = {};
		scene.alchemyEnergy = 50;
		bag.add({ id: 'scrollIdentify', quantity: 3, stackable: true, identified: false });
		calls = []; scene.trinitySpiritToolkit();
		const top = calls.at(-1); out.entries = top.entries.map(e => e.instanceId);
		top.onPick(top.entries.find(e => e.instanceId === 'scrollToStone'));
		let next = calls.at(-1); out.next = next === top ? 'same' : { title: next.title, entries: next.entries.map(e => e.id + ':' + e.quantity) };
		if (next !== top) next.onPick(next.entries[0]);
		out.scrolls = bag.items.filter(i => /^scroll/.test(i.id)).map(i => i.id + ' x' + i.quantity + ' id=' + i.identified);
		out.stones = bag.items.filter(i => /^stone/.test(i.id)).map(i => i.id + ' x' + i.quantity);
		// meat pie
		bag.add({ id: 'pasty', quantity: 1, stackable: true, identified: true });
		bag.add({ id: 'food', quantity: 1, stackable: true, identified: true });
		bag.add({ id: 'meat', quantity: 1, stackable: true, identified: true });
		calls = []; scene.trinitySpiritToolkit();
		out.entries2 = calls.at(-1).entries.map(e => e.instanceId);
		return out;
	`);
	console.log(JSON.stringify(r, null, 1));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
