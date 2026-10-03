export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	const r = await game.eval(`
		const out = {}; const h = scene.hero;
		// STR penalty
		out.strReqStart = h.strReq;
		scene.weaponTier = 5; scene.syncHeroFromStats(); out.strReqTier5 = h.strReq; out.str = h.str;
		scene.armorTier = 5; scene.syncHeroFromStats(); out.armorPenalty = h.armorStrPenalty; out.evasionHeavy = h.evasion;
		scene.weaponTier = 1; scene.armorTier = 1; scene.syncHeroFromStats(); out.evasionLight = h.evasion;
		// spawn rats in view
		const free = [];
		for (let dy=-3; dy<=3; dy++) for (let dx=-3; dx<=3; dx++) { const x=h.x+dx,y=h.y+dy; if ((dx||dy) && scene.level.inside(x,y) && scene.level.passable(x,y) && !scene.creatureAt(x,y) && scene.fov.isVisible(x,y)) free.push({x,y}); }
		const rats = free.slice(0,3).map((p) => scene.spawnMonster('rat', p));
		out.spawned = rats.length;
		return out;
	`).catch((e) => ({ err: String(e) }));
	console.log(JSON.stringify(r));
	const r2 = await game.eval(`
		const out = {}; const h = scene.hero;
		const rats = scene.creatures.filter((c) => c.kind === 'rat');
		scene.bag.add({ id: 'scrollDread', quantity: 1, stackable: true, identified: true, instanceId: 'd1' });
		scene.requestedItemId = 'scrollDread'; scene.requestedItemInstanceId = 'd1';
		scene.readScroll();
		out.dread = rats.map((c) => c.buffs['dread'] ?? null); out.terror = rats.map((c) => c.buffs['terror'] ?? null);
		// damage recovers
		scene.applyCharacterDamage(rats[6], 1, { pierceArmor: true, cause: 'foe', skipAura: true });
		out.afterHit = rats[6].buffs['dread'] ?? null;
		scene.bag.add({ id: 'scrollPsionicBlast', quantity: 1, stackable: true, identified: true, instanceId: 'p1' });
		scene.requestedItemId = 'scrollPsionicBlast'; scene.requestedItemInstanceId = 'p1';
		out.hpBefore = h.hp; out.maxHp = h.maxHp;
		scene.readScroll();
		out.hpAfter = h.hp; out.ratsHp = rats.map((c) => c.hp);
		out.blind = h.buffs['blindness'] ?? null; out.weak = h.buffs['weakness'] ?? null;
		return out;
	`);
	console.log(JSON.stringify(r2));
	await game.screenshot('tools/scratch/browser-test/dread-psi.png');
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
