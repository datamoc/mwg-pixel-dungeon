import { Actors, Random } from 'mwg';
import { t } from '../i18n';
import { mwlItemEffectValue } from '../mwlContent';
import { STARVING } from '../simulation/hunger';

export interface ArtifactActionContext {
	readonly bag: Actors.Inventory;
	readonly hero: { buffs: Record<string, number>; hp: number; maxHp: number; magicImmune?: boolean };
	timeBubbleTurns: number;
	hourglassFreeze: boolean;
	hourglassTurnsToCost: number;
	cloakStealthTurnsToCost: number;
	flushTimeBubblePresses(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	/** Shared hero damage boundary (Tenacity/AntiMagic/Viscosity/RockArmor/Barrier), matching
	 * every other hero-inflicted-on-self source (bomb blast, trap damage). */
	absorbHeroDamage(amount: number): number;
	showHeroDamage(amount: number): void;
	/** Kills the hero with the given death cause (see `DungeonScene.kill`'s cause union). */
	killHero(cause: 'foe' | 'trap' | 'fire' | 'poison' | 'hunger'): void;
	/** Optional scene hooks. These are the seams the *scene* supplies rather than the artifact's
	 *  own module: everything this interface used to declare optional for an unimplemented artifact
	 *  (`spawnAlly`, `revealNearbyTraps`) was removed with the stand-in that needed it, which is
	 *  the point - an optional hook left in place makes an unimplemented action look implemented. */
	addAlchemyEnergy?(amount: number): void;
	/** `AlchemistsToolkit.execute(AC_BREW)`: opens the alchemy pot from anywhere while carried
	 * (real Java has no adjacency requirement for this action, unlike walking onto the pot
	 * tile itself). Wired to the same recipe picker `Terrain.ALCHEMY` already opens. */
	openAlchemyPot?(): void;
	/** Applies scroll `id`'s real effect through the same `applyScrollEffect` seam the Arcane
	 * Catalyst already uses, letting `UnstableSpellbook`'s read action reuse it for whichever
	 * scroll class its own draw picks (see `useSpellbook`/`randomSpellbookScroll` below). */
	castScrollEffect?(id: string): boolean;
}

/** `TimekeepersHourglass.timeFreeze`: freeze automatic actors while hero actions are free. */
export function useHourglass(scene: ArtifactActionContext, instanceId?: string): void {
	const hourglass = scene.bag.find('hourglass', instanceId) as (typeof scene.bag.items[number] & { charges?: number }) | undefined;
	if (!hourglass || hourglass.cursed) {
		scene.say(t('port.log.cursedhourglass'), 'negative');
		return;
	}
	if (scene.timeBubbleTurns > 0) {
		scene.flushTimeBubblePresses();
		scene.hourglassFreeze = false;
		scene.timeBubbleTurns = 0;
		return;
	}
	const maxCharge = mwlItemEffectValue('hourglass', 'maxChargeBase')
		+ Math.min(mwlItemEffectValue('hourglass', 'maxChargeLevelCap'), hourglass.level ?? 0) * mwlItemEffectValue('hourglass', 'maxChargePerLevel');
	const charge = Math.min(maxCharge, hourglass.charges ?? maxCharge);
	if (charge <= 0) {
		scene.say(t('port.log.hourglassnocharge'), 'negative');
		return;
	}
	hourglass.charges = charge - 1;
	scene.hourglassFreeze = true;
	scene.hourglassTurnsToCost = mwlItemEffectValue('hourglass', 'turnsToCost');
	//Java's processTime loop lets a zero-charge freeze survive two more turns; using the
	//pre-spend charge here preserves that exact `2 * charge` duration.
	scene.timeBubbleTurns = charge * mwlItemEffectValue('hourglass', 'turnsPerCharge');
	scene.say(t('port.log.timefreezes'), 'positive');
}

/** `CloakOfShadows.execute()/cloakStealth`: toggle invisibility and consume charges over time. */
export function useCloak(scene: ArtifactActionContext, instanceId?: string): void {
	const cloak = scene.bag.find('cloak', instanceId) as (typeof scene.bag.items[number] & { charges?: number }) | undefined;
	if (!cloak) return;
	if (scene.cloakStealthTurnsToCost > 0) {
		scene.cloakStealthTurnsToCost = 0;
		delete scene.hero.buffs['invisibility'];
		return;
	}
	if (cloak.cursed || (cloak.charges ?? 0) <= 0) {
		scene.say(t('port.log.cannotupgrade'), 'negative');
		return;
	}
	scene.cloakStealthTurnsToCost = mwlItemEffectValue('cloak', 'turnsToCost');
	scene.hero.buffs['invisibility'] = 9999;
}

/** `ChaliceOfBlood.execute(AC_PRICK)`/`prick()` (tag `v3.3.8`): real Java rolls
 * `NormalIntRange(ceil(3 + 2.5*level^2), floor(7 + 3.5*level^2))` self-damage, subtracts the
 * hero's own `drRoll()` (armor), then calls `hero.damage(damage, this)` - killing the hero on a
 * lethal roll, otherwise permanently upgrading the chalice (capped at `levelCap = 10`). This port
 * reuses the shared `absorbHeroDamage` boundary (Tenacity/AntiMagic/Viscosity/RockArmor/Barrier)
 * the same way every other hero-inflicted-on-self source does (bomb blast, trap damage), but does
 * **not** additionally subtract the hero's own armor roll first: no existing hook exposes a bare
 * armor-only roll to a bespoke item action (only `applyBlastDamage`'s *monster* branch resolves
 * armor, and that call site's own hero branch already skips it too - see its comment), so this is
 * a stated simplification, not a silent omission. Real Java also shows a `WndOptions`
 * confirmation naming the exact death chance before pricking; this port has no equivalent
 * computed-odds confirmation window (matching every other "use item on self" action here that
 * skips Java's own modal) and pricks immediately. **Not ported at all**: the passive
 * `chaliceRegen` buff, which boosts Java's natural out-of-combat HP regeneration
 * (`Regeneration.act()` calling `Item.charge()`) - this port has no natural regen system for a
 * passive artifact to hook a bonus into, so Chalice here is active-only. See
 * `PORT_COVERAGE.md`'s artifacts row. */
export function useChalice(scene: ArtifactActionContext, instanceId?: string): void {
	const chalice = scene.bag.find('chalice', instanceId) as (typeof scene.bag.items[number] & { level?: number }) | undefined;
	if (!chalice) return;
	const levelCap = mwlItemEffectValue('chalice', 'levelCap');
	const level = chalice.level ?? 0;
	if (chalice.cursed || level >= levelCap || scene.hero.magicImmune) {
		scene.say(t('port.log.cannotupgrade'), 'negative');
		return;
	}
	const minDmg = Math.ceil(mwlItemEffectValue('chalice', 'minDmgBase') + mwlItemEffectValue('chalice', 'minDmgPerLevelSq') * level * level);
	const maxDmg = Math.floor(mwlItemEffectValue('chalice', 'maxDmgBase') + mwlItemEffectValue('chalice', 'maxDmgPerLevelSq') * level * level);
	const damage = Math.max(1, scene.absorbHeroDamage(Random.normalRange(minDmg, maxDmg)));
	scene.showHeroDamage(damage);
	scene.say(t('items.artifacts.chaliceofblood.onprick'), 'warning');
	scene.hero.hp -= damage;
	if (scene.hero.hp <= 0) {
		scene.say(t('items.artifacts.chaliceofblood.ondeath'), 'negative');
		scene.killHero('trap');
		return;
	}
	chalice.level = level + 1;
}

/** `CapeOfThorns`/`Thorns.proc()` (tag `v3.3.8`): while inactive (`cooldown == 0`), every hit the
 * hero takes charges the cape by `damage * (chargePerDamageBase + chargePerDamagePerLevel*level)`;
 * reaching `chargeCap` resets charge to 0 and starts a `cooldownBase + level`-turn "radiating"
 * window. While that cooldown is running, a `NormalIntRange(0, damage)` portion of every hit is
 * deflected (reduced) instead of landing, and the deflected amount both banks as `exp` (upgrading
 * the cape at `(level+1) * expPerLevelBase`, capped at `levelCap`) and would in real Java also
 * strike an adjacent attacker for the same amount (`Thorns.proc()`'s `attacker.damage(deflected,
 * this)`) - **not ported here**: this hook runs from inside `attack()`'s own resolution of that
 * same attacker's swing, and damaging/potentially killing the attacker mid-call risks the rest of
 * that large function referencing a creature already removed; scoped out rather than risked, see
 * `PORT_COVERAGE.md`'s `CapeOfThorns` row. Returns the (possibly reduced) damage to apply. */
export function applyCapeOfThornsProc(scene: Pick<ArtifactActionContext, 'bag' | 'say'>, damage: number): number {
	const cape = scene.bag.find('cape') as (typeof scene.bag.items[number] & { charge?: number; cooldown?: number; level?: number; exp?: number }) | undefined;
	if (!cape || damage <= 0) return damage;
	const level = cape.level ?? 0;
	let charge = cape.charge ?? 0;
	let cooldown = cape.cooldown ?? 0;
	if (cooldown === 0) {
		charge += damage * (mwlItemEffectValue('cape', 'chargePerDamageBase') + mwlItemEffectValue('cape', 'chargePerDamagePerLevel') * level);
		if (charge >= mwlItemEffectValue('cape', 'chargeCap')) {
			charge = 0;
			cooldown = mwlItemEffectValue('cape', 'cooldownBase') + level;
			scene.say(t('items.artifacts.capeofthorns$thorns.radiating'), 'positive');
		}
	}
	let remaining = damage;
	if (cooldown > 0) {
		const deflected = Random.normalRange(0, damage);
		remaining = damage - deflected;
		let exp = (cape.exp ?? 0) + deflected;
		const levelCap = mwlItemEffectValue('cape', 'levelCap');
		const expToLevel = (level + 1) * mwlItemEffectValue('cape', 'expPerLevelBase');
		if (exp >= expToLevel && level < levelCap) {
			exp -= expToLevel;
			cape.level = level + 1;
			scene.say(t('items.artifacts.capeofthorns$thorns.levelup'), 'positive');
		}
		cape.exp = exp;
	}
	cape.charge = charge;
	cape.cooldown = cooldown;
	return remaining;
}

/** The fallback line for a crown this port cannot yet act on. `KingsCrown.execute()`'s `AC_WEAR`
 * opens `WndChooseAbility` and transforms the worn armor; `dungeonScene.useKingsCrown` now does
 * exactly that for a class whose armor abilities are ported (`armorAbilitiesFor`). For a class
 * whose three are still unported, opening an empty choice would be worse than saying nothing, so
 * the scene falls back to this: the item's real description, which is what this action did before
 * the abilities existed. */
export function useKingsCrown(scene: Pick<ArtifactActionContext, 'say'>): void {
	scene.say(t('items.kingscrown.desc'));
}

/**
 * Every artifact in this file now has its real mechanics behind it - this bundle used to be the
 * home of the twelve the port had not implemented, and it is empty.
 *
 * What it leaves behind is the shape of the failure it hid: each of the last three artifacts
 * (`DriedRose`, `SandalsOfNature`, `TalismanOfForesight`) declared an optional hook on
 * `ArtifactActionContext` - `spawnAlly`, `revealNearbyTraps` - that the scene never supplied, so
 * the action took its `?.` branch, printed one line and did nothing. Nothing failed, nothing
 * warned, and the item read as "Simplified" rather than absent. Those hooks are gone with the
 * stand-ins; if a future artifact needs a seam, the scene must actually provide it.
 */
function findArtifact(scene: Pick<ArtifactActionContext, 'bag'>, id: string, instanceId?: string) {
	return scene.bag.find(id, instanceId) as (typeof scene.bag.items[number] & { charges?: number; level?: number }) | undefined;
}

function refuseIfCursed(scene: ArtifactActionContext, id: string, instanceId?: string) {
	const item = findArtifact(scene, id, instanceId);
	if (!item || item.cursed) {
		scene.say(t('port.log.cannotupgrade'), 'negative');
		return undefined;
	}
	return item;
}

type ToolkitItem = { level?: number; charge?: number; partialCharge?: number; cursed?: boolean };

/** `AlchemistsToolkit.execute()` (tag `v3.3.8`): the item's own default action is `AC_BREW`
 * - `AlchemyScene.assignToolkit(this); Game.switchScene(AlchemyScene.class)` - with no
 * adjacency requirement to a physical pot, gated only on `isEquipped(hero) && !cursed &&
 * hero.buff(MagicImmune.class) == null` (real Java's `warmUpDelay > 0` gate, tied to the
 * artifact's equip/unequip cycle, does not apply here - this port has no artifact equip
 * slot at all, every carried artifact is always "worn", so there is no warm-up window to
 * reproduce; Not ported for that reason, not simplified away). `AC_ENERGIZE` (spend the
 * carried alchemy energy pool, 6 per level, to permanently raise the toolkit's own level)
 * is exposed from `openAlchemyRecipes`'s picker instead of a second button here, since that
 * is the one place this port already surfaces the energy pool the action spends - see the
 * `openAlchemyPot`/`consumeToolkitEnergy` call sites in `dungeonScene.ts`. */
export function useToolkit(scene: ArtifactActionContext, instanceId?: string): void {
	const toolkit = findArtifact(scene, 'toolkit', instanceId) as (typeof scene.bag.items[number] & ToolkitItem) | undefined;
	if (!toolkit || scene.hero.magicImmune) return;
	if (toolkit.cursed) { scene.say(t('items.artifacts.alchemiststoolkit.cursed'), 'negative'); return; }
	if (!scene.openAlchemyPot) { scene.say(t('items.artifacts.alchemiststoolkit.not_ready'), 'negative'); return; }
	scene.openAlchemyPot();
}

/** `AlchemistsToolkit.kitEnergy.gainCharge()` (tag `v3.3.8`): `Hero.earnExp()` calls this on
 * every hero XP grant with `percent = exp/(float)maxExp()` - `chargeGain = (2+level) *
 * percent`, further scaled by `RingOfEnergy.artifactChargeMultiplier(target)`, banked in
 * whole-unit increments onto `charge`. This port has no bare `artifactChargeMultiplier`
 * (only `wandChargeMultiplier`'s `1.175^bonus` base, reused here via `ringEnergyMultiplier`
 * - see the caller in `dungeonScene.ts`'s `grantExperience`); the Light Cloak talent's extra
 * multiplier `artifactChargeMultiplier` itself applies on top is Not ported, matching the
 * already-stated Light Reading gap on the wand side. Guarded the same way Java's real
 * `gainCharge` is - `cursed || target.buff(MagicImmune.class) != null` skips the gain
 * entirely, it is not merely zero. */
export function applyToolkitGainCharge(scene: Pick<ArtifactActionContext, 'bag'>, levelPortion: number, ringMultiplier: number, magicImmune: boolean): void {
	const toolkit = findArtifact(scene, 'toolkit') as (typeof scene.bag.items[number] & ToolkitItem) | undefined;
	if (!toolkit || toolkit.cursed || magicImmune) return;
	const level = toolkit.level ?? 0;
	let partialCharge = (toolkit.partialCharge ?? 0) + (2 + level) * levelPortion * ringMultiplier;
	let charge = toolkit.charge ?? 0;
	while (partialCharge >= 1) {
		charge++;
		partialCharge -= 1;
	}
	toolkit.charge = charge;
	toolkit.partialCharge = partialCharge;
}

type ArmbandItem = { level?: number; charge?: number; partialCharge?: number; cursed?: boolean };

/** `MasterThievesArmband.Thievery.gainCharge()` (tag `v3.3.8`): the same `Hero.earnExp()` hook
 * as `applyToolkitGainCharge` above (`percent = exp/maxExp()`), here `chargeGain = 3f * percent
 * * RingOfEnergy.artifactChargeMultiplier(target)`, banked in whole-unit increments onto
 * `charge` until `chargeCap = 5 + level()/2` (Java's integer division, hence the `Math.floor`
 * here) - reaching the cap zeroes `partialCharge` outright rather than merely clamping, and any
 * further `gainCharge` call while already at the cap also resets `partialCharge` to 0 (real
 * Java's `else { partialCharge = 0f; }` branch). Reuses the same `ringEnergyMultiplier`
 * substitute for the real `artifactChargeMultiplier` that `applyToolkitGainCharge` already
 * documents (missing the Light Cloak talent's extra multiplier on top - Not ported, matching
 * that existing gap). Guarded the same way - `cursed || magicImmune` skips the gain entirely. */
export function applyArmbandGainCharge(scene: Pick<ArtifactActionContext, 'bag'>, levelPortion: number, ringMultiplier: number, magicImmune: boolean): void {
	const armband = findArtifact(scene, 'armband') as (typeof scene.bag.items[number] & ArmbandItem) | undefined;
	if (!armband || armband.cursed || magicImmune) return;
	const level = armband.level ?? 0;
	const chargeCap = mwlItemEffectValue('armband', 'chargeCapBase') + Math.floor(level / 2);
	let charge = armband.charge ?? 0;
	if (charge >= chargeCap) {
		armband.partialCharge = 0;
		return;
	}
	let partialCharge = (armband.partialCharge ?? 0) + mwlItemEffectValue('armband', 'chargeGainBase') * levelPortion * ringMultiplier;
	while (partialCharge > 1) {
		partialCharge -= 1;
		charge++;
		if (charge >= chargeCap) {
			partialCharge = 0;
			break;
		}
	}
	armband.charge = charge;
	armband.partialCharge = partialCharge;
}

/** `AlchemistsToolkit.consumeEnergy()` (tag `v3.3.8`): `int result = amount - charge; charge =
 * max(0, charge - amount); return max(0, result);` - spends the toolkit's own banked charge
 * before the ordinary energy pool for any alchemy cost, exactly as `AlchemyScene`'s combine
 * cost does (`cost = toolkit.consumeEnergy(cost); Dungeon.energy -= cost`). Returns the
 * residual cost still owed from the carried energy pool. Unlike `gainCharge`, real Java's
 * `consumeEnergy` has no `cursed`/`AntiMagic` guard of its own - a cursed toolkit still pays
 * out whatever charge it already banked before the curse, so this does not check either. */
export function consumeToolkitEnergy(scene: Pick<ArtifactActionContext, 'bag'>, cost: number): number {
	//NOTE (`AlchemistsToolkit.consumeEnergy`, tag `v3.3.8`): real Java calls
	//`Talent.onArtifactUsed(Dungeon.hero)` on every energy spend - the EnhancedRings
	//arming in `dungeonScene.armEnhancedRingsFromArtifact`. This function currently has
	//no live call site (the port's alchemy UI pays brew costs from the carried energy
	//pool without spending the toolkit's banked charge first), so there is nowhere to
	//arm yet: the call site that first spends toolkit charge through here must arm it.
	const toolkit = findArtifact(scene, 'toolkit') as (typeof scene.bag.items[number] & ToolkitItem) | undefined;
	if (!toolkit) return cost;
	const charge = toolkit.charge ?? 0;
	toolkit.charge = Math.max(0, charge - cost);
	return Math.max(0, cost - charge);
}

/** Read-only view of the toolkit's currently banked charge, for the alchemy pot's combined
 * cost display/availability check (`AlchemyScene`'s own `Dungeon.energy + toolkit.availableEnergy()`). */
export function toolkitAvailableEnergy(scene: Pick<ArtifactActionContext, 'bag'>): number {
	const toolkit = findArtifact(scene, 'toolkit') as (typeof scene.bag.items[number] & ToolkitItem) | undefined;
	return toolkit?.charge ?? 0;
}

/** `AlchemistsToolkit.execute(AC_ENERGIZE)` (tag `v3.3.8`): spends 6 carried alchemy energy
 * per level, up to `min(levelCap - level, energy/6)` levels, permanently raising the
 * toolkit's own level (capped at `levelCap = 10`). Real Java offers a `WndOptions` choice
 * between spending one level's worth and spending the maximum affordable at once; this port
 * always spends the maximum affordable in one action (Simplified: the "just spend one
 * level" alternative is not offered, since there is no equivalent options-window seam at
 * this call site). Refuses while cursed or `AntiMagic`, matching Java's own action gate. */
export function energizeToolkit(scene: Pick<ArtifactActionContext, 'bag'>, availableEnergy: number, magicImmune: boolean): number {
	const toolkit = findArtifact(scene, 'toolkit') as (typeof scene.bag.items[number] & ToolkitItem) | undefined;
	if (!toolkit || toolkit.cursed || magicImmune) return 0;
	const levelCap = mwlItemEffectValue('toolkit', 'levelCap');
	const energizeCost = mwlItemEffectValue('toolkit', 'energizeCost');
	const level = toolkit.level ?? 0;
	const maxLevels = Math.min(levelCap - level, Math.floor(availableEnergy / energizeCost));
	if (maxLevels <= 0) return 0;
	toolkit.level = level + maxLevels;
	return maxLevels * energizeCost;
}

type HornItem = { level?: number; charge?: number; partialCharge?: number; cursed?: boolean; storedFoodEnergy?: number };

/** `HornOfPlenty.hornRecharge.gainCharge()` (tag `v3.3.8`): the same `Hero.earnExp()` hook as
 * `applyToolkitGainCharge`/`applyArmbandGainCharge` above (`percent = exp/maxExp()`). Real
 * Java's `chargeGain = Hunger.STARVING * levelPortion * (0.25 + 0.125*level)`, scaled by
 * `RingOfEnergy.artifactChargeMultiplier(target)`, then divided by `Hunger.STARVING/5` (each
 * charge is worth 1/5 of the starving threshold) before banking in whole-unit increments onto
 * `charge`, capped at `chargeCap = 5 + level()/2` (Java's integer division, hence the
 * `Math.floor` here). Reaching the cap zeroes `partialCharge` outright, and any further call
 * while already at the cap does too (Java's `else { partialCharge = 0f; }` branch) - guarded
 * the same way `cursed || target.buff(MagicImmune.class) != null` skips the gain entirely.
 * Reuses the same `ringEnergyMultiplier` substitute for the real `artifactChargeMultiplier`
 * that toolkit/armband already document (missing the Light Cloak talent's extra multiplier -
 * Not ported, matching that existing gap). */
export function applyHornGainCharge(scene: Pick<ArtifactActionContext, 'bag'>, levelPortion: number, ringMultiplier: number, magicImmune: boolean): void {
	const horn = findArtifact(scene, 'horn') as (typeof scene.bag.items[number] & HornItem) | undefined;
	if (!horn || horn.cursed || magicImmune) return;
	const level = horn.level ?? 0;
	const chargeCap = mwlItemEffectValue('horn', 'chargeCapBase') + Math.floor(level / 2);
	let charge = horn.charge ?? 0;
	if (charge >= chargeCap) {
		horn.partialCharge = 0;
		return;
	}
	const satietyPerCharge = STARVING / mwlItemEffectValue('horn', 'satietyDivisor');
	let chargeGain = STARVING * levelPortion * (mwlItemEffectValue('horn', 'chargeGainBase') + mwlItemEffectValue('horn', 'chargeGainPerLevel') * level);
	chargeGain *= ringMultiplier;
	chargeGain /= satietyPerCharge;
	let partialCharge = (horn.partialCharge ?? 0) + chargeGain;
	while (partialCharge >= 1) {
		partialCharge -= 1;
		charge++;
		if (charge >= chargeCap) {
			partialCharge = 0;
			break;
		}
	}
	horn.charge = charge;
	horn.partialCharge = partialCharge;
}

type ChainsItem = { level?: number; charge?: number; partialCharge?: number; exp?: number; cursed?: boolean };

/** `EtherealChains.chainsRecharge.gainExp()` (tag `v3.3.8`): unlike toolkit/armband/horn's
 * `gainCharge`, real Java folds charge gain and artifact leveling into the *same* per-XP
 * hook. `exp += round(levelPortion*100)`; once `exp > 100 + level()*100` (and `level() <
 * levelCap = 5`) it subtracts that threshold and calls `upgrade()`. Charge gain is
 * `levelPortion*6`, but past the *soft* cap `chargeTarget = 5 + level()*2` (unlike the
 * hard `chargeCap` the other three artifacts clamp to) the portion banked is throttled by
 * `chargeTarget/charge` rather than refused outright - charge can still climb past the
 * soft cap through combat XP, just more slowly the further past it it already is. Guarded
 * the same way - `cursed || target.buff(MagicImmune.class) != null` skips the whole call,
 * and Java's own `levelPortion == 0` short-circuit is preserved too (a zero-XP grant would
 * otherwise still run `partialCharge += 0`, harmless but pointless). The passive per-turn
 * regen half of `chainsRecharge` (`act()`) lives in `DungeonScene`'s own per-turn buff
 * block next to `LloydsBeacon`'s equivalent - see the comment there. */
export function applyChainsGainExp(scene: Pick<ArtifactActionContext, 'bag' | 'say'>, levelPortion: number, magicImmune: boolean): void {
	const chains = findArtifact(scene, 'chains') as (typeof scene.bag.items[number] & ChainsItem) | undefined;
	if (!chains || chains.cursed || magicImmune || levelPortion === 0) return;
	const levelCap = mwlItemEffectValue('chains', 'levelCap');
	const level = chains.level ?? 0;
	let exp = (chains.exp ?? 0) + Math.round(levelPortion * 100);
	const chargeTarget = mwlItemEffectValue('chains', 'chargeCapBase') + mwlItemEffectValue('chains', 'chargeCapPerLevel') * level;
	const charge = chains.charge ?? 0;
	let gainedPortion = levelPortion;
	if (charge > chargeTarget) gainedPortion *= chargeTarget / charge;
	let partialCharge = (chains.partialCharge ?? 0) + gainedPortion * mwlItemEffectValue('chains', 'gainExpChargeScale');
	let newCharge = charge;
	while (partialCharge >= 1) {
		partialCharge -= 1;
		newCharge++;
	}
	const expToLevel = mwlItemEffectValue('chains', 'expToLevelBase') + mwlItemEffectValue('chains', 'expToLevelPerLevel') * level;
	if (exp > expToLevel && level < levelCap) {
		exp -= expToLevel;
		chains.level = level + 1;
		scene.say(t('items.artifacts.etherealchains$chainsrecharge.levelup'), 'positive');
	}
	chains.exp = exp;
	chains.charge = newCharge;
	chains.partialCharge = partialCharge;
}

export type SpellbookItem = { level?: number; charge?: number; partialCharge?: number; cursed?: boolean; scrolls?: string[] };

/** `Generator.Category.SCROLL`'s real class list and `defaultProbsTotal` weights (`decks.mwl`'s
 * `scrollDeck` node, tag `v3.3.8`), reduced to the ten port ids `UnstableSpellbook` can ever
 * draw: `ScrollOfUpgrade` carries weight 0 in that deck (Java's `Random.chances` never selects
 * a zero-weight index, so it is simply omitted here rather than kept-and-never-picked), and
 * `ScrollOfTransmutation` is explicitly removed by the real constructor
 * (`scrolls.remove(ScrollOfTransmutation.class)`) - both this port's `setupSpellbookScrolls`
 * (the per-instance queue) and `randomSpellbookScroll` (the per-read draw) omit it up front for
 * the same net effect. Hardcoded here (not re-derived from `generator.ts`'s `SCROLL_DECK`)
 * because that module is explicitly scoped to level-generation RNG-stream fidelity only, not a
 * general-purpose deck source - the same reasoning `alchemy.ts`'s own `SCROLL_CATALYST_POOL`
 * already documents for its independent hardcoded pool. */
const SPELLBOOK_SCROLL_IDS = [
	'scrollIdentify', 'scrollCleanse', 'scrollMirror', 'scrollRecharging', 'scrollTeleportation',
	'scrollLullaby', 'scrollMapping', 'scrollRage', 'scrollRetribution', 'scrollTerror',
] as const;
const SPELLBOOK_SCROLL_WEIGHTS = [6, 4, 3, 3, 3, 2, 2, 2, 2, 2];

/** `UnstableSpellbook()`/`setupScrolls()` (tag `v3.3.8`): builds the per-instance shuffled
 * queue once, at generation (see `generatedInventoryItem`'s `spellbook` case) - a weighted
 * draw-without-replacement over the ten-class pool above, exactly matching Java's repeated
 * `Random.chances(probs)` with each picked index zeroed afterward. */
export function setupSpellbookScrolls(): string[] {
	const weights = [...SPELLBOOK_SCROLL_WEIGHTS];
	const order: string[] = [];
	for (;;) {
		const i = Random.weighted(weights);
		if (i === null) break;
		order.push(SPELLBOOK_SCROLL_IDS[i]!);
		weights[i] = 0;
	}
	return order;
}

/** `UnstableSpellbook.doReadEffect()`'s scroll draw (tag `v3.3.8`): `Generator.randomUsingDefaults
 * (SCROLL)` (a fresh weighted pick, unrelated to the per-instance queue above), retried while the
 * result is `ScrollOfIdentify`/`ScrollOfRemoveCurse`/`ScrollOfMagicMapping` on a coin flip
 * (`Random.Int(2)==0`, halving their effective frequency) - `ScrollOfTransmutation` never comes up
 * at all, already excluded from the pool this draws from. */
export function randomSpellbookScroll(): string {
	let picked: string;
	do {
		const weights = [...SPELLBOOK_SCROLL_WEIGHTS];
		const i = Random.weighted(weights) ?? 0;
		picked = SPELLBOOK_SCROLL_IDS[i]!;
	} while ((picked === 'scrollIdentify' || picked === 'scrollCleanse' || picked === 'scrollMapping') && Random.chance(0.5));
	return picked;
}

/** `(int)(level*0.6f)+2` (tag `v3.3.8`): both the constructor's initial `chargeCap` (`level=0`)
 * and `upgrade()`'s recomputed one share this one formula, so - like `hornChargeCap`/
 * `beaconChargeCap` - this port computes it from `level` on demand rather than storing a
 * separate field that could drift out of sync. */
export function spellbookChargeCap(level: number): number {
	return Math.floor(level * mwlItemEffectValue('spellbook', 'chargeCapPerLevel')) + mwlItemEffectValue('spellbook', 'chargeCapBase');
}

/** `UnstableSpellbook.execute(AC_READ)`/`doReadEffect()` (tag `v3.3.8`): spends one charge and
 * applies a freshly drawn regular scroll's real effect through the same `applyScrollEffect` seam
 * the Arcane Catalyst already uses (`scene.castScrollEffect`). Real Java's `blinded` gate
 * (`hero.buff(Blindness.class)`) has no equivalent here - this port has no `Blindness`
 * buff/mechanic at all (see the Bandit-steal comment in `dungeonScene.ts` for the same gap
 * elsewhere), so reading is never blocked by it - **Not ported**, not silently dropped. The real
 * "empowered" branch (a `WndOptions` choice to read the drawn scroll's *exotic* counterpart once
 * its regular class has already graduated out of the queue) is **Not ported**: this port's item
 * catalogue has no `ExoticScroll` classes at all (the same gap `randomAlchemicalPotion`/
 * `randomArcaneScroll` already document for the two catalysts), so every read always applies the
 * regular scroll's effect regardless of queue state. Two of the ten drawable classes
 * (`scrollIdentify`/`scrollCleanse`) are not yet implemented by `applyScrollEffect` itself (an
 * existing gap shared with the Arcane Catalyst's own use of the same seam, not introduced here);
 * drawing one still spends the charge, matching Java's unconditional `charge--`, but currently
 * has no visible effect. */
export function useSpellbook(scene: ArtifactActionContext, instanceId?: string): void {
	const book = refuseIfCursed(scene, 'spellbook', instanceId) as (typeof scene.bag.items[number] & SpellbookItem) | undefined;
	if (!book || scene.hero.magicImmune) return;
	const level = book.level ?? 0;
	const charge = book.charge ?? spellbookChargeCap(level);
	if (charge <= 0) { scene.say(t('items.artifacts.unstablespellbook.no_charge'), 'negative'); return; }
	book.charge = charge - 1;
	const scrollId = randomSpellbookScroll();
	scene.castScrollEffect?.(scrollId);
}

/** `UnstableSpellbook.itemSelector.onSelect()` (tag `v3.3.8`): `AC_ADD` lets the player feed a
 * carried, identified scroll matching one of the queue's *front two* entries to skip past it -
 * removing it from the queue, consuming the carried scroll, and permanently raising the book's
 * own level (real Java's `upgrade()`, capped at `levelCap`). Unlike the passive charge clock, this
 * is the queue's only mutator, so `scrolls` otherwise stays exactly as `setupSpellbookScrolls`
 * built it for the rest of the item's life. Returns `false` when nothing was eligible (matching
 * Java's own `WndBag.ItemSelector.itemSelectable` filter, which never even offers an ineligible
 * item - `unable_scroll`/`unknown_scroll` are correspondingly unreachable defensive branches in
 * real Java too, not a gap this port introduces). */
export function addScrollToSpellbook(scene: ArtifactActionContext, scrollId: string, instanceId?: string): boolean {
	const book = findArtifact(scene, 'spellbook', instanceId) as (typeof scene.bag.items[number] & SpellbookItem) | undefined;
	if (!book || book.cursed) return false;
	const levelCap = mwlItemEffectValue('spellbook', 'levelCap');
	const level = book.level ?? 0;
	if (level >= levelCap) return false;
	const scrolls = book.scrolls ?? [];
	const frontIndex = scrolls.slice(0, 2).indexOf(scrollId);
	if (frontIndex === -1) return false;
	const carried = findArtifact(scene, scrollId);
	if (!carried || carried.quantity <= 0 || carried.identified === false) return false;
	scrolls.splice(frontIndex, 1);
	scene.bag.remove(scrollId, 1);
	const newLevel = level + 1;
	//`upgrade()`'s trim: `while (!scrolls.isEmpty() && scrolls.size() > levelCap-1-level())`,
	//using the *pre-increment* level - already implied here since `scrolls` shrank by exactly
	//one from the splice above and `levelCap-1-level` shrinks by exactly one per level too.
	while (scrolls.length > levelCap - 1 - newLevel) scrolls.shift();
	book.scrolls = scrolls;
	book.level = newLevel;
	scene.say(t('items.artifacts.unstablespellbook.infuse_scroll'), 'positive');
	return true;
}
