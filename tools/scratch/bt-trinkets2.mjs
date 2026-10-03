// Live check: trinket sprites in the inventory, Ferret Tuft evasion, Clover chance, catalyst on the floor path.
export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	const r = await game.eval(`
		const out = {};
		const bag = scene.bag, h = scene.hero;
		out.evasionBefore = h.evasion; out.cloverBefore = h.cloverChance ?? null;
		const ids = ['trinketRatSkull','trinketParchmentScrap','trinketPetrifiedSeed','trinketExoticCrystals','trinketMossyClump','trinketDimensionalSundial','trinketThirteenLeafClover','trinketTrapMechanism','trinketMimicTooth','trinketWondrousResin','trinketEyeOfNewt','trinketSaltCube','trinketVialOfBlood'];
		ids.forEach((id, i) => bag.add({ id, quantity: 1, stackable: false, identified: true, level: i % 4, instanceId: 't' + i }));
		bag.add({ id: 'trinketFerretTuft', quantity: 1, stackable: false, identified: true, level: 2, instanceId: 'tuft' });
		bag.add({ id: 'trinketThirteenLeafClover', quantity: 1, stackable: false, identified: true, level: 1, instanceId: 'clv' });
		scene.refreshInventoryPanel();
		scene.spendHeroTurn(1);
		out.evasionAfter = h.evasion; out.cloverAfter = h.cloverChance;
		out.fovRadius = scene.viewRadius();
		return out;
	`);
	console.log(JSON.stringify(r));
	await game.screenshot('tools/scratch/browser-test/trinkets-bag.png');
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
