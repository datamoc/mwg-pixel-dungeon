package com.shatteredpixel.shatteredpixeldungeon.desktop;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3Application;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3ApplicationConfiguration;
import com.shatteredpixel.shatteredpixeldungeon.actors.mobs.npcs.GhostRewardHarness;

import java.io.FileWriter;
import java.io.PrintWriter;

/**
 * Parity harness launcher (BACKLOG B3, Ghost quest domain), project-authored: boots the
 * minimal invisible LWJGL3 context the real-class static initializers need, then runs
 * GhostRewardHarness. Env: GHOST_OUT (output file). Not part of the game.
 */
public class GhostRewardHarnessLauncher extends ApplicationAdapter {

	@Override
	public void create() {
		try {
			com.watabou.noosa.Game.version = "harness";
			com.watabou.noosa.Game.versionCode = 1;
			String outFile = System.getenv().getOrDefault("GHOST_OUT", "ghost_java_out.txt");
			String out = GhostRewardHarness.captureOutput();
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
		config.setTitle("GhostRewardHarness");
		config.setWindowedMode(64, 64);
		config.setInitialVisible(false);
		new Lwjgl3Application(new GhostRewardHarnessLauncher(), config);
	}
}
