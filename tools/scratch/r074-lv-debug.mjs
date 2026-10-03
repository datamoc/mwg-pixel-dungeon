// Debug: where do the language buttons live, and what events do they listen to?
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async (game) => {
	await game.waitFor('!!(window.__MWG__ && window.__MWG__.currentScene && window.__MWG__.currentScene["windows"])', { timeout: 45000 });
	await sleep(800);
	await game.tapText('^(réglages|settings)$', { timeout: 15000 });
	await sleep(700);
	const dump = await game.eval(`
(() => {
	const hits = [];
	const walk = (n, path) => {
		if (!n) return;
		if (typeof n.text === 'string' && /svenska|беларуск/i.test(n.text)) {
			const chain = [];
			let p = n;
			for (let i = 0; i < 5 && p; i++) {
				chain.push({
					name: p.constructor && p.constructor.name,
					ev: typeof p.eventNames === 'function' ? p.eventNames() : null,
					eventMode: p.eventMode,
					vis: p.visible,
					text: typeof p.text === 'string' ? p.text.slice(0, 30) : undefined,
				});
				p = p.parent;
			}
			hits.push({ path, chain });
		}
		if (n.children) n.children.forEach((c, i) => walk(c, path + '>' + i));
	};
	walk(window.__MWG__.currentScene.stage, '');
	return hits;
})()`);
	console.log(JSON.stringify(dump, null, 1).slice(0, 4000));
};
