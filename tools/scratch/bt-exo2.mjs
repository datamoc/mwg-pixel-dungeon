export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	console.log(JSON.stringify(await game.eval(`
		const o = {}; const h = scene.hero;
		const t = () => ({ storm: scene.stormCloud.total(), corr: scene.corrosiveGas.total(), freeze: scene.plantFreeze.total(), str: scene.corrosiveGasStrength });
		o.before = t();
		scene.applyPotionEffect('potionStormClouds'); o.afterStorm = t();
		scene.applyPotionEffect('potionCorrosiveGas'); o.afterCorr = t();
		scene.applyPotionEffect('potionSnapFreeze'); o.afterSnap = t();
		o.roots = h.buffs.roots ?? null;
		return o;`)));
};
