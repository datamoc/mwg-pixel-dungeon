// Live check for ROADMAP R080: Alchemize scraps carried items for the corrected Java energyVal() table.
export default async (game) => {
	await game.startGame();
	const r = await game.eval(`
		const cases = [['stoneOfBlink',3],['stoneOfAugmentation',5],['stoneOfEnchantment',5],['seedRotberry',3],['seedStarflower',3],['seedSungrass',2],['gooBlob',3],['potionHealing',null],['food',0],['scrollRage',null]];
		const out = [];
		for (const [id, expected] of cases) {
			scene.bag.add({ id, quantity: 1, stackable: true, identified: true });
			scene.bag.add({ id: 'alchemize', quantity: 1, stackable: true, identified: true });
			scene.alchemyEnergy = 0;
			let picked = 'no-picker';
			const orig = scene.openItemPicker;
			scene.openItemPicker = (title, entries, onPick) => { const e = entries.find(x => x.id === id); picked = e ? 'offered' : 'refused'; if (e) onPick(e); };
			scene.useAlchemize();
			scene.openItemPicker = orig;
			out.push({ id, expected, picked, energy: scene.alchemyEnergy });
		}
		return out;
	`);
	for (const x of r) console.log(JSON.stringify(x));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
