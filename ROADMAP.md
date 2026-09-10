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
      row. **Correction (2026-09-09 audit): this bullet's own "not yet confirmed in a live
      browser session" caveat was stale** - a later pass already ran the playtest it asked
      for (a 3000-trial statistical check of the curse/enchant roll distributions, a live
      equip-lock test with the correct FR message, a live cleanse test, and a Barrier-decay
      tick check - all recorded in `PORT_COVERAGE.md`'s same row), this bullet was just never
      updated afterward. A fresh static re-audit this pass found no functional bugs in
      `rollGeneratedAffix`/`equipWeapon`/`equipArmor`; the only real findings were code-quality
      (the two equip functions duplicate ~40 lines of shape between weapon/armor variants, and
      use inconsistent starting-gear sentinel checks) - left as a future cleanup candidate, not
      urgent enough to risk touching untested.
- [ ] Port all remaining weapons, wands, rings, artifacts, bombs, alchemy, and crafting.
      Wand identity is now persisted from generated `sourceClass` through equipment/save state;
      Fireblast and Lightning use their real level formulas, with Fireblast's burning and
      Lightning's per-target scaling. Corrosion and Corruption are now reachable too (their
      gas-volume/intensity and permanent corruption-loot payloads remain documented
      simplifications). Prismatic Light and Disintegration now use their real
      level formulas; Prismatic Light's blindness is represented by the existing timed daze
      status. Their Java cone/ballistic-chain/line geometry is simplified to the selected target
      and visible adjacent targets respectively. Rings: all 12 real types are now live (Haste, Energy, Wealth, Arcana, Force, Sharpshooting from earlier passes, plus Elements and Furor this pass - see PORT_COVERAGE.md's rings row; type-check clean, browser verification still owed per section 10) - Sharpshooting mirrors Force's shape for ranged attacks: a flat `+level`
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
       `ringArcanaMultiplier()` now feeds all of them. Elements/Furor are now ported (this pass), both genuinely - not just assumed - needing more than a stale-claim fix, and both got it: Elements applies RingOfElements.resist()'s real pow(0.825, level) at each hero-side elemental-damage site (burning/poison DoT tick, toxic-gas blob damage, burning-trap fire damage - all in RESISTS, scaled before Barrier absorption like Hero.damage()'s own ordering; durations untouched, as in Java), since this port has no equivalent of Char.resist(Class)'s single shared dispatch. Furor got the attack-only turn-cost split it needed (a new getAttackTurnCostMod(), blanket divided by RingOfFuror.attackSpeedMultiplier()'s real pow(1.09051, level), spent only for bump-attacks via a move-port pre-check; movement keeps the blanket cost, matching Java's attackDelay()-vs-speed() split). See PORT_COVERAGE.md's rings row. Bombs are now ported too (this pass): usable `bomb` bag item with LIGHT & THROW, landing as a lit heap with a real 2-turn fuse ticked from the end-of-turn pipeline (frozen by Timekeeper freeze, snuffable by stepping onto it, chained blasts, DoubleBomb pickup as Bomb x2 with the English-only status) and `Bomb.explode()`'s exact `NormalIntRange(4+depth, 12+3*depth)`-minus-armor blast including the hero - this also fixed generated bomb loot never spawning at all (`portItemKind` returned null). `EnhanceBomb` alchemy and the 10 specialty bombs still need the alchemy system. See PORT_COVERAGE.md's new `Bomb` row.
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
      the same shape RingOfHaste's multiplier already used. `PotionOfFrost` is now ported (Simplified, and the last generated potion id missing its own branch - it silently quaffed as Purity before): it uses a target-centred `Freezing` approximation, extinguishes Burning, applies Chill and explicit Frost/paralysis immobilization when Chill was already capped, and applies the real elemental harm when appropriate - see `PORT_COVERAGE.md`'s row. All 12 generator potion classes now have their own branch - see `PORT_COVERAGE.md`'s
      potions row for what currently happens instead. (There is no `PotionOfConfusion` in real
      Java - the
      earlier text here was wrong; `ConfusionGas` is a trap-only blob, unrelated to potions.)
      **Re-audited 2026-09-09**: static re-check of all 12 id branches against their cited
      Java formulas found no id-shadowing regression (the historical "silently falls through
      to Purity" bug class does not currently reproduce for any of the 12) and no arithmetic
      bugs. Two low-severity quality notes: LiquidFlame/Frost's branches are near-identical
      (worth a shared helper, not fixed here) and the `else`-branch Purity fallback had no
      guard against an unrecognized id reaching it silently by accident - the exact shape that
      bit this file twice before (Frost, then Toxic/Paralytic Gas each briefly fell through
      here) - now fixed with a `console.warn` on any id reaching the fallback other than
      `potionPurity` itself (`potion`/`potionHealing` already branch earlier and can never
      reach it, but are excluded from the warning too as a defensive belt-and-suspenders).
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
      buffs' durations (`10` -> the real `20`). `ScrollOfTransmutation` is now ported
      (Simplified): `usableOnItem`/`changeItem`'s per-category reroll (same-tier melee
      weapons, 12-class potion/scroll/seed/runestone decks, 12-type rings, `cloak` via
      Java's own no-artifacts-left ring fallback), preserving upgrade level/enchant/curse
      state and consuming the scroll, logging the real `morph`/`nothing` keys. Target
      selection is now a real generic item-picker panel (`openItemPicker`/`chooseItemPicker`,
      built for reuse by the other picker-blocked uses - Enchantment/Intuition/DetectMagic
      stones, shop buy/sell, alchemy) with the real `inv_title` prompt, cancel-keeps-scroll,
      live-bag re-validation, and self-stack (2+) eligibility; armor (never eligible in real
      Java either), single-id `wand`, `MagesStaff`, thrown-stone ammo, `hourglass`, and
      equipped gear are still excluded - see `PORT_COVERAGE.md`'s updated row (type-check/build
      plus both suites green, browser verification owed per section 10). **Correction narrowed:
      the auto-target half of the old correction is now done (real picker, above) - what remains
      is exact `changeItem` including exotics/wands/trinkets/missiles/equipped gear, still owed
      with the section-1 item-system completion (those items must exist as distinct ported items
      first), not as a standalone scroll pass.**
