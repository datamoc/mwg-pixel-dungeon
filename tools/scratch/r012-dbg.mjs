export default async (game) => {
	await game.startGame();
	const r = await game.eval(`
		scene.alchemyEnergy = 40;
		scene.bag.add({ id: 'scrollMirror', quantity: 1, stackable: true, identified: true });
		const ctx = scene.alchemyFlowContext();
		const keys = Object.keys(ctx);
		let err = null;
		try { scene.trinitySpiritToolkit(); } catch (e) { err = String(e.stack || e); }
		return { keys, err, top: !!scene.gameWindows.top };
	`);
	console.log(JSON.stringify(r));
	console.log(game.consoleErrors());
};
