import { d3, d6, d16 } from './dice.js';
import { createRng, normalizeSeed } from './random.js';

export const STAT_METHODS = [
  { value: 'normal', label: 'Normal', description: '2d6' },
  { value: 'heroic', label: 'Heroic', description: '3d6, drop lowest' },
  { value: 'superheroic', label: 'Superheroic', description: '2d6 + 3' },
  { value: 'mediocre', label: 'Mediocre', description: '4d3' },
  { value: 'extreme', label: 'Extreme', description: '1d16 - 1' },
  { value: 'alternating', label: 'Alternating', description: '4d6 sorted, keep 2nd and 4th' },
];

export const PSI_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'psi-heavy', label: 'Psi-heavy' },
  { value: 'space opera', label: 'Space opera' },
  { value: 'science fantasy', label: 'Science fantasy' },
  { value: 'transcendent', label: 'Transcendent' },
];

const STAT_NAMES = ['Str', 'Dex', 'End', 'Int', 'Edu', 'Soc'];

export function modifier(value) {
  return value > 0 ? Math.floor(value / 3) - 2 : -3;
}

export function rollStat(rng, method = 'normal') {
  if (method === 'heroic') {
    return [d6(rng), d6(rng), d6(rng)].sort((a, b) => a - b).slice(1).reduce(sum, 0);
  }
  if (method === 'superheroic') {
    return d6(rng, 2) + 3;
  }
  if (method === 'mediocre') {
    return d3(rng, 4);
  }
  if (method === 'extreme') {
    return d16(rng) - 1;
  }
  if (method === 'alternating') {
    return [d6(rng), d6(rng), d6(rng), d6(rng)]
      .sort((a, b) => a - b)
      .filter((_, index) => index % 2 === 1)
      .reduce(sum, 0);
  }
  return d6(rng, 2);
}

export function generateStats({ method = 'normal', psi = '', seed = '' } = {}) {
  const normalizedSeed = normalizeSeed(seed);
  const rng = createRng(normalizedSeed);
  const values = Object.fromEntries(STAT_NAMES.map((stat) => [stat, rollStat(rng, method)]));
  let psiValue = rollStat(rng, method);

  if (psi === 'psi-heavy') {
    psiValue += modifier(values.Int);
  } else if (psi === 'space opera') {
    psiValue = Math.trunc(psiValue * 1.5);
  } else if (psi === 'science fantasy') {
    psiValue *= 2;
  } else if (psi === 'transcendent') {
    psiValue = Math.trunc(psiValue * 2.5);
  }

  return {
    seed: normalizedSeed,
    method,
    psi,
    values,
    psiValue,
    average: average(Object.values(values)),
    upp: formatUpp(values, psi ? psiValue : null),
  };
}

export function formatUpp(values, psiValue = null) {
  const core = STAT_NAMES.map((name) => values[name].toString(16)).join('');
  if (psiValue === null || psiValue === undefined || psiValue === '') {
    return core;
  }
  return `${core}~${psiValue.toString(16)}`;
}

export function parseUpp(upp) {
  const match = String(upp).trim().toLowerCase().match(/^([0-9a-f]{6})(?:~([0-9a-f]+))?$/);
  if (!match) {
    throw new Error('UPP must contain six hexadecimal stats, with optional psi after "~".');
  }

  const values = Object.fromEntries(
    STAT_NAMES.map((stat, index) => [stat, Number.parseInt(match[1][index], 16)]),
  );

  return {
    values,
    psiValue: match[2] ? Number.parseInt(match[2], 16) : null,
    upp: formatUpp(values, match[2] ? Number.parseInt(match[2], 16) : null),
  };
}

function sum(total, value) {
  return total + value;
}

function average(values) {
  return values.reduce(sum, 0) / values.length;
}
