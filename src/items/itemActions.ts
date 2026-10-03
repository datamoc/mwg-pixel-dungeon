import { SPECIALTY_BOMB_IDS } from './itemKinds';
import { isClassArmorId } from './catalog';
import { isBagId, type BagId } from './bags';
import { CAN_CHOOSE_THROW_FRUIT_POTION_IDS, DEFAULT_THROW_FRUIT_POTION_IDS } from './blandfruit';

/** Scene services exposed to the item-action router. Item classification and routing belong to
 * the item domain; the scene remains responsible for turn state and effect implementations. */
export interface ItemActionContext {
	readonly awaitingInput: boolean;
	findHeld(id: string, instanceId?: string): { potionAttrib?: string } | undefined;
	throwBagItem(id: string, instanceId?: string): void;
	chooseFruitAction(id: string, instanceId?: string): void;
	setRequestedItem(id: string | null, instanceId?: string): void;
	onAction(action: string): boolean;
	equipRing(id: string, instanceId?: string): void;
	equipArmor(id: string, instanceId?: string): void;
	transferClassArmor(id: string, instanceId?: string): void;
	equipWeapon(id: string, instanceId?: string): void;
	equipWand(instanceId?: string): void;
	chooseWandUse(instanceId?: string): void;
	mineWithPickaxe(): void;
	/** `ShardOfOblivion.AC_IDENTIFY` (the trinket's default action). */
	useShardOfOblivion(): void;
	plantSeed(): void;
	useHourglass(instanceId?: string): void;
	useCloak(instanceId?: string): void;
	useChalice(instanceId?: string): void;
	useToolkit(instanceId?: string): void;
	useRose(instanceId?: string): void;
	useChains(instanceId?: string): void;
	useHorn(instanceId?: string): void;
	useBeaconArtifact(instanceId?: string): void;
	useArmband(instanceId?: string): void;
	useSandals(instanceId?: string): void;
	useTalisman(instanceId?: string): void;
	useSkeletonKey(instanceId?: string): void;
	useSpellbook(instanceId?: string): void;
	useHolyTome(instanceId?: string): void;
	wieldMissile(id: string, instanceId?: string): void;
	useStoneById(id: string, instanceId?: string): void;
	useCandle(instanceId?: string): void;
	useTorch(instanceId?: string): void;
	useAnkh(instanceId?: string): void;
	useBomb(id: string, instanceId?: string): void;
	useHoneypot(instanceId?: string): void;
	useBrew(id: string, instanceId?: string): void;
	useUnstableBrew(instanceId?: string): void;
	useStylus(instanceId?: string): void;
	useBrokenSeal(instanceId?: string): void;
	useAlchemize(instanceId?: string): void;
	useKingsCrown(instanceId?: string): void;
	useTengusMask(instanceId?: string): void;
	useFeatherFall(instanceId?: string): void;
	useWildEnergy(instanceId?: string): void;
	useUnstableSpell(instanceId?: string): void;
	useTelekineticGrab(instanceId?: string): void;
	usePhaseShift(instanceId?: string): void;
	useSummonElemental(instanceId?: string): void;
	useReclaimTrap(instanceId?: string): void;
	useRecycle(instanceId?: string): void;
	useCurseInfusion(instanceId?: string): void;
	useMagicalInfusion(instanceId?: string): void;
	useBeaconOfReturning(instanceId?: string): void;
	openBag(bag: BagId): void;
}

/** `QuickSlot.SIZE` (`QuickSlot.java`, tag `v3.3.8`): six manual slots. Java notes the
 * cap is a UI constraint, not a model one - the same holds here. */
export const QUICKSLOT_SIZE = 6;

/** One toolbar quickslot assignment: the item id plus its bag instance. The scene owns
 * the six-slot array; this module only reads and writes entries through the context. */
export interface QuickslotEntry {
	id: string;
	instanceId?: string;
}

/** A quickslot's live toolbar state: the assignment plus its current bag quantity.
 * A departed item keeps its assignment as a placeholder (`quantity: 0`, the way Java's
 * `QuickSlot.isPlaceholder` keeps a zero-quantity entry) so the slot re-links when the
 * item returns; only an explicit clear (or a use of the empty slot) drops it. */
export interface QuickslotState extends QuickslotEntry {
	frame: number;
	quantity: number;
}

/** Scene services behind the quickslot set: the live slot array (mutated in place),
 * the bag lookup, the sprite frame an id draws with, and the ordinary item-use path
 * a slot fires through. */
