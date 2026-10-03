package com.shatteredpixel.shatteredpixeldungeon.actors.mobs;

import com.shatteredpixel.shatteredpixeldungeon.Dungeon;
import com.shatteredpixel.shatteredpixeldungeon.actors.Char;
import com.shatteredpixel.shatteredpixeldungeon.actors.buffs.Bless;
import com.shatteredpixel.shatteredpixeldungeon.actors.buffs.Buff;
import com.shatteredpixel.shatteredpixeldungeon.actors.buffs.Daze;
import com.shatteredpixel.shatteredpixeldungeon.actors.buffs.Hex;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.Hero;
import com.shatteredpixel.shatteredpixeldungeon.actors.hero.HeroClass;
import com.shatteredpixel.shatteredpixeldungeon.levels.Level;
import com.watabou.utils.Random;

import java.util.ArrayList;

/**
 * SCRATCH / THROWAWAY - headless Char.attack() driver for the TS port's combat
 * parity probe (BACKLOG B1 / T55). Boots a bare L1 Warrior and a Rat or Crab with
 * no sprites, buffs (except script-3 rounds), talents or gear, all-false heroFOV
 * (so no sprite/sound/message branches run), the mob woken to HUNTING (so nothing
 * is surprise-hit except scripted surprise rounds, via attacker.invisible), both
 * healed between rounds (per-round HP reset, so nothing ever dies), and captures
 * every raw RNG draw per round in the TracingRandom bits:value shape.
 *
 * Round lists mirror tools/parityCombatTrace.ts scripts 2-4 exactly (same order,
 * same magic/surprise/buff layout); damage is read as the defender's HP delta
 * ( Char.attack returns only hit/miss ). Construction happens BEFORE the seed
 * push (TS fighters are plain objects, zero draws) so the pushed generator is
 * the script's first draw on both sides.
 *
 * Usage: CombatHarness <script 2|3|4> <seed>  (JSONL on stdout)
 */
public class CombatHarness {

	public static void main(String[] args) {
		System.out.print(captureOutput(Integer.parseInt(args[0]), Long.parseLong(args[1])));
	}

	// { attackerIsHero, magic, surprise, attackerBuff, defenderBuff } per round.
	// Buffs are Bless/Hex/Daze simple names, "" for none.
	private static final Object[][] ROUNDS_2 = {
		{true,  false, false, "", ""},
		{false, false, false, "", ""},
		{true,  false, false, "", ""},
		{false, false, false, "", ""},
		{true,  true,  false, "", ""},
		{false, false, false, "", ""},
		{true,  false, true,  "", ""},
		{false, false, false, "", ""},
		{true,  false, false, "", ""},
		{false, false, false, "", ""},
	};

	private static final Object[][] ROUNDS_3 = {
		{true,  false, false, "", ""},
		{false, false, false, "", ""},
		{true,  false, false, "Bless", ""},
		{true,  false, false, "", "Hex"},
		{false, false, false, "Daze", ""},
		{false, false, false, "", "Hex"},
		{true,  false, false, "Bless", "Hex"},
		{false, false, false, "", ""},
		{true,  true,  false, "Bless", ""},
		{false, false, false, "", ""},
	};

	// Script 4: same shape as script 2, defender is a Crab (real armor path).
	private static final Object[][] ROUNDS_4 = ROUNDS_2;

