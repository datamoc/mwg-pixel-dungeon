import type { TrapTable } from './regularPainter';
import { MWL_TRAIT_NODES } from '../mwlContent';

/** Reads region-specific dungeon tables authored in MWL and validates their parallel arrays. */
export function mwlTrapTable(region: string): TrapTable {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'regionTrapTables');
	if (!node) throw new Error('MWL dungeon rule is missing regionTrapTables');
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	const entry = effect?.attributes.set?.split(';').find((candidate) => candidate.startsWith(`${region}|`));
	if (!entry) throw new Error(`MWL dungeon rule has no trap table for ${region}`);
	const [, classesText, chancesText] = entry.split('|');
	const classes = classesText?.split(',').filter(Boolean) ?? [];
	const chances = chancesText?.split(',').map(Number) ?? [];
	if (classes.length === 0 || classes.length !== chances.length || chances.some((chance) => !Number.isFinite(chance) || chance < 0)) {
		throw new Error(`MWL dungeon rule has invalid trap table for ${region}`);
	}
	return { classes, chances };
}


export interface MwlPaintRule {
	water: { normal: number; feeling: number; smoothness: number };
	grass: { normal: number; feeling: number; smoothness: number };
}

export function mwlPaintRule(region: string): MwlPaintRule {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'regionPaintRules');
	if (!node) throw new Error('MWL dungeon rule is missing regionPaintRules');
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	const entry = effect?.attributes.set?.split(';').find((candidate) => candidate.startsWith(`${region}|`));
	const values = entry?.split('|').slice(1).map(Number) ?? [];
	if (values.length !== 6 || values.some((value) => !Number.isFinite(value) || value < 0)) {
		throw new Error(`MWL dungeon rule has invalid paint rule for ${region}`);
	}
	const [waterNormal, waterFeeling, grassNormal, grassFeeling, waterSmoothness, grassSmoothness] = values;
	return {
		water: { normal: waterNormal!, feeling: waterFeeling!, smoothness: waterSmoothness! },
		grass: { normal: grassNormal!, feeling: grassFeeling!, smoothness: grassSmoothness! },
	};
}
