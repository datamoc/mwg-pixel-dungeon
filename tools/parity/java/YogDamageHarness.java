package com.shatteredpixel.shatteredpixeldungeon.actors.mobs;

import com.shatteredpixel.shatteredpixeldungeon.Dungeon;
import com.shatteredpixel.shatteredpixeldungeon.actors.Actor;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.Hero;
import com.shatteredpixel.shatteredpixeldungeon.levels.RegularLevel;
import com.shatteredpixel.shatteredpixeldungeon.levels.painters.Painter;
import com.shatteredpixel.shatteredpixeldungeon.sprites.YogSprite;
import com.shatteredpixel.shatteredpixeldungeon.ui.BossHealthBar;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.HashSet;

/** Project-authored trace of the actual YogDzewa.damage() post-clamp HP delta, tag v3.3.8. */
public final class YogDamageHarness {
	public static String captureOutput() throws ReflectiveOperationException {
		StringBuilder out = new StringBuilder("{\"tool\":\"parityYogDamage-java\"}\n");
		out.append(runCase(4, 150, 100, 10f, 10f)).append('\n');
		out.append(runCase(4, 120, 40, 10f, 10f)).append('\n');
		out.append(runCase(0, 150, 40, 10f, 10f)).append('\n');
		out.append(phaseEdgeCase(1, 750, 50, false)).append('\n');
		out.append(phaseEdgeCase(1, 750, 50, true)).append('\n');
		out.append(phaseEdgeCase(2, 450, 50, false)).append('\n');
		out.append(phaseEdgeCase(3, 150, 50, false)).append('\n');
		out.append(finalPhaseCase()).append('\n');
		Actor.clear();
		out.append("{\"cases\":3,\"phaseCases\":4,\"finalCases\":1}\n");
		return out.toString();
	}

	private static String runCase(int phase, int hp, int damage, float abilityCd, float summonCd)
			throws ReflectiveOperationException {
		Actor.clear();
		Dungeon.challenges = 0;
		Dungeon.depth = 25;
		Hero hero = new Hero();
		Dungeon.hero = hero;
		RegularLevel level = new HarnessLevel();
		level.setSize(10, 10);
		level.mobs = new HashSet<>();
		Dungeon.level = level;
		YogDzewa yog = new YogDzewa();
		yog.sprite = quietSprite();
		yog.HT = 1000;
		yog.HP = hp;
		level.mobs.add(yog);
		setInt(yog, "phase", phase);
		setFloat(yog, "abilityCooldown", abilityCd);
		setFloat(yog, "summonCooldown", summonCd);
		yog.damage(damage, new Object());
		return "{\"kind\":\"damage\",\"phase\":" + phase + ",\"preHp\":" + hp
			+ ",\"damage\":" + damage + ",\"hp\":" + yog.HP
			+ ",\"abilityCd\":" + getFloat(yog, "abilityCooldown")
			+ ",\"summonCd\":" + getFloat(yog, "summonCooldown") + "}";
	}

