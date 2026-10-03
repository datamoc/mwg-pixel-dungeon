package com.shatteredpixel.shatteredpixeldungeon.levels;

import com.shatteredpixel.shatteredpixeldungeon.Dungeon;
import com.shatteredpixel.shatteredpixeldungeon.items.Generator;
import com.shatteredpixel.shatteredpixeldungeon.items.potions.Potion;
import com.shatteredpixel.shatteredpixeldungeon.items.rings.Ring;
import com.shatteredpixel.shatteredpixeldungeon.items.scrolls.Scroll;
import com.shatteredpixel.shatteredpixeldungeon.levels.rooms.Room;
import com.shatteredpixel.shatteredpixeldungeon.levels.rooms.secret.SecretRoom;
import com.shatteredpixel.shatteredpixeldungeon.levels.rooms.special.SpecialRoom;
import com.shatteredpixel.shatteredpixeldungeon.levels.rooms.standard.StandardRoom;
import com.watabou.utils.Random;

import java.util.ArrayList;

/**
 * SCRATCH / THROWAWAY - Phase 2 verification harness for the web-mwg SPD level-gen port.
 * Not part of the game; deleted after producing reference dumps. Do not wire into the real game.
 *
 * Mirrors Dungeon.init()'s run-level RNG setup (seed+1 generator, label/color/gem shuffle burns,
 * SpecialRoom/SecretRoom.initForRun(), Wandmaker.Quest.reset(), Generator.fullReset()) then
 * Level.create()'s per-floor sequence (seedForDepth -> pushGenerator -> feeling roll -> build())
 * for Sewers depths 1-4 and Prison depths 7-9, skipping createMobs()/createItems() and the
 * pre-feeling item-spawn block (neither touches the level generator's own stream once
 * Generator.fullReset() has set each deck category's substream seed - see spdRng.ts's
 * pushRunInitGenerator() doc for the matching TS-side reasoning), so the dump reflects exactly
 * what web-mwg/src/spdLevelGen/ currently ports: room graph + full paint.
 *
 * The depth sequence is 1,2,3,4,5,6,7,8,9. Depth 6 needs a Dungeon.hero for ShopRoom's
 * ChooseBag()/the hourglass check, so this harness builds one below (used from depth 5 onward,
 * since it costs nothing to construct early). Depth 5 (SewerBossLevel) IS included - it extends
 * SewerLevel, i.e. RegularLevel, not Level directly (confirmed by reading the real source; an
 * earlier revision of this comment had that backwards) - its initRooms()/painter() are simply
 * overridden with boss-specific room types (GooBossRoom/RatKingRoom, entrance/exit variants) and
 * parameters. It does not touch SecretRoom's budget, the SpecialRoom queue, Generator's decks or
 * Wandmaker's state either way (its initRooms() bypasses all of that machinery), so including it
 * doesn't perturb depths 6+.
 */
public class LevelGenHarness {

	public static void main(String[] args) {
		System.out.print(captureOutput());
	}

