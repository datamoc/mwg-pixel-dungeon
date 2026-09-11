# Proposed `mwg` patches — floating text, particles, and `Bar`

The *remainder*: everything else this port asked the framework for already ships (see the
framework roadmap items at the end).

- `0001-floating-text-stack-and-particle-frames.patch` — applies to `MW_games` at `a5602af`
  (`0.7.3`), verified with `git apply --check --cached`. Touches
  `src/two-d/ui/FloatingText.ts`, `src/two-d/ui/FloatingTextStack.ts` (new),
  `src/two-d/ui/index.ts`, `src/two-d/render/Particles.ts`, `tests/floating-text.test.ts` (new),
  `tests/particles.test.ts`, `CHANGELOG.md` — no SPD values anywhere in it. Applied in the checkout
  as of this writing, and folded into its `0.7.4` changelog.
- `0002-bar-runtime-colour-and-track.patch` — `Bar.ts` and its tests only; independent of 0001
  except that its `CHANGELOG.md` hunk sits after 0001's entry, so apply 0001 first. Verified the
  same way, with `node --test tests/bar.test.ts` at 19/19 (14 pre-existing, 5 new).

```sh
cd <MW_games>
git apply --check /path/to/0001-floating-text-stack-and-particle-frames.patch
git apply       /path/to/0001-floating-text-stack-and-particle-frames.patch
git apply --check /path/to/0002-bar-runtime-colour-and-track.patch
git apply       /path/to/0002-bar-runtime-colour-and-track.patch
npm run check                       # tsc --noEmit, clean
node --test tests/particles.test.ts tests/floating-text.test.ts tests/bar.test.ts  # 43 pass
npm test                            # 1491 pass - see "generated docs" below
npx prettier --check <the nine files>
```

## What they add, and why each piece is missing today

