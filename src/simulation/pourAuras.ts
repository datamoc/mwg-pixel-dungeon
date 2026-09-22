/**
 * Continuous `pour` aura specs, ported monster-by-monster from the real Java
 * sprite classes (tag `v3.3.8`) - the companion to `deathBursts.ts`'s one-shot
 * table. Pure data behind one selector; the scene binds emitters, positions,
 * FOV gating and teardown, the way every other `simulation/*` extraction works.
 *
 * Java's `Emitter.pour(factory, interval)` emits 1/`interval` particles per
 * second for as long as the emitter is on, so `rate` below is exactly that
 * quotient. The twelve sites from the 2026-09-20 emitter audit:
 */
export interface PourAuraSpec {
	/** Particles per second (1 / Java's pour interval). */
	rate: number;
	/** Java's own particle tint (a `[from, to]` pair draws per-particle from the range). */
	tint: number | readonly [number, number];
	/** Lifespan in seconds (a pair is Java's `Random.Float` range). */
	life: number | readonly [number, number];
	/** Initial speed range in px/s. */
	speedMin: number;
	speedMax: number;
	/** Start size in px (a pair is Java's `Random.Float` range). */
	size: number | readonly [number, number];
	/** Shrink to zero over life (`PixelParticle.Shrinking`). */
	shrink: boolean;
	/** Downward gravity in px/s^2 (negative rises, like flame/elmo's -80). */
	gravity: number;
	/** Half-angle of the upward cone in radians (PI covers every direction). */
	spread: number;
	/** Alpha curve: plain linear fade, or `ShadowParticle`'s own ramp. */
	fade: 'linear' | 'shadow';
	/** Grow from birth size to death size (`MagicParticle`'s 1 -> 4). */
	grow?: readonly [number, number];
}

/** The creature state an aura gate reads - a structural slice, not `Creature`. */
export interface PourAuraCreature {
	kind?: string;
	allyKind?: string;
	elementalType?: 'fire' | 'frost' | 'shock' | 'chaos';
	yogFistType?: 'burning' | 'soiled' | 'rotting' | 'rusted' | 'bright' | 'dark';
	dmSupercharged?: boolean;
	beamCharged?: boolean;
	hp?: number;
	maxHp?: number;
}

/** `SparkParticle.STATIC`: white, static, life 0.25-0.5, size 5. */
function sparkStatic(rate: number): PourAuraSpec {
	return { rate, tint: 0xffffff, life: [0.25, 0.5], speedMin: 0, speedMax: 0, size: 5, shrink: false, gravity: 0, spread: 0, fade: 'linear' };
}

/** `FlameParticle`: 0xEE7722, life 0.6, size 4, static start, rises at -80, shrinks. */
function flame(rate: number): PourAuraSpec {
	return { rate, tint: 0xee7722, life: 0.6, speedMin: 0, speedMax: 0, size: 4, shrink: true, gravity: -80, spread: 0, fade: 'linear' };
}

/** `ElmoParticle`: 0x22EE66, otherwise flame-identical. */
function elmo(rate: number): PourAuraSpec {
	return { rate, tint: 0x22ee66, life: 0.6, speedMin: 0, speedMax: 0, size: 4, shrink: true, gravity: -80, spread: 0, fade: 'linear' };
}

/** `MagicParticle`: 0x88CCFF, life 0.5, slow drift, grows 1 -> 4 while fading. */
function magic(rate: number, attract: boolean): PourAuraSpec {
	//`resetAttract` fires outward at 16-32 px/s and homes onto the victim, which
	//no emitter option expresses: the aura keeps the outward speeds without the
	//homing, stated not silent.
	return attract
		? { rate, tint: 0x88ccff, life: 0.5, speedMin: 16, speedMax: 32, size: 4, shrink: false, gravity: 0, spread: Math.PI, fade: 'linear', grow: [1, 4] }
		: { rate, tint: 0x88ccff, life: 0.5, speedMin: 0, speedMax: 10, size: 4, shrink: false, gravity: 0, spread: Math.PI, fade: 'linear', grow: [1, 4] };
}

/** `RainbowParticle.BURST`: a random tint per particle, life 0.5, slow drift. */
function rainbow(rate: number): PourAuraSpec {
	//`color(Random.Int(0x1000000))` has no emitter equivalent; the `[black,
	//white]` pair draws per-particle channel mixes - varied, never pure hues.
	return { rate, tint: [0x000000, 0xffffff] as const, life: 0.5, speedMin: 0, speedMax: 5, size: 4, shrink: false, gravity: 0, spread: Math.PI, fade: 'linear' };
}

