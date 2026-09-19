import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Called by verifySimulation.mjs. dungeonScene.ts cannot load in this harness
// (Pixi), so the shake audit pins its call sites at source level, the way
// verifyCombat's champion-eligible spawn check and verifyRings' multiplier
// checks do. The full 41-site Java audit lives in PORT_COVERAGE.md's
// "Screen shake" paragraph; these pins guard the wirings that regress silently
// (a deleted shake is invisible in every other suite).
export function verifyShakes(require, check) {
	check('every ported shake feature shakes at Java\u2019s site', () => {
		const source = readFileSync(new URL('../src/scenes/dungeonScene.ts', import.meta.url), 'utf8');
		const sites = [
			// [Java site, port call-site fragment]
			['FistSprite 143 (4, 0.2f) on the melee swing', "if (attacker.kind === 'yogFist') this.shakeScreen(4, 0.2);"],
			['DM300Sprite.slam (3, 0.7f) on the melee swing', "if (attacker.kind === 'dm300') this.shakeScreen(3, 0.7);"],
			['Hero 1385 rooted stair refusal (1, 1f)', "else if (plan.kind === 'rooted') { this.shakeScreen(1, 1);"],
			['DelayedRockFall 68 / RockfallTrap 117 impact (3, 0.7f)', 'this.shakeScreen(3, 0.7);\n\t\t\tconst challenge = isChallengeEnabled'],
			['Entanglement on the hero (1, 0.4f)', '//`Entanglement.proc()` (tag `v3.3.8`)'],
			['WandOfLightning on the hero (2, 0.3f)', "if (victim.isHero && this.wandType === 'lightning') this.shakeScreen(2, 0.3);"],
		];
		for (const [java, fragment] of sites) assert.ok(source.includes(fragment), `${java} must stay wired`);
		//Relocated by the plant-trigger extraction (file-size refactor): the hero half's
		//burst now lives in `simulation/plantTriggers.ts` behind the shake callback.
		const triggers = readFileSync(new URL('../src/simulation/plantTriggers.ts', import.meta.url), 'utf8');
		assert.ok(triggers.includes('if (ctx.isVisible(x, y)) ctx.shake(1, 0.4);'), 'Earthroot plant burst, hero half (1, 0.4f) must stay wired');
		assert.ok(triggers.includes('if (ctx.isVisibleCell(cell)) ctx.shake(1, 0.4);'), 'Earthroot plant burst, mob half (1, 0.4f) must stay wired');
		// The three short ability-refusal shakes are a documented deliberate
		// divergence (Java shakes a full second at each); the comments must keep
		// saying so, or the divergence becomes silent.
		for (const anchor of ['`activateHeroicLeap`', '`Feint.java` 93', '`SmokeBomb.java` 91']) {
			assert.ok(source.includes(anchor), `the refusal-shake divergence note must keep citing ${anchor}`);
		}
		assert.ok(source.includes('Short refusal form'), 'the refusal-shake divergence must stay stated');
	});
}
