package com.shatteredpixel.shatteredpixeldungeon.desktop;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3Application;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3ApplicationConfiguration;
import com.shatteredpixel.shatteredpixeldungeon.actors.mobs.DM300DamageHarness;

import java.io.FileWriter;
import java.io.PrintWriter;

/** Hidden GDX launcher for the project-authored DM300 damage trace. */
public final class DM300DamageHarnessLauncher extends ApplicationAdapter {
	@Override public void create() {
		try {
			com.watabou.noosa.Game.version = "harness";
			com.watabou.noosa.Game.versionCode = 1;
			String outFile = System.getenv().getOrDefault("DM300_DAMAGE_OUT", "dm300_damage_java_out.txt");
			try (PrintWriter writer = new PrintWriter(new FileWriter(outFile))) {
				writer.print(DM300DamageHarness.captureOutput());
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
		config.setTitle("DM300DamageHarness");
		config.setWindowedMode(64, 64);
		config.setInitialVisible(false);
		new Lwjgl3Application(new DM300DamageHarnessLauncher(), config);
	}
}
