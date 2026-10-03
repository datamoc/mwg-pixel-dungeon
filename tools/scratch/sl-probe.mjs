const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async (game) => {
	await game.startGame();
	const live = `(() => mwg.currentScene.groundItems.length)()`;
	console.log('live t0', await game.eval(live)); await sleep(6000); console.log('live t+6s (no load)', await game.eval(live));
	await game.eval('mwg.currentScene.saveRun()'); await sleep(300);
	const saved = await game.eval(`(() => { const k = Object.keys(localStorage).find((x) => /spd-mwg/.test(x) && /run/.test(x)); const j = JSON.parse(localStorage.getItem(k)); const st = j.state || j; const counts = []; const walk = (o, p) => { if (o && typeof o === 'object') { for (const [key, v] of Object.entries(o)) { if (/groundItems|items/.test(key) && Array.isArray(v)) counts.push(p + '.' + key + '=' + v.length); else walk(v, p + '.' + key); } } }; walk(st, 's'); return { keys: Object.keys(st).slice(0, 40), counts: counts.slice(0, 12), depth: st.depth }; })()`);
	console.log('saved', JSON.stringify(saved));
	console.log('live at save', await game.eval(live));
	await game.eval('mwg.currentScene.loadRun()'); await sleep(2500);
	console.log('live after load', await game.eval(live));
};
