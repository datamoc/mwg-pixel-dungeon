const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async (game) => {
	await game.waitFor('!!(globalThis.__MWG__ && __MWG__.currentScene && __MWG__.currentScene.mover && __MWG__.currentScene.project)', { timeout: 120000 });
	await sleep(1500);
	console.log(JSON.stringify(await game.eval(`(() => { const s = __MWG__.currentScene; return { keys: Object.keys(s).slice(0, 60), map: s.mapEntry && s.mapEntry.id, x: s.mover.x, y: s.mover.y, dialogue: !!s.dialogue, ev: !!s.eventRunning }; })()`)));
	const banner = await game.eval(`(() => [...document.querySelectorAll('[id*=banner],[class*=banner],[id*=compat],[class*=compat],#notice,#status')].map(e => e.id + ': ' + e.textContent.slice(0, 300)))()`);
	console.log('banner nodes', JSON.stringify(banner));
	console.log('logs', JSON.stringify(game.consoleLogs().filter((l) => /compat|MWGP|warn/i.test(l.type + l.text)).slice(0, 8)));
	await game.screenshot('tools/scratch/t113/karryn-boot.png');
	console.log('errors', JSON.stringify(game.consoleErrors().slice(0, 5)));
};
