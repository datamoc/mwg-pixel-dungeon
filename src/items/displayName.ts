import { Actors } from 'mwg';
import { ITEM_KEYS, RING_KEYS, WAND_KEYS, has, t } from '../i18n';
import { wandTypeFromSource, type WandType } from './wands';
import { ARMOR_NAME_BY_CLASS, WEAPON_NAME_BY_CLASS, isClassArmorId, weaponCombat } from './catalog';
import { tippedDartNameKey, missileDamageRange } from './missiles';
import { armorSTRReq, missileSTRReq, weaponSTRReq } from './strReq';
import { TOME_SPELL_COST, type SubclassSpellId, type TalentSpellId, type TomeSpellId } from '../simulation/clericSpells';
import { tomeSpellKey } from './holyTome';
import { MWL_CONSUMABLE_DESCRIPTION_KEYS, MWL_EQUIPMENT_DESCRIPTION_KEYS, MWL_MISSILE_BY_CLASS, MWL_MISSILE_DESCRIPTION_KEYS, MWL_MISSILE_NAME_KEYS } from '../mwlContent';

/**
 * `Item.desc()` for a bag id: the flavour text Java's item-info window prints as its body.
 *
 * Resolution order: the MWL tables' own `descriptionKey`s (authored per consumable, equipment and
 * missile row), then the SPD catalogue at the same class path as the name - the `ITEM_KEYS` name key
 * with its `.name` tail swapped for `.desc`, so a name and its description can never resolve to
 * different classes. Some artifact names are *level-indexed* (`name_1`/`name_2`): those are skipped
 * on purpose, since the matching `desc` keys do not exist.
 *
 * `sourceClass` is what the port's *heap* ids carry instead of a class of their own: a shop's
 * generated weapon is stored as `weaponReward` with `sourceClass: 'shortsword'`, and the MWL tables
 * (like Java's own `Messages.get(Weapon.class, ...)`) are keyed by the class. So it is tried first
 * when given, which is what lets a generated-gear heap show the gear's own description.
 *
 * `undefined` when nothing has one for the id (a picker's synthetic action id, say). Callers then
 * show no body rather than the key.
 */
export function itemDescription(id: string, sourceClass?: string): string | undefined {
	//The HolyTome is not one of the 13 real artifacts (no `artifacts.mwl` row, so no
	//authored description key): its body is SPD's own tag-`v3.3.8`
	//`items.artifacts.holytome.desc` under a `port.*` key (see `portStrings.ts`).
	if (id === 'holyTome' && !sourceClass) return has('port.desc.holytome') ? t('port.desc.holytome') : undefined;
	const resolve = (candidate: string | undefined): string | undefined => {
		if (!candidate) return undefined;
		const authored = MWL_CONSUMABLE_DESCRIPTION_KEYS[candidate]
			?? MWL_EQUIPMENT_DESCRIPTION_KEYS[candidate] ?? MWL_MISSILE_DESCRIPTION_KEYS[candidate];
		if (authored) return has(authored) ? t(authored) : undefined;
		const nameKey = ITEM_KEYS[candidate];
		if (!nameKey || !nameKey.endsWith('.name')) return undefined;
		const key = `${nameKey.slice(0, -'.name'.length)}.desc`;
		return has(key) ? t(key) : undefined;
	};
	const described = resolve(sourceClass) ?? resolve(id);
	//`SkeletonKey.desc()`: an equipped key appends `desc_worn` (this port carries artifacts rather than
	//slotting them, so a carried key counts as worn; the cursed variant `desc_cursed` needs the item's own state).
	if (described !== undefined && (id === 'skeletonkey' || sourceClass?.toLowerCase() === 'skeletonkey') && has('port.skeletonkey.desc_worn')) {
		return `${described}

${t('port.skeletonkey.desc_worn')}`;
	}
	return described;
}

/**
 * `WndInfoItem`'s per-class stats line below the description: Java's real
 * `stats_known`/`curr_absorb`/`stats` sentences (`MeleeWeapon.info()`, `Armor.info()`,
 * `MissileWeapon.info()`), with damage/DR from the same tier/level formulas the combat
 * sync reads and STR from the three functions above. The `too_heavy`/`excess_str`
 * suffixes compare against `heroStr` when given (Java reads `Dungeon.hero.STR()`).
 * Stated gaps: the `stats_unknown`/`avg_absorb` unidentified branch is not shown - every
 * call site treats shop goods as identified, matching what it already assumed; and wand
 * charges are not shown because Java does not show them either (`WndTradeItem` renders
 * `item.info()`, and `Wand.info()` is desc + class text - charges live in `status()`,
 * the quickslot line, which has no equivalent here). See `PORT_COVERAGE.md`'s shop row.
 */
