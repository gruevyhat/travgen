export function choice(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

export function sample(rng, items, count) {
  const pool = [...items];
  const picked = [];
  const n = Math.max(0, Math.min(count, pool.length));
  for (let index = 0; index < n; index += 1) {
    const pick = Math.floor(rng() * pool.length);
    picked.push(pool.splice(pick, 1)[0]);
  }
  return picked;
}

export function titleCase(text) {
  return String(text)
    .replaceAll('_', ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function addSkill(skills, name, value) {
  skills[name] = Math.max((skills[name] ?? -3) + value, value);
}

export function learnSkills(skills, entries) {
  for (const [name, value] of entries) {
    if (skills[name] === undefined) {
      skills[name] = value;
    } else {
      skills[name] += value;
    }
  }
}
