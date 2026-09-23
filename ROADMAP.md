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

- [x] Implement exact formulas for the remaining talents. Six wrong-shaped stand-ins have been
      corrected against the real source (Lethal Haste, Weapon Recharging, Farsight, Arcane Vision,
      `POINT_BLANK` - an accuracy factor and nothing else, applied inside `adjacentAccFactor` - and,
      in the 2026-09-09 audit, Hearty Meal, Sucker Punch, Aggressive Barrier and the per-tier
      talent-point pools, which had wrongly been one shared pool). Test Subject/Tested
      Hypothesis are port-original talents, kept deliberately (see `PORT_COVERAGE.md`'s talent
      row: absent from `Talent.java` and the `actors` strings at `v3.3.8`/`v4.0.0`/master);
      Swift Equip is genuine. `Iron Will`'s invented flat-damage-reduction stand-in is
      replaced by the real `BrokenSeal` shield mechanic. **Progress 2026-09-21: the Cleric's tier-1
      talent row is Java's own now** (`SATIATED_SPELLS`/`HOLY_INTUITION`/`SEARING_LIGHT`/`SHIELD_OF_LIGHT`
      with the tome-window talent spells, the eaten-food tracker, the illuminated-hit bonus and the
      light-shield tracker - see `PORT_COVERAGE.md`'s tier-1 row); **tier 2 is Java's own since 2026-09-21** (`ENLIGHTENING_MEAL`/`RECALL_INSCRIPTION`/`SUNRAY`/`DIVINE_SENSE`/`BLESS` with the meal charge, the scroll/stone arming, the four tome-window spells and their resolves - see `PORT_COVERAGE.md`'s tier-2 paragraph); **tier 3 is Java's own since 2026-09-21** (`CLEANSE`/`LIGHT_READING` with the spell resolve, the T3 tab unlock, the metamorphosed dead-leg hooks and the shared immunity gate - see `PORT_COVERAGE.md`'s tier-3 paragraph). **Progress 2026-09-18: a whole missing talent class
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
      **Remaining (superseded by the Progress paragraph directly below, kept for history)**: `ENHANCED_RINGS`, `LIGHT_CLOAK`, `EMPOWERING_SCROLLS`, `ALLY_WARP` and
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
      **Progress 2026-09-20:** Warden Earthroot now uses Java's `Barkskin` variant (`level + 5`, five-unit decay cadence) and persists its state; the remaining armor-ability gaps are still open.
      **Progress 2026-09-19 (20th matrix, `MONSTER_ANALYSIS_SHADOWCLONE.md`):** `ShadowClone` is
      ported - 80-HP `ShadowAlly` with Java's accuracy/evasion/damage/armor formulas, summoned or
      directed through the shared ally orders; only the gear-proc shares, double-speed return,
      interact range and sprite stay open.
      **Progress 2026-09-19 (21st matrix, `MONSTER_ANALYSIS_CHALLENGE.md`):** `Challenge` is
      ported - paired 10-turn duel with spectator freeze, close-the-gap blink, damage ledger,
      victory heal and re-challenge discount, all with Java's numbers; bomb/trap/blast negation
      on frozen spectators is now ported across the direct damage seams. **Still open, and deliberately not offered**
      (`armorAbilitiesFor()` offers only what can actually run): Trinity and PowerOfMany were
      previously unoffered; PowerOfMany now has a documented existing-ally slice below.
      **Assessed 2026-09-21, an epic not a remainder (corrected same day - the assessment
      was written from stale evidence):** the Cleric HAS a class-select entry (the MWL
      `cleric` trait, victory-gated) and starting gear (`holyTome` + purity/cleanse +
      cudgel accuracy in `makeHero`) - what was missing was everything the tome DOES.
      **Progress 2026-09-21:** tier 1 (GuidingLight/HolyWeapon/HolyWard) is ported with the
      tome's full charge/spend/upgrade economy, recharge, save/load, combat hooks
      (illuminated consume + auto-hit, holy +2 with enchant override, ward -1, skeleton
      doubling, mirror copy, crab parry) and SPD's own v3.3.8 strings/icons/art (see
      `PORT_COVERAGE.md`'s new tier-1 row, and tier 2 since 2026-09-21 (see the tier-2 paragraph there), and tier 3 since 2026-09-21 (see the tier-3 paragraph there).
      **Correction 2026-09-23: "Still open: tier 4, PRIEST/PALADIN" was stale, not a real gap.**
      All six PRIEST/PALADIN subclass tier-3 spells (`HolyLance`/`HallowedGround`/`MnemonicPrayer`,
      `LayOnHands`/`AuraOfProtection`/`WallOfLight`) were already fully ported since 2026-09-21 -
      see `PORT_COVERAGE.md`'s "PRIEST/PALADIN subclass tier-3 Cleric spells" row, now also
      live-verified in the browser (2026-09-23). Java's own tier 4 is an unimplemented `//TBD`
      placeholder (`Talent.java`'s `initClassTalents()`, tag `v3.3.8` - the `tier4` switch has no
      cases at all), so there is nothing there to port. What remains open is Trinity (AscendedForm's
      BodyForm/MindForm/SpiritForm item-effect dispatch, below).
      **Trinity arithmetic progress (2026-09-22):** the pure Body/Mind/Spirit duration, item-level, and per-effect charge rules are now pinned against the v3.3.8 Java sources. **Progress 2026-09-23:** BodyForm's modeled positive weapon-enchantment subset opens from the MWL catalog (excluding the equipped affix), applies through the melee proc path for its Java-authored duration, and was live-verified in the browser. **Progress 2026-09-23:** BodyForm also offers the modeled Stone, Repulsion, AntiMagic and Viscosity glyphs, routing them through the existing defensive hooks with Java's HolyWard-independent BodyForm proc, duplicate and MagicImmune gates; the selected glyph persists and expires with the form, and selecting either BodyForm effect dispels invisibility. The port has no Tome discovery/store inventory, so only implemented affixes are offered. MindForm and SpiritForm still record only cosmetic selection state without item-effect dispatch.
      and per-effect charge rules are now pinned against the v3.3.8 Java sources. **Progress 2026-09-23:** BodyForm's modeled positive weapon-enchantment subset opens from the MWL catalog (excluding the equipped affix), applies through the melee proc path for its Java-authored duration, and was live-verified in the browser. The full Java discovered/stored effect catalog and glyph-trigger effects remain open; MindForm and SpiritForm still record only cosmetic selection state without item-effect dispatch.
      **Scoped 2026-09-23 (not yet coded):** read `Trinity.java`/`BodyForm.java`/`SpiritForm.java` (tag `v3.3.8`)
      in full to size the remaining work precisely, since none of it is a formula gap. BodyForm's
      glyph half cannot reuse `armorGlyphActive()` (which applies HolyWard's suppression) - Java's own
      `Armor.proc()`/`hasGlyph()` run the Trinity glyph as an independent OR-branch that bypasses
      HolyWard entirely (only refusing a class match with the equipped glyph), so each of this port's
      six scattered glyph call sites (Stone/Displacement/Repulsion/Obfuscation/Antimagic/Viscosity in
      `combatResolution.ts`) needs its own added `trinityGlyphIs('x') ||` alternative, not a blended
      "effective glyph" read. MindForm temporarily wields a discovered Wand or thrown-weapon/dart at
      `MindForm.itemLevel()` for one throw/zap through `MindForm.targetSelector`; this port has no
      synthetic "temporary item cast" path today (every wand/dart cast reads a real bag instance).
      SpiritForm's ring branch needs a second, independent ring-passive slot (Java stacks it on top of
      any equipped ring) - this port models only one ring slot (`equippedRing`), read at 41 separate
      formula call sites across 9 files, so every one would need a second read, not a swap; its
      artifact branch (`applyActiveArtifactEffect`, 9 cases) is the more tractable half, since it can
      mostly reuse this port's already-ported per-artifact resolve functions
      (`useHourglass`/`useChalice`/`useToolkit`/`useSpellbook`/`useSandalsFlow`/the talisman scry flow,
      in `items/artifactActions.ts` and siblings) fed a synthetic instance at
      `artifactLevel() = 2+2*rank` instead of a real bag item. Full findings, with every Java citation,
      filed as coord DOC1 ("Trinity MindForm/SpiritForm/BodyForm-glyph scoping"). The three armor abilities' remaining spell/ally branches (AscendedForm's base shield window
      and all three of its tier-4 spells - DivineIntervention since 2026-09-22 - are live; the
      remaining Trinity forms stay open), and the
      rest of the real Cleric talent tree (tiers 1-3 are live since 2026-09-21, see
      `PORT_COVERAGE.md`'s tier-1 row; the AscendedForm tier-4 talents all have live spells).
      **Progress 2026-09-22: DivineIntervention is ported** (5 charges, once per form, raise-only
      `100+50*points` shield on the hero after the shared Ascended `+50`, the same target on
      every ALLY-aligned character as a priority-1 `DivineShield` that dies with the form, and a
      `2+points` form extension) - and fixed in the same pass, AscendedForm's mid-form recast now
      keeps the cast history/Flash count/DI flag and raises rather than resets the shield, as
      Java's `AscendBuff.reset()` does. See `PORT_COVERAGE.md`'s DivineIntervention row. Every other class now offers its
      full set, Mage's two included (closed 2026-09-21, see below).
      **Correction 2026-09-22: "the ward's glyph override" is not open - it was already live,
      the sentence above had just drifted into describing it as a gap.** `Armor.hasGlyph()`'s
      real HolyWard suppression (`items/armor/Armor.java`, tag `v3.3.8`) is fully wired in
      `combatResolution.ts` (melee glyph-proc gate, direct armor-glyph damage/passive reads,
      and a `syncHeroFromStats()` refresh on both cast and expiry) - see `PORT_COVERAGE.md`'s
      tier-1 row for the fuller correction. Found and fixed in the same pass: HolyWard's own
      tome cost was 2 (matching HolyWeapon with no Java basis); `HolyWard.java` has no
      `chargeUse()` override at all, so the real cost is `ClericSpell`'s default 1 - live-
      verified, casting it now spends exactly 1 charge. Checked DivineIntervention's Java
      source directly while investigating this line's remaining scope: it needs the same
      tier-4 talent gate as the rest of tier 4 (`hero.hasTalent(Talent.DIVINE_INTERVENTION)`),
      so it is not independently offerable without that prerequisite either.
      **Progress 2026-09-22: PowerOfMany's existing-ally combat path is now available.** An aimed
      cast empowers one visible existing ally for Java's 100 turns and applies its melee damage
      increase, incoming-attack reduction, LifeLink rank factor, and `MANY_POWER` status icon.
      Java's dedicated LightAlly summon, 25-point Barrier and free direct-order re-cast remain
      explicitly open because their actor/shield/order seams are not available here; the coverage
      and i18n rows state the reductions and fallback copy.
      **Narrowed 2026-09-19 to the real
      shared root cause, checked directly against both abilities' Java source**: this port's
      hero carries at most one `wand` bag entry at a time (`dungeonScene.ts`'s `wandType: WandType`
      is a single scalar field, `equipWand` always writes the one stackable `id: 'wand'` bag
      slot) - but per-instance wand *identity* already exists here (`id: 'wand'` entries
      carry their own `instanceId` plus `sourceClass`, several can coexist, and a carried
      wand names its own class): what does not exist is per-instance *charges*, a single
      shared `wandCharges` pool serving the wielded scalar while ground pickups absorb
      (`wandabsorbed`). Corrected 2026-09-19: identity exists, charges do not.
      Superseded 2026-09-21: per-instance charges, spare pickups, recharge, imbue and both
      abilities are live (see the progress notes below) - the blocker is lifted. Both
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
      **Progress 2026-09-21 (foundation half): per-carried-wand charges are live** -
      `simulation/spareWands.ts` ports Java's `maxCharges`/`curCharges`/`partialCharge`
      (`min(initialCharges + level, 10)`, Magic Missile 3, rest 2, arriving full), other-class
      pickups land as spare entries with identity instead of absorbing, spares recharge on
      the shared rate and persist through `bagSources`, and `WildMagic`'s shot selection
      and per-shot spend are ported pure (both suites pin them). Still open: firing the
      selected shots through the real zap effects, `MagesStaff` + its imbue choice, and
      offering either ability. See `PORT_COVERAGE.md`'s spare-wands row.
      **Progress 2026-09-21 (firing half): `WildMagic` is offered and live** - the normal
      zap extracted verbatim into `fireWandShot(wandType, ...)` (same file, budget-neutral),
      `activateWildMagic` spends the 25 armor charge and fires every selected spare at the
      Wild-Power-boosted level; self-aim refuses silently, empty cells refuse with `no_target`
      (all stated in the coverage row).
      **Progress 2026-09-21 (cursed spares): `CursedWand.cursedZap`'s Common, Uncommon and Rare
      tiers are live, scoped to 6 of 8, all 8, and 3 of 8 effects respectively** - a cursed
      spare now fires through `castCursedWandEffect` (tier roll at Java's real 60/30/9 weights)
      instead of sitting out; `HealthTransfer`'s direct damage write is `magicImmune`-gated
      (`AntiMagic.RESISTS` lists `CursedWand` as a source class); `Explosion` and `LightningBolt`
      both reuse the newly-exported `applyBlastDamage` (it already had a hero branch, just
      wasn't exported - the earlier "needs a hero-inclusive bomb helper"/"genuinely large
      multi-area effect" notes were both overestimates made without reading past the
      presentation calls); `MassInvuln` needed no new infrastructure at all (Invulnerability
      and Bless were both already modeled), and `ConeOfColors` reuses `mechanics/cone.ts`'s
      `coneCells` (the same 8-radius/90-degree `STOP_SOLID` cone Shockwave/Regrowth already
      build) plus five already-modeled status/damage primitives, per-character direct damage
      following `HealthTransfer`'s precedent rather than `applyBlastDamage` (confirmed not
      `magicImmune`-gated: Java's damage source here is the buff instance, not `CursedWand`
      itself, so it isn't in `AntiMagic.RESISTS`), and `SheepPolymorph` silently destroys an
      eligible non-hero/non-boss/non-miniboss/non-NPC target (Java's own `valid()` gate) and
      replaces it with a fresh 10-turn `spawnSheep`, reusing `destroyAlly`'s no-death teardown
      and `SummonSheep`'s spawn factory - no new infrastructure needed. Both ConeOfColors and
      SheepPolymorph are now browser-verified live (isolated scratch builds, ~200-220 scripted
      casts each, all statuses/kills/exclusions and the boss-immunity gate confirmed, zero
      console errors). The three cast methods moved to their own
      file, `dungeon/hero/cursedWandCast.ts`, once the group outgrew `armorAbilityUse.ts`'s file
      budget. See `PORT_COVERAGE.md`'s dedicated `CursedWand` row for exactly which effects and
      tiers remain unported (two Common effects and most of Rare need real new infrastructure -
      pluggable blobs, unimplemented trap kinds, a missing buff, floor-travel wiring, or an FOV/
      knockback primitive; the VeryRare tier is folded into Rare's odds rather than modeled
      separately).
      **Progress 2026-09-21 (imbue half): the staff-imbue choice is live** - the Mage
      tapping a spare chooses wield (that entry) or imbue, with Java’s own refusals
      (`id_first`, `cursed`), confirm (`imbue_desc`/`imbue_lost`/`imbue_cursed`), level
      sync, consume line and save/load.
      **Closed 2026-09-21: `ElementalBlast` is offered and fired** - `activateElementalBlast`
       reads the imbue, aims the roomiest cardinal, and runs the full cone with every class
       effect through the pinned arithmetic (simplifications stated in the method comment
       and coverage row). Every class now offers its full armor-ability set.
       **Correction 2026-09-21 (opencode-01, via ACP #81):** the offered blast's frost
       leg applied Chill where Java applies Frost outright (`Buff.affect(mob,
       Frost.class, effectMulti*Frost.DURATION)`) - now direct Frost with Java's
       Burning/Chill-detach and paralysis order, pinned in `test:armorAbilities`;
       see the coverage row. The item itself stays open on the Cleric epic.
      **2026-09-19**: `ClassArmor` as a distinct item is ported - the crown choice and the Rat
      King exchange convert the worn armor to the hero's per-class subclass id (named from SPD's own keys, Cleric via `port.*` with tag-`v3.3.8` translations), keeping tier/level/glyph/curse and the Warrior's seal. **Closed 2026-09-20:** `AC_TRANSFER` now moves the class-armor ability/charge onto a selected armor with Java's target properties and one-turn cost; the compact single-action detail window exposes detach first when sealed, then transfer. Still open is the class-armor sprite tier. Ratmogrify is fully ported since 2026-09-19 (its own
      **Correction 2026-09-20:** the prior sentence's "Still open" note is superseded: the hero
      animation now switches to Java's tier-6 class-armor row when the crown is worn and returns
      to the copied ordinary armor tier on transfer/equipment changes. Ratmogrify is fully ported
      since 2026-09-19 (its own `class: "any"` row opens the tier-4 tab and `RATLOMACY`/`RATFORCEMENTS`
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
      this port's binary `identified` ring model has no separate type-known state. **Closed 2026-09-21:**
      rank 1 now marks the worn ring's type known handler-wide (`simulation/ringKnow.ts`, per-run set,
      saved/loaded, bare type name in the display; rank 2 marks every carried ring's type the way Java's
      belongings loop does; any full identify marks the kind too - rule pinned in `test:simulation`,
      PORT_COVERAGE.md row added; the other three Intuitions have no rank-1 branch in Java). Recharge talents
      (Weapon Recharging, Wand Preservation, Empowering Scrolls) and the per-tier threshold windows
      were already exact from earlier passes. See `PORT_COVERAGE.md`'s equip-identify row.
- [x] Complete class-specific item and ability behavior. `SuckerPunchTracker` is ported (the Rogue
      surprise bonus uses Java's `Random.IntRange(points, 2)` once per stable enemy, with save/load
      and death cleanup). **Closed 2026-09-18, two halves**: Nature's Power now speeds the bow
      itself (`SpiritBow.speedMultiplier()`'s `+= (8 + GROWING_POWER)/24` as a bow-shot-only
      turn-cost divisor), and the bow branch's leftover `1 + 0.2*rank` Point Blank *damage*
      bonus is deleted while gaining the real accuracy factor (Point Blank is accuracy-only
      in Java - the 2026-09-15 correction had fixed the throw path but missed the bow).
      `SpiritArrow`'s infinite-accuracy clause stays unported as a correct-by-construction
      non-gap (it needs a bow augment plus a sniper special, neither of which exists here).
      **Closed 2026-09-20, one plant half:** Warden Sorrowmoss now grants Java's 15-turn
      `ToxicImbue`, removes poison, emits the real 6-volume ToxicGas pattern each turn, and is
      immune to poison and toxic gas through the shared buff/blob gates. The remaining open class
      effects stay listed in the coverage rows. **Also closed 2026-09-20, one plant half:**
      Warden Mageroyal now grants Java's 10-turn half-duration `BlobImmunity`, honored by the
      modeled harmful blob, fire, and smoke seams. **Closed 2026-09-21, one plant half:** the
      shared hero-plant trigger now interrupts queued click-travel for every plant, matching
      Java's `Plant.trigger()`/`Hero.interrupt()` prelude; only presentation remains in that
      narrow branch. **Closed 2026-09-21:** every sub-thread this line ever named is now closed
      with a dated entry, and re-checking `PORT_COVERAGE.md`'s plant/Warden rows turned up no
      further undocumented gap - the "remaining open class effects" the 2026-09-20 note above
      pointed at are the Simplified/Not-ported residuals already on record there (Warden's
      inter-floor Fadeleaf return, `HazardAssistTracker` marking on a mob teleport, Lotus/seed
      growth, wound/blood-splash presentation), each of which this project's own "Definition of
      done" already counts as done once documented. Checking off this item is that documentation
      catching up with the code, not new work. **Complexity: M.**
- [x] Port the `BOSS_CHALLENGE` badge set - the weapon-only boss kill. **Closed 2026-09-17: both halves this line called missing were already live, and only the documentation said otherwise.** The five badge rows exist (`boss_challenge_1..5` in `src/content/badges.mwl` - the "no `BOSS_CHALLENGE` rows" claim was stale, as was the `src/badges.mwl` path, which is really `src/content/badges.mwl`), the flag is set at all five fight starts, the damage-*source* notion the line said was missing is threaded (wand branch, unarmed branch, bomb seam, armor-ability seam, all clearing through `disqualifyBossChallenge`), and the award fires at each boss's death with the flag persisted through save/load. This was recorded for a while
      under section 7's seed/dew item as "the Dwarf King's boss-challenge-badge flag", which it is
      not: it is Java's `Badges.Badge.BOSS_CHALLENGE_1..5`, awarded at a boss's death while
      `Statistics.qualifiedForBossChallengeBadge` is still set. The flag is set true at all five
      boss fights' starts (`CavesBossLevel`/`CityBossLevel`/`HallsBossLevel`/`PrisonBossLevel`/
      `SewerBossLevel`'s own `progress()`/`seal()`, all tag `v3.3.8`), cleared when the hero deals
      boss damage that is *not* a plain weapon hit - `DwarfKing.java` 459-467 clears it on an
      unarmed hit without `RingOfForce.fightingUnarmed`, on any `Wand` except `WandOfLightning`, and
      on a `ClericSpell`, with `Goo`/`DM300`/`Pylon`/`Tengu`/`YogDzewa` each carrying their own sites
      - and read at that boss's death. **Progress 2026-09-20 (41st matrix): the reverse direction is
      now ported too - `foulBossChallenge()` clears the flag when a boss itself fouls (Goo's water
      heal and pumped slam, Tengu's bomb blast, fire-cone cell, and shocker pulse on the hero).**
      Original text follows (superseded by the close-out above; kept for the rule description). The badge entries themselves
      (this port's `src/badges.mwl` is deliberately its own smaller set - one boss badge per chapter,
      no `BOSS_CHALLENGE` rows), and the clearing half's damage-*source* notion, which this port's
      inline monster-damage paths do not thread today. **Complexity: M** for that second half; the
      five badge rows and the award are S on their own.

## 7. Replace simplified terrain and status mechanics

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because other bullets in this file cross-reference "section 7" by number; renumbering everything
below to close the gap was judged not worth the churn against those existing references.

## 8. Complete UI and input parity

- [x] Port full inventory, bag, sub-bag, item-detail, and item-use windows. Item-detail (real
      per-item descriptions, resolved through `inventoryPanel.ts`'s MWL description tables, each a
      real authored Java `.desc` key) and item-use (activation for food/potions/scrolls/rings/armor/
      wands) are both already done. The four bags (VelvetPouch/ScrollHolder/PotionBandolier/MagicalHolster)
      now exist as ownable, named, priced, unsellable goods with the real shop pick (resale
      refused per `Shopkeeper.canSell`'s `unique` rule, 2026-09-18) - and three container-half
      stat effects are live in the same pass (the Holster's recharge/durability factors off
      ownership, the full `validateAllBagsBought` badge set). What stays open is the structural
      container behavior (contents, `grabItems` on pickup, capacity, an open action), not their existence. **Progress 2026-09-19: the open action is now live** - using a bag opens the bag window on its own filtered tab (`bags.ts`'s `bagTab`, routed through the item-action table, pinned in `test:items`); velvet opens the velvet-named runestone tab with seeds one tap away. **Progress 2026-09-19 (later same day): `grabItems` routing and capacity are live** - `bagFitsPickup` ports `Item.collect()` over the flat bag (19-stack sub-bags in fixed order, 20-stack backpack excluding sub-bag contents, merges and bags always fit, silent refusal with the heap kept), wired into every ground-pickup path including the six equipment callbacks. Per-bag contents arrays stay open as the documented stand-in (the filtered tabs already show the same contents). See `PORT_COVERAGE.md`'s bag row.
      **Closed 2026-09-21:** the last two residuals fell on re-audit. The "frame-0
      fallback" was stale - the four bags wear their exact `BAGS`-row sprites (499-502)
      on the real sheet. The per-bag contents arrays close as Simplified: every
      observable (acceptance, 19/20 capacity, display tabs, shop pick, stat effects,
      badges) is live and pinned; only the membership storage differs (derived, not
      nested), which no play-visible behavior can distinguish.
- [x] Implement click-to-travel (`repeated movement`) - a player-reported bug: clicking a distant
      tile previously only produced a single step. Now queues the target and walks the real
      pathfinder's route one step per turn through the existing `awaitHeroInput` hook, matching
      Java's real interrupt conditions (taking damage, or any awake hostile creature coming into
      sight - checked broadly rather than Java's narrower "newly seen" case) and cancelling cleanly
      on arrival or any manual keyboard action. Browser-verified live. **Closed 2026-09-21:** cell
      targeting was already live through `TargetingController`; the hovered destination now also
      draws the route that the same pathfinder will walk, with a documented static-highlight
      reduction in `PORT_COVERAGE.md`.
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
- [x] Complete sprite/effect animations. (Split 2026-09-18: the armor-dependent hero
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
      verified: a flashed Sheep now fades back to its own tint, not to nothing. **Closed 2026-09-19, the shake half**: all 41 Java shake sites audited (see PORT_COVERAGE.md) - 8 missing wirings added, the short refusal shakes documented, the rest tied to unported features; pinned by `tools/verifyShakes.mjs`. **Closed 2026-09-20, the monster-by-monster particle audit**: all 17 Java mob-sprite emitter files inventoried against tag `v3.3.8`, and the six one-shot sites are now live with Java's own counts/colors/samples - DM300 death Blast x100, Pylon death Blast x20, Guard death Shadow x4, Succubus death Heart x6 + Shadow x8, Ghost death Shaft x4 + Light x3 (quest NPC and Rose summon share `GhostSprite`), Ward zap WardParticle x2 + RAY and Ward death x10 - via the `simulation/deathBursts.ts` spec table (forty-seventh extraction), pinned behaviorally by `tools/verifyParticles.mjs`. **What remains
      here, genuinely**: **the pour half closed 2026-09-21** - the seven creature-following
      families pour at Java's own intervals through `simulation/pourAuras.ts` (spec table with
      Java's tints/lifespans/speeds, pinned in `test:simulation` via `tools/verifyParticles.mjs`)
      synced per-frame by `ui/effectBursts.ts`'s `syncPourAuras` (cells, FOV, rebuild on state
      changes) - FetidRat/RotHeart/elementals+fists/DM300-gated/Eye-gated/Goo-gated; see
      PORT_COVERAGE.md's pour-auras row for the stated reductions and the five deferred sites
      (Golem teleport, Goo pump-up cells, Lotus leaves, Necro/Spectral summonings,
      PhantomPiranha - each with its missing trigger named). **Closed 2026-09-21, the ward-zap
      attacker flash**: `takeWardTurn` now fires the same one-frame `colorAdd` pulse
      `showDamage` already triggers on a landed hit, matching `WardSprite.zap()`'s
      `attacker.sprite.flash()`. **Closed 2026-09-22, the ward death fade - and the
      "no fade/tween mechanism exists" premise it was recorded under was stale.** A generic
      corpse-fade loop (`dyingMonsters`, `dungeonScene.ts`'s `update()`) already existed for
      every ordinary monster's 3-second post-`die`-clip fade; a ward has no `die` clip at all
      (`WardSprite.die()` is just `new AlphaTweener(sprite, 0, 2f)`, no animation), so it fell
      through to instant `destroy()` instead of ever reaching that loop. Fixed by widening the
      loop to a per-corpse `duration` (3 default, 2 for a ward) and an explicit `playDieClip`
      flag rather than inferring "has a clip finished" from `AnimatedSprite.isFinished` -
      every monster's sprite is an `AnimatedSprite` instance regardless of whether it has a
      `die` clip, and `isFinished` defaults `false` on one that never had `play()` called, so
      the original `instanceof AnimatedSprite` check alone would have waited forever rather
      than ever reaching the fade branch (caught live before landing: a wand-summoned ward's
      corpse hung at a fixed 72% alpha instead of counting down). Live-verified via the
      scene's own `update(dt)` stepped in increments: fade 0/0.5/1/1.5 -> destroyed exactly
      at 2.0, alpha counting 1 -> 0.75 -> 0.5 -> 0.25 linearly in between.
      **Closed 2026-09-22, the Ward DeathRay beam.** `Beam.DeathRay` (`effects/Beam.java`,
      tag `v3.3.8`) is a textured additive sprite stretched cell-to-cell with a 0.5s fade
      (`alpha(p)` and `scale.set(scale.x, p)` where `p = timeLeft/duration`) - this port has
      no beam-image asset, so `zapBeamOverlay`/`zapBeams` (`dungeonScene.ts`) draw a plain
      fading, thinning line instead (the same "particles are plain squares" reduction
      `deathBursts.ts` already states for the rest of `WardSprite`'s effects), tinted the same
      `WardParticle` blue (0x88ccff). Pushed from `takeWardTurn` every zap that has a target,
      regardless of whether the hit landed (`magicImmune` zeroes only the damage, never the
      beam, matching Java). **Found and fixed live during verification**: the overlay was
      first added to the same early world-space group as the aim/travel/targeted-cell
      highlights, which sits *underneath* the item layer, creature layer, effect layer and
      wall-tops layer added later in the same setup pass - so the beam rendered, but always
      hidden beneath the tiles and sprites it was supposed to connect. Moved to sit beside
      `effectLayer` (the same layer particle bursts already draw into) instead. Live-verified
      via the scene's own `update(dt)`: a long-lived beam renders visibly over tiles and
      sprites at the fixed z-order; the normal 0.5s one is gone by the next real frame,
      consistent with the deterministic stepped-update proof used for the corpse fade above.
      **Closed 2026-09-22, wand-zap trails.** Generalized the same `zapBeams`/`zapBeamOverlay`
      primitive (renamed from the ward-only `wardBeams`) into a shared per-source-tinted zap
      line: `fireWandShot` pushes one from the hero's own cell to the target's for every one
      of the 12 hero-cast wand types, colored by a new `wandZapTrailColor` lookup (frost blue,
      fireblast orange, lightning yellow, etc. - stated representative tints, not values
      extracted from each wand's own Java particle class, since none of those textured assets
      exist here). Fired once per zap regardless of the type-specific branch below it
      (fireblast/regrowth's own cone/AOE shapes stay a stated simplification, not a full
      telegraph). Live-verified via a forced render pass (`renderer.render(stage)`) plus pixel
      extraction on the overlay, since the screenshot tool's own capture can race the game's
      normal render loop for a manually-stepped `update()` - not a rendering bug, a test-
      methodology gap the pixel check closes.
      **Closed 2026-09-22, the Sunray spell-cast burst - the one concretely-scoped piece of
      this line's "spell-cast bursts" half.** `Sunray.java`'s own cast draws two effects: `new
      Beam.SunRay(...)` (Java's own `1f`-duration, `tint(1,1,0.25,1)` yellow `Beam` subclass -
      `zapBeams`/`zapBeamOverlay` gained a per-beam `duration` field, since it previously
      hardcoded `DeathRay`/wand trails' shared `0.5f`, so this reuses the exact same primitive
      at Java's own `1f`) and `ch.sprite.burst(0xFFFFFF44, 5)` on the resolved target (a new
      `spawnHitFlash`/`burstSunrayFlash` in `ui/effectBursts.ts`, the same quick-poof shape
      `spawnCleanseFlare` already established, tinted white). Both fire from `resolveSunray`.
      Live-verified: the beam and a live `effectBursts` entry both appear from a scripted
      Sunray cast (talent gate bypassed for the test, matching this project's own "call the
      private method directly" diagnostic convention), and the beam renders visibly via the
      same forced-render check used above. (At this point every other Cleric tome spell's
      own cast presentation was still open - see below, where each is closed or found to
      need nothing in the same pass.)
      **Closed 2026-09-22, Bless's own cast flare - the second concrete slice.**
      `BlessSpell.castSpell()`'s `new Flare(6, 32).color(0xFFFF00, true).show(ch.sprite, 2f)`
      is the exact same star-flare shape `Cleanse` already draws, yellow instead of pink -
      `spawnCleanseFlare` generalized into `spawnFlare(layer, alive, x, y, color)` (its one
      call site updated to pass Cleanse's own pink explicitly) plus a new `burstBlessFlare`
      wrapper, fired from `resolveBless` on the resolved target in both the self and
      other-hero branches (Java's own `ch` covers both). Live-verified: a scripted Bless cast
      (talent gate bypassed for the test) queues a live `effectBursts` entry and applies the
      real shield/buff, through the exact same particle mechanism the already-working Cleanse
      flare uses.
      **Closed 2026-09-22, Judgement's own cast flash - the third concrete slice.**
      `GameScene.flash(0x80FFFFFF)` (`Judgement.onCast()`) is a screen-wide light-blend
      flash, structurally different from every other spell effect closed so far (screen-space,
      not a world-space beam or per-character particle) - a new `screenFlash`/
      `screenFlashOverlay` pair on `dungeonScene.ts`, added to `stage` directly so it covers
      the viewport regardless of camera position, fires from `resolveJudgement` ahead of its
      damage loop (matching Java's own order) with a stated-approximate `0.3s` fade (Java's
      own `Fader` duration lives in a `noosa` framework class outside this checkout's
      history - not a value read from source). Live-verified: a scripted cast (talent/
      subclass/AscendedForm gates bypassed for the test) sets the flash state and deals real
      damage; the overlay renders visibly via a forced-render pixel check.
      DivineSense/HolyWeapon/HolyWard turned out to need nothing further: their Java sources
      only call `hero.sprite.operate()`, a generic "using an item" pose with no distinct
      particle/beam effect of its own to port. Flash turned out to need nothing further
      either, on closer reading: `Flash.onTargetSelected()` delegates its whole presentation
      to `ScrollOfTeleportation.teleportToLocation()`, and `resolveFlash` already calls this
      port's own `playTeleportAppear` (the shared teleport-appear presentation every random
      teleport already routes through) - not a gap, just one this pass's earlier drafting
      wrongly assumed still open without checking.
      **Closed 2026-09-22, GuidingLight's travelling bolt - the fourth and last concrete
      slice, closing this line entirely.** `MagicMissile.boltFromChar(..., LIGHT_MISSILE,
      hero.sprite, collisionPos, callback)` (`GuidingLight.onTargetSelected()`) needed a real
      moving-projectile primitive, unlike every other spell effect above (all instant beams or
      static particle bursts) - `spawnProjectile`'s existing `Projectile`/`projectiles`
      machinery (already driving thrown-weapon flight) gained an optional `onArrive` callback
      and a new `spawnBoltTo(from, toCell, tint, onArrive)` sibling that targets an arbitrary
      cell rather than requiring an occupant, reused from `resolveGuidingLight` for a plain
      white dot with `ch.sprite.burst(0xFFFFFF44, 3)` firing on arrival (`spawnHitFlash`, the
      same primitive Sunray's own flash already established). The actual damage/buff
      resolution stays synchronous rather than deferred into the callback, the same
      simplification Sunray's instant Beam already made - only the visual bolt and its
      landing burst are async. Live-verified: the bolt spawns, occupies `projectiles` while in
      flight, and the `onArrive` callback fires exactly once the flight completes (confirmed
      both through the full `resolveGuidingLight` path and a direct `spawnBoltTo` call
      stepped frame by frame). **This closes the "spell-cast bursts" half of the line
      entirely** - Sunray, Bless, Judgement and GuidingLight were the four spells that
      actually needed new work; DivineSense/HolyWeapon/HolyWard/Flash needed none.
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
- [x] Warn before a voluntary fall: stepping (or click-to-travel) onto a chasm cell
      asks first. Java's `Chasm.heroJump()` (`levels/features/Chasm.java`) pauses the hero
      and shows a `WndOptions` chasm/jump yes/no window: yes sets the `jumpConfirmed`
      latch and resumes into the jump (0.2s anti-misclick guard on both show and select),
      no cancels and the hero stays put. This port's `fallThroughChasm()`
      (`scenes/dungeon/actorTurnsHazards.ts`) falls immediately with only a log line, so a
      single misstep costs half the hero's HP. Port the window through the scene's
      `WindowStack` (input held while it is up, like the last-missile confirm), the latch,
      and the guard; forced falls (knockback, FeatherFall landing) keep today's path.
      **Closed 2026-09-21:** the step gate (`simulation/chasmJump.ts`, pinned in
      `test:simulation`) pauses for `showConfirmWindow` with Java's own
      `levels.features.chasm.*` strings, the 0.2s guard on both buttons, the
      hero-still-there check on "yes", latch-and-re-enter on "yes", latch clear on the
      fall, and queued-path cancel on either answer. Levitation skips the warning (any
      active levitation glides over - Java still warns when it is about to detach
      mid-step, which this port cannot time; documented simplification).
- [x] Zoom shortcuts: Ctrl++ / Ctrl+- and Ctrl+mouse-wheel drive the existing zoom
      offset. The `3 + offset` camera, the `[-2, +3]` gate and the live `onZoomChanged`
      re-zoom above already exist - only the bindings are missing (today: bare `+`/`-`
      keys, numpad twins, and the settings `- level +` row). Depends on what the `Input`
      layer already exposes: a Ctrl modifier on key bindings and a wheel-event seam;
      check both before estimating. **Closed 2026-09-21:** both exist - the `zoomIn`/`zoomOut`
      bindings fire by physical code with Ctrl held, and MWG reports Ctrl/Cmd+wheel as a `zoom`
      action. New `scenes/dungeon/zoomShortcuts.ts` steps the same offset on wheel sign (refusing
      while a window holds input, like the keyboard zoom) and `preventDefault`s Ctrl+plus/minus
      so the browser does not page-zoom alongside; bound once per scene, unbound on destroy.
      Step direction pinned in `test:simulation` (`simulation/zoomStep.ts`), coverage row added.
- [x] Review key management end to end against Java: key colors on the ground and in the
      inventory (`crystalKey`/`ironKey`/`goldenKey` art), locked-chest and locked-door pictures,
      and the opening flows (which key opens which lock, key consumption, locked-chest loot).
      Keys and the golden-key chest gate exist (`src/items/itemKinds.ts`, `groundPickup.ts`'s
      `lockedChestNeedsGoldenKey`); the art and the full open sequence are unverified.
      **Progress 2026-09-21:** the opening-flow audit found and fixed a real bug - keys carried
      no depth of their own, so one found on any floor unlocked a locked door or chest on any
      *other* floor too (Java's `Key.depth`/`Notes.keyCount(new IronKey(Dungeon.depth))` scope
      every key to the floor it was found on). See `PORT_COVERAGE.md`'s new key-management row.
      **Closed 2026-09-21, the art half.** Two real, confirmed-live bugs found and fixed:
      (1) `ironKey`'s bag-slot icon fell back to the generic "?" placeholder (frame 0) - unlisted
      in `itemSpecificFrames` entirely - while its *ground*-pile icon was wired to frame 56, the
      golden key's own frame (`ItemSpriteSheet.IRON_KEY/GOLDEN_KEY/CRYSTAL_KEY = MISC_CONSUMABLE+7/
      8/9` = 55/56/57, tag `v3.3.8`); both tables now carry all three keys at their real frames.
      Live-verified in-browser: the bag window now shows three visually distinct key icons (gray
      iron, gold, cyan crystal) instead of a golden key twice and a question mark. (2) A locked or
      crystal chest's *ground* sprite showed the contained item's own icon (spoiling its contents)
      instead of a chest - Java's `ItemSprite.view(Heap)` always draws `ItemSpriteSheet.CHEST/
      LOCKED_CHEST/CRYSTAL_CHEST` (36/37/38) for a chest heap regardless of contents, never the
      item inside. Fixed alongside (`CHEST_FRAME`/`LOCKED_CHEST_FRAME`/`CRYSTAL_CHEST_FRAME` in
      `dungeonConstants.ts`, `spawnGroundItem`). All seven cells (three keys, four chest variants)
      were already byte-identical to the real `v3.3.8` sheet in this port's own `items.png` -
      pixel-verified against a fresh extraction of the real sheet before wiring, matching this
      project's "check real source before assuming a gap" convention - so no art needed sourcing
      or patching, only the frame-lookup wiring. The locked-door terrain is also now confirmed:
      `visualTerrainAt` selects Java's `LOCKED_DOOR` frame 10 and `CRYSTAL_DOOR` frame 31, while
      an ordinary closed door uses frame 5. The complete key/lock visual review is therefore
      closed; the remaining SkeletonKey/WornKey behavior is documented as not ported in the
      coverage matrix.
- [x] Add keyboard navigation to menus, title screen first. Neither Java nor this port can be
      played or even started without a pointer today: buttons, tabs, lists and dialogs have no
      focus model, no visible focus indicator, and no key bindings (arrows/Tab to move, Enter
      to activate, Esc to go back). Start with the title screen (the first thing every player
      meets, disabled players included), then carry the same model through class select, the
      settings window, and the bag tabs. Port-original accessibility work, not Java parity -
      Java SPD has no such system. **Complexity: M.**
      **Progress 2026-09-22: the title screen slice is done.** `TitleScene` tracks a single
      `focusedIndex` into the same row/column grid its own layout already lays buttons into,
      moved by the existing `up`/`down`/`left`/`right` movement actions (only while no window
      is open, so a window's own input is never fought over the same keys), drawn with a
      visible white ring redrawn on every layout pass (so it survives a resize/orientation
      change), and activated by `confirm` - which now dispatches the *focused* button's
      `onClick`, not unconditionally `begin()` as before (a pointer click already goes to
      whichever button was clicked; keyboard confirm now does the same for whichever button
      is focused). Browser-verified live via dispatched keyboard events: default focus on
      "Enter the Dungeon", arrow-key movement through the grid, Enter opening the focused
      window, Escape closing it without moving focus, and the ring relocating correctly after
      a portrait-width resize.
      **Progress 2026-09-22 (second slice): class select is done.** `ClassSelectScene`
      carries the same focused-portrait/ring model over its 6-class grid (grid-aware:
      3x2 in landscape, 1x6 in portrait, reusing the layout pass's own bounds). `Confirm`
      mirrors a portrait click (select) the first time; pressed again on the
      *already-selected* portrait it dispatches Start directly instead of re-selecting
      it, so a keyboard player never needs to separately reach the on-screen Start
      button - a port-original interaction, not Java parity (Java has no keyboard path
      here at all). `Cancel` already returned to the title screen before this pass.
      Browser-verified live: default focus, arrow movement across the grid, Enter
      selecting Rogue (splash art/name/description/Start button all updated), a second
      Enter beginning the run as Rogue.
      **Progress 2026-09-22 (third slice): settings-window tab switching is done, in-tab
      widgets are not.** `showSettingsWindow` registers its own `Input.onAction` listener
      (stack-mode `Signal`, so it sits in front of the scene's own while this window is
      open) so left/right cycles the tab strip the same way clicking a tab icon does;
      removed on close so a lower listener gets the keys back untouched. `Cancel` already
      closed the window before this pass (`Window`'s own `closable` handling). **Deliberately
      out of scope, stated rather than assumed:** sliders, checkboxes and the language grid
      inside each tab stay mouse-only - each widget kind needs its own activate/adjust
      semantics (a slider needs value-stepping, not just selection), which is a materially
      bigger task than a focus ring. Browser-verified live: opening Settings from the
      title screen, arrow-cycling from Display to Interface tab, Escape closing the window
      with title-screen focus correctly restored to the button that opened it.
      **Progress 2026-09-22 (fourth slice): bag-tab switching is done - the item grid
      itself already had keyboard support before this pass.** `IconGrid` (`mwg/two-d/ui`,
      the framework component the bag's item grid is already built from) turned out to
      already handle `up`/`down`/`left`/`right`/`confirm`/`cancel` internally with its own
      visible highlight - `InventoryWindow.handleAction` already delegated to it, so a
      player could already move the highlight and open an item's detail view by keyboard
      before this session touched anything. What was missing was only the category/pouch
      tab strip, the same click-only gap the title/class-select/settings screens had:
      `menu` (Tab/KeyI, otherwise unused while the bag is open, since `IconGrid` doesn't
      consume it) now calls `TabbedList.nextTab(1)`, cycling all nine tabs (four
      categories, five sub-bag pouches) in the order `createList` declares them. Browser-
      verified live: opening the bag, Tab switching from "Tout" to "Usage" with the grid
      re-filtering, arrow-key movement plus Enter still opening an item's detail view
      (a food ration) on the new tab, Escape closing both the detail and the bag.
      **Progress 2026-09-22 (fifth slice): settings-window checkboxes are keyboard-focusable
      now, sliders and the language grid still aren't.** `showSettingsWindow` scans each
      tab's built `node` for direct-child `SpdCheckBox` instances (every existing tab builder
      adds its checkboxes flat, not nested), draws a focus ring over one of them, up/down
      moves it, confirm calls the checkbox's own `setChecked(!checked, true)` (its existing
      toggle method - no new activation semantics needed, unlike a slider), and switching tabs
      resets focus to the first checkbox on the new tab. This is opportunistic reuse of an
      already-simple widget, not the full "every widget kind" scope: a slider still has no
      keyboard value-stepping, and the language grid (`langsTab`, a `SpdButton` grid, not
      `SpdCheckBox`) is unaffected by this pass's checkbox-only scan. Browser-verified live:
      focus starts on Fullscreen, moves to the colorblind checkbox, confirm toggles it, and
      switching from Display to Interface resets focus to that tab's own first checkbox.
      **Progress 2026-09-22 (sixth slice): sliders are keyboard-adjustable now too.** The
      checkbox-only focus scan above widened to also find `SpdOptionSlider` instances
      (`focusablesIn`, still a shallow direct-children scan, still visual order); a new
      public `SpdOptionSlider.step(delta)` mirrors what a completed drag already does (clamp,
      move the thumb, fire `onChange`). Left/right now context-switches: it adjusts the
      focused slider by one tick if one is focused, and only falls back to the previous
      tab-switch behavior otherwise - so the same two keys serve both jobs without a mode
      toggle, and a slider that happens to be a tab's first widget (Interface's own
      "toolbar config" row) is reachable and adjustable immediately on entering that tab.
      Browser-verified live: down-arrowing past both Display checkboxes onto the brightness
      slider, right-arrow driving its thumb to max: up-arrowing back to a checkbox,
      right-arrow correctly switching tabs instead (no regression), and the new tab's own
      first-widget slider (toolbar config) immediately left/right-adjustable on arrival.
      **Progress 2026-09-22 (seventh and final slice): the language grid is done, and a real
      keyboard dead-end found along the way is fixed.** `langsTab`'s own build result now
      carries an optional `focusGrid: { items, cols }`, keyboard-navigated by its own
      `ClassSelectScene`-style row/col math (up/down move by row, clamped; left/right move by
      one, clamped; confirm dispatches the focused language button's `onClick`, exactly the
      same rebuild-and-relabel path a mouse click already takes). **Found and fixed live
      while testing this slice**: tab-switching had been living on left/right since the third
      slice, which worked while only checkboxes existed (they never claim those keys) but
      quietly broke the moment sliders did - Input's own tab is two sliders and nothing else,
      so every left/right there adjusted one instead of ever reaching another tab, and
      up/down only ever toggles between the two sliders, never landing on a non-slider widget
      to unstick it: tab-switching became unreachable by keyboard on that tab, a real dead
      end no earlier slice's testing happened to hit (their tabs all mix checkboxes in).
      Fixed by moving tab-switching onto `menu` (Tab/KeyI) - the same convention the bag
      window's own tab strip already uses - so left/right unambiguously means "adjust the
      focused control" everywhere, with no fallback and no competing claim. Browser-verified
      live end to end: Tab cycling all six tabs including the two-slider Input tab (previously
      the trap), arrow movement across the language grid, confirm selecting Spanish and the
      whole title screen rebuilding in it exactly as a mouse click would, with the title
      scene's own keyboard focus still intact afterward. **This closes the entire item**: all
      four originally-named screens (title, class select, settings, bag) are keyboard-
      navigable, including every settings-window widget kind (tabs, checkboxes, sliders, the
      language grid).
- [x] Add colorblind options to the graphics settings. Too much state here is color-only:
      buff/debuff icon tints, HP-bar thresholds, key colors, trap and hazard highlights. Offer
      at least deuteranopia/protanopia/tritanopia-safe palettes (plus a high-contrast pass if
      it falls out cheaply), persisted like the other display settings, with every color-coded
      element re-checked against each palette rather than assumed. Port-original accessibility
      work, not Java parity - Java SPD has no such system. **Complexity: M.**
      **Progress 2026-09-22: the central status palette is done, not every color-coded
      element.** A new `settings.colorblind()` boolean (persisted like the other display
      settings, `port.ui.colorblind` checkbox added to the Display settings tab, all 19
      locale catalogs) swaps `ui/spdTheme.ts`'s `SPD_STATUS_COLOR` (positive/negative/
      warning/neutral - the palette the game log, floating combat text and status flashes
      all read from, 22 call sites across 8 files) and `ui/buffOverlays.ts`'s buff-text
      tint to one Okabe-Ito-derived safe set. **Deliberate simplification, stated rather
      than assumed:** one palette, not three separately tuned deuteranopia/protanopia/
      tritanopia sets - Okabe-Ito is validated jointly distinguishable under all three at
      once, so one safe set clears the "safe under each" bar without three to keep in
      sync. Browser-verified live: the checkbox toggles and persists (`localStorage`
      `colorblind: "true"`).
      **Progress 2026-09-22: monster HP-bar colors are done.** `refreshHealthBars`'
      per-creature `Bar` (`deathSaveRefresh.ts`) filled green-on-red (`0x00ee00` on
      `0xcc0000`) - the filled and missing portions read as similarly dark under red-green
      colorblindness, and unlike the hero's own HP bar (a real SPD texture strip, not a
      color fill, so nothing to swap there) this one is this port's own plain `Bar` color
      fill. `colorblind()` now swaps it to the same Okabe-Ito-derived pair
      `SPD_STATUS_COLOR` already uses (bluish-green filled, vermillion missing), read once
      at bar creation (matching this map's own per-creature caching - a mid-run toggle only
      affects bars created after it). Live-verified: a damaged monster's bar reads exactly
      `0x009e73`/`0xd55e00` with the setting on. Key art was checked and found to need
      nothing: each key already reads by its own distinct pixel art (gray/gold/cyan), not a
      swappable tint, so there is no color-only state there to begin with.
      **Progress 2026-09-22: the one hazard-telegraph highlight is done.** An audit of every
      floor/tile overlay found exactly one color-only hazard indicator:
      `NewbornFireElemental.doAttack()`'s red `TargetedCell` telegraph (the 3x3 blast-radius
      warning, `refreshTargetedCellsOverlay` in `monsterAi.ts`) - pure `0xff0000`, Java's own
      exact tint. `colorblind()` now substitutes the same Okabe-Ito vermillion
      `SPD_STATUS_COLOR.negative` already uses: still reads as "danger", but stays
      distinguishable from the palette's own bluish-green "safe" tones, unlike pure red under
      red-green colorblindness. Live-verified via a forced render: the 3x3 telegraph around
      the hero renders in the expected orange/vermillion tone, not pure red. No other
      color-only trap/hazard indicator was found in the audit (traps and hazard cells are
      identified by their own distinct sprite art, not a swappable overlay tint, the same
      shape as the key-art finding above). **Still open**: a high-contrast pass.

## 9. Build the Java-vs-TypeScript parity harness

**Status check**: none of these six are done in the literal sense this section asks for - an actual
differential harness running both the real Java build and this port side by side against identical
seeds/traces - and none should be marked `[x]` on the strength of what already exists. What does
exist, so the gap is the real remaining one rather than a from-scratch build:
`tools/verify*.mjs` (wired into `test:simulation`, 195 simulation + 7 banner + 36 vault + 6 overlay checks as of 2026-09-21, plus the `test:items` pins and the armor-ability checks inside `test:simulation`) already pin combat rolls, damage
curves, buff timing and turn-cost/scheduling - but as *values checked against a transcription of the
Java source*, not against a running Java build, which is the bar "compare both implementations"
sets. **Honesty pass 2026-09-21, per bullet:** levelgen RNG-call-order (bullet 2's level
part) is the only piece done literally - 26/28 `TRACE-IDENTICAL` plus 2 classified oracle skew,
last run 2026-09-19 (the reference dumps are not in this repo and need the Java checkout's
harness to regenerate, so this was not re-run today; no levelgen code changed since). Item,
monster and quest *generation* RNG rides the same floor-build stream on those floors, but no
standalone item/monster/quest-trace comparison exists. Bullets 1, 4 and 5 are genuinely
unstarted in the literal sense: the Java harness dumps levelgen, not scripted play, so there
is no driver for fixed-seed action traces, quest/boss/save-load differentials, or a
screenshot matrix (only targeted `*-livecheck.mjs` probes). Bullet 3 is covered to the
transcription bar by the suites above. Bullet 6 is `PORT_COVERAGE.md` itself, row by row.
None of the six boxes tick on that basis; the remaining work is real and itemized, not a
re-verification of what the suites already pin. **Unblocked 2026-09-19:** the suite aborted at hunger for a day (stale STEP=10 expectations left behind by the STEP 1 fix), hiding every check after it - syncing those expectations un-hid three more stale sets (buff-fixture poison stream, MINIBOSS/BOSS comment-regex + sets, hero-turn/hero-actions hunger math) and, in the miniboss case, a real data bug (Eye/Warlock/plain-Elemental over-looted on boss wealth tiers Java never gives them). The full suite passes for the first time. `PORT_COVERAGE.md` already does the sixth bullet's classification row by row, as a running
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
- [x] Verify combat rolls, damage, status effects, and turn timing. **Complexity: M.**
      **Closed 2026-09-21:** `tools/verifyCombatRolls.mjs` (wired into `test:simulation`)
      pins the formula shapes deterministically - stub RNGs stand in for Java's draws
      (`float(x)` returns scripted unit fractions scaled by the stat, endpoints for the
      rest), so there is no sampling noise: the two-uniform-rolls hit comparison as an
      exact 6-call sequence, Bless/Hex/Daze/magic/surprise/encumbrance boundaries
      (inclusive, as Java), damage endpoints with the armor-roll scratch floor, the full
      attacker multiplier chain in Java order (fury/weakness/berserk/blazing/growing/
      aggression/vulnerable/giant/antimagic/excess-STR), Preparation's best-of-N plus
      rank bonus, status-tick deal/redraw/decrement/expire (including magicalSleep's
      no-tick skip), and the pure-number helpers. Turn timing: searching cost a 1-turn
      spend against Java's `TIME_TO_SEARCH = 2f` - fixed in `TURN_COSTS` with cost pins
      in `tools/verifyHeroActions.mjs`, and the headless harness now ticks hunger
      per turn (a lone search runs 296 to 298). Closed 2026-09-21 by the turn-loop
      owner, who threaded the cost end to end (`finishHeroTurn(effects, turnCost)`,
      per-tick scene loops, forwarding pinned in `verifyHeroTurn`) - see
      `PORT_COVERAGE.md`'s combat-rolls row for the full per-tick inventory.
- [ ] Verify loot, quest outcomes, boss transitions, and save/load state. **Complexity: L.**
- [ ] Add screenshot and animation-timing comparisons for visual parity. **Complexity: M.**
- [ ] Classify every remaining difference as either an implemented Java behavior or an explicitly
      accepted platform/UI difference. **Complexity: M.**
- [x] Audit every `undefined` in the source as a clue to unimplemented functionality (missing
      returns, unfilled optional paths, stubbed branches). **Complexity: S.**
      **Closed 2026-09-21:** all hits classify clean - nullish/compare idioms, `T | undefined`
      lookup-or-missing returns, optional context hooks, and documented Java-mirroring no-ops;
      the only TODO/FIXME lines cite Java's own FIXME guards (already implemented beside each
      citation), and there are no empty stub bodies or swallowed catches. Two standing gates
      keep it that way: `noImplicitReturns` in `tsconfig.json` (the probe was already clean, so
      no missing-return path exists to grandfather) and `tools/audit-undefined.mjs`, wired into
      `npm run check`, which fails on bare TODO/FIXME markers and empty-message throws.
- [x] Check the code for multiple definitions as a clue to under-usage of the MWL file (values
      hardcoded in TypeScript that belong in authored data). **Complexity: S.**
      **Closed 2026-09-21:** audited monster stats (MWL-read), wands/shop/prices/XP curve (all
      MWL-read), and the Cleric/talent tuning family. Five duration constants duplicated
      `buffDurations` rows with Java-verified equal values and now read `BUFF_DURATION`
      instead (`divineSense`, `holyWeapon` imbue cap, `guidingPriestCooldown`,
      `lanceCooldown`, `auraProtection`, `lethalHasteCooldown`); per-source literals that
      differ from the table (ShieldOfLight 4-vs-5, vulnerable 5-vs-20, Radiance paralysis 3)
      match Java's own applied-vs-`DURATION` splits and stay. Standing pins: the new
      `single-sourced` check in `tools/verifyClericSpells.mjs` plus the
      `lethalHasteCooldown` row in the simulation suite. See `PORT_COVERAGE.md`'s MWL row.

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
       **Progress 2026-09-23:** hidden Mimic contact decisions now live in the pure
       `simulation/hiddenMimicContact.ts` planner, separating adjacent melee-bump outcomes from
       successful-hit reveal timing. This also fixed the missed-hit reveal bug and the Crystal
       Mimic bump path, which now cancels the hero swing and performs its inherited counterattack.
       **Complexity: L.**
- [x] Compare `mwg/i18n` against the plan's section 22C "Semantic Messaging" shape before committing
      to SPD-ADR-012. It matches (`SemanticMessage`/`MessageChannel`/`MessageFormatter`/
      `createCatalogFormatter`, `EntityTextResolver`/`GrammaticalEntity`, CLDR plurals, FTL, catalog
      audit tools), and the catalog mechanism is already adopted. Pending is only the message half
      (typed messages at `say()` sites, combat log lines as pilot).
- [ ] Continue producing the section 22A/22B analysis matrix for the remaining monster/item/buff
      families before migrating each one's code, per SPD-ADR-010. **Progress 2026-09-18:** the sixth matrix, `MONSTER_ANALYSIS_SKELETON_THIEF_GUARD_NECROMANCER.md`, covers the Prison humanoids: a data-only Skeleton (its bone explosion is Java's only Skeleton behavior and is entirely absent), the `thief OR bandit` steal-flee loop as the next pilot candidate, the once-ever Guard chain-pull, and the Necromancer companion-master complex (already ported piece by piece, shared free with the Spectral variant) - plus two falsifiable gap records (Bandit's diverged gold loot, the port-invented Necro hero bolt against Java's `canAttack() == false`). **Progress 2026-09-19:** the seventh matrix, `MONSTER_ANALYSIS_BAT_ALBINO_SWARM_SPINNER.md`, covers the Sewer/Cave speedster/variant/splitter/weaver set - Albino as the cleanest variant-inheritance case (one MWL override row plus one keyed branch, no class), Swarm/Spinner as stateful single-kind strategies (`generation`, `webCooldown` + floor blob + `fleeing`), Bat as the schema boundary (its double speed needs a column, not a branch) - and fixed two real bugs in the same pass: Albino's poison stand-in is now real `Bleeding` with the `damage > 0` gate, and split-descendant Swarms now divide loot by `generation + 1`. **Progress 2026-09-19:** the eighth matrix, `MONSTER_ANALYSIS_PIRANHA_STATUE_MIMIC_WRAITH.md`, covers the special-activation set - entry-into-play as the behavior (water gates, payload equipment, disguise, tomb triggers) - and fixed the armored statue's missing inheritance (no PASSIVE turn, no damage wake) by sharing `takeStatueTurn` across both statue kinds, with the woken-statue chase, weapon-driven combat, base-mimic disguise, tomb wraiths, and piranha badge recorded open. **Progress 2026-09-19:** the ninth matrix, `MONSTER_ANALYSIS_SLIME_CAUSTIC_DM100_ELEMENTAL.md`, audited the ooze/Prison-bot set and escaped the family: it restored the global `maxLvl + 2` loot gate, rekeyed wealth rolls onto the BOSS/MINIBOSS sets, completed those sets (eye/warlock/pylon; elemental/eye/warlock), and fixed CausticSlime's invented meat loot plus its missing GooBlob - leaving resistance halving, summon scaling, and meat quantity recorded open. **Progress 2026-09-19:** the tenth matrix, `MONSTER_ANALYSIS_DEMONSPAWNER_SENTRY_ROTHEART_ROTLASHER.md`, covered the immobile-spawner set and fixed three gaps - lasher cripple, heart defense gas, heart Rotberry seed (correctly excluded on burn-destroy) - leaving quest scores, sentry invulnerability, FungalSentry, and lasher armor recorded open. **Progress 2026-09-19:** the eleventh matrix, `MONSTER_ANALYSIS_FETIDRAT_BEE_LARVA.md`, covered the quest strays and fixed FetidRat's missing StenchGas defense plus Larva's missing DEMONIC flag - leaving the honeypot-to-bee chain and quest scores recorded open. **Progress 2026-09-19:** the twelfth matrix, `MONSTER_ANALYSIS_NPCS_GHOST_WANDMAKER_BLACKSMITH_IMP_SHOP_RATKING.md`, covered the NPC set and fixed the Ghost turn-in to Java's weapon-or-armor choice (the both-items plus invented +2 HP are gone). **Progress 2026-09-19:** the thirteenth matrix, `MONSTER_ANALYSIS_BOSS_TRANSITIONS_TENGU_KING_YOG.md`, covered boss transitions and fixed three gaps - King P1->P2/P2->P3 now fire on the damage event instead of a turn late, Yog cooldowns accelerate (`-= dmgTaken/10`, post-clamp) with the gate min-5 reset, larvae die with Yog - while closing the lethal-P1 suspect (Java kills him too) and recording the unported Tengu's Mask. **Progress 2026-09-19:** the fourteenth matrix, `MONSTER_ANALYSIS_DOT_BUFFS_BURNING_POISON_BLEEDING_OOZE_CORROSION.md`, audited the five DoTs and fixed poison damage to Java's `(left/3)+1` (was a flat 1 - a third of Java's strength), leaving re-poison overwrite and bleeding-source gaps recorded open. **Progress 2026-09-19:** the fifteenth matrix, `MONSTER_ANALYSIS_POTIONS_ALL_TWELVE_QUAFF.md`, audited all twelve quaff effects - ten check out - and removed two invented extras (freerunner invisibility-duration extension; frost maxHp-fraction elemental scald), deleting four dead MWL rows. **Progress 2026-09-19:** the sixteenth matrix, `MONSTER_ANALYSIS_SCROLLS_EIGHT_REGISTRY.md`, audited the eight registry read effects - seven exact - and fixed Terror hitting allies (Java exempts them, like Rage). **Progress 2026-09-19:** the seventeenth matrix, `MONSTER_ANALYSIS_WANDS_FOUR_REGISTRY.md`, audited the four registry wands - Transfusion charm is now 5 (not 10) and heals charmed enemies, Ward promotions use Java's own HP deltas (not the zap-heal table), Fireblast statuses prolong (Paralysis 4, not 3); ally overheal-shielding stays recorded open. **Progress 2026-09-19:** the eighteenth matrix, `MONSTER_ANALYSIS_BOMBS_BLAST_SEAMS.md`, wired the live bomb seam into the King shield/transitions (all six seams now honor them) and verified every variant's numbers; ally-sparing and shrapnel line-of-sight stay recorded open. **Progress 2026-09-19:** the nineteenth matrix, `MONSTER_ANALYSIS_RUNESTONES_FOOD.md`, audited all twelve stones (every number exact - flock 2, aggression 20/5, clairvoyance 20, shock refund 1+hits, blast formula) and the six foods - fixing the invented meat heal (replaced by `MysteryMeat.effect()`'s real 5-way roll, Slow case unmodeled) and chargrilled's doubled energy (300 to the real 150) - and corrected four stale stone passages in `PORT_COVERAGE.md` (aiming now serves six stones, all twelve ported, Blast terrain/heaps live, per-call buff durations exist). **Progress 2026-09-19:** the twentieth matrix, `MONSTER_ANALYSIS_SHADOWCLONE.md`, ports the Rogue's ShadowClone armor ability - 80-HP ShadowAlly with Java's accuracy/evasion/damage/armor formulas over the shared ally orders; gear-proc shares, double-speed return, interact range and sprite stay recorded open. **Progress 2026-09-19:** the twenty-first matrix, `MONSTER_ANALYSIS_CHALLENGE.md`, ports the Duelist's Challenge armor ability - paired duel, spectator freeze, gap-closing blink, duel damage ledger, victory heal and elimination discount; bomb/trap/blast negation on frozen spectators stays recorded open. **Progress 2026-09-19:** the twenty-second matrix, `MONSTER_ANALYSIS_ELEMENTALSTRIKE.md`, ports the Duelist's ElementalStrike armor ability - WONT_STOP aim, reach-clamped cone, three talents, and all twenty-one imbuement branches with Java's numbers; Freezing blob, Displacing calm, Elastic collision damage, Lucky 80/20 loot, cast visuals and neutral-NPC immunity stay recorded open. **Progress 2026-09-19:** the twenty-third matrix, `MONSTER_ANALYSIS_WANDS_NINE_ZAP.md`, re-derived all nine remaining wand zap damage rolls against tag `v3.3.8` - eight exact - and fixed LivingEarth's level-scaled stand-in (4+0/6+2*lvl) with Java's real depth-scaled `NormalIntRange(2, 4 + scalingDepth()/2)`, pinned in `test:simulation` - and removed three invented Warlock zap bonuses with no Java source (a +2 on Magic Missile/Frost zaps, a free charge refund on every zap, and the same refund inside Fireblast; Java gives the Warlock SoulMark procs and Battlemage staff effects, never zap damage or refunds). **Progress 2026-09-19:** the twenty-fourth matrix, `MONSTER_ANALYSIS_PLANTS_HERO_MOB.md`, audited hero + mob plant activation against tag `v3.3.8` - Sungrass now grants the additive `boost(HT)` pool through the shared Java-shaped `Health.act()` tick (Warden gets `Healing.setHeal(HT, 0, 1)`, which is why the HoT carries explicit percent/flat rates), exact Warden/others durations on Starflower/Blindweed/Stormvine/Swiftthistle, the Icecap Freezing rework (no direct paralysis), Rotberry gas-only, Sorrowmoss set-not-prolong, Firebloom Warden imbue, shared cure across potion/well/Mageroyal/ankh, and Fadeleaf travel-cancel - leaving only Sorrowmoss's Warden ToxicImbue, Mageroyal's Warden BlobImmunity, and `resting = false` recorded open. **Progress 2026-09-17:** the third matrix, `MONSTER_ANALYSIS_GNOLL_BRUTE_SHAMAN_TRICKSTER.md`, covers the variant-inheritance case (Gnoll/Brute/ArmoredBrute/Shaman/GnollTrickster; Sapper recorded absent) - and the fourth matrix, `MONSTER_ANALYSIS_GHOUL_MONK_WARLOCK_GOLEM.md`, covers the Dwarf court: four single-kind abilities (the easiest table-migration shape), a second Monk/`senior` OR-chain pilot, and the King-court spawn-flag gap (`BOSS_MINION`, partner severing) - and the fifth matrix, `MONSTER_ANALYSIS_SUCCUBUS_EYE_SCORPIO_RIPPER.md`, covers the Halls demons: three finished single-kind kits plus the Ripper leap - ported 2026-09-17 as the first stateful movement-ability pilot (see the AI-overrides line above and its `PORT_COVERAGE.md` row) - its finding is that Brute/ArmoredBrute's per-site kind-ORs are the smallest pilot for the ability-table migration. **Progress 2026-09-16:** the
      second matrix, `MONSTER_ANALYSIS_DM200_DM300_PYLON.md`, covers an ordinary mob, its variant,
      a fixed-floor boss, and its supporting actor; it confirms data aliases and keyed strategies
      rather than Java-style classes. Remaining monster/item/buff families still need the same
      treatment. **Progress 2026-09-19:** the twenty-fifth matrix, `MONSTER_ANALYSIS_WARRIOR_ABILITIES.md`, audited all three Warrior armor abilities against tag `v3.3.8` - fixing Endure's `damageBonus` int semantics (per-hit banking truncation, truncating ending scales, integer split, post-split-zero detach, all pinned in `test:simulation`) and Heroic Leap's gated shove/`Int(4)` (both now unconditional per neighbouring non-ally; corpses stay put) - and verifying Shockwave unchanged, with striking-proc attackProc reassignment, StrikingWaveTracker accuracy, Vulnerable prolong-vs-set, the NPC-immunity convention, and the hero-armor composition recorded open. **Progress 2026-09-19:** the twenty-sixth matrix, `MONSTER_ANALYSIS_RINGS.md`, re-verified all twelve ring formulas against tag `v3.3.8` with every reader traced to live combat - fixing the two sites that never applied theirs (electricity-blob hero zap and corrosion-DoT hero tick now scale by `ringElementsMultiplier`, pinned in `test:simulation` via the new `tools/verifyRings.mjs`) - and recording the single-ring-slot simplification, the unreachable Force unarmed override, and the unowed freezing-trap/chill gates. **Progress 2026-09-19:** the twenty-seventh matrix, `MONSTER_ANALYSIS_HUNTRESS_ABILITIES.md`, audited all three Huntress armor abilities against tag `v3.3.8` - removing the port-invented rank-4 `x1.1` Spirit-Blades damage (Java's `+0.1` is an unreachable proc-chance term) and running the bow nature-proc on consumed tracker rolls during blade attacks, both pinned in `test:simulation` - and verifying Nature's Power and the SpiritHawk ally unchanged, with flat ability turn costs, hawk-expiry interrupt, and the clamped hawk sight recorded open. **Progress 2026-09-19:** the twenty-eighth matrix, `MONSTER_ANALYSIS_ROGUE_ABILITIES.md`, audited SmokeBomb and DeathMark against tag `v3.3.8` - fixing re-mark window stacking, the bankable DoubleMark discount (now a same-round latch, dropped on clock advance and on load), NinjaLog retirement, and the log's missing INORGANIC half, all pinned in the suites - with the corrupted-ally barrier corner recorded open. **Progress 2026-09-19:** the twenty-ninth matrix, `MONSTER_ANALYSIS_MAGE_ABILITIES.md`, audited WarpBeacon end to end against tag `v3.3.8` - fixing the missing placement invisibility-dispel, pinned in `test:simulation` - and confirmed ElementalBlast stays correctly unoffered (its wand source needs the unbuilt staff-imbue system; the formula layer is pinned and waiting) with the LARGE-push clause recorded open. **Progress 2026-09-19:** the thirtieth matrix, `MONSTER_ANALYSIS_FEINT.md`, audited Feint and the AfterImage against tag `v3.3.8` - giving the decoy Java's full immunity surface (central buff refusal plus toxic/corrosive/electricity skips, pinned in `test:simulation`, closing a permanence hole for held decoys) - with the forced retarget and displacement immunity recorded open. **Progress 2026-09-19:** the thirty-first matrix (Chains/Horn/Toolkit) closed the artifact-action gaps - chain pulls spend the turn and arm EnhancedRings only on success, horn meals run the shared meal-talent path. **Progress 2026-09-19:** the thirty-second matrix, `MONSTER_ANALYSIS_MELEE_ABILITIES.md`, replaced the percent-based ability damage model with Java's flat `dmgBoost` across all 31 weapon classes plus Cudgel, with guard/dance/stance/precise/runic/lash/aim/charged-shot/combo/cleave/retribution/lunge/heavyBlow corrections, Duelist+STR gating, the barrier moved to `takeAbilityCharge`, and the secondary-charge/combined-energy fictions removed. **Progress 2026-09-19:** the thirty-third matrix, `MONSTER_ANALYSIS_ENCHANT_GLYPH_CURSE.md`, re-audited all 13 enchant, 13 glyph and 16 curse procs - fixing Stone (dodge-reduction, not +2 armor), the inverted Bulk curse, the Swiftness radius, Shocking hitting allies, the missing Berserk catalyst on procs, the Metabolism/AntiEntropy/Corrosion numbers, Explosive warnings, Kinetic edges and the DirectedPower tracker, with the Stone formula pinned in `test:simulation`. **Progress 2026-09-19:** the thirty-fourth matrix, `MONSTER_ANALYSIS_DWARF_KING.md`, re-audited the King's full script - TELE moves the King himself first, LifeLink splits two-way `ceil(dmg/(links+1))`, `lastAbility` persists on whiffs, P2 waves pace on the `spend` cadence, the shield chips per dead P2-wave add instead of per wave-turn, servants grant no XP/loot (`maxLvl = -2`), death gained the `defeated` yell/Degrade cleanse/beacon upgrade, LINK alternates the real lifelink yells, and the wave-3 yell fires unconditionally - with wave plans plus cadence pinned in `test:simulation`. **Progress 2026-09-19:** the thirty-fifth matrix, `MONSTER_ANALYSIS_TRAPS.md`, re-audited all 9 modeled trap kinds - Grim is `round(HT/2 + HP/2)` (both branches; mob branch lost its invented armor cut), Explosive is a verbatim stock bomb (`4+d..12+3d`, no falloff, no fire seed, all three blast sites), Burning deals no direct damage (Fire 2 on NEIGHBOURS9, ignition via the fire tick) - with both formulas pure and pinned in `test:simulation`. **Progress 2026-09-19:** the thirty-sixth matrix, `MONSTER_ANALYSIS_YOGFISTS.md`, re-audited all six fists against tag `v3.3.8` - elemental zaps now cool down (`NormalFloat(8, 12)` float, persisted, bright/dark exempt) and only soiled/bright/dark roll to hit, burning zaps reignite plus top-up fire 3x3 (no direct damage) with the per-turn evaporation, soiled furrows reweighted to `chances([0,2,1])`, rotting hits convert to 60% Bleeding on both damage paths with the water heal and harvest exemption, the five invented contact riders are gone (rotting ooze only), dark no longer pays bright's daze prices, bright's invented frost immunity is deleted, and fist rows carry Java's EXP 25 - with immunities plus scene-structure pins in `test:simulation`. **Progress 2026-09-19:** the thirty-seventh matrix, `MONSTER_ANALYSIS_UNPORTED_QUEST_MOBS.md`, audited the eight mining-quest actors Java places only from rooms this port never generates (`CrystalGuardian`/`CrystalSpire`/`CrystalWisp`, `FungalSentry`/`FungalCore`, `GnollSapper`/`GnollGeomancer`/`GnollGuard`) - recorded Not-ported with exact numbers, verified no live references, no roster divergence (all weight 0), and no quest soft-lock, with a suite pin that no MWL row exists for any of them. (2026-09-23: the GNOLL and CRYSTAL trios are ported since - `PORT_COVERAGE.md`'s "Blacksmith GNOLL mine roster" and "Blacksmith CRYSTAL mine roster" rows; the pin now covers the two FUNGI actors that remain.) **Progress 2026-09-19:** the thirty-eighth matrix, `MONSTER_ANALYSIS_RARE_SPAWNS.md`, audited the spawn-time rarity systems - the eight ported alt swaps, four rare injections, and chaos roll check out against `MobSpawner.getMobRotation()`/`swapMobAlts()`/`addRareMobs()` and `Elemental.random()`, with one real fix (chaos rolled 1/51 via inclusive `Random.int(0, 50)`, now `Random.float() < 1/50`, pinned live plus structurally); the remaining unported spawnables (`GnollExile`/`HermitCrab`, `GoldenMimic`/`EbonyMimic`, `PhantomPiranha`, `FungalSpinner`, `MobSpawner`, `DelayedRockFall`) recorded Not-ported with numbers and suite-pinned absent. **Progress 2026-09-19:** the thirty-ninth matrix, `MONSTER_ANALYSIS_CLERIC.md`, audited the Cleric against tag `v3.3.8` - one real fix (the Cudgel's 1.4 accuracy lived on the class, now gated on the implicit starting cudgel, pinned structurally), Cudgel 1-8 verified exact, and the 30-spell roster plus tome economy, all three armor abilities, and both subclasses recorded Not-ported with numbers. **Progress 2026-09-19:** the fortieth matrix, `MONSTER_ANALYSIS_HONEYPOT_BEE.md`, ported the honeypot shatter chain against `Honeypot.java`/`Bee.java` - one action for SHATTER+THROW, hostile bee with persisted pot anchor hunting holder-first at `viewDistance` 4, depth stats pinned live - with the strike-back, honeyed-charm, `ShatteredPot`, and pit-landing residuals stated. **Progress 2026-09-20:** the forty-first matrix, `MONSTER_ANALYSIS_GOO_TENGU.md`, re-audited the Goo and Tengu kits against tag `v3.3.8` - porting Goo's 1-in-3 Ooze proc, the `STRONGER_BOSSES` HP floors (Goo 120, Tengu 250 - the Tengu floor was missing), Tengu's Blindness immunity, the boss-challenge reverse direction (`foulBossChallenge`: Goo heal/slam, Tengu bomb/cone/shocker on the hero), cone ignition at seed time, and the ACIDIC Corrosion halve - while deleting the false pumped-Goo-hit shake (no such Java code exists) - with the bossScores economy, LockedFloor timing, cone terrain/timing, and presentation residuals stated. **Progress 2026-09-20:** the forty-second matrix, `MONSTER_ANALYSIS_MIRROR_SHEEP_PRISMATIC.md`, audited the MirrorImage/Sheep/PrismaticImage kits against tag `v3.3.8` - live-synced mirror stats (accuracy/evasion formulas, half damage, hero DR), mirror gas/burning immunities, producer sheep lifespans (flock 8, woolly 20/200) with full sheep invulnerability (evasion/buffs/damage), and a clean prismatic re-verification - with aggro, proc shares, weapon/armor factors, uniform attackDelay, arm film, reach, Sheep.interact and particles recorded open. **Complexity: M.**
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
- [x] **File-size refactor: keep every hand-written source file human-readable.**
      **Closed 2026-09-21, correcting a badly stale claim.** This bullet's own narrative below still
      reads `dungeonScene.ts` at 22,534 lines after its 44th micro-extraction and predicted the
      remaining seams needed the section-11 runtime migration to move further - both now false. The
      file is **2,439 lines** as of this check (`wc -l src/scenes/dungeonScene.ts`), split by domain
      into `src/scenes/dungeon/*.ts` (`combatResolution.ts`, `environmentFireTraps.ts`,
      `panelsSingleUse.ts`, `turnLoopAiming.ts`, `actorTurnsHazards.ts`, `monsters/monsterAi.ts`,
      `bosses/bossLogic.ts`, `deathSaveRefresh.ts`, `hero/inventoryQuickslot.ts`,
      `hero/armorAbilityUse.ts`, `hero/weaponSpellsGear.ts`, `hero/clericSpellFlows.ts`, and more)
      mixed back onto `DungeonScene.prototype` via `Object.assign`, each file taking a `Mixed<typeof
      ...Methods>` slice of the interface - a larger structural jump than any single extraction this
      bullet documented, whose own intermediate history isn't reconstructed here (it happened across
      sessions this pass has no transcript for; `git log`/`git show` on the relevant files is the
      real record if it's ever needed). `npm run check`'s `tools/check-file-budget.mjs` gate is live
      and green: every hand-written file fits 2,000 lines except four narrow, deliberate,
      currently-declining overages in `tools/file-budgets.json` (`dungeonScene.ts` 2,439/2,445,
      `environmentFireTraps.ts` 2,002/2,010, `inventoryQuickslot.ts` 2,212/2,220, plus
      `portStrings.ts` at a fixed 12,259 - translation data, not logic, with no seam to extract
      along). The stated objective - no hand-written `.ts` file too large for a reader to hold its
      structure or review a diff touching it - is met; further shrinking any of the three narrow
      overages remains ordinary, optional follow-up work, not a standing gap.
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
      before/after `tsc` + build). The promised line-count gate is live since
      2026-09-20 (`tools/check-file-budget.mjs`, wired into `npm run check`):
      every hand-written `src/**/*.ts` file must fit 2,000 lines except the
      entries in `tools/file-budgets.json` (`dungeonScene.ts` at 22,600,
      `portStrings.ts` at 10,300 - loose headroom over the day's counts, to be
      lowered in the same commit as each shrink and deleted once a file fits).
      **Triaged 2026-09-20, the micro-extraction vein is exhausted**: the
      thirty-fifth through forty-fourth extractions completed every seam-clean
      micro-unit the scene still held (six targeting queries, five wandering
      decisions, the vent emission, three consolidations: hunting blocked-set,
      flee-step, summon-cell) with paired drives and green gates throughout -
      and netted +8 lines across the ten commits (22,526 to 22,534), because
      adapters, builders and deviation-note comments cost what small moved
      bodies save. What remains scene-side is orchestration
      (turn loop, AI with live pathfinder, rendering, the context builders
      that must bind scene state) - not movable as behavior-identical
      micro-slices. Further movement toward the 2,000-line objective belongs
      to the section-11 runtime-command migration, not to more
      extractions - with two later exceptions driven by the file budget itself: the 45th (`takeSentryTurn` -> `simulation/sentryTurn.ts`, whole beam-turret turn with a headless warmup/gaze pin) and the 46th (the shared Amok/Aggression pursuit tail -> `pursueTarget` in `simulation/targeting.ts`, with an adjacency/blocking pin), both behavior-identical with scene adapters, landed 2026-09-20 when behavior ports pushed the scene 7 lines over its 22,700 budget. Further 2026-09-20 extractions, all behavior-identical and behind small context/callback seams: the boss `unseal()` cluster -> `scenes/bossUnseal.ts` (-93), the in-game menu -> `ui/gameMenu.ts`, the aim-preview drawing -> `ui/aimOverlay.ts`, and `spawnMonster`'s sprite/`Creature` construction plus `CHAMPION_TINT`/`allyIdentityColorAdd` -> `scenes/monsterSpawn.ts` (-163, live-checked against the original ally tints, alpha and Monk Focus), and the 287-line monster-side on-hit hook `mobOnHit` -> `scenes/mobOnHit.ts` behind a `MobOnHitContext` (-268; live-checked over ten armor glyphs x seventeen monster kinds with no exception). The scene's exact cap is now 22,160. **First extraction 2026-09-19**: the alchemy-pot window flow
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
      confinement guard satisfied. The mob half stays for the fifth extraction. The
      old Dreamfoil note was corrected in `PORT_COVERAGE.md`: v3.3.8 renamed that plant
      to Mageroyal, whose seed and trigger behavior are already ported and tested.
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
      **Complexity: M.** **Twenty-first extraction 2026-09-19**: the self-buff pair
      (`useFeatherFall`'s cushion-and-log, `useWildEnergy`'s refund/buff/bank/extend) joined
      `items/spells.ts` as `useFeatherFallFlow`/`useWildEnergyFlow` behind a `CastBase` plus
      `FeatherFallContext`/`WildEnergyContext` (spell gate/consume, buff/refund/recharge/timer
      seams, turn, say); the scene keeps the two one-line adapters the router calls, two
      builders over a shared `castBase`. The module reads the buff table and the recharge
      turns directly. Net +19 lines in `dungeonScene.ts` (22,771 after) - two builders and a
      base for two tiny bodies - `spells.ts` 358 to 419; same payback as the small slices
      (first headless coverage of both casts). Suites: `tsc` clean with no fix-ups, item suite
      green with a new headless drive (missing spells do nothing; feather cushions for the
      table duration with the light line; wild refunds one charge, grants recharging for the
      table duration, banks exactly 4, extends by exactly the table turns, and logs nothing).
      The move corrected two stale claims in passing: the scene comment and the WildEnergy
      coverage row both said the four-turn pulse was unmodeled for want of a recharge clock,
      but `ArtifactRecharge` ported the next day and the body always banked it - both now say
      so, with the row pointing at the correction.
      **Complexity: S.** **Twenty-second extraction 2026-09-19**: the honeypot throw/shatter
      pair (`useHoneypot`'s pending-aim re-entry, `shatterHoneypotAt`'s owner-neighbour-free
      break) moved to the new `items/honeypot.ts` behind a `HoneypotFlowContext` (pot
      has/consume, aimer with the passable-non-chasm validate, pending-aim cell, occupant
      view, spawn-free test, bee release with holder, turn); the scene keeps the one-line
      adapter the router calls plus a builder. Net −8 lines in `dungeonScene.ts` (22,763
      after), new `honeypot.ts` 75 lines. Suites: `tsc` clean with no fix-ups, item suite
      green with a new headless drive (missing pots never aim, empties break ownerless with
      pot and turn spent, occupants sidestep the bee to a free cardinal with the holder set,
      NPCs pin no holder, no free cell keeps the pot and spends nothing, pending aims break
      at once). The drive caught one fixture bug in review - the NPC case freed only the
      occupied cell, but any occupant forces the cardinal scan - fixed by freeing a cardinal.
      **Complexity: S.** **Twenty-third extraction 2026-09-19**: the stylus/alchemize picker
      pair (`useStylus`'s identify/curse gates plus glyph write, `useAlchemize`'s energy
      filter plus scrap/bank/identify) joined `items/spells.ts` as `useStylusFlow`/
      `useAlchemizeFlow` behind `StylusContext`/`AlchemizeContext` (carried-spell gates,
      pickers, live-bag scans, glyph roll, energy bank, name, panels); the scene keeps the
      two one-line adapters the router calls plus two builders. The module reads the class-
      armor predicate, the curse lookup, and the energy table directly; only the glyph roll
      stays scene-side where its table lives. Net −6 lines in `dungeonScene.ts` (22,757
      after), `spells.ts` 419 to 545. Suites: `tsc` clean after snapshotting the readonly
      bag at the listing seams, item suite green with two new headless drives (stylus:
      missing styli never open pickers, tiered and class armors offered with swords excluded,
      unidentified/cursed/glyphed picks refuse keeping the stylus, missed rolls write nothing;
      alchemize: missing spells never open pickers, the picker runs the real energy table
      with the suite-pinned 12 banked, self-scrapping offers nothing, vanished picks bank
      nothing). The drive caught one fixture bug in review - minted ids the default-true
      predicate wrongly admits, same trap as the infusion drive - fixed with the suite-pinned
      real ids (`warriorarmor`, `potionHealing`); and four redundant second invocations the
      factory already runs were deleted before committing.
      **Complexity: M.** **Twenty-fourth extraction 2026-09-19**: the bomb throw-aim half
      (`useBomb`'s pending-target re-entry, the MWL range, the passable-non-chasm validate)
      joined `items/bombs.ts` as `aimBombFlow` behind a `BombAimContext` (bomb gate, aimer,
      range, pending-aim cell, detonate callback into the scene's existing `bombContext`
      call); the detonate half already lived there. The scene keeps the one-line adapter the
      router calls plus a builder. Net +4 lines in `dungeonScene.ts` (22,761 after) - the
      builder costs what the tiny body saved - `bombs.ts` 68 to 106. Suites: `tsc` clean with
      no fix-ups, item suite green with a new headless drive (missing bombs never aim, the
      range comes from the seam, confirms clear pending and hand target/id/instance to the
      detonate half, pending aims detonate at once). No review bugs this slice.
      **Complexity: XS.** **Twenty-fifth extraction 2026-09-19**: the candle throw-aim half
      (`useCandle`'s ritual gate, slot validate, place-plus-turn confirm) joined
      `items/candles.ts` as `aimCandleFlow` behind a `CandleAimContext` (candle gate, ritual
      pos/width, slot-free test, aimer, place callback into the scene's existing
      `candleContext` call, turn); the place half already lived there. The scene keeps the
      one-line adapter the router calls plus a builder, and drops the now-unused
      `candleRitualSlots` import (the geometry lives in the module now). Net −2 lines in
      `dungeonScene.ts` (22,759 after), `candles.ts` 61 to 105. Suites: `tsc` clean with no
      fix-ups, item suite green with a new headless drive next to the existing place checks
      (no candle/no ritual never aim, empty slots validate while filled and non-slots refuse,
      confirms place the validated slot and spend the turn). No review bugs this slice.
      **Complexity: XS.** **Twenty-sixth extraction 2026-09-19**: the ankh-bless and
      torch-light self uses (`useAnkh`'s full-skin gate plus bless-and-drain, `useTorch`'s
      consume-plus-light) moved to a new `items/selfUse.ts` as `useAnkhFlow`/`useTorchFlow`
      behind `AnkhContext` (ankh gate, waterskin level, drain, turn, say, `t`) and
      `TorchContext` (torch gate, consume, grant-light, turn). The scene keeps the one-line
      adapters the router calls plus `ankhContext()`/`torchContext()` builders. Net +16 lines
      in `dungeonScene.ts` (22,775 after) - the two builders cost more than the small bodies
      saved - `selfUse.ts` 70 new. Suites: `tsc` clean with no fix-ups, item suite green with
      a new headless drive (missing ankh/torch never act, a full skin blesses plus drains with
      the bless line and a turn, a short skin spends nothing with the needsfull line, a torch
      consumes, lights and spends the turn once). No review bugs this slice.
      **Complexity: XS.** **Twenty-seventh extraction 2026-09-19**: the scroll-read
      selection plus dispatch (`readScroll`'s select/priority, upgrade refusal, transmute
      delegation, identify consume-and-proc, registry dispatch, unknown-id cleanse
      fallback) moved to `items/scrollEffects.ts` as `readScrollFlow` behind a
      `ReadScrollContext` extending the existing `ScrollEffectsContext` (bag, requested
      id/instance, heroClass, talent ranks, empowered-zaps get/set, display name,
      identify-talent proc, transmute delegate, weapon-affix/armor-glyph get/set, live
      equipped ring, resync); the scene spreads its existing `scrollEffectsContext()`
      into the builder and keeps the one-line adapter, dropping the now-unused
      `selectScrollId`/`empoweringScrollsCharges` imports. Net −41 lines in
      `dungeonScene.ts` (22,734 after), `scrollEffects.ts` 151 to 252. Suites: `tsc`
      clean after one real catch (a spread literal cannot satisfy a set-only interface
      member - TS2322 - so the context carries an empowered-zaps get/set pair with a
      one-line comment, unlike TransmuteFlowContext's set-only whose literal has no
      spread), item suite green with a new headless drive (empty-bag and upgrade
      refusals consume nothing, transmute delegates without arming, identify consumes,
      identifies, procs and arms for a mage, the nothing-new line, a registry rage read
      waking and arming, the unknown-id fallback cleansing weakness/weapon/ring curses
      but not poison). No review bugs this slice.
      **Complexity: S.** **Twenty-eighth extraction 2026-09-20**: the `scrollUpgrade`
      action (`upgradeGear`'s no-scroll refusal, missile catch-up, weapon/armor pick
      with shared/twin armor bonuses and mage/rogue talent riders, plus the
      `rollUpgradeAffixLoss` curse/incompatible/hardening branches) moved to
      `items/scrollEffects.ts` as `upgradeGearFlow` behind an `UpgradeGearContext`
      (bag, hero, class/subclass/talents, get/set pairs for missile/weapon/armor
      levels, ammo pile/set/thresholds, wand charges, affix/glyph/hardening flags,
      scripted `randomInt`/`randomFloat`, say, resync); the scene keeps the one-line
      `upgradeGear` adapter plus the builder, and `rollUpgradeAffixLoss` survives as a
      one-line adapter too since the blacksmith upgrade path also calls it - dropping
      the now-unused `sharedUpgradeArmor`/`twinUpgradeArmor` imports. Net −40 lines in
      `dungeonScene.ts` (22,694 after), `scrollEffects.ts` 252 to 393. Suites: `tsc`
      clean after one real catch (`CLASS_AMMO` is a `Set<ClassId>`, so the context
      carries the class as `ClassId`, not `string`), item suite green with a new
      scripted-rng drive (refusal, missile catch-up with set mint and threshold,
      weapon/armor picks with energizing refund and mystical cloak, curse lift/keep,
      incompatible loss/keep on both slots, hardening floor and loss, empty queues
      proving the below-floor branches roll nothing). Two drive-setup bugs caught by
      the suite itself (ammo-class defaults and equal-level ties divert branches).
      **Complexity: S.** **Twenty-ninth extraction 2026-09-20**: the healing/purity
      trio (`cureHeroBuffs`, `applyPotionHealing`, `applyPotionPurity`) moved to
      `items/potionEffects.ts`, where the quaff registry now calls them directly
      instead of through scene callbacks; the scene keeps thin `cureHeroBuffs`/
      `applyPotionPurity` adapters for the wells, the ankh revive and `quaffPotion`'s
      own fallback (`applyPotionHealing` had no other caller and is gone), and the
      context trades the two callbacks for heal-pool accessors plus a shield grant.
      Net −35 lines in `dungeonScene.ts` (22,659 after), `potionEffects.ts` 141 to 200.
      Suites: `tsc` clean after one real catch (contextually-typed lambda params need
      explicit types here), item suite green first try with a new drive (the
      seven-debuff cure keeping burning and the daze stand-in, the max-rule pool, the
      willpower/agility riders, purity's poison-plus-burning clear, the registry
      wiring). The stubbed-`addBuff` roots branch and the stubbed-off no_healing
      branch stay live-only by construction, stated in the drive comment.
      **Complexity: XS.** **Thirtieth extraction 2026-09-20**: dew-drop collection
      (`collectDewdrop`'s skin top-up, full-skin heal with the Warden shielding-dew
      shield, healthy refusal, force flag) moved to `items/consumables.ts` behind the
      existing `ConsumableContext` extended with subclass/shield accessors; the scene
      keeps the one-line adapter the ground-pickup context calls, dropping the
      now-unused `shieldingDewGain` import. Net −7 lines in `dungeonScene.ts` (22,652
      after). Suites: `tsc` clean first try, item suite green with a new drive
      (top-up by one, hurt-heal of one 0.05*HT drop with readout, warden rank-2
      shielding, refusal, forced zero-heal). One suite-setup catch (an earlier
      same-name require proved block-scoped, so the drive aliases its own).
      **Complexity: XS.** **Thirty-first extraction 2026-09-20**: `Preparation`'s
      blink-aim family (`usePreparationBlink` plus the target/reach/destination/
      confirm helpers) moved to `simulation/preparation.ts` behind a
      `PreparationBlinkContext` (hero, subclass/talents, aimer, creature/fov/level/
      flood seams, move/refresh, the strike tail as callbacks); the scene keeps the
      one-line adapter plus a builder, dropping the now-unused
      `preparationBlinkDistance` import. Net −57 lines in `dungeonScene.ts` (22,595
      after), `preparation.ts` 130 to 257. Suites: `tsc` clean first try, item suite
      green with a new BFS-flood drive (aim ranges, validation, adjacent and blink
      strikes, both refusals with the rooted-only shake), and the sim suite green -
      including the sibling-import confinement guard, which forced one real rework:
      simulation modules take no runtime imports outside their directory, so the
      moved code inlines its Chebyshev/neighbour math and passes message keys for
      the scene to translate (the brews-module convention). Found in the same pass:
      the coverage row's "screen shake on a rooted refusal" gap never was one - the
      shake is live and now pinned - corrected in place.
      **Complexity: S.** **Thirty-second extraction 2026-09-20**: the `Ratmogrify`
      armor-ability flow (nearest-target selection with the boss/rat/ally
      exclusions, charge gate, transform, ratlomacy permanence with its adrenaline
      kicker, ratforcements self-cast) moved to `simulation/ratmogrify.ts` as
      `useRatmogrifyFlow` behind a `RatmogrifyContext` (hero/creature views, fov/
      level seams, boss predicate, charge cost/getter, scripted shuffle, awake-rat
      spawn and adrenaline callbacks, key-passing say); the scene keeps the one-line
      adapter plus a builder. Net −23 lines in `dungeonScene.ts` (22,572 after),
      `ratmogrify.ts` 17 to 119. Suites: `tsc` clean after one real catch (the
      scene's optional `Creature.kind` needs an optional view field with an
      undefined-tolerant boss predicate), item suite green first try with a new
      drive (refusal, nearest pick, all six exclusions, permanence with and without
      the kicker, talentless recast refusal, the two-rat self-cast). Sim suite
      green including the confinement guard.
      **Complexity: S.** **Thirty-third extraction 2026-09-20**: `trampleHighGrass`'s apply half plus the `plantBloomingGrass` sibling moved to `simulation/highGrass.ts` (where the pure plan already lived) as `applyHighGrassTrample` behind a `HighGrassApplyContext`; the scene keeps the one-line adapters plus a shared builder. Net −33 lines in `dungeonScene.ts` (22,539 after), `highGrass.ts` 103 to 233. Suites: `tsc` clean first try, item suite green first try with a new drive (plain passthrough, furrowing, the clear with camouflage keep-max and exact plan odds, cursed suppression without rolling, scripted seed/dew spawns, all four bloom verdicts). Noted in the drive comment: `natures_aid`'s shield and the berry schedule need a huntress past the furrow branch, which the plan never emits - live but unreachable through this flow, in Java's shape too. **Complexity: S.**
 **Thirty-fourth extraction 2026-09-20**: `afterMonsterTurn`'s buff ticks
      (rat countdown/expiry, monk/senior focus cooldown and attach, haste
      countdown/restore) moved to `simulation/buffs.ts` as `tickMonsterTurnEnd`
      behind a monster view with a focus-attach callback; the death-mark tick
      and time-bubble spend stay scene-side. Net -13 lines in `dungeonScene.ts`
      (22,526 after). Suites: `tsc` clean after two real catches (the scene's
      optional `speed`/`kind` need optional view fields), item suite green first
      try with a new drive (rat tick/expiry/permanence, focus attach/cooldown/
      blindness gates, haste tick/restore). Sim suite green.
      **Complexity: XS.**
      **Thirty-fifth extraction 2026-09-20**: the class-special throw aim's
      `nearestVisibleEnemy` helper moved to `simulation/targeting.ts` (where
      `selectRangedTarget` already lived) as `nearestVisibleEnemy` behind the
      module's own `SimulationRoguelike` seam - the scene keeps the one-line
      adapter binding its level, hero, creatures and field of view, and the
      bomb/stone auto-targets ride that same adapter. Net +8 lines in
      `dungeonScene.ts` (22,534 after) - the moved five-line body cost less
      than the adapter plus its deviation-note comment; `targeting.ts` 24 to
      47. Suites: `tsc` clean, item suite green with a new drive (empty/hero/
      npc/unseen/out-of-range refusals, nearest-wins ordering, range gating,
      scripted geometry). Sim suite green.
      **Complexity: XS.**
      **Thirty-sixth extraction 2026-09-20**: `Mob.chooseEnemy()`'s Aggression
      priority (`aggressionTarget` - nearest in-range `aggression`-buff carrier,
      even another enemy) moved to `simulation/targeting.ts` beside its two
      targeting neighbours behind the module's own `SimulationRoguelike` seam;
      the scene keeps the one-line adapter binding its level and creatures.
      Net +2 lines in `dungeonScene.ts` (22,536 after) - the moved five-line
      body cost less than the adapter plus its deviation-note comment;
      `targeting.ts` 47 to 69. Suites: `tsc` clean first try, item suite green
      first try with a new drive (seeker/npc/dead/unbuffed/range exclusions,
      enemy and ally carriers included, nearest-wins ordering). Sim suite
      green.
      **Complexity: XS.**
      **Thirty-seventh extraction 2026-09-20**: `ToxicGasSeed.evolve()`'s vent
      emission (`emitToxicGasVents` - re-seed ordinary ToxicGas while local gas
      is at most 9x the vent's retained source) moved to
      `simulation/environmentalBlobs.ts` behind a `ToxicVentContext` (vent map,
      width, inside/terrain reads, the TRAP id as a value, gas total/amount/seed
      callbacks); the scene keeps the one-line adapter. Net +9 lines in
      `dungeonScene.ts` (22,545 after) - the binding object costs more than the
      ten-line loop it replaces; `environmentalBlobs.ts` 221 to 252. Suites:
      `tsc` clean first try, item suite green with a new drive (re-seed under
      9x, refusal above, always on a gas-free floor, non-trap/outside skips;
      one stray-brace suite syntax error caught by `node --check` before the
      run). Sim suite green.
      **Complexity: XS.**
      **Thirty-eighth extraction 2026-09-20**: the wandering-decision trio
      (`wanderBlocked`'s creature/eternal-fire/piranha blocked set,
      `isPatrolTargetValid`'s retained-destination check,
      `randomPatrolDestination`'s `Level.randomDestination` sampler) moved to a
      new `simulation/wandering.ts` behind one `WanderingContext` (dims,
      passable/inside/terrain reads, the WATER id as a value, chasm/occupant
      reads, creatures, hero, an eternal-fire fold-in plus the
      `Random.element` pick as callbacks); the scene keeps one builder plus
      adapters, and the `takeWanderingTurn` validity branch calls the flow.
      Net 0 lines in `dungeonScene.ts` (22,545 after) - the builder plus
      adapters cost what the three moved bodies saved; the gain is domain
      placement (all wandering decisions in one module, ahead of the hunting/
      fleeing work the architecture doc names next), not shrinkage.
      `wandering.ts` is 80 lines new. Suites: `tsc` clean first try, item
      suite green first try with a new drive (blocked-set membership both
      modes, extra-fire fold-in, piranha confinement, all seven validity
      verdicts, the scripted roll plus the empty-floor undefined). Sim suite
      green.
      **Complexity: S.**
      **Thirty-ninth extraction 2026-09-20**: the hunting step built its own
      blocked set inline - line-for-line the `wanderBlocked(monster, false)`
      shape (creatures minus seeker and hero, eternal fire, piranha water
      confinement with the hero-cell exception) - now deduped onto the shared
      helper, behavior-identical. Net -4 lines in `dungeonScene.ts` (22,541
      after); the thirty-eighth drive already pins both blocked modes, and the
      sim suite's monster-turn checks cover the hunting path. `tsc` clean,
      item/sim suites green, build clean.
      **Complexity: XS.**
      **Fortieth extraction 2026-09-20**: `Amok.act()`'s target query
      (`takeAmokTurn`'s nearest living non-NPC within eight cells, no
      line-of-sight gate) moved to `simulation/targeting.ts` as `amokTarget`
      behind the module's own `SimulationRoguelike` seam; the scene keeps the
      one-line adapter. Net 0 lines in `dungeonScene.ts` (22,541 after);
      `targeting.ts` 69 to 90. Suites: `tsc` clean first try, item suite
      green first try with a new drive (self/npc/dead/far exclusions, range
      edge, ally inclusion, nearest-wins ordering, visibility-free geometry).
      Sim suite green.
      **Complexity: XS.**
      **Forty-first extraction 2026-09-20**: `Bee.chooseEnemy()`'s cascade
      (pot holder first at any range, else nearest live mob within 3 of the
      pot, else the hero within 3 - including the fall-through when a recorded
      holder is gone) moved to `simulation/targeting.ts` as `beeTarget` behind
      the module's own `SimulationRoguelike` seam; the scene keeps the
      one-line adapter. Net -10 lines in `dungeonScene.ts` (22,531 after);
      `targeting.ts` 90 to 121. Suites: `tsc` clean first try, item suite
      green after one real drive-setup catch (the dead-holder case passed a
      live hero in the folk list while the hero arg was dead - the flow is
      verbatim, the setup lied), covering holder-first, both fall-throughs,
      pot-mob, pot-hero, far-pot and potless verdicts. Sim suite green.
      **Complexity: XS.**
      **Forty-second extraction 2026-09-20**: the farthest-open-neighbour
      step (`Hunting.getFurther` shape) moved to `simulation/wandering.ts` as
      `fleeStep` behind a `FleeStepContext` (passable/occupant reads, the
      offsets as data, Chebyshev plus hero as values); `stepAway` and
      `fleeCrystalMimic` were line-for-line duplicates apart from their tails
      and now share the flow, keeping only the combo reset and the boolean
      report respectively. Net -3 lines in `dungeonScene.ts` (22,528 after);
      `wandering.ts` 80 to 114. Suites: `tsc` clean first try, item suite
      green first try with a new drive (farthest-wins with strict-`>` scan
      order, occupied-best fallback, boxed-in and nearer-only refusals - the
      first draft expected the wrong winner and the flow's verbatim strictness
      corrected the setup, not the reverse). Sim suite green.
      **Complexity: XS.**
      **Forty-third extraction 2026-09-20**: `Mob.findEnemy()`'s ally branch
      (nearest living non-sheep ally in the mob's FOV, outside smoke) moved to
      `simulation/targeting.ts` as `findEnemyAlly` - the FOV and the smoke
      gate arrive as callbacks, so the module still takes no runtime imports;
      the scene keeps the one-line adapter. Net +3 lines in `dungeonScene.ts`
      (22,531 after); `targeting.ts` 121 to 145. Suites: `tsc` clean first
      try, item suite green after two placeholder assertions were caught
      comparing fresh objects by identity instead of the returned element (the
      flow is verbatim; the setup compared wrong), covering allies-only,
      sheep/dead/unseen/smoked exclusions and nearest-wins ordering. Sim
      suite green.
      **Complexity: XS.**
      **Forty-fourth extraction 2026-09-20**: the summon-cell search (free
      neighbour cells sorted by hero distance) moved to
      `simulation/wandering.ts` as `nearestFreeCell` behind a
      `SummonCellContext` (the flee-step reads plus inside/chasm gates, built
      by spreading `fleeStepContext()`); the EarthGuardian placement (center
      admitted) and the Yog-minion placement (neighbours only) now share the
      flow. Net +3 lines in `dungeonScene.ts` (22,534 after);
      `wandering.ts` 114 to 137. Suites: `tsc` clean first try, item suite
      green first try with a new drive (nearest-to-hero wins, center
      admitted/excluded, chasm/occupied/outside refusals, undefined when
      nothing is free). Sim suite green.
      **Complexity: XS.**
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
