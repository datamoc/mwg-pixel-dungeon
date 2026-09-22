import { Cat, randomUsingDefaults } from './generator';
import { sourceInventoryItem } from './itemKinds';

export interface BerryPayoutContext {
	berryCounter: number;
	hero: { x: number; y: number };
	spawnGroundItem: (kind: 'seed', x: number, y: number, item: NonNullable<ReturnType<typeof sourceInventoryItem>>) => void;
	newItemInstanceId: (kind: string) => string;
}

/** `Berry.SeedCounter` (tag `v3.3.8`): every second berry drops one random seed. */
export function eatBerrySeed(scene: BerryPayoutContext): void {
	scene.berryCounter++;
	if (scene.berryCounter < 2) return;
	scene.berryCounter = 0;
	const seedClass = randomUsingDefaults(Cat.SEED).cls;
	scene.spawnGroundItem('seed', scene.hero.x, scene.hero.y,
		sourceInventoryItem('seed', seedClass, (id) => scene.newItemInstanceId(id))!);
}
