export default async (game) => {
	await game.waitFor('!!(globalThis.__MWG__ && __MWG__.currentScene && __MWG__.currentScene.mover && __MWG__.currentScene.project)', { timeout: 120000 });
	await new Promise((r) => setTimeout(r, 3000));
	console.log(JSON.stringify(await game.eval(`(() => { const s = __MWG__.currentScene; const names = []; let o = s; while (o && o !== Object.prototype) { for (const k of Object.getOwnPropertyNames(o)) if (typeof s[k] === 'function' && /event|interact|talk|action|confirm|teleport|transfer|move|step|face|start|run|save|load/i.test(k)) names.push(k); o = Object.getPrototypeOf(o); } return { methods: [...new Set(names)].slice(0, 60), moverKeys: Object.keys(s.mover).slice(0, 15), mapRuntime: s.mapRuntime && Object.keys(s.mapRuntime).slice(0, 12), curMap: s.mapId ?? s.currentMapId ?? (s.mapRuntime && s.mapRuntime.id) ?? null }; })()`)));
};
