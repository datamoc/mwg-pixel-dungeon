// R115 live verification: the Freerunner's Momentum buff through the real UI.
// Boot -> grant the unlock_rogue badge (counter surprises >= 10, class select is badge-gated
// like r069) -> class select by portrait walk (MWL order: warrior, mage, ROGUE at index 2)
// -> start -> switch to English through the real settings UI (r114's proven path) -> force
// the large-interface layout (the icon countdown text only draws in the large branch) ->
// Tengu's-mask subclass choice -> level 9 (so Momentum's heroLvl/2 evasion term is visible)
// -> bank stacks by really walking -> assert button/icon/building popup -> activate via the
// Freerun button -> assert x2 speed, +4 evasion, the running icon countdown (which needs the
// doAction refresh) -> run popup -> small-interface fade wash -> fast-forward the run ->
// cooldown icon/popup -> clear cooldown -> rebank -> button back.
// node tools/browserTest.mjs --script tools/scratch/r115-lv.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SETTINGS_SRC = '^(Settings|réglages|Настройки|Ustawienia|Параметри)$';

/** First ANCESTOR-VISIBLE stage text matching `src`, and its centre in canvas fractions. */
const tapByText = (game, src) => game.eval(`(() => {
	const re = new RegExp(${JSON.stringify(src)}, 'i');
	const screen = window.__MWG__.app.renderer.screen;
	let target = null;
	const walk = (n) => {
		if (!n || target) return;
		if (typeof n.text === 'string' && re.test(n.text)) {
			let p = n, ok = true;
			while (p) { if (p.visible === false) { ok = false; break; } p = p.parent; }
			if (ok) target = n;
		}
		if (n.children) n.children.forEach(walk);
	};
	walk(window.__MWG__.currentScene.stage);
	if (!target) return null;
	const b = target.getBounds();
	return { fx: +((b.x + b.width / 2) / screen.width).toFixed(4), fy: +((b.y + b.height / 2) / screen.height).toFixed(4) };
})()`);

/** Ancestor-visible stage text CONTAINING the needle (plain includes, no regex). */
const visibleIncludes = (game, needle) => game.eval(`(() => {
	const n = ${JSON.stringify(needle)};
	let hit = null;
	const walk = (node) => {
		if (!node || hit) return;
		if (typeof node.text === 'string' && node.text.includes(n)) {
			let p = node, ok = true;
			while (p) { if (p.visible === false) { ok = false; break; } p = p.parent; }
			if (ok) hit = node.text;
		}
		if (node.children) node.children.forEach(walk);
	};
	walk(window.__MWG__.currentScene.stage);
	return hit;
})()`);

/** Ancestor-visible stage text matching a case-insensitive regex source (r114's visibleText). */
const visibleMatch = (game, src) => game.eval(`(() => {
	const re = new RegExp(${JSON.stringify(src)}, 'i');
	let hit = null;
	const walk = (node) => {
		if (!node || hit) return;
		if (typeof node.text === 'string' && re.test(node.text)) {
			let p = node, ok = true;
			while (p) { if (p.visible === false) { ok = false; break; } p = p.parent; }
			if (ok) hit = node.text;
		}
		if (node.children) node.children.forEach(walk);
	};
	walk(window.__MWG__.currentScene.stage);
	return hit;
})()`);

const expectIncludes = async (game, needle, label) => {
	for (let i = 0; i < 15; i++) {
		const hit = await visibleIncludes(game, needle);
		if (hit) return hit;
		await sleep(400);
	}
	await game.screenshot(`tools/scratch/browser-test/r115-fail-${label}.png`);
	throw new Error(`${label}: text containing ${JSON.stringify(needle)} never appeared`);
};

const settingsOpen = (game) => game.eval(`(() => {
	const gw = window.__MWG__.currentScene['gameWindows'];
	for (const w of gw.children || []) {
		if (typeof w.close === 'function' && w.content) {
			const tabs = (w.content.children || []).filter((c) => (c.children || []).some(
				(s) => typeof s.eventNames === 'function' && s.eventNames().includes('pointertap')));
			if (tabs.length >= 6) return true;
		}
	}
	return false;
})()`);

