// Throwaway (tools/scratch): live-check `GameScene`'s arrival block for items that fell into a
// chasm (`Level.drop()` -> `Dungeon.dropToChasm()` -> landed on the depth below), T78.
//
// Java (GameScene.java, tag v3.3.8) special-cases three landings before falling back to
// `Dungeon.level.drop(item, pos)`: a potion shatters, a seed plants itself, a honeypot breaks
// open and releases its bee. The port queued the items but landed all four kinds as ordinary
// ground items; this drives the real scene methods to prove the three now behave.
//
// Run after `npm run build`:  node tools/browserTest.mjs --script tools/scratch/chasm-landing-livecheck.mjs

export default async (game) => {
	const results = [];
	const check = (name, ok, detail = '') => {
		results.push({ name, ok: !!ok });
		console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`);
	};

	await game.startGame();
	// let the level-entry banner clear so the screenshot below shows the dungeon
	await new Promise((r) => setTimeout(r, 3000));

	const out = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const groundOf = (kind) => s.groundItems.filter((g) => g.kind === kind).length;
		const goldAt = () => s.groundItems.filter((g) => g.kind === 'gold').map((g) => [g.x, g.y, g.item && g.item.quantity]);
		const before = {
			gas: s.toxicGas.total(),
			potions: groundOf('potion'),
			seeds: groundOf('seed'),
			pots: groundOf('honeypot'),
			gold: goldAt(),
			bees: s.creatures.filter((c) => c.kind === 'bee').length,
			plants: s.manualPlants.size,
			hp: s.hero.hp,
			heroPos: [s.hero.x, s.hero.y],
		};
		// queue one of each through Dungeon.dropToChasm (it files them under depth + 1), then
		// run the arrival block as if the hero had just arrived on that depth.
		s['dropToChasm']('potion', { id: 'potionToxicGas', quantity: 1, identified: true });
		s['dropToChasm']('seed', { id: 'seed', quantity: 1, sourceClass: 'Sungrass' });
		s['dropToChasm']('honeypot', { id: 'honeypot', quantity: 1, instanceId: 'pot-fell' });
		s['dropToChasm']('gold', { id: 'gold', quantity: 7 });
		const depth = s.depth;
		s.depth = depth + 1;
		s['landFallenItems']();
		s.depth = depth;
		const after = {
			gas: s.toxicGas.total(),
			potions: groundOf('potion'),
			seeds: groundOf('seed'),
			pots: groundOf('honeypot'),
			gold: goldAt(),
			bees: s.creatures.filter((c) => c.kind === 'bee').length,
			plants: s.manualPlants.size,
			planted: [...s.manualPlants.values()].filter((k) => k === 'sungrass').length,
			hp: s.hero.hp,
			heroPos: [s.hero.x, s.hero.y],
		};
		return { before, after };
	})()`);

	const b = out.before, a = out.after;
	console.log('landing results: ' + JSON.stringify(out));

	// pixels first: the bee, the plant and the gas the landing produced
	await game.eval(`(() => { const s = window.__MWG__.currentScene; s.refresh(); return true; })()`);
	await new Promise((r) => setTimeout(r, 400));
	await game.screenshot('tools/scratch/browser-test/chasm-landing-livecheck.png');

	check('a fallen toxic flask shatters instead of landing (Java Potion.shatter(cell))',
		a.gas > b.gas && a.potions === b.potions, JSON.stringify({ gas: [b.gas, a.gas], potions: [b.potions, a.potions] }));
	check('a fallen sungrass seed plants itself instead of landing (Java Dungeon.level.plant)',
		a.plants === b.plants + 1 && a.planted >= 1 && a.seeds === b.seeds,
		JSON.stringify({ plants: [b.plants, a.plants], sungrass: a.planted, seeds: [b.seeds, a.seeds] }));
	check('a fallen honeypot breaks open and releases its bee (Java Honeypot.shatter(null, pos))',
		a.bees === b.bees + 1 && a.pots === b.pots, JSON.stringify({ bees: [b.bees, a.bees], pots: [b.pots, a.pots] }));
	check('an ordinary item still lands exactly as it fell (Java Dungeon.level.drop)',
		a.gold.length === b.gold.length + 1 && a.gold.some(([, , q]) => q === 7),
		JSON.stringify({ gold: a.gold }));
	check('the hero is untouched by the landing block', a.hp === b.hp && a.heroPos[0] === b.heroPos[0] && a.heroPos[1] === b.heroPos[1]);

	const errors = game.consoleErrors();
	check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));

	const failed = results.filter((r) => !r.ok).length;
	console.log(`chasm-landing livecheck: ${results.length - failed}/${results.length} checks`);
	return failed === 0;
};
