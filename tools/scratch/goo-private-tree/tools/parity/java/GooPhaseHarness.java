package com.shatteredpixel.shatteredpixeldungeon.actors.mobs;

import com.shatteredpixel.shatteredpixeldungeon.Challenges;
import com.shatteredpixel.shatteredpixeldungeon.Dungeon;
import com.shatteredpixel.shatteredpixeldungeon.actors.Actor;
import com.shatteredpixel.shatteredpixeldungeon.actors.Char;
import com.shatteredpixel.shatteredpixeldungeon.actors.buffs.Buff;
import com.shatteredpixel.shatteredpixeldungeon.actors.buffs.LockedFloor;
import com.shatteredpixel.shatteredpixeldungeon.actors.buffs.Ooze;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.Hero;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.HeroClass;
import com.shatteredpixel.shatteredpixeldungeon.Statistics;
import com.shatteredpixel.shatteredpixeldungeon.levels.CityBossLevel;
import com.shatteredpixel.shatteredpixeldungeon.sprites.GooSprite;
import com.shatteredpixel.shatteredpixeldungeon.sprites.CharSprite;
import com.shatteredpixel.shatteredpixeldungeon.ui.BossHealthBar;
import com.watabou.noosa.Group;
import com.watabou.utils.Random;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.HashSet;

