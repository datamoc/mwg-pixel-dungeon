export default async (game) => {
	try { await game.startGame('warrior'); } catch (e) { console.log('START FAIL'); }
	console.log(JSON.stringify(await game.consoleErrors()).slice(0, 2500));
};
