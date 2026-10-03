// Throwaway (tools/scratch): live-check that ally-side DoT runs the shared `Char.damage()`
// dispatch (`applyCharacterDamage`), T63's "ally-side DoT still uses the shared shield helper
// directly" clause.
//
// Before this pass `takeAllyTurn` called `absorbCreatureShields` and wrote HP itself, so an
// ally was outside every gate and modifier the hero and enemy funnels share. The four cases
// below are exactly what that cost: a Sheep ally (Java `Sheep.damage()` is a no-op), a
// SpectatorFreeze'd ally (Java `Char.isInvulnerable()`), Doom amplification, and the
// PowerOfMany Barrier pool (which now absorbs through the same seam as everything else).
//
// Run after `npm run build`:  node tools/browserTest.mjs --script tools/scratch/ally-dot-livecheck.mjs

export default async (game) => {
	const results = [];
	const check = (name, ok, detail = '') => {
		results.push({ name, ok: !!ok });
		console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`);
	};

	await game.startGame();
	// let the level-entry banner clear so the screenshot below shows the dungeon
	await new Promise((r) => setTimeout(r, 3000));

	const out = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const h = s.hero;
		const cells = [];
		for (let radius = 1; radius <= 4 && cells.length < 6; radius++) {
			for (let dy = -radius; dy <= radius && cells.length < 6; dy++) {
				for (let dx = -radius; dx <= radius && cells.length < 6; dx++) {
					if (dx === 0 && dy === 0) continue;
					const x = h.x + dx, y = h.y + dy;
					if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)
						&& !s.isChasmCell(x, y)) cells.push({ x, y });
				}
			}
		}
		if (cells.length < 5) return { ok: false, why: 'not enough free cells', found: cells.length };
		// Attribute every HP change to the shared seam: the wrapper records what the dispatch
		// itself dealt, so an ally wandering into a trap on its own turn cannot be mistaken for
		// an un-gated DoT. Paralysis keeps each test ally on its own cell for the same reason -
		// the tick runs ahead of the paralysis return, Java's buffs acting regardless of the
		// char's own action gates.
		const calls = [];
		const orig = s.applyCharacterDamage;
		s.applyCharacterDamage = function (c, dmg, opts) {
			const before = c.hp;
			const r = orig.call(this, c, dmg, opts);
			calls.push({ tag: c.__tag, dmg, taken: Math.max(0, before - c.hp) });
			return r;
		};
		const make = (i, tag, extra) => {
			const m = s.spawnMonster('rat', cells[i]);
			m.__tag = tag;
			m.isAlly = true;
			m.allyKind = 'spiritHawk';
			m.sleeping = false;
			m.hp = m.maxHp = 60;
			m.buffs.paralysis = 5;
			if (extra) extra(m);
			return m;
		};
		// three ticks per case so one lucky burn roll cannot decide the comparison
		const burn = (m, times) => {
			let total = 0;
			for (let i = 0; i < times; i++) {
				const before = m.hp;
				if (m.hp <= 0) break;
				s['takeAllyTurn'](m);
				total += Math.max(0, before - m.hp);
			}
			return total;
		};
		let plain, doomed, sheep, frozen, shielded, barrierBefore;
		try {
			plain = make(0, 'plain', (m) => { m.buffs.burning = 8; });
			doomed = make(1, 'doomed', (m) => { m.buffs.burning = 8; m.buffs.doom = 9999; });
			sheep = make(2, 'sheep', (m) => { m.allyKind = 'sheep'; m.buffs.burning = 8; });
			frozen = make(3, 'frozen', (m) => { m.buffs.burning = 8; m.buffs.spectatorFreeze = 9999; });
			shielded = make(4, 'shielded', (m) => { m.buffs.burning = 8; m.powerOfManyBarrier = 1000; });
			barrierBefore = shielded.powerOfManyBarrier;
			burn(plain, 3); burn(doomed, 3); burn(sheep, 3); burn(frozen, 3); burn(shielded, 3);
		} finally {
			s.applyCharacterDamage = orig;
		}
		const seam = (tag) => calls.filter((c) => c.tag === tag);
		const sum = (tag, key) => seam(tag).reduce((a, c) => a + c[key], 0);
		return {
			ok: true, cells: cells.length, calls: calls.length,
			seamInputs: { plain: sum('plain', 'dmg'), doomed: sum('doomed', 'dmg') },
			seamTaken: {
				plain: sum('plain', 'taken'), doomed: sum('doomed', 'taken'),
				sheep: sum('sheep', 'taken'), frozen: sum('frozen', 'taken'),
				shielded: sum('shielded', 'taken'),
			},
			total: { plain: 60 - plain.hp, doomed: 60 - doomed.hp, sheep: 60 - sheep.hp,
				frozen: 60 - frozen.hp, shielded: 60 - shielded.hp },
			barrier: { before: barrierBefore, after: shielded.powerOfManyBarrier ?? 0 },
		};
	})()`);

	console.log('ally DoT results: ' + JSON.stringify(out));

	if (!out.ok) check('the scene could be set up', false, out.why);
	else {
		check('an ally takes its ongoing DoT through the shared dispatcher', out.seamTaken.plain > 0,
			JSON.stringify({ seamTaken: out.seamTaken, inputs: out.seamInputs, calls: out.calls }));
		check('Doom amplifies that tick inside the dispatcher', out.seamTaken.doomed > out.seamTaken.plain,
			JSON.stringify({ plain: out.seamTaken.plain, doomed: out.seamTaken.doomed, inputs: out.seamInputs }));
		check('a Sheep ally takes nothing at all (Java Sheep.damage() is a no-op)',
			out.seamTaken.sheep === 0 && out.total.sheep === 0,
			JSON.stringify({ seam: out.seamTaken.sheep, total: out.total.sheep }));
		check('a SpectatorFreeze ally takes nothing at all (Java Char.isInvulnerable())',
			out.seamTaken.frozen === 0 && out.total.frozen === 0,
			JSON.stringify({ seam: out.seamTaken.frozen, total: out.total.frozen }));
		check('the PowerOfMany Barrier pool absorbs the tick before HP (ShieldBuff.processDamage)',
			out.seamTaken.shielded === 0 && out.barrier.after < out.barrier.before,
			JSON.stringify({ hpThroughSeam: out.seamTaken.shielded, barrier: out.barrier }));
	}

	await game.eval(`(() => { const s = window.__MWG__.currentScene; s.refresh(); return true; })()`);
	await new Promise((r) => setTimeout(r, 400));
	await game.screenshot('tools/scratch/browser-test/ally-dot-livecheck.png');

	const errors = game.consoleErrors();
	check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));

	const failed = results.filter((r) => !r.ok).length;
	console.log(`ally DoT livecheck: ${results.length - failed}/${results.length} checks`);
	return failed === 0;
};