	public static String captureOutput() {
		long[] seeds = {123456789L, 1L, 42L, 999999999999L};
		int[] depths = {1, 2, 3, 4, 5, 6, 7, 8, 9};

		StringBuilder out = new StringBuilder();

		for (long seed : seeds) {
			Dungeon.seed = seed;

			// Dungeon.init()'s real run-level generator: seed+1, then Scroll.initLabels()/
			// Potion.initColors()/Ring.initGems() (each an ItemStatusHandler construction burning
			// one Random.Int(labelsLeft.size()) per item class), then SpecialRoom/SecretRoom.
			// initForRun(), then Generator.fullReset() (sets each deck category's own substream
			// seed so later Generator.random() calls made during real gameplay never touch the
			// level generator - not exercised by this harness since it skips item spawning
			// entirely, matching the TS port's current scope). Requires a real Gdx.files/Gdx.gl
			// context (see LevelGenHarnessLauncher) since these classes' static initializers load
			// ItemSpriteSheet.
			Random.pushGenerator(seed + 1);
			Scroll.initLabels();
			Potion.initColors();
			Ring.initGems();
			SpecialRoom.initForRun();
			SecretRoom.initForRun();
			// Dungeon.init() also resets the Wandmaker quest's run-level state (spawned/type).
			// Costs no RNG, so its position in this sequence doesn't matter.
			com.shatteredpixel.shatteredpixeldungeon.actors.mobs.npcs.Wandmaker.Quest.reset();
			Generator.fullReset();
			Random.popGenerator();

			// Dungeon.init() continues past its seeded block with LimitedDrops.reset() and then
			// builds the hero (Dungeon.java:258-272) - all AFTER Random.resetGenerators(), so
			// none of it can shift any level's stream. ShopRoom.generateItems() nonetheless
			// dereferences Dungeon.hero.belongings, so depth 6 needs a hero to exist.
			//
			// A bare Hero (empty backpack) is used deliberately rather than running
			// HeroClass.initHero(), which reaches into Talent/Badges/quickslot UI state this
			// harness has no business booting. It costs no fidelity: ChooseBag() makes no
			// Random call at all, so backpack contents can only change WHICH bag class it
			// returns, never whether one is returned - and every bag is just "one more item" to
			// placeItems(). What does matter is the velvet-pouch flag, which initHero() always
			// drops, so it is set explicitly here.
			Dungeon.LimitedDrops.reset();
			Dungeon.LimitedDrops.VELVET_POUCH.drop();
			Dungeon.hero = new com.shatteredpixel.shatteredpixeldungeon.actors.hero.Hero();

			for (int depth : depths) {
				Dungeon.depth = depth;
				Dungeon.branch = 0;

				RegularLevel level = depth == 5 ? new SewerBossLevel() : depth <= 5 ? new SewerLevel() : new PrisonLevel();

				// RNG-call-order parity facility (see Random.traceDraws): with
				// -Dlevelgen.trace=true, every raw draw between the floor push and pop
				// lands in desktop/levelgen_trace_<seed>_<depth>.txt as `bits:value`
				// lines for the TypeScript probe to diff. Off by default.
				// Also readable as the LEVELGEN_TRACE env var: desktop/build.gradle's
				// runHarness task does not forward -D system properties to the forked
				// JVM, but does inherit the parent process's environment, so the env
				// var is what a plain `gradlew runHarness` invocation can set without
				// editing the build script.
				boolean trace = Boolean.getBoolean("levelgen.trace") || "true".equals(System.getenv("LEVELGEN_TRACE"));
				Random.traceDraws = trace;
							Random.traceDrawCount = 0;
			Random.traceStacks.setLength(0);
			Random.traceStackLo = -1;
			Random.traceStackHi = -1;
			// Scratch call-site attribution: LEVELGEN_STACKWIN="seed:depth:lo-hi" captures
			// stacks for one floor's draws into levelgen_stacks_<seed>_<depth>.txt.
			String stackWin = System.getenv("LEVELGEN_STACKWIN");
			if (trace && stackWin != null) {
				String[] winParts = stackWin.split(":");
				if (winParts.length == 4 && Long.parseLong(winParts[0]) == seed && Integer.parseInt(winParts[1]) == depth) {
					Random.traceStackLo = Integer.parseInt(winParts[2]);
					Random.traceStackHi = Integer.parseInt(winParts[3]);
				}
			}
if (System.getenv("PLACE_DEBUG") != null) System.err.println("FLOOR seed=" + seed + " depth=" + depth);
Random.pushGenerator(Dungeon.seedCurDepth());


				int feelingRoll = -1;
				if (depth > 1) {
					feelingRoll = Random.Int(14);
					switch (feelingRoll) {
						case 0: level.feeling = Level.Feeling.CHASM; break;
						case 1: level.feeling = Level.Feeling.WATER; break;
						case 2: level.feeling = Level.Feeling.GRASS; break;
						case 3: level.feeling = Level.Feeling.DARK; break;
						case 4: level.feeling = Level.Feeling.LARGE; break;
						case 5: level.feeling = Level.Feeling.TRAPS; break;
						case 6: level.feeling = Level.Feeling.SECRETS; break;
						default: level.feeling = Level.Feeling.NONE; break;
					}
				}

				int attempts = 0;
				boolean ok;
				do {
					attempts++;
					level.transitions = new java.util.ArrayList<>();
					level.mobs = new java.util.HashSet<>();
					level.heaps = new com.watabou.utils.SparseArray<>();
					level.blobs = new java.util.HashMap<>();
					level.plants = new com.watabou.utils.SparseArray<>();
					level.traps = new com.watabou.utils.SparseArray<>();
					level.customTiles = new java.util.HashSet<>();
					level.customWalls = new java.util.HashSet<>();
					ok = level.build();
				} while (!ok);

				Random.popGenerator();
				if (trace) {
					Random.traceDraws = false;
					try {
						java.io.FileWriter w = new java.io.FileWriter("levelgen_trace_" + seed + "_" + depth + ".txt");
						w.write(Random.traceLog.toString());
						w.close();
					} catch (java.io.IOException e) { throw new RuntimeException(e); }
					Random.traceLog.setLength(0);
				if (Random.traceStacks.length() > 0) {
					try {
						java.io.FileWriter w2 = new java.io.FileWriter("levelgen_stacks_" + seed + "_" + depth + ".txt");
						w2.write(Random.traceStacks.toString());
						w2.close();
					} catch (java.io.IOException e) { throw new RuntimeException(e); }
				}
				}

				out.append(dump(seed, depth, feelingRoll, level, attempts));
				out.append("\n\n");
			}
		}

		return out.toString();
	}

