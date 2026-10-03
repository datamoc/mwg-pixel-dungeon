// R081: Beacon of Returning recipe (identified scrollPassage -> 5 beacons, 12 energy), unidentified gate.
export default async (game) => {
	await game.startGame();
	const r = await game.eval(`
		let calls = [];
		scene.openItemPicker = (title, entries, onPick) => { calls.push({ title, entries, onPick }); };
		const bag = scene.bag; const out = {};
		const cnt = (id) => bag.items.filter(i => i.id === id).reduce((a, i) => a + i.quantity, 0);
		const entries = () => { calls = []; scene.trinitySpiritToolkit(); return calls.at(-1)?.entries.map(x => x.instanceId) ?? 'noPicker'; };
		scene.alchemyEnergy = 50;
		bag.add({ id: 'scrollPassage', quantity: 1, stackable: true, identified: false });
		out.unidentified = entries();
		bag.items.find(i => i.id === 'scrollPassage').identified = true;
		out.identified = entries();
		const e = calls.at(-1).entries.find(x => x.instanceId === 'beaconOfReturning');
		const e0 = scene.alchemyEnergy;
		if (e) calls.at(-1).onPick(e);
		out.after = { passage: cnt('scrollPassage'), beacon: cnt('beaconOfReturning'), energy: e0 - scene.alchemyEnergy };
		return out;
	`);
	console.log(JSON.stringify(r));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