export interface QuickslotContext {
	slots: (QuickslotEntry | null)[];
	findHeld: (id: string, instanceId?: string) => { instanceId?: string; quantity: number } | undefined;
	itemFrame: (id: string) => number;
	useItem: (id: string, instanceId?: string) => void;
}

/** The toolbar's six quickslot states: the assigned item's live quantity (or a
 * zero-quantity placeholder when the assignment left the bag). */
export function readQuickslotStates(ctx: QuickslotContext): (QuickslotState | null)[] {
	return Array.from({ length: QUICKSLOT_SIZE }, (_, slot) => {
		const assigned = ctx.slots[slot];
		if (!assigned) return null;
		const held = ctx.findHeld(assigned.id, assigned.instanceId);
		if (!held || held.quantity <= 0) {
			return { id: assigned.id, instanceId: assigned.instanceId, frame: ctx.itemFrame(assigned.id), quantity: 0 };
		}
		return { id: assigned.id, instanceId: held.instanceId, frame: ctx.itemFrame(assigned.id), quantity: held.quantity };
	});
}

/** Puts an item in one exact slot (the slot long-press picker), replacing whatever was there. */
export function setQuickslotSlot(ctx: QuickslotContext, slot: number, id: string, instanceId?: string): void {
	if (slot < 0 || slot >= QUICKSLOT_SIZE) return;
	ctx.slots[slot] = { id, instanceId };
}

/** Drops a slot's assignment entirely. */
export function clearQuickslotSlot(ctx: QuickslotContext, slot: number): void {
	if (slot < 0 || slot >= QUICKSLOT_SIZE) return;
	ctx.slots[slot] = null;
}

/** Assigns an item to a free slot (the inventory long-press): refreshes the slot when the
 * same id is already quickslotted, otherwise takes the first empty one. Returns the slot
 * index, or -1 when every slot is taken. */
export function assignQuickslotToFree(ctx: QuickslotContext, id: string, instanceId?: string): number {
	const existing = ctx.slots.findIndex((slot) => slot?.id === id);
	if (existing >= 0) {
		ctx.slots[existing] = { id, instanceId };
		return existing;
	}
	const free = ctx.slots.findIndex((slot) => slot === null);
	if (free < 0) return -1;
	ctx.slots[free] = { id, instanceId };
	return free;
}

/** Uses a quickslot's assigned item through the ordinary item-use path. A placeholder
 * (departed item) clears itself instead of firing. */
export function useQuickslot(ctx: QuickslotContext, slot: number): void {
	if (slot < 0 || slot >= QUICKSLOT_SIZE) return;
	const assigned = ctx.slots[slot];
	if (!assigned) return;
	const held = ctx.findHeld(assigned.id, assigned.instanceId);
	if (!held || held.quantity <= 0) {
		ctx.slots[slot] = null;
		return;
	}
	ctx.useItem(assigned.id, assigned.instanceId);
}

