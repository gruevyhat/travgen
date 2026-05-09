import { clamp, choice, sample } from './helpers.js';
import { generateName } from './names.js';
import { createRng, normalizeSeed } from './random.js';
import { d3, d6 } from './dice.js';
import { modifier, rollStat } from './stats.js';

export const TERRAIN_OPTIONS = [
  'Clear', 'Plain/Prairie', 'Desert', 'Hills', 'Mountain', 'Forest', 'Woods',
  'Jungle', 'Rainforest', 'Rough', 'Swamp', 'Beach', 'Riverbank',
  'Ocean Shallows', 'Open Ocean', 'Deep Ocean', 'Void',
];

export const ORDER_OPTIONS = ['Herbivore', 'Omnivore', 'Carnivore', 'Scavenger'];
export const BEHAVIOR_OPTIONS = [
  'Filter', 'Gatherer', 'Pouncer', 'Carrion-Eater', 'Eater', 'Siren', 'Reducer',
  'Intermittent', 'Hijacker', 'Brute Killer', 'Intimidator', 'Hunter', 'Chaser',
  'Grazer', 'Swift Killer', 'Trapper',
];

const TERRAIN = {
  Clear: [3, 0], 'Plain/Prairie': [4, 0], Desert: [3, -3], Hills: [0, 0],
  Mountain: [0, 0], Forest: [-4, -4], Woods: [-2, -1], Jungle: [-4, -3],
  Rainforest: [-2, -2], Rough: [-3, -3], Swamp: [-2, 4], Beach: [3, 2],
  Riverbank: [1, 1], 'Ocean Shallows': [4, 1], 'Open Ocean': [4, -4],
  'Deep Ocean': [4, 2], Void: [4, 4],
};

const ORDER_DMS = { Herbivore: -6, Omnivore: 4, Carnivore: 8, Scavenger: 0 };
const BEHAVIOR_SKILLS = {
  Filter: [['End', 4]], Gatherer: [['Stealth', 0], ['Pac', 2]],
  Pouncer: [['Stealth', 0], ['Recon', 0], ['Athletics', 0], ['Dex', 4], ['Ins', 4]],
  'Carrion-Eater': [['Ins', 2]], Eater: [['End', 4], ['Pac', 2]],
  Siren: [['Pac', -4]], Reducer: [['Pac', 4]], Intermittent: [['Pac', 4]],
  Hijacker: [['Str', 2], ['Pac', 2]], 'Brute Killer': [['Melee', 0], ['Str', 4], ['Ins', 4], ['Pac', -2]],
  Intimidator: [['Persuade', 0]], Hunter: [['Survival', 0], ['Ins', 2]],
  Chaser: [['Dex', 4], ['Ins', 2], ['Pac', 2]], Grazer: [['Ins', 2], ['Pac', 4]],
  'Swift Killer': [['Melee', 0], ['Dex', 4], ['Ins', 4], ['Pac', -2]], Trapper: [['Pac', -2]],
};
const WEAPONS = ['None', 'Teeth', 'Horns', 'Hooves', 'Hooves and Teeth', 'Claws', 'Stinger', 'Thrasher'];
const QUIRKS = [
  'Sees in infrared', 'Multiple eyes', 'Echolocation', 'Armoured shell',
  'Camouflage', 'Digs burrows', 'Six limbs', 'Gasbags', 'Lays eggs',
  'Multiple sexes', 'Acid spit', 'Primitive tools', 'Poison',
];

export function generateAnimal(options = {}) {
  const seed = normalizeSeed(options.seed);
  const rng = createRng(seed);
  const terrain = options.terrain || choice(rng, TERRAIN_OPTIONS);
  const order = options.order || choice(rng, ORDER_OPTIONS);
  const behavior = options.behavior || choice(rng, BEHAVIOR_OPTIONS);
  const [typeDm, sizeDm] = TERRAIN[terrain] ?? TERRAIN.Clear;
  const orderDm = ORDER_DMS[order] ?? 0;
  const sizeRoll = clamp(d6(rng, 2) + sizeDm, 1, 18);
  const size = [1, 3, 6, 12, 25, 50, 100, 200, 400, 800, 1600, 3200, 5000, 6000, 7000, 8000, 9000, 10000][sizeRoll - 1];
  const stats = {
    Str: Math.max(1, rollStat(rng, 'normal') + Math.floor(sizeRoll / 3)),
    Dex: Math.max(1, rollStat(rng, 'normal') - Math.floor(sizeRoll / 4)),
    End: Math.max(1, rollStat(rng, 'normal') + Math.floor(sizeRoll / 3)),
    Int: options.sentient ? Math.max(2, rollStat(rng, 'normal')) : choice(rng, [0, 1]),
    Ins: Math.max(0, rollStat(rng, 'normal')),
    Pac: Math.max(0, rollStat(rng, 'normal') + typeDm),
  };
  const skills = { Survival: 0, Athletics: 0, Recon: 0, Melee: 0 };
  for (const [attr, value] of BEHAVIOR_SKILLS[behavior] ?? []) {
    if (stats[attr] !== undefined) stats[attr] = Math.max(0, stats[attr] + value);
    else skills[attr] = Math.max(skills[attr] ?? -3, value);
  }
  const weapon = choice(rng, WEAPONS);
  const armor = clamp(Math.floor((d6(rng, 2) + orderDm) / 2) - 1, 0, 5);
  const damage = 1 + Math.floor(stats.Str / 10) + (weapon === 'None' ? 0 : 1);
  const movement = choice(rng, ['W', 'F', 'S', 'A']);
  const quirks = sample(rng, QUIRKS, d6(rng));
  const packSize = encounter(rng, stats.Pac);

  return {
    seed,
    name: generateName(rng, { cthuvian: true }),
    terrain,
    order,
    behavior,
    size,
    stats,
    skills,
    weapon,
    armor,
    damage,
    movement,
    quirks,
    packSize,
  };
}

function encounter(rng, pac) {
  if (pac <= 0) return 1;
  if (pac <= 3) return d3(rng);
  if (pac <= 6) return d6(rng);
  if (pac <= 9) return d6(rng, 2);
  return d6(rng, 3);
}

export function formatAnimalText(animal) {
  const stats = Object.entries(animal.stats).map(([name, value]) => `${name} ${value}[${modifier(value)}]`).join(', ');
  const skills = Object.entries(animal.skills).map(([name, value]) => `${name} ${value}`).join(', ');
  return `Name: ${animal.name}
Desc: ${animal.terrain} ${animal.behavior} (${animal.order}), Size ${animal.size}
Stats: ${stats}
Skills: ${skills}
Combat: ${animal.weapon} (${animal.damage}d6), Armor ${animal.armor}, Move ${animal.movement}
Quirks:
 - ${animal.quirks.join('\n - ')}
Pack Size: ${animal.packSize}
Seed: ${animal.seed}`;
}
