export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	console.log(JSON.stringify(await game.eval(`
		const out = {}; const h = scene.hero; const logs = []; const say = scene.say.bind(scene); scene.say = (m, l) => { logs.push(m); say(m, l); };
		scene.bag.add({ id: 'trinketShardOfOblivion', quantity: 1, stackable: false, identified: true, level: 0, instanceId: 'shard1' });
		scene.bag.add({ id: 'weaponReward', quantity: 1, stackable: false, identified: false, level: 2, instanceId: 'wid2', tier: 2, sourceClass: 'Sword' });
		scene.equipWeapon('weaponReward', 'wid2');
		const spots = [];
		for (let dy=-2; dy<=2; dy++) for (let dx=-2; dx<=2; dx++) { const x=h.x+dx,y=h.y+dy; if ((dx||dy) && scene.level.inside(x,y) && scene.level.passable(x,y) && !scene.creatureAt(x,y)) spots.push({x,y}); }
		const rat = scene.spawnMonster('rat', spots[0]); rat.hp = rat.maxHp = 9999; rat.evasion = 0;
		for (let i = 0; i < 12; i++) scene.attack(h, rat);
		scene.grantExperience(4); scene.grantExperience(2);
		for (let i = 0; i < 12; i++) scene.attack(h, rat);
		out.identifiedAfterUse = scene.weaponIdentified; out.logs = logs.filter((m) => /Shard|Fragment|éclat|Éclat|pr(ê|e)t/i.test(m)).slice(0, 2);
		let picker = null; scene.openItemPicker = (title, entries, onPick) => { picker = { title, entries, onPick }; };
		scene.useShardOfOblivion();
		out.entries = picker.entries.map((e) => e.id + ':' + e.instanceId);
		picker.onPick(picker.entries[0]);
		out.identifiedAfterShard = scene.weaponIdentified;
		return out;`)));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
