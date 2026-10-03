export default async (game) => {
	await game.startGame();
	await new Promise(r => setTimeout(r, 3000));
	await game.eval(`(() => { const s = scene; s.talentPoints[0] = 2; s.talentOpen = true; s.refreshTalentPanel(); })()`);
	await new Promise(r => setTimeout(r, 600));
	await game.eval(`(() => { const s = scene; const tile = s.talentPanel.children.flatMap(c => c.children ?? []).find(c => c.eventMode === 'static' && c.cursor === 'pointer' && c.width < 40 && c.width > 15); tile.emit('pointertap'); })()`);
	await new Promise(r => setTimeout(r, 600));
	await game.tapText('am.lioration|upgrade');
	await new Promise(r => setTimeout(r, 800));
	await game.screenshot('tools/scratch/talent-after.png');
	console.log(JSON.stringify(await game.eval(`({ranks: scene.talentRanks, points: scene.talentPoints[0]})`)), game.consoleErrors());
};
