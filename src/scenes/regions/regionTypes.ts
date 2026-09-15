import type { Region } from '../../genericDungeon';
import type { SpdSprites } from '../../images';

export type RegionDecoration = 'sink' | 'torch' | 'ore' | 'smoke' | null;

export interface DungeonRegionProfile {
	readonly id: Region;
	readonly waterSprite: keyof SpdSprites;
	readonly loadingSprite: keyof SpdSprites;
	readonly wallDecoration: RegionDecoration;
	readonly waterEmbers: boolean;
}
