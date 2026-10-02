// R114 live verification: the corrected Amulet-of-Yendor vault line, in en (control), ru, uk, pl.
// Boot -> start a Warrior -> switch language through the real in-game path (WndGame -> Settings ->
// language tab -> row) -> jump to the depth-26 vault (s['depth']=26; s['enterLevel'](), which runs
// populate()'s depth-26 branch and says port.log.amuletwaits) -> repeat per language, clearing the
// already-spawned Amulet first (the guard at npcShopBlacksmith.ts:349 only says the line on a
// fresh spawn).
// State handling learned from r114-introspect.mjs: WndGame refuses while menuCanOpen() is false
// (right after startGame the hero is not awaiting input yet); the dungeon scene's window stack is
// `gameWindows` (its `windows` field is null); the in-game window is not at the title screen's
// tap fractions (a blind 0.664/0.829 tap hits the HUD inventory), so every tap target is located
// live from its own bounds; taps fire only after a settle delay (mid-animation taps miss); and
// setLanguage persists to localStorage['spd-on-mwg.language'], which is the switch's gate.
// node tools/browserTest.mjs --script tools/scratch/r114-lv.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SETTINGS_SRC = '^(Settings|réglages|Настройки|Ustawienia|Параметри)$';

/** First ANCESTOR-VISIBLE stage text matching `src`, and its centre in canvas fractions. */
const tapByText = (game, src) => game.eval(`(() => {
	const re = new RegExp(${JSON.stringify(src)}, 'i');
	const screen = window.__MWG__.app.renderer.screen;
	let target = null;
	const walk = (n) => {
		if (!n || target) return;
		if (typeof n.text === 'string' && re.test(n.text)) {
			let p = n, ok = true;
			while (p) { if (p.visible === false) { ok = false; break; } p = p.parent; }
			if (ok) target = n;
		}
		if (n.children) n.children.forEach(walk);
	};
	walk(window.__MWG__.currentScene.stage);
	if (!target) return null;
	const b = target.getBounds();
	return { fx: +((b.x + b.width / 2) / screen.width).toFixed(4), fy: +((b.y + b.height / 2) / screen.height).toFixed(4) };
})()`);

/** Is an ancestor-visible stage text matching `src` on screen? */
const visibleText = (game, src) => game.eval(`(() => {
	const re = new RegExp(${JSON.stringify(src)}, 'i');
	let hit = null;
	const walk = (n) => {
		if (!n || hit) return;
		if (typeof n.text === 'string' && re.test(n.text)) {
			let p = n, ok = true;
			while (p) { if (p.visible === false) { ok = false; break; } p = p.parent; }
			if (ok) hit = n.text;
		}
		if (n.children) n.children.forEach(walk);
	};
	walk(window.__MWG__.currentScene.stage);
	return hit;
})()`);

/** Settings window present on gameWindows? Detected structurally: its content carries six tab
 *  buttons with pointertap children (settingsWindow.ts tabs = display/ui/input/data/audio/langs). */
const settingsOpen = (game) => game.eval(`(() => {
	const gw = window.__MWG__.currentScene['gameWindows'];
	for (const w of gw.children || []) {
		if (typeof w.close === 'function' && w.content) {
			const tabs = (w.content.children || []).filter((c) => (c.children || []).some(
				(s) => typeof s.eventNames === 'function' && s.eventNames().includes('pointertap')));
			if (tabs.length >= 6) return true;
		}
	}
	return false;
})()`);

/** Centre of the rightmost tab button (langsTab() is last in the tabs array, settingsWindow.ts:1006). */
const tapLanguageTab = (game) => game.eval(`(() => {
	const gw = window.__MWG__.currentScene['gameWindows'];
	const screen = window.__MWG__.app.renderer.screen;
	const win = [...(gw.children || [])].find((c) => typeof c.close === 'function' && c.content);
	if (!win) return null;
	const tabs = (win.content.children || []).filter((c) => (c.children || []).some(
		(s) => typeof s.eventNames === 'function' && s.eventNames().includes('pointertap')));
	let best = null;
	for (const t of tabs) {
		let b; try { b = t.getBounds(); } catch { continue; }
		if (!b.width || !b.height) continue;
		if (!best || b.x > best.x) best = b;
	}
	if (!best) return null;
	return { fx: +((best.x + best.width / 2) / screen.width).toFixed(4), fy: +((best.y + best.height / 2) / screen.height).toFixed(4) };
})()`);

