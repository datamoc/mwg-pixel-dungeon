const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const git=(args,opts={})=>cp.execFileSync('git',args,{encoding:'utf8',...opts}).trim();
const stateFile='tools/scratch/item-gate-commit.json';
if(process.argv[2]==='prepare'){
 const head=git(['rev-parse','HEAD']);const index=path.resolve('tools/scratch/item-gate-'+Date.now()+'.idx');const env={...process.env,GIT_INDEX_FILE:index};git(['read-tree',head],{env});
 const files=[['tools/verifyItemWorkflows.mjs',fs.readFileSync('tools/scratch/item-gate-fixed.mjs','utf8')],['src/items/beacon.ts',fs.readFileSync('src/items/beacon.ts','utf8')]];
 const sourceTest=cp.execFileSync('git',['show',head+':tools/verifyItemWorkflows.mjs'],{encoding:'utf8'});
 if(git(['hash-object','--stdin'],{input:sourceTest})!=='e0da3c4b6dfc727b0a522088567f88f0fb3e815b9' && sourceTest!==cp.execFileSync('git',['show','97f18d6b:tools/verifyItemWorkflows.mjs'],{encoding:'utf8'}))throw Error('HEAD verifier changed: rebase and verify first');
 for(const [file,part] of [['coverage/rows-ui-visual-audio-and-i18n.md','item-gate-coverage.md'],['coverage/rows-items-consumables-and-crafting.md','item-gate-beacon-coverage.md'],['CLOSED.md','item-gate-closed.md']]){
  const old=cp.execFileSync('git',['show',head+':'+file],{encoding:'utf8'});files.push([file,old+fs.readFileSync('tools/scratch/'+part,'utf8')]);
 }
 for(const[file,source]of files){const blob=git(['hash-object','-w','--stdin'],{input:source});git(['update-index','--add','--cacheinfo','100644,'+blob+','+file],{env});}
 const tree=git(['write-tree'],{env});fs.writeFileSync(stateFile,JSON.stringify({head,index,tree}));console.log(git(['diff','--cached','--stat'],{env}));
}else if(process.argv[2]==='commit'){
 const {head,tree}=JSON.parse(fs.readFileSync(stateFile,'utf8'));const commit=git(['commit-tree',tree,'-p',head,'-m','Repair item workflow gate and Beacon anchoring']);git(['update-ref','HEAD',commit,head]);console.log(git(['show','--stat','--oneline',commit]));
}else throw Error('Expected prepare or commit');
