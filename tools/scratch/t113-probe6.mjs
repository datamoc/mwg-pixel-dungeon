const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async (game) => {
	await sleep(15000);
	console.log(JSON.stringify(await game.eval(`(() => { const s = globalThis.__MWG__ && __MWG__.currentScene; return { hasMwg: !!globalThis.__MWG__, sceneKeys: s ? Object.keys(s).slice(0, 40) : null, banner: [...document.querySelectorAll('div,p')].filter((e) => /partially supported|Those scenes/.test(e.textContent) && e.children.length < 3).map((e) => e.textContent.slice(0, 260)).slice(0, 2), canvases: [...document.querySelectorAll('canvas')].map((c) => c.id + ':' + c.width + 'x' + c.height), rgss: s && s.rgss ? Object.keys(s.rgss).slice(0, 20) : null, title: document.title }; })()`)));
	await game.screenshot('tools/scratch/t113/void-probe.png');
};
