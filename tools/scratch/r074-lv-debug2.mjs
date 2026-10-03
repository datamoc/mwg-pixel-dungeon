// Debug: replay the be-pass path (sv title -> open settings) and dump window/tab state.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DUMP = `
(() => {
	const findWindows = (node, out) => {
		if (node && node.content && typeof node.content === 'object') out.push(node);
		if (node && node.children) for (const c of node.children) findWindows(c, out);
		return out;
	};
	const wins = findWindows(scene['windows'], []);
	const info = wins.map((w) => {
		const b = w.getBounds ? w.getBounds() : null;
		const panels = [];
		const tabs = [];
		const walk = (n, depth) => {
			if (!n) return;
			if (typeof n.eventNames === 'function' && n.eventNames().includes('pointerover')) {
				tabs.push({ x: Math.round(n.x), y: Math.round(n.y), w: Math.round(n.width || 0), vis: n.visible, kids: n.children ? n.children.length : 0 });
			}
			if (n.children) n.children.forEach((c) => walk(c, depth + 1));
		};
		walk(w, 0);
		// top-level content children summary
		const kids = w.content.children.map((c) => ({
			name: c.constructor && c.constructor.name,
			x: Math.round(c.x), y: Math.round(c.y),
			w: Math.round(c.width || 0), h: Math.round(c.height || 0),
			vis: c.visible,
			text: typeof c.text === 'string' ? c.text.slice(0, 24) : undefined,
		}));
		return { bounds: b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null, kids };
	});
	// Svenska row chain visibility
	let row = null;
	const walk2 = (n) => {
		if (row) return;
		if (n && typeof n.text === 'string' && /^(svenska|беларуская)$/i.test(n.text)) {
			const chain = [];
			let p = n;
			while (p) { chain.push(p.visible); p = p.parent; }
			row = { text: n.text, chain, gx: Math.round(n.getGlobalPosition().x), gy: Math.round(n.getGlobalPosition().y) };
			return;
		}
		if (n && n.children) n.children.forEach(walk2);
	};
	walk2(scene.stage);
	return { winCount: wins.length, info, row };
})()`;

export default async (game) => {
	await game.waitFor('!!(window.__MWG__ && window.__MWG__.currentScene && window.__MWG__.currentScene["windows"])', { timeout: 45000 });
	await sleep(800);

	// switch to sv first (same as the lv script)
	await game.tapText('^(réglages|settings)$', { timeout: 15000 });
	await sleep(700);
	await game.tap(0.664, 0.829);
	await sleep(500);
	await game.tapText('^svenska$', { timeout: 15000 });
	await sleep(900);
	try { await game.tapText('^(close|fermer|stäng)$', { timeout: 4000 }); } catch { /* already closed */ }
	await sleep(500);

	// sv title: open settings and dump
	const opened = await game.tapText('^(inställningar|налады)$', { timeout: 15000 });
	await sleep(800);
	await game.screenshot('tools/scratch/browser-test/r074-dbg2-settings-open.png');
	console.log('DUMP after open:', JSON.stringify(await game.eval(DUMP), null, 1).slice(0, 3500));

	await game.tap(0.664, 0.829);
	await sleep(600);
	await game.screenshot('tools/scratch/browser-test/r074-dbg2-after-tabtap.png');
	console.log('DUMP after tab tap:', JSON.stringify(await game.eval(DUMP), null, 1).slice(0, 3500));
};