- [ ] Port the remaining enchantments, glyphs, weapon curses, and armor curses. `Repulsion` and
      `Brimstone` are now ported (`Brimstone` grants Java's Burning immunity at the shared buff
      boundary). `Repulsion` is
      now ported with its exact level/Arcana-scaled adjacent knockback through the existing
      shove path. `Friendly` is
      now ported with its exact mutual Charm target/ignore-next-hit state and 1/10 x Arcana proc
      (the heart particles remain presentation-only). `Blooming` (uncommon, real
      `(lvl+1)/(lvl+3)` chance, level-scaled plant count, defender-first/shuffled-neighbour order)
      and `Camouflage` (uncommon, `round((3+lvl/2) x arcana)` invisibility on grass trample) are
      now ported - both genuinely fitting existing systems (plantable terrain + buff map), verified
      against tag `v3.3.8` source, not assumed. **Found and fixed in the same audit: no `Fragile`
      armor curse exists in real Java** (checked `v3.3.8` back to `v3.3.1` - closest match is a
      `v1.x`-era changelog mention); the real 8th curse is `Stench` (1/8 x arcana to seed
      250-volume ToxicGas at the wearer's own feet), now ported with a `fragile`->`stench` load
      migration plus a `getCurse` legacy shim. See `PORT_COVERAGE.md`'s new rows. `Unstable`
      (uncommon) is now ported too (this pass): per-swing delegation to one draw over the
      real `randomEnchants` list minus Projecting (Java's own exclusion) and minus
      Corrupting/Elastic (no ported proc to delegate into yet), with the pick shared
      between the pre- and post-damage proc halves and Kinetic's conserved read-back
      flowing through the delegation. **Found and corrected in the same pass, auditing
      `Kinetic`/`Char.java` for the delegation: the old "store half of every hit, cap 20,
      decay x0.75" shorthand had no Java basis - real storage is kill-overkill only
      (`-HP` beyond the swing's conserved bonus, `round(x arcana x berserk-catalyst)`,
      replacing not adding), decay is `2.5%/turn min 0.1` as a float, and the read-back is
      `ceil`.** Remaining, each still needing its own system first: Corrupting's
      conversion, Elastic/Projecting's geometry, and Affection/
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
      a new way to reach the existing one. `StoneOfDeepSleep` still uses an instant-sleep
      simplification for real Java's gradual `Drowsy`/`MagicalSleep` debuff (the shared
      Lullaby path now carries the sustained hero healing/resting state; setting
      `sleeping = true` directly), just on one auto-targeted enemy instead of every
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
      inventory popup showed "stoneOfBlink" with the correct "UTILISER" action label.
      **Three more runestones, `StoneOfEnchantment`/`StoneOfIntuition`/`StoneOfDetectMagic`,
      ported this pass (10 of 12 real), first consumers of the new generic item-picker panel
      alongside Transmutation - the picker blocker cited below is now gone for good:**
      Enchantment imbues a picked bag weapon/armor with a random good affix (overwriting, like
      Java's own `enchant()`); Intuition runs the real two-stage guess (unidentified
      potion/scroll/ring, then its unknown classes by true name, class-level identify on a
      correct guess) with the real alternating free/paid `IntuitionUseTracker` rule; DetectMagic
      reveals a picked equipable/wand's curse state and reports none/both/good/bad magic from
      its real curse/level/affix inputs. See `PORT_COVERAGE.md`'s new row for the stated
      simplifications (bag-only picker, no exotics, single-id wand, consumed-knowns read
      unknown, no select-then-confirm). **Flock and Aggression are now wired too:** Flock
      creates temporary scheduled Sheep actors within the radius-2 cast area, while Aggression
      marks the nearest visible enemy for the Java 20-turn (5-turn boss) forced-target rule.
      Both now have distinct ids and generated/floor-loot mappings; the remaining differences
      are the no-cell-picker center convention and reduced Sheep art/lifespan presentation.
      The generator table now also uses the real `StoneOfDetectMagic` class instead of the
      nonexistent `StoneOfDisarming`, so all 12 Java runestone classes are reachable from
      ordinary generation.
- [ ] Implement complete weapon and armor tiers, transfer formulas, upgrade formulas, curse infusion, and degradation. Upgrade transitions are now exact Java (`Weapon/Armor.upgrade(false)`: curse-affix 1-in-3 removal with the real line, good-affix loss 10-100% from +4 with the real warnings, pre-level-change ordering), and Warlock Degrade is now the real 30-turn buff (50% on landed ranged zaps, sqrt effective-level reduction) instead of a permanent chip - the old shorthands had no Java basis. Remaining: the tier-jump progression itself (real Java has fixed per-class tiers with plain +1 levels - a full state-machine rework, not a formula fix), Blacksmith reforge transfers (section 4's forge item), and curse infusion proper (`items.spells.curseinfusion` is an alchemy-brewed spell, so it waits on the alchemy system with everything else brewed). See `PORT_COVERAGE.md`'s upgrade/degrade row.
- [ ] Implement the remaining charm/knockback/stealth/blink/durability-per-hit
      subsystems the unported enchants, glyphs, and curses depend on (Kinetic's
      carried-damage buffer, Blooming's plant seeding, Projecting's
      line-AoE geometry, and the
      charm/wand-drain/blink/durability mechanics behind
      Affection/AntiMagic/Brimstone/Camouflage/Obfuscation/Potential/Repulsion/Viscosity
      and the matching armor curses) - each needs its own system stood up before
      the enchant/glyph/curse itself can be anything but a stub.
- [ ] Replace simplified missile durability and wand recharge behavior with the Java formulas.
      Wand recharge is now Java-shaped (`10 + 40 * 0.875^missing`, with Recharging's bonus)
      and explicit charge refunds are separated from passive recharge; missile durability,
      damage, and upgrade levels are now exact too (per-type `baseUses` 5/5/12 with the
      `1.5^level` scaling the old formula missed, durable-talent corrected to
      `1.25+0.25/point`, hit-only wear with the real break warnings, PinCushion sticking
      for knives/spikes with kill-scatter, uncapped missile levels via SoU) - this also
      fixed a live `{level}`/`{tier}` log interpolation bug in the upgrade messages.
      Remaining: per-missile identity (boomerang return/merge), the last-missile confirm,
      the dust-pickup tracker, and Sharpshooting's Aim-buff rework (flagged, own pass).
- [x] Implement identification appearance randomization. Potion and scroll appearances are
      shuffled once per seeded run, pre-drawn without disturbing later gameplay RNG, and
      persisted through save/load.
- [ ] Implement full shop pricing, buyback shelves, and wealth modifiers. Pricing is now
      exact Java (`sellPrice = value x 5 x (depth/5+1)` bracket, verified per-unit `value()`
      bodies, selling pays flat `value()`), keepers spawn on the real 6/11/16/21 depths with
      per-shop shelf stock and a persisted cap-3 buyback shelf rebought at flat `value()`
      (G key, newest sale first), and generated FOR_SALE stands are priced and no longer
      free loot. Remaining, each needing its own system: `ShopRoom` geometry (keepers stand
      in random rooms), selling anything but food (needs the generic item-picker UI), and
      the full generated stock as priced live goods (needs Ankhs/Styluses/darts/spells/bags
      as real items first). Priced stands can now be bought directly by stepping onto them;
      the Java trade window is still simplified. See `PORT_COVERAGE.md`'s
      `Shopkeeper` + pricing rows.
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
- [x] Port Halls' `DemonSpawnerRoom`: real Java room placement and the `HALLS_SP` custom-floor
      atlas through the live MWG sprite-sheet path; defeated spawners remain absent on revisit.
      **Formatting fix, 2026-09-09**: this bullet was a malformed list item missing its own
      `- [x]` checkbox marker entirely (just a bare `-` before the text), so
      `tools/roadmap-progress.html`'s checkbox counter silently dropped it from both the
      numerator and denominator - it never actually counted toward either "done" or "total".
      Content unchanged, only the marker restored to match what the prose already describes as
      finished.
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
- [ ] Port Prison/Tengu's full multi-stage arena transition and trap scripts (bracket
      floor, per-bracket capped relocation with trap burst, and the bomb-ability rotation
      with real 3-turn fuses are now live, plus Terror immunity; floor shifting, the
      FIGHT_START/ARENA room split, the Fire cone, the Shocker bursts, and the exact
      catch-up ability cadence remain).
- [ ] Port Caves/DM-300's full pylon, gate, energy field, and supercharge scripts (pylon
      proximity sealing and short energy pressure are live, and the GAS/ROCKS ability
      rotation is now real: live toxic-gas venting plus telegraphed rockfalls on the real
      cooldown/pick rules with the real ability lines - replacing an every-3rd-turn
      fire-ring + double strike that had no Java basis; exact pylon/supercharge state,
      targeting refinements, and presentation remain).
- [ ] Port City/Dwarf King's throne and Imp-shop scripts (the full 1/2/3 phase machine
      is now live: P1 hunt with exact summon/ability cooldowns and LINK/TELE-lite, P2
      immobile shield with real wave schedule and self-chip, P3 bleed/summons/losing yell
      - replacing a sketch whose Fury and hold-the-barrier turn had no Java basis; throne
      geometry, the Imp shop, P3 viscosity, and the crown drop remain).
