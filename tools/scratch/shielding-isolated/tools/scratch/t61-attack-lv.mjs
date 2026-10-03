// Throwaway (tools/scratch): browser LV for T61 / BACKLOG B7 - the 19 seams attack()'s pure
// resolution was split into (`src/scenes/dungeon/attackSeams.ts`).
//
// The suite pins the seams' *source shape* and attack()'s call sites; this drives a real fight in
// the built game and counts every seam call, so "the extraction is verbatim and still plays" is
// asserted in pixels and in the running scene rather than only against text.
//
// Run after a build:  node tools/browserTest.mjs --dist <dist> --script tools/scratch/t61-attack-lv.mjs
// (the dist must contain the T61 extraction - see agents_talking.md for why the shared worktree's
// combatResolution.ts predates it and a patched copy of HEAD's file is used instead).

export default async (game) => {
	const results = [];
	const check = (name, ok, detail = '') => {
		results.push({ name, ok: !!ok });
		console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`);
	};

	await game.startGame();
	// The level-entry banner ("Descente" on a descent) covers the canvas for a moment after
	// startGame() resolves; wait it out so the screenshot below shows the dungeon.
	await new Promise((r) => setTimeout(r, 3000));
	const banner = await game.findText('Descente|Descending|Descent');
	check('the level-entry banner has cleared before the fight', !banner, JSON.stringify(banner));

	// ---- 1. every seam the extraction created is on the live prototype ------------------
	const SEAMS = [
		'presentAttackSwing', 'presentAttackMiss', 'scaleAttackDamage', 'armStrikeAffix',
		'applyHeroTalentBonuses', 'applyWeaponAffixProcs', 'applyDefenderGlyphProcs', 'openLandedHit',
		'applyPostCurveAbsorbs', 'applyHeroDefense', 'applyBossSoaks', 'runBossDamageHooks',
		'resolveAttackDeath', 'runHitRiders', 'runOnHitHooks', 'presentLandedHit',
		'applyExecutesAndDamage', 'isCharmedToward', 'isPhantomRemoteHit',
	];
	const missing = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const names = ${JSON.stringify(SEAMS)};
		const missing = [];
		window.__t61 = { counts: {} };
		for (const n of names) {
			const orig = s[n];
			if (typeof orig !== 'function') { missing.push(n); continue; }
			s[n] = function (...args) { window.__t61.counts[n] = (window.__t61.counts[n] || 0) + 1; return orig.apply(this, args); };
		}
		return missing;
	})()`);
	check('all 19 T61 seams are live methods on DungeonScene', missing.length === 0, missing.join(','));

	// ---- 2. a real fight: three forced misses, then blows until the rat dies --------------
	const fight = await game.eval(`(() => {
		const s = window.__MWG__.currentScene, h = s.hero;
		let cell = null;
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
			const x = h.x + dx, y = h.y + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) { cell = { x, y }; break; }
		}
		if (!cell) return { ok: false, why: 'no free adjacent cell' };
		const rat = s.spawnMonster('rat', cell);
		rat.sleeping = false; rat.seesHero = true; rat.hp = 40; rat.maxHp = 40;
		const acc0 = h.accuracy, dmg0 = [...h.damage], affix0 = s.weaponAffix;

		// forced misses: accuracy 0 against an awake, aware rat (no surprise, no force-hit)
		h.accuracy = 0;
		let whiffs = 0;
		for (let i = 0; i < 3; i++) { if (s.attack(h, rat) === false) whiffs++; }
		const hpAfterMisses = rat.hp;

		// forced hits until it dies
		h.accuracy = 100000;
		let landed = 0, swings = 0;
		while (rat.hp > 0 && swings < 60) {
			const before = rat.hp;
			const r = s.attack(h, rat);
			swings++;
			if (rat.hp < before) landed++;
			if (r === null || r === undefined) break;
		}
		const dead = rat.hp <= 0;

		// a second, living rat so the screenshot shows combat rather than a corpse
		const again = s.spawnMonster('rat', cell);
		again.sleeping = false; again.seesHero = true;
		const lastHit = s.attack(h, again);
		// presentAttackMiss is not the ordinary miss: the parry-interleaved main-miss pair
		// deliberately stays inline in attack(), so only the afterImage feint and the Swift
		// SpiritHawk dodge present through that seam (see the pin's note in tools/scratch/h.tmp).
		// Turning the same rat into an afterImage defender is the cheapest way to reach it.
		again.allyKind = 'afterImage';
		const imageHpBefore = again.hp;
		const imageWhiff = s.attack(h, again);
		const counts = { ...window.__t61.counts };
		h.accuracy = acc0; h.damage = dmg0; s.weaponAffix = affix0;
		return { ok: true, cell, whiffs, hpAfterMisses, landed, swings, dead, counts, lastHit,
			imageWhiff, imageHpBefore, imageHpAfter: again.hp, heroHp: h.hp, ratHp: again.hp, ratMax: again.maxHp };
	})()`);
	if (!fight.ok) check('a fight could be set up', false, fight.why);
	else {
		check('three forced misses never damaged the rat', fight.whiffs === 3 && fight.hpAfterMisses === 40, JSON.stringify({ whiffs: fight.whiffs, hp: fight.hpAfterMisses }));
		check('forced hits landed and the rat died', fight.landed > 0 && fight.dead, JSON.stringify({ landed: fight.landed, swings: fight.swings, dead: fight.dead }));
		check('the afterImage feint presents through presentAttackMiss (the ordinary miss stays inline on purpose)',
			(fight.counts.presentAttackMiss || 0) > 0 && fight.imageWhiff === false && fight.imageHpAfter === fight.imageHpBefore,
			JSON.stringify({ presentAttackMiss: fight.counts.presentAttackMiss, imageWhiff: fight.imageWhiff, hp: [fight.imageHpBefore, fight.imageHpAfter] }));
	}

	// let the last hit's floating damage number render, then take the pixels
	const where = () => game.eval(`(() => { const c = window.__MWG__.currentScene; return { kind: c ? c.constructor.name : null, depth: c ? (c.depth ?? null) : null, level: !!(c && c.level), hp: c && c.hero ? c.hero.hp : null }; })()`);
	const beforeShot = await where();
	await new Promise((r) => setTimeout(r, 350));
	await game.screenshot('tools/scratch/browser-test/t61-attack-lv.png');
	const afterShot = await where();
	// the class name is minified in a production build (`Y3`), so assert on the level itself
	check('the screenshot captured the dungeon scene itself', !!(beforeShot.level && afterShot.level) && beforeShot.depth === afterShot.depth && typeof afterShot.hp === 'number',
		JSON.stringify({ beforeShot, afterShot }));

	// ---- 3. every seam fired during the fight --------------------------------------------
	const counts = fight.counts || {};
	const neverFired = SEAMS.filter((n) => !(counts[n] > 0));
	check('every T61 seam fired during the fight', neverFired.length === 0, `never fired: ${neverFired.join(', ')}`);
	console.log('seam call counts: ' + JSON.stringify(counts));

	const errors = game.consoleErrors();
	check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));

	// the log lines the presentation seams write are still on screen after the shot
	const deathLine = await game.findText('meurt|dies|tue');
	check('the combat log carries the killing-blow line', !!deathLine, JSON.stringify(deathLine));

	const failed = results.filter((r) => !r.ok).length;
	console.log(`t61 attack-seam LV: ${results.length - failed}/${results.length} checks`);
	return failed === 0;
};
