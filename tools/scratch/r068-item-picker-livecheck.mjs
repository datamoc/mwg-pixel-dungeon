// node tools/browserTest.mjs --script tools/scratch/r068-item-picker-livecheck.mjs
// R068 browser verification (2026-09-30): the shared item picker
// (src/ui/itemPicker.ts createItemPickerWindow via scenes.openItemPicker) renders its rows
// with 32x32 item frames (16x16 sheet frame at 2x per itemPicker.ts:92-95), and selecting a
// row opens a second Confirm/Back view carrying the item's translated description
// (itemDescription -> MWL description keys / SPD .desc catalogues, displayName.ts:28-53).
// Flow exercised end to end: list -> row tap -> confirm view -> Back -> list -> row tap ->
// Confirm (pick commits the entry), plus Cancel (window closes without running the pick
// callback). Expected strings are read from the generated spdMessages.ts catalogue for the
// locale the browser actually chose; the Confirm/Back/Cancel button labels are
// portStrings.ts's en/fr values.
import { readFileSync } from 'node:fs';
import { typographic } from 'mwg/i18n';

const HERE = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const spdMessages = (() => {
	const src = readFileSync(`${HERE}../../src/generated/spdMessages.ts`, 'utf8');
	const marker = 'SPD_MESSAGES: Record<string, Record<string, string>> =';
	const body = src.slice(src.indexOf(marker) + marker.length).replace(/;\s*$/, '');
	return (0, eval)(`(${body})`);
})();

const BUTTONS = {
	en: { confirm: 'Confirm', back: 'Back', cancel: 'Cancel' },
	fr: { confirm: 'Confirmer', back: 'Retour', cancel: 'Annuler' },
};

// item id -> [display-name key, description key] (name from ITEM_KEYS/MWL consumable rows,
// description from item-rules.mwl:826/839/874's consumableDescriptionKeys table).
const ITEMS = [
	{ id: 'potionHealing', quantity: 1, name: 'items.potions.potionofhealing.name', desc: 'items.potions.potionofhealing.desc' },
	{ id: 'scrollIdentify', quantity: 2, name: 'items.scrolls.scrollofidentify.name', desc: 'items.scrolls.scrollofidentify.desc' },
	{ id: 'food', quantity: 3, name: 'items.food.food.name', desc: 'items.food.food.desc' },
];

const catalogue = (locale) => spdMessages[locale] ?? spdMessages.en;

