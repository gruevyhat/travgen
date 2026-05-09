import { createRng, normalizeSeed } from './random.js';
import { rollDice } from './dice.js';

export function rollExpression({ expression = '2d6', seed = '' } = {}) {
  const normalizedSeed = normalizeSeed(seed);
  const rng = createRng(normalizedSeed);
  const match = String(expression).trim().toLowerCase().match(/^(\d*)d(\d+)$/);
  if (!match) {
    throw new Error('Use dice notation like 2d6 or d20.');
  }

  const dice = match[1] ? Number.parseInt(match[1], 10) : 1;
  const sides = Number.parseInt(match[2], 10);
  if (dice < 1 || dice > 100 || sides < 2 || sides > 1000) {
    throw new Error('Dice must be 1-100 and sides must be 2-1000.');
  }

  const rolls = Array.from({ length: dice }, () => rollDice(rng, 1, sides));
  return {
    seed: normalizedSeed,
    expression: `${dice}d${sides}`,
    rolls,
    total: rolls.reduce((total, value) => total + value, 0),
  };
}