/** The persisted language (setLanguage -> localStorage, settingsWindow.ts:904). */
const langCode = (game) => game.eval(`localStorage.getItem('spd-on-mwg.language')`);

const menuCanOpen = (game) => game.eval(`(() => {
	const cs = window.__MWG__.currentScene;
	return typeof cs['menuCanOpen'] === 'function' ? cs['menuCanOpen']() : false;
})()`);

/** Close every window on the dungeon stack through its own close() (non-windows lack .content). */
const closeWindows = async (game) => game.eval(`(() => {
	const gw = window.__MWG__.currentScene['gameWindows'];
	let n = 0;
	for (const c of [...((gw && gw.children) || [])]) {
		if (c && typeof c.close === 'function' && c.content) { c.close(); n++; }
	}
	return n;
})()`);

/** All stage texts containing any needle (the say line renders as Pixi text). */
const FIND = (needles) => `(() => {
	const n = ${JSON.stringify(needles)};
	const stage = window.__MWG__.currentScene.stage;
	const out = [];
	const walk = (node) => {
		if (!node) return;
		if (typeof node.text === 'string' && n.some((x) => node.text.includes(x))) out.push(node.text);
		if (node.children) node.children.forEach(walk);
	};
	walk(stage);
	return out;
})()`;

/** Poll the stage for any needle; returns the matched log text. */
const expectLine = async (game, needles, label) => {
	for (let i = 0; i < 10; i++) {
		const hits = await game.eval(FIND(needles));
		if (Array.isArray(hits) && hits.length) {
			console.log(`  ok ${label}: ${JSON.stringify(hits[0])}`);
			return hits;
		}
		await sleep(500);
	}
	await game.screenshot(`tools/scratch/browser-test/r114-fail-${label}.png`);
	throw new Error(`${label}: none of ${JSON.stringify(needles)} ever appeared`);
};

const clearAmulet = async (game) => game.eval(`(() => {
	const s = window.__MWG__.currentScene;
	const before = s['groundItems'].length;
	s['groundItems'] = s['groundItems'].filter((g) => !(g.x === 8 && g.y === 12));
	return { before, after: s['groundItems'].length };
})()`);

