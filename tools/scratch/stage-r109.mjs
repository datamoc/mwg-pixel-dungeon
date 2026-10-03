// Scratch: stage R109 blobs into the private index WITHOUT git-apply (its
// parser chokes on these patches for unknown reasons). Line ops run against
// HEAD blobs; every anchor must match exactly once. NOT committed.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const git = (args, input) => execFileSync('git', args, { encoding: 'utf8', input });
const head = (file) => git(['show', `HEAD:${file}`]);
const work = (file) => readFileSync(file, 'utf8');

function stageBlob(file, content) {
	const hash = git(['hash-object', '-w', '--stdin'], content).trim();
	git(['update-index', '--cacheinfo', `100644,${hash},${file}`]);
	console.log(`staged ${file} -> ${hash.slice(0, 8)}`);
}
function once(text, anchor, file) {
	const n = text.split(anchor).length - 1;
	if (n !== 1) { console.error(`${file}: anchor x${n}: ${anchor.slice(0, 80)}`); process.exit(1); }
}

// Whole files already verified pure-R109: hash the worktree bytes directly.
for (const f of [
	'src/items/holyTome.ts',
	'src/scenes/dungeon/hero/clericSpellFlows.ts',
	'src/simulation/clericSpells.ts',
	'src/scenes/dungeon/combatResolution.ts',
	'src/scenes/floorState.ts',
	'src/simulation/buffs.ts',
	'src/simulation/mwlBuffDurations.ts',
	'src/content/buff-rules.mwl',
	'src/items/displayName.ts',
	'src/ui/buffInfo.ts',
	'tools/verifyClericSpells.mjs',
	'tools/verifyCombat.mjs',
]) stageBlob(f, work(f));

// combat.ts: insert the payload field after shieldOfLightTarget.
{
	const f = 'src/combat.ts';
	const h = head(f);
	const anchor = '\tshieldOfLightTarget?: string;\n';
	once(h, anchor, f);
	const add = [
		'\t/**',
		'\t * `BeamingRay.BeamingRayBoost.object` (`actors/hero/spells/BeamingRay.java`,',
		'\t * tag `v3.3.8`): the enemy id the boosted ally answers to. Java keeps it on',
		'\t * the buff; this port\'s buff map holds durations only, so it lives here with',
		'\t * the other per-creature payloads. Meaningful only while',
		'\t * `buffs[\'beamingRayBoost\']` is up.',
		'\t */',
		'\tbeamingRayTarget?: string;',
	].join('\n') + '\n';
	stageBlob(f, h.replace(anchor, anchor + add));
}

// inventoryQuickslot.ts: spell-list line + resolveBeamingRay bridge.
{
	const f = 'src/scenes/dungeon/hero/inventoryQuickslot.ts';
	const h = head(f);
	const oldPick = '|| spell === \'judgement\' || spell === \'flash\') onPick(spell as TomeSpellId | TalentSpellId | SubclassSpellId);';
	const newPick = '|| spell === \'judgement\' || spell === \'flash\' || spell === \'beamingRay\') onPick(spell as TomeSpellId | TalentSpellId | SubclassSpellId);';
	once(h, oldPick, f);
	const anchor = '\t\t\t\tascendedFlashCasts: () => scene.ascendedFlashCasts, resolveFlash: (cell, instanceId) => scene.resolveFlash(cell, instanceId),\n';
	once(h, anchor, f);
	const add = '\t\t\t\tresolveBeamingRay: (cell, instanceId) => scene.resolveBeamingRay(cell, instanceId),\n';
	stageBlob(f, h.replace(oldPick, newPick).replace(anchor, `${anchor}${add}`));
}

// coreSpawnTiles.ts: save + load lines (load goes after the peer's
// allyDefendCell line, which stays untouched).
{
	const f = 'src/scenes/dungeon/coreSpawnTiles.ts';
	const h = head(f);
	const saveAnchor = '\t\t\t\tpotPos: creature.potPos ? { ...creature.potPos } : undefined, potHolderId: creature.potHolderId,\n';
	once(h, saveAnchor, f);
	const loadAnchor = '\t\t\t\tallyDefendCell: saved.allyDefendCell ? { ...saved.allyDefendCell } : undefined,\n';
	once(h, loadAnchor, f);
	stageBlob(f, h
		.replace(saveAnchor, `${saveAnchor}\t\t\t\t\tbeamingRayTarget: creature.beamingRayTarget,\n`)
		.replace(loadAnchor, `${loadAnchor}\t\t\t\tbeamingRayTarget: saved.beamingRayTarget,\n`));
}

