import type { DungeonScene } from '../../dungeonScene';
import { Random, Roguelike, SpriteSheet } from 'mwg';
import { AnimatedSprite } from 'mwg/two-d/render';
import { Graphics } from 'mwg/two-d/pixi-interop';
import { addBuff, buffBlocked, rollHit, type BuffId, type Creature, type Step } from '../../../combat';
import { t } from '../../../i18n/index';
import { runState } from '../../../runState';
import { IMMOVABLE_KINDS } from '../../../monsters';
import {
	guardianSpeed, isOpenSpace, planSpireDiamond, planSpireLine, spikeDamage, spikeKnockCell, spireAbilityDelay, spireIdleFrame,
	usesCrystalPassability,
} from '../../../simulation/crystalSpire';
import { SPD_TERRAIN_TO_GAME_KIND } from '../../../spdLevelGen/gameBridge';
import { Terrain } from '../../../spdLevelGen/paintLevel';
import { doorAwareLevel } from './doorAwareLevel';

/**
 * The Blacksmith CRYSTAL mine quest's three actors (`actors/mobs/CrystalWisp.java`,
 * `CrystalGuardian.java`, `CrystalSpire.java`, tag `v3.3.8`): `MineLargeRoom` sleeps a guardian in
 * each crystal nest, `MineGiantRoom` raises the spire, and `MiningLevel.createMob()` fills the
 * mine with wisps (`populateMiningBranch`). The pure halves live in `simulation/crystalSpire.ts`;
 * this group applies them to the scene. `PORT_COVERAGE.md`'s "Blacksmith CRYSTAL mine roster"
 * row lists what is simplified.
 */
export const CRYSTAL_MINE_KINDS: ReadonlySet<string> = new Set(['crystalWisp', 'crystalGuardian', 'crystalSpire']);

/** Each sprite's film and its `Blue`/`Green`/`Red` `texOffset()`s. */
const CRYSTAL_SHEETS = {
	crystalWisp: { sprite: 'crystalWisp', w: 12, h: 14, ofs: [0, 13, 26] },
	crystalGuardian: { sprite: 'crystalGuardian', w: 12, h: 15, ofs: [0, 21, 42] },
	crystalSpire: { sprite: 'crystalSpire', w: 24, h: 41, ofs: [0, 5, 10] },
} as const;

type Clip = [string, number[], { fps: number; loop: boolean }];

interface WispVisualState { halo: Graphics; bob: number; pulseAge: number; wasAttacking: boolean; }
interface CrystalMineVisualState { time: number; wisps: Map<string, WispVisualState>; shadowOffsets: Map<string, number>; }
const crystalMineVisualStates = new WeakMap<DungeonScene, CrystalMineVisualState>();

function wispHalo(color: number): Graphics {
	//`CrystalWispSprite.link()` creates `TorchHalo(20, blood(), 0.2)`, then sets alpha 0.3
	//and radius 10. Additive rings approximate that soft radial light with Pixi's ordinary Graphics.
	const halo = new Graphics();
	halo.blendMode = 'add';
	halo.circle(0, 0, 14).fill({ color, alpha: 0.035 });
	halo.circle(0, 0, 10).fill({ color, alpha: 0.06 });
	halo.circle(0, 0, 6).fill({ color, alpha: 0.12 });
	halo.eventMode = 'none';
	return halo;
}

/** `CrystalWispSprite`/`CrystalGuardianSprite`/`CrystalSpireSprite`'s animations at colour offset `c`.
 * A crumpled guardian plays its `die` film (`crumple = die.clone()`), held on the last frame. */
