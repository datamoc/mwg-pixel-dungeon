package com.shatteredpixel.shatteredpixeldungeon.desktop;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3Application;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3ApplicationConfiguration;
import com.shatteredpixel.shatteredpixeldungeon.levels.LevelGenHarness;

import java.io.FileWriter;
import java.io.PrintWriter;

/**
 * SCRATCH / THROWAWAY - boots a real (but minimal, invisible) LWJGL3 GL context so
 * LevelGenHarness's real-class static initializers (ItemSpriteSheet etc., which need a working
 * Gdx.files/Gdx.gl) succeed, then runs the harness, writes its dump to a file, and exits. Not
 * part of the game. Deleted after producing Phase 2 reference dumps.
 */
public class LevelGenHarnessLauncher extends ApplicationAdapter {

	@Override
	public void create() {
		try {
			com.watabou.noosa.Game.version = "harness";
			com.watabou.noosa.Game.versionCode = 1;
			String out = LevelGenHarness.captureOutput();
			try (PrintWriter w = new PrintWriter(new FileWriter("levelgen_java_dump.txt"))) {
				w.print(out);
			}
			System.out.println("HARNESS_OK, wrote levelgen_java_dump.txt (" + out.length() + " chars)");
		} catch (Throwable t) {
			t.printStackTrace();
			try (PrintWriter w = new PrintWriter(new FileWriter("levelgen_java_error.txt"))) {
				t.printStackTrace(w);
			} catch (Exception ignored) {}
		} finally {
			Gdx.app.exit();
		}
	}

	public static void main(String[] args) {
		Lwjgl3ApplicationConfiguration config = new Lwjgl3ApplicationConfiguration();
		config.setTitle("LevelGenHarness");
		config.setWindowedMode(64, 64);
		config.setInitialVisible(false);
		new Lwjgl3Application(new LevelGenHarnessLauncher(), config);
		System.exit(0);
	}
}
