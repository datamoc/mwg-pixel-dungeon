import { openAlchemyRecipes } from '../../../items/alchemy';
import type { DungeonScene } from '../../dungeonScene';
import { elementalStrikeAbilityMethods } from './elementalStrikeAbility';
import { placeCharacterArt } from '../../../ui/characterPlacement';
import { Random, Roguelike, TintedSprite } from 'mwg';
import { UNSTABLE_DELEGATES } from '../../../items/itemAffixes';
import { capitalize, has, t } from '../../../i18n/index';
import { SEER_SHOT_COOLDOWN, allyWarpRange, seerShotDuration } from '../../../talentEffects';
import { runState } from '../../../runState';
import { armorAbilityDef, armorChargeUse, type ArmorAbilityDef } from '../../../armorAbilities';
import { wandTypeFromSource, type WandType } from '../../../items/wands';
import { staffImbueFor } from '../../../items/wands';
import { ELEMENTAL_BLAST_DAMAGE_FACTORS, elementalBlastAim, elementalBlastAoeSize, elementalBlastAmokDuration, elementalBlastBlindnessDuration, elementalBlastCharmDuration, elementalBlastCorrosion, elementalBlastDamage, elementalBlastEffectMulti, elementalBlastFrostDuration, elementalBlastKnockback, elementalBlastLightDuration, elementalBlastParalysisDuration, elementalBlastReactiveShield, elementalBlastRechargingDuration, elementalBlastRegrowthChance, elementalBlastRootsDuration, elementalBlastTransfusionSplit, elementalBlastUndeadDamage } from '../../../simulation/mageAbilities';
import { UNDEAD_KINDS } from '../../../monsters';
import { isChallengeEnabled } from '../../../challenges';
import { spendWildMagicShot, wildMagicBoostedLevel, wildMagicShotCost, wildMagicShots } from '../../../simulation/spareWands';
import { bodySlamDamage, impactWaveStrength, impactWaveVulnerable, shockForceParalyses, shockwaveCone, shockwaveDamage, strikingWaveProcs, type DamageRoll } from '../../../simulation/warriorAbilities';
import { SPIRIT_HAWK_LIFESPAN, spiritHawkDodges } from '../../../simulation/huntressAbilities';
import { closeTheGapRange, directedPowerBoost, elementalAnnoyingChance, elementalBaseDamage, elementalBlobAmount, elementalBlockingShield, elementalBloomingBudget, elementalCorruptingChance, elementalCurseChance, elementalFurrowStep, elementalGrimChance, elementalKineticSplash, elementalKnockback, elementalLuckyChance, elementalPowerMulti, elementalProjectingSplash, elementalRootsDuration, elementalSacrificialOther, elementalSacrificialSelf, elementalStrikeCone, elementalStrikeResisted, elementalVampiricHeal, invigoratingVictoryHeal, type ElementalStrikeDamageSource } from '../../../simulation/duelistAbilities';
import { shadowCloneAccuracy, shadowCloneArmorShare, shadowCloneBladeShare, shadowCloneEvasion, shadowCloneHp } from '../../../simulation/rogueAbilities';
import { showChoiceWindow } from '../../../ui/portWindows';
import { POWER_OF_MANY_TURNS, trinityBodyDuration } from '../../../simulation/clericSpells';
import { trinityChargeUsePerEffect } from '../../../simulation/clericSpells';
import { randomSpellbookScroll } from '../../../items/artifactActions';
import { applyScrollEffect } from '../../../items/scrollEffects';
import { eatTrinityHornFlow } from '../../../items/horn';
import { useChainsFlow } from '../../../items/chains';
import { useArmbandFlow } from '../../../items/armband';
import { beginSandalsRootFlow } from '../../../items/sandals';
import { useTalismanFlow } from '../../../items/talisman';
import { mwlItemEffectValue } from '../../../mwlContent';
import { RING_DEFS } from '../../../items/ringModifiers';
import { MWL_ARMOR_GLYPHS, MWL_WEAPON_ENCHANTS } from '../../../mwlContent';
import { coneCells } from '../../../mechanics/cone';
import { traceRayToTarget } from '../../../mechanics/rays';
import { EMBERS, FLOOR, GRASS, HIGH_GRASS, TILE, WATER } from '../../../dungeonConstants';
import { BUFF_DURATION, addBuff, applyElementalBacklash, reigniteBuff, rollDamage, setBleeding, type Creature, type Step } from '../../../combat';
import { applyChillFreeze } from '../../../simulation/buffs';
import { BOSSES, IMMOVABLE_KINDS, heroSheet, liveStats, type MonsterId } from '../../../monsters';
import { HARMFUL_PLANTS, NATURES_POWER_DURATION } from '../shared';

const TRINITY_BODY_GLYPH_CLASSES: Readonly<Record<string, string>> = { stone: 'Stone', repulsion: 'Repulsion', antimagic: 'AntiMagic', viscosity: 'Viscosity' };

/** A flow context whose item lookup (`chainsOf`, `armbandOf`, ...) returns `item` for any instance id. */
function trinitySyntheticFlow<C extends object>(ctx: C, lookup: string, item: object): C {
	return Object.create(ctx, { [lookup]: { value: () => item } }) as C;
}

/** DungeonScene methods, moved verbatim from `dungeonScene.ts` (group `armorAbilityUse`). Each takes the scene as `this`;
 * `dungeonScene.ts` merges them back onto the class prototype. */
