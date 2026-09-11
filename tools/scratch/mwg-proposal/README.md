# Proposed `mwg` patch — floating text + particle frames

Two files are involved, and they are the *remainder*: everything else this port asked the
framework for already ships.

- `0001-floating-text-stack-and-particle-frames.patch` — applies to `MW_games` at `a5602af`
  (`0.7.3`), verified with `git apply --check --cached`. Touches
  `src/two-d/ui/FloatingText.ts`, `src/two-d/ui/FloatingTextStack.ts` (new),
  `src/two-d/ui/index.ts`, `src/two-d/render/Particles.ts`, `tests/floating-text.test.ts` (new),
  `tests/particles.test.ts`, `CHANGELOG.md` — no SPD values anywhere in it.

```sh
cd <MW_games>
git apply --check /path/to/0001-floating-text-stack-and-particle-frames.patch
git apply       /path/to/0001-floating-text-stack-and-particle-frames.patch
npm run check                       # tsc --noEmit, clean
node --test tests/particles.test.ts tests/floating-text.test.ts   # 24 pass
npm test                            # 1491 pass - see "generated docs" below
npx prettier --check <the seven files>
```

## What it adds, and why each piece is missing today

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
