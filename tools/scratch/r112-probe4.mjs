// probe4: what happens around showItem?
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async function (game) {
	await game.startGame();
	for (let i = 0; i < 100; i++) { if (!(await game.findText('^Descente$|^Descending$'))) break; await sleep(100); }
	const state = async (label) => {
		const s = await game.eval(`(() => {
			const sc = window.__MWG__ && window.__MWG__.currentScene;
			return { type: sc ? sc.constructor.name : null, hero: !!(sc && sc.hero), open: sc ? !!sc.inventoryOpen : null,
				detailVisible: sc && sc.inventoryPanel ? !!sc.inventoryPanel['detail']?.visible : null };
		})()`);
		console.log(label, JSON.stringify(s), 'errors:', game.consoleErrors().length);
	};
	await state('before-open');
	await game.eval(`scene.bag.add({ id: 'potionShielding', quantity: 1, stackable: true, identified: false }); scene.inventoryOpen = true; scene.refresh();`);
	await state('bag-open');
	const detail = await game.eval(`(() => {
		const w = scene.inventoryPanel;
		const entry = (w['carried'] || []).find((e) => e && e.id === 'potionShielding');
		if (!entry) return { found: false };
		w['showItem'](entry);
		return { found: true, name: entry.name };
	})()`);
	console.log('detail:', JSON.stringify(detail));
	await state('after-showItem');
	await sleep(600);
	await state('after-sleep');
	await game.screenshot('tools/scratch/browser-test/r112-probe4.png');
	await state('after-shot');
}
