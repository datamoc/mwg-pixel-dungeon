# Inventaire : tout ce qui peut prendre feu dans SPD `v3.3.8`

Relevé dans le Java, avec citations. Sert de référence au chantier « flamable » du port (voir
`tools/scratch/mwg-proposal/GEOMETRY-AND-FIRE.md`), et de base aux divergences délibérées: **notre
version ne réimplémente pas les bogues ni les limitations de Java** (voir la politique en fin de
document).

## 1. Terrains combustibles (`Terrain.flags & FLAMABLE`)

`FLAMABLE = 0x04` (`levels/Terrain.java:74`). Les seuls terrains qui le portent :

| Terrain | Flags | Source |
|---|---|---|
| `GRASS` | `PASSABLE \| FLAMABLE` | `Terrain.java:85` |
| `DOOR` | `PASSABLE \| LOS_BLOCKING \| FLAMABLE \| SOLID` | `Terrain.java:89` |
| `OPEN_DOOR` | `PASSABLE \| FLAMABLE` | `Terrain.java:90` |
| `BARRICADE` (barricade **en bois**) | `FLAMABLE \| SOLID \| LOS_BLOCKING` | `Terrain.java:100` |
| `HIGH_GRASS` | `PASSABLE \| LOS_BLOCKING \| FLAMABLE` | `Terrain.java:102` |
| `FURROWED_GRASS` (herbe haute piétinée) | `= flags[HIGH_GRASS]` | `Terrain.java:103` |
| `EMBERS` | `PASSABLE` **seulement** - les braises ne se rallument pas | `Terrain.java:94` |

Trois façons dont un terrain devient combustible **sans** porter le flag :

1. **Toile d'araignée** : tant qu'un blob `Web` a du volume, il force à chaque mise à jour
   `l.solid[cell] = true` **et** `l.flamable[cell] = true` (`actors/blobs/Web.java:101-106`). La
   toile bloque le passage *et* brûle.
2. **`SewerLevel`** : le niveau force `flamable[i] = true` sur ses décors (`levels/SewerLevel.java:191`,
   les `REGION_DECO`/`REGION_DECO_ALT` - le flag de `REGION_DECO` est celui de `STATUE`, c'est donc
   le niveau, pas le terrain, qui les rend combustibles).
3. **Portes/cases vides détruites** : `Level.destroy()` traite aussi `EMPTY`/`EMPTY_DECO` comme
   destructibles (`Level.java:900-911`).

`Level.flamable[]` est un **cache par cellule**, rempli depuis les flags (`Level.java:835`, `:954`) et
rafraîchi à chaque `Level.set()` - donc poser ou changer un terrain met le flag à jour tout seul.

## 2. Ce que le feu fait au terrain

`Fire.evolve()` (`actors/blobs/Fire.java:39-97`) :

- une cellule **en feu** appelle `burn(cell)` (voir §4) puis, si son volume tombe à 0 **et** qu'elle
  est combustible, `Dungeon.level.destroy(cell)` + `GameScene.updateMap(cell)` → **le terrain devient
  `EMBERS`** ;
- une cellule **combustible vide** voisine (orthogonale) d'une cellule en feu reçoit `fire = 4` et
  `burn(cell)` → **la propagation** ;
- un blob `Freezing` qui recouvre une cellule en feu l'éteint (`freeze.clear(cell)`, volume à 0).

`Level.destroy(pos)` (`Level.java:900-911`) : si le terrain est `EMPTY`, `EMPTY_DECO` ou combustible →
`set(pos, Terrain.EMBERS)`, puis il **efface la toile** éventuelle (`web.clear(pos)`). Une porte, une
barricade ou de l'herbe finissent donc **toutes en braises**.

## 3. Personnages : qui prend feu, qui non

`Fire.burn(pos)` (`Fire.java:99-114`) : tout `Char` de la cellule **qui n'est pas immunisé au feu**
reçoit `Buff.affect(ch, Burning.class).reignite(ch)`.

- **Immunisés** : `isImmune(Fire.class)` → les porteurs de `Property.FIERY` :
  `actors/mobs/Elemental.java`, `actors/mobs/YogFist.java`, `actors/blobs/StormCloud.java`,
  `levels/traps/GeyserTrap.java` (plus Tengu, immunisé dans son propre `FireBlob`).