	private static final char[] CHAR_BY_TERRAIN = buildCharMap();

	private static char[] buildCharMap() {
		// Terrain ids go up to ~60; index by id, default '?' for anything unmapped so mismatches
		// are visible rather than silently mis-rendered.
		char[] map = new char[128];
		java.util.Arrays.fill(map, '?');
		map[Terrain.CHASM] = ' ';
		map[Terrain.EMPTY] = '.';
		map[Terrain.GRASS] = '"';
		map[Terrain.HIGH_GRASS] = '"';
		map[Terrain.EMPTY_WELL] = 'w';
		map[Terrain.WALL] = '#';
		map[Terrain.DOOR] = '+';
		map[Terrain.OPEN_DOOR] = '+';
		map[Terrain.ENTRANCE] = '<';
		map[Terrain.EXIT] = '>';
		map[Terrain.EMBERS] = '~';
		map[Terrain.LOCKED_DOOR] = 'L';
		map[Terrain.PEDESTAL] = 'P';
		map[Terrain.WALL_DECO] = '%';
		map[Terrain.BARRICADE] = 'X';
		map[Terrain.EMPTY_SP] = ',';
		map[Terrain.SECRET_DOOR] = '+';
		map[Terrain.SECRET_TRAP] = '^';
		map[Terrain.TRAP] = '^';
		map[Terrain.INACTIVE_TRAP] = '^';
		map[Terrain.EMPTY_DECO] = ',';
		map[Terrain.SIGN] = 's';
		map[Terrain.WELL] = 'W';
		map[Terrain.STATUE] = '@';
		map[Terrain.STATUE_SP] = '@';
		map[Terrain.BOOKSHELF] = 'B';
		map[Terrain.ALCHEMY] = 'A';
		map[Terrain.CRYSTAL_DOOR] = 'C';
		map[Terrain.WATER] = '~';
		map[Terrain.LOCKED_EXIT] = 'V';
		return map;
	}

	private static String dump(long seed, int depth, int feelingRoll, RegularLevel level, int attempts) {
		StringBuilder sb = new StringBuilder();
		ArrayList<Room> rooms = level.rooms();
		int doorPairs = 0;
		for (Room r : rooms) doorPairs += r.connected.size();

		sb.append("seed=").append(seed).append(" depth=").append(depth)
				.append(" attempts=").append(attempts)
				.append(" feelingRoll=").append(feelingRoll)
				.append(" feeling=").append(level.feeling)
				.append(" rooms=").append(rooms.size())
				.append(" traps=").append(level.traps.valueList().size())
				.append("\n");

		ArrayList<String> kinds = new ArrayList<>();
		for (Room r : rooms) kinds.add(r.getClass().getSimpleName());
		java.util.Collections.sort(kinds);
		sb.append("  room kinds: ").append(String.join(", ", kinds)).append("\n");

		// Room rectangles, sorted, to separate graph-stage fidelity from paint-stage fidelity.
		ArrayList<String> rects = new ArrayList<>();
		for (Room r : rooms) rects.add(r.left + "," + r.top + "," + r.right + "," + r.bottom);
		java.util.Collections.sort(rects);
		sb.append("  room rects: ").append(String.join(" ", rects)).append("\n");
		// Graph-stage triage detail (ignored by the TS probe parser): builder class and
		// every room in PLACEMENT order (level.rooms() order) as class:sizeCat:rect.
		// sizeCat is "-" for non-standard rooms. Lets the TS side diff the exact step at
		// which a same-kinds/different-layout block diverges (seed 42 depth 8).
		sb.append("DIAG builder: ").append(level.builder.getClass().getSimpleName()).append("\n");
		ArrayList<String> detail = new ArrayList<>();
		for (Room r : rooms) {
			String sc = (r instanceof StandardRoom) ? ((StandardRoom) r).sizeCat.name() : "-";
			detail.add(r.getClass().getSimpleName() + ":" + sc + ":" + r.left + "," + r.top + "," + r.right + "," + r.bottom);
		}
		sb.append("DIAG rooms: ").append(String.join(" ", detail)).append("\n");


		for (int y = 0; y < level.height(); y++) {
			sb.append("  ");
			for (int x = 0; x < level.width(); x++) {
				int t = level.map[x + y * level.width()];
				char c = (t >= 0 && t < CHAR_BY_TERRAIN.length) ? CHAR_BY_TERRAIN[t] : '?';
				sb.append(c);
			}
			sb.append("\n");
		}
		return sb.toString();
	}
}
