import type { DungeonScene } from '../../dungeonScene';
import { Random, Roguelike, SpriteSheet } from 'mwg';
import { AnimatedSprite } from 'mwg/two-d/render';
import { buffBlocked, type Creature, type Step } from '../../../combat';
import { GAME_KIND_CODES } from '../../../dungeonConstants';
import { t } from '../../../i18n/index';
import { runState } from '../../../runState';
import { faceCharacter } from '../../../ui/characterPlacement';
import { simulationRandom } from '../../../adapters/mwgRandom';
import { traceRayToTarget } from '../../../mechanics/rays';
import { planDM300Knockback } from '../../../simulation/dm300Boss';
import {
	cellDistance, cellTrueDistance, chooseDashSpawn, chooseThrownBoulder, gnollAbilityDelay, neighbours8,
	planGnollRockFall, resolveGeomancerDamage, spreadDiamond,
} from '../../../simulation/gnollGeomancer';
import { SPD_TERRAIN_TO_GAME_KIND } from '../../../spdLevelGen/gameBridge';
import { Terrain } from '../../../spdLevelGen/paintLevel';
import { BLACKSMITH_QUEST, blacksmithQuestType } from '../../../spdLevelGen/blacksmith';

/**
 * The Blacksmith GNOLL mine quest's three actors (`actors/mobs/GnollGuard.java`,
 * `GnollSapper.java`, `GnollGeomancer.java`, tag `v3.3.8`), placed by `MineLargeRoom` (a sapper
 * and its guard) and `MineGiantRoom` (the geomancer, under 50 `RockArmor`), plus
 * `MiningLevel.createMob()`'s ambient guards. The pure halves live in
 * `simulation/gnollGeomancer.ts`; this group applies them to the scene. `PORT_COVERAGE.md`'s
 * "Blacksmith GNOLL mine roster" row lists what is simplified.
 */
export const GNOLL_MINE_KINDS: ReadonlySet<string> = new Set(['gnollGuard', 'gnollSapper', 'gnollGeomancer']);

/** `GnollGuardSprite`/`GnollSapperSprite`/`GnollGeomancerSprite`: every animation, offset by the
 * geomancer's 21-frame statue set while it wears rock armour (`updateAnims()`'s `ofs`). */
function gnollClips(ofs: number, statue: boolean): [string, number[], { fps: number; loop: boolean }][] {
	return [
		['idle', [0, 0, 0, 1, 0, 0, 1, 1].map((f) => f + ofs), { fps: statue ? 1 : 2, loop: true }],
		['run', [4, 5, 6, 7].map((f) => f + ofs), { fps: 12, loop: true }],
		['attack', [2, 3, 0].map((f) => f + ofs), { fps: 12, loop: false }],
		['die', [8, 9, 10].map((f) => f + ofs), { fps: 12, loop: false }],
	];
}

const GNOLL_SHEETS = {
	gnollGuard: { sprite: 'gnollGuard', w: 12, h: 16 },
	gnollSapper: { sprite: 'gnollSapper', w: 12, h: 15 },
	gnollGeomancer: { sprite: 'gnollGeomancer', w: 12, h: 16 },
} as const;

