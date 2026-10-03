import { t } from '../../i18n/index';
import {
	freshProgress, gainExperience, isReady, itemIdSpeedFactor, markReady, spendUse, type IdProgress, type PassiveIdKind,
} from '../../items/passiveId';
import { wandTypeFromSource } from '../../items/wands';
import type { Creature } from '../../combat';
import type { DungeonScene } from '../dungeonScene';
import { MWL_MISSILE_BY_CLASS } from '../../mwlContent';
import { trinketLevelOf } from './trinkets';

/**
 * Passive identification of worn gear (`items/passiveId.ts`, `Weapon.proc`, `Armor.proc`, `Ring.onHeroGainExp`, `Wand.wandUsed`,
 * `MissileWeapon.proc`, tag `v3.3.8`): per-item counters kept by item instance id, spent by landed melee hits (weapon), hits taken (armor) and
 * experience (ring, and the refill of the other two's pool). Wands count zaps the same way, keyed by wand class: this port folds a wielded wand
 * into one shared charge pool with no per-instance identified state, so the counter cannot live on the instance the way Java's `usesLeftToID`
 * does - it lives on the wand class (`wand:<type>` progress keys), matching this port's class-level identification architecture: the class
 * counter survives re-equips, and each wand class learns independently. Thrown missiles count landed throws the same way, keyed by missile
 * class (`missile:<sourceClass>`): Java keeps the counters on the parent stack and syncs the thrown child into it (`MissileWeapon.proc`), but
 * this port's stacks have no parent links, so the class key is the simplification - every stack of one class learns together.
 *
 * With a Shard of Oblivion carried (`ShardOfOblivion.passiveIDDisabled()`) nothing identifies by itself: the counter just reaches "ready", the player
 * is told once, and the Shard's Identify action (or a Scroll of Identify) finishes the job.
 *
 * Stated gaps: `Belongings.observe()`'s end-of-run ready marking is not tracked; the counters reset on nothing (Java's `reset()` on an upgrade
 * is not applied).
 */
const progressByScene = new WeakMap<object, Map<string, IdProgress>>();

export function idProgressFor(scene: object): Map<string, IdProgress> {
	let map = progressByScene.get(scene);
	if (!map) {
		map = new Map();
		progressByScene.set(scene, map);
	}
	return map;
}

/** `ShardOfOblivion.passiveIDDisabled()`. */
export const passiveIdDisabled = (scene: DungeonScene): boolean => trinketLevelOf(scene, 'trinketShardOfOblivion') >= 0;

interface WornGear { kind: PassiveIdKind; instanceId: string; identified: boolean; name: string }

/** Progress-map key for a wand class (`Wand.java` keeps the counters on the instance; this port keys them on the class). */
export const wandProgressKey = (wandType: string): string => `wand:${wandType}`;

/** Wand classes the run has identified (class-level, like `potionKindsKnownFor`). */
const identifiedWandTypesByScene = new WeakMap<object, Set<string>>();
export function wandTypesIdentifiedFor(scene: object): Set<string> {
	let known = identifiedWandTypesByScene.get(scene);
	if (!known) {
		known = new Set();
		identifiedWandTypesByScene.set(scene, known);
	}
	return known;
}

function worn(scene: DungeonScene, kind: PassiveIdKind): WornGear | undefined {
	if (kind === 'weapon') {
		return scene.weaponInstanceId ? { kind, instanceId: scene.weaponInstanceId, identified: scene.weaponIdentified, name: scene.itemDisplayName(scene.weaponId, scene.weaponIdentified, scene.weaponInstanceId) } : undefined;
	}
	if (kind === 'armor') {
		return scene.armorInstanceId ? { kind, instanceId: scene.armorInstanceId, identified: scene.armorIdentified, name: scene.itemDisplayName(scene.armorId, scene.armorIdentified, scene.armorInstanceId) } : undefined;
	}
	if (kind === 'wand') {
		const type = scene.wandType;
		if (!type) return undefined;
		const identified = wandTypesIdentifiedFor(scene).has(type);
		return { kind, instanceId: wandProgressKey(type), identified, name: scene.itemDisplayName('wand', identified, undefined) };
	}
	const ring = scene.equippedRing;
	return ring?.instanceId ? { kind, instanceId: ring.instanceId, identified: ring.identified !== false, name: scene.itemDisplayName(ring.id, ring.identified !== false, ring.instanceId) } : undefined;
}

