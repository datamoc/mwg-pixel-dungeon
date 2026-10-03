export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	console.log(JSON.stringify(await game.eval(`
		const out = {}; const before = [...scene.talentPoints];
		scene.bag.add({ id: 'potionDivineInspiration', quantity: 1, stackable: true, identified: true, instanceId: 'di1' });
		scene.requestedItemId = 'potionDivineInspiration'; scene.requestedItemInstanceId = 'di1';
		out.quaff = scene.quaffPotion();
		out.window = !!(scene.gameWindows.windows?.length ?? scene.gameWindows.top);
		const { startDivineInspiration } = {}; 
		return { before, ...out };`)));
	await game.screenshot('tools/scratch/browser-test/divine.png');
	await game.tapText('^(rang|tier|palier) 1$', { timeout: 5000 }).catch((e) => console.log('tap failed', String(e).slice(0, 80)));
	console.log(JSON.stringify(await game.eval(`return { points: [...scene.talentPoints], potion: scene.bag.items.some((i) => i.id === 'potionDivineInspiration') };`)));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
