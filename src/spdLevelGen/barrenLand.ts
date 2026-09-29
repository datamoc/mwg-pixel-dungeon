import type { PaintLevel } from './paintLevel';

/**
 * `Challenges.NO_HERBALISM` (Barren land) vs the generated plants. Java's `Level.plant()`
 * (`Level.java:1021-1040`, tag `v3.3.8`) still lays the GRASS under the seed ("grass placement has
 * RNG implications in levelgen") and then returns `null` before `seed.couch()`, so GardenRoom,
 * PlantsRoom, SecretGardenRoom and SecretLarderRoom end up without their plants.
 *
 * This port's painters record plants in `PaintLevel.plants` (well-water sources share the list under
 * a `wellWater:` prefix - those are `WellWater` blobs in Java, not plants, and stay). The paint is
 * generated from the run seed without knowing the run's challenges, so the scene strips the plants
 * after generation, in place. The grass already went down during painting, exactly as in Java.
 * Returns how many plants were removed.
 */
export function stripGeneratedPlants(paint: PaintLevel): number {
	let removed = 0;
	for (let i = paint.plants.length - 1; i >= 0; i--) {
		if (paint.plants[i]!.kind.startsWith('wellWater:')) continue;
		paint.plants.splice(i, 1);
		removed++;
	}
	return removed;
}
