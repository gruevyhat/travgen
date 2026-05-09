import nameData from '../data/nameData.json';
import { choice, titleCase } from './helpers.js';

const { NAMES, CTHUVIAN } = nameData;

export const ETHNICITIES = Object.keys(NAMES).sort();
export const GENDERS = ['female', 'male'];

export function generateName(rng, { ethnicity = 'american', gender = 'female', cthuvian = false } = {}) {
  if (cthuvian) {
    return titleCase(buildCthuvianWord(rng));
  }

  const eth = NAMES[ethnicity] ? ethnicity : 'american';
  const gen = gender === 'male' ? 'male' : 'female';
  const familyEthnicity = eth === 'american' ? choice(rng, ETHNICITIES) : eth;
  const givenEthnicity = eth === 'american' ? choice(rng, ETHNICITIES) : eth;
  let family = choice(rng, NAMES[familyEthnicity].family);
  const given = choice(rng, NAMES[givenEthnicity][gen]);

  if (eth === 'russian' && gen === 'female') {
    family += 'a';
  }

  return `${family}, ${given}`;
}

function buildCthuvianWord(rng) {
  const parts = [
    maybe(rng, CTHUVIAN['pfx-pro']),
    maybe(rng, CTHUVIAN['pfx-neg']),
    maybe(rng, CTHUVIAN.VB),
    maybe(rng, CTHUVIAN.AA),
    choice(rng, CTHUVIAN.NN),
    maybe(rng, CTHUVIAN.NN),
    maybe(rng, CTHUVIAN['sfx-deriv']),
  ];
  return parts.filter(Boolean).map((part) => part[0]).join('').replaceAll('-', '');
}

function maybe(rng, items) {
  return rng() < 0.5 ? choice(rng, items) : '';
}
