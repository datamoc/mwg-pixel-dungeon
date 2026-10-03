// Equipment management check: equip a weapon and an armor through the real inventory UI.
// node tools/browserTest.mjs --script tools/scratch/bt-equip.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default async (game) => {
	const say = (m) => console.log(`[${game.browser}] ${m}`);
	const shots = 'tools/scratch/browser-test';

	await game.startGame();

	const snap = async (label) => {
		const s = await game.eval(`(() => ({
			weaponId: scene.weaponId, wLevel: scene.weaponLevel, wTier: scene.weaponTier,
			wSrc: scene.weaponSourceClass ?? null, wInst: scene.weaponInstanceId ?? null,
			armorId: scene.armorId, aLevel: scene.armorLevel, aTier: scene.armorTier, aInst: scene.armorInstanceId ?? null,
			bag: scene.bag.items.map(i => [i.id, i.level ?? 0, i.quantity, i.instanceId ?? '-', i.sourceClass ?? '-']),
			awaiting: scene.awaitingInput, actionSpentTurn: scene.actionSpentTurn ?? null,
			turnKeys: Object.keys(scene).filter(k => /turn/i.test(k) && typeof scene[k] !== 'function').map(k => [k, scene[k]]),
		}))()`);
		say(`${label}: ${JSON.stringify(s)}`);
		return s;
	};

	const init = await snap('init');

	// Inject through the real generation path. Cat: 3 = WEP_T3, 1 = WEP_T1, 6 = ARMOR.
	const inj = await game.eval(`(() => {
		const add = (cat, cls, level) => {
			const item = scene.generatedInventoryItem({ cat, cls, cursed: false, level, quantity: 1, hasGoodEnchant: false });
			item.identified = true;
			scene.bag.add(item);
			return item;
		};
		window.__EQ__ = { w3: add(3, 'Mace', 3), w0: add(1, 'Dagger', 0), a2: add(6, 'MailArmor', 2), a0: add(6, 'ScaleArmor', 0) };
		const nm = (i) => scene.itemDisplayName(i.id, true, i.instanceId);
		return {
			w3: { name: nm(window.__EQ__.w3), inst: window.__EQ__.w3.instanceId ?? null, lvl: window.__EQ__.w3.level, tier: window.__EQ__.w3.tier },
			w0: { name: nm(window.__EQ__.w0), inst: window.__EQ__.w0.instanceId ?? null, lvl: window.__EQ__.w0.level, tier: window.__EQ__.w0.tier },
			a2: { name: nm(window.__EQ__.a2), inst: window.__EQ__.a2.instanceId ?? null, lvl: window.__EQ__.a2.level, tier: window.__EQ__.a2.tier },
			a0: { name: nm(window.__EQ__.a0), inst: window.__EQ__.a0.instanceId ?? null, lvl: window.__EQ__.a0.level, tier: window.__EQ__.a0.tier },
			bagLen: scene.bag.items.length,
		};
	})()`);
	say(`injected: ${JSON.stringify(inj)}`);

	const reopen = () => game.eval(`(() => { scene.inventoryOpen = true; scene.refreshInventoryPanel(); return scene.inventoryOpen; })()`);

	/** Opens the bag, taps the entry by name (falls back to programmatic inspect), taps EQUIP. */
	const equipViaUi = async (key, name) => {
		await reopen();
		await sleep(400);
		let how = 'tap-name';
		const hit = await game.findText(escapeRe(name)).catch(() => null);
		if (hit) {
			await game.tapText(escapeRe(name), { timeout: 8000 });
		} else {
			how = 'programmatic-inspect';
			const ok = await game.eval(`(() => {
				const carried = scene.inventoryPanel['carried'] ?? [];
				const entry = carried.find(e => e.instanceId === window.__EQ__.${key}.instanceId);
				if (!entry) return 'missing-from-carried';
				scene.inventoryPanel['inspect'](entry);
				return true;
			})()`);
			say(`  name not rendered for ${key} (${name}); inspect fallback -> ${JSON.stringify(ok)}`);
			if (ok !== true) return { key, how, opened: String(ok) };
		}
		await sleep(400);
		const card = await game.findText('quip').catch(() => null);
		await game.screenshot(`${shots}/equip-card-${key}.png`);
		if (!card) return { key, how, opened: 'no-equip-button' };
		say(`  detail card for ${key}: action label = "${card.text}"`);
		await game.tap(card.fx, card.fy);
		await sleep(700);
		return { key, how, opened: 'equipped', action: card.text };
	};

	const results = [];
	// 1) weapon: +3 Mace over the starting weapon
	results.push(await equipViaUi('w3', inj.w3.name));
	await snap('after equip w3 (Mace +3)');

	// 2) weapon: +0 Dagger over +3 Mace - Java says level must become 0
	results.push(await equipViaUi('w0', inj.w0.name));
	const afterW0 = await snap('after equip w0 (Dagger +0) - Java expects wLevel 0');

	// 3) armor: +2 Mail over the starting armor
	results.push(await equipViaUi('a2', inj.a2.name));
	await snap('after equip a2 (Mail +2)');

	// 4) armor: +0 Scale over +2 Mail - Java says level must become 0
	results.push(await equipViaUi('a0', inj.a0.name));
	const afterA0 = await snap('after equip a0 (Scale +0) - Java expects aLevel 0');

	await game.screenshot(`${shots}/equip-final.png`);

	say(`RESULTS weapon-downgrade probe: wLevel=${afterW0.wLevel} (Java 0); armor-downgrade probe: aLevel=${afterA0.aLevel} (Java 0)`);
	say(`UI steps: ${JSON.stringify(results)}`);

	const errs = game.consoleErrors();
	if (errs.length) throw new Error(`console errors: ${errs[0]}`);
	say('no console errors');
};
