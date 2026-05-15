import { describe, expect, it } from 'vitest';
import { generateCharacter } from './generators/character.js';

describe('skill accumulation', () => {
  it('produces skills above level 1 across multiple terms', () => {
    const allSkills = [];
    for (let i = 0; i < 30; i++) {
      const c = generateCharacter({ terms: 5, seed: i.toString(16) });
      allSkills.push(...Object.values(c.skills));
    }
    const max = Math.max(...allSkills);
    const above1 = allSkills.filter(v => v >= 2).length;
    console.log('Max skill level:', max, '  Skills >= 2:', above1, 'of', allSkills.length);
    expect(max).toBeGreaterThan(1);
  });
});
