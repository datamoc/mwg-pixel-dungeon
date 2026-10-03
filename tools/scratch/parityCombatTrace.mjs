// tools/parityCombatTrace.ts
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// src/simulation/combatState.ts
function chebyshevDistance(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

// src/simulation/mwlMonsterStateStats.ts
var GOO_STATE_STATS = {
  "healthy": {
    "accuracy": 10,
    "evasion": 8,
    "damageMin": 1,
    "damageMax": 8
  },
  "enraged": {
    "accuracy": 15,
    "evasion": 12,
    "damageMin": 1,
    "damageMax": 12
  }
};
var BRUTE_RAGE_DAMAGE = {
  "brute": [
    15,
    40
  ],
  "armoredBrute": [
    15,
    40
  ]
};

// src/simulation/preparation.ts
var PREPARATION_LEVELS = [
  { level: 1, turnsReq: 1, damageBonus: 0.1, damageRolls: 1 },
  { level: 2, turnsReq: 3, damageBonus: 0.2, damageRolls: 1 },
  { level: 3, turnsReq: 5, damageBonus: 0.35, damageRolls: 2 },
  { level: 4, turnsReq: 9, damageBonus: 0.5, damageRolls: 3 }
];
function preparationLevelByNumber(level) {
  const index = Math.min(Math.max(Math.round(level), 1), PREPARATION_LEVELS.length) - 1;
  return PREPARATION_LEVELS[index];
}
function preparationDamageRoll(level, roll) {
  let best = roll();
  for (let i = 1; i < level.damageRolls; i++) {
    const candidate = roll();
    if (candidate > best) best = candidate;
  }
  return Math.round(best * (1 + level.damageBonus));
}

// src/simulation/combat.ts
var INFINITE_ACCURACY = 1e6;
var INFINITE_EVASION = 1e6;
var ASCENSION_MOD = {
  rat: 10,
  albino: 10,
  fetidRat: 10,
  snake: 9,
  gnoll: 9,
  gnollTrickster: 9,
  gnollExile: 9,
  swarm: 8.5,
  crab: 8,
  greatCrab: 8,
  hermitCrab: 8,
  slime: 8,
  causticSlime: 8,
  skeleton: 5,
  necroSkeleton: 5,
  thief: 5,
  bandit: 5,
  dm100: 4.5,
  guard: 4,
  necromancer: 4,
  spectralNecromancer: 4,
  bat: 2.5,
  brute: 2.25,
  armoredBrute: 2.25,
  shaman: 2.25,
  spinner: 2,
  dm200: 2,
  dm201: 2,
  ghoul: 1.67,
  elemental: 1.67,
  newbornElemental: 1.67,
  warlock: 1.5,
  monk: 1.5,
  senior: 1.5,
  golem: 1.33,
  ripperDemon: 1.2,
  succubus: 1.2,
  eye: 1.1,
  scorpio: 1.1,
  acidic: 1.1
};
var ascensionActive = false;
var ascensionOn = () => ascensionActive;
function ascensionModFor(c) {
  if (!ascensionOn() || !c.kind || c.ascensionBuffBlocked) return 1;
  return ASCENSION_MOD[c.kind] ?? 1;
}
function liveStats(c) {
  if (c.kind === "goo") {
    const stats = c.hp * 2 <= c.maxHp ? GOO_STATE_STATS.enraged : GOO_STATE_STATS.healthy;
    return { accuracy: stats.accuracy, evasion: stats.evasion, damage: [stats.damageMin, stats.damageMax] };
  }
  if ((c.kind === "brute" || c.kind === "armoredBrute") && c.raged) {
    const rage = BRUTE_RAGE_DAMAGE[c.kind];
    if (!rage) throw new Error(`MWL brute rage damage is missing: ${c.kind}`);
    return { accuracy: c.accuracy, evasion: c.evasion, damage: [rage[0], rage[1]] };
  }
  return { accuracy: c.accuracy, evasion: c.evasion, damage: c.damage };
}
var fround = Math.fround;
function rollFactors32(base, c) {
  let r = fround(base);
  if (c.buffs["bless"]) r = fround(r * fround(1.25));
  if (c.buffs["hex"]) r = fround(r * fround(0.8));
  if (c.buffs["daze"]) r = fround(r * fround(0.5));
  if (c.champion === "blessed") r = fround(r * 4);
  if (c.champion === "growing") r = fround(r * fround(c.championPower ?? 1.19));
  return fround(r * fround(ascensionModFor(c)));
}
function rollHit(attacker, defender, random, magic = false, surprise = false, accFactor = 1) {
  if (liveStats(defender).evasion >= INFINITE_EVASION) return false;
  let acu = liveStats(attacker).accuracy;
  if (accFactor !== 1) acu = Math.max(1, Math.round(acu * accFactor));
  if (surprise || defender.sleeping || attacker.buffs["invisibility"] && !defender.isHero) acu = INFINITE_ACCURACY;
  if (acu >= INFINITE_ACCURACY) return true;
  if (defender.kind === "greatCrab" && !defender.sleeping && !magic) {
    const adjacent = chebyshevDistance(attacker, defender) <= 1;
    if (adjacent) return false;
  }
  const acuRoll = fround(rollFactors32(random.float(acu), attacker) * (magic ? 2 : 1));
  const defRoll = rollFactors32(random.float(liveStats(defender).evasion), defender);
  if (attacker.str !== void 0 && attacker.strReq !== void 0 && attacker.str < attacker.strReq) {
    return acuRoll / Math.pow(1.5, attacker.strReq - attacker.str) >= defRoll;
  }
  return acuRoll >= defRoll;
}
function rollDamage(attacker, defender, random, damageMultiplier = 1) {
  const [min, max] = liveStats(attacker).damage;
  const rawDr = random.normalRange(0, defender.barkskinLevel ?? 0) + (defender.armor[0] === 0 && defender.armor[1] === 0 && !defender.barkskinLevel ? 0 : random.normalRange(defender.armor[0], defender.armor[1])) + (defender.weaponDefense !== void 0 ? random.normalRange(0, defender.weaponDefense) : 0);
  const dr = Math.round(rawDr * ascensionModFor(defender));
  const damageRoll = () => {
    let roll = random.normalRange(min, max);
    if (attacker.str !== void 0 && attacker.strReq !== void 0 && attacker.str > attacker.strReq) {
      roll += random.range(0, attacker.str - attacker.strReq);
    }
    return roll;
  };
  let dmg = attacker.prepLevel !== void 0 ? preparationDamageRoll(preparationLevelByNumber(attacker.prepLevel), damageRoll) : damageRoll();
  dmg *= damageMultiplier;
  if (attacker.buffs["berserk"]) {
    const power = 1 - attacker.hp / attacker.maxHp;
    dmg *= Math.min(1.5, 1 + power / 2);
  }
  if (attacker.buffs["fury"] && attacker.hp <= attacker.maxHp * 0.5) dmg *= 1.5;
  if (attacker.champion === "blazing") dmg *= 1.25;
  if (attacker.champion === "projecting") dmg *= 1.25;
  if (attacker.champion === "growing") dmg *= attacker.championPower ?? 1.19;
  dmg *= ascensionModFor(attacker);
  if (attacker.buffs["weakness"]) dmg *= 0.67;
  if (defender.buffs["aggression"] && (defender.boss || defender.miniboss) && !attacker.isHero && !attacker.isAlly) {
    dmg *= 0.5;
    if (defender.kind === "yog") dmg *= 0.5;
  }
  let effective = Math.max(0, Math.round(dmg) - dr);
  if (defender.buffs["vulnerable"]) effective *= 1.33;
  if (defender.champion === "giant") effective *= 0.2;
  if (defender.champion === "antimagic") effective *= 0.5;
  if (defender.champion === "growing") effective /= defender.championPower ?? 1.19;
  return Math.max(0, Math.round(effective));
}

// src/simulation/attackResolution.ts
function resolveAttack(attacker, defender, random, magic = false, surprise = false, accFactor = 1, damageMultiplier = 1) {
  const hit = rollHit(attacker, defender, random, magic, surprise, accFactor);
  return hit ? { hit: true, damage: rollDamage(attacker, defender, random, damageMultiplier) } : { hit: false, damage: 0 };
}

// node_modules/mwg/dist/core/JavaRandom.js
var MULTIPLIER = 0x5deece66dn;
var ADDEND = 0xbn;
var MASK = (1n << 48n) - 1n;
var JavaRandom = class {
  constructor(seed = 0, options = {}) {
    this.state = 0n;
    this.onDraw = options.onDraw;
    this.setSeed(seed);
  }
  /** restarts the sequence, as `Random.setSeed` does */
  setSeed(seed) {
    this.state = (BigInt.asIntN(64, BigInt(seed)) ^ MULTIPLIER) & MASK;
  }
  /** the next `bits` (1 to 32) pseudorandom bits; a 32-bit draw is signed, as in Java */
  next(bits) {
    if (!Number.isInteger(bits) || bits < 1 || bits > 32)
      throw new Error(`next needs 1 to 32 bits, got ${bits}`);
    this.state = this.state * MULTIPLIER + ADDEND & MASK;
    const top = Number(this.state >> BigInt(48 - bits));
    const value = bits === 32 ? top | 0 : top;
    this.onDraw?.({ bits, value });
    return value;
  }
  /**
   * With no argument, any int (`nextInt()`); with a positive `bound`, an int in
   * `[0, bound)` (`nextInt(bound)`), drawn without modulo bias the way Java does.
   */
  nextInt(bound) {
    if (bound === void 0)
      return this.next(32);
    if (!Number.isInteger(bound) || bound <= 0 || bound > 2147483647) {
      throw new Error(`nextInt needs a bound from 1 to 2147483647, got ${bound}`);
    }
    if ((bound & -bound) === bound)
      return Math.floor(bound * this.next(31) / 2147483648);
    let bits;
    let value;
    do {
      bits = this.next(31);
      value = bits % bound;
    } while (bits - value + (bound - 1) > 2147483647);
    return value;
  }
  /** a signed 64-bit integer, two 32-bit draws combined as Java does */
  nextLong() {
    const high = BigInt(this.next(32));
    const low = BigInt(this.next(32));
    return BigInt.asIntN(64, (high << 32n) + low);
  }
  /** a double in `[0, 1)` from 53 random bits */
  nextDouble() {
    return (this.next(26) * 134217728 + this.next(27)) / 2 ** 53;
  }
  /** a float in `[0, 1)` from 24 random bits */
  nextFloat() {
    return this.next(24) / 16777216;
  }
  nextBoolean() {
    return this.next(1) !== 0;
  }
};

// src/spdRng.ts
var U64 = (1n << 64n) - 1n;
function u64(value) {
  return value & U64;
}
var traceDrawLog = null;
function setTraceDrawLog(v) {
  traceDrawLog = v;
  traceDrawCount = 0;
}
var traceDrawCount = 0;
var traceStackWindow = null;
var traceStacks = [];
function traceDraw(draw) {
  if (traceDrawLog === null) return;
  traceDrawLog.push(`${draw.bits}:${draw.value}`);
  if (traceStackWindow !== null && traceDrawCount >= traceStackWindow[0] && traceDrawCount <= traceStackWindow[1]) {
    traceStacks.push(`#${traceDrawCount} ${draw.bits}:${draw.value} :: ${(new Error().stack ?? "").split("\n").slice(2, 9).join(" <- ")}`);
  }
  traceDrawCount++;
}
var SpdJavaRandom = class extends JavaRandom {
  constructor(seed) {
    super(seed, { onDraw: traceDraw });
  }
  nextInt(bound) {
    if (bound !== void 0 && bound <= 0) return 0;
    return super.nextInt(bound);
  }
};
function spdScramble(seed) {
  let value = u64(seed);
  value = u64((value ^ value >> 32n) * 0xbea225f9eb34556dn);
  value = u64((value ^ value >> 29n) * 0xbea225f9eb34556dn);
  value = u64((value ^ value >> 32n) * 0xbea225f9eb34556dn);
  return u64(value ^ value >> 29n);
}
var SpdRandom = class {
  static {
    this.stack = [new SpdJavaRandom(BigInt(Math.floor(Math.random() * 2 ** 48)))];
  }
  static top() {
    return this.stack[this.stack.length - 1];
  }
  static pushGenerator(seed) {
    this.stack.push(seed === void 0 ? new SpdJavaRandom(BigInt(Math.floor(Math.random() * 2 ** 48))) : new SpdJavaRandom(spdScramble(seed)));
  }
  static popGenerator() {
    if (this.stack.length > 1) this.stack.pop();
  }
  /**
   * `Random.Float()`: `nextFloat()`'s output (n/2^24 for n < 2^24) is always exactly
   * representable in a JS double, so no `Math.fround` is needed here - but every arithmetic
   * op Java performs ON that float (multiply by a range, add a min, sum into an accumulator)
   * IS float-precision and must be frounded at each step, since Java narrows at every `float`
   * assignment/operator, not just at a final cast. Missing this class of narrowing was the
   * root cause of a real seed-42-depth-3 desync in `spdLevelGen`'s builder (see its own
   * float-precision comments) - fixed at the root here so every caller benefits.
   */
  static float() {
    return this.top().nextFloat();
  }
  /** `Random.Float(float max)`: `Float() * max`, float*float=float. */
  static floatMax(max) {
    return Math.fround(this.float() * max);
  }
  /** `Random.Float(float min, float max)`: `min + Float(max - min)`, each op float-precision. */
  static floatRange(min, max) {
    return Math.fround(min + this.floatMax(Math.fround(max - min)));
  }
  /** `Random.NormalFloat`: two independent float draws, summed/halved/added at float precision. */
  static normalFloat(min, max) {
    const range = Math.fround(max - min);
    const a = this.floatMax(range);
    const b = this.floatMax(range);
    return Math.fround(min + Math.fround(Math.fround(a + b) / 2));
  }
  static int(max) {
    return max > 0 ? this.top().nextInt(max) : 0;
  }
  static intRange0(min, max) {
    return min + this.int(max - min);
  }
  static intRange(min, max) {
    return min + this.int(max - min + 1);
  }
  /**
   * Random.NormalIntRange: min + (int)((Float() + Float()) * (max - min + 1) / 2f) -
   * every op is float in Java, then a truncating (int) cast. The double-precision
   * version this replaced could land on the other side of an integer boundary from
   * Java’s float-rounded value, flipping a setSize() dimension by one.
   */
  static normalIntRange(min, max) {
    const sum = Math.fround(this.float() + this.float());
    const scaled = Math.fround(sum * (max - min + 1));
    return min + Math.trunc(scaled / 2);
  }
  static long() {
    return this.top().nextLong();
  }
  /**
   * `Random.chances(float[])`: cumulative-sum weighted pick, -1 (mapped to 0 by callers'
   * clamp) if none. Java's `sum`/running `acc` are both `float` locals, so each `+=` narrows -
   * fround per step, not just at the end, since the accumulated rounding error can differ.
   */
  static chances(weights) {
    let sum = 0;
    for (const w of weights) sum = Math.fround(sum + w);
    const value = this.floatRange(0, sum);
    let acc = 0;
    for (let i = 0; i < weights.length; i++) {
      acc = Math.fround(acc + weights[i]);
      if (value < acc) return i;
    }
    return -1;
  }
  static element(arr) {
    return arr[this.int(arr.length)];
  }
  /** `Random.shuffle(List)` -> `Collections.shuffle`: back-to-front swap with `nextInt(i+1)`. */
  static shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
  }
  /** `Random.shuffle(T[] array)`: SPD's own forward-swap variant, distinct from `Collections.shuffle`. */
  static shuffleArrayForward(arr) {
    for (let i = 0; i < arr.length - 1; i++) {
      const j = this.intRange0(i, arr.length);
      if (j !== i) {
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
    }
  }
};

// tools/parityCombatTrace.ts
var SCRIPT_VERSION_1 = 1;
var SCRIPT_VERSION_2 = 2;
var SCRIPT_VERSION_4 = 4;
var SCRIPT_VERSION_3 = 3;
var hero = {
  id: "hero-1",
  x: 1,
  y: 1,
  hp: 20,
  maxHp: 20,
  accuracy: 12,
  evasion: 6,
  damage: [2, 8],
  armor: [1, 3],
  buffs: {},
  isHero: true
};
var rat = {
  id: "rat-1",
  x: 2,
  y: 1,
  hp: 10,
  maxHp: 10,
  accuracy: 6,
  evasion: 5,
  damage: [1, 3],
  armor: [0, 1],
  buffs: {},
  isHero: false
};
var SCRIPT = [
  {},
  { attacker: "rat" },
  { attackerPatch: { buffs: { bless: 1 } } },
  { defenderPatch: { buffs: { hex: 1 } } },
  { attackerPatch: { buffs: { daze: 1 } }, defenderPatch: { buffs: { bless: 1 } } },
  { surprise: true },
  { magic: true },
  { attackerPatch: { prepLevel: 4 } },
  { attackerPatch: { str: 14, strReq: 10 } },
  { attackerPatch: { str: 8, strReq: 12 } },
  { attackerPatch: { buffs: { fury: 1 } }, defenderPatch: { buffs: { vulnerable: 1 } } },
  { attackerPatch: { buffs: { weakness: 1 }, champion: "blazing" } },
  { defenderPatch: { champion: "giant" } },
  { defenderPatch: { champion: "growing", championPower: 1.25 } },
  { attackerPatch: { buffs: { berserk: 1 } }, defenderPatch: { barkskinLevel: 3 } },
  { attacker: "rat", attackerPatch: { champion: "blessed" } },
  { defenderPatch: { buffs: { aggression: 1 }, boss: true, kind: "goo" } },
  { attackerPatch: { damage: [4, 4], armor: [2, 2] }, defenderPatch: { damage: [2, 2], armor: [2, 2] } },
  { attackerPatch: { accuracy: 1 }, defenderPatch: { evasion: 30 } },
  { attackerPatch: { accuracy: 30 }, defenderPatch: { evasion: 1 } }
];
var heroNatural = {
  id: "hero-1",
  x: 1,
  y: 1,
  hp: 20,
  maxHp: 20,
  accuracy: 10,
  evasion: 5,
  damage: [1, 2],
  armor: [0, 0],
  buffs: {},
  isHero: true
};
var ratNatural = {
  id: "rat-1",
  x: 2,
  y: 1,
  hp: 8,
  maxHp: 8,
  accuracy: 8,
  evasion: 2,
  damage: [1, 4],
  armor: [0, 1],
  buffs: {},
  isHero: false
};
var crabNatural = {
  id: "crab-1",
  x: 2,
  y: 1,
  hp: 15,
  maxHp: 15,
  accuracy: 12,
  evasion: 5,
  damage: [1, 7],
  armor: [0, 4],
  buffs: {},
  isHero: false
};
var SCRIPT_V2 = [
  {},
  { attacker: "rat" },
  {},
  { attacker: "rat" },
  { magic: true },
  { attacker: "rat" },
  { surprise: true },
  { attacker: "rat" },
  {},
  { attacker: "rat" }
];
var SCRIPT_V3 = [
  {},
  { attacker: "rat" },
  { attackerPatch: { buffs: { bless: 1 } } },
  { defenderPatch: { buffs: { hex: 1 } } },
  { attacker: "rat", attackerPatch: { buffs: { daze: 1 } } },
  { attacker: "rat", defenderPatch: { buffs: { hex: 1 } } },
  { attackerPatch: { buffs: { bless: 1 } }, defenderPatch: { buffs: { hex: 1 } } },
  { attacker: "rat" },
  { magic: true, attackerPatch: { buffs: { bless: 1 } } },
  { attacker: "rat" }
];
var SCRIPT_V4 = [
  {},
  { attacker: "crab" },
  {},
  { attacker: "crab" },
  { magic: true },
  { attacker: "crab" },
  { surprise: true },
  { attacker: "crab" },
  {},
  { attacker: "crab" }
];
function seededRandom(seed) {
  const rng = new SpdJavaRandom(spdScramble(seed));
  let normalsThisRound = 0;
  let cloverPending = false;
  const normalRange = (min, max) => {
    if (cloverPending && normalsThisRound === 2) {
      rng.nextFloat();
      cloverPending = false;
    }
    normalsThisRound++;
    return min + Math.floor((rng.nextFloat() + rng.nextFloat()) * (max - min + 1) / 2);
  };
  return {
    random: {
      float: (max) => rng.nextFloat() * max,
      normalRange,
      range: (min, max) => min + rng.nextInt(max - min + 1),
      int: (min, max) => min + rng.nextInt(max - min),
      chance: (probability) => rng.nextFloat() < probability
    },
    nextRound: (burnClover) => {
      normalsThisRound = 0;
      cloverPending = burnClover;
    }
  };
}
function runScript(seed, scriptVersion) {
  const { random, nextRound } = seededRandom(seed);
  const header = { tool: "parityCombatTrace", scriptVersion, seed: seed.toString() };
  const script = scriptVersion === SCRIPT_VERSION_4 ? SCRIPT_V4 : scriptVersion === SCRIPT_VERSION_3 ? SCRIPT_V3 : scriptVersion === SCRIPT_VERSION_2 ? SCRIPT_V2 : SCRIPT;
  const foe = scriptVersion === SCRIPT_VERSION_4 ? "crab" : "rat";
  const fighter = (side) => scriptVersion === SCRIPT_VERSION_1 ? side === "rat" ? rat : hero : side === "crab" ? crabNatural : side === "rat" ? ratNatural : heroNatural;
  const rounds = script.map((step, i) => {
    nextRound(scriptVersion !== SCRIPT_VERSION_1 && (step.attacker ?? "hero") === "hero");
    const attacker = {
      ...fighter(step.attacker ?? "hero"),
      ...step.attackerPatch ?? {},
      buffs: { ...fighter(step.attacker ?? "hero").buffs, ...step.attackerPatch?.buffs ?? {} }
    };
    const attackerBase = step.attacker ?? "hero";
    const defenderBase = step.defender ?? (attackerBase === "hero" ? foe : "hero");
    const defender = {
      ...fighter(defenderBase),
      ...step.defenderPatch ?? {},
      buffs: { ...fighter(defenderBase).buffs, ...step.defenderPatch?.buffs ?? {} }
    };
    const log = [];
    setTraceDrawLog(log);
    let result;
    try {
      result = resolveAttack(attacker, defender, random, step.magic ?? false, step.surprise ?? false);
    } finally {
      setTraceDrawLog(null);
    }
    const buffNames = (b) => {
      const names = Object.keys(b ?? {});
      return names.length > 0 ? names : void 0;
    };
    return {
      round: i,
      attacker: attacker.id,
      defender: defender.id,
      magic: step.magic ?? false,
      surprise: step.surprise ?? false,
      hit: result.hit,
      damage: result.damage,
      draws: log,
      attackerBuffs: buffNames(attacker.buffs),
      defenderBuffs: buffNames(defender.buffs)
    };
  });
  return { header, rounds };
}
function toJsonl(trace) {
  const lines = [JSON.stringify(trace.header)];
  for (const round of trace.rounds) lines.push(JSON.stringify(round));
  const totalDraws = trace.rounds.reduce((n, r) => n + r.draws.length, 0);
  lines.push(JSON.stringify({ rounds: trace.rounds.length, totalDraws }));
  return lines.join("\n") + "\n";
}
function compareJsonl(aText, bText) {
  const aLines = aText.trim().split("\n");
  const bLines = bText.trim().split("\n");
  if (aLines.length !== bLines.length) {
    return { identical: false, message: `line count differs: ${aLines.length} vs ${bLines.length}` };
  }
  const aHead = JSON.parse(aLines[0]);
  const bHead = JSON.parse(bLines[0]);
  if (aHead.scriptVersion !== bHead.scriptVersion) {
    return { identical: false, message: `script version differs: ${aHead.scriptVersion} vs ${bHead.scriptVersion}` };
  }
  if (aHead.seed !== bHead.seed) {
    return { identical: false, message: `seed differs: ${aHead.seed} vs ${bHead.seed}` };
  }
  for (let i = 1; i < aLines.length - 1; i++) {
    const a = JSON.parse(aLines[i]);
    const b = JSON.parse(bLines[i]);
    if (a.hit !== b.hit || a.damage !== b.damage) {
      return { identical: false, message: `round ${a.round}: outcome differs (hit ${a.hit}/${b.hit}, damage ${a.damage}/${b.damage})` };
    }
    const aBuffs = a.attackerBuffs ?? [];
    const bBuffs = b.attackerBuffs ?? [];
    const aDebuffs = a.defenderBuffs ?? [];
    const bDebuffs = b.defenderBuffs ?? [];
    if (aBuffs.join(",") !== bBuffs.join(",") || aDebuffs.join(",") !== bDebuffs.join(",")) {
      return { identical: false, message: `round ${a.round}: buffs differ (attackers ${aBuffs}/${bBuffs}, defenders ${aDebuffs}/${bDebuffs})` };
    }
    if (a.draws.length !== b.draws.length || a.draws.some((d, k) => d !== b.draws[k])) {
      const first = a.draws.findIndex((d, k) => d !== b.draws[k]);
      return { identical: false, message: `round ${a.round}: draw ${first} differs (${a.draws[first] ?? "missing"} vs ${b.draws[first] ?? "missing"})` };
    }
  }
  const aFoot = JSON.parse(aLines[aLines.length - 1]);
  const bFoot = JSON.parse(bLines[bLines.length - 1]);
  if (aFoot.totalDraws !== bFoot.totalDraws) {
    return { identical: false, message: `total draw count differs: ${aFoot.totalDraws} vs ${bFoot.totalDraws}` };
  }
  return { identical: true };
}
function fail(message) {
  console.error(message);
  process.exit(1);
}
function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}
var mode = process.argv[2];
function scriptArg() {
  const raw = arg("--script") ?? "1";
  const version = parseInt(raw, 10);
  if (version !== SCRIPT_VERSION_1 && version !== SCRIPT_VERSION_2 && version !== SCRIPT_VERSION_3 && version !== SCRIPT_VERSION_4) fail(`unknown script version: ${raw}`);
  return version;
}
if (mode === "emit") {
  const seedText = arg("--seed") ?? "123456789";
  const version = scriptArg();
  const out = arg("--out");
  if (!out) fail("usage: parityCombatTrace emit --seed <n> --script <1|2|3|4> --out <file>");
  const text = toJsonl(runScript(BigInt(seedText), version));
  writeFileSync(out, text);
  const rounds = text.trim().split("\n").length - 2;
  console.log(`emitted ${rounds} rounds (script ${version}) to ${out}`);
} else if (mode === "check") {
  const seed = BigInt(arg("--seed") ?? "123456789");
  for (const version of [SCRIPT_VERSION_1, SCRIPT_VERSION_2, SCRIPT_VERSION_3, SCRIPT_VERSION_4]) {
    const first2 = toJsonl(runScript(seed, version));
    const second = toJsonl(runScript(seed, version));
    if (first2 !== second) fail(`determinism gate FAILED (script ${version}): same seed produced different traces`);
    console.log(`determinism gate passed (script ${version}): byte-identical across two runs`);
  }
  const first = toJsonl(runScript(seed, SCRIPT_VERSION_1));
  const self = compareJsonl(first, first);
  if (!self.identical) fail("positive control FAILED: trace differs from itself");
  console.log("positive control passed: trace compares clean against itself");
  const dir = mkdtempSync(join(tmpdir(), "spd-parity-"));
  const mutatedLines = first.trim().split("\n");
  const victim = JSON.parse(mutatedLines[6]);
  victim.damage += 1;
  mutatedLines[6] = JSON.stringify(victim);
  const neg = compareJsonl(first, mutatedLines.join("\n") + "\n");
  if (neg.identical || !neg.message.includes("round 5")) {
    fail(`negative control FAILED: expected a round-5 report, got ${neg.identical ? "identical" : neg.message}`);
  }
  console.log(`negative control passed: ${neg.message}`);
} else if (mode === "compare") {
  const aPath = arg("--a");
  const bPath = arg("--b");
  if (!aPath || !bPath) fail("usage: parityCombatTrace compare --a <file> --b <file>");
  const result = compareJsonl(readFileSync(aPath, "utf8"), readFileSync(bPath, "utf8"));
  if (result.identical) {
    console.log("traces identical");
  } else {
    fail(`traces differ: ${result.message}`);
  }
} else {
  fail("usage: parityCombatTrace <emit|check|compare> [...]");
}
