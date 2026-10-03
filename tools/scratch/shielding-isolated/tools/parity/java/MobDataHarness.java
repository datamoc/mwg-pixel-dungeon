package com.shatteredpixel.shatteredpixeldungeon.actors.mobs;

import com.shatteredpixel.shatteredpixeldungeon.Dungeon;
import com.shatteredpixel.shatteredpixeldungeon.actors.Char;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.Hero;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.HeroClass;
import com.shatteredpixel.shatteredpixeldungeon.items.Generator;
import com.shatteredpixel.shatteredpixeldungeon.levels.Level;
import com.watabou.utils.Random;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.TreeSet;

/**
 * Parity harness (BACKLOG B3 / coord T57), project-authored: instantiates every concrete Mob class found in the
 * `actors/mobs` source directory and dumps, one JSON line per mob, the numbers the TypeScript port authors in
 * `monsters.mwl` / `loot-rules.mwl`: HP/HT, EXP, maxLvl, attack skill, defense skill, sampled damage and armor ranges, the
 * loot object and lootChance, flying, properties, immunities and resistances. `tools/parity/mobDataParity.ts` diffs it
 * against the port. Runs headless in a bare Warrior/empty-level setup like CombatHarness; nothing here draws the game.
 */
public class MobDataHarness {

	public static String captureOutput(String mobDir) {
		Hero hero = new Hero();
		hero.heroClass = HeroClass.WARRIOR;
		hero.damageInterrupt = false;
		Level level = new Level() {
			@Override protected boolean build() { return true; }
			@Override protected void createMobs() { }
			@Override protected void createItems() { }
		};
		level.setSize(8, 8);
		Dungeon.level = level;
		Dungeon.hero = hero;
		Dungeon.depth = 1;
		hero.pos = 0;
		Random.pushGenerator(1L);

		File[] files = new File(mobDir).listFiles((d, n) -> n.endsWith(".java"));
		if (files == null) return "{\"error\":\"no mob directory at " + mobDir.replace("\\", "/") + "\"}\n";
		Arrays.sort(files);
		StringBuilder out = new StringBuilder();
		for (File f : files) {
			String name = f.getName().substring(0, f.getName().length() - 5);
			try {
				Class<?> c = Class.forName("com.shatteredpixel.shatteredpixeldungeon.actors.mobs." + name);
				if (java.lang.reflect.Modifier.isAbstract(c.getModifiers()) || !Mob.class.isAssignableFrom(c)) continue;
				Mob m = (Mob) c.getDeclaredConstructor().newInstance();
				m.pos = 1;
				//Stats some mobs only set when spawned for a depth (Mimic/Wraith `adjustStats`, Bee `spawn`): scale them to depth 1,
				//the depth the port's authored base rows describe.
				m.alignment = Char.Alignment.ENEMY; //Mimic and friends start NEUTRAL (infinite attack skill until revealed)
				setLevel(m, 1);
				scale(m, "adjustStats");
				scale(m, "spawn");
				out.append(row(name, m, hero)).append('\n');
			} catch (Throwable t) {
				out.append("{\"mob\":\"").append(name).append("\",\"error\":\"")
					.append(String.valueOf(t).replace("\"", "'").replace("\\", "/")).append("\"}\n");
			}
		}
		return out.toString();
	}

	private static String row(String name, Mob m, Hero hero) {
		int dmgMin = Integer.MAX_VALUE, dmgMax = Integer.MIN_VALUE, drMin = Integer.MAX_VALUE, drMax = Integer.MIN_VALUE;
		for (int i = 0; i < 3000; i++) {
			int d = m.damageRoll();
			if (d < dmgMin) dmgMin = d;
			if (d > dmgMax) dmgMax = d;
			int r = m.drRoll();
			if (r < drMin) drMin = r;
			if (r > drMax) drMax = r;
		}
		String loot;
		Object l = m.loot;
		if (l == null) loot = "none";
		else if (l instanceof Class) loot = "class:" + ((Class<?>) l).getSimpleName();
		else if (l instanceof Generator.Category) loot = "cat:" + ((Generator.Category) l).name();
		else loot = "obj:" + l.getClass().getSimpleName();
		int attack;
		try { attack = m.attackSkill(hero); } catch (Throwable t) { attack = -1; }
		StringBuilder s = new StringBuilder("{");
		s.append("\"mob\":\"").append(name).append('"');
		s.append(",\"hp\":").append(m.HT).append(",\"exp\":").append(m.EXP).append(",\"maxLvl\":").append(m.maxLvl);
		s.append(",\"attack\":").append(attack).append(",\"defense\":").append(m.defenseSkill);
		s.append(",\"dmg\":[").append(dmgMin).append(',').append(dmgMax).append(']');
		s.append(",\"dr\":[").append(drMin).append(',').append(drMax).append(']');
		s.append(",\"lootChance\":").append(m.lootChance).append(",\"loot\":\"").append(loot).append('"');
		s.append(",\"flying\":").append(m.flying);
		s.append(",\"properties\":").append(names(m.properties()));
		s.append(",\"immunities\":").append(classNames(field(m, "immunities")));
		s.append(",\"resistances\":").append(classNames(field(m, "resistances")));
		return s.append('}').toString();
	}

	/** Mimic and Wraith keep their depth in a `level` field that adjustStats(int) reads but does not always set. */
	private static void setLevel(Mob m, int level) {
		for (Class<?> k = m.getClass(); k != null && k != Object.class; k = k.getSuperclass()) {
			try {
				java.lang.reflect.Field f = k.getDeclaredField("level");
				f.setAccessible(true);
				f.setInt(m, level);
				return;
			} catch (NoSuchFieldException e) {
				//try the superclass
			} catch (Throwable t) {
				return;
			}
		}
	}

	private static void scale(Mob m, String method) {
		for (Class<?> k = m.getClass(); k != null && k != Object.class; k = k.getSuperclass()) {
			try {
				java.lang.reflect.Method f = k.getDeclaredMethod(method, int.class);
				f.setAccessible(true);
				f.invoke(m, 1);
				return;
			} catch (NoSuchMethodException e) {
				//try the superclass
			} catch (Throwable t) {
				return;
			}
		}
	}

	/** Char.immunities / Char.resistances are protected fields of a different package, so read them reflectively. */
	@SuppressWarnings("unchecked")
	private static Collection<?> field(Char m, String name) {
		try {
			java.lang.reflect.Field f = Char.class.getDeclaredField(name);
			f.setAccessible(true);
			return (Collection<?>) f.get(m);
		} catch (Throwable t) {
			return new ArrayList<Object>();
		}
	}

	private static String names(Collection<?> c) {
		TreeSet<String> t = new TreeSet<>();
		for (Object o : c) t.add(String.valueOf(o));
		return json(t);
	}

	private static String classNames(Collection<?> c) {
		TreeSet<String> t = new TreeSet<>();
		for (Object o : c) t.add(o instanceof Class ? ((Class<?>) o).getSimpleName() : String.valueOf(o));
		return json(t);
	}

	private static String json(Collection<String> c) {
		ArrayList<String> q = new ArrayList<>();
		for (String x : c) q.add('"' + x + '"');
		return "[" + String.join(",", q) + "]";
	}
}
