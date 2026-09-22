/**
 * DriedRose's own rules, split out of the scene so they can be checked without a live game - the
 * same split `items/sandals.ts`, `items/talisman.ts` and `items/shopPricing.ts` use. Every formula
 * here is `DriedRose.java` (tag `v3.3.8`) plus the one `RegularLevel.java` petal rule that feeds
 * the artifact; the scene owns the summon, the ally, the aiming and the floor drops.
 *
 * The artifact is a two-part one: a charge clock that raises a `GhostHero` ally (its `AC_SUMMON`),
 * and a petal economy that levels the rose itself (`upgrade()`). While the ghost lives the clock heals
 * it instead of charging, which is why the two halves share one `partialCharge`.
 *
 * The summon/direct flow itself lives here too, behind `RoseFlowContext` - the file-size
 * refactor's thirteenth extraction, behavior-identical.
 */
import { Random, Roguelike } from 'mwg';
import { mwlItemEffectValue } from '../mwlContent';

export type RoseItem = {
	level?: number;
	/** Java's `charge` (an int) and `partialCharge` (the float build-up toward the next one), the
	 *  same pair `Artifact.java` gives every artifact. */
	charge?: number;
	partialCharge?: number;
	cursed?: boolean;
	/** Java's `droppedPetals`: how many petals this run has already dropped, capped at 11, and the
	 *  input the per-floor drop count is computed from. */
	droppedPetals?: number;
};

/** `DriedRose`'s constructor block: `levelCap = 10` and `charge = chargeCap = 100` (unlike every
 *  other artifact here, the rose starts *full*). */
export function roseLevelCap(): number {
	return mwlItemEffectValue('rose', 'levelCap');
}

export function roseChargeCap(): number {
	return mwlItemEffectValue('rose', 'chargeCap');
}

/** `GhostHero.updateRose()`: `HT = 20 + 8*rose.level()` - the whole of the ghost's durability
 *  curve, which is what the petals buy (8 HP each, per the 0.7.x changelog's own wording). */
export function roseGhostMaxHp(level: number): number {
	return mwlItemEffectValue('rose', 'ghostHpBase') + mwlItemEffectValue('rose', 'ghostHpPerLevel') * level;
}

/** `GhostHero.attackSkill()`: "same accuracy as the hero" - `Dungeon.hero.lvl + 9`. */
export function roseGhostAttackSkill(heroLevel: number): number {
	return heroLevel + mwlItemEffectValue('rose', 'ghostAttackSkillOffset');
}

/** `GhostHero.updateRose()`: "same dodge as the hero" - `Dungeon.hero.lvl + 4`. */
export function roseGhostDefenseSkill(heroLevel: number): number {
	return heroLevel + mwlItemEffectValue('rose', 'ghostDefenseSkillOffset');
}

/** `GhostHero.damageRoll()` with no weapon equipped: `Random.NormalIntRange(0, 5)`. Java's
 *  weapon branch is Not ported - this port has no ally-equipment model (see `PORT_COVERAGE.md`),
 *  so a rose here always fights bare-handed. */
export function roseGhostDamageRange(): readonly [number, number] {
	return [mwlItemEffectValue('rose', 'ghostDamageMin'), mwlItemEffectValue('rose', 'ghostDamageMax')];
}

/** `DriedRose.ghostStrength()`: `13 + level()/2`, Java's integer division - the strength the
 *  ghost is treated as having when it wears equipment, so with no equipment model here it is
 *  reported rather than applied. */
export function roseGhostStrength(level: number): number {
	return mwlItemEffectValue('rose', 'ghostStrengthBase') + Math.floor(level / mwlItemEffectValue('rose', 'ghostStrengthLevelDivisor'));
}

export interface RoseRechargeInput {
	/** Whether a live `GhostHero` exists. Java tracks it as a field/actor id; the scene passes
	 *  whether its own ghost ally is still alive. */
	ghostAlive: boolean;
	/** The ghost's current and maximum HP, when one is alive - the heal half's inputs. */
	ghostHp?: number;
	ghostMaxHp?: number;
	ringMultiplier: number;
	magicImmune: boolean;
	/** Java's `Regeneration.regenOn()` - the scene's `regenOn()` (the boss-arena lock). */
	regenOn: boolean;
}

