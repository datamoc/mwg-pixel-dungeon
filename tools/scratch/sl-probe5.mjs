const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async (game) => {
	await game.startGame(); await sleep(2000);
	await game.eval('mwg.currentScene.saveRun()'); await sleep(300);
	const grab = `(() => { const k = Object.keys(localStorage).find((x) => /spd-mwg/.test(x) && /run/.test(x)); return localStorage.getItem(k); })()`;
	const p1 = await game.eval(grab);
	await game.eval('mwg.currentScene.loadRun()'); await sleep(2500);
	await game.eval('mwg.currentScene.saveRun()'); await sleep(300);
	const p2 = await game.eval(grab);
	const diffs = [];
	const walk = (a, b, path) => {
		if (JSON.stringify(a) === JSON.stringify(b)) return;
		if (a && b && typeof a === 'object' && typeof b === 'object') {
			for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[k], b[k], path + '.' + k);
		} else diffs.push(path + ': ' + JSON.stringify(a)?.slice(0, 60) + ' -> ' + JSON.stringify(b)?.slice(0, 60));
	};
	walk(JSON.parse(p1), JSON.parse(p2), 'save');
	console.log(diffs.length, 'differing leaves');
	for (const d of diffs.slice(0, 25)) console.log(' ', d);
};
