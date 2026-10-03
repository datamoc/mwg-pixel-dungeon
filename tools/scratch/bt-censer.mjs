// R063: Chaotic Censer spews a gas near a targeted visible enemy; Storm Cloud turns cells to water.
export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	const r = await game.eval(`
		const out = {};
		const h = scene.hero;
		scene.bag.add({ id: 'trinketChaoticCenser', quantity: 1, stackable: false, identified: true, level: 3, instanceId: 'cen' });
		const m = scene.creatures.find((c) => !c.isHero && !c.isNPC && !c.isAlly && c.hp > 0);
		const spot = [[2,0],[-2,0],[0,2],[0,-2]].map(([dx,dy]) => ({ x: h.x+dx, y: h.y+dy })).find((p) => scene.level.passable(p.x, p.y) && !scene.creatureAt(p.x, p.y)); scene.moveTo(m, spot);
		scene.censerTarget = m;
		const gases = ['toxicGas','confusionGas','regrowth','stormCloud','smokeScreen','stenchGas','inferno','blizzard','corrosiveGas'];
		const total = () => Object.fromEntries(gases.map((g) => [g, scene[g].total()]));
		out.before = total();
		out.logBefore = scene.logLines?.length ?? null;
		let spewed = null; const said = []; const origSay = scene.say.bind(scene); scene.say = (l, lv) => { said.push(l); return origSay(l, lv); };
		const seen = {}; const peak = {}; for (let i = 0; i < 900; i++) {
			h.hp = h.maxHp; m.sleeping = true; try { scene.spendHeroTurn(1); } catch (e) { out.err = String(e.stack ?? e).slice(0, 400); break; }
			if (said.length > (out._n ?? 0) && !out.trace) { out._n = said.length; const sp = scene.__censer.spew; out.trace = { hero: [h.x, h.y], mon: [m.x, m.y], w: scene.level.width, spew: sp ? { ...sp } : null }; h.hp = h.maxHp; scene.spendHeroTurn(1); out.trace.after = total(); out.trace.spewAfter = scene.__censer.spew ?? null; }
			const t = total(); for (const g of gases) peak[g] = Math.max(peak[g] ?? 0, t[g]);
		}
		out.spewed = spewed; out.spewCount = said.length; out.kinds = [...new Set(said)]; out.peak = peak; out.targetVisible = scene.fov.isVisible(m.x, m.y); out.mHp = m.hp; out.inList = scene.creatures.includes(m); out.regen = scene.regenOn(); out.dist = Array.from(scene.pathfinder.distanceMap({ x: h.x, y: h.y })).filter((d) => d >= 2 && d <= 6).length;
		// storm cloud -> water
		const cell = { x: h.x + 1, y: h.y };
		const kindBefore = scene.level.get(cell.x, cell.y);
		scene.stormCloud.seed(cell.x, cell.y, 300);
		scene.spreadPlantBlobs();
		out.rt = scene.__censer ? { left: scene.__censer.left, until: scene.__censer.untilTick } : 'none'; out.stormCell = { before: kindBefore, after: scene.level.get(cell.x, cell.y) };
		return out;
	`);
	console.log(JSON.stringify(r));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