/** `LeafParticle.GENERAL`: greens 0x004400-0x88CC44, life 1.2, rises, size 2-3, shrinks. */
function leaf(rate: number): PourAuraSpec {
	//`speed.set(±8, -20)` with `acc +25` reads as a slow upward drift that
	//settles; the size pair is Java's own `Random.Float(2, 3)`.
	return { rate, tint: [0x004400, 0x88cc44] as const, life: 1.2, speedMin: 12, speedMax: 28, size: [2, 3] as const, shrink: true, gravity: 25, spread: 0.4, fade: 'linear' };
}

/** `Speck` steam-frame auras: static, life `Random.Float(1, 3)`, slow spin. */
function speck(tint: number, rate: number): PourAuraSpec {
	return { rate, tint, life: [1, 3] as const, speedMin: 0, speedMax: 0, size: 4, shrink: false, gravity: 0, spread: 0, fade: 'linear' };
}

/** `ShadowParticle.MISSILE`: plain `reset` - 0.5s, size 6, slow omni drift. */
function shadowMissile(rate: number): PourAuraSpec {
	return { rate, tint: 0x440044, life: 0.5, speedMin: 0, speedMax: 7, size: 6, shrink: false, gravity: 0, spread: Math.PI, fade: 'linear' };
}

/** `CorrosionParticle.MISSILE`: life 0.6, slow drift, settles at +30. */
function corrosion(rate: number): PourAuraSpec {
	//The tint animates `0xFF8800 -> 0xAAAAAA` across the flight; a static
	//square keeps the hot start.
	return { rate, tint: 0xff8800, life: 0.6, speedMin: 0, speedMax: 6, size: 4, shrink: false, gravity: 30, spread: Math.PI, fade: 'linear' };
}

/** `GooParticle`: black, life 0.3, size 4, upward 32-48 burst settling at +50, shrinks. */
function goo(rate: number): PourAuraSpec {
	//`update()` ramps alpha in over the first half; the linear fade stands in.
	return { rate, tint: 0x000000, life: 0.3, speedMin: 32, speedMax: 48, size: 4, shrink: true, gravity: 50, spread: 0.5, fade: 'linear' };
}

/** Continuous pour auras following `creature`, empty when Java shows none. */
export function pourAurasFor(creature: PourAuraCreature): PourAuraSpec[] {
	if (creature.kind === 'fetidRat') return [speck(0x003300, 1 / 0.7)];
	// `PhantomPiranhaSprite.link()` pours `Speck.LIGHT` every 0.5 seconds.
	if (creature.kind === 'phantomPiranha') return [sparkStatic(1 / 0.5)];
	if (creature.kind === 'rotHeart') return [speck(0x50ff60, 1 / 0.7)];
	if (creature.kind === 'elemental') {
		if (creature.elementalType === 'fire') return [flame(1 / 0.06)];
		if (creature.elementalType === 'frost') return [magic(1 / 0.06, false)];
		if (creature.elementalType === 'shock') return [sparkStatic(1 / 0.06)];
		if (creature.elementalType === 'chaos') return [rainbow(1 / 0.025)];
		return [];
	}
	if (creature.kind === 'newbornElemental') return [elmo(1 / 0.06)];
	if (creature.kind === 'yogFist') {
		if (creature.yogFistType === 'burning') return [flame(1 / 0.06)];
		if (creature.yogFistType === 'soiled') return [leaf(1 / 0.06)];
		if (creature.yogFistType === 'rotting') return [speck(0x50ff60, 1 / 0.25)];
		if (creature.yogFistType === 'rusted') return [corrosion(1 / 0.06)];
		if (creature.yogFistType === 'bright') return [sparkStatic(1 / 0.06)];
		if (creature.yogFistType === 'dark') return [shadowMissile(1 / 0.06)];
		return [];
	}
	//`DM300Sprite` lights `superchargeSparks` only while supercharged.
	if (creature.kind === 'dm300') return creature.dmSupercharged === true ? [sparkStatic(1 / 0.05)] : [];
	//`EyeSprite` pours the attracting charge only while the beam is charged.
	if (creature.kind === 'eye') return creature.beamCharged === true ? [magic(1 / 0.05, true)] : [];
	//`GooSprite.link` sprays once bloodied (`HP*2 <= HT`).
	if (creature.kind === 'goo') {
		return creature.hp !== undefined && creature.maxHp !== undefined && creature.hp * 2 <= creature.maxHp ? [goo(1 / 0.04)] : [];
	}
	//No representable trigger, so silence rather than a wrong aura: the lotus
	//and the necromancer/spectral summonings pour at remote cells off the
	//unported `summoningPos` state, the golem pours mid-teleport with no such
	//state here; PhantomPiranha's own light sparkle is handled above.
	return [];
}
