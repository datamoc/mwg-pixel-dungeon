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

An Internationalisation/`messages/Messages.java`/i18n row goes in `PORT_COVERAGE_I18N.md`
instead, split out 2026-09-21 once `PORT_COVERAGE.md` passed ~530KB - see that file's own
header. Every other row still goes in `PORT_COVERAGE.md`.

## Fidelity policy: iso is no longer the goal

Settled 2026-09-11. Matching Java behaviour exactly is **not** an objective in itself any more,
because Shattered Pixel Dungeon does not take outside fixes (see "Upstream contributions" above):
there is nothing left to keep in step with, so a Java bug faithfully reproduced here is just a bug
of ours with a citation.

- **Do not reproduce Java's bugs or limitations.** Where Java's own behaviour is incoherent (one
  fire burns grass and another does not, an object that survives a fire it should not), this port
  does the better thing and says so. `tools/scratch/FLAMABLE-INVENTORY.md` lists the fire cases
  found so far, with the Java sources, and flags the ones to diverge on.
- **What stays mandatory**: the documentation of every divergence, in both places as above (a code
  comment naming what Java does, and a `PORT_COVERAGE.md` row). The row's category is now one of
  "Ported", "Simplified", "Not ported", or **"Divergence (deliberate)"** - the last carrying
  both why we differ and what Java does instead.
- **What stays unchanged**: values, formulas and assets still come from the real Java source (the
  licensing rule), and every claim in this repo's comments and docs still has to be checkable
  against it. What changes is behaviour, not provenance.


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
   A ready-made diagnostic built this way, worth reusing rather than re-deriving: dumping each
   creature's logical grid position against its actual rendered sprite position, which is how
   the `moveTo` sprite-desync bug (`PORT_COVERAGE.md`, 2026-09-18) was confirmed from a live
   player report before any code was read:
   ```js
   (() => {
     const s = window.__MWG__.currentScene;
     const TILE = 16;
     return s['creatures'].map(c => {
       const sprite = s['spriteFor'].get(c.id);
       return {
         kind: c.kind,
         hp: c.hp,
         logicalX: c.x, logicalY: c.y,
         spriteTileX: sprite ? sprite.x / TILE : null,
         spriteTileY: sprite ? sprite.y / TILE : null,
         spriteVisible: sprite ? sprite.visible : null,
       };
     });
   })()
   ```
   A mismatch between `logicalX/Y` and `spriteTileX/Y` for a creature that should be visible
   means the render layer has drifted from the game-logic layer - check `moveTo`'s early-return
   branches first, since that is exactly what was wrong here.
6. Screenshot and zoom to visually confirm the actual pixels, not just absence of errors.
7. Clean up afterward: close the browser tabs, and stop the test HTTP server via its PID
   (`Get-NetTCPConnection -LocalPort <port> | Select-Object -ExpandProperty OwningProcess`
   then `Stop-Process -Id <pid> -Force`).

## Releases

Release artifacts are built **only** on a `v*` tag (`.github/workflows/release.yml`); an ordinary
push to `main` still just deploys the web build to Pages. `RELEASING.md` is the full account of what
each artifact is and what each target needs. Two things to know before touching it:

- Every byte of compression comes from `mwg`'s own tooling (`tools/pack-web.mjs` drives
  `mwg/tools/single-file` and `mwg/tools/compress-dist`) and every archive from the runner's native
  archiver. Do not add a compressor or a zip/tar writer to this repo.
- The Android and Windows desktop targets are this repo's own scaffolding
  (`capacitor.config.json`, `desktop/MwgDesktopHost`), because `mwg`'s *published package* ships
  none of the Capacitor/WebView2 packaging support its README describes — its own `cap:*` and
  `desktop:*` scripts point into its repository. The framework-side gap is recorded as P18 in
  `4MWG/IMPROVEMENT_PROPOSALS.md` (local, uncommitted notes).

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
specifier in `package.json` (`"mwg": "npm:@datamoc/mw_games@^0.14.0"`) since every source
file imports it as `from 'mwg'`. This project consumes it like any other npm dependency now
— no local checkout, no `file:` link, no per-session drift check. Bump the version pin
deliberately (and re-run the full verification suite in this `CLAUDE.md`) when picking up a
new `mwg` release; don't silently `npm update` it as a side effect of an unrelated change.
**Check for a new release once an hour while porting** with `npm run mwg:check`
(`tools/check-mwg-version.mjs`), which reports the pin, what is installed, and npm's latest, and
adds the local checkout's version when one is passed with `--checkout <path>`; `--fail-on-update`
makes it exit 1 so a scheduler can act on it. It stays out of `check`/`build`/the suites on
purpose: those must keep working offline, and this one is the only thing that needs the network.
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

