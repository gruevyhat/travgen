import { describe, expect, it } from 'vitest';
import { generateStats, modifier, parseUpp } from './stats.js';

describe('stats generator', () => {
  it('generates reproducible UPP values for a seed', () => {
    const first = generateStats({ seed: 'cd515598', method: 'normal' });
    const second = generateStats({ seed: 'cd515598', method: 'normal' });

    expect(second).toEqual(first);
  });

  it('calculates Traveller modifiers', () => {
    expect(modifier(7)).toBe(0);
    expect(modifier(6)).toBe(0);
    expect(modifier(9)).toBe(1);
    expect(modifier(0)).toBe(-3);
  });

  it('parses fixed UPP strings', () => {
    const parsed = parseUpp('7a9888');

    expect(parsed.values).toEqual({
      Str: 7,
      Dex: 10,
      End: 9,
      Int: 8,
      Edu: 8,
      Soc: 8,
    });
  });

  it('adds psi when requested', () => {
    const stats = generateStats({ seed: 'bead1234', method: 'heroic', psi: 'science fantasy' });

    expect(stats.upp).toContain('~');
    expect(stats.psiValue).toBeGreaterThanOrEqual(0);
  });

  it('normalizes entered seeds to hex display values', () => {
    const stats = generateStats({ seed: 'mission-file' });

    expect(stats.seed).toMatch(/^[0-9a-f]+$/);
  });
});
