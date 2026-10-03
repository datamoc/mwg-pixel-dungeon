import { Random, Roguelike } from 'mwg';
import type { Creature } from '../../combat';
import { runState } from '../../runState';
import { titleCase, t } from '../../i18n/index';
import { CENSER_GAS_NAME_KEY, CENSER_UNSET, censerAdvance, censerAfterGas, censerAimPoint, censerCellWeights, censerRefreshLeft, rollCenserGas, type CenserGas, type CenserRandom } from '../../simulation/chaoticCenser';
import { setGeneratorTrinkets } from '../../items/generator';
import { Feeling } from '../../spdLevelGen/regularPainter';
import { nextQueuedFeeling, setLevelGenTrinkets, type FeelingQueue } from '../../spdLevelGen/trinketLevelGen';
import { TRINKETS, cloverAlterChance, exoticConsumableChance, parchmentCurseMultiplier, parchmentEnchantMultiplier, ferretEvasionMultiplier, censerAverageTurnsUntilGas, isTrinketId, mimicTeethStealthy, mossyOverrideLevelChance, trapMechanismOverrideLevelChance, trapMechanismRevealChance, shardLootMultiplier, newtMindVisionRange, saltHealthRegenMultiplier, saltHungerGainMultiplier, vialDelaysBurstHealing, vialMaxHealPerTurn, vialTotalHealMultiplier } from '../../simulation/trinkets';
import { tickChallengeArena } from './challengeArena';
import { tickDivineInspiration } from './divinePotion';
import { tickRespawner } from './respawner';
import type { DungeonScene } from '../dungeonScene';

/**
 * `Trinket.trinketLevel(Class)` (`items/trinkets/Trinket.java:46-57`, tag `v3.3.8`): the level of the carried
 * trinket of that kind, `-1` when none is - the "no trinket" identity every consumer falls back to.
 * `Belongings.getItem` returns the first match, so with duplicates the first carried copy decides.
 */
export function trinketLevelOf(scene: Pick<DungeonScene, 'bag'>, id: string): number {
	if (!isTrinketId(id)) return -1;
	const item = scene.bag.items.find((candidate) => candidate.id === id && candidate.quantity > 0);
	return item ? (item.level ?? 0) : -1;
}

/**
 * The trinket-derived stats the hero's combat state carries (`syncHeroFromStats` calls this last):
 * `FerretTuft.evasionMultiplier()` multiplies the defence roll (`Char.hit()`, `Char.java:681` - the same as
 * scaling the evasion it is drawn from) and `ThirteenLeafClover.alterHeroDamageChance()` is the chance a hero
 * damage roll is replaced by its max or min (`Hero.heroDamageIntRange`).
 */
export function applyTrinketStats(scene: DungeonScene): void {
	scene.hero.evasion *= ferretEvasionMultiplier(trinketLevelOf(scene, 'trinketFerretTuft'));
	scene.hero.cloverChance = cloverAlterChance(trinketLevelOf(scene, 'trinketThirteenLeafClover'));
}

const lastSignature = new WeakMap<object, string>();

/** A string of every carried trinket's level: changes exactly when a trinket is gained, lost or upgraded. */
function trinketSignature(scene: Pick<DungeonScene, 'bag' | 'hero'>): string {
	//plus the timed `MagicImmune` buff, whose expiry has to re-derive the hero's `magicImmune` flag too
	return TRINKETS.map((trinket) => trinketLevelOf(scene, trinket.id)).join(',') + (scene.hero.buffs['magicImmune'] !== undefined ? '|mi' : '');
}

/**
 * Once per hero turn: when the set of carried trinkets changed since the last turn (picked up, crafted,
 * upgraded, dropped, stolen), re-derive everything that reads them. Trinkets are consumed from many
 * places that cannot each tell when one appeared, so the change is detected here rather than at each
 * add/remove site.
 */
