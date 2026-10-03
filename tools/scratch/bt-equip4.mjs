// Root-cause the equip level drop: does bag.find return level, does bag.remove mutate it?
// node tools/browserTest.mjs --script tools/scratch/bt-equip4.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async (game) => {
	const say = (m) => console.log(`[${game.browser}] ${m}`);
	const shots = 'tools/scratch/browser-test';

	await game.startGame();
	await game.waitFor('scene && scene.awaitingInput === true', { timeout: 20000 });

	const inj = await game.eval(`(() => {
		const add = (cat, cls, level) => {
			const item = scene.generatedInventoryItem({ cat, cls, cursed: false, level, quantity: 1, hasGoodEnchant: false });
			item.identified = true;
			scene.bag.add(item);
			return item;
		};
		window.__EQ__ = { w3: add(3, 'Mace', 3), w0: add(1, 'Dagger', 0), a2: add(6, 'MailArmor', 2), a0: add(6, 'ScaleArmor', 0), probe: add(1, 'Gloves', 5) };
		return Object.fromEntries(Object.entries(window.__EQ__).map(([k, v]) => [k, v.instanceId]));
	})()`);
	say(`injected: ${JSON.stringify(inj)}`);

	// --- probe 1: what does bag.find return vs the raw bag entry?
	const findProbe = await game.eval(`(() => {
		const inst = window.__EQ__.w3.instanceId;
		const raw = scene.bag.items.find(i => i.instanceId === inst);
		const f = scene.bag.find('weaponReward', inst);
		return {
			sameObject: f === raw,
			fLevel: f?.level, rawLevel: raw?.level,
			fIdentified: f?.identified, rawIdentified: raw?.identified,
			fKeys: Object.keys(f ?? {}), rawKeys: Object.keys(raw ?? {}),
		};
	})()`);
	say(`find-probe: ${JSON.stringify(findProbe)}`);

	// --- probe 2: does bag.remove mutate a kept reference? (throwaway +5 Gloves)
	const removeProbe = await game.eval(`(() => {
		const inst = window.__EQ__.probe.instanceId;
		const raw = scene.bag.items.find(i => i.instanceId === inst);
		const before = { level: raw.level, qty: raw.quantity, identified: raw.identified };
		const kept = raw;
		scene.bag.remove('weaponReward', 1, inst);
		const afterRaw = scene.bag.items.find(i => i.instanceId === inst) ?? null;
		return { before, keptAfter: { level: kept.level, qty: kept.quantity }, stillInBag: !!afterRaw, keptIsRaw: kept === raw };
	})()`);
	say(`remove-probe: ${JSON.stringify(removeProbe)}`);

	const snap = async (label) => {
		const s = await game.eval(`(() => ({
			weaponId: scene.weaponId, wLevel: scene.weaponLevel, wIdentified: scene.weaponIdentified ?? null, wSrc: scene.weaponSourceClass ?? null,
			armorId: scene.armorId, aLevel: scene.armorLevel, aIdentified: scene.armorIdentified ?? null,
			gearInBag: scene.bag.items.filter(i => /^(weaponReward|armorReward)$/.test(i.id)).map(i => [i.sourceClass, i.level, i.instanceId]),
			awaiting: scene.awaitingInput,
		}))()`);
		say(`${label}: ${JSON.stringify(s)}`);
		return s;
	};

	/** Open bag, inspect the entry, click ÉQUIPER at the detail card's real button bounds. */
	const equipStep = async (key) => {
		await game.eval(`(() => { scene.inventoryOpen = true; scene.refreshInventoryPanel(); const e = (scene.inventoryPanel['carried'] ?? []).find(x => x.instanceId === window.__EQ__.${key}.instanceId); if (!e) return 'missing'; scene.inventoryPanel['inspect'](e); return true; })()`);
		await sleep(350);
		const click = await game.eval(`(() => {
			const detail = scene.inventoryPanel['detail'];
			let label = null;
			const walk = (n) => { if (label) return; if (n.text !== undefined && /^équip/i.test(String(n.text))) label = n; for (const c of (n.children || [])) walk(c); };
			walk(detail);
			if (!label) return 'no-label';
			const btn = label.parent, b = btn.getBounds();
			const screen = window.__MWG__.app.renderer.screen;
			const fx = (b.x + b.width / 2) / screen.width, fy = (b.y + b.height / 2) / screen.height;
			const c = document.querySelector('canvas'), r = c.getBoundingClientRect();
			const o = { clientX: r.left + fx * r.width, clientY: r.top + fy * r.height, bubbles: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
			for (const t of ['pointermove', 'pointerdown', 'pointerup', 'click']) c.dispatchEvent(new PointerEvent(t, o));
			return String(label.text);
		})()`);
		await sleep(600);
		return click;
	};

	await snap('init');
	say(`w3 click -> ${JSON.stringify(await equipStep('w3'))}`);
	await snap('after equip Mace+3 (Java: wLevel 3)');
	await game.screenshot(`${shots}/equip4-01-mace-equipped.png`);

	say(`w0 click -> ${JSON.stringify(await equipStep('w0'))}`);
	await snap('after equip Dagger+0 over Mace (mace back in bag: Java says +3)');

	say(`a2 click -> ${JSON.stringify(await equipStep('a2'))}`);
	await snap('after equip Mail+2 (Java: aLevel 2)');
	await game.screenshot(`${shots}/equip4-02-mail-equipped.png`);

	say(`a0 click -> ${JSON.stringify(await equipStep('a0'))}`);
	await snap('after equip Scale+0 over Mail (mail back in bag: Java says +2)');

	say(`w3 click again -> ${JSON.stringify(await equipStep('w3'))}`);
	await snap('after re-equip Mace (was it destroyed to +0?)');
	await game.screenshot(`${shots}/equip4-03-final.png`);

	const errs = game.consoleErrors();
	if (errs.length) say(`console errors: ${JSON.stringify(errs.slice(0, 3))}`);
	else say('no console errors');
};
