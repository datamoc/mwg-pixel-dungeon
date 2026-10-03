const fs=require('fs');const p='src/scenes/dungeonScene.ts';let s=fs.readFileSync(p,'utf8');
const a=s.indexOf('\t/** `SuperNovaTracker`');const e=s.indexOf('| null = null;',a)+'| null = null;'.length;
s=s.slice(0,a)+'\tsuperNova: { x: number; y: number; depth: number; turnsLeft: number } | null = null; //`SuperNovaTracker` (CursedWand VeryRare, v4.0.0)'+s.slice(e);
fs.writeFileSync(p,s);
