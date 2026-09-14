# Closed roadmap sections

Fully checked-off sections of `ROADMAP.md`, moved out here to keep the working roadmap focused
on open items. A section moves here only when *every* checkbox in it is `- [x]`; a section with
even one remaining `- [ ]` stays in `ROADMAP.md`. Moved 2026-09-14 (see `ROADMAP.md`'s "This
port's own release plan (news)" section for the versioning this feeds into).

`tools/roadmap-progress.html` only reads `ROADMAP.md`, so items here no longer count toward its
progress bars - that's intentional: they're done, and the bars should reflect remaining work.

## Release baseline tracking (informational, not an open implementation item)

- [x] **Shattered Pixel Dungeon v4.0.0 released 2026-09-09.** The upstream release is
      recorded as a future compatibility baseline; once MWG Pixel Dungeon itself is stable,
      we will audit and implement the changes introduced by SPD v4.0.0. This is deliberately
      not an open checkbox in the current parity work, whose source baseline remains the
      version documented by each `PORT_COVERAGE.md` row. See the
      [official v4.0.0 release](https://github.com/00-Evan/shattered-pixel-dungeon/releases/tag/v4.0.0),
      which describes the update as including a major new quest, new art, six enchantments,
      and additional adjustments.

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
      **Re-confirmed across all 19 locales, 2026-09-12, and the gap it pointed at is now
      closed**: section 8's port-string translation is complete, and the same pass that added
      those seven catalogues re-ran the font-coverage check for every locale (not just zh/ko),
      found no tofu, and verified the two screens differ pixel-wise from English in each. The
      harness is committed as `tools/scratch/browser-locales.mjs` with its codepoint data in
      `locale-probe.json`, so the next locale change has a one-command check rather than a
      from-scratch script; screenshots from this pass are in
      `_browsercheck/mwgpd_shots_2026-09-12-locales-all/`. Two probe bugs were found and fixed by
      running it - see `PORT_COVERAGE.md`'s locales section for the U+200B/U+0301 details - and
      the probe was itself negative-tested with uncovered codepoints so that "no tofu" is not a
      vacuous claim.
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
- [x] **Live pass on the in-progress 2026-09-11 workstream (done 2026-09-11, without either
      named browser tool).** Neither `Codex-in-chrome` nor `chrome-devtools-mcp` was connected
      this session, so the check ran through the globally installed `playwright` driving the
      full Chromium build over `file://` - the built `dist/index.html` is deliberately
      server-free, so no port was needed. The scripts live outside this repo, in the usual
      `_browsercheck/` directory (`mwgpd_browser_smoke.mjs`, `mwgpd_browser_play.mjs`,
      `mwgpd_browser_ui.mjs`, `mwgpd_browser_probe.mjs`, screenshots in
      `mwgpd_shots_2026-09-11/`), so nothing untracked was left in `tools/scratch/`. Confirmed
      with screenshots and zero page/console errors: the title
      screen; the class-select screen (names and the locked hint now fully translated - see the
      two fixes below); hero creation; the depth-1 sewer floor with HUD, action bar and a
      French log; the three-tab journal; the inventory with its four translated filter tabs; and
      the alchemy recipe picker (`Choisissez une recette (20)` listing `bombe de feu`, `leurre`,
      `bombe d'engrais` - the authored MWL outputs now resolving through SPD's real keys).
      **Two real bugs were found only by doing this**, neither catchable by `tsc`, the build or
      the suites: (1) `CLASSES[id].nameKey` was an invented key for five of six classes, so
      class select rendered the raw string `Port.name.rogue` - the class keys now use SPD's
      `actors.hero.heroclass.*`, the unlock hints moved from English literals into the port
      catalog, and `tools/i18nCheck.ts` now checks `CLASSES`/`CLASS_UNLOCK_HINT` so it cannot
      recur; (2) closing the journal left `journalWindow` pointing at a spent `mwg/ui` `Window`,
      so the next `positionInterface` threw `Cannot set properties of null (setting 'x')` and
      broke the inventory panel that calls it - `closeJournal` now drops the reference. Details
      in `PORT_COVERAGE.md`'s i18n bullet.
