package com.shatteredpixel.shatteredpixeldungeon.desktop;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3Application;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3ApplicationConfiguration;
import com.shatteredpixel.shatteredpixeldungeon.actors.mobs.npcs.WandmakerSpawnHarness;

import java.io.FileWriter;
import java.io.PrintWriter;

/** Hidden desktop launcher for the project-authored Wandmaker quest parity harness. */
public class WandmakerSpawnHarnessLauncher extends ApplicationAdapter {

	@Override
	public void create() {
		try {
			com.watabou.noosa.Game.version = "harness";
			com.watabou.noosa.Game.versionCode = 1;
			String outFile = System.getenv().getOrDefault("WANDMAKER_OUT", "wandmaker_java_out.txt");
			try (PrintWriter writer = new PrintWriter(new FileWriter(outFile))) {
				writer.print(WandmakerSpawnHarness.captureOutput());
			}
			System.out.println("HARNESS_OK, wrote " + outFile);
		} catch (Throwable t) {
			t.printStackTrace();
		} finally {
			Gdx.app.exit();
		}
	}

	public static void main(String[] args) {
		Lwjgl3ApplicationConfiguration config = new Lwjgl3ApplicationConfiguration();
		config.setTitle("WandmakerSpawnHarness");
		config.setWindowedMode(64, 64);
		config.setInitialVisible(false);
		new Lwjgl3Application(new WandmakerSpawnHarnessLauncher(), config);
	}
}
