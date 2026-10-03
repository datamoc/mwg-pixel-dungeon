export default async (game) => {
	await game.startGame(); await game.eval('await new Promise((r) => setTimeout(r, 4000)); return 1;');
	const info = await game.eval(`
		const m = scene.creatures.find((c) => !c.isHero && !c.isNPC && !c.isAlly && c.hp > 0);
		const h = scene.hero;
		const spot = [[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy]) => ({ x: h.x+dx, y: h.y+dy })).find((p) => scene.level.passable(p.x, p.y) && !scene.creatureAt(p.x, p.y));
		scene.moveTo(m, spot);
		m.maxHp = 10; m.hp = 10; m.sleeping = false; scene.fov.isVisible = () => true; h.accuracy = 1000;
		window.__m = m; return { kind: m.kind, spot };
	`);
	console.log(JSON.stringify(info));
	await game.eval(`scene.attack(scene.hero, window.__m); await new Promise((r) => setTimeout(r, 120)); return window.__m.hp;`);
	await game.screenshot('tools/scratch/browser-test/blood.png');
};