function crystalClips(creature: Creature, c: number): Clip[] {
	const at = (frames: number[]): number[] => frames.map((f) => f + c);
	if (creature.kind === 'crystalWisp') {
		return [
			['idle', at([0]), { fps: 1, loop: true }],
			['run', at([0, 0, 0, 1]), { fps: 12, loop: true }],
			['attack', at([2, 3, 4, 5]), { fps: 16, loop: false }],
			['die', at([6, 7, 8, 9, 10, 11, 12, 11]), { fps: 15, loop: false }],
		];
	}
	if (creature.kind === 'crystalGuardian') {
		const die: Clip = ['die', at([11, 12, 13, 14, 15, 15]), { fps: 5, loop: false }];
		return [
			creature.guardianRecovering ? ['idle', at([11, 12, 13, 14, 15, 15]), { fps: 5, loop: false }] : ['idle', at([0, 0, 0, 0, 0, 1, 1]), { fps: 2, loop: true }],
			['run', at([2, 3, 4, 5, 6, 7]), { fps: 15, loop: true }],
			['attack', at([8, 9, 10]), { fps: 12, loop: false }],
			die,
		];
	}
	const idle = at([spireIdleFrame(creature.hp, creature.maxHp)]);
	return [
		['idle', idle, { fps: 1, loop: true }],
		['run', idle, { fps: 1, loop: true }],
		['attack', idle, { fps: 1, loop: true }],
		['die', at([4]), { fps: 1, loop: false }],
	];
}

