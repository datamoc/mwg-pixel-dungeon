// probe2: how does an existing run save affect boot?
// run A: fresh game, mark a fingerprint, saveRun, report.
// run B (next invocation): inspect boot state before any tap.
import assert from 'node:assert/strict';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function (game, phase) {
	await game.startGame();
	for (let i = 0; i < 100; i++) { if (!(await game.findText('^Descente$|^Descending$'))) break; await sleep(100); }
	const saved = await game.eval(`(() => {
		scene.runSeed = scene.runSeed;
		scene.bag.add({ id: 'potionStrength', quantity: 1, stackable: true, identified: false });
		scene.requestedItemId = 'potionHealing';
		scene.quaffPotion();
		scene.saveRun();
		return { seed: scene.runSeed, depth: scene.depth, bag: scene.bag.items.map(i => i.id + ':' + i.quantity),
			saveKeys: Object.keys(localStorage).filter(k => k.includes('run')) };
	})()`);
	console.log('RUN-A saved:', JSON.stringify(saved));
	assert.ok(saved.saveKeys.length > 0, 'a run save exists now');
}
