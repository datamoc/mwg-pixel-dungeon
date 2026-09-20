import type { DungeonScene } from '../dungeonScene';
import { refreshInventoryPanel as refreshInventoryPanelView, type InventoryPanelContext } from '../../ui/inventoryPanel';
import { createJournalWindow } from '../../ui/journalWindow';
import { createJournalTabs } from '../../ui/journalContent';
import { Actors, Camera, Game, Random, Roguelike, TintedSprite, Window } from 'mwg';
import { spawnDeathBursts, spawnShadowBurst, spawnTeleportBurst } from '../../ui/effectBursts';
import { BOOMERANG_RETURN_ACC_FACTOR, BOOMERANG_RETURN_TURNS, MISSILE_DEFAULT_QUANTITY, MISSILE_MAX_DURABILITY, bolasCrippleTurns, missileDamageRange, missileStackId, recordMissileUpgrade, tomahawkBleedRange } from '../../items/missiles';
import { applyMealEatenEffects, type ConsumableContext } from '../../items/consumables';
import { applyScrollEffect } from '../../items/scrollEffects';
import { applyPotionPurity, cureHeroBuffs } from '../../items/potionEffects';
import { aimCandleFlow, placeCandleAtSlot, type CandleAimContext, type CandleContext } from '../../items/candles';
import { type BombContext } from '../../items/bombs';
import { bagTab, type BagId } from '../../items/bags';
import { useStoneOfDetectMagic as useItemStoneOfDetectMagic, useStoneOfIntuition as useItemStoneOfIntuition, type StoneContext } from '../../items/stones';
import { randomAlchemicalPotion, randomArcaneScroll } from '../../items/alchemy';
import { groundKindForItem, isUpgradableItem, rollGeneratedAffix, sourceInventoryItem } from '../../items/itemKinds';
import { ENCHANT_TABLE, GLYPH_TABLE } from '../../items/itemAffixes';
import { POTION_CLASS_BY_PORT_ID } from '../../items/transmutation';
import { RING_DEFS, ringSharpshootingBonus, ringWealthMultiplier } from '../../items/ringModifiers';
import { GROUND_ITEM_KEYS, has, t, titleCase } from '../../i18n/index';
import { SPD_STATUS_COLOR } from '../../ui/spdTheme';
import { enhancedRingsDuration } from '../../talentEffects';
import { SpdRandom } from '../../spdRng';
import { entranceRoomContext } from '../../spdLevelGen/rooms/standard/entranceRoom';
import { runState } from '../../runState';
import { STARVING } from '../../simulation/hunger';
import { armorAbilityDef, armorAbilityKey, armorChargeUse, type ArmorAbilityDef } from '../../armorAbilities';
import { CLASSES } from '../../classes';
import { TitleScene } from '../../scenes/titleScene';
import { ClassSelectScene } from '../../scenes/classSelectScene';
import { openGameMenu as openGameMenuWindow } from '../../ui/gameMenu';
import { showConfirmWindow } from '../../ui/portWindows';
import { teleportAppearPlan } from '../../simulation/teleportAppear';
import { type DeathBurstSpec } from '../../simulation/deathBursts';
import { useTorchFlow, type TorchContext } from '../../items/selfUse';
import { WEAPON_NAME_BY_CLASS, isClassArmorId } from '../../items/catalog';
import { getCurse } from '../../items/itemCurses';
import { Cat, randomArmor, randomArtifact, randomGold, randomUsingDefaults, randomWeapon } from '../../items/generator';
import { MWL_MISSILE_BY_CLASS, mwlItemEffectValue } from '../../mwlContent';
import { assignQuickslot as assignFamilyQuickslot, readQuickslotStates, useItemById as routeItemAction, useQuickslot as useQuickslotEntry, type ItemActionContext, type QuickslotContext } from '../../items/itemActions';
import { addScrollToSpellbook, applyCapeOfThornsProc, spellbookChargeCap, useSpellbook as useArtifactSpellbook, useToolkit as useArtifactToolkit } from '../../items/artifactActions';
import { useSandalsFlow, type SandalsFlowContext } from '../../items/sandals';
import { useChainsFlow, type ChainsFlowContext } from '../../items/chains';
import { hornChargeCap, useHornFlow, type HornFlowContext } from '../../items/horn';
import { useArmbandFlow, type ArmbandFlowContext } from '../../items/armband';
import { checkTalismanAwarenessFlow, useTalismanFlow, type TalismanFlowContext } from '../../items/talisman';
import { roseChargeCap, roseGhostMaxHp, rosePetalDropCap, rosePetalPickup, rosePetalsNeeded, useRoseFlow, type RoseFlowContext } from '../../items/rose';
import { beaconChargeCap, useBeaconFlow, type BeaconFlowContext, type BeaconItem } from '../../items/beacon';
import { type WealthDropPlan } from '../../items/wealthDrops';
import { artifactRechargeEffect, bankArtifactCharge, chaliceRechargeHeal, roseRechargeGhostHeal } from '../../items/artifactRecharge';
import { openClassArmorTransfer as openInventoryClassArmorTransfer } from '../../items/equipment';
import { FLOOR, GRASS, HIGH_GRASS, TILE } from '../../dungeonConstants';
import { addBuff, reigniteBuff, type BuffId, type Creature, type GroundItem, type Step } from '../../combat';
import { BOSSES, IMMOVABLE_KINDS, LIMITED_DROP_DECAY, MOB_LOOT, MONSTERS, isUndeadOrDemonic, type MonsterId } from '../../monsters';
import { APPEARANCE_TABLES, effectMarkSheet } from './shared';

/** DungeonScene methods, moved verbatim from `dungeonScene.ts` (group `part11`). Each takes the scene as `this`;
 * `dungeonScene.ts` merges them back onto the class prototype. */