function speedFactor(scene: DungeonScene, kind: PassiveIdKind): number {
	return itemIdSpeedFactor(kind, {
		adventurers: scene.talentRank('adventurers_intuition'), veterans: scene.talentRank('veterans_intuition'), thiefs: scene.talentRank('thiefs_intuition'),
		scholars: scene.talentRank('scholars_intuition'), survivalists: scene.talentRank('survivalists_intuition'),
	});
}

/** Progress-map key for a missile class (Java keeps the counters on the parent stack; this port keys them on the class). */
export const missileProgressKey = (sourceClass: string): string => `missile:${sourceClass}`;

/** Missile classes the run has identified (class-level, like the wand classes above). */
const identifiedMissileTypesByScene = new WeakMap<object, Set<string>>();
export function missileTypesIdentifiedFor(scene: object): Set<string> {
	let known = identifiedMissileTypesByScene.get(scene);
	if (!known) {
		known = new Set();
		identifiedMissileTypesByScene.set(scene, known);
	}
	return known;
}

/** Whether a bag entry is a thrown-missile stack (any `missile_*` id, `missile` or `stone` carries its Java class in `sourceClass`). */
export function isMissileEntry(item: { id: string; sourceClass?: string }): boolean {
	return typeof item.sourceClass === 'string' && MWL_MISSILE_BY_CLASS.has(item.sourceClass);
}

const sourceClassOf = (item: { id: string }): string | undefined => (item as { sourceClass?: string }).sourceClass;

/** Identify a missile class outright: the class is learned and every carried stack of it is marked. */
export function identifyMissileType(scene: DungeonScene, sourceClass: string, announce: boolean): void {
	missileTypesIdentifiedFor(scene).add(sourceClass);
	for (const item of scene.bag.items) {
		if (item.quantity > 0 && sourceClassOf(item) === sourceClass) item.identified = true;
	}
	if (announce) scene.say(t('items.weapon.weapon.identify'), 'positive');
	scene.procIdentifyTalents();
	scene.syncHeroFromStats();
	scene.refreshInventoryPanel?.();
}

/** Identify a wand class outright (the Shard's selector, which can name a spare of a class the hero does not wield). */
export function identifyWandType(scene: DungeonScene, wandType: string, announce: boolean): void {
	wandTypesIdentifiedFor(scene).add(wandType);
	if (announce) scene.say(t('items.trinkets.shardofoblivion.identify'), 'positive');
	scene.procIdentifyTalents();
	scene.syncHeroFromStats();
	scene.refreshInventoryPanel?.();
}

/** `identify()` for the worn piece, with the log line Java prints for passive identification (not for the Shard's or a scroll's). */
export function identifyWorn(scene: DungeonScene, kind: PassiveIdKind, announce: boolean): void {
	if (kind === 'weapon') scene.weaponIdentified = true;
	else if (kind === 'armor') scene.armorIdentified = true;
	else if (kind === 'wand') { if (scene.wandType) wandTypesIdentifiedFor(scene).add(scene.wandType); }
	else if (scene.equippedRing) scene.equippedRing.identified = true;
	if (announce) scene.say(t(kind === 'weapon' ? 'items.weapon.weapon.identify' : kind === 'armor' ? 'items.armor.armor.identify' : kind === 'wand' ? 'items.wands.wand.identify' : 'items.rings.ring.identify'), 'positive');
	scene.procIdentifyTalents();
	scene.syncHeroFromStats();
	scene.refreshInventoryPanel?.();
}

function reachedZero(scene: DungeonScene, gear: WornGear, progress: IdProgress): void {
	if (passiveIdDisabled(scene)) {
		//`if (usesLeftToID > -1) GLog.p(identify_ready, name()); setIDReady();`
		if (progress.left > -1) scene.say(t('items.trinkets.shardofoblivion.identify_ready', { '0': gear.name }), 'positive');
		markReady(progress);
		return;
	}
	identifyWorn(scene, gear.kind, true);
}

function progressOf(scene: DungeonScene, gear: WornGear): IdProgress {
	const map = idProgressFor(scene);
	let progress = map.get(gear.instanceId);
	if (!progress) {
		progress = freshProgress(gear.kind);
		map.set(gear.instanceId, progress);
	}
	return progress;
}

/** A landed attack: the hero's melee weapon counts a use, a hit taken counts a use for the worn armor (`Weapon.proc` / `Armor.proc`). */
export function passiveIdOnHit(scene: DungeonScene, attacker: Creature, defender: Creature): void {
	if (attacker === scene.hero && attacker.attackMode !== 'throw') countUse(scene, 'weapon');
	if (defender === scene.hero) countUse(scene, 'armor');
}

