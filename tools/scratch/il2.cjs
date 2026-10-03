const fs=require('fs');const p='src/scenes/dungeonScene.ts';let s=fs.readFileSync(p,'utf8');const nl=s.includes('\r\n')?'\r\n':'\n';
const a=s.indexOf('			const half = transition.duration / 2;');const e=s.indexOf('transition.elapsed / half : left / half;',a)+'transition.elapsed / half : left / half;'.length;
s=s.slice(0,a)+["			//Java: gradient up throughout, `aa` adds <= 0.333 opacity at both ends, text fades over each `fadeTime`.","			const half = transition.duration / 2, left = transition.duration - transition.elapsed;","			transition.curtain.alpha = Math.max(0, 0.333 - Math.min(transition.elapsed, left));","			transition.message.alpha = Math.min(transition.elapsed, left) / half;"].join(nl)+s.slice(e);
fs.writeFileSync(p,s);
