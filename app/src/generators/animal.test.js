import { describe, expect, it } from 'vitest';
import { formatAnimalText, generateAnimal } from './animal.js';

describe('animal generator', () => {
  it('generates reproducible animals', () => {
    const options = { seed: 'abcd1234', terrain: 'Desert', behavior: 'Grazer' };

    expect(generateAnimal(options)).toEqual(generateAnimal(options));
  });

  it('supports sentient animals', () => {
    const animal = generateAnimal({ seed: '9', sentient: true });

    expect(animal.stats.Int).toBeGreaterThan(1);
  });

  it('formats a copyable animal record', () => {
    expect(formatAnimalText(generateAnimal({ seed: 'cafe' }))).toContain('Combat:');
  });
});