## Concurrent agent sessions

More than one Claude Code session sometimes works this repo at the same time (the user running
several terminals/instances toward the same broad goal). `ListAgents` names any reachable peer
session, but a session that has already finished won't show up there even though it left work
behind — so before starting broad, structural, or file-budget-adjacent work, check both
`ListAgents` and `git status`/recent commits for signs of concurrent changes, and re-run
`npm run verify` after any that appear to confirm they still hold together with yours.

`agents_talking.md` at the repo root (created 2026-09-21) is a scratch coordination log for this:
append a dated entry naming your session, what you're touching, and status before starting broad
work, and check it first if a peer session isn't reachable via direct messaging. It is not part of
the port itself — fold anything worth keeping into `ROADMAP.md`/`PORT_COVERAGE.md` and delete it
once no session needs it, rather than letting it accumulate as permanent project history.

A faster channel also exists for this: the **coord** coordination server, whose plugin lives at
`C:/Users/miche/dev/coord/plugins/coord` (client: `node
C:/Users/miche/dev/coord/plugins/coord/client/cli.js`, or `coord` when it is on
PATH; Node >= 20, nothing to install). It gives concurrent sessions - Claude Code, Codex and others -
a shared mailbox, file/directory claims, task offers, discussions, documents and a presence roster in
near real time, layered on top of (not instead of) `agents_talking.md`. Its own `coord` skill
(`plugins/coord/skills/coord/SKILL.md`) is the full reference; in Claude Code the `/coord:join`,
`/coord:poll`, `/coord:post`, `/coord:claim`, `/coord:release` and `/coord:status` commands wrap it.
Use it whenever more than one session might be live, before a large or file-budget-adjacent change:

- **Join once per conversation**: `coord --json whoami <family>` (`claude`, `codex`, ...), keep the
  returned `name` and `session_id`, and prefix every later command with
  `COORD_SESSION=<session_id>`. Do not re-run `whoami` to "check in" - it registers a *second* name
  (`coord end` that one if it happens). `.coord-session` in the checkout is shared by every session,
  so never rely on it. Then `heartbeat "<status>"`, `context`, `locks`.
- **Before editing a shared file**: `coord locks`, then `coord claim <path>` (`<dir>/` for a tree,
  `--note "why"`); on a conflict, do not edit - `coord ask --claim <C..> --to <session> "..."`.
  `coord check <files>` before committing, `coord release --all` when done, then `coord end`.
- **Delegating**: `coord task create "..." --assign <session>` is an offer the assignee answers with
  `task accept`/`decline`/`done`; offers to you show up in `poll`/`context` - answer them.
- **Idle**: `coord poll` about every five minutes.
- **Reading messages**: `#29 [2026-09-23T20:53:12+00:00] claude-02 -> codex-02 done [C12]: ...` is
  the message number, UTC time, sender (`-> <session>` only for a direct message), kind, the claim
  it is about if any, then the body. `coord inbox --to-me --unresolved` lists what still waits for
  you; `coord thread 29` shows a conversation; answer with `coord reply 29 "..."`, and close a
  handled question or request with `coord resolve 29 "note"`.
- **Staying alive**: `poll` or `heartbeat` at least every 30 minutes, or the session dies and its
  claims lapse (`dead_session`: `whoami` again, you get a new name). A claim lasts 2 hours;
  `coord renew C12` for longer work.
- **Longer than a post**: `coord doc create` for analyses and plans; `coord discuss` /
  `propose` / `react` when several sessions must agree (consensus is computed, never declared).
- **Other agent CLIs** use the same skill: Codex `$coord join` (no slash commands); Gemini, Qwen and
  Muse `/coord:join` ...; opencode and Kilo `/coord-join` ...; Crush the skill only. Join with your
  own CLI as the family (`whoami opencode`, `whoami gemini`), so names say who is who.
- **When coord fails** (`unreachable`, `unauthenticated`, `permission denied`...): tell the user and
  fall back to `agents_talking.md`. Never start or fix the server, certificates, `pki/` or
  `~/.config/coord/` yourself - they belong to the user.

**Retired:** the earlier ACP server (`python ACP_client.py`, `tools/ACP_client.py`, its `acp-client`
skill and `/acp:*` commands) is superseded by coord - do not use it, and ignore older mailbox
references (`ACP #862` etc.) in this repo's history as anything but history.

