const fs=require('node:fs');
function repair(s){
 s=s.replace('c\\.isAlly === true','c\\.summonedByElementalSpell === true').replace('SummonElemental recall must find both summoned newborn and mature elemental allies','SummonElemental recall must select its own summoned newborn and mature elementals');
 s=s.replace(/^\s*assert\.equal\(potionGeneratorFloatDraws,.*$/m,"\tassert.equal(potionGeneratorFloatDraws, defaultPotionGenerations, 'the two-deck default-potion branch consumes one weighted-choice float and returns before the exotic-swap check');");
 s=s.replace('let transmutePicks = 0;', 'let transmutePicks = 0;\n\t\tlet paidTransmutationReads = 0;');
 s=s.replace(/syncHeroFromStats: \(\) => \{\}, (?:onScrollUsed: \(\) => \{\}, )?say: \(line, level\) => \{ transmuteSaid.push/, 'syncHeroFromStats: () => {}, onScrollUsed: () => { paidTransmutationReads++; }, say: (line, level) => { transmuteSaid.push');
 s=s.replace("assert.equal(transmutePicks, 1, '...exactly once');", "assert.equal(transmutePicks, 1, '...exactly once');\n\t\tassert.equal(paidTransmutationReads, 1, 'a paid transmutation runs the shared scroll talent hook exactly once');");
 s=s.replace("assert.equal(transmuteBag.items.length, 1, 'a stale pick consumes nothing');", "assert.equal(transmuteBag.items.length, 1, 'a stale pick consumes nothing');\n\t\tassert.equal(paidTransmutationReads, 1, 'empty and stale picks do not run the scroll talent hook');");
 s=s.replace(/(newItemInstanceId: \(kind\) => `test-\$\{kind\}-dart`, syncHeroFromStats: \(\) => \{\}, )(?!onScrollUsed)/,'$1onScrollUsed: () => {}, ');
 for(const id of ['potionDeck','scrollDeck']) s=s.replace(new RegExp('('+id+': \\{[^\\n]+probs: )\\[[^\\]]+\\]'),'$1[0, 3, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1]');
 s=s.replace("// `Generator.java`'s static deck tables (tag `v2.1.4`, the baseline these MWL decks\n\t// reproduce):", "// `Generator.java`'s static deck tables (v2.1.4 baseline, except potion/scroll\n\t// starting weights updated to the target v3.3.8 two-deck system):");
 if(!s.includes('scrollEmpower: 9999, rejuvenatingStepsCooldown: 10')) s=s.replace('sunrayUsed: 9999, sunrayRecent: 4, cleanseImmunity: 5,', 'sunrayUsed: 9999, sunrayRecent: 4, cleanseImmunity: 5,\n\t\t\t// Match the landed MWL cooldowns and persistent turn markers as well.\n\t\t\tscrollEmpower: 9999, rejuvenatingStepsCooldown: 10, rejuvenatingStepsFurrow: 9999,\n\t\t\tburningActed: 9999, oozeActed: 9999, beamingRayBoost: 10,');
 s=s.replace(/^\s*assert\.equal\(set\.flags\.consumed,.*$/m,"\tassert.equal(set.flags.consumed, false, 'anchoring keeps the BeaconOfReturning spell');\n\tassert.deepEqual(set.flags.spellTalentCalls ?? [], [], 'anchoring does not run spell talents');");
 s=s.replace('consumeReturningBeacon: () => { flags.consumed = true; },','consumeReturningBeacon: () => { flags.consumed = true; },\n\t\tonScrollUsed: (factor, chance) => { (flags.spellTalentCalls ??= []).push([factor, chance]); },');
 s=s.replace("assert.equal(home.flags.consumed, true, 'consuming the spell');", "assert.equal(home.flags.consumed, true, 'consuming the spell');\n\tassert.deepEqual(home.flags.spellTalentCalls, [[1, 1 / 3]], 'a successful return runs spell talents once at the recipe chance');");
 const a=s.indexOf('function scrollReadDrive('),b=s.indexOf('function upgradeGearDrive(');
 let mid=s.slice(a,b),tail=s.slice(b);
 mid=mid.replace(/\n\t\tonScrollUsed: \(\) => \{\},/g,'');
 mid=mid.replace('procIdentifyTalents: () => { flags.procIdentify++; },','procIdentifyTalents: () => { flags.procIdentify++; },\n\t\tonScrollUsed: () => { flags.scrollTalentCalls = (flags.scrollTalentCalls ?? 0) + 1; },');
 tail=tail.replace(/\n\t\tonScrollUsed: \(\) => \{\},/g,'');
 tail=tail.replace('randomFloat: takeRoll,','randomFloat: takeRoll,\n\t\tonScrollUsed: () => { flags.scrollTalentCalls = (flags.scrollTalentCalls ?? 0) + 1; },');
 s=s.slice(0,a)+mid+tail;
 for(const [anchor,check] of [
 ["assert.equal(forge.result, false, 'upgrade reads refuse');","assert.equal(forge.flags.scrollTalentCalls ?? 0, 0, 'a refused read does not run scroll talents');"],
 ["assert.equal(identify.result, true, 'identify reads');","assert.equal(identify.flags.scrollTalentCalls, 1, 'a paid Identify read runs scroll talents exactly once');"],
 ["assert.equal(free.flags.procIdentify, 0, 'proccing no identify talent');","assert.equal(free.flags.scrollTalentCalls ?? 0, 0, 'a free Recall read does not rerun paid-scroll talents');"],
 ["assert.equal(bare.result, false, 'no upgrade scroll, no upgrade');","assert.equal(bare.flags.scrollTalentCalls ?? 0, 0, 'a failed upgrade does not run scroll talents');"],
 ["assert.equal(missiles.result, true, 'a lagging pile catches up first');","assert.equal(missiles.flags.scrollTalentCalls, 1, 'a paid upgrade runs scroll talents exactly once');"]])s=s.replace(anchor,anchor+'\n\t'+check);
 return s;
}
const target=process.argv[2];let source=fs.readFileSync(target,'utf8').replaceAll('\r\n','\n');fs.writeFileSync(target,repair(source));
