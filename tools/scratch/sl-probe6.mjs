const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async (game) => {
	await game.startGame(); await sleep(2000);
	const fallen = `(() => { const k = Object.keys(localStorage).find((x) => /spd-mwg/.test(x) && /run/.test(x)); const j = JSON.parse(localStorage.getItem(k)); return JSON.stringify((j.state.fallenItems || []).map(([d, e]) => d + ':' + e.length + ':' + e.map((x) => x.kind).join('|'))); })()`;
	for (let i = 0; i <= 4; i++) {
		await game.eval('mwg.currentScene.saveRun()'); await sleep(300);
		console.log('save', i, await game.eval(fallen));
		await game.eval('mwg.currentScene.loadRun()'); await sleep(2500);
	}
	process.exit(0);
};
