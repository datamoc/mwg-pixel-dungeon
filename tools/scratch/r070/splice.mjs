// R070 audit splice (opencode session 0153f396): rewrite the stale R070 line and open
// R113 in BOTH reconstructions - (a) the shared worktree, in place, preserving every
// peer edit that lives there, and (b) a HEAD-derived blob carrying only my two hunks,
// which is what the private index commits. Anchors are located by R-id, never transcribed.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const NEW_R070 = "- [ ] **R070** _(Plant.trigger() / non-Fadeleaf `Plant.activate(Char)` for mobs and allies (`plants/Plant.java`, tag v3.3.8))_ **Corrected 2026-10-01 (audit):** the old \"Warden-only plant branches are not modelled\" claim was stale - all twelve `activate()` Warden variants (Blindweed, Earthroot, Fadeleaf, Firebloom, Icecap, Mageroyal, Rotberry, Sorrowmoss, Starflower, Stormvine, Sungrass, Swiftthistle) dispatch through `runHeroPlantEffect`'s `subclass()` in `simulation/plantTriggers`, wired by the scene's `heroPlantContext`, landed 2026-09-19..09-22 after the residual was harvested; the citation also read `actors/buffs/Plant.java`, which is not v3.3.8's path (`plants/Plant.java`). **Still not ported:** (1) `Plant.trigger()`'s `NATURES_AID` barkskin (`heroFOV[pos] && hasTalent` -> `Barkskin.conditionallyAppend(hero, 2, 1+2*points)`, Plant.java:68-70) - the talent's only live port code sits in the high-grass trample seam instead (`grantShield(rollInt(0,3), 2)` in `simulation/highGrass.ts`, an event and a roll Java has nowhere; flagged there by comment), so it needs relocating to the plant trigger and removed from the trample; (2) `trigger()`'s `Bestiary.setSeen`/`countEncounter` (Plant.java:75-76) - this port has no journal/Bestiary system anywhere; (3) the exact Java actor timing of a stepped-on plant (this port resolves it inside the step that triggered it; the bubble/time-freeze deferred-press path itself is ported at `flushTimeBubblePresses`, but Java's `TRAMPLE` sound on deferring a plant press in `Level.pressCell` is not); (4) plant activation presentation beyond the shared feature trigger - Java's FOV-gated `LeafParticle.GENERAL` burst on `wither()` (Plant.java:84-85).";

const NEW_R113 = "- [ ] **R113** _(Warden seed halves: `Seed.onThrow`'s furrow on planting and the `warden_desc` examine append (`plants/Plant.java`, tag v3.3.8))_ **Not ported:** (1) planting a seed as a Warden furrows every adjacent `EMPTY`/`EMPTY_DECO`/`EMBERS`/`GRASS` cell into `FURROWED_GRASS` with an updateMap plus a `LeafParticle.LEVEL_SPECIFIC` burst (Plant.java:160-169) - the port's `plantSeed()` plants the seed and ends, and this port's live terrain has no `FURROWED_GRASS` id at all (its standing stand-in for Java's furrow state is `HIGH_GRASS`, as `bossLogic.ts`'s SoiledFist comment notes), so the loop needs that documented substitute; (2) `Plant.desc()` and `Seed.desc()` append `warden_desc` for a Warden (Plant.java:124-125, 222-223) - no non-generated source references `warden_desc`, so a Warden's plant and seed examine text never gains the extra paragraph. Found by the 2026-10-01 R070 audit.";

function patch(text, label) {
	const lines = text.split('\n');
	const i70 = [];
	const i112 = [];
	lines.forEach((l, i) => {
		if (l.includes('**R070**')) i70.push(i);
		if (l.includes('**R112**')) i112.push(i);
		if (l.includes('**R113**')) throw new Error(`${label}: R113 already present`);
	});
	if (i70.length !== 1) throw new Error(`${label}: expected exactly one R070, got ${i70.length}`);
	if (i112.length !== 1) throw new Error(`${label}: expected exactly one R112, got ${i112.length}`);
	if (!lines[i70[0]].startsWith('- [ ] **R070**')) throw new Error(`${label}: R070 is not an open item line`);
	if (!lines[i112[0]].startsWith('- [ ] **R112**')) throw new Error(`${label}: R112 is not an open item line`);
	lines[i70[0]] = NEW_R070;
	lines.splice(i112[0] + 1, 0, NEW_R113);
	return lines.join('\n');
}

// (a) shared worktree, in place - peers' edits ride along untouched.
const wt = readFileSync('ROADMAP.md', 'utf8');
if (wt.includes('\r')) throw new Error('worktree ROADMAP carries CR - expected LF-pure');
writeFileSync('ROADMAP.md', patch(wt, 'worktree'));

// (b) HEAD-derived blob with only my two hunks.
const head = execSync('git show HEAD:ROADMAP.md', { maxBuffer: 1 << 27 }).toString();
if (head.includes('\r')) throw new Error('HEAD ROADMAP blob carries CR - expected LF-pure');
mkdirSync('tools/scratch/r070', { recursive: true });
const headMine = patch(head, 'HEAD');
writeFileSync('tools/scratch/r070/roadmap-head-mine.md', headMine);

const shaR = execSync('git hash-object -w --path=ROADMAP.md tools/scratch/r070/roadmap-head-mine.md').toString().trim();
const shaRows = execSync('git hash-object -w coverage/rows-architecture-mwg-and-simulation.md').toString().trim();
const shaGrass = execSync('git hash-object -w src/simulation/highGrass.ts').toString().trim();

// verification output for the caller
const wtAfter = readFileSync('ROADMAP.md', 'utf8');
console.log(JSON.stringify({
	shaR, shaRows, shaGrass,
	worktree: {
		r070New: wtAfter.includes('Corrected 2026-10-01 (audit)'),
		r113: wtAfter.includes('**R113**'),
		lines: wtAfter.split('\n').length,
	},
	headBlob: { lines: headMine.split('\n').length, r113: headMine.includes('**R113**') },
}, null, 1));
