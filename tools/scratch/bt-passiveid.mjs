export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	console.log(JSON.stringify(await game.eval(`
		const out = {}; const h = scene.hero;
		scene.bag.add({ id: 'weaponReward', quantity: 1, stackable: false, identified: false, level: 2, instanceId: 'wid1', tier: 2, sourceClass: 'Sword' });
		scene.equipWeapon('weaponReward', 'wid1');
		const spots = [];
		for (let dy=-2; dy<=2; dy++) for (let dx=-2; dx<=2; dx++) { const x=h.x+dx,y=h.y+dy; if ((dx||dy) && scene.level.inside(x,y) && scene.level.passable(x,y) && !scene.creatureAt(x,y)) spots.push({x,y}); }
		const rat = scene.spawnMonster('rat', spots[0]); rat.hp = rat.maxHp = 9999; rat.evasion = 0;
		let hits = 0;
		for (let i = 0; i < 12; i++) { const before = rat.hp; scene.attack(h, rat); if (rat.hp < before) hits++; }
		out.hits = hits; out.stillUnidentified = !scene.weaponIdentified;
		return out;`)));
	console.log(JSON.stringify(await game.eval(`
		const h = scene.hero; const rat = scene.creatures.find((c) => c.kind === 'rat' && c.maxHp === 9999);
		scene.grantExperience(4); scene.grantExperience(2);
		let hits = 0; for (let i = 0; i < 30 && !scene.weaponIdentified; i++) { scene.attack(h, rat); hits++; }
		return { extraHits: hits, identified: scene.weaponIdentified };`)));
};
