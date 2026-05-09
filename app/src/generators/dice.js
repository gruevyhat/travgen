export function rollDie(rng, sides) {
  return Math.floor(rng() * sides) + 1;
}

export function rollDice(rng, dice, sides) {
  let total = 0;
  for (let index = 0; index < dice; index += 1) {
    total += rollDie(rng, sides);
  }
  return total;
}

export function d3(rng, dice = 1) {
  return rollDice(rng, dice, 3);
}

export function d6(rng, dice = 1) {
  return rollDice(rng, dice, 6);
}

export function d16(rng, dice = 1) {
  return rollDice(rng, dice, 16);
}

export function d66(rng) {
  return d6(rng, 1) * 10 + d6(rng, 1);
}
