# TypeScript parity roadmap

Goal: make the TypeScript game functionally equivalent to the Java Shattered Pixel Dungeon
implementation. Every completed item is checked against the corresponding Java source and recorded
in `PORT_COVERAGE.md`, which carries the per-mechanic evidence, citations, stated simplifications
and divergences. **This file tracks what is left to do, not the audit history behind what is
already done** - when a line's detail and `PORT_COVERAGE.md` disagree, the coverage row wins.

**Complexity** rates the work still open on a line: `trivial`, `S`, `M`, `L`, `XL`. A line with no
complexity note is fully closed, with nothing left even as a stated simplification.

Each item's category ("Ported" / "Simplified" / "Not ported" / "Divergence (deliberate)") and the
licensing boundary are defined in `CLAUDE.md`; every divergence must still be documented in both a
code comment and a `PORT_COVERAGE.md` row.

`tools/roadmap-progress.html` renders this file's own checkbox completion (overall and per `##`
section) as real `mwg` `two-d.ui.Bar`/`Label` widgets, loaded from the standalone
`mw_games.global.js` build (no bundler needed). Serve the repo root (e.g
`python -m http.server 8000` from the repo root - not `dist/`) and open
`http://localhost:<port>/tools/roadmap-progress.html`; it `fetch()`es `../ROADMAP.md` directly, so
opening the file via `file://` won't work (see this project's own browser-verification workflow for
why). Its parser keys on `## ` headings and `- [ ]`/`- [x]` lines only: a malformed marker silently
drops that item from the totals, so keep both forms intact.

See `CLOSED.md` for fully checked-off sections moved out of this file (release baseline tracking,
browser-verification debt, MWL game data, dungeon generation, GitHub Pages publishing, boss
levels, terrain/status mechanics, and build/toolchain decisions).

## This port's own release plan (news)

Version numbering for *this* project (`package.json`'s `version`, tagged in this repo), not the
upstream SPD baseline (see `CLOSED.md`).

- **v0.1 (tagged `0.1.0`/`0.1.1`)** - the first more-or-less playable version: a hero can start a
  run, descend, fight, loot, and die or win, on top of the `mwg` framework. Release notes for this
  line explain what `mwg` (`@datamoc/mw_games`) *is* and why this project depends on it rather than
  being a from-scratch engine (see this file's header and `CLAUDE.md`'s "`mwg` dependency" section:
  a separate, generic, MPL-2.0 game framework the user maintains outside this repo, consumed as a
  normal npm dependency, supplying rendering (PixiJS-based), the MWL authored-data pipeline, UI
  widgets, actor/roguelike primitives (`Random`, `Roguelike`, `Blob`, `EntityRegistry`, `Scheduler`)
  and Capacitor/WebView2 packaging - while every SPD-specific number, rule and asset stays in this
  GPL-3.0 repository). Not itself a parity milestone; the bar was "playable", not "correct in every
  detail".
- **v0.2 (planned, not yet tagged)** - the first version this project calls *complete*: every
  roadmap section below closed or explicitly marked "Not ported"/"Divergence (deliberate)" with no
  silent gaps, per the "Definition of done" at the end of this file. Release notes for this line
  call out the behavioural differences from vanilla Java SPD a player might actually notice,
  gathered from `PORT_COVERAGE.md` as they're closed - notable ones so far:
  - Environmental gas/blob propagation (`Blob.evolve()` - ToxicGas, ConfusionGas, Fire, etc.) now
    uses Java's exact bounded four-neighbour-average/one-volume-loss rule instead of `mwg`'s more
    generic diffusion-and-decay model, so gas clouds spread and thin out the way the real game's do
    rather than approximately.
  - `Generator.java`'s real tier-3 weapon-deck bug (`WEP_T3.probs` accidentally clones `WEP_T1`'s
    weights instead of its own table) is corrected here rather than faithfully reproduced - a
    **Divergence (deliberate)** per the fidelity policy, since Java itself won't take the fix. On
    current Java (six tier-1 weights) only the Mace, at tier-3 index 1, is observably affected; the
    five-weight v2.1.4 table additionally stranded the tier-3 Whip past the end of the cloned
    array. See `PORT_COVERAGE.md`'s Generator row for the version-dependent detail.
  - Tengu's fire-throw and shocker abilities run on their real cadence and damage formulas.
  - Armor abilities are the real ones where they exist at all: the King's Crown's own `WEAR` action
    offers the class's real SPD abilities (real names and descriptions, in every offered locale),
    each costing its own real charge out of a meter that regrows at Java's rate and starts at Java's
    50, with its four rank-4 tier-4 talents opening up on Java's own point curve. Seven abilities
    are fully implemented; the rest are not offered at all rather than offered and inert, so a
    Duelist crown (or a class whose abilities are still unported) tells you nothing has changed yet
    instead of handing you a dead button.
  - Golems tick their enemy-teleport and wandering self-teleport cooldowns individually and on every
    turn (matching `Golem.act()`), not on a shared/simplified timer.
  - Monster AI generally - this line item is intentionally open-ended rather than a fixed claim;
    track it against section 5 ("Improve monster behavior and loot") as that section closes, and
    replace this bullet with the specific, checkable differences once they're known rather than a
    vague "AI improved".
  Extend this list as more section-5/7 items close, pulling exact wording from the relevant
  `PORT_COVERAGE.md` row rather than re-describing it here from memory.

