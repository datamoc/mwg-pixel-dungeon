package com.shatteredpixel.shatteredpixeldungeon.actors.mobs;

import com.shatteredpixel.shatteredpixeldungeon.Challenges;
import com.shatteredpixel.shatteredpixeldungeon.Dungeon;
import com.shatteredpixel.shatteredpixeldungeon.Statistics;
import com.shatteredpixel.shatteredpixeldungeon.actors.Actor;
import com.shatteredpixel.shatteredpixeldungeon.actors.buffs.Buff;
import com.shatteredpixel.shatteredpixeldungeon.actors.blobs.Blob;
import com.shatteredpixel.shatteredpixeldungeon.actors.buffs.LockedFloor;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.Hero;
import com.shatteredpixel.shatteredpixeldungeon.levels.CavesBossLevel;
import com.shatteredpixel.shatteredpixeldungeon.levels.Terrain;
import com.shatteredpixel.shatteredpixeldungeon.actors.mobs.Pylon;
import com.shatteredpixel.shatteredpixeldungeon.ui.BossHealthBar;
import com.watabou.utils.Bundle;
import com.watabou.utils.SparseArray;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.HashSet;

/** Project-authored traces of real v3.3.8 DM300.damage() thresholds and CavesBossLevel.activatePylon() seeds. */
public final class DM300DamageHarness {
	private static final int[][] CASES = {
		{300, 0, 201, 1, 0}, {300, 0, 202, 1, 0}, {300, 0, 210, 20, 0},
		{300, 1, 101, 1, 0}, {300, 2, 10, 5, 0},
		{400, 0, 301, 1, 1}, {400, 1, 201, 1, 1}, {400, 2, 101, 1, 1}, {400, 3, 10, 5, 1},
		{400, 1, 220, 40, 1},
	};

	public static String captureOutput() throws ReflectiveOperationException {
		StringBuilder out = new StringBuilder("{\"tool\":\"parityDM300Damage-java\"}\n");
		for (int[] c : CASES) out.append(startCase(c)).append('\n');
		for (boolean stronger : new boolean[]{false, true}) out.append(pylonEnergyCase(stronger)).append('\n');
		Actor.clear();
		out.append("{\"cases\":").append(CASES.length).append("}\n");
		return out.toString();
	}

