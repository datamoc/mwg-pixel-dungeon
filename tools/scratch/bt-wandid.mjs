// Boot-smoke for the R119 wand-ID change: start a Mage (opens with a wand),
// assert the live scene carries the wand/buff seams the hook needs, screenshot.
export default async (game) => {
	await game.startGame(1);
	const state = await game.eval(`(() => ({
		wandType: scene.wandType,
		charges: scene.wandCharges ? scene.wandCharges.current : null,
		hasBuffs: !!(scene.hero && scene.hero.buffs),
		heroHp: scene.hero.hp,
	}))()`);
	if (!state.wandType) throw new Error('no wielded wand type on the live scene');
	if (!state.hasBuffs) throw new Error('hero has no buff map for the tracker');
	await game.screenshot('bt-wandid.png');
	const errors = game.consoleErrors();
	if (errors.length > 0) throw new Error(`console errors: ${errors.join(' | ').slice(0, 400)}`);
	return state;
};