// mwlContent.ts: insert the emitted beamingRayBoost row after the oozeActed row.
// Anchor on the generated block's closing + the following array close.
{
	const f = 'src/generated/mwlContent.ts';
	const h = head(f);
	const anchor = '"buff": "oozeActed",';
	once(h, anchor, f);
	const wlines = work(f).split('\n');
	const wi = wlines.findIndex((l) => l.includes('"buff": "beamingRayBoost",'));
	if (wi < 0) { console.error('worktree beaming row missing'); process.exit(1); }
	// Walk up to the row's own opening line (a bare '{' at the row indent).
	let rowOpen = wi;
	while (rowOpen >= 0 && wlines[rowOpen].trim() !== '{') rowOpen--;
	if (rowOpen < 0) { console.error('row open not found'); process.exit(1); }
	// Walk down balancing braces to the row's closing line.
	let depth = 0, rowClose = -1;
	for (let i = rowOpen; i < wlines.length; i++) {
		for (const ch of wlines[i]) {
			if (ch === '{') depth++;
			else if (ch === '}') depth--;
		}
		if (depth === 0) { rowClose = i; break; }
	}
	if (rowClose < 0) { console.error('row close not found'); process.exit(1); }
	if (!/^\s*\},?\s*$/.test(wlines[rowClose])) { console.error(`unexpected close line: ${wlines[rowClose]}`); process.exit(1); }
	let rowText = `${wlines.slice(rowOpen, rowClose + 1).join('\n')}\n`;
	// Insert after the oozeActed row's closing '},' line in HEAD.
	const oozeLine = '\t\t\t\t\t\t\t"duration": "9999"';
	// Locate oozeActed row end in HEAD: find the anchor, then the next '},' line.
	const hi = h.indexOf(anchor);
	const closeIdx = h.indexOf('\n\t\t\t\t\t\t}', hi);
	if (closeIdx < 0) { console.error('ooze row close not found'); process.exit(1); }
	const insertAt = closeIdx + '\n\t\t\t\t\t\t}'.length + 1; // after '},' newline
	// Reconstruct: HEAD up to end of ooze row line, then the worktree row block (reindented as-is), then rest.
	const headRowEnd = h.indexOf('\n', h.indexOf(anchor));
	const oozeCloseLineEnd = h.indexOf('\n', closeIdx + 1);
	// In HEAD the ooze row closes the array (no comma); with the new sibling it
	// needs one.
	const beforeTrim = h.slice(0, oozeCloseLineEnd);
	if (!beforeTrim.endsWith('}')) { console.error('ooze close shape changed'); process.exit(1); }
	const afterText = h.slice(oozeCloseLineEnd + 1);
	// Sibling rows share the emitter's indentation, so the worktree block drops
	// in verbatim - no reindentation.
	stageBlob(f, `${beforeTrim},\n${rowText}${afterText}`);
	console.log(`mwlContent row block: ${rowText.length} chars from worktree`);
}

// ROADMAP + hero rows: single-line replacement.
function replaceLine(file, oldRe, getNew) {
	const h = head(file);
	const w = work(file);
	const oi = h.split('\n').findIndex((l) => oldRe.test(l));
	const ni = w.split('\n').findIndex((l) => oldRe.test(l) || getNew.test(l));
	const wlines = w.split('\n');
	const nline = wlines.find((l) => getNew.test(l));
	if (oi < 0 || !nline) { console.error(`${file}: row anchor missing`); process.exit(1); }
	const hlines = h.split('\n');
	hlines[oi] = nline;
	stageBlob(file, hlines.join('\n'));
}
replaceLine('ROADMAP.md', /^- \[ \] \*\*R109\*\*/, /^- \[x\] \*\*R109\*\*/);
replaceLine('coverage/rows-hero-and-armor-abilities.md', /^\| The Cleric spell system entire/, /Ported \(R109/);
console.log('all blobs staged');
