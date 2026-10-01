// R074 live verification: badge descriptions in Swedish + Belarusian (badge-only catalogs).
// node tools/browserTest.mjs --script tools/scratch/r074-lv.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Find every Window on the stack (robust to WindowStack internals) and scan badge descriptions:
 *  emit pointertap on each badge icon in turn, collecting the description label's rendered text. */
const SCAN = `
(() => {
	const findWindows = (node, out) => {
		if (node && node.content && typeof node.content === 'object') out.push(node);
		if (node && node.children) for (const c of node.children) findWindows(c, out);
		return out;
	};
	const wins = findWindows(scene['windows'], []);
	const top = wins[wins.length - 1];
	if (!top) return { error: 'no window found' };
	const content = top.content;
	const icons = content.children.filter((c) => typeof c.eventNames === 'function' && c.eventNames().includes('pointerover'));
	const labels = content.children.filter((c) => typeof c.setText === 'function');
	const before = labels.map((l) => l.text);
	icons[0].emit('pointertap');
	const after = labels.map((l) => l.text);
	let di = after.findIndex((t, i) => t !== before[i]);
	if (di < 0) di = labels.length - 1;
	const desc = labels[di];
	const out = [];
	for (let i = 0; i < icons.length; i++) { icons[i].emit('pointertap'); out.push(desc.text); }
	return { iconCount: icons.length, windowCount: wins.length, descriptions: out, descIndex: di };
})()`;

/** Leave a specific badge's description showing (by substring) for the screenshot.
 *  `di` is the description label's index from SCAN (re-detecting it here fails when the
 *  description already shows what icons[0] would set). */
const SHOW = (di, needle) => `
(() => {
	const findWindows = (node, out) => {
		if (node && node.content && typeof node.content === 'object') out.push(node);
		if (node && node.children) for (const c of node.children) findWindows(c, out);
		return out;
	};
	const wins = findWindows(scene['windows'], []);
	const top = wins[wins.length - 1];
	const icons = top.content.children.filter((c) => typeof c.eventNames === 'function' && c.eventNames().includes('pointerover'));
	const labels = top.content.children.filter((c) => typeof c.setText === 'function');
	const desc = labels[${di}];
	if (!desc) return 'no-desc';
	for (const icon of icons) {
		icon.emit('pointertap');
		if (desc.text.includes(${JSON.stringify(needle)})) return desc.text;
	}
	return desc.text;
})()`;

const expect = (descriptions, needle, label) => {
	const hit = descriptions.find((s) => s.includes(needle));
	if (!hit) throw new Error(`${label}: no description containing "${needle}"\n  got: ${JSON.stringify(descriptions.slice(0, 8))}`);
	console.log(`  ok ${label}: ${hit}`);
	return hit;
};

/** Is a language-picker row (Svenska / Беларуская) visible through its whole ancestor chain?
 *  tapText's own visibility check ignores hidden ancestors, so a row behind an inactive tab
 *  still "matches" - but a real tap would hit the tab on top instead. */
const langRowVisible = (game) => game.eval(`(() => {
	let hit = false;
	const walk = (n) => {
		if (!n) return;
		if (typeof n.text === 'string' && /^(svenska|беларуская)$/i.test(n.text)) {
			let p = n, ok = true;
			while (p) { if (p.visible === false) { ok = false; break; } p = p.parent; }
			if (ok) hit = true;
		}
		if (n.children) n.children.forEach(walk);
	};
	walk(window.__MWG__.currentScene.stage);
	return hit;
})()`);

/** Make sure the language tab is the active one (rightmost settings tab, A-text icon at
 *  x~0.664/y~0.829 of the canvas) before tapping a language row. Probes after each tap, and
 *  retries once in case the tap toggled an already-active tab off. */
const ensureLanguageRow = async (game) => {
	if (await langRowVisible(game)) return 'already';
	await game.tap(0.664, 0.829);
	await sleep(500);
	if (await langRowVisible(game)) return 'tapped';
	await game.tap(0.664, 0.829);
	await sleep(500);
	if (await langRowVisible(game)) return 'tapped-twice';
	await game.screenshot('tools/scratch/browser-test/r074-langtab-fail.png');
	throw new Error('language row never became visible');
};

const closeTopWindow = async (game) => {
	const count = await game.eval(`(() => { const w = scene['windows']; let n = 0; const walk = (node) => { if (node && node.content && typeof node.content === 'object') n++; if (node && node.children) node.children.forEach(walk); }; walk(w); return n; })()`);
	if (count >= 1) { // any open window swallows the next tap's screen position
		try { await game.tapText('^(close|fermer|stäng)$', { timeout: 6000 }); } catch { /* window may have closed itself on language change */ }
		await sleep(400);
	}
	return count;
};