export function itemStatsLine(id: string, opts: { tier?: number; level?: number; sourceClass?: string; heroStr?: number } = {}): string | undefined {
	const level = opts.level ?? 0;
	const heavySuffix = (req: number, heavyKey: string, excessKey?: string): string => {
		if (opts.heroStr === undefined) return '';
		if (req > opts.heroStr) return ' ' + t(heavyKey);
		if (excessKey !== undefined && opts.heroStr > req) return ' ' + t(excessKey, { '0': opts.heroStr - req });
		return '';
	};
	if (id === 'weaponReward' || id === 'startingWeapon') {
		const tier = opts.tier ?? 1;
		const { min, max } = weaponCombat(opts.sourceClass ?? '', tier, level);
		const req = weaponSTRReq(tier, level);
		return t('items.weapon.melee.meleeweapon.stats_known', { '0': tier, '1': min, '2': max, '3': req })
			+ heavySuffix(req, 'items.weapon.weapon.too_heavy', 'items.weapon.weapon.excess_str');
	}
	if (id === 'armor' || id === 'armorReward' || id === 'clothArmor' || id === 'startingArmor' || isClassArmorId(id)) {
		const tier = opts.tier ?? 1;
		const drMin = level;
		const drMax = tier * (2 + level);
		const req = armorSTRReq(tier, level);
		return t('items.armor.armor.curr_absorb', { '0': tier, '1': drMin, '2': drMax, '3': req })
			+ heavySuffix(req, 'items.armor.armor.too_heavy');
	}
	const missileClass = opts.sourceClass ? MWL_MISSILE_BY_CLASS.get(opts.sourceClass) : undefined;
	if (missileClass || id.startsWith('missile_')) {
		try {
			const [min, max] = missileDamageRange(opts.sourceClass ?? 'ThrowingStone', level);
			//Vintage note: this catalogue is v2.1.4-derived, where `MissileWeapon.info()`
			//uses the single `stats` key (the known/unknown split postdates it).
			const tier = opts.tier ?? 1;
			const req = missileSTRReq(tier, level);
			return t('items.weapon.missiles.missileweapon.stats', { '0': tier, '1': min, '2': max, '3': req })
				+ heavySuffix(req, 'items.weapon.weapon.too_heavy', 'items.weapon.weapon.excess_str');
		} catch { return undefined; }
	}
	return undefined;
}

export interface ItemDisplayContext {
	readonly bag: Actors.Inventory;
	readonly appearances: Actors.Appearances;
	readonly wandType: WandType;
	readonly weaponId: string; readonly weaponInstanceId?: string; readonly weaponHardened: boolean;
	readonly armorId: string; readonly armorInstanceId?: string; readonly armorHardened: boolean;
	/** Ring ids whose type stands revealed while level/curse stay hidden (Thief's Intuition rank 1). */
	readonly ringTypesKnown: ReadonlySet<string>;
}

