// Throwaway (tools/scratch): browser verification for two T69 rows that both ended with
// "browser verification owed per ROADMAP.md section 10" (that section no longer exists after
// the coverage docs were split - the debt is what this file pays):
//   1. `PotionOfFrost.shatter()` / the quaff's `shatter(hero.pos)` (`rows-items-consumables...` :30)
//   2. `ScrollOfTransmutation.doRead()`'s item picker (`rows-items-consumables...` :31)
//
// Run after `npm run build`:  node tools/browserTest.mjs --script tools/scratch/frost-transmute-livecheck.mjs

export default async (game) => {
	const results = [];
	const check = (name, ok, detail = '') => {
		results.push({ name, ok: !!ok });
		console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`);
	};

	await game.startGame();
	// let the level-entry banner clear so the screenshot below shows the dungeon
	await new Promise((r) => setTimeout(r, 3000));

	// ---- 1. PotionOfFrost: quaff shatters at the hero's feet ------------------------------
	const frost = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const h = s.hero;
		let cell = null;
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]) {
			const x = h.x + dx, y = h.y + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) { cell = { x, y }; break; }
		}
		const rat = cell ? s.spawnMonster('rat', cell) : null;
		if (rat) { rat.sleeping = false; rat.seesHero = true; rat.hp = rat.maxHp = 40;
			// paralysed so a turn spent by the quaff cannot let it bite the hero - the check
			// below is about what the *potion* does, not about the rat's free swing.
			rat.buffs.paralysis = 5; }
		// a live fire under the quaffer: Java's Potion.splash / Freezing seeds clear it
		s.fire.seed(h.x, h.y, 10);
		if (cell) s.fire.seed(cell.x, cell.y, 10);
		const before = {
			fireHero: s.fire.volumeAt(h.x, h.y),
			fireRat: cell ? s.fire.volumeAt(cell.x, cell.y) : null,
			ratHp: rat ? rat.hp : null,
			heroHp: h.hp,
			ratBuffs: rat ? Object.keys(rat.buffs) : [],
		};
		s.bag.add({ id: 'potionFrost', quantity: 1, identified: true, instanceId: 'frost-live' });
		s['useItemById']('potionFrost', 'frost-live');
		const after = {
			fireHero: s.fire.volumeAt(h.x, h.y),
			fireRat: cell ? s.fire.volumeAt(cell.x, cell.y) : null,
			ratHp: rat ? rat.hp : null,
			heroHp: h.hp,
			ratBuffs: rat ? Object.keys(rat.buffs) : [],
			chillOnRat: rat ? rat.buffs.chill : null,
			chillOnHero: h.buffs.chill ?? null,
			frostOnRat: rat ? rat.buffs.frost : null,
			potionLeft: s.bag.find('potionFrost', 'frost-live') !== undefined,
			ratAlive: rat ? rat.hp > 0 : null,
		};
		return { cell, before, after };
	})()`);
	console.log('frost: ' + JSON.stringify(frost));

	check('a quaffed frost flask is consumed', frost.after.potionLeft === false, JSON.stringify({ left: frost.after.potionLeft }));
	check('it extinguishes the fire at the hero\'s feet (Potion.splash / Freezing)',
		frost.before.fireHero > 0 && frost.after.fireHero === 0,
		JSON.stringify({ before: frost.before.fireHero, after: frost.after.fireHero }));
	check('it chills the creature standing in the NEIGHBOURS9 area',
		frost.after.chillOnRat !== null || frost.after.frostOnRat !== null,
		JSON.stringify({ buffs: frost.after.ratBuffs }));
	check('it deals no damage by itself (the corrected claim: Freezing only chills)',
		frost.after.ratHp === frost.before.ratHp && frost.after.heroHp === frost.before.heroHp,
		JSON.stringify({ rat: [frost.before.ratHp, frost.after.ratHp], hero: [frost.before.heroHp, frost.after.heroHp] }));

	// ---- 2. ScrollOfTransmutation: doRead opens the item picker and rerolls ----------------
	const trans = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const bag = s.bag;
		bag.add({ id: 'potionHealing', quantity: 1, identified: true, instanceId: 'tm-live' });
		bag.add({ id: 'scrollTransmutation', quantity: 1, identified: true, instanceId: 'sc-live' });
		const potions = () => bag.items.filter((i) => String(i.id).startsWith('potion')).map((i) => i.id).sort();
		const potionsBefore = potions();
		const before = bag.items.find((i) => i.instanceId === 'tm-live');
		const beforeId = before ? before.id : null;
		s['useItemById']('scrollTransmutation', 'sc-live');
		const open = s.itemPickerOpen === true;
		const rows = (s.itemPickerEntries ?? []).map((e) => ({ key: e.instanceId ?? e.id ?? e.itemId ?? null, label: e.label ?? e.text ?? null }));
		const idx = rows.findIndex((r) => String(r.key).includes('tm-live'));
		if (idx >= 0) s['chooseItemPicker'](idx);
		const potionsAfter = potions();
		return {
			open, rows: rows.length, idx, beforeId,
			potionsBefore, potionsAfter,
			sameId: JSON.stringify(potionsBefore) === JSON.stringify(potionsAfter),
			scrollLeft: bag.find('scrollTransmutation', 'sc-live') !== undefined,
			pickerStillOpen: s.itemPickerOpen === true,
		};
	})()`);
	console.log('transmutation: ' + JSON.stringify(trans));

	check('reading a Transmutation scroll opens its item picker', trans.open === true, JSON.stringify({ open: trans.open, rows: trans.rows }));
	check('the picker offers at least one candidate', trans.rows > 0 && trans.idx >= 0, JSON.stringify({ rows: trans.rows, idx: trans.idx }));
	check('picking the flask rerolls it into a different potion (usableOnItem / changeItem)',
		trans.potionsBefore.length > 0 && trans.potionsAfter.length >= trans.potionsBefore.length && trans.sameId === false,
		JSON.stringify({ before: trans.potionsBefore, after: trans.potionsAfter }));
	check('the scroll is consumed by the read', trans.scrollLeft === false, JSON.stringify({ left: trans.scrollLeft }));

	await game.eval(`(() => { const s = window.__MWG__.currentScene; s.refresh(); return true; })()`);
	await new Promise((r) => setTimeout(r, 400));
	await game.screenshot('tools/scratch/browser-test/frost-transmute-livecheck.png');

	const errors = game.consoleErrors();
	check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));

	const failed = results.filter((r) => !r.ok).length;
	console.log(`frost+transmutation livecheck: ${results.length - failed}/${results.length} checks`);
	return failed === 0;
};
