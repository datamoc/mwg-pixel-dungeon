import { readFileSync, writeFileSync } from 'node:fs';
const fail = (m) => { console.error('EDIT MISS: ' + m); process.exit(1); };
const p = 'src/scenes/dungeon/hero/clericSpellFlows.ts';
const t = readFileSync(p, 'utf8');
const E = '\r\n';
let out = t;

// 1. Imports: runState (beam sound), TILE (beam endpoints), IMMOVABLE set,
//    neighbour offsets, BeamingRay numbers, Creature type.
{
  const a = "import { isUndeadOrDemonic } from '../../../monsters';";
  if (!out.includes(a)) fail('monsters import');
  out = out.replace(a, "import { IMMOVABLE_KINDS, isUndeadOrDemonic, type MonsterId } from '../../../monsters';");
  const b = "import { addBuff, BUFF_DURATION, doomDamage, NEGATIVE_BUFFS, type BuffId } from '../../../combat';";
  if (!out.includes(b)) fail('combat import');
  out = out.replace(b, "import { addBuff, BUFF_DURATION, doomDamage, NEGATIVE_BUFFS, type BuffId, type Creature } from '../../../combat';");
  const c = "import { t } from '../../../i18n/index';";
  if (!out.includes(c)) fail('i18n import');
  out = out.replace(c, c + E + "import { runState } from '../../../runState';"
    + E + "import { TILE } from '../../../dungeonConstants';"
    + E + "import { CIRCLE8_OFFSETS } from '../../../simulation/wandering';");
  const d = 'LAY_ON_HANDS_COST, LAY_ON_HANDS_SHIELD_CASTS,';
  if (!out.includes(d)) fail('cost import');
  out = out.replace(d, 'LAY_ON_HANDS_COST, LAY_ON_HANDS_SHIELD_CASTS, BEAMING_RAY_COST, BEAMING_RAY_BOOST_TURNS,');
  const e = 'flashCost, flashRange, hallowedGroundRadius,';
  if (!out.includes(e)) fail('fn import');
  out = out.replace(e, 'beamingRayBoostFactor, beamingRayRange, flashCost, flashRange, hallowedGroundRadius,');
}

