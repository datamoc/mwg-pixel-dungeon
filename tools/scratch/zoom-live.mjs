export default async (game) => {
	await game.startGame?.('warrior');
	await new Promise(r => setTimeout(r, 3000));
	await game.screenshot('C:/Users/miche/dev/mwg-pixel-dungeon/tools/scratch/zoom-0.png');
};
