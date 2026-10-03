export default async (game) => {
	await game.startGame(); await new Promise(r => setTimeout(r, 4000));
	// natural path: put a sleeping/wandering mob in view and spend turns until one notices
	const r = await game.eval(`(() => {
		const s = scene; const h = s.hero;
		const m = s.creatures.find(c => !c.isHero && c.hp > 0 && !c.allyKind && c.kind !== 'npc');
		m.x = h.x + 3; m.y = h.y; m.sleeping = false; m.seesHero = false; m.lastSeen = undefined;
		s.sprite(m).position.set(m.x*16, m.y*16);
		window.__m = m;
		return { kind: m.kind, at: [m.x, m.y], hero: [h.x, h.y] };
	})()`);
	console.log(JSON.stringify(r), await game.eval('JSON.stringify([!!scene.interlevel, scene.awaitingInput, scene.gameOver])'));
	const seen = [];
	for (let i = 0; i < 12; i++) {
		await game.eval(`scene.wait ? scene.wait() : scene.spendHeroTurn?.(1)`).catch(() => {});
		await new Promise(r => setTimeout(r, 400));
		seen.push(await game.eval('JSON.stringify([window.__m.emote ?? null, window.__m.seesHero, window.__m.x, window.__m.y, scene.hero.x])'));
		if (seen[seen.length-1].includes('alert')) break;
	}
	console.log('emote per turn', JSON.stringify(seen));
	await game.screenshot('tools/scratch/browser-test/emote-alert.png');
	console.log('errors', JSON.stringify(game.consoleErrors()));
};
