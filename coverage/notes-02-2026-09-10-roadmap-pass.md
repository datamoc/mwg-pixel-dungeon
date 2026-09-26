# Port coverage notes: 2026-09-10 roadmap pass

Historical audit narrative (closed). Row tables live in `rows-*.md`. Closed points only: every row here is Ported, Simplified (with its stated reduction) or a Divergence (deliberate). Open work lives in `ROADMAP.md` and `BACKLOG.md`; a row that still carries a residual points to its `ROADMAP.md` R-number. New rows go into the file whose area matches, appended at the end; do not add them to `PORT_COVERAGE.md`.

## 2026-09-10 roadmap pass

- **Ported:** the Dwarf King's death now awards the identified, non-upgradable King's Crown;
  the Rat King consumes it when a real armor is worn and grants the Ratmogrify armor ability.
  Ratmogrify affects the nearest visible non-boss enemy for six turns and preserves its combat
  stats while routing it through ordinary melee/pathing. The port has no `TransmogRat` actor or
  cell-targeting window, so the original mob sprite remains and those two presentation/targeting
  details are documented reductions at the call sites in `main.ts`. (The whole flow
  moved to `useRatmogrifyFlow` in `src/simulation/ratmogrify.ts` on 2026-09-20 as the
  file-size refactor's thirty-second extraction, behavior-identical - zero runtime
  imports there per the simulation confinement rule, so geometry is inline, message
  keys stay keys for the scene to translate, and charge/shuffle/spawn/buff arrive as
  callbacks; the scene keeps the one-line adapter plus a builder.)
