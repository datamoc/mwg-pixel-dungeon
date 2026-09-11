/**
 * Artifact definitions - special unique items in SPD.
 * Artifacts have unique effects and charge mechanics.
 * This is a foundational definitions file; full effect implementation requires system support.
 */

import { MWL_ITEM_NODES } from './mwlContent';

export interface ArtifactDef {
	id: string;
	nameKey: string;
	descriptionKey: string;
	/** Base charge amount for this artifact */
	baseCharge: number;
	/** Maximum charge this artifact can hold */
	maxCharge: number;
	/** How many turns of normal action to fully recharge (simplified) */
	rechargeRate: number;
}

/** Artifact definitions are authored in `src/content/artifacts.mwl`. */
function artifactEffect(node: (typeof MWL_ITEM_NODES)[number], key: string): string {
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === key);
	const value = effect?.attributes.set;
	if (value === undefined) throw new Error(`MWL artifact ${node.attributes.id} is missing ${key}`);
	return value;
}

function artifactNumber(node: (typeof MWL_ITEM_NODES)[number], key: string): number {
	const value = Number(artifactEffect(node, key));
	if (!Number.isFinite(value)) throw new Error(`MWL artifact ${node.attributes.id} has invalid ${key}`);
	return value;
}

export const ARTIFACTS: ArtifactDef[] = MWL_ITEM_NODES
	.filter((node) => node.attributes.slot === 'artifact')
	.map((node): ArtifactDef => ({
		id: node.attributes.id.replace(/^artifact_/, ''),
		nameKey: node.attributes.name ?? (() => { throw new Error(`MWL artifact ${node.attributes.id} is missing name`); })(),
		descriptionKey: artifactEffect(node, 'description'),
		baseCharge: artifactNumber(node, 'base_charge'),
		maxCharge: artifactNumber(node, 'max_charge'),
		rechargeRate: artifactNumber(node, 'recharge_rate'),
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
