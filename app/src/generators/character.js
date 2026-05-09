import gameData from '../data/gameData.json';
import { addSkill, choice, learnSkills, sample, titleCase } from './helpers.js';
import { generateName, ETHNICITIES, GENDERS } from './names.js';
import { createRng, normalizeSeed } from './random.js';
import { d3, d6 } from './dice.js';
import { formatUpp, generateStats, modifier, parseUpp, rollStat } from './stats.js';

const STAT_NAMES = ['Str', 'Dex', 'End', 'Int', 'Edu', 'Soc'];
const EXPANSIONS = {
  psion: 'PSION',
  chthonianStars: 'CHTHONIAN_STARS',
  dilettante: 'DILETTANTE',
  agent: 'AGENT',
  scoundrel: 'SCOUNDREL',
};

export const CAREER_EXPANSIONS = [
  { key: 'psion', label: 'Psion' },
  { key: 'chthonianStars', label: 'Chthonian Stars' },
  { key: 'dilettante', label: 'Dilettante' },
  { key: 'agent', label: 'Agent' },
  { key: 'scoundrel', label: 'Scoundrel' },
];

export const WORLDS = Object.keys(gameData.WORLDS).sort();
export { ETHNICITIES, GENDERS };

export function careerCatalog(expansions = {}) {
  const careers = buildCareers(expansions);
  return Object.fromEntries(
    Object.entries(careers).map(([career, specs]) => [career, Object.keys(specs).sort()]),
  );
}

export function generateCharacter(options = {}) {
  const seed = normalizeSeed(options.seed);
  const rng = createRng(seed);
  const expansions = options.expansions ?? {};
  const careers = buildCareers(expansions);
  const fallbackCareers = buildFallbackCareers(expansions);
  const gender = options.gender || choice(rng, GENDERS);
  const ethnicity = options.ethnicity || choice(rng, ETHNICITIES);
  const name = options.name || generateName(rng, { ethnicity, gender });
  const homeworld = options.homeworld || choice(rng, WORLDS);
  const termsRequested = clampInt(options.terms, 1, 8, 3);
  const stats = options.upp
    ? { ...parseUpp(options.upp).values, Psi: rollStat(rng, options.method || 'normal') }
    : { ...generateStats({ method: options.method || 'normal', psi: options.psi || '', seed }).values, Psi: rollStat(rng, options.method || 'normal') };
  const skills = {};
  const history = [`BACKGROUND`, ` Starting UPP: ${formatUpp(stats)} [${averageCore(stats).toFixed(1)}]`];
  const terms = [];
  const benefits = [];
  let credits = 0;
  let currentCareer = null;
  let currentSpec = null;
  let newCareer = false;
  const attempted = [];

  const eduCount = Math.max(0, gameData.STARTING_SKILLS + modifier(stats.Edu));
  const background = uniqueSkillEntries([
    ...gameData.EDU_SKILLS,
    ...(gameData.WORLDS[homeworld] ?? []),
  ]);
  const educationSkills = sample(rng, background, eduCount);
  learnSkills(skills, educationSkills);
  for (const [skill, value] of educationSkills) {
    history.push(` Learned ${skill} ${value} from Education.`);
  }

  const requestedPath = options.careerPlan?.length
    ? options.careerPlan.map((term) => ({
      career: term.career || null,
      spec: term.spec || null,
    }))
    : parseCareerPath(options.path);

  for (let index = 0; index < termsRequested; index += 1) {
    const term = blankTerm(index);
    history.push(`TERM ${index}`);
    const requested = requestedPath[index];
    if (requested?.career && careers[requested.career]) {
      currentCareer = requested.career;
      currentSpec = careers[currentCareer][requested.spec] ? requested.spec : choice(rng, Object.keys(careers[currentCareer]));
      newCareer = index > 0 && terms[index - 1].Career !== currentCareer;
    } else if (index > 0 && !newCareer && currentCareer) {
      currentCareer = terms[index - 1].Career;
      currentSpec = terms[index - 1].Spec;
    } else {
      [currentCareer, currentSpec] = pickCareer(rng, careers, stats, attempted);
    }

    term.Career = currentCareer;
    term.Spec = currentSpec;
    history.push(` Career: ${currentCareer} (${currentSpec}).`);
    attempted.push(currentCareer);

    const table = careers[currentCareer][currentSpec];
    term.Q = qualify(rng, stats, table, currentCareer, index, terms, newCareer);
    if (!term.Q) {
      currentCareer = choice(rng, fallbackCareers.filter((career) => careers[career]) || ['Drifter']);
      currentSpec = choice(rng, Object.keys(careers[currentCareer]));
      term.Career = currentCareer;
      term.Spec = currentSpec;
      newCareer = true;
      history.push(` Failed to qualify. New Career: ${currentCareer}.`);
    }

    term.Edu = index === 0 ? eduCount : 0;
    term.BT = basicTrainingCount(index, newCareer, terms, currentCareer);
    if (term.BT) {
      const basic = getSkillSlice(currentCareer, currentSpec, 'BT');
      const learned = index === 0 ? basic : [choice(rng, basic)];
      learnSkills(skills, learned);
      learned.forEach(([skill, value]) => history.push(` Learned ${skill} ${value} in Basic Training.`));
    }

    term.SR = 1;
    term.S = statCheck(rng, stats, table.Surv);
    if (!term.S) {
      term.A = false;
      newCareer = true;
      const mishap = d6(rng);
      term.EM = `m[${mishap}]`;
      history.push(` Experienced a Mishap (Roll=${mishap}).`);
    } else {
      newCareer = false;
      skillRoll(rng, stats, skills, currentCareer, currentSpec, history);
      const event = [d6(rng), d6(rng)];
      term.EM = `e[${event[0]},${event[1]}]`;
      history.push(` Experienced an Event (Roll=${event[0]},${event[1]}).`);
      term.A = statCheck(rng, stats, table.Adv);
      if (term.A) {
        term.SR += 1;
        skillRoll(rng, stats, skills, currentCareer, currentSpec, history);
      }
    }

    term.Rnk = rankForTerm(index, terms, currentCareer, Boolean(term.A));
    if (term.A) {
      history.push(` Promoted to Rank ${term.Rnk}.`);
      rankRoll(rng, stats, skills, currentCareer, currentSpec, term.Rnk, history);
    }

    term.Age = index < 3 ? '-' : d6(rng, 2) - index + 1;
    term.Ben = d6(rng);
    const baseCareer = currentCareer.replace(' Officer', '');
    if (rng() < 0.5) {
      credits += choiceCredit(baseCareer, term.Ben);
      history.push(` Acquired ${credits} total credits.`);
    } else {
      const benefit = choiceBenefit(rng, stats, skills, baseCareer, term.Ben);
      if (benefit) {
        benefits.push(benefit);
        history.push(` Acquired Benefit: ${benefit}.`);
      }
    }

    terms.push(term);
    stats.Psi = Math.max(0, stats.Psi - 1);
  }

  const age = gameData.STARTING_AGE + terms.length * 4 + (options.randAge ? d3(rng, terms.length) - 2 * terms.length : 0);
  const personality = options.personality ? generatePersonality(rng) : null;
  const careerPath = summarizeCareerPath(terms);
  const finalUpp = formatUpp(stats, options.psi ? stats.Psi : null);

  return {
    seed,
    name,
    gender,
    ethnicity,
    homeworld,
    age,
    stats,
    upp: finalUpp,
    average: averageCore(stats),
    careerPath,
    terms,
    skills: Object.fromEntries(Object.entries(skills).filter(([, value]) => value >= 0).sort()),
    benefits,
    credits,
    personality,
    history,
    plainText: '',
  };
}