export function refreshTrinketState(scene: DungeonScene, turnCost = 1): void {
	tickChaoticCenser(scene, turnCost);
	tickChallengeArena(scene);
	tickDivineInspiration(scene);
	tickRespawner(scene, turnCost);
	const signature = trinketSignature(scene);
	if (lastSignature.get(scene) === signature) return;
	const first = !lastSignature.has(scene);
	lastSignature.set(scene, signature);
	syncGeneratorTrinkets(scene);
	//The very first look only needs a sync when a trinket is already carried (a loaded run); with none the hero's own
	//initial sync has already run.
	if (!first || signature.split(',').some((level) => level !== '-1')) scene.syncHeroFromStats();
}

const wellFedCarry = new WeakMap<object, number>();

/**
 * How many `WellFed.act()` ticks run this hero turn: Java spends `TICK / SaltCube.hungerGainMultiplier()` per act
 * (`WellFed.java:62`), so a carried salt cube slows the buff to one tick every `1 / multiplier` turns without
 * lessening the heal. The fraction carries between turns; with no cube the answer is always 1.
 */
export function wellFedTicksThisTurn(scene: DungeonScene): number {
	const multiplier = saltHungerGainMultiplier(trinketLevelOf(scene, 'trinketSaltCube'));
	if (multiplier === 1) return 1;
	const carry = (wellFedCarry.get(scene) ?? 0) + multiplier;
	const ticks = Math.floor(carry);
	wellFedCarry.set(scene, carry - ticks);
	return ticks;
}

/** `Hunger.act()`'s `hungerDelay /= SaltCube.hungerGainMultiplier()`. */
export function saltHungerDelayDivisor(scene: DungeonScene): number {
	return saltHungerGainMultiplier(trinketLevelOf(scene, 'trinketSaltCube'));
}

/** `Regeneration.act()`'s `delay /= SaltCube.healthRegenMultiplier()`, "turned off while regen is disabled" (a `LockedFloor`). */
export function saltRegenDelayDivisor(scene: DungeonScene, floorLocked: boolean): number {
	return floorLocked ? 1 : saltHealthRegenMultiplier(trinketLevelOf(scene, 'trinketSaltCube'));
}

/** `VialOfBlood.maxHealPerTurn()` for the hero (`HT` with no vial). */
export function vialMaxHealPerTurnOf(scene: DungeonScene): number {
	return vialMaxHealPerTurn(trinketLevelOf(scene, 'trinketVialOfBlood'), scene.hero.maxHp);
}

/**
 * `Healing.applyVialEffect()` (`Healing.java:93-98`, tag `v3.3.8`): with a vial carried the heal pool is
 * flagged limited (its tick is capped at `maxHealPerTurn`) and scaled by `totalHealMultiplier`. The port keeps
 * one Healing pool (`healingLeft` + companions), so the flag lives beside it and clears when the pool does.
 */
export function applyVialEffect(scene: DungeonScene): void {
	const level = trinketLevelOf(scene, 'trinketVialOfBlood');
	scene.healingLimited = vialDelaysBurstHealing(level);
	if (scene.healingLimited) scene.healingLeft = Math.round(scene.healingLeft * vialTotalHealMultiplier(level));
}

/**
 * `Healing.setHeal(amount, 0, vialMaxHealPerTurn)` + `applyVialEffect()`: the burst heals (`WaterOfHealth`, a
 * multi-drop `Dewdrop.consumeDew`) become a capped heal-over-time while a vial is carried. Returns false with no
 * vial, leaving the caller to heal instantly as Java does.
 */
export function vialDelayedHeal(scene: DungeonScene, amount: number): boolean {
	const level = trinketLevelOf(scene, 'trinketVialOfBlood');
	if (!vialDelaysBurstHealing(level)) return false;
	scene.healingLeft = Math.max(scene.healingLeft, amount);
	scene.healingFlat = Math.max(scene.healingFlat, vialMaxHealPerTurnOf(scene));
	applyVialEffect(scene);
	return true;
}

