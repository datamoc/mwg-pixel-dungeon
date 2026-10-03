const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const files = ['src/items/potionEffects.ts','src/items/alchemy.ts','src/items/transmutation.ts','src/items/displayName.ts','src/content/consumables.mwl','src/content/item-rules.mwl','src/content/alchemy.mwl','src/scenes/dungeon/hero/inventoryQuickslot.ts','tools/verifyItemWorkflows.mjs','coverage/rows-items-consumables-and-crafting.md','ROADMAP.md'];
const git = (args, opts={}) => execFileSync('git', args, {encoding:'utf8', ...opts}).trim();
const head = git(['rev-parse','HEAD']);
const index = path.resolve(`tools/scratch/shielding-${Date.now()}.idx`);
const env = {...process.env, GIT_INDEX_FILE:index};
git(['read-tree',head],{env});
let patch = '';
for (const file of files.filter(f=>!f.endsWith('.md'))) {
  const before = 'tools/scratch/shielding-before/' + file.replaceAll('/','__');
  const result = spawnSync('git',['diff','--no-index','--',before,file],{encoding:'utf8'});
  if (result.status > 1) throw Error(result.stderr);
  if (!result.stdout) continue;
  patch += result.stdout.replace(/^diff --git .*$/m,`diff --git a/${file} b/${file}`).replace(/^--- .*$/m,`--- a/${file}`).replace(/^\+\+\+ .*$/m,`+++ b/${file}`);
}
fs.writeFileSync('tools/scratch/shielding-own.patch',patch);
git(['apply','--cached','--ignore-space-change','tools/scratch/shielding-own.patch'],{env});
for (const file of files.filter(f=>f.endsWith('.md'))) {
 let source=execFileSync('git',['show',head+':'+file],{encoding:'utf8'});
 const work=fs.readFileSync(file,'utf8').split(/\r?\n/);
 const prefixes=file==='ROADMAP.md'?['- [ ] **R091**','- [ ] **R112**']:['| Remaining \u0060ExoticPotion.PotionToExotic','| \u0060PotionOfShielding.apply()','| \u0060Potion.identify()'];
 for(const prefix of prefixes){const replacement=work.find(l=>l.startsWith(prefix));if(!replacement)throw Error('Missing '+prefix);const old=source.split(/\r?\n/).find(l=>l.startsWith(prefix));source=old?source.replace(old,replacement):source+'\n'+replacement+'\n';}
 if(file!== 'ROADMAP.md') source=source.replace('eleven exotic-potion and eleven exotic-scroll conversions','ten remaining exotic-potion and eleven exotic-scroll conversions');
 const blob=git(['hash-object','-w','--stdin'],{input:source});git(['update-index','--add','--cacheinfo','100644,'+blob+','+file],{env});
}
const tree = git(['write-tree'],{env});
const root = path.resolve('tools/scratch/shielding-isolated');
fs.mkdirSync(root,{recursive:true});
const archive = path.resolve('tools/scratch/shielding-isolated.tar');
git(['archive','--format=tar',`--output=${archive}`,tree]);
execFileSync('tar',['-xf',archive,'-C',root]);
fs.writeFileSync('tools/scratch/shielding-state.json',JSON.stringify({head,index,tree,root}));
console.log(git(['diff','--cached','--stat'],{env}));
