export default async (game) => {
	await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout: 90000 });
	await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 90000 });
	await new Promise(r => setTimeout(r, 2500));
	console.log(await game.eval(`(() => { scene.badges.increment('amulet', 1); return scene.badges.unlocked('victory'); })()`));
	await game.tap(0.94, 0.035); await new Promise(r => setTimeout(r, 900));
	await game.screenshot('tools/scratch/browser-test/chalwin-d.png');
	console.log('errors', JSON.stringify(game.consoleErrors()));
};
