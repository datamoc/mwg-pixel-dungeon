export default async (game) => {
  await game.startGame();
  await new Promise((resolve) => setTimeout(resolve, 900));
  await game.screenshot('tools/scratch/browser-test/king-delay-live.png');
  const result = await game.eval(`(() => {
    const s = window.__MWG__.currentScene;
    const king = { x: s.hero.x, y: s.hero.y };
    const before = s.kingAdds.size;
    const ok = s.summonKingAdd(king, 'ghoul', false, 2);
    const add = [...s.kingAdds].find((c) => ![...s.kingAdds].slice(0, before).includes(c));
    return { ok, delay: add ? s.scheduler.timeOf(add) - s.scheduler.now : null, schedulerHasAdd: add ? s.scheduler.has(add) : false };
  })()`);
  return { result, errors: game.consoleErrors() };
};