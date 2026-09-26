# Port coverage notes: Fixed boss-floor layouts (depths 10, 15, 20, 25, 26)

Historical audit narrative (closed). Row tables live in `rows-*.md`. Closed points only: every row here is Ported, Simplified (with its stated reduction) or a Divergence (deliberate). Open work lives in `ROADMAP.md` and `BACKLOG.md`; a row that still carries a residual points to its `ROADMAP.md` R-number. New rows go into the file whose area matches, appended at the end; do not add them to `PORT_COVERAGE.md`.

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

**Bug found and fixed 2026-09-25 (Tengu genuinely unreachable):** `PrisonBossLevel.createItems()`
(`v3.3.8`) drops a guaranteed `IronKey(10)` at `randomPrisonCellPos()` - a random interior cell of
one of the floor's `startCells` - so a real player can always find the key that opens the locked
door into Tengu's cell. This port's fixed depth-10 layout (`prisonBoss()`, `bossLevels.ts`) paints
the door as `Terrain.LOCKED_DOOR` (matching Java) but never placed the key anywhere - confirmed by
reading `prisonBossEnd()`'s own pre-existing doc comment, which had already correctly noted "Java's
`IronKey`-heap cleanup ... is presentation/item-side, not paint" without anyone following through
on the item-side half. The result: **Tengu was completely unreachable by normal play** - the only
door into his cell could never be unlocked, by any class, in any run. Found via a scripted live
playthrough (`playwright-core` against the sandbox Chromium) whose exploration bot got
permanently stuck at that exact door on every attempt; a user's suggestion to cross-check the real
Java source for the key mechanic (rather than continuing to assume it was a test-script
limitation) is what surfaced `PrisonBossLevel.createItems()` and confirmed this was a genuine gap.
**Fixed:** `PRISON_START_CELLS` (this port's own `startCells`, already existing in `bossLevels.ts`
for the terrain paint) is now exported and read from `populate()`'s `boss.kind === 'tengu'` branch
(`npcShopBlacksmith.ts`) - a guaranteed `ironKey` ground item spawns at a random interior cell of a
random start cell, once per floor (guarded against a second mint on re-entry, matching the Amulet
drop's own guard immediately below in the same function). Live-verified: the key is present at a
real generated position, a normal walk-onto-cell pickup adds it to the bag, bumping the Tengu-cell
door consumes it and unlocks/opens the door on the real two-turn bump-then-step sequence
(`bumpDoor`, `environmentFireTraps.ts`), and the same exploration bot that was stuck now walks
through, finds, wakes, and fights Tengu for real. `npx tsc --noEmit`/`npm run build` clean.