	/** Runs the real `CavesBossLevel.activatePylon()` scan and target selection on a fixture map. */
	private static String pylonEnergyCase(boolean stronger) throws ReflectiveOperationException {
		Actor.clear();
		Dungeon.challenges = stronger ? Challenges.STRONGER_BOSSES : 0;
		Dungeon.depth = 15;
		HarnessHero hero = new HarnessHero();
		hero.pos = cell(12, 25);
		Dungeon.hero = hero;
		HarnessCavesBossLevel level = new HarnessCavesBossLevel();
		level.initializeHarnessMap();
		Dungeon.level = level;

		level.map[cell(2, 12)] = Terrain.WATER; // below the Java scan start: not seeded directly
		level.map[cell(2, 13)] = Terrain.INACTIVE_TRAP;
		level.map[cell(2, 14)] = Terrain.WATER;
		level.map[cell(2, 15)] = Terrain.CUSTOM_DECO;
		level.map[cell(2, 16)] = Terrain.INACTIVE_TRAP;

		HarnessPylon[] pylons = {
			new HarnessPylon(0, cell(13, 25)), // unique closest pylon is reserved
			new HarnessPylon(1, cell(3, 25)),
			new HarnessPylon(2, cell(25, 25)),
			new HarnessPylon(3, cell(12, 10)),
		};
		for (HarnessPylon pylon : pylons) level.mobs.add(pylon);
		RuntimeDM300 dm = new RuntimeDM300();
		dm.sprite = quietDM300Sprite();
		level.mobs.add(dm);
		dm.supercharge();
		boolean chargedBeforeLoss = dm.supercharged;
		int activatedCount = dm.pylonsActivated;
		float spent = dm.actorTime();
		setIntField(dm, "turnsSinceLastAbility", 8);
		dm.loseSupercharge();
		int turnsAfterLoss = intField(dm, "turnsSinceLastAbility");
		//Trace the real finale branch once the activation count reaches Java's total.
		dm.pylonsActivated = dm.totalPylonsToActivate();
		dm.supercharged = true;
		setIntField(dm, "turnsSinceLastAbility", 8);
		dm.loseSupercharge();
		boolean finalBleeding = staticBooleanField(BossHealthBar.class, "bleeding");
		Bundle savedDM = new Bundle();
		dm.storeInBundle(savedDM);
		BossHealthBar.bleed(false);
		RuntimeDM300 restoredDM = new RuntimeDM300();
		restoredDM.sprite = quietDM300Sprite();
		restoredDM.restoreFromBundle(savedDM);
		boolean restoredFinalBleeding = staticBooleanField(BossHealthBar.class, "bleeding");

		StringBuilder active = new StringBuilder("[");
		for (HarnessPylon pylon : pylons) {
			if (pylon.activationCount > 0) {
				if (active.length() > 1) active.append(',');
				active.append(pylon.label);
			}
		}
		active.append(']');
		int[] cells = {cell(2, 12), cell(2, 13), cell(2, 14), cell(2, 15), cell(2, 16)};
		StringBuilder seeds = new StringBuilder("[");
		boolean comma = false;
		for (int at : cells) {
			if (Blob.volumeAt(at, CavesBossLevel.PylonEnergy.class) > 0) {
				if (comma) seeds.append(',');
				seeds.append(at);
				comma = true;
			}
		}
		seeds.append(']');
		return "{\"kind\":\"pylon-energy\",\"width\":33,\"height\":42,\"stronger\":" + stronger
			+ ",\"terrain\":[[398,\"water\"],[431,\"inactiveTrap\"],[464,\"water\"],[497,\"sign\"],[530,\"inactiveTrap\"]],"
			+ "\"seedCells\":" + seeds + ",\"activatedPylons\":" + active
			+ ",\"superchargedBeforeLoss\":" + chargedBeforeLoss + ",\"superchargedAfterLoss\":" + dm.supercharged
			+ ",\"pylonsActivated\":" + activatedCount + ",\"actorSpend\":" + spent
			+ ",\"turnsAfterLoss\":" + turnsAfterLoss
			+ ",\"finalActivatedCount\":" + dm.pylonsActivated
			+ ",\"finalSupercharged\":" + dm.supercharged
			+ ",\"finalBleeding\":" + finalBleeding
			+ ",\"restoredFinalBleeding\":" + restoredFinalBleeding + "}";
	}

	private static int cell(int x, int y) { return x + y * 33; }

	private static String startCase(int[] c) throws ReflectiveOperationException {
		int ht = c[0], pylons = c[1], hp = c[2], damage = c[3];
		boolean stronger = c[4] != 0;
		Actor.clear();
		Dungeon.challenges = stronger ? Challenges.STRONGER_BOSSES : 0;
		Dungeon.depth = 15;
		HarnessHero hero = new HarnessHero();
		hero.pos = 32;
		Dungeon.hero = hero;
		CavesBossLevel level = new CavesBossLevel();
		level.mobs = new HashSet<>();
		level.heaps = new SparseArray<>();
		level.blobs = new HashMap<>();
		level.plants = new SparseArray<>();
		level.traps = new SparseArray<>();
		level.heroFOV = new boolean[15 * 48];
		Dungeon.level = level;
		LockedFloor lock = Buff.affect(hero, LockedFloor.class);
		setFloatField(lock, "left", 10f);
		HarnessDM300 dm = new HarnessDM300();
		dm.HT = ht;
		dm.HP = hp;
		dm.pylonsActivated = pylons;
		dm.pos = 31;
		level.mobs.add(dm);
		BossHealthBar.assignBoss(dm);
		int before = dm.HP;
		dm.damage(damage, hero);
		return "{\"kind\":\"threshold\",\"ht\":" + ht + ",\"pylonsBefore\":" + pylons
			+ ",\"hpBefore\":" + before + ",\"damage\":" + damage + ",\"stronger\":" + stronger
			+ ",\"hpAfter\":" + dm.HP + ",\"pylonsAfter\":" + dm.pylonsActivated
			+ ",\"supercharged\":" + dm.supercharged + ",\"chargeCalls\":" + dm.chargeCalls
			+ ",\"lockLeft\":" + floatField(lock, "left") + "}";
	}

