import gameData from '../data/gameData.json';
import coreRules from '../data/coreRules.json';
import { addSkill, choice, learnSkills, sample, titleCase } from './helpers.js';
import { generateName, ETHNICITIES, GENDERS } from './names.js';
import { createRng, normalizeSeed } from './random.js';
import { d3, d6 } from './dice.js';
import { formatUpp, generateStats, modifier, parseUpp, rollStat } from './stats.js';
import { generateSpacecraft } from './spacecraft.js';
import { generateWorldFromRng, deriveEthnicity } from './world.js';
export { deriveEthnicity } from './world.js';

const STAT_NAMES = ['Str', 'Dex', 'End', 'Int', 'Edu', 'Soc'];
const PHYSICAL_STATS = ['Str', 'Dex', 'End'];
const MENTAL_STATS = ['Int', 'Edu'];
const MILITARY_CAREERS = new Set(['Army', 'Navy', 'Marines']);
const PSIONIC_TALENTS = ['Telepathy', 'Clairvoyance', 'Telekinesis', 'Awareness', 'Teleportation'];
const PSIONIC_POWERS = {
  Telepathy: ['Life Detection', 'Telempathy', 'Read Surface Thoughts', 'Send Thoughts', 'Probe', 'Assault'],
  Clairvoyance: ['Sense', 'Clairvoyance', 'Clairaudience', 'Combined Clairvoyance and Clairaudience'],
  Telekinesis: ['Telekinetic Manipulation'],
  Awareness: ['Suspended Animation', 'Awareness', 'Enhanced Awareness'],
  Teleportation: ['Personal Teleportation'],
};
const SKILL_SPECIALTIES = {
  Animals: ['riding', 'training', 'veterinary'],
  Art: ['acting', 'dance', 'holography', 'instrument', 'sculpting', 'writing'],
  Drive: ['hovercraft', 'tracked', 'wheeled'],
  Engineer: ['j-drive', 'life support', 'm-drive', 'power'],
  Flyer: ['airship', 'grav', 'rotor', 'wing'],
  'Gun Combat': ['energy', 'slug', 'shotgun'],
  Gunner: ['bay weapons', 'capital weapons', 'screens', 'turrets'],
  'Heavy Weapons': ['artillery', 'man portable', 'vehicle'],
  Language: ['Anglic', 'Vilani', 'Zdetl', 'Oynprith'],
  Melee: ['blade', 'bludgeon', 'natural', 'unarmed'],
  Pilot: ['capital ships', 'small craft', 'spacecraft'],
  Profession: ['belter', 'biologicals', 'civil engineering', 'hydroponics', 'polymers'],
  'Life Science': ['biology', 'cybernetics', 'genetics', 'psionicology'],
  'Physical Science': ['chemistry', 'electronics', 'physics'],
  'Social Science': ['archaeology', 'economics', 'history', 'linguistics', 'philosophy', 'psychology', 'sophontology'],
  'Space Science': ['planetology', 'robotics', 'xenology'],
  Trade: ['biologicals', 'civil engineering', 'hydroponics', 'polymers'],
};
const DRAFT_TABLE = [
  ['Navy', null],
  ['Army', null],
  ['Marines', null],
  ['Merchant', 'Merchant Marine'],
  ['Scout', null],
  ['Agent', 'Law Enforcement'],
];
let localCareerTables = null;
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
  const localCareerTableModules = import.meta.glob('../data/coreCareerTables.local.json', { eager: true });
  localCareerTables = localCareerTableModules['../data/coreCareerTables.local.json']?.default ?? null;
}
const EXPANSIONS = {
  psion: 'PSION',
  chthonianStars: 'CHTHONIAN_STARS',
  dilettante: 'DILETTANTE',
  agent: 'AGENT',
  scoundrel: 'SCOUNDREL',
};

export const CORE_SKILLS = [
  'Admin', 'Advocate', 'Animals', 'Art', 'Astrogation', 'Athletics',
  'Battle Dress', 'Broker', 'Carouse', 'Comms', 'Computers',
  'Deception', 'Diplomat', 'Drive', 'Engineer', 'Explosives', 'Flyer',
  'Gambler', 'Gun Combat', 'Gunner', 'Heavy Weapons', 'Investigate',
  'Jack of all Trades', 'Language', 'Leadership', 'Life Science',
  'Mechanic', 'Medic', 'Melee', 'Navigation', 'Persuade', 'Physical Science',
  'Pilot', 'Profession', 'Recon', 'Remote Operations', 'Seafarer', 'Sensors',
  'Social Science', 'Space Science', 'Stealth', 'Steward', 'Streetwise',
  'Survival', 'Tactics', 'Trade', 'Vacc Suit', 'Zero-G',
];

export const CAREER_EXPANSIONS = [
  { key: 'psion', label: 'Psion' },
  { key: 'chthonianStars', label: 'Chthonian Stars' },
  { key: 'dilettante', label: 'Dilettante' },
  { key: 'agent', label: 'Agent' },
  { key: 'scoundrel', label: 'Scoundrel' },
];

