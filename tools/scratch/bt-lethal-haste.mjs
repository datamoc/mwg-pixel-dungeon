// R024: ability kill / Harvest bleed kill grants Lethal Haste (MeleeWeapon.onAbilityKill), no cooldown.
export default async (game) => {
	await game.startGame();
	const r = await game.eval(`
		const out = {};
		scene.hero.buffs = {};
		scene.onAbilityKill('lunge'); out.noTalent = scene.hero.buffs['haste'] ?? 0;
		scene.talentRank = (id) => id === 'lethal_haste' ? 2 : 0;
		scene.hero.buffs['lethalHasteCooldown'] = 100;
		scene.onAbilityKill('lunge'); out.withTalentOnCooldown = scene.hero.buffs['haste'];
		// Harvest bleed kill on a monster
		scene.hero.buffs = {};
		const m = scene.creatures.find((c) => !c.isHero && c.hp > 0 && !c.isNPC && !c.isAlly);
		m.hp = 1; m.buffs['bleeding'] = 5; m.bleedSource = 'harvestBleed'; m.sleeping = false;
		let guard = 0; while (m.hp > 0 && guard++ < 20) scene['takeMonsterTurn']?.(m) ?? scene['monsterTurn']?.(m);
		out.monsterDead = m.hp <= 0; out.hasteAfterBleedKill = scene.hero.buffs['haste'] ?? 0;
		return out;
	`);
	console.log(JSON.stringify(r));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
