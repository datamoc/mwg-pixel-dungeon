package com.shatteredpixel.shatteredpixeldungeon.actors.mobs;

import com.shatteredpixel.shatteredpixeldungeon.Challenges;
import com.shatteredpixel.shatteredpixeldungeon.Dungeon;
import com.shatteredpixel.shatteredpixeldungeon.actors.Actor;
import com.shatteredpixel.shatteredpixeldungeon.actors.buffs.Buff;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.Hero;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.HeroClass;
import com.shatteredpixel.shatteredpixeldungeon.levels.CityBossLevel;
import com.shatteredpixel.shatteredpixeldungeon.items.armor.glyphs.Viscosity;
import com.shatteredpixel.shatteredpixeldungeon.sprites.MobSprite;
import com.watabou.noosa.Group;
import com.watabou.noosa.particles.Emitter;
import com.watabou.utils.SparseArray;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.HashSet;

/** Project-authored trace of the actual v3.3.8 DwarfKing.damage() P1 clamp and P3 low-HP edge. */
public final class DwarfKingPhaseHarness {

	private static final int[][] PHASE_TWO = {
		{51, 1, 0}, {52, 1, 0}, {80, 60, 0},
		{101, 1, 1}, {102, 1, 1}, {130, 60, 1}
	};

	public static String captureOutput() throws ReflectiveOperationException {
		StringBuilder out = new StringBuilder("{\"tool\":\"parityDwarfKingPhase-java\"}\n");
		for (int[] test : PHASE_TWO) out.append(phaseTwoCase(test[0], test[1], test[2] != 0)).append('\n');
		out.append(phaseThreeCase()).append('\n');
		Actor.clear();
		out.append("{\"phaseTwoCases\":").append(PHASE_TWO.length).append(",\"phaseThreeCases\":1}\n");
		return out.toString();
	}

	private static String phaseTwoCase(int preHp, int damage, boolean stronger) throws ReflectiveOperationException {
		Harness h = setup(preHp, 1, stronger);
		h.king.damage(damage, new Object());
		int phase = intField(h.king, "phase");
		int summonsMade = intField(h.king, "summonsMade");
		int shield = h.king.shielding();
		return "{\"kind\":\"phase2\",\"preHp\":" + preHp + ",\"damage\":" + damage
			+ ",\"stronger\":" + stronger + ",\"hp\":" + h.king.HP
			+ ",\"phase\":" + phase + ",\"summonsMade\":" + summonsMade + ",\"shield\":" + shield + "}";
	}

	private static String phaseThreeCase() throws ReflectiveOperationException {
		Harness h = setup(21, 3, false);
		setIntField(h.king, "phase", 3);
		Viscosity.DeferedDamage deferred = Buff.affect(h.king, Viscosity.DeferedDamage.class);
		h.king.damage(2, deferred);
		return "{\"kind\":\"phase3\",\"preHp\":21,\"damage\":2,\"hp\":" + h.king.HP
			+ ",\"phase\":" + intField(h.king, "phase") + ",\"losingYells\":" + h.king.losingYells + "}";
	}

	private static Harness setup(int hp, int phase, boolean stronger) throws ReflectiveOperationException {
		Actor.clear();
		Dungeon.challenges = stronger ? Challenges.STRONGER_BOSSES : 0;
		Dungeon.depth = 20;
		Hero hero = new Hero();
		hero.heroClass = HeroClass.WARRIOR;
		hero.damageInterrupt = false;
		CityBossLevel level = new CityBossLevel();
		level.setSize(15, 48);
		level.mobs = new HashSet<>();
		level.heaps = new SparseArray<>();
		level.blobs = new HashMap<>();
		level.plants = new SparseArray<>();
		level.traps = new SparseArray<>();
		level.heroFOV = new boolean[level.length()];
		// Keep appear() on its visible-cell path so it never reads the absent global Camera.main.
		level.heroFOV[CityBossLevel.throne] = true;
		Dungeon.level = level;
		Dungeon.hero = hero;
		HarnessKing king = new HarnessKing();
		king.HT = 400;
		king.HP = hp;
		king.pos = CityBossLevel.throne - 1;
		king.invisible = 1; // Avoid teleport fade VFX; the actual damage/phase code still runs.
		setIntField(king, "phase", phase);
		Group parent = new Group();
		MobSprite sprite = new HarnessMobSprite();
		parent.add(sprite);
		king.sprite = sprite;
		level.mobs.add(king);
		return new Harness(king, parent);
	}

	private static int intField(Object target, String name) throws ReflectiveOperationException {
		Field field = DwarfKing.class.getDeclaredField(name);
		field.setAccessible(true);
		return field.getInt(target);
	}

	private static void setIntField(Object target, String name, int value) throws ReflectiveOperationException {
		Field field = DwarfKing.class.getDeclaredField(name);
		field.setAccessible(true);
		field.setInt(target, value);
	}

	private static final class Harness {
		final HarnessKing king;
		@SuppressWarnings("unused") final Group spriteGroup;
		Harness(HarnessKing king, Group spriteGroup) {
			this.king = king;
			this.spriteGroup = spriteGroup;
		}
	}

	private static final class HarnessKing extends DwarfKing {
		int losingYells;
		@Override public int drRoll() { return 0; }
		@Override public void yell(String line) { losingYells++; }
	}

	/** Only the screen-space placement is presentation; the actor move and phase code remain real. */
	private static final class HarnessMobSprite extends MobSprite {
		private final Emitter emitter = new Emitter();
		@Override public void place(int cell) { }
		@Override public Emitter emitter() { return emitter; }
	}
}
