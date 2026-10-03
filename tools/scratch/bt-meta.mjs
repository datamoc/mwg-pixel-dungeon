export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	await game.eval(`
		scene.talentRanks['hearty_meal'] = 1;
		scene.bag.add({ id: 'scrollMetamorphosis', quantity: 1, stackable: true, identified: true, instanceId: 'mm1' });
		scene.requestedItemId = 'scrollMetamorphosis'; scene.requestedItemInstanceId = 'mm1';
		return scene.readScroll();`);
	await game.tapText('^rang 1$', { timeout: 5000 });
	await game.tapText('repas copieux [(]1/2[)]', { timeout: 5000 });
	await game.screenshot('tools/scratch/browser-test/meta-options.png');
	await game.tapText('[(]1[)]', { timeout: 5000 });
	console.log(JSON.stringify(await game.eval(`return { ranks: scene.talentRanks, scroll: scene.bag.items.some((i) => i.id === 'scrollMetamorphosis'), meta: JSON.stringify(window.__MWG__.currentScene.talentTier) };`)));
	await game.screenshot('tools/scratch/browser-test/meta-done.png');
};
