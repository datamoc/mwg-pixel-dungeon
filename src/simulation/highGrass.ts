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

/**
 * `trampleHighGrass`'s apply half (plus the `plantBloomingGrass` sibling below),
 * moved here verbatim from the scene as the file-size refactor's thirty-third
 * extraction, behavior-identical. Zero runtime imports (the simulation confinement
 * rule): terrain ids arrive as values, the three rolls arrive scripted, spawns and
 * the naturalism charge arrive as callbacks, and message keys stay keys for the
 * scene to translate. The scene keeps the one-line adapters plus a builder.
 */
export interface HighGrassApplyContext {
	readonly hero: { buffs: { invisibility?: number | undefined } };
	readonly heroClass: string;
	readonly talentRank: (id: string) => number;
	readonly furrowedGrass: Set<number>;
	readonly level: {
		readonly width: number;
		readonly height: number;
		get(x: number, y: number): number;
		set(x: number, y: number, terrain: number): void;
		index(x: number, y: number): number;
	};
	readonly highGrassTerrain: number;
	readonly grassTerrain: number;
	readonly naturalismLevel: number;
	readonly grassFeeling: boolean;
	readonly lootRules: HighGrassLootRules;
	readonly chargeNaturalism: () => void;
	/** `null` unless the worn glyph is camouflage, else the computed meld duration. */
	readonly camouflageDuration: number | null;
	readonly grantShield: (amount: number, cap: number) => void;
	readonly afterTerrainChange: (x: number, y: number) => void;
	readonly depth: number;
	get natureBerriesDropped(): number;
	set natureBerriesDropped(dropped: number);
	/** Scripted rolls: `Random.chance` in play, a queue in the suite. */
	readonly rollChance: (p: number) => boolean;
	readonly rollInt: (min: number, max: number) => number;
	readonly drawSeedClass: () => string;
	readonly spawnDrop: (kind: 'seed' | 'dewdrop' | 'food' | 'berry', x: number, y: number, seedClass?: string) => void;
	readonly say: (key: string, level: 'positive' | 'negative') => void;
	readonly isBloomGround: (terrain: number) => boolean;
	readonly isPlanted: (cell: number) => boolean;
}

export function applyHighGrassTrample(context: HighGrassApplyContext, x: number, y: number): void {
	const cell = context.level.index(x, y);
	const state: HighGrassState = context.furrowedGrass.has(cell)
		? 'furrowed'
		: context.level.get(x, y) === context.highGrassTerrain ? 'high' : 'plain';
	const trample = trampleHighGrass(state, context.heroClass === 'huntress', context.lootRules, {
		naturalismLevel: context.naturalismLevel,
		grassFeeling: context.grassFeeling,
	});
	if (state === 'plain') return;
	//`SandalsOfNature.Naturalism.charge()` runs on every trampled high-grass cell, ahead of the
	//drop rolls, so a trample that rolls nothing still banks its charge. Its own guard is
	//`cursed || MagicImmune`, which is *not* the guard the drop block uses (`isCursed()`, which
	//MagicImmune clears) - the two disagree for a cursed pair under AntiMagic, in Java too.
	context.chargeNaturalism();
	if (trample.next === 'furrowed') {
		context.furrowedGrass.add(cell);
		// The compact live terrain keeps the high-grass collision/feature code active;
		// the separate set carries Java's raw FURROWED_GRASS distinction through saves.
		return;
	}
	context.furrowedGrass.delete(cell);

	context.level.set(x, y, context.grassTerrain);
	//Camouflage.activate(): trampling high grass while wearing the glyph prolongs
	//Invisibility for round((3 + lvl/2) x arcana) - keep-max, matching Buff.prolong().
	//Java also plays its MELD sound when the cell is in FOV; there is no per-effect
	//audio seam here, so the log line below stands in for that feedback.
	if (context.camouflageDuration !== null) {
		context.hero.buffs['invisibility'] = Math.max(context.hero.buffs['invisibility'] ?? 0, context.camouflageDuration);
		context.say('port.log.camouflage', 'positive');
	}
	if (context.heroClass === 'huntress' && context.talentRank('natures_aid') > 0) context.grantShield(context.rollInt(0, 3), 2);
	context.afterTerrainChange(x, y);

	if (!trample.rollDrops) return;
	//The berry roll comes *first*, which is where Java draws it - rolling seed then dew then
	//berry moved the whole stream for a Huntress carrying that talent.
	const bountyRank = context.talentRank('natures_bounty');
	if (context.heroClass === 'huntress' && bountyRank > 0) {
		const berriesAvailable = 2 + 2 * bountyRank - context.natureBerriesDropped;
		if (berriesAvailable > 0) {
			let targetFloor = 2 + 2 * bountyRank - berriesAvailable;
			targetFloor += targetFloor >= 5 ? 3 : 2;
			const chance = context.depth > targetFloor ? 1 / 10 : context.depth === targetFloor ? 1 / 30 : 1 / 90;
			if (context.rollChance(chance)) {
				context.natureBerriesDropped++;
				context.spawnDrop('berry', x, y);
			}
		}
	}
	//The two loot rolls, at the naturalism-scaled odds `trampleHighGrass` computed: 1/25
	//for a seed and 1/6 for a dewdrop with no footwear carried, rising to 1/9 and 1/4 at the
	//artifact's +3, and `drops === null` (a cursed pair) suppressing both outright.
	const drops = trample.drops;
	if (!drops) return;
	const seedDropped = context.rollChance(drops.seedChance);
	if (seedDropped) context.spawnDrop('seed', x, y, context.drawSeedClass());
	if (context.rollChance(drops.dewChance)) context.spawnDrop('dewdrop', x, y);
	//HighGrass.trample()'s real Nature's Bounty: NOT a dew-chance boost (that guess was
	//simply wrong, found auditing it against the real source) - it drops a depth-paced
	//Berry food item, capped at 2+2*rank total for the whole run (Talent.NatureBerriesDropped,
	//a CounterBuff that never resets mid-run). `targetFloor` is the depth the schedule wants
	//the next berry to land on; behind it the odds are generous (1/10), on it modest (1/30),
	//ahead of it stingy (1/90). The live item is now distinct; its two-berry
	//SeedCounter payout remains documented in eatFood().
}

/**
 * `Blooming.plantGrass()`: converts one plantable cell to high grass (see the Blooming
 * branch in `heroOnHit` for the terrain substitution) unless a grown plant already holds
 * it, then restitches exactly like `applyHighGrassTrample` does. Returns whether anything
 * was planted, so the caller can spend its plant budget.
 */
export function plantBloomingGrass(context: HighGrassApplyContext, x: number, y: number): boolean {
	if (x < 0 || y < 0 || x >= context.level.width || y >= context.level.height) return false;
	const kind = context.level.get(x, y);
	if (!context.isBloomGround(kind)) return false;
	const cell = context.level.index(x, y);
	if (context.isPlanted(cell)) return false;
	context.level.set(x, y, context.highGrassTerrain);
	context.afterTerrainChange(x, y);
	return true;
}
