// Post-fix verification of the equipment fix set (2026-09-29): cursedKnown setters,
// sourceClass on swapped-out gear + armorSourceClass, instance-based carried filter,
// item-level downgrades, cloth-armor return, equip turn costs (2, SwiftEquip 0).
// node tools/browserTest.mjs --script tools/scratch/bt-equip5.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (say, label, ok, detail) => {
	say(`${ok ? 'PASS' : 'FAIL'} ${label}${detail === undefined ? '' : ` -> ${JSON.stringify(detail)}`}`);
	if (!ok) failures++;
};

export default async (game) => {
	const say = (m) => console.log(`[${game.browser}] ${m}`);
	const shots = 'tools/scratch/browser-test';

	await game.startGame();
	await game.waitFor('scene && scene.awaitingInput === true', { timeout: 20000 });

	// Spy on the turn spend seam so every equip's cost is observable.
	await game.eval(`(() => {
		window.__SPEND__ = [];
		const orig = scene.spendHeroTurn.bind(scene);
		scene.spendHeroTurn = (cost = 1) => { window.__SPEND__.push(cost); return orig(cost); };
	})()`);

	const inj = await game.eval(`(() => {
		const add = (cat, cls, level) => {
			const item = scene.generatedInventoryItem({ cat, cls, cursed: false, level, quantity: 1, hasGoodEnchant: false });
			item.identified = true;
			scene.bag.add(item);
			return item;
		};
		window.__EQ__ = { w3: add(3, 'Mace', 3), w0: add(1, 'Dagger', 0), a2: add(6, 'MailArmor', 2), a0: add(6, 'ScaleArmor', 0) };
		return Object.fromEntries(Object.entries(window.__EQ__).map(([k, v]) => [k, { inst: v.instanceId, src: v.sourceClass ?? null, lvl: v.level, id: v.id }]));
	})()`);
	say(`injected: ${JSON.stringify(inj)}`);

	const snap = async (label) => {
		const s = await game.eval(`(() => ({
			weaponId: scene.weaponId, wLevel: scene.weaponLevel, wSrc: scene.weaponSourceClass ?? null,
			armorId: scene.armorId, aLevel: scene.armorLevel, aSrc: scene.armorSourceClass ?? null,
			bagGear: scene.bag.items.filter(i => /^(weaponReward|armorReward|clothArmor)$/.test(i.id)).map(i => [i.id, i.sourceClass ?? null, i.level ?? null]),
			spends: window.__SPEND__.splice(0),
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

	// Baseline names for the sourceClass-preservation equality checks (bag vs equipped).
	const names = await game.eval(`(() => ({
		mailBag: scene.itemDisplayName('armorReward', true, window.__EQ__.a2.instanceId),
		maceBag: scene.itemDisplayName('weaponReward', true, window.__EQ__.w3.instanceId),
	}))()`);
	say(`baseline names: ${JSON.stringify(names)}`);

	// --- 1. Equip Mace+3 over the starting weapon: level 3, class tracked, 2 turns.
	let s = await snap('init');
	check(say, 'init has cloth dual-state + injected gear', s.bagGear.some(r => r[0] === 'clothArmor') && s.bagGear.length === 5, s.bagGear);
	say(`w3 click -> ${JSON.stringify(await equipStep('w3'))}`);
	s = await snap('after Mace+3 (want wLevel 3, wSrc Mace, spends [2])');
	check(say, 'mace level carried', s.wLevel === 3, s.wLevel);
	check(say, 'weaponSourceClass set on equip', s.wSrc === 'Mace', s.wSrc);
	check(say, 'weapon swap cost 2 turns', s.spends.length === 1 && s.spends[0] === 2, s.spends);
	check(say, 'still accepting input', s.awaiting === true, s.awaiting);

	// --- 2. Cursed outgoing weapon refuses: no state change, no turn spent.
	await game.eval(`(() => { scene.weaponCursed = true; scene.weaponCursedKnown = true; })()`);
	say(`w0 click while cursed (refuse) -> ${JSON.stringify(await equipStep('w0'))}`);
	s = await snap('after refused swap (want weaponId unchanged, spends [])');
	check(say, 'cursed gate refuses without spending', s.weaponId !== 'startingWeapon' && s.wLevel === 3 && s.spends.length === 0, { weaponId: s.weaponId, wLevel: s.wLevel, spends: s.spends });
	await game.eval(`(() => { scene.weaponCursed = false; scene.weaponCursedKnown = false; })()`);

	// --- 3. Equip Dagger+0 over Mace+3: downgrade allowed, mace returns to bag with class+level.
	say(`w0 click -> ${JSON.stringify(await equipStep('w0'))}`);
	s = await snap('after Dagger+0 over Mace (want wLevel 0, mace in bag [Mace,3])');
	check(say, 'weapon downgrade allowed', s.wLevel === 0, s.wLevel);
	check(say, 'swapped-out mace keeps sourceClass+level', s.bagGear.some(r => r[0] === 'weaponReward' && r[1] === 'Mace' && r[2] === 3), s.bagGear);
	check(say, 'weapon swap cost 2 turns', s.spends.length === 1 && s.spends[0] === 2, s.spends);
	const maceBack = await game.eval(`scene.itemDisplayName('weaponReward', true, window.__EQ__.w3.instanceId)`);
	check(say, 'swapped-out mace keeps its real name', maceBack === names.maceBag, { bag: maceBack, was: names.maceBag });

	// --- 4. Equip Mail+2 over cloth armor: cloth returns to bag (was destroyed pre-fix).
	say(`a2 click -> ${JSON.stringify(await equipStep('a2'))}`);
	s = await snap('after Mail+2 over cloth (want aLevel 2, aSrc MailArmor, cloth in bag, spends [2])');
	check(say, 'armor level carried', s.aLevel === 2, s.aLevel);
	check(say, 'armorSourceClass set on equip', s.aSrc === 'MailArmor', s.aSrc);
	check(say, 'cloth armor returned to bag on swap', s.bagGear.some(r => r[0] === 'clothArmor'), s.bagGear);
	check(say, 'armor swap cost 2 turns', s.spends.length === 1 && s.spends[0] === 2, s.spends);
	const mailEq = await game.eval(`scene.itemDisplayName('armorReward', true, scene.armorInstanceId)`);
	check(say, 'equipped armorReward names its class', mailEq === names.mailBag, { equipped: mailEq, bagWas: names.mailBag });

	// --- 5. Equip Scale+0 over Mail+2: second armorReward reachable (was hidden), downgrade.
	say(`a0 click -> ${JSON.stringify(await equipStep('a0'))}`);
	s = await snap('after Scale+0 over Mail (want aLevel 0, mail back [MailArmor,2], spends [2])');
	check(say, 'second armorReward reachable', s.armorId === 'armorReward' && s.aLevel === 0, { armorId: s.armorId, aLevel: s.aLevel });
	check(say, 'swapped-out mail keeps sourceClass+level', s.bagGear.some(r => r[0] === 'armorReward' && r[1] === 'MailArmor' && r[2] === 2), s.bagGear);
	check(say, 'armor swap cost 2 turns', s.spends.length === 1 && s.spends[0] === 2, s.spends);

	// --- 6. Re-equip the mace: class must follow it back (was stale 'Dagger' pre-fix).
	say(`w3 click again -> ${JSON.stringify(await equipStep('w3'))}`);
	s = await snap('after re-equip Mace (want wLevel 3, wSrc Mace)');
	check(say, 're-equip restores class+level', s.wLevel === 3 && s.wSrc === 'Mace', { wLevel: s.wLevel, wSrc: s.wSrc });

	// --- 7. Re-wear the returned cloth armor (no AC_EQUIP row pre-fix).
	await game.eval(`(() => {
		const c = scene.bag.items.find(i => i.id === 'clothArmor');
		window.__EQ__.cloth = { instanceId: c.instanceId };
	})()`);
	say(`cloth click -> ${JSON.stringify(await equipStep('cloth'))}`);
	s = await snap('after re-wear cloth (want armorId clothArmor, spends [2])');
	check(say, 'cloth armor re-wearable from bag', s.armorId === 'clothArmor', s.armorId);
	check(say, 'armor swap cost 2 turns', s.spends.length === 1 && s.spends[0] === 2, s.spends);

	await game.screenshot(`${shots}/equip5-final.png`);

	const errs = game.consoleErrors();
	if (errs.length) { say(`console errors: ${JSON.stringify(errs.slice(0, 5))}`); failures++; }
	else say('no console errors');
	say(failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`);
};
