const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async (game) => {
	await game.startGame(); await sleep(2000);
	await game.eval('mwg.currentScene.saveRun()'); await sleep(400);
	console.log(JSON.stringify(await game.eval(`(() => { const s = mwg.currentScene; const orig = s.spawnGroundItem.bind(s); const log = []; s.spawnGroundItem = (...a) => { const st = new Error().stack.split(String.fromCharCode(10)).slice(2, 6).map((l) => l.trim().replace(/^at /, '').slice(0, 70)); log.push({ kind: a[0], at: a[1] + ',' + a[2], st }); return orig(...a); }; const before = s.groundItems.length; s.loadRun(); globalThis.__spawnLog = log; return { before, after: s.groundItems.length, spawns: log.length }; })()`)));
	await sleep(3000);
	console.log(JSON.stringify(await game.eval(`(() => { const by = {}; for (const e of globalThis.__spawnLog) { const k = e.st[0] + ' <- ' + (e.st[1] || ''); (by[k] = by[k] || []).push(e.kind + '@' + e.at); } return { total: globalThis.__spawnLog.length, callers: Object.entries(by).map(([k, v]) => k + ' x' + v.length + ' ' + v.slice(0, 4).join(',')), now: mwg.currentScene.groundItems.length }; })()`)));
};