	public static String captureOutput(int script, long seed) {
		Hero hero = new Hero();
		hero.heroClass = HeroClass.WARRIOR;
		// Headless: hit() calls defender.interrupt() on Heroes with damageInterrupt set;
		// that reaches into GameScene (UI) and NPEs. It burns no draws (pure UI reset),
		// so clearing it only removes the crash, not stream content.
		hero.damageInterrupt = false;
		Mob mob = script == 4 ? new Crab() : new Rat();

		Level level = new Level() {
			@Override protected boolean build() { return true; }
			@Override protected void createMobs() { }
			@Override protected void createItems() { }
		};
		level.setSize(4, 4);
		Dungeon.level = level;
		Dungeon.hero = hero;
		hero.pos = 0;
		mob.pos = 1;
		mob.state = mob.HUNTING;
		//HUNTING alone is not enough: Mob.defenseSkill(enemy) returns 0 while surprisedBy(hero), i.e. while
		//!enemySeen, so an "unaware" mob would have evasion 0 against the hero (found by the parity run: the TS
		//fighter's evasion 2 then diverged on any roll where the hero's draw fell below the mob's). A real fight
		//has the mob aware of its enemy, which is what the port models.
		mob.enemySeen = true;

		Random.traceDraws = true;
		Random.traceLog.setLength(0);
		Random.traceDrawCount = 0;
		Random.traceStackLo = -1;
		Random.traceStackHi = -1;
		Random.pushGenerator(seed);

		Object[][] rounds = script == 4 ? ROUNDS_4 : script == 3 ? ROUNDS_3 : ROUNDS_2;
		String mobId = script == 4 ? "crab-1" : "rat-1";

		StringBuilder out = new StringBuilder();
		out.append("{\"tool\":\"parityCombatTrace-java\",\"scriptVersion\":").append(script)
			.append(",\"seed\":\"").append(seed).append("\"}\n");

		int totalDraws = 0;
				for (int r = 0; r < rounds.length; r++) {
			boolean heroAttacks = (Boolean) rounds[r][0];
			boolean magic = (Boolean) rounds[r][1];
			boolean surprise = (Boolean) rounds[r][2];
			String atkBuff = (String) rounds[r][3];
			String defBuff = (String) rounds[r][4];

			Char attacker = heroAttacks ? hero : mob;
			Char defender = heroAttacks ? mob : hero;

			hero.HP = hero.HT;
			mob.HP = mob.HT;
			hero.invisible = 0;
			mob.invisible = 0;
			for (Buff b : hero.buffs()) b.detach();
			for (Buff b : mob.buffs()) b.detach();
			if (!atkBuff.isEmpty()) appendBuff(attacker, atkBuff);
			if (!defBuff.isEmpty()) appendBuff(defender, defBuff);

			if (surprise) attacker.invisible = 1;

			int mark = Random.traceLog.length();
			int hpBefore = defender.HP;
			// Magic rounds ride the real attack() with accMulti 2 (same full
			// dr/damage/defenseProc/damage path, doubled hit roll). Surprise
			// rounds take the infinite-accuracy path inside attack() (no hit
			// draws) via attacker.invisible (set above, never acted away).
			boolean hit = magic ? attacker.attack(defender, 1f, 0f, 2f)
					: attacker.attack(defender);
			int damage = hpBefore - defender.HP;
			if (!hit) damage = 0;

			ArrayList<String> draws = new ArrayList<>();
			String chunk = Random.traceLog.substring(mark);
			for (String line : chunk.split("\n")) {
				if (!line.isEmpty()) draws.add("\"" + line + "\"");
			}

			totalDraws += draws.size();
			out.append("{\"round\":").append(r)
				.append(",\"attacker\":\"").append(heroAttacks ? "hero-1" : mobId).append("\"")
				.append(",\"defender\":\"").append(heroAttacks ? mobId : "hero-1").append("\"")
				.append(",\"magic\":").append(magic)
				.append(",\"surprise\":").append(surprise)
				.append(",\"hit\":").append(hit)
				.append(",\"damage\":").append(damage)
				.append(",\"draws\":[").append(String.join(",", draws)).append("]");
			String ab = buffNames(attacker);
			String db = buffNames(defender);
			if (!ab.isEmpty()) out.append(",\"attackerBuffs\":[").append(ab).append("]");
			if (!db.isEmpty()) out.append(",\"defenderBuffs\":[").append(db).append("]");
			out.append("}\n");
		}

		out.append("{\"rounds\":").append(rounds.length)
			.append(",\"totalDraws\":").append(totalDraws).append("}\n");
		Random.popGenerator();
		Random.traceDraws = false;
		return out.toString();
	}

	private static void appendBuff(Char ch, String name) {
		if (name.equals("Bless")) Buff.append(ch, Bless.class);
		else if (name.equals("Hex")) Buff.append(ch, Hex.class);
		else if (name.equals("Daze")) Buff.append(ch, Daze.class);
		else throw new RuntimeException("unknown buff " + name);
	}

	private static String buffNames(Char ch) {
		ArrayList<String> names = new ArrayList<>();
		for (Buff b : ch.buffs()) {
			String n = b.getClass().getSimpleName().toLowerCase();
			names.add("\"" + n + "\"");
		}
		return String.join(",", names);
	}
}
