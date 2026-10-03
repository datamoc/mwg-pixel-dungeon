export default async (game) => {
  await game.startGame();
  const state = await game.eval(`scene.bag.add({ id: 'blandfruit', instanceId: 'blandfruit:potionHealing', potionAttrib: 'potionHealing', quantity: 1, identified: true, stackable: true }); scene.inventoryOpen = true; scene.refreshInventoryPanel(); return { items: scene.bag.items.filter((item) => item.id === 'blandfruit'), open: scene.inventoryOpen };`);
  console.log(`[${game.browser}] ${JSON.stringify(state)}`);
  await game.screenshot('tools/scratch/browser-test/r008-blandfruit-glow.png');
  const errors = game.consoleErrors();
  if (errors.length) throw new Error(`console errors: ${errors.join('\n')}`);
};
