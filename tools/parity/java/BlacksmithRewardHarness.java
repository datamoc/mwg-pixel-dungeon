package com.shatteredpixel.shatteredpixeldungeon.actors.mobs.npcs;

import com.shatteredpixel.shatteredpixeldungeon.Dungeon;
import com.shatteredpixel.shatteredpixeldungeon.Statistics;
import com.shatteredpixel.shatteredpixeldungeon.Badges;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.Hero;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.HeroClass;
import com.shatteredpixel.shatteredpixeldungeon.items.Generator;
import com.shatteredpixel.shatteredpixeldungeon.items.Item;
import com.shatteredpixel.shatteredpixeldungeon.items.quest.DarkGold;
import com.shatteredpixel.shatteredpixeldungeon.items.quest.Pickaxe;
import com.shatteredpixel.shatteredpixeldungeon.levels.Level;
import com.watabou.utils.Random;

import java.util.ArrayList;
import java.util.HashSet;
import java.lang.reflect.Field;

/**
 * Parity harness (BACKLOG B3, Blacksmith quest domain), project-authored: replicates
 * `Blacksmith.Quest.spawn()`'s RNG sequence (`Blacksmith.java`, tag `v3.3.8`) per
 * (seed, depth) WITHOUT the room placement (that loop's draws depend on level geometry,
 * which the port places differently) and dumps the spawn decision, quest type and every
 * reward roll, so the TypeScript trace can diff the port's gate composition +
 * `blacksmithSmithRewards()` draw-for-draw.
 *
 * Per case, on a freshly pushed generator: `Generator.fullReset()` (the deck state the
 * real game has at a fresh run; stream-position parity with mid-run creation is
 * explicitly out of scope, exactly like the loot stage's rounding buckets), then the
 * exact `spawn()` order: `Random.Int(15-depth)==0` gate (depths 12-14),
 * `type = Random.IntRange(1, 2)` (CRYSTAL/GNOLL; FUNGI never rolls), then the REAL
 * `Blacksmith.Quest.generateRewards(true)` - calling it rather than re-implementing it,
 * so the weapon/missile/armor tier rolls, the class-clash re-roll, the shared item level
 * and the always-rolled enchant/glyph picks are Java's own code. `generateRewards(true)`
 * forwards `true` to `randomWeapon/randomMissile(floorSet, useDefaults)`, so spawn-time
 * rewards use DEFAULT probs, never the run's decks (`WndBlacksmith`'s lazy fallback with
 * `false` is the deck path instead).
 *
 * Headless like LootHarness: bare Warrior hero (so
 * `ParchmentScrap.enchantChanceMultiplier()` reads its default 1, like the port, which
 * has no trinket model), empty 8x8 level. Output is JSONL.
 */
public class BlacksmithRewardHarness {

	private static final long[] SEEDS = {
		1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L,
		11L, 12L, 13L, 14L, 15L, 16L, 17L, 18L, 19L, 20L,
		21L, 22L, 23L, 24L, 25L, 26L, 27L, 28L, 29L, 30L,
		31L, 32L, 33L, 34L, 35L, 36L, 37L, 38L, 39L, 40L
	};

	private static final int[] DEPTHS = {12, 13, 14};

	public static String captureOutput() {
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

		StringBuilder out = new StringBuilder();
		out.append("{\"tool\":\"parityBlacksmithReward-java\"}\n");
		int cases = 0;

		for (long seed : SEEDS) {
			for (int depth : DEPTHS) {
				try {
					out.append(blacksmithCase(seed, depth)).append('\n');
					cases++;
				} catch (Throwable t) {
					out.append("{\"seed\":").append(seed)
						.append(",\"depth\":").append(depth)
						.append(",\"error\":\"")
						.append(String.valueOf(t).replace("\"", "'").replace("\\", "/"))
						.append("\"}\n");
				}
			}
		}
		try {
			for (int gold : new int[] {0, 1, 30, 40, 50}) {
				for (boolean bossBeaten : new boolean[] {false, true}) {
					out.append(blacksmithCompletionCase(gold, bossBeaten)).append('\n');
				}
			}
		} catch (Throwable t) {
			out.append("{\"kind\":\"completion\",\"error\":\"")
				.append(String.valueOf(t).replace("\"", "'").replace("\\", "/"))
				.append("\"}\n");
		}
		out.append("{\"cases\":").append(cases).append("}\n");
		return out.toString();
	}

