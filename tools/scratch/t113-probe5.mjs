export default async (game) => {
	await game.waitFor('!!(globalThis.__MWG__ && __MWG__.currentScene && __MWG__.currentScene.mover && __MWG__.currentScene.project)', { timeout: 120000 });
	await new Promise((r) => setTimeout(r, 4000));
	console.log(JSON.stringify(await game.eval(`(() => { const s = __MWG__.currentScene; const c = s.captureRuntimeState ? s.captureRuntimeState() : null; const r = s.runtimeState ? s.runtimeState() : null; return { cap: c && JSON.stringify(c).slice(0, 500), run: r && JSON.stringify(r).slice(0, 300), saves: s.savedSlots ? JSON.stringify(s.savedSlots()).slice(0, 300) : null, mover: [s.mover.x, s.mover.y, s.mover.facing], search: location.search }; })()`)));
};
