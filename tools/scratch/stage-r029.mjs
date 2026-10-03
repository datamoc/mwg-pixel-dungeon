// Scratch: stage the R029-a slice into the private index. Whole files that
// are verified pure-R109...-R029a are hashed from the worktree; shared files
// get HEAD-blob line ops. NOT committed.
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

for (const f of [
	'src/simulation/clericSpells.ts',
	'src/scenes/dungeon/combatResolution.ts',
	'src/items/displayName.ts',
	'tools/verifyClericSpells.mjs',
	'tools/verifyCombat.mjs',
]) stageBlob(f, work(f));

// weaponSpellsGear: HEAD (LF) + my two context lines (stored LF, repo norm).
{
	const f = 'src/scenes/dungeon/hero/weaponSpellsGear.ts';
	const h = head(f);
	const a = '\t\t\tweaponSourceClass: this.weaponSourceClass,\n';
	once(h, a, f);
	const b = '\t\t\tarmorSourceClass: this.armorSourceClass };\n';
	once(h, b, f);
	const wline1 = "\t\t\tweaponAffix: this.weaponAffix, holyWeaponUp: this.hero?.buffs['holyWeapon'] !== undefined,\n";
	const wline2 = "\t\t\tarmorGlyph: this.armorGlyph, holyWardUp: this.hero?.buffs['holyWard'] !== undefined };\n";
	// Sanity: the worktree carries exactly these lines (modulo its CRLF).
	const w = work(f);
	for (const l of [wline1.trim(), wline2.trim().slice(0, 40)]) {
		if (!w.includes(l)) { console.error(`${f}: worktree line missing: ${l}`); process.exit(1); }
	}
	stageBlob(f, h
		.replace(a, `${a}${wline1}`)
		.replace(b, `\t\t\tarmorSourceClass: this.armorSourceClass,\n${wline2}`));
}

// ROADMAP: R029 progress note + R110 insert, both anchored on HEAD text.
{
	const f = 'ROADMAP.md';
	const h = head(f);
	const w = work(f);
	const r029 = w.split('\n').find((l) => l.startsWith('- [ ] **R029**'));
	const r110 = w.split('\n').find((l) => l.startsWith('- [ ] **R110**'));
	if (!r029 || !r110) { console.error('R029/R110 worktree lines missing'); process.exit(1); }
	const hlines = h.split('\n');
	const oi = hlines.findIndex((l) => l.startsWith('- [ ] **R029**'));
	if (oi < 0) { console.error('HEAD R029 bullet missing'); process.exit(1); }
	hlines[oi] = r029;
	const ri = hlines.findIndex((l) => l.includes('**R109**'));
	if (ri < 0) { console.error('HEAD R109 anchor missing'); process.exit(1); }
	hlines.splice(ri + 1, 0, r110);
	stageBlob(f, hlines.join('\n'));
}

// rows-hero: HEAD + my appended tail row (verify HEAD tail matches worktree).
{
	const f = 'coverage/rows-hero-and-armor-abilities.md';
	const strip = (a) => (a[a.length - 1] === '' ? a.slice(0, -1) : a);
	const h = strip(head(f).split('\n'));
	const w = strip(work(f).split('\n'));
	const myRow = w[w.length - 1];
	if (!myRow.includes('(R029-a)')) { console.error('tail row is not R029-a'); process.exit(1); }
	const hTail = h.slice(-2).join('\n');
	const wPre = w.slice(0, -1).slice(-2).join('\n');
	if (hTail !== wPre) { console.error('tail drift - peer appended too'); process.exit(1); }
	// Also carry the LV sentence edit inside the Cleric-system row.
	const clericNew = w.find((l) => l.startsWith('| The Cleric spell system entire'));
	const clericOldIdx = h.findIndex((l) => l.startsWith('| The Cleric spell system entire'));
	if (!clericNew || clericOldIdx < 0) { console.error('cleric row anchor missing'); process.exit(1); }
	h[clericOldIdx] = clericNew;
	stageBlob(f, [...h, myRow, ''].join('\n'));
}
console.log('all R029-a blobs staged');
