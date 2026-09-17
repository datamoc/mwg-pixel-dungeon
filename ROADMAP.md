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
levels).

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
- [ ] Port all remaining weapons, wands, rings, artifacts, bombs, alchemy, and crafting.
      Already done: all 13 real artifact classes, all 12 ring types, all 13 wand classes, and
      generic weapon/armor tiers/upgrades/curses/degradation, and the Duelist T-key weapon abilities
      (all 30 `MeleeWeapon.ability()` overrides with real magnitudes, Java's exact `Charger`
      economy - uniform 1-charge costs, level-based cap, time accrual, partial-first spends,
      post-use `COUNTER_ABILITY` refunds - and Java's setup turn costs, sneak and the charged
      shot free - no missile weapon has an ability at all. Remaining: auto-target, for the damage
      strikes (they pick the nearest visible enemy; sneak's blink aims through the `TargetingController` since 2026-09-17);
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
      Genuinely remaining: `PrismaticImage` and `VaultSentry`, neither of which
      exist in this port at all. **Triaged 2026-09-16, each blocked on its own system, none on
      NPC code**: `PrismaticImage` is summoned by the exotic Scroll of Prismatic Image (section
      1 - exotic scrolls are unported); `VaultSentry` is the scanning sentry of the Halls vault
      quest rooms (`rooms/quest/vault/*`, crystal-key questline - the whole quest is unported);
      `DirectableAlly` drops off the list (2026-09-17): the hawk's orders - its only live consumer -
      are already live (`allyTargetChar`/`allyDefendCell`, re-cast cell selector, `directTocell`'s
      'follow me again'); ShadowClone stays deliberately unoffered and PowerOfMany needs Cleric spells.
      The ported allies (hawk, ghost, mirror image, sheep) run through `allyKind`
      without the base. **Done in the same pass: `ImpShopkeeper`** - a real kind with imp art, the
      shopkeeper's trade window and flee behavior, its own first-sight greeting yell (the
      `greetings_ascent` variant stays out: no AscensionChallenge here), spawned by section 3's
      `unseal()`. See `PORT_COVERAGE.md`'s Shopkeeper row. **Complexity: M** for the two that
      remain, each inherited from its blocker.

## 5. Improve monster behavior and loot

- [x] Fix `Brute`'s enrage. Was a stateless below-half-HP damage boost that never granted Java's
      real one-time near-death revival; now a genuine `hasRaged`-gated revival with the real
      `HT/2+4` shield and flat 4/turn decay. Browser-verified live. See `PORT_COVERAGE.md`.
- [ ] Implement exact wandering, hunting, fleeing, and stealth calculations. **Progress 2026-09-16:**
      the retained-target wandering branch is now isolated as `takeWanderingTurn`, including the
      Java target lifetime, passability checks, piranha water restriction, and Golem's unreachable
      target teleport path; fleeing recovery (`Mob.Fleeing.nowhereToRun()`) is ported since 2026-09-17 - a fleeing mob with no step turns and fights with the real `Mob.rage` line while it sees the hero, else drops back to wandering, unless Terror holds it (Dread has no system here). Hunting/stealth parity remains open. **Complexity: M.**
- [x] Implement monster-specific AI overrides. **Closed 2026-09-17: the last two "Not modeled" halves were already live (Spinner's persistent 3-cell `Web` blob plus the direct root, DM-200's BFS reachability plus the closing-distance-failed vent retry) - only Golem's charge particles and delayed animation remain, with no particle/animation layer to express them.** **Ported**: Golem's teleport-the-hero-away ability
      (with Java's `canTele` reachability, direct-shot distance roll and `MagicImmune` target gate)
      and its 30-turn self-teleport-to-reposition, Eye's real ranged two-turn DeathGaze (charge turn
      costs 2 and takes quarter damage; the fire turn is a magic hit roll for 30-50 bypassing armor),
      DM-200's venting override, Spinner's ranged web, the Necromancer's skeleton support (heal
      `HT/5`, one-time Adrenaline, teleport-back) and `firstSummon`'s variable tick cost via the new
      `monsterTurnCost` hook. **Not modeled**: Golem's charge particles and delayed animation;
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
      every missing blob is missing its producer, not its effect table - `SmokeScreen` (no smoke bomb item, no ShroudingFog exotic, no ChaoticCenser trinket), `Inferno`/`Blizzard` (no brews, no censer), `Electricity` (**closed 2026-09-17**: ShockingTrap/StormTrap seed Java's real volumes into a persisted blob with the paralyse-by-charge plus odd-charge depth-scaled zap; still no ShockingBrew, ElementalStrike/Blast unoffered; the pylon/Tengu zaps use it as a damage cause only, which the zap path already models), `StormCloud` (no StormClouds exotic, no censer; the Tengu-arena grid belongs to the boss-cycles item), `Foliage` (regrowth grows grass through its charge rules, no blob needed), `VaultFlameTraps` (vault quest unported). Non-gaps: `GooWarn` is unused in Java's own source; `Alchemy`/`WaterOfAwareness`/`WaterOfHealth`/`WellWater` are window flows here by design. Still open as stated: the gas blobs' own effects beyond what's live, the unsupported fire cases,
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
- [ ] Implement exact Tengu, DM-300, and other boss attack cycles. **Complexity: M.**
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

- [ ] Implement exact formulas for the remaining talents. Six wrong-shaped stand-ins have been
      corrected against the real source (Lethal Haste, Weapon Recharging, Farsight, Arcane Vision,
      `POINT_BLANK` - an accuracy factor and nothing else, applied inside `adjacentAccFactor` - and,
      in the 2026-09-09 audit, Hearty Meal, Sucker Punch, Aggressive Barrier and the per-tier
      talent-point pools, which had wrongly been one shared pool). Test Subject/Tested Hypothesis/
      Swift Equip are genuine talents. `Iron Will`'s invented flat-damage-reduction stand-in is
      replaced by the real `BrokenSeal` shield mechanic. Cleric's entire talent tree is Mage's copied
      verbatim, documented as such in `src/talents.ts`, not replaced - a real tree needs the Cleric's
      own Holy Lantern/spell mechanics first. **Remaining**: everything blocked on systems this port
      lacks (SoulMark/Wraith for Necromancer's Minions, a real Cleric tree;
      `durable_tips` dropped off this list 2026-09-17 - tipped darts are live). **Methodology note worth keeping**: check `src/generated/spdMessages.ts`'s own real
      `actors.hero.talent.*` strings before concluding a talent id is invented - an earlier audit
      checked only two Java tags and wrongly declared several real talents fabricated. See
      `PORT_COVERAGE.md`'s talent rows. **Complexity: L.**
- [x] Implement rune transfer and shared-enchantment behavior. **Closed 2026-09-17: both named halves were already live - the "rune transfer" title has no other referent in code, coverage or Java's hero/talent sources (the only "rune" there is the Runestone/Recall-Inscription line), so it reads as the bow-enchantment transfer `shared_enchantment` performs.** Sniper's `shared_enchantment` proc is
      live for thrown hits with Java's `Random.Int(3) < points` gate and explicit ranged attack
      provenance; Warden's `durable_tips` is live in `missileDurabilityCost()` via `tippedDartUseDivisor` (the "waits on a real TippedDart item" premise was stale - tipped darts exist as `tippedSeed` payloads, shop stock and wielded ammo), verified against `TippedDart.durabilityPerUse()` (`use /= (1 + points)`, rot exempt). The three places that repeated the stale premise (`src/talents.ts` comment, two `PORT_COVERAGE.md` rows) are corrected in the same pass.
- [ ] Complete subclass and armor-ability effects. The authored `armorAbilities` table carries all 18
      real `HeroClass.armorAbilities()` entries (base charge use, targeting mode, three tier-4
      talents each); the King's Crown's own `WEAR` action opens SPD's real choice panel, with
      `ClassArmor.upgrade()`'s state changes (charge starting at Java's 50, the four rank-4 talents
      registered, `Hero.talentPointsAvailable(4)`'s exact curve) and the charge meter regrowing at
      `ClassArmor.Charger`'s `100/500` per tick times the Ring of Energy multiplier. **Seven
      abilities are fully ported, formulas included, and browser-verified**: the Warrior's Heroic
      Leap/Shockwave/Endure, the Rogue's Death Mark and Smoke Bomb, the Huntress's Spectral Blades/
      Nature's Power/Spirit Hawk, the Mage's Warp Beacon, the Duelist's Feint. **Still open, and
      deliberately not offered** (`armorAbilitiesFor()` offers only what can actually run, so a class
      with none keeps the crown's old description line rather than an empty choice): the remaining
      five abilities (Mage's two, Rogue's `ShadowClone`, Duelist's other two) each need a system this
      port does not have, and the Cleric's three have neither strings nor a spell system here.
      **Also not ported, and stated**: `ClassArmor` as a distinct item (no `AC_TRANSFER`, no
      class-armor sprite tier), and Ratmogrify's three rat talents (its real 50 charge cost and
      double-turn bug are fixed, but no `TransmogRat` actor exists for them to act through). See
      `PORT_COVERAGE.md`'s armor-ability section for the per-ability reason. **Complexity: L.**
- [ ] Match Java talent timing, identification, recharge, and threshold rules. Tier-4 threshold
      timing is now real (the tier's window, its `armorAbility == null` gate and its point curve are
      Java's `Hero.talentPointsAvailable(4)` rather than the earlier "T4 is never granted"
      simplification). The rest of this line is open. **Complexity: M.**
- [ ] Complete class-specific item and ability behavior. `SuckerPunchTracker` is ported (the Rogue
      surprise bonus uses Java's `Random.IntRange(points, 2)` once per stable enemy, with save/load
      and death cleanup). The rest of this line is open. **Complexity: M.**
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

- [x] Implement area-of-effect traps instead of single-target approximations. Explosive traps apply
      Java's reduced off-center blast damage to nearby creatures, and toxic, fire, shocking and storm traps seed the
      live area effects. **Remaining**: exact Java projectile presentation, terrain destruction, and
      cadence.
- [x] Implement chasm falling and traversal. `isChasmCell`/`fallThroughChasm` model the terrain;
      `Chasm.heroLand()`'s real Cripple + HP/HT-scaled landing damage and the Levitation bypass are
      ported. **Remaining**: source-specific Bleeding death badges/blood visuals, the feather-fall
      item, landing sound/camera shake. See `PORT_COVERAGE.md`'s `Chasm.java` row.
- [x] Implement water and terrain hazards. **Closed 2026-09-16 by auditing Java's own terrain table
      against this port rather than repeating "other hazards remain"**: `Terrain.java`'s flags carry
      exactly three behaviour classes - `PIT` (chasm), `LIQUID` (water) and `AVOID` - and each is
      accounted for. Water: `Level.java`'s per-turn hook (a non-flying char standing in `WATER`
      extinguishes `Burning`, matching `Burning.act()`) is ported for hero and monsters alike,
      collapsed to an immediate extinguish once the turn's DoT tick has landed rather than
      reproducing the exact one-turn-late timing; Ooze's own water interaction is ported too
      (CausticSlime/Acidic/FetidRat/Corrosion feed a real `ooze` buff instead of the shared `poison`,
      and standing water washes it off). Chasm: `Chasm.heroLand()`'s Cripple + HP/HT-scaled landing
      damage and the Levitation bypass (section 7's own chasm item). `AVOID` is **deliberately
      collapsed into `passable`** and that is the one real simplification here, now stated rather
      than implied: Java's `avoid[]` marks cells you may enter or path over without being ordinary
      floor (chasm, `TRAP`, `WELL`), and every one of its readers is either a `passable || avoid`
      test (`Char.java` 1256, `Hero.java` 1782, `WellWater.java` 89, `Dungeon.java` 1038,
      `Preparation.java` 288/293) or the flying exception to one (`Combo.java` 500's
      `flying && avoid`, which is exactly how a flyer crosses a chasm) - so a game that already
      treats those cells as enterable answers every one of them the same way, which this port does
      (`canStepOnto`'s pit branch, traps walkable). The one place it shows is `WELL`, which Java keeps non-passable and this port maps
      to plain floor (its own stated simplification, see `gameBridge.ts`'s mapping table). Also
      still unported, and tracked with the mining work rather than here: `MINE_CRYSTAL` and
      `MINE_BOULDER`, the two terrain kinds Java's pickaxe accepts alongside `WALL`/`WALL_DECO` -
      this port has no equivalent of either (see `canMineCavesWall`'s own comment). See
      `PORT_COVERAGE.md`.
- [ ] Complete plant growth and plant interactions. Live: one-shot regional plant activation,
      Java-aligned single-target statuses, Sungrass healing-over-time, Warden-sensitive variants,
      Icecap/Rotberry blob diffusion, Dewcatcher's 3-6 distinct dewdrops, Seedpod's 2-4 generated
      seeds, Lotus seed preservation, Fadeleaf freeing a rooted hero (and teleporting movable mobs),
      non-hero plant activation, and Earthroot's real block *pool* (`HT` points absorbing
      `min(damage, (scalingDepth+5)/2)` per hit, ended by exhaustion or leaving the cell) - which
      also corrected the Entanglement glyph, previously modelled as a cripple lock on the attacker
      instead of the same pool on the defender. **Remaining**: exact teleport/TimeBubble behavior,
      full dew collection rules, Sungrass's monster Health buff (reduced to immediate full healing),
      Earthroot's monster armor pool, and Java's `HazardAssistTracker`/teleport presentation. See
      `PORT_COVERAGE.md`. **Complexity: M.**
- [x] Implement the remaining Java seed and dew behavior in high grass. **Closed 2026-09-16** once the
      three things it named were each checked rather than carried: the waterskin/dewdrop interaction was
      already ported and exact, the boss-challenge flag was a whole unported badge rule (now its own item
      in section 6), and the furrowed visual was reachable-but-collapsed and now draws its own art. The
      one genuine remainder, Java's `fx` bolt animation for the growth cone, is the *wand's* presentation
      rather than seed/dew behaviour and is tracked with the wand's own row in `PORT_COVERAGE.md`.
      Original text follows. Live: real seed payloads and
      planting, `WandOfRegrowth`'s charge-scaled regional growth over Java's own `ConeAOE`
      (`src/mechanics/cone.ts`, a line-for-line translation), Lotus spawn/expiry/preservation, and
      Huntress furrowed state persisting across floor saves. **Corrected 2026-09-16: two of the three
      things this line listed were not gaps in *this* item, and one was not a gap at all.** The
      waterskin/dewdrop interaction is ported and exact (verified against `Dewdrop.doPickUp`/
      `Waterskin.execute(AC_DRINK)`: the drop goes into the flask while it has room, `dropsNeeded` is
      `missingHealthPercent/0.05` with the same `ceil(x - 0.01)` and `gate(1, …, volume)` clamp, the
      `SHIELDING_DEW` top-up makes the same shield `min`-trimmed heal split, and only the
      `VialOfBlood.delayBurstHealing()` clause is missing - that item does not exist here). The
      "Dwarf King's boss-challenge-badge flag" is not a grass gap at all: it is the whole
      **`BOSS_CHALLENGE` badge**, whose real rule is a *weapon-only* boss kill - `qualifiedForBossChallengeBadge`
      is set true at all five boss fights' starts (`CavesBossLevel`/`CityBossLevel`/`HallsBossLevel`/
      `PrisonBossLevel`/`SewerBossLevel`'s own `progress()`/`seal()`), cleared when the hero deals
      any damage that is not a plain weapon hit (each boss's `damage()` override: `DwarfKing.java`
      459-467 clears on unarmed-without-`RingOfForce`, on any `Wand` except `WandOfLightning`, and on
      a `ClericSpell`; `Goo`/`DM300`/`Pylon`/`Tengu`/`YogDzewa` have their own sites), and awarded at
      that boss's death - so it belongs with the badges, not here, and it is a real piece of work
      rather than a flag: this port's badge catalogue is its own smaller set (one boss badge per
      chapter, `src/badges.mwl`) with no `BOSS_CHALLENGE_1..5` in it, and clearing the flag needs a
      damage-*source* notion at every boss's damage sites, which this port's inline monster-damage
      paths do not thread today. What actually remains here is Java's `fx` animation for the wand's
      growth. **The furrowed visual is no longer simplified (2026-09-16)**: this line claimed the
      two states shared one frame, and `foregroundGrassFrame` shows they did not - it already
      returns Java's own cuts (`152`/`156` for `FURROWED_GRASS` against `151`/`155` for
      `HIGH_GRASS`), but nothing could reach the furrowed pair, because the renderer's terrain value
      collapsed both kinds onto the high-grass constant before consulting the raw grid. The live
      `visualTerrainAt` now answers `30` for a furrowed cell from the state the floor already
      persists, so a Huntress's trampled grass draws its own art; pinned two ways
      (`verifyVault.mjs` recomputes the four frame numbers, and
      `tools/scratch/furrowed-grass-livecheck.mjs` reads the live value, 3/3). What stays coarse,
      and is the stated remainder here: the *flat* ground layer still renders both kinds with one
      frame (`terrainFrameAt` returns the shared grass frame, where Java's
      `FLAT_FURROWED_GRASS` is its own cut) - only the raised/foreground overlay distinguishes
      them. **Complexity: S.**
- [x] Match hunger and starvation damage exactly (`Hunger.act()`'s real `partialDamage` fractional
      accrual and crossing-into-STARVING 1-damage hit, replacing the former flat "every 10 turns"
      guess). Java has no attack-delay/accuracy penalty while merely hungry beyond the log line, so
      there is no further penalty to match there.
- [ ] Match stealth, invisibility, surprise, and attack-delay systems exactly. Ported: sleeping
      wake-ups roll the real `1/(distance+stealth)` detection gated on the mob's own sight, with
      Silent Steps and levitation as their real never-wake immunities; the negative-buff wake (any
      real negative-type buff wakes a sleeping monster unconditionally, no roll, even out of sight);
      the WANDERING notice roll; persistent random-destination patrol state including save/load and
      piranhas' water restriction; and the whole invisibility half - `Preparation` is a real state
      (the attack's damage roll is replaced by the best of 1-3 rolls plus 10/20/35/50% at 1/3/5/9
      turns invisible, read before the invisibility dispel, and the execute fires only while it is
      up) plus its blink action (a real toolbar action attacking in place or stepping to the cheapest
      free cell beside a visible hostile, refusing an unreachable or rooted case with Java's own
      message). **Remaining**: specialized ally-aware ranged targeting, STRReq/flail surprise gating,
      and `Mob`'s wound-instead-of-surprise presentation. See `PORT_COVERAGE.md`'s sleeping/wandering
      and `Preparation` rows. **Complexity: M.**
- [x] Implement shield decay. `Barrier.act()`'s real `min(1,shielding/20)`-per-turn proportional
      curve runs every hero turn against the shared `heroBarrier` pool, and `Blocking` owns a
      separate `blockingBarrier` pool with `ShieldBuff.shieldUsePriority = 2` draining before
      `heroBarrier`'s priority-0 pool in `absorbHeroDamage`, exempt from the proportional accrual,
      with max-semantics and an always-reset 5-turn timer (plus a load-time carve-out migration for
      pre-two-pool saves). **Remaining**: `HoldFast.buffDecayFactor()` scaling of both clocks and the
      `ProvokedAngerTracker` a fully-broken shield grants (both need the section 6 talent systems),
      and Healing-over-time beyond Sungrass.

## 8. Complete UI and input parity

- [ ] Port full inventory, bag, sub-bag, item-detail, and item-use windows. Item-detail (real
      per-item descriptions, resolved through `inventoryPanel.ts`'s MWL description tables, each a
      real authored Java `.desc` key) and item-use (activation for food/potions/scrolls/rings/armor/
      wands) are both already done. The four bags (VelvetPouch/ScrollHolder/PotionBandolier/MagicalHolster)
      now exist as ownable, named, priced, sellable goods with the real shop pick - what stays open is their container behavior (contents, `grabItems` on pickup, capacity, an open action), not their existence. See `PORT_COVERAGE.md`'s bag row.
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
- [ ] Implement large interface-size layouts. **Complexity: M.**
- [ ] Port the hero information window, busy indicator, talent animations, and quick slots.
      **Complexity: M.**
- [ ] Support armor-dependent hero portraits and complete sprite/effect animations.
      **Complexity: M.**
- [x] Audit every static `t('port.*')` call site against `portStrings.ts`'s EN/FR tables. A script
      walk found 45 keys missing from EN and 47 from FR - all fixed (window titles, victory/defeat
      screens, `port.action.bag`/`port.talent.*`, ~20 combat log lines), plus two French-specific
      bugs a player caught live ("bolt" mistranslated as `trait`, and a subject-first rewrite to
      avoid a bare "de {who}"). Follow-ups the same session closed two more classes of the same gap:
      the dynamic template keys (`port.armor.*`/`port.subclass.*`/`port.affix.*`, all missing), and
      the 33 `this.say('English', ...)` calls that skip `t()` entirely and so are invisible to a
      literal-key audit. **Note for future work**: the audit script only catches literal
      `t('port.…')` arguments; dynamic template keys need a manual check.
- [ ] Translate the port's own strings into every Java locale. All 19 offered locales carry a
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
      is not a strings-only change: eight keys the port references
      (`actors.mobs.dm300.rocks`/`.vent`, `items.quest.pickaxe.ac_mine`/`.no_vein`,
      `levels.level.sign_desc`/`.sign_name`, `scenes.titlescene.badges`, `windows.wndjournal.notes`)
      exist in the v2.1.4-derived catalog and do not exist at `v3.3.8`, so the extractor's
      transactional audit refuses the regeneration until each is re-pointed or moved under `port.*`.
      The reverse gap exists too: `levels.hallslevel.exit_desc` (addressed by section 3's city
      visuals) exists at `v3.3.8` but not in this catalogue, so the port answers the City's own
      exit desc there until the regen lands. See `PORT_COVERAGE.md`. **Complexity: M.**

## 9. Build the Java-vs-TypeScript parity harness

**Status check**: none of these six are done in the literal sense this section asks for - an actual
differential harness running both the real Java build and this port side by side against identical
seeds/traces - and none should be marked `[x]` on the strength of what already exists. What does
exist, so the gap is the real remaining one rather than a from-scratch build:
`tools/verify*.mjs` (wired into `test:simulation`, 65+ checks) already pin combat rolls, damage
curves, buff timing and turn-cost/scheduling - but as *values checked against a transcription of the
Java source*, not against a running Java build, which is the bar "compare both implementations"
sets. `PORT_COVERAGE.md` already does the sixth bullet's classification row by row, as a running
narrative rather than one finished audit pass. Screenshot/animation-timing comparison has real
infra (pixel-hash probes, per-feature `*-livecheck.mjs` scripts) but only for the things those
scripts targeted. **Genuinely unstarted**: an actual second, real Java instance to compare against
(this checkout has no build of the Java game, only its source for reading), fixed-seed RNG-call-order
comparison, and loot/quest/boss-transition/save-load comparison.

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
      real `miniboss` actor property). **Still approximated**: the execute test uses the predicted
      post-hit HP rather than the HP `damage()` actually leaves (so a shielded defender can be
      executed slightly early), and `CombinedLethality`'s weapon-changed arming gate is unmodelled.
      **Complexity: L.**
- [x] Compare `mwg/i18n` against the plan's section 22C "Semantic Messaging" shape before committing
      to SPD-ADR-012. It matches (`SemanticMessage`/`MessageChannel`/`MessageFormatter`/
      `createCatalogFormatter`, `EntityTextResolver`/`GrammaticalEntity`, CLDR plurals, FTL, catalog
      audit tools), and the catalog mechanism is already adopted. Pending is only the message half
      (typed messages at `say()` sites, combat log lines as pilot).
- [ ] Continue producing the section 22A/22B analysis matrix for the remaining monster/item/buff
      families before migrating each one's code, per SPD-ADR-010. **Progress 2026-09-16:** the
      second matrix, `MONSTER_ANALYSIS_DM200_DM300_PYLON.md`, covers an ordinary mob, its variant,
      a fixed-floor boss, and its supporting actor; it confirms data aliases and keyed strategies
      rather than Java-style classes. Remaining monster/item/buff families still need the same
      treatment. **Complexity: M.**
- [ ] **MWG-utilization audit**: checked whether this port reimplements functionality `mwg` already
      exports. Well-utilized overall, no action needed on `Roguelike.Pathfinder`/`Blob`/
      `Actors.rollLoot`/`Charges`, the `EntityId` re-export, the Java-bit-matching LCG RNG
      (`spdRng.ts`, correctly not using mwg's xoshiro) or `ui/floatingText.ts` (a justified sibling,
      not a duplicate). Three genuine gaps were found, and all three are resolved in the same pass -
      `heroBarrier`'s pooled model (three real bugs, not one ordering simplification), section 10's
      stale `eternalFire` claim, and `summonSkeleton`'s push-aside (where the audit's own suggested
      `knockbackPath` fix would have been wrong - Java's rule is an 8-neighbour search maximizing
      `trueDistance`, needing no framework primitive at all). No UI-widget/i18n-catalog/scheduler/
      FOV/geometry reimplementation found elsewhere. The audit itself is complete; only a re-run on a
      future `mwg` bump is outstanding. See `PORT_COVERAGE.md`'s mwg-usage section.
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
- [ ] **Before proposing further API changes, add framework-side acceptance tests and examples.**
      The 0.7.7 batch already carries its own renderer-free tests in MWG. Any new proposal needs the
      same: renderer-free determinism tests, a minimal example, save compatibility notes, and an API
      report entry in the MWG repository. This port should only add an adoption checkbox here after a
      released version exists and has been checked against its declarations. **Complexity: S.**

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

## Definition of done

- Every Java gameplay system has an equivalent TypeScript implementation.
- Every intentional deviation is documented in code and in `PORT_COVERAGE.md`.
- Fixed-seed gameplay traces produce equivalent results across both versions.
- `npx tsc --noEmit`, `npm run build`, automated verification, and browser verification pass.

See `PORT_COVERAGE.md` for the current implementation status and known simplifications.