- **L'eau éteint** : `Burning.act()` détache le buff si le porteur est **dans l'eau et ne vole pas**
  (`actors/buffs/Burning.java:94-95`, et la même condition garde l'allumage du sol en `:169`) →
  « sauf dans l'eau », et un personnage *volant* brûle même au-dessus de l'eau.
- **Un personnage qui brûle allume le sol** : s'il est sur un terrain combustible et qu'il n'y a pas
  encore de feu, il sème `Fire` volume **4** (`Burning.java:161-162`).
- **Le héros brûle aussi son sac** : `Burning.act()` détache un objet tirable du sac
  (`Burning.java:~126`, `Random.element(burnable).detach(hero.belongings.backpack)`).

## 4. Objets au sol, plantes

`Fire.burn(pos)` (`Fire.java:99-114`) traite trois choses par cellule en feu :

1. le `Char` de la cellule (§3) ;
2. le tas d'objets : `Heap.burn()` ;
3. la plante : `Plant.wither()` → **les plantes brûlent** (donc les graines plantées).

`Heap.burn()` (`items/Heap.java:212-260`), uniquement pour les tas de type `HEAP` :

| Objet | Effet |
|---|---|
| `Scroll` non-unique | détruit |
| `Dewdrop` | évaporé |
| `MysteryMeat`, `FrozenCarpaccio` | **remplacés par `ChargrilledMeat`** (la viande cuit) |
| `Bomb` | `explode(pos)` ; si l'explosion est destructive, le brûlage s'arrête là |
| tout le reste | **intact** (pas de potions, pas de conteneurs) |

## 5. Qui peut allumer un feu (les lecteurs de `level.flamable`)

Chaque foyer passe par le **même** primitif, `Blob.seed(cell, volume, Fire.class)` :

| Allumeur | Source |
|---|---|
| `Fire` (propagation + allumage du sol par un personnage qui brûle) | `blobs/Fire.java`, `buffs/Burning.java:161` |
| `Inferno` (feu éternel de Yog) | `blobs/Inferno.java:60,67` |
| `VaultFlameTraps` (voûte finale) | `blobs/VaultFlameTraps.java:104` |
| `Web` (déclare le terrain combustible) | `blobs/Web.java:105` |
| `WandOfFireblast` | `items/wands/WandOfFireblast.java:104,130` |
| `WandOfDisintegration` | `items/wands/WandOfDisintegration.java:108` |
| `CursedWand` | `items/wands/CursedWand.java:821` |
| `PotionOfDragonsBreath` | `items/potions/exotic/PotionOfDragonsBreath.java:175,194` |
| `Bomb` (l'explosion allume le combustible autour) | `items/bombs/Bomb.java:159,176` |
| `IncendiaryDart` | `items/weapon/missiles/darts/IncendiaryDart.java:43` |
| `Tengu.FireAbility.FireBlob` | `actors/mobs/Tengu.java:891` |
| `YogDzewa` (faisceau) | `actors/mobs/YogDzewa.java:206` |
| `Eye` | `actors/mobs/Eye.java:180` |
| `GnollTrickster` | `actors/mobs/GnollTrickster.java:93` |
| `ElementalBlast` (talent de mage) | `actors/hero/abilities/mage/ElementalBlast.java:225` |
| `MagicalFireRoom` (mur de feu) | `levels/rooms/special/MagicalFireRoom.java:212` |

Et **ce qui n'allume rien** : les gaz. `ToxicGas` n'a aucune interaction avec le feu à `v3.3.8`
(vérifié : aucun `Fire.class`/`flamable`/détonation dans le fichier) - pas d'explosion de gaz à
reproduire, donc.

## 6. Bogues et limitations de Java que nous ne reproduirons pas (à confirmer)

1. **Le feu de Tengu ne brûle pas le terrain.** `Tengu.FireAbility.FireBlob.evolve()`
   (`actors/mobs/Tengu.java:~1000`) décrémente et allume les personnages, mais n'appelle **jamais**
   `Level.destroy()` et ne se propage pas au combustible : le cône de feu de Tengu laisse l'herbe et
   les portes intactes, là où un feu ordinaire les réduit en braises. Incohérence, pas intention :
   nous le ferons brûler le terrain comme le feu ordinaire.
2. **Rien n'est conservé du passage du feu** pour les objets : `Heap.burn()` ne traite ni les potions
   ni le contenu des conteneurs (un feu sous une caisse ne l'atteint pas, alors que `Heap.explode()`
   l'ouvre). Divergence possible : les conteneurs brûlent aussi, en gardant `explode()` pour les
   explosions.
3. **Un personnage en feu ne s'éteint pas en entrant dans l'eau s'il « vole »** - conservé tel quel
   (c'est une règle de design, pas un bogue), mais à noter parce que ça surprend.
4. **Le contrôle de l'eau se fait sur `acted`** (`Burning.act()`), donc un porteur qui ne joue pas son
   tour (étourdi, en pause) brûle sans être éteint par l'eau où il se trouve ; nous nous éteindrons
   dès qu'il est dans l'eau.
5. Coquilles de nommage conservées pour mémoire : `flamable` (Java) et non `flammable` - notre code
   garde l'orthographe de Java dans les citations, mais nommera `flammable` ce qui nous appartient.

## 7. Politique de fidélité (décidée 2026-09-11)

- **L'objectif n'est plus l'iso avec Java.** Evan Debenham ne prend pas nos correctifs : il n'y a donc
  plus de raison de reproduire ses bogues, et chaque divergence assumée est un mieux, pas une dette.
- Ce qui **reste** obligatoire : documenter chaque divergence (commentaire au point de divergence +
  ligne `PORT_COVERAGE.md`) - mais la colonne devient **`Ported` / `Simplified` / `Not ported` /
  `Divergence (deliberate)`**, cette dernière portant la raison *et* ce que fait Java à la place.
- Ce qui change : une limitation de Java n'est plus une excuse pour la nôtre. Si notre version peut
  faire mieux sans coût, elle le fait et le documente.
- Les valeurs et formules restent lues dans la source de Java (règle de licence), et les assets
  restent copiés tels quels ; ce qui change est le **comportement**, pas la provenance des données.