/** What one `roseRecharge.act()` tick did, for the caller's logging and for its own ghost HP. */
export interface RoseRechargeResult {
	ghostHealed: number;
	/** True when the trickle completed the charge (`charged` is logged once). */
	charged: boolean;
}

/**
 * `DriedRose.roseRecharge.act()` (tag `v3.3.8`). Two mutually exclusive halves:
 *
 * - **With a live ghost**, the rose does not charge at all. It heals the ghost
 *   `(ghost.HT / 500f) * ringMultiplier` per turn - "heals to full over 500 turns" - and the
 *   healing loop is `while (partialCharge > 1)`, *strictly* greater, so a partial sits at
 *   exactly 1.0 without ever paying out. A ghost already at full HP zeroes `partialCharge`
 *   outright instead.
 * - **With no ghost**, the trickle is `(1/5f) * ringMultiplier` per turn, i.e. 500 turns for the
 *   full 100 points, with the same strict `> 1` boundary and the same "reaching the cap zeroes
 *   the partial" ending.
 *
 * The cursed/`MagicImmune` guards wrap both halves. Java's cursed branch (a 1%-per-turn
 * `Wraith` spawn beside the hero) runs scene-side, next to this call - it needs the live
 * level and scheduler, which this pure function never sees.
 */
export function applyRoseRecharge(item: RoseItem, input: RoseRechargeInput): RoseRechargeResult {
	const result: RoseRechargeResult = { ghostHealed: 0, charged: false };
	if (item.cursed || input.magicImmune) return result;

	if (input.ghostAlive) {
		const maxHp = input.ghostMaxHp ?? 0;
		let hp = input.ghostHp ?? 0;
		if (hp < maxHp && input.regenOn) {
			let partial = (item.partialCharge ?? 0)
				+ (maxHp / mwlItemEffectValue('rose', 'ghostHealTurns')) * input.ringMultiplier;
			while (partial > 1) {
				partial -= 1;
				hp++;
				result.ghostHealed++;
				if (hp >= maxHp) {
					partial = 0;
					break;
				}
			}
			item.partialCharge = partial;
		} else {
			item.partialCharge = 0;
		}
		return result;
	}

	const chargeCap = roseChargeCap();
	let charge = item.charge ?? 0;
	if (charge >= chargeCap || !input.regenOn) return result;
	let partial = (item.partialCharge ?? 0)
		+ mwlItemEffectValue('rose', 'rechargePerTurn') * input.ringMultiplier;
	while (partial > 1) {
		partial -= 1;
		charge++;
		if (charge >= chargeCap) {
			charge = chargeCap;
			partial = 0;
			result.charged = true;
			break;
		}
	}
	item.charge = charge;
	item.partialCharge = partial;
	return result;
}

/** Why `AC_SUMMON` cannot run right now, in Java's own check order (`execute()`'s ladder):
 *  `quest` is the `Ghost.Quest.completed()` gate (which shows the item window instead of an
 *  error), then an already-live ghost, then the charge, then the curse. `no_space` is the scene's
 *  own outcome, not a gate: Java has the same line when no neighbour is free. */
export type RoseSummonGate = 'ok' | 'quest' | 'spawned' | 'no_charge' | 'cursed' | 'missing';

export function roseSummonGate(item: RoseItem | undefined, questComplete: boolean, ghostAlive: boolean, magicImmune: boolean): RoseSummonGate {
	if (!item) return 'missing';
	//`execute()` returns before anything else on `MagicImmune`, silently.
	if (magicImmune) return 'missing';
	if (!questComplete) return 'quest';
	if (ghostAlive) return 'spawned';
	if ((item.charge ?? 0) !== roseChargeCap()) return 'no_charge';
	if (item.cursed) return 'cursed';
	return 'ok';
}

/**
 * `RegularLevel.java`'s petal drop (tag `v3.3.8`): "aim to drop 1 petal every 2 floors",
 * `ceil((depth/2 - rose.droppedPetals) / 3)` petals per floor - with **integer** division inside
 * the `ceil`, exactly as Java writes it, and a hard stop at 11 petals dropped per run ("the
 * player may miss a single petal and still max their rose"). The gate is a carried, identified,
 * uncursed rose plus a completed Sad Ghost quest.
 */
export function rosePetalsNeeded(depth: number, droppedPetals: number): number {
	const behind = Math.floor(depth / 2) - droppedPetals;
	return Math.ceil(behind / 3);
}

