package com.shatteredpixel.shatteredpixeldungeon.desktop;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3Application;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3ApplicationConfiguration;
import com.shatteredpixel.shatteredpixeldungeon.actors.mobs.GooPhaseHarness;

import java.io.FileWriter;
import java.io.PrintWriter;

/** Hidden GDX launcher for the project-authored Goo attack-phase trace. */
public final class GooPhaseHarnessLauncher extends ApplicationAdapter {
	@Override public void create() {
		try {
			com.watabou.noosa.Game.version = "harness";
			com.watabou.noosa.Game.versionCode = 1;
			String outFile = System.getenv().getOrDefault("GOO_PHASE_OUT", "goo_phase_java_out.txt");
			try (PrintWriter writer = new PrintWriter(new FileWriter(outFile))) {
				writer.print(GooPhaseHarness.captureOutput());
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
		config.setTitle("GooPhaseHarness");
		config.setWindowedMode(64, 64);
		config.setInitialVisible(false);
		new Lwjgl3Application(new GooPhaseHarnessLauncher(), config);
	}
}