/** Project-authored traces of v3.3.8 Goo.doAttack(), damageRoll() and attackProc() branches. */
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
		for (long seed : SEEDS) {
			out.append(startAttackProcCase(seed)).append('\n');
			cases++;
		}
		for (int[] input : new int[][]{{8, 2}, {9, 3}, {4, 2}, {10, 2}}) {
			out.append(startWaterCase(input[0], input[1], true)).append('\n');
			cases++;
		}
		for (boolean stronger : new boolean[]{false, true}) {
			for (int hp : new int[]{200, 201}) {
				for (int seed = 0; seed < 8; seed++) {
					out.append(startSlamRollCase(seed, hp, stronger)).append('\n');
					cases++;
				}
			}
		}
		Actor.clear();
		out.append("{\"cases\":").append(cases).append("}\n");
		return out.toString();
	}

	private static String startSlamRollCase(long seed, int hp, boolean stronger) throws ReflectiveOperationException {
		Actor.clear();
		Dungeon.challenges = stronger ? Challenges.STRONGER_BOSSES : 0;
		Dungeon.depth = 5;
		HarnessHero hero = new HarnessHero();
		Dungeon.hero = hero;
		HarnessGoo goo = new HarnessGoo();
		goo.HT = 400;
		goo.HP = hp;
		goo.setEnemy(hero);
		setIntField(goo, "pumpedUp", 2);
		Statistics.bossScores[0] = 0;
		Statistics.qualifiedForBossChallengeBadge = true;
		int skill = goo.attackSkill(hero);
		int minDamage = 3;
		int maxDamage = hp * 2 <= goo.HT ? 36 : 24;
		Random.pushGenerator(seed);
		int expectedDamage = Random.NormalIntRange(minDamage, maxDamage);
		Random.popGenerator();
		Random.pushGenerator(seed);
		int actualDamage = goo.damageRoll();
		Random.popGenerator();
		return "{\"kind\":\"slam-roll\",\"seed\":" + seed + ",\"hp\":" + hp
			+ ",\"stronger\":" + stronger + ",\"attackSkill\":" + skill
			+ ",\"minDamage\":" + minDamage + ",\"maxDamage\":" + maxDamage
			+ ",\"expectedDamage\":" + expectedDamage + ",\"actualDamage\":" + actualDamage
			+ ",\"pumpedAfter\":" + intField(goo, "pumpedUp")
			+ ",\"bossScore\":" + Statistics.bossScores[0]
			+ ",\"badgeQualified\":" + Statistics.qualifiedForBossChallengeBadge + "}";
	}

	private static String startAttackProcCase(long seed) {
		Actor.clear();
		Dungeon.challenges = 0;
		HarnessHero hero = new HarnessHero();
		hero.sprite = new HarnessTargetSprite();
		Dungeon.hero = hero;
		HarnessGoo goo = new HarnessGoo();
		Random.pushGenerator(seed);
		int expectedRoll = Random.Int(3);
		Random.popGenerator();
		Random.pushGenerator(seed);
		int dealt = goo.attackProc(hero, 13);
		Random.popGenerator();
		return "{\"kind\":\"attack-proc\",\"seed\":" + seed
			+ ",\"roll\":" + expectedRoll + ",\"damage\":" + dealt
			+ ",\"ooze\":" + (hero.buff(Ooze.class) != null) + "}";
	}

	private static String startWaterCase(int hp, int healInc, boolean stronger) throws ReflectiveOperationException {
		Actor.clear();
		Dungeon.challenges = stronger ? Challenges.STRONGER_BOSSES : 0;
		Dungeon.depth = 5;
		HarnessHero hero = new HarnessHero();
		hero.heroClass = HeroClass.WARRIOR;
		hero.damageInterrupt = false;
		hero.pos = 34;
		CityBossLevel level = new CityBossLevel();
		level.setSize(15, 48);
		level.mobs = new HashSet<>();
		level.heaps = new com.watabou.utils.SparseArray<>();
		level.blobs = new HashMap<>();
		level.plants = new com.watabou.utils.SparseArray<>();
		level.traps = new com.watabou.utils.SparseArray<>();
		level.heroFOV = new boolean[level.length()];
		level.water[gooPosition()] = true;
		level.heroFOV[gooPosition()] = true;
		Dungeon.level = level;
		Dungeon.hero = hero;
		LockedFloor lock = Buff.affect(hero, LockedFloor.class);
		setFloatField(lock, "left", 10f);
		HarnessGoo goo = new HarnessGoo();
		goo.HT = 10;
		goo.HP = hp;
		goo.pos = gooPosition();
		goo.state = goo.SLEEPING;
		setIntField(goo, "healInc", healInc);
		HarnessGooSprite sprite = new HarnessGooSprite();
		Group parent = new Group();
		parent.add(sprite);
		goo.sprite = sprite;
		level.mobs.add(goo);
		BossHealthBar.assignBoss(goo);
		BossHealthBar.bleed(true);
		Statistics.qualifiedForBossChallengeBadge = true;
		goo.runAct();
		int hpAfter = goo.HP;
		int healIncAfter = intField(goo, "healInc");
		float lockAfter = floatField(lock, "left");
		boolean badgeQualified = Statistics.qualifiedForBossChallengeBadge;
		boolean bleeding = BossHealthBar.isBleeding();
		String statusAmount = sprite.statusAmount;
		goo.runAct();
		return "{\"kind\":\"heal\",\"hpBefore\":" + hp + ",\"healIncBefore\":" + healInc
			+ ",\"stronger\":" + stronger + ",\"hpAfter\":" + hpAfter
			+ ",\"healIncAfter\":" + healIncAfter
			+ ",\"lockLeft\":" + lockAfter
			+ ",\"badgeQualified\":" + badgeQualified
			+ ",\"bleeding\":" + bleeding
			+ ",\"statusAmount\":\"" + statusAmount + "\""
			+ ",\"hpAfterNext\":" + goo.HP
			+ ",\"healIncAfterNext\":" + intField(goo, "healInc") + "}";
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

	private static float floatField(Object target, String name) throws ReflectiveOperationException {
		Field field = target.getClass().getDeclaredField(name);
		field.setAccessible(true);
		return field.getFloat(target);
	}

	private static void setFloatField(Object target, String name, float value) throws ReflectiveOperationException {
		Field field = target.getClass().getDeclaredField(name);
		field.setAccessible(true);
		field.setFloat(target, value);
	}

	private static final class HarnessGoo extends Goo {
		boolean runDoAttack(Char enemy) { return doAttack(enemy); }
		boolean runAct() { return act(); }
		void setEnemy(Char enemy) { this.enemy = enemy; }
	}
	private static final class HarnessHero extends Hero {
		void queueFor(float time) { spend(time); }
	}
	private static final class HarnessTargetSprite extends CharSprite { }

	/** Pump particles and their level/FOV path are presentation; the real doAttack() owns the charge. */
	private static final class HarnessGooSprite extends GooSprite {
		int attackCalls;
		int pumpWarns;
		String statusAmount = "";
		@Override public void updateEmitters() { }
		@Override public void triggerEmitters() { }
		@Override public void attack(int cell) { attackCalls++; }
		@Override public void pumpUp(int warnDist) { pumpWarns = warnDist; }
		@Override public void showStatusWithIcon(int color, String text, int icon, Object... args) { statusAmount = text; }
		@Override public void spray(boolean on) { }
	}
}
