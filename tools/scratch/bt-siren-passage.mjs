export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	console.log(JSON.stringify(await game.eval(`
		const out = {}; const h = scene.hero;
		let aim = null; scene.beginAiming = (o) => { aim = o; };
		const spots = [];
		for (let dy=-3; dy<=3; dy++) for (let dx=-3; dx<=3; dx++) { const x=h.x+dx,y=h.y+dy; if ((dx||dy) && scene.level.inside(x,y) && scene.level.passable(x,y) && !scene.creatureAt(x,y) && scene.fov.isVisible(x,y)) spots.push({x,y}); }
		const a = scene.spawnMonster('rat', spots[0]), b = scene.spawnMonster('rat', spots[1]);
		scene.bag.add({ id: 'scrollSirensSong', quantity: 1, stackable: true, identified: true, instanceId: 'ss1' });
		scene.requestedItemId = 'scrollSirensSong'; scene.requestedItemInstanceId = 'ss1';
		out.read = scene.readScroll(); out.aiming = !!aim;
		aim.onConfirm({ x: a.x, y: a.y });
		out.targetAlly = a.isAlly === true; out.otherCharm = b.buffs['charm'] ?? null; out.exp = scene.progression.exp ?? null;
		out.scroll = scene.bag.items.some((i) => i.id === 'scrollSirensSong');
		return out;`)));
	console.log(JSON.stringify(await game.eval(`
		scene.depth = 3;
		scene.bag.add({ id: 'scrollPassage', quantity: 1, stackable: true, identified: true, instanceId: 'pp1' });
		scene.requestedItemId = 'scrollPassage'; scene.requestedItemInstanceId = 'pp1';
		scene.readScroll();
		await new Promise((r) => setTimeout(r, 2500));
		return { depth: scene.depth, scroll: scene.bag.items.some((i) => i.id === 'scrollPassage') };`)));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
