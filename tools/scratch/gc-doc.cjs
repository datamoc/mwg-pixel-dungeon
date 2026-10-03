const fs=require('fs');
function rep(p,a,b){let s=fs.readFileSync(p,'utf8');const i=s.indexOf(a);if(i<0)throw new Error(a);s=s.slice(0,i)+b+s.slice(i+a.length);fs.writeFileSync(p,s);}
const r='coverage/rows-items-equipment-and-artifacts.md';
rep(r,"**Ported:** `SuperNova`","**Ported:** `GravityChaos` (2026-09-28: `gravityChaos` scene state, saved and loaded; `NormalIntRange(30,70)` pushes spaced `IntRange(1,3)` hero actions apart, each throwing every non-`IMMOVABLE` character 3 cells in one shared random direction and waking sleepers; live-checked, hero moved 3 cells per push and its sprite settled on the logical cell. **Simplified:** stops at walls/occupants and before a chasm, no `blocked` retry loop, ticks per hero action, `positiveOnly` unreachable), `SuperNova`");
rep(r,"`SinkHole`, `GravityChaos`","`SinkHole`");
rep('BACKLOG.md',"`SinkHole`, `GravityChaos`","`SinkHole`");
rep('BACKLOG.md',"`AbortRetryFail` and `SuperNova` are ported","`AbortRetryFail`, `SuperNova` and `GravityChaos` are ported");
