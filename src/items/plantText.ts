import { t } from '../i18n/index';

/**
 * `Plant.desc()` / `Plant.Seed.info()` (`plants/Plant.java`, tag `v3.3.8`), the R113
 * Warden halves: a plant's description gains its `warden_desc` paragraph for a Warden,
 * and a seed's info body is that same description wrapped in `plants.plant$seed.info`
 * ("Throw this seed ... \n\n{0}").
 *
 * The twelve kinds are the seed-plantable set `seedPlantKind` already normalizes to
 * (every `plants/<kind>$seed.name` in the catalogue); a growing blandfruit bush is the
 * odd one out - Java has a `desc` for it but no `warden_desc`, and the tile-examine
 * answer below stays silent for it rather than printing a raw key, stated in the
 * coverage row. Leaf bursts (`CellEmitter ... LEVEL_SPECIFIC`, Plant.java:160-169)
 * stay unported - the Blooming precedent, stated at the furrow call site.
 */
const PLANT_TEXT: Record<string, { name: string; desc: string; wardenDesc: string }> = {
	blindweed: { name: 'plants.blindweed.name', desc: 'plants.blindweed.desc', wardenDesc: 'plants.blindweed.warden_desc' },
	earthroot: { name: 'plants.earthroot.name', desc: 'plants.earthroot.desc', wardenDesc: 'plants.earthroot.warden_desc' },
	fadeleaf: { name: 'plants.fadeleaf.name', desc: 'plants.fadeleaf.desc', wardenDesc: 'plants.fadeleaf.warden_desc' },
	firebloom: { name: 'plants.firebloom.name', desc: 'plants.firebloom.desc', wardenDesc: 'plants.firebloom.warden_desc' },
	icecap: { name: 'plants.icecap.name', desc: 'plants.icecap.desc', wardenDesc: 'plants.icecap.warden_desc' },
	mageroyal: { name: 'plants.mageroyal.name', desc: 'plants.mageroyal.desc', wardenDesc: 'plants.mageroyal.warden_desc' },
	rotberry: { name: 'plants.rotberry.name', desc: 'plants.rotberry.desc', wardenDesc: 'plants.rotberry.warden_desc' },
	sorrowmoss: { name: 'plants.sorrowmoss.name', desc: 'plants.sorrowmoss.desc', wardenDesc: 'plants.sorrowmoss.warden_desc' },
	starflower: { name: 'plants.starflower.name', desc: 'plants.starflower.desc', wardenDesc: 'plants.starflower.warden_desc' },
	stormvine: { name: 'plants.stormvine.name', desc: 'plants.stormvine.desc', wardenDesc: 'plants.stormvine.warden_desc' },
	sungrass: { name: 'plants.sungrass.name', desc: 'plants.sungrass.desc', wardenDesc: 'plants.sungrass.warden_desc' },
	swiftthistle: { name: 'plants.swiftthistle.name', desc: 'plants.swiftthistle.desc', wardenDesc: 'plants.swiftthistle.warden_desc' },
};

/** The seed's own `sourceClass` payload (`'Firebloom'`, `plants.firebloom$seed`, ...) to
 * the lowercase plant kind above, or `undefined` - the same normalization the scene's
 * `seedPlantKind` already applied, shared here so the two cannot drift. */
export function normalizePlantKindName(sourceClass?: string): string | undefined {
	const name = (sourceClass ?? '').toLowerCase().replace(/\$seed$|\.seed$/, '').split('.').pop() ?? '';
	return PLANT_TEXT[name] !== undefined ? name : undefined;
}

/** `Plant.name()` - `Messages.get(this, "name")`. */
export function plantName(kind: string): string | undefined {
	const keys = PLANT_TEXT[kind];
	return keys === undefined ? undefined : t(keys.name);
}

/** `Plant.desc()`: the `desc`, plus `"\n\n" + warden_desc` for a Warden. */
export function plantDesc(kind: string, isWarden: boolean): string | undefined {
	const keys = PLANT_TEXT[kind];
	if (keys === undefined) return undefined;
	const desc = t(keys.desc);
	return isWarden ? `${desc}\n\n${t(keys.wardenDesc)}` : desc;
}

/** `Plant.Seed.info()`: `plants.plant$seed.info` wrapped around `desc()` (which is what
 * `Item.info()` returns, the warden paragraph included for a Warden). */
export function seedInfoBody(kind: string, isWarden: boolean): string | undefined {
	const desc = plantDesc(kind, isWarden);
	if (desc === undefined) return undefined;
	return t('plants.plant$seed.info', { '0': desc });
}
