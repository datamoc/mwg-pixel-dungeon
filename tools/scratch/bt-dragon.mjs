export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	console.log(JSON.stringify(await game.eval(`
		const out = {}; const h = scene.hero;
		let aim = null; const orig = scene.beginAiming.bind(scene); scene.beginAiming = (o) => { aim = o; };
		// a rat 3 cells away in a free direction
		let rat = null;
		for (const [dx,dy] of [[3,0],[-3,0],[0,3],[0,-3],[2,2],[-2,-2]]) { const x=h.x+dx,y=h.y+dy; if (scene.level.inside(x,y) && scene.level.passable(x,y) && !scene.creatureAt(x,y)) { rat = scene.spawnMonster('rat', {x,y}); break; } }
		scene.bag.add({ id: 'potionDragonsBreath', quantity: 1, stackable: true, identified: true, instanceId: 'dbr' });
		scene.requestedItemId = 'potionDragonsBreath'; scene.requestedItemInstanceId = 'dbr';
		out.quaff = scene.quaffPotion(); out.aiming = !!aim;
		aim.onConfirm({ x: rat.x, y: rat.y });
		out.burning = rat.buffs['burning'] ?? null; out.ratHp = rat.hp; out.ratBuffs = JSON.stringify(rat.buffs); out.cripple = rat.buffs['cripple'] ?? null;
		out.fire = scene.fire.volumeAt(rat.x, rat.y); out.left = scene.bag.items.some((i) => i.id === 'potionDragonsBreath');
		return out;`)));
	await game.screenshot('tools/scratch/browser-test/dragon.png');
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
