#!/usr/bin/env node
/**
 * Equipment swap check (the "can we manage the equipment" live test), run in a real browser:
 *
 *   npm run build && node tools/verifyEquipment.mjs [--browser chrome|firefox|both]
 *
 * Injects identified gear through `scene.generatedInventoryItem` and drives the bag's Equip
 * button through the real UI, asserting the 2026-09-29 fix set end to end:
 *   1. the slot takes the item's own level (a +3 swap-in, and a +0 downgrade that the old
 *      `Math.max(old, item.level)`/`Math.min(5, ...)` slots used to refuse or clamp);
 *   2. `weaponSourceClass`/`armorSourceClass` track the worn piece, so the swap-out copy keeps
 *      its class in the bag, the equipped minted armor names its class, and a re-equip shows
 *      the right class (not the previous weapon's);
 *   3. the scene no longer throws mid-equip (`weaponCursedKnown`/`armorCursedKnown` were
 *      getter-only on the equip context) - checked implicitly by every swap completing with
 *      no console errors and the equip message/level state landing;
 *   4. the curse gate refuses a swap with no state change and no turn spent;
 *   5. each weapon/armor swap spends exactly 2 turns (`EquipableItem.timeToEquip` = 1f on
 *      both the unequip and the equip side, tag `v3.3.8`), refusal spends 0;
 *   6. swapping away the worn cloth armor returns it to the bag (Java's `doUnequip` with
 *      `collect=true`) and the returned cloth armor can be re-worn from there;
 *   7. a second `armorReward` is reachable while one is equipped (the bag filter is
 *      per-instance, not per-id).
 *
 * Evidence for the coverage row in coverage/rows-items-equipment-and-artifacts.md.
 */
import { openGame } from './browserTest.mjs';

