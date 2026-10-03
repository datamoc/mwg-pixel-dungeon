import assert from 'node:assert/strict';
export default async function(game){
 await game.startGame();
 for(let i=0;i<100 && await game.findText('^Descente$|^Descending$');i++)await new Promise(r=>setTimeout(r,100));
 const result=await game.eval(`(() => {
  scene.creatures=[];
  scene.bag.add({id:'blandfruit',instanceId:'blandfruit:potionFrost',potionAttrib:'potionFrost',quantity:1,identified:true,stackable:true});
  scene.bag.add({id:'blandfruit',instanceId:'blandfruit:potionHealing',potionAttrib:'potionHealing',quantity:1,identified:true,stackable:true});
  scene.bag.add({id:'blandfruit',quantity:2,identified:true,stackable:true});
  scene.inventoryOpen=true;scene.refresh();
  const entries=scene.inventoryPanel.carried;
  const ice=entries.find(e=>e.instanceId==='blandfruit:potionFrost');
  const sun=entries.find(e=>e.instanceId==='blandfruit:potionHealing');
  window.r008IceEntry=ice;
  return {ice:ice?.description,sun:sun?.description,name:ice?.name};
 })()`);
 assert.ok(result.ice);assert.ok(result.sun);assert.notEqual(result.ice,result.sun);
 await game.eval(`scene.inventoryPanel.showItem(window.r008IceEntry);`);
 await game.screenshot('tools/scratch/browser-test/r008-ice-description.png');
 const eaten=await game.eval(`(() => {
  const before=scene.itemDisplayName('potionFrost',false);
  scene.requestedItemId='blandfruit';scene.requestedItemInstanceId='blandfruit:potionFrost';
  const ate=scene.eatFood();scene.refresh();
  return {ate,before,after:scene.itemDisplayName('potionFrost',false),ice:scene.bag.find('blandfruit','blandfruit:potionFrost')?.quantity ?? 0,plain:scene.bag.items.find(i=>i.id==='blandfruit' && i.instanceId===undefined)?.quantity};
 })()`);
 assert.equal(eaten.ate,true);assert.equal(eaten.ice,0);assert.equal(eaten.plain,2);assert.equal(eaten.after,eaten.before);
 assert.deepEqual(game.consoleErrors(),[]);console.log('PASS cooked fruit descriptions follow each instance; icefruit meal consumes only its stack and keeps potion class unknown.');
}
