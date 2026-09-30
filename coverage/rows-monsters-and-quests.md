# Port coverage rows: Monsters and quest rosters

| Java source | Port code | Category and evidence |
|---|---|---|
| `Blacksmith.Quest.spawn()` / `MiningLevel.createMob()` / `MineGiantRoom` (`Blacksmith.java:361`, `MiningLevel.java:163-168`, `MineGiantRoom.java:130-140`, tag `v3.3.8`) | Crystal and Gnoll mine roster setup in `src/scenes/dungeon/npcShopBlacksmith.ts` and `src/scenes/dungeon/monsters/gnollMine.ts` | **Ported (scope correction, R014, 2026-10-01):** new Java Blacksmith quests assign `Random.IntRange(1, 2)`, so only CRYSTAL and GNOLL are reachable. `Blacksmith.java` explicitly comments that the FUNGI quest cannot currently roll; its partial `MiningLevel` and `MineGiantRoom` branches, including `FungalCore`, are dead for new runs. Both active mine rosters are represented by the port. The port does not restore a prior save carrying the dormant type 3 state. |
