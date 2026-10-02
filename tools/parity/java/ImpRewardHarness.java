package com.shatteredpixel.shatteredpixeldungeon.actors.mobs.npcs;

import com.shatteredpixel.shatteredpixeldungeon.items.Generator;
import com.shatteredpixel.shatteredpixeldungeon.items.rings.RingOfMight;
import com.shatteredpixel.shatteredpixeldungeon.items.rings.Ring;
import com.shatteredpixel.shatteredpixeldungeon.Statistics;
import com.shatteredpixel.shatteredpixeldungeon.journal.Notes;
import com.watabou.utils.Random;

import java.lang.reflect.Field;

/**
 * Parity harness (BACKLOG B3, Imp quest domain), project-authored: replicates
 * `Imp.Quest.spawn()`'s RNG sequence (`Imp.java`, tag `v3.3.8`) per seed WITHOUT
 * the room placement (that loop's draws depend on level geometry, which the port
 * places differently) and dumps the spawn depth, the depth-switched `alternative`
 * flag and every reward-ring roll, so the TypeScript trace can diff the port's
 * gate composition and `impQuestReward()` draw-for-draw.
 *
 * Per seed, on a freshly pushed generator: `Generator.fullReset()` (the deck state
 * the real game has at a fresh run; stream-position parity with mid-run creation is
 * explicitly out of scope, exactly like the ghost stage), then the exact `spawn()`
 * order: `Random.Int(20-depth)==0` gates over depths 17-19 (Int(1) at 19 always
 * spawns, so every seed yields a row), the depth switch (17 monks / 19 golems /
 * `Random.Int(2)==0` at 18), and `do { Generator.random(RING) } while (cursed)`
 * plus the draw-free `upgrade(2)`. The alternative flag and ring mechanics are
 * identical in the checkout oracle, so this runs there (with the S6 deck backport
 * for the post-`fullReset` deck order) - no v3.3.8-only harness needed.
 *
 * Headless like GhostRewardHarness: no hero or level state is touched (all rolls
 * are static deck/RNG calls), but the same invisible LWJGL3 launcher shape is kept
 * for the class static initializers. Output is JSONL.
 */
public class ImpRewardHarness {

	private static final long[] SEEDS = {
		1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L,
		11L, 12L, 13L, 14L, 15L, 16L, 17L, 18L, 19L, 20L,
		21L, 22L, 23L, 24L, 25L, 26L, 27L, 28L, 29L, 30L,
		31L, 32L, 33L, 34L, 35L, 36L, 37L, 38L, 39L, 40L
	};

	private static final int[] DEPTHS = {17, 18, 19};

	public static String captureOutput() {
		StringBuilder out = new StringBuilder();
		out.append("{\"tool\":\"parityImpReward-java\"}\n");
		int cases = 0;

		for (long seed : SEEDS) {
			try {
				out.append(impCase(seed)).append('\n');
				cases++;
			} catch (Throwable t) {
				out.append("{\"seed\":").append(seed)
					.append(",\"error\":\"")
					.append(String.valueOf(t).replace("\"", "'").replace("\\", "/"))
					.append("\"}\n");
			}
		}
		try {
			out.append(impCompletionCase()).append('\n');
		} catch (Throwable t) {
			out.append("{\"kind\":\"completion\",\"error\":\"")
				.append(String.valueOf(t).replace("\"", "'").replace("\\", "/"))
				.append("\"}\n");
		}
		out.append("{\"cases\":").append(cases).append("}\n");
		return out.toString();
	}

	/** Calls the actual `Imp.Quest.complete()` from v3.3.8 with a stored reward and seeded score. */
	private static String impCompletionCase() throws ReflectiveOperationException {
		Notes.reset();
		Imp.Quest.reset();
		Field spawned = Imp.Quest.class.getDeclaredField("spawned");
		spawned.setAccessible(true);
		spawned.setBoolean(null, true);
		Imp.Quest.reward = new RingOfMight();
		Statistics.questScores = new int[5];
		Statistics.questScores[3] = 1234;
		Imp.Quest.complete();
		return "{\"kind\":\"completion\",\"questScore\":" + Statistics.questScores[3]
			+ ",\"rewardCleared\":" + (Imp.Quest.reward == null)
			+ ",\"completed\":" + Imp.Quest.isCompleted() + "}";
	}

	private static String impCase(long seed) {
		Random.pushGenerator(seed);
		try {
			Generator.fullReset();

			int spawnDepth = 0;
			for (int depth : DEPTHS) {
				if (Random.Int(20 - depth) == 0) {
					spawnDepth = depth;
					break;
				}
			}

			boolean alternative = spawnDepth == 17 || (spawnDepth == 18 && Random.Int(2) == 0);

			Ring reward;
			do {
				reward = (Ring) Generator.random(Generator.Category.RING);
			} while (reward.cursed);
			reward.upgrade(2);

			return new StringBuilder()
				.append("{\"seed\":").append(seed)
				.append(",\"spawnDepth\":").append(spawnDepth)
				.append(",\"alternative\":").append(alternative)
				.append(",\"ringCls\":\"").append(reward.getClass().getSimpleName()).append("\"")
				.append(",\"ringLevel\":").append(reward.level())
				.append("}").toString();
		} finally {
			Random.popGenerator();
		}
	}
}
