const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async (game) => {
	await sleep(8000);
	for (let i = 0; i < 6; i++) {
		const t = Date.now();
		const r = await game.eval(`(() => { const s = __MWG__.currentScene; return { d: !!s.dialogue, ev: !!s.eventRunning, x: s.mover && s.mover.x, y: s.mover && s.mover.y, win: s.windows && s.windows.children ? s.windows.children.length : null }; })()`);
		const t2 = Date.now(); await game.press('Enter', { gap: 350 }); console.log(i, JSON.stringify(r), 'eval ms', t2 - t, 'press ms', Date.now() - t2);
	}
};