- [ ] Port Halls/Yog's full fist, flame, shadow, and arena scripts (HP-gate floors,
      per-gate fist spawns, fist-gated invulnerability across ALL damage sources, fist
      proximity guards, and the phase-5 hope trigger are now live with the real
      darkness/hope lines - replacing a turn-based spawner that double-spawned against
      the new hooks and a 0.75/0.5/0.25 rhythm with no Java basis; distinct fist classes,
      larva/ripper summons, beam-count scaling, challenge pairs, flame/shadow arenas,
      and the visibility shrink remain).
- [x] Port final-vault Amulet placement at Java's `AMULET_POS` (depth 26, x=8, y=12).
- [ ] Port final-vault endgame-specific terrain, custom visuals, and compass behavior. The
      vault now runs Java's own `viewDistance = 4` through the shared sight radius (with the
      darkness-challenge minimum applied on top, matching `updateVisibility()`); chasm cells
      were already real there, and the compass was already correctly gated on `hasStairs`
      (false on 26). Remaining: the HALLS_SP custom floor, candle visuals, and the
      THEME_FINALE music cue (presentation/audio systems with no seam here).
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
      Corpse-dust (type 1) and rotberry-seed (type 3) fetches are now live with the real
      intro/reminder lines: MassGrave's dust heap spawns as a real cursed pickup (it used
      to vanish), grass druid... rotberry seeds already drop from grass, the quest type
      persists across save/load, and turn-in consumes the real item for the existing wand
      reward. **Type 2 (elemental embers) is now live too, with the real `intro_ember`/
      `reminder_ember` lines**: the four queued candles spawn as real pickups (same
      null-branch bug class as bombs/dust), a Place action sets them into the ritual slots
      from the bag (no aimed throw UI - stated shape change), all four lit rises a real
      `NewbornFireElemental` kit (HP 60, `[10,12]` melee, telegraphed 3x3 fireball, `3-5`
      cooldown, guaranteed `Embers` drop) for the existing wand reward - plus shared
      elemental rules (`FIERY` immunity, Frost harm) that also cover the base kind. See
      `PORT_COVERAGE.md` (type-check/build plus both suites green, browser owed per
      section 10).
