import assert from 'node:assert/strict';
export default async function(game){
 await game.startGame();
 for(let i=0;i<100 && await game.findText('^Descente$|^Descending$');i++)await new Promise(r=>setTimeout(r,100));
 const anchor=await game.eval(`(() => {
  scene.creatures = [];
  scene.bag.add({id:'beaconOfReturning',quantity:1,stackable:true,identified:true,instanceId:'gate-beacon'});
  window.gateSpellCalls=[]; const original=scene.onScrollUsed.bind(scene);
  scene.onScrollUsed=(...args)=>{window.gateSpellCalls.push(args); original(...args);};
  scene.useBeaconOfReturning('gate-beacon'); scene.inventoryOpen=true; scene.refresh();
  const item=scene.bag.find('beaconOfReturning','gate-beacon');
  return {quantity:item?.quantity ?? 0,depth:item?.returnDepth,x:item?.returnX,y:item?.returnY,heroX:scene.hero.x,heroY:scene.hero.y,calls:window.gateSpellCalls};
 })()`);
 assert.equal(anchor.quantity,1);assert.equal(anchor.depth,1);assert.equal(anchor.x,anchor.heroX);assert.equal(anchor.y,anchor.heroY);assert.deepEqual(anchor.calls,[]);
 await game.screenshot('tools/scratch/browser-test/beacon-anchor-retained.png');
 const returned=await game.eval(`(() => {
  const item=scene.bag.find('beaconOfReturning','gate-beacon');
  const neighbors=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:scene.hero.x+dx,y:scene.hero.y+dy}));
  const move=neighbors.find(p=>scene.level.passable(p.x,p.y)); if(!move)throw Error('No open neighbor');
  scene.hero.x=move.x;scene.hero.y=move.y;scene.useBeaconOfReturning('gate-beacon');scene.inventoryOpen=false;scene.refresh();
  return {quantity:scene.bag.find('beaconOfReturning','gate-beacon')?.quantity ?? 0,x:scene.hero.x,y:scene.hero.y,calls:window.gateSpellCalls};
 })()`);
 assert.equal(returned.quantity,0);assert.equal(returned.x,anchor.x);assert.equal(returned.y,anchor.y);assert.deepEqual(returned.calls,[[1,1/3]]);
 await game.screenshot('tools/scratch/browser-test/beacon-return-consumed.png');assert.deepEqual(game.consoleErrors(),[]);
 console.log('PASS real Beacon anchor retains spell and skips talents; return consumes once, runs hook once and restores position; no console errors.');
}
