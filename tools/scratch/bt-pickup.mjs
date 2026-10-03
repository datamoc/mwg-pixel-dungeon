export default async (game) => {
	await game.startGame(); await new Promise(r => setTimeout(r, 4000));
	const r = await game.eval(`(() => {
		const s = scene, h = s.hero; const adv = []; const orig = s.clock.advance.bind(s.clock);
		s.clock.advance = (n) => { adv.push(n); return orig(n); };
		s.spendHeroTurn(1); const plain = adv.splice(0);
		s.spawnGroundItem('potion', h.x, h.y); s.pickupGroundItemAt(h.x, h.y);
		s.spendHeroTurn(1); const withPickup = adv.splice(0);
		s.spawnGroundItem('scroll', h.x, h.y); s.pickupGroundItemAt(h.x, h.y);
		s.spawnGroundItem('potion', h.x, h.y); s.pickupGroundItemAt(h.x, h.y);
		s.spendHeroTurn(1); const two = adv.splice(0);
		return { plain, withPickup, two };
	})()`);
	console.log(JSON.stringify(r)); console.log('errors', JSON.stringify(game.consoleErrors()));
};
