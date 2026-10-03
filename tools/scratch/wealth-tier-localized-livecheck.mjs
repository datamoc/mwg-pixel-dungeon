import assert from 'node:assert/strict';

export default async (game) => {
	try { await game.waitFor('!!mwg && !!mwg.app', { timeout: 90000 }); }
	catch (error) { console.log(game.consoleErrors(), game.consoleLogs()); throw error; }
	await game.eval("localStorage.setItem('spd-on-mwg.language', 'de'); setTimeout(() => location.reload(), 50); return true;");
	await new Promise(resolve => setTimeout(resolve, 600));
	await game.waitFor('!!mwg && !!mwg.app', { timeout: 90000 });
	await game.tapText('Betritt das Dungeon', { timeout: 90000 });
	await game.waitFor('scene && scene.constructor.name !== "TitleScene"');
	await new Promise(resolve => setTimeout(resolve, 800));
	await game.tap(0.098, 0.344);
	await game.tapText('^Beginnen$', { timeout: 90000 });
	await game.waitFor('scene && scene.hero && scene.creatures', { timeout: 90000 });
	const result = await game.eval(`(() => {
		scene.inventoryOpen = true;
		scene.refreshInventoryPanel();
		scene.inventoryPanel.showItem({ id: 'weaponReward', name: 'Keule', frame: 16, quantity: 1, identified: true, wealthDropTier: 3 });
		const key = scene.spawnGroundItem('wornKey', scene.hero.x, scene.hero.y, { id: 'wornKey', quantity: 1, identified: true });
		return { keySpawned: !!key };
	})()`);
	assert.equal(result.keySpawned, true, 'WornKey creates a ground item with registered frame');
	assert.ok(await game.findText('^Stufe III$'), 'German wealth-tier label is visibly rendered');
	await game.screenshot('tools/scratch/browser-test/wealth-tier-de.png');
	assert.deepEqual(game.consoleErrors(), []);
	console.log('PASS: German Stufe III rendered; WornKey ground registration works; no console errors.');
};
