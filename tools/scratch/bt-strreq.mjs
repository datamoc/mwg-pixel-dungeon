export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	console.log(JSON.stringify(await game.eval(`
		const h = scene.hero; const out = { str: h.str, strReq: h.strReq, tier: scene.weaponTier };
		scene.weaponTier = 5; scene.syncHeroFromStats(); out.afterTier5 = h.strReq; out.acc = h.accuracy;
		return out;`)));
};
