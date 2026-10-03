import { readFileSync, writeFileSync } from 'node:fs';

const A = "'"; // ROADMAP/coverage use ASCII apostrophes

// 1. PowerOfMany coverage row: append the R105 clause.
{
  const p = 'coverage/rows-monsters-bosses-and-combat.md';
  const t = readFileSync(p, 'utf8');
  const oldTail = 'observed `PowerBuff`/Barrier state plus the expected charge spend. |';
  const clause = 'observed `PowerBuff`/Barrier state plus the expected charge spend.'
    + ' **Ported (R105, 2026-09-30):** both `PowerBuff` damage factors now sit at Java' + A + 's own'
    + ' pre/post-DR order (`Char.java`, tag `v3.3.8`): a powered ally' + A + 's 1.25x folds into the roll'
    + ' multiplier at the `attack()` call site (`powerAllyMult` in `combatResolution.ts`), ahead of armor'
    + ' like Java' + A + 's pre-`defenseProc` float chain - the old post-DR `Math.round` tail copy rounded'
    + ' differently whenever armor absorbed anything, and the second copy on the T61 `scaleAttackDamage`'
    + ' seam is gone so wiring it later cannot double-apply. A powered defender' + A + 's cut'
    + ' (`powerOfManyDamageFactor`: 0.75x, or `0.70-0.05xLIFE_LINK` with the link buff) runs in the shared'
    + ' `applyCharacterDamage` dispatch between Aura and Doom, Java' + A + 's own `Char.damage()` order (aura 851-858,'
    + ' PowerBuff 860-866, Doom after), so every non-attack source carries it; the two `attack()` tails keep'
    + ' their own copy because the attack core resolves outside the dispatch, and the unwired T61'
    + ' `applyBossSoaks` copy is kept mirrored, not deleted. Java' + A + 's BeamingRay-boost attacker variant'
    + ' (1.3x+0.05x/rank) stays unported with the rest of that spell (R108). Pinned by the R105 `verifyCombat`'
    + ' check (roll-fold match, both post-DR absences, dispatch order match). |';
  if (!t.includes(oldTail)) { console.error('ROW ANCHOR MISS'); process.exit(1); }
  writeFileSync(p, t.replace(oldTail, clause));
  console.log('coverage row updated');
}

// 2. ROADMAP R105 -> closed; 3. new R108 inserted before Definition of done.
{
  const p = 'ROADMAP.md';
  const t = readFileSync(p, 'utf8');
  const oldR105 = '- [ ] **R105** _(Shared attack/damage modifiers missing from dispatch)_ **Split from R103 (2026-09-30):** across attack callers, audit and implement Java' + A + 's attacker-side Berserk/Fury/Weakness/Endure/StoneOfAggression damage modifiers (`Char.attack()` / `Hero.damageRoll()`) and defender-side `PowerOfMany.PowerBuff` factor (`Char.damage()`, `Char.java:860-866`). R103 now covers Spirit Bow' + A + 's applicable `defenseProc`/`Char.damage()` seams; these modifiers affect broader shared dispatch and need a separate pass with the correct pre/post-DR order.';
  const newR105 = '- [x] **R105** _(Shared attack/damage modifiers missing from dispatch)_ **Closed 2026-09-30:** the audit found every named attacker modifier already at pre-DR order - Berserk/Fury/Weakness/Aggression in the shared `simulation/combat.ts` roll, Endure' + A + 's tracker halves on the hero seams - so the slice ported the two genuinely missing `PowerBuff` halves: the powered ally' + A + 's 1.25x folds into the roll multiplier ahead of armor (`combatResolution.ts`), and the powered defender' + A + 's cut runs in the shared `applyCharacterDamage` dispatch between Aura and Doom (`panelsSingleUse.ts`), matching `Char.java`' + A + 's own order at tag `v3.3.8`. Pinned by the R105 `verifyCombat` check; row `rows-monsters-bosses-and-combat.md:6`. BeamingRay' + A + 's own boost variant stays open as R108.';
  if (!t.includes(oldR105)) { console.error('R105 ANCHOR MISS'); process.exit(1); }
  let out = t.replace(oldR105, newR105);
  const r108 = '- [ ] **R108** _(Cleric `BeamingRay` spell incl. its `PowerBuff` boost variant)_ **Found by R105 (2026-09-30):** Java' + A + 's `Char.attack()` multiplies a powered ally' + A + 's roll by `1.3+0.05xBEAMING_RAY` rank when its `BeamingRayBoost.object` is the target, instead of the plain 1.25x - this port has no BeamingRay cast, buff, or boost tracker, so the plain factor applies unconditionally (see the R105 clause in `rows-monsters-bosses-and-combat.md:6`). The spell' + A + 's own cast/beam presentation is unported with it.\n';
  const doneMarker = '\n## Definition of done';
  if (!out.includes(doneMarker)) { console.error('DONE ANCHOR MISS'); process.exit(1); }
  out = out.replace(doneMarker, '\n' + r108 + '## Definition of done');
  writeFileSync(p, out);
  console.log('roadmap updated');
}
