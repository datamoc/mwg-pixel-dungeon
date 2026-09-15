/**
 * `HighGrass.trample` (Shattered Pixel Dungeon, v3.3.8) has a Huntress-only
 * two-step state: HIGH_GRASS becomes FURROWED_GRASS; a Huntress preserves that
 * furrow, while another hero clears it without running drop rolls.
 */
export type HighGrassState = 'high' | 'furrowed' | 'plain';

export type HighGrassTrample = {
	next: HighGrassState;
	rollDrops: boolean;
};

export function trampleHighGrass(state: HighGrassState, huntress: boolean): HighGrassTrample {
	if (state === 'plain') return { next: 'plain', rollDrops: false };
	if (state === 'furrowed') return { next: huntress ? 'furrowed' : 'plain', rollDrops: false };
	if (huntress) return { next: 'furrowed', rollDrops: false };
	return { next: 'plain', rollDrops: true };
}
