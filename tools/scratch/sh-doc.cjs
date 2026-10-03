const fs=require('fs');
function rep(p,a,b){let s=fs.readFileSync(p,'utf8');const i=s.indexOf(a);if(i<0)throw new Error(a);s=s.slice(0,i)+b+s.slice(i+a.length);fs.writeFileSync(p,s);}
const r='coverage/rows-items-equipment-and-artifacts.md';
rep(r,"**Ported:** `GravityChaos`","**Ported:** `SinkHole` (2026-09-28: re-rolled when invalid - boss floor, depth > 25, mining branch - like `randomValidVeryRareEffect`; the radius-5 pit always includes the caster, so the hero falls via `pitfallDrop`. **Simplified**, the same stated reduction as the pitfall trap: immediate rather than a turn later, and only the hero falls - mobs and heaps in the area stay put; live-checked, depth 1 to 2), `GravityChaos`");
rep(r,"`HeroShapeShift` (no `HeroDisguise` buff), `SinkHole`","`HeroShapeShift` (no `HeroDisguise` buff)");
rep('BACKLOG.md',"`HeroShapeShift`, `SinkHole`","`HeroShapeShift`");
rep('BACKLOG.md',"`SuperNova` and `GravityChaos` are ported","`SuperNova`, `GravityChaos` and `SinkHole` are ported");
