# mwg-pixel-dungeon

A genuine, block-by-block TypeScript port of [Shattered Pixel Dungeon](https://github.com/00-Evan/shattered-pixel-dungeon)
(SPD), built on top of the [`mwg`](https://www.npmjs.com/package/@datamoc/mw_games) game
framework and running entirely client-side in the browser.

This is an independent, unofficial port. It is **not affiliated with or endorsed by** Evan
Debenham, SPD's author, who does not accept code contributions or suggestions of any kind
for the original project (see `CLAUDE.md`'s "Upstream contributions" section) - this repo
exists precisely so that work here has somewhere to live on its own.

## Status

In progress, not yet feature-complete. Every deviation from the real Java behavior -
simplification, stand-in, or outright gap - is tracked honestly in
[`PORT_COVERAGE.md`](./PORT_COVERAGE.md), and outstanding work is tracked in
[`ROADMAP.md`](./ROADMAP.md). Broadly:

- All five main regions (Sewers, Prison, Caves, City, Halls) generate from the real Java
  level-generation algorithm, with real terrain, rooms, doors, traps, and hand-placed
  special rooms.
- All five boss floors exist at their real fixed layouts; their full arena scripts (Tengu's
  stage transitions, DM-300's pylons, the Dwarf King's throne sequence, Yog's fist phases)
  are not yet ported.
- Hero classes, subclasses, talents, combat, hunger, and most items/scrolls/potions/rings
  are ported against their real Java formulas; some items, enchantments, and NPC/quest
  content remain unported or simplified - see `PORT_COVERAGE.md` for the specifics.
- There is currently no ally-vs-monster combat system, which blocks a few effects
  (`ScrollOfMirrorImage`'s ally summons, `ScrollOfRage`'s Amok) from being fully real.

## Running it

```sh
npm install
npm run dev      # local dev server
npm run build    # produces dist/index.html, openable directly via file:// - no server needed
```

## Verifying changes

```sh
npx tsc --noEmit       # type-check
npm run build           # full build
npm run test:simulation # combat/turn/buff simulation suite
npm run test:items      # item workflow suite
```

Browser verification (visual, in-game behavior) is a separate manual step - type-checking
and a clean build are not evidence a feature actually works. See `CLAUDE.md`'s "Browser
verification workflow" section for the details.

## Licensing

GPL-3.0-or-later, matching SPD - see [`LICENSE`](./LICENSE). This port legitimately reuses
SPD's real Java source *values and formulas* (translated into TypeScript, never copied
verbatim as Java text) and SPD's real art assets (copied byte-for-byte into `src/assets/`,
with provenance noted in `src/images.ts`). The `mwg` framework it's built on is a separate,
generic, MPL-2.0 project maintained independently - see `CLAUDE.md`'s licensing-boundary
section for how the two are kept apart.

The Java asset registry can be audited and extracted with the repository tool below. It
reports referenced assets missing from this port and can copy missing binary files explicitly;
it never embeds binary asset data in TypeScript.

```sh
node tools/extract-spd-assets.mjs --spd-root <path-to-spd-checkout> --check
node tools/extract-spd-assets.mjs --spd-root <path-to-spd-checkout> --copy
node tools/extract-spd-assets.mjs --spd-root <path-to-spd-checkout> --check --strict
```

## More documentation

- [`CLAUDE.md`](./CLAUDE.md) - working rules for this repo: the licensing boundary, the
  `mwg` dependency, verification requirements, and the browser-testing workflow.
- [`PORT_COVERAGE.md`](./PORT_COVERAGE.md) - the authoritative, per-system record of what's
  ported, simplified, or not ported, and why.
- [`ROADMAP.md`](./ROADMAP.md) - outstanding work, organized by system.
- [`SIMULATION_ARCHITECTURE.md`](./SIMULATION_ARCHITECTURE.md) - how the sprite-free
  combat/turn simulation layer is structured and tested.
- [`MWG_EXTRACTION.md`](./MWG_EXTRACTION.md) - notes on the framework/consumer split and the
  local-checkout integration tools, relevant only when developing `mwg` itself alongside
  this port.