export function useItemById(scene: ItemActionContext, id: string, instanceId?: string): void {
	//Deliberate standing guard: an item action arriving while the scene is mid-transition
	//(descend, death, a window that took input away) is dropped silently rather than running
	//against half-built state. Java has no router seam like this - its `Item.execute` runs
	//whenever a window button fires - so a click that lands in that window here loses the
	//action with no log line; noted as a known reduction rather than redesigned (the guard
	//prevents real corruption, and the transition windows accept no input in practice).
	if (!scene.awaitingInput) return;
	scene.setRequestedItem(id, instanceId);
	try {
		// `Food.execute(AC_EAT)` covers every Food subclass in Java, including the alchemy
		// outputs StewedMeat and MeatPie; this port resolves their shared hunger transaction
		// through `eatFood()` rather than maintaining one action branch per food class.
		if (id === 'blandfruit') {
			// `Blandfruit.defaultAction()` delegates to its anonymous potion. Java's anonymous
			// potion reports known, so must-throw attribs default to AC_THROW; their chosen
			// unit must reach the same throw seam as a manual item-window action.
			const potion = scene.findHeld(id, instanceId)?.potionAttrib;
			if (potion && DEFAULT_THROW_FRUIT_POTION_IDS.has(potion)) scene.throwBagItem(id, instanceId);
			else if (potion && CAN_CHOOSE_THROW_FRUIT_POTION_IDS.has(potion)) scene.chooseFruitAction(id, instanceId);
			else scene.onAction('eat');
		}
		else if (id === 'food' || id === 'smallRation' || id === 'berry' || id === 'supplyRation' || id === 'phantomMeat' || id === 'meat' || id === 'chargrilledMeat' || id === 'frozenCarpaccio' || id === 'stewedMeat' || id === 'meatPie' || id === 'pasty' || id === 'chunks') scene.onAction('eat');
		else if (id === 'waterskin' || id.startsWith('potion') || id === 'elixirAquaticRejuvenation') scene.onAction('quaff');
		else if (id.startsWith('scroll')) scene.onAction(id === 'scrollUpgrade' ? 'upgrade' : 'read');
		else if (id.startsWith('ring_')) scene.equipRing(id, instanceId);
		else if (isClassArmorId(id)) scene.transferClassArmor(id, instanceId);
		else if (id === 'clothArmor' || id === 'armor' || id === 'armorReward') scene.equipArmor(id, instanceId);
		else if (id === 'weaponReward') scene.equipWeapon(id, instanceId);
		else if (id === 'wand') scene.chooseWandUse(instanceId);
		else if (id === 'trinketShardOfOblivion') scene.useShardOfOblivion();
		else if (id === 'pickaxe') scene.mineWithPickaxe();
		else if (id === 'seed') scene.plantSeed();
		else if (id === 'hourglass') scene.useHourglass(instanceId);
		else if (id === 'cloak') scene.useCloak(instanceId);
		else if (id === 'chalice') scene.useChalice(instanceId);
		else if (id === 'toolkit') scene.useToolkit(instanceId);
		else if (id === 'rose') scene.useRose(instanceId);
		else if (id === 'chains') scene.useChains(instanceId);
		else if (id === 'horn') scene.useHorn(instanceId);
		else if (id === 'beacon') scene.useBeaconArtifact(instanceId);
		else if (id === 'armband') scene.useArmband(instanceId);
		else if (id === 'sandals') scene.useSandals(instanceId);
		else if (id === 'talisman') scene.useTalisman(instanceId);
		else if (id === 'skeletonkey') scene.useSkeletonKey(instanceId);
		else if (id === 'spellbook') scene.useSpellbook(instanceId);
		else if (id === 'holyTome') scene.useHolyTome(instanceId);
		else if (id.startsWith('missile_')) scene.wieldMissile(id, instanceId);
		else if (id.startsWith('stoneOf')) scene.useStoneById(id, instanceId);
		else if (id === 'candle') scene.useCandle(instanceId);
		else if (id === 'torch') scene.useTorch(instanceId);
		else if (id === 'ankh') scene.useAnkh(instanceId);
		else if (id === 'bomb' || SPECIALTY_BOMB_IDS.has(id)) scene.useBomb(id, instanceId);
		else if (id === 'honeypot') scene.useHoneypot(instanceId);
		else if (id === 'shockingBrew' || id === 'causticBrew' || id === 'infernalBrew' || id === 'blizzardBrew') scene.useBrew(id, instanceId);
		else if (id === 'unstableBrew') scene.useUnstableBrew(instanceId);
		else if (id === 'stylus') scene.useStylus(instanceId);
		else if (id === 'brokenSeal') scene.useBrokenSeal(instanceId);
		else if (id === 'alchemize') scene.useAlchemize(instanceId);
		else if (id === 'kingsCrown') scene.useKingsCrown(instanceId);
		else if (id === 'tengusMask') scene.useTengusMask(instanceId);
		else if (id === 'featherFall') scene.useFeatherFall(instanceId);
		else if (id === 'wildEnergy') scene.useWildEnergy(instanceId);
		else if (id === 'unstableSpell') scene.useUnstableSpell(instanceId);
		else if (id === 'telekineticGrab') scene.useTelekineticGrab(instanceId);
		else if (id === 'phaseShift') scene.usePhaseShift(instanceId);
		else if (id === 'summonElemental') scene.useSummonElemental(instanceId);
		else if (id === 'reclaimTrap') scene.useReclaimTrap(instanceId);
		else if (id === 'recycle') scene.useRecycle(instanceId);
		else if (id === 'curseInfusion') scene.useCurseInfusion(instanceId);
		else if (id === 'magicalInfusion') scene.useMagicalInfusion(instanceId);
		else if (id === 'beaconOfReturning') scene.useBeaconOfReturning(instanceId);
		else if (isBagId(id)) scene.openBag(id);
	} finally {
		scene.setRequestedItem(null);
	}
}
