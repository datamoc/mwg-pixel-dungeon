export default async (game) => {
	await game.startGame?.('warrior');
	const r = await game.eval(`(() => { const s = window.__MWG__.currentScene; const d0 = s['depth'];
	let n = 0; while (s['depth'] === d0 && n < 3000) { s['castCursedWandVeryRareEffect']({x:s['hero'].x,y:s['hero'].y}); n++; if (s['superNova']) s['superNova'] = null; s['gravityChaos'] = null; }
	return { d0, d1: s['depth'], casts: n, hp: s['hero'].hp }; })()`);
	console.log(JSON.stringify(r));
	console.log('errors', JSON.stringify(await game.consoleErrors()));
};
