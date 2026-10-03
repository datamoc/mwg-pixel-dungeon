// R026: a landed hit splashes blood (CharSprite.bloodBurstA) - burst count, colour, hero exempt.
export default async (game) => {
	await game.startGame();
	const r = await game.eval(`
		const out = {};
		const m = scene.creatures.find((c) => !c.isHero && !c.isNPC && !c.isAlly && c.hp > 0);
		scene.hero.x = m.x - 1; scene.hero.y = m.y; // adjacent, visible
		if (!scene.level.passable(scene.hero.x, scene.hero.y)) { scene.hero.x = m.x + 1; }
		const layer = scene.effectLayer;
		const before = layer.children.length, bursts = scene.effectBursts.length;
		m.maxHp = 10; m.hp = 10;
		scene.fov.isVisible = () => true;
		scene.hero.accuracy = 1000;
		let guard = 0; while (scene.effectBursts.length === bursts && guard++ < 30) scene.attack(scene.hero, m);
		out.kind = m.kind; out.hp = m.hp; out.newBursts = scene.effectBursts.length - bursts; out.layerChildren = layer.children.length - before;
		const b = scene.effectBursts.at(-1)?.emitter;
		out.tint = b?.options?.tint ?? b?.tint ?? null;
		// the hero being hit must not bleed
		const hb = scene.effectBursts.length;
		scene.attack(m, scene.hero); scene.attack(m, scene.hero);
		out.heroBursts = scene.effectBursts.length - hb;
		return out;
	`);
	console.log(JSON.stringify(r));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
