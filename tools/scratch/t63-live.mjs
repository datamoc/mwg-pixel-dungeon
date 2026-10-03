export default async (game) => {
	await game.startGame();
	await new Promise(r => setTimeout(r, 3000));
	console.log(JSON.stringify(await game.eval(`(() => {
		const s = scene; const out = {};
		const m = s.creatures.find(c => !c.isHero && !c.isNPC && !c.isAlly && c.hp > 0);
		out.mobBefore = m.hp; s['applyCharacterDamage'](m, 3, { pierceArmor: true, cause: 'foe', skipAura: true, magical: true }); out.mobAfter = m.hp;
		out.heroBefore = s.hero.hp; s['applyCharacterDamage'](s.hero, 2, { pierceArmor: true, cause: 'foe', skipAura: true, magical: true }); out.heroAfter = s.hero.hp;
		const big = s.creatures.find(c => c !== m && !c.isHero && !c.isNPC && !c.isAlly && c.hp > 0);
		s['applyCharacterDamage'](big, 9999, { pierceArmor: true, cause: 'foe', skipAura: true }); out.killedGone = !s.creatures.includes(big) || big.hp <= 0;
		return out; })()`)));
	console.log(game.consoleErrors());
};