export const part11Methods = {
	/** `Hero.die()`'s blessed-ankh branch (tag `v3.3.8`): Java looks for ankhs first, preferring
	 * blessed ones, and a blessed ankh revives on the spot at a quarter health, cured and briefly
	 * invulnerable, consuming itself. An unblessed ankh opens `WndResurrect` instead - that window
	 * (keep-two-items plus resurrect mode) is separate roadmap work, so an unblessed ankh still
	 * falls through to the game-over path below, exactly as before this method existed. Placed
	 * before the death presentation so a revive skips bones, badges, and the defeat panel; the
	 * scheduler/creature removal further down never runs for a revived hero. */
	reviveWithBlessedAnkh(this: DungeonScene): boolean {
		const ankh = this.bag.items.find((item) => item.id === 'ankh'
			&& (item as typeof item & { blessed?: boolean }).blessed && (item.quantity ?? 0) > 0);
		if (!ankh) return false;
		this.bag.remove('ankh', 1, ankh.instanceId);
 		this.hero.hp = Math.floor(this.hero.maxHp / 4);
 		//`PotionOfHealing.cure()`'s modelled set, shared with the potion, the well and Mageroyal.
 		this.cureHeroBuffs();
		addBuff(this.hero, 'invulnerability');
		this.say(t('actors.hero.hero.revive'), 'positive');
		return true;
	},

	/** `Torch.execute(AC_LIGHT)` (tag `v3.3.8`): consume one torch and grant the 250-turn
	 * Light buff (`Buff.affect(hero, Light.class, Light.DURATION)`), spending the hero's turn
	 * (`TIME_TO_LIGHT = 1`). Java also plays the BURNING sample, bursts flame particles, runs
	 * the operate animation and counts the use in the Catalog - this port has a seam for none
	 * of those (see PORT_COVERAGE.md's torch row), so the buff icon and the sight change are
	 * the whole observable effect. Java logs no message either, so neither does this. */
	useTorch(this: DungeonScene, instanceId?: string): void {
		useTorchFlow(this.torchContext(), instanceId);
	},

	/**
	 * The torch-light flow lives in `items/selfUse.ts` behind `TorchContext` - the
	 * file-size refactor's twenty-sixth extraction (with Ankh above), behavior-identical.
	 */
	torchContext(this: DungeonScene): TorchContext {
		const scene = this;
		return {
			hasTorch: (instanceId) => scene.bag.find('torch', instanceId) !== undefined,
			consumeTorch: (instanceId) => { scene.bag.remove('torch', 1, instanceId); },
			grantLight: () => { addBuff(scene.hero, 'light'); },
			spendTurn: () => { scene.actionSpentTurn = true; scene.spendHeroTurn(1); },
		};
	},

	/**
	 * `CeremonialCandle`'s `defaultAction = AC_THROW` (`CeremonialCandle.java`, tag
	 * `v3.3.8`): the candle is thrown at the ritual site, landing in a heap on one of
	 * the four cardinal neighbours `checkCandles()` reads. The bag action therefore aims
	 * through the `TargetingController` (the runestone/wand seam) instead of the old
	 * stand-on-the-slot use: only an empty ritual slot validates, and confirming spends
	 * the throw's turn like every other aimed throw. Heap intermediaries stay collapsed -
	 * the candle travels bag-direct to the slot, with no droppable heap and no pickup.
	 */
	useCandle(this: DungeonScene, instanceId?: string): void {
		aimCandleFlow(this.candleAimContext(), instanceId);
	},

	/**
	 * The candle throw-aim flow lives in `items/candles.ts` behind `CandleAimContext` -
	 * the file-size refactor's twenty-fifth extraction, behavior-identical. The place
	 * half already lived there; only the aimer joins it.
	 */
	candleAimContext(this: DungeonScene): CandleAimContext {
		const scene = this;
		return {
			hasCandle: (instanceId) => scene.bag.find('candle', instanceId) !== undefined,
			get ritualPos() { return scene.ritualPos; },
			get levelWidth() { return scene.level.width; },
			isSlotFree: (slot) => !scene.ritualCandles[slot],
			beginAim: (opts) => scene.beginAiming(opts),
			placeCandle: (slot, instanceId) => { placeCandleAtSlot(scene.candleContext(), slot, instanceId); },
			spendTurn: () => { scene.actionSpentTurn = true; scene.spendHeroTurn(1); },
			say: scene.say.bind(scene),
			t,
		};
	},

	/** `StoneOfDetectMagic.onItemSelected()`: reveal a picked equipable/wand's curse state and
	 * report its magic (`detected_none/both/good/bad`): negative = cursed or a curse affix
	 * (`hasCurseEnchant()`/`hasCurseGlyph()`), positive = a real upgrade level or a good
	 * affix. Real Java's `usableOnItem` is `EquipableItem || Wand` while not fully known
	 * (`!isIdentified() || !cursedKnown`); this port's bag equipables are `weaponReward`,
	 * `armorReward`, `ring_*` (rings are `EquipableItem` in Java too) plus the single-id
	 * `wand`, and `cursedKnown` is already a tracked bag field (see the awareness-well row).
	 * The stone is consumed on completion, like every other `InventoryStone` here. Stated
	 * simplifications: equipped gear is not targetable (bag-only picker); the single-id wand
	 * carries no upgrade level in this model, so it only ever reports its curse state; the
	 * generated catalog has no `stoneofdetectmagic` keys at all, so the four report lines
	 * and the name resolve through `port.*` keys sourced verbatim from Java. */
	useStoneOfDetectMagic(this: DungeonScene, instanceId?: string): void {
		useItemStoneOfDetectMagic(this.stoneContext(), instanceId);
	},

	/** `StoneOfIntuition`: pick an unidentified potion/scroll/ring, guess its type from the
	 * still-unknown classes, identify on a correct guess (`WndGuess`, checked against tag
	 * `v3.3.8`). Two picker invocations stand in for the two windows: the item pick (real
	 * `inv_title`) then the guess rows (real `$wndguess.text` title, true names shown - Java
	 * shows each candidate's real name too). A correct guess identifies every bag instance
	 * of that id (Java's `identify()`/`setKnown()` are class-level, not per-instance).
	 * The alternating free/paid rule is real (`IntuitionUseTracker`, a `revivePersists`
	 * buff here kept as a plain run flag): the first guess only sets the tracker and keeps
	 * the stone, the next guess consumes a stone and clears it. Stated simplifications: no
	 * separate select-then-confirm step (a guess row confirms immediately); "unknown" means
	 * no identified bag instance of that class (consumed knowns read unknown again - no
	 * run-level `Handler` set exists here); exotic classes don't exist, so the decks are the
	 * regular 12 potion / 12 scroll / 12 ring ids; `Talent.onRunestoneUsed` has no expression
	 * (no caller among the other stones either). The dead `preserved`/`break` catalog keys
	 * are deliberately unused (`break` is referenced nowhere in Java source). */
	useStoneOfIntuition(this: DungeonScene, instanceId?: string): void {
		useItemStoneOfIntuition(this.stoneContext(), instanceId);
	},

	refreshInventoryPanel(this: DungeonScene): void {
		const weaponFrame = { warrior: 96, mage: 101, rogue: 100, huntress: 98, duelist: 99, cleric: 97 }[this.heroClass];
		const weaponNameKey = this.weaponSourceClass !== undefined && this.weaponSourceClass !== 'startingWeapon'
			? WEAPON_NAME_BY_CLASS[this.weaponSourceClass.toLowerCase()]
			: undefined;
		const weaponDescKey = `${weaponNameKey?.slice(0, -'.name'.length)}.desc`;
		const weaponAbilityDescKey = `${weaponNameKey?.slice(0, -'.name'.length)}.ability_desc`;
		const context: InventoryPanelContext = {
			panel: this.inventoryPanel,
			open: this.inventoryOpen,
			items: this.bag.items,
			armorId: this.armorId, armorInstanceId: this.armorInstanceId, armorLevel: this.armorLevel, armorSealed: this.armorSealed,
			weaponInstanceId: this.weaponInstanceId,
			//`WEAPON_NAME_BY_CLASS` names the hero's real equipped class once it stops being the
			//starting weapon (`equipWeapon`'s `scene.weaponSourceClass = id`) - this used to stay
			//on the class's own starting-weapon key forever, so the bag slot for a hero already
			//wielding a found longsword still read "worn shortsword". `weaponFrame` stays the
			//per-class icon unchanged (a stated simplification, not this fix's scope: this port
			//has no per-weapon-class sprite frame data - `weaponReward`'s own bag-item frame is
			//uniformly 96 regardless of `sourceClass` too, see `item-rules.mwl`).
			weaponName: weaponNameKey ? t(weaponNameKey) : t(CLASSES[this.heroClass].weaponKey),
			//`MeleeWeapon.info()` (tag `v3.3.8`): the weapon's own `.desc`, plus - Duelist only,
			//`!(this instanceof MagesStaff)` (no port item, so never excludes anything here) -
			//its real `.ability_desc`, the T-key ability text Java shows nowhere else. Both keys
			//are derived from the same class name `weaponName` above already resolved.
			weaponDescription: weaponNameKey
				? [
					has(weaponDescKey) ? t(weaponDescKey) : undefined,
					this.heroClass === 'duelist' && has(weaponAbilityDescKey) ? t(weaponAbilityDescKey) : undefined,
				].filter((part): part is string => part !== undefined).join('\n\n') || undefined
				: undefined,
			weaponFrame,
			equippedRing: this.equippedRing,
			gold: this.heroStats.base('gold'),
			wide: this.interfaceSize === 1,
			itemDisplayName: (id, identified, instanceId) => this.itemDisplayName(id, identified, instanceId),
			addToStage: (panel) => this.stage.addChild(panel),
			positionInterface: () => this.positionInterface(Game.current.width, Game.current.height),
		};
		refreshInventoryPanelView(context);
	},

	openGameMenu(this: DungeonScene): void {
		openGameMenuWindow({
			windows: this.gameWindows,
			gameOver: this.gameOver,
			canLeave: entranceRoomContext.guideIntroRead,
			saveRun: () => this.saveRun(),
			startNewRun: () => Game.current.switchScene(ClassSelectScene),
			toTitle: () => Game.current.switchScene(TitleScene),
		});
	},

	openJournal(this: DungeonScene): void {
		if (this.journalOpen) return;
		this.inventoryOpen = false;
		if (this.inventoryPanel) this.inventoryPanel.visible = false;
		const tabs = createJournalTabs({
			items: this.bag.items,
			questStatus: (id) => this.quests.status(id),
			questObjective: (id) => this.quests.currentStage(id)?.description,
			itemDisplayName: (id, identified) => this.itemDisplayName(id, identified),
		});
		this.journalWindow = createJournalWindow(tabs, () => this.closeJournal());
		this.journalOpen = true;
		this.stage.addChild(this.journalWindow);
		this.positionInterface(Game.current.width, Game.current.height);
	},

	closeJournal(this: DungeonScene): void {
		this.journalOpen = false;
		this.journalWindow?.close();
		// A closed `mwg/ui` Window is spent: its internal container is gone, so any later
		// `positionInterface` assignment (`journalWindow.x = ...`) throws on the null inner object.
		// Dropping the reference is what makes the guard in `positionInterface` mean anything.
		this.journalWindow = undefined;
	},

	/** `Talent.onArtifactUsed()`'s `ENHANCED_RINGS` leg (tag `v3.3.8`): using an artifact
	 * grants the worn ring +1 upgrade for 3/6/9 turns (`enhancedRingsTurns`, read by
	 * `effectiveRing()`). Java arms this inside each artifact's own success path
	 * (chains pulls, horn meals, cloak fades, rose/sandals/talisman/armband uses,
	 * toolkit energy spending); the per-artifact sites that report success call this
	 * directly, while the picker/aim-mediated ones that cannot report back arm it at
	 * the dispatch point below instead - refusals there still arm, the attempt spent
	 * the action and the window is too short for the difference to matter. Java's
	 * other two legs need talents this port has none of (`DIVINE_SENSE`,
	 * `Talent.CLEANSE`), so they are Not ported - see `PORT_COVERAGE.md`. */
	armEnhancedRingsFromArtifact(this: DungeonScene): void {
		if (this.heroClass === 'rogue' && this.talentRank('enhanced_rings') > 0) {
			this.enhancedRingsTurns = enhancedRingsDuration(this.talentRank('enhanced_rings'));
		}
	},

	useItemById(this: DungeonScene, id: string, instanceId?: string): void {
		//`Armor.AC_DETACH` (`Armor.java` 190-198): Java lists this action on the *equipped* armor's
		//own window, and tapping an already-equipped armor is a no-op here otherwise - `equipArmor`
		//returns the moment the instance matches the equipped one - so that is the seam it uses.
		if (this.armorSealed && (id === 'armor' || id === 'armorReward' || id === 'clothArmor' || isClassArmorId(id))
			&& instanceId !== undefined && instanceId === this.armorInstanceId) {
			this.detachSeal();
			return;
		}
		this.assignQuickslot(id, instanceId);
		//Armed on the use attempt: Java arms inside each artifact's own execute path,
		//which the methods behind this dispatch don't report back through, so the single
		//dispatch point stands in for the ones it routes (cloak/hourglass/chalice - horn,
		//chains and the rest never reach this condition under their own bag ids; the ones
		//this pass owns arm at their own success points instead, chains pulls and horn
		//meals below via `armEnhancedRingsFromArtifact`). Refusals (cursed, no charge) still arm: the
		//attempt spent the action, and the 3-9-turn window is too short for the
		//difference to matter - stated, not silent.
		if (id.includes('artifact') || id === 'cloak' || id === 'hourglass' || id === 'chalice') {
			this.armEnhancedRingsFromArtifact();
		}
		routeItemAction(this.itemActionContext(), id, instanceId);
	},

	transferClassArmor(this: DungeonScene): void { openInventoryClassArmorTransfer(this as unknown as Parameters<typeof openInventoryClassArmorTransfer>[0], this.openItemPicker.bind(this), this.refresh.bind(this), t, (line, level) => this.say(line, level), () => { this.actionSpentTurn = true; this.spendHeroTurn(1); }); },

	itemActionContext(this: DungeonScene): ItemActionContext {
		return {
			awaitingInput: this.awaitingInput,
			setRequestedItem: (id, instanceId) => { this.requestedItemId = id; this.requestedItemInstanceId = instanceId; },
			onAction: this.onAction.bind(this),
			equipRing: this.equipRing.bind(this), equipArmor: this.equipArmor.bind(this), transferClassArmor: this.transferClassArmor.bind(this),
			equipWeapon: this.equipWeapon.bind(this), equipWand: this.equipWand.bind(this),
			mineWithPickaxe: this.mineWithPickaxe.bind(this), plantSeed: this.plantSeed.bind(this),
			useHourglass: this.useHourglass.bind(this), useCloak: this.useCloak.bind(this),
			useChalice: this.useChalice.bind(this),
			useToolkit: this.useToolkit.bind(this), useRose: this.useRose.bind(this),
			useChains: this.useChains.bind(this), useHorn: this.useHorn.bind(this),
			useBeaconArtifact: this.useBeaconArtifact.bind(this),
			useArmband: this.useArmband.bind(this), useSandals: this.useSandals.bind(this),
			useTalisman: this.useTalisman.bind(this), useSpellbook: this.useSpellbook.bind(this),
			wieldMissile: this.wieldMissile.bind(this),
			useStoneById: this.useStoneById.bind(this), useCandle: this.useCandle.bind(this),
			useTorch: this.useTorch.bind(this),
			useAnkh: this.useAnkh.bind(this),
			useBomb: this.useBomb.bind(this), useHoneypot: this.useHoneypot.bind(this), useBrew: this.useBrew.bind(this), useStylus: this.useStylus.bind(this),
			useBrokenSeal: this.useBrokenSeal.bind(this),
			useAlchemize: this.useAlchemize.bind(this), useKingsCrown: this.useKingsCrown.bind(this),
			useFeatherFall: this.useFeatherFall.bind(this),
			useWildEnergy: this.useWildEnergy.bind(this), useTelekineticGrab: this.useTelekineticGrab.bind(this),
			usePhaseShift: this.usePhaseShift.bind(this),
			useSummonElemental: this.useSummonElemental.bind(this),
			useReclaimTrap: this.useReclaimTrap.bind(this),
			useRecycle: this.useRecycle.bind(this),
			useCurseInfusion: this.useCurseInfusion.bind(this),
			useMagicalInfusion: this.useMagicalInfusion.bind(this),
			useBeaconOfReturning: this.useBeaconOfReturning.bind(this),
			useAlchemicalCatalyst: this.useAlchemicalCatalyst.bind(this),
			useArcaneCatalyst: this.useArcaneCatalyst.bind(this),
			openBag: this.openBag.bind(this),
		};
	},

	/**
	 * Using a bag shows its contents: the flat bag keeps no per-bag contents arrays,
	 * but the window's filtered pouch tabs already are the per-bag views, so the bag
	 * opens on its own tab (`bags.ts`'s `bagTab`). Free - opening a bag spends no turn
	 * in Java either.
	 */
	openBag(this: DungeonScene, bag: BagId): void {
		this.inventoryOpen = true;
		this.inventoryPanel.openOnTab(bagTab(bag));
		this.refreshInventoryPanel();
	},

	// ---------------------------------------------------------------------------------
	// The artifact and gear actions the truncation dropped. Each body below is the one the
	// session transcripts recorded - recovered verbatim, not rewritten - and each carries its
	// own Java citation, so the documentation rule is satisfied at the point of behaviour.
	// ---------------------------------------------------------------------------------

		useToolkit(this: DungeonScene, instanceId?: string): void {
			useArtifactToolkit(this.artifactActionContext(), instanceId);
		},

		useRose(this: DungeonScene, instanceId?: string): void {
			useRoseFlow(this.roseFlowContext(), instanceId);
		},

		/**
		 * The Dried Rose's summon/direct flow lives in `items/rose.ts` behind
		 * `RoseFlowContext` - the file-size refactor's thirteenth extraction, behavior-identical.
		 */
		roseFlowContext(this: DungeonScene): RoseFlowContext {
			const scene = this;
			return {
				get magicImmune() { return scene.hero.magicImmune === true; },
				get heroPos() { return { x: scene.hero.x, y: scene.hero.y }; },
				get levelSize() { return { width: scene.level.width, height: scene.level.height }; },
				get sadGhostComplete() { return scene.quests.status('sadGhost') === 'complete'; },
				roseOf: (instanceId?: string) => scene.roseItem(instanceId),
				roseTitle: (instanceId?: string) => scene.itemDisplayName('rose', true, instanceId),
				openPicker: (title, entries, onPick) => scene.openItemPicker(title, entries, onPick),
				beginAim: (opts) => scene.beginAiming(opts),
				isGhostAlive: () => scene.roseGhostAlive(),
				clearDeadGhost: () => { if (!scene.roseGhostAlive()) scene.roseGhost = null; },
				isCellFree: (x, y) => scene.level.inside(x, y) && !scene.creatureAt(x, y) && scene.level.passable(x, y),
				spawnGhostAlly: (at) => scene.spawnMonster('ghost', at, false, undefined, true, 'ghost'),
				setActiveGhost: (ghost) => { scene.roseGhost = ghost as Creature | null; },
				activeGhost: () => scene.roseGhost,
				directAlly: (ghost, cell, lines) => { scene.directAlly(ghost as Creature, cell, lines); },
				heroLevel: () => scene.progression.level,
				get roseFirstSummon() { return scene.roseFirstSummon; },
				set roseFirstSummon(value: boolean) { scene.roseFirstSummon = value; },
				dispelInvisibility: () => { delete scene.hero.buffs['invisibility']; },
				refresh: () => scene.refresh(),
				spendTurn: () => { scene.actionSpentTurn = true; scene.spendHeroTurn(1); },
				say: scene.say.bind(scene),
				t,
			};
		},

		useChains(this: DungeonScene, instanceId?: string): void {
			useChainsFlow(this.chainsFlowContext(), instanceId);
		},

		/**
		 * The Ethereal Chains' grab/pull flow lives in `items/chains.ts` behind
		 * `ChainsFlowContext` - the file-size refactor's tenth extraction, behavior-identical.
		 */
		chainsFlowContext(this: DungeonScene): ChainsFlowContext {
			const scene = this;
			return {
				get magicImmune() { return scene.hero.magicImmune === true; },
				get heroPos() { return { x: scene.hero.x, y: scene.hero.y }; },
				get levelSize() { return { width: scene.level.width, height: scene.level.height }; },
				get heroRooted() { return (scene.hero.buffs['roots'] ?? 0) > 0; },
				chainsOf: (instanceId?: string) => scene.chainsItem(instanceId),
				beginAim: (opts) => scene.beginAiming(opts),
				isCellExploredOrVisible: (x, y) => scene.fov.isExplored(x, y) || scene.fov.isVisible(x, y),
				isCellPassable: (x, y) => scene.level.passable(x, y),
				isImmovableKind: (kind) => kind !== undefined && IMMOVABLE_KINDS.has(kind),
				reachableFromHero: (x, y) => {
					if (scene.miningBranchActive) return true;
					const distances = scene.pathfinder.distanceMap({ x, y });
					return (distances[scene.level.index(scene.hero.x, scene.hero.y)] ?? -1) >= 0;
				},
				traceTo: (x, y) => Roguelike.traceLine({ x: scene.hero.x, y: scene.hero.y }, { x, y }),
				creatureAt: (x, y) => scene.creatureAt(x, y),
				moveHeroTo: (cell) => {
					scene.moveTo(scene.hero, cell);
					scene.fov.update(cell.x, cell.y, scene.viewRadius());
				},
				pullEnemyTo: (enemy, destination) => { scene.moveTo(enemy as Creature, destination); },
				shake: () => { scene.shakeScreen(1, 1); },
				armEnhancedRings: () => { scene.armEnhancedRingsFromArtifact(); },
				dispelInvisibility: () => { delete scene.hero.buffs['invisibility']; },
				spendTurn: () => { scene.actionSpentTurn = true; scene.spendHeroTurn(1); },
				say: scene.say.bind(scene),
				t,
			};
		},

		useHorn(this: DungeonScene, instanceId?: string): void {
			useHornFlow(this.hornFlowContext(), instanceId);
		},

		/**
		 * The Horn of Plenty's meal flow lives in `items/horn.ts` behind
		 * `HornFlowContext` - the file-size refactor's eleventh extraction, behavior-identical.
		 */
		hornFlowContext(this: DungeonScene): HornFlowContext {
			const scene = this;
			return {
				get magicImmune() { return scene.hero.magicImmune === true; },
				hornOf: (instanceId?: string) => scene.hornItem(instanceId),
				openPicker: (title, entries, onPick) => scene.openItemPicker(title, entries, onPick),
				carriedFoods: () => scene.bag.items.map((item) => ({
					id: item.id, instanceId: item.instanceId, quantity: item.quantity, identified: item.identified ?? false,
				})),
				findFood: (id, instanceId) => {
					const food = scene.bag.find(id, instanceId);
					return food ? { quantity: food.quantity } : undefined;
				},
				consumeFood: (id, instanceId) => { scene.bag.remove(id, 1, instanceId); },
				get hunger() { return scene.hunger; },
				set hunger(value: number) { scene.hunger = value; },
				applyMealEaten: () => applyMealEatenEffects(scene.consumableContext(), 0),
				showHeal: (amount) => { scene.showHeal(scene.hero, amount); },
				/** `Food.eatingTime()`'s fast-eating gate (tag `v3.3.8`): any of the six meal
				 * talents drops the meal from `TIME_TO_EAT` (3) to 1. Five exist here
				 * (`iron_stomach`, `energizing_meal`, `mystical_meal`, `invigorating_meal`,
				 * `focused_meal`); `ENLIGHTENING_MEAL` has no port talent, so a cleric-adjacent
				 * build can never hit the fast path - Not ported for that reason. */
				hasFastEating: () => ['iron_stomach', 'energizing_meal', 'mystical_meal', 'invigorating_meal', 'focused_meal']
					.some((id) => scene.talentRank(id) > 0),
				armEnhancedRings: () => { scene.armEnhancedRingsFromArtifact(); },
				spendTurn: (cost) => { scene.actionSpentTurn = true; scene.spendHeroTurn(cost); },
				say: scene.say.bind(scene),
				t,
			};
		},

		useBeaconArtifact(this: DungeonScene, instanceId?: string): void {
			useBeaconFlow(this.beaconFlowContext(), instanceId);
		},

		/**
		 * Lloyd's Beacon's zap/set/return flow lives in `items/beacon.ts` behind
		 * `BeaconFlowContext` - the file-size refactor's fourteenth extraction, behavior-identical
		 * (the sixteenth added the single-use `BeaconOfReturning` spell twin on the same seams).
		 * The return rows' depth travel stays scene-side (`travelToDepth` runs `enterLevel`);
		 * the module only hands it the anchor.
		 */
		beaconFlowContext(this: DungeonScene): BeaconFlowContext {
			const scene = this;
			return {
				get depth() { return scene.depth; },
				get heroPos() { return { x: scene.hero.x, y: scene.hero.y }; },
				get miningBranchActive() { return scene.miningBranchActive; },
				beaconOf: (instanceId?: string) => scene.beaconArtifactItem(instanceId),
				beaconTitle: () => t('items.artifacts.lloydsbeacon.name'),
				openPicker: (title, entries, onPick) => scene.openItemPicker(title, entries, onPick),
				beginAim: (opts) => scene.beginAiming(opts),
				cellIndex: (x, y) => scene.level.index(x, y),
				gridWidth: () => scene.level.width,
				isBossDepth: () => scene.depth in BOSSES,
				hasAmulet: () => scene.bag.find('amulet') !== undefined,
				creatureAt: (x, y) => {
					const creature = scene.creatureAt(x, y);
					return creature ? { kind: creature.kind, isHero: creature.isHero, isNPC: creature.isNPC, isAlly: creature.isAlly } : null;
				},
				isImmovableKind: (kind) => kind !== undefined && IMMOVABLE_KINDS.has(kind),
				randomFreeCellNear: (x, y) => scene.randomFreeCell({ x, y }),
				moveHeroTo: (cell) => {
					scene.moveTo(scene.hero, cell);
					scene.fov.update(cell.x, cell.y, scene.viewRadius());
				},
				playHeroTeleport: (from, to) => { scene.playTeleportAppear(from, to, scene.hero); },
				playCreatureTeleport: (from, to, x, y) => {
					const creature = scene.creatureAt(x, y);
					if (creature) scene.playTeleportAppear(from, to, creature);
				},
				moveCreatureTo: (x, y, cell) => {
					const creature = scene.creatureAt(x, y);
					if (creature) scene.moveTo(creature, cell);
				},
				passable: (x, y) => scene.level.passable(x, y),
				relocateHero: (x, y) => {
					scene.hero.x = x;
					scene.hero.y = y;
					scene.sprite(scene.hero).x = x * TILE;
					scene.sprite(scene.hero).y = y * TILE;
					scene.fov.update(x, y, scene.viewRadius());
				},
				travelToDepth: (returnDepth, arrival) => {
					scene.beaconArrival = arrival;
					scene.depth = returnDepth;
					scene.miningBranchActive = false;
					scene.enterLevel();
				},
				returningBeaconOf: (instanceId?: string) => scene.bag.find('beaconOfReturning', instanceId) as (typeof scene.bag.items[number] & BeaconItem) | undefined,
				consumeReturningBeacon: (instanceId?: string) => { scene.bag.remove('beaconOfReturning', 1, instanceId); },
				spendTurn: () => { scene.actionSpentTurn = true; scene.spendHeroTurn(1); },
				clearRoots: () => { delete scene.hero.buffs['roots']; },
				dispelInvisibility: () => { delete scene.hero.buffs['invisibility']; },
				say: scene.say.bind(scene),
				t,
			};
		},

		useArmband(this: DungeonScene, instanceId?: string): void {
			useArmbandFlow(this.armbandFlowContext(), instanceId);
		},

		/**
		 * The Master Thieves' Armband's steal flow lives in `items/armband.ts` behind
		 * `ArmbandFlowContext` - the file-size refactor's twelfth extraction, behavior-identical.
		 */
		armbandFlowContext(this: DungeonScene): ArmbandFlowContext {
			const scene = this;
			return {
				armbandOf: (instanceId?: string) => scene.armbandItem(instanceId),
				beginAim: (opts) => scene.beginAiming(opts),
				creatureAt: (x, y) => scene.creatureAt(x, y),
				lootMultiplier: () => ringWealthMultiplier(scene.effectiveRing(), scene.hero.magicImmune) + scene.bountyHunterLootBonus(),
				heroLevel: () => scene.progression.level,
				mobLoot: (kind) => MOB_LOOT[kind as MonsterId] ?? [],
				lootDecay: (kind) => LIMITED_DROP_DECAY[kind as MonsterId],
				monsterMaxLvl: (kind) => MONSTERS[kind as MonsterId]?.maxLvl ?? 0,
				limitedDropCount: (kind) => scene.limitedDrops[kind as MonsterId] ?? 0,
				bumpLimitedDrop: (kind) => { scene.limitedDrops[kind as MonsterId] = (scene.limitedDrops[kind as MonsterId] ?? 0) + 1; },
				spawnLoot: (kind, x, y, item) => { scene.spawnGroundItem(kind, x, y, item); },
				groundKindName: (kind) => t(GROUND_ITEM_KEYS[kind]),
				addCreatureBuff: (creature, id, duration) => { addBuff(creature as Creature, id as BuffId, duration); },
				dispelInvisibility: () => { delete scene.hero.buffs['invisibility']; },
				say: scene.say.bind(scene),
				t,
			};
		},

		useSandals(this: DungeonScene, instanceId?: string): void {
			useSandalsFlow(this.sandalsFlowContext(), instanceId);
		},

		/**
		 * The Sandals of Nature's window flow lives in `items/sandals.ts` behind
		 * `SandalsFlowContext` - the file-size refactor's eighth extraction, behavior-identical.
		 */
		sandalsFlowContext(this: DungeonScene): SandalsFlowContext {
			const scene = this;
			return {
				get magicImmune() { return scene.hero.magicImmune === true; },
				get heroPos() { return { x: scene.hero.x, y: scene.hero.y }; },
				sandalsOf: (instanceId?: string) => scene.sandalsItem(instanceId),
				seedKind: (sourceClass?: string) => scene.seedPlantKind(sourceClass),
				carriedSeeds: () => scene.bag.items
					.filter((item) => item.id === 'seed')
					.map((item) => ({ instanceId: item.instanceId, quantity: item.quantity, sourceClass: (item as typeof item & { sourceClass?: string }).sourceClass })),
				findSeed: (instanceId?: string) => {
					const seed = scene.bag.find('seed', instanceId);
					return seed ? { instanceId: seed.instanceId, quantity: seed.quantity, sourceClass: (seed as typeof seed & { sourceClass?: string }).sourceClass } : undefined;
				},
				consumeSeed: (instanceId?: string) => { scene.bag.remove('seed', 1, instanceId); },
				openPicker: (title, entries, onPick) => scene.openItemPicker(title, entries, onPick),
				beginAim: (opts) => scene.beginAiming(opts),
				isCellVisible: (x, y) => scene.fov.isVisible(x, y),
				plantRootSeed: (cell, kind) => {
					const index = scene.level.index(cell.x, cell.y);
					scene.manualPlants.set(index, kind);
					scene.placePortedFeature(index, kind);
					const occupant = scene.creatureAt(cell.x, cell.y);
					if (occupant && !occupant.isHero) scene.triggerMobPlantAt(occupant);
					else if (occupant) scene.triggerPortedPlantAt(cell.x, cell.y);
				},
				dispelInvisibility: () => { delete scene.hero.buffs['invisibility']; },
				spendTurn: () => { scene.actionSpentTurn = true; scene.spendHeroTurn(1); },
				say: scene.say.bind(scene),
				t,
			};
		},

		useTalisman(this: DungeonScene, instanceId?: string): void {
			useTalismanFlow(this.talismanFlowContext(), instanceId);
		},

		checkTalismanAwareness(this: DungeonScene): void {
			checkTalismanAwarenessFlow(this.talismanFlowContext());
		},

		/**
		 * The Talisman of Foresight's scry flow lives in `items/talisman.ts` behind
		 * `TalismanFlowContext` - the file-size refactor's ninth extraction, behavior-identical.
		 */
		talismanFlowContext(this: DungeonScene): TalismanFlowContext {
			const scene = this;
			return {
				get magicImmune() { return scene.hero.magicImmune === true; },
				get heroPos() { return { x: scene.hero.x, y: scene.hero.y }; },
				get levelSize() { return { width: scene.level.width, height: scene.level.height }; },
				talismanOf: (instanceId?: string) => scene.talismanItem(instanceId),
				beginAim: (opts) => scene.beginAiming(opts),
				trueDistanceTo: (cell) => scene.trueDistanceTo(cell),
				isCellVisible: (x, y) => scene.fov.isVisible(x, y),
				isCellExplored: (x, y) => scene.fov.isExplored(x, y),
				markCellExplored: (x, y) => { scene.fov.explored.add(scene.level.index(x, y)); },
				terrainAt: (x, y) => scene.level.get(x, y),
				isSecretCell: (x, y) => scene.secrets.isSecret(x, y),
				discoverSecret: (x, y) => scene.secrets.discover(x, y),
				creatureAt: (x, y) => scene.creatureAt(x, y),
				markCreatureAware: (creature, duration) => {
					scene.awareCreatures.set(creature as Creature, Math.max(scene.awareCreatures.get(creature as Creature) ?? 0, duration));
				},
				hasGroundItem: (x, y) => scene.groundItemAt(x, y) != null,
				markHeapAware: (cellIndex, duration) => {
					scene.awareHeapCells.set(cellIndex, Math.max(scene.awareHeapCells.get(cellIndex) ?? 0, duration));
				},
				cellIndex: (x, y) => scene.level.index(x, y),
				insideLevel: (x, y) => scene.level.inside(x, y),
				clearTravel: () => { scene.travelTarget = null; },
				dispelInvisibility: () => { delete scene.hero.buffs['invisibility']; },
				refresh: () => scene.refresh(),
				spendTurn: () => { scene.actionSpentTurn = true; scene.spendHeroTurn(1); },
				say: scene.say.bind(scene),
				t,
			};
		},

		useSpellbook(this: DungeonScene, instanceId?: string): void {
			const book = this.spellbookItem(instanceId);
			if (!book || book.cursed || this.hero.magicImmune) { useArtifactSpellbook(this.artifactActionContext(), instanceId); return; }
			const level = book.level ?? 0;
			const charge = book.charge ?? spellbookChargeCap(level);
			const levelCap = mwlItemEffectValue('spellbook', 'levelCap');
			const readEntry = 'spellbook-read', addEntry = 'spellbook-add';
			const entries = [
				...(charge > 0 ? [{ id: 'spellbook', instanceId: readEntry, identified: true, quantity: 1 }] : []),
				...(level < levelCap ? [{ id: 'spellbook', instanceId: addEntry, identified: true, quantity: 1 }] : []),
			];
			if (entries.length === 0) { this.say(t('items.artifacts.unstablespellbook.no_charge'), 'negative'); return; }
			this.openItemPicker(t('items.artifacts.unstablespellbook.name'), entries, (entry) => {
				if (entry.instanceId === readEntry) useArtifactSpellbook(this.artifactActionContext(), instanceId);
				else if (entry.instanceId === addEntry) this.addToSpellbook(instanceId);
			});
		},

		/** A fresh `MissileWeapon.setID` for a carried stack: the scene's own per-instance counter,
		 * which is what every other instance id in this port comes from (run-seed + serial, so it is
		 * unique and survives a save). Java draws a random `SecureRandom().nextLong()` here instead -
		 * a deliberate divergence, recorded in `src/missiles.ts`'s header. */
		newMissileSetId(this: DungeonScene): string {
			return this.newItemInstanceId('missile');
		},

		/**
		 * Java's `Hero.belongings.weapon = w` swap: assigning a new missile stack returns the old
		 * one to the backpack. The port's pile *is* the wielded stack (see `src/missiles.ts`), so
		 * this writes it back as a bag entry under its own identity - set, level, wear and the
		 * remaining count - and empties the pile. A stack already in the bag of that same set and
		 * level merges back into it, which is `MissileWeapon.isSimilar` doing its job.
		 */
		stashWieldedMissile(this: DungeonScene): void {
			if (this.ammo <= 0) return;
			const definition = MWL_MISSILE_BY_CLASS.get(this.ammoSourceClass);
			//`sourceClass`/`missileSet` are this port's own minted-payload fields, which `Actors.InventoryItem`
			//does not declare (only `bagSources` and `toJSON` know about them) - hence the widened local.
			const stack: (typeof this.bag.items[number] & { sourceClass?: string; missileSet?: string; tippedSeed?: string }) = {
				//The *wieldable* id for the class - `missile_<class>`, which is what `useItemById`
				//dispatches `wieldMissile` on. A pile of unknown class falls back to the plain `stone`
				//id, exactly what a scattered heap picked up as a bag item already gets.
				id: definition?.id ?? 'stone',
				quantity: this.ammo, stackable: true, identified: true,
				sourceClass: this.ammoSourceClass || undefined,
				...(this.ammoTippedSeed !== undefined ? { tippedSeed: this.ammoTippedSeed } : {}),
				level: this.missileLevel,
				durability: this.ammoDurability,
				maxDurability: MISSILE_MAX_DURABILITY,
				missileSet: this.ammoSetId || undefined,
				instanceId: this.ammoSetId ? missileStackId(this.ammoSetId, this.missileLevel, this.ammoTippedSeed) : undefined,
			};
			this.bag.add(stack);
			this.ammo = 0;
		},

		/**
		 * `MissileWeapon.upgrade()`'s missile-specific half (tag `v3.3.8`), run after the caller's
		 * ordinary level bump on a *carried* stack: `durability = MAX_DURABILITY`,
		 * `extraThrownLeft = false`, `quantity = defaultQuantity()`, and the set's threshold recorded
		 * at the new level. Three callers reach it - the Blacksmith's upgrade service, his reforge's
		 * surviving stack, and (for the wielded pile, whose `quantity` is the pile count itself)
		 * `upgradeGear`. A non-missile stack is only relabelled, so every caller can run it
		 * unconditionally.
		 *
		 * The quantity clause is the one deliberate divergence: Java assigns `defaultQuantity()`
		 * outright, which shrinks a larger stack, and this port raises instead (see
		 * `MISSILE_DEFAULT_QUANTITY`).
		 */
		onMissileStackUpgraded(this: DungeonScene, item: { id: string; level?: number; quantity: number; instanceId?: string; durability?: number; maxDurability?: number }): void {
			const set = (item as typeof item & { missileSet?: string }).missileSet;
			if (set !== undefined) {
				item.durability = MISSILE_MAX_DURABILITY;
				item.maxDurability = MISSILE_MAX_DURABILITY;
				item.quantity = Math.max(item.quantity, MISSILE_DEFAULT_QUANTITY);
				this.missileThresholds = recordMissileUpgrade(this.missileThresholds, set, item.level ?? 0);
			}
			this.relabelMissileStack(item);
		},

		/**
		 * A carried missile stack's identity encodes its level (`"<set>:<level>"`, see
		 * `src/missiles.ts`), so anything that bumps the level has to relabel the entry too.
		 * Without this the stack's own name for itself goes on claiming the old level, and two
		 * stacks of one set at the same level stop merging - which is the one thing the identity
		 * exists to make happen (`MissileWeapon.isSimilar` merges on set *and* level).
		 *
		 * Only missile payloads are relabelled: a stack with no set (a runestone sharing the `stone`
		 * bag id, a plain item) keeps whatever id it already had.
		 */
		relabelMissileStack(this: DungeonScene, item: { id: string; level?: number; instanceId?: string }): void {
			const stack = item as typeof item & { missileSet?: string; sourceClass?: string; tippedSeed?: string };
			if (stack.missileSet === undefined || !(stack.sourceClass && MWL_MISSILE_BY_CLASS.has(stack.sourceClass))) return;
			stack.instanceId = missileStackId(stack.missileSet, item.level ?? 0, stack.tippedSeed);
		},

		wieldMissile(this: DungeonScene, id: string, instanceId?: string): void {
			const missile = this.bag.find(id, instanceId) as (typeof this.bag.items[number] & { missileSet?: string; sourceClass?: string; tippedSeed?: string }) | undefined;
			if (!missile) return;
			//The class the ammo now *is*: Java's `thrownWeapon` switch. Everything class-specific -
			//damage range, upgrade increments, durability `baseUses`, and the class's own `proc()` -
			//reads this afterwards, so wielding a Bolas makes the hero throw Bolases. Only a class the
			//authored missile table actually knows is accepted: a payload with an unknown
			//`sourceClass` would otherwise poison `ammoSourceClass` and make every later throw fail
			//inside `missileDamageRange`, from a state only a save/reload clears. **The test has to
			//run before anything is mutated** - it used to sit after the `bag.remove`, so a rejected
			//stack silently lost a unit and still left the pile's class alone.
			if (missile.sourceClass && !MWL_MISSILE_BY_CLASS.has(missile.sourceClass)) {
				//Reuses the generic "something that should not be here" line rather than minting a
				//new key: an unknown missile class is a content error, not a player-facing state.
				this.say(t('port.log.unknownmob', { kind: missile.sourceClass }), 'negative');
				return;
			}
			//Java wields the *stack* (`Hero.belongings.weapon = stack`), so the whole thing moves into
			//the pile - carrying its own level, set and wear - and whatever was already in the pile
			//goes back to the bag. The port used to move a single unit into a shared counter and only
			//adopt the stack's set when the pile happened to be empty.
			this.stashWieldedMissile();
			this.ammo = missile.quantity;
			if (missile.sourceClass) this.ammoSourceClass = missile.sourceClass;
			this.ammoTippedSeed = missile.tippedSeed;
			this.missileLevel = missile.level ?? 0;
			this.ammoSetId = missile.missileSet ?? this.newMissileSetId();
			this.ammoDurability = missile.durability ?? MISSILE_MAX_DURABILITY;
			this.bag.remove(id, missile.quantity, instanceId);
			this.say(t('port.log.pickup', { item: this.itemDisplayName(id, true, instanceId) }), 'positive');
		},

		useBrokenSeal(this: DungeonScene, instanceId?: string): void {
			if (!this.bag.find('brokenSeal', instanceId)) return;
			if (getCurse(this.armorGlyph ?? '')) {
				this.say(t('items.brokenseal.cursed_armor'), 'negative');
				return;
			}
			this.bag.remove('brokenSeal', 1, instanceId);
			this.armorSealed = true;
			this.say(t('items.brokenseal.affix'), 'positive');
			this.refreshInventoryPanel();
		},

		cancelBoomerangReturn(this: DungeonScene): void {
			if (!this.boomerangReturn) return;
			this.boomerangReturn = null;
			this.ammo++;
		},

		offerSealTransfer(this: DungeonScene, outgoingWasSealed: boolean, incomingCursed: boolean): void {
			if (this.heroClass !== 'warrior' || !outgoingWasSealed) return;
			if (incomingCursed) {
				this.say(t('items.brokenseal.cursed_armor'), 'negative');
				return;
			}
			showConfirmWindow(
				this.gameWindows,
				t('items.brokenseal.name'),
				t('port.confirm.sealtransfer.desc'),
				t('port.confirm.sealtransfer.yes'),
				t('port.confirm.sealtransfer.no'),
				() => { this.armorSealed = true; this.refreshInventoryPanel(); },
			);
		},

		applyArtifactRecharge(this: DungeonScene, amount: number): void {
			for (const item of [...this.bag.items]) {
				if (item.quantity <= 0) continue;
				const effect = artifactRechargeEffect(item.id);
				if (effect.kind === 'none') continue;
				const cursed = item.cursed === true;
				const immune = this.hero.magicImmune === true;
				const blocked = effect.guards === 'none' ? false : effect.guards === 'immuneOnly' ? immune : cursed || immune;
				if (blocked) continue;
				const level = (item as typeof item & { level?: number }).level ?? 0;
				const art = item as typeof item & { charge?: number; partialCharge?: number; cooldown?: number; hp?: number };
				switch (effect.kind) {
					case 'charge': {
						const cap = this.artifactRechargeCap(item.id, level, item);
						if (bankArtifactCharge(art, cap, effect.rate, amount, effect.capZeroesPartial) && effect.fullLineKey) {
							this.say(t(effect.fullLineKey), 'positive');
						}
						break;
					}
					case 'addCharge': {
						//`if (cooldown == 0) charge += Math.round(4*amount); if (charge >= chargeCap) proc(0, ...)`
						//- the proc is what starts the cape's own "radiating" window, so it is the same reset
						//`applyCapeOfThornsProc` performs when a hit fills the cape.
						const cap = mwlItemEffectValue('cape', 'chargeCap');
						if ((art.cooldown ?? 0) !== 0) break;
						art.charge = (art.charge ?? 0) + Math.round(effect.rate * amount);
						if ((art.charge ?? 0) >= cap) {
							art.charge = 0;
							art.cooldown = mwlItemEffectValue('cape', 'cooldownBase') + level;
							this.say(t('items.artifacts.capeofthorns$thorns.radiating'), 'positive');
						}
						break;
					}
					case 'chaliceHeal': {
						//`if (target.isStarving()) return;` and the heal only lands on a wounded hero.
						if (this.hero.hp >= this.hero.maxHp || this.hunger >= STARVING) break;
						const heal = chaliceRechargeHeal(level, amount, Random.float());
						if (heal < 1) break;
						this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + heal);
						this.showStatus(this.hero, '+' + heal, SPD_STATUS_COLOR.positive);
						break;
					}
					case 'rose': {
						const ghost = this.roseGhost;
						if (ghost && ghost.hp > 0) {
							//`else if (ghost.HP < ghost.HT) { int heal = round((1 + level()/3f)*amount); ... }`
							if (ghost.hp >= ghost.maxHp) break;
							const heal = roseRechargeGhostHeal(level, amount);
							ghost.hp = Math.min(ghost.maxHp, ghost.hp + heal);
							this.showStatus(ghost, '+' + heal, SPD_STATUS_COLOR.positive);
							break;
						}
						if (bankArtifactCharge(art, roseChargeCap(), effect.rate, amount, false)) {
							this.say(t('items.artifacts.driedrose.charged'), 'positive');
						}
						break;
					}
				}
			}
		},

		effectiveWeaponLevel(this: DungeonScene): number {
			if (this.weaponCurseInfusionBonus && !getCurse(this.weaponAffix ?? '')) this.weaponCurseInfusionBonus = false;
			return this.weaponLevel + (this.weaponCurseInfusionBonus ? 1 + Math.floor(this.weaponLevel / 6) : 0);
		},

		effectiveArmorLevel(this: DungeonScene): number {
			if (this.armorCurseInfusionBonus && !getCurse(this.armorGlyph ?? '')) this.armorCurseInfusionBonus = false;
			return this.armorLevel + (this.armorCurseInfusionBonus ? 1 + Math.floor(this.armorLevel / 6) : 0);
		},

		setWeaponAffix(this: DungeonScene, affix: string | null): void {
			if (affix === null || !getCurse(affix)) this.weaponCurseInfusionBonus = false;
			this.weaponAffix = affix;
		},

		setArmorGlyph(this: DungeonScene, glyph: string | null): void {
			if (glyph === null || !getCurse(glyph)) this.armorCurseInfusionBonus = false;
			this.armorGlyph = glyph;
		},

		roseGhostAlive(this: DungeonScene): boolean {
			return this.roseGhost !== null && this.roseGhost.hp > 0 && !this.roseGhost.isHero;
		},

		addToSpellbook(this: DungeonScene, instanceId?: string): void {
			const book = this.spellbookItem(instanceId);
			if (!book) return;
			const front = (book.scrolls ?? []).slice(0, 2);
			const candidates = this.bag.items.filter((item) => item.quantity > 0 && item.identified !== false && front.includes(item.id));
			if (candidates.length === 0) { this.say(t('items.artifacts.unstablespellbook.unable_scroll'), 'negative'); return; }
			this.openItemPicker(t('items.artifacts.unstablespellbook.prompt'), candidates, (pick) => {
				addScrollToSpellbook(this.artifactActionContext(), pick.id, instanceId);
			});
		},

		trueDistanceTo(this: DungeonScene, cell: Step): number {
			const dx = Math.fround(cell.x - this.hero.x);
			const dy = Math.fround(cell.y - this.hero.y);
			return Math.fround(Math.sqrt(Math.fround(Math.fround(dx * dx) + Math.fround(dy * dy))));
		},

		artifactRechargeCap(this: DungeonScene, id: string, level: number, item: Actors.InventoryItem): number {
			switch (id) {
				case 'cloak': return Math.min(level + 3, 10);
				case 'horn': return hornChargeCap(item as never);
				case 'beacon': return beaconChargeCap(item as never);
				case 'armband': return mwlItemEffectValue('armband', 'chargeCapBase') + Math.floor(level / 2);
				case 'spellbook': return spellbookChargeCap(level);
				case 'chains': return (mwlItemEffectValue('chains', 'chargeCapBase') + mwlItemEffectValue('chains', 'chargeCapPerLevel') * level) * 2;
				default: return roseChargeCap();
			}
		},

		isHostileToAlly(this: DungeonScene, creature: Creature): boolean {
			return !creature.isHero && !creature.isAlly && !creature.isNPC && creature.hp > 0;
		},

		castSummonElemental(this: DungeonScene, instanceId?: string): void {
			const spell = this.summonElementalItem(instanceId);
			if (!spell) return;
			const spawnPoints = Roguelike.neighbourOffsets(8)
				.map(([dx, dy]) => ({ x: this.hero.x + dx, y: this.hero.y + dy }))
				.filter((cell) => this.level.passable(cell.x, cell.y)
					&& !this.isChasmCell(cell.x, cell.y) && !this.creatureAt(cell.x, cell.y));
			// Java reuses the hawk's line here (Messages.get(SpiritHawk.class, no_space)
			// in SummonElemental.java), so this is SPD's own key, not a port invention.
			if (spawnPoints.length === 0) {
				this.say(t('actors.hero.abilities.huntress.spirithawk.no_space'), 'negative');
				return;
			}
			const at = spawnPoints[Random.int(0, spawnPoints.length - 1)]!;
			const existing = this.creatures.find((c) => c.isAlly === true && c.kind === 'newbornElemental' && c.hp > 0);
			if (existing) {
				this.moveTo(existing, at);
				//Java logs nothing for the recall - the elemental simply appears where it was called.
				this.actionSpentTurn = true;
				this.spendHeroTurn(1);
				return;
			}
			const imbued = spell.imbuedElement;
			const elemental = imbued
				? this.spawnMonster('elemental', at, false, undefined, true)
				: this.spawnMonster('newbornElemental', at, false, undefined, true);
			elemental.sleeping = false;
			elemental.hp = elemental.maxHp;
			if (imbued) elemental.elementalType = imbued;
			else {
				elemental.rangedCooldown = Number.MAX_SAFE_INTEGER;
				elemental.miniboss = false;
				//`Elemental.setSummonedALly()` (tag `v3.3.8`): the summoned
				//newborn scales with the region - `regionScale = max(2, 1 +
				//floor(scalingDepth/5))`, so sewers and prison share scale 2 and
				//it climbs 3/4/5 after (damage `5s..5+5s`, attack `5+5s`,
				//defense `5s`, HT `15s`). The row stays the never-summoned
				//template; the DR tuple (`0..5`) is already Java's.
				const regionScale = Math.max(2, 1 + Math.floor(this.depth / 5));
				elemental.accuracy = 5 + 5 * regionScale;
				elemental.evasion = 5 * regionScale;
				elemental.damage = [5 * regionScale, 5 + 5 * regionScale];
				elemental.maxHp = 15 * regionScale;
				elemental.hp = elemental.maxHp;
			}
			delete this.hero.buffs['invisibility'];
			this.bag.remove('summonElemental', 1, instanceId);
			this.say(t('port.log.summonelemental'), 'positive');
			this.actionSpentTurn = true;
			this.spendHeroTurn(1);
		},

			beginElementalImbue(this: DungeonScene, instanceId?: string): void {
			const eligible = this.bag.items.filter((item) => item.quantity > 0 && item.identified !== false
				&& ['potionFlame', 'potionFrost', 'scrollRecharging', 'scrollTransmutation'].includes(item.id));
			this.openItemPicker(t('items.spells.summonelemental.imbue_prompt'), eligible, (pick) => {
				const spell = this.summonElementalItem(instanceId);
				if (!spell) return;
				const carried = this.bag.find(pick.id, pick.instanceId);
				if (!carried || carried.quantity <= 0 || carried.identified === false) return;
				//Java's four-way `instanceof` ladder, in its own order.
				const type = pick.id === 'potionFlame' ? 'fire' : pick.id === 'potionFrost' ? 'frost'
					: pick.id === 'scrollRecharging' ? 'shock' : pick.id === 'scrollTransmutation' ? 'chaos' : null;
				if (!type) return;
				this.bag.remove(pick.id, 1, pick.instanceId);
				spell.imbuedElement = type;
				//Java plays a different sample and particle burst per element (BURNING/SHATTER/ZAP/READ,
				//FlameParticle/MagicParticle/ShaftParticle/RainbowParticle) - this port has no per-effect
				//audio or particle seam, so the spell's own real per-element description line reports it.
				this.say(t(`items.spells.summonelemental.desc_${type}`), 'positive');
			});
		},

		materialiseWealthDrop(this: DungeonScene, plan: WealthDropPlan, at: Step): GroundItem | null {
			switch (plan.kind) {
				case 'gold': {
					//`Item i = new Gold().random(); return i.quantity(i.quantity()/2);`
					const gold = randomGold();
					const cell = this.freeCellNear(at);
					if (!cell) return null;
					this.spawnGroundItem('gold', cell.x, cell.y, { id: 'gold', quantity: Math.max(1, Math.floor((gold.quantity ?? 0) / 2)), identified: true });
					return this.groundItemAt(cell.x, cell.y);
				}
				case 'potion':
				case 'scroll':
				case 'stone': {
					const cat = plan.kind === 'potion' ? Cat.POTION : plan.kind === 'scroll' ? Cat.SCROLL : Cat.STONE;
					const generated = randomUsingDefaults(cat);
					const cell = this.freeCellNear(at);
					if (!cell) return null;
					this.spawnGroundItem(plan.kind, cell.x, cell.y,
						sourceInventoryItem(plan.kind, generated.cls, (kind) => this.newItemInstanceId(kind)));
					return this.groundItemAt(cell.x, cell.y);
				}
				case 'bomb':
				case 'doubleBomb':
				case 'honeypot':
				case 'stoneOfEnchantment':
				case 'potionExperience':
				case 'scrollTransmutation': {
					const cell = this.freeCellNear(at);
					if (!cell) return null;
					const payload = { id: plan.kind, quantity: 1, identified: true, instanceId: this.newItemInstanceId(plan.kind) };
					this.spawnGroundItem(groundKindForItem(payload, 'food'), cell.x, cell.y, payload);
					return this.groundItemAt(cell.x, cell.y);
				}
				case 'doubled': {
					//Java: `i.quantity(i.quantity()*2)`. A payload-bearing heap doubles in place (exactly
					//Java's stack); a heap with no payload gets a second copy beside it instead.
					const spawned = this.materialiseWealthDrop(plan.inner, at);
					if (!spawned) return null;
					if (spawned.item) {
						spawned.item.quantity = (spawned.item.quantity ?? 1) * 2;
						return spawned;
					}
					const cell = this.freeCellNear(at);
					if (cell) this.spawnGroundItem(spawned.kind, cell.x, cell.y, spawned.item);
					return spawned;
				}
				case 'equip': {
					//`int floorset = (Dungeon.depth + level)/5;` then Java's five-way split
					//(`Generator.randomWeapon`/`randomArmor`, `randomUsingDefaults(RING)`, `random(ARTIFACT)`).
					const floorSet = Math.floor((this.depth + plan.level) / 5);
					const generated = plan.slot === 'weapon' ? randomWeapon(floorSet, true)
						: plan.slot === 'armor' ? randomArmor(floorSet)
							: plan.slot === 'ring' ? randomUsingDefaults(Cat.RING)
								: randomArtifact();
					if (!generated) return null;
					//`if (!w.hasGoodEnchant() && Random.Int(10) < level) w.enchant();` - Java's own
					//short-circuit, so the draw only happens for an item that rolled no enchant. This port's
					//generator rolls the concrete affix later, from `hasGoodEnchant`, so raising the flag is
					//the same outcome (a random good enchant) with the draw kept in Java's place. The
					//`else if (hasCurseEnchant()) enchant(null)` half is subsumed by the unconditional
					//un-cursing below, which Java does too.
					if (!generated.hasGoodEnchant && Random.int(10) < plan.level) generated.hasGoodEnchant = true;
					const item = this.generatedInventoryItem(generated);
					//`if (result.isUpgradable()) { int minLevel = (level+1)/2; ... }` - "minimum level is
					//1/2/3/4/5/6 when ring level is 1/3/5/7/9/11".
					const minLevel = Math.floor((plan.level + 1) / 2);
					if (isUpgradableItem(item) && (item.level ?? 0) < minLevel) item.level = minLevel;
					//`result.cursed = false; result.cursedKnown = true;` - a wealth drop is handed over
					//identified and never cursed, whatever the generator rolled.
					item.cursed = false;
					item.cursedKnown = true;
					const cell = this.freeCellNear(at);
					if (!cell) return null;
					this.spawnGroundItem(groundKindForItem(item, 'armor'), cell.x, cell.y, item);
					return this.groundItemAt(cell.x, cell.y);
				}
			}
		},

		freeCellNear(this: DungeonScene, at: Step): Step | null {
			const cells = [{ x: at.x, y: at.y }, ...Roguelike.neighbourOffsets(8).map(([dx, dy]) => ({ x: at.x + dx, y: at.y + dy }))];
			return cells.find((cell) => this.level.inside(cell.x, cell.y) && this.level.passable(cell.x, cell.y)
				&& !this.groundItemAt(cell.x, cell.y) && !this.creatureAt(cell.x, cell.y)) ?? null;
		},

		scheduleBoomerangReturn(this: DungeonScene, fromX: number, fromY: number, carried: boolean): void {
			if (!carried) return;
			//The thrown unit leaves the pile the way Java's item leaves the inventory, and comes back
			//when it lands - so a boomerang in flight cannot be thrown a second time.
			this.ammo = Math.max(0, this.ammo - 1);
			this.boomerangReturn = {
				fromX, fromY,
				returnX: this.hero.x, returnY: this.hero.y,
				left: BOOMERANG_RETURN_TURNS,
				level: this.missileLevel,
				setId: this.ammoSetId,
				depth: this.depth,
			};
		},

		tickBoomerangReturn(this: DungeonScene): void {
			const pending = this.boomerangReturn;
			if (!pending || this.depth !== pending.depth) return;
			pending.left--;
			if (pending.left > 0) return;
			this.boomerangReturn = null;
			const occupant = this.creatureAt(pending.returnX, pending.returnY);
			if (occupant && occupant.isHero) {
				//`boomerang.doPickUp(hero)`: straight back into the pile, at the durability it left
				//with (the port's `ammoDurability` already carries the hit's wear).
				this.ammo++;
				this.ammoDurability = Math.max(this.ammoDurability, 0);
				this.say(t('port.log.boomerangreturn'), 'positive');
				return;
			}
			if (occupant) {
				//`else if (returnTarget != null)`: the hero throws the returning boomerang at whoever
				//took his place. `circlingBack` is true here, so `HeavyBoomerang.adjacentAccFactor`
				//returns its flat 1.5 rather than the melee-range penalty.
				const missile = MWL_MISSILE_BY_CLASS.get(this.ammoSourceClass);
				const sharpshooting = ringSharpshootingBonus(this.effectiveRing(), this.hero.magicImmune);
				const damage = missile ? missileDamageRange(missile.sourceClass, pending.level, sharpshooting) : [1, 1] as [number, number];
				const hit = this.attack({ ...this.hero, kind: undefined, attackMode: 'throw', damage }, occupant, BOOMERANG_RETURN_ACC_FACTOR);
				if (hit) {
					const cost = this.missileDurabilityCost();
					this.ammoDurability -= cost;
					if (this.ammoDurability <= 0) {
						this.say(t('port.log.missilebroken'), 'negative');
						return;
					}
				}
			}
			//The empty-cell branch, and the survivor of the branch above: `Dungeon.level.drop(boomerang,
			//returnPos)`. The heap keeps the pile's own level and set, so the dust rule still applies.
			this.spawnGroundItem('stone', pending.returnX, pending.returnY);
			const heap = this.groundItemAt(pending.returnX, pending.returnY);
			if (heap) {
				heap.missileLevel = pending.level;
				heap.missileSet = pending.setId;
			}
		},

	/**
	 * `ScrollOfTeleportation.appear`'s white `Speck.LIGHT` burst (`Speck.java`, tag
	 * `v3.3.8`): lifespan 1, no tint, no velocity (a static sparkle), spinning at
	 * `angularSpeed = 90` degrees per second, with `update()` driving both the scale
	 * and the alpha (`am = scale`) along `p < 0.2 ? p*5 : (1-p)*1.25` - a snap up,
	 * then a shrink-out. Java staggers its 3 particles over 0.2s
	 * (`start(factory, 0.2f, 3)`); this port bursts all 3 at once, the same
	 * simplification every other burst here already makes.
	 */
	/**
	 * `Wound.hit`/`Surprise.hit` (`effects/Wound.java`, `effects/Surprise.java`,
	 * tag `v3.3.8`): a 1-second overlay centered on the struck char - the red
	 * slash for a prepared strike (`hardlight(1, 0, 0)`, `alpha = sqrt(p)`,
	 * `scale.x = 1 + p`), the `!` otherwise (`scale.y = 1 + p`, `scale.x =
	 * 1 + p/4`). Java centers on the sprite; this port centers on the cell,
	 * the same footprint at this scale. The `HIT_STRONG` sample plays here too;
	 * Java's 0.125s delay for SpiritArrow/Dart (`playDelayed`) has no seam in
	 * this port's cue system, so it plays at once like every other cue.
	 */
	showSurpriseMark(this: DungeonScene, defender: Creature, prepared: boolean): void {
		runState.audio.cue('hit_strong', 0.6);
		const sprite = new TintedSprite(effectMarkSheet(runState.sprites.effects).get(prepared ? 0 : 1));
		if (prepared) sprite.tint = 0xff0000;
		sprite.anchor.set(0.5, 0.5);
		sprite.position.set((defender.x + 0.5) * TILE, (defender.y + 0.5) * TILE);
		this.effectLayer.addChild(sprite);
		this.surpriseMarks.push({ sprite, remaining: 1, total: 1, wound: prepared });
	},

	updateSurpriseMarks(this: DungeonScene, dt: number): void {
		for (let i = this.surpriseMarks.length - 1; i >= 0; i--) {
			const mark = this.surpriseMarks[i]!;
			mark.remaining -= dt;
			if (mark.remaining <= 0) {
				mark.sprite.destroy();
				this.surpriseMarks.splice(i, 1);
				continue;
			}
			const p = mark.remaining / mark.total;
			mark.sprite.alpha = Math.sqrt(p);
			if (mark.wound) mark.sprite.scale.x = 1 + p;
			else {
				mark.sprite.scale.y = 1 + p;
				mark.sprite.scale.x = 1 + p / 4;
			}
		}
	},

	//Burst constructors live in `ui/effectBursts.ts` (the file-size refactor's
	//forty-eighth extraction) - this stays a one-line binder for the teleport
	//plan's two call sites.
	burstTeleportLight(this: DungeonScene, cell: Step): void {
		spawnTeleportBurst(this.effectLayer, this.effectBursts, cell.x, cell.y);
	},

	/**
	 * `ScrollOfTeleportation.appear(ch, pos)` presentation (`items/scrolls/
	 * ScrollOfTeleportation.java`, tag `v3.3.8`), shared by every random teleport
	 * in the game - the scroll, Fadeleaf, the Displacing/Displacement curses,
	 * Lloyd's Beacon's zap, Blink, Golem's enemy teleport and the Necromancer's
	 * skeleton recall all funnel through this one Java method for their visuals.
	 * The TELEPORT sample plays when either endpoint is in the hero's FOV; the old
	 * cell bursts only for a visible non-hero departure; the sprite fades 0 to 1
	 * over 0.4s (`AlphaTweener`) unless the traveller is invisible; the new cell
	 * bursts when visible, or always for the hero (whose own arrival is followed).
	 * The camera-follow release (`Camera.panFollow`) has no counterpart - this
	 * port's camera never follows a non-hero creature.
	 */
	playTeleportAppear(this: DungeonScene, from: Step, to: Step, entity: Creature): void {
		const plan = teleportAppearPlan(
			this.fov.isVisible(from.x, from.y),
			this.fov.isVisible(to.x, to.y),
			entity.isHero ?? false,
			entity.buffs['invisibility'] !== undefined,
		);
		if (plan.sound) runState.audio.cue('teleport', 0.7);
		if (plan.burstFrom) this.burstTeleportLight(from);
		if (plan.fade) {
			const sprite = this.spriteFor.get(entity.id);
			if (sprite) {
				sprite.alpha = 0;
				this.teleportFades.push({ sprite, remaining: 0.4, total: 0.4 });
			}
		}
		if (plan.burstTo) this.burstTeleportLight(to);
	},

	//Same binder arrangement as `burstTeleportLight` above: the constructor lives
	//in `ui/effectBursts.ts`, and this keeps the name the curse-infusion context
	//calls (five motes at the hero's cell).
	burstShadowUp(this: DungeonScene, cell: Step): void {
		spawnShadowBurst(this.effectLayer, this.effectBursts, cell.x, cell.y, 5);
	},

	/**
	 * Plays one-shot monster death/zap bursts from `simulation/deathBursts.ts`
	 * (the file-size refactor's forty-seventh extraction - the spec table and
	 * its Java counts/colors live there, the scene only binds the emitter
	 * layer, the FOV gate and the audio cue). Gated on hero FOV the way the
	 * teleport bursts are: Java always emits but its camera culls off-screen
	 * sprites, so an unseen cell bursting here would be a sound from nowhere.
	 */
	playDeathBursts(this: DungeonScene, specs: DeathBurstSpec[], x: number, y: number): void {
		if (!this.fov.isVisible(x, y)) return;
		spawnDeathBursts(this.effectLayer, this.effectBursts, specs, x, y, (name) => runState.audio.cue(name, 0.7));
	},

	updateTeleportFades(this: DungeonScene, dt: number): void {
		for (let i = this.teleportFades.length - 1; i >= 0; i--) {
			const fade = this.teleportFades[i]!;
			fade.remaining -= dt;
			if (fade.remaining > 0) {
				fade.sprite.alpha = 1 - fade.remaining / fade.total;
				continue;
			}
			fade.sprite.alpha = 1;
			this.teleportFades.splice(i, 1);
		}
	},

	updateEffectBursts(this: DungeonScene, dt: number): void {
			for (let i = this.effectBursts.length - 1; i >= 0; i--) {
				const burst = this.effectBursts[i]!;
				burst.remaining -= dt;
				if (burst.remaining > 0) continue;
				burst.emitter.destroy();
				this.effectBursts.splice(i, 1);
			}
		},

		applyMissileClassProc(this: DungeonScene, target: Creature): void {
			if (this.ammoSourceClass === 'Bolas') {
				addBuff(target, 'cripple', bolasCrippleTurns());
			} else if (this.ammoSourceClass === 'Tomahawk') {
				const level = this.missileLevel + ringSharpshootingBonus(this.effectiveRing(), this.hero.magicImmune);
				const [min, max] = tomahawkBleedRange(level);
				const bleed = Random.normalRange(min, max);
				if (bleed > (target.buffs['bleeding'] ?? 0)) target.buffs['bleeding'] = bleed;
			} else if (this.ammoSourceClass === 'TippedDart') {
				this.applyTippedDartEffect(target, this.ammoTippedSeed);
			}
		},

		/**
		 * `TippedDart` on-hit (`items/weapon/missiles/darts/*.java`, tag `v3.3.8`): the tip's own
		 * effect, resolved from the wielded pile's seed (`TIPPED_DART_BY_SEED`). Effect *shapes*
		 * are each dart desc's own (blind, burst flames, chill, poison, paralyze, teleport,
		 * corrosion, bless-or-smite, shock, heal, cleanse, slow); buff *durations* and the
		 * healing/shock/corrosion magnitudes are this port's own numbers where Java's exact
		 * values are not reproduced here (stated simplification - the descs say "short time"
		 * without numbers). Ally-only halves (adrenaline haste, cleansing immunity, healing
		 * allies, holy blessing) have no expression: throws target enemies, never allies.
		 */
		applyTippedDartEffect(this: DungeonScene, target: Creature, seedClass: string | undefined): void {
			const seed = (seedClass ?? '').toLowerCase();
			switch (seed) {
				case 'blindweed':
					addBuff(target, 'daze', 3);
					target.seesHero = false;
					break;
				case 'firebloom':
					this.fire.seed(target.x, target.y, 2);
					break;
				case 'icecap':
					addBuff(target, 'chill', 4);
					break;
				case 'sorrowmoss':
					reigniteBuff(target, 'poison', 5 + Math.round(2 * this.depth / 3));
					break;
				case 'earthroot':
					addBuff(target, 'paralysis', 3);
					break;
				case 'fadeleaf': {
					const destination = this.randomFreeCell(target);
					if (destination) {
						target.x = destination.x;
						target.y = destination.y;
						this.sprite(target).position.set(destination.x * TILE, destination.y * TILE);
					}
					break;
				}
				case 'rotberry':
					target.corrosionTurns = Math.max(target.corrosionTurns ?? 0, 3);
					target.corrosionDamage = Math.max(target.corrosionDamage ?? 0, 4 + Math.floor(this.depth / 2));
					break;
				case 'starflower':
					if (isUndeadOrDemonic(target.kind)) {
						const smite = Math.round(target.maxHp * 0.25);
						target.hp -= smite;
						this.showDamage(target, smite);
						if (target.hp <= 0) this.kill(target);
					} else addBuff(target, 'bless', 5);
					break;
				case 'stormvine':
					addBuff(target, 'daze', 3);
					break;
				case 'sungrass':
					target.hp = Math.min(target.maxHp, target.hp + 10 + this.missileLevel * 2);
					this.showHeal(target, 10 + this.missileLevel * 2);
					break;
				case 'mageroyal':
					for (const buff of ['bless', 'haste', 'adrenalineSurge', 'fury', 'berserk'] as BuffId[]) delete target.buffs[buff];
					target.seesHero = false;
					break;
				case 'swiftthistle':
					addBuff(target, 'cripple', 3);
					break;
				default:
					break;
			}
		},

		detachSeal(this: DungeonScene): void {
			if (!this.armorSealed) return;
			this.armorSealed = false;
			this.bag.add({ id: 'brokenSeal', quantity: 1, identified: true });
			this.say(t('items.armor.armor.detach_seal'));
			this.syncHeroFromStats();
			this.refreshInventoryPanel();
		},

		randomPetalCell(this: DungeonScene): Step | null {
			for (let attempt = 0; attempt < 100; attempt++) {
				const at = { x: SpdRandom.int(this.level.width), y: SpdRandom.int(this.level.height) };
				if (![FLOOR, GRASS, HIGH_GRASS].includes(this.level.get(at.x, at.y))) continue;
				if (this.creatureAt(at.x, at.y) || this.groundItemAt(at.x, at.y)) continue;
				if (at.x === this.hero.x && at.y === this.hero.y) continue;
				if (this.hasStairs && at.x === this.stairs.x && at.y === this.stairs.y) continue;
				return at;
			}
			return null;
		},

		collectRosePetal(this: DungeonScene): 'no_rose' | 'no_room' | 'levelup' | 'maxlevel' {
			const rose = this.roseItem();
			const outcome = rosePetalPickup(rose);
			if (outcome === 'no_rose' || !rose) {
				this.say(t('items.artifacts.driedrose$petal.no_rose'), 'warning');
				return 'no_rose';
			}
			if (outcome === 'no_room') {
				this.say(t('items.artifacts.driedrose$petal.no_room'), 'info');
				return outcome;
			}
			rose.level = (rose.level ?? 0) + 1;
			const ghost = this.roseGhost;
			if (ghost && ghost.hp > 0) {
				ghost.maxHp = roseGhostMaxHp(rose.level);
				ghost.hp = Math.min(ghost.hp + 8, ghost.maxHp);
			}
			this.say(t(outcome === 'maxlevel' ? 'items.artifacts.driedrose$petal.maxlevel' : 'items.artifacts.driedrose$petal.levelup'),
				outcome === 'maxlevel' ? 'positive' : 'info');
			return outcome;
		},

		placeRosePetals(this: DungeonScene): void {
			SpdRandom.pushGenerator(SpdRandom.long());
			try {
				const rose = this.roseItem();
				if (!rose || rose.identified === false || rose.cursed) return;
				if (this.quests.status('sadGhost') !== 'complete') return;
				const needed = rosePetalsNeeded(this.depth, rose.droppedPetals ?? 0);
				for (let i = 1; i <= needed; i++) {
					if ((rose.droppedPetals ?? 0) >= rosePetalDropCap()) break;
					const at = this.randomPetalCell();
					if (!at) break;
					this.spawnGroundItem('petal', at.x, at.y);
					if (this.level.get(at.x, at.y) === HIGH_GRASS) this.level.set(at.x, at.y, GRASS);
					rose.droppedPetals = (rose.droppedPetals ?? 0) + 1;
				}
			} finally {
				SpdRandom.popGenerator();
			}
		},

	consumableContext(this: DungeonScene): ConsumableContext {
		const scene = this;
		return {
			bag: this.bag,
			hero: this.hero,
			heroClass: this.heroClass,
			get requestedItemId() { return scene.requestedItemId; },
			get requestedItemInstanceId() { return scene.requestedItemInstanceId; },
			get hunger() { return scene.hunger; }, set hunger(value) { scene.hunger = value; },
			get waterskin() { return scene.waterskin; }, set waterskin(value) { scene.waterskin = value; },
			get ammo() { return scene.ammo; }, set ammo(value) { scene.ammo = value; },
			get freeTurnNext() { return scene.freeTurnNext; }, set freeTurnNext(value) { scene.freeTurnNext = value; },
			get wandBonusDamage() { return scene.wandBonusDamage; }, set wandBonusDamage(value) { scene.wandBonusDamage = value; },
			get physicalBonusDamage() { return scene.physicalBonusDamage; }, set physicalBonusDamage(value) { scene.physicalBonusDamage = value; },
			get physicalBonusAttacks() { return scene.physicalBonusAttacks; }, set physicalBonusAttacks(value) { scene.physicalBonusAttacks = value; },
			heroBarrier: this.heroBarrier,
			subclass: this.subclass.bind(this),
			talentRank: this.talentRank.bind(this),
			grantHeroShield: (amount: number, cap: number) => { scene.grantHeroShield(amount, cap); },
			wandCharges: this.wandCharges,
			showHeal: this.showHeal.bind(this),
			say: this.say.bind(this),
			applyPotionEffect: this.applyPotionEffect.bind(this),
		};
	},

	candleContext(this: DungeonScene): CandleContext {
		return {
			bag: this.bag,
			ritualPos: this.ritualPos,
			level: this.level,
			hero: this.hero,
			ritualCandles: this.ritualCandles,
			isChasmCell: this.isChasmCell.bind(this),
			creatureAt: this.creatureAt.bind(this),
			spawnNewbornElemental: (at) => this.spawnMonster('newbornElemental', at),
			say: this.say.bind(this),
		};
	},

	bombContext(this: DungeonScene, target?: Step): BombContext {
		return {
			bag: this.bag,
			level: this.level,
			isChasmCell: this.isChasmCell.bind(this),
			groundItemAt: this.groundItemAt.bind(this),
			nearestVisibleEnemy: this.nearestVisibleEnemy.bind(this),
			target,
			spawnLitBomb: (bombId, at) => this.spawnGroundItem('bomb', at.x, at.y, {
				id: bombId, quantity: 1, identified: true, sourceClass: bombId, fuseTurns: 2,
			}),
			say: this.say.bind(this),
		};
	},

	stoneContext(this: DungeonScene): StoneContext {
		const scene = this;
		return {
			bag: this.bag,
			hero: this.hero,
			level: this.level,
			creatureAt: this.creatureAt.bind(this),
			nearestVisibleEnemy: this.nearestVisibleEnemy.bind(this),
			isChasmCell: this.isChasmCell.bind(this),
			//`StoneOfFlock`: every sheep gets `initialize(8)`.
			spawnSheep: (at) => this.spawnSheep(at, 8),
			beginAiming: this.beginAiming.bind(this),
			openAugmentChoice: () => { this.augmentChoiceOpen = true; this.talentOpen = true; this.refreshTalentPanel(); },
			moveHero: (target) => this.moveTo(this.hero, target),
			playTeleportAppear: (from, to, entity) => this.playTeleportAppear(from, to, entity),
			revealClairvoyance: (center, distance) => {
				for (let y = Math.max(0, center.y - distance); y <= Math.min(this.level.height - 1, center.y + distance); y++) {
					for (let x = Math.max(0, center.x - distance); x <= Math.min(this.level.width - 1, center.x + distance); x++) {
						if (Roguelike.chebyshevDistance(center, { x, y }) > distance) continue;
						this.fov.explored.add(this.level.index(x, y));
						if (this.secrets.isSecret(x, y)) this.secrets.discover(x, y);
					}
				}
				this.restitchAllTiles();
			},
			creatures: this.creatures,
			depth: this.depth,
			wandCharges: this.wandCharges,
			absorbHeroDamage: this.absorbHeroDamage.bind(this),
			showDamage: this.showDamage.bind(this),
			isFlammableTerrain: (x, y) => this.isFireFlammableTerrain(x, y),
			burnFlammableTerrain: (x, y) => this.destroyBombTerrain(x, y),
			explodeGroundItem: (x, y) => {
				const ground = this.groundItemAt(x, y);
				if (!ground) return false;
				if (ground.kind === 'bomb' && ground.item) {
					return this.detonateGroundBomb(ground, new Set());
				}
				const protectedItem = ['armor', 'wand', 'ring', 'amulet', 'ankh', 'stylus'].includes(ground.kind);
				if (!protectedItem) this.removeGroundItem(ground);
				return false;
			},
			kill: (target) => this.kill(target, 'fire'),
			openItemPicker: (title, items, onPick) => this.openItemPicker(title, items, (entry) => onPick({ ...entry, quantity: 1 })),
			rollAffix: (kind) => rollGeneratedAffix(kind === 'weapon' ? ENCHANT_TABLE : GLYPH_TABLE, false, true),
			curseOf: (affix) => getCurse(affix)?.id,
			identify: (item) => Actors.identify(item),
			potionKinds: Object.keys(POTION_CLASS_BY_PORT_ID).filter((id) => id !== 'potion'),
			scrollKinds: APPEARANCE_TABLES.scroll.kinds.filter((id) => id !== 'scroll'),
			ringKinds: Object.keys(RING_DEFS).map((id) => `ring_${id}`),
			get intuitionTracker() { return scene.intuitionTracker; },
			set intuitionTracker(value) { scene.intuitionTracker = value; },
			say: this.say.bind(this),
		};
	},

	applyPotionEffect(this: DungeonScene, id: string): void {
		const effect = this.potionEffects[id];
		if (effect) effect();
		else {
			// Keep unknown generated ids observable instead of silently consuming them as a
			// different item. The known fallback remains PotionOfPurity's effect.
			console.warn(`quaffPotion: unrecognized potion id "${id}", treating as Purity`);
			this.applyPotionPurity();
		}
	},

	/** `AlchemicalCatalyst.apply()` / `ArcaneCatalyst.onCast()` (tag `v3.3.8`): consume one
	 * catalyst and invoke a weighted regular potion or scroll effect. Exotic classes, the
	 * no-healing challenge reroll, and the catalyst-specific animations are not represented by
	 * this port's catalogue/presentation layer; the weighted effect selection is retained. */
	useAlchemicalCatalyst(this: DungeonScene, instanceId?: string): void {
		if (!this.bag.find('alchemicalCatalyst', instanceId)) return;
		this.bag.remove('alchemicalCatalyst', 1, instanceId);
		this.applyPotionEffect(randomAlchemicalPotion());
	},

	useArcaneCatalyst(this: DungeonScene, instanceId?: string): void {
		if (!this.bag.find('arcaneCatalyst', instanceId)) return;
		this.bag.remove('arcaneCatalyst', 1, instanceId);
		applyScrollEffect(randomArcaneScroll(), this.scrollEffectsContext());
	},

	// ------------------------------------------------------------------ armor abilities
	// `ClassArmor.execute()`'s `AC_ABILITY` action and the abilities it dispatches to. The data
	// (which class owns which ability, its real `baseChargeUse`, its targeting mode, its four
	// tier-4 talents) lives in `src/content/talent-rules.mwl` and `src/armorAbilities.ts`; the
	// Warrior's arithmetic lives in `src/simulation/warriorAbilities.ts`.

	/** `ArmorAbility.chargeUse(hero)`, plus `HeroicLeap`'s own `DOUBLE_JUMP` discount while its
	 *  tracker is up and `SpiritHawk`'s own zero while the hawk is already out. */
	armorAbilityCost(this: DungeonScene, def: ArmorAbilityDef): number {
		return armorChargeUse(def, {
			heroicEnergyRank: this.talentRank('heroic_energy'),
			doubleJumpArmed: this.doubleJumpTurns > 0,
			doubleJumpRank: this.talentRank('double_jump'),
			doubleMarkArmed: this.doubleMarkArmed,
			doubleMarkRank: this.talentRank('double_mark'),
			shadowStepArmed: this.hero.buffs['invisibility'] !== undefined,
			shadowStepRank: this.talentRank('shadow_step'),
			hawkSummoned: this.spiritHawk() !== undefined,
			cloneSummoned: this.shadowClone() !== undefined,
			eliminationMatchArmed: this.hero.buffs['eliminationMatch'] !== undefined,
			eliminationMatchRank: this.talentRank('elimination_match'),
		});
	},

	/** The ability button's label: SPD's own ability name, with the armor's charge percent - the
	 *  same information Java shows as the class armor's quickslot status (`ClassArmor.status()`). */
	armorAbilityLabel(this: DungeonScene): string | null {
		if (!this.armorAbility) return null;
		const def = armorAbilityDef(this.armorAbility);
		if (!def) return null;
		return `${titleCase(t(`${armorAbilityKey(def.id, def.classId)}.name`))} ${Math.floor(this.armorCharge)}%`;
	},

	/** The toolbar's four quickslot states - the decision lives in `items/itemActions.ts`
	 * next to the item-use router they feed; the scene only binds its slot array, bag
	 * and use path. */
	quickslotStates(this: DungeonScene): ({ id: string; instanceId?: string; frame: number; quantity: number } | null)[] {
		return readQuickslotStates(this.quickslotContext());
	},

	assignQuickslot(this: DungeonScene, id: string, instanceId?: string): void {
		assignFamilyQuickslot(this.quickslotContext(), id, instanceId);
	},

	useQuickslot(this: DungeonScene, slot: number): void {
		useQuickslotEntry(this.quickslotContext(), slot);
	},

	quickslotContext(this: DungeonScene): QuickslotContext {
		return {
			slots: this.quickslots,
			findHeld: (id, instanceId) => this.bag.find(id, instanceId),
			useItem: (id, instanceId) => this.useItemById(id, instanceId),
		};
	},
};
