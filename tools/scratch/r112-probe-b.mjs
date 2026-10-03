// probe2b: inspect boot state when a run save exists (created by probe-a).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function (game) {
	// wait for the app only - do NOT startGame; observe what boot did with the save
	await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout: 30000 });
	await sleep(4000);
	const boot = await game.eval(`(() => {
		const s = window.__MWG__ && window.__MWG__.currentScene;
		return {
			sceneType: s ? s.constructor.name : null,
			hasHero: !!(s && s.hero),
			depth: s && s.depth ? s.depth : null,
			seed: s && s.runSeed !== undefined ? s.runSeed : null,
			bag: s && s.bag && s.bag.items ? s.bag.items.map(i => i.id + ':' + i.quantity) : null,
			saveKeys: Object.keys(localStorage).filter(k => k.includes('run')),
		};
	})()`);
	console.log('BOOT-STATE:', JSON.stringify(boot, null, 1));
	await game.screenshot('tools/scratch/browser-test/r112-probe-boot.png');
}
