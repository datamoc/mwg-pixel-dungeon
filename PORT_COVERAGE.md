# Port coverage

Row categories: **Ported** (reproduces the real numbers/logic), **Simplified** (the shape with a
stated reduction), **Not ported** (SPD has it, we do not), **Divergence (deliberate)** (we
deliberately differ - see AGENTS.md's fidelity policy, settled 2026-09-11: iso with Java is no
longer the goal, and Java's own bugs and limitations are not reproduced).

| `ToxicGasRoom.paint()` ambient gas (`Blob.seed(cell, 30, ToxicGas.class)`) | `PaintLevel.seededBlobs`, `adoptPortedFeatures` | Ported (2026-09-14): every interior `EMPTY` cell records and materializes Java's initial 30-volume ToxicGas seed; no RNG is consumed. |
| `ToxicGasRoom.ToxicGasSeed.evolve()` vent emission | `PaintLevel.seededBlobs`, `toxicGasVents`, `emitToxicGasVents` | Ported (2026-09-14): each inactive vent retains its 12-volume source and re-seeds ordinary ToxicGas while local gas is at most `9 * 12`, matching Java's conditional vent emission. The missing vent particle emitter is presentation-only. |

| `ElixirOfFeatherFall` / `FeatherBuff` | `useFeatherFall`, `consumeFeatherFall`, `landFromChasm` | Ported (2026-09-14): the existing alchemy result is now usable, grants Java's 50-turn marker, and consumes it on the next chasm landing before Cripple, Bleeding, or fall damage. The jet particles and exact buff icon are presentation-only. |
| `WildEnergy.affectTarget()` | `useWildEnergy` | Simplified (2026-09-14): the existing alchemy result now refunds one wand charge and grants Java's 8-turn Recharging buff. Java's separate four-turn ArtifactRecharge pulse is not modeled because this port has no generic artifact-recharge clock. |

| `TelekineticGrab.affectTarget()` / `TargetedSpell.timeToCast()` | `useTelekineticGrab`, `pickupGroundItemAt` | Simplified (2026-09-14): the existing alchemy result now targets a visible cell and remotely picks up the port's one GroundItem payload, including ordinary item conversions. Java can collect every item in a stacked ordinary heap and has no spell-specific range; this port uses its six-cell targeting convention and one payload per cell. Java's beacon/pickup-delay presentation is not modeled, and special chests/shop heaps are refused as in Java. |
| `PhaseShift.affectTarget()` | `usePhaseShift`, `randomFreeCell`, `moveTo` | Simplified (2026-09-14): the existing alchemy result now targets a creature, teleports it to a random free cell, and applies the standard paralysis duration except to bosses/minibosses. Java's hunting-state reset/beckon and projectile presentation are not modeled (the teleport itself plays the shared appear presentation); this port has no equivalent Mob state machine or effect animation. The finite six-cell target range follows the port's shared targeting convention because Java's CellSelector has no spell-specific range. |

| `SummonElemental.onCast()`/`AC_IMBUE`/`InvisAlly` (`items/spells/SummonElemental.java`, tag `v3.3.8`) | `useSummonElemental`/`castSummonElemental`/`beginElementalImbue`/`summonElementalItem` in `src/scenes/dungeonScene.ts`, the `imbuedElement` field the spell item carries, the two picker labels in `itemDisplayName` | **Ported (2026-09-15), replacing a "Simplified" stand-in whose own text named exactly what was missing** (the imbue picker, the mature subtypes, the ally buff). The spell now offers both of Java's actions through this port's generic picker - the cast (SPD's own `items.spells.spell.ac_cast`) and `AC_IMBUE` (`items.spells.summonelemental.ac_imbue`) - and the imbue runs Java's own bag selector: an identified `PotionOfLiquidFlame`/`PotionOfFrost`/`ScrollOfRecharging`/`ScrollOfTransmutation` is consumed and sets the spell's element (fire/frost/shock/chaos), persisted on the item the way Java persists `summonClass`. The cast is Java's whole `onCast()`: free passable neighbours as spawn points, **picked by `Random.element`** (the port used to take the first in a fixed order), then either a **recall** - an existing summoned elemental is teleported to the new cell and set hunting, spending a turn *without* consuming the spell - or a summon at full health with invisibility dispelled, the spell consumed and a turn spent. An imbued spell raises a *mature* elemental of that element; an un-imbued one raises `AllyNewBornElemental`, which is a newborn that **never uses its ranged attack** (`rangedCooldown = Integer.MAX_VALUE`) and has `Property.MINIBOSS` removed - this port had been giving the summoned newborn a normal 3-5 ranged cooldown, i.e. letting a creature Java keeps fireless breathe fire, which is fixed here in the same pass. `InvisAlly` turns out to be a marker `AllyBuff` (its `fx` draws hearts on the ally; the name is misleading - it is not invisibility), so this port's `isAlly` flag is its equivalent and the recall lookup is the live allied newborn. **Simplified**: the port's elementals share one actor kit across the four elements, so an imbued summon differs by `elementalType` (attacks, loot, resistances) rather than by Java's per-class stat lines - an existing simplification of the elemental model, not new here; the imbue's per-element sample and particle burst (BURNING/SHATTER/ZAP/READ, Flame/Magic/Shaft/Rainbow particles) has no seam here, so the spell's own real per-element `desc_*` line reports the choice instead. **Not ported**: the `Talent.onScrollUsed` roll at the end of Java's cast (no talent hook reaches this port's item actions), and the `ELEMENTAL`-tagged summon-limit message Java's key set carries but this tag's code never uses. Browser-verified live (`tools/scratch/elemental-livecheck.mjs`, 11/11): the picker offered both rows with SPD's own labels; an un-imbued cast raised an `isAlly` `newbornElemental` at full health with the MAX ranged cooldown and no miniboss flag, consuming the spell; a second cast recalled that same ally to a new cell without consuming anything; the imbue picker offered only the carried Liquid Flame, which it consumed to set the spell to `fire`; and the next cast then raised a mature `elemental` ally of that element. |
| `ReclaimTrap.affectTarget()` / `ReclaimedTrap` | `useReclaimTrap`, `spentTrapCells`, `triggerTrapAt` | Simplified (2026-09-14): the existing alchemy result can store a visible active trap, refund one wand charge, then redeploy that trap as a concealed active trap on a later cast; state survives floor/run save data. Java reflects arbitrary trap classes and tracks its `reclaimed` marker; this port uses its closed seven-kind `TrapKind` union. Lightning/Bestiary/teleport presentation is not modeled. |

| `Recycle.onItemSelected()` / `InventorySpell.usableOnItem()` | `useRecycle`, generic item picker, `randomUsingDefaults`, `generatedInventoryItem` | Simplified (2026-09-14): the existing alchemy result now rerolls a selected potion, scroll, seed, or runestone into a different same-category generated item. Java also supports TippedDart and preserves exotic-vs-regular families; those distinctions remain outside the port's item model. Java's collection/floor-drop branch and transmuting presentation are collapsed because the bag has no capacity limit and no effect-animation seam. |
| `CurseInfusion.onItemSelected()` / `InventorySpell.usableOnItem()` | `useCurseInfusion`, generic item picker, `getWeaponCurses`/`getArmorCurses`, `usableForCurseInfusion` | Simplified (2026-09-14; candidate set and bonus folded in 2026-09-15): the existing alchemy result now curses a carried weapon, armor, wand, ring or missile stack, replaces weapon/armor affixes with a real negative curse, prevents a second infusion bonus, and sets the marker whose bonus row 25 below describes (a *virtual* `1 + level/6` at every `level()` read - the "grants one persistent level" wording this row used to carry was the same stale claim that row corrected). **The candidate set is now Java's own predicate too (2026-09-15)**: `usableOnItem(item)` is `(item instanceof EquipableItem && item.isUpgradable()) || item instanceof Wand || item instanceof SpiritBow`, and `usableForCurseInfusion` (`src/items/itemKinds.ts`) states it over this port's bag ids. The `&& isUpgradable()` half is what excludes artifacts, which *are* `EquipableItem` - they come in through `KindofMisc`, as does `Ring` - while `Wand` is **not** one (`Wand extends Item`), which is why Java needs that explicit clause for an upgradable type. Over this port's vocabulary the two selectors resolve to the same set, since every artifact here is non-upgradable and there is no bow *item* (the Huntress's bow is class state, not `belongings`), so the bow clause has nothing to match and is recorded rather than modeled. **Its presentation is ported too (2026-09-15)**: `CurseInfusion.onItemSelected()` opens with `CellEmitter.get(curUser.pos).burst(ShadowParticle.UP, 5)` and `Sample.INSTANCE.play(Assets.Sounds.CURSED)`, and both now run before the curse is applied, in Java's order. `burstShadowUp` carries `ShadowParticle.UP`'s real values off `resetUp`/`update` (velocity `Random.Float(-8, 8)` x `Random.Float(-32, -48)`, `size = 6`, `lifespan = 1f`, the `p*p*4`/`(1-p)*2` alpha ramp and the `0x440044` shade) over MWG's `ParticleEmitter`, with two documented approximations forced by that emitter's option shape: Java's velocity is a rectangle in x/y where the emitter takes polar `speed`/`angle` (so it becomes the cone of half-angle `atan(8/32)`), and Java interpolates the tint across each particle's life where the emitter's `tint` is one colour per particle (so the birth colour is used flat). The alpha curve, size, lifespan and cell-wide spawn area are Java's exactly, and the cell-wide spawn is `CellEmitter.get`'s own doing - it positions an emitter at the cell's top-left with `DungeonTilemap.SIZE` as its *width and height*, so particles are born across the whole cell. **Not ported**: Java's `MagesStaff`/`SpiritBow` targeting (neither exists as a port item). |

| `MagicalInfusion.onItemSelected()` / `upgradeItem()` | `useMagicalInfusion`, `upgradeItem`, generic item picker | Simplified (2026-09-14; **candidate-set description corrected 2026-09-15**): the existing alchemy result upgrades a selected carried weapon, armor, wand, or ring by one level while preserving its affix through the shared MWG upgrade operation. **The old wording here said equipped gear and the wand's Curse Infusion bonus were "not represented" - both were already handled and the claim was stale.** The picker's candidate list leads with the *equipped* weapon and armor (matched back by id and instanceId, upgraded in place the way Java's selector targets an item inside `belongings`), and the upgrade leaves an item's `curseInfusionBonus` payload flag untouched, which is what Java's own `if (wasCurseInfused) ((Wand) item).curseInfusionBonus = true;` restores. **The candidate set is now Java's own predicate, and it was wrong before (2026-09-15).** `MagicalInfusion.usableOnItem(item)` is `item.isUpgradable()` and nothing else - no type test at all - and this row used to describe the difference as "this port offers the equipped pair plus carried `weaponReward`/`armorReward`/`wand`/`ring_*` items", a hand-list of four bag-id shapes standing in for a predicate. What that approximation got wrong is that `MissileWeapon extends Weapon` and never overrides `isUpgradable()`, so **a carried missile stack is a real Magical Infusion target in Java** - the same conclusion this port's own uncapped `missileLevel` and scroll-of-upgrade path already act on - and the hand-list could never offer one. The predicate now lives in `src/items/itemKinds.ts` (`isUpgradableItem`) in Java's own shape: default true, with the non-upgradable set taken from the 42 classes that override `Item.isUpgradable()` to false, walked from the whole tree rather than sampled (a first pass missed `plants/Plant$Seed`, which lives outside `items/`). Over this port's vocabulary that resolves through the authored `slot` (`MWL_ITEM_SLOTS`) plus the ids the port mints for heaps and generated payloads; the one id that needs its payload rather than its name is `'stone'`, which is a missile stack when its `sourceClass` is an authored missile class and a *runestone* otherwise - both land on that id - so the class decides, exactly as `wieldMissile` validates it. Verified live (`tools/scratch/infusion-picker-livecheck.mjs`, 16 assertions): the picker now offers a carried missile stack, and still offers a generated weapon/armor, a wand and a ring while excluding the equipped-pair-plus-consumables cases, the artifact, the bomb, the seed and the runestone that shares the missile stack's bag id. Java's `Degrade.detach` and its `Talent.onUpgradeScrollUsed`/badge/statistics side effects are not modeled. **Sound added 2026-09-15**: `Sample.INSTANCE.play(Assets.Sounds.READ)` now plays on the pick, which is Java's only presentation for this spell (`MagicalInfusion.onItemSelected` shows `WndUpgrade`, whose confirm plays it, and `InventorySpell.cast` plays it too) - unlike `CurseInfusion` it bursts no particles. |
| `BeaconOfReturning.onCast()` / `BeaconTracker` | `useBeaconOfReturning`, beacon payload fields, `enterLevel`/`floorStates` | Simplified (2026-09-14): the existing alchemy result can set a persisted floor/cell marker without consuming the stack, then consume one use to return on the same floor or rebuild a saved floor at the marker. Java's options window, psychic-aura restriction, mining-branch rules, occupant pushing, and dedicated tracker buff are reduced to the existing item/transition model; unsupported branch returns are rejected. |
| `Weapon.curseInfusionBonus` / `Armor.curseInfusionBonus` (`level()` override, `enchant()`/`inscribe()`'s clearing rule, `Wand.level()`'s lazy clear) | `effectiveWeaponLevel`/`effectiveArmorLevel`, `setWeaponAffix`/`setArmorGlyph`, `curseInfusionLevelBonus` + `reverseCurseInfusion` (`items/itemWorkflows.ts`), `useCurseInfusion`, the equip paths in `items/equipment.ts` | **Ported exactly (2026-09-15).** Java's bonus is *virtual*: `Weapon.java` 254-258 / `Armor.java` 383-387 return `super.level() + (curseInfusionBonus ? 1 + level/6 : 0)` in integer arithmetic, and that boosted value is what every `level()` read sees - `Weapon.min()`/`max()` and `Armor.drRoll()` through `buffedLvl()`, `STRReq(level())`, `price()`, the affix-loss rolls at `level() >= 4`/`>= 6`, the class-specific wand scaling, and the displayed "+N". This port previously added 1 to the *stored* level when the infusion was cast and subtracted 1 on cleanse, which froze the bonus at infusion time, applied `1` where Java applies `1 + level/6`, and corrupted the real level on cleanse (an infused +3 weapon came out +2 where Java leaves it +3). Now the stored level is never touched: `effectiveWeaponLevel`/`effectiveArmorLevel` apply the formula at every read, infusing sets the flag only, and cleansing drops it only. The clearing rule is Java's own - a new affix removes the marker unless that affix is itself a curse (`Weapon.enchant()` 316-321, `Armor.inscribe()` 596-601), plus `Wand.level()`'s lazy clear for a stale flag - and every affix write in the scene now goes through `setWeaponAffix`/`setArmorGlyph`, so an upgrade that strips the affix, an Enchantment stone, a transmutation and a cleanse all drop it identically. The marker also travels with its item through equip/unequip now (it previously stayed behind on the scene fields, silently losing the bonus when the infused piece was swapped). **Browser-verified live** (2026-09-15): at stored levels 0/3/6/12 the reported level is 0→1, 3→4, 6→8, 12→15 (the `1 + level/6` steps from `Weapon.java`), hero damage moves with it (level 6: `[7,22]` plain, `[9,26]` infused), a good affix write clears the flag while a curse affix keeps it, and a cleanse leaves the stored level at 6 while dropping effective 8 back to 6. |

| `Scroll.ScrollToStone` | `craftScrollToStone`, `SCROLL_TO_STONE`, alchemy recipe picker | Simplified (2026-09-14): the alchemy result now converts any of Java's twelve eligible regular scroll ids into the corresponding runestone, producing two stones and consuming one scroll. Picking the recipe opens an ingredient picker over the eligible carried scrolls (2026-09-17), so the player chooses the scroll like Java's window; only the no-selection path takes the first eligible scroll. Unknown/exotic scroll classes remain outside the port's item model. |
| `Potion.SeedToPotion.brew()` | `craftPotionSeed`, `SEED_TO_POTION`, alchemy recipe picker | Simplified (2026-09-14): consumes three carried seed units, including generic `seed` payloads keyed by their concrete `sourceClass`, maps the twelve Java seeds to their regular potions, identifies the one-distinct-seed result, and applies Java's 1/4 random-potion chance for two distinct seeds and 1/2 chance for three. Picking the recipe opens three unit pickers over the eligible seed stacks (2026-09-17): an explicit three-unit selection brews, a bad selection fails whole with nothing consumed, and only the no-selection path takes the first three units. Java's cooking-HP limited-drop counter and placeholder preview are not modeled. |

| `StewedMeat` / `MeatPie` / `Pasty` `Food.execute(AC_EAT)` | `useItemById`, `eatFood`, `consumableStats` | Simplified (2026-09-14): the authored food recipes now produce edible results with Java's base hunger values (150, 900, and 450). Java's shared Food subclass hooks are reduced to the port's generic eating/talent transaction; MeatPie's `WellFed` buff and Pasty's holiday-specific Recharging effect are not modeled. |
| `AlchemicalCatalyst.Recipe` / `ArcaneCatalyst.Recipe` and direct use | `craftAlchemicalCatalyst`, `craftArcaneCatalyst`, `useAlchemicalCatalyst`, `useArcaneCatalyst` | Simplified (2026-09-14): both catalyst recipes now consume a regular potion/scroll plus a concrete seed or runestone, with Java's zero/one energy cost based on the secondary ingredient, and direct use selects from Java's weighted regular potion/scroll pools. Picking either recipe opens a primary picker plus a secondary seed/runestone picker (2026-09-17), with the same zero/one energy cost and whole-or-nothing validation; the no-selection path keeps the first-eligible behavior. Exotic classes are not modeled; the no-healing reroll IS live in the weighted pool, and only Java's multi-slot window presentation stays simplified. |

## 2026-09-11 mwg alignment pass

| `StoneOfBlast.activate()` / `Bomb.ConjuredBomb.explode()` | `useStoneOfBlast`, `blastCells`, `destroyBombTerrain` | Ported (2026-09-14): the aimed destructive blast now uses Java's 8-neighbour distance-limited flood fill through passable or flammable cells, destroys affected terrain before damage, and processes affected heaps. Heap container/exotic-item details and the blast presentation remain simplified. |
| `Heap.explode()` ordinary ground-item consequences | `detonateBomb`, `useStoneOfBlast`, `explodeGroundItem` | Simplified (2026-09-14): destructive bomb blasts now recursively detonate bomb payloads and remove ordinary consumable/key/stone/food heaps, while preserving the port's equipment/unique payload kinds. Java's stacked heaps, potion shattering, containers, tipped darts, and specialty-item callbacks are not represented by this one-payload-per-cell model. |

| `SewerLevel.buildFlagMaps()` / `destroy()` regional barrels | `isFireFlammableTerrain`, `burnFireTerrain`, `destroyBombTerrain` | Ported (2026-09-14): Sewer `REGION_DECO` burns into `WATER` and `REGION_DECO_ALT` into `EMPTY_SP`, with both treated as flammable only on Sewers depths, matching Java's special override instead of the ordinary `EMBERS` result. |
| `Burning.act()` hero backpack item burn | `burningIncrement`, `burnHeroInventoryItem` | Simplified (2026-09-14): the Java `Random.Int(3) < burnIncrement - 3` cadence now burns a carried concrete scroll or Mystery Meat and cooks meat into Chargrilled Meat; the compact bag has no unique-scroll flag, Frozen Carpaccio payload, or stacked-container subtype rules, so those candidate distinctions are reduced. |

| `Level.occupyCell()` soft `pressCell()` for mobs / trap activators | `moveTo`, `triggerMobTrapAt`, `spentTrapCells` | Simplified (2026-09-14): monsters and allied creatures now activate revealed traps when they step onto them, with the represented gas, fire, poison-dart, grim, and explosive effects, while hidden traps remain ignored like Java's soft press. Monster damage uses the port's ordinary armor roll and shared status durations; Java's source-specific resistances, trap animations, and full character subtype callbacks remain unmodeled. |
| `Blob.evolve()` area propagation for gas/plant blobs | `evolveJavaBlob`, `applyEnvironmentalBlobs` | Ported (2026-09-14): environmental blobs now use SPD's bounded four-neighbour average with one-volume loss and solid-cell blocking rather than MWG's generic diffusion/decay parameters. Gas-specific actor effects remain in the scene adapter. |

| `ConfusionTrap.activate()` / `ConfusionGas.evolve()` | `confusionGas`, `triggerTrapAt`, `applyEnvironmentalBlobs` | Simplified (2026-09-14): confusion traps now seed Java's `300 + 20*depth` gas volume and propagate with Java blob rules; the gas prolongs the port's `daze` movement-confusion stand-in for 2 turns instead of Java's separate Vertigo buff and effect particles. |
| `CorrosionTrap.activate()` / `CorrosiveGas.evolve()` | `corrosiveGas`, `corrosiveGasStrength`, `triggerTrapAt`, `applyEnvironmentalBlobs` | Simplified (2026-09-14): corrosion traps now seed Java's `80 + 5*depth` gas volume and `1 + depth/4` strength, using the shared corrosive-gas damage state. The port uses its existing two-turn corrosion damage hook and the shared toxic trap log line; Java's gas particles and trap-specific presentation are not modeled. |

| `Fadeleaf.activate(Mob)` | `triggerMobPlantAt`, shared `moveTo` boundary | Simplified (2026-09-14): movable hostile mobs stepping onto Fadeleaf are now teleported to a random free cell and the one-shot plant is consumed, matching Java's `ScrollOfTeleportation.teleportChar` shape. HazardAssistTracker marking is live and the teleport plays the shared appear presentation; the Warden's inter-floor return branch remains unmodeled. |
| `Plant.trigger()` / non-Fadeleaf `Plant.activate(Char)` for mobs and allies | `triggerMobPlantAt`, shared buffs/blobs | Simplified (2026-09-14): revealed plants now also activate for non-hero creatures: Blindweed, Firebloom, Rotberry, Starflower, Sorrowmoss, Stormvine, Icecap, and Mageroyal use their represented status/blob effects; Sungrass grants the real additive `Health` pool and Earthroot the real keep-max `Armor` pool (both in `simulation/plantPools`, paid out per own turn in `takeMonsterTurn` / absorbed per landed attack hit in `attack()`, persisted through save/load); Swiftthistle banks the stepping mob its own seven rapid turns (per-char `TimeBubble` ownership, see the teleport row); the shared time-freeze counter stays the hero's bubble only. Warden-only branches, exact actor timing, and plant presentation remain unmodeled. **Correction 2026-09-17:** the monster pools this row called unmodeled are now the real Java shapes (`boost(HT)` additive vs `level(HT)` keep-max, `(40+HT)/150` accrual with the strict `> 1` payout gate, `min(damage, blocking())` absorb that still covers the full cap on the detaching hit), pinned in `verifySimulation.mjs`. |
| `WandOfRegrowth.Dewcatcher`/`Seedpod.activate()` (neighbour dew/seed scatter) | `dropPlantNeighbourLoot`, `simulation/plantDrops` | Ported (2026-09-17): distinct passable neighbours minus the entrance and exit cells, one drop per cell picked uniformly without replacement, triangular `NormalIntRange(3, 6)`/`(2, 4)` counts (the flat uniform roll is gone), pinned in `verifySimulation.mjs`. Java drops onto an occupied cell anyway; this port keeps one item per cell (`spawnGroundItem`), so an occupied neighbour yields no drop - that is the stacking-heaps gap, not a dew rule. |
| `Trap.HazardAssistTracker` (mob hazard marking + `ENEMY_HAZARDS` badge) | `markHazardMob`/`markHazardArea`, `kill()`, `buffDurations`/`badgeCatalogue` MWL rows | Ported (2026-09-17): the 50-turn `FlavourBuff` is prolonged onto mobs by every hazard producer this port models - the six hazard plants (Blindweed/Fadeleaf/Firebloom/Icecap/Sorrowmoss/Stormvine), all nine modelled trap kinds (gas/burning/explosive/shocking mark NEIGHBOURS9, StormTrap its distance-2 flood, Grim/PoisonDart their aimed target, whoever the stepper is), and the caves-boss energy wires - and a marked enemy dying counts toward the 10-assist `enemy_hazards` badge, pinned in `verifySimulation.mjs`. Not modelled: the unported traps' own marking (Gateway/Flock/Frost/Geyser/Gripping/Ooze/Rockfall/Weakening/Blazing/Flashing/GnollRockfall/Teleportation/Disintegration/Chilling and the rest), `Chasm.mobFall`'s mark (mobs can never enter a chasm here). Teleport presentation is live (the shared `playTeleportAppear`, see the teleport row). |
| `ScrollOfTeleportation.teleportChar` destination rules + `TimeBubble.disarmPresses()` | `randomFreeCell`, `simulation/teleport`, `disarmTimeBubblePresses`, `plantKindAt` | Ported (2026-09-17): every random teleport shares the respawn-cell constraints (passable, unoccupied, outside the hero FOV, secret and pit cells refused), mob fadeleaf uses the shared `IMMOVABLE_KINDS` gate (the statue was wrongly excluded - Java only spares `IMMOVABLE`), mob swiftthistle overwrites rather than extends, PhaseShift beckons a teleported mob back to wandering before the paralysis, and stairs transitions disarm delayed TimeBubble presses (plants uprooted except Rotberry, traps spent and revealed) instead of carrying stale cells along - all pinned in `verifySimulation.mjs`. Not modelled: `teleportPreferringUnseen`'s unseen-room preference, LARGE/`openSpace`, and chasm-fall/branch-hop disarming. **Teleport presentation ported (2026-09-17)**: `ScrollOfTeleportation.appear`'s TELEPORT sample, `Speck.LIGHT` bursts and 0.4s sprite fade play through the shared `playTeleportAppear` at every random-teleport site, with the visibility gating pinned in `verifySimulation.mjs` (`simulation/teleportAppear`); the 0.2s particle stagger collapses to one burst and the camera-follow release has no counterpart. **Per-char bubble ownership ported (2026-09-17)**: a mob stepping on Swiftthistle banks its own `TIME_BUBBLE_TURNS` (`simulation/timeBubble`, pinned) - zero scheduler clock per own action through `monsterTurnCost`, ticked in `afterMonsterTurn`, persisted per creature - instead of the old global freeze; delayed presses still belong to the hero's bubble only. |

| `Bomb.explode()` destructive terrain pass | `detonateBomb`, `burnFireTerrain` | Ported (2026-09-14): destructive bomb variants now destroy combustible grass, doors, barricades, and furrowed grass in the blast before character damage, matching Java's `Dungeon.level.destroy()` order. Specialty non-destructive bombs retain their separate effects. Heap container/exotic-item explosion details and blast presentation remain simplified. |

- **`Item.value()` metadata used by `Shopkeeper`** — `src/content/shop-rules.mwl`'s typed
  `itemUnitValues` table, read by `src/items/shopPricing.ts`. **Ported:** the per-unit values
  for potions, scrolls, food, bombs, runestones, seeds, quest materials, and alchemy inputs
  now live in MWL; Java's identified-scroll, sealed-item, generated-gear, ring/wand, quantity,
  depth-bracket, sell, and buyback rules remain executable TypeScript because they depend on
  runtime item state. The port's documented 2.5-per-unit `Alchemize` approximation is authored
  as data and retained intentionally (Java truncates its single-unit value).

- **Ring display names** — `src/content/rings.mwl`'s `name` values and
  `src/items/catalog.ts`. **Ported:** the twelve SPD message keys now live with the ring
  definitions; the former TypeScript-only lookup table was duplicate content, not runtime logic.

- **Wand executable categories** — `src/content/wands.mwl`'s `wandDefinitions` table and
  `src/items/wands.ts`. **Ported:** the runtime category list is derived from the authored MWL
  definitions and checked against the closed TypeScript effect union; wand effects and targeting
  remain executable TS behavior.

- **Specialty bomb classification** — `src/content/item-rules.mwl`'s `itemCategories` table and
  `src/items/itemKinds.ts`. **Ported:** the ten specialty-bomb ids are authored as item metadata;
  TS retains only the ground-kind dispatch and executable bomb effects.

- **Bomb blast parameters** — `src/content/item-rules.mwl`'s `bombRules` table and
  `src/items/bombEffects.ts`. **Ported:** the standard, Tengu, specialty, Regrowth, Arcane, and
  Shrapnel chain radii, affected radii, depth-scaled damage bounds, base-blast flags, and armor
  piercing are authored as MWL data. The payload dispatch, terrain/fire changes, creature hooks,
  and recursive chain execution remain executable TypeScript because they are stateful behavior.

- **Item atlas frame coordinates** — `src/content/item-rules.mwl`'s `itemFrames` table and
  `src/dungeonConstants.ts`. **Ported:** the `items.png` frame indices now live in MWL and the
  adapter rejects any missing `GroundItemKind`; Pixi texture registration and the double-bomb
  `+1` variant remain renderer/runtime behavior.
  The inventory's item-specific variants are also authored in `itemSpecificFrames`; UI action
  selection remains TypeScript.

- **Food base characteristics** — `src/content/item-rules.mwl`'s `consumableStats` table and
  `src/items/consumables.ts`. **Ported:** base hunger reduction and meat healing are authored in
  MWL; the no-food challenge, cached-ration roll, and class-talent reactions remain executable
  TypeScript.

- **Waterskin capacity** — `src/content/item-rules.mwl`'s `itemLimits` table and
  `src/dungeonConstants.ts`. **Ported:** the static maximum volume is MWL content; dew pickup,
  drop selection, and the dynamic healing calculation remain TypeScript behavior.

- **Potion of Strength base modifier** — `src/content/item-rules.mwl`'s `itemEffectValues`
  table and `src/items/potionEffects.ts`. **Ported:** Java's one-point strength increase is
  authored as item data; applying it and synchronizing the live hero stats remain TypeScript.

- **Potion and artifact scalar parameters** — `src/content/item-rules.mwl`'s `itemEffectValues`
  table, `src/items/potionEffects.ts`, `artifactActions.ts`, and `generatedItems.ts`. **Ported:**
  the potion fire/gas volumes and the Hourglass/Cloak charge constants are authored as MWL data;
  scene effects, level caps, and charge-state mutation remain TypeScript behavior.

- **Artifact charge timing** — `itemEffectValues` now also authors the Hourglass and Cloak
  turns-per-charge costs (2 and 4); the scene still owns the ticking state and save/load behavior.

- **Scroll and Frost scalar effects** — `itemEffectValues` now authors Scroll of Mirror Image's
  clone count, Scroll of Retribution's power/damage coefficients, and Potion of Frost's radius
  and elemental damage fractions. The affected-cell scans, random rolls, status transitions, and
  deaths remain TypeScript behavior.

- **Runestone scalar effects** — `itemEffectValues` now authors the shared targeting range,
  Flock/Aggression/Clairvoyance/Shock/Blast radii and amounts, and Stone of Blast's depth-scaled
  damage bounds. Selection, aiming, map scans, random rolls, and combat mutation remain TS.

- **Bomb, Waterskin, and Transfusion scalar effects** — `itemEffectValues` now authors bomb
  targeting range, Waterskin healing per drop, and Transfusion's self-damage fraction. Target
  selection, reserve accounting, damage absorption, and world mutation remain TypeScript.

- **Runestone identity conversion** — `sourceInventoryItem` now consumes the existing MWL
  `consumableClassAliases` rows for all twelve runestones instead of repeating their class-to-id
  list in TypeScript; inventory state and unidentified-item handling remain TS.

- **Special ground-item identities** — the exact class-to-ground-kind mapping for bombs, quest
  props, and special shop items now lives in `specialItemGroundKinds` in `item-rules.mwl`; generic
  substring/category fallback and payload construction remain TypeScript.
- **Special inventory identities** — exact class-to-item-id, identification, and cursed-state
  metadata now lives in `specialItemInventoryRules` in `item-rules.mwl`; instance creation and
  variant/prefix fallback remain TypeScript.
- **Ground-item family aliases** — exact internal item-id-to-ground-kind aliases now live in
  `itemGroundKindAliases` in `item-rules.mwl`; prefix/category routing for families remains
  executable TypeScript.
- **Runtime item names** — names for runtime-only item IDs now live in `itemNameKeys` in
  `item-rules.mwl`; generated consumable/equipment/artifact names continue to come from their
  dedicated MWL definitions.
- **Ground-item names** — names for ground-item families now live in `groundItemNameKeys` in
  `item-rules.mwl`; choosing the family and resolving contextual wand names remain separate.
- **Inventory action labels** — `itemActionKeys` now authors the item/family action translation
  keys and capitalization flags, including localized Waterskin, Seed, Hourglass, and Cloak labels;
  family routing, frame selection, and the actual action behavior remain TypeScript/UI logic.
- **Generated item identity** — `itemInstanceRules` now authors which generated item kinds receive
  an instance identity (`weaponReward`, `armorReward`, `wand`, and rings); instance allocation and
  equipment state tracking remain TypeScript because they depend on the live inventory/equipment.
- **Specialty bomb scalar effects** — `itemEffectValues` now authors Fire Bomb's fire radius and
  duration, Regrowth Bomb's bloom/anti-healing values, Woolly Bomb's sheep limit, and Holy Bomb's
  damage fraction; area traversal, status application, terrain mutation, and combat remain TS.
- **Potion and runestone targeting scalars** — `itemEffectValues` now authors the Freerunner
  invisibility duration progression and Potion of Frost's adjacent-target radius; Stone of
  Aggression consumes the shared MWL targeting range instead of duplicating a literal. Talent
  checks, targeting, status transitions, and world effects remain TypeScript.
- **Seed generator deck** — `generator.ts` now consumes the existing `seedDeck` MWL trait for
  seed classes and probabilities; category selection, substream/RNG handling, and seed effects
  remain executable TypeScript.
- **Armor generator deck** — the armor class order and zero-weight specialization entries now
  live in `armorGeneratorDeck`; tier selection, reward-specific handling, and RNG orchestration
  remain TypeScript.
- **Generated equipment shop coefficients** — `equipmentValueRules` now authors the base-per-tier,
  positive-affix, known-curse, and identified-level price coefficients; identification, curse
  detection, quantity, depth bracket, and shop transaction behavior remain TypeScript.
- **Ring and Wand shop values** — the shared family value `75` is now authored in
  `itemUnitValues`; runtime ring-id fallback, quantity, and shop formulas remain TypeScript.

- **Fireblast charge rules** — `wandFireblastRules` now authors the three charge levels' cone
  angle, distance, fire volume, and damage bounds. Cone traversal, doors, fire propagation,
  victims, statuses, and charge refunds remain executable TypeScript.

- **Regrowth charge rules** — `wandRegrowthRules` now authors cone angle/distance, roots duration,
  grass placement coefficients, and the Lotus charge threshold. Cell eligibility, random plant and
  grass placement, charge accounting, and feature mutation remain TypeScript.

- **Transfusion scalar effects** — `itemEffectValues` now authors the ally healing progression
  and caster shield base/progression. Ally selection, undead damage, charm, absorption, and death
  handling remain TypeScript.

- **Potion/scroll/seed/runestone identity aliases** — `src/content/consumable-aliases.mwl`'s
  `consumableClassAliases` table and `src/items/generatedItems.ts`, `transmutation.ts`, and
  `itemKinds.ts`. **Ported:** Java class names and compact port ids, including the exceptional
  LiquidFlame/Invisibility/MagicMapping/RemoveCurse renames, plus all 12 seed and 12 runestone
  identities, are authored once in MWL; generation, eligibility, random selection, and inventory
  mutation remain TypeScript behavior.

- **Ring identity aliases** — `src/content/item-rules.mwl`'s `ringClassAliases` table and
  `src/items/generatedItems.ts`/`itemKinds.ts`. **Ported:** all 12 Java ring class names map to
  their compact runtime IDs from one MWL source; inventory instance creation and ring behavior
  remain TypeScript.

- **Wand range and charge scalars** — `src/content/wands.mwl`'s `wandRangeRules` and
  `wandChargeRules` tables and `src/items/wands.ts`. **Ported:** the base range, disintegration
  level scaling, and Fireblast/Regrowth charge ratio and bounds are authored in MWL; validation,
  charge spending, targeting, and wand effects remain TypeScript.

- **Wand direct-damage bounds** — `src/content/wands.mwl`'s `wandDamageRules`, read by
  `src/items/wands.ts` and the wand scene/effect adapters. **Ported:** the level-scaled bounds
  for Magic Missile, Frost, Lightning, Blast Wave, Living Earth, Prismatic Light,
  Disintegration, and Transfusion now live in MWL; charge-dependent Fireblast and the
  stateful status/area effects remain executable TypeScript.

- **Warding tier characteristics** — `wandWardRules` now authors ward tier healing,
  self-damage, and lifetime limits (plus the fixed max HP of higher tiers); tier upgrades,
  target selection, actor turns, and live HP mutation remain TypeScript behavior.
  The energy budget and initial ward HP formulas are also authored in `itemEffectValues`.

- **Ring and wand display names** — `src/content/rings.mwl`/`wands.mwl` and
  `src/i18n/spdKeys.ts`. **Ported:** player-facing SPD message keys are read from the MWL item
  definitions; appearance handling and wand/ring runtime behavior remain TypeScript.

- **Base weapon and armor stat formulas** — `src/content/item-rules.mwl`'s
  `equipmentStatRules` table, `src/items/catalog.ts`, and `DungeonScene.syncHeroFromStats()`.
  **Ported:** the Java-derived formulas are authored as data and evaluated only through a closed
  TS parser; degradation, no-armor challenge behavior, Barkskin, and subclass modifiers remain
  runtime logic because they depend on the live hero state.

- **`Fire.evolve()` / `Level.destroy()` / `Heap.burn()` / `Plant.wither()`** — `main.ts`'s
  scene-owned `spreadFire`, `burnFireTerrain`, and `burnFireContents`, plus `Terrain.EMBERS` and
  raw `FURROWED_GRASS` in the level bridge. **Ported for the representable terrain/content slice:**
  existing cells lose exactly one volume per turn, empty flammable orthogonal neighbours ignite at
  volume 4, active cells burn their scroll/dewdrop heap, detonate bombs, convert Mystery Meat to
  Chargrilled Meat, and wither plants; expired grass, furrowed grass, doors, locked doors, and
  barricades become passable `EMBERS`. A burned cell restitches its own tile face and the
  features layer is redrawn when a plant withers, the same redraw every grass change already
  performs - without it the terrain changed in the model only. The generic MWG Blob remains
  intentionally uninvolved in this SPD-specific transition. Sewer region wall decoration, webs,
  and Java's full heap/occupant subtype rules remain **Not ported** and are kept out of the coarse
  terrain model.

- **`Fireball` title flame / `Emitter.pour` / `Flame`** — `src/ui/titleFlame.ts` now uses MWG's
  `ParticleEmitter.frames` for the `FLAME1`/`FLAME2` film, with Java's 10 particles/second,
  one-second lifetime, upward motion, and a per-particle lateral angle/speed/spin range so the
  flame does not form a straight column. **Simplified presentation:** MWG's
  generic emitter has no per-spawn x/y jitter or Java `heightLimit` clamp, and its linear alpha
  range replaces Java's two-part fade curve; glow, flare, and local colour-only sparks remain.

- **The MWL item catalogue now resolves its names through SPD's real message keys, and
  `tools/i18nCheck.ts` is green.** The catalogue had invented keys for items that do exist as Java
  classes - `items.seeds.<plant>.name` for the twelve seeds, `items.food.pasty.name`,
  `items.bombs.doublebomb.name`, and thirty `port.name.alchemy.*` alchemy outputs - so `mwg/i18n`
  answered every one of them with the raw key string, in all 19 languages, and the offline check
  reported 46 failures (15 of them already on `HEAD`). They now use the real keys: seeds are
  `plants.<plant>$seed.name` (`Rotberry.Seed` is an inner class), `DoubleBomb` is
  `items.bombs.bomb$doublebomb.name`, `Pasty` is `items.food.pasty.pasty`, and the elixirs, brews,
  arcane resin, liquid metal, blandfruit, alchemize and ten spell outputs name themselves through
  `items.potions.elixirs.*`, `items.potions.brews.*`, `items.arcaneresin.name`,
  `items.liquidmetal.name`, `items.food.blandfruit.name`, `items.spells.alchemize.name` and
  `items.spells.*`. Only the four catalogue entries with no single SPD class behind them keep a
  port key (scroll-to-stone, the generic exotic potion and scroll, and `Bomb.EnhanceBomb`), added
  to English and French. The same pass keyed the port-authored DM-300 arrival line
  (`port.log.dm300arrives`, was a raw `say()` literal) and added the English base entries for the
  new journal tabs and the bag's filter labels, which had translations but no English original.
  `npm run i18n`/`npm run i18n:check` still need a `--spd-root`, and this session's checkout makes
  the extractor fail on stray MWL `set=` tokens, so the catalogue was not regenerated - every key
  used here is one the shipped catalogue already carries.
  **Two more defects were found by the live browser pass in section 10 of `ROADMAP.md`, both
  invisible to `tsc`/build/suites.** (1) `CLASSES[id].nameKey` came straight from
  `classes.mwl` and used invented `port.name.<class>` keys for five of the six classes, so class
  select rendered the raw string `Port.name.rogue`; the five now use SPD's real
  `actors.hero.heroclass.<class>` keys (`CLASS_KEYS` already used them for log lines), leaving
  only the Cleric on a port key, and `tools/i18nCheck.ts` gained a `CLASSES`/`CLASS_UNLOCK_HINT`
  rule so a raw class name cannot pass again. The same screen's locked hint was an English
  literal in the MWL, now `port.class.<class>.unlockhint` (English and French; Java has no such
  string at all - it never states an unlock condition). (2) `closeJournal()` left `journalWindow`
  pointing at a closed `mwg/ui` `Window`; the next `positionInterface` call then threw
  `Cannot set properties of null (setting 'x')`, which broke the inventory panel that calls it
  (`refreshInventoryPanel`) for the rest of the run. `closeJournal` now drops the reference, so
  the `if (this.journalWindow)` guard means something. The inventory's four filter tabs were also
  hardcoded English, now `port.ui.bag.*` (French `Équip.` kept short deliberately - the buttons
  are 35px wide and the fully-spelled word overflowed).

- **`mwg` 0.7.6 adopted (2026-09-11).** Published latest, pin moved from `^0.7.4`. Two changes,
  neither needing port code: `Blob.spread` now **returns the cells it just emptied**, which is the
  burnout hook the flamable work was waiting for (`GEOMETRY-AND-FIRE.md` §4.2 asked for exactly
  it) - so `Fire.evolve`'s "the fire left a flamable cell, turn it to embers" is now expressible
  without diffing `cellsAbove`; and `pixi.js` became an optional peer dependency, which this port
  needs no change for because it already lists `pixi.js` in its own dependencies. The bump itself
  is inert: MWL output byte-identical, tsc/build clean, 47/47 simulation, item suite, smoke and
  save round-trip clean.
- **`src/ui/floatingText.ts` deleted: the damage numbers are `mwg/ui`'s `FloatingTextStack`.**
  0.7.4 gave it both things the port's layer existed for - `FloatingTextOptions.hold` for Java's
  hold-then-fade curve (`alpha(p > 0.5f ? 1 : p * 2)`) and the keyed stacking `FloatingTextLayer`
  had approximated by proximity - so the 101-line wrapper went, along with its stale claim that
  the framework's class "fades linearly and has no per-target stacking". Java's numbers are kept
  through the stack's options: `LIFESPAN = 1f` second, one tile (`DungeonTilemap.SIZE`) of rise,
  `hold: 0.5`, one key per creature from a `WeakMap`, and the world-space trick of rasterising at
  full size then scaling the pop-up down (with the rise divided by the same factor, so it still
  travels exactly one tile). Verified live (`_browsercheck/floaters_check.mjs`): two numbers on one
  target in one turn both exist, the second is offset, scale is exactly `1/3`, alpha is `1` at
  300 ms of a 1 s life, `0.8` at 600 ms and the pop-up is gone by 1 s; the real `showStatus` path
  shows 'search' with no console or page errors.
- **Both defects carried here were fixed upstream in 0.7.7, and this port has now adopted them
  (2026-09-12, on 0.7.8).** The first: Java's `FloatingText.push()` anchors the **newcomer** on the
  target and nudges the **older** text *up* to `below.top() - above.height() - 4` (4 px gap),
  also shortening the nudged text's `timeLeft`; 0.7.4's stack instead moved the newcomer *down* by
  `height + 1`. That was found here by a live check, filed as
  `tools/scratch/mwg-proposal/0003-floating-text-stack-upward.patch`, and 0.7.7's changelog records
  it as fixed - "found by a consumer measuring it, not by the tests, which asserted the offset's
  magnitude and never its direction" - replacing `floatingTextStackOffset` with
  `floatingTextStackLift`/`floatingTextStackMoves` (pure arithmetic, now tested) and also fixing a
  lift that survived only one frame and the key rule (a stack keys on `key` alone, as Java's
  `stacks.get(key)` does). The second: a pop-up scaled *after* `push` was measured before the
  scale, because a `FloatingText`'s height includes its own scale - the port rasterises at 21px and
  draws at 7, so stacked lines were spaced by ~3x the drawn height. `push` now takes a `scale`
  applied before measurement, and `showStatus` passes it (`main.ts`) instead of chaining
  `.scale.set(...)`; `size`/`rise` stay divided by the scale because both are expressed in the
  pop-up's own pre-scale space. Verified live on the built page (`tools/scratch/floaters-livecheck.mjs`):
  the stack's measured height is the drawn one, a second number on one target lifts the older line
  *above* it (not below), and the real `showStatus` path still shows its text with no page errors.

- **Adopted `mwg/core`'s `RunHistory` for the run rankings.** `src/rankings.ts` no longer
  hand-rolls its own localStorage read/validate/sort/write: `RunHistory<RunRecord>` owns the
  storage, the id/`endedAt` stamping and the ranking sort, and only the summary shape is
  SPD-specific - the split `RunHistory` documents. Two behaviours changed with the adoption,
  both deliberate and stated at the call site: the retained 20 runs are now the most RECENT
  (`RunHistory`'s own "oldest runs are dropped" rule) rather than the highest-scoring 20, and
  the storage key is now `mwg-runs:spd-on-mwg.rankings.v1` rather than the old
  `spd-on-mwg.rankings.v1`, so runs recorded before this change are not carried over. A corrupt
  or denied store still degrades to an empty title-screen list, as before.
- **Corrected two stale comments** (`src/ui/bar.ts`, `src/ui/floatingText.ts`) that still claimed
  `mwg` was "a local dependency that can drift under this project between sessions" with a "once
  per session" check - removed along with the local-checkout workflow they described. Both files'
  substantive claims are unchanged: each is generic code that belongs in `mwg/ui`, together with
  the exact capability the framework counterpart still lacks (`Bar`: a texture fill and
  `HealthBar.layout()`'s ceil-to-whole-pixel rounding; `FloatingText`: the hold-then-fade alpha
  curve and per-target stacking).
- **Fixed both verification harnesses, which were still compiling a local checkout of the
  framework's sources.** `tools/verifySimulation.mjs` and `tools/verifyItemWorkflows.mjs` reached
  into a sibling `../MW_games` tree - a *different version* from the pinned dependency (0.7.3
  against the 0.7.2 this port pins), so both suites were exercising something the game does not
  ship. They now shim the installed package's `dist` instead (ESM required from CommonJS, which
  `require()` bridges directly on Node >= 22.12). This also fixes `npm run test:simulation`, which
  was failing outright before this pass: the old hand-written list of framework modules to
  compile had missed `Campaign.ts` once the checkout's `simulation/index.ts` grew it, leaving an
  `index.js` requiring a file that was never emitted (`Cannot find module './Campaign.js'`).
  Shimming the package barrel means the harness follows whatever it re-exports, so that staleness
  cannot recur.
- **Fixed the rankings window's sizing** (`src/scenes/titleScene.ts`), found by this pass's
  screenshot step rather than by any test. Its height was `Math.min(260, entries.height + 50)`,
  a guess that ignored both the frame/title chrome `Window` adds around `content` and the close
  button placed at `contentHeight - 18`. Measured live, three runs needed 97px of content in the
  74px that guess produced, so the button was drawn over the last row and the final score fell
  past the panel's bottom edge. It now derives the chrome height from a window of known size and
  sizes the frame from what is actually inside it (rows, gap and button) through `Window.resize`;
  the same live measurement now reports 113.3px of content with the button clear of the last row,
  reconfirmed visually.
- **Checked both "framework could not do this" claims against the pinned package, and one was
  wrong** (2026-09-11, follow-up to the same day's alignment pass). `src/ui/floatingText.ts`'s
  holds: `mwg/ui`'s `FloatingText` really does fade linearly with no stacking, so a patch
  proposing the hold-then-fade curve and a `FloatingTextStack` sits in
  `tools/scratch/mwg-proposal/`. `src/ui/bar.ts`'s does not: the pinned
  `@datamoc/mw_games@0.7.2` already ships `fillTexture` and `roundUpToPixel` on its own `Bar`
  (`tests/bar.test.ts` covers the rounding), so the two reasons it gave for existing are gone.
  It is not deletable yet either: `mwg`'s `Bar` cannot recolour its fill after construction or
  colour its track, and this file does both (the boss bar's bleeding red, the HP bar's black
  missing-health strip). Those two are proposed as
  `tools/scratch/mwg-proposal/0002-bar-runtime-colour-and-track.patch`, with framework tests,
  and the deletion is scheduled in ROADMAP.md's framework-adoption items behind it. Also confirmed while checking: five capabilities this port
  approximates - `Level.viewDistance`, `TerrainKind.flags`/`extras`, `Scheduler` priority,
  `Roguelike.Targeting`'s `Ballistica`, and `MultiTurnBeam`/`MultiStageAbility` - are all in
  0.7.3, so the work there is adopting them, not asking for them.
- **The `mwg` pin is now 0.7.3** (2026-09-11), the published latest. Bumping it alone changed
  nothing else in this port: the MWL compile emits byte-identical generated modules, tsc and the
  build are clean, `test:simulation` is 47/47 and `test:items` passes, and the browser checks
  (start-up, save round-trip, and the depth-25 live run covering Yog's fist decks, the Stronger
  Bosses challenge pairs, the beam burning terrain and the phase view radii) are identical to
  0.7.2. `tools/check-mwg-version.mjs` (`npm run mwg:check`) reports the pin, the installed
  version and npm's latest in one line and is the hourly check while porting, per AGENTS.md.
  Adopting what 0.7.3 makes redundant is tracked separately in ROADMAP.md.
- **`mwg` 0.7.4 adopted (2026-09-11), and the port's own `Bar` is gone with it.** 0.7.4 is the
  published latest, so the pin moved to `^0.7.4`; the MWL compile emits byte-identical modules,
  `check`/`build` are clean, both suites pass and the browser smoke/save checks are clean, so the
  bump alone changes nothing here. What the release unblocked came with it: `src/ui/bar.ts` is
  **deleted** (and `tools/scratch/uiCheck.ts` with it, since it only proved the rounding that the
  framework now owns and tests), with the HUD's two bars, the per-monster bars and the boss bar
  moved to `mwg/ui`'s `Bar` - `fillTexture`/`background` for the art and the black track,
  `roundUpToPixel` for `HealthBar.layout()`'s sliver rule, `setValue` for the fraction and
  `setColor` for the boss bar's bleeding tint. Verified live (`_browsercheck/bar_check.mjs`): the
  HP bar reads exactly `hp/maxHp`, a half-dead monster gets its own bar at `0.5`, Goo's boss bar
  reads `0.2` and tints `0xff7777` on the 25% edge, and the HUD screenshot shows the bar drawn
  over its black track. One capture caveat learned here: `page.screenshot()` returned a stale
  frame of the *previous* scene on this WebGL canvas, so the HUD was captured with
  `canvas.toDataURL()` inside a double `requestAnimationFrame` instead.
- **Correcting my own claim: the Yog beam's door handling is faithful, not a bug** (2026-09-11).
  I first recorded the opposite, from a grep that never matched `DOOR`; at `v3.3.8`
  `Terrain.flags[DOOR] = PASSABLE | LOS_BLOCKING | FLAMABLE | SOLID` and
  `flags[OPEN_DOOR] = PASSABLE | FLAMABLE`, so a door *is* combustible and the beam's
  `[GRASS, HIGH_GRASS, DOOR, DOOR_CLOSED]` list reproduces it - the port's own comment already
  said so. What the list still misses, if those kinds ever reach the live level, is
  `FURROWED_GRASS` (trampled high grass, which keeps the flag) and the `SewerLevel` case where
  `REGION_DECO`/`REGION_DECO_ALT` are force-marked flamable (`flags[REGION_DECO]` is `STATUE`'s,
  so it is the level, not the terrain, that makes those burn). Recorded here rather than fixed in place because the whole flammable model is a gap:
  the port still has no complete flamable map or heap-burn primitive, and `spreadFire()` retains
  those explicit gaps. This pass adds the first live slice: fire decays in place, and the
  representable grass/door cells burn out into a distinct passable `EMBERS` kind (with plants
  removed), rather than collapsing back to `floor`. `FURROWED_GRASS`, region decorations,
  occupant ignition is still handled only by the existing hero/monster fire pass, while ground
  scrolls/dewdrops are destroyed, bombs detonate, and plants wither while a fire cell is active.
  Meat-to-chargrilled conversion is now ported for the compact Mystery Meat heap: active fire
  replaces it with the authored `chargrilledMeat` identity, preserving the heap and ordinary-food
  eat path. Region decorations remain unported; ordinary fire now propagates orthogonally onto
  representable grass/door terrain with Java's volume-4 seed. The
  full scoping, both sides read, is
  `tools/scratch/mwg-proposal/GEOMETRY-AND-FIRE.md`, which also corrects two claims of mine in
  ROADMAP.md: `TerrainKind.flags`/`extras` and the `Scheduler` priority are **not** in the
  published 0.7.3 - both are in the unpublished 0.7.4 checkout.
## 2026-09-10 roadmap pass

- **Ported:** the Dwarf King's death now awards the identified, non-upgradable King's Crown;
  the Rat King consumes it when a real armor is worn and grants the Ratmogrify armor ability.
  Ratmogrify affects the nearest visible non-boss enemy for six turns and preserves its combat
  stats while routing it through ordinary melee/pathing. The port has no `TransmogRat` actor or
  cell-targeting window, so the original mob sprite remains and those two presentation/targeting
  details are documented reductions at the call sites in `main.ts`.

## Simulation extraction (steps 1-5)

Turn contracts and hunger live in `src/simulation/turns.ts` and
`src/simulation/hunger.ts`. `src/adapters/sceneSimulation.ts` now delegates the
bounded loop to MWG's generic `advanceToInput` rather than duplicating it.
Combat rolls and live stats now live in `src/simulation/combat.ts`, and buff application/
timing in `src/simulation/buffs.ts`. `combatState.ts` defines sprite-free data and
`random.ts` defines the injected random port. The adapters preserve current mwg draws
and mutable scene buff maps; `src/combat.ts` retains the existing public calls and UI hook.
Hero action policy is in `simulation/heroActions.ts`; `adapters/heroActions.ts` preserves
free actions, failed attempts, paralysis exceptions, and no double-spend on descent.
Unrecognized action names (including Object-prototype names) are rejected explicitly.
This extraction preserves the existing gameplay. Monster AI, attack orchestration,
on-hit effects, and HP application remain in the scene. `simulation/heroTurn.ts` now
orders end-of-turn effects through live callbacks. It preserves the existing simplified
timing: hunger/fire death does not stop the sequence, but fatal buff damage does.
Effect implementations and presentation remain scene-owned.
`simulation/movement.ts` selects wait, interaction, attack, door, roots, movement,
or wall through plain, lazy world queries. Grass, pickup, trap, and stair effects remain
in their existing scene order; this is a decision extraction, not a full movement simulation.
See `SIMULATION_ARCHITECTURE.md` for the boundary, retained limitations, and next steps.

Tracks which blocks of SPD's real Java source this port has actually translated into
`src/main.ts` (or `src/images.ts` for assets), block by block - a method, a field
initializer, a `switch` case - not line by line. "Ported" means the TypeScript reproduces
that block's real numbers/logic; "Simplified" means it reproduces the *shape* of the
mechanic with a stated, deliberate reduction; "Not ported" means SPD has this and this port
currently does not, at all.

Update this alongside `main.ts` - when a block moves from "Not ported" to "Ported", add its
row here in the same commit, the same way the file header comments are kept current.

The transmutation implementation also preserves an eligible ring's upgrade level when
rerolling its type; this was corrected after a focused audit found the level was being
dropped despite the behavior already being documented as preserved in the transmutation row.
The picker now also retains the exact selected transmutation-scroll instance across its
asynchronous UI callback, preventing a duplicate stack from consuming the wrong scroll.

The authored monster catalogue is now in `src/content/monsters.mwl` and compiled before the
game imports it. `monsters.ts` adapts those MWL values into the scene's typed combat records
with required-field validation; sprite film dimensions and idle frames are authored in the MWL
asset-reference tables while Pixi sheet cutting remains adapter logic. The catalogue includes the port's documented special-actor
values and balance reductions (for example invulnerable NPCs, Goo's base state, and Yog's
scaled encounter), so those values are no longer duplicated in TypeScript.

The weapon, armor, and wand catalogues now follow the same path in `src/content/items.mwl`.
Tiered variants use deterministic MWL item IDs, while portable numeric properties such as wand
damage and weapon speed are represented by MWL effects and read by `src/items/catalog.ts`
(renamed from `items.ts` in the `src/items/` split); formulas and runtime behavior remain in
the game hooks. **Corrected 2026-09-13:** `catalog.ts`'s `WEAPONS`/`ARMOR`/`WANDS`/`RINGS` had
zero consumers anywhere in `src/` until this pass wired `itemKinds.ts` and `generatedItems.ts`'s
weapon/armor tier-by-class lookups through it (removing three independent hand-typed copies of
the same 31 weapon + 5 armor tier assignments); `catalog.ts` itself is exercised by
`tools/verifyItemWorkflows.mjs` for the first time as of the same pass.
The same item family now has 47 MWL-authored localized description keys in
`item-rules.mwl`; the inventory inspection detail resolves them without moving combat or
upgrade behavior into content data.

**`src/content/artifacts.mwl`/`src/items/artifacts.ts`, corrected 2026-09-13 - six of ten
previously-authored "artifacts" were not real Shattered Pixel Dungeon content.** This row and
the "Artifact definitions" row below both used to describe all ten as legitimately ported/defined
SPD data. Checked directly, in order: (1) `artifacts.ts` (`ARTIFACTS`/`getArtifact`/
`getAllArtifactIds`) had zero consumers anywhere in `src/` - nothing called those records, despite
this row's prior claim that it "adapts the generated resource into its public typed records". (2)
The one artifact with a real, live charge mechanic disagreed outright with its authored data:
`artifact_cloak` authored `base_charge=40`/`max_charge=40`/`recharge_rate=10`, while
`DungeonScene`'s real Cloak of Shadows logic computes `maxCharge = min(level+3, 10)`. Fetching the
real `CloakOfShadows.java` (tag `v3.3.8`) confirmed the *port's* formula is the Java-accurate one
(`chargeCap = Math.min(level()+3, 10)`, verbatim) and the authored MWL numbers were invented, not
merely simplified - Java's actual regen is a dynamic `45 - (chargeCap - charge)` turns-to-charge
curve, not a flat rate at all. `TimekeepersHourglass.java` confirmed the same pattern
(`chargeCap = 5+level()`, a dynamic `90 - 3*(chargeCap-charge)` regen), against authored
`base_charge=100`/`max_charge=100`/`recharge_rate=40` - equally invented. (3) The real finding:
checked all ten authored `name` keys against the complete generated message catalogue (3753+ real
SPD keys, 19 languages) and the real `v3.3.8` `items/artifacts/` roster (13 classes:
AlchemistsToolkit, CapeOfThorns, ChaliceOfBlood, CloakOfShadows, DriedRose, EtherealChains,
HornOfPlenty, LloydsBeacon, MasterThievesArmband, SandalsOfNature, TalismanOfForesight,
TimekeepersHourglass, UnstableSpellbook). Six authored entries -
`ArmbandsOfHerculaneum`/`CapstoneOfExecution`/`DemonslayerArmor`/`PickaxeOfMining`/
`MysteriousLocket`/`SandalsOfTime` - match **no** real class and **zero** message keys; they were
fabricated, invented names given plausible-sounding SPD-style flavor and false charge stats, not
ported content. A seventh, `artifact_chronometer`, was a confused near-duplicate of the real
Timekeeper's Hourglass under a typo'd key (`timekeeperhourglass`, missing the required "s").
**Fixed**: `artifacts.mwl` now authors exactly three entries - the two with real, live TS
implementations (`cloak`, `hourglass`, both name/desc keys verified against the real catalogue)
plus `chalice` (real SPD content, correct `chaliceofblood` key, not yet implemented - kept as an
honest placeholder, not removed, since it is genuine). `ArtifactDef` dropped
`baseCharge`/`maxCharge`/`rechargeRate` entirely, since no real artifact's mechanic reduces to that
shape (each is its own bespoke formula - see above). **`ARTIFACTS` is now a real consumer**: wired
into `i18n/spdKeys.ts`'s `ITEM_KEYS` for `cloak`/`hourglass`, which fixed a live, separate bug in
the same area - `itemDisplayName`'s `ITEM_KEYS[id] ?? id` fallback meant an identified or
unidentified cloak/hourglass rendered as the bare id text ("cloak"/"hourglass") instead of a
translated name, since neither id had ever had an `ITEM_KEYS` entry at all. Browser-verified live
via `window.__MWG__.currentScene`: granting a `cloak` now displays "cape des ombres" (French for
Cloak of Shadows) and a `hourglass` displays "sablier de gardien du temps" (Timekeeper's
Hourglass), both matching the real generated catalogue exactly, identified or not.

**Chalice of Blood is now implemented (2026-09-14, `ChaliceOfBlood.java` tag `v3.3.8`), closing
the `chalice` placeholder above.** `useChalice` (`src/items/artifactActions.ts`) reproduces
`prick()`'s exact `NormalIntRange(ceil(3 + 2.5*level^2), floor(7 + 3.5*level^2))` self-damage
formula (authored in `item-rules.mwl`'s `itemEffectValues` table: `chaliceMinDmgBase`/
`chaliceMinDmgPerLevelSq`/`chaliceMaxDmgBase`/`chaliceMaxDmgPerLevelSq`/`chaliceLevelCap`),
routed through the shared `absorbHeroDamage` boundary (Tenacity/AntiMagic/Viscosity/RockArmor/
Barrier) the same way every other hero-inflicted-on-self source does (bomb blast, trap damage),
either killing the hero (`kill(hero, 'trap')`, the closest existing death-cause bucket - Java's
own `ondeath` line plays either way) or permanently upgrading the chalice up to `levelCap = 10`.
Cursed, already-capped, or `MagicImmune` (AntiMagic) chalices refuse the action, matching Java's
`actions()` gate. **Stated simplifications, not silent gaps:** real Java also subtracts the
hero's own `drRoll()` (armor) before calling `hero.damage()` - this port's `absorbHeroDamage`
boundary has no separate bare armor-only roll exposed to a bespoke item action (only
`applyBlastDamage`'s *monster* branch resolves armor, and that call site's own hero branch
already skips it too), so the self-hit here is not reduced by armor; real Java's `WndOptions`
confirmation naming the exact computed death chance has no equivalent window in this port
(matching every other "use item on self" action here) and pricks immediately; and the passive
`chaliceRegen` buff (`Item.charge()`, called from Java's natural-regeneration ticks) is
**Not ported at all** - this port has no natural out-of-combat HP regeneration system for a
passive artifact bonus to hook into, so Chalice is active-only here. Generation was fixed in the
same pass: `generatedInventoryItem`/`sourceInventoryItem` (`src/items/generatedItems.ts`,
`src/items/itemKinds.ts`) used to route every generated artifact other than the Hourglass to
`cloak` regardless of its real class - a live `ChaliceOfBlood` drop silently became a second Cloak
of Shadows - now checked for `chaliceofblood` before that fallback. `bonesItemForPickup` (Bones
remains) is also now symmetric across all three artifact ids (`cloak`/`hourglass`/`chalice`)
rather than only recognizing `cloak` by id, a related pre-existing hourglass gap fixed in passing.
Type-check/build and the item/simulation/mwg suites are green; browser verification is owed
per ROADMAP.md section 10 (not attempted this pass).

The potion and scroll generator decks now live in `src/content/decks.mwl`; `generator.ts` reads
their class order and default probabilities from the compiled MWL traits and validates matching
lengths before use. This preserves the Java RNG table data while leaving generator algorithms and
substream handling as executable code.

The runestone deck now follows the same model in `src/content/runestones.mwl`, including the
correct `StoneOfDetectMagic` entry and the zero-weight boundary entries from Java.

The five missile decks now live in `src/content/missiles.mwl`. `generator.ts` consumes their
class order and equal weights through the same validated MWL deck reader, preserving the
level-generation substream behavior.

The five weapon-tier generator decks now live in `src/content/weapon-decks.mwl`. This preserves
the corrected tier-3 probability table and keeps generator class ordering separate from the
runtime equipment catalogue.

The potion and scroll unidentified-appearance key tables now live in
`src/content/appearances.mwl`; `spdKeys.ts` validates and reads their ordered keys through the
compiled MWL traits. The existing seeded per-run assignment simplification remains unchanged.

The floor tier matrix, affix pool sizes/weights, and Ghost reward tables now live in
`src/content/generator-tables.mwl` and `src/content/generator-rules.mwl`; `generator.ts` validates
their numeric rows before using them for RNG. The Java-specific correction comments remain next
to the executable adapter logic.

The WAND, RING, ARTIFACT, and FOOD generator deck class lists and weights now live in
`src/content/generator-decks.mwl`; `generator.ts` reads them through the shared MWL deck adapter.

The generated potion, scroll, seed, runestone, food, and bomb item identities now live in
`src/content/consumables.mwl`; `spdKeys.ts` consumes their MWL names while retaining explicit
aliases for runtime-only quest items. `sourceInventoryItem` now normalizes both Java class names
and painter short ids (`PotionOfLevitation`/`potionOfLevitation`) to the same appearance-table id;
the lowercase painter form previously crashed on pickup. Their executable use effects remain in
the game hooks.

Active `WellWater` cells now have a scene-owned, FOV-gated pair of expanding ripple rings over
the well. This reproduces the Java water-surface animation's visible intent; the port simplifies
the underlying effect to deterministic vector rings rather than Java's shared ripple emitter.

`WndJournal` now exposes Guide, Notes, and Items tabs. Guide pages use the bundled adventurer
documentation, Notes retains regional lore and quest status, and Items lists potion/scroll/ring
classes with the current known/unknown state. The identification state is **Simplified** because
this port persists `identified` on carried instances rather than Java's run-wide item-class journal.

**2026-09-14 fix:** the Items tab's scroll list (`journalContent.ts`) was a hand-typed 11-entry
array missing `scrollTransmutation` - `Catalog.SCROLLS` (`journal/Catalog.java`) is seeded from
`Generator.Category.SCROLL.classes` (`items/Generator.java` 293-305), the real 12-scroll list
ending in `ScrollOfTransmutation.class`, which `consumable-aliases.mwl`'s `category: "scroll"`
rows already author in full. The list now reads `MWL_CONSUMABLE_CLASS_ALIASES` instead of
duplicating it, so Transmutation - and any future scroll added only to the MWL table - shows up
without a second edit site.

Ground items adopted from room painters now retain their authored cell only when it is a valid,
passable non-stair cell; if terrain reduction leaves a key or other queued item inside a wall, the
port relocates it through the normal valid-cell chooser instead of creating an unreachable pickup.

The SewerLevel trap class order and weights now live in `src/content/dungeon-rules.mwl`; the
SewerPainter adapter validates and reads the depth-specific MWL rule while retaining Java's
depth-1 special case and RNG order. Trap effects themselves remain a separate gameplay hook gap.

Monster loot entries now live in `src/content/loot-rules.mwl`; `monsters.ts` validates and adapts
the MWL table while retaining the executable roll and limited-drop decay hooks. Java-specific
multi-item and category-selection behavior remains documented as a port simplification.
The fifteen generated missile classes are catalogued in `src/content/missiles.mwl` with names,
tiers, stackability, and base damage ranges. `generatedInventoryItem()` now preserves their
concrete MWL id/source class/tier when generated loot crosses into the inventory boundary;
the three starting thrown classes now also carry their source class and per-level damage
increments in MWL, and `DungeonScene.useSpecial()` consumes that metadata instead of branching
on the hero class. The compact shared ammo counter remains a deliberate port simplification;
pickup integration and distinct missile behavior (boomerang return, bolas, etc.) remain open.
Their fifteen localized description keys are now authored alongside the missile catalogue and are
shown by the inventory inspection detail; executable special behavior remains in TypeScript.
The same resource now carries the ten limited-drop decay parameters; the linear and power-law
formulas remain explicit executable hooks so their Java semantics stay reviewable.

The five main scenario chapter ranges and boss depths are now authored in
`src/content/scenario-rules.mwl`; `mwlContent.ts` validates ordering and `monsters.ts` verifies
that every chapter points at the matching boss transition. Dialogue, objective progression,
and boss-fight scripting remain scene-owned runtime behavior.
The same resource now owns the exact quest/NPC spawn depth lists and roll bases for Ghost,
Wandmaker, Shopkeeper, Blacksmith, and Imp; `main.ts` consumes those tables instead of carrying
duplicate depth literals. Quest-specific dialogue and completion logic remain runtime hooks.
Quest stage condition keys and objective descriptions are also authored in the
`questDefinitions` MWL trait and consumed when building the runtime `QuestLog`; localized NPC
conversation strings remain in the existing i18n catalogue.

Hero progression's maximum level and experience-curve coefficients are authored in
`src/content/progression-rules.mwl`; `main.ts` retains only the formula adapter consumed by
MWG's `Progression` class.

Alchemy ingredient energy values and executable food plus `Bomb.EnhanceBomb` recipes are
authored in `src/content/alchemy.mwl`, with their named outputs in
`src/content/consumables.mwl`; `src/alchemy.ts` parses them and the alchemy-pot interaction
resolves them through MWG's all-or-nothing `craft()` transaction. The same MWL resource contains
a manifest of every recipe registered by SPD's `Recipe.java`, and import-time validation rejects
any recipe reference without an authored item identity. The alchemy-pot interaction is a recipe picker plus one ingredient picker per unit (2026-09-17), which covers Java's add controls - the scrap half is the Alchemize cast's energize picker; the
simultaneous multi-slot window with its recipe preview and cook button stays simplified. The carried energy pool is now
persisted, fed by EnergyCrystal pickups, and consumed by recipe costs. Seed-to-potion brewing,
scroll-to-stone, alchemize and both catalysts are executable with chosen or first-eligible units;
exotic/brew/elixir item families (no port items exist to brew them with) and the slot-window chrome remain open.

The `Alchemize` spell's **cast** is now ported (`useAlchemize`, dispatched from `useItemById`):
casting it opens the shared item picker over the bag and scraps one unit of the chosen consumable
into `Item.energyVal()`, identifying it as it goes and spending no turn - Java's `WndEnergizeItem`
/`energize()` shape. The yield is authored per *kind* in `alchemy.mwl` (seed 2, runestone 3,
scroll/potion/food 6), with `alchemyEnergyFor` reducing a concrete port id (`potionHealing`,
`seedMageroyal`...) to its kind and applying `Item.energyVal()`'s four `isKnown()` overrides
(`potionStrength`/`potionExperience`/`scrollUpgrade`/`scrollTransmutation` give 10 while
identified; the four known-item override values are authored in `alchemyKnownEnergy` rather
than a TypeScript set). Stated reductions: Java's window also offers a sell branch and an "energize all"
button, both folded into the single picker action, and the per-class values for outputs this port
cannot yet obtain (brews/elixirs 12, exotic potions +4/+6, `GooBlob`/`MetalShard` 3) are not
authored. **Its recipe is now executable through a category-aware transaction**: `Alchemize.Recipe`
takes *any* `Plant.Seed` plus *any* `Runestone`, so `craftAlchemize` selects one carried item from
each category and produces Java's eight-unit output. The generic exact-id transaction remains in
use for every other recipe; the multi-ingredient alchemy window is still simplified.
The runtime generic seed also gained its own MWL identity (`id=seed`, named through SPD's
unknown-seed placeholder), which it previously lacked - bag seeds rendered the raw id `seed`
because neither `ITEM_KEYS` map carried one. `shopPricing`'s `alchemize` value was corrected from
5 to `20/8 = 2.5` per unit (`Alchemize.value()`, `OUT_QUANTITY` 8); the old comment cited a
nonexistent `40 * quantity / 8`.

Monster actor classifications (flying, NPC, boss, immovable, and initially-awake) now live in
`src/content/actor-rules.mwl` and are adapted to runtime sets. Special actor abilities and AI
decision hooks remain executable TypeScript until their complete Java behavior is ported.
Variant-to-base actor inheritance aliases are also authored in that resource and consumed by
`monsters.ts`.

The monster special-turn profile assignments now live in `src/content/actor-rules.mwl`; the
scene resolves those MWL profile names to executable TypeScript hooks. The hook algorithms and
their documented Java simplifications remain in `main.ts`.
The same resource now contains a hook manifest; the MWL compiler validates profile references,
and scene initialization fails explicitly if a declared profile has no executable hook.

The class and subclass talent membership and ordering are authored in
`src/content/talent-rules.mwl` and adapted by `talents.ts`; rank limits remain adapter metadata
while the formulas stay in `talentEffects.ts` hooks.
The tier-unlock thresholds are also authored in that MWL resource.

Buff durations and the negative-buff classification are authored in
`src/content/buff-rules.mwl` and consumed by the simulation buff adapter; ticking, damage
formulas, and expiry semantics remain executable rules.

The five fixed boss-depth transitions and victory messages now live in
`src/content/scenario-rules.mwl`; scene victory/death execution remains in `main.ts`.

The standard monster rotation by depth and its regional fallback rosters now live in
`src/content/dungeon-rosters.mwl`; `monsters.ts` validates and adapts those lists.

The standard-room class weight rows now live in `src/content/room-rules.mwl`; `regularLevel.ts`
validates the 26-class rows and preserves Java's regional row inheritance by depth.
Hero class ammo categories, badge gates, and unlock hints are authored in
`src/content/classes.mwl` and adapted by `classes.ts`; the badge achievement catalogue itself
is now authored in `src/content/badges.mwl` and adapted by `badges.ts`, including counters,
targets, descriptions, and badge sprites. The Cleric unlock rule remains the explicitly
documented port-specific fallback because this checkout has no Java counterpart for it.
Regional standard/special room counts, maxima, and RNG weight arrays are also authored in that
resource and consumed by `regularLevel.ts`.
The standard room class order is also authored there and validated before room selection.

The special-room selection queues (equipment, consumable, crystal-key, and potion-spawn
categories) are authored in `src/content/room-rules.mwl` and adapted by the special-room
registry. Their queue mutation and RNG behavior remain executable TypeScript because those
are runtime algorithms rather than resource data.

The monster roster adapter no longer carries a duplicate TypeScript roster fallback: every
standard depth entry and regional fallback must be present in `src/content/dungeon-rosters.mwl`,
so an incomplete resource fails at startup instead of silently reverting to code data.

The ConnectionRoom depth-indexed class weights are authored in `src/content/room-rules.mwl` and
validated by `connectionRoom.ts`; its six-class registration order is authored in the same
resource and only adapted to the concrete room behavior.

The Prison, Caves, City, and Halls trap class/weight tables now live in
`src/content/dungeon-rules.mwl`; their painters use one validated MWL adapter. Trap effects
remain a separate gameplay-hook gap.

Monster resource entries now carry their logical sprite references (`image=assets/...`) in
`src/content/monsters.mwl`, and the generated `mwlAssets.json` includes the deduplicated set.
The MWL compiler now validates those manifest entries against `src/assets` during the build, so
missing referenced files fail fast instead of producing a partial resource catalogue.
The renderer still registers its Vite-imported textures directly, but `images.ts` now consumes
the generated MWL asset manifest through a bundler-facing URL registry and validates every
manifest entry before loading sprites. As of MWG 0.8.1, shared terrain/effect atlas identities
are authored in `src/content/asset-references.mwl` as generic object asset records and included
in that manifest. The item atlas is resolved from the generated `itemAssetSources` table during
sprite loading; class, terrain, UI, loading, title, and effect atlas paths are now also represented
by MWL manifest objects, while frame cutting remains renderer-owned.

The MWL build now rejects duplicate item, monster, and trait IDs and validates every monster
roster, boss-transition, and asset reference before emitting generated files. Deterministic
output comparison is also performed by compiling the resource tree twice; broad
generated-vs-Java parity fixtures remain open.

**2026-09-14:** closed a real missing-reference gap in that validation: `monsterLoot`'s `kind`
column was not checked against the closed `GroundItemKind` set at all. `monsters.ts`'s
`MWL_MOB_LOOT` reads it with a bare `String(row.kind) as GroundItemKind` cast, so a typo'd kind
would have compiled clean under both `tsc` and `npm run build` and only surfaced as a wrong or
missing dropped item at runtime - the same silent-failure shape the room-rule-table cross-check
above exists to close, and this one had no equivalent. `tools/compile-mwl.mjs` now has
`validateLootKindReferences()`, checked (build-time, in `node`, before `tsc`) against a list
mirroring `dungeonConstants.ts`'s `GROUND_ITEM_KINDS`; verified by feeding it a deliberately wrong
`kind` value, which threw and exited non-zero, then reverting. `npm run check` and
`npm run build` are clean on the real data.

**2026-09-14 (2):** added `validateConsumableAliasReferences()` alongside it, checking every
`consumableClassAliases.item` against the same authored `[item]` id set, so a typo'd or
renamed/removed item id in that table fails the build instead of surfacing as a wrong or missing
lookup at runtime. Verified the same way: a deliberately wrong `item` value threw and exited
non-zero, then reverted.

**2026-09-14 (3):** added `validateGroundKindAliasReferences()`, checking
`itemGroundKindAliases.groundKind` and `specialItemGroundKinds.groundKind` against the closed
`GroundItemKind` set - `src/items/itemKinds.ts`'s `groundKindForItem`/`portItemKind` both cast
these values with `as GroundItemKind` and no runtime check, so a typo would compile clean and
only surface as a live item rendering/behaving as the wrong ground-item family. Verified the
same way.

Weapon enchantments and armor glyphs now follow the same path. Their ids, triggers
(`strike`/`defend`/`passive`), roll weights, curse flags, and descriptions are authored in
`src/content/affix-rules.mwl`, and `itemAffixes.ts` adapts them into the `mwg/actors`
`AffixTable`s `generatedInventoryItem` already rolled through; `Unstable.randomEnchants`'
delegate list is authored beside them and cross-checked against the enchant catalogue. The
per-id proc bodies stay in `main.ts`, where they need live scene/combat state. Moving the tables
is behavior-preserving: `affix-rules.mwl` was verified value-identical to the inline arrays it
replaced (20 weapon entries, 21 armor entries, 10 delegates), and a live browser run that called
`generatedInventoryItem` 6000 times per table produced exactly the expected 13 good/7 cursed
weapon ids and 13 good/8 cursed glyph ids with none missing or spurious, while a plain
(non-cursed, non-enchanted) roll left `affix` undefined in all 200 samples. `tools/compile-mwl.mjs`'s
`validateAffixTables()` enforces the row shape, id uniqueness, and delegate membership at build
time, so a malformed affix row now fails `npm run build` rather than the first generated roll.
`npx tsc --noEmit`, `npm run build`, `test:simulation` 46/46, and `test:items` 1/1 all pass.

Status immunities (`Char.isImmune`) now follow the same path. The three class lists this port
models - Brimstone's fire immunity (`Brimstone.java`, `Burning`), AntiMagic's magical-status
immunity (`AntiMagic.java`'s `RESISTS`: charm/weakness/vulnerable/hex/degrade/magicalSleep), and
Frost's chill immunity (`Frost.java`, `Chill`) - are authored in
`src/content/resistance-rules.mwl`. `tools/compile-mwl.mjs` emits
`src/simulation/mwlStatusImmunities.ts` (the same pattern `mwlBuffDurations.ts` already uses, so
the framework-free simulation boundary is preserved) and validates every referenced id against
the buff-duration catalogue. `combat.ts`'s `addBuff` now uses membership sets instead of the
hardcoded `id === '...'` chains, so a newly ported immunity is a data change. This is
behavior-preserving and now covered by a dedicated `test:simulation` check (47/47): fire immunity
blocks only `burning`, magic immunity blocks exactly those six magical statuses and not `poison`,
and an active `frost` buff blocks only `chill`.

Monster display names moved into MWL too (2026-09-15): every `monsters.mwl` node now carries
its SPD message key as `name`, and `spdKeys.ts`'s 65-entry hand-typed `MOB_KEYS` is derived from
the roster instead of repeated beside it - the largest remaining hand key table is gone. That
migration caught two kinds with no key at all (larva, armoredStatue), which rendered as bare id
text in every language like cloaks/hourglasses once did; both now use real keys
(`yogdzewa$larva`, `armoredstatue`, verified in the catalogue - 528 mapped keys, up from 526).
`tools/compile-mwl.mjs` rejects a nameless monster node, and the item suite pins the roster size
plus those two keys. What stays hand-written in `spdKeys.ts` deliberately: the six small
closed-family tables (classes, regions, buffs, traps) and the derivation rules (missile/wand/
ring/artifact key shapes) - those map port conventions to key shapes, not content, and every
key they emit is still resolved-or-fail by `i18n:verify`. Message *bodies* stay where they are
by the same single-source rule: SPD prose lives in the generated catalogue, port prose in
`portStrings.ts` - duplicating either into `.mwl` files would create the second copy this
migration exists to remove.

Shop shelf stock is authored data too (2026-09-15): `scenario-rules.mwl`'s `shopShelfStock`
table names the simplified opening shelf (two unidentified potions, two identifies) that
`shopStockFor` used to hand-build, with a shape-only compile check (the generic `potion` runtime
id has no catalogue entry to validate against) and an item-suite pin. **Superseded the same day**:
`shopStockFor` (`src/scenes/dungeonScene.ts`) now builds each depth's shelf from `planShopStock`
(`src/items/shopStock.ts`), a real port of `ShopRoom.generateItems()` (`v3.3.8`) rather than the
simplified table above - the tier-matched weapon/missile pair, the depth's concrete armor, an
alchemize stack, the fixed healing potion/three scrolls, the two random potion draws plus two more
random potion-or-scroll draws, two rations, the bomb/doubleBomb/doubleBomb/honeypot roll, a stone
of augmentation, sandbags for a carried identified uncursed hourglass (Java's per-depth fraction of
its remaining capacity), and the rare wand/ring/artifact-or-stylus slot, all in Java's own order and
drawn off the real category decks and the real RNG (including the substream-isolated
`Random.pushGenerator(Random.Long())` shuffle at the end). `scenario-rules.mwl`'s table is now dead
data superseded by this generator, not a documented simplification in its own right; no Java entry
no Java entry is absent any more (the `ChooseBag` pick IS stocked now - see the next paragraph)
rather than substituted - the TippedDart stack, the three depth-20/21 Torches, the one-Ankh-per-shop, and the `ChooseBag` pick ARE all stocked now,
per `shopStock.ts`'s own header comment. Verified by `tools/verifyItemWorkflows.mjs`'s "the generated shop shelf" block
(fixed-entry presence, tier-matched armor per depth, the depth-20/21 torch trio at unit price 8,
the bomb/rare rolls, and the sandbag count formula), a live browser boot (Warrior run, depth 1, no console errors), and the live shop-depth visit below
the hourglass-in-hand shop visit is still owed.

The pick is `chooseShopBag` (`src/items/bags.ts`): the real argmax over the not-yet-dropped
bags (velvet base weight 1, the rest 0, plus one per holdable backpack entry), stocked in Java's
own position between the alchemize stack and the healing potion, with the flag drop at
shelf-generation time (the port's `ShopRoom.paint()` analogue) and the run's flags persisted with
the save. Java breaks scoring ties by JVM `HashMap` iteration order, which is not reproducible
even in principle, so ties go to the earlier bag id instead - the one stated simplification. The
four bags' `value()` bodies (30/40/40/60) price the shelf through the existing formula, their names
and detail bodies resolve through SPD's own `items.bags.*` catalogue keys, and all four are
excluded from infusion targets and resurrect keeps like Java's non-upgradable, unkeepable `Bag`.
Verified by the suite's bag block (pick/scoring/tie/exhaustion/`stone` disambiguation, shelf
position, values, shelf price) and live (`tools/scratch/bag-shop-livecheck.mjs`, 14/14: velvet
starts dropped, the depth-6 shelf stocks the scroll holder the starting kit's scrolls vote for, the
flag drops exactly once, the shelf note reads the real 400g price, the picker-to-detail-to-buy path
pays it and moves the holder into the bag, and an exhausted flag field stocks no bag) - the
hourglass-in-hand shop visit is still owed. **Not ported**: the container half - contents arrays,
`grabItems` on pickup, capacity enforcement, `AC_OPEN`/`WndQuickBag` - which has no expression in
this port's flat bag model (a bought bag is a named, priced, sellable item), and the three shop
bags' own `ItemSpriteSheet` frames, whose indices were not re-read this pass, so they render the
frame-0 fallback until they are.

Found and fixed auditing the scenario bullet the same pass: Yog's arrival line was a raw English
`say()` literal, showing English on all 19 locales like the boss-victory lines once did. It is
now `port.log.yogarrives` in all 19 catalogues (English/French human-written, the rest first-
draft MT per this file's translation convention), and `i18n:verify` confirms all 19 carry it
(454 port strings, up from 453).

Fire-model remainder audit (2026-09-15): the §0 bullet's "remaining work" sentence was stale
on three of its four items. Sewer decoration is live (`burnFireTerrain`/`destroyBombTerrain`
turn REGION_DECO into WATER and REGION_DECO_ALT into EMPTY_SP on Sewers depths, with the
ordinary EMBERS result elsewhere). Heap burning matches `Heap.burn()` for every kind this
port represents (scrolls/dewdrops removed, bombs detonated, Mystery Meat chargrilled - Java
burns nothing else; potions shatter only on freeze/explosion, which have their own paths, and
stacked heaps/unique scrolls/containers are the one-payload item-model boundary recorded
elsewhere). Occupant ignition is live (standing in fire re-arms burning on hero and monsters
through the shared gate, which is also where FIERY/piranha immunities bite). What genuinely
remains is webs: Java's `Web` is a flammable Blob the Spinner seeds, while this port roots
directly (documented at the spinner ability site) - there is no web terrain for fire to burn
yet. Creating webs belongs to section 5's monster-ability work, with the fire side already
waiting (the `actors.blobs.web.*` descriptions sit translated in the catalogue, and Spinner's
Web immunity is authored in `monsterStatusImmunities` against the day the status exists).

Per-monster status immunities (`Char.isImmune()`'s mob half) follow the same authored-data path
(2026-09-15): `resistance-rules.mwl`'s `monsterStatusImmunities` table names the port buff ids
Java refuses per kind - the INORGANIC set (bleeding/poison for dm100/dm200/dm201/dm300/golem/
skeleton/necroSkeleton/statue/armoredStatue/pylon, with dm201/necroSkeleton/armoredStatue
inheriting through their `extends` chain), the STATIC set (terror/amok/charm/paralysis for
demonSpawner/rotHeart/pylon/yog), the ACIDIC set (ooze for goo/acidic/causticSlime/rottingFist),
burning for the burning fist, frost for the bright fist, the INORGANIC pair for the rusted fist,
charm for the succubus, roots/terror for Tengu, burning for piranhas - 23 rows, every one
checked against `Char.java`'s property sets and each mob file at tag `v3.3.8`, variants included.
`tools/compile-mwl.mjs` emits `simulation/mwlMonsterImmunities.ts` and validates monster ids,
the closed fist-subtype list, composite row uniqueness, and buff ids; `simulation/buffs.ts`'s
`monsterBuffImmune()` is the pure gate (pinned with 13 verdicts in `test:items`, including the
subtype split and the deliberate non-gates: DM300 takes terror like Java, since its Terror/Charm
entries are damage `resist()`s, not immunities). `combat.ts`'s `buffBlocked` consults it, so the
~60 existing `addBuff` call sites obey per-kind refusals with no touch; the three direct-write
bypasses (poison-dart trap, Sorrowmoss, challenge rockfall paralysis) now route through the same
gate with identical durations. ToxicGas-blob immunity for the same INORGANIC set (+ rusted fist)
rides the existing `isToxicImmune` predicate, and confusion-gas daze refuses IMMOVABLE kinds
(Java's Vertigo immunity - every other daze source still lands, since those are not Vertigo;
the flag itself gained its three missing Java members, demonSpawner/yog/blacksmith). Recompiling
also repaired a real drift the check caught: the committed `mwlBuffDurations.ts` was missing
`featherFall`, which the MWL has carried all along. Deliberately not modeled here (section 7's
damage model owns them, with the data above as its input): the 50% damage-source resistances
(FIERY/ELECTRIC/ICY/ACIDIC/Corrosion/Grim/Disintegration), Web immunity (no web status exists
yet), Sleep immunity (no Sleep buff exists - the drowsy path correctly still lands), and the
boss Grim-trap/retribution resistances.

**Browser-verified 2026-09-11 (first real start-up smoke of the MWL migration):** the resource
tree compiled and type-checked cleanly but did not actually run. Importing the level generator
threw on two malformed `room-rules.mwl` rows, which a real browser load surfaced immediately as
a black screen - exactly the "type-checking is not evidence" case section 10 of `ROADMAP.md`
warns about, and the reason this pass did not treat the green build as sufficient. Both bugs are
fixed and re-verified live: the five `regionRoomCounts` rows were missing their `specialBase`
field entirely (six fields where the runtime parser in `spdLevelGen/regularLevel.ts` reads
seven; Caves/City/Halls also need `2`, which the missing field had hidden), and the depth-5
`standardRoomChances` row carried 27 values where Java's `StandardRoom.Chances[5]` has 26.
`tools/compile-mwl.mjs`'s new `validateRoomRuleTables()` now enforces both shapes at build time
(seven fields per region row with non-empty, non-negative weight lists; one chance entry per
class, cross-checked against each table's own `classes` list), so this class of data/parser
mismatch fails `npm run build` instead of first floor generation. JavaScript build/test coverage
is unchanged and still green (`npx tsc --noEmit`, `npm run build`, `test:simulation` 46/46,
`test:items` 1/1); browser run: the built `dist/index.html` loads with no console or page
errors, Enter reaches class select, a pointer click selects a class, Enter starts depth 1
(a 27x46 level with 9 creatures and 12 ground items), and turns process. The rendering itself
is the real dark FOV-limited floor, not a failed load - only the starting room is lit.

The Troll Blacksmith now retains quest favor and reforge count across saves. Its forge
selects two identified, non-cursed, same-category weapon/armor payloads, keeps the higher
level item, upgrades it once, consumes the other, and charges Java's progressive reforge
cost. **The service menu is now a real `WndBlacksmith` window (2026-09-12)**: talking to him
with any favor opens a titled `Window` on the scene's `WindowStack` (`showChoiceWindow`),
listing each service as Java does - `<b>Label (cost favor):</b> description`, greyed out when
the favor does not cover it - using SPD's own v3.3.8 label text and translations in all 19
locales. **Harden is ported with it** (`500 + 1000*hardens` favor): it sets
`Weapon.enchantHardened`/`Armor.glyphHardened` on an identified, uncursed, upgradable item
the player picks - the equipped weapon or armor included, since Java's selector walks the
whole belongings and the hardening only ever matters on the item a scroll later upgrades -
and from then on `upgrade()`'s affix-loss roll is replaced by a *hardening*-loss one
(`level() >= 6 && Random.Float(10) < 2^(level-6)`), so the enchant is protected until the
protection wears off. The state lives in the scene flags for equipped gear and in the bag
payload otherwise, carries through `transferEnhancement`/equip/unequip/save, and shows in the
item's own name (Java's `item.info()` line). Verified live
(`tools/scratch/blacksmith-harden-livecheck.mjs`, 10 assertions): the window opens with both
services enabled at 2000 favor, Harden opens the picker and clicking it through the real
pointer path hardens the equipped weapon and charges 500, a hardened item below +6 never
loses its enchant in 200 rolls, and at +6 the hardening itself breaks at Java's 10%.
**Correction found while implementing it: this file's own earlier claim that hardening is
granted by `StoneOfEnchantment` was wrong** - it is this Blacksmith service. **The paid `upgrade` (`1000 + 1000*upgrades`, an identified, uncursed, upgradable item
below +2) and `cash out` (the whole favor as gold, 1 for 1, behind Java's own
`cashout_verify` confirm) are ported too**, so the first four of Java's six services were live
before the pickaxe entry was added. The upgrade runs the same affix-loss/hardening rolls a scroll does - including
for an item still in the bag, which needs its own helper because the equipped slots keep
that state in scene fields rather than in the payload.

**`smith` is now ported too (2026-09-13), the fifth of six services.**
`Blacksmith.Quest.generateRewards(useDecks)` (`Blacksmith.java` 370-407) rolls four tier-3
rewards - two weapons of *different* classes, one missile, one armor - sharing one upgrade-level
roll (30/45/20/5% for +0/+1/+2/+3) and one enchant/glyph keep-roll, all burned in Java's own
order even though the port's `GenItem` only needs whether the enchant was kept, not its concrete
type. This port generates the set lazily on first open rather than pre-generating it when the
quest spawns - Java's own fallback branch (`WndSmith`'s `generateRewards(false)`), so the deck
bookkeeping (`useDecks = true` normally) is a stated simplification, not a silent drop. A flat
2000 favor buys whichever of the four the player picks (`takeBlacksmithSmith`); the other three
are discarded and the set is regenerated next time, matching `WndSmith.onSelect`. Verified live
end-to-end (`tools/scratch/blacksmith-harden-livecheck.mjs`, 22/22 assertions, screenshot-checked):
the five-service window rendered with all five labels and costs before the pickaxe entry was
added; the four rewards render as distinct correctly-named items, picking one charges the flat cost, adds the item, and clears the
cached set, and cash-out (retested in the same pass) still trades the whole favor for gold 1-for-1.

**This verification pass surfaced two real, pre-existing bugs, neither introduced by `smith`
itself, both fixed here rather than left for later:**
1. `ITEM_KEYS` never merged in a display name for any of the fifteen `missile_*` generated-missile
   identities. `MwlMissileDefinition` (`src/mwlContent.ts`) carries only combat metadata (`id`,
   `sourceClass`, `tier`, `minDamage`, `maxDamage`) with no `.name` field, unlike the consumable
   catalogue's `[item]` nodes that `MWL_CONSUMABLE_ITEMS` spreads into `ITEM_KEYS` today - the
   fifteen missile identities from `src/content/missiles.mwl` were simply never spread in anywhere.
   Nothing had rendered one of these ids through `itemDisplayName` in a live UI path before the
   smith's own missile reward did, so the gap went unnoticed: the reward showed the bare id
   (`missile_kunai`) instead of a name. Fixed in `src/i18n/spdKeys.ts` by deriving
   `items.weapon.missiles.<sourceClass.toLowerCase()>.name` for all fifteen directly from
   `MWL_MISSILE_DEFINITIONS` - the same Java `Messages.get` bundle-key convention every other
   lookup table in that file already follows - rather than hand-listing fifteen entries that could
   drift from the authored catalogue. Verified against `spdMessages.ts`: all fifteen derived keys
   exist (`bolas`, `fishingspear`, `forcecube`, `heavyboomerang`, `javelin`, `kunai`, `shuriken`,
   `throwingclub`, `throwinghammer`, `throwingknife`, `throwingspear`, `throwingspike`,
   `throwingstone`, `tomahawk`, `trident`).
2. `confirmBlacksmithCashOut`'s payout log line hardcoded the wrong, non-existent key
   `items.gold.gold.name` (the real key, `ITEM_KEYS.gold`, is `items.gold.name`) instead of calling
   `itemDisplayName` like every other pickup log site in the file - so cashing out always logged
   the raw key text ("Vous ramassez : items.gold.gold.name.") instead of "Gold". The numeric
   favor/gold state was correct, which is why the automated assertions never caught it; only
   looking at the log line in a screenshot did. Fixed to call the shared
   `itemDisplayName('gold', true)` helper.

The sixth service is now ported too: Java's retained quest pickaxe is persisted as a scene
flag, is free when the completed quest had at least 2500 favor, otherwise costs 250 favor,
and is consumed when bought back as an identified `pickaxe`.

**Turn-in bookkeeping is now Java's (`Blacksmith.java` 450-477, 2026-09-14):**
`blacksmithTurnInFavor()` (`src/items/blacksmith.ts`, headlessly pinned in
`tools/verifyItemWorkflows.mjs`: 15 ore for 750, 40 ore capped at 2000, +1000 with the boss
flag) caps the DarkGold half at 2000 and adds the quest-branch-boss bonus on a persisted
`blacksmithBossBeaten` flag - never true yet, since none of Java's three setter mobs
(`CrystalSpire`, `FungalCore`, `GnollGeomancer`) is ported, and the field exists so the rule
already reads correctly when they land. The legacy bat-blood alternative grants no favor and
earns the free buy-back: old Java's flat `questScores[2] = 3000` observable half, recorded
directly on the free flag because this port tracks no quest-score table (unported
endgame/Rankings work, not a forge gap). The service-window gate is Java's
`rewardsAvailable()` - favor, or a free retained pickaxe - so a run cashed out to 0 with only
a paid buy-back left hears the done line instead of an empty menu. Verified live
(`tools/scratch/blacksmith-harden-livecheck.mjs`, 22/22 assertions: the cap at 50 ore, the
bonus at 15 ore, the favorless-but-free alternative opening the window, the 0-favor buy-back
returning the pickaxe, and the shut gate after cash-out, alongside every earlier service).

**The reforge seal/missile transfer pair is now ported, not just documented**
(`WndBlacksmith.java` 277-285, comment at `openBlacksmithReforge`, both closed 2026-09-16
with the missile-stack reversal below). Java floor-drops a consumed armor's seal as a
`BrokenSeal` item - the reforge spawns it at the hero's feet and `useBrokenSeal` affixes
it onto equipped armor - and retires a consumed missile set in `UpgradedSetTracker`
(`levelThresholds.put(setID, MAX_VALUE)`) via `reforgeDiscardedMissileSet`, which is why
carried stacks needed a set id of their own. Opening the picker to missiles without that
plumbing would have silently dropped the retirement half; with it live, the retirement
half is kept. The only remaining exclusion of that shape is the wand (see below), a
deliberate silent-no-op refusal, not a gap in the rule.

**Correction and partial close, 2026-09-16 - the *selector* half was not a model gap, and was
just too narrow.** Java's three service selectors all open with `isUpgradable() && isIdentified()
&& !cursed` (plus `level() < 2` for the upgrade service and a Weapon/Armor test for harden), with
no type test at all - whereas this port's pickers filtered on a three-id hand-list
(`isBlacksmithGear`). The **Upgrade** service now uses Java's own predicate through the
`isUpgradableItem` this port already had for the infusion pickers, so it offers rings (whose level
is genuinely per-item here, `ringBonusLevel`) and drops the hand-list's ceiling. One class stays
excluded on top of Java's predicate (2026-09-16 correction: carried missile stacks are offered now that they carry their own level - only the wand remains), and it *is* a model gap, a real Java target whose
upgrade would otherwise be a silent no-op: a **wand** (this port's wands share one bag id
and take their power from `weaponLevel` - see
`useWardingWand`'s own `degradedLevel(this.weaponLevel)` - so a level written onto a wand item is
read by nothing). Asserted both ways in `tools/verifyItemWorkflows.mjs` and browser-verified live
end to end (`tools/scratch/blacksmith-upgrade-livecheck.mjs`, 6/6: the real picker offers the
equipped pair plus the carried ring, offers neither the wand nor the runestone (missiles joined the offered set after that livecheck ran; the harness asserts the current set),
and buying the ring's upgrade moves its own level 0 -> 1 for its real 1000 favor).
**The reforge is now Java's own rule (2026-09-16).** Java's `WndReforge.itemSelectable` is the
*same* predicate as its upgrade window's (`isIdentified() && !cursed && isUpgradable()`, no level
cap), and its `onSelect` requires two picks of one class that are not the same entry. This row used
to pair by bag id, which is not a class test at all - every generated weapon is the id
`weaponReward` - so a handaxe could be reforged with a shortsword. Pairing is now
`blacksmithItemClass` = `sourceClass ?? id` (the payload class every generated entry carries, or the
id where it already names its class), the selector offers rings too, and the second picker is
restricted to the first pick's class - this port's equivalent of Java's disabled Reforge button,
since its pickers have no disabled state. The reward line is this port's own (Java's reforge only
closes the window) and used to report the *scene's* weapon/armor counters, announcing the armor's
level for a reforged ring; it now names the item that was reforged and is translated in all 19
locales. Browser-verified live (`tools/scratch/blacksmith-reforge-livecheck.mjs`, 7/7).
**Closed 2026-09-16, documented 2026-09-17**: the consumed-missile set retirement above, and the missile half of
the reforge generally - the picker offers missile stacks outright (a ThrowingKnife stack is among the harness's asserted candidates), the only remaining exclusion
being the wand, whose level is read by nothing (see the
`MissileWeapon` row and the dedicated roadmap item).
Harden keeps the weapon/armor list, which is what its own Java predicate asks for, with no missile caveat at all (Java's harden predicate is Weapon/Armor-only).


Two corrections to earlier revisions of this file: this checkout's `DM100.java` has no
self-destruct blast (its kit is melee plus a lightning zap; the blast belongs to
`DM200`/`DM201`/bomb territory), and its `Guard.java` has no peaceful-until-provoked state
or lethal first blow (it pulls with chains). The old rows claiming those mechanics have
been replaced with what the Java actually contains.

## Core combat (`actors/Char.java`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `hit()`: `Random.Float(acuStat) >= Random.Float(defStat)` | `rollHit` | Ported |
| `hit()`'s attacker/defender roll multipliers (`Bless` x1.25, `Hex` x0.8, `Daze` x0.5, magic `accMulti` 2 for zaps) | `accRollMulti`, `rollHit`'s `magic` flag | Ported |
| `attack()`'s damage line: `damageRoll() - drRoll()`, floored at 0 | `rollDamage` | Ported |
| `Buff.durations` (`src/content/buff-rules.mwl`, authored data): `Burning` 8, `Cripple` 10, `Paralysis` 10, `Roots` 5, `Daze` 5, `Ooze` 20, `Levitation` 20, `Invisibility` 20, `Chill` 10 at tag `v3.3.8` | `BUFF_DURATION` / `mwlBuffDurations.ts` | **Resolved 2026-09-12 by auditing every application site of the four "short" values against `v3.3.8`, rather than by re-balancing them: Java has no single duration per buff to match, so the table could not have been a transcription of one.** Every site that applies a buff names its own number. `Burning.DURATION = 8f` is the default only because `reignite(ch)` passes it - 17 of its 22 sites use 8, but three deliberately use `4f` (`Elemental.FireElemental.rangedProc`, `AntiEntropy.proc`, `MagicalFireRoom.EternalFire.evolve`) and `MnemonicPrayer` adds 2-5 turns to an existing burn. `Cripple` (24 sites) uses its own `DURATION` (10f) or 10f at 7 of them - `SpiritHawk` 2f/5f, `HallowedGround` 1f, `CrystalSpire` 30f, `Guard.pullEnemy` 4f, `RotLasher` 2f, `YogFist.RustedFist` 4f, `WandOfFireblast` 4f (2 charges), `FlashingTrap` 20f, `MasterThievesArmband` `3 + level()/2`, `WandOfCorruption` `6 + 3 x level`. `Paralysis` (25 sites) uses `DURATION` at 5 - `StoneOfShock` 1f, `StenchGas` `DURATION/5` (2f), `Electricity` its blob's current volume, `WallOfLight` the victim's own `cooldown()`, `DM300`/`GnollGeomancer`/`GnollRockfallTrap` 3f (5f on the bosses challenge), `Radiance` 3f, `Sunray` 2/4/6f by talent. `Roots` (11 sites) uses `DURATION` at 2 - `Regrowth` one tick, `WandOfRegrowth` `4 x charges` (the port already computes this one directly), `SoiledFist` 3f, `HallowedGround` 2f, `ElementalStrike` `round(6 x powerMulti)`, `MysteryMeat`/`SnapFreeze` 10f. Thus the port's `cripple` 4 is `WandOfFireblast`/`RustedFist`'s real 4f, `paralysis` 3 is `DM300`'s real 3f and `roots` 3 is `SoiledFist`'s real 3f - each matches a genuine Java site, just not the class default. **`burning` 3 was the one value that matched no Java site at all** (Java's two are 8 and 4), and its mismatch was not only the number: this port's fire granted the buff once and never refreshed it, where Java's `Fire.burn()` runs for every burning cell every turn and does `Buff.affect(ch, Burning.class).reignite(ch)`. **Both halves are now fixed**: the table carries Java's 8, the per-site override exists (`addBuff`/`reigniteBuff` take a duration), `spreadFire` reignites every creature standing in fire instead of only granting once, the eternal wall fire passes Java's own `4f`, and Burning's damage roll is now `NormalIntRange(1, 3 + scalingDepth/4)` rather than a fixed 1-2. Verified live (`tools/scratch/fire-model-livecheck.mjs`, 6 assertions: igniting arms 8, a second turn in the flames keeps 8, a hand-set 2 is raised back to 8 by `reignite`'s prolong semantics, leaving the fire counts down 8 -> 7 -> 6 with damage each turn, and the eternal wall fire arms 4). `poison` (6) and `bleeding` (0) have no Java `DURATION` constant at all (their sources call `set(duration, damage)`), so those two remain this port's own convention as before. `affect` vs `prolong` is now expressible but not retrofitted everywhere: Java's `Buff.affect(t, c, d)` *adds* to an active buff's clock while `Buff.prolong` only extends it if it would end later, and only the fire path uses the prolong half so far (`reigniteBuff`); every other site still calls `addBuff`, which sets the duration. |
| `Char.damage()`'s own semantics: resists, champion factors, `AntiMagic`, shields - but **no** DR subtraction (`drRoll()` appears only in `attack()`, `Char.java` 386, and `damage()`'s own note reads "if dmg is from a character we already reduced it in Char.attack") | `zapHero`, `tickFallingRocks`, `fireYogDeathGaze`, the pylon shock in `takeMonsterTurn`, `useTransfusionWand` | **Fixed 2026-09-12: five paths were subtracting armor Java never subtracts.** Every mob ability that calls `ch.damage(...)` directly ignores DR in Java - `DM100.zap()` (`new LightningBolt()`), `Shaman.zap()` (`new EarthenBolt()`), `Warlock.zap()` (`new DarkBolt()`), the Necromancer's blocked-summon hit (`new SummoningBlockDamage()`), `Pylon.act()` (`new Electricity()`), `DM300.FallingRockBuff.affectChar()`, `YogDzewa`'s beam (`new Eye.DeathGaze()`) and `WandOfTransfusion`'s undead branch. This port subtracted a `drRoll` equivalent in all of them, so a Warlock's 12-18 DarkBolt landed for 2-8 against 10 armor, DM-300's rockfalls and Yog's beam were blunted by the same amount, a pylon's shock was reduced, and transfused undead took less than Java's roll. Two explicit exceptions, untouched because Java *does* subtract there: `Bomb.explode` (`Bomb.java` 197 subtracts `ch.drRoll()` itself before calling `damage()`) and the hero's own thrown-missile path, which goes through `attack()`. Browser-verified live via damage ceilings: a prismatic-light bolt against an armor-free rat never exceeded the plain 1-5 roll, and the transfusion wand's harm branch now lands its full 3-6 (it is a direct `ch.damage` too). |
| `attack()`'s damage multipliers (`Berserk` scaling, `Fury` x1.5, `Weakness` x0.67, `Vulnerable`-taken x1.33) | `rollDamage` | Ported, with one simplification: `Berserk.power` is the missing-HP fraction (no rage gain/decay clock) |
| `ChampionEnemy` (full type list with per-type procs) | `Creature.champion`/`championPower`, `rollHit`/`rollDamage`/`accRollMulti`, `takeMonsterTurn` | Fetched `ChampionEnemy.java` from the local shattered-pixel-dungeon checkout to confirm every type's exact factor - found and fixed a real bug plus added 2 more types. **Blessed's `evasionAndAccuracyFactor()` was wrong outright**: real Java is x4, this port had x3 - an unconfirmed guess, now corrected in `accRollMulti`. **Blazing**: +25% dmg (`meleeDamageFactor() = 1.25`) and ignites its target on hit (`onAttackProc`), unchanged and correct; its `detach()` seeding fire around itself on death is still not ported (no camera/fire-blob wiring at that call site). **Giant and AntiMagic were entirely missing; Giant is now ported, AntiMagic is not**: `Giant.damageTakenFactor() = 0.2` is now a flat multiplier in `rollDamage`, applied on the defender side after armor reduction - browser-verified with a 30-swing sampling comparison giving a 0.199x ratio against baseline, matching 0.2x within noise. `Giant.canAttackWithExtraReach()` (a 2-cell melee reach via pathfinding, also making the mob physically large per `Char.properties()`) is not modeled - this port's attack range is fixed at 1 regardless of champion type. **Growing is now ported**: its own rising `multiplier` (starts 1.19, `+0.01`/turn via a real separate `4*TICK`-cost actor slot in Java) is now `Creature.championPower`, incremented once per `takeMonsterTurn` call instead of on a second scheduled actor (this port has no secondary-actor scheduling to give it its own slot), and read by `meleeDamageFactor()`/`damageTakenFactor()` (its own inverse, `1/multiplier`)/`evasionAndAccuracyFactor()` (same as offense) in `rollDamage`/`accRollMulti`. Persisted through floor save/load (`championPower` added to `SavedCreature`). Browser-verified: a `championPower` starting at 1.19 became exactly 1.20 after one `takeMonsterTurn` call, and a 40-swing sampling comparison at `championPower=1.19` gave a 0.814x damage-taken ratio against baseline (expected `1/1.19 = 0.840`, within noise). **AntiMagic and Projecting are now ported too, completing all 6 real types.** Re-reading `Char.damage()` (not just the buff class itself) showed the earlier "magic-vs-physical distinction" premise above was wrong: `damageTakenFactor()` is applied to every damage source alike (the loop sits right after the generic `resist()` call, before the separate, still-unported `AntiMagic.RESISTS` status-immunity check) - so `AntiMagic.damageTakenFactor() = 0.5` is just another flat multiplier, the same shape as Giant's 0.2, and needed no new system. Wired into `rollDamage` alongside Giant/Growing (fixing a wrong first-draft guess of 0.75x found while re-deriving the real value from source). **Projecting**: `meleeDamageFactor() = 1.25`, same shape as Blazing, now applied in `rollDamage`; its `canAttackWithExtraReach()` (a 2-4-cell melee reach via pathfinding) is not modeled, same pre-existing gap as Giant's own reach. The champion roll itself is still a flat 10% (real Java's `rollForChampion` instead scales a roster-wide budget by depth via `Dungeon.mobsToChampion`, not modeled), but the *type* pick is now a true 1-in-6 (`Random.element` over all 6 ids) matching Java's own `Random.Int(6)`, rather than the previous 1-in-4-of-the-ported-subset. **Found and fixed a real, separate bug this pass**: real `rollForChampion` only ever assigns anything at all when `Dungeon.isChallenged(Challenges.CHAMPION_ENEMIES)` is true - champions are an opt-in challenge in real Java, never a baseline mechanic - but this port's flat 10% roll had no such gate, so its own selectable "Champion Enemies" challenge toggle (already wired, e.g. for `stronger_bosses`) did nothing either way: champions spawned identically whether the challenge was on or off. Now gated on `isChallengeEnabled('champion_enemies')`, so toggling it actually changes something. **The by-depth exclusions are now ported too**: real Java also blocks Crab/Thief/Guard/Bat from ever becoming champions below depths 3/4/7/9 respectively (`instanceof` checks, so `GreatCrab`/`Bandit` inherit their base kind's exclusion) - reproduced with the same `kind`/`baseKind` checks this port already uses elsewhere, `this.depth` substituting for `scalingDepth()` as usual. The flat-10%-vs-real-depth-scaled-budget approximation itself remains unmodeled. `AntiMagic.RESISTS` (blocking certain status effects from certain sources) remains unmodeled - this port has no damage-source-class distinction for status immunity, only for the flat-multiplier factor above. No visual treatment (aura/tint) exists for any champion type in this port, ported or not - a pre-existing gap, not newly introduced. **Which spawns may roll a champion was wrong until 2026-09-12.** Java calls `ChampionEnemy.rollForChampion` from exactly one place, `Level.createMob()` (`Level.java` 514) - the path that draws from the floor's mob rotation (`mobsToSpawn`, `MobSpawner.getMobRotation`) - and `rollForChampion` therefore needs no NPC/boss test of its own: every other mob in Java is built by direct construction (a quest miniboss, a mimic, a pylon, a summon, a swarm split, a bag ally) and is never championed. This port instead gated the roll on a hand-written kind list, so `fetidRat`/`greatCrab`/`gnollTrickster` (the Ghost-quest minibosses), `pylon`, `mimic`/`crystalMimic`, `larva`, `ripperDemon`, `bee`, `piranha` and even summoned allies could roll one - only the real by-depth Crab/Thief/Guard/Bat blocks held. The roll now keys on a `championEligible` argument that is true at exactly one call site, the rotated-roster spawn in `populate()` (this port's `createMob()` analogue), which `verifyCombat` pins to a single site and a live probe confirms (300 eligible rat/snake spawns rolled 25/28 champions; 300 each of fetidRat/mimic/pylon/larva and an allied rat rolled zero). **Correction, 2026-09-14: two sentences in this row had gone stale.** "Giant/Projecting's `canAttackWithExtraReach()` ... is not modeled" no longer describes the code - `takeMonsterTurn`'s extra-reach branch (citing tag `4.0.0-beta`, where Projecting's own reach changed from an unlimited-FOV special case to a flat range of 4) already ports both, and the dedicated row below this one (`ChampionEnemy.Giant/Projecting.canAttackWithExtraReach()`) already said so correctly - only this row's older wording was never updated to match. Separately, `AntiMagic.RESISTS` was only ever partially unmodeled: six of its ~25 entries are buff classes (`Charm`/`Weakness`/`Vulnerable`/`Hex`/`Degrade`/`MagicalSleep`), and `combat.ts`'s `buffBlocked()` already gated all six behind a generic `c.magicImmune` check - it was simply never set on anything but the hero's own AntiMagic-glyph flag. `spawnMonster` now also sets `magicImmune: true` for an `antimagic` champion (carried through the swarm-split clone path too), so those six buffs correctly fail to attach to one. **`WandOfFireblast` - one of RESISTS' ~19 non-buff entries - is now also wired (same pass)**:
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
base-blast loop runs before the per-payload one) complete the set. **Genuinely not applicable, not
merely unguarded** - no code exists to add a guard to: `ScrollOfPsionicBlast` (unported exotic
scroll), `CursedWand` (no cursed-wand-backfire mechanic in this port), `ElementalBlast`/
`ElementalStrike`/`WarpBeacon` (unported Mage/Duelist hero abilities), `DisintegrationTrap` (this
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
| `Dungeon.LimitedDrops` decay on top of `MOB_LOOT`'s flat chance | `src/monsters.ts`'s `LIMITED_DROP_DECAY`, `SewersScene.limitedDrops` (persisted with the run, not the floor - matches `Dungeon.LimitedDrops` being a run-lifetime static, reset only on a new game), the `kill()` loot-roll loop | Fetched `Bat.java`/`Necromancer.java`/`Guard.java`/`Slime.java`/`Skeleton.java`/`Thief.java`/`Swarm.java`/`DM200.java`/`Golem.java`/`Shaman.java`/`Warlock.java` to confirm every kind's real `lootChance()` override. **Bat/Necromancer/Guard are now ported**: each already had the right base chance in `MOB_LOOT` (`1/6` potion, `0.2` potion, `0.2` armor respectively), just missing Java's own further per-drop decay - `(7-n)/7`, `(6-n)/6`, `(1/3)^n` - where `n` is how many times *that exact drop* has already happened this run. Browser-verified live: killing 400 fresh bats produced exactly 7 drops before the counter hit 7 and the chance floor to `(7-7)/7 = 0` (matching Java's own hard cutoff, since that formula is linear and reaches exactly zero); the same test on necromancers produced exactly 6 drops, matching `(6-n)/6`'s own zero point; guards (whose `(1/3)^n` never mathematically reaches zero, only asymptotes) accumulated a real, incrementing counter without a hard cutoff, as expected. **`dm200`/`golem`/`shaman` are now ported too, found and fixed in the same follow-up pass**: `dm200`'s and `golem`'s `MOB_LOOT` entries had the wrong base chance outright (`{chance:0.125, kind:'armor'}` for both, an unconfirmed-guess bug with no derivation from Java's real `lootChance = 0.2` field) - both corrected to `0.2`, with their own `(1/3)^n` decay now wired (same shape as Guard's). `shaman`'s base chance (`0.03`) was already correct, just missing its own `(1/3)^n` decay, now added. Browser-verified live: 2000-3000 kills of fresh dm200/golem/shaman reached decay counters of 6/7/4 respectively, consistent with the `(1/3)^n` asymptotic falloff (no hard zero-point, unlike Bat/Necromancer's linear formulas). **Still not modeled**: Java's `Random.oneOf(WEAPON, ARMOR)` 50/50 category pick for dm200/golem - both always produce the `'armor'`-kind ground item here, a pre-existing simplification not newly introduced. **`slime`/`skeleton`/`thief`/`swarm` are now ported too, closing the last base-drop gap this row tracked**: each now has a real `MOB_LOOT` entry plus its own decay - `slime` (`0.2` base, weapon simplified to the shared weapon-as-`'armor'` stand-in dm200/golem already use, `(1/4)^n` via `SLIME_WEP`), `skeleton` (`1/6` base, same weapon-as-`'armor'` stand-in - Java's is any-tier `WEAPON` rather than Slime's `WEP_T2`, not distinguished here since this port has no per-tier weapon ground-item kind at all, `(1/3)^n` via `SKELE_WEP`), `thief` (`0.03` base, Java's `Random.oneOf(RING,ARTIFACT)` collapsed to the single `'ring'` kind rather than folding into the shared `'wand'` kind Artifact normally maps to - the `'wand'` choice would make it indistinguishable from a real wand pickup, `(1/3)^n` via `THEIF_MISC`), and `swarm` (`1/6` base `'potion'`, `(5-n)/5` via `SWARM_HP` - Java's own `1/(6*(generation+1))` term is not reproduced since this port's monster AI has no Swarm-split mechanic, so `generation` is always Java's own `0` case here). **`Warlock`'s `WARLOCK_HP` slot is now ported too, in its own dedicated `kill()` branch rather than the generic `MOB_LOOT` table** - it isn't a `lootChance()` override (Warlock's own top-level `0.5` chance has no `LimitedDrops` decay in Java at all), it's a separate roll on *which* potion class drops. This needed its own branch because this port's generic `'potion'` bag id always resolves to a full heal on quaff (`quaffPotion`'s own simplification), so routing Warlock through the shared `MOB_LOOT` `'potion'` kind the way Bat/Necromancer/Scorpio do would make every Warlock kill a guaranteed free heal - the exact opposite of real Java, where a Warlock drop is a genuine `PotionOfHealing` only on `Random.Int(3)==0 && Random.Int(8) > WARLOCK_HP.count` (reusing the shared `limitedDrops` map under a `warlock` key for that counter) and a redrawn non-`PotionOfHealing` class otherwise - reproduced here as a uniform pick among the 7 other potion ids this port already models by id (`potionStrength`/`potionFlame`/`potionMindVision`/`potionInvis`/`potionPurity`/`potionExperience`/`potionLevitation`). **`Scorpio` is now ported too, the same fix applied to a simpler case**: its real `createLoot()` is a flat `0.5` chance (no `LimitedDrops` counter at all) that redraws until the potion class is neither Healing nor Strength - reproduced as a uniform pick among the remaining 6 modeled potion ids, in its own `kill()` branch next to Warlock's. **`Succubus` is now ported too, the scroll-side equivalent**: its real `createLoot()` redraws until the scroll class is neither Identify nor Upgrade - this port's generic `'scroll'` bag id resolves to exactly those two, the same mismatch. Fixed the same way, in its own `kill()` branch, picking uniformly among the other 10 non-excluded ids. **Found and fixed a separate, genuinely pre-existing crash surfaced while wiring this**: `APPEARANCE_TABLES.scroll`'s `kinds` list never included `scrollTransmutation` at all, even though `sourceInventoryItem`'s own generic `ScrollOf* -> 'scroll'+Name` rename already produces exactly that id for any floor-generated `ScrollOfTransmutation` (Library rewards, plain floor loot) - so an unidentified one reaching `itemDisplayName` would throw inside `mwg`'s `Appearances.appearanceOf` (`"scrollTransmutation" is not in appearance category "scroll"`), a real, live crash risk with no prior report, not something this loot work introduced. Fixed by adding it as the table's 13th kind, with `labels` duplicating its first rune name onto this port's own synthetic pre-resolution `'scroll'` placeholder (a kind with no real Java counterpart at all) rather than inventing a fake 13th SPD rune name. **`snake`/`gnoll`/`crab` are now ported too, closing three more totally-missing base-drop gaps found in a full sweep of every real spawnable kind's `loot` field**: `Snake.loot = Generator.Category.SEED` (`0.25`, this port's real `'seed'` ground-item kind), `Gnoll.loot = Gold.class` (`0.5`), `Crab.loot = MysteryMeat.class` (`0.167`, `1/6`) - none had any `MOB_LOOT` entry at all before. `Rat` and `Goo` were also checked and confirmed to have no `loot` field in Java at all, so correctly still have no entry. **Found, not fixed, correctly scoped as bigger**: real Java's `Elemental` is abstract with 4 concrete subtypes picked via `Elemental.random()` for a normal spawn (`FireElemental`: `PotionOfLiquidFlame`, `1/8`; `FrostElemental`: `PotionOfFrost`, `1/8`; `ShockElemental`: `ScrollOfRecharging`, `1/4`; `ChaosElemental`: `ScrollOfTransmutation`, guaranteed `1`) - this port's single generic `'elemental'` id (no subtype AI/sprite distinction at all, a pre-existing, larger simplification) has no `MOB_LOOT` entry for any of them. Not attempted this pass: `PotionOfFrost` has no dedicated ground-item id or appearance-table entry of its own yet (it already falls through to Purity's effect on quaff, a documented gap elsewhere), so a naive drop would either need a fake virtual subtype roll at kill time (a real design choice, not a quick fix) or risk repeating the exact `appearanceOf`-throws-on-an-unmapped-kind bug `scrollTransmutation` just had, if implemented carelessly. **2026-09-14:** removed `monsters.ts`'s dead `LEGACY_LIMITED_DROP_DECAY` object literal (the same ten formulas, hand-duplicated, with no reader left anywhere once `limitedDropDecay`'s MWL migration landed); its Java-citation comments now live on `MWL_LIMITED_DROP_DECAY`/`LIMITED_DROP_DECAY` instead. |

| `Challenges.java` selection plus `AscensionChallenge.statModifier` per-mob table | `src/challenges.ts`, title Settings > Challenges, `ASCENSION_MOD` | Challenge ids/names/descriptions are selectable and persisted between runs. **Audited every challenge for whether its toggle actually does anything, having just found `champion_enemies` didn't**: `stronger_bosses` is real and **boss-only** - 18 call sites covering boss HP (Goo 100->120, Tengu 200->250, DM300 300->400, King 300->450, Pylon 50->80), DM300's cooldown and gas multiplier, King's phase-2 thresholds, Goo's heal increment, Tengu's ability deck, and `CavesBossLevel`'s trap chance plus final-pylon count. **This row used to claim the challenge "activates the Java multiplier table (already live)" - that was a bug written down as a feature.** The two are unrelated Java mechanisms, and the wiring pointed the *AscensionChallenge* per-mob table at this challenge, so selecting Stronger Bosses multiplied every ordinary mob's accuracy **and** damage by up to x10 (a rat). Found and fixed 2026-09-12; see the `AscensionChallenge` row below. `champion_enemies` now gates the champion roll (fixed this pass, see the `ChampionEnemy` row); `darkness` is now ported too - real `Level.viewDistance` drops from `8` to `2`, and since this port already uses one shared `VIEW_RADIUS` constant for both the hero's own FOV and every monster's `seesHero`/AI sight radius (the same shape real Java's own light-casting array backs both alike with), a single new `viewRadius()` helper reading `isChallengeEnabled('darkness')` covers every call site at once. `no_armor` is now ported too: real `Armor.DRMin()`/`DRMax()` drop to a flat `0` and `1+tier+lvl(+augment, not modeled here)` respectively under the challenge, instead of the normal `lvl`/`tier*(2+lvl)` scaling - `syncHeroFromStats`'s existing `hero.armor = [min, max]` assignment now branches on `isChallengeEnabled('no_armor')`; the Barkskin-talent addend stays unconditional on both branches, since it's this port's own additive layer on top of either formula, not part of Java's `DRMin`/`DRMax` bodies. `no_healing` is now ported too: fetched `PotionOfHealing.java` to confirm real `heal()`'s challenge branch grants no `Healing` buff at all - instead `pharmacophobiaProc()` sets a fresh `Poison` at the hero's own `4 + lvl/2` level. This port's `poison` buff has no separate stack-level dimension (a pre-existing simplification - every source just sets the shared flat duration, dealing a fixed 1-2 dmg/turn regardless), so `4 + floor(lvl/2)` is applied as that duration instead, the closest faithful substitute within the existing model. `cure()`'s own poison/burning/weakness/vulnerable/cripple clear still runs first either way, matching Java's `apply()` calling both unconditionally; the `restored_willpower`/`restored_agility`/`restored_nature` talent triggers correctly do not fire under the challenge, since real Java gates them on the `Healing` buff itself existing. New `port.log.pharmacophobia` EN/FR keys (no real Java message string was available in this checkout to reuse, unlike most other new lines here). `no_herbalism` is now ported too: real `Plant.Seed.onThrow()` falls through to a plain thrown-item drop under the challenge instead of ever planting - this port has no throw-to-cell targeting at all, so `plantSeed()` simply refuses the action without consuming the seed, the closest faithful equivalent. **Found and fixed three unrelated hardcoded-English strings in the same function while adding this gate** - `plantSeed()`'s three existing log lines (`This cell cannot grow a plant.` / `The seed has no known plant effect.` / the plant-success line) had never gone through `t()` at all, a real, pre-existing i18n gap this project's own audit convention exists to catch; all three plus the new `no_herbalism` line are now real `port.log.*` keys with EN+FR entries, reconfirmed by rerunning the full `port.*` literal-key audit (0 missing in either locale, 224 keys now in use). `swarm_intelligence` is now ported too: fetched `Mob.java`'s `Sleeping`/`Wandering` AI states to confirm the real hook - the instant any enemy mob notices the hero, it beckons every other non-paralyzed, not-yet-`HUNTING` enemy mob within 8 tiles of *itself* toward the hero too, rather than each mob only ever noticing independently. Wired into the existing wake check (right where `monster.sleeping` flips `false`); this port has no `HUNTING`/`WANDERING` state machine, so "not yet `HUNTING`" is approximated as "not already awake-and-`seesHero`," and the beckon itself reuses the exact `sleeping=false`/`seesHero=true` stand-in `ScrollOfRage`'s own beckon already established. **`no_food` is now ported**: real `Food.satisfy()` subtracts `HUNGRY` energy (300 for ordinary food, 150 for MysteryMeat), dividing that energy by three under `NO_FOOD`; `eatFood()` reproduces this in the MWG hunger model, while preserving the port's existing flat meat-heal simplification. **`no_scrolls` is now ported**: Java's `Dungeon.souNeeded()`/`Level.create()` allocation is reproduced as three guaranteed Upgrade Scrolls per five-floor chapter, with every second allocation suppressed while its run counter still advances. The port's generic floor allocator had no pre-existing guaranteed-scroll queue, so this is integrated as an equivalent post-generated-item placement with the same chapter budget and random floor selection. |
| `AscensionChallenge.statModifier` per-class table (`Rat` 10 down to `Scorpio` 1.1) | `ASCENSION_MOD` in `src/simulation/combat.ts`, `ascensionOn()` gate | **Not ported - inert data, and the gate was wrong until 2026-09-12.** Java applies this table only while the hero holds the `AscensionChallenge` buff, i.e. during the post-victory ascent (`AscensionChallenge.java`: `if (Dungeon.hero == null || Dungeon.hero.buff(AscensionChallenge.class) == null) return 1;`), and this port does not model the ascent, so nothing sets the flag and the multiplier is always 1 in-game. It used to be gated on the *Stronger Bosses* challenge instead, which made every ordinary mob up to x10 stronger - see the challenges row above. The table itself was also unreliable: `skeleton`/`thief` were 6 instead of 5, `dm100` 5 instead of 4.5, and fourteen mobs Java names (`bat`, `brute`, `shaman`, `spinner`, `dm200`, `ghoul`, `elemental`, `warlock`, `monk`, `golem`, `ripperDemon`, `succubus`, `eye`, `scorpio`) were missing. Now Java's 25 classes flattened onto this port's 40 ids, since Java resolves by `isAssignableFrom` (a subclass inherits its parent) while this port models subclasses partly as MWL `BASE_KIND_ALIASES` variants and partly as first-class `MonsterId`s; a `verifyCombat` check pins the flattened table and asserts each alias-table variant matches its base kind's value. Unported remainder: the `statModifier(enemy)` factor Java applies to the defender's `drRoll()`, and the `Ratmogrify.TransmogRat`/`AscensionBuffBlocker` exemptions.

| Four concrete Elemental kits (`FireElemental`, `FrostElemental`, `ShockElemental`, `ChaosElemental`) | `Creature.elementalType`, `randomElementalType`, `elementalRangedTurn`, `mobOnHit`, `kill()` elemental loot branch, potion appearance table | Simplified but ported at the kit boundary: subtype selection now matches Java (Chaos 1/50, otherwise Fire/Frost/ Shock at 40/40/20%), melee/ranged fire and frost effects are active, and Fire/Frost/Shock/Chaos produce their Java loot outcomes (1/8, 1/8, 1/4, guaranteed). Shock Blindness uses Daze and Chaos's cursed-wand delegation uses an existing harmful status because those subsystems are absent; subtype-specific sprites and chained lightning geometry remain. **Corrected 2026-09-12: the ranged bolt used to *also* deal `NormalIntRange(20, 25)` damage, which Java's never does.** `Elemental.zap()` is `hit(this, enemy, true)` -> `rangedProc(enemy)` and nothing else - `FireElemental` reignites Burning (skipped in water), `FrostElemental` calls `Freezing.freeze`, `ShockElemental` applies `Blindness.DURATION/2f` - so an Elemental's threat at range is the status alone, and the phantom 20-25 (which also made this port's elementals far deadlier than Java's) is gone. Browser-verified live: 25 zaps of each type left the hero's HP untouched while applying the status every time. Not modelled still: `ShockElemental.meleeProc`'s `round(damage * 0.4)` arc to the chars around a melee target, and the Chaos cursed-wand table. |
| `INFINITE_ACCURACY`/`INFINITE_EVASION` short-circuits (surprise attacks, untargetable defenders) | `INFINITE_ACCURACY`/`INFINITE_EVASION`, sleeping-target surprise, NPC unkillability | Ported |

| `Char.java`'s `paralysed`/`rooted`/`flying`/`invisible` fields (gate movement in `Hero.actMove`/`Char.move`, trap/chasm/water interaction, and `Char.canInteract`'s stealth check) | `Creature.buffs`, `onAction`/`moveTo`/`triggerTrapAt`/`fallThroughChasm`, `rollHit`, `statusPane.ts` | Ported in the model used by this game: paralysis consumes the creature's turn; roots block movement but not attacks; levitation bypasses the port's pressure/ground traps and (as of the chasm-falling row below) chasms too; and invisibility is timed, displayed, makes distant monsters lose target, gives surprise, and dispels on attack. Buff durations also persist through save/load. There is still no water-hazard terrain in this port's model, so Levitation has no such interaction to apply there - the earlier note that chasm cells didn't exist either was stale; `isChasmCell`/`fallThroughChasm` already model chasm terrain and predate this correction. |
| `Chasm.java`'s `heroLand()` (fall-damage consequences, once a floor/chasm cell exists to fall through) | `fallThroughChasm`/`landFromChasm` | Ported: `Cripple`, the real `Bleeding` intensity formula, and the real `max(HP/2, NormalIntRange(HP/2, HT/4))` upfront damage, run through the same hero-damage absorption pipeline (Tenacity/Barrier/Iron Will/Deathless Fury) every other source uses; a chasm death correctly triggers `kill()`. Not ported: Bleeding's source-class death badge distinction and blood-splash presentation, `ElixirOfFeatherFall`'s fall-negation (that item isn't ported), the landing sound, and camera shake (no camera-shake system exists). `Chasm.heroJump()`'s confirmation dialog is UI-only and isn't needed given this port has no equivalent modal-confirmation system for movement. |

| `Bleeding` buff and `Sacrificial.proc()` / chasm source applications | `simulation/buffs.ts`, `setBleeding`, `landFromChasm`, `attack` | Ported for the active Chasm and Sacrificial sources: intensity keeps the strongest application, ticks with Java's `NormalFloat(level/2, level)` then `round`, and healing cures it. Remaining Bleeding sources (Sickle harvest, monster/trap effects) and source-specific death badges/blood visuals are not yet ported. |
| `Char.canEnterCell()` monster treatment of `Terrain.CHASM` | `populate`, `spawnPortedMobs`, `standableCellIn` | Ported: monsters and NPCs are now rejected from raw chasm cells even though the coarse MWG terrain map exposes those cells as passable for the hero's falling interaction. This closes a live generation bug where a ported-floor monster could render over unsupported black/chasm terrain. |

| Chasm exclusion for summoned/created actors | `spawnMirrorImage`, `maybeSummonEarthGuardian`, `summonSkeleton`, `summonKingAdd`, `summonYogFist`, `Multiplicity`, `Swarm`, ritual elemental | Ported: every runtime actor-placement path now applies the same raw-chasm rejection, so abilities and summons cannot recreate the unsupported placement after initial generation. |
| Ally perception and ally-vs-monster turns | `visibleAllyHostiles`, `takeAllyTurn`, `takeMonsterTurn`, `takeEarthGuardianTurn`, `takeWardTurn`, `fadeMirrorOnDamage` | Simplified: allied actors now compute visibility from their own position before selecting hostile targets, hostile mobs pursue visible non-sheep allies when they cannot see the hero, and Mirror Images fade on their first positive damage event through melee, wand, gas, and falling-rock paths. Full ally orders, dedicated ally sprite classes, and boss-specific ranged target migration remain open; specialized ranged attacks still target only the hero. |

## Hero (`actors/hero/Hero.java`, `HeroClass.java`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `Hero`'s base `HP = HT = 20`, `attackSkill = 10`, `defenseSkill = 5` | `makeHero` | Ported |
| `HeroClass.initHero`: `ClothArmor` (equipped, identified), `Food`, `VelvetPouch`, `Waterskin`, `ScrollOfIdentify` knowledge | `makeHero`'s base kit | Ported (`VelvetPouch` is a carried item with no container UI - it has no effect to wire) |
| `initWarrior`/`initMage`/`initRogue`/`initHuntress`/`initDuelist`: starting weapon + extras | `makeHero` per-class branches | Ported - stones/knives/spikes ammo, staff + `Charges`, cloak (+3 evasion stand-in for its charge stealth), bow in the bag, rapier; knowledge items grant one real consumable each |
| `initCleric` (read at tag `v3.3.8`: `Cudgel`, `HolyTome`, `PotionOfPurity`, `ScrollOfRemoveCurse`) | `makeHero` cleric branch, `useSpecial`'s tome heal | Ported (weapon + tome-as-slow-charges + both consumables); the SP economy the real tome draws on is Simplified to charges |
| `HeroClass.isUnlocked()`: Warrior always true, everything else needs a `Badges.Badge.UNLOCK_*` | `CLASSES[id].unlocked`, `classUnlocked`, persisted meta badges | Ported - the initial state matches Java, and earned unlock badges persist across runs. The Cleric has no counterpart in this checkout, so the port unlocks it on first victory. |
| `STR`: `STARTING_STR = 10`, no per-level gain, +1 per Potion of Strength | `heroStr`, `quaffPotion`'s strength branch, `syncHeroFromStats` | Ported |
| Talent trees (full per-class choice UI), subclasses (`HeroSubClass`), armor abilities | `src/talents.ts`, `refreshTalentPanel`, `SkillPoints`, `Advancement`, subclass combat branches, armor capstones | Ported for the selectable tree - Java Tier 1/2 nodes and translated descriptions are shown per class, Tier 3 subclass nodes unlock at level 13, rank limits and selections persist in saves. Live proc families now include barrier/shield absorption, healing triggers, food bonuses, stealth shielding, combo/execute, point-blank ranged **accuracy** (see below), charge refunds, lethal-momentum/free-turn effects, follow-up strikes, heightened senses, durable projectiles, nature's aid/bounty, rejuvenating steps, weapon recharging and Iron Will mitigation. **Corrected 2026-09-15: `POINT_BLANK` is not a damage talent.** It appears exactly once in Java, inside `MissileWeapon.adjacentAccFactor`, as `0.5f + 0.25f*pointsInTalent(POINT_BLANK)` replacing the flat `0.5f` melee-range penalty for thrown weapons and the spirit bow, and its range test is `adjacent` (Chebyshev 1), not `distance <= 2`; this row and the proc-heavy row below both used to say "point-blank ranged damage/scaling", and the code applied `1 + 0.2*rank` damage at `<= 2`. Now ported as accuracy on both ranged paths - see the `MissileWeapon` ranged-accuracy row for the formulas and the live verification. Exact Java formulas for the remaining rare ability talents remain roadmap work |
| Levelling itself (`exp`/`lvl`, `HT` growth, `attackSkill++`/`defenseSkill++`) | see "Levelling and skill points" below | Ported/Simplified - see that section |
## Weapons (`items/weapon/**`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `MeleeWeapon`/`Weapon` base `min()`/`max()` formulas, per-weapon overrides at `lvl = 0` | `CLASSES[id].damage` | Ported |
| `Armor.doEquip()`'s Warrior seal transfer (`Armor.java` 261-283, tag `v3.3.8`) | `offerSealTransfer` (scene), the `equipArmor` hook in `items/equipment.ts`, `port.confirm.sealtransfer.*` in all 19 catalogues | **Ported 2026-09-15.** Swapping into armor that carries no seal of its own, while the armor being removed *is* sealed, now offers to move the seal across instead of silently dropping it: Java shows a confirm window titled with the seal's own name and the `armor.seal_transfer` body, transferring only on "yes". The wording is SPD's own v3.3.8 text pulled from the tag per locale into `portStrings.ts` (the port's usual route for strings this checkout's own message files predate - see the `Symbol`/i18n rows), not retyped or machine-translated. Java's extra `!cursed || (seal.getGlyph() != null && seal.getGlyph().curse())` escape needs a seal-glyph model this port lacks, so a cursed incoming armor refuses outright with the real `items.brokenseal.cursed_armor` line. **Browser-verified live** (2026-09-15, Italian catalogue): a Warrior whose seal was affixed equipping a fresh armor opened the window with the seal's own name and SPD's text (`sì`/`no`); clicking `sì` through the real pointer path re-sealed the new armor (`armorSealed` false -> true, window closed); and equipping a cursed armor instead logged `Il sigillo non si attaccherà ad un armatura maledetta.` with no window and no seal. **`AC_DETACH` is ported too (2026-09-15).** Tapping the equipped armor in the inventory (where Java lists the action) returns the seal to the bag, logs SPD's real `items.armor.armor.detach_seal` line - verified live in the game's own language: "Distacchi il sigillo dalla tua armatura." - clears the sealed state and re-syncs the Warrior's shield; a second tap with no seal attached does nothing, and Java's drop-at-the-hero's-feet fallback (a full bag) has no case here. Still unported: the seal's own curse glyph from the Blacksmith's reforge. |
| `MeleeWeapon`/`Armor` tier and upgrade terms (`min = tier+lvl`, `max = 5(tier+1)+lvl(tier+1)`; armor `min = lvl`, `max = tier(2+lvl)`) | `syncHeroFromStats`, `generatedInventoryItem`, `equipWeapon`/`equipArmor`, `weaponTier`/`armorTier` | Simplified but improved: generated weapon sub-tier cats and concrete armor classes persist their real fixed 1-5 tier in inventory and restore it when equipped; old saves default to tier 1. Scroll upgrades now preserve that tier and add Java's plain +1 level; because this port has no item-picker modal, the action auto-targets the lower-level equipped weapon or armor, and ammo users let missiles catch up after both equipped items reach that level. **Corrected 2026-09-15: the three "remain open"/"remain gaps" clauses this row ended on were all stale** - Blacksmith transfer (`transferEnhancement`) has been ported and used by both equip paths, hardening (`enchantHardened`/`glyphHardened` + the Blacksmith's harden service) is ported and was re-verified line-for-line against tag `v3.3.8`, equipped-slot targeting is in both infusion pickers (see the `MagicalInfusion` row), and the Curse Infusion bonus is now Java's virtual `1 + level/6` with the real clearing rule (see the dedicated row). What actually remains here is `AC_DETACH`: detaching a seal back into the bag needs an action surface on the equipped armor, which this port's inventory does not have. |
| `Gloves.DLY = 0.5` (2x attack speed) | `CLASSES.huntress.speed = 2` | Ported |
| `Cudgel.ACC = 1.40f` | `CLASSES.cleric.accuracy = 14` | Ported |
| `MeleeWeapon.ability()` overrides (all 30), the charge meter, `COUNTER_ABILITY` | `src/items/weaponAbilities.ts` (per-class table), `useWeaponAbility`/`resolveHeroAbilityAttack`/`tickWeaponAbility`, the `weaponAbility` action, persisted charge/windows | **Ported (2026-09-17).** Magnitudes are each weapon's own `ability_desc`: sneak, heavy blow 35/45/40/30 +daze 5, cleave 20/23/27/30/33 +free recast within 5 turns of a kill, spin +33%/spin to 3, guard 6/8 turns of full negate, combo 35/40/45 per recent hit, spike 30/45 ranged +knockback, lunge 35/67 with the step, harvest 100/80% bleed, sword dance +60% speed/+25% accuracy, defensive stance 3x evasion, retribution below half HP +50, charged shot force-hit +5x5 area, runic slash +300% enchant power, lash area attack. **Correction, charge pass: the costs the shipped descs state ("costs 2 charges", "6/8/10 turns", "free on surprise", "0.5-2 fewer charges") predate v3.3.8's Duelist rework and are wrong against its code, so the desc-audit above was checking stale text - every cost is now Java's `baseChargeUse` (uniformly 1, free only in the flail's mid-spin and the swords' re-cleave windows), sneak grants `(2+weaponLevel)-1` invisibility, heavy blow always spends (surprise gates the bonus only), and `COUNTER_ABILITY` refunds `rank*0.375` after the spend instead of discounting it (this also closes the Feint row's stale "inert tracker" clause).** Charge, partial, windows, spins, stance and shot state all persist with the run, start at Java's 2, and survive the ankh revive (`revivePersists`). **Three real bugs found and fixed auditing the table against the descs**: lunge staged knockback that neither lunge desc mentions (only spike's do); combo strike kept a +35% floor with no recent hit (the desc awards per hit, so zero hits is a plain guaranteed hit); thrown hits never reached the combo window (the desc counts "melee or thrown weapons" - the throw path shares the same choke point on a hero copy, so the accrual now keys on `isHero`). **Charge economy now exact**: the cap is the hero's level (`min(8, 2+(lvl-1)/3)`, champion `min(10, 4+(lvl-1)/3)`), accrual is `Charger.act()`'s own `1/(60-1.5*(cap-charges))` per turn (x1.5 champion, `WEAPON_RECHARGING` bonus while `Recharging` holds or `ArtifactRecharge` ticks), spends go partial-first behind the `charges + partial >= cost` gate, and sneak plus the charged shot are free (`hero.next()`). **Ported 2026-09-17:** damage strikes aim through the `TargetingController` like sneak's blink - the confirm latches `abilityAimTarget` and re-enters `useWeaponAbility`, so the existing resolution (riders, charge spend, turn cost) is untouched and cancelling spends nothing (Java's `beforeAbilityUsed` runs post-validation); validation is a visible hostile in range (spike 6, else 2), allies excluded like melee. **Still simplified**: sneak's blink stays as ported (per-weapon 3/4/5 range, path-distance + FOV + unoccupied + unrooted validation, charge spent on confirm, free like Java's instant) - the `ability_target_range`/`ability_occupied` keys postdate the catalogue so the controller's refusal line speaks for them, the flood is passable-only where Java floods passable|avoid, and the WOOL burst/PUFF have no layer here; `VARIED_CHARGE`'s ability-use refund has no talent to read (the `secondary_charge` ammo stand-in stands); brawler's-stance slowdown has no buff to read; `regenOn` is always true (no `LockedFloor`/`Vault`); spin lasts a fixed 3 turns. The shipped ability/talent descs still state the old costs - a catalogue-refresh task, not a mechanics gap. **No missile weapon has an ability at all** (zero `ability_desc` keys under `items.weapon.missiles.*`), correcting the roadmap's "Melee/Missile" phrasing - the crossbow's charged shot is melee-side (Java's `Crossbow extends MeleeWeapon`). Verified headlessly (30-class roster, lookup/case/fallback, cost-1/free-window costs, cap curves, accrual rates, partial-first spends, gain clamps, rank*0.375 refunds, spin math) and live (`tools/scratch/weapon-ability-livecheck.mjs`, 15/15: sneak 1 charge + 1 invis + no turn, spin 1/free/cap/warn, cleave 1 + kill refund + free recast, heavy 1 with no payback + daze, rank-4 counter refund 1.5 + consumed, charged shot 1 + no turn, scene tick banks/drops, melee and thrown hits both feeding the combo window). |
| **All weapon/armor/wand definitions (35 weapons × 5 tiers, 5 armor types, 10 wands × 5 tiers, 12 rings)** | `src/items.ts` WEAPONS/ARMOR/WANDS/RINGS and lookup functions; `src/mwlContent.ts` | **Ported** - the MWL catalogue now declares all 12 ring ids, slots, weights and high-level effect metadata; SPD-specific formulas and runtime hooks remain in `ringModifiers.ts`/`main.ts`. The other item families remain the existing typed database. |
| Ring effects (`items/rings/RingOf*.java`, 12 real types) | `main.ts`'s `RING_DEFS`, `ringDef`, `equipRing`, `ringTenacityMultiplier`/`absorbHeroDamage`, `ringHtBonus`, `ringElementsMultiplier` (`spendHeroTurn` DoT / `spreadPlantBlobs` toxic gas / `triggerTrapAt` burning), `ringFurorMultiplier`/`getAttackTurnCostMod` (bump-attack-only cost via the `move` port pre-check), `NON_STATBLOCK_RING_STATS` | **2026-09-12, bonus-level correction: every `^level` written in this row below means Java's *bonus* level, not the ring's own upgrade level - and until this pass the port read the raw upgrade level, i.e. one level short, with no cursed clamp and no AntiMagic gate.** `Ring.RingBuff.level()`/`buffedLvl()` is `soloBonus()`: `level + 1` for an uncursed ring, `min(0, level - 2)` for a cursed one, and `Ring.getBonus`/`getBuffedBonus` return 0 outright under `MagicImmune` (the AntiMagic glyph - `Ring.java` 357-404, and every `RingOf*`'s own description printing `pow(1.175, level+1)`). So in real Java a plain +0 ring already grants one full level of effect, a cursed ring can never grant a *positive* bonus (at +0/+1 it is an active penalty - a cursed Might ring docks 2 STR and lowers max HP), and AntiMagic suppresses rings entirely; all three were missing here, which made every ring in the port one level weaker than Java's and made cursed rings *beneficial*. One new `ringBonusLevel(ring, magicImmune)` now feeds all twelve formulas (including `RING_DEFS`'s `at()` through the StatBlock loop), `ringMightBonus` handles Might's flat STR, `hero.magicImmune` is threaded into every read, and `HTMultiplier`'s two sites (`equipRing`, and `ScrollOfTransmutation`'s in-place ring replacement) read the same bonus level. Browser-verified live, 12 assertions: a plain +0 Haste ring reading exactly `1/1.175`, a +3 one `1/1.175^4 = 0.52462` (not `^3`), a cursed +0 one `1/1.175^-2 = 1.38063` (a real slow-down) and a cursed +5 one exactly 1 (the clamp), a plain Might ring adding exactly +1 STR and a +3 one +4 with max HP 20 -> 23 (`1.035^4`), a cursed Might ring docking 2 STR with max HP below its base, and the AntiMagic glyph zeroing both a +3 Haste and a +3 Might ring. **Correction to this row's own earlier live-verification numbers below**: the "level-5 Might ring took maxHp 20->24 and str 10->15" line was measured against the old raw-level formula - the same ring carries 6 levels of effect now (max HP 25, STR 16). Both gaps found in the previous audit pass are now closed, and a real crash bug found while closing them is fixed too.** Only 4 of 12 ring types exist at all (Accuracy/Evasion/Might/Tenacity - Arcana/Elements/Energy/Force/Furor/Haste/Sharpshooting/Wealth are **not ported**), but all 4 now reproduce their exact real Java formula: **Accuracy** (`accuracyMultiplier()` x1.30^lvl) and **Evasion** (`evasionMultiplier()` x1.125^lvl), unchanged, via `scaledModifiers`. **Might**: `strengthBonus()` (flat +lvl STR) and now also `HTMultiplier()` (x1.035^lvl max HP, previously not ported) - the HT bonus is tracked as `ringHtBonus`, an absolute HP delta recomputed only in `equipRing` (the sole ring-mutation choke point) using the same old-max/hp-delta-preserving pattern `levelUp`'s +5/level bump already used, backing out the ring's own prior contribution first so repeated ring swaps don't compound. **Tenacity**: `damageMultiplier()` = x0.85^(lvl × currentMissingHpFraction), previously a flat +2 armor/lvl stand-in with a different shape entirely, is now the real curve, applied to incoming hero damage in a new `ringTenacityMultiplier()` called from `absorbHeroDamage` before Barrier absorption (matching `Hero.damage()`'s real ordering: the multiplier applies to the raw hit before `Char.damage()`'s Barrier logic runs). **Bug found and fixed in the same pass**: `RING_DEFS` is keyed bare (`"might"`) but every stored ring id carries the UI's `"ring_"` prefix (`"ring_might"`) - indexing `RING_DEFS[equippedRing.id]` directly (both read sites) was silently looking up `undefined` and would throw a `TypeError` reading `.stat` the moment any ring was actually equipped, a live crash that predates this pass and was never previously exercised/caught. Fixed via a new `ringDef()` helper that strips the prefix before lookup; both call sites and the new HT/Tenacity code route through it. **Browser-verified live** via `window.__MWG__.currentScene`: equipping a level-5 Might ring took `maxHp` 20→24 and `str` 10→15 (`round(20×(1.035^5−1))=4`, `+5` STR, exact); equipping a level-5 Tenacity ring at 50%-missing HP made `ringTenacityMultiplier()` return `0.6661...` (`0.85^(5×0.5)`, exact) and `absorbHeroDamage(20)` return `14` (`ceil(20×0.6661)`, exact); re-equipping a level-3 Accuracy ring afterward still gave exactly `1.3^3 = 2.197×` accuracy, confirming the refactor didn't regress the two rings that were already correct. `npx tsc --noEmit`, `npm run build`, and both test suites (`test:simulation` 36/36, `test:items` 1/1) all clean. **Two more ring types now ported, fetching `RingOfHaste.java`/`RingOfEnergy.java` from the local shattered-pixel-dungeon checkout (tag `4.0.0-beta`) to confirm the exact formulas** (6 of 12 now real; Arcana/Elements/Force/Furor/Sharpshooting/Wealth remain **not ported**, each needing a system this port doesn't have - wand-damage scaling, elemental status resistance, melee damage bonus, attack-speed distinct from movement speed, ranged-specific accuracy/damage, and loot-drop-rate modification respectively). **Haste**: `speedMultiplier()` = `1.175^level`, applied as a divisor on `getActionTurnCostMod()`'s existing multiplicative turn-cost chain (the same mechanism Swiftness/Weapon.Augment SPEED/Bulk already use) - Java expresses this as `Char.speed()` scaling up, this port's fractional-turn-cost model expresses the identical relationship as action cost scaling down. **Energy**: `wandChargeMultiplier()` = `1.175^level` (the Light Reading talent's further multiplier on top is not modeled, since that talent itself isn't ported), applied directly to `recoverWandCharge`'s existing per-turn recharge-rate calculation. Both skip the generic `heroStats`-modifier loop the same way Tenacity does (via new `stat !== 'speed' && stat !== 'energy'` guards) since neither is a `StatBlock` entry, and both read through dedicated `ringHasteMultiplier()`/`ringEnergyMultiplier()` helpers mirroring `ringTenacityMultiplier()`'s existing shape. `RING_KEYS`/`RING_DEFS`/the appearance-shuffle's implicit ring pool (`Random.element(Object.keys(RING_DEFS))`, used for the Imp quest reward and one other spawn site) pick these two up automatically - the `PotionOf`/`ScrollOf`-style manual id-rename bug that hit potions/scrolls doesn't apply here, since `generatedInventoryItem`'s ring-id transform (`RingOfHaste` -> `haste`) already matches `RING_DEFS`'s bare keys with no special-casing needed. Browser-verified live: equipping a level-3 Haste ring made `getActionTurnCostMod()` return exactly `1/1.175^3 = 0.61643...`; equipping a level-4 Energy ring made `ringEnergyMultiplier()` return exactly `1.175^4 = 1.90613...`; both rings' French names/levels rendered correctly on equip ("bague de célérité +3 (+3)", "bague d'énergie +4 (+4)"). **A third ring type, Wealth, is now ported too, found stale in the same "re-check other blocked claims" pass that fixed Weapon Augment/`firstSummon`/`PotionOfHaste`** (7 of 12 now real): fetched `RingOfWealth.java` to confirm the exact shape - it's actually two independent mechanics, not one. `dropChanceMultiplier()` = `1.20^level`, a flat multiplier Java applies wherever a mob's own `lootChance()` gets rolled, needed no new system at all and is now wired into the `MOB_LOOT` roll in `kill()` via a new `ringWealthMultiplier()` (same shape as `ringHasteMultiplier`/`ringEnergyMultiplier`). The *separate* `tryForBonusDrop()` mechanic (an independent escalating-toward-guaranteed-rare-loot bonus roll, tracked by its own `TriesToDropTracker`/`dropsToRare` counters, generating an *additional* item via `Generator` on top of whatever the mob's own table already dropped) is a real, distinct subsystem this port doesn't have and is **not ported** - a narrower, honestly-flagged remaining gap, not glossed over as done. Browser-verified live: sampling 3000 fresh-bat kills with no ring equipped versus 3000 more with a level-3 Wealth ring equipped gave a drop-count ratio of `1.782` against real Java's exact `1.20^3 = 1.728` predicted ratio, within sampling noise. **Arcana is now ported too - a follow-up correction to this row's own previous entry, which overstated the scope after only checking `RingOfArcana.java` itself and guessing every enchant/curse proc would need touching.** Actually reading each of `Blazing`/`Chilling`/`Shocking`/`Vampiric`/`Grim`/`Lucky`/`Blocking`/`Polarized`/`Sacrificial`/`Displacing`/`Annoying`/`Dazzling`/`Explosive`/`Wayward`'s real Java `proc()` source showed `procChanceMultiplier()` is called *only* by the seven good-enchant classes, never by any curse - a deliberate Java design split (Arcana rewards keeping good enchants, never boosts a curse you're stuck with), not an oversight to retrofit everywhere. Of those seven, this port only rolls a real probabilistic chance for three - **Grim** (`0.15 * ringArcanaMultiplier()`), **Lucky** (`0.1 * ringArcanaMultiplier()`), and **Blocking** (folded into its existing exact `(lvl+4)/(lvl+40)` formula, which also correctly cascades into `powerMulti = max(1, procChance)`'s shield-amount calculation, matching Java's own order of operations) - since Blazing/Chilling/Shocking/Vampiric are unconditional in this port already (a separate, pre-existing simplification with no roll left for Arcana to scale). A new `ringArcanaMultiplier()` (`1.175^level`, mirroring `ringHasteMultiplier`/`ringEnergyMultiplier`'s shape) feeds all three. Browser-verified live: with no ring equipped, `ringArcanaMultiplier()` reads `1`; with a level-3 Arcana ring, it reads exactly `1.175^3 = 1.62223...`; a 4000-kill sampling comparison of Grim's proc rate with and without the ring gave a `1.737` ratio against the same `1.622` prediction, within sampling noise. **Force is now ported too**: fetched `RingOfForce.java`/`Hero.java` to confirm - `armedDamageBonus()` is a flat `+level` Java adds to `Hero.damageRoll()` whenever the wielded weapon isn't a `MissileWeapon` (its `fightingUnarmed`/`unarmedGetsWeaponAugment` branches, for a monk-style barehanded fighting mode this port has no equivalent of, are not modeled - moot anyway since this port always has *some* weapon equipped). A new `ringForceBonus()` is added at the hero's own melee-attack site, gated by the exact same `attacker === this.hero` reference check every other hero-only attack bonus here already uses (`kinetic`, `physicalBonusAttacks`, etc.) - true only at the real bump-attack call site (`this.attack(this.hero, occupant)`), never inside `useSpecial`'s throw/shoot/zap branches (which pass a shallow *copy* of the hero, not the hero itself) - so it excludes ranged/thrown attacks for free, with no extra weapon-kind check needed, matching Java's `MissileWeapon` exclusion exactly. Browser-verified live: with a level-4 Force ring equipped and the hero's own weapon damage roll zeroed out to isolate the ring's contribution, 50 real melee attacks averaged exactly `+4` damage each, while 50 attacks through the `useSpecial`-shaped copy-attacker path averaged `0` - confirming the exclusion holds. **Sharpshooting is now ported too**, the ranged mirror of Force's shape: fetched `RingOfSharpshooting.java`/`MissileWeapon.java`/`SpiritBow.java` to confirm two effects. `levelDamageBonus()` (flat `+level`) is added to `MissileWeapon.min()`/`max()` identically on both bounds (thrown stones/knives/spikes) but asymmetrically on `SpiritBow.min()`/`max()` - `+level` low, `+2*level` high - both now reproduced exactly via a new `ringSharpshootingBonus()`, added to `special.damage`'s two bounds at the `'throw'` and SpiritBow (`else`/`'shoot'`) branches in `useSpecial()` respectively, before their existing roll. `durabilityMultiplier()` (`1.2^level`) scales Java's `usages` directly; this port's equivalent `uses` (the divisor behind `ammoDurability`'s per-throw percentage decrement) now gets a matching `* ringSharpshootingDurabilityMultiplier()`. Browser-verified live: with a level-5 ring equipped, `ringSharpshootingBonus()` read `5` and `ringSharpshootingDurabilityMultiplier()` read exactly `1.2^5 = 2.48832`; a real thrown attack's `ammoDurability` dropped by exactly `100/round(5*2.48832) = 8.333`, matching the scaled `uses` divisor precisely; a 200-throw sampling comparison with and without the ring showed average damage rise from `3.54` to `8.495` (a `4.955` difference against the exact `+5` expected, within sampling noise). **Elements and Furor are now both ported, closing the last two ring gaps (all 12 real types live)** - fetched RingOfElements.java/RingOfFuror.java/Hero.java/Char.java (tag v3.3.8) to confirm the exact formulas, which overturned this row's own earlier scoping (written before the Java was actually read). **Elements**: resist() = pow(0.825, level) for sources in RESISTS (Burning/Chill/Frost/Ooze/Paralysis/Poison/Corrosion/ToxicGas/Electricity + AntiMagic.RESISTS). Real Java applies this in Char.resist()'s single choke point (damage *= resist(srcClass) - damage only, never buff duration); this port has no such shared dispatch, so the same factor is applied at each hero-side elemental-damage call site instead, via a new ringElementsMultiplier(): the burning/poison DoT tick in spendHeroTurn's applyBuffDamage hook, the toxic-gas blob's direct damage in spreadPlantBlobs, and the burning trap's fire damage in triggerTrapAt - all scaled before Barrier absorption, matching Hero.damage()'s ordering. Status durations are not scaled - Java does not scale those through this path either. **Furor**: attackSpeedMultiplier() = pow(1.09051, level), scaling only Hero.attackDelay() (a cost function entirely separate from Char.speed()). This port previously had only the single blanket getActionTurnCostMod(), so the split was built first: a new getAttackTurnCostMod() (blanket divided by ringFurorMultiplier()), and the move action port pre-checks whether the step leads into a hostile creature (the same creatureAt/NPC-exclusion test takeHeroTurn's own occupantAt query uses, which also correctly takes precedence over roots) - bump-attacks spend the attack rate and report the turn spent so the adapter does not also spend the blanket cost, while movement/door/NPC steps keep the blanket path, matching Java's split where Furor never speeds non-attacks. Both new defs ride RING_DEFS as marker-only entries (via a new NON_STATBLOCK_RING_STATS set, which also replaces the old 8-clause OR-chain in syncHeroFromStats per the ROADMAP section-11 KISS note), so ring generation (Random.element(Object.keys(RING_DEFS))) picks them up with no spawn-site changes. Type-check clean (npx tsc --noEmit); browser verification still owed per ROADMAP section 10 (no browser available this session). **Superseded scoping note, kept for history rather than deleted**: the paragraph below had checked the Java and concluded Elements needed a double-digit-site retrofit and Furor needed an attack-cost split - both turned out to be implementable in this same shape (3 elemental-damage sites; one attack-cost branch), not left as gaps. **Elements checked and confirmed a genuinely broad retrofit, not a quick win like Force/Sharpshooting/Arcana turned out to be** - fetched `RingOfElements.java`/`Char.java` to check before assuming either way. Real Java's `resist(Class effect)` is a single generic dispatch `Char.resist()` (0.5x per matching creature/property/buff-level resistance, then `* RingOfElements.resist()` on top) that EVERY status-effect application in the whole codebase is expected to call before applying its damage/duration - burning, chill/frost, poison, paralysis, corrosion, the ToxicGas/Electricity blobs, and `AntiMagic.RESISTS`'s list all route through it. This port has no equivalent generic resistance dispatch at all; every status buff this port already has (`poison`/`paralysis`/`burning`/etc.) is granted via its own scattered `addBuff(hero, id)` call site (gas blobs, potions, traps, plants, monster procs - a genuine double-digit count of sites, confirmed by grep), each of which would need its own multiply-by-`ringElementsMultiplier()` retrofit to get this right, not the 1-3 sites Force/Sharpshooting/Arcana each turned out to need. Not attempted this pass - correctly scoped as a real, broader gap rather than assumed simple and rushed. **Furor is also not ported, but its blocker is now narrower and more precisely understood, not a blanket "no system"**: fetched `RingOfFuror.java`/`Hero.java` to confirm - real Java's `RingOfFuror.attackSpeedMultiplier()` (`1.09051^level`) only scales `Hero.attackDelay()`, a cost function entirely separate from `Char.speed()` (`Hero.java`'s own `spend(attackDelay())` at the melee-hit site, distinct from the generic per-action `spend()` everything else uses) - this port's `getActionTurnCostMod()` is a single blanket multiplier applied to every hero action alike (move, search, ranged, melee) with no attack-only cost path to hang a Furor-specific multiplier on. Implementing Furor for real needs that split first, not just a stale-claim fix like Haste/Wealth/Augment/`firstSummon` turned out to be. **2026-09-09 item-system audit, two real bugs found and fixed, unrelated to the ring formulas themselves**: (1) `equipRing`'s Might HT-bonus branch checked `id.startsWith('ring_might')` directly instead of `ringDef(id)?.stat === 'strength'` like every other ring-stat branch - not a live bug (no other id starts with "might"), but an inconsistent exception now matched to the established pattern. (2) The Recharging buff's wand-charge bonus (`recoverWandCharge`, unrelated to rings but audited alongside Energy) was a `1.25x` multiplier on the ring-scaled base rate instead of `Wand.java`'s real `Charger.recharge()` shape - a flat `+CHARGE_BUFF_BONUS(0.25) * remainder()` added on top, independent of the base rate. At typical missing-charge counts the flat bonus dwarfs the base rate (e.g. `+0.25`/turn vs a `~0.02-0.03`/turn base), so the old multiplier made Recharging far weaker than real Java - fixed to `baseRate + (buff active ? 0.25 : 0)`, `remainder()`'s "half benefit on the last partial turn" collapsed to the flat value since this port's buff countdown has no sub-turn fraction to read. Both browser-verified live via `window.__MWG__.currentScene`: `getActionTurnCostMod`/`getAttackTurnCostMod`'s ring math unaffected; `recoverWandCharge` now banks `~0.28`/turn (`0.02` base `+0.25`) with `recharging` active at 4 missing charges, versus the old formula's `~0.0375`. |
| **Shop pricing (`Shopkeeper.sellPrice`, `Item.value`)** | `src/shopPricing.ts` (`itemValue`/`getShopPrice`/`getSellPrice`/`buybackPrice`) | **Ported, replacing the old guessed table wholesale**: the old `~10%/depth x 1.5x/tier` curve and invented bases (potions 50, scrolls 30-50, rings 80) had no Java basis - now `sellPrice = value x 5 x (depth/5+1)` with the integer depth bracket (Java's own wealth modifier) and per-unit `value()` bodies verified class by class (potions/scrolls 30, upgrade/transmutation 50-known else 30, food 10, meat 5, bombs 15, runestones 15, seeds 10, sandbags 30, rings/wands 75 at shop-stand level/curse state). Selling to the keeper pays flat `value()` (the old 67%-of-shelf guess is gone). Ring/wand/armor/weapon full `value()` bodies (curse halving, level/tier scaling) are deliberately not reproduced - nothing prices them, since the sell side is food-only until a picker UI exists. |
| **Artifact definitions** | `src/items/artifacts.ts` `ARTIFACTS` array, `src/content/artifacts.mwl` | **Corrected 2026-09-13 - this row's own "all 10 SPD artifacts" claim was false.** Six of the ten previously listed here (`ArmbandsOfHerculaneum`, `CapstoneOfExecution`, `ChaliceOfBlood` was real but the other five plus `DemonSlayerArmor`/`PickaxeOfMining`/`MysteriousLocket`/`SandalsOfTime` were not) do not exist in Shattered Pixel Dungeon at all - zero matches in the real class roster or the generated message catalogue. See the full writeup in the "Weapons" section above (the row just above "Shop pricing"). Now authors exactly the genuine subset: `cloak`/`hourglass` (real, implemented) and `chalice` (real, unimplemented placeholder), name/description only - no charge fields, since no real artifact's charge mechanic is a flat number. |
| `MissileWeapon` base `min()`/`max()` | `CLASSES[id].special.damage` (warrior/rogue/duelist) | Ported |
| `MissileWeapon` durability (`MAX_DURABILITY`, `durabilityPerUse`, PinCushion sticking), per-type damage/uses, missile upgrade levels | `useSpecial`'s throw branch, `attack()`'s hit boolean, `ammoDurability`/`missileLevel`, `stuckAmmo` scatter in `kill()`, the `scrollUpgrade` missile branch | Ported, checked against tag `v3.3.8` (`MissileWeapon.java`, `ThrowingStone/Knife/Spike.java`, `RingOfSharpshooting.java`). Damage is the real tier-1 formula (`min 2+lvl`, `max 5+lvl`, rogue knives `max 6+2lvl`) plus Sharpshooting, with a real `missileLevel` (uncapped, upgraded via SoU after armor, resetting durability) rather than fixed per-class ranges. Durability is exact: per-type baseUses (stones/knives 5, spikes 12 - the duelist flat 10 had no basis) x `1.5^level` x durable-talent (`1.25+0.25/point`, now applied only while the talent is taken - a 2026-09-11 pass fixed it applying `1.25` even at rank 0, silently giving every hero +25% durability) x sharpshooting, rounded plus the `+0.001` epsilon, returning 0 once rounded usages reach 100 so the stack effectively lasts forever (same pass - the old code still wore it down by `100/usages`), decreasing ONLY on hits (misses just drop - the old code wore missiles down on misses too) with the real `about_to_break`/`has_broken` lines. PinCushion sticks surviving knives/spikes in living targets (stones are `sticky=false` and drop, as in Java) and scatters them as heaps on the kill. **Found and fixed alongside: the upgrade-failure log keys interpolated `{level}` while callers pass `{tier}`, rendering a literal `{level}` in-game.** Carried stacks carry their own level, set id and durability since 2026-09-16 (`src/missiles.ts`): merging runs through the framework's `(id, instanceId)` merge key, so same-set same-level stacks merge and anything else does not - the fungible-ammo simplification is reversed, and ROADMAP.md's dedicated item is closed. **`HeavyBoomerang.CircleBack` is now ported (2026-09-15)**, the last unported missile `proc()`: Java attaches the buff to the hero on a throw - unconditionally on a miss (`rangedMiss`) and on a hit only while durability remains (`rangedHit`) - carrying the cell it landed on, the hero's own cell at throw time, the depth, and `left = 5`; five hero turns later it flies home to that cell and resolves against whoever is standing there - picked up (`doPickUp`) if that is still the hero, thrown at them (`hero.shoot`, with `circlingBack` up so `HeavyBoomerang.adjacentAccFactor` returns its flat `1.5f`) if it is anyone else, and simply dropped if the cell is empty - with the countdown stalled while `returnDepth != Dungeon.depth`. The port's translation, given the single wielded pile: the thrown unit leaves the pile (so a boomerang in flight cannot be thrown twice), no heap is left where it landed, and the return gives the unit back, hits the squatter and drops the heap, or drops the heap on an empty cell. Only one return can be pending, matching Java overwriting the single per-char buff (`Buff.append` returns the existing instance and `setup` overwrites it). Persisted with the run, since Java's buff survives saves (`revivePersists`). Its pickup logs SPD's real `actors.hero.hero.you_now_have` line - no new port string, all 19 locales already carry it - which needed a name for the wielded missile that the mechanical `missileDefinitions` table has no column for, so `MWL_MISSILE_NAME_KEYS` reads it off the authored item nodes instead. Verified live (`tools/scratch/boomerang-return-livecheck.mjs`, 18 assertions, all passing): the throw takes the unit out of the pile and schedules `left = 5` at the right cells, four turns later it is still in flight and the fifth resolves it, the hero gets it back with the real line ("vous avez ramassé : gros boomerang." in the FR catalog), a squatter is hit and the heap lands on the return cell, an empty cell just gets the heap at the pile's own level/set, a return pending on another depth does not tick, and a pending return plus its pile survive a save/load round-trip. **Simplified**: there is no flight animation (Java animates a recycled `MissileSprite` over `trueDistance/20` seconds with an `AlphaTweener`), so the return is silent apart from its log line. **`Level.clearEntities(safeArea)`'s own `CircleBack` clause is ported where the port has an equivalent event (2026-09-15)**: Java cancels any pending return whose `activeDepth()` matches and whose return cell falls outside the transition's safe area, giving the boomerang back to `storedItems` (`HeavyBoomerang.java` 338-343) - i.e. **a rebuild of the map under the hero must not let the boomerang fly home onto a map it was not thrown on**. The port's equivalent map swap is the mining branch, which changes the whole map at the *same* depth and so is invisible to the `depth` gate the countdown uses; `enterMiningBranch`/`leaveMiningBranch` now cancel the pending return and put the unit back. Java's other caller is the Prison boss layout transitions (`clearEntities(tenguCell)` in FIGHT_START, `clearEntities(pauseSafeArea)` in FIGHT_PAUSE) - still not implemented, and **the reason this row used to give for that is stale**: it read "because `setMapArena()`/`setMapPause()` are not [ported]", and both are now live (`setMapArena()` 2026-09-15, `setMapPause()` 2026-09-16). The clause stands on its own terms instead, and is now owed at three repaints rather than two: all of them rebuild the map under the hero at the same depth, so the boomerang's own `depth` gate cannot see them, and a pending return can resolve against a map it was not thrown on. It needs the same treatment the mining branch already got - cancel a pending return whose cell falls outside the transition's safe area (`tenguCell` for FIGHT_START, `pauseSafeArea` for FIGHT_PAUSE). Live-verified with the three map-swap assertions in `tools/scratch/boomerang-return-livecheck.mjs` (21/21). **The "Sharpshooting's Aim-buff rework (stand-still charging)" this row used to list as remaining does not exist in Java** (checked `v3.3.8` and `4.0.0-beta`: `RingOfSharpshooting.Aim` is an empty `RingBuff` marker, and the ring's whole surface is `levelDamageBonus` - a flat bonus level added to both missile bounds and to `SpiritBow`'s min/max as `1x`/`2x` - plus `durabilityMultiplier` = `1.2^bonus`), and this port already implements exactly that through `ringBonusLevel`; the claim is dropped rather than left as pending work. **The upgraded-last-missile confirm is now ported (2026-09-12), and its "Yes" was fixed 2026-09-16** (it re-entered `useSpecial` with only the confirmation flag set, while that method consumes `specialTarget` as it resolves the target *before* the warning is raised - so "Yes" re-resolved from scratch and, with no other visible candidate, threw nothing at all: the livecheck's own "clicking Yes really throws" assertion was failing on a real bug, not on stale expectations. The resolved target is now handed back to the re-entry, which is what Java's `doThrow` gets).: `MissileWeapon.doThrow()` shows a `WndOptions` before throwing the last missile of a stack that would break on that throw, when the stack is worth warning about - Java's condition is `(levelKnown && level() > 0) || hasGoodEnchant() || masteryPotionBonus || enchantHardened`, plus `!extraThrownLeft && quantity() == 1 && durabilityLeft() <= durabilityPerUse()`. This port's ammo has no per-stack enchant/hardening/mastery state, so the reachable clause is the upgrade level; the rest maps one for one (`ammo === 1`, `ammoDurability <= missileDurabilityCost()`). The window is `showConfirmWindow` in `ui/portWindows.ts`, a real two-button `Window` on the scene's `WindowStack` (so MWG's own `blocker` holds the world while it is up), and "Yes" re-enters `useSpecial` with the confirmation latched rather than duplicating the throw branch. Its wording is SPD's own `break_upgraded_warn_desc/yes/no` in **all 19 locales**, pulled from tag `v3.3.8` rather than retyped (`tools/scratch/splice-lastmissile.mjs`), since the port's catalog predates the strings. Verified live (`tools/scratch/lastmissile-confirm-livecheck.mjs`, 7 assertions): the warning appears for an upgraded last missile one throw from breaking, the world cannot act while it is up, its "Yes" clicked through the real pointer path really spends the missile and hits the target, and a stack with several left, an unupgraded last missile and a durable one all throw without a window. (stand-still charging - the flat +level damage bonus matches an older Java, flagged for its own pass). The dust-pickup `UpgradedSetTracker` rule is now ported: scattered/missed heaps carry the pile's set at the current level, a missile upgrade records that set's threshold, and picking a heap below its threshold crumbles it with the real `dust` warning (`src/missiles.ts`, proved in the item suite; an empty pile adopts the heap's set the way Java wields the picked stack). Stated simplifications: sets are small sequential ids rather than Java's `SecureRandom` longs (no RNG draw); no extra `pickupDelay` spend on dust (the step is the turn cost); `extraThrownLeft` is modelled (`missileExtraThrownLeft`, warned in the sell window) while LiquidMetal's set-consumed bookkeeping and the Shopkeeper's tracker read have no expression here. The warning itself rides a `port.log.missiledust` key carrying SPD's own v3.3.8 wording and translations - the i18n extractor reads the local checkout's divergent working tree, which lacks the Java key, so the Java key is unusable (see `portStrings.ts`). Type-check/build/item suite green; browser verification owed per ROADMAP.md section 10. **The ranged accuracy factors are now ported (2026-09-15)**, closing a gap that had left *every* thrown weapon and the spirit bow rolling at flat accuracy: `MissileWeapon.accuracyFactor` is `Weapon.accuracyFactor * adjacentAccFactor`, and `adjacentAccFactor` is `0.5f` at melee range (`0.5f + 0.25f*pointsInTalent(POINT_BLANK)` for a hero - 0.75/1.0/1.25 - and a flat `0.5f` for anything else) and `1.5f` at any distance. SPD's own strings state it as "-30%/-10%/+10% at melee range, instead of -50%" and "+50% accuracy when used at a distance". `Hero.attackSkill()` folds the factor into the accuracy *stat* (`max(1, round(attackSkill * accuracy * wep.accuracyFactor(target)))`), so it lands on `acu` before the float draw, not on the roll - `rollHit`'s new sixth parameter, mirrored by `resolveAttack` and the scene's `attack()`, and the only callers that pass one are the two hero ranged paths (throw and spirit bow). Browser-verified live on the built game: a real throw passes 0.5 at Chebyshev 1, 1.5 at distance 2 and 3, 1.25 with Point Blank 3 adjacent, and 0.5 diagonally (Chebyshev adjacency, so distance 2 correctly gains nothing); over 600 real throws each, a 10-accuracy hero against a 5-evasion rat lands 0.528 adjacent and 0.822 at distance, against Java's predicted 0.5 and 0.833. `Weapon.accuracyFactor`'s own two terms were already modelled (`Wayward`'s `/5` in `syncHeroFromStats`, the over-STR `1.5^encumbrance` divisor in `rollHit`); a factor that would round accuracy below 1 is floored back to 1 as Java's `max(1, ...)` does, asserted in `verifyCombat`. **Not ported**: `SpiritArrow.accuracyFactor`'s Sniper + DAMAGE-augment clause (`Float.POSITIVE_INFINITY`, an unconditional hit - there is no bow augment system here), and Java's two monster-side readers of the same method (`Statue.attackSkill`, `MirrorImage`), which have no port-side caller because no ported monster throws missiles. |
| `WandOfMagicMissile.min()`/`max()` at `lvl = 0`, and `onZap`'s direct `ch.damage()` (no hit roll) | `CLASSES.mage.special`, `useSpecial`'s `'zap'` branch | Ported |
| `Wand` charges (`initialCharges`, `maxCharges = min(initial+level,10)`, staff +1) and `Charger` recharge | `wandCharges: Charges`, `spendHeroTurn`'s normalized recharge tick | Ported (counts and Java's `10 + 40*0.875^missing` delay, including Recharging's fractional bonus); old saves migrate their former turn-based progress |
| Wand class *names* (`items/wands/*.java`'s 13 classes) | `spdKeys.ts`'s new `WAND_KEYS`, `itemDisplayName`'s `wand` branch, `GROUND_ITEM_KEYS.wand` | **Ported, and this was a real display bug found in the 2026-09-11 wand pass.** An identified wand had no per-class name: `ITEM_KEYS.wand` is a single generic `port.name.wand` ("wand"/"baguette"), so all 13 classes - Magic Missile through Warding - displayed the same unidentified word, and `GROUND_ITEM_KEYS.wand` named every dropped wand "Wand of Magic Missile". `itemDisplayName` now reads `WAND_KEYS[wandType]` for an identified wand (unidentified keeps the generic word), and the ground kind is generic now that no call site has a class to read. `tools/i18nCheck.ts` validates all 13 against SPD's own `.properties` (the check went 287 -> 300 mapped keys), and the `items.mwl` wand catalogue nodes had three wrong keys for five tiers each (`wandoffirebolt` -> `wandoffireblast`, `wandofblast` -> `wandofblastwave`, `wandofprismatic` -> `wandofprismaticlight`) - dead data at runtime, since nothing reads those nodes, but wrong and now corrected. Verified live in the built game in French: `baguette de gel`, `baguette de souffle de feu`, `Baguette d'onde de choc`, ... (previously all "baguette"). |
| Names of the port's *minted* payload ids (`weaponReward`, `armorReward`, the ammo `stone`, and a carried `wand` it did not wield) | `items/catalog.ts`'s `WEAPON_NAME_BY_CLASS`/`ARMOR_NAME_BY_CLASS`, `itemDisplayName` | **Real display bugs, found and fixed 2026-09-16 while porting the Blacksmith reforge** (its new reward line names the reforged item, which is what exposed them). This port mints one id for every procedurally-generated weapon (`weaponReward`), every generated armor (`armorReward`) and every ammo stack (`stone`), and `item-rules.mwl` gives those three nodes generic name keys - so every generated weapon in the game read as "quest weapon", a stack of throwing knives read as throwing stones, an identified ring of an authored type was fine but any other ring id fell through to its raw id, and a wand *in the bag* was labelled with `scene.wandType`, i.e. as the *wielded* wand whatever class it actually was. `sourceClass` is the Java class every generated entry carries, so `itemDisplayName` now resolves through it: `WEAPON_NAME_BY_CLASS`/`ARMOR_NAME_BY_CLASS` (built from the same authored catalogue as the tier maps, so a class and its name key cannot drift), `WAND_KEYS[wandTypeFromSource(sourceClass)]` for a wand, and `MWL_MISSILE_NAME_KEYS` for an ammo stack. Verified live in French: `weaponReward` + `Shortsword` now reads "épée courte" (was "arme de quête"), `Handaxe` "hachette", `armorReward` + `LeatherArmor` "armure de cuir", a carried `WandOfFireblast` "baguette de souffle de feu" (was the magic-missile wand), and a `ThrowingKnife` stack "couteau de lancer" (was "pierres de jet"). Pinned in the item suite by `WEAPON_NAME_BY_CLASS`/`ARMOR_NAME_BY_CLASS` assertions. |
| `SpiritBow.min()`/`max()` at `hero.lvl = 0`, and its distance multiplier `min(3, 1.2 * 1.125^(distance-1))` | `CLASSES.huntress.special`, `useSpecial`'s `'shoot'` branch | Ported (including the corrected `distance-1` exponent) |
| Weapon enchantment/armor glyph *types* (`items/weapon/enchantments/`'s 13 + `items/armor/glyphs/`'s 13, plus 8 weapon curses + 8 armor curses) | `main.ts`'s `ENCHANT_TABLE`/`GLYPH_TABLE`, `src/itemCurses.ts` | **Correction to this row's own earlier warning: the "currently unreachable in actual play" caveat that used to stand here was itself stale** - see the dedicated "enchant/glyph/curse assignment" row directly below, which closed that gap (`rollGeneratedAffix` now assigns real affixes to generated gear), so every "Ported" claim in this row is reachable through normal play. Nine of 13 enchants have real proc logic written (Blazing/Chilling/Shocking/Vampiric/Grim/Lucky/Blocking/Swiftness/Unstable - Unstable delegates per swing, see this row's correction note), seven of 13 glyphs do (Stone/Thorns/Flow/Entanglement/Swiftness/Potential, plus the three curses below) - each chosen because its real effect fits a system this port already has (a buff, a flat stat delta, a ground-item drop, the flat `heroShield`), with a curve simplified to a flat roll where Java scales by weapon/armor level (Grim's execute chance, Lucky's ring-of-wealth tier) - except Blocking, whose real `(lvl+4)/(lvl+40)` proc-chance and `round(max(1,procChance)*(2+lvl))` shield-amount formulas are both reproduced exactly, **and - as of 2026-09-12 - Thorns, whose real `(lvl+2)/(lvl+12) x arcana` chance and `round((4+lvl) x max(1,chance))` `Bleeding` are now both exact too.** What stood here for Thorns was 2 points of instant damage with no roll at all, which fired on every hit the hero took and scaled with nothing; and Entanglement has left this "simplified duration" list as well, since it turned out to be the same `Earthroot.Armor` block pool as the plant rather than a root at all - see that row. Both were browser-verified live (Thorns: a 1-in-6 proc at level 0 setting Bleeding 4 and a 1-in-3 proc at level 3 setting 7, with no instant damage; Earthroot: 6 assertions). the shared `heroBarrier` pool it feeds into now decays every hero turn via `Barrier.act()`'s real proportional curve, and Blocking's own separate `BlockBuff` 5-turn cliff-edge expiry is now also approximated via a side counter (see the dedicated Barrier-decay row below for both). Swiftness glyph (0.8x turn cost when no enemies within 3 cells) applies its multiplicative turn-cost modifier, checking for nearby monsters using Chebyshev distance as a proxy for Java's pathfinding. **Correction: the old text here also described a 0.9x weapon "Swiftness enchant" - no such enchantment exists in real Java** (`Swiftness` is armor-glyph-only, checked tag `v3.3.8`); the phantom branch and table entry are removed, with pre-correction weapon ids dropped on load. Potential glyph procs on hit with chance (level+1)/(level+6) to recharge wands based on the armor level. Gear entries now have stable instance IDs in saves; equipping a second weapon, armor, or ring returns the previous instance to the bag. **Four more enchants were unconditional and wrong in effect until 2026-09-12** - `Blazing`, `Chilling`, `Shocking` and `Vampiric`, audited against tag `v3.3.8`: each now rolls Java's own level-scaled chance and applies Java's own effect, where they previously fired on *every* hit. `Blazing`: `(lvl+1)/(lvl+3) x arcana` (33/50/60%), then reignite an unlit target for `Burning` and spend the proc's leftover power on `NormalIntRange(1, 3 + scalingDepth/4) * 0.67` damage - it used to ignite with no roll and no burn damage at all. `Chilling`: `(lvl+1)/(lvl+4)` (25/40/50%), adding `3 x max(1,chance)` turns of `Chill` capped at `6 x max(1,chance)` in total - it used to apply **`daze`**, the wrong status entirely. `Shocking`: a flat 1/3, then Java's recursive `Shocking.arc()` chain (every other char within 2 *path* cells, chaining onward at radius 2 in water and 1 elsewhere, the attacker and the defender both excluded from the damage) for `round(damage/2 x max(1,chance))` each - it used to deal 2 unconditional points **to the defender itself**, the one character Java's arc never touches. `Vampiric`: `(0.05 + 0.25 x missing-HP fraction) x arcana`, healing `round(damage/2 x max(1,chance))` capped by the attacker's missing HP against a non-neutral target - it used to heal a flat 1 with no roll, no damage scaling and no target check. Browser-verified live over 1500 hits each: proc rates 0.349/0.246/0.340/0.165 against Java's 1/3, 1/4, 1/3 and 0.175 at half HP; the arc damaged the neighbour for exactly 5 (`round(10/2)`) and the defender for 0; `Chill` capped at 6; and nothing healed at full HP. **Weapon.Augment** (SPEED/DAMAGE/NONE via `StoneOfAugmentation`) **is now genuinely ported, closing out a three-pass history worth reading in full before trusting a future "done" claim elsewhere in this file**: pass 1 wrongly called it blocked; pass 2 correctly un-blocked the turn-cost prerequisite but wrongly declared the whole feature "wired" without checking for an actual `weaponAugment =` assignment anywhere outside the save-restore line (there wasn't one - the formulas were real but completely unreachable); this pass built the missing half. `generatedInventoryItem`/`sourceInventoryItem` now special-case `StoneOfAugmentation` to its own `stoneOfAugmentation` id (previously it silently collapsed into the generic `'stone'` id shared by every other of the 12 real runestone types - `StoneOfEnchantment`/`Intuition`/`DetectMagic`/`Flock`/`Shock`/`Blink`/`DeepSleep`/`Clairvoyance`/`Aggression`/`Blast`/`Fear` all still did at the time, a real, wider "not ported" gap noted here but not closed then - see the follow-up passes below, which have since closed Fear/DeepSleep/Shock/Blast; this row's own list originally misnamed the 12th type "StoneOfDisarming", which does not exist in real SPD - the actual 12th type is `StoneOfDetectMagic`, corrected here). A new `useStoneOfAugmentation()` bag-use action consumes the stone and opens `augmentChoiceOpen`, a new flag threaded through the same handful of gate conditions the existing armor-ability/subclass level-up choice panel already uses (`talentOpen`'s toggle logic, the action-blocking gate, the panel-render branch), with its own full-width stacked-button layout (that panel's existing 2-column layout is too narrow for Augment's longer option text, which was already sitting in `portStrings.ts` unused before this pass). `chooseAugment()` sets `weaponAugment` and logs via the pre-existing `port.log.augmentchosen`/`port.ui.augment.*` keys (found missing from French entirely - fixed as a small aside, closing 5 of the 10 `i18nCheck.ts` failures this repo already tracks). Auto-targets the hero's own equipped weapon rather than presenting Java's real item-picker, the same auto-target convention `ScrollOfIdentify`/`ScrollOfRemoveCurse` already use for "act on one item" actions this port has no generic picker for. **Deliberately not reproduced**: real Java's stone also grants a genuine bonus weapon-upgrade level via `ScrollOfUpgrade.upgrade()` alongside the augment choice - this port's own upgrade path is tier-based (`upgradeGear`'s `weaponTier`/`weaponLevel` split) with no free-standing "+1 level" primitive to borrow without unexpectedly perturbing that tier state machine, so only the augment choice itself is reproduced. **Also fixed in passing**: `groundKindForItem` had no case for `'stone'`/`'stoneOfAugmentation'` bag ids at all, so a generated runestone dropped as ordinary floor loot fell through to the caller's fallback (`'food'` at the one real call site) instead of rendering/behaving as a stone - a real, pre-existing bug, not introduced by this change. Browser-verified live end-to-end (a fresh, unrelated `spawnMonster`/`enterLevel` `TypeError` reproduced twice from rapid synthetic pointer events, then NOT on a slower-paced retry, further supporting ROADMAP.md section 10's existing "load-order race, not a real code path" theory rather than anything to do with this change): using the stone opened a real French panel ("Choisir un augment d'arme" / "Vitesse (+20 % de vitesse d'attaque)" / "Dégâts (+20 % de dégâts)" / "Aucun"), choosing Speed set `weaponAugment` to `'speed'`, closed the panel, logged the correct interpolated message, and immediately changed `getActionTurnCostMod()` from `1` to the real `0.8`. **Curse proc logic:** 12 of 16 curses (8 weapon + 8 armor) now have real proc branches in `main.ts` - weapon: `wayward`, `annoying`, `dazzling`, `explosive`, and (added this pass) `polarized` (exact - a flat 1/2 roll between 1.5x damage and a whiffed 0, needing no new subsystem at all), `sacrificial` (reuses the shared poison DoT in place of a dedicated Bleeding buff, magnitude curve lost), and `displacing` (reuses the same free-cell teleport search as the `displacement` armor curse); armor: `fragile`, `metabolism`, `antientropy`, `corrosion`, `multiplicity`, `overgrowth`, `bulk`, `displacement`. **2026-09-12, second curse pass - the four original weapon curses were resolved on the wrong side of the fight, and three of the four were also wrong in effect.** `explosive`/`dazzling`/`annoying`/`wayward` all lived in `mobOnHit`, whose `attacker` is a *monster*, so a cursed weapon never procced on the hero's own swing and instead fired whenever the hero was hit - not what `Weapon.Enchantment.proc(weapon, attacker, defender, damage)` does (it runs on the wielder's attack; `sacrificial`/`displacing`, correctly placed in `attack()`'s own path, are what made the anomaly visible). All four now sit in `heroOnHit`, keyed off the same `affix` local the enchants use. **Explosive** called `applyTrapBlast` - the unrelated explosive-*trap* formula (`5+depth .. 10+2*depth`, off-centre x0.67) - at the defender's *own* cell and skipped the hero entirely, where `ExplosiveCurseBomb` is a bare `Bomb.ConjuredBomb`, i.e. plain `Bomb.explode()`: the cell is the adjacent non-solid cell *closest to the attacker* (with the two adjacent, the attacker's own cell), the damage is `NormalIntRange(4 + scalingDepth, 12 + 3*scalingDepth)` minus armor on every char within a distance-1 flood, and the hero is included because a bomb does not discriminate - which is exactly why a cursed weapon hurts its own wielder. A new `curseExplosiveBlast` reproduces that, approximated as a Chebyshev circle and Java's `!solid` folded into `passable` exactly like `useStoneOfBlast`/`detonateGroundBomb` already are, and the fuse now resets by `durability += 100` rather than `= 100`, matching Java's own note that a negative durability makes explosions come in succession. **Dazzling** dazed the hero unconditionally (its test asked whether the hero could see *itself*, vacuously true), filtered monsters by the hero's FOV rather than by whether the defender was visible, and dispelled the hero's invisibility - which is `Annoying`'s `Invisibility.dispel()` line, not Dazzling's; it now blinds the hero only when the hero's FOV actually holds the defender's cell (10 turns, Java's `Blindness.DURATION`), other visible creatures for half that (`Blindness.DURATION/2`), and leaves invisibility alone. A monster's own FOV is still unavailable in this port (no per-creature grid), so "can see the defender" for a mob stays approximated by the hero's map vision of that mob - stated rather than hidden. **Wayward** was the largest divergence: a flat, permanent -3 accuracy for merely owning the weapon, where `Wayward.proc` is a `1/4 x arcana` roll that *toggles* a 10-turn `WaywardBuff` (detaching it when already up - that branch rolls nothing) and `Weapon.accuracyFactor` divides the wielded weapon's `ACC` (1 for every ordinary weapon) by 5 while it is up, multiplying the hero's whole attack skill (`Hero.attackSkill()` is `max(1, round(attackSkill * accuracy * accuracyFactor))`). The port therefore gained a real `wayward` buff id (authored in `buff-rules.mwl`, `NEGATIVE` like Java's, 10 turns) that gates a `/5` on `hero.accuracy` in `syncHeroFromStats`, replacing the flat dock at both of its old sites. Browser-verified live, 20 assertions: zero curse procs from `mobOnHit` across 400 monster swings; Annoying proccing on the hero's own attack at 0.065 over 600 swings while still dispelling invisibility; a visible bystander blinded for exactly 5 turns while a monster the hero could not see (and the hero itself, which could not see the defender) stayed undazed, and the hero blinded for exactly 10 when it could; a wayward weapon leaving accuracy at its base 11 with no buff, dropping to exactly `round(11/5) = 2` while the buff was up, the very next hit toggling it off and restoring 11, at a 0.251 rate over 2000 swings; and an Explosive detonation damaging its own wielder on all 300 trials, reaching exactly the bomb ceiling `12 + 3*depth = 15` on the defender against the old form's `10 + 2*depth = 12` ceiling, dealing 0 to a bystander at Chebyshev 2 from the hero that a defender-centred blast would have caught, with the fuse landing on 90-100 after each detonation and draining normally otherwise. **Correction 2026-09-12: the "not ported" list that stood here had gone stale on every entry.** `Friendly`'s two-way Charm subsystem, Corrupting's enemy-conversion and Elastic/Projecting's geometry are all implemented in this port now - Corrupting converts a lethal hit into a permanent ally behind Java's own `damage >= defender.hp` guard, Elastic shoves the defender out along the attack line on `(level+1)/(level+5) x arcana`, Projecting's extra reach is real - and so is Kinetic (below), which the same list named. What that stale list was actually hiding is the one thing it never mentioned: **Elastic was missing from `Unstable`'s delegate list**, so an Unstable weapon could never delegate to it. Fixed, with Java's array order restored alongside it (Kinetic and Corrupting were swapped), and guarded both ways: the item suite asserts the authored list equals Java's array exactly, and `tools/scratch/unstable-delegates-livecheck.mjs` drives 440 real swings and sees all eleven delegates fire. Rows below that repeat the old "needs a subsystem" claims are corrected in place; **Correction this pass, audited against `Unstable.java`/`Kinetic.java`/`Char.java`: Kinetic is now exact (kill-overkill store `round(overkill x arcana x berserk-catalyst)` replacing the old add-half-of-every-hit, real `2.5%/turn min 0.1` float decay replacing the flat `x0.75`, `ceil` read-back) and Unstable is now ported (uncommon table entry, per-swing `Random.element` over Java's `randomEnchants` array in Java's own order - Projecting excluded per Java's own comment, Unstable itself never listed - one shared pick across the pre- and post-damage proc halves, Kinetic's conserved read-back flowing through the delegation); Blooming/Camouflage left this list in earlier passes.** **That "7 remaining glyphs" sentence is stale too (checked 2026-09-12)**: `main.ts` has live branches for Affection, AntiMagic, Brimstone, Camouflage, Obfuscation, Repulsion and Viscosity, plus Stench, Entanglement, Flow, Potential, Thorns, Stone, Swiftness, Bulk, Metabolism, AntiEntropy, Corrosion, Multiplicity, Overgrowth and Displacement - 21 of the 26 ids Java ships across glyphs and armor curses. What genuinely remains is per-behaviour, not per-subsystem, and is tracked in the rows below rather than as a list here. **Two more runestones ported in a follow-up pass, the same rename-plus-use-action pattern `StoneOfAugmentation` established**: `StoneOfFear` -> `stoneOfFear` (a new `useStoneOfFear()`) and `StoneOfDeepSleep` -> `stoneOfDeepSleep` (`useStoneOfDeepSleep()`), each auto-targeting the nearest visible enemy the same way `useSpecial`'s ranged attacks already do, since this port has no map-click cell-targeting for a thrown item's real Java aim (and no ally-vs-monster combat to make `StoneOfFear`'s real ally-vs-enemy distinction observable anyway). `StoneOfFear` grants the `terror` buff `ScrollOfTerror` already applies and `takeMonsterTurn` already honors in full - a pure new-access-path, zero new mechanic. `StoneOfDeepSleep` reuses the exact instant-`sleeping = true` simplification `ScrollOfLullaby` already uses in place of real Java's gradual `MagicalSleep`/`Drowsy` debuff, just against one target instead of every visible mob - the same simplification, not a new one invented for this stone. Both wired through `generatedInventoryItem`/`sourceInventoryItem`/`groundKindForItem` alongside Augmentation's existing special-cases, and given the same generic stone icon frame the inventory panel already uses for Augmentation (no dedicated per-type art in this port, same economy as the single shared wand/cloak-artifact icons). Browser-verified live: adding a fresh `stoneOfFear` and using it against a test target set `buffs.terror = 20` and decremented the bag stack by exactly 1 in one atomic check (an earlier, sloppier cross-call check had appeared to show no decrement at all, which turned out to be read/write ordering noise from the live game loop between separate tool calls, not a real bug - a single atomic before/after check resolved it cleanly); `stoneOfDeepSleep` flipped `sleeping` from `false` to `true` the same way; the inventory panel's item-detail popup rendered "stoneOfFear" and the real Java `items.stones.inventorystone.ac_use` label correctly in Korean. **A third runestone, `StoneOfShock` -> `stoneOfShock` (`useStoneOfShock()`), ported in the same follow-up pass**: real Java paralyzes every char within a `PathFinder` distance-2 flood fill of the thrown-to cell (`Buff.prolong(n, Paralysis.class, 1f)`, a 1-turn paralysis) and refunds `curUser.belongings.charge(1 + hits)`. This port approximates the area as a plain Chebyshev-distance-2 circle around the same auto-targeted nearest-visible-enemy ground zero (ignoring walls, unlike Java's real flood fill) and applies this port's existing shared 3-turn `paralysis` buff rather than a bespoke 1-turn variant (`addBuff`/`BUFF_DURATION` has no per-call duration override) - both stated simplifications. The wand-charge refund itself is exact, reusing the already-generic `Actors.Charges.refund` (harmless no-op for non-wand classes, matching Java's own generic, mostly-inert `Belongings.charge()`). Browser-verified live: draining a hero's wand charges to 0 and using a fresh `stoneOfShock` against two adjacent test targets applied `paralysis: 3` to both and raised the wand's charge count back up (capped at its real max of 4, since `1 + hits` exceeded the remaining headroom); the log line rendered its interpolated hit count correctly ("Lightning arcs out, paralyzing 3 nearby foes."). **A fourth runestone, `StoneOfBlast` -> `stoneOfBlast` (`useStoneOfBlast()`), ported in a follow-up pass**: real Java's `activate()` is just `new Bomb.ConjuredBomb().explode(cell)` - a `PathFinder` distance-1 flood fill dealing `NormalIntRange(4 + scalingDepth, 12 + 3*scalingDepth)` damage minus armor to every char caught, hero included (a bomb does not discriminate), plus destroying flammable terrain and triggering/destroying caught heaps. This port reuses `StoneOfShock`'s own Chebyshev-distance-circle approximation (radius 1 here, matching `Bomb`'s real `explosionRange()`), substitutes `this.depth` for `scalingDepth` (the same substitution every other depth-scaled formula in this file already makes), and routes the hero's own share of the blast through the existing `absorbHeroDamage`/`kill` path the same way `applyTrapBlast`'s hero branch already does for the unrelated `ExplosiveTrap` formula. **Not reproduced**: the terrain-destruction/heap-triggering half of the real explosion - no equivalent call from an item-use site exists in this port, a real, narrower gap left honest rather than faked. Browser-verified live: placing the hero adjacent to a 500-HP test target and using a fresh `stoneOfBlast` dealt 9 damage to the hero (from full HP) and 8 damage to the adjacent target, while a second target 6 cells away took none, confirming both the radius cutoff and the hero's own inclusion in the blast; the bag stack decremented by exactly 1. **Two more runestones, `StoneOfBlink` -> `stoneOfBlink` (`useStoneOfBlink()`) and `StoneOfClairvoyance` -> `stoneOfClairvoyance` (`useStoneOfClairvoyance()`), ported in a follow-up pass, bringing 7 of 12 runestone types real.** `StoneOfBlink`: real Java's `activate()` calls `ScrollOfTeleportation.teleportToLocation(curUser, cell)` on a player-aimed thrown-to cell - a short, precise, chosen hop, distinct from Teleportation's own full-level random jump. With no map-click cell-targeting (the same reason every combat stone above auto-targets instead of aiming), this port reuses the exact `randomFreeCell` placement its own `ScrollOfTeleportation` already uses rather than inventing a second "aim-like" strategy - the real distinction between Blink's short aimed hop and Teleportation's full random jump is lost, both collapsing to the same uniformly-random free cell. `StoneOfClairvoyance`: real Java marks every cell within a real `DIST = 20` `ShadowCaster`-diamond around the thrown-to cell `mapped`, plus reveals secret terrain caught in that area - a smaller, localized cousin of the already-ported `ScrollOfMagicMapping`'s whole-floor `revealAll()`. With no cell-targeting, this port centers on the hero's own position instead (the natural default absent aiming, unlike the combat stones' nearest-enemy convention), and reproduces the same DIST=20 as a plain Chebyshev circle (ignoring walls) by adding each cell directly to `FieldOfView.explored` (a public, mutable `Set`) rather than calling the whole-level `revealAll()`. Browser-verified live: using a fresh `stoneOfBlink` moved the hero from `(6,16)` to `(16,13)` in one action; using a fresh `stoneOfClairvoyance` grew `fov.explored.size` from 54 to 832 (the floor's full `cellCount` - this port's small Sewers-sized levels fit entirely within a 20-cell radius of the hero) and rendered the previously-fogged room fully visible on screen; both logged correct French text (Blink reusing the real Java teleport key, Clairvoyance a new port string), and the inventory popup showed "stoneOfBlink" with the correct "UTILISER" action label. The remaining 5 runestone types (Enchantment/Intuition/DetectMagic/Flock/Aggression) stay unported and still collapse to the generic `'stone'` id - Enchantment/Intuition/DetectMagic all need a real item-picker UI this port doesn't have (same blocker as `ScrollOfTransmutation`), Flock needs ally-spawning, Aggression's redirection buff is mostly moot without ally-vs-monster combat. **Correction this pass - the first three are now ported (10 of 12 real), first consumers of the new generic `openItemPicker`/`chooseItemPicker` panel**: `StoneOfEnchantment` imbues a picked bag `weaponReward`/`armorReward` with a random good affix (`ENCHANT_TABLE`/`GLYPH_TABLE` via the existing `rollGeneratedAffix`, overwriting like Java's own `enchant()`); `StoneOfIntuition` runs the real two-stage guess (unidentified potion/scroll/ring, then its still-unknown classes shown by true name, class-level identify of every same-id instance on a correct guess) with the real alternating free/paid `IntuitionUseTracker` rule (kept as a persisted run flag, since numeric buffs tick down); `StoneOfDetectMagic` marks a picked equipable/wand cursed-known and reports the real none/both/good/bad verdict from its curse/level/affix inputs. All three checked against tag `v3.3.8` (`StoneOf*.java`, `ScrollOfEnchantment.enchantable()`, `InventoryStone`). Stated simplifications: bag-only picker (equipped gear excluded, same as Transmutation); no exotic classes in the Intuition decks; single-id wand carries no level, so it reports curse state only; "unknown" means no identified bag instance (consumed knowns read unknown again - no run-level `Handler`); no select-then-confirm step (a guess row confirms); `Talent.onRunestoneUsed` has no expression; the dead `preserved`/`break` catalog keys stay unused (`break` is referenced nowhere in Java). Also fixed alongside: all 10 stone ids now resolve real catalog names in `ITEM_KEYS` (previously every stone rendered its raw id), and the generated catalog's missing `stoneofdetectmagic` keys (it even holds a phantom `stoneofdisarming` set instead) are covered by verbatim-Java `port.*` keys. Only Flock/Aggression remain, both needing ally combat. Type-check/build/simulation/item suites green; browser verification owed per ROADMAP.md section 10. **2026-09-09 item-system audit, four real bugs found and fixed:** (1) **Weapon.Augment's own formulas were wrong**, not just its wiring (already fixed in the pass above) - fetched `Weapon.java`'s real `Augment` enum (tag `v3.3.8`): `SPEED(0.7f damageFactor, 2/3f delayFactor)`, `DAMAGE(1.5f damageFactor, 5/3f delayFactor)`, both trading damage against attack speed in *each* direction. This port previously modeled only DAMAGE's beneficial half at the wrong number (`1.2x`, not `1.5x`) and applied SPEED's delay (`0.8x`, not the real `2/3`) to the *blanket* `getActionTurnCostMod()` instead of the attack-only `getAttackTurnCostMod()` - meaning an equipped Speed-augmented weapon was silently speeding up hero movement/search/item-use too, which real Java's `attackDelay()`/`Char.speed()` split never does (the port's own doc comment on `getAttackTurnCostMod` already stated this exact split for Furor, making this an internal inconsistency, not just a Java mismatch). Fixed: `attack()` now applies `0.7x`/`1.5x` to damage for SPEED/DAMAGE respectively, and `getAttackTurnCostMod()` multiplies in the weapon's `2/3`/`5/3` delay factor - `getActionTurnCostMod()` no longer touches `weaponAugment` at all. Browser-verified live: `getActionTurnCostMod()` stays `1` regardless of augment; `getAttackTurnCostMod()` reads `0.6667`/`1.6667` for speed/damage. (2) **`useStoneOfBlast` mutated `this.creatures` while iterating it** (`for (const c of this.creatures)` calling `this.kill(c, ...)`, which splices the array mid-loop) - with 3+ creatures caught in one blast, a creature could silently dodge damage entirely as JS's default iterator skips whatever shifted into the just-visited index, the same failure class `detonateGroundBomb` already guards against with a `[...this.creatures]` snapshot; `useStoneOfBlast` now does the same. (3) **Kinetic/Unstable's conserved-damage read-back was wrongly gated**: `Unstable.proc()` (`Unstable.java`) reads back and clears any stored `Kinetic.ConservedDamage` unconditionally on *every* Unstable swing, before delegating to a random enchant - this port instead gated the read-back on `kineticTrackerHit` (true only when the delegate happened to redraw Kinetic, ~1/9 of swings), silently withholding the stored bonus the other ~8/9 of the time. Fixed by splitting the two concerns: `kineticTrackerHit` still arms this swing's kill-storage (unchanged, correct), but the read-back now fires whenever `weaponAffix` is `'kinetic'` or `'unstable'`, independent of this swing's delegate. Browser-verified live via `window.__MWG__.currentScene`: forcing an Unstable weapon with 10 stored damage read the bonus back on the very first synthetic swing even though `unstableDelegated !== 'kinetic'`. (4) **Blocking's proc used the raw stored weapon level instead of the Degrade-adjusted `buffedLvl()`** real `Blocking.java` reads for both its proc chance and shield magnitude (Blooming's `Blooming.java` has the identical `buffedLvl()` read and had the same gap) - a Degrade-hit weapon procced/shielded as if undegraded. Both now route through the existing `degradedLevel()` helper. Browser-verified live: with a `degrade` buff active and `weaponLevel = 10` (`degradedLevel(10) = 5`), a forced Blocking proc granted a shield of exactly `round(1 * (2+5)) = 7`, matching the degraded formula (the undegraded formula would have given `12`). All four fixes verified with a clean `tsc --noEmit`, `npm run build`, and both test suites green. |
| **Enchant/glyph/curse assignment - was completely unwired, now closed.** `Actors.rollAffix` was defined for but never called on `ENCHANT_TABLE`/`GLYPH_TABLE` - confirmed by a whole-repo search the same session this was found and fixed. `generatedInventoryItem` (the single choke point behind `generatorRandom()`'s ground-item spawns, the hero's Ghost-quest/Statue/crystal-room rewards, and `dropGeneratedStatueItem` - all three call sites route through it) now calls a new `rollGeneratedAffix(table, cursed, hasGoodEnchant)` helper: when `generated.cursed` it picks uniformly from the table's curse-only entries (mirroring Java's `enchant(Enchantment.randomCurse())` -> `Random.element(curses)`), when `generated.hasGoodEnchant` it weight-picks from the non-curse entries (mirroring `Enchantment.random()`'s `chances(typeChances)`), and sets neither otherwise - a fresh, gameplay-only `Random` roll, since `generator.ts`'s own RNG-faithful flags deliberately stop short of the concrete Generator-internal identity (same "burn the real call, substitute a fresh roll for the unreproducible content" convention already used throughout `spdLevelGen/`'s room-content rolls). `ENCHANT_TABLE` gained the 6 curse ids that already had real proc logic but no table entry (`annoying`/`dazzling`/`explosive`/`polarized`/`sacrificial`/`displacing`, alongside the existing `wayward`); `GLYPH_TABLE` gained all 7 remaining armor curses (`antientropy`/`bulk`/`corrosion`/`displacement`/`metabolism`/`multiplicity`/`overgrowth`, alongside the existing `fragile`) - every curse with real proc logic can now actually be assigned. `src/itemCurses.ts`'s `getCurse` now has a real call site too: `equipWeapon`/`equipArmor` gained Java's real cursed-and-known equip-lock (`EquipableItem.doUnequip()`) - a currently-equipped cursed weapon/armor can no longer be swapped away, matching the equivalent lock this port's rings already had (`equippedRing.cursed`) but weapons/armor never did; the cleanse-scroll handler was broadened from hardcoded `wayward`/`fragile` checks to `getCurse(...)`, so it now lifts *any* equipped curse, not just those two. Also fixed in passing: `port.log.weaponequipped`/`armorequipped`/`ringworn`/`ringalready`/`ringcursed` were all called via `t()` with no matching entry in `portStrings.ts` (EN or FR) - a separate, pre-existing i18n gap discovered while adding the new `weaponcursed`/`armorcursed` keys these locks needed; all seven now have real translations in both locales. **Browser-verified live**, after root-causing the earlier server failures: every port tried before (8934-8968, 8869-9068, etc.) fell inside a Windows dynamic-port-exclusion range (`netsh interface ipv4 show excludedportrange protocol=tcp`), not a sandbox restriction - port 8000 binds fine, and `chrome-devtools-mcp` (CDP-direct, not the Chrome-extension bridge) reached it. Confirmed live in a running French-locale session via `window.__MWG__.currentScene`: (1) calling `generatedInventoryItem` directly for `cat=0`/`cat=6` with `cursed:true` over 3000 trials rolled all 7 weapon curses and all 8 armor curses at the expected uniform rate, and with `hasGoodEnchant:true` rolled all 9 weapon enchants and all 6 armor glyphs at the expected weighted rate, with zero unexpected affixes when neither flag was set; (2) equipping a cursed weapon (`annoying`) then attempting to equip a different one was actually blocked in-game, with the correct on-screen message "Impossible de retirer cette arme : elle semble maudite !" (confirming the new `weaponcursed` FR string resolves, not a raw key); (3) clearing the curse released the lock and the swap then succeeded; (4) `heroBarrier` with 20 shielding dropped by exactly 1 on the first `spendHeroTurn()` tick with `barrierPartialLoss` resetting to 0, confirming last session's Barrier-decay fix live as well. Also noticed live and fixed in the same pass: the depth-entry log line was printing a raw untranslated key (`"Vous êtes guerrier, arme en main : port.name.wornshortsword."`) - `classes.ts`'s `weaponKey` for 5 of 6 classes (`wornshortsword`/`magesstaff`/`dagger`/`gloves`/`rapier`; only the Cleric's `cudgel` had a real entry) had no matching `portStrings.ts` key in either locale. Added all 5 in both EN and FR; re-verified live afterward (`"Vous êtes guerrier, arme en main : une épée courte usée."`). **2026-09-11 (MWG 0.7.2):** the affix catalogue moved from a hand-split `set=` positional trait to MWG typed MWL tables (`[table]`/`[row]` in `affix-rules.mwl`), so the framework validates column shape and coerces each cell; `mwlContent.ts`'s hand parser and `compile-mwl.mjs`'s `validateAffixTables` are gone, and `rollGeneratedAffix` now uses `Actors.rollAffix`'s own `curse` option instead of filtering entries itself. Browser-verified on 0.7.2: the roll distribution is identical (13 good/7 cursed weapon ids, 13 good/8 cursed glyph ids, none when ineligible). |
| `Repulsion.proc()` (armor glyph: chance-scaled knockback of an adjacent attacker) | `attack()`'s post-hit armor-glyph branch + `moveTo` | Simplified but playable: the real `(buffedLvl+1)/(buffedLvl+5) x Arcana` chance and `round(2 x max(1, chance))` straight shove are reproduced for a defending hero, stopping at walls/occupants and preserving the port's flying/chasm/piranha movement rules. Java uses `Ballistica`/`WandOfBlastWave`; the port reuses its existing direct shove path. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Brimstone.proc()`/`Char.isImmune(Burning)` (armor glyph: fire immunity) | `Creature.fireImmune`, `syncHeroFromStats`, `addBuff` | Ported: the equipped Brimstone glyph sets the same immunity at the shared buff boundary, so traps, fire blobs, wands, plants, and monster attacks cannot attach `burning`. Java's glyph proc itself is intentionally empty; the effect lives in `Char.isImmune()`. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Viscosity.proc()`/`DeferedDamage.act()` (armor glyph: defer part of incoming damage) | `absorbHeroDamage`, `Creature.deferredDamage`, `spendHeroTurn` | Ported for the hero: Java's level/Arcana-scaled split, one-turn delay, and `max(1, floor(pool*0.1))` damage drain are reproduced at the shared incoming-damage boundary, including save/load state. The scheduled tick bypasses Viscosity recursion while still using shields and HP. The Java `WarriorFoodImmunity` exception is not modeled because that talent is absent. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Affection.proc()`/`Charm.object` (armor glyph: charm the attacker toward the wearer) | `attack()`'s charm target check, `mobOnHit`'s Affection branch | Ported: the real `(buffedLvl+3)/(buffedLvl+20) x Arcana` proc and `round(10 x max(1, chance))` duration are applied to the attacker, with the existing target map making subsequent attacks against the wearer deal zero damage. Heart particles are presentation-only. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `AntiMagic.drRoll()`/`Char.damage()`/`Char.isImmune()` (armor glyph: reduce listed magical damage and statuses) | `absorbHeroDamage(amount, magical)`, `zapHero`, `eyeBeamTurn`, `Creature.magicImmune`, `addBuff` | Ported for the represented magical ranged sources: the Java level/Arcana-scaled `NormalIntRange(level, 3+1.5*level)` reduction is applied before shields, and `Charm`/`MagicalSleep`/`Weakness`/`Vulnerable`/`Hex`/`Degrade` are rejected at the shared buff boundary. The port marks its explicit magic-bolt/death-gaze callers; unrepresented Java spell/bomb/trap source classes remain outside this seam. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Obfuscation.stealthBoost()`/`Char.stealth()` (armor glyph: harder detection) | `heroStealth()`, sleeping-monster detection | Simplified but functional: the exact `(1+level/3) x Arcana` stealth value now participates in Java's sleeping detection roll `1/(distance+stealth)`. The port's non-sleeping `seesHero` remains FOV-binary because it has no separate Java Wandering detection state. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `ChampionEnemy.Giant/Projecting.canAttackWithExtraReach()` | `takeMonsterTurn` extra-reach branch | Ported with geometry simplification: Giant attacks at clear-line range 2 and Projecting at clear-line range 4, matching Java's maximum ranges and existing damage factors. Java uses a path-distance map that can reach around walls; this port's `Roguelike.canTarget` requires a clear line. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Weapon.Projecting.reachFactor()` (weapon enchantment) | `takeHeroTurn` directional reach scan | Ported with input simplification: the real `1 + round(Arcana)` melee reach is applied along the player's chosen direction, stopping at the first wall/door/occupant. Java selects an arbitrary valid target cell through its targeting UI; this port has directional movement input instead. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Corrupting.proc()` (lethal weapon enchant converts a Mob into a healed controlled ally) | `attack()`'s pre-damage Corrupting branch | Simplified but playable: the real `(buffedLvl+5)/(buffedLvl+25) x Arcana` lethal proc now fully heals the target, clears negative buffs, prevents the killing damage, and converts it into the existing scheduled ally model. The port has no separate Corruption buff/loot-transfer payload, so the converted actor uses the existing ally combat state; no additional loot is generated. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Elastic.proc()` (chance-scaled knockback beyond the struck cell) | `heroOnHit`'s `elastic` branch, `moveTo` | Simplified but playable: the real `(buffedLvl+1)/(buffedLvl+5) x Arcana` chance and `round(2 x max(1, chance))` shove distance are applied to melee targets along the attack axis, stopping at blocking cells and using the existing chasm/piranha movement rules. Java's Ballistica/BlastWave projectile-vs-melee distinction is represented by limiting the shove to the real hero bump-attack path; missile and SpiritBow attacks do not push. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Blooming.proc()`/`plantGrass()` (uncommon weapon enchant: `(lvl+1)/(lvl+3)` chance, `(1+0.1*lvl)` plants, defender-first/shuffled-neighbour order) | `heroOnHit`'s `blooming` branch + `plantBloomingGrass()` | Ported with stated substitutions: EMPTY/EMPTY_DECO/EMBERS have no ids in this port's terrain, so FLOOR+GRASS are the plantable set; FURROWED_GRASS (and HIGH_GRASS-under-Regeneration, a well-water state not modeled) collapses straight to HIGH_GRASS; occupancy reuses the live plant-marker maps; leaf-burst particles have no seam (a log line stands in). Real common/uncommon/rare rarity confirmed against `Weapon.java` (`Blooming` is uncommon -> weight 2, matching the table's existing common-3/uncommon-2 convention). Type-check/build/tests only; browser verification owed per ROADMAP.md section 10. |
| `Camouflage.activate()` (uncommon armor glyph: `round((3+lvl/2) x arcana)` Invisibility on grass trample) | `trampleHighGrass`'s `camouflage` branch | Ported, keep-max (`Buff.prolong` semantics) via a direct buff-map write (the freerunner precedent, since `addBuff` only grants fixed durations). Java's MELD sound has no per-effect audio seam here - the log line stands in. Uncommon -> weight 2 per `Armor.java`. Type-check/build/tests only; browser verification owed per ROADMAP.md section 10. |
| `Stench.proc()` / `StenchGas.evolve()` (armor curse: 1/8 x arcana to seed 250-volume gas at the wearer's feet) | `mobOnHit`, `stenchGas`, `applyEnvironmentalBlobs` | Ported (2026-09-14): the curse now seeds the distinct `StenchGas` field, which spreads with Java blob rules and prolongs paralysis for `Paralysis.DURATION/5` (2 turns here). **Found fixing this: the port's `fragile` armor curse (-2 armor) never existed in real Java** (checked tag `v3.3.8` back to `v3.3.1`; closest match is a `v1.x`-era changelog mention) - pre-correction `fragile` ids still migrate to `stench`. Presentation particles remain simplified. |
| Arcana scaling on curse procs (`RingOfArcana.enchantPowerMultiplier` via `procChanceMultiplier`) | `ringArcanaMultiplier()` at every ported curse chance-proc | **Correction: the old claim (here and in ROADMAP.md) that curses never scale "by design" was wrong** - checked tag `v3.3.8`: every ported curse chance-proc calls it (weapon: Annoying/Dazzling/Sacrificial/Displacing; armor: AntiEntropy/Corrosion/Displacement/Metabolism/Multiplicity/Overgrowth; plus new Stench and unported Friendly). All now scale; only Polarized (no chance roll) and Wayward (ported as a flat passive) don't. **Sacrificial's base chance corrected in the same audit**: flat 1/12 was an unconfirmed guess, real Java is 1/10. Explosive's fuse burn now also scales (`round(IntRange(0,10) x arcana)`). Type-check/build/tests only; browser verification owed per ROADMAP.md section 10. |
| Durability for melee (none exists in Java - only missiles wear), identification flags, STR requirements and the accuracy penalty for being under-strength | `rollHit`'s `1.5^enc` penalty, `rollDamage`'s excess-STR bonus, `InventoryItem.identified` | Ported, with one simplification: the `1.2^enc` delay penalty has no model (turns here have no fractional duration) |
## Monsters (`actors/mobs/*.java`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `Goo.act()`'s water-healing regen (`healInc` while submerged and below full HP) | `takeGooTurn` | **Now ported, found missing entirely while auditing the Sewers boss against `Goo.java`** - Goo's pump-up/slam mechanic was already live, but the separate "retreat into water to heal" behavior real players use as a tell had no equivalent at all. Simplified to a flat `+1 HP`/turn while standing in water and below full HP (real Java's `healInc` ramps `1`->`3` only under the `STRONGER_BOSSES` challenge, not modeled here) and does not interact with a `LockedFloor` door-lock countdown, since this port has no boss-room door-lock system at all - both narrower, honestly-flagged gaps rather than a rushed full match. |
| `SentryRoom$Sentry.act()`/`onZapComplete()` (immobile beam turret: infinite evasion, `20+depth*2` accuracy, `NormalIntRange(2+depth/2, 4+depth)` DeathGaze, sees through invisibility) | `MONSTERS.sentry` + `red_sentry.png`, `spawnMonster`'s sentry case, `takeMonsterTurn`'s sentry branch, `sentryWarmup` | Ported, checked against tag `v3.3.8` (`SentryRoom.java`). Own byte-for-byte art at the real 8x15 film, HP=HT=1/EXP=0 (the NPC base), real evasion constant (the short-circuit threshold, not the display 999999), depth-scaled accuracy set at spawn, never sleeps, excluded from champions, never moves or melees (owns its whole turn ahead of the adjacent block), sees through invisibility, charges ~2 turns on first sight then fires every visible turn with the armor-bypassing beam (looking away resets the charge), holds fire while terrified instead of fleeing. Stated gaps: the room-area/EMPTY_SP trigger collapses to line-of-sight, no Bestiary tick, no travel-interrupt pity, no charge particles (a port log line stands in). **Found fixing the section-10 crash this same pass: `alchemyBlob`/`eternalFire` painter markers are blob seeds, not mobs** - filtered at the live bridge (the pot stays inert scenery; the eternal-fire wall is now ported, see the dedicated `EternalFire` row below - the old "needs a non-diffusing fire primitive" premise was stale, a static blob needs no diffusion primitive at all), and `spawnPortedMobs` now refuses any future unknown kind with a log line instead of crashing. Type-check/build only; browser verification owed per ROADMAP.md section 10. |
| `RotHeart`/`RotLasher` (HP 80, defense 0, IMMOVABLE, ToxicGas-immune; heart PASSIVE/EXP 4/no attack, lasher Waiting/EXP 1/damage 10-20/acc 25/seed loot 0.75/+5 regen, heart death kills lashers) | `MONSTERS.rotHeart`/`rotLasher` + `rot_heart.png`/`rot_lasher.png`, `takeMonsterTurn`'s rot branches, `kill()`'s heart rule, `MOB_LOOT`, the toxic-gas immunity | Ported, checked against tag `v3.3.8` (`RotHeart.java`, `RotLasher.java`) - the same crash class as the sentry (`rotHeart`/`rotLasher` painter kinds had no catalogue entry either, so RotGarden floors crashed on entry too). Own byte-for-byte art at the real films, never sleep, excluded from champions, never move; the heart never acts (burning still destroys it through the generic DoT, minus Java's destroy-vs-die distinction); the lasher attacks adjacent foes, regenerates exactly `min(5, missing)` with no adjacent enemy, holds still while terrified, drops the real 0.75 seed, and dies with the heart. Stated gaps: burning-destroy nuance, lasher heal status text (a `showHeal` tick stands in). Type-check/build only; browser verification owed per ROADMAP.md section 10. |
| `MagicalFireRoom.EternalFire` (permanent non-diffusing fire wall: blocks passage, ignites chars with `Burning.reignite(4)`, spreads regular Fire to flammable cells, burns heaps, any partial frost/blizzard/water clear wipes the whole wall) | `main.ts`'s `eternalFire` blob (seeded at the live bridge from the painter's `eternalFire` markers, floor-saved), `spreadFire`'s ignite branch, `eternalFireBlockedInto` (hero step query, click-travel routing, shared + terror-flee monster pathing), `potionFrost`'s quench branch | Ported, closing the section-10 crash row's own "needs a non-diffusing fire primitive" premise as stale - checked against tag `v3.3.8` (`MagicalFireRoom.java`): Java's `evolve()` never diffuses by construction, so the port simply never calls `spread()` on this blob (seeded at Java's own amount 1 per wall cell), which is exactly the audit's `spread(passable, 0, 1)` prescription with the call omitted. Ignition (hero + monsters + the existing log line), hero/monster/travel passage-blocking, and frost-quenches-whole-wall (`clear()` -> `fullyClear()`, via a Chebyshev-2 circle around the quaffing hero, the same radius approximation `StoneOfShock` uses - the room's own dropped PotionOfFrost is the intended key past the wall) are all live. Stated gaps: spreading regular Fire onto flammable terrain (no flammable map - same gap as StoneOfBlast's unported terrain half), heap burning (no heap-burn primitive), water/blizzard clearing (neither system touches blobs), boss-arena pathing (fixed arenas never contain the room), visuals (consistent with every other logic-only blob). Type-check/build/simulation/item suites green; browser verification owed per ROADMAP.md section 10. |
| `Rat`: `HP`, `defenseSkill`, `attackSkill()`, `damageRoll()`, `drRoll()` | `MONSTERS.rat` | Ported |
| `actors.properties`' `actors.mobs.rat.name=marsupial rat` display name | `MONSTERS.rat.name` | Ported |
| `Snake`: same four | `MONSTERS.snake` | Ported |
| `Gnoll`: same four | `MONSTERS.gnoll` | Ported |
| Java flying mob property and chasm access (`Bat`, `Bee`, `Elemental`/`NewbornFireElemental`, `Eye`, `Swarm`, `Ghost`) | `FLYING_KINDS`, `Creature.flying`, `spawnPortedMobs`/`populate`/`swarmSplit`/`moveTo` | Ported: all listed flying actors may be generated on and move across raw chasm cells. `YogFist.java` does not set `flying`, so Yog's fists remain correctly grounded. |
| `Swarm.defenseProc` split (`HP >= damage+2`, clone holds half the post-hit HP, `EXP = 0` past generation 0, free 4-neighbour) | `swarmSplit` | Ported: the clone retains Java's normal 50-HP maximum, generation, Burning/Poison and champion state; its exact one-time `SPLIT_DELAY` timestamp remains simplified to the shared scheduler stagger. |
| `Piranha.act()` water-only occupancy and `dieOnLand()` after forced movement | `spawnPortedMobs`/`populate` water gate, `moveTo` post-move check | Ported: Piranhas are only created in water, follow water-only movement paths, and die immediately when an effect moves one onto dry terrain, matching `Piranha.java`. |
| `Crab`: same four | `MONSTERS.crab` | Ported |
| `Slime`: same four | `MONSTERS.slime` | Ported |
| `Skeleton`: same four | `MONSTERS.skeleton` | Ported |
| `Thief`: `HP`, `defenseSkill`, `attackSkill()`, `damageRoll()`, `drRoll()` | `MONSTERS.thief` | Ported |
| `Thief.steal` + `FLEEING` (steals an unequipped item, flees, drops it + gold on death) | `thiefSteal`, `takeMonsterTurn`'s `fleeBelow: 1` | Simplified - steals one consumable (or 10 gold), not an unequipped gear piece with placeholder/shatter semantics. **`Bandit` (a real, spawnable alternative kind that `extends Thief` in Java, sharing the steal-then-flee behavior unchanged - its own override just adds Blindness/Poison/Cripple on a successful steal, already ported separately via the `attacker.kind === 'bandit'` branch in `attack()`) had the flee half of this missing in three places**: found auditing rare monster variants, the same literal-kind-check bug as `ArmoredBrute`/`DM201`/`Senior`/`SpectralNecromancer` - the `stepAway` dispatch in `takeMonsterTurn`, the `decideMonsterAI` `fleeBelow` threshold, and (the most consequential of the three) `kill()`'s stolen-item-return logic all tested `kind === 'thief'` only. The first two meant a Bandit that stole something never actually fled - it kept fighting normally instead of running, the opposite of Java's real behavior; the third meant a killed Bandit's stolen item was gone for good rather than recoverable, an actual permanent item loss bug, not just a missing flavor behavior. All three fixed. Browser-verified live: a Bandit that stole an item immediately increased its distance from the hero on its next turn (fled, distance 1 -> 2) rather than staying adjacent to fight; killing it afterward correctly returned the stolen item to the bag and granted the bonus gold, with the real log line ("Vous récupérez ce que le voleur avait pris, et quelques pièces."). |
| `DM100`: `HP`, `defenseSkill`, `attackSkill()`, `damageRoll()`, `drRoll()` | `MONSTERS.dm100` | Ported |
| `DM100` lightning zap (`Normal(3,10)` over `MAGIC_BOLT` ballistics when not adjacent) | `takeMonsterTurn`'s dm100 branch, `zapHero` | Ported |
| `Guard`: `HP`, `defenseSkill`, `attackSkill()`, `damageRoll()`, `drRoll()` | `MONSTERS.guard` | Ported |
| `Guard.chain` (distance < 5 pull + `Cripple`; `chainsUsed` - real Java only ever lets a Guard chain-pull once in its lifetime) | `chainHero`, `chainUsed` field on `Creature` | Simplified - one-cell drag plus the real 4-turn Cripple; the Ballistica path (multi-cell pull distance along the projectile line) is still not modelled. **The once-per-life flag is now ported** (was previously missing entirely, letting a Guard repeatedly chain-pull and Cripple-lock the hero every time it came back into range - something real Java never allows): `chainUsed` is set the first time `chainHero` fires and persists through floor save/load, gating the attack out for good afterward. Browser-verified live: a Guard chained once (hero pulled, Cripple applied), then took no further chain action across three more turns at the same range. |
| `Necromancer`: `HP`, `defenseSkill`, `drRoll()` | `MONSTERS.necromancer` | Ported |
| `Necromancer` summon (`NecroSkeleton` HP 20, no EXP, dies with its master) + ranged bolt (`Normal(2,10)`) | `summonSkeleton`, `zapHero`, `kill`'s skeleton cleanup, `simulation/turns.ts`'s `TurnPorts.monsterTurnCost`, `adapters/sceneSimulation.ts` | Simplified - the summon trigger/range, bolt, and now `firstSummon` timing are real; only the push-aside remains not modeled. **The push-aside is now ported too, closing a second stale "blocked" claim** (the old "needs a full knockback system" premise was wrong - checked against `Necromancer.summonMinion()`, the rule is a plain 8-neighbour search maximizing distance from the necro, and `Roguelike.knockbackPath`'s straight-line shove would not even have matched it): `summonSkeleton` now picks the unoccupied passable hero-neighbour nearest the necro (Euclidean, matching `trueDistance`), else the nearest passable neighbour even when occupied and shoves a pushable occupant to its farthest free neighbour (`IMMOVABLE_KINDS` - dm201/sentry/rotHeart/rotLasher - redirect the skeleton instead, matching the immovable rule), else deals the real `SummoningBlockDamage` direct 2-10 hit with no hit roll (which also fixed the old fallback wrongly firing a missable `zapHero` bolt even when no cell was passable at all, where Java waits). Remaining simplifications, all narrower than before: no one-turn telegraph, no reachability/FOV gating on the pick, no LARGE/`openSpace` gate, no Pushing visual (a log line), no per-monster DR on the blocker hit. Type-check/build/simulation/item suites green; browser verification owed per ROADMAP.md section 10. **`firstSummon`'s variable tick cost is now ported, closing a stale "blocked" claim**: this row previously said the port's turn model "spends exactly 1 for every monster action, so there's no variable cost to apply without a scheduler-level change" - re-checking the actual plumbing while auditing other stale roadmap claims (right after finding the Weapon-Augment one) showed that premise was simply wrong. `mwg/roguelike`'s `Scheduler.spend(cost)` already accepts an arbitrary cost, and `adapters/sceneSimulation.ts`'s own `act` callback already threads a per-actor return value straight into it (`rules.scheduler.spend(cost)` in `mwg/simulation`'s `Turns.ts`) - it was just hardcoded to return the literal `1`, discarding any real per-action cost the scene might want. Fixed with a new optional `TurnPorts.monsterTurnCost(actor)` port, read once immediately after `takeMonsterTurn` returns (falling back to `1` when absent, so every other actor and the committed `verifySimulation.mjs` test suite are unaffected). `summonSkeleton` sets a scene-side `pendingMonsterTurnCost` (cleared at the start of every `takeMonsterTurn` call) to `2` when `necro.firstSummon` was already `false` before this summon, `1` otherwise, then sets `firstSummon = false` - matching Java's own `spend(firstSummon ? TICK : 2*TICK)` exactly, including the real semantics that `firstSummon` only ever flips once per necromancer, for its lifetime, not per-skeleton (a necromancer whose skeleton dies and gets replaced costs 2 for every summon from then on, not just the first replacement). A new `firstSummon` field on `Creature`/`SavedCreature` persists this through floor save/load, matching how `skeletonIndex` already does. Browser-verified live, end-to-end through the real scheduler (not just the isolated cost calculation): spawning a fresh necromancer and driving `runTurns()` after killing its first skeleton showed its scheduled turn advance by exactly `2` for the resummon, versus `1` confirmed for a fresh necromancer's very first summon. | **`SpectralNecromancer` (a real, spawnable alternative kind that `extends Necromancer` in Java, sharing this bolt/summon/support behavior unchanged - its own overrides, a wraith-summoning variant and a Scroll of Remove Curse drop, are both beyond this port's scope) never got any of it at all**: found auditing rare monster variants, the same literal-kind-check bug as `ArmoredBrute`/`DM201`/`Senior` - all three sites (the adjacent-bolt dispatch, the summon/support branch, and `kill`'s skeleton-death cleanup) tested `kind === 'necromancer'` only, so a SpectralNecromancer fought as a plain melee attacker with no ranged bolt or skeleton summon at all. All three fixed; stats were already correct in `monsters.ts` (identical to base Necromancer) from before this pass. Browser-verified live: a SpectralNecromancer at distance 2 correctly summoned a skeleton first (matching the real summon-before-bolt priority), then with the skeleton moved out of sight, its next 10 turns rolled damage in the real `[2,10]` range (misses read 0) with the correct French bolt-hit log line naming it by its own translated name, not the base Necromancer's - see the French-wording correction to that same log line lower in this file (the "i18n audit" row), found by the user directly afterward: it had been using "carreau" (a physical crossbow quarrel), wrong for every creature that actually uses this line, all of which fire a magical bolt/zap, not a physical one. |
| `Necromancer.onZapComplete()`: while its own skeleton lives and is in its sight, it supports rather than attacks - heals `HT/5` if the skeleton is hurt, else grants it a one-time `Adrenaline` if it doesn't already have it | `takeMonsterTurn`'s necromancer branch, reusing the existing `hasteTurns`/`hasteBaseSpeed` haste fields as the closest stand-in for `Adrenaline` (this port has no separate buff for it) | **Ported**, closing part of the same row's "not" list above - previously the necromancer had zero ongoing support behavior at all: once summoned, its skeleton just fought alone forever. Real heal amount (`round(maxHp/5)`, capped at max) and the real "heal first, otherwise Adrenaline, but only one or the other per turn" priority are both reproduced. The teleport-to-hero's-side branch (`ScrollOfTeleportation.appear`, for when the skeleton is out of the necromancer's own sight) is also now ported: an out-of-sight skeleton not already adjacent to the hero gets moved to a free cell beside the hero instead of being left stranded wherever it last wandered. Simplified: real Java picks the closest such cell that is *also* in the necromancer's own sight (a distance-ranked search over `PathFinder.NEIGHBOURS8`); this port picks any free neighbour of the hero at random, a narrower selection. Browser-verified live: a hurt skeleton healed by exactly `round(maxHp/5)`, a full-health skeleton without haste got 3 turns of doubled speed instead, and a skeleton placed out of the necromancer's sight and not adjacent to the hero was moved to stand directly next to the hero - all three with the correct on-screen messages. |
| `Bat`/`Brute`/`Shaman`/`Spinner`/`DM200`: `HP`, `defenseSkill`, `attackSkill()`, `damageRoll()`, `drRoll()`, `EXP`, `maxLvl` | `MONSTERS.bat/brute/shaman/spinner/dm200` | Ported |
| `Bat.attackProc` heal (`min(damage-4, missing HP)`) | `attack`'s bat branch | Ported |
| `Brute` enrage (`Brute.isAlive()`/`triggerEnrage()`/`BruteRage`: a one-time near-death revival with a `HT/2+4` shield that drains at a flat 4/turn plus further combat damage, boosting `damageRoll()` to 15-40 only while it's active) | `main.ts`'s death-interception in `attack()` (`hasRaged`/`raged` fields on `Creature`), the flat 4/turn decay in `takeMonsterTurn`, `liveStats`' brute branch keyed on `raged` | **Ported, correcting this row's earlier claim.** Previously "enrage" was a stateless below-half-HP check on `damageRoll()` alone - not a translation of the real mechanic, and wrong in a way that mattered: it fired every turn a Brute happened to be under half HP (even before ever nearly dying) and never actually granted the real one-time survive-a-killing-blow revival at all, so a Brute could simply be killed outright the first time, something Java never allows. Now: the first hit that would bring a Brute's `hp` to 0 (`!hasRaged`) instead sets `hp = round(maxHp/2+4)` (reusing the creature's own hp field as the shield pool, so existing damage-application code drains it exactly like real hp would - the real `ShieldBuff.absorbDamage` semantics without a parallel absorb path), sets `raged`/`hasRaged`, and only then does `damageRoll()` jump to 15-40. Each of the Brute's own turns while `raged` drains a flat 4 (Java's `AscensionChallenge.statModifier` multiplier is 1 with no ascension-challenge UI to change it), on top of whatever combat damage also lands; reaching 0 this way kills it for real, with no second revival. Persisted through floor save/load. Browser-verified live: a Brute forced to near-death revived at exactly the real `HT/2+4` value (24 for `maxHp=40`), its own subsequent turn decayed exactly -4, and driving it to 0 after the revival killed it outright rather than reviving again. **`ArmoredBrute` (a real, spawnable rare/alternative kind - `mobRosterForDepth`'s Prison swap table - that `extends Brute` in Java) never got any of this at all**: found while auditing the "Port rare monster variants" roadmap item - both check sites (`attack()`'s death-interception, `takeMonsterTurn`'s decay) tested `kind === 'brute'` literally, so an ArmoredBrute could simply be killed outright, exactly the bug the base Brute fix above once corrected. Fetched `ArmoredBrute.java` to confirm its real override: `triggerEnrage()` grants a smaller `HT/2+1` shield (not `+4`) that decays far slower - 1 point every 3rd turn (`ArmoredRage.act()`'s own `spend(3*TICK)`, vs plain `BruteRage`'s every-turn 4-point drain; Java's own comment: "similar to regular brute rate, but deteriorates much slower. 60 turns to death total"). Both check sites now include `armoredBrute`, with a new `armoredRageTicks` counter (persisted through save/load) gating the decay to every 3rd call instead of every one; `liveStats`' 15-40 damage boost while raged now also covers it (`ArmoredBrute` inherits `damageRoll()` from `Brute` unchanged). `ArmoredBrute`'s own extra `+4` DR (`drRoll()`'s override) was already correctly baked into its separate `armor: [4,16]` entry in `monsters.ts` (vs plain Brute's `[0,8]`) from before this pass - only the enrage/revival mechanic itself was missing. Browser-verified live: forcing an ArmoredBrute to near-death revived at exactly `round(40/2+1) = 21`; its next two turns left hp unchanged, the third dropped it by exactly 1 with the tick counter resetting to 0; a 30-swing sampling comparison (after the first attempt was corrupted by repeated in-loop hero deaths triggering scene transitions - redone cleanly on a fresh page, keeping hero HP topped up between swings) confirmed damage stayed bounded in the real 15-40 range (observed 16-37). |
| `Monk`/`Senior` Focus (`Monk.act()`'s `focusCooldown` decaying every one of the monk's own turns, re-attaching a dodge-the-next-hit buff once it reaches 0 while `HUNTING`) | `Creature.focusCooldown`, `afterMonsterTurn`, `moveTo`, `attack()`'s Focus-consuming dodge branch, the initial grant in `spawnMonster` | Ported: the floating 6–7-turn cooldown is reduced by one action-time unit after each Monk/Senior turn, plus Java's movement reductions (0.67 for Monk and an additional 1.66 for Senior), then reattaches the dodge buff while the mob sees the hero. Senior inherits the same parry reset and defense behavior. The shared buff map remains the carrier, so Java's sprite/audio parry presentation is not modeled. |
| `Scorpio`: refuses adjacent kills and backs away instead (`getCloser` override calling `getFurther` while `HUNTING`), attacks ranged-only over `PROJECTILE` ballistics, 50% cripple proc on hit | `takeMonsterTurn`'s scorpio retreat/ranged branches, `attack()`'s cripple proc | Ported for the base kind. **`Acidic` (a real, spawnable alternative kind that `extends Scorpio` in Java, sharing all three of these unchanged - its own override adds an `Ooze`/corrosion proc on top via `super.attackProc()`, already ported separately elsewhere in this file) had all three missing**: found auditing rare monster variants, the same literal-kind-check bug as `ArmoredBrute`/`DM201`/`Senior`/`SpectralNecromancer`/`Bandit` - the retreat dispatch, the ranged-attack range check, and the cripple proc all tested `kind === 'scorpio'` only, so an Acidic fought as a plain melee attacker with no retreat, no ranged attack, and no cripple proc, keeping only its own corrosion effect. All three fixed; stats were already correct in `monsters.ts` (identical to base Scorpio) from before this pass. Browser-verified live: an adjacent Acidic correctly retreated (increased its distance) instead of meleeing; placed at range 3 with a clear line, it landed real ranged hits bounded in the exact `[30,40]` range with zero hero armor (confirmed over 20 turns: observed 31-40), with the correct French cripple-proc log line ("La piqûre vous estropie !") firing on procs. |
| `Slime.damage()`: incoming hits of 5+ are soft-capped, the same shape as `DemonSpawner.damage()`'s already-ported formula but with a lower threshold (takes 5/6/7/8/9/10 dmg at 5/7/10/14/19/25 incoming) | `simulation/defenderDamageCurves.ts` (was `attack()`'s slime/causticSlime branch) | **Ported, and since 2026-09-12 part of one consolidated family applied at Java's point.** Previously not modeled at all, for either kind - not the literal-kind-check bug (no branch existed for either `slime` or `causticSlime`), simply an unported mechanic, found while checking whether `CausticSlime extends Slime` (which shares it unchanged; its own override just adds the already-ported Ooze proc via `super.attackProc()`) needed the same kind of fix as the other rare variants this session. Implemented with the identical `4 + floor((sqrt(8*(dmg-4)+1)-1)/2)` formula (confirmed against `Slime.java`), placed next to the existing `demonSpawner` soft-cap branch it mirrors. Browser-verified live: fed the six raw values from Java's own documenting comment (5/7/10/14/19/25) and got back exactly 5/6/7/8/9/10 each time; a live 25-damage hit through the real `attack()` pipeline landed for exactly 10, matching precisely. **Then found the family's *position* was wrong for one of its four members**: these are all `damage()` overrides, so Java runs them inside `enemy.damage(...)` - after the attacker's every multiplier and proc - and while `eye`/`demonSpawner`/`slime` happened to sit there, `pylon`'s ran at the top of `attack()`, above the augment/talent/proc chain, so a charged pylon under-reduced every hit it took (with the x1.5 augment: Java computes 60 then curves to 23, the old order curved 40 to 20 then multiplied to 30). All four are now `simulation/defenderDamageCurves.ts`'s `applyDefenderDamageCurves(kind, damage, flags)`, called once at Java's point, with `verifyCombat` asserting Java's own published value table for each curve and browser-verified live on the built game (slime raw 40 -> 12; charged pylon with the x1.5 augment -> 23, not 30). Not modelled within the family: `Slime.damage()`'s `AscensionChallenge.statModifier` divide-and-multiply (the identity while the ascent is unported), and `Pylon`/`DemonSpawner`'s own side effects - the locked-floor timer credit, and the spawn-cooldown cut - which stay at the call site. |
| `Char.attack()`'s tail ordering: `attackProc()` -> `enemy.damage()` (the `damage()` overrides, shields, HP) -> the execute mechanics | `main.ts`'s `attack()` | **Ported for placement and the kill itself (2026-09-12); the threshold conditions remain a documented simplification.** Java (`Char.java`, v3.3.8) runs the weapon proc (`attackProc`, 505) *before* `enemy.damage(effectiveDamage)` (519); the defender's `damage()` overrides - `Pylon`/`Eye`/`Slime`/`DemonSpawner` and `SoiledFist`'s grass reduction alike - run *inside* that call, as do the shield pools; and the two execute mechanics run *after* it (Preparation/`prep.canKO` at 524, `CombinedLethality` at 541), each setting `enemy.HP = 0` outright and each guarded by `enemy.isAlive()`. This port used to run `Corrupting.proc` *after* the curves and both executes *before* the soiled-fist reduction and the King/DM-300 barrier pools. Both are now Java's: the corrupting guard sees the pre-`damage()` value (so a Slime whose soft cap cuts a lethal raw hit below its HP is still corruptible), and the execute runs after every `damage()` override and shield pool, guarded on the target surviving this hit so a hit that already kills does not also report an execution. Browser-verified live on the built game: 34/60 swings corrupted a 20-HP Slime against a raw 40 (soft-capped to 12) where the old order could manage 0, and a Dwarf King with a 1000-point `DKBarrier` died outright where the old order left it at full HP with the shield barely touched. **Now Java's on the two gates that need no Preparation model** (2026-09-12), since the port gained a real `miniboss` property: `CombinedLethality` excludes `BOSS`/`MINIBOSS` targets outright (`Char.java` 543-545) while the Assassin's `Preparation.canKO` still allows them at *one fifth* of its threshold (`Preparation.java`), so the combined half is zeroed for a boss/miniboss and the Assassin half divided by five. Browser-verified live: a rat at 40% of max HP is executed, GreatCrab and Goo survive that same hit, and an Assassin still executes Goo at 10% but not at 40%. **The Assassin half is now the real `Preparation` too (2026-09-12)** - see the dedicated `Preparation` row below: it fires only while the hero is actually invisible, at `AttackLevel.KOThreshold()`'s real table, with a strict `<` and a fifth for bosses. **What remains approximated**: the test is the *predicted* post-hit HP (`defender.hp - damage`, taken before the shield pools reduce it) rather than the HP `damage()` actually leaves, so a shielded defender can be executed slightly earlier than Java would; and `CombinedLethality`'s arming gate (the attacking weapon must have changed since `MeleeWeapon.java:207` set the tracker) is unmodelled. |
| `Preparation` (`actors/buffs/Preparation.java`) - the stealth state and its tables: `AttackLevel` (1/3/5/9 turns invisible -> +10/20/35/50% damage and 1/1/2/3 damage rolls taking the best), `AttackLevel.KOThreshold()` (a 4x4 table by prep level and `enhanced_lethality` rank, 0.03-1.0, bosses at a fifth) and `blinkRanges` | `simulation/preparation.ts`, `Combatant.prepLevel`, `rollDamage`, `main.ts`'s `syncPreparation`/`trackPreparation`/`attack()` | **Ported (2026-09-12).** The buff exists while a character is invisible and counts the turns it has been (`Preparation.act()` detaches the moment it is not), so this port counts hero turns of invisibility in the hero-turn pipeline (`updatePreparation`, run after the buff tick for the same reason Java gives the buff `actPriority = BUFF_PRIO - 1`) and mirrors the resulting level onto the attacker's combat data, which is what `rollDamage` reads - Java reads `buff(Preparation.class)` on the attacker inside `Char.attack()`. The damage roll is *replaced*, not scaled: the best of 1-3 `damageRoll()`s (excess-STR bonus included) plus the level's percentage, rounded. The attack may then execute a target whose HP `damage()` left is under the table's threshold (or a fifth of it for `BOSS`/`MINIBOSS`). Read *before* the invisibility dispel, because Java reads it into a local at the top of `Char.attack()` and only dispels after the whole attack returns (`Hero.java` 2325) - and an attack is what ends invisibility, so the state is per-invisibility rather than permanent. Browser-verified live on the built game, 12 assertions: `[10,10]` damage becomes 10 / 11 / 12 / 14 / 15 with no prep / 1 / 3 / 5 / 9 turns invisible; over 60 strikes of `[1,20]` level 4 reaches 30 where level 1 stops at 19, proving the 3-rolls-take-the-best half; and the execute fires at 99% of maximum with level 4 + rank 3, does *not* fire at the same HP with rank 0 (0.99 is far above 0.03), does *not* fire at all without invisibility however high the counter is, and lands exactly on the strict `<` boundary for a boss (a hit leaving 0.20 of maximum survives, 0.199 dies). **The blink action is ported too (2026-09-12).** `usePreparationBlink` reuses the port's own `beginAiming` (MWG 0.7.7's renderer-free `TargetingController`) with Java's own rules: the picked cell must hold a visible hostile that is not the hero, an NPC or an ally; an already-attackable target is attacked where the hero stands; otherwise the destination is the cheapest of the target's eight neighbours by path distance from the hero within `blinkDistance()`, ties broken by true distance, skipping occupied cells. MWG's `distanceMap` is the same breadth-first flood as Java's `PathFinder.buildDistanceMap(hero.pos, passable, range)`, reporting `-1` where Java uses `Integer.MAX_VALUE`, so no pathfinding was written for it. A rooted hero refuses exactly as Java does, and resolving the blink refreshes the hero's field of view, fog and sprite visibility (`Dungeon.observe()` + `GameScene.updateFog()` + `checkVisibleMobs()`). The action is surfaced as a contextual toolbar button - Java's `ActionIndicator` - that exists exactly while Preparation is up, labelled with SPD's own `action_name` text because this port has no preparation icon art, and it re-sits the interface when it appears or goes. Every string is one of SPD's own already-translated keys (`prompt`, `no_target`, `out_of_reach`), so the action needed no new port catalogue entries. Browser-verified on the built game, 7 assertions: the button tracks the buff, the action opens an aim, an adjacent target is attacked without moving, a target 3 cells away is blinked onto in 2 steps and struck, and a target beyond the blink distance (level 1 with no `ASSASSINS_REACH` gives 1) is refused rather than attacked. **Also ported (2026-09-12)**: `Talent.BOUNTY_HUNTER`'s real loot effect, which reads the preparation level - `Char.attack()` arms its tracker (`BountyHunterTracker`, a zero-duration buff in Java, so this port clears it in the same hero-turn pipeline as the counter) for a prepared hero attack with the talent, and `Mob.lootChance()` adds `0.02 * 2^(prepLevel-1) * points` to the drop-chance multiplier. **Still not modelled**: `Preparation`'s icon tint and shortcut text (the `Wound.hit`-instead-of-`Surprise.hit` presentation itself is live - see the stealth row), the screen shake on a rooted refusal, and Java's `passable|avoid` path set - MWG's flood walks passable cells only, so a blink cannot route across a cell this port marks `avoid` (a chasm) the way Java's can. |
| `Shaman` zap (`Normal(6,15)` over `MAGIC_BOLT`) | `takeMonsterTurn`'s shaman branch | Ported |
| `Spinner.attackProc()` / `Hunting.act()` / `shootWeb()`: poisonous fleeing bite plus a 10-turn-cooldown ranged web | `mobOnHit` Spinner bite branch, `takeMonsterTurn`'s new spinner branch, `webCooldown` field on `Creature` | Simplified - the melee bite now matches Java's 50% `Poison` for 7-8 turns and flee transition. The ranged web is also ported in shape: real Java predicts the hero's movement direction (`lastEnemyPos` vs current) and seeds a real `Web` terrain blob across three cells that immobilises whoever later stands in it. **2026-09-17 correction: the blob half is ported** - the shot seeds the `web` volume at the hero's cell plus its east/west neighbours (passable only), rooting whoever stands in it, so the direct root is the impact and the terrain the aftermath; movement prediction (`lastEnemyPos`) is still not modelled, and Java picks the neighbour pair around the aimed cell rather than fixed east/west. The shot itself needs a clear (line-of-sight, range 6) line, the same "shape not curve" simplification already used for other line-based abilities (DM200's vent, the Necromancer's bolt). The real 10-turn cooldown and not-adjacent gating are faithful. **2026-09-10 correction: the flee half is now actually implemented, not aspirational** - `attackProc` sets a persisted generic `Creature.fleeing` flag (the prior code assigned `fleeBelow` on the `Creature`, which is not a real field, so the tree did not type-check and no flee ever happened), `takeMonsterTurn` treats `fleeing` like the Thief's steal state (`fleeBelow: 1`, and `stepAway` when adjacent instead of biting), and `Spinner.Fleeing.act()`'s return to HUNTING is modeled (cleared once the spider sees the hero and the hero's `Poison` has worn off; Terror/Dread are owned by the generic terror override; and since 2026-09-17 `nowhereToRun()` recovers a boxed-in fleeing mob - the real `Mob.rage` line and back to hunting while seen, wandering otherwise, Terror holding; Dread has no system here). The bite duration now uses `Random.range(7, 8)`, Java's exact `Random.IntRange(7, 8)`, instead of the `normalRange` lookalike. Browser verification remains pending for this correction. |
| `Golem.teleportEnemy()`/`canTele()`/`Hunting.act()`: while not adjacent, teleports the hero to their own farthest free neighbour cell from the golem, gated by a 20-turn `enemyTeleCooldown` | `takeMonsterTurn`'s golem branch, `golemCanTeleport`, `golemTeleCooldown` field on `Creature` | **Ported** - Golem previously had no special behavior at all and fought as a plain melee attacker, despite having a real, distinctive teleport-the-hero-away ability in Java. Fetched `Golem.java` to confirm the exact shape: while not adjacent, off cooldown, with a reachable target, and without `MagicImmune`, it picks whichever of the hero's own 8 neighbouring cells maximises distance from the golem (among passable, unoccupied ones) and teleports the hero there, pushing them away rather than closing the gap itself. The reachability check now routes around solid terrain using the pathfinder; Java's distance-based `Random.Int(100/distance)==0` roll is applied before the normal approach fallback, and only an unreachable approach teleports. Golem's *other* real ability - a self-teleport-to-reposition move while `Wandering` (not `Hunting`), gated by its own separate `selfTeleCooldown` - is now modeled in the separate row below. Browser-verified live: a golem 3 cells from the hero correctly teleported the hero to a genuinely farther cell and set `golemTeleCooldown` to 20; an immediate second attempt correctly did nothing while the cooldown ticked down to 19. |
| `Eye.doAttack()`/`deathGaze()`: a two-turn ranged beam (charge, then fire a real magic-hit-roll 30-50 line attack bypassing armor/DR), with 1/4 damage taken while charged and a 4-6 turn cooldown after firing | `takeMonsterTurn`'s eye branch, `beamCharged`/`beamCooldown` fields on `Creature`, the `Eye.damage()` quarter-damage check folded into the shared attack damage-modifier chain, `simulation/turns.ts`'s `monsterTurnCost` hook (from the `firstSummon` fix) for the charge turn's real 2x cost | **Ported, replacing a completely wrong-shaped stand-in.** The previous implementation applied a 1.5x damage multiplier to every 3rd landed *melee* hit - not a simplification of the real ability, a different mechanic entirely: fetched `Eye.java` and confirmed DeathGaze is 100% ranged, never a melee proc at all (Eye's own melee `damageRoll()`/`attackSkill()` exist only as the generic fallback `canAttack` uses when the beam is on cooldown or blocked). Real Java: turn 1 charges (`spend(attackDelay()*2f)`, no damage, `((EyeSprite)sprite).charge()`), during which incoming damage is quartered (`if (beamCharged) dmg /= 4` in `Eye.damage()`); turn 2 fires along a `Ballistica` line, rolling a real magic hit (`hit(this, ch, true)`) and, on a hit, `Random.NormalIntRange(30,50)` damage applied via a direct `ch.damage()` call that never subtracts armor/DR at all (unlike this port's own `zapHero`, which does subtract armor for its bolt-throwing mob kinds - confirmed by reading the exact call chain, not assumed); then a `Random.IntRange(4,6)` cooldown. This port's version reuses the same `Roguelike.canTarget`/line-of-sight simplification already established for DM200's vent and Spinner's web instead of Java's full multi-target beam-with-terrain-destruction and BFS reachability check (this port's beam only ever targets the hero, not every creature caught in the line). Browser-verified live: a fresh eye's first `takeMonsterTurn` call charged (`beamCharged: true`, `pendingMonsterTurnCost: 2`); a 20-damage test attack while charged did exactly `5` (floor(20/4)) versus the full `20` once un-charged; forcing a charged eye to fire dealt damage in the real 30-50 range and set a fresh cooldown in the real 4-6 range, with `beamCharged` correctly reset to `false`. |
| `DM200.Hunting.act()`/`canVent()`: while not adjacent, a distance-scaled roll (`Random.Int(100/distance)==0` - farther is *more* likely) seeds toxic gas along the `Ballistica` line to the hero (20/cell, 100 at the target's own cell), gated by a 30-turn `ventCooldown` | `takeMonsterTurn`'s dm200 branch, `ventDM200`, `ventCooldown` field on `Creature`, `Roguelike.traceLine` for the line, the shared `plantGas` toxic blob for seeding | **Ported** - DM200 previously had no special hunting behavior at all (it just fought as a plain melee attacker once adjacent); it now correctly prefers venting from range, with the real distance-scaled odds, the real 20/100 seed amounts, and the real 30-turn cooldown, all persisted through floor save/load. Simplified: real Java's `canVent()` also BFS-checks that *some* path exists around blocking terrain even without a clear line of sight - this port requires a clear line instead (`Roguelike.canTarget` with line-of-sight required), a narrower reachability check; and real Java retries venting as a fallback if closing distance also failed this turn, which this port does not model (a missed vent roll just falls through to the normal closer-distance AI, with no second attempt). Browser-verified live: calling the vent directly seeded the exact real amounts (20, 20, 100 along a 3-cell line) and set the cooldown to 30. **`DM201` (a real, spawnable alternative kind that `extends DM200` in Java) never got this ability at all, and could also move freely** - found auditing rare monster variants, the same class of bug as `ArmoredBrute`/`Brute`: the vent check tested `kind === 'dm200'` literally, and real Java's `DM201` also adds `Property.IMMOVABLE` (unlike `DM200` itself, which moves normally) - this port had no immovability concept applied to it at all, so it walked around like any other hunter. Both fixed: the vent branch now covers `dm201` too (inherited unchanged from `DM200`), and `takeMonsterTurn` now returns immediately for `dm201` once it reaches the generic-mover point without having vented or attacked, rather than falling through to `decideMonsterAI`. Also fixed in the same pass: this port's own vent log line (`port.log.dm200vent` - an addition with no real Java equivalent, since `DM200.java` itself has no `GLog` call for the vent, only the visible gas cloud) hardcoded "DM-200" regardless of which kind actually vented; now interpolates the real attacking creature's own name. Browser-verified live: a spawned DM201 stayed at its exact spawn cell over 10 turns of `takeMonsterTurn` despite the hero being in range; forced-roll testing over up to 400 turns (the real per-turn odds are low - `Random.Int(100/distance)` - so many trials are needed to observe one) confirmed it vents correctly with `ventCooldown` set to the real 30; the log line correctly read "DM-201 relâche un jet de gaz toxique !" instead of naming DM-200. |
| `DM300`: `HP = HT = 300`, `defenseSkill`, `attackSkill()`, `damageRoll()`, `drRoll()`, `EXP` | `MONSTERS.dm300`,
`BOSSES[15]` | Ported (stats, all exact: 15-25 damage, acc 20, +0-10 armor); GAS/ROCKS uses live toxic-gas venting
plus telegraphed 7x7 rockfalls on the real cooldown/pick rules. The Caves floor restores four dedicated Pylon actors,
enforces inactive immunity and the Java heavy-metal damage curve, and reproduces DM300's HP-bracket supercharges:
normal-mode HT/3 thresholds, challenge HT/4 thresholds, sequential pylon activation (closest pylon reserved, another
selected), boss invulnerability, doubled `speed()` - Java's `speed() * 2`, which is what the port's half-cost
`monsterTurnCost` stands for, not a doubled cost - pylon loss of charge, persisted PylonEnergy cells, ground damage to
every grounded character, and DM300's `30 + (HT-HP)/10` Barrier from `DM300.move()` - granted when the boss steps onto
an `INACTIVE_TRAP` **wire** cell while hunting, **unless** that cell is already energized (`PylonEnergy.volumeAt > 0`
returns early); **corrected 2026-09-16, the port used to test the inverse** (membership in the energized set, which
also fired on energized water, a terrain Java never grants it from; and it fired regardless of hunting state).
Verified live (`tools/scratch/dm300-barrier-livecheck.mjs`, 5/5): no Barrier on an energized wire cell, none on
energized water, `30 + (HT-HP)/10` on the same wire cell once the field is cleared (`eliminatePylon`'s own clear is
what makes it un-energized in Java too), and none while the boss is not hunting. Simplified: Java's water diffusion is
collapsed because the fixed floor already records its water/wire cells, and exact locked-floor timing/energy visuals
remain; the `INORGANIC` clause of the can't-reach branch (the hero is never inorganic), adjacent-only turn spend (full
turn here), and GAS sound/travel-interrupt presentation remain. **2026-09-12: the can't-reach branch is ported.**
`DM300.java` 202-234 gives DM-300 "more aggressive ability usage when it can't reach its target": while the hero is
unreachable (adjacent, or a step towards them exists - Java's `findStep`, here the port's own `pathfinder.find`) and
`turnsSinceLastAbility >= MIN_COOLDOWN` (5, deliberately *not* the rotation's `> abilityCooldown`), a 30-degree,
infinite-range `STOP_SOLID`-only cone decides whether the hero can still be gassed - Java's own "account for
trickshotting angles" - and a cone that misses drops rocks instead unless the hero is already paralysed. That branch
re-rolls no `abilityCooldown` and spends no turn, unlike the rotation below it, which is exactly what the live check
keys on. Browser-verified live (`tools/scratch/dm300-gas-cone-livecheck.mjs`, 8 assertions), with the port's
pathfinder stubbed so reachability can be tested independently of the terrain: a *reachable* hero past the cooldown
uses the rotation and re-rolls the cooldown; an unreachable one with a clear aim line is gassed through the cone with
no re-roll; an unreachable one whose line is walled is rockfalled instead, also with no re-roll; an already-paralysed
unreachable hero gets neither; and under `MIN_COOLDOWN` neither fires. Still unportable here: Java's `INORGANIC`
clause (the hero is never inorganic) and its adjacent-only turn spend. **Updated 2026-09-11:** the arena now generates
its real `Patch.generate(width, height-14, 0.15f, 2, true)` water scatter and `Random.Int(challenge ? 4 : 8)`
inactive-trap scatter on the per-floor seeded stream, instead of a bare empty ellipse - without that terrain
`PylonEnergy` had no cells to seed, so the whole pylon mechanic was inert. `PylonEnergy` is now seeded where Java
seeds it, in `activatePylon()` at DM-300's HP-bracket supercharge (covering INACTIVE_TRAP/WATER/SIGN from row 13 down
- the `WATER` clause is that whole set's third member, since every water cell on this floor is below row 13 already;
the `evolve()` diffusion this used to also credit is collapsed here, as the Simplified note above says), not at arena
seal; the seal itself now triggers at Java's real Chebyshev distance 3 (`Level.distance` is `max(|dx|,|dy|)`), not 2;
and a long-standing double-damage bug was fixed (the energy tick iterated `[this.hero, ...this.creatures]`, damaging
the hero twice). Browser-verified live at depth 15: arena water/trap/sign counts all > 0; distance-4 does not seal but
distance-3 does; energy cell count is 0 before and after the seal and exactly equals the trap+water+sign count after
supercharge; one pylon activates; a grounded hero takes a single 6-12 hit per tick. **Also 2026-09-11:** DM-300's
locked-floor timing is now ported - it is created inside `seal()` at a random open, unoccupied `mainArena` cell that
is not an `EMPTY_SP` tile (matching `CavesBossLevel.seal()`'s own do/while), not on floor entry; verified live that no
boss exists before the seal and one spawns inside the arena exactly when the hero reaches distance 3. **The arena's
build order is now Java's, and a wrong claim that stood here is corrected (2026-09-15):** the gate is painted first,
in Java's own position, *before* the ellipse and the water/trap patch. **Corrected 2026-09-16: the order is not
load-bearing after all, and the claim that it was came from reading the gate rect inclusively.** `gate` is
`Rect(14,13,19,14)` - five cells on row 13, **nothing on row 14** - while the ellipse (`mainArena` as
`Rect(5,14,28,37)`, 23x23 in exclusive-edge terms, whose top row is seven cells wide from column 13) starts on row 14.
The two fills cannot overlap, so gate-first and gate-last produce identical floors: `tools/scratch/probeCavesGate.ts`
now reports the same 463 patch-loop draws and the same 102 energy cells for both variants. The order only ever
mattered when the inclusive `fillRect(14, 13, 19, 14, ...)` put gate cells *inside* the patch loop's own range on row
14, which is what let a gate-last fill erase water the loop had just placed. **Correction, 2026-09-16: this analysis
used to read the ellipse as 24x24** (`radW` 12, top row 6 cells at column 14), because the port passed the rect's
*inclusive* extent as the ellipse's width/height. That is one cell too wide on each axis; the arena is now Java's own
23x23 via `fillEllipseRect`, pinned by a `verifyVault.mjs` check that recomputes the shape from Java's arguments and
fails on the wider reading. With the gate on row 13 alone, row 14 rolls water and traps like any other arena cell.
**The floor's base terrain was wrong until 2026-09-16, and it was a hole rather than a look**: every level whose
`feeling` is not CHASM is filled with `WALL` by `Level.setSize()`, so Java's Caves arena is floor carved out of rock
with only `build()`'s five chasm strips as pits - this port built the floor over a CHASM base instead, leaving 34
walkable cells of the arena and its entrance corridor beside a pit Java has as wall (452 stray pits in total). Since
`canStepOnto` lets the hero enter a chasm, that was a way out of the boss floor mid-fight. Fixed to the `WALL` base
plus Java's own strips, which takes the pit count from 584 to Java's 132, pinned in `verifyVault.mjs` and proven
load-bearing by restoring the old base (452 stray pits, assertion fails). **The gate fill's own extent was wrong too,
and was fixed 2026-09-16 (`SIGN` is this port's stand-in for `CUSTOM_DECO`):** `Rect(14,13,19,14)` is an
exclusive-edge rect, so Java paints **five** cells - row 13, x 14..18 - while the port wrote the inclusive
`fillRect(14, 13, 19, 14, ...)`, which painted twelve. The ellipse then cleared row 14's six, leaving **six** gate
cells: an extra `CUSTOM_DECO` at (19,13) that Java leaves to whatever `buildEntrance()` stamped there (rock, on this
floor). It was invisible as terrain but not as state - `activatePylon()`'s energy seed
(INACTIVE_TRAP/WATER/CUSTOM_DECO from `mainArena.top - 1` down, as Java's own loop does) counted it, so the pylon
field carried one cell Java's does not. The fill is now Java's five cells, and `verifyVault.mjs` pins the rect's
exclusive reading directly. The ordering change did **not** move the RNG stream, and this row's earlier framing - the
patch's stream position being deterministic but not Java's exact draw index - was wrong on that point:
`Patch.generate` plus the `Random.Int` trap loop consume the same draws at seed 42 either way, because the ellipse
clears row 14 before the loop runs under both orders. **Correction, 2026-09-16: the figures this row used to carry
(108 vs 111 energy cells, 489 draws, then 103 vs 106) were all measured against a misread gate rect** and are
superseded twice over - once by the 23x23 ellipse fix above, and again by the five-cell gate fix recorded below.
Re-measured with Java's own rects by the same probe at seed 42: **463** draws and **102** energy cells (the gate's own
5 among them) for *both* fill orders. **`buildEntrance()` and `buildCorners()` are now ported too (2026-09-15)**,
closing the rest of that gap: each is one `Random.oneOf` over four stamps - 8x8 `entranceVariants` and 10x10
`cornerVariants` - mirrored into all four quadrants by a cursor walk whose four cursors each move in a different
direction (`NW`/`SW` increment, `NE`/`SE` decrement, which is what makes the four copies meet mid-row), with the row
advance applied before each row's writes. The 656 stamp tiles are generated from the Java source by
`tools/scratch/gen-caves-stamps.mjs` rather than transcribed, and every one of the eight variants is checked in
`tools/verifyVault.mjs` against an independent transcription of the cursor arithmetic - all stamped cells land where
Java's indices put them and nothing outside the stamp is written. The two draws now sit in Java's own stream position
(after the patch loop, before the chasm/entrance fills), so the port's draw index matches Java's through them; cell
indices are deliberately raw, as Java's are, so a stamp that runs past an edge wraps into the neighbouring row exactly
as Java's does rather than being clamped. Browser-verified live at depth 15: both corner quadrants carry real stamp
content, the mirrored motifs render, and the entrance cell stays `ENTRANCE` (Java sets it inside `buildEntrance()`, so
the port's explicit set still wins). Still simplified: the entrance area's EMPTY/EMPTY_SP/STATUE/EXIT fills are
hand-matched to Java's `Painter.fill` rects rather than produced by those two builders (which is what they were before
this pass - the builders paint the *decorative* band, the rects the corridor), and the gate's `CustomTilemap` dressing
(`CityEntrance`, `EntranceOverhang`, `ArenaVisuals`, drawn over the whole entrance region) **is now ported - see the
dedicated row below, which also records exactly which states Java recomputes `ArenaVisuals.updateState()` from
(`create()`, `unseal()` and `eliminatePylon()`; not `seal()`, not `activatePylon()`).** **Corrected twice, 2026-09-16
- the first correction below was itself wrong, and the pass it declared a no-op is a real unported one.** An earlier
edit here claimed `new CavesPainter().paint(this, null)` paints nothing and consumes no randomness because
`RegularPainter.paint`'s body is wrapped in `if (rooms != null)`. Only the *sizing* block is inside that `if`: the
`else` branch sets `rooms = new ArrayList<>()` and `Random.shuffle`/the room
loop/`paintDoors`/`Random.pushGenerator(Random.Long())`/the water-grass-trap blocks/`decorate(level,
rooms)`/`Random.popGenerator()` all run regardless. `CavesPainter.decorate` then does two whole-level scans that do
not read `rooms` at all - `map[i] == EMPTY` cells with at least one wall neighbour become `EMPTY_DECO` on
`Random.Int(6) <= n`, and `generateGold` paints `WALL_DECO` ore veins on `Random.Int(4) == 0` - and the pushed
generator costs the *parent* stream exactly one draw (`Random.Long()`). **That gap was closed the same day.** The boss
floor now runs the pass: `cavesBoss()` pushes a substream generator, calls `decorateStandaloneCaves` (the same
function `MiningLevel` already used, which `cavesPainter.ts`'s regular-floor `decorate()` now also calls rather than
keeping a second copy of the two scans) and pops, at Java's own position - after the entrance/corner stamps, before
the chasm strips, which is where the scans must read the map. At seed 42 that paints **95** `EMPTY_DECO` and **13**
`WALL_DECO` cells, pinned in `verifyVault.mjs` together with the proof that it left the pylon mechanic's terrain alone
(132 pits, 40 water, 36 traps, 5 gate cells, 81 energized cells - all unchanged). The ore-vein cells reach the screen
- `wallDecorations.ts`'s `ore` sparkle builds one emitter per real `WALL_DECO` cell, browser-verified live at depth 15
(18 cells and 18 emitters on that seed, amber particles inside the FOV); the `EMPTY_DECO` *floor* deco is state rather
than pixels, because this port collapses that terrain into its floor kind and draws no distinct tile for it on any
Caves floor - a pre-existing simplification, not new here. **The seal's entrance half is now ported (2026-09-12)**:
`CavesBossLevel.seal()`'s `set(entrance, WALL)` walls the way the hero came in, after pushing whatever stands on that
cell - or is heaped on it - to a random passable `PathFinder.NEIGHBOURS8` neighbour in Java's own index order, then
restitches the tile and plays the rock burst's shake and `rocks` cue. Verified live
(`tools/scratch/caves-seal-livecheck.mjs`, 9 assertions - the 7 this row carried was stale). **`unseal()` is now ported too (2026-09-16)**, closing the auto-descent gap on this floor: `applyDM300DeathUnseal()` restores the entrance, breaks the gate's five `SIGN` cells to `EMPTY`, clears the pylon energy and re-maps the arena visuals (which is what reaches the broken `32..36` frames - `gateIntact` now reads the live paint instead of a hardcoded `true`), then opens the exit stairs at Java's own (16,2). Unowned: the `BlastParticle` bursts, the music fade and `Dungeon.observe()`. **Save-safe since 2026-09-14:** the spent flag now persists in the run save (it used to reset on every
`enterLevel`, re-arming the gate after each load and doubling DM-300 next to the persisted one), the walled entrance
is re-applied to regenerated paint on load, and the spawn is skipped whenever a live DM-300 already exists - so
pre-flag saves adopt the sealed state instead of doubling the boss. |
| `CavesBossLevel`'s three custom tilemaps: `CityEntrance`, `EntranceOverhang`, `ArenaVisuals` (`caves_boss.png`;
`CityEntrance.create()`, `EntranceOverhang.create()`, `ArenaVisuals.create()`/`updateState()`/`name()`/`desc()`) |
`src/spdLevelGen/cavesBossVisuals.ts`, the two `cavesBossTiles`/`cavesBossWalls` layers in `enterLevel`,
`cavesArenaVisualContext`/`cavesArenaLayer`/`refreshCavesBossArenaVisuals`, the arena branch in `examineTile`,
`sprites.cavesBoss` | **Ported (2026-09-16)**, replacing a "Not ported" line that said the gate "renders as plain
floor": the sheet these three draw from was not loaded at all, which is why the whole entrance region had no dressing.
`CityEntrance` and `EntranceOverhang` are *cursor* walks rather than rect fills - each consumes its 5-wide `entryWay`
table five cells at a time at column `tileW/2 - 2` of every row, with `CityEntrance` walling the rest of rows 2 and 3
(`13` over the ceiling row, `21` over the wall row, except the two metal-structure columns at 9 and 23).
`ArenaVisuals` is not a fixed map: its frames are a function of the live level (which cells are `pylonPositions`,
which are `INACTIVE_TRAP` wires, the gate's own 5x1 strip), so it is recomputed from state rather than drawn once -
`54 + (x + 8y) - (x' + 8y')` directional wire tiles around each pylon, `37` over exposed wiring, `40..44` for a whole
gate and the pylon socket `38` once the arena is sealed and that pylon's actor is gone. Java keeps the three in two
groups straddling the wall layer (`customTiles` inside the terrain group, `customWalls` above the walls); this port
keeps that split as two layers on one shared sheet, because the entrance facade's rows 2-3 must stay under the rock
the wall layer paints over them. `updateState()` is called from three places in Java - `ArenaVisuals.create()` (this
port's `enterLevel` block), `eliminatePylon()` (called from `dm300LoseSupercharge`) and `unseal()` (called from
`applyDM300DeathUnseal`, which re-maps through `refreshCavesBossArenaVisuals()`). **Not** from `seal()` or `activatePylon()`, which is worth stating because `seal()` is where a reader would
expect it. The two named cases are ported too: `WndInfoCell.cellName` consults the custom tilemap *before* the terrain
(the window's own description does the same in its constructor; there is no `cellDesc` method). The gate's name is
then exact, and the wiring additionally needs Java's own suppression modelled: `ArenaVisuals.image()` returns null on
**every cell within one square of a pylon** - a superset of `NULL_TILE`, and it covers the very wire cells it draws -
so `WndInfoCell` never reaches the tilemap's name there, and `cavesArenaNameKey`/`cavesArenaDescKey` return nothing.
Both properties are asserted in `verifyVault.mjs`. **Simplified**: the frames are drawn from one sheet on one
`TileMap` per group rather than Java's per-`CustomTilemap` `Tilemap`s, and an earlier version of this line claimed the
`image()`-null rule could not be modeled "since the sheet is shared" - a non-reason wrapped around an inversion: Java
*does* draw a custom tile within one cell of a pylon (that is what the wire frames are), and what it suppresses there
is only the `WndInfoCell` name/desc lookup, which is now modelled. **Divergence (deliberate)**: Java's gate is solid
`CUSTOM_DECO` from `build()` until `unseal()` breaks it, so it really does block the exit corridor for the whole
fight; this port paints it `SIGN`, which the bridge maps to walkable floor, so the gate can be walked through from the
start. Kept deliberately even now that `unseal()` is ported: solidity here would need a per-cell SOLID channel for a
custom tile that this port has no form of, and the broken `32..36` frames still appear at `unseal()` either way -
`cavesArenaVisualContext` derives `gateIntact` from the live paint rather than hardcoding it. **Verified**: `verifyVault.mjs` gained 5
checks (28 total) - the entry-column walk's alignment and its wall rows, the overhang's own column, the gate's
five-cell rect with both frame runs and both descriptions, the wire/socket/gate branches from a synthetic level, and
the layer's `(0,12,width,27)` placement plus the name-implies-frame equivalence - and they caught two real
transcription bugs on their first run: `tileW/2` is Java's *integer* division (JS `33/2 - 2` is 14.5, so the
comparison never matched and the entire entrance went undressed), and the wire offset's `j / w` had the same float
reading. Browser-verified live (`tools/scratch/caves-arena-visuals-livecheck.mjs`, 11 assertions): the live layers
return the entrance block at cols 14..18 of row 0, the row-2/row-3 wall frames with the metal columns blank, the
overhang column, the `40..44` gate run, `37` on a real trap cell, Java's exact wire frame beside a live pylon, `-1` on
a pylon cell before the seal and `38` after a pylon is destroyed with the arena sealed, plus the in-game examine lines
for both the wiring and the gate. **Also fixed in the same pass, found by the same live check**: the four pylon cells
were force-painted `Terrain.EMPTY`, which made `updateState()`'s entire pylon branch unreachable (`map[j] == EMPTY_SP`
is that branch's guard, and the corner stamps already leave `EMPTY_SP` there) - so no socket frame could ever appear;
the wire frames around them still drew because those read each *neighbour's* terrain. |
| `DwarfKing` phase machine (P1 summons + LINK/TELE, P2 throne/shield/waves, P3 bleed/summons/viscosity) | `takeKingTurn` + `summonKingAdd`/`kingP1Summon`/`kingAbility`/`kingWave`, `kingPhase`/`kingShield`/cooldown fields, `attack()`'s shield/LifeLink/P1-accel hooks | Ported, checked against tag `v3.3.8` (`DwarfKing.java`) - replacing the old sketch outright, whose half-HP Fury has no Java basis at all and whose hold-the-barrier turn ran the real barrier backwards (it is a shield pool on the King, not inaction). P1 hunts with exact summon/ability cooldowns (10-14, damage-accelerated `-= taken/8`), real ghoul/monk/warlock/golem rotation, furthest-subject LINK (damage splits evenly onto the King through his own shield) and TELE (subject beside the hero, real yells); at HP<=50 (100 challenge) P2 goes immobile with a full-HP shield and the real wave schedule (ghoul/monk/warlock/golem counts and thresholds both modes, real wave yells, `KingDamager` HT/12 self-chip per batch); at shield 0, P3 summons under 4 adds and yells once under 20 HP. **P3 viscosity-deferral is now ported too** (2026-09-11): `DwarfKing.damage()`'s phase-3 branch banks every hit whose source is not its own payout into the shared `Viscosity.DeferedDamage` pool (`deferKingDamage`, checked at the central damage boundary before the LifeLink split so the King's share defers too) and pays it out on his own turns (`tickMonsterDeferredDamage`, `max(1, floor(pool*0.1))` after a one-turn delay) - the King therefore takes no direct HP damage in P3, exactly like Java. Remaining: throne geometry (stands ground instead), the Imp shop, the LloydsBeacon upgrade, and presentation (the King's Crown drop is now granted on his death - see `kill`'s king branch). |

| `YogDzewa` phases (gates at HT-300, fist summons, P5) + `YogFist` proximity guard | `takeYogTurn`,
`summonYogMinion`, `yogDamageHook`/`yogShielded`/`guardFist`/`fistNearYog`, persisted phase/summon/beam state,
`kill()` cleanup | Ported, checked against tag `v3.3.8` (`YogDzewa.java`, `YogFist.java`) - replacing a turn-based
spawner (which double-spawned and ran a baseless 0.75/0.5/0.25 rhythm). HP floors at each gate with phase advance,
darkness line, and a fist spawn; fist-gated invulnerability and fist proximity guards route through every damage
source; last-fist death at phase 4 opens phase 5 with the real hope yell and summon burst; regular
Larva/Ripper/Eye/Scorpio summon cadence now runs while fists are alive and cleans up when Yog dies; the DeathRay now
uses the real 10-15 cooldown shape, 20-30/30-50 damage ranges, two-phase `targetedCells` telegraph, `beams = 1 +
(HT-HP)/400` multi-target volley with the adjacent-cell beam reduction, and Java's `INFINITE_ACCURACY` (Yog's HP stays
balance-scaled at 400 vs Java's 1000); fists preserve the six real subclass identities and their shared
fire/root/ooze/cripple effects, but fight on the port's own scaled stat line (60 HP, 20/10 accuracy/evasion, 6-12
damage, 0-5 armor - Java's six subclasses share one line of 300/36/20/18-36/0-15 and differ only in abilities, so
there was never per-subclass tuning to preserve; the older wording here claiming real HP/accuracy/evasion/damage/armor
was wrong, corrected 2026-09-15). Fists also keep Java's own `maxLvl = -2`, granting no experience like the King and
Yog himself. Larva is now a standalone kind with its exact Java stats (HP 20, accuracy 30, evasion 12, damage 15-25,
armor 0-4) and its own art rather than reusing the Ripper kit. **Challenge pairs are now ported too** (2026-09-11):
the per-gate fist identities come from Java's real `fistSummons`/`challengeSummons` decks - built once per Yog on
`Random.pushGenerator(Dungeon.seedCurDepth()+1)` with one fist from each opposed pair, `Random.shuffle`d, plus the
paired counterparts in one of Java's two rotations on the Stronger Bosses challenge - so a fist and its own pair can
never open together, and the decks' three entries (six on the challenge) bound the fist count by themselves instead of
the old three-live cap. **A Rusted YogFist now banks its own incoming damage too** (2026-09-11): `RustedFist.damage()`
defers every hit into the same `Viscosity.DeferedDamage` pool the glyph uses (`deferMonsterDamage`, the shared monster
deferral the Dwarf King's phase 3 also uses) and pays it out on its own turns, so a Rusted fist never loses HP
directly. **The visibility shrink is now ported too** (2026-09-11): the Halls boss floor caps its level view distance
at 4 (`HallsBossLevel.viewDistance = min(4, viewDistance)`), and while Yog lives `YogDzewa.updateVisibility()` shrinks
it by phase - 1 -> 4, then `max(4 - (phase-1), 1)` (3/2/1/1) - applied to both the hero's FOV and monster sight
through the port's shared `viewRadius()`. **The beam now burns flamable terrain too** (2026-09-11): `YogDzewa.act()`
runs `Dungeon.level.destroy(p)` on every flamable cell of each beam path - Java's FLAMABLE flag covers
GRASS/HIGH_GRASS (including the furrows a Soiled fist or a Regrowth wand leaves, which is what makes this visible in
the arena) and both door states. Java rewrites the tile to EMBERS; this port's live terrain has no EMBERS id, so a
burned cell becomes plain FLOOR, whose flags (passable, not flamable) match EMBERS' own. **The Soiled fist's grass is
now ported too** (2026-09-11): `SoiledFist.act()` grows grass around itself every turn (`Random.chances([0,2,1])`
furrow rolls that upgrade a plain GRASS neighbour, then plain grass across its 3x3), `SoiledFist.zap()` roots its
target and grows grass (1-in-5 tall) across the target's 3x3, both gated by `canSpreadGrass()` (more than 4 cells from
Yog's own `exit + width*3` anchor, non-solid, not already tall), and `SoiledFist.damage()` blunts incoming blows by
`(6-n)/6` for n tall-grass cells in its 3x3 and ignores Burning itself. This port's live terrain has no
`FURROWED_GRASS` id, so Java's furrow rolls land on the `HIGH_GRASS` state instead; and because the port applies one
combined per-turn DoT, Burning's immunity only covers the case where Burning is the sole damaging effect. **The Bright
and Dark fists' half-health warp is ported too** (2026-09-11): the first time either drops past `HT/2` it pins there,
warps to a random level cell that is not in the hero's FOV, unoccupied and reachable from the exit (Java's
`Random.Int(level.length())` loop, shared `teleportFistAway`), and costs the hero something - Bright prolongs
Blindness (1.5x on the pin, 3x on death) and Dark detaches the hero's Light. Java's own Blindness is only a cosmetic
screen darkening (a `FlavourBuff` with no mechanical effect in v3.3.8), and this port has no Light artifact to
weaken/detach, so both feedback paths keep the port's `daze` stand-in. **The arena seal is now ported too**
(2026-09-14, `HallsBossLevel.java` 242-284): `populate()` no longer spawns Yog on floor entry - the entrance converts
to `EMPTY_SP` floor art and Yog rises at Java's `exit() + width*3` when the hero walks two cells from the entrance
(`checkHallsBossSeal`, on the hero-move path with the Caves gate; the exit-tile half of Java's trigger
reads the paint grid, which `unseal()` sets to `EXIT` - see the 2026-09-16 unseal note below). An occupant of the spawn cell is
shoved to a free 8-neighbour (`boss.pos + 2*width` when all are taken), the flag persists through save/load with the
sealed tile re-applied to regenerated paint, and a pre-seal save's live Yog blocks a second spawn. Verified live
(`tools/scratch/halls-seal-livecheck.mjs`, 8/8 assertions). Not ported, stated: `super.seal()`'s lock, the
flame burst (no one-shot hook in the pooled particle layers). The boss-challenge-badge flag is ported - see the `BOSS_CHALLENGE_1..5` row.
**`unseal()` is now ported too (2026-09-16)** - see the auto-descent note in the Sewer-boss section below:
`applyYogDeathUnseal()` restores the entrance, sets the `EXIT` tile, swaps both centre pieces to their
portal/archway variant via `setLayerData`, and opens the exit stairs at (16,9) instead of auto-descending.
Still unported, stated: the `ShadowParticle` bursts and the `THEME_FINALE` music fade.
**Corrected 2026-09-16: both of the clauses this row used to carry were mis-described, and the flame/shadow arenas are
now ported.** (1) It is not a "Dark zap" and not `Light.weaken(50)`: `YogDzewa.updateVisibility()` shrinks the
*hero's* own sight to the arena's radius (`4 - (phase-1)`, floored at 1, and 2 under the Darkness challenge) and skips
that when the hero holds the **`Light` buff** - which in SPD comes from a **Torch**, now a real item
here (`useTorch`: one torch for the 250-turn buff, spending the turn, icon `BuffIndicator.LIGHT = 22`), so the
exemption is live too (`viewRadius()` skips the shrink while lit and floors sight at `Light.DISTANCE` 6, which is what pierces Darkness's 2). Stated simplifications: no BURNING sample, flame burst, operate animation, or Catalog use count (this port has no seam for any of them); the shared sight radius means monsters see at the hero's lit radius too. (2) Phase-0 dormancy was never missing: `takeYogTurn`'s phase-0 branch owns Yog's whole turn, keeps
it invulnerable, and notices only once `fov.isVisible` covers it, then yells, sets phase 1 and rolls fresh cooldowns -
Java's `Dungeon.observe()`/`notice()` pair, whose boss-bar half has no UI here and whose music Java starts on the
notice while this port starts it on floor entry. (3) The arena's centre pieces are now ported: `hallsBossVisuals.ts`
transcribes `CenterPieceVisuals`/`CenterPieceWalls` - two fixed 9x8 blocks of `halls_special.png` art at `(ROOM_LEFT,
ROOM_TOP+1)` and `(ROOM_LEFT, ROOM_TOP)`, one either side of the wall layer - with `unseal()`'s portal/archway variant
swapped in live by `applyYogDeathUnseal()`. Java declares `tileH = 9` for the walls block while
its array holds eight rows, so the two blocks differ by one row, which is exactly how Java paints them over each
other. Pinned by a `verifyVault.mjs` check and browser-verified live (`tools/scratch/halls-centerpiece-livecheck.mjs`,
5/5: the frames, their origins, the blank rest of the floor, and the two layers straddling the wall layer). |
| `Goo`: full kit (see before) | `MONSTERS.goo`, `liveStats`, `takeGooTurn` | Ported, with one simplification: the pumped slam only fires at melee range, not as the 2-tile lunge. **The arena seal is now ported too** (2026-09-14, `SewerBossLevel.java` 177-195): Goo spawns SLEEPING - Java's `Mob.state` default, which the port's boss-wide awake exemption had wrongly lifted - wakes on the real detection roll, and `takeGooTurn` seals on his first acting turn (Java's `act()` site; the `damage()`/`notice()` sites reduce to the same turn via the existing hurt wake, at most one round late, stated). The entrance becomes live + paint `WATER` with restitched frames and a refreshed water layer, and the flag persists through save/load with the tile re-applied. Verified live (`tools/scratch/sewer-seal-livecheck.mjs`, 6/6 assertions: asleep on entry, wake spends the turn unsealed, first acting turn drowns the entrance, round-trip keeps flag/tile/Goo). **The `unseal()` half is now ported too (2026-09-16)** - see the auto-descent note in the Sewer-boss section below. Not ported, stated: the `LockedFloor` buff that actually bars Java's exit (this port's exit is the stairs, gated on the boss's death the same way - and Java's own `WATER` is walkable too, so the tile never blocked anyone), the `SEWERS_BOSS` switch (already playing on boss-floor entry), the ripple (no one-shot particle hook), and Goo's `notice` yell. The boss-challenge-badge flag is ported - see the `BOSS_CHALLENGE_1..5` row. |

| `Tengu`: `HP`, `defenseSkill`, `damageRoll()`, `drRoll()`, melee *and* ranged `attackSkill()` (10 adjacent / 20 at range) | `MONSTERS.tengu`, `takeTenguTurn`, `seedBossTrap` | Ported, extended this pass with the phase-2 rhythm: HP cannot cross more than one 1/8-bracket per hit (`clampTenguBracket`, hooked into melee/thrown/zap hits, bomb blasts, and DoT ticks), every bracket crossing relocates 5-7 away with the trap burst (capped at 4 jumps, `tenguBracketJump`), and below half HP a bomb-ability rotation plants real 3-turn `tenguBomb` fuses (nearest free hero-adjacent cell) detonating for the real range-2 `NormalIntRange(5+depth, 10+2*depth)` blast through the shared routine. Terror-immune like the real immunities list (Roots/Blindness/Dread have no seam anywhere). **2026-09-11: the FIGHT_START/FIGHT_ARENA split is ported** - crossing half HP pins HP to `HT/2` and latches `tenguPhase='arena'`; before the latch a 1/8-bracket crossing warps within Tengu's cell and refills it with `Patch`-generated dart traps (`placeTrapsInTenguCell`, `arenaJumps` untouched), after it the crossing is the phase-2 5-7 relocation that raises `arenaJumps`. Simplified: the move keeps the port's single Tengu-cell arena rather than rebuilding Java's separate `arena` ellipse (`setMapArena()`, (3,1)-(18,16)), so the darts persist into phase 2 and a phase-2 jump can land outside the cell, and Java's trap-free distance band for the dart patch is approximated by keeping the hero and its neighbours clear. The Fire cone, the Shocker anchored burst, and Java's real catch-up ability scheduler are all ported (see the dedicated Tengu-abilities row below). **2026-09-15: the arena ellipse's geometry is ported too, but not yet wired live.** `src/spdLevelGen/bossLevels.ts` gained `prisonBossPause()`/`prisonBossArena()`/`prisonBossEnd()`, faithful `PaintLevel` ports of `setMapPause()`/`setMapArena()`/`setMapEnd()`, verified by four new `tools/verifyVault.mjs` checks (the pause map's door/seal/crack cells, the arena ellipse's inside/outside boundary, the end map's door/chasm/exit/wall-deco sample cells, and that ordinary floor entry is untouched). Resolved first, and cited in these new functions' own doc comments: `ROADMAP.md`'s Tengu bullet used to record an "unresolved" note about whether the hero needs relocating for these transitions - re-reading `PrisonBossLevel.progress()`/`cleanMapState()` in full showed Java never moves him for `FIGHT_START`/`FIGHT_PAUSE` at all (only for the `FIGHT_ARENA` death transition), relying instead on the fight having naturally drifted into the region each transition carves out. **Not done**: calling these three functions from anywhere live. `dungeonScene.ts`'s `tenguPhase` state machine still runs the whole fight over the single existing Tengu-cell arena (this row's "Simplified" sentence above). Two rendering primitives this needs already exist, just never combined this way: `restitchAllTiles()` (a floor-wide terrain/wall/grass/feature re-render) and the mining-branch precedent's `this.level.terrain.set(toGameTerrain(...))` bulk write. **Correction, same pass: the transition trigger itself was misread.** Re-reading `PrisonBossLevel.occupyCell()` (not just `progress()`/`cleanMapState()`) shows the `FIGHT_PAUSE -> FIGHT_ARENA` transition (`setMapArena()`) is not drift-based - it fires when the hero's own move lands on `y <= startHallway.top+1`, checked on every hero step, while `case START -> FIGHT_START` fires the same way on `y > tenguCell.top`. Tengu is also `Actor.remove`/`mobs.remove`d entirely during the `FIGHT_PAUSE` gap and re-added at the arena centre only once the hero triggers the retreat - a stateful add/remove dance this port's actor roster has never needed to do for a boss before. See `ROADMAP.md`'s Tengu bullet for the corrected four-step sequence and full remaining scope. **`FIGHT_PAUSE -> FIGHT_ARENA` is now live and browser-verified (2026-09-15).** `checkTenguArenaRetreat()` fires on the same `y <= startHallway.top+1` condition, bulk-writing `this.level.terrain`/`this.portedPaint.map` from `prisonBossArena()`'s paint and calling `restitchAllTiles()`, then teleporting Tengu to Java's own arena-centre formula. **Deliberately simplified**: Tengu stays alive through the wait (`'cell' -> 'paused' -> 'arena'`) instead of Java's remove-then-re-add vanish beat, which this port's actor lifecycle has no precedent for. Verified live: the repaint correctly refuses to fire while the hero is still deep in `tenguCell` (proving the retreat gate is load-bearing, not cosmetic - this port's whole first phase is fought entirely outside the arena ellipse, so firing on the old HP-threshold alone would wall the hero in), fires once the hero reaches row 8, and a full-grid sample afterward found all 156 walkable cells inside `(3,1)-(18,16)` with zero outside. **The initial seal/spawn trigger is now live (2026-09-16)**: `checkTenguFightStart()` is `progress()`'s `case START:` fired from the move path (this port's `occupyCell`), so `populate()` no longer spawns Tengu on floor entry - he does not exist as an actor at all until the hero's own move lands past his locked door. Java's own order is kept because it is observable: the spawn cell resolves first (`pointToCell(tenguCellCenter)` = (10,27), a random free 8-neighbour when something is already standing there, and the whole transition abandoned and retried on the next move when there is no free cell), and only then is the door the iron key just spent re-locked behind the hero. **That re-lock is what forced the third repaint to be wired too**: Java reopens the door at the next transition, so `enterTenguPauseMap()` now calls `setMapPause()` at the half-health beat - previously `prisonBossPause()` existed, was geometry-verified, and was called from nowhere, while the port simply left the door open. `applyTenguDeathTransition()` re-places the door for `setMapEnd()`'s own `Painter.set(tenguCell.left+4, tenguCell.top, Terrain.DOOR)`, since `applyPrisonBossPaint` writes terrain only and this port's `Doors` registry owns locked-ness. The three are one chain, not three features: sealing the hero in at the trigger is only coherent because the pause repaint reopens the door he retreats through, and the death repaint reopens it again for the exit it has just made walkable. Browser-verified end to end with 15 assertions (`tools/scratch/tengu-start-livecheck.mjs`): the hero walks the 18-cell hallway from the cell he arrives on without triggering anything, spends a real `ironKey` on the door (no debug unlock), steps past it and Tengu appears at (10,27), the door re-locks behind him, an occupied centre puts Tengu on a free neighbour instead of stacking him, a fully-blocked centre leaves the trigger unspent rather than half-applied, a pre-trigger save's live entry-spawned Tengu is adopted rather than duplicated, and half HP / the retreat / the death transition each leave their own destination genuinely walkable. Still open here, all unchanged from this row's own list: the vanish beat, `clearEntities`' heap/mob/plant destruction and `cleanMapState()`'s blob/trap clearing at each repaint (the dart traps are deliberately kept), `seal()`'s `LockedFloor` buff, `Mob.holdAllies`/`restoreAllies`, and the wool burst/PUFF/`PRISON_BOSS` music. (`Statistics.qualifiedForBossChallengeBadge` is ported - see the `BOSS_CHALLENGE_1..5` row.) **The floor underneath all of it was unwalkable until the same pass** - see the `PrisonBossLevel` row below. **`FIGHT_ARENA -> WON` is now live too
(2026-09-15), closing depth 10's half of the auto-descent gap - the other four halves
closed 2026-09-16 (see the Sewer-boss section's auto-descent note).** `applyTenguDeathTransition()` runs instead of the shared boss-death `depth++`/`enterLevel()` for `creature.kind === 'tengu'` specifically (every other boss unaffected): repaints via `applyPrisonBossPaint()` (factored out of `checkTenguArenaRetreat()` to share both call sites) to `prisonBossEnd()`, repositions the hero to Java's own `(10, 25)` cell (`tenguCell.left+4, tenguCell.top+2` - two rows past the door, not the door itself), and finds `endMap`'s baked `EXIT` tile to set `this.stairs`/`this.hasStairs = true` (unconditionally `false` for boss depths otherwise) plus draw the real stairs sprite. Java's ally/stored-item handling are correct no-ops (no allies or bag-pulled items in this fight). Browser-verified fully end-to-end: forced Tengu to 1 HP in `'arena'` phase and killed it - depth stayed 10, hero landed at `(10,25)`, `stairs` was the real walkable `(22,15)` exit; then `takeHeroTurn({x:1,y:0})` (the real move-resolution method, not a teleport) from one cell away correctly advanced to depth 11 onto its entrance ladder, exactly like an ordinary staircase. `tsc`/`build`/all suites green. **Re-verified 2026-09-16 after the layout fix below**: the death transition's exit is reachable *by walking* from the cell `setMapEnd()` puts the hero back in - a flood fill from `(10,25)` reaches the `EXIT` at `(22,15)`, pinned in `verifyVault.mjs`. The earlier live run that proved this only stepped the hero in from a neighbouring cell, so a sealed-in hero would not have shown up there. See `ROADMAP.md`'s Tengu bullet for what remains (the vanish beat, `clearEntities`/`cleanMapState`). |
| `Ghost Quest type 2/3` (`GnollTrickster` HP20/eva5/acc16, ranged-only, combo poison/burning; `GreatCrab` HP25/eva0, moves 2/3 turns, blocks seen melee + wand bolts, 2x meat) | `MONSTERS.gnollTrickster/greatCrab`, `takeMonsterTurn` branches, `rollHit`'s crab block, `useSpecial`'s wand-negate | `GnollTrickster.attackProc()`'s real `effect = Random.Int(4) + combo` formula is now **ported** (`mobOnHit`'s gnollTrickster branch), correcting this row's earlier claim - the previous flat `combo>=3`/`>=6` cutoff meant an early hit could *never* ignite and a long combo was a guaranteed ignite with no variance either way, where real Java rolls randomness on top of the combo counter every hit (e.g. even the very first hit has a real chance to poison). `effect>=6` ignites (skipped if already burning) and `effect>2` otherwise poisons, both gated exactly as Java gates them; `combo` now also resets to 0 whenever the Trickster moves instead of attacking (`getCloser()`'s own reset, ported into both `stepAway` and the generic-movement fallback in `takeMonsterTurn`) rather than only ever climbing. Simplified: Java's `Poison.set(effect-2)` sets a real magnitude this port's poison buff has no field for (a pre-existing, separately-documented simplification), so only the ignite-vs-poison-vs-nothing threshold is faithful, not the poison's duration. Browser-verified live: 400 trials at combo 1 (effect range 1-4) produced poison exactly ~50% of the time and never ignited; 400 trials at combo 6 (effect range 6-9) ignited every time. The crab's target-based block is range-based so the quest stays completable |

| Every other Sewers/Prison/Caves mob's unique behaviour beyond the four base stats | - | Ported in full - these have no special mechanic in Java beyond their stats |
| Sleeping/wandering (`Mob.SLEEPING`, wake radius, `WANDERING`/`HUNTING`/`FLEEING`) | `spawnMonster`'s `sleeping`, `takeMonsterTurn`'s wake check, `decideMonsterAI`, `simulation/buffs.ts`'s `NEGATIVE_BUFFS` | Sleeping wake-ups roll the real `1/(distance+stealth)` detection (stealth 0), gated on the mob's own sight, with Silent Steps/levitation as their real never-wake immunities and the woken mob waiting its turn. **The negative-buff wake is now ported too (2026-09-09 roadmap pass)**: `Mob.Sleeping.act()`'s "debuffs cause mobs to wake as well" is an unconditional, no-roll wake checked before the sight-gated detection roll - real, reachable in this port since `spreadFire`/`spreadPlantBlobs` already apply `burning`/`poison`/`ooze` to sleeping monsters standing in fire/gas without ever waking them before this fix. Checked each buff's own Java class (tag `v3.3.8`) for `buffType.NEGATIVE`: `poison`/`burning`/`cripple`/`weakness`/`vulnerable`/`paralysis`/`roots`/`terror`/`ooze`/`degrade`/`daze`/`hex` qualify; this port's own invented stand-ins (`focus`/`cloak`/`frostImbue`/`lethalHasteCooldown`) have no real monster-facing negative equivalent and are excluded. Browser-verified live via `window.__MWG__.currentScene`: a sleeping, out-of-sight (`seesHero: false`) dummy with no buffs stayed asleep through `takeMonsterTurn`; the same dummy given a `poison` buff woke immediately despite still being out of sight. Remaining: no per-mob custom `HUNTING` classes (the generic last-known pursuit in the row below, not per-kind overrides), and the WANDERING notice roll plus patrol sampler live in the row below rather than here - this row's old "no notice roll" claim went stale when that row ported them. Still unmodeled: ally-aware targeting (needs the unported ally-vs-monster combat system). |

| Awake wandering detection and patrol (`Mob.Wandering.act`) | `takeMonsterTurn`'s `wasSeen` edge, `heroStealth()`, `Creature.patrolTarget`, `randomPatrolDestination` | Simplified but Java-shaped: when an awake mob first acquires the hero in its FOV, it rolls the real `Random.Float(distance/2 + stealth) < 1` notice test; a failed notice holds the mob for that turn. When no enemy is acquired, it retains Java's persistent random destination and paths toward it, with floor save/load and piranhas' water-only restriction. The destination sampler additionally excludes occupied cells, and specialized ranged target migration remains unmodeled. **Hunting pursuit ported (2026-09-17)**: `Creature.lastSeen` is Java's `Mob.target` while hunting - refreshed to the hero's cell every seen turn, persisted through save/load, and set by every mass-alert source (wraith spawn, minion summons, the annoying-curse beckon, `ScrollOfRage`). A mob that loses sight paths to `lastSeen` before giving up to wandering (arrival or unreachable clears it, spending the turn where Java plays `showLost`), and re-acquires without a new notice roll while hunting - Java only rolls on the WANDERING-state transition, so a mob that gave up rolls again like a first acquisition. Fleeing mobs never pursue (Fleeing is its own state in Java). The pursuit step blocks every creature including the hero, matching Java's `getCloser` failing on occupation; patrol steps keep the hero steppable as before. |
| Monster item drops (`loot`/`lootChance`) and `Gold.random()` amounts | `MOB_LOOT` + `rollLoot`, `pickupGroundItemAt`'s gold branch | Simplified - one ground item per kill (no stacking heaps); gold amounts are the real `Int(30+depth*10, 60+depth*20)`. The flat chances and the `LimitedDrops` decay behind them are Java's own per-kind numbers (Bat/Necromancer/Guard/DM200/Golem/Shaman/Slime/Skeleton/Thief/Swarm, with the Wealth and Bounty Hunter modifiers) - DM201 inherits DM200's 0.2 base with the shared `DM200_EQUIP` counter since 2026-09-17 (it used to roll a flat 0.125 of its own). Weapon-category picks (DM200/Golem/DM201/Slime/Skeleton) fold to the `armor` ground kind - this port has no weapon ground kind to drop them as. |

| Corpses (heaps) beyond meat drops | `meat` ground item (Spinner/GreatCrab) | Simplified - meat eats as food; no corpse objects, no cook/carpaccio chain |
| Blob-area DoTs (fire/gas spreading over cells) | `simulation/buffs.ts:advanceBuffs`, `evolveJavaBlob`, `applyEnvironmentalBlobs` | Simplified - per-creature damage/timers; area fire and gas fields are handled separately in the scene. **Burning's roll was corrected 2026-09-12**: Java's `Burning.act()` is `Random.NormalIntRange(1, 3 + Dungeon.scalingDepth()/4)`, an inclusive range, so the port now rolls `int(1, 4 + floor(scalingDepth/4))` with the depth threaded from the scene (`tickBuffs(c, this.depth)`); the old fixed `int(1, 3)` gave 1-2 at every depth and was this port's own invention. Poison stays `int(1, 2)` = 1/turn, which is Java's `Poison.act()` value. Damage is still rolled before decrement/expiry, including on a zero-duration buff. Hero backpack burning is now live for concrete scroll/meat payloads; only the compact-inventory reductions and `acted`-gated water extinguish ordering remain simplified. |

| `Fury` kindling below half HP | `attack`'s fury branch | Ported |

## Levelling and skill points (`actors/hero/Hero.java`, `Talent.java`; `mwg/actors`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `Hero.maxExp(lvl) = 5 + lvl*5` (turned into `Progression`'s cumulative-total shape) | `SPD_LEVEL_CURVE` (`Actors.Progression`) | Ported |
| `Mob.java`: `exp = hero.lvl <= maxLvl ? EXP : 0` on a kill | `SewersScene.kill`, `MONSTERS[kind].exp`/`.maxLvl` | Ported |
| Level-up block: `HT = 20 + 5*(lvl-1)`, current HP carried forward by the same delta | `grantExperience` | Ported |
| Level-up block: `attackSkill++`, `defenseSkill++` every level | `heroAttackSkill`/`heroDefenseSkill`, synchronized into `heroStats` | Ported - raw combat skills grow independently by +1 each level; talent points are separate and spent through the selectable talent UI. |
| `Talent.tierLevelThresholds = [0,2,7,13,21,31]` (tier 1: levels 2-6, tier 2: 7-12) | `grantExperience`'s tier checks, `talentPoints` | Ported as a persisted talent-point ledger: points accrue through the Java talent windows, while the UI exposes Tier 1/2 nodes and selected subclass Tier 3 nodes. **Bug found and fixed, 2026-09-09 hero-progression audit**: points were previously drawn from one shared `Actors.SkillPoints` pool across all three UI tiers (itself repurposed as a bare counter by immediately reverting the `accuracy` stat bump it caused as a side effect), letting a player freely cross-spend an unspent T1 point on a T2/T3 talent the moment that tier unlocked - real Java's tiers each keep their own separate pool, and a tier's points can never buy another tier's talents. Replaced with a plain per-tier `[number, number, number]` array, granted into the correct bucket by `Talent.tierLevelThresholds`'s own windows (T1 [2,7), T2 [7,13), T3 [13,21)); T4's [21,31) window (10 points) is deliberately never granted at all, since this port has no T4 talents to spend them on - the old single pool silently leaked all 29 levels' worth (T4's 10 included) into the three tiers the UI actually shows, a real balance bug beyond just the cross-tier-spend one. Old saves (`skillPoints`/`skillPointsState`) migrate their one remaining unspent total into the T1 bucket on load, since the old format has no record of which tier those points were earned in. Browser-verified live via `window.__MWG__.currentScene`: `grantExperience(100000)` to level 30 produced exactly `talentPoints = [5, 6, 8]`, matching Java's per-tier totals precisely (and confirming T4's 10 are correctly absent); spending T1's pool down to 0 left T2's 6 points completely untouched. |
| `SUCKER_PUNCH`, `TEST_SUBJECT`, `HEARTY_MEAL`, intuition talents, meal/upgrade recharge talents | `attack`, `readScroll`, `eatFood`, equipment use and `upgradeGear` | Partially ported with rank-aware effects: surprise damage, identify healing/recharge, meal bonuses, upgrade recharge, equipment identification and stealth wake-radius rules; exact identification timing multipliers remain simplified. **Three real bugs found and fixed, 2026-09-09 hero-progression audit** (`Talent.java`, tag `v3.3.8`): (1) **`hearty_meal`** used two invented HP thresholds (25%/50%) with non-Java additive shapes - real `onFoodEaten()` has a single `HP/HT < 0.334` threshold with a flat `2 + 2*points` heal; fixed to match exactly, browser-verified (0 heal at 40% HP, exactly `+6` at rank 2 below the threshold). (2) **`sucker_punch`** added a flat `points` bonus - real `onAttackProc()` rolls `Random.IntRange(points, 2)` (1-2 at rank 1, flat 2 at rank 2); fixed, browser-verified (rank 1 produced only `{1,2}` over 40 isolated swings, rank 2 only `{2}`). Real Java also gates this once per enemy via a `SuckerPunchTracker` buff (no re-proc on repeat surprise hits against the same target) - this port has no equivalent tracker and re-procs every time, a disclosed remaining gap, not fixed. (3) **Correction, 2026-09-09 roadmap pass: `test_subject`/`tested_hypothesis` are real Java talents, not invented substitutes for `PROVOKED_ANGER`/`LINGERING_MAGIC`.** The hero-progression audit's claim was wrong - it checked only Java tags `v3.3.8`/`4.0.0-beta`, but `src/generated/spdMessages.ts`'s own real, fully-translated English text (`actors.hero.talent.test_subject`/`tested_hypothesis`, built from a more complete SPD source than either tag) confirms both are genuine, named talents this port's code already targets almost exactly. Real `test_subject`: "+1: heals 2 HP on identify, +2: heals 3 HP" - exactly what `heal + 1` already computes (rank 1 -> 2, rank 2 -> 3), no bug. Real `tested_hypothesis`: "+1: gains 2 turns of wand recharging on identify, +2: gains 3 turns" - **two real bugs found and fixed here**: the code granted `charge + 1` *whole wand charges* via `Charges.refund()`, drastically stronger than "N turns of recharging" (a charge normally takes `recoverWandCharge`'s own 10-50 turns); switching to `Charges.advance(charge + 1)` alone was still wrong, since `advance`'s argument is progress-units-toward-a-charge with this port's `regenRate: 1` (one unit fills a charge), not real game turns. Fixed to compute the *current* per-turn passive regen rate (`ringEnergyMultiplier / turnsToCharge`, the same formula `recoverWandCharge` uses) and bank exactly `charge + 1` turns' worth of it via `advance(perTurnRate * (charge + 1))`. Browser-verified live: at 4 missing charges, rank 1 banked exactly `2 * (1/33.4) = 0.0598` progress (previously: 2 whole charges instantly) - the code comment at the call site now cites this exact derivation. |
| Remaining proc-heavy talent effects | `heroShield`, charge hooks, combo/kill hooks and `talentRank` | Incrementally ported: barrier absorption, healing shields/evasion, combo/kill/cleave, point-blank ranged **accuracy** (2026-09-15 - the talent's real mechanism; see the row above), subclass charge/sustain effects, stealth shielding, lethal momentum/haste/deathless fury/endless rage, necromancer minions, follow-up strikes, heightened senses, durable projectiles/tips, nature's aid/bounty, shielding dew, rejuvenating steps, weapon recharging, wand preservation, farsight/arcane vision, Iron Will, Iron Stomach, Cached Rations, Improvised Projectiles, Evasive Armor, Assassin's Reach/enhanced lethality, Empowered Strike, Bounty Hunter, Unencumbered Spirit, Monastic Vigor, Lethal Defense, Shared Upgrades, Twin Upgrades, Soul Siphon, Projectile Momentum, Enraged Catalyst, Rogue's Foresight and Swift Equip presentation are live; **five of those were wrong-shaped stand-ins, found auditing each helper against tag `v3.3.8` (`Talent.java`, `Mob.die()`, `Hero.damageRoll()`, `Wand.wandProc()`, `Level.updateVisibility()`) and now corrected**: Lethal Haste was a free-turn flag on every kill - real is `GreaterHaste.set(2+2*points)` turns on a hero-caused kill (melee, thrown, bow; never wand - Java's `cause` gate) behind a real 100-turn cooldown, now reproduced with the existing `haste` buff at its real x3 cost plus a ticking `lethalHasteCooldown` buff; Weapon Recharging was a per-hit wand-charge refund - real is `round(dmg*1.025+0.025*points)` melee damage while Recharging is held (ArtifactRecharge counts too in Java; no such buff exists here); Farsight was a +2/point ranged-targeting range - real is a `1+0.25*points` sight-radius multiplier in `viewRadius()` (targeting is a flat 6 for everyone); Arcane Vision revealed secrets on identify reads - real marks the zapped target (`CharAwareness`, `5+5*points` turns), now the over-broad but duration-exact `mindvision` on zap; Necromancer's Minions spawned a hostile skeleton on every warlock kill - real rolls `0.4*points/3` only on soul-marked deaths for a Corrupted Wraith ally, so with no SoulMark/Wraith/ally systems the stand-in is removed outright (its formula helper stays as reference) rather than kept wrong; Endless Rage's free-turn line is gone too (real Endless Rage only raises the Berserk cap, needing the unmodeled rage clock). Lethal Momentum's chance was already exact, only its trigger widened to missile kills per the same `cause` gate. Two `!= DUELIST` gates in the Java lines above are unsatisfiable alongside class-locked talents (both tags agree) - the port follows the evident intent for the talent-holding class, stated not silent. `verifySimulation.mjs` asserts the corrected shapes; pure threshold/class/rank rules are covered by `verifySimulation` (35 checks total), while full Pixi scene/effect choreography remains browser/integration coverage rather than headless unit coverage; rune transfer and shared-enchantment behavior are closed (2026-09-17, see ROADMAP.md section 6). **`natures_bounty` was found wrong outright, not merely simplified, and is now fixed**: fetched `HighGrass.java`'s `trample()` to confirm - the real talent has nothing to do with dew-drop odds at all (that was a fabricated stand-in with no textual or mechanical basis in the Java). It actually drops a depth-paced `Berry` food item, capped at `2+2*rank` total for the whole run via a never-reset `CounterBuff`; the schedule aims for a `targetFloor` and rolls `1/10` if the hero is already past it, `1/30` if exactly on it, `1/90` if still ahead of it. Reproduced as a new `natureBerriesDropped` run-persisted counter and the same three-tier chance in `trampleHighGrass`, dropping this port's shared generic `'food'` kind as the Berry stand-in (no distinct, weaker Berry item exists here - a real, narrower simplification, not the wrong-mechanic bug it replaces). **Also found while fixing this**: the fabricated version had silently swallowed the real, unrelated base `1/6` dew-drop chance real Java's `trample()` always rolls regardless of the talent (scaled instead by Sandals of Nature's `naturalismLevel`, an artifact this port doesn't model) - restored as its own unconditional roll, so removing the wrong talent logic doesn't also remove a real mechanic that was never talent-gated in Java to begin with. **2026-09-09 hero-progression audit, one more real bug fixed plus a batch of newly-documented substitutions and gaps** (`Talent.java`/`MeleeWeapon.java`/`MonkEnergy.java`/`Hero.java`, tag `v3.3.8`; `4.0.0-beta` for Cleric): **Aggressive Barrier bug fixed** - granted a flat `3` shield behind an invented rank-dependent threshold (0.4/0.6) instead of real `MeleeWeapon.useAbility()`'s `1 + 2*points` (3/5) behind a flat `HP/HT <= 0.5`; fixed, browser-verified (no shield above the threshold, exactly `+5` at rank 2 right at the 0.5 boundary). Real Java fires this on weapon-*ability* use specifically, which this port has no separate concept of from a class's own special action (`useSpecial` already stands in for every class's special the same way), so triggering it there remains this port's existing convention, not a new substitution. **Newly-documented invented substitutions** (each already gameplay-live, just previously uncommented - CLAUDE.md's dual-documentation rule): `secondary_charge` (Champion) grants ammo on kill in place of real `VARIED_CHARGE`'s partial wand-charge gain on ability use; `monastic_vigor` (Monk) grants a flat shield on Holy Tome heal in place of real `MONASTIC_VIGOR`'s threshold on the Monk's own separate energy resource (unmodeled); `twin_upgrades` (Champion) boosts armor-tier progression in place of real `TWIN_UPGRADES`'s dual-wielded-weapon tier equalization (no dual-wield system exists). **`iron_will` (Warrior), replaced with the real mechanic, 2026-09-14**: this row used to note the flat-damage-reduction stand-in above was invented because no `BrokenSeal` item existed; the seal is now real (see the dedicated `BrokenSeal` row) and Iron Will reads directly into its shield cap as Java does. **`swift_equip` (Duelist), correction, 2026-09-09 roadmap pass**: an earlier pass wrongly assumed the real talent reduces the general equip-time turn cost. Its actual spec, recovered from `src/generated/spdMessages.ts`'s real English text (absent from the Java tags that earlier pass checked), is a distinct, cooldown-gated quick-swap ability: rank 1 lets the Duelist instantly re-equip a *quickslotted* weapon once per 20-turn cooldown, rank 2 raises that to twice within a 5-turn window (same 20-turn cooldown) - ordinary inventory-panel equipping is unaffected either way. Still traced to the same practical conclusion for a different, now-correct reason: this port's `equipWeapon`/`equipArmor`/`equipRing`/`equipWand` never call `spendHeroTurn` at all - every hero, every class, already equips instantly with no cooldown of any kind - so the real cooldown-gated ability has no "slow" baseline left to be an exception to, and genuinely cannot be modeled distinctly without first giving ordinary equipping a real cost/cooldown. The log line remains an honest flavour-only stand-in. `thiefs_intuition` (Rogue) rank 1 does nothing - real rank 1's `setKnown()` effect (ring type known, level/curse still hidden) has no equivalent in this port's binary `identified` ring model, only rank 2's full-identify is reproduced; `bounty_hunter` (Assassin) **was** a flat gold-on-any-kill substitution for real `BOUNTY_HUNTER`'s item-drop-chance bonus scoped to prepared kills; **corrected 2026-09-12**, now that the `Preparation` subsystem it needed exists - see the `Preparation` row. `Char.attack()` arms the talent's tracker only for a hero attack made with Preparation up (`407-409`) and `Mob.lootChance()` then adds `0.02 * 2^(prepLevel-1) * points` to the drop-chance *multiplier* beside the Ring of Wealth's own, so it is neither gold nor an ordinary-kill effect. Browser-verified live over 900 gnoll kills per configuration: 0.496 with no talent, 0.504 with the talent but an ordinary attack (no leak), and 0.727 for a prepared attack at level 4 rank 3, against the predicted `0.5 * 1.48 = 0.74`. `shared_enchantment` (Sniper) and `durable_tips` (Warden) are both live (2026-09-17 correction - the "genuinely unimplemented (zero call sites)" claim went stale once `heroOnHit` and `missileDurabilityCost()` were wired; ROADMAP.md section 6's line is now checked off too); their exact target formulas (33/67/100% enchant-share chance, 2x/3x/4x dart durability) are recorded in `src/talents.ts`'s own comment alongside the code. **Cleric's entire T1/T2 talent tree is Mage's tree copy-pasted verbatim** (`src/talents.ts`) - confirmed against `4.0.0-beta`'s real, wholly distinct Cleric tree (Holy Lantern/light-spell mechanics this port has none of); Cleric is a real, playable, unlockable class here, and this gap had zero documentation anywhere before this pass - now commented in `src/talents.ts` and recorded here. Subclass-choice gating (locks in once at level 13, only the chosen subclass's 3 T3 talents) and armor-ability effects (`warding`/`arcane`, both real non-no-op effects) were checked and found correct; the exact real-Java correspondence for `warding`/`arcane` was not identified within this pass's budget. |
| `MAX_LEVEL = 30` | `SPD_LEVEL_CURVE.maxLevel` | Ported |
| `MissileWeapon`/`Talent.shared_enchantment` | `useSpecial` throw path, `heroOnHit` | Ported for the available generic missile path: thrown hits carry explicit ranged provenance and, for Sniper, invoke the equipped bow enchantment only when `Random.Int(3) < points` (33/67/100%). **Warden's `durable_tips` is ported too (2026-09-17 correction - the "no `TippedDart` item exists" claim was stale: tipped darts exist as `tippedSeed` payloads, shop stock and wielded ammo): `missileDurabilityCost()` divides the use cost by `1 + points` (2x/3x/4x) via `tippedDartUseDivisor`, with rot darts exempt per their desc. Stated: the mastery-potion `-2` has no per-item system to read, and gating reads the Warden subclass where Java reads talent points (equivalent - only Wardens can hold the talent). |
| `Talent.SUCKER_PUNCH` / `SuckerPunchTracker` | `attack` and `suckerPunchTargets` | Ported: the real `Random.IntRange(points, 2)` surprise bonus is now granted only once per stable enemy id, with tracker state saved and removed when that enemy dies. |
## Armor abilities (`items/armor/ClassArmor.java`, `items/KingsCrown.java`, `actors/hero/abilities/**`)

The tier-4 armor abilities. Before this pass this whole feature was two invented, effect-free ids
(`warding`/`arcane`) picked from a level-21 "capstone" branch in the port's own `Advancement` track,
plus a Ratmogrify that cost no charge and was spent through the class-special action. All real
`v3.3.8` values below were read from the tag's own sources.

| Java block | TS destination | Status |
| --- | --- | --- |
| `HeroClass.armorAbilities()`: three abilities per class, in order | `src/content/talent-rules.mwl`'s `armorAbilities` table, `ARMOR_ABILITIES`/`armorAbilitiesFor` (`src/talents.ts`, `src/armorAbilities.ts`) | Ported as data: all 18 real ids with each one's `baseChargeUse` (35 default; 25 for Wild Magic/Death Mark/Spectral Blades/Elemental Strike, 50 for Endure/Smoke Bomb/Feint), its `targetingPrompt()` shape (`cell`/`none`, plus the three state-dependent ones collapsed to `beacon`/`clone`/`hawk`), and its own three tier-4 talents. **The Cleric's three (`Trinity`/`PowerOfMany`/`AscendedForm`) carry no row at all** and are Not ported: this port's Cleric has the Mage's talent tree and no HolyTome spell system for them to hang on, and `spdMessages.ts` has no `actors.hero.abilities.cleric.*` strings to name them with. |
| `KingsCrown.execute(AC_WEAR)` -> `WndChooseAbility` -> `KingsCrown.upgradeArmor()` | `dungeonScene.useKingsCrown`/`refreshTalentPanel`'s ability panel/`chooseArmorAbility`/`grantArmorAbility` | Ported: wearing the crown on real armor (not the starting cloth, Java's `naked`/`crown_clothes` refusal) opens a choice panel listing the class's abilities by SPD's own translated names, each row showing its real `short_desc` on hover; choosing consumes the crown, sets `armorAbility`, and starts the charge at Java's own 50. Cancelling leaves the crown in the bag. A class with no *ported* ability keeps this item's previous behaviour (the real `desc` line) rather than opening an empty choice - see the Not-ported rows below. |
| `ClassArmor.charge` + `ClassArmor.Charger.act()` (`100/500f` per tick, `RingOfEnergy.armorChargeMultiplier`) | `armorCharge`, `recoverArmorCharge` in `spendHeroTurn`'s effect list | Ported, with one stated shape difference: Java keeps the charge on the class-armor **item** (`ClassArmor.upgrade()` converts the worn armor into one), while this port has no ClassArmor item type, so the charge lives on the hero and is spent by whichever armor is worn. The rate, the 0-100 range, the 50 start and the Ring of Energy multiplier are Java's; because `finishHeroTurn` hands the clock one whole action, the tick is scaled by the action's own turn cost (a three-turn Endure regenerates three ticks, as Java's Charger actor does while the hero is busy). `Regeneration.regenOn()`'s starvation gate has no state to read here. |
| `ArmorAbility.chargeUse()` + `HeroicLeap.chargeUse()` | `armorChargeUse` | Ported: `baseChargeUse` scaled by `HEROIC_ENERGY`'s 12/23/32/40% table, with Heroic Leap's own `0.84^DOUBLE_JUMP` while its `DoubleJumpTracker` is up. Browser-verified live against every branch (35/30.8/26.95/23.8/21, and 17.425 for an armed rank-4 leap). |
| `Talent.initArmorTalents()` + tier-4 points | `armorTalentDefinitions`, `talentPoints[3]`, the panel's T4 tab | Ported: choosing an ability registers its three talents plus the universal `HEROIC_ENERGY`, all rank 4 (`Talent(17, 4)`'s second argument is `maxPoints`). T4 points follow `Hero.talentPointsAvailable(4)` exactly - 0 at or below level 20 or while `armorAbility == null`, then `1 + level - tierLevelThresholds[4]` (`level - 20`: 1 point at level 21 through 10 at level 30) with `31 - 21 = 10` as the hard cap, i.e. `min(level - 20, 10)` - granted up to the current entitlement when the crown is used at any level and one per level after. The tab appears only once an ability with a ported tree is chosen, and the per-level grant is gated the same way, so Ratmogrify cannot bank points no tab can spend. Browser-verified: a level-21 hero was granted exactly one point and spent it into `body_slam` (3/4 -> 4/4) through the panel. |
| `HeroicLeap.activate()` - `Ballistica.STOP_SOLID\|STOP_TARGET` route, the one-cell walk-back off an occupied landing cell, `BODY_SLAM`'s `NormalIntRange(points, 4*points) + round(drRoll*0.25*points) - target.drRoll()`, `IMPACT_WAVE`'s `1+points` blast-wave shove with `Int(4) < points` Vulnerable, `DOUBLE_JUMP`'s tracker | `activateHeroicLeap`, `simulation/warriorAbilities.ts` | Ported. Browser-verified live: leaps stopped one cell short of an occupied cell, the neighbour took the body-slam roll, was shoved exactly `1 + points` cells, and took Vulnerable on the talent's own roll; charge went 100 -> 65.2 (35 spent, 0.2 of regen from the spent turn). The shove reuses the port's established straight forced-movement primitive (the same substitution the Blast Wave wand already documents) rather than Java's `throwChar` trajectory, so terrain-pressing and collision damage remain simplified. `hero.rooted`'s shake-and-return spends neither charge nor a turn, as Java. |
| `Shockwave.activate()` - `ConeAOE(aim, min(aim.dist, 5+EXPANDING_WAVE), 60+15*EXPANDING_WAVE, STOP_SOLID\|STOP_TARGET)`, `heroDamageIntRange(5+STR-10, 10+2*(STR-10)) * (1+0.2*SHOCK_FORCE) - drRoll`, `STRIKING_WAVE`'s `Int(10) < 3*points` proc-and-combo promotion, `SHOCK_FORCE`'s `Int(4) < points` paralysis else 5-turn cripple | `activateShockwave`, `simulation/warriorAbilities.ts` | Ported, reusing this port's line-for-line `ConeAOE` translation (`src/mechanics/cone.ts`) with Java's own true-distance clamp. Browser-verified live: a target 6 cells out was untouched at `EXPANDING_WAVE` 0 and hit for 9 + cripple at rank 4 (max distance 9), a target at exactly the 9-cell boundary was hit only with the talent, a second creature directly behind the first in the same line was shielded by it (Java's own `STOP_TARGET` ray stop - the leading creature ends the ray), something outside the 60-degree arc was untouched, the hero was never caught by his own cone, and live charge spend matched the HEROIC_ENERGY rank restored from a save. `hero.attackProc`'s proc half is this port's `heroOnHit` chain at the same point, and the Gladiator combo increment mirrors `attack()`'s own. `Talent.StrikingWaveTracker` (an empty marker buff Java attaches at rank 4) is not modelled - it has no reader in Java either. |
| `Endure.activate()` + `EndureTracker` (`adjustDamageTaken`, `endEnduring`, `damageFactor`) | `activateEndure`, `endureAdjustDamageTaken`, `settleEndure`, `consumeEndureBonus`, `tickEndureDuration`, `simulation/warriorAbilities.ts` | Ported: 12 tracker turns, `hero.spendAndNext(3f)` (the only multi-turn ability), half damage while enduring with `SHRUG_IT_OFF`'s further `0.8^points` (60/68/74/80%), half of the pre-reduction damage banked, then at the hero's next action `SUSTAINED_RETRIBUTION`'s `1+0.15*points`, `EVEN_THE_ODDS`'s `1+0.05*points` per hostile within distance 2, and an even split over `1 + SUSTAINED_RETRIBUTION` strikes. **Two stated placements differ.** (1) Java applies the reduction pre-armor for a char attacker and post-armor for other sources; this port has one hero-damage boundary (`absorbHeroDamage`) and it sits post-armor, so the halving is slightly kinder to the hero than Java's melee case. (2) Java adds the banked counter-attack pre-armor; this port adds it where `damage` is already net of armor, so it lands a little harder. `settleEndure` runs at the start of the hero's *next* action (Java's `Hero.act()` site), not at the end of the casting turn, which would close the window before a blow landed. `Combo.addTime(3f)` is not modelled: this port's Gladiator combo is a bare landed-hit counter with no duration to extend. Browser-verified live end-to-end: cast spent 50 charge and three turns (77.5 -> 50.75 through the aim path, 100 -> 50.6 on a direct cast), a 40-damage hit returned 20 and banked 20, the settle produced one 20-damage strike, and the next melee attack dealt exactly 20 + 20. |
| The remaining five abilities: Mage `ElementalBlast`/`WildMagic`, Rogue `ShadowClone`, Duelist `Challenge`/`ElementalStrike` | - | **Not ported**, deliberately, and not offered: each needs systems this port does not have yet (per-wand blast factors and a wand-randomization pass; an ally actor for the clone; a duel tracker; the four blade imbuements). Their data rows exist - names, charge costs, targeting modes and T4 talent lists - so the ported/non-ported split is one set in `armorAbilities.ts`, and the choice panel offers only what can actually run. **This row previously also listed Huntress `SpiritHawk` and Duelist `Feint` as not ported - both are ported now (see their own rows above/below); the `SpiritHawk` half of that claim was already stale before this pass, not just made stale by it.** |
| `Feint.activate()` + `AfterImage`/`FeintConfusion` (tag `v3.3.8`) | `activateFeint`, `spawnAfterImage`, the `attack()` gate on `defender.allyKind === 'afterImage'`, `takeAllyTurn`'s `afterImage` branch | Ported (2026-09-16). The hero dashes to an adjacent free cell (Java's own `too_far`/`bad_location`/rooted refusals, none of which spend charge or a turn) and leaves a decoy at the vacated cell; any attack against the decoy is intercepted before the hit roll (`defender.allyKind === 'afterImage'`, right where `SpiritHawk`'s own dodge gate sits) rather than actually resolving one, since Java's `defenseSkill()` side effect fires on every attempt regardless of hit or miss - the decoy never takes damage either way, so the observable result is identical. The interception applies `FeintConfusion` to the attacker (wasting its whole next turn, `Mob.act()`'s own early return, mirrored onto this port's existing `paralysis`/`frost` turn-skip gate in `takeMonsterTurn`) and, per talent, `FEIGNED_RETREAT`'s `2*points` hero Haste and `EXPOSE_WEAKNESS`'s `2*points` Vulnerable+Weakness on the attacker. The decoy itself self-destructs on its own first scheduled turn (`takeAllyTurn`'s `afterImage` branch), this port's equivalent of Java's `actPriority = HERO_PRIO+1` fading it just before the hero's next action. **One buff-duration wrinkle, not a behavior difference**: Java arms `FeintConfusion` for a bare "1" turn, but this port's `advanceBuffs` decrements before the skip-turn gate reads the value on the attacker's own next turn - a duration of 1 would already be gone by then, so the authored table uses 2 (documented in `buff-rules.mwl`) to make the buff still read truthy exactly once, matching Java's single lost turn (browser-verified: the buffed rat skipped its very next action and hit normally the turn after). **Two real gaps, both stated.** (1) `enemy.clearEnemy()` has no analog - this port's mobs hold no persistent enemy pointer to drop, since target is recomputed from field of view every turn, so a mob that still sees the hero in plain sight keeps hunting the hero instead of being forced onto the decoy; only a mob that cannot currently see the hero (already routed to the nearest visible ally) or one already adjacent to the decoy takes the bait. (2) `COUNTER_ABILITY`'s tracker (`Talent.CounterAbilityTacker`, a bare 3-turn flavour buff) is armed exactly as Java does, and its consumer is live too since 2026-09-17 (this row's "no counterpart" clause was stale): `useWeaponAbility` refunds `rank*0.375` through `gainWeaponCharge` after the spend and detaches the tracker with it (a refund, not the discount the stale catalogue desc states), which is `afterAbilityUsed`'s whole `COUNTER_ABILITY` job. Browser-verified live: casting adjacent to an awake, sleeping-false rat left the decoy at the hero's old cell and moved the hero to the aimed cell; the rat's own turn attacked the decoy (`"Rat marsupial manque vous (image)"` in the log) and came away with `feintConfusion: 2, vulnerable: 4, weakness: 4` while the hero held `haste: 6, counterAbility: 3` (ranks 3/2/1); the rat's very next turn did nothing (hero HP unchanged), and the turn after that it landed a normal hit. |
| `ClassArmor` as an item: `AC_TRANSFER`, the armor-to-class-armor conversion of a worn armor, `updateArmor()`'s class-armor art | - | Not ported. This port's armor stays an ordinary armor with a hero-side ability slot: there is no separate class-armor item, no transfer action (moving the crown's gift to another armor), and no class-armor sprite tier. Stated rather than silently absent. |
| `KingsCrown`'s / `RatKing`'s "no armor" gate (`belongings.armor() == null` -> `naked`/`crown_clothes`) | `hasCrownableArmor`, `src/actors/npcs.ts`'s `armorId` check | **Divergence (deliberate).** Java refuses only when *no* armor is worn, and `HeroClass.initHero` equips a `ClothArmor` at run start, so in Java the crown works on the starting cloth and `naked` is reachable only by unequipping. This port's gear slot always holds an armor, so it maps "the starting cloth" onto Java's "no armor" and refuses that case instead - the same rule the Rat King's exchange has used since before the armor abilities existed, kept so the two routes cannot disagree about which armors are crownable. Practical effect: the crown waits for a real armor, which in a normal run (the crown drops on depth 20) is already the case. |
| The shared non-attack damage tail (`applyBlastDamage`, used by bombs and the armor abilities) | `applyBlastDamage`'s new `cause` parameter and its defender-side guards | **Fixed, 2026-09-16, found while routing the abilities through it.** The per-class `damage()` curves (Pylon/Eye/DemonSpawner/Slime) and the other `damage()` overrides - `DwarfKing`'s phase-3 Viscosity deferral, `RustedFist`'s, `DwarfKing`'s `DKBarrier` pool, DM-300's `dmBarrier`, and `Pylon.isInvulnerable()` for a dormant pylon - are all part of `Char.damage()`, so Java applies them to *any* source that reaches a mob through `damage()`, including `Bomb.explode`'s own `ch.damage(dmg, this)`. The port had every one of them only inside `attack()`, so a bomb blast or an ability hit landed on a charged pylon or a slime without the curve (roughly double Java's damage), could damage a dormant pylon, and blasted straight through the King's and DM-300's shield pools and a phase-3 deferral. All now at the shared seam, where bombs and abilities alike get them. `attack()` keeps its own copies because its tail also carries attack-only work (LifeLink, the SoiledFist grass cut, the execute mechanics, Grim); each site cross-references the other. |
| Rogue `DeathMark.activate()` + `DeathMarkTracker` (`DURATION = 5`, `setInitialHP`, `chargeUse`'s `0.707^DOUBLE_MARK`) and `Char.isAlive()`'s `HP > 0 \|\| deathMarked` | `activateDeathMark`, `tickDeathMark`, `processFearTheReaper`, the `kill()` gate, `simulation/warriorAbilities.ts`'s sibling `armorChargeUse` overrides | Ported (2026-09-16), the first of the Rogue's three. The mark is a five-turn per-creature payload (`deathMarkTurns`/`deathMarkInitialHp`, saved with the floor) rather than a real buff object, because this port's buff map stores durations only - so the mark has no icon and no `announced` line, which is the one stated reduction. Java spends **no time** on the cast (`hero.next()`), which the port reproduces exactly: the clock does not advance, the monsters do not act, and the hero simply acts again. A marked creature's HP is *not* allowed to end it - `kill()` refuses while the mark is up and runs `processFearTheReaper` instead (Java's `Char.damage()` branch), so the target stays in the fight at 0 HP for up to five of its own turns and then dies on the tick that clears the mark; `DEATHLY_DURABILITY` pays the hero `round(initialHP * 0.125 * points)` as a barrier at that moment, and `FEAR_THE_REAPER`'s ladder is real (rank 2+ terrifies the target too, rank 3+ reaches every hostile within path distance 3 via the port's own `distanceMap`, rank 4 terrifies those as well) except that `Buff.prolong(...).object = hero.id()`'s source id has no field on this port's terror buff. `DOUBLE_MARK` is Java's two-sided latch: armed costs `0.707^points` (30/50/65/75% off) and is consumed by the next mark, and with the talent ranked the cast re-arms it. Browser-verified live: the cast cost exactly 25 charge with the clock unmoved and input still live, a 999-damage hit left the target in the roster at 0 HP (Java's clamp, not a negative value) with terror+cripple on it and on a neighbour, the five ticks then killed it and granted exactly 20 barrier for a 40-HP mark at rank 4, the three-mark sequence cost 25 / 12.496 / 25 (and 7.498 with `HEROIC_ENERGY` 4), and ability, charge, tracker and both mark fields survived a save/load round trip. |
| Huntress `SpectralBlades.activate()` (the aimed line with `findChar`'s `2 * PROJECTING_BLADES` wall penetration, `FAN_OF_BLADES`' `30 * points`-degree cone with the `1 + points` target cap and its prune-the-furthest loop, `hero.attack(ch, dmgMulti, 0, accMulti)` at half damage for everything but the primary, `SPIRIT_BLADES`' tracker) | `activateSpectralBlades`, `spiritBladesArmed`, the new `damageMultiplier` on `rollDamage`/`resolveAttack`/`attack` | Ported (2026-09-16), the third ability class with real behaviour. `Char.attack`'s `dmgMulti` is now a real parameter of the damage roll rather than a post-hoc scaling, so a secondary blade's half damage is `round(roll * 0.5) - armor` the way Java computes it, not `round(roll - armor) * 0.5`; its only caller is this ability and a `verifyCombat` check pins the difference. `FAN_OF_BLADES` reuses this port's line-for-line `ConeAOE` translation, and the target cap is Java's own loop (drop whichever candidate is furthest from the primary by true distance). **Two stated reductions.** (1) `SPIRIT_BLADES`' on-proc is modelled the way Sniper's Shared Enchantment already models the same `bow.proc()` call - by applying the equipped weapon's affix to that hit - since this port has no separate bow enchantment object. (2) `PROJECTING_BLADES`' wall penetration is implemented to Java's own order (a creature on a cell is found *before* that cell's solidity is counted, and the search aborts once the allowance goes negative) and was live-verified for that ordering - a blade reached a target standing on a non-passable cell - but the case the talent exists for (a target the hero's FOV still sees while the straight ray clips a solid cell) did not occur anywhere on the verification floor, so that specific geometry is unverified rather than claimed. Browser-verified otherwise: the primary took exactly its weapon's roll, a `FAN_OF_BLADES` fan hit two cone targets for exactly half each, a fourth candidate further from the primary was pruned by the `1 + points` cap, `SPIRIT_BLADES` rank 4's `multi += 0.1` raised the hit from 20 to 22, a target out of FOV refused with `no_target`, and the charge went 100 -> 75.2 (25 spent, 0.2 of regen from the spent turn). |
| Mage `WarpBeacon.activate()` + `WarpBeaconTracker` (placement gates, the `window_tele`/`window_clear`/`window_cancel` window, the same-depth teleport with `TELEFRAG` and the occupant push, the cross-depth `LONGRANGE_WARP` gate and its charge multiplier, `REMOTE_BEACON`'s `4 * points` placement range) | `activateWarpBeacon`, `placeWarpBeacon`, `openWarpBeaconWindow`, `warpToBeacon`, `teleportHeroTo`, the saved `warpBeacon` | Ported (2026-09-16), the Mage's first ability. Its two halves deliberately differ in cost, exactly as Java wrote them: **placing** spends a turn and no charge, **recalling** spends charge and no time - both still require the base charge to be available, because `ClassArmor.execute()` checks that before the ability runs at all. Cross-depth warps are gated on `LONGRANGE_WARP` and cost `1.833 - 0.333 * points` times the base; the same-depth landing reuses the port's existing teleport-and-push shape (`ScrollOfTeleportation.appear`'s own rule, including `TELEFRAG`'s exchange - `IntRange(10, 15) * points` on whatever is standing there for `min(5 * points, HP + shielding - 1)` on the hero, which can never kill) and the cross-depth one reuses the Lloyd's Beacon arrival path. **Two stated reductions.** (1) Java's `Dungeon.interfloorTeleportAllowed()`/`LockedFloor` gate has no model here, so the port stands in the boss floor itself: a warp *out* of a live boss fight is refused, since a boss floor's only exit in this port is the boss's death and Java would refuse it too. (2) Java's `branch` (the mine side-branch) is this port's single `miningBranchActive` flag as 0/1, and a cross-branch warp therefore also goes through `enterLevel()` rather than being impossible. Browser-verified live: placement at the hero's cell with the charge untouched and a turn spent, the three-row window in French, the recall landing exactly on the beacon for 35 charge and no turn, `TELEFRAG` rank 2 dealing 28 to an occupant (in Java's 20-30 band) and exactly 10 to the hero at 20 HP while shoving it to a free neighbour, `REMOTE_BEACON` refusing distance 2 without it and distance 5 with rank 1, the `depths` refusal without `LONGRANGE_WARP`, a depth-2 -> depth-1 warp for exactly `35 * (1.833 - 0.333*3) = 29.19` charge landing on the beacon cell, and a cross-depth warp refused while standing on depth 5. |
| Rogue `SmokeBomb.activate()` (the six-cell path-distance/FOV/occupancy gate, `Blindness.DURATION/2` on every adjacent hostile, `HASTY_RETREAT`, `BODY_REPLACEMENT`'s `NinjaLog`, `SHADOW_STEP`'s discount and free action) plus the `Blindness` buff it needs | `activateSmokeBomb`, `placeNinjaLog`, the new `blindness` buff id, the monster-perception gate, `ninjaLog`'s MWL monster row/sprite/frame entries | Ported (2026-09-16), the Rogue's second. `Blindness` is now a real buff, and its whole effect is one line of Java's `Level.updateFieldOfView`: `sighted = c.buff(Blindness.class) == null && ...`, i.e. a blinded creature's field of view is *empty* - so a blinded mob cannot see or hunt the hero, which is what makes the escape work. The port gates its monster-perception line on it and leaves the damage-driven `seesHero` sites alone, matching `Char.damage()`'s unconditional HUNTING. `NinjaLog` is a real creature row (spawned as an ally, immovable, immune to terror/amok/charm, with `HT = 20 * points` and `drRoll()`'s `NormalIntRange(points, 3*points)` set at spawn) that `takeAllyTurn` returns from immediately - it exists to be attacked, which this port's existing ally targeting already does. `SHADOW_STEP` is the talent that makes the ability worth using while already invisible: `0.84^points` off the charge and **no time spent at all** (`hero.next()`). Stated reductions: `HASTY_RETREAT`'s fractional `0.67f + points` turns are rounded to whole turns by this port's buff map, and Java's HUNTING->WANDERING flip is reached here by clearing the sight flag the hunt is keyed on rather than a separate state field. Browser-verified live: a hero warped three cells for 50 charge with a turn spent, the adjacent rat blinded for 5 turns and dropped out of sight while a non-adjacent one was untouched, `HASTY_RETREAT` rank 4 granting haste **and** invisibility (4 turns after the cast's own tick), `BODY_REPLACEMENT` rank 2 leaving a 40-HP `[2,6]`-armor decoy on the hero's old cell, `SHADOW_STEP` rank 4 costing exactly `50 * 0.84^4 = 24.89` with **no turn spent** and the invisibility preserved, and an impassable target refused with nothing spent. **Two real bugs were found and fixed on the way, neither introduced by this ability**: (1) the blanket `Invisibility.dispel()` in `activateArmorAbility` was stripping the invisibility `HASTY_RETREAT` grants and would have defeated `SHADOW_STEP` entirely - the dispel is now per-ability at Java's own point, and Death Mark and Smoke Bomb are exactly the two abilities whose Java sources do *not* dispel; (2) `spriteAnimations`' three `"fps": 0` clips (Java's `new Animation(0, true)` static frames) crash MWG's `Animation` constructor on spawn - `rotLasher`'s two were a latent crash-on-spawn for the Dwarf King's summon and are now 1fps (visually identical for a one-frame loop), and `ninjaLog`'s is hand-recorded the same way since `tools/extract-sprite-animations.py`'s own source path is stale after this repo split out of the SPD checkout (a separate recorded fix). |
| Huntress `NaturesPower.activate()` + `naturesPowerTracker` (an eight-turn window, `Hero.speed()`'s `2 + 0.25*GROWING_POWER`, `SpiritBow.proc()`'s `NATURES_WRATH` plant and `WILD_MOMENTUM` extension) | `activateNaturesPower`, `naturesPowerSpeedFactor`, `applyNaturesPowerOnHit`, the saved tracker fields | Ported (2026-09-16). The hero's own speed is `Hero.speed()`'s line exactly, expressed as the turn-cost divisor this port's `getActionTurnCostMod` uses for every other speed effect (Haste, Swiftness, Flow), and the window counts down on the actor clock like every other buff. `NATURES_WRATH` sprouts Java's own five harmful plants (`NaturesPower.harmfulPlants`: blindweed, firebloom, icecap, sorrowmoss, stormvine) `Random.Int(12) < points` of the time, placed *under* whatever the hit struck and fired immediately through this port's existing mob-plant path (`triggerMobPlantAt`), so each plant's non-hero half is the same code a monster stepping on one already runs. `WILD_MOMENTUM` extends the window by its own rank on a killing hit, twice per cast (`extensionsLeft = 2`). **Two stated reductions.** (1) `SpiritBow.speedFactor`'s own `speed += (8 + points)/24` while the window is up - a faster *bow*, not a faster hero - is not modelled: this port's thrown attacks share one cost path with every other missile and it has no per-weapon speed factor to hang it on. (2) The hero's speed factor is applied through the action-cost divisor, which is exact for movement and ordinary actions but not the same `float` arithmetic Java does inside `speed()`. Browser-verified live: the cast costing 35 charge and one turn, `GROWING_POWER` rank 4 giving a speed factor of exactly 3 with a wait action advancing the clock by a third of a turn, `NATURES_WRATH` rank 4 triggering a plant on 128 of 400 direct calls (32% against Java's 33.3%) and - through a real thrown attack - landing `daze`/`cripple`/`poison` on the target, `WILD_MOMENTUM` rank 3 extending 5 -> 8 -> 11 turns across two kills and refusing a third (and never on a live target), and the ability, its charge and both tracker fields surviving a save/load round trip. |
| `Ratmogrify` (`baseChargeUse = 50`, `talents()` = `RATSISTANCE`/`RATLOMACY`/`RATFORCEMENTS` + `HEROIC_ENERGY`) | `grantRatmogrify`, `ratmogrifyChargeUse`, `useRatmogrify` | Partially ported. The charge cost is now real (50, scaled by `HEROIC_ENERGY`) and **a real turn-cost bug was fixed in the same pass**: `useRatmogrify` both spent its own turn and returned `true` to the action adapter that spends one, so every Ratmogrify cost two turns. The six-turn transformation itself keeps its documented simplification (no `TransmogRat` actor, so the sprite and kind stay), which is exactly why the three rat talents are Not ported and grant no tier-4 pool here - they act through that actor's damage, ally and spawn behaviour. |

## Quests and NPCs (`actors/mobs/npcs/*.java`; `mwg/rpg`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `Ghost.Quest.spawn()`: `Random.Int(5-depth)==0`, depth 2-4, `type = depth-1` | `maybeSpawnGhost` | Ported - all three types at the real odds |
| `Ghost`'s undamageable/unkillable state (`defenseSkill()` returns `INFINITE_EVASION`, `damage()` does nothing) | `MONSTERS.ghost` (very high HP/evasion instead of a real unkillable flag), `Creature.isNPC` routing bump-into to dialogue instead of `attack` | Simplified |
| `Ghost.interact()`'s three-state dialogue (offer / reminder / turn-in) | `interactWithGhost` | Ported (structure), using `Rpg.QuestLog`'s real `status`/`currentStage`/`advance` rather than the raw `given`/`processed` booleans Java uses |
| `FetidRat`/`GnollTrickster`/`GreatCrab` stats + `die()` calling `Ghost.Quest.process()` | `MONSTERS.*`, `kill`'s `ghostTargetSlain` branch | Ported (via `mwg/rpg`'s real quest-stage machinery, not a bespoke scene-local flag) |
| `Ghost.Quest`'s reward: a randomly generated weapon and armor set (tier 2-5, occasionally enchanted) | `interactWithGhost`'s turn-in + `generator.ts`'s `ghostQuestReward()` + inventory equipment actions | **Now genuinely ported, not just simplified.** Fetched `Ghost.java`'s `Quest.spawn()` to confirm the exact formula - it does NOT reuse the generic depth-scaled `randomWeapon()`/`randomArmor()` this port's turn-in previously called (those are `Generator.randomWeapon(floorSet)`/`randomArmor(floorSet)`, keyed on `Dungeon.depth/5` via `FLOOR_SET_TIER_PROBS`). Real Java's quest reward has its own, depth-independent formula: a fixed `Random.chances({0,0,10,6,3,1})` roll for armor tier (2-5 at 50/30/15/5%) directly instantiating the concrete class (`LeatherArmor`/`MailArmor`/`ScaleArmor`/`PlateArmor` - no `.random()` call on armor at all, so it draws no further RNG of its own); an *independent* identical `chances()` roll for weapon tier, followed by a real `Generator.random(Generator.wepTiers[tier-1])` for the weapon's class pick (whose own level/cursed/enchant outcome is then explicitly discarded - `weapon.level(0); weapon.enchant(null); weapon.cursed=false` - but the RNG draws it consumed still happened and must still be burned, the same "burn the roll, drop the unreproducible content" convention this whole module already follows elsewhere); a single shared `itemLevelRoll` (50/30/15/5% for +0/+1/+2/+3) applied to *both* items; and a single shared 20% chance (`enchantRoll <= 0.2`, gating a real enchant AND a real glyph that are - per Java's own comment - always rolled first regardless "so the outcome doesn't affect the number of RNG rolls," then kept or discarded together). Neither item is ever cursed. `ghostQuestReward()` reproduces this exact sequence and feeds its result through the existing `generatedInventoryItem`/`rollGeneratedAffix` pipeline unchanged. **Found and fixed a second, much larger bug in the same pass, auditing `generatedInventoryItem`'s category dispatch while wiring this up**: `generated.cat === Cat.WEAPON` (and `=== Cat.MISSILE`) never actually matches anything a real generated weapon or missile carries - `randomWeapon()`/`randomMissile()`/`randomCategory(Cat.WEAPON)` all resolve internally to one of the `WEP_T1..T5`/`MIS_T1..T5` sub-tier `Cat` values (confirmed in `generator.ts`'s own `Cat` enum: `WEAPON=0, WEP_T1..WEP_T5=1..5`, all distinct from each other), so this equality check has *never* matched for any procedurally-generated weapon or missile since this function was written - not just Ghost's reward, but every ordinary floor-loot weapon (the `generatorRandom()` site used for regular chest/heap spawns) and every statue-drop weapon too. Every one of them silently fell through to the `'food'` default id, with no enchant ever rolled (the adjoining `affix` check had the identical bug). The sibling function `generatedGroundKind`, a few lines away in the same file, already used the correct range check (`item.cat <= Cat.WEP_T5`) - this was a narrow, isolated miss in one function, not a systemic design gap, and is now fixed to the same range shape. **Browser-verified live**: before the fix, a Ghost-quest turn-in produced `{id:'food', sourceClass:'RunicBlade'}` for the weapon slot; after, the same flow produced real `{id:'weaponReward', sourceClass:'Sickle', level:2}`/`{id:'armorReward', sourceClass:'ScaleArmor', level:2}` items. A 20000-sample Node-side statistical check of `ghostQuestReward()` alone (bundled via esbuild, run standalone, not part of the committed test suite - a throwaway `tools/scratch/` script) gave tier fractions `0.498/0.299/0.154/0.049`, level fractions `0.500/0.300/0.148/0.052`, and an enchant fraction of `0.197`, all matching Java's `50/30/15/5%`/`20%` within sampling noise, with the weapon and armor level/enchant outcomes matching each other on every one of the 20000 samples (confirming the "shared roll" semantics) and zero cursed outcomes across all of them. **Follow-up scope check, same session**: sampled `generatorRandom()` (the ordinary floor-loot/chest site) and `mimicGeneratePrize()` 2000 times each, plus `randomWeapon()`/`randomMissile()` 500 times each directly - confirmed every single draw that landed in a weapon or missile tier resolves through the fixed range check correctly (never the bare `Cat.WEAPON`/`Cat.MISSILE` enum value, always a `WEP_Tn`/`MIS_Tn` sub-tier), so the fix's benefit is universal across every caller of `generatedInventoryItem`, not narrowly scoped to Ghost's own reward. |
| `Wandmaker.Quest` spawn odds (`depth > 6 && Random.Int(10-depth)==0`) and offer/fetch/turn-in shape |
`maybeSpawnWandmaker`, `WANDMAKER_QUEST`, `interactWithWandmaker`, `wandmakerQuestType` | Odds, shape, and two of the
three site quests are real: the run's quest type (corpse dust / embers / rotberry) is decided by levelgen, surfaced
live, and persisted across save/load; MassGrave's dust heap spawns as a real cursed pickup (it used to vanish) and
Rotberry seeds already drop from grass, so types 1 and 3 turn in their real fetch with the real intro/reminder lines
for the existing wand reward. **Type 2 (elemental embers) is now real too, checked against tag `v3.3.8`
(`Wandmaker.java`, `RitualSiteRoom.java`, `CeremonialCandle.java`, `Elemental.java`)**: the four queued candles spawn
as real pickups (previously vanishing on the null `portItemKind` branch, the same bug class as bombs/dust); a Place
action aims them onto the ritual center's 4 cardinal slots through the `TargetingController` (2026-09-17: `CeremonialCandle`'s `defaultAction = AC_THROW`, six-cell convention, only empty slots validate, confirm spends the throw's turn; pinned in `test:items`) - the stated
shape change, same family as the combat stones' auto-target); all four lit fires the real ritual (placements burned, a
`NewbornFireElemental` rises HUNTING at the center or a free neighbour, with the real `3-5` opening cooldown); the
newborn fights with the real kit (HP 60, acc 15, eva 12, `[10,12]` melee with no fiery on-hit, telegraphed 3x3
fireball - charge line, then `Fire` 8/cell, 2 over water, plus `Burning.reignite` - on a re-rolled `3-5` cooldown) and
always drops its `Embers` where it dies; the NPC takes the real `intro_ember`/`reminder_ember` lines and consumes the
embers for the existing wand reward. Shared elemental rules closed in the same pass: `FIERY` burning-immunity (both
kinds, at the fire/eternal-fire ignite sites) and Frost/Chill `harmfulBuffs` harm (`HT/2..HT*3/5` direct instead of
the 4-damage daze stand-in - the ritual room's own dropped Frost potion is the implied counter). Ritual state
(`ritualPos` + 4 slots) is captured from levelgen at the live bridge and persisted per floor, since the module-level
paint state goes stale on revisits and mining-branch floors. Stated gaps: heap/pickup intermediaries for candles (the throw placement above is ported;
bag-direct to the slot instead); **the `TargetedCell` telegraph and the charge's own cost are now ported (2026-09-16)** - a red
3x3 over the cells the fireball will cover (Java's `addToBack(new TargetedCell(cell, 0xFF0000))` per non-solid
square), and Java's `GameMath.gate(attackDelay(), ceil(hero.cooldown()), 3*attackDelay())` through
`pendingMonsterTurnCost`; **and the cooldown now ticks on every hunting turn, adjacent melee turns included**
(`Elemental.act()`'s `if (state == HUNTING) rangedCooldown--`, moved into the per-turn pre-dispatch beside the golem
cooldowns). Browser-verified live (`tools/scratch/newborn-telegraph-livecheck.mjs`, 6/6). What remains is the zap
*pose* (Java's `sprite.zap()`/`zap()` pair - the visible bolt is covered, `elementalRangedTurn`
fires `spawnProjectile`) and the quest-score/music side effects; no quest-music swap or
quest-score accounting; **the `RitualMarker` custom tile is now ported** (`ritualMarkerVisuals.ts` plus a scene layer:
the 3x3 block over the four candles' own cell, taken from `prison_quest.png` - a sheet this port was not loading at
all - answering the catalogue's own `ritualmarker.name`/`desc` for every cell of it. Note the frames are `0,1,2 /
4,5,6 / 8,9,10`, **not** `0..8`: `mapSimpleImage(0, 0, 64)` walks a 4-column atlas, so each row skips its fourth tile
- recomputed from that helper's own arithmetic in `verifyVault.mjs` and browser-verified live
(`tools/scratch/ritual-marker-livecheck.mjs`, 6/6)); regular fire elementals keep their zap-only stand-in (no subtype
split - see the `MOB_LOOT` row's "found, not fixed" note). **The dust quest's wraith-curse variant is ported (2026-09-17)** - `Wraith`/`DustWraith` are real kinds with Java's stats (`HP = 1`, `EXP = 0`, `maxLvl = -2`, `adjustStats(scalingDepth())` accuracy/evasion/damage, `flying`, UNDEAD + INORGANIC, HUNTING arrival with the 2-turn `SPAWN_DELAY`), and `DustGhostSpawner` runs its real power economy (`min(49, wraiths*wraiths)`, FOV/distance-gated spawn, handover dispel, persisted bank) while the dust is carried - see the dedicated `Wraith` row. Stated skips: the quest-score penalties and music (neither system exists here), the CURSED sound and spawn particles (no layers for either).
Type-check/build/simulation/item suites green; browser verification owed per ROADMAP.md section 10. |
| `Shopkeeper` + `Gold` (keeping, `sellPrice`, buyback) | `maybeSpawnShopkeeper`, `interactWithShopkeeper`,
`shopBuy`/`shopSellFood` via real `Actors.buy`/`sell`, `shopPricing.ts` | Partially ported - keepers now spawn on
Java's real 6/11/16/21 depths (rooms still random-stand-ins, not `ShopRoom` geometry), each with its own shelf stock
and persisted `buybackItems` shelf (cap 3, rebuy at flat `value()` with the real reluctance line, newest sale first on
the G key - choosing among 3 needs the picker UI Transmutation is also waiting on); prices are the exact `sellPrice()`
formula with the depth bracket (see the pricing row) and selling pays flat `value()` (meat correctly 5, food 10 - the
old fold-everything-to-food pricing is gone); the sell side stays food-only for the same picker reason. **The buying
half no longer charges on a step (2026-09-16)**: picking up or stepping onto a FOR_SALE heap used to spend the hero's
gold on the spot, where Java shows `WndTradeItem` and charges only when its `buy` button is pressed - a button Java
*disables* while the price exceeds the hero's gold. The pickup workflow now routes a priced heap to `offerPurchase`,
which the scene implements as that window (the same generic picker `interactWithShopkeeper`'s own window uses, one row
carrying SPD's real `windows.wndtradeitem.buy` string and the price); a cancel leaves both the gold and the heap
alone, the purchase itself stays in `groundPickup.ts` so the window only decides whether it happens, and the pickup
resumes from the confirmed path. An unaffordable stand opens nothing and says the `cannot_afford` line, this port's
equivalent of Java's disabled button. Browser-verified live (`tools/scratch/shop-stand-purchase-livecheck.mjs`, 7/7: a
real priced heap bought on a real depth-6 floor costs exactly `getShopPrice`'s own price and is logged, a cancel or a
1-gold hero changes nothing, and the window's body is the item's own catalogue description for both the stand and
every id the depth's stock carries). **Its body is now shown too (2026-09-16):** the picker gained a body block
(rendered above the rows, `WndInfoItem`'s place in Java's window, which `WndTradeItem` extends), and the trade path
fills it from `itemDescription(id, sourceClass)` - the MWL tables' own `descriptionKey`s first
(`consumableDescriptionKeys`/`equipmentDescriptionKeys`/`missileDescriptionKeys`, whose `sourceClass` lookup is what
gives a generated-gear heap `weaponReward`/`armorReward` its gear's real description), then the SPD catalogue's
`items.<class>.desc` at the same class path as the name. Browser-verified live
(`tools/scratch/shop-stand-purchase-livecheck.mjs`, 7/7, plus a screenshot of the window): a priced stand's window
shows the item's real description in the session's own locale, and the ids a depth-6 shop actually stocks all resolve
real text rather than raw keys. **The stats line is now shown too:** `itemStatsLine(id, {tier, level,
sourceClass})` renders Java's damage/DR formulas (melee, armour, and missile tables) in both the stand window
and the shelf's per-row detail. **STR requirements are now shown too (2026-09-17):** `itemStatsLine` renders Java's real `stats_known`/`curr_absorb`/`stats` sentences with `weaponSTRReq`/`armorSTRReq`/`missileSTRReq` (`src/items/strReq.ts`: `(8+tier*2)-(int)(sqrt(8*lvl+1)-1)/2`, missiles one less, decreasing at +1/+3/+6/+10) plus the `too_heavy`/`excess_str` suffixes against the hero's STR, pinned in `test:items` (formula spot values and the key set; the wording is the catalogue's own, verified through the real EN table). The missile sentence uses the catalogue-vintage `stats` key (the known/unknown split postdates `v2.1.4`). Stated: the `stats_unknown`/`avg_absorb` unidentified branch is not shown (shop goods are treated as identified, as before), and the mastery-potion `-2` (no per-item mastery system; the exotic potion itself is unported). Wand charges are deliberately not shown: re-reading `WndTradeItem`/`WndInfoItem` showed the trade window renders `item.info()`, and `Wand.info()` carries no charges (they live in `status()`, the quickslot line, which has no equivalent here) - so the roadmap line's "wand charges" half was a non-gap, and per-heap wand state was never needed for it. The one piece of per-heap state this
port does carry is the missile set/level side channel. The shelf list itself still shows the whole shelf in one window (Java opens one `WndTradeItem` *per
heap*), but picking a row now opens that row's own detail window with the same body above its buy row, browser-verified (`tools/scratch/keeper-shelf-detail-livecheck.mjs`, 4/4, plus screenshot). **Found and closed in the same pass: every generated FOR_SALE heap spawned as free loot**
(`placeItems()` stock on ported shop floors ignored its own note) - stands are now priced with the real `for_sale`
line and cannot be picked up free; stepping onto a priced stand now completes the purchase directly, deducts the exact
total price, clears the sale flag, and transfers the item to the bag. **Shop stock identity is now preserved for the
six non-Generator goods that were previously dropped silently**: Ankh, Stylus, Honeypot, Alchemize, shop bags, and
SandBag each gets its Java item id, message key, sprite frame, and exact base value (Ankh 50, Stylus/Honeypot 30,
Alchemize 2.5 per unit - `20/8`, corrected from a wrong 5 in the 2026-09-11 Alchemize pass - bag 30, SandBag 30).
The Ankh's BLESS action and blessed revive are now live: a full waterskin blesses the ankh (spending the turn,
`items.ankh.bless`), the flag persists through save/load, one unblessed ankh per shop is stocked, and dying with a
blessed ankh revives on the spot at quarter health, cured per `PotionOfHealing.cure()`, shielded 3 turns
(`Invulnerability.DURATION`, icon `BuffIndicator.ANKH = 52`, damage negated in `absorbHeroDamage`), consuming the
ankh - browser-verified live (`tools/scratch/ankh-bless-revive-livecheck.mjs`, 5/5). Stated simplifications: no DRINK
sample, speck burst, Catalog use count, blessed-desc variant, or ghost-ally remark; BLESS shows unconditionally (Java
lists it only beside a full waterskin) with a refusal line instead. The unblessed `WndResurrect` path is live too:
dying with an unblessed ankh opens the keeps window (title/message/confirm strings are Java's own) instead of the
defeat panel: two keeps defaulting to equipped weapon/armor, a selector admitting everything but ankhs and the four
bag ids (velvet pouch plus the three shop bags), exclusion standing in for Java's clear-the-other-slot rule, and confirm regenerating the
depth at full health plus 3 turns of invisibility with only the keeps in the bag - browser-verified live
(`tools/scratch/ankh-unblessed-resurrect-livecheck.mjs`, 5/5, plus window screenshot). Stated simplifications: lost
goods vanish (no bag system could carry Java's recoverable LostBackpack); the locked-floor branch (preserved items)
has no seam, boss seals being flags; `LostInventory`, `Statistics.ankhsUsed`, and `Catalog.countUse` are unmodeled on
both ankh paths; no warn dialog (slots start filled and the selector only replaces, so emptiness is unreachable -
the `warn_*` keys are absent from the catalogue for the same reason); dismissal of any kind reopens the window
(Java's disabled back button); keeps chosen mid-window are transient, so a save loaded mid-window reopens with
defaults; a kept-weapon label shows the raw `startingWeapon` id, a pre-existing `ITEM_KEYS` gap the inventory shares.
The other goods' specialized
windows/semantics remain separate roadmap work; they are all now visible, priced, and collectible
rather than disappearing at the bridge. This is a deliberate UI simplification of Java's `WndTradeItem` (no
browse/details window); unpriced or not-yet-real stock remains unavailable. **Noticed while auditing for wiring gaps
like the enchant/curse one above, now source-checked, confirmed dead, and removed**: `shopPricing.ts` used to export
`getIdentifyCost()`/`getHealingCost()` (flat 30 gold / 50 gold-per-HP, the latter's own comment claiming "Wandmaker's
well healing") that were never called anywhere in the codebase. Checked the real `actors/mobs/npcs/` directory
(`Blacksmith`, `Ghost`, `Imp`, `ImpShopkeeper`, `Shopkeeper`, `Wandmaker`, etc.) in the local shattered-pixel-dungeon
checkout: none of them offers a generic "pay gold to identify an item" or "pay gold to heal" service, and
`Wandmaker.java` itself contains no gold or healing logic at all - the referenced mechanic doesn't exist in real SPD.
Confirmed speculative scaffolding with no Java feature to restore, unlike `rollAffix`'s real missing-wiring gap;
deleted rather than left as unreachable exports. **`Shopkeeper.processHarm()`/`flee()` is now ported too, found
missing entirely (Section 4 audit)**: every NPC in this port is flatly immune to environmental damage (fire/gas never
touch `isNPC` creatures at all) except real Java's Shopkeeper, who warns once if caught in harm's way and flees for
good - closing the shop - on the next hit. Wired into `spreadFire` only (the far more common accidental-harm path in
real play); Java's other harmful-buff triggers (gas, any negative buff generally) and its per-heap shop-stock item
removal on flee (this port's shop is a shared bag, not floor heaps, so there's no equivalent partial-stock-loss to
reproduce) are not modeled - a narrower, honestly-flagged gap, not a full match. New
`port.log.shopkeeperwarn`/`port.log.shopkeeperflee` EN/FR keys. **`ImpShopkeeper` is now ported
too (2026-09-16)**, closing the stand-in section 3's `unseal()` had to carry: a real
`impShopkeeper` kind (`monsters.mwl` node with `actors.mobs.npcs.impshopkeeper.name` and
`demon.png`, `monsterSpriteFrames` 12x14/idle-0 row, `monsterSpriteOverrides` imp row,
`npc` flag, `MonsterId`/`npcKind` memberships, imp animation clips), spawned by
`applyKingDeathUnseal()` on the shop pedestal when the Imp quest is complete. The trade
window and fire-flee are the shopkeeper's own (depth-20 shelf, same shared-bag stock and
buyback), the examine name comes free through `MOB_KEYS`, and the first-sight `greetings`
yell runs on the hero-move path - NPCs never take turns here, so Java's `act()` trigger
(`!seenBefore && heroFOV`) is a visibility check after each hero step plus once at the
unseal spawn, with `seenBefore` persisted on the creature. Stated: the `greetings_ascent`
variant (no AscensionChallenge exists here) and the `thief` yell (stealing is barred
generically by the armband rule, so the keeper is never stolen from). Type-check/suites
only; browser verification owed. |
| Troll Blacksmith quest currency (`DarkGold`) | `placeGroundItems` on Caves depths 12-14 + `interactWithBlacksmith` | Simplified - collectible Caves drops replace mining wall veins, keeping the quest completable |
| Troll Blacksmith pickaxe buy-back (`WndBlacksmith`, `Blacksmith.Quest.pickaxe/freePickaxe`) | `interactWithBlacksmith`, `buyBlacksmithPickaxe`, `blacksmithPickaxeAvailable`/`blacksmithPickaxeFree` save state, `ui/blacksmithWindow.ts` | Ported - quest completion retains the pickaxe, the Java 250-favor price and 2500-favor free threshold are preserved, and the service consumes the retained flag when returning an identified pickaxe; the selector is a compact choice window rather than Java's belongings picker |
| `RatKingRoom.paint()` (gold CHEST perimeter + king placement) and `RatKing.interact()` (wake yell, crown exchange) | `rooms/sewerBoss/ratKingRoom.ts`, `MONSTERS.ratKing` + `ratking.png`, `interactWithRatKing` | Ported, checked against tag `v3.3.8` (`RatKingRoom.java`, `RatKing.java`): the `IntRange(10,25)` gold draws now fill real CHEST heaps (same stream, same `chest,qty:` convention), the king spawns at the real `random(2)` cell as a sleeping NPC with his own art, wakes with the real `not_sleeping` yell, and answers awake bumps with the real `what_is_it`. The crown exchange stays blocked - the King's Crown item exists (the Dwarf King drops it), but the exchange needs worn armor check plus the Ratmogrify armor ability, which does not exist yet. Type-check/build only; browser verification owed per ROADMAP.md section 10. |
| Every other region's NPC and quest (Caves/City/Halls NPCs) | - | Not ported - City/Halls combat roster is present, but their remaining NPC quest content is not |
## Bestiary and dungeon structure

The live roster path uses MWG's `Roguelike.rollRoster` primitive for the Java
add-rare -> swap-regular -> shuffle sequence, so the framework owns the ordering
and exposes a traceable content-roll boundary for future parity fixtures.

| Java block | TS destination | Status |
| --- | --- | --- |
| `Bestiary.getMobRotation`, `case 1`-`case 4` (Sewers) | `mobRosterForDepth` | Ported |
| `Bestiary.getMobRotation`, `case 6`-`case 9`/`default` (Prison) | `mobRosterForDepth` | Ported |
| `Bestiary.getMobRotation`, cases 11-15 (Caves: Bat/Brute/Shaman/Spinner/DM200 mix) | `mobRosterForDepth` | Ported |
| `Bestiary` cases 16+ (City/Halls) and rare/alternative spawns (Albino, Caustic, Bandit, Spectral, Senior, Acidic...) | `mobRosterForDepth`, `main.ts:populate`, `monsters.ts` | City/Halls standard rosters are present. The four 2.5% regional rare additions (Thief depth 4, Bat 9, Ghoul 14, Succubus 19) and Java's eight 1-in-50 per-entry alternative swaps now roll in the correct add-rare -> swap -> shuffle order. Variants have distinct ids, stats, loot identities, localized names, base-art fallback, and live combat hooks where the current buff model supports them; dedicated variant sprites and a few Java-only effects remain visual/system follow-up. |
| `Dungeon.java`'s depth `switch`: `case 1-4: SewerLevel`, `case 5: SewerBossLevel`, `case 6-9: PrisonLevel`, `case 10: PrisonBossLevel`, `case 11-14: CavesLevel`, `case 15: CavesBossLevel` | `regionForDepth`, `BOSSES` | Ported |
| `Dungeon.java`'s depth `switch`, `case 16` onward (`CityLevel` through `LastLevel`) | `regionForDepth`, `BOSSES`, `enterLevel`, `spdLevelGen/` | Ported floor routing for City/Halls regular depths 16-19 and 21-24, fixed boss-floor layouts at depths 20/25, and the depth-26 vault layout. Boss phase scripts and some boss-specific terrain/visual behavior remain simplified |
| `LastLevel` (depth 26): its three `CustomTilemap`s (`CustomFloor` with the candle cluster, `CenterPieceVisuals`, `CenterPieceWalls`), the `EMPTY_DECO` scatter in `build()`, and the `create()`/`restoreFromBundle()` pass that forces the pit cells and the entrance chamber unwalkable | `src/spdLevelGen/vaultVisuals.ts` (pure transcription + `vaultBlockedCells`), `lastLevel()`'s scatter, a scene `TileMap` over `halls_special.png`, a new `SOLID` terrain kind, `canStepOnto` | Ported 2026-09-12, transcribed statement for statement rather than tidied, because `CustomFloor.create()`'s cursor arithmetic is what places the tiles: index `i` walks a 7-wide display strip while `cell` walks the map, the candle block is embedded mid-loop with its three modifiers (`tileVariance >= 50` picks the irregular candle art, `amuletObtained` adds 8 to every tile above 40, and a non-chasm cell above a chasm writes an edge tile 6 into the cell below), and `data[i] == 0` means "unset" throughout. The scatter runs one `Random.Int(5)` per `EMPTY` cell at its exact `build()` position (before the two centre-piece fills, which is why the centre cells stay plain floor). Stated gaps: (1) Java also pre-seeds `discoverable[]`/`visited[]` for the entrance rows in `create()`, so its fog of war never draws the outer columns there and draws the middle ones as remembered - this port's fog derives drawability from terrain adjacency with no per-cell channel, so that pass is not reproduced (presentation-only, one room, and it would need a new fog seam rather than a value); (2) the Amulet itself is dropped by the Yog-death path here rather than by `createItems()` on any fresh entry, which only differs for a debug jump straight to 26. Verified two ways: `tools/verifyVault.mjs` (6 checks, part of `npm run test:simulation`) pins the cluster's cells, both variants, the two stamps and the blocked list against the Java arrays; `tools/scratch/vault-livecheck.mjs` (20 assertions) drives the real floor in the browser, including that a step into the void is refused while the shaft still moves, and screenshots the lit shaft over the black void. |
| `Dungeon.saveGame` run persistence | `saveRun`/`loadRun` via `mwg/core` `SaveSystem` | Simplified - stats/bag/quests/switches and visited-floor runtime state persist as JSON. Terrain mutations, door/secret/trap state, fire, ground items and non-hero creature state survive re-entry and reload; FOV exploration, exact scheduler tie order, and Java's full bundle graph remain outside the port. |
| `RegularLevel`'s actual room/corridor generation algorithm, room types (vaults, special rooms), `Painter` classes | `src/spdLevelGen/{room,builder,regularBuilder,loopBuilder,figureEightBuilder,connectionRoom,regularLevel,regularPainter,sewerPainter,prisonPainter}.ts`, wired into the live game via `src/spdLevelGen/gameBridge.ts` (`portedFloor`/`toGameTerrain`/`isPortedDepth`, called from `main.ts`'s `enterLevel`) | **Wired into `main.ts` and live in real gameplay**, superseding the "not yet wired" status this row used to carry. Sewers depths 1-4, Prison depths 6-9, Caves depths 11-14, City depths 16-19, and Halls depths 21-24 all come from `spdLevelGen/` now; every other depth still falls back to the generic `generateSpdDungeon`. `gameBridge.ts` translates a verified `PaintLevel` into what `main.ts` renders/plays: real terrain, rooms, entrance/exit, doors (incl. locked/crystal), traps (routed to the nearest of `main.ts`'s five trap behaviours, see `TRAP_BEHAVIOUR`), and room-drop ground items, with the ported floor's own water/grass/doors/traps used verbatim rather than re-run through the generic terrain passes that would overwrite them (`adoptPortedFeatures`). Real items and monsters now populate a ported floor too - `src/spdItems/generator.ts` (682 lines) is the item-generator-equivalent this row used to list as missing, and `src/spdItems/shopItems.ts` backs a working `ShopRoom` (a real shopkeeper NPC with real dialogue and prices, confirmed in a live browser session on depth 6). Floors are cached per run (`gameBridge.ts`'s `RunCache`) so revisiting a ported depth returns the same terrain rather than regenerating it - a real behaviour change from the generic generator, and still not full persistence (mobs/items/door state still rebuild on re-entry, see the row below). Verified two ways: `tools/verifyLevelGraph.ts`/`verifyLevelPaint.ts` against the Java RNG trace (unchanged from before), and now also a live browser session driving the actual game to both a Sewers and a Prison ported depth and screenshotting the result. Real remaining gaps, unchanged from before wiring: depths 1-2's paint is not deterministic across repeated generation for a real, source-confirmed reason (guidebook cascade, see `entranceRoom.ts`); the outer retry loop is capped at 200 attempts (Java's is uncapped); most feeling-gated branches beyond `LARGE` still always take their "no feeling" path even when the roll picked one (documented per-branch in `regularPainter.ts`); `SecretMazeRoom`'s cursed/blocked retry can't fully reproduce Java's Generator-internal call count. Every region's boss levels remain out of scope and still use the generic generator |
| Sewers' (`SewerLevel`) depth-1..4 reachable `StandardRoom` set, per `StandardRoom.chances[1..4]`'s nonzero weights - the 14 classes (`EmptyRoom`, `SewerPipeRoom`, `RingRoom`, `CircleBasinRoom`, `PlantsRoom`, `AquariumRoom`, `PlatformRoom`, `BurnedRoom`, `FissureRoom`, `GrassyGraveRoom`, `StripedRoom`, `StudyRoom`, `SuspiciousChestRoom`, `MinefieldRoom`) plus always-present `EntranceRoom`/`ExitRoom` | `src/spdLevelGen/rooms/standard/{emptyRoom,sewerPipeRoom,ringRoom,circleBasinRoom,plantsRoom,aquariumRoom,platformRoom,burnedRoom,fissureRoom,grassyGraveRoom,stripedRoom,studyRoom,suspiciousChestRoom,minefieldRoom,entranceRoom,exitRoom}.ts`, `patchRoom.ts`, dispatched via `registry.ts` | **Sub-pass 2 done: all 14 `paint()` methods ported**, real class selection now wired into `regularLevel.ts`'s `Random.chances()` roll. `SuspiciousChestRoom` preserves its queued-prize/Gold roll, mimic gate, generated bonus reward, live spawn, and death drop; `GrassyGraveRoom` preserves each Java Generator/Gold result class id in its tomb heap; `AquariumRoom` preserves the per-fish `Piranha.random()` roll and now spawns live depth-scaled, water-bound piranhas with meat loot (base `Piranha` stats confirmed exact: `HP=HT=10+depth*5`, `defenseSkill=10+depth*2` - matches this port's `MONSTERS.piranha` formula precisely; **found, not fixed, correctly scoped as bigger**: `Piranha.random()`'s own real `1/50` chance for the exotic `PhantomPiranha` variant - halved incoming damage plus a teleport-away proc unless the hit is adjacent/melee, `PhantomMeat` loot - is not modeled, since this port has no exotic/RatSkull-tier alternate-monster family at all, a step further than the already-ported regional `Bestiary.swapMobAlts()` 1-in-50 swaps); standard-room Generator categories now route to playable ground-item families. Verified via `tools/verifyLevelPaint.ts`: all 16 (seed x depth 1-4) combinations paint without error and are deterministic across repeated runs. Remaining room-local RNG gaps are Generator-internal concrete class identity and `SewerPipeRoom`'s minor door-center rounding draws. |
| `RegularPainter.paint()`'s full pipeline (`paintDoors`: hidden-door rolls + room merging; `paintWater`/`paintGrass`/`paintTraps`) and `SewerPainter.decorate()` | `src/spdLevelGen/regularPainter.ts`, `sewerPainter.ts` | **Sub-pass 3 done.** `layoutAndCreateLevel` (bounds/shift/`setSize` prologue), the shuffle+placeDoors+paint driver, `paintDoors` (hidden-door chance, `Graph.buildDistanceMap` reachability re-check via a BFS over `Room.edges()`), room merging (`mergeRooms`/`canMerge`/`merge` - confirmed by reading every override in the codebase that no `Random.*` call exists anywhere in this path, so unlike everything else here its control flow doesn't need call-order fidelity, only matching tiles), `paintWater`/`paintGrass` (via a real per-floor-seeded `spdPatch.ts`), `paintTraps` (real `nTraps()`/`trapClasses()`/`trapChances()` weights per depth), and `SewerPainter.decorate()`'s three per-cell cosmetic rolls are all ported against the real Java source. Verified via `tools/verifyLevelPaint.ts` (ASCII dump with doors/water/grass/traps for 4 seeds x depths 1-4 - all paint without error). **Real, source-confirmed finding, not a porting bug**: depth-1 (while the intro guidebook page is unread) and depth-2 (while the searching page is unfound) Sewers generation is **not perfectly seed-deterministic in the real game itself**. `EntranceRoom.paint()`'s guidebook drop uses Java's own intentionally-unseeded generator for its position (see `entranceRoom.ts`), and `paintGrass()` skips its `Random.Float()` roll on any cell already holding a heap - so whether the guidebook lands on a grass-candidate cell changes the *seeded* stream's call count for the rest of that floor (grass pattern, traps, decorate all shift). Confirmed directly against this port: depths 3-4 are deterministic run-to-run, depth 1 (fresh-save default: `guideIntroRead: false`) is not. Byte-exact Phase 2 comparison against Java fixtures should target depths 3-4 first, or depth 1/2 with the guide-read flags forced true, to avoid chasing a mismatch that both implementations would independently produce. **Correction after running the actual Phase 2 Java-fixture comparison** (see the dedicated section below): this nondeterminism is real, but it was *not* the dominant source of the large depth-1/2 divergence observed before that comparison - three real ordering/arithmetic bugs upstream (in `spdRng.ts`/`regularLevel.ts`) were. Don't assume every depth-1/2 mismatch is this guidebook effect; verify against depths 3-4 first, which isolate it out. **Documented simplifications**: `paintTraps` doesn't model `avoidsHallways` (no trap-class behavior exists yet, so `validNonHallways` is computed but unused - every placement draws from `validCells`); `canPlaceWater`/`canPlaceGrass` overrides for `BurnedRoom` are approximated as "false everywhere in the room" rather than patch-shaped (its patch array isn't threaded out of `burnedRoom.ts` this pass); the `EntranceRoom`/`ExitRoom` depth-1/2 "hide the entrance door during tutorial" special case is skipped (`SPDSettings.intro()`/`Document` save-state isn't modeled) |
| `SpecialRoom`'s run-level selection queue (`EQUIP_SPECIALS`/`CONSUMABLE_SPECIALS`/`CRYSTAL_KEY_SPECIALS`/`POTION_SPAWN_ROOMS`, `initForRun`/`initForFloor`/`useType`/`createRoom`) and all 21 reachable subclasses (9 equip + 10 consumable + `LaboratoryRoom` + `PitRoom`; `ShopRoom` is instantiated directly by `RegularLevel`, not through this queue, and `MassGraveRoom`/`RotGardenRoom`/`DemonSpawnerRoom` spawn via NPC quest logic elsewhere. Updated by the Prison pass: `MassGraveRoom`/`RotGardenRoom` ARE now ported - `Wandmaker.Quest.spawnRoom()` appends one directly, so they share the `'special'` paint dispatch without ever coming out of this queue. `ShopRoom`/`DemonSpawnerRoom` remain out of scope) | `src/spdLevelGen/rooms/special/{registry,weakFloorRoom,cryptRoom,poolRoom,armoryRoom,sentryRoom,statueRoom,crystalVaultRoom,crystalChoiceRoom,sacrificeRoom,runestoneRoom,gardenRoom,libraryRoom,storageRoom,treasuryRoom,magicWellRoom,toxicGasRoom,magicalFireRoom,trapsRoom,crystalPathRoom,laboratoryRoom,pitRoom}.ts`, dispatched via `rooms/standard/registry.ts` | **Sub-pass 4 done: selection queue + all 21 `paint()` methods ported**, real class selection wired into `regularLevel.ts`'s `initRooms()` (previously a stubbed `Random.chances({6,3,1})` with a discarded result). Unlike `StandardRoom`'s depth-keyed table, reachability here is run-order based, not depth-gated - every one of the 19 EQUIP+CONSUMABLE classes can appear at any depth depending on the run's shuffle, so all 21 are in scope for Sewers regardless of depth. Every room's geometry, local content rolls (category picks, position retries against real terrain/heap/mob-occupancy state, side-of-door/parity coin-flips) are ported RNG-call-for-call. **Documented, deliberate gap**: `SpecialRoom.initForRun()`'s two `Random.shuffle()` calls are implemented (`resetSpecialRoomRunState()`) but NOT auto-invoked - real Java calls `initForRun()` once at `Dungeon.newGame()`, off whatever generator is current at that moment, a point in the run's RNG stream this port's per-depth `generateLevel()`-style entry points don't model yet. Callers must call it explicitly (both verify scripts do, seeding a generator from the run seed around the call for their own reproducibility - this is a script-level convenience, not a claim about what Java's real `Dungeon.newGame()` moment uses). **Correction, 2026-09-15: the previous claim here was wrong in two ways.** `CrystalChoiceRoom.java` has no `canConnect(Point)` override at all in either `v3.3.8` or `4.0.0-beta` - it was never one of the three rooms with this restriction, just an earlier pass's mistaken addition to the list. `SentryRoom`'s and `CrystalPathRoom`'s overrides are both now threaded into the graph stage via `room.ts`'s `canConnectPoint()` - but they are not the same rule: Sentry's *refuses* the exact parity-even center point (matching this row's old description) and correctly calls the real, `Random.Int(2)`-rolling `center()`, while CrystalPathRoom's is the opposite - Java's real `canConnect(Point)` only *allows* a door within the center strip (`Math.abs(p.x - (right-(width()-1)/2f)) < 1f`, or the same on y) and refuses everywhere else, computed from the plain, non-random `(left+right)/2f` midpoint rather than `center()`. A prior pass had folded CrystalPathRoom into Sentry's "refuse center" rule, which was both logically inverted and burned spurious `Random.Int(2)` rolls through `center()`; both are now fixed, matching Java call-for-call (CrystalPathRoom draws no roll for this check, exactly like the real method). **Almost every class has at least one documented Generator/mob-subsystem-internal skip** (this port has no `Generator`/`Piranha`/`Statue`/`Mimic`/item-upgrade-and-curse system): each file's header comment states exactly which rolls are real vs. skipped, following the same "preserve local/leading rolls, skip the opaque Generator-internal remainder with ZERO substitute Random calls" convention established in sub-pass 2. `TrapsRoom`'s `levelTraps[depth/5]` indexed only the Sewers 3-element array while this port stopped at depth 4; Prison (depths 7-9) now exercises index 1 as well. `ToxicGasRoom`'s "furthest gold position" pick uses `PaintLevel.trueDistance()`, which the Prison pass established is a FAITHFUL port, not an approximation: `Level.trueDistance()` (`Level.java:1397`) is plain Euclidean `sqrt(dx^2+dy^2)` over raw cell coordinates, with no pathfinding at all (`PathFinder.buildDistanceMap` is the BFS, and `trueDistance` never calls it). The previous "Euclidean approximation of the real BFS-based" wording here was simply wrong - see the Prison section. Verified via the extended `tools/verifyLevelPaint.ts`/`verifyLevelGraph.ts`: all 16 combinations paint error-free with a real spread of special-room kinds selected (confirmed: garden, laboratory, weakFloor, pit, crypt, treasury, traps, armory, storage, sentry, runestone, statue, crystalPath, magicWell, pool, crystalVault, sacrifice all appeared across the 16-run sample), and the graph-stage determinism check passes once the run-state seeding fix above is applied. **Correction, 2026-09-15 (second, bigger one): `crystalPathRoom.ts`'s `paint()` was not actually a port of `CrystalPathRoom.java` at all**, in either `v3.3.8` or `4.0.0-beta` (identical between them) - the real method has no `center()`/do-while, just a simpler four-branch (`entry.x==left/right`, else `entry.y==top/bottom`) sequence of six fixed `EmptyRoom`s linked by `CRYSTAL_DOOR`s. The invented "re-rolled center + clockwise quadrant walk" design that stood here instead wasn't just wrong, it was a live hang: `room.center()` is only random when a dimension is even, so a room with both dimensions odd returns a fixed point forever, and the do-while spun infinitely whenever the (real, now-fixed) `canConnect(Point)` restriction above put the door on that exact point - reproduced live at seed 123456789, depth 12 (a 7x9 room), which hung `tools/verifyLevelPaint.ts` indefinitely. Rewritten to the real four-branch geometry, burning the real six `new EmptyRoom()` constructions up front (the invented version only burned four) and fixing the entrance door type (`Door.Type.REGULAR` for real Java - the room's `CRYSTAL_DOOR`s are what actually gate it via the 3 seeded `CrystalKey`s - not the wrongly-added iron-key lock that stood here). Documented simplification, same shape as every other special room here: no exotic-item system or per-class drop-weight table exists in this port, so each of the 3 potion/3 scroll slots is a single `randomCategory()` draw with no value-based ordering, rather than Java's duplicate-avoiding retry plus exotic substitution - but the real `Random.Int(2)` branch pick and the real final `Random.Int(2)` room-shuffle are both made and honoured. Re-verified via the same two scripts: the full 147 seed/depth matrix (`verifyLevelPaint.ts`) completes with no errors including the previously-hanging case, and `verifyLevelGraph.ts`'s determinism check still passes |
| `SecretRoom.initForRun()`/`secretsForFloor()`/`createRoom()` (run-level budget/shuffle across all 5 regions, tracked in `regionSecretsThisRun`) and all 12 `ALL_SECRETS` subclasses (`RatKingRoom` excluded - not in `ALL_SECRETS`, placed by quest logic elsewhere, same reasoning as `SpecialRoom`'s exclusions) | `src/spdLevelGen/rooms/secret/{registry,gardenRoom,laboratoryRoom,libraryRoom,larderRoom,wellRoom,runestoneRoom,artilleryRoom,chestChasmRoom,hoardRoom,honeypotRoom,mazeRoom,summoningRoom,maze}.ts`, dispatched via `rooms/standard/registry.ts` | **Sub-pass 5 done: run-state + selection + all 12 `paint()` methods ported**, real `secretsForFloor()`/`createRoom()` wired into `regularLevel.ts`'s `initRooms()` (previously stubbed to always contribute 0 rooms). `secretsForFloor()`'s region indexing (`depth/5`) is ported exactly as Java computes it, including the real quirk that depth 5 (SewerBossLevel) already falls under region index 1 (Prison's slot) - never exercised by this port's depths-1-4 scope, but not "fixed" either, since that's what Java actually does. `createRoom()`'s unusual "min of 4 independent `Random.Int(size)` rolls, then rotate the pick to the end of the queue" selection is ported literally, not approximated. Like `SpecialRoom.initForRun()`, `resetSecretRoomRunState()` is implemented but NOT auto-invoked (same `Dungeon.newGame()`-moment gap - callers must call it explicitly; both verify scripts do). **Per-class fidelity**: `chestChasmRoom`/`artilleryRoom`/`larderRoom`/`hoardRoom` are fully RNG-faithful (no Generator dependency beyond a skipped chest/missile/gold-tier content roll that never changes call *count* it can't reproduce, since `Gold().random()` is the real, already-elsewhere-ported `IntRange(30+depth*10,60+depth*20)` formula - not Generator-internal at all). `gardenRoom`/`wellRoom`/`summoningRoom`/`honeypotRoom` are fully real except a single skipped Generator-internal content pick each (plant seeding; Honeypot is direct and its Bomb-vs-DoubleBomb roll plus concrete class are now preserved; WellWater class choice is actually real - a plain 2-element array, not Generator-dependent). `laboratoryRoom`/`libraryRoom` preserve their real position-retry loops and item-count rolls, but each item's own `Random.chances(HashMap<Class,Float>)` pick can't be reproduced (Java `HashMap` iteration order is JVM-hashcode-dependent) - the one `Random.Float(sum)` call `chances(HashMap)` always burns is still made, for RNG-order fidelity, same "burn the roll, drop the unreproducible content" convention as `SpecialRoom.createRoom()`'s min-of-4 selection. `mazeRoom` ports `Maze.generate()`'s full growing-tree algorithm and `PathFinder.buildDistanceMap`'s 8-directional BFS faithfully (`maze.ts`) - genuinely real, not approximated - but its prize roll is a real, documented RNG-order gap: Java's `do { Generator.randomWeapon/randomArmor } while (cursed || blocked)` retries an unknown number of times (Generator-internal), so this port makes only the leading `Random.Int(2)` weapon-vs-armor roll once, with no retry: depths where Java's loop would have spun more than once will desync here, unlike every other "burn one call" case in this port. Verified via the extended `tools/verifyLevelPaint.ts`/`verifyLevelGraph.ts`: all 16 combinations paint error-free, secret rooms appeared across the sample (garden, well, library, artillery, honeypot, maze, chestChasm confirmed; hoard/laboratory/larder/runestone/summoning not hit in this particular 16-run sample but exercised by the registry's dispatch table either way), and both scripts' determinism checks pass |
| `SewerLevel`/`PrisonLevel`/`CavesLevel`/`CityLevel`/`HallsLevel` hand-placed decorations and unique rooms | `src/spdLevelGen/rooms/**`, regional painters, `gameBridge.ts` | Ported for regular floors, including the regional unique-room painters, all six ConnectionRoom paint variants, Java room-placed NPC/special-mob positions (including Blacksmith and Aquarium Piranha placement, plus live Statue/ArmoredStatue actors), Caves ore-vein sparkle visuals, live crystal-room reward families/mimics with concrete source-class payloads, queued room keys and playable crystal-door unlocking, crystal-chest key consumption before reward pickup, crystal-mimic first-attack theft/death return, persistent fleeing, and unseen-distance-6 destruction, sign/well/empty-well examination, generated awareness/health well effects, persistent Icecap/Rotberry area blobs, sacrificial-fire diffusion and completion rewards, and Warden FrostImbue/AdrenalineSurge variants. Generated special-room drops now preserve their concrete Java class ids through the bridge, including MassGrave, CrystalVault, CrystalChoice/Path Artifact family payloads, SecretMaze, SecretArtillery, SecretLibrary, SecretLaboratory, SuspiciousChest, and Treasury mimic rewards. Boss arenas, exact remaining Generator-selected item classes outside carried statue rewards, and some room-local item/mob outcomes remain incomplete. |
| Persistence of per-floor state (mobs, heaps, traps) across visits | `SewersScene.floorStates`, captured before transitions and serialized in `SaveShape` | Ported for the port's model - mutable terrain, doors/secrets, traps, fire, ground items and non-hero creature state are restored when revisiting or loading. Simplified: one item per cell remains the heap model, fog exploration is recalculated, and exact Java actor-bundle/scheduler ordering is not serialized. |
| Wiring the ported generator into the live game (`spdLevelGen/` -> `main.ts`) | `src/spdLevelGen/gameBridge.ts`, `main.ts`'s `enterLevel`/`adoptPortedFeatures` | **Done for Sewers 1-4, Prison 6-9, Caves 11-14, City 16-19 and Halls 21-24** (updated as each region's own section below was ported); every boss-level depth still uses the generic `generateSpdDungeon`. See the dedicated section below for the terrain mapping and its losses |
## Phase 2: Java-fixture verification (real bugs found and fixed)

A throwaway Java harness (`core/src/main/java/.../levels/LevelGenHarness.java` +
`desktop/src/main/java/.../desktop/LevelGenHarnessLauncher.java` - both scratch/debug-only,
**not part of the real game**, boot a minimal invisible LWJGL3 window purely so the real game's
texture-loading static initializers succeed headlessly) produces real Java reference dumps
(room graph, doors, tile ASCII map, traps) for the same 4 seeds x depths 1-4 the TS verify
scripts use. Comparing TS output against these fixtures found and fixed three real bugs,
corrections to earlier sub-passes' work rather than new scope:

1. **`SpdJavaRandom.nextLong()` sign-handling bug** (`spdRng.ts`) - combined the two `next(32)`
   draws as unsigned bitwise-OR; Java's real `((long)(next(32))<<32) + next(32)` does *signed*
   32-bit arithmetic, which differs by exactly `2^32` whenever the second (low) draw's top bit is
   set. This desynced `spdSeedForDepth()`'s derived per-floor seed for roughly half of all
   (seed, depth) pairs - confirmed by comparing `Dungeon.seedCurDepth()` against `spdSeedForDepth()`
   directly for depths 1-4 of seed 123456789 (off by exactly 2^32 on 3 of 4 depths before the fix,
   exact match on all 4 after). This is the highest-severity bug found: it corrupted the seed
   feeding *everything* downstream for an affected floor, not a narrow content roll.
2. **`buildRoomGraph()` called `pickBuilder()` after computing `standardRooms()`/
   `specialRooms()`'s counts**, backwards from `RegularLevel.build()`'s real order (`builder()`
   first, then `initRooms()`) - both burn `Random.*` calls, so this shifted the entire stream for
   every room-content roll that follows.
3. **`initRooms()` computed room counts before constructing `EntranceRoom`/`ExitRoom`** -
   both extend `StandardRoom` in Java and inherit its `{ setSizeCat(); }` *instance initializer*,
   which auto-rolls a `Random.chances()` sizeCat pick during construction, before any caller-side
   logic runs. Real Java constructs them as the first two lines of `initRooms()`, before
   `standardRooms()`'s count roll; an earlier version of this function took pre-computed counts as
   parameters, which meant the count roll(s) happened before entrance/exit's two implicit rolls.

**Combined effect confirmed via the harness**: for seed 123456789 depth 1 (deterministic, no
guidebook effect), after all three fixes the standard-room and special-room *selections*
matched Java exactly (`CircleBasinRoom`/`RingRoom`x2/`SewerPipeRoom` standards, `WeakFloorRoom`
special, `traps=2` both sides) - previously the port produced entirely different classes
(`EmptyRoom`/`toxicGas`/etc.) and trap counts. Depths 3-4's room *counts* now match exactly
(12=12, 15=15); depths 1-2 are off by exactly one room, a remaining real gap (see below) rather
than a leftover ordering bug.

**Sub-pass 6 (follow-up): `ConnectionRoom` subclass sizing + two more RegularLevel.initRooms()
bugs, found via re-diffing against the harness.** Three more real, source-confirmed fixes:

1. **`ConnectionRoom`'s 6 real subclasses weren't distinguished.** `RingTunnelRoom`/
   `RingBridgeRoom` override `minWidth()`/`minHeight()` to `Math.max(5, super.minWidth())` = 5
   (`RingTunnelRoom.java:34-41`); the other four (`TunnelRoom`/`BridgeRoom`/`PerimeterRoom`/
   `WalkwayRoom`) keep the base `ConnectionRoom` 3. `room.ts` collapsed all 6 into one generic
   3-10 shape, which let ring rooms squeeze into spaces too small for them in Java - changing how
   many placement retries/branch tunnels get consumed downstream. Fixed: `Room` now carries a
   `connectionKind` (`room.ts`'s `ConnectionRoomKind`/`CONNECTION_ROOM_META`), and
   `connectionRoom.ts`'s existing `Random.chances(ConnectionRoom.chances[depth])` roll (already
   real) now actually selects and tags the concrete subclass instead of discarding the result.
   `paint()` for all 6 is still not ported (cosmetic tunnel/bridge/chasm rendering only).
2. **`if (s instanceof PitRoom) specials++;`** (`RegularLevel.java:141`) - picking a `PitRoom`
   grows the special-room loop bound by one extra iteration. Missing from `regularLevel.ts`'s
   `initRooms()`; fixed by reassigning a local `specialsRemaining` counter instead of using the
   original fixed `specials` value as the loop bound.
3. **`if (feeling == Feeling.SECRETS) secrets++;`** (`RegularLevel.java:147`) - one additional
   secret room on a SECRETS-feeling floor. Missing from `secretsForFloor()`'s call site; fixed by
   threading a `feelingSecrets` flag (`feeling === 6`, alongside the existing `feelingLarge`
   check) into `initRooms()`.

**Re-verified against the harness after all three fixes**: of the 8 (seed x depth) combinations
at depths 3-4 (the deterministic ones - depths 1-2 still carry the documented guidebook-cascade
nondeterminism), **7 now match Java exactly** - identical room *count*, identical connector count,
and identical concrete `StandardRoom`/`SpecialRoom`/`SecretRoom` class selections (not just
counts): seed 123456789 depths 3 and 4, seed 1 depths 3 and 4, seed 42 depth 4, seed 999999999999
depths 3 and 4. This includes cases that previously mismatched on *which* class was picked (e.g.
seed 123456789 depth 3's special was `StorageRoom` in both, not `ToxicGasRoom` in TS as before -
the run-level `SpecialRoom`/`SecretRoom` queues are shared state carried across floors in
generation order, so earlier-floor fixes correct later-floor selections too) and the SECRETS-feeling
case that motivated fix 3 (seed 999999999999 depth 3, `SecretLaboratoryRoom` now present on both
sides, room count 14=14).

**Sub-pass 7 (follow-up): diagnosed, not fixed - `float` vs `double` precision drift in the
builder's angle/geometry math.** Seed 42 depth 3 (feeling `LARGE`) still has a one-room mismatch -
TS produces 19 rooms (8 connectors, `attempts=3`) against Java's 18 (7 connectors, `attempts=1`).
Standard/special-room counts and selections match exactly here too (only the connector count and
attempt count differ). Debug instrumentation (temporarily added to `loopBuilder.ts`/
`figureEightBuilder.ts`/`regularLevel.ts`, then removed - not left in the tree) pinpointed the
exact failure: TS's first `FigureEightBuilder.build()` attempt (this seed/depth picks
`FigureEightBuilder`) fails partway through placing the second loop's rooms
(`placeRoom` returns -1 at loop index 4 of 5), where Java's first attempt succeeds outright. Since
each floor's RNG stream is seeded independently and everything through room-graph setup and the
first loop's placement already matches Java exactly for this seed, the divergence has to be a
genuine *arithmetic* difference, not a further missing rule.

Line-by-line comparison of `Builder.java`/`LoopBuilder.java`/`FigureEightBuilder.java`/
`RegularBuilder.java` against their TS ports found no further logic gaps, but did find a
systemic type difference: Java declares `targetAngle()`'s parameter and return, `startAngle`,
`angleBetweenPoints()`/`angleBetweenRooms()`'s return, and the loop-index ratio
`i/(float)loop.size()` all as 32-bit `float` - every one of these narrows (or is computed in)
float32 precision in Java, including an explicit `(float)` cast in `targetAngle()`'s `return
360f * (float)(...)` line. This port's `builder.ts`/`loopBuilder.ts`/`figureEightBuilder.ts` keep
all of these as plain JS `number` (64-bit double) throughout - `Math.tan`/`Math.atan` themselves
already operate in double precision in both languages (Java's `Math.atan(double)` auto-widens a
float argument, so that part matches), but Java's explicit float-typed locals/return values
truncate precision *between* those calls in a way this port currently doesn't reproduce. Over many
chained room placements this can flip a `Math.round()` boundary by one pixel in a way that changes
whether a later `findFreeSpace`/`placeRoom` call collides or not - a plausible, if narrow,
explanation for why 7 of 8 tested combinations still match exactly (the drift didn't happen to
flip a rounding boundary for those) while this one seed/depth does not.

**Sub-pass 7b: the `float`/`double` audit was completed and applied, then A/B-tested against the
real Java harness - it does NOT explain this mismatch (nor the wider attempts-count divergence
below).** Every `float`-typed variable identified above now gets `Math.fround()` at its real Java
narrowing point: `SpdRandom.floatMax`/`floatRange`/`normalFloat`/`chances` (`spdRng.ts`, the root
RNG-arithmetic layer, so every caller benefits); `angleBetweenPoints`'s explicit `(float)` cast and
the `-180f` step; `placeRoom`'s `angle %= 360f` and its `targetCenter`/`Math.round(float)` block
(added `javaRoundFloat()`, since Java's `Math.round(float)` - `floor(a+0.5f)` at float precision -
is a distinct operation from the `Math.round(double)` used elsewhere in the same function);
`LoopBuilder`/`FigureEightBuilder`'s `setLoopShape`, `targetAngle` (including the float
`(1-curveIntensity)*percentAlong` sub-product before the double sum, then the whole-expression
float cast), the `i/(float)loop.size()` ratio, and the loop-center `PointF` accumulation.

**Empirically verified via direct A/B testing that this fix changes nothing for the currently
tested seeds**: reverting `builder.ts`/`loopBuilder.ts`/`figureEightBuilder.ts`/`spdRng.ts` back
to their pre-fix (plain-`double`) form and re-running `verifyLevelPaint.ts` produced byte-identical
`attempts`/`rooms` output to the fixed version, for all 16 (seed x depth) combinations - including
seed 42 depth 3, which still mismatches Java exactly the same way (19 rooms/8 connectors/3 attempts
vs Java's 18/7/1) with or without the fix. The float-precision theory from sub-pass 7 is therefore
**ruled out** as the cause, at least for this seed - not merely "not yet fixed." The `fround` calls
are kept anyway (still a genuine correctness improvement toward Java's real arithmetic, and may
matter for other seeds not in this small sample), but the actual root cause of seed 42 depth 3's
extra connector room remains open.

**A second, more concerning pattern surfaced by the same re-verification**: comparing `attempts`
(the outer `while (rooms == null)` retry count) between TS and Java across all 8 depth-3/4
combinations shows Java always succeeds in 1 attempt, while TS needs more than 1 in 5 of the 8
cases (123456789 d3/d4, 1 d4, 999999999999 d3) despite the *final* room composition still matching
exactly in all 5. This means TS's `builder.build()` is failing and retrying somewhere Java's
doesn't, even in cases where the eventual outcome happens to converge to the same room set - so a
"room composition matches" check (used for the "7 of 8 match" claim two sub-passes ago) is weaker
than it sounds: it does NOT establish that the actual room *positions*/tile layout match, since a
failed-then-retried attempt runs through a different, RNG-shifted code path than Java's first-try
success before landing on the same room list. **Not investigated further this pass** - flagged as
higher priority than the seed-42 connector count for closing this out, since it likely affects
more seeds than the one visibly-mismatching one. Traps/doors were not re-diffed cell-by-cell beyond
room-kind/count in this pass.

**Follow-up pass, correcting the "5 of 8" methodology**: the "attempts" comparison above (and the
verification script it came from) tested depths in isolation - e.g. running only depth 3 for a
seed without first running depths 1-2 for that same seed. This is invalid for any combo where
`SecretRoom.secretsForFloor(depth)` runs, since it mutates a **cumulative, run-level budget**
(`regionSecretsThisRun[region]`, consumed depth-by-depth in strict ascending order - see
`SecretRoom.java:66-88`) - skipping earlier depths starves or inflates the budget available at the
tested depth, changing how many secret rooms (and therefore how much of everything downstream)
get requested, independent of any real porting bug. Re-running with depths 1-4 genuinely visited
in order per seed (matching `tools/verifyLevelGraph.ts`'s existing loop shape, and the Java
harness's own sequential-depth loop) changes the picture substantially:
- **`seed=1 depth=1` is now a confirmed, exact, room-for-room match against the real Java harness**
  (`connection:ringTunnel, connection:tunnel, entrance, exit, special:crystalPath, standard:empty,
  standard:empty, standard:ring` vs Java's `CrystalPathRoom, EmptyRoom, EmptyRoom, EntranceRoom,
  ExitRoom, RingRoom, RingTunnelRoom, TunnelRoom` - same 8 rooms, same kinds, `attempts=1` both
  sides) - this is the strongest evidence yet that the ported pipeline **can** produce true,
  position-consistent parity, not just coincidentally-matching composition after a desynced retry.
- **A real, still-open, narrower bug found**: `seed=123456789 depth=1` (also `attempts=1` on both
  sides, so not a retry-desync artifact) has TS producing one fewer `TunnelRoom`/`connection:tunnel`
  than Java, with every other room (types, standard/special counts, `WalkwayRoom`/`walkway`) exactly
  matching: Java's 13 rooms include 5 `TunnelRoom` + 1 `WalkwayRoom`; TS's 12 rooms include 4
  `connection:tunnel` + 1 `connection:walkway`. Since this is attempt 1 on both sides and everything
  else in the composition lines up, the divergence is narrowly scoped to one connector-count or
  connector-placement roll somewhere in `LoopBuilder`/`FigureEightBuilder`/`RegularBuilder`'s
  `createBranches` (most likely: a `pathTunnelChances`/`branchTunnelChances`
  `Random.chances()` roll, or a `placeRoom` retry-exhaustion, that resolves to a different tunnel
  count than Java for this specific seed/depth). Root cause **not yet found** despite a thorough
  line-by-line re-read of `Builder.java`/`RegularBuilder.java`/`LoopBuilder.java` against their TS
  ports (no further logic gaps spotted this pass beyond what's already documented above) - the
  remaining candidates are either a data-dependent edge case only reachable for specific room
  geometries, or something in `createBranches`'s failure/retry bookkeeping that only manifests after
  several chained placements. Next step: instrument both the TS builder and a modified
  `LevelGenHarness.java`+`Room`/`Builder` (temporarily, rebuilt via `gradlew :desktop:runHarness`)
  with matching per-`Random.chances()`-call tracing for this exact seed/depth, and diff the trace
  call-by-call rather than only the final composition - this pass ran out of budget to do that.
- The originally-reported "5 of 8" attempts-mismatch figures above are **not reliable as stated**
  (the underlying test had a methodology bug, not necessarily the port) and should be disregarded in
  favor of re-testing with sequential depth order before drawing conclusions about which
  seed/depth combos actually diverge.

**Sub-pass 8/9 (follow-up): three more real, source-confirmed bugs, found via call-by-call trace
diffing against the harness (temporary `BuilderTrace`/`trace()` logging added to both sides,
compared line-by-line for `seed=123456789 depth=1`'s single-room `connectingRooms` mismatch, then
removed - not left in the tree).**

1. **`CircleBasinRoom.resize(w,h)` override was missing.** Real Java ("cannot roll even numbers"):
   `super.resize(w,h); if (width()%2==0) right--; if (height()%2==0) bottom--;` - the generic
   `Room.resize()` in `room.ts` had no per-kind hook, so a `circleBasin` room could come out with
   an even width/height (14x14) where Java always forces it odd (13x13). Confirmed via the harness:
   this single off-by-one in the very first `CircleBasinRoom` placed in the loop cascaded into
   every room positioned after it for the rest of that seed/depth's graph. Fixed: `Room.resize()`
   now applies the odd-forcing whenever `kind==='standard' && standardKind==='circleBasin'`.
2. **`SewerPipeRoom.canConnect(Point)` override was missing** (`SewerPipeRoom.java`: `return
   super.canConnect(p) && ((p.x>left+1 && p.x<right-1) || (p.y>top+1 && p.y<bottom-1));` - refuses
   a door spot adjacent to a corner). `room.ts`'s `canConnectPoint()` already had this exact formula
   for `SecretWellRoom` but not `SewerPipeRoom` - generalized the existing branch to cover both
   kinds. Without it, a door position real Java correctly rejects (both rooms in a pair must
   independently reject every intersect point for `Room.canConnect(Room)`'s `foundPoint` search to
   fail) let TS's `connect()` succeed where Java's failed after exhausting all 10 `placeRoom`
   retries - and each of those extra failed Java retries burns real RNG that TS's early success
   skips, desyncing every subsequent roll for the rest of the floor. Confirmed via the harness:
   after this fix, the exact same `curr`/`next`/`angle` inputs at the previously-diverging call now
   produce the same `connect FAILED` outcome on both sides.
3. **`CrystalPathRoom`/`SentryRoom.canConnect(Point)`'s two `center()` calls were hoisted into
   one.** Real Java calls `center()` separately inside each of its two `if` guards (`if
   (width()%2==1 && p.x==center().x)`, `if (height()%2==1 && p.y==center().y)`), and `center()`
   itself unconditionally computes *both* x and y each call, rolling `Random.Int(2)` on whichever
   axis has odd `(right-left)`/`(bottom-top)` (i.e. even width/height) - independent of which
   component the caller reads. The first version here called `center()` once, hoisted above both
   guards, which is wrong on two counts: when both width and height are even, Java's guards are
   both false and `center()` is never invoked at all (0 rolls) where the hoisted version always
   burns 1-2; when exactly one axis is even, Java's still-taken guard's `center()` call burns a
   roll for the *unused* other axis that a smarter caller might not expect. Fixed by inlining two
   separate `this.center()` calls matching Java's exact call sites. Not yet confirmed against the
   harness with a `crystalPath`/`sentry` room actually present in one of the 4 standard test seeds'
   graphs (none happened to appear after the other two fixes), so this one is source-verified but
   not yet harness-verified - flag for whoever re-verifies with more seeds.

**Re-verified against the harness after all three fixes, all 4 seeds x depths 1-4 run in correct
sequential order**: room *counts* now match Java exactly for **all 16 combinations** (previously
several were off by one, e.g. 123456789 d1 was 12 vs Java's 13). `attempts` (the outer `build()`
retry count) still exceeds Java's constant 1 in several combos (123456789 d3/d4, 1 d4, 42 d1/d2/d3,
999999999999 d2/d3) even though final room *counts* now converge - meaning at least one more
RNG-order divergence remains somewhere in the graph-building path that these three fixes didn't
reach. Root cause not yet found for the remaining gap; the same call-by-call trace-diffing method
used to find the three bugs above (temporary logging on both TS and Java sides, targeted at one
specific still-diverging seed/depth, removed after) is the proven approach for whoever continues
this - static line-by-line source reading alone repeatedly failed to find these bugs across
multiple prior passes.

**Sub-pass 10: full RNG call-trace diffing. One combo now reproduces Java EXACTLY; four more
real bugs found and fixed; and the headline "attempts mismatch" turned out to be a measurement
artifact, not a port bug.**

Method (this is the one that works, and it is mechanical rather than inferential): a scratch
`GenTrace` helper on each side, with a single on/off switch, logging EVERY primitive draw as
`<seq> next(<bits>) = <value>`. On the Java side it hooks `java.util.Random.next(int)` via a
`TracingRandom` subclass injected from `Random.pushGenerator(long)` - every higher-level call
(`Int`/`Float`/`chances`, and `Collections.shuffle`'s direct `nextInt`, which bypasses
`Random.Int()`) funnels through `next()`, so nothing is missed. Phase markers
(`build:*`/`paint:*`) annotate the log. Two scratch comparers then (a) find the first diverging
draw and (b) report the first *phase* whose draw count/bit-widths differ, which names the exact
Java method to read. Each fix provably moves the divergence point later.

Two things the trace setup must get right, both learned the hard way here:
- **Filter nested generators.** `Generator.random()` does `Random.pushGenerator(cat.seed)` for
  deck categories, so those `chances` draws are NOT on the level-gen stream. Both sides track a
  `relDepth` push/pop counter and drop draws at depth > 1, or the diff compares unrelated streams.
- **Markers are asymmetric**, so diff DRAW LINES only and use markers purely as annotation.

**The "attempts" mismatch was a false alarm.** Every prior pass compared TS's inner
`while (rooms == null)` retry count against the harness's OUTER `while (!build())` count. Java's
outer loop is ~always 1 because `RegularLevel.build()` retries internally. Instrumenting Java's
*inner* loop shows it matches TS exactly on all 16 combos (1,1,2,2 / 1,1,1,2 / 4,3,3,1 / 1,2,5,1).
Disregard the "attempts exceeds Java's constant 1" wording above - it measured two different loops.

**The graph stage is byte-perfect.** Dumping sorted room rectangles from both sides shows all 16
combos have IDENTICAL room positions and sizes (and identical counts, feelings and level
dimensions). Every remaining difference is in the paint stage.

Four real bugs found and fixed, all confirmed against the harness:
1. **The 6 `ConnectionRoom` subclasses' `paint()` was never ported** (bare wall/floor fallback).
   `TunnelRoom.getDoorCenter()` makes **two `Random.Float()` draws every time a tunnel-family room
   is painted**, and tunnels are the most common room type on a floor - so this desynced the entire
   paint stage on essentially every floor. Now ported in `rooms/connection/paint.ts`
   (`TunnelRoom`/`BridgeRoom`/`PerimeterRoom`/`WalkwayRoom`/`RingTunnelRoom`/`RingBridgeRoom`) plus
   `rooms/connection/mazeConnection.ts` for `MazeConnectionRoom` (whose doors are set HIDDEN, not
   TUNNEL). `RingTunnelRoom.connSpace` is cached, matching Java's per-instance field, so its
   `getDoorCenter()` draws happen once, not twice. Note a faithfully-reproduced quirk: `doorCenter`
   sums raw integer door coords, so `doorCenter.x % 1` is always 0 and the rounding nudge can never
   fire - only the two draws are observable.
2. **`SewerPipeRoom.getDoorCenter()`'s same two `Random.Float()` draws were skipped.** Previously
   documented here as "only reachable at 3+ connections"; it is actually reachable at **>= 2**
   connections (`connected.size() <= 1` is the `center()` case), i.e. very often.
3. **`CrystalPathRoom` skipped four draws**: Java builds its four quadrants as real
   `new EmptyRoom()` instances, and `StandardRoom`'s `{ setSizeCat(); }` instance initializer burns
   one `Random.chances()` float **per construction**. The port built plain rect literals. The
   rolled size is unused - the draws are not.
4. **`new Gold().random()`'s quantity roll was skipped** in `CrystalPathRoom` and `TreasuryRoom`
   (in the latter it is evaluated in BOTH branches, being the `Mimic.spawnAt` argument - though
   AFTER the mimic gate's own `Random.Int(5)`, an ordering this pass initially got backwards and
   later fixed; see "Six more bugs" below). It is
   `Random.IntRange(30 + depth*10, 60 + depth*20)` - fully portable, no Generator deck. Also
   ported `PlantsRoom.randomSeed()` (`generatorSeeds.ts`): `Generator.randomUsingDefaults(SEED)`
   does NOT push a substream, so its `Random.chances(SEED.defaultProbs)` - retried while the roll
   is Firebloom, so a variable number of draws - lands squarely on the level-gen stream.

**Result: `seed=1 depth=1` now has an IDENTICAL RNG draw stream to real Java** (3379 draws,
byte-for-byte), the first time any combo has reached full stream parity. The other 15 combos'
first divergence moved substantially later (e.g. `1 d4` from draw 16842 to 19061). Room counts,
level dimensions, room rectangles, feelings and trap counts now match Java on all 16 combos - the
sole exception being `seed=42 depth=2`, where Java's `Feeling.TRAPS` paints 5x traps (15 vs 3),
which is the already-documented "Feeling not modeled" gap, not a new bug.

**What remains, honestly stated.** No map is yet byte-identical, and cell-diff counts remain
substantial on most floors (though `1:1` is down to 8 cells and `999999999999:1` to 50, from
200-300 before). Two distinct causes:
- **Item-`Generator` dependence (the large one).** The remaining first-divergence points are
  overwhelmingly inside rooms that drop generated items - `SentryRoom`, `StorageRoom`, `PoolRoom`,
  `LaboratoryRoom`, `SacrificeRoom`, `StatueRoom`, `MagicalFireRoom`, `TrapsRoom`, `ToxicGasRoom`,
  `SecretMazeRoom`. Critically, `Generator.randomWeapon`/`randomArmor` roll
  `Random.chances(floorSetTierProbs[floorSet])` **on the level stream** and then call `.random()`
  on the produced item (enchantment/curse rolls) also on the level stream. Closing these requires
  porting a real slice of the item system, not just a table. `randomUsingDefaults` categories (like
  SEED, done above) are the portable subset and can be picked off individually.
  **RESOLVED in sub-pass 12** (`src/spdItems/generator.ts`) - and it turned out not to need a real
  item system at all, only the categories, because an item's level-stream draw pattern is fixed by
  its `Category.superClass`.
- **Tile-level logic differences independent of the RNG.** `1:1` has an identical draw stream yet
  still differs in 8 cells (2 trap positions, 2 decoration cells), so at least one candidate-cell
  list is built in a different order than Java's. Separately, `123456789 d1` diverges in
  `paint:doors` with 11 hidden-door rolls against Java's 12, meaning one door is non-REGULAR in
  this port where Java's is REGULAR - most likely a `mergeRooms` outcome difference (merging
  `continue`s past the roll and is itself RNG-free). Both are worth chasing next: they are small,
  self-contained, and do not need the item system.

The trace scaffolding was fully removed afterwards: all four tracked Java game files
(`Random.java`, `RegularLevel.java`, `RegularPainter.java`, `CrystalPathRoom.java`) were restored
byte-exact via `git checkout` and verified with `git diff --exit-code`, and `GenTrace.java` /
`genTrace.ts` deleted. Only the untracked scratch harness remains. To re-instrument, re-add the
`TracingRandom` hook in `Random.pushGenerator(long)` plus push/pop counters - roughly 20 lines per
side. One useful diagnostic that did NOT survive cleanup, since it lives in a real game file: a
`innerAttempts++` counter in `RegularLevel.build()`'s `do` loop, which is what exposed the
attempts false alarm.

**Sub-pass 11: the first byte-identical map. Five more real bugs, four of them in the paint
pipeline's plumbing rather than in any individual room.**

Scope was the two divergences sub-pass 10 flagged as small and self-contained. Both are now
closed, and the headline result is that **`seed=1 depth=1` is a MAP EXACT MATCH against the real
Java output** - the first time any floor in this port has reproduced Java's tiles byte for byte.

The five bugs, all source-confirmed and each independently A/B-tested against the Java harness
(turning any one of them back off measurably worsens the diff):

1. **`Random.shuffle(rooms)` shuffled a COPY instead of the list itself.** This is the big one.
   `RegularPainter.paint()` does `Random.shuffle(rooms)` on its own `ArrayList`, in place, and then
   hands that SAME shuffled list to `paintDoors`, `paintWater`, `paintGrass`, `paintTraps` and
   `decorate`. This port shuffled `rooms.slice()`, painted in the shuffled order (so the paint loop
   looked right), then passed the ORIGINAL order downstream. Consequences: every candidate-cell
   list is accumulated room by room, so water/grass/trap candidates came out in a different order
   than Java's - and `paintDoors`, which is itself RNG-consuming, iterated rooms in the wrong order
   too. Fixed by shuffling in place exactly like Java.
2. **`mergeRooms()` used an inclusive height/width.** Java's `merge` local is a plain
   `com.watabou.utils.Rect`, whose `height()`/`width()` are `bottom - top`/`right - left` with **no
   +1** - unlike `Room`, which overrides both to `super.x()+1`. The port applied the `Room`-style
   inclusive form, so `merge.height() >= 3` became "expansion >= 2" instead of ">= 3" and this port
   merged room pairs Java rejects. Each spurious merge `continue`s past a door's hidden-door roll,
   which is exactly the "11 hidden-door rolls against Java's 12" symptom sub-pass 10 recorded.
3. **`paintTraps()` never consulted `Room.canPlaceTrap()` at all** - it treated every in-room
   `EMPTY` cell as trappable. The load-bearing override is `EntranceRoom.canPlaceTrap()`, which
   returns **false on depth 1**, putting the whole entrance room off-limits on floor 1. (Also
   honoured now: `PitRoom` and `SecretHoardRoom` always false, `BurnedRoom` false inside its patch.)
4. **`validNonHallways` was not ported at all** - every trap placement used `validCells`. Java
   builds a second list of cells that have a passable neighbour both vertically and horizontally
   (i.e. not in a 1-wide corridor) and routes any trap with `avoidsHallways` through it. On
   **depth 1 this applies to every single trap**, because floor 1's trap table is `WornDartTrap`
   alone and `WornDartTrap.avoidsHallways` is true. Required porting `Terrain.flags`' `PASSABLE`
   bit (`paintLevel.ts`'s `isPassableTerrain`, matching the real `Terrain.java` initializer -
   note `TRAP` is `AVOID`/not passable while `SECRET_TRAP` aliases `flags[EMPTY]` and is). The old
   comment here also named the wrong classes: the real `avoidsHallways` set is `DisintegrationTrap`,
   `FlashingTrap`, `GatewayTrap`, `GrimTrap`, `GrippingTrap`, `PoisonDartTrap`, `RockfallTrap`,
   `WornDartTrap` - `SummoningTrap`/`FlockTrap` are NOT in it.
5. **`paintDoors()`' entrance-room tutorial case was skipped as "unmodelled save state."** It is
   not an edge case: `SPDSettings.intro()` is `getBoolean(KEY_INTRO, true)`, so on a fresh install -
   precisely what the Java reference harness runs as - **every door touching the entrance room is
   HIDDEN on floor 1**. Leaving those cells as passable `DOOR` rather than solid `SECRET_DOOR`
   changed `paintTraps`' passable array, hence `validNonHallways`, hence trap positions, hence
   `SewerPainter.decorate()`'s per-`EMPTY`-cell rolls. Now driven off `entranceRoomContext`'s
   `guideIntroRead`/`guideSearchingFound` flags, which both default false, matching a fresh game.

Also fixed in passing: `PatchRoom.patch` is now stored on the `Room` instance (Java keeps it as a
field, still live when the painter later calls `canPlaceWater`/`canPlaceGrass`/`canPlaceTrap`), so
`BurnedRoom`'s three patch-shaped overrides are properly patch-shaped instead of the previous
"false everywhere in the room" approximation.

**Verified against the harness** (4 seeds x depths 1-4, sequential depth order):
- `seed=1 depth=1`: **MAP EXACT MATCH**.
- Hidden-door roll counts on depth 1, all four seeds: Java `12, 6, 16, 13` = TS `12, 6, 16, 13`
  (the first was 11 before fix 2).
- For `123456789 depth=1`, `validCells` (113 entries) and `validNonHallways` (90) are now
  byte-identical to Java's, including order and Java's intentional duplicate entries (a cell shared
  by two rooms is contributed twice, and `Random.element` picks by index, so the duplicates matter).

**Still open at the time, stated honestly.** `123456789 depth=1` still differed in 24 cells even
though its candidate lists and door-roll count matched Java exactly. Sub-pass 12 established why,
and it was not a port bug: **depth 1 is not reproducible in Java either**, because
`EntranceRoom.paint()`'s guidebook placement uses an unseeded generator and `paintGrass()` skips
its per-cell roll on heap cells. Two runs of the *unmodified* Java harness give different depth-1
output for the same seed. The `paintGrass`/heap interaction named here is real, but it is the
mechanism by which that non-determinism propagates, not a divergence to fix. Depths 2-4 were
indeed dominated by the item-`Generator` gap, which sub-pass 12 closed.

**Sub-pass 12: the item `Generator` slice - ALL Sewers floors now reproduce Java's tiles exactly
(depths 2-4 deterministically; depth 1 whenever Java's own unseeded guidebook roll agrees).**

Scope was the item-`Generator` dependence sub-pass 10 identified as "the large one", plus
whatever the trace diff then exposed. Result: **12 of 12 depth-2/3/4 floors are MAP EXACT
MATCHES against the real Java harness, on every run**, and all four depth-1 floors match too
whenever the two sides' independent unseeded guidebook rolls happen to coincide (observed 16/16,
15/16 and 14/16 across three runs, the variance being entirely depth-1 floors - see "depth 1 is
not reproducible in Java either", below).

### `src/spdItems/generator.ts` - a Generator that generates nothing

The new module is **not** an item system: it creates no usable items and nothing reads its
output. Its only job is to consume exactly the draws real `Generator` consumes *on the level
stream*. What makes it small is one property, verified by reading every `random()` override
(`Item`, `Weapon`, `Armor`, `Ring`, `Wand`, `Artifact`, `Gold` are the only ones that exist):
**the number and kind of level-stream draws an item's `.random()` makes depends only on its
`Category.superClass`, never on the concrete class.** So the category - which the level stream
itself tells us - is enough; the concrete class never has to be right for the stream to be.

The load-bearing distinctions, all confirmed against `Generator.java`:
- `random(Category)`'s **class pick** for a deck category runs inside
  `Random.pushGenerator(cat.seed)`, i.e. on a substream that is invisible to the level stream.
  (We reproduce it anyway - `fullReset()` gives us the real `cat.seed` - so the classes are
  faithful too, but no layout depends on that.)
- the `.random()` on the produced item runs *after* `popGenerator()`, so it IS on the level
  stream. This is where most of the draw volume lives.
- `randomUsingDefaults(Category)` pushes **no** substream: its `chances(defaultProbs)` is on the
  level stream.
- `randomWeapon`/`randomArmor`/`randomMissile`'s tier roll is on the level stream.
- An item's post-selection `.random()` draw count is set by its category's `superClass`, and
  `MissileWeapon` is NOT interchangeable with `Weapon` here: it overrides `random()` to roll a
  stack size only. Filing `MISSILE`/`MIS_T1..T5` under the weapon path cost ~2 extra draws per
  generated missile (fixed - see "Six more bugs" below), so treat each `superKind` as a claim
  about a specific `random()` override, verified against that class, not a family guess.
- `random()` (no-arg)'s category roll is on the level stream **and mutates `categoryProbs`**, so
  that deck is run-level state carried across floors in generation order, like the
  `SpecialRoom`/`SecretRoom` queues.
- `Generator.fullReset()` (run-init generator, after `SecretRoom.initForRun()`) is now called by
  the verify scripts. Its `Random.Int(2)` sets `usingFirstDeck`, which decides every
  `categoryProbs` weight and therefore steers level content on every floor of the run.

One real Java bug is deliberately corrected only in this port: `Generator.java`'s static init has
`WEP_T3.probs = WEP_T1.defaultProbs.clone()`, so tier 3's starting deck copies tier 1 instead of
its own table. In the `4.0.0-beta` source both arrays have six entries, so the observable defect
is the zero weight at tier-3 index 1 (`Mace`); the older source snapshot also made the final
`Whip` entry unreachable because tier 1 had only five weights. The Java source is left unchanged
by project policy. `spdItems/generator.ts` corrects the port locally with tier 3's own six weights;
`chances()` always burns exactly one `Random.Float`, so this changes which weapon index a draw
resolves to but not the level-generation RNG call count/order.

The seventeen authored generator decks are pinned to Java by `tools/verifyItemWorkflows.mjs`
(2026-09-15): all five weapon tiers, all five missile tiers, potion, scroll, runestone, seed,
wand, ring, artifact, food, and armor deck class orders and starting weights, plus the
`floorSetTierProbs` matrix, the `Weapon.Enchantment`/`Armor.Glyph` `{50,40,10}` pool shapes over
4-common/6-uncommon/3-rare pools with 8 curses each, and `Ghost.Quest.spawn`'s `{0,0,10,6,3,1}`
tier weights - checked value-for-value against `Generator.java`/`Ghost.java`/`Weapon.java`/
`Armor.java` at tag `v2.1.4`, the single-deck baseline these MWL tables reproduce. The two
deliberate divergences are asserted as authored, not as Java's values: tier 3's own six weights
(above) and `StoneOfDetectMagic` where v2.1.4 seats the nonexistent `StoneOfDisarming` (see the
runestone row). **Not ported:** the v3.3.8+ generator delta these decks predate - the
`Cudgel`/`Pickaxe`/`Dart` classes (with their zero weights), the potion/scroll dual-deck split
(`defaultProbs`/`defaultProbs2`), and the newer artifact roster (`LloydsBeacon`, `HolyTome`,
`SkeletonKey`). Porting those means new item systems (a Cudgel/Pickaxe weapon entry, Dart
behavior), not just new deck rows, so they stay with the section-1 item-system completion.

Monster, hero, and buff numbers are pinned the same way by `tools/verifyItemWorkflows.mjs`
(2026-09-15): the shared hero row and level-up increments, 49 monster base rows, the 7
depth-scaled formula rules, and all 35 buff durations - every value checked field-by-field
against `Hero.java`, `actors/mobs/*.java`, `Ghost.java`, `Weapon.java`/`Armor.java`, and the
`DURATION` constants at tag `v3.3.8` (variants resolved through their `extends` chain, `Mob`/
`Char` defaults applied where a file sets nothing). That audit fixed nine real errors, all
previously silent: skeletons had no armor at all (`drRoll` is 0-5), the necro-skeleton with
them, the Armored Brute sat at 4-16 instead of its own commented 4-12 total, Fetid Rats kept
only their override half (0-2 of a real 0-3), Albino HP was still the v2.1.4 15 instead of 12,
and the King, Yog, and its fists each paid experience Java never grants (their shared
`maxLvl = -2` is now authored, so the `hero.lvl <= maxLvl` gate pays nothing). Yog's own melee
line is Java's again too (evasion 12, damage 15-25, armor 0-4 - the beam never read this row).
Deliberately not Java's, each pinned as authored with its reason: the necromancer rows carry
the `Normal(2,10)` zap in accuracy/damage (the class defines no melee line), spawners/pylons
model "never attacks" damage (Char's default would be 1), Albino HP aside the row is Rat,
boss HP stays balance-scaled (Yog 400, fists 60 - see the Yog row's correction below), and the
potion/scroll-threat buffs without a Java `DURATION` keep the port's conventions (poison 6,
bleeding 0, the 9999 state markers) or a real application site's value (cripple 4, paralysis
3, roots 3 - the per-site table is this file's `BUFF_DURATION` row).

### The draws that were being skipped

Every one of these was previously documented here as "Generator-subsystem-internal - skipped
with ZERO Random calls", or similar. That claim was wrong in every case listed:

1. **`Generator.random()`/`random(Category)`/`randomUsingDefaults()` at ~20 room call sites** -
   `StorageRoom`, `MagicalFireRoom`, `PoolRoom`, `SentryRoom`, `TrapsRoom`, `CryptRoom`,
   `SacrificeRoom`, `ArmoryRoom`, `PitRoom`, `LaboratoryRoom`, `LibraryRoom`, `RunestoneRoom`,
   `CrystalChoiceRoom`, `CrystalVaultRoom`, `CrystalPathRoom`, `StudyRoom`,
   `SuspiciousChestRoom`, `GrassyGraveRoom`, `SecretArtilleryRoom`, `SecretChestChasmRoom`,
   `SecretRunestoneRoom`, `SecretSummoningRoom`, `SecretMazeRoom`. `Random.oneOf(...)` category
   picks are real draws too.
2. **The `while (prize.cursed)` prize loops** (`PoolRoom`/`SentryRoom`/`TrapsRoom`/
   `SecretMazeRoom`) were previously called unreproducible because the retry count was unknown.
   It is not unknown - it is driven by the `cursed` flag `Weapon.random()`/`Armor.random()` roll,
   which this module now rolls. `uncursedWeaponOrArmorPrize()` implements the shared loop
   (including `SecretMazeRoom`'s quirk of passing `useDefaults = true` for the weapon branch
   only, which moves that class pick onto the level stream).
3. **`CryptRoom`/`SacrificeRoom`'s `randomCurse()`**, which fires only when the prize came out
   uncursed AND without a good enchantment - hence `GenItem.hasGoodEnchant`.
4. **`Level.findPrizeItem()` is not free.** The no-arg overload makes a real
   `Random.element(itemsToSpawn)` draw whenever the queue is non-empty, and returning an item
   makes the calling room skip its entire Generator path. Rooms queue keys/potions via
   `addItemToSpawn` *as they paint*, so a room painted later in the shuffled order genuinely can
   find one. `PaintLevel` now models `itemsToSpawn` (`findPrizeItem` draws; the
   `findPrizeItem(Class)` overload does not - it scans in order). The 24 existing
   `drop(..., 'itemToSpawn')` calls route there.
5. **`Piranha.random()`** - `Random.Int(50)`, once per fish, *before* that fish's placement loop:
   `PoolRoom` (x3) and `AquariumRoom` (1-3).
6. **`Statue.random()`** - `StatueRoom` was documented as having "no local RNG at all", true of
   its `paint()` body but badly misleading: `Statue.random()` rolls the 1-in-10 armored variant
   and then the constructor generates a full **enchanted weapon** (`do { random(WEAPON) } while
   cursed` + `Enchantment.random()`), plus an armor for `ArmoredStatue`.
7. **`new EnergyCrystal().random()`** - `Random.IntRange(4, 6)`, in both `LaboratoryRoom` and
   `SecretLaboratoryRoom` (x2 there).
8. **`new Gold().random()`** at three more sites: `ToxicGasRoom` (x3 - skeleton plus two chests),
   `SuspiciousChestRoom`, `GrassyGraveRoom`.
9. **`new EmptyRoom()` as a scratch rect.** `EmptyRoom` extends `StandardRoom`, whose instance
   initializer `{ setSizeCat(); }` burns one `Random.chances(sizeCatProbs())` float **per
   construction**. Sub-pass 10 caught this in `CrystalPathRoom`; the same pattern was still
   missing in `CrystalChoiceRoom` (x3, before its `center()` calls), `MagicalFireRoom`
   (`behindFire`) and `SentryRoom` (`sentry.room`).
10. **`LaboratoryRoom`'s alchemy guide page.** On a fresh game all 10 `Document.ALCHEMY_GUIDE`
    pages are NOT_FOUND, so `missingPages.size() <= 5` is false, `chapterTarget = 1`, and
    `chapter = 1 + depth/5` is 1 throughout the Sewers - so exactly one page drops, with its own
    position-retry loop. Missing entirely.
11. **`SecretRunestoneRoom`'s second `randomUsingDefaults(STONE)`** (only the first was wired).
12. **`SecretHoneypotRoom`'s `new Bomb().random()`** - `Random.Int(4)`, and Java evaluates it as
    `placeItem`'s argument, so it lands BEFORE that item's position-retry loop. The port now
    preserves both the draw and the selected `Bomb`/`DoubleBomb` class; it remains source-verified
    rather than harness-verified because no honeypot room appeared in the 16 tested floors.

### Two non-Generator bugs the same trace diff exposed

- **`Level.Feeling` was not wired into the painter at all**, though `RegularLevel` already used
  it for room counts. It changes five things: `layoutAndCreateLevel`'s padding (CHASM -> 2),
  `SewerLevel.painter()`'s water fill (WATER -> 0.85) and grass fill (GRASS -> 0.80),
  `paintDoors`' `hiddenDoorChance` (SECRETS pulls it toward 50%) and its connectivity rule
  (SECRETS only requires "not totally isolated" - each side must still reach >= 2
  non-`ConnectionRoom`s - instead of full connectivity), and `paintTraps` (TRAPS places `5*nTraps`
  with only the first `nTraps` hidden). Every floor that still mismatched after the Generator
  work had a non-NONE feeling; wiring this fixed `1:4`, `123456789:2`/`:4` and `42:2`.
- **`SacrificeRoom`'s corridor loop was off by one.** Java is
  `for (; p.y != c.y; p.y += ...) { set(p) }` - it writes at the CURRENT `p`, then advances. This
  port advanced first and then wrote, skipping the cell `drawInside` stopped on and leaving a
  single `CHASM` tile behind. That one cell was the *entire* remaining diff on two otherwise
  byte-perfect floors (`1:2` and `42:3`), each of which had an already-identical RNG stream -
  a good reminder that a matching stream does not imply matching tiles.

### Depth 1 is not reproducible in Java either - do not chase it

`EntranceRoom.paint()`'s guidebook placement uses a deliberately **unseeded**
`Random.pushGenerator()`, and `paintGrass()` skips its per-cell roll on any cell already holding a
heap - so the guidebook's position shifts the *seeded* stream's call count for the rest of that
floor. Measured directly: running the unmodified Java harness twice produces different depth-1
output for the same seed (and its trace length changed 7211 -> 7210 for `42:1`). The TS side is
non-deterministic at depth 1 for the same reason. Consequences for anyone re-verifying:
- **Depths 2-4 are the trustworthy signal** and are deterministic on both sides.
- A depth-1 mismatch is only meaningful if the *room graph* differs; a tile-level diff of a few
  dozen decoration/trap cells is expected noise.
- Mid-pass, `42:1` and `123456789:1` each flipped between EXACT and ~30 differing cells with no
  code change in between. Do not read such a flip as a regression.

### Verification tooling

`tools/scratch/` keeps the comparers (`cmp.mjs` maps, `cmptrace.mjs` first-diverging-draw,
`phases.mjs` per-phase draw counts). The trace *instrumentation* is removed again, per the
established convention: `src/spdTrace.ts` + hooks in `SpdJavaRandom.next()`/`pushGenerator`/
`popGenerator`, phase markers in `regularPainter.ts`, a `TracingRandom extends java.util.Random`
injected from `Random.pushGenerator(long)` with a `TRACE_REL` push/pop filter, and a
`TRACE_SEED`/`TRACE_DEPTH` env-gated dump in `LevelGenHarness`. All tracked Java game files were
restored with `git checkout` and verified with `git diff --exit-code`; the harness still builds
and runs. Note the harness must walk depths 1..N in order for a seed, since `SecretRoom`'s budget
and the `Generator`/`SpecialRoom`/`SecretRoom` decks are cumulative per run.
The regular `createItems()` heap branch now also preserves Java's artifact/upgradable
locked-chest decision, depth-gated Golden Mimic fallback, and queued Golden Key drops;
remaining simplifications are the broader item-instance catalogue and exact heap stacking.

### What remained outside this phase

This phase initially covered only the generator's Sewers output. Later passes superseded that
scope: all five regular regions are now generated and live, and the scene has real playable
ground-item and mob population models. The remaining gap is full Java item-instance generation
and behavior (rather than the current translated families), plus `Blob`/`Alchemy`/
`SacrificialFire` seeding and `Level.create()`'s exact `createMobs()`/`createItems()` bundle
semantics. See the current integration, item, and persistence rows rather than treating this
historical phase boundary as the live coverage status.

## Prison region (depths 6-10) - `PrisonLevel`/`PrisonPainter`

Ported in the Prison pass, reusing the verified `Builder`/`RegularPainter`/`Generator` core
unchanged. **Depth 6 now generates too** - `ShopRoom` is ported (see the ShopRoom section
below), so the earlier `initRooms()` throw for depths 6/11/16 is gone and the harness runs the
sequence 1,2,3,4,6,7,8,9.

| Java block | TS destination | Status |
| --- | --- | --- |
| `PrisonLevel.standardRooms()` (`5+chances{1,1}`) / `specialRooms()` (`1+chances{1,3,1}`) | `regularLevel.ts`'s `prisonStandardRooms`/`prisonSpecialRooms`, dispatched by `regionForDepth()` | Ported |
| `StandardRoom.chances[6..10]` (zeroes indices 1-3, enables 4-6) | `regularLevel.ts`'s `STANDARD_ROOM_CHANCES[6..10]` | Ported |
| `SegmentedRoom` (recursive `createWalls`, one `IntRange` per retry, `Int(2)` tie-break only) | `rooms/standard/segmentedRoom.ts` | Ported - fully RNG-faithful, no `Generator` dependency |
| `PillarsRoom` (2-pillar vs 4-pillar branch, float32 skew arithmetic) | `rooms/standard/pillarsRoom.ts` | Ported - uses `Math.fround`/`javaRoundFloat` at Java's real narrowing points, since `xSpaces`/`ySpaces`/`percentSkew` are `float` and `Math.round(float)` is the float overload; here (unlike the builder's angle math) a one-off moves a pillar a whole tile |
| `CellBlockRoom` (nullable `Boolean topBottomDoors`, per-cell `Int(4)` in the 1x1 case) | `rooms/standard/cellBlockRoom.ts` | Ported |
| `ConnectionRoom.chances[6..10]` (`{0,0,22,3,0,0}` - `PerimeterRoom` 22, `WalkwayRoom` 3, the inverse of Sewers) | `connectionRoom.ts`'s `CHANCES` | Ported |
| `Wandmaker.Quest.spawnRoom()` (`depth>6 && Int(10-depth)==0`, then `Int(3)+1` type) | `wandmaker.ts`'s `wandmakerSpawnRoom` | Ported, including the run-level `spawned`/`type` carry-over and the `||` short-circuit; `Int(1)` at depth 9 makes an un-spawned quest guaranteed there |
| `Wandmaker.Quest.spawnWandmaker()` (placement retry loop, two `randomUsingDefaults(WAND)`, two `upgrade()`) | `wandmaker.ts`'s `spawnWandmaker` | Ported - **and, since 2026-09-16, the two wands it rolls are *kept***: Java stores them on `Quest.wand1`/`wand2` because they are the reward `WndWandmaker` offers, where this port generated them purely to burn the right RNG draws and then discarded the classes. They now ride the run (`wandmakerQuestWands()`, persisted with the save like `type`) and are what the reward window offers. **The reward itself was an invented substitute until the same pass**: `interactWithWandmaker` handed out a *frost* wand outright (a plain magic-missile staff for a Mage), choosing the class for the player, whereas Java shows `WndWandmaker`'s two buttons - the floor's own pair, each generated at +1 - and spends the quest item only in `selectReward`. Now: the window offers both real classes, named from the catalogue (the `wand` rows are distinguished by a synthetic `wand-reward:<Class>` instance id - the same convention the beacon/horn/sandals/rose action rows already use, resolved in `items/displayName.ts`); cancelling keeps the quest item; picking one sets `wandType` to that class, marks the bag wand identified, and logs SPD's real `hero.you_now_have`; and the Wandmaker delivers `windows.wndwandmaker.farewell` and leaves for good, as `selectReward`'s `destroy()` does. The intro also regained Java's class line: `msg1` is `intro_<class>` + `intro_1`, and the class half was missing entirely. Browser-verified live (`tools/scratch/wandmaker-reward-livecheck.mjs`, 6/6, on a real Prison floor that rolled the quest: two distinct wand names in the window, cancel keeping the item, the picked class taking, and both new log lines). **Stated gaps**: `wand1.upgrade()`/`wand2.upgrade()` (both offered wands are +1 in Java) has no home in this port's wand model, whose power comes from `weaponLevel` rather than a level on the wand item; and `intro_cleric` - which real `v3.3.8` has (`Wandmaker.java`'s `case CLERIC:`) but this port's generated catalogue predates - is skipped for a Cleric rather than filled with another class's words (see `WANDMAKER_CLASS_INTROS`). |
| `MassGraveRoom` / `RotGardenRoom` / `RitualSiteRoom` (the three quest rooms) | `rooms/special/massGraveRoom.ts`, `rooms/special/rotGardenRoom.ts`, `rooms/standard/ritualSiteRoom.ts` | Ported. `RitualSiteRoom`'s `canPlaceItem`/`canPlaceCharacter` ritual-radius exclusion is tracked (`ritualSiteState.ritualPos`) but consulted only by that room, matching how narrowly Java scopes it; consumes no RNG either way |
| `PrisonLevel.painter()` (`.setWater(WATER?0.90:0.30, 4)`, `.setGrass(GRASS?0.80:0.20, 3)`), `trapClasses()`/`trapChances()` (14 classes, no depth special-case) | `prisonPainter.ts` | Ported |
| `PrisonPainter.decorate()` (corner-weighted `Random.Float()` EMPTY_DECO pass, then two `WALL_DECO` passes at `Int(6)`/`Int(3)`) | `prisonPainter.ts`'s `decorate` | Ported. Unlike Sewers', this pass is not purely cosmetic - it runs `spawnWandmaker()` first, which consumes a variable number of draws |
| `ShopRoom` (depths 6/11/16) | `spdItems/shopItems.ts`, `rooms/special/shopRoom.ts`, `room.ts`'s `'shop'` sizing, `regularLevel.ts`'s `shopOnLevel()` | **Ported** - see the dedicated section below |
| `PrisonLevel.addPrisonVisuals`/`Torch`/`tileName`/`tileDesc` | `src/ui/wallDecorations.ts`'s `WallDecorationLayer`, `examineTile` (`main.ts`) | Ported (see the Sewers row in "UI and presentation" for the shared implementation, written generically over both regions from the start) - real `Torch` particle/glow decoration at every real `WALL_DECO` cell `prisonPainter.ts` places, and a `L`/"Look" action showing `PrisonLevel`'s real `water_name`/`empty_deco_desc`/`bookshelf_desc` overrides. Music is separately already ported (see "Audio and splash art") |
| `PrisonBossLevel` (depth 10) | `spdLevelGen/bossLevels.ts`, `gameBridge.ts` | Fixed layout routed through the live bridge; Tengu now runs the phase-2 rhythm (bracket floor, per-bracket capped relocation with trap burst, bomb-ability rotation, and Java's real ability cadence - see the Tengu-abilities row), with the FIGHT_START/FIGHT_ARENA split now ported (cell-phase warp + dart fill, arena-phase 5-7 relocation). **Correction, 2026-09-16: the layout was wrong in a way no per-cell assertion could see - the floor was unwalkable.** Java's `Painter.fill(level, rect, ...)` takes an exclusive-`right`/`bottom` `Rect` (`Rect.width()` is `right - left`), but `setMapStart()`'s rects had been transcribed through this module's inclusive `fillRect`, and `startCells[0]`'s wall border - Java's `x 5..9`, deliberately sparing the hallway column at x=10 - came out as `x 5..10`. That one cell was the level's entire north-south spine: with it walled, the hero arrived in the entrance room and could reach **nothing else on the floor** - not the four start cells, not Tengu's door, not Tengu. A flood fill from the arrival cell returned 41 cells (the entrance room) instead of 92, and every cell-level check in `verifyVault.mjs` stayed green over it, as did every Tengu livecheck, because those all drove the fight by teleporting the hero past the missing corridor.The same pass restored the elements the inclusive reading had silently dropped along with it: the four `DOOR`s between the hallway and its flanking cells, the entrance room's own door at `(10,7)`, and the cell's real interior (`x 7..13, y 24..30`). Fixed by transcribing `setMapStart()` in Java's own exclusive-bounds form, through new `fillJavaRect`/`fillJavaRectInset` helpers whose doc comments state the distinction and name this bug as the reason it matters. `verifyVault.mjs` now flood-fills from the entrance and pins that the spine, all four start cells and the door's hallway side are reachable while the cell behind the locked door is not, and that each later transition's own destination is walkable from the cell it starts in. Remaining simplified, pre-existing and
unrelated: the one-turn-collapsed Fire/Shocker actors. Java's `addCagesToCells()` decoration
is **no longer** simplified either - it scatters Java's own five cells now (see the audit-closure
note below). The separate phase-2 arena geometry is **no longer** simplified - `setMapArena()` went live 2026-09-15 and `setMapPause()` followed on 2026-09-16 (see the Tengu row). |
### Three real bugs this pass found in the SHARED core (all pre-existing, all Sewers-affecting)

None of these are Prison-specific. Each was invisible in Sewers for a structural reason.

1. **`Level.setSize()` fills the map with `Terrain.CHASM`, not `WALL`, on a `Feeling.CHASM`
   floor** (`Level.java:290`). `PaintLevel`'s constructor hardcoded `WALL`, leaving every
   unpainted cell of a chasm floor solid. Not cosmetic: `paintTraps`' passable/hallway analysis
   and `decorate()`'s `WALL`-adjacency tests both read those cells. Never surfaced because none
   of the 16 Sewers test floors happened to roll CHASM. Fixed via a `backgroundTerrain`
   constructor argument.
2. **`Level.tunnelTile()` returns `EMPTY_SP` on a chasm floor**, not `EMPTY` (`Level.java:456`).
   The connection-room dispatch in `rooms/standard/registry.ts` hardcoded `EMPTY` behind a
   "Feeling isn't modeled" comment that went stale when sub-pass 12 wired Feeling in. This one
   is load-bearing: water and grass only spread over `EMPTY`, so chasm-floor corridors got
   flooded where Java's stay dry. Sewers cannot expose it - `PerimeterRoom`/`WalkwayRoom`, the
   subclasses that fill whole corridor runs with this tile, have weight 0 in
   `ConnectionRoom.chances[1..5]`. `PaintLevel` now carries `feeling` so room `paint()`s can
   read it, not just the painter stages.
3. **`Wand.upgrade()` rolls `Random.Int(3)`** for its own 1-in-3 uncurse (`Wand.java:305`).
   `spawnWandmaker()` upgrades both offered wands, so two draws were missing. This port's
   comment had asserted "`cursed = false` and `upgrade()` cost no RNG" - wrong, and the sole
   cause of every Prison quest floor diverging inside `decorate()` while everything upstream
   was already byte-perfect. Found by printing `wand1`'s class/level/cursed on both sides: they
   matched exactly, which localised the missing draws to between `wand1` and `wand2`.

A fourth bug was Prison-only: `CellBlockRoom`'s `Rect internal = new EmptyRoom()` is DECLARED
`Rect` but holds a `Room`, and `width()`/`height()` are virtual - so `internal.width()`
dispatches to `Room.width()`'s INCLUSIVE `super.width()+1`, not `Rect`'s. The declared type is
a red herring. This is the exact mirror of sub-pass 11's `mergeRooms` bug, where a genuinely
plain `Rect` local was wrongly given `Room`'s `+1`.

### Verification (as of the Prison pass; superseded by the ShopRoom section below)

> **Superseded.** The numbers in this subsection were measured with the harness sequence
> 1,2,3,4,**7**,8,9, i.e. with depth 6 skipped because `ShopRoom` was unported. Depth 6 is now
> generated, and since run-level state (`SecretRoom`'s budget, the `SpecialRoom` queue,
> `Generator`'s decks) is cumulative in depth order, inserting it changes which rooms and items
> depths 7-9 roll - so those are *different floors* now, not the ones measured here. See the
> ShopRoom section's own verification subsection for the current result (28/28 at depths 2-9).
> Kept for the reasoning it records, not for its counts.

`LevelGenHarness.java` generates `PrisonLevel` for depths 7-9 alongside `SewerLevel` for
1-4, and resets `Wandmaker.Quest` in its run-init block. At the time, depth 5
(`SewerBossLevel`) and depth 6 (`ShopRoom`) were skipped on BOTH sides, which made the sequence
not a real playthrough: the state at depth 7+ was not what a real run would have. That still
verified the PORT - both sides ran the identical sequence - but it was not a claim about real
in-game floors.

**Result: 27-28 of 28 floors are MAP EXACT MATCHES, and the only floors that ever differ are
the two where JAVA DISAGREES WITH ITSELF.** Broken down:
- **Sewers depths 2-4: 12/12 exact on every run.**
- **Prison depths 7-9: 12/12 exact on every run.**
- **Depth 1: 2/4 to 4/4 depending on the run**, because depth 1 is not reproducible in Java
  either (`EntranceRoom.paint()`'s unseeded guidebook generator - see that section above).

That last point is now measured rather than asserted. Running the *unmodified* Java harness four
times and this port five times, then comparing all 20 Java x TS pairings, the ONLY floors that
ever mismatch are `123456789:1` (24 cells) and `42:1` (32 cells) - and Java-vs-Java runs disagree
on exactly those two floors, with exactly those cell counts. Every one of the 24 floors at depths
2-9 matched in all 20 pairings. One pairing came out 28/28 (Java's unseeded roll happening to
coincide on both depth-1 floors). `42:2` was seen to differ in one early pairing and never again,
which fits the documented depth-2 case (a floor's entrance room can still hold an unfound guide
page); depth 2 is therefore *usually* but not *provably always* deterministic.

**The Prison room-graph stage is byte-perfect on all 12 floors**: identical room rectangles,
identical counts, and identical concrete class selections one-for-one - `SegmentedRoom`,
`PillarsRoom`, `CellBlockRoom`, `PerimeterRoom`, `WalkwayRoom`, `MazeConnectionRoom`,
`RitualSiteRoom`, `MassGraveRoom`, `RotGardenRoom` all land where Java puts them.

### Six more bugs, found by full RNG draw-trace diffing

This pass closed the seven remaining Prison floors. Every one of these was found by diffing draw
streams, not by reading source or staring at which tiles changed; each fix provably moved the
first-divergence point later, which is why the method converges where outcome-based inference had
stalled for several passes.

1. **`ToxicGasRoom` was given a `canPlaceGrass()` override it does not have.** Grepping
   `public boolean canPlaceGrass` across all of `levels/rooms/` yields exactly six declarations -
   `Room`, `SecretRunestoneRoom`, `DemonSpawnerRoom`, `MagicalFireRoom`, `PitRoom`, `BurnedRoom` -
   and `ToxicGasRoom` is not among them. The invented override removed 72 candidate points on a
   ToxicGasRoom floor, dropping 5 grass cells and so 5 `Random.Float()` draws.
2. **`Door.Type.TUNNEL` hardcoded `EMPTY` instead of `Level.tunnelTile()`.** The second surviving
   victim of the "Feeling isn't modeled" assumption (the first, `Level.setSize()`'s CHASM
   background, was fixed in the Prison pass). On a chasm floor Java writes `EMPTY_SP` there;
   leaving it `EMPTY` made a TUNNEL door a grass candidate Java never offers. `tunnelTile()` now
   lives on `PaintLevel` so the room-paint path and the door path cannot drift apart again.
3. **`LaboratoryRoom` hardcoded `pagesToDrop = 1`.** Java: `chapter = 1 + depth/5`,
   `chapterTarget = missingPages.size() <= 5 ? 2 : 1`, `pagesToDrop = min(missing, (chapter -
   chapterTarget) + 1)`. `Document.ALCHEMY_GUIDE` has 10 pages, all NOT_FOUND unless the player
   reads them, so it is 1 page in the Sewers but **2 from depth 5 on**. Each page runs its own
   position-retry loop, so this was a 2-draw gap on every Prison Laboratory floor - correct in
   the Sewers, which is exactly why it survived the whole Sewers verification.
4. **`MIS_T1..MIS_T5`/`MISSILE` were filed under `superKind: 'weapon'`.**
   `MissileWeapon.random()` (MissileWeapon.java:252) fully OVERRIDES `Weapon.random()`: it rolls
   a stack size (`Int(3)`, then `Int(5)`) and never touches level, enchantment or curse. Running
   `Weapon.random()` instead burned ~2 extra draws on every generated missile. A new `'missile'`
   superKind now implements the real override.
5. **`Mimic.spawnAt()`'s `generatePrize()` was not modelled at all.** It always generates a kill
   reward on the level stream (`Random.Int(5)` plus one of gold / missile-with-defaults / armor /
   weapon-with-defaults / `randomUsingDefaults(RING)`). Its `do..while` cannot loop here: all five
   cases assign non-null and `Challenges.isItemBlocked` is false with no challenge mode. Added to
   `TreasuryRoom` and `SuspiciousChestRoom`. **Not** to `CrystalVaultRoom`: `CrystalMimic`
   overrides `generatePrize()` to just uncurse existing items, consuming nothing.
6. **`TreasuryRoom` evaluated its two draws in the wrong order.** Java rolls the mimic gate
   first - `heapType == CHEST && depth > 1 && Random.Int(5) == 0` - and only then
   `new Gold().random()`, as the argument expression in both branches. The port had gold first,
   so each draw fed the other's decision.

### A verification-tooling bug worth knowing about

`tools/scratch/cmp.mjs` was itself wrong for `Feeling.CHASM` floors, in two ways, and its numbers
in earlier revisions of this file cannot be trusted. CHASM renders as a SPACE, so (a) dropping
blank rows and right-trimming mangled every chasm floor - `42:9` was read as 20x52 when it is
really 35x56, making its "49 cells differ" meaningless - and (b) a later fix filtered summary
lines by "third character is a letter", which also eats map rows starting with legitimate glyphs
`w`/`W`/`L`/`P`/`X`/`s`/`B`/`A`/`C`, inventing 51 phantom differing cells on `42:2`, a floor whose
maps are byte-identical. Summary lines are now filtered by their known prefixes and rows are kept
verbatim and padded. `42:1` had also been reported as differing for the same chasm-parsing reason.

## Caves region (depths 11-14) - `CavesLevel`/`CavesPainter`

Real generation, following the same shape as Sewers/Prison: `regularLevel.ts`'s `regionForDepth()`
now returns `'caves'` for 11-14, `cavesStandardRooms()`/`cavesSpecialRooms()` reproduce
`CavesLevel.standardRooms()`/`specialRooms()` (6-7 standard, average 6.333; 2-3 special, average
2.2), and `STANDARD_ROOM_CHANCES[11]` (aliased to 12-14) is the real `StandardRoom.chances[11]`
row read directly off `StandardRoom.java`'s static initializer, not re-derived. `cavesPainter.ts`
wires `regularPainter.ts`'s shared pipeline with Caves' real trap table (`nTraps` range (2,5), 14
classes/weights from `CavesLevel.trapClasses()`/`trapChances()`) and water/grass fill numbers
(0.85/0.30 water @ smoothness 6, 0.65/0.15 grass @ 3), then its own `decorate()`:
merges every still-unconnected room-neighbour pair into `CHASM` (a second, later call to
`regularPainter.ts`'s now-exported `mergeRooms`, after `paintDoorsForDepth`'s own EMPTY-merge
pass), randomly walls off large standard-room corners, and places `EMPTY_DECO`/`WALL_DECO` by
adjacency - the `WALL_DECO` check needed `DungeonTileSheet.floorTile()`'s exact terrain set
(read off `directVisuals`'s static initializer, not approximated), since it excludes `HIGH_GRASS`
which the generic "is this passable" tests elsewhere in this port do not.

### Three new `StandardRoom` subclasses (`StandardRoom.chances[]` indices 7-9)

Sewers/Prison never exercised these three indices, so they were still `undefined` in
`STANDARD_ROOM_CLASS_ORDER`/`STANDARD_ROOM_META` before this pass - the biggest real unknown the
initial scoping pass surfaced, since two of the three are the *most likely* rolls in Caves'
`chances[11]` row (weights 10/10 out of a 25-point non-misc total).

- **`CaveRoom`** (`rooms/standard/caveRoom.ts`) - extends `PatchRoom` like `BurnedRoom`, reusing
  `setupPatch()`/`xyToPatchCoords()`; carves `WALL` back into an otherwise-`EMPTY` room via a
  fill-percentage patch, then a newly-ported `cleanDiagonalEdges()` (`PatchRoom.java`, pure
  geometry, no RNG) removes corner-only patch touches.
- **`CirclePitRoom`** (`rooms/standard/circlePitRoom.ts`) - an elliptical room (`fillEllipseRoom`)
  with a `CHASM` pit ringed 3 cells in from the wall; both primitives already existed in
  `paintLevel.ts` from other rooms, so this port was direct.
- **`CavesFissureRoom`** (`rooms/standard/cavesFissureRoom.ts`) - by far the largest of the three
  (313 lines of Java): rolls 2-4 chasm "fissure" lines radiating from the room centre at angles
  clear of doors and each other, draws each as a `CHASM` line via incremental angle-stepping,
  drops a `CHASM` block at the centre on 3+ lines, then punches an `EMPTY_SP` bridge back across
  each fissure so the room is never split into an unreachable island. Its own retry loop
  (`while (!pathable)`) needed a pathability check - Java's is `PathFinder.buildDistanceMap`
  scoped to `PathFinder.setMapSize(width()-2, height()-2)` (the room's own interior only, never
  the full level); ported as a local 8-directional BFS instead of routing through a level-wide
  pathfinder, since `PathFinder.java`'s own neighbour set (`dirLR`) is 8-directional and the check
  makes no `Random.*` calls of its own (so only its *result* needs to match, not a call order).
  `CavesFissureRoom` also overrides `canMerge()` (the only new override among all three): true
  unconditionally when merging into `CHASM`, otherwise true unless the interior point is itself
  already `CHASM` - `regularPainter.ts`'s `canMergeAt()` now takes `mergeTerrain` as a parameter
  (previously unused by any of the 17 Sewers/Prison classes) to support this one case, and
  `mergeRooms()` is now exported for `cavesPainter.ts`'s own `decorate()`-pass merge call.

### Blacksmith's forge branch

`CavesLevel.initRooms()` is `return Blacksmith.Quest.spawn(super.initRooms())`. The Blacksmith room
now places its NPC and emits a branch-exit cell into the live bridge. The branch itself is generated
as a playable 32x32 CaveRoom, with a centre entrance/return transition, Java's standalone
CavesPainter water/grass pass (`0.35f`/`0.10f`), and pickaxe wall mining that can produce DarkGold.

Verified scope:

- The exact branch reward-seeding behavior is implemented. Bones now follows Java's seeded-gold versus
  normal-run equipment/backpack selection order and only rolls stack quantities after selecting
  a stack; artifact remains now consume the matching Generator uniqueness-deck entry and fall
  back to Gold when that class is unavailable; the CAVES_QUEST custom-tile border atlas is copied
  from the Java assets and rendered with the exact BorderDarken tile index map; the Blacksmith
  QuestEntrance tile (atlas index 0) is rendered at the branch-exit cell.
- The Java `MiningLevel` source defines no additional mining hazards. The cross-run `Bones.get()` persistence contract is live through
  the framework save store: death records branch/depth (with Java's five-floor deepest-floor cap)
  and the Gold or normal-run eligible-loot
  payload, matching floors place it (MiningLevel uses the fixed cell above its entrance), and
  consumption clears the record. Seeded remains resolve to Java's Gold(10), while normal
  upgradable loot preserves its ordinary identification state, becomes cursed-known, and is capped at +3. Hero mining accepts ordinary walls
  and real `WALL_DECO` veins, removes the wall into `EMPTY_DECO`, and awards DarkGold only for veins;
  **corrected 2026-09-16: "accepts ordinary Caves walls" was true of *every* Caves depth here, which
  Java does not allow.** `Hero.java` 1913 gates the pickaxe on `Dungeon.level instanceof MiningLevel`
  - the mining branch level itself, not the region - so Java's hero cannot dig on depths 11-14 at
  all, nor inside the Caves boss arena. This port's gate was a depth range (`11 <= depth <= 15`),
  which let the hero tunnel through ordinary Caves floors *and* through the arena's own walls,
  where the boss floor's new `WALL` base makes them minable in a way they never were before this
  pass. It is now gated on `miningBranchActive`, this port's exact equivalent of that `instanceof`
  (the branch is re-painted at the same depth here), keeping the pickaxe requirement; also now
  stated: Java's test additionally accepts `MINE_CRYSTAL` and `MINE_BOULDER` cells, two terrain
  kinds this port has no equivalent of. Verified live
  (`tools/scratch/caves-mining-gate-livecheck.mjs`, 5/5: closed on a real depth-11 floor with a real
  pickaxe and a real wall step that leaves the wall standing, open inside the branch where the same
  wall comes down, closed again on leaving);
  the explicit Pickaxe MINE action now scans adjacent veins, converts them to `WALL`, awards DarkGold, and spends two turns;
  the Blacksmith normal/Bat-blood quest variant is now selected by the generator, persisted, and completed by
  15 DarkGold or a pickaxe stained on a Bat kill respectively; the Duelist Pierce ability remains an item-system task outside this branch.
  Bones remains now also reset Java's weapon/armor/wand identification-use budgets, clear an
  armor seal, and restore missile durability before placement; broader item-specific reset and
  degradation behavior for unsupported item classes remains open.
- `verifyMiningBranch.ts` checks the fixed 32x32 geometry, entrance clearing, deterministic output,
  global water/grass pass, and mineable ore decoration across four seeds.

### Also not ported: the ore-vein `WALL_DECO` particle effect

`main.ts`'s `WallDecorationLayer` (real `Sink`/`Torch` particle emitters for Sewers/Prison's own
`WALL_DECO`) now includes Caves floors: `CavesLevel.tileDesc()`'s own `WALL_DECO` case
("A vein of some ore is visible on the wall.") is rendered by the dedicated FOV-gated `ore`
sparkle variant in `WallDecorationLayer`, rather than being mis-rendered as a sink or torch.

### Examine-text fix while wiring: `bookshelf_desc`/`empty_deco_desc` were wrong for non-Sewers/Prison regions

`main.ts`'s tile-examine feature (see the Sewers/Prison section above) had a latent bug, unreachable
before this pass because Caves never actually placed `BOOKSHELF`/`EMPTY_DECO` tiles: both
descriptions were a two-way `region === 'prison' ? prisonlevel... : sewerlevel...` ternary, using
Sewers' string as an implicit "everyone else" fallback. The real Java has no such fallback -
`Level.tileDesc()`'s base switch has no `BOOKSHELF`/`EMPTY_DECO` case at all, so any region that
doesn't override one gets no description (`CavesLevel` overrides `BOOKSHELF` with its own
`caveslevel.bookshelf_desc` but NOT `EMPTY_DECO`, despite generating `EMPTY_DECO` tiles). Replaced
with `examineBookshelfDesc()`/`examineEmptyDecoDesc()`, each an explicit per-region switch ending
in `''` rather than a borrowed string, now that Caves makes the wrong branch reachable in practice.

### Verification

`tools/verifyLevelPaint.ts` extended to depths 11-14 (dispatching to `paintCavesLevel`) and run
across 7 seeds (28 Caves floors) with no `PAINT FAILED` lines and no unmapped terrain characters in
the dump - the same smoke-test tier Sewers/Prison's paint stage had before its own Java-fixture
pass (no byte-exact Java fixture exists for Caves yet, same caveat as the rest of this file's
"Not yet compared against a Java fixture" notes). Also verified live in-browser at depths 11 and
13 via `window.__MWG__`: correct "Caves 13" HUD region label, the Caves rock tileset (distinct from
Sewers/Prison), a spawned mob, no console errors, `npx tsc --noEmit` and `npm run build` both clean.

## City region (depths 16-19) - `CityLevel`/`CityPainter`

Ported the same way as Caves above: `cityPainter.ts` wires `regularPainter.ts`'s shared pipeline
with City's real numbers (`standardRooms()` 6-8 average 7, `specialRooms()` 2-3 average 2.33,
water fill 0.30/0.90 (feeling), grass 0.20/0.80, `nTraps` the shared `RegularLevel` default, and
the real 17-class `trapClasses()`/`trapChances()` table, name-only stand-ins as with every other
region - see the Sewers section for why trap *behaviour* isn't ported). `regularLevel.ts`'s
`regionForDepth()` now returns `'city'` for depths 15 < d <= 19 (throwing above 19, same
depth-15-is-a-boss-level exclusion as Caves' depth-15 gap); `shopOnLevel()` already had the
`depth === 16` case from before this pass. `gameBridge.ts`'s `PORTED_DEPTHS` grew depths 16-19 and
its `generateFloor()` dispatch grew a fourth branch.

City's `StandardRoom.chances[16..20]` table introduces 3 new reachable classes (indices 9/10/11 -
`HallwayRoom`/`StatuesRoom`/`SegmentedLibraryRoom`), ported into `rooms/standard/{hallwayRoom,
statuesRoom,segmentedLibraryRoom}.ts` and wired into `room.ts`'s `StandardRoomKind`/
`STANDARD_ROOM_META` (min-dimension floors/`sizeCatProbs`) and `regularPainter.ts`'s `canMergeAt`
(`HallwayRoom.canMerge()` is unconditionally false, the same treatment as `sewerPipe`/`entrance`).
Unlike Prison/Caves, City needed **no new `SpecialRoom` subclasses** - `SpecialRoom` selection is a
run-level queue, not `StandardRoom`'s depth-keyed table (see `rooms/special/registry.ts`'s own
module comment), so all 21 reachable classes were already in scope for every ported region.

`HallwayRoom` routes every door inward to a shared 3x3 hub near the room's centre via two
axis-aligned `Painter.drawLine` segments per door, stamps that hub `EMPTY_SP` with one central
`STATUE_SP`, and raises every door to `REGULAR` - a faithful line-for-line port including the real
`getConnectionSpace()` gating logic. `StatuesRoom` tiles a `rows x cols` grid of statue alcoves
sized from the room's own dimensions (`{9,3,1}` `sizeCatProbs`, min dimension 7). `
SegmentedLibraryRoom` is `SegmentedRoom`'s recursive wall-splitting algorithm (see
`segmentedRoom.ts`'s own doc comment on its `do { ... } while (--tries > 0)` RNG shape) with
`BOOKSHELF` in place of `WALL`, a 4/3 (not 5/3) minimum-area cutoff, one `EMPTY_SP` gap cell per
split (not two), and the recursion area inset by 2 (not 1) from the room's own walls/bookshelf
border - all four differences read directly off `SegmentedLibraryRoom.java` against
`SegmentedRoom.java`, not assumed from the shared shape.

`CityPainter.decorate()`'s two-pass `EMPTY`->`EMPTY_DECO`/`WALL`->`WALL_DECO` roll (the latter
gated on `!wallStitcheable(below)`) is ported as `cityPainter.ts`'s own `decorate()`, with a local
`wallStitcheable()` narrowed to the terrain values this port actually models (see its own comment
for the two real Java members - `UNLOCKED_EXIT` and off-map `NULL_TILE` - that are consequently
unreachable here).

### City's `WALL_DECO` gets a real particle effect: `Smoke`

Unlike Caves' ore-vein `WALL_DECO` (deliberately left undecorated, see above), `CityLevel`'s own
`WALL_DECO` fixture is `Smoke`/`SmokeParticle` - real, source-confirmed values (`pour(factory,
0.2f)`, a black particle shrinking `size(6 - p*3)` over a 2s lifespan with a two-phase alpha
curve). Added as a third `WallDecoKind` (`'smoke'`) to `ui/wallDecorations.ts` alongside Sewers'
`sink`/Prison's `torch`, and wired into `main.ts`'s existing wall-decoration gate (`region ===
'sewers' || 'prison' || 'city'`), same FOV-gated visibility rule as the other two.

### Examine-text: City is the first region with STATUE/STATUE_SP/EMPTY_SP/WALL_DECO tile-examine text

`CityLevel.tileDesc()` overrides four cases the port's `examineTile()` had never needed before:
`BOOKSHELF` (`citylevel.bookshelf_desc`, added to the existing `examineBookshelfDesc()` switch),
`WALL_DECO`+`EMPTY_DECO` sharing one `deco_desc` key (`examineWallDecoDesc()`, a new raw-grid
branch; `examineEmptyDecoDesc()` gained a `city` case), `STATUE`/`STATUE_SP` (`statue_desc`, a new
`examineStatueDesc()`), and `EMPTY_SP` (`sp_desc`, a new `examineSpDesc()`). Read `Level.java`'s
own base `tileDesc()`/`tileName()` directly rather than assuming City is the only region that can
reach these tiles: `STATUE`/`STATUE_SP` already have a base `Level.class` `statue_name`/
`statue_desc` pair (any region's `StatueRoom`/`ring`/`hallway` decoration falls through to that
generic text, not to emptiness), so `examineStatueDesc()` falls back to `levels.level.statue_desc`
for every non-City region rather than `''`. `WALL_DECO`/`EMPTY_SP` have no base case at all, so
their desc functions stay City-only. All four keys pulled into `spdMessages.ts` via the normal
`npm run i18n` scrape once the `t('levels.citylevel....')` call sites existed (186 keys total now,
up from 167).

### Verification

`tools/verifyLevelPaint.ts` extended to depths 16-19 (dispatching to `paintCityLevel`) and run
across 7 seeds (28 City floors) with no `PAINT FAILED` lines; `standard:hallway`/`standard:statues`/
`standard:segmentedLibrary` all confirmed selected and painting without error across the run.
Also verified live in-browser at depth 16 via `window.__MWG__` (`fov.revealAll()` plus a direct
camera pan, since this depth's floor is larger than the viewport): the City tileset renders
distinctly from Sewers/Prison/Caves, a `StatuesRoom`'s alcove-grid floor pattern and a
bookshelf-lined room are both visible, ground items and mobs render, no console errors,
`npx tsc --noEmit` and `npm run build` both clean.

## Halls region (depths 21-24) - `HallsLevel`/`HallsPainter`

Ported the same way as City above: `hallsPainter.ts` wires `regularPainter.ts`'s shared pipeline
with Halls' real numbers (`standardRooms()` 8-9 average 8.33, `specialRooms()` 2-3 average 2.5,
water fill 0.15/0.70 (feeling), grass 0.10/0.65, `nTraps` the shared `RegularLevel` default, and
the real 18-class `trapClasses()`/`trapChances()` table - City's 17 plus `GrimTrap`, the one
region where a trap class has a genuine implemented behaviour rather than a name-only stand-in,
see `gameBridge.ts`'s `TRAP_BEHAVIOUR`). `regularLevel.ts`'s `regionForDepth()` now returns
`'halls'` for depths 20 < d <= 24; `gameBridge.ts`'s `PORTED_DEPTHS` grew depths 21-24 and its
`generateFloor()` dispatch grew a fifth branch.

Halls' `StandardRoom.chances[21..26]` table introduces 3 new reachable classes (indices 12/13/14 -
`RuinsRoom`/`ChasmRoom`/`SkullsRoom`), ported into `rooms/standard/{ruinsRoom,chasmRoom,
skullsRoom}.ts` and wired into `room.ts`'s `StandardRoomKind`/`STANDARD_ROOM_META` and
`regularPainter.ts`'s `canMergeAt`/`mergeFill`. Like City, Halls needed no new `SpecialRoom`
subclasses. `RuinsRoom` and `ChasmRoom` both extend `PatchRoom` (the same base as `CaveRoom`,
ported in the Caves pass) - `RuinsRoom` re-applies `WALL` rubble into an open room (fill 20%->50%
across NORMAL/LARGE/GIANT, `canMerge()` unconditionally true, modeled in `canMergeAt`), `ChasmRoom`
carves `CHASM` instead (fill 30%->60%, ordinary `canMerge()`). `ChasmRoom.merge()`'s own
special-casing - CHASM-merging with another `ChasmRoom` or a `PlatformRoom` at `mergeTerrain ===
EMPTY`, with a plain `EMPTY` (not `EMPTY_SP`) door tile, the one difference from `PlatformRoom`'s
own symmetric case - is modeled in `regularPainter.ts`'s `mergeFill`, which also gained
`PlatformRoom`'s missing `ChasmRoom` half of its own check (present in the real Java all along,
just unreachable before this pass since `ChasmRoom` didn't exist yet in this port). `SkullsRoom` is
four nested `Painter.fillEllipse` calls (`WALL` -> `EMPTY` inset 2 -> `STATUE` inset 4 -> `WALL`
inset 6 - a statue ring around open floor, itself walled in), min dimension 7.

`HallsPainter.decorate()`'s two rolls - an `EMPTY`->`EMPTY_DECO` roll weighted by 8-neighbour
passable-count (`Random.Int(80) < count`, unlike every other region's flat-probability roll) and a
`WALL`->`WALL_DECO` roll gated on neither left nor up neighbour already being `WALL_DECO` - are
ported as `hallsPainter.ts`'s own `decorate()`, followed by the same "merge every still-unconnected
room-neighbour pair into `CHASM`" pass `CavesPainter.decorate()` already has (see `cavesPainter.ts`'s
own comment) - Halls runs it AFTER the two rolls above, the opposite statement order from Caves,
kept faithful to `HallsPainter.java`'s real order even though the two passes touch disjoint terrain
and so produce identical output either way.

### `DemonSpawnerRoom`: live room, mob, and custom floor overlay

`HallsLevel.initRooms()` is `rooms.add(new DemonSpawnerRoom()); return rooms;` - unconditional,
appended after every other room on **every** Halls floor. The room now preserves its Java geometry
and room-local `DemonSpawner` placement through `PaintLevel.mobs`; the live bridge spawns that
actor instead of using the old generic quest-spawn fallback. The exact `HALLS_SP` atlas is bundled
as `assets/halls_special.png`; `main.ts` renders frames 19/27/31 and the 37-39 three-cell
spawner overlay, changes the decorative frame after the Amulet is obtained, and rebuilds from
live/restored actors so a defeated spawner stays absent on revisit. The entrance-connection
refusal and no-trap/water/grass rules remain wired in the graph/painter.

### `HallsLevel.Stream`/`FireParticle`: a real particle effect on every `WATER` cell

Unlike the other four regions' `WALL_DECO`-gated particle effects (`Sink`/`Torch`/`Smoke`, none of
which Halls has - `HallsLevel.tileDesc()` has no `WALL_DECO` case at all), `HallsLevel`'s own
`addHallsVisuals()` adds one `Stream`/`FireParticle` emitter per real `WATER` cell,
unconditionally - not decoration-gated, and using real values (`color(0xEE7722)`, `lifespan 1f`,
`acc.set(0,+80)`, `speed.set(0,-40)`, size 4, alpha `p>0.8?(1-p)*5:1`). Added as `ui/
wallDecorations.ts`'s `WaterEmberLayer`, a sibling to `WallDecorationLayer` reusing the same
particle/FOV-gating mechanics but keyed on every `WATER` cell rather than a decoration-placed
subset, and on each real `Stream`'s own per-instance `Random.Float(2)` re-roll delay (not a fixed
pour rate). `PixelParticle.Shrinking`'s shrink-over-life isn't reproduced - a documented no-op in
the real game too, since Java's own `size` field here is never reassigned after `reset()` despite
the shrinking base class, not a simplification on this port's part.

### Examine-text: Halls overrides `statue_name` (the only region that does), plus its own `bookshelf_desc`/`statue_desc`

`HallsLevel.tileName()` overrides `STATUE`/`STATUE_SP` with its own `statue_name` - the only region
that overrides this case at all (`CityLevel.tileName()` has no STATUE case, confirmed directly);
added as a new `examineStatueName()`, with `examineTile()`'s STATUE/STATUE_SP branch switched from
a hardcoded base key to it. `HallsLevel.tileDesc()` also overrides `bookshelf_desc` (added to the
existing `examineBookshelfDesc()` switch) and `statue_desc` (added to `examineStatueDesc()`,
alongside City's). `water_desc`/`water_name`/`grass_name`/`high_grass_name` already had `halls`
cases from the Sewers/Prison-era wiring pass, since those four keys work off `regionForDepth` alone
regardless of which regions had a ported floor yet.

### Verification

`tools/verifyLevelPaint.ts` extended to depths 21-24 (dispatching to `paintHallsLevel`) and run
across 7 seeds (28 Halls floors, 140 floors total across all five ported regions) with no
`PAINT FAILED` lines; `standard:ruins`/`standard:chasm`/`standard:skulls` all confirmed selected
and painting without error across the run. Also verified live in-browser at depth 21 via
`window.__MWG__`: the Halls tileset (a distinct red/orange "molten" palette) and real lava-red
water render correctly, a `SkullsRoom`'s statue ring, `RuinsRoom` rubble clutter, and a `ChasmRoom`
void are all visible and visually distinct from each other and from every other region, locked
doors and ground items render, no console errors, `npx tsc --noEmit` and `npm run build` both
clean.

## `ShopRoom` (depths 6/11/16) - `spdItems/shopItems.ts`, `rooms/special/shopRoom.ts`

The last thing blocking depth 6. Its `minWidth()`/`minHeight()` call `itemCount()` ->
`generateItems()`, which dereferences `Dungeon.hero.belongings`, so earlier passes had
`initRooms()` throw for depths 6/11/16 rather than generate a shop-less floor and call it parity.
Reading the Java closely, that hero dependency turns out to be nearly inert for level generation:

- **`ChooseBag(pack)` makes ZERO `Random.*` calls** - it is pure `HashMap` logic. Backpack
  contents can only change *which* bag class comes back, never whether one does, and every bag is
  just "one more item" to `placeItems`. So all level generation needs is the **count**.
- That count is determinate without inspecting the live inventory: grepping the whole codebase, the four
  `LimitedDrops` bag flags are dropped in exactly two places - `HeroClass.initHero()` (velvet
  pouch, unconditionally, every class) and `ChooseBag()` itself. A run therefore starts with the
  pouch gone and three holders left, and each shop consumes one, so shops at depths 6/11/16 each
  add a bag and a fourth would add none. That is `bagsRemaining` in `shopItems.ts`.
- Hero creation cannot shift any level stream regardless: `Dungeon.init()` ends its seeded
  run-init block with `Random.resetGenerators()` (Dungeon.java:240) and only then builds the hero
  and calls `initHero()` (267-272).

| Java block | TS destination | Status |
| --- | --- | --- |
| `generateItems()`'s per-depth `switch` (`wepTiers[1]`/`misTiers[1]` + LeatherArmor at depth 6; tiers 3/4/5 and Mail/Scale/Plate at 11/16/20-21, plus 3 Torches at 20-21) | `shopItems.ts`'s `depthKit` | Ported |
| `generateItems()`'s full draw sequence (two `Generator.random(tier)`, `TippedDart.randomTipped(2)`, `IntRange(2,3)`, 2x `randomUsingDefaults(POTION)`, the 2x `Int(2)` potion-or-scroll loop, `Int(4)` bomb pick, `Int(10)` rare pick with its WAND/RING/ARTIFACT branches) | `generateShopItems` | Ported - verified marker-for-marker against the Java harness (identical draw sequence numbers 143-158) |
| `TippedDart.randomTipped`'s `do { randomUsingDefaults(SEED) } while (!types.containsKey(...))` | one `randomUsingDefaults(SEED)` | Ported - the loop provably cannot iterate twice: `types` has all 12 `Plant.Seed` classes (TippedDart.java:198-209), and `SEED.defaultProbs[0] = 0` makes Rotberry unreachable anyway |
| `Random.pushGenerator(Random.Long()); shuffle(itemsToSpawn); popGenerator()` | `generateShopItems`'s tail | Ported - the `Random.Long()` is on the LEVEL stream (one draw); the shuffle runs on the pushed substream and is invisible to layout, and cannot affect `placeItems`' draw count either way since that only tests whether a cell is occupied, never by what |
| `minWidth()`/`minHeight()` = `max(7, (int)(sqrt(itemCount())+3))`, with `itemCount()` lazily caching `generateItems()` | `room.ts`'s `'shop'` case + `shopStock()` | Ported - the laziness is load-bearing: the instance is built in `initRooms()` but `minWidth()` is first reached when the builder places the shop, and `setSizeWithLimit()` tests `minWidth()` *before* `setSize()`'s two `NormalIntRange` draws (Room.java:90-94), so the stock draws land ahead of the size draws, once only (the `build()` retry loop reuses the instance) |
| `new ShopRoom()`'s construction cost | - | Ported (nil) - `ShopRoom` extends `SpecialRoom`, NOT `StandardRoom`, so unlike `EntranceRoom`/`ExitRoom` it does not inherit the `{ setSizeCat(); }` initializer and burns no RNG when built |
| `paint()`: `fill(WALL)`, `fill(1, EMPTY_SP)`, `placeShopkeeper()`, `placeItems()`, all doors REGULAR | `rooms/special/shopRoom.ts` | Ported. `placeShopkeeper()`'s `center()` rolls a `Random.Int(2)` per odd-span axis; `placeItems()`' inner-ring walk falls back to a `Room.random()` retry loop on any cell already holding a heap, which is reached routinely (a 7x7 shop's ring holds 16 cells against ~20 items at depth 6) |
| `ChooseBag()`'s choice of *which* bag | `'Bag'` label, +1 to the count | **Ported (2026-09-17).** `chooseShopBag` (`src/items/bags.ts`) is the real rule: the highest scorer among the not-yet-dropped bags (velvet base 1, the rest 0, +1 per holdable backpack entry), stocked in Java's position with the flag dropped at shelf-generation time and persisted with the run. Ties go to the earlier bag id - Java's own tie-break is JVM `HashMap` order, not reproducible even in principle. The level-generation `bagsRemaining` count is unchanged (identity was always invisible to layout). Verified headlessly (pick/scoring/tie/exhaustion/`stone` disambiguation) and live (14/14, see the shop-shelf row) |
| `TimekeepersHourglass` sand bags and `timeFreeze` | `shopItems.ts` hourglass state, `main.ts` item bridge/pickup/save/action scheduler | **Partially ported.** Identified, uncursed hourglasses now add `ceil((5 - sandBags) * 0.20f)` bags at depth 6 (0.25/0.50/0.80 at 11/16/20-21), capped at the remaining five; picking up a bag upgrades the hourglass, rejects missing/cursed hourglasses without consuming it, and persists the custom sand count. Concrete `TimekeepersHourglass`/`sandBag` identities are retained through generated drops and saves. The active freeze action now pauses automatic actors, lets hero actions proceed without scheduler time, consumes one charge every two hero-time units, queues trap/plant presses, cancels on attack/magic, and persists its timer. `timeStasis`, artifact recharge cadence, visuals, and exact charge/fractional-time presentation remain unported |
| `Stylus.INSCRIBE` / `Stylus.inscribe(Armor)` | `useStylus`, generic item picker, `GLYPH_TABLE` | **Simplified but playable:** the picker accepts the armor families represented by this port and rejects unidentified or cursed armor before consuming the stylus, then assigns one random good glyph from the real table. Java's two-turn busy cost and inscription/purple-particle presentation are not modeled because this port has no matching animation/timing seam; equipped armor is not exposed by the bag-only picker. |
| `ShopRoom` concrete weapon/armor stock and `Shopkeeper.canSell`/`WndTradeItem.sell` | `itemKinds.ts`, `shopPricing.ts`, `main.ts` shop picker/buyback | **Ported for supported gear:** generated concrete weapons/armor now become level-0, uncursed `weaponReward`/`armorReward` payloads retaining Java class and tier; Java's `20 x tier` value formula (including known curse/good-affix/identified-level modifiers) is used for purchase and sale pricing. The picker sells one unit of any positively-valued supported item, not food only. **`WndTradeItem`'s selling half is now its real rule, not a one-unit stand-in (2026-09-15)**: Java builds one of two windows from `item.quantity() == 1 || (item instanceof MissileWeapon && item.isUpgradable())` (`WndTradeItem.java` 78-131) - a single `sell` button for that case, and otherwise `sell_1` at `priceAll / item.quantity()` beside `sell_all` at `priceAll` (`item.value()`, the whole *stack*). `sellFood` (`items/shopActions.ts`) now decides which of those applies and hands the scene a rendered option list, so the *rule* is headless-testable and the scene only draws it; the labels are SPD's own `windows.wndtradeitem.sell`/`sell_1`/`sell_all`, which all 19 locales already ship. What this replaces sold exactly one unit for every item, so a stack of twelve potions took twelve picks and had no way to be sold in one action. Browser-verified (`tools/scratch/sell-window-livecheck.mjs`, 11 assertions, all passing): a 5-potion stack offers "Sell 1 for 30g"/"Sell all for 150g" and sells nothing on the pick alone, a lone potion gets one "Sell for 30g", an upgradable missile stack takes Java's single-button branch ("Sell for 120g" for 8 Bolases), and clicking "Sell all" through the real pointer path empties the stack, pays the full 150 and shelves the whole stack as one buyback entry. **Not modelled**: the `extraThrownLeft` warning Java prints above the button (`WndUpgrade.thrown_dust`), which needs a per-stack extra-thrown counter this port's ammo has no state for. Tipped darts, brewed spells, and distinct bag implementations remain unported. |
| `Grim.proc()` / `Char.damage()` + `GrimTracker` | `main.ts` central `attack()` damage boundary | **Ported:** after damage is committed, the real `(0.5 + 0.05 * buffedWeaponLevel) * Arcana` chance is multiplied by the squared missing-HP fraction; success deals `round(currentHP)` extra damage and can finish the target. This replaces the former flat 15%/15-damage stand-in and also works for Unstable's delegated Grim. |
| `Lucky.proc()` / `LuckProc` | `main.ts` `heroOnHit` lethal-enchant branch | **Ported gate and placement:** lethal hits now use Java's `(buffedLevel+4)/(buffedLevel+40) * Arcana` chance and place the deferred bonus in the corpse cell or a free neighbour. The reward catalogue remains the documented common/uncommon potion/scroll/stone/armor stand-in because the full Wealth rarity generator is not yet represented. |
| `WandOfBlastWave` identity, `onZap()` damage/knockback | `main.ts` `wandTypeFromSource` and zap dispatch | **Simplified but playable:** Blast Wave now survives generated wand identity, deals its real level-scaled `1+level..3+3*level` magic damage to the target-centred 3x3 area, and pushes living victims outward by the real `1+round(level/2)` strength. Java's Ballistica cone, cell-press side effects, collision damage, and delayed pushing presentation remain simplified. |
| `Earthroot.Armor` (`plants/Earthroot.java`) - the block pool the Earthroot plant and the `Entanglement` glyph share, exactly as Java shares one buff between them | `earthrootArmor`, `earthrootBlocking()`, `absorbHeroDamage` | **Ported (2026-09-12), replacing two different wrong models.** Java's buff is a *pool*: `level` points that absorb `min(damage, (scalingDepth + 5)/2)` of every hit and detach once exhausted **or once its owner has left the cell it was granted on** (`act()` and `absorb()` both compare the stored `pos`). The plant sets `level = ch.HT`; the glyph gives the *defender* `round((5 + 2*buffedArmorLevel) * max(1, chance))` behind its Arcana-scaled 1/4 proc. What stood here before: the glyph was recorded as "ported with status substitution", storing that *number* in a `cripple` movement lock - wrong twice over, since Java's glyph **protects its wearer** rather than disabling the enemy and protects by blocking damage rather than by stopping movement, and it was applied to the attacker rather than the defender; the plant had its own stand-in, a full-strength `Barrier` shield worth the hero's max HP that ignored both the per-hit cap and the movement rule. One pool now serves both and is saved with the run, as Java's buff is. Browser-verified live, 6 assertions: the plant's pool is the hero's max HP and blocks exactly `(depth + 5)/2` of a 20-damage hit while the pool drops by the same amount; leaving the cell detaches it so the next hit lands in full; the glyph grants the defender `round((5 + 2*level) * max(1, chance))` and leaves the attacker uncrippled. **Known stage difference**: Java absorbs in `Char.defenseProc()`, before the armor subtraction and ahead of every shield, while this port's absorption point is after the damage roll (which has already taken armor off), so a hit burns slightly less of the pool here. **Not modelled**: the Warden's `Barkskin` variant of the plant. **Update 2026-09-17:** the mob-side pool is live too - stepping mobs and allies grant the same keep-max pool through `triggerMobPlantAt` (per-creature `earthrootArmorLevel`/`Pos`, absorbed per landed attack hit in `attack()` before the defender damage curves, persisted through save/load); the "(plant activation here is hero-only)" premise above was already stale when written (mob activation is live since 2026-09-14, see the `Plant.trigger()` row). |
| `Potential.proc()` / `Belongings.charge()` | `main.ts` armor-glyph defense hook + `Actors.Charges.advance` | **Ported:** Arcana-scaled `(level+1)/(level+6)` proc chance and fractional `max(1, chance)` charge progress are retained through the framework charge resource, rather than incorrectly refunding a whole charge. |
### The bug this exposed in the SHARED core (pre-existing, not shop-specific)

**`paintDoors`' `roomMerges` bookkeeping omitted entrance/exit rooms.** Java writes
`((StandardRoom) r).sizeCat == NORMAL` with an UNCONDITIONAL cast, and `EntranceRoom`/`ExitRoom`
both *extend* `StandardRoom` - so they are recorded in `roomMerges` like any other normal-size
room, which is what caps a room at one merge. This port tested `r.kind === 'standard'`, which
excludes the separate `'entrance'`/`'exit'` kinds, so an entrance or exit could merge with a
second neighbour Java refuses. Each extra merge swallows a door, removing its hidden-door
`Random.Float()` from `paintDoors` and desyncing the stream for the rest of the floor.

Found by trace-diffing `999999999999:6`: Java merges `ExitRoom`+`PillarsRoom` and then *declines*
`ExitRoom`+`FissureRoom` (falling through to the door branch, its 13th roll), while this port
merged both and rolled 12. Note the cast is safe in Java only because a merge can succeed solely
when both rooms are `StandardRoom` subclasses - `Room.canMerge()`'s base returns false, so
`mergeRooms` fails for every special/secret/connection room.

Also corrected while tracing, though it was not the cause: the `SOLID` terrain set used by
`canMerge` was missing `LOCKED_EXIT`, `SIGN`, `STATUE`, `STATUE_SP` and `ALCHEMY`, which would let
a merge expand across a statue or alchemy pot that Java stops at. It is now read exhaustively off
`Terrain.java`'s static initializer. Unreachable on the floors verified so far (none of those
tiles lands adjacent to a merge candidate), but wrong.

### Verification (harness sequence 1,2,3,4,6,7,8,9 per seed; 4 seeds = 32 floors)

**All 28 floors at depths 2-9 are MAP EXACT MATCHES on every run, including all four depth-6 shop
floors.** Across five runs of the unmodified Java harness the score was 32/32 four times and
29/32 once, and every floor that ever differed was depth 1 or depth 2 - exactly the floors
documented above as non-reproducible in Java itself (`EntranceRoom.paint()`'s unseeded guidebook
generator, and depth 2's unfound searching page).

Depth 5 remains the only omitted floor: `SewerBossLevel` extends `Level`, not `RegularLevel`. That
omission does not desync depths 6+, because `secretsForFloor()`/`initForFloor()` are reached only
from `RegularLevel.initRooms()` and the harness skips `createItems()` on every floor, so a boss
floor mutates none of the run-level state (`SecretRoom`'s budget, the `SpecialRoom` queue,
`Generator`'s decks) that later floors read.

One residual worth recording honestly: on an earlier run `1:1` differed by 25 cells in three
consecutive comparisons, which looked too stable to be chance - but trace-diffing it showed the
two sides consume an **identical** 3375-draw stream, and it has matched exactly on every run
since. So the port's randomness is exact there, and the earlier difference was Java's own depth-1
nondeterminism after all; no port-side cause was found or is believed to exist.

The harness now builds a bare `Hero` (empty backpack) plus `LimitedDrops.reset()` +
`VELVET_POUCH.drop()`, rather than running `HeroClass.initHero()` - which would drag in
Talent/Badges/quickslot state the harness has no business booting. Per the `ChooseBag` reasoning
above this costs no fidelity, since the backpack can only change which bag is offered.

## Integration: the ported generator in the live game (`spdLevelGen/gameBridge.ts`)

`main.ts` now generates Sewers 1-4 and Prison 6-9 from `spdLevelGen/` instead of
`generateSpdDungeon`. Every other depth (5, 10+, all boss floors) still uses the generic
generator, because this port does not generate hand-authored arenas or the three regions past
the Prison. `generateSpdDungeon` is therefore still live and was left untouched.

**Generation is driven exactly as the Java harness drives it**, because anything else would
produce a floor that was never verified: `gameBridge.ts` runs `Dungeon.init()`'s run-level
resets once per run seed, then generates floors in strict ascending depth order (1,2,3,4,6,7,8,9)
and caches them. The cache is what makes this safe - `SecretRoom`'s budget, the `SpecialRoom`
queue, `Generator`'s decks and the shop's bag counter are all consumed floor by floor, so
re-entering a floor would otherwise consume that state twice. A consequence worth stating: on a
ported depth the *terrain* you climb back down to is the floor you left, where the generic
generator used to re-roll it. Mobs, items and opened doors are still rebuilt (see the row above).

**Confirmed unchanged by integration**: 30/32 maps byte-identical to the Java harness after
wiring, the two exceptions being `123456789:1` and `42:2` - the same depth-1/depth-2 floors
documented above as non-reproducible in Java itself. No generated byte moved.

### The terrain mapping, and what it loses

The generator speaks real `Terrain.java` constants (0-31); `main.ts` implements eight coarse
kinds. The mapping is therefore many-to-one. **Passability is preserved in every case**;
behaviour is not. `main.ts` owns the numeric ids and passes them in (`GAME_KIND_CODES`), so the
two halves cannot drift silently, and an unmapped `Terrain` value is a hard error rather than a
wrong tile.

| SPD terrain | mapped to | what is lost |
| --- | --- | --- |
| `CHASM` | `floor` with raw pit frame | Java lets the hero enter a chasm and fall to the next floor, and chasms do not block line of sight. The coarse collision kind is now open while raw CHASM keeps the pit atlas frame; the movement boundary still prevents non-hero mobs from stepping into pits. |
| `BARRICADE` | `wall` | Java's is flammable and can be burned through; permanent here |
| `STATUE`/`STATUE_SP` | `wall` | Java's animate into a `Statue` mob on contact; scenery here (the mob is not spawned either way - mob generation is not ported) |
| `BOOKSHELF`, `ALCHEMY` | `wall` | Searchable / craftable in Java; scenery here |
| `LOCKED_EXIT` | `wall` | Boss-floor gating; unreachable on the ported regular floors |
| `WELL`, `EMPTY_WELL` | `floor` | Java's wells hold a `WellWater` effect |
| `SIGN` | `floor` | Java shows its text on contact |
| `PEDESTAL` | `floor` | Holds the Amulet on Java's last floor |
| `EMBERS`, `EMPTY_SP`, `EMPTY_DECO`, `INACTIVE_TRAP` | `floor` | Cosmetic in Java too (an `INACTIVE_TRAP` is a sprung one) - only the distinct sprite is lost |
| `CRYSTAL_DOOR` | `doorClosed`, locked by `crystalKey` | Ported - queued crystal keys from `Level.itemsToSpawn` are placed on valid room cells after painting; exact Java `randomDropCell()` room-selection parity remains simplified |
| `LOCKED_DOOR` | `doorClosed`, locked by `ironKey` | The same stand-in key the generic path uses; Java's key placement needs drop logic this port has none of, so the key still comes from a guard |
| `SECRET_DOOR`, `SECRET_TRAP` | concealed via `Secrets`, not mapped directly | Correctly render as their disguise (`wall`/`floor`) until searched out |
| `WALL_DECO` | `wall` | Cosmetic |
| everything else | 1:1 | `EMPTY`/`GRASS`/`HIGH_GRASS`/`WATER`/`DOOR`/`ENTRANCE`/`EXIT`/`TRAP` map directly |
Trap **behaviour** was never ported, only class names and weights (which is what `Random.chances`
and `avoidsHallways` need). `gameBridge.ts`'s `TRAP_BEHAVIOUR` routes each real class to one of
the seven effects `main.ts` implements. Only `toxic`, `burning`, `poisonDart`, `wornDart`,
`confusion` and `corrosion` are
genuine matches; `chilling`, `shocking`, `alarm`, `ooze`, `gripping`, `confusion`, `flock`,
`summoning`, `teleportation`, `gateway` and `geyser` are stand-ins, since their real effects
(freezing, chained lightning, waking the floor, corroding, rooting, confusing, summoning,
teleporting, gateways, launching the hero) need systems this port has none of. A trap in the
verified grid still does *something* when stepped on rather than being dropped.

### Integration bugs found and fixed while wiring

Four, all in `main.ts`'s own post-generation passes, which had assumptions only the generic
generator satisfied:

1. **The generic terrain passes had to be skipped.** `placeWaterPool`/`placeGrass`/`placeDoors`/
   `placeHiddenTraps` *invent* plausible water, grass, doors and traps. A ported floor already
   has all four in Java's own positions at Java's own fill numbers, so running them would
   overwrite precisely the output that was verified. They are now gated, and the floor's real
   doors/secret doors/traps are adopted from the grid instead (`adoptPortedFeatures`).
2. **`rooms[0]` is not the hero's room on a ported floor.** Every spawn site used
   `Random.int(1, rooms.length)` to skip index 0, which is the entrance room by construction in
   the generic generator. A ported floor's order is whatever `LoopBuilder` and then
   `RegularPainter`'s in-place shuffle produced, so index 0 means nothing; the hero's own cell is
   now excluded explicitly instead (`randomSpawnRoom`).
3. **`populate()` never checked passability.** It only checked for another creature, which was
   survivable when a room's interior was all floor. A ported floor puts far more solid terrain
   *inside* the room rect - chasms, statues, bookshelves and maze walls all map to `wall` - so
   monsters could spawn inside rock. Now guarded and retried.
4. **Every NPC spawn used `rectCenter(room)` unconditionally.** Safe on a generic floor, not on a
   ported one: a `SecretMazeRoom`'s centre is maze wall, a `CircleBasinRoom`'s is water, and
   anything folded onto `wall` can sit dead centre - sealing the NPC in solid rock. Replaced with
   `standableCellIn`, which prefers the centre and falls back to any passable cell.

Also fixed: `searchForSecrets` announced every discovery as "a hidden trap", which is wrong now
that real `SECRET_DOOR` cells are concealed too.

### Verified structurally

`tools/scratch/checkBridge.ts` walks all 32 ported floors and checks what a renderer and the
gameplay depend on: that the mapping covers every emitted `Terrain` value, that each floor has an
entrance and an exit, and that **the exit is reachable from the entrance through the mapped
terrain** (bumping closed doors open). Result: the exit is reachable on all 24 floors at depths
3,4,6,7,8,9, and the terrain mixes look right (real water, grass, high grass, doors, traps).

The 8 depth-1 and depth-2 floors report the exit as *unreachable*, and this is **faithful, not a
bug**: with `SPDSettings.intro()` true - a fresh install, which is what this port always is -
Java makes every entrance-room door a `SECRET_DOOR` as its search tutorial, so the hero genuinely
starts sealed into the entrance room. Re-running the same reachability check with secret doors
treated as walkable makes the exit reachable on all 8, which is the decisive test: the seal is the
tutorial, not a mapping error that walled the stairs off. `searchForSecrets` checks all 8
neighbours, so the doors are findable and every ported floor is completable.

### mwg usage audit (2026-09-12 baseline, refreshed against installed 0.14.0 on 2026-09-15)

A pass over how this port uses the *framework*, checked against the installed package's own
`README.md`, its 277 `.d.ts` files (whose doc comments carry the contracts) and the published
`REFERENCE.md` (read for the conventions it states; the installed version is the authority for
behaviour). It found no gameplay bug, four documentation defects and one large pending conversion.

**Correctly delegated, checked one by one.** Dungeon generation drives `Roguelike`'s generators,
`Pathfinder` and its field of view rather than a second implementation of either; terrain drawing
uses `TileMap` + `autotileFrames` + `BLOB_SHAPES`; actor drawing uses `SpriteSheet`,
`AnimatedSprite`, `TintedSprite` (with `registerColorTransform`) and `Tweener`; the title flame uses
`ParticleEmitter`; the HUD uses `Bar`, `Label`, `Button`, `Window`/`WindowStack`, `NinePatch` and one
live-swappable theme through `setTheme`; floating combat text uses `FloatingTextStack`; the King's
phase hooks use `ReactionTable` + `ReactionRule`; stateful resources use
`Actors.Charges`/`Barrier`/`StatBlock`/`Inventory`/`Appearances`/`Progression`/`Advancement`;
persistence uses `SaveSystem`, `Achievements` and `RunHistory`; sound uses `Audio.Music` and
`Audio.Sound`; the headless suites drive `Scheduler`/`SimulationRuntime`/`advanceToInput`; quests use
`Rpg.QuestLog.advanceStage()` + `GameState` switches. `src/i18n/index.ts` says outright that the
catalog shape, `{token}` interpolation, CLDR plurals and base-language fallback are `mwg/i18n`'s and
keeps only SPD's own capitalisation/title-case rules local. The framework's save conventions are
followed throughout: every framework class round-trips through `toJSON()` and
`fromJSON(defs, data)` with the game's definitions passed in fresh (`StatBlock.fromJSON({base: ...},
state)`, `Inventory.fromJSON(new Map(this.bagDefinitions), state)`, `Blob.fromJSON`,
`Charges.fromJSON`, `QuestLog.fromJSON`, `ReactionTable.fromJSON`), and `StatBlock`'s modifiers are
deliberately *not* saved - `syncHeroFromStats` removes and re-adds the ring source every sync, so a
load cannot double them, exactly as `StatBlock.toJSON`'s own doc comment requires. The port's
conventions match the framework's elsewhere too: every `advance(...)` call is on a framework clock
(`this.clock`, `Charges`, `beam`) and never on a non-time operation, and its "nothing to pick"
returns are `null` - the two exceptions found (`rangedTarget`, `aggressionTarget`) returned
`undefined` and now end in `?? null`. `RichLabel` is correctly unused (no long help bodies yet; the
rule is that it is for descriptions, not per-frame numbers).

**Finding 1 - the three hand-registered render pipes are redundant, and the comment saying otherwise
was wrong.** `main.ts` passes `extensions: [registerColorTransform, () => extensions.add(
TilingSpritePipe), () => extensions.add(NineSliceSpritePipe)]`. mwg's contract (`two-d/Game.d.ts`)
is the opposite of what the old comment claimed: "TintedSprite ... registers its own colour-transform
pipe automatically, at module scope, the moment a game imports it; a game never has to pass anything
here for that" - and mwg whitelists `dist/two-d/render/TintedSprite.js` in its `sideEffects` field to
keep that registration through bundling. Verified by probe rather than by reading:
`tools/scratch/pipe-registration-livecheck.mjs` writes four variants of the *built* `dist/game.js`
(all three registrations, none, colour transform only, the two Pixi built-ins only), loads each from
`file://` and reads `window.__MWG__.app.renderer.renderPipes` - the live registry, the only authority
on what actually registered. **All four variants reach depth 1 with monsters and report
`mwg-tinted-sprite`, `tilingSprite` and `nineSliceSprite`**, so none of the three is needed against
this mwg/pixi pair. They are kept (two idempotent lines against a failure mode that cost a whole
session when it hit, and that Pixi cannot repair lazily because a pipe must exist before the
renderer), but the comment now states the contract, the verification, and the history instead of
asserting that mwg leaves registration to the game.

**Finding 2 - 25 files import `pixi.js` directly, where the framework now offers names for 82 of the
85 value symbols they use.** `two-d/pixi-interop` re-exports `Container, Sprite, Texture, Graphics,
Rectangle, Text, FillGradient, TilingSprite` with the explicit instruction that importing from there
"keeps that dependency visible and confined to one file, instead of spreading `pixi.js` imports
through the game's own source", and `two-d/render` now offers `Node2D`/`Shape2D`/`Sprite2D`/`Text2D`/
`TiledSprite`/`Gradient` plus `Container2D`/`Texture2D`/`Rectangle2D` in value positions. Measured:
25 files, 85 value symbols, of which only `extensions`, `TilingSpritePipe` and
`NineSliceSpritePipe` (all in `main.ts`) have no facade or interop name. That conversion is *not*
done here - it is a 25-file mechanical change and is recorded as the actionable half of P2 in
`SPD_ARCHITECTURE_TARGET_V3.md`, whose "still NOT in `mwg`" section was corrected in the same pass
(it still described 0.5.0, where value positions were thought to be unreachable).

**Finding 3 - `mwg/assets` and `mwg/tools/compile-resources` are unused, deliberately.** Assets are
inlined by Vite instead (`assetsInlineLimit: Number.MAX_SAFE_INTEGER` for the 124 PNGs,
`import.meta.glob(..., {eager: true, query: '?url'})` for the 84 sound files), which produces the
same runtime property the compiled resource map exists for - build-time resolution, so no lookup
ever fetches - in one classic script instead of two. The trade-off (the framework's `optional`/
`fallback` batch semantics are not used because there is no batch) is now stated at the config site
rather than left implicit.

**Also corrected in this pass, all stale rather than wrong-in-effect:** `vite.config.ts` claimed
"there are no image/audio assets yet" (there are 124 + 84, both inlined by the two settings in the
same file) and described `mwg` as "a symlinked `file:../MW_games` dependency with its own nested
`node_modules/pixi.js`" (it is the published `@datamoc/mw_games` npm alias in a real directory with
no nested `node_modules` at all; the `dedupe: ['pixi.js']` guard stays, now with that history);
`main.ts`'s Sad-Ghost quest comment referred to `SewersScene` calling `advance()` where the
framework API is `Rpg.QuestLog.advanceStage()`.

**Second pass, same day: two read-only sub-audits (one hunting hand-rolled duplicates of framework
capabilities, one checking the runtime contracts), with every claim re-verified here before acting.**

Adopted from it:

- **`FloatingTextStack`'s two carried defects, both fixed upstream in 0.7.7 and adopted now.** The
  detailed record is above, where the port's own "pending a release" note used to sit: a pop-up
  scaled after `push` was measured before the scale (stacked lines ~3x too far apart), and the stack
  lifted the wrong line. `push` now takes `scale`, `showStatus` passes it, and the framework lifts
  the older line. Verified live (`tools/scratch/floaters-livecheck.mjs`): measured height `9.45`
  equals `7px x 1.35 / 3` - the drawn size - the older line sits `13.45` above the newcomer (drawn
  height + Java's 4px gap), and the newcomer stays exactly where it was pushed.
- **`Camera.toWorld` replaces the hand-rolled `map.toLocal`** for both pointer paths - the
  documented way to turn a click into a tile, and numerically the same thing here because the map
  is a direct child of `camera.world` at its origin.
- **`theme.direction` now follows `I18n.direction()`** - at theme creation, and again from
  `applySpdDirection()` on the one path that can change the language (the title screen's cycle), as
  `theme.d.ts` asks. Unobservable while every catalogue is LTR, which is why it is wired now.
- **`Roguelike.chebyshevDistance` replaces 21 of the 26 inlined `max(|dx|,|dy|)` checks** in
  `main.ts`, which already imported and used the helper. The blanket form of that recommendation was
  *not* applied: the 5 left inlined compare loose coordinates or deltas (`Math.abs(dx)`), where the
  helper's two `Step` arguments would mean fabricating a pair per check, and
  `src/simulation/combat.ts`'s one occurrence is out of scope by construction (nothing under
  `src/simulation/` may import `mwg` at runtime).
- **Two wrong comments fixed**: the title screen's listener-order note had the stack-mode direction
  backwards (`Signal` adds new listeners at the *front*, so the scene's handler is offered the action
  before `WindowStack`'s and is safe only because it never returns `true`), and the chasm-landing
  note claimed no camera-shake system exists where mwg ships `Camera.shake` and this port simply
  never calls it.

Recorded here, not done, each with the framework API that owns it:

- **Scheduler persistence bypasses `Scheduler.toJSON`/`Scheduler.restore`.** `main.ts` saves only
  `schedulerNow` plus a per-creature `nextTurn` and re-adds actors in `state.creatures` order, so the
  snapshot's `sequence` counter is lost and two actors tied on `nextTurn` can resolve in a different
  order after a load than they would have without saving (the framework's `restore` doc says
  explicitly that it restores "`now` *and the sequence counter* so that ties among actors added
  afterwards resolve exactly as they would have"). **Adopted the same day - see the next bullet.**
- **Scheduler persistence now uses `Scheduler.toJSON`/`Scheduler.restore`** (2026-09-12). It used to
  save only `schedulerNow` plus a per-creature `nextTurn` and re-add actors in `state.creatures`
  order, which loses the snapshot's `sequence` counter - and since `Scheduler.sort` breaks ties on
  `time`, then `priority`, then `sequence`, two actors tied on time could come out of a load in a
  different order than they would have without saving. `FloorState.scheduler` now holds the whole
  queue (`Roguelike.Scheduler.toJSON`), keyed by ids this port assigns - `mob-<index>` into the
  same `creatures` array `savedIndex`/`skeletonIndex` already index, plus `hero` for the one actor
  that array deliberately excludes because it outlives every floor. Restore rebuilds a *new*
  scheduler through `Scheduler.restore`, so `SceneSimulationAdapter` (which captured the old
  instance at construction) is now built by `buildSimulation()` and rebuilt there; `enterLevel`'s own
  `scheduler.add(this.hero, 0)` is skipped only when the restored queue actually holds a hero entry
  (derived from the snapshot, not assumed - `Scheduler.add` does not guard duplicates, and a queue
  with no hero would leave `advanceToInput` unable to stop for input). Saves written before the
  snapshot still load: the legacy branch re-adds actors from `nextTurn`/`schedulerNow` exactly as
  before. Live-verified (`tools/scratch/scheduler-queue-livecheck.mjs`, 13 assertions): a queue
  deliberately ordered *against* the creature array (hero, crab, snake, rat at one time) survives two
  save/load round-trips entry-for-entry with `now` and `sequence` intact, and preserves the floor
  depth plus the hero and three probe monsters' positions and HP; a real `KeyF` search on the
  loaded game spends the hero's turn (its scheduler time 100 -> 101) and returns to hero input with
  the hero queued exactly once; and a save with the snapshot stripped still loads and still reaches
  hero input. The probe now has 14 assertions. This was the audit's "next concrete adoption" and
  the only item in its list that was a real save/load divergence rather than a capability gap.
- **The inventory UI is partly framework-backed** (`src/ui/inventoryWindow.ts`): MWG's
  `TabbedList` owns category filtering/page derivation and `IconGrid` owns the masked grid and
  keyboard navigation. SPD-specific chrome, tab/page buttons and inspect-detail behavior remain
  local; see the "Avoidable reimplementation" row above.
- **The hero runs on the framework's own animator (2026-09-12).** It used to have its own frame
  animator and 0.1s move tween (`src/ui/heroAnimation.ts`, deleted) while every monster used
  `AnimatedSprite` + `Tweener`. The hero is now an `AnimatedSprite` too - which extends
  `TintedSprite`, so the colour channel its flash/stealth tinting uses is unchanged - playing the
  same `HeroSprite` cloth-tier tables the animator walked by hand (idle `0,0,0,1,0,0,1,1` at 1 fps,
  run `2..7` at 20 fps, attack `13,14,15,0` at 15 fps once, death `8,9,10,11,12,11` at 20 fps
  holding its last frame), and its walk tween is the same `Tweener` in the same shared motion map the
  monsters use. Two things fell out of doing it: the attack clip is now played by the same line for
  every character rather than a hero/monster branch, and the loop's "a finished clip returns to
  idle" rule needed a `playing !== 'die'` guard, because the hero (unlike a monster) stays in
  `this.creatures` after death and would otherwise stand back up. Browser-verified live
  (`tools/scratch/hero-animation-livecheck.mjs`, 8 assertions): all four clips registered and idle
  on spawn; a step plays run and files the tween; sampled mid-tween the sprite sits strictly between
  the two cells and settles exactly on the destination idling; attacking plays attack; and dying
  plays the death clip to its end and *holds* it (`isFinished`, then still `die`).
- **Wall decoration particles now use MWG 0.8.1's pooled emitter.** `src/ui/wallDecorations.ts`
  gives each FOV-gated spot its own emitter, preserving Java's immediate clear when a cell leaves
  FOV. Sink uses a per-particle blue-green tint range, Torch uses its two-phase fade plus flicker,
  Smoke uses piecewise scale/alpha curves, and WaterEmberLayer retains Java's per-cell random
  delay while using the shared emitter for motion and fade. The torch halo remains a documented
  low-alpha circle instead of Java's radial-gradient Halo, and Sink's water ripple remains
  unported because this port has no ripple hook. This closes framework proposal P14.
  **Browser-verified 2026-09-13** (`tools/scratch/wall-decorations-livecheck.mjs`): the hero was
  teleported beside a real Sink spot (Sewers) and a real Torch spot (Prison), both located by
  reading the live scene's `wallDecorations['spots']` array rather than assumed coordinates, and
  screenshotted after letting the pooled emitters run - the sink cell shows a rendered
  blue-green droplet and both visible torch sconces show their FOV-gated warm halo, confirming
  the migration actually reaches the screen and not only the type-checker.
- **Modal panels now use MWG's `Window`/`WindowStack` for ownership**. The talent panel was moved
  inside a lazily created MWG `Window` on the scene's `WindowStack` (2026-09-16), retaining its
  SPD-specific content layout while gaining framework modal ownership, viewport placement, cancel
  and outside-click cleanup. The shared item picker is now a
  real MWG `Window` on the scene's `WindowStack` (2026-09-16), including its item-info body,
  cancel handling and outside-click dismissal; every picker consumer therefore blocks the world
  through the framework's modal path rather than a scene-sized `Graphics` panel. `InfoWindow`
  is now a fresh MWG `Window` per opening (2026-09-16), retaining the inner SPD stat-row panel but
  dropping its duplicate full-screen dimmer and close flag. These modals use `Window`/`WindowStack`/
  `MessageBox` as appropriate and are used for the title screen, the journal and - since 2026-09-12 - the in-game menu
  (`WndGame`). What the menu
  did expose were the two halves of Java's `Window` blocker, recorded as proposals **P15** (the
  pointer half) and **P16** (the keyboard half - who owns a key when a scene and its stack both
  listen), plus **P17** (`SpriteSheet` cut regular grids only, so irregular sheets were hand-cut
  here); all three are in `ROADMAP.md` section 11A. MWG 0.8.0 shipped all three natively
  (`Window({ blocker: true })`, public `WindowStack.handleAction`, `SpriteSheet.rect`), and this
  port has adopted all three: every `Window` construction site passes `blocker: true` (the local
  `BlockingWindowStack` subclass is retired), both scenes chain their `Input.onAction` listener
  through `stack.handleAction`, and the repeat-cut sites (wards, inventory icons, title flame)
  read from cached sheets. One-off static crops stay hand-cut `Texture`s - a sheet buys them
  nothing, since each is cut exactly once.
- **Screen transitions are hand-computed, and re-read against Java in full (2026-09-16)** -
  `ScreenEffects` is deliberately *not* adopted (see P8), because it is a flat colour wash while
  this curtain is a five-stop gradient. What that read established, previously only assumed: Java's
  arrival is two layers - `GameScene.create()`'s trailing `PixelScene.fadeIn()`, a `Fader` black
  wash clearing over `FADE_TIME = 1f`, and `InterlevelScene`'s own rotated gradient veil whose
  custom `update()` drives its alpha to a peak of **0.666** (`2*(timeLeft - (fadeTime - 0.333f))`
  during FADE_IN, `2*(0.333f - timeLeft)` during FADE_OUT, forced to 1 only for `lastRegion == 6`,
  the final vault). This port reproduces the timings exactly (0.33 in / steady / 0.33 out, with
  `NORM_FADE` 0.67 and `SLOW_FADE` 1.0 steady giving the real 1.33s/1.66s totals) but collapses both
  layers into one gradient animated 1 -> 0, so its veil is darker than Java's ever gets, and it
  additionally fades the loading text with `1 - curtain.alpha`, which Java does not animate at all.
  Also unmodelled: `FAST_FADE` (0.50 steady, 1.16s total) for descending to an already-seen depth or
  any ascent - the port only distinguishes normal from slow. **Divergence (deliberate) on the
  timing model**, with the two-layer and `FAST_FADE` gaps open as simplifications.
- **Screen shake: wired (2026-09-12), where its Java feature exists.** Java routes every shake
  through `PixelScene.shake(magnitude, duration)` - 43 call sites - whose body is just
  `magnitude *= SPDSettings.screenShake(); Camera.main.shake(magnitude, duration)`. The port now has
  the same wrapper (`main.ts`'s `shakeScreen`, minus the preference: there is no screen-shake
  setting here, and Java's default is 1 with the setting only scaling *down*, so omitting it is the
  faithful default), and calls it at every site whose Java feature is ported: **the chasm landing**
  (`Chasm.java` 143, `4, 1f` - and this corrected the port's own comment, which had claimed `1, 1f`),
  **mining a wall or a DarkGold vein** (`Hero.java` 1299/1310, `0.5, 0.5f`, both branches), **DM-100's
  lightning bolt** (`DM100.java` 107-109, `2, 0.3f`, on the hero-target branch its AI always uses),
  **DM-300's ROCKS** (`DM300.java` 655, `5, 1f`, where the volley is called down), **the Goo taking
  damage while pumped up** (`Goo.java` 162-164, `3, 0.2f`, the port's `pumped` charge counter being
  its `pumpedUp`), and the **rooted-refusal pair** (`Hero.java` 1770-1772 `getCloser` and the blink's
  `Preparation.java` 308-310, each `1, 1f` - the port's single `moveTo` roots gate covers Java's
  movement *and* stair-transition refusals, which are two sites in Java because Java checks them
  separately, and its blink refusal shakes only when the hero is rooted exactly as Java's does).
  Browser-verified live (`tools/scratch/screen-shake-livecheck.mjs`, 7 assertions): nothing shakes at
  rest, `dm300Rockfall` starts a magnitude-5/1s shake and still schedules its volley, the running
  camera jitters within the magnitude and settles back to zero when the duration elapses, and the
  chasm landing starts its own magnitude-4 shake. **Not wired, because the feature is not ported:**
  the hero ability shakers (`HeroicLeap` 71/119, `Shockwave` 102, `SmokeBomb` 91, `Feint` 93,
  `Challenge` 142/148), `Combo.java` 503 and `MonkEnergy.java` 481 (monk/damage-ability paths),
  `SuperNovaTracker.java` 103 and `GnollGeomancer.java` 438/520/708/710 (neither monster exists
  here), `CrystalSpire.java` 169/340/378/384 (the Blacksmith quest's crystal spire - that quest's
  mining/forge mechanics are still the simplified version), `Hero.java` 1177 (opening a
  TOMB/SKELETON/REMAINS heap - the port's chest kinds are normal/locked/crystal), and `DM300.java`
  325 (its `travelling` move, which this port does not model).
- **Boss ability timers** (six independent cooldowns across king/demonSpawner/yog/dm300) are the
  shape `Roguelike.AbilityCycle` provides; the *phase* machines around them are a documented
  correctness divergence from the framework's `BossPhases` (Java has no such half-HP Fury/0.75-0.5-0.25
  rhythm), so only the timers are a candidate.
- **`TileMap.setCellColor` (the documented fog-of-war/lighting hook) is unused** because SPD's fog is
  per-half-tile occluding and per-cell tint cannot express it; `visualWalls.ts` hand-codes Java's
  neighbour-mask atlas table where `resolveTerrainGraphics`/`TerrainGraphicsLayer` exist as a generic
  rule engine (the port uses the framework autotiler for water, so the wall half is the outlier);
  `ui/gameLog.ts` hand-manages its line budget and stacking where `ListView`/`ScrollBox` exist.

Two claims from the sub-audits were **not** acted on, for the record: `Actors.rollLoot` was reported
as never called, but it is called at four sites (`main.ts`'s warlock, scorpio, succubus and general
mob loot rolls), so that finding was dropped rather than propagated; and the Chebyshev conversion
above was applied only where it is a drop-in (see the bullet).

**Confirmed good by the second pass:** `MultiTurnBeam` uses the current non-deprecated shape at every
use (`blocker: 'none'`, `fronts`, `onCell`, the current `fromJSON` shape, no legacy `path`); all
keyboard input goes through `Input.bind`/`onAction` with no `document` listeners in `src/`; `Audio`,
`Achievements`, `SaveSystem`, `RunHistory` and `ReactionTable` match their contracts
argument-for-argument; the UI wrappers merge rather than fight `ButtonOptions`/`LabelOptions`/
`NinePatch`; the scene lifecycle (`new Game`, `await game.start`, `switchScene`, `Scene2D`'s
`create`/`update`/`resize`/`onDestroy`) follows the documented shape; and `tools/verifySimulation.mjs`'s
`mwg` shim maps to the **installed** `dist`, so the headless suites cannot pass against a fake
framework module.

**Third pass, same day: the MWL build tooling** (`tools/compile-mwl.mjs`), the one area the two
sub-audits did not reach. The good news first: it already drives the framework's own compiler -
`compileSources` for parsing/validation, `compileAndEmitSources` (whose double-compile determinism
check is the framework's) for the artifacts, `contentCatalog` for typed `[table]` rows - and leaves
only the cross-table invariants MWG cannot see to its own checks (roster/boss/alias/AI-profile
references, room-rule table widths, MWL asset existence, buff/immunity references), which is the
documented split. What it never did was call `mwg/mwl`'s **`validateCatalog`**, the shared semantic
validator: unknown equipment slots, effects without exactly one operation, invalid or unknown hook
references, and duplicate ids per tag. It is wired in now as a build gate - any diagnostic at
all fails `npm run mwl:compile` (there are none today: every table carries table-unique row ids,
so the content passes the shared check clean).

The restating tables used to carry the *domain* id as the row id in a second table
(`alchemyRecipeManifest` restating `alchemyRecipes`, `unstableEnchants` restating `weaponEnchants`,
and so on - 42 collisions once tolerated under a pinned count), while MWL's id namespace is
global per tag (`validateCatalog` keys its map on `tag:id`). Those rows are now named
`table-domain` (`unstable-blazing`, `manifest-stewedMeat1`, `curse-wayward`, `quest-wandmaker`)
and carry the domain id in a column (`enchant`, `recipe`, `curse`, `quest`), which is what the
readers expose - downstream code still sees bare domain ids. The pinned count and its
negative test are gone with the tolerated class; see `ROADMAP.md`'s row-id item.

`mwg/tools/mwl.mjs` (the framework's CLI: validate/compile/extract-i18n/assets/report/hooks/build) is
deliberately not used: this project needs three game-owned generated modules and validators the CLI
has no hook for, which is what the library API is for. `mwg/tools/extract-html.mjs` is the *inverse*
of `tools/emit.mjs`'s rewrite (it extracts inline resources *out* of a page), so it is not a
duplicate of anything here either.

**Coverage map for the whole audit**, so this is not re-derived next time. Adopted and checked:
`core` (`Game`/`Scene2D` lifecycle, `Input`, `Random`, `SaveSystem`, `Achievements`, `ReactionTable`,
`Tweener`, `Signal`), `two-d/render` (`TileMap`, `Camera`, `Projectile`, `SpriteSheet`,
`AnimatedSprite`, `TintedSprite`, `ParticleEmitter`, `autotileFrames`, `BLOB_SHAPES`), `two-d/ui`
(`Bar`, `Label`, `Button`, `Window`/`WindowStack`, `NinePatch`, `FloatingTextStack`, `theme`),
`roguelike` (`Pathfinder`, its field of view, `Scheduler`, `TargetingController`, `MultiTurnBeam`,
`neighbourOffsets`, `chebyshevDistance`), `actors` (`StatBlock`, `Inventory`, `Charges`, `Barrier`,
`Appearances`, `Progression`, `Advancement`, `rollLoot`, `rollAffix`), `audio` (`Music`, `Sound`),
`i18n` (catalogue/interpolation/plurals; the typed-message half is a recorded pending adoption),
`mwl` (compiler, `contentCatalog`, and now `validateCatalog` as a gate), `world`
(`TurnClock` - the rest of `world` is inapplicable: SPD has no overworld map, transitions or
encounter tables), `rpg` (`QuestLog`, `GameState`), `simulation` (`Scheduler`, `SimulationRuntime`,
`advanceToInput`), and `tools/compile-mwl.mjs`'s use of the library API. Deliberately unused, with the
reason on record: `assets` (Vite inlining, above), `mwg/tools/*` (the library API fits better, above),
`i18n`'s typed-message layer (recorded in `SPD_ARCHITECTURE_TARGET_V3.md`), and `rpg`'s map-event
interpreter + `two-d/ui.messageBoxPresenter` (SPD's NPC dialogue is code - Java `interact()` methods
branching on quest state, class and inventory - not authored event data, so there is nothing for the
interpreter to run; the *presentation* half of that gap is the hand-rolled-modal bullet above).
Inapplicable to this game: `3d`, `board`, `battle`, `ai` - and `two-d/stage`, which was listed here
too until the 2026-09-15 pass below showed the *text* half of it is a real adoption path even though
the interpreter half is not. **Refreshed the same day against 0.13.0**: `audio` now includes
`Sound.play`'s `pitch`; the `roguelike` and `core` areas no pass had ever named are listed above;
and the "25 files import `pixi.js`" finding below is corrected there too.

**Reconciling the two sub-audits' remaining claims**, after the notifications landed formally
everything they reported was re-checked against the workspace, and the items not already dispositioned
above are these:

- **The `patchRoom.ts` connectivity risk is closed, and the port was right.** The file's own header
  had called its 8-directional BFS "a documented best-effort assumption ... a real, currently
  unverified fidelity risk" whose cost would be a different retry count and therefore different RNG
  burn for `CircleBasinRoom`/`BurnedRoom`. Java settles it: `PathFinder.buildDistanceMap(to,
  passable)` (`SPD-classes/.../watabou/utils/PathFinder.java` at `v3.3.8`, lines 382-412) walks
  `dirLR` (line 67) - the four axis neighbours plus the four diagonals - with row-edge trimming that
  only prevents flat-index wrap, which this port's explicit `nx/ny` bounds already do, and its
  distance-guarded queue visits the same set a unit-weight first-visit flood does. Same
  neighbourhood, same predicate, so the retry count is Java's. The comment is now verified rather
  than flagged, and the sibling `CavesFissureRoom` BFS (which the `CavesFissureRoom` row above
  already asserted was 8-directional) rests on the same read.
- **Flat neighbour-offset tables re-declared rather than using `Roguelike.neighbourOffsets(8)`:**
  `genericDungeon.ts` and `spdLevelGen/spdPatch.ts` each carry a hand-written `neighbourOffsets9`
  and `maze.ts` a `dirLR` copy. The `maze.ts` one is a documented Java-fidelity translation of
  `PathFinder.buildDistanceMap`'s own order including its edge trimming, so it stays; the other two
  are hot-loop flat-index forms over a `boolean[]` that the framework's `(dx, dy)` pair helper does
  not express (the port's own idiom for including the centre is visible at `main.ts:4014`'s
  `neighbourOffsets(8).concat([[0, 0]])`). Not a defect, but also not documented - recorded rather
  than churned.
- **`SaveSystem` version 3 carries no `migrations` entry.** The framework's `migrations?: Record<number, (state) => state>` is how a `version` bump is meant to be expressed, and its absence
  means the number is a marker whose compatibility is instead enforced by `??`-tolerant field reads
  in `loadRun`. That is stated at the call site (`main.ts:1091-1093`) as deliberate, so this is
  "bypassed but documented" - listed here so the next reader does not re-open it as an oversight.
- **`src/challenges.ts` persists its selection in its own `localStorage` key** (`spd-on-mwg.challenges.v1`)
  with no version envelope and only a `try`/`catch` instead of the framework's `defaultStorage()`
  fallback, where `SaveSystem`/`Collection` exist for exactly this shape. Unlike the language key
  (`runState.ts:25-28` explains why *that* one is a pre-`main()` setting), nothing records why the
  challenge set is not a framework store - a small port-side item, recorded not changed.
- **`SimulationRuntime.snapshot()` is unused**, the same shape as the `Scheduler.toJSON`/`restore`
  bypass above (both would make a load resume the exact queue rather than a re-derived one).
- **`Halo`, `LightningArc` and `SpriteAttachment` are unused with no comment** (`Minimap` has one:
  the port's fog-of-war doubles as its map display; `StatusVisuals` is covered by P7 above). No
  behaviour depends on them, so this is a note, not a gap.
- **One sub-audit suggestion was checked and is wrong**, recorded so it is not "fixed" later: it
  proposed that `showStatus`'s `rise` no longer needs dividing by `floaterTextScale` once `scale` is
  passed to `push`. It does: the rise moves `FloatingText`'s inner `rising` layer, which lives
  *inside* the scaled pop-up, so the division is what makes the text travel exactly one tile - the
  live probe measures the newcomer's lift position from that same local space.

**Fifth pass, 2026-09-15: refreshed against the installed 0.13.0.** Five releases landed after the
passes above - 0.9.1, 0.10.0, 0.11.0, 0.12.0 and 0.13.0, all on 2026-09-14/15 - and the pin was
bumped to `^0.13.0` on 2026-09-15 (`npm run mwg:check` reports the pin, installed and npm-latest
triple as `0.13.0` throughout). This pass re-derived the framework's surface from the installed
package itself - its 28 entry points, and the ~445 names its root barrel alone exports - against
what `src/` and `tools/` actually import: **68 distinct names**, every one an explicit named import.
There is no `import * as mwg` and no `export * from 'mwg…'` anywhere, so that count is complete
rather than a sample.

Adopted from the delta:

- **`audio.Sound.play(gain, pitch)` (new in 0.12.0), wired through `SpdAudio.cue(name, volume,
  pitch)`.** Java varies playback rate per *call site* (`Sample.play(id, volume, pitch)`), and every
  cue here passed none, so each hit and footstep played at one fixed rate. Two of this port's cue
  sites carry a real Java value: the hero's footstep, `Random.Float(0.96f, 1.05f)` (`Hero.java` 2055,
  the `STEP` branch) and the gold pickup, `Random.Float(0.9f, 1.1f)` (`Gold.java` 70 and
  `ItemSprite.java` 170). Java's plain `play(id)` rows default to 1, which is what every other cue
  passes - no site was given a value Java does not have. Java draws these from the run-level
  generator `Dungeon.init()` pushed; this port's in-play randomness is `mwg`'s `Random` (the
  `SimulationRandom` default), so the draws go there. **Browser-verified live the same day**: with
  `dist/` served on port 8000, a real pointer click on the tile beside the hero moved it and its
  pooled step element played at `playbackRate` 0.9700, 0.9813 and 0.9773 across three steps - all
  inside `0.96`-`1.05`, and unequal, which is the variance the Java range buys - at the cue's own
  volume 0.32; a real gold-heap pickup on the same floor played the gold cue at 0.9491, volume 0.6,
  which is the only cue carrying a value below 1 by design. The probe is an
  `HTMLMediaElement.prototype.play` wrapper rather than a DOM query: `mwg`'s pooled elements are
  never attached to the document, so `document.querySelectorAll('audio')` cannot see them, while
  the wrapper reads `playbackRate`/`volume` at the moment `Sound.play` sets them. That `dist/` was
  built as `npm run mwl:compile && npx vite build && node tools/emit.mjs`, since `npm run build`'s
  `tsc` gate currently fails on unrelated in-flight item work in the tree.
- **The same row's unported remainder, now written down rather than implied.** Java's stereo
  `play(id, leftVolume, rightVolume, pitch)` (`Sample.java` 111) has no counterpart in `mwg`, which
  says on `play` itself that a plain `<audio>` element has no pan to set - a framework-level
  non-expressible, not a port choice. The per-weapon hit machinery
  (`KindOfWeapon.java` 48-49, 267-268, `Hero.java` 409-414, `Char.java` 427's
  `Random.Float(0.87f, 1.15f)`) is collapsed by this port's single `hit` cue, and its two clips
  (`atk_crossbow.mp3`, `atk_spiritbow.mp3`) are bundled and never cued. Java's terrain-selected
  footstep clips (`Hero.java` 2036-2057: `WATER`, `STURDY`, `GRASS`/`TRAMPLE`, else `STEP`) are not
  selected here - this port plays `step` on every terrain, and so takes that clip's own range.
- **Nothing else in the delta applies.** `tools/single-file.mjs` (0.10.0, plus 0.11.0's brotli) and
  `tools/compress-dist.mjs` (0.4.3, long-shipped but never dispositioned before) are the framework's
  answers to this port's open "build every packaging target" roadmap item and its 27 MB
  uncompressed `game.js`; they are recorded on that item as its own work rather than adopted here.
  `compileResources`'s `toWebp`/`webpLossless`/`webpQuality` (0.11.0) is unreachable through this
  port's Vite inlining (the `assets` row above), so it is a no-op here, not a candidate.
  `rpg.MoveRouteRunner`/`GridMover.jumpBy` and `EventRunner`'s `portrait` (0.12.0) belong to the
  `rpg` map-event interpreter this port does not use. `rpgmAutotileFrame`/`RpgmAutotileAtlas`
  (0.9.1) is RPG Maker MV's own atlas encoding rather than `DungeonTileSheet`'s mask atlas, so it is
  not a drop-in for `visualWalls.ts`'s hand-coded table - named here so the next pass does not
  re-derive it.

**The dialogue question, settled against real Java instead of assumption (correcting the previous
pass's "inapplicable").** 0.13.0 adds `core.parseDialogueLines`/`parseTwee`, the `two-d/stage` and
`rpg` wrappers around them, and `rpg.EventRunner.runStory`/`EventCommand.goto`. The previous pass
dismissed the family with "SPD's NPC dialogue is code ... nothing for the interpreter to run",
which conflated the *interpreter* with the *text*. A survey of SPD's own conversations settles it:
across ~30 conversations in `actors/mobs/npcs/*` and the `Wnd*` windows, **not one exceeds two
distinct speakers, and none interleave A,B,A** - the narrative bodies fit the simple `@id`/`-`
format completely, and every branch point is a *script-selection* decision (quest stage, hero class,
inventory) that the format delegates to its host by design. What does not fit is the *choice* half,
for four concrete reasons: option sets built at runtime from inventory/prices with per-option
enable/icon state (`Shopkeeper.java` 170-218, `WndTradeItem.java` 72-160); choices that are item
pickers rather than text (`WndSadGhost.java` 89-95, `DriedRose.java` 882/948, `WndBlacksmith.java`
90, `WndResurrect.java` 73/84, `WndWandmaker.java` 105); four conversations with two choice points
each; and choices that re-enter the conversation (`RatKing.java` 143-146) or where dismissing the
window *is* the action (`Blacksmith.java` 93-108). So the simple format is sufficient for this
game's narrative half, the choice half is host-owned UI this port already has (or
`EventCommand.ask`/`goto`), and `two-d/stage` is a real adoption path rather than a non-applicable
module. Recorded, not done: re-authoring every NPC conversation is a project, not a pass.

**A wrong claim this pass corrects.** Finding 2 above measured "25 files import `pixi.js` directly"
and called the conversion "not done here ... a 25-file mechanical change". It is done:
`rg -l "from 'pixi\.js'" src` returns **0**, and 22 files import `mwg/two-d/pixi-interop` instead -
so `SPD_ARCHITECTURE_TARGET_V3.md`'s "all 21 direct `pixi.js` imports previously under `src/` now use
that facade" was the accurate claim of the two. Corrected here rather than deleted, because a stale
"not done" instruction is exactly what sends the next reader to redo finished work.

**Never dispositioned by any pass, now named** (the surface diff's own output; each is unchecked,
not endorsed). In `roguelike`: `MonsterAI` (a wander/hunt/flee loop), `Secrets`/`Doors`/`Elevation`
(one sidecar state shape), `Stealth`, `TriggerTracker`, `MultiStageAbility`, `Combat`,
`ContentRoll`, `DungeonParity`, `Level`/`generate`/`RoomBuilders`/`Features`/`Placement`. In
`core`: `Spawner`, `Replay`, `ActionJournal`, `UndoHistory`, `Collection`, `Telemetry`, `SyncGuard`,
`Hex`, `Loading`. SPD has secret doors, doors and a stealth mechanic, so `Secrets`, `Doors` and
`Stealth` are the three worth an actual read; the rest are named so a later pass starts from a list
rather than a guess.

**Tooling, found while verifying this pass (not framework).** `tools/emit.mjs` resolved `mwg`'s
packaged `classic-html.mjs` from `node_modules/@datamoc/mw_games/...`, a directory that only ever
existed as a leftover from an older install layout - the `mwg` alias installs the package at
`node_modules/mwg`. The 0.13.0 install pruned the leftover, and `npm run build`'s final step died
with a bare `ERR_MODULE_NOT_FOUND`. It now resolves from the alias, with the old path kept as a
documented fallback. Worth recording because `npm run build` is part of this file's own bar and had
quietly stopped working: `npm run check` does not run it, so a bump verified with `tsc`/`check`/the
suites alone cannot catch it.

**Sixth pass, 2026-09-15: refreshed against the installed 0.14.0.** The pin was bumped to `^0.14.0`
the same day (`npm run mwg:check` had flagged it: pin `^0.13.0`, installed 0.13.0, npm-latest
0.14.0). The full bar was re-run on the new release - `tsc`, every suite, `npm run build` - and the
release path was exercised end to end rather than assumed, since 0.14.0's changes land squarely on
this repo's tooling: `npm run release:web` and opening the rebuilt standalone HTML from `file://`
(the title screen renders; a compiled `dist/index.html` is not evidence for a *packaged* one).

Adopted from the delta:

- **`./tools/classic-html`, `./tools/extract-html` and `./tools/single-file` gained real `exports`
  subpaths** (item 358), so the two workarounds above are gone: `tools/emit.mjs` imports
  `mwg/tools/classic-html` by specifier and `tools/pack-web.mjs` loads `mwg/tools/single-file` and
  `mwg/tools/compress-dist` the same way, with no `node_modules` path literal left in either. This
  is the fix for the exact failure the fifth pass recorded, and the changelog names the failure mode
  this repo was in - a package installed under an npm *alias* lives at `node_modules/<alias>`, so a
  hardcoded `@datamoc/mw_games` path silently stops existing. `mwl` deliberately keeps no subpath
  (it reads its arguments and dispatches at import time); this port never imports it, so nothing
  here is affected. Both consumers were verified by running them, not by reading the exports map.
- **`single-file`'s `output` is now documented and enforced as a file *name* inside `dist`** (item
  359), refused with a named error when it contains a separator. No port-side change was needed -
  `tools/pack-web.mjs` already passed a name and already documented why - and `compress-dist.d.mts`
  now states what that pass had to infer: the `dir` handed in is rewritten in place, which is why
  the port compresses a *copy* (`dist/` itself stays free of `.gz`/`.br` siblings, which also keeps
  the Capacitor asset merge clear of the `Duplicate resources` failure 0.14.0 documents).

Available but deliberately not adopted:

- **`core.cellInside`/`cellIndex`/`cellX`/`cellY`/`cellKey`/`cellFromKey`** (item 361) - the
  framework's new shared statement of the row-major convention, added after four of its own modules
  were found carrying private copies. This port has the same duplication (`spdLevelGen`'s raw
  `y * w + x` arithmetic, `dungeonScene`'s `level.index`, the boss-stamp cursors), but adopting it is
  a mechanical refactor across ~10 modules with no behavioural change to verify, and a version bump
  is the wrong place to make one: recorded here as a candidate so a later pass starts from the list.
- **`Game` now clamps the renderer's resolution to the device's `MAX_TEXTURE_SIZE`** (item 360),
  warning when it does - a framework fix for a silently-clamped WebGL backing store, which is
  Android-relevant for this port's Capacitor target. Nothing to do here; noted because it is a fix
  this port would otherwise have had to find.

**Not re-verified by this pass**: the Android APK and the WebView2 desktop build. Neither depends on
0.14.0's changes (this repo's `dist/` carries no compressed siblings, and the framework's host change
- loading the page named as its first argument, item 357 - is a generality improvement this repo's
already-adapted copy does not need), but they were last built against 0.13.0 and are stated as such
rather than implied green.

### Browser verification: done, and what it took

**A ported Sewers floor 1 now renders and plays.** Confirmed from a screenshot of the built page
opened at `file://`: real rooms and corridors, brick walls and floor at the right tiles, a door
sprite, the hero and a marsupial rat drawn on it, the FOV's lit region bright against the dimmer
remembered one, and a message log reading "You open the door." / "A marsupial rat hits you for 0."
- so terrain, doors, spawns, FOV and turn resolution are all working off the ported grid.

Getting there turned up a bug that had nothing to do with level generation, and had been
black-screening the whole game regardless of it: **`registerColorTransform` was never called.**
mwg's commit `0bbf241` ("decouple core from render") stopped `Game` registering its own render
extensions and moved that to `GameOptions.extensions`; this project was written against the older
mwg and never updated. Pixi only accepts a custom render pipe registered *before* the renderer is
created, so it cannot be done lazily on first use - and every `TintedSprite` here (hero, monsters,
items, both staircases) draws through that pipe. The first frame drawing one threw
`renderPipes[renderPipeId] is undefined` inside Pixi's render-group walk and killed the renderer.
`new Game({ extensions: [registerColorTransform] })` is the fix.

Two lessons worth keeping, both already written into `CLAUDE.md` and ignored on the way in:

- **`node_modules/mwg` is a symlink to the live `MW_games` checkout**, which can hold another
  session's uncommitted work. Check its commit once per session *before* trusting its API. That
  check would have found this immediately instead of after a long hunt through the level port.
- **A canvas game that throws during start-up looks exactly like a rendering bug in whatever was
  changed last.** Structural checks all passed and the generated data was provably sound, which is
  precisely why the failure was misattributed. `index.html` now carries a `window.onerror` overlay
  that prints the exception and stack onto the page, so a black screen states its own cause; note
  that at `file://` the browser sanitises the message to "Script error." and the real text is only
  in the devtools console.

`tools/scratch/checkBridge.ts`'s structural pass above remains the cheap regression check; the
visual pass is what it cannot replace.

Still not visually checked: the deeper ported floors (2-4, 6-9) and the degraded tiles in the
mapping table below - `CHASM` in particular, which now keeps its raw pit frame while using open
collision for hero/FOV behavior.

## UI and presentation (`ui/*`, `windows/*`, `scenes/GameScene.java`, `effects/*`)

Until this section existed, the whole in-game interface was **two `Label`s**: one ~300-character
status line that concatenated place, seed, level, HP, four stats, gold, waterskin, hunger, a
comma-joined list of buff keys, wand charges, ammo, *the entire bag as text*, and a literal
keybind cheat-sheet - plus a five-line log in one dim colour with no wrapping. Combat fed back a
single white frame-flash and nothing else. None of that gap was recorded here, so every row below
was previously an undocumented omission rather than a stated one.

**Correction, from a reimplementation audit against the current `MW_games` checkout:** this
paragraph previously claimed `Button` was implemented port-side because `mwg/ui` lacked one.
That was already wrong when written - `Button` has only ever come straight from `mwg`
(`import { ..., Button, ... } from 'mwg'` in `main.ts`; there is no `src/ui/button.ts`), and
this port even contributed `Button.resize()` upstream into `mwg` itself rather than
reimplementing around the gap. The real port-side widgets are `src/ui/bar.ts` and
`src/ui/floatingText.ts`, written game-agnostically under the same "could move into `mwg`
later" intent - but `mwg` has since grown its own `Bar` and `FloatingText` too (again, version
drift: `mwg` is a local dependency, and its exported surface must be re-checked, not assumed,
each session - see this file's CLAUDE.md). Neither is a safe swap: `mwg`'s `Bar` cannot take a
texture fill or reproduce `HealthBar.layout()`'s ceil-to-pixel rounding, both load-bearing for
this port's own verified real-Java-parity claims (see "Verification" below); `mwg`'s
`FloatingText` fades linearly over its whole lifetime with no per-target stacking, not the real
Java curve this port's own version reproduces. Both `src/ui/bar.ts` and `src/ui/floatingText.ts`
now say this directly in their own header comments, rather than pointing at a promotion that
would be a regression if taken today.

| Java block | TS destination | Status |
| --- | --- | --- |
| `Chrome.Type.WINDOW` = `NinePatch(chrome.png, 0, 0, 20, 20, 6)`, `Window.TITLE_COLOR`, `CharSprite`'s status palette | `src/ui/spdTheme.ts` `applySpdTheme`, called from `main()` before any widget exists | Ported - the real 20x20/border-6 region and the real colours, so every `Window`/`ListView`/`IconGrid` built later inherits SPD's frame |
| `PixelScene.pixelFont` / `RenderedTextBlock` (SPD's bitmap fonts in `assets/fonts/`) | `pixel_font.ttf` + `loadSpdFont()`/`applySpdTheme()` | Ported through SPD's supplied scalable pixel-font face: it is bundled, registered as `SPD Pixel` before any UI is built, and selected by the global UI theme. System fallbacks remain after it for translations whose glyphs are not in the Latin face. |
| `ui/GameLog.java`'s severity colours (`GLog`'s `++`/`--`/`**`/`@@` -> `CharSprite.POSITIVE/NEGATIVE/WARNING/NEUTRAL`), same-colour merging, and dropping the oldest block by *line* count | `src/ui/gameLog.ts`, `say(line, level)` | **Divergence (deliberate)**: severity colours and dropping the oldest block by line count are ported, but Java's same-colour concatenation is not - each message stays its own block so rapid messages remain readable as separate lines, at the cost of the vertical space Java saves by merging. Severity is also an argument rather than a prefix encoded into the string and parsed back out, and `MAX_LINES` takes the larger 5 since this port has no `SPDSettings.interfaceSize()` |
| `GLog`'s severity at each message site | ~106 of 142 `say()` calls tagged | Simplified - the calls where colour carries information (damage taken, deaths, pickups, heals, hunger, boss turns) are tagged; the rest default to `info`. Multi-line `say(` calls are untagged |
| `effects/FloatingText.java` (`LIFESPAN = 1s`, `DISTANCE = DungeonTilemap.SIZE`, alpha held to half-life then linear), `CharSprite.showStatus` | `src/ui/floatingText.ts`, `showStatus`/`showDamage`/`showHeal`, spawned at 19 damage/heal sites | Ported (timing, rise distance, fade curve, `CharSprite` colours). Simplified: Java stacks texts per-target via a `key`; this stacks by proximity, so it needs no key bookkeeping from callers |
| `Buff.java`'s `announced` flag (buff name shown over the creature as it lands) | `announceBuff` hook + `ANNOUNCED_BUFFS`, called from `addBuff` | Simplified - a hook, because `addBuff` is module-level with ~60 call sites none of which hold a scene. The announced set is chosen here rather than read from a per-buff flag this port's buffs do not have |
| `ui/HealthBar.java` (`COLOR_BG 0xCC0000`, `COLOR_HP 0x00EE00`, fill rounded up to a whole pixel) and `ui/CharHealthIndicator.java` (`width*4/6`, offset `width/6`, 2px above the sprite, shown only while `HP < HT`) | `src/ui/bar.ts`, `refreshHealthBars` | Ported (colours, geometry, visibility rule, and the ceil rounding that stops a sliver of health vanishing). The port has shielding mechanics; only Java's exact shield-overlay sprite treatment is absent. |
| `ui/Compass.java` - `atan2(cell.x - centre.x, centre.y - cell.y)` (note the argument order: 0 degrees is up), `RADIUS = 12` pivot, hidden until the target is `visited`/`mapped` and never hidden again | `src/ui/compass.ts` | Ported, using `Icons.COMPASS`'s real 7x5 region at (16,72). It points at `exit()`; Java points at `entrance()` instead once the Amulet is taken, which this port does not model |
| `SewerLevel.addSewerVisuals`/`Sink`, `Level.java`'s generic `tileName`/`tileDesc` plus every region's own `*Level.java` overrides (`Sewer`/`Prison`'s `water_name`/`empty_deco_desc`/`bookshelf_desc`; `Caves`/`City`/`Halls`'s own `water_name`/`grass_name`/`high_grass_name`(+`_desc`)/`entrance_desc`/`exit_desc`, each checked directly against its real class - see `examineWaterName`/`examineGrassName`/`examineHighGrassName`/`examineEntranceDesc`/`examineExitDesc`'s own doc comments for exactly which regions override which key) | `src/ui/wallDecorations.ts`'s `WallDecorationLayer`, `examineTile` + a new `L`/"Look" action (`main.ts`) | Ported for all five regions, not just Sewers/Prison - a decorative particle emitter (Sink's real blue-green falling droplets, `pour(factory, 0.1f)`, colour/size/lifespan/gravity all real; City's `Smoke` likewise, see the City section above) at every real `WALL_DECO` cell `sewerPainter.ts`/`prisonPainter.ts`/`cityPainter.ts`'s already-verified decoration passes place (Caves has no such particle - its own `WALL_DECO` is an undecorated ore vein; Halls has no `WALL_DECO` particle either, but gets its own unconditional `WaterEmberLayer` over every `WATER` cell instead - `HallsLevel.Stream`/`FireParticle`, see the Halls section above), visible only in the hero's current FOV like Java's own (`heroFOV`-gated `Sink`/`Torch`/`Smoke`/`Stream`); and a free "Look" action reading the real per-tile name/description text for all eight of this port's coarse terrain kinds. `water_name`/`grass_name`/`high_grass_name`(+`_desc`)/`exit_desc` work on every depth regardless of generator, since they only need `regionForDepth` and (for `exit_desc`) `this.stairs`, both tracked unconditionally; `ENTRANCE`/`EMPTY_DECO`/`BOOKSHELF`/`WALL_DECO`/`STATUE`/`STATUE_SP`/`EMPTY_SP` (and `Sewer`/`Prison`/`City`/`Halls`'s overrides for them) stay ported-floor-only, resolved from the ported floor's own raw, retained `PaintLevel` grid, since the coarse kind system otherwise collapses them into indistinguishable `wall`/`floor`. Not reproduced: `Sink`'s own real second half, a ripple on the water tile below it (`GameScene.ripple()`) - this port's water tiles have no ripple system; `Torch`'s real soft radial-gradient `Halo` is a plain low-alpha filled circle instead; Caves gets no `Sink`/`Torch`/`Smoke`/`Stream`-equivalent decoration at all, since without a matching real particle there is no real placement data to draw one from, and inventing one would violate this file's own no-undocumented-invention standard. New real SPD keys extracted via the normal `npm run i18n` pipeline (189 keys total now, up from 167) - see `levels.level.*`/`levels.sewerlevel.*`/`levels.prisonlevel.*`/`levels.caveslevel.*`/`levels.citylevel.*`/`levels.hallslevel.*`. One real bug caught and fixed in the same pass: the first draft used a computed template-literal key (`` t(\`levels.${region}level.water_name\`) ``) for the per-region lookup, which `tools/i18n-extract.mjs` cannot see (it only scrapes literal `t('...')`/`t("...")` string arguments) - the key would have silently resolved to nothing and printed the raw key text in play. Rewritten as explicit per-region literal calls, one per real Java override, verified by directly diffing each region's actual key list against its own `*Level.java` rather than assumed |
| `GameScene`'s in-game menu (`WndGame`), `GameScene.showBanner`/`Banner` (Java's `bossSlain()` and `gameOver()` banners - *not* level-up/quest banners; v3.3.8 has none of those), and `ui/Toast.java` | `main.ts`'s `openGameMenu`/`onAction`/`menuCanOpen`, `src/ui/portWindows.ts`, `src/ui/badgeBanner.ts`, `gameLog` + the action-bar `hintLabel` | **Menu ported 2026-09-12, checked against tag `v3.3.8`; the other two parts remain as follows.** `WndGame` reproduces Java's real entry list and geometry - note the roadmap's earlier paraphrase of this row was wrong and is corrected here: Java has **no** continue/save/journal/badges entries, only Settings (`Icons.PREFS`), Challenges *when the run carries any* (`Dungeon.challenges > 0`, `Icons.CHALLENGE_COLOR`), Start + Rankings *only once the hero is dead* (`Icons.ENTER`, tinted `Window.TITLE_COLOR`; `Icons.RANKINGS`), and always save-and-exit (`Dungeon.saveAll()` then `TitleScene`, `Icons.DISPLAY` picked by orientation) which Java *disables* while `SPDSettings.intro()` is true - here `entranceRoomContext.guideIntroRead`. `WND_WIDTH = 120`, `BTN_HEIGHT = 20`, `GAP = 2` and the menu closes itself before opening a sub-window, as Java's `hide()` does; the two sub-windows are the same ones the title screen shows (Java shares `WndSettings`/`WndChallenges`/`WndRankings` between scenes the same way), so `ui/portWindows.ts` now owns all five. Opened by the **back key**, not a bound `menu` action: Escape is MWG's own `cancel` (Java's `SPDAction.BACK`), and `GameScene.onBackPressed` is `if (!cancel()) add(new WndGame())` - so the port opens the menu only where nothing else consumed the action, which required the scene's `Input.onAction` listener to stop discarding its consumed flag (a returned `true` otherwise let `WindowStack`'s own listener close the window the same keypress had just opened). Divergence (deliberate): Java's `onBackPressed` runs whatever the hero is doing, this port waits for the turn to finish (`awaitingInput`) unless the hero is dead, because `saveRun` here would otherwise serialise mid-animation. Also ported with it: Java's per-`Window` full-screen blocker (`Window`'s `PointerArea` -> `onBackPressed`), which is what makes a click outside a window dismiss it - every `Window` construction site now passes MWG 0.8.0's native `blocker: true`
(the local `BlockingWindowStack` subclass this row used to name is retired). A toolbar entry (`windows.wndkeybindings.menu`) opens the same menu for pointer-only players, where Java has `MenuPane`'s and the game-over screen's own on-screen menu buttons. **Not reproduced**: Java's `WndGame` is reachable during an interlevel descent's scene too but does nothing there (`InterlevelScene.onBackPressed`), which this port matches by refusing while its curtain is up; and the game-over screen's `menu` `StyledButton` has no port counterpart (Escape and the toolbar entry are the paths). `Banner` is ported as `src/ui/banner.ts` + `src/ui/bannerState.ts`, checked against `v3.3.8` (and correcting this row's own earlier "missing widget" wording - `effects/BadgeBanner.java` is a different class from `ui/Banner.java`, a scale pop with plain alpha which `ui/badgeBanner.ts` already reproduces). Java's general `Banner` is the small colour-fade state machine this row described - FADE_IN lerps the tint towards `show()`'s colour over `fadeTime`, STATIC holds `showTime`, FADE_OUT fades alpha over `fadeTime`, then `killAndErase()` - and the port reproduces it exactly: `bannerState.ts` is the timing translation (proved headlessly by `tools/verifyBanner.mjs`, 7 checks including the `time >= 0` boundary and the infinite-hold `show(color, fadeTime)`), `banner.ts` is the one `TintedSprite` it drives (`lerpTint` is watabou's `Visual.tint(int, float)`, `resetColor()` is `Visual.resetColor()`). The art this row was waiting on is cut from Java's own sheet now: `src/assets/banner_boss_slain.png` (127x68, `BannerSprites`' `uvRect(0,157,127,225)`) and `src/assets/banner_game_over.png` (128x35, `uvRect(128,157,256,192)`), wired in `images.ts` - the port's own custom-redrawn `banners.png` bands are untouched. Wired at both real sites: `bossSlain()`'s `show(0xFFFFFF, 0.3f, 5f)` plus the real `boss.mp3` cue, gated on the hero surviving, playing out stage-level over the floor the port enters immediately (the way Java's plays over the game the player keeps); and `gameOver()`'s `show(0x000000, 2f)` infinite hold behind the defeat panel, whose alpha tracks the banner's squared - which is what Java's restart/menu buttons do (`alpha(pow(gameOver.am, 2))`). Stated simplifications: the menu button has no counterpart (the panel is a port invention; Escape/toolbar still open `WndGame` on a dead hero), and the alpha tracking covers the whole panel rather than the buttons alone. Browser-verified live 2026-09-12 (`tools/scratch/banner-livecheck.mjs`, 21 assertions, screenshots in `_browsercheck/mwgpd_shots_banner/`): both sites driven through their real code paths (Goo spawned and killed at depth 5 through `kill()`, which is where the `bossSlain()` lines live, and the hero killed through `kill(hero)`), asserting the art's own dimensions, the stage-level survival across the floor transition the slain band plays over, each phase's tint/alpha (`show()` armed untinted and invisible in the same turn the trigger ran; FADE_IN carrying colour with partial alpha; STATIC reset with a residual within one measured frame of 1), the defeat panel tracking the banner squared, the band's measured death at 5.2-7.0s after `show`, and - the part a state-machine test cannot state - pixel proof that the band changes the canvas underneath it (sha256 of the band's own screen rectangle, band shown vs hidden vs dead). **A real defect fell out of doing it, and is fixed**: the boss band is armed in the same frame this port builds the next floor synchronously, so the machine's first `update()` was handed a measured 233ms delta - a 0.3s fade-in reached STATIC frozen at alpha 0.78, visibly transparent where Java's sits at ~0.99 (Java never rebuilds a floor at a boss death; the player keeps playing). `ui/banner.ts` now clamps its own step to 1/20s (`MAX_STEP`, its comment carries the measurement), which puts the residual back at one normal frame's worth - 0.889 at the probe browser's ~42ms frames, i.e. Java's own situation on the same hardware - and is the deliberate divergence from Java's raw `Game.elapsed` this row records. (Also noticed while measuring: `src/assets/ui_banners.png` is byte-identical to `src/assets/banners old.png` and is imported by nothing - dead weight, left in place rather than deleted unasked.) `ui/Toast.java` is **not applicable as designed**: in v3.3.8 it is used *only* by `GameScene.selectCell()` to show the active cell selector's own `prompt()` - one bottom-centred toast whose close button cancels the selection - and this port's targeting is creature-based with no cell-selector prompt at all, so there is nothing for it to display; the message roles are `gameLog` and the toolbar's `hintLabel`. (Java-style transitions are the `InterlevelScene` row above.) Verified live (`tools/scratch/game-menu-livecheck.mjs`, 23 assertions across a fresh and an intro-completed profile: the title screen's eight buttons and its Support/Settings windows still work after moving into `ui/portWindows.ts`, Escape opens and closes the menu, the toolbar path opens it, an open window swallows movement keys, a click outside it dismisses it, Settings replaces the menu, and the exit entry is disabled until the intro is done, then saves and leaves). |
| `TitleScene.java` menu, `Chrome.GREY_BUTTON_TR`, title signs | `src/scenes/titleScene.ts`, `src/ui/spdButton.ts`, `src/ui/titleIcons.ts` | Ported: Java landscape/portrait button geometry, native icon regions including GOLD and PREFS, translucent button chrome, version footer, additive pulsing signs. Integer menu zoom is capped at 3; browser density/settings do not reproduce every PixelScene scale preference. |

| **Real bug, not a Java-parity gap**: `banners.png`'s title art was redrawn at some earlier point from real SPD's "SHATTERED"/"PIXEL DUNGEON" (preserved as `banners old.png`) into this port's own "MWG"/"Pixel"/"Dungeon" branding, but the redraw is three stacked lines instead of Java's two and was never re-measured against the frame rect that crops it - `title`'s `Rectangle(0,0,132,90)` clipped the bottom half of "Dungeon" clean off (confirmed by cropping the raw asset: the full 3-line logo needs 108px, and 90-108 bleeds into the next sprite, `BossSlain`'s sword, starting at y=109). Separately, the two flanking `TitleFlame` torches were hardcoded at the frame-centred x-offsets (22/110) tuned for the old asset's evenly-filled 0-131 width; the new asset's "Pixel" line (the one they sit level with) is narrower and left-shifted (x≈8-110, centre 59 vs the frame's own 66), so the right torch sat visibly farther from the letters than the left one. Found live via browser screenshot (both the crop and the asymmetry), not from a code read. | `src/scenes/titleScene.ts` (`title`/`signs` frame height 90→108, `title.position.set`'s centering math updated to match, torch offsets 22/110→15/103) | Fixed three ways, all confirmed live: (1) frame height raised to 108 so "Dungeon" renders in full with no bleed from the sword sprite below it; (2) torch x-offsets recentred on the "Pixel" line's actual glyph midpoint (59) instead of the frame's geometric centre (66); (3) since that glyph-centred offset moved the torches off true screen centre relative to the whole group, a `GROUP_X_OFFSET = 7` shifts `title`/`signs` (and everything anchored off `title.x`) right by the same 66-59=7px delta, so the torch/glyph-centred layout also lands the whole logo+torches composite dead-centre on screen (measured post-fix: composite centre x=538 vs screen centre x=539, a 1px difference at 1078px width). |
| Language selection | `ui/portWindows.ts`'s `showSettingsWindow` | Simplified: cycling languages is now inside Settings; the extra ninth title-menu button was removed to match Java. The full Java settings tabs are not ported. |

| `Icons.LANGS` on SPD's own real language-settings icon (`WndSettings`'s language row) | `titleIcons.ts`'s `langs` region (`uvRectBySize(80,32,14,11)`) applied to the title screen's language-cycle button, and to the same button relocated into the new Settings window | Ported - real pixel region, not invented placeholder art. Note this is SPD's own generic language icon, not a per-language flag: SPD ships no flag art at all (a language is not a country, and SPD's own UI never shows one) |
| **Real bug, not a Java-parity gap**: `btnSupport`/`btnRankings`/`btnNews`/`btnSettings`/`btnBadges`/`btnChanges`/`btnAbout` had no `onClick` at all before this pass - seven of eight title-screen buttons (everything except Play) did nothing when clicked, found from a user screenshot rather than a code read | `ui/portWindows.ts`'s `showInfoWindow`/`showSettingsWindow`/`showBadgesWindow` (extracted from `TitleScene`'s own private builders on 2026-09-12 so the in-game menu can open the same windows), a `mwg/ui` `WindowStack` pushed onto the scene | Fixed. Support/Rankings/News/Changes open a plain single-message `Window` with real, honest text (this port tracks no rankings and no news feed, and keeps no changelog - stated as such rather than inventing fake data); About shows the port's real version (`vite.config.ts`'s `define`, read from `package.json` at build time), license and attribution; Settings holds the real version plus the language-cycle button (moved off the main menu into here, alongside it); Badges shows a real `ListView` of this port's own `BADGE_DEFS` achievements with real locked/unlocked state and progress counts read from the same `Achievements` store a run writes to. None of `RankingsScene`/`NewsScene`/`ChangesScene`/`AboutScene`/`SupporterScene`/`WndSettings`/`BadgesScene`'s real Java layouts are reproduced - this is a bounded fix for "the button does nothing," not a port of those scenes |

| `ui/Archs.java` (`arcs1.png`/`arcs2.png` scrolling at `SCROLL_SPEED = 20`px/s, foreground at 2x, plus a right-edge dark gradient) | `src/ui/titleBackground.ts`'s `TitleBackground`, `main.ts`'s `TitleScene` | Ported - real byte-for-byte `arcs1.png`/`arcs2.png` art (renamed `ui_arcs_bg.png`/`ui_arcs_fg.png`), same scroll speeds, and the same 5-stop gradient alpha values (`0x00/0x22/0x55/0x99/0xEE`) as a `FillGradient` instead of Java's rotated 1px gradient image - a mechanical simplification, same pixels. This was an undocumented gap: the title screen previously drew a static placeholder grid instead, found by a user screenshot rather than a code read |
| `effects/Fireball.java`'s two title-screen torches (`placeTorch` at the title art's top corners) - spinning glow/flare, `Emitter.pour(..., 0.1f)` flame quads capped at `heightLimit`, `Random.Float() < Game.elapsed` sparks | `src/ui/titleFlame.ts`'s `TitleFlame`, `main.ts`'s `TitleScene` | Ported - real byte-for-byte `fireball.png` art (renamed `effect_fireball.png`), the same spawn rates, speeds/accelerations and the exact fade curve (`p > 0.8f ? (1-p)*5 : p*1.25f`) from `Flame.update`. Simplified: a small local particle array stands in for Java's shared `Emitter`/`PixelParticle` pool - same visible behavior, no shared particle-pool machinery. This was an undocumented gap: the two torches were entirely missing, found by a user screenshot rather than a code read |

| `ui/StatusPane.java` small layout: `NinePatch(status_pane.png, 0,0,128,36, 85,0,45,0)`, HP fill `(0,36,50,4)`, shielded `(0,40,50,4)`, EXP `(0,44,16,1)`, and `hp.scale.x = max(0,(health-shield)/max)` / `exp.scale.x = (width/exp.width)*exp/maxExp()` | `src/ui/statusPane.ts` | Ported (frame, bar rects, both fill formulas). The EXP fraction converts `mwg`'s cumulative `Progression` total back to Java's per-level `exp`/`maxExp()`, verified equal to `5 + lvl*5` |
| `ui/BuffIndicator.java` + `ui/BuffIcon.java` - 7x7 icons from `buffs.png`, indexed by `BuffIndicator`'s own constants, skipping `icon() == NONE` | `statusPane.ts`'s `BUFF_ICON` map, all 12 buffs this port models | Ported (real indices, incl. Monk `Focus`'s `MIND_VISION` icon and its green hardlight). Simplified: the row is rebuilt outright rather than tweened in and out with Java's `AlphaTweener` |

| `StatusPane`'s shielded-HP and raw-shielding overlay images | `src/ui/statusPane.ts`, `main.ts`'s `heroShield` | Simplified/ported behavior - shielded HP is rendered as a distinct remaining-health fill, with the raw shield amount exposed in hover stats; the exact Java overlay sprite art is not yet reproduced |
| `StatusPane` hero avatar and compass placement | `src/ui/statusPane.ts`, `main.ts` | Ported for starting cloth armor: HeroSprite avatar crop, level at (27.5,28), XP at y=0, compass centered on portrait. Simplified: avatar does not change with armor, and port-only stats appear on hover rather than in WndHero. WndHero, BusyIndicator, CircleArc and talent blinking remain unported. |

| `SPDSettings.interfaceSize()`'s `large` variants throughout (`StatusPane`'s 128x9 bars, `large_buffs.png`, `InventoryPane`'s wide layout, `GameLog`'s 5-line mode) | - | Not ported - one fixed interface size, so `large_buffs.png` is not even copied |
| The bag, itemised on screen | `InventoryWindow`, item-action windows, `itemDisplayName`, artifact definitions in `artifacts.mwl` | Simplified - it separates equipment from carried items, exposes affixes/curses, supports concrete weapon/armor/ring instances and activates food, potions, scrolls, rings and armor. MWL-authored artifact descriptions are now shown in the inspect detail. **Correction, 2026-09-14: "descriptions for the remaining item families remain unported" was stale.** `inventoryPanel.ts`'s `entry()` already resolves a real description for every family through `MWL_CONSUMABLE_DESCRIPTION_KEYS` (potions/scrolls/seeds/stones/food/bombs), `MWL_MISSILE_DESCRIPTION_KEYS`, `MWL_EQUIPMENT_DESCRIPTION_KEYS` (weapons/armor/wands/rings), and the artifact table, each backed by a real authored MWL row keying a real Java `.desc` message - a fallback chain checked in that order, with `context.itemDescription` free to override any of them first for dynamic per-instance text. Sub-bags remain the one genuinely unported half of this row. **Bug fix, 2026-09-15: the dedicated artifact equip-slot icon silently recognized only three ids.** `inventoryPanel.ts`'s slot lookup (`rows.find(...)`) and `inventoryWindow.ts`'s `category()` "equipment" tab test each hand-listed `cloak`/`hourglass`/`holyTome` (or `holytome`) only - a real, hand-maintained duplicate of the artifact id set that fell out of sync the moment `chalice`/`cape`/`toolkit` were wired into `generatedInventoryItem`'s generation switch: those three (and, this session, `beacon`) rendered correctly in the carried list but never took the dedicated slot icon or counted as "equipment" for the Gear tab (confirmed live in a browser before the fix - the slot showed empty, or an unrelated carried item, while a Chalice sat only in the general list). Fixed by deriving both checks from `getAllArtifactIds()` (`src/items/artifacts.ts`, itself sourced from `artifacts.mwl`) instead of a third hand-written list, so a future artifact only needs its one line in the generation switch to also get the slot/tab right. Checked the casing complaint this raised too: `inventoryWindow.ts`'s check compares an already-`.toLowerCase()`'d id against `'holytome'`, and `inventoryPanel.ts`'s compares the raw id against `'holyTome'` - each is correctly cased for its own comparison context, so the visual inconsistency between the two files was not itself a bug. |

| **Avoidable reimplementation, partly fixed**: the former bag panel hand-rolled its slot grid, category filtering, page tracking and unbounded layout | `src/ui/inventoryWindow.ts`, `mwg/two-d/ui`'s `TabbedList` and `IconGrid` | `TabbedList` now owns the filtered rows, page derivation and tab selection; `IconGrid` now owns the 5-column masked grid, keyboard navigation and highlight. The port retains its SPD-specific chrome, tab/page buttons, item metadata rendering and inspect-detail semantics. Pointer inspection is a small adapter because `IconGrid`'s built-in tap is intentionally reorder-oriented; it is kept on the item cell while keyboard confirmation uses `IconGrid.confirm()`. Full Java sub-bags and the remaining inventory-window chrome are still simplified. |
| `ui/Toolbar.java`'s discoverable action controls | `buildInterface`'s pointer/touch action bar | Simplified - eleven compact buttons route to the same turn actions as the keyboard bindings, including explicit wait and save/load; the bar wraps to two rows on narrow screens, while cell targeting, drag gestures and the full toolbar layout are not ported |

| `GameScene.java`'s cell selection for movement, `Hero.travel()`'s repeated movement | `handleMapPointer`, `stepTravel`, `travelTarget`/`travelStartHp` fields | **Player-reported bug, now fixed: clicking a distant tile previously always took exactly one step toward it, with no auto-walk at all** - a real, immediately-noticeable gap from Java's click-and-it-walks-there behavior, not merely a documented simplification. Now ported: a click beyond one step away queues the target and walks the real pathfinder's route (`this.pathfinder.find`, already used for monster AI) one step per turn via the existing `awaitHeroInput` hook, re-pathing every step so other creatures moving into the route are avoided. Interrupt conditions match Java's real "stop and let the player decide" cases - taking damage, or a hostile creature coming into sight - simplified to checking *any* such creature currently visible rather than Java's narrower *newly* seen one (a stated, safer-not-looser simplification); travel also cancels cleanly on arrival, when the path becomes unreachable, or on any manual keyboard action (so a stale queued travel can never silently resume after the player takes explicit control). Browser-verified live: a clear 3-tile click walked the full distance in a single call chain with zero further clicks, and a click issued with a hostile monster already in view correctly refused to take even one step, matching Java's real immediate-refusal behavior. Not ported: path preview (the visual line/highlight while aiming) and explicit non-adjacent cell/target selection for actions other than movement. |
| `ui/InventoryPane.java`, `windows/WndBag.java`, `windows/WndUseItem.java`, `ui/QuickSlotButton.java`, `scenes/GameScene.java`'s `CellSelector`/`selectCell`/`examineCell`, `journal/Document.java` + `WndJournal`, `ui/BossHealthBar.java`, `ui/Banner.java`, `ui/Toast.java`, `windows/WndGame.java` | `InventoryWindow`, `createJournalWindow`, `bossNameLabel`/`bossHealthBar`, `victoryPanel` | Simplified - the live bag now opens item actions, and the Journal exposes all five translated region documents plus live quest status. Detailed item-grid tabs, cell targeting, journal item-identification tabs and banner/toast animations remain |

| `ui/BossHealthBar.java`'s real `boss_hp.png` chrome | `bossChrome` + `bossHealthBar` (`main.ts`) | Ported - `interfaces/boss_hp.png` is copied byte-for-byte and rendered at integer 4x scale; the live HP bar occupies the Java frame's own `(15,3,47,4)` inset. Exact Java shield-overlay art remains unavailable. |
| `BossHealthBar.bleed()` (skull tints red + a blood `Emitter` turns on once `hp.scale.x < 0.25f`), and `bossInfo`'s click opening `WndInfoMob` | `refreshHealthBars`' edge-triggered `bossBleeding` + `bossHealthBar`'s `pointerdown` (`main.ts`) | Ported the low-HP cue and the click, simplified their form: Java's `update()` only re-tints on the boolean's *edge* (not a continuous flash), reproduced here the same way against `Bar.setFillColor`/`Label.setColor`; there is no skull icon or chrome to tint (`boss_hp.png` row above), so the whole bar/name flip to warning-red instead, and no blood-particle drip is spawned - a purely static colour cue, not Java's continuous emitter. The click has no `WndInfoMob` to open, so it logs the same name/HP line the bar already shows (`port.log.bossinfo`), matching the "detailed window -> log line" simplification `awardBadge`/`BadgeBanner` already uses |

| `scenes/InterlevelScene.java` (per-region `loading_sewers/prison/caves/city/halls.png`, plus `effects/ShadowBox.java`'s `shadow.png` drop-shadow under the hero) | `showInterlevel` (`main.ts`), called after `enterLevel` | Partially ported - the five original per-region loading textures are copied byte-for-byte and shown with Java's 5 px/s scroll, centred localized `DESCEND` caption, 0.33s gradient-curtain fades, and the slower first-floor/new-region timing. Input stays blocked throughout. The port generates synchronously, so it has no Java worker's static wait phase, mode-specific text/timing for ascend/fall/restore, or error/install handling. `ShadowBox` remains unavailable: the port has no matching separate hero-shadow effect. |
| `effects/BadgeBanner.java`'s graphical banner/icon (`interfaces/badges.png`, real `Badges.Badge.image`-indexed 16x16 grid), fade-in/static/fade-out at the real 0.25s/1s/1.75s timings | `src/ui/badgeBanner.ts`'s `BadgeBannerLayer`, `awardBadge` (`main.ts`) via the new `BADGE_ICON` map | Ported - real byte-for-byte art (`ui_badges.png`), the real `DEFAULT_SCALE = 3` pop-in/hold/fade curve and timings, queued rather than dropped when a second badge lands mid-animation. Simplified: shown at a fixed HUD position (top-centre) instead of anchored to the hero's world position, since there is no on-screen hero sprite position that reads well as a HUD element; the pixel-scanned "shine" highlight (`BadgeBanner.highlight`) is not reproduced. `BADGE_DEFS` is this port's own smaller, invented achievement set (not a 1:1 port of `Badges.Badge`'s ~120 entries), so `BADGE_ICON` approximates the closest real badge for two entries that have no exact Java counterpart (`death_trap` -> `DEATH_FROM_GRIM_TRAP`, `death_foe` -> `DEATH_FROM_ALL`'s generic skull); the text log (`port.log.badge`) stays alongside the banner rather than being replaced by it, which is a superset of Java's purely-visual toast, not a deviation from it |
| `Badges.Badge.BOSS_CHALLENGE_1..5` / `Statistics.qualifiedForBossChallengeBadge` (tag `v3.3.8`: set true at each of the five boss fights' starts, cleared when the hero deals boss damage that is not a plain weapon hit, read at that boss's death) | `qualifiedForBossChallenge` + `disqualifyBossChallenge` (`src/scenes/dungeonScene.ts`), `boss_challenge_1..5` rows (`src/content/badges.mwl`), the five boss-death `awardBadge` sites | Ported (2026-09-17; the behaviour landed earlier, this row closes the documentation gap that kept ROADMAP.md section 6's item open). Set at all five fight starts - Goo (floor-entry spawn and `checkSewerBossSeal`), Tengu (`checkTenguFightStart`), DM-300 (`checkCavesBossPylonGate`), the King (floor-entry spawn and `checkCityBossSeal`), Yog (`checkHallsBossSeal`) - and read at each boss's death in the shared boss-death branch. Cleared by every non-weapon damage source this port has: an unarmed hit without the Ring of Force equipped, any wand except Lightning, bombs (via `onNonWeaponBossDamage`), and armor-ability damage. Two stated deviations: Java's `ClericSpell` clearing clause has nothing to match (no Cleric spell system here), and bombs/armor abilities clear where Java's per-boss `damage()` overrides only name unarmed hits, wands and Cleric spells - both are equally non-weapon sources, so clearing is the faithful reading of the badge's weapon-only rule rather than a new restriction. The flag persists through save/load with the run. |

| `ui/TalentIcon.java`/`ui/TalentButton.java`'s real per-talent icon/button art (`talent_icons.png`, `talent_button.png`) | `talentPanel` (`main.ts`), `src/talents.ts` | Partially ported - per-talent selectable nodes, rank labels, tier gating and persistence are live; the original Java icon/button sprites and blinking selection treatment remain unported |
| `ui/MenuPane.java`'s in-game pause/exit menu chrome (`menu_pane.png`, `menu_button.png`) | `buildInterface`'s save/load toolbar buttons | Not ported - save/load exist as plain toolbar buttons already, so this is the missing chrome around functionality that does work, not a missing function. Found by asset audit |

**Verification.** `tools/scratch/uiCheck.ts` asserts 22 properties of the shipped widgets against
the Java formulas above, headlessly: `Bar`'s fill matches `HealthBar.layout()`'s
`ceil(health*pixelWidth)/pixelWidth` at six HP ratios (including that 1/300 still lights a whole
pixel, which is the point of Java's ceil); each level's span in `SPD_LEVEL_CURVE` equals Java's
`maxExp(lvl) = 5 + lvl*5`; `Compass`'s angle is 0/90/180/-90 for north/east/south/west, matching
Java's unusual `atan2(dx, -dy)` order, and its reveal latches on; and `applySpdTheme` really does
install border 6 and `Window.TITLE_COLOR`.

**`GameLog` is not covered by that script** - it measures wrapped text through Pixi's
`CanvasTextMetrics`, which needs a real canvas, so its merging and line-based trimming can only be
checked in a browser.

**Now actually looked at, via `chrome-devtools-mcp` (the extension bridge was unavailable this
session too, same CDP-direct fallback used elsewhere) - real screenshots, not just formula
checks.** Status pane: hero portrait, HP bar, and depth badge/label all render legibly at the
top-left; zooming the canvas 4x (CSS `transform: scale()`, since this tool has no per-region zoom)
confirmed the HP bar's fill edge is genuinely jagged pixel-by-pixel, not a smooth gradient -
matching the `ceil(health*pixelWidth)` formula this file's script-based check already confirmed
numerically. Coloured log: multiple real message colours observed in one session - orange
("Aucune porte ne sort de cette pièce...", a warning), yellow (the depth-entry line), white (a
plain hit/kill line), and green (an achievement-earned line) - all legible, correctly coloured,
and in the real French locale text. Boss health bar: forcing `depth = 5` (Sewers boss) and
spawning a `goo` at 20% HP made `bossChrome`/`bossHealthBar`/`bossNameLabel` all go visible
exactly as `refreshHealthBars()` intends (they're gated on `BOSSES[depth]?.kind` matching a live
creature, not just "a boss exists" - can't just set `currentBoss` directly, the very next
`refreshHealthBars()` call overwrites it back to `null` off that same depth check), with the
skull-chrome icon, a correctly-filled bar, and the real HP/maxHP text at the top-centre; the
25%-crossing "bleed" red tint fired as intended (the `fraction < 0.25` edge-detect this row's
formula section already described). Compass: invisible until `hasStairs`/`stairs` are set
(matching `Compass.java`'s own real gate), then a small correctly-oriented arrow appears at the
portrait's corner, pointing the right direction at 4x zoom. Inventory panel: opening it with a
mixed bag (potions/scrolls/gold/gear) showed a clean icon grid with quantity badges, not the
degenerate unbounded-height text-row layout the "avoidable reimplementation" row above once
described - matches Java's real `WndBag` shape closely enough to read at a glance, no overflow.
**Two widgets couldn't be caught on screen, and this is a genuine tooling limitation, not a
negative finding**: floating combat-damage numbers (`FloatingTextLayer`, constructed with a very
short `1/3`-unit lifetime) and the badge-banner pop-in both cycle fast enough that the round-trip
latency between triggering them via a script call and taking a follow-up screenshot reliably
missed them, even though the *triggering* logic was confirmed correct both times (the log line
for the badge award rendered correctly - "Haut fait obtenu : Slew Goo !" - and `showDamage`/
`showHeal` ran with no errors). Neither is evidence of a rendering bug; both would need a tighter
capture loop (e.g. a screenshot burst across consecutive frames) to actually see the widget
mid-animation, not just its aftermath in the log.

## Terrain and doors (`tiles/DungeonTileSheet.java`, `levels/*`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `WIDTH = 16`, `xy()`'s coordinate math, `FLOOR`/`ENTRANCE`/`EXIT`/`RAISED_WALL`/`FLAT_DOOR`/`WATER` cell indices | `TERRAIN_FRAME` | Ported |
| `stitchWaterTile()`'s bit order and its 16 real water tiles | `waterFrames` (`src/scenes/dungeonTileFrames.ts`) | Ported via a hand-rolled 4-neighbour dry/wet mask - SPD's real convention, computed directly rather than through mwg's 8-neighbour `BLOB_SHAPES`/`autotileFrames`. **Corrected 2026-09-13:** this row used to credit a `WATER_FRAMES` constant (`dungeonConstants.ts`) built from `BLOB_SHAPES` as the mechanism; that constant was imported into `dungeonScene.ts` but never actually consumed anywhere, dead since this repo's initial commit (`git log -S WATER_FRAMES` shows exactly one hit). Removed as dead code rather than wired up, since `waterFrames` already covers the real behavior and matches this row's own "quantized to 4-neighbour" description. |
| `Level.java`'s per-turn `WATER` hook: a non-flying char standing in water extinguishes `Burning` | The hero-turn `applyBuffDamage`/monster-turn branches, right after each side's own `tickBuffs()` call | Ported for both hero and monsters. Fetched `Level.java`/`Burning.java` to confirm the real shape: entering water forces one more `Burning.act()` (this turn's DoT already covers that) then detaches on the *next* check while still wet - collapsed here to an immediate extinguish once the current tick has landed, rather than reproducing that one-turn-late timing exactly. Gated on the hero's own `levitation` buff (this port's stand-in for `Char.flying`, per `fallThroughChasm`'s own comment); gated by `Creature.flying`, so Java's flying Bat/Bee/Elemental/Eye/Swarm/Ghost actors are exempt as well. The same real hook also force-ticks `Ooze`, not reproduced since this port has no distinct `Ooze` buff/stack model (folded into a stackless `corrosion` mechanic elsewhere) - a narrower, already-known gap, not newly introduced. |
| A level's real up/down staircases (`ENTRANCE`/`EXIT` tiles, one of each per regular floor) | `placeEntrance`, `placeStairs` | Ported |
| Doors: open/closed/locked state at room/corridor junctions (`FLAT_DOOR`) | `placeDoors`, `adoptPortedFeatures`, `bumpDoor` via `mwg/roguelike` `Doors` | Simplified - generic floors use one locked door keyed to `ironKey`; ported crystal doors now require the real `crystalKey`, while exact key-drop placement remains simplified |
| `Patch.java`'s cellular-automaton fill/smooth/correct algorithm, and regions' real water fill numbers | `patchGenerate`, `placeWaterPool`, `REGION_WATER` | Ported, including the 85%/90%-fill `WATER`-feeling variants for Sewers/Prison and the corresponding regional feeling fills; a defensive iteration cap is added, see the code comment. **2026-09-14:** `REGION_WATER`/`REGION_GRASS` (`genericDungeon.ts`) used to hand-duplicate the same five region rows `dungeon-rules.mwl`'s `regionPaintRules` table already authors for the real generator - both now read through the same `mwlPaintRule()` reader; verified value-identical for all five regions before switching. |
| `RegularPainter.paintGrass` + `HIGH_GRASS` split at both regions' real numbers | `placeGrass`, `REGION_GRASS` | Ported. Simplified: single-layer rendering (no `FLAT_HIGH_GRASS` overlay), no Huntress-only `FURROWED_GRASS`, no stealth interaction beyond wake radius. **Correction**: this row previously also claimed "no `GRASS_ALT`" - wrong, `terrainFrameAt`'s `alternate(2)` call on the `GRASS` branch already applies it (`>= 50` variance -> the common alt frame), and has since the same wall-rendering pass that added the wall alt below; see the corrected row two below |
| `HighGrass.trample()`: Huntress furrows, repeat-trample handling, and its naturalism-scaled loot odds | `trampleHighGrass`, `furrowedGrass`, `src/simulation/highGrass.ts` | **Ported for the Huntress-only `FURROWED_GRASS` state**: Huntress steps create and preserve the furrow; another hero clears it without drops. The state persists per floor. The Java `freezeTrample` re-entry guard is unnecessary because this port's item spawning cannot synchronously retrigger movement. **Corrected 2026-09-16: the dedicated furrowed visual *is* live, and only the flat layer stays coarse.** This row used to say the second half of that sentence - that the visual variant was not ported - and the frame table shows otherwise: `foregroundGrassFrame` returns Java's own cuts (`152`/`156` for `FURROWED_GRASS`, `151`/`155` for `HIGH_GRASS`, each with its `tileVariance >= 50` alternate), but nothing could reach the furrowed pair because `visualTerrainAt` answered the collapsed high-grass constant for both kinds. It now answers `30` for a furrowed cell, read from the `furrowedGrass` set the floor already persists and the trample path already maintains, so a Huntress's trampled grass draws its own art. Pinned by `verifyVault.mjs` (the four frame numbers, recomputed) and browser-verified live (`tools/scratch/furrowed-grass-livecheck.mjs`, 3/3). What remains, stated: the *flat* ground layer still uses one frame for both kinds (`terrainFrameAt` returns the shared grass frame where Java has a separate `FLAT_FURROWED_GRASS`). The compact live terrain keeps the high-grass collision/feature code while the saved state carries the raw distinction. **The two loot rolls are now Java's real, naturalism-scaled ones (2026-09-15)**, which the Sandals of Nature work entailed: this row's own "naturalism level 0" parenthetical was accurate only because the artifact that supplies the other levels did not exist here yet. `HighGrass.trample` derives a `naturalismLevel` from a carried pair (`0` with none, `-1` while cursed, `itemLevel()+1` otherwise) and gates its whole drop block on it, so seeds roll `1/(25 - 4*naturalismLevel)` (1/25 with no footwear, 1/9 at +3) and dew rolls `1/(6 - naturalismLevel/2)` (1/6 to 1/4), with a cursed pair suppressing *both* outright rather than merely scaling them. `trampleHighGrass` also charges the footwear on every trampled cell (`Naturalism.charge()`), from Java's own `if (!naturalism.isCursed())` branch - so a cursed pair banks no charge either, and the charge is independent of the drops only on a floor whose mining/vault override suppresses loot while the pair is worn uncursed. **The same pass corrected a real divergence here**: Java branches on `ArtifactBuff.isCursed()`, which is `MagicImmune == null && item.cursed`, so a cursed pair worn by an AntiMagic hero keeps the full loot scaling (while still gaining no charge) - this port was reading `cursed` alone and suppressing the drops in that case. **Corrected in the same pass**: the Nature's Bounty berry roll now runs *before* the two loot rolls, which is where Java draws it - the port had been rolling seed, dew, then berry, moving the whole stream for a Huntress carrying that talent. **And the GRASS-feeling dew halving is now actually live** (`if (Dungeon.level.feeling == Level.Feeling.GRASS) lootChance /= 2`): the option existed in `simulation/highGrass.ts` but nothing passed it, so a grassy floor rolled 1/6 where Java rolls 1/12 - `trampleHighGrass` now passes `this.portedPaint?.feeling === Feeling.GRASS`, and the port does roll `Feeling` per floor (`regularPainter.ts`). **Not ported, stated rather than hidden**: Java's two level-type overrides of `naturalismLevel` (a `MiningLevel` on the `FUNGI` Blacksmith quest suppresses loot on 2/3 of tramples via `Random.Int(3) != 0`; a `VaultLevel` suppresses it always) - the port's mining branch has no quest-type distinction and it has no vault-tester area at all; and `PetrifiedSeed`'s trinket multipliers (`grassLootMultiplier()`, `stoneInsteadOfSeedChance()`), since this port has no trinket system, leaving the base multiplier 1 and no stone-over-seed draw. |
| Ground items lying on the floor, picked up by walking onto them (`Level.drop`, `Item.doPickUp`) | `spawnGroundItem`/`pickupGroundItemAt`, `generator.ts`, `placeGroundItems`, `adoptPortedFeatures`, real `ItemSpriteSheet` frames | Ported for the current item catalogue - generated class, level, curse, quantity and instance ID survive as a concrete payload through floor saves and inventory; room placement and unsupported Java item families remain simplified, found potions/scrolls start unidentified, and one item per cell replaces stacking heaps |
| The Waterskin/dew-drop mechanic (`MAX_VOLUME = 20`, `collectDew`, `consumeDew`'s 5%-of-max-HP-per-drop heal) | `collectDewdrop`, `groundPickup.ts`, `quaffPotion`'s waterskin branch, `WATERSKIN_MAX` | Ported with UI simplification: collection and the 20-cap are real; a full, fully-healed Waterskin now refuses ordinary dewdrop pickup and leaves the heap in place, while entrance/exit cells force the one-drop consume path like Java; drinking computes Java's minimum drops-needed formula, preserves unused water, and applies the Warden Shielding Dew overflow cap. It remains exposed through the port's quaff action rather than a dedicated quickslot/window; Vial of Blood is unmodeled. |
| Traps (`ToxicTrap`, `BurningTrap`, `PoisonDartTrap`, `GrimTrap`, `ExplosiveTrap`, `ConfusionTrap`, `CorrosionTrap`, `ShockingTrap`, `StormTrap`) | `placeHiddenTraps`, `triggerTrapAt`, `applyTrapBlast`, live fire/gas/electricity blobs, `TRAP_KINDS` via `mwg/roguelike` `Secrets` | Ported for gameplay consequences - real damage numbers (depth-scaled where Java scales); explosive traps affect every nearby character with Java's 0.67 off-center multiplier, and toxic/burning/confusion/corrosion traps seed spreading gas/fire blobs. **Shocking/Storm traps ported 2026-09-17**: no direct damage (Java deals none either) - they seed Java's `Electricity` volumes (`10` over NEIGHBOURS9, `20` over the distance-2 flood) into a persisted `electricity` blob whose `evolve()` paralyses by cell charge and zaps `round(Random.Float(2 + depth/5))` on odd charges, with Java's own `ondeath` line on a hero kill (landed in the default `foe` death-badge bucket, which predates the blob). Stated skips: the LIGHTNING sound only. **Conduction ported (2026-09-17)**: `evolveElectricity` (`simulation/javaBlob.ts`, pinned in `verifySimulation.mjs`) reproduces `spreadFromCell` - full power into every 4-neighbour-connected water cell, then minus one per charged cell instead of the generic diffusion - wired through the blob `advance` branch against the real `WATER` terrain. The mob-marking half is live too (`markHazardArea`/`markHazardMob` on both trap branches, both trigger sides). **Not ported**: Java's heap wand-charging (`gainCharge(0.333f)` on ground wands/staffs) - ground wands here draw from the hero's shared charge pool and carry no per-heap fractional state to bank into. Exact gas/fire volume cadence, destructible terrain, and non-explosive trap projectile/area presentation remain simplified |
| **Depth-1/2 entrance-room tutorial seal (`SPDSettings.intro()`/`Document.ADVENTURERS_GUIDE`) was permanently on, every run, forever - a real user-reported bug, now fixed.** `entranceRoomContext.guideIntroRead`/`guideSearchingFound` (`entranceRoom.ts`) defaulted `false` and nothing anywhere ever set them `true` (confirmed by a whole-repo search) - so every single run, not just a genuinely new player's first one, sealed the depth-1 entrance room behind hidden doors (and depth 2 similarly), reported live by a player as "the first room has often only secret doors." Real Java seals this exactly once, permanently un-sealing the moment the player reads the relevant Adventurer's Guide page - normally within their first few minutes of their very first run. This port has no guidebook-reading interaction (a separate, already-documented gap - see `entranceRoom.ts`'s own comment on the guidebook item drop), so `main.ts`'s new `guideProgress` (`SaveSystem<{introRead,searchingFound}>`, namespace `spd-guide`, loaded once at scene creation and pushed into `entranceRoomContext`) treats the tutorial's real completion signal - successfully searching out the sealed door via `searchForSecrets` - as satisfied, and persists it permanently across runs, the same way a badge is. Browser-verified live: a fresh profile (no `localStorage`) still seals depth 1 (`secretDoorCells: 3`, matching a genuinely new install); after simulating the search-completion write and reloading, a brand new run's depth 1 has `secretDoorCells: 0` and real, visible perimeter doors (screenshotted). |
| **Entrance-room mob exclusion (`RegularLevel.createMobs()`'s `room != roomEntrance`) was not modeled on ported floors - monsters, including the roster's less-common entries, could spawn directly in the entrance room.** Real Java's mob-placement loop explicitly excludes whichever `Room` object is `roomEntrance` - an identity rule, not an index one, true on every floor including ported ones. This port's `populate()` previously reasoned "a ported floor's shuffled room order makes index 0 meaningless, so skip the index-0 exclusion there" - true as stated, but the conclusion drawn from it (every room becomes fair game) was wrong; the entrance room still needed excluding, just not by index. Fixed by finding whichever room actually contains the hero's spawn cell (true on both generic and ported floors, and the hero is still standing there at `populate()` time) and excluding that one from the room draw, replacing the generic-floor-only `index !== 0` check. Directly explains part of the same player report above (a snake was reachable inside the very first room). Browser-verified live: the entrance room (identified by containing the hero's spawn position) held zero monsters across two separate generated runs, both before and after the guide-seal fix above. |
| **`portStrings.ts` i18n audit: 45 EN / 47 FR keys were in real use via `t('port.*')` but had no matching table entry - the raw key string rendered in the log/UI in their place.** A script (walk every `.ts` file, collect literal `t('port.…')` call sites, diff against both `PORT_STRINGS_EN`/`PORT_STRINGS_FR` objects) found the gap; this is not a translation-completeness gap Java has any equivalent of, purely this port's own wiring bug. Covered nearly every category: window titles/bodies (About/Badges/Changes/News/Settings/Support), the victory/defeat result screens, the talent-selection header/tier label, `port.action.bag`, and ~20 combat log lines (`bossinfo`, `grim`, `lucky`, `kingbarrier`, `spinnerweb`, `yogbeam`/`yogfistslam`, `tengutraps`, `gladiatorcombo`, `talentexecute`, `talentspent`, `armorabilitychosen`, `wandequipped`, `shield`, `deathboss`/`deathfloor`, `descendboss`, `queststatus`, `port.name.cursed`, plus the French-only `entanglement`/`potential`). All 45/47 now fixed and reconfirmed by rerunning the same audit script (0 missing in either locale). Browser-verified live: the About and Badges title-screen windows both render real translated text and a working "Fermer" close button, not raw keys. **Two further French-specific corrections a player caught live, unrelated to the missing-key audit itself**: "bolt" (`port.log.bolt(mis)ses`/`bolthits`, the DM100/Shaman/Necromancer/SpectralNecromancer/Warlock/Elemental/YogFist ranged zap - every caller of `zapHero`) was first mistranslated `trait`, then miscorrected in this same file's earlier revision to `carreau` (a crossbow bolt/quarrel) - wrong either way, since **every single creature that uses this line fires a magical bolt/zap, not a physical projectile at all** (confirmed by reading `zapHero`'s own callers: DM-100's lightning, the Shaman's/Necromancer's/Warlock's magic bolt, the Elemental's zap, YogFist's magic bolt - none of them a crossbow). The user caught this directly and it is now `éclair` (a flash/bolt of light or lightning - the correct term for a magical zap), matching the sole real physical-projectile case (the GreatCrab's generic parry line, which blocks *any* projectile including these magical ones) staying the deliberately generic `projectile` rather than either the crossbow- or lightning-specific word. Both bolt-hit lines were also restructured subject-first ("{who} vous rate/touche avec un éclair...") to avoid the grammatically broken bare "de {who}" the previous phrasing used, which reads fine only for a proper name and not for the common-noun-style monster/class names `{who}` actually holds (French needs "du"/"de la"/"de l'" article agreement a bare `{who}` can't supply). Live-reconfirmed with the corrected wording: "DM-100 vous touche avec un éclair pour 2." **Follow-up, same session: the deferred dynamic keys were checked and were just as broken.** Manually enumerating `SUBCLASS_OPTIONS`/`ARMOR_OPTIONS`'s 12 possible ids (`berserker`/`gladiator`/`battlemage`/`warlock`/`assassin`/`freerunner`/`sniper`/`warden`/`champion`/`monk_sub`/`warding`/`arcane`) found all 12 missing from both locales too - the entire subclass/armor-ability choice window (shown to every class at level 13, and again at 21 for the armor ability) was rendering raw ids like `port.subclass.berserker` instead of a class name. All 12 added in both locales. Browser-verified live: forcing the subclass-choice panel open showed real buttons reading "Berserker"/"Gladiateur", not raw keys. |
| `Hunger.act()` (`actors/buffs/Hunger.java`): `HUNGRY = 300`, `STARVING = 450`, `STEP = 10`, crossing into STARVING deals an immediate `hero.damage(1,this)`, then `level` freezes and `partialDamage += STEP*HT/1000` every turn, applying `(int)partialDamage` (with carried fractional remainder) whenever it exceeds 1 | `simulation/hunger.ts`'s `advanceHunger` (`hungerStep`/`hungerPartialDamage` on `main.ts`), `eatFood` | **Ported exactly**, correcting this row's earlier claim. The port previously modeled starvation as a flat `max(1, round(maxHp/100))` damage tick once every 10 starving turns - a guess, not a translation of the real formula, and roughly half Java's real rate at low max HP (e.g. HT=20 takes 1 damage about every 5 turns in Java, not every 10). `advanceHunger` now reproduces `partialDamage`'s real fractional accrual and carry-over, the immediate 1-damage-on-crossing, and the fact that `level` itself stops climbing once starving (Java's `isStarving()` branch never reassigns `level`) - previously this port kept incrementing hunger every starving turn via a separate tick counter, which the real Java never does. The `onhungry`/`onstarving` log lines now fire from the same `newLevel` crossing check Java uses rather than persisted "warned" flags (removed from `HungerState`/saves - crossing is naturally self-gating). Simplified: no attack-delay/accuracy penalty while hungry (Java has none beyond the log line either), no exhaustion beyond HP damage. |
| `Barrier.act()` (`actors/buffs/Barrier.java`): `partialLostShield += min(1, shielding/20)` every turn, `absorbDamage(1)` and a hard reset to 0 once it reaches 1 (bigger shields decay faster; `incShield`/`setShield` reset the accumulator on every top-up) | `main.ts`'s `barrierPartialLoss` field, applied in `spendHeroTurn`'s `applyBuffDamage` hook against `heroBarrier` (`mwg/actors`' generic `Actors.Barrier`) | **Ported**, closing a real "Not ported" gap: `heroBarrier`'s decay was never invoked at all before this - `Actors.Barrier.advance()` existed in the framework but nothing in `main.ts` ever called it, so every hero shield (Barrier proc-family grants, Blocking, talent shields) held its value indefinitely once granted instead of draining on its own. The proportional curve and the discard-not-carry reset semantics (`partialLostShield = 0`, unlike `Hunger.partialDamage`'s carried remainder) are both reproduced. Simplified: this port pools every shield source into one flat `heroBarrier` rather than separate typed `ShieldBuff` instances. **`Blocking.BlockBuff`'s own distinct fixed 5-turn cliff-edge expiry is now approximated too**: fetched `Blocking.java`/`ShieldBuff.java` to confirm the exact mechanics - `BlockBuff.act()` decrements a private `left` (starts at 5, reset to 5 by every `setShield()` call, i.e. every fresh proc) by 1 per turn and `detach()`es outright at `left<=0`; `ShieldBuff.setShield()` itself only raises the shield to the higher of old/new (never additive), unlike this port's existing `grantHeroShield`, which stays additive as a pre-existing, unchanged simplification. A side counter pair, `blockingShieldLeft`/`blockingTurnsLeft` (persisted with the run, reset alongside `heroBarrier.clear()`), tracks only the portion of the pooled `heroBarrier` attributable to Blocking and ticks down in the same `applyBuffDamage` hook as the proportional curve above; hitting 0 force-`absorb()`s whatever of that tracked amount the pool still holds (clamped down first, since the proportional decay or ordinary damage absorption may have already eaten into the same shared pool - this port has no priority-ordered per-source draining to keep them truly separate, so the tracked amount is only ever an upper bound). Every fresh Blocking proc resets the timer to 5 and adds its granted amount to the tracked total, matching `setShield()`'s own always-refresh behavior. Browser-verified live: seeding `heroBarrier`+`blockingShieldLeft` at 20/5 and stepping `spendHeroTurn()` seven times showed the pool falling via the ordinary proportional curve on turns 1-4, then dropping to exactly 0 on turn 5 regardless of how much the proportional curve had left standing; a mid-countdown top-up (simulating a second proc at turn 1-of-2) correctly reset the counter to a fresh 5 and pushed the forced expiry out to the new turn 5, matching real Java's `setShield()` refresh. **Reworked this pass to Java's real two-buff shape, closing both "still not modeled" gaps above**: auditing the 2026-09-09 MWG-utilization note (which suggested layering Blocking over the shared pool via `Barrier.add`) against `ShieldBuff.java` showed the pooled model had three real bugs, not one simplification - repeated procs stacked additively where `setShield()` keeps the max, the proportional decay nibbled a shield `BlockBuff.act()` exempts from it entirely, and drain order was recency rather than `shieldUsePriority`. Blocking now owns a separate `blockingBarrier` pool, drained before Barrier's own pool in `absorbHeroDamage`; the proportional accrual base is the Barrier pool only; `grantBlockingShield` keeps `max(current, proc)` and always resets the 5-turn timer), persisted as `blockingBarrierState` with a load-time carve-out migration for pre-two-pool saves. **Correction, 2026-09-14**: the "`ShieldBuff.shieldUsePriority = 2` drains before Barrier's 0, matching `processDamage()`'s sort" claim two sentences up (and its "drain order was recency rather than `shieldUsePriority`" one before it) cited a field that does not exist in real Java - grepped `ShieldBuff.java`/`Blocking.java`/`Char.java` directly for "priority" and found nothing; `Char.damage()`'s real `processDamage`-equivalent just iterates `buffs(ShieldBuff.class)` in unspecified attachment order. This port's fixed drain order (now seal, then Blocking, then Barrier - see the new `BrokenSeal` row) is a defensible, consistent stand-in for that unspecified order, not a reproduction of a real priority mechanism. **Still not modeled**: `HoldFast.buffDecayFactor()` scaling of both the proportional decay and the 5-turn clock (this port has no HoldFast buff - a Sec 6 talent gap), and the ProvokedAngerTracker a fully-broken shield grants (same talent gap). Monsters have no shielding of their own to decay, matching the port's existing hero-only shield scope. Type-check/build/simulation/item suites green; browser verification owed per ROADMAP.md section 10. |
| `BrokenSeal`/`BrokenSeal.WarriorShield` (`items/BrokenSeal.java`, tag `v3.3.8`) | `armorSealed`, `sealBarrier`, the seal-shield regen tick, `absorbHeroDamage` | **Ported (2026-09-14), replacing the `iron_will` invented substitute noted above.** `HeroClass.initWarrior()` affixes a `BrokenSeal` directly to the Warrior's starting armor (never as a separate carried item); this port tracks that as a simple `armorSealed` flag on the currently-equipped armor, true only at Warrior creation. `WarriorShield.act()`'s real regen (`1/30` per turn while `Regeneration.regenOn()`, uncapped decay - it only regenerates, never decays on its own) is reproduced with a fractional accumulator identical in shape to `barrierPartialLoss`, growing a dedicated `sealBarrier` (`Actors.Barrier`, not shared with the Barrier-potion pool since that one *does* decay) up to `maxShield() = armTier + armLvl + pointsInTalent(IRON_WILL)`, read live off the equipped armor's own tier/level each tick so a mid-run upgrade raises the cap immediately as Java's does. Persisted through save/load (`sealBarrierState`/`sealPartialGain`/`armorSealed`); pre-existing saves default to unsealed rather than guessing. **Not ported**: the seal as a detachable, re-affixable inventory item (`Armor.AC_DETACH`/`BrokenSeal.AC_AFFIX`, `WndBag`'s armor picker) and its interaction with the `RUNIC_TRANSFERENCE` talent (itself unimplemented - talent tree membership only, per ROADMAP.md section 0) - equipping any different armor here simply loses the seal bonus for the rest of the run instead of letting the player carry and re-affix it; also not modeled, `Regeneration.regenOn()`'s `LockedFloor`/`MiningLevel` regen-off exceptions (the seal always regens here), and the shield's presentation (`ItemSprite.Glowing` glow tied to an affixed glyph - this port's seal carries no glyph since the detach/re-affix path that could ever attach one is unported). Not browser-verified this pass. |
| `CapeOfThorns`/`CapeOfThorns.Thorns` (`items/artifacts/CapeOfThorns.java`, tag `v3.3.8`) | `applyCapeOfThornsProc`, the cape cooldown tick, `attack()`'s hero-defender branch | **Ported (2026-09-14), the fourth real artifact this port implements** (after Cloak of Shadows, Timekeeper's Hourglass, Chalice of Blood). Fetched `Hero.java`'s `damage()` override to place the hook correctly: `Thorns.proc()` runs *before* `super.damage()` (the shield-absorption/Tenacity/AntiMagic chain `absorbHeroDamage` models), so `attack()` calls `applyCapeOfThornsProc` on the raw incoming hit first, then feeds its result into `absorbHeroDamage` - the opposite order a first attempt at this would naturally reach for. While inactive, every hit charges the cape by `damage * (0.5 + 0.05*level)` toward a 100-point cap; reaching it resets charge and starts a `10+level`-turn "radiating" cooldown (ticked once per hero turn, independent of being hit, matching `Thorns.act()`'s own scheduled decrement - implemented as a separate per-turn hook alongside the `BrokenSeal` regen tick above, not inside the proc function itself). While radiating, `NormalIntRange(0, damage)` of every hit is deflected (reduced) and banked as `exp`, upgrading the cape at `(level+1)*5` exp per level up to `levelCap = 10`. Verified headlessly with a throwaway `tools/scratch/` script (removed after use, per this repo's own convention for one-off checks): no-cape passthrough, charge accrual reaching exactly the cap on the 20th hit of 10 damage each, cooldown/charge reset on trigger, in-cooldown deflection never exceeding the raw hit, and a level-up reachable within the exp curve. **Not ported**: `Thorns.proc()`'s other half, dealing the deflected amount back to an adjacent attacker (`attacker.damage(deflected, this)`) - this hook runs from inside `attack()`'s own resolution of that same attacker's swing, and damaging/potentially killing the attacker mid-call risks the rest of that large, load-bearing function referencing a creature already removed; explicitly scoped out rather than risked, not a silent drop. Also not modeled: the passive per-turn charge Java's base `Artifact.charge()` grants independent of taking damage, the death-chance-adjacent `desc_active`/`desc_inactive` UI text, and item presentation (glow, sprite - shares the generic artifact frame 240 with the other three, since this port has no dedicated `ARTIFACT_CAPE` art). Not browser-verified this pass. |
| Stealth (surprise attacks, `CloakOfShadows`) | `Creature.seesHero`, sampled before each monster move; `rollHit`, Rogue wake-radius 3 + cloak +3 evasion; `canSurpriseAttack` in `src/items/strReq.ts` (pinned in `tools/verifyItemWorkflows.mjs`), read by `attack()` | Simplified - door/corner surprise attacks now use Java's pre-move `Mob.enemySeen` timing (including the snake-door tactic); surprise carries the full `surprisedBy`/`canSurpriseAttack` shape since 2026-09-17 (invisible/unseen/out-of-FOV, hero-only, thrown/unarmed always qualify, a swung weapon needs the STR and a non-flail class - the STR clause used to always pass before the shop STR line gave this port a requirement system); no invisibility counter or sneak-attack multiplier beyond Sucker Punch. **Ported (2026-09-17)**: `Mob.defenseProc()`'s surprise presentation - the `HIT_STRONG` sample plus the red `Wound` slash when the hero attacked with Preparation up (`attacker.prepLevel`, the port's mirror of `buff(Preparation.class)`), the `!` `Surprise` mark otherwise, both cut from the bundled `effects.png` with Java's own `uvRect`s, tints, alpha (`sqrt(p)`) and scale curves over 1s through the shared `showSurpriseMark` (Java's 0.125s `playDelayed` for SpiritArrow/Dart collapses - no delayed-sample seam). The sneak-attack statistics/badge stay out with the missing score layer. |
| `GreatCrab.damage()`: parries all hero wand damage while aware (`enemySeen && state != SLEEPING && paralysed == 0 && enemy.invisible == 0`) | the wand-zap branch's `target.kind === 'greatCrab'` gate | **Simplified, tightened 2026-09-14.** The gate used to be just `!target.sleeping`, missing two of Java's four live-state conditions: a paralysed GreatCrab (which cannot act at all) still parried every wand hit, and the gate never checked the crab's own sight of the hero at all - now `target.seesHero` (already computed false while the hero is invisible, folding in Java's `enemy.invisible == 0` term for free) plus an explicit `target.buffs['paralysis'] === undefined` close both gaps. `enemy == Dungeon.hero` needs no separate check - only the hero ever casts wands in this port. `tsc`/`build`/all suites green; browser verification (a paralysed GreatCrab taking a real wand hit instead of parrying it) owed per ROADMAP.md section 10. **Correction, same day: the first fetch of this method used the wrong git ref** (a plain working-tree read, which this checkout happens to have sitting near `v2.1.4`, instead of `git show refs/tags/v3.3.8:...`) - caught and re-verified against the correct tag before it could ship a second bug. The real condition also includes `src instanceof ClericSpell` (this port has no Cleric spell system - Cleric's whole talent tree is still Mage's copied verbatim, a separate documented gap) and a `Statistics.questScores[0] -= 50` side effect this port has no equivalent scoring/badge system for at all (only one `questScores` index is tracked anywhere in this codebase, for an unrelated quest) - both correctly out of scope, not silently dropped. |
| `DungeonTerrainTilemap.getTileVisual`'s `getRaisedWallTile`/`getRaisedDoorTile`, and `DungeonWallsTilemap`'s `stitchInternalWallTile`/`stitchWallOverhangTile` - SPD's two-layer raised-wall rendering | `spdLevelGen/wallTiles.ts` (`terrainFrameAt`/`wallFrameAt`/`stitchesAsWall`), the `wall*`/`*Overhang`/`raisedDoor*` entries of `TERRAIN_FRAME`, and `main.ts`'s second `wallsMap` TileMap | Ported. **This row previously said the opposite and was wrong on both counts** - see the note below |
| `DungeonTileSheet.tileVariance`/`getVisualWithAlts` (`RAISED_WALL` -> `RAISED_WALL_ALT`, `FLOOR` -> `FLOOR_ALT_1`/`FLOOR_ALT_2`, `GRASS` -> `GRASS_ALT`, `EMBERS` -> `EMBERS_ALT`) | `setupTileVariance`, `terrainFrameAt`'s `alternate()` helper | **Correction: this row previously said the FLOOR/GRASS/EMBERS alts were "not ported... a small follow-up" - wrong, they already were.** `alternate()` is generic over any frame index, not wall-specific: the final `return alternate(frame)` fallthrough (frame 0, the base `FLOOR` tile) applies both `commonAltVisuals`' `FLOOR_ALT_1` at `variance >= 50` and `rareAltVisuals`' `FLOOR_ALT_2` at `variance >= 95` (the only one of these four with a rare tier); the `GRASS`/`EMBERS` branches call `alternate(2)`/`alternate(3)` the same way, matching Java's own `commonAltVisuals` entries exactly. `GameScene.java` rolls `Random.Int(100)` per cell inside its own `pushGenerator(seedCurDepth())`, so `tileVariance` touches no part of the level-generation stream and reproduces exactly from the per-depth seed, for all four alts alike |
| `WALL_DECO`/`BOOKSHELF`/statue/alchemy-pot/barricade/high-grass raised and overhang art | `spdLevelGen/visualWalls.ts` (`raisedWallFrame`/`upperWallFrame`/`foregroundGrassFrame`) | **Correction: this row previously said "Not ported - this port has no such terrain" - wrong on both counts.** `WALL_DECO`(12)/`BOOKSHELF`(27) are in `visualWalls.ts`'s own `walls` set (raised south-face + overhang frames 100/108, both alt-variance-gated); `STATUE`/`STATUE_SP`(25/26) -> overhang frame 240, `ALCHEMY`(28) -> 241, `BARRICADE`(13) -> 242, `HIGH_GRASS`(15, alt 246) and its furrowed counterpart(30, alt 247) are all explicit cases in `upperWallFrame`'s below-neighbour switch, verified live in-browser (Halls depth 21, `SkullsRoom`'s statue ring rendering with the correct raised/overhang lip). `BARRICADE` specifically is unexercised in practice - no room this port paints currently places that terrain (only referenced in `regularPainter.ts`'s `SOLID` merge-blocking set) - so its frame code is correct but dead until some future room places one |
| Remaining terrain interaction families (signs/wells and the Java-specific consequences of chasms and crystal doors) | `visualWalls.ts`, `adoptPortedFeatures`, `bumpDoor`, `fallThroughChasm`, `usePortedWellAt`, `triggerPortedPlantAt` | Partial/live - raw CHASM cells now retain their pit frame while using open collision/FOV; hero entry causes the depth transition and the movement boundary prevents non-hero mobs from stepping into pits. Signs are examined; wells apply awareness/health effects and become empty; crystal doors consume crystal keys; crystal chests consume a key before exposing their reward; generated plant markers trigger one-shot effects and wither. **The well effects themselves were re-checked against `WaterOfAwareness.java`/`WaterOfHealth.java` this pass and had two real bugs each, now fixed.** Awareness well: previously ran `Actors.identify(item)` over the *entire bag* - real Java's `Belongings.observe()` (called by `affectHero()`) only identifies the 6 equip slots, which this port already treats as identified/curse-known the instant they're equipped (a pre-existing, unrelated simplification - see `equipWeapon`/`equipArmor`), so there was nothing left for that part to do; the real, distinct, previously-missing effect is `observe()`'s last loop marking every *unequipped* backpack equipable/wand item cursed-known without fully identifying it, now matched, plus a genuine `awareness` buff grant (`BUFF_DURATION.awareness = 2`, matching `Awareness.DURATION`; its Java on-detach `Belongings.observe()` re-run has nothing new to reveal here for the same equip-time reason, so it's a real status with no distinct expiry action to wire). Health well: was wrongly clearing `burning` - real `PotionOfHealing.cure()` never touches it (confirmed by reading `cure()`'s exact buff list) - and had no `Belongings.uncurseEquipped()` at all, silently dropping the weapon/armor/ring curse-clear real Java grants alongside the full heal; both fixed, reusing the exact same three-line equipped-slot clear `ScrollOfRemoveCurse`'s branch already has. Browser-verified live: an awareness well correctly left an unidentified ring's `identified` flag untouched while setting `cursedKnown: true`, discovered a concealed secret cell, and granted `awareness: 2`; a health well with a cursed weapon/armor/ring and both `poison`+`burning` active healed to full, cleared `poison` while leaving `burning` untouched, and cleared all three curses. Plant interactions now include Java-aligned single-target statuses, Warden-sensitive Blindweed/Stormvine, Fadeleaf relocation (now **detaching `Roots`, 2026-09-12**: Java's `Fadeleaf.activate` teleports through `ScrollOfTeleportation.teleportChar`, which detaches `Roots` right after placing the char, and this plant is the canonical escape from entanglement - without it the effect silently did nothing for a rooted hero, whose `moveTo` refuses outright, which was reachable through the Overgrowth glyph's own proc; browser-verified live, a rooted hero now moves ~23 cells and comes out unrooted. Java also teleports a *Mob* this way with a `HazardAssistTracker`, and sends a *Warden* one depth back when inter-floor teleporting is allowed rather than moving within the level - neither is ported, since plant activation here is hero-only and this port has no floor-return transition), Sungrass healing-over-time that cancels on movement and survives save/load, persistent Icecap/Rotberry area blobs, Warden FrostImbue/AdrenalineSurge variants, and Java-sized Dewcatcher (3-6) / Seedpod (2-4) distinct-neighbour drops; **Earthroot now grants the real `Earthroot.Armor` block pool rather than a full-strength shield, see its own row**. Swiftthistle now freezes automatic actors for its seven-time-unit window, queues delayed trap/plant presses, and persists both timer and queue through saves; seed growth/Lotus preservation remain simplified. |
### How SPD draws walls, and the claim this file used to make about it

The row above used to read *"Not ported - confirmed by inspection that none of these are
neighbour-dependent pieces; SPD's wall 'stitching' look is a rendering trick (`DungeonTilemap`
overdraw), not stitched sprites."* Both halves are wrong, and the consequence was visible: every
impassable cell drew the same lit brick face, so a five-deep mass of rock rendered as a five-tile
slab of bright brick where Java shows one lit edge and dark rock behind it. The user spotted it
against a real screenshot - "the whole walls are visible where only the surface should be visible".

What Java actually does, across **two** tilemaps (`updateMap()` passes `flat=false` for both; the
`flat=true` branch is only the still-image path for inventory icons, which is why `FLAT_WALL`
never appears on a real floor):

- **Lower layer**, under the actors (`DungeonTerrainTilemap`). A wall draws its lit south face
  *only when the cell below it is not itself wall* - `getRaisedWallTile`'s first line returns
  nothing otherwise. This single test is the whole effect.
- **Upper layer**, above the actors (`DungeonWallsTilemap`). A wall whose neighbour below is also
  wall draws `WALL_INTERNAL`, the dark top of the mass; a *non*-wall cell whose neighbour below is
  wall draws `WALL_OVERHANG`, the lip that wall casts up into it. Being above the actors is what
  lets a wall top hide whoever stands behind it, so it is a second `TileMap` here rather than
  another layer of the first - mwg's layers all draw under whatever is added to the world after.

And the pieces *are* neighbour-dependent, which is the second error: `getRaisedWallTile` adds +1
for open right and +2 for open left, `stitchInternalWallTile` adds +1/+2/+4/+8 for its four
corners, and `stitchWallOverhangTile` adds +1/+2 for its two. Off-map counts as wall throughout,
because Java passes `-1` for a missing neighbour and `-1` is `NULL_TILE`, which is in the
`wallStitcheable` list.

Every wall and door frame therefore reads its neighbours, so a cell that changes has to restitch
the ring around it (`restitchTilesAround`, Java's `DungeonTilemap.updateMapCell`, which also
rewrites a 3x3). Opening a door and uncovering a secret one both do this now. That fixed a
pre-existing bug on the way past: nothing used to re-pick frames at all, so a discovered secret
door kept the wall face it had been hiding behind.

Checked by `tools/scratch/wallDump.ts`, which imports the same module the game renders from and
asserts the defining invariant across all 8 ported floors - every wall cell has a lit face **xor**
a dark top, matching whether the cell below it is open. Lit faces come out at 5-11% of wall cells
(they were 100%), and faces exactly equal overhangs on every floor, which is the vertical
transition count agreeing with itself. **Not verified visually**: the Chrome extension was down
for this change, so nobody has yet seen the new walls drawn. The dump proves the rule, not the
art.

### The sealed starting room is faithful; the hint is not

On depth 1 with `SPDSettings.intro()` set - and again on depth 2 until the guidebook's searching
page is found - `RegularPainter.paintDoors` turns every entrance-room door into
`Door.Type.HIDDEN`. Its own comment calls this the tutorial. **The hero genuinely starts sealed
into the entrance room, and that is correct generation, not a bug**: the doors sit on the room's
perimeter and `searchForSecrets` checks all eight neighbours, so they are findable. Do not "fix"
it by opening them. `tools/scratch/checkBridge.ts` reports the exit unreachable on exactly the
depth-1 and depth-2 floors and reachable on all of 3,4,6,7,8,9, which is that seal and nothing
else.

What real SPD ships alongside it, and this port does not, is the scaffolding that makes the seal
fair: the Adventurer's Guide page lying in the starting room, a search button on the toolbar, and
the prompts pointing at it. Without those a correct seal reads as a broken floor - a player bumped
into walls until they starved. So `enterLevel` prints a one-line hint (`stairsNeedSearching`) when
the stairs cannot be reached without searching. **That hint is a port-only affordance with no Java
counterpart**, standing in for tutorial content that is not ported; it is keyed off actual
reachability rather than off `depth === 1`, so it stays correct for the depth-2 case too. Shut
doors count as ways through, since bumping one opens it; a hidden door does not, being stored as
plain wall until found.

## Consumables (`items/potions/*`, `items/scrolls/*`, `items/food/*`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `PotionOfHealing.heal()`/`Healing.act()`: `setHeal(round(0.8*HT+14), 0.25, 0)` starts a heal-over-time that drains 25% of what's left each turn (floored at 1, capped at what's left) - not an instant heal; a second potion mid-heal only replaces `healingLeft` if its amount is bigger, it never stacks additively | `quaffPotion`'s healing branch, the `healingLeft` field and its per-turn tick in `spendHeroTurn`'s `applyBuffDamage` hook | **Ported, correcting this row's earlier claim.** The port previously did an instant flat full heal (`hero.hp = hero.maxHp`) - not a translation of the real formula at all, and a real gameplay-changing simplification: at low levels the two happen to look similar (`0.8*20+14=30` already exceeds a level-1 hero's full HP pool), but at higher `maxHp` the real potion heals meaningfully less than a full bar, gradually. Both the total amount and the exact 25%-per-turn decay curve are now reproduced; the cure list (poison/weakness/vulnerable/cripple) still applies instantly on quaffing, matching Java's `cure()`/`heal()` split (**correction, 2026-09-09 item-system audit**: `burning` was also in this list, a real, unwarranted addition - fetched `PotionOfHealing.java`'s `cure()` and confirmed it detaches Poison/Cripple/Weakness/Vulnerable/Bleeding/Blindness/Drowsy/Slow/Vertigo, never Burning; a healing potion does not extinguish fire in real Java. `burning` removed from the port's list; the other five Java entries have no equivalent buff in this port at all, so there's nothing to add for them). Browser-verified live: quaffing at 1/20 HP produced the exact real progression turn by turn (30 -> 22 -> 16 -> 12 -> 9 -> 7 -> 5 remaining, HP climbing 1 -> 9 -> 15 -> 19 -> 20-capped -> 20 -> 20). The `quaffhealing` log line was also corrected in both locales - it previously claimed "fully healed", which is no longer immediately true. Simplified: real Java's `Healing` is its own visible buff with a status-pane icon/countdown and `Talent.onHealingPotionUsed`'s Shielding-aware interaction; this port's `healingLeft` has no UI indicator of its own and only affects the already-real-and-unchanged Restored Willpower/Agility/Nature talent hooks (which still fire immediately on quaffing, as Java's `Talent.onHealingPotionUsed` does). |
| `PotionOfStrength` (`STR+1`, unique) | `quaffPotion`'s strength branch | Ported |
| `ScrollOfIdentify` (reveal one item) | `readScroll`'s identify branch + `Actors.identify` | Ported (one item; TEST_SUBJECT heal rides along) |
| Unidentified potion/scroll appearance assignment | `Actors.Appearances`, `APPEARANCE_TABLES`, `itemDisplayName`, save/load | Ported - appearances are shuffled once per seeded run, pre-drawn so later gameplay RNG is unaffected, and serialized with the run |
| Ally combat / `ScrollOfMirrorImage` / `Amok` | `Creature.isAlly`, `takeAllyTurn`, `takeAmokTurn`, `rangedTarget`, `spawnMirrorImage`, `takeMonsterTurn`, `readScroll` | Partially ported this pass: two scheduled 1-HP allies copy the hero's combat stats, attack the nearest visible hostile, follow the hero when idle, and can be intercepted by adjacent hostile melee turns. Simple ranged attacks now choose the nearest line-of-sight hero/ally; `Amok` lasts 5 turns and attacks the nearest living non-NPC creature, including hostile mobs and allies. Ally state survives floor/run saves and ally deaths award no XP or loot. `MirrorImage` now uses the hero's real class sheet and armor-tier idle frame, matching Java `MirrorSprite`; boss-specific ranged targeting and Java's richer ally orders/aggro memory remain simplified. |
| `ScrollOfUpgrade.upgradeItem()` + `Weapon/Armor.upgrade(false)` (affix/curse transitions) and `Item.degrade()`/`Warlock` Degrade | `upgradeGear` + `rollUpgradeAffixLoss`, `zapHero`'s warlock branch, `degradedLevel`, the `degrade` buff (`BUFF_DURATION`, status icon 48, announced) | Ported, checked against tag `v3.3.8` (`ScrollOfUpgrade.java`, `Weapon.java`, `Armor.java`, `Warlock.java`, `Degrade.java`, `Item.java`). Upgrading rolls the real transitions BEFORE the level changes: curse affix/glyph removed on a static 1-in-3 with the real `remove_curse` line, otherwise a good affix/glyph lost at 10/20/40/80/100% from +4 (`Float(10) < 2^(level-4)`) with the real `incompatible` warnings. **Found and fixed in the same audit: Warlock never permanently decremented weapon levels** - real `Warlock.zap()` applies the 30-turn Degrade *buff* on a LANDED ranged zap at 50% (melee never degrades); the buff reduces EFFECTIVE levels through `Degrade.reduceLevel()` (`round(sqrt(2*(lvl-1))+1)`, non-positive untouched) exactly where Java routes `buffedLevel()` (damage rolls, armor DR), while proc chances, upgrade-loss rolls and stored true levels keep `level()`. The old 25%-permanent-chip is gone. Not modeled: harden loss (nothing grants hardening without StoneOfEnchantment), seal upgrade (no seal), RunicTransference shifting the armor loss floor (talent has no mechanics yet - floor stays 4), `Degrade.detach`'s `updateHT` (no such recompute exists here), the DEGRADE sound. `Item.degrade()` itself is unbounded-negative by definition - no new primitive needed. The tier-jump progression itself stays this port's own simplification (fixed per-class tiers + plain +1 levels is the real shape - a full rework is tracked, not attempted). Type-check/build only; browser verification owed per ROADMAP.md section 10. |
| `ScrollOfRage` (beckon + Amok), `ScrollOfLullaby` (Drowsy->sleep), `ScrollOfMagicMapping` (reveal), `ScrollOfMirrorImage` (2 images), `ScrollOfRemoveCurse` (decuse) | `readScroll` branches | Audited this session against Java source (same method that found the potion-branch bugs), found two more real mismatches - correcting this row's stale claims. **`ScrollOfMirrorImage` was outright wrong, not simplified**: real Java spawns 2 allied `MirrorImage` NPCs (1 HP each, mirroring the hero's own weapon/accuracy/evasion, fighting alongside the hero); the port granted a 10-turn `bless` self-buff that has no relationship to that effect at all - not a chosen stand-in, just a stray leftover. A full port needs genuine ally-vs-monster combat, which this port has nowhere (every monster AI decision here hardcodes the hero as the only possible target) - tracked in `ROADMAP.md` as its own item, not attempted this pass. Replaced the wrong bless with a `heroBarrier` shield (`round(maxHp*0.15)`) as an honest, documented stand-in for "extra bodies soak some hits," using a system this port already has rather than inventing a new one. **`ScrollOfRage` was missing its actual beckon effect**: real Java calls `mob.beckon(hero.pos)` on every mob on the level (not just visible ones), turning them to approach: the port only ever woke mobs where they stood, with no beckon at all. Fixed by setting `seesHero = true` alongside waking - the same target-acquisition stand-in the Annoying weapon curse's own beckon already uses, for consistency. The additional 5-turn `Amok` (visible, non-ally mobs attack anything nearby, allies included) is not modeled, for the same missing-monster-vs-monster-combat reason as MirrorImage. Browser-verified live: a sleeping, out-of-sight rat given `scrollRage` correctly woke (`sleeping: false`) and turned to approach (`seesHero: true`); a `scrollMirror` read correctly granted a `round(maxHp*0.15)` shield and left the old `bless` buff untouched (never set). **`ScrollOfMagicMapping` only ever did half its job**: real Java marks every discoverable cell `mapped` (the whole floor layout becomes visible, not just secrets) *in addition to* revealing secret terrain - the port only ever did the secret-reveal half, leaving the rest of the floor exactly as unexplored as before reading it. Fixed by calling `FieldOfView.revealAll()` - an `mwg/roguelike` method whose own doc comment says "for a magic mapping effect or a debug view," but which, like `rollAffix` earlier this session, was never actually called anywhere in `web-mwg`. Since this port's fog-of-war doubles as its map display (no separate minimap), revealing every cell as explored is the direct equivalent. Browser-verified live: before reading, only the starting room was explored (`fov.explored.size` well under the floor's cell count); after, `explored.size === level.cellCount` exactly, and a zoomed-out screenshot showed the whole floor's rooms and corridors rendered, hero's own room aside. **`ScrollOfLullaby` is now ported with an explicit reduction**: real Java applies `Drowsy.DURATION = 5` to visible mobs and the reader, and `Drowsy.act()` then attaches `MagicalSleep`; this port now applies the timed five-turn buff and transitions mobs into their native sleeping state. Currently, the hero-side `MagicalSleep` healing/resting state has no equivalent here, so an injured reader receives the existing three-turn paralysis as a documented stand-in, while a full-health reader remains awake like Java's `toohealthy` path. The `drowsy` timer is a first-class shared buff and persists through the existing creature save/load path. **`ScrollOfRemoveCurse` re-checked now that cursed gear is actually real (post enchant/curse-wiring fix) - confirmed a real, deliberate, already-consistent simplification, not a new bug**: real Java is an `InventoryScroll` that targets exactly one player-chosen item (`onItemSelected`/`uncurse`); this port cleanses every curse source at once (bag items, equipped weapon/armor curse, cursed ring) with no item-picker step at all - the same auto-target-rather-than-let-the-player-choose pattern `ScrollOfIdentify` already uses elsewhere in this same file (it auto-picks "the first unidentified item" rather than presenting a chooser), so this isn't an isolated shortcut invented for this one scroll. The actual curse-clearing coverage itself is complete and correct for every curse source this session's enchant/curse work made real. **Found and fixed a further live bug, auditing every `Cat.SCROLL` id `generatedInventoryItem`/`sourceInventoryItem` can produce (same method as the potion-id bug above)**: `ScrollOfMirrorImage` and `ScrollOfMagicMapping` were mapped to `scrollMirrorImage`/`scrollMagicMapping` by the generic `ScrollOf` -> `scroll` rename, ids `readScroll()` never recognized (it only checks the shorter `scrollMirror`/`scrollMapping`, matching the identification-appearance table's own kinds) - so an actually-generated Mirror Image or Magic Mapping scroll silently read as Remove Curse instead of its real (already-ported, working) effect. `ScrollOfRemoveCurse` itself also got the generic `scrollRemoveCurse` id rather than the `scrollCleanse` the appearance table and `readScroll()`'s default branch both expect - harmless by coincidence (any unrecognized id already fell to that same default), but now named consistently too. All three id-producing call sites fixed. Browser-verified live: `generatedInventoryItem` now produces `scrollMirror`/`scrollMapping`/`scrollCleanse` for those three classes, and reading an actual `scrollMirror` item correctly grants the shield stand-in (not Remove Curse's cleanse). **`ScrollOfRecharging` is now ported too**, fetched from the local shattered-pixel-dungeon checkout (tag `4.0.0-beta`) to confirm: `doRead()` just grants the 30-turn `Recharging` flavour buff (`Recharging.DURATION = 30f`) this port already fully modeled (`BUFF_DURATION.recharging = 30`, already read by `recoverWandCharge`'s 1.25x rate bonus for the Recharging enchant's own charger effect) - the scroll itself was simply never wired to a buff/rate system that already existed complete and correct. Added to the identification-appearance shuffle table (9th scroll look) and `readScroll()`'s auto-preference order. `readScroll()`'s default branch comment now states plainly that `ScrollOfRetribution`/`Terror`/`Transmutation` (all in the real Generator pool, none with its own branch) still fall through to Remove Curse's effect - an active misbehavior, not mere inaction, same as the equivalent unported potions. Browser-verified live: reading a `scrollRecharging` item granted the buff (`hero.buffs.recharging === 30`, exact), and `generatedInventoryItem`'s id mapping needed no special-casing (unlike Mirror/Mapping above) since the generic `ScrollOf` -> `scroll` rename already produces the correct `scrollRecharging` id. **`ScrollOfTeleportation` is now ported too**, fetched from the local shattered-pixel-dungeon checkout to confirm the real shape: `teleportToLocation`/`teleportChar` move the reader to a free cell and clear `Roots`. Real Java's `teleportPreferringUnseen` biases toward an unvisited room with a `PathFinder` reachability check; this port has no room-visited tracking or reachability search to draw on, so it reuses the same uniformly-random, unchecked cell search the Displacing weapon curse and Displacement armor curse already use elsewhere in this file - factored out into a new shared `randomFreeCell()` helper (a genuine rule-of-three refactor, this being its third call site) rather than a fourth copy-pasted search. Uses the real Java message keys (`items.scrolls.scrollofteleportation.tele`/`no_tele`), already present in the generated catalog for every locale including French, instead of adding new `port.log.*` entries. Browser-verified live: reading a `scrollTeleportation` item while `Roots` was active moved the hero to a new cell and cleared the roots buff in the same action, with the correct French message rendering ("Vous avez été téléporté en un clin d'œil à un autre endroit de l'étage."); `generatedInventoryItem` needed no id special-casing, matching the generic rename directly. **`ScrollOfTerror` is now ported too**, fetched `ScrollOfTerror.java`/`Terror.java` from the local checkout to confirm: real Java applies a 20-turn `Terror` buff (`Terror.DURATION`) to every visible non-ally mob, which stops that specific mob attacking the reader while it otherwise acts freely (can still attack allies, flee toward other exits) - a per-object avoidance this port's monster-turn model has no primitive for, and moot anyway given this port's total absence of monster-vs-ally combat. Modeled as a practical equivalent instead: a new `terror` buff (`BUFF_DURATION.terror = 20`) checked early in `takeMonsterTurn`, right after the sleep/wake logic and before any attack-decision branch, which forces `decideMonsterAI`'s existing `fleeBelow` parameter to `1` (always flee) - the same mechanism `Thief.FLEEING` already uses for its own "stolen and running" behavior - and returns immediately, skipping every attack branch for that turn. Uses the real Java message keys (`items.scrolls.scrollofterror.none`/`one`/`many`, the "one" variant substituting the target's name via the literal `{0}` token `MessageParams` supports as any string key), already present in the generated catalog for every locale. Browser-verified live: reading the scroll on an adjacent, awake rat applied `terror: 20`; the rat's next six turns fled to distance 10 and never closed back in or attacked (hero HP unchanged throughout) despite starting adjacent; the French "one mob affected" log line rendered with the substituted name. Not modeled: Java's real per-object distinction (the terrorized mob could still fight something else, or lose the buff early if attacked) - accepted as moot given no ally-combat system exists to make that distinction observable. **`ScrollOfRetribution` is now ported too, minus `Blindness`**: fetched `ScrollOfRetribution.java` from the local checkout to confirm the real formula - `round(mob.HT/10 + mob.HP*power*0.225)` damage to every visible mob, where `power = min(4, 4.45*missingHpFraction)` scales with how hurt the reader is (can nearly one-shot enemies at very low HP), then applies `Weakness` and `Blindness` to the reader as the cost. This port has no `Blindness` (a `FlavourBuff` whose real mechanical effect - reduced vision radius/targeting - has no equivalent seam here), so only `Weakness` is granted; `Blindness` stays a documented gap rather than a fudged stand-in. **Found in the course of this: `Weakness` and `Vulnerable` were both fully wired dead code** - `rollDamage`/`rollHit` already read them correctly (`attacker.buffs['weakness']` -> x0.67 damage dealt, `defender.buffs['vulnerable']` -> x1.33 damage taken), but nothing anywhere in the codebase ever granted either buff to anyone, so both mechanics, though correct, had never once fired in actual play. Also fixed both buffs' durations: `BUFF_DURATION.weakness`/`.vulnerable` were `10`, but real `Weakness.DURATION`/`Vulnerable.DURATION` are both `20` - an unconfirmed placeholder guess from before either buff had a real source, now corrected against source. `ScrollOfRetribution` is `Weakness`'s first real source; `Vulnerable` remains unassigned to any source (it's not part of Retribution in real Java either - it's a separate mob-facing debuff) and stays dead until something grants it. Browser-verified live: reading the scroll at 75% missing HP against an 8-HP rat dealt exactly the formula's predicted 7 damage; `hero.buffs.weakness` was set to the corrected `20`; a 50-swing sampling comparison with and without the buff active showed a ~0.71x damage ratio, matching the real 0.67x multiplier within sampling noise and confirming the previously-inert mechanic now actually fires. |
| `PotionOfLiquidFlame/MindVision/Invisibility/Purity`, `Food` energy | `quaffPotion` branches, `eatFood` | Simplified - flame is 4 + burning to the nearest enemy, purity cures fire/poison, food/meat resets hunger. **`PotionOfExperience` was entirely missing and is now ported** (found the same way as the two bugs above, while auditing the rest of the potion branch): `hero.earnExp(hero.maxExp())` - grants exactly the XP needed to complete the current level, evaluated before the level-up itself raises the requirement, via the existing `grantExperience`/`SPD_LEVEL_CURVE` machinery already used for monster kills. Added to the identification-appearance shuffle table alongside the other seven potions. Browser-verified live: quaffing at level 1/0 XP produced exactly `level 2, exp 10` - matching `Hero.maxExp(1) = 5+1*5 = 10` precisely. **`PotionOfLevitation` is now ported** (this port's chasm terrain, `isChasmCell`/`fallThroughChasm`, already existed by the time this was picked up - the "limited value without chasm terrain" reasoning below predates that and no longer applies): `Levitation.attachTo()`'s buff (`BUFF_DURATION.levitation = 20`, already matching `Levitation.DURATION` before this potion used it) plus its immediate `Roots` clear on landing; `fallThroughChasm` also now skips the chasm interaction entirely while the buff is active, the same bypass `triggerTrapAt` already applied to traps. **Found and fixed the same pass, auditing every `Cat.POTION` id `generatedInventoryItem`/`sourceInventoryItem` can produce**: `PotionOfLiquidFlame`/`PotionOfInvisibility` were mapped to `potionLiquidFlame`/`potionInvisibility` by the generic `PotionOf` -> `potion` rename, ids `quaffPotion()` has never recognized (it only ever checked the shorter `potionFlame`/`potionInvis`, matching the starting-kit items `makeHero()` adds directly) - so an actually-generated Liquid Flame or Invisibility potion silently quaffed as Purity instead of its real effect. Both id-producing functions now special-case those two class names to the short ids. **`PotionOfToxicGas` and `PotionOfParalyticGas` are now ported.** There is no `PotionOfConfusion` class in real Java at all (the previous text here was simply wrong - `ConfusionGas` is a trap-only blob, seeded by `ConfusionTrap`, which this port doesn't model as a trap kind; not a potion gap). Re-reading `Potion.java` showed the "needs a new consequence system" premise below was also wrong: `Potion.apply(hero)` is just `shatter(hero.pos)` for every potion, gas ones included - there is no separate "drink" effect, so drinking a gas potion in real Java already means gassing your own feet, identical in shape to throwing it at yourself. This port's quaff-only flow (it has no potion-throw targeting) reproduces that exactly, no simplification needed. Two new floor-persisted blobs, `toxicGas`/`paralyticGas` (`main.ts`'s `spreadPlantBlobs`, ticked alongside the existing `plantGas`/`plantFreeze`/`fire`), give each its real per-turn consequence: `ToxicGas.evolve()`'s direct `1 + scalingDepth()/5` damage (no buff at all - distinct from the `plantGas`/Rotberry stand-in, which reuses a `poison` buff refresh) and `ParalyticGas.evolve()`'s per-turn `Paralysis.DURATION` reapplication (reusing the existing `paralysis` buff, already Java-shaped). `PotionOfToxicGas.shatter()`/`PotionOfParalyticGas.shatter()` both seed a 1000-volume blob at the hero's feet on quaff, matching Java exactly. **`ToxicTrap` was also fixed in the same pass**: real Java's `ToxicTrap.activate()` seeds the exact same `ToxicGas` blob class the potion does (`300 + 20*scalingDepth()`, a formula this port already had right) and does nothing else - no instant status. This port's trap handler previously gave an instant `poison` buff (never real Java behavior) and reused `plantGas` (Rotberry's own blob, conflating two distinct Java blob classes) instead of seeding its own gas - both fixed; the trap now seeds `toxicGas` and only that. Browser-verified live: quaffing `potionToxicGas` seeded `toxicGas` to volume 1000 at the hero's cell, and a subsequent turn dealt exactly `1+floor(depth/5)` damage (confirmed 1 at depth 1, 3 at depth 12); quaffing `potionParalyticGas` applied `paralysis: 3` (matching `BUFF_DURATION.paralysis`); triggering a `toxic`-kind trap seeded `toxicGas` to volume 320 (`300+20*1`) with no `poison` buff granted, confirming the old instant-poison bug is gone. **`PotionOfHaste` is now ported too, found stale in a later pass auditing other "blocked" claims right after the Weapon-Augment one turned out stale**: the "needs a hero speed-buff system this port doesn't have" premise no longer held once `getActionTurnCostMod` existed. Fetched `Char.java` to confirm the exact mechanic: `speed()` has a flat `if (buff(Haste.class)) speed *= 3f` - Haste is a genuine 3x speed multiplier, not a doubling, applied alongside Cripple/Stamina/Adrenaline/Dread the same way. A new `haste` buff (`BUFF_DURATION.haste = 20`, matching `Haste.DURATION`) is read by `getActionTurnCostMod` as `mod /= 3`, the exact inverse relationship `RingOfHaste`'s own multiplier there already uses. Browser-verified live: `getActionTurnCostMod()` read `1` before quaffing and `0.3333...` immediately after, with `hero.buffs.haste === 20`. **`PotionOfFrost` remains not ported**: it needs a freeze/immobilize effect and visual this port has no other seam for. It currently falls through to `quaffPotion()`'s default branch and gets Purity's poison/burning-clear effect instead of its own - not merely inert, an active (if narrow) misbehavior, explicitly commented at that call site rather than left implicit. **Invisibility was also wrong outright, found the same way as MindVision and now fixed**: it previously force-slept every monster on the floor on top of granting the buff - a much stronger effect than real Java's `Invisibility.attachTo()`, which does nothing but increment a stealth counter. This port already has the *correct* invisibility AI gating elsewhere (`monster.seesHero`'s `!hero.buffs['invisibility']` check, and `takeMonsterTurn`'s `distance > 1` skip - matching Java's real "distant monsters lose track, adjacent ones keep fighting" behavior) - the blanket sleep was a redundant, incorrect addition on top of an already-working mechanism, not a needed stand-in for anything. Removed; the existing gating now runs unmodified. Browser-verified live: an already-awake, adjacent rat correctly stayed awake (`sleeping: false`) after the hero quaffed invisibility, rather than being forced to sleep. **MindVision was wrong outright too, found the same way, and is now fixed**: it previously revealed every secret (trap and hidden door) on the floor - the real effect of Java's Scroll of Magic Mapping, not this potion at all. Real `PotionOfMindVision.apply()` grants a 20-turn `MindVision` buff that reveals every ordinary monster's position through walls/fog. Now ported as a real `mindvision` buff (`BUFF_DURATION.mindvision = 20`, matching `MindVision.DURATION`) gating `creature.sprite.visible` - regular monsters render regardless of FOV while it's active; NPCs and the hero are unaffected, matching Java's mobs-only reveal. The log line was also split into Java's real two variants (`see_mobs`/`see_none`, based on whether any monster exists on the floor) in both locales. Browser-verified live: a rat 15 cells away, definitely outside FOV, went from `sprite.visible: false` to `true` immediately on quaffing, with `mindvision: 20` turns applied. |
| Wands other than Magic Missile, rings, artifacts (beyond the cloak stand-in), glyphs, alchemy/crafting, honeypot/shattered-pot semantics | `placeGroundItems`, `pickupGroundItemAt`, `equipWand`, ring equipment workflow | Simplified - wand `sourceClass` now persists as an equipped `wandType`; Magic Missile/Frost, Fireblast, Lightning, Prismatic Light, Disintegration, and the regional growth portion of Regrowth are playable. **Fireblast is now Java's whole routine (2026-09-12), and the charge half was a real bug**: `WandOfFireblast.chargesPerCast()` is Java's `gate(1, ceil(curCharges * 0.3), 3)` - the same rule Regrowth uses - and the port computed that count for Regrowth alone, so Fireblast *always* cast at one charge and its damage was capped by the one-charge ceiling `2 + 2*lvl` where Java's two-charge cast reaches `2*(4 + 2*lvl)`. Both the charge count and the three-case damage range (`min = (1+lvl) * charges`, `max` per charge) are now Java's. The area half is `useFireblastWand`, a translation of `onZap()` in Java's own order: seed `1 + chargesPerCast()` of Fire on every cone cell except the caster's own, hold back only the cells adjacent to the caster that are neither flamable nor solid (burning any heap there instead, unlit - Java's "This prevents short-range casts not igniting barricades or bookshelves"), open DOORs as the cone crosses them, collect every character, then ignite the flamable, unlit NEIGHBOURS8 cells strictly closer to the collision cell, treating an empty cone as the caster's own cell, and give each affected character `damageRoll()`, Burning, and Cripple (2 charges) or Paralysis (3). The cone is `src/mechanics/cone.ts` with Java's own `3 + 2*charges` range, `30 + 20*charges` degrees and `STOP_TARGET | STOP_SOLID` rays. Stated port differences: the collision cell is the aimed creature's cell (this port aims at creatures, and an uncursed wand's `collisionProperties` is `WONT_STOP`, so Java's collision cell is the aimed one anyway); NPCs are excluded from the blast as every other area effect here does, where Java's `Actor.findChar` would catch a shopkeeper; and the statuses use the port's shared buff durations (Burning 3 against Java's 8, Paralysis 3 against Java's 4, Cripple 4 either way - see the buff-durations row). Browser-verified live (`tools/scratch/fireblast-charges-livecheck.mjs`, 13 assertions): at four charges a cast spends two and 40 casts span 2 to 8 while at two charges it spends one and spans 1 to 2, the caster unharmed; and in one scene the aimed creature and a creature flanking it inside the arc are both hit, burned and (at two charges) crippled, a creature behind the caster is untouched, the plain cell directly in front of the caster is deliberately left unlit while the aimed cell is lit and the floor's fire volume grows. Lightning uses the real `WandOfLightning` level roll and per-target multiplier but arcs to visible adjacent foes instead of Java's Ballistica chain; Prismatic Light uses the real `WandOfPrismaticLight` level roll and blindness chance, represented by timed daze because this port has no distinct Blindness status - and its separate x1.333 damage multiplier against `Property.UNDEAD`/`Property.DEMONIC` targets, missing entirely until 2026-09-12, is now applied from the shared `isUndeadOrDemonic` helper and browser-verified live (an armor-free rat's bolts never exceeded the plain 1-5 roll, while a Guard's and a Succubus's reached 7 = `round(5 * 1.333)`); Disintegration uses the real level roll but targets only the selected enemy instead of Java's full line and terrain bonus. Regrowth's remaining Lotus/aiming gaps are recorded in its dedicated row. Other wand families, artifacts and alchemy semantics are not ported. Ordinary throwable bombs are now ported too (see the dedicated `Bomb` row). |
| `PotionOfFrost.shatter()` (`Freezing` blob: extinguish fire, `Chill`, eventual `Frost` immobilize) | `quaffPotion`'s `potionFrost` branch, `buffs.ts`'s `frost`, hero/monster turn gates | Simplified - the cast remains target-centred because no thrown-cell picker or persistent freezing-terrain layer exists, but it now applies the hero/target Chill effect, extinguishes Burning, and represents Java's explicit 10-turn Frost immobilization with a `frost` marker plus the shared paralysis lock when an already-capped Chill reaches its freeze transition. Elemental harmful-buff damage is retained; freezing heaps, blob cadence, and full area geometry remain unported. Type-check/build only; browser verification owed per ROADMAP.md section 10. |
| `ScrollOfTransmutation.doRead()` (`usableOnItem`/`changeItem` per-category reroll via an item picker) | `readScroll`'s `scrollTransmutation` branch, `transmuteCandidates`/`completeTransmutation`/`transmuteItem`, the generic `openItemPicker`/`chooseItemPicker` panel, the `WEP_TIER_CLASSES`/deck tables | Simplified - checked against tag `v3.3.8` (`ScrollOfTransmutation.java`, `InventoryScroll.java`, `Generator.java`). The per-category reroll is real: melee weapons reroll to a different class within the same `Generator` WEP_T1..T5 tier (preserving level/curse/`affix`/identified, mirroring `changeWeapon`'s carry-over); potions/scrolls/seeds/runestones reroll within their real 12-class decks (a different class, one unit of a stack, identified state preserved); rings reroll across all 12 real types (level/curse preserved, mirroring `changeRing`); the `cloak` artifact stand-in uses Java's own no-artifacts-left fallback (a random ring, curse preserved, flat +0). Reading consumes the scroll and logs the real `items.scrolls.scrolloftransmutation.morph` key; with no eligible target (or only defensively) it logs the real `nothing` key WITHOUT consuming, mirroring the `result == null` path. Simplifications, all stated: regular<->exotic flips collapse to a random different regular type (no exotic classes exist here - checked against source, `changeScroll`/`changePotion` are pure regular<->exotic flips); ineligible here - armor (never eligible in real Java either, no `changeArmor` exists), single-id `wand` (no class identity to change), `MagesStaff` (real `changeStaff` keeps the staff and re-imbues its wand only), thrown-stone ammo (a bare count; real Java likewise excludes plain `Dart`), unique `hourglass`, and equipped gear (tier fields/ring slot, not bag items - real Java's picker includes them). **The target-selection half is now real, not auto-picked**: a generic item-picker panel (`openItemPicker`/`chooseItemPicker`, modeled on `InventoryScroll.itemSelector`'s contract - eligible rows, a cancel row, the real `inv_title` prompt, scroll consumed only inside `completeTransmutation`, snapshotted pick re-validated against the live bag like Java's own FIXME check) replaced the first-eligible auto-target and its upgrade/identify deprioritization hack; a `scrollTransmutation` stack of 2+ is self-eligible (Java's `item != this || quantity > 1`, consuming two units total, matching detach-then-detach). The picker is built generic for reuse by the other picker-blocked uses (Enchantment/Intuition/DetectMagic stones, shop buy/sell, alchemy). **Missile, tipped-dart, wand and pickaxe rerolls ported 2026-09-17**: `changeWeapon`'s missile half rerolls a carried stack to a different class in the same `misTiers` tier read off the authored `missiles.mwl` rows (level, quantity and 100-point wear kept; a new set minted whose level the scene records in the `UpgradedSetTracker` threshold map, and the old stack detached whole - `completeTransmutation` removes the full quantity for `missile_*` picks, since removing one unit would duplicate the rest). `changeTippedDart` rerolls a different tip as one fresh level-0 full-wear unit with its own new set. `changeWand` rerolls a classed carried wand to a different class from the authored wand rows (the classless shared `wand` entry stays ineligible, and the wielded wand is scene-level state, not a bag item). The tier-2 pickaxe rerolls into a real tier-2 weapon outside the mining branch (the scene filters the branch). Pinned by `tools/verifyItemWorkflows.mjs`. Remaining toward full parity: exotic results, trinket rerolls (no trinkets exist here), `changeStaff`'s re-imbue (a tier-only model cannot re-imbue a staff's wand), and equipped-gear targeting. Gameplay-`Random` rolls (a live hero action, never the level-stream `SpdRandom`). The retired `port.log.transmutationfizzle` key is removed from both locales. Type-check/build/simulation/item suites green; browser verification owed per ROADMAP.md section 10. |
| `Bomb.execute(AC_LIGHTTHROW)`/`onThrow()`/`explode()`/`Fuse`/`DoubleBomb.doPickUp()` (light-and-throw, 2-turn fuse, range-1 blast for `NormalIntRange(4+scalingDepth, 12+3*scalingDepth)` minus armor on every char including the hero, chained bomb heaps, double heap picked up as 2 bombs with an English-only "1+1 free!" status) | `useBomb`/`detonateGroundBomb`/`tickBombFuses`/`removeGroundItem`, the `portItemKind`/`sourceInventoryItem`/`groundKindForItem` bomb branches, `ITEM_FRAME.bomb` (80 = `BOMBS+0`), the `bomb` bag id + `ac_lightthrow` inventory action, `ITEM_KEYS`/`GROUND_ITEM_KEYS`, `shopPricing`'s `bomb: 15` (`value()`), the `bonesEligible` denylist | Ported, checked against tag `v3.3.8` (`Bomb.java`). Lighting throws the bomb at the auto-targeted enemy's cell (no map-click aiming exists - the combat-stone convention), where it lands as a lit heap (red-tinted, `glowing()`'s red) with a real 2-turn `fuseTurns` countdown ticked once per hero turn from the end-of-turn pipeline (frozen by the Timekeeper freeze like every other actor, carried by ordinary ground payloads so floors/saves behave); stepping onto a lit heap snuffs it back into the bag with the real `snuff_fuse` key. The blast reuses the exact formula and hero-included absorption (plus the real `ondeath` line on a hero kill); chaining runs through the same routine with a visited set. Found and fixed alongside: every generated bomb never spawned at all (`portItemKind` returned null for `'bomb'`/`'doubleBomb'`, silently dropping Armory/Honeypot/Artillery loot - now a real `'bomb'` ground kind, frame 81 for double heaps); `bonesEligible` would have admitted bombs through the live bag (real `Item.bones` defaults false, `Bomb` never opts in - both ids denied). Stated gaps, not silent: the flood fill is passable-cell Chebyshev-1 (the `useStoneOfBlast` shape); flammable-terrain destruction has no primitive at any item site; `EnhanceBomb` alchemy and the 10 specialty bombs need the alchemy system; blast particles/sound have no seam here. Type-check/build only; browser verification owed per ROADMAP.md section 10. |
| `MissileWeapon.doThrow()` cell selection | `useSpecial`, `beginAiming`, `confirmAiming`, `cancelAiming` | **Ported (2026-09-13):** thrown specials now use MWG's renderer-free `TargetingController` with the existing six-cell range and line-of-sight rule, plus a scene validation hook that accepts only visible, living, hostile creatures. The controller opens without consuming anything; cancellation, out-of-range cells, walls, and empty cells leave ammo, durability, and the hero turn untouched. A legal confirmation latches the selected creature and re-enters the existing throw resolver, preserving the real warning, hit roll, drop/stick, durability, and turn-cost behavior. The six-cell ruler is retained from the previous auto-target path; projectile identity/ballistica and the remaining specialty missile effects are separate gaps. Browser-verified in the built game: opening the aim preserved ammo, the target preview rendered, and confirmation damaged the selected rat. |
| `Bomb.execute(AC_LIGHTTHROW)` cell selection | `useBomb`, `beginAiming`, `confirmAiming`, `cancelAiming`, `items/bombs.ts` | **Ported (2026-09-13):** bombs now use MWG's renderer-free `TargetingController` over a six-cell range, accepting passable non-chasm cells rather than auto-selecting the nearest enemy. Confirmation consumes and lights the bomb only after a legal cell is selected; cancellation and invalid cells are free. The existing Java-shaped occupied-character fallback (random free neighbour, otherwise the occupied cell), fuse payload, and explosion resolver remain unchanged. Browser-verified in the built game together with the thrown-weapon picker; specialty payload/terrain visual gaps remain tracked on the bomb row. |
| Creature-targeted wand cell selection | `useSpecial`, `beginAiming`, `confirmAiming`, `cancelAiming` | **Ported (2026-09-13):** all non-disintegration wand specials now use MWG's renderer-free `TargetingController` with the existing six-cell range and per-wand eligibility (enemy, ally, ward, or Earth Guardian). Confirmation re-enters the existing effect resolver, so charges are spent only after a legal target is confirmed. The port still restricts area-wand aiming to an occupied creature cell; Java's empty-cell collision targeting and each effect's exact ballistica remain separate gaps. |
## Everything still outside combat/terrain/dungeon structure

| `WandOfDisintegration.onZap()` beam, terrain bonus, and flammable-cell destruction | `useDisintegrationWand`, `useSpecial` | **Ported (2026-09-13):** the wand now uses its Java range `6 + 2*buffedLvl`, walks the WONT_STOP beam, counts solid cells with Java's 2/3 terrain accounting, destroys representable flammable terrain, and rolls damage for every eligible character on the path using `buffedLvl + hits - 1 + terrainBonus`. The port retains its existing NPC exclusion because it has no passive/visited NPC state; DeathRay particles and that passive-undiscovered filter remain unported. |

The Bulk armor curse is now live: while standing in a door, the shared action-cost model applies
Java's threefold speed increase. Metabolism is also live. Anti-Entropy now applies its 1-in-8
burning retaliation and dazes adjacent creatures; exact freezing-blob terrain interaction and
visual effects remain simplified.
Dazzling now applies its 1-in-10 impairment burst to the hero when the hero can actually see the
defender (10 turns, and 5 for every other visible creature), resolving on the hero's own swings; the
port uses timed daze in place of Java's separate blindness status, and the old third effect -
dispelling the hero's invisibility - was wrong and is gone (that line belongs to Annoying).
Corrosion now applies its 1-in-10 adjacent ooze burst as a real `ooze` buff (20 turns,
announced, own status icon) - CausticSlime/Acidic/FetidRat procs feed it too, no longer the
shared `poison` (real Poison sources - darts, sorrowmoss, venom, bleeds-as-poison - correctly
stay put). Ticks are `Ooze.act()`'s own depth curve (`1+depth/5` past 5, 1 at 5, coin-flip 1
in the Sewers, RESISTS-scaled for the hero) with the real `ondeath` line, and standing water
washes it off after the tick like Burning; duration refreshes rather than `extend()`-stacking,
and intensity is flat. The splash presentation is not modeled.
Displacement now has Java's 1-in-20 incoming-hit proc, relocating the hero to a free passable
cell and negating that hit. **Correction 2026-09-17:** destinations are no longer uniformly unchecked - every random teleport shares `randomFreeCell`'s Java `randomRespawnCell` constraints (passable, unoccupied, outside the hero's FOV, secret cells refused, pits refused), pinned in `simulation/teleport`; what stays simplified is the scroll's own unseen-room preference and LARGE/`openSpace`.
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

Remaining unported work: the majority of enchantment/glyph/curse *types* and all weapon Augments (see the dedicated enchant/glyph row above for exactly which are ported and why), complete weapon/armor tier and transfer formulas, upgrade-chance/curse-infusion odds, degradable gear beyond the stone coin-flip, shops beyond the depth-6 keeper's flat prices, challenge-specific generation/loot/boss branches beyond the persisted selector and stronger-boss stat modifier, and the remaining rare City/Halls content plus full boss arena scripts.

## Internationalisation (`messages/Messages.java`, `messages/Languages.java`, `assets/messages/**`)

The mechanism is `mwg/i18n`'s, the words are SPD's own. `mwg/i18n` supplies the catalog shape,
`{token}` interpolation, CLDR plural selection through `Intl.PluralRules` and the fallback to a
base language, so none of that is reimplemented; `src/i18n/` adds what is SPD-specific -
assembling a catalog per language, choosing the language, and Java's language-dependent
capitalisation rules.

| Java block | TS destination | Status |
| --- | --- | --- |
| `Messages.get(cls, key, args)`'s key derivation: the class's package path below the SPD root, lowercased, plus the key suffix (`actors.mobs.Rat` + `name` -> `actors.mobs.rat.name`) | `src/i18n/spdKeys.ts` | Ported - the port uses SPD's dotted keys **verbatim**, so any key greps straight back to the Java class that owns it and its `.properties` entry, with no mapping table in between. `$` separates a Java inner class, as in Java |
| `assets/messages/**/*.properties`: 9 domains x base English + 18 locales, 171 files | `src/generated/spdMessages.ts`, built by `tools/i18n-extract.mjs` (`npm run i18n`) | **Ported in full: 3,753 SPD keys x 19 languages.** The built page runs from `file://`, so the complete catalog is deliberately compiled in rather than fetched on demand. This makes every original string immediately available when its Java screen is ported; the cost is a materially larger game bundle. |
| Java text for screens/windows not yet implemented (`WndBag`/`WndUseItem`/journal entries/full talent trees/shop dialogue etc.) | Complete `src/generated/spdMessages.ts` catalog | Text is ported and callable, but its owning Java UI/feature is still not necessarily ported. This is intentionally distinct from a missing translation: MWG already provides generic windows, stacks, scrolling lists, icon grids and message boxes; each remaining item requires its SPD-specific data and interactions to be implemented. |
| `Item.itemComparator` / `Generator.Category.order(Item)` (including tier and special subcategory ordering) | `generatorItemOrder()` + `refreshInventoryPanel()` | Ported for the compact inventory payloads: concrete generated classes use the latest matching Java category, bombs sort after missile weapons, and regular potions/scrolls retain their Java subcategory positions. Unknown compact IDs use the Java sprite-order fallback; equal keys retain bag insertion order through the stable display sort. |
| `.properties` syntax (`=`/`:` separators, `\n`, `\uXXXX`, continuations, comments) and `String.format`'s `%s`/`%d` | `tools/i18n-extract.mjs` | Ported - placeholders are converted to `mwg/i18n`'s `{token}` form at extraction time, not at runtime |
| The complete key set to ship: SPD's every base key, plus every key the port actually asks for | `tools/i18n-extract.mjs`'s `referencedKeys()`, audited transactionally before any write | Ported, and **repaired 2026-09-12**. The scrape that finds keys the port references reads `t('...')` call sites everywhere except `src/i18n/spdKeys.ts`, where keys appear as table *values* - and there it used to accept every string literal in the file. That file also contains MWL tag/attribute/table names (`'effect'`, `'keys'`, `'potionAppearances'`, `'scrollAppearances'`) and an import specifier (`'../mwlContent'`), so the audit failed on six non-keys and exited before writing: `npm run i18n` could not regenerate the catalogue at all, and the failure had been noted as pre-existing rather than diagnosed. It now keeps only literals of SPD's real key shape (dotted identifiers, `$` for an inner class) - all 3,753 base keys match, none of the six do. `--check` is green: the committed `spdMessages.ts` is byte-reproducible (modulo git's CRLF checkout, now normalized in the comparison) from the SPD checkout's working tree, which is this file's real provenance rather than any tag. |
| User-visible `GameLog` messages | `main.ts` + `tools/i18nCheck.ts` | Ported at the output boundary - every direct `say()` literal was removed. Java-owned paralysis, roots and descent text use their original SPD keys; port-only mechanics remain under `port.log.*`. The localization verifier rejects any future direct quoted `say()` argument, so an English-only message cannot silently bypass the catalog. |
| Enchant/glyph/curse display names (`port.affix.*`, rendered by `itemDisplayName`) | `src/i18n/portStrings.ts`'s `//affixes` block (EN+FR) | Ported - all 32 affix ids now resolve instead of rendering raw keys. Values are SPD's own `<class>.name` strings (tag `v3.3.8`): weapon affixes keep the bare adjective (`blazing`), armor affixes the `of`-suffix (`of stench`); FR uses the masculine base form, since Java resolves its `(e)`/`(le)` markers by item gender and this port models no gender data. `swiftness` takes the armor form (it is armor-glyph-only). Type-check/build only; never visually confirmed, like every other locale string. |
| Every `this.say('literal English string' ...)` call site (as opposed to `this.say(t('port.…'), ...)`) | `src/main.ts` scene-log call sites; new EN/FR `port.log.*` entries | **Found and fixed: 33 hardcoded-English log lines had never gone through `t()` at all**, discovered while adding the `no_herbalism` challenge gate right next to one of them (`plantSeed`'s three lines). A full sweep (`grep "this\.say('[A-Z]"`) found the rest scattered across chest/hourglass unlocking, the sacrificial-fire reward, both wells, every `triggerPlant` branch (sungrass/nourishing-fruit/starflower/dewcatcher/seedpod/fadeleaf/mageroyal/icecap x2/rotberry x2/sorrowmoss/firebloom/stormvine/swiftthistle/generic-wither), chasm falling, both crystal-mimic reveal/escape/displace lines, the armor-displacement curse, the statue equipment drop, and all three hourglass-freeze lines - none of these had ever rendered anything but raw English text in a French (or any non-English) run, a real, previously-undiscovered i18n gap the size of the `port.affix.*`/dynamic-subclass-key finds above, just never swept for because these calls pass a literal string rather than a template key. All 33 now have real `port.log.*` keys with EN (the original wording, unchanged) and new FR translations, reconfirmed by rerunning the full `port.*` literal-key audit (0 missing in either locale, 258 keys now in use, up from 224). |
| The five boss-victory log lines (`bossTransitions.victory` in `scenario-rules.mwl`) | `dungeonScene.ts`'s boss-slain call site | **Found and fixed, 2026-09-14**: these were raw English sentences authored directly in the MWL table and passed straight to `say()`, which never translates its argument - the same `t()`-bypass shape as the 33-line and 6-line finds above, just missed because the string lived in authored data rather than a literal in `main.ts`. Every non-English run has always shown these five lines in English. The table now holds `port.log.bossvictory.<region>` keys instead, translated into all 19 offered locales (the boss names inside each translation are the real per-locale names already generated from Java, `actors.mobs.{goo,tengu,dwarfking,yogdzewa}.name`, not re-invented), and the call site reads `t(boss.victory)`. `i18nCheck` confirms all 19 locales carry all five keys (449 port strings, up from 444). |
| Quest objective text (`questDefinitions.description` in `scenario-rules.mwl`) | `journalContent.ts`'s Notes tab, `dungeonScene.ts`'s `questObjective` context field | **Found and wired up, 2026-09-14**: this data was real and authored but dead - `Rpg.QuestDefinition.stages[].description` is `mwg`-carried metadata the framework's own doc comment says it "never reads itself", and nothing in this port read it either (only `stage.condition` was ever checked). Not a live i18n bug like the boss-victory row above (nothing rendered it, so no untranslated text ever reached a player), but a real, if minor, silent gap - authored objective text with no display path at all. Now shown in the Journal's Notes tab under each quest's status line, only while an active stage names one; translated into all 19 locales as `port.journal.quest.<id>.objective`, kept short (not re-stating the NPC name already on the line above). `i18nCheck` confirms all 19 carry all four (453 port strings, up from 449). |
| `Languages.java`'s enum: native names, codes, and its own completeness assessment (`COMPLETE` 100% reviewed, `UNREVIEWED` 100% translated, `UNFINISHED` 80-99%; below 80% SPD does not ship) | `src/i18n/languages.ts` | Ported, status included - it is honest to show SPD's own assessment rather than implying every language is equally finished |
| SPD's filename suffixes are not always BCP-47 (`in` for Indonesian, where BCP-47 says `id`) | `Language.code` vs `Language.tag` | Ported - `code` names the file and is what the save persists, `tag` is what `Intl.PluralRules` gets. Conflating them degrades plural selection to the fallback rules *silently* rather than erroring |
| Language selection (SPD: a settings menu) | `TitleScene.showSettingsWindow` | Simplified: cycles the supported languages in Settings and persists the selection; no full language list. |
| SPD's pixel fonts (`assets/fonts/`, `RenderedTextBlock`/`PixelScene.pixelFont`) | `pixel_font.ttf` + global theme | Ported using the supplied scalable SPD pixel-font face; the fallback stack remains deliberately for scripts not covered by that face. |
| Right-to-left layout | `Catalog.direction`, set per language | **Unexercised** - SPD ships no RTL locale, so nothing here has ever laid out RTL. `mwg/ui` mirrors against `direction`, but this port has never tested that path and should not be described as supporting RTL |
Strings this port invented, which have no Java equivalent - the sealed-floor search hint, the
keybind cheat-sheet, port-only status text, and two names absent from this checkout's message
files - live under a `port.*` namespace (`src/i18n/portStrings.ts`, **415** strings and counting -
`port.affix.*` alone added 32 in an earlier pass). The prefix
is deliberate: a `port.*` key is a string SPD never had, not a missing translation, and the two
distinguish themselves at a glance. English and French are hand-written (415 keys each).
**German (`de`), Spanish (`es`), Portuguese (`pt`), Italian (`it`), Polish (`pl`), Russian
(`ru`), Turkish (`tr`), Ukrainian (`uk`), Hungarian (`hu`) and Dutch (`nl`) are now
supplied too** (German 2026-09-09, Spanish 2026-09-09, Portuguese 2026-09-09, Italian
2026-09-09, Polish 2026-09-09, all 375/375 keys at the time, Russian 2026-09-10, Turkish
2026-09-10, both 389/389 keys at the time, Ukrainian 2026-09-11, 415/415 keys
against the current EN table, Hungarian 2026-09-11, 415/415 keys, Dutch 2026-09-11, 415/415
keys, `unreviewed` status) -
machine-assisted direct
translations, not human-proofread, marked as such in `PORT_STRINGS_DE`/`PORT_STRINGS_ES`/
`PORT_STRINGS_PT`/`PORT_STRINGS_IT`/`PORT_STRINGS_PL`/`PORT_STRINGS_RU`/`PORT_STRINGS_TR`/
`PORT_STRINGS_UK`/`PORT_STRINGS_HU`/`PORT_STRINGS_NL`'s own doc comments rather than silently
claimed `complete`. All ten are real Java SPD locales - confirmed against
`src/generated/spdMessages.ts`'s own generated table, which exists only for languages SPD
actually ships a base translation for - so this only ever supplies the port's *own* invented
strings on top of a base catalog Java already covers, never invents a locale Java doesn't have.
Verified programmatically before being wired in (0 missing/extra keys vs EN, 0 `{placeholder}`
token mismatches across all 375, for each locale) and live in-browser (welcome log line,
bag/talent panels, class-select blurb, settings/badges/changes windows, and - for Portuguese -
the hero info panel's real Java strings too, confirming the whole locale resolves end to end)
all rendered correctly-composed text, no raw keys, no console errors, for all five languages.
Russian was verified the same programmatic way (389/389 keys, 0 `{placeholder}` mismatches);
its live in-browser pass is owed per ROADMAP.md section 10 (no working browser tool in that
session). SPD itself ships Russian as reviewed, but that status covers SPD's own `.properties`
catalog, not this port-only draft - recorded as `MT`/`machine` like the other five.
Turkish was verified the same programmatic way (389/389 keys, 0 `{placeholder}` mismatches;
its combat line `port.log.hit` uses verb-final `{subject} {object} {damage} {verb}` order with
an identical token set, accepted by the sorted-token QA by design); its live in-browser pass
is likewise owed per ROADMAP.md section 10.
Ukrainian was verified the same programmatic way (415/415 keys, 0 missing/extra, 0
`{placeholder}` mismatches - the EN table itself had grown to 415 keys by this pass, picking up
the alchemy/unlockhint/journal/bag keys added since the Russian and Turkish drafts, which is why
those two were short of the current EN count at that moment; that gap was closed the same
session in RU/TR and is not outstanding), formal «Ви» address
matching Russian's register as the closest sibling locale; its live in-browser pass is likewise
owed per ROADMAP.md section 10 (no working browser tool in that session either).
The Italian draft also caught a real transcription hazard worth reusing: a scripted
non-Latin-character scan (`/[Ѐ-ӿ一-鿿...]/`) over the finished draft file,
before wiring it in, caught one stray Cyrillic-character typo a manual read missed; the same
scan on the Polish draft found nothing, confirming it as a cheap habitual check rather than a
one-off fix. Ukrainian's own equivalent scan (Latin letters inside an otherwise-Cyrillic word)
found nothing either - every flagged Latin token was a legitimate untranslated proper noun
(`Shattered Pixel Dungeon`, `mwg`, `DM-300`) or a keybind letter.
Hungarian was verified the same programmatic way (415/415 keys, 0 missing/extra, 0
`{placeholder}` mismatches, via the same QA the earlier drafts used); its live in-browser pass is
likewise owed per ROADMAP.md section 10 (no working browser tool in that session). SPD itself
ships Hungarian as reviewed, but that status covers SPD's own `.properties` catalog, not this
port-only draft - recorded as `MT`/`machine` like Russian. Informal te-form address, matching
German's Du, Spanish's Tú and Turkish's sen-forms.
Dutch was verified the same programmatic way (415/415 keys, 0 missing/extra, 0
`{placeholder}` mismatches); its live in-browser pass is likewise owed per ROADMAP.md section 10
(no working browser tool in that session). SPD ships Dutch as `unfinished`, and this port-only
draft is `MT`/`machine` too. Informal je-forms.

**Found and fixed 2026-09-12: five more locales had silently drifted behind the EN table.**
`de`/`es`/`pt`/`it`/`pl` stood at 386/386/386/384/391 of EN's 415 keys - 142 strings missing
across the five (the alchemy UI/log/name block, the five class `unlockhint` lines,
`port.log.stoneflock`/`stoneaggression`/`wandcorrosion`/`wandcorruption`/`dm300arrives`, and the
journal/bag UI labels, all added to EN after those drafts were written and never propagated).
This is the same drift class the Ukrainian pass found in RU/TR, and it is invisible by
construction: `mwg/i18n` falls back to English for a missing key, so the failure mode is not an
error or a raw key but a single English sentence in the middle of an otherwise fully translated
run. All 142 are now translated in the same voice as each block, giving every non-English
catalogue 415/415 keys with 0 `{placeholder}` mismatches. Italian additionally appeared to be
missing the two wandmaker lines, but that was an artifact of the ad-hoc audit script's regex
not matching double-quoted values containing escaped `\"` - a reminder to compare the imported
tables rather than scrape the source.

The invariant is now enforced instead of hoped for. `tools/i18nCheck.ts` check 3 compares
**every** registered catalogue's key set and `{placeholder}` tokens against EN; it previously
compared only French (and only French's placeholders), which is precisely why five incomplete
locales passed it. Check 3c asserts every catalogue has a `PORT_TRANSLATION_ORIGIN` entry and
maps to a real `LANGUAGES` code - the old origin check listed nine hardcoded codes and had
already missed `uk`/`hu`/`nl`. To let the check compare tables without importing the `mwg`
runtime, the assembled catalogue map moved out of `index.ts` into `portStrings.ts` as an
exported `PORT_STRINGS`, which `index.ts` now imports like any other data. The new check was
verified to *fail* on a deliberately removed key before being trusted - not merely observed to
pass.

**All 19 locales done, 2026-09-12.** The seven languages that still fell back to English for
port-only prose - `zh`, `ko`, `ja`, `cs`, `in`, `vi`, `el` - now each carry a complete
415/415-key catalogue, so no SPD language falls back for anything this port wrote itself. Each
was drafted from `PORT_STRINGS_EN` with SPD's own vocabulary for the game's terms (read out of
the real `_xx.properties` at tag `v3.3.8`), then validated three ways before being wired: key
set, key *order* and sorted `{placeholder}` multiset against EN (415/415 on all seven); a
script-contamination scan for text in the wrong script (no Cyrillic or Latin inside Greek words,
no kana in Korean, no hanja where it does not belong, no Traditional characters in the
Simplified draft); and the project's own `tools/i18nCheck.ts`. Splicing is scripted, so the
2,905 translated lines never pass through a hand-transcription step.

Two of these are worth calling out beyond "counts match", because a count cannot see them:
- **Chinese** is Simplified only - the draft was scanned for the common Traditional-only
  characters (`們`/`這`/`來`/`為`/`說`/`時`/`過`/`戰`/`術`...) and contains none.
- **Japanese, Korean and Chinese** have no grammatical plurality, so where English distinguishes
  singular from plural (`port.log.hit` vs `port.log.hithero`, `port.log.miss`/`misshero`,
  `port.log.monkdodge`/`monkdodgehero`, `port.log.oozed`/`oozedhero`) each pair is deliberately
  identical rather than a translation oversight. Their `{subject}`/`{object}`/`{damage}`/`{verb}`
  placeholders are re-ordered into natural sentence order, which the token-set comparison
  accepts by design.
- **A glyph-coverage scan of all 19 locales found no tofu**, and it turned up two curiosities
  worth recording for where they live rather than for what they are. Both are in SPD's *own*
  tables, never in a port-only string, and both are harmless - but each is the reason the scan
  must ignore characters that draw nothing *by design* rather than only whitespace, since
  otherwise it reports a missing glyph for a character that is not meant to have one:
  Ukrainian `actors.buffs.frost.desc` contains a U+0301 COMBINING ACUTE (a stress mark, which
  only renders attached to the letter before it) and Portuguese
  `scenes.gamescene.blacksmith_quest_window` contains a U+200B ZERO WIDTH SPACE, twice. The scan
  now skips `\p{Cf}` (format) and `\p{Mn}`/`\p{Me}` (combining) characters. That the scan can
  fail at all was verified rather than assumed: with nine rare codepoints injected in place of
  English's single one, it correctly flagged the three that Chromium has no glyph for (the rest
  - Kharoshthi, Adlam, Old Turkic - really are covered by fonts Windows ships).

Every catalogue here is still `MT`/`machine`: a machine draft, complete but not proofread by a
fluent speaker, and marked that way in source and in `PORT_TRANSLATION_ORIGIN` rather than
silently upgraded.

**Found and fixed while verifying Spanish, but a real bug affecting French and German too, not
new to this pass**: `main.ts`'s `attack()` built the combat-log `object` slot for a hero
defender as a hardcoded English literal `'you'`, bypassing translation entirely - every
non-English combat log line read "...hits **you** for 3" / "...golpea a **you** por 3" instead
of a translated pronoun, for as long as French and German have existed in this port. The
`subject` slot one line above already did this correctly via `t('port.log.subject.you')`;
naively reusing that same key for `object` would have been wrong too, since it is the
capitalized/nominative form ("You"/"Vous"/"Du"/"Tú") meant for sentence-initial use, not the
lowercase/case-inflected form an object position needs (English "you" lowercase, French
"vous", German accusative "dich", Spanish "ti" after the templates's own "a"). Added a new
`port.log.object.you` key to all four locales and fixed the call site to use it. Verified live
by calling `attack()` directly through `window.__MWG__.currentScene['attack']` for a scripted
hero-vs-monster exchange in all four locales after the fix: `"Marsupial rat hits you for 2."`
(en), `"Rat marsupial touche vous pour 2."` (fr, pre-existing word order unchanged - not part
of this fix), `"Beutelratte trifft dich für 2."` (de, now correctly accusative), `"Rata
marsupial golpea a ti por 2."` (es, now grammatically correct instead of "a you").

The remaining 7 `Languages.java` locales still fall back to English through
`mwg/i18n`'s base catalog - translating them is tracked as its own ROADMAP.md section 8 item.
**Closed 2026-09-12**: all seven now have catalogues, so no locale falls back for port-only
prose; see the "All 19 locales done" section above.
**Recurred in miniature, 2026-09-14**: six later-added `port.log.*` keys
(`curseinfusion`/`magicalinfusion`/`beaconreturned`/`summonelemental`/`reclaimtrap.stored`/
`.placed`) had been added to `PORT_STRINGS_EN`/`PORT_STRINGS_FR` only, silently falling back to
English in the other 17 - the same drift-then-silent-fallback pattern as 2026-09-12's five-locale
back-fill, just smaller. `npm run verify`'s `i18n:verify` step catches this (it failed with all 17
listed as missing exactly those six keys), which is how it surfaced. Fixed the same way: machine
draft each locale's translation from the EN/FR pair and splice it in at the EN/FR position via a
script rather than by hand. `i18nCheck: OK - 524 mapped keys, 444 port strings, 19 languages`.
Separately, the locale *set* is still SPD `v2.1.4`'s 18 non-English locales rather than
`v3.3.8`'s 22: `be`/`eo`/`sv`/`zh-hant` are absent from both `LANGUAGES` and the extractor's
`LOCALES`. That gap is **still open**, and closing it is now known to be a scoped migration
rather than a one-line list change: eight keys the port references exist in the v2.1.4-derived
catalog and do not exist at `v3.3.8` at all (`actors.mobs.dm300.rocks`/`.vent`,
`items.quest.pickaxe.ac_mine`/`.no_vein`, `levels.level.sign_desc`/`.sign_name`,
`scenes.titlescene.badges`, `windows.wndjournal.notes`), so the extractor's transactional audit
refuses a `v3.3.8` regeneration until each is re-pointed at its new Java name or moved under
`port.*`. Recorded under ROADMAP.md section 8.

`tools/i18nCheck.ts` guards the convention: every SPD-derived key the port uses must exist in
SPD's own base `.properties`, so a typo'd key **fails the check** rather than quietly rendering
English - which is the entire benefit of matching Java's key names, and worthless if a wrong key
can pass silently.

**Not visually confirmed.** The Chrome extension has been disconnected for this whole stretch, so
no locale has been seen rendered. The check above proves 138 keys resolve across 19 languages and
that interpolation produces the expected output; it cannot prove text fits its widget or that the
font stack actually covers a script. A CJK locale is the one most likely to be wrong, since that
is where a missing font shows as tofu.

## Audio and splash art (`watabou.noosa.audio.Music`/`Sample`, `Assets.Splashes`)

Found by the same asset audit as the UI-chrome gaps above (`interfaces/boss_hp.png` etc.):
comparing what `core/src/main/assets/` actually contains against what `web-mwg/src/assets/`
copies. `music/` (8.2 MB of `.ogg` tracks) and `sounds/` (581 KB of SFX) together dwarf every
other asset category, and neither has a single byte copied into this port. `splashes/`
(976 KB of per-class portrait art) is now ported; music/SFX are not. None of this was
previously recorded here.

| Java block | TS destination | Status |
| --- | --- | --- |
| `Music.INSTANCE.play`/`playTracks`/`volume`/`enable` (`SPD-classes/.../audio/Music.java`), called from ~21 sites incl. `TitleScene.create()`'s theme music | `src/audio.ts` (`mwg/Audio.Music.playTracks`) | Ported - all shipped region, boss and title OGGs are bundled for `file://`; title and normal-region pairs now advance at each completion instead of looping only the shorter `_1` file, while boss tracks loop. Browser autoplay policy necessarily prevents an audible title track before a gesture. The original's optional extra `_2` selection is simplified to one guaranteed `_2` per cycle. **Extended 2026-09-12 with the endgame pair, and correcting a wrong claim this port had been carrying**: `LastLevel.playLevelMusic()` was described as "the Java endgame vault is intentionally silent" - it ends the music only once `Statistics.amuletObtained` is true, and loops `Assets.Music.THEME_FINALE` until then. `theme_finale.ogg` was not even in `src/assets/audio/music/` (it is now, copied byte-for-byte from tag `v3.3.8`), and `SpdAudio.vaultMusic(amuletObtained)` reproduces both branches; `Amulet.doPickUp`'s `showAmuletScene(true)` also plays the title pair now via `SpdAudio.winMusic()`, in `AmuletScene.create()`'s own order (`THEME_2` then `THEME_1`, the reverse of `TitleScene`'s). The vault's own `CustomTilemap`s react to the same flag - see the `LastLevel` row below. |
| `Sample.INSTANCE.play`/`playDelayed` (`SPD-classes/.../audio/Sample.java`), called from ~255 sites (every hit, miss, pickup, level-up, door, footstep, UI click) | `src/audio.ts` (`mwg/Audio.Sound`) + gameplay call sites | Ported as the shared system and core gameplay cues - the complete shipped MP3 catalog is bundled; MWG pools overlapping instances; hit, miss, death, pickup/gold/dew, level-up, doors and hero footsteps now play their real clips. Remaining less-common Java call sites can be attached by their clip basename through `audio.cue()` without adding another audio implementation. **Extended 2026-09-15: pitch is carried (MWG 0.13.0's `Sound.play(gain, pitch)`, new in 0.12.0).** `cue(name, volume, pitch)` passes it through, and the only two cue sites with a real Java value use it: the hero's footstep, `Random.Float(0.96f, 1.05f)` (`Hero.java` 2055 - the `STEP` branch, the clip this port's single footstep cue maps to) and the gold pickup, `Random.Float(0.9f, 1.1f)` (`Gold.java` 70 and `ItemSprite.java` 170). Java's plain `play(id)` sites are pitch 1, which is what every other cue passes - no site was given a value Java does not have. Java draws these from the run-level generator `Dungeon.init()` pushes; this port's in-play randomness is MWG's `Random` (the `SimulationRandom` default), so the draw goes there. **Not ported, each with its reason**: Java's stereo `play(id, leftVolume, rightVolume, pitch)` (`Sample.java` 111) has no expression in MWG - its own `play` doc states a plain `<audio>` element has no pan to set - so this is a framework limit rather than a port choice; the per-weapon hit sounds (`KindOfWeapon.java` 48-49/267-268 `hitSound`/`hitSoundPitch`, `Hero.java` 409-414, `Char.java` 427's `Random.Float(0.87f, 1.15f)`) are collapsed into this port's single `hit` cue, and the two clips bundled for them (`atk_crossbow.mp3`, `atk_spiritbow.mp3`) are never cued; and Java's terrain-selected footstep clips (`Hero.java` 2036-2057: `WATER`, `STURDY`, `GRASS`/`TRAMPLE`, else `STEP`) are not selected - one clip plays on every terrain. |
| **Cost of the two rows above, stated plainly per this file's own convention (see the splash-art row below):** `src/assets/audio/` is **8.8 MB** on disk, `pixel_font.ttf` a further 60 KB, both base64-inlined for `file://` the same way every other asset here is - `game.js` grew from **2.97 MB to ~15 MB** (1.75 MB to ~10.6 MB gzip) once music, SFX and the pixel font all landed together. Audio does not compress further under gzip any more than the splash JPEGs do. |
| `HeroSelectScene.java` layout and selection | `src/scenes/classSelectScene.ts` | Ported structure: two rows of compact hero buttons at left in landscape, bottom strip in portrait, selected splash art, separate Start, back action, locked/unselected portrait dimming. Six classes are retained from the port, while this Java checkout has five. Simplified: short class descriptions and inline lock hints replace WndHeroInfo/WndMessage; splash transition, timed UI fade and game-options panel remain unported. |
| Platform startup asset loading before the title splash | `index.html` startup curtain, `main.ts` `updateStartupProgress`/`revealTitleSplash` | Simplified web equivalent: Java delegates startup progress to its platform asset pipeline, while this file://-compatible port exposes the real asynchronous font/sprite stages with a lightweight pixel-style progress bar. The curtain is removed only after `TitleScene` has been created, so the splash is the final startup surface. |
**Correction, since superseded by the rows above:** an earlier draft of this section claimed
audio needed a `mwg` capability that did not exist yet. That was wrong even at the time -
`mwg` already shipped `src/audio` (`Sound`, `Music`, `Playable`, `Orchestrator`, exported from
`mwg`'s root), a pooled-SFX/streaming-music API mapping closely onto Java's `Sample`/`Music`
shape - the gap was real but the blocker was not: nothing was missing from the framework,
`main.ts` had simply never been wired to it. All three of audio, splash art and the pixel font
are now ported (rows above); none of the three needed anything new from `mwg` itself, matching
what this correction already said about audio and splash art specifically. The pixel-font row
above was, at the time this paragraph was first written, a genuinely different and still-open
case (`mwg` had no bitmap-font `Label`) - it has since been closed by bundling SPD's own
scalable pixel-font face directly rather than waiting on that framework capability, so it no
longer illustrates the distinction this paragraph originally drew. Left here as the record of
a real self-correction rather than deleted.

### Visual parity pass (2026-09-05)

Compared the checked-in Java TitleScene, HeroSelectScene, PixelScene, Chrome,
StyledButton, HeroSprite and StatusPane against the active MWG TypeScript implementation.
The archived web-ts tree is not the active application.

| Area | Result | Remaining differences |
| --- | --- | --- |
| Title | Java menu geometry, icon crops, chrome and pulsing signs | Support/news/rankings/about remain port information windows; no desktop process-exit action |
| Hero selection | Compact responsive buttons, selected splash, explicit Start | Inline descriptions, six classes, no Java hero-info/options/fade system |
| HUD | Avatar, level/XP placement, black empty HP background, compass center | Fixed 2x small HUD; hover details, no shield overlays or large interface |
| Camera | Removed map-edge clamp to match GameScene hero-centred framing | MWG smooth following retains its existing deadzone |
| Controls/log | Original toolbar.png frames and bag/search/wait icons, four item slots, bottom-right grouped layout, log above controls | Fixed actions replace assignable quickslots; extra actions use an expandable menu. Cleric special uses a wand placeholder because this checkout predates the tome asset. Keyboard hint line hidden |
These changes improve visual parity; they do not claim complete Java rendering parity.
Terrain overlays, particles, inventory windows and unported screens still have the
limitations listed in their respective sections above.

Validation: TypeScript checks and production build passed. Playwright visually checked
title, settings, hero selection and gameplay at 390x844 and 1280x800; class selection,
Start, Wait and the extra-action menu worked. The corrected camera placed the hero at
(640,400) in the 1280x800 viewport, and the log ended eight pixels above the toolbar.
Only the missing development favicon produced a browser console error.

### Visual parity continuation (2026-09-05)

#### Terrain and monster rendering follow-up

`visualWalls.ts` now reads Java terrain identities independently of collision kinds.
It implements wooden wall interiors, decorated/wooden overhangs, locked and crystal
door variants, statue/alchemy/barricade overhangs, and upper grass blades. Door frame
orientation now uses the north neighbour, as `DungeonTerrainTilemap` actually passes
it to `getRaisedDoorTile`. Trampling updates both grass layers and the overhang above.
Mining-branch `CavesPainter.decorate()`'s standalone global scans are now implemented: real
`EMPTY_DECO` floor decoration and mineable `WALL_DECO` ore veins are generated after the branch's
water/grass pass, matching Java's null-room painter order. **Still divergent, recorded 2026-09-16:**
that path does not take Java's `Random.pushGenerator(Random.Long())` before its water/grass/deco
block, so all three draw straight off the level-gen stream instead of a `Long()`-seeded substream -
one parent draw plus the substream's own contents. The branch floor therefore does not place its
water, grass or deco where Java's does, even though the code that places them is the same. (The Caves
boss floor, which also has no room list, *does* push - see the `DM300` row.)

The real terrain-features atlas is now rendered beneath actors. Trap and plant frame
indices are extracted from the checked-in Java classes; hidden traps remain hidden.
Regional grass details are included. Unknown plant classes from later game versions
remain blank, and plant growth effects and embers overlays remain unported. Trap
activation and plant interactions now include the single-target Java effects and
Sungrass healing state described above; Dewcatcher and Seedpod release their
Java-sized distinct-neighbour drops; area effects, exact teleport/TimeBubble
behavior, seed growth/Lotus preservation, and embers overlays remain unported.

MWG `AnimatedSprite` and `Tweener` now drive literal Java idle/run/attack clips and
0.1-second movement for monsters. Browser verification instantiated all 39 supported
monster/NPC types without atlas errors: 33 received clips; gnollTrickster, greatCrab,
shaman, dm300, elemental and yogFist retain their static frame. Compound/shifted films,
death animations, sprite particles and special attack sequences remain outstanding.
No generic animation implementation was added to SPD or copied into MWG.

Validation: typecheck and production build passed; `tools/verify-visual-walls.mjs`
checks structural terrain, door orientation, wooden interiors, grass alternates and
map edges. Desktop and portrait browser screenshots checked a terrain fixture with
bookshelf, statue, alchemy pot, tall grass and a revealed toxic trap. Monster movement
was checked at halfway and completion. Full visual parity remains unfinished,
especially fog, special effects and the previously listed unported screens.

Reusable tools retained in `tools`: `extract-terrain-visuals.py`,
`extract-sprite-animations.py`, and `verify-visual-walls.mjs`.

Framework extraction: MWG `ButtonOptions.skin` now owns per-button nine-patch
chrome, resizing and input-state tints; `ButtonOptions.label` and `LabelOptions`
own caption outlines, texture resolution and pixel rounding. `SpdButton` and
`SpdLabel` supply only this game's style values. No Java code or assets were moved
into MWG. The former hidden-background and child-inspection workarounds are removed.

The following supersedes the inventory, water and hover-detail limitations of the
initial visual pass. Reference code includes WndBag, ItemSlot, Chrome, WaterTilemap,
Ripple, DungeonTileSheet, HeroSprite, CharSprite and BossHealthBar.

- Inventory now uses native WINDOW chrome and a five-column equipment/item grid,
  item sprites, quantities, upgrade markings and item-action windows. Equipment
  slots and carried items are separated. Sub-bags and full Java item descriptions
  still require implementation.
- Water uses the five regional water textures, continuous scrolling, shoreline
  masks and movement ripples. Terrain now uses raw Java paint values for raised
  features, decorated floors, grass and chasm edges. Visible tiles use full color;
  explored tiles are darkened. Java's half-cell fog, feature overlays and complete
  wall stitching remain different.
- Cloth-tier hero idle, movement and attack animations use Java's frames and rates,
  with 0.1-second movement interpolation. Other armor tiers, monster animation,
  death/read/zap sequences and most particles remain outstanding.
- Clicking the portrait opens a native-chrome statistics window. Hunger buffs,
  boss-bar texture geometry, outlined labels and log text scaling are implemented.
  Java's tabbed hero window, shields, large-interface mode and assignable quickslots
  remain outstanding.
- Title arches now fade downward, matching the running Java desktop reference.
  Dialogs scale with the menu, and badges use a five-column icon grid. Several title
  actions still show port-specific information rather than Java's full screens.

Validation: production build (including TypeScript checking) passed. Browser checks
covered desktop title, hero selection, starting a run, hero statistics, and the
390x844 inventory layout. Selecting and consuming food was checked in the browser;
regional water and terrain were visually inspected. A malformed source byte in the
statistics heading found during visual checking was corrected. Full visual parity
is not yet achieved; the outstanding items above are actual unported behavior.

### Prison room-graph "attempts" divergence closed - test-tool bug, not a port bug (2026-09-06)

Sub-pass 10 (above) proved the "attempts mismatch" was a measurement artifact for the 16
Sewers combos (4 seeds x depths 1-4) and closed it there. That investigation's `attempts`
comparison never covered Prison (depths 6-9), and a fresh `graphAttempts` instrumentation pass
(temporary `RegularLevel.ATTEMPT_HOOK`/`GRAPH_DONE_HOOK` in Java, rebuilt via
`gradlew :desktop:runHarness`, and matching trace hooks in `spdRng.ts`/`regularLevel.ts` - both
removed after use, none left in the tree) found the same class of bug recurring there for a
different reason:

`tools/verifyLevelGraph.ts`'s `resetRunStateForSeed()` never called `resetWandmakerRunState()`
between seeds (unlike `tools/verifyLevelPaint.ts`, which already did). Since `Wandmaker.Quest`'s
`type`/`spawned` fields are real run-level state (like `SpecialRoom`/`SecretRoom`'s queues), this
let a Prison run's quest roll leak into the next seed's Prison floors, producing a phantom extra
`massGrave`/`ritualSite`/`rotGarden` special room on depth 6 (where the real `depth > 6` gate
should forbid it entirely) and cascading room-count/attempt mismatches through depths 7-9. Fixed
with one added `resetWandmakerRunState()` call in that function.

A second, narrower limitation was found and documented (not fixed, since it's inherent to what
the tool does): `verifyLevelGraph.ts` only runs the room-graph stage, never `paintPrisonLevel()`'s
`decorate()` step - so `Wandmaker.Quest.spawned` never becomes `true` there (that only happens
inside `spawnWandmaker()`, called from paint). A floor whose graph rolls the quest room will roll
it again on a later floor in this tool, where the real game and `verifyLevelPaint.ts` (which does
run paint) would not. `verifyLevelGraph.ts` now carries a comment pointing at
`verifyLevelPaint.ts` as the trustworthy comparison for any Prison depth-6-9 question.

**Result, re-verified against a fresh Java harness dump with `graphAttempts` exposed
end-to-end**: all 32 tested (seed x depth) combinations - the same 4 seeds across Sewers 1-4 and
Prison 6-9 - now match Java exactly via `verifyLevelPaint.ts`: room count, room-graph retry
count, and (spot-checked for seed 42 depth 3 via full RNG call-trace diffing, 599 draws including
both failed attempts and the successful one) byte-for-byte identical draw order. There is no
remaining room-graph divergence for either region across this test matrix. The seed-42-depth-3
case specifically named in earlier sub-passes as unresolved is confirmed closed - its `18=18`
room composition and `3=3` attempts are exact, not coincidental.

### Sewers boss level (depth 5) wired in (2026-09-06)

Every prior pass (including this file's own `PORTED_DEPTHS` doc comment) stated that no boss
level could be ported because all five boss levels "extend `Level`, not `RegularLevel`". That
was true for four of them but never checked against the fifth: **`SewerBossLevel` actually
extends `SewerLevel` -> `RegularLevel`** (confirmed by reading the real Java source directly) -
a genuine room-and-corridor floor, generated by the same `FigureEightBuilder`/`SewerPainter`
pipeline this port had already verified for depths 1-4, with a few boss-specific overrides
grafted on. `PrisonBossLevel`/`CavesBossLevel`/`CityBossLevel`/`HallsBossLevel` (depths 10, 15,
20, 25) genuinely do extend `Level` directly - hand-built fixed-layout arenas with entirely
bespoke boss-fight scripts and no room-graph to port. Their stable layouts are now represented
in `bossLevels.ts`; the remaining gaps are boss-specific scripts and visual behavior.

**What's ported, RNG-faithful:**
- `SewerBossLevel.builder()` (always a `FigureEightBuilder` with fixed shape/path/tunnel
  parameters, unlike the normal 50/50 Loop/FigureEight roll) and `initRooms()` (a
  `SewerBossEntranceRoom`/`SewerBossExitRoom` pair, 3 filler `StandardRoom`s forced to NORMAL
  size via a second `setSizeCat(0,0)` roll, one of the 4 `GooBossRoom` variants picked by
  `Random.Int(4)` as the loop's forced landmark room, and a `RatKingRoom`) - see
  `regularLevel.ts`'s `sewerBossPickBuilder()`/`sewerBossInitRooms()`.
- All 4 `GooBossRoom` subclasses' `paint()` (`DiamondGooRoom`/`WalledGooRoom`/
  `ThinPillarsGooRoom`/`ThickPillarsGooRoom`) - pure geometry, zero `Random.*` calls each,
  confirmed by reading all four Java files. `rooms/sewerBoss/gooBossRoom.ts`.
- `SewerBossEntranceRoom`/`SewerBossExitRoom.paint()` (`rooms/sewerBoss/entranceExitRoom.ts`) and
  `RatKingRoom`'s room shell/door/chest-position RNG (`rooms/sewerBoss/ratKingRoom.ts`) - the
  latter burns every `Random.IntRange`/`random()` draw the real `paint()` makes, in the same
  order, and now also drops the real content (gold CHEST heaps + the king himself).
- `SewerBossLevel.painter()`'s fixed 0.50/5 water, 0.20/4 grass, and `nTraps()=0` (no traps at
  all) - `sewerPainter.ts`'s `paintSewerBossLevel()`.
- Verified against a real Java harness dump (`LevelGenHarness.java`'s `depths` array now
  includes 5, constructing a real `SewerBossLevel`): **room count, room kinds, and room
  rectangles are byte-identical to Java across all 4 tested seeds** (123456789, 1, 42,
  999999999999) - `EmptyRoom`/`RingRoom`/`SewerPipeRoom` filler selections and all 4
  `GooBossRoom` variant picks matched exactly, not just in count.

**What's NOT ported, and why:**
- **`RatKing` NPC** - now ported (this pass): the room drops real `Gold(10-25)` CHEST heaps
  and spawns the king himself (own byte-for-byte `ratking.png` at the real 16x17 film,
  sleeping NPC with the real `not_sleeping` wake yell and the `what_is_it` fallback).
  The crown exchange stays blocked - no King's Crown item and no Ratmogrify armor
  ability exist yet. See the NPC section's new row.
- **`GooBossRoom.setupGooNest()`'s `GooNest` decal**, and `SewerBossExitRoom`'s
  `SewerExit`/`SewerExitOverhang` decals - purely cosmetic custom tilemaps this port has no
  decal-layer asset for.
- **The `seal()`/`unseal()` mechanic** (sealing the hero into the boss arena - entrance flips to
  `WATER`, exit is genuinely locked - while `Goo` is awake). The `seal()` half is ported -
  see the Goo row's own 2026-09-14 note. **The `unseal()` half is now ported too, and with
  it the whole auto-descent flow is gone (2026-09-16):** no boss death advances the depth
  directly any more. Goo's death restores the entrance to `ENTRANCE` (`applyGooDeathUnseal()`)
  and every boss floor gains a real walkable exit at Java's own exit cell
  (`applyDM300DeathUnseal()` clears the gate's five `SIGN` cells to `EMPTY` and clears the
  pylon energy with an arena-visuals re-map to the broken `32..36` frames;
  `applyKingDeathUnseal()` opens both arena doors and spawns the Imp shop when the quest
  is complete; `applyYogDeathUnseal()` restores the entrance, sets the `EXIT` tile and
  swaps the centre pieces to their portal/archway variant; Tengu's `setMapEnd()` transition
  already worked this way). Each sets `hasStairs`/`stairs` at that cell - the hero walks out
  through the ordinary stairs path, which is also what persists the unsealed floor. The
  unsealed set (`bossUnsealedDepths`) is run-persisted: on reload the paint writes are
  re-applied in `enterLevel` (the live terrain itself survives via the floor capture) and
  the stairs half is repaired after `restoreFloor`. The exit tile still paints as the real
  `Terrain.LOCKED_EXIT` and maps to `'wall'` (already true before this pass,
  since it was listed as "boss-floor gating; unreachable on the ported regular floors") - it is
  simply never meant to be reached.
- **`SkeletonKey`/`GooBlob` drops** on Goo's death - no key-per-lock or bonus-loot system exists
  for them; moot anyway given the point above.
- `main.ts`'s existing generic boss-floor convention - `populate()` spawns `BOSSES[depth].kind`
  at `this.level.rooms[rooms.length-1]` - was **not** changed; instead `gameBridge.ts`'s
  `extract()` reorders the returned room list so the `GooBossRoom` is always last, satisfying
  that existing contract without touching `main.ts` at all.

**Layout audit, 2026-09-16 - the arena shapes were all read inclusively, and two were the wrong
shape entirely.** Java's `Painter.fillEllipse`/`fillDiamond` take a `Rect` plus a margin, and a
plain `Rect`'s `right`/`bottom` are exclusive edges, so the shape is the rect's own extent
(`right - left`) inset by the margin. The port was passing the *inclusive* extent instead, one
cell too wide and tall on each axis, and `CityBossLevel`'s throne room was drawn as an ellipse at
all when Java carves it with `fillDiamond` - a 45-degree square, 81 cells against the ellipse's
~154, whose bounding corners are solid wall. Corrected through `paintLevel.ts`'s new
`fillEllipseRect`/`fillDiamondRect` (with `fillDiamond` itself moved out of `gooBossRoom.ts`,
which had the only faithful copy): the Caves arena is Java's 23x23, Tengu's is 13x13, and the
King's is the diamond. `verifyVault.mjs` now recomputes each shape from Java's own arguments and
compares it against the generated floor, which fails on the wider reading (proved by restoring
it), and the live floor is checked by `tools/scratch/city-arena-livecheck.mjs` (6/6 - the
walkable set *is* the diamond, and its bounding corners are chasm through the scene's own
predicate). This also uncovered a real hole in `gameBridge.ts`'s terrain table: `REGION_DECO` and
`REGION_DECO_ALT` had no `toGameTerrain` mapping at all, so the Caves' two exit-corridor rails -
Java's `Painter.fill(this, 9, 3, 1, 6, REGION_DECO_ALT)` and its mirror at x=23 - could not be
painted without crashing level entry (`no mapping for Terrain value 34`). Both now map to
`floor` and the rails are painted. **Still open from the same audit, each needing its own pass:**
the City entrance room never paints Java's outer `WALL` ring or its insets 1/2 (the port paints
the whole entry rect `EMPTY`, so row 37 is floor where Java has wall), nor its two `BOOKSHELF`
columns, two `REGION_DECO` marks, three `STATUE` rows, its `EMPTY_SP` spine or the arena's
`fill(arena, 5, EMPTY_SP)`/`fill(arena, 6, CUSTOM_DECO)` margins, and its arena statues sit a row
low with two pedestals on cells Java uses for statues. **The Halls is the largest of the three and
is not decoration-only**: the five approach arms' extents are hardcoded here where Java rolls each
one (`IntRange(ROOM_TOP-1, ROOM_TOP+3)`/`IntRange(ROOM_BOTTOM+2, ROOM_BOTTOM+6)` for `i == 0 || 4`,
similarly for the other two classes), so the arms are wrong *and* ten `Random.IntRange` draws are
never consumed; the three whole-floor `Patch` passes Java runs after them (`0.20f`
`REGION_DECO`/`STATUE` by `distance(i, bossPos) + Random.Int(5) >= 10`, `0.30f` `WATER`, then 1-in-4
`EMPTY_DECO`) are missing entirely, with their draws; and the room is missing Java's 11x11 `EMPTY`
ring at (11,7) and its `WALL_DECO` band (26 cells in Java against the port's 8) - Java's band being
solid, its boss room is 9x7 walkable against this port's 9x9, which is the Yog arena itself.
`addCagesToCells()` - now unblocked by the mapping fix - is still not painted either. (Both
sentences describe the pre-closure state; the two paragraphs below close them in order.)

**Closed 2026-09-16, except the decoration-only tail.** `cityBoss()` is now `CityBossLevel.build()`
statement for statement: the entrance room's `WALL` ring with insets 1 (`BOOKSHELF`) and 2 (`EMPTY`),
the two freestanding bookshelf columns, the two `REGION_DECO` marks, the three `STATUE` rows, the
`EMPTY_SP` spine, the `DOOR` (which is also the arena's bottom door) and the `ENTRANCE` at
`entry.center() + 2 rows` = (7,44); the diamond with its inset-5 `EMPTY_SP` / inset-6 `CUSTOM_DECO`
(`SIGN` stand-in) margins, the four statues, the four pedestals at `c±3` and the locked top door;
the exit hallway's `CHASM`/`EMPTY`/`EXIT` fills with the transition on Java's own (7,8); the Imp
shop's pedestal, two statues and corridor link (the room itself stays unpainted until `unseal()` -
`ImpShopRoom.paint()` is a no-op by design); the eight 2x2 `WALL` pillars; and
`new CityPainter().paint(this, null)`'s scatter at Java's own position via `cityDecorate.ts`
(the `cavesDecorate.ts` split repeated: a leaf module, so the fixed floor does not pull in the
room-graph pipeline) - 26 `EMPTY_DECO` / 12 `WALL_DECO` at seed 42, pinned in `verifyVault.mjs`.
`hallsBoss()` is now `HallsBossLevel.build()` in full: the five arms roll Java's own `IntRange`s
(ten draws), the `0.20f` scatter keys on Chebyshev `distance(i, bossPos) + Int(5) >= 10`, the 11x11
`EMPTY` ring lands at (11,7), the `0.30f` watering, the 1-in-4 `EMPTY_DECO`, the 9x9 `EMPTY_SP` room
with its 26-cell `WALL_DECO` band (pinned) and inner 3x4 `EMPTY`, the exit transition at (16,9) with
no `EXIT` tile yet (it sits in the wall band until `unseal()`), exactly one `ENTRANCE` on the middle
arm, and the trailing `REGION_DECO -> REGION_DECO_ALT` coin flip - with Java's own retry (up to 50
rebuilds) when no entrance-to-exit path survives. **Closed 2026-09-16, including the decoration-only tail.** `CustomGroundVisuals`/
`CustomWallVisuals` are transcribed statement for statement into `cityBossVisuals.ts` -
the exit-hall stairs run, pillar bases/tops, skull piles/tops, ground stitching, throne
carpets, the stairs' shadow and archway, with the `data[++i]` cursor pairs kept verbatim
(which is where transcription off-by-ones would hide) and `SIGN` read wherever Java reads
`CUSTOM_DECO`. `city_boss.png` was vendored but never loaded; it now renders through two
scene layers straddling the walls like the Caves maps, and the three examine branches
(skull piles, throne, summoning pedestals) answer with Java's own name-gating (only where
the ground map draws) - the upper-`EXIT` desc falls through to text-identical region
wording because HallsLevel's key postdates the catalogue (recorded in the locale-set
item), and upper `EMPTY_DECO` suppresses its desc exactly like Java's `""`. Pinned in
`verifyVault.mjs` (stairs rows, throne rows, pedestals, skulls, pillar pairs, shadow rows,
name-implies-drawn, deco suppression). Prison's `addCagesToCells()` scatters Java's own
five cells: `spdSeedForDepth(runSeed, 10, 0)` *is* `Dungeon.seedCurDepth()`, pushed the
same way over the same bit-matching LCG with the same call order
(`Int(4)`/`IntRange`/`IntRange` x5, wall-neighbour gate), so these are Java's cells rather
than an approximation - re-rolled onto each transition repaint from the same seed, the way
Java's three call sites do, with the run seed threaded from levelgen (`gameBridge.ts`)
and live repaints (`dungeonScene.ts`) alike. Pinned the same way (independent
recomputation of the five picks plus the validity gate, on start/pause/end).

(End of file)

## Fixed boss-floor layouts (depths 10, 15, 20, 25, 26)

`src/spdLevelGen/bossLevels.ts` now supplies dedicated fixed-layout floors for
Prison/Tengu, Caves/DM-300, City/Dwarf King, Halls/Yog, and the final vault.
Their Java dimensions, main approach/arena geometry, entrance cells, exit cells,
locked gates, chasm boundaries, statues, pedestals, and major decorative terrain
are represented as `PaintLevel` data and routed through `gameBridge.ts`.

The Amulet is now placed at Java's `LastLevel.AMULET_POS` (cell `12*16+8`,
coordinates x=8/y=12) by the vault's own entry (`populate()` on depth 26, guarded against
re-entry minting a second), rather than on the hero's arrival cell. The remaining differences are gameplay scripts rather than a
generic-floor fallback. Tengu now has a one-time phase relocation/trap burst; DM-300 now has
pylon proximity sealing, short energy pressure, and overcharge ground effects;
the King summon/barrier cycle is live; and Yog's three fists gate beams and
rotate four available debuffs. **The King's throne geometry and the Imp shop are now ported
(2026-09-16)** - see the audit-closure note above - as is the per-level `unseal()` on all five
boss floors, so no boss death auto-descends any more (see the Sewer-boss section's auto-descent
note). Exact floor shifting, rockfall/gas,
and final-vault visual/compass behavior still need dedicated scene systems; the
final-vault music stop is now ported. Caves' four pylon cells are represented as live
dedicated actors rather than inactive trap scenery; their remaining DM-300 lock/supercharge
coupling is tracked in the boss row above.

## Data-driven dispatch (2026-09-09)

User-flagged code-quality pass: `main.ts` had 205 `kind === '...'`/`id === '...'` string-compare
checks total (a full-file audit, not a guess), spread across ~19 functions rather than
concentrated in one place - `takeMonsterTurn` (43) and `spawnMonster` (37) were the two
genuinely large cascades, with `kill` (26), `attack` (21), and others smaller. Converted the
two largest independently-dispatchable cascades into `Record<Kind, handler>` registries:

- `quaffPotion`'s 39-branch `if (id === ...) else if (...)` potion-effect chain -> `potionEffects`,
  one entry per generated potion id, each handler doing exactly what its old branch did (same
  Java-source comments, moved onto their own entry). The `potionPurity` fallback and any
  genuinely unrecognized id still route through `applyPotionPurity` from `quaffPotion`'s own
  `else`, now with a `console.warn` guard - this exact silent-fallthrough shape (an unmapped id
  quietly acting as Purity) is the same bug class already found and fixed twice in this
  function's history (Frost, then Toxic/Paralytic Gas).
- `takeMonsterTurn`'s 236-line, 16-case non-adjacent "ranged special ability" cascade (every
  kind that does something other than melee or generic movement once `distance >= 2`:
  DM100/Shaman/Necromancer(+SpectralNecromancer)/Tengu/DM300/Yog/Warlock/Elemental/YogFist/
  Scorpio(+Acidic)/Guard/DM200/DM201/Spinner/Golem/Eye/GnollTrickster/GreatCrab) ->
  `rangedAiOverrides`, keyed by `monster.kind`. Each handler returns `true` if it consumed the
  monster's turn (the original branch's `return`) or `false` to fall through to the shared
  movement AI below (the original branch's condition failing, or no branch existing for that
  kind at all) - a direct behavior-preserving restructure, not a rewrite. Three cases that
  shared one underlying behavior via an `||`-joined kind check in the original cascade
  (Necromancer/SpectralNecromancer, Scorpio/Acidic, DM200/DM201) now share one helper method
  (`necromancerRangedTurn`/`scorpioRangedTurn`/`dm200VentAttempt`) referenced from two registry
  keys instead - DM201 additionally always returns `true` regardless of whether its vent
  attempt (delegated to the same `dm200VentAttempt`) actually fired, matching real Java's
  `IMMOVABLE` property that DM200 itself lacks.

Both refactors are a restructuring of *dispatch shape* only (linear string-compare cascade ->
O(1) keyed lookup), not a behavior or formula change - every case was checked against its
pre-refactor code path, and the harder ones (state-machine-shaped, not simple single-branch
effects) were browser-verified live post-refactor to confirm identical values: Eye's two-turn
charge-then-fire beam (including the 1/4-damage-while-charged interaction elsewhere in the
damage pipeline), Golem's teleport-plus-20-turn-cooldown (a second immediate attempt correctly
did nothing), Guard's chain-once-ever (a second attempt on the same Guard correctly did
nothing), DM200 (movable, resumes chasing when a forced-cooldown vent roll fails) versus DM201
(always immobile regardless of the same forced-cooldown vent-miss), GreatCrab's
every-3rd-turn movement throttle (no move on turns 1-2, moves and resets its counter on turn
3), Scorpio's ranged attack, Spinner's web-root, and Necromancer's full summon -> heal ->
adrenaline chain (skeleton healed exactly HT/5, then granted the haste stand-in on the
following turn once at full health). `tsc --noEmit` and `npm run build` both clean throughout.

`spawnMonster`'s 37-branch cascade was converted too, same pass: the 7-kind stat-override
ternary chain, the 10-kind base-alias ternary chain, and a 12-case sprite-texture-reuse chain
(the messiest of the three - inconsistent indentation from having grown by one clause per pass,
itself a live example of the OR-chain smell this file's section 11 already flagged) all became
real data tables in `monsters.ts` (`DEPTH_SCALED_STATS`, `BASE_KIND_ALIASES`,
`SPRITE_KIND_OVERRIDE`), plus `isNPC`/`isBoss`'s `||`-chains into `NPC_KINDS`/`BOSS_KINDS` sets.
The texture chain simplified further than a direct transcription: the original checked both
`kind` and `baseKind` (12 cases total), but every kind checked against `kind` directly
(`sentry`/`ratKing`/`rotHeart`/`rotLasher`) has no `BASE_KIND_ALIASES` entry, so `baseKind`
already equals `kind` for each of them - meaning a single lookup by `baseKind` covers every
case the original needed two dispatch passes for. Live-verified via direct texture-identity
comparison (spawning one of every affected kind and reading each sprite's underlying texture
source): `mimic`/`crystalMimic` share the dedicated `mimic.png` source, `piranha` uses
`piranha.png`, `bee` uses `bee.png`, and `statue`/`armoredStatue` use `statue.png`;
`greatCrab` alone continues to reuse `crab.png` because its Java sprite explicitly does so.
Every dedicated-asset kind resolves to its own distinct source - exactly
`SPRITE_KIND_OVERRIDE`'s intended grouping, no cross-contamination.
**2026-09-13:** the depth-scaled stat formulas that used to be hand-coded in
`DEPTH_SCALED_STATS` are now authored in `src/content/actor-rules.mwl`'s
`monsterDepthStats` table and evaluated by a closed adapter in `monsters.ts`. The table
preserves the real `Mimic`/`CrystalMimic`, `Piranha`, `Bee`, `Statue`, `ArmoredStatue`,
and `Sentry` formulas (including the Bee's depth-scaled HP fractions and the Mimic's
floor divisions); no gameplay formula was moved into generic MWG.
`tsc --noEmit`/`npm run build` clean throughout. See `ROADMAP.md` section 11's matching entry.

**2026-09-13:** Hero's shared starting HP 20, strength 10, attack skill 10, defense skill 5,
base evasion 5, and starting gold 0 are now authored in `actor-rules.mwl` and consumed by
scene initialization and save migration. These are the real Java `Hero` defaults; level growth,
class weapon factors, and runtime modifiers remain in TypeScript by design.

Hero level-up growth is now likewise authored in `actor-rules.mwl`: the real Java increments
are +5 maximum HP, +1 attack skill, and +1 defense skill per level. The scene retains the
stateful transition that applies those increments and preserves the HP delta.

The monster sprite-source override map is also now authored in `asset-references.mwl` and read
by `monsters.ts`; frame dimensions and idle-frame positions remain Pixi renderer metadata, not
gameplay content.

**Not a candidate for `mwg` itself** (the user asked whether this pattern belongs in the
framework): the *pattern* - a keyed handler registry with a "return true if you handled it"
contract, replacing a branch cascade - is genuinely generic and would be reasonable for `mwg`
to offer as a documented convention or small typed helper. But every handler *body* here is
concrete SPD monster/potion logic, which `CLAUDE.md`'s licensing-boundary section forbids
putting in `mwg` (MPL-2.0, must stay game-agnostic, never SPD-specific data or logic). Recorded
in `ROADMAP.md` as a possible upstream proposal for the user to raise in the framework's own
repo, not something actionable from inside this one.

## `mwg` 0.5.0: `core.ReactionTable` adoption (2026-09-09)

`mwg` bumped 0.4.2 -> 0.5.0 (`package.json`, already installed - `node_modules/mwg/package.json`
confirms `0.5.0`). This release ships `ReactionTable<TState>` (`mwg/core`): edge-triggered
`{id, when, action, once?}` rules evaluated against a state snapshot, firing `action` the
moment `when` turns true and (for `once: true`) never again - the framework's own doc comment
uses "a boss entering phase two" as its worked `once: true` example, which is close to a
literal description of `takeKingTurn`'s existing shape.

Adopted for DwarfKing's three real one-way transitions - P1->P2 at an HP threshold, P2->P3 at
shield-zero, and P3's one-time "losing" yell under 20 HP - previously three separate hand-rolled
latches (phase-gated `if` blocks for the first two, a standalone `kingLostYell` boolean for the
third). Now `kingPhaseRules(king)` builds three `ReactionRule<Creature>`s closing over that
specific King instance, and `takeKingTurn` calls `king.kingReactions ??= new
ReactionTable(this.kingPhaseRules(king))` then `.check(king)` once per turn before the
phase-behavior dispatch (which still reads `king.kingPhase` directly - only the *transition
detection and one-shot side effect* moved into the table, not the ongoing per-phase behavior
itself, which stays as plain code since it isn't an edge-triggered event).

Because `ReactionTable` is a stateful class instance rather than plain data, adopting it also
required extending this port's own save/restore path (which serializes `Creature` via an
explicit field list, not a generic `JSON.stringify`): a new `SavedCreature.kingReactionsState`
field holds `ReactionTable.toJSON()`'s `{active, spent}` shape, and `restoreFloor` reconstructs
the table via `ReactionTable.fromJSON(this.kingPhaseRules(creature), saved.kingReactionsState)`
using the same rule-builder a fresh King uses. `combat.ts`'s `kingLostYell` field was removed
entirely (superseded by the table's own `spent` tracking).

Live-verified via `chrome-devtools-mcp`: all three transitions fire exactly once each in
sequence (P1->P2, P2->P3, losing yell), a second `takeKingTurn` call with deliberately
out-of-range state (`hp` set far above any threshold) does not revert or double-fire an
already-spent transition, HP recovering above 20 and dropping again correctly does *not*
re-fire the spent losing-yell rule (true `once` semantics, not mere edge-triggering), a fresh
King has no reactions table until its first turn (lazy construction), and a full
`saveRun()`/`loadRun()` round-trip preserves phase and every fired-rule id exactly
(`{active, spent}` identical before and after). `tsc --noEmit`/`npm run build` clean throughout.

Brute's `hasRaged` one-time revival (`main.ts`, near the death-check in `attack()`) is a
smaller, single-rule instance of the same shape, identified but not converted this pass - a
single boolean flag guarding one `if`, lower value than the King's actual multi-rule state
machine. A reasonable next candidate if further `ReactionTable` adoption is wanted.

**Re-verified directly against real Java source (2026-09-09)**, using the local SPD checkout at
`~/dev/shattered-pixel-dungeon` (tag `4.0.0-beta`) - not available earlier in this session, so
this closes a gap where "matches Java" had been asserted from this repo's own prior citations
rather than freshly re-derived:
- `DwarfKing.java:495-500`: P1->P2 fires at `HP <= (challenged ? 100 : 50)`, clamps HP to that
  threshold, `Buff.affect(this, DKBarrior.class).setShield(HT)`, kills every existing subject,
  detaches `LifeLink` - the port's `kingPhaseRules` matches on every point except `LifeLink`
  (already documented elsewhere as unmodeled, not new).
- `DwarfKing.java:519-521`: P2->P3 fires at `shielding() == 0`, sets `summonsMade = 1` - exact
  match.
- **Found by this re-verification, not previously documented**: real Java's losing-yell
  condition is `phase == 3 && preHP > 20 && HP < 20` - checked *every time damage lands*, with
  no permanent lock, so a King that ever healed back above 20 and dropped below again would
  yell a second time. This port's `kingLostYell` flag (now `ReactionTable`'s `once: true`)
  fires once *ever*, not once *per crossing* - a real semantic difference, though practically
  unobservable since nothing heals the King in either version. Pre-existing (the flag predates
  this session's `ReactionTable` refactor), now honestly documented rather than assumed to
  match.
- `DM200.java`'s `canVent`/`zap()`: vent roll `Random.Int(100/distance(enemy)) == 0`, cooldown
  `30`, gas seeded `20`/cell along the path plus `100` at the endpoint - `dm200VentAttempt`/
  `ventDM200` match exactly (the already-documented "no closing-distance-failed retry" gap is
  Java's own fallback-vent-if-can't-move-closer branch, still unmodeled, not new).
- `Necromancer.java:180,193`: skeleton heal `HT/5`, Adrenaline duration `3f` - `necromancerRangedTurn` matches exactly.
- `Brute.java:105` and `BruteRage.act()`: enrage shield `HT/2 + 4`, decay `4` per turn (times an
  `AscensionChallenge` modifier this port doesn't model, already documented) - matches exactly.

No new formula/value bugs found in this direct re-verification; the one real finding is the
losing-yell edge-trigger-vs-once-lock distinction above.

| `WandOfLivingEarth.onZap()` / `RockArmor.absorb()` / `EarthGuardian` | `useSpecial` zap branch, `maybeSummonEarthGuardian`, `takeEarthGuardianTurn`, `absorbHeroDamage`, run save/load | Simplified but playable: the wand uses the real damage range `NormalIntRange(4, 6 + 2*level)`, stores successful hits as rock armor capped at `2*(8 + 4*level)`, creates the dedicated Java `EarthGuardian` actor at the threshold, heals it when targeted, lets it attack and reform into rock armor when no visible hostile remains, and incoming damage consumes `ceil(damage/2)` rock armor before ordinary barriers. The guardian's particles, exact Ballistica targeting, `NO_ARMOR` challenge-specific DR range, and precise nearest-reachable spawn choice remain simplified. |

| `WandOfRegrowth.onZap()` / `chargesPerCast()` / degradation counters | `useRegrowthWand`, `regrowthChargeLimit`, `useSpecial` wand branch, run save/load | **Ported (2026-09-12)**: the affected cells are Java's own `ConeAOE` - `src/mechanics/cone.ts` is a line-for-line translation of `mechanics/ConeAOE.java` (arc `20 + 10*charges` degrees, range `2 + 2*charges`, rays every 0.5 degrees, plus the radius-1 ring when the radius is at least 4, each struck cell unioned with its `Ballistica.subPath(1, dist)`; the arc arithmetic keeps Java's `float` precision so the sampled rim matches), with the ray's `STOP_SOLID` half from MWG's `ballistica({stop: 'impassable'})` and the `STOP_TARGET` half from the first creature on the path. The centre line is Java's `bolt.path` through `Roguelike.traceLine` (an uncursed wand's own `collisionProperties` is `WONT_STOP`, `WandOfRegrowth.java` 66-67), the surviving cells are shuffled at Java's own point in the sequence, the 3-charge Lotus takes the aimed cell when free or the first free cell walking that path backwards, and a cell holding an `IMMOVABLE` character is dropped from the cone before the roots pass (Java's `Char.Property.IMMOVABLE`, read here through the MWL actor flags - the same set the necromancer push-aside uses). Browser-verified live (`tools/scratch/regrowth-path-livecheck.mjs`, 10 assertions): the Lotus lands on the cell Java's backwards walk picks, **every** cell the zap changed is inside the sector (where the previous circle version changed cells outside it), a pylon in the cone is neither grassed under nor rooted while an ordinary monster beside it is both, and the bolt line is grassed along the path. The geometry itself is covered headlessly by `tools/verifyCone.mjs`'s seven checks (range clamp, arc bound with the quantisation the algorithm actually has, monotonicity in degrees, rim, wall truncation, and a zero-degree cone being exactly one ray's trace). Still missing: Java's `fx` animation (`WandOfRegrowth.fx()`'s `MagicMissile.FOLIAGE_CONE` rays plus the bolt to half the longest ray, with the `ZAP` sample) is presentation this port does not draw - it resolves the cone without a projectile. **Corrected 2026-09-16**: the "Dwarf King's boss-challenge-badge flag" this row used to list alongside it is not this wand's at all, and not a flag: it is Java's whole `BOSS_CHALLENGE` badge rule (a *weapon-only* boss kill, set at each fight's start and cleared by an unarmed hit without `RingOfForce`, a `Wand` other than `WandOfLightning`, or a `ClericSpell`), which now has its own item in `ROADMAP.md` section 6. The rest of the row stands: the real 1-3 charge cost (`ceil(30% of current charges)`), level-scaled degradation limit, `round((3.67 + level/3)*charges)` grass budget, `4*charges` Roots duration, furrow chance after the limit, Seedpod/Dewcatcher chances, and generated seed activation are reproduced. |

| `WandOfTransfusion.onZap()` | `useTransfusionWand`, transfusion target selection in `useSpecial` | Simplified but playable: enemy targets receive the real `5 + level` hero shield and living enemies receive the existing Charm state; undead receive the real `NormalIntRange(3 + level, 6 + 2*level)` damage, with no armor subtraction (`Char.damage()` never reduces by DR - see the `Char.damage()` row above). **Two corrections, 2026-09-12.** "undead" used to be a hand-written four-kind list (skeletons, necromancers and their two subclasses), so a Guard, Ghoul, Monk, Senior, Thief, Bandit, Warlock, RipperDemon or the Dwarf King was *charmed* where Java burns it; it now reads Java's real `Property.UNDEAD` through the new `undead` actor flag. Browser-verified live: a Guard and a Ghoul are harmed, while a Mimic - `DEMONIC` but not `UNDEAD`, a useful control - is charmed exactly like a rat. Ally targets receive the real heal amount and pay the real 5% hero-health cost. The port has no generic ally Barrier pool, so overheal shielding on allies is omitted; no cell picker exists, so visible allies are auto-preferred and otherwise the nearest visible enemy is chosen. |

| `WandOfWarding.onZap()` / nested Java `WandOfWarding.Ward.zap()` actor | `useWardingWand`, `takeWardTurn`, `monsters.ts`'s `ward` kind, persisted ward fields, `images.ts`'s `wards` asset | Simplified but playable: casts create scheduled tier-1 `ward` actors within the Java energy budget (`2 + wand level`), wards use the dedicated Java `WardSprite` six-tier film and fire always-hit `NormalIntRange(2 + wand level, 8 + 4*wand level)` attacks at visible hostiles, and the real tier 1–3 zap lifetimes and tier 4–6 self-damage are reproduced. Existing wards are auto-selected for the Java tier upgrade/heal interaction. Aimed-cell placement, exact line-of-sight collision, and ward dismissal UI use nearest-visible targeting because this port has no cell picker. |

| `WandOfCorrosion.onZap()` / `CorrosiveGas.evolve()` / `WandOfCorruption.onZap()` | `useSpecial` zap branch, `corrosiveGas`, `corrosionTurns`/`corrosionDamage`, `wandTypeFromSource` | Simplified but playable: Corrosion now seeds the real 50 + 10*level CorrosiveGas volume with persistent 2 + level strength, uses Java-shaped blob propagation, and applies a two-turn increasing damage state to affected creatures. The port's shared state does not carry Java's source-class immunity/death badge or exact Corrosion presentation. Corruption still heals/cleanses the selected monster and converts it into a scheduled ally; its permanent loot-transfer buff payload and immunity-specific `Doom` fallback are not modeled. Both wand families remain reachable through generated `sourceClass` identity and saved equipment state. Checked against local SPD sources. |

| `StoneOfFlock.activate()` / `SheepSprite` | `useStoneOfFlock`, `spawnSheep`, `monsters.ts`'s `sheep` kind, `images.ts`'s `sheep` asset | Simplified but playable: spawned sheep now use the dedicated Java `SheepSprite` 16x15 film copied byte-for-byte from the SPD asset, remain neutral/invulnerable for their scheduled lifespan, and disappear after expiration. Cell targeting remains centered on the hero because this port has no thrown-cell picker; Sheep's flavour animation/audio and manual dispel interaction are not modeled. |

| `ChampionEnemy.Blazing.detach()` | `kill()`'s champion-death hook and floor `fire` blob | Ported - a grounded blazing champion seeds volume 2 into each eligible neighbouring non-solid, non-water cell on death, with Java's suppression when it is flying over a pit. The existing floor-scoped Fire blob supplies the same short-lived environmental effect; particles and aura visuals remain outside the logic port. |

| `PotionOfFrost.shatter()` / `Freezing.freeze()` | `quaffPotion`'s `potionFrost` branch | Simplified but broadened to Java's `NEIGHBOURS9` impact: every eligible creature in the 3x3 area around the quaffing hero is chilled/frozen, including elemental harm, instead of only the nearest visible enemy. Ordinary Fire is now cleared cell-by-cell in that area, matching `Freezing.evolve()`; the port still uses direct status application rather than a persistent Freezing blob, does not freeze heaps, and clears an EternalFire wall through its existing whole-wall reduction. |

| `Tengu.canUseAbility()` / `targetAbilityUses()` / `useAbility()`, `Tengu.throwFire()` / `FireAbility`, `Tengu.throwShocker()` / `ShockerAbility` | `simulation/tenguAbility.ts` (tested cadence), `takeTenguTurn`, `tenguFireAbilityIfReady`, `tenguUseAbility`, `tenguThrowFire`, `tenguThrowShocker`, saved `tenguAbilityCd`/`tenguAbilityUses`/`tenguLastAbility`/`tenguShockers` | **Ported (cadence) / Simplified (ability actors).** The Shocker actor now persists for three Tengu turns, rolls Java's initial diagonal/cardinal parity, alternates its 3x3 pulses, and applies the real `2 + scalingDepth()` damage on each logical pulse. Java uses a persistent `ShockerBlob` and Lightning presentation; this port resolves the same actor timing and pulse shape directly because it has no generic ShockerBlob/Lightning actor. The remaining Tengu differences are the separate phase-2 arena geometry and the exact Blob expiry timing. |

| `CloakOfShadows.execute()` / `cloakStealth` / `cloakRecharge` | `useCloak`, inventory action row, bag `charges`, `cloakChargeProgress` and `cloakStealthTurnsToCost` save fields | Simplified but playable: the Rogue cloak starts at the real level-0 three charges, toggles invisibility from its inventory row, consumes one charge every four hero turns, remains active for the final four-turn charge window, and passively recharges using Java's level-0/level-scaled `45 - missing` cadence. The port treats a carried cloak as equipped and has no artifact quickslot, active-buff icon, sound, artifact XP/level-up, MagicImmune action gate, or Light Cloak talent path; these are UI/progression differences, not silent charge behavior. |
| `DriedRose`/`DriedRose.GhostHero`/`DriedRose.Petal` (`items/artifacts/DriedRose.java` + `levels/RegularLevel.java`, tag `v3.3.8`) | `src/items/rose.ts` (the artifact's scene-free rules), `roseItem`/`roseGhostAlive`/`useRose`/`summonRoseGhost`/`beginRoseDirect`/`directRoseGhost`/`collectRosePetal`/`placeRosePetals`/`randomPetalCell` in `src/scenes/dungeonScene.ts`, the ghost's orders in `takeAllyTurn`, the `roseGhost`/`roseFirstSummon` state, the rose recharge block in `spendHeroTurn`, the `petal` ground kind and its pickup branch, the `rose*` effect rows and the `petal`/`rose` frame + name rows in `item-rules.mwl`, the `rose` item id | **Ported (2026-09-15), the twelfth and last real artifact this port implements** (all thirteen real classes now have real mechanics: Cloak of Shadows, Timekeeper's Hourglass, Chalice of Blood, Cape of Thorns, AlchemistsToolkit, LloydsBeacon, MasterThievesArmband, HornOfPlenty, EtherealChains, SandalsOfNature, TalismanOfForesight, DriedRose, UnstableSpellbook) - and the last stand-in in the §1 bundle, which was another dead branch: `useRose` read an optional `ArtifactActionContext.spawnAlly` hook the scene never provided, so it printed one `notarget` line. `AC_SUMMON` runs Java's own ladder (the Sad Ghost quest, no live ghost, a *full* charge, no curse, no `MagicImmune`), raises a real allied creature in a random free neighbour cell with `GhostHero.updateRose()`'s stats - HT `20 + 8*level()`, accuracy `hero.lvl + 9`, evasion `hero.lvl + 4`, damage `NormalIntRange(0, 5)` bare-handed - empties the rose, dispels the hero's invisibility, spends a turn and announces itself with SPD's `hello` (first summon) or `appeared` line. `AC_DIRECT` aims through `beginAiming` and applies `DirectableAlly.directTocell()` branch for branch: an unseen/empty/non-enemy cell means *defend there* (the ghost walks over and holds), the hero's cell means *follow*, an enemy's cell means *attack that character* - honored inside `takeAllyTurn`, which is also where Java's `GhostHero.act()` decay lives (a rose the hero no longer carries, or `MagicImmune`, costs the ghost 1 HP a turn until it dies). The passive is Java's two mutually exclusive halves - a live ghost is healed `HT/500` a turn and the rose does not charge; with no ghost the clock trickles `1/5` a turn to a full 100, i.e. 500 turns - both with Java's *strict* `while (partialCharge > 1)` boundary, which is why a "500 turn" heal really pays out on the 501st tick (the loop, not the comment above it, is what is reproduced). Petals are ported end to end: the floor generator drops `ceil((depth/2 - raisedPetals)/3)` of them per floor up to 11 a run, inside Java's own `Random.pushGenerator(Random.Long())` substream - the only main-stream cost is the one long that seeds it, drawn whatever the hero carries, so a rose-carrying hero's floors generate exactly as any other hero's - and picking one up levels the rose (healing a live ghost by 8 and re-deriving its HT), with Java's `no_rose` (refused; the petal stays on the floor), `no_room` (consumed and wasted at the cap) and `levelup`/`maxlevel` lines, and the petal's own `ItemSpriteSheet.PETAL` frame. **Simplified**: the petal's cell is chosen by this port's established `placeGroundItems` predicate rather than Java's full `randomDropCell()` (no `room.canPlaceItem`/destructive-trap exclusions), and a `no_room` petal is consumed like Java's, which also spends the turn. **Not ported**: `AC_OUTFIT` and everything behind it - the ghost's weapon/armor, `ghostStrength()` (reported by `src/items/rose.ts`, applied nowhere), the weapon-driven damage/accuracy/DR/`defenseProc` and the `WndGhostHero` window - because this port has no ally-equipment model at all; Java's `Property.UNDEAD`/`INORGANIC` on the ghost, since this port's property sets are keyed by monster *kind* and adding `ghost` to them would wrongly grant them to the Sad Ghost quest NPC too (the ally reuses that row's sprite and nothing else); the ghost's `flying` and its double-speed return to the hero; the rose's cursed branch (a 1%-per-turn `Wraith` spawn), since this port has no wraith mob kind; the `charge(Hero, amount)` external boost (no caller here); `firstSummon`'s dialogue beyond the single arrival line, and the ghost's ambient dialogue; the artifact's own three-level art ladder (`ARTIFACT_ROSE1/2/3` - the port's frame table is one static frame per item, so it always draws ROSE1), and the save/load halves of `ghostID`, `firstSummon` and the standing DIRECT order, since this port's creatures carry no per-creature id to key them on. Browser-verified live (`tools/scratch/rose-livecheck.mjs`, 16/16 assertions, plus a screenshot of the ghost fighting beside the hero with a petal on the floor): an under-charged rose offered nothing and an unfinished quest offered nothing; the forced-complete quest made `AC_SUMMON` available; the summon raised an `isAlly && !isNPC` creature on an adjacent cell with HT exactly 20, accuracy `hero.lvl + 9`, evasion `hero.lvl + 4` and damage `[0, 5]`, and left the rose empty; a live ghost was healed on its own turn while the rose's charge stayed at 0, and with the ghost gone the clock banked exactly 2 charge in 10 turns; DIRECT opened the picker, ordered a defend cell (the ghost walked to it and held) and an enemy cell (the ghost closed and killed the rat, logged as `Fantôme triste touche rat marsupial pour 3`); a petal levelled the rose, healed the ghost by 8 and disappeared, a petal at `levelCap` was consumed with `no_room`, a petal with no rose stayed on the floor with `no_rose`, and a rose-less ghost lost exactly 1 HP on its turn. `tools/verifyItemWorkflows.mjs` pins the stat line, the summon ladder, both recharge halves (including the strict boundary) and the petal drop/pickup rules headlessly. **Two presentation substitutions, both found while restoring this row's code after a bad patch truncated `dungeonScene.ts` (2026-09-15) and the region was reconstructed from the session transcripts**: the rose clock's ghost heal reports through this port's own `showHeal` floater where Java calls `Char.sprite.showStatus(HEALING, ...)`, because the recovered line set a `healFlash` field no type here has; and the curse infusion's `ShadowParticle` burst attaches to a reconstructed `effectLayer` whose *declaration* the truncation took with the code (only the reference survived), placed between the actors and the wall tops - which is where Java draws its `effects` group. Neither changes a number or a rule. **The cursed 1%-per-turn wraith spawn is live too (2026-09-17)**, rolled scene-side in a free neighbouring cell - see the dedicated `Wraith` row. |
| `Wraith` / `CorpseDust.DustWraith` (`actors/mobs/Wraith.java`, `items/quest/CorpseDust.java`, tag `v3.3.8`) | `simulation/wraith.ts` (`wraithCombatStats`, `dustSpawnerStep`/`dustSpawnerCap`, both pinned in `tools/verifySimulation.mjs`), `spawnWraithAt` + the rose block + the dust-spawner tick/pickup/handover in `src/scenes/dungeonScene.ts`; `wraith`/`dustWraith` monster rows, sprite frames (the real 14x15 film over the byte-identical `wraith.png`), `actorFlags` (`flying`/`undead`/`inorganic`/`never_sleeps`), the `dustWraith`-to-`wraith` base alias; `wraithLevel`/`dustSpawnPower` save fields | **Ported (2026-09-17).** `Wraith` spawns with Java's own numbers: 1 HP, 0 EXP (`maxLvl = -2` zeroes experience through the existing gate, and the missing `MOB_LOOT` entry means no drops, matching Java's lootless class), `adjustStats` accuracy/evasion/damage from the spawn depth with the integer division ordered Java's way (`1 + level/2`, not `floor((1 + level)/2)` - they differ on even levels, so this stays scene code rather than joining the closed depth-stat table), `flying`, UNDEAD + INORGANIC (bleed/poison/toxic-gas immunities come along through the existing sets), HUNTING arrival (`seesHero`, awake) with the real 2-turn `SPAWN_DELAY`, and a persisted `level`. Its two portable producers are live: a cursed Dried Rose rolls Java's 1/100 per turn for an adjacent free cell, and carrying corpse dust runs `DustGhostSpawner`'s real bank (`min(49, wraiths*wraiths)` over 1 + live DustWraiths, spawn into hero FOV past `round(viewDistance/3)` Chebyshev, the `2*wraiths` no-candidate brake, bank reset when the dust leaves the bag, every DustWraith dead on handover, persisted bank, the real `chill` pickup line). `DustWraith` is Java's `extends` (same stats/art, its own kind id); real Java ships it no name strings at all (it renders `!!!NO TEXT FOUND!!!`), so the row reuses the base wraith name instead of reproducing that. Stated, not silent: `TormentedSpirit` (every generic-spawn caller - haunted heaps, `DistortionTrap`, the Cleric spell, soul-marked deaths - belongs to an unported system, so the 1/100 exotic never triggers); `NECROMANCERS_MINIONS`/SoulMark (no applier exists here - the Corruption wand simplified away from its debuff table); haunted heaps (no tombs exist here); the score penalties, music fade, CURSED/LIGHTNING sounds and spawn particles (no systems/layers for any of them); spawn cells use `passable` where Java reads `!solid` (the port's standing spawn convention). Type-check/build/simulation/item/vault/lua/mwg suites green; browser verification owed per ROADMAP.md section 10. |
| `ArtifactRecharge` (`actors/buffs/ArtifactRecharge.java`, tag `v3.3.8`) - the game's only caller of `Artifact.charge(Hero, amount)` | `src/items/artifactRecharge.ts` (the per-artifact table, the shared bank, and the Chalice/Rose formulas), `applyArtifactRecharge`/`artifactRechargeCap` and the `artifactRechargeTurns` timer in `src/scenes/dungeonScene.ts`, `useWildEnergy`'s cast, the `artifactRecharge*`/`chaliceRecharge*` rows in `item-rules.mwl` | **Ported (2026-09-15).** This exists in the port because of a documentation debt as much as a gameplay one: five artifact rows here had been carrying "the external `Artifact.charge(Hero, amount)` boost has no caller here" (Talisman, Sandals, Rose among them), because nothing in the port ever called that hook. Java's `Artifact.charge()` is a **no-op by default** - only the artifacts that override it are affected - so the table records one entry per override with its own rate *and* its own guard set: Cloak 0.25, Horn 0.25 (`full` line), Beacon 0.25, Toolkit 0.25 (**banks charge even while cursed** - its override guards only on `MagicImmune`), Armband 0.1 (`full`), Spellbook 0.1, Chains 0.5 (gated at *twice* its soft `chargeTarget`), Talisman 2 (`full_charge`), Sandals 2, Rose 4 (or a ghost heal at `round((1+level/3)*amount)`), Cape of Thorns a flat `round(4*amount)` with **no guard at all**, and Chalice of Blood a heal instead of a charge. Each artifact's own `chargeCap` is resolved the way its own constructor computes it (Cloak `min(level+3, 10)`, Horn `5+level/2`, Beacon `3+level`, Armband `5+level/2`, Spellbook `(int)(level*0.6)+2`, Chains the doubled target, the rest 100, and the Toolkit none at all since its override never tests one). `WildEnergy` now does what Java's cast does: `chargeArtifacts(hero, 4f)` immediately and then an eight-turn `ArtifactRecharge` (`Buff.affect(...).extend(8)`, `ignoreHornOfPlenty = false`). **Simplified**: Java's buff is walked as the hero's `ArtifactBuff`s (the base class forwards `charge()` to the item), and this port has no artifact buffs - the same table is applied to the carried items - and the buff itself is a scene timer rather than a buff id, since this port has no buff entry or icon for it (every other artifact timer here, cloak stealth/hourglass freeze/beacon send, is a field too). **Not ported**: the Cloak's unequipped `amount *= 0.75*pointsInTalent(LIGHT_CLOAK)/3` clause (this port has no artifact equip slot, so every carried artifact is always "worn" and the clause's condition never holds - and that talent is not ported either), `BellOfReturning`/`SandBag`-style artifact-buff presentation, and `hero.belongings.charge(1f)` (Java's other WildEnergy effect, which charges the hero's *equipped* items) - this port's stand-in for that half is the wand-charge refund the spell already had, recorded on the `WildEnergy` row. Browser-verified live (`tools/scratch/recharge-livecheck.mjs`, 10/10): a real `useWildEnergy` cast advanced a Sandals and a Talisman by exactly their own rate-2 hook (plus the point the cast's own spent turn handed the fresh timer), banked one charge onto a *cursed* Toolkit, started the timer at 8 (less that turn), and then its seven remaining ticks advanced each by 14 before expiring; a cursed non-Toolkit artifact banked nothing and `MagicImmune` stopped even the Toolkit; the Chalice healed the hero instead of charging and the Rose charged while no ghost was up. `tools/verifyItemWorkflows.mjs` pins the whole table (rates, caps-adjacent flags and guards), the bank's two cap behaviours and both special formulas. |
| §1's artifact bundle - **closed 2026-09-15** | - | The eleven-artifact set this row used to track (Cloak of Shadows, Timekeeper's Hourglass, Chalice of Blood, Cape of Thorns, AlchemistsToolkit, LloydsBeacon, MasterThievesArmband, HornOfPlenty, EtherealChains, SandalsOfNature, TalismanOfForesight, DriedRose, UnstableSpellbook) is gone: **every one of the thirteen real artifact classes now has its own real mechanics and its own row below**, and none of them is a stand-in any more. Three of them were not "simplified" at the end but **dead branches** - `useRose`, `useSandals` and `useTalisman` each read an optional `ArtifactActionContext` hook the scene never provided, so they printed a line and did nothing; the hooks are gone with them (`spawnAlly` was the last, removed with `useRose`'s replacement). Kept as a row rather than deleted because the shape of that failure is worth remembering: an optional hook makes an unimplemented artifact look implemented, and "Simplified" reads as a reduced effect rather than none. **None of the thirteen is reachable from floor generation at the port's cited tag**: `Generator.Category.ARTIFACT` at `v2.1.4` deals eleven classes and includes only some of them; the MWL deck follows that list (see `generator-decks.mwl`), and the port's own `generatedInventoryItem` maps all thirteen ids. |
| `SandalsOfNature`/`SandalsOfNature.Naturalism` (`items/artifacts/SandalsOfNature.java`, tag `v3.3.8`) | `src/items/sandals.ts` (the artifact's scene-free rules), `useSandals`/`openSandalsSeedPicker`/`feedSandalsSeedPick`/`beginSandalsRoot`/`confirmSandalsRoot` in `src/scenes/dungeonScene.ts` (both actions need the scene's own picker and aiming seams), `trampleHighGrass`'s charge hook, `itemDisplayName`'s level-name ladder, the `sandals*` effect rows and the `sandalsSeedReqs` table in `item-rules.mwl`, the `sandals` item id | **Ported (2026-09-15), the tenth real artifact this port implements** (after Cloak of Shadows, Timekeeper's Hourglass, Chalice of Blood, Cape of Thorns, AlchemistsToolkit, LloydsBeacon, MasterThievesArmband, HornOfPlenty, EtherealChains) - replacing a stand-in whose whole body printed the item's own name. Charge is Java's: `chargeCap = 100`, `levelCap = 3`, and `Naturalism.charge()`'s `(3+level)/6` per trampled high grass scaled by the energy-ring multiplier, banked in whole units onto the integer `charge` (with `partialCharge` the float build-up), gated on `!cursed && !MagicImmune` exactly as Java gates it. `AC_FEED` opens the generic item picker, whose second stage is Java's own `WndBag` filter (`canUseSeed`: a carried seed the footwear does not already hold, and - at the cap - not the currently attuned kind either); each pick consumes one seed unit, attunes its kind, and prepends it to the banked list, and the list reaching `3 + level()*3` clears it and raises the artifact one level, which is its only way to level. `AC_ROOT` aims through `beginAiming` (`range` 3, line of sight required, plus a `validate` requiring the cell be currently visible - Java's `heroFOV[cell]`), then plants the attuned seed at the aimed cell through the same `placePortedFeature`/`manualPlants` pair `plantSeed()` uses and immediately activates it on the cell's occupant, routing to the port's existing non-hero plant half (`triggerMobPlantAt`) for a creature and its hero half (`triggerPortedPlantAt`) when the hero aimed at himself; the charge spent is that seed's own requirement (`sandalsSeedReqs`: Rotberry 8, Mageroyal/Fadeleaf/Blindweed 12, Firebloom/Swiftthistle/Icecap/Stormvine/Sorrowmoss 20, Earthroot/Starflower 40, Sungrass 80), the hero's invisibility is dispelled, and a turn is spent. The item renames itself through SPD's own `name_1`/`name_2`/`name_3` keys (sandals -> shoes -> boots -> greaves of nature), resolved in `itemDisplayName`. **The same pass had to implement `HighGrass.trample`'s naturalism-scaled loot rolls** (see that row) - they read the same `naturalismLevel`, so the artifact could not be ported without them. **Simplified**: Java's cell selector accepts *any* cell and then refuses one that is invisible or beyond 3 tiles with its `out_of_range` line; this port's `beginAiming` needs a finite range, so an out-of-range cell simply cannot be aimed at (the same "the picker only ever offers legal cells" shape `useChains`/`useBeaconArtifact` document), and `confirmSandalsRoot` keeps Java's two clauses as a defensive re-check. **One more presentation divergence**: a *cursed* pair makes Java list no actions at all and log nothing, while this port (having no action menu through which the absence could be read) says the artifact's own `desc_cursed` line instead - a silent tap would be indistinguishable from a broken one. Where Java has a line, the port uses Java's: `no_effect` when nothing is attuned and `low_charge` when the charge is short. **Not ported**: Java's `plant.activate(null)` cell effect when the aimed cell is *empty* (Firebloom's flame, Rotberry's cloud, Dewcatcher's loot all fire with no character present) - both of this port's plant-activation halves are occupant-driven, so an empty-cell root places the seed correctly and defers its firing to the first occupancy instead; `Artifact.artifactProc` (Java hands it the seed's own charge requirement, but the method reads neither that nor `visiblyUpgraded()`: it runs three talent procs - the Priest subclass detonating an Illuminated target for `5 + hero.lvl`, the Cleric's SearingLight, the Huntress's Sunray blindness roll - and this port has none of those three talents, which is the accurate reason it is not called, rather than the "deals no damage" claim an earlier draft of this row made); the external `Artifact.charge(Hero, amount)` boost (`partialCharge += 2*amount`), which has no caller here; and the presentation layer Java's root/feed paths use - seed colours on the `Splash`, the item's own `glowing()` tint, the leaf-burst particles and the PLANT/TRAMPLE samples - since this port has no per-effect audio or item-glow seam (the planting path reuses the port's own planting log line, with SPD's real localized plant name). Browser-verified live (`tools/scratch/sandals-livecheck.mjs`, 18/18 assertions, plus a screenshot of the picker): two tramples of high grass at +0 banked exactly one charge and converted both cells to plain grass; a cursed pair banked nothing; the picker's two rows rendered as SPD's own `NOURRIR`/`ENRACINER` in French under the item's real level name; three feeds levelled the footwear to "chaussures de la nature" and emptied the banked list; a kind already banked stopped being offered while the other two still were; and a root aimed one cell away planted the attuned `icecap` at that exact cell (`manualPlants` + the `plant:icecap` feature), spent exactly its 20 charge, dispelled a 12-turn Invisibility, while an aim past 3 tiles could not be confirmed at all and spent nothing. `tools/verifyItemWorkflows.mjs` pins the authored seed table to Java's `seedChargeReqs` and covers the charge economy, the feed thresholds and the root gate headlessly. |

| `TalismanOfForesight`/`TalismanOfForesight.Foresight` (`items/artifacts/TalismanOfForesight.java`, tag `v3.3.8`) | `src/items/talisman.ts` (the artifact's scene-free formulas), `talismanItem`/`useTalisman`/`confirmTalismanScry`/`trueDistanceTo`/`checkTalismanAwareness` in `src/scenes/dungeonScene.ts`, the `awareCreatures`/`awareHeapCells` marks and the two sprite-visibility gates that consult them, the per-turn charge/awareness block in `spendHeroTurn`, the `talisman*` effect rows in `item-rules.mwl`, the `talisman` item id | **Ported (2026-09-15), the eleventh real artifact this port implements** (after Cloak of Shadows, Timekeeper's Hourglass, Chalice of Blood, Cape of Thorns, AlchemistsToolkit, LloydsBeacon, MasterThievesArmband, HornOfPlenty, EtherealChains, SandalsOfNature) - replacing a stand-in that was worse than it looked: `useTalisman` read an optional `ArtifactActionContext.revealNearbyTraps` hook the scene never provided, so the action printed the item's own name and did nothing else. That hook is gone with the stand-in. `AC_SCRY` gates on `MagicImmune` silently, then on the real `charge < 5` floor (`low_charge`), then aims through `beginAiming` with `requireLineOfSight: false` and the level's own diagonal span as the range - Java's `GameScene.selectCell` accepts *any* cell, so `maxDist()` is applied inside the confirm handler (`confirmTalismanScry`), exactly where Java's `scry.onSelect()` applies it: the adjacency nudge (`target += target - pos`), then, when `dist >= 3 && dist > maxDist()`, the walk along the aim's own line keeping the *last* cell still within reach. The cone is Java's own: `round(200 * 0.92^dist)` degrees at unbounded radius (`ConeAOE`'s two-argument constructor passes `POSITIVE_INFINITY`), rays traced with the core ballistica's `STOP_TARGET`-only params - which stop at neither wall nor creature, i.e. a plain line through `Roguelike.traceLine`. Each cone cell then maps ground it had never seen, uncovers a concealed secret (a door disguised as `WALL` is worth 100, a trap disguised as `FLOOR` 10 - the port's `Secrets.conceal` disguises are how the two are told apart), marks an unseen creature or a heap as *aware* for `5 + 2*level()` turns, and awards 1/10/10 experience for the three. Experience levels the artifact at `100 + 50*level()` up to `levelCap = 10`, the cost is `3 + dist*1.08` spent on Java's own int `charge` with the fraction borrowed from `partialCharge` (including Java's two normalization branches), invisibility is dispelled, and a turn is spent. The passive trickles `0.05 + 0.005*level` charge a turn (2000 turns to full at +0, 1000 at +10) and runs `checkAwareness()`: a hidden trap inside the hero's own sight latches one `uneasy` line and drops his auto-travel; the latch clears as soon as the sweep comes up empty. **Simplified**: the marks are live state rather than Java's hero-attached `CharAwareness`/`HeapAwareness` buffs, because this port's creatures carry no per-creature id to key a saved buff on - so, unlike Java's, the awareness does not survive a save/load. **Not ported**: `Artifact.artifactProc`'s three talent procs (the number Java passes it, `(int)(3 + dist*1.08)`, is cited in `src/items/talisman.ts` but unused - the method reads neither of its numeric arguments and this port has none of GuidingLight/SearingLight/Sunray); Java's `Dungeon.level.discoverable[cell]` gate on the mapping half, since this port's fog has no such channel and every floor here is discoverable; the `Regeneration.regenOn()` gate on the passive trickle (no `LockedFloor` lock is modelled anywhere in this port - the same simplification Beacon/Chains/Spellbook already state); `Artifact.charge(Hero, amount)`'s external boost, which has no caller here; and the presentation Java's branch uses - the `SCAN`/`SECRET` and `full_charge` samples and the `updateQuickslot`/`GameScene.updateFog` callouts. Two log lines stand in where Java has sound only: the `SECRET` cue becomes the same real `actors.hero.hero.noticed_smth` line the port's own search action logs on a discovery, and a successful plain scry logs nothing at all (Java logs nothing there either - the fog clearing is the feedback). Browser-verified live (`tools/scratch/talisman-livecheck.mjs`, 13/13 assertions, twice in a row, plus a screenshot of a live aim): below 5 charge the scry refused without opening an aim; a +10 scry revealed a cell ten tiles out that stayed outside the hero's own view; a scry over a concealed trap spent exactly `trunc(100 - 5.16) = 94` charge with the fraction borrowed (`0.84`, plus the passive's own 0.05 tick from the scry's turn), discovered the trap and awarded its 10 experience; a full charge resolved a five-tile aim on the fifth tile while a 5-charge scry was truncated to one tile for a 4-point cost it could not cover (leaving `charge 0` and `partialCharge -0.08`, where an untruncated aim would have left `-3.4`); 100 experience at +0 levelled it; a creature in the cone was marked and kept rendering after being moved to a cell the hero could not see; and the passive latched `warn` on a hidden trap in sight and cleared it once found. `tools/verifyItemWorkflows.mjs` pins the same formulas headlessly (caps, both `maxDist` bounds, the angle curve, the cost arithmetic with its borrow branches, the exp curve and the per-turn trickle). |
| `TalismanOfForesight`'s two awareness buffs (the same change) | the `awareness` half is unchanged from the row above; this row exists only to name what it *replaces*, so a later reader does not re-derive it | Java attaches `CharAwareness` (carrying `charID`) and `HeapAwareness` (carrying `pos`/`depth`/`branch`) to the **hero**, and both call `Dungeon.observe()`/`GameScene.updateFog()` on detach - i.e. they are visibility illusions, not vision: the marked thing stays drawn where it is without entering `heroFOV`. This port reproduces that by consulting its own mark maps in the two places that decide whether a sprite is drawn at all (`refresh()`'s creature loop and its ground-item loop), which is why the live check can move a marked creature into fog and still find its sprite visible. The one thing it does *not* reproduce is persistence across a save: Java's buffs are serialized with the hero, and the port's marks are keyed by creature object. || `UnstableSpellbook` (`items/artifacts/UnstableSpellbook.java`, tag `v3.3.8`) | `useSpellbook`/`setupSpellbookScrolls`/`randomSpellbookScroll`/`spellbookChargeCap`/`addScrollToSpellbook` in `src/items/artifactActions.ts`, the scene's `useSpellbook` picker and `addToSpellbook`, the `spellbook*` effect rows in `item-rules.mwl`, the `spellbook` item id | **Ported (2026-09-15) - documented here for the first time, having until now been mis-filed in the stand-in bundle row above.** The charge clock is Java's (`chargeCap = (int)(level*0.6)+2`, recomputed from the level rather than stored), `AC_READ` spends one charge and applies a freshly drawn regular scroll through the same `applyScrollEffect` seam the Arcane Catalyst uses - a weighted draw over the ten-class pool with `ScrollOfUpgrade` (weight 0) and `ScrollOfTransmutation` (removed by the constructor) excluded, and the real coin-flip retry that halves the frequency of Identify/RemoveCurse/MagicMapping - and `AC_ADD` feeds a carried identified scroll matching one of the queue's front two entries, removing it from the queue, consuming it and levelling the book, with the constructor's own `while (scrolls.size() > levelCap-1-level())` trim preserved. **Not ported**: Java's `blinded` gate on reading (this port has no `Blindness` buff at all, an existing gap); the "empowered" exotic-scroll branch, since this port has no `ExoticScroll` classes (the same gap the two alchemy catalysts document); and two of the ten drawable classes (`scrollIdentify`/`scrollCleanse`) still have no `applyScrollEffect` implementation, so drawing one spends its charge with no visible effect - a shared, pre-existing gap, not introduced here. |
| `AlchemistsToolkit`/`AlchemistsToolkit.kitEnergy` (`items/artifacts/AlchemistsToolkit.java`, tag `v3.3.8`) | `useToolkit`, `applyToolkitGainCharge`, `consumeToolkitEnergy`, `toolkitAvailableEnergy`, `energizeToolkit` in `src/items/artifactActions.ts`; `dungeonScene.ts`'s `grantExperience` hook, `openAlchemyRecipes`'s combined-cost/energize-row wiring; the `toolkit` item id, `itemActionKeys`/`itemGroundKindAliases`/frame rows in `item-rules.mwl` | **Ported (2026-09-15), the fifth real artifact this port implements** (after Cloak of Shadows, Timekeeper's Hourglass, Chalice of Blood, Cape of Thorns) - and the artifact that previously stood in for all nine remaining classes as a placeholder (`useToolkit` used to just refund 3 flat alchemy energy, citing "no hero-XP hook reaches item actions"; the `toolkit` id itself was already correctly routed and never fell into the Cloak-collapse trap). That excuse is now fixed: `grantExperience` (the sole place hero XP is granted, on a kill) feeds `applyToolkitGainCharge` with `percent = exp / maxExp(currentLevel)`, exactly where real `Hero.earnExp()` calls `kitEnergy.gainCharge(percent)`, banking `(2+level)*percent*ringMultiplier` onto the toolkit's own `charge` pool (the `ringMultiplier` reuses `ringEnergyMultiplier`'s `1.175^bonus` base - real `RingOfEnergy.artifactChargeMultiplier` is that same base plus a Light Cloak talent bonus this port does not model, matching the already-documented Light Reading gap on the wand-charge side). That banked `charge` is then spent first on any alchemy-pot recipe cost before the carried energy pool (`consumeToolkitEnergy`, exactly `AlchemyScene`'s own `cost = toolkit.consumeEnergy(cost); Dungeon.energy -= cost`), and the pot's picker title shows the combined `energy+charge` the same way. `AC_BREW` (the item's default action) now opens that same alchemy picker from anywhere while carried - real Java's action has no adjacency requirement to a physical pot at all, only an equip/cursed/AntiMagic gate. `AC_ENERGIZE` (spend 6 carried alchemy energy per level to permanently raise the toolkit, capped at `levelCap = 10`) is exposed as an extra row inside that same picker rather than a second item button, since the picker is the only place this port already surfaces the energy pool that action spends. **Not ported**: the equip/unequip-tied `warmUpDelay` window - this port has no artifact equip slot at all, every carried artifact is always active, so there is no equip event to gate a warm-up against; the generic `Artifact.charge(Hero, float)` override, which no caller in this port reaches; and Java's `WndOptions` choice between energizing one level and the maximum affordable (this port always spends the maximum affordable in one action - Simplified, not a silent drop). `tools/verifyItemWorkflows.mjs`'s ground-kind alias count is updated for the new `toolkit` row (24 -> 25). Not browser-verified this pass - `tsc --noEmit`, `npm run build`, and the full `npm run verify` suite (check/simulation/items/lua/mwg/build) are all green. |
| `LloydsBeacon` (`items/artifacts/LloydsBeacon.java`, tag `v3.3.8`, diffed against `4.0.0-beta` - no material change) | `useBeaconArtifact`, `setBeaconArtifact`, `returnBeaconArtifact`, `beginBeaconZap`, `confirmBeaconZap`, `beaconArtifactItem`, `beaconChargeCap`, `beaconTeleportBlocked`, `beaconAdjacentEnemy` in `src/scenes/dungeonScene.ts` (needs the scene's own `beginAiming`/`confirmAiming` targeting seam for `AC_ZAP`, so it lives there rather than in `artifactActions.ts` with its seven siblings above); the `beacon` item id, `itemActionKeys`/`itemGroundKindAliases`/frame/`itemEffectValues` rows in `item-rules.mwl`; `itemDisplayName`'s beacon-picker-row special case in `src/items/displayName.ts` | **Ported (2026-09-15), the sixth real artifact this port implements.** `useBeaconArtifact` opens the same generic item-picker seam `openAlchemyRecipes` already uses (rather than Java's own `WndUseItem` action list), offering real per-action rows - `AC_ZAP` only once `charge` covers `Dungeon.depth > 20 ? 2 : 1`, `AC_SET` always, `AC_RETURN` only once a return point exists - exactly matching `LloydsBeacon.actions()`'s own conditional entries, labelled with the real `ac_zap`/`ac_set`/`ac_return` strings. `AC_SET`/`AC_RETURN` reuse the exact floor-transition path `useBeaconOfReturning` (the wand effect) already established for `BeaconOfReturning` - same-floor return moves the hero directly, a saved different floor rebuilds it through `beaconArrival`/`enterLevel()` - but the artifact is persistent and is never consumed; `returnDepth`/`returnBranch`/`returnPos`/`returnX`/`returnY` live on the bag item and round-trip through the same generic `bagSources` fields the wand effect's return point already uses. Both actions refuse on a boss level, in the mining branch, while carrying the Amulet (`beaconTeleportBlocked`, standing in for Java's `Dungeon.bossLevel() || !Dungeon.interfloorTeleportAllowed()`) and with a hostile adjacent (`beaconAdjacentEnemy`, Java's `NEIGHBOURS8` alignment scan). `AC_ZAP` is aimed through the scene's MWG `TargetingController` seam (`beginAiming`/`confirmAiming`, the same one six runestones and the disintegration wand already use) in place of Java's own `GameScene.selectCell(zapper)`; targeting the hero's own cell re-teleports the hero by reusing the exact `randomFreeCell`/`moveTo` pair `scrollTeleportation` already uses for `ScrollOfTeleportation.teleportChar`, and targeting a creature attempts the same for it, honoring `IMMOVABLE_KINDS` (`tele_fail`) and boss floors (`no_tele`) the way Java's `zapper.onSelect()` callback does; `Invisibility.dispel()` is reproduced as clearing the hero's own `invisibility` buff, matching every other dispel site in this port. A real passive recharge runs every actor turn (`beaconRecharge.act()`'s own `partialCharge += 1/(100-(chargeCap-charge)*10)` formula, gated on `!cursed`), persisted as `beaconCharge`/`beaconPartialCharge` (named distinctly from Cape/Toolkit's own already-live but not-yet-persisted `charge`/`partialCharge` fields, so this does not change what those two save). **Simplified**: real Java's `Ballistica` line-of-sight collision along the aimed path (a nearer wall or creature could intercept the bolt before the chosen cell) is not reproduced - this port resolves on the exact chosen cell, since `beginAiming` only ever offers clear-LOS cells to begin with anyway; the aim range itself borrows the same fixed `stoneTargetRange`-style cap other aimed utility items use (`beaconZapRange = 8`), since Java's own zap has no numeric range at all. **Not ported**: `interfloorTeleportAllowed()`'s `LockedFloor` boss-arena lock (this port has no boss-arena lock state modeled anywhere, matching the mining branch/amulet checks that are modeled), the same regen-gate omission already stated for the Broken Seal shield's own passive regen, Java's mob-displacement when a creature already occupies the saved return cell (refused with the same `creatures` line the adjacency gate uses, matching `useBeaconOfReturning`'s own existing simplification), and the `WndUseItem` options-window presentation itself. `tools/verifyItemWorkflows.mjs`'s ground-kind alias count is updated for the new `beacon` row (25 -> 26). **Browser-verified live** (`chrome-devtools-mcp`, built `dist/`): a generated Lloyd's Beacon showed the real French name/description in the bag's dedicated artifact slot; opening it with zero charge and no return point offered only `FIXER` (SET); after setting it, moving away, and manually granting `charge = 3`, re-opening it offered all three rows (`UTILISER`/`FIXER`/`RETOURNER`); `RETOURNER` moved the hero back to the exact set cell; `UTILISER` opened the real aiming prompt ("Choisissez où jeter le sort"), and confirming on the hero's own cell teleported the hero elsewhere on the floor, decremented `charge` from 3 to 2, and showed the real teleport-success log line. |
| `MasterThievesArmband`/`MasterThievesArmband.Thievery` (`items/artifacts/MasterThievesArmband.java`, tag `v3.3.8`) | `useArmband`, `armbandItem`, `armbandStealTarget`, `armbandLootChance`, `armbandLootPick`, `confirmArmbandSteal` in `src/scenes/dungeonScene.ts`; `applyArmbandGainCharge` in `src/items/artifactActions.ts`; the `armband` item id, `itemActionKeys`/`itemGroundKindAliases`/frame/`itemEffectValues` rows in `item-rules.mwl`; `armbandStolen` added to the saved creature shape | **Ported (2026-09-15), the seventh real artifact this port implements** (after Cloak of Shadows, Timekeeper's Hourglass, Chalice of Blood, Cape of Thorns, AlchemistsToolkit, LloydsBeacon). `AC_STEAL` opens through the scene's MWG `TargetingController` seam (`beginAiming`/`confirmAiming`, `range: 1` standing in for Java's `Dungeon.level.adjacent()` check - both mean "one of the eight neighbouring cells"), gated on `charge > 0` and `!cursed` exactly as `MasterThievesArmband.actions()` requires (this port has no artifact equip slot, so `isEquipped(hero)` does not apply, the same stated simplification Toolkit/Beacon already carry). `applyArmbandGainCharge` mirrors `Thievery.gainCharge()` exactly - `3 * percent * ringMultiplier` banked at the same `Hero.earnExp()` call site `applyToolkitGainCharge` already hooks, capped at `5 + floor(level/2)` with the same zero-at-cap `partialCharge` reset. A successful target rolls the mob's own loot chance (`armbandLootChance`, reusing `kill()`'s exact Warlock/Scorpio/Succubus flat-chance special cases and `MOB_LOOT`/`LIMITED_DROP_DECAY` for every other kind, plus `RingOfWealth`/Bounty Hunter, since those are `Mob.lootChance()`'s own generic terms) times `1 + 0.1*level`, forced to zero once `hero.lvl > maxLvl + 2` or the target has ever been stolen from before (`armbandStolen`, a persisted one-shot marker standing in for Java's `StolenTracker` buff), boosted by `+0.5` loot/`+2` debuff-turns/`+2` bonus exp on a surprise hit (reusing the exact `sleeping || !seesHero` surprise test already established at the melee `attack()` call site). A successful steal drops the resolved item at the target's cell (`armbandLootPick`, the same per-kind branches `kill()`'s own loot block already uses); every attempt, win or lose, clears the hero's invisibility, applies `daze`+`cripple` for `3 + level/2` turns (`daze` standing in for Java's `Blindness`, the same substitute already established at the Bandit-steal site; `cripple` applied directly), and grants the artifact `exp` toward its own `level` (capped at 10). **Not ported**: the attack-animation callback structure - Java resolves the loot roll and debuff from inside `curUser.sprite.attack()`'s completion callback, a beat after the swing animation plays; this port resolves it immediately, matching every other artifact action here. `tools/verifyItemWorkflows.mjs`'s ground-kind alias count is updated for the new `armband` row (26 -> 27). `tsc --noEmit`, `npm run build`, and the full `npm run verify` suite are all green (the alias-count assertion needed the same one-line bump the four artifacts before it also needed). **Browser-verified live** (`chrome-devtools-mcp`, built `dist/`): a generated armband showed the real French name/description ("brassard de maître voleur") and correctly occupied the dedicated artifact equip slot; with `charge` manually set to 3 and a rat placed adjacent to the hero, `VOLER` opened the real "Choisissez un ennemi à cibler" aiming prompt, confirming on the rat printed the real "Cet ennemi ne possède rien à voler" line (a legitimate zero-loot-chance outcome, not a stub message), and directly inspecting scene state afterward confirmed `charge` decremented 3 -> 2, `armbandStolen` was set on the rat, and both `daze`/`cripple` were applied for 5 turns (the base `3 + level/2` plus the surprise bonus, since the rat did not see the hero) - the full real mechanic, not just the picker UI. |
| `HornOfPlenty`/`HornOfPlenty.hornRecharge` (`items/artifacts/HornOfPlenty.java`, tag `v3.3.8`, diffed against `4.0.0-beta` - byte-identical) | `useHorn`, `hornItem`, `hornChargeCap`, `hornSatietyPerCharge`, `eatFromHorn`, `storeFoodInHorn` in `src/scenes/dungeonScene.ts` (needs the scene's own `openItemPicker` seam for both the action menu and the food-selection sub-picker, so it lives there rather than in `artifactActions.ts` with its five siblings above); `applyHornGainCharge` in `src/items/artifactActions.ts`; the `horn` item id, `itemActionKeys`/`itemGroundKindAliases`/`itemSpecificFrames`/`itemEffectValues` rows in `item-rules.mwl`; `itemDisplayName`'s horn-picker-row special case in `src/items/displayName.ts` | **Ported (2026-09-15), the eighth real artifact this port implements** (after Cloak of Shadows, Timekeeper's Hourglass, Chalice of Blood, Cape of Thorns, AlchemistsToolkit, LloydsBeacon, MasterThievesArmband) - and the artifact that previously stood in for the six-member placeholder bundle above via a fabricated "feed one unit, eat one unit" counter with no seam wired to it at all (`feedHornFromBag`/`eatHornCharge` were declared optional hooks on `ArtifactActionContext` that the scene never actually implemented, so every use silently fell through to the bundle's generic failure line). `useHorn` opens the same generic item-picker seam `useBeaconArtifact` already established, offering the real per-action rows - `AC_EAT`/`AC_SNACK` only once `charge > 0` (available even while **cursed**, matching `HornOfPlenty.actions()`'s own gate, which is *not* the uniform `!cursed` refusal every other artifact action here uses) and `AC_STORE` only while `level() < levelCap` and *not* cursed - labelled with the real `ac_eat`/`ac_snack`/`ac_store` strings. `eatFromHorn` reproduces `doEatEffect()` exactly: `AC_EAT` spends `max(1, floor(hunger/satietyPerCharge))` charges (capped at what's on hand) to fill hunger, `AC_SNACK` always spends exactly one, and `satietyPerCharge = STARVING/5` is further halved under the `NO_FOOD` challenge, the same check `eatFood()` already applies to ordinary food. `AC_STORE` opens a second picker over the carried food stack (`storeFoodInHorn`, mirroring `GameScene.selectItem(itemSelector)`) and reproduces `gainFoodValue()`: each food's stored hunger value (`MWL_CONSUMABLE_STATS[id].hunger`, this port's already-established stand-in for `Food.energy`) banks into `storedFoodEnergy`, plus a bonus for the richest foods - Pasty worth `HUNGRY/2` extra, MeatPie a full extra `HUNGRY` (this port has no `PhantomMeat` item, so only Pasty gets the bonus Java also grants that class) - and every full `HUNGRY` banked raises the horn a level, capped at `levelCap - level`, resetting `storedFoodEnergy` to 0 on hitting the cap exactly as Java's `level() == 10` branch does. `applyHornGainCharge` mirrors `hornRecharge.gainCharge()` exactly - the same `Hero.earnExp()` call site `applyToolkitGainCharge`/`applyArmbandGainCharge` already hook, `chargeGain = STARVING*percent*(0.25+0.125*level)*ringMultiplier`, divided by `STARVING/5` and banked in whole-unit increments, capped at `chargeCap = 5 + floor(level/2)` with the same zero-at-cap `partialCharge` reset (and the same guard - a cursed horn never regains charge passively, matching Java's `if (cursed || ...) return;`). **Not ported**: the class meal talents (Iron Stomach's reduced eat time, Energizing/Mystical/Invigorating/Focused/Enlightening Meal's bonuses) that real Java's `doEatEffect()` triggers via `Talent.onFoodEaten()` on every horn-eat - this port's own `eatFood()` (for ordinary food) applies those talent effects inline rather than through a shared, reusable hook, so reusing just the hunger-restoration seam for the horn leaves those talents untriggered here; the missing Light Cloak `artifactChargeMultiplier` bonus on top of `ringEnergyMultiplier`, matching the identical, already-documented gap on Toolkit/Armband; and the uncooked-Blandfruit `AC_STORE` rejection message (`reject`) - Not applicable, since this port's `blandfruit` item is not itself wired as an eatable/storable food at all (it only exists today as an alchemy-recipe ingredient), so the rejection case cannot arise. `tools/verifyItemWorkflows.mjs`'s ground-kind alias count is updated for the new `horn` row (27 -> 28). `tsc --noEmit`, `npm run build`, and the full `npm run verify` suite are all green. **Browser-verified live** (`chrome-devtools-mcp`, built `dist/`): a generated horn showed the real French name/description ("corne d'abondance") in the bag; at `charge = 0` it offered only `STOCKER`, and picking a carried Ration through the food sub-picker consumed it, banked exactly one level (`300`/`HUNGRY` hunger from a Ration is exactly one upgrade) and printed the real level-up line; granting the hero 50 XP via `grantExperience` banked `charge` from 0 straight to the level-1 cap of 5 (`partialCharge` correctly reset to 0 at the cap); with `hunger = 200`, `MANGER` (EAT) consumed exactly 2 charges (`floor(200/90)`) and left `hunger = 20`, and a follow-up `GRIGNOTER` (SNACK) consumed exactly 1 more charge and floored `hunger` to 0 (`max(0, 20-90)`); and setting `cursed = true` confirmed the asymmetric gate live - the picker then offered only `MANGER`/`GRIGNOTER` with no `STOCKER` row, and a further `grantExperience(50)` call left `charge` completely unchanged, matching Java's cursed-blocks-passive-gain-and-storage-but-not-eating behaviour exactly. |
| `EtherealChains`/`EtherealChains.chainsRecharge` (`items/artifacts/EtherealChains.java`, tag `v3.3.8`, diffed against `4.0.0-beta` - byte-identical) | `useChains`, `chainsItem`, `confirmChains`, `chainEnemy`, `chainLocation` in `src/scenes/dungeonScene.ts` (needs the scene's own `beginAiming`/`confirmAiming` targeting seam, so it lives there rather than in `artifactActions.ts` with its four siblings above), plus the passive per-turn regen block next to `LloydsBeacon`'s own inside the scene's shared per-turn buff handler; `applyChainsGainExp` in `src/items/artifactActions.ts`; the `chains` item id, `itemActionKeys`/`itemGroundKindAliases`/`itemSpecificFrames`/`itemEffectValues` rows in `item-rules.mwl` | **Ported (2026-09-15), the ninth real artifact this port implements** (after Cloak of Shadows, Timekeeper's Hourglass, Chalice of Blood, Cape of Thorns, AlchemistsToolkit, LloydsBeacon, MasterThievesArmband, HornOfPlenty) - and the last of the five-member bundle above to graduate, replacing a "pull the nearest visible enemy" stand-in with no cell picker at all. `AC_CAST` opens through the scene's `beginAiming`/`confirmAiming` seam with `requireLineOfSight: false` (chains "extend through walls", matching the flavor text and Java's own sight-free `GameScene.selectCell(caster)`) and a `validate` hook requiring the cell be `explored` or currently `visible` - this port's `FieldOfView` state standing in for Java's `Dungeon.level.visited[]`/`mapped[]` arrays. Real Java's picker has no numeric range at all (any explored tile qualifies); `beginAiming` needs a finite one, so `useChains` passes the level's own diagonal span (`max(width, height)`), covering every cell on any single floor this engine generates - a stated simplification, not a balance number. `confirmChains` reproduces the reachability pre-check (`PathFinder.buildDistanceMap` from the target, refusing `cant_reach` if the hero's own cell comes back unreachable, skipped on a mining-branch floor exactly as Java skips it for `MiningLevel`) and then traces a straight line to the target (`Roguelike.traceLine`, matching `Ballistica(pos, target, STOP_TARGET)` with no `STOP_CHARS`/`STOP_SOLID` flags - chains phase through both, so the path always resolves on the clicked cell). A creature standing on that exact cell routes to `chainEnemy`: refuses an `IMMOVABLE_KINDS` target (`cant_pull`), otherwise pulls it to the earliest open, unoccupied cell on the path counting from the hero's end (`does_nothing` when none exists - already-adjacent or fully blocked), at a charge cost of `Chebyshev distance(enemy, destination)` (`Level.distance`). An empty target routes to `chainLocation`: refuses while rooted, into a solid cell (`inside_wall`), or with no solid neighbour to "grab" (`nothing_to_grab`), otherwise pulls the hero to the aimed cell at `Chebyshev distance(hero, target)` charge. Both branches dispel the hero's invisibility on success, matching `Invisibility.dispel(hero)`. The passive `chainsRecharge.act()` regen (`partialCharge += 1/(40-(chargeTarget-charge)*2)` every actor turn below the *soft* `chargeTarget = 5+level*2` cap, gated on `!cursed`) and its cursed branch (1% per-turn chance of a 10-turn Cripple, `Random.Int(100)==0`) both run in the scene's shared per-turn buff block, the same shape `LloydsBeacon.beaconRecharge.act()` already uses there. `applyChainsGainExp` reproduces `chainsRecharge.gainExp()` - unlike Toolkit/Armband/Horn's `gainCharge`, this one call also drives artifact leveling: `exp += round(levelPortion*100)`, leveling up (capped at `levelCap = 5`) once `exp > 100+level*100`, and charge gain `levelPortion*6` throttled by `chargeTarget/charge` once *past* that soft cap rather than refused outright (charge can still climb slowly via combat XP beyond it, unlike the other three artifacts' hard caps). **Simplified**: the `LARGE`/`openSpace` clause on `chainEnemy`'s destination search is vacuous - no `LARGE` creature kind exists in this port, the same simplification `summonSkeleton`'s own push-aside search already states; Java's `passable || avoid` test for `chainLocation`'s destination collapses to a single `passable` check, since this port has no separate `avoid` array (every hazardous-but-walkable cell, like a trap, is already `passable`, so nothing `avoid` would additionally admit is excluded by dropping it); and every artifact action in this scene is turn-free, matching Cloak/Chalice/Hourglass/Beacon/Armband above, unlike Java's own `hero.spendAndNext(1f)`. **Not ported**: `Talent.onArtifactUsed`/`artifactProc` (no talent hook reaches any artifact action in this port, an existing gap, not a new one), and the `Chains`/`Pushing` pull animation (a log-free instant relocation here, the same convention `confirmBeaconZap`'s teleport already established). `tools/verifyItemWorkflows.mjs`'s ground-kind alias count is updated for the new `chains` row (28 -> 29). `tsc --noEmit`, `npm run build`, and the full `npm run verify` suite are all green. **Browser-verified live** (`chrome-devtools-mcp`, built `dist/`): a generated chains artifact showed the real French name ("chaînes éthérées") in the bag; with `charge = 5` and a rat placed 3 cells away on a clear line, `useChains` opened the aiming state, and confirming on the rat's cell pulled it to the cell adjacent to the hero (the earliest open cell on the path) while `charge` dropped from 5 to 3, exactly `Chebyshev distance(2)`; aiming a second cast at an empty, explored, reachable cell with a solid neighbour and no creature on the line pulled the *hero* there instead, dropping `charge` from 3 to 0 at exactly `Chebyshev distance(3)`; and with `charge` at 0, a third `useChains` call correctly opened no aiming session at all (silent refusal, matching Java's own `no_charge` gate). |

| `MissileWeapon.min(int)`/`max(int)`, `durabilityPerUse()`, and the `proc()` overrides of the fifteen missile classes | `missiles.mwl` (both tables), `items/missiles.ts` (`missileDamageRange`, `missileBaseUses`, `bolasCrippleTurns`, `tomahawkBleedRange`), `ammoSourceClass` + `wieldMissile` + `applyMissileClassProc` in the scene | **Ported 2026-09-15, at tag `v3.3.8`** - the twelve non-starting missile classes were unreachable data before this (only the hero class's own missile could ever be thrown), so their damage, durability and procs are now live: `wieldMissile` sets `ammoSourceClass` from the wielded item, and the thrown damage (`missileDamageRange`), the durability `baseUses` (`missileBaseUses`) and the class's `proc()` (`applyMissileClassProc`) all read it. The rules table now carries all fifteen classes, derived from Java's base `min = 2*tier + lvl` / `max = 5*tier + tier*lvl` plus each class's own override (ThrowingKnife's `6*tier + (tier == 1 ? 2*lvl : tier*lvl)` max, Bolas' `2*(tier-1) + 0*lvl` min and `3*tier + (tier-1)*lvl` max, Tomahawk's `round(1.5*tier) + lvl` / `round(4*tier) + (tier-1)*lvl`, HeavyBoomerang's `4*tier + (tier-1)*lvl` max, Shuriken's `4*tier + (tier == 1 ? 2*lvl : tier*lvl)` max, and Kunai/ThrowingClub/ThrowingHammer's `4*tier + tier*lvl` max) and pinned by the item suite. **Browser-verified live**: wielding a Bolas/Spike/Stone/ForceCube switched the tracked class and the pile each time; the per-use durability cost followed it (20.001 for the 5-use classes, 8.3343 for the 12-use spike - a *Warrior* wielding a spike, where the old hero-class rule always said 5); a Bolas proc applied Cripple for 5; a Tomahawk proc applied Bleeding at 4 (inside its level-0 `NormalFloat(3, 6)`); and a ThrowingStone proc applied nothing, as Java's base no-op does. Not ported: `HeavyBoomerang`'s `CircleBack` return - it needs a concrete thrown instance to fly home, and `Bolas`/`Tomahawk`/`FishingSpear` are the only other classes with a real `proc()` at all. |
| `Belongings.thrownWeapon` - wielding a carried missile | `wieldMissile`, `itemActions.ts`'s `missile_*` branch, the `ammo`/`ammoSetId`/`ammoDurability` fields | Ported as a counter, not a stack: Java equips the carried missile as the hero's thrown weapon (`Belongings.java` 85, what `MissileWeapon.doThrow` spends and the crossbow/SpiritBow read), while this port's ammo has no per-item identity (see the MissileWeapon row above). Wielding therefore folds one carried missile into the counters exactly as `recoverStone` folds in a stone recovered from a kill - the same set adoption while the counter is empty and the same durability reset once it has run out - so the route the ammo arrived by cannot change what it does. It says the pickup line with the missile's own name: Java's feedback for the same event is the item-name status `GameScene.pickUp` shows, and this port's catalogue has no dedicated wield line for missiles. |

| `RingOfWealth.tryForBonusDrop()`/`genConsumableDrop()`/`genEquipmentDrop()` + the two tracker `CounterBuff`s (`items/rings/RingOfWealth.java`, tag `v3.3.8`) | `src/items/wealthDrops.ts` (the counters, the `equipBonus` cap, the tier thresholds and the whole drop catalogue as a plan tree), `tryWealthBonusDrop`/`materialiseWealthDrop`/`freeCellNear` in `src/scenes/dungeonScene.ts`, the `kill()` call site, the `wealth*` effect rows in `item-rules.mwl` | **Ported (2026-09-15).** This row used to read "Simplified but playable", and its own text named what was missing: the counters were Java's, but the *catalogue* was a stand-in ("a depth-derived `armorReward`, or a flat potion/scroll/stone/gold pick"). The counters and the payout shape are now Java's exactly: `TriesToDropTracker` starts at `NormalIntRange(0, 20)` and is debited by the kill's rolls (1, or 15 for a `Property.BOSS` and 5 for a miniboss - this port's `boss`/`miniboss` actor flags, the same properties the half-damage branch already reads), `DropsToEquipTracker` at `NormalIntRange(5, 10)` pays out the *equipment* half whenever it reaches zero and refills itself, the consumable half decrements it by one per payout, and each payout adds another `NormalIntRange(0, 20)` to the first counter. The `equipBonus` loop is verbatim, including the "a second ring of wealth can be at most +1" cap (this port has one ring slot, so the loop normally sees a single level; the rule is kept because it makes the number for two). Consumable tiers are Java's thresholds (`0.6 - 0.04*level` / `0.9 - 0.02*level`, so the low tier is gone by +15 and the high tier has grown to 40%), and every case of all three tiers now produces a real item through this port's own generators: gold (halved), a runestone, a potion or scroll from `randomUsingDefaults`, `Bomb`, `Honeypot`, `DoubleBomb` (Java's `if (i instanceof Bomb)` special case in the high tier's doubling), `StoneOfEnchantment`, `PotionOfExperience`/`ScrollOfTransmutation`; equipment drops use `randomWeapon(floorset, true)`/`randomArmor(floorset)`/`randomUsingDefaults(RING)`/`randomArtifact()` at `floorset = (depth+level)/5` with the `(level+1)/2` minimum upgrade level, Java's own `!hasGoodEnchant && Int(10) < level` enchant short-circuit, and the unconditional `cursed = false`/`cursedKnown = true` handover. Doubling is modelled as Java nests it (`quantity(i.quantity()*2)` around the tier below), so a high-tier mid roll of a potion is four in one stack. **Simplified**: Java drops at the mob's own cell and lets `Heap` stack it, while this port's one-item-per-cell rule places each drop in the nearest free cell and doubles a `doubled` payload's `quantity` in place. **Not ported**: the heap-creation call site (`Heap`'s own constructor also rolls `tryForBonusDrop(hero, 1)` for *every* heap dropped into the level, generated ones included; this port has one `spawnGroundItem` shared by floor generation and runtime drops, and its floors are re-generated from the seed on every re-entry, so rolling there would duplicate items on a revisit), `Challenges.isItemBlocked` filtering on each generated drop (this port's challenge set has no item-blocking one), the exotic halves of the mid/high tiers (`ExoticPotion`/`ExoticScroll`/`UnstableBrew`/`UnstableSpell`/`PotionOfDivineInspiration`/`ScrollOfMetamorphosis` do not exist here; each case still spends Java's own draws and falls back to the regular counterpart, and with no `ExoticCrystals` equipped Java's own `consumableExoticChance()` is 0 anyway), the new-drop flare, and the ability to see the drops' tier in the UI. Browser-verified live (`tools/scratch/wealth-livecheck.mjs`, 8/8): with a `ring_wealth` equipped an equipment payout spawned one *generated* equipment item (never the old `armorReward` stand-in), handed over uncursed, with the equip counter refilled into `5..10`; six boss-sized consumable rounds produced only real catalogue kinds; and with no ring equipped the same call spawned nothing. `tools/verifyItemWorkflows.mjs` pins the `equipBonus` cap, the tier thresholds, the 1/5/15 roll counts and the payout sequence against a scripted RNG. |

| `PotionOfLiquidFlame.shatter()` / `Fire` blob | `quaffPotion`'s `potionFlame` branch and floor `fire` state | Simplified but shape-faithful: quaffing now seeds Fire volume 2 in the Java `NEIGHBOURS9` area centered on the hero, replacing the previous incorrect instant 4-damage nearest-enemy hit. The port has no thrown-cell picker and its shared Fire evolution applies Burning on the following turn rather than Java's exact blob actor cadence; terrain destruction, heap burning, particles, and audio remain unported. |
| `Golem.Wandering.continueWandering()` self-teleport | `Creature.patrolTarget`, `golemSelfTeleCooldown`, wandering path fallback | Simplified presentation, Java-shaped behavior: when a retained wandering destination cannot be approached, the Golem relocates to it, uses the real 30-turn cooldown, and costs 2 ticks. The Java charge-particle/delayed-animation actor is folded into one logical action. |

| `Golem.act()` cooldown ticking | `takeMonsterTurn` before AI dispatch | Ported: both enemy-teleport and wandering self-teleport cooldowns now decrement on every Golem turn, including adjacent melee turns, matching `Golem.act()` rather than only ticking in the ranged branch. |
| `WandOfRegrowth.Lotus` and `Plant.trigger()` seed preservation | `spawnLotus`, `takeAllyTurn`, `lotusPreservesSeed`, `useRegrowthWand`, `triggerPortedPlantAt` | Ported with presentation/carrier simplification: qualifying 3-charge casts create a neutral expiring Lotus with Java's `25 + 3*wandLevel` HP, and nearby plants preserve their concrete seed with the real `0.40 + 0.04*wandLevel` chance, excluding Rotberry. The target-cell picker and Lotus sprite are represented by the target-centred eligible-cell choice and a tinted ward carrier. |

| `Waterskin` explicit drink action | inventory entry/use dispatch | Ported through the compact inventory UI: selecting the Waterskin now invokes its drink behavior even when other potions are present, while preserving Java's drop-count and shield calculations. |
| `Swarm.defenseProc()` split state and `lootChance()` generation term | `main.ts`'s `swarmSplit`, `monsters.ts` `MOB_LOOT.swarm`/`LIMITED_DROP_DECAY` | Ported: a surviving Swarm hit can create a free 4-neighbour clone with `floor((preHitHP-damage)/2)` HP while retaining the normal 50-HP maximum, increments the clone generation, copies Burning/Poison/champion state, and applies Java's `1/(6*(generation+1))` loot term together with the run-wide `SWARM_HP` decay. The compact scheduler still uses the shared spawn-time stagger rather than Java's exact one-time `SPLIT_DELAY = 1` timestamp. |

| `Armor.speedFactor()` / `Swiftness` glyph | `main.ts`'s `getActionTurnCostMod` and `hasSwiftnessEnemyNearby` | Ported: safe movement uses Java's 8-way passable path-distance-2 enemy check and applies the exact `(1.2 + 0.04 * buffedLvl) * RingOfArcana` speed multiplier as inverse action cost. The port still uses its shared fractional turn clock rather than Java's actor-duration scheduler. |
| `Armor.speedFactor()` / `Flow` glyph | `main.ts`'s `getActionTurnCostMod` | Ported: while standing in water, Flow applies Java's `(2 + 0.5 * buffedLvl) * RingOfArcana` speed multiplier as inverse action cost. The port has no separate water animation/audio effect. |

| Legacy Flow `+2 evasion` stand-in | `main.ts`'s `syncHeroFromStats`/`equipArmor` | Removed: `Flow.java` has no evasion effect; its only gameplay effect is the water speed multiplier documented above. |
| `StoneOfAggression.Aggression`: the mark's duration *and* the half-damage branch Java keys on it | `main.ts`'s `useStoneOfAggression`/`aggressionTarget`, the new `miniboss` actor flag through `MINIBOSS_KINDS`, `rollDamage` | **Ported, correcting this row's earlier claim.** That claim - "Java uses 20 turns for an allied target and `DURATION / 4` (5 turns) for every enemy target, not only bosses" - was the opposite of the truth. `activate()`'s condition is `Char.hasProp(ch, Property.BOSS) \|\| Char.hasProp(ch, Property.MINIBOSS)`: a property check with nothing to do with alignment, so only a boss/miniboss gets `DURATION / 4` and *everyone else, enemy or ally alike, gets the full 20*. The port had been shortening every non-ally to 5, i.e. a quarter of Java's duration for every ordinary enemy - and since this call site can only target an enemy, the 20-turn case never occurred at all. Fixed, and browser-verified live: an ordinary rat is marked 20, GreatCrab and Pylon 5 as MINIBOSS, Goo 5 as BOSS. The mechanic's other half is now modelled too: `Char.attack()` 480-488 halves a marked BOSS/MINIBOSS's incoming damage when the attacker shares its alignment (an enemy mob driven onto it by the stone - never the hero or a converted ally, which are `ALLY` against a boss's `ENEMY`, and never an unmarked or ordinary target) and halves it again for Yog-Dzewa, applied *before* the armor subtraction exactly where Java applies it - a position that matters for rounding (10 raw against 3 armor is `round(5)-3 = 2` here, versus `(10-3)*0.5 = 4` if it ran after). Needs the new `miniboss` actor flag: `Char.Property.MINIBOSS`'s members this port spawns are FetidRat, GnollTrickster, GreatCrab, DemonSpawner, Pylon, RotHeart, RotLasher and `Elemental.NewbornFireElemental`; CrystalGuardian, FungalSentry and GnollSapper are unported. Kept as a separate flag from `boss` because Java checks the two properties separately here and in `CombinedLethality`/`MonkEnergy`. Still unmodelled: the cell-targeted throw (the port's nearest-visible-enemy convention, documented on the method), `Aggression.detach()`'s reset of enemy-to-enemy aggro, and `iconFadePercent`'s cosmetic fade. Java spells the same half-damage rule out again in two ranged attacks - `Eye.deathGaze()` (197-205, "logic for fists or Yog-Dzewa taking 1/2 or 1/4 damage from aggression stoned minions") and `Warlock.zap()` (122-127, the same, commented for the Dwarf King) - and both are **unreachable in this port rather than omitted**: the DeathGaze beam here only ever targets the hero, and a monster forced by the stone onto a non-adjacent target takes `takeAggressionTurn`'s approach-and-melee path instead of its ranged dispatch, so neither site can see a marked boss. |

| `Goo.act()` water healing and `Goo.healInc` | `takeGooTurn`, `Creature.gooHealInc`, `SavedCreature.gooHealInc` | Ported: Goo heals by its persistent increment while damaged and standing in water; the `STRONGER_BOSSES` challenge starts it at 120 HP and ramps the increment from 1 to 3, while leaving water or reaching full HP resets it to 1. Java's `LockedFloor` boss-room door countdown and its visual healing presentation remain unported. |
| `Monk.focusCooldown` / `Monk.move()` / `Senior.move()` | `Creature.focusCooldown`, `afterMonsterTurn`, `moveTo`, Focus defense branch | Ported: Focus now uses a persistent floating 6–7-turn cooldown after a parry, loses one action-time unit per Monk/Senior turn, and gains Java's extra movement reductions (0.67 for Monk plus 1.66 for Senior). The port still attaches Focus through its shared buff map and has no Java sprite/audio parry presentation. |

| `Shaman.random()` subtype and `Shaman.zap()` debuff | `Creature.shamanType`, `spawnMonster`, `zapHero` | Ported: Shamans now retain Java's one-draw 40% red/30% blue/30% purple subtype and apply Weakness, Vulnerable, or Hex on a landed magic bolt at the real 1-in-2 chance. Dedicated colour sprites and debuff audio remain unported. |
| `WandOfFrost.onZap()` damage and Chill interaction | `useSpecial` wand branch | Simplified: Frost uses Java's `2+level` to `8+5*level` damage range, reduced damage against existing Chill, no damage to an already-Frozen target, and terrain-sensitive `2+level`/`4+level` Chill. Ordinary Fire and EternalFire are cleared at the selected collision cell, and the directional next cell of EternalFire is also cleared, matching Java's `Freezing`/`WandOfFrost` path. Frozen heaps, exact cell targeting, and staff-on-hit Frost remain unmodeled. |

| `WandOfLightning.onZap()` water multiplier and recursive chain | `useSpecial` wand branch, `lightningTargets` | Ported for represented actors: water collision uses Java's full-damage multiplier, ordinary strikes use `0.4 + 0.6 / affectedCount`, and the affected set recursively follows passable-cell path distances (radius 2 from water, radius 1 otherwise) without duplicate hits, including the caster's Java half-damage self-hit and same-alignment skip. NPCs remain excluded and the visual Lightning arcs are not modeled. |
### Current correction: EnhanceBomb

The ten `Bomb.EnhanceBomb` ingredient/result pairs are now executable through the authored
alchemy picker. The base blast follows Java's own `explosionRange()` per subclass (1 for a plain
bomb, 2 for Frost/Fire/Flashbang/Shock/Woolly/Holy/Noisemaker, 3 for Regrowth, 8 for Shrapnel),
and Regrowth, Arcane and Shrapnel no longer receive it at all - all three override
`explodesDestructively()` to false in Java, so giving them the base blast was an undeclared
divergence. Arcane then rolls its own armor-piercing `NormalIntRange(4+scalingDepth,
12+3*scalingDepth)`, Shrapnel the same roll minus the target's armor over line of sight up to 8,
and Regrowth heals (through the ordinary `PotionOfHealing.cure()`/`heal()` pair, hero only - the
port has no standing ally side) instead of damaging anything; healing every monster in the area
was a plain bug. Holy's bonus is Java's own `Math.round(NormalIntRange(scalingDepth+4,
12+3*scalingDepth) * 0.5f)` (the previous 5+depth..10+2*depth range was invented), and Frost,
Fire, Flashbang, Shock and Woolly still reuse the existing chill/fire/status/sheep seams. Every
one of these effects deliberately uses a Chebyshev circle where Java builds a PathFinder distance
map or a ShadowCaster field of view, shared statuses rather than Java's exact blob/bolt/blindness
subsystems, and three sheep rather than the real spawn field and lifetimes. Noisemaker's own fuse
is now ported (`tickBombFuses`): its 2-turn fuse arms the alarm instead of exploding, an armed
unit detonates as soon as any character stands on its cell, it re-screams every 6 acts, cannot be
picked up or snuffed once armed, and keeps acting through a Timekeeper freeze
(`NoisemakerFuse.freeze()`). Its scream reuses the port's `Mob.beckon(pos)` stand-in, so it wakes
and turns the level's mobs instead of sending them to the bomb's cell, and the Java alert
sound/scream particle are not reproduced; the state (`noisemakerArmed`/`noisemakerAlertIn`) rides
the heap payload and so survives save/load. Picking up any lit bomb now snuffs it, not only a
plain `bomb` (a lit specialty bomb used to keep its `fuseTurns` in the bag). The crystal
pool is now enforced, but its scrap/add UI and blast particles/sound remain open. GooBlob and
MetalShard identities are authored, their Java value/energy metadata is represented, and
Goo/DM-300 now drop 2/3/4 materials with the real 60/30/10 distribution. The port's
one-item-per-cell placement is a documented heap simplification.