// 2. resolveBeamingRay between resolveFlash and resolveRadiance.
{
  const anchor = '\t/**' + E + '\t * `Radiance.onCast()`';
  if (!out.includes(anchor)) fail('radiance anchor');
  const fn = [
    '\t/**',
    '\t * `BeamingRay.onCast()` (`actors/hero/spells/BeamingRay.java`, tag `v3.3.8`):',
    '\t * the powered ally (Java also accepts a Cleric `Stasis` ally - that spell is',
    '\t * unported, so the stasis arm and its LifeLink prolong stay closed) teleports',
    '\t * beside the target cell, acquires the cell enemy (or the nearest enemy within',
    '\t * 4 of the landing), and gains the 10-turn `BeamingRayBoost` carrying that',
    '\t * enemy id - which later swaps its 1.25x roll factor for `1.3+0.05xBEAMING_RAY`.',
    '\t * Range is `4*points` from the ally (halved for IMMOVABLE allies); a solid,',
    '\t * unseen, or occupied target falls back to the nearest free visible neighbour',
    '\t * to the ally. Presentation follows the port\'s aimed-spell precedents: the',
    '\t * `SunRay` beam overlay plus the `zap` cue (no `sprite.zap`), the teleport',
    '\t * appear plus the shared teleported-destination handling, and the turn/charge',
    '\t * tail. Refusals spend nothing.',
    '\t */',
    '\tresolveBeamingRay(this: DungeonScene, cell: Step, instanceId?: string): void {',
    '\t\tconst tome = findHolyTome(this.bag, instanceId);',
    '\t\tconst rank = this.talentRank(\'beaming_ray\');',
    '\t\tconst ally = this.poweredAlly();',
    '\t\tif (!tome || rank <= 0 || !ally',
    '\t\t\t|| tomeCastGate(tome.cursed === true, this.hero.magicImmune === true, tome.charge ?? tomeChargeCap(tome.level ?? 0), BEAMING_RAY_COST) !== \'ok\') {',
    '\t\t\tthis.say(t(\'port.log.tomenospell\'), \'negative\');',
    '\t\t\treturn;',
    '\t\t}',
    '\t\tif (!this.level.inside(cell.x, cell.y)) {',
    '\t\t\tthis.say(t(\'actors.hero.spells.beamingray.no_space\'), \'negative\');',
    '\t\t\treturn;',
    '\t\t}',
    '\t\t//Landing spot: the target cell, else the nearest free visible neighbour',
    '\t\t//to the ally. Java also accepts an avoid-map flyer cell; the port has no',
    '\t\t//avoid map, so passable-only stands (stated simplification).',
    '\t\tconst occupant = this.creatureAt(cell.x, cell.y);',
    '\t\tlet landing: Step | undefined = !this.level.solid(cell.x, cell.y)',
    '\t\t\t&& this.fov.isVisible(cell.x, cell.y) && !occupant ? { x: cell.x, y: cell.y } : undefined;',
    '\t\tif (!landing) {',
    '\t\t\tlet best: Step | undefined;',
    '\t\t\tlet bestDist = Infinity;',
    '\t\t\tfor (const [dx, dy] of CIRCLE8_OFFSETS) {',
    '\t\t\t\tconst x = cell.x + dx, y = cell.y + dy;',
    '\t\t\t\tif (!this.level.inside(x, y) || this.creatureAt(x, y)',
    '\t\t\t\t\t|| !this.fov.isVisible(x, y) || !this.level.passable(x, y)) continue;',
    '\t\t\t\tconst d = Roguelike.chebyshevDistance(ally, { x, y });',
    '\t\t\t\tif (d < bestDist) { bestDist = d; best = { x, y }; }',
    '\t\t\t}',
    '\t\t\tlanding = best;',
    '\t\t}',
    '\t\tif (!landing) {',
    '\t\t\tthis.say(t(\'actors.hero.spells.beamingray.no_space\'), \'negative\');',
    '\t\t\treturn;',
    '\t\t}',
    '\t\tlet range = beamingRayRange(rank);',
    '\t\tif (ally.kind !== undefined && IMMOVABLE_KINDS.has(ally.kind as MonsterId)) range = range / 2;',
    '\t\tif (Roguelike.chebyshevDistance(ally, landing) > range) {',
    '\t\t\tthis.say(t(\'actors.hero.spells.beamingray.out_of_range\'), \'negative\');',
    '\t\t\treturn;',
    '\t\t}',
    '\t\t//Enemy acquisition: the target-cell occupant when hostile, else the nearest',
    '\t\t//hostile within 4 of the landing (nearest to the ally, Java\'s trueDistance',
    '\t\t//reads as the port\'s chebyshev here - monotonic for ordering).',
    '\t\tlet chTarget = occupant !== undefined && this.isHostileToAlly(occupant) ? occupant : undefined;',
    '\t\tif (!chTarget) {',
    '\t\t\tlet best: Creature | undefined;',
    '\t\t\tlet bestDist = Infinity;',
    '\t\t\tfor (const c of this.creatures) {',
    '\t\t\t\tif (!this.isHostileToAlly(c)) continue;',
    '\t\t\t\tif (Roguelike.chebyshevDistance(landing, c) > 4) continue;',
    '\t\t\t\tconst d = Roguelike.chebyshevDistance(ally, c);',
    '\t\t\t\tif (d < bestDist) { bestDist = d; best = c; }',
    '\t\t\t}',
    '\t\t\tchTarget = best;',
    '\t\t}',
    '\t\tif (chTarget !== undefined && this.subclass() === \'priest\') {',
    '\t\t\taddBuff(chTarget, \'illuminated\');',
    '\t\t\taddBuff(chTarget, \'wasIlluminated\');',
    '\t\t}',
    '\t\t//`Beam.SunRay` plus `Assets.Sounds.RAY`: the port\'s beam overlay and zap cue.',
    '\t\tconst sprite = this.sprite(ally);',
    '\t\tthis.zapBeams.push({',
    '\t\t\tx1: sprite.x + sprite.width / 2, y1: sprite.y + sprite.height / 2,',
    '\t\t\tx2: (landing.x + 0.5) * TILE, y2: (landing.y + 0.5) * TILE,',
    '\t\t\ttimeLeft: 1, duration: 1, color: 0xffff44,',
    '\t\t});',
    '\t\trunState.audio.cue(\'zap\');',
    '\t\tconst from = { x: ally.x, y: ally.y };',
    '\t\tally.x = landing.x;',
    '\t\tally.y = landing.y;',
    '\t\tsprite.x = landing.x * TILE;',
    '\t\tsprite.y = landing.y * TILE;',
    '\t\tthis.playTeleportAppear(from, landing, ally);',
    '\t\tthis.occupyTeleportedCharacter(ally);',
    '\t\t//Direct the ally onto its mark: the four orderable kinds take the standing',
    '\t\t//attack order (Java `DirectableAlly.targetChar`); any other empowered mob',
    '\t\t//is aggroed onto the mark instead (Java `Mob.aggro`, the R103 `lastSeen`',
    '\t\t//precedent). With no mark the orderable kinds stand down (Java',
    '\t\t//`clearDefensingPos`); nothing persists - hunt orders reset on load like',
    '\t\t//every other `directAlly` order, while the boost target id below persists',
    '\t\t//for the damage variant.',
    '\t\tconst orderable = ally.allyKind === \'ghost\' || ally.allyKind === \'spiritHawk\'',
    '\t\t\t|| ally.allyKind === \'lightAlly\' || ally.allyKind === \'shadowClone\';',
    '\t\tif (chTarget !== undefined) {',
    '\t\t\tif (orderable) {',
    '\t\t\t\tally.allyDefendCell = undefined;',
    '\t\t\t\tally.allyMovingToDefend = false;',
    '\t\t\t\tally.allyTargetChar = chTarget;',
    '\t\t\t} else {',
    '\t\t\t\tally.lastSeen = { x: chTarget.x, y: chTarget.y };',
    '\t\t\t}',
    '\t\t} else if (orderable) {',
    '\t\t\tally.allyDefendCell = undefined;',
    '\t\t\tally.allyMovingToDefend = false;',
    '\t\t\tally.allyTargetChar = undefined;',
    '\t\t}',
    '\t\t//`affect(ally, BeamingRayBoost.class).object = ...` (only when marked) then',
    '\t\t//`prolong(ally, BeamingRayBoost.class, DURATION)` - re-cast refreshes.',
    '\t\taddBuff(ally, \'beamingRayBoost\', BEAMING_RAY_BOOST_TURNS);',
    '\t\tif (chTarget !== undefined) ally.beamingRayTarget = chTarget.id;',
    '\t\telse delete ally.beamingRayTarget;',
    '\t\tif (this.hero.buffs[\'invisibility\'] !== undefined) delete this.hero.buffs[\'invisibility\'];',
    '\t\tthis.actionSpentTurn = true;',
    '\t\tthis.spendHeroTurn(1);',
    '\t\tthis.consumeSatiatedSpells();',
    '\t\tthis.spendTomeForCast(tome, BEAMING_RAY_COST, \'beamingRay\');',
    '\t},',
    '',
  ].join(E);
  out = out.replace(anchor, fn + anchor);
  writeFileSync(p, out);
  console.log('clericSpellFlows.ts updated');
}