/** Resolves the player-facing name of a bag item, including appearances and enhancement notes. */
export function itemDisplayName(scene: ItemDisplayContext, id: string, identified: boolean, instanceId?: string): string {
	//`LloydsBeacon.actions()`'s own `AC_ZAP`/`AC_SET`/`AC_RETURN` labels: `useBeaconArtifact`'s
	//picker rows all share the real `beacon` id (so its own icon/frame render correctly), and
	//distinguish themselves only by these synthetic instance ids - the same trick
	//`openAlchemyRecipes`'s `toolkit-energize` row already uses for the toolkit.
	if (id === 'beacon' && instanceId === 'beacon-zap') return t('items.artifacts.lloydsbeacon.ac_zap');
	if (id === 'beacon' && instanceId === 'beacon-set') return t('items.artifacts.lloydsbeacon.ac_set');
	if (id === 'beacon' && instanceId === 'beacon-return') return t('items.artifacts.lloydsbeacon.ac_return');
	//`HornOfPlenty.actions()`'s own `AC_EAT`/`AC_SNACK`/`AC_STORE` labels: `useHorn`'s picker
	//rows all share the real `horn` id, distinguished only by these synthetic instance ids -
	//the same trick the beacon rows above use.
	if (id === 'horn' && instanceId === 'horn-eat') return t('items.artifacts.hornofplenty.ac_eat');
	if (id === 'horn' && instanceId === 'horn-snack') return t('items.artifacts.hornofplenty.ac_snack');
	if (id === 'horn' && instanceId === 'horn-store') return t('items.artifacts.hornofplenty.ac_store');
	//`SandalsOfNature.actions()`'s own `AC_FEED`/`AC_ROOT` labels, on the same synthetic-id trick
	//the beacon and horn rows above use.
	if (id === 'sandals' && instanceId === 'sandals-feed') return t('items.artifacts.sandalsofnature.ac_feed');
	if (id === 'sandals' && instanceId === 'sandals-root') return t('items.artifacts.sandalsofnature.ac_root');
	//`DriedRose.actions()`'s own `AC_SUMMON`/`AC_DIRECT` labels, on the same synthetic-id trick.
	if (id === 'rose' && instanceId === 'rose-summon') return t('items.artifacts.driedrose.ac_summon');
	if (id === 'rose' && instanceId === 'rose-direct') return t('items.artifacts.driedrose.ac_direct');
	//`UnstableSpellbook.actions()`'s own `AC_READ`/`AC_ADD` labels, on the same synthetic-id trick.
	if (id === 'spellbook' && instanceId === 'spellbook-read') return t('items.artifacts.unstablespellbook.ac_read');
	if (id === 'spellbook' && instanceId === 'spellbook-add') return t('items.artifacts.unstablespellbook.ac_add');
	//`WndClericSpells` rows: every spell shares the tome's own id (so the tome
	//icon/frame render) and names itself plus its charge cost - the same
	//synthetic-id trick the beacon and horn rows above use. The base three keep
	//their long-standing `name (cost)` line byte-identical; talent rows name the
	//spell alone (their `note` already prints the rank-aware cost, which this
	//naming context cannot recompute - no talent rank or tracker rides it).
	if (id === 'holyTome' && instanceId !== undefined && instanceId.startsWith('tome-')) {
		const spell = instanceId.slice('tome-'.length) as TomeSpellId | TalentSpellId | SubclassSpellId;
		const nameKey = spell === 'guidingLight' ? 'port.spell.guidinglight.name'
			: spell === 'holyWeapon' ? 'port.spell.holyweapon.name'
			: spell === 'holyWard' ? 'port.spell.holyward.name' : undefined;
		const cost = spell === 'guidingLight' ? TOME_SPELL_COST.guidingLight
			: spell === 'holyWeapon' ? TOME_SPELL_COST.holyWeapon
			: spell === 'holyWard' ? TOME_SPELL_COST.holyWard : undefined;
		if (nameKey !== undefined && cost !== undefined) return `${t(nameKey)} (${t('port.spell.charge_cost', { cost })})`;
		//Talent and subclass rows name the spell alone (their `note` already prints
		//the rank-aware cost). Unknown suffixes fall through to the generic name.
		if (spell === 'holyIntuition' || spell === 'shieldOfLight' || spell === 'recallInscription'
			|| spell === 'sunray' || spell === 'divineSense' || spell === 'bless' || spell === 'cleanse'
			|| spell === 'radiance' || spell === 'holyLance' || spell === 'mnemonicPrayer'
			|| spell === 'smite' || spell === 'layOnHands' || spell === 'auraOfProtection'
			|| spell === 'hallowedGround' || spell === 'wallOfLight' || spell === 'divineIntervention'
			|| spell === 'judgement' || spell === 'flash') {
			return t(`port.spell.${tomeSpellKey(spell)}.name`);
		}
	}
	//`SummonElemental`'s two actions (`AC_CAST` is Java's generic spell label, `AC_IMBUE` its own).
	if (id === 'summonElemental' && instanceId === 'summonElemental-cast') return t('items.spells.spell.ac_cast');
	if (id === 'summonElemental' && instanceId === 'summonElemental-imbue') return t('items.spells.summonelemental.ac_imbue');
	//`WndWandmaker`'s two reward rows: both carry the real `wand` id (so the icon and frame render)
	//and name the *class* they offer, which is the whole point of the window - the same synthetic-id
	//convention the artifact action rows above use. `scene.wandType` cannot answer for them: it is
	//the hero's current wand, not the wand being offered.
	if (id === 'wand' && instanceId?.startsWith('wand-reward:')) {
		return t(WAND_KEYS[wandTypeFromSource(instanceId.slice('wand-reward:'.length)) ?? 'magicMissile']);
	}
	if (id.startsWith('ring_')) {
		//`Ring.name()`: the real name shows once the type is known; only a full
		//identify appends the level and curse suffixes.
		if (!identified && !scene.ringTypesKnown.has(id)) return t('port.name.ring');
		const ring = scene.bag.find(id, instanceId);
		if (!identified) return `${t(RING_KEYS[id.slice(5)] ?? id)}`;
		const curse = ring?.cursed ? ` (${t('port.name.cursed')})` : '';
		return `${t(RING_KEYS[id.slice(5)] ?? id)} +${ring?.level ?? 0}${curse}`;
	}
	if (identified) {
		const item = scene.bag.find(id, instanceId);
		//`sourceClass` is the port's own minted-id payload field (`InventoryItem` does not declare it)
		const sourceClass = (item as (typeof item | undefined) & { sourceClass?: string })?.sourceClass;
		//A carried wand names its *own* class: `scene.wandType` is the hero's wielded wand, so every
		//other wand in the bag used to be labelled as the equipped one. `sourceClass` is the Java
		//class the port minted the entry from (`WandOfFireblast`), which the same `WAND_KEYS` lookup
		//the `wand-reward:<Class>` rows already use can turn into the real name.
		if (id === 'wand') {
			const ownType = sourceClass ? wandTypeFromSource(sourceClass) : undefined;
			return t(WAND_KEYS[ownType ?? scene.wandType] ?? WAND_KEYS.magicMissile);
		}
		//`SandalsOfNature.name()` (tag `v3.3.8`): the artifact renames itself as it grows, from
		//`name` ("sandals of nature") at +0 to `name_1`/`name_2`/`name_3` - "shoes", "boots" and
		//"greaves of nature". Java indexes the +1/+2/+3 keys off `level()` and falls back to the
		//base name below 1, which the `ITEM_KEYS` path at the foot of this function already does.
		if (id === 'sandals') {
			const level = (item as (typeof item | undefined) & { level?: number })?.level ?? 0;
			if (level >= 1) return t(`items.artifacts.sandalsofnature.name_${Math.min(3, level)}`);
		}
		const affix = item?.affix ? ` (${t(`port.affix.${item.affix}`)})` : '';
		const weapon = ['weaponReward', 'startingWeapon'].includes(id);
		const armor = ['armor', 'armorReward', 'clothArmor', 'startingArmor'].includes(id) || isClassArmorId(id);
		//Ammo stacks share the minted id `stone` whatever they throw, so the same minted-id problem
		//applies: a stack of throwing knives read as "throwing stones". The class is the payload's
		//`sourceClass`, which `MWL_MISSILE_BY_CLASS` turns into the authored missile node whose own
		//name key is the real one (the same lookup the boomerang's pickup line already uses).
		const missileClass = sourceClass ? MWL_MISSILE_BY_CLASS.get(sourceClass) : undefined;
		//A tipped dart names its own tip (`TippedDart` + seed → the dart class's own name key,
		//e.g. `items.weapon.missiles.darts.rotdart.name`), not the generic dart node.
		if (sourceClass === 'TippedDart') {
			const tipped = (item as (typeof item | undefined) & { tippedSeed?: string })?.tippedSeed;
			return t(tippedDartNameKey(tipped));
		}
		if (missileClass) return t(MWL_MISSILE_NAME_KEYS[missileClass.id] ?? ITEM_KEYS[id] ?? id);
		//A minted payload names its *class*, not its id: every generated weapon is `weaponReward`
		//and every generated armor `armorReward`, and those two nodes' own name key is the generic
		//"quest weapon"/"quest armor" (`item-rules.mwl`, port strings) - so before this, every
		//procedurally-generated weapon in the game read as "quest weapon". The class comes from
		//`sourceClass`, which is the Java class name lowercased (`WEAPON_NAME_BY_CLASS`'s own key).
		const classKey = sourceClass
			? (weapon ? WEAPON_NAME_BY_CLASS[sourceClass.toLowerCase()]
				: armor ? ARMOR_NAME_BY_CLASS[sourceClass.toLowerCase()] : undefined)
			: undefined;
		const hardenedFlag = (item as (typeof item | undefined) & { hardened?: boolean })?.hardened;
		const isEquipped = (slotId: string, slotInstanceId: string | undefined): boolean =>
			id === slotId && (instanceId === undefined ? slotInstanceId === undefined : instanceId === slotInstanceId);
		const hardened = weapon ? (hardenedFlag ?? (isEquipped(scene.weaponId, scene.weaponInstanceId) ? scene.weaponHardened : false))
			: armor ? (hardenedFlag ?? (isEquipped(scene.armorId, scene.armorInstanceId) ? scene.armorHardened : false)) : false;
		const hardenedNote = hardened ? ` ${t(weapon ? 'port.item.hardened.weapon' : 'port.item.hardened.armor')}` : '';
		return `${t(classKey ?? ITEM_KEYS[id] ?? id)}${affix}${hardenedNote}`;
	}
	if (id.startsWith('potion')) return t(scene.appearances.appearanceOf('potion', id));
	if (id.startsWith('scroll')) return t(scene.appearances.appearanceOf('scroll', id));
	return t(ITEM_KEYS[id] ?? id);
}
