export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	const r = await game.eval(`
		const out = {}; const h = scene.hero;
		const ctx = scene['scrollEffectsContext']();
		out.hpBefore = h.hp;
		ctx.startChallengeArena(); h.buffs['challengeArena'] = 100;
		out.arenaBuff = h.buffs['challengeArena'];
		const cells = scene.hero; 
		scene.spendHeroTurn(1);
		out.stillArena = h.buffs['challengeArena'];
		const logs = []; const say = scene.say.bind(scene); scene.say = (m, l) => { logs.push(m); say(m, l); };
		ctx.runDivination(); out.divLogs = logs.slice();
		out.potionsKnown = [...scene['potionKindsKnownFor']?.() ?? []];
		// step out of the arena
		h.x += 6; scene.spendHeroTurn(1);
		return out;
	`);
	console.log(JSON.stringify(r));
	const after = await game.eval(`return scene.hero.buffs['challengeArena'] ?? null;`);
	console.log('arena after leaving:', after);
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
