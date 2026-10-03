// Live check for ROADMAP R077/R083/R084 (alchemy identified gate, FeatherFall, ScrollToStone).
export default async (game) => {
	await game.startGame();
	const r = await game.eval(`
		let calls = [];
		scene.openItemPicker = (title, entries, onPick) => { calls.push({ title, entries, onPick }); };
		const bag = scene.bag;
		const count = (id) => bag.items.filter(i => i.id === id).reduce((a, i) => a + i.quantity, 0);
		const out = {};
		scene.alchemyEnergy = 50;
		bag.add({ id: 'potionLevitation', quantity: 1, stackable: true, identified: false });
		calls = []; scene.trinitySpiritToolkit();
		out.unidentifiedEntries = calls.at(-1)?.entries.map(e => e.instanceId) ?? 'noPicker';
		bag.items.find(i => i.id === 'potionLevitation').identified = true;
		calls = []; scene.trinitySpiritToolkit();
		out.identifiedEntries = calls.at(-1)?.entries.map(e => e.instanceId) ?? 'noPicker';
		const pick = calls.at(-1)?.entries.find(e => e.instanceId.toLowerCase().includes('feather'));
		const before = scene.alchemyEnergy;
		if (pick) calls.at(-1).onPick(pick);
		out.featherPick = pick?.instanceId;
		out.lev = count('potionLevitation'); out.elixir = bag.items.filter(i => /feather/i.test(i.id)).map(i => i.id + 'x' + i.quantity);
		out.energySpent = before - scene.alchemyEnergy;
		return out;
	`);
	console.log(JSON.stringify(r, null, 1));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
