import { execFileSync } from 'node:child_process';

const root = process.cwd();
const env = { ...process.env, GIT_INDEX_FILE: `${root}/tools/scratch/r038-docfix2.index` };
const git = (args, input) => execFileSync('git', args, { cwd: root, env, encoding: 'utf8', input });
const current = git(['rev-parse','HEAD']).trim();
const parent = git(['rev-parse','HEAD^']).trim();
git(['read-tree',parent]);
const files = new Map();
for (const path of ['src/items/potionEffects.ts','src/scenes/dungeon/hero/inventoryQuickslot.ts','tools/verifyItemWorkflows.mjs','ROADMAP.md']) files.set(path,git(['show',`${current}:${path}`]));
let coverage = git(['show',`${current}:coverage/rows-items-consumables-and-crafting.md`]);
const staleHaste = '(open residual moved to `ROADMAP.md` R035) It currently falls through to `quaffPotion()`\'s default branch and gets Purity\'s poison/burning-clear effect instead of its own - not merely inert, an active (if narrow) misbehavior, explicitly commented at that call site rather than left implicit.';
if (!coverage.includes(staleHaste)) throw new Error('stale Haste claim missing');
coverage = coverage.replace(staleHaste, 'The corrected Haste branch is active and browser-verified above.');
const duplicate = coverage.split(/\r?\n/).findIndex(x => x.startsWith('| `PotionOfFrost.shatter()` / `Freezing.freeze()` | `quaffPotion`\'s `potionFrost` branch |'));
if (duplicate < 0) throw new Error('obsolete duplicate Frost row missing');
const eol = coverage.includes('\r\n') ? '\r\n' : '\n';
const lines = coverage.split(/\r?\n/);
lines.splice(duplicate,1);
files.set('coverage/rows-items-consumables-and-crafting.md',lines.join(eol));
for (const [path,content] of files) {
	const oid = git(['hash-object','-w','--stdin'],content).trim();
	git(['update-index','--add','--cacheinfo',`100644,${oid},${path}`]);
}
const tree=git(['write-tree']).trim();
const amended=git(['commit-tree',tree,'-p',parent,'-m','Complete Frost potion coverage']).trim();
git(['update-ref','HEAD',amended,current]);
console.log(JSON.stringify({current,parent,commit:amended,removedDuplicate:true,updatedHasteClaim:true}));