function countUse(scene: DungeonScene, kind: 'weapon' | 'armor'): void {
	const gear = worn(scene, kind);
	if (!gear || gear.identified) return;
	const progress = progressOf(scene, gear);
	if (spendUse(progress, speedFactor(scene, kind))) reachedZero(scene, gear, progress);
}

/** `ShardOfOblivion.WandUseTracker.DURATION` (tag `v3.3.8`): an unidentified wand's use counts for the Shard's loot bonus this long. */
export const WAND_USE_TRACKER_TURNS = 50;

/**
 * `Wand.wandUsed()` for the wielded wand (tag `v3.3.8`): a zap spends a use from the wand class's counters, identifying (or, under the Shard,
 * marking ready) when they run out - or at once with Scholar's Intuition 2, which the equip-time hook may already have spent. Every
 * unidentified use also prolongs the Shard's `WandUseTracker`. Already-ready progress (a save/load round-trip) identifies silently instead of
 * announcing twice; WildMagic's conjured shots bypass this like `WildMagic.zapWand()` bypasses `Wand.zap()`.
 */
export function passiveIdOnWandUse(scene: DungeonScene): void {
	const gear = worn(scene, 'wand');
	if (!gear || gear.identified) return;
	const progress = progressOf(scene, gear);
	const silent = isReady(progress);
	const out = spendUse(progress, speedFactor(scene, 'wand'));
	const scholarsInstant = scene.talentRank('scholars_intuition') === 2;
	if (out || scholarsInstant) {
		if (passiveIdDisabled(scene)) {
			if (progress.left > -1) scene.say(t('items.trinkets.shardofoblivion.identify_ready', { '0': gear.name }), 'positive');
			markReady(progress);
		} else identifyWorn(scene, 'wand', !silent);
	}
	scene.hero.buffs['wandUseTracker'] = Math.max(scene.hero.buffs['wandUseTracker'] ?? 0, WAND_USE_TRACKER_TURNS);
}

/** `ShardOfOblivion.ThrownUseTracker.DURATION` (tag `v3.3.8`): an unidentified missile's use counts for the Shard's loot bonus this long. */
export const THROWN_USE_TRACKER_TURNS = 50;

/**
 * `MissileWeapon.proc` ID half for a landed throw (tag `v3.3.8`): the throw spends a use from its class's counters, identifying (or, under the
 * Shard, marking ready) when they run out - or at once with Survivalist's Intuition 2 ("identifies thrown weapons when she hits with them").
 * Every unidentified use also prolongs the Shard's `ThrownUseTracker`. Misses never reach here: Java only runs `proc` on a hit (`rangedMiss`
 * just drops the missile), so the hook sits on the hit branch like the durability bookkeeping. Already-ready progress (a save/load round-trip)
 * identifies silently instead of announcing twice.
 */
export function passiveIdOnThrownUse(scene: DungeonScene, sourceClass: string): void {
	if (missileTypesIdentifiedFor(scene).has(sourceClass)) return;
	const map = idProgressFor(scene);
	const key = missileProgressKey(sourceClass);
	let progress = map.get(key);
	if (!progress) {
		progress = freshProgress('missile');
		map.set(key, progress);
	}
	const silent = isReady(progress);
	const out = spendUse(progress, speedFactor(scene, 'missile'));
	const survivalistInstant = scene.talentRank('survivalists_intuition') === 2;
	if (out || survivalistInstant) {
		if (passiveIdDisabled(scene)) {
			const stack = scene.bag.items.find((candidate) => candidate.quantity > 0 && sourceClassOf(candidate) === sourceClass);
			const name = stack ? scene.itemDisplayName(stack.id, false, stack.instanceId) : sourceClass;
			if (progress.left > -1) scene.say(t('items.trinkets.shardofoblivion.identify_ready', { '0': name }), 'positive');
			markReady(progress);
		} else identifyMissileType(scene, sourceClass, !silent);
	}
	scene.hero.buffs['thrownUseTracker'] = Math.max(scene.hero.buffs['thrownUseTracker'] ?? 0, THROWN_USE_TRACKER_TURNS);
}