export const crystalMineMethods = {
	/** `CrystalWispSprite.update()`/`link()`/`attack()`/`zap()`: keep its colour-matched TorchHalo
	 * under the actor, bob the body by `abs(sin(Game.timeTotal))`, and move the flattened shadow by
	 * Java's matching `0.25 - 0.8*abs(sin(time))` offset. The real halo's radial sprite shader is
	 * represented by additive rings; attack/zap brightens it over Java's 0.2-second fade-in. */
	updateCrystalWispVisuals(this: DungeonScene, dt: number): ReadonlyMap<string, number> {
		let state = crystalMineVisualStates.get(this);
		if (!state) { state = { time: 0, wisps: new Map(), shadowOffsets: new Map() }; crystalMineVisualStates.set(this, state); }
		state.time += dt;
		state.shadowOffsets.clear();
		const live = new Set<string>();
		for (const creature of this.creatures) {
			if (creature.kind !== 'crystalWisp') continue;
			const sprite = this.spriteFor.get(creature.id);
			if (!(sprite instanceof AnimatedSprite) || sprite.destroyed) continue;
			live.add(creature.id);
			let visual = state.wisps.get(creature.id);
			if (!visual) {
				const color = [0x66b3ff, 0x2ee62e, 0xff7f00][creature.crystalTint ?? 0] ?? 0x66b3ff;
				const halo = wispHalo(color);
				this.effectLayer.addChild(halo);
				visual = { halo, bob: 0, pulseAge: Number.POSITIVE_INFINITY, wasAttacking: false };
				state.wisps.set(creature.id, visual);
			}
			const bodyBob = Math.abs(Math.sin(state.time));
			//`CrystalWispSprite.update()` anchors `baseY` on every place/point; subtract the previous
			//frame's offset to recover the current interpolated movement position before applying it.
			sprite.y = sprite.y - visual.bob + bodyBob;
			visual.bob = bodyBob;
			visual.halo.position.set(sprite.x + 8, sprite.y + 8);
			visual.halo.visible = sprite.visible;
			const attacking = sprite.playing === 'attack';
			if (attacking) {
				if (!visual.wasAttacking) visual.pulseAge = 0;
				visual.pulseAge += dt;
			} else visual.pulseAge = Number.POSITIVE_INFINITY;
			visual.wasAttacking = attacking;
			visual.halo.alpha = Number.isFinite(visual.pulseAge) ? 0.3 + 0.7 * Math.min(1, visual.pulseAge / 0.2) : 0.3;
			//`CharacterEffects` already includes the baseline +0.25; supply only Java's animated delta.
			state.shadowOffsets.set(creature.id, -0.8 * bodyBob);
		}
		for (const [id, visual] of state.wisps) {
			if (live.has(id)) continue;
			visual.halo.destroy();
			state.wisps.delete(id);
		}
		return state.shadowOffsets;
	},

	/** Re-applies the crystal sprite's clips for its colour, the guardian's crumple and the spire's
	 * cracked frames (`CrystalSpireSprite.updateIdle()`). The guardian preserves Java's `1.25`
	 * scale from `CrystalGuardianSprite` (tag `v3.3.8`) while retaining its current facing. The
	 * wisp's light and bob are advanced by `updateCrystalWispVisuals`; the spire's
	 * `DungeonWallsTilemap.skipCells` trick for drawing its 41-pixel height over the walls remains
	 * unported. */
	syncCrystalMineVisual(this: DungeonScene, creature: Creature): void {
		const info = CRYSTAL_SHEETS[creature.kind as keyof typeof CRYSTAL_SHEETS];
		const sprite = this.spriteFor.get(creature.id);
		if (!info || !(sprite instanceof AnimatedSprite)) return;
		const sheet = SpriteSheet.fromTexture(runState.sprites[info.sprite], info.w, info.h);
		const c = info.ofs[creature.crystalTint ?? 0] ?? 0;
		for (const [name, frames, clip] of crystalClips(creature, c)) sprite.add(name, frames.map((f) => sheet.get(f)), clip);
		if (creature.kind === 'crystalGuardian') sprite.scale.set(sprite.scale.x < 0 ? -1.25 : 1.25, 1.25);
		sprite.play('idle', true);
	},

	/** The constructor's `switch (Random.Int(3))` colour roll, then the sprite for it. */
	rollCrystalTint(this: DungeonScene, creature: Creature): void {
		creature.crystalTint = Random.int(0, 3);
		this.syncCrystalMineVisual(creature);
	},

	/**
	 * The room payloads for the CRYSTAL actors: every one rolls its colour; a guardian starts
	 * `SLEEPING` (its field initialiser). A spire already smashed is removed again: the mine is
	 * regenerated from its seed on every entry, as `linkMineQuestActors` does for the geomancer.
	 */
	linkCrystalMineActors(this: DungeonScene, spawns: readonly { x: number; y: number; kind: string }[]): void {
		for (const spawn of spawns) {
			if (!CRYSTAL_MINE_KINDS.has(spawn.kind)) continue;
			const creature = this.creatureAt(spawn.x, spawn.y);
			if (!creature || creature.kind !== spawn.kind) continue;
			if (spawn.kind === 'crystalSpire' && this.blacksmithBossBeaten) { this.destroyAlly(creature); continue; }
			if (spawn.kind === 'crystalGuardian') creature.sleeping = true;
			if (spawn.kind === 'crystalSpire') { creature.sleeping = false; creature.spireHp = creature.hp; }
			this.rollCrystalTint(creature);
		}
	},

	/** The raw mine terrain at a cell (`Dungeon.level.map`). */
	crystalRawAt(this: DungeonScene, cell: number): number | undefined {
		return this.portedPaint?.map[cell];
	},

	/** `Dungeon.level.solid` for the mine's raw terrain. */
	crystalSolid(this: DungeonScene, cell: number): boolean {
		const raw = this.crystalRawAt(cell);
		return raw === undefined || SPD_TERRAIN_TO_GAME_KIND[raw] === 'wall';
	},

	/** A route one step at a time, with `MINE_CRYSTAL` cells treated as passable when `crystals`
	 * (`CrystalWisp`/`CrystalGuardian.modifyPassable()`), doors opened as usual. `terrainOnly`
	 * ignores characters, as Java's `PathFinder.buildDistanceMap` does; `blockHeroCell` is used
	 * when pursuing a last-seen hero cell, matching the normal shared wandering route. */
	crystalRoute(this: DungeonScene, monster: Creature, to: Step, crystals: boolean, terrainOnly = false, blockHeroCell = false): Step[] {
		const base = doorAwareLevel(this.level, this.doors, this.secrets);
		const level = crystals
			? Object.create(base, { passable: { value: (x: number, y: number) => base.passable(x, y) || (this.level.inside(x, y) && this.crystalRawAt(this.level.index(x, y)) === Terrain.MINE_CRYSTAL) } })
			: base;
		const from = { x: monster.x, y: monster.y };
		return new Roguelike.Pathfinder(level).find(from, to, terrainOnly ? {} : { blocked: this.wanderBlocked(monster, blockHeroCell) });
	},

	/** The shared movement route for a target. Wisps use their unconditional Java shortcut;
	 * guardians open crystal passability only while hunting and for a long or impossible plain route. */
	crystalMinePath(this: DungeonScene, monster: Creature, to: Step, hunting: boolean, blockHeroCell = false): Step[] {
		const ordinary = this.crystalRoute(monster, to, false, false, blockHeroCell);
		const distance = Roguelike.chebyshevDistance(monster, to);
		if (usesCrystalPassability(monster.kind, ordinary.length, distance, hunting)) {
			return this.crystalRoute(monster, to, true, false, blockHeroCell);
		}
		return ordinary;
	},

	/**
	 * The start of every crystal actor's turn, ahead of the shared state gates. A crumpled
	 * guardian heals 5 (`recovering`'s `HP = min(HT, HP+5)`), throws out stuck missiles, and stands
	 * back up once full; a sleeping guardian that sees a hero it cannot reach stays asleep
	 * (`Sleeping.awaken()` returns early); the spire owns its whole turn (`takeSpireTurn`).
	 */
	crystalMinePreTurn(this: DungeonScene, monster: Creature): boolean {
		if (monster.kind === 'crystalSpire') { this.restoreSpireHp(monster); this.takeSpireTurn(monster); return true; }
		if (monster.kind !== 'crystalGuardian') return false;
		if (monster.guardianRecovering) {
			this.scatterStuckAmmo(monster);
			const healed = Math.min(monster.maxHp, monster.hp + 5) - monster.hp;
			monster.hp += healed;
			if (this.fov.isVisible(monster.x, monster.y)) this.showHeal(monster, 5);
			if (monster.hp >= monster.maxHp) {
				monster.guardianRecovering = false;
				monster.evasion = 14;
				monster.armor = [0, 10];
				this.syncCrystalMineVisual(monster);
			}
			return true;
		}
		if (monster.sleeping && this.fov.isVisible(monster.x, monster.y)) {
			//`PathFinder.buildDistanceMap(enemy.pos, Dungeon.level.passable)`: plain passability, no crystals.
			if (this.crystalRoute(monster, this.hero, false, true).length === 0) return true;
		}
		return false;
	},

	/**
	 * Each crystal mob's hunting turn once the shared turn has resolved sleep, paralysis and sight.
	 * Returns `true` when it owned the turn; `false` hands an adjacent one to the shared melee, and
	 * an unseen hero to the shared wandering route below.
	 */
	takeCrystalMineTurn(this: DungeonScene, monster: Creature, distance: number): boolean {
		if (!monster.seesHero || distance <= 1) return false;
		if (monster.kind === 'crystalWisp') {
			if (this.gnollClearLine(monster, this.hero)) { this.crystalWispZap(monster); return true; }
			const path = this.crystalMinePath(monster, this.hero, true);
			if (path[0]) this.stepMonster(monster, path[0]);
			return true;
		}
		if (monster.kind === 'crystalGuardian') {
			//`modifyPassable()` while hunting: stomp through crystals only when the plain route is
			//more than twice the straight-line distance (or missing).
			const path = this.crystalMinePath(monster, this.hero, true);
			if (path[0]) this.crystalGuardianStep(monster, path[0]);
			return true;
		}
		return false;
	},

	/**
	 * `CrystalWisp.zap()`: a `MAGIC_BOLT` light beam (`canAttack()`'s clear line, never adjacent)
	 * for a magic hit roll and `NormalIntRange(5, 10)` straight into `damage()` - no armour, as
	 * every bolt here. The hero is the only target (the port's hostile AI hunts the hero).
	 */
	crystalWispZap(this: DungeonScene, wisp: Creature): void {
		this.faceAndSwing(wisp, this.hero);
		delete wisp.buffs['invisibility'];
		if (!rollHit(wisp, this.hero, true)) {
			this.showStatus(this.hero, t('port.log.dodged'), 0xffffff);
			return;
		}
		const dmg = this.absorbHeroDamage(Random.normalRange(5, 10), true);
		this.hero.hp -= dmg;
		this.showDamage(this.hero, dmg);
		this.spawnProjectile(wisp, this.hero);
		if (this.hero.hp <= 0) {
			this.say(t('port.mob.crystalwisp.beam_kill'), 'negative');
			this.kill(this.hero);
		}
	},

	/**
	 * `CrystalGuardian.move()` + `speed()`: a step costs `1/speed()` - four turns outside open space
	 * (`max(0.25, speed/4)`, three times quicker under Haste) - and a crystal it walks into shatters
	 * to `EMPTY` for one more `1/super.speed()`.
	 */
	crystalGuardianStep(this: DungeonScene, guardian: Creature, to: Step): void {
		const w = this.level.width;
		const cell = this.level.index(to.x, to.y);
		const crystal = this.crystalRawAt(cell) === Terrain.MINE_CRYSTAL;
		this.stepMonster(guardian, to);
		//`Char.speed()`: halved by Cripple (the spire's spikes give guardians 30 turns of it), tripled by Haste.
		const base = (guardian.buffs['cripple'] !== undefined ? 0.5 : 1) * (guardian.buffs['haste'] !== undefined ? 3 : 1);
		if (crystal) {
			this.setMineCell(cell, Terrain.EMPTY);
			this.restitchTilesAround(to.x, to.y);
			this.refreshMineTiles();
			if (this.fov.isVisible(to.x, to.y)) runState.audio.cue('shatter', 0.7);
		}
		const open = isOpenSpace(cell, w, (c) => this.crystalSolid(c));
		this.pendingMonsterTurnCost = 1 / guardianSpeed(base, open) + (crystal ? 1 / base : 0);
	},

	/** `CrystalGuardian.isAlive()`: at 0 HP it drops to 1, loses every buff but Doom and Cripple,
	 * and crumples into `recovering` - taking no evasion roll (`defenseSkill()` 0) and no armour
	 * roll (its `defenseProc` damage is "block-bypassing") until it stands again. Returns true. */
	crumpleCrystalGuardian(this: DungeonScene, guardian: Creature): boolean {
		guardian.hp = Math.max(1, guardian.hp);
		//Java keeps `Doom` too; this port has no Doom buff.
		for (const id of Object.keys(guardian.buffs) as BuffId[]) if (id !== 'cripple') delete guardian.buffs[id];
		if (!guardian.guardianRecovering) {
			guardian.guardianRecovering = true;
			guardian.evasion = 0;
			guardian.armor = [0, 0];
			this.syncCrystalMineVisual(guardian);
		}
		return true;
	},

	/** `CrystalSpire.isInvulnerable()` (all but the pickaxe) and a crumpled guardian's
	 * (`recovering`: every `Char` but the hero and the spire). */
	crystalMineInvulnerable(this: DungeonScene, defender: Creature, attacker?: Creature): boolean {
		if (defender.kind === 'crystalSpire') return true;
		return defender.kind === 'crystalGuardian' && defender.guardianRecovering === true && attacker !== undefined && !attacker.isHero;
	},

	/**
	 * `CrystalSpire.damage()` zeroes every source but the pickaxe. `attack()` and blasts refuse it
	 * up front (`crystalMineInvulnerable`), but several seams (wand bolts, cursed wands, Guiding
	 * Light, Shocking arcs) subtract `hp` directly, so the pickaxe-only pool is restored here - on
	 * the spire's own turn and in `kill()`, which therefore never lets any other seam smash it.
	 * Returns true when it undid something. Simplified: such a hit still shows its damage number
	 * until the spire's next act.
	 */
	restoreSpireHp(this: DungeonScene, spire: Creature): boolean {
		const hp = spire.spireHp ?? spire.maxHp;
		if (spire.hp === hp) return false;
		spire.hp = hp;
		return true;
	},

	/** After damage lands: a guardian brought to 0 HP crumples instead of dying. */
	crystalMineAfterDamage(this: DungeonScene, defender: Creature): void {
		if (defender.kind === 'crystalGuardian' && defender.hp <= 0) this.crumpleCrystalGuardian(defender);
	},

	/** The spire's own sight (`updateFieldOfView`, `Char.viewDistance` 8) - it tracks an invisible hero.
	 * Java's `MINE_CRYSTAL` is `SOLID` but not `LOS_BLOCKING`, so this sight looks through crystals
	 * (the shared terrain maps them to `wall`, which blocks every other sight here - `gameBridge.ts`). */
	spireFov(this: DungeonScene, spire: Creature): Roguelike.FieldOfView {
		const level = this.level;
		const sight = Object.create(level, {
			transparent: { value: (x: number, y: number) => level.transparent(x, y) || (level.inside(x, y) && this.crystalRawAt(level.index(x, y)) === Terrain.MINE_CRYSTAL) },
		}) as typeof level;
		const fov = new Roguelike.FieldOfView(sight);
		fov.update(spire.x, spire.y, 8);
		return fov;
	},

	/**
	 * `CrystalSpire.act()`: first the next queued spike wave lands (below), then - once the third
	 * pickaxe strike has roused it and the hero is in its sight - every `ABILITY_CD` 15 turns it
	 * queues a diamond around the hero or a 7-cell line at him (50/50), with wider follow-up waves
	 * as it is broken down, spending `gate(TICK, ceil(hero.cooldown()), 3*TICK)` and interrupting.
	 */
	takeSpireTurn(this: DungeonScene, spire: Creature): void {
		if (spire.spireTargets && spire.spireTargets.length > 0) {
			const wave = spire.spireTargets.shift()!;
			if (this.landSpireWave(spire, wave)) return;
		}
		const seen = this.hero.hp > 0 && this.spireFov(spire).isVisible(this.hero.x, this.hero.y);
		if ((spire.spireHits ?? 0) < 3 || !seen) return;
		spire.spireAbilityCd ??= 0;
		if (spire.spireAbilityCd > 0) { spire.spireAbilityCd -= 1; return; }
		const w = this.level.width;
		const open = (cell: number): boolean => !this.crystalSolid(cell) || this.crystalRawAt(cell) === Terrain.MINE_CRYSTAL;
		if (Random.int(0, 2) === 0) {
			spire.spireTargets = planSpireDiamond(this.level.index(this.hero.x, this.hero.y), spire.hp, spire.maxHp, w, open);
		} else {
			//`new Ballistica(pos, hero.pos, WONT_STOP).subPath(1, 7)`: the bolt runs on past the hero.
			const dx = this.hero.x - spire.x, dy = this.hero.y - spire.y;
			const far = { x: spire.x + dx * 64, y: spire.y + dy * 64 };
			const path = Roguelike.ballistica(this.level, spire, far, { stop: 'none' }).cells.slice(1, 8)
				.filter((c) => this.level.inside(c.x, c.y)).map((c) => this.level.index(c.x, c.y));
			spire.spireTargets = planSpireLine(path, spire.hp, spire.maxHp, w, open);
		}
		spire.spireAbilityCd += 15;
		this.pendingMonsterTurnCost = spireAbilityDelay(1);
		this.travelTarget = null;
		this.refreshTargetedCellsOverlay();
	},

	/**
	 * One wave of spikes: every cell but the spire's own grows a `MINE_CRYSTAL`, then each
	 * character there but a wisp or the spire takes `NormalIntRange(6, 15)` (`SpireSpike`, no
	 * armour) - 12 more and `Cripple` 30 (prolonged) on a guardian - and is knocked one cell: a
	 * guardian away from the hero, anyone else (not `IMMOVABLE`) away from the spire. Returns true
	 * when it killed the hero. Not ported: `Statistics.questScores[2] -= 100` (no quest scores).
	 */
	landSpireWave(this: DungeonScene, spire: Creature, wave: readonly number[]): boolean {
		const w = this.level.width;
		const xy = (cell: number): Step => ({ x: cell % w, y: Math.floor(cell / w) });
		const spireCell = this.level.index(spire.x, spire.y);
		for (const cell of wave) {
			if (cell === spireCell) continue;
			this.setMineCell(cell, Terrain.MINE_CRYSTAL);
		}
		this.restitchAllTiles();
		this.refreshMineTiles();
		for (const cell of wave) {
			const at = xy(cell);
			const ch = this.creatureAt(at.x, at.y);
			if (!ch || ch.hp <= 0 || ch.kind === 'crystalWisp' || ch.kind === 'crystalSpire') continue;
			const guardian = ch.kind === 'crystalGuardian';
			const dmg = spikeDamage(Random.normalRange(6, 15), guardian);
			if (guardian && !buffBlocked(ch, 'cripple')) ch.buffs['cripple'] = Math.max(ch.buffs['cripple'] ?? 0, 30);
			const away = guardian ? this.level.index(this.hero.x, this.hero.y) : spireCell;
			const free = (c: number): boolean => { const p = xy(c); return !this.crystalSolid(c) && !this.creatureAt(p.x, p.y); };
			const movePos = guardian || !(ch.kind && IMMOVABLE_KINDS.has(ch.kind)) ? spikeKnockCell(cell, w, away, free) : cell;
			if (ch.isHero) {
				const taken = this.absorbHeroDamage(dmg);
				this.hero.hp -= taken;
				this.showDamage(this.hero, taken);
				if (this.hero.hp <= 0) {
					this.say(t('actors.char.kill', { 0: spire.name }), 'negative');
					this.kill(this.hero);
					return true;
				}
			} else {
				this.applyBlastDamage(ch, dmg, true, 'foe');
			}
			if (ch.hp > 0 && movePos !== cell) this.moveTo(ch, xy(movePos));
		}
		this.shakeScreen(1, 0.7);
		runState.audio.cue('shatter', 0.7);
		this.refreshTargetedCellsOverlay();
		return false;
	},

	/** The next spike wave of every spire, for the `TargetedCell` overlay. */
	crystalWarningCells(this: DungeonScene): Step[] {
		const w = this.level.width;
		return this.creatures.flatMap((c) => c.kind === 'crystalSpire' ? c.spireTargets?.[0] ?? [] : [])
			.map((cell) => ({ x: cell % w, y: Math.floor(cell / w) }));
	},

	/**
	 * `CrystalSpire.interact()`: the hero strikes it with the pickaxe (carried is enough) for the
	 * pickaxe's own tier-2 `NormalIntRange(2+lvl, 15+3*lvl)` - rolled with the spire as owner, so no
	 * strength or other gear counts - shortening its ability clock by `dmg/10f`. Strike 1 warns,
	 * strike 3 rouses it (boss bar, first attack a turn later) and, from then on, every strike
	 * beckons the wisps and every guardian not yet hunting toward it: sleeping ones are paralysed
	 * `20 - distance` turns when within 20 of it, awake ones far off (> 8) hasted
	 * `round((distance-8)/2)`. Not ported: the pickaxe's augment factor.
	 */
	tryPickaxeSpire(this: DungeonScene, spire: Creature): boolean {
		if (spire.kind !== 'crystalSpire') return false;
		const pickaxe = this.bag.find('pickaxe');
		if (!pickaxe) { this.actionSpentTurn = true; return true; }
		const level = (pickaxe as { level?: number }).level ?? 0;
		const dmg = Random.normalRange(2 + level, 15 + 3 * level);
		spire.hp = (spire.spireHp ?? spire.hp) - dmg;
		spire.spireHp = spire.hp;
		spire.spireAbilityCd = (spire.spireAbilityCd ?? 0) - dmg / 10;
		this.showDamage(spire, dmg);
		if (spire.hp <= spire.maxHp / 3) this.bossBleedLatched = true;
		spire.spireHits = (spire.spireHits ?? 0) + 1;
		const hits = spire.spireHits;
		if (spire.hp > 0) {
			runState.audio.cue('shatter', 0.7, Random.float(1.15, 1.25));
			this.syncCrystalMineVisual(spire);
		}
		if (hits === 1) {
			this.say(t('port.mob.crystalspire.warning'), 'warning');
			this.shakeScreen(1, 0.7);
			runState.audio.cue('mine', 0.7);
		} else if (hits >= 3) {
			if (hits === 3) {
				runState.audio.cue('rocks', 0.7);
				this.shakeScreen(3, 0.7);
				this.say(t('port.mob.crystalspire.alert'), 'negative');
				spire.spireAbilityCd = 1;
			}
			this.rallyCrystalMine(spire);
		}
		if (spire.hp <= 0) this.kill(spire);
		delete this.hero.buffs['invisibility'];
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
		return true;
	},

	/** The rally half of `interact()` once `hits >= 3` (see `tryPickaxeSpire`). "Hunting" is this
	 * port's `seesHero`. `beckon(pos)` wakes the mob and sends it to the spire - here to the
	 * striking hero's cell beside it, since this port's hunt-the-last-seen-cell step gives up on an
	 * occupied cell and the spire never leaves its own (the guardians' `aggro(hero)` points them at
	 * the hero anyway). */
	rallyCrystalMine(this: DungeonScene, spire: Creature): void {
		const rally = { x: this.hero.x, y: this.hero.y };
		const beckon = (mob: Creature): void => { mob.sleeping = false; mob.lastSeen = { ...rally }; };
		const atSpire = (mob: Creature): boolean => mob.lastSeen?.x === rally.x && mob.lastSeen?.y === rally.y;
		for (const mob of this.creatures) {
			if (mob.hp <= 0 || mob.isAlly) continue;
			if (mob.kind === 'crystalWisp' && !mob.seesHero && !atSpire(mob)) beckon(mob);
			if (mob.kind !== 'crystalGuardian') continue;
			//`PathFinder.buildDistanceMap(pos, passable + MINE_CRYSTAL)`: the route through crystals.
			const route = this.crystalRoute(spire, mob, true, true);
			const distance = route.length > 0 ? route.length : Infinity;
			if (mob.sleeping) {
				beckon(mob);
				if (distance < 20 && !buffBlocked(mob, 'paralysis')) addBuff(mob, 'paralysis', 20 - distance);
			} else if (!mob.seesHero && !atSpire(mob)) {
				beckon(mob);
				if (distance > 8 && distance !== Infinity) mob.buffs['haste'] = (mob.buffs['haste'] ?? 0) + Math.round((distance - 8) / 2);
			}
		}
	},

	/**
	 * The spire shattering (`interact()`'s `!isAlive()` branch): the quest boss is beaten
	 * (`Blacksmith.Quest.beatBoss()`), every crystal it can see breaks to `EMPTY`, every guardian it
	 * can see takes its full HT as `SpireSpike` damage (so it crumples - guardians cannot die) and
	 * every wisp it can see is blinded 5 turns.
	 */
	crystalSpireDied(this: DungeonScene, spire: Creature): void {
		this.blacksmithBossBeaten = true;
		runState.audio.cue('shatter', 0.7);
		runState.audio.cue('rocks', 0.7);
		this.shakeScreen(3, 0.7);
		const fov = this.spireFov(spire);
		const paint = this.portedPaint;
		if (paint) {
			for (let cell = 0; cell < paint.map.length; cell++) {
				const x = cell % this.level.width, y = Math.floor(cell / this.level.width);
				if (paint.map[cell] === Terrain.MINE_CRYSTAL && fov.isVisible(x, y)) this.setMineCell(cell, Terrain.EMPTY);
			}
			this.restitchAllTiles();
			this.refreshMineTiles();
		}
		for (const mob of [...this.creatures]) {
			if (mob === spire || mob.hp <= 0 || !fov.isVisible(mob.x, mob.y)) continue;
			if (mob.kind === 'crystalGuardian') this.applyBlastDamage(mob, mob.maxHp, true, 'foe');
			if (mob.kind === 'crystalWisp') addBuff(mob, 'blindness', 5);
		}
		delete spire.spireTargets;
		this.refreshTargetedCellsOverlay();
	},
};
