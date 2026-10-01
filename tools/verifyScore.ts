// Pins R015 (the endgame component score, tag `v3.3.8`): `Rankings.calculateScore()`
// sums progress (lvl x deepest x 65, cap 50,000), treasure (gold collected plus
// held-item value, cap 20,000), exploration (each floor's fraction times floors x 50),
// the positive boss/quest sums - with the CorpseDust `questScores[1] = 2000` override -
// times the win multiplier (1, 2 on a win, 2.5 ascended) and the challenge multiplier,
// truncated like Java's `int` total. Run through `npm run test:score`.
import {
	addBossScore,
	addQuestScore,
	calculateScore,
	heldItemValue,
	noteFloorExplored,
	noteGoldCollected,
	scoreStateFor,
	setQuestScore,
	type ScoreInput,
} from '../src/rankings';

let failed = 0;
const check = (name: string, ok: boolean, detail = ''): void => {
	console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok || !detail ? '' : ` - ${detail}`}`);
	if (!ok) failed++;
};

function base(over: Partial<ScoreInput> = {}): ScoreInput {
	return {
		heroLevel: 1,
		deepestFloor: 1,
		goldCollected: 0,
		heldItemValue: 0,
		corpseDustKept: false,
		floorsExplored: {},
		questScores: [0, 0, 0, 0, 0],
		bossScores: [0, 0, 0, 0, 0],
		gameWon: false,
		ascended: false,
		chalMultiplier: 1,
		...over,
	};
}

//Progress: level x deepest x 65, capped at 50,000.
check('progress multiplies level, depth and 65',
	calculateScore(base({ heroLevel: 10, deepestFloor: 5 })).progress === 3250);
check('progress caps at 50000',
	calculateScore(base({ heroLevel: 30, deepestFloor: 26 })).progress === 50000);

//Treasure: gold collected plus held value, capped at 20,000.
check('treasure sums gold and held value',
	calculateScore(base({ goldCollected: 900, heldItemValue: 100 })).treasure === 1000);
check('treasure caps at 20000',
	calculateScore(base({ goldCollected: 19000, heldItemValue: 5000 })).treasure === 20000);

//Exploration: each floor's fraction times floors x 50, rounded per floor.
check('explore weights fractions by floor count',
	calculateScore(base({ floorsExplored: { 1: 1, 2: 0.5 } })).explore === 150);
check('an empty floor table explores nothing',
	calculateScore(base()).explore === 0);

//Only positive quest/boss entries count.
check('quest sums positives only',
	calculateScore(base({ questScores: [-50, 1000, 0, 0, 0] })).quest === 1000);
check('boss sums positives only',
	calculateScore(base({ bossScores: [-100, 0, 500, 0, 0] })).boss === 500);

//The win multiplier: 1 lost, 2 won, 2.5 ascended.
check('a loss scores times one',
	calculateScore(base({ goldCollected: 100 })).total === 165);
check('a win doubles',
	calculateScore(base({ goldCollected: 100, gameWon: true })).total === 330);
check('an ascent scores two and a half',
	calculateScore(base({ goldCollected: 100, gameWon: true, ascended: true })).total === 412);
check('the challenge multiplier applies',
	calculateScore(base({ goldCollected: 100, chalMultiplier: 1.25 })).total === 206);

//The final truncation is Java's `int`, not `Math.round`: 65 x 2.5 = 162.5 floors to 162.
check('the total truncates like Java',
	calculateScore(base({ gameWon: true, ascended: true })).total === 162);

//CorpseDust kept at depth 10+ overrides questScores[1] with 2000, ignoring penalties,
//without mutating the run state - and stays off shallower.
{
	const questScores = [0, -100, 0, 0, 0];
	const kept = calculateScore(base({ questScores, corpseDustKept: true, deepestFloor: 12 }));
	check('corpse dust overrides questScores[1]', kept.quest === 2000);
	check('the override leaves run state alone', questScores[1] === -100);
	check('the override needs depth 10',
		calculateScore(base({ questScores, corpseDustKept: true, deepestFloor: 9 })).quest === 0);
}

//Held value: a staff-shaped weaponReward is worthless (`MagesStaff.value() == 0`),
//ordinary belongings are worth their `value()`, unknown ids nothing.
check('an embedded staff values zero',
	heldItemValue([{ id: 'weaponReward', quantity: 1, identified: true, tier: 1, level: 0, sourceClass: 'MagesStaff' }]) === 0);
check('ordinary belongings hold value',
	heldItemValue([{ id: 'potion', quantity: 2, identified: true }]) > 0);
check('unknown ids are worthless',
	heldItemValue([{ id: 'no-such-item', quantity: 3, identified: true }]) === 0);

//The run-state mutators accumulate behind the scene key and ignore bad indices.
{
	const scene = {};
	addQuestScore(scene, 0, -50);
	addQuestScore(scene, 0, 1000);
	setQuestScore(scene, 3, 4000);
	setQuestScore(scene, 3, 4000);
	addBossScore(scene, 2, 100);
	noteGoldCollected(scene, 150);
	noteGoldCollected(scene, -5);
	noteFloorExplored(scene, 3, 0.75);
	noteFloorExplored(scene, 3, 2);
	addQuestScore(scene, 9, 500);
	const state = scoreStateFor(scene);
	check('quest writes accumulate', state.questScores[0] === 950);
	check('imp-style set assigns', state.questScores[3] === 4000);
	check('boss writes land', state.bossScores[2] === 100);
	check('gold only counts gains', state.goldCollected === 150);
	check('explore clamps to one', state.floorsExplored[3] === 1);
	check('bad indices are ignored', state.questScores.length === 5 && state.bossScores.length === 5);
}

if (failed > 0) {
	console.error(`${failed} score check(s) failed`);
	process.exit(1);
}
console.log('verifyScore: OK');
