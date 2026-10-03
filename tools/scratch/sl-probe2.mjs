const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async (game) => {
	await game.startGame();
	await sleep(2000);
	const live = `(() => mwg.currentScene.groundItems.length)()`;
	const n0 = await game.eval(live);
	await game.eval('mwg.currentScene.saveRun()'); await sleep(500);
	const stored = await game.eval(`(() => { const o = {}; for (const k of Object.keys(localStorage)) o[k] = localStorage.getItem(k); return o; })()`);
	console.log('live at save', n0);
	await game.eval('location.reload()').catch(() => {}); await sleep(4000);
	await game.eval(`(() => { const o = ${JSON.stringify(stored)}; for (const k of Object.keys(o)) localStorage.setItem(k, o[k]); return 1; })()`).catch((e) => console.log('restore ls', e.message));
	await game.eval('location.reload()').catch(() => {}); await sleep(5000);
	await game.waitFor('!!(window.__MWG__ && __MWG__.currentScene)', { timeout: 60000 }).catch(() => {});
	await sleep(3000);
	await game.screenshot('tools/scratch/sl-title.png');
	const texts = await game.eval(`(() => { const out = []; const walk = (n, d) => { if (d > 12) return; if (n.text !== undefined && n.visible !== false && String(n.text).trim()) out.push(String(n.text).slice(0, 30)); for (const c of (n.children || [])) walk(c, d + 1); }; walk(mwg.app.stage, 0); return out.slice(0, 14); })()`);
	console.log('title texts', JSON.stringify(texts));
};