- [ ] Port the Troll Blacksmith's mining and forge mechanics.
- [ ] Port Rat King and other missing special NPCs. Rat King is done (room drops real
      `Gold(10-25)` CHEST heaps, the king spawns sleeping with his own art, wakes with
      the real yell, answers with the real fallback line - the crown exchange waits on
      the King's Crown item + Ratmogrify ability). Remaining: other special NPCs
      (MirrorImage/PrismaticImage/Sheep allies, ImpShopkeeper, VaultSentry,
      DirectableAlly), which need the ally/combat systems behind them -
      see `PORT_COVERAGE.md`'s quests row.

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
      against Java source: this port's monster AI originally had no concept of a non-hero target
      at all. This blocked at least two real mechanics from ever being more than a documented
      stand-in: `ScrollOfMirrorImage`'s allied `MirrorImage` NPCs and `ScrollOfRage`'s `Amok`
      status. Necromancer's summoned skeleton already
      fights monsters *for the hero's opponent*, so some of the shape may be reusable, but the
      hero-side case (something the player controls fighting alongside them) is new.
      **Progress this pass:** `Creature.isAlly` is now persisted and scheduled; MirrorImage
      summons are real 1-HP allied actors that copy the hero's combat stats, attack the nearest
      visible hostile, follow the hero when idle, and can be intercepted by adjacent hostile
      melee turns. Simple ranged targeting now also considers the nearest visible ally, and
      `Amok` now attacks nearby creatures. Boss-specific ranged target migration and dedicated
      ally sprites/orders remain.
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

- [ ] Implement exact formulas for the remaining talents. Five wrong-shaped stand-ins
      corrected this pass against tag `v3.3.8` (Lethal Haste is now GreaterHaste-on-kill with
      a real 100-turn cooldown, Weapon Recharging a Recharging-gated melee multiplier,
      Farsight a sight-radius multiplier, Arcane Vision a zap-applied reveal, Necromancer's
      Minions removed until SoulMark/Wraith/ally exist, Endless Rage's free-turn line gone -
      see `PORT_COVERAGE.md`'s talent row; type-check/build plus both suites green, browser
      owed per section 10). **2026-09-09 audit, four more real formula bugs found and fixed**
      (Hearty Meal, Sucker Punch, Aggressive Barrier, plus the per-tier talent-point pool
      described below) **and a batch of previously-undocumented invented substitutions/gaps
      now recorded in code comments and `PORT_COVERAGE.md`** (Iron Will, Secondary Charge,
      Monastic Vigor, Twin Upgrades, Bounty Hunter, Thief's Intuition rank 1, Shared
      Enchantment/Durable Tips) - see `PORT_COVERAGE.md`'s talent rows for exact formulas and
      browser verification. **Correction, same day, later pass: Test Subject/Tested Hypothesis
      and Swift Equip were wrongly filed under "invented substitution" above - a real
      methodology gap, not just two wrong entries.** That audit pass checked only Java tags
      `v3.3.8`/`4.0.0-beta` for whether a talent id was real; it should also have checked
      `src/generated/spdMessages.ts`'s own real, fully-translated `actors.hero.talent.*`
      strings, built from a more complete SPD source than either tag - which show Test
      Subject/Tested Hypothesis/Swift Equip are all genuine, named talents. Test Subject's
      formula was already exactly right; Tested Hypothesis had a real, drastic overpower bug
      (granting whole wand charges instead of a fraction of one, fixed twice over - first the
      unit, then the rate); Swift Equip's real spec (a cooldown-gated quickslot re-equip, not
      a general equip-cost reduction) was simply wrong, though the practical "cannot be
      modeled, no baseline cost to be an exception to" conclusion still holds for a different,
      now-correct reason. **Lesson for future talent work: check the generated message catalog
      before concluding a talent id is invented, not just whichever Java tags happen to be
      checked out locally** - see `PORT_COVERAGE.md`'s talent rows for the corrected formulas
      and fresh browser verification. **Also found and fixed: talent
      points were drawn from one shared pool across all three UI tiers instead of Java's
      separate per-tier pools**, letting a player freely cross-spend a leftover T1 point into
      T2/T3 - replaced with a real per-tier `talentPoints` array, browser-verified to grant the
      exact real per-tier totals (5/6/8) with T4's unimplemented 10 correctly never granted.
      **Cleric's entire talent tree is Mage's copied verbatim, with zero disclosure anywhere
      until this pass** - now documented in `src/talents.ts` and `PORT_COVERAGE.md`; not
      replaced, since a real Cleric tree needs the Cleric class's own Holy Lantern/spell
      mechanics built first.
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
      remaining gaps: source-specific Bleeding death badges/blood visuals, feather-fall item, landing sound/camera shake).
- [ ] Implement water and terrain hazards. `Level.java`'s per-turn water hook (a non-flying
      char standing in `WATER` extinguishes `Burning`, matching `Burning.act()`'s own
      `acted && water && !flying -> detach()`) is now ported for both hero and monsters,
      collapsed to an immediate extinguish once this turn's DoT tick has landed rather
      than reproducing the exact one-turn-late real timing - see `PORT_COVERAGE.md`. Ooze's own
      water interaction is now ported too: CausticSlime/Acidic/FetidRat/Corrosion feed a real
      `ooze` buff (20 turns, announced, own icon, `Ooze.act()`'s depth curve with the real
      `ondeath` line) instead of the shared `poison`, and standing water washes it off after
      the tick for hero and monsters alike. Other terrain hazards remain.
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
      claiming otherwise at `trampleHighGrass` is now fixed. `WandOfRegrowth`'s charge-scaled
      regional growth, roots, high-grass budget, seed/dewcatcher/seedpod chances, and persistent
      degradation counters are now live too. What remains: its Lotus ally seed-preservation
      chance, exact cone targeting, and exact waterskin/dewdrop interactions.
- [x] Match hunger and starvation damage exactly (`Hunger.act()`'s real `partialDamage`
      fractional accrual and crossing-into-STARVING 1-damage hit, replacing the former flat
      "every 10 turns" guess). Java has no attack-delay/accuracy penalty while merely hungry
      beyond the log line, so there is no further penalty to match there.
