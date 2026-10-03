// T63 wand-zap live check: `fireWandShot`'s victim tail and `useDisintegrationWand`
// route through the shared `applyCharacterDamage` dispatch. Verifies: dispatch
// attribution (cause 'foe', pierceArmor, magical, NO skipAura - Java's zap src is
// the wand itself, a non-Char, so damage()'s aura clause must run), exact HP
// equations against the dispatch's dmg argument, the floater, the wake, lethal
// kills with the 'foe' bucket, the dispatch's sheep/NPC gates, the prismatic
// image's fade riding kill()'s non-chasm backstop, the mirror's event prelude
// (fades WITHOUT reaching the dispatch), corruption/corrosion dealing 0 like
// Java's void onZap even with a planted wandBonusDamage, the disintegration beam
// dispatch, and AuraOfProtection reducing a same-alignment ally inside the
// dispatch while leaving a foe untouched.
// node tools/browserTest.mjs --script tools/scratch/wand-seam-livecheck.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (say, label, ok, detail) => {
	say(`${ok ? 'PASS' : 'FAIL'} ${label}${detail === undefined ? '' : ` -> ${JSON.stringify(detail)}`}`);
	if (!ok) failures++;
};

export default async (game) => {
	const say = (m) => console.log(`[${game.browser}] ${m}`);
	const shots = 'tools/scratch/browser-test';

	await game.startGame();
	await game.waitFor('scene && scene.awaitingInput === true', { timeout: 20000 });

	// Attribution: every shared-dispatch call (tag, dmg, options), every kill()
	// with its death bucket, and every damage floater.
	await game.eval(`(() => {
		window.__SEAM__ = [];
		window.__KILLS__ = [];
		window.__FLOAT__ = [];
		const orig = scene.applyCharacterDamage.bind(scene);
		scene.applyCharacterDamage = (c, dmg, opts) => {
			const r = orig(c, dmg, opts);
			window.__SEAM__.push({ tag: c.__tag ?? null, dmg, cause: opts.cause,
				pierce: opts.pierceArmor === true, magical: opts.magical === true,
				skipAura: opts.skipAura === true, r });
			return r;
		};
		const origKill = scene.kill.bind(scene);
		scene.kill = (c, cause) => { window.__KILLS__.push({ tag: c.__tag ?? null, cause: cause ?? null }); return origKill(c, cause); };
		const origFloat = scene.showDamage.bind(scene);
		scene.showDamage = (c, dmg) => { window.__FLOAT__.push({ tag: c.__tag ?? null, dmg }); return origFloat(c, dmg); };
	})()`);

	// Setup: one creature-free ray for the disintegration beam, and every other
	// spawn OFF that ray, so no assertion can be hit by stray beam damage.
	const setup = await game.eval(`(() => {
		const w = scene.level.width, h = scene.level.height;
		const idx = (x, y) => x + y * w;
		const hx = scene.hero.x, hy = scene.hero.y;
		const busy = new Set(scene.creatures.map(c => idx(c.x, c.y)));
		const freeCell = (x, y) => x >= 1 && y >= 1 && x < w - 1 && y < h - 1
			&& scene.level.passable(x, y) && !busy.has(idx(x, y)) && !scene.creatureAt(x, y)
			&& !scene.secrets.isSecret(x, y);
		const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
		let ray = null;
		for (const [dx, dy] of dirs) {
			if (ray) break;
			let target = null, clear = true;
			for (let k = 1; k <= 6; k++) {
				const x = hx + dx * k, y = hy + dy * k;
				if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) { clear = false; break; }
				if (scene.creatureAt(x, y)) { clear = false; break; }
				if (k >= 2 && scene.level.passable(x, y)) target = { x, y };
			}
			if (clear && target) ray = { dx, dy, target };
		}
		if (!ray) return { error: 'no ray' };
		const onRay = (x, y) => { for (let k = 1; k <= 6; k++) { if (x === hx + ray.dx * k && y === hy + ray.dy * k) return true; } return false; };
		const pool = [];
		for (let r = 1; r <= 16 && pool.length < 40; r++) {
			for (let dy = -r; dy <= r && pool.length < 40; dy++) for (let dx = -r; dx <= r && pool.length < 40; dx++) {
				if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
				const x = hx + dx, y = hy + dy;
				if (freeCell(x, y) && !onRay(x, y)) pool.push({ x, y });
			}
		}
		if (pool.length < 10) return { error: 'cell pool', found: pool.length };
		const take = () => pool.shift();
		const spawn = (tag, cell) => { const m = scene.spawnMonster('rat', cell); m.__tag = tag; return m; };
		const zapRat = spawn('zapRat', take());
		const lethalRat = spawn('lethalRat', take());
		const npcRat = spawn('npcRat', take()); npcRat.isNPC = true;
		const sheepA = scene.spawnMonster('sheep', take(), false, undefined, true, 'sheep'); sheepA.__tag = 'sheepA';
		const corruptRat = spawn('corruptRat', take());
		const auraRat = spawn('auraRat', take());
		const prismAura = scene.spawnPrismaticImage(take(), 60); prismAura.__tag = 'prismAura';
		const prismLethal = scene.spawnPrismaticImage(take(), 1); prismLethal.__tag = 'prismLethal';
		const mirrorA = scene.spawnMirrorImage(take()); mirrorA.__tag = 'mirrorA';
		const disTgt = spawn('disTgt', ray.target);
		window.__T__ = { zapRat, lethalRat, npcRat, sheepA, corruptRat, auraRat, prismAura, prismLethal, mirrorA, disTgt };
		const tags = Object.keys(window.__T__);
		const hp = {}; for (const t of tags) hp[t] = window.__T__[t].hp;
		return { ray, pool: pool.length, hp, prismFade: prismLethal.prismaticFade ?? null };
	})()`);
	say(`setup: ${JSON.stringify(setup)}`);
	check(say, 'spawns and the beam ray ready', !setup.error, setup);
	if (setup.error) { say(`${failures} FAILURE(S)`); return; }

	const seam = () => game.eval('window.__SEAM__.splice(0)');
	const kills = () => game.eval('window.__KILLS__.splice(0)');
	const floats = () => game.eval('window.__FLOAT__.splice(0)');
	const zap = (type, tag) => game.eval(`scene.fireWandShot('${type}', 3, window.__T__.${tag}, 1)`);
	const hp = (tag) => game.eval(`window.__T__.${tag}.hp`);
	const at = (log, tag) => log.find(e => e.tag === tag);

	// --- A. magicMissile: dispatch attribution (foe/pierce/magical/no-skipAura),
	//     exact HP equation, floater, wake.
	await seam(); await kills(); await floats();
	await game.eval('window.__T__.zapRat.hp = 60; window.__T__.zapRat.sleeping = true;');
	const aBefore = await hp('zapRat');
	await zap('magicMissile', 'zapRat');
	let log = await seam();
	let e = at(log, 'zapRat');
	check(say, 'magicMissile hit is attributed to the dispatch (foe, pierce, magical, no skipAura)',
		!!e && e.cause === 'foe' && e.pierce === true && e.magical === true && e.skipAura === false, e);
	const aAfter = await hp('zapRat');
	check(say, 'zapRat paid exactly the dispatched dmg', e && aAfter === aBefore - e.dmg, { before: aBefore, dmg: e && e.dmg, after: aAfter });
	const aFloat = at(await floats(), 'zapRat');
	check(say, 'the dispatch drew the damage floater', !!aFloat && aFloat.dmg === (e && e.dmg), aFloat);
	check(say, 'the zap woke its sleeping target inside the dispatch', await game.eval('window.__T__.zapRat.sleeping === false'));

	// --- B. lethal zap: kill with the 'foe' bucket, victim leaves the list.
	await seam(); await kills();
	await game.eval('window.__T__.lethalRat.hp = 1;');
	await zap('magicMissile', 'lethalRat');
	log = await seam();
	const killsB = await kills();
	e = at(log, 'lethalRat');
	const kB = killsB.find(x => x.tag === 'lethalRat');
	check(say, 'lethal zap dispatched (foe, pierce)', !!e && e.cause === 'foe' && e.pierce === true, e);
	check(say, 'lethal zap killed with the foe death bucket', !!kB && kB.cause === 'foe', killsB);
	check(say, 'dead rat left the creature list', await game.eval('!scene.creatures.includes(window.__T__.lethalRat)'));

	// --- C. NPC: reaches the dispatch and is gated inside it (Java damage() no-op).
	await seam();
	const cBefore = await hp('npcRat');
	await zap('magicMissile', 'npcRat');
	log = await seam();
	e = at(log, 'npcRat');
	check(say, 'NPC reached the dispatch and was gated there', !!e && e.r === false && (await hp('npcRat')) === cBefore, e);

	// --- D. sheep: reaches the dispatch and is gated there (Sheep.damage() no-op).
	await seam();
	const dBefore = await hp('sheepA');
	await zap('magicMissile', 'sheepA');
	log = await seam();
	e = at(log, 'sheepA');
	check(say, 'sheep reached the dispatch and was gated there', !!e && e.r === false && (await hp('sheepA')) === dBefore, e);

	// --- E. corruption: Java's void onZap means zero damage even with a planted
	//     flat wand bonus that the old tail would have manufactured into damage.
	await seam();
	await game.eval('scene.wandBonusDamage = 7;');
	const eBefore = await hp('corruptRat');
	await zap('corruption', 'corruptRat');
	await game.eval('scene.wandBonusDamage = 0;');
	log = await seam();
	e = at(log, 'corruptRat');
	const eAfter = await hp('corruptRat');
	check(say, 'corruption zap dispatched with exactly 0 damage (void onZap, planted bonus ignored)',
		!!e && e.dmg === 0, e);
	check(say, 'corruption target lost no HP to the zap (any later gain is the convert heal)', eAfter >= eBefore, { before: eBefore, after: eAfter });

	// --- F. prismatic image, lethal: kill() runs but the non-chasm backstop turns
	//     it into the 5-turn fade - still in the creature list, fade armed.
	await seam(); await kills();
	await game.eval('window.__T__.prismLethal.hp = 1;');
	await zap('magicMissile', 'prismLethal');
	log = await seam();
	const killsF = await kills();
	e = at(log, 'prismLethal');
	const kF = killsF.find(x => x.tag === 'prismLethal');
	check(say, 'lethal zap on the image dispatched (foe, pierce)', !!e && e.cause === 'foe' && e.pierce === true, e);
	check(say, 'kill() ran for the image with the foe bucket', !!kF && kF.cause === 'foe', killsF);
	const fState = await game.eval(`(() => { const p = window.__T__.prismLethal;
		return { alive: scene.creatures.includes(p), hp: p.hp, fade: p.prismaticFade ?? null }; })()`);
	check(say, "kill()'s prismatic backstop armed the fade instead of death",
		fState.alive === true && fState.hp <= 0 && fState.fade > 0, fState);

	// --- G. mirror: the event prelude fades it BEFORE the dispatch (no dispatch
	//     call, floater from the prelude, kill from the prelude).
	await seam(); await kills(); await floats();
	await zap('magicMissile', 'mirrorA');
	log = await seam();
	const killsG = await kills();
	const floatsG = await floats();
	check(say, 'mirror never reaches the dispatch (event prelude runs first)',
		!at(log, 'mirrorA'), log);
	check(say, 'mirror faded through its own kill', killsG.some(x => x.tag === 'mirrorA'), killsG);
	check(say, 'mirror prelude drew the floater', floatsG.some(x => x.tag === 'mirrorA'), floatsG);

	// --- H. disintegration beam: dispatch attribution + exact HP equation.
	await seam();
	const hBefore = await hp('disTgt');
	await game.eval(`scene.useDisintegrationWand({ x: ${setup.ray.target.x}, y: ${setup.ray.target.y} })`);
	log = await seam();
	e = at(log, 'disTgt');
	const hAfter = await hp('disTgt');
	check(say, 'disintegration beam hit is attributed to the dispatch (foe, pierce, no skipAura)',
		!!e && e.cause === 'foe' && e.pierce === true && e.skipAura === false, e);
	check(say, 'beam victim paid exactly the dispatched dmg', e && hAfter === hBefore - e.dmg, { before: hBefore, dmg: e && e.dmg, after: hAfter });

	// --- I. aura: same-alignment ally inside the dispatch is reduced by
	//     floor(dmg * (0.9 - 0.1*rank)); an untouched foe is not.
	await seam();
	await game.eval("scene.hero.buffs['auraProtection'] = {};");
	const rank = await game.eval("scene.talentRank('aura_of_protection')");
	const factor = 0.9 - 0.1 * Math.max(0, Math.min(3, rank));
	const iFoeBefore = await hp('auraRat');
	await zap('magicMissile', 'auraRat');
	log = await seam();
	e = at(log, 'auraRat');
	const iFoeAfter = await hp('auraRat');
	check(say, 'foe under an active aura takes the plain dispatched dmg (same-alignment gate)',
		!!e && iFoeAfter === iFoeBefore - e.dmg, { rank, before: iFoeBefore, dmg: e && e.dmg, after: iFoeAfter });
	await seam();
	const iAllyBefore = await hp('prismAura');
	await zap('magicMissile', 'prismAura');
	log = await seam();
	e = at(log, 'prismAura');
	const iAllyAfter = await hp('prismAura');
	check(say, 'same-alignment ally took floor(dmg * auraFactor) - the aura clause ran inside the dispatch',
		!!e && iAllyAfter === iAllyBefore - Math.floor(e.dmg * factor), { rank, factor, before: iAllyBefore, dmg: e && e.dmg, after: iAllyAfter });
	await game.eval("delete scene.hero.buffs['auraProtection'];");

	// Floaters/zap trail on screen for the visual record.
	await sleep(400);
	await game.screenshot(`${shots}/wand-seam-livecheck.png`);

	const errs = game.consoleErrors();
	if (errs.length) { say(`console errors: ${JSON.stringify(errs.slice(0, 5))}`); failures++; }
	else say('no console errors');
	say(failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`);
};
