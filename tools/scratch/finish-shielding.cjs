const fs=require('node:fs');const path=require('node:path');const {execFileSync}=require('node:child_process');
const git=(args,opts={})=>execFileSync('git',args,{encoding:'utf8',...opts}).trim();
const state=JSON.parse(fs.readFileSync('tools/scratch/shielding-state.json','utf8'));
const env={...process.env,GIT_INDEX_FILE:state.index};
for(const file of ['src/generated/mwlContent.ts','src/generated/mwlI18n.json','src/generated/mwlAssets.json','src/generated/mwlAssets.ts','src/simulation/mwlBuffDurations.ts','src/simulation/mwlStatusImmunities.ts','src/simulation/mwlMonsterImmunities.ts','src/simulation/mwlMonsterStateStats.ts']) {
 let source=fs.readFileSync(path.join(state.root,file),'utf8');
 source=source.replaceAll(JSON.stringify(state.root).slice(1,-1),JSON.stringify(process.cwd()).slice(1,-1));
 const old=execFileSync('git',['show',state.head+':'+file],{encoding:'utf8'});
 if(source.replaceAll('\r\n','\n')===old.replaceAll('\r\n','\n'))continue;
 const blob=git(['hash-object','-w','--stdin'],{input:source});git(['update-index','--add','--cacheinfo','100644,'+blob+','+file],{env});
}
state.tree=git(['write-tree'],{env});fs.writeFileSync('tools/scratch/shielding-state.json',JSON.stringify(state));
console.log(git(['diff','--cached','--stat'],{env}));
if(process.argv[2]==='commit'){
 const commit=git(['commit-tree',state.tree,'-p',state.head,'-m','Port Potion of Shielding effects and conversion']);
 git(['update-ref','HEAD',commit,state.head]);console.log(git(['show','--stat','--oneline',commit]));
}
