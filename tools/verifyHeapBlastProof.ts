// Pins `items/heapBlastProof.ts` (`Heap.explode()` survivor test, tag `v3.3.8`): unique / upgradable /
// EquipableItem entries survive a blast, everything else is removed. Ankh/Stylus/Torch are NOT survivors.
import { survivesHeapExplosion } from '../src/items/heapBlastProof';

let failed = 0;
const check = (name: string, ok: boolean): void => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; };

for (const kind of ['weapon', 'armor', 'wand', 'ring', 'amulet', 'crystalKey', 'ironKey', 'goldenKey', 'dwarfToken', 'darkGold', 'corpseDust', 'candle', 'embers', 'bag', 'brokenSeal'] as const) {
	check(`heap blast spares ${kind}`, survivesHeapExplosion(kind));
}
for (const kind of ['ankh', 'stylus', 'torch', 'gold', 'scroll', 'potion', 'stone', 'meat', 'food', 'seed', 'bomb', 'honeypot', 'dewdrop', 'sandBag', 'alchemize'] as const) {
	check(`heap blast destroys ${kind}`, !survivesHeapExplosion(kind));
}
check('unique potion of strength survives', survivesHeapExplosion('potion', 'potionStrength'));
check('unique scroll of upgrade survives', survivesHeapExplosion('scroll', 'scrollUpgrade'));
check('unique stone of enchantment survives', survivesHeapExplosion('stone', 'stoneOfEnchantment'));
check('an ordinary potion is not spared', !survivesHeapExplosion('potion', 'potionHealing'));

if (failed > 0) { console.error(`${failed} heap-blast check(s) failed`); process.exit(1); }
console.log('verifyHeapBlastProof: OK');