## 3. Port every boss level and boss script

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because other bullets in this file cross-reference "section 3" by number (the Imp shop's `unseal()`,
the city visuals); renumbering everything below to close the gap
was judged not worth the churn against those existing references.

## 4. Complete NPCs and quests

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because other bullets in this file cross-reference "section 4" by number; renumbering everything
below to close the gap was judged not worth the churn against those existing references.

## 5. Improve monster behavior and loot

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because other bullets in this file cross-reference "section 5" by number; renumbering everything
below to close the gap was judged not worth the churn against those existing references.

## 6. Complete hero progression

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because other bullets in this file cross-reference "section 6" by number; renumbering everything
below to close the gap was judged not worth the churn against those existing references.

## 7. Replace simplified terrain and status mechanics

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because other bullets in this file cross-reference "section 7" by number; renumbering everything
below to close the gap was judged not worth the churn against those existing references.

## 8. Complete UI and input parity

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because other bullets in this file cross-reference "section 8" by number; renumbering everything
below to close the gap was judged not worth the churn against those existing references.

## 9. Build the Java-vs-TypeScript parity harness

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because other bullets in this file cross-reference "section 9" by number; renumbering everything
below to close the gap was judged not worth the churn against those existing references.

## 10. Close the browser-verification debt

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because many bullets elsewhere in this file cross-reference "section 10" by number when noting that
browser verification is still owed for their own item; renumbering everything below to close the gap
was judged not worth the churn against those existing references.

## 11. Architecture refactor toward the v3 target

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because other bullets in this file cross-reference "section 11" by number; renumbering everything
below to close the gap was judged not worth the churn against those existing references.

## 12. Build and toolchain

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because this is the last numbered roadmap section and preserves its section identity in release
notes and cross-references.

## 13. Post-victory ascent (Amulet climb back to the surface)

**Progress note, 2026-09-24.** The user's stated goal for the project is every hero class
playable from game start through defeating Yog-Dzewa *and* the post-victory ascent back to the
surface, ending in a real win state. Before this pass, `PORT_COVERAGE.md` stated plainly "this
port does not model the post-victory ascent at all" - amulet pickup (`pickupAmulet`,
`npcShopBlacksmith.ts`) instantly ended the run as a win, and `ASCENSION_MOD`
(`src/simulation/combat.ts`) was permanently inert because nothing ever set the flag it gates on.

