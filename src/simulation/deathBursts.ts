/**
 * One-shot death/zap particle bursts, ported monster-by-monster from the real
 * Java sprite classes (tag `v3.3.8`). This is a pure-data table behind two
 * selectors - the scene only binds its emitter layer and FOV gate, the way
 * every other `simulation/*` extraction works.
 *
 * What Java does per monster sprite (audited 2026-09-20, the full emitter
 * inventory behind ROADMAP's sprite/effect-animations remainder):
 * - `DM300Sprite.onComplete(die)`: `BlastParticle` x100 + BLAST sample.
 * - `PylonSprite.play(die)`: `BlastParticle` x20 + BLAST sample.
 * - `GuardSprite.play(die)`: `ShadowParticle.UP` x4.
 * - `SuccubusSprite.die()`: `Speck.HEART` x6 + `ShadowParticle.UP` x8.
 * - `GhostSprite.die()`: `ShaftParticle` x4 (1.2s) + `Speck.LIGHT` x3. Both
 *   the quest NPC (`actors/mobs/npcs/Ghost.java`) and the Dried Rose summon
 *   (`DriedRose.GhostHero`) use `GhostSprite`, so both burst here.
 * - `WardSprite.zap()`: attacker `flash()` + `WardParticle.UP` x2 + RAY sample
 *   + a `Beam.DeathRay` (always drawn, even with no target). This port
 *   reproduces the burst, the RAY cue, and the attacker flash (2026-09-21,
 *   the same `colorAdd` pulse `showDamage` fires). The beam is now live too
 *   (2026-09-22, `dungeonScene.ts`'s `zapBeamOverlay`/`zapBeams` - shared
 *   the same day with every hero wand's own zap trail, see `fireWandShot`)
 *   - a plain fading/thinning line, since Java's textured asset has no
 *   equivalent here; pushed from `takeWardTurn` alongside this burst.
 *   `WardSprite.die()`: `WardParticle.UP` x10 (+ a 2s alpha fade, live since
 *   2026-09-22 via `dyingMonsters`' per-corpse `duration`/`playDieClip`).
 *
 * Deliberate reductions, stated not silent: the port's particles are plain
 * squares (`Texture.WHITE`), so textured shapes do not transfer - HEART's
 * pink heart frame becomes a pink square, ShaftParticle's vertical streak a
 * slow white square. Counts, colors, lifespans and upward motion are Java's
 * own (`BlastParticle` 0xEE7722 size 8 speed 32-64 upward hemisphere;
 * `ShadowParticle` 0x440044 size 6->0; `Speck.LIGHT` tint 0xFFDDDD00;
 * `WardParticle` 0x88CCFF; `ShaftParticle` 1.2s at -6px/s).
 *
 * The continuous `pour` half lives in `simulation/pourAuras.ts` (2026-09-21):
 * the seven creature-following families are live with Java's own intervals -
 * FetidRat stench, RotHeart cloud, the four elemental auras (+ NewbornFire),
 * all six fist auras, DM300 supercharge sparks (gated on `dmSupercharged`),
 * Eye charge (gated on `beamCharged`), Goo spray (gated on `HP*2 <= HT`) -
 * synced per-frame by `ui/effectBursts.ts`'s `syncPourAuras`. Still open: the
 * four cell-placed or state-gated sites (Golem teleport pour with no teleport
 * state here, Goo pump-up cells + Elmo trigger burst, Lotus range leaves, the
 * Necromancer/Spectral summonings at `summoningPos` with no summoning state)
 * and PhantomPiranha sparkles (no such kind spawns - the pool-room draw is
 * consumed but always yields plain piranha).
 */
export interface DeathBurstSpec {
	/** Java's own burst count for this particle. */
	count: number;
	/** Java's own particle color. */
	tint: number;
	/** Lifespan in seconds (`BlastParticle` ~1, `ShaftParticle` 1.2). */
	life: number;
	/** Speed range in px/s, straight from the Java particle (`BlastParticle`
	 * 32-64, `ShadowParticle` 32-48.7, `Speck.HEART` -40 rise, `ShaftParticle`
	 * -6 rise). */
	speedMin: number;
	speedMax: number;
	/** Start size in px (`BlastParticle` 8, `ShadowParticle` 6->0). */
	size: number;
	/** Shrink to zero over life (`ShadowParticle`'s 6->0). */
	shrink: boolean;
	/** Half-angle of the upward cone in radians (`ShadowParticle`'s own
	 * 0.245; `BlastParticle`'s full upward hemisphere is PI/2). */
	spread: number;
	/** Alpha curve: `ShadowParticle`'s own `p*p*4`/`(1-p)*2` ramp, or a plain
	 * linear fade for every other particle class. */
	fade: 'linear' | 'shadow';
	/** Downward gravity in px/s^2 (`BlastParticle`'s +50 settle). */
	gravity: number;
	/** Play Java's own sample with the burst (BLAST for DM300/Pylon deaths,
	 * RAY for ward zaps). */
	sound?: 'blast' | 'ray';
}

const BLAST_ORANGE = 0xee7722;
const SHADOW_PURPLE = 0x440044;
const HEART_PINK = 0xff77aa;
const LIGHT_YELLOW = 0xdddd00;
const WARD_BLUE = 0x88ccff;

function blast(count: number): DeathBurstSpec {
	return { count, tint: BLAST_ORANGE, life: 1, speedMin: 32, speedMax: 64, size: 8, shrink: false, gravity: 50, spread: Math.PI / 2, fade: 'linear', sound: 'blast' };
}

function shadow(count: number): DeathBurstSpec {
	return { count, tint: SHADOW_PURPLE, life: 1, speedMin: 32, speedMax: 48.7, size: 6, shrink: true, gravity: 0, spread: 0.245, fade: 'shadow' };
}

/** Bursts fired when `kind`/`allyKind` dies through the shared kill path. */
export function deathBurstsFor(kind: string | undefined, allyKind: string | undefined): DeathBurstSpec[] {
	if (kind === 'dm300') return [blast(100)];
	if (kind === 'pylon') return [blast(20)];
	if (kind === 'guard') return [shadow(4)];
	if (kind === 'succubus') {
		return [
			{ count: 6, tint: HEART_PINK, life: 1, speedMin: 30, speedMax: 50, size: 5, shrink: false, gravity: 0, spread: 0.3, fade: 'linear' },
			shadow(8),
		];
	}
	if (kind === 'ghost' || allyKind === 'ghost') {
		return [
			{ count: 4, tint: 0xffffff, life: 1.2, speedMin: 4, speedMax: 8, size: 4, shrink: false, gravity: 0, spread: 0.1, fade: 'linear' },
			{ count: 3, tint: LIGHT_YELLOW, life: 1, speedMin: 20, speedMax: 40, size: 3, shrink: false, gravity: 0, spread: 0.5, fade: 'linear' },
		];
	}
	if (allyKind === 'ward') {
		return [{ count: 10, tint: WARD_BLUE, life: 1, speedMin: 32, speedMax: 48.7, size: 5, shrink: true, gravity: 0, spread: 0.245, fade: 'linear' }];
	}
	return [];
}

/** `WardSprite.zap()`'s own-sprite burst + RAY sample, fired per ward zap. */
export function wardZapBursts(): DeathBurstSpec[] {
	return [{ count: 2, tint: WARD_BLUE, life: 1, speedMin: 32, speedMax: 48.7, size: 5, shrink: true, gravity: 0, spread: 0.245, fade: 'linear', sound: 'ray' }];
}