export const WORLDS = Object.keys(gameData.WORLDS).sort();
export const CAMPAIGN_MODES = [
  { value: 'standard', label: 'Standard Traveller' },
  { value: 'chthonian', label: 'Chthonian Stars' },
];
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
  const campaignMode = options.campaignMode || (options.expansions?.chthonianStars ? 'chthonian' : 'standard');
  const expansions = options.expansions ?? {};
  const careers = buildCareers(expansions);
  const fallbackCareers = buildFallbackCareers(expansions);
  const gender = options.gender || choice(rng, GENDERS);
  const homeworld = generateHomeworld(rng, { campaignMode, requested: options.homeworld });
  const ethnicity = options.ethnicity || (
    expansions.chthonianStars
      ? choice(rng, coreRules.ethnicityGeneration.chthonianStars)
      : deriveEthnicity(homeworld.name)
  );
  const name = options.name || generateName(rng, { ethnicity, gender });
  const termsRequested = clampInt(options.terms, 1, 8, 3);
  const stats = options.upp
    ? { ...parseUpp(options.upp).values, Psi: rollStat(rng, options.method || 'normal') }
    : { ...generateStats({ method: options.method || 'normal', psi: options.psi || '', seed }).values, Psi: rollStat(rng, options.method || 'normal') };
  const skills = {};
  const history = [`BACKGROUND`, ` Starting UPP: ${formatUpp(stats)} [${averageCore(stats).toFixed(1)}]`];
  const terms = [];
  const benefits = [];
  const equipment = [];
  const contacts = [];
  const enemies = [];
  const awards = [];
  const injuries = [];
  const events = [];
  const mishaps = [];
  const lifeEvents = [];
  const aging = [];
  const debts = [];
  let credits = 0;
  let cashRolls = 0;
  let currentCareer = null;
  let currentSpec = null;
  let newCareer = false;
  let commissioned = false;
  let usedDraft = false;
  const enteredCareers = [];
  let currentSegment = null;
  const pending = {
    nextQualificationDm: 0,
    nextSurvivalDm: 0,
    forceDraft: false,
    forceCareer: null,
    blockedCareers: new Set(),
    autoQualifyCareers: new Set(),
  };

  const eduCount = Math.max(0, gameData.STARTING_SKILLS + modifier(stats.Edu));
  const educationSkills = chooseBackgroundSkills(rng, homeworld, eduCount);
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
    term.steps = [];
    history.push(`TERM ${index}`);
    const requested = requestedPath[index];
    if (requested?.career && careers[requested.career] && canEnterCareer(requested.career, currentCareer, enteredCareers, pending)) {
      currentCareer = requested.career;
      currentSpec = careers[currentCareer][requested.spec] ? requested.spec : choice(rng, Object.keys(careers[currentCareer]));
      newCareer = index === 0 || terms[index - 1].Career !== currentCareer;
    } else if (index > 0 && !newCareer && currentCareer) {
      currentCareer = terms[index - 1].Career;
      currentSpec = terms[index - 1].Spec;
    } else if (pending.forceCareer && careers[pending.forceCareer] && canEnterCareer(pending.forceCareer, currentCareer, enteredCareers, pending)) {
      currentCareer = pending.forceCareer;
      currentSpec = choice(rng, Object.keys(careers[currentCareer]));
      pending.forceCareer = null;
      newCareer = true;
    } else {
      [currentCareer, currentSpec] = pickCareer(rng, careers, stats, enteredCareers, currentCareer, pending);
      newCareer = true;
    }
    if (pending.forceDraft && newCareer) {
      [currentCareer, currentSpec, usedDraft] = draftOrDrift(rng, careers, fallbackCareers, usedDraft);
      pending.forceDraft = false;
    }

    term.Career = currentCareer;
    term.Spec = currentSpec;
    term.Commissioned = commissioned;
    history.push(` Career: ${currentCareer} (${currentSpec}).`);

    let table = careers[currentCareer][currentSpec];
    term.Qualification = qualify(rng, stats, table, currentCareer, enteredCareers, newCareer, pending);
    term.Q = term.Qualification.success;
    term.steps.push({
      stage: 'Qualification',
      roll: formatCheckRoll(term.Qualification),
      result: term.Q ? 'Qualified' : 'Failed qualification',
      detail: `${currentCareer} ${formatTarget(table.Qual)}${term.Qualification.reason ? ` (${term.Qualification.reason})` : ''}`,
    });
    if (!term.Q) {
      [currentCareer, currentSpec, usedDraft] = draftOrDrift(rng, careers, fallbackCareers, usedDraft);
      commissioned = false;
      term.Career = currentCareer;
      term.Spec = currentSpec;
      term.Commissioned = false;
      newCareer = true;
      table = careers[currentCareer][currentSpec];
      history.push(` Failed to qualify. New Career: ${currentCareer}.`);
      term.steps.push({
        stage: usedDraft ? 'Draft' : 'Drifter fallback',
        roll: usedDraft ? 'draft table' : '-',
        result: `${currentCareer} / ${currentSpec}`,
        detail: 'Failed qualification redirected the term.',
      });
    }
    if (newCareer) {
      enteredCareers.push(currentCareer);
      currentSegment = startCareerSegment(currentCareer);
    }

    term.Edu = index === 0 ? eduCount : 0;
    term.BT = basicTrainingCount(index, newCareer, terms, currentCareer);
    if (term.BT) {
      const basic = getSkillSlice(currentCareer, currentSpec, 'BT');
      const learned = index === 0 ? basic : [choice(rng, basic)];
      const resolvedLearned = learned.map(([skill, value]) => [resolveAwardedSkill(rng, skills, skill), value]);
      resolvedLearned.forEach(([skill, value]) => {
        gainSkill(skills, skill, value);
        history.push(` Learned ${skill} ${skills[skill]} in Basic Training.`);
      });
      term.steps.push({
        stage: 'Basic Training',
        roll: index === 0 ? 'all service skills' : 'automated pick',
        result: resolvedLearned.map(([skill, value]) => `${skill} ${value}`).join(', '),
        detail: index === 0 ? 'First career grants all service skills at level 0.' : 'New career grants one service skill.',
      });
    }

    term.SR = 1;
    term.SurvivalDm = pending.nextSurvivalDm;
    pending.nextSurvivalDm = 0;
    term.Survival = rollCheck(rng, stats, table.Surv, term.SurvivalDm);
    term.S = term.Survival.success;
    term.steps.push({
      stage: 'Survival',
      roll: formatCheckRoll(term.Survival),
      result: term.S ? 'Survived' : 'Mishap',
      detail: `${formatTarget(table.Surv)}${term.SurvivalDm ? `, DM ${signed(term.SurvivalDm)}` : ''}`,
    });
    if (!term.S) {
      term.A = false;
      newCareer = true;
      const mishap = d6(rng);
      term.EM = `m[${mishap}]`;
      term.mishap = termRecord(resolveMishap(rng, mishap, stats, {
        contacts,
        enemies,
        injuries,
        lifeEvents,
        career: currentCareer,
        spec: currentSpec,
        skills,
        awards,
        currentSegment,
        pending,
        creditsRef: () => credits,
        setCredits: (value) => { credits = value; },
      }), index, currentCareer, currentSpec);
      term.incidents = [term.mishap];
      mishaps.push(term.mishap);
      term.S = Boolean(term.mishap.continueCareer);
      newCareer = !term.S;
      history.push(` Mishap: ${term.mishap.label}.`);
      term.steps.push({
        stage: 'Mishap',
        roll: `1d6 = ${mishap}`,
        result: term.mishap.label,
        detail: detailForIncident(term.mishap),
      });
    } else {
      newCareer = false;
      term.steps.push(skillStep('Service Skill', skillRoll(rng, stats, skills, currentCareer, currentSpec, history, { commissioned })));
      const event = [d6(rng), d6(rng)];
      term.EM = `e[${event[0]},${event[1]}]`;
      term.event = termRecord(resolveCareerEvent(rng, event[0] + event[1], stats, skills, currentCareer, currentSpec, {
        contacts,
        enemies,
        awards,
        injuries,
        lifeEvents,
        career: currentCareer,
        spec: currentSpec,
        skills,
        currentSegment,
        pending,
        setCredits: (value) => { credits = value; },
        creditsRef: () => credits,
      }, history), index, currentCareer, currentSpec);
      term.incidents = [term.event];
      events.push(term.event);
      history.push(` Event: ${term.event.label}.`);
      term.steps.push({
        stage: 'Event',
        roll: `2d6 = ${event[0]} + ${event[1]} = ${event[0] + event[1]}`,
        result: term.event.label,
        detail: detailForIncident(term.event),
      });
      const commissionAttempt = MILITARY_CAREERS.has(currentCareer) && !commissioned && shouldAttemptCommission(stats, table);
      if (commissionAttempt) {
        const commission = rollCheck(rng, stats, ['Soc', gameData.COMMISSION ?? 8]);
        term.Commission = commission.success;
        term.CommissionRoll = commission.total;
        term.CommissionCheck = commission;
        term.steps.push({
          stage: 'Commission',
          roll: formatCheckRoll(commission),
          result: commission.success ? 'Commissioned' : 'Not commissioned',
          detail: `Soc ${gameData.COMMISSION ?? 8}+`,
        });
        if (commission.success) {
          commissioned = true;
          term.Commissioned = true;
          term.Rnk = Math.max(term.Rnk ?? 0, 1);
          history.push(` Commissioned as a ${currentCareer} officer.`);
          term.steps.push(skillStep('Rank Reward', rankRoll(rng, stats, skills, `${currentCareer} Officer`, currentSpec, 1, history)));
        }
      }
      if (term.event.automaticPromotion || term.event.automaticCommission) {
        if (term.event.automaticCommission && MILITARY_CAREERS.has(currentCareer) && !commissioned) {
          commissioned = true;
          term.Commission = true;
          term.Commissioned = true;
          term.Rnk = Math.max(term.Rnk ?? 0, 1);
          term.steps.push(skillStep('Automatic Commission Reward', rankRoll(rng, stats, skills, `${currentCareer} Officer`, currentSpec, 1, history)));
        } else {
          term.Rnk = rankForTerm(index, terms, currentCareer, true, commissioned || term.Commissioned, term.Rnk);
          term.steps.push(skillStep('Automatic Promotion Reward', rankRoll(rng, stats, skills, commissioned ? `${currentCareer} Officer` : currentCareer, currentSpec, term.Rnk, history)));
        }
        history.push(` Automatically advanced from event ${term.event.roll}.`);
      }
      const advancement = rollCheck(rng, stats, table.Adv, term.event.advancementDm ?? 0);
      term.Advancement = advancement;
      term.AdvancementRoll = advancement.natural;
      term.A = advancement.success;
      term.steps.push({
        stage: 'Advancement',
        roll: formatCheckRoll(advancement),
        result: term.A ? 'Advanced' : 'No advancement',
        detail: `${formatTarget(table.Adv)}${term.event.advancementDm ? `, event DM ${signed(term.event.advancementDm)}` : ''}`,
      });
      if (term.A) {
        term.SR += 1;
        term.steps.push(skillStep('Advancement Skill', skillRoll(rng, stats, skills, currentCareer, currentSpec, history, { commissioned: commissioned || term.Commissioned })));
      }
      term.MustLeave = advancement.natural <= careerTermCount(terms, currentCareer) + 1 && advancement.natural !== 12;
      term.MustContinue = advancement.natural === 12;
    }

    term.Rnk = rankForTerm(index, terms, currentCareer, Boolean(term.A), commissioned || term.Commissioned, term.Rnk);
    if (term.A) {
      history.push(` Promoted to Rank ${term.Rnk}.`);
      term.steps.push(skillStep('Rank Reward', rankRoll(rng, stats, skills, commissioned ? `${currentCareer} Officer` : currentCareer, currentSpec, term.Rnk, history)));
    }

    currentSegment.terms += term.S ? 1 : 0;
    currentSegment.highestRank = Math.max(currentSegment.highestRank, term.Rnk ?? 0);
    currentSegment.leftByMishap = Boolean(term.mishap && !term.mishap.continueCareer);
    term.Aging = index < 3 ? null : applyAging(rng, stats, index + 1, debts);
    term.Age = term.Aging ? term.Aging.roll : '-';
    if (term.Aging) aging.push(term.Aging);
    term.steps.push({
      stage: 'Aging',
      roll: term.Aging ? `2d6 = ${term.Aging.natural}; ${term.Aging.natural} - ${index + 1} terms = ${term.Aging.roll}` : '-',
      result: term.Aging ? agingResultText(term.Aging) : 'No aging roll before term 4',
      detail: term.Aging?.crisis ? `Medical debt ${term.Aging.crisis.amount} Cr.` : '',
    });
    terms.push(term);
    stats.Psi = Math.max(0, stats.Psi - 1);

    const finalTerm = index === termsRequested - 1;
    const leavingCareer = finalTerm || !term.S || (term.MustLeave && !term.MustContinue);
    if (leavingCareer) {
      const mustered = musterOutCareer(rng, stats, skills, currentSegment, benefits, equipment, {
        cashRolls,
        getCashRolls: () => cashRolls,
        addCashRoll: () => { cashRolls += 1; },
        addCredits: (amount) => { credits += amount; },
      });
      term.Ben = mustered.rolls;
      term.MusteringOut = mustered;
      if (mustered.details.length) {
        for (const detail of mustered.details) {
          term.steps.push({
            stage: detail.table,
            roll: detail.roll,
            result: detail.result,
          });
        }
      } else {
        term.steps.push({
          stage: 'Mustering Out',
          roll: '-',
          result: mustered.items.length ? mustered.items.map((item) => item.name).join(', ') : 'No benefits',
          detail: `${mustered.rolls} benefit roll${mustered.rolls === 1 ? '' : 's'} from ${currentSegment.career}.`,
        });
      }
      newCareer = true;
      commissioned = false;
    } else {
      newCareer = false;
      term.Ben = 0;
    }
  }

  const age = gameData.STARTING_AGE + terms.length * 4 + (options.randAge ? d3(rng, terms.length) - 2 * terms.length : 0);
  const personality = options.personality ? generatePersonality(rng) : null;
  const careerPath = summarizeCareerPath(terms);
  const finalUpp = formatUpp(stats, options.psi ? stats.Psi : null);
  const purchased = purchaseCareerKit(rng, careerPath, homeworld, credits, equipment, skills);
  credits -= purchased.reduce((total, item) => total + item.cost, 0);
  equipment.push(...purchased);
  const combatWeapon = purchaseCombatWeapon(credits, equipment, skills);
  if (combatWeapon) {
    credits -= combatWeapon.cost;
    equipment.push(combatWeapon);
  }
  for (const debt of debts) credits -= debt.amount;
  // RAW: specialties are only chosen at level 1+; level-0 specialty entries collapse to the base.
  // A specialty at 0 is identical to the unspecialized level, so promote it to the base instead.
  for (const key of [...Object.keys(skills)]) {
    const match = key.match(/^(.+?)\s*\(/);
    if (!match || skills[key] !== 0) continue;
    const parent = match[1].trim();
    if (skills[parent] === undefined) skills[parent] = 0;
    delete skills[key];
  }
  // RAW: having any specialty grants the parent at 0 for unspecialized checks.
  for (const key of Object.keys(skills)) {
    const match = key.match(/^(.+?)\s*\(/);
    if (match && skills[match[1]] === undefined) skills[match[1]] = 0;
  }
  const combat = buildCombatTable(equipment, skills, stats);
  const psionics = buildPsionics(skills, stats, terms, options);
  const spacecraft = generateSpacecraft(rng, careerPath, benefits, equipment);
  const resume = buildResume({ terms, skills, benefits, equipment, contacts, enemies, awards, injuries, events, mishaps, lifeEvents, careerPath });
  const bio = buildCharacterBio({ name, gender, homeworld, careerPath, events, mishaps, lifeEvents });
  const pension = calculatePension(terms);
  const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);
  const careerHistory = terms.map((term) => ({
    term: term.T + 1,
    career: term.Career,
    spec: term.Spec,
    rank: term.Rnk ?? 0,
    title: rankTitle(term.Career, term.Rnk),
    event: term.mishap ? term.mishap.label : (term.event ? term.event.label : null),
    survived: Boolean(term.S),
  }));

  return {
    seed,
    identity: { name, gender, ethnicity },
    name,
    gender,
    ethnicity,
    campaignMode,
    homeworld,
    age,
    stats,
    upp: finalUpp,
    average: averageCore(stats),
    careerPath,
    careerHistory,
    terms,
    skills: Object.fromEntries(Object.entries(skills).filter(([, value]) => value >= 0).sort()),
    benefits,
    equipment,
    combat,
    psionics,
    spacecraft,
    cash: credits,
    credits,
    pension,
    totalDebt,
    contacts,
    enemies,
    injuries,
    aging,
    debts,
    awards,
    events,
    mishaps,
    lifeEvents,
    bio,
    resume,
    unresolved: [],
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

function chooseBackgroundSkills(rng, homeworld, count) {
  const mandatory = uniqueSkillEntries(homeworld.backgroundSkills.map((skill) => [skill, 0]));
  const remaining = Math.max(0, count - mandatory.length);
  const extras = sample(
    rng,
    gameData.EDU_SKILLS.filter(([skill]) => !mandatory.some(([owned]) => owned === skill)),
    remaining,
  );
  return [...mandatory, ...extras].slice(0, Math.max(count, mandatory.length));
}

function canEnterCareer(career, currentCareer, enteredCareers, pending = null) {
  if (pending?.blockedCareers?.has(career)) return false;
  if (career === currentCareer || career === 'Drifter') return true;
  return !enteredCareers.includes(career);
}

function previousCareerCount(enteredCareers, career) {
  return new Set(enteredCareers.filter((entered) => entered !== career && entered !== 'Drifter')).size;
}

function draftOrDrift(rng, careers, fallbackCareers, usedDraft) {
  if (!usedDraft) {
    const [career, spec] = choice(rng, DRAFT_TABLE);
    if (careers[career]) {
      return [career, spec && careers[career][spec] ? spec : choice(rng, Object.keys(careers[career])), true];
    }
  }
  const drifter = fallbackCareers.includes('Drifter') && careers.Drifter ? 'Drifter' : choice(fallbackCareers.filter((career) => careers[career]) || ['Drifter']);
  return [drifter, choice(rng, Object.keys(careers[drifter])), usedDraft];
}

function startCareerSegment(career) {
  return {
    career: career.replace(' Officer', ''),
    terms: 0,
    highestRank: 0,
    leftByMishap: false,
    benefitDm: 0,
    extraBenefitRolls: 0,
    lostBenefitRolls: 0,
    keepFailedTermBenefit: false,
  };
}

function careerTermCount(terms, career) {
  return terms.filter((term) => term.Career === career).length;
}

function shouldAttemptCommission(stats, advancementTable) {
  const commissionScore = modifier(stats.Soc ?? 0) - (gameData.COMMISSION ?? 8);
  const advancementScore = modifier(stats[advancementTable[0]] ?? 0) - advancementTable[1];
  return commissionScore >= advancementScore - 2;
}

function pickCareer(rng, careers, stats, enteredCareers, currentCareer, pending = null) {
  const ranked = [];
  for (const [career, specs] of Object.entries(careers)) {
    if (!canEnterCareer(career, currentCareer, enteredCareers, pending) || career.endsWith('Officer')) continue;
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

function qualify(rng, stats, table, career, enteredCareers, newCareer, pending = null) {
  if (!table.Qual?.[1] || !newCareer) return { success: true, reason: 'continuing current career' };
  if (career === 'Nobility' || career === 'Aristocrat') {
    const total = stats.Soc;
    return {
      natural: null,
      total,
      success: total >= table.Qual[1],
      stat: 'Soc',
      target: table.Qual[1],
      mods: 0,
      reason: 'Social Standing qualification',
    };
  }
  if (career === 'Psion') {
    const total = stats.Psi - enteredCareers.length;
    return {
      natural: null,
      total,
      success: total >= table.Qual[1],
      stat: 'Psi',
      target: table.Qual[1],
      mods: -enteredCareers.length,
      reason: 'Psionic Strength qualification',
    };
  }
  if (pending?.autoQualifyCareers?.has(career)) {
    pending.autoQualifyCareers.delete(career);
    pending.nextQualificationDm = 0;
    return { success: true, reason: 'automatic qualification from prior event' };
  }
  const mod = -previousCareerCount(enteredCareers, career) + (pending?.nextQualificationDm ?? 0);
  if (pending) pending.nextQualificationDm = 0;
  const result = rollCheck(rng, stats, table.Qual, mod);
  return { ...result, mods: mod, stat: table.Qual[0], target: table.Qual[1] };
}

function statCheck(rng, stats, [stat, target], mods = 0) {
  return rollCheck(rng, stats, [stat, target], mods).success;
}

function rollCheck(rng, stats, [stat, target], mods = 0) {
  const natural = d6(rng, 2);
  const total = natural + modifier(stats[stat] ?? 0) + mods;
  return {
    natural,
    total,
    success: natural !== 2 && total >= target,
    stat,
    target,
    mods,
  };
}

function skillRoll(rng, stats, skills, career, spec, history, { commissioned = false } = {}) {
  const tabs = ['Personal Development', 'Service', 'Specialization'];
  if (career !== 'Drifter' && stats.Edu >= 8) tabs.push('Advanced Education');
  if (commissioned && MILITARY_CAREERS.has(career)) tabs.push('Officer');
  const tab = choice(rng, tabs);
  const roll = d6(rng);
  const entry = getSkillSlice(career.replace(' Officer', ''), spec, tab)[roll - 1];
  const applied = applySkillOrStat(rng, stats, skills, entry[0], entry[1], history, `from the ${tab} table`);
  return { table: tab, roll, entry, applied };
}

function rankRoll(rng, stats, skills, career, spec, rank, history) {
  const key = `${career}|${spec}`;
  const entry = gameData.RANKS[key]?.[Math.min(rank, 6)];
  if (!entry) return null;
  const applied = applySkillOrStat(rng, stats, skills, entry[0], entry[1], history, 'from advancement');
  return { table: 'Ranks and Bonuses', roll: rank, entry, applied };
}

function applySkillOrStat(rng, stats, skills, attr, value, history, source) {
  const picked = choice(rng, String(attr).split(' or '));
  if ([...STAT_NAMES, 'Psi'].includes(picked)) {
    stats[picked] = Math.max(0, (stats[picked] ?? 0) + 1);
    history.push(` Received +1 ${picked} ${source}.`);
    return { type: 'stat', name: picked, value: stats[picked] };
  } else {
    const skill = resolveAwardedSkill(rng, skills, picked);
    gainSkill(skills, skill, value);
    history.push(` Learned ${skill} ${skills[skill]} ${source}.`);
    return { type: 'skill', name: skill, value: skills[skill] };
  }
}

function getSkillSlice(career, spec, tab) {
  const table = gameData.SKILLS[`${career}|${spec}`] ?? gameData.SKILLS[`Drifter|Wanderer`];
  const start = gameData.SKILL_TYPES[tab] * 6;
  return table.slice(start, start + 6);
}

function gainSkill(skills, name, value) {
  if (value === 0) {
    // First exposure: learn at 0. Already known: increment (Traveller skill accumulation rule).
    const current = skills[name];
    skills[name] = (current === undefined || current < 0) ? 0 : current + 1;
  } else if (Number.isFinite(value)) {
    // Rank/guaranteed minimums: set to at least value, don't decrement.
    skills[name] = Math.max(skills[name] ?? 0, value);
  } else {
    addSkill(skills, name, 1);
  }
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
    return { name: `${benefit} +${mod}`, source: 'benefit', type: 'stat' };
  }
  if (Object.values(gameData.SKILLS).some((entries) => entries.some(([skill]) => skill === benefit))) {
    const skill = resolveAwardedSkill(rng, skills, benefit);
    addSkill(skills, skill, mod);
    return { name: `${skill} +${mod}`, source: 'benefit', type: 'skill' };
  }
  const name = benefit === 'Ship Shares' ? `Ship Shares (${mod})` : benefit;
  return {
    name,
    source: 'benefit',
    type: benefitToType(benefit),
    equipment: benefitToEquipment(benefit, rng, skills),
  };
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

function rankForTerm(index, terms, career, advanced, commissioned, currentRank = null) {
  const previous = currentRank ?? (index > 0 && terms[index - 1].Career === career ? terms[index - 1].Rnk : 0);
  const minimum = commissioned ? Math.max(1, previous) : previous;
  return advanced ? Math.min(6, minimum + 1) : minimum;
}

const RANK_TITLES = {
  'Army':               ['Private', 'Lance Corporal', 'Corporal', 'Lance Sergeant', 'Sergeant', 'Sergeant Major', 'Sergeant Major of the Army'],
  'Army Officer':       [null, 'Lieutenant', 'Captain', 'Major', 'Lieutenant Colonel', 'Colonel', 'General'],
  'Marines':            ['Marine', 'Lance Corporal', 'Corporal', 'Lance Sergeant', 'Sergeant', 'Gunnery Sergeant', 'Sergeant Major'],
  'Marines Officer':    [null, 'Lieutenant', 'Captain', 'Force Commander', 'Lieutenant Colonel', 'Colonel', 'Brigadier'],
  'Navy':               ['Crewman', 'Senior Crewman', 'Petty Officer 3rd Class', 'Petty Officer 2nd Class', 'Petty Officer 1st Class', 'Chief Petty Officer', 'Master Chief Petty Officer'],
  'Navy Officer':       [null, 'Ensign', 'Sub-Lieutenant', 'Lieutenant', 'Commander', 'Captain', 'Admiral'],
  'Scout':              ['Scout', 'Scout', 'Senior Scout', 'Senior Scout', 'Mission Commander', 'Mission Commander', 'Mission Commander'],
  'Merchant':           ['Spacehand', 'Senior Spacehand', '4th Officer', '3rd Officer', '2nd Officer', '1st Officer', 'Captain'],
  'Agent':              ['Agent', 'Field Agent', 'Analyst', 'Field Director', 'Deputy Director', 'Director', 'Director General'],
  'Citizen':            ['Citizen', 'Volunteer', 'Employee', 'Supervisor', 'Manager', 'Director', 'CEO'],
  'Drifter':            ['Drifter', 'Hanger-on', 'Nomad', 'Wanderer', 'Veteran', 'Elder', 'Legend'],
  'Entertainer':        ['Performer', 'Known Act', 'Recognised Talent', 'Celebrated', 'Renowned', 'Famous', 'Icon'],
  'Rogue':              ['Criminal', 'Hoodlum', 'Tough', 'Boss', 'Underboss', 'Racketeer', 'Crime Lord'],
  'Scholar':            ['Student', 'Researcher', 'Instructor', 'Professor', 'Associate Professor', 'Dean', 'Provost'],
  'Nobility':           ['Noble', 'Knight', 'Baron', 'Marquis', 'Count', 'Duke', 'Archduke'],
  'Aristocrat':         ['Noble', 'Knight', 'Baron', 'Marquis', 'Count', 'Duke', 'Archduke'],
  'Explorer':           ['Explorer', 'Scout', 'Surveyor', 'Senior Surveyor', 'Mission Leader', 'Senior Leader', 'Pathfinder'],
  'Warden':             ['Initiate', 'Warden', 'Senior Warden', 'Master Warden', 'Elder Warden', 'Archon', 'High Archon'],
  'Psion':              ['Initiate', 'Sensitive', 'Adept', 'Mentalist', 'Master', 'Grandmaster', 'Enlightened'],
  'Law Enforcement':    ['Officer', 'Detective', 'Investigator', 'Inspector', 'Lieutenant', 'Captain', 'Commissioner'],
  'Investigator':       ['Junior Investigator', 'Investigator', 'Senior Investigator', 'Lead Investigator', 'Principal', 'Director', 'Chief Director'],
  'Spy':                ['Asset', 'Handler', 'Field Agent', 'Senior Agent', 'Station Chief', 'Deputy Director', 'Director'],
  'Analyst':            ['Analyst', 'Senior Analyst', 'Lead Analyst', 'Senior Lead', 'Deputy Director', 'Director', 'Director General'],
  'Corporate':          ['Associate', 'Manager', 'Senior Manager', 'Director', 'Vice President', 'Senior VP', 'C-Suite'],
  'Bounty Hunter':      ['Trainee', 'Hunter', 'Veteran Hunter', 'Master Hunter', 'Elite Hunter', 'Legend', 'Mythic'],
  'Intruder':           ['Operative', 'Infiltrator', 'Senior Infiltrator', 'Expert', 'Master', 'Shadow', 'Ghost'],
  'Smuggler':           ['Runner', 'Courier', 'Senior Courier', 'Captain', 'Senior Captain', 'Fleet Captain', 'Kingpin'],
  'Organized Criminal': ['Foot Soldier', 'Made Man', 'Soldier', 'Capo', 'Underboss', 'Boss', 'Crime Lord'],
  'Pirate':             ['Deckhand', 'Pirate', 'Senior Pirate', 'First Mate', 'Captain', 'Commodore', 'Admiral'],
  'Scavenger':          ['Scavenger', 'Ratter', 'Picker', 'Senior Picker', 'Salvager', 'Master Salvager', 'King Picker'],
  'Wanderer':           ['Drifter', 'Wanderer', 'Traveller', 'Nomad', 'Veteran', 'Elder', 'Legend'],
  'Adventurer':         ['Amateur', 'Adventurer', 'Veteran', 'Expert', 'Master', 'Hero', 'Legend'],
  'Celebrity':          ['Unknown', 'Local Star', 'Rising Star', 'Star', 'Superstar', 'Megastar', 'Icon'],
  'Competitor':         ['Amateur', 'Competitor', 'Ranked', 'Elite', 'Champion', 'Grand Champion', 'Legend'],
  'Connoisseur':        ['Novice', 'Enthusiast', 'Connoisseur', 'Expert', 'Master', 'Grand Master', 'Authority'],
  'Dilettante':         ['Amateur', 'Dilettante', 'Practitioner', 'Expert', 'Master', 'Grand Master', 'Icon'],
  'Barbarian':          ['Barbarian', 'Raider', 'Warrior', 'Champion', 'Chieftain', 'Warlord', 'High King'],
  'Humanitarian':       ['Volunteer', 'Worker', 'Senior Worker', 'Team Leader', 'Programme Director', 'Regional Director', 'Secretary General'],
};

export function rankTitle(career, rank) {
  const titles = RANK_TITLES[career];
  if (!titles) return null;
  const clamped = Math.max(0, Math.min(6, rank ?? 0));
  return titles[clamped] ?? null;
}

function summarizeCareerPath(terms) {
  const path = new Map();
  for (const term of terms) {
    path.set(`${term.Career}|${term.Spec}`, term.Rnk);
  }
  return Array.from(path.entries()).map(([key, rank]) => {
    const [career, spec] = key.split('|');
    return { career, spec, rank, title: rankTitle(career, rank) };
  });
}

function formatTarget(check = []) {
  if (!check?.[0] || !check?.[1]) return 'automatic';
  return `${check[0]} ${check[1]}+`;
}

function formatCheckRoll(check) {
  if (!check) return '-';
  if (check.natural === null || check.natural === undefined) return check.reason ? 'automatic' : '-';
  const dm = check.total - check.natural;
  return `2d6 ${check.natural}${dm ? ` ${signed(dm)}` : ''} = ${check.total}`;
}

function skillStep(stage, roll) {
  if (!roll) return {
    stage,
    roll: '-',
    result: 'No rank reward',
    detail: '',
  };
  return {
    stage,
    roll: `${roll.table}: 1d6 = ${roll.roll}`,
    result: roll.applied ? `${roll.applied.name} ${roll.applied.value}` : `${roll.entry[0]} ${roll.entry[1]}`,
    detail: roll.applied?.type === 'stat'
      ? `Characteristic increase: ${roll.applied.name} is now ${roll.applied.value}.`
      : `Skill added or improved: ${roll.applied.name} is now ${roll.applied.value}.`,
  };
}

function detailForIncident(incident) {
  const parts = [];
  if (incident.text) parts.push(incident.text);
  if (incident.checks?.length) {
    parts.push(`Checks: ${incident.checks.map((check) => `${check.skill} ${check.target}+ rolled ${check.roll}, total ${check.total}: ${check.success ? 'success' : 'failure'}`).join('; ')}`);
  }
  if (incident.nested?.length) {
    parts.push(`Resolved: ${incident.nested.map((nested) => nested.label ? `${nested.source} ${nested.roll}: ${nested.label}` : `${nested.source} ${nested.roll}`).join('; ')}`);
  }
  if (incident.applied?.length) {
    parts.push(`Applied: ${incident.applied.join('; ')}.`);
  }
  return parts.join(' ');
}

function agingResultText(aging) {
  if (!aging.reductions.length) return 'No aging effect';
  return `Reduced ${aging.reductions.join(', ')}`;
}

function generatePersonality(rng) {
  const type = ['IE', 'SN', 'FT', 'JP'].map((pair) => choice(rng, pair.split(''))).join('');
  const [temperaments = [], traits = []] = gameData.PERSONALITIES;
  const primary = choice(rng, temperaments);
  const secondary = choice(rng, temperaments.filter((trait) => trait !== primary));
  const quirk = choice(rng, traits);
  const drives = [
    'seeks independence',
    'protects close allies first',
    'wants recognition for hard-won skill',
    'prefers practical solutions over ideology',
    'keeps old obligations even when they become costly',
    'takes risks when curiosity is involved',
  ];
  const drive = choice(rng, drives);
  return {
    type,
    primary,
    secondary,
    quirk,
    drive,
    summary: `${primary}, ${secondary.toLowerCase()}, and ${quirk.toLowerCase()}; ${drive}.`,
  };
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

function generateHomeworld(rng, { campaignMode, requested }) {
  if (campaignMode === 'chthonian' || (requested && gameData.WORLDS[requested])) {
    const name = requested || choice(rng, WORLDS);
    const backgroundSkills = gameData.WORLDS[name] ?? [];
    return {
      mode: 'chthonian',
      name,
      upp: null,
      tradeCodes: ['Solar System'],
      backgroundSkills,
      summary: `${name}, Solar System`,
      source: 'cthonian-stars',
    };
  }
  return generateWorldFromRng(rng, { requested });
}

function lookupRange(table, roll) {
  return table.find((entry) => roll >= entry.min && roll <= entry.max);
}

function localCareerEntry(career, table, roll) {
  const careerTables = localCareerTables?.careers?.[career.replace(' Officer', '')];
  return careerTables?.[table]?.entries?.find((entry) => entry.roll === roll) ?? null;
}

function localLifeEventEntry(roll) {
  return localCareerTables?.lifeEvents?.entries?.find((entry) => entry.roll === roll) ?? null;
}

function defaultSpec(career) {
  const specs = gameData.CAREERS[career];
  return specs ? Object.keys(specs)[0] : null;
}

const PENSION_CAREERS = new Set(['Army', 'Army Officer', 'Navy', 'Navy Officer', 'Marines', 'Marines Officer', 'Scout']);
const PENSION_TABLE = [0, 0, 0, 0, 0, 4000, 6000, 8000, 10000];

function calculatePension(terms) {
  const eligible = terms.filter((t) => PENSION_CAREERS.has(t.Career)).length;
  return PENSION_TABLE[Math.min(eligible, PENSION_TABLE.length - 1)] ?? 10000;
}


function summarizeLocalTableText(text) {
  const sentence = String(text).split(/(?<=[.!?])\s+/)[0];
  return sentence.length > 120 ? `${sentence.slice(0, 117)}...` : sentence;
}

function resolveCareerEvent(rng, roll, stats, skills, career, spec, state, history) {
  const entry = lookupRange(coreRules.rollTables.careerEvents.ranges, roll);
  const localEntry = localCareerEntry(career, 'events', roll);
  const generic = localEntry ? {} : applyRuleEffect(rng, entry.effect, stats, skills, career, spec, state, history);
  const raw = localEntry ? applyRawTableText(rng, localEntry.text, stats, skills, career, spec, state, history, 'event') : {};
  return {
    roll,
    label: localEntry ? summarizeLocalTableText(localEntry.text) : entry.label,
    text: localEntry?.text ?? null,
    effect: entry.effect,
    source: 'event',
    tableSource: localEntry ? 'local-pdf' : 'structured-fallback',
    advancementDm: raw.advancementDm ?? generic.advancementDm ?? (entry.effect === 'advancement_bonus' || entry.effect === 'promotion_bonus' ? 2 : 0),
    automaticPromotion: Boolean(raw.automaticPromotion || generic.automaticPromotion || (entry.effect === 'promotion_bonus' && roll === 12)),
    automaticCommission: Boolean(raw.automaticCommission),
    checks: raw.checks ?? [],
    nested: raw.nested ?? [],
    applied: raw.applied ?? [],
  };
}

function resolveMishap(rng, roll, stats, state) {
  const entry = lookupRange(coreRules.rollTables.careerMishaps.ranges, roll);
  const localEntry = localCareerEntry(state.career, 'mishaps', roll);
  const generic = localEntry ? {} : applyRuleEffect(rng, entry.effect, stats, state.skills ?? {}, state.career ?? 'Drifter', state.spec ?? 'Wanderer', state, []);
  const raw = localEntry ? applyRawTableText(rng, localEntry.text, stats, state.skills ?? {}, state.career ?? 'Drifter', state.spec ?? 'Wanderer', state, [], 'mishap') : {};
  return {
    roll,
    label: localEntry ? summarizeLocalTableText(localEntry.text) : entry.label,
    text: localEntry?.text ?? null,
    effect: entry.effect,
    source: 'mishap',
    tableSource: localEntry ? 'local-pdf' : 'structured-fallback',
    checks: raw.checks ?? generic.checks ?? [],
    nested: raw.nested ?? generic.nested ?? [],
    applied: raw.applied ?? [],
    continueCareer: Boolean(raw.continueCareer),
  };
}

function resolveLifeEvent(rng, stats, state) {
  const roll = d6(rng, 2);
  const entry = lookupRange(coreRules.rollTables.lifeEvents.ranges, roll);
  const localEntry = localLifeEventEntry(roll);
  const generic = localEntry ? {} : applyRuleEffect(rng, entry.effect, stats, state.skills ?? {}, 'Citizen', 'Worker', state, []);
  const raw = applyLifeEventRawEffect(rng, roll, stats, state);
  const event = {
    roll,
    label: localEntry ? summarizeLocalTableText(localEntry.text) : entry.label,
    text: localEntry?.text ?? null,
    effect: entry.effect,
    source: 'life_event',
    tableSource: localEntry ? 'local-pdf' : 'structured-fallback',
    checks: raw.checks ?? generic.checks ?? [],
    nested: raw.nested ?? generic.nested ?? [],
    applied: raw.applied ?? [],
  };
  state.lifeEvents?.push(event);
  return event;
}

function resolveInjury(rng, stats, state, forcedRoll = null) {
  const roll = forcedRoll ?? d6(rng);
  const entry = lookupRange(coreRules.rollTables.injuries.ranges, roll);
  const before = Object.fromEntries(STAT_NAMES.map((stat) => [stat, stats[stat]]));
  const physical = ['Str', 'Dex', 'End'];
  if (entry.effect === 'reduce_two_physical') {
    sample(rng, physical, 2).forEach((stat) => { stats[stat] = Math.max(1, stats[stat] - 1); });
  } else if (entry.effect === 'reduce_physical' || entry.effect === 'minor_injury') {
    const stat = choice(rng, physical);
    stats[stat] = Math.max(1, stats[stat] - (entry.effect === 'minor_injury' ? 0 : 1));
  } else if (entry.effect === 'reduce_soc') {
    stats.Soc = Math.max(1, stats.Soc - 1);
  }
  const after = Object.fromEntries(STAT_NAMES.map((stat) => [stat, stats[stat]]));
  const reductions = STAT_NAMES
    .filter((stat) => after[stat] < before[stat])
    .map((stat) => ({ stat, from: before[stat], to: after[stat] }));
  const injury = { roll, label: entry.label, effect: entry.effect, source: state.source ?? 'injury', reductions };
  state.injuries?.push(injury);
  return injury;
}

function resolveRolledInjury(rng, stats, state, text, source) {
  if (/same as a result of 2 on the Injury table/i.test(text)) {
    return resolveInjury(rng, stats, { ...state, source }, 2);
  }
  if (/roll twice on (?:the )?Injury table[^.]*taking the higher result|roll on (?:the )?Injury table twice[^.]*taking the higher result/i.test(text)) {
    return resolveInjury(rng, stats, { ...state, source }, Math.max(d6(rng), d6(rng)));
  }
  if (/roll twice on (?:the )?Injury table[^.]*taking the lower result|roll on (?:the )?Injury table twice[^.]*taking the lower result/i.test(text)) {
    return resolveInjury(rng, stats, { ...state, source }, Math.min(d6(rng), d6(rng)));
  }
  return resolveInjury(rng, stats, { ...state, source });
}

function applyRawTableText(rng, text, stats, skills, career, spec, state, history, source) {
  const result = { checks: [], nested: [] };
  const before = snapshotEffectState(stats, skills, state);
  const normalized = normalizeRuleText(text);
  for (const check of resolveChecksFromText(rng, normalized, stats, skills)) {
    result.checks.push(check);
  }
  const effectText = chooseOpportunityPath(branchRuleText(normalized, result.checks));

  applyAssociationEffects(rng, effectText, state);
  applyStatReductionEffects(rng, effectText, stats);
  applyStatGainLossEffects(rng, effectText, stats);
  applySkillEffects(rng, effectText, skills, career, spec, history);
  applyBenefitEffects(effectText, state);

  if (/Unusual Event/i.test(effectText)) {
    result.nested.push(resolveUnusualLifeEvent(rng, stats, state));
  } else if (/life event/i.test(effectText)) {
    result.nested.push(resolveLifeEvent(rng, stats, state));
  }
  if (requiresInjuryRoll(effectText) || (result.checks.length && result.checks.every((check) => !check.success) && /avoid injury/i.test(normalized))) {
    result.nested.push(resolveRolledInjury(rng, stats, state, effectText, source));
  }
  if ((state.depth ?? 0) < 2) {
    const careerEventMatch = effectText.match(/roll immediately on (?:the )?([A-Z][a-z]+)(?: or ([A-Z][a-z]+))? events table/i);
    if (careerEventMatch) {
      const nestedCareer = choice(rng, [careerEventMatch[1], careerEventMatch[2]].filter(Boolean));
      const nestedSpec = defaultSpec(nestedCareer);
      if (nestedSpec) {
        const nestedState = { ...state, depth: (state.depth ?? 0) + 1 };
        result.nested.push(resolveCareerEvent(rng, d6(rng, 2), stats, skills, nestedCareer, nestedSpec, nestedState, history));
        skillRoll(rng, stats, skills, nestedCareer, nestedSpec, history);
      }
    }
    const careerMishapMatch = effectText.match(/roll immediately on (?:the )?([A-Z][a-z]+)(?: or ([A-Z][a-z]+))? mishap table/i);
    if (careerMishapMatch) {
      const nestedCareer = choice(rng, [careerMishapMatch[1], careerMishapMatch[2]].filter(Boolean));
      const nestedSpec = defaultSpec(nestedCareer);
      if (nestedSpec) {
        result.nested.push(resolveMishap(rng, d6(rng), stats, {
          ...state,
          depth: (state.depth ?? 0) + 1,
          career: nestedCareer,
          spec: nestedSpec,
          skills,
        }));
      }
    }
  }
  if (/roll on (?:the )?mishap table/i.test(effectText) && source !== 'mishap') {
    const nested = resolveMishap(rng, d6(rng), stats, { ...state, career, spec, skills });
    result.nested.push(nested);
  }

  const advancementMatch = effectText.match(/\+([124])\s*DM to (?:your )?next Advancement/i);
  if (advancementMatch) result.advancementDm = Number.parseInt(advancementMatch[1], 10);
  if (/automatically promoted|automatic(?:ally)? promotion|gain a promotion/i.test(effectText)) result.automaticPromotion = true;
  if (/commission automatically|promotion or a commission automatically/i.test(effectText)) result.automaticCommission = true;
  const qualificationMatch = effectText.match(/\+([24])\s*DM to (?:the |your )?(?:Qualification|Qualiﬁcation|Qualif.?cation)/i);
  if (qualificationMatch) state.pending.nextQualificationDm += Number.parseInt(qualificationMatch[1], 10);
  const survivalPenalty = effectText.match(/[−-]([12])\s*DM to (?:your )?next Survival/i);
  if (survivalPenalty) state.pending.nextSurvivalDm -= Number.parseInt(survivalPenalty[1], 10);
  if (/must take the Draft/i.test(effectText)) state.pending.forceDraft = true;
  if (/may take the Rogue career for your next term without needing to roll for quali/i.test(effectText)) {
    state.pending.forceCareer = 'Rogue';
    state.pending.autoQualifyCareers.add('Rogue');
  }
  if (/may not re-enlist in\s+the\s+Scouts/i.test(effectText)) state.pending.blockedCareers.add('Scout');
  if (/does not cause you to leave|you do not have to leave|not ejected from this career/i.test(effectText)) result.continueCareer = true;
  result.applied = diffEffectState(before, stats, skills, state);
  if (effectText !== normalized) result.applied.unshift(`Opportunity accepted: ${summarizeLocalTableText(effectText)}`);

  return result;
}

function requiresInjuryRoll(text) {
  return /roll (?:twice on |on |either [^.]* or [^.]* to avoid a roll on )(?:the )?Injury table/i.test(text)
    || /same as a result of 2 on the Injury table/i.test(text)
    || /\byou are injured\b/i.test(text);
}

function applyLifeEventRawEffect(rng, roll, stats, state) {
  const result = { checks: [], nested: [] };
  const before = snapshotEffectState(stats, state.skills ?? {}, state);
  if (roll === 2) {
    result.nested.push(resolveInjury(rng, stats, { ...state, source: 'life_event' }));
  } else if (roll === 3) {
    state.contacts.push('Family or close relation');
  } else if (roll === 4) {
    state.enemies.push('Ended relationship');
  } else if (roll === 5) {
    state.contacts.push('Improved relationship');
  } else if (roll === 6) {
    state.contacts.push('New relationship');
  } else if (roll === 7) {
    state.contacts.push('Contact from life event');
  } else if (roll === 8) {
    state.enemies.push('Rival or Enemy from betrayal');
  } else if (roll === 9) {
    state.pending.nextQualificationDm += 2;
  } else if (roll === 10) {
    state.currentSegment.benefitDm += 2;
  } else if (roll === 11) {
    if (state.currentSegment && state.currentSegment.terms > 0) state.currentSegment.lostBenefitRolls += 1;
    else stats.Soc = Math.max(1, stats.Soc - 1);
  } else if (roll === 12) {
    result.nested.push(resolveUnusualLifeEvent(rng, stats, state));
  }
  result.applied = diffEffectState(before, stats, state.skills ?? {}, state);
  return result;
}

function resolveUnusualLifeEvent(rng, stats, state) {
  const roll = d6(rng);
  const event = { roll, source: 'unusual_life_event' };
  if (roll === 1) {
    state.awards?.push('Psionic institute encounter');
    event.label = 'Psionic institute encounter';
  } else if (roll === 2) {
    gainSkill(state.skills ?? {}, 'Life Science (biology)', 1);
    state.contacts.push('Alien contact');
    event.label = 'Alien contact';
  } else if (roll === 3) {
    state.awards?.push('Alien artefact');
    event.label = 'Alien artefact';
  } else if (roll === 4) {
    event.label = 'Amnesia';
  } else if (roll === 5) {
    state.contacts.push('Imperial government contact');
    event.label = 'Imperial government contact';
  } else if (roll === 6) {
    state.awards?.push('Ancient technology');
    event.label = 'Ancient technology';
  }
  return event;
}

function applyAssociationEffects(rng, text, state) {
  addRepeated(state.contacts, 'Contact', rollQuantity(rng, text, /gain\s+(1d[36]|\d+)\s+Contacts?/i));
  addRepeated(state.enemies, 'Enemy', rollQuantity(rng, text, /gain\s+(1d3|1d6|\d+)\s+Enemies/i));
  if (/\bgain (?:an |a )?Enemy\b/i.test(text)) state.enemies.push('Enemy');
  if (/\bgain (?:an |a )?Rival\b/i.test(text)) state.enemies.push('Rival');
  if (/\bgain (?:an |a )?Ally\b/i.test(text) || /becomes an Ally/i.test(text)) state.contacts.push('Ally');
  if (/\bgain (?:a )?Contact\b/i.test(text) || /gain .* as a Contact/i.test(text)) state.contacts.push('Contact');
  if (/Patron/i.test(text)) state.contacts.push('Patron');
}

function applyStatReductionEffects(rng, text, stats) {
  const reduceMatch = text.match(/Reduce (Strength|Dexterity|Endurance|Intelligence|Social Standing|your Intelligence or Social Standing|Strength, Dexterity or Endurance) by ([12])/i);
  if (!reduceMatch) return;
  const amount = Number.parseInt(reduceMatch[2], 10);
  const stat = chooseStatFromText(rng, reduceMatch[1]);
  stats[stat] = Math.max(1, stats[stat] - amount);
}

function applyStatGainLossEffects(rng, text, stats) {
  const gainSoc = text.match(/gain one Social Standing|gain 1 Social Standing/i);
  if (gainSoc) stats.Soc += 1;
  const loseSoc = text.match(/lose one Social Standing|reduce your Social Standing by ([12])|reduce Social Standing by ([12])/i);
  if (loseSoc) stats.Soc = Math.max(1, stats.Soc - (Number.parseInt(loseSoc[1] ?? loseSoc[2], 10) || 1));
  const losePhysical = text.match(/lose ([12]) point[s]? from any physical characteristic/i);
  if (losePhysical) {
    const stat = choice(rng, PHYSICAL_STATS);
    stats[stat] = Math.max(1, stats[stat] - Number.parseInt(losePhysical[1], 10));
  }
}

function applySkillEffects(rng, text, skills, career, spec, history) {
  const oneOf = text.match(/Gain one of ([^.]+?)(?:\.|, but|, and| or a Contact|$)/i);
  if (oneOf) {
    const picked = choice(rng, extractSkillOptions(oneOf[1]));
    if (picked) gainSkillFromText(rng, skills, picked);
  }
  const directSkill = text.match(/\bGain\s+([A-Z][A-Za-z -]+(?:\s*\([^)]*\))?)\s+([01])\b/);
  if (directSkill && !/one of/i.test(directSkill[0])) {
    gainSkill(skills, resolveAwardedSkill(rng, skills, directSkill[1]), Number.parseInt(directSkill[2], 10));
  }
  const oneLevel = text.match(/Gain one level (?:of|in)\s+([^.]+?)(?:\.|, but|, and| or a Contact|$)/i);
  if (oneLevel) {
    const picked = choice(rng, extractSkillOptions(oneLevel[1]));
    if (picked) addSkill(skills, resolveAwardedSkill(rng, skills, picked), 1);
  }
  const anyTwoScience = /level in each of any two Science/i.test(text);
  if (anyTwoScience) {
    sample(rng, ['Life Science', 'Physical Science', 'Social Science', 'Space Science'], 2)
      .forEach((skill) => addSkill(skills, resolveAwardedSkill(rng, skills, skill), 1));
  }
  const increase = text.match(/increase ([^.]+?) by one level/i);
  if (increase) {
    const picked = choice(rng, extractSkillOptions(increase[1]));
    if (picked) addSkill(skills, resolveAwardedSkill(rng, skills, picked), 1);
  }
  const anyChoice = text.match(/gain (?:one level in |a level in |)(any one skill|any skill of your choice)/i);
  if (anyChoice) {
    skillRoll(rng, {}, skills, career, spec, history);
  }
}

function applyBenefitEffects(text, state) {
  if (!state.currentSegment) return;
  if (/\+([12])\s*DM to any one Benefit roll/i.test(text)) {
    state.currentSegment.benefitDm += Number.parseInt(text.match(/\+([12])\s*DM to any one Benefit roll/i)[1], 10);
  }
  if (/extra Benefit roll/i.test(text)) state.currentSegment.extraBenefitRolls += 1;
  if (/lose one Benefit roll|Lose one Bene/i.test(text)) state.currentSegment.lostBenefitRolls += 1;
  if (/lose all Benefit rolls from this career/i.test(text)) state.currentSegment.lostBenefitRolls += 99;
  if (/keep (?:your |the )?Benefit roll|retain this term.?s Benefit roll|may keep your benefit roll/i.test(text)) {
    state.currentSegment.keepFailedTermBenefit = true;
  }
}

function resolveChecksFromText(rng, text, stats, skills) {
  const checks = [];
  const regex = /\b([A-Z][A-Za-z /()'-]+?)\s+(\d{1,2})\+/g;
  let match = regex.exec(text);
  while (match) {
    const skill = normalizeSkillName(match[1]);
    if (!['If', 'Roll', 'Throw', 'Benefit', 'Soc'].includes(skill)) {
      const target = Number.parseInt(match[2], 10);
      const roll = d6(rng, 2);
      const skillLevel = skills[skill] ?? skills[skill.split(' (')[0]] ?? -3;
      const characteristic = skillCheckCharacteristic(skill);
      const total = roll + skillLevel + modifier(stats[characteristic] ?? 0);
      checks.push({ skill, characteristic, target, roll, total, success: roll !== 2 && total >= target });
    }
    match = regex.exec(text);
  }
  return checks;
}

function branchRuleText(text, checks) {
  if (!checks.length || !/If you (?:succeed|fail)/i.test(text)) return text;
  const success = checks.some((check) => check.success);
  const successIndex = text.search(/If you succeed/i);
  const failIndex = text.search(/If you fail/i);
  if (successIndex === -1 || failIndex === -1) return text;
  const first = Math.min(successIndex, failIndex);
  const prefix = text.slice(0, first);
  const start = success ? successIndex : failIndex;
  const other = success ? failIndex : successIndex;
  const end = other > start ? other : text.length;
  const branch = text.slice(start, end);
  const eitherWay = text.match(/Either way[^.]*\./i)?.[0] ?? '';
  return `${prefix} ${branch} ${eitherWay}`;
}

function chooseOpportunityPath(text) {
  const normalized = String(text);
  const acceptPatterns = [
    /(.+?)(?:If you accept|Accept,? and|If you do so|If you choose to do so|If you wish),?\s+(.+?)(?:If you refuse|Refuse,? and|Refuse and|If you fail|$)/i,
    /(.+?)If you refuse[^.]*\.\s*If you accept,?\s+(.+?)(?:$|If you fail)/i,
  ];
  for (const pattern of acceptPatterns) {
    const match = normalized.match(pattern);
    if (match?.[2]) return `${match[1]} ${match[2]}`;
  }
  return normalized;
}

function snapshotEffectState(stats, skills, state) {
  return {
    stats: Object.fromEntries([...STAT_NAMES, 'Psi'].map((stat) => [stat, stats[stat]])),
    skills: { ...skills },
    contacts: [...(state.contacts ?? [])],
    enemies: [...(state.enemies ?? [])],
    awards: [...(state.awards ?? [])],
    injuries: [...(state.injuries ?? [])],
    lifeEvents: [...(state.lifeEvents ?? [])],
    currentSegment: state.currentSegment ? {
      benefitDm: state.currentSegment.benefitDm,
      extraBenefitRolls: state.currentSegment.extraBenefitRolls,
      lostBenefitRolls: state.currentSegment.lostBenefitRolls,
      keepFailedTermBenefit: state.currentSegment.keepFailedTermBenefit,
    } : null,
    pending: state.pending ? {
      nextQualificationDm: state.pending.nextQualificationDm,
      nextSurvivalDm: state.pending.nextSurvivalDm,
      forceDraft: state.pending.forceDraft,
      forceCareer: state.pending.forceCareer,
      blockedCareers: [...state.pending.blockedCareers],
      autoQualifyCareers: [...state.pending.autoQualifyCareers],
    } : null,
  };
}

function diffEffectState(before, stats, skills, state) {
  const applied = [];
  for (const stat of [...STAT_NAMES, 'Psi']) {
    if (stats[stat] !== before.stats[stat]) applied.push(`${stat} ${before.stats[stat]} -> ${stats[stat]}`);
  }
  for (const [skill, value] of Object.entries(skills)) {
    if (before.skills[skill] !== value) {
      applied.push(`${before.skills[skill] === undefined ? 'Added' : 'Updated'} ${skill} ${value}`);
    }
  }
  appendNew(applied, 'Contact gained', before.contacts, state.contacts);
  appendNew(applied, 'Enemy/Rival gained', before.enemies, state.enemies);
  appendNew(applied, 'Award gained', before.awards, state.awards);
  appendNew(applied, 'Injury recorded', before.injuries, state.injuries, (injury) => injury.label ?? String(injury));
  appendNew(applied, 'Life event recorded', before.lifeEvents, state.lifeEvents, (event) => event.label ?? String(event));
  if (before.currentSegment && state.currentSegment) {
    if (state.currentSegment.benefitDm !== before.currentSegment.benefitDm) applied.push(`Benefit roll DM ${signed(state.currentSegment.benefitDm - before.currentSegment.benefitDm)}`);
    if (state.currentSegment.extraBenefitRolls !== before.currentSegment.extraBenefitRolls) applied.push(`Extra benefit rolls ${signed(state.currentSegment.extraBenefitRolls - before.currentSegment.extraBenefitRolls)}`);
    if (state.currentSegment.lostBenefitRolls !== before.currentSegment.lostBenefitRolls) applied.push(`Lost benefit rolls ${signed(state.currentSegment.lostBenefitRolls - before.currentSegment.lostBenefitRolls)}`);
    if (state.currentSegment.keepFailedTermBenefit && !before.currentSegment.keepFailedTermBenefit) applied.push('Kept benefit roll from failed term');
  }
  if (before.pending && state.pending) {
    if (state.pending.nextQualificationDm !== before.pending.nextQualificationDm) applied.push(`Next qualification DM ${signed(state.pending.nextQualificationDm - before.pending.nextQualificationDm)}`);
    if (state.pending.nextSurvivalDm !== before.pending.nextSurvivalDm) applied.push(`Next survival DM ${signed(state.pending.nextSurvivalDm - before.pending.nextSurvivalDm)}`);
    if (state.pending.forceDraft && !before.pending.forceDraft) applied.push('Draft required next term');
    if (state.pending.forceCareer && state.pending.forceCareer !== before.pending.forceCareer) applied.push(`${state.pending.forceCareer} available without qualification next term`);
    for (const career of state.pending.blockedCareers) {
      if (!before.pending.blockedCareers.includes(career)) applied.push(`${career} re-enlistment blocked`);
    }
  }
  return applied;
}

function appendNew(applied, label, before = [], after = [], formatter = String) {
  after.slice(before.length).forEach((item) => applied.push(`${label}: ${formatter(item)}`));
}

function skillCheckCharacteristic(skill) {
  if (/Pilot|Gun|Gunnery|Stealth|Melee|Athletics|Drive|Flyer|Vacc Suit|Zero-G/i.test(skill)) return 'Dex';
  if (/Survival|Heavy Weapons/i.test(skill)) return 'End';
  if (/Persuade|Diplomat|Deception|Streetwise|Carouse/i.test(skill)) return 'Soc';
  return 'Int';
}

function applyAging(rng, stats, totalTerms, debts) {
  const natural = d6(rng, 2);
  const result = natural - totalTerms;
  const reductions = agingReductions(result);
  for (const stat of reductions.physical) {
    stats[stat] = Math.max(0, stats[stat] - 1);
  }
  for (const stat of reductions.physicalExtra) {
    stats[stat] = Math.max(0, stats[stat] - 1);
  }
  for (const stat of reductions.mental) {
    stats[stat] = Math.max(0, stats[stat] - 1);
  }
  const reduced = [...reductions.physical, ...reductions.physicalExtra, ...reductions.mental];
  const crisisStats = STAT_NAMES.filter((stat) => stats[stat] === 0);
  let crisis = null;
  if (crisisStats.length) {
    const amount = d6(rng) * 10000;
    crisisStats.forEach((stat) => { stats[stat] = 1; });
    crisis = { stats: crisisStats, amount };
    debts.push({ reason: 'Aging crisis medical care', amount });
  }
  return { natural, roll: result, totalTerms, reductions: reduced, crisis };
}

function agingReductions(result) {
  if (result >= 1) return { physical: [], physicalExtra: [], mental: [] };
  if (result === 0) return { physical: ['Str'], physicalExtra: [], mental: [] };
  if (result === -1) return { physical: ['Str', 'Dex'], physicalExtra: [], mental: [] };
  if (result === -2) return { physical: [...PHYSICAL_STATS], physicalExtra: [], mental: [] };
  if (result === -3) return { physical: ['Str', 'Dex', 'End'], physicalExtra: ['Str'], mental: [] };
  if (result === -4) return { physical: ['Str', 'Dex'], physicalExtra: ['Str', 'Dex', 'End'], mental: [] };
  if (result === -5) return { physical: [...PHYSICAL_STATS], physicalExtra: [...PHYSICAL_STATS], mental: [] };
  return { physical: [...PHYSICAL_STATS], physicalExtra: [...PHYSICAL_STATS], mental: ['Int'] };
}

function musterOutCareer(rng, stats, skills, segment, benefits, equipment, cashState) {
  if (!segment) return { rolls: 0, items: [], details: [] };
  const failedTermRoll = segment.leftByMishap && segment.keepFailedTermBenefit ? 1 : 0;
  const rollCount = Math.max(0, segment.terms + failedTermRoll + segment.extraBenefitRolls - segment.lostBenefitRolls + rankBenefitRolls(segment.highestRank));
  const items = [];
  const details = [];
  for (let index = 0; index < rollCount; index += 1) {
    const useCash = (cashState.getCashRolls?.() ?? cashState.cashRolls) < 3 && rng() < 0.5;
    const dm = (segment.highestRank >= 5 && !useCash ? 1 : 0) + (!useCash ? segment.benefitDm : 0);
    const natural = d6(rng);
    const roll = Math.min(7, natural + dm);
    if (useCash) {
      cashState.addCashRoll();
      const amount = choiceCredit(segment.career, roll);
      cashState.addCredits(amount);
      const benefit = { name: `${amount} Cr.`, source: 'benefit', career: segment.career, type: 'cash' };
      benefits.push(benefit);
      items.push(benefit);
      details.push({ roll: `Cash ${index + 1}: 1d6 ${natural}${dm ? ` ${signed(dm)}` : ''} = ${roll}`, table: 'Cash', result: benefit.name });
    } else {
      const benefit = choiceBenefit(rng, stats, skills, segment.career, roll);
      if (benefit) {
        benefit.career = segment.career;
        benefits.push(benefit);
        if (benefit.equipment) equipment.push(benefit.equipment);
        items.push(benefit);
        details.push({ roll: `Benefit ${index + 1}: 1d6 ${natural}${dm ? ` ${signed(dm)}` : ''} = ${roll}`, table: 'Benefits', result: benefit.name });
      }
    }
  }
  return { rolls: rollCount, items, details };
}

function rankBenefitRolls(rank) {
  if (rank >= 5) return 3;
  if (rank >= 3) return 2;
  if (rank >= 1) return 1;
  return 0;
}

function applyRuleEffect(rng, effect, stats, skills, career, spec, state, history) {
  if (effect === 'life_event') {
    resolveLifeEvent(rng, stats, state);
  } else if (effect === 'injury' || effect === 'enemy_or_injury') {
    if (effect === 'enemy_or_injury' && rng() < 0.5) state.enemies?.push('Enemy from career disaster');
    else resolveInjury(rng, stats, state);
  } else if (effect === 'career_skill') {
    skillRoll(rng, stats, skills, career, spec, history);
  } else if (effect === 'promotion_bonus' || effect === 'advancement_bonus') {
    state.awards?.push(effect === 'promotion_bonus' ? 'Distinguished service' : 'Advancement opportunity');
  } else if (effect === 'contact') {
    state.contacts?.push('Professional contact');
  } else if (effect === 'patron') {
    state.contacts?.push('Patron');
  } else if (effect === 'award') {
    state.awards?.push('Commendation');
  } else if (effect === 'enemy' || effect === 'rival') {
    state.enemies?.push(effect === 'enemy' ? 'Enemy' : 'Rival');
  } else if (effect === 'ally' || effect === 'ally_or_rival') {
    (effect === 'ally_or_rival' && rng() < 0.5 ? state.enemies : state.contacts)?.push(effect === 'ally' ? 'Ally' : 'Ally or rival');
  } else if (effect === 'cash' || effect === 'enemy_or_cash' || effect === 'debt' || effect === 'debt_or_contact_loss') {
    const current = state.creditsRef?.() ?? 0;
    state.setCredits?.(Math.max(0, current + (effect === 'debt' || effect === 'debt_or_contact_loss' ? -1000 : 1000)));
  }
  return {};
}

function normalizeRuleText(text) {
  return String(text || '')
    .replace(/[ﬁ]/g, 'fi')
    .replace(/[ﬂ]/g, 'fl')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function rollQuantity(rng, text, pattern) {
  const match = text.match(pattern);
  if (!match) return 0;
  if (match[1] === '1d3') return d3(rng);
  if (match[1] === '1d6') return d6(rng);
  return Number.parseInt(match[1], 10) || 0;
}

function addRepeated(items, label, count) {
  for (let index = 0; index < count; index += 1) items.push(label);
}

function chooseStatFromText(rng, text) {
  const statMap = {
    Strength: 'Str',
    Dexterity: 'Dex',
    Endurance: 'End',
    Intelligence: 'Int',
    'Social Standing': 'Soc',
  };
  const stats = Object.entries(statMap)
    .filter(([label]) => text.includes(label))
    .map(([, stat]) => stat);
  return choice(rng, stats.length ? stats : PHYSICAL_STATS);
}

function extractSkillOptions(text) {
  return String(text)
    .replace(/\([^)]*any[^)]*\)/gi, '(any)')
    .split(/\s*,\s*|\s+or\s+|\s+and\s+/i)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !/^\+?\d+$/.test(item))
    .map((item) => item.replace(/\s+1$/i, '').replace(/^one level in\s+/i, '').trim());
}

function gainSkillFromText(rng, skills, text) {
  const match = text.match(/^(.+?)\s+([01])$/);
  if (match) gainSkill(skills, resolveAwardedSkill(rng, skills, match[1]), Number.parseInt(match[2], 10));
  else gainSkill(skills, resolveAwardedSkill(rng, skills, text), 1);
}

function normalizeSkillName(text) {
  return String(text)
    .replace(/^(Roll|Throw|either|or)\s+/i, '')
    .replace(/\s*\(any\)/i, '')
    .replace(/\s+skill$/i, '')
    .replace(/^any\s+/i, '')
    .replace(/'+$/g, '')
    .trim();
}

function resolveAwardedSkill(rng, skills, rawSkill) {
  const cleaned = normalizeSkillName(rawSkill);
  const base = specialtyBase(rawSkill) ?? specialtyBase(cleaned);
  if (!base) return cleaned;
  const existing = Object.keys(skills)
    .filter((skill) => skill === base || skill.startsWith(`${base} (`))
    .filter((skill) => !/Any/i.test(skill));
  const specialties = SKILL_SPECIALTIES[base] ?? [];
  const newOptions = specialties
    .map((specialty) => `${base} (${specialty})`)
    .filter((skill) => !existing.includes(skill));
  if (!existing.length && !newOptions.length) return base;
  const weighted = [];
  for (const skill of existing) {
    const level = skills[skill] ?? 0;
    const weight = level > 0 ? 4 : 2;
    for (let i = 0; i < weight; i++) weighted.push(skill);
  }
  for (const skill of newOptions) {
    weighted.push(skill);
  }
  if (!weighted.length) return base;
  return rng ? choice(rng, weighted) : weighted[0];
}

function specialtyBase(rawSkill) {
  const text = String(rawSkill).replace(/'+$/g, '').trim();
  const anyMatch = text.match(/^Any\s+(.+)$/i) ?? text.match(/^(.+?)\s*\(any\)$/i);
  if (anyMatch) return canonicalSkillBase(anyMatch[1]);
  const unspecialized = canonicalSkillBase(text);
  return SKILL_SPECIALTIES[unspecialized] && text === unspecialized ? unspecialized : null;
}

function canonicalSkillBase(text) {
  const cleaned = normalizeSkillName(text);
  return Object.keys(SKILL_SPECIALTIES).find((base) => base.toLowerCase() === cleaned.toLowerCase()) ?? cleaned;
}

function termRecord(record, index, career, specialty) {
  return {
    ...record,
    term: index + 1,
    career,
    specialty,
  };
}

function benefitToType(benefit) {
  if (['Weapon', 'Gun', 'Blade', 'Armor', 'Scientific Equipment', 'Air/Raft', "Ship's Boat"].includes(benefit)) return 'equipment';
  if (['Contact', 'Ally', 'TAS Membership'].includes(benefit)) return 'relationship';
  return 'asset';
}

function benefitToEquipment(benefit, rng, skills) {
  const weaponPools = {
    Weapon: ['Blade', 'Autopistol', 'Carbine', 'Rifle', 'Shotgun', 'Laser Pistol', 'Laser Carbine'],
    Gun:    ['Autopistol', 'Carbine', 'Rifle', 'Shotgun', 'Laser Pistol', 'Laser Carbine'],
    Blade:  ['Blade'],
  };
  if (weaponPools[benefit]) {
    const pool = weaponPools[benefit];
    let chosen = pool[0];
    if (rng && skills && pool.length > 1) {
      const scored = pool.map((name) => ({ name, score: weaponSkillScore({ name }, skills) }));
      const best = scored.filter((w) => w.score === Math.max(...scored.map((w) => w.score)));
      chosen = choice(rng, best.map((w) => w.name));
    }
    return { name: chosen, source: 'benefit', cost: 0 };
  }
  const map = {
    Armor: 'Cloth armor',
    'Scientific Equipment': 'Scientific equipment',
    'Air/Raft': 'Air/Raft',
    "Ship's Boat": "Ship's Boat",
    'Combat Implant': 'Combat implant',
  };
  return map[benefit] ? { name: map[benefit], source: 'benefit', cost: 0 } : null;
}

function buildCombatTable(equipment, skills, stats) {
  const joat = skills['Jack of all Trades'] ?? 0;
  const unskilledDm = Math.min(0, -3 + joat);
  return equipment
    .map((item) => {
      const weapon = coreRules.weaponCombat[item.name];
      if (!weapon) return null;
      const skill = bestWeaponSkill(skills, weapon);
      const characteristicDm = modifier(stats[weapon.characteristic] ?? 0);
      const skillDm = skill.level ?? unskilledDm;
      const joatNote = skill.level === null && joat > 0 ? `Jack of all Trades ${joat}` : null;
      return {
        weapon: item.name,
        source: item.source,
        skill: skill.name,
        skillLevel: skill.level,
        skillDm,
        joatNote,
        characteristic: weapon.characteristic,
        characteristicDm,
        attackDm: characteristicDm + skillDm,
        damage: weapon.damage,
        range: weapon.range,
        traits: weapon.traits,
        sourcePage: weapon.sourcePage,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.weapon.localeCompare(b.weapon));
}

function buildPsionics(skills, stats, terms, options) {
  const talents = PSIONIC_TALENTS
    .filter((talent) => skills[talent] !== undefined)
    .map((talent) => ({
      name: talent,
      level: skills[talent],
      powers: PSIONIC_POWERS[talent] ?? [],
    }));
  const psionCareer = terms.some((term) => term.Career === 'Psion');
  const psionicMode = Boolean(options.psi);
  if (!talents.length && !psionCareer && !psionicMode) return null;
  const inferredTalents = talents.length ? talents : [{
    name: 'Latent Talent',
    level: 0,
    powers: ['Untrained psionic potential'],
  }];
  return {
    rating: stats.Psi ?? 0,
    talents: inferredTalents,
    powers: inferredTalents.flatMap((talent) => talent.powers.map((power) => ({
      talent: talent.name,
      name: power,
      level: talent.level,
    }))),
  };
}

function bestWeaponSkill(skills, weapon) {
  const candidates = [weapon.skill, ...(weapon.fallbackSkills ?? [])];
  const known = candidates
    .flatMap((name) => matchingSkillEntries(skills, name))
    .sort((a, b) => b.level - a.level);
  return known[0] ?? { name: weapon.skill, level: null };
}

function matchingSkillEntries(skills, baseName) {
  return Object.entries(skills)
    .filter(([name]) => name === baseName || name.startsWith(`${baseName} (`))
    .map(([name, level]) => ({ name, level }));
}

function weaponSkillScore(item, skills) {
  const combatData = coreRules.weaponCombat[item.name];
  if (!combatData) return 0;
  const primarySkill = combatData.skill;
  const baseName = primarySkill.split(' (')[0];
  if (skills[primarySkill] >= 0) return 10;
  if (Object.keys(skills).some((s) => s === baseName || s.startsWith(`${baseName} (`))) return 5;
  return 0;
}

function purchaseCombatWeapon(credits, equipment, skills) {
  const hasCombatSkill = Object.keys(skills).some(
    (s) => s === 'Melee' || s.startsWith('Melee (') || s === 'Gun Combat' || s.startsWith('Gun Combat ('),
  );
  if (!hasCombatSkill) return null;

  const owned = new Set(equipment.map((e) => e.name));
  const candidates = Object.entries(coreRules.weaponCombat)
    .filter(([name, weapon]) => {
      const base = weapon.skill.split(' (')[0];
      return base === 'Melee' || base === 'Gun Combat';
    })
    .map(([name]) => {
      const equipEntry = coreRules.equipment.find((e) => e.name === name);
      return equipEntry ? { name, cost: equipEntry.cost } : null;
    })
    .filter((w) => w && !owned.has(w.name) && w.cost <= credits)
    .sort((a, b) => {
      const scoreDiff = weaponSkillScore(b, skills) - weaponSkillScore(a, skills);
      return scoreDiff !== 0 ? scoreDiff : a.cost - b.cost;
    });

  return candidates[0] ? { name: candidates[0].name, cost: candidates[0].cost, source: 'purchased' } : null;
}

function purchaseCareerKit(rng, careerPath, homeworld, credits, ownedEquipment = [], skills = {}) {
  const budget = Math.min(Math.floor(credits * 0.3), 20000);
  if (budget <= 0) return [];
  const careerTags = careerPath.flatMap(({ career }) => String(career).toLowerCase().split(/\s+/));
  const tags = new Set([...careerTags, ...homeworld.tradeCodes.map((code) => code.toLowerCase().split(/\s+/)[0]), 'all']);
  const candidates = coreRules.equipment
    .filter((item) => item.tags.some((tag) => tags.has(tag)))
    .sort((a, b) => {
      const scoreDiff = weaponSkillScore(b, skills) - weaponSkillScore(a, skills);
      return scoreDiff !== 0 ? scoreDiff : (a.cost - b.cost || a.name.localeCompare(b.name));
    });
  let remaining = budget;
  const kit = [];
  for (const item of sample(rng, candidates, candidates.length)) {
    if (item.cost <= remaining && !kit.some((owned) => owned.name === item.name) && !ownedEquipment.some((owned) => owned.name === item.name)) {
      kit.push({ name: item.name, cost: item.cost, source: 'purchased' });
      remaining -= item.cost;
    }
  }
  return kit.sort((a, b) => a.name.localeCompare(b.name));
}

function buildResume({ terms, skills, benefits, equipment, contacts, enemies, awards, injuries, events, mishaps, lifeEvents, careerPath }) {
  const roles = terms.map((term) => ({
    term: term.T + 1,
    career: term.Career,
    specialty: term.Spec,
    rank: term.Rnk,
    survived: term.S,
    advanced: term.A,
    incidents: term.incidents ?? [],
  }));
  const ranks = careerPath.map((item) => `${item.career} ${item.spec} Rank ${item.rank}`);
  return {
    summary: `${terms.length} terms across ${careerPath.length} career role${careerPath.length === 1 ? '' : 's'}.`,
    roles,
    ranks,
    achievements: awards,
    events,
    mishaps,
    lifeEvents,
    incidents: [...events, ...mishaps],
    skillsGained: Object.entries(skills).map(([skill, value]) => `${skill} ${value}`).sort(),
    awards,
    benefits,
    contacts,
    enemies,
    injuries,
    equipment,
  };
}

function buildCharacterBio({ name, gender, homeworld, careerPath, events, mishaps, lifeEvents }) {
  const subject = bioSubject(name, gender);
  const background = `${subject.full} comes from ${homeworld.summary}, ${worldArticle(homeworld.tradeCodes)} ${homeworld.tradeCodes.join(', ')} world. ${subject.pronoun.capSubject} trained in ${homeworld.backgroundSkills.join(', ')} before leaving home.`;
  const path = careerPath.length
    ? `Professionally, ${subject.last} served ${careerPath.map((item) => careerPhrase(item)).join('; ')}.`
    : `${subject.last} has no formal career service recorded.`;
  const outcomes = [...events, ...mishaps]
    .sort((a, b) => a.term - b.term)
    .map((item) => careerBioSentence(subject, item))
    .filter(Boolean)
    .join(' ');
  const lives = lifeEvents.length
    ? lifeEvents.map((item) => lifeEventBioSentence(subject, item)).filter(Boolean).join(' ')
    : `${subject.pronoun.capPossessive} personal life remained comparatively quiet through these terms.`;

  return [background, path, outcomes || `${subject.last}'s service record contains no major incidents.`, lives].join('\n\n');
}

function tableText(item) {
  return String(item.text || item.label).replace(/\s+/g, ' ').trim().replace(/[.。]$/, '');
}

function proseName(name) {
  const match = String(name).match(/^\s*([^,]+),\s*(.+?)\s*$/);
  return match ? `${match[2]} ${match[1]}` : String(name);
}

function bioSubject(name, gender) {
  const full = proseName(name);
  const parts = full.split(/\s+/).filter(Boolean);
  const last = parts.length > 1 ? parts.at(-1) : full;
  return {
    full,
    last,
    pronoun: pronounsFor(gender),
  };
}

function pronounsFor(gender) {
  if (gender === 'male') return {
    subject: 'he',
    object: 'him',
    possessive: 'his',
    capSubject: 'He',
    capPossessive: 'His',
    bePast: 'was',
  };
  if (gender === 'female') return {
    subject: 'she',
    object: 'her',
    possessive: 'her',
    capSubject: 'She',
    capPossessive: 'Her',
    bePast: 'was',
  };
  return {
    subject: 'they',
    object: 'them',
    possessive: 'their',
    capSubject: 'They',
    capPossessive: 'Their',
    bePast: 'were',
  };
}

function careerBioSentence(subject, item) {
  const description = narrativeText(item);
  if (!description) return '';
  const service = `${subject.pronoun.capPossessive} time ${careerPhrase({ career: item.career, spec: item.specialty })}`;
  const eventText = thirdPersonText(subject, description);
  return `${service} ${item.source === 'mishap' ? 'was disrupted when' : 'was marked by'} ${bioClause(eventText)}.`;
}

function lifeEventBioSentence(subject, item) {
  const description = narrativeText(item);
  if (!description) return '';
  return `${subject.pronoun.capPossessive} personal life included ${bioClause(thirdPersonText(subject, description))}.`;
}

function narrativeText(item) {
  if (item.source === 'life_event') return lifeEventNarrative(item);
  const raw = tableText(item);
  const beforeColon = raw.includes(':') ? raw.split(':')[0] : raw;
  const cleaned = beforeColon
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !/\b(Roll|Throw|Gain|Increase|Reduce|Lose|Benefit|Advancement|Qualification|Mishap table|Injury table|Life Events table|page \d+|\d\+|\+[\d])/i.test(sentence))
    .join(' ')
    .replace(/\([^)]*(?:table|page)[^)]*\)/gi, '')
    .replace(/\bLife Event\b\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || tableText({ label: item.label }).replace(/\bLife Event\b\.?/gi, '').trim();
}

function lifeEventNarrative(item) {
  const label = tableText({ label: item.label }).split(':')[0].trim();
  const map = {
    'sickness or injury': 'a serious sickness or injury',
    'birth or death': 'a major family birth or death',
    'ending of relationship': 'the painful end of a relationship',
    'improved relationship': 'a deepening personal relationship',
    'new relationship': 'a new romantic relationship',
    'new contact': 'a useful new contact',
    betrayal: 'a betrayal by someone close',
    travel: 'a move to another world',
    'good fortune': 'a stroke of good fortune',
    crime: 'a brush with crime or legal trouble',
    'unusual event': 'an unusual and memorable incident',
  };
  return map[label.toLowerCase()] ?? lowercaseFirst(label);
}

function thirdPersonText(subject, text) {
  const { pronoun } = subject;
  return text
    .replace(/\bYou are tormented by or quarrel with\b/g, `${pronoun.subject} clashed with`)
    .replace(/\byou are tormented by or quarrel with\b/g, `${pronoun.subject} clashed with`)
    .replace(/\bYou complete\b/g, `${pronoun.subject} completed`)
    .replace(/\bYou establish\b/g, `${pronoun.subject} established`)
    .replace(/\bYou spend\b/g, `${pronoun.subject} spent`)
    .replace(/\bYou gain\b/g, `${pronoun.subject} gained`)
    .replace(/\bYou go\b/g, `${pronoun.subject} went`)
    .replace(/\bYou rise\b/g, `${pronoun.subject} rose`)
    .replace(/\bYou win\b/g, `${pronoun.subject} won`)
    .replace(/\bYou learn\b/g, `${pronoun.subject} learned`)
    .replace(/\bYou discover\b/g, `${pronoun.subject} discovered`)
    .replace(/\bYou display\b/g, `${pronoun.subject} displayed`)
    .replace(/\bYou make\b/g, `${pronoun.subject} made`)
    .replace(/\bYou become\b/g, `${pronoun.subject} became`)
    .replace(/\bYou encounter\b/g, `${pronoun.subject} encountered`)
    .replace(/\bYou thrive\b/g, `${pronoun.subject} thrived`)
    .replace(/\bYou manage\b/g, `${pronoun.subject} managed`)
    .replace(/\bYou are\b/g, `${pronoun.subject} ${pronoun.bePast}`)
    .replace(/\bYou were\b/g, `${pronoun.subject} ${pronoun.bePast}`)
    .replace(/\bYou have\b/g, `${pronoun.subject} had`)
    .replace(/\bYou can\b/g, `${pronoun.subject} could`)
    .replace(/\bYou\b/g, pronoun.subject)
    .replace(/\byou are\b/g, `${pronoun.subject} ${pronoun.bePast}`)
    .replace(/\byou were\b/g, `${pronoun.subject} ${pronoun.bePast}`)
    .replace(/\byou have\b/g, `${pronoun.subject} had`)
    .replace(/\byou can\b/g, `${pronoun.subject} could`)
    .replace(/\byou\b/g, pronoun.subject)
    .replace(/\bYour\b/g, pronoun.capPossessive)
    .replace(/\byour\b/g, pronoun.possessive);
}

function bioClause(text) {
  return lowercaseFirst(String(text).replace(/[.。]+$/g, '').trim());
}

function lowercaseFirst(text) {
  return text ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : text;
}

function articleFor(word) {
  return /^[aeiou]/i.test(String(word)) ? 'an' : 'a';
}

function worldArticle(tradeCodes) {
  return articleFor(tradeCodes[0] ?? 'average');
}

function careerPhrase(item) {
  const spec = String(item.spec ?? item.specialty ?? '').toLowerCase();
  const career = String(item.career ?? '').toLowerCase();
  const rank = item.rank ? `, reaching rank ${item.rank}` : '';
  if (!spec) return `in the ${career}${rank}`;
  if (spec === career) return `in the ${career}${rank}`;
  return `in ${spec} for the ${career}${rank}`;
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export function formatCharacterText(character) {
  const skills = Object.entries(character.skills).map(([skill, value]) => `${skill} ${value}`).join(', ');
  const path = character.careerPath.map((item) => `${item.career} (${item.spec}) [Rank ${item.rank}]`).join(', ');
  const nonCashBenefits = character.benefits.filter((b) => b.type !== 'cash');
  const benefitCounts = nonCashBenefits.reduce((m, b) => { const n = b.name ?? b; m.set(n, (m.get(n) || 0) + 1); return m; }, new Map());
  const benefitList = [...benefitCounts.entries()].map(([n, c]) => c > 1 ? `${n} (x${c})` : n);
  const benefits = [character.cash ? `${character.cash} Cr.` : '', ...benefitList].filter(Boolean).join(', ');
  const events = [...character.events, ...character.mishaps]
    .sort((a, b) => a.term - b.term)
    .map((item) => `Term ${item.term} ${item.source === 'mishap' ? 'Mishap' : 'Event'} ${item.roll}: ${item.label}`)
    .join('; ');
  const equipCounts = character.equipment.reduce((m, e) => { m.set(e.name, (m.get(e.name) || 0) + 1); return m; }, new Map());
  const combatCounts = (character.combat ?? []).reduce((m, e) => { m.set(e.weapon, (m.get(e.weapon) || 0) + 1); return m; }, new Map());
  const combat = `\nCombat: ${character.combat?.length
    ? [...new Set(character.combat.map((i) => i.weapon))].map((w) => { const item = character.combat.find((i) => i.weapon === w); const c = combatCounts.get(w); return `${w}${c > 1 ? ` (x${c})` : ''} ${signed(item.attackDm)} (${item.damage}, ${item.range})`; }).join('; ')
    : 'None'}`;
  const equipment = equipCounts.size ? `\nEquipment: ${[...equipCounts.entries()].map(([n, c]) => c > 1 ? `${n} (x${c})` : n).join(', ')}` : '';
  const psionics = character.psionics ? `\nPsionics: Psi ${character.psionics.rating}; ${character.psionics.talents.map((talent) => `${talent.name} ${talent.level}`).join(', ')}` : '';
  const personality = character.personality ? `\nPersonality: ${character.personality.type}; ${character.personality.summary}` : '';
  const spacecraft = character.spacecraft ? `\nSpacecraft: ${character.spacecraft.name} (${character.spacecraft.type}) — ${character.spacecraft.ownershipType}` : '';
  return `${character.name}
${titleCase(character.gender)} ${character.homeworld.name} (${titleCase(character.ethnicity)}), age ${character.age}
UPP: ${character.upp} [${character.average.toFixed(1)}]
Bio: ${character.bio.replace(/\n\n/g, ' ')}
Skills: ${skills}
Benefits: ${benefits || 'None'}${equipment}${combat}${spacecraft}${psionics}${personality}
Seed: ${character.seed}`;
}

function signed(value) {
  return value >= 0 ? `+${value}` : String(value);
}
