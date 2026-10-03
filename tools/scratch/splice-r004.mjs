// R004 correction splice: HEAD blob + own hunks only (AGENTS.md private-index protocol).
// R004 stays OPEN; this corrects the false "neither exists" claim in the ROADMAP item,
// the stale "no bow item" sentence in row 9, and the matching code comment in itemKinds.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

const cat = (p) => execFileSync('git', ['cat-file', 'blob', `HEAD:${p}`], { maxBuffer: 1 << 28 }).toString('utf8');
mkdirSync('tools/scratch/r004', { recursive: true });

const jobs = [
	{
		src: 'ROADMAP.md', out: 'tools/scratch/r004/ROADMAP.md',
		old: "- [ ] **R004** _(CurseInfusion.onItemSelected() / InventorySpell.usableOnItem())_ **Not ported**: Java's `MagesStaff`/`SpiritBow` targeting (neither exists as a port item).",
		new: "- [ ] **R004** _(CurseInfusion.onItemSelected() / InventorySpell.usableOnItem())_ Corrected 2026-10-01: the old \"neither exists as a port item\" is false - `magesstaff` is the Mage's starter `weaponReward` (with the `imbueStaff`/`imbueStaffLevel` embed) and `spiritBow` enters the Huntress's bag at `coreSpawnTiles.ts:311`, and both pass `usableForCurseInfusion`, so Java's target set is covered. What stays **Not ported**: (a) the explicit `SpiritBow` clause's meaning - Java's `SpiritBow.isUpgradable()` is false while the port's fallback treats the bow as upgradable, so upgradable-item selectors admit it where Java refuses; (b) `onItemSelected`'s `MagesStaff.updateWand(true)` leg - the embedded wand's level sync plus current-charge +1 has no call site in the port's derived embed state; (c) `relabelAfterInfusion` only relabels missile stacks, so the +1 marker does not itself push hero stats as Java's in-method update does.",
	},
	{
		src: 'coverage/rows-items-equipment-and-artifacts.md', out: 'tools/scratch/r004/rows-items-equipment-and-artifacts.md',
		old: "since every artifact here is non-upgradable and there is no bow *item* (the Huntress's bow is class state, not `belongings`), so the bow clause has nothing to match and is recorded rather than modeled.",
		new: "since every artifact here is non-upgradable; **corrected 2026-10-01**: the Huntress's bow *is* a port item now - `coreSpawnTiles.ts:311` adds `spiritBow` to the bag and `combatResolution.ts` runs its equipped `proc()` - and it reaches the set through this id-vocabulary fallback (no slot entry, so equipable and upgradable) rather than Java's explicit clause: the outcome matches for this selector, but the port still treats the bow as upgradable where Java's `SpiritBow.isUpgradable()` is false, and `onItemSelected`'s `MagesStaff.updateWand(true)` leg (embedded-wand level sync plus current-charge +1) has no call site in this port's derived `imbueStaffLevel`/`wandType` embed - both open in R004.",
	},
	{
		src: 'src/items/itemKinds.ts', out: 'tools/scratch/r004/itemKinds.ts',
		old: ' * clauses add nothing (no bow item exists; wands are already upgradable). Stated separately',
		new: ' * clauses add nothing (the bow - granted by `coreSpawnTiles` - reaches the set through this\n * fallback since it has no slot entry, and wands are already upgradable). Stated separately',
	},
];

const count = (text, needle) => text.split(needle).length - 1;

for (const job of jobs) {
	const head = cat(job.src);
	const n = count(head, job.old);
	if (n !== 1) throw new Error(`${job.src}: expected exactly 1 old segment in HEAD, got ${n}`);
	const wt = readFileSync(job.src, 'utf8').replace(/\r\n/g, '\n');
	if (count(wt, job.new) !== 1) throw new Error(`${job.src}: worktree edit not found (new segment count != 1)`);
	writeFileSync(job.out, head.replace(job.old, job.new));
	console.log(`spliced: ${job.out}`);
}