	private static float floatField(Object target, String name) throws ReflectiveOperationException {
		Class<?> owner = target.getClass();
		while (owner != null && !hasField(owner, name)) owner = owner.getSuperclass();
		if (owner == null) throw new NoSuchFieldException(name);
		Field field = owner.getDeclaredField(name);
		field.setAccessible(true);
		return field.getFloat(target);
	}

	private static boolean hasField(Class<?> owner, String name) {
		try { owner.getDeclaredField(name); return true; }
		catch (NoSuchFieldException ignored) { return false; }
	}

	private static void setFloatField(Object target, String name, float value) throws ReflectiveOperationException {
		Field field = target.getClass().getDeclaredField(name);
		field.setAccessible(true);
		field.setFloat(target, value);
	}

	private static int intField(Object target, String name) throws ReflectiveOperationException {
		Field field = DM300.class.getDeclaredField(name);
		field.setAccessible(true);
		return field.getInt(target);
	}

	private static void setIntField(Object target, String name, int value) throws ReflectiveOperationException {
		Field field = DM300.class.getDeclaredField(name);
		field.setAccessible(true);
		field.setInt(target, value);
	}

	private static boolean staticBooleanField(Class<?> type, String name) throws ReflectiveOperationException {
		Field field = type.getDeclaredField(name);
		field.setAccessible(true);
		return field.getBoolean(null);
	}

	private static com.shatteredpixel.shatteredpixeldungeon.sprites.DM300Sprite quietDM300Sprite() throws ReflectiveOperationException {
		Class<?> unsafeClass = Class.forName("sun.misc.Unsafe");
		Field singleton = unsafeClass.getDeclaredField("theUnsafe");
		singleton.setAccessible(true);
		Object unsafe = singleton.get(null);
		return (com.shatteredpixel.shatteredpixeldungeon.sprites.DM300Sprite)
			unsafeClass.getMethod("allocateInstance", Class.class).invoke(unsafe, QuietDM300Sprite.class);
	}

	private static final class HarnessHero extends Hero { }
	private static final class HarnessCavesBossLevel extends CavesBossLevel {
		void initializeHarnessMap() {
			setSize(33, 42);
			mobs = new HashSet<>();
			heaps = new SparseArray<>();
			blobs = new HashMap<>();
			plants = new SparseArray<>();
			traps = new SparseArray<>();
		}
	}
	private static final class HarnessPylon extends Pylon {
		final int label;
		int activationCount;
		HarnessPylon(int label, int pos) { this.label = label; this.pos = pos; }
		/** Preserve Java's activation state writes; omit only the sprite animation call. */
		@Override public void activate() {
			alignment = Alignment.ENEMY;
			state = HUNTING;
			activationCount++;
		}
	}
	private static final class RuntimeDM300 extends DM300 {
		float actorTime() throws ReflectiveOperationException { return floatField(this, "time"); }
		@Override public void yell(String text) { }
	}
	private static final class QuietDM300Sprite extends com.shatteredpixel.shatteredpixeldungeon.sprites.DM300Sprite {
		@Override public void showStatus(int color, String text, Object... args) { }
		@Override public void updateChargeState(boolean enraged) { }
		@Override public void charge() { }
	}
	private static final class HarnessDM300 extends DM300 {
		int chargeCalls;
		/** Keep `damage()` real; omit only the pylon-level, cooldown, yell and sprite side effects. */
		@Override public void supercharge() {
			supercharged = true;
			pylonsActivated++;
			chargeCalls++;
		}
	}
}