/** Java's `rose.droppedPetals < 11` guard, as a count the caller can clamp to. */
export function rosePetalDropCap(): number {
	return mwlItemEffectValue('rose', 'petalDropCap');
}

/** `DriedRose.Petal.doPickUp()`'s two refusals and its success path: no rose at all is a warning
 *  that *blocks* the pickup; a rose already at `levelCap` spends the turn and keeps the petal on
 *  the floor; otherwise the petal levels the rose (`upgrade()`, which also heals a live ghost by
 *  8 and re-derives its HT). */
export type RosePetalPickup = 'no_rose' | 'no_room' | 'levelup' | 'maxlevel';

export function rosePetalPickup(item: RoseItem | undefined): RosePetalPickup {
	if (!item) return 'no_rose';
	if ((item.level ?? 0) >= roseLevelCap()) return 'no_room';
	return (item.level ?? 0) + 1 >= roseLevelCap() ? 'maxlevel' : 'levelup';
}

/** The summoned `GhostHero` as the summon pass sees it (the scene passes the live creature,
 *  so statting it here stats the real ally, the way the armband flow marks its victim). */
export interface RoseGhostView {
	sleeping?: boolean | undefined;
	maxHp: number;
	hp: number;
	accuracy: number;
	evasion: number;
	damage: number[];
	armor: number[];
	isNPC?: boolean | undefined;
	npcKind?: string | undefined;
}

/**
 * The Dried Rose's summon/direct flow, moved out of the scene behind this context the way the
 * sandals, talisman, chains, horn and armband flows moved before it - behavior-identical, with
 * the scene keeping one builder plus the `useRose` adapter the item-use router calls. The `t`
 * field is deliberately named `t` (bound to the real one) so the `t('...')` key audits keep
 * matching these call sites.
 */