export default async (game) => {
	try {
		await game.waitFor('!!(window.__MWG__ && window.__MWG__.currentScene && window.__MWG__.currentScene["windows"])', { timeout: 45000 });
	} catch (e) {
		const errs = game.consoleErrors();
		throw new Error(`boot wait failed (${errs.length ? errs[0] : 'no console errors'}): ${e.message}`);
	}
	await sleep(800);
	await game.screenshot('tools/scratch/browser-test/r074-1-title-en.png');

	// ---- Swedish (badge-only catalog); labels may be FR/EN/SV depending on browser preference ----
	await game.tapText('^(réglages|settings|inställningar)$', { timeout: 15000 });
	await sleep(700);
	await game.screenshot('tools/scratch/browser-test/r074-2-settings-en.png');
	// The language picker sits behind the rightmost settings tab (the A-text icon); probe and
	// tap it so the Swedish row is actually on top (tapText alone would "match" a hidden row).
	console.log('sv lang tab: ' + await ensureLanguageRow(game));
	await game.screenshot('tools/scratch/browser-test/r074-3-settings-langtab.png');
	await game.tapText('^svenska$', { timeout: 15000 });
	await sleep(900);
	await game.screenshot('tools/scratch/browser-test/r074-3-settings-sv.png');
	await closeTopWindow(game);
	await sleep(500);
	await game.tapText('^dagbok$', { timeout: 15000 });
	await sleep(700);
	const sv = await game.eval(SCAN);
	if (sv.error) throw new Error('sv scan: ' + sv.error);
	console.log(`[sv] icons=${sv.iconCount} windows=${sv.windowCount} descIndex=${sv.descIndex}`);
	expect(sv.descriptions, 'Besegrade Klegget', 'sv boss1 (Goo name)');
	expect(sv.descriptions, 'Besegrade Klegget enbart med vapen', 'sv boss_challenge_1');
	expect(sv.descriptions, 'Besegrade Tengun', 'sv boss2 (Tengu name)');
	expect(sv.descriptions, 'Ägde sammetspåsen', 'sv bag_velvet');
	expect(sv.descriptions, 'Ägde skriftrullehållaren', 'sv bag_holder');
	expect(sv.descriptions, 'Ägde en potionbandolier', 'sv bag_bandolier');
	expect(sv.descriptions, 'skriftrulle av uppgradering', 'sv unlock_mage');
	console.log('sv show1:', await game.eval(SHOW(sv.descIndex, 'Besegrade Klegget')));
	await sleep(300);
	await game.screenshot('tools/scratch/browser-test/r074-4-badges-sv-boss1.png');
	console.log('sv show2:', await game.eval(SHOW(sv.descIndex, 'skriftrullehållaren')));
	await sleep(300);
	await game.screenshot('tools/scratch/browser-test/r074-5-badges-sv-holder.png');
	await closeTopWindow(game);
	await sleep(400);

	// ---- Belarusian (badge-only catalog) ----
	await game.tapText('^(налады|inställningar)$', { timeout: 15000 });
	await sleep(700);
	console.log('be lang tab: ' + await ensureLanguageRow(game));
	await game.screenshot('tools/scratch/browser-test/r074-6-langtab-be.png');
	await game.tapText('^беларуская$', { timeout: 15000 });
	await sleep(900);
	await game.screenshot('tools/scratch/browser-test/r074-6-settings-be.png');
	await closeTopWindow(game);
	await sleep(500);
	await game.tapText('запісы', { timeout: 15000 });
	await sleep(700);
	const be = await game.eval(SCAN);
	if (be.error) throw new Error('be scan: ' + be.error);
	console.log(`[be] icons=${be.iconCount} windows=${be.windowCount} descIndex=${be.descIndex}`);
	expect(be.descriptions, 'Перамог Смоўжа', 'be boss1');
	expect(be.descriptions, 'Перамог DM-300', 'be boss3 (Latin DM-300)');
	expect(be.descriptions, 'Перамог Караля Дварфаў', 'be boss4');
	expect(be.descriptions, 'Перамог Ёг-Джаву', 'be boss_challenge_5 (Yog)');
	expect(be.descriptions, 'Атрымаў футляр для скруткаў', 'be bag_holder');
	expect(be.descriptions, 'Валодаў аксамітным мяшочкам', 'be bag_velvet');
	expect(be.descriptions, 'Вынес Кудмень Эндора', 'be happy_end (Amulet)');
	expect(be.descriptions, 'скрутак Паляпшэння', 'be unlock_mage');
	console.log('be show1:', await game.eval(SHOW(be.descIndex, 'Кудмень Эндора')));
	await sleep(300);
	await game.screenshot('tools/scratch/browser-test/r074-7-badges-be-happy-end.png');
	console.log('be show2:', await game.eval(SHOW(be.descIndex, 'Атрымаў футляр')));
	await sleep(300);
	await game.screenshot('tools/scratch/browser-test/r074-8-badges-be-holder.png');

	const errors = game.consoleErrors();
	if (errors.length) throw new Error('console errors: ' + errors[0]);
	console.log('R074 LV OK: sv + be badge descriptions verified live, no console errors');
};
