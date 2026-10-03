export default async (game) => {
	await game.startGame?.('warrior');
	await new Promise(r => setTimeout(r, 500));
	console.log(JSON.stringify(await game.eval(`(() => { const s = window.__MWG__.currentScene; return { il: !!s['interlevel'], el: s['interlevel']?.elapsed, dur: s['interlevel']?.duration } })()`)));
	await game.screenshot('C:/Users/miche/dev/mwg-pixel-dungeon/tools/scratch/il-0.png');
};
