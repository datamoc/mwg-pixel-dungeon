export default async (game) => {
	await game.waitFor('!!window.__roadmapData', { timeout: 20000 });
	await new Promise((r) => setTimeout(r, 1500));
	console.log(JSON.stringify(await game.eval('({o:window.__roadmapData.overallDone,t:window.__roadmapData.overallTotal,s:window.__roadmapData.sections.map(x=>x.name.slice(0,40)+" "+x.done+"/"+x.total)})')));
	await game.screenshot('tools/scratch/roadmap-progress.png');
	console.log('errors', JSON.stringify(game.consoleErrors()));
};
