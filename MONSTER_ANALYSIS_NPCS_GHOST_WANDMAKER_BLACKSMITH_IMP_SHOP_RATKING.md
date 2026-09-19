# NPC analysis: Ghost / Wandmaker / Blacksmith / Imp / Shopkeeper / RatKing

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the twelfth analysis matrix and the first for non-combatants. The
family is useful because NPCs invert the audit: nothing attacks, nothing is attacked (the
`isNPC` guards hold across every combat path and monster turns return before acting), so
all behavior is quest-state routing in `src/actors/npcs.ts` plus scene-supplied inventory
mutation. Java authority is tag `v3.3.8` throughout.

## The matrix

| Axis | Ghost | Wandmaker | Blacksmith | Imp | Shopkeeper | RatKing |
| --- | --- | --- | --- | --- | --- | --- |
| **Data** | quest type by depth (`depth - 1` selects fetid/trickster/crab); quest definition with given/objective/turn-in stages, persisted | three fetch types with per-type intro/reminder lines; wand pair generated at levelgen and persisted | pickaxe grant, blood alternative, favor balance, six-service window | token need (5 monks / 8 golems by branch); random-ring reward persisted conceptually (rolled at handover in both) | price lists, buy/sell math | sleeping spawn; crown exchange rules |
| **Function** (shared) | `quests.status/start/advanceStage` state machine; `isNPC` combat exemption; interact dispatch by `npcKind` | same machine; item-hold checks against the bag | same machine; favor-gated service window | same machine; token counting against the bag | same exemption; price math | same exemption; pure state transition in `npcs.ts` |
| **Method** | offer spawns the type's miniboss; kill advances the objective switch; turn-in opens the weapon-or-armor picker (fixed this pass) | holding the fetch item opens the two-wand reward window; only its confirm spends the item; completion dismisses the maker with the farewell | favor/reforge services through the six-option window; blood pickaxe alternative | token count gates the reward; handover removes tokens, grants a random +2 cursed ring (rerolled until uncursed at roll, matching `do/while(!cursed)` + `upgrade(2)`), flees the shop | greet/buy/sell flows | sleeping wake with the real yell; crown exchange only with non-starter armor; one-way (already-Ratmogrify shows the crown-after line) |
| **State** | quest stages + type persisted; turn-in-ready survives picker cancel (quest completes on pick, so re-talk re-offers) | quest stages + type + wand pair persisted | favor + pickaxe state persisted | quest stages + token need persisted; imp flees (removed from scheduler, creatures, and sprites) | shop stock persisted (by the shop system) | `sleeping` flag |
| **Ability / hook** | - | - | reforge combines two items per the favor costs | - | - | - |
| **Presentation** | offer/remind/done/reward lines; picker titled with the reward line | per-type intros (class line first), reminders, reward window, farewell | offer/blood/done lines, service window | offer/remind/done/reward lines with counts | greet line with prices | not-sleeping yell, crown lines |
| **Exceptions** | the pre-fix turn-in granted both items plus an invented +2 max HP (fixed - see below) | reward wands lack Java's +1 (`wand1.upgrade()/wand2.upgrade()` - port wand power has no per-wand level to raise; recorded at the site) | mid-smith-selection saves regenerate the smith set (recorded at the site) | - | - | off-depth-5 walking (to exit/entrance) and distortion-trap summoning are unmodeled - NPCs never take turns at all |

## What this confirms about the target shape

The eleventh matrix's "entry into play" moral has an NPC twin: quest routing is pure
(`npcs.ts` takes callbacks, holds no inventory), and every Java window becomes either the
generic item picker (ghost choice) or a bespoke panel (wandmaker pair, blacksmith six).
The ghost fix is the pattern's payoff: once the turn-in was a picker-shaped hole, the
choose-one rule dropped in with no new UI.

## Actual structural gaps and fixes

One real bug found and fixed in this pass: the Ghost turn-in granted both generated items
plus a flat +2 max HP, where Java's `WndSadGhost` offers weapon OR armor and no HP. The
turn-in now opens the item picker with the pair; the quest completes on pick (cancel
re-offers), and the +2 is gone with the stale comment that called it a stand-in. The
`PORT_COVERAGE.md` row for the ghost reward is updated in the same commit; the wandmaker
+1 and blacksmith mid-save exceptions were already recorded at their sites.
