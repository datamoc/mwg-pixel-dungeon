# Géométries de faisceau et flamage : ce que `mwg` doit gagner, et ce qui reste

Spécification demandée après lecture des deux côtés (paquet publié **0.7.3**, checkout **0.7.4**,
et le Java SPD `v3.3.8`). Elle commence par corriger trois choses que j'avais affirmées à tort dans
`ROADMAP.md` : **ni `TerrainKind.flags`/`extras` ni la priorité du `Scheduler` ne sont dans le
paquet publié** (les deux sont dans le checkout 0.7.4, donc en attente de publication), et **les
portes sont bel et bien flamables en Java** - c'est ma « correction » précédente qui était fausse,
et elle a été recopiée dans `ROADMAP.md` et `PORT_COVERAGE.md`. Le §3 est l'inventaire complet
demandé.

## 0. Corrections de mes affirmations précédentes

| Ce que j'avais écrit | Le fait |
|---|---|
| « `TerrainKind.flags`/`extras` sont dans 0.7.3 » | Faux. `TerrainKind` publié = `{ passable, transparent }`. Le checkout 0.7.4 ajoute `flags?: number` (« game-defined bit flags, carried without interpretation ») et des propriétés booléennes optionnelles. |
| « `Scheduler` a une priorité dans 0.7.3 » | Faux. Publié : `add(actor, delay?)`. Le checkout 0.7.4 ajoute `priority?: number` (« higher-priority actors resolve first when their scheduled times tie »). |
| « le seul test `flamable` du port est le faisceau de Yog » | Vrai : `fireYogDeathGaze` est le seul site. |
| « il est faux vis-à-vis de Java : il inclut `DOOR`/`DOOR_CLOSED` alors que **les portes ne sont pas flamables** en Java, c'est un bug de fidélité à corriger » | **Faux, et c'est l'affirmation la plus coûteuse des trois.** À `v3.3.8`, `Terrain.flags[DOOR]` **et** `Terrain.flags[OPEN_DOOR]` portent tous deux `FLAMABLE` (voir §3.1) : une porte est combustible, et le feu la réduit en `EMBERS` par `Level.destroy()` comme n'importe quelle herbe. La liste du port était donc **fidèle**, son propre commentaire le dit déjà (« Java's FLAMABLE flag covers GRASS/HIGH_GRASS … and both door states »), et le §3.7 de `ROADMAP.md` ainsi que l'entrée ajoutée à `PORT_COVERAGE.md` disent l'inverse : à corriger tous les deux. |
| « l'herbe brûle peut-être déjà » (ta présomption) | **Non, elle n'a jamais été implémentée.** Le port l'écrit lui-même dans `spreadFire()` : « Not reproduced: spreading regular Fire onto flammable terrain (no flammable map) and burning heaps (no heap-burn primitive) ». |

## 1. Ce qui existe déjà, et qu'il suffit d'employer (0.7.3 publié)

`mwg/roguelike` sait déjà faire **plusieurs géométries** - c'est `MultiTurnBeam` qui ne sait pas
les consommer :

- `Targeting.AreaShape` = `{kind:'single'} | {kind:'burst', radius} | {kind:'line'} | {kind:'cone', width}`
  avec `resolveArea(origin, target, shape)` et `resolveAreaOnLevel(level, origin, target, shape)`
  (versions hex comprises : `hexConeCells`).
- `coneCells(origin, target, width)` / `hexConeCells`, `traceLine`, `hasLineOfSight`, `canTarget`,
  `chebyshevDistance`, `knockbackPath`, `chainTargets`, `rangeMultiplier`, `areaFalloffMultiplier`
  (dégradation par bandes de distance - exactement `Ballistica`'s falloff côté Java).
- `MultiTurnBeam` : `{ level, from, target, damage: number | (target, ctx) => number, targetsAt, applyDamage, isBlocked, stopAtOpaque }`, `start()`/`advance()`/`cancel()`, `toJSON()`/`fromJSON()`,
  `BeamDamageContext = { cell, step, remaining }`.
- `Blob` : `seed(x,y,amount)`, `clear(x,y)`, `volumeAt`, `total()`, `cellsAbove(min)`, et surtout
  **`spread(open, spread?, decay?)`** - `spread = 0` + `decay < 1` donne exactement le `FireBlob`
  de Java (décroissance sur place), `decay = 1` conserve et ne fait que déplacer.

## 2. Ce qui manque : faisceaux multi-tours multi-géométries

Le seul trou réel : **`MultiTurnBeam` capture `traceLine(from, target)`** - donc une droite - alors
que `resolveArea`/`coneCells` produisent déjà les autres formes. Quatre changements :

### 2.1 Le faisceau prend une géométrie, pas un `from`/`target`

```ts
export interface MultiTurnBeamOptions<T> {
	level: Level;
	/** la suite de fronts, dans l'ordre d'avancement : un front par tour */
	fronts: readonly (readonly Step[])[];
	// … et le reste inchangé : damage, targetsAt, applyDamage, isBlocked
	/** appelé pour chaque cellule atteinte, avant les dégâts : igniter le terrain, jouer un arc */
	onCell?: (cell: Step, context: BeamDamageContext) => void;
	/** politique de blocage : voir 2.2 */
	blockers?: 'stop' | 'skip';
}
```

et un producteur de fronts par forme, symétrique de `AreaShape`, pour que le jeu n'ait pas à
réimplémenter la géométrie :

```ts
export interface BeamShape {                       // étend AreaShape, ne le remplace pas
	kind: 'line' | 'cone' | 'burst' | 'ring';
	/** pour 'cone' : la largeur du front ; pour 'burst' : le rayon */
	width?: number;
	radius?: number;
}
/** découpe une forme en fronts successifs */
export function beamFronts(level: Level, from: Step, to: Step, shape: BeamShape): Step[][];
```

Correspondances exactes avec Java :

| Forme | Découpe en fronts | Consommateur du port |
|---|---|---|
| `line` | une cellule par front (`Ballistica` WONT_STOP) | faisceau de Yog (`YogDzewa`), `zap` des baguettes |
| `cone`, `width` | un **anneau** par front, depuis `from`, dans la direction donnée par le premier pas de `traceLine` | cône de feu de Tengu (déjà porté comme état sur la créature ; ce serait le remplacement propre) |
| `burst`, `radius` | un **anneau de rayon croissant** par front ; ordre imposé (voir 2.3) | impulsions du Shocker, énergie des pylônes DM-300, souffle du Wand of Fireblast |
| `ring` | le contour d'un rayon donné, en un front | `Blast`/visualisations |

### 2.2 Le blocage dépend de la géométrie

C'est le point que `stopAtOpaque: boolean` ne peut pas exprimer, et il est **sémantique**, pas
cosmétique :

- une **ligne** s'arrête : `Ballistica(STOP_SOLID)` → le rayon s'arrête à l'obstacle, tout ce qui
  est derrière est épargné ;
- un **cône** saute la cellule : `Tengu.FireAbility.spreadFromCell()` teste `solid` **par cellule**
  et continue ailleurs (un mur ne coupe qu'une branche, pas le cône) ;
- un **burst** ignore les murs : il ne se propage pas *à travers* eux mais chaque cellule du disque
  est évaluée indépendamment (`PathFinder.buildDistanceMap(bombPos, solid, 2)` pour la bombe de
  Tengu).

Donc : `blockers: 'stop' | 'skip'`, choisi par la forme, et non un booléen global.

### 2.3 L'ordre des fronts est une donnée, pas un détail

Le Shocker alterne **cardinaux / diagonaux** (`ShockerAbility.spreadblob()` : `for (i = shockingOrdinals ? 0 : 1; i < CIRCLE8.length; i += 2)`), et la bombe de Tengu pulse aussi par parité. `burst` doit donc accepter un ordre de fronts (parité, ou rayon croissant), pas seulement un ensemble de cellules.

### 2.4 Sérialisation de la géométrie

`MultiTurnBeamSave` stocke `path` + `index`. Avec des fronts, il faut stocker l'**identité de la
forme** + l'index du front courant (et pouvoir les régénérer au chargement), sinon un faisceau
interrompu par une sauvegarde ne reprend pas. C'est déjà la bonne approche pour `Blob.toJSON()` :
des données pures, régénérables.

### 2.5 Acteurs temporaires et priorité (à faire quand 0.7.4 sortira)

`FireAbility`/`ShockerAbility` de Java sont des `Buff` : ils agissent **avec leur hôte**, à
`BUFF_PRIO - 1` pour le blob, et les visuels à `VFX_PRIO`. Le port fait déjà la bonne chose pour le
cône de Tengu (`advanceTenguFire` en tête de `takeMonsterTurn`), mais à la main. Ce qui manque au
cadre pour supprimer les champs ad-hoc (`pendingMonsterTurnCost`, `yogTargeted`) :

- `Scheduler.add(actor, delay, priority)` (0.7.4) ;
- des constantes nommées (l'équivalent `VFX_PRIO`/`BUFF_PRIO`), pour que « le télégraphe résout
  avant les créatures » soit exprimable et pas des nombres magiques ;
- un petit `interface TimedActor { act(): number | void }` documenté, afin que les capacités à
  plusieurs tours soient de vrais acteurs - c'est ce qui permettra de supprimer les champs
  persistés à la main (`tenguFire`, `yogTargeted`) au profit d'acteurs sérialisés par le
  `Scheduler.toJSON()`, qui existe déjà.

## 3. Flamage : l'inventaire complet de ce qui peut prendre feu (Java `v3.3.8`)

Tout part d'un seul bit. `Terrain.flags[terr]` porte `FLAMABLE = 0x04`, et
`Level.buildFlagMaps()` puis `Level.updateCellFlags()` (appelé à chaque `Level.set()`) en dérivent
le tableau `level.flamable[]` que tout le reste interroge. L'inventaire est donc exhaustif par
construction : les genres qui portent le bit, puis les trois endroits qui le forcent ou le
contournent.

### 3.1 Les terrains : un bit, sept genres

| Terrain | `flags` (`Terrain.java`, `v3.3.8`) | Ce que c'est |
|---|---|---|
| `GRASS` | `PASSABLE \| FLAMABLE` | l'herbe |
| `HIGH_GRASS` | `PASSABLE \| LOS_BLOCKING \| FLAMABLE` | l'herbe haute (bloque la vue, pas le pas) |
| `FURROWED_GRASS` | `= flags[HIGH_GRASS]` | l'herbe haute piétinée (Soiled fist, Wand of Regrowth) |
| `DOOR` | `PASSABLE \| LOS_BLOCKING \| FLAMABLE \| SOLID` | **la porte fermée** |
| `OPEN_DOOR` | `PASSABLE \| FLAMABLE` | **la porte ouverte** |
| `BARRICADE` | `FLAMABLE \| SOLID \| LOS_BLOCKING` | la barricade en bois, posée par les gnolls (`GnollSapper`, `GnollGeomancer`, `RegularPainter`, `MineLargeRoom`) |
| `BOOKSHELF` | `= flags[BARRICADE]` | la bibliothèque, mêmes flags que la barricade |

Ceux qui n'ont **pas** le bit, et qui sont les pièges quand on reconstruit la liste à la main :

- `EMBERS` = `PASSABLE` seul : les braises ne se rallument pas. C'est la *sortie* du feu, pas une
  entrée, et c'est ce qui rend le feu non cyclique ;
- `LOCKED_DOOR` et `HERO_LKD_DR` = `LOS_BLOCKING | SOLID` : une porte verrouillée ne brûle **pas**,
  contrairement à une porte normale. Toute liste écrite « les portes » au pluriel sans distinguer
  les trois genres se trompe dans un sens ou dans l'autre ;
- `CRYSTAL_DOOR`, `MINE_CRYSTAL`, `MINE_BOULDER`, `STATUE`/`STATUE_SP`, `ALCHEMY`, `CUSTOM_DECO` =
  `SOLID` ; `SECRET_DOOR` = `flags[WALL] | SECRET` ; `WALL`/`WALL_DECO` = `LOS_BLOCKING | SOLID` ;
- `WATER` = `PASSABLE | LIQUID` ; `CHASM` = `AVOID | PIT` ; `TRAP` = `AVOID` ;
- `REGION_DECO`/`REGION_DECO_ALT` = `flags[STATUE]`, donc non flamables **par défaut** : c'est
  l'exception de niveau, §3.2.

### 3.2 Deux exceptions qui ne se lisent pas dans la table

1. **Les égouts.** `SewerLevel.buildFlagMaps()` **et** `Level.updateCellFlags()` (qui teste
   `this instanceof SewerLevel`) forcent `flamable[cell] = true` quand `map[cell]` est `REGION_DECO`
   ou `REGION_DECO_ALT` : les barils des égouts brûlent malgré des flags qui disent `SOLID`. Et
   `SewerLevel.destroy()` ne les transforme pas en braises : `REGION_DECO` devient `WATER` (le baril
   d'eau éclate) et `REGION_DECO_ALT` devient `EMPTY_SP`, avant de déléguer à
   `super.destroy()`.
2. **Les toiles.** `Web` est un `Blob`, et `Web.onUpdateCellFlags()` force, tant que
   `volume > 0 && cur[cell] > 0`, à la fois `solid[cell] = true` **et** `flamable[cell] = true` :
   une toile rend sa propre cellule combustible, et brûle avec elle. `Level.destroy()` efface la
   toile de la cellule détruite.

### 3.3 Les personnages : le héros comme les monstres, sauf dans l'eau

`Fire.burn(pos)`, appelé à chaque tick d'`evolve()` pour chaque cellule en feu, fait exactement
trois choses : l'occupant, le tas au sol, la plante.

- **N'importe quel `Char`** sur la cellule prend feu, héros compris, via
  `Buff.affect(ch, Burning.class).reignite(ch)`, à la seule condition `!ch.isImmune(Fire.class)`. Il
  n'existe aucune immunité de classe `Hero` : le personnage brûle.
- **L'eau éteint, mais n'empêche pas de s'allumer**, et elle est sans effet sur les volants. Trois
  sites, qui doivent tous être portés pour que ce soit fidèle :
  - `Burning.act()` détache si `acted && water[pos] && !target.flying` (un tour de délai : le buff
    agit une fois, puis s'éteint), et de nouveau en fin d'`act()` si
    `left <= 0 || (water[pos] && !flying)` ;
  - `Level` (à l'occupation d'une cellule) appelle `Burning.act()` **immédiatement** si
    `map[pos] == WATER` et que le personnage ne vole pas - c'est ce qui rend le pas dans l'eau
    instantané plutôt qu'un tour plus tard ;
  - `GeyserTrap` détache `Burning` (les geysers), et toute **potion brisée** éteint le blob de feu
    de sa cellule (`Potion.splash()` → `fire.clear(cell)`) et retire `Burning` aux **alliés**
    présents, pas aux ennemis (`ch.alignment == Alignment.ALLY`).
- **Un personnage qui brûle rallume sa propre cellule** : `if (flamable[pos] && volumeAt(pos,
  Fire.class) == 0) seed(pos, 4, Fire.class)`. C'est le seul chemin par lequel un personnage crée
  du feu, et c'est ce qui fait qu'un héros en feu dans l'herbe met le niveau en feu.
- **Dégâts** : `Random.NormalIntRange(1, 3 + depth/4)` par tour. Le héros a en plus la perte
  d'objets : à partir du 4e tour, probabilité `(tours - 3) / 3` de brûler un parchemin non unique,
  une `MysteryMeat` ou une `FrozenCarpaccio` (qui devient un `ChargrilledMeat`), le contenu des
  conteneurs étant hors d'atteinte. Un `Thief` qui brûle perd son butin (parchemins) et sa
  `MysteryMeat` devient un `ChargrilledMeat`.

**Qui ne prend pas feu** (`Char.isImmune` agrège `immunities` + `properties()` + `buffs()` + le
glyphe `Brimstone`) :

| Source d'immunité | Effet | Portée |
|---|---|---|
| `Property.FIERY` | `Burning`, `Blazing` | `Elemental` (toutes variantes, y compris les nouveaux-nés) et `YogFist` (toutes les mains). C'est l'immunité la plus large, et c'est celle que le port cite déjà dans `spreadFire()`. |
| `BlobImmunity` | `Fire`, `MagicalFireRoom.EternalFire` | **La seule qui bloque l'allumage** (`isImmune(Fire.class)`). Appliquée par `PotionOfPurity` et la plante `Mageroyal` ; empruntée par `Piranha`, `Shopkeeper`, `SpiritHawk`, `Challenge`/`Feint` du Duelist. |
| `Burning` seule | le buff, pas l'allumage | `Piranha`, `MirrorImage`, `PrismaticImage`, l'esprit de `DriedRose`, `ChampionEnemy` (champion `Blazing`), `FireImbue`. |
| glyphe `Brimstone` | `Burning` | `Char.isImmune` l'ajoute directement ; `Burning.reignite()` offre alors une `Barrier` au lieu du buff. |
| cas particulier `Tengu` | - | sa propre `FireAbility` ne l'allume pas (`!(ch instanceof Tengu)`). |

Deux nuances à ne pas écraser en factorisant :

- **`YogFist.BurningFist` s'allume et ne subit rien.** Son commentaire est explicite :
  « can be ignited, but takes no damage from burning ». Ce n'est pas `Property.FIERY` (la main
  *doit* attraper le buff, sinon elle perd sa propagation), c'est un `damage()` qui ignore la source
  `Burning`. Le confondre avec une immunité casserait la main ardente.
- **Voler n'immunise pas du feu**, ça immunise de l'eau : un volant brûle normalement et ne
  s'éteint jamais en survolant un lac.

### 3.4 Les objets au sol : `Heap.burn()`

`Fire.burn()` appelle `heap.burn()` si un tas existe. `Heap.burn()` sort immédiatement si
`type != Type.HEAP` (un coffre ou une pile d'ossements ne brûle pas, il s'ouvre à l'explosion), et
ne teste pas `unique` globalement :

| Objet | Devient |
|---|---|
| `Scroll` non unique | détruit |
| `Dewdrop` | évaporée |
| `MysteryMeat`, `FrozenCarpaccio` | remplacé par `ChargrilledMeat` (la quantité est conservée) |
| `Bomb` | retirée puis `explode(pos)` ; si `explodesDestructively()`, le brûlage s'arrête là, l'explosion remplaçant la suite |

Tout le reste survit (potions, armes, armures, anneaux, artefacts, graines, nourriture cuite), et un
objet `unique` survit toujours.

### 3.5 Les plantes

`Fire.burn()` appelle `plant.wither()` : la plante est arrachée (`uproot`) et peut laisser une
graine derrière elle.

### 3.6 Les sources d'allumage, et ce qui éteint

Ce ne sont pas des cibles mais l'autre moitié du contrat, et la liste est courte :

- **Blobs** `Blob.seed(cell, volume, Fire.class)` : `WandOfFireblast` (`1 + chargesPerCast()`),
  `PotionOfLiquidFlame` (2 par cellule sur les 9 voisines, **sans** test de flamabilité : la seule
  condition est `!solid`, donc le feu prend aussi sur l'eau et sur un gouffre, ce qui n'est pas un
  oubli), `PotionOfDragonsBreath` (5),
  `BurningTrap` (2), `Firebloom` (2), `Burning` (4), `ElementalBlast` (4), `YogFist` (`4 - vol`),
  `Inferno`, `MagicalFireRoom`, et le faisceau de Yog (`if (Dungeon.level.flamable[p])`).
- **`Burning.reignite()`**, qui est le chemin de tous les effets non-blob : armes
  (`Blazing`, `IncendiaryDart`), `FireImbue`, champion `Blazing`, capacités (`ElementalBlast`,
  `CursedWand`, `MagicalFireRoom`), créatures (`Elemental`, `GnollTrickster`, `Swarm`, `Tengu`,
  `YogFist`), objets (`MysteryMeat` mangée, `AntiEntropy`).
- **Ce qui éteint** : l'eau (§3.3), `Chill`/`Frost`/`Freezing` (détachent `Burning`), `GeyserTrap`,
  toute potion brisée, et `BlobImmunity` (`PotionOfPurity`).

### 3.7 Le mécanisme : c'est `Fire.evolve()` qui brûle le terrain, pas les sources

1. `evolve()` parcourt les cellules dont `cur[cell] > 0`, appelle `burn(cell)` (§3.3 à §3.5), puis
   calcule `fire = cur[cell] - 1` ;
2. `if (fire <= 0 && flamable[cell]) Dungeon.level.destroy(cell)` : **la destruction du terrain
   arrive quand le volume d'une cellule combustible tombe à zéro**, pas à l'allumage ;
3. `Level.destroy(cell)` remplace par `EMBERS` si le genre est `EMPTY`, `EMPTY_DECO` **ou** flamable,
   efface la toile de la cellule, et `SewerLevel` surcharge les deux cas de baril (§3.2) ;
4. le feu se propage aux voisins **flamables** où le volume est nul (`fire = 4`, `burn(cell)`), donc
   un feu allumé sur une cellule non flamable s'éteint sans rien laisser, et un feu qui atteint de
   l'herbe continue.

Donc « le flamage utilisable par les baguettes et potions » = **un tableau flamable + un blob qui
décroît sur place + un crochet de fin de combustion**. Les nombres et les volumes restent au port
(règle de licence : aucune donnée SPD dans `mwg`).

## 4. Ce que le cadre doit gagner pour le flamage

1. **Rien pour l'ensemble flamable lui-même.** Le port tient sa propre table (il a ses propres ids
   de terrain et `Level.terrain` est un `Uint8Array` indexant `kinds`), et cette table est la forme
   exacte de Java : le bit `FLAMABLE` sur sept genres plus les deux exceptions de §3.2. Le port
   n'a aujourd'hui ni `FURROWED_GRASS` ni `BARRICADE`/`BOOKSHELF` représentables (§5.1), donc sa
   table vit dans la liste du faisceau de Yog, pas dans les `kinds`. `TerrainKind.flags` (0.7.4)
   permettrait de coller le bit au genre et de supprimer la table parallèle - souhaitable,
   **pas nécessaire**, à faire quand 0.7.4 sera publié.
2. **Un crochet de fin de combustion sur `Blob`** - le seul vrai manque. Aujourd'hui le jeu doit
   différentiel `cellsAbove()` entre deux pas pour savoir quelles cellules viennent de s'éteindre ;
   `Fire.evolve` a précisément besoin de cet instant (`if (fire <= 0 && flamable[cell]) burn(cell)`).
   Proposition minimale :

   ```ts
   /** pas de diffusion ; renvoie les cellules dont le volume vient de tomber à 0 */
   spread(open, spread?, decay?, onBurnout?: (x: number, y: number) => void): void;
   ```

   (ou un retour `Array<{x,y}>` des cellules éteintes, qui compose mieux et ne mélange pas rappel et
   retour). Avec ça, `burn()` s'écrit en trois lignes côté port : `level.set(GRASS→EMBERS)`,
   `reignite(char)`, `heap.burn()`.
3. **Rien d'autre** : `level.set()` existe, les visuels de braises sont ceux du port, `Burning` est
   déjà appliqué par le tick du port.

## 5. Ce que ça change côté port (à faire, et bugs trouvés maintenant)

1. **Pas de bug de fidélité sur les portes** : `[GRASS, HIGH_GRASS, DOOR, DOOR_CLOSED]` dans
   `fireYogDeathGaze` est **correct**, et le commentaire du site le dit déjà. La correction à faire
   est l'inverse de celle que j'avais écrite : ne *pas* retirer les portes, et corriger
   `ROADMAP.md` (§3.7) et `PORT_COVERAGE.md`, qui affirment le contraire.
   Ce que la liste rate réellement, par ordre d'importance :
   - `FURROWED_GRASS`, qui n'existe pas comme id dans le port (`dungeonConstants.ts` n'a ni
     `FURROWED_GRASS` ni `EMBERS`) : à ajouter en même temps que le genre `EMBERS` ;
   - `BARRICADE` et `BOOKSHELF`, qui ne sont pas des genres du port mais des murs permanents
     (`gameBridge.ts` : « `BARRICADE` -> `wall`. Java's is flammable and can be burned through;
     here it is permanent »). Tant que ce mapping reste, un faisceau qui brûle une barricade en
     Java ne peut pas brûler la même cellule ici : c'est une déviation à déclarer, pas une ligne à
     ajouter à la liste ;
   - le cas des barils d'égouts (`REGION_DECO`/`REGION_DECO_ALT` → eau ou sol) : vérifier ce que le
     port en fait avant de le câbler ;
   - `Web` : le port n'a pas de toile qui rende sa cellule flamable.
2. **Blocage structurel** : `gameBridge.ts` réduit `EMBERS → floor`, donc les braises sont
   aujourd'hui *irreprésentables* dans le niveau vivant. Tant que ce n'est pas un genre à part
   (passable, non flamable, avec son art), le flamable ne peut pas être bouclé de bout en bout.
3. **Décroissance du feu** : le blob du port diffuse avec la décroissance par défaut ; Java décroît
   sur place. `this.fire.spread(open, 0, decay)` est disponible **dès 0.7.3** - à aligner *avant* de
   brancher le flamable, sinon la durée du feu et le moment du `burn` seront faux.
4. **Le brûlage des objets au sol** (`heap.burn()`, §3.4) n'a pas de primitive dans le port : reste
   non porté, à déclarer.
5. **L'extinction par l'eau n'est que partielle** : `spreadFire()` allume bien un personnage sur
   une cellule en feu, mais les trois sites d'extinction de §3.3 (le `water[pos] && !flying`
   d'`act()`, l'`act()` immédiat à l'occupation, et le fait que voler n'immunise pas) doivent être
   vérifiés un par un - c'est là que se perd la nuance « sauf dans l'eau », qui n'est pas une
   condition d'allumage mais une condition d'extinction.
6. **Pas de nouvelle dette** : le cône de Tengu ne doit pas être réécrit pour `MultiTurnBeam` une
   fois §2 fait - sa règle d'étalement (3 cellules par cellule source, dédoublonnage de l'anneau
   précédent, garde « le feu brûle encore ») est plus étroite qu'une forme générique ; le bon
   remplacement est un `beamFronts` avec un **générateur fourni par le jeu**, pas une des quatre
   formes.

## 6. Ce qui reste nécessaire au-delà des faisceaux et du feu

Par ordre de valeur pour la roadmap :

1. **Acteurs temporaires priorisés** (§2.5) - débloque Shocker, télégraphe de Yog, séquence des pylônes DM-300, et supprime les champs persistés à la main.
2. **Crochet de fin de combustion** (§4.2) - débloque tout le flamable (herbe → braises), le Wand of Fireblast et la Potion of Liquid Flame au-delà du simple seed.
3. **Effet visuel d'arc** (`Lightning`) : un helper `two-d/render` pour un trait de foudre entre deux points, temporisé - le Shocker en a besoin, le port n'a rien d'équivalent (il a des `Label`/`Sprite` et le rendu du feu).
4. **`TerrainKind.flags`/`extras`** (0.7.4) - supprime la table flamable parallèle ; optionnel.
5. **Occupation multi-cellules** : DM-300 et les poings de Yog occupent une cellule en Java aussi (`Char` = 1 cellule), donc **rien à faire** - c'est le *rendu* qui est plus grand, pas la logique. À ne pas ajouter au cadre.
6. **`BeamLine`/`BeamGeometry` exportés** depuis `mwg/roguelike` : `beamFronts` (§2.1) plus `Ballistica`-style stop modes (`stop`, `skip`, `wontStop`) nommés, pour que la sémantique de §2.2 soit lisible dans le code du jeu.

## 7. Ordre d'implémentation proposé

1. Port : table `FLAMABLE` conforme à §3.1 (sept genres moins ce qui n'est pas représentable, plus
   les toiles quand elles existeront) + `EMBERS` comme vrai genre + `fire.spread(open, 0, decay)` +
   `burn()` (herbe → braises, occupant, heap si un jour). Vérifiable seul, sans toucher au cadre.
2. Cadre : `onBurnout` sur `Blob.spread` (3 lignes + test). Publié en 0.7.5 ou avec 0.7.4 s'il n'est pas encore publié.
3. Cadre : `beamFronts` + `MultiTurnBeam` par fronts + `blockers: 'stop' | 'skip'` + `onCell` + save par identité de forme (0.7.5, avec des tests par forme et un aller-retour de sauvegarde).
4. Port : réécrire le faisceau de Yog (`line` + `onCell` flamable) puis le Shocker (`burst` par parité) sur le nouveau faisceau, et supprimer les champs `yogTargeted`/`tenguFire` au profit d'acteurs quand la priorité du `Scheduler` sera publiée.
5. Corriger les deux affirmations fausses sur les portes (`ROADMAP.md`, `PORT_COVERAGE.md`) **immédiatement** : c'est une régression de documentation, pas une attente, et la laisser ferait supprimer une fidélité correcte au prochain passage.
