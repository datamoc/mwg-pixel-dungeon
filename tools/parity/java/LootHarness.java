package com.shatteredpixel.shatteredpixeldungeon.actors.mobs;

import com.shatteredpixel.shatteredpixeldungeon.Dungeon;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.Hero;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.HeroClass;
import com.shatteredpixel.shatteredpixeldungeon.levels.Level;
import com.watabou.utils.Random;

/**
 * Parity harness (BACKLOG B3 / coord T57), project-authored: reports what Java's own
 * `Mob.lootChance()` returns for a fixed matrix of (mob, `Dungeon.LimitedDrops` counter, count,
 * Swarm generation) cases - the derived chance `Mob.rollToDropLoot()` compares its
 * `Random.Float()` against - as raw float32 bits.
 *
 * `tools/parityLootTrace.ts` recomputes the same value from the port's authored tables
 * (`loot-rules.mwl`'s `monsterLoot` + `limitedDropDecay`, read through `src/monsters.ts`) and
 * the shared `mobLootChance()` composition, then diffs the two. Nothing here rolls the drop:
 * `createLoot()` draws the item (a `Generator` stream the port does not model - the port's
 * `monsterLoot` rows name a fixed kind instead), so only the *decision* value is compared.
 *
 * The matrix covers every Java class whose `lootChance()` override reads a `LimitedDrops`
 * counter (the ten the port's `limitedDropDecay` table authors), walked across the counter's
 * range plus Swarm's `generation` divisor, and a set of plain-field mobs as the control.
 *
 * Headless like MobDataHarness: bare Warrior hero, empty 8x8 level, `Random` untouched (this
 * harness draws nothing). Output is JSONL, one line per case.
 */
public class LootHarness {

	/** Mobs whose Java `lootChance()` is the plain `lootChance` field (the control group). */
	private static final String[] BASE = {
		"Rat", "Snake", "Crab", "Gnoll", "Spinner", "Piranha", "Eye", "Albino",
		"Bandit", "Brute", "Ghoul", "Monk", "DemonSpawner"
	};

	/** { port-facing mob name, Java class to instantiate (nested classes use a dotted name),
	 *  `Dungeon.LimitedDrops` counter its override reads, exclusive upper count }. */
	private static final String[][] DECAY = {
		{"Bat", "Bat", "BAT_HP", "7"},
		{"Necromancer", "Necromancer", "NECRO_HP", "6"},
		{"Guard", "Guard", "GUARD_ARM", "5"},
		{"DM200", "DM200", "DM200_EQUIP", "5"},
		{"Golem", "Golem", "GOLEM_EQUIP", "5"},
		//`Shaman` is abstract (v3.3.8 has Red/Blue/Purple subclasses); they inherit its
		//`lootChance()` override, so one concrete subclass carries the whole matrix row.
		{"Shaman", "Shaman.RedShaman", "SHAMAN_WAND", "5"},
		{"Slime", "Slime", "SLIME_WEP", "5"},
		{"Skeleton", "Skeleton", "SKELE_WEP", "5"},
		{"Thief", "Thief", "THEIF_MISC", "5"},
		{"Swarm", "Swarm", "SWARM_HP", "5"},
	};

	/** Swarm's override also divides by `generation + 1`, so it is walked per generation too. */
	private static final int[] SWARM_GENERATIONS = {0, 1, 2};

	public static String captureOutput() {
		Hero hero = new Hero();
		hero.heroClass = HeroClass.WARRIOR;
		//Same headless guards as Combat/MobDataHarness: no UI, no sprite, no draw.
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
		//Every case starts from a clean LimitedDrops table; each case sets only its own counter.
		for (Dungeon.LimitedDrops d : Dungeon.LimitedDrops.values()) d.count = 0;
		//No ring, no bounty tracker, no shard: both sides then compute `base * decay / divisor`.
		//This harness draws nothing (`Random` is untouched), so there is no trace hook to arm.

		StringBuilder out = new StringBuilder();
		out.append("{\"tool\":\"parityLootChance-java\",\"cases\":0}\n");
		int cases = 0;

		for (String name : BASE) {
			try {
				Mob m = make(name);
				float c = m.lootChance();
				out.append(row(name, "", 0, 0, c)).append('\n');
				cases++;
			} catch (Throwable t) {
				out.append(error(name, "", 0, 0, t)).append('\n');
			}
		}
		for (String[] d : DECAY) {
			String name = d[0], className = d[1], counter = d[2];
			int upper = Integer.parseInt(d[3]);
			for (int n = 0; n < upper; n++) {
				int[] generations = name.equals("Swarm") ? SWARM_GENERATIONS : new int[]{0};
				for (int generation : generations) {
					for (Dungeon.LimitedDrops lim : Dungeon.LimitedDrops.values()) lim.count = 0;
					try {
						Mob m = make(className);
						Dungeon.LimitedDrops.valueOf(counter).count = n;
						if (m instanceof Swarm) ((Swarm) m).generation = generation;
						float c = m.lootChance();
						out.append(row(name, counter, n, generation, c)).append('\n');
						cases++;
					} catch (Throwable t) {
						out.append(error(name, counter, n, generation, t)).append('\n');
					}
				}
			}
		}

		out.append("{\"cases\":").append(cases).append("}\n");
		return out.toString();
	}

	/** Same package as the mobs, so the concrete classes and Swarm's package-private field are reachable.
	 *  A dotted name addresses a nested class (`Shaman.RedShaman`). */
	private static Mob make(String qualified) throws Exception {
		String binary = qualified.replace('.', '$');
		Class<?> c = Class.forName("com.shatteredpixel.shatteredpixeldungeon.actors.mobs." + binary);
		if (java.lang.reflect.Modifier.isAbstract(c.getModifiers())) {
			throw new IllegalStateException(qualified + " is abstract in this ref");
		}
		Mob m = (Mob) c.getDeclaredConstructor().newInstance();
		m.pos = 1;
		return m;
	}

	private static String row(String mob, String counter, int count, int generation, float chance) {
		int bits = Float.floatToIntBits(chance);
		return "{\"mob\":\"" + mob + "\",\"counter\":\"" + counter + "\",\"count\":" + count
			+ ",\"generation\":" + generation
			+ ",\"bits\":" + Integer.toUnsignedString(bits)
			+ ",\"value\":" + chance + "}";
	}

	private static String error(String mob, String counter, int count, int generation, Throwable t) {
		return "{\"mob\":\"" + mob + "\",\"counter\":\"" + counter + "\",\"count\":" + count
			+ ",\"generation\":" + generation + ",\"error\":\""
			+ String.valueOf(t).replace("\"", "'").replace("\\", "/") + "\"}";
	}
}
