// T63 batch-1 live check: environmental blob damage (toxic gas, electricity) routes
// through the shared `applyCharacterDamage` dispatch (the migrated `spreadPlantBlobs`
// closure), verifying: mob damage + kill, the new NPC no-op gate, the sheep gate, the
// hero half with cause 'poison', and electricity's cause mapping to 'foe'.
// node tools/browserTest.mjs --script tools/scratch/blob-seam-livecheck.mjs
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

	// Attribution: log every shared-dispatch call (target, damage, cause, armor flag, return).
	await game.eval(`(() => {
		window.__SEAM__ = [];
		const orig = scene.applyCharacterDamage.bind(scene);
		scene.applyCharacterDamage = (c, dmg, opts) => {
			const r = orig(c, dmg, opts);
			window.__SEAM__.push({
				kind: c.kind ?? null, ally: c.allyKind ?? null, hero: !!c.isHero,
				npc: !!c.isNPC, dmg, cause: opts.cause, pierce: opts.pierceArmor === true, r,
			});
			return r;
		};
	})()`);

	// Three free cells around the hero: a plain rat, a rat wearing the shared `isNPC`
	// bit (all seven Java NPCs carry it), and a real sheep ally.
	const setup = await game.eval(`(() => {
		const w = scene.level.width, h = scene.level.height;
		const idx = (x, y) => x + y * w;
		const occupied = new Set(scene.creatures.map(c => idx(c.x, c.y)));
		const free = [];
		const hx = scene.hero.x, hy = scene.hero.y;
		for (let r = 1; r <= 8 && free.length < 4; r++) {
			for (let dy = -r; dy <= r && free.length < 4; dy++) {
				for (let dx = -r; dx <= r && free.length < 4; dx++) {
					const x = hx + dx, y = hy + dy;
					if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) continue;
					if (!scene.level.passable(x, y) || occupied.has(idx(x, y))) continue;
					if (free.some(f => f.x === x && f.y === y) || scene.creatureAt(x, y)) continue;
					free.push({ x, y });
				}
			}
		}
		if (free.length < 4) return { error: 'no free cells', found: free.length };
		const rat = scene.spawnMonster('rat', free[0]);
		const npc = scene.spawnMonster('rat', free[1]);
		npc.isNPC = true;
		const sheep = scene.spawnMonster('sheep', free[2], false, undefined, true, 'sheep');
		const zap = scene.spawnMonster('rat', free[3]);
		window.__T__ = { rat, npc, sheep, zap };
		return {
			rat: { hp: rat.hp, max: rat.maxHp, at: [rat.x, rat.y] },
			npc: { hp: npc.hp, at: [npc.x, npc.y] },
			sheep: { hp: sheep.hp, at: [sheep.x, sheep.y] },
			zap: { hp: zap.hp, at: [zap.x, zap.y] },
			heroHp: scene.hero.hp,
		};
	})()`);
	say(`setup: ${JSON.stringify(setup)}`);
	check(say, 'four test targets spawned', !setup.error, setup);

	const seam = async () => game.eval('window.__SEAM__.splice(0)');
	const tick = async (n = 1) => {
		for (let i = 0; i < n; i++) {
			await game.eval(`scene['spreadPlantBlobs']()`);
			await sleep(60);
		}
	};
	const seeded = (blob, x, y, v) => game.eval(`scene.${blob}.seed(${x}, ${y}, ${v})`);

	// --- A. toxic gas damages a plain rat through the dispatch (pierceArmor, cause 'poison').
	await seeded('toxicGas', setup.rat.at[0], setup.rat.at[1], 12);
	await tick();
	let log = await seam();
	const a = log.find(e => e.kind === 'rat' && !e.hero && !e.npc && e.ally === null);
	check(say, 'rat gas hit attributed to the dispatch', !!a, a);
	check(say, 'gas rolls no DR and maps to the poison cause', a && a.pierce === true && a.cause === 'poison', a);
	const ratHp = await game.eval('window.__T__.rat.hp');
	check(say, 'rat took exactly the depth-scaled tick (1 at depth 1)', ratHp === setup.rat.hp - 1, { ratHp, before: setup.rat.hp });

	// --- B. the new NPC gate: same gas, zero HP change, gate answered inside the dispatch.
	await seeded('toxicGas', setup.npc.at[0], setup.npc.at[1], 12);
	await tick();
	log = await seam();
	const b = log.find(e => e.npc);
	check(say, 'NPC reached the dispatch and was gated there', !!b && b.r === false, b);
	const npcHp = await game.eval('window.__T__.npc.hp');
	check(say, 'NPC took no blob damage', npcHp === setup.npc.hp, npcHp);

	// --- C. sheep gate still answers inside the dispatch.
	await seeded('toxicGas', setup.sheep.at[0], setup.sheep.at[1], 12);
	await tick();
	log = await seam();
	const c = log.find(e => e.ally === 'sheep');
	check(say, 'sheep reached the dispatch and was gated there', !!c && c.r === false, c);
	const sheepHp = await game.eval('window.__T__.sheep.hp');
	check(say, 'sheep took no blob damage', sheepHp === setup.sheep.hp, sheepHp);

	// --- D. hero half: cause 'poison', pierceArmor, and the HP write through absorbHeroDamage.
	const heroBefore = await game.eval('scene.hero.hp');
	await seeded('toxicGas', 'scene.hero.x', 'scene.hero.y', 12);
	await tick();
	log = await seam();
	const d = log.find(e => e.hero);
	check(say, 'hero gas hit attributed with poison cause', !!d && d.cause === 'poison' && d.pierce === true, d);
	const heroAfter = await game.eval('scene.hero.hp');
	check(say, 'hero took the depth-scaled tick', heroAfter === heroBefore - 1, { heroBefore, heroAfter });

	// --- E. lethality: rat at 1 HP dies inside the dispatch (mob branch + kill).
	await game.eval('window.__T__.rat.hp = 1');
	await seeded('toxicGas', setup.rat.at[0], setup.rat.at[1], 12);
	await tick();
	log = await seam();
	const e = log.find(e => e.kind === 'rat' && !e.npc && !e.hero);
	const ratGone = await game.eval("!scene.creatures.includes(window.__T__.rat)");
	check(say, 'lethal gas tick ran through the dispatch', !!e, e);
	check(say, 'rat died and left the creature list', ratGone, ratGone);

	// --- F. electricity: cause maps to 'foe' (no death-badge bucket for the blob).
	await seeded('electricity', setup.zap.at[0], setup.zap.at[1], 11);
	await tick(4);
	log = await seam();
	const zaps = log.filter(e => e.cause === 'foe');
	check(say, 'electricity zapped through the dispatch with cause foe', zaps.length >= 1, zaps);

	// Floaters/gas on screen for the visual record.
	await sleep(400);
	await game.screenshot(`${shots}/blob-seam-livecheck.png`);

	const errs = game.consoleErrors();
	if (errs.length) { say(`console errors: ${JSON.stringify(errs.slice(0, 5))}`); failures++; }
	else say('no console errors');
	say(failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`);
};
