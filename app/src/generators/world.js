import coreRules from '../data/coreRules.json';
import { choice } from './helpers.js';
import { createRng, normalizeSeed } from './random.js';
import { d6 } from './dice.js';

export const ATMO_DESCS = [
  'None', 'Trace', 'Very thin, tainted', 'Very thin', 'Thin, tainted',
  'Thin', 'Standard', 'Standard, tainted', 'Dense', 'Dense, tainted',
  'Exotic', 'Corrosive', 'Insidious', 'Dense, high',
];

export const GOV_DESCS = [
  'None', 'Company/Corporation', 'Participating democracy', 'Self-Perpetuating oligarchy',
  'Representative democracy', 'Feudal technocracy', 'Captive government/Colony',
  'Balkanization', 'Civil Service bureaucracy', 'Impersonal bureaucracy',
  'Charismatic dictator', 'Non-Charismatic leader', 'Charismatic oligarchy', 'Religious dictatorship',
];

export const STARPORT_DESCS = {
  'Class A': 'Excellent quality · full shipyard facilities',
  'Class B': 'Good quality · limited shipyard',
  'Class C': 'Routine quality · no shipyard',
  'Class D': 'Poor quality · limited repair',
  'Class E': 'Frontier installation',
  'Class X': 'No starport',
};

export const POP_DESCS = [
  'Unpopulated', 'Few', 'Hundreds', 'Thousands', 'Tens of thousands', 'Hundreds of thousands',
  'Millions', 'Tens of millions', 'Hundreds of millions', 'Billions', 'Tens of billions',
];

const WORLD_SYLLABLES = [
  'al', 'ar', 'bek', 'cen', 'dar', 'el', 'for', 'gal', 'het', 'il',
  'jan', 'kath', 'lor', 'men', 'nar', 'os', 'par', 'ret', 'sol', 'ten',
  'ul', 'var', 'xan', 'yar', 'zen', 'ath', 'bor', 'cul', 'dex', 'eph',
  'fir', 'gon', 'hux', 'isp', 'jek', 'kol', 'lun', 'mav', 'nex', 'oth',
];

function hex(value) {
  return Math.max(0, value).toString(16).toUpperCase();
}

function lookupRange(table, roll) {
  return table.find((entry) => roll >= entry.min && roll <= entry.max);
}

function worldLawDesc(law) {
  if (law === 0) return 'No restrictions';
  if (law <= 3) return 'Low law';
  if (law <= 6) return 'Moderate law';
  if (law <= 9) return 'High law';
  return 'Extreme law';
}

function worldSizeDesc(size) {
  if (size === 0) return 'Asteroid / Planetoid Belt';
  if (size <= 3) return 'Small world';
  if (size <= 6) return 'Medium world';
  if (size <= 9) return 'Large world';
  return 'Very large world';
}

function worldHydroDesc(h) {
  if (h === 0) return 'Desert world';
  if (h <= 3) return 'Dry world';
  if (h <= 6) return 'Wet world';
  if (h <= 9) return 'Mostly ocean';
  return 'Water world';
}

function starportTechModifier(starport) {
  return { 'Class A': 6, 'Class B': 4, 'Class C': 2, 'Class D': 0, 'Class E': -2 }[starport] ?? 0;
}

function populationTechModifier(population) {
  if (population <= 1) return 1;
  if (population >= 9) return 2;
  return 0;
}

export function generateWorldName(rng) {
  const length = choice(rng, [2, 2, 3, 3, 3]);
  const raw = Array.from({ length }, () => choice(rng, WORLD_SYLLABLES)).join('');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function tradeCodesFor(world) {
  const codes = [];
  if (world.size === 0) codes.push('Asteroid');
  if (world.atmosphere === 0) codes.push('Vacuum');
  if (world.atmosphere >= 4 && world.atmosphere <= 9 && world.hydrographics >= 4 && world.hydrographics <= 8 && world.population >= 5 && world.population <= 7) codes.push('Agricultural');
  if (world.atmosphere >= 2 && world.hydrographics === 0) codes.push('Desert');
  if (world.population >= 9) codes.push('High Population');
  if (world.techLevel >= 12) codes.push('High Technology');
  if ([0, 1, 2, 4, 7, 9].includes(world.atmosphere) && world.population >= 9) codes.push('Industrial');
  if (world.population <= 3) codes.push('Low Population');
  if ([2, 3, 4, 5].includes(world.atmosphere) && world.hydrographics <= 3) codes.push('Poor');
  if ([6, 8].includes(world.atmosphere) && [6, 7, 8].includes(world.population)) codes.push('Rich');
  if (world.hydrographics === 10) codes.push('Water World');
  return codes.length ? codes : ['Average'];
}

export function backgroundSkillsFor(tradeCodes) {
  const entries = tradeCodes.flatMap((code) => coreRules.homeworldGeneration.tradeCodeSkills[code] ?? []);
  return [...new Set(entries.length ? entries : ['Admin', 'Streetwise'])];
}

export function deriveEthnicity(worldName) {
  const last = worldName.slice(-1).toLowerCase();
  if (last === 'a') return worldName + 'n';
  if ('eiou'.includes(last)) return worldName + 'an';
  return worldName + 'ian';
}

function buildWorldFromRng(rng, name) {
  const starport = lookupRange(coreRules.homeworldGeneration.starports, d6(rng, 2)).label;
  const size = Math.max(0, d6(rng, 2) - 2);
  const atmosphere = Math.max(0, d6(rng, 2) - 7 + size);
  const hydrographics = Math.max(0, Math.min(10, d6(rng, 2) - 7 + size));
  const population = Math.max(0, d6(rng, 2) - 2);
  const government = Math.max(0, d6(rng, 2) - 7 + population);
  const law = Math.max(0, d6(rng, 2) - 7 + government);
  const techLevel = Math.max(0, d6(rng) + starportTechModifier(starport) + populationTechModifier(population));
  const tradeCodes = tradeCodesFor({ size, atmosphere, hydrographics, population, techLevel });
  const backgroundSkills = backgroundSkillsFor(tradeCodes);
  const upp = `${starport.replace('Class ', '')}${hex(size)}${hex(atmosphere)}${hex(hydrographics)}${hex(population)}${hex(government)}${hex(law)}-${hex(techLevel)}`;
  return {
    mode: 'standard',
    name,
    upp,
    starport,
    size,
    atmosphere,
    hydrographics,
    population,
    government,
    law,
    techLevel,
    tradeCodes,
    backgroundSkills,
    summary: `${name} ${upp}`,
    source: coreRules.metadata.id,
    atmosphereDesc: ATMO_DESCS[atmosphere] ?? 'Exotic',
    governmentDesc: GOV_DESCS[government] ?? 'Unknown',
    lawDesc: worldLawDesc(law),
    starportDesc: STARPORT_DESCS[starport] ?? '',
    sizeDesc: worldSizeDesc(size),
    populationDesc: POP_DESCS[population] ?? 'Unknown',
    hydroDesc: worldHydroDesc(hydrographics),
  };
}

export function generateWorldFromRng(rng, { requested } = {}) {
  const name = requested || generateWorldName(rng);
  return buildWorldFromRng(rng, name);
}

export function generateWorld(options = {}) {
  const seed = normalizeSeed(options.seed);
  const rng = createRng(seed);
  const name = options.name?.trim() || generateWorldName(rng);
  return { seed, ...buildWorldFromRng(rng, name) };
}
