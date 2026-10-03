// R009 + R010 correction splice (private-index protocol): both harvested fragments were
// cut mid-sentence; R009's wall-decor/web subjects and R010's "region decorations remain
// unported" are now stale (both are ported). Both items stay OPEN with their real residual.
// notes-01's two split sentences are restored with dated corrections.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

const cat = (p) => execFileSync('git', ['cat-file', 'blob', `HEAD:${p}`], { maxBuffer: 1 << 28 }).toString('utf8');
mkdirSync('tools/scratch/r009-r010', { recursive: true });

const count = (text, needle) => text.split(needle).length - 1;

const jobs = [
	{
		src: 'ROADMAP.md', out: 'tools/scratch/r009-r010/ROADMAP.md',
		replacements: [
			{
				old: "- [ ] **R009** _(and Java's full heap/occupant subtype rules remain **Not ported** and are kept o)_ and Java's full heap/occupant subtype rules remain **Not ported** and are kept out of the coarse",
				new: "- [ ] **R009** _(Heap.explode() container handling and Java's heap/occupant subtype rules: skeleton/remains/tomb heap subtypes, ShatteredPot.destroyPot)_ Corrected 2026-10-01 (the harvested fragment was cut mid-sentence, and two of its three subjects are stale - sewer wall decoration is ported in `wallDecorations.ts` (`SewerLevel.addSewerVisuals`' `Sink`, Prison `Torch`, City `Smoke`, `ore`, at every painted `WALL_DECO` cell) and webs are ported as the `scene.web` blob (seeded at `dungeonScene.ts:2006`, consume-on-touch, `spreadFire` webbed-cell ignition)). What stays **Not ported**: the container and heap-subtype half of `Heap.explode()` (rows-items-consumables 19) - skeleton/remains/tomb heap subtypes and `ShatteredPot.destroyPot` (rows-items-consumables 44) - kept out of the coarse terrain model; plus the web-blob solidity gap (Java's `Web.onUpdateCellFlags()` also marks webbed cells solid; here webs root but never bar movement - stated at `spreadFire`, not yet rowed).",
			},
			{
				old: "- [ ] **R010** _(eat path. Region decorations remain unported; ordinary fire now propagates ortho)_ Region decorations remain unported; ordinary fire now propagates orthogonally onto",
				new: "- [ ] **R010** _(Region decorations: distinct sprite, per-region examine text, flamable-model remainder; fire spreads orthogonally at Java's volume 4)_ Corrected 2026-10-01 (the harvested fragment was cut mid-sentence): \"region decorations remain unported\" is stale - since 2026-09-16 `gameBridge.ts` maps `REGION_DECO`/`REGION_DECO_ALT` to `wall` with Java's SOLID passability (prison cages, Caves rails, Halls scatter and City marks block movement; boss layouts transcribe) and `isFireFlammableTerrain` burns the sewer ones at `depth <= 5`. What stays **Not ported**: their distinct sprite and the per-region `region_deco_name`/`_desc` examine text (both catalog-gap class), plus the flamable-map completeness note notes-01 carries. The fire claim stands: ordinary fire propagates orthogonally onto representable grass/door terrain with Java's volume 4 (`spreadFire`/`planFireSpread`).",
			},
		],
	},
	{
		src: 'coverage/notes-01-2026-09-11-mwg-alignment-pass.md', out: 'tools/scratch/r009-r010/notes-01-2026-09-11-mwg-alignment-pass.md',
		replacements: [
			{
				old: "  (open residual moved to `ROADMAP.md` R009)\n  terrain model.",
				new: "  and Java's full heap/occupant subtype rules remain **Not ported** and are kept out of the coarse\n  terrain model. **Corrected 2026-10-01**: the first two subjects are historical - sewer wall\n  decoration is ported (`wallDecorations.ts`, `SewerLevel.addSewerVisuals`' `Sink` at every painted\n  `WALL_DECO` cell) and webs are ported (the `scene.web` blob, seeded at `dungeonScene.ts:2006`,\n  consume-on-touch and `spreadFire`'s webbed-cell ignition) - so R009 now tracks only the\n  heap/occupant subtype half.",
			},
			{
				old: "  eat path. (open residual moved to `ROADMAP.md` R010)\n  representable grass/door terrain with Java's volume-4 seed.",
				new: "  eat path. Region decorations remain unported; ordinary fire now propagates orthogonally onto\n  representable grass/door terrain with Java's volume-4 seed. **Corrected 2026-10-01**: region\n  decorations are no longer wholly unported - `gameBridge.ts` maps `REGION_DECO`/`REGION_DECO_ALT`\n  to `wall` with Java's SOLID passability since 2026-09-16 and `isFireFlammableTerrain` burns the\n  sewer ones - so R010's remaining scope is their distinct sprite, the per-region examine text and\n  the flamable-model completeness.",
			},
		],
	},
];

for (const job of jobs) {
	const head = cat(job.src);
	let out = head;
	for (const r of job.replacements) {
		const n = count(head, r.old);
		if (n !== 1) throw new Error(`${job.src}: old segment count in HEAD = ${n}, expected 1`);
		out = out.replace(r.old, r.new);
	}
	const wt = readFileSync(job.src, 'utf8').replace(/\r\n/g, '\n');
	for (const r of job.replacements) {
		if (count(wt, r.new) !== 1) throw new Error(`${job.src}: worktree edit not found for a replacement`);
	}
	writeFileSync(job.out, out);
	console.log(`spliced: ${job.out}`);
}
