/**
 * `Terror.recover()` / `Dread.recover()` (`actors/buffs/Terror.java`, `Dread.java`, tag `v3.3.8`), called from `Char.damage()` for every
 * damaging hit: each lowers the fear's remaining time by 5 and ends it at 0. (`Terror.ignoreNextHit`, which `Succubus` and the
 * Friendly curse set so their own hit does not shorten it, has no seam here and is not ported.)
 */
export const FEAR_RECOVERY = 5;

export function recoverFromFear(buffs: Record<string, number | undefined>): void {
	for (const id of ['terror', 'dread']) {
		const left = buffs[id];
		if (left === undefined) continue;
		if (left - FEAR_RECOVERY <= 0) delete buffs[id];
		else buffs[id] = left - FEAR_RECOVERY;
	}
}
