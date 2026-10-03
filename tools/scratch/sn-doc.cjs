const fs=require('fs');
function rep(p,a,b){let s=fs.readFileSync(p,'utf8');const i=s.indexOf(a);if(i<0)throw new Error(a);s=s.slice(0,i)+b+s.slice(i+a.length);fs.writeFileSync(p,s);}
const r='coverage/rows-items-equipment-and-artifacts.md';
rep(r,"**Ported:** `ForestFire`","**Ported:** `SuperNova` (2026-09-28: `superNova` scene state, saved and loaded; ten hero-action countdown, then a `ConjuredBomb` on every visible non-solid cell within radius 8 through the shared `explodeConjuredBomb`, live-checked: hero at centre lost 208 of 500 HP. **Simplified:** ticks per hero action on the same floor, not per actor time unit; no halo/floating countdown or `Level.destroy`; FOV uses transparency; `harmsAllies=false` is unreachable), `ForestFire`");
rep(r,"`HeroShapeShift` (no `HeroDisguise` buff), `SuperNova`, `SinkHole`","`HeroShapeShift` (no `HeroDisguise` buff), `SinkHole`");
rep('BACKLOG.md',"`HeroShapeShift`, `SuperNova`, `SinkHole`","`HeroShapeShift`, `SinkHole`");
rep('BACKLOG.md',"`ForestFire` and `AbortRetryFail` are ported","`ForestFire`, `AbortRetryFail` and `SuperNova` are ported");
