// Throwaway: dump every SETTINGS_src match in walk order (findText picks the FIRST - a hidden
// one wins and the tap lands elsewhere), tap the menu button's own bounds, verify settings
// opened, and dump the settings window's content tree (tab strip + rows).
import fs from 'node:fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SETTINGS_SRC = '^(Settings|réglages|Настройки|Ustawienia|Параметри)$';

const visibleText = (game, src) => game.eval(`(() => {
	const re = new RegExp(${JSON.stringify(src)}, 'i');
	let hit = null;
	const walk = (n) => {
		if (!n || hit) return;
		if (typeof n.text === 'string' && re.test(n.text)) {
			let p = n, ok = true;
			while (p) { if (p.visible === false) { ok = false; break; } p = p.parent; }
			if (ok) hit = n.text;
		}
		if (n.children) n.children.forEach(walk);
	};
	walk(window.__MWG__.currentScene.stage);
	return hit;
})()`);

const menuCanOpen = (game) => game.eval(`(() => {
	const cs = window.__MWG__.currentScene;
	return typeof cs['menuCanOpen'] === 'function' ? cs['menuCanOpen']() : false;
})()`);

const closeWindows = async (game) => game.eval(`(() => {
	const gw = window.__MWG__.currentScene['gameWindows'];
	let n = 0;
	for (const c of [...((gw && gw.children) || [])]) {
		if (c && typeof c.close === 'function' && c.content) { c.close(); n++; }
	}
	return n;
})()`);

const openMenu = async (game) => {
	for (let attempt = 0; attempt < 8; attempt++) {
		await closeWindows(game);
		await sleep(300);
		if (await menuCanOpen(game)) {
			await game.eval(`(() => { window.__MWG__.currentScene['onAction']('gameMenu'); return true; })()`);
			for (let i = 0; i < 6; i++) {
				if (await visibleText(game, SETTINGS_SRC)) return;
				await sleep(400);
			}
		} else {
			await sleep(600);
		}
	}
	throw new Error('game menu never showed its settings entry');
};

const dumpMatches = (game) => game.eval(`(() => {
	const re = new RegExp(${JSON.stringify(SETTINGS_SRC)}, 'i');
	const screen = window.__MWG__.app.renderer.screen;
	const out = [];
	const walk = (n, p) => {
		if (!n) return;
		if (typeof n.text === 'string' && re.test(n.text)) {
			let q = n, chain = [];
			while (q) { chain.push((q.constructor && q.constructor.name) + (q.visible === false ? '!' : '')); q = q.parent; }
			let b = null;
			try { const bb = n.getBounds(); b = [Math.round(bb.x), Math.round(bb.y), Math.round(bb.width), Math.round(bb.height)]; } catch { /* */ }
			out.push({ text: n.text, b, fx: b ? +((b[0] + b[2] / 2) / screen.width).toFixed(4) : null, fy: b ? +((b[1] + b[3] / 2) / screen.height).toFixed(4) : null, path: p, chain: chain.join('<') });
		}
		if (n.children) n.children.forEach((c, i) => walk(c, p + '/' + i));
	};
	walk(window.__MWG__.app.stage, '');
	return out;
})()`);

const listWindows = (game) => game.eval(`(() => {
	const gw = window.__MWG__.currentScene['gameWindows'];
	const out = [];
	for (const w of gw.children || []) {
		const isWin = typeof w.close === 'function' && !!w.content;
		const entry = { type: w.constructor && w.constructor.name, isWin };
		if (isWin) {
			const texts = [];
			const walk = (n) => { if (!n) return; if (typeof n.text === 'string') texts.push(n.text.slice(0, 40)); if (n.children) n.children.forEach(walk); };
			walk(w.content);
			entry.texts = texts.slice(0, 12);
		}
		out.push(entry);
	}
	return out;
})()`);

const dumpTree = (game) => game.eval(`(() => {
	const gw = window.__MWG__.currentScene['gameWindows'];
	const screen = window.__MWG__.app.renderer.screen;
	const dump = (n, depth) => {
		const row = { d: depth, type: n.constructor && n.constructor.name };
		if (typeof n.text === 'string') row.text = n.text.slice(0, 60);
		if (typeof n.eventNames === 'function') { const ev = n.eventNames(); if (ev && ev.length) row.events = ev.slice(0, 6); }
		try { const b = n.getBounds(); row.b = [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; } catch { /* */ }
		if (n.visible === false) row.hidden = true;
		const kids = n.children || [];
		if (depth < 7) row.kids = kids.map((c) => dump(c, depth + 1));
		else if (kids.length) row.kidCount = kids.length;
		return row;
	};
	const wins = [];
	for (const w of gw.children || []) {
		if (typeof w.close === 'function' && w.content) wins.push({ type: w.constructor.name, content: dump(w.content, 0) });
	}
	return { screen: { w: screen.width, h: screen.height }, wins };
})()`);

export default async (game) => {
	try {
		await game.waitFor('!!(window.__MWG__ && window.__MWG__.currentScene && window.__MWG__.currentScene["windows"])', { timeout: 45000 });
	} catch (e) {
		throw new Error('boot wait failed: ' + e.message);
	}
	await sleep(800);
	await game.startGame();
	await sleep(1500);

	await openMenu(game);
	const matches = await dumpMatches(game);
	console.log('MATCHES ' + JSON.stringify(matches, null, 1));

	// tap the menu button's own bounds (first match under gameWindows = the menu entry)
	const menuMatch = matches.find((m) => m.chain.includes('Wp')) ?? matches[0];
	console.log('tapping menu button at ' + menuMatch.fx + ',' + menuMatch.fy);
	await game.tap(menuMatch.fx, menuMatch.fy);
	await sleep(900);
	console.log('WINDOWS-AFTER-TAP ' + JSON.stringify(await listWindows(game)));
	await game.screenshot('tools/scratch/browser-test/r114-introspect-settings.png');

	const tree = await dumpTree(game);
	fs.writeFileSync('C:/Users/miche/AppData/Local/Temp/opencode/r114-settings-tree.json', JSON.stringify(tree, null, 1), 'utf8');
	console.log('tree written, windows:', tree.wins.length);
};
