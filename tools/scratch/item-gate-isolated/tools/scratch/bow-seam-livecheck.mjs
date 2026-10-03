// T63 spirit-bow live check: the `shoot` branch of `useSpecial` routes its hit through
// the shared `applyCharacterDamage` dispatch. Verifies: dispatch attribution (cause
// 'foe', pierceArmor for the caller's `attack()`-style DR roll, magical false, NO
// skipAura - Java's src is the Hero, a Char, so attack()'s aura reduction applies and
// damage()'s clause skips Char srcs), exact HP equations against the dispatch's dmg
// argument, the floater drawn inside the dispatch, the wake inside the dispatch, the
// flash gated on target.hp > 0 (kill() drops the sprite mapping), the tail continuing
// past an in-dispatch kill (followup latch + lethalHaste call), Doom multiplied inside
// the dispatch, the sheep/NPC gates (no floater, sheep not even woken), and the aura
// clause reducing a same-alignment ally while a foe takes the plain number.
// node tools/browserTest.mjs --script tools/scratch/bow-seam-livecheck.mjs
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

	// Attribution hooks: every shared-dispatch call, every kill() with its death
	// bucket, every damage floater, and every lethalHasteOnKill call.
	await game.eval(`(() => {
		window.__SEAM__ = [];
		window.__KILLS__ = [];
		window.__FLOAT__ = [];
		window.__LH__ = 0;
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
		const origLh = scene.lethalHasteOnKill.bind(scene);
		scene.lethalHasteOnKill = () => { window.__LH__++; return origLh(); };
	})()`);

	// Setup: Huntress so `CLASSES.heroClass.special.kind === 'shoot'`, the talents the
	// assertions read (added to the existing ranks, not replacing them), and one tagged
	// creature per phase on free cells ring 1-16 around the hero.
	const setup = await game.eval(`(() => {
		scene.heroClass = 'huntress';
		scene.talentRanks['point_blank'] = 3;
		scene.talentRanks['followup_strike'] = 1;
		scene.talentRanks['aura_of_protection'] = 2;
		const w = scene.level.width, h = scene.level.height;
		const idx = (x, y) => x + y * w;
		const hx = scene.hero.x, hy = scene.hero.y;
		const busy = new Set(scene.creatures.map(c => idx(c.x, c.y)));
		const freeCell = (x, y) => x >= 1 && y >= 1 && x < w - 1 && y < h - 1
			&& scene.level.passable(x, y) && !busy.has(idx(x, y)) && !scene.creatureAt(x, y)
			&& !scene.secrets.isSecret(x, y);
		const pool = [];
		for (let r = 1; r <= 16 && pool.length < 24; r++) {
			for (let dy = -r; dy <= r && pool.length < 24; dy++) for (let dx = -r; dx <= r && pool.length < 24; dx++) {
				if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
				const x = hx + dx, y = hy + dy;
				if (freeCell(x, y)) pool.push({ x, y });
			}
		}
		if (pool.length < 7) return { error: 'cell pool', found: pool.length };
		const take = () => pool.shift();
		const spawn = (tag, cell) => { const m = scene.spawnMonster('rat', cell); m.__tag = tag; return m; };
		const hitRat = spawn('hitRat', take()); hitRat.hp = hitRat.maxHp = 500;
		const lethalRat = spawn('lethalRat', take()); lethalRat.hp = 1;
		const sheepA = scene.spawnMonster('sheep', take(), false, undefined, true, 'sheep'); sheepA.__tag = 'sheepA';
		const npcRat = spawn('npcRat', take()); npcRat.isNPC = true; npcRat.hp = npcRat.maxHp = 500;
		const doomRat = spawn('doomRat', take()); doomRat.hp = doomRat.maxHp = 500; doomRat.buffs = { ...(doomRat.buffs ?? {}), doom: 5 };
		const auraRat = spawn('auraRat', take()); auraRat.hp = auraRat.maxHp = 500;
		const prismAura = scene.spawnPrismaticImage(take(), 60); prismAura.__tag = 'prismAura';
		window.__T__ = { hitRat, lethalRat, sheepA, npcRat, doomRat, auraRat, prismAura };
		return { pool: pool.length, kind: scene.creatures.includes(hitRat) ? 'ok' : 'missing' };
	})()`);
	say(`setup: ${JSON.stringify(setup)}`);
	check(say, 'spawns ready', !setup.error, setup);
	if (setup.error) { say(`${failures} FAILURE(S)`); return; }

	// One atomic eval per shot: clear the logs, put the victim to sleep (sleeping
	// defenders are auto-hits per rollHit's INFINITE_ACCURACY surprise clause), fire,
	// then read everything in the same tick - before any tween or monster turn runs.
	const shoot = (tag) => game.eval(`(() => {
		const v = window.__T__[${JSON.stringify(tag)}];
		window.__SEAM__.splice(0); window.__KILLS__.splice(0); window.__FLOAT__.splice(0);
		const lh0 = window.__LH__;
		v.sleeping = true;
		const before = v.hp;
		const id = v.id;
		scene.specialTarget = v;
		const r = scene.useSpecial();
		const sprite = scene.spriteFor.get(id) ?? null;
		return { r, before, after: v.hp, sleeping: v.sleeping, alive: scene.creatures.includes(v),
			seam: window.__SEAM__.splice(0), kills: window.__KILLS__.splice(0), floats: window.__FLOAT__.splice(0),
			lh: window.__LH__ - lh0, flash: sprite ? sprite.colorAdd : null, spriteGone: sprite === null,
			followup: scene.followupTarget ? scene.followupTarget.id === id : false,
			momentumLeft: scene.projectileMomentumReady === true };
	})()`);
	const at = (log, tag) => log.find((e) => e.tag === tag);

	// --- A. plain hit: dispatch attribution, exact HP equation, floater, wake, flash,
	//     followup latch, momentum consumed, no lethalHaste.
	let o = await shoot('hitRat');
	let e = at(o.seam, 'hitRat');
	check(say, 'bow hit dispatched (foe, pierce, magical false, no skipAura)',
		!!e && e.cause === 'foe' && e.pierce === true && e.magical === false && e.skipAura === false, e);
	check(say, 'victim paid exactly the dispatched dmg (no caller-side HP write left)',
		!!e && o.after === o.before - e.dmg, { before: o.before, dmg: e && e.dmg, after: o.after });
	check(say, 'the dispatch drew the floater with the dispatched number',
		o.floats.length > 0 && o.floats[0].dmg === (e && e.dmg), o.floats);
	check(say, 'the dispatch woke its sleeping target', o.sleeping === false, o.sleeping);
	check(say, 'the surviving target flashed (colorAdd set, gated target.hp > 0)', o.flash !== null && o.flash !== 0 && o.flash !== undefined, o.flash);
	check(say, 'followup_strike latched the target after the dispatch', o.followup === true, o.followup);
	check(say, 'momentum flag consumed by the shot', o.momentumLeft === false, o.momentumLeft);
	check(say, 'no lethalHaste on a surviving victim', o.lh === 0, o.lh);

	// --- B. lethal: kill comes from the dispatch with the foe bucket, the sprite
	//     mapping is gone (so the flash must not run), and the post-dispatch tail
	//     still executed (followup latch + lethalHaste call) instead of crashing on
	//     the dead sprite.
	o = await shoot('lethalRat');
	e = at(o.seam, 'lethalRat');
	const kB = at(o.kills, 'lethalRat');
	check(say, 'lethal bow hit dispatched (foe, pierce)', !!e && e.cause === 'foe' && e.pierce === true, e);
	check(say, 'kill() ran inside the dispatch with the foe death bucket', !!kB && kB.cause === 'foe', o.kills);
	check(say, 'dead rat left the creature list', o.alive === false, o.alive);
	check(say, 'sprite mapping dropped by kill (no flash target)', o.spriteGone === true, o.spriteGone);
	check(say, 'tail continued past the in-dispatch kill (followup latch)', o.followup === true, o.followup);
	check(say, 'lethalHasteOnKill fired after the dispatch kill', o.lh === 1, o.lh);

	// --- C. sheep: reaches the dispatch and is gated there - no floater, no kill,
	//     and not even woken, because the wake sits after the gates.
	o = await shoot('sheepA');
	e = at(o.seam, 'sheepA');
	check(say, 'sheep reached the dispatch and was gated (HP unchanged)', !!e && o.after === o.before, { seam: e, before: o.before, after: o.after });
	check(say, 'gated sheep drew no floater and no kill', o.floats.length === 0 && o.kills.length === 0, { floats: o.floats, kills: o.kills });
	check(say, 'gated sheep stayed asleep (gates precede the wake)', o.sleeping === true, o.sleeping);

	// --- D. NPC: same Java damage() no-op gate.
	o = await shoot('npcRat');
	e = at(o.seam, 'npcRat');
	check(say, 'NPC reached the dispatch and was gated (HP unchanged, no floater)',
		!!e && o.after === o.before && o.floats.length === 0, { seam: e, before: o.before, after: o.after });

	// --- E. Doom: the multiply happens inside the dispatch now (the old tail rolled
	//     doomDamage itself before an hp write). floater shows the post-Doom number.
	o = await shoot('doomRat');
	e = at(o.seam, 'doomRat');
	const expectedDoom = e ? Math.floor(Math.fround(e.dmg * Math.fround(1.67)) + 0.5) : null;
	check(say, 'doomed rat paid floor(fround(dmg*1.67)+0.5) - Doom inside the dispatch',
		!!e && o.before - o.after === expectedDoom, { dmg: e && e.dmg, expectedDoom, paid: o.before - o.after });
	check(say, 'floater shows the post-Doom number',
		o.floats.length > 0 && o.floats[0].dmg === expectedDoom, { floats: o.floats, expectedDoom });

	// --- F. aura: a same-alignment ally takes floor(dmg * (0.9 - 0.1*rank)) through
	//     the dispatch's aura clause; the foe control takes the plain dispatched dmg.
	const rank = await game.eval("scene.talentRank('aura_of_protection')");
	const factor = 0.9 - 0.1 * Math.max(0, Math.min(3, rank));
	await game.eval("scene.hero.buffs['auraProtection'] = {};");
	o = await shoot('auraRat');
	e = at(o.seam, 'auraRat');
	check(say, 'foe under an active aura takes the plain dispatched dmg',
		!!e && o.after === o.before - e.dmg, { rank, before: o.before, dmg: e && e.dmg, after: o.after });
	o = await shoot('prismAura');
	e = at(o.seam, 'prismAura');
	check(say, 'same-alignment ally took floor(dmg * auraFactor) - aura clause ran in the dispatch',
		!!e && o.after === o.before - Math.floor(e.dmg * factor), { rank, factor, before: o.before, dmg: e && e.dmg, after: o.after });
	await game.eval("delete scene.hero.buffs['auraProtection'];");

	// Floaters/arrows on screen for the visual record.
	await sleep(400);
	await game.screenshot(`${shots}/bow-seam-livecheck.png`);

	const errs = game.consoleErrors();
	if (errs.length) { say(`console errors: ${JSON.stringify(errs.slice(0, 5))}`); failures++; }
	else say('no console errors');
	say(failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`);
};
