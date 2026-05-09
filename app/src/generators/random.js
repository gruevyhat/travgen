export function normalizeSeed(seed) {
  const trimmed = String(seed ?? '').trim();
  const withoutPrefix = trimmed.toLowerCase().replace(/^0x/, '');
  if (!withoutPrefix) {
    const value = Math.floor(Math.random() * 0xffffffff);
    return value.toString(16).padStart(8, '0');
  }

  if (/^[0-9a-f]+$/.test(withoutPrefix)) {
    return withoutPrefix;
  }

  return hashSeed(withoutPrefix).toString(16).padStart(8, '0');
}

export function seedToNumber(seed) {
  const normalized = normalizeSeed(seed);
  const parsed = Number.parseInt(normalized, 16);
  if (Number.isFinite(parsed)) {
    return parsed >>> 0;
  }

  return hashSeed(normalized);
}

function hashSeed(seed) {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed) {
  let state = seedToNumber(seed) || 0x6d2b79f5;

  return function rng() {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}
