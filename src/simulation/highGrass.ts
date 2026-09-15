/**
 * `HighGrass.trample` (Shattered Pixel Dungeon, v3.3.8) has a Huntress-only
 * two-step state: HIGH_GRASS becomes FURROWED_GRASS; a Huntress preserves that
 * furrow, while another hero clears it without running drop rolls.
 *
 * The two drop rolls that follow are gated on Java's `naturalismLevel`, the local variable
 * `HighGrass.trample` derives from a carried Sandals of Nature - so this module owns both
 * halves and the scene supplies the inputs. The four chance *coefficients* stay in MWL
 * (`sandals*Chance*` rows in `item-rules.mwl`) rather than being inlined here, because they
 * are the same numbers the artifact's own actions read; they are passed in as `rules` so this
 * stays a pure function of its inputs, the same split `simulation/defenderDamageCurves.ts` uses
 * for numbers that live in the port's data layer.
 */
export type HighGrassState = 'high' | 'furrowed' | 'plain';

/** Java's `naturalismLevel` as `HighGrass.trample` computes it: a *level*, not a boolean.
 *  `0` is "no Sandals of Nature carried" (the only case this port had before the artifact
 *  existed); a carried, uncursed pair is `itemLevel()+1`, i.e. 1..4 for the artifact's own
 *  0..3 levels; and `-1` means "carried but cursed", which suppresses both grass drops
 *  outright rather than merely scaling them (`naturalismLevel = -1` skips Java's whole
 *  `if (naturalismLevel >= 0)` drop block).
 *
 *  Java also forces `-1` on two level types this port does not model: a `MiningLevel` whose
 *  Blacksmith quest is `FUNGI` (and then only on a `Random.Int(3) != 0` roll - 1/3 of tramples
 *  still drop), and any `VaultLevel`. The mining branch here has no quest-type distinction and
 *  the port has no vault-tester area at all, so neither is reproduced - recorded in
 *  `PORT_COVERAGE.md` rather than silently dropped. */
export type NaturalismLevel = number;

/** `HighGrass.trample`'s two naturalism-scaled chances, or `null` when the drop block did not
 *  run at all - no drops on a Huntress's furrow step, and none on any step while a carried
 *  Sandals of Nature is cursed. */
export interface HighGrassDrops {
	/** `1/(25f - naturalismLevel*4f) * PetrifiedSeed.grassLootMultiplier()`: 1/25 with no
	 *  sandals, 1/9 at the artifact's maximum `naturalismLevel` of 4. */
	seedChance: number;
	/** `1/(6f - naturalismLevel/2f)`, halved on a GRASS-feeling floor: 1/6 with no sandals. */
	dewChance: number;
}

export interface HighGrassTrample {
	next: HighGrassState;
	rollDrops: boolean;
	/** `null` whenever `rollDrops` is false or naturalism suppressed the block. */
	drops: HighGrassDrops | null;
}

/** The four MWL-authored coefficients Java's loot block reads. */
export interface HighGrassLootRules {
	/** `sandalsSeedChanceBase` - Java's literal `25f`. */
	seedChanceBase: number;
	/** `sandalsSeedChancePerLevel` - Java's literal `4f` per naturalism level. */
	seedChancePerLevel: number;
	/** `sandalsDewChanceBase` - Java's literal `6f`. */
	dewChanceBase: number;
	/** `sandalsDewChanceLevelDivisor` - Java's literal `2f`, dividing naturalismLevel. */
	dewChanceLevelDivisor: number;
}

export interface HighGrassOptions {
	/** Java's `naturalismLevel` - see `NaturalismLevel`. */
	naturalismLevel?: NaturalismLevel;
	/** `Dungeon.level.feeling == Level.Feeling.GRASS`: grassy floors spawn half as much dew. */
	grassFeeling?: boolean;
}

/** Java's `PetrifiedSeed.grassLootMultiplier()` with no trinket equipped. This port has no
 *  trinket system at all (see `PORT_COVERAGE.md`), so the multiplier's identity case is the
 *  only one reachable here - named so the missing factor is visible rather than implicit. */
const GRASS_LOOT_MULTIPLIER = 1;

/**
 * `HighGrass.trample`'s drop block, without its RNG: on `rollDrops` the caller rolls
 * `Random.float() < seedChance` for a seed and `Random.float() < dewChance` for a dewdrop, in that
 * order. Java makes a *third* draw on a seed hit - `Random.float() <
 * PetrifiedSeed.stoneInsteadOfSeedChance()`, choosing a stone over a seed - which this port does not
 * make at all: it has no trinket system, so that chance is `0` (the trinket resolves to level -1 and
 * falls through to `default: return 0`), and skipping the draw is therefore outcome-identical to
 * making it. It is a stated reduction only in the sense that the draw is absent, not a changed roll.
 */
export function trampleHighGrass(
	state: HighGrassState,
	huntress: boolean,
	rules: HighGrassLootRules,
	options: HighGrassOptions = {},
): HighGrassTrample {
	if (state === 'plain') return { next: 'plain', rollDrops: false, drops: null };
	if (state === 'furrowed') return { next: huntress ? 'furrowed' : 'plain', rollDrops: false, drops: null };
	if (huntress) return { next: 'furrowed', rollDrops: false, drops: null };

	const level = options.naturalismLevel ?? 0;
	if (level < 0) return { next: 'plain', rollDrops: true, drops: null };
	let dewChance = 1 / (rules.dewChanceBase - level / rules.dewChanceLevelDivisor);
	if (options.grassFeeling) dewChance /= 2;
	return {
		next: 'plain',
		rollDrops: true,
		drops: {
			seedChance: (1 / (rules.seedChanceBase - level * rules.seedChancePerLevel)) * GRASS_LOOT_MULTIPLIER,
			dewChance,
		},
	};
}
