import { SPECIALTY_BOMB_IDS } from './itemKinds';

/** Scene services exposed to the item-action router. Item classification and routing belong to
 * the item domain; the scene remains responsible for turn state and effect implementations. */
export interface ItemActionContext {
	readonly awaitingInput: boolean;
	setRequestedItem(id: string | null, instanceId?: string): void;
	onAction(action: string): boolean;
	equipRing(id: string, instanceId?: string): void;
	equipArmor(id: string, instanceId?: string): void;
	equipWeapon(id: string, instanceId?: string): void;
	equipWand(): void;
	mineWithPickaxe(): void;
	plantSeed(): void;
	useHourglass(instanceId?: string): void;
	useCloak(instanceId?: string): void;
	useChalice(instanceId?: string): void;
	useStoneById(id: string, instanceId?: string): void;
	useCandle(instanceId?: string): void;
	useBomb(id: string, instanceId?: string): void;
	useStylus(instanceId?: string): void;
	useAlchemize(instanceId?: string): void;
	useKingsCrown(instanceId?: string): void;
	useFeatherFall(instanceId?: string): void;
	useWildEnergy(instanceId?: string): void;
	useTelekineticGrab(instanceId?: string): void;
	usePhaseShift(instanceId?: string): void;
	useSummonElemental(instanceId?: string): void;
	useReclaimTrap(instanceId?: string): void;
	useRecycle(instanceId?: string): void;
	useCurseInfusion(instanceId?: string): void;
	useMagicalInfusion(instanceId?: string): void;
	useBeaconOfReturning(instanceId?: string): void;
	useAlchemicalCatalyst(instanceId?: string): void;
	useArcaneCatalyst(instanceId?: string): void;
}

export function useItemById(scene: ItemActionContext, id: string, instanceId?: string): void {
	if (!scene.awaitingInput) return;
	scene.setRequestedItem(id, instanceId);
	try {
		// `Food.execute(AC_EAT)` covers every Food subclass in Java, including the alchemy
		// outputs StewedMeat and MeatPie; this port resolves their shared hunger transaction
		// through `eatFood()` rather than maintaining one action branch per food class.
		if (id === 'food' || id === 'meat' || id === 'chargrilledMeat' || id === 'stewedMeat' || id === 'meatPie' || id === 'pasty') scene.onAction('eat');
		else if (id === 'waterskin' || id.startsWith('potion')) scene.onAction('quaff');
		else if (id.startsWith('scroll')) scene.onAction(id === 'scrollUpgrade' ? 'upgrade' : 'read');
		else if (id.startsWith('ring_')) scene.equipRing(id, instanceId);
		else if (id === 'clothArmor' || id === 'armor' || id === 'armorReward') scene.equipArmor(id, instanceId);
		else if (id === 'weaponReward') scene.equipWeapon(id, instanceId);
		else if (id === 'wand') scene.equipWand();
		else if (id === 'pickaxe') scene.mineWithPickaxe();
		else if (id === 'seed') scene.plantSeed();
		else if (id === 'hourglass') scene.useHourglass(instanceId);
		else if (id === 'cloak') scene.useCloak(instanceId);
		else if (id === 'chalice') scene.useChalice(instanceId);
		else if (id.startsWith('stoneOf')) scene.useStoneById(id, instanceId);
		else if (id === 'candle') scene.useCandle(instanceId);
		else if (id === 'bomb' || SPECIALTY_BOMB_IDS.has(id)) scene.useBomb(id, instanceId);
		else if (id === 'stylus') scene.useStylus(instanceId);
		else if (id === 'alchemize') scene.useAlchemize(instanceId);
		else if (id === 'kingsCrown') scene.useKingsCrown(instanceId);
		else if (id === 'featherFall') scene.useFeatherFall(instanceId);
		else if (id === 'wildEnergy') scene.useWildEnergy(instanceId);
		else if (id === 'telekineticGrab') scene.useTelekineticGrab(instanceId);
		else if (id === 'phaseShift') scene.usePhaseShift(instanceId);
		else if (id === 'summonElemental') scene.useSummonElemental(instanceId);
		else if (id === 'reclaimTrap') scene.useReclaimTrap(instanceId);
		else if (id === 'recycle') scene.useRecycle(instanceId);
		else if (id === 'curseInfusion') scene.useCurseInfusion(instanceId);
		else if (id === 'magicalInfusion') scene.useMagicalInfusion(instanceId);
		else if (id === 'beaconOfReturning') scene.useBeaconOfReturning(instanceId);
		else if (id === 'alchemicalCatalyst') scene.useAlchemicalCatalyst(instanceId);
		else if (id === 'arcaneCatalyst') scene.useArcaneCatalyst(instanceId);
	} finally {
		scene.setRequestedItem(null);
	}
}
