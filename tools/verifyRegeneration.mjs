import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

//`simulation/regeneration.ts` against `Regeneration.java`/`LockedFloor.java` and the seven boss
//`damage()` overrides (tag `v3.3.8`), plus source pins on the scene wiring.
const require = createRequire(import.meta.url);
const ts = require('typescript');
//CRLF-normalised: a Windows checkout (`core.autocrlf`) must not break the source pins below.
const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');
const compiled = ts.transpileModule(read('../src/simulation/regeneration.ts'), {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const loaded = { exports: {} };
new Function('module', 'exports', compiled)(loaded, loaded.exports);
const R = loaded.exports;

const plain = { chaliceLevel: -1, chaliceCursed: false, magicImmune: false, artifactChargeMultiplier: 1 };
assert.equal(R.regenerationDelay(plain), 10, 'REGENERATION_DELAY = 10');
assert.equal(R.regenerationDelay({ ...plain, chaliceLevel: 0, chaliceCursed: true }), 15, 'cursed chalice x1.5');
assert.ok(Math.abs(R.regenerationDelay({ ...plain, chaliceLevel: 0 }) - 8.67) < 1e-9, '+0 chalice: 10 - 1.33');
assert.ok(Math.abs(R.regenerationDelay({ ...plain, chaliceLevel: 10 }) - 2) < 1e-9, '+10 chalice: 10 - 1.33 - 6.67 = 2 ("500% boost")');
assert.ok(Math.abs(R.regenerationDelay({ ...plain, chaliceLevel: 10, artifactChargeMultiplier: 2 }) - 1) < 1e-9, 'energy divides the chalice delay');
assert.equal(R.regenerationDelay({ ...plain, chaliceLevel: 10, magicImmune: true }), 10, 'MagicImmune switches the chalice off');
assert.equal(R.regenerationDelay({ ...plain, artifactChargeMultiplier: 2 }), 10, 'energy alone does not touch base regen');

//Ten plain ticks heal exactly one HP (floating accumulation of 0.1 reaches 1 on the 10th or 11th).
let hp = 10, partial = 0, healed = 0;
for (let i = 0; i < 11; i++) {
	const next = R.tickRegeneration(hp, 20, partial, { regenOn: true, starving: false, delay: 10, ticks: 1 });
	hp = next.hp; partial = next.partial; healed += next.healed;
}
assert.equal(healed, 1, '1 HP per ~10 turns');
assert.equal(R.tickRegeneration(10, 20, 0.95, { regenOn: false, starving: false, delay: 10, ticks: 1 }).healed, 0, 'regenOn gate');
assert.equal(R.tickRegeneration(10, 20, 0.95, { regenOn: true, starving: true, delay: 10, ticks: 1 }).healed, 0, 'starving gate');
assert.deepEqual(R.tickRegeneration(20, 20, 0.5, { regenOn: true, starving: false, delay: 10, ticks: 1 }), { hp: 20, partial: 0.5, healed: 0 }, 'no gain at HT');
assert.deepEqual(R.tickRegeneration(19, 20, 0, { regenOn: true, starving: false, delay: 1, ticks: 3 }), { hp: 20, partial: 0, healed: 1 }, 'capped at regencap()');
assert.equal(R.tickRegeneration(10, 20, 0, { regenOn: true, starving: false, delay: 10, ticks: 20 }).healed, 2, 'turn cost scales the gain');

assert.equal(R.regenOn(null), true, 'no lock: regen on');
assert.equal(R.regenOn(1), true, 'left >= 1: regen on');
assert.equal(R.regenOn(0.5), false, 'left < 1: regen off');
assert.equal(R.tickLockedFloor(null, true, false), 50, 'seal attaches a 50-turn lock');
assert.equal(R.tickLockedFloor(null, true, true), 20, 'Stronger Bosses: 20 turns');
assert.equal(R.tickLockedFloor(50, true, false), 49, 'one turn off per tick');
assert.equal(R.tickLockedFloor(0.5, true, false), 0.5, 'no decrement below 1');
assert.equal(R.tickLockedFloor(12, false, false), null, 'unlocked floor detaches the buff');
assert.equal(R.addLockedFloorTime(45, 10), 50, 'addTime caps at 50');
assert.equal(R.addLockedFloorTime(null, 10), null, 'addTime needs a lock');
assert.equal(R.removeLockedFloorTime(1, 3), -2, 'removeTime can go negative');

assert.equal(R.lockedFloorBossTime('goo', 10, 4, false), 15, 'Goo: dmg*1.5');
assert.equal(R.lockedFloorBossTime('goo', 10, 4, true), 10, 'Goo stronger: dmg');
assert.equal(R.lockedFloorBossTime('pylon', 10, 4, true), 5, 'Pylon stronger: dmg/2');
assert.ok(Math.abs(R.lockedFloorBossTime('king', 9, 0, false) - 3) < 1e-9, 'DwarfKing: dmg/3 (even when a shield ate it)');
assert.equal(R.lockedFloorBossTime('king', 10, 0, true), 2, 'DwarfKing stronger: dmg/5');
assert.equal(R.lockedFloorBossTime('dm300', 30, 12, false), 12, 'DM300: HP lost, not dmg');
assert.equal(R.lockedFloorBossTime('tengu', 9, 9, true), 6, 'Tengu stronger: 2*dmg/3');
assert.ok(Math.abs(R.lockedFloorBossTime('yog', 20, 20, true) - 20 / 3) < 1e-9, 'Yog stronger: dmgTaken/3');
assert.equal(R.lockedFloorBossTime('yogFist', 20, 0, false), 0, 'YogFist: dmgTaken > 0 guard');
assert.equal(R.lockedFloorBossTime('rat', 20, 20, false), 0, 'non-boss buys no time');

const loop = read('../src/scenes/dungeon/turnLoopAiming.ts');
const heroTurn = read('../src/simulation/heroTurn.ts');
assert.match(heroTurn, /advanceHunger\(turnCost\);\n\teffects\.tickRegeneration\?\.\(\);/, 'Regeneration acts right after the hero (HERO_PRIO - 1)');
assert.match(loop, /if \(this\.floorLocked\(\)\) return;\n\t\t\/\/Java's Hunger uses/, 'Hunger.act() idles on a locked floor');
for (const gate of ['this.armorSealed && this.regenOn()', "this.regenOn() ? 0.1", 'regenOn: this.regenOn(),', 'this.hero.magicImmune === true, this.regenOn());', '!this.regenOn() ? 0 :']) {
	assert.ok((loop + read('../src/scenes/dungeon/actorTurnsHazards.ts')).includes(gate), `regenOn gate wired: ${gate}`);
}
for (const [file, hook] of [
	['../src/scenes/dungeon/combatResolution.ts', "this.lockedFloorBossDamage(defender, preHp - defender.hp, preHp - defender.hp);\n\t\tif (defender.kind === 'dm300')"],
	['../src/scenes/dungeon/combatResolution.ts', 'this.lockedFloorBossDamage(linkKing, share, kingPreHp - linkKing.hp);'],
	['../src/scenes/dungeon/panelsSingleUse.ts', "this.lockedFloorBossDamage(c, damage, preHp - c.hp);\n\t\tif (c.kind === 'tengu')"],
	['../src/scenes/dungeon/actorTurnsHazards.ts', 'this.lockedFloorBossDamage(monster, dotDealt, preHp - monster.hp);'],
	['../src/items/bombEffects.ts', 'context.onBossDamageTaken?.(target, damage, previousHp - target.hp);'],
	['../src/scenes/dungeon/bosses/bossLogic.ts', 'onWaterHeal: (healInc) => this.lockedFloorGooHeal(healInc),'],
	['../src/scenes/dungeon/bosses/bossLogic.ts', "const dmgTaken = Math.max(0, preHp - yog.hp);\n\t\tthis.creditLockedFloor('yog', dmgTaken, dmgTaken);"],
	['../src/scenes/dungeon/bosses/bossLogic.ts', 'this.lockedFloorBossDamage(monster, tick, tick);'],
	['../src/scenes/dungeon/monsters/monsterAi.ts', "this.creditLockedFloor('tengu', preHp - tengu.hp, preHp - tengu.hp);\n\t\tif ((tengu.tenguPhase"],
	['../src/scenes/dungeon/deathSaveRefresh.ts', 'this.lockedFloorBossDamage(king, chip, 0);'],
	['../src/scenes/dungeon/turnLoopAiming.ts', 'for (; this.regeneration.lockCarry >= 1; this.regeneration.lockCarry--)'],
]) assert.ok(read(file).includes(hook), `lock hook wired in ${file}: ${hook.slice(0, 40)}`);
assert.equal((read('../src/scenes/dungeon/environmentFireTraps.ts').match(/target\.hp -= damage; this\.lockedFloorBossDamage\(target, damage, preHp - target\.hp\);/g) ?? []).length, 2, 'blob + trap-blast seams feed the lock');

//`items/artifactPassiveRecharge.ts` against chainsRecharge/beaconRecharge/hourglassRecharge.act(),
//with `mwlItemEffectValue` answered from the authored `item-rules.mwl` rows themselves.
const rules = read('../src/content/item-rules.mwl');
const effect = (item, name) => {
	const m = rules.match(new RegExp(`item: "${item}", effect: "${name}", value: ([0-9.]+)`));
	assert.ok(m, `item-rules.mwl has ${item}.${name}`);
	return Number(m[1]);
};
const passiveSrc = read('../src/items/artifactPassiveRecharge.ts').replace(/^import .*mwlContent.*$/m, '');
const passive = { exports: {} };
new Function('module', 'exports', 'mwlItemEffectValue', ts.transpileModule(passiveSrc, {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText)(passive, passive.exports, effect);
const P = passive.exports;
const open = { cursed: false, magicImmune: false, regenOn: true, artifactChargeMultiplier: 1 };
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);
near(P.chainsPassiveRecharge(0, { charge: 0, partialCharge: 0 }, open).partialCharge, 1 / 30, 'chains +0 empty: 1/(40-2*5)');
near(P.chainsPassiveRecharge(0, { charge: 4, partialCharge: 0 }, { ...open, artifactChargeMultiplier: 2 }).partialCharge, 2 / 38, 'chains energy multiplier');
assert.equal(P.chainsPassiveRecharge(0, { charge: 5, partialCharge: 0.5 }, open).partialCharge, 0.5, 'chains stop at the soft cap');
assert.equal(P.chainsPassiveRecharge(0, { charge: 0, partialCharge: 0.5 }, { ...open, magicImmune: true }).partialCharge, 0.5, 'chains MagicImmune gate');
near(P.beaconPassiveRecharge(3, { charge: 0, partialCharge: 0 }, { ...open, artifactChargeMultiplier: 2 }).partialCharge, 1 / 70, 'beacon: 1/(100-10*3), no energy multiplier');
assert.equal(P.beaconPassiveRecharge(3, { charge: 0, partialCharge: 0.5 }, { ...open, regenOn: false }).partialCharge, 0.5, 'beacon regenOn gate');
assert.deepEqual(P.beaconPassiveRecharge(3, { charge: 2, partialCharge: 0.99 }, open), { charge: 3, partialCharge: 0 }, 'beacon zeroes the partial at cap');
near(P.hourglassPassiveRecharge(5, { charge: 0, partialCharge: 0 }, open).partialCharge, 1 / 75, 'hourglass: 1/(90-3*5)');
assert.equal(P.hourglassPassiveRecharge(5, { charge: 0, partialCharge: 0 }, { ...open, cursed: true }).partialCharge, 0, 'hourglass cursed gate');
assert.ok(loop.includes('chainsPassiveRecharge(') && loop.includes('beaconPassiveRecharge(') && loop.includes('hourglassPassiveRecharge('), 'the three passive recharges run per turn');

console.log('verifyRegeneration: Regeneration/LockedFloor rules, artifact passive recharge and wiring OK');
