// probe: does a slot tap open the detail, and what state follows?
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async function (game) {
	await game.startGame();
	for (let i = 0; i < 100; i++) { if (!(await game.findText('^Descente$|^Descending$'))) break; await sleep(100); }
	const opened = await game.eval(`(() => { scene.bag.add({ id: 'potionShielding', quantity: 1, stackable: true, identified: false }); scene.inventoryOpen = true; scene.refresh(); return { open: scene.inventoryOpen }; })()`);
	const state0 = await game.eval(`({ open: scene.inventoryOpen })`);
	await game.tap(0.6384, 0.4416);
	await sleep(500);
	const after = await game.eval(`({ open: scene.inventoryOpen })`);
	await game.screenshot('tools/scratch/browser-test/r112-probe-tap.png');
	console.log(JSON.stringify({ opened, state0, after }));
}
