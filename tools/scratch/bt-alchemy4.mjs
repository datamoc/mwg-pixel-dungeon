// R079 MeatPie picker flow, R081 spell recipes (scrollPassage/Beacon), R080 energy.
export default async (game) => {
	await game.startGame();
	const r = await game.eval(`
		let calls = [];
		scene.openItemPicker = (title, entries, onPick) => { calls.push({ title, entries, onPick }); };
		const bag = scene.bag; const out = {};
		const cnt = (id) => bag.items.filter(i => i.id === id).reduce((a, i) => a + i.quantity, 0);
		const run = (recipe) => {
			calls = []; scene.trinitySpiritToolkit();
			let cur = calls.at(-1); if (!cur) return 'noPicker';
			const e = cur.entries.find(x => x.instanceId === recipe); if (!e) return 'absent:' + cur.entries.map(x => x.instanceId);
			cur.onPick(e); const steps = [];
			for (let k = 0; k < 6 && calls.at(-1) !== cur; k++) { cur = calls.at(-1); steps.push(cur.entries.map(x => x.id)); cur.onPick(cur.entries[0]); }
			return steps;
		};
		scene.alchemyEnergy = 50;
		bag.add({ id: 'pasty', quantity: 1, stackable: true, identified: true });
		bag.add({ id: 'meat', quantity: 1, stackable: true, identified: true });
		const f0 = cnt('food'); const e0 = scene.alchemyEnergy;
		out.pie = run('meatPie'); out.pieAfter = { pasty: cnt('pasty'), meat: cnt('meat'), food: f0 + '->' + cnt('food'), pies: cnt('meatPie'), energy: e0 - scene.alchemyEnergy };
		out.recipes = (() => { calls = []; scene.trinitySpiritToolkit(); return calls.at(-1)?.entries.map(x => x.instanceId); })();
		return out;
	`);
	console.log(JSON.stringify(r, null, 1));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