/** `Hero.earnExp()` -> `onHeroGainExp(levelPercent)` for the worn gear, plus every thrown-missile class with a live counter. */
export function passiveIdGainExperience(scene: DungeonScene, levelPercent: number): void {
	for (const kind of ['weapon', 'armor', 'ring', 'wand'] as const) {
		const gear = worn(scene, kind);
		if (!gear || gear.identified) continue;
		const progress = progressOf(scene, gear);
		if (isReady(progress) && kind !== 'ring') continue;
		if (gainExperience(kind, progress, levelPercent, speedFactor(scene, kind))) reachedZero(scene, gear, progress);
	}
	//Java refills every stack's pool on experience; the port refills every class counter instead.
	for (const [key, progress] of idProgressFor(scene)) {
		if (!key.startsWith('missile:') || isReady(progress)) continue;
		const sourceClass = key.slice('missile:'.length);
		if (missileTypesIdentifiedFor(scene).has(sourceClass)) continue;
		gainExperience('missile', progress, levelPercent, speedFactor(scene, 'missile'));
	}
}

/** `ShardOfOblivion`'s Identify (and a Scroll of Identify under it): the item is ready, or it is not yet. Returns whether it identified. */
export function identifyWithShard(scene: DungeonScene, kind: PassiveIdKind): boolean {
	const gear = worn(scene, kind);
	if (!gear || gear.identified) return false;
	//Java's `identifySelector` grants the equipped+talent-2 shortcut to weapon, armor and ring only - a wand is ready exactly when its
	//counter ran out (`((Wand) item).readyToIdentify()`, `ShardOfOblivion.java`, tag `v3.3.8`).
	const talentReady = (kind === 'weapon' && scene.talentRank('adventurers_intuition') === 2)
		|| (kind === 'armor' && scene.talentRank('veterans_intuition') === 2) || (kind === 'ring' && scene.talentRank('thiefs_intuition') === 2);
	if (!talentReady && !isReady(progressOf(scene, gear))) {
		scene.say(t('items.trinkets.shardofoblivion.identify_not_yet'), 'warning');
		return false;
	}
	identifyWorn(scene, kind, false);
	scene.say(t('items.trinkets.shardofoblivion.identify'), 'positive');
	return true;
}

const isGearId = (id: string): boolean => id === 'weaponReward' || id === 'armorReward' || id === 'wand' || id.startsWith('ring_');
const kindOfId = (id: string): PassiveIdKind => id === 'weaponReward' ? 'weapon' : id === 'armorReward' ? 'armor' : id === 'wand' ? 'wand' : 'ring';

/** Resolve a bag wand entry to its class progress key (class-level counters; the instance id alone names no counter). */
function wandKeyOfBagItem(scene: DungeonScene, instanceId: string): string | undefined {
	const entry = scene.bag.items.find((candidate) => candidate.instanceId === instanceId && candidate.id === 'wand') as { sourceClass?: string } | undefined;
	const type = entry?.sourceClass ? wandTypeFromSource(entry.sourceClass) : undefined;
	return type ? wandProgressKey(type) : undefined;
}

/** `ScrollOfIdentify.IDItem()` under the Shard: weapons, armor, rings, wands and thrown missiles only become ready (`setIDReady()`); everything else identifies as usual. */
export function shardMarkReady(scene: DungeonScene, item: { id: string; instanceId?: string; sourceClass?: string }): boolean {
	if (!passiveIdDisabled(scene) || !item.instanceId) return false;
	const map = idProgressFor(scene);
	if (item.sourceClass && MWL_MISSILE_BY_CLASS.has(item.sourceClass)) {
		const key = missileProgressKey(item.sourceClass);
		const progress = map.get(key) ?? freshProgress('missile');
		markReady(progress);
		map.set(key, progress);
		return true;
	}
	if (!isGearId(item.id)) return false;
	const key = item.id === 'wand' ? wandKeyOfBagItem(scene, item.instanceId) : item.instanceId;
	if (!key) return false;
	const progress = map.get(key) ?? freshProgress(kindOfId(item.id));
	markReady(progress);
	map.set(key, progress);
	return true;
}

/**
 * `ShardOfOblivion.AC_IDENTIFY` + its selector: pick an unidentified weapon, armor, ring or wand (worn pieces included) and identify it when it is
 * ready - its counter ran out, or the matching intuition talent is at rank 2 for the worn weapon/armor/ring - else "isn't ready yet". Wands get no
 * talent shortcut, exactly like Java's `identifySelector` (`ShardOfOblivion.java`, tag `v3.3.8`); the wielded wand is listed under its class key.
 */
