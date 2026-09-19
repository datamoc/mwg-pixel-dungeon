# Armor-ability analysis: Rogue ShadowClone and its ShadowAlly

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the twentieth analysis matrix and the first for
armor abilities. It covers `ShadowClone.java` and its nested `ShadowAlly`
(tag `v3.3.8`, from the local shattered-pixel-dungeon checkout) against
`activateShadowClone`/`spawnShadowClone`/`syncShadowClone` in
`src/scenes/dungeonScene.ts`, `src/simulation/rogueAbilities.ts`, and the
`shadowclone` offer/charge/targeting entries.

## The matrix

| Java | Port | Verdict |
| --- | --- | --- |
| `baseChargeUse = 35` | MWL row `charge: 35` | ✓ unchanged (row already authored) |
| `targetingPrompt()` null with no ally (summon fires immediately), prompt with one (direct) | `targeting: 'clone'` + `needsCell` only when `shadowClone()` exists | ✓ mirrors the hawk's `needsCell` pattern |
| `chargeUse()` 0 while an ally exists | `armorChargeUse` `cloneSummoned` override, absolute zero like the hawk | ✓ pinned in the suite |
| Summon onto random free `NEIGHBOURS8` (`findChar == null`, `passable`), `no_space` via `SpiritHawk`'s key, charge spent, `Invisibility.dispel()`, `spendAndNext(TICK)` | same cells, same key, `armorCharge -= cost`, dispel, `spendHeroAction(1)` | ✓ exact |
| Second activation with no target returns silently; with target, `ally.directTocell(target)` | `cell` null returns false; else shared `directAlly` defend/follow/attack with the `shadowally.direct_*` lines | ✓ same shape, existing order system |
| `HP = HT = 80`, `hpBonus = 15 + 5*heroLevel`, `+ round(0.1 * PERFECT_COPY * hpBonus)` when positive | `shadowCloneHp()` | ✓ exact, pinned |
| `defenseSkill = heroLevel + 4`, `attackSkill = defenseSkill + 5` | `accuracy heroLevel + 9`, `evasion heroLevel + 4` | ✓ exact (scales verified identical: port base 10/5 is Java's 10/5) |
| `damageRoll()`: `NormalIntRange(10, 20)` + `round(0.08 * SHADOW_BLADE * heroDamageRoll / attackDelay)` when positive | `shadowCloneBladeShare()` over the `10-20` base, hero range mean for the live roll, attack-cost rate for `attackDelay()` | shape exact; live-roll-to-mean stated |
| `drRoll()`: `super.drRoll()` + `round(0.12 * CLONED_ARMOR * heroDrRoll)` when positive | `shadowCloneArmorShare()` over `[0, 0]`, hero armor mean | shape exact; live-roll-to-mean stated |
| `attackProc`: `Int(4) < SHADOW_BLADE` runs the hero weapon's proc | — | residual (no non-hero gear-proc path) |
| `defenseProc` / `glyphLevel`: `Int(4) < CLONED_ARMOR` runs the hero armor's proc / shares its glyph | — | residual (same missing path) |
| `speed() x2` while WANDERING back to the hero | 1 cell/turn like every ally | residual |
| `canInteract`: `PERFECT_COPY` extends the interact range | — | residual (no char-interaction system) |
| `INORGANIC`, immune to `AllyBuff` | rat-carrier defaults | residual (mirror-image precedent) |
| `ShadowSprite` art | hero class sheet darkened (`tint 0x555566`) | art approximation, stated |

## What this confirms about the target shape

The nineteenth matrix's moral (the MWL table is only as honest as its last
read-back) held in reverse: the `shadowclone` MWL row - charge, targeting,
talents - was already exactly right, and the `shadowally.direct_*` strings
were already in the catalog. The only thing missing was the behavior, and
every system it needed already existed: the ally carrier + `allyKind`
pattern (mirror), the per-turn stat re-read (hawk), the defend/follow/attack
orders (`directAlly`, third consumer after ghost and hawk), the aim-once
targeting union (`'clone'`), and the flat-zero reorder charge override.
What made the earlier "needs an ally actor" triage stale is that all of
those landed after it was written - the same staleness pattern the last
three matrices each found somewhere.

## Residuals, recorded not fixed

Gear procs (`attackProc`/`defenseProc`/`glyphLevel`), the double-speed
return, the `PERFECT_COPY` interact range, `INORGANIC`/`AllyBuff` immunity,
and the `ShadowSprite` art. None needs a new subsystem except the first:
routing a non-hero attack through the hero's weapon enchant (or a defense
through the hero's armor glyph) has no call path, and inventing one for a
`1/4`-gated share would be a bigger change than the share itself.

## Verification

- `npx tsc --noEmit`: clean (one new error caught and fixed on the way: the
  `allyKind` union needed `floorState.ts`'s `SavedCreature` too, not just
  `combat.ts` and the `spawnMonster` parameter).
- `npm run test:simulation`: green (119 checks, was 118), including the new
  ShadowClone charge/stats block and the updated rogue offer list.
- Full `npm run build` + remaining suites before commit per `AGENTS.md`.
- Browser verification owed per ROADMAP.md section 10 (no browser tool
  available this session).
