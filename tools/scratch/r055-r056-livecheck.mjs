// Live check (tools/scratch): R055/R056's four `Statistics.questScores[2] -= 100` sites, driven
// through the real scene seams in the built game (`crystalGuardianAttackScore` via `attack()`,
// the shared `gnollRockStrike`, and `landSpireWave`'s hero branch), read back through the R015
// seam `runScoreInput(false, false).questScores[2]`.
// Run: npm run build && node tools/browserTest.mjs --script tools/scratch/r055-r056-livecheck.mjs
import assert from 'node:assert/strict';

export default async (game) => {
	await game.startGame();
	const out = await game.eval(`(async () => {
		const s = window.__MWG__.currentScene;
		s['depth'] = 12;
		s['blacksmithQuestType'] = 1; // Blacksmith.Quest.CRYSTAL
		s['enterMiningBranch']();
		await new Promise((r) => setTimeout(r, 3500));
		s['hero'].hp = s['hero'].maxHp = 999;
		const guardian = s['creatures'].find((c) => c.kind === 'crystalGuardian');
		const spire = s['creatures'].find((c) => c.kind === 'crystalSpire');
		if (!guardian || !spire) return { error: 'missing crystal actors', kinds: s['creatures'].map((c) => c.kind) };
		//Stand the guardian next to the hero so every declared attack is a plausible swing.
		guardian.x = s['hero'].x + 1; guardian.y = s['hero'].y;
		const q = () => s['runScoreInput'](false, false).questScores[2];
		const steps = [];
		const push = (name, expect) => steps.push({ name, got: q(), expect });
		push('baseline', 0);
		//A non-hero target never writes (Java's "if (enemy == Dungeon.hero)"); the incidental
		//spire damage from the swing is undone right after.
		s['attack'](guardian, spire);
		spire.hp = spire.maxHp;
		push('guardian attacking a non-hero', 0);
		//No damaged spire within 8: every attack on the hero pays, misses included.
		s['attack'](guardian, s['hero']);
		push('no damaged spire nearby', -100);
		//A damaged spire within 8 exempts the attack.
		spire.hp = spire.maxHp - 1;
		spire.x = guardian.x + 3; spire.y = guardian.y;
		s['attack'](guardian, s['hero']);
		push('damaged spire within 8', -100);
		//Damaged but far away: pays again.
		spire.x = guardian.x + 40;
		s['attack'](guardian, s['hero']);
		push('damaged spire out of range', -200);
		//Near but undamaged (HP == HT): pays again.
		spire.x = guardian.x + 3; spire.hp = spire.maxHp;
		s['attack'](guardian, s['hero']);
		push('undamaged spire within 8', -300);
		//The shared boulder/rockfall strike on the hero (both R055 Java sites).
		s['gnollRockStrike'](s['hero'], 'port.mob.gnollgeomancer.rock_kill');
		push('gnoll rock strike on the hero', -400);
		//The spire spike wave's hero branch (R056).
		const cell = s['level'].index(s['hero'].x, s['hero'].y);
		const killed = s['landSpireWave'](spire, [cell]);
		steps.push({ name: 'spire spike wave on the hero', got: q(), expect: -500, killed, heroHp: s['hero'].hp });
		return { steps, guardianKind: guardian.kind, spireKind: spire.kind };
	})()`);
	console.log(JSON.stringify(out, null, 1));
	assert.ok(!out?.error, `crystal mine did not load: ${JSON.stringify(out)}`);
	for (const step of out.steps) assert.equal(step.got, step.expect, `${step.name}: questScores[2]`);
	const wave = out.steps.at(-1);
	assert.equal(wave.killed, false, 'the spike wave leaves the 999-HP hero alive');
	await game.screenshot('tools/scratch/r055-r056-live.png');
	const errs = game.consoleErrors();
	assert.deepEqual(errs, [], `console errors: ${errs.join(' | ')}`);
	console.log('PASS R055/R056 questScores[2] sites live in the built game');
};