export function useShardOfOblivion(scene: DungeonScene): void {
	const entries: Array<{ id: string; instanceId?: string; quantity: number; identified?: boolean; level?: number; tier?: number }> = scene.bag.items
		.filter((item) => {
			if (!(item.quantity > 0) || item.identified) return false;
			if (isGearId(item.id)) return true;
			const cls = sourceClassOf(item);
			return cls !== undefined && MWL_MISSILE_BY_CLASS.has(cls) && !missileTypesIdentifiedFor(scene).has(cls);
		})
		.map((item) => item as typeof item & { level?: number });
	if (scene.weaponInstanceId && !scene.weaponIdentified) entries.push({ id: scene.weaponId, instanceId: scene.weaponInstanceId, quantity: 1, identified: false, level: scene.weaponLevel, tier: scene.weaponTier });
	if (scene.armorInstanceId && !scene.armorIdentified) entries.push({ id: scene.armorId, instanceId: scene.armorInstanceId, quantity: 1, identified: false, level: scene.armorLevel, tier: scene.armorTier });
	if (scene.equippedRing && scene.equippedRing.identified === false && scene.equippedRing.instanceId) entries.push({ id: scene.equippedRing.id, instanceId: scene.equippedRing.instanceId, quantity: 1, identified: false });
	const wandGear = worn(scene, 'wand');
	if (wandGear && !wandGear.identified) entries.push({ id: 'wand', instanceId: wandGear.instanceId, quantity: 1, identified: false });
	if (entries.length === 0) {
		scene.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
		return;
	}
	scene.openItemPicker(t('items.trinkets.shardofoblivion.identify_prompt'), entries, (pick) => {
		if (pick.instanceId && pick.instanceId === scene.weaponInstanceId && !scene.weaponIdentified) { identifyWithShard(scene, 'weapon'); return; }
		if (pick.instanceId && pick.instanceId === scene.armorInstanceId && !scene.armorIdentified) { identifyWithShard(scene, 'armor'); return; }
		if (pick.instanceId && pick.instanceId === scene.equippedRing?.instanceId && scene.equippedRing.identified === false) { identifyWithShard(scene, 'ring'); return; }
		//Thrown missiles get no talent shortcut, exactly like wands: Java's `identifySelector` only shortcuts an *equipped* weapon/armor/ring
		//with its intuition talent at 2 (`ShardOfOblivion.java`, tag `v3.3.8`), and a missile stack is never equipped - readiness is the counter.
		//The pick type carries no class, so the stack is re-read from the bag like the generic branch below.
		const pickedStack = pick.instanceId ? scene.bag.items.find((candidate) => candidate.instanceId === pick.instanceId && candidate.id === pick.id) : undefined;
		const pickedMissile = pickedStack ? sourceClassOf(pickedStack) : undefined;
		if (pickedMissile && MWL_MISSILE_BY_CLASS.has(pickedMissile)) {
			const progress = idProgressFor(scene).get(missileProgressKey(pickedMissile));
			if (!progress || !isReady(progress)) {
				scene.say(t('items.trinkets.shardofoblivion.identify_not_yet'), 'warning');
				return;
			}
			identifyMissileType(scene, pickedMissile, true);
			return;
		}
		if (pick.id === 'wand' && pick.instanceId) {
			const key = pick.instanceId.startsWith('wand:') ? pick.instanceId : wandKeyOfBagItem(scene, pick.instanceId);
			const progress = key ? idProgressFor(scene).get(key) : undefined;
			if (!key || !progress || !isReady(progress)) {
				scene.say(t('items.trinkets.shardofoblivion.identify_not_yet'), 'warning');
				return;
			}
			identifyWandType(scene, key.slice('wand:'.length), true);
			const spare = scene.bag.items.find((candidate) => candidate.instanceId === pick.instanceId && candidate.id === 'wand');
			if (spare) spare.identified = true;
			scene.refreshInventoryPanel?.();
			return;
		}
		const item = scene.bag.items.find((candidate) => candidate.instanceId === pick.instanceId && candidate.id === pick.id);
		if (!item || !pick.instanceId) return;
		const progress = idProgressFor(scene).get(pick.instanceId);
		if (!progress || !isReady(progress)) {
			scene.say(t('items.trinkets.shardofoblivion.identify_not_yet'), 'warning');
			return;
		}
		item.identified = true;
		if (item.id.startsWith('ring_')) scene.markRingTypesKnown([item.id]);
		scene.procIdentifyTalents();
		scene.say(t('items.trinkets.shardofoblivion.identify'), 'positive');
		scene.refreshInventoryPanel?.();
	});
}
