import type { AnyMonsterId, MonsterId } from '../monsters';
import type { SimulationRandom } from './random';
import type { SimulationRoguelike } from './roguelike';

export interface MonsterPopulationPlan {
	roster: AnyMonsterId[];
	count: number;
}

/**
 * `Bestiary.addRareMobs()`/`swapMobAlts()`/`getMobRotation()` plus
 * `RegularLevel.mobLimit()`. The scene consumes this plan for map-aware placement and actor
 * creation; roster composition stays independent of terrain and rendering.
 */
export function planMonsterPopulation(
	depth: number,
	baseRoster: readonly MonsterId[],
	largeFeeling: boolean,
	random: SimulationRandom,
	roguelike: SimulationRoguelike,
	/** `RatSkull.exoticChanceMultiplier()` (1 with none): scales every rotation alternative's 1/50. */
	altChanceMultiplier = 1,
): MonsterPopulationPlan {
	const rareMob: MonsterId | undefined = ({
		4: 'thief',
		9: 'bat',
		14: 'ghoul',
		19: 'succubus',
	} as Partial<Record<number, MonsterId>>)[depth];
	const altByBase: Partial<Record<MonsterId, AnyMonsterId>> = {
		rat: 'albino',
		gnoll: 'gnollExile',
		crab: 'hermitCrab',
		slime: 'causticSlime',
		thief: 'bandit',
		necromancer: 'spectralNecromancer',
		brute: 'armoredBrute',
		dm200: 'dm201',
		monk: 'senior',
		scorpio: 'acidic',
	};
	//Java's per-entry roll is `Random.Float() < 1/50 * RatSkull.exoticChanceMultiplier()`
	//(`MobSpawner.swapMobAlts`, tag `v3.3.8`); the multiplier is the carried Rat Skull's (1 with none).
	//The two gnoll/crab variants reuse their base AI and presentation; their authored stats
	//live in `monsters.mwl`, while the 1/50 rotation alternative is carried here.
	const roster = roguelike.rollRoster(
		baseRoster.map((value) => ({
			value,
			alternative: altByBase[value] ? { value: altByBase[value]!, chance: 1 / 50 * altChanceMultiplier } : undefined,
		})),
		rareMob ? [{ value: rareMob, chance: 0.025 }] : [],
	).roster as AnyMonsterId[];
	//Floor 1 spawns 8 pre-set mobs so the player can reach level 2
	//(`RegularLevel.createMobs`, tag `v3.3.8`); later floors use 3 + (depth % 5) +
	//`Int(3)` (`RegularLevel.mobLimit`), and LARGE takes the ceiling of 1.33x.
	//(`int(0, 3)` here is [min, max) like Java's `Int(3)` - see `random.ts`.)
	const baseCount = depth === 1 ? 8 : 3 + (depth % 5) + random.int(0, 3);
	return { roster, count: largeFeeling ? Math.ceil(baseCount * 1.33) : baseCount };
}
