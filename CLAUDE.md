# Working in mwg-pixel-dungeon

This is a genuine, block-by-block, honestly-documented TypeScript port of Shattered Pixel
Dungeon (SPD, GPL-3.0-or-later) built on top of the `mwg` game framework, consumed as the
published npm package `@datamoc/mw_games` (see the "`mwg` dependency" section below).
Treat these as durable project rules, not one-off notes. This project was split out of an
in-progress port that lived at `web-mwg/` inside a `shattered-pixel-dungeon` checkout;
history before the split lives there, not here.

## Licensing boundary — do not blur this

- `mwg`/`@datamoc/mw_games` is a separate, generic, MPL-2.0 project maintained by the user
  outside this repo. **No SPD code, data, or assets may ever enter it.** If it needs a new
  generic capability to support this port, that capability must stay game-agnostic there —
  the SPD-specific numbers/art/logic stay in this repo, and any such change happens in the
  framework's own repo, not here.
- This port is GPL-3.0-or-later, matching SPD. It legitimately reuses:
  - SPD's real Java source *values and formulas*, translated into TypeScript (never copied
    verbatim as Java text) — cite the source file/method in a comment.
  - SPD's real art assets, copied byte-for-byte into `src/assets/` (see `src/images.ts`'s
    header comment for provenance notes, e.g. `cleric.png` sourced from tag `v3.3.8`).

## Upstream contributions — not part of this project's workflow

Evan Debenham keeps Shattered Pixel Dungeon as a solo project and does not take code
contributions from other developers, including small fixes suggested by email - he
confirmed this directly, 2026-09-06/07, and explained that accepting and implementing an
external suggestion could raise copyright-ownership questions under GPLv3 that he'd rather
avoid. That's a reasonable, well-explained policy for a solo maintainer, and this project
respects it: don't propose sending fixes back to his tree, in any form or scope.

- `UPSTREAM_CANDIDATES.md` and the "make the fix in both places" workflow it implied are
  retired accordingly. Any real Java source edit that used to go there is unnecessary work
  now — fix only this port's own file.
- This project's home is this dedicated repo, `mwg-pixel-dungeon`, split out from the
  in-progress port that used to live at `web-mwg/` inside a `shattered-pixel-dungeon`
  checkout. That original location remains the working copy for its own history.
- The licensing boundary two sections up is unaffected by this: SPD is still GPL-3.0, this
  port is still GPL-3.0-or-later, and reading Java source for values/formulas/assets is
  still the normal, legitimate way this port is built. What doesn't apply here is only the
  idea of sending fixes back to his tree.

## Port-side corrections

The original SPD source is a reference for values, formulas, behavior, and translations; it is
not a contribution target. When an audit finds a bug or inconsistency in the original behavior,
this port corrects its own implementation and documents the correction in `PORT_COVERAGE.md`.
No patch, proposal, or “fix it in both places” workflow is sent to the SPD author.

## Documenting deviations — mandatory, not optional

Every simplification or deviation from real Java behavior must be explicitly documented in
**both**:
1. A code comment at the point of deviation in `main.ts` (or the relevant file), explaining
   *what* the real Java does and *why* this port differs.
2. A row in `PORT_COVERAGE.md`, added/updated **in the same commit** as the code change —
   "Ported" (reproduces the real numbers/logic), "Simplified" (reproduces the shape with a
   stated reduction), or "Not ported" (SPD has it, this port doesn't, at all).

Never silently drop a piece of real behavior without a corresponding "Not ported" line.

## Documentation work counts as real roadmap progress

Correcting, sharpening, or filling in this project's own documentation (`ROADMAP.md`,
`PORT_COVERAGE.md`, code comments) is a legitimate item of work in its own right, not just
overhead alongside "real" code changes. Concretely:

- Finding and fixing a **wrong claim already recorded** (a `PORT_COVERAGE.md`/`ROADMAP.md` row
  that calls something "invented" or "not ported" when it turns out to be real, or vice versa)
  is exactly as valuable as fixing a code bug, since a wrong claim actively misleads whoever
  reads it next into skipping real work or attempting fake work. This has happened for real in
  this project: an earlier audit pass checked only two Java tags and wrongly declared several
  real talents (`test_subject`/`tested_hypothesis`) invented substitutes with no Java basis,
  when `src/generated/spdMessages.ts`'s own real English text (built from a more complete SPD
  source than those two tags covered) showed they were genuine, named talents the port's code
  already matched almost exactly. Recheck a documented claim against every source actually
  available in this repo (not just the tag(s) an earlier pass happened to check) before
  trusting it forward.
- A malformed `ROADMAP.md` checkbox (a missing `- [x]`/`- [ ]` marker, wrong indentation) is a
  real bug: `tools/roadmap-progress.html` silently drops anything that doesn't match its
  parser, which means the item stops counting toward progress at all - fixing the marker is a
  genuine, closeable fix, not busywork.
- Rewriting a stale strategy note (e.g. a section of `ROADMAP.md` that recommended a worse
  approach than one later discovered) is worth doing the moment the better approach is known,
  not deferred until whoever eventually executes that item happens to rediscover it themselves.

None of this replaces the dual-documentation rule above - a documentation fix is not a
substitute for the code fix it may also reveal is needed - but it is not lesser work either.

## Verification before reporting done

Before calling any non-trivial change complete:
1. `npx tsc --noEmit` — must be clean.
2. `npm run build` — must be clean (`tsc --noEmit && vite build && node tools/emit.mjs`).
3. Visually verify in a browser — type-checking and a successful build are not evidence the
   feature actually looks/behaves right in-game.

## Browser verification workflow

