import assert from 'node:assert/strict';
import { readSceneSource } from './sceneSource.mjs';

/**
 * `takeMonsterTurn`'s Paralysis/Frost/FeintConfusion/SpectatorFreeze skip-turn gate
 * (`actorTurnsHazards.ts`), against a real bug found live 2026-09-23: `tickBuffs` decrements every
 * buff duration uniformly (`advanceBuffs`'s `if (left <= 1) delete; else left - 1`) and used to run
 * *before* the gate read `monster.buffs['paralysis']` - so a monster paralysed for exactly 1 turn
 * (`WallOfLight`, `StoneOfShock`'s real `1f`) had its duration ticked to zero in the very turn it
 * was meant to skip, and never gated anything; any longer paralysis/frost/confusion skipped one
 * turn fewer than granted for the same reason. A live check (`takeMonsterTurn` on a fresh
 * `paralysis: 1` rat, hero adjacent) confirmed the miss - the rat still attacked - before the fix.
 *
 * The fix captures the pre-tick booleans right beside the existing DoT `wasX` captures (the same
 * "read before `tickBuffs`" idiom this file already uses for Burning ignition), then gates on the
 * capture instead of a fresh read. `tickBuffs` itself, and every per-turn effect below it, are
 * unchanged - DoTs still land on a paralysed monster's own turn, matching Java's independent
 * `Buff.act()` schedule, which this port's compact model already folds into the same call.
 */
export function verifyParalysisOrdering(require, check) {
	check('a monster\'s paralysis/frost/feintConfusion/spectatorFreeze gate reads the pre-tick value', () => {
		const scene = readSceneSource();
		assert.ok(scene.includes(
			"const monsterWasParalysed = monster.buffs['paralysis'] !== undefined\n\t\t\t|| monster.buffs['frost'] !== undefined || monster.buffs['feintConfusion'] !== undefined;",
		), 'captures paralysis/frost/feintConfusion before the tick');
		assert.ok(scene.includes("const monsterWasFrozenSpectator = monster.buffs['spectatorFreeze'] !== undefined;"),
			'captures spectatorFreeze before the tick');
		// The capture must come *before* the tick call, and the gate must read the capture, not a
		// fresh buffs lookup (a regression could silently move the capture back below the tick, or
		// revert the gate to `monster.buffs['paralysis'] || ...`, and still contain both substrings).
		//Two `tickBuffs(monster, ...)` calls exist (the separate `ratmogrifiedTurns` branch has its
		//own, ahead of this one in the file) - anchor from the capture forward so that earlier,
		//unrelated call cannot be mistaken for this gate's own tick.
		const captureAt = scene.indexOf('const monsterWasParalysed');
		const tickAt = scene.indexOf('const dot = tickBuffs(monster, this.depth);', captureAt);
		const gateAt = scene.indexOf('if (monsterWasParalysed) return;');
		const freezeGateAt = scene.indexOf('if (monsterWasFrozenSpectator) return;');
		assert.ok(captureAt >= 0 && tickAt > captureAt, 'capture happens before the generic buff tick');
		assert.ok(gateAt > tickAt, 'the paralysis/frost/feintConfusion skip gate reads the capture after the tick, not before it');
		assert.ok(freezeGateAt > gateAt, 'the spectatorFreeze skip gate follows the same pattern');
		assert.ok(!scene.includes("if (monster.buffs['paralysis'] || monster.buffs['frost'] || monster.buffs['feintConfusion']) return;"),
			'the gate no longer re-reads a post-tick buffs value');
	});
}
