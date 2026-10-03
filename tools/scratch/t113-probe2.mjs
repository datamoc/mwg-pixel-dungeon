const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async (game) => {
	await game.waitFor('!!(globalThis.__MWG__ && __MWG__.currentScene && __MWG__.currentScene.mover && __MWG__.currentScene.project)', { timeout: 120000 });
	for (let i = 0; i < 14; i++) {
		const r = await game.eval(`(() => { const s = __MWG__.currentScene; if (!s || !s.mover) return 'noscene'; const d = s.dialogue; return { pl: s.player && Object.keys(s.player).slice(0,12), mapId: s.player && s.player.mapId, ev: !!s.eventRunning, cur: !!s.currentEvent, dKeys: d && Object.keys(d).slice(0,25), dText: d && JSON.stringify(d).slice(0,260), queue: s.eventQueue && s.eventQueue.length, win: s.windows && Object.keys(s.windows).slice(0,12) }; })()`).catch((e) => 'err ' + e.message);
		console.log(i, JSON.stringify(r).slice(0, 700));
		await game.press('Enter', { gap: 500 });
	}
	await game.screenshot('tools/scratch/t113/probe2.png');
};
