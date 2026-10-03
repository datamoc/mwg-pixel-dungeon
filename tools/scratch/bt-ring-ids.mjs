export default async (game) => { await game.startGame(); console.log(JSON.stringify(await game.eval(`return scene.bag.items.map(i=>i.id)`))); };
