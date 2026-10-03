// Diagnostic sibling of r055-r056-livecheck.mjs: trace why the guardian's score writes stopped
// firing after the first one (positions, hp, how many spires the scene really holds).
export default async (game) => {
	await game.startGame();
	const out = await game.eval(`(async () => {
		const s = window.__MWG__.currentScene;
		s['depth'] = 12;
		s['blacksmithQuestType'] = 1;
		s['enterMiningBranch']();
		await new Promise((r) => setTimeout(r, 3500));
		s['hero'].hp = s['hero'].maxHp = 999;
		const spires = s['creatures'].filter((c) => c.kind === 'crystalSpire');
		const guardian = s['creatures'].find((c) => c.kind === 'crystalGuardian');
		const spire = spires[0];
		if (!guardian || !spire) return { error: 'missing actors' };
		guardian.x = s['hero'].x + 1; guardian.y = s['hero'].y;
		const trace = [];
		const orig = s['crystalGuardianAttackScore'];
		s['crystalGuardianAttackScore'] = function (g, d) {
			trace.push({
				g: [g.x, g.y], hero: d.isHero,
				spires: s['creatures'].filter((c) => c.kind === 'crystalSpire').map((c) => [c.x, c.y, c.hp, c.maxHp]),
			});
			return orig.call(s, g, d);
		};
		const q = () => s['runScoreInput'](false, false).questScores[2];
		const snap = (name) => ({ name, q: q(), trace: trace.length, last: trace.at(-1) ?? null, gHp: guardian.hp, hHp: s['hero'].hp, gPos: [guardian.x, guardian.y], spirePos: [spire.x, spire.y], spireHp: [spire.hp, spire.maxHp] });
		const log = [];
		log.push(snap('start'));
		s['attack'](guardian, spire);
		spire.hp = spire.maxHp;
		log.push(snap('after attack on spire'));
		s['attack'](guardian, s['hero']);
		log.push(snap('after hero attack 1'));
		spire.hp = spire.maxHp - 1;
		spire.x = guardian.x + 3; spire.y = guardian.y;
		s['attack'](guardian, s['hero']);
		log.push(snap('after hero attack 2 (damaged near)'));
		spire.x = guardian.x + 40;
		s['attack'](guardian, s['hero']);
		log.push(snap('after hero attack 3 (damaged far)'));
		spire.x = guardian.x + 3; spire.hp = spire.maxHp;
		s['attack'](guardian, s['hero']);
		log.push(snap('after hero attack 4 (full near)'));
		return { spireCount: spires.length, guardianKind: guardian.kind, log };
	})()`);
	console.log(JSON.stringify(out, null, 1));
	const errs = game.consoleErrors();
	if (errs.length) console.log('console errors:', errs);
};
