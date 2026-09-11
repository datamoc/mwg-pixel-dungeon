import type { TrapTable } from './regularPainter';
import { MWL_TABLE_ROWS } from '../mwlContent';

const list = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

/** Region-specific dungeon tables authored as MWG typed MWL tables, with their parallel arrays
 * checked once at module load rather than on every lookup. */
const TRAP_TABLES: ReadonlyMap<string, TrapTable> = new Map(MWL_TABLE_ROWS('regionTrapTables', 'region').map((row) => {
	const classes = list(row.kinds);
	const chances = list(row.weights).map(Number);
	if (classes.length === 0 || classes.length !== chances.length || chances.some((chance) => !Number.isFinite(chance) || chance < 0)) {
		throw new Error(`MWL dungeon rule has invalid trap table for ${String(row.region)}`);
	}
	return [String(row.region), { classes, chances }] as const;
}));

export function mwlTrapTable(region: string): TrapTable {
	const table = TRAP_TABLES.get(region);
	if (!table) throw new Error(`MWL dungeon rule has no trap table for ${region}`);
	return table;
}

export interface MwlPaintRule {
	water: { normal: number; feeling: number; smoothness: number };
	grass: { normal: number; feeling: number; smoothness: number };
}

const PAINT_RULES: ReadonlyMap<string, MwlPaintRule> = new Map(MWL_TABLE_ROWS('regionPaintRules', 'region').map((row) => {
	const numbers = [row.waterNormal, row.waterFeeling, row.grassNormal, row.grassFeeling, row.waterSmoothness, row.grassSmoothness].map(Number);
	if (numbers.some((value) => !Number.isFinite(value) || value < 0)) {
		throw new Error(`MWL dungeon rule has invalid paint rule for ${String(row.region)}`);
	}
	const [waterNormal, waterFeeling, grassNormal, grassFeeling, waterSmoothness, grassSmoothness] = numbers;
	return [String(row.region), {
		water: { normal: waterNormal!, feeling: waterFeeling!, smoothness: waterSmoothness! },
		grass: { normal: grassNormal!, feeling: grassFeeling!, smoothness: grassSmoothness! },
	}] as const;
}));

export function mwlPaintRule(region: string): MwlPaintRule {
	const rule = PAINT_RULES.get(region);
	if (!rule) throw new Error(`MWL dungeon rule has no paint rule for ${region}`);
	return rule;
}
