# Géométries de faisceau et flamage : ce que `mwg` doit gagner, et ce qui reste

Spécification demandée après lecture des deux côtés (paquet publié **0.7.3**, checkout **0.7.4**,
et le Java SPD `v3.3.8`). Elle commence par corriger deux choses que j'avais affirmées à tort dans
`ROADMAP.md` : **ni `TerrainKind.flags`/`extras` ni la priorité du `Scheduler` ne sont dans le
paquet publié** — les deux sont dans le checkout 0.7.4, donc en attente de publication.

## 0. Corrections de mes affirmations précédentes

| Ce que j'avais écrit | Le fait |
|---|---|
| « `TerrainKind.flags`/`extras` sont dans 0.7.3 » | Faux. `TerrainKind` publié = `{ passable, transparent }`. Le checkout 0.7.4 ajoute `flags?: number` (« game-defined bit flags, carried without interpretation ») et des propriétés booléennes optionnelles. |
| « `Scheduler` a une priorité dans 0.7.3 » | Faux. Publié : `add(actor, delay?)`. Le checkout 0.7.4 ajoute `priority?: number` (« higher-priority actors resolve first when their scheduled times tie »). |
| « le seul test `flamable` du port est le faisceau de Yog » | Vrai, mais il est **faux vis-à-vis de Java** : il inclut `DOOR`/`DOOR_CLOSED` alors que **les portes ne sont pas flamables** en Java (voir §3). |
| « l'herbe brûle peut-être déjà » (ta présomption) | **Non, elle n'a jamais été implémentée.** Le port l'écrit lui-même dans `spreadFire()` : « Not reproduced: spreading regular Fire onto flammable terrain (no flammable map) and burning heaps (no heap-burn primitive) ». |

## 1. Ce qui existe déjà, et qu'il suffit d'employer (0.7.3 publié)

`mwg/roguelike` sait déjà faire **plusieurs géométries** — c'est `MultiTurnBeam` qui ne sait pas
les consommer :

- `Targeting.AreaShape` = `{kind:'single'} | {kind:'burst', radius} | {kind:'line'} | {kind:'cone', width}`
  avec `resolveArea(origin, target, shape)` et `resolveAreaOnLevel(level, origin, target, shape)`
  (versions hex comprises : `hexConeCells`).
