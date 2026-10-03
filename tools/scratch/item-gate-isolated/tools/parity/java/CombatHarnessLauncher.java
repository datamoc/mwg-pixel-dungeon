package com.shatteredpixel.shatteredpixeldungeon.desktop;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3Application;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3ApplicationConfiguration;
import com.shatteredpixel.shatteredpixeldungeon.actors.mobs.CombatHarness;

import java.io.FileWriter;
import java.io.PrintWriter;

/**
 * SCRATCH / THROWAWAY - boots a minimal invisible LWJGL3 context (some static
 * initializers need working Gdx.files/Gdx.gl) then runs CombatHarness for one
 * script/seed and writes its JSONL. Env: COMBAT_SCRIPT (2|3|4, default 4),
 * COMBAT_SEED (default 123456789), COMBAT_OUT (default combat_java_out.txt).
 * Not part of the game.
 */
public class CombatHarnessLauncher extends ApplicationAdapter {

	@Override
	public void create() {
		try {
			com.watabou.noosa.Game.version = "harness";
			com.watabou.noosa.Game.versionCode = 1;
			int script = Integer.parseInt(System.getenv().getOrDefault("COMBAT_SCRIPT", "4"));
			long seed = Long.parseLong(System.getenv().getOrDefault("COMBAT_SEED", "123456789"));
			String outFile = System.getenv().getOrDefault("COMBAT_OUT", "combat_java_out.txt");
			String out = CombatHarness.captureOutput(script, seed);
			try (PrintWriter w = new PrintWriter(new FileWriter(outFile))) {
				w.print(out);
			}
			System.out.println("HARNESS_OK, wrote " + outFile + " (" + out.length() + " chars)");
		} catch (Throwable t) {
			t.printStackTrace();
			try (PrintWriter w = new PrintWriter(new FileWriter("combat_java_error.txt"))) {
				t.printStackTrace(w);
			} catch (Exception ignored) {}
		} finally {
			Gdx.app.exit();
		}
	}

	public static void main(String[] args) {
		Lwjgl3ApplicationConfiguration config = new Lwjgl3ApplicationConfiguration();
		config.setTitle("CombatHarness");
		config.setWindowedMode(64, 64);
		config.setInitialVisible(false);
		new Lwjgl3Application(new CombatHarnessLauncher(), config);
		System.exit(0);
	}
}
