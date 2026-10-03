export default async (game) => {
	await game.startGame();
	await new Promise(r => setTimeout(r, 3000));
	await game.eval(`(() => { const s = scene; const e = s.bag.items.filter(i => i.quantity > 0).slice(0, 5).map(i => ({ id: i.id, instanceId: i.instanceId, identified: i.identified, quantity: i.quantity })); s.openItemPicker('Choose', e, () => {}); return e.length; })()`);
	await new Promise(r => setTimeout(r, 800));
	await game.screenshot('tools/scratch/picker.png');
	console.log(game.consoleErrors());
};
