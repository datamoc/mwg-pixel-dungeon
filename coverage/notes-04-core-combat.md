# Port coverage notes: Core combat (`actors/Char.java`)

Historical audit narrative (closed). Row tables live in `rows-*.md`. Closed points only: every row here is Ported, Simplified (with its stated reduction) or a Divergence (deliberate). Open work lives in `ROADMAP.md` and `BACKLOG.md`; a row that still carries a residual points to its `ROADMAP.md` R-number. New rows go into the file whose area matches, appended at the end; do not add them to `PORT_COVERAGE.md`.

## Core combat (`actors/Char.java`)

`useFireblastWand` (`src/items/wandEffects.ts`) skips a `magicImmune` victim outright (no damage, no
burning/cripple/paralysis), matching `Char.damage()`'s generic `isImmune(srcClass)` zero-out; the
cone's own terrain fire still seeds around the immune target as normal, since RESISTS is about the
character, not the environment. **Three of the weapon-enchant-proc entries are wired too, same
day**: `Grim` (the `attack()`-central execute bonus) and `Blazing` (ignite + burn damage) now skip
entirely when `defender.magicImmune`; `Shocking`'s arc needed the opposite shape - the *original*
defender is already excluded from the chain for an unrelated reason (Java's own arc never touches
it), so gating on `defender.magicImmune` would have been wrong (it would cancel an arc that never
even reaches that defender) - the real per-target check now lives in `shockingArc`'s own damage
loop, skipping any *chain* target that is `magicImmune`, exactly where Java's `hit.damage(dmg,
Shocking.class)` would zero it.
**The reachable rest of RESISTS is now closed too, 23 of ~35 entries total.** `GrimTrap`
(`triggerTrapAt`'s `'grim'` case) now passes `magical: true` to `absorbHeroDamage`, so the hero's
own AntiMagic glyph gets its real partial `drRoll()` reduction against it - previously silently
omitted for this one trap kind while every other magical source used the flag correctly.
**Found and fixed a leftover asymmetry in this same entry, 2026-09-15**: that hero-side gate had
no equivalent on `triggerMobTrapAt`'s own `'grim'` branch (an ordinary monster - including an
AntiMagic champion - stepping on a Grim trap), which dealt its full damage unconditionally. An
AntiMagic champion caught on a Grim trap now takes none of its damage, matching `Char.damage()`'s
`RESISTS` zero-out; the trap still triggers and spends itself normally either way (Java only
zeroes the damage assignment, not the trigger itself). `tsc`/`build`/all suites green; no browser
verification this pass (no live AntiMagic-champion-on-a-Grim-trap encounter staged). The
shared wand-zap loop (`blastWave`/`disintegration`/`frost`/`lightning`/`livingEarth`/
`magicMissile`/`prismaticLight`, all seven RESISTS-listed) now skips a `magicImmune` victim's
damage assignment entirely - `corrosion`/`corruption` are deliberately excluded from that guard
since neither is a RESISTS member. `useTransfusionWand`'s undead-damage branch,
`scrollRetribution`'s blast (`scrollEffects.ts`), `takeWardTurn`'s own zap (`WandOfWarding.Ward`),
and `Bomb.MagicalBomb` (`ArcaneBomb`/`HolyBomb` - both the shared base blast every bomb type runs
through and each one's own bonus effect, gated by `variant` before the payload switch since the
base-blast loop runs before the per-payload one) complete the set. **Genuinely not applicable, not merely unguarded** - no code exists to add a guard to:
`ScrollOfPsionicBlast` (unported exotic scroll; the exotic-scroll recipes were decided Not
ported 2026-09-29 under R082, so no guard target can arise - R017 closed as a non-gap
2026-10-01), `CursedWand` (**correction 2026-09-21**: a real, if scoped, cursed-wand mechanic now exists - see its own dedicated row. None of its ported Common effects apply raw `Char.damage()`-equivalent hp loss directly (buffs only, or damage routed through `fireWandShot`'s own existing guard), so none needed a new guard; the Uncommon tier's `HealthTransfer` does write damage directly and is now `magicImmune`-gated, closing what this note used to flag), `ElementalBlast`/
(open residual moved to `ROADMAP.md` R018) `ElementalStrike` ported 2026-09-19 with its strike/grim damage routed through the guard below), `DisintegrationTrap` (this
port's five hidden trap kinds don't include one). **Left deliberately unguarded**: the six
monster-bolt entries (DM100/Shaman/Warlock/Eye/YogFist x2) - real Java's generic `isImmune()` only
returns true when the *target*'s own buffs/properties list the class, which never happens for the
hero (who gets the separate, already-correct partial `drRoll()` reduction instead, via the hero's
armor glyph rather than the `ChampionEnemy.AntiMagic` buff these bolts actually check against); an
ally could theoretically need this but champions never roll on ally spawns, so it cannot occur in
current play - a guard there would be untestable dead code. **A third stale sentence in this same row, found while
checking the other two**: "Blazing's `detach()` seeding fire around itself on death is still not
ported" is also wrong now - `kill()`'s champion-death hook (the eight-neighbour
`this.fire.seed(x, y, 2)` sweep, gated on the same flying-over-a-pit suppression Java uses) already
does this, and the dedicated `ChampionEnemy.Blazing.detach()` row further down this file already
says so correctly; only this row's own older sentence was never updated. Verified headlessly
(`tools/scratch/antimagic-champion-check.mjs`, 13 assertions, and
`tools/scratch/fireblast-magicimmune-check.mjs`, 4 assertions): a `magicImmune` creature refuses
all six listed buffs while an ordinary one still accepts them, `magicImmune` does not block an
unrelated buff (`burning`) from attaching in general, and a `magicImmune` target takes zero damage
and no burn/cripple/paralysis from `WandOfFireblast` specifically while an ordinary target still
does - `tsc`/`build`/all suites green throughout. The Grim/Blazing/Shocking guards live inside
`DungeonScene`'s own attack-resolution methods, which have no standalone headless harness the way
`wandEffects.ts`'s injectable-context functions do, so those three are `tsc`/`build`/suite-verified
only this pass; browser verification (an actual `antimagic`-champion monster failing to be
Weakened, shrugging off a cast Fireblast, and taking no bonus Grim/Blazing/Shocking proc damage,
in a live run) owed per ROADMAP.md section 10.
**A fourth, more consequential correction, 2026-09-14: "the by-depth exclusions are now ported
too" (Crab/Thief/Guard/Bat can't become champions below depths 3/4/7/9) was never real Java
behaviour at all - it was invented and then documented as a verified port.** Re-fetched
`ChampionEnemy.java`'s full `rollForChampion(Mob m)` body and `Level.java`'s `createMob()` (its
only caller): neither contains any `instanceof`/kind/depth check whatsoever - every mob drawn
from the floor rotation is equally eligible, at every depth. Java's real gate is a **resettable
countdown**, `Dungeon.mobsToChampion` (reset to 8 whenever it reaches 0, decremented on every
eligible spawn, assigning a champion exactly when it hits 0 with the challenge active) - not the
"flat 10% roll" this row's own text above still called the accepted remaining approximation.
Fixed both at once: `rollForChampion` (new, `actors/monsterSpawn.ts`) reproduces the exact
countdown rule with no exclusion of any kind, `mobsToChampion` is now real per-run scene state
(`DungeonScene.mobsToChampion`, persisted in `SaveShape`, restored on load - 0 on a fresh run,
matching Java's own zero-valued static field, which this port's rule already treats as
"reset to 8 on first use"), and the depth/kind exclusion branch is deleted outright rather than
kept as a still-claimed-real simplification. **Lesson, same shape as the Test Subject/Tested
Hypothesis one already recorded above: re-verify a "found and fixed, matches Java" claim against
the actual current source before extending or trusting it forward - this one had been sitting as
verified for two days.** Verified headlessly (`tools/scratch/champion-counter-check.mjs`, 4
assertions): the challenge being off never assigns a champion but still advances the counter
(matching Java's own RNG-order comment); the challenge being on assigns exactly the 8th, 16th and
24th eligible spawn in a 24-call run, not a probability; a save-restored mid-sequence counter (3)
correctly needs only two more spawns rather than resetting to eight; the assigned type is always
one of the real six. `tsc`/`build`/all suites green.
`tools/scratch/champion-roll-livecheck.mjs` (browser-only, unavailable this session) still
asserts the old ~10%-with-exclusions shape and is annotated with what a future browser pass
should assert instead (`champions === 37` of 300, no exclusion checks) rather than silently left
to mislead the next reader.
**Correction, 2026-09-15: the "fourth correction" immediately above (deleting the by-depth
exclusion outright, and flattening the interval to a plain reset-to-8) was itself wrong, and the
code has already moved past it without this row being updated to say so.** `src/actors/
monsterSpawn.ts`'s current `rollForChampion` (re-checked directly, not from memory of the
paragraph above) restores both halves that paragraph removed: `championExcluded` still blocks
Crab/Thief/Guard/Bat below depths 3/4/7/9 (`GreatCrab`/`Bandit` inheriting via `baseKind`,
matching Java's `instanceof` subclassing), and a successful assignment adds back `8 - min(20,
scalingDepth()-1)/10` rather than a flat `8` - the real interval shrinking from 8 to 6 as depth
rises from 1 to 201+, per `ChampionEnemy.java`'s exact formula. The function's own header comment
already narrates why: a still-earlier pass, the same day as the "fourth correction", had misread
the mechanic from this checkout's plain working-tree `ChampionEnemy.java` (which sits near
`v2.1.4`) instead of `git show refs/tags/v3.3.8:...`, and both the exclusion-removal and the
flat-8 interval were regressions from that misread, caught and reverted before being reported as
done - `tools/scratch/champion-counter-check.mjs` was written against an interim two-argument
`rollForChampion(counter, active)` shape from partway through that back-and-forth and is stale
against the current four-argument signature (`mobsToChampion, challengeActive, excluded,
depth`); it is not part of `npm run verify` and was not updated this pass, but should not be read
as describing current behaviour. **Lesson, worth stating plainly since this is the second time
this exact row has self-corrected a self-correction: when this checkout's local
shattered-pixel-dungeon working tree and a tagged ref disagree, the tagged ref is authoritative
for this port's target version - a bare path read without `git show refs/tags/<tag>:<path>` can
silently return the wrong game version's behaviour.** No new browser verification was run this
pass; the claim above is sourced from re-reading the current TypeScript directly, which is
authoritative for "what the code does now" independent of any run history.
**"No visual treatment exists for any champion type" is now closed too, same day.** `ChampionEnemy
.fx()`'s real `target.sprite.aura(color)` is a persistent glow-ring primitive this port's
`TintedSprite` has no equivalent for (only a flat `tint`/`setColorAdd`); `spawnMonster` now
applies a flat `sprite.tint` in the buff's own real colour (`CHAMPION_TINT`, all six values from
`ChampionEnemy.java`'s own declaration order) as the practical stand-in, the same shape this file
already reaches for elsewhere (an armed noisemaker's `sprite.tint = 0xff4444`). `tsc`/`build`/all
suites green; browser verification (a spawned champion actually showing its real colour, not just
the tint assignment compiling) owed per ROADMAP.md section 10. |


**Verification (first pass, 2026-09-24): `npx tsc --noEmit` and `npm run build` clean, `verifySimulation.mjs`'s 295 checks unaffected. Browser-verified live 2026-09-24** (no `claude-in-chrome`/`chrome-devtools-mcp` was reachable in this session, so this used a scripted `playwright-core` client driving the pre-installed sandbox Chromium directly against a built `dist/` served over `http://localhost`, the same pointer-event dance this file's other live-verification entries describe): started a real run as Warrior, reached the in-game scene, then via `window.__MWG__.currentScene` gave the hero the Amulet and set `depth = 26` - `tryAscendStairs()` opened the real `Ascension` confirmation window with Java's exact `ascent_title`/`ascent_desc`/`ascent_yes`/`ascent_no` text; clicking "Continue!" set `ascensionChallengeActive = true` and advanced to depth 25; 24 further `beginAscendOneFloor()` calls walked depth 25 down to depth 1 one floor at a time with no error; one more call from depth 1 set `gameOver = true` and rendered the real `Victory!` panel ("You escaped with the Amulet at level 1, depth 1!", "Let's call it a day" log line, "New Run" button) - confirming the full pickup -> confirm -> climb -> win state chain fires end to end with no dead end or unhandled state.