	/** Enter the real phase threshold branch; the harness fist adapter stops before visual cell emitters. */
	private static String phaseEdgeCase(int phase, int hp, int damage, boolean stronger) throws ReflectiveOperationException {
		Actor.clear();
		Dungeon.challenges = stronger ? com.shatteredpixel.shatteredpixeldungeon.Challenges.STRONGER_BOSSES : 0;
		Dungeon.depth = 25;
		Dungeon.hero = new Hero();
		HarnessLevel level = new HarnessLevel();
		level.setSize(10, 10);
		level.mobs = new HashSet<>();
		Dungeon.level = level;
		HarnessYog yog = new HarnessYog();
		yog.sprite = quietSprite();
		yog.HT = 1000;
		yog.HP = hp;
		level.mobs.add(yog);
		setInt(yog, "phase", phase);
		setFloat(yog, "abilityCooldown", 12f);
		setFloat(yog, "summonCooldown", 12f);
		boolean stoppedAtVisualBoundary = false;
		try { yog.damage(damage, new Object()); }
		catch (NullPointerException expectedNoSceneEmitter) {
			stoppedAtVisualBoundary = Arrays.stream(expectedNoSceneEmitter.getStackTrace())
				.anyMatch(frame -> frame.getClassName().endsWith("CellEmitter") && frame.getMethodName().equals("get"));
			if (!stoppedAtVisualBoundary) throw expectedNoSceneEmitter;
		}
		return "{\"kind\":\"phase-edge\",\"phaseBefore\":" + phase + ",\"stronger\":" + stronger
			+ ",\"preHp\":" + hp + ",\"damage\":" + damage + ",\"hp\":" + yog.HP
			+ ",\"phase\":" + getInt(yog, "phase")
			+ ",\"addFistCalls\":" + yog.addFistCalls
			+ ",\"abilityCd\":" + getFloat(yog, "abilityCooldown")
			+ ",\"summonCd\":" + getFloat(yog, "summonCooldown")
			+ ",\"stoppedAtVisualBoundary\":" + stoppedAtVisualBoundary + "}";
	}

	/** Calls the real last-fist death transition with no surviving YogFist actors. */
	private static String finalPhaseCase() throws ReflectiveOperationException {
		Actor.clear();
		Dungeon.challenges = 0;
		Dungeon.depth = 25;
		Dungeon.hero = new Hero();
		HarnessLevel level = new HarnessLevel();
		level.setSize(10, 10);
		level.mobs = new HashSet<>();
		Dungeon.level = level;
		HarnessYog yog = new HarnessYog();
		yog.sprite = quietSprite();
		level.mobs.add(yog);
		setInt(yog, "phase", 4);
		setFloat(yog, "summonCooldown", 10f);
		yog.processFistDeath();
		Field bleeding = BossHealthBar.class.getDeclaredField("bleeding");
		bleeding.setAccessible(true);
		return "{\"kind\":\"final-phase\",\"phase\":" + getInt(yog, "phase")
			+ ",\"summonCd\":" + getFloat(yog, "summonCooldown")
			+ ",\"bleeding\":" + bleeding.getBoolean(null) + "}";
	}

	private static Field field(String name) throws ReflectiveOperationException {
		Field f = YogDzewa.class.getDeclaredField(name);
		f.setAccessible(true);
		return f;
	}
	private static void setInt(YogDzewa yog, String name, int value) throws ReflectiveOperationException { field(name).setInt(yog, value); }
	private static int getInt(YogDzewa yog, String name) throws ReflectiveOperationException { return field(name).getInt(yog); }
	private static void setFloat(YogDzewa yog, String name, float value) throws ReflectiveOperationException { field(name).setFloat(yog, value); }
	private static float getFloat(YogDzewa yog, String name) throws ReflectiveOperationException { return field(name).getFloat(yog); }

	private static YogSprite quietSprite() throws ReflectiveOperationException {
		Class<?> unsafeClass = Class.forName("sun.misc.Unsafe");
		Field singleton = unsafeClass.getDeclaredField("theUnsafe");
		singleton.setAccessible(true);
		Object unsafe = singleton.get(null);
		return (YogSprite) unsafeClass.getMethod("allocateInstance", Class.class).invoke(unsafe, QuietYogSprite.class);
	}
	private static final class HarnessLevel extends RegularLevel {
		@Override protected Painter painter() { return null; }
		/** The fixture has no transition registry; supply the floor's exit cell for the visual path. */
		@Override public int exit() { return 50; }
	}
	private static final class HarnessYog extends YogDzewa {
		int addFistCalls;
		/** Suppress Dungeon.observe's FOV recomputation; the fixture has no painted map. */
		@Override public void updateVisibility(com.shatteredpixel.shatteredpixeldungeon.levels.Level level) { }
		@Override public void addFist(YogFist fist) { addFistCalls++; }
	}
	private static final class QuietYogSprite extends YogSprite {
		@Override public void showStatus(int color, String text, Object... args) { }
	}
}