/** The Waterskin's `dropsNeeded /= VialOfBlood.totalHealMultiplier()` (`Waterskin.java:97-99`), only when more than one drop is needed. */
export function vialDropsNeeded(scene: DungeonScene, dropsNeeded: number): number {
	const level = trinketLevelOf(scene, 'trinketVialOfBlood');
	return dropsNeeded > 1.01 && vialDelaysBurstHealing(level) ? dropsNeeded / vialTotalHealMultiplier(level) : dropsNeeded;
}

/**
 * `Level.updateFieldOfView()`'s `mindVisRange = max(mindVisRange, EyeOfNewt.mindVisionRange())`: every mob within
 * `2 + level` (Chebyshev) is revealed even without line of sight (`Level.java:1425-1442`). Mimics that are still
 * stealthy stay hidden; NPCs are not "mobs" of that loop here.
 */
export function eyeOfNewtSenses(scene: DungeonScene, creature: { x: number; y: number; isNPC?: boolean; kind?: string; revealed?: boolean }): boolean {
	const range = newtMindVisionRange(trinketLevelOf(scene, 'trinketEyeOfNewt'));
	if (range < 1 || creature.isNPC || isStealthyMimic(scene, creature)) return false;
	return Math.max(Math.abs(creature.x - scene.hero.x), Math.abs(creature.y - scene.hero.y)) <= range;
}

/** `Heap.hidden` (`Heap.java:80`, `ItemSprite.java:236`): the heap is flagged and its sprite drawn at 15% alpha. */
export function markHeapHidden(scene: DungeonScene, heap: { id: string; hidden?: boolean }): void {
	heap.hidden = true;
	const sprite = scene.spriteFor.get(heap.id);
	if (sprite) sprite.alpha = 0.15;
}

/**
 * `Mimic.stealthy()` for an unrevealed (still NEUTRAL) mimic while a Mimic Tooth is carried: the mimic is skipped by
 * mind vision and the Eye of Newt's sense (`Level.java:1405,1435`, `Dungeon.java:944`). Java stamps `stealthy` onto
 * the mimic when it is created; the port reads the tooth when asked, so a tooth picked up later also hides mimics
 * already on the floor (a stated simplification).
 */
export function isStealthyMimic(scene: DungeonScene, creature: { kind?: string; mimicRevealed?: boolean; ebonyMimic?: boolean }): boolean {
	//`EbonyMimic.stealthy()` is always true
	return (creature.kind === 'mimic' || creature.kind === 'crystalMimic') && creature.mimicRevealed === false
		&& (creature.ebonyMimic === true || mimicTeethStealthy(trinketLevelOf(scene, 'trinketMimicTooth')));
}

/**
 * Pushes the carried Parchment Scrap and Exotic Crystals into the module-level generator (`setGeneratorTrinkets`),
 * which has no scene to ask. Called whenever the carried trinkets change and right before a floor's items roll.
 */
export function syncGeneratorTrinkets(scene: DungeonScene): void {
	const parchment = trinketLevelOf(scene, 'trinketParchmentScrap');
	setGeneratorTrinkets({
		enchantMultiplier: parchmentEnchantMultiplier(parchment),
		curseMultiplier: parchmentCurseMultiplier(parchment),
		exoticChance: exoticConsumableChance(trinketLevelOf(scene, 'trinketExoticCrystals')),
	});
}

/**
 * `ShardOfOblivion.lootChanceMultiplier() - 1` (`ShardOfOblivion.java:158-185`), added to `Mob.lootChance()`'s `dropBonus`:
 * +20% per unidentified worn item (weapon, armor, ring) plus each present use-tracker buff (`WandUseTracker`, `ThrownUseTracker`) - Java also
 * counts the misc slot, which has no port model - capped at `level + 1` items.
 */
