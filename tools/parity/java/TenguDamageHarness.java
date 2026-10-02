package com.shatteredpixel.shatteredpixeldungeon.actors.mobs;

import com.shatteredpixel.shatteredpixeldungeon.Dungeon;
import com.shatteredpixel.shatteredpixeldungeon.actors.Actor;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.Hero;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.HeroClass;
import com.shatteredpixel.shatteredpixeldungeon.levels.PrisonBossLevel;

import java.lang.reflect.Field;
import java.util.HashSet;

/** Project-authored trace of real `Tengu.damage()` bracket and phase-edge behavior, tag `v3.3.8`.
 * Nine FIGHT_START cases call the actual override; the PrisonBossLevel test double records
 * `progress()` and switches state, but does not run arena map/layout presentation work. */
public final class TenguDamageHarness {

	private static final int[] START_HP = {
		200, 199, 176, 175, 174, 151, 150, 126, 125, 101,
		100, 76, 75, 51, 50, 26, 25, 10, 2
	};
	private static final int[] DAMAGE = { 1, 2, 7, 24, 25, 50 };
	private static final int[][] PHASE_EDGE = {
		{200, 1}, {126, 25}, {101, 1}, {101, 25}, {100, 1},
		{150, 50}, {126, 26}, {101, 50}, {99, 1}
	};

	public static String captureOutput() throws ReflectiveOperationException {
		StringBuilder out = new StringBuilder();
		out.append("{\"tool\":\"parityTenguDamage-java\"}\n");
		int cases = 0;
		for (int preHp : START_HP) for (int damage : DAMAGE) {
			if (damage >= preHp) continue; // Keep the fight alive; death/progression is a separate branch.
			Actor.clear();
			Dungeon.challenges = 0;
			Dungeon.depth = 10;
			Hero hero = new Hero();
			hero.heroClass = HeroClass.WARRIOR;
			hero.damageInterrupt = false;
			PrisonBossLevel level = new PrisonBossLevel();
			setFightState(level, PrisonBossLevel.State.FIGHT_PAUSE);
			level.mobs = new HashSet<>();
			Tengu tengu = new Tengu();
			tengu.HT = 200;
			tengu.HP = preHp;
			tengu.pos = 12;
			level.mobs.add(tengu);
			Dungeon.level = level;
			Dungeon.hero = hero;

			// FIGHT_PAUSE skips Tengu's scene/phase transition but keeps damage()'s real
			// HT/8 clamp and its deferred bracket-jump scheduling branch active.
			tengu.damage(damage, new Object());
			boolean jumpScheduled = !Actor.all().isEmpty();
			int bracket = tengu.HT / 8;
			out.append("{\"kind\":\"damage\",\"preHp\":").append(preHp)
				.append(",\"damage\":").append(damage)
				.append(",\"maxHp\":").append(tengu.HT)
				.append(",\"hp\":").append(tengu.HP)
				.append(",\"jumpScheduled\":").append(jumpScheduled)
				.append(",\"bracket\":").append(bracket).append("}\n");
			cases++;
		}
		int phaseCases = 0;
		for (int[] test : PHASE_EDGE) {
			out.append(phaseCase(test[0], test[1])).append('\n');
			phaseCases++;
		}
		Actor.clear();
		out.append("{\"cases\":").append(cases)
			.append(",\"phaseCases\":").append(phaseCases).append("}\n");
		return out.toString();
	}

	/** Runs the real FIGHT_START threshold branch while recording, but not painting, progress(). */
	private static String phaseCase(int preHp, int damage) throws ReflectiveOperationException {
		Actor.clear();
		Dungeon.challenges = 0;
		Dungeon.depth = 10;
		Hero hero = new Hero();
		hero.heroClass = HeroClass.WARRIOR;
		hero.damageInterrupt = false;
		HarnessPrisonBossLevel level = new HarnessPrisonBossLevel();
		setFightState(level, PrisonBossLevel.State.FIGHT_START);
		level.mobs = new HashSet<>();
		Tengu tengu = new Tengu();
		tengu.HT = 200;
		tengu.HP = preHp;
		tengu.pos = 12;
		level.mobs.add(tengu);
		Dungeon.level = level;
		Dungeon.hero = hero;

		tengu.damage(damage, new Object());
		return "{\"kind\":\"phase1\",\"preHp\":" + preHp
			+ ",\"damage\":" + damage
			+ ",\"maxHp\":" + tengu.HT
			+ ",\"hp\":" + tengu.HP
			+ ",\"phaseStarted\":" + (level.progressCalls > 0)
			+ ",\"progressCalls\":" + level.progressCalls
			+ ",\"state\":\"" + level.state().name() + "\""
			+ ",\"jumpScheduled\":" + !Actor.all().isEmpty() + "}";
	}

	private static final class HarnessPrisonBossLevel extends PrisonBossLevel {
		int progressCalls;

		@Override
		public void progress() {
			progressCalls++;
			try {
				setFightState(this, PrisonBossLevel.State.FIGHT_PAUSE);
			} catch (ReflectiveOperationException e) {
				throw new RuntimeException(e);
			}
		}
	}

	private static void setFightState(PrisonBossLevel level, PrisonBossLevel.State state)
			throws ReflectiveOperationException {
		Field field = PrisonBossLevel.class.getDeclaredField("state");
		field.setAccessible(true);
		field.set(level, state);
	}
}
