// R078: seed-to-potion outcome distribution (Java's randomUsingDefaults(POTION) weights, Healing reroll).
export default async (game) => {
	await game.startGame();
	const r = await game.eval(`
		let calls = [];
		scene.openItemPicker = (title, entries, onPick) => { calls.push({ title, entries, onPick }); };
		const bag = scene.bag; const tally = {}; let n = 0;
		const potions = () => Object.fromEntries(bag.items.filter(x => /^potion/.test(x.id)).map(x => [x.id, x.quantity]));
		for (let i = 0; i < 400; i++) {
			scene.alchemyEnergy = 50;
			for (const id of ['seedFirebloom','seedIcecap','seedEarthroot']) bag.add({ id, quantity: 1, stackable: true, identified: true });
			const before = potions();
			calls = []; scene.trinitySpiritToolkit();
			let cur = calls.at(-1); cur.onPick(cur.entries.find(x => x.instanceId === 'potionSeed'));
			for (let k = 0; k < 4 && calls.at(-1) !== cur; k++) { cur = calls.at(-1); cur.onPick(cur.entries[0]); }
			const after = potions();
			for (const id in after) if (after[id] > (before[id] ?? 0)) { tally[id] = (tally[id] ?? 0) + 1; n++; }
		}
		return { n, tally, cookingHpCount: scene.cookingHpCount };
	`);
	console.log(JSON.stringify(r));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
