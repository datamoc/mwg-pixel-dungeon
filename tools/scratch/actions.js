// Ad-hoc class-actions scan (scratch, not shipped): paste into evaluate_script's page context.
// window.__scanClass = [fx, fy] of the class button. Starts a run, puts an awake rat in view, then fires
// every hero action (special, weapon/armor ability, search, talents, journal, quickslots...) answering
// any aim on the rat, and reports exceptions and page errors only.
async () => {
const w=ms=>new Promise(r=>setTimeout(r,ms));
window.__errs=[]; window.addEventListener('error',e=>window.__errs.push('E:'+e.message)); window.addEventListener('unhandledrejection',e=>window.__errs.push('R:'+String(e.reason&&e.reason.stack||e.reason).slice(0,300)));
window.__tap=(fx,fy)=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();const x=r.left+fx*r.width,y=r.top+fy*r.height;const o={clientX:x,clientY:y,bubbles:true,pointerId:1,pointerType:'mouse',isPrimary:true,button:0};for(const t of ['pointermove','pointerdown','pointerup','click'])c.dispatchEvent(new PointerEvent(t,{...o,buttons:t==='pointerdown'?1:0}));};
const [cx,cy]=window.__scanClass;
await w(5000); window.__tap(0.44,0.515); await w(2500); window.__tap(cx,cy); await w(1500); window.__tap(332/1999,815/976); await w(8000);
let s=window.__MWG__.currentScene; if(!s['hero']) return {fatal:'no hero after start'};
const out={cls:s['heroClass'],problems:[]};
let R=null;
for(let tries=0;tries<8&&!R;tries++){ s['depth']=3+tries%2; s['justDescended']=true; s['enterLevel'](); await w(1300); s=window.__MWG__.currentScene; const h=s['hero']; for(const c of [...s['creatures']]) if(!c.isHero&&!c.isNPC){ c.hp=0; try{s['kill'](c);}catch(e){} } await w(300);
  const lv=s['level']; let cell=null; for(let dy=-6;dy<=6&&!cell;dy++)for(let dx=-6;dx<=6&&!cell;dx++){ const x=h.x+dx,y=h.y+dy; if(lv.inside(x,y)&&lv.passable(x,y)&&s['fov'].isVisible(x,y)&&!s['creatureAt'](x,y)&&Math.max(Math.abs(dx),Math.abs(dy))>=2&&Math.max(Math.abs(dx),Math.abs(dy))<=3) cell=({x,y}); }
  if(cell){ R=s['spawnMonster']('rat',{x:cell.x,y:cell.y}); R.hp=R.maxHp=800; } }
if(!R) return {fatal:'no layout'};
const h=s['hero'];
const actions=['special','weaponAbility','armorAbility','search','wait','examine','talents','journal','eat','quaff','read','upgrade','preparation','quickslot0','quickslot1','quickslot2','quickslot3'];
for(const a of actions){ const before=window.__errs.length; try{ h.hp=h.maxHp; if(R.hp<=0){ R=s['spawnMonster']('rat',{x:R.x,y:R.y}); R.hp=R.maxHp=800; } s['onAction'](a); await w(250); if(s['aiming']){ try{ s['aiming'].controller.moveTo({x:R.x,y:R.y}); s['onAction']('confirm'); }catch(e){ s['onAction']('cancel'); } await w(600); } if(s['aiming']) s['onAction']('cancel'); for(let i=0;i<3&&!s['gameWindows'].isEmpty;i++){ s['gameWindows'].closeAll(); await w(80);} if(s['itemPickerOpen']){ try{s['itemPickerWindow']?.close?.();}catch(e){} } if(s['talentOpen']){ s['talentOpen']=false; s['refreshTalentPanel']?.(); } if(s['journalOpen']) s['closeJournal']?.(); if(s['inventoryOpen']){ s['inventoryOpen']=false; s['refreshInventoryPanel']?.(); } }catch(e){ out.problems.push({a,exc:String(e.stack||e).slice(0,300)}); }
  const errs=window.__errs.slice(before); if(errs.length) out.problems.push({a,errs}); }
out.alive=s['hero'].hp>0; return out; }
