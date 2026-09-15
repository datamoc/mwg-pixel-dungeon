# Source architecture

The directory layout follows the direction of the project graph:

```text
main.ts                 application bootstrap and scene registration
scenes/                 stateful scene orchestration
scenes/regions/         region profiles and genuinely region-specific scene helpers
actors/                 actor-domain policies (monster spawning and NPC interactions)
monsters.ts             monster catalogue, metadata, rosters, loot rules, and flags
items/                  all item definitions, effects, generation, equipment, and shops
simulation/             renderer-free decisions and boss/combat planning
mechanics/              reusable geometry and targeting mechanics
spdLevelGen/            SPD level generation, painters, rooms, and visual bridges
ui/                     reusable windows, panels, HUD, and presentation widgets
content/                authored MWL source files
generated/              compiler-produced content, assets, translations, and messages
adapters/               seams between scene state and renderer-free simulation/framework APIs
```

## Boundary rules

- `scenes/` owns mutable runtime state, Pixi objects, scheduling, and presentation callbacks.
- `simulation/` must not import a scene or create renderer objects.
- `items/` owns item behavior; item-specific helpers do not belong in `main.ts` or a scene.
- `actors/` owns actor policies that are shared by more than one scene operation. Monster
  catalogue data remains in the deliberately flat `monsters.ts` module.
- `scenes/regions/` is for behavior that is genuinely specific to one dungeon region; common
  level mechanics belong in `spdLevelGen/` or `simulation/`.
- `generated/` is never edited by hand; change the MWL source or the generator instead.
- Avoid adding a directory for a single trivial file. Add a directory only when it represents a
  real graph boundary or contains multiple related modules.

When extracting code, leave the scene with a small adapter that supplies state and callbacks.
Keep state transitions and renderer-free decisions in their owning domain so the dependency
direction remains discoverable.
