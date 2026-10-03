const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async (game) => {
	await game.startGame(); await sleep(2000);
	const st = `(() => { const s = mwg.currentScene; const w = s.level.width; const out = []; for (let i = 0; i < s.level.cellCount; i++) if (s.secretDoorCells && s.secretDoorCells.has(i)) out.push({ i, x: i % w, y: Math.floor(i / w), terrain: s.level.terrain[i], get: s.level.get(i % w, Math.floor(i / w)), concealed: s.secrets && s.secrets.isConcealed ? s.secrets.isConcealed(i % w, Math.floor(i / w)) : null }); return { secretDoors: out, keys: Object.keys(s.secrets || {}).slice(0, 8) }; })()`;
	console.log('before', JSON.stringify(await game.eval(st)));
	await game.eval('mwg.currentScene.saveRun()'); await sleep(300);
	await game.eval('mwg.currentScene.loadRun()'); await sleep(2500);
	console.log('after ', JSON.stringify(await game.eval(st)));
	process.exit(0);
};
