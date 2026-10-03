// T113 playthrough bot for one converted mwgp game (run via tools/browserTest.mjs --url <player.html?id=..&skipTitle=1>).
// Real key events (CDP/BiDi). Emits one JSON summary line prefixed "T113 " plus screenshots under tools/scratch/t113/.
// Events come from the converted map data (`mwgEvents`: say/ask/transfer commands, string triggers); the hero is placed next to
// one with the player's own same-map `transfer`, then the real action/arrow key is pressed - so the converted interpreter,
// dialogue box and choice window run exactly as for a player.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCENE = `(globalThis.__MWG__ && __MWG__.currentScene && __MWG__.currentScene.mover && __MWG__.currentScene.project ? __MWG__.currentScene : null)`;
const MAPID = `(() => { const s = ${SCENE}; const q = new URLSearchParams(location.search); return Number(q.get('map') || s.project.initialMapId); })()`;
const STATE = `(() => { const s = ${SCENE}; if (!s) return null;
	const texts = []; const walk = (n, d) => { if (d > 14) return; if (n.text !== undefined && n.visible !== false && String(n.text).trim()) texts.push(String(n.text).slice(0, 70)); for (const c of (n.children || [])) walk(c, d + 1); };
	try { walk(s.windows || s.overlayLayer || s.stage, 0); } catch (e) {}
	return { map: ${MAPID}, x: s.mover.x, y: s.mover.y, dialogue: !!s.dialogue, ev: !!s.eventRunning, texts: texts.slice(-8) }; })()`;

