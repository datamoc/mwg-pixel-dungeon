// R112 live verification: run-wide potion class knowledge.
// 1. pre-quaff display: appearance names, exotic shares the regular appearance, classes unknown
// 2. quaff the kit's healing potion -> class marked; the projection shows real names for the
//    class while instance flags stay untouched (unidentified shielding instance keeps flag false)
// 3. a thrown flask's visible shatter marks its class without any quaff (dropThrowScene path)
// 4. saveRun writes potionKindsKnown into the run envelope
// 5. loadRun re-applies the envelope's class set (observed as a projection flip)
import assert from 'node:assert/strict';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function (game) {
	const settled = async () => {
		for (let i = 0; i < 100; i++) {
			if (!(await game.findText('^Descente$|^Descending$'))) return;
			await sleep(100);
		}
		throw new Error('Interlevel curtain did not finish');
	};
	await game.startGame();
	await settled();

	// ---- 1. pre-quaff display state (no potion class is known yet)
	const before = await game.eval(`(() => {
		scene.bag.add({ id: 'potionShielding', quantity: 1, stackable: true, identified: false });
		scene.bag.add({ id: 'potionStrength', quantity: 1, stackable: true, identified: false });
		return {
			healingUnknown: scene.itemDisplayName('potionHealing', false),
			healingReal: scene.itemDisplayName('potionHealing', true),
			strengthUnknown: scene.itemDisplayName('potionStrength', false),
			strengthReal: scene.itemDisplayName('potionStrength', true),
			shieldingUnknown: scene.itemDisplayName('potionShielding', false),
			shieldingReal: scene.itemDisplayName('potionShielding', true),
			shieldingFlag: scene.bag.find('potionShielding')?.identified ?? null,
			kitHealing: (() => { const h = scene.bag.find('potionHealing'); return h ? { q: h.quantity } : null; })(),
		};
	})()`);
	assert.ok(before.kitHealing, 'the kit carries a healing potion to quaff');
	assert.notEqual(before.healingUnknown, before.healingReal, 'unidentified shows the appearance name');
	assert.equal(before.shieldingUnknown, before.healingUnknown, 'the exotic shares its regular counterpart appearance');
	assert.notEqual(before.shieldingReal, before.healingReal, 'the exotic has its own real name');
	assert.equal(before.shieldingFlag, false, 'the shielding instance starts unidentified');

	// ---- 2. quaff the kit's healing potion
	const quaffed = await game.eval(`(() => {
		scene.requestedItemId = 'potionHealing';
		const used = scene.quaffPotion();
		return {
			used,
			left: scene.bag.find('potionHealing')?.quantity ?? 0,
			healingNow: scene.itemDisplayName('potionHealing', false),
			strengthStill: scene.itemDisplayName('potionStrength', false),
			shieldingNow: scene.itemDisplayName('potionShielding', false),
			shieldingFlag: scene.bag.find('potionShielding')?.identified ?? null,
		};
	})()`);
	assert.equal(quaffed.used, true, 'the quaff goes through');
	assert.equal(quaffed.left, 0, 'the stack was consumed');
	assert.equal(quaffed.healingNow, before.healingReal, 'a class-known potion now reads by its real name');
	assert.equal(quaffed.strengthStill, before.strengthUnknown, 'other classes stay unknown');
	assert.equal(quaffed.shieldingNow, before.shieldingReal, 'the exotic sibling shares the learned class knowledge');
	assert.equal(quaffed.shieldingFlag, false, 'the unidentified instance flag is untouched - projection, not mutation');

	// visual evidence: bag open, purple = `identified === false` instance slots
	await game.eval(`scene.inventoryOpen = true; scene.refresh();`);
	await game.screenshot('tools/scratch/browser-test/r112-bag-final.png');
	// open the detail card on the shielding entry through the window's own showItem,
	// so the label the player reads is the projection, not a hand-built string
	const detail = await game.eval(`(() => {
		const w = scene.inventoryPanel;
		const entry = (w['carried'] || []).find((e) => e && e.id === 'potionShielding');
		if (!entry) return { found: false };
		w['showItem'](entry);
		return { found: true, name: entry.name };
	})()`);
	assert.equal(detail.found, true, 'the shielding entry is in the bag view');
	assert.equal(detail.name, before.shieldingReal, 'the bag entry itself is labelled by the projected real name');
	await sleep(400);
	await game.screenshot('tools/scratch/browser-test/r112-detail-final.png');
	await game.eval(`scene.inventoryOpen = false; scene.refresh();`);

	// ---- 3. thrown flask: a visible shatter marks its class (no quaff path involved)
	const shattered = await game.eval(`(() => {
		scene.shatterThrownPotion('potionFrost', { x: scene.hero.x, y: scene.hero.y });
		return { frostNow: scene.itemDisplayName('potionFrost', false), frostReal: scene.itemDisplayName('potionFrost', true) };
	})()`);
	assert.equal(shattered.frostNow, shattered.frostReal, 'a heroFOV-visible shatter identifies its class (dropThrowScene path)');

	// ---- 4. save: the envelope carries the class set
	await game.eval(`scene.saveRun()`);
	const saved = await game.eval(`(() => {
		const key = Object.keys(localStorage).find((k) => k.endsWith(':run'));
		const env = JSON.parse(localStorage.getItem(key));
		return { key: key ?? null, known: env.state?.potionKindsKnown ?? null };
	})()`);
	assert.ok(saved.key, 'a run envelope exists');
	assert.ok(Array.isArray(saved.known) && saved.known.includes('potionHealing') && saved.known.includes('potionFrost'),
		`envelope carries the class set: ${JSON.stringify(saved.known)}`);
	assert.ok(!saved.known.includes('potionStrength'), 'unlearned classes are absent');

	// ---- 5. load: seed one more class into the stored envelope, then loadRun applies it
	const reloaded = await game.eval(`(() => {
		const key = Object.keys(localStorage).find((k) => k.endsWith(':run'));
		const env = JSON.parse(localStorage.getItem(key));
		env.state.potionKindsKnown = [...(env.state.potionKindsKnown ?? []), 'potionStrength'];
		localStorage.setItem(key, JSON.stringify(env));
		const beforeLoad = scene.itemDisplayName('potionStrength', false);
		scene.loadRun();
		return {
			beforeLoad,
			afterLoad: scene.itemDisplayName('potionStrength', false),
			strengthReal: scene.itemDisplayName('potionStrength', true),
			healingAfter: scene.itemDisplayName('potionHealing', false),
			heroAlive: !!scene.hero && scene.hero.hp > 0,
		};
	})()`);
	assert.equal(reloaded.beforeLoad, before.strengthUnknown, 'the live set does not know potionStrength yet');
	assert.equal(reloaded.afterLoad, reloaded.strengthReal, 'loadRun re-applies the saved class set (projection flips)');
	assert.equal(reloaded.healingAfter, before.healingReal, 'the other learned class survives the load');
	assert.equal(reloaded.heroAlive, true, 'the scene is still alive after load');

	const errors = game.consoleErrors();
	assert.deepEqual(errors, [], `no console errors: ${errors.slice(0, 3).join(' | ')}`);
	console.log('R112 live: quaff projection, exotic sharing, visible shatter mark, save write, load re-apply all verified');
}
