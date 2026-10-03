// R008 correction splice: HEAD blob + own hunk only (AGENTS.md private-index protocol).
// R008 stays OPEN - this just replaces the stale "Blandfruit remains Not ported" text
// with the verified partial state (item + bush exist, chain does not).
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const cat = (p) => execFileSync('git', ['cat-file', 'blob', `HEAD:${p}`], { maxBuffer: 1 << 28 }).toString('utf8');
mkdirSync('tools/scratch/r008', { recursive: true });

const oldLine = "- [ ] **R008** _(the unmodeled-slow and Java's own no-op sharing the silent 40%. Pinned in test:)_ `Blandfruit` remains **Not ported**;";
const newLine = "- [ ] **R008** _(Blandfruit: plant drop, CookFruit infusion, potionAttrib variants (items/food/Blandfruit.java, plants/BlandfruitBush.java, tag v3.3.8))_ Corrected 2026-10-01: \"remains Not ported\" was too flat - the plain `blandfruit` item exists as MWL data (real `items.food.blandfruit.name`, `Hunger.STARVING` 450 row, pinned in `test:items`) and garden rooms plant the bush, but the chain is still unported: bush harvest drops generic `food` instead of Java's plain Blandfruit (`plantTriggers.ts` `spawnFood` -> `spawnGroundItem('food')` vs `BlandfruitBush.java:36`), there is no executable `Blandfruit.CookFruit` recipe (Java combines a plain fruit with any Seed for 2 energy into `cook(Seed)`; only `manifest-blandfruit` metadata is registered), and the whole `potionAttrib` system is absent - twelve named variants with their image/name/desc swap (`Blandfruit.java` `name()`), the four volatile `desc_throw` forms, and the `Chunks` shatter debris.";

let roadmap = cat('ROADMAP.md');
const n = roadmap.split(oldLine).length - 1;
if (n !== 1) throw new Error(`expected exactly 1 old R008 line in HEAD ROADMAP, got ${n}`);
roadmap = roadmap.replace(oldLine, newLine);
writeFileSync('tools/scratch/r008/ROADMAP.md', roadmap);
console.log('spliced: tools/scratch/r008/ROADMAP.md');
