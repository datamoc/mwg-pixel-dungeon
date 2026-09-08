# TypeScript parity roadmap

Goal: make the TypeScript game functionally equivalent to the Java Shattered
Pixel Dungeon implementation. Every completed item should be checked against
the corresponding Java source and recorded in `PORT_COVERAGE.md`.

`tools/roadmap-progress.html` renders this file's own checkbox completion (overall and
per `##` section) as real `mwg` `two-d.ui.Bar`/`Label` widgets, loaded from the
standalone `mw_games.global.js` build (no bundler needed). Serve the repo root (e.g.
`python -m http.server 8000` from the repo root - not `dist/`) and open
`http://localhost:<port>/tools/roadmap-progress.html`; it `fetch()`es `../ROADMAP.md`
directly, so opening the file via `file://` won't work (see this project's own
browser-verification workflow for why).

## 1. Complete the item system

- [x] Wire `rollAffix`/`ENCHANT_TABLE`/`GLYPH_TABLE` into real item generation and equip.
      Found and fixed the same pass: `Actors.rollAffix` was never called anywhere, so no
      weapon/armor obtained through normal play was ever assigned a concrete enchant/glyph/curse
      id. `generatedInventoryItem` now rolls one via a new `rollGeneratedAffix` helper
      (curse-pool pick when `generated.cursed`, weighted good-enchant pick when
      `generated.hasGoodEnchant`), and `equipWeapon`/`equipArmor` gained the real cursed-and-known
      equip-lock rings already had. See `PORT_COVERAGE.md`'s "Enchant/glyph/curse assignment"
      row - **flagged there as implemented but not yet confirmed in a live browser session**
      (the sandboxed environment's local HTTP servers all fail to bind a socket), so treat this
      as needing a playtest pass before fully trusting it.
- [ ] Port all remaining weapons, wands, rings, artifacts, bombs, alchemy, and crafting.
      Rings: all 12 real types are now live (Haste, Energy, Wealth, Arcana, Force, Sharpshooting from earlier passes, plus Elements and Furor this pass - see PORT_COVERAGE.md's rings row; type-check clean, browser verification still owed per section 10) - Sharpshooting mirrors Force's shape for ranged attacks: a flat `+level`
      damage bonus on thrown missiles (both bounds) and SpiritBow (asymmetric: `+level` on the
      low bound, `+2*level` on the high one, matching `SpiritBow.min()`/`max()` exactly), plus a
      `1.2^level` durability multiplier folded straight into the existing `uses` calculation
      that already drives `ammoDurability`'s per-throw decrement. Force's flat `+level`
      melee-only damage bonus (`ringForceBonus`, gated the same way this
      port's other hero-only attack bonuses already are - `attacker === this.hero` is only true
      at the real bump-attack call site, never `useSpecial`'s throw/shoot/zap branches, matching
      Java's own `MissileWeapon` exclusion for free) needed no new system either. Wealth's
      flat `1.20^level` drop-chance multiplier (`ringWealthMultiplier`, applied to `MOB_LOOT`'s
      roll in `kill`) needed no new system at all, the "blocked" claim was stale; its separate
      bonus-item generation (`tryForBonusDrop`'s escalating rare-loot tracker) remains unported, a
      real narrower gap now rather than a total block. Arcana's real scope turned out much
      smaller than first guessed: it's a `1.175^level` proc-*chance* multiplier real Java only
      folds into whichever enchant's own `proc()` explicitly calls `procChanceMultiplier()` -
      **corrected this pass: the old text here claimed curses never call it "by design" - wrong
      (checked tag `v3.3.8`: Annoying/Dazzling/Explosive/Sacrificial/Displacing/Friendly and
      AntiEntropy/Corrosion/Displacement/Metabolism/Multiplicity/Overgrowth/Stench all do;
      only Polarized has no chance roll at all). Every ported curse chance-proc now scales, and
      Sacrificial's base chance is corrected (flat 1/12 was a guess; real is 1/10)** - and of
      this port's ported good-enchant procs, Grim/Lucky/Blocking/Blooming roll a chance real
      Java scales this way (Blazing/Chilling/Shocking/Vampiric are
      unconditional here, a separate pre-existing simplification with no roll left to scale).
      `ringArcanaMultiplier()` now feeds all of them. Elements/Furor are now ported (this pass), both genuinely - not just assumed - needing more than a stale-claim fix, and both got it: Elements applies RingOfElements.resist()'s real pow(0.825, level) at each hero-side elemental-damage site (burning/poison DoT tick, toxic-gas blob damage, burning-trap fire damage - all in RESISTS, scaled before Barrier absorption like Hero.damage()'s own ordering; durations untouched, as in Java), since this port has no equivalent of Char.resist(Class)'s single shared dispatch. Furor got the attack-only turn-cost split it needed (a new getAttackTurnCostMod(), blanket divided by RingOfFuror.attackSpeedMultiplier()'s real pow(1.09051, level), spent only for bump-attacks via a move-port pre-check; movement keeps the blanket cost, matching Java's attackDelay()-vs-speed() split). See PORT_COVERAGE.md's rings row.
- [x] Port the remaining potions. `PotionOfLevitation` is now live (real buff + chasm bypass,
      matching the trap bypass Levitation already had); a live id-mapping bug that made
      generated `PotionOfLiquidFlame`/`PotionOfInvisibility` silently quaff as Purity is fixed.
      `PotionOfToxicGas`/`PotionOfParalyticGas` are now live too: both are real Java "gas blob at
      your own feet" potions (`Potion.apply(hero)` is just `shatter(hero.pos)` - drinking one
      gases yourself exactly like throwing it at yourself, so this port's quaff-only flow already
      matches Java's own effect, no simplification needed there), now backed by dedicated
      `toxicGas`/`paralyticGas` blobs (direct `1+scalingDepth()/5` damage/turn and a per-turn
      `paralysis` reapplication respectively) shared with `ToxicTrap`, which was fixed in the same
      pass to seed the real blob instead of an instant `poison` buff it never had in Java.
      `PotionOfHaste` is now ported too, found stale in a later pass: the "needs a hero speed
      buff system this port doesn't have" premise no longer held once `getActionTurnCostMod`
      existed (added for Weapon Augment/Swiftness/RingOfHaste) - a real `haste` buff
      (`BUFF_DURATION.haste = 20`) now applies `Char.speed()`'s own `*3f` there as `mod /= 3`,
      the same shape RingOfHaste's multiplier already used. `PotionOfFrost` is now ported (Simplified, and the last generated potion id missing its own branch - it silently quaffed as Purity before): no blob-freezing terrain and no freeze/immobilize status distinct from paralysis exist here, so it extinguishes the hero's own `burning`, deals Liquid Flame's own 4 damage to the nearest visible enemy, and applies `daze` as the chill stand-in (the same substitution the WandOfFrost branch already documents) - see `PORT_COVERAGE.md`'s new row. All 12 generator potion classes now have their own branch (type-check/build only, browser verification owed per section 10) - see `PORT_COVERAGE.md`'s
      potions row for what currently happens instead. (There is no `PotionOfConfusion` in real
      Java - the
      earlier text here was wrong; `ConfusionGas` is a trap-only blob, unrelated to potions.)
- [ ] Port the remaining scrolls. Fixed the same class of live id-mapping bug for
      `ScrollOfMirrorImage`/`ScrollOfMagicMapping` (both silently read as Remove Curse instead of
      their real, already-ported effects). `ScrollOfRecharging` is now ported (grants the
      already-modeled `recharging` buff, previously just never wired to a scroll).
      `ScrollOfTeleportation` is now ported too (random-free-cell placement + Roots clear,
      reusing the same search the Displacing/Displacement curses already had, now factored into
      a shared `randomFreeCell()` helper). `ScrollOfTerror` is now ported (a new `terror` buff
      forces `takeMonsterTurn`'s existing `decideMonsterAI` fleeBelow threshold to 1, the same
      mechanism Thief's fleeing already uses). `ScrollOfRetribution` is now ported too (minus
      `Blindness`, which this port has no seam for) - this also uncovered `Weakness`/
      `Vulnerable` as fully-wired but previously never-granted dead code, and corrected both
      buffs' durations (`10` -> the real `20`). `ScrollOfTransmutation` remains unported (needs
      a full item-transmutation system plus a generic item-picker UI this port doesn't have)
      but no longer falls through to Remove Curse's effect when read - it now refuses cleanly
      WITHOUT consuming the scroll (`port.log.transmutationfizzle`, same shape as the
      upgrade-scroll guard) - see `PORT_COVERAGE.md`'s new row.
- [ ] Port the remaining enchantments, glyphs, weapon curses, and armor curses. Only 1 weapon
      curse now lacks proc logic at all (`friendly` - checked against `Friendly.java` this pass:
      mutual Charm plus zeroing damage to the charmed target, needs the two-way Charm subsystem
      the missing-subsystem bullet below already tracks). `Blooming` (uncommon, real
      `(lvl+1)/(lvl+3)` chance, level-scaled plant count, defender-first/shuffled-neighbour order)
      and `Camouflage` (uncommon, `round((3+lvl/2) x arcana)` invisibility on grass trample) are
      now ported - both genuinely fitting existing systems (plantable terrain + buff map), verified
      against tag `v3.3.8` source, not assumed. **Found and fixed in the same audit: no `Fragile`
      armor curse exists in real Java** (checked `v3.3.8` back to `v3.3.1` - closest match is a
      `v1.x`-era changelog mention); the real 8th curse is `Stench` (1/8 x arcana to seed
      250-volume ToxicGas at the wearer's own feet), now ported with a `fragile`->`stench` load
      migration plus a `getCurse` legacy shim. See `PORT_COVERAGE.md`'s new rows. Remaining, each
      still needing its own system first: Kinetic's decay read-back is live but Corrupting's
      conversion, Elastic/Projecting's geometry, Unstable's meta-dispatch, and Affection/
      AntiMagic/Brimstone/Obfuscation/Repulsion/Viscosity (Obfuscation checked: its stealth boost
      feeds a distance roll this port's FOV-binary `seesHero` has no seam for). `polarized`/
      `sacrificial`/`displacing` gained real proc branches in an earlier pass, alongside the
      already-live `wayward`/`annoying`/`dazzling`/`explosive`.
- [x] Implement weapon augments. **This roadmap line's own history is worth reading before
      trusting any future "done" claim on it: it was marked done, then found still-wrong by its
      own next revision, then actually finished on a third pass** - a real cautionary example of
      why "the formula is correct" and "the feature is reachable" are different claims that both
      need checking. Pass 1 wrongly declared it blocked (no fractional-turn-cost system). Pass 2
      correctly un-blocked that part (`getActionTurnCostMod` is real) but wrongly declared the
      whole feature "fully wired" without checking for an actual `weaponAugment =` assignment
      site anywhere outside the save-restore line - there wasn't one, so the correct formulas
      were completely unreachable through real gameplay. Pass 3 (this one) actually built the
      missing piece: a `stoneOfAugmentation` item (id-mapped from the generator's already-present
      `StoneOfAugmentation` class, previously silently collapsing into the generic `'stone'` id
      alongside 10 other still-unported runestones - a real, wider gap noted but not closed
      here), a `useStoneOfAugmentation()` bag-use action, and a `chooseAugment()` choice reusing
      the existing armor-ability/subclass choice-panel mechanism (a new `augmentChoiceOpen` flag
      threaded through the same handful of gate conditions, with its own full-width stacked-row
      layout instead of that panel's usual 2-column one, since Augment's option text is longer).
      Auto-targets the hero's own equipped weapon rather than presenting Java's real item-picker
      (this port's established convention for "use item on another item" actions). Real Java's
      stone also grants a genuine bonus weapon-upgrade level alongside the augment choice - not
      reproduced, since this port's own upgrade path is tier-based with no free-standing "+1
      level" primitive to borrow without disturbing that tier state machine - stated as a
      deliberate simplification, not silently dropped. Also fixed in passing: `groundKindForItem`
      had no case for `'stone'`/`'stoneOfAugmentation'` bag ids at all, so any generated runestone
      dropped as ordinary floor loot fell through to the caller's fallback (`'food'` at the one
      real call site) instead of rendering/behaving as a stone - pre-existing, not introduced by
      this change. Browser-verified live end-to-end: using the stone opened a real French choice
      panel ("Choisir un augment d'arme" / "Vitesse (+20 % de vitesse d'attaque)" / "Dégâts (+20 %
      de dégâts)" / "Aucun"), choosing Speed set `weaponAugment` to `'speed'`, closed the panel,
      logged "Arme augmentée : Vitesse (+20 % de vitesse d'attaque)." and immediately changed
      `getActionTurnCostMod()` from `1` to the real `0.8`. See `PORT_COVERAGE.md`'s enchant/glyph
      row.
- [x] Port three more runestone (`Cat.STONE`) types beyond Augmentation: `StoneOfFear`,
      `StoneOfDeepSleep`, and `StoneOfShock`, each getting its own item id
      (`stoneOfFear`/`stoneOfDeepSleep`/`stoneOfShock`, wired through
      `generatedInventoryItem`/`sourceInventoryItem`/`groundKindForItem` the same way
      Augmentation's id was) and a use-action, since all three auto-target the nearest visible
      enemy the same way `useSpecial`'s ranged targeting already does - no map-click cell-targeting
      exists in this port for either the real thrown-stone aim or the choice of ally-vs-enemy a
      full `StoneOfFear` needs, so this only ever affects an enemy, never an ally (moot anyway,
      no ally-vs-monster combat exists). `StoneOfFear` applies the `terror` buff `ScrollOfTerror`
      already grants and `takeMonsterTurn` already honors in full - no new mechanic needed, just
      a new way to reach the existing one. `StoneOfDeepSleep` reuses the exact same instant-sleep
      simplification `ScrollOfLullaby` already uses for real Java's gradual `MagicalSleep`/`Drowsy`
      debuff (setting `sleeping = true` directly), just on one auto-targeted enemy instead of every
      visible mob. `StoneOfShock` paralyzes every creature within a Chebyshev-distance-2 circle of
      the auto-targeted enemy (real Java uses a wall-aware `PathFinder` flood fill instead, and a
      1-turn paralysis rather than this port's shared 3-turn `paralysis` buff - both stated
      simplifications, not silently dropped precision) and refunds the hero's wand `1 + hits`
      charges via the existing, already-generic `Actors.Charges.refund`. Browser-verified live:
      adding a fresh `stoneOfFear`/`stoneOfDeepSleep` to the bag and using each against a test
      target applied `terror: 20` and flipped `sleeping` to `true` respectively, decrementing the
      bag by exactly 1 each time; a fresh `stoneOfShock` used against two adjacent test targets
      applied `paralysis: 3` to both and raised a pre-drained wand's charge count (capped at its
      max of 4); the inventory panel's item-detail popup rendered the correct name and the real
      Java `items.stones.inventorystone.ac_use` action label ("사용한다") in Korean for all three,
      and the shock log line rendered its interpolated hit count ("Lightning arcs out, paralyzing
      3 nearby foes."). **This pass's own gap-list correction, worth noting**: this line originally
      (mis)named a 12th runestone type "StoneOfDisarming" - that class does not exist in real SPD
      at all (checked against the actual `items/stones/` directory listing in the local checkout);
      the real 12th type is `StoneOfDetectMagic`, corrected here and in `PORT_COVERAGE.md`.
- [x] Port a fourth runestone type, `StoneOfBlast` -> `stoneOfBlast` (`useStoneOfBlast()`), the
      same rename-plus-use-action pattern the three above already established. Real Java's
      `activate()` just calls `new Bomb.ConjuredBomb().explode(cell)`: a `PathFinder`
      distance-1 flood fill through non-solid/flammable terrain, dealing
      `NormalIntRange(4 + scalingDepth, 12 + 3*scalingDepth)` damage minus armor to every char
      caught in it - the hero included, since a bomb does not discriminate - plus destroying
      flammable terrain and triggering/destroying caught heaps. This port reuses the same
      Chebyshev-distance-1-circle approximation `StoneOfShock` already makes for its own radius
      (ignoring walls), substitutes `this.depth` for `scalingDepth` (the same substitution every
      other depth-scaled formula in this file already makes), and routes the hero's own share of
      the blast through the existing `absorbHeroDamage`/`kill` path exactly like
      `applyTrapBlast`'s hero branch already does for a different (trap) bomb formula. **Not
      reproduced**: the terrain-destruction/heap-triggering half of the real explosion - this port
      has no equivalent call from an item-use site, a real, narrower gap left honest rather than
      faked. Browser-verified live: placing the hero adjacent to a 500-HP test target and using a
      fresh `stoneOfBlast` dealt 9 damage to the hero (from full HP) and 8 damage to the adjacent
      target, while a second target 6 cells away took none - confirming both the radius cutoff and
      the hero's own inclusion in the blast; the bag stack decremented by exactly 1.
- [x] Port two more runestone types, `StoneOfBlink` -> `stoneOfBlink` (`useStoneOfBlink()`) and
      `StoneOfClairvoyance` -> `stoneOfClairvoyance` (`useStoneOfClairvoyance()`), bringing 7 of
      12 real runestone types to distinct effects (Augmentation/Fear/DeepSleep/Shock/Blast from
      earlier passes, plus these two). **Blink**: real Java's `activate()` calls
      `ScrollOfTeleportation.teleportToLocation(curUser, cell)` on a player-aimed thrown-to cell -
      a short, precise, chosen hop, distinct from Teleportation's own full-level random jump. This
      port has no map-click cell-targeting for a thrown item (the same reason every combat stone
      above auto-targets instead of aiming), so it reuses the exact `randomFreeCell` placement
      this port's own `ScrollOfTeleportation` already uses rather than inventing a second
      "aim-like" strategy - the real distinction between Blink's short aimed hop and
      Teleportation's full random jump is lost, both collapsing to the same uniformly-random free
      cell. **Clairvoyance**: real Java marks every cell within a real `DIST = 20`
      `ShadowCaster`-diamond around the thrown-to cell `mapped`, plus reveals any secret terrain
      caught in that area - a smaller, localized cousin of the already-ported
      `ScrollOfMagicMapping`'s whole-floor `revealAll()`. With no cell-targeting, this port centers
      on the hero's own position instead (the natural default absent aiming, unlike the combat
      stones' nearest-enemy convention), and reproduces the same DIST=20 as a plain
      Chebyshev circle (ignoring walls) by adding each cell directly to `FieldOfView.explored` (a
      public, mutable `Set`) rather than calling the whole-level `revealAll()`. Browser-verified
      live: using a fresh `stoneOfBlink` moved the hero from `(6,16)` to `(16,13)` in one action;
      using a fresh `stoneOfClairvoyance` grew `fov.explored.size` from 54 to 832 (the floor's full
      `cellCount`, since this port's small Sewers-sized levels fit entirely within a 20-cell
      radius of the hero) and rendered the previously-fogged room fully visible on screen; both
      logged their correct French text ("Vous avez été téléporté en un clin d'œil..." reusing the
      real Java teleport key, "Le donjon vous révèle ses secrets." a new port string), and the
      inventory popup showed "stoneOfBlink" with the correct "UTILISER" action label. The
      remaining 5 runestone types (Enchantment/Intuition/DetectMagic/Flock/Aggression) stay
      unported, still collapsing to the generic `'stone'` id: Enchantment/Intuition/DetectMagic
      are all `InventoryStone` subclasses needing a real item-picker UI this port doesn't have
      (same blocker as `ScrollOfTransmutation`); Flock spawns allied Sheep (needs an
      ally-spawning/combat system this port doesn't have); Aggression's own buff would be mostly
      moot without ally-vs-monster combat to make its enemy-vs-enemy redirection observable.
- [ ] Implement complete weapon and armor tiers, transfer formulas, upgrade formulas, curse infusion, and degradation.
- [ ] Implement the remaining charm/knockback/stealth/blink/durability-per-hit
      subsystems the unported enchants, glyphs, and curses depend on (Kinetic's
      carried-damage buffer, Blooming's plant seeding, Corrupting's
      enemy-conversion, Elastic/Projecting's line-AoE geometry, and the
      charm/wand-drain/blink/durability mechanics behind
      Affection/AntiMagic/Brimstone/Camouflage/Obfuscation/Potential/Repulsion/Viscosity
      and the matching armor curses) - each needs its own system stood up before
      the enchant/glyph/curse itself can be anything but a stub.
- [ ] Replace simplified missile durability and wand recharge behavior with the Java formulas.
      Wand recharge is now Java-shaped (`10 + 40 * 0.875^missing`, with Recharging's bonus)
      and explicit charge refunds are separated from passive recharge; missile durability
      now persists a Java-shaped durability budget and decrements the stack only on break;
      PinCushion/item-specific recovery and missile upgrade levels remain.
- [x] Implement identification appearance randomization. Potion and scroll appearances are
      shuffled once per seeded run, pre-drawn without disturbing later gameplay RNG, and
      persisted through save/load.
- [ ] Implement full shop pricing, buyback shelves, and wealth modifiers. The live keeper now
      uses depth-scaled prices and retains sold stock in its buyback inventory; exact Java
      shop-room placement and wealth modifiers remain.
- [x] Implement Timekeeper's Hourglass sand-bag state and its level-generation effects. The
      identified/uncursed inventory state now follows Java's depth-specific shop percentages,
      sand bags upgrade and persist on the hourglass, and concrete item identities survive the
      level/save bridge; the active time-freeze action is now wired into the turn scheduler, while
      stasis, recharge cadence, and exact artifact presentation remain part of the broader
      artifact-system work.

## 2. Complete dungeon generation and regional content

- [x] Port regular-floor hand-placed decorations and unique rooms for Sewers, Prison, Caves, City, and Halls.
- [x] Port the remaining branch-level hand-placed layouts (the Blacksmith MiningLevel
      now has a generated 32x32 CaveRoom branch, working entry/return transition, remains
      position, save/load branch state, Java's standalone CavesPainter water/grass pass,
      Caves ore-vein sparkle visuals, pickaxe mining with Java timing/audio, and persistent
      cross-run Bones placement/consumption, the exact CAVES_QUEST border atlas, and the
      Blacksmith QuestEntrance custom tile; branch Bones now follows Java's seeded-gold versus
      normal-run eligible-loot selection with Java's equipment/backpack draw order; exact
      branch reward seeding and the source-confirmed absence of MiningLevel hazards are
      implemented and verified; the Blacksmith normal/Bat-blood
      quest variant now follows Java's run-level roll, persists through saves, and accepts
      15 DarkGold or a pickaxe stained by killing a Bat).
- [ ] Port all special-room item and monster generation, including missing RNG calls.
      `SuspiciousChestRoom` is now complete through its queued-prize/Gold roll, mimic gate,
      generated bonus prize, live mimic spawn, and death drop; remaining Generator-dependent
      room contents are tracked in `PORT_COVERAGE.md`; generated special-room drops now preserve
      their concrete Java class ids through the live bridge. `GrassyGraveRoom` now also preserves
      each Java Generator/Gold result class id in its tomb heap, Crystal rooms now expose
      playable reward families/mimics, `AquariumRoom` now spawns depth-scaled water-bound
      Piranhas with Java's meat drop, StatueRoom now carries generated enchanted weapon/
      armor payloads (including the armored variant) into live death drops, and
      `SacrificeRoom` now adopts a spreading sacrificial-fire blob, consumes creature EXP-like
      charge, and releases its concrete generated weapon reward when the fire is satisfied;
      MassGrave generated item/armor drops and CrystalVault mimic rewards now retain their
      concrete generated class ids through live death drops as well. Secret Maze weapon/armor,
      Artillery missile, Library scroll, and Laboratory potion rewards now retain their concrete
      generated class ids too; SuspiciousChest and Treasury mimics now retain their held item,
      and Secret Honeypot now preserves the Java Bomb-versus-DoubleBomb result and class id;
      generated bonus, and treasury gold drops on death.
-      Halls `DemonSpawnerRoom` now also uses the Java room placement and `HALLS_SP` custom-floor
      atlas through the live MWG sprite-sheet path; defeated spawners remain absent on revisit.
- [x] Preserve Java room-placed NPCs and special mobs through the live-game bridge.
- [x] Implement rare and alternative monster spawns. Regional 2.5% additions and Java's
      per-entry 1-in-50 alternative swaps (Albino, Caustic Slime, Bandit, Spectral
      Necromancer, Armored Brute, DM-201, Senior, and Acidic) now occur in the correct
      add-rare -> swap -> shuffle order, with distinct stats/loot identities and live
      combat hooks where the current buff model supports them.
- [ ] Implement signs, wells, chasms, crystal-door consequences, statues, plants, and mining branches
      (sign/well examination and awareness/health well effects, generated chasm falling, Java-aligned
      plant status effects and Sungrass movement-cancelled healing, queued crystal/iron keys,
      playable crystal-door unlocking, crystal chests now consume a crystal key before releasing
      their contents, and the basic MiningLevel branch are live; exact
      crystal-room content is now carried through Artifact-family rewards and crystal-mimic theft/return;
      exact crystal-room consequences and seed-growth/Lotus behavior remain (Swiftthistle now
      freezes automatic actors for the Java seven-time-unit window and queues delayed trap/plant
      presses until expiry);
      Pickaxe now mines ordinary
      Caves walls and real WALL_DECO veins, with only veins yielding DarkGold; the inventory Pickaxe
      MINE action now scans adjacent veins, converts them to WALL, awards DarkGold, and spends two turns;
      generated wells and plants now use MWG `FeatureLayer` for placement, one-shot interaction, and
      floor save/load while retaining SPD-specific consequences (fetched `WaterOfAwareness.java`/
      `WaterOfHealth.java` to confirm the exact effects this pass, and fixed two real divergences:
      the awareness well was fully identifying the whole bag with no Java basis - real
      `Belongings.observe()` only touches the equipped weapon/armor/ring, already covered by this
      port's existing equip-time identify simplification, plus marks unequipped backpack
      equipable/wand items cursed-known without fully identifying them, now matched, alongside a
      real `awareness` buff grant; the health well was also wrongly clearing `burning` - real
      `PotionOfHealing.cure()` never touches it - and was missing `uncurseEquipped()`'s weapon/
      armor/ring curse-clear entirely, both fixed); chasm falling now also applies
      `Chasm.heroLand()`'s real Cripple application and HP/HT-scaled landing damage through the
      normal hero-damage absorption pipeline, correctly killing the hero on a fatal fall, and
      Levitation now bypasses chasms the same way it already bypassed traps - see
      `PORT_COVERAGE.md`'s `Chasm.java` row for what's still not ported there).
- [x] Implement Java's feeling-based water and grass branches; feeling selection and the
      CHASM/WATER/GRASS/LARGE/TRAPS/SECRETS branches are threaded through `PaintLevel` and
      the regional painters.
- [x] Resolve the previously observed room-generation edge cases and RNG
      divergences. The seed-42/depth-3 graph and retry counts now match Java,
      and the wider Sewers/Prison verification matrix is byte-for-byte aligned;
      the former attempts mismatch was traced to verifier run-state leakage and
      fixed by resetting Wandmaker state between seeds. Remaining paint-stage
      content RNG gaps are tracked with the affected room types in
      `PORT_COVERAGE.md`.
- [x] Port `ConnectionRoom`'s cosmetic `paint()` for all 6 subclasses
      (`TunnelRoom`/`BridgeRoom`/`PerimeterRoom`/`WalkwayRoom`/`RingTunnelRoom`/`RingBridgeRoom`)
      - their sizing/subclass selection and tunnel/bridge/chasm decoration are now wired
        through `rooms/standard/registry.ts` and `rooms/connection/paint.ts`.
- [x] Fix two real, user-reported bugs found by actually playing depth 1: the entrance-room
      tutorial seal (`SPDSettings.intro()`) was permanently on for every run instead of only a
      genuinely new player's first one (nothing ever set `guideIntroRead`/`guideSearchingFound`
      true - now persisted cross-run via `guideProgress`, satisfied by the real completion
      signal of successfully searching out the door); and `RegularLevel.createMobs()`'s
      entrance-room exclusion wasn't modeled on ported floors, so monsters could spawn directly
      in the first room. Both browser-verified live. See `PORT_COVERAGE.md`.

## 3. Port every boss level and boss script

- [x] Port the fixed Prison boss-floor layout at depth 10.
- [x] Port the fixed Caves/DM-300 boss-floor layout at depth 15.
- [x] Port the fixed City boss-floor layout at depth 20.
- [x] Port the fixed Halls/Yog boss-floor layout at depth 25.
- [x] Port the fixed final vault/endgame layout at depth 26.
- [ ] Port Prison/Tengu's full multi-stage arena transition and trap scripts (the one-time
      below-half relocation and trap burst are now live; floor shifting and exact ability
      cadence remain).
- [ ] Port Caves/DM-300's full pylon, gate, energy field, and supercharge scripts (pylon
      proximity sealing, short energy pressure, and overcharge ground effects are now live;
      rockfall/gas and exact pylon state remain).
- [ ] Port City/Dwarf King's throne and Imp-shop scripts (the live King summon/barrier
      cycle is already present; throne geometry and the conditional Imp shop remain).
- [ ] Port Halls/Yog's full fist, flame, shadow, and arena scripts (three fists now gate
      Yog's beam, with rotating burning/roots/cripple/daze pressure; flame/shadow arenas
      remain).
- [x] Port final-vault Amulet placement at Java's `AMULET_POS` (depth 26, x=8, y=12).
- [ ] Port final-vault endgame-specific terrain, custom visuals, and compass behavior.
- [x] Stop dungeon music on entry to the final vault, matching `LastLevel.playLevelMusic()`.
- [ ] Implement exact arena layouts, seals, pylons, boss phases, minions, traps, projectiles, movement scripts, and victory transitions.

## 4. Complete NPCs and quests

- [ ] Port Caves NPCs and quests.
- [ ] Port City NPCs and quests.
- [ ] Port Halls NPCs and quests.
- [x] Implement the full Ghost quest reward generator. Was calling the generic depth-scaled
      `randomWeapon`/`randomArmor` instead of `Ghost.Quest.spawn()`'s own distinct formula - a
      fixed 50/30/15/5% tier roll (not depth-scaled), a single upgrade level shared by both
      items, and a single shared 20% enchant/glyph chance (not per-item); see `generator.ts`'s
      new `ghostQuestReward()`. **Found and fixed a much bigger bug in the same pass, auditing
      `generatedInventoryItem`'s category dispatch while wiring this up**: every procedurally-
      generated weapon or missile in the entire game (ordinary floor loot, statue drops, and now
      Ghost's reward) was silently mislabeled as a plain `'food'` item with no enchant/curse ever
      applied, because that function checked `generated.cat === Cat.WEAPON` when the real value
      is always one of the WEP_T1..T5 sub-tier cats (`generatedGroundKind`, a few lines away,
      already had the correct range check - this was a narrow, isolated miss in one sibling
      function, not a systemic gap). Fixed to the same range check; verified live (a real Sickle
      +2 and ScaleArmor +2 landed correctly instead of two `'food'` items) and statistically (a
      20000-sample Node check of `ghostQuestReward()`'s tier/level/enchant fractions matched
      Java's 50/30/15/5%/20% closely, with zero cursed outcomes as Java requires). See
      `PORT_COVERAGE.md`.
- [ ] Replace the simplified Wandmaker quests with Mass Grave, Ritual Site, and Rot Garden.
- [ ] Port the Troll Blacksmith's mining and forge mechanics.
- [ ] Port Rat King and other missing special NPCs.

## 5. Improve monster behavior and loot

- [x] Fix `Brute`'s enrage: it was a stateless below-half-HP damage boost that never actually
      granted Java's real one-time near-death revival (a Brute could just be killed outright,
      something Java never allows). Now a genuine `hasRaged`/`raged`-gated revival with the real
      `HT/2+4` shield and flat 4/turn decay. Browser-verified live. See `PORT_COVERAGE.md`.
- [ ] Implement exact wandering, hunting, fleeing, and stealth calculations.
- [ ] Implement monster-specific AI overrides. **Golem's teleport-the-hero-away ability is now
      ported** - previously it had none at all and fought as a plain melee attacker despite
      having a real, distinctive ranged ability in Java. Fetched `Golem.java` to confirm: while
      not adjacent and off a 20-turn cooldown, it teleports the hero to whichever of the hero's
      own free 8-neighbour cells is farthest from the golem (pushing the hero away, not pulling
      itself closer). Real Java's own reachability check (`canTele`, a BFS around blocking
      terrain) and its separate self-teleport-to-reposition ability while wandering are not
      modeled - this port requires a clear line within 8 cells instead, the same "shape not
      curve" simplification already used for DM200's vent/Spinner's web. Browser-verified live:
      a golem teleported the hero to a genuinely farther cell, set the cooldown to 20, and a
      second immediate attempt correctly did nothing while the cooldown ticked down. **Eye's
      real DeathGaze is now ported too** - it was implemented as a completely wrong-shaped
      stand-in (an "every 3rd melee hit deals 1.5x" damage multiplier); fetched `Eye.java` to
      confirm the real ability is entirely ranged and never a melee proc at all: a two-turn
      charge-then-fire beam (turn 1 charges, no damage, the eye takes only 1/4 damage from any
      source meanwhile; turn 2 fires a real magic hit roll for 30-50 damage along a clear line
      to the hero, bypassing armor/DR entirely unlike this port's own `zapHero` bolts), then a
      4-6 turn cooldown. Uses the new `monsterTurnCost` hook (from the `firstSummon` fix above)
      to give the charge turn its own real 2x cost. Browser-verified live: charging set
      `beamCharged`/cost `2` correctly and a 20-damage test hit was quartered to `5` while
      charged versus the full `20` once uncharged; firing reset the charge, set a cooldown
      within the real 4-6 range, and dealt damage within the real 30-50 range. See
      `PORT_COVERAGE.md`.
- [ ] **Implement ally-vs-monster combat.** Found this session while auditing the scroll branch
      against Java source: this port's monster AI has no concept of a non-hero target at all -
      every `takeMonsterTurn` decision hardcodes the hero as the only possible thing to attack
      or path toward. This blocks at least two real mechanics from ever being more than a
      documented stand-in: `ScrollOfMirrorImage`'s allied `MirrorImage` NPCs (currently a
      `heroBarrier` shield stand-in - see `PORT_COVERAGE.md`) and `ScrollOfRage`'s `Amok` status
      (currently unmodeled entirely, since an Amok'd mob attacking "anything nearby" needs
      something for it to attack besides the hero). Necromancer's summoned skeleton already
      fights monsters *for the hero's opponent*, so some of the shape may be reusable, but the
      hero-side case (something the player controls fighting alongside them) is new.
- [x] Port all champion types and their effects. All 6 real types (Blessed/Blazing/Giant/
      Growing/AntiMagic/Projecting) are now live, each with its real per-type factor
      (`accRollMulti`/`rollDamage`), and the type roll is a true 1-in-6 matching Java's
      `Random.Int(6)`. Fixed a real bug in Blessed's factor (x3 -> the real x4) along the way.
      Remaining, tracked as narrower gaps rather than missing types: Giant/Projecting's
      extra-reach melee (`canAttackWithExtraReach`) is not modeled (attack range is fixed at 1
      regardless of champion type), `AntiMagic.RESISTS`'s status-immunity list is not modeled,
      and the champion roll itself is still a flat 10% rather than Java's roster-wide
      `Dungeon.mobsToChampion` budget. **Found and fixed a real bug this pass**: real Java
      only ever rolls a champion when the `CHAMPION_ENEMIES` challenge is active (it's an
      opt-in challenge, not a baseline mechanic) - this port's flat 10% roll had no such gate,
      so its own selectable "Champion Enemies" challenge toggle did nothing either way. Now
      gated on `isChallengeEnabled('champion_enemies')`. The by-depth exclusions (Crab/Thief/
      Guard/Bat can't become champions below depths 3/4/7/9, `GreatCrab`/`Bandit` inheriting
      their base kind's exclusion) are now ported too. See `PORT_COVERAGE.md`'s `ChampionEnemy`
      row.
- [ ] Implement blob area propagation, gas, and fire terrain.
- [x] Port the Necromancer's skeleton heal/Adrenaline/teleport support behavior - previously it
      had none at all (a summoned skeleton just fought alone forever). Now heals `HT/5` when
      hurt, grants a one-time Adrenaline (reusing the existing haste stand-in) if visible and
      already at full health, and teleports an out-of-sight skeleton back beside the hero
      instead of leaving it stranded. Remaining: the teleport destination is any free neighbour
      of the hero rather than Java's closest-and-in-sight pick. `firstSummon`'s variable tick
      cost is now ported too - the "blocked on a fractional-monster-turn prerequisite" premise
      was stale: `mwg/roguelike`'s `Scheduler.spend(cost)` already takes an arbitrary cost, and
      this port's own monster-turn adapter (`adapters/sceneSimulation.ts`) already threads a
      per-actor cost back to it, just hardcoded to `1`. A new optional `TurnPorts.monsterTurnCost`
      port reads a scene-side `pendingMonsterTurnCost` (set by `summonSkeleton`, cleared at the
      start of every `takeMonsterTurn`) instead. Browser-verified live end-to-end through the real
      scheduler: a necromancer's second summon (after its first skeleton died) advanced its
      scheduled turn by exactly 2, versus 1 for its first ever summon. See `PORT_COVERAGE.md`.
- [x] Port DM-200's hunting/venting override - previously it had no special behavior at all
      (plain melee attacker only). Now vents toxic gas along a line to the hero from range with
      the real distance-scaled odds, seed amounts, and 30-turn cooldown; the BFS-around-terrain
      reachability check and the closing-distance-failed vent retry are not modeled.
      Browser-verified live. See `PORT_COVERAGE.md`.
- [x] Port Spinner's ranged web ability - previously it had none at all (only the already-ported
      melee bite's on-hit root/cripple chance). Now roots the hero directly on a clear ranged
      shot, gated by the real 10-turn cooldown; real Java instead predicts movement direction and
      seeds a persistent 3-cell `Web` terrain blob rather than a direct debuff, not modeled here.
      Browser-verified live.
- [ ] Implement exact Tengu, DM-300, and other boss attack cycles.
- [x] Port rare monster variants' unique behaviors. Found and fixed two real bugs of the same
      shape auditing this - a monster's alternative-kind variant never inheriting the base
      kind's special mechanic because a check tested the literal `kind` string instead of the
      family relationship Java's own class extension implies:
      - `ArmoredBrute` (`extends Brute`) never got Brute's enrage/revival mechanic at all. Now
        ported with its own real numbers (`HT/2+1` shield, decaying 1/3 turns instead of
        Brute's 4/turn) - see `PORT_COVERAGE.md`'s Brute-enrage row.
      - `DM201` (`extends DM200`) never got DM200's gas-vent ability, and could also move
        freely despite real Java's `DM201` being `IMMOVABLE` (unlike `DM200` itself). Both
        fixed - see `PORT_COVERAGE.md`'s DM200-vent row. Also fixed this port's own vent log
        line hardcoding "DM-200" regardless of which kind actually vented.
      - `Senior` (`extends Monk`) never got Monk's Focus dodge-regain past its one spawn-time
        grant, same literal-kind-check pattern. Fixing it also surfaced a deeper, more
        consequential bug in the shared mechanic itself: the regain check sat after the
        `distance === 1` early return, so a Monk actively meleeing the hero (the normal state
        during a real fight) never regained Focus at all, only one chasing from range. Both
        fixed - see `PORT_COVERAGE.md`'s Monk/Senior-Focus row.
      - `SpectralNecromancer` (`extends Necromancer`) never got the bolt/summon/support
        behavior at all - fought as a plain melee attacker. All three check sites (adjacent
        bolt, summon/support branch, skeleton-death cleanup) fixed - see
        `PORT_COVERAGE.md`'s Necromancer-summon row.
      - `Bandit` (`extends Thief`) never actually fled after stealing (two check sites), and
        - the most consequential of the three - a killed Bandit's stolen item was gone for
        good instead of recoverable. All three fixed - see `PORT_COVERAGE.md`'s Thief-steal
        row.
      - `Acidic` (`extends Scorpio`) never retreated from melee, never attacked at range, and
        never applied Scorpio's own 50% cripple proc - only its own corrosion effect worked.
        All three fixed - see `PORT_COVERAGE.md`'s Scorpio row.
      Albino already had its on-hit behavior live from the earlier spawn-selection pass.
      `Slime.damage()`'s incoming-hit soft cap (shared unchanged by `CausticSlime`) turned out
      to be missing for the base kind too, not a literal-kind-check bug - now ported for both,
      see `PORT_COVERAGE.md`'s Slime row.
- [x] Implement Java corpse, meat, gold, loot-stack, and limited-drop behavior. `Dungeon.LimitedDrops`
      decay (each successful special-item drop makes the next one rarer, for the run's lifetime)
      is now real for `bat`/`necromancer`/`guard`/`dm200`/`golem`/`shaman` - `dm200`/`golem` also
      had their base chance itself fixed in the same pass (`0.125` was an unconfirmed guess; real
      Java is `0.2` for both). `slime`/`skeleton`/`thief`/`swarm` now have real `MOB_LOOT` entries
      and decay too (closing the last base-drop gap this line tracked) - see `PORT_COVERAGE.md`'s
      `MOB_LOOT`/`LIMITED_DROP_DECAY` row for each one's exact base chance/decay formula and the
      weapon-as-`'armor'`/`Random.oneOf(RING,ARTIFACT)`-as-`'ring'` stand-ins involved.
      Stacking heaps, Wealth rings' `tryForBonusDrop()` half, and dm200/golem's real
      weapon-or-armor 50/50 pick (simplified to always-armor here) remain unmodeled.

## 6. Complete hero progression

- [ ] Implement exact formulas for the remaining talents.
- [ ] Implement rune transfer and shared-enchantment behavior.
- [ ] Complete subclass and armor-ability effects.
- [ ] Match Java talent timing, identification, recharge, and threshold rules.
- [ ] Complete class-specific item and ability behavior.

## 7. Replace simplified terrain and status mechanics

- [x] Implement area-of-effect traps instead of single-target approximations. Explosive traps
      now apply Java's reduced off-center blast damage to nearby creatures, while toxic and
      fire traps seed the live area effects; exact Java projectile presentation, terrain
      destruction, and cadence remain tracked as narrower follow-up gaps.
- [x] Implement chasm falling and traversal. `isChasmCell`/`fallThroughChasm` model the
      terrain; `Chasm.heroLand()`'s real Cripple + HP/HT-scaled landing damage and the
      Levitation bypass are now ported too (see `PORT_COVERAGE.md`'s `Chasm.java` row for the
      remaining gaps: Bleeding DoT, feather-fall item, landing sound/camera shake).
- [ ] Implement water and terrain hazards. `Level.java`'s per-turn water hook (a non-flying
      char standing in `WATER` extinguishes `Burning`, matching `Burning.act()`'s own
      `acted && water && !flying -> detach()`) is now ported for both hero and monsters,
      collapsed to an immediate extinguish once the current turn's DoT tick has landed rather
      than reproducing the exact one-turn-late real timing - see `PORT_COVERAGE.md`. Ooze's own
      water interaction (the same hook also force-ticks `Ooze`) and other terrain hazards
      remain.
- [ ] Complete plant growth and plant interactions (one-shot regional plant activation, Java-aligned
      single-target statuses, Sungrass healing-over-time, and Warden-sensitive variants are live;
      Icecap/Rotberry blob diffusion and Warden FrostImbue/AdrenalineSurge variants are live;
      Dewcatcher now releases 3-6 distinct adjacent dewdrops and Seedpod releases 2-4 generated
      seed stand-ins; exact teleport/TimeBubble behavior, seed growth/Lotus preservation, and
      full dew collection rules remain).
- [ ] Implement the remaining Java seed and dew behavior in high grass. Actual seed payloads
      (real `Generator` category roll, concrete class retained) and planting them (`plantSeed()`,
      instant activation with no growth delay - confirmed against `Plant.java`'s own
      `Seed.execute(AC_PLANT)`, which has none either) are both already live; a stale comment
      claiming otherwise at `trampleHighGrass` is now fixed. What remains: `WandOfRegrowth`'s
      `Lotus` ally seed-preservation chance (needs a Wand of Regrowth item plus an ally-summon
      system this port doesn't have) and exact waterskin/dewdrop interactions.
- [x] Match hunger and starvation damage exactly (`Hunger.act()`'s real `partialDamage`
      fractional accrual and crossing-into-STARVING 1-damage hit, replacing the former flat
      "every 10 turns" guess). Java has no attack-delay/accuracy penalty while merely hungry
      beyond the log line, so there is no further penalty to match there.
- [ ] Match stealth, invisibility, surprise, and attack-delay systems exactly.
- [x] Implement shield decay (`Barrier.act()`'s real `min(1,shielding/20)`-per-turn proportional
      curve now runs every hero turn against the shared `heroBarrier` pool - previously never
      invoked at all, so shields held indefinitely). `Blocking.BlockBuff`'s own separate fixed
      5-turn cliff-edge expiry is now also approximated - a `blockingShieldLeft`/`blockingTurnsLeft`
      side counter, ticked alongside the proportional decay, force-expires however much of the
      pool is still attributable to Blocking once its own 5 turns are up, and every fresh proc
      resets the timer (matching real `setShield()`). Java's priority-ordered absorption (Blocking's
      shield always drains before Barrier's on incoming damage) remains unmodeled - tracked in
      `PORT_COVERAGE.md`'s Barrier-decay row; healing-over-time - Sungrass is live, other Java
      Health-buff variants remain.

## 8. Complete UI and input parity

- [ ] Port full inventory, bag, sub-bag, item-detail, and item-use windows.
- [x] Implement click-to-travel (`repeated movement`) - a player-reported bug: clicking a
      distant tile previously only produced a single step toward it, with no auto-walk at all.
      Now queues the target and walks the real pathfinder's route one step per turn via the
      existing `awaitHeroInput` hook, matching Java's real interrupt conditions (taking damage,
      or any awake hostile creature coming into sight - checked broadly, i.e. any such creature
      currently visible, rather than Java's narrower "newly seen" case) and cancelling cleanly
      on arrival or on any manual keyboard action. Browser-verified live: a clear 3-tile click
      walked the whole distance in one call; a click with a hostile monster already in view
      correctly refused to start rather than taking even one step. Cell targeting and path
      preview (the visual line/highlight while aiming) remain unported.
- [ ] Complete the journal UI and identification tabs.
- [ ] Port pause/menu chrome, boss banners, toast animations, and Java-style transitions.
- [ ] Implement large interface-size layouts.
- [ ] Port the hero information window, busy indicator, talent animations, and quick slots.
- [ ] Support armor-dependent hero portraits and complete sprite/effect animations.
- [x] Audit every static `t('port.*')` call site against `portStrings.ts`'s EN/FR tables. A
      script (walk `src/**/*.ts`, collect every literal `t('port.…')` call, diff against both
      locale objects) found 45 keys missing from EN and 47 from FR - all fixed this pass (window
      titles, victory/defeat screens, `port.action.bag`/`port.talent.*`, ~20 combat log lines
      including `bossinfo`/`grim`/`lucky`/`kingbarrier`/`yogbeam` and more - the raw key string
      was rendering in place of real text for all of them). Also fixed two French-specific bugs
      a player caught live: "bolt" was mistranslated `trait` instead of the correct `carreau`
      (crossbow-bolt-specific), except the GreatCrab's generic parry line, which blocks any
      projectile and correctly stays `projectile`; and "{who} vous rate/touche" was restructured
      subject-first to avoid a bare "de {who}" that reads as broken French for any non-proper
      monster name (needs "du"/"de la"/"de l'" agreement `{who}` can't supply on its own).
      Followed up the same session: the audit script only catches literal `t('port.…')` string
      arguments, so the dynamic template keys (`` t(`port.armor.${option}`) ``/
      `` t(`port.subclass.${option}`) `` for the armor-ability/subclass choice UI) needed a
      manual check - all 12 possible ids across `ARMOR_OPTIONS`/`SUBCLASS_OPTIONS` were missing
      from both locales too (the entire level-13/21 choice window showed raw ids), now fixed and
      browser-verified live. **Same dynamic-key class, now closed**: `itemDisplayName` renders
      `` t(`port.affix.${item.affix}`) `` with no `port.affix.*` key in either locale, so every
      enchant/glyph/curse name on the item-detail popup showed a raw key - all 32 affix ids now
      have EN+FR entries, sourced from SPD's own `<class>.name` strings (FR uses the masculine
      base form; Java resolves its (e)/(le) markers by item gender, which this port does not
      model - see `PORT_COVERAGE.md`). **A third class of gap, orthogonal to both of the above,
      found and closed this pass**: the literal-key audit only ever catches `t('port.…')` calls -
      it can't see a `this.say('some literal English sentence', ...)` call that skips `t()`
      entirely. A full sweep found 33 of those, scattered across chest/hourglass unlocking, both
      wells, every `triggerPlant` branch, chasm falling, crystal-mimic reveal/escape/displace,
      the armor-displacement curse, the statue equipment drop, and the hourglass freeze lines -
      every one of them rendered raw English text in every locale, French included, with no
      fallback message even to show it was untranslated. All 33 now have real `port.log.*` keys
      with EN/FR entries; see `PORT_COVERAGE.md`.
- [ ] Translate the port's own strings into every Java locale. The picker already offers all
      19 of `Languages.java`'s locales (same codes, same complete/unreviewed/unfinished
      statuses - see `src/i18n/languages.ts`), and SPD's own text arrives translated through
      the generated catalog, but the port's own ~305 `port.*` keys exist only in English and
      French - every other locale reads English sentences (with SPD-translated names inside).
      Scope: 305 keys x 17 locales (~5,200 strings), mirroring the `Languages` enum exactly
      (Java's `.properties` dirs also carry be/eo/sv/zh-hant files, but SPD doesn't ship
      anything below 80% and neither should this). Notes for whoever does it: nothing structural
      stands in the way - `catalogFor()` already merges `PORT_STRINGS[code]` per locale with
      base-catalog fallback, so each locale is purely additive; `mwg/i18n`'s typography and
      CLDR plurals already cover the per-locale mechanics. The bar is human: SPD labels each
      locale complete/unreviewed/unfinished for a reason, and machine-translated game text ships
      exactly the kind of errors only native speakers catch (see `languages.ts`'s `in`/`id`
      note for the shape of that risk) - each locale needs a translator, or a machine draft
      explicitly marked unreviewed or worse. Sequence against the still-growing key set
      (`port.affix.*` landed 32 keys this pass alone): either freeze `port.*` first or track
      per-locale key deltas on every pass that adds one. Font coverage is part of done, not a
      footnote - zh/ko/ja need the section-10 tofu check per locale, not just key resolution.
      See `PORT_COVERAGE.md`'s locales row.

## 9. Build the Java-vs-TypeScript parity harness

- [ ] Compare both implementations with fixed seeds and identical action traces.
- [ ] Verify RNG call order for level, item, monster, and quest generation.
- [ ] Verify combat rolls, damage, status effects, and turn timing.
- [ ] Verify loot, quest outcomes, boss transitions, and save/load state.
- [ ] Add screenshot and animation-timing comparisons for visual parity.
- [ ] Classify every remaining difference as either an implemented Java behavior or an explicitly accepted platform/UI difference.

## 10. Close the browser-verification debt

Several already-implemented sections in `PORT_COVERAGE.md` are documented as
formula-correct but never actually seen rendering, because the Chrome
extension was disconnected during the session that built them. Per this
project's `CLAUDE.md` ("type-checking and a successful build are not evidence
the feature actually looks/behaves right in-game"), these need a real
browser pass before they can be treated as done rather than merely built:

- [ ] Visually confirm non-English locale rendering (font coverage for
      non-Latin scripts in particular - a CJK locale is the one most likely
      to show tofu from a missing glyph; the i18n check only proves keys
      resolve and interpolate, not that text fits its widget or that a font
      covers a script).
- [x] Re-confirm the UI/presentation section's widgets in a live session
      (status pane, bars, floating text, compass, coloured log, boss health
      bar, badge banner, inventory panel) now that a browser is available
      again. Status pane/HP bar/depth badge, coloured log (orange/yellow/
      white/green all observed), boss health bar+chrome+25%-bleed tint, the
      compass (correctly gated on `hasStairs`, correctly oriented), and the
      inventory panel (a clean icon grid with quantity badges, not the old
      degenerate unbounded text-row layout) are all confirmed live via
      screenshots. Floating damage numbers and the badge-banner pop-in
      couldn't be caught mid-animation (their round-trip-vs-lifetime timing
      lost the race against this tooling's screenshot latency), but their
      triggering logic was confirmed correct via the log line each produces -
      a tooling limitation, not a finding of anything wrong. See
      `PORT_COVERAGE.md`'s UI verification section.
- [ ] **Unresolved, flagged rather than silently dropped or guess-fixed**: a live browser
      session surfaced `TypeError: Cannot read properties of undefined (reading 'frame')` from
      `spawnMonster` -> `spawnPortedMobs` -> `enterLevel`, reached from a scene-transition
      callback (`applySwitch`/`frame` in the stack) well *after* a batch of direct scene-method
      test calls had already returned correct results on the same page load. `spawnMonster`'s
      sprite lookup depends on `runState.sprites[kind]`, populated by an asset-preload step a
      real player waits behind a loading screen for; the test harness dispatches synthetic
      pointer events in rapid bursts with no such wait, so the leading theory is a load-order
      race specific to that unnatural pacing, not a reachable-through-normal-play bug - but this
      was not confirmed either way. Reproduce under normal human-paced play (or a scripted wait
      for the loading screen to clear) before deciding whether this needs an actual fix.
      **New evidence this session, narrowing (not yet fully confirming) the theory**: while
      verifying the `mwg` 0.4.2 bump, this same error reproduced 3/3 times immediately after a
      fresh `npm run build`, using timing that had worked fine moments earlier - but then
      reproduced 0/5 times on subsequent page loads of that *same already-built* `dist/` (fresh
      tabs, reloads, and the original fast timing all included), with no code or config change in
      between. That pattern (fails only right after a rebuild, then stops failing) points at
      something slow on *first access* to a freshly-written `dist/game.js` specifically - most
      likely OS/antivirus file-scan latency on Windows delaying the initial asset decode - rather
      than at `mwg` 0.4.2 or at pointer-burst pacing per se (the version bump was A/B-tested
      directly against 0.4.1 under identical conditions and showed no difference once this
      first-access effect was controlled for). Still not proven, and still worth a real fix
      investigation (e.g. an explicit "assets ready" gate before `enterLevel` can run) rather than
      accepting "wait a bit and retry" as a permanent workaround.

## 11. Architecture refactor toward the v3 target

This section tracks structural work, as distinct from the Java-parity work above. See
`SPD_ARCHITECTURE_TARGET_V3.md` for the target architecture (Command -> State + Events
simulation, renderer-free `EntityId`-addressed actors, event-driven presentation, data/
function/method-driven business families instead of Java-class transposition) and which
parts of it are blocked on `mwg` capabilities not yet released versus actionable now.
`SIMULATION_ARCHITECTURE.md` tracks the actual extraction steps taken so far (turns, combat,
buffs, hero actions, movement) and the next planned one (Step 6: local `EntityId` + an actor
view registry, replacing `Creature.sprite`/object-identity lookups).

- [x] Step 6: give every `Combatant`/`Creature`/`GroundItem` a stable id
      (`simulation/entityId.ts`), and move `sprite` out of `Creature`/`GroundItem` into a
      `spriteFor` view registry keyed by that id (see `SIMULATION_ARCHITECTURE.md`'s "Step 6").
- [x] Produce the section 22A/22B data/function/method analysis matrix for one monster family
      (Rat/Snake/Crab/Goo, see `MONSTER_ANALYSIS_RAT_SNAKE_CRAB_GOO.md`) before any class-level
      monster refactor, per SPD-ADR-010.
- [x] **`mwg@0.4.1` shipped `core.EntityRegistry`/`EntityId`, `simulation.SimulationRuntime`
      (the plan's actual Command -> State + Events + cost + snapshot runtime), and
      `core.PresentationQueue`** - the single biggest unblock since this section was written.
      Pin bumped (`package.json`), full verification suite re-run (type check, build, live
      browser session on the Sewers), see `SPD_ARCHITECTURE_TARGET_V3.md` for the detailed
      diff against 0.4.0. No game code adopts any of these three yet.
- [ ] **Next real phase**: wrap the existing per-domain rule functions (`simulation/combat.ts`,
      `movement.ts`, `heroActions.ts`, `heroTurn.ts`) behind one
      `SimulationRuntime<SpdGameState, SpdCommand, SpdEvent, Creature>`, migrating `main.ts`'s
      direct-mutation call sites (`attack()`, `moveTo()`, etc.) to `dispatch()` one command type
      at a time - start with whichever command is cheapest to convert without touching
      presentation-heavy code, not necessarily `attack()`. No big-bang (plan section 25).
      Progress: search already routes through its own runtime (`adapters/searchSimulation.ts`,
      cost `null`), and hunger now does too (`adapters/hungerSimulation.ts`, with
      `SceneSimulationAdapter.hungerStep()` dispatching through it - same transition, same
      events, only the dispatch path changed). Both keep inert local scheduler/random pairs;
      reconciling those with the scene's real ones waits for the first command with a real
      cost.
- [x] Consider replacing `simulation/entityId.ts`'s local counter with MWG's own
      `core.EntityRegistry` now that it exists (SPD-ADR-002) - resolved as a split decision:
      the `EntityId` type IS now MWG's own (re-exported from `mwg/core`, not a local alias),
      plus the reverse `idOfEntity(entity)` lookup the counter never had. Full `EntityRegistry`
      adoption (minting through `add()`) is deliberately deferred: it mints opaque `eN` ids
      while this port's prefixed ids (`hero-N`/`item-N`) are persisted in the save schema, and
      it has no caller-chosen-id primitive - needs that upstream or a save migration first.
- [ ] Extract `main.ts`'s `attack()` pure resolution (hit/damage rolls, weapon-affix/talent
      branches, event-worthy outcomes like mimic reveal/displacement) from its presentation
      calls (sprite tint, audio cue, floating text) - the single largest concrete instance of
      plan section 10's complaint. Likely the vehicle for actually adopting `SimulationRuntime`
      above, rather than a separate step.
- [x] Compare `mwg/i18n` against the plan's section 22C "Semantic Messaging" shape before
      committing to SPD-ADR-012. Done against the installed 0.4.2 `.d.ts` files: it matches
      (`SemanticMessage`/`MessageChannel`/`MessageFormatter`/`createCatalogFormatter`,
      `EntityTextResolver`/`GrammaticalEntity`, CLDR plurals, FTL, catalog audit tools - see
      `SPD_ARCHITECTURE_TARGET_V3.md`). The catalog mechanism is already adopted
      (`src/i18n/index.ts` builds on it); pending is only the message half (typed messages at
      `say()` sites, combat log lines as pilot). Whether the shape landed in 0.4.1 or 0.4.2 is
      unconfirmed - the 0.4.1 review never enumerated these files.
- [ ] Continue producing the section 22A/22B analysis matrix for the remaining monster/item/
      buff families before migrating each one's code, per SPD-ADR-010.
- [x] Re-check `mwg`'s exports on every version bump for the plan's remaining assumed
      primitives (raw 2D primitive re-exports, the Semantic Messaging shape) - some phases of
      the v3 plan still stay blocked until those land upstream. Re-checked at 0.4.2 this pass:
      both arrived in some form -       `two-d/render`'s `Types2D.ts` (`Container2D`/`Texture2D` type
      aliases, plain `Rect`, `rectOf()`) unblocks converting *type-only* `pixi.js` imports
      (value positions still blocked - Phase 0's exit criterion still cannot be met), and
      `mwg/i18n`'s Semantic Messaging family resolved the checkbox above. Follow-up survey,
      done with the compiler API: of 26 `from 'pixi.js'` imports, exactly one file
      (`monsters.ts`, `import type { Texture }`) was convertible - now `Texture2D`, no pixi
      import left there. Everything else is a value use (`extends Container`, `new
      Texture`/`new Rectangle`, `Texture.from`, `extensions.add(pipe)`), which type aliases
      cannot express: recorded as upstream proposal P2 in `SPD_ARCHITECTURE_TARGET_V3.md`.
- [ ] **Code-quality note, flagged by the user**: a long `if (x === 'a' || x === 'b' || x === 'c'
      || ...)` OR-chain is itself a code smell worth watching for across `main.ts` (e.g. the
      inventory/ground-kind dispatch's `item.id === 'stone' || item.id === 'stoneOf...'` chains
      that have grown by one clause with every newly-ported runestone this session). Where the
      values share a real, checkable structural property (a common prefix like `'stone'`/`id
      .startsWith('stone')`, a shared category the item's own definition already carries, or a
      lookup table/`Set` membership test), prefer that over enumerating every literal by hand -
      it stops scaling linearly with every new case and reads its own intent instead of a list of
      exceptions. **Keep It Simple, Stupid (KISS) is a good default principle here**: reach for
      the simplest structure that actually matches the domain shape, not the first chain of
      conditions that happens to work. Not applied retroactively to the existing runestone
      chains in this pass (each addition was small, verified, and consistent with its own
      neighbors at the time) - a candidate for the "architecture refactor" pass above, not an
      emergency fix.

## 12. Publish a playable build on GitHub Pages

- [ ] Deploy `dist/` to GitHub Pages so the game is playable at
      `https://<user>.github.io/mwg-pixel-dungeon/` without a local checkout. `vite.config.ts`
      already sets `base: './'` (relative asset paths), which works both for `file://` and for
      a project-subpath Pages URL with no changes needed there; `tools/emit.mjs`'s built
      `index.html` (non-module `<script defer>`) should load the same way over `https://` as it
      does over `file://`. Concretely:
      - Add a `.github/workflows/deploy.yml` that runs `npm ci && npm run build` and publishes
        `dist/` via `actions/upload-pages-artifact` + `actions/deploy-pages` on push to `main`
        (no existing CI in this repo to build on - confirmed no `.github/` directory exists yet).
        DONE this pass: `.github/workflows/deploy.yml` now exists (`npm ci`, `npm run build`,
        upload `dist/`, deploy; triggers on push to `main` plus `workflow_dispatch` - keeping
        both until the owner picks auto-deploy vs manual per the decision below).
      - Enable Pages in the repo settings (source: GitHub Actions).
      - Verify live, not just "build succeeded": open the deployed URL in a browser and confirm
        the title screen, class-select pointer-event workaround (see this file's own browser-
        verification section), and a played floor all work identically to the local `dist/`
        build - a project-subpath URL is exactly the case most likely to expose an asset-path
        regression `file://`/localhost testing wouldn't catch.
      - Decide whether every push to `main` deploys automatically, or only tagged
        releases/manual dispatch - ask the user before making commits auto-deploy publicly.

## Definition of done

- Every Java gameplay system has an equivalent TypeScript implementation.
- Every intentional deviation is documented in code and in `PORT_COVERAGE.md`.
- Fixed-seed gameplay traces produce equivalent results across both versions.
- `npx tsc --noEmit`, `npm run build`, automated verification, and browser verification pass.

See `PORT_COVERAGE.md` for the current implementation status and known
simplifications.