function buildCareers(expansions) {
  const careers = structuredClone(gameData.CAREERS);
  for (const [key, dataKey] of Object.entries(EXPANSIONS)) {
    if (expansions[key]) {
      Object.assign(careers, structuredClone(gameData[dataKey]));
    }
  }
  if (expansions.chthonianStars) {
    delete careers.Nobility;
    delete careers.Scout;
  }
  if (expansions.agent) {
    delete careers.Agent;
  }
  if (expansions.scoundrel) {
    delete careers.Drifter;
  }
  return careers;
}

function buildFallbackCareers(expansions) {
  const fallback = [...gameData.FALLBACK_CAREERS];
  if (expansions.scoundrel) {
    return fallback.filter((career) => career !== 'Drifter').concat(['Wanderer', 'Scavenger']);
  }
  return fallback;
}

function pickCareer(rng, careers, stats, attempted) {
  const ranked = [];
  for (const [career, specs] of Object.entries(careers)) {
    if (attempted.includes(career) || career.endsWith('Officer')) continue;
    for (const [spec, table] of Object.entries(specs)) {
      const score = Object.values(table).reduce((total, [stat, target]) => {
        if (!target) return total;
        return total + ((stats[stat] ?? 0) - target);
      }, 0);
      ranked.push([score, career, spec]);
    }
  }
  ranked.sort((a, b) => b[0] - a[0]);
  const pick = choice(rng, ranked.slice(0, 5));
  return [pick[1], pick[2]];
}

function qualify(rng, stats, table, career, index, terms, newCareer) {
  if (!table.Qual?.[1] || (index > 0 && !newCareer)) return true;
  if (career === 'Nobility' || career === 'Aristocrat') return stats.Soc >= table.Qual[1];
  if (career === 'Psion') return stats.Psi - index >= table.Qual[1];
  return statCheck(rng, stats, table.Qual, -terms.length);
}

function statCheck(rng, stats, [stat, target], mods = 0) {
  return d6(rng, 2) + modifier(stats[stat] ?? 0) + mods >= target;
}