const tapLanguageTab = (game) => game.eval(`(() => {
	const gw = window.__MWG__.currentScene['gameWindows'];
	const screen = window.__MWG__.app.renderer.screen;
	const win = [...(gw.children || [])].find((c) => typeof c.close === 'function' && c.content);
	if (!win) return null;
	const tabs = (win.content.children || []).filter((c) => (c.children || []).some(
		(s) => typeof s.eventNames === 'function' && s.eventNames().includes('pointertap')));
	let best = null;
	for (const t of tabs) {
		let b; try { b = t.getBounds(); } catch { continue; }
		if (!b.width || !b.height) continue;
		if (!best || b.x > best.x) best = b;
	}
	if (!best) return null;
	return { fx: +((best.x + best.width / 2) / screen.width).toFixed(4), fy: +((best.y + best.height / 2) / screen.height).toFixed(4) };
})()`);

const langCode = (game) => game.eval(`localStorage.getItem('spd-on-mwg.language')`);

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

/** Open WndGame once the scene is actually ready for it (menuCanOpen refuses mid-settle). */
const openMenu = async (game) => {
	let sawCanOpen = false;
	for (let attempt = 0; attempt < 8; attempt++) {
		await closeWindows(game);
		await sleep(300);
		if (await menuCanOpen(game)) {
			sawCanOpen = true;
			await game.eval(`(() => { window.__MWG__.currentScene['onAction']('gameMenu'); return true; })()`);
			for (let i = 0; i < 6; i++) {
				if (await visibleMatch(game, SETTINGS_SRC)) return;
				await sleep(400);
			}
		} else {
			await sleep(600); // hero not awaiting input yet
		}
	}
	await game.screenshot('tools/scratch/browser-test/r115-menu-fail.png');
	throw new Error('game menu never showed its settings entry (menuCanOpen ever=' + sawCanOpen + ')');
};

/** In-game language switch through the real UI (WndGame -> Settings -> languages tab -> row). */
const switchLanguage = async (game, row, code) => {
	await openMenu(game);
	await sleep(500);
	let open = false;
	for (let i = 0; i < 4 && !open; i++) {
		if (await settingsOpen(game)) { open = true; break; }
		const pos = await tapByText(game, SETTINGS_SRC);
		if (pos) await game.tap(pos.fx, pos.fy);
		await sleep(700);
		open = await settingsOpen(game);
	}
	if (!open) throw new Error('settings window never opened');
	await sleep(400);
	for (let i = 0; i < 4; i++) {
		if (await visibleMatch(game, `^${row}$`)) break;
		const pos = await tapLanguageTab(game);
		if (pos) await game.tap(pos.fx, pos.fy);
		await sleep(500);
	}
	if (!(await visibleMatch(game, `^${row}$`))) throw new Error(`language row ${row} never became visible`);
	for (let i = 0; i < 4; i++) {
		if ((await langCode(game)) === code) break;
		const pos = await tapByText(game, `^${row}$`);
		if (pos) await game.tap(pos.fx, pos.fy);
		await sleep(600);
	}
	const got = await langCode(game);
	if (got !== code) throw new Error(`language switch to ${code} did not persist (localStorage=${got})`);
	console.log(`  ${row} -> ${code}: localStorage confirmed`);
	await sleep(800);
	await closeWindows(game);
	await sleep(400);
};

// ---------------------------------------------------------------- scene reads

const S = (body) => `(() => { const s = window.__MWG__.currentScene; ${body} })()`;

const state = (game) => game.eval(S(`
	return {
		heroClass: s.heroClass,
		subclass: s['subclass'] ? s['subclass']() : null,
		level: s.progression.level,
		interfaceSize: s.interfaceSize,
		x: s.hero.x, y: s.hero.y,
		stacks: s.momentumState.stacks,
		runs: s.momentumState.freerunTurns,
		cd: s.momentumState.freerunCooldown,
		attached: s.momentumState.attached,
		label: s['momentumButtonLabel'](),
		speed: s['momentumSpeedFactor'](),
		evasion: s.hero.evasion,
		icon: Object.hasOwn(s.hero.buffs, 'momentum') ? s.hero.buffs['momentum'] : null,
	};`));

/** The buff row: every tinted icon (its centre for tapping), every overlay text, every fade
 *  wash (a Graphics, detected by its prototype rect method - constructor names are mangled). */
