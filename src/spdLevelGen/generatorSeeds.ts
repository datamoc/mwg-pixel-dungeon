/**
 * The narrow, genuinely portable slice of `items/Generator.java` that level generation reaches
 * on the LEVEL-GEN RNG stream.
 *
 * Most of `Generator` is out of scope for this port (item decks, weapon/armor tiers,
 * enchantment/curse rolls), and much of it deliberately runs on its own pushed substream
 * (`Random.pushGenerator(cat.seed)`), consuming nothing from the level stream. But
 * `Generator.randomUsingDefaults(Category)` does NOT push a substream - it rolls
 * `Random.chances(cat.defaultProbs)` directly on the current (level-gen) generator. Any room
 * calling it therefore consumes real level-stream draws, and skipping them desyncs the floor.
 *
 * Found via the Phase 2 call-by-call RNG trace diff against the real Java harness.
 */
import { SpdRandom } from '../spdRng';

/**
 * `Generator.Category.SEED`'s real class order and `defaultProbs` (`Generator.java`'s static
 * init). Rotberry is the quest item at weight 0; Starflower is the rare one at 2.
 */
export const SEED_CLASSES = [
	'rotberry', 'sungrass', 'fadeleaf', 'icecap', 'firebloom', 'sorrowmoss',
	'swiftthistle', 'blindweed', 'stormvine', 'earthroot', 'mageroyal', 'starflower',
] as const;
export const SEED_DEFAULT_PROBS = [0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 2];

const FIREBLOOM_INDEX = SEED_CLASSES.indexOf('firebloom');

/**
 * `PlantsRoom.randomSeed()`: `do { Generator.randomUsingDefaults(SEED) } while (Firebloom)`.
 * Each attempt burns one `Random.chances(SEED.defaultProbs)` float, and a Firebloom roll retries
 * (burning another) - so the draw count is genuinely variable, not fixed at one.
 * `Plant.Seed.random()` adds no draws (`Item.random()` just returns `this`).
 */
export function randomNonFirebloomSeed(): string {
	let idx: number;
	do {
		idx = SpdRandom.chances(SEED_DEFAULT_PROBS);
	} while (idx === FIREBLOOM_INDEX);
	return SEED_CLASSES[idx] ?? 'sungrass';
}
