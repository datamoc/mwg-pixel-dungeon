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
): MonsterPopulationPlan {
	const rareMob: MonsterId | undefined = ({
		4: 'thief',
		9: 'bat',
		14: 'ghoul',
		19: 'succubus',
	} as Partial<Record<number, MonsterId>>)[depth];
	const altByBase: Partial<Record<MonsterId, AnyMonsterId>> = {
		rat: 'albino',
		slime: 'causticSlime',
		thief: 'bandit',
		necromancer: 'spectralNecromancer',
		brute: 'armoredBrute',
		dm200: 'dm201',
		monk: 'senior',
		scorpio: 'acidic',
	};
	const roster = roguelike.rollRoster(
		baseRoster.map((value) => ({
			value,
			alternative: altByBase[value] ? { value: altByBase[value]!, chance: 1 / 50 } : undefined,
		})),
		rareMob ? [{ value: rareMob, chance: 0.025 }] : [],
	).roster as AnyMonsterId[];
	// Floor 1 is the tutorial's fixed eight mobs; later floors use 3 + (depth % 5) + Int(3).
	// LARGE increases the cap by 1.33x, matching the Java mob-limit rule.
	const baseCount = depth === 1 ? 8 : 3 + (depth % 5) + random.int(0, 3);
	return { roster, count: largeFeeling ? Math.ceil(baseCount * 1.33) : baseCount };
}
