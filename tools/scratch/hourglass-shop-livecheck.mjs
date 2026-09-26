// Throwaway (tools/scratch): the "hourglass-in-hand shop visit" that
// `coverage/notes-03-simulation-extraction.md` still owes in its shop-stock and bag paragraphs -
// the shelf only stocks `TimekeepersHourglass` sandbags for a carried, identified, uncursed
// hourglass, `shopSandBags(depth, missing)` of them, and it *increments* `hourglass.sandBags` as
// it stocks each one so the next shop offers the remainder rather than a fresh five.
//
// Run after `npm run build`:  node tools/browserTest.mjs --script tools/scratch/hourglass-shop-livecheck.mjs

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
		const bags = (stock) => stock.items.filter((i) => i.id === 'sandBag').reduce((a, i) => a + (i.quantity ?? 1), 0);
		const hourglass0 = s.bag.find('hourglass');
		if (hourglass0) s.bag.remove('hourglass', 1, hourglass0.instanceId);
		const before = {
			hasHourglass: s.bag.find('hourglass') !== undefined,
			depth6: bags(s['shopStockFor'](6)),
		};
		s.bag.add({ id: 'hourglass', quantity: 1, identified: true, instanceId: 'hg-live', level: 0 });
		const hg = s.bag.find('hourglass', 'hg-live');
		const depth11 = bags(s['shopStockFor'](11));
		const after11 = { bags: depth11, sandBags: hg.sandBags ?? hg.level ?? 0 };
		const depth16 = bags(s['shopStockFor'](16));
		const after16 = { bags: depth16, sandBags: hg.sandBags ?? 0 };
		// Java's gate: hourglass != null && hourglass.isIdentified() && !hourglass.cursed
		hg.cursed = true;
		const depth20 = bags(s['shopStockFor'](20));
		delete hg.cursed;
		hg.identified = false;
		const depth21 = bags(s['shopStockFor'](21));
		hg.identified = true;
		return { before, after11, after16, cursed: depth20, unidentified: depth21,
			gate: { identified: hg.identified, cursed: hg.cursed === true },
			cap: s['mwlItemEffectValue'] ? s['mwlItemEffectValue']('hourglass', 'sandBagCap') : null };
	})()`);

	console.log('hourglass shop: ' + JSON.stringify(out));

	check('a shelf built with no hourglass stocks no sandbag', out.before.hasHourglass === false && out.before.depth6 === 0,
		JSON.stringify(out.before));
	check('carrying a fresh hourglass stocks shopSandBags(11, 5) = 2 on the depth-11 shelf',
		out.after11.bags === 2, JSON.stringify({ bags: out.after11.bags, sandBags: out.after11.sandBags }));
	check('each stocked bag increments hourglass.sandBags (Java: a later shop offers the remainder)',
		out.after11.sandBags === 2 && out.after16.sandBags === 4, JSON.stringify({ after11: out.after11, after16: out.after16 }));
	check('the depth-16 shelf then stocks shopSandBags(16, 3) = 2, not a fresh five',
		out.after16.bags === 2, JSON.stringify({ bags: out.after16.bags }));
	check('a cursed hourglass is refused (Java gate: identified && !cursed)', out.cursed === 0,
		JSON.stringify({ cursed: out.cursed }));
	check('an unidentified hourglass is refused too', out.unidentified === 0,
		JSON.stringify({ unidentified: out.unidentified }));

	await game.eval(`(() => { const s = window.__MWG__.currentScene; s.refresh(); return true; })()`);
	await new Promise((r) => setTimeout(r, 400));
	await game.screenshot('tools/scratch/browser-test/hourglass-shop-livecheck.png');

	const errors = game.consoleErrors();
	check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));

	const failed = results.filter((r) => !r.ok).length;
	console.log(`hourglass shop livecheck: ${results.length - failed}/${results.length} checks`);
	return failed === 0;
};