export const gnollMineMethods = {
	/** The living partner a link points at (`Actor.findById(id)` + `isAlive()`). */
	gnollPartner(this: DungeonScene, creature: Creature): Creature | undefined {
		if (creature.gnollPartnerId === undefined) return undefined;
		return this.creatures.find((other) => other.id === creature.gnollPartnerId && other.hp > 0);
	},

	/** `GnollGuard`/`GnollGeomancer.hasSapper()`. */
	gnollHasSapper(this: DungeonScene, creature: Creature): boolean {
		return this.gnollPartner(creature)?.kind === 'gnollSapper';
	},

	/** `GnollSapper.linkPartner()`: drops its old partner, then links both ways. */
	gnollLinkPartner(this: DungeonScene, sapper: Creature, partner: Creature): void {
		this.gnollLosePartner(sapper);
		sapper.gnollPartnerId = partner.id;
		partner.gnollPartnerId = sapper.id;
	},

	/** `GnollSapper.losePartner()` (and the partner's `loseSapper()`). */
	gnollLosePartner(this: DungeonScene, sapper: Creature): void {
		const partner = this.gnollPartner(sapper);
		if (partner && partner.gnollPartnerId === sapper.id) delete partner.gnollPartnerId;
		delete sapper.gnollPartnerId;
	},

	/** Re-applies the gnoll sprite's clips; the geomancer swaps to its statue frames while it
	 * wears rock armour (`GnollGeomancerSprite.idle()`/`link()`). Java's `GnollGeomancerSprite`
	 * constructor also sets a 1.25 scale (tag `v3.3.8`); preserve it across clip refreshes and
	 * facing changes. Not ported: the
	 * `EarthParticle` emitter a sapper-linked guard or geomancer wears (no particle seam). */
	syncGnollMineVisual(this: DungeonScene, creature: Creature): void {
		const sheetInfo = GNOLL_SHEETS[creature.kind as keyof typeof GNOLL_SHEETS];
		const sprite = this.spriteFor.get(creature.id);
		if (!sheetInfo || !(sprite instanceof AnimatedSprite)) return;
		const statue = creature.kind === 'gnollGeomancer' && (creature.rockArmor ?? 0) > 0;
		const sheet = SpriteSheet.fromTexture(runState.sprites[sheetInfo.sprite], sheetInfo.w, sheetInfo.h);
		for (const [name, frames, clip] of gnollClips(statue ? 21 : 0, statue)) sprite.add(name, frames.map((f) => sheet.get(f)), clip);
		if (creature.kind === 'gnollGeomancer') {
			//`GnollGeomancerSprite`'s constructor sets `scale.set(1.25f)`; retain the facing sign
			//used by `faceCharacter()` while refreshing the statue/idle clips.
			sprite.scale.set(sprite.scale.x < 0 ? -1.25 : 1.25, 1.25);
		}
		sprite.play('idle', true);
	},

	/**
	 * The room payloads `spawnPortedMobs` cannot carry: `MineLargeRoom` links each sapper to its
	 * guard (`sapper.linkPartner(guard)`) and records its `spawnPos`; `MineGiantRoom` arms the
	 * geomancer with `RockArmor.setShield(50)`. A geomancer already beaten is removed again: the
	 * mine is regenerated from its seed on every entry (it is not a persisted floor here), so
	 * without this a save/load would raise it a second time.
	 */
	linkMineQuestActors(this: DungeonScene, spawns: readonly { x: number; y: number; kind: string; spawnPos?: Step; partnerPos?: Step; shield?: number }[]): void {
		for (const spawn of spawns) {
			if (!GNOLL_MINE_KINDS.has(spawn.kind)) continue;
			const creature = this.creatureAt(spawn.x, spawn.y);
			if (!creature || creature.kind !== spawn.kind) continue;
			if (spawn.kind === 'gnollGeomancer') {
				if (this.blacksmithBossBeaten) { this.destroyAlly(creature); continue; }
				creature.rockArmor = spawn.shield ?? 50;
				creature.sleeping = true;
			}
			//Both casters roll `abilityCooldown` in their field initialiser, before anything can hit them.
			if (spawn.kind === 'gnollSapper') creature.gnollAbilityCd = Random.normalRange(4, 6);
			if (spawn.kind === 'gnollGeomancer') creature.gnollAbilityCd = Random.normalRange(3, 5);
			if (spawn.kind === 'gnollSapper') {
				const at = spawn.spawnPos ?? spawn;
				creature.gnollSpawnCell = this.level.index(at.x, at.y);
				const guard = spawn.partnerPos ? this.creatureAt(spawn.partnerPos.x, spawn.partnerPos.y) : null;
				if (guard?.kind === 'gnollGuard') this.gnollLinkPartner(creature, guard);
			}
		}
		for (const creature of this.creatures) if (creature.kind && GNOLL_MINE_KINDS.has(creature.kind)) this.syncGnollMineVisual(creature);
		this.linkCrystalMineActors(spawns);
	},

	/**
	 * `MiningLevel.createMob()`/`mobLimit()`: `mobLimit()` is `RegularLevel`'s
	 * `3 + depth%5 + Random.Int(3)` less one, every mob a `GnollGuard` on the GNOLL quest and a
	 * `CrystalWisp` (its colour rolled) on the CRYSTAL one. Simplified: each one takes a random
	 * open cell at least 8 cells from the hero (the entrance) instead of
	 * `RegularLevel.createMobs()`'s room-by-room pick, and the 3x slower respawn
	 * (`respawnCooldown()`) is not run - this mine never respawns.
	 */
	populateMiningBranch(this: DungeonScene): boolean {
		const quest = blacksmithQuestType();
		if (quest !== BLACKSMITH_QUEST.GNOLL && quest !== BLACKSMITH_QUEST.CRYSTAL) return false;
		const count = 3 + (this.depth % 5) + Random.int(0, 3) - 1;
		const open = this.level.passableCells().filter((cell) => {
			const x = cell % this.level.width, y = Math.floor(cell / this.level.width);
			return !this.creatureAt(x, y) && !this.portedMobCells.has(cell) && !this.trapKinds.has(cell)
				&& Roguelike.chebyshevDistance({ x, y }, this.hero) >= 8;
		});
		for (let i = 0; i < count && open.length > 0; i++) {
			const cell = open.splice(Random.int(0, open.length), 1)[0]!;
			const at = { x: cell % this.level.width, y: Math.floor(cell / this.level.width) };
			if (quest === BLACKSMITH_QUEST.CRYSTAL) this.rollCrystalTint(this.spawnMonster('crystalWisp', at));
			else this.syncGnollMineVisual(this.spawnMonster('gnollGuard', at));
		}
		return true;
	},

	/**
	 * The start of every gnoll's `act()`, ahead of every state gate (paralysis included, as in
	 * Java, whose override runs before `super.act()`): a queued boulder throw lands now and spends
	 * the turn (`spend(TICK)`), and a sleeping geomancer does nothing at all - its `Sleeping`
	 * never wakes on its own (`awaken()` is a no-op) - and `buffBlocked` refuses it every buff meanwhile.
	 * The geomancer also records the first three sapper spawns on its first act.
	 */
	gnollMinePreTurn(this: DungeonScene, monster: Creature): boolean {
		if (monster.kind === 'gnollGeomancer' && monster.geomancerSapperSpawns === undefined) {
			monster.geomancerSapperSpawns = this.creatures
				.filter((c) => c.kind === 'gnollSapper' && c.hp > 0 && c.gnollSpawnCell !== undefined)
				.slice(0, 3).map((c) => c.gnollSpawnCell!);
			while (monster.geomancerSapperSpawns.length < 3) monster.geomancerSapperSpawns.push(-1);
		}
		if (monster.gnollThrowFrom !== undefined) {
			const from = monster.gnollThrowFrom, to = monster.gnollThrowTo ?? -1;
			delete monster.gnollThrowFrom;
			delete monster.gnollThrowTo;
			delete monster.gnollWarnCells;
			const knocked = new Set<Creature>();
			for (const rock of from) {
				if (rock !== -1 && this.portedPaint?.map[rock] === Terrain.MINE_BOULDER) this.gnollThrowBoulder(monster, rock, to, knocked);
			}
			this.refreshTargetedCellsOverlay();
			return true;
		}
		//Dormant until the pickaxe's third strike, whatever else tried to rouse it: Java's `Sleeping.awaken()`
		//and `beckon()` are no-ops, so Scroll of Rage or Swarm Intelligence clearing `sleeping` changes nothing.
		if (monster.kind === 'gnollGeomancer' && (monster.geomancerHits ?? 0) < 3) {
			monster.sleeping = true;
			return true;
		}
		return false;
	},

	/**
	 * Each gnoll's hunting turn, reached once the shared turn has resolved sleep, paralysis and
	 * sight (`seesHero`). Returns `true` when it owned the turn; `false` hands a guard's adjacent
	 * or out-of-reach turn, and a sapper's adjacent one, to the shared melee/approach below.
	 */
	takeGnollMineTurn(this: DungeonScene, monster: Creature, distance: number): boolean {
		if (monster.kind === 'gnollGuard') return this.gnollGuardTurn(monster, distance);
		if (monster.kind === 'gnollSapper') return this.gnollSapperTurn(monster, distance);
		if (monster.kind === 'gnollGeomancer') return this.gnollGeomancerTurn(monster, distance);
		return false;
	},

	/**
	 * `GnollExile.canAttack()` (tag `v3.3.8`): adjacent, or within distance 2 when a two-step path to the
	 * target exists through cells that are neither solid nor held by another character (`buildDistanceMap`
	 * over `!solid` with every `Char` blocking but the exile's own cell) - "+1 reach". The swing is its
	 * ordinary attack, unlike the guard's spear. Returns true when it owned the turn (attacked from 2).
	 */
	gnollExileTurn(this: DungeonScene, exile: Creature, distance: number): boolean {
		if (!exile.seesHero || distance !== 2) return false;
		const open = Roguelike.neighbourOffsets(8).some(([dx, dy]) => {
			const mid = { x: exile.x + dx, y: exile.y + dy };
			return Roguelike.chebyshevDistance(mid, this.hero) === 1 && this.level.passable(mid.x, mid.y) && !this.creatureAt(mid.x, mid.y);
		});
		if (!open) return false;
		this.attack(exile, this.hero);
		return true;
	},

	/**
	 * `GnollGuard`: `canAttack()` reaches two cells when both straight `PROJECTILE` lines are clear
	 * ("cannot 'curve' spear hits"), and `damageRoll()` rolls 16-22 there instead of 6-12, warning
	 * the hero (`spear_warn`) on a hit over 12 (killing blows included; the HP actually lost stands in
	 * for `attackProc`'s post-armour damage, so a shield-absorbed share does not count). `Wandering.randomDestination()` is its sapper's cell.
	 */
	gnollGuardTurn(this: DungeonScene, guard: Creature, distance: number): boolean {
		if (!guard.seesHero) {
			const sapper = this.gnollHasSapper(guard) ? this.gnollPartner(guard)! : undefined;
			if (!sapper || Roguelike.chebyshevDistance(guard, sapper) <= 1) return false;
			const path = this.pathfinder.find({ x: guard.x, y: guard.y }, { x: sapper.x, y: sapper.y }, { blocked: this.wanderBlocked(guard, false) });
			if (path[0]) this.stepMonster(guard, path[0]);
			return true;
		}
		if (distance !== 2 || !this.gnollClearLine(guard, this.hero) || !this.gnollClearLine(this.hero, guard)) return false;
		const damage = guard.damage;
		const preHp = this.hero.hp;
		guard.damage = [16, 22];
		this.attack(guard, this.hero);
		guard.damage = damage;
		if (preHp - this.hero.hp > 12) this.say(t('port.mob.gnollguard.spear_warn'), 'negative');
		return true;
	},

	/**
	 * `GnollSapper.Hunting.act()`: rouses its partner once the hero is within 3, and every
	 * `NormalIntRange(4, 6)` turns either throws the nearest visible boulder at the hero or calls a
	 * range-2 rockfall - 50/50, never rockfall twice running, always the throw when the hero stands
	 * by a barricade, always rockfall with nothing to throw. It never approaches a visible enemy,
	 * only strikes one that is adjacent. Out of sight it goes home (`Wandering.randomDestination()`
	 * is `spawnPos`) - simplified from Java's "chase a lost target only within 3 of the spawn".
	 */
	gnollSapperTurn(this: DungeonScene, sapper: Creature, distance: number): boolean {
		if (!sapper.seesHero) {
			const home = sapper.gnollSpawnCell;
			if (home === undefined || this.level.index(sapper.x, sapper.y) === home) return true;
			const target = { x: home % this.level.width, y: Math.floor(home / this.level.width) };
			const path = this.pathfinder.find({ x: sapper.x, y: sapper.y }, target, { blocked: this.wanderBlocked(sapper, false) });
			if (path[0]) this.stepMonster(sapper, path[0]);
			return true;
		}
		const partner = this.gnollPartner(sapper);
		if (partner && distance <= 3) {
			partner.sleeping = false;
			partner.seesHero = true;
			partner.lastSeen = { x: this.hero.x, y: this.hero.y };
		}
		sapper.gnollAbilityCd ??= Random.normalRange(4, 6);
		const ready = sapper.gnollAbilityCd <= 0;
		sapper.gnollAbilityCd -= 1;
		if (ready && this.gnollUseAbility(sapper, 1, 2)) {
			sapper.gnollAbilityCd = Random.normalRange(4, 6);
			return true;
		}
		return distance > 1;
	},

	/**
	 * `GnollGeomancer.Hunting.act()`: no melee at all. With rock armour on it counts its cooldown
	 * down twice as fast while the hero keeps its distance (or its sapper lives) and is not
	 * paralysed; it rouses its sapper; and it throws up to `3 - bracket` boulders at once, or calls
	 * a `6 - 2*bracket` rockfall, every `NormalIntRange(3, 5)` turns. Out of sight it waits
	 * (`chooseEnemy()` finds nobody else here - the port's hostile AI hunts the hero).
	 */
	gnollGeomancerTurn(this: DungeonScene, geomancer: Creature, distance: number): boolean {
		if (!geomancer.seesHero) return true;
		geomancer.gnollAbilityCd ??= Random.normalRange(3, 5);
		if ((distance > 2 || this.gnollHasSapper(geomancer)) && (geomancer.rockArmor ?? 0) > 0 && this.hero.buffs['paralysis'] === undefined) {
			geomancer.gnollAbilityCd -= 1;
		}
		const sapper = this.gnollHasSapper(geomancer) ? this.gnollPartner(geomancer)! : undefined;
		if (sapper) {
			sapper.sleeping = false;
			sapper.seesHero = true;
			sapper.lastSeen = { x: this.hero.x, y: this.hero.y };
		}
		const ready = geomancer.gnollAbilityCd <= 0;
		geomancer.gnollAbilityCd -= 1;
		if (ready) {
			const bracket = Math.min(2, Math.floor(geomancer.hp / Math.floor(geomancer.maxHp / 3)));
			if (this.gnollUseAbility(geomancer, 3 - bracket, 6 - 2 * bracket)) geomancer.gnollAbilityCd = Random.normalRange(3, 5);
		}
		return true;
	},

	/**
	 * The shared ability choice (`GnollSapper`/`GnollGeomancer.Hunting.act()`): up to `rocks`
	 * queued boulder throws, or a `range` rockfall. Both telegraph their cells and cost
	 * `gate(TICK, ceil(enemy.cooldown()), 3*TICK)` - one turn at this port's one-turn hero
	 * cooldown. The throws land on the thrower's next act (`gnollMinePreTurn`).
	 */
	gnollUseAbility(this: DungeonScene, source: Creature, rocks: number, range: number): boolean {
		const heroCell = this.level.index(this.hero.x, this.hero.y);
		const nextToBarricade = neighbours8(this.level.width).some((i) => {
			const raw = this.portedPaint?.map[heroCell + i];
			return raw === Terrain.BARRICADE || raw === Terrain.ENTRANCE;
		});
		let aim = this.gnollPrepRockThrow(source);
		this.travelTarget = null;
		this.pendingMonsterTurnCost = gnollAbilityDelay(1);
		if (aim !== null && (nextToBarricade || source.gnollLastRockfall || Random.int(0, 2) === 0)) {
			source.gnollLastRockfall = false;
			source.gnollThrowFrom = [];
			source.gnollThrowTo = heroCell;
			source.gnollWarnCells = [];
			for (let i = 0; i < rocks && aim !== null; i++) {
				source.gnollThrowFrom.push(aim);
				const from = { x: aim % this.level.width, y: Math.floor(aim / this.level.width) };
				//`new Ballistica(sourcePos, collisionPos, STOP_SOLID)` - the warning trail.
				const trail = Roguelike.ballistica(this.level, from, this.hero, { stop: 'impassable' }).cells;
				source.gnollWarnCells.push(...trail.map((c) => this.level.index(c.x, c.y)));
				aim = this.gnollPrepRockThrow(source);
			}
			this.faceAndSwing(source, this.hero);
			this.refreshTargetedCellsOverlay();
			return true;
		}
		const cells = this.gnollPlanRockFall(source, range);
		source.gnollLastRockfall = true;
		//`Buff.append(source, GnollRockFall.class, gate(...))`: lands after the hero's next move,
		//DM-300's own two-turn convention for the same `DelayedRockFall` shape (`dm300Rockfall`).
		if (cells.length > 0) this.fallingRocks.push({ cells: cells.map((c) => ({ x: c % this.level.width, y: Math.floor(c / this.level.width) })), turns: 2, gnoll: true });
		this.faceAndSwing(source, this.hero);
		this.refreshTargetedCellsOverlay();
		return true;
	},

	faceAndSwing(this: DungeonScene, source: Creature, target: Step): void {
		const sprite = this.spriteFor.get(source.id);
		if (sprite instanceof AnimatedSprite && sprite.has('attack')) sprite.play('attack', true);
		if (sprite) faceCharacter(sprite, source.x, target.x);
	},

	/** A straight line from `from` reaches `to` with no wall or creature in between
	 * (`new Ballistica(from, to, PROJECTILE).collisionPos == to`) - one direction only. */
	gnollClearLine(this: DungeonScene, from: Step, to: Step): boolean {
		const cells = traceRayToTarget(this.level, from, to, (x, y) => this.creatureAt(x, y));
		const last = cells[cells.length - 1];
		return last !== undefined && last.x === to.x && last.y === to.y;
	},

	/**
	 * `GnollGeomancer.prepRockThrowAttack()`: every `MINE_BOULDER` in the thrower's field of view
	 * (12 cells for the geomancer's `viewDistance`, the usual radius for a sapper) with a clear
	 * `PROJECTILE` line to the hero, minus boulders any gnoll already has queued, nearest the hero.
	 */
	gnollPrepRockThrow(this: DungeonScene, source: Creature): number | null {
		const map = this.portedPaint?.map;
		if (!map) return null;
		const fov = new Roguelike.FieldOfView(this.level);
		fov.update(source.x, source.y, source.kind === 'gnollGeomancer' ? 12 : this.viewRadius());
		const queued = new Set(this.creatures.flatMap((c) => c.gnollThrowFrom ?? []));
		const candidates: number[] = [];
		for (let cell = 0; cell < map.length; cell++) {
			if (map[cell] !== Terrain.MINE_BOULDER || queued.has(cell)) continue;
			const at = { x: cell % this.level.width, y: Math.floor(cell / this.level.width) };
			if (fov.isVisible(at.x, at.y) && this.gnollClearLine(at, this.hero)) candidates.push(cell);
		}
		return chooseThrownBoulder(this.level.width, this.level.index(this.hero.x, this.hero.y), candidates);
	},

	gnollPlanRockFall(this: DungeonScene, source: Creature, range: number): number[] {
		const map = this.portedPaint?.map;
		if (!map) return [];
		const w = this.level.width;
		const solid = (cell: number): boolean => SPD_TERRAIN_TO_GAME_KIND[map[cell]!] === 'wall';
		return planGnollRockFall(this.level.index(this.hero.x, this.hero.y), this.level.index(source.x, source.y), source.kind === 'gnollGeomancer', range, true, {
			width: w,
			length: map.length,
			insideMap: (cell) => cell % w > 0 && cell % w < w - 1 && cell >= w && cell < map.length - w,
			solid,
			trap: (cell) => this.trapKinds.has(cell),
			barricadeOrEntrance: (cell) => map[cell] === Terrain.BARRICADE || map[cell] === Terrain.ENTRANCE,
			geomancerAt: (cell) => this.creatureAt(cell % w, Math.floor(cell / w))?.kind === 'gnollGeomancer',
			sapperAt: (cell) => this.creatureAt(cell % w, Math.floor(cell / w))?.kind === 'gnollSapper',
		}, simulationRandom);
	},

	/** Writes one raw mine cell and the collision grid under it. */
	setMineCell(this: DungeonScene, cell: number, raw: number): void {
		const paint = this.portedPaint;
		if (!paint) return;
		paint.map[cell] = raw;
		const kind = SPD_TERRAIN_TO_GAME_KIND[raw] ?? 'floor';
		this.level.set(cell % this.level.width, Math.floor(cell / this.level.width), GAME_KIND_CODES[kind as keyof typeof GAME_KIND_CODES]);
	},

	/** Paralysis with `Buff.prolong` semantics (keep the longer of the two). */
	gnollProlongParalysis(this: DungeonScene, target: Creature, turns: number): void {
		if (buffBlocked(target, 'paralysis')) return;
		target.buffs['paralysis'] = Math.max(target.buffs['paralysis'] ?? 0, turns);
	},

	/**
	 * One boulder or falling rock striking a character: `NormalIntRange(6, 12)` straight into
	 * `damage()` (no armour), then `Paralysis` 3 - 10 for a guard - on a survivor, an invulnerable
	 * geomancer included (Java's `damage()` is negated but the `Buff.prolong` still runs). Returns true
	 * when it killed the hero. Not ported: `Statistics.questScores[2] -= 100` (no quest scores).
	 */
	gnollRockStrike(this: DungeonScene, target: Creature, killKey: string): boolean {
		const dmg = Random.normalRange(6, 12);
		if (target.isHero) {
			const taken = this.absorbHeroDamage(dmg);
			this.hero.hp -= taken;
			this.showDamage(this.hero, taken);
			if (this.hero.hp <= 0) {
				this.say(t(killKey), 'negative');
				this.kill(this.hero);
				return true;
			}
			this.gnollProlongParalysis(this.hero, 3);
			return false;
		}
		if (this.gnollMineInvulnerable(target)) { this.gnollProlongParalysis(target, 3); return false; }
		const preHp = target.hp;
		target.hp -= this.gnollMineDamageTaken(target, dmg);
		this.gnollMineAfterDamage(target, preHp);
		this.showDamage(target, preHp - target.hp);
		if (target.hp <= 0) this.kill(target);
		else this.gnollProlongParalysis(target, target.kind === 'gnollGuard' ? 10 : 3);
		return false;
	},

	/**
	 * `GnollGeomancer.doRockThrowAttack()`: the boulder leaves its cell (`EMPTY`) and flies as a
	 * `MAGIC_BOLT` - on past the aimed cell until a character or a wall stops it. A character
	 * other than a geomancer takes the rock strike and, once per volley, is knocked one cell on
	 * along the rock's path (`WandOfBlastWave.throwChar`, power 1, no collision damage); an empty
	 * landing cell is pressed (traps fire).
	 */
	gnollThrowBoulder(this: DungeonScene, source: Creature, from: number, to: number, knocked: Set<Creature>): void {
		const w = this.level.width;
		const origin = { x: from % w, y: Math.floor(from / w) };
		const aim = { x: to % w, y: Math.floor(to / w) };
		this.setMineCell(from, Terrain.EMPTY);
		this.restitchTilesAround(origin.x, origin.y);
		this.refreshMineTiles();
		this.faceAndSwing(source, origin);
		//Extend the aim past its target so the bolt keeps flying, as `MAGIC_BOLT` does.
		const dx = aim.x - origin.x, dy = aim.y - origin.y;
		const far = { x: origin.x + dx * 64, y: origin.y + dy * 64 };
		const path = Roguelike.ballistica(this.level, origin, far, { stop: 'impassable' }).cells.slice(1)
			.filter((c) => this.level.inside(c.x, c.y));
		let landing: Step | undefined;
		let next: Step | undefined;
		for (let i = 0; i < path.length; i++) {
			const cell = path[i]!;
			if (!this.level.passable(cell.x, cell.y)) break;
			landing = cell;
			next = path[i + 1];
			if (this.creatureAt(cell.x, cell.y)) break;
		}
		runState.audio.cue('rocks', 0.7);
		if (!landing) return;
		const hit = this.creatureAt(landing.x, landing.y);
		this.shakeScreen(hit?.isHero ? 3 : 0.5, hit?.isHero ? 0.7 : 0.5);
		if (hit && hit.kind !== 'gnollGeomancer') {
			if (this.gnollRockStrike(hit, 'port.mob.gnollgeomancer.rock_kill')) return;
			if (hit.hp > 0 && next && !knocked.has(hit)) {
				knocked.add(hit);
				const back = { x: landing.x - Math.sign(next.x - landing.x), y: landing.y - Math.sign(next.y - landing.y) };
				const dest = planDM300Knockback(back, landing, 1, {
					blocked: (x, y) => !this.level.inside(x, y) || !this.level.passable(x, y),
					occupied: (x, y) => { const o = this.creatureAt(x, y); return o !== null && o !== hit; },
					immovable: hit.buffs['roots'] !== undefined,
				});
				if (dest.x !== hit.x || dest.y !== hit.y) this.moveTo(hit, dest);
			}
		} else if (!hit) this.triggerTrapAt(landing.x, landing.y);
	},

	/**
	 * `GnollGeomancer.GnollRockFall` landing (`DelayedRockFall.act()`): a character in a cell -
	 * any, a geomancer that dashed in since the volley was planned too - takes the rock strike
	 * (`rockfall_kill` on the hero); an empty cell becomes a `MINE_BOULDER` 1 time in 3, unless
	 * it is `EMPTY_SP` or adjacent to the entrance (`Level.adjacent`: distance exactly 1). Returns true on a hero kill.
	 */
	landGnollRockFall(this: DungeonScene, cells: readonly Step[]): boolean {
		let changed = false;
		for (const at of cells) {
			const target = this.creatureAt(at.x, at.y);
			if (target) {
				if (target.hp > 0 && this.gnollRockStrike(target, 'port.mob.gnollgeomancer.rockfall_kill')) return true;
				continue;
			}
			const cell = this.level.index(at.x, at.y);
			const entrance = this.entranceCell;
			const byEntrance = entrance !== null && Roguelike.chebyshevDistance(at, entrance) === 1;
			if (this.portedPaint && this.portedPaint.map[cell] !== Terrain.EMPTY_SP && !byEntrance && Random.int(0, 3) === 0) {
				this.setMineCell(cell, Terrain.MINE_BOULDER);
				this.restitchTilesAround(at.x, at.y);
				changed = true;
			}
		}
		if (changed) this.refreshMineTiles();
		runState.audio.cue('rocks', 0.7);
		this.refreshTargetedCellsOverlay();
		return false;
	},

	/** Every queued gnoll warning cell and in-flight gnoll rockfall, for the `TargetedCell` overlay. */
	gnollWarningCells(this: DungeonScene): Step[] {
		const w = this.level.width;
		const cells = this.creatures.flatMap((c) => c.gnollWarnCells ?? []).map((cell) => ({ x: cell % w, y: Math.floor(cell / w) }));
		for (const volley of this.fallingRocks) if (volley.gnoll) cells.push(...volley.cells);
		//The CRYSTAL mine's spire marks its next spike wave through the same overlay.
		cells.push(...this.crystalWarningCells());
		return cells;
	},

	/** `GnollGeomancer.isInvulnerable()`: armoured (to everything but the pickaxe) or sapper-linked. */
	gnollMineInvulnerable(this: DungeonScene, defender: Creature): boolean {
		return defender.kind === 'gnollGeomancer' && ((defender.rockArmor ?? 0) > 0 || this.gnollHasSapper(defender));
	},

	/** `GnollGuard.damage()`: a sapper-linked guard takes a quarter (`dmg /= 4`, integer). */
	gnollMineDamageTaken(this: DungeonScene, defender: Creature, damage: number): number {
		return defender.kind === 'gnollGuard' && this.gnollHasSapper(defender) ? Math.floor(damage / 4) : damage;
	},

	/**
	 * After HP has dropped from `preHp`: both casters lower their `int` ability cooldown by
	 * `dmg/10f` with Java's narrowing (`(int)(cd - dmg/10f)`, truncating toward zero - so a hit of
	 * 1-9 still costs a whole turn off a positive clock). Simplified: `dmg` here is the HP actually
	 * lost, not `damage()`'s pre-shield argument (the two differ only when a shield absorbs a share),
	 * and the geomancer runs its bracket rule - clamped to one bracket per hit, unkillable
	 * before the last, and on each crossing a dash to the next sapper camp under fresh 25-point
	 * rock armour (`damage()`'s `carveRockAndDash(); Buff.affect(this, RockArmor.class).setShield(25)`).
	 */
	gnollMineAfterDamage(this: DungeonScene, defender: Creature, preHp: number): void {
		if (defender.kind !== 'gnollSapper' && defender.kind !== 'gnollGeomancer') return;
		const taken = preHp - defender.hp;
		if (taken > 0) this.gnollLowerCooldown(defender, taken);
		if (defender.kind !== 'gnollGeomancer') return;
		const result = resolveGeomancerDamage(preHp, defender.hp, defender.maxHp);
		defender.hp = result.hp;
		if (!result.crossed) return;
		if (result.bleed) this.bossBleedLatched = true;
		this.carveRockAndDash(defender);
		defender.rockArmor = Math.max(defender.rockArmor ?? 0, 25);
		this.syncGnollMineVisual(defender);
	},

	/** `abilityCooldown -= dmg/10f` on a Java `int` (so `(int)` truncation), from its constructed roll. */
	gnollLowerCooldown(this: DungeonScene, caster: Creature, dmg: number): void {
		const cd = caster.gnollAbilityCd ?? (caster.kind === 'gnollSapper' ? Random.normalRange(4, 6) : Random.normalRange(3, 5));
		caster.gnollAbilityCd = Math.trunc(cd - dmg / 10);
	},

	/**
	 * `GnollGeomancer.interact()` with its rock armour on: the hero breaks it with the pickaxe (it
	 * need only be carried) for the pickaxe's own tier-2 `NormalIntRange(2+lvl, 15+3*lvl)` - Java
	 * rolls it with the geomancer as owner, so no strength or other gear counts - capped at 15
	 * while asleep and at the armour left. The first strike warns, the third wakes it: it dashes
	 * to a sapper camp and every gnoll on the floor turns on the hero. Returns true when it took
	 * the bump. Not ported: the pickaxe's augment factor (no augment on the quest pickaxe here).
	 */
	tryPickaxeGeomancer(this: DungeonScene, geomancer: Creature): boolean {
		if (geomancer.kind !== 'gnollGeomancer' || (geomancer.rockArmor ?? 0) <= 0) return false;
		const pickaxe = this.bag.find('pickaxe');
		//`interact()` returns true with no pickaxe after `actInteract` has already called `ready()`:
		//no time passes, so the bump is marked handled without spending the turn.
		if (!pickaxe) { this.actionSpentTurn = true; return true; }
		const level = (pickaxe as { level?: number }).level ?? 0;
		const wasSleeping = geomancer.sleeping === true;
		let dmg = Random.normalRange(2 + level, 15 + 3 * level);
		if (wasSleeping) dmg = Math.min(dmg, 15);
		dmg = Math.min(dmg, geomancer.rockArmor ?? 0);
		geomancer.rockArmor = (geomancer.rockArmor ?? 0) - dmg;
		//`damage(dmg, p)`: the shield takes it all, but the override's cooldown cut still runs.
		this.gnollLowerCooldown(geomancer, dmg);
		this.showDamage(geomancer, dmg);
		geomancer.geomancerHits = (geomancer.geomancerHits ?? 0) + 1;
		if (geomancer.geomancerHits === 1) this.say(t('port.mob.gnollgeomancer.warning'), 'warning');
		if (geomancer.geomancerHits === 3) {
			this.say(t('port.mob.gnollgeomancer.alert'), 'negative');
			geomancer.sleeping = false;
			this.carveRockAndDash(geomancer);
			geomancer.seesHero = true;
			geomancer.lastSeen = { x: this.hero.x, y: this.hero.y };
			for (const mob of this.creatures) {
				if (mob.kind !== 'gnollGuard' && mob.kind !== 'gnollSapper') continue;
				mob.sleeping = false;
				mob.seesHero = true;
				//`beckon(pos)` for a guard with no sapper: it heads for the geomancer instead.
				mob.lastSeen = mob.kind === 'gnollGuard' && !this.gnollHasSapper(mob) ? { x: geomancer.x, y: geomancer.y } : { x: this.hero.x, y: this.hero.y };
			}
		}
		if ((geomancer.rockArmor ?? 0) <= 0) delete geomancer.rockArmor;
		this.syncGnollMineVisual(geomancer);
		runState.audio.cue('mine', 0.7);
		delete this.hero.buffs['invisibility'];
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
		return true;
	},

	/**
	 * `GnollGeomancer.carveRockAndDash()`: it leaps (at most 12 cells) toward the nearest unused
	 * sapper spawn - a living sapper's within 16 preferred - carving a radius-3 diamond (three `NEIGHBOURS4` spreads, ~7 cells wide)
	 * along the way (veins drop their dark gold, other rock becomes floor or, 1 in 3, a boulder,
	 * high grass is flattened) and ringing it with boulders. A living sapper there re-links to it,
	 * and is pulled (with its guard) beside it when more than 3 cells away. Three dashes at most:
	 * each spawn is used once.
	 */
	carveRockAndDash(this: DungeonScene, geomancer: Creature): void {
		const paint = this.portedPaint;
		if (!paint) return;
		const w = this.level.width;
		const spawns = geomancer.geomancerSapperSpawns ?? [];
		const pos = this.level.index(geomancer.x, geomancer.y);
		const sapperAt = (spawn: number): Creature | undefined => this.creatures.find((c) => c.kind === 'gnollSapper' && c.hp > 0 && c.gnollSpawnCell === spawn);
		const choice = chooseDashSpawn(w, pos, spawns, (spawn) => sapperAt(spawn) !== undefined);
		if (!choice) return;
		const xy = (cell: number): Step => ({ x: cell % w, y: Math.floor(cell / w) });
		const line = (to: number): number[] => Roguelike.ballistica(this.level, geomancer, xy(to), { stop: 'none' }).cells.map((c) => this.level.index(c.x, c.y));
		let dashPos = choice.spawn;
		const firstPath = line(dashPos);
		if (firstPath.length - 1 > 12) dashPos = firstPath[12]!;
		const blocked = (cell: number): boolean => this.creatureAt(cell % w, Math.floor(cell / w)) !== null || this.trapKinds.has(cell);
		if (blocked(dashPos)) {
			const free = neighbours8(w).map((i) => dashPos + i).filter((cell) => !blocked(cell));
			if (free.length > 0) dashPos = free[Random.int(0, free.length)]!;
		}
		for (let i = 0; i < spawns.length; i++) if (spawns[i] === choice.spawn) spawns[i] = -1;
		const insideMap = (cell: number): boolean => cell % w > 0 && cell % w < w - 1 && cell >= w && cell < paint.map.length - w;
		//`path.subPath(0, path.dist)`: its own cell through the landing cell.
		const cells = line(dashPos);
		for (let spread = 0; spread < 3; spread++) cells.push(...spreadDiamond(cells, w, insideMap));
		const exterior = spreadDiamond(cells, w, insideMap);
		const solid = (cell: number): boolean => SPD_TERRAIN_TO_GAME_KIND[paint.map[cell]!] === 'wall';
		for (const cell of cells) {
			const raw = paint.map[cell];
			if (raw === Terrain.WALL_DECO) {
				this.setMineCell(cell, Terrain.EMPTY_DECO);
				this.spawnGroundItem('darkGold', cell % w, Math.floor(cell / w));
			} else if (solid(cell)) {
				this.setMineCell(cell, Random.int(0, 3) === 0 ? Terrain.MINE_BOULDER : Terrain.EMPTY_DECO);
			} else if (raw === Terrain.HIGH_GRASS || raw === Terrain.FURROWED_GRASS) {
				this.setMineCell(cell, Terrain.GRASS);
			}
		}
		const entrance = this.entranceCell;
		for (const cell of exterior) {
			const at = xy(cell);
			if (solid(cell) || paint.map[cell] === Terrain.EMPTY_SP) continue;
			if (entrance && Roguelike.chebyshevDistance(at, entrance) === 1) continue;
			if (this.trapKinds.has(cell) || this.portedFeatures.kindAt(cell)?.startsWith('plant:') || this.creatureAt(at.x, at.y)) continue;
			this.setMineCell(cell, Terrain.MINE_BOULDER);
		}
		if (solid(dashPos)) this.setMineCell(dashPos, Terrain.EMPTY_DECO);
		this.restitchAllTiles();
		this.refreshMineTiles();
		this.shakeScreen(3, 0.7);
		runState.audio.cue('rocks', 0.7);
		//Java assigns `pos = dashPos` outright (roots cannot hold it); `moveTo` refuses a rooted mover.
		const roots = geomancer.buffs['roots'];
		delete geomancer.buffs['roots'];
		this.moveTo(geomancer, xy(dashPos));
		if (roots !== undefined) geomancer.buffs['roots'] = roots;
		geomancer.gnollAbilityCd = 1;
		if (!choice.alive) return;
		const sapper = sapperAt(choice.spawn);
		if (!sapper) return;
		const guard = this.gnollPartner(sapper);
		this.gnollLinkPartner(sapper, geomancer);
		if (cellDistance(w, this.level.index(sapper.x, sapper.y), dashPos) <= 3) return;
		const candidates = neighbours8(w).map((i) => dashPos + i).filter((cell) => {
			const at = xy(cell);
			return !solid(cell) && !this.trapKinds.has(cell) && !this.portedFeatures.kindAt(cell)?.startsWith('plant:') && !this.creatureAt(at.x, at.y);
		});
		if (candidates.length === 0) return;
		const sapperCell = candidates.splice(Random.int(0, candidates.length), 1)[0]!;
		this.gnollAppear(sapper, xy(sapperCell));
		sapper.gnollSpawnCell = sapperCell;
		if (guard?.kind === 'gnollGuard' && candidates.length > 0) this.gnollAppear(guard, xy(candidates[Random.int(0, candidates.length)]!));
	},

	/** `ScrollOfTeleportation.appear()`: an instant relocation with its teleport presentation. */
	gnollAppear(this: DungeonScene, creature: Creature, to: Step): void {
		const from = { x: creature.x, y: creature.y };
		this.moveTo(creature, to);
		this.playTeleportAppear(from, to, creature);
	},

	/**
	 * Gnoll deaths: a sapper drops its link (`GnollSapper.die()`'s `losePartner()`); the
	 * geomancer marks the quest boss beaten (`Blacksmith.Quest.beatBoss()`) and crumbles every
	 * boulder within 6 cells back to floor (`GnollGeomancer.die()`).
	 */
	gnollMineDied(this: DungeonScene, creature: Creature): void {
		//Its queued throws die with it: drop their `TargetedCell` trails from the overlay.
		this.refreshTargetedCellsOverlay();
		if (creature.kind === 'gnollSapper') this.gnollLosePartner(creature);
		if (creature.kind !== 'gnollGeomancer') return;
		this.blacksmithBossBeaten = true;
		this.shakeScreen(3, 0.7);
		runState.audio.cue('rocks', 0.7);
		const paint = this.portedPaint;
		if (!paint) return;
		const w = this.level.width;
		const pos = this.level.index(creature.x, creature.y);
		for (let cell = 0; cell < paint.map.length; cell++) {
			if (paint.map[cell] === Terrain.MINE_BOULDER && cellTrueDistance(w, cell, pos) <= 6) this.setMineCell(cell, Terrain.EMPTY_DECO);
		}
		this.restitchAllTiles();
		this.refreshMineTiles();
	},
};
