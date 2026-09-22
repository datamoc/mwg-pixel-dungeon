export interface HiddenMimicContactInput {
	kind?: string;
	mimicRevealed?: boolean;
	attackerIsHero: boolean;
	attackMode?: string;
	adjacent: boolean;
	invisible: boolean;
	timeStopped: boolean;
	depth: number;
}

export interface HiddenMimicContactPlan {
	reveal: 'none' | 'chest' | 'crystal';
	revealWhen: 'none' | 'beforeAttack' | 'onHit';
	counterattack: boolean;
	cancelHeroAttack: boolean;
	counterDamage: number;
}

/** Pure decision for `Mimic.interact()`/`defenseProc()` and the inherited
 * `CrystalMimic` behavior (`actors/mobs/Mimic.java`/`CrystalMimic.java`, tag `v3.3.8`).
 * An adjacent hero melee bump reveals and cancels the hero's swing; a visible, unstopped
 * hero also takes the hidden Mimic's guaranteed flat hit. Other attack paths reveal only
 * after a successful hit, as Java's `defenseProc()` does. */
export function planHiddenMimicContact(input: HiddenMimicContactInput): HiddenMimicContactPlan {
	const reveal = input.kind === 'mimic' ? 'chest' : input.kind === 'crystalMimic' ? 'crystal' : 'none';
	const hidden = input.kind === 'mimic' ? input.mimicRevealed === false
		: input.kind === 'crystalMimic' ? !input.mimicRevealed : false;
	if (!hidden || reveal === 'none') {
		return { reveal: 'none', revealWhen: 'none', counterattack: false, cancelHeroAttack: false, counterDamage: 0 };
	}
	const heroBump = input.attackerIsHero && input.attackMode !== 'throw' && input.adjacent;
	const counterattack = heroBump && !input.invisible && !input.timeStopped;
	return {
		reveal,
		revealWhen: heroBump ? 'beforeAttack' : 'onHit',
		counterattack,
		cancelHeroAttack: heroBump,
		counterDamage: counterattack ? 2 + 2 * input.depth : 0,
	};
}