- [ ] Match stealth, invisibility, surprise, and attack-delay systems exactly. Sleeping
      wake-ups now roll the real `1/(distance+stealth)` detection (stealth 0 - only
      Obfuscation raises it; the old flat 6/3/2 radii had no Java basis), gated on the
      mob's own sight so invisibility still hides, with Silent Steps and levitation as
      their real never-wake immunities (an infinity chance never beats the selection's
      initial infinity, so gated heroes are never even rolled) and the woken mob waiting
      its turn. Surprise on the attack side already matched (`sleeping || !seesHero`;
      STRReq/flail gating unmodeled). **The negative-buff wake is now ported too (2026-09-09
      pass)**: a sleeping monster with any real negative-type buff (poison/burning/cripple/
      weakness/vulnerable/paralysis/roots/terror/ooze/degrade/daze/hex - checked against each
      one's own Java class) wakes unconditionally, no roll, even out of the hero's sight -
      real and reachable here since `spreadFire`/`spreadPlantBlobs` already apply those buffs
      to sleeping monsters without waking them. Browser-verified live. See
      `PORT_COVERAGE.md`'s sleeping/wandering row. Remaining: the WANDERING notice roll (needs
      a genuine awake-but-unnoticed monster state plus random-patrol movement `mwg` has no
      primitive for - a real, moderate-scope feature, not a quick fix) and ally-aware
      targeting (needs the unported ally-vs-monster combat system).
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
- [x] Fix the title screen's banner art: the redrawn "MWG Pixel Dungeon" logo (three stacked
      lines, replacing real SPD's two-line "SHATTERED"/"PIXEL DUNGEON" - see `banners old.png`)
      was cropped by a frame rect sized for the old two-line art, clipping the bottom of
      "Dungeon" clean off, and its flanking torches were positioned for the old asset's
      evenly-filled width, sitting visibly asymmetric against the new, narrower, left-shifted
      text. Found live via browser screenshot (a user report, not a code read). Fixed: frame
      height 90->108, torch x-offsets recentred on the actual glyph midpoint, and the whole
      title+torches group shifted as a rigid unit so that glyph-centred layout also lands
      dead-centre on screen (measured post-fix: 1px off centre at 1078px width). See
      `PORT_COVERAGE.md`'s title-screen row.
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
      CLDR plurals already cover the per-locale mechanics. **First locale done: German (`de`),
      2026-09-09, 374/374 keys** (the key count grew since the 305 estimate - `port.affix.*`
      alone added 32). **Correction to this bullet's own prior "grounding" strategy note,
      found the moment the work was actually attempted**: `portStrings.ts`'s own header
      comment already says why grounding in real Java translations mostly doesn't apply here -
      "the strings this port invented, which have no SPD original to borrow a translation
      from... everything the real game also says is looked up under its own SPD key instead."
      That is `portStrings.ts`'s entire selection criterion: anything with a real Java
      equivalent already resolves through the generated catalog directly and was never a
      candidate for this file. The prior note's premise (most `port.*` keys closely paraphrase
      a real Java string with a translation to ground against) does not hold for the actual
      content - it is this port's own invented quest dialogue, its own simplified-mechanic log
      lines, and hint text SPD has no equivalent of. What worked in practice: direct
      translation key-by-key from `PORT_STRINGS_EN`, matching the source's tone (short, direct
      game-log sentences) rather than searching for a Java analogue that usually doesn't
      exist, then a **programmatic QA pass** before wiring anything in - diffing the new
      locale's key set against EN's (0 missing, 0 extra) and comparing each value's
      `{placeholder}` tokens exactly (0 mismatches) - catching exactly the class of error a
      human proofread would also have to catch, before any human proofreading happens. Marked
      `unreviewed` in `PORT_STRINGS_DE`'s own `MT` doc comment and `PORT_STRINGS`'s registration,
      matching SPD's own complete/unreviewed/unfinished convention - a machine-assisted draft
      is not silently promoted to `complete`. Browser-verified live: the welcome log line, bag/
      talent panel labels, and the settings/badges/changes windows all rendered correctly-
      composed German with no raw keys and no console errors. **Second locale done: Spanish
      (`es`), 2026-09-09, 374/374 keys**, same process (direct translation, then the
      programmatic key/placeholder QA diff against EN, then wiring, then live verification) -
      marked `unreviewed` in `PORT_STRINGS_ES`'s own doc comment for the same reason. Both `de`
      and `es` are real Java SPD locales (confirmed against `src/generated/spdMessages.ts`'s own
      generated table, which only exists for locales SPD actually ships translations for) - this
      work only ever adds a `port.*` catalog for a language Java's own base catalog already
      covers, never for one it doesn't.

      Verifying Spanish live surfaced a real, independent bug that predates this translation
      work and affects every non-English locale already shipped (French and German too):
      `main.ts`'s `attack()` built its combat-log `object` slot for a hero defender as a
      hardcoded English literal `'you'` bypassing translation entirely, instead of the same
      `t('port.log.subject.you')` pattern the `subject` slot already used correctly one line
      above. Reusing `subject.you` outright would have been wrong too - that key is capitalized/
      nominative ("You"/"Vous"/"Du"/"Tú") for sentence-initial use, not the lowercase/accusative
      form an object slot needs (English "you" lowercase, French "vous", German accusative
      "dich", Spanish "ti" after "a"). Fixed with a new `port.log.object.you` key per locale and
      confirmed by directly re-running `attack()` in the browser via `window.__MWG__` for all
      four locales (en/fr/de/es) post-fix - every locale's combat log now reads correctly instead
      of showing raw "you" mid-sentence.

      **Third locale done: Portuguese (`pt`), 2026-09-09, 375/375 keys** (key count grew to 375
      after the `object.you` fix above added one key to every locale), same process throughout -
      direct translation, the programmatic key/placeholder QA diff against EN (0 missing/extra,
      0 mismatches), wiring, then live verification. Marked `unreviewed` in `PORT_STRINGS_PT`'s
      own doc comment for the same reason as `de`/`es`. Confirmed `pt` is a real Java SPD locale
      the same way as `de`/`es` (present in `src/generated/spdMessages.ts`'s generated table).
      Browser-verified live: title screen buttons, the welcome log line, the hero info panel
      (Java's own real strings, confirming the whole locale resolves end to end, not just this
      port's own keys), and the `object.you`-fixed combat log all rendered correctly-composed
      Portuguese with no raw keys and no console errors.

      **Fourth locale done: Italian (`it`), 2026-09-09, 375/375 keys**, same process throughout -
      direct translation, the programmatic key/placeholder QA diff against EN (0 missing/extra,
      0 mismatches), wiring, then live verification. Marked `unreviewed` in `PORT_STRINGS_IT`'s
      own doc comment for the same reason as `de`/`es`/`pt`. Confirmed `it` is a real Java SPD
      locale the same way (present in `src/generated/spdMessages.ts`'s generated table). Caught
      and fixed a stray Cyrillic-character typo in the draft (`Ripони` for intended `Riponi`)
      via a scripted non-Latin-character scan of the draft file before wiring it in - worth
      keeping as a habit for future locales sharing a keyboard/IME slip risk, since a single
      corrupted key would otherwise only surface by chance during manual proofreading or a
      player report. Browser-verified live: title screen buttons ("Entra nel Dungeon",
      "Risultati", "Notizie", "Opzioni", "Trofei", "Cambiamenti", "Info"), the welcome log line
      ("Fogne, piano 1. Sei un guerriero, che impugna una spada corta consumata."), and the
      `object.you`-fixed combat log ("Ratto marsupiale colpisce te per 3.") all rendered
      correctly-composed Italian with no raw keys and no console errors.

      **Fifth locale done: Polish (`pl`), 2026-09-09, 375/375 keys**, same process throughout -
      direct translation, a scripted non-Latin-character scan (catching zero issues this time,
      confirming the Italian find wasn't a fluke worth repeating each pass), the programmatic
      key/placeholder QA diff against EN (0 missing/extra, 0 mismatches), wiring, then live
      verification. Marked `unreviewed` in `PORT_STRINGS_PL`'s own doc comment for the same
      reason as the other machine-drafted locales. Confirmed `pl` is a real Java SPD locale the
      same way (present in `src/generated/spdMessages.ts`'s generated table). Browser-verified
      live: title screen buttons ("Wejdź do Lochu", "Rankingi", "Aktualności", "Ustawienia",
      "Odznaki", "Zmiany", "O grze"), the welcome log line ("Kanały, poziom 1. Jesteś wojownik,
      dzierżysz zużyty krótki miecz."), and the `object.you`-fixed combat log ("Wielki szczur
      trafia ciebie za 2 obrażeń.") all rendered correctly-composed Polish (diacritics included)
      with no raw keys and no console errors.

      **12 locales remain** (see `languages.ts` for the full list). Their future catalogues must
      be machine-translated from `PORT_STRINGS_EN`, marked `MT` in source and in the provenance
      map exported by `portStrings.ts`, then checked for key/placeholder parity before wiring.
      Font coverage is part of done, not a footnote - zh/ko/ja need the section-10 tofu check per
      locale (already done for zh/ko this session), not just key resolution. See
      `PORT_COVERAGE.md`'s locales row.

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

- [x] Visually confirm non-English locale rendering (font coverage for
      non-Latin scripts in particular - a CJK locale is the one most likely
      to show tofu from a missing glyph; the i18n check only proves keys
      resolve and interpolate, not that text fits its widget or that a font
      covers a script). **Confirmed live, 2026-09-09**: switched to Chinese
      (`zh`) and Korean (`ko`) via `localStorage`'s `spd-on-mwg.language` key
      and screenshotted the title screen, class-select, in-game HUD/log, the
      inventory panel, and the talent panel (zoomed 3x on the smallest text)
      - every translated string rendered with complete, correctly-formed
      glyphs in both scripts, no tofu/missing-glyph boxes anywhere, no
      console errors. Untranslated strings (e.g. "Bag", "Talents") fall back
      to English as expected - a translation-completeness gap tracked
      separately under section 8's "Translate the port's own strings"
      bullet, not a font-coverage issue, which is what this item asked about.
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
- [x] **Resolved (was: unresolved race theory, now a proven reachable-through-normal-play
      crash with a fix)**: the `TypeError: Cannot read properties of undefined (reading
      'frame')` from `spawnMonster` was re-root-caused by reading the crash site instead of
      the timing evidence - `.frame` is read off `MONSTERS[kind]`, so an undefined `def`
      means an unknown mob *kind*, not an unloaded sprite. Three painter markers reach the
      live bridge with no catalogue entry: `alchemyBlob` (LaboratoryRoom's `Blob.seed(pot,
      Alchemy)`), `eternalFire` (MagicalFireRoom's `Blob.seed(cell, EternalFire)`), and
      `sentry` (SentryRoom's real beam turret). Any floor containing those rooms crashed on
      entry - which also explains the flakiness (only some seeds/floors contain them), with
      no asset race involved at all. Fixed three ways: both blob markers are filtered at the
      bridge (the pot stays inert scenery; the eternal-fire wall stays unported for now -
      **correction, 2026-09-09 MWG-utilization audit: the "needs a non-diffusing fire
      primitive" premise is stale**, `Roguelike.Blob.spread(passable, 0, 1)` (0% shared to
      neighbours, 100% kept - already exported by the installed `mwg` and already the same
      `Blob` class this port's `fire`/`toxicGas`/etc. blobs use) is exactly a static,
      non-spreading, non-decaying blob; porting `eternalFire` through it is now a real,
      actionable follow-up, not blocked on any missing engine capability), the sentry is
      fully ported (own `red_sentry.png` art, `20+depth*2` accuracy, infinite evasion,
      immobile charge-and-fire beam for the real `2+depth/2..4+depth` armor-bypassing damage,
      sees through invisibility), and `spawnPortedMobs` refuses any future unknown kind with a
      log line instead of crashing. See `PORT_COVERAGE.md`'s new sentry row. **Live browser
      confirmation done 2026-09-09** (`chrome-devtools-mcp`, `claude-in-chrome` unavailable
      this session): spawned a `sentry` mid-run via `window.__MWG__.currentScene.spawnMonster`
      - no crash, the real `red_sentry.png` art rendered on screen after a `refresh()`.

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
      cost. **Movement planning is now also runtime-routed** through
      `adapters/movementSimulation.ts`; `main.ts` still owns the resulting attack, door,
      pickup, trap, and rendering effects.
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
      above, rather than a separate step. **Progress (2026-09-09):** the hit/damage roll pair is
      now extracted into `simulation/attackResolution.ts`; the scene consumes its result while
      retaining all presentation, proc, shield, death, and event effects. The remaining hook
      branches still need incremental extraction.
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
- [ ] **MWG-utilization audit (2026-09-09)**: checked whether this port reimplements
      functionality `mwg` (`@datamoc/mw_games` ^0.4.2) already exports. Well-utilized, no
      action: `Roguelike.Pathfinder`/`chebyshevDistance`/`canTarget`/`traceLine`/
      `hasLineOfSight` (~30 call sites), `Roguelike.Blob`, `Actors.rollLoot`/`LootTable`,
      `Actors.Charges`, the `EntityId` re-export (already tracked above), the custom
      Java-bit-matching LCG RNG (`spdRng.ts`, correctly *not* using mwg's own xoshiro128 since
      it must reproduce Java's exact sequence), and `ui/floatingText.ts`'s custom
      `FloatingTextLayer` (checked against mwg's own `FloatingText` and deliberately not
      reused - different fade curve/stacking, a justified sibling not a duplicate). Three
      genuine gaps found between roadmap claims and mwg's actual exports:
      1. `heroBarrier` only ever used mwg `Actors.Barrier` as a single pooled
         layer, then hand-rolled a side counter to approximate section 7's "Blocking drains
         before Barrier" ordering gap - **resolved this pass, and the audit's own prescription
         turned out to undersell the problem**: re-checking against `ShieldBuff.java` (not just
         the `Barrier` API) showed the pooled model had three real bugs, not one ordering
         simplification - additive stacking where `setShield()` keeps the max, proportional
         decay nibbling a shield `BlockBuff.act()` exempts, and recency-order draining instead
         of `shieldUsePriority`. Blocking now owns a separate `blockingBarrier` pool drained
         first in `absorbHeroDamage` (priority 2 before 0, matching `processDamage()`'s sort),
         exempt from the proportional accrual, with max-semantics + always-reset 5-turn timer in
         `grantBlockingShield` and a load-time carve-out migration for pre-two-pool saves (see
         `PORT_COVERAGE.md`'s Barrier-decay row). Remaining there, not here: HoldFast scaling
         of both clocks and the ProvokedAnger break tracker (both need Sec 6 talent systems).
      2. Section 10's `eternalFire` "needs a non-diffusing fire primitive" claim (see above)
         was stale - **resolved this pass, and the audit's own prescription is now recorded as
         over-mechanized**: re-checked against `MagicalFireRoom.EternalFire`'s real `evolve()`,
         which never diffuses by construction, so the port simply never calls `spread()` on the
         new static `eternalFire` blob (no `spread(passable, 0, 1)` call needed to express
         "static"). Live with ignition, hero/monster/travel passage-blocking, and
         frost-quenches-whole-wall (see `PORT_COVERAGE.md`'s new `EternalFire` row); remaining,
         narrower gaps there: flammable-spread, heap burning, water/blizzard clearing.
      3. `summonSkeleton`'s push-aside comment claimed Necromancer's
         "push the hero aside when no free cell exists" needs "a full knockback system this
         port doesn't have" - **resolved this pass, and the audit's own suggested fix would
         have been wrong**: re-checked against `Necromancer.summonMinion()`'s exact rule (an
         8-neighbour search maximizing `trueDistance` from the necro, not a directional shove),
         `Roguelike.knockbackPath`'s straight-line push does NOT match that direction-choice
         logic, so it was correctly *not* adopted. The real rule needed no framework primitive
         at all and is now ported directly (nearest-passable pick, farthest-free-neighbour
         shove with an `IMMOVABLE_KINDS` redirect, direct 2-10 `SummoningBlockDamage` with no
         hit roll, wait when nothing is passable - see `PORT_COVERAGE.md`'s Necromancer row).
      No UI-widget/i18n-catalog/scheduler/FOV/geometry reimplementation found elsewhere.
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
       Re-checked at 0.5.0 this pass (pin `^0.4.2` -> `^0.5.0`, full suite green):
       `core.ReactionTable`/`ReactionRule` is new and root-exported - evaluated against
       every latch/transition site and deliberately NOT retrofitted (each site is already
       a minimal boolean; a table costs net lines plus save plumbing - recorded in
       `SPD_ARCHITECTURE_TARGET_V3.md` as the designated v3 event-presentation mechanism
       instead); `EntityRegistry` still has no caller-chosen ids (P1 stays open); `Types2D`
       still type-only (P2 stays open, Phase 0 exit still blocked).
       Re-checked at 0.5.1 this pass (pin `^0.5.0` -> `^0.5.1`, full suite green):
       no new game-logic primitives relevant to open items (no Alchemy/ally/Charm systems);
       `EntityRegistry.add()` still mints opaque ids with no caller-chosen-id primitive (P1
       stays open); `Types2D` still type-only aliases plus `Rect`/`rectOf()` (P2 stays open,
       Phase 0 exit still blocked).
- [x] **Code-quality note, flagged by the user**: a long `if (x === 'a' || x === 'b' || x === 'c'
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
      chains in that pass (each addition was small, verified, and consistent with its own
      neighbors at the time). **Closed this pass (2026-09-09)**: audited every remaining
      `x === 'a' || x === 'b' || ...` chain in `main.ts` (regex swept every occurrence, not a
      sample). Found one genuine instance of the flagged smell - `spawnMonster`'s "never
      sleeps on spawn" gate, an 8-clause chain that had grown by one kind with every pass
      porting a new always-awake special mob (FetidRat/GnollTrickster/GreatCrab/DemonSpawner/
      Sentry/RotHeart/RotLasher/newbornElemental) - extracted into `monsters.ts`'s
      `NEVER_SLEEPS_KINDS` Set, the same pattern `NPC_KINDS`/`BOSS_KINDS`/`IMMOVABLE_KINDS`
      already established. Browser-verified live: a plain rat still spawns sleeping, a
      GnollTrickster still spawns already awake. The other short chains found (region lists,
      key-item groupings, a 3-kind Ghost-quest-target check) are each a fixed, real-world-
      bounded enumeration that doesn't grow with every new ported feature - the exact
      condition this note itself says NOT to force into a lookup table just for its own sake,
      so they were deliberately left alone rather than converted for no structural reason.
      `tsc`/build/both suites green.
- [x] **Data-driven dispatch pass (2026-09-09), user-flagged**: acted on the code-quality note
      above for the two largest concrete instances found by a full `main.ts` audit (205
      `kind === '...'`/`id === '...'` checks total, spread across ~19 functions - not one
      giant cascade, but two genuinely large ones: `takeMonsterTurn`'s 43 and `spawnMonster`'s
      37). Converted `quaffPotion`'s 39-branch potion-effect `if/else if` chain and
      `takeMonsterTurn`'s 236-line, 16-case non-adjacent "ranged special ability" cascade
      (DM100/Shaman/Necromancer/Tengu/DM300/Yog/Warlock/Elemental/YogFist/Scorpio-Acidic/Guard/
      DM200-DM201/Spinner/Golem/Eye/GnollTrickster/GreatCrab) each into a `Record<Kind,
      handler>` registry (`potionEffects`, `rangedAiOverrides`) - O(1) lookup instead of a
      linear string-compare cascade, same behavior per case, same Java-citation comments
      moved onto their own handler. Each `rangedAiOverrides` handler returns `true` if it
      consumed the monster's turn, `false` to fall through to the shared movement AI exactly
      as the original branch's condition failing did; three shared cases (Necromancer/
      SpectralNecromancer, Scorpio/Acidic, DM200/DM201) route through one helper method from
      two registry keys instead of one `||`-joined condition. Browser-verified live for every
      handler with real branching complexity: Eye's two-turn charge-then-fire beam (including
      the 1/4-damage-while-charged interaction), Golem's teleport-and-cooldown, Guard's
      chain-once-ever (confirmed a second attempt does nothing), DM200 (movable, resumes
      chasing when its vent roll fails) vs DM201 (always immobile, confirmed via a
      forced-cooldown vent-miss), GreatCrab's every-3rd-turn movement throttle, Scorpio's
      ranged attack, Spinner's web-root, and Necromancer's full summon->heal->adrenaline
      chain - all matched their pre-refactor values exactly. **`spawnMonster`'s 37-branch
      cascade converted too, same pass**: its stat-override chain (7 kinds), base-kind alias
      chain (10 kinds), and sprite-texture-reuse chain (12 cases, checking both `kind` and
      `baseKind`) all moved into `monsters.ts` as real data tables
      (`DEPTH_SCALED_STATS`/`BASE_KIND_ALIASES`/`SPRITE_KIND_OVERRIDE`), plus the `isNPC`/
      `isBoss` `||`-chains collapsed into `NPC_KINDS`/`BOSS_KINDS` sets - the single biggest
      concrete instance yet of this session's own "data belongs in asset data, not code" theme.
      The texture chain in particular collapsed from 12 checked cases to one lookup once
      re-derived correctly: every kind the original checked against `kind` directly
      (`sentry`/`ratKing`/`rotHeart`/`rotLasher`) has no `BASE_KIND_ALIASES` entry, so
      `baseKind` already equals `kind` for each - meaning checking `baseKind` alone, as the
      original's own fallback chain already did for the other 8 cases, covers all 12.
      Live-verified via direct texture-identity comparison (not just "no crash"): spawned one
      of every affected kind and confirmed `mimic`/`crystalMimic` share one texture source,
      `piranha`/`bee`/`statue`/`armoredStatue`/`greatCrab` share another (crab), and every
      dedicated-asset kind resolves to its own distinct source - exactly the grouping
      `SPRITE_KIND_OVERRIDE` specifies, with no cross-contamination. `tsc`/`build` clean
      throughout. **Not a candidate for `mwg` itself** (raised by the user):
      the *pattern* (keyed handler registry over branch-cascade dispatch, a "return true if
      you handled it" contract) is genuinely generic and would be a reasonable thing for the
      framework to offer as a documented convention or even a small typed helper - but every
      handler *body* here is SPD-specific game logic, which the licensing-boundary section of
      `CLAUDE.md` forbids putting in `mwg` (MPL-2.0, must stay game-agnostic, no SPD data/logic
      ever). Recorded as a possible upstream proposal (a generic `keyedDispatch<K,
      Args>(table, key, ...args)` utility, or documentation of the pattern) for the user to
      raise in the framework's own repo if they want it - not actionable from inside this one.
- [x] **`mwg` bumped to 0.5.0** (`package.json`'s pin, already installed). This release ships
      `core.ReactionTable` - edge-triggered condition->action rules with a `once: true` option
      the framework's own doc comment illustrates with "a boss entering phase two" as the
      worked example, a closer match to this port's hand-rolled one-shot transition flags than
      anything 0.4.x offered. Adopted immediately for `takeKingTurn`'s three real one-way
      transitions (P1->P2 at an HP threshold, P2->P3 at shield-zero, P3's one-time "losing"
      yell under 20 HP) - previously three separate ad-hoc latch fields
      (`kingPhase`-gated `if` blocks plus a standalone `kingLostYell` boolean), now one
      `ReactionTable<Creature>` (`kingPhaseRules`) built lazily per King and stored on
      `Creature.kingReactions`. Since `ReactionTable` is a stateful class instance (not plain
      data), its own `toJSON()`/`fromJSON()` needed wiring into the existing save/restore path
      separately from the plain `SavedCreature` field list - done via a new
      `kingReactionsState` field, reconstructed with the same `kingPhaseRules(creature)` used
      to build a fresh table. Live-verified all three transitions firing exactly once
      (including that HP recovering above 20 and dropping again correctly does *not* re-fire
      the spent losing-yell rule - true `once` semantics, not just edge-triggering), a second
      call with wildly out-of-range state not reverting or double-firing an already-spent
      transition, lazy construction on a fresh King, and a full save-then-load round-trip
      preserving phase and every fired-rule id exactly. `tsc`/`build` clean throughout. Brute's
      `hasRaged` one-time revival is a smaller, single-rule instance of the same shape,
      identified but not converted this pass (lower value - a single flag, not a multi-rule
      state machine like the King's).

## 12. Publish a playable build on GitHub Pages

- [x] Deploy `dist/` to GitHub Pages so the game is playable at
      `https://datamoc.github.io/mwg-pixel-dungeon/` without a local checkout. `vite.config.ts`'s
      `base: './'` (relative asset paths) needed no changes for the project-subpath Pages URL;
      `tools/emit.mjs`'s built `index.html` (non-module `<script defer>`) loads over `https://`
      exactly like it does over `file://`. `.github/workflows/deploy.yml` (`npm ci`, `npm run
      build`, upload `dist/`, deploy; triggers on push to `main` plus `workflow_dispatch`) existed
      from an earlier pass but had never actually been pushed - this repo was 42 commits ahead of
      `origin/main` the whole time, so the workflow, and everything else committed since, only
      existed locally. The user explicitly asked for the deployment this pass (confirmed via
      `AskUserQuestion` that the project-subpath URL, not a separate root `datamoc.github.io`
      user-page repo, is what they want), which resolved both open items below at once: pushed
      main, enabled Pages via `gh api -X POST repos/.../pages -f build_type=workflow` (source:
      GitHub Actions), and the push-triggered run deployed successfully
      (`gh run watch` - both `build`/`deploy` jobs green). Verified live over HTTP: the deployed
      page serves the real built `index.html` (non-module `<script defer src="./game.js">`, not
      the unbuilt-source fallback) and `game.js` itself returns `200` at its full ~25.6MB build
      size. **Not verified this pass**: actual in-browser rendering (title screen, class-select,
      a played floor) - no working browser tool was available this session (`claude-in-chrome`
      extension not connected, `chrome-devtools-mcp`'s browser unreachable/already running
      elsewhere), so this is HTTP/asset-shape verification only, honestly short of the real
      "open it and look" bar the rest of this file holds itself to - owed as a follow-up. Every
      future push to `main` now deploys automatically (the auto-vs-manual choice both options
      being kept for was implicitly resolved by asking the user to trigger deployment via a push-
      based workflow at all). **Live browser confirmation done 2026-09-09** (`chrome-devtools-mcp`):
      opened `https://datamoc.github.io/mwg-pixel-dungeon/` directly, the title screen rendered
      correctly (menu buttons, background, title art - showing the pre-existing cropped-logo bug
      documented below, since that fix was made locally this same pass and not yet pushed).

## Definition of done

- Every Java gameplay system has an equivalent TypeScript implementation.
- Every intentional deviation is documented in code and in `PORT_COVERAGE.md`.
- Fixed-seed gameplay traces produce equivalent results across both versions.
- `npx tsc --noEmit`, `npm run build`, automated verification, and browser verification pass.

See `PORT_COVERAGE.md` for the current implementation status and known
simplifications.
