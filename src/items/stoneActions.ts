export interface StoneActionContext {
	useStoneOfAugmentation(instanceId?: string): void;
	useStoneOfFear(instanceId?: string): void;
	useStoneOfDeepSleep(instanceId?: string): void;
	useStoneOfShock(instanceId?: string): void;
	useStoneOfBlast(instanceId?: string): void;
	useStoneOfBlink(instanceId?: string): void;
	useStoneOfClairvoyance(instanceId?: string): void;
	useStoneOfEnchantment(instanceId?: string): void;
	useStoneOfIntuition(instanceId?: string): void;
	useStoneOfDetectMagic(instanceId?: string): void;
	useStoneOfFlock(instanceId?: string): void;
	useStoneOfAggression(instanceId?: string): void;
}

/** Dispatches each concrete runestone id to its item action. */
export function useStoneById(scene: StoneActionContext, id: string, instanceId?: string): void {
	const actions: Record<string, (instanceId?: string) => void> = {
		stoneOfAugmentation: scene.useStoneOfAugmentation,
		stoneOfFear: scene.useStoneOfFear,
		stoneOfDeepSleep: scene.useStoneOfDeepSleep,
		stoneOfShock: scene.useStoneOfShock,
		stoneOfBlast: scene.useStoneOfBlast,
		stoneOfBlink: scene.useStoneOfBlink,
		stoneOfClairvoyance: scene.useStoneOfClairvoyance,
		stoneOfEnchantment: scene.useStoneOfEnchantment,
		stoneOfIntuition: scene.useStoneOfIntuition,
		stoneOfDetectMagic: scene.useStoneOfDetectMagic,
		stoneOfFlock: scene.useStoneOfFlock,
		stoneOfAggression: scene.useStoneOfAggression,
	};
	actions[id]?.call(scene, instanceId);
}