function skillRoll(rng, stats, skills, career, spec, history) {
  const tabs = ['Personal Development', 'Service', 'Specialization'];
  if (career !== 'Drifter' && stats.Edu >= 8) tabs.push('Advanced Education');
  if (career.includes('Officer')) tabs.push('Officer');
  const tab = choice(rng, tabs);
  const entry = choice(rng, getSkillSlice(career.replace(' Officer', ''), spec, tab));
  applySkillOrStat(rng, stats, skills, entry[0], entry[1], history, `from the ${tab} table`);
}

function rankRoll(rng, stats, skills, career, spec, rank, history) {
  const key = `${career}|${spec}`;
  const entry = gameData.RANKS[key]?.[Math.min(rank, 6)];
  if (entry) applySkillOrStat(rng, stats, skills, entry[0], entry[1], history, 'from advancement');
}

function applySkillOrStat(rng, stats, skills, attr, value, history, source) {
  const picked = choice(rng, String(attr).split(' or '));
  if ([...STAT_NAMES, 'Psi'].includes(picked)) {
    stats[picked] = Math.max(0, (stats[picked] ?? 0) + 1);
    history.push(` Received +1 ${picked} ${source}.`);
  } else {
    addSkill(skills, picked, value);
    history.push(` Learned ${picked} ${skills[picked]} ${source}.`);
  }
}

function getSkillSlice(career, spec, tab) {
  const table = gameData.SKILLS[`${career}|${spec}`] ?? gameData.SKILLS[`Drifter|Wanderer`];
  const start = gameData.SKILL_TYPES[tab] * 6;
  return table.slice(start, start + 6);
}

function choiceCredit(career, roll) {
  return (gameData.CREDITS[career] ?? gameData.CREDITS.Drifter)?.[roll - 1] ?? 0;
}

function choiceBenefit(rng, stats, skills, career, roll) {
  const entry = (gameData.BENEFITS[career] ?? gameData.BENEFITS.Drifter)?.[roll - 1];
  if (!entry) return null;
  const picked = Array.isArray(entry[0]) ? choice(rng, entry) : entry;
  const [benefit, mod] = picked;
  if ([...STAT_NAMES, 'Psi'].includes(benefit)) {
    stats[benefit] = Math.max(0, (stats[benefit] ?? 0) + mod);
    return `${benefit} +${mod}`;
  }
  if (gameData.SKILLS[benefit]) {
    addSkill(skills, benefit, mod);
    return `${benefit} +${mod}`;
  }
  return benefit === 'Ship Shares' ? `Ship Shares (${mod})` : benefit;
}

function parseCareerPath(path) {
  if (!path) return [];
  return String(path).split('::').map((term) => {
    const [career, spec] = term.split(':');
    return { career: career === '-' ? null : career, spec: spec === '-' ? null : spec };
  });
}

function basicTrainingCount(index, newCareer, terms, career) {
  if (index === 0) return 6;
  if (newCareer || terms[index - 1]?.Career !== career) return 1;
  return 0;
}

function rankForTerm(index, terms, career, advanced) {
  const previous = index > 0 && terms[index - 1].Career === career ? terms[index - 1].Rnk : 0;
  return advanced ? Math.min(6, previous + 1) : previous;
}

function summarizeCareerPath(terms) {
  const path = new Map();
  for (const term of terms) {
    path.set(`${term.Career}|${term.Spec}`, term.Rnk);
  }
  return Array.from(path.entries()).map(([key, rank]) => {
    const [career, spec] = key.split('|');
    return { career, spec, rank };
  });
}

function generatePersonality(rng) {
  const mb = ['IE', 'SN', 'FT', 'JP'].map((pair) => choice(rng, pair.split(''))).join('');
  return [mb, ...gameData.PERSONALITIES.map((items) => choice(rng, items))];
}

function blankTerm(index) {
  return Object.fromEntries(gameData.FIELDS.map((field) => [field, field === 'T' ? index : null]));
}

function uniqueSkillEntries(entries) {
  return Array.from(new Map(entries.map(([skill, value]) => [`${skill}|${value}`, [skill, value]])).values());
}

function averageCore(stats) {
  return STAT_NAMES.reduce((total, stat) => total + stats[stat], 0) / 6;
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export function formatCharacterText(character) {
  const skills = Object.entries(character.skills).map(([skill, value]) => `${skill} ${value}`).join(', ');
  const path = character.careerPath.map((item) => `${item.career} (${item.spec}) [Rank ${item.rank}]`).join(', ');
  const benefits = [
    character.credits ? `${character.credits} Cr.` : '',
    ...character.benefits,
  ].filter(Boolean).join(', ');
  const personality = character.personality ? `\nPersonality: ${character.personality.join('; ')}` : '';
  return `${character.name}
${titleCase(character.gender)} ${character.homeworld} (${titleCase(character.ethnicity)}), age ${character.age}
UPP: ${character.upp} [${character.average.toFixed(1)}]
Career Path: ${path}
Skills: ${skills}
Benefits: ${benefits || 'None'}${personality}
Seed: ${character.seed}`;
}
