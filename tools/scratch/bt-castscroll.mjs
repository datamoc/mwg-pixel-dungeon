export default async (game) => {
	await game.startGame(); await new Promise(r => setTimeout(r, 4000));
	console.log(await game.eval(`(() => {
		const s = scene; const out = {};
		const idn = () => s.bag.items.filter(i => !i.identified && i.quantity > 0).length;
		s.bag.add({ id: 'potion', quantity: 1, stackable: true, identified: false }); out.unidBefore = idn(); s.artifactActionContext().castScrollEffect('scrollIdentify'); out.unidAfterIdentify = idn();
		s.hero.buffs.weakness = { turns: 10 }; out.weaknessBefore = !!s.hero.buffs.weakness; s.artifactActionContext().castScrollEffect('scrollCleanse'); out.weaknessAfterCleanse = !!s.hero.buffs.weakness;
		return JSON.stringify(out);
	})()`), JSON.stringify(game.consoleErrors()));
};
