// Equipment management, happy path: equip weapon/armor via the real ÉQUIPER button click.
// node tools/browserTest.mjs --script tools/scratch/bt-equip3.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async (game) => {
	const say = (m) => console.log(`[${game.browser}] ${m}`);
	const shots = 'tools/scratch/browser-test';

	await game.startGame();

	// wait until the level-entry transition ends and the scene accepts input
	const ready = await game.waitFor('scene && scene.awaitingInput === true', { timeout: 20000 }).catch((e) => String(e.message));
	say(`awaitingInput ready: ${JSON.stringify(ready)}`);

	const snap = async (label) => {
		const s = await game.eval(`(() => ({
			weaponId: scene.weaponId, wLevel: scene.weaponLevel, wTier: scene.weaponTier, wSrc: scene.weaponSourceClass ?? null,
			armorId: scene.armorId, aLevel: scene.armorLevel, aTier: scene.armorTier,
			bag: scene.bag.items.filter(i => /^(weaponReward|armorReward)$/.test(i.id)).map(i => [i.sourceClass, i.level, i.instanceId]),
			awaiting: scene.awaitingInput, actionSpentTurn: scene.actionSpentTurn ?? null,
		}))()`);
		say(`${label}: ${JSON.stringify(s)}`);
		return s;
	};

	const inj = await game.eval(`(() => {
		const add = (cat, cls, level) => {
			const item = scene.generatedInventoryItem({ cat, cls, cursed: false, level, quantity: 1, hasGoodEnchant: false });
			item.identified = true;
			scene.bag.add(item);
			return item;
		};
		window.__EQ__ = { w3: add(3, 'Mace', 3), w0: add(1, 'Dagger', 0), a2: add(6, 'MailArmor', 2), a0: add(6, 'ScaleArmor', 0) };
		return Object.fromEntries(Object.entries(window.__EQ__).map(([k, v]) => [k, { name: scene.itemDisplayName(v.id, true, v.instanceId), inst: v.instanceId, lvl: v.level, tier: v.tier }]));
	})()`);
	say(`injected: ${JSON.stringify(inj)}`);

	// every 'quip' text node in the stage, with bounds - explains the stray node findText hit
	const quips = await game.eval(`(() => {
		const re = /quip/i, stage = window.__MWG__.app.stage, screen = window.__MWG__.app.renderer.screen;
		const out = [];
		const walk = (n, path) => {
			if (n.text !== undefined && re.test(String(n.text))) {
				const b = n.getBounds();
				out.push({ text: String(n.text), path, fx: +((b.x + b.width / 2) / screen.width).toFixed(4), fy: +((b.y + b.height / 2) / screen.height).toFixed(4), visible: n.visible });
			}
			(n.children || []).forEach((c, i) => walk(c, path + '/' + (c.constructor?.name ?? '?')));
		};
		walk(stage, '');
		return out;
	})()`);
	say(`quip nodes: ${JSON.stringify(quips)}`);

	/** Open bag, inspect entry, click the ÉQUIPER button at its real bounds. */
	const equipStep = async (key, expect) => {
		await game.eval(`(() => { scene.inventoryOpen = true; scene.refreshInventoryPanel(); const e = (scene.inventoryPanel['carried'] ?? []).find(x => x.instanceId === window.__EQ__.${key}.instanceId); if (!e) return false; scene.inventoryPanel['inspect'](e); return true; })()`);
		await sleep(350);
		const click = await game.eval(`(() => {
			const detail = scene.inventoryPanel['detail'];
			let label = null;
			const walk = (n) => { if (label) return; if (n.text !== undefined && /quip/i.test(String(n.text))) label = n; for (const c of (n.children || [])) walk(c); };
			walk(detail);
			if (!label) return 'no-label';
			const btn = label.parent;
			const b = btn.getBounds();
			const screen = window.__MWG__.app.renderer.screen;
			const fx = (b.x + b.width / 2) / screen.width, fy = (b.y + b.height / 2) / screen.height;
			const c = document.querySelector('canvas'), r = c.getBoundingClientRect();
			const o = { clientX: r.left + fx * r.width, clientY: r.top + fy * r.height, bubbles: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
			for (const t of ['pointermove', 'pointerdown', 'pointerup', 'click']) c.dispatchEvent(new PointerEvent(t, o));
			return { label: String(label.text), fx: +fx.toFixed(4), fy: +fy.toFixed(4), btnType: btn.constructor?.name };
		})()`);
		say(`  ${key}: clicked ${JSON.stringify(click)}`);
		await sleep(600);
		const s = await snap(`after ${key}`);
		if (expect) for (const [k, v] of Object.entries(expect)) {
			if (JSON.stringify(s[k]) !== JSON.stringify(v)) throw new Error(`${key}: expected ${k}=${JSON.stringify(v)}, got ${JSON.stringify(s[k])}`);
		}
		return s;
	};

	await snap('init');
	await game.eval(`(() => { scene.inventoryOpen = true; scene.refreshInventoryPanel(); return true; })()`);
	await sleep(400);
	await game.screenshot(`${shots}/equip3-00-bag.png`); // the open bag list (are entry names rendered?)

	await equipStep('w3', { weaponId: 'weaponReward', wLevel: 3, wSrc: 'Mace' });
	await game.screenshot(`${shots}/equip3-01-after-mace.png`);

	// the downgrade probe: Java says equipping the +0 dagger leaves level 0
	await equipStep('w0', { wSrc: 'Dagger' });
	const afterW0 = await snap('probe w0 level (Java 0)');
	if (afterW0.wLevel !== 0) say(`!! weapon downgrade probe FAILED: wLevel=${afterW0.wLevel}, Java expects 0`);

	await equipStep('a2', { armorId: 'armorReward', aLevel: 2 });
	await game.screenshot(`${shots}/equip3-02-after-mail.png`);

	await equipStep('a0', { aTier: 4 });
	const afterA0 = await snap('probe a0 level (Java 0)');
	if (afterA0.aLevel !== 0) say(`!! armor downgrade probe FAILED: aLevel=${afterA0.aLevel}, Java expects 0`);

	// swap back to the +3 mace (second bag weapon while another is equipped)
	await equipStep('w3', { weaponId: 'weaponReward', wLevel: 3, wSrc: 'Mace' });
	await game.screenshot(`${shots}/equip3-03-final.png`);

	const errs = game.consoleErrors();
	if (errs.length) throw new Error(`console errors: ${errs[0]}`);
	say('done - no console errors');
};
