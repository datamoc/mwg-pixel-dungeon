// node tools/browserTest.mjs --script tools/scratch/damage-seam-batch5-livecheck.mjs
export default async (game) => {
	await game.startGame();
	const r = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const out = {};
		const mob = s['creatures'].find(c => !c.isHero && !c.isNPC && !c.isAlly);
		mob.hp = mob.maxHp = 100; mob.sleeping = true;
		s['applyCharacterDamage'](mob, 7, { pierceArmor: true, cause: 'foe', skipAura: true, deferKill: true });
		out.mobHp = mob.hp; out.mobAwake = !mob.sleeping;
		mob.hp = 3;
		s['applyCharacterDamage'](mob, 9, { pierceArmor: true, cause: 'foe', skipAura: true, deferKill: true });
		out.deferredAlive = s['creatures'].includes(mob) && mob.hp <= 0;
		const hero = s.hero; const h0 = hero.hp;
		const died = s['applyCharacterDamage'](hero, 2, { pierceArmor: true, cause: 'poison', deferKill: true });
		out.heroLost = h0 - hero.hp; out.heroDied = died;
		const un = s['creatures'].find(c => c !== mob && !c.isHero && !c.isNPC && !c.isAlly && c.hp > 0) || mob;
		un.kind = 'elemental'; un.elementalType = 'shock'; un.hp = un.maxHp = 100; un.sleeping = false;
		s['applyCharacterDamage'](un, 10, { pierceArmor: true, cause: 'foe', skipAura: true, skipDoom: true, sourceElement: 'electric', deferKill: true });
		out.shockHalved = 100 - un.hp;
		return out;
	})()`);
	console.log(JSON.stringify(r));
	if (r.mobHp !== 93 || !r.mobAwake || !r.deferredAlive || r.heroLost !== 2 || r.heroDied || r.shockHalved !== 5) throw new Error('unexpected ' + JSON.stringify(r));
	if (game.consoleErrors().length) throw new Error(`console errors: ${game.consoleErrors()[0]}`);
};
