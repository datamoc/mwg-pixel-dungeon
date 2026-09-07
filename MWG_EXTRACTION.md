# Visual component ownership

This project normally consumes `mwg` as the published npm package `@datamoc/mw_games` (see
`CLAUDE.md`'s "`mwg` dependency" section) - the tools below are only relevant while actively
developing the framework itself against a local `MW_games` checkout, expected as a sibling
of this repo (`../MW_games`), not something this repo carries.

`tools/prepare-mwg-ui.py` preserves the extraction preparation script. It reads the
sibling MWG checkout and writes candidate UI files to `tools/scratch/mwg-ui-extraction`
for review, without applying them. Already-applied features are left intact.

Run `node tools/verify-mwg-integration.mjs` (from this repo's root) to repeat the framework
typecheck, test suite, library build and consuming game's build. The script resolves
both repositories relative to itself and stops at the first failure. Browser visual
checks remain a separate step. MWG regression tests live in
`MW_games/tests/button-skin.test.ts`.

Reviewed against MWG commit f8e0278c232956e4bdd79ab5db372a7247acbdb2.

| Component | Decision |
| --- | --- |
| Button chrome and input-state tint | Added generic `ButtonOptions.skin` in MWG, with texture, border and optional per-state tints. SPD supplies its crop and colors. |
| Caption and label rendering | Added `LabelOptions.stroke`, `resolution`, `roundPixels`, and `ButtonOptions.label`. Caption options also apply after `setText` recreates a label. |
| Panel frames | MWG already has `NinePatch`; SPD's panel helper supplies a game-specific texture crop. |
| Inventory and statistics windows | Item classifications, action rules, text and Java layout remain local. MWG already supplies inventory data structures, windows and icon grids. |
| Toolbar and status pane | Game-specific slots, resources, crops and layout remain local. Their button rendering uses MWG. |
| Hero animation | MWG already supplies animation and movement primitives. Java frame sequences and timing stay local; the existing presentation controller has not been migrated in this extraction. |
| Water and terrain | Java shoreline rules, visibility integration and ripple values remain local. A configurable scrolling tile layer could be a later framework feature; none was added in this extraction. |
| Title, badges and class selection | Game-specific screens remain local, using the shared button and text APIs. |

Validation: MWG typecheck, 840 tests and library build passed. SPD production build
passed. Browser checks confirmed the title's eight skinned buttons, outlined text,
and caption recreation through the public API. The simplified wrappers no longer
inspect child positions or install duplicate pointer handlers.
