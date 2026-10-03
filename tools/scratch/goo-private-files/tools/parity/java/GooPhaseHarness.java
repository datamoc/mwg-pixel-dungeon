package com.shatteredpixel.shatteredpixeldungeon.actors.mobs;

import com.shatteredpixel.shatteredpixeldungeon.Challenges;
import com.shatteredpixel.shatteredpixeldungeon.Dungeon;
import com.shatteredpixel.shatteredpixeldungeon.actors.Actor;
import com.shatteredpixel.shatteredpixeldungeon.actors.Char;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.Hero;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.HeroClass;
import com.shatteredpixel.shatteredpixeldungeon.levels.CityBossLevel;
import com.shatteredpixel.shatteredpixeldungeon.sprites.GooSprite;
import com.watabou.noosa.Group;
import com.watabou.utils.Random;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.HashSet;

/** Project-authored trace of real v3.3.8 Goo.doAttack() pump-roll/enrage branches. */
public final class GooPhaseHarness {
	private static final long[] SEEDS = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15};

	public static String captureOutput() throws ReflectiveOperationException {
		StringBuilder out = new StringBuilder("{\"tool\":\"parityGooPhase-java\"}\n");
		int cases = 0;
		for (boolean stronger : new boolean[]{false, true}) {
			for (int hp : new int[]{200, 201}) {
				for (long seed : SEEDS) {
					out.append(startCase(seed, hp, stronger)).append('\n');
					cases++;
				}
			}
		}
		Actor.clear();
		out.append("{\"cases\":").append(cases).append("}\n");
		return out.toString();
	}

	private static String startCase(long seed, int hp, boolean stronger) throws ReflectiveOperationException {
		Actor.clear();
		Dungeon.challenges = stronger ? Challenges.STRONGER_BOSSES : 0;
		Dungeon.depth = 5;
		HarnessHero hero = new HarnessHero();
		hero.heroClass = HeroClass.WARRIOR;
		hero.damageInterrupt = false;
		hero.pos = 34;
		hero.queueFor(2.1f);
		CityBossLevel level = new CityBossLevel();
		level.setSize(15, 48);
		level.mobs = new HashSet<>();
		level.heaps = new com.watabou.utils.SparseArray<>();
		level.blobs = new HashMap<>();
		level.plants = new com.watabou.utils.SparseArray<>();
		level.traps = new com.watabou.utils.SparseArray<>();
		level.heroFOV = new boolean[level.length()];
		level.heroFOV[gooPosition()] = true;
		Dungeon.level = level;
		Dungeon.hero = hero;
		HarnessGoo goo = new HarnessGoo();
		goo.HT = 400;
		goo.HP = hp;
		goo.pos = 32;
		goo.state = goo.HUNTING;
		setIntField(goo, "pumpedUp", 0);
		HarnessGooSprite sprite = new HarnessGooSprite();
		Group parent = new Group();
		parent.add(sprite);
		goo.sprite = sprite;
		level.mobs.add(goo);

		int bound = hp * 2 <= goo.HT ? 2 : 5;
		Random.pushGenerator(seed);
		int roll = Random.Int(bound);
		Random.popGenerator();
		Random.pushGenerator(seed);
		float before = goo.cooldown();
		boolean returned = goo.runDoAttack(hero);
		Random.popGenerator();
		float spent = goo.cooldown() - before;
		return "{\"kind\":\"pump\",\"seed\":" + seed + ",\"hp\":" + hp
			+ ",\"stronger\":" + stronger + ",\"bound\":" + bound + ",\"roll\":" + roll
			+ ",\"pumped\":" + intField(goo, "pumpedUp") + ",\"attackCalls\":" + sprite.attackCalls
			+ ",\"pumpWarns\":" + sprite.pumpWarns
			+ ",\"returned\":" + returned + ",\"spent\":" + spent + "}";
	}

	private static int gooPosition() { return 32; }

	private static int intField(Object target, String name) throws ReflectiveOperationException {
		Field field = Goo.class.getDeclaredField(name);
		field.setAccessible(true);
		return field.getInt(target);
	}

	private static void setIntField(Object target, String name, int value) throws ReflectiveOperationException {
		Field field = Goo.class.getDeclaredField(name);
		field.setAccessible(true);
		field.setInt(target, value);
	}

	private static final class HarnessGoo extends Goo {
		boolean runDoAttack(Char enemy) { return doAttack(enemy); }
	}
	private static final class HarnessHero extends Hero {
		void queueFor(float time) { spend(time); }
	}

	/** Pump particles and their level/FOV path are presentation; the real doAttack() owns the charge. */
	private static final class HarnessGooSprite extends GooSprite {
		int attackCalls;
		int pumpWarns;
		@Override public void updateEmitters() { }
		@Override public void triggerEmitters() { }
		@Override public void attack(int cell) { attackCalls++; }
		@Override public void pumpUp(int warnDist) { pumpWarns = warnDist; }
	}
}
