package com.shatteredpixel.shatteredpixeldungeon.actors.mobs.npcs;

import com.shatteredpixel.shatteredpixeldungeon.Dungeon;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.Hero;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.HeroClass;
import com.shatteredpixel.shatteredpixeldungeon.items.Generator;
import com.shatteredpixel.shatteredpixeldungeon.items.armor.Armor;
import com.shatteredpixel.shatteredpixeldungeon.items.armor.LeatherArmor;
import com.shatteredpixel.shatteredpixeldungeon.items.armor.MailArmor;
import com.shatteredpixel.shatteredpixeldungeon.items.armor.PlateArmor;
import com.shatteredpixel.shatteredpixeldungeon.items.armor.ScaleArmor;
import com.shatteredpixel.shatteredpixeldungeon.items.trinkets.ParchmentScrap;
import com.shatteredpixel.shatteredpixeldungeon.items.weapon.Weapon;
import com.shatteredpixel.shatteredpixeldungeon.items.weapon.melee.MeleeWeapon;
import com.shatteredpixel.shatteredpixeldungeon.levels.Level;
import com.watabou.utils.Random;

/**
 * Parity harness (BACKLOG B3, Ghost quest domain), project-authored: replicates
 * `Ghost.Quest.spawn()`'s RNG sequence (`Ghost.java`, tag `v3.3.8`) per (seed, depth)
 * WITHOUT the room/position loop (that loop's draws depend on level geometry, which the
 * port places differently - its own `standableCellIn` fallback chain) and dumps the
 * spawn decision plus every reward roll, so the TypeScript trace can diff the port's
 * `maybeSpawnGhost` gate and `ghostQuestReward()` composition draw-for-draw.
 *
 * Per case, on a freshly pushed generator: `Generator.fullReset()` (the deck state the
 * real game has at a fresh run; stream-position parity with mid-run creation is
 * explicitly out of scope, exactly like the loot stage's rounding buckets), then the
 * exact `spawn()` order: `Random.Int(5-depth)==0` gate, `type = depth-1`, tier chances
 * (`{0, 0, 10, 6, 3, 1}`), `Generator.random(wepTiers[wepTier-1])`, the shared
 * `itemLevelRoll` thresholds, `Enchantment.random()` + `Glyph.random()` (always rolled,
 * kept or not), and the `enchantRoll <= 0.2 * ParchmentScrap.enchantChanceMultiplier()`
 * keep test (bare hero, so the multiplier reads its default 1, like the port).
 *
 * Headless like LootHarness: bare Warrior hero, empty 8x8 level. Output is JSONL.
 */
public class GhostRewardHarness {

	private static final long[] SEEDS = {
		1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L,
		11L, 12L, 13L, 14L, 15L, 16L, 17L, 18L, 19L, 20L,
		21L, 22L, 23L, 24L, 25L, 26L, 27L, 28L, 29L, 30L,
		31L, 32L, 33L, 34L, 35L, 36L, 37L, 38L, 39L, 40L
	};

	private static final int[] DEPTHS = {2, 3, 4};

	private static final float[] TIER_WEIGHTS = {0, 0, 10, 6, 3, 1};

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
		out.append("{\"tool\":\"parityGhostReward-java\"}\n");
		int cases = 0;

		for (long seed : SEEDS) {
			for (int depth : DEPTHS) {
				try {
					out.append(ghostCase(seed, depth)).append('\n');
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
		out.append("{\"cases\":").append(cases).append("}\n");
		return out.toString();
	}

	private static String ghostCase(long seed, int depth) {
		Random.pushGenerator(seed);
		try {
			Generator.fullReset();

			//`Ghost.Quest.spawn()`: `Random.Int(5-depth)==0`, once per run (fresh Quest
			//state per case here, so the gate is always live).
			boolean spawned = Random.Int(5 - depth) == 0;

			StringBuilder row = new StringBuilder();
			row.append("{\"seed\":").append(seed)
				.append(",\"depth\":").append(depth)
				.append(",\"spawned\":").append(spawned);
			if (!spawned) {
				row.append("}");
				return row.toString();
			}
			row.append(",\"type\":").append(depth - 1);

			//50%:tier2, 30%:tier3, 15%:tier4, 5%:tier5
			int armorTier = Random.chances(TIER_WEIGHTS);
			Armor armor;
			switch (armorTier) {
				default:
				case 2: armor = new LeatherArmor(); break;
				case 3: armor = new MailArmor(); break;
				case 4: armor = new ScaleArmor(); break;
				case 5: armor = new PlateArmor(); break;
			}
			int wepTier = Random.chances(TIER_WEIGHTS);
			Weapon weapon = (Weapon) Generator.random(Generator.wepTiers[wepTier - 1]);

			//clear weapon's starting properties
			weapon.level(0);
			weapon.enchant(null);
			weapon.cursed = false;

			//50%:+0, 30%:+1, 15%:+2, 5%:+3
			float itemLevelRoll = Random.Float();
			int itemLevel;
			if (itemLevelRoll < 0.5f) {
				itemLevel = 0;
			} else if (itemLevelRoll < 0.8f) {
				itemLevel = 1;
			} else if (itemLevelRoll < 0.95f) {
				itemLevel = 2;
			} else {
				itemLevel = 3;
			}
			weapon.upgrade(itemLevel);
			armor.upgrade(itemLevel);

			// 20% base chance to be enchanted, stored separately so status isn't revealed early
			//we generate first so that the outcome doesn't affect the number of RNG rolls
			Weapon.Enchantment enchant = Weapon.Enchantment.random();
			Armor.Glyph glyph = Armor.Glyph.random();

			float enchantRoll = Random.Float();
			boolean kept = enchantRoll <= 0.2f * ParchmentScrap.enchantChanceMultiplier();

			row.append(",\"armorTier\":").append(armorTier)
				.append(",\"armorCls\":\"").append(armor.getClass().getSimpleName()).append("\"")
				.append(",\"wepTier\":").append(wepTier)
				.append(",\"weaponCls\":\"").append(weapon.getClass().getSimpleName()).append("\"")
				.append(",\"itemLevel\":").append(itemLevel)
				.append(",\"itemLevelBits\":").append(Integer.toUnsignedString(Float.floatToIntBits(itemLevelRoll)))
				.append(",\"kept\":").append(kept)
				.append(",\"enchantCls\":\"").append(enchant.getClass().getSimpleName()).append("\"")
				.append(",\"glyphCls\":\"").append(glyph.getClass().getSimpleName()).append("\"")
				.append(",\"enchantBits\":").append(Integer.toUnsignedString(Float.floatToIntBits(enchantRoll)))
				.append("}");
			return row.toString();
		} finally {
			Random.popGenerator();
		}
	}
}