export interface RoseFlowContext {
	readonly magicImmune: boolean;
	readonly heroPos: { x: number; y: number };
	readonly levelSize: { width: number; height: number };
	readonly sadGhostComplete: boolean;
	roseOf(instanceId?: string): RoseItem | undefined;
	roseTitle(instanceId?: string): string;
	openPicker(title: string, entries: { id: string; instanceId?: string; identified: boolean; quantity: number }[], onPick: (entry: { id: string; instanceId?: string }) => void): void;
	beginAim(opts: { range: number; requireLineOfSight: boolean; onConfirm: (cell: { x: number; y: number }) => void }): void;
	isGhostAlive(): boolean;
	clearDeadGhost(): void;
	isCellFree(x: number, y: number): boolean;
	spawnGhostAlly(at: { x: number; y: number }): RoseGhostView;
	setActiveGhost(ghost: RoseGhostView | null): void;
	activeGhost(): RoseGhostView | null;
	directAlly(ghost: RoseGhostView, cell: { x: number; y: number }, lines: { defend: string; follow: string; attack: string }): void;
	heroLevel(): number;
	get roseFirstSummon(): boolean;
	set roseFirstSummon(value: boolean);
	dispelInvisibility(): void;
	refresh(): void;
	spendTurn(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/** `DriedRose.execute()`'s summon/direct rows (`rose-summon`/`rose-direct` synthetic instance
 *  ids, the same trick the horn rows use), with Java's per-refusal ladder when both hide. */
export function useRoseFlow(ctx: RoseFlowContext, instanceId?: string): void {
	const rose = ctx.roseOf(instanceId);
	if (!rose) return;
	const ghostAlive = ctx.isGhostAlive();
	const summonEntry = 'rose-summon', directEntry = 'rose-direct';
	const canSummon = roseSummonGate(rose, ctx.sadGhostComplete, ghostAlive, ctx.magicImmune) === 'ok';
	const entries = [
		...(canSummon ? [{ id: 'rose', instanceId: summonEntry, identified: true, quantity: 1 }] : []),
		...(ghostAlive ? [{ id: 'rose', instanceId: directEntry, identified: true, quantity: 1 }] : []),
	];
	if (entries.length === 0) {
		//Java reports each refusal with its own line from `execute()`'s ladder; with no action
		//menu to hide the rows in, this port has to say which one applies. `quest` is the one
		//Java answers with the item window rather than a log line - the port logs the same real
		//`desc_no_quest` string, which is what that window shows.
		const gate = roseSummonGate(rose, ctx.sadGhostComplete, ghostAlive, ctx.magicImmune);
		ctx.say(ctx.t(gate === 'quest' ? 'items.artifacts.driedrose.desc_no_quest'
			: gate === 'spawned' ? 'items.artifacts.driedrose.spawned'
				: gate === 'cursed' ? 'items.artifacts.driedrose.cursed'
					: 'items.artifacts.driedrose.no_charge'), 'negative');
		return;
	}
	ctx.openPicker(ctx.roseTitle(instanceId), entries, (entry) => {
		if (entry.instanceId === summonEntry) summonRoseGhostFlow(ctx, instanceId);
		else if (entry.instanceId === directEntry) beginRoseDirectFlow(ctx);
	});
}

/** `DriedRose`'s summon: scan the 8 neighbours, raise the ghost, stat it, pay, uncloak. */
export function summonRoseGhostFlow(ctx: RoseFlowContext, instanceId?: string): void {
	const rose = ctx.roseOf(instanceId);
	if (!rose) return;
	ctx.clearDeadGhost();
	const gate = roseSummonGate(rose, ctx.sadGhostComplete, ctx.isGhostAlive(), ctx.magicImmune);
	if (gate !== 'ok') return;
	//Java's spawn-point scan: `PathFinder.NEIGHBOURS8` around the hero, free and either
	//`passable` or `avoid`. This port has no separate `avoid` array (the same simplification
	//`chainLocation` already states), so a single `passable` check stands in for both.
	const spawnPoints: { x: number; y: number }[] = [];
	for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
		const at = { x: ctx.heroPos.x + dx, y: ctx.heroPos.y + dy };
		if (ctx.isCellFree(at.x, at.y)) spawnPoints.push(at);
	}
	if (spawnPoints.length === 0) { ctx.say(ctx.t('items.artifacts.driedrose.no_space'), 'negative'); return; }
	const at = spawnPoints[Random.int(0, spawnPoints.length - 1)]!;
	const ghost = ctx.spawnGhostAlly(at);
	ghost.sleeping = false;
	//The `ghost` monster row is the Sad Ghost *NPC* (its sprite is the only thing this reuses),
	//and the spawner flags NPCs from that row - which would be fatal for an ally here, since
	//the creature-turn dispatcher checks `isNPC` and returns *before* it ever reaches the ally
	//branch. Java's `GhostHero` is a `DirectableAlly`, so both flags go.
	ghost.isNPC = false;
	ghost.npcKind = undefined;
	const level = rose.level ?? 0;
	ghost.maxHp = roseGhostMaxHp(level);
	ghost.hp = ghost.maxHp;
	ghost.accuracy = roseGhostAttackSkill(ctx.heroLevel());
	ghost.evasion = roseGhostDefenseSkill(ctx.heroLevel());
	ghost.damage = [...roseGhostDamageRange()];
	ghost.armor = [0, 0];
	ctx.setActiveGhost(ghost);
	rose.charge = 0;
	rose.partialCharge = 0;
	ctx.dispelInvisibility();
	ctx.say(ctx.t(ctx.roseFirstSummon ? 'items.artifacts.driedrose$ghosthero.appeared'
		: 'items.artifacts.driedrose$ghosthero.hello'), 'positive');
	ctx.roseFirstSummon = true;
	ctx.refresh();
	ctx.spendTurn();
}

/** The direct row's aimer: only a live ghost can be ordered. */
export function beginRoseDirectFlow(ctx: RoseFlowContext): void {
	if (!ctx.isGhostAlive()) return;
	ctx.beginAim({
		range: Math.max(ctx.levelSize.width, ctx.levelSize.height),
		requireLineOfSight: false,
		onConfirm: (cell) => directRoseGhostFlow(ctx, cell),
	});
	ctx.say(ctx.t('items.artifacts.driedrose$ghosthero.direct_prompt'), 'positive');
}

/** `DriedRose.GhostHero`'s own order lines: one of five random yells per order
 *  (`Random.IntRange(1, 5)`, so 1-5 inclusive). */
export function directRoseGhostFlow(ctx: RoseFlowContext, cell: { x: number; y: number }): void {
	const ghost = ctx.activeGhost();
	if (!ghost || ghost.hp <= 0) return;
	const line = (kind: string): string => `items.artifacts.driedrose$ghosthero.${kind}_${Random.int(1, 6)}`;
	ctx.directAlly(ghost, cell, {
		defend: line('directed_position'),
		follow: line('directed_follow'),
		attack: line('directed_attack'),
	});
}
