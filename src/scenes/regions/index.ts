import type { Region } from '../../genericDungeon';
import { CAVES_REGION } from './caves';
import { CITY_REGION } from './city';
import { HALLS_REGION } from './halls';
import { PRISON_REGION } from './prison';
import { SEWERS_REGION } from './sewers';
import type { DungeonRegionProfile } from './regionTypes';

export const DUNGEON_REGIONS: Record<Region, DungeonRegionProfile> = {
	sewers: SEWERS_REGION,
	prison: PRISON_REGION,
	caves: CAVES_REGION,
	city: CITY_REGION,
	halls: HALLS_REGION,
};

export function dungeonRegion(region: Region): DungeonRegionProfile {
	return DUNGEON_REGIONS[region];
}