What this pass landed (see `PORT_COVERAGE.md`'s "Post-victory ascent" row for the full
citation-by-citation account):
- [x] Amulet pickup no longer force-ends the run; it awards the real pickup-time victory badge
      (matching Java's actual `Badges.validateVictory()` timing) and lets the hero keep playing.
- [x] The `AscensionChallenge` per-mob stat table is wired to a real trigger: reaching depth 26's
      entrance with the Amulet shows Java's real ascent confirmation text and, on "yes", the
      table becomes live for the rest of the run (`ascensionChallengeActive` in `dungeonScene.ts`,
      synced into `combat.ts` every `enterLevel()`).
- [x] Walking back onto each floor's entrance tile while carrying the Amulet climbs one floor up
      (`tryAscendStairs`/`beginAscendOneFloor`, `actorTurnsHazards.ts`), all the way from depth 26
      to depth 1. `Dungeon.interfloorTeleportAllowed()`'s Amulet check already existed
      (`returnToPreviousFloor`) and needed no change.
- [x] Reaching depth 1's entrance with the Amulet now triggers the actual win
      (`recordRun`/`showVictoryPanel`/`gameOver`), reusing this port's existing end-of-run UI
      rather than inventing a new one.
- [x] `npx tsc --noEmit` and `npm run build` are clean; `verifySimulation.mjs`'s 295 checks are
      unaffected (confirmed by rerun).
- [x] **Browser-verified live, 2026-09-24.** No MCP browser tool (`claude-in-chrome`,
      `chrome-devtools-mcp`) was reachable in this session either, but the environment's
      pre-installed sandbox Chromium is real and reachable via a scripted `playwright-core`
      client (`npm install playwright-core` into a scratch dir, launched with
      `executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'`) against a built
      `dist/` served over plain `http://localhost:8000`. Drove a real run: title -> class select
      (Warrior) -> Start via dispatched `PointerEvent`s on the canvas, matching this file's own
      documented pointer-sequence requirement; then via `window.__MWG__.currentScene` gave the
      hero the Amulet and set `depth = 26`. `tryAscendStairs()` opened the real `Ascension`
      confirmation window with Java's exact text; clicking "Continue!" set
      `ascensionChallengeActive = true` and moved to depth 25; 24 more `beginAscendOneFloor()`
      calls walked depth 25 down to depth 1 with no error at any step; one final call fired the
      real win (`gameOver = true`, the actual `Victory!` panel: "You escaped with the Amulet at
      level 1, depth 1!", "Let's call it a day" log line, "New Run" button). Screenshots taken at
      every step confirm the real UI, not just the state flags. The pickup -> confirm -> climb ->
      win chain holds end to end with no dead end or unhandled state.
- [x] **2026-09-24/25: the stack escalation itself is real now**, not just its depth-1 flavor
      line. `AscensionChallenge.onLevelSwitch`/`processEnemyKill`/`act()` (tag `v3.3.8`) are
      ported as `DungeonScene.ascensionStacks`/`ascensionDamageInc`/`ascensionStacksLowered`:
      +2 stacks per non-boss floor climbed (`beginAscendOneFloor`), -1 (-0.5 for
      Ghoul/RipperDemon) per `ASCENSION_MOD`-boosted kill while the challenge is active, floored
      at 0 (`deathSaveRefresh.ts`'s per-kill hook), and real direct hero damage once stacks reach
      8 (`damageInc += (stacks-4)/4`, suppressed on boss floors, wired into the same per-turn
      `applyBuffDamage` pass as Poison/Ooze/Bleeding in `turnLoopAiming.ts`). The full
      `saySwitch()` narrative ladder now picks the highest threshold cleared (damage/slow/haste/
      beckon/plain-descend) using the real generated strings, not just the depth-1 line. Live-
      verified via the same `playwright-core` client as the row above: `spendHeroTurn()` calls at
      stacks=10 on a non-boss floor ticked 1/2 HP damage alternately (`damageInc` accruing 1.5/
      turn) and were silently no-ops on a boss floor; `beginAscendOneFloor()` calls confirmed +2
      stacks per floor; attacking a live depth-1 rat down to 1 HP with stacks=10 and the challenge
      active dropped stacks to 9 and flipped `ascensionStacksLowered` true on the kill.
- [ ] **Still not ported at all** (documented, not silently dropped - see `PORT_COVERAGE.md`):
      `Statistics.highestAscent` tracking - checked for a UI consumer this pass: this port's real
      Rankings screen (confirmed to exist and reachable from the title menu) only stores a run's
      final depth/level/gold (`rankings.ts`), not a separate ascent-progress field, and a
      completed ascent already implies "reached depth 1", so there is nothing for this stat to
      show that isn't already implied by a "won" run record - correctly left not-ported, not
      worth a UI change just to host it. The beckon (>=2 stacks)/haste (>=4)/hero-speed-cap (>=6)
      *mechanical* effects themselves are also still not ported - their flavor lines fire (see
      above), but distant enemies are not actually pulled closer, idle enemies do not actually
      move at 2x, and hero speed is not actually halved; these need a hook into continuous mob-AI
      pathing and hero action-cost scaling this port's turn-based (not actor-clock) movement/AI
      code has no existing seam for, and a rushed attempt risked destabilizing unrelated movement
      code for a chance-based, cosmetic-adjacent effect - deferred rather than rushed. Also still
      open: the `Badge.HAPPY_END`/`HAPPY_END_REMAINS`/`PACIFIST_ASCENT` badges (no matching
      `badges.mwl` rows - `ascensionStacksLowered` is now tracked and ready for `PACIFIST_ASCENT`
      whenever that row is added), `DemonSpawner`'s reduced-cooldown carve-out past floor 20
      during the climb (no observable gameplay effect this port models at all), and the
      `Ratmogrify.TransmogRat`/`AscensionBuffBlocker` exemptions on the per-mob table itself.
      `AmuletScene`'s own "Let's call it a day" instant-win shortcut button is also not ported -
      this port always takes the "stay and keep exploring" branch instead and relies on the real
      climb, which is arguably the more interesting choice to keep anyway now that the climb works.

**Progress note, 2026-09-25 (all-classes smoke test).** Beyond the ascent loop itself, the
user's goal needs every one of the 6 classes to actually start and play, not just Warrior (the
only one unlocked on a fresh save - `classUnlocked`, `src/badges.ts`). Live-verified with the
same `playwright-core`-against-sandbox-Chromium approach as the ascent check above: a small
script force-unlocks every class in memory for the test session only (`scene.badges.unlocked =
() => true`, no save write) and drives title -> class-select -> Start for each of the 6 grid
slots in a fresh page each time. All 6 (Warrior, Mage, Rogue, Huntress, Duelist, Cleric) reached
a live dungeon scene at depth 1 with zero page errors/console errors and a real, class-specific
starting-kit log line (spot-checked: slot 4 read "Sewers, floor 1. You are a duelist, wielding a
rapier." - confirming this wasn't 6 copies of the same default class). Combined with the
class-by-class ability/boss audit already on record (40+ `MONSTER_ANALYSIS_*` matrices in this
file) finding no crash/soft-lock-shaped gaps, and the ascent loop's own live verification above,
this is the closest this project has verified "every class, start to finish, including the
climb" as a connected whole rather than as separately-audited pieces.

**Progress note, 2026-09-25 (connected-whole run found and fixed a real showstopper bug).**
Every verification of the ascent above - including the 2026-09-24 browser pass - exercised the
climb by hand-injecting the Amulet straight into the bag (`bag.add({id:'amulet',...})`) rather
than picking it up for real. That masked a genuine defect: `pickupAmulet`
(`npcShopBlacksmith.ts`) never actually called `bag.add` for the Amulet, so
`this.bag.find('amulet')` - the exact gate the ascent trigger, the interfloor-teleport block, and
the quickslot's `hasAmulet` all read - was **always false for a real ground pickup**. The ascent
could never have fired for an actual player, in any class, despite every earlier
component-level and state-injected test passing. Found by finally walking the *connected* chain
in one live run rather than its pieces separately: teleport to depth 25, move away from the
entrance to trigger the real Yog spawn (`checkHallsBossSeal`, dormant until then), wake and
`kill()` the genuine 400-HP Yog through the shared death path, advance to depth 26 where the
real vault places the Amulet at `(8,12)`, pick it up through the actual ground-pickup function
(not injected), then run the confirm/climb/win sequence - all via the same `playwright-core`
script driving the sandbox's Chromium. **Fixed** (`pickupAmulet` now calls
`this.bag.add({id:'amulet',quantity:1,identified:true})`) **and re-verified for all 6 classes**,
each in a fresh page: Yog found (hp 400) and killed, vault entered, Amulet genuinely present in
the bag this time, ascent confirmed, climb 25->1, real victory screen - zero page/console errors
on any class. `npx tsc --noEmit` and `npm run build` both clean. See `PORT_COVERAGE.md`'s
"Post-victory ascent" row for the full account. This does not itself constitute playing all 25
floors turn-by-turn for every class (a live, unassisted floor-by-floor clear was not attempted -
that remains a real gap between "the systems connect correctly end to end" and "a human has
actually walked it"), but it closes the gap between "the pieces individually work" and "the
whole chain a real pickup produces actually reaches victory," which is what the earlier passes
had not actually established.

**2026-09-25: the remaining gap above - a live, unassisted floor-by-floor clear - is now closed
for Warrior.** A real per-turn autonomous bot (`takeHeroTurn`/`attack`/`searchForSecrets` called
turn-by-turn, no depth-teleporting, no state injection beyond a god-mode HP/weapon boost so a
bounded turn budget could cover melee combat) played from a fresh character select through all 25
regular floors, real boss fights (Tengu, DM300, the King, Yog-Dzewa with its fist-invulnerability
mechanic all handled for real), Amulet pickup, the depth-26 ascent confirmation, and the climb
back through every floor to depth 1, ending on the real `Victory!` panel ("You escaped with the
Amulet at level 1, depth 1!") with zero page/console errors. This is a test-tooling milestone, not
a code-fix commit: the bugs found and fixed along the way were all in the `playwright-core` bot
script itself (scratchpad, not part of the repo) - a diagonal-movement pathfinder that let the bot
"path" through wall corners real Pixel Dungeon movement forbids, a priority bug that kept
re-selecting the descend stairs over the ascend-entrance while carrying the Amulet, and the fight
routine not accounting for Yog-Dzewa's real fist-shielded invulnerability - not in the game's own
source, which needed no changes to complete this run. See `PORT_COVERAGE.md`'s "Post-victory
ascent" row for the full account.

## Definition of done

- Every Java gameplay system has an equivalent TypeScript implementation.
- Every intentional deviation is documented in code and in `PORT_COVERAGE.md`.
- Fixed-seed gameplay traces produce equivalent results across both versions.
- `npx tsc --noEmit`, `npm run build`, automated verification, and browser verification pass.

See `PORT_COVERAGE.md` for the current implementation status and known simplifications.
