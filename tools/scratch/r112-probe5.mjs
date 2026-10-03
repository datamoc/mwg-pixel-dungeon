// probe5: ground truth for potionShielding's names pre/post quaff.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async function (game) {
	await game.startGame();
	for (let i = 0; i < 100; i++) { if (!(await game.findText('^Descente$|^Descending$'))) break; await sleep(100); }
	const pre = await game.eval(`(() => {
		scene.bag.add({ id: 'potionShielding', quantity: 1, stackable: true, identified: false });
		return {
			real: scene.itemDisplayName('potionShielding', true),
			fake: scene.itemDisplayName('potionShielding', false),
			healingReal: scene.itemDisplayName('potionHealing', true),
			healingFake: scene.itemDisplayName('potionHealing', false),
			appearanceKey: scene.appearances.appearanceOf('potion', 'potionHealing'),
		};
	})()`);
	console.log('PRE :', JSON.stringify(pre, null, 1));
	const post = await game.eval(`(() => {
		scene.requestedItemId = 'potionHealing';
		scene.quaffPotion();
		const w = scene.inventoryPanel;
		scene.inventoryOpen = true; scene.refresh();
		const entry = (w['carried'] || []).find((e) => e && e.id === 'potionShielding');
		return {
			real: scene.itemDisplayName('potionShielding', true),
			fake: scene.itemDisplayName('potionShielding', false),
			entryName: entry ? entry.name : null,
			entryKeys: entry ? Object.keys(entry) : null,
		};
	})()`);
	console.log('POST:', JSON.stringify(post, null, 1));
}
