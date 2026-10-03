package com.shatteredpixel.shatteredpixeldungeon.desktop;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3Application;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3ApplicationConfiguration;
import com.shatteredpixel.shatteredpixeldungeon.actors.mobs.YogDamageHarness;

import java.io.FileWriter;
import java.io.PrintWriter;

/** Hidden GDX launcher for the project-authored Yog damage parity harness. */
public final class YogDamageHarnessLauncher extends ApplicationAdapter {
	@Override public void create() {
		try {
			com.watabou.noosa.Game.version = "harness";
			com.watabou.noosa.Game.versionCode = 1;
			String output = System.getenv().getOrDefault("YOG_DAMAGE_OUT", "yog_damage_java_out.txt");
			try (PrintWriter writer = new PrintWriter(new FileWriter(output))) { writer.print(YogDamageHarness.captureOutput()); }
			System.out.println("HARNESS_OK, wrote " + output);
		} catch (Throwable t) { t.printStackTrace(); }
		finally { Gdx.app.exit(); }
	}
	public static void main(String[] args) {
		Lwjgl3ApplicationConfiguration config = new Lwjgl3ApplicationConfiguration();
		config.setTitle("YogDamageHarness");
		config.setWindowedMode(64, 64);
		config.setInitialVisible(false);
		new Lwjgl3Application(new YogDamageHarnessLauncher(), config);
	}
}