- `coneCells(origin, target, width)` / `hexConeCells`, `traceLine`, `hasLineOfSight`, `canTarget`,
  `chebyshevDistance`, `knockbackPath`, `chainTargets`, `rangeMultiplier`, `areaFalloffMultiplier`
  (dégradation par bandes de distance — exactement `Ballistica`'s falloff côté Java).
- `MultiTurnBeam` : `{ level, from, target, damage: number | (target, ctx) => number, targetsAt, applyDamage, isBlocked, stopAtOpaque }`, `start()`/`advance()`/`cancel()`, `toJSON()`/`fromJSON()`,
  `BeamDamageContext = { cell, step, remaining }`.
- `Blob` : `seed(x,y,amount)`, `clear(x,y)`, `volumeAt`, `total()`, `cellsAbove(min)`, et surtout
  **`spread(open, spread?, decay?)`** — `spread = 0` + `decay < 1` donne exactement le `FireBlob`
  de Java (décroissance sur place), `decay = 1` conserve et ne fait que déplacer.

## 2. Ce qui manque : faisceaux multi-tours multi-géométries

Le seul trou réel : **`MultiTurnBeam` capture `traceLine(from, target)`** — donc une droite — alors
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
  plusieurs tours soient de vrais acteurs — c'est ce qui permettra de supprimer les champs
  persistés à la main (`tenguFire`, `yogTargeted`) au profit d'acteurs sérialisés par le
  `Scheduler.toJSON()`, qui existe déjà.

## 3. Flamage : ce que Java fait exactement

- **Flamable = trois terrains**, pas plus : `Terrain.flags[GRASS | HIGH_GRASS | FURROWED_GRASS] = PASSABLE | FLAMABLE` ; `Level.buildFlagMaps()` en dérive un tableau `level.flamable[]`.
  Plus une exception de niveau : sur `SewerLevel`, `REGION_DECO` et `REGION_DECO_ALT` sont **forcés** flamables (`if (this instanceof SewerLevel) flamable[cell] = true`).
  **Les portes ne sont pas flamables** (`DOOR` n'a pas le flag) — le test du faisceau de Yog dans le port est donc trop large.
- **Tout le flamage passe par un seul type de blob** : `Blob.seed(cell, volume, Fire.class)`.
  - `WandOfFireblast` : `1 + chargesPerCast()` sur la cellule d'impact (avec un garde `!flamable && !solid` quand il rebondit) et propagation aux voisins **flamables** où `Fire.volumeAt == 0`.
  - `PotionOfLiquidFlame` : volume `2` par cellule, **sans** test de flamabilité (le feu prend sur toute cellule franchissable).
  - `YogDzewa.beam` : `if (Dungeon.level.flamable[p])` → allume le long du rayon.
- **C'est `Fire.evolve()` qui brûle le terrain**, pas les objets qui l'allument :
  1. il se propage dans les cellules flamables voisines ;
  2. quand le volume d'une cellule flamable tombe à 0 → `burn(cell)` : le terrain devient `EMBERS`, l'occupant prend `Burning.reignite()`, et `heap.burn()` brûle les objets au sol ;
  3. `EMBERS` est `PASSABLE` **mais pas `FLAMABLE`** — les braises ne se rallument pas.
- Donc « le flamage utilisable par les baguettes et potions » = **un tableau flamable + un blob qui décroît sur place + un crochet de fin de combustion**. Les nombres et les volumes restent au port (règle de licence : aucune donnée SPD dans `mwg`).

## 4. Ce que le cadre doit gagner pour le flamage

1. **Rien pour l'ensemble flamable lui-même.** Le port tient sa propre table (il a ses propres ids de terrain et `Level.terrain` est un `Uint8Array` indexant `kinds`) : `const FLAMABLE = new Set([GRASS, HIGH_GRASS, FURROWED_GRASS, REGION_GRASS])`. C'est exactement la forme de Java (`Terrain.flags` → `Level.flamable`). `TerrainKind.flags` (0.7.4) permettrait de coller le bit au genre et de supprimer la table parallèle — souhaitable, **pas nécessaire**, à faire quand 0.7.4 sera publié.
2. **Un crochet de fin de combustion sur `Blob`** — le seul vrai manque. Aujourd'hui le jeu doit
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

1. **Bug de fidélité** : `fireYogDeathGaze` allume `[GRASS, HIGH_GRASS, DOOR, DOOR_CLOSED]` — retirer les deux portes, ajouter `FURROWED_GRASS` (l'herbe haute piétinée, toujours flamable) et `REGION_GRASS` (l'équivalent du cas `SewerLevel`/`REGION_DECO`).
2. **Blocage structurel** : `gameBridge.ts` réduit `EMBERS → floor`, donc les braises sont aujourd'hui *irreprésentables* dans le niveau vivant. Tant que ce n'est pas un genre à part (passable, non flamable, avec son art), le flamable ne peut pas être bouclé de bout en bout.
3. **Décroissance du feu** : le blob du port diffuse avec la décroissance par défaut ; Java décroît sur place. `this.fire.spread(open, 0, decay)` est disponible **dès 0.7.3** — à aligner *avant* de brancher le flamable, sinon la durée du feu et le moment du `burn` seront faux.
4. **Le brûlage des objets au sol** (`heap.burn()`) n'a pas de primitive dans le port : reste non porté, à déclarer.
5. **Pas de nouvelle dette** : le cône de Tengu ne doit pas être réécrit pour `MultiTurnBeam` une fois §2 fait — sa règle d'étalement (3 cellules par cellule source, dédoublonnage de l'anneau précédent, garde « le feu brûle encore ») est plus étroite qu'une forme générique ; le bon remplacement est un `beamFronts` avec un **générateur fourni par le jeu**, pas une des quatre formes.

## 6. Ce qui reste nécessaire au-delà des faisceaux et du feu

Par ordre de valeur pour la roadmap :

1. **Acteurs temporaires priorisés** (§2.5) — débloque Shocker, télégraphe de Yog, séquence des pylônes DM-300, et supprime les champs persistés à la main.
2. **Crochet de fin de combustion** (§4.2) — débloque tout le flamable (herbe → braises), le Wand of Fireblast et la Potion of Liquid Flame au-delà du simple seed.
3. **Effet visuel d'arc** (`Lightning`) : un helper `two-d/render` pour un trait de foudre entre deux points, temporisé — le Shocker en a besoin, le port n'a rien d'équivalent (il a des `Label`/`Sprite` et le rendu du feu).
4. **`TerrainKind.flags`/`extras`** (0.7.4) — supprime la table flamable parallèle ; optionnel.
5. **Occupation multi-cellules** : DM-300 et les poings de Yog occupent une cellule en Java aussi (`Char` = 1 cellule), donc **rien à faire** — c'est le *rendu* qui est plus grand, pas la logique. À ne pas ajouter au cadre.
6. **`BeamLine`/`BeamGeometry` exportés** depuis `mwg/roguelike` : `beamFronts` (§2.1) plus `Ballistica`-style stop modes (`stop`, `skip`, `wontStop`) nommés, pour que la sémantique de §2.2 soit lisible dans le code du jeu.

## 7. Ordre d'implémentation proposé

1. Port : table `FLAMABLE` + `EMBERS` comme vrai genre + `fire.spread(open, 0, decay)` + `burn()` (herbe → braises, occupant, heap si un jour). Vérifiable seul, sans toucher au cadre.
2. Cadre : `onBurnout` sur `Blob.spread` (3 lignes + test). Publié en 0.7.5 ou avec 0.7.4 s'il n'est pas encore publié.
3. Cadre : `beamFronts` + `MultiTurnBeam` par fronts + `blockers: 'stop' | 'skip'` + `onCell` + save par identité de forme (0.7.5, avec des tests par forme et un aller-retour de sauvegarde).
4. Port : réécrire le faisceau de Yog (`line` + `onCell` flamable) puis le Shocker (`burst` par parité) sur le nouveau faisceau, et supprimer les champs `yogTargeted`/`tenguFire` au profit d'acteurs quand la priorité du `Scheduler` sera publiée.
5. Retirer les deux portes de la liste flamable **immédiatement** (c'est un bug, pas une attente).