const iconState = (game) => game.eval(S(`
	const layer = s['statusPane']['buffLayer'];
	const screen = window.__MWG__.app.renderer.screen;
	const out = { tints: [], texts: [], washes: 0, momentumFx: null };
	for (const c of layer.children || []) {
		if (typeof c.text === 'string') out.texts.push(c.text);
		else if (typeof c.rect === 'function' && typeof c.fill === 'function') out.washes++;
		else if (c.eventMode === 'static') {
			out.tints.push(c.tint);
			if (c.tint === 0xffff00 || c.tint === 0x8080ff) {
				const b = c.getBounds();
				if (b.width > 0) out.momentumFx = {
					fx: +((b.x + b.width / 2) / screen.width).toFixed(4),
					fy: +((b.y + b.height / 2) / screen.height).toFixed(4),
					tint: c.tint,
				};
			}
		}
	}
	return out;`));

const bumpLevel = (game, n) => game.eval(S(`
	s.progression.level = ${n};
	s.syncHeroFromStats();
	return s.progression.level;`));

/** The real subclass-choice path (chooseSubclass needs subclassChoiceOpen and tolerates a
 *  missing Tengu's mask); if it refuses, fall back to advancement.choose directly. */
const chooseFree = (game) => game.eval(S(`
	const out = { path: null, subclass: null, err: null };
	try {
		s['subclassChoiceOpen'] = true;
		s['chooseSubclass']('freerunner');
		out.path = 'chooseSubclass';
	} catch (e) { out.err = String((e && e.message) || e); }
	try { out.subclass = s['subclass'](); } catch (e) { out.subclass = 'throw:' + String(e); }
	if (out.subclass !== 'freerunner') {
		try {
			s['advancement'].choose(0, 'freerunner', Math.max(s.progression.level, 13));
			s.syncHeroFromStats();
			s.momentumSync();
			out.path = (out.path || 'refused') + '+advancement.choose';
			out.subclass = s['subclass']();
		} catch (e) { out.err = (out.err || '') + ' | fallback: ' + String((e && e.message) || e); }
	}
	return out;`));

/** Centre of the hero sprite plus one sprite-box step in screen fractions (used as the tap
 *  target for an adjacent cell; the ladder in step() tolerates bounds/cell mismatch). */
const heroCenter = (game) => game.eval(S(`
	const sp = s['spriteFor'].get(s.hero.id);
	if (!sp) return null;
	const b = sp.getBounds();
	const screen = window.__MWG__.app.renderer.screen;
	if (!b.width || !b.height) return null;
	return { fx: (b.x + b.width / 2) / screen.width, fy: (b.y + b.height / 2) / screen.height,
		dw: b.width / screen.width, dh: b.height / screen.height };`));

const occupiedDirs = (game) => game.eval(S(`
	const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
	return dirs.map(([dx, dy]) => ({ dx, dy, occupied: !!s['creatureAt'](s.hero.x + dx, s.hero.y + dy) }))
		.sort((a, b) => Number(a.occupied) - Number(b.occupied));`));

/** One walk attempt: tap an unoccupied neighbour (retry ladder scales the step off the sprite
 *  bounds) and wait for `ok(before, after)` to see the expected state change. Bump-attacks and
 *  wall taps change nothing and just move on to the next direction. */
const step = async (game, label, ok, tries = 10) => {
	const scales = [1, 1, 0.55, 1.4, 1, 0.55];
	for (let t = 0; t < tries; t++) {
		const before = await state(game);
		const c = await heroCenter(game);
		if (!c) throw new Error(label + ': no hero sprite bounds');
		const dirs = await occupiedDirs(game);
		const scale = scales[Math.min(t, scales.length - 1)];
		for (const { dx, dy } of dirs) {
			await game.tap(c.fx + dx * c.dw * scale, c.fy + dy * c.dh * scale);
			for (let i = 0; i < 7; i++) {
				await sleep(250);
				const after = await state(game);
				if (ok(before, after)) return { before, after };
			}
		}
	}
	await game.screenshot(`tools/scratch/browser-test/r115-fail-step-${label}.png`);
	throw new Error(`step ${label}: expected change never happened (state=${JSON.stringify(await state(game))})`);
};