const expect = (cond, message) => { if (!cond) throw new Error(`R068 FAIL: ${message}`); };
const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async (game) => {
	await game.startGame();
	// startGame returns once the dungeon scene exists, but its run-start InterlevelScene
	// curtain (coreSpawnTiles.showInterlevel: Java's fadeTime x2, input blocked while up,
	// dark backdrop over everything) can still be showing - poll it away so the
	// screenshots show the picker itself rather than the "Descente" loading overlay, and
	// so every tap lands on a settled screen.
	const curtainDeadline = Date.now() + 10000;
	let curtain = true;
	while (curtain && Date.now() < curtainDeadline) {
		await settle(200);
		curtain = await game.eval(`(() => { const s = window.__MWG__.currentScene; return !!(s && s['interlevel']); })()`);
	}
	expect(!curtain, 'InterlevelScene curtain never cleared after startGame');

	// --- phase 1: open the picker over three synthetic bag entries -------------------
	const opened = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		if (typeof s.openItemPicker !== 'function') return { fail: 'openItemPicker missing' };
		window.__r068 = { picked: null };
		const entries = ${JSON.stringify(ITEMS.map(({ id, quantity }) => ({ id, quantity, identified: true })))};
		s.openItemPicker('R068 check', entries, (entry) => { window.__r068.picked = entry; }, 'synthetic bag snapshot');
		const texts = [], small = [];
		const walk = (node) => {
			if (node.visible === false) return;
			if (typeof node.text === 'string' && node.text.length > 0) texts.push(node.text);
			// Probe every small textured node: texture frame, scale and global bounds, so the
			// assertion can pin the *rendered* size rather than a width getter whose scale
			// semantics differ across Pixi versions.
			if (node.texture && typeof node.width === 'number' && node.width <= 64 && node.height <= 64) {
				let bounds = null;
				try { const b = node.getBounds(); bounds = { x: b.x, y: b.y, w: b.width, h: b.height }; } catch { bounds = null; }
				small.push({
					w: node.width, h: node.height,
					scale: node.scale ? [node.scale.x, node.scale.y] : null,
					frame: node.texture.frame ? [node.texture.frame.width, node.texture.frame.height] : null,
					bounds,
				});			}
			for (const child of node.children ?? []) walk(child);
		};
		walk(s.itemPickerWindow);
		// The UI layer renders at an integer scale above the logical grid (2x here), so
		// rendered bounds are physical pixels; the R068 "32x32" claim is in the picker's
		// own logical space. Derive the scale from the window's ancestor chain.
		let uiScale = 1;
		let ancestor = s.itemPickerWindow.parent;
		while (ancestor) { const sc = ancestor.scale; if (sc && typeof sc.x === 'number') uiScale *= Math.abs(sc.x); ancestor = ancestor.parent; }
		// Full dump of the window subtree: constructor name, eventMode and bounds, so a
		// future failure can be diagnosed from the log without re-deriving the tree.
		const dump = [];
		const seen = (node) => {
			let b = null;
			try { const g = node.getBounds(); b = { x: Math.round(g.x), y: Math.round(g.y), w: Math.round(g.width), h: Math.round(g.height) }; } catch { /* leaf-less */ }
			dump.push({ type: node.constructor?.name ?? typeof node, em: node.eventMode ?? null, vis: node.visible !== false, text: typeof node.text === 'string' ? node.text.slice(0, 30) : null, b });
			for (const child of node.children ?? []) seen(child);
		};
		seen(s.itemPickerWindow);
		// Row button centre: the static-interactive node that contains the first row icon
		// (row buttons are columnWidth x 36; the window blocker/chrome are wider or taller,
		// and tapping those is an outside click that closes the modal).
		let button = null;
		const screen = mwg.app.renderer.screen;
		if (small.length > 0 && small[0].bounds) {
			const cx = small[0].bounds.x + small[0].bounds.w / 2;
			const cy = small[0].bounds.y + small[0].bounds.h / 2;
			// Every static-interactive node containing the icon centre (row button, but also
			// possibly the window root/blocker as ancestors); the innermost - smallest area -
			// wins, since tapping an ancestor means an outside/modal click, not the row.
			const candidates = [];
			const findButton = (node) => {
				if (node.eventMode === 'static') {
					const b = node.getBounds();
					if (cx >= b.x && cx <= b.x + b.width && cy >= b.y && cy <= b.y + b.height) {
						candidates.push({ fx: (b.x + b.width / 2) / screen.width, fy: (b.y + b.height / 2) / screen.height, w: b.width, h: b.height, area: b.width * b.height });
					}
				}
				for (const child of node.children ?? []) findButton(child);
			};
			findButton(s.itemPickerWindow);
			candidates.sort((a, b) => a.area - b.area);
			button = candidates[0] ?? null;
		}
		return { lang: navigator.language, open: s.itemPickerOpen === true, texts, small, button, screen: { w: screen.width, h: screen.height }, uiScale, dump };
	})()`);
	expect(!opened.fail, opened.fail ?? 'picker did not open');
	expect(opened.open, 'itemPickerOpen is not true after openItemPicker');
	console.log('list texts:', JSON.stringify(opened.texts));
	console.log('small textured nodes:', JSON.stringify(opened.small));
	console.log('navigator.language:', opened.lang, 'screen:', JSON.stringify(opened.screen));
	console.log('window subtree:');
	for (const [i, n] of (opened.dump ?? []).entries()) {
		console.log(`  [${i}] ${n.type} em=${n.em} vis=${n.vis} text=${JSON.stringify(n.text)} b=${JSON.stringify(n.b)}`);
	}

	const locale = (opened.lang ?? 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
	const cat = catalogue(locale);
	const buttons = BUTTONS[locale];
	// t() runs every message through mwg's typographic() for the active locale unless the
	// catalog opts out (fr converts letter-'-letter to a typographic apostrophe, among other
	// Imprimerie nationale rules) - so expected strings go through the same function, with
	// t()'s active-then-base resolution (spdMessages fr key, else the en fallback value).
	const typ = (text) => typographic(text, locale);
	const pick = (key) => cat[key] ?? spdMessages.en[key];
	for (const key of Object.keys(buttons)) buttons[key] = typ(buttons[key]);

	// Row labels: displayName + ` x${quantity}` when quantity > 1 (itemPicker.ts:76-77).
	const labels = ITEMS.map((item) => typ(pick(item.name)) + (item.quantity > 1 ? ` x${item.quantity}` : ''));
	for (const label of labels) expect(opened.texts.includes(label), `row label missing from list: ${label}`);
	expect(opened.texts.includes(buttons.cancel), `cancel row missing (${buttons.cancel})`);

	// Rows render their item frame: a 16x16 sheet frame at 2x = 32x32 (itemPicker.ts:90-91).
	// The width getter reports the unscaled 16 through the pixi interop shim, so the claim is
	// pinned on the global rendered bounds instead, and the three icons must sit at three
	// distinct row positions (one per entry, no duplicated/stray texture).
	const frames = opened.small.filter((icon) => icon.frame && icon.frame[0] === 16 && icon.frame[1] === 16);
	expect(frames.length >= ITEMS.length, `expected >=${ITEMS.length} 16x16-frame row icons, got ${frames.length}: ${JSON.stringify(opened.small)}`);
	expect(opened.uiScale >= 1, `bad uiScale ${opened.uiScale}`);
	const wrongBounds = frames.filter((icon) => !icon.bounds || Math.round(icon.bounds.w / opened.uiScale) !== 32 || Math.round(icon.bounds.h / opened.uiScale) !== 32);
	expect(wrongBounds.length === 0, `row frames do not render at 32x32 logical (uiScale=${opened.uiScale}): ${JSON.stringify(wrongBounds)}`);
	const rowTops = [...new Set(frames.map((icon) => Math.round(icon.bounds.y)))];
	expect(rowTops.length >= ITEMS.length, `icons do not sit on distinct rows: ${JSON.stringify(frames.map((icon) => icon.bounds.y))}`);

	await game.screenshot('r068-picker-list.png');

	// --- phase 2: select a row -> second Confirm/Back view with description ----------
	console.log('row button tap target:', JSON.stringify(opened.button));
	expect(opened.button, 'no row button found to tap');
	await game.tap(opened.button.fx, opened.button.fy);
	const tapState = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		return { open: s.itemPickerOpen === true, hasWindow: !!s.itemPickerWindow, windows: (s.gameWindows ?? []).length, picked: window.__r068.picked };
	})()`);
	console.log('state after row tap:', JSON.stringify(tapState));
	expect(tapState.open && tapState.hasWindow, `row tap closed the picker: ${JSON.stringify(tapState)}`);
	const confirm = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		if (!s.itemPickerWindow) return { visible: [], open: false };
		const visible = [];
		const walk = (node) => {
			if (node.visible === false) return;
			if (typeof node.text === 'string' && node.text.length > 0) visible.push(node.text);
			for (const child of node.children ?? []) walk(child);
		};
		walk(s.itemPickerWindow);
		return { visible, open: s.itemPickerOpen === true };
	})()`);
	console.log('confirm-view visible texts:', JSON.stringify(confirm.visible));
	expect(confirm.open, 'picker closed on row tap');
	const withBody = confirm.visible.filter((text) => text.includes('\n\n'));
	expect(withBody.length === 1, `expected exactly one confirm body, got ${withBody.length}`);
	const [head, body] = withBody[0].split('\n\n');
	expect(head === labels[0], `confirm head ${JSON.stringify(head)} !== label ${JSON.stringify(labels[0])}`);
	const expectedDesc = typ(pick(ITEMS[0].desc));
	expect(body === expectedDesc, `confirm description mismatch:\n  got ${JSON.stringify(body)}\n  want ${JSON.stringify(expectedDesc)}`);
	expect(confirm.visible.includes(buttons.confirm), `confirm button missing (${buttons.confirm})`);
	expect(confirm.visible.includes(buttons.back), `back button missing (${buttons.back})`);
	// The description must be translated catalogue prose, not a raw key or the English
	// string when the browser chose another locale (fr runs have their own text).
	expect(!body.startsWith('items.'), 'description is a raw i18n key');
	if (locale === 'fr') expect(body !== spdMessages.en[ITEMS[0].desc], 'French run showed the English description');

	await game.screenshot('r068-picker-confirm.png');

	// --- phase 3: Back restores the list, Confirm commits the pick -------------------
	await game.tapText(buttons.back);
	const afterBack = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const visible = [];
		const walk = (node) => {
			if (node.visible === false) return;
			if (typeof node.text === 'string' && node.text.length > 0) visible.push(node.text);
			for (const child of node.children ?? []) walk(child);
		};
		walk(s.itemPickerWindow);
		return { visible, open: s.itemPickerOpen === true, picked: window.__r068.picked };
	})()`);
	expect(afterBack.open, 'picker closed on Back');
	expect(afterBack.visible.includes(labels[0]), 'row list did not come back after Back');
	expect(afterBack.picked === null, 'Back must not commit a pick');

	await game.tap(opened.button.fx, opened.button.fy);
	await game.tapText(buttons.confirm);
	const afterConfirm = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		return { picked: window.__r068.picked, open: s.itemPickerOpen === true, hasWindow: !!s.itemPickerWindow };
	})()`);
	// The scene-level callback contract (openItemPicker's own signature, panelsSingleUse.ts
	// :1134) is the picked ENTRY object, not an index; Cancel runs no callback at all
	// (chooseItemPicker only fires cb when a real entry picked).
	expect(afterConfirm.picked && afterConfirm.picked.id === ITEMS[0].id, `Confirm committed ${JSON.stringify(afterConfirm.picked)}, want the picked entry {id: '${ITEMS[0].id}'}`);
	expect(!afterConfirm.open && !afterConfirm.hasWindow, 'window still open after Confirm');

	// --- phase 4: Cancel closes without running the pick callback ---------------------
	await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		window.__r068.picked = 'phase4-open';
		s.openItemPicker('R068 check', ${JSON.stringify(ITEMS.map(({ id, quantity }) => ({ id, quantity, identified: true })))}, (entry) => { window.__r068.picked = entry; });
		return s.itemPickerOpen === true;
	})()`);
	// The confirm/back taps in phase 3 land on a window opened back in phase 1 (long
	// settled); this one is tapped right after a fresh open, so give its first layout
	// pass a beat before trusting text bounds as a tap target.
	await settle(400);
	await game.tapText(buttons.cancel);
	const afterCancel = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const visible = [];
		const walk = (node) => {
			if (node.visible === false) return;
			if (typeof node.text === 'string' && node.text.length > 0) visible.push(node.text);
			for (const child of node.children ?? []) walk(child);
		};
		if (s.itemPickerWindow) walk(s.itemPickerWindow);
		return { picked: window.__r068.picked, open: s.itemPickerOpen === true, visible };
	})()`);
	console.log('state after Cancel tap:', JSON.stringify(afterCancel));
	expect(afterCancel.picked === 'phase4-open', `Cancel must not run the pick callback, got ${JSON.stringify(afterCancel.picked)}`);
	expect(!afterCancel.open, `window still open after Cancel: ${JSON.stringify(afterCancel)}`);

	const errors = await game.consoleErrors();
	expect(errors.length === 0, `console errors: ${errors.join(' | ')}`);
	console.log(`R068 PASS: list with ${frames.length} 32x32 frames, confirm view body matches ${locale} catalogue, Back/Confirm/Cancel all behave (${locale})`);
};
