/**
 * `ScrollOfMetamorphosis` and `Hero.metamorphedTalents` (`items/scrolls/exotic/ScrollOfMetamorphosis.java`, `ui/TalentButton.java`,
 * `actors/hero/Talent.java`, tag `v3.3.8`) as pure rules. The scroll swaps one of the hero's talents for a talent of another class at the same
 * tier, keeping the points spent in it; the swap is recorded as original -> current in `metamorphedTalents`, which `initClassTalents` applies.
 * The scene (`scenes/dungeon/metamorphScroll.ts`) owns the windows and the talent ranks.
 */
export type MetamorphMap = Record<string, string>;

export interface MetamorphRandom { element<T>(list: readonly T[]): T }

const mapsByScene = new WeakMap<object, MetamorphMap>();

/** The scene's live `metamorphedTalents` (original -> replacement). */
export function metamorphedFor(scene: object): MetamorphMap {
	let map = mapsByScene.get(scene);
	if (!map) {
		map = {};
		mapsByScene.set(scene, map);
	}
	return map;
}

/** A class's talent ids at a tier as `initClassTalents` lists them, after the replacements. */
export function currentTierIds(base: readonly string[], map: MetamorphMap): string[] {
	return base.map((id) => map[id] ?? id);
}

/**
 * `WndMetamorphReplace`'s option roll: for every class whose tier does not contain `replacing`, one random talent of that class's tier
 * that the hero does not already have. Java walks each class's list in order and drops the talents the hero holds only until it reaches
 * `replacing` itself (a class that contains `replacing` offers nothing); the same walk is kept here, quirk included.
 */
export function metamorphOptions(
	replacing: string, heroTierIds: ReadonlySet<string>, classTiers: ReadonlyArray<readonly string[]>, random: MetamorphRandom,
): string[] {
	const options: string[] = [];
	for (const classTier of classTiers) {
		const remaining = [...classTier];
		let replacingIsInSet = false;
		for (const talent of [...classTier]) {
			if (talent === replacing) {
				replacingIsInSet = true;
				break;
			}
			if (heroTierIds.has(talent)) remaining.splice(remaining.indexOf(talent), 1);
		}
		if (!replacingIsInSet && remaining.length > 0) options.push(random.element(remaining));
	}
	return options;
}

/** The bookkeeping half of `TalentButton`'s replace callback: record `replacing` -> `talent`, simplifying a -> b -> a and a -> b -> c chains. */
export function recordMetamorph(map: MetamorphMap, replacing: string, talent: string): void {
	const replacedAlready = Object.values(map).includes(replacing);
	if (!replacedAlready) {
		map[replacing] = talent;
	} else if (map[talent] === replacing) {
		delete map[talent]; //a -> b -> a: the entry cancels out
	} else {
		for (const key of Object.keys(map)) if (map[key] === replacing) map[key] = talent; //a -> b -> c becomes a -> c
	}
}
