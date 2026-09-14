/**
 * Artifact name/description catalogue - special unique items in SPD.
 *
 * Only `id`, `nameKey`, and `descriptionKey` are authored: every real SPD artifact's charge/
 * activation mechanic is its own bespoke formula (`CloakOfShadows`'s is a level-scaling cap
 * `min(level+3, 10)` plus a dynamic `45-missing`-turn regen rate; `ChaliceOfBlood`'s is an
 * HP-cost healing curve with no charge concept at all) - there is no single flat
 * base/max/recharge shape that fits more than one of them, so no such fields are authored here.
 * That executable behavior belongs in game hooks (`src/items/artifactActions.ts`,
 * `DungeonScene`'s Cloak of Shadows logic), cited to the real Java per-artifact.
 *
 * **Corrected 2026-09-13:** this file used to author 10 entries with an invented flat
 * base_charge/max_charge/recharge_rate per artifact. Checked against real Java
 * (`CloakOfShadows.java`, `TimekeepersHourglass.java` at tag `v3.3.8`): every one of those
 * numbers was fabricated, not merely simplified - neither artifact's real formula reduces to a
 * flat recharge rate. Worse, six of the ten entries (`ArmbandsOfHerculaneum`,
 * `CapstoneOfExecution`, `DemonslayerArmor`, `PickaxeOfMining`, `MysteriousLocket`,
 * `SandalsOfTime`) do not correspond to any real Shattered Pixel Dungeon artifact at all - their
 * `items.artifacts.*.name`/`.desc` keys have zero matches anywhere in the complete generated
 * message catalogue (3753+ real SPD keys, 19 languages), and none of their name text (checked
 * against `v3.3.8`'s real 13-artifact `items/artifacts/` roster: AlchemistsToolkit, Artifact,
 * CapeOfThorns, ChaliceOfBlood, CloakOfShadows, DriedRose, EtherealChains, HornOfPlenty,
 * LloydsBeacon, MasterThievesArmband, SandalsOfNature, TalismanOfForesight,
 * TimekeepersHourglass, UnstableSpellbook) matches any real class. A seventh entry
 * (`artifact_chronometer`) was a confused near-duplicate of the real Timekeeper's Hourglass
 * under a typo'd key (`timekeeperhourglass`, missing the "s"). Removed all seven; kept and fixed
 * the three genuine entries - Cloak of Shadows and Timekeeper's Hourglass (both have real, live
 * TS implementations - see `getArtifact`'s new callers in `i18n/spdKeys.ts`) and Chalice of Blood
 * (real SPD content, correct key). This was found while auditing why `ARTIFACTS` had zero
 * consumers anywhere in `src/` - it turned out the data itself was not trustworthy enough to wire
 * up as authored, not merely unwired.
 *
 * **Chalice of Blood is now implemented too (2026-09-14)**, closing that placeholder: see
 * `useChalice` in `src/items/artifactActions.ts` for the active `AC_PRICK` mechanic and its
 * stated simplifications (no armor subtraction on the self-hit, no confirmation modal, and no
 * passive `chaliceRegen` boost since this port has no natural-regeneration system to hook one
 * into). Generation was also fixed in the same pass: every generated artifact other than the
 * Hourglass used to collapse to `cloak` regardless of its real class - a Chalice of Blood picked
 * up in ordinary play silently became a second Cloak of Shadows - now `generatedInventoryItem`/
 * `sourceInventoryItem` route `ChaliceOfBlood` to its own `chalice` id.
 *
 * **Cape of Thorns is now implemented too (2026-09-14)**: `dungeonScene.ts`'s `attack()` hooks
 * `applyCapeOfThornsProc` right where incoming hero damage is finalized, reproducing the real
 * charge-from-damage-taken -> temporary damage-reduction cycle and its own upgrade/exp curve.
 * `generatedInventoryItem`/`sourceInventoryItem` route `CapeOfThorns` to its own `cape` id the
 * same way Chalice was fixed. **Not ported**: the retaliation half (`CapeOfThorns.java`'s
 * `Thorns.proc()` also deals the deflected amount back to an adjacent attacker) - reproducing it
 * safely would mean damaging/potentially killing the attacker from inside the middle of
 * `attack()`'s own resolution of that same attacker's swing, which risks the rest of that
 * (large, load-bearing) function referencing a creature already removed mid-call; scoped out
 * rather than risked. See `PORT_COVERAGE.md`'s `CapeOfThorns` row.
 */

import { MWL_ITEM_NODES } from '../mwlContent';

export interface ArtifactDef {
	id: string;
	nameKey: string;
	descriptionKey: string;
}

function artifactDescriptionKey(node: (typeof MWL_ITEM_NODES)[number]): string {
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'description');
	const value = effect?.attributes.set;
	if (value === undefined) throw new Error(`MWL artifact ${node.attributes.id} is missing description`);
	return value;
}

/** Artifact definitions are authored in `src/content/artifacts.mwl`. */
export const ARTIFACTS: ArtifactDef[] = MWL_ITEM_NODES
	.filter((node) => node.attributes.slot === 'artifact')
	.map((node): ArtifactDef => ({
		id: node.attributes.id.replace(/^artifact_/, ''),
		nameKey: node.attributes.name ?? (() => { throw new Error(`MWL artifact ${node.attributes.id} is missing name`); })(),
		descriptionKey: artifactDescriptionKey(node),
	}));

/**
 * Look up an artifact by ID.
 */
export function getArtifact(id: string): ArtifactDef | undefined {
	return ARTIFACTS.find((a) => a.id === id.toLowerCase());
}

/**
 * Get all artifact IDs.
 */
export function getAllArtifactIds(): string[] {
	return ARTIFACTS.map((a) => a.id);
}
