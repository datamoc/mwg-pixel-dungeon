// Live check of the trinket system: catalyst -> choice -> trinket, upgrade recipe, info text, effects.
export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	const r = await game.eval(`
		const out = {};
		let calls = [];
		scene.openItemPicker = (title, entries, onPick) => { calls.push({ title, entries, onPick }); };
		const bag = scene.bag;
		scene.alchemyEnergy = 100;
		// --- catalyst -> pick a trinket
		bag.add({ id: 'trinketCatalyst', quantity: 1, stackable: true, identified: true });
		calls = []; scene.trinitySpiritToolkit();
		out.recipesWithCatalyst = calls.at(-1).entries.map((e) => e.instanceId);
		calls.at(-1).onPick(calls.at(-1).entries.find((e) => e.instanceId === 'trinketCatalyst'));
		const offer = calls.at(-1);
		out.offerTitle = offer.title; out.offers = offer.entries.map((e) => e.id);
		out.energyAfterRoll = scene.alchemyEnergy;
		const pickedId = offer.entries[0].id;
		offer.onPick(offer.entries[0]);
		out.afterPick = bag.items.filter((i) => i.id.startsWith('trinket')).map((i) => i.id + ' L' + (i.level ?? '?') + ' x' + i.quantity);
		out.name = scene.itemDisplayName(pickedId, true, bag.items.find((i) => i.id === pickedId).instanceId);
		// --- upgrade it
		const before = scene.alchemyEnergy;
		calls = []; scene.trinitySpiritToolkit();
		out.recipesWithTrinket = calls.at(-1).entries.map((e) => e.instanceId);
		calls.at(-1).onPick(calls.at(-1).entries.find((e) => e.instanceId === 'upgradeTrinket'));
		const picker = calls.at(-1);
		picker.onPick(picker.entries[0]);
		const t = bag.items.find((i) => i.id === pickedId);
		out.level = t.level; out.upgradeCost = before - scene.alchemyEnergy;
		out.nameAfter = scene.itemDisplayName(pickedId, true, t.instanceId);
		// --- info text
		out.info = scene['itemDescriptionFor']?.(pickedId) ?? null;
		return out;
	`);
	console.log(JSON.stringify(r, null, 1));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
