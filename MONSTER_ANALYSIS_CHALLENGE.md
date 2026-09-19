# Armor-ability analysis: Duelist Challenge and its duel

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the twenty-first analysis matrix and the second for
armor abilities. It covers `Challenge.java` - `activate()`, the nested
`DuelParticipant`, `SpectatorFreeze` and `EliminationMatchTracker`, and the
three talents (tag `v3.3.8`, from the local shattered-pixel-dungeon checkout)
- against `activateChallenge`/`tickDuelParticipant`/`detachDuel` in
`src/scenes/dungeonScene.ts`, the three pure helpers in
`src/simulation/duelistAbilities.ts`, the `challenge` offer/charge entries,
and the three new buff rows.

## The matrix

| Java | Port | Verdict |
| --- | --- | --- |
| `baseChargeUse = 35`, `targeting 'cell'` | MWL row, already authored | ✓ unchanged |
| `chargeUse()`: heroic underneath, `0.84^ELIMINATION_MATCH` while tracker up | `armorChargeUse` `eliminationMatchArmed/Rank` override | ✓ exact, pinned |
| Refusals: `no_target` (null/dead/unseen), `already_dueling`, `ally_target` (non-enemy; neutral mimic allowed) | same, `no_target` through the shared `armorability` parent exactly as `Messages.get` resolves it | ✓ exact (cancelled aim stays silent, feint precedent) |
| `CLOSE_THE_GAP` blink `1 + points`, only when talented and unrooted, over the target-rooted passable map minus occupants, strictly-closer then true-distance tie-break | same over `pathfinder.distanceMap` + `blocked` set, Chebyshev for `distance`, `hypot` for `trueDistance` | ✓ exact |
| `unreachable_target` / `distant_target` (> 5), shake when rooted | same | ✓ exact |
| `delayChar` + `SpectatorFreeze` 10 on every other non-ally, non-NPC char; no freeze at all on boss duels | `spectatorFreeze` 10 with the turn skipped post-tick (delay folded in); boss-target freeze-none kept | ✓ observable; Java's `BOSS_MINION` half is dead code (a boss target always satisfies the `BOSS` half), noted not reproduced |
| `DuelParticipant` 10 on both, target aggros (`beckon` + `aggro`) | same buffs, `sleeping=false`/`seesHero`/`lastSeen` | ✓ exact |
| Pairing: detach when the other is gone, same-aligned, or > 5 away, checked per participant turn | `tickDuelParticipant` on every mob turn post-tick and every hero turn | ✓ exact |
| `addDamage`: hero's `preHP - postHP` per hit into the ledger | pool snapshot at the `absorbHeroDamage` boundary (all 15 hero-HP sites route through it, deferred ticks included) | ✓ exact incl. overkill; fury-to-1 recorded explicitly |
| `detach()`: dying/converted target pays `INVIGORATING_VICTORY` from the hero's ledger; living hero's own end arms `ELIMINATION_MATCH` 3; all freezes + participants cleared | `detachDuel` on kill, pairing break, and silent 10-turn expiry (ledger marker doubles as the pending-cascade flag) | ✓ exact |
| `INVIGORATING_VICTORY`: `round(taken*(1-0.707^points)) + 5*points`, capped at missing HP | `invigoratingVictoryHeal()`, pinned | ✓ exact |
| `isInvulnerable` freezes damage via `Char.damage()` negation | zeroed in `attack()` and at the mob DoT tick (roll still spent) | attack + DoTs exact; bomb/trap/blast seams residual |
| Invis dispelled, charge spent, `hero.next()` (one turn), tracker detached | same via `spendHeroAction(1)` | ✓ exact |

## What this confirms about the target shape

The twentieth matrix's moral (everything the behavior needs already exists)
held a third time: the MWL row, the talents, all six refusal strings, the
aim-cell flow, the freeze gate shape (paralysis precedent), the DoT-zeroing
shape (soiled-fist precedent), the zero-damage shape (charm precedent), the
aggro triple (beckon precedent), the per-turn re-check (hawk precedent) and
the damage ledger's choke point (`absorbHeroDamage`, all fifteen sites)
were all already in the tree. The genuinely new code is the pairing logic
itself, which is small because Java's is: find the other participant, check
side and distance, detach.

## Residuals, recorded not fixed

Bomb/trap/blast seams do not negate on frozen spectators (attack + DoTs do);
the `SpectatorFreeze` buff-lock (no new buffs while frozen) is not modeled;
frozen-sprite darkening is not rendered; hero `rooted()` is the `roots` buff
only. None needs a new subsystem except a unified damage choke, which the
fifteen hero sites argue against louder than the duel argues for.

## Verification

- `npx tsc --noEmit`: clean.
- `npm run test:simulation`: green (120 checks, was 119), including the new
  Challenge charge/talent block and the updated duelist offer list.
- Full `npm run build` + remaining suites before commit per `AGENTS.md`.
- Browser verification owed per ROADMAP.md section 10 (no browser tool
  available this session).