export default async (game) => {
	const id = new URL(game.url).searchParams.get('id');
	const tag = Buffer.from(id, 'base64url').toString('utf8').replace(/[^A-Za-z0-9.]+/g, '-');
	const out = { game: tag, checks: {} };
	const shot = (n) => game.screenshot(`tools/scratch/t113/${tag}-${n}.png`);
	const alive = () => game.waitFor(`!!${SCENE}`, { timeout: 90000 }).catch(() => false);
	const state = async () => { await alive(); return game.eval(STATE).catch(() => null); };
	const t0 = Date.now();
	const log = (m) => console.error(`[t113 ${Math.round((Date.now() - t0) / 1000)}s] ${m}`);

	try { await game.waitFor(`!!${SCENE}`, { timeout: 150000 }); out.checks.boot = `ok in ${Math.round((Date.now() - t0) / 1000)}s`; }
	catch (e) { out.checks.boot = `FAIL ${e.message}`; console.log('T113 ' + JSON.stringify(out)); return; }
	await sleep(1500);
	await shot('1-boot');
	out.checks.banner = (game.consoleLogs().find((l) => /MWGP compatibility/.test(l.text)) || { text: 'no compatibility warning logged' }).text.slice(0, 800);

	log('boot done, dismissing intro');
	let intro = 0;
	for (let i = 0; i < 80; i++) {
		const s = await state();
		if (!s || (!s.dialogue && !s.ev)) break;
		intro++; await game.press('Enter', { gap: 350 });
	}
	await sleep(500); await shot('2-after-intro');
	out.checks.intro = `${intro} action-key presses to settle`;

	log('intro done, moving');
	const moves = {};
	for (const dir of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
		const b = await state(); await game.press(dir, { hold: 220, times: 3, gap: 200 }); await sleep(300); const a = await state();
		if (b && a) moves[dir] = (b.x !== a.x || b.y !== a.y) ? `${b.x},${b.y} -> ${a.x},${a.y}` : 'blocked';
	}
	out.checks.move = moves; await shot('3-moved');

	log('move done, picking events');
	const cand = await game.eval(`(() => { const s = ${SCENE}; const p = s.project; const mapId = ${MAPID};
		const m = p.maps.find((x) => Number(x.id) === mapId) || p.maps[0]; const evs = (m.mwgEvents || []).filter(Boolean);
		const last = (e) => e.pages[e.pages.length - 1]; const js = (e) => JSON.stringify(last(e).commands || []);
		const free = (e) => e.pages.every((pg) => !(pg.conditions && pg.conditions.length));
		const ok = (e) => free(e) && ['action', 'touch'].includes(last(e).trigger);
		const say = evs.filter((e) => ok(e) && js(e).includes('"say"') && !js(e).includes('"ask"')).slice(0, 4).map((e) => ({ id: e.id, x: e.x, y: e.y, trig: last(e).trigger }));
		const ask = evs.filter((e) => ok(e) && js(e).includes('"ask"')).slice(0, 3).map((e) => ({ id: e.id, x: e.x, y: e.y, trig: last(e).trigger }));
		const trf = evs.filter((e) => ok(e) && js(e).includes('"transfer"')).slice(0, 3).map((e) => ({ id: e.id, x: e.x, y: e.y, trig: last(e).trigger, to: (js(e).match(/"transfer":\\{[^}]*\\}/) || [''])[0] }));
		return { mapId, say, ask, trf, n: evs.length }; })()`);
	out.candidates = { map: cand.mapId, events: cand.n, say: cand.say.length, ask: cand.ask.length, transfer: cand.trf.length };

	const around = [[0, 1, 'up'], [0, -1, 'down'], [1, 0, 'left'], [-1, 0, 'right']];
	const place = (mapId, x, y, face) => game.eval(`(() => { const s = ${SCENE}; s.transfer({ mapId: ${mapId}, x: ${x}, y: ${y} }); s.facing = ${JSON.stringify(face)}; s.mover.turnTo && s.mover.turnTo(${face === 'left' ? -1 : face === 'right' ? 1 : 0}, ${face === 'up' ? -1 : face === 'down' ? 1 : 0}); return true; })()`);

	async function tryEvent(e, label, idx, expectChoice) {
		for (const [dx, dy, face] of around) {
			await place(cand.mapId, e.x + dx, e.y + dy, face); await sleep(300);
			await game.press('Enter', { gap: 600 });
			let s = await state();
			if (!s || !(s.dialogue || s.ev)) continue;
			await shot(`${label}-${idx}-open`);
			const seen = []; let choiceShot = false, guard = 0, pressedArrow = 0;
			while (guard++ < 60) {
				s = await state();
				if (!s || (!s.dialogue && !s.ev)) break;
				const key = s.texts.join('|');
				if (!seen.includes(key)) seen.push(key);
				if (expectChoice && !choiceShot && seen.length > 1) { choiceShot = true; await shot(`${label}-${idx}-choice`); }
				if (expectChoice && guard % 3 === 0 && pressedArrow < 2) { pressedArrow++; await game.press('ArrowDown', { gap: 200 }); }
				await game.press('Enter', { gap: 400 });
			}
			const end = await state();
			return { at: `${e.x},${e.y}`, side: `${dx},${dy}`, trigger: e.trig, frames: seen.length, first: (seen[0] || '').slice(0, 110), choiceScreenshot: choiceShot, ended: !!end && !end.dialogue && !end.ev };
		}
		return { at: `${e.x},${e.y}`, trigger: e.trig, result: 'no dialogue/event started from any side' };
	}
	log('dialogue');
	out.dialogue = []; for (let i = 0; i < Math.min(3, cand.say.length); i++) out.dialogue.push(await tryEvent(cand.say[i], 'dlg', i, false));
	log('choice');
	out.choice = []; for (let i = 0; i < Math.min(2, cand.ask.length); i++) out.choice.push(await tryEvent(cand.ask[i], 'chc', i, true));

	log('transfer');
	out.transfer = [];
	for (let i = 0; i < Math.min(2, cand.trf.length); i++) {
		const e = cand.trf[i]; const before = await state(); let res = 'no map change observed';
		for (const [dx, dy, face] of around) {
			await place(cand.mapId, e.x + dx, e.y + dy, face); await sleep(300);
			await game.press(face === 'up' ? 'ArrowUp' : face === 'down' ? 'ArrowDown' : face === 'left' ? 'ArrowLeft' : 'ArrowRight', { hold: 250, times: 2, gap: 200 });
			await game.press('Enter', { gap: 600 }); await sleep(1500);
			for (let k = 0; k < 6; k++) { const m = await state(); if (m && (m.dialogue || m.ev)) await game.press('Enter', { gap: 400 }); else break; }
			const a = await state();
			if (a && a.map !== cand.mapId) { res = `map ${cand.mapId} -> ${a.map} at ${a.x},${a.y} (event says ${e.to})`; break; }
		}
		out.transfer.push({ at: `${e.x},${e.y}`, trigger: e.trig, res }); await shot(`trf-${i}`);
		if (!/no map change/.test(res)) break;
	}

	log('save/load');
	await alive(); const savedAt = await state();
	await game.press('F5', { gap: 900 });
	const keys = await game.eval(`(() => Object.keys(localStorage).filter((k) => /save/i.test(k)))()`);
	await game.eval(`(() => { const s = ${SCENE}; s.transfer({ mapId: ${MAPID}, x: ${savedAt ? savedAt.x : 0} + 2, y: ${savedAt ? savedAt.y : 0} }); return true; })()`);
	const moved = await state();
	await game.press('F9', { gap: 1500 }); await sleep(2000);
	const loaded = await state();
	const same = loaded && savedAt && loaded.x === savedAt.x && loaded.y === savedAt.y && loaded.map === savedAt.map;
	out.checks.saveLoad = `${same ? 'PASS' : 'FAIL'}: saved map ${savedAt && savedAt.map} ${savedAt && [savedAt.x, savedAt.y]}, moved ${moved && [moved.x, moved.y]}, after F9 ${loaded && [loaded.map, loaded.x, loaded.y]}; keys ${JSON.stringify(keys)}`;

	out.checks.audio = await game.eval(`(() => { const a = ${SCENE}.audio; if (!a) return 'no audio manager'; return { context: a.context && a.context.state, bgm: a.isPlaying && a.isPlaying('bgm'), bgs: a.isPlaying && a.isPlaying('bgs'), warned: [...(a.warned || [])].slice(0, 4) }; })()`).catch((e) => `error ${e.message}`);
	await shot('9-final');
	out.errors = game.consoleErrors().filter((e) => !/Failed to load resource/.test(e)).slice(0, 6);
	console.log('T113 ' + JSON.stringify(out));
};
