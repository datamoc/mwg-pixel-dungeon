/**
 * Artifact definitions - special unique items in SPD.
 * Artifacts have unique effects and charge mechanics.
 * This is a foundational definitions file; full effect implementation requires system support.
 */

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

/**
 * The 10 artifacts available in SPD (one per depth roughly).
 * Not all are fully implemented; this provides a reference for future completion.
 */
export const ARTIFACTS: ArtifactDef[] = [
	{
		id: 'cloak',
		nameKey: 'items.artifacts.cloakofshadows.name',
		descriptionKey: 'items.artifacts.cloakofshadows.desc',
		baseCharge: 40,
		maxCharge: 40,
		rechargeRate: 10,
	},
	{
		id: 'armband',
		nameKey: 'items.artifacts.armbandsofherculaneum.name',
		descriptionKey: 'items.artifacts.armbandsofherculaneum.desc',
		baseCharge: 10,
		maxCharge: 10,
		rechargeRate: 5,
	},
	{
		id: 'capstone',
		nameKey: 'items.artifacts.capstoneofexecution.name',
		descriptionKey: 'items.artifacts.capstoneofexecution.desc',
		baseCharge: 1,
		maxCharge: 1,
		rechargeRate: 30,
	},
	{
		id: 'chalice',
		nameKey: 'items.artifacts.chaliceofblood.name',
		descriptionKey: 'items.artifacts.chaliceofblood.desc',
		baseCharge: 30,
		maxCharge: 30,
		rechargeRate: 15,
	},
	{
		id: 'chronometer',
		nameKey: 'items.artifacts.timekeeperhourglass.name',
		descriptionKey: 'items.artifacts.timekeeperhourglass.desc',
		baseCharge: 100,
		maxCharge: 100,
		rechargeRate: 50,
	},
	{
		id: 'dragonslayer',
		nameKey: 'items.artifacts.demonslayerarmor.name',
		descriptionKey: 'items.artifacts.demonslayerarmor.desc',
		baseCharge: 0,
		maxCharge: 0,
		rechargeRate: 0,
	},
	{
		id: 'emerald',
		nameKey: 'items.artifacts.pickaxeofmining.name',
		descriptionKey: 'items.artifacts.pickaxeofmining.desc',
		baseCharge: 25,
		maxCharge: 25,
		rechargeRate: 10,
	},
	{
		id: 'hourglass',
		nameKey: 'items.artifacts.hourglass.name',
		descriptionKey: 'items.artifacts.hourglass.desc',
		baseCharge: 100,
		maxCharge: 100,
		rechargeRate: 40,
	},
	{
		id: 'locket',
		nameKey: 'items.artifacts.mysteriouslocket.name',
		descriptionKey: 'items.artifacts.mysteriouslocket.desc',
		baseCharge: 200,
		maxCharge: 200,
		rechargeRate: 80,
	},
	{
		id: 'sandals',
		nameKey: 'items.artifacts.sandalsoftime.name',
		descriptionKey: 'items.artifacts.sandalsoftime.desc',
		baseCharge: 50,
		maxCharge: 50,
		rechargeRate: 25,
	},
];

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
