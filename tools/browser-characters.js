// Run with Playwright MCP browser_run_code_unsafe's filename argument.
// Requires the built game preview at 127.0.0.1:4173; uses and closes its own tab.
async (page) => {
	const test = await page.context().newPage();
	try {
		await test.setViewportSize({ width: 1280, height: 800 });
		await test.goto('http://127.0.0.1:4173/?visual-parity');
		await test.waitForFunction(() => !!window.__MWG__?.currentScene);
		await test.mouse.click(450, 420);
		await test.waitForFunction(() => 'selected' in window.__MWG__.currentScene);
		await test.mouse.click(105, 280);
		await test.keyboard.press('Enter');
		await test.waitForFunction(() => !!window.__MWG__.currentScene.characterEffects);
		const results = await test.evaluate(() => {
			const s = window.__MWG__.currentScene;
			const m = s.spawnMonster('rat', { x: s.hero.x - 1, y: s.hero.y });
			m.hp = 0;
			s.kill(m);
			const start = { logicalRemoval: !s.creatures.includes(m), destroyed: m.sprite.destroyed, clip: m.sprite.playing };
			s.update(0.5); s.update(1.5);
			const middle = { destroyed: m.sprite.destroyed, alpha: m.sprite.alpha };
			const count = s.creatures.length;
			s.kill(m);
			if (s.creatures.length !== count) throw new Error('Duplicate death removed a living creature');
			s.update(1.6);
			if (!start.logicalRemoval || start.destroyed || start.clip !== 'die' || middle.destroyed || middle.alpha !== 0.5 || !m.sprite.destroyed) {
				throw new Error(`Death lifecycle failed: ${JSON.stringify({ start, middle, destroyed: m.sprite.destroyed })}`);
			}
			s.hero.hp = 0; s.kill(s.hero); s.update(0.4);
			const hero = { destroyed: s.hero.sprite.destroyed, frame: s.hero.sprite.texture.frame.x / 12 };
			if (hero.destroyed || hero.frame !== 11) throw new Error('Hero did not keep the terminal death pose');
			return { start, middle, corpseRemoved: m.sprite.destroyed, hero };
		});
		return results;
	} finally {
		await test.close();
	}
}