const setInterface = async (game, size) => game.eval(S(`
	s.interfaceSize = ${size};
	s.gameLog.setInterfaceSize(${size});
	s.refresh();
	return s.interfaceSize;`));

export default async (game) => {
	const checks = [];
	const check = (name, ok, detail = '') => {
		checks.push({ name, ok: !!ok });
		console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' - ' + detail : ''}`);
	};

	// ---- boot + rogue unlock -------------------------------------------
	try {
		await game.waitFor('!!(window.__MWG__ && window.__MWG__.currentScene && window.__MWG__.currentScene["windows"])', { timeout: 45000 });
	} catch (e) {
		throw new Error(`boot wait failed (${game.consoleErrors()[0] || 'no console errors'}): ${e.message}`);
	}
	await sleep(800);
	await game.screenshot('tools/scratch/browser-test/r115-1-title.png');

	const grant = await game.eval(`(() => {
		const key = 'mwg-save:spd-meta:meta';
		let data = null;
		try { data = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { data = null; }
		if (!data || typeof data !== 'object' || !data.state || typeof data.state !== 'object') {
			data = { meta: { version: 1, savedAt: Date.now() }, state: { counts: [] } };
		}
		if (!Array.isArray(data.state.counts)) data.state.counts = [];
		const hit = data.state.counts.find((c) => Array.isArray(c) && c[0] === 'surprises');
		if (hit) hit[1] = Math.max(Number(hit[1]) || 0, 10);
		else data.state.counts.push(['surprises', 10]);
		data.meta = { version: 1, savedAt: Date.now() };
		localStorage.setItem(key, JSON.stringify(data));
		return data.state.counts;
	})()`);
	console.log('unlock grant (surprises -> 10):', JSON.stringify(grant));

	await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 90000 });
	for (let i = 0; ; i++) {
		if (await game.findText('choisissez votre h|choose your hero')) break;
		if (i > 300) throw new Error('class select never appeared');
		await sleep(300);
	}
	await sleep(800);
	// The portrait click reads the scene's own badge snapshot, so the unlock needs an
	// increment there too (r069's proven grant). Portraits: MWL class order index 2 = rogue.
	const badgeState = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		s['badges'].increment('surprises', 10);
		return { unlocked: s['badges'].unlocked('unlock_rogue'), count: s['badges'].count('surprises') };
	})()`);
	check('unlock_rogue satisfied', badgeState.unlocked, JSON.stringify(badgeState));
	const portrait = await game.eval(`(() => {
		const mwg = window.__MWG__, stage = mwg.app.stage, screen = mwg.app.renderer.screen;
		const hits = [];
		const walk = (n) => {
			const f = n.texture && n.texture.frame;
			if (n.visible !== false && f && f.x === 0 && f.y === 90 && f.width === 12 && f.height === 15) {
				const b = n.getBounds();
				if (b.width > 0 && b.height > 0) hits.push({ fx: (b.x + b.width / 2) / screen.width, fy: (b.y + b.height / 2) / screen.height });
			}
			for (const c of (n.children || [])) walk(c);
		};
		walk(stage);
		return { count: hits.length, hits };
	})()`);
	if (portrait.count !== 6 || !portrait.hits[2]) throw new Error('portrait walk failed: ' + JSON.stringify(portrait));
	await game.tap(portrait.hits[2].fx, portrait.hits[2].fy);
	await sleep(800);
	await game.tapText('^commencer$|^start$', { timeout: 30000 });
	await game.waitFor('!!(window.__MWG__.currentScene && window.__MWG__.currentScene["hero"] && window.__MWG__.currentScene["creatures"])', { timeout: 90000 });
	await sleep(1500);

	let st = await state(game);
	check('started as rogue', st.heroClass === 'rogue', `class=${st.heroClass}`);

	// ---- English + large interface (the countdown text only draws large) --
	await switchLanguage(game, 'english', 'en');
	const iface = await setInterface(game, 1);
	check('large interface forced', iface === 1, `interfaceSize=${iface}`);
	await sleep(400);
	st = await state(game);
	check('before subclass: no button', st.label === null, `label=${st.label}`);
	check('before subclass: no momentum icon', st.icon === null, `icon=${st.icon}`);
	await game.screenshot('tools/scratch/browser-test/r115-2-hud-initial.png');

	// ---- subclass + level (level 9 -> momentumEvasion's heroLvl/2 = 4) ----
	const lvl = await bumpLevel(game, 9);
	check('level set to 9', lvl === 9, `level=${lvl}`);
	const sub = await chooseFree(game);
	check('subclass is freerunner', sub.subclass === 'freerunner', JSON.stringify(sub));
	st = await state(game);
	const baseEvasion = st.evasion;
	check('freerun speed factor idle = 1', st.speed === 1, `speed=${st.speed}`);
	check('no stacks yet', st.attached === false && st.stacks === 0, `attached=${st.attached} stacks=${st.stacks}`);

	// ---- bank 4+ stacks by walking --------------------------------------
	let guard = 0;
	while ((await state(game)).stacks < 4 && guard++ < 14) {
		await step(game, `bank-${guard}`, (b, a) => a.stacks > b.stacks);
	}
	st = await state(game);
	const banked = st.stacks;
	check('banked >= 4 stacks', banked >= 4, `stacks=${banked}`);
	check('icon sentinel attached after banking', st.icon === 9999, `icon=${st.icon}`);
	check('button label carries live stack count', st.label === `Freerun ${banked}`, `label=${st.label}`);
	check('speed still 1 while building', st.speed === 1, `speed=${st.speed}`);
	check('evasion unchanged while building', st.evasion === baseEvasion, `evasion=${st.evasion} base=${baseEvasion}`);
	let ic = await iconState(game);
	check('building icon tinted yellow', ic.momentumFx && ic.momentumFx.tint === 0xffff00, JSON.stringify(ic.momentumFx));
	check('building icon shows no countdown', ic.texts.length === 0, JSON.stringify(ic.texts));
	await game.screenshot('tools/scratch/browser-test/r115-3-banked.png');

	// ---- building popup --------------------------------------------------
	await game.tap(ic.momentumFx.fx, ic.momentumFx.fy);
	const buildDesc = await expectIncludes(game, `Current momentum charge: ${banked}`, 'building-popup');
	check('building popup names the charge', buildDesc.includes(`Current momentum charge: ${banked}.`), JSON.stringify(buildDesc.slice(0, 90)));
	await game.screenshot('tools/scratch/browser-test/r115-4-buffinfo-building.png');
	await closeWindows(game);
	await sleep(400);

	// ---- activate via the button ----------------------------------------
	st = await state(game);
	await game.tapText(`^${st.label}$`, { timeout: 15000 });
	for (let i = 0; i < 20 && (await state(game)).runs === 0; i++) await sleep(250);
	const runTurns = 2 * banked;
	st = await state(game);
	check('freerun active: runs = 2 x stacks', st.runs === runTurns, `runs=${st.runs} expected=${runTurns}`);
	check('stacks spent', st.stacks === 0, `stacks=${st.stacks}`);
	check('cooldown set to 10 + 4 x stacks', st.cd === 10 + 4 * banked, `cd=${st.cd}`);
	check('speed factor x2 while running', st.speed === 2, `speed=${st.speed}`);
	check('button hidden while running', st.label === null, `label=${st.label}`);
	check('evasion +4 while running (level 9 / 2)', st.evasion === baseEvasion + 4, `evasion=${st.evasion} base=${baseEvasion}`);
	ic = await iconState(game);
	check('running icon countdown visible immediately after the free action', ic.texts.includes(String(runTurns)), JSON.stringify(ic.texts));
	await game.screenshot('tools/scratch/browser-test/r115-5-activated.png');

	// ---- one real move during the run -----------------------------------
	const moved = await step(game, 'run-move', (b, a) => a.x !== b.x || a.y !== b.y);
	st = await state(game);
	check('no stacks bank during the run', st.stacks === 0, `stacks=${st.stacks}`);
	check('run ticks down per turn', st.runs === moved.before.runs - 1, `${moved.before.runs} -> ${st.runs}`);
	check('cooldown ticks during the run', st.cd === moved.before.cd - 1, `${moved.before.cd} -> ${st.cd}`);
	ic = await iconState(game);
	check('running countdown follows the tick', ic.texts.includes(String(st.runs)), JSON.stringify(ic.texts));
	check('running icon stays yellow', ic.momentumFx && ic.momentumFx.tint === 0xffff00, JSON.stringify(ic.momentumFx));
	await game.screenshot('tools/scratch/browser-test/r115-6-running-turn.png');

	// ---- running popup ---------------------------------------------------
	await game.tap(ic.momentumFx.fx, ic.momentumFx.fy);
	const runDesc = await expectIncludes(game, 'moves at double speed', 'running-popup');
	check('running popup reports the run turns', runDesc.includes(`Turns remaining: ${st.runs}.`), JSON.stringify(runDesc.slice(-80)));
	await game.screenshot('tools/scratch/browser-test/r115-7-buffinfo-running.png');
	await closeWindows(game);
	await sleep(400);

	// ---- small-interface fade wash (the else-branch overlay) -------------
	const small = await setInterface(game, 0);
	check('small interface forced', small === 0, `interfaceSize=${small}`);
	await sleep(300);
	ic = await iconState(game);
	check('small layout: no countdown text', ic.texts.length === 0, JSON.stringify(ic.texts));
	check('small layout: running fade wash present', ic.washes >= 1, `washes=${ic.washes}`);
	await game.screenshot('tools/scratch/browser-test/r115-8-running-small.png');
	await setInterface(game, 1);
	await sleep(300);

	// ---- end the run fast and watch the cooldown state -------------------
	await game.eval(S('s.momentumState.freerunTurns = 1; return s.momentumState.freerunTurns;'));
	await step(game, 'run-end', (b, a) => a.runs === 0);
	st = await state(game);
	check('speed back to 1 after the run', st.speed === 1, `speed=${st.speed}`);
	check('evasion back after the run', st.evasion === baseEvasion, `evasion=${st.evasion} base=${baseEvasion}`);
	check('button stays hidden during cooldown', st.label === null, `label=${st.label}`);
	check('cooldown still running', st.cd > 0, `cd=${st.cd}`);
	ic = await iconState(game);
	check('cooldown icon tinted blue', ic.momentumFx && ic.momentumFx.tint === 0x8080ff, JSON.stringify(ic.momentumFx));
	check('cooldown countdown visible', ic.texts.includes(String(st.cd)), JSON.stringify(ic.texts));
	await game.screenshot('tools/scratch/browser-test/r115-9-cooldown.png');

	// ---- resting popup ---------------------------------------------------
	await game.tap(ic.momentumFx.fx, ic.momentumFx.fy);
	const restDesc = await expectIncludes(game, 'needs time to regain his stamina', 'resting-popup');
	check('resting popup reports the cooldown', restDesc.includes(`Turns remaining: ${st.cd}.`), JSON.stringify(restDesc.slice(-80)));
	await game.screenshot('tools/scratch/browser-test/r115-10-buffinfo-resting.png');
	await closeWindows(game);
	await sleep(400);

	// ---- clear the cooldown, then bank again -----------------------------
	await game.eval(S('s.momentumState.freerunCooldown = 1; return s.momentumState.freerunCooldown;'));
	await step(game, 'cd-clear', (b, a) => a.cd === 0);
	st = await state(game);
	check('cooldown reaches 0', st.cd === 0, `cd=${st.cd}`);
	check('icon gone once stacks and cooldown are clear', st.icon === null, `icon=${st.icon}`);
	await step(game, 'rebank', (b, a) => a.stacks >= 1);
	st = await state(game);
	check('rebank after cooldown', st.stacks >= 1, `stacks=${st.stacks}`);
	check('button back after cooldown', st.label === `Freerun ${st.stacks}`, `label=${st.label}`);
	ic = await iconState(game);
	check('rebanked icon yellow again', ic.momentumFx && ic.momentumFx.tint === 0xffff00, JSON.stringify(ic.momentumFx));
	await game.screenshot('tools/scratch/browser-test/r115-11-rebanked.png');

	// ---- verdict ---------------------------------------------------------
	const errors = game.consoleErrors();
	check('no console errors', errors.length === 0, errors[0] || '');
	const failed = checks.filter((c) => !c.ok);
	if (failed.length) {
		await game.screenshot('tools/scratch/browser-test/r115-fail-final.png');
		throw new Error(`${failed.length}/${checks.length} checks failed: ${failed.map((c) => c.name).join(' | ')}`);
	}
	console.log(`R115 LV OK: ${checks.length} checks, no console errors`);
};