export function shardLootBonus(scene: DungeonScene): number {
	const level = trinketLevelOf(scene, 'trinketShardOfOblivion');
	if (level < 0) return 0;
	const unidentified = (scene.weaponIdentified ? 0 : 1) + (scene.armorIdentified ? 0 : 1)
		+ (scene.equippedRing && scene.equippedRing.identified !== true ? 1 : 0)
		+ (scene.hero.buffs['wandUseTracker'] !== undefined ? 1 : 0)
		+ (scene.hero.buffs['thrownUseTracker'] !== undefined ? 1 : 0);
	return shardLootMultiplier(level, unidentified) - 1;
}

type FeelingHolder = { levelFeels?: boolean[]; shuffles?: number };

/** Each trinket persists its own shuffled queue on its bag entry (`levelFeels` / `shuffles`, Java's bundle fields). */
function feelingQueueOf(scene: DungeonScene, id: string): FeelingQueue | undefined {
	const item = scene.bag.items.find((candidate) => candidate.id === id && candidate.quantity > 0) as (typeof scene.bag.items[number] & FeelingHolder) | undefined;
	if (!item) return undefined;
	const holder = item;
	return {
		get feels() { return (holder.levelFeels ??= []); },
		get shuffles() { return holder.shuffles ?? 0; },
		set shuffles(value: number) { holder.shuffles = value; },
	};
}

/**
 * Runs `generate` (a floor build) with the carried Mossy Clump / Trap Mechanism visible to the level generator
 * (`spdLevelGen/trinketLevelGen.ts`), then clears them so nothing else sees stale state.
 */
export function withLevelGenTrinkets<T>(scene: DungeonScene, generate: () => T): T {
	const mossy = trinketLevelOf(scene, 'trinketMossyClump');
	const trap = trinketLevelOf(scene, 'trinketTrapMechanism');
	if (mossy < 0 && trap < 0) return generate();
	const seed = scene.runSeedLong;
	setLevelGenTrinkets({
		mossyChance: mossyOverrideLevelChance(mossy),
		trapChance: trapMechanismOverrideLevelChance(trap),
		trapRevealChance: trapMechanismRevealChance(trap),
		nextMossyFeeling: () => (nextQueuedFeeling(feelingQueueOf(scene, 'trinketMossyClump')!, 2, seed) ? Feeling.GRASS : Feeling.WATER),
		nextTrapFeeling: () => (nextQueuedFeeling(feelingQueueOf(scene, 'trinketTrapMechanism')!, 3, seed) ? Feeling.TRAPS : Feeling.CHASM),
	});
	try { return generate(); } finally { setLevelGenTrinkets(null); }
}

// --- ChaoticCenser ------------------------------------------------------------------------------------

interface CenserRuntime {
	left: number;
	/** Turns until the next `CenserGasTracker.act()` (Java spends `NormalIntRange(1, 3)` per act). */
	untilTick: number;
	/** The `GasSpewer` buff: executes when the hero's current action ends, i.e. at the start of the next hero turn. */
	spew?: { x: number; y: number; gas: CenserGas; quantity: number; depth: number };
}
const censerRuntime = new WeakMap<object, CenserRuntime>();

const censerRandom: CenserRandom = {
	intRange: (lo, hi) => Random.int(lo, hi + 1),
	chances: (weights) => Random.weighted(weights) ?? -1,
	element: (list) => Random.element(list)!,
};

/** `TargetHealthIndicator.instance.target()` for the hero: the enemy it last attacked or aimed at (`QuickSlotButton.target`). */
export function noteHeroTarget(scene: DungeonScene, target: Creature | undefined): void {
	if (target && !target.isHero && !target.isAlly && !target.isNPC) scene.censerTarget = target;
}

/** `target.isActive() && alignment == ENEMY && state != PASSIVE`, and the indicator being visible (the target is in view). */
function censerTargetValid(scene: DungeonScene, target: Creature | null): target is Creature {
	if (!target || target.hp <= 0 || target.isAlly || target.isNPC || !scene.creatures.includes(target)) return false;
	//PASSIVE mobs: statues until attacked and a still-hidden mimic.
	if (target.kind === 'statue' || target.kind === 'armoredStatue' || isStealthyMimic(scene, target) || target.mimicRevealed === false) return false;
	return scene.fov.isVisible(target.x, target.y);
}