	/** Calls real `Blacksmith.Quest.complete()` with carried DarkGold and the retained quest Pickaxe. */
	private static String blacksmithCompletionCase(int goldQuantity, boolean bossBeaten) throws ReflectiveOperationException {
		// Quest.complete() can award a badge; use an in-memory registry so the harness does not touch game files.
		Field globalBadges = Badges.class.getDeclaredField("global");
		globalBadges.setAccessible(true);
		globalBadges.set(null, new HashSet<>());
		Hero hero = new Hero();
		hero.heroClass = HeroClass.WARRIOR;
		Dungeon.hero = hero;
		Blacksmith.Quest.reset();
		new Pickaxe().collect(hero.belongings.backpack);
		if (goldQuantity > 0) new DarkGold().quantity(goldQuantity).collect(hero.belongings.backpack);
		Field beaten = Blacksmith.Quest.class.getDeclaredField("bossBeaten");
		beaten.setAccessible(true);
		beaten.setBoolean(null, bossBeaten);
		Field given = Blacksmith.Quest.class.getDeclaredField("given");
		given.setAccessible(true);
		given.setBoolean(null, true);
		Statistics.questScores = new int[5];
		Statistics.questScores[2] = 17;
		Blacksmith.Quest.complete();
		DarkGold remainingGold = hero.belongings.getItem(DarkGold.class);
		return "{\"kind\":\"completion\",\"gold\":" + goldQuantity
			+ ",\"bossBeaten\":" + bossBeaten
			+ ",\"favor\":" + Blacksmith.Quest.favor
			+ ",\"scoreDelta\":" + (Statistics.questScores[2] - 17)
			+ ",\"goldRemaining\":" + (remainingGold == null ? 0 : remainingGold.quantity())
			+ ",\"pickaxeRetained\":" + (Blacksmith.Quest.pickaxe != null)
			+ ",\"completed\":" + Blacksmith.Quest.completed()
			+ ",\"freePickaxe\":" + Blacksmith.Quest.freePickaxe + "}";
	}

	private static String blacksmithCase(long seed, int depth) {
		Random.pushGenerator(seed);
		try {
			Generator.fullReset();

			//`Blacksmith.Quest.spawn()`: `!spawned && Dungeon.depth > 11 &&
			//Random.Int(15-Dungeon.depth)==0`, once per run (fresh Quest state per
			//case here, so the gate is always live).
			boolean spawned = Random.Int(15 - depth) == 0;

			StringBuilder row = new StringBuilder();
			row.append("{\"seed\":").append(seed)
				.append(",\"depth\":").append(depth)
				.append(",\"spawned\":").append(spawned);
			if (!spawned) {
				row.append("}");
				return row.toString();
			}
			//Currently cannot roll the fungi quest: `Random.IntRange(1, 2)`.
			int type = Random.IntRange(1, 2);
			row.append(",\"type\":").append(type);

			Blacksmith.Quest.generateRewards(true);
			ArrayList<Item> rewards = Blacksmith.Quest.smithRewards;

			Item w1 = rewards.get(0);
			Item w2 = rewards.get(1);
			Item mis = rewards.get(2);
			Item arm = rewards.get(3);

			row.append(",\"w1tier\":").append(tierOf(Generator.wepTiers, w1.getClass()))
				.append(",\"w1cls\":\"").append(w1.getClass().getSimpleName()).append("\"")
				.append(",\"w2tier\":").append(tierOf(Generator.wepTiers, w2.getClass()))
				.append(",\"w2cls\":\"").append(w2.getClass().getSimpleName()).append("\"")
				.append(",\"mistier\":").append(tierOf(Generator.misTiers, mis.getClass()))
				.append(",\"miscls\":\"").append(mis.getClass().getSimpleName()).append("\"")
				.append(",\"armortier\":").append(tierOfArmor(arm.getClass()))
				.append(",\"armorcls\":\"").append(arm.getClass().getSimpleName()).append("\"")
				.append(",\"itemLevel\":").append(w1.level())
				.append(",\"keptEnchant\":").append(Blacksmith.Quest.smithEnchant != null)
				.append(",\"keptGlyph\":").append(Blacksmith.Quest.smithGlyph != null)
				.append("}");
			return row.toString();
		} finally {
			Random.popGenerator();
		}
	}

	private static int tierOf(Generator.Category[] tiers, Class<?> cls) {
		for (int i = 0; i < tiers.length; i++) {
			for (Class<?> c : tiers[i].classes) {
				if (c == cls) return i + 1;
			}
		}
		return -1;
	}

	private static int tierOfArmor(Class<?> cls) {
		Class<?>[] armor = Generator.Category.ARMOR.classes;
		for (int i = 0; i < armor.length; i++) {
			if (armor[i] == cls) return i + 1;
		}
		return -1;
	}
}