`file://` can't run ES modules or fetch, so:
1. `npm run build`, then serve `dist/` locally, e.g. `python -m http.server <port>` from
   `dist/`. **Port pitfall**: Windows reserves dynamic-port-exclusion ranges that silently
   refuse any bind attempt with `WinError 10013`/`EACCES` — this cost a whole session before
   being root-caused. Anything in the 8869-9068ish range (and others; check first) fails no
   matter the tool (Python, Node, PowerShell) or whether the sandbox is disabled — it looks
   exactly like a sandbox restriction but isn't one. Run
   `netsh interface ipv4 show excludedportrange protocol=tcp` once and pick a port outside
   every listed range (8000 has been reliable) before concluding local serving is broken.
2. If `claude-in-chrome` isn't connected (extension not paired to this session), the
   `chrome-devtools-mcp` plugin works as a CDP-direct fallback — `new_page`/`navigate_page`
   don't depend on the extension bridge at all. Try it before giving up on browser
   verification for the session.
3. Navigate to `http://localhost:<port>/`.
4. The title screen and class-select buttons need a real pointer event to advance past.
   With `claude-in-chrome`, dispatch a `PointerEvent` via `javascript_tool` rather than
   relying on `computer` clicks there (once in-game, `computer` clicks work fine, using
   coordinates read from screenshot pixel space). With `chrome-devtools-mcp`'s
   `evaluate_script`, dispatch `pointermove`/`pointerdown`/`pointerup`/`click` `PointerEvent`s
   directly on `document.querySelector('canvas')` at the button's fractional position within
   `canvas.getBoundingClientRect()` (read the fraction from a screenshot first) — a bare
   `click` alone does not reliably register with Pixi's event system, the full pointer
   sequence does.
5. `window.__MWG__.currentScene` gives bracket-notation access to private scene state *and
   methods* for fast test setup/inspection — not just fields like `scene['level']`/
   `scene['stairs']` for teleporting the hero or jumping depths, but calling private methods
   directly (e.g. `scene['generatedInventoryItem'](fakeGenItem)`,
   `scene['equipWeapon'](id, instanceId)`) to exercise and statistically verify game logic
   (roll distributions, gating) without manually playing to the exact state that triggers it.
6. Screenshot and zoom to visually confirm the actual pixels, not just absence of errors.
7. Clean up afterward: close the browser tabs, and stop the test HTTP server via its PID
   (`Get-NetTCPConnection -LocalPort <port> | Select-Object -ExpandProperty OwningProcess`
   then `Stop-Process -Id <pid> -Force`).

## `index.html`'s "not-built" guard

Both the source page and the built `dist/index.html` load from `file://`, so the guard that
warns "this is the unbuilt source page" can't key off `location.protocol` alone — it must
also check `document.querySelector('script[type="module"]')`, since `tools/emit.mjs` strips
`type="module"` from the entry tag on build. Getting this wrong either breaks the built game
(false positive) or leaves the source page silently black-screening (false negative) — verify
both cases (`dist/index.html` loads, unbuilt `index.html` shows the message) after touching
this script.

## `mwg` dependency

`mwg` is the real published npm package `@datamoc/mw_games`, aliased to the `mwg` import
specifier in `package.json` (`"mwg": "npm:@datamoc/mw_games@^0.4.0"`) since every source
file imports it as `from 'mwg'`. This project consumes it like any other npm dependency now
— no local checkout, no `file:` link, no per-session drift check. Bump the version pin
deliberately (and re-run the full verification suite in this `CLAUDE.md`) when picking up a
new `mwg` release; don't silently `npm update` it as a side effect of an unrelated change.
The framework's own source (for reading its implementation, not for depending on it) lives
in a separate checkout the user maintains locally; ask if you need to see it rather than
assuming a fixed relative path to it, since this project doesn't sit next to it on disk.

## Use the available plugins and skills

**Every plugin, skill or MCP server relevant to the task at hand shall be used.** These are
installed deliberately; reaching for them is the default, not an optional flourish, and
skipping one to "just do it by hand" has already cost this project real time. In particular:

- **`context7`** for the documentation of anything this port depends on — PixiJS 8, rot.js,
  Vite, TypeScript. Use it *before* reasoning from memory about their APIs, even when the
  answer feels obvious. A whole session was lost to a black screen whose cause was Pixi 8
  refusing a custom render pipe that had not been registered before the renderer was created
  (see `PORT_COVERAGE.md`, "Browser verification"); the current docs describe that contract
  plainly, and the training-data guess did not.
- **`claude-in-chrome`** for the browser verification below. When it is unavailable, say so
  and treat the check as *not done* — never as passed by inference.
- **`code-review` / `simplify`** on a non-trivial diff before committing, and the
  `pr-review-toolkit` agents (`silent-failure-hunter`, `comment-analyzer`,
  `type-design-analyzer`) where the diff's shape matches what they hunt for. This codebase
  makes strong factual claims in its comments and in `PORT_COVERAGE.md`, so the
  comment-accuracy and silent-failure passes are worth more here than in an average repo.
- **`run`** to launch the built game rather than re-deriving the serve/open dance.

Prefer a skill's own workflow over improvising an equivalent one. If a relevant plugin is
installed but genuinely inapplicable, that is fine — but the judgement should be explicit,
not an omission by default.

## Reference material

- Real Java source not present in this checkout's history is fetched with
  `git -C <path-to-SPD-checkout> show refs/tags/<tag>:<path>` (e.g. `4.0.0-beta`,
  `v3.3.8`) — used to confirm exact values/behavior or pull period-accurate assets rather
  than guessing.
- When comparing against a real screenshot of the live game, check both the visual (tiles,
  sprites, layout) *and* the actual Java generator/logic source before concluding something
  is a bug versus an intentionally-undocumented gap — then record any newly-found gap in
  `PORT_COVERAGE.md` even if not yet implemented.
