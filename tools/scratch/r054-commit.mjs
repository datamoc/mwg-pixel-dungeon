import { execFileSync } from 'node:child_process';

const root = process.cwd();
const env = { ...process.env, GIT_INDEX_FILE: `${root}/tools/scratch/r054-private.index` };
const git = (args, input) => execFileSync('git', args, { cwd: root, env, encoding: 'utf8', input });
const parent = git(['rev-parse','HEAD']).trim();
git(['read-tree',parent]);
function editHead(path, edit) {
	const original = git(['show',`${parent}:${path}`]);
	const eol = original.includes('\r\n') ? '\r\n' : '\n';
	const lines = original.split(/\r?\n/);
	edit(lines);
	return lines.join(eol);
}
const files = new Map();
files.set('src/scenes/dungeon/bosses/bossLogic.ts',editHead('src/scenes/dungeon/bosses/bossLogic.ts',lines=>{
	const i=lines.findIndex(x=>x.trim()==='showHeal: (target, amount) => this.showHeal(target, amount),');
	if(i<0) throw new Error('Goo showHeal callback missing');
	lines.splice(i,1,
		'\t\t\t//`Goo.act()` (`actors/mobs/Goo.java:109-122`, tag `v3.3.8`) shows its',
		'\t\t\t//positive `FloatingText.HEALING` status only inside heroFOV. The port uses',
		'\t\t\tthe same visible green heal amount, but has no floating healing-icon glyph.',
		'\t\t\t//Java also ends GooSprite spray and BossHealthBar bleed above half HP; this',
		'\t\t\t//port has no corresponding sprite or health-bar animation state.',
		'\t\t\tshowHeal: (target, amount) => { if (this.fov.isVisible(target.x, target.y)) this.showHeal(target, amount); },'
	);
}));
files.set('tools/verifyGooPhase.mjs',editHead('tools/verifyGooPhase.mjs',lines=>{
	const i=lines.findIndex(x=>x.startsWith('const { gooEnraged, gooPumpChance'));
	if(i<0) throw new Error('Goo pin import missing');
	lines[i]=lines[i].replace('gooChargeStep }','gooChargeStep, takeGooTurn }');
	const out=lines.findIndex(x=>x.startsWith("console.log('goo phase seam"));
	if(out<0) throw new Error('Goo pin final log missing');
	lines.splice(out,0,
		'//`Goo.act()` water recovery precedes the pump state machine and reduces LockedFloor by the increment rolled.',
		'{',
	'\tconst goo = { x: 1, y: 1, hp: 8, maxHp: 10, gooHealInc: 2, pumped: 1 };',
	'\tconst healed = [], lockTime = [], messages = [];',
	'\ttakeGooTurn(goo, {',
	"\t\thero: { x: 2, y: 1, hp: 20, maxHp: 20 }, inWater: () => true, strongerBosses: true,",
	'\t\tstats: () => ({ accuracy: 10, damage: [1, 2] }), attack: () => assert.fail(\'first pump turn must not attack\'),',
	'\t\tshowHeal: (target, amount) => healed.push([target, amount]), onWaterHeal: (amount) => lockTime.push(amount),',
	'\t\tsay: (message) => messages.push(message), foulBossChallenge: () => {},',
	'\t\trandom: { int: (min) => min, chance: () => true },',
	"\t\tmessages: { slam: 'slam', pump: 'pump', pumpMore: 'pump-more' },",
	'\t});',
	'\tassert.equal(goo.hp, 10);',
	"\tassert.equal(goo.gooHealInc, 1, 'full HP resets the next increment');",
	"\tassert.deepEqual(healed, [[goo, 2]], 'visible heal amount is actual HP gained');",
	"\tassert.deepEqual(lockTime, [2], 'LockedFloor removes the pre-cap heal increment');",
	'\tassert.equal(goo.pumped, 2);',
	'}',
	'',
	"const bossScene = readFileSync(new URL('../src/scenes/dungeon/bosses/bossLogic.ts', import.meta.url), 'utf8');",
	'assert.match(bossScene,',
	'\t/showHeal: \\(target, amount\\) => \\{ if \\(this\\.fov\\.isVisible\\(target\\.x, target\\.y\\)\\) this\\.showHeal\\(target, amount\\); \\}/,',
	"\t'Goo water-heal status is shown only in hero FOV, like Java Goo.showStatusWithIcon');",
	'',
	);
}));
files.set('ROADMAP.md',editHead('ROADMAP.md',lines=>{
	const i=lines.findIndex(x=>x.startsWith('- [ ] **R054**'));
	if(i<0) throw new Error('R054 open line missing');
	lines[i]='- [x] **R054** _(Goo.act() water healing and Goo.healInc)_ Completed 2026-10-01: the water-heal increment, save/load state, LockedFloor timer and heal-driven lock reduction are implemented and pinned. Java has no boss-door countdown display: LockedFloor is an internal timer with a status icon. Goo heal text is limited to hero FOV. Simplified presentation: no FloatingText.HEALING icon or GooSprite/BossHealthBar animation; these reductions are documented in the coverage row.';
}));
files.set('coverage/rows-monsters-bosses-and-combat.md',editHead('coverage/rows-monsters-bosses-and-combat.md',lines=>{
	const i=lines.findIndex(x=>x.startsWith('| `Goo.act()` water healing and `Goo.healInc` |'));
	if(i<0) throw new Error('Goo coverage row missing');
	lines[i]='| `Goo.act()` water healing / `Goo.healInc` and `LockedFloor` (`Goo.java:109-131`, `LockedFloor.java`, tag `v3.3.8`) | `simulation/gooBoss.ts`, `simulation/regeneration.ts`, `bossLogic.ts`, `turnLoopAiming.ts`; `verifyGooPhase.mjs`, `verifyRegeneration.mjs` | **Ported:** Goo heals by its persisted increment in water, grows the increment to 3 under STRONGER_BOSSES, resets it when dry/full, and reduces the hero\'s live LockedFloor timer; the timer starts on sealed boss floors, ticks in actor time, persists in saves, and is shown by Java as a status icon (there is no door countdown display). **Simplified presentation:** Goo healing appears as a positive green floater only in hero FOV, matching Java\'s visibility gate, but the `FloatingText.HEALING` icon and `GooSprite.spray(false)`/`BossHealthBar.bleed(false)` visual transitions are not represented. Pinned by `verifyGooPhase.mjs` and browser-verified (`regeneration-livecheck.mjs`, countdown and lock-time restoration; `r054-gooheal-livecheck.mjs`, heal floater/HP/lock-time; no page errors). |';
}));
for(const [path,content] of files){
	const oid=git(['hash-object','-w','--stdin'],content).trim();
	git(['update-index','--add','--cacheinfo',`100644,${oid},${path}`]);
}
const paths=[...files.keys()].sort();
const staged=git(['diff','--cached','--name-only']).trim().split(/\r?\n/).filter(Boolean).sort();
if(JSON.stringify(paths)!==JSON.stringify(staged)) throw new Error(`unexpected private index: ${staged.join(',')}`);
const tree=git(['write-tree']).trim();
const commit=git(['commit-tree',tree,'-p',parent,'-m','Complete Goo healing residual']).trim();
git(['update-ref','HEAD',commit,parent]);
console.log(JSON.stringify({parent,commit,files:staged}));
