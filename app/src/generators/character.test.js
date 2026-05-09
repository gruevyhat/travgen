import { describe, expect, it } from 'vitest';
import { formatCharacterText, generateCharacter } from './character.js';

describe('character generator', () => {
  it('generates reproducible characters within the web app', () => {
    const options = { seed: 'cd515598', terms: 3, expansions: { chthonianStars: true, psion: true } };

    expect(generateCharacter(options)).toEqual(generateCharacter(options));
  });

  it('respects fixed demographic inputs and term count', () => {
    const character = generateCharacter({
      seed: '1234abcd',
      name: 'Test Name',
      gender: 'female',
      ethnicity: 'american',
      homeworld: 'Mars',
      terms: 4,
    });

    expect(character.name).toBe('Test Name');
    expect(character.gender).toBe('female');
    expect(character.homeworld).toBe('Mars');
    expect(character.terms).toHaveLength(4);
  });

  it('formats a copyable record', () => {
    const text = formatCharacterText(generateCharacter({ seed: 'bead1234' }));

    expect(text).toContain('UPP:');
    expect(text).toContain('Career Path:');
    expect(text).toContain('Seed: bead1234');
  });
});