/** `GasSpewer.act()`: seeds the blob at the chosen cell. */
function executeCenserSpew(scene: DungeonScene, spew: NonNullable<CenserRuntime['spew']>): void {
	if (spew.depth !== scene.depth) return; //Java: only on the floor it was aimed on
	const blob = scene[spew.gas];
	blob.seed(spew.x, spew.y, spew.quantity);
	//`CorrosiveGas.setStrength(2 + Dungeon.scalingDepth()/5, ChaoticCenser.class)`: the potion's own starting strength.
	if (spew.gas === 'corrosiveGas') scene.corrosiveGasStrength = 2 + Math.floor(scene.depth / 5);
	runState.audio.cue('gas', 0.5);
}

/** `ChaoticCenser.produceGas(target)`: pick the gas and a visible cell 2-6 steps away near the target, and queue the spew. */
function produceCenserGas(scene: DungeonScene, rt: CenserRuntime, target: Creature, level: number): boolean {
	const picked = rollCenserGas(level, scene.regenOn(), censerRandom);
	if (!picked) return false;
	const distance = scene.pathfinder.distanceMap({ x: scene.hero.x, y: scene.hero.y });
	const cells: { x: number; y: number }[] = [];
	for (let y = 0; y < scene.level.height; y++) for (let x = 0; x < scene.level.width; x++) {
		const steps = distance[y * scene.level.width + x] ?? -1;
		if (steps >= 2 && steps <= 6 && scene.fov.isVisible(x, y)) cells.push({ x, y });
	}
	if (cells.length === 0) return false;
	const aim = censerAimPoint(target, scene.hero, (x, y) => !scene.level.inside(x, y) || !scene.level.passable(x, y), Roguelike.neighbourOffsets(8));
	const weights = censerCellWeights(cells, aim);
	const index = Random.weighted(weights);
	if (index === null) return false;
	const cell = cells[index]!;
	rt.spew = { x: cell.x, y: cell.y, gas: picked.gas, quantity: picked.quantity, depth: scene.depth };
	scene.say(t('items.trinkets.chaoticcenser.spew', { 0: titleCase(t(CENSER_GAS_NAME_KEY[picked.gas])) }), 'warning');
	scene.travelTarget = null; //`Dungeon.hero.interrupt()`
	return true;
}

/**
 * `CenserGasTracker.act()` (`ChaoticCenser.java:80-130`), run per hero turn for `elapsed` turns: a countdown (`left`, re-rolled around
 * `300 / (level + 1)` turns) reaches zero, and with a valid visible enemy targeted the censer queues a gas that lands at the end of
 * the hero's action. The tracker itself ticks every `NormalIntRange(1, 3)` turns. Not persisted: a loaded run re-rolls its countdown.
 */
export function tickChaoticCenser(scene: DungeonScene, elapsed: number): void {
	let rt = censerRuntime.get(scene);
	if (!rt) { rt = { left: CENSER_UNSET, untilTick: 0 }; censerRuntime.set(scene, rt); }
	if (rt.spew) { executeCenserSpew(scene, rt.spew); rt.spew = undefined; }
	const level = trinketLevelOf(scene, 'trinketChaoticCenser');
	if (level < 0) { rt.left = CENSER_UNSET; return; }
	const avg = censerAverageTurnsUntilGas(level);
	rt.untilTick -= elapsed;
	for (let guard = 0; rt.untilTick <= 0 && guard < 8; guard++) {
		rt.left = censerRefreshLeft(rt.left, avg, censerRandom);
		if (rt.left <= 0 && censerTargetValid(scene, scene.censerTarget) && produceCenserGas(scene, rt, scene.censerTarget, level)) {
			rt.left = censerAfterGas(rt.left, avg, censerRandom);
		}
		const delay = Random.normalRange(1, 3);
		rt.left = censerAdvance(rt.left, delay, avg);
		rt.untilTick += delay;
	}
}
