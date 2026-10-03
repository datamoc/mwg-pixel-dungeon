const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async (game) => {
	await game.startGame(); await sleep(2000);
	const list = `(() => mwg.currentScene.groundItems.map((g) => [g.kind, g.x, g.y, g.item && g.item.id, g.item && g.item.quantity].join(':')))()`;
	const A = await game.eval(list);
	await game.eval(`(() => { const s = mwg.currentScene; s.depth = 2; s.enterLevel(); return 1; })()`); await sleep(4000);
	await game.eval(`(() => { const s = mwg.currentScene; s.depth = 1; s.enterLevel(); return 1; })()`); await sleep(4000);
	const B = await game.eval(list);
	const cnt = (arr) => arr.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {});
	const a = cnt(A), b = cnt(B);
	console.log('A', A.length, 'B', B.length);
	console.log('more in B:', JSON.stringify(Object.keys(b).filter((k) => (b[k] || 0) > (a[k] || 0)).map((k) => k + ' x' + b[k] + ' (was ' + (a[k] || 0) + ')')));
	console.log('less in B:', JSON.stringify(Object.keys(a).filter((k) => (a[k] || 0) > (b[k] || 0))));
	console.log('A sample', JSON.stringify(A.slice(0, 9)));
};
