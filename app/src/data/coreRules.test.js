import { describe, expect, it } from 'vitest';
import { CORE_SKILLS } from '../generators/character.js';
import coreRules from './coreRules.json';

function expandRanges(ranges) {
  return ranges.flatMap((range) => Array.from({ length: range.max - range.min + 1 }, (_, index) => range.min + index));
}

describe('core rules data', () => {
  it('stores structured facts only with source metadata', () => {
    expect(coreRules.metadata.source).toContain('Traveller - Core Rulebook');
    expect(coreRules.metadata.rawTextCommitted).toBe(false);
    expect(coreRules.equipment.length).toBeGreaterThan(0);
  });

  it('has complete non-overlapping roll coverage', () => {
    const expectations = {
      careerEvents: [2, 12],
      careerMishaps: [1, 6],
      lifeEvents: [2, 12],
      injuries: [1, 6],
    };

    for (const [tableId, [min, max]] of Object.entries(expectations)) {
      const rolls = expandRanges(coreRules.rollTables[tableId].ranges);
      const expected = Array.from({ length: max - min + 1 }, (_, index) => min + index);
      expect([...new Set(rolls)]).toEqual(expected);
      expect(rolls).toHaveLength(expected.length);
    }
  });

  it('does not reference missing homeworld skill targets', () => {
    const skills = Object.values(coreRules.homeworldGeneration.tradeCodeSkills).flat();

    expect(skills.every((skill) => typeof skill === 'string' && skill.length > 0)).toBe(true);
    expect(skills.every((skill) => CORE_SKILLS.includes(skill))).toBe(true);
  });
});
