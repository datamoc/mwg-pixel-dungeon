package com.shatteredpixel.shatteredpixeldungeon.actors.mobs.npcs;

import com.shatteredpixel.shatteredpixeldungeon.Dungeon;
import com.shatteredpixel.shatteredpixeldungeon.levels.rooms.Room;
import com.watabou.utils.Random;

import java.util.ArrayList;

/**
 * Project-authored parity harness for `Wandmaker.Quest.spawnRoom()`
 * (`Wandmaker.java`, tag `v3.3.8`). It starts both implementations from the same
 * seeded RNG state and stops as soon as the first quest room is appended, before
 * unrelated room generation can shift the quest's input stream. Output is JSONL.
 */
public class WandmakerSpawnHarness {

	public static String captureOutput() {
		StringBuilder out = new StringBuilder();
		out.append("{\"tool\":\"parityWandmakerSpawn-java\"}\n");
		int cases = 0;
		for (long seed = 1; seed <= 40; seed++) {
			Random.pushGenerator(seed);
			try {
				Wandmaker.Quest.reset();
				int spawnDepth = 0;
				int type = 0;
				for (int depth = 7; depth <= 9; depth++) {
					Dungeon.depth = depth;
					ArrayList<Room> rooms = new ArrayList<>();
					Wandmaker.Quest.spawnRoom(rooms);
					type = questType();
					if (!rooms.isEmpty()) {
						spawnDepth = depth;
						break;
					}
				}
				out.append("{\"seed\":").append(seed)
					.append(",\"spawnDepth\":").append(spawnDepth)
					.append(",\"type\":").append(type).append("}\n");
				cases++;
			} catch (Throwable t) {
				out.append("{\"seed\":").append(seed)
					.append(",\"error\":\"")
					.append(String.valueOf(t).replace("\"", "'").replace("\\", "/"))
					.append("\"}\n");
			} finally {
				Random.popGenerator();
			}
		}
		out.append("{\"cases\":").append(cases).append("}\n");
		return out.toString();
	}

	private static int questType() throws ReflectiveOperationException {
		java.lang.reflect.Field field = Wandmaker.Quest.class.getDeclaredField("type");
		field.setAccessible(true);
		return field.getInt(null);
	}
}
