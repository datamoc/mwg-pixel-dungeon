// Ad-hoc playtest bot (scratch, not shipped): paste into evaluate_script's page context.
// Starts a Warrior run, walks to the stairs, searches for secret doors when boxed in,
// dismisses/answers modal windows, and records depth changes + page errors in window.__bot.
async () => {
const w=ms=>new Promise(r=>setTimeout(r,ms));
window.__errs=[]; window.addEventListener('error',e=>window.__errs.push('E:'+e.message)); window.addEventListener('unhandledrejection',e=>window.__errs.push('R:'+String(e.reason&&e.reason.stack||e.reason).slice(0,400)));
window.__tap=(fx,fy)=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();const x=r.left+fx*r.width,y=r.top+fy*r.height;const o={clientX:x,clientY:y,bubbles:true,pointerId:1,pointerType:'mouse',isPrimary:true,button:0};for(const t of ['pointermove','pointerdown','pointerup','click'])c.dispatchEvent(new PointerEvent(t,{...o,buttons:t==='pointerdown'?1:0}));};
await w(2500); window.__tap(0.517,0.493); await w(1500); window.__tap(0.256,0.977); await w(1000); window.__tap(0.5,0.9); await w(6000);
const NAMES={'0,-1':'up','0,1':'down','-1,0':'left','1,0':'right','-1,-1':'upLeft','1,-1':'upRight','-1,1':'downLeft','1,1':'downRight'};
const B=window.__bot={on:true,log:[],steps:0,maxDepth:1,god:true,searches:0,win:0,lastPos:null,same:0};
const bfs=(s,from,goalFn)=>{const lv=s['level'],doors=s['doors'],sec=s['secrets'];const key=(x,y)=>x+','+y;const prev=new Map([[key(from.x,from.y),null]]);const q=[from];let found=null;
 while(q.length){const c=q.shift();if(goalFn(c)){found=c;break;}
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(!dx&&!dy)continue;const nx=c.x+dx,ny=c.y+dy,k=key(nx,ny);if(prev.has(k)||!lv.inside(nx,ny))continue;
   if(sec.isSecret(nx,ny))continue;const door=doors.isDoor(nx,ny);if(door&&dx&&dy)continue;const goal=goalFn({x:nx,y:ny});
   if(!goal&&!door&&!s['canStepOnto'](nx,ny))continue;prev.set(k,c);q.push({x:nx,y:ny});}}
 if(!found)return null;const path=[];let c=found;while(c&&!(c.x===from.x&&c.y===from.y)){path.push(c);c=prev.get(key(c.x,c.y));}return path.reverse();};
B.tick=()=>{if(!B.on)return;const s=window.__MWG__.currentScene;if(!s||!s['hero']||!s['level']||!s['gameWindows'])return;
 try{
  if(s['gameWindows']&&!s['gameWindows'].isEmpty){B.win++; if(B.win%2===1) window.__tap(0.498,0.494); else s['gameWindows'].closeAll(); return;}
  const h=s['hero'];if(B.god)h.hp=h.maxHp;
  if(s['depth']!==B.lastDepth){B.lastDepth=s['depth'];B.log.push('depth '+s['depth']+' steps '+B.steps);B.maxDepth=Math.max(B.maxDepth,s['depth']);B.same=0;}
  const pk=h.x+','+h.y+'@'+s['depth']; if(pk===B.lastPos)B.same++; else {B.same=0;B.lastPos=pk;}
  if(B.same===60){B.log.push('NO-PROGRESS d'+s['depth']+' hero '+pk+' stairs '+JSON.stringify(s['stairs'])+' npcs '+s['creatures'].filter(c=>c.isNPC).map(c=>c.kind+'@'+c.x+','+c.y));}
  const st=s['stairs'],lv=s['level'];let path=bfs(s,{x:h.x,y:h.y},c=>c.x===st.x&&c.y===st.y);
  if(!path){
   const nearSecret=c=>{for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(lv.inside(c.x+dx,c.y+dy)&&s['secrets'].isSecret(c.x+dx,c.y+dy))return true;}return false;};
   if(nearSecret({x:h.x,y:h.y})){s['onAction']('search');B.searches++;B.steps++;return;}
   path=bfs(s,{x:h.x,y:h.y},nearSecret);
   if(!path){B.log.push('TRULY STUCK d'+s['depth']+' '+h.x+','+h.y+' stairs '+JSON.stringify(st)+' hasStairs '+s['hasStairs']);B.on=false;return;}}
  const n=path[0];if(!n)return;s['onAction'](NAMES[(n.x-h.x)+','+(n.y-h.y)]);B.steps++;
 }catch(e){B.log.push('EXC d'+window.__MWG__.currentScene['depth']+' '+String(e&&e.stack||e).slice(0,700));B.on=false;}};
B.timer=setInterval(B.tick,60); return 'started';
}