**Full unassisted floor-by-floor run, 2026-09-25 (Warrior):** everything above verified the state *chain* (teleporting between depths, hand-driving individual transition calls); this pass instead played the whole game turn-by-turn with a real autonomous bot (`takeHeroTurn`/`attack`/`searchForSecrets`/`spendHeroTurn` called once per turn from character select, no depth-teleporting, only a god-mode HP/weapon boost so a bounded turn budget could cover real melee combat) - all 25 regular floors, real fights against Tengu, DM300, the King, and Yog-Dzewa (its `yogShielded()` fist-invulnerability and 30%-of-maxHp phase gates handled by killing each summoned fist before hitting Yog again, matching what a real player must do), the Amulet pickup, the depth-26 ascent confirmation, and the climb back through every floor to depth 1, ending on the real `Victory!` panel with zero page/console errors. The three bugs this run's iterations found and fixed were all in the `playwright-core` bot script itself (scratchpad tooling, not committed): a BFS pathfinder that let the bot "path" diagonally through wall corners real Pixel Dungeon movement forbids (stalling forever once the target the bot picked and the target it could actually reach diverged), a priority bug that kept re-selecting the ordinary descend stairs over the ascend-entrance while the Amulet was already in the bag, and the fight routine's ignorance of Yog's fist-shielding. None of these needed a change to the game's own source - the systems this row documents were already correct; what was missing was proof by an unassisted run rather than the state-chain checks above. `npx tsc --noEmit`/`npm run build` unaffected (no source changed this pass).
