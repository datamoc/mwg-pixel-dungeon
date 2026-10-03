import { readFileSync, writeFileSync } from 'node:fs';
const fail = (m) => { console.error('EDIT MISS: ' + m); process.exit(1); };
const p = 'src/items/holyTome.ts';
const t = readFileSync(p, 'utf8');
const E = '\n';
let out = t;

// 0. Creature type import + powered-ally context member.
{
  const anchor = "import type { Step } from '../combat';";
  if (!out.includes(anchor)) fail('combat import');
  out = out.replace(anchor, "import type { Creature, Step } from '../combat';");
  const ctxAnchor = '\t/** The level\'s diagonal span - the uncapped rays borrow it like the armor-ability aim. */' + E + '\treadonly levelSpan: () => number;';
  if (!out.includes(ctxAnchor)) fail('ctx span');
  out = out.replace(ctxAnchor, ctxAnchor + E + '\t/** The live powered ally, if any (`PowerOfMany.getPoweredAlly`). */' + E + '\treadonly poweredAlly: () => Creature | undefined;');
}

// 1. Import BEAMING_RAY_COST (after HOLY_LANCE_COST in the cost list).
{
  const anchor = 'HOLY_LANCE_COST, JUDGEMENT_COST,';
  if (!out.includes(anchor)) fail('import list');
  out = out.replace(anchor, 'HOLY_LANCE_COST, BEAMING_RAY_COST, JUDGEMENT_COST,');
}
// 2. Spell-key fragment for picker labels.
{
  const anchor = ": spell === 'flash' ? 'flash' : 'auraofprotection';";
  if (!out.includes(anchor)) fail('spell key');
  out = out.replace(anchor, ": spell === 'flash' ? 'flash' : spell === 'beamingRay' ? 'beamingray' : 'auraofprotection';");
}
// 3. Picker cost.
{
  const anchor = "if (spell === 'flash') return flashCost(0);";
  if (!out.includes(anchor)) fail('picker cost');
  out = out.replace(anchor, anchor + E + "if (spell === 'beamingRay') return BEAMING_RAY_COST;");
}
// 4. T4 picker row after Flash (Java getSpellList tier-4 order).
{
  const anchor = "if (ctx.ascendedActive() && ctx.talentRank('flash') > 0) rows.push({ spell: 'flash', affordable: charge >= flashCost(ctx.ascendedFlashCasts()) });";
  if (!out.includes(anchor)) fail('picker row');
  out = out.replace(anchor, anchor + E + "if (ctx.talentRank('beaming_ray') > 0) rows.push({ spell: 'beamingRay', affordable: charge >= BEAMING_RAY_COST });");
}
// 5. Cast dispatch.
{
  const anchor = "else if (spell === 'flash') castFlashFlow(ctx, instanceId);";
  if (!out.includes(anchor)) fail('dispatch');
  out = out.replace(anchor, anchor + E + "else if (spell === 'beamingRay') castBeamingRayFlow(ctx, instanceId);");
}
// 6. Context method declaration.
{
  const anchor = 'resolveFlash(cell: Step, instanceId?: string): void;';
  if (!out.includes(anchor)) fail('ctx decl');
  out = out.replace(anchor, anchor + E + '\t/** Scene-side BeamingRay resolution (ally teleport + boost, turn, charge). */' + E + '\tresolveBeamingRay(cell: Step, instanceId?: string): void;');
}
// 7. Cast flow after castFlashFlow (anchor on its closing + next doc comment).
{
  const anchor = "\tctx.beginSpellAim((cell) => ctx.resolveFlash(cell, instanceId), 2 + ctx.talentRank('flash'));" + E + '}';
  if (!out.includes(anchor)) fail('flash flow end');
  const add = [
    '',
    '/**',
    ' * `BeamingRay.onCast()` (`TargetedClericSpell`, tag `v3.3.8`): the talent, a live',
    ' * powered ally (Java also accepts a stasis ally - the Stasis spell is unported, so',
    ' * that half stays closed), and the purse re-check, then the cell selector. The',
    ' * range and target rules live at confirm time (`resolveBeamingRay`).',
    ' */',
    'export function castBeamingRayFlow(ctx: HolyTomeContext, instanceId?: string): void {',
    '\tconst tome = findHolyTome(ctx.bag, instanceId);',
    '\tif (!tome) return;',
    "\tif (ctx.talentRank('beaming_ray') <= 0 || !ctx.poweredAlly()",
    '\t\t|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? tomeChargeCap(tome.level ?? 0), BEAMING_RAY_COST) !== \'ok\') {',
    "\t\tctx.say(ctx.t('port.log.tomenospell'), 'negative');",
    '\t\treturn;',
    '\t}',
    '\tctx.beginSpellAim((cell) => ctx.resolveBeamingRay(cell, instanceId), ctx.levelSpan());',
    '}',
  ].join(E);
  out = out.replace(anchor, anchor + E + add);
}
writeFileSync(p, out);
console.log('holyTome.ts updated');