const jumpVault = async (game) => {
	// Re-entering the depth we are already on would snapshot-then-restore itself:
	// enterLevel's captureActiveFloor() keys by activeFloorDepth (== this.depth here), and
	// savedFloor = floorStates.get(depth) then takes the restore path, skipping populate()'s
	// say entirely. Null the key and drop any stale snapshot so each jump regenerates like a
	// real descent (enterLevel sets activeFloorDepth = this.depth again at its end).
	await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		s['activeFloorDepth'] = null;
		if (s['floorStates'] && typeof s['floorStates'].delete === 'function') s['floorStates'].delete(26);
		s['depth'] = 26;
		s['enterLevel']();
		return s['depth'];
	})()`);
	await sleep(3000);
};

/** Open WndGame once the scene is actually ready for it (menuCanOpen refuses mid-settle). */
const openMenu = async (game) => {
	for (let attempt = 0; attempt < 8; attempt++) {
		await closeWindows(game);
		await sleep(300);
		if (await menuCanOpen(game)) {
			await game.eval(`(() => { window.__MWG__.currentScene['onAction']('gameMenu'); return true; })()`);
			for (let i = 0; i < 6; i++) {
				if (await visibleText(game, SETTINGS_SRC)) return;
				await sleep(400);
			}
		} else {
			await sleep(600); // hero not awaiting input yet
		}
	}
	await game.screenshot('tools/scratch/browser-test/r114-menu-fail.png');
	throw new Error('game menu never showed its settings entry');
};

/** In-game language switch through the real UI: WndGame -> Settings -> languages tab -> row,
 *  gated on localStorage so a missed tap fails loudly instead of silently keeping the old locale. */
const switchLanguage = async (game, row, code) => {
	await openMenu(game);
	await sleep(500); // let the menu animation settle before tapping its entry

	let open = false;
	for (let i = 0; i < 4 && !open; i++) {
		if (await settingsOpen(game)) { open = true; break; }
		const pos = await tapByText(game, SETTINGS_SRC);
		if (pos) await game.tap(pos.fx, pos.fy);
		await sleep(700);
		open = await settingsOpen(game);
	}
	if (!open) {
		await game.screenshot('tools/scratch/browser-test/r114-settings-fail.png');
		throw new Error('settings window never opened');
	}
	await sleep(400); // settings animation settle

	for (let i = 0; i < 4; i++) {
		if (await visibleText(game, `^${row}$`)) break;
		const pos = await tapLanguageTab(game);
		if (pos) await game.tap(pos.fx, pos.fy);
		await sleep(500);
	}
	if (!(await visibleText(game, `^${row}$`))) {
		await game.screenshot('tools/scratch/browser-test/r114-langtab-fail.png');
		throw new Error(`language row ${row} never became visible`);
	}

	for (let i = 0; i < 4; i++) {
		if ((await langCode(game)) === code) break;
		const pos = await tapByText(game, `^${row}$`);
		if (pos) await game.tap(pos.fx, pos.fy);
		await sleep(600);
	}
	const got = await langCode(game);
	if (got !== code) {
		await game.screenshot('tools/scratch/browser-test/r114-langrow-fail.png');
		throw new Error(`language switch to ${code} did not persist (localStorage=${got})`);
	}
	console.log(`  ${row} -> ${code}: localStorage confirmed`);
	await sleep(800); // settings reopens with fresh labels
	await closeWindows(game);
	await sleep(400);
};

export default async (game) => {
	try {
		await game.waitFor('!!(window.__MWG__ && window.__MWG__.currentScene && window.__MWG__.currentScene["windows"])', { timeout: 45000 });
	} catch (e) {
		const errs = game.consoleErrors();
		throw new Error(`boot wait failed (${errs.length ? errs[0] : 'no console errors'}): ${e.message}`);
	}
	await sleep(800);
	await game.screenshot('tools/scratch/browser-test/r114-1-title.png');

	await game.startGame();
	await sleep(1500);

	// ---- en control (the browser starts the run in French; switch so the needle is stable) ----
	await switchLanguage(game, 'english', 'en');
	await jumpVault(game);
	await expectLine(game, ['The Amulet of Yendor rests in the vault'], 'vault-en');
	await game.screenshot('tools/scratch/browser-test/r114-2-vault-en.png');

	// ---- ru ----
	await switchLanguage(game, 'русский', 'ru');
	await clearAmulet(game);
	await jumpVault(game);
	await expectLine(game, ['Амулет Индора покоится в хранилище'], 'vault-ru');
	await game.screenshot('tools/scratch/browser-test/r114-3-vault-ru.png');

	// ---- uk ----
	await switchLanguage(game, 'українська', 'uk');
	await clearAmulet(game);
	await jumpVault(game);
	await expectLine(game, ['Амулет Єндера спочиває у сховищі'], 'vault-uk');
	await game.screenshot('tools/scratch/browser-test/r114-4-vault-uk.png');

	// ---- pl ----
	await switchLanguage(game, 'polski', 'pl');
	await clearAmulet(game);
	await jumpVault(game);
	await expectLine(game, ['Amulet Yendoru spoczywa w skarbcu'], 'vault-pl');
	await game.screenshot('tools/scratch/browser-test/r114-5-vault-pl.png');

	const errors = game.consoleErrors();
	if (errors.length) throw new Error('console errors: ' + errors[0]);
	console.log('R114 LV OK: vault line verified in en/ru/uk/pl, no console errors');
};
