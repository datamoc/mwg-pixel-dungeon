// Diagnose why the ÉQUIPER tap does nothing. node tools/browserTest.mjs --script tools/scratch/bt-equip2.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default async (game) => {
	const say = (m) => console.log(`[${game.browser}] ${m}`);

	await game.startGame();

	const w3 = await game.eval(`(() => {
		const item = scene.generatedInventoryItem({ cat: 3, cls: 'Mace', cursed: false, level: 3, quantity: 1, hasGoodEnchant: false });
		item.identified = true;
		scene.bag.add(item);
		window.__W3__ = item;
		return { inst: item.instanceId, name: scene.itemDisplayName(item.id, true, item.instanceId) };
	})()`);
	say(`injected ${JSON.stringify(w3)}`);

	// record every hop of the click path
	await game.eval(`(() => {
		window.__CALLS__ = [];
		const scene0 = scene;
		const origUse = scene0.useItemById.bind(scene0);
		scene0.useItemById = function (id, inst) {
			window.__CALLS__.push(['useItemById', id, inst ?? null, 'awaiting=' + scene0.awaitingInput]);
			return origUse(id, inst);
		};
		const origEquip = scene0.equipWeapon.bind(scene0);
		scene0.equipWeapon = function (id, inst) {
			window.__CALLS__.push(['equipWeapon', id, inst ?? null]);
			return origEquip(id, inst);
		};
		return true;
	})()`);

	// open bag + card
	await game.eval(`(() => { scene.inventoryOpen = true; scene.refreshInventoryPanel(); const carried = scene.inventoryPanel['carried'] ?? []; const entry = carried.find(e => e.instanceId === window.__W3__.instanceId); if (!entry) return 'missing'; scene.inventoryPanel['inspect'](entry); return true; })()`);
	await sleep(300);

	const card = await game.findText('quip');
	say(`card text "${card.text}" at fx=${card.fx.toFixed(4)} fy=${card.fy.toFixed(4)}`);

	// what is actually under that point?
	const diag = await game.eval(`(() => {
		const hit = ${JSON.stringify(card)};
		const mwg = window.__MWG__, stage = mwg.app.stage, screen = mwg.app.renderer.screen;
		const px = hit.fx * screen.width, py = hit.fy * screen.height;
		const global = stage.hitTest ? stage.hitTest({ x: px, y: py }) : null;
		const c = document.querySelector('canvas');
		const r = c.getBoundingClientRect();
		const clientX = r.left + hit.fx * r.width, clientY = r.top + hit.fy * r.height;
		const el = document.elementFromPoint(clientX, clientY);
		const panel = scene.inventoryPanel;
		const chain = [];
		let n = global;
		while (n && chain.length < 8) { chain.push({ type: n.constructor?.name, text: n.text ?? null, eventMode: n.eventMode ?? null }); n = n.parent; }
		return {
			screen: [screen.width, screen.height], canvasRect: [Math.round(r.width), Math.round(r.height), Math.round(r.left), Math.round(r.top)],
			elementAtPoint: el ? el.tagName + (el.className ? '.' + el.className : '') : null,
			hitChain: chain,
			detailVisible: panel['detail']?.visible ?? null, chosen: panel['chosen']?.name ?? null,
			inventoryOpen: scene.inventoryOpen, awaiting: scene.awaitingInput,
		};
	})()`);
	say(`diag: ${JSON.stringify(diag)}`);

	// tap ÉQUIPER
	await game.tap(card.fx, card.fy);
	await sleep(500);

	const after = await game.eval(`(() => ({
		calls: window.__CALLS__ ?? [],
		detailVisible: scene.inventoryPanel['detail']?.visible ?? null,
		chosen: scene.inventoryPanel['chosen']?.name ?? null,
		inventoryOpen: scene.inventoryOpen,
		weaponId: scene.weaponId, wLevel: scene.weaponLevel, wSrc: scene.weaponSourceClass ?? null,
		bagLen: scene.bag.items.length,
	}))()`);
	say(`after EQUIP tap: ${JSON.stringify(after)}`);

	if (!after.calls.length) {
		// try again with an explicit dispatch from INSIDE the page at the button's own bounds
		const retry = await game.eval(`(() => {
			const panel = scene.inventoryPanel;
			const detail = panel['detail'];
			let btn = null;
			const walk = (n) => { if (btn) return; if (n.text !== undefined && /quip/i.test(String(n.text))) btn = n.parent ?? n; for (const ch of (n.children || [])) walk(ch); };
			walk(detail);
			if (!btn) return 'no-button-node';
			const b = btn.getBounds();
			const screen = window.__MWG__.app.renderer.screen;
			const fx = (b.x + b.width / 2) / screen.width, fy = (b.y + b.height / 2) / screen.height;
			const c = document.querySelector('canvas'), r = c.getBoundingClientRect();
			const o = { clientX: r.left + fx * r.width, clientY: r.top + fy * r.height, bubbles: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
			for (const t of ['pointermove', 'pointerdown', 'pointerup', 'click']) c.dispatchEvent(new PointerEvent(t, o));
			return { btnType: btn.constructor?.name, bounds: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] };
		})()`);
		say(`in-page retry: ${JSON.stringify(retry)}`);
		await sleep(500);
		const after2 = await game.eval(`(() => ({ calls: window.__CALLS__ ?? [], weaponId: scene.weaponId, wLevel: scene.weaponLevel, inventoryOpen: scene.inventoryOpen, detailVisible: scene.inventoryPanel['detail']?.visible ?? null }))()`);
		say(`after in-page retry: ${JSON.stringify(after2)}`);
	}

	const errs = game.consoleErrors();
	if (errs.length) say(`console errors: ${JSON.stringify(errs.slice(0, 3))}`);
};