- **`Bar.setColor` + `BarOptions.background`** (patch 0002) — the port's `src/ui/bar.ts` keeps
  itself alive for two things the framework's `Bar` cannot do: recolour the fill after construction
  (the boss health bar goes red while the boss bleeds) and colour the track (the HP bar's
  missing-health strip is black, not the theme's panel fill). `mwg`'s `Bar` already covers the two
  things that file *used* to be justified by - `fillTexture` and `roundUpToPixel` - so this pair is
  all that stands between the port and deleting the file. Both are readable back through `color`/
  `background`, and a runtime colour counts as explicit so a theme change cannot throw it away,
  which is what the tests assert.

- **`FloatingTextStack`** — the port's `src/ui/floatingText.ts` owns its live pop-ups and nudges a
  new one clear of any that is *nearby*, which its own comment flags as a reduction of Java's
  per-`key` stacking. `mwg/ui` has `FloatingText` but nothing that owns several, so every game
  re-writes the collect/drive/prune loop and can forget the stacking. The stack takes
  `(text, x, y, key, ...)`, stacks by key *and* origin, and drives all live pop-ups from one
  `update(dt)`.
- **`FloatingTextOptions.hold`** — Java's damage numbers hold full opacity for the first half of
  their life and fade over the rest (`alpha(p > 0.5f ? 1 : p * 2)`); `mwg`'s fade is linear across
  the whole life. `hold` defaults to 0, so existing callers are unchanged.
- **A bug fix in `FloatingText.update`** — it wrote `this.y = -rise * t`, overwriting the position
  its own docstring tells the caller to set, so a pop-up positioned at a world point jumped to
  `y = 0` on its first update. The rise now moves an inner layer and `position` is left alone.
- **`ParticleEmitterOptions.frames`** — one texture per emitter today, so a flame whose four frames
  cycle per particle (`SPD`'s `Fireball.BLIGHT/FLIGHT/FLAME1/FLAME2`, the Halls water embers) cannot
  use the pooled emitter at all. `frames` is walked per particle by its own age, and the current
  index is exposed as `Particle.frame` so it is testable without a renderer, like the rest of the
  particle state.

Both pure helpers (`floatingTextAlpha`, `floatingTextRise`, `floatingTextStackOffset`) are exported
and tested as arithmetic, because `Label` measures text through a DOM the test suite has none of.

## Generated docs the repo checks (`api-surface`, `reference-doc`)

- `API_REPORT.md` is generated: run `npm run api:report` after applying. The test
  `tests/api-surface.test.ts` fails until you do.
- `REFERENCE.md` is **hand-written** (`tests/reference-doc.test.ts` says so in as many words) and
  its test requires every runtime export to be named somewhere in it, so the four new exports need
  a line — for example, extending the existing one:

  ```md
  - `FloatingText`/`floatingTextAlpha`/`floatingTextRise` - a rising, fading damage/pickup
    number and its pure motion/opacity curves; `FloatingTextStack`/`floatingTextStackOffset`
    stacks simultaneous pop-ups at one world point without overlap.
  ```
- `PROJECT_STATS.*` — `npm run stats:write`, if you want the counts refreshed.

## Roadmap items for the framework (paste into `MW_games/ROADMAP.md`)

Matching the existing item style; the first is what the patch above delivers.

- [ ] Floating text: per-key stacking and a hold-then-fade curve. `FloatingTextStack` owns the
      pop-ups a game spawns over world points (one `push` per number, one `update(dt)`, stacking by
      key *and* origin), `FloatingTextOptions.hold` gives the hold-then-fade curve Java's damage
      numbers use, and `FloatingText.update` no longer overwrites the `y` its docstring tells the
      caller to set. The curves and the stacking rule are exported as pure functions and tested
      without a DOM.
- [ ] `Bar`: recolour the fill after construction (`setColor`) and take a track colour
      (`background`), both readable back through `color`/`background`. A bar's two changing things
      are its length and its colour - `setValue` covers one - while the track is the one part a
      game may want black rather than the theme's panel fill. Without these, a game whose bars
      tint on state has to keep its own bar widget.
- [ ] Particles: a `frames` texture sequence per emitter, walked per particle across its own life
      (a four-frame flame, a puff of smoke), with the current index exposed as `Particle.frame`.
      Today one `texture` per emitter forces games with an animated particle to leave the pooled
      emitter and allocate their own sprites.
- [ ] Sprite attachments: a generic "flat shadow under a sprite" + "status icon over it" helper.
      Not in the patch: `two-d/render`'s `StatusVisuals` only tints, and the port's
      `src/ui/characterEffects.ts` (CharSprite's shadow, `EmoIcon.Sleep`) has no framework
      counterpart. Worth designing deliberately - attachment lifetimes differ per game - rather
      than copying one game's shape.
- [ ] Tile-art placement: a helper for centring a sprite's art over a cell with a pivot and a
      vertical raise (the port's `src/ui/characterPlacement.ts` is ten lines of exactly this, and
      `ActorAnimator` does not cover it). Small, and only worth it if a second consumer appears.

## Known defect to patch next: `FloatingTextStack` stacks the wrong way

Found by the port's own live verification of its adoption, 2026-09-11.

`FloatingTextStack` (0.7.4) moves the **newcomer** down by `height + 1`, where Java's
`FloatingText.push()` (`v3.3.8`, `effects/FloatingText.java:270-300`) anchors the newcomer on the
target and nudges the **older** texts *up* to `below.top() - above.height() - 4` (a 4 px gap),
also shortening the nudged text's life - `min(above.timeLeft, LIFESPAN - numBelow / 5f)` - so
spam self-limits instead of piling up. The port sees the difference plainly: two damage numbers on
one creature in one turn put the second *below* the creature (measured y 332.5 then 361.85, where
332.5 is the target's own pop-up position).

Fix, in two steps: `floatingTextStackOffset` becomes "how far the older pop-ups must move" rather
than "where the newcomer goes", with the 4 px gap replacing `+ 1`; then the lifetime shortening,
which needs the stack to reach into the pop-ups it already holds. `tests/floating-text.test.ts`
should assert the direction, not just the magnitude - it currently checks only the latter, which
is why the sign survived review.
