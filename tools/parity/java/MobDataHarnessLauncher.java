package com.shatteredpixel.shatteredpixeldungeon.desktop;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3Application;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3ApplicationConfiguration;
import com.shatteredpixel.shatteredpixeldungeon.actors.mobs.MobDataHarness;

import java.io.FileWriter;
import java.io.PrintWriter;

/**
 * Parity harness launcher (BACKLOG B3 / coord T57), project-authored: boots the minimal invisible LWJGL3 context the
 * real-class static initializers need, then runs MobDataHarness. Env: MOBDATA_DIR (the `actors/mobs` source directory to
 * enumerate), MOBDATA_OUT (output file). Not part of the game.
 */
public class MobDataHarnessLauncher extends ApplicationAdapter {

	@Override
	public void create() {
		try {
			com.watabou.noosa.Game.version = "harness";
			com.watabou.noosa.Game.versionCode = 1;
			String dir = System.getenv().getOrDefault("MOBDATA_DIR", "core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/mobs");
			String outFile = System.getenv().getOrDefault("MOBDATA_OUT", "mobdata_java_out.txt");
			String out = MobDataHarness.captureOutput(dir);
			try (PrintWriter w = new PrintWriter(new FileWriter(outFile))) {
				w.print(out);
			}
			System.out.println("HARNESS_OK, wrote " + outFile + " (" + out.length() + " chars)");
		} catch (Throwable t) {
			t.printStackTrace();
		} finally {
			Gdx.app.exit();
		}
	}

	public static void main(String[] args) {
		Lwjgl3ApplicationConfiguration config = new Lwjgl3ApplicationConfiguration();
		config.setTitle("MobDataHarness");
		config.setWindowedMode(64, 64);
		config.setInitialVisible(false);
		new Lwjgl3Application(new MobDataHarnessLauncher(), config);
		System.exit(0);
	}
}
