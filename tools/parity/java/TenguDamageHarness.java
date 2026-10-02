package com.shatteredpixel.shatteredpixeldungeon.actors.mobs;

import com.shatteredpixel.shatteredpixeldungeon.Dungeon;
import com.shatteredpixel.shatteredpixeldungeon.actors.Actor;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.Hero;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.HeroClass;
import com.shatteredpixel.shatteredpixeldungeon.levels.PrisonBossLevel;

import java.lang.reflect.Field;
import java.util.HashSet;

/** Project-authored trace of real `Tengu.damage()` bracket behavior, tag `v3.3.8`. */
public final class TenguDamageHarness {

	private static final int[] START_HP = {
		200, 199, 176, 175, 174, 151, 150, 126, 125, 101,
		100, 76, 75, 51, 50, 26, 25, 10, 2
	};
	private static final int[] DAMAGE = { 1, 2, 7, 24, 25, 50 };

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
			out.append("{\"preHp\":").append(preHp)
				.append(",\"damage\":").append(damage)
				.append(",\"maxHp\":").append(tengu.HT)
				.append(",\"hp\":").append(tengu.HP)
				.append(",\"jumpScheduled\":").append(jumpScheduled)
				.append(",\"bracket\":").append(bracket).append("}\n");
			cases++;
		}
		Actor.clear();
		out.append("{\"cases\":").append(cases).append("}\n");
		return out.toString();
	}

	private static void setFightState(PrisonBossLevel level, PrisonBossLevel.State state)
			throws ReflectiveOperationException {
		Field field = PrisonBossLevel.class.getDeclaredField("state");
		field.setAccessible(true);
		field.set(level, state);
	}
}