const browsers = (() => { const i = process.argv.indexOf('--browser'); const v = i >= 0 ? process.argv[i + 1] : 'chrome'; return v === 'both' ? ['chrome', 'firefox'] : [v]; })();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failed = 0;
const check = (b, name, ok, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} [${b}] ${name}${detail ? ` - ${detail}` : ''}`); };

for (const browser of browsers) {
	let game;
	try {
		game = await openGame({ browser, height: 900 });
		await game.startGame();
		await game.waitFor('scene && scene.awaitingInput === true', { timeout: 20000 });
		const say = (m) => console.log(`[${browser}] ${m}`);

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

		/** Open bag, inspect the entry, click Equip at the detail card's real button bounds. */
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

		// 1. Equip Mace+3 over the starting weapon: level 3, class tracked, 2 turns.
		let s = await snap('init');
		check(browser, 'init has cloth dual-state + injected gear', s.bagGear.some(r => r[0] === 'clothArmor') && s.bagGear.length === 5, JSON.stringify(s.bagGear));
		say(`w3 click -> ${JSON.stringify(await equipStep('w3'))}`);
		s = await snap('after Mace+3 (want wLevel 3, wSrc Mace, spends [2])');
		check(browser, 'mace level carried', s.wLevel === 3, String(s.wLevel));
		check(browser, 'weaponSourceClass set on equip', s.wSrc === 'Mace', String(s.wSrc));
		check(browser, 'weapon swap cost 2 turns', s.spends.length === 1 && s.spends[0] === 2, JSON.stringify(s.spends));
		check(browser, 'still accepting input', s.awaiting === true, String(s.awaiting));

		// 2. Cursed outgoing weapon refuses: no state change, no turn spent.
		await game.eval(`(() => { scene.weaponCursed = true; scene.weaponCursedKnown = true; })()`);
		say(`w0 click while cursed (refuse) -> ${JSON.stringify(await equipStep('w0'))}`);
		s = await snap('after refused swap (want weaponId unchanged, spends [])');
		check(browser, 'cursed gate refuses without spending', s.weaponId !== 'startingWeapon' && s.wLevel === 3 && s.spends.length === 0, JSON.stringify({ weaponId: s.weaponId, wLevel: s.wLevel, spends: s.spends }));
		await game.eval(`(() => { scene.weaponCursed = false; scene.weaponCursedKnown = false; })()`);

		// 3. Equip Dagger+0 over Mace+3: downgrade allowed, mace returns to bag with class+level.
		say(`w0 click -> ${JSON.stringify(await equipStep('w0'))}`);
		s = await snap('after Dagger+0 over Mace (want wLevel 0, mace in bag [Mace,3])');
		check(browser, 'weapon downgrade allowed', s.wLevel === 0, String(s.wLevel));
		check(browser, 'swapped-out mace keeps sourceClass+level', s.bagGear.some(r => r[0] === 'weaponReward' && r[1] === 'Mace' && r[2] === 3), JSON.stringify(s.bagGear));
		check(browser, 'weapon swap cost 2 turns', s.spends.length === 1 && s.spends[0] === 2, JSON.stringify(s.spends));
		const maceBack = await game.eval(`scene.itemDisplayName('weaponReward', true, window.__EQ__.w3.instanceId)`);
		check(browser, 'swapped-out mace keeps its real name', maceBack === names.maceBag, JSON.stringify({ bag: maceBack, was: names.maceBag }));

		// 4. Equip Mail+2 over cloth armor: cloth returns to bag (was destroyed pre-fix).
		say(`a2 click -> ${JSON.stringify(await equipStep('a2'))}`);
		s = await snap('after Mail+2 over cloth (want aLevel 2, aSrc MailArmor, cloth in bag, spends [2])');
		check(browser, 'armor level carried', s.aLevel === 2, String(s.aLevel));
		check(browser, 'armorSourceClass set on equip', s.aSrc === 'MailArmor', String(s.aSrc));
		check(browser, 'cloth armor returned to bag on swap', s.bagGear.some(r => r[0] === 'clothArmor'), JSON.stringify(s.bagGear));
		check(browser, 'armor swap cost 2 turns', s.spends.length === 1 && s.spends[0] === 2, JSON.stringify(s.spends));
		const mailEq = await game.eval(`scene.itemDisplayName('armorReward', true, scene.armorInstanceId)`);
		check(browser, 'equipped armorReward names its class', mailEq === names.mailBag, JSON.stringify({ equipped: mailEq, bagWas: names.mailBag }));

		// 5. Equip Scale+0 over Mail+2: second armorReward reachable (was hidden), downgrade.
		say(`a0 click -> ${JSON.stringify(await equipStep('a0'))}`);
		s = await snap('after Scale+0 over Mail (want aLevel 0, mail back [MailArmor,2], spends [2])');
		check(browser, 'second armorReward reachable', s.armorId === 'armorReward' && s.aLevel === 0, JSON.stringify({ armorId: s.armorId, aLevel: s.aLevel }));
		check(browser, 'swapped-out mail keeps sourceClass+level', s.bagGear.some(r => r[0] === 'armorReward' && r[1] === 'MailArmor' && r[2] === 2), JSON.stringify(s.bagGear));
		check(browser, 'armor swap cost 2 turns', s.spends.length === 1 && s.spends[0] === 2, JSON.stringify(s.spends));

		// 6. Re-equip the mace: class must follow it back (was stale 'Dagger' pre-fix).
		say(`w3 click again -> ${JSON.stringify(await equipStep('w3'))}`);
		s = await snap('after re-equip Mace (want wLevel 3, wSrc Mace)');
		check(browser, 're-equip restores class+level', s.wLevel === 3 && s.wSrc === 'Mace', JSON.stringify({ wLevel: s.wLevel, wSrc: s.wSrc }));

		// 7. Re-wear the returned cloth armor (no Equip action row pre-fix).
		await game.eval(`(() => {
			const c = scene.bag.items.find(i => i.id === 'clothArmor');
			window.__EQ__.cloth = { instanceId: c.instanceId };
		})()`);
		say(`cloth click -> ${JSON.stringify(await equipStep('cloth'))}`);
		s = await snap('after re-wear cloth (want armorId clothArmor, spends [2])');
		check(browser, 'cloth armor re-wearable from bag', s.armorId === 'clothArmor', String(s.armorId));
		check(browser, 'armor swap cost 2 turns', s.spends.length === 1 && s.spends[0] === 2, JSON.stringify(s.spends));

		await game.screenshot('tools/scratch/browser-test/equip-final.png');
		check(browser, 'no console errors', game.consoleErrors().filter((e) => !/Failed to load resource/.test(e)).length === 0, game.consoleErrors().slice(0, 2).join(' | '));
	} catch (e) {
		check(browser, 'harness', false, e.stack ?? String(e));
	} finally {
		await game?.close();
	}
}
console.log(failed === 0 ? 'EQUIPMENT OK' : `EQUIPMENT FAILED (${failed})`);
process.exit(failed === 0 ? 0 : 1);
