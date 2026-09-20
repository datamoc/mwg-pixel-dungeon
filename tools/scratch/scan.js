// Ad-hoc class scan (scratch, not shipped): paste into evaluate_script's page context.
// args via window.__scanClass = [fx, fy] fractions of the class button on the landscape select screen.
// Starts a run as that class, then per depth: enterLevel, 60 waits under god mode, and finally uses
// every consumable and round-trips saveRun/loadRun. Returns only what went wrong.
async () => {
const w=ms=>new Promise(r=>setTimeout(r,ms));
window.__errs=[]; window.addEventListener('error',e=>window.__errs.push('E:'+e.message)); window.addEventListener('unhandledrejection',e=>window.__errs.push('R:'+String(e.reason&&e.reason.stack||e.reason).slice(0,300)));
window.__tap=(fx,fy)=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();const x=r.left+fx*r.width,y=r.top+fy*r.height;const o={clientX:x,clientY:y,bubbles:true,pointerId:1,pointerType:'mouse',isPrimary:true,button:0};for(const t of ['pointermove','pointerdown','pointerup','click'])c.dispatchEvent(new PointerEvent(t,{...o,buttons:t==='pointerdown'?1:0}));};
const [cx,cy]=window.__scanClass;
await w(5000); window.__tap(0.44,0.515); await w(2500); window.__tap(cx,cy); await w(1500); window.__tap(332/1999,815/976); await w(8000);
let s=window.__MWG__.currentScene; if(!s['hero']) return {fatal:'no hero after start'};
const cls=s['heroClass']; const problems=[];
for(let d=1; d<=25; d++){
  s=window.__MWG__.currentScene; const before=window.__errs.length;
  try{ s['depth']=d; s['deepestDepth']=Math.max(s['deepestDepth']||0,d); s['justDescended']=true; s['enterLevel'](); }catch(e){ problems.push({d,enter:String(e.stack||e).slice(0,300)}); continue; }
  await w(900); s=window.__MWG__.currentScene; const h=s['hero'];
  for(let i=0;i<60;i++){ try{ if(!s['gameWindows'].isEmpty) s['gameWindows'].closeAll(); h.hp=h.maxHp; s['onAction']('wait'); }catch(e){ problems.push({d,turn:String(e.stack||e).slice(0,300)}); break; } if(i%20===0) await w(20); }
  await w(200); const errs=window.__errs.slice(before); if(errs.length) problems.push({d,errs});
}
s=window.__MWG__.currentScene;
const ids='potionStrength potionHealing potionMindVision potionFrost potionFlame potionToxicGas potionHaste potionInvis potionLevitation potionParalyticGas potionPurity potionExperience scrollUpgrade scrollIdentify scrollCleanse scrollMirror scrollRecharging scrollTeleportation scrollLullaby scrollMapping scrollRage scrollRetribution scrollTerror scrollTransmutation stoneOfAugmentation stoneOfFear stoneOfDeepSleep stoneOfShock stoneOfBlast stoneOfBlink stoneOfClairvoyance stoneOfEnchantment stoneOfIntuition stoneOfDetectMagic stoneOfFlock stoneOfAggression'.split(' ');
s['depth']=4; s['justDescended']=true; s['enterLevel'](); await w(1200); s=window.__MWG__.currentScene;
for(const id of ids){ const before=window.__errs.length; let exc=null;
  try{ s['bag'].add({id,quantity:1,stackable:true,identified:true}); const it=s['bag'].find(id); s['hero'].hp=s['hero'].maxHp; s['useItemById'](id,it?.instanceId); await w(200); if(!s['gameWindows'].isEmpty) s['gameWindows'].closeAll(); }catch(e){ exc=String(e.stack||e).slice(0,300); }
  const errs=window.__errs.slice(before); if(exc||errs.length) problems.push({item:id,exc,errs}); }
const before=window.__errs.length;
try{ const snap=JSON.stringify([s['depth'],s['hero'].x,s['hero'].y]); s['saveRun'](); await w(300); s['loadRun'](); await w(2500); const s2=window.__MWG__.currentScene; const after=JSON.stringify([s2['depth'],s2['hero']?.x,s2['hero']?.y]); if(snap!==after) problems.push({saveLoad:{snap,after}}); }catch(e){ problems.push({saveLoad:String(e.stack||e).slice(0,300)}); }
if(window.__errs.length>before) problems.push({saveLoadErrs:window.__errs.slice(before)});
return {cls,problems}; }
