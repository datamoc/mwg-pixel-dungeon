export default async (game) => {
	await game.waitFor('!!(globalThis.__MWG__ && __MWG__.currentScene && __MWG__.currentScene.mover && __MWG__.currentScene.project)', { timeout: 120000 });
	console.log(JSON.stringify(await game.eval(`(() => { const s = __MWG__.currentScene, p = s.project; const q = new URLSearchParams(location.search);
		const m = (p.maps || []).find((x) => Number(x.id) === Number(q.get('map') || p.initialMapId)) || p.maps[0];
		const d = m.data || m; const evs = d.events || [];
		const sample = evs.find((e) => e && JSON.stringify(e).includes('"choices"')) || evs.find(Boolean);
		return { projKeys: Object.keys(p).slice(0, 25), mapKeys: Object.keys(m).slice(0, 12), dataKeys: Object.keys(d).slice(0, 20), nEvents: evs.length, sample: JSON.stringify(sample).slice(0, 900), scnMapEntry: !!s.mapEntry, mapUrl: q.get('map'), gs: Object.keys(s.gameState || {}).slice(0, 20) }; })()`)));
};
