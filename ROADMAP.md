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

## 1. Complete the item system

- [x] Wire `rollAffix`/`ENCHANT_TABLE`/`GLYPH_TABLE` into real item generation and equip.
      `generatedInventoryItem` now rolls one via `rollGeneratedAffix` (curse-pool pick when
      `generated.cursed`, weighted good-enchant pick when `generated.hasGoodEnchant`), and
      `equipWeapon`/`equipArmor` gained the real cursed-and-known equip-lock rings already had.
      Statistically (3000-trial roll distributions) and live (equip lock, cleanse, Barrier decay)
      verified. **Known cleanup, not urgent**: `equipWeapon`/`equipArmor` duplicate ~40 lines of
      shape and use inconsistent starting-gear sentinel checks. See `PORT_COVERAGE.md`'s
      "Enchant/glyph/curse assignment" row.
- [x] Port all remaining weapons, wands, rings, artifacts, bombs, alchemy, and crafting.
      **Closed 2026-09-19, after a full re-audit of every sub-bullet under this line (all already
      `[x]`) plus a fresh grep of `PORT_COVERAGE.md` for any "Not ported" row in this section's
      domain**: nothing genuinely unstarted turned up. What remains is exactly the set of already-
      stated, deliberate simplifications this line's own sub-bullets already name and accept as
      final (per the "iso is no longer the goal" policy) - `SpiritArrow`'s Sniper+DAMAGE-augment
      clause (no bow-augment system), the Wandmaker reward's missing wand +1 (wand power here is
      `weaponLevel`, with no per-wand level to hold it), `MagesStaff`/`SpiritBow` targets for the
      infusion pickers (neither is a port item), ammunition stack merging and the boomerang flight
      animation, and a handful of UI/data narrows on the shop-pricing and enchant/glyph rows - none
      of which need a new subsystem, and every one of which is independently `[x]` and cited above.
      Two real remaining gaps belong to *other* roadmap lines, not this one: `ClassArmor` as a
      distinct item (section 6's armor-ability line) and ally-owned weapon-driven `Statue` combat
      (section 5). Closing this line does not re-open either.
      Already done: all 13 real artifact classes, all 12 ring types, all 13 wand classes, and
      generic weapon/armor tiers/upgrades/curses/degradation, and the Duelist T-key weapon abilities
      (all 30 `MeleeWeapon.ability()` overrides with real magnitudes, Java's exact `Charger`
      economy - uniform 1-charge costs, level-based cap, time accrual, partial-first spends,
      post-use `COUNTER_ABILITY` refunds - and Java's setup turn costs, sneak and the charged
      shot free - no missile weapon has an ability at all. **Closed 2026-09-17:** damage-strike auto-target (see below).
      Strikes aim through the `TargetingController` (confirm latches `abilityAimTarget` and re-enters `useWeaponAbility`; cancelling spends nothing), replacing the nearest-visible-enemy auto-pick.
      `VARIED_CHARGE` (no such talent here) and brawler's stance (no such buff); the stale
      ability/talent desc text (catalogue refresh, not mechanics); the alchemy pot's ingredient choice is live (recipe picker plus follow-up ingredient/unit pickers over the bag - the slot-window chrome stays simplified); and the
      shop-stock items that used to have no item class here at all (Torches, Tipped Darts, the Ankh,
      Java's `ChooseBag` pick) - all four now exist as real items: the bags as ownable, priced,
      tradable goods with the real pick (their container behavior stays with the inventory-windows line). **The Torch carries one more thing beyond itself:** SPD's
      `Light` buff, which `YogDzewa.updateVisibility()` checks before shrinking the hero's view
      distance to the arena's own radius - so that fight's dim-arena rule is fully implemented here
      (the shrink is live) and its `Light` exemption is live (`useTorch` lights the buff; the Yog view-radius rule skips the shrink while lit). **Complexity: L.** The weapon-ability system was the one
      cross-cutting piece and is now live (see PORT_COVERAGE.md's ability row); what remains here is narrow gaps.
- [x] Port the remaining potions. All 12 generator potion classes now have their own branch
      (Levitation, ToxicGas, ParalyticGas, Haste, Frost, and the `LiquidFlame`/`Invisibility`
      id-mapping bug fixed), each backed by its real blob or buff. The historical "silently falls
      through to Purity" bug class is closed, with a `console.warn` guard on the fallback. See
      `PORT_COVERAGE.md`'s potions row.
- [x] Port the remaining scrolls. Recharging, Teleportation, Terror, Retribution (minus
      `Blindness`, which has no seam here) and Transmutation (Simplified) are live, plus the
      `MirrorImage`/`MagicMapping` id-mapping bugs. A real generic item-picker panel
      (`openItemPicker`/`chooseItemPicker`) now serves Transmutation and the three picker-driven
      runestones. **Remaining**: exact `changeItem` coverage for exotics/trinkets/equipped gear -
      owed with section 1's item-system completion, since those items must exist as distinct
      ported items first (missile/tipped-dart/wand/pickaxe rerolls ported 2026-09-17).
      See `PORT_COVERAGE.md`'s updated row.
- [x] Port the remaining enchantments and glyphs, and complete their executable behavior. All 42
      (13 weapon enchants, 13 armor glyphs, 8 weapon curses, 8 armor curses) have real, live proc
      logic; the 16 curse definitions are authored in `src/content/curse-rules.mwl`. Unstable's
      delegate list is guarded both ways (item suite asserts it equals Java's `randomEnchants`
      array; `tools/scratch/unstable-delegates-livecheck.mjs` drives 440 real swings). **Remaining**:
      the non-sleeping FOV-binary `seesHero` path is still simplified, so `Obfuscation` contributes
      to sleeping detection only. See `PORT_COVERAGE.md`'s enchant/glyph/curse row for the 20 live
      assertions and each mechanic's citation.
- [x] Implement weapon augments. A real `stoneOfAugmentation` item, `useStoneOfAugmentation()` bag
      action and `chooseAugment()` choice panel, live end-to-end verified (Speed → `weaponAugment`
      `'speed'` → `getActionTurnCostMod()` 1 → 0.8). Auto-targets the equipped weapon rather than
      Java's item-picker, this port's convention for "use item on another item". **Simplification**:
      Java's stone also grants a genuine bonus weapon-upgrade level, not reproduced (this port's
      upgrade path is tier-based, with no free-standing "+1 level" primitive). See `PORT_COVERAGE.md`'s
      enchant/glyph row.
- [x] Port three more runestone (`Cat.STONE`) types: `StoneOfFear`, `StoneOfDeepSleep` and
      `StoneOfShock`, each with its own id and use-action. All three auto-target the nearest visible
      enemy (no map-click cell-targeting existed at the time), so they only ever affect an enemy.
      **Stated simplifications**: DeepSleep is instant-sleep rather than Java's gradual
      `Drowsy`/`MagicalSleep`; Shock uses a Chebyshev-distance-2 circle rather than Java's wall-aware
      `PathFinder` flood fill, and this port's shared 3-turn `paralysis` rather than Java's 1 turn.
      Browser-verified live. **Correction from this pass, worth noting**: the 12th runestone type is
      real Java's `StoneOfDetectMagic`, not the `StoneOfDisarming` an earlier draft of this line
      named - that class does not exist in SPD at all.
- [x] Port a fourth runestone type, `StoneOfBlast` -> `stoneOfBlast` (`useStoneOfBlast()`). Real
      Java's `activate()` is a `Bomb.ConjuredBomb().explode(cell)`: this port reuses the same
      Chebyshev-distance-1-circle approximation `StoneOfShock` makes, substitutes `this.depth` for
      `scalingDepth`, and routes the hero's own share through the existing `absorbHeroDamage`/`kill`
      path. **Not reproduced**: the terrain-destruction/heap-triggering half of the real explosion -
      this port has no equivalent call from an item-use site. Browser-verified live (radius cutoff,
      hero included in the blast, stack decremented by 1).
- [x] Port two more runestone types, `StoneOfBlink` and `StoneOfClairvoyance`, plus
      `StoneOfEnchantment`/`StoneOfIntuition`/`StoneOfDetectMagic` and Flock/Aggression - 10 of 12
      real runestone types, with the generator table now using the real `StoneOfDetectMagic` class.
      **Stated simplifications**: Blink collapses to the shared `randomFreeCell` (Java's short aimed
      hop is lost); Clairvoyance centres on the hero and reproduces DIST=20 as a plain Chebyshev
      circle; the picker is bag-only with no exotics. Aggression's boss/miniboss shortening and the
      marked-target half-damage branch are both real and live (with a new `miniboss` actor flag).
      Browser-verified live. See `PORT_COVERAGE.md`'s runestone row.
- [x] Implement complete weapon and armor tiers, transfer formulas, upgrade formulas, curse
      infusion, and degradation. Includes the Blacksmith's reforge (persistent favor, progressive
      costs, level preservation, one-item consumption) and its harden service, the Warrior's seal
      transfer/detach (`Armor.doEquip()`, `AC_DETACH`), and the curse-infusion bonus as Java's
      *virtual* `1 + level/6` in `level()` rather than a baked level. Both infusion pickers'
      candidate sets are now Java's real predicates (`MagicalInfusion.usableOnItem` =
      `isUpgradable()`; `CurseInfusion.usableOnItem` = equipable+upgradable, `Wand` or `SpiritBow`),
      resolved over this port's ids in `src/items/itemKinds.ts`, and both play their real
      presentation (`burstShadowUp`, the `READ`/`CURSED` samples). **Not covered by this line, and
      never was**: Java's `MagesStaff`/`SpiritBow` targets, which are not port items at all. See
      `PORT_COVERAGE.md`'s infusion, seal and hardening rows.
- [x] **Correction, 2026-09-14: this bullet's entire premise was stale.** It claimed Kinetic,
      Blooming, Projecting, Affection, AntiMagic, Camouflage, Obfuscation and Potential were all
      still unported stubs, each blocked on a subsystem this port had not built. Every one is
      implemented - including `Projecting`, which turned out to have no "line-AoE geometry" to build
      at all (real `Projecting.proc()` is a no-op; the entire enchant is `Weapon.reachFactor()` and
      `MissileWeapon.throwPos`, both already implemented). Nothing in this list needed a new
      subsystem by the time it was checked.
- [x] Replace simplified missile durability and wand recharge behavior with the Java formulas. Wand
      recharge is `10 + 40 * 0.875^missing` with Recharging's bonus and refunds separated from
      passive recharge; missile durability/damage/upgrade levels are exact against tag `v3.3.8`
      (per-type `baseUses`, the `1.5^level` scaling, `durable-talent` `1.25+0.25/point` applied only
      while the talent is actually taken, rounded usages ≥100 costing 0, hit-only wear with the real
      break warnings, uncapped missile levels via SoU). `wieldMissile` now switches which class the
      ammo model tracks, so per-class damage, durability and the three real `proc()` overrides
      (Bolas/Tomahawk/FishingSpear) all follow the wielded item. `HeavyBoomerang.CircleBack` is
      ported (5-turn return, hero pickup / throw at a squatter / drop). The ranged accuracy factors
      (`accuracyFactor * adjacentAccFactor`, 0.5 at adjacency) and the last-missile confirm window
      are live and browser-verified. **Three stated reductions remain**, each recorded in
      `PORT_COVERAGE.md`'s `MissileWeapon` row: ammunition stack merging (a fungible ammo counter has
      no per-stack identity to merge), `augment.delayFactor` and the MagicalHolster multiplier (no
      per-missile augmenting, no holster), and the boomerang's flight animation (Java tweens a
      `MissileSprite` home; this port resolves the return with SPD's own pickup line).
      `SpiritArrow.accuracyFactor`'s Sniper + DAMAGE-augment clause also stays unported - no bow
      augment system to read. **Complexity: S** for those remaining reductions.
- [x] Implement identification appearance randomization. Potion and scroll appearances are shuffled
      once per seeded run, pre-drawn without disturbing later gameplay RNG, and persisted through
      save/load.
- [x] Implement full shop pricing, buyback shelves, and wealth modifiers. **Closed 2026-09-17: the last two named halves are done - the stats line now carries Java's real STR sentences (`weaponSTRReq`/`armorSTRReq`/`missileSTRReq` in `src/items/strReq.ts` with the `too_heavy`/`excess_str` suffixes, pinned in `test:items`), and the "wand charges" half turned out not to exist in Java (`WndTradeItem` renders `item.info()`, which carries no charges - they live in `status()`), so it is recorded as a non-gap rather than built.** Pricing, shelf stock, the
      buyback shelf, and the real trade window's sell-button rules are all in place (see
      `PORT_COVERAGE.md`'s `Shopkeeper` + pricing rows). **The buying half no longer charges on a
      step (2026-09-16)**: this port used to spend the hero's gold the instant they set foot on a
      priced stand, where Java shows `WndTradeItem` and charges only when its `buy` button is
      pressed (and disables that button while the price exceeds the hero's gold). Stepping onto a
      stand now opens the port's trade window - the same generic picker the keeper's own window
      uses, one row labelled with SPD's real `windows.wndtradeitem.buy` string and the price -
      cancelling costs nothing and leaves the stand priced and unbought, and the purchase itself
      stays in `groundPickup.ts` so the window only decides *whether* it happens. An unaffordable
      stand opens nothing. Browser-verified live (`tools/scratch/shop-stand-purchase-livecheck.mjs`,
      7/7). **The window's item-info body is now ported too (2026-09-16)**: the picker gained a body
      block (Java's window is `WndTradeItem extends WndInfoItem`, so its body is the item's own
      description above the buy button), filled from `itemDescription(id, sourceClass)` plus `itemStatsLine` - the MWL
      `descriptionKey` tables first (which is what gives a generated-gear heap its gear's own text),
      then the SPD catalogue's `items.<class>.desc`; the keeper's shelf rows open the same body in their own
      detail window above the buy row (browser-verified live, `keeper-shelf-detail-livecheck.mjs`, 4/4).
      Remaining before the close-out (now done, see above): STR requirements and wand charges on the stats line (no STRReq system, no per-heap wand
      state, so those two halves stay unshown); the `extraThrownLeft` sell warning, which IS live for upgraded
      missile stacks holding extra throws.
      The Ankh is fully stocked and functional (one per shop, the BLESS action, the blessed revive, and the
      unblessed `WndResurrect` keeps window), and so is the `ChooseBag` pick (one bag per shop off the real scoring rule, bought live) - the one genuine remainder, the bags' container behavior, belongs to the
      inventory-windows line below.
      **Complexity: S.** A handful of narrow, independent UI/data gaps, none needing a new system.
- [x] Implement Timekeeper's Hourglass sand-bag state and its level-generation effects. The
      identified/uncursed inventory state follows Java's depth-specific shop percentages, sand bags
      upgrade and persist on the hourglass, concrete item identities survive the level/save bridge,
      and the active time-freeze action is wired into the turn scheduler. Stasis, recharge cadence
      and exact artifact presentation stay with the broader artifact-system work.

## 3. Port every boss level and boss script

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because other bullets in this file cross-reference "section 3" by number (the Imp shop's `unseal()`,
the city visuals); renumbering everything below to close the gap
was judged not worth the churn against those existing references.

## 4. Complete NPCs and quests

- [x] Port Caves NPCs and quests. **Verified complete, and the region has exactly one NPC: the Troll
      Blacksmith.** Its quest is ported in all its variants (the normal DarkGold fetch and the
      alternative bat-stained-pickaxe run, the pickaxe, the favor, the progressive reforge, and the
      service window with all six services). `CavesLevel` overrides no `createMobs()` at all, so
      there is nothing else in the region to port.
- [x] Port City NPCs and quests. **Closed 2026-09-16, for free as predicted.** The Ambitious
  Imp quest itself was already fully ported and browser-verified (real spawn roll, monk/golem
  alternative, token counts, ring reward), with one stated simplification (depth 18's 50/50
  pick uses depth parity rather than a fresh Java roll). The Imp shop the quest's completion
  opens now spawns at the King's death via section 3's `unseal()`, kept by a real
  `ImpShopkeeper` with imp art, the shopkeeper's trade window and flee behavior, and its own
  first-sight greeting yell.
- [x] Port Halls NPCs and quests. **Closed as not applicable after checking: real Java ships
      neither** - `HallsLevel.initRooms()` adds exactly one room, `DemonSpawnerRoom` (ported), and
      the class overrides no `createMobs()` at all. The Halls' content is its mobs and Yog-Dzewa,
      tracked in sections 3 and 5.
- [x] Implement the full Ghost quest reward generator. Now uses `Ghost.Quest.spawn()`'s own distinct
      formula (fixed 50/30/15/5% tier roll, single upgrade level shared by both items, single shared
      20% enchant/glyph chance) via `generator.ts`'s `ghostQuestReward()`, statistically verified
      against Java's fractions. **Found and fixed the same pass**: every procedurally-generated
      weapon or missile in the game was silently mislabeled a plain `'food'` item with no
      enchant/curse, because `generatedInventoryItem` checked `generated.cat === Cat.WEAPON` when the
      real value is always a `WEP_T1..T5` sub-tier cat. See `PORT_COVERAGE.md`.
- [x] Finish the Wandmaker's three site quests. **Closed 2026-09-17: the dust-curse was the last portable piece** (Wraith kinds, cursed-rose spawn, dust-spawner bank and handover dispel - see `PORT_COVERAGE.md`'s `Wraith` row). What remains is missing-system-only: the zap pose (no animation layer), quest-music/score (neither system exists), the +1 on the offered reward wands (wand power here comes from `weaponLevel`, no per-wand level to hold it), and `intro_cleric` (predates the catalogue). All three fetch types (corpse dust, elemental embers,
      rotberry seed) are live end to end. **The reward and the intro were not what this line claimed
      until 2026-09-16**: it said the reward was real, and it was an invented substitute - the
      interaction handed out a *frost* wand outright (a plain magic-missile staff for a Mage),
      picking the class for the player where Java shows `WndWandmaker` and offers the floor's own
      two rolled wands (`Quest.wand1`/`wand2`) for the player to choose between. Both halves are now
      Java's: the window offers the two real classes, each named from the catalogue (the `wand`
      reward rows are distinguished by a synthetic `wand-reward:<Class>` instance id, the same
      convention the artifact action rows use), **cancelling keeps the quest item** because Java
      spends it only in `selectReward`, picking one sets the hero's wand to that class, and the
      Wandmaker then says his real `windows.wndwandmaker.farewell` and leaves for good
      (`destroy()`). The intro also gained the class's own `intro_<class>` line, which Java puts
      first and this port had been dropping entirely. Browser-verified live end to end
      (`tools/scratch/wandmaker-reward-livecheck.mjs`, 6/6). Stated, not silently missing: Java's
      `wand1.upgrade()`/`wand2.upgrade()` - both offered wands are generated at +1 - has no home in
      this port's wand model, whose power comes from `weaponLevel` rather than a level on the wand
      item; and `intro_cleric`, which real Java has (`v3.3.8`'s `case CLERIC:`) but this port's
      generated catalogue predates, is skipped for a Cleric rather than filled with another class's
      words and recorded in `PORT_COVERAGE.md`'s wand rows. **The `RitualMarker` custom tile is now
      ported (2026-09-16)**: `ritualMarkerVisuals.ts` and a scene layer transcribe
      `RitualSiteRoom.RitualMarker`'s 3x3 block over the four candles' own cell, from
      `prison_quest.png` - a sheet this port was not loading at all - with its own catalogue
      name/desc on the examine path. The frames are `0,1,2 / 4,5,6 / 8,9,10`, *not* `0..8`:
      `CustomTilemap.mapSimpleImage(0, 0, 64)` walks a **4-column** atlas and each row skips its
      fourth tile. Pinned in `verifyVault.mjs` (31 checks) by recomputing that helper's own
      arithmetic, and browser-verified live
      (`tools/scratch/ritual-marker-livecheck.mjs`, 6/6: the layer exists exactly when `ritualPos`
      names a site, carries those nine frames and nothing else, and answers its own text).
      **The newborn elemental's telegraph is now Java's too (2026-09-16)**: the red `TargetedCell`
      3x3 over the cells its fireball will cover, the charge's own cost
      (`gate(attackDelay(), ceil(hero.cooldown()), 3*attackDelay())`, expressed through
      `pendingMonsterTurnCost` - the "no expression here" this row used to claim was stale, the port
      has had fractional monster turn costs for a while), and the cooldown ticking on *every* hunting
      turn rather than only the non-adjacent ones. Browser-verified live
      (`tools/scratch/newborn-telegraph-livecheck.mjs`, 6/6).
      **Remaining, re-checked 2026-09-16 (candle aim closed 2026-09-17)**: the heap/pickup intermediaries this port
      collapses into a bag-direct action (candles aim through the `TargetingController` - only empty ritual slots validate, confirm spends the throw's turn; the heap/pickup halves stay collapsed).

      Still open: the zap *pose* (Java's `sprite.zap()`/`zap()` pair - the visible bolt itself is
      covered, `elementalRangedTurn` fires `spawnProjectile`); no quest-music swap or score
      accounting (neither system exists). **The dust quest's wraith-curse variant is ported (2026-09-17)**: the `Wraith`/`DustWraith` kinds carry Java's real stats and arrival rules, a cursed rose rolls the 1/100 adjacent spawn, and carrying the dust runs the real `DustGhostSpawner` bank (FOV/distance-gated spawns, handover dispel) - the score penalties stay out with the rest of the missing score system. See `PORT_COVERAGE.md`'s `Wraith` row. **Corrected in the same pass**: "regular fire
      elementals lacking the subtype split" was stale - `elementalType` carries all four kits
      with Java's selection, effects and loot (see `PORT_COVERAGE.md`'s Elemental row).
      **Complexity: S.** Narrow presentation/flavor gaps plus the one mob-blocked curse.
- [x] Port the Troll Blacksmith's last remaining gap. **Closed 2026-09-17: the missile half was already live (per-stack upgrade, consumed-set retirement, asserted in the item suite) - only the wand stays withheld, as a stated silent-no-op exclusion shared with the Upgrade service.** All six services and the real turn-in favor
      bookkeeping are live and browser-verified. **The Upgrade service now uses Java's own
      predicate (2026-09-16)**: `WndBlacksmith.WndUpgrade.itemSelectable` is `isUpgradable() &&
      isIdentified() && !cursed && level() < 2`, with no type test at all, where the picker here had
      been filtering on a three-id hand-list of weapons and armor - it now offers rings too (their
      level really is per-item here) and is browser-verified live
      (`tools/scratch/blacksmith-upgrade-livecheck.mjs`, 6/6). Two classes stay excluded on top of
      Java's predicate because their upgrade would be a *silent no-op* in this port's model, not
      because Java disagrees: a carried missile stack (no per-stack level) and a wand (power comes
      from `weaponLevel`, so a level on the wand item is read by nothing) - both asserted in the item suite
      **The reforge is now Java's own (2026-09-16).** `WndBlacksmith.WndReforge` needs two picks of the
      same *class* (`item1.getClass() != item2.getClass()`) that are not the same entry, and the
      picker here used to pair by bag id - which, since every generated weapon is the id
      `weaponReward` and every generated armor `armorReward`, happily reforged a handaxe with a
      shortsword. Pairing is now by class (`blacksmithItemClass` = `sourceClass ?? id`), the selector
      is Java's own `isIdentified() && !cursed && isUpgradable()` with no level cap (so rings can be
      reforged now, exactly as Java allows), and the second picker offers only the first pick's class
      - this port's equivalent of Java's disabled Reforge button, since its pickers have no disabled
      state. The reward line no longer reports the *scene's* weapon/armor counters (a reforged ring
      used to announce the armor's level) but names the item actually reforged, in all 19 locales.
      Browser-verified live (`tools/scratch/blacksmith-reforge-livecheck.mjs`, 7/7: a +1 and a +3
      shortsword reforge into +4 with the other consumed and the favor charged, while a handaxe, a
      ring and a missile stack stay untouched - that livecheck predates missiles being offered, like the upgrade one above). **The missile half is live since 2026-09-16; what follows is the original blocker analysis, kept for the record**, on two model
      prerequisites rather than on its selector:
      it pairs items by bag id, and every wand in this port shares the single minted id `wand`, so
      widening it as it stands would let two *different* wand classes merge (Java tests
      `item1.getClass() != item2.getClass()`). And what
      actually blocks the missile case is the *upgrade* side, not the set id: `onSelect` upgrades
      the kept item (`first.upgrade()`) and retires the consumed one's set
      (`UpgradedSetTracker.levelThresholds.put(setID, Integer.MAX_VALUE)`), and this port keeps
      missile levels on a single wielded counter (`missileLevel`) with **no per-bag-stack level at
      all** - so a reforged missile stack could be consumed but not upgraded, which is a silent
      no-op rather than a partial port. Closing it means giving carried missile stacks the same
      per-stack level and set that ground heaps already carry, i.e. deliberately reversing the
      fungible-ammo simplification recorded in `PORT_COVERAGE.md`'s `MissileWeapon` row - worth doing
      on its own terms, not as a Blacksmith tweak. See `PORT_COVERAGE.md`'s Blacksmith rows.
      **Complexity: M** for that reason: it is an ammo-model change, not a picker change, and it
      would touch wielding, pickup and dust together.
