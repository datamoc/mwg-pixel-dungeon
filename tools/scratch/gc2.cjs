const fs=require('fs');const p='src/scenes/dungeonScene.ts';let s=fs.readFileSync(p,'utf8');
const a=s.indexOf('\tsuperNova:');const e=s.indexOf('`GravityChaosTracker`',a)+'`GravityChaosTracker`'.length;
s=s.slice(0,a)+'\tsuperNova: { x: number; y: number; depth: number; turnsLeft: number } | null = null; gravityChaos: { left: number; wait: number } | null = null; //`SuperNovaTracker`/`GravityChaosTracker` (CursedWand VeryRare, v4.0.0)'+s.slice(e);
fs.writeFileSync(p,s);
