// BrokenSeal.WarriorShield restored: a hit taking the hero to half HP activates it (cooldown 150, shield
// 3 + 2*tier), a second hit while cooling down does not, five quiet turns with no enemy in view drop it.
export default async (game) => {
	await game.startGame();
	await game.eval('await new Promise((r) => setTimeout(r, 3000)); return 1;');
	const r = await game.eval(`
		const out = {};
		const h = scene.hero;
		out.armorSealed = scene.armorSealed; out.tier = scene.armorTier;
		h.maxHp = 20; h.hp = 20;
		const m = scene.creatures.find((c) => !c.isHero && !c.isNPC && !c.isAlly && c.hp > 0);
		scene.fov.isVisible = () => false; // nothing in view: idle count may run
		out.before = { shield: scene.sealBarrier.total, cooldown: scene.sealState.cooldown };
		// a hit down to 8 HP (<= half of 20)
		scene.applyCharacterDamage(h, 12, { pierceArmor: true, cause: 'foe', magical: false });
		out.afterHit = { hp: h.hp, shield: scene.sealBarrier.total, cooldown: scene.sealState.cooldown };
		// a second hit while on cooldown must not re-activate
		const cd = scene.sealState.cooldown;
		scene.applyCharacterDamage(h, 1, { pierceArmor: true, cause: 'foe', magical: false });
		out.secondHitCooldownUnchanged = scene.sealState.cooldown === cd;
		// five quiet turns
		for (let i = 0; i < 6; i++) scene.spendHeroAction(1);
		out.afterQuiet = { shield: scene.sealBarrier.total, cooldown: scene.sealState.cooldown, idle: scene.sealState.turnsSinceEnemies };
		return out;
	`);
	console.log(JSON.stringify(r, null, 1));
	if (game.consoleErrors().length) throw new Error(game.consoleErrors()[0]);
};
