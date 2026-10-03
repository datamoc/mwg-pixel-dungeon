const fs=require('fs');const p='src/scenes/dungeonScene.ts';let s=fs.readFileSync(p,'utf8');
const m=s.match(/\tsuperNova:[^\n]*\r?\n/);s=s.replace(m[0],'');
s=s.replace('\ttimeBubblePresses = new Set<number>();','\ttimeBubblePresses = new Set<number>();\tsuperNova: { x: number; y: number; depth: number; turnsLeft: number } | null = null; //`SuperNovaTracker` (CursedWand VeryRare, v4.0.0)');
fs.writeFileSync(p,s);
