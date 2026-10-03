// R058 correction splice (private-index protocol): restore the harvest-cut item (title
// fragment, stray table pipe, no residual statement) and the notes-12 row's subject cell.
// R058 stays OPEN - the vault branch is still genuinely unported (re-verified, absence pinned).
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

const cat = (p) => execFileSync('git', ['cat-file', 'blob', `HEAD:${p}`], { maxBuffer: 1 << 28 }).toString('utf8');
mkdirSync('tools/scratch/r058', { recursive: true });

const count = (text, needle) => text.split(needle).length - 1;

const jobs = [
	{
		src: 'ROADMAP.md', out: 'tools/scratch/r058/ROADMAP.md',
		old: "- [ ] **R058** _(VaultSentry NPC + the vault branch (VaultLevel, levels/rooms/quest/vault/*, CrystalKey, Va)_ | `VaultSentry` NPC + the vault branch (`VaultLevel`, `levels/rooms/quest/vault/*`, `CrystalKey`, `VaultFlameTraps`)",
		new: "- [ ] **R058** _(VaultSentry NPC + the vault branch (VaultLevel, levels/rooms/quest/vault/*, CrystalKey, VaultFlameTraps))_ **Not ported** (2026-09-21, closing the last open NPC; text restored 2026-10-01 after the harvest cut the item to a fragment): Java's `actors/mobs/npcs/VaultSentry.java` is an immovable sentry whose `act()` sweeps a `ConeAOE` scan slice with warning/ZAP/CheckedCell presentation, and it spawns only from the twelve `vault/*` quest rooms plus the `treasure` subdir on the crystal-key `VaultLevel` branch - none of which this port generates. Re-verified 2026-10-01: no `quest/vault` room, no `VaultLevel`, no spawn kinds and no quest state, with the absence pinned by `verifySimulation.mjs`' \"the vault branch stays fully absent\" check; its NPC `ConeAOE` visuals also have no port equivalent, so porting the mob alone would be dead code.",
	},
	{
		src: 'coverage/notes-12-0-5-0-adoption.md', out: 'tools/scratch/r058/notes-12-0-5-0-adoption.md',
		old: "(open residual moved to `ROADMAP.md` R058) | Unported: no spawn kinds, no room tables, no quest state",
		new: "`VaultSentry` NPC + the vault branch (`VaultLevel`, `levels/rooms/quest/vault/*`, `CrystalKey`, `VaultFlameTraps`) | Unported: no spawn kinds, no room tables, no quest state",
	},
];

for (const job of jobs) {
	const head = cat(job.src);
	const n = count(head, job.old);
	if (n !== 1) throw new Error(`${job.src}: old segment count in HEAD = ${n}, expected 1`);
	const wt = readFileSync(job.src, 'utf8').replace(/\r\n/g, '\n');
	if (count(wt, job.new) !== 1) throw new Error(`${job.src}: worktree edit not found`);
	writeFileSync(job.out, head.replace(job.old, job.new));
	console.log(`spliced: ${job.out}`);
}