### Compact message protocol (agreed 2026-09-22 on ACP #862/#864, ACK codex-01 #867; trimmed for coord 2026-09-23)

Keeps posts short and unambiguous.

1. **Status is the message kind, not a tag.** coord shows the sender and `--kind` on every message
   (`#11 [...] claude-01 done: ...`), so don't start the body with a letter tag (`T`/`D`/`B`/...,
   from the ACP days). `--kind done` for a landed commit, `question`, `warning` for a collision or
   blocker, `proposal` for a handoff (or `coord task create`), `review` for a verification/ack,
   `info` otherwise. Claims and releases need no post: `coord locks` shows them.
2. **Under 300 characters** - the client warns past that; use `coord doc create` for anything longer.
3. **Short nouns**: `PC` = `PORT_COVERAGE.md`, `PCI` = `PORT_COVERAGE_I18N.md`, `RM` =
   `ROADMAP.md`, `J` = Java tag `v3.3.8` (`J4b` = `4.0.0-beta`), `MWL` = authored content; paths
   drop `src/` and `.ts` (`scenes/dungeon/combatResolution`).
4. **Verification in one token string**: `ok:tsc,sim286,items,i18n,bud,aud,build,LV` (`LV` =
   live-verified in a browser, `NLV` = not yet); a failing gate as `x:sim(verifyArmorAbilities:194)`.
5. **Always cite** `#N` for messages, `@sha` for commits, `file:line` for code; don't restate
   context the thread already carries.
6. **Shell safety**: never put backticks or `$()` in a post - bash substitutes them before the
   client sees the text. Use plain quotes.
7. **Shared worktree and index**: commit only your own hunks through a private index
   (`GIT_INDEX_FILE=<tmp> git read-tree HEAD`, `git hash-object -w` + `git update-index
   --cacheinfo` for your blobs, `git commit-tree`, then `git update-ref HEAD <new> <old>` so a
   concurrent commit makes yours fail instead of clobbering it). Never `git add` a whole shared
   file and never rewrite another agent's staged entries. Afterwards check `git show --stat <new>`
   and `git diff HEAD -- <your files>`: filtering hunks by pattern silently dropped part of a
   change once (`495c09f`, fixed in `b6a7a6a`), and taking a whole working-tree file can carry
   a peer's unstaged edit.

Example: `coord post --kind done "DivineIntervention @495c09f ok:tsc,sim286,i18n,bud,aud,LV. PC row + RM."`

## Reference material

- Real Java source not present in this checkout's history is fetched with
  `git -C <path-to-SPD-checkout> show refs/tags/<tag>:<path>` (e.g. `4.0.0-beta`,
  `v3.3.8`) — used to confirm exact values/behavior or pull period-accurate assets rather
  than guessing.
- **Which tags are real (2026-09-24).** The SPD checkout's `4.0.0-beta` tag was, until
  2026-09-24, a local alias of `v3.3.8`'s commit (`7b8b845`): every lookup "at `4.0.0-beta`"
  (`J4b`) before then actually read `v3.3.8`. Upstream never tagged its betas; the checkout now
  carries `v4.0.0` (fetched) plus local tags on upstream's own version-bump commits -
  `4.0.0-ALPHA-1..3`, `4.0.0-BETA-1..4`, `4.0.0-RC-1` - and `4.0.0-beta` = `4.0.0-BETA-4`
  (`b81422080`). Between `v3.3.8` and it, 290 Java files changed (new enchantments/curses,
  `RingOfHaste` 1.175 -> 1.15, the `WEP_T3` deck fix, ...). This port's target stays `v3.3.8`:
  cite `v3.3.8` for what the port does, and `4.0.0-beta`/`v4.0.0` only for a real 4.0 difference.
- If the local `v3.3.8` and `4.0.0-beta` refs appear to omit a feature or behavior being
  closed in this port, do not treat that as evidence that SPD lacks it or silently close the
  gap. Verify the refs and search relevant source/history, then consult an authoritative SPD
  source for the appropriate version and establish provenance. If its behavior still cannot
  be established, leave the gap explicitly documented as "Not ported" or otherwise label
  authored behavior; never invent provenance or silently claim completion.
- When comparing against a real screenshot of the live game, check both the visual (tiles,
  sprites, layout) *and* the actual Java generator/logic source before concluding something
  is a bug versus an intentionally-undocumented gap — then record any newly-found gap in
  `PORT_COVERAGE.md` even if not yet implemented.
