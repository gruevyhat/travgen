import { describe, expect, it } from 'vitest';
import { rollExpression } from './diceExpression.js';

describe('dice expression roller', () => {
  it('rolls reproducibly from dice notation', () => {
    const first = rollExpression({ seed: 'ff', expression: '3d6' });
    const second = rollExpression({ seed: 'ff', expression: '3d6' });

    expect(first).toEqual(second);
    expect(first.rolls).toHaveLength(3);
    expect(first.total).toBeGreaterThanOrEqual(3);
    expect(first.total).toBeLessThanOrEqual(18);
  });

  it('rejects invalid notation', () => {
    expect(() => rollExpression({ expression: 'bad' })).toThrow(/dice notation/);
  });
});
