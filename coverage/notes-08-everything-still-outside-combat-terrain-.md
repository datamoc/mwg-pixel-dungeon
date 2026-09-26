# Port coverage notes: Everything still outside combat/terrain/dungeon structure

Historical audit narrative (closed). Row tables live in `rows-*.md`. Closed points only: every row here is Ported, Simplified (with its stated reduction) or a Divergence (deliberate). Open work lives in `ROADMAP.md` and `BACKLOG.md`; a row that still carries a residual points to its `ROADMAP.md` R-number. New rows go into the file whose area matches, appended at the end; do not add them to `PORT_COVERAGE.md`.

## Everything still outside combat/terrain/dungeon structure


The Bulk armor curse is now live: while standing in a door, the shared action-cost model applies
Java's threefold speed increase. Metabolism is also live (**correction, 2026-09-22, ACP audit-01
#496/finding AF**: the hunger price was inverted - `Metabolism.proc()` calls
`hunger.affectHunger(healing * -10)`, and `affectHunger` subtracts its argument, so the curse
makes the hero HUNGRIER by 10x the healing (capped at `STARVING`), never while already starving;
what stood here instead satiated the hero by the same amount, making the "curse" a pure benefit
with no cost - now charges hunger instead of feeding it). Anti-Entropy now applies its 1-in-8
burning retaliation and dazes adjacent creatures; exact freezing-blob terrain interaction and
visual effects remain simplified.
Dazzling now applies its 1-in-10 impairment burst to the hero when the hero can actually see the
defender (10 turns, and 5 for every other visible creature), resolving on the hero's own swings; the
port uses timed daze in place of Java's separate blindness status, and the old third effect -
dispelling the hero's invisibility - was wrong and is gone (that line belongs to Annoying).
Stench now seeds Java's `ToxicGas` at 250 volume on the wearer's cell; only FetidRat's
`defenseProc` seeds the distinct `StenchGas` blob, which applies the short paralysis effect.
**Correction 2026-09-22 (ACP #338):** `Acidic.defenseProc`'s adjacent-attacker ooze had no
defender-side handler (hitting an acidic never oozed back) - it now lands in the same seam.
Corrosion now applies its 1-in-10 adjacent ooze burst as a real `ooze` buff (20 turns,
announced, own status icon) - CausticSlime/Acidic/FetidRat procs feed it too, no longer the
shared `poison` (real Poison sources - darts, sorrowmoss, venom, bleeds-as-poison - correctly
stay put). Ticks are `Ooze.act()`'s own depth curve (`1+depth/5` past 5, 1 at 5, coin-flip 1
in the Sewers, RESISTS-scaled for the hero) with the real `ondeath` line, and standing water
washes it off after the tick like Burning; duration refreshes rather than `extend()`-stacking,
and intensity is flat. The splash presentation is not modeled.
Displacement now has Java's 1-in-20 incoming-hit proc, relocating the hero to a free passable
cell and negating that hit. **Correction 2026-09-17:** destinations are no longer uniformly unchecked - every random teleport shares `randomFreeCell`'s Java `randomRespawnCell` constraints (passable, unoccupied, outside the hero's FOV, secret cells refused, pits refused), pinned in `simulation/teleport`; what stays simplified is the scroll's own unseen-room preference and LARGE/`openSpace`.
Displacing's outgoing weapon-curse proc now also refuses `IMMOVABLE` targets, matching
`Weapon.Enchantment.proc`'s Java property gate; the former comment claiming that property was
unmodeled was stale.
Multiplicity now duplicates a non-boss attacking monster into a free adjacent cell on Java's
1-in-20 proc; hero mirror images and exact actor-copy state are not represented. **Corrected
2026-09-12:** "non-boss" was this port's own hand-written list of the six bosses, which omitted
every `MINIBOSS` Java also refuses to copy (`Multiplicity.java` 82-84 also excludes `Mimic`,
`Statue` and `NPC`) - so a Pylon, GreatCrab, FetidRat, GnollTrickster, DemonSpawner, RotHeart,
RotLasher or the newborn elemental could be duplicated. The guard now reads the real `boss`/
`miniboss` flags plus the base-kind chain for Mimic/Statue, and is browser-verified live (7 rat
copies over 400 swings; zero for a Pylon or a GreatCrab). Java does not merely skip in those
cases - it substitutes `Dungeon.level.createMob()`, a random floor mob - which is still not
modelled here, so an excluded attacker goes un-duplicated instead.
Overgrowth now creates and immediately activates a supported plant on its 1-in-20 proc; the
seed choice is uniform over the supported plant set rather than Java Generator's weighted table.
Annoying now uses its 1-in-20 proc to alert every active monster through the persisted
`seesHero` target state and dispels hero invisibility (on the hero's own swings - a monster's attack
no longer triggers it); Java's message/sound variants remain UI gaps. Explosive's detonation now
matches `Bomb.explode` at the cell nearest the attacker, hero included, and Wayward's real
`1/4 x arcana` toggle of a 10-turn `WaywardBuff` (a 5x accuracy cut) replaces the old flat -3.

(open residual moved to `ROADMAP.md` R039)