export const armorAbilityUseMethods = {
	...elementalStrikeAbilityMethods,
	/**
	 * `ClassArmor.execute()`'s `AC_ABILITY` branch: refuse with Java's own `no_ability`/`low_charge`
	 * message, then either act on the hero's own cell (Java's `targetingPrompt() == null`) or open
	 * the real cell selector. The charge is only spent once the ability actually runs, which is
	 * Java's order too - each ability's `activate()` does `armor.charge -= chargeUse(hero)` itself,
	 * after the cell is known.
	 */
	useArmorAbility(this: DungeonScene): void {
		const def = this.armorAbility ? armorAbilityDef(this.armorAbility) : undefined;
		if (!def) {
			this.say(t('items.armor.classarmor.no_ability'), 'negative');
			return;
		}
		if (this.armorCharge < this.armorAbilityCost(def)) {
			this.say(t('items.armor.classarmor.low_charge'), 'negative');
			return;
		}
		//SpiritHawk's targeting depends on its own state, not the class's: `targetingPrompt()` is
		//null while no hawk is out (so the summon fires immediately), and non-null once one is (so
		//the re-cast opens the cell selector and orders the hawk around).
		const powerOfManyNeedsCell = def.id === 'powerofmany'
			? this.poweredLightAlly() !== undefined || this.poweredAlly() === undefined
			: def.targeting === 'cell';
		const needsCell = powerOfManyNeedsCell
			|| (def.targeting === 'hawk' && this.spiritHawk() !== undefined)
			|| (def.targeting === 'clone' && this.shadowClone() !== undefined)
			|| (def.targeting === 'beacon' && this.warpBeacon === null && this.talentRank('remote_beacon') > 0);
		if (!needsCell) {
			this.activateArmorAbility(null);
			return;
		}
		//Java's `GameScene.selectCell` has no range or sight limit (the effects stop at walls
		//themselves), so the whole map is offered.
		//
		//The hero's own cell is refused only where Java refuses it, which is the abilities that
		//act on a *hostile* target: `Shockwave`'s `self_target` branch (Shockwave.java 72),
		//`SpectralBlades`' (SpectralBlades.java 63, the same message), and `DeathMark`'s
		//`ally_target` branch, which refuses every non-enemy cell (DeathMark.java 55). Every other
		//targeted ability here accepts its own cell in Java, and for the spirit hawk that cell is
		//outright meaningful: `DirectableAlly.directTocell` reads it as "follow me again".
		//`WildMagic` refuses the hero's own cell silently like `Shockwave` does: Java says its
		//`self_target` line, but neither key (`self_target`, `prompt`) exists in the generated
		//catalog, so a new `port.*` string would be the only way to say it - the silent
		//refusal is this port's standing convention instead (see the comment above).
		const refusesSelf = def.id === 'shockwave' || def.id === 'spectralblades' || def.id === 'deathmark' || def.id === 'wildmagic';
		this.beginAiming({
			range: Math.max(this.level.width, this.level.height),
			requireLineOfSight: false,
			validate: (cell) => !refusesSelf || cell.x !== this.hero.x || cell.y !== this.hero.y,
			onConfirm: (cell) => this.activateArmorAbility(cell),
		});
	},

	/** Spends the charge and runs the chosen ability's own `activate()`. `Invisibility.dispel()` is
	 *  Java's trailing call for every one of them. */
	activateArmorAbility(this: DungeonScene, cell: Step | null): void {
		const id = this.armorAbility;
		const def = id ? armorAbilityDef(id) : undefined;
		if (!id || !def) return;
		const cost = this.armorAbilityCost(def);
		if (this.armorCharge < cost) {
			this.say(t('items.armor.classarmor.low_charge'), 'negative');
			return;
		}
		//Java's `Hero.act()` runs before the action, and this is the point where the action is
		//committed (a cancelled aim never reaches here), so a live Endure window settles now - which
		//is also what keeps Endure's own cast from settling the tracker it is about to attach.
		this.settleEndure();
		const activated = id === 'heroicleap' ? this.activateHeroicLeap(def, cost, cell)
			: id === 'shockwave' ? this.activateShockwave(def, cost, cell)
				: id === 'endure' ? this.activateEndure(def, cost)
					: id === 'deathmark' ? this.activateDeathMark(def, cost, cell)
						: id === 'spectralblades' ? this.activateSpectralBlades(def, cost, cell)
							: id === 'warpbeacon' ? this.activateWarpBeacon(def, cost, cell)
								: id === 'smokebomb' ? this.activateSmokeBomb(def, cost, cell)
								: id === 'naturespower' ? this.activateNaturesPower(def, cost)
									: id === 'spirithawk' ? this.activateSpiritHawk(def, cost, cell)
										: id === 'feint' ? this.activateFeint(def, cost, cell)
											: id === 'shadowclone' ? this.activateShadowClone(def, cost, cell)
												: id === 'challenge' ? this.activateChallenge(def, cost, cell)
													: id === 'elementalstrike' ? this.activateElementalStrike(def, cost, cell)
														: id === 'wildmagic' ? this.activateWildMagic(def, cost, cell)
										: id === 'elementalblast' ? this.activateElementalBlast(def, cost)
											: id === 'ascendedform' ? this.activateAscendedForm(def, cost)
								: id === 'trinity' ? this.activateTrinity(def, cost)
									: id === 'powerofmany' ? this.activatePowerOfMany(def, cost, cell)
								: false;
		if (!activated) return;
		this.refresh();
	},

	/**
	 * `AscendedForm.activate()` (`actors/hero/abilities/cleric/AscendedForm.java`,
	 * tag `v3.3.8`): reset a separate 30-point ShieldBuff for ten actor turns,
	 * spend the computed charge, dispel invisibility, and consume one turn. The
	 * Java extends this state through spell-cast shielding/history and the
	 * Divine Intervention/Judgement/Flash tome spells, all integrated here.
	 * `Buff.affect()` returns the live buff on a mid-form recast, and `reset()` only
	 * `setShield(30)`s (raise-only) and restores `left` - the cast history, Flash
	 * count and the once-per-form DivineIntervention flag all carry over.
	 */
	activateAscendedForm(this: DungeonScene, _def: ArmorAbilityDef, cost: number): boolean {
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		if (this.ascendedTurns <= 0) {
			this.ascendedBarrier.clear();
			this.ascendedSpellCasts = 0;
			this.ascendedFlashCasts = 0;
			this.ascendedDivineCast = false;
		}
		if (this.ascendedBarrier.total < 30) this.ascendedBarrier.add(30 - this.ascendedBarrier.total);
		this.ascendedTurns = 10;
		delete this.hero.buffs['invisibility'];
		this.say(t('port.log.armorabilitychosen', { ability: t('port.armorability.ascendedform.name') }), 'positive');
		this.spendHeroAction(1);
		return true;
	},

	/**
	 * `Trinity.activate()` (`actors/hero/abilities/cleric/Trinity.java`, tag `v3.3.8`)
	 * opens a form selector before spending charge. Body Form has its modeled weapon-enchantment
	 * subset; Mind/Spirit still record only their selection because their item-level effect
	 * dispatchers need per-item state this port does not yet have.
	 */
	activateTrinity(this: DungeonScene, _def: ArmorAbilityDef, cost: number): boolean {
		showChoiceWindow(this.gameWindows, 'Cleric Trinity', 'Choose a Trinity form.', [
			{ label: 'Body Form', onPick: () => this.chooseTrinityBodyEffect(cost) },
			{ label: 'Mind Form', onPick: () => this.commitTrinityForm('mind', cost) },
			{ label: 'Spirit Form', onPick: () => this.chooseTrinitySpiritEffect(cost) },
		]);
		return false;
	},

	/**
	 * Java's `Trinity.WndItemtypeSelect` stores a discovered enchantment or glyph on its tome;
	 * this port has no discovery/stored-item inventory. Offer its modeled positive weapon
	 * enchantments and the four positive armor glyphs with live defensive proc hooks.
	 */
	chooseTrinityBodyEffect(this: DungeonScene, cost: number): void {
		if (this.hero.magicImmune) { this.say(t('port.log.tomenospell'), 'negative'); return; }
		const candidates = MWL_WEAPON_ENCHANTS
			.filter(({ id, curse }) => !curse && id !== this.weaponAffix && id !== this.armorGlyph);
		const glyphs = MWL_ARMOR_GLYPHS.filter(({ id, curse }) =>
			!curse && id in TRINITY_BODY_GLYPH_CLASSES && id !== this.armorGlyph);
		if (candidates.length === 0 && glyphs.length === 0) {
			this.say('Trinity has no other supported body effect to apply.', 'warning');
			return;
		}
		showChoiceWindow(this.gameWindows, 'Trinity Body Form', 'Choose a supported body effect.', [
			...candidates.map(({ id }) => ({
				label: id,
				onPick: () => this.commitTrinityBodyEffect(id, cost),
			})),
			...glyphs.map(({ id }) => ({
				label: `Glyph: ${id}`,
				onPick: () => this.commitTrinityBodyGlyph(id, cost),
			})),
		]);
	},

	commitTrinityBodyEffect(this: DungeonScene, affix: string, baseCost: number): void {
		if (this.hero.magicImmune) return;
		//`Trinity.WndUseTrinity` (`Trinity.java`, tag `v3.3.8`) refuses a BodyForm effect
		//that duplicates the equipped weapon enchantment or armor glyph. Recheck both at commit
		//time so a stale picker cannot spend charge on an effect already supplied by gear.
		if (affix === this.weaponAffix || affix === this.armorGlyph) {
			this.say('Trinity cannot duplicate an equipped enchantment or glyph.', 'warning');
			return;
		}
		const cost = trinityChargeUsePerEffect(baseCost, affix[0]?.toUpperCase() + affix.slice(1), 'body');
		if (this.armorCharge < cost) {
			this.say(t('items.armor.classarmor.low_charge'), 'negative');
			return;
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		this.trinityBodyAffix = affix;
		this.trinityBodyGlyph = null;
		this.trinityForm = 'body';
		this.trinityTurns = trinityBodyDuration(this.talentRank('body_form'));
		delete this.hero.buffs['invisibility'];
		this.spendHeroAction(1);
		this.say(`Trinity body form: ${affix}`, 'positive');
	},

	commitTrinityBodyGlyph(this: DungeonScene, glyph: string, baseCost: number): void {
		if (this.hero.magicImmune) return;
		if (!(glyph in TRINITY_BODY_GLYPH_CLASSES) || glyph === this.armorGlyph) {
			this.say('Trinity cannot duplicate an equipped or unsupported armor glyph.', 'warning');
			return;
		}
		const cost = trinityChargeUsePerEffect(baseCost, TRINITY_BODY_GLYPH_CLASSES[glyph]!, 'body');
		if (this.armorCharge < cost) {
			this.say(t('items.armor.classarmor.low_charge'), 'negative');
			return;
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		this.trinityBodyAffix = null;
		this.trinityBodyGlyph = glyph;
		this.trinityForm = 'body';
		this.trinityTurns = trinityBodyDuration(this.talentRank('body_form'));
		//Java's `Trinity.WndUseTrinity` onPick runs `Invisibility.dispel()` for either BodyForm effect.
		delete this.hero.buffs['invisibility'];
		this.spendHeroAction(1);
		this.say(`Trinity body form: Glyph: ${glyph}`, 'positive');
	},

	commitTrinityForm(this: DungeonScene, form: 'body' | 'mind' | 'spirit', cost: number): void {
		if (this.armorCharge < cost) {
			this.say(t('items.armor.classarmor.low_charge'), 'negative');
			return;
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		this.trinityForm = form;
		this.trinityTurns = form === 'body' ? trinityBodyDuration(this.talentRank('body_form')) : 1;
		this.spendHeroAction(1);
		this.say(`Trinity: ${form} form`, 'positive');
	},

	/**
	 * Java's `Trinity.WndItemtypeSelect` offers every discovered Ring/Artifact type (this port
	 * has no discovery/stored-item inventory, the same reduction as BodyForm's catalog); its
	 * `WndUseTrinity` then either grants a 20-turn `SpiritFormBuff` (Rings, now offered - the
	 * *independent* second ring slot lives in `trinitySpiritRing()`, read by the ring-formula
	 * call sites alongside `effectiveRing()`; `ChaliceOfBlood` shares this same buff branch but
	 * is not a `Ring` and has no port model for a second `chaliceRegen` source - **not offered**)
	 * or runs the artifact's one-shot `SpiritForm.applyActiveArtifactEffect()`. Of that dispatch's
	 * ten cases, eight are modeled: `UnstableSpellbook.doReadEffect()` runs the *inner* read (a fresh
	 * scroll draw + apply) with none of `execute()`'s outer equip/charge/cursed gates, matching
	 * Trinity's own bypass exactly, so no synthetic bag instance is needed; `HornOfPlenty`
	 * (`doEatEffect(hero, 1)`), `TimekeepersHourglass` (a bespoke `TimeBubble.reset(artifactLevel())`,
	 * not the hourglass's own freeze) and `DriedRose` (a corrupted Wraith, HP `20 + 8*artifactLevel`)
	 * are likewise bespoke or inner-method calls, not reuses of this port's persistent-item flows.
	 * `EtherealChains`, `MasterThievesArmband`, `SandalsOfNature` and `TalismanOfForesight` are the
	 * four cell-targeted ones: Java hands the synthetic instance's own selector listener to the
	 * cell selector, which here is the ported flow itself run over a synthetic item (see
	 * `trinitySyntheticFlow`). `AlchemistsToolkit` opens the alchemy pot with zero toolkit energy and
	 * `SkeletonKey` runs its own targeter (`skeletonKeyScene.ts`'s `trinitySpiritSkeletonKey`).
	 */
	chooseTrinitySpiritEffect(this: DungeonScene, cost: number): void {
		showChoiceWindow(this.gameWindows, 'Trinity Spirit Form', 'Choose a supported spirit effect.', [
			...Object.keys(RING_DEFS).map((key) => ({
				label: `Ring: ${key}`,
				onPick: () => this.commitTrinitySpiritRing(`ring_${key}`, cost),
			})),
			{ label: 'Unstable Spellbook', onPick: () => this.commitTrinitySpiritSpellbook(cost) },
			{ label: 'Horn of Plenty', onPick: () => this.commitTrinitySpiritArtifact(cost, 'HornOfPlenty', 'Horn of Plenty', () => this.trinitySpiritHorn()) },
			{ label: "Timekeeper's Hourglass", onPick: () => this.commitTrinitySpiritArtifact(cost, 'TimekeepersHourglass', "Timekeeper's Hourglass", () => this.trinitySpiritHourglass(), true) },
			{ label: 'Dried Rose', onPick: () => this.commitTrinitySpiritArtifact(cost, 'DriedRose', 'Dried Rose', () => this.trinitySpiritRose(), true) },
			{ label: 'Ethereal Chains', onPick: () => this.commitTrinitySpiritArtifact(cost, 'EtherealChains', 'Ethereal Chains', () => this.trinitySpiritChains()) },
			{ label: "Master Thieves' Armband", onPick: () => this.commitTrinitySpiritArtifact(cost, 'MasterThievesArmband', "Master Thieves' Armband", () => this.trinitySpiritArmband()) },
			{ label: 'Sandals of Nature', onPick: () => this.commitTrinitySpiritArtifact(cost, 'SandalsOfNature', 'Sandals of Nature', () => this.trinitySpiritSandals()) },
			{ label: 'Talisman of Foresight', onPick: () => this.commitTrinitySpiritArtifact(cost, 'TalismanOfForesight', 'Talisman of Foresight', () => this.trinitySpiritTalisman()) },
			{ label: 'Skeleton Key', onPick: () => this.commitTrinitySpiritArtifact(cost, 'SkeletonKey', 'Skeleton Key', () => this.trinitySpiritSkeletonKey()) },
			{ label: 'Chalice of Blood', onPick: () => this.commitTrinitySpiritArtifact(cost, 'ChaliceOfBlood', 'Chalice of Blood', () => this.trinitySpiritChalice(), true) },
			{ label: "Alchemist's Toolkit", onPick: () => this.commitTrinitySpiritArtifact(cost, 'AlchemistsToolkit', "Alchemist's Toolkit", () => this.trinitySpiritToolkit()) },
		]);
	},

	/**
	 * `SpiritForm.applyActiveArtifactEffect`'s Ring branch (`Trinity.java`'s `WndUseTrinity`
	 * onClick, tag `v3.3.8`): `Buff.prolong(hero, SpiritFormBuff, 20f).setEffect(ring)`. This port
	 * has no `Buff` object to hang the effect on, so the same 20-turn window rides the existing
	 * `trinityForm`/`trinityTurns` clock (shared with BodyForm's timed window) and the ring choice
	 * itself lives in `trinitySpiritEffect`, read back by `trinitySpiritRing()`. Refuses a
	 * duplicate of the equipped ring's own kind, matching Java's parallel checks for the
	 * weapon-enchant/glyph BodyForm cases (Trinity has no such check for rings specifically in
	 * Java, but stacking a *second* copy of the exact kind already worn would double-count the
	 * same formula rather than adding a distinct one, so this port declines it as a stated
	 * addition, not a Java-cited rule).
	 */
	commitTrinitySpiritRing(this: DungeonScene, ringId: string, baseCost: number): void {
		if (this.equippedRing?.id === ringId) {
			this.say('Trinity cannot duplicate the equipped ring.', 'warning');
			return;
		}
		const cost = trinityChargeUsePerEffect(baseCost, 'Ring', 'spirit');
		if (this.armorCharge < cost) {
			this.say(t('items.armor.classarmor.low_charge'), 'negative');
			return;
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		this.trinitySpiritEffect = ringId;
		this.trinityMindEffect = null;
		this.trinityForm = 'spirit';
		this.trinityTurns = 20;
		delete this.hero.buffs['invisibility'];
		this.syncHeroFromStats();
		this.spendHeroAction(1);
		this.say(`Trinity spirit form: ${ringId}`, 'positive');
	},

	/**
	 * `SpiritForm.applyActiveArtifactEffect(UnstableSpellbook)` (`SpiritForm.java`, tag `v3.3.8`):
	 * calls `effect.doReadEffect(hero)` directly, skipping `execute()`'s `isEquipped`/`charge<=0`/
	 * `cursed` gates entirely - Trinity's synthetic instance is never cursed and its own charge
	 * pool is never consulted here (`doReadEffect` decrements it, but nothing in this path ever
	 * reads it back, so this port tracks no persisted charge for it at all - a one-shot ability
	 * gated only by the Trinity armor's own charge cost, like every other Cleric spell). Draws
	 * one scroll via the same weighted picker `useSpellbook` uses and applies it through the
	 * shared `applyScrollEffect` seam the Arcane Catalyst and the real Unstable Spellbook both use
	 * - the two gaps that seam already has (`scrollIdentify`/`scrollCleanse` unmodeled, the
	 * `ExoticScroll` empowered-choice window absent) are pre-existing there, not introduced here.
	 */
	/**
	 * The shared tail of `Trinity.WndUseTrinity`'s Spirit button (`Trinity.java`, tag `v3.3.8`):
	 * refused under MagicImmune (the button is disabled), spends the armor's per-effect charge,
	 * `Invisibility.dispel()`s, then runs `SpiritForm.applyActiveArtifactEffect()`'s case. Cases
	 * whose Java branch ends in `spendAndNext(1f)` pass `spendsTurn` (Horn's own `doEatEffect`
	 * spends its meal time instead). Nothing is spent on a refusal.
	 */
	commitTrinitySpiritArtifact(this: DungeonScene, baseCost: number, itemClass: string, label: string, run: () => void, spendsTurn = false): void {
		const cost = trinityChargeUsePerEffect(baseCost, itemClass, 'spirit');
		if (this.armorCharge < cost) {
			this.say(t('items.armor.classarmor.low_charge'), 'negative');
			return;
		}
		if (this.hero.magicImmune) {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		delete this.hero.buffs['invisibility'];
		run();
		if (spendsTurn) this.spendHeroAction(1);
		this.say(`Trinity spirit form: ${label}`, 'positive');
	},

	/** `SpiritForm.artifactLevel()` (tag `v3.3.8`): `2 + 2*pointsInTalent(SPIRIT_FORM)`, the level
	 * every synthetic artifact is conjured at. */
	trinityArtifactLevel(this: DungeonScene): number {
		return 2 + 2 * this.talentRank('spirit_form');
	},

	/**
	 * `Artifact.resetForTrinity(visibleLevel)` (tag `v3.3.8`): the synthetic instance's level is
	 * `round(artifactLevel * levelCap / 10)`, its charge the cap and its `exp` `Integer.MIN_VALUE`
	 * (never levels). Each case below hands the ported flow a context whose `<item>Of(instanceId)`
	 * lookup returns that synthetic item instead of a bag entry (`trinitySyntheticFlow`), leaving the
	 * flow (its gates, aim, confirm and turn) untouched. The Trinity armor's charge was already
	 * spent up front, as in Java, so a refused or cancelled aim wastes it there too.
	 */
	trinitySyntheticLevel(this: DungeonScene, item: string): number {
		return Math.round(this.trinityArtifactLevel() * mwlItemEffectValue(item, 'levelCap') / 10);
	},

	/** `resetForTrinity` for `EtherealChains`: `charge = 5 + level*2` (its soft cap). */
	trinitySpiritChains(this: DungeonScene): void {
		const level = this.trinitySyntheticLevel('chains');
		useChainsFlow(trinitySyntheticFlow(this.chainsFlowContext(), 'chainsOf', { level, charge: 5 + level * 2, exp: -2147483648, cursed: false }), 'trinity-spirit');
	},

	trinitySpiritArmband(this: DungeonScene): void {
		const level = this.trinitySyntheticLevel('armband');
		const charge = mwlItemEffectValue('armband', 'chargeCapBase') + Math.floor(level / 2);
		useArmbandFlow(trinitySyntheticFlow(this.armbandFlowContext(), 'armbandOf', { level, charge, exp: -2147483648, cursed: false }), 'trinity-spirit');
	},

	/**
	 * `SandalsOfNature.resetForTrinity` only clears `curSeedEffect` (it never calls
	 * `super.resetForTrinity`, so the level stays 0), then `applyActiveArtifactEffect` picks a
	 * random one of Blindweed/Fadeleaf/Firebloom/Icecap/Sorrowmoss/Stormvine and opens the root
	 * aim. `cellSelector` checks no charge, so the synthetic sandals carry a full 100 to clear
	 * the port flow's own charge gate.
	 */
	trinitySpiritSandals(this: DungeonScene): void {
		const kinds = ['blindweed', 'fadeleaf', 'firebloom', 'icecap', 'sorrowmoss', 'stormvine'];
		const sandals = { level: 0, charge: mwlItemEffectValue('sandals', 'chargeCap'), cursed: false, curSeedEffect: kinds[Random.int(0, kinds.length)]!, seeds: [] as string[] };
		beginSandalsRootFlow(trinitySyntheticFlow(this.sandalsFlowContext(), 'sandalsOf', sandals), 'trinity-spirit');
	},

	/**
	 * `applyActiveArtifactEffect(AlchemistsToolkit)`: `AlchemyScene.assignToolkit(effect)` then the alchemy scene.
	 * The synthetic toolkit's `chargeCap` is 0 so `charge = 0`: no bonus energy, i.e. plain alchemy-pot access.
	 */
	trinitySpiritToolkit(this: DungeonScene): void {
		openAlchemyRecipes(this.alchemyFlowContext());
	},

	/**
	 * `applyActiveArtifactEffect(ChaliceOfBlood)` only attaches the 20-turn `SpiritFormBuff`; the heal is
	 * `Regeneration.act()`'s `SpiritFormBuff.artifact() instanceof ChaliceOfBlood` branch
	 * (`chaliceLevel = SpiritForm.artifactLevel()`), read by `tickNaturalRegeneration` via
	 * `trinitySpiritEffect === 'chalice'`. Rides the same `trinityForm`/`trinityTurns` clock as the Ring effect.
	 */
	trinitySpiritChalice(this: DungeonScene): void {
		this.trinitySpiritEffect = 'chalice';
		this.trinityMindEffect = null;
		this.trinityForm = 'spirit';
		this.trinityTurns = 20;
	},

	trinitySpiritTalisman(this: DungeonScene): void {
		const level = this.trinitySyntheticLevel('talisman');
		useTalismanFlow(trinitySyntheticFlow(this.talismanFlowContext(), 'talismanOf', { level, charge: mwlItemEffectValue('talisman', 'chargeCap'), exp: -2147483648, cursed: false }), 'trinity-spirit');
	},

	/** `applyActiveArtifactEffect(HornOfPlenty)`: `doEatEffect(hero, 1)` - see `eatTrinityHornFlow`. */
	trinitySpiritHorn(this: DungeonScene): void {
		eatTrinityHornFlow(this.hornFlowContext());
	},

	/**
	 * `applyActiveArtifactEffect(TimekeepersHourglass)`: bypasses the hourglass's own charge/
	 * `timeFreeze` entirely for `Buff.affect(hero, Swiftthistle.TimeBubble).reset(artifactLevel())`
	 * - a plain Swiftthistle-style bubble of `artifactLevel` absorbed hero actions. `reset(n)`
	 * stores `n + 1` because the casting action itself is spent inside it; this port's bubble
	 * counter (`timeBubbleTurns`, ticked in `spendScheduledTurn`) likewise counts that action,
	 * so `artifactLevel + 1` is armed here and the cast's own `spendHeroAction(1)` consumes one.
	 * Not `hourglassFreeze` (no hourglass turn-cost bookkeeping). No `onArtifactUsed` in Java's branch.
	 */
	trinitySpiritHourglass(this: DungeonScene): void {
		this.hourglassFreeze = false;
		this.timeBubbleTurns = this.trinityArtifactLevel() + 1;
	},

	/**
	 * `applyActiveArtifactEffect(DriedRose)`: a `Wraith` on a random empty neighbouring cell with
	 * `HP = HT = 20 + 8*artifactLevel` and the `Corruption` buff, then `Talent.onArtifactUsed` and
	 * `spendAndNext(1f)`. This port has no `Corruption` buff: the established stand-in is the
	 * wand-of-corruption conversion (`isAlly` + the shared controlled-ally scheduler, buffs
	 * cleared), reused here as-is. No room around the hero spawns nothing but still spends the
	 * turn and charge, as in Java. `spawnWraithAt` keeps its own wraith stat block (level-scaled
	 * accuracy/evasion/damage); only HP is Trinity's.
	 */
	trinitySpiritRose(this: DungeonScene): void {
		const wraith = this.spawnWraithAt('wraith', this.hero.x, this.hero.y);
		if (wraith) {
			wraith.hp = wraith.maxHp = 20 + 8 * this.trinityArtifactLevel();
			wraith.isAlly = true;
			wraith.allyKind = 'mirror';
			wraith.buffs = {};
			wraith.sleeping = false;
			wraith.seesHero = false;
		}
		this.armEnhancedRingsFromArtifact();
	},

	commitTrinitySpiritSpellbook(this: DungeonScene, baseCost: number): void {
		const cost = trinityChargeUsePerEffect(baseCost, 'UnstableSpellbook', 'spirit');
		if (this.armorCharge < cost) {
			this.say(t('items.armor.classarmor.low_charge'), 'negative');
			return;
		}
		if (this.hero.magicImmune) {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		delete this.hero.buffs['invisibility'];
		applyScrollEffect(randomSpellbookScroll(), this.scrollEffectsContext());
		this.spendHeroAction(1);
		this.say('Trinity spirit form: Unstable Spellbook', 'positive');
	},

	/**
	 * `PowerOfMany.activate()` (`PowerOfMany.java`, tag `v3.3.8`) lets the player empower an
	 * existing ally or summon a `LightAlly` on an empty valid cell. The LightAlly uses a rat
	 * record only as its scheduler/combat/save carrier; its sprite, 80 HP, combat stats, command
	 * behavior, 25-point Barrier and no-loot/no-XP flags are replaced with Java's own values.
	 */
	activatePowerOfMany(this: DungeonScene, _def: ArmorAbilityDef, cost: number, cell: Step | null): boolean {
		const powered = this.poweredAlly();
		if (powered?.allyKind === 'lightAlly') {
			if (!cell) return false;
			this.directAlly(powered, cell, {
				defend: 'port.ally.order.defend', follow: 'port.ally.order.follow', attack: 'port.ally.order.attack',
			});
			return true;
		}
		// Java refuses another cast while any non-LightAlly actor already carries PowerBuff.
		if (powered) {
			this.say(t('port.ally.already_powered'), 'warning');
			return true;
		}
		if (!cell) return false;
		if (!this.fov.isVisible(cell.x, cell.y)) {
			this.say(t('port.ally.novision'), 'negative');
			return false;
		}
		const ally = this.creatureAt(cell.x, cell.y);
		if (ally && (!ally.isAlly || ally.isHero || ally.hp <= 0)) {
			this.say(t('actors.hero.abilities.armorability.no_target'), 'negative');
			return false;
		}
		// Java accepts `passable || avoid`; this Level wrapper has no separate avoid-cell map.
		if (!ally && !this.level.passable(cell.x, cell.y)) {
			this.say(t('port.ally.invalidtarget'), 'negative');
			return false;
		}
		const target = ally ?? this.spawnLightAlly(cell);
		if (!ally) {
			this.playTeleportAppear(cell, cell, target);
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		addBuff(target, 'powerOfMany', POWER_OF_MANY_TURNS);
		target.powerOfManyBarrier = 25;
		target.powerOfManyBarrierPartial = 0;
		delete this.hero.buffs['invisibility'];
		this.say(t('port.log.armorabilitychosen', { ability: t('port.armorability.powerofmany.name') }), 'positive');
		this.spendHeroAction(1);
		return true;
	},

	poweredAlly(this: DungeonScene): Creature | undefined {
		return this.creatures.find((creature) => creature.buffs['powerOfMany'] !== undefined && creature.hp > 0);
	},

	poweredLightAlly(this: DungeonScene): Creature | undefined {
		const ally = this.poweredAlly();
		return ally?.allyKind === 'lightAlly' ? ally : undefined;
	},

	/** `Ratmogrify.baseChargeUse` (50, tag `v3.3.8`) is charged like any other ability's, read
	 *  off its own `talent-rules.mwl` row so the cost lives in one place. Only RATSISTANCE's
	 *  damage factor is still open; RATLOMACY/RATFORCEMENTS below already read their ranks. */
	ratmogrifyChargeUse(this: DungeonScene): number {
		const def = armorAbilityDef('ratmogrify') ?? { id: 'ratmogrify', classId: this.heroClass, baseChargeUse: 50, targeting: 'cell', talents: [] as string[] };
		return armorChargeUse(def, { heroicEnergyRank: this.talentRank('heroic_energy') });
	},

	/**
	 * `HeroicLeap.activate()` (tag `v3.3.8`): the hero leaps to the aimed cell, stopping at the
	 * first wall or creature (`Ballistica.STOP_TARGET | STOP_SOLID`), stepping back one cell while
	 * the landing cell is occupied, then every hostile neighbour takes `BODY_SLAM` damage and, with
	 * `IMPACT_WAVE`, an aimed blast-wave shove. Java performs the move inside the `sprite.jump()`
	 * callback; this port's sprite tween is fire-and-forget, so the same sequence runs inline.
	 */
	activateHeroicLeap(this: DungeonScene, def: ArmorAbilityDef, cost: number, cell: Step | null): boolean {
		if (!cell) return false;
		//`if (hero.rooted) { PixelScene.shake(1, 1f); return; }` - no charge, no turn.
		//Deliberate divergence: the refusal feedback shakes (1, 0.15s), not Java's
		//full second - a 1s shake on a refused tap feels like a hit, and all three
		//ability refusals (leap, feint, smoke bomb) share the short form.
		if (this.hero.buffs['roots'] !== undefined) {
			this.shakeScreen(1, 0.15);
			return false;
		}
		const from = { x: this.hero.x, y: this.hero.y };
		const path = traceRayToTarget(this.level, from, cell, (x, y) => this.creatureAt(x, y), true);
		let dest = path.length > 0 ? path[path.length - 1]! : from;
		//"can't occupy the same cell as another char, so move back one" - Java walks the same path
		//backwards, and stops as soon as the landing cell is free (or is the hero's own cell).
		let back = path.length - 2;
		while (back >= 0 && (dest.x !== from.x || dest.y !== from.y)) {
			const occupant = this.creatureAt(dest.x, dest.y);
			if (!occupant || occupant === this.hero) break;
			dest = path[back]!;
			back--;
		}
		if (this.creatureAt(dest.x, dest.y) && this.creatureAt(dest.x, dest.y) !== this.hero) dest = from;
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		this.moveTo(this.hero, dest);
		const bodySlam = this.talentRank('body_slam');
		const impactWave = this.talentRank('impact_wave');
		const roll: DamageRoll = {
			normalIntRange: (min, max) => Random.normalRange(min, max),
			int: (maxExclusive) => Random.int(0, maxExclusive),
		};
		for (const [dx, dy] of Roguelike.neighbourOffsets(8) as ReadonlyArray<readonly [number, number]>) {
			const neighbour = this.creatureAt(this.hero.x + dx, this.hero.y + dy);
			if (!neighbour || neighbour === this.hero || neighbour.isAlly || neighbour.isNPC) continue;
			if (bodySlam > 0) {
				const damage = bodySlamDamage(
					bodySlam,
					Random.normalRange(this.hero.armor[0], this.hero.armor[1]),
					Random.normalRange(neighbour.armor[0], neighbour.armor[1]),
					roll,
				);
				this.applyAbilityDamage(neighbour, damage);
			}
			//`WandOfBlastWave.throwChar(mob, new Ballistica(mob.pos, mob.pos+i, MAGIC_BOLT),
			//strength, true, true, this)` - the port's established straight forced-movement
			//primitive is used for the shove (see `PORT_COVERAGE.md`), strength `1 + points`
			//with no talent gate: an untalented leap still shoves one cell. The `Int(4)`
			//vulnerable roll is likewise drawn unconditionally per neighbouring non-ally -
			//gating either on talent or survival skips draws Java burns, desyncing the stream
			//after a killing slam. A corpse itself stays put: Java's post-kill throwChar only
			//slides an already-removed actor whose loot already dropped, which nothing observes.
			const strength = impactWaveStrength(impactWave);
			if (neighbour.hp > 0) {
				for (let push = 0; push < strength; push++) {
					const next = { x: neighbour.x + dx, y: neighbour.y + dy };
					if (!this.level.passable(next.x, next.y) || this.creatureAt(next.x, next.y)) break;
					this.moveTo(neighbour, next);
				}
			}
			if (impactWaveVulnerable(impactWave, Random.int(0, 4)) && neighbour.hp > 0) addBuff(neighbour, 'vulnerable', 5);
		}
		this.shakeScreen(2, 0.5);
		//`Invisibility.dispel()` (HeroicLeap.java 121), inside the jump callback Java runs after the
		//landing effects.
		delete this.hero.buffs['invisibility'];
		//`DoubleJumpTracker`: Java spends the turn *before* the tracker block, so an armed tracker is
		//consumed by this leap and a fresh one - when the talent is ranked - starts its three turns
		//from here rather than being eaten by the cast's own tick.
		this.spendHeroAction(1);
		if (this.doubleJumpTurns > 0) this.doubleJumpTurns = 0;
		else if (this.talentRank('double_jump') > 0) this.doubleJumpTurns = 3;
		return true;
	},

	/**
	 * `Shockwave.activate()`: a `ConeAOE` from the aimed direction, `dist = min(aim.dist, 5 +
	 * EXPANDING_WAVE)` cells and `60 + 15*EXPANDING_WAVE` degrees wide, cast with
	 * `STOP_SOLID | STOP_TARGET`. Every non-ally caught in it takes `heroDamageIntRange(5+STR-10,
	 * 10+2*(STR-10))` scaled by `1 + 0.2*SHOCK_FORCE`; a `STRIKING_WAVE` roll promotes the hit into
	 * a real proc, and a survivor is paralysed or crippled by `SHOCK_FORCE`.
	 */
	activateShockwave(this: DungeonScene, def: ArmorAbilityDef, cost: number, cell: Step | null): boolean {
		if (!cell || (cell.x === this.hero.x && cell.y === this.hero.y)) return false;
		//`new Ballistica(hero.pos, target, WONT_STOP)`: a plain straight line, terrain ignored, so
		//the cone's own rays are what stop at walls.
		const aimPath = Roguelike.ballistica(this.level, { x: this.hero.x, y: this.hero.y }, cell, { stop: 'none' }).cells;
		const aim = aimPath[aimPath.length - 1] ?? cell;
		const expandingWave = this.talentRank('expanding_wave');
		const aimDistance = Roguelike.chebyshevDistance({ x: this.hero.x, y: this.hero.y }, aim);
		const { distance, degrees } = shockwaveCone(expandingWave, aimDistance);
		const cone = coneCells({
			source: { x: this.hero.x, y: this.hero.y },
			target: aim,
			degrees,
			//`ConeAOE(aim, dist, degrees, params)`'s own clamp: "clamp distance of cone to maxDist
			//(in true distance, not game distance)". `coneCells` reproduces that clamp, so the
			//clamped `distance` is what it is given - not the unbounded aim.
			maxDistance: distance,
			width: this.level.width,
			height: this.level.height,
			trace: (coneFrom, coneTo) => this.coneRay(coneFrom, coneTo, true),
		});
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		const strikingWave = this.talentRank('striking_wave');
		const shockForce = this.talentRank('shock_force');
		const roll: DamageRoll = {
			normalIntRange: (min, max) => Random.normalRange(min, max),
			int: (maxExclusive) => Random.int(0, maxExclusive),
		};
		//Java's cone is built from the aimed cell out to `dist` cells, so cells beyond the clamped
		//distance are already excluded by `coneCells`' own `maxDistance` clamp above.
		for (const coneCell of cone.cells) {
			const caught = this.creatureAt(coneCell.x, coneCell.y);
			if (!caught || caught === this.hero || caught.isAlly || caught.isNPC || caught.hp <= 0) continue;
			//`hero.STR()`, which is the *effective* strength: `this.hero.str` is where `syncHeroFromStats`
			//folds in the Ring of Might and the Strongman talent, so a +3 ring widens the roll exactly
			//as it does in Java. `this.heroStr` is only the base and would ignore both. (`Creature.str`
			//is optional because monsters have no strength; on the hero it is always set.)
			const effectiveStr = this.hero.str ?? this.heroStr;
			let damage = shockwaveDamage(effectiveStr, shockForce, Random.normalRange(caught.armor[0], caught.armor[1]), roll);
			const procs = strikingWaveProcs(strikingWave, Random.int(0, 10));
			if (procs) {
				//`damage = hero.attackProc(ch, damage)`: the real attack-proc chain, i.e. this port's
				//`heroOnHit`, and the Gladiator's combo counter (`Shockwave.java` 130-132).
				this.heroOnHit(this.hero, caught, damage);
				if (this.subclass() === 'gladiator') {
					this.hero.combo = (this.hero.combo ?? 0) + 1;
					if (this.hero.combo % 3 === 0) damage += 3 + this.talentRank('enhanced_combo');
				}
			}
			this.applyAbilityDamage(caught, damage);
			if (caught.hp > 0) {
				if (shockForceParalyses(shockForce, Random.int(0, 4))) addBuff(caught, 'paralysis', 5);
				else addBuff(caught, 'cripple', 5);
			}
		}
		this.shakeScreen(2, 0.5);
		//`Invisibility.dispel()` (Shockwave.java 147), in the cast callback after the cone resolves.
		delete this.hero.buffs['invisibility'];
		this.spendHeroAction(1);
		return true;
	},

	/**
	 * The hero's own `damageRoll()` for `ElementalStrike`'s Projecting splash and Unstable
	 * delegation (`Weapon.damageRoll`, tag `v3.3.8`): the equipped range plus the excess-STR
	 * bonus, exactly the computation `simulation/combat.ts`'s `rollDamage` opens with.
	 */
	heroWeaponRoll(this: DungeonScene): number {
		const [min, max] = liveStats(this.hero).damage;
		let roll = Random.normalRange(min, max);
		const str = this.hero.str ?? 0;
		const req = this.hero.strReq ?? 0;
		if (str > req) roll += Random.range(0, str - req);
		return roll;
	},

	/**
	 * `Bomb.ConjuredBomb().explode(cell)` for `ElementalStrike`'s Explosive curse (tag
	 * `v3.3.8`): the same distance-1 flood through passable-or-flammable cells and the same
	 * `NormalIntRange(4 + depth, 12 + 3*depth)`-minus-armor damage the Stone-of-Blast port
	 * already models (a conjured bomb and that stone share the `Bomb` base defaults), hero
	 * included - a bomb does not discriminate.
	 */
	detonateConjuredBlast(this: DungeonScene, x: number, y: number): void {
		const cells = [{ x, y }];
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const nx = x + dx, ny = y + dy;
			if (this.level.inside(nx, ny) && (this.level.passable(nx, ny) || this.isFireFlammableTerrain(nx, ny))) cells.push({ x: nx, y: ny });
		}
		for (const at of cells) {
			if (this.isFireFlammableTerrain(at.x, at.y)) this.destroyBombTerrain(at.x, at.y);
			//The stone-context `explodeGroundItem` closure, inlined: chained bombs go off,
			//anything less sturdy than armor/wands/rings burns.
			for (const entry of [...this.heapItemsAt(at.x, at.y)].reverse()) this.explodeHeapEntry(entry, new Set());
		}
		const blast = new Set(cells.map((at) => this.level.index(at.x, at.y)));
		for (const creature of [...this.creatures]) {
			if (creature.isNPC || creature.hp <= 0 || !blast.has(this.level.index(creature.x, creature.y))) continue;
			let damage = Math.max(0, Random.normalRange(4 + this.depth, 12 + 3 * this.depth)
				- Random.normalRange(creature.armor[0], creature.armor[1]));
			if (creature.isHero) {
				damage = this.absorbHeroDamage(damage);
				creature.hp -= damage;
				this.showDamage(creature, damage);
				if (creature.hp <= 0) this.kill(creature);
			} else {
				creature.hp -= damage;
				this.showDamage(creature, damage);
				creature.sleeping = false;
				if (creature.hp <= 0) this.kill(creature);
			}
		}
	},

	/**
	 * `ElementalStrike.activate()` (`actors/hero/abilities/duelist/ElementalStrike.java`, tag
	 * `v3.3.8`): a `WONT_STOP` aim clamped to `4 + ELEMENTAL_REACH` cells, a `65 + 10*reach`
	 * degree `STOP_SOLID | STOP_TARGET` cone over it, then the equipped weapon's imbuement -
	 * one of thirteen enchantments, eight curses, or the plain `6-12` strike - applied to the
	 * cone's cells, its occupants, and the aimed primary target (a real forced melee hit).
	 * Curses ride the same branch because in Java `Weapon.Curse extends Enchantment`: a
	 * curse IS the weapon's enchantment object, so `this.weaponAffix` (which holds either id)
	 * maps onto Java's `enchantment.getClass()` directly.
	 *
	 * Reductions, all stated: the cone visuals/sounds have no seam here (Shockwave's precedent);
	 * neutrals use this port's standing ability-damage filter (non-ally, non-NPC, living - so a
	 * neutral NPC the Java cone would catch is spared, as with every other ability); the
	 * `HUNTING -> WANDERING` calm on Displacing has no mob-state field to write to; the
	 * Elastic sort runs furthest-first as Java's own comment states (its comparator sorts
	 * closest-first instead - taken as the bug); colliding shove damage is absent (the
	 * established stepwise shove); `visibleEnemies()` is mobs with `seesHero`.
	 */
	/**
	 * `WildMagic.activate()` (`WildMagic.java`, tag `v3.3.8`): up to `4 + FIRE_EVERYTHING`
	 * shots from the carried spare wands - the staff is excluded in Java too - each through
	 * `fireWandShot` at the Wild-Power-boosted level with `chargesPerCast` forced to 1 (Java's
	 * tracker override), spending `0.5 * 0.67^CONSERVED_MAGIC` off its own partial charge.
	 * Cursed spares sit out: their `cursedZap` has no system here. An aim needs a live,
	 * visible creature like the normal zap does, so an empty/unseen/dead cell refuses with
	 * `no_target` (Java fires at bare cells, whose only observable is terrain FX this port's
	 * creature-bound shots cannot produce either way).
	 */
	/**
	 * `ElementalBlast.activate()` (`ElementalBlast.java`, tag `v3.3.8`): the staff's
	 * imbued class erupts in the roomiest cardinal direction (`elementalBlastAim`), a
	 * full 360-degree cone (`ConeAOE`, `4 + BLAST_RADIUS`), every number through the
	 * pinned `simulation/mageAbilities.ts` arithmetic. Damage subtracts armor like
	 * `Shockwave` does (Java's `Char.damage` applies DR; the zap seam's raw damage
	 * would over-hit here). Simplifications, all stated: the cone stops at walls for
	 * every class (Disintegration and Warding phase through them in Java, `STOP_TARGET`
	 * only); Fireblast's `IGNORE_SOFT_SOLID` has no soft-solid here; frozen cells are
	 * not cleared (no Freezing-blob system); corrosion lands as a gas seed at
	 * zap-equivalent strength rather than the buff (`round(60 * multi)` sits in the
	 * zap's `50 + 10 * level` band); ally overheal shields the hero only (no mob-barrier
	 * primitive); the old imbue is already gone by firing time (lost at imbue, stated
	 * on the coverage row). Cursed/unknown states cannot reach the blast: only a
	 * confirmed imbue sets the class, and the staff cannot be lost, so Java's
	 * `no_staff` line never fires.
	 */
	activateElementalBlast(this: DungeonScene, _def: ArmorAbilityDef, cost: number): boolean {
		const wandType = staffImbueFor(this);
		const multi = elementalBlastEffectMulti(this.talentRank('elemental_power'));
		const factor = ELEMENTAL_BLAST_DAMAGE_FACTORS[wandType] ?? 1;
		const aimName = elementalBlastAim(this.hero.x, this.hero.y, this.level.width, this.level.height);
		const aim = aimName === 'west' ? { x: -1, y: 0 } : aimName === 'east' ? { x: 1, y: 0 } : aimName === 'north' ? { x: 0, y: -1 } : { x: 0, y: 1 };
		const aoeSize = elementalBlastAoeSize(this.talentRank('blast_radius'));
		const phasing = wandType === 'disintegration' || wandType === 'warding';
		const cone = coneCells({
			source: { x: this.hero.x, y: this.hero.y },
			target: { x: this.hero.x + aim.x * aoeSize, y: this.hero.y + aim.y * aoeSize },
			degrees: 360,
			maxDistance: aoeSize,
			width: this.level.width,
			height: this.level.height,
			trace: phasing
				? (coneFrom, coneTo) => {
						//`STOP_TARGET` without `STOP_SOLID`: past walls, stopping at the
						//first creature (or the rim). `traceRayToTarget` always stops at
						//walls, so this is its wall-ignoring twin.
						const cells = Roguelike.ballistica(this.level, coneFrom, coneTo, { stop: 'none' }).cells.slice(1);
						const blocker = cells.findIndex((at) => this.creatureAt(at.x, at.y) !== null);
						return blocker === -1 ? cells : cells.slice(0, blocker + 1);
					}
				: (coneFrom, coneTo) => this.coneRay(coneFrom, coneTo, true),
		});
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		let terrainTouched = false;
		for (const at of cone.cells) {
			const raw = this.level.get(at.x, at.y);
			if (wandType === 'lightning' && raw === WATER) this.electricity.seed(at.x, at.y, 2);
			else if (wandType === 'fireblast') {
				if (this.doors.isDoor(at.x, at.y) && !this.doors.isOpen(at.x, at.y)) this.bumpDoor(at.x, at.y);
				if (raw === GRASS || raw === HIGH_GRASS) this.fire.seed(at.x, at.y, 2);
			}
			else if (wandType === 'prismaticLight') {
				this.fov.explored.add(this.level.index(at.x, at.y));
				if (this.secrets.isSecret(at.x, at.y)) this.secrets.discover(at.x, at.y);
			}
			else if (wandType === 'regrowth' && raw === FLOOR && Random.chance(elementalBlastRegrowthChance(multi))) {
				this.level.set(at.x, at.y, HIGH_GRASS);
				terrainTouched = true;
			}
		}
		if (terrainTouched) {
			for (const at of cone.cells) this.restitchTilesAround(at.x, at.y);
			this.featuresMap?.setLayerData('features', this.featureFrames());
		}
		let charsHit = 0;
		for (const at of [...cone.cells]) {
			const mob = this.creatureAt(at.x, at.y);
			if (!mob || mob.hp <= 0) continue;
			const isFoe = !mob.isHero && !mob.isAlly;
			//Warding feeds its own wards; Transfusion heals allies and the charmed.
			if (wandType === 'warding' && mob.allyKind === 'ward') {
				const healed = Math.min(mob.maxHp - mob.hp, Math.round(10 * multi));
				if (healed > 0) { mob.hp += healed; this.showHeal(mob, healed); }
				continue;
			}
			if (wandType === 'transfusion' && !isFoe) {
				if (mob === this.hero) continue;
				const split = elementalBlastTransfusionSplit(mob.hp, mob.maxHp, multi);
				if (split.heal > 0) { mob.hp = Math.min(mob.maxHp, mob.hp + split.heal); this.showHeal(mob, split.heal); }
				continue;
			}
			if (!isFoe) continue;
			if (wandType === 'transfusion') {
				if (mob.kind !== undefined && UNDEAD_KINDS.has(mob.kind)) {
					let dmg = Math.max(0, elementalBlastUndeadDamage(Random.normalRange(15, 25), multi)
						- Random.normalRange(mob.armor[0], mob.armor[1]));
					mob.hp -= dmg;
					this.showDamage(mob, dmg);
					mob.sleeping = false;
					if (dmg > 0) charsHit += 1;
					if (mob.hp <= 0) this.kill(mob);
				} else {
					addBuff(mob, 'charm', elementalBlastCharmDuration(multi));
					this.charmTargets.set(mob.id, this.hero.id);
				}
				continue;
			}
			if (wandType === 'corrosion') {
				this.corrosiveGas.seed(mob.x, mob.y, Math.round(60 * multi));
				continue;
			}
			if (wandType === 'livingEarth') continue;
			//The hero and allies never reach this branch (skipped above), so no
			//`absorbHeroDamage` split is needed - every victim here is a foe.
			let dmg = Math.max(0, elementalBlastDamage(Random.normalRange(15, 25), multi, factor)
				- Random.normalRange(mob.armor[0], mob.armor[1]));
			mob.hp -= dmg;
			this.showDamage(mob, dmg);
			mob.sleeping = false;
			if (dmg > 0) charsHit += 1;
			if (mob.hp <= 0) { this.kill(mob); continue; }
			if (wandType === 'blastWave') {
				//`throwChar`'s straight path, away from the hero: the port's forced-movement
				//seam (collision damage stays simplified, like the wand's own push).
				const steps = elementalBlastKnockback(aoeSize, Roguelike.chebyshevDistance({ x: this.hero.x, y: this.hero.y }, { x: mob.x, y: mob.y }), multi);
				const dx = Math.sign(mob.x - this.hero.x), dy = Math.sign(mob.y - this.hero.y);
				for (let push = 0; push < steps; push++) {
					const next = { x: mob.x + dx, y: mob.y + dy };
					if (!this.level.passable(next.x, next.y) || this.creatureAt(next.x, next.y)) break;
					this.moveTo(mob, next);
					mob.sleeping = false;
				}
			}
			else if (wandType === 'lightning') addBuff(mob, 'paralysis', elementalBlastParalysisDuration(multi));
			else if (wandType === 'fireblast') addBuff(mob, 'burning');
			else if (wandType === 'frost') {
				//`Buff.affect(mob, Frost.class, effectMulti*Frost.DURATION)`
				//(`ElementalBlast.java`, tag `v3.3.8`): a direct Frost, not Chill.
				//`Frost.attachTo` detaches Burning up front, then on a successful
				//attach detaches Chill and counts as paralysis (`Frost extends
				//Paralysis`), so the chill-then-freeze escalation never runs here -
				//a single blast freezes outright. The Thief-stolen-potion/carried-
				//meat freeze inside `attachTo` has no model (no per-item freeze
				//primitive on this seam), stated not silent. (The `chilling`
				//enchant leg below stays on `applyChillFreeze`: Java seeds a real
				//`Freezing` blob there, which this port lacks - that one is the
				//documented blob simplification, not this bug.)
				delete mob.buffs['burning'];
				addBuff(mob, 'frost', elementalBlastFrostDuration(multi));
				if (mob.buffs['frost'] !== undefined) {
					delete mob.buffs['chill'];
					mob.buffs['paralysis'] = Math.max(mob.buffs['paralysis'] ?? 0, elementalBlastFrostDuration(multi));
				}
			}
			else if (wandType === 'prismaticLight') addBuff(mob, 'blindness', elementalBlastBlindnessDuration(multi));
			else if (wandType === 'corruption') addBuff(mob, 'amok', elementalBlastAmokDuration(multi));
			else if (wandType === 'regrowth') addBuff(mob, 'roots', elementalBlastRootsDuration(multi));
		}
		if (wandType === 'livingEarth') {
			//`setInfo(hero, 0, round(multi*charsHit*5))`: the Java actor banks that armor.
			//The port has no pending-armor state, so a live guardian takes it as healing
			//(its own zap feeds the same way) and a missing one banks nothing.
			const guardian = this.creatures.find((c) => c.allyKind === 'earthGuardian' && c.hp > 0);
			if (guardian && charsHit > 0) {
				const fed = Math.round(multi * charsHit * 5);
				guardian.hp = Math.min(guardian.maxHp, guardian.hp + fed);
				this.showHeal(guardian, fed);
			}
		}
		if (wandType === 'magicMissile') this.hero.buffs['recharging'] = Math.max(this.hero.buffs['recharging'] ?? 0, elementalBlastRechargingDuration(multi));
		if (wandType === 'frost') delete this.hero.buffs['burning'];
		if (wandType === 'prismaticLight') this.hero.buffs['light'] = Math.max(this.hero.buffs['light'] ?? 0, elementalBlastLightDuration(multi, isChallengeEnabled('darkness')));
		const reactive = elementalBlastReactiveShield(charsHit, this.talentRank('reactive_barrier'), this.talentRank('reactive_barrier') > 0);
		if (reactive > 0) this.grantHeroShield(reactive, this.hero.maxHp);
		delete this.hero.buffs['invisibility'];
		this.spendHeroAction(1);
		return true;
	},

	activateWildMagic(this: DungeonScene, _def: ArmorAbilityDef, cost: number, cell: Step | null): boolean {
		if (!cell) return false;
		const target = this.creatureAt(cell.x, cell.y);
		if (!target || target.hp <= 0 || !this.fov.isVisible(cell.x, cell.y)) {
			this.say(t('actors.hero.abilities.armorability.no_target'), 'negative');
			return false;
		}
		const spares: { entry: { wandCur?: number; wandPartial?: number; wandMax?: number; level?: number; cursed?: boolean }; type: WandType }[] = [];
		for (const entry of this.bag.items) {
			if (entry.id !== 'wand' || entry.instanceId === undefined) continue;
			const spare = entry as typeof entry & { wandCur?: number; wandPartial?: number; wandMax?: number; sourceClass?: string; level?: number };
			if (spare.wandCur === undefined || spare.wandMax === undefined) continue;
			const type = wandTypeFromSource(spare.sourceClass);
			if (!type) continue;
			spares.push({ entry: spare, type });
		}
		const conserved = this.talentRank('conserved_magic');
		const shots = wildMagicShots(
			spares.map((s) => ({ cur: s.entry.wandCur ?? 0, partial: s.entry.wandPartial ?? 0 })),
			conserved, this.talentRank('fire_everything'), Random.shuffle, (bound) => Random.int(bound));
		if (shots.length === 0) {
			this.say(t('actors.hero.abilities.mage.wildmagic.no_wands'), 'warning');
			return false;
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		const wildPower = this.talentRank('wild_power');
		const shotCost = wildMagicShotCost(conserved);
		for (const index of shots) {
			if (this.hero.hp <= 0) break;
			const spare = spares[index]!;
			const state = { cur: spare.entry.wandCur ?? 0, partial: spare.entry.wandPartial ?? 0, max: spare.entry.wandMax ?? 0 };
			//`afterZap` spends even when the bolt has nothing left to hit: re-aim at
			//whoever stands on the cell now, else the original target while it lives.
			const occupant = this.creatureAt(cell.x, cell.y);
			const aim = occupant && occupant.hp > 0 ? occupant : target.hp > 0 ? target : undefined;
			//`CursedWand.cursedZap()` runs regardless of whether anything stands at the
			//collision cell (several Common effects, e.g. RandomGas/SelfOoze, don't need a
			//target at all) - only the ordinary zap branch requires a live `aim`.
			if (spare.entry.cursed) this.castCursedWandEffect(aim, cell);
			else if (aim) this.fireWandShot(spare.type, wildMagicBoostedLevel(spare.entry.level ?? 0, wildPower, Random.int(2) === 0), aim, 1);
			spendWildMagicShot(state, shotCost);
			spare.entry.wandCur = state.cur;
			spare.entry.wandPartial = state.partial;
		}
		delete this.hero.buffs['invisibility'];
		//`afterZap`: a full turn unless `Random.Int(4)` rolls under CONSERVED_MAGIC.
		if (Random.int(4) >= conserved) this.spendHeroAction(1);
		return true;
	},



	/**
	 * `Endure.activate()`: twelve turns of `EndureTracker`, three turns of Gladiator combo time,
	 * and `hero.spendAndNext(3f)` - the only armor ability that costs more than one turn.
	 */
	activateEndure(this: DungeonScene, def: ArmorAbilityDef, cost: number): boolean {
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		this.endureTurns = 12;
		this.endureEnduring = true;
		this.endureBanked = 0;
		this.endureHits = 0;
		//`Combo.addTime(3f)` (Endure.java 59-62) extends a live Gladiator combo by three turns.
		//This port's Gladiator combo is a bare landed-hit counter with no duration to extend
		//(`Combo.java`'s own `timeLeft` is not modelled anywhere), so there is nothing to add to -
		//stated as a simplification rather than faked with a counter bump Java does not have.
		delete this.hero.buffs['invisibility'];
		this.spendHeroAction(3);
		this.say(t('actors.hero.abilities.warrior.endure.name'), 'positive');
		return true;
	},

	/**
	 * `DeathMark.activate()` (tag `v3.3.8`): mark a visible hostile for five turns. Java spends
	 * **no turn** here (`hero.next()` - the hero acts again immediately), which is the ability's
	 * whole point: it is a free setup for the kill that follows.
	 *
	 * `DOUBLE_MARK` is a two-sided latch, exactly as Java writes it: while its tracker is armed the
	 * ability costs `0.707^points` charge, and using it consumes the arm; with the talent ranked and
	 * no arm, the cast re-arms it for the next one.
	 */
	activateDeathMark(this: DungeonScene, def: ArmorAbilityDef, cost: number, cell: Step | null): boolean {
		if (!cell) return false;
		const target = this.creatureAt(cell.x, cell.y);
		// Divergence (deliberate): Java calls Messages.get(this, no_target) here, but no
		// deathmark.no_target key exists in any properties file (checked v2.1.4 and
		// v3.3.8), so Java renders its missing-key text. This port uses SPD's own
		// generic armorability.no_target instead of reproducing that.
		if (!target || !this.fov.isVisible(target.x, target.y)) {
			this.say(t('actors.hero.abilities.armorability.no_target'), 'negative');
			return false;
		}
		if (target.isAlly || target.isNPC) {
			this.say(t('actors.hero.abilities.rogue.deathmark.ally_target'), 'negative');
			return false;
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		//`DeathMarkTracker.DURATION` is 5, and `Buff.affect(ch, DeathMarkTracker.class,
		//DURATION)` *spends* (additive) on an existing tracker rather than postponing it - so
		//re-marking extends the window instead of refreshing it. `setInitialHP` keeps the
		//*highest* HP the target has been marked at (so re-marking a wounded target does not
		//shrink the Deathly Durability barrier it would pay out).
		target.deathMarkTurns = (target.deathMarkTurns ?? 0) + 5;
		target.deathMarkInitialHp = Math.max(target.deathMarkInitialHp ?? 0, target.hp);
		this.say(t('actors.hero.abilities.rogue.deathmark.name'), 'positive');
		//Java spends no time at all here (`hero.next()`), so the clock does not advance, the monsters
		//do not act, and the hero simply acts again - `awaitingInput` is left alone rather than
		//cleared, which is what keeps the game responsive after a zero-time ability.
		if (this.doubleMarkArmed) this.doubleMarkArmed = false;
		else if (this.talentRank('double_mark') > 0) this.doubleMarkArmed = true;
		return true;
	},

	/**
	 * `DeathMark.processFearTheReaper()`, called at the moment a marked creature's HP reaches zero
	 * (Java runs it from `Char.damage()`'s `HP == 0 && deathMarked` branch, and from the two execute
	 * paths). The target itself is terrified and crippled; `EVEN_THE_ODDS`-style neighbours are not
	 * part of this talent, so only `FEAR_THE_REAPER`'s own rank ladder applies: rank 2+ terrifies the
	 * target too, rank 3+ reaches every hostile within path distance 3, and rank 4 terrifies those
	 * as well. `Buff.prolong(...).object = hero.id()`'s source id has no field on this port's terror
	 * buff (it stores a duration only), so the source is not recorded.
	 */
	processFearTheReaper(this: DungeonScene, target: Creature): void {
		const rank = this.talentRank('fear_the_reaper');
		if (rank <= 0) return;
		if (rank >= 2) addBuff(target, 'terror', 5);
		addBuff(target, 'cripple', 5);
		if (rank < 3) return;
		const distances = this.pathfinder.distanceMap({ x: target.x, y: target.y });
		for (const other of this.creatures) {
			if (other === target || other.isHero || other.isAlly || other.isNPC || other.hp <= 0) continue;
			const distance = distances[this.level.index(other.x, other.y)] ?? Number.MAX_SAFE_INTEGER;
			if (distance > 3) continue;
			if (rank >= 4) addBuff(other, 'terror', 5);
			addBuff(other, 'cripple', 5);
		}
	},

	/**
	 * `DeathMarkTracker`'s five-turn countdown and its two exits. Java's tracker is a real buff, so
	 * its expiry is its `detach()`: a target that is already at zero HP dies there (with
	 * `DEATHLY_DURABILITY` paying the hero `round(initialHP * 0.125 * points)` as a barrier), and
	 * one that survived keeps its HP - the mark is not a damage source.
	 */
	tickDeathMark(this: DungeonScene, monster: Creature): void {
		if ((monster.deathMarkTurns ?? 0) <= 0) return;
		monster.deathMarkTurns = (monster.deathMarkTurns ?? 0) - 1;
		if (monster.deathMarkTurns > 0) return;
		delete monster.deathMarkTurns;
		const initialHp = monster.deathMarkInitialHp ?? 0;
		delete monster.deathMarkInitialHp;
		if (monster.hp > 0) return;
		const shield = Math.round(initialHp * (0.125 * this.talentRank('deathly_durability')));
		if (shield > 0) this.grantHeroShield(shield, this.hero.maxHp);
		this.kill(monster);
	},

	/**
	 * `SpectralBlades.activate()` (tag `v3.3.8`): throw spirit blades down the aimed line. The
	 * primary target is the first hostile the ray meets, and `PROJECTING_BLADES` lets that ray pass
	 * through up to `2 * points` solid cells before giving up. `FAN_OF_BLADES` widens the throw into
	 * a `30 * points`-degree cone whose extra targets are capped at `points` and pruned to the ones
	 * nearest the primary - Java's own `while (targets.size() > 1 + points)` loop, which repeatedly
	 * drops whichever is furthest from the primary target.
	 *
	 * Each target is attacked for real (`hero.attack(ch, dmgMulti, 0, accMulti)`), at half damage
	 * for everything but the primary and at `1 + 0.25*PROJECTING_BLADES` accuracy for all of them,
	 * so a blade can miss and procs/enchant effects apply as they do in melee. `SPIRIT_BLADES` arms
	 * a tracker that the hero's next attack consumes.
	 */
	activateSpectralBlades(this: DungeonScene, def: ArmorAbilityDef, cost: number, cell: Step | null): boolean {
		if (!cell) return false;
		const hero = this.hero;
		if (cell.x === hero.x && cell.y === hero.y) {
			this.say(t('actors.hero.abilities.huntress.spectralblades.name'), 'negative');
			return false;
		}
		const projecting = this.talentRank('projecting_blades');
		//`new Ballistica(hero.pos, target, WONT_STOP)`: a plain straight line, so wall penetration is
		//counted by this port's own ray walk rather than by the tracer.
		const ray = Roguelike.ballistica(this.level, { x: hero.x, y: hero.y }, cell, { stop: 'none' }).cells;
		const alongRay = (path: Step[], wallPenetration: number): Creature | null => {
			let remaining = wallPenetration;
			for (const step of path) {
				const found = this.creatureAt(step.x, step.y);
				if (found) {
					if (found === hero || found.isAlly || found.isNPC) continue;
					return found;
				}
				if (!this.level.passable(step.x, step.y)) {
					remaining--;
					if (remaining < 0) return null;
				}
			}
			return null;
		};
		const primary = alongRay(ray, 2 * projecting);
		// Divergence (deliberate): Java calls Messages.get(this, no_target) here, but no
		// spectralblades.no_target key exists in any properties file (checked v2.1.4 and
		// v3.3.8), so Java renders its missing-key text. This port uses SPD's own
		// generic armorability.no_target instead of reproducing that.
		if (!primary || !this.fov.isVisible(primary.x, primary.y)) {
			this.say(t('actors.hero.abilities.armorability.no_target'), 'negative');
			return false;
		}
		const targets = new Set<Creature>([primary]);
		const fanOfBlades = this.talentRank('fan_of_blades');
		if (fanOfBlades > 0) {
			const cone = coneCells({
				source: { x: hero.x, y: hero.y },
				target: { x: cell.x, y: cell.y },
				degrees: 30 * fanOfBlades,
				maxDistance: Infinity,
				width: this.level.width,
				height: this.level.height,
				trace: (from, to) => Roguelike.ballistica(this.level, from, to, { stop: 'none' }).cells.slice(1),
			});
			for (const coneCell of cone.cells) {
				const caught = alongRay(Roguelike.ballistica(this.level, { x: hero.x, y: hero.y }, coneCell, { stop: 'none' }).cells, 2 * projecting);
				if (caught && this.fov.isVisible(caught.x, caught.y)) targets.add(caught);
			}
			//Java keeps the primary plus the `points` extras nearest it, measured in true distance.
			while (targets.size > 1 + fanOfBlades) {
				let furthest: Creature | null = null;
				let furthestDistance = -1;
				for (const candidate of targets) {
					if (candidate === primary) continue;
					const distance = Math.hypot(candidate.x - primary.x, candidate.y - primary.y);
					if (distance > furthestDistance) {
						furthestDistance = distance;
						furthest = candidate;
					}
				}
				if (!furthest) break;
				targets.delete(furthest);
			}
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		for (const target of targets) {
			//`SpectralBlades` arms `Talent.SpiritBladesTracker` before *each* throw (Java affects it
			//inside the per-target callback, right before `hero.attack`), and a successful roll
			//consumes it - so every blade of a fan gets its own chance, failed rolls leave it
			//armed for the remaining blades, and the turn-end clear matches Java's buff-act expiry.
			if (this.talentRank('spirit_blades') > 0) this.spiritBladesArmed = true;
			this.attack(hero, target, 1 + 0.25 * projecting, target === primary ? 1 : 0.5);
		}
		this.spiritBladesArmed = false;
		//`Invisibility.dispel()` (SpectralBlades.java 120): Java runs it once every blade callback
		//has resolved, which is this point.
		delete this.hero.buffs['invisibility'];
		this.spendHeroAction(1);
		return true;
	},

	/**
	 * `WarpBeacon` (`WarpBeacon.java`, tag `v3.3.8`), the Mage's second ability. Its two halves have
	 * deliberately different costs: **placing** the beacon spends a turn and no charge, **recalling**
	 * to it spends charge and no time. Java's `ClassArmor.execute()` still requires the ability's base
	 * charge to be available before either, which is why `useArmorAbility` keeps its up-front check.
	 */
	activateWarpBeacon(this: DungeonScene, def: ArmorAbilityDef, cost: number, cell: Step | null): boolean {
		if (!this.warpBeacon) return this.placeWarpBeacon(cell);
		return this.openWarpBeaconWindow(def);
	},

	/**
	 * The placement half. Java's gates, in its own order: the cell must be mapped or visited (an
	 * unmapped cell refuses **silently** - Java just `return`s), it must be within
	 * `4 * REMOTE_BEACON` cells of the hero (so without the talent the only legal spot is the hero's
	 * own cell), and it must not be a pit, must be passable, and must be reachable from where the
	 * hero stands.
	 */
	placeWarpBeacon(this: DungeonScene, cell: Step | null): boolean {
		const target = cell ?? { x: this.hero.x, y: this.hero.y };
		if (!this.fov.isExplored(target.x, target.y) && !this.fov.isVisible(target.x, target.y)) return false;
		if (Roguelike.chebyshevDistance(this.hero, target) > 4 * this.talentRank('remote_beacon')) {
			this.say(t('actors.hero.abilities.mage.warpbeacon.too_far'), 'negative');
			return false;
		}
		const reachable = this.pathfinder.find({ x: this.hero.x, y: this.hero.y }, target).length > 0
			|| (target.x === this.hero.x && target.y === this.hero.y);
		if (this.isChasmCell(target.x, target.y) || !this.level.passable(target.x, target.y) || !reachable) {
			this.say(t('actors.hero.abilities.mage.warpbeacon.invalid_beacon'), 'negative');
			return false;
		}
		this.warpBeacon = { x: target.x, y: target.y, depth: this.depth, branch: this.miningBranchActive ? 1 : 0 };
		this.say(t('actors.hero.abilities.mage.warpbeacon.name'), 'positive');
		//Java dispels on placement too (`WarpBeacon.java`'s own `Invisibility.dispel()` - this
		//is not one of the two abilities that skip it), which the recall halves already did.
		delete this.hero.buffs['invisibility'];
		this.spendHeroAction(1);
		return true;
	},

	/** Java's three-row window (`window_tele`/`window_clear`/`window_cancel`), on this port's shared
	 *  choice window. Opening it is free, and the charge is only spent if the jump is taken. */
	openWarpBeaconWindow(this: DungeonScene, def: ArmorAbilityDef): boolean {
		const beacon = this.warpBeacon;
		if (!beacon) return false;
		showChoiceWindow(this.gameWindows, capitalize(t('actors.hero.abilities.mage.warpbeacon.name')),
			t('actors.hero.abilities.mage.warpbeacon.window_desc', { 0: beacon.depth }), [
				{ label: t('actors.hero.abilities.mage.warpbeacon.window_tele'), onPick: () => this.warpToBeacon(def, beacon) },
				{ label: t('actors.hero.abilities.mage.warpbeacon.window_clear'), onPick: () => { this.warpBeacon = null; } },
				{ label: t('actors.hero.abilities.mage.warpbeacon.window_cancel'), onPick: () => { /* Java's cancel row does nothing */ } },
			]);
		return true;
	},

	/**
	 * The recall. `LONGRANGE_WARP` is what allows a warp to another depth, and it also discounts
	 * that warp's charge (`1.833 - 0.333 * points` times the base - Java's own multiplier). Within
	 * the same depth the hero appears on the beacon cell; if something is standing there,
	 * `TELEFRAG` lets the hero trade a self-inflicted `min(5 * points, HP + shielding - 1)` (so it
	 * can never kill) for `heroDamageIntRange(10 * points, 15 * points)` on the occupant, and the
	 * occupant is then shoved to a random free neighbour by `ScrollOfTeleportation.appear`'s own
	 * push rule (the *hero* is the one pushed if the occupant is immovable, and with nowhere to go
	 * the warp refuses with `no_tele`).
	 */
	warpToBeacon(this: DungeonScene, def: ArmorAbilityDef, beacon: { x: number; y: number; depth: number; branch: number }): void {
		const branch = this.miningBranchActive ? 1 : 0;
		const crossDepth = beacon.depth !== this.depth || beacon.branch !== branch;
		const longrange = this.talentRank('longrange_warp');
		if (crossDepth && longrange === 0) {
			this.say(t('actors.hero.abilities.mage.warpbeacon.depths'), 'negative');
			return;
		}
		//`Dungeon.interfloorTeleportAllowed()` - Java's `LockedFloor` buff, which bars any inter-floor
		//teleport while it is up (a boss fight, the ascent). This port does not model that buff, and
		//its own equivalent of "this floor is locked" is the boss floor itself: descent here is only
		//ever the boss's death, so a warp out of a live boss fight would be a way to skip it that Java
		//does not have. Refusing on `BOSSES` is the port's stand-in, stated in `PORT_COVERAGE.md`.
		if (crossDepth && this.depth in BOSSES) {
			this.say(t('items.scrolls.scrollofteleportation.no_tele'), 'negative');
			return;
		}
		let cost = this.armorAbilityCost(def);
		if (crossDepth) cost *= 1.833 - 0.333 * longrange;
		if (this.armorCharge < cost) {
			this.say(t('items.armor.classarmor.low_charge'), 'negative');
			return;
		}
		if (!crossDepth) {
			const occupant = this.creatureAt(beacon.x, beacon.y);
			if (occupant && occupant !== this.hero) {
				const telefrag = this.talentRank('telefrag');
				if (telefrag > 0) {
					//`Math.min(heroDmg, heroHP-1)`: the self-inflicted half can never kill the hero, and
					//it is a real hit (armor, shields, Tenacity and the rest apply through the usual
					//hero-damage boundary).
					const selfDamage = Math.min(5 * telefrag, this.hero.hp + this.heroBarrier.total - 1);
					if (selfDamage > 0) {
						const dealt = this.absorbHeroDamage(selfDamage);
						this.hero.hp -= dealt;
						this.showDamage(this.hero, dealt);
					}
					this.applyAbilityDamage(occupant, Random.normalRange(10 * telefrag, 15 * telefrag));
				}
				//Java pushes the occupant to a random free neighbour from a shuffled candidate list.
				//An IMMOVABLE occupant (a pylon, say) pushes the *hero* instead, which lands him where
				//he already stands and refuses the warp when nothing is free - the same outcome this
				//port's empty-candidate check reaches.
				if (occupant.hp > 0) {
					const candidates: Step[] = [];
					if (!IMMOVABLE_KINDS.has(occupant.kind as MonsterId)) {
						for (const [dx, dy] of Roguelike.neighbourOffsets(8) as ReadonlyArray<readonly [number, number]>) {
							const next = { x: beacon.x + dx, y: beacon.y + dy };
							if (this.level.passable(next.x, next.y) && !this.creatureAt(next.x, next.y)) candidates.push(next);
						}
					}
					if (candidates.length === 0) {
						this.say(t('items.scrolls.scrollofteleportation.no_tele'), 'negative');
						return;
					}
					this.armorCharge = Math.max(0, this.armorCharge - cost);
					this.moveTo(occupant, Random.element(candidates) ?? candidates[0]!);
				} else {
					this.armorCharge = Math.max(0, this.armorCharge - cost);
				}
			} else {
				this.armorCharge = Math.max(0, this.armorCharge - cost);
			}
			delete this.hero.buffs['invisibility'];
			this.teleportHeroTo(beacon.x, beacon.y);
		} else {
			this.armorCharge = Math.max(0, this.armorCharge - cost);
			delete this.hero.buffs['invisibility'];
			this.beaconArrival = { x: beacon.x, y: beacon.y };
			this.miningBranchActive = beacon.branch === 1;
			this.depth = beacon.depth;
			this.enterLevel();
		}
	},

	/** `ScrollOfTeleportation.appear()`: place the hero on a cell without walking there, then bring
	 *  the field of view and the fog with him. */
	teleportHeroTo(this: DungeonScene, x: number, y: number): void {
		this.hero.x = x;
		this.hero.y = y;
		this.sprite(this.hero).x = x * TILE;
		this.sprite(this.hero).y = y * TILE;
		this.fov.update(x, y, this.viewRadius());
		this.refresh();
	},

	/**
	 * `Talent.ALLY_WARP` (Battlemage/Warlock T3; desc `actors.hero.talent.ally_warp.desc`):
	 * the Mage bumps an ally to swap places with it instantly, at 2/4/6 tiles range by rank,
	 * never with an immovable ally. The bump is always adjacent so the range check below is
	 * belt-and-braces, kept because Java states it. Costs no turn - like every other ally
	 * order here (`directAlly`'s defend/follow/attack all resolve without spending one) -
	 * and plays the shared teleport presentation on both parties with no log line. Returns
	 * true when the swap happened, false to fall through to the ordinary NPC interact.
	 * Stated simplification: Java's tap targets the ally at range through the cell selector;
	 * this port has no tap-creature seam, so the bump (adjacent by construction) is the tap.
	 */
	tryAllyWarp(this: DungeonScene, ally: Creature): boolean {
		if (this.heroClass !== 'mage') return false;
		const range = allyWarpRange(this.talentRank('ally_warp'));
		if (range <= 0) return false;
		if (ally.kind !== undefined && IMMOVABLE_KINDS.has(ally.kind as MonsterId)) return false;
		if (Roguelike.chebyshevDistance(this.hero, ally) > range) return false;
		const from = { x: this.hero.x, y: this.hero.y };
		const to = { x: ally.x, y: ally.y };
		this.hero.x = to.x; this.hero.y = to.y;
		ally.x = from.x; ally.y = from.y;
		this.sprite(this.hero).x = to.x * TILE;
		this.sprite(this.hero).y = to.y * TILE;
		this.sprite(ally).x = from.x * TILE;
		this.sprite(ally).y = from.y * TILE;
		this.playTeleportAppear(from, to, this.hero);
		this.playTeleportAppear(to, from, ally);
		this.fov.update(this.hero.x, this.hero.y, this.viewRadius());
		this.refresh();
		return true;
	},

	/**
	 * `Talent.SEER_SHOT` (Sniper/Warden T3; desc `actors.hero.talent.seer_shot.desc`): a
	 * thrown attack lands its arrow at the target's cell and grants vision in the 3x3 around
	 * it for 5/10/15 turns, on a flat 20-turn cooldown (`SEER_SHOT_COOLDOWN`). Cross-hero it
	 * triggers from any thrown weapon (`meta_desc`), so there is no class gate - the scene
	 * calls this from both the missile-throw and the bow branches. The landing cell's
	 * neighbourhood is marked explored (Java's visited behavior: seen-while-lit stays mapped
	 * afterwards) and stays creature-visible while its own timer runs (consulted next to
	 * `mindvision` in the visibility pass); unlike Clairvoyance this is *vision*, not a
	 * search, so hidden doors are not discovered. Stated simplification: Java fires at an
	 * aimed ground cell, but this port's targeting is creature-based, so the arrow always
	 * lands at its victim's cell rather than at a free choice of ground.
	 */
	procSeerShot(this: DungeonScene, x: number, y: number): void {
		const rank = this.talentRank('seer_shot');
		if (rank <= 0 || this.seerShotCooldown > 0) return;
		const duration = seerShotDuration(rank);
		for (let cy = y - 1; cy <= y + 1; cy++) {
			for (let cx = x - 1; cx <= x + 1; cx++) {
				if (!this.level.inside(cx, cy)) continue;
				const index = this.level.index(cx, cy);
				this.fov.explored.add(index);
				this.seerCells.set(index, duration);
			}
		}
		this.seerShotCooldown = SEER_SHOT_COOLDOWN;
		this.restitchAllTiles();
		this.say(t('port.log.stoneclairvoyance'), 'positive');
	},

	/**
	 * `DirectableAlly.directTocell()` (tag `v3.3.8`), the one order both directable allies in this
	 * port accept: a cell outside the hero's own field of view, an empty cell, or one held by
	 * anything that is neither the hero nor an enemy all become a *defend* order - "go and stand
	 * there". The hero's own cell means "follow me again", and an enemy cell means "attack that".
	 * Each order announces itself through its own messages, which differ per ally: `DriedRose`'s
	 * ghost yells one of five random lines per order, the spirit hawk a single fixed one.
	 */
	directAlly(this: DungeonScene, ally: Creature, cell: Step, lines: { defend: string; follow: string; attack: string }): void {
		const occupied = this.creatureAt(cell.x, cell.y);
		if (!this.fov.isVisible(cell.x, cell.y) || !occupied
			|| (occupied !== this.hero && !this.isHostileToAlly(occupied))) {
			ally.allyDefendCell = { x: cell.x, y: cell.y };
			ally.allyTargetChar = undefined;
			this.say(t(lines.defend), 'positive');
			return;
		}
		if (occupied === this.hero) {
			ally.allyDefendCell = undefined;
			ally.allyTargetChar = undefined;
			this.say(t(lines.follow), 'positive');
			return;
		}
		ally.allyDefendCell = undefined;
		ally.allyTargetChar = occupied;
		this.say(t(lines.attack), 'positive');
	},

	/**
	 * `SpiritHawk.activate()` (tag `v3.3.8`). Without a hawk, the Huntress summons one onto a
	 * random free neighbour (a cell with no character that is passable *or* avoidable - the hawk
	 * flies, so a chasm is a legal perch) for its 35 charge, and the summon costs a turn. With a
	 * hawk already in the world the ability becomes an order instead: **no charge at all**
	 * (`chargeUse()` returns 0 while `getHawk() != null`) and no turn, just the standing order.
	 *
	 * `EAGLE_EYE`, `SWIFT_SPIRIT` and the initial `SWIFT_SPIRIT` dodge pool are read at spawn and
	 * re-read on every one of the hawk's own turns, so a talent taken mid-summon still applies.
	 */
	activateSpiritHawk(this: DungeonScene, def: ArmorAbilityDef, cost: number, cell: Step | null): boolean {
		const hawk = this.spiritHawk();
		if (hawk) {
			//Java's `activate()` returns silently when a hawk exists and no target was chosen; the
			//port's aim is only ever opened for the direct case, so this is the cancelled one.
			if (cell) {
				this.directAlly(hawk, cell, {
					defend: 'actors.hero.abilities.huntress.spirithawk$hawkally.direct_defend',
					follow: 'actors.hero.abilities.huntress.spirithawk$hawkally.direct_follow',
					attack: 'actors.hero.abilities.huntress.spirithawk$hawkally.direct_attack',
				});
				this.refresh();
			}
			return false;
		}
		const spawnPoints: Step[] = [];
		for (const [dx, dy] of Roguelike.neighbourOffsets(8) as ReadonlyArray<readonly [number, number]>) {
			const at = { x: this.hero.x + dx, y: this.hero.y + dy };
			if (!this.level.inside(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			//Java's `passable || avoid` - the second half is what lets the hawk perch over a chasm.
			//This port's terrain has no separate avoid list: a chasm *is* passable here (see
			//`isChasmCell`, which is how falling is modelled), so one test covers both.
			if (this.level.passable(at.x, at.y)) spawnPoints.push(at);
		}
		if (spawnPoints.length === 0) {
			this.say(t('actors.hero.abilities.huntress.spirithawk.no_space'), 'negative');
			return false;
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		const at = Random.element(spawnPoints)!;
		const ally = this.spawnMonster('spiritHawk', at, false, undefined, true, 'spiritHawk');
		ally.sleeping = false;
		ally.attacksAutomatically = false;
		ally.spiritHawkTime = SPIRIT_HAWK_LIFESPAN;
		ally.spiritHawkDodges = spiritHawkDodges(this.talentRank('swift_spirit'));
		//Java's `Invisibility.dispel()` trails the summon (not the direct branch).
		delete this.hero.buffs['invisibility'];
		this.refresh();
		this.spendHeroAction(1);
		return true;
	},

	/** `SpiritHawk.getHawk()`: the living hawk, if one is out. */
	spiritHawk(this: DungeonScene): Creature | undefined {
		return this.creatures.find((c) => c.allyKind === 'spiritHawk' && c.hp > 0);
	},

	/**
	 * `Feint.activate()` (tag `v3.3.8`): dash to an adjacent free cell and leave an `AfterImage`
	 * decoy on the cell just vacated. Every one of Java's three early-return refusals (not
	 * adjacent, rooted, solid/occupied) takes no charge and no turn, matching `HeroicLeap`'s own
	 * rooted refusal above. The decoy drawing hostile attacks needs no extra wiring here: any mob
	 * that cannot currently see the hero already prefers the nearest visible ally
	 * (`visibleAllyTarget`, `takeMonsterTurn`), and one already adjacent to it attacks it outright
	 * (the `adjacentAlly` branch) - the same existing paths `NinjaLog`'s decoy rides. What Java's
	 * `aggro()` call adds beyond that - forcibly retargeting a mob that still sees the hero onto
	 * the image instead - has no equivalent here, since this port's AI recomputes its target from
	 * field of view every turn rather than holding a persistent enemy pointer to redirect; a mob
	 * still hunting the hero in plain sight keeps hunting the hero. Documented reduction.
	 */
	activateFeint(this: DungeonScene, def: ArmorAbilityDef, cost: number, cell: Step | null): boolean {
		if (!cell) return false;
		if (Roguelike.chebyshevDistance(this.hero, cell) !== 1) {
			this.say(t('actors.hero.abilities.duelist.feint.too_far'), 'negative');
			return false;
		}
		if (this.hero.buffs['roots'] !== undefined) {
			//Short refusal form, shared with the leap/smoke-bomb refusals (see
			//`activateHeroicLeap`): Java shakes (`Feint.java` 93) a full `(1, 1f)`.
			this.shakeScreen(1, 0.15);
			this.say(t('actors.hero.abilities.duelist.feint.bad_location'), 'negative');
			return false;
		}
		if (!this.level.passable(cell.x, cell.y) || this.creatureAt(cell.x, cell.y)) {
			this.say(t('actors.hero.abilities.duelist.feint.bad_location'), 'negative');
			return false;
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		const from = { x: this.hero.x, y: this.hero.y };
		this.teleportHeroTo(cell.x, cell.y);
		delete this.hero.buffs['invisibility'];
		this.spawnAfterImage(from);
		this.say(t('actors.hero.abilities.duelist.feint.name'), 'positive');
		this.spendHeroAction(1);
		return true;
	},

	/** `ShadowClone.getShadowAlly()`: the living clone, if one is out. */
	shadowClone(this: DungeonScene): Creature | undefined {
		return this.creatures.find((c) => c.allyKind === 'shadowClone' && c.hp > 0);
	},

	/**
	 * `ShadowClone.activate()` (tag `v3.3.8`). Without a clone, the Rogue summons a
	 * `ShadowAlly` onto a random free `NEIGHBOURS8` cell (`Actor.findChar(p) == null`
	 * and `passable` - the clone does not fly, so unlike the hawk there is no `avoid`
	 * half) for the ability's charge, dispelling invisibility and spending the turn.
	 * With a clone already out the ability becomes a free order instead
	 * (`chargeUse()` returns 0), directed through the shared `directAlly` orders.
	 * Java reuses `SpiritHawk`'s `no_space` line when hemmed in, so this does too.
	 */
	activateShadowClone(this: DungeonScene, def: ArmorAbilityDef, cost: number, cell: Step | null): boolean {
		const clone = this.shadowClone();
		if (clone) {
			//Java's `activate()` returns silently when a clone exists and no target was
			//chosen; the port's aim only ever opens for the direct case.
			if (cell) {
				this.directAlly(clone, cell, {
					defend: 'actors.hero.abilities.rogue.shadowclone$shadowally.direct_defend',
					follow: 'actors.hero.abilities.rogue.shadowclone$shadowally.direct_follow',
					attack: 'actors.hero.abilities.rogue.shadowclone$shadowally.direct_attack',
				});
				this.refresh();
			}
			return false;
		}
		const spawnPoints: Step[] = [];
		for (const [dx, dy] of Roguelike.neighbourOffsets(8) as ReadonlyArray<readonly [number, number]>) {
			const at = { x: this.hero.x + dx, y: this.hero.y + dy };
			if (!this.level.inside(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			if (this.level.passable(at.x, at.y)) spawnPoints.push(at);
		}
		if (spawnPoints.length === 0) {
			this.say(t('actors.hero.abilities.huntress.spirithawk.no_space'), 'negative');
			return false;
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		const at = Random.element(spawnPoints)!;
		this.spawnShadowClone(at);
		//Java's `Invisibility.dispel()` trails the summon (not the direct branch).
		delete this.hero.buffs['invisibility'];
		this.spendHeroAction(1);
		return true;
	},

	/**
	 * `ShadowClone.ShadowAlly`'s combat chassis (tag `v3.3.8`): `HP = HT = 80` plus
	 * `PERFECT_COPY`'s `round(0.1 * points * (15 + 5*heroLevel))`, `defenseSkill =
	 * heroLevel + 4` (the port's accuracy 10 / evasion 5 base is Java's own attack 10 /
	 * defense 5 scale, so `attackSkill = defenseSkill + 5` and `defenseSkill` land
	 * directly on `accuracy`/`evasion`), and the `NormalIntRange(10, 20)` damage base.
	 * The sprite is the hero's own class sheet darkened - this port has no
	 * `ShadowSprite` art, so the mirror-image factory plus a shadow tint stands in.
	 */
	spawnShadowClone(this: DungeonScene, at: Step): Creature {
		const hp = shadowCloneHp(this.progression.level, this.talentRank('perfect_copy'));
		const clone = this.spawnMonster('rat', at, false, undefined, true, 'shadowClone');
		clone.name = t('actors.hero.abilities.rogue.shadowclone$shadowally.name');
		clone.hp = hp;
		clone.maxHp = hp;
		clone.sleeping = false;
		clone.seesHero = true;
		this.syncShadowClone(clone);
		const carrier = this.sprite(clone);
		carrier.destroy();
		const sheet = heroSheet(runState.sprites[this.heroClass]);
		const frame = Math.max(0, Math.min(5, this.armorTier)) * 21;
		const sprite = new TintedSprite(sheet.get(frame));
		placeCharacterArt(sprite);
		sprite.x = at.x * TILE;
		sprite.y = at.y * TILE;
		sprite.tint = 0x555566;
		sprite.alpha = 0.9;
		this.creatureLayer.addChild(sprite);
		this.spriteFor.set(clone.id, sprite);
		return clone;
	},

	/**
	 * Re-reads the clone's gear-scaling stats every one of its own turns (the hawk's
	 * `takeSpiritHawkTurn` precedent - a talent taken mid-summon still applies):
	 * `SHADOW_BLADE`'s `round(0.08 * points * heroDamageRoll / attackDelay)` over the
	 * `10-20` base, and `CLONED_ARMOR`'s `round(0.12 * points * heroDrRoll)` armor.
	 * Java rolls the hero's damage and DR live per swing/defense; this port reads the
	 * means of the hero's current ranges once per clone turn (no extra RNG draws) and
	 * divides by the attack-cost rate, which is this port's expression of
	 * `attackDelay()`. Not modeled: the `Int(4) < points` weapon-enchantment and
	 * armor-glyph/proc shares (`attackProc`/`defenseProc`/`glyphLevel`), which need a
	 * gear-proc call path for non-hero attackers that does not exist here.
	 */
	syncShadowClone(this: DungeonScene, clone: Creature): void {
		const heroLevel = this.progression.level;
		clone.accuracy = shadowCloneAccuracy(heroLevel);
		clone.evasion = shadowCloneEvasion(heroLevel);
		const heroMean = (this.hero.damage[0] + this.hero.damage[1]) / 2;
		const bladeShare = Math.max(0, shadowCloneBladeShare(this.talentRank('shadow_blade'), heroMean, this.getAttackTurnCostMod()));
		clone.damage = [10 + bladeShare, 20 + bladeShare];
		const heroArmorMean = (this.hero.armor[0] + this.hero.armor[1]) / 2;
		const armorShare = Math.max(0, shadowCloneArmorShare(this.talentRank('cloned_armor'), heroArmorMean));
		clone.armor = [armorShare, armorShare];
	},

	/**
	 * `Challenge.activate()` (tag `v3.3.8`): the Duelist compels a visible enemy into
	 * a 10-turn duel while every other non-ally, non-NPC char freezes. Refusals carry
	 * Java's own keys (`no_target` resolves through the shared `armorability` parent,
	 * exactly as `Messages.get` does in Java). `CLOSE_THE_GAP` blinks toward the target
	 * within `1 + points` cells along the target-rooted path map, refusing unreachable
	 * and far targets and shaking when rooted. The duel pair shares `duelParticipant`;
	 * the target aggros onto the hero. When the target is a boss nothing else freezes
	 * (Java's `BOSS_MINION` half of that condition is dead code: a boss target always
	 * satisfies the `BOSS` half, so it can never fire - the observable is "boss duels
	 * freeze nobody"). Java also `delayChar`s every spectator; with no scheduler-delay
	 * primitive here, the same 10-turn `spectatorFreeze` action block covers it.
	 */
	activateChallenge(this: DungeonScene, _def: ArmorAbilityDef, cost: number, cell: Step | null): boolean {
		//A cancelled aim is silent (the feint precedent); an aimed empty, dead or
		//unseen cell is Java's `no_target` refusal.
		if (!cell) return false;
		const target = this.creatureAt(cell.x, cell.y);
		if (!target || target.hp <= 0 || !this.fov.isVisible(cell.x, cell.y)) {
			this.say(t('actors.hero.abilities.armorability.no_target'), 'negative');
			return false;
		}
		if (this.hero.buffs['duelParticipant'] !== undefined) {
			this.say(t('actors.hero.abilities.duelist.challenge.already_dueling'), 'negative');
			return false;
		}
		if (target.isHero || target.isNPC || target.isAlly) {
			this.say(t('actors.hero.abilities.duelist.challenge.ally_target'), 'negative');
			return false;
		}
		const blocked = new Set<number>();
		for (const c of this.creatures) {
			if (!c.isHero && c.hp > 0) blocked.add(c.y * this.level.width + c.x);
		}
		const reachMap = this.pathfinder.distanceMap({ x: target.x, y: target.y }, { blocked });
		const gapPoints = this.talentRank('close_the_gap');
		const rooted = this.hero.buffs['roots'] !== undefined;
		let blinkpos = { x: this.hero.x, y: this.hero.y };
		if (gapPoints > 0 && !rooted) {
			const blinkrange = closeTheGapRange(gapPoints);
			const inRange = this.pathfinder.distanceMap({ x: this.hero.x, y: this.hero.y }, { blocked });
			let best: Step | null = null;
			for (let i = 0; i < inRange.length; i++) {
				const d = inRange[i];
				if (d < 0 || d > blinkrange) continue;
				const x = i % this.level.width;
				const y = Math.floor(i / this.level.width);
				if (!this.level.passable(x, y) || this.creatureAt(x, y)) continue;
				if (x === target.x && y === target.y) continue;
				const here = Roguelike.chebyshevDistance({ x, y }, target);
				const was = best ? Roguelike.chebyshevDistance(best, target) : Number.POSITIVE_INFINITY;
				if (here > was) continue;
				if (here === was && best) {
					const nowTrue = Math.hypot(x - this.hero.x, y - this.hero.y);
					const bestTrue = Math.hypot(best.x - this.hero.x, best.y - this.hero.y);
					if (nowTrue >= bestTrue) continue;
				}
				best = { x, y };
			}
			if (best) blinkpos = best;
		}
		const blinkIdx = blinkpos.y * this.level.width + blinkpos.x;
		if (reachMap[blinkIdx] < 0) {
			if (rooted) this.shakeScreen(1, 1);
			this.say(t('actors.hero.abilities.duelist.challenge.unreachable_target'), 'negative');
			return false;
		}
		if (Roguelike.chebyshevDistance(blinkpos, target) > 5) {
			if (rooted) this.shakeScreen(1, 1);
			this.say(t('actors.hero.abilities.duelist.challenge.distant_target'), 'negative');
			return false;
		}
		if (blinkpos.x !== this.hero.x || blinkpos.y !== this.hero.y) {
			this.teleportHeroTo(blinkpos.x, blinkpos.y);
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		if (!target.boss) {
			for (const other of this.creatures) {
				if (other === target || other.isHero || other.isNPC || other.isAlly || other.hp <= 0) continue;
				addBuff(other, 'spectatorFreeze');
			}
		}
		addBuff(target, 'duelParticipant');
		addBuff(this.hero, 'duelParticipant');
		this.hero.duelTakenDmg = 0;
		target.sleeping = false;
		target.seesHero = true;
		target.lastSeen = { x: this.hero.x, y: this.hero.y };
		delete this.hero.buffs['invisibility'];
		if (this.hero.buffs['eliminationMatch'] !== undefined) delete this.hero.buffs['eliminationMatch'];
		this.say(t('actors.hero.abilities.duelist.challenge.name'), 'positive');
		this.spendHeroAction(1);
		return true;
	},

	/**
	 * `Challenge.DuelParticipant.act()`'s pairing half (tag `v3.3.8`): on each
	 * participant's own turn, the duel ends when the other duelist is gone, shares
	 * the hero's side, or is more than 5 tiles away. The 10-turn countdown itself is
	 * the shared buff clock; expiry lands here as "other already gone" on the slower
	 * side's next turn, which runs the same detach cascade Java's `left--` runs.
	 */
	tickDuelParticipant(this: DungeonScene, self: Creature): void {
		if (self.buffs['duelParticipant'] === undefined) {
			//The 10-turn clock expires silently through the shared buff systems; the
			//hero's damage ledger marks a duel that still needs its detach cascade
			//(which is what arms `ELIMINATION_MATCH` on a timed-out duel, exactly as
			//Java's `left--` detach does).
			if (self.isHero && self.duelTakenDmg !== undefined) this.detachDuel(self);
			return;
		}
		const selfSide = self.isHero || self.isAlly;
		const other = [this.hero, ...this.creatures].find((c) => c !== self && c.hp > 0 && c.buffs['duelParticipant'] !== undefined);
		if (!other || (other.isHero || other.isAlly) === selfSide || Roguelike.chebyshevDistance(self, other) > 5) {
			this.detachDuel(self);
		}
	},

	/**
	 * `Challenge.DuelParticipant.detach()` (tag `v3.3.8`): a dying or converted duel
	 * target pays out `INVIGORATING_VICTORY` from the hero's accumulated duel damage;
	 * a living hero whose own duel ends arms `ELIMINATION_MATCH` for 3 turns. Every
	 * path clears all spectator freezes and duel buffs scene-wide (Java detaches each
	 * `SpectatorFreeze` and every other participant - with only one duel possible,
	 * that is everything) and zeroes the damage ledger.
	 */
	detachDuel(this: DungeonScene, trigger: Creature): void {
		if (!trigger.isHero) {
			const points = this.talentRank('invigorating_victory');
			if ((trigger.hp <= 0 || trigger.isAlly) && points > 0 && this.hero.hp > 0) {
				const heal = invigoratingVictoryHeal(this.hero.duelTakenDmg ?? 0, points, this.hero.maxHp - this.hero.hp);
				if (heal > 0) {
					this.hero.hp += heal;
					this.showHeal(this.hero, heal);
				}
			}
		} else if (this.hero.hp > 0 && this.talentRank('elimination_match') > 0) {
			addBuff(this.hero, 'eliminationMatch');
		}
		for (const c of [this.hero, ...this.creatures]) {
			if (c.buffs['spectatorFreeze'] !== undefined) delete c.buffs['spectatorFreeze'];
			if (c.buffs['duelParticipant'] !== undefined) delete c.buffs['duelParticipant'];
		}
		this.hero.duelTakenDmg = undefined;
	},

	/**
	 * `SmokeBomb.activate()` (tag `v3.3.8`): vanish in a puff of smoke, up to six cells away *by
	 * path* and inside the hero's own field of view, onto a cell nothing else occupies. Everyone
	 * adjacent to the hero is blinded for half `Blindness.DURATION` (5 turns) and dropped out of the
	 * hunt, which is what makes the escape work: `Level.updateFieldOfView` gives a blinded creature
	 * an empty field of view, so it cannot re-acquire the hero by sight.
	 *
	 * `HASTY_RETREAT` adds `0.67 + points` turns of both Haste and Invisibility; `BODY_REPLACEMENT`
	 * leaves a `NinjaLog` decoy on the cell the hero left. `SHADOW_STEP` is the reason this ability
	 * is worth using while already invisible: with it ranked, the charge is `0.84^points` cheaper and
	 * the escape costs **no time at all** (`hero.next()`), so the hero keeps the turn.
	 */
	activateSmokeBomb(this: DungeonScene, def: ArmorAbilityDef, cost: number, cell: Step | null): boolean {
		if (!cell) return false;
		const hero = this.hero;
		const shadowStepping = this.talentRank('shadow_step') > 0 && hero.buffs['invisibility'] !== undefined;
		const target = { x: cell.x, y: cell.y };
		if (target.x !== hero.x || target.y !== hero.y) {
			if (hero.buffs['roots'] !== undefined) {
				//Short refusal form, shared with the leap/feint refusals (see
				//`activateHeroicLeap`): Java shakes (`SmokeBomb.java` 91) a full `(1, 1f)`.
				this.shakeScreen(1, 0.15);
				return false;
			}
		}
		//Java: `PathFinder.buildDistanceMap(hero.pos, passable|avoid, 6)` then a `distance[target]`
		//check, an FOV check, and "no char there unless it is the hero's own cell".
		const distances = this.pathfinder.distanceMap({ x: hero.x, y: hero.y });
		const pathDistance = distances[this.level.index(target.x, target.y)] ?? Number.MAX_SAFE_INTEGER;
		const occupied = target.x === hero.x && target.y === hero.y ? null : this.creatureAt(target.x, target.y);
		if (pathDistance > 6 || !this.fov.isVisible(target.x, target.y) || occupied) {
			this.say(t('actors.hero.abilities.rogue.smokebomb.fov'), 'negative');
			return false;
		}
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		if (!shadowStepping) {
			for (const other of this.creatures) {
				if (other.isHero || other.isNPC || other.isAlly || other.hp <= 0) continue;
				if (Roguelike.chebyshevDistance(other, hero) !== 1) continue;
				//`Blindness.DURATION / 2f`; Java also flips a HUNTING mob back to WANDERING, which
				//this port reaches by clearing the sight flag it hunts on.
				addBuff(other, 'blindness', BUFF_DURATION.blindness / 2);
				other.seesHero = false;
			}
			if (this.talentRank('body_replacement') > 0) this.placeNinjaLog(hero.x, hero.y);
			const hastyRetreat = this.talentRank('hasty_retreat');
			if (hastyRetreat > 0) {
				//Java's own duration is the fractional `0.67f + points` ("effectively 1/2/3/4 turns"
				//by its own comment); this port's buff map counts whole turns, so it rounds.
				const turns = Math.round(0.67 + hastyRetreat);
				hero.buffs['haste'] = Math.max(hero.buffs['haste'] ?? 0, turns);
				addBuff(hero, 'invisibility', turns);
			}
		}
		this.teleportHeroTo(target.x, target.y);
		this.say(t('actors.hero.abilities.rogue.smokebomb.name'), 'positive');
		if (!shadowStepping) this.spendHeroAction(1);
		return true;
	},

	/**
	 * `BODY_REPLACEMENT`'s `NinjaLog`: an immovable ally at the cell the hero just left. It never
	 * attacks and never acts (`takeAllyTurn` returns for it immediately); what it does is stand
	 * there with `defenseSkill = 0`, so whatever was hunting the hero swings at the decoy instead -
	 * which is this port's existing ally-targeting path, since monsters already consider allies.
	 * Its stats are the talent's own: `HT = 20 * points`, and its `drRoll()` adds
	 * `NormalIntRange(points, 3 * points)` to the (zero) row armor.
	 */
	placeNinjaLog(this: DungeonScene, x: number, y: number): void {
		//Java kills every existing log first, so only ever one decoy stands. `kill()` is
		//ally-safe (no XP/loot/hooks for allies), so this is just the retirement.
		for (const other of [...this.creatures]) {
			if (other.allyKind === 'ninjaLog') this.kill(other);
		}
		const points = this.talentRank('body_replacement');
		const log = this.spawnMonster('ninjaLog', { x, y }, false, undefined, true, 'ninjaLog');
		log.sleeping = false;
		log.maxHp = 20 * points;
		log.hp = log.maxHp;
		log.armor = [points, 3 * points];
	},

	/**
	 * `NaturesPower.activate()` (tag `v3.3.8`): eight turns of "nature's power", during which the
	 * hero moves at `2 + 0.25 * GROWING_POWER` times his normal speed (`Hero.speed()`), his bow
	 * hits can sprout a harmful plant under whatever they strike (`NATURES_WRATH`), and a kill
	 * extends the window (`WILD_MOMENTUM`, at most `extensionsLeft = 2` times).
	 */
	activateNaturesPower(this: DungeonScene, def: ArmorAbilityDef, cost: number): boolean {
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		this.naturesPowerTurns = NATURES_POWER_DURATION;
		this.naturesPowerExtensions = 2;
		//Nature's Power is one of the two abilities whose Java source does not dispel invisibility
		//(`NaturesPower.java` 55 does, in fact - so this one does).
		delete this.hero.buffs['invisibility'];
		this.say(t('actors.hero.abilities.huntress.naturespower.name'), 'positive');
		this.spendHeroAction(1);
		return true;
	},

	/** `Hero.speed()`: while the power is up the hero is `2 + 0.25*GROWING_POWER` times as fast, and
	 *  this port's turn cost is the inverse of speed (the same shape Haste and the speed glyphs
	 *  already use). */
	naturesPowerSpeedFactor(this: DungeonScene): number {
		if (this.naturesPowerTurns <= 0) return 1;
		return 2 + 0.25 * this.talentRank('growing_power');
	},

	/**
	 * `SpiritBow.proc()`'s Nature's-Power block, run on a landed thrown hit while the power is up:
	 * `NATURES_WRATH` rolls `Random.Int(12) < points` for a random harmful plant sprouting on the
	 * target's own cell, and a hit that *killed* the target extends the window once by
	 * `WILD_MOMENTUM` points (Java allows two extensions per cast, `extensionsLeft = 2`).
	 *
	 * The plant goes through this port's existing mob-plant path - placed as a manual plant and
	 * then `triggerMobPlantAt` - so every harmful plant's non-hero half is the same code a monster
	 * stepping on one already runs.
	 */
	applyNaturesPowerOnHit(this: DungeonScene, target: Creature): void {
		if (this.naturesPowerTurns <= 0) return;
		if (Random.int(0, 12) < this.talentRank('natures_wrath')) {
			const plant = Random.element(HARMFUL_PLANTS);
			//Java plants it *under the target* (`plant.pos = defender.pos`), so the creature standing
			//there is expected, not a conflict - only the terrain has to accept a plant.
			if (plant && this.level.passable(target.x, target.y) && !this.isChasmCell(target.x, target.y)) {
				const cell = this.level.index(target.x, target.y);
				this.manualPlants.set(cell, plant);
				this.placePortedFeature(cell, plant);
				this.triggerMobPlantAt(target);
			}
		}
		const wildMomentum = this.talentRank('wild_momentum');
		if (target.hp <= 0 && wildMomentum > 0 && this.naturesPowerExtensions > 0) {
			this.naturesPowerTurns += wildMomentum;
			this.naturesPowerExtensions--;
		}
	},

	/**
	 * One armor-ability hit's damage. Java's abilities call `ch.damage()` directly on the values
	 * their own formulas produced, so every defender-side rule that lives in `Char.damage()` applies
	 * - including `YogDzewa.isInvulnerable()` while any fist lives, the fist proximity guard,
	 * Tengu's HP bracket, and the per-class `damage()` curves. This routes through the same shared
	 * seam bombs use (`applyBlastDamage`) rather than a sixth hand-rolled copy of the tail, with
	 * armor already subtracted by each ability's own formula (`pierceArmor`) and the mirror fade,
	 * which that seam does not do.
	 */
	applyAbilityDamage(this: DungeonScene, target: Creature, damage: number, strikeSrc?: ElementalStrikeDamageSource): void {
		if (damage <= 0 || target.isNPC) return;
		//`Char.damage()` zeroes a hit whose source class the target resists
		//(`isImmune(srcClass)`): the Antimagic champion's RESISTS names `ElementalStrike`
		//and `Grim`, so those two sources deal it nothing - skipped outright like the
		//wand-zap loop's own `magicImmune` guard. Kinetic/Projecting pass their
		//unresisted enchantment instead (see `elementalStrikeResisted`).
		if (strikeSrc !== undefined && elementalStrikeResisted(strikeSrc, target.magicImmune === true)) return;
		if (this.fadeMirrorOnDamage(target, damage)) return;
		//Armor-ability damage is never a plain weapon hit: it clears the boss-challenge flag.
		this.disqualifyBossChallenge(target);
		this.applyBlastDamage(target, damage, true, 'foe');
	},
};
