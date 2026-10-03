export default async (game) => {
	await new Promise(r => setTimeout(r, 5000));
	await game.screenshot('tools/scratch/title.png');
};
