import assert from 'node:assert/strict';

export default async function (game) {
	const settled = async () => {
		for (let i = 0; i < 100; i++) {
			if (!(await game.findText('^Descente$|^Descending$'))) return;
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		throw new Error('Interlevel curtain did not finish');
	};
	await game.startGame();
	await settled();
	const unknown = await game.eval(`(() => {
		const healing = scene.itemDisplayName('potionHealing', false);
		const shielding = scene.itemDisplayName('potionShielding', false);
		scene.bag.add({ id: 'potionShielding', quantity: 1, stackable: true, identified: false });
		scene.inventoryOpen = true; scene.refresh();
		return { healing, shielding };
	})()`);
	assert.equal(unknown.shielding, unknown.healing);
	await game.screenshot('tools/scratch/browser-test/shielding-unknown.png');
	await game.eval(`scene.bag.remove('potionShielding', 1); scene.inventoryOpen = false; scene.refresh();`);
	const normal = await game.eval(`(() => {
		scene.bag.add({ id: 'potionShielding', quantity: 3, stackable: true, identified: true });
		scene.requestedItemId = 'potionShielding';
		scene.heroBarrier.clear(); scene.barrierPartialLoss = 0.7;
		scene.hero.buffs.poison = 3; scene.healingLeft = 0;
		const used = scene.quaffPotion();
		const first = { shield: scene.heroBarrier.total, partial: scene.barrierPartialLoss, poison: scene.hero.buffs.poison, healing: scene.healingLeft };
		scene.barrierPartialLoss = 0.7; scene.quaffPotion();
		const equal = { shield: scene.heroBarrier.total, partial: scene.barrierPartialLoss };
		scene.heroBarrier.clear(); scene.heroBarrier.add(30); scene.barrierPartialLoss = 0.7; scene.quaffPotion();
		const higher = { shield: scene.heroBarrier.total, partial: scene.barrierPartialLoss };
		scene.refresh();
		return { used, first, equal, higher, remaining: scene.bag.find('potionShielding')?.quantity ?? 0 };
	})()`);
	assert.equal(normal.used, true);
	assert.deepEqual(normal.first, { shield: 22, partial: 0, poison: 3, healing: 0 });
	assert.deepEqual(normal.equal, { shield: 22, partial: 0 });
	assert.deepEqual(normal.higher, { shield: 30, partial: 0.7 });
	assert.equal(normal.remaining, 0);
	await new Promise(resolve => setTimeout(resolve, 200));
	await game.screenshot('tools/scratch/browser-test/shielding-normal.png');
	await game.eval(`(() => {
		localStorage.setItem('mwg-save:spd-meta:meta', JSON.stringify({ meta: { version: 1, savedAt: Date.now() }, state: { counts: [['amulet', 1]] } }));
		localStorage.setItem('spd-on-mwg.challenges.v1', JSON.stringify(['no_healing']));
		for (const key of Object.keys(localStorage)) if (key.endsWith(':run')) localStorage.removeItem(key);
		setTimeout(() => location.reload(), 50);
		return true;
	})()`);
	await new Promise(resolve => setTimeout(resolve, 600));
	await game.startGame();
	await settled();
	const challenge = await game.eval(`(() => {
		scene.bag.add({ id: 'potionShielding', quantity: 1, stackable: true, identified: true });
		scene.requestedItemId = 'potionShielding'; scene.progression.level = 5;
		scene.heroBarrier.clear(); scene.healingLeft = 0;
		const hp = scene.hero.hp; const used = scene.quaffPotion(); scene.refresh();
		return { used, shield: scene.heroBarrier.total, poison: scene.hero.buffs.poison, healing: scene.healingLeft, unchangedHp: hp === scene.hero.hp, remaining: scene.bag.find('potionShielding')?.quantity ?? 0 };
	})()`);
	assert.deepEqual(challenge, { used: true, shield: 0, poison: 6, healing: 0, unchangedHp: true, remaining: 0 });
	await new Promise(resolve => setTimeout(resolve, 200));
	await game.screenshot('tools/scratch/browser-test/shielding-challenge.png');
	assert.deepEqual(game.consoleErrors(), []);
	console.log('PASS Shielding live quaff: minimum/equal/higher Barrier, decay reset, no cure/heal, consumption, Pharmacophobia poison; no console errors.');
}
