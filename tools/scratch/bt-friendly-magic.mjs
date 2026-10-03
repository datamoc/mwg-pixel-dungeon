// R024: a fatal Sacrificial bleed books DEATH_FROM_FRIENDLY_MAGIC; chasm bleed still books death_falling.
export default async (game) => {
	await game.startGame();
	const r = await game.eval(`
		const out = {};
		const unlocked = (id) => scene.badges.unlocked(id);
		out.defs = scene.badges.unlocked ? true : false;
		scene.hero.buffs['bleeding'] = 50; scene.hero.bleedSource = 'sacrificial';
		scene.hero.hp = 1; scene.kill(scene.hero, 'poison');
		out.friendly = unlocked('death_friendly_magic'); out.poison = unlocked('death_poison');
		return out;
	`);
	console.log(JSON.stringify(r));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