- [x] Give carried missile stacks their own level, set id and durability, reversing the fungible-ammo
      simplification. **Complexity: M.** Java keeps all three on the *stack* (`MissileWeapon.setID` is
      a per-stack `SecureRandom` long, `durability` starts at 100, and `upgrade()` resets it, refills
      `defaultQuantity()` and records `levelThresholds.put(setID, trueLevel()+1)`), and gates stack
      merging on `isSimilar` = same level **and** class **and** set. This port instead keeps one
      wielded counter (`missileLevel`/`ammoSetId`/`ammoDurability`) and gives carried stacks none of
      them - only ground heaps carry `missileLevel`/`missileSet`, written from the wielder's current
      values and read back by the dust rule. `mwg`'s `Inventory` already has what this needs (`level`,
      `durability`/`maxDurability`, and an `instanceId` that gates merging and travels with `take()`),
      so the identity can be `missile:<setId>:<level>`; what is missing is a `bagSources` slot for the
      set id on load, and the read/write plumbing in `wieldMissile`, `recoverStone`, the dust path and
      the throw. **Closed 2026-09-17 - every prerequisite named here is live since 2026-09-16** (`wieldMissile` adopts the whole stack with its level/set/wear, heaps persist the set/level, the dust rule and the throw read them back, `missileSet`/`tippedSeed` persist through the `bagSources` side channel, `extraThrownLeft` is modelled). Note `upgradeItem` already *writes* a missile stack's `level` (via MagicalInfusion)
      that nothing reads back. This unblocked the Blacksmith reforge's missile half above,
      and the shop's `extraThrownLeft` warning.
- [ ] Port Rat King and other missing special NPCs. Rat King is complete for its core exchange (room
      drops real `Gold(10-25)` CHEST heaps, the king spawns sleeping with his own art, wakes with the
      real yell, awards the crown exchange when worn armor is present, and grants the six-turn
      Ratmogrify ability); `MirrorImage` and `Sheep` are live through the ally/combat system.
      Closed 2026-09-19: `PrismaticImage` (exotic scroll brewed from one `scrollMirror`; guard/image chain live - see PORT_COVERAGE.md). Genuinely remaining: only `VaultSentry`, which does not exist in this port at all.
      **Triaged 2026-09-16, blocked on its own system, not on NPC code**:
      `VaultSentry` is the scanning sentry of the Halls vault quest rooms (`rooms/quest/vault/*`, crystal-key questline - the whole quest is unported);
      `DirectableAlly` drops off the list (2026-09-17): the hawk's orders - its only live consumer -
      are already live (`allyTargetChar`/`allyDefendCell`, re-cast cell selector, `directTocell`'s
      'follow me again'); PowerOfMany needs Cleric spells. **Correction, 2026-09-19: ShadowClone
      is no longer unoffered** - the 20th matrix (`MONSTER_ANALYSIS_SHADOWCLONE.md`) ported it as
      a real `allyKind`, summoned and directed through this same shared ally system; see section
      6's armor-ability row.
      The ported allies (hawk, ghost, mirror image, sheep, shadow clone, prismatic image) run through `allyKind`
      without the base. **Done in the same pass: `ImpShopkeeper`** - a real kind with imp art, the
      shopkeeper's trade window and flee behavior, its own first-sight greeting yell (the
      `greetings_ascent` variant stays out: no AscensionChallenge here), spawned by section 3's
      `unseal()`. See `PORT_COVERAGE.md`'s Shopkeeper row. **Complexity: M** for the two that
      remain, each inherited from its blocker.

## 5. Improve monster behavior and loot

- [x] Fix `Brute`'s enrage. Was a stateless below-half-HP damage boost that never granted Java's
      real one-time near-death revival; now a genuine `hasRaged`-gated revival with the real
      `HT/2+4` shield and flat 4/turn decay. Browser-verified live. See `PORT_COVERAGE.md`.
- [x] Implement exact wandering, hunting, fleeing, and stealth calculations. **Progress 2026-09-16:**
      the retained-target wandering branch is now isolated as `takeWanderingTurn`, including the
      Java target lifetime, passability checks, piranha water restriction, and Golem's unreachable
      target teleport path; fleeing recovery (`Mob.Fleeing.nowhereToRun()`) is ported since 2026-09-17 - a fleeing mob with no step turns and fights with the real `Mob.rage` line while it sees the hero, else drops back to wandering, unless Terror holds it (Dread has no system here). **Hunting parity ported 2026-09-17**: `Creature.lastSeen` is Java's hunting `Mob.target` - refreshed while the hero is seen, pursued when sight is lost (give up on arrival/unreachable), persisted through save/load, no re-roll on re-acquire while hunting, fleeing excluded; mass-alert sources set it so their mobs hunt. Stealth/invisibility gating lives on the section-7 line, now fully closed (wound/surprise presentation, ranged invisibility gate, Eye beam migration).
- [x] Implement monster-specific AI overrides. **Closed 2026-09-17: the last two "Not modeled" halves were already live (Spinner's persistent 3-cell `Web` blob plus the direct root, DM-200's BFS reachability plus the closing-distance-failed vent retry) - only Golem's charge particles and delayed animation remain, with no particle/animation layer to express them.** **Ported**: Golem's teleport-the-hero-away ability
      (with Java's `canTele` reachability, direct-shot distance roll and `MagicImmune` target gate)
      and its 30-turn self-teleport-to-reposition, Eye's real ranged two-turn DeathGaze (charge turn
      costs 2 and takes quarter damage; the fire turn is a magic hit roll for 30-50 bypassing armor),
      DM-200's venting override, Spinner's ranged web, the Necromancer's skeleton support (heal
      `HT/5`, one-time Adrenaline, teleport-back) and `firstSummon`'s variable tick cost via the new
      `monsterTurnCost` hook, RipperDemon's two-turn telegraphed leap (far-side landing prediction, re-traced pounce with an infinite-accuracy hit plus 0.75x `Bleeding`, 2-4 cooldown, instant relocation, the warning log line standing in for the red cell marker and crouch), and the Succubus hunting blink (teleport to a seen hero 3+ cells away off a 4-6 cooldown, free, ordinary-approach turns ticking it down). **Not modeled**: Golem's charge particles and delayed animation;
      Spinner's real persistent 3-cell `Web` terrain blob is ported (the direct root is the impact, the blob the aftermath);
      Golem's charge particles and delayed animation have no particle/animation layer here. See
      `PORT_COVERAGE.md`. **Complexity: M** for what remains.
- [x] Implement ally-vs-monster combat. `Creature.isAlly` is persisted and scheduled; MirrorImage
      summons are real 1-HP allied actors copying the hero's combat stats, ally turns use an
      ally-centred FOV, hostile mobs path toward a visible ally when they cannot see the hero, and
      `Amok` attacks nearby creatures. Flock and Aggression runestones run through the same seam.
      **Remaining**: boss-specific ranged target migration, and dedicated ally sprites/orders.
- [x] Port all champion types and their effects. All 6 real types (Blessed/Blazing/Giant/Growing/
      AntiMagic/Projecting) are live with their real per-type factors and a true 1-in-6 roll, gated
      on the `CHAMPION_ENEMIES` challenge, backed by Java's real resettable `mobsToChampion`
      countdown (persisted per-run, no kind or depth exclusions - the exclusion branch an earlier
      pass invented is deleted, not kept as a simplification), `AscensionChallenge.statModifier`'s
      real 25-class table flattened onto this port's 40 ids and gated on its own inert flag, a
      `championEligible` argument true at exactly one call site, `AntiMagic.RESISTS` closed as far as
      this port's feature set allows (23 of ~35 entries wired; the rest are catalogued in
      `PORT_COVERAGE.md` and each is either unported-feature or structurally unreachable), and a
      champion sprite tint from Java's own `CHAMPION_TINT` colours. **Remaining**: `spawnMonster`'s
      tint is a flat-tint stand-in for Java's persistent glow-ring `sprite.aura(color)`; browser
      verification of the tint. See `PORT_COVERAGE.md`'s `ChampionEnemy` row.
- [ ] Implement remaining blob area propagation, gas, and fire terrain. The fire model itself is
      Java's (`Fire.burn()` runs for every burning cell every turn and reignites every creature
      standing in it, `Burning.DURATION` 8 with Java's depth-scaled damage roll, `reignite` vs
      `affect` at the buff boundary), and environmental gas/plant fields use a Java-shaped
      `Blob.evolve()` step. CorrosionTrap and ConfusionTrap seed their real gas volumes. Hero
      backpack item-burning is live for the port's concrete scroll and meat payloads. **Remaining, triaged producer-by-producer 2026-09-17**:
      every missing blob is missing its producer, not its effect table - `SmokeScreen` (**closed 2026-09-19**: the `smokeBomb` item replaces the pre-`v3.3.8` ShockBomb the old tree carried - invisibility brews it, cost 2 - and its blast seeds Java's 40-per-cell distance-2 flood with the 1000-budget center top-up into a persisted blob whose `Level.updateFieldOfView` sight-blocking is ported for hero, mobs, necromancer and fist-teleport sight; **closed 2026-09-19**: the ShroudingFog exotic (brewed 1 invisibility potion for 4 energy, quaff shatters Java's 180-per-cell ring with the center top-up into the same persisted blob - `Potion.apply()`'s default is `shatter(hero.pos)`; no ChaoticCenser trinket), `Inferno`/`Blizzard` (**closed 2026-09-19**: both blobs modeled with Java's evolve halves - inferno reignite/destroy/spread, blizzard double chill, mutual annihilation - and both brews thrown; plus no censer), `Electricity` (**closed 2026-09-17**: ShockingTrap/StormTrap seed Java's real volumes into a persisted blob with the paralyse-by-charge plus odd-charge depth-scaled zap; **ShockingBrew closed 2026-09-19** (craftable, thrown, seeds Java's 20 over the radius-3 flood) and CausticBrew afflicts Ooze over the same flood; ElementalStrike/Blast unoffered, no heap wand-charging (no per-heap wand charge state here); the pylon/Tengu zaps use it as a damage cause only, which the zap path already models; **conduction ported 2026-09-17** (`evolveElectricity`: full-power spread through connected water, minus one per cell, no diffusion), `StormCloud` (no StormClouds exotic, no censer; the Tengu-arena grid belongs to the boss-cycles item), `Foliage` (regrowth grows grass through its charge rules, no blob needed), `VaultFlameTraps` (vault quest unported). Non-gaps: `GooWarn` is unused in Java's own source; `Alchemy`/`WaterOfAwareness`/`WaterOfHealth`/`WellWater` are window flows here by design. Still open as stated: the gas blobs' own effects beyond what's live, the unsupported fire cases,
      and exact blob actor priorities/presentation. See `PORT_COVERAGE.md`'s `BUFF_DURATION` and
      blob-DoT rows. **Complexity: M.**
- [x] Port the Necromancer's skeleton heal/Adrenaline/teleport support behavior, plus `firstSummon`'s
      variable tick cost (browser-verified end-to-end through the real scheduler: a second summon
      advanced its turn by exactly 2 versus 1 for the first). **Correction 2026-09-17: nothing remains open here** - the teleport destination this line called 'any free neighbour' already picks Java's closest-and-in-sight cell (Euclidean, NEIGHBOURS8 tie order; the branch comment says so in past tense). The teleport destination
      is Java's closest-and-in-sight pick. See
      `PORT_COVERAGE.md`.
- [x] Port DM-200's hunting/venting override. Vents toxic gas along a line to the hero from range
      with the real distance-scaled odds, seed amounts and 30-turn cooldown. Browser-verified live.
      **Correction 2026-09-17**: the BFS-around-terrain reachability check and the closing-distance-failed vent retry this line called not modeled are both ported (`dm200CanVent`, `dm200HuntingTurn`).
      See `PORT_COVERAGE.md`.
- [x] Port Spinner's ranged web ability. Roots the hero directly on a clear ranged shot, gated by the
      real 10-turn cooldown. **Correction 2026-09-17**: the persistent 3-cell `Web` terrain blob is ported - only movement-direction prediction is still not modeled. Real Java predicts movement direction and seeds
      a persistent 3-cell `Web` terrain blob alongside the direct root (the root is the impact, the blob the aftermath). Browser-verified live.
