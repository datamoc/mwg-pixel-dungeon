export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	console.log(JSON.stringify(await game.eval(`
		const out = {};
		let picker = null; scene.openItemPicker = (title, entries, onPick) => { picker = { title, entries, onPick }; };
		scene.bag.add({ id: 'weaponReward', quantity: 1, stackable: false, identified: true, level: 0, instanceId: 'w9', tier: 4, sourceClass: 'Mace' });
		scene.bag.add({ id: 'potionMastery', quantity: 1, stackable: true, identified: true, instanceId: 'm1' });
		scene.requestedItemId = 'potionMastery'; scene.requestedItemInstanceId = 'm1';
		out.quaff = scene.quaffPotion();
		out.entries = picker.entries.map((e) => e.id + ':' + e.instanceId);
		scene.equipWeapon('weaponReward', 'w9'); scene.syncHeroFromStats();
		out.reqBefore = scene.hero.strReq;
		picker.onPick(picker.entries.find((e) => e.instanceId === 'w9') ?? picker.entries[0]);
		scene.syncHeroFromStats();
		out.reqAfter = scene.hero.strReq; out.potionLeft = scene.bag.items.some((i) => i.id === 'potionMastery');
		return out;`)));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
