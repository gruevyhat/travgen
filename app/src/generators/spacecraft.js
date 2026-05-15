import { choice } from './helpers.js';

// Standard ship type templates from Core Rules
const SHIP_TYPES = {
  'Scout/Courier': {
    hull: 100, jumpRating: 2, maneuverRating: 2, powerPlant: 'B',
    fuelCapacity: 40, bridge: 10, computer: 'Model/2',
    staterooms: 6, cargo: 3, hardpoints: 1,
    crewMin: 1, crewMax: 4,
    costMCr: 28.634,
    notes: 'Standard SDB/courier hull, often used by Scouts',
  },
  'Free Trader': {
    hull: 200, jumpRating: 1, maneuverRating: 1, powerPlant: 'A',
    fuelCapacity: 62, bridge: 20, computer: 'Model/1',
    staterooms: 9, cargo: 82, hardpoints: 2,
    crewMin: 4, crewMax: 9,
    costMCr: 37.08,
    notes: 'Type A, ubiquitous trading vessel throughout known space',
  },
  'Subsidized Merchant': {
    hull: 400, jumpRating: 1, maneuverRating: 1, powerPlant: 'B',
    fuelCapacity: 90, bridge: 20, computer: 'Model/1',
    staterooms: 13, cargo: 200, hardpoints: 4,
    crewMin: 5, crewMax: 13,
    costMCr: 58.056,
    notes: 'Type R, typically owned by shipping lines',
  },
  'Yacht': {
    hull: 200, jumpRating: 1, maneuverRating: 2, powerPlant: 'A',
    fuelCapacity: 66, bridge: 20, computer: 'Model/1',
    staterooms: 8, cargo: 22, hardpoints: 2,
    crewMin: 2, crewMax: 8,
    costMCr: 42.0,
    notes: 'Type Y, personal luxury vessel',
  },
};

const HULL_CONDITIONS = [
  'Good condition', 'Well-maintained', 'Some wear, but space-worthy',
  'Patched hull plating', 'Recently overhauled', 'Showing its age',
];

const WEAPON_CONFIGS = [
  'Single turret (pulse laser)', 'Double turret (beam laser × 2)',
  'Double turret (missile rack + sandcaster)', 'Triple turret (pulse laser × 3)',
  'Unarmed', 'Unarmed',
];

const SHIP_NAME_PREFIXES = [
  'ISS', 'MV', 'SV', 'CSV', 'RMS', 'MS', 'IAS',
];

const SHIP_NAMES = [
  'Ardent Wanderer', 'Iron Corsair', 'Far Horizon', 'Silver Dawn', 'Bold Venture',
  'Phantom Star', 'Distant Shore', 'Amber Road', 'Starfall', 'Perseverance',
  'Lucky Strike', 'Deep Current', 'Empty Quarter', 'Night Crossing', 'Swift Return',
  'Dust and Echoes', 'New Meridian', 'Open Road', 'Constant Star', 'Wayward Son',
];

export function generateSpacecraft(rng, careerPath, benefits, equipment) {
  const shipShareBenefits = benefits.filter((b) => b.name?.startsWith('Ship Shares'));
  const totalShares = shipShareBenefits.reduce((sum, b) => {
    const match = b.name?.match(/\((\d+)\)/);
    return sum + (match ? Number.parseInt(match[1], 10) : 1);
  }, 0);
  const hasShipsBoat = equipment.some((e) => e.name === "Ship's Boat");
  const isScout = careerPath.some((p) => p.career === 'Scout');
  const isMerchant = careerPath.some((p) => ['Merchant', 'Trader'].includes(p.career));
  const isNoble = careerPath.some((p) => ['Nobility', 'Aristocrat'].includes(p.career));

  let shipType;
  let ownershipType;

  if (hasShipsBoat) {
    return generateShipsBoat(rng);
  } else if (isScout && totalShares === 0) {
    shipType = 'Scout/Courier';
    ownershipType = 'on loan from Scout Service';
  } else if (isNoble || totalShares >= 40) {
    shipType = choice(rng, ['Yacht', 'Free Trader']);
    ownershipType = `${totalShares} ship shares invested`;
  } else if (isMerchant || totalShares >= 20) {
    shipType = totalShares >= 30 ? 'Subsidized Merchant' : 'Free Trader';
    ownershipType = `${totalShares} ship shares — partial ownership`;
  } else if (totalShares >= 5) {
    shipType = 'Free Trader';
    ownershipType = `${totalShares} ship shares — minor stake`;
  } else if (totalShares >= 1) {
    shipType = 'Free Trader';
    ownershipType = `${totalShares} ship share${totalShares > 1 ? 's' : ''} — fractional investment (not operational)`;
  } else {
    return null;
  }

  const template = SHIP_TYPES[shipType];
  const condition = choice(rng, HULL_CONDITIONS);
  const weapons = choice(rng, WEAPON_CONFIGS);
  const namePrefix = choice(rng, SHIP_NAME_PREFIXES);
  const shipName = choice(rng, SHIP_NAMES);

  return {
    name: `${namePrefix} ${shipName}`,
    type: shipType,
    ownershipType,
    hull: template.hull,
    jumpRating: template.jumpRating,
    maneuverRating: template.maneuverRating,
    powerPlant: template.powerPlant,
    fuelCapacity: template.fuelCapacity,
    staterooms: template.staterooms,
    cargo: template.cargo,
    hardpoints: template.hardpoints,
    weapons,
    condition,
    costMCr: template.costMCr,
    notes: template.notes,
  };
}

function generateShipsBoat(rng) {
  return {
    name: `${choice(rng, SHIP_NAME_PREFIXES)} ${choice(rng, SHIP_NAMES)}`,
    type: "Ship's Boat",
    ownershipType: 'owned',
    hull: 30,
    jumpRating: 0,
    maneuverRating: 2,
    powerPlant: 'A',
    fuelCapacity: 3,
    staterooms: 4,
    cargo: 7,
    hardpoints: 0,
    weapons: 'Unarmed',
    condition: choice(rng, HULL_CONDITIONS),
    costMCr: 9.724,
    notes: 'Small craft, atmospheric and orbital use',
  };
}
