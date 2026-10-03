// node tools/browserTest.mjs --script tools/scratch/merge-heroselect-check.mjs
export default async (game) => {
	await game.startGame();
	await game.eval(`scene.awardBadge('amulet')`);
	await game.eval(`localStorage.setItem('spd-on-mwg.challenges.v1', JSON.stringify(['no_herbalism', 'darkness']))`);
	await game.eval(`location.reload()`).catch(() => {});
	await new Promise((r) => setTimeout(r, 2500));
	await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon');
	await new Promise((r) => setTimeout(r, 1500));
	await game.screenshot('tools/scratch/merge-heroselect.png'); await game.tap(1472 / 1568, 30 / 779); await new Promise((r) => setTimeout(r, 800)); await game.screenshot('tools/scratch/merge-heroselect-window.png');
	if (game.consoleErrors().length) throw new Error(`console errors: ${game.consoleErrors()[0]}`);
};