- [x] Implement exact Tengu, DM-300, and other boss attack cycles. **Status 2026-09-17:** all five cycles audited turn-by-turn against Java and corrected - DM300 (supercharge freeze/clamp/gate, free ranged abilities, no reset on failed attempts, rolled first cooldown), Tengu (no-chase wait rule), Dwarf King (unbounded P3 reinforcement), Goo (pump discharge on steps and blindness), Yog (beams under fists, fire-then-aim, summon burst, phase-5 clamp, map-wide aim, fire dispel); see the per-boss `PORT_COVERAGE.md` rows. **Closed 2026-09-18:** the three remainders - Yog's aiming turn spends Java's own `gate(TICK, ceil(hero.cooldown()), 3*TICK)` and interrupts auto-travel, the P5 "bleed" is latched as the bar flag Java's `processFistDeath` actually sets (not damage over time), and the King teleports onto `CITY_THRONE` at P1->P2 (Java's `ScrollOfTeleportation.appear(this, CityBossLevel.throne)`; the `IMMOVABLE` pin stays immobile-by-return, stated).
- [x] Port rare monster variants' unique behaviors. Found and fixed a whole class of bug: a variant
      never inheriting its base kind's special mechanic because a check tested the literal `kind`
      string instead of the family relationship Java's class extension implies - `ArmoredBrute`
      (enrage/revival with `HT/2+1` and 1/3-turn decay), `DM201` (DM200's vent, and `IMMOVABLE`),
      `Senior` (Monk's Focus regain - whose fix also surfaced that the regain check sat after the
      `distance === 1` early return, so a meleeing Monk never regained at all), `SpectralNecromancer`
      (bolt/summon/support), `Bandit` (fleeing after stealing, and the stolen item being recoverable
      when killed) and `Acidic` (melee retreat, ranged attack, Scorpio's 50% cripple). `Slime`'s
      incoming-hit soft cap was missing for the base kind too, now ported for both. See
      `PORT_COVERAGE.md`'s Brute/DM200/Monk/Necromancer/Thief/Scorpio/Slime rows.
- [x] Implement Java corpse, meat, gold, loot-stack, and limited-drop behavior. `Dungeon.LimitedDrops`
      decay is real for `bat`/`necromancer`/`guard`/`dm200`/`golem`/`shaman` (with `dm200`/`golem`'s
      base chance corrected to the real `0.2`), and `slime`/`skeleton`/`thief`/`swarm` have real
      `MOB_LOOT` entries and decay. Wealth rings' `tryForBonusDrop()` half is ported (section 1).
      **Remaining**: stacking heaps, and dm200/golem's real weapon-or-armor 50/50 pick (simplified to
      always-armor). See `PORT_COVERAGE.md`'s `MOB_LOOT`/`LIMITED_DROP_DECAY` row.

## 6. Complete hero progression

- [x] Implement exact formulas for the remaining talents. Six wrong-shaped stand-ins have been
      corrected against the real source (Lethal Haste, Weapon Recharging, Farsight, Arcane Vision,
      `POINT_BLANK` - an accuracy factor and nothing else, applied inside `adjacentAccFactor` - and,
      in the 2026-09-09 audit, Hearty Meal, Sucker Punch, Aggressive Barrier and the per-tier
      talent-point pools, which had wrongly been one shared pool). Test Subject/Tested
      Hypothesis are port-original talents, kept deliberately (see `PORT_COVERAGE.md`'s talent
      row: absent from `Talent.java` and the `actors` strings at `v3.3.8`/`v4.0.0`/master);
      Swift Equip is genuine. `Iron Will`'s invented flat-damage-reduction stand-in is
      replaced by the real `BrokenSeal` shield mechanic. Cleric's entire talent tree is Mage's copied
      verbatim, documented as such in `src/talents.ts`, not replaced - a real tree needs the Cleric's
      own Holy Lantern/spell mechanics first. **Progress 2026-09-18: a whole missing talent class
      found and half-closed.** Every class's real tier-3 pool is Java's own fixed class-wide pair
      (`initClassTalents`) *plus* the chosen subclass's three (`initSubclassTalents`, a separate
      call writing into the same map) - this port's table carried only the subclass three for
      all 10 subclasses, silently dropping 10 real talents (`HOLD_FAST`/`STRONGMAN`,
      `EMPOWERING_SCROLLS`/`ALLY_WARP`, `ENHANCED_RINGS`/`LIGHT_CLOAK`, `POINT_BLANK`/`SEER_SHOT`,
      `PRECISE_ASSAULT`/`DEADLY_FOLLOWUP`). All 10 are now in the table; `STRONGMAN` and
      `POINT_BLANK` needed no other code (their formulas were already written and simply
      unreachable - the same "ported ahead of the table row" pattern found three times over),
      and `HOLD_FAST`/`PRECISE_ASSAULT`/`DEADLY_FOLLOWUP` are newly wired. See
      `PORT_COVERAGE.md`'s dedicated row for the exact formulas and the browser verification.
      **Remaining**: `ENHANCED_RINGS`, `LIGHT_CLOAK`, `EMPOWERING_SCROLLS`, `ALLY_WARP` and
      `SEER_SHOT` each need a mechanic this port doesn't have yet (a ring-effective-level buff,
      a Cloak-of-Shadows charge-rate hook usable unequipped, a wand-zap level bonus, an
      ally-swap-at-range interact, and empty-cell map-reveal targeting), plus everything already
      blocked on systems this port lacks (SoulMark/Wraith for Necromancer's Minions, a real
      Cleric tree; `durable_tips` dropped off this list 2026-09-17 - tipped darts are live).
      **Progress 2026-09-19: all five named mechanics are now wired, each through the seam this
      port actually has.** `EMPOWERING_SCROLLS` arms 1/2/3 +3-level zap charges on any scroll
      read (Mage) and resolves them through `effectiveZapLevel()` (damage, corrosion, chill,
      blast-wave push, prismatic daze, excess-charge shield, regrowth/fireblast/transfusion
      helpers, and disintegration's targeting range previewed prospectively); `ENHANCED_RINGS`
      arms 3/6/9 turns of +1 ring upgrade on any artifact use (Rogue) read through
      `effectiveRing()` at every formula site; `LIGHT_CLOAK`'s cross-hero 7/13/20% artifact
      charge bonus is folded exactly into every passive charge gain (its Rogue unequipped-use
      half is satisfied by construction - a carried cloak is always usable at the full
      equipped rate, which is the stated divergence from Java's refusal); `ALLY_WARP` swaps
      the Mage with a bumped non-immovable ally at 2/4/6 range, free like every other ally
      order; `SEER_SHOT` reveals the landing cell's 3x3 (explored plus a timed
      creature-visibility layer, vision not search, so no secret discovery) on thrown and bow
      attacks with the flat 20-turn cooldown. All four new state fields persist through
      save/load; the five formulas are pinned in `test:simulation`. What stays open here is
      only what was already systems-blocked (SoulMark/Wraith, the Cleric tree, the
      `monastic_vigor`/`twin_upgrades` stand-ins needing Monk energy/dual-wield).
      **Methodology note worth keeping, amended 2026-09-18**: check `src/generated/spdMessages.ts`'s own real
      `actors.hero.talent.*` strings before concluding a talent id is invented - an earlier audit
      checked only two Java tags and wrongly declared several real talents fabricated - but catalogue
      presence alone does not prove upstream existence either: Test Subject/Tested Hypothesis ship
      full catalogue text in all 19 locales yet exist in no checkable Java source, so the final
      check is always the Java code/tags themselves. See
      `PORT_COVERAGE.md`'s talent rows. **Complexity: L.**
- [x] Implement rune transfer and shared-enchantment behavior. **Closed 2026-09-17: both named halves were already live - the "rune transfer" title has no other referent in code, coverage or Java's hero/talent sources (the only "rune" there is the Runestone/Recall-Inscription line), so it reads as the bow-enchantment transfer `shared_enchantment` performs.** Sniper's `shared_enchantment` proc is
      live for thrown hits with Java's `Random.Int(3) < points` gate and explicit ranged attack
      provenance; Warden's `durable_tips` is live in `missileDurabilityCost()` via `tippedDartUseDivisor` (the "waits on a real TippedDart item" premise was stale - tipped darts exist as `tippedSeed` payloads, shop stock and wielded ammo), verified against `TippedDart.durabilityPerUse()` (`use /= (1 + points)`, rot exempt). The three places that repeated the stale premise (`src/talents.ts` comment, two `PORT_COVERAGE.md` rows) are corrected in the same pass.
- [ ] Complete subclass and armor-ability effects. The authored `armorAbilities` table carries all 18
      real `HeroClass.armorAbilities()` entries (base charge use, targeting mode, three tier-4
      talents each); the King's Crown's own `WEAR` action opens SPD's real choice panel, with
      `ClassArmor.upgrade()`'s state changes (charge starting at Java's 50, the four rank-4 talents
      registered, `Hero.talentPointsAvailable(4)`'s exact curve) and the charge meter regrowing at
      `ClassArmor.Charger`'s `100/500` per tick times the Ring of Energy multiplier. **Thirteen
      abilities are fully ported, formulas included (browser verification owed for the newest,
      per section 10)**: the Warrior's Heroic
      Leap/Shockwave/Endure, the Rogue's Death Mark, Smoke Bomb and Shadow Clone, the Huntress's
      Spectral Blades/Nature's Power/Spirit Hawk, the Mage's Warp Beacon, the Duelist's Feint,
      Challenge and ElementalStrike.
      **Progress 2026-09-19:** `ElementalBlast`'s pure arithmetic (per-wand factors, `ELEMENTAL_POWER`/`BLAST_RADIUS`, aim, damage, Transfusion splits, Corrosion, nine buff durations, Regrowth chance, knockback, `REACTIVE_BARRIER`) is ported and pinned (`simulation/mageAbilities.ts`, `tools/verifyArmorAbilities.mjs`), but the ability stays unoffered - firing reads the wand off an imbued `MagesStaff`, and the imbue system does not exist here.
      **Progress 2026-09-19 (20th matrix, `MONSTER_ANALYSIS_SHADOWCLONE.md`):** `ShadowClone` is
      ported - 80-HP `ShadowAlly` with Java's accuracy/evasion/damage/armor formulas, summoned or
      directed through the shared ally orders; only the gear-proc shares, double-speed return,
      interact range and sprite stay open.
      **Progress 2026-09-19 (21st matrix, `MONSTER_ANALYSIS_CHALLENGE.md`):** `Challenge` is
      ported - paired 10-turn duel with spectator freeze, close-the-gap blink, damage ledger,
      victory heal and re-challenge discount, all with Java's numbers; bomb/trap/blast negation
      on frozen spectators stays open. **Still open, and deliberately not offered**
      (`armorAbilitiesFor()` offers only what can actually run, so a class with none keeps the
      crown's old description line rather than an empty choice): the remaining two abilities
      (Mage's two) each need a system this port does not have. **Narrowed 2026-09-19 to the real
      shared root cause, checked directly against both abilities' Java source**: this port's
      hero carries at most one `wand` bag entry at a time (`dungeonScene.ts`'s `wandType: WandType`
      is a single scalar field, `equipWand` always writes the one stackable `id: 'wand'` bag
      slot) - but per-instance wand *identity* already exists here (`id: 'wand'` entries
      carry their own `instanceId` plus `sourceClass`, several can coexist, and a carried
      wand names its own class): what does not exist is per-instance *charges*, a single
      shared `wandCharges` pool serving the wielded scalar while ground pickups absorb
      (`wandabsorbed`). Corrected 2026-09-19: identity exists, charges do not. Both
      abilities are built directly on Java's opposite assumption: `MagesStaff.imbueWand()` lets
      the Mage attach *one of several carried wands* to the staff (`WndBag.ItemSelector` picks
      among them), and `WildMagic.activate()` literally fires `hero.belongings.getAllItems(
      Wand.class)` - every distinct wand the hero owns, shuffled, up to 4. Neither is offerable
      without first giving each carried wand its own charge pool and recharge, which is a
      change with a wide blast radius (the single `wand:` save entry, the shared recharge
      tick, Wand Preservation, Magical Holster's bag row and every refund targeting the one pool) - not scoped to these
      two abilities alone, so this is recorded as the actual blocker rather than the vaguer
      "staff-imbue system"/"wand-randomization pass" phrasing this line carried before. The
      Cleric's three have neither strings nor a spell system here.
      **2026-09-19**: `ClassArmor` as a distinct item is ported - the crown choice and the Rat
      King exchange convert the worn armor to the hero's per-class subclass id (named from SPD's own keys, Cleric via `port.*` with tag-`v3.3.8` translations), keeping tier/level/glyph/curse and the Warrior's seal; still open and stated are `AC_TRANSFER` and the class-armor sprite tier. Ratmogrify is fully ported since 2026-09-19 (its own
      `class: "any"` row opens the tier-4 tab and `RATLOMACY`/`RATFORCEMENTS`
      run, and `RATSISTANCE`'s `0.9^points` factor rides the attack multiplier with a stated
      rounding note). See
      `PORT_COVERAGE.md`'s armor-ability section for the per-ability reason. **Complexity: L.**
- [x] Match Java talent timing, identification, recharge, and threshold rules. Tier-4 threshold
      timing is now real (the tier's window, its `armorAbility == null` gate and its point curve are
      Java's `Hero.talentPointsAvailable(4)` rather than the earlier "T4 is never granted"
      simplification), and Test Subject/Tested Hypothesis now proc on every identify event
      through one shared helper (2026-09-18). **Closed 2026-09-19**: Java's `onTalentUpgraded`
      rank-2 identify of *already-equipped* gear (Veteran's/Thief's/Adventurer's Intuition) is now
      wired too (`identifyOnTalentUpgraded`), now that equip/unequip tracks a real identified
      state to change (see the item-system's equip-identify bug fix, same date) - reaching rank 2
      identifies the currently-worn piece immediately rather than waiting for the next equip, and
      chains into Test Subject/Tested Hypothesis the same way any other identify does. Rank 1's
      Thief's Intuition `setKnown()` (ring type known, level/curse still hidden) stays unported -
      this port's binary `identified` ring model has no separate type-known state. Recharge talents
      (Weapon Recharging, Wand Preservation, Empowering Scrolls) and the per-tier threshold windows
      were already exact from earlier passes. See `PORT_COVERAGE.md`'s equip-identify row.
- [ ] Complete class-specific item and ability behavior. `SuckerPunchTracker` is ported (the Rogue
      surprise bonus uses Java's `Random.IntRange(points, 2)` once per stable enemy, with save/load
      and death cleanup). **Closed 2026-09-18, two halves**: Nature's Power now speeds the bow
      itself (`SpiritBow.speedMultiplier()`'s `+= (8 + GROWING_POWER)/24` as a bow-shot-only
      turn-cost divisor), and the bow branch's leftover `1 + 0.2*rank` Point Blank *damage*
      bonus is deleted while gaining the real accuracy factor (Point Blank is accuracy-only
      in Java - the 2026-09-15 correction had fixed the throw path but missed the bow).
      `SpiritArrow`'s infinite-accuracy clause stays unported as a correct-by-construction
      non-gap (it needs a bow augment plus a sniper special, neither of which exists here).
      The rest of this line is open. **Complexity: M.**
- [x] Port the `BOSS_CHALLENGE` badge set - the weapon-only boss kill. **Closed 2026-09-17: both halves this line called missing were already live, and only the documentation said otherwise.** The five badge rows exist (`boss_challenge_1..5` in `src/content/badges.mwl` - the "no `BOSS_CHALLENGE` rows" claim was stale, as was the `src/badges.mwl` path, which is really `src/content/badges.mwl`), the flag is set at all five fight starts, the damage-*source* notion the line said was missing is threaded (wand branch, unarmed branch, bomb seam, armor-ability seam, all clearing through `disqualifyBossChallenge`), and the award fires at each boss's death with the flag persisted through save/load. This was recorded for a while
      under section 7's seed/dew item as "the Dwarf King's boss-challenge-badge flag", which it is
      not: it is Java's `Badges.Badge.BOSS_CHALLENGE_1..5`, awarded at a boss's death while
      `Statistics.qualifiedForBossChallengeBadge` is still set. The flag is set true at all five
      boss fights' starts (`CavesBossLevel`/`CityBossLevel`/`HallsBossLevel`/`PrisonBossLevel`/
      `SewerBossLevel`'s own `progress()`/`seal()`, all tag `v3.3.8`), cleared when the hero deals
      boss damage that is *not* a plain weapon hit - `DwarfKing.java` 459-467 clears it on an
      unarmed hit without `RingOfForce.fightingUnarmed`, on any `Wand` except `WandOfLightning`, and
      on a `ClericSpell`, with `Goo`/`DM300`/`Pylon`/`Tengu`/`YogDzewa` each carrying their own sites
      - and read at that boss's death. Original text follows (superseded by the close-out above; kept for the rule description). The badge entries themselves
      (this port's `src/badges.mwl` is deliberately its own smaller set - one boss badge per chapter,
      no `BOSS_CHALLENGE` rows), and the clearing half's damage-*source* notion, which this port's
      inline monster-damage paths do not thread today. **Complexity: M** for that second half; the
      five badge rows and the award are S on their own.

## 7. Replace simplified terrain and status mechanics

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because other bullets in this file cross-reference "section 7" by number; renumbering everything
below to close the gap was judged not worth the churn against those existing references.

## 8. Complete UI and input parity

- [ ] Port full inventory, bag, sub-bag, item-detail, and item-use windows. Item-detail (real
      per-item descriptions, resolved through `inventoryPanel.ts`'s MWL description tables, each a
      real authored Java `.desc` key) and item-use (activation for food/potions/scrolls/rings/armor/
      wands) are both already done. The four bags (VelvetPouch/ScrollHolder/PotionBandolier/MagicalHolster)
      now exist as ownable, named, priced, unsellable goods with the real shop pick (resale
      refused per `Shopkeeper.canSell`'s `unique` rule, 2026-09-18) - and three container-half
      stat effects are live in the same pass (the Holster's recharge/durability factors off
      ownership, the full `validateAllBagsBought` badge set). What stays open is the structural
      container behavior (contents, `grabItems` on pickup, capacity, an open action), not their existence. **Progress 2026-09-19: the open action is now live** - using a bag opens the bag window on its own filtered tab (`bags.ts`'s `bagTab`, routed through the item-action table, pinned in `test:items`); velvet opens the velvet-named runestone tab with seeds one tap away. **Progress 2026-09-19 (later same day): `grabItems` routing and capacity are live** - `bagFitsPickup` ports `Item.collect()` over the flat bag (19-stack sub-bags in fixed order, 20-stack backpack excluding sub-bag contents, merges and bags always fit, silent refusal with the heap kept), wired into every ground-pickup path including the six equipment callbacks. Per-bag contents arrays stay open as the documented stand-in (the filtered tabs already show the same contents). See `PORT_COVERAGE.md`'s bag row.
      **Complexity: M.**
- [x] Implement click-to-travel (`repeated movement`) - a player-reported bug: clicking a distant
      tile previously only produced a single step. Now queues the target and walks the real
      pathfinder's route one step per turn through the existing `awaitHeroInput` hook, matching
      Java's real interrupt conditions (taking damage, or any awake hostile creature coming into
      sight - checked broadly rather than Java's narrower "newly seen" case) and cancelling cleanly
      on arrival or any manual keyboard action. Browser-verified live. **Remaining**: cell targeting
      and the path-preview visual (the line/highlight while aiming).
- [x] Fix the title screen's banner art. The redrawn three-line "MWG Pixel Dungeon" logo was cropped
      by a frame rect sized for the old two-line art and its torches sat asymmetric against the
      narrower text. Fixed: frame height 90->108, torch x-offsets recentred on the glyph midpoint,
      and the whole group shifted as a rigid unit (measured 1px off centre at 1078px width). See
      `PORT_COVERAGE.md`'s title-screen row.
- [x] Complete the journal UI and identification tabs (simplified). The MWG window exposes Guide,
      Notes and Items tabs with paged paragraphs, translated labels and known/unknown entries. This
      port persists identification on item instances rather than Java's run-wide class journal; the
      remaining Java-specific unlock rules stay documented in `PORT_COVERAGE.md`.
- [x] Port pause/menu chrome, boss banners, toast animations, and Java-style transitions. Checked
      against tag `v3.3.8` - the four parts are not one job. *Pause/menu chrome*: done - `WndGame` is
      a real in-game `Window` on a `WindowStack`, opened by the back key and by a new toolbar entry,
      with Java's real entry list (Settings; Challenges when carried; Start + Rankings once dead;
      save-and-exit, disabled while the intro is unfinished) at Java's 120/20/2 geometry, verified
      live by `tools/scratch/game-menu-livecheck.mjs`. *Boss banners*: ported - Java's
      `GameScene.showBanner` has exactly two users (`bossSlain()`'s `BOSS_SLAIN` sprite and
      `gameOver()`'s `GAME_OVER`); there are no level-up or quest banners in v3.3.8. The widget is
      `src/ui/banner.ts` over `src/ui/bannerState.ts`, art cut from Java's own sheet, wired at both
      sites and pixel-verified live (including a deliberate divergence: `ui/banner.ts` clamps its own
      step to 1/20s so a synchronous floor build cannot freeze the band at alpha 0.78). *Toast
      animations*: not applicable as designed - `ui/Toast.java` is used only by
      `GameScene.selectCell()`'s prompt, and this port's targeting is creature-based. *Java-style
      transitions*: the interlevel curtain exists and reproduces Java's totals (0.33 in / 0.67
      steady / 0.33 out, 1.66 on a new region) but hand-computes its fades. **P8's
      `ScreenEffects.sequence` is deliberately NOT adopted here, resolved 2026-09-16**: it is a
      flat colour wash, and this curtain is a five-stop gradient - adopting it would simplify the
      code by deleting the gradient, which is a fidelity loss, not a win. **The same read turned up
      a real divergence, now recorded rather than claimed as matching**: Java's arrival is two
      layers, not one - `GameScene.create()`'s trailing `fadeIn()` (a `PixelScene.Fader`: a
      full-screen black wash clearing over `FADE_TIME = 1f`, which is the P8-shaped part) *plus*
      the loading scene's rotated gradient veil, whose own
      alpha is driven by a custom `update()` that peaks at **0.666** (`2*(timeLeft - (fadeTime -
      0.333))` during FADE_IN, `2*(0.333 - timeLeft)` during FADE_OUT) and is forced to 1 only for
      the final vault's `lastRegion == 6`. This port collapses both into one gradient and drives it
      1 -> 0, so its veil is darker than Java's ever gets, and it additionally fades the loading
      text with `1 - curtain.alpha`, which Java does not animate at all. Also unmodelled:
      `FAST_FADE` (0.50 steady, a total of 1.16s) for revisiting an already-seen depth or any
      ascent - the port only distinguishes normal from slow.
- [x] Implement large interface-size layouts. **Closed 2026-09-19:** the toggle
      (`toggleInterfaceSize`), `StatusPane`'s 1.5x pane/bar scaling, `GameLog`'s Java-real
      3-line small / 5-line large split, the real `ui_large_buffs.png` icon sheet,
      `BuffButton`'s per-icon countdown/fade overlays, and - last - `InventoryPane`'s
      wide bag layout are all live. Large mode switches the bag
      grid to Java's own 10-column arrangement (5 equipped leading, the 20-item page
      after, padded to three full rows in a 302-wide window), with the footer and
      right-edge chrome re-anchored and the narrow 5-column geometry provably unchanged
      (pinned in `tools/verifyBagLayout.mjs`, including byte-level narrow positions).
      The window stays this port's own tabbed popup rather than Java's bottom pane -
      that structural difference is the standing bag-UI simplification, not a gap in
      this line. See `PORT_COVERAGE.md`'s `SPDSettings.interfaceSize()` row.
- [x] Port the hero information window, busy indicator, talent animations, and quick slots.
      **Closed 2026-09-18**: all four named things turn out to already be live, or ported in this
      pass, once checked individually. Quick slots were already live (`toolbar.ts`'s auto-assigned
      `Q1..Q4` buttons over the scene's `quickslot0..3` actions) - the line's own wording was
      stale. The busy indicator is a stated, deliberate text-stand-in (`statusPane.ts`'s `busyPip`,
      no `CircleArc` primitive here) rather than an unstarted port. `WndHero`'s own shell
      (Stats/Talents/Buffs tabs) does not exist as one window, but each tab's *function* does: the
      avatar's flat stat popup, the toolbar's talent-spend window, and `WndInfoBuff`'s click-to-info
      on every status-pane buff icon (`ui/buffInfo.ts`, `ui/buffInfoWindow.ts`), with the real
      name/description and the `{0}` turns-remaining substitution, browser-verified live in French.
      **Talent animations** (`StatusPane.talentBlink`): Java tints the whole avatar yellow with a
      cosine pulse for 10s after a talent point becomes available (`Hero.java`'s level-up grant,
      `GameScene`'s per-floor unspent-point check, `PotionOfDivineInspiration`), clearing early once
      the WndHero talent tab is opened regardless of whether the point was spent. This port has no
      avatar-tint layer for *any* state yet (the low-HP pulse isn't ported either), so a static
      yellow corner dot stands in for the animated tint - and, per this project's "iso is no longer
      the goal" policy, it tracks the real unspent-points state directly (`talentPoints.some(p =>
      p > 0)`) rather than Java's expiring 10s timer, so it cannot go dark on an unspent point the
      way Java's clock can. Browser-verified live: a pixel diff between the dot-off and dot-on
      states shows the exact 0xffee00 dot appear/disappear at its intended corner position and
      nowhere else. See `PORT_COVERAGE.md`'s `WndInfoBuff` and `StatusPane` rows.
- [ ] Complete sprite/effect animations. (Split 2026-09-18: the armor-dependent hero
      portrait half is closed - `statusPane.ts` now draws `HeroSprite.avatar()`'s exact rule,
      the class sheet's own `(1, tier*15, 12, 15)` cell under Java's 0..6 clamp, with tiers
      0/6 and the `HeroDisguise` swap recorded unreachable rather than missing.
      **Correction, 2026-09-19: "the animation half...has no renderer seam" was stale.** A real
      seam (mwg's `AnimatedSprite`) already exists and is already driving `idle`/`run`/`attack`/
      `die` clips for both monsters and the hero (`SPRITE_ANIMATIONS`, extracted from the real
      Java sprite classes' own four-clip set - `idle`/`run`/`attack`/`die` genuinely is Java's
      whole per-monster clip vocabulary, checked directly against `RatSprite.java` et al., not an
      arbitrary four this port picked). **Closed the same day: `CharSprite.flash()`**, the brief
      full-white hit pulse `Char.attack()` fires on every landed hit alongside the damage number -
      this port had a half-built fade-out for it already (`colorAdd`, cleared every frame) but no
      trigger anywhere, so nothing had ever actually flashed. Wired the trigger into `showDamage`
      (the one shared choke point every damage-application site already calls), and fixed a real
      bug the fade-out's own unconditional reset caused: an ally's persistent identity tint
      (`allyIdentityColorAdd` - Sheep/EarthGuardian/Lotus/etc., the same `colorAdd` channel) was
      being wiped to 0 on literally the first frame after spawn, before this pass even added the
      flash trigger, since the fade-out never knew a non-zero baseline could be legitimate. Live-
      verified: a flashed Sheep now fades back to its own tint, not to nothing. **Closed 2026-09-19, the shake half**: all 41 Java shake sites audited (see PORT_COVERAGE.md) - 8 missing wirings added, the short refusal shakes documented, the rest tied to unported features; pinned by `tools/verifyShakes.mjs`. **What remains
      here, genuinely**: particle-class effects beyond floating text and the flash
      (spell-cast bursts, wand-zap trails, on-death particle bursts specific to certain monsters) -
      not yet audited monster-by-monster, so still recorded open rather than assumed closed.
      **Complexity: S** for what's left, down from M now that idle/run/attack/die/flash are done.
- [x] Audit every static `t('port.*')` call site against `portStrings.ts`'s EN/FR tables. A script
      walk found 45 keys missing from EN and 47 from FR - all fixed (window titles, victory/defeat
      screens, `port.action.bag`/`port.talent.*`, ~20 combat log lines), plus two French-specific
      bugs a player caught live ("bolt" mistranslated as `trait`, and a subject-first rewrite to
      avoid a bare "de {who}"). Follow-ups the same session closed two more classes of the same gap:
      the dynamic template keys (`port.armor.*`/`port.subclass.*`/`port.affix.*`, all missing), and
      the 33 `this.say('English', ...)` calls that skip `t()` entirely and so are invisible to a
      literal-key audit. **Note for future work**: the audit script only catches literal
      `t('port.…')` arguments; dynamic template keys need a manual check.
- [x] Translate the port's own strings into every Java locale. All 19 offered locales carry a
      complete `port.*` catalogue and all were verified live in a real browser per locale (locale
      active, every non-ASCII codepoint drawing a real glyph rather than tofu, both screens
      differing from English). Every catalogue is a machine draft marked `MT`/`unreviewed` in its own
      doc comment, matching SPD's own complete/unreviewed/unfinished convention - a machine-assisted
      draft is not silently promoted to `complete`. `i18nCheck` compares every registered catalogue
      (key set + `{placeholder}` tokens) against EN and asserts each has a provenance entry and a
      real `LANGUAGES` code, so the drift that let five catalogues fall 24-31 keys behind cannot
      recur silently. **Remaining, and the only reason this box is unticked**: the locale *set* is
      SPD `v2.1.4`'s 19, so `be`/`eo`/`sv`/`zh-hant` are offered by neither `LANGUAGES` nor
      `tools/i18n-extract.mjs`. Closing that means regenerating `spdMessages.ts` from `v3.3.8`, which
      is not a strings-only change - or was not: **the eight removed keys are closed
      2026-09-17**. All eight (`actors.mobs.dm300.rocks`/`.vent`,
      `items.quest.pickaxe.ac_mine`/`.no_vein`, `levels.level.sign_desc`/`.sign_name`,
      `scenes.titlescene.badges`, `windows.wndjournal.notes`) now live under `port.*` with
      SPD's own translations in all 19 locales, every call site (both DM300 lines, both
      pickaxe lines, the MWL action row, both sign lines, all three journal tab lines, the
      title-screen badges button) is re-pointed, and the old names are referenced nowhere.
      That same regen must also preserve the two port-original talent string sets
      (`actors.hero.talent.test_subject.*`, `actors.hero.talent.tested_hypothesis.*` - see
      the talent row: no SPD source has them, so a source-faithful regen would silently drop
      both talents' names and descriptions in all 19 locales; carry them explicitly, ideally
      migrated to `port.*` keys).
      The same pass cleared six more source keys that resolved in no catalog at all (the
      real huntress `spirithawk.no_space`, the real recycle `inv_title` with an open-always
      picker, the generic `armorability.no_target` for both abilities - see
      `PORT_COVERAGE.md`), so the transactional audit is green again.
      The reverse gap exists too: `levels.hallslevel.exit_desc` (addressed by the section 3 city
      visuals) exists at `v3.3.8` but not in this catalogue, so the port answers with the City exit desc there until the regen lands.
      **Closed 2026-09-19: the locale set is now the real 22.** `be`/`eo`/`sv`/`zh-hant` are
      offered by `LANGUAGES` with `Languages.java`'s real `v3.3.8` statuses (`be` unfinished,
      `eo` complete, `sv`/`zh-hant` unreviewed), and `tools/i18n-extract.mjs` ships them via a
      second, optional `--legacy-spd-root` pointed at a `v3.3.8` checkout - the live checkout's
      own current branch is *older* than `v3.3.8` (pre-`v2.5.3` bomb family) and carries pre-`v3.3.8` keys `v3.3.8` dropped or renamed (`alchemicalcatalyst`, `flashbang`/
      `shockbomb`, `aquablast`) but has dropped these four locale files entirely, so a single
      `--spd-root` cannot serve both; the primary root stays the live checkout (preserving that
      dropped content the port still ships) and only these four locales fall back to the legacy one. Left unset,
      `--legacy-spd-root` degrades gracefully - those four locales simply ship empty and fall
      back to English, so the tool still works offline with zero args changed from before.
      `detectLanguage` also gained Java's own `Languages.matchLocale` special case: a bare `zh`
      primary subtag always resolved to Simplified before, so a `Hant` script subtag anywhere in
      the preference now routes to `zh-hant` first, matching `locale.toString().contains("Hant")`.
      Browser-verified live for all four (title screen + Settings window, real non-ASCII glyphs
      throughout, Settings' still-untranslated `port.*` strings honestly falling back to English
      per the stated port-strings gap). `i18nCheck`'s two placeholder assertions for this gap
      (`zh-Hant-HK falls back to zh`, `eo stays absent`) are updated to their real, now-passing
      expectations. See `PORT_COVERAGE.md`'s i18n row. **Complexity: M.**
- [x] Port the audio-settings mutes. **Closed 2026-09-19 (added with the item itself - no
  roadmap line covered `WndSettings`' audio tab):** the settings window grew Java's real
  `AudioTab` title plus its two mute rows (`music_mute`/`sfx_mute`, SPD's own strings in
  every locale, `Window.TITLE_COLOR` headers like Java's `title.hardlight(TITLE_COLOR)`),
  backed by `SPDSettings`' own `music`/`soundfx` persisted flags (`src/settings.ts`) gating
  the single `SpdAudio` choke point every cue and track already funnels through. Muting
  music stops it at once; unmuting replays the standing request (a deliberate improvement -
  Java waits for the next scene to start something). **Extended 2026-09-19 (Java-line
  settings pass):** the 0-10 volume sliders (`music_vol`/`sfx_vol`, Java's quadratic
  curve, live music re-glide + per-playback sfx scaling), the `music_bg` background-play
  toggle (conditional music suspend), `DisplayTab` brightness (Java's `FOG_COLORS` alphas,
  live fog re-render) and screen-shake steppers (0..4 multiplier, default 2 - correcting
  the "default 1" the coverage file previously claimed), and the `UITab` vibration toggle
  (persisted, model-only), all as `- value +` steppers / `✓` toggles under Java's own
  labels (no slider widget in this port). All values re-checked against Java
  (`SPDSettings.java`/`FogOfWar.java`/`PixelScene.java`, tag `v3.3.7`). **Still unported**:
  the Keys/Data tabs and grid/follow behavior. See `PORT_COVERAGE.md`'s audio row.
  **Complexity: S.**
- [x] Manage the dungeon camera zoom. **Closed 2026-09-19 (added with the item itself - no
  roadmap line covered `SPDSettings.zoom()`):** the persisted integer offset (Java's own
  `zoom` key, default 0) drives the dungeon camera as `3 + offset`, adjustable with Java's
  own `+`/`-` keys (numpad twins included) and a port-original `- level +` row under the
  settings window's real `DisplayTab` title - Java has no settings row for zoom (desktop
  zooms with keys, mobile with pinch), so that row's chrome is new while the preference
  underneath is ported. A mid-run change re-zooms the live camera through a subscriber,
  no scene rebuild. **Stated simplifications**: the offset gate is a fixed `[-2, +3]`
  (Java's is screen-derived around a density-derived default), and pinch-to-zoom stays
  unported. See `PORT_COVERAGE.md`'s camera row. **Complexity: S.**

## 9. Build the Java-vs-TypeScript parity harness

**Status check**: none of these six are done in the literal sense this section asks for - an actual
differential harness running both the real Java build and this port side by side against identical
seeds/traces - and none should be marked `[x]` on the strength of what already exists. What does
exist, so the gap is the real remaining one rather than a from-scratch build:
`tools/verify*.mjs` (wired into `test:simulation`, 118 simulation + 7 banner + 36 vault + 6 overlay checks as of 2026-09-19) already pin combat rolls, damage
curves, buff timing and turn-cost/scheduling - but as *values checked against a transcription of the
Java source*, not against a running Java build, which is the bar "compare both implementations"
sets. **Unblocked 2026-09-19:** the suite aborted at hunger for a day (stale STEP=10 expectations left behind by the STEP 1 fix), hiding every check after it - syncing those expectations un-hid three more stale sets (buff-fixture poison stream, MINIBOSS/BOSS comment-regex + sets, hero-turn/hero-actions hunger math) and, in the miniboss case, a real data bug (Eye/Warlock/plain-Elemental over-looted on boss wealth tiers Java never gives them). The full suite passes for the first time. `PORT_COVERAGE.md` already does the sixth bullet's classification row by row, as a running
narrative rather than one finished audit pass. Screenshot/animation-timing comparison has real
infra (pixel-hash probes, per-feature `*-livecheck.mjs` scripts) but only for the things those
scripts targeted. **Triage 2026-09-17:** the Java side is real and runnable after all - the
SPD checkout's `desktop:runHarness` task (Temurin JDK 21, offline Gradle build green) dumps 36
reference blocks (4 seeds x depths 1-9: room graph plus paint maps), and `npm run parity:levelgen`
diffs this port's own generator against them (`tools/levelgenParity.ts`, standalone - it needs the
Java checkout, so it stays out of `verify`). Settled result: 26/28 on depths 3+ fully identical
(feelings, exact room-rect sets, painted maps); the 2 remaining diffs are seed999999999999/depth9
(207 cells, water/grass/door/trap cascade with matching graph - first divergence is grass at row 2,
then door picks at rows 7/18/22) plus one structural outlier, seed42/depth8
(different dims, disjoint rects - but the same room-kind multiset, so selection matches and only
placement/sizing diverges). Fixed since the 22/28 count: all four depth-5 Goo arenas (arena
`center()` spawn draws, `GooBossRoom.canMerge() == false`, Diamond/Walled `canPlaceWater() ==
false` - see PORT_COVERAGE.md). Depths 1-2 print as UNSTABLE and stay out of the count: Java drops
the guidebook pages with an intentionally unseeded generator, so even Java-vs-Java is not
reproducible there (the heap shifts `paintGrass` draws). Probe details: TS room-kind labels ride
on `PortedFloor.rooms` for kind-level triage, and both sides rtrim trailing chasm before the
cell compare. **Progress 2026-09-18**: RNG-call-order comparison (bullet 2 below) is no longer
unstarted for levelgen - it was wired but silently broken, reporting a false divergence at
draw 0 on *every* floor including the 26 that already had matching output. Two real bugs fixed:
the trace log's own text was wrong for every 32-bit draw (signed-vs-unsigned formatting, not an
RNG bug - see `PORT_COVERAGE.md`), and `generateFloor()` was genuinely burning `spdSeedForDepth`
twice per floor (a redundant pure re-derivation, harmless to shared state but doubling the
trace). With both fixed, all 26 matching-output floors on depths 3+ are now confirmed
`TRACE-IDENTICAL` - true RNG-call-order equality, not just coincidentally-matching final maps -
and the two still-open floors have exact divergence draw indices: seed42/depth8 at draw 321,
inside `RegularBuilder.createBranches`'s per-branch retry loop (Java takes three consecutive
extra `bits=31` draws there that this port does not, then both sides resync perfectly for the
rest of the floor); seed999999999999/depth9
at draw 22626, inside `paintMazeConnection`'s maze-growing loop. **Narrowed 2026-09-19, a dead
end recorded so it is not re-walked**: the seed42/depth8 gap traces to `createBranches`'s
SecretRoom-vs-ConnectionRoom retry guard needing `roomsToBranch[i]` to be a real secret room at
that index in Java but not in this port for this seed/depth, despite byte-identical draws up to
that point - a content (which room is secret) question, not an algorithm one. `createSecretRoom`'s
own selection algorithm was checked against it too and found to not match tag `v3.3.8`'s real
`SecretRoom.createRoom()`, but implementing that literal algorithm regressed the whole suite
26/28 -> 13/28 (depths 3+), proving this port's actual levelgen RNG reference is not `v3.3.8` for
that call and the existing "min of 4 rolls" shape - despite its uncited comment - is the
empirically correct one; left unchanged. seed999999999999/depth9 carries the same signature
(short exactly 3 draws overall, same as seed42/depth8) despite diverging in different code
(`paintMazeConnection`'s `growMaze`, algorithm and door-order both checked and matching) -
circumstantial support that both floors share one cause (which room is secret) rather than two
separate bugs. See `PORT_COVERAGE.md`'s matching note. Chasing the
first index closed
a real, separately-documented suspect from an earlier audit pass: `createBranches` was a `void`
where Java's is `boolean` (`failedBranchAttempts > 100` gives up and lets the caller's builder
return `null`, retrying the whole room graph) - fixed, though confirmed *not* the cause of
either open diff (`failedBranchAttempts` never approaches 100 for these two seeds), so both
remain open for a future pass. **Trace-bisected 2026-09-19** (per-floor RNG-draw traces on both
sides plus the `traceStackWindow` call-site facility; no shipped code changed by the bisection
itself): secret *selection* is exonerated on both floors - the room-kind multisets are identical
(honeypot secret on both sides for seed42/depth8), and the port's secret-branch guard was
instrumented and behaves correctly there (honeypot guardRounds 1,1,2). seed42/depth8 splits at
draw 321 with the port mid-`placeRoom` angle retries while Java advances to the next branch
iteration's `element()`; spot-checked room sizes match while every position differs, and the port
draws ~2190 more post-split yet still converges attempts=1 (Java: attempts=1) - a
placement-outcome divergence from identical RNG inputs, i.e. a deterministic geometry/logic
difference on the placement path (branch order unexcluded), not an RNG-call difference. The
"resync perfectly" reading does not hold on current traces (0/60 post-gap lines match; 4390 vs
6582 draws). seed999999999999/depth9 matches through draw 22625 (graph, all painting, all three
trap class rolls); the split is one extra Java float between trap chances#1 and element#1
(net java+3 overall, with 3 extra TS ints at the tail pointing at item-substream ordering) - in
`paintTraps`, not in maze-growing, superseding that location. The checkout HEAD is custom
history (`v3.3.8` is not its ancestor), so the next pass must verify against the checkout
worktree Java that actually produced the dump, not only the `v3.3.8` tag.
**Resolved 2026-09-19:** both open floors are one oracle version-skew, not two port bugs.
Call-site attribution on both sides (port `traceStackWindow` probes, since reverted, plus
a new env-armed stack window in the harness's scratch `TracingRandom`,
`LEVELGEN_STACKWIN=seed:depth:lo-hi`, writing `levelgen_stacks_<seed>_<depth>.txt`)
proves the mechanisms: seed42/depth8's draw-321 gap is the port refusing a crystal-room
door under `v3.3.8`/`4.0.0-beta`'s center-strip `CrystalPathRoom.canConnect` where the
worktree oracle (v2.1.4-era `core/`, predating upstream's v2.2.0 crystal redesign)
accepts it under refuse-center - exact door cells (15,21),(15,22) on rect (7,20,15,27)
verified against both rule texts - followed by a port placeRoom retry cascade;
seed999999999999/depth9's draw-22626 gap is one extra Java `paintGrass` float from the
same redesign shifting the crystal entry door ((40,22) vs (41,22)) and an internal
crystal door ((40,24) vs (38,26)), with count-resync and shifted trap/wandmaker
positions making the 47 cells. Secret selection is exonerated (honeypot secret both
sides); the maze-`growMaze` and item-substream theories are withdrawn. User decision:
keep the `v3.3.8`/`4.0.0-beta` behavior, classify both as oracle skew in
`PORT_COVERAGE.md` - no port change, 26/28 `TRACE-IDENTICAL` plus 2 classified.
Still genuinely unstarted: RNG-call-order comparison

beyond levelgen, and loot/quest/boss-transition/save-load comparison.

- [ ] Compare both implementations with fixed seeds and identical action traces. **Complexity: XL.**
- [ ] Verify RNG call order for level, item, monster, and quest generation. **Complexity: L.**
- [ ] Verify combat rolls, damage, status effects, and turn timing. **Complexity: M.**
- [ ] Verify loot, quest outcomes, boss transitions, and save/load state. **Complexity: L.**
- [ ] Add screenshot and animation-timing comparisons for visual parity. **Complexity: M.**
- [ ] Classify every remaining difference as either an implemented Java behavior or an explicitly
      accepted platform/UI difference. **Complexity: M.**

## 10. Close the browser-verification debt

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because many bullets elsewhere in this file cross-reference "section 10" by number when noting that
browser verification is still owed for their own item; renumbering everything below to close the gap
was judged not worth the churn against those existing references.

## 11. Architecture refactor toward the v3 target

This section tracks structural work, as distinct from the Java-parity work above. See
`SPD_ARCHITECTURE_TARGET_V3.md` for the target architecture (Command -> State + Events simulation,
renderer-free `EntityId`-addressed actors, event-driven presentation, data/function/method-driven
business families instead of Java-class transposition) and which parts of it are blocked on `mwg`
capabilities not yet released versus actionable now. `SIMULATION_ARCHITECTURE.md` tracks the actual
extraction steps taken so far (turns, combat, buffs, hero actions, movement) and the next planned
one.

- [x] Step 6: give every `Combatant`/`Creature`/`GroundItem` a stable id (`simulation/entityId.ts`),
      and move `sprite` out of `Creature`/`GroundItem` into a `spriteFor` view registry keyed by that
      id (see `SIMULATION_ARCHITECTURE.md`'s "Step 6").
- [x] Produce the section 22A/22B data/function/method analysis matrix for one monster family
      (Rat/Snake/Crab/Goo, see `MONSTER_ANALYSIS_RAT_SNAKE_CRAB_GOO.md`) before any class-level
      monster refactor, per SPD-ADR-010.
- [x] **`mwg@0.9.1` is now the published dependency**: its `core.EntityRegistry`/`EntityId`,
      `simulation.SimulationRuntime` (Command -> State + Events + cost + snapshot runtime) and
      `core.PresentationQueue` are available to the port, and the first runtime adapters are in use.
      The pin was raised deliberately (not as a side effect of other work) with the full verification
      suite re-run.
- [ ] **Next real phase**: wrap the existing per-domain rule functions (`simulation/combat.ts`,
      `movement.ts`, `heroActions.ts`, `heroTurn.ts`) behind one
      `SimulationRuntime<SpdGameState, SpdCommand, SpdEvent, Creature>`, migrating `main.ts`'s
      direct-mutation call sites (`attack()`, `moveTo()`, etc.) to `dispatch()` one command type at a
      time - start with whichever command is cheapest to convert without touching presentation-heavy
      code, not necessarily `attack()`. No big-bang (plan section 25). **Progress**: search, hunger
      and movement planning already route through their own runtimes
      (`adapters/searchSimulation.ts`, `hungerSimulation.ts`, `movementSimulation.ts`); both keep
      inert local scheduler/random pairs, and reconciling those with the scene's real ones waits for
      the first command with a real cost. **Progress 2026-09-16:** the scene's monster dispatch now
      has keyed `monsterTurnHooks`, `specialMonsterTurnOverrides`, and
      `postAllyMonsterTurnOverrides` tables for pre-turn cooldown maintenance, whole-turn Pylon
      behavior, and the Statue/Piranha post-ally branches, reducing the same kind-dispatch
      pressure this phase will eventually move behind the unified runtime. These
      remain scene-owned transitional strategies until their state and costs are serializable.
      **Progress 2026-09-16 (hero turn):** `spendHeroTurn()` now routes the extracted
      `finishHeroTurn` orchestration through `runHeroTurn()` and the same shared runtime; its live
      effect bindings stay behind a numeric handle, while the command carries the action's turn
      cost and the scene retains scheduler/presentation ownership. The direct scene call is gone,
      and the runtime adapter has an ordering regression check.
      **Progress 2026-09-16 (automatic actors):** `runUntilHeroInput()` now routes each scheduled
      monster action, its post-action hook, and its variable cost read through `runMonsterTurn()`
      on that runtime too. The scheduler remains the authoritative consumer of the returned cost,
      so Necromancer's variable summon cost and actor-removal behavior remain unchanged.
      **Complexity: L.**
- [x] Consider replacing `simulation/entityId.ts`'s local counter with MWG's own `core.EntityRegistry`
      now that it exists (SPD-ADR-002) - resolved as a split decision: the `EntityId` type *is* MWG's
      own (re-exported, plus the reverse `idOfEntity(entity)` lookup), but full `EntityRegistry`
      adoption (minting through `add()`) is deferred: it mints opaque `eN` ids while this port's
      prefixed ids (`hero-N`/`item-N`) are persisted in the save schema, and it has no
      caller-chosen-id primitive - needs that upstream or a save migration first (see P1 in section
      11A).
- [ ] Extract `main.ts`'s `attack()` pure resolution (hit/damage rolls, weapon-affix/talent branches,
      event-worthy outcomes like mimic reveal/displacement) from its presentation calls (sprite tint,
      audio cue, floating text) - the single largest concrete instance of plan section 10's complaint,
      and the likely vehicle for actually adopting `SimulationRuntime` above rather than a separate
      step. **Progress**: the hit/damage roll pair is extracted into `simulation/attackResolution.ts`
      and routed through `adapters/attackSimulation.ts`, and the defender-side `damage()` override
      family (Pylon, Eye, DemonSpawner, Slime/CausticSlime) is `simulation/defenderDamageCurves.ts`
      called once at Java's point - which fixed a real ordering bug and surfaced three more ordering
      deviations in `Char.attack()`, all now closed (Corrupting's pre-curve guard, both execute
      mechanics after the curves and shield pools, and the boss/miniboss half-damage branch with a
      real `miniboss` actor property). **Closed 2026-09-19:** the arming gate the 2026-09-18 narrowing called unmodelled was already live in code and is now pinned (`combinedLethalityTest` in `simulation/duelistAbilities.ts`, armed by `armCombinedLethality` at every `afterAbilityUsed` site, consumed one-shot in the execute tail; `verifyArmorAbilities.mjs` asserts same-weapon never tests, changed-weapon tests, the `0.4*points/3` threshold, and the boss/miniboss/ally/killed exclusions).
      The "predicted HP" half
      was a misreading - every reduction lands in `damage` before the test, so the tested
      value is what the HP write leaves - and both execute halves now carry Java's
      `enemy.isAlive()` guard, so a killing blow no longer also reports an execution.
      **Complexity: L.**
- [x] Compare `mwg/i18n` against the plan's section 22C "Semantic Messaging" shape before committing
      to SPD-ADR-012. It matches (`SemanticMessage`/`MessageChannel`/`MessageFormatter`/
      `createCatalogFormatter`, `EntityTextResolver`/`GrammaticalEntity`, CLDR plurals, FTL, catalog
      audit tools), and the catalog mechanism is already adopted. Pending is only the message half
      (typed messages at `say()` sites, combat log lines as pilot).
- [ ] Continue producing the section 22A/22B analysis matrix for the remaining monster/item/buff
      families before migrating each one's code, per SPD-ADR-010. **Progress 2026-09-18:** the sixth matrix, `MONSTER_ANALYSIS_SKELETON_THIEF_GUARD_NECROMANCER.md`, covers the Prison humanoids: a data-only Skeleton (its bone explosion is Java's only Skeleton behavior and is entirely absent), the `thief OR bandit` steal-flee loop as the next pilot candidate, the once-ever Guard chain-pull, and the Necromancer companion-master complex (already ported piece by piece, shared free with the Spectral variant) - plus two falsifiable gap records (Bandit's diverged gold loot, the port-invented Necro hero bolt against Java's `canAttack() == false`). **Progress 2026-09-19:** the seventh matrix, `MONSTER_ANALYSIS_BAT_ALBINO_SWARM_SPINNER.md`, covers the Sewer/Cave speedster/variant/splitter/weaver set - Albino as the cleanest variant-inheritance case (one MWL override row plus one keyed branch, no class), Swarm/Spinner as stateful single-kind strategies (`generation`, `webCooldown` + floor blob + `fleeing`), Bat as the schema boundary (its double speed needs a column, not a branch) - and fixed two real bugs in the same pass: Albino's poison stand-in is now real `Bleeding` with the `damage > 0` gate, and split-descendant Swarms now divide loot by `generation + 1`. **Progress 2026-09-19:** the eighth matrix, `MONSTER_ANALYSIS_PIRANHA_STATUE_MIMIC_WRAITH.md`, covers the special-activation set - entry-into-play as the behavior (water gates, payload equipment, disguise, tomb triggers) - and fixed the armored statue's missing inheritance (no PASSIVE turn, no damage wake) by sharing `takeStatueTurn` across both statue kinds, with the woken-statue chase, weapon-driven combat, base-mimic disguise, tomb wraiths, and piranha badge recorded open. **Progress 2026-09-19:** the ninth matrix, `MONSTER_ANALYSIS_SLIME_CAUSTIC_DM100_ELEMENTAL.md`, audited the ooze/Prison-bot set and escaped the family: it restored the global `maxLvl + 2` loot gate, rekeyed wealth rolls onto the BOSS/MINIBOSS sets, completed those sets (eye/warlock/pylon; elemental/eye/warlock), and fixed CausticSlime's invented meat loot plus its missing GooBlob - leaving resistance halving, summon scaling, and meat quantity recorded open. **Progress 2026-09-19:** the tenth matrix, `MONSTER_ANALYSIS_DEMONSPAWNER_SENTRY_ROTHEART_ROTLASHER.md`, covered the immobile-spawner set and fixed three gaps - lasher cripple, heart defense gas, heart Rotberry seed (correctly excluded on burn-destroy) - leaving quest scores, sentry invulnerability, FungalSentry, and lasher armor recorded open. **Progress 2026-09-19:** the eleventh matrix, `MONSTER_ANALYSIS_FETIDRAT_BEE_LARVA.md`, covered the quest strays and fixed FetidRat's missing StenchGas defense plus Larva's missing DEMONIC flag - leaving the honeypot-to-bee chain and quest scores recorded open. **Progress 2026-09-19:** the twelfth matrix, `MONSTER_ANALYSIS_NPCS_GHOST_WANDMAKER_BLACKSMITH_IMP_SHOP_RATKING.md`, covered the NPC set and fixed the Ghost turn-in to Java's weapon-or-armor choice (the both-items plus invented +2 HP are gone). **Progress 2026-09-19:** the thirteenth matrix, `MONSTER_ANALYSIS_BOSS_TRANSITIONS_TENGU_KING_YOG.md`, covered boss transitions and fixed three gaps - King P1->P2/P2->P3 now fire on the damage event instead of a turn late, Yog cooldowns accelerate (`-= dmgTaken/10`, post-clamp) with the gate min-5 reset, larvae die with Yog - while closing the lethal-P1 suspect (Java kills him too) and recording the unported Tengu's Mask. **Progress 2026-09-19:** the fourteenth matrix, `MONSTER_ANALYSIS_DOT_BUFFS_BURNING_POISON_BLEEDING_OOZE_CORROSION.md`, audited the five DoTs and fixed poison damage to Java's `(left/3)+1` (was a flat 1 - a third of Java's strength), leaving re-poison overwrite and bleeding-source gaps recorded open. **Progress 2026-09-19:** the fifteenth matrix, `MONSTER_ANALYSIS_POTIONS_ALL_TWELVE_QUAFF.md`, audited all twelve quaff effects - ten check out - and removed two invented extras (freerunner invisibility-duration extension; frost maxHp-fraction elemental scald), deleting four dead MWL rows. **Progress 2026-09-19:** the sixteenth matrix, `MONSTER_ANALYSIS_SCROLLS_EIGHT_REGISTRY.md`, audited the eight registry read effects - seven exact - and fixed Terror hitting allies (Java exempts them, like Rage). **Progress 2026-09-19:** the seventeenth matrix, `MONSTER_ANALYSIS_WANDS_FOUR_REGISTRY.md`, audited the four registry wands - Transfusion charm is now 5 (not 10) and heals charmed enemies, Ward promotions use Java's own HP deltas (not the zap-heal table), Fireblast statuses prolong (Paralysis 4, not 3); ally overheal-shielding stays recorded open. **Progress 2026-09-19:** the eighteenth matrix, `MONSTER_ANALYSIS_BOMBS_BLAST_SEAMS.md`, wired the live bomb seam into the King shield/transitions (all six seams now honor them) and verified every variant's numbers; ally-sparing and shrapnel line-of-sight stay recorded open. **Progress 2026-09-19:** the nineteenth matrix, `MONSTER_ANALYSIS_RUNESTONES_FOOD.md`, audited all twelve stones (every number exact - flock 2, aggression 20/5, clairvoyance 20, shock refund 1+hits, blast formula) and the six foods - fixing the invented meat heal (replaced by `MysteryMeat.effect()`'s real 5-way roll, Slow case unmodeled) and chargrilled's doubled energy (300 to the real 150) - and corrected four stale stone passages in `PORT_COVERAGE.md` (aiming now serves six stones, all twelve ported, Blast terrain/heaps live, per-call buff durations exist). **Progress 2026-09-19:** the twentieth matrix, `MONSTER_ANALYSIS_SHADOWCLONE.md`, ports the Rogue's ShadowClone armor ability - 80-HP ShadowAlly with Java's accuracy/evasion/damage/armor formulas over the shared ally orders; gear-proc shares, double-speed return, interact range and sprite stay recorded open. **Progress 2026-09-19:** the twenty-first matrix, `MONSTER_ANALYSIS_CHALLENGE.md`, ports the Duelist's Challenge armor ability - paired duel, spectator freeze, gap-closing blink, duel damage ledger, victory heal and elimination discount; bomb/trap/blast negation on frozen spectators stays recorded open. **Progress 2026-09-19:** the twenty-second matrix, `MONSTER_ANALYSIS_ELEMENTALSTRIKE.md`, ports the Duelist's ElementalStrike armor ability - WONT_STOP aim, reach-clamped cone, three talents, and all twenty-one imbuement branches with Java's numbers; Freezing blob, Displacing calm, Elastic collision damage, Lucky 80/20 loot, cast visuals and neutral-NPC immunity stay recorded open. **Progress 2026-09-19:** the twenty-third matrix, `MONSTER_ANALYSIS_WANDS_NINE_ZAP.md`, re-derived all nine remaining wand zap damage rolls against tag `v3.3.8` - eight exact - and fixed LivingEarth's level-scaled stand-in (4+0/6+2*lvl) with Java's real depth-scaled `NormalIntRange(2, 4 + scalingDepth()/2)`, pinned in `test:simulation` - and removed three invented Warlock zap bonuses with no Java source (a +2 on Magic Missile/Frost zaps, a free charge refund on every zap, and the same refund inside Fireblast; Java gives the Warlock SoulMark procs and Battlemage staff effects, never zap damage or refunds). **Progress 2026-09-19:** the twenty-fourth matrix, `MONSTER_ANALYSIS_PLANTS_HERO_MOB.md`, audited hero + mob plant activation against tag `v3.3.8` - Sungrass now grants the additive `boost(HT)` pool through the shared Java-shaped `Health.act()` tick (Warden gets `Healing.setHeal(HT, 0, 1)`, which is why the HoT carries explicit percent/flat rates), exact Warden/others durations on Starflower/Blindweed/Stormvine/Swiftthistle, the Icecap Freezing rework (no direct paralysis), Rotberry gas-only, Sorrowmoss set-not-prolong, Firebloom Warden imbue, shared cure across potion/well/Mageroyal/ankh, and Fadeleaf travel-cancel - leaving Sorrowmoss's Warden ToxicImbue, Mageroyal's Warden BlobImmunity, Fadeleaf's Warden interfloor return and `resting = false` recorded open. **Progress 2026-09-17:** the third matrix, `MONSTER_ANALYSIS_GNOLL_BRUTE_SHAMAN_TRICKSTER.md`, covers the variant-inheritance case (Gnoll/Brute/ArmoredBrute/Shaman/GnollTrickster; Sapper recorded absent) - and the fourth matrix, `MONSTER_ANALYSIS_GHOUL_MONK_WARLOCK_GOLEM.md`, covers the Dwarf court: four single-kind abilities (the easiest table-migration shape), a second Monk/`senior` OR-chain pilot, and the King-court spawn-flag gap (`BOSS_MINION`, partner severing) - and the fifth matrix, `MONSTER_ANALYSIS_SUCCUBUS_EYE_SCORPIO_RIPPER.md`, covers the Halls demons: three finished single-kind kits plus the Ripper leap - ported 2026-09-17 as the first stateful movement-ability pilot (see the AI-overrides line above and its `PORT_COVERAGE.md` row) - its finding is that Brute/ArmoredBrute's per-site kind-ORs are the smallest pilot for the ability-table migration. **Progress 2026-09-16:** the
      second matrix, `MONSTER_ANALYSIS_DM200_DM300_PYLON.md`, covers an ordinary mob, its variant,
      a fixed-floor boss, and its supporting actor; it confirms data aliases and keyed strategies
      rather than Java-style classes. Remaining monster/item/buff families still need the same
      treatment. **Progress 2026-09-19:** the twenty-fifth matrix, `MONSTER_ANALYSIS_WARRIOR_ABILITIES.md`, audited all three Warrior armor abilities against tag `v3.3.8` - fixing Endure's `damageBonus` int semantics (per-hit banking truncation, truncating ending scales, integer split, post-split-zero detach, all pinned in `test:simulation`) and Heroic Leap's gated shove/`Int(4)` (both now unconditional per neighbouring non-ally; corpses stay put) - and verifying Shockwave unchanged, with striking-proc attackProc reassignment, StrikingWaveTracker accuracy, Vulnerable prolong-vs-set, the NPC-immunity convention, and the hero-armor composition recorded open. **Progress 2026-09-19:** the twenty-sixth matrix, `MONSTER_ANALYSIS_RINGS.md`, re-verified all twelve ring formulas against tag `v3.3.8` with every reader traced to live combat - fixing the two sites that never applied theirs (electricity-blob hero zap and corrosion-DoT hero tick now scale by `ringElementsMultiplier`, pinned in `test:simulation` via the new `tools/verifyRings.mjs`) - and recording the single-ring-slot simplification, the unreachable Force unarmed override, and the unowed freezing-trap/chill gates. **Progress 2026-09-19:** the twenty-seventh matrix, `MONSTER_ANALYSIS_HUNTRESS_ABILITIES.md`, audited all three Huntress armor abilities against tag `v3.3.8` - removing the port-invented rank-4 `x1.1` Spirit-Blades damage (Java's `+0.1` is an unreachable proc-chance term) and running the bow nature-proc on consumed tracker rolls during blade attacks, both pinned in `test:simulation` - and verifying Nature's Power and the SpiritHawk ally unchanged, with flat ability turn costs, hawk-expiry interrupt, and the clamped hawk sight recorded open. **Progress 2026-09-19:** the twenty-eighth matrix, `MONSTER_ANALYSIS_ROGUE_ABILITIES.md`, audited SmokeBomb and DeathMark against tag `v3.3.8` - fixing re-mark window stacking, the bankable DoubleMark discount (now a same-round latch, dropped on clock advance and on load), NinjaLog retirement, and the log's missing INORGANIC half, all pinned in the suites - with the corrupted-ally barrier corner recorded open. **Progress 2026-09-19:** the twenty-ninth matrix, `MONSTER_ANALYSIS_MAGE_ABILITIES.md`, audited WarpBeacon end to end against tag `v3.3.8` - fixing the missing placement invisibility-dispel, pinned in `test:simulation` - and confirmed ElementalBlast stays correctly unoffered (its wand source needs the unbuilt staff-imbue system; the formula layer is pinned and waiting) with the LARGE-push clause recorded open. **Progress 2026-09-19:** the thirtieth matrix, `MONSTER_ANALYSIS_FEINT.md`, audited Feint and the AfterImage against tag `v3.3.8` - giving the decoy Java's full immunity surface (central buff refusal plus toxic/corrosive/electricity skips, pinned in `test:simulation`, closing a permanence hole for held decoys) - with the forced retarget and displacement immunity recorded open. **Progress 2026-09-19:** the thirty-first matrix (Chains/Horn/Toolkit) closed the artifact-action gaps - chain pulls spend the turn and arm EnhancedRings only on success, horn meals run the shared meal-talent path. **Progress 2026-09-19:** the thirty-second matrix, `MONSTER_ANALYSIS_MELEE_ABILITIES.md`, replaced the percent-based ability damage model with Java's flat `dmgBoost` across all 31 weapon classes plus Cudgel, with guard/dance/stance/precise/runic/lash/aim/charged-shot/combo/cleave/retribution/lunge/heavyBlow corrections, Duelist+STR gating, the barrier moved to `takeAbilityCharge`, and the secondary-charge/combined-energy fictions removed. **Progress 2026-09-19:** the thirty-third matrix, `MONSTER_ANALYSIS_ENCHANT_GLYPH_CURSE.md`, re-audited all 13 enchant, 13 glyph and 16 curse procs - fixing Stone (dodge-reduction, not +2 armor), the inverted Bulk curse, the Swiftness radius, Shocking hitting allies, the missing Berserk catalyst on procs, the Metabolism/AntiEntropy/Corrosion numbers, Explosive warnings, Kinetic edges and the DirectedPower tracker, with the Stone formula pinned in `test:simulation`. **Progress 2026-09-19:** the thirty-fourth matrix, `MONSTER_ANALYSIS_DWARF_KING.md`, re-audited the King's full script - TELE moves the King himself first, LifeLink splits two-way `ceil(dmg/(links+1))`, `lastAbility` persists on whiffs, P2 waves pace on the `spend` cadence, the shield chips per dead P2-wave add instead of per wave-turn, servants grant no XP/loot (`maxLvl = -2`), death gained the `defeated` yell/Degrade cleanse/beacon upgrade, LINK alternates the real lifelink yells, and the wave-3 yell fires unconditionally - with wave plans plus cadence pinned in `test:simulation`. **Progress 2026-09-19:** the thirty-fifth matrix, `MONSTER_ANALYSIS_TRAPS.md`, re-audited all 9 modeled trap kinds - Grim is `round(HT/2 + HP/2)` (both branches; mob branch lost its invented armor cut), Explosive is a verbatim stock bomb (`4+d..12+3d`, no falloff, no fire seed, all three blast sites), Burning deals no direct damage (Fire 2 on NEIGHBOURS9, ignition via the fire tick) - with both formulas pure and pinned in `test:simulation`. **Progress 2026-09-19:** the thirty-sixth matrix, `MONSTER_ANALYSIS_YOGFISTS.md`, re-audited all six fists against tag `v3.3.8` - elemental zaps now cool down (`NormalFloat(8, 12)` float, persisted, bright/dark exempt) and only soiled/bright/dark roll to hit, burning zaps reignite plus top-up fire 3x3 (no direct damage) with the per-turn evaporation, soiled furrows reweighted to `chances([0,2,1])`, rotting hits convert to 60% Bleeding on both damage paths with the water heal and harvest exemption, the five invented contact riders are gone (rotting ooze only), dark no longer pays bright's daze prices, bright's invented frost immunity is deleted, and fist rows carry Java's EXP 25 - with immunities plus scene-structure pins in `test:simulation`. **Progress 2026-09-19:** the thirty-seventh matrix, `MONSTER_ANALYSIS_UNPORTED_QUEST_MOBS.md`, audited the eight mining-quest actors Java places only from rooms this port never generates (`CrystalGuardian`/`CrystalSpire`/`CrystalWisp`, `FungalSentry`/`FungalCore`, `GnollSapper`/`GnollGeomancer`/`GnollGuard`) - recorded Not-ported with exact numbers, verified no live references, no roster divergence (all weight 0), and no quest soft-lock, with a suite pin that no MWL row exists for any of them. **Progress 2026-09-19:** the thirty-eighth matrix, `MONSTER_ANALYSIS_RARE_SPAWNS.md`, audited the spawn-time rarity systems - the eight ported alt swaps, four rare injections, and chaos roll check out against `MobSpawner.getMobRotation()`/`swapMobAlts()`/`addRareMobs()` and `Elemental.random()`, with one real fix (chaos rolled 1/51 via inclusive `Random.int(0, 50)`, now `Random.float() < 1/50`, pinned live plus structurally); the remaining unported spawnables (`GnollExile`/`HermitCrab`, `GoldenMimic`/`EbonyMimic`, `PhantomPiranha`, `FungalSpinner`, `MobSpawner`, `DelayedRockFall`) recorded Not-ported with numbers and suite-pinned absent. **Progress 2026-09-19:** the thirty-ninth matrix, `MONSTER_ANALYSIS_CLERIC.md`, audited the Cleric against tag `v3.3.8` - one real fix (the Cudgel's 1.4 accuracy lived on the class, now gated on the implicit starting cudgel, pinned structurally), Cudgel 1-8 verified exact, and the 30-spell roster plus tome economy, all three armor abilities, and both subclasses recorded Not-ported with numbers. **Progress 2026-09-19:** the fortieth matrix, `MONSTER_ANALYSIS_HONEYPOT_BEE.md`, ported the honeypot shatter chain against `Honeypot.java`/`Bee.java` - one action for SHATTER+THROW, hostile bee with persisted pot anchor hunting holder-first at `viewDistance` 4, depth stats pinned live - with the strike-back, honeyed-charm, `ShatteredPot`, and pit-landing residuals stated. **Complexity: M.**
- [x] **MWG-utilization audit**: checked whether this port reimplements functionality `mwg` already
      exports. Well-utilized overall, no action needed on `Roguelike.Pathfinder`/`Blob`/
      `Actors.rollLoot`/`Charges`, the `EntityId` re-export, the Java-bit-matching LCG RNG
      (`spdRng.ts`, correctly not using mwg's xoshiro) or `ui/floatingText.ts` (a justified sibling,
      not a duplicate). Three genuine gaps were found, and all three are resolved in the same pass -
      `heroBarrier`'s pooled model (three real bugs, not one ordering simplification), section 10's
      stale `eternalFire` claim, and `summonSkeleton`'s push-aside (where the audit's own suggested
      `knockbackPath` fix would have been wrong - Java's rule is an 8-neighbour search maximizing
      `trueDistance`, needing no framework primitive at all). No UI-widget/i18n-catalog/scheduler/
      FOV/geometry reimplementation found elsewhere. **Closed 2026-09-17:** the outstanding re-run already happened - the audit was refreshed against installed 0.14.0 on 2026-09-15, and `npm run mwg:check` confirms no newer release exists today (pin, installed and published latest all 0.14.0).
      See `PORT_COVERAGE.md`'s mwg-usage section. **Progress 2026-09-19:** bumped to 0.15.0 (purely additive - table references, persisted settings + screen, auto-pause/mute, quality scaling, ducking, `Meter`, `SpriteGroup`; `npm run mwg:check` confirms pin/installed/latest all 0.15.0). Adopted: `tableReferences` replaces the hand-copied ground-kind set in `tools/compile-mwl.mjs` (negative-probed), and `SpdAudio` gains the `AudioSuspendRig` pair wired into `new Game({ audio })` for auto-mute on hide. Deferred with reasons: Settings/SettingsScreen (own settings UI + persisted settings), QualityScaler/`SpriteGroup` (need visual verification), ducking/`Meter` (no call-site need). Correction 2026-09-19: the "silent removal" first
 written here never happened - the published 0.14.0 artifact already has `category`, no
 `sourceClass` (checked tarball to tarball); the stashweapon writer was new code that never
 compiled under either version, and rides a cast because `sourceClass` is port-owned data.
- [x] Re-check `mwg`'s exports on every version bump for the plan's remaining assumed primitives
      (raw 2D primitive re-exports, the Semantic Messaging shape). Re-checked at 0.4.2, 0.5.0 and
      0.5.1; `Types2D` arrived but remains type-only, so Phase 0's exit criterion still cannot be
      met. **Open upstream**: P1 (`EntityRegistry` caller-chosen ids) and P2 (`Types2D` value
      positions). `core.ReactionTable` was evaluated and deliberately not retrofitted at every
      latch/transition site (each is already a minimal boolean; a table costs net lines plus save
      plumbing) - it is recorded in `SPD_ARCHITECTURE_TARGET_V3.md` as the designated v3
      event-presentation mechanism instead.
- [x] **Code-quality note**: a long `if (x === 'a' || x === 'b' || ...)` OR-chain is itself a code
      smell. Where the values share a real, checkable structural property (a common prefix, a shared
      category the item's own definition carries, or a lookup table/`Set` membership test), prefer
      that over enumerating every literal by hand - it stops scaling linearly with every new case.
      **Keep It Simple, Stupid (KISS) is a good default principle here.** Closed this pass: a regex
      sweep of every such chain in `main.ts` found one genuine instance (`spawnMonster`'s 8-clause
      "never sleeps on spawn" gate, extracted into `monsters.ts`'s `NEVER_SLEEPS_KINDS` Set); the
      other short chains are each a fixed, real-world-bounded enumeration that doesn't grow with new
      features, and were deliberately left alone rather than converted for no structural reason.
      `tsc`/build/both suites green.
- [x] **Data-driven dispatch pass**, acting on the note above for the two largest instances found by
      a full `main.ts` audit (205 `kind ===`/`id ===` checks across ~19 functions).
      `quaffPotion`'s 39-branch chain became a `potionEffects` `Record<Kind, handler>`, and
      `takeMonsterTurn`'s 236-line 16-case ranged cascade became `rangedAiOverrides` (each handler
      returning `true` if it consumed the turn, `false` to fall through to the shared movement AI;
      three shared cases route through one helper from two keys). `spawnMonster`'s 37 branches became
      real data tables (`DEPTH_SCALED_STATS`/`BASE_KIND_ALIASES`/`SPRITE_KIND_OVERRIDE`) plus
      `NPC_KINDS`/`BOSS_KINDS` sets - the texture chain collapsing from 12 checked cases to one
      lookup once re-derived correctly. Browser-verified live for every handler with real branching
      complexity, and via direct texture-identity comparison for the sprite table. **Not a candidate
      for `mwg` itself**: the *pattern* (keyed handler registry) is generic, but every handler body
      is SPD-specific game logic, which the licensing boundary forbids putting in `mwg`. Recorded as
      a possible upstream proposal (a generic `keyedDispatch<K, Args>` utility, or documentation of
      the pattern) for the user to raise in the framework's own repo.
- [ ] **File-size refactor: keep every hand-written source file human-readable.**
      `src/scenes/dungeonScene.ts` is ~23,600 lines and still growing with every ported system -
      past the point where any reader can hold its structure, review a diff touching it, or find
      the one seam a change needs without a search tool. Objective: no hand-written `.ts` file
      over ~2,000 lines (generated files under `src/generated/` excluded), enforced by a line-count
      gate in `npm run check` so the budget holds as new systems land. Vehicle is the extraction
      pattern already established in this section (pure rule modules under `src/simulation/` and
      `src/items/` plus thin scene adapters): carve `dungeonScene.ts` per domain - item-use paths
      behind `items/itemActions.ts`'s router, blob fields/ticking next to `environmentalBlobs.ts`,
      aim/targeting helpers next to `simulation/targeting.ts` - one domain per commit, suites green
      at each step, no behavior change (each move is covered by the existing verify suites plus a
      before/after `tsc` + build). **First extraction 2026-09-19**: the alchemy-pot window flow
      (`startAlchemyIngredientPick`/`pickAlchemyUnits`/`completeAlchemyRecipe`/`openAlchemyRecipes`
      plus the `AlchemyIngredientSelection` type) moved verbatim to `items/alchemy.ts` behind a new
      `AlchemyFlowContext` (bag, energy get/set, say, picker, display name, panel refresh) - the
      scene keeps one 17-line builder; net −139 lines in `dungeonScene.ts` (23,622 after),
      `alchemy.ts` 448 to 630.
      The move's own suites: `tsc` + build clean, the item/simulation suites green (two relocated
      source pins in `verifyPrismatic.mjs` now assert against the moved module), plus a new
      headless drive of the moved flow through a scripted picker (seed brew end to end, empty-pot
      refusal). **Second extraction 2026-09-19**: the transmutation-scroll window flow
      (`transmuteEligible`/`transmuteCandidates`/`completeTransmutation` plus the read
      branch as `startTransmutationPick`) moved verbatim to `items/transmutation.ts`
      behind a new `TransmuteFlowContext` (bag, heroClass, mining flag, hero vitals,
      talent/instance/sync/say/picker callbacks, get/set accessors for the equipped
      ring, Might bonus, missile thresholds and empowered zaps); the scene keeps one
      builder and a one-line branch (net −70 lines in `dungeonScene.ts`, 23,552 after).
      Suites: `tsc` clean (one real catch - `Creature`'s
      optional `magicImmune` needed an optional context field), item/simulation suites
      green, plus a new headless drive of the moved flow (reroll + scroll consumption +
      mage zap-arming, empty-list and stale-pick refusals). **Third extraction 2026-09-19**:
      `examineTile`'s whole name/description decision (ritual marker, caves-arena and city
      visuals, stairs, raw ported `Terrain.java` branches, coarse-kind switch) moved
      to `ui/examineText.ts` as `examineTileOutcome(ctx)` next to its per-region helpers -
      the scene only precomputes the arena/city key answers (they need its visual contexts)
      and performs the outcome (`say` vs the alchemy-pot recipe window); net −108 lines in
      `dungeonScene.ts` (23,444 after), `examineText.ts` 92 to 246. Suites: `tsc` clean,
      item/simulation suites green (eleven orphaned `examine*` imports and the two ritual
      key imports deleted from the scene), plus a 16-assertion headless pin of the moved
      branch table in `verifyItemWorkflows.mjs` (stairs, wall, halls water, locked/crystal
      doors, grass, floor fallback, raw-beats-coarse, alchemy outcome, well, ritual/arena/
      city precedence and the empty-desc suppression). **Fourth extraction 2026-09-19**:
      `triggerPortedPlantAt`'s 15-branch hero effect switch moved to the new
      `simulation/plantTriggers.ts` as `runHeroPlantEffect(kind, x, y, cell, hero, ctx)`
      behind a `HeroPlantContext` (buff grants, cure, blob seeds, healing/sungrass/
      earthroot/time-bubble state accessors, fadeleaf movement seam, loot, shake,
      visibility, depth); the scene keeps kind resolution, Lotus preservation, marker
      removal and the redraw plus a 30-line builder. The context field for text is
      deliberately named `t` (bound to the real one) so the `t('...')` key audits keep
      matching these call sites - a 16-vs-16 key-set diff over the move proves nothing
      was lost. Net −132 lines in `dungeonScene.ts` (23,312 after). Suites: `tsc` clean
      (two real catches - `subclass()` is `string | null`, `randomFreeCell` may return
      `undefined`), sim suite green at 158 checks with a new every-branch headless drive
      (Warden/non-Warden halves, impassable icecap neighbours, fadeleaf with and without
      a destination, depth-scaled sorrowmoss, the unknown-kind wither), the earthroot
      shake pin relocated to the moved module, and the simulation sibling-import
      confinement guard satisfied. The mob half stays for the fifth extraction. Found
      in the same pass and recorded in `PORT_COVERAGE.md`: Dreamfoil has no seed deck
      entry, room planting or trigger branch anywhere (Not ported, unreachable).
      **Fifth extraction 2026-09-19**: the mob/allied half (`triggerMobPlantAt`'s
      fadeleaf block plus its ten-branch switch) joined the same module as
      `runMobPlantEffect(kind, cell, creature, ctx)` behind a `MobPlantContext`
      (immovable gate, patrol/teleport destinations, sprite placement, blob seeds,
      cell-visibility shake gate); the scene keeps guard, kind resolution and marker
      removal plus a 20-line builder. Net −78 lines in `dungeonScene.ts` (23,234
      after). Suites: `tsc` clean (one real catch - the immovable set is keyed by
      `AnyMonsterId`, so the gate takes that type), sim suite green at 159 checks
      with a new every-branch mob drive (mark-before-teleport fadeleaf ordering,
      immovable refusal before the mark, rotberry's unmarked gas, mageroyal keeping
      burning, the silent unknown-kind no-op), and the mob-half earthroot shake pin
      relocated to the moved module. The plant-trigger domain is now fully out of
      the scene. **Sixth extraction 2026-09-19**: the toolbar quickslot trio
      (`quickslotStates`/`assignQuickslot`/`useQuickslot`) moved into
      `items/itemActions.ts` next to the item-use router they feed - a
      `QuickslotContext` (live slot array mutated in place, bag lookup, use path)
      plus the pure `quickslotFamilySlot` mapping; the scene keeps one-line
      adapters and a 7-line builder. Net −10 lines in `dungeonScene.ts` (23,224
      after) - small, but it completes the "item-use paths behind the router" half
      of this line. Suites: `tsc` clean first try, item suite green with a new
      quickslot pin (family mapping, assign-mirrors-use, refresh reporting the
      held quantity under the held instance, stale-slot cleanup on refresh and on
      use, familyless ids assigning nothing). **Seventh extraction 2026-09-19**: the
      `SacrificialFire` room rule (`spreadSacrificialFire`/`sacrificeCost`/
      `processSacrifice`) moved into `simulation/environmentalBlobs.ts` next to the
      other blob rules - a `SacrificialFireContext` (prize/charge/cell accessors,
      structural fire volume, reset, passable, exp table, roll, reward spawn, say,
      `t`); the scene keeps the triple, room setup and save/load plus a 20-line
      builder. Net +3 lines in `dungeonScene.ts` (23,227 after) - the builder costs
      more than the 30 moved lines, stated plainly; the value is domain placement
      (blob ticking now lives in one module) plus first-ever headless coverage of
      the cost math and payout order. Suites: `tsc` clean (two real catches - the
      exp table is keyed by `AnyMonsterId`, the reward spawner needs a non-null
      prize), sim suite green at 160 checks with a new sacrificial drive (statue/
      mimic/piranha/swarm/kindless costs, spread gating, outside-volume refusal,
      partial payment banking nothing, prize-cell decode, stepper fallback). The
      reward key moves 1-to-1 with the code (`ctx.t`, extractor-matched). **Eighth extraction
      2026-09-19**: the Sandals of Nature's window flow (`useSandals`'s feed/root choice rows,
      the seed picker, root aiming plus confirm) moved to `items/sandals.ts` behind a new
      `SandalsFlowContext` (sandals/seed lookup, picker, aimer, plant-plus-trigger seam, turn,
      say, `t`); the scene keeps the one-line `useSandals` adapter the item-use router calls,
      `sandalsItem` for the grass paths, plus a builder. Net −47 lines in `dungeonScene.ts`
      (23,201 after), `sandals.ts` 141 to 264. Suites: `tsc` clean first try, item suite green
      with a new headless drive of the moved flow through scripted pickers (feed consumes and
      attunes, root aims at the authored range 3 and pays firebloom's own 20, AntiMagic opens
      nothing, cursed-plus-uncharged reports low charge, far cells refuse without planting).
      **Ninth extraction 2026-09-19**: the Talisman of Foresight's scry flow (`useTalisman`'s
      aimer, `confirmTalismanScry`'s cone pass, the per-turn trap warning) moved to
      `items/talisman.ts` behind a new `TalismanFlowContext` (talisman lookup, aimer, distance,
      fog/secret/terrain seams, creature/heap marks, travel/invisibility/refresh/turn, say,
      `t`); the scene keeps one-line `useTalisman`/`checkTalismanAwareness` adapters plus a
      builder. Net −90 lines in `dungeonScene.ts` (23,111 after), `talisman.ts` ~169 to 354.
      Suites: `tsc` clean (the six moved rule imports deleted from the scene), item suite green
      with a new headless drive of the moved flow on a stub 10x10 level (a 3-tile scry maps at
      1 exp a cell with no level, pays exactly 92 charge with the partial books, one turn;
      full creature+heap cover marks 5-turn awareness everywhere with the exact leveled
      remainder; own-cell/cursed/low-charge/AntiMagic refusals; the warning fires once per run
      and resets) - which needed one new harness compile line (`mechanics/cone.ts`) plus an
      earlier recompile of `dungeonConstants.js` for its `WALL`. **Tenth extraction 2026-09-19**:
      the Ethereal Chains' grab/pull flow (`useChains`'s aimer, `confirmChains`'s reachability
      split, the enemy pull and the self-grab) moved to the new `items/chains.ts` behind a
      `ChainsFlowContext` (chains lookup, aimer, explored/passable/immovable/reachability/trace
      seams, creature lookup, hero/enemy movement, shake, rings, invisibility, turn, say, `t`);
      the scene keeps the one-line `useChains` adapter the router calls, `chainsItem` for the
      builder, plus the builder. Net −42 lines in `dungeonScene.ts` (23,069 after). Suites: `tsc`
      clean after one real catch (the immovable set is keyed by `AnyMonsterId`, so the gate
      takes that type via an erased import), item suite green with a new headless drive of the
      moved flow on a stub 10x10 level (enemy pull to the first free cell for its distance,
      self-grab beside a wall, rooted/wall/grabless/short-charge/statue/unreachable refusals
      spending nothing, cursed/AntiMagic gates). **Eleventh extraction 2026-09-19**: the Horn of
      Plenty's meal flow (`useHorn`'s eat/snack/store rows, the satiety meal, the food store)
      moved to the new `items/horn.ts` behind a `HornFlowContext` (horn lookup, picker, food
      lookup, hunger get/set, meal effects, heal display, fast-eating read, rings, turn, say,
      `t`); the scene keeps the one-line `useHorn` adapter the router calls, `hornItem` for the
      builder, plus the builder. The pure charge/satiety rules moved with it (`hornChargeCap`,
      `hornSatietyPerCharge` - the recharge table now calls the module's). Net −57 lines in
      `dungeonScene.ts` (23,012 after). Suites: `tsc` clean, item suite green with a new headless
      drive of the moved flow through scripted pickers (five charges for a 500 pool at the
      authored 90 a charge with the meal firing over 3 turns, one-charge snack, a meat pie
      banking four levels with the bonus, empty-capped/AntiMagic refusals, cursed losing only
      the store row) - which needed one new harness compile line (`simulation/hunger.ts`).
      **Twelfth extraction 2026-09-19**: the Master Thieves' Armband's steal flow (`useArmband`'s
      melee aimer, the target gate, the loot-chance and loot-pick tables, the steal confirm)
      moved to the new `items/armband.ts` behind an `ArmbandFlowContext` (armband lookup, aimer,
      creature lookup, wealth multiplier, hero level, loot tables/decay/max-levels as data
      callbacks - the catalogue is too heavy for the item harness - limited-drop counters,
      loot spawn, kind names, creature buffs, invisibility, say, `t`); the scene keeps the
      one-line `useArmband` adapter the router calls, `armbandItem` for the builder, plus the
      builder. Net −77 lines in `dungeonScene.ts` (22,935 after). Suites: `tsc` clean after
      keying the builder's catalogue lookups by `MonsterId`, item suite green with a new
      headless drive of the moved flow (a surprised steal lands its stub drop with 5-turn
      debuffs, 9 charge left and 3+2 exp short of the 10-exp level; robbed/overleveled/empty
      refusals still mark, daze and pay; cursed/uncharged gates; the warlock/scorpio/succubus
      pick shapes). **Thirteenth extraction 2026-09-19**: the Dried Rose's summon/direct flow
      (`useRose`'s summon/direct rows, the neighbour-scan summon, the order aimer) moved to
      `items/rose.ts` behind a `RoseFlowContext` (rose lookup, title, picker, ghost liveness,
      dead-ghost clearing, spawn-cell scan, ghost spawn/registration, ally orders, hero level,
      first-summon latch, invisibility, refresh, turn, say, `t`); the scene keeps the one-line
      `useRose` adapter the router calls, `roseItem`/`roseGhostAlive` for the recharge/petal/turn
      paths, plus a builder. Net −62 lines in `dungeonScene.ts` (22,873 after), `rose.ts` 194 to
      342. Suites: `tsc` clean after diarizing `Creature`'s real shape into the ghost view
      (optional `sleeping`/`isNPC`/`npcKind`) and remembering both the interface's and the
      builder's `beginAim`, item suite green with a new headless drive of the moved flow (summon
      on a free neighbour with the exact level-0 statline, charge paid, scene registered, Java's
      hello-first/appeared-later greetings, direct orders with numbered yells, quest/charge/room
      refusals spending nothing, AntiMagic undercharging). The move caught one live omission in
      review - the scene-field assignment - fixed as a `setActiveGhost` seam before committing.
      **Complexity: L.** **Fourteenth extraction 2026-09-19**: Lloyd's Beacon's zap/set/return
      flow (`useBeaconArtifact`'s three rows, the aimer, the self/other confirms, the set anchor,
      the same-depth relocate vs cross-depth travel) moved to `items/beacon.ts` behind a
      `BeaconFlowContext` (beacon lookup, title, picker, aimer, depth, hero cell, cell index,
      grid width, boss/amulet/mining-branch gates, creature views, immovables, free-cell scatter,
      hero/creature moves, teleport effects, same-depth relocate, a `travelToDepth` callback that
      runs `enterLevel` scene-side, roots, invisibility, say, `t`); the scene keeps the one-line
      `useBeaconArtifact` adapter the router calls, `beaconArtifactItem` (retyped to the new
      `BeaconItem`), plus a builder, and `artifactRechargeCap`'s beacon case now calls the moved
      `beaconChargeCap`. Net −49 lines in `dungeonScene.ts` (22,824 after), new `beacon.ts` 206
      lines. Suites: `tsc` clean after keying the creature view and `isImmovableKind` by
      `AnyMonsterId` (the chains precedent), item suite green with a new headless drive of the
      moved flow (row gating by charge/anchor, set anchor with boss/adjacent blocks, self-zap
      paying/unrooting/scattering, victim scatter with boss/immovable/empty refusals, same-depth
      relocate vs cross-depth travel, blocked/occupied/walled anchors). The move caught one
      inverted reading in review - the zap costs 2 *past* depth 20, not above it - fixed in the
      module comment and the drive before committing.
      **Complexity: L.** **Fifteenth extraction 2026-09-19**: the brew throw/aim/shatter pair
      (`useBrew`'s pending-aim re-entry, `shatterBrewAt`'s four shatters) joined
      `simulation/brews.ts` behind a `BrewFlowContext` (bag has/consume, aimer with the
      passable-non-chasm validate, floor size, solid test, pending-aim cell, creature views,
      ooze affliction, per-blob seeding, turn); the scene keeps the one-line `useBrew` adapter
      the router calls plus a builder, and drops its eight-name brews import for the flow pair.
      Net −27 lines in `dungeonScene.ts` (22,797 after), `brews.ts` 98 to 186. Suites: `tsc`
      clean with no fix-ups (`Step` is exactly `{x, y}`, the aimer already takes a validate),
      simulation suite green at 165 checks with a new headless drive of the moved flow in
      `verifyBrews.mjs` (aim-then-shatter with the 49-cell electricity-20 flood, unknown/missing
      brews never aiming, pending aims shattering at once, Caustic oozing non-NPCs only,
      Infernal piling the blocked share onto the center). The move fixed two stale "no blob to
      seed" claims in passing - both blobs have been modeled and seeded since the follow-up, so
      the module header now says so and the moved comment carries the corrected shape.
      **Complexity: S.** **Sixteenth extraction 2026-09-19**: the single-use `BeaconOfReturning`
      spell (`useBeaconOfReturning`'s set-then-travel ladder) joined `items/beacon.ts` as
      `useReturningBeaconFlow` on the existing `BeaconFlowContext` plus three spell seams
      (spell lookup, spell consume, turn); the local `Beacon` item type is gone with the move
      (the flow reads the shared `BeaconItem`), and the scene keeps the one-line adapter the
      router calls. Net −43 lines in `dungeonScene.ts` (22,754 after), `beacon.ts` 206 to 260.
      Suites: `tsc` clean with no fix-ups, item suite green with a new headless drive of the
      moved spell (first cast anchors with the set line and spends the turn but not the spell,
      foreign branches refuse, same-depth steps consume, the unmoved hero exempts himself,
      strangers/walls refuse, cross-depth travels consume, depths outside 1..26 refuse - every
      refusal spending nothing). The drive caught one fixture bug in review - anchored fixtures
      must carry the `returnBranch: 0` the set path always writes, or the branch guard refuses
      them - fixed as a drive normalization with the reason stated.
      **Complexity: S.** **Seventeenth extraction 2026-09-19**: the targeted-spell pair
      (`useTelekineticGrab`'s heap aim/confirm, `usePhaseShift`'s victim scatter/calm/paralysis)
      moved to the new `items/spells.ts` behind `TelekineticGrabContext`/`PhaseShiftContext`
      sharing a `TargetedSpellAim` base (spell has/consume, aimer, turn, say, `t`); the scene
      keeps the two one-line adapters the router calls, two builders over a shared
      `targetedSpellBase`, and drops both bodies plus their comments. Net +7 lines in
      `dungeonScene.ts` (22,761 after) - the two builders and the shared base cost more than
      the two small bodies saved - new `spells.ts` 120 lines; the payback is headless coverage
      where none existed and a reuse base for the next targeted spell. Suites: `tsc` clean
      with no fix-ups except keying the heap view's `chest` marker as a string (the scene's
      `GroundItem.chest` is a variant union, only its presence is read), item suite green with
      a new headless drive of both flows (grab: missing spells never aim, empties/chests/shop
      stands refuse yet consume; shift: validate needs a creature, victims scatter/calm/stiffen
      on the victim itself after the move, bosses scatter unstiffened, empties and stranded
      casts still cost). The drive caught the same factory-merge bug as the brew drive - bag
      defaults swallowing the empty-bag override - fixed the same way. The move also corrected
      one seam choice in review: the teleport effect takes the victim view directly
      (`playTeleportOn`, move-then-play preserved) instead of re-looking it up post-move.
      **Complexity: S.** **Eighteenth extraction 2026-09-19**: `useReclaimTrap`'s store/redeploy
      flow joined `items/spells.ts` as `useReclaimTrapFlow` on the `TargetedSpellAim` base plus
      a `ReclaimTrapContext` (live carried class, armed-trap lookup folding the spent/secret
      gates, placeable test, take/place mutators, tile restitch); the scene keeps the one-line
      adapter the router calls plus a builder. Net +1 line in `dungeonScene.ts` (22,762 after) -
      the trap-layer builder costs what the body saved - `spells.ts` 120 to 174; the payback is
      the same as the seventeenth's (first headless coverage of the flow, base reuse holding).
      Suites: `tsc` clean with no fix-ups, item suite green with a new headless drive (missing
      spells never aim, armed traps validate/store with a wand refund while keeping the spell,
      bare/spent/concealed cells refuse on both validate and confirm, carrying validates the
      floor instead and redeploys concealed while consuming the spell, blocked cells refuse).
      Review corrected one invented Java clause in the interface comment before committing, and
      kept the snapshot-vs-live `carrying` distinction exact (snapshot on confirm, live read on
      validate, as the moved code did).
      **Complexity: S.** **Nineteenth extraction 2026-09-19**: `useRecycle`'s pick/redraw flow
      joined `items/spells.ts` as `useRecycleFlow` behind a `RecycleContext` (spell gate, picker,
      bag scans, category deck draw with the same-class/same-id reroll, remove/add swap, name,
      panel refresh); the scene keeps the one-line adapter the router calls plus a builder that
      owns the `Cat` deck mapping and the generator loop. Net +13 lines in `dungeonScene.ts`
      (22,775 after) - the draw-loop builder costs more than the body saved - `spells.ts` 174 to
      241; same payback as the last two (first headless coverage of the flow). Suites: `tsc`
      clean after narrowing the seam cast (the flow hands back the full payload the draw built,
      narrowed to `RecycledItemView` between - stated at the cast), item suite green with a new
      headless drive (missing spells never open the picker, only potions/scrolls/seeds/stones
      are offered, each redraws its own deck, the swap names the replacement and refreshes,
      empty pickers draw nothing, vanished picks swap nothing). The drive caught one stub bug
      in review - the drive's `t` dropped params, hiding the substitution the recycled line
      asserts - fixed by echoing params like the harness's own i18n stub.
      **Complexity: S.** **Twentieth extraction 2026-09-19**: the infusion pair
      (`useCurseInfusion`'s pool draw/curse/marker, `useMagicalInfusion`'s keep-upgrade) joined
      `items/spells.ts` as `useCurseInfusionFlow`/`useMagicalInfusionFlow` behind an
      `InfusionBase` plus `CurseInfusionContext` (spell gate/consume, picker, live-bag scans,
      relabel, burst, name, panels); the scene keeps the two one-line adapters the router
      calls, a curse builder over a shared `infusionBase`, and drops both bodies, both local
      `Infusable` types, and the six names the two bodies alone used (both predicates, both
      curse pools, `upgradeItem`). The
      module imports the real predicates, pools, `Random`, and `upgradeItem` directly. Net −23
      lines in `dungeonScene.ts` (22,752 after), `spells.ts` 241 to 358. Suites: `tsc` clean
      after narrowing one seam cast (the swapped-back payload is the drawn object, stated at
      the cast - same shape as the recycle seam), item suite green with a new headless drive
      (missing spells never open pickers, pickers run the real usability rules, curse lands
      pool affix/level/bonus/relabel/burst/consume, wands curse pool-free, marked picks gain
      nothing twice, bare lists refuse, vanished picks consume nothing, upgrades land +1 with
      the enchant kept). The drive caught three review bugs: a sibling-require the harness
      compiles under another name (fixed by an idempotent recompile with the reason stated),
      minted fixture ids the default-true predicate wrongly admits (fixed by using the
      suite-pinned real ids), and a before-level read after the drive already mutated the item
      (fixed by asserting the known +0 start).
      **Complexity: M.**
- [x] **`mwg` bumped to 0.5.0**, adopting `core.ReactionTable` for `takeKingTurn`'s three real
      one-way transitions (previously three ad-hoc latch fields), with its `toJSON()`/`fromJSON()`
      wired into the save/restore path. Live-verified all three firing exactly once (including that
      HP recovering above 20 and dropping again does not re-fire a spent rule), plus a full
      save-then-load round trip. Brute's `hasRaged` one-time revival is a smaller instance of the
      same shape, identified but not converted (a single flag, not a multi-rule state machine).
- [x] **Hand-rolled code where the framework now ships the capability**, from the mwg-usage audit.
      Ordered by value: (1) `Scheduler` persistence - **done**: `FloorState.scheduler` carries the
      whole queue and restore goes through `Scheduler.restore`, verified live with 14 assertions.
      (2) The inventory UI now uses MWG's `TabbedList` and `IconGrid`, and constructs its display
      objects through the typed render facade (`Container2D`/`Shape2D`/`Rectangle2D`/`Sprite2D`),
      reducing the raw-Pixi boundary one audited file at a time. (3) The hand-rolled hero frame
      animator and move tween are **gone**: the hero is an `AnimatedSprite` sharing the monsters'
      `Tweener` motion map. (4) `src/ui/wallDecorations.ts` migrated to `ParticleEmitter` on MWG
      0.8.1, one emitter per FOV-gated spot, browser-verified. (5) The talent panel and `InfoWindow`
      still hand-roll modality where `Window`/`WindowStack` exist - **narrowed 2026-09-16**: the
      shared item picker is now a real `Window` on `gameWindows`, so all its consumers share the
      framework's keyboard, blocker and outside-click behavior. **Progress 2026-09-16:** the
      talent panel now keeps its SPD-specific content layout inside a lazily-created modal
      `Window` on the same stack, including close/outside-click cleanup and viewport re-placement.
      `InfoWindow` now also uses a fresh MWG `Window` per opening, with the existing stat-row
      chrome retained inside it; the scene no longer owns a second dimmer or close state machine.
      The in-game menu is also a real `Window` on a `WindowStack`, which is the worked example the rest
      of this item was missing. **Re-read 2026-09-16, and re-rated: this is not an S nibble, and the
      primitive this line named was the wrong one.** `MessageBox` is a *paged dialogue/choice* box
      (pages of text, an optional speaker/portrait, then a flat `choices` list) - it has no per-row
      icon and no scrolling, so it is not the item picker's shape at all despite this line's claim;
      `ListView` is (`rows with an optional icon`, keyboard-driven, scrolling by keeping the
      highlight in view - its own doc comment names "bags, spell lists, shop stock" as its use
      case). Nor is much of it hand-*drawn*: `ui/itemPicker.ts` remains a small adapter over MWG's
      own `Window`/`Label`/`Button`, and its modality now belongs to the stack. The three scene
      panels named by this audit are all stack-owned; the talent and info content retain only their
      SPD-specific inner layouts. (6) Screen shake - **wired** at every site whose
      Java feature is ported, through a `shakeScreen` wrapper; the unwired remainder is exactly the
      unported-feature list in `PORT_COVERAGE.md`'s mwg-usage section. (7) The interlevel curtain
      still hand-computes its fades where `ScreenEffects.sequence` now exists (see P8) -
      **resolved as a non-adoption, 2026-09-16**: `ScreenEffects` is a flat colour wash and this
      curtain is a five-stop gradient, so the swap would delete the gradient rather than just the
      sequencing code. See section 8's transitions item for the divergence that read turned up.
      **Also recorded
      as deliberately unused**, each with its reason in `PORT_COVERAGE.md`'s mwg-usage section
      rather than here: `TileMap.setCellColor`, `visualWalls.ts`'s neighbour-mask table vs
      `resolveTerrainGraphics`, `ui/gameLog.ts`'s own line budget vs `ListView`/`ScrollBox`, the six
      boss ability cooldowns vs `Roguelike.AbilityCycle`, `SimulationRuntime.snapshot()`,
      `src/challenges.ts`'s own `localStorage` key vs `SaveSystem`/`Collection`, `SaveSystem`'s
      version-3 bump with no `migrations` entry, and the two flat-index `neighbourOffsets9` copies
      `Roguelike.neighbourOffsets(8)` cannot express as a hot-loop form. The audit is now closed;
      remaining framework capabilities are deliberate non-adoptions documented above and in
      `PORT_COVERAGE.md`.
- [x] **Table-unique row ids in the MWL content.** MWL's id namespace is global per tag, and 42 of
      this port's `[row]`s restated another table's *domain* id as their own. Each restating row is
      now named `table-domain` (`unstable-blazing`, `manifest-stewedMeat1`, `curse-wayward`,
      `quest-wandmaker`) and carries the domain id in a column, which is what the five readers
      expose - so downstream code still sees bare domain ids. `tools/compile-mwl.mjs` now fails on
      any diagnostic at all, with no tolerated class and no pinned count.

## 11A. MWG framework backlog (separate repository; roadmap only)

This section is a list of generic proposals for the independent `@datamoc/mw_games` project. It is
intentionally not an implementation plan for this repository: **do not add SPD names, Java formulas,
item values, dungeon rules, sprites, or other GPL game content to MWG.** If one of these proposals
is accepted upstream, this port may consume the published API later and must still keep its
game-specific rules and adapters here.

A checked box here records that MWG delivered the capability, **not** that this port consumes it yet
- the port-side adoption each one still owes is named inline. Pin history: 0.7.7 shipped its items
278-282; 0.7.8 was a patch whose every change lies outside this port's surface; 0.9.0 shipped P3/P4/
P9/P11/P12; 0.9.1 added canonical save/replay and lockstep primitives, which this port does not yet
adopt (its scene state and callback-based world adapters do not satisfy the serializable
command/state boundary those require). The five transitional `SimulationRuntime` adapters keep their
live callback handles outside MWG's `structuredClone`d commands and clear their temporary journals
after dispatch, while the existing local save/restore path remains authoritative.

- [x] **Keep using the existing generic primitives.** `Scheduler.add(actor, delay?, priority?)`,
      `EntityRegistry.add(entity, requestedId?)`, `Inventory` nested containers and instance state,
      `craft()`'s atomic recipe transaction, `ParticleEmitter.frames`, `Blob.spread(open, spread?,
      decay?)`, `TerrainKind.flags`, and MWL's typed tables/references/deterministic emission. 0.7.7
      adds further ready-made primitives the port can adopt as it reaches them (not proposals, so
      not listed individually): the missing UI widgets (`Slider`/`Checkbox`/`Spinner`/`Dropdown`/
      `TextModel`/`DataTable`/`TreeView`/`ScrollBox`), `Layout`/`Skins`, `StoryScreen`/
      `StorySequence`, the battle-UI models, positional audio, IME text input, and MT19937.
- [x] **P0 - Generalise `MultiTurnBeam` traversal.** *Shipped in 0.7.7 (item 278).* **Adopted for
      Tengu's fire cone**: the hand-rolled `tenguFire.cells` ring state is replaced by a per-creature
      `MultiTurnBeam` whose `fronts` resolver carries Java's exact ring rule and whose `onCell` seeds
      the port's fire field, with `restoreFloor` rebuilding the live beam (old saves load by dropping
      that cone, not crashing). The Yog death gaze is deliberately left alone: it is an
      aim-one-turn/fire-the-next effect here and in Java, so `MultiTurnBeam` is not its shape.
- [x] **P1 - Add generic particle spawn bounds.** *Shipped in 0.7.7 (item 279).* **Adopted** for the
      title flame: the column now births across a 4x3 ellipse instead of a single point (the
      `heightLimit` clamp is still unmodelled). The colour-only sparks stay local (a `ParticleEmitter`
      tints per emitter, not per particle), and the hand-rolled decoration spots are converted.
- [x] **P1 - Add a renderer-neutral grid targeting controller.** *Shipped in 0.7.7 (item 280), now
      the single biggest adoption in this section.* `roguelike.TargetingController` is **adopted for
      the six cell-aimed runestones** (Fear/DeepSleep/Shock/Blast/Blink/Clairvoyance) through a
      `beginAiming`/`confirmAiming`/`cancelAiming` trio plus a world-space preview overlay: a click or
      the arrow keys picks the cell, an illegal cell is refused with the real "nothing to target"
      line, and nothing is consumed until a legal cell is confirmed. Also adopted for aimed
      disintegration wands, thrown weapons (with a game-owned validation hook, so cancellation
      consumes neither ammo nor a turn), bombs, and the creature-targeted wands (keeping each wand's
      ally/guardian eligibility in its validation hook). **Remaining**: empty-cell area targeting.
- [x] **P2 - Add reusable tabbed, paginated list primitives.** *Shipped in 0.7.7 (item 281).*
      `ui.TabbedList`/`ListTab` is a renderer-free tabbed, filtered, paged list with selection and a
      detail/close state over caller-supplied rows; the page is derived from the selection, so the
      two cannot disagree.
- [x] **P2 - Add a documented event-to-presentation sequencing recipe.** *Shipped in 0.7.7 (item
      282).* `simulation.EventPresentation` documents the `SimulationRuntime` -> `PresentationQueue`
      tie: command result, animation lock, scheduled secondary actor, cancellation, and save/load
      that resumes idle.
- [x] **P2 - Author non-monster asset references in MWL.** **Shipped in MWG 0.8.1 and adopted.** The
      generic asset-attribute contract accepts these references, and this port uses
      `src/content/asset-references.mwl` for terrain/effect atlas sources plus the generated
      `itemAssetSources` table for the item atlas; `images.ts` validates the emitted manifest against
      the bundled files before loading them. Item-specific frame metadata is already authored in
      `item-rules.mwl`; only its Pixi frame cutting remains renderer-owned. The older dead-end
      experiment in `tools/scratch/*.mwl` is retained as historical evidence.
- [x] **Before proposing further API changes, add framework-side acceptance tests and examples.**
      The 0.7.7 batch already carries its own renderer-free tests in MWG. Any new proposal needs the
      same: renderer-free determinism tests, a minimal example, save compatibility notes, and an API
      report entry in the MWG repository. This port should only add an adoption checkbox here after a
      released version exists and has been checked against its declarations. **Closed 2026-09-19:**
      the port side of that last sentence is now automated - `tools/verifyMwgCompatibility.mjs`
      pins 15 adopted-surface declarations plus a negative `tableReferences` probe (19 checks in
      `test:mwg`), so an adopted-surface regression fails loudly at the gate instead of
      surfacing as a mistyped cast or a wrong runtime shape; `setAssetMap`/`coneSector`/
      `ScreenEffects.sequence` stay
      deliberately unasserted (shipped, not adopted). The framework side holds by process: the
      only open upstream items (P1 caller-chosen ids, P2 Types2D values, the gradient-hook
      candidate) are recorded open and unadopted. See `PORT_COVERAGE.md`'s mwg-usage section.
      **Complexity: S.**

### New proposals from the mwg-usage audit

Everything below is generic - no SPD names, values or art - and by this section's own rule an *API*
proposal wants renderer-free tests, a minimal example, save compatibility notes and an API report
entry in MWG before this port adopts it; P4 is doc-only.

- [x] **P3 - Re-export `extensions` and Pixi's built-in pipe classes from `two-d/pixi-interop`.**
      **Shipped in MWG 0.9.0 and adopted.** All 21 direct Pixi imports under `src/` migrated to
      `mwg/two-d/pixi-interop`, with the explicit `registerBuiltinPipes()` call kept as a defensive
      guarantee before the renderer is created. The remaining direct `pixi.js` dependency is
      intentional: MWG declares Pixi as a peer backend, so the application still supplies the single
      shared Pixi installation.
- [x] **P4 - Two shipped doc comments contradict each other; one over-claims.** **Shipped in MWG 0.9.0
      and confirmed against the installed package.** `Shape2D.d.ts` said `Container2D` "is a type
      alias, not something a game can `new`", while `Types2D.d.ts` re-exported it as "usable in both
      type and value positions"; and `pixi-interop.d.ts` presented built-in pipe registration as a
      universal import side effect, where what actually preserves them is Pixi's own `sideEffects`
      whitelist plus mwg's for `TintedSprite.js` - this port lost a whole session to a
      production-only `renderPipes[...] is undefined` failure in that area, and still registers all
      three pipes by hand.
- [x] **P5 - Pointer parity for `two-d/ui/ListView`. Shipped in MWG 0.7.9 (item 299).**
      `ListView.tapRow(index)` gives the exact select-and-confirm-in-one-step tap this proposal asked
      for. `ListView` itself remains unadopted (no text-menu window - dialogue choices, a save-slot
      list - exists yet to build on it); this port's only per-cell pointer UI is `IconGrid`, which
      already had its own tap parity.
- [x] **P6 - Let a game supply the compiled asset map. Shipped in MWG 0.7.9 (item 300).**
      `assets.setAssetMap(map)` hands `resolve`/`has`/`paths`/`isCompiled` a game's own path-to-URI
      map directly. **Not yet adopted**: this port still hand-rolls its own asset-to-texture plumbing
      (`images.ts`'s `MWL_ASSET_URLS`); adopting it is a separate, larger migration.
- [x] **P7 - Compose, don't only prioritise, in `two-d/render/StatusVisuals`. Shipped in MWG 0.7.9
      (item 301, a breaking change).** `StatusVisuals` now composes every active status's colour
      additively (each channel clipping at 1), never writes the multiply `tint`, and gained
      `flash(color, strength, duration)`. **Not yet adopted**: this port still drives its additive
      tint channel directly rather than through the class.
- [x] **P8 - A phase/sequence API for `two-d/render/ScreenEffects`. Shipped in MWG 0.7.9 (item
      302).** `ScreenEffects.sequence(steps)` chains `fadeOut`/`fadeIn`/`flash`/`hold` phases as one
      call, `update` returning false at every step boundary and true only once the whole sequence
      finishes - exactly the hold-then-fade-back shape this proposal asked for. **Resolved
      2026-09-16 as a deliberate non-adoption**: this port still hand-computes its own fade/hold/fade
      sequencing, because `ScreenEffects` is a flat colour wash and the interlevel curtain is a
      five-stop gradient - adopting it would trade a real visual detail for fewer lines (see section
      8's transitions item). A candidate for a future MWG proposal instead: a gradient/child-overlay
      hook for `ScreenEffects`, which would make the adoption a pure win.
      **P5-P8 were missed by the 0.9.1 re-audit**, which checked the newer canonical save/replay work
      but did not re-walk this older, still-open list against what had shipped in between - a real
      gap in how this section's own maintenance was done, not a framework gap. `Camera.shakeScreen`
      (item 303, same 0.7.9 batch) had already been caught and adopted (P9), which is what makes this
      an audit-process miss rather than 0.7.9 being unreviewed entirely.
- [x] **P9 - A screen-pixel shake helper on `Camera`.** **Shipped in MWG 0.9.0 and adopted.** The
      Java shake wrapper now calls `Camera.shakeScreen(intensity, duration)`, preserving pixel-based
      amplitudes across camera zoom levels.
- [x] **P10 - Say what MWL row ids are scoped to, or make it configurable.** *Shipped in MWG 0.7.9
      (item 304).* `validateCatalog` takes `rowIdScope: 'file'`. This port stays on the global scope
      **deliberately**: its restating tables were renamed to table-unique ids instead, so a per-file
      scope would only weaken the gate, silencing a real same-file collision across tables.
- [x] **P11 - Let `tools/mwl.mjs` carry extra artifacts, or document the library path as the answer.**
      **Resolved in MWG 0.9.0 documentation.** The CLI remains intentionally limited to its standard
      artifacts; this port uses the public MWL library API for its game-owned modules and cross-table
      validators.
- [x] **P12 - A documented `file://` post-build recipe for bundler users.** **Shipped in MWG 0.9.0
      and adopted.** The port's build now calls MWG's packaged `classic-html` implementation to
      rewrite the Vite entry tag, retaining the source-page guard in `index.html`.
- [x] **P13 - An angular cone area, not only a snapped spray - shipped in MWG 0.8.0 (item 322), port
      keeps its own exact translation deliberately.** This port needs Java's `mechanics/ConeAOE`
      exactly (rays every 0.5 degrees, wall-truncated unions, a range clamp), whereas
      `roguelike.coneCells` snaps to the nearest of eight directions. MWG 0.8.0 added the generic
      `coneSector(level, from, to, { degrees, range })` this proposal asked for - but this port does
      **not** migrate its three live consumers (Regrowth wand, Fireblast wand, DM-300's gas check)
      onto it: `src/mechanics/cone.ts` mirrors Java's `float` precision, fills the inner ring at
      radius 4+ and keeps the rim/inner distinction, all of which the generic drops, so adopting it
      would be a fidelity regression. New cone attacks belong on the port's translation.
- [x] **P14 - Per-particle colour, jitter and curves in `ParticleEmitter` - shipped in MWG 0.8.0
      (item 323), adopted here on MWG 0.8.1.** The emitter used to interpolate `scale`/`alpha`
      linearly and take one `tint` for the whole emitter, which cannot express `Sink`'s per-particle
      random colour, `Torch`'s per-frame size re-roll, or `SmokeParticle`'s piecewise alpha. MWG
      0.8.0 ships all three halves (`tint` ranges, `ParticleCurve`, `flicker`); the migration is
      complete (one pooled emitter per spot, FOV gating retained, WaterEmberLayer keeping Java's
      per-cell randomized delay) and browser-verified. The torch halo and well ripples remain
      separate presentation layers because they are not particle pools.
- [x] **P15 - A blocker layer for `Window` - shipped in MWG 0.8.0 (item 324), adopted.** Java's
      `Window` adds a full-screen `PointerArea` under its chrome whose click runs `onBackPressed()`
      unless the click landed on the chrome itself - what makes an outside click dismiss a window and
      what stops a window over a map or toolbar from letting clicks through. MWG's `Window` now takes
      `blocker: true` for exactly this, so every `Window` construction site passes it and the local
      `src/ui/blockingWindowStack.ts` subclass is deleted.
- [x] **P16 - Say who owns the keyboard when a scene and a `WindowStack` both listen - shipped in MWG
      0.8.0 (item 325), adopted.** `WindowStack.handleAction` is now public and the stack's own class
      doc prescribes the chain (`stack.handleAction(action) || myOwnHandling(action)`), which is what
      both scenes do now, keeping `main.ts`'s `blocksWorld` guard and its travel-cancel side effect.
      The old undocumented recipe is superseded; the pointer half of the same problem was P15.
- [x] **P17 - Cut arbitrary rectangles, not only regular grids, in `SpriteSheet` - shipped in MWG
      0.8.0 (item 326), adopted where it pays.** `SpriteSheet.rect(frame, x, y, w, h)` declares
      irregular frames with the same cut-once-and-cache behaviour grids had. Used for the repeat-cut
      sites: `main.ts`'s six variable-width ward frames, `inventoryWindow.ts`'s 16x16 item grid, and
      the title flame's four quadrants. The remaining one-off static crops (toolbar strip, status
      bars, badges, banners, portraits) stay hand-cut `new Texture` calls deliberately: each is cut
      exactly once, so a sheet would add a cache nobody reads twice. Java's per-item *tightened*
      sub-rects stay unported as before - a stated simplification in `images.ts`, not a framework gap.

### Explicitly out of scope for MWG

The following remain port-owned work even when they could be made more generic in theory: SPD
appearance tables and identification, fire/embers and well behavior, exact monster and boss rules,
talents and subclasses, quests, room generation, item effects, Java-derived numbers, translations,
and all SPD art/assets. "Could be represented by a generic primitive" is not a reason to move those
rules or data across the licensing boundary.

## 12. Build and toolchain

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because this is the last numbered roadmap section and preserves its section identity in release
notes and cross-references.

## Definition of done

- Every Java gameplay system has an equivalent TypeScript implementation.
- Every intentional deviation is documented in code and in `PORT_COVERAGE.md`.
- Fixed-seed gameplay traces produce equivalent results across both versions.
- `npx tsc --noEmit`, `npm run build`, automated verification, and browser verification pass.

See `PORT_COVERAGE.md` for the current implementation status and known simplifications.
