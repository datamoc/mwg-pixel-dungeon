// node tools/browserTest.mjs --script tools/scratch/challenges-livecheck.mjs
// Live check for R086/R093: with VICTORY unlocked and two challenges selected in storage, the run
// snapshots them, the HUD shows the count, and the read-only window lists them.
export default async (game) => {
	//first boot: unlock VICTORY (persisted in the meta save), keep the selection in storage
	await game.startGame();
	await game.eval(`scene.awardBadge('amulet')`);
	await game.eval(`localStorage.setItem('spd-on-mwg.challenges.v1', JSON.stringify(['no_herbalism', 'swarm_intelligence']))`);
	await game.eval(`location.reload()`).catch(() => {});
	await new Promise((r) => setTimeout(r, 2500));
	await game.startGame();
	const info = await game.eval(`({
		hudVisible: !!scene.dungeonHud && scene.dungeonHud.chal?.visible,
		hudText: scene.dungeonHud?.chalText?.text,
		depth: scene.depth,
	})`);
	console.log(`[${game.browser}] ${JSON.stringify(info)}`);
	await new Promise((r) => setTimeout(r, 3000));
	await game.screenshot('tools/scratch/challenges-hud.png');
	if (game.consoleErrors().length) throw new Error(`console errors: ${game.consoleErrors()[0]}`);
};
