// Live check: exotic scroll effects (Mystical Energy, Anti-Magic, Foresight, Dread, Psionic Blast).
export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	const r = await game.eval(`
		const out = {}; const h = scene.hero;
		const read = (id) => { scene.bag.add({ id, quantity: 1, stackable: true, identified: true }); scene.useItem?.(id); };
		const ctx = scene['scrollEffectsContext']();
		const mod = null;
		out.ctxKeys = Object.keys(ctx).filter((k) => /armArtifact|syncHero|searchSecrets/.test(k));
		ctx.armArtifactRecharge(30); out.recharge = scene.artifactRechargeTurns;
		h.buffs['magicImmune'] = 20; scene.syncHeroFromStats(); out.immune = h.magicImmune;
		delete h.buffs['magicImmune']; scene.refreshTrinketState?.(1);
		return out;
	`);
	console.log(JSON.stringify(r));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
