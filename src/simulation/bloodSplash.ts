/**
 * `CharSprite.bloodBurstA()` / `blood()` (`sprites/CharSprite.java:345-355`, tag `v3.3.8`), pure.
 * Every landed `Char.attack()` hit bursts `min(9 * sqrt(damage / HT), 9)` blood pixels from the
 * defender, in a quarter-circle cone pointing away from the attacker (`Splash.at(c, angle(from, c),
 * PI / 2, blood(), n)`), coloured by the defender's sprite `blood()`. The hero's own sprite
 * (`HeroSprite.bloodBurstA`) and mirror images (`MirrorSprite`) never bleed, and a dead
 * `SpawnerSprite` does not either.
 */

/** `CharSprite.blood()`'s default, `0xFFBB0000` (alpha dropped: the particle takes RGB only). */
export const DEFAULT_BLOOD = 0xBB0000;

/** Per-kind `blood()` overrides, port kind -> sprite class' RGB. Kinds absent here use `DEFAULT_BLOOD`
 * (their Java sprites override nothing). `ElementalSprite`'s four are keyed by `elementalType`. */
const BLOOD_BY_KIND: Readonly<Record<string, number>> = {
	acidic: 0x66FF22, bee: 0xFFD500, crab: 0xFFEA80, greatCrab: 0xFFEA80, hermitCrab: 0xFFEA80,
	crystalGuardian: 0x8EE3FF, crystalSpire: 0x8EE3FF, crystalWisp: 0x66B3FF,
	dm100: 0xFFFF88, dm200: 0xFFFF88, dm201: 0xFFFF88, dm300: 0xFFFF88, pylon: 0xFFFF88,
	earthGuardian: 0x966400, yogFist: 0xFFDD34, sentry: 0x88CC44, rotHeart: 0x88CC44, rotLasher: 0x88CC44,
	ghost: 0xFFFFFF, golem: 0x80706C, goo: 0x000000, larva: 0xBBCC66, scorpio: 0x44FF22,
	skeleton: 0xCCCCCC, necroSkeleton: 0xCCCCCC, slime: 0x88CC44, spinner: 0xBFE5B8,
	statue: 0xCDCDB7, armoredStatue: 0xCDCDB7, swarm: 0x8BA077, ward: 0xCC33FF,
	wraith: 0x000000, dustWraith: 0x000000, newbornElemental: 0x85FFC8,
};
const ELEMENTAL_BLOOD: Readonly<Record<string, number>> = { fire: 0xFFBB33, frost: 0x8EE3FF, shock: 0xFFFF85, chaos: 0xE3E3E3 };

export function bloodColor(kind: string | undefined, elementalType?: string): number {
	if (kind === 'elemental') return ELEMENTAL_BLOOD[elementalType ?? 'fire'] ?? DEFAULT_BLOOD;
	return BLOOD_BY_KIND[kind ?? ""] ?? DEFAULT_BLOOD;
}

/** `(int) Math.min(9 * Math.sqrt(damage / HT), 9)`. */
export function bloodBurstCount(damage: number, maxHp: number): number {
	if (damage <= 0 || maxHp <= 0) return 0;
	return Math.trunc(Math.min(9 * Math.sqrt(damage / maxHp), 9));
}

/** Who bleeds at all: not the hero, not a mirror image, not a dead spawner. */
export function bleedsOnHit(defender: { isHero?: boolean; allyKind?: string; kind?: string; hp: number }): boolean {
	if (defender.isHero || defender.allyKind === 'mirror') return false;
	return !(defender.kind === 'demonSpawner' && defender.hp <= 0);
}
