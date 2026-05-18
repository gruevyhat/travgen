import { useRef, useState } from 'react';
import styles from './App.module.css';
import bStyles from './CharacterBuilder.module.css';
import { rollStat, formatUpp, modifier, STAT_METHODS, PSI_OPTIONS } from './generators/stats.js';
import {
  CAREER_EXPANSIONS, CAMPAIGN_MODES, WORLDS, ETHNICITIES, GENDERS,
  careerCatalog, rankTitle,
  buildCareers, buildFallbackCareers, generateHomeworld,
  backgroundSkillCount, chooseBackgroundSkills,
  qualify, draftOrDrift, canEnterCareer,
  startCareerSegment, careerTermCount, basicTrainingCount,
  getSkillSlice, gainSkill, resolveAwardedSkill,
  rollCheck, shouldAttemptCommission,
  resolveMishap, resolveCareerEvent,
  termRecord, blankTerm, rankRoll, rankForTerm,
  applyAging, choiceCredit, choiceBenefit,
  buildCombatTable, buildPsionics,
  buildResume, buildCharacterBio, calculatePension,
  purchaseCareerKit, purchaseCombatWeapon, generatePersonality,
  summarizeCareerPath, averageCore, formatCheckRoll, formatTarget,
  availableSkillTables, skillRollOnTable, musterOutRollCount,
  getRawEventText, detectEventChoiceType, extractSkillOptions,
} from './generators/character.js';
import { generateSpacecraft } from './generators/spacecraft.js';
import { learnSkills } from './generators/helpers.js';
import { generateName } from './generators/names.js';
import { d6 } from './generators/dice.js';

const STAT_NAMES = ['Str', 'Dex', 'End', 'Int', 'Edu', 'Soc'];
const MILITARY_CAREERS = new Set(['Army', 'Navy', 'Marines']);

function snapshotAcc(a) {
  if (!a) return null;
  const { rng, careers, fallbackCareers, ...rest } = a;
  try {
    return JSON.parse(JSON.stringify(rest, (_, v) =>
      v instanceof Set ? { __set: [...v] } : v
    ));
  } catch { return null; }
}

function restoreAcc(snapshot, original) {
  if (!snapshot || !original) return original;
  const revived = JSON.parse(JSON.stringify(snapshot), (_, v) =>
    v && typeof v === 'object' && '__set' in v ? new Set(v.__set) : v
  );
  return { ...revived, rng: original.rng, careers: original.careers, fallbackCareers: original.fallbackCareers };
}

const DEFAULT_OPTIONS = {
  name: '', gender: '', homeworld: '', campaignMode: 'standard',
  method: 'normal', psi: '', terms: '3', personality: true,
  expansions: {
    psion: false, chthonianStars: false, dilettante: false, agent: false,
    scoundrel: false, mercenary: false, highGuard: false, scoutBook: false, merchantPrince: false,
  },
};

function makeAcc(options) {
  const rng = () => Math.random();
  const maxTerms = Math.max(1, Math.min(8, parseInt(options.terms, 10) || 3));
  const careers = buildCareers(options.expansions ?? {});
  const fallbackCareers = buildFallbackCareers(options.expansions ?? {});
  const hw = generateHomeworld(rng, { campaignMode: options.campaignMode, requested: options.homeworld || undefined });
  const budget = backgroundSkillCount(7);
  const backgroundSkillsList = chooseBackgroundSkills(rng, hw, budget);
  const skills = {};
  const history = ['BACKGROUND', ` Starting UPP: (pending roll)`];
  learnSkills(skills, backgroundSkillsList);
  for (const [skill, value, source] of backgroundSkillsList) {
    history.push(` Learned ${skill} ${value} from ${source}.`);
  }
  return {
    rng,
    options,
    maxTerms,
    careers,
    fallbackCareers,
    homeworld: hw,
    backgroundSkills: backgroundSkillsList,
    stats: null,
    skills,
    history,
    terms: [],
    benefits: [],
    equipment: [],
    contacts: [],
    enemies: [],
    awards: [],
    injuries: [],
    events: [],
    mishaps: [],
    lifeEvents: [],
    aging: [],
    debts: [],
    credits: 0,
    cashRolls: 0,
    termIndex: 0,
    currentTerm: null,
    currentCareer: null,
    currentSpec: null,
    currentSegment: null,
    commissioned: false,
    usedDraft: false,
    enteredCareers: [],
    newCareer: true,
    pending: {
      nextQualificationDm: 0,
      nextSurvivalDm: 0,
      forceDraft: false,
      forceCareer: null,
      blockedCareers: new Set(),
      autoQualifyCareers: new Set(),
    },
    pendingSkillPicks: [],
    lastPickType: 'service',
    currentMusterResults: [],
    musterRollsDone: 0,
    musterRollsTotal: 0,
    musterSegment: null,
    pendingLeavingCareer: false,
  };
}

export function CharacterBuilder({ onViewCharacter }) {
  const [phase, setPhase] = useState('setup');
  const [phaseData, setPhaseData] = useState(null);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [rolledStats, setRolledStats] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [finalChar, setFinalChar] = useState(null);
  const acc = useRef(null);
  const phaseHistory = useRef([]);

  function pushHistory() {
    const snapshot = snapshotAcc(acc.current);
    if (!snapshot) return;
    phaseHistory.current.push({ phase, phaseData, accSnapshot: snapshot, rolledStats, selectedCareer, selectedSpec });
  }

  function handleGoBack() {
    const prev = phaseHistory.current.pop();
    if (!prev) return;
    acc.current = restoreAcc(prev.accSnapshot, acc.current);
    setPhase(prev.phase);
    setPhaseData(prev.phaseData);
    setRolledStats(prev.rolledStats ?? null);
    setSelectedCareer(prev.selectedCareer ?? '');
    setSelectedSpec(prev.selectedSpec ?? '');
  }

  function handleStart(opts) {
    phaseHistory.current = [];
    const newAcc = makeAcc(opts);
    acc.current = newAcc;
    const stats = Object.fromEntries(STAT_NAMES.map((s) => [s, rollStat(newAcc.rng, opts.method)]));
    stats.Psi = rollStat(newAcc.rng, opts.method);
    setRolledStats(stats);
    setPhase('stats');
    setPhaseData(null);
  }

  function handleRerollAll() {
    const a = acc.current;
    const newStats = Object.fromEntries(STAT_NAMES.map((s) => [s, rollStat(a.rng, a.options.method)]));
    newStats.Psi = rollStat(a.rng, a.options.method);
    setRolledStats(newStats);
  }

  function handleSwapStats(statA, statB) {
    setRolledStats((prev) => ({ ...prev, [statA]: prev[statB], [statB]: prev[statA] }));
  }

  function handleConfirmStats() {
    pushHistory();
    const a = acc.current;
    a.stats = { ...rolledStats };
    const name = a.options.name || generateName(a.rng, { gender: a.options.gender || 'neutral' });
    a.options = { ...a.options, name };
    a.history[1] = ` Starting UPP: ${formatUpp(a.stats)} [${averageCore(a.stats).toFixed(1)}]`;
    const newBg = backgroundSkillCount(a.stats.Edu);
    if (newBg !== a.backgroundSkills.length) {
      const newBgList = chooseBackgroundSkills(a.rng, a.homeworld, newBg);
      a.backgroundSkills = newBgList;
      a.skills = {};
      a.history = ['BACKGROUND', a.history[1]];
      learnSkills(a.skills, newBgList);
      for (const [skill, value, source] of newBgList) {
        a.history.push(` Learned ${skill} ${value} from ${source}.`);
      }
    }
    setPhase('background');
    setPhaseData({ homeworld: a.homeworld, backgroundSkills: a.backgroundSkills });
  }

  function handleBeginCareers() {
    pushHistory();
    startTerm();
  }

  function startTerm() {
    const a = acc.current;
    const lastTerm = a.terms[a.terms.length - 1];
    const canContinue = !a.newCareer && a.terms.length > 0 && a.currentCareer;
    const mustContinue = Boolean(lastTerm?.MustContinue);
    if (canContinue) {
      setSelectedCareer(a.currentCareer);
      setSelectedSpec(a.currentSpec);
    } else {
      setSelectedCareer('');
      setSelectedSpec('');
    }
    setPhase('career');
    setPhaseData({
      termIndex: a.termIndex, maxTerms: a.maxTerms, pending: a.pending, careers: a.careers,
      previousCareer: canContinue ? a.currentCareer : null,
      previousSpec: canContinue ? a.currentSpec : null,
      canContinue,
      mustContinue,
    });
  }

  function handleQualify(career, spec) {
    pushHistory();
    const a = acc.current;
    const { careers, fallbackCareers, stats, enteredCareers, pending } = a;
    const wasNewCareer = a.termIndex === 0 || a.currentCareer !== career;
    a.newCareer = wasNewCareer;
    a.currentCareer = career;
    a.currentSpec = spec;
    a.currentTerm = blankTerm(a.termIndex);
    a.currentTerm.steps = [];

    const table = careers[career]?.[spec];
    if (!table) return;

    a.history.push(`TERM ${a.termIndex}`);

    // Qualification
    const qualResult = qualify(a.rng, stats, table, career, enteredCareers, a.newCareer, pending);
    a.currentTerm.Qualification = qualResult;
    a.currentTerm.Q = qualResult.success;
    a.currentTerm.steps.push({
      stage: 'Qualification',
      roll: formatCheckRoll(qualResult),
      result: qualResult.success ? 'Qualified' : 'Failed qualification',
      detail: `${career} ${formatTarget(table.Qual)}${qualResult.reason ? ` (${qualResult.reason})` : ''}`,
    });

    let draftResult = null;
    let actualCareer = career;
    let actualSpec = spec;

    if (!qualResult.success) {
      const [dc, ds, ud] = draftOrDrift(a.rng, careers, fallbackCareers, a.usedDraft);
      a.usedDraft = ud;
      actualCareer = dc;
      actualSpec = ds;
      a.currentCareer = dc;
      a.currentSpec = ds;
      a.newCareer = true;
      draftResult = { career: dc, spec: ds, drafted: ud };
      a.currentTerm.Career = dc;
      a.currentTerm.Spec = ds;
      a.currentTerm.steps.push({
        stage: ud ? 'Draft' : 'Drifter fallback',
        roll: ud ? 'draft table' : '-',
        result: `${dc} / ${ds}`,
        detail: 'Failed qualification redirected the term.',
      });
    } else {
      a.currentTerm.Career = career;
      a.currentTerm.Spec = spec;
    }

    a.currentTerm.Commissioned = a.commissioned;

    if (a.newCareer) {
      a.enteredCareers.push(actualCareer);
      a.currentSegment = startCareerSegment(actualCareer);
    }

    // Basic training
    const btCount = basicTrainingCount(a.termIndex, a.newCareer, a.terms, actualCareer);
    a.currentTerm.BT = btCount;
    let basicTrainingGained = [];
    if (btCount) {
      const basic = getSkillSlice(actualCareer, actualSpec, 'BT');
      const learned = a.termIndex === 0 ? basic : [basic[Math.floor(a.rng() * basic.length)]];
      const resolvedLearned = learned.map(([skill, value]) => [resolveAwardedSkill(a.rng, a.skills, skill), value]);
      resolvedLearned.forEach(([skill, value]) => {
        gainSkill(a.skills, skill, value);
        a.history.push(` Learned ${skill} ${a.skills[skill]} in Basic Training.`);
      });
      basicTrainingGained = resolvedLearned.map(([skill]) => `${skill} ${a.skills[skill]}`);
      a.currentTerm.steps.push({
        stage: 'Basic Training',
        roll: a.termIndex === 0 ? 'all service skills' : 'automated pick',
        result: basicTrainingGained.join(', '),
        detail: a.termIndex === 0 ? 'First career grants all service skills at level 0.' : 'New career grants one service skill.',
      });
    }

    setPhase('qualify');
    setPhaseData({
      career: actualCareer,
      spec: actualSpec,
      qualResult,
      draftResult,
      basicTrainingGained,
      table,
    });
  }

  function handleAfterQualify() {
    pushHistory();
    rollSurvival();
  }

  function autoResolveChoice(choiceInfo, rng) {
    if (!choiceInfo) return {};
    const { type } = choiceInfo;
    if (type === 'wager_amount') return { wagerAmount: 0, wagerSkill: choiceInfo.skills[0] };
    if (type === 'wager_optional') return { wagerOptional: false, wagerAmount: 0 };
    if (type === 'either_adv') return Math.random() < 0.5 ? { eitherPath: 'skill' } : { eitherPath: 'dm' };
    if (type === 'any_skill_increase') return {}; // handled by falling through — no skill to pick randomly
    if (type === 'gain_one_of') {
      const opts = choiceInfo.options ?? [];
      return { gainOneOf: opts[Math.floor(rng() * opts.length)] };
    }
    if (type === 'accept_refuse') return { acceptRefuse: Math.random() < 0.5 ? 'accept' : 'refuse' };
    return {};
  }

  function autoRollTerm() {
    pushHistory();
    const a = acc.current;
    const { stats, pending, careers, rng } = a;
    const table = careers[a.currentCareer]?.[a.currentSpec];
    if (!table) return;

    // Step 1: Survival
    a.currentTerm.SurvivalDm = pending.nextSurvivalDm;
    pending.nextSurvivalDm = 0;
    const survResult = rollCheck(rng, stats, table.Surv, a.currentTerm.SurvivalDm);
    a.currentTerm.Survival = survResult;
    a.currentTerm.S = survResult.success;
    a.currentTerm.steps.push({
      stage: 'Survival',
      roll: formatCheckRoll(survResult),
      result: survResult.success ? 'Survived' : 'Mishap',
      detail: `${formatTarget(table.Surv)}${a.currentTerm.SurvivalDm ? `, DM ${a.currentTerm.SurvivalDm >= 0 ? '+' : ''}${a.currentTerm.SurvivalDm}` : ''}`,
    });

    if (!survResult.success) {
      const mishapRoll = d6(rng);
      a.currentTerm.EM = `m[${mishapRoll}]`;
      const rawMishapText = getRawEventText(a.currentCareer, 'mishaps', mishapRoll);
      const mishapChoices = autoResolveChoice(detectEventChoiceType(rawMishapText), rng);
      applyAndShowMishap(mishapRoll, survResult, mishapChoices);
      return;
    }

    a.newCareer = false;

    // Step 2: Service skill — pick random table
    a.pendingSkillPicks = [{ type: 'service' }];
    const tables = availableSkillTables(a.currentCareer, a.currentSpec, a.stats, a.commissioned);
    const svcTable = tables[Math.floor(rng() * tables.length)];
    const svcResult = skillRollOnTable(rng, a.stats, a.skills, a.currentCareer, a.currentSpec, svcTable, a.history);
    if (svcResult) {
      a.currentTerm.steps.push({
        stage: `Service Skill — ${svcTable}`,
        roll: `1d6 = ${svcResult.roll}`,
        result: svcResult.applied ? `${svcResult.applied.name} ${svcResult.applied.value}` : `${svcResult.entry?.[0]} ${svcResult.entry?.[1]}`,
        detail: svcResult.applied?.type === 'stat'
          ? `${svcResult.applied.name} is now ${svcResult.applied.value}`
          : `${svcResult.applied?.name ?? ''} is now ${svcResult.applied?.value ?? ''}`,
      });
      a.currentTerm.SR = (a.currentTerm.SR ?? 0) + 1;
    }
    a.pendingSkillPicks.shift();

    // Step 3: Event
    const eventDice = [d6(rng), d6(rng)];
    const eventRoll = eventDice[0] + eventDice[1];
    a.currentTerm.EM = `e[${eventDice[0]},${eventDice[1]}]`;
    const rawText = getRawEventText(a.currentCareer, 'events', eventRoll);
    const eventChoices = autoResolveChoice(detectEventChoiceType(rawText), rng);
    const stateObj = {
      contacts: a.contacts, enemies: a.enemies, awards: a.awards, lifeEvents: a.lifeEvents,
      injuries: a.injuries, career: a.currentCareer, spec: a.currentSpec,
      skills: a.skills, currentSegment: a.currentSegment, pending: a.pending,
      setCredits: (v) => { a.credits = v; }, creditsRef: () => a.credits,
    };
    const event = termRecord(
      resolveCareerEvent(rng, eventRoll, a.stats, a.skills, a.currentCareer, a.currentSpec, stateObj, a.history, eventChoices),
      a.termIndex, a.currentCareer, a.currentSpec,
    );
    a.currentTerm.event = event;
    a.currentTerm.incidents = [event];
    a.events.push(event);
    a.history.push(` Event: ${event.label}.`);
    a.currentTerm.steps.push({
      stage: 'Event',
      roll: `2d6 = ${eventDice[0]} + ${eventDice[1]} = ${eventRoll}`,
      result: event.label,
      detail: event.text || event.label,
    });
    if (event.effect === 'career_skill' && !eventChoices.gainOneOf) {
      const evtTables = availableSkillTables(a.currentCareer, a.currentSpec, a.stats, a.commissioned);
      const evtTable = evtTables[Math.floor(rng() * evtTables.length)];
      const evtSkill = skillRollOnTable(rng, a.stats, a.skills, a.currentCareer, a.currentSpec, evtTable, a.history);
      if (evtSkill) {
        a.currentTerm.steps.push({
          stage: `Event Skill — ${evtTable}`,
          roll: `1d6 = ${evtSkill.roll}`,
          result: evtSkill.applied ? `${evtSkill.applied.name} ${evtSkill.applied.value}` : '',
        });
      }
    }

    // Step 4: Advancement (inline — same logic as rollAdvancement)
    const { commissioned } = a;
    const term = a.currentTerm;
    let commissionResult = null;
    if (term.event?.automaticCommission && MILITARY_CAREERS.has(a.currentCareer) && !a.commissioned) {
      a.commissioned = true;
      term.Commission = true;
      term.Commissioned = true;
      term.Rnk = Math.max(term.Rnk ?? 0, 1);
      const rankReward = rankRoll(rng, stats, a.skills, `${a.currentCareer} Officer`, a.currentSpec, 1, a.history);
      if (rankReward) term.steps.push({ stage: 'Automatic Commission Reward', roll: 'Rank 1', result: rankReward.applied ? `${rankReward.applied.name} ${rankReward.applied.value}` : 'No reward' });
      commissionResult = { automatic: true, success: true };
    }
    if (!commissionResult && MILITARY_CAREERS.has(a.currentCareer) && !a.commissioned && shouldAttemptCommission(stats, table.Adv)) {
      const cr = rollCheck(rng, stats, ['Soc', 8]);
      term.Commission = cr.success;
      term.CommissionRoll = cr.total;
      term.CommissionCheck = cr;
      if (cr.success) {
        a.commissioned = true;
        term.Commissioned = true;
        term.Rnk = Math.max(term.Rnk ?? 0, 1);
        const rankReward = rankRoll(rng, stats, a.skills, `${a.currentCareer} Officer`, a.currentSpec, 1, a.history);
        if (rankReward) term.steps.push({ stage: 'Commission Reward', roll: 'Rank 1', result: rankReward.applied ? `${rankReward.applied.name} ${rankReward.applied.value}` : 'No reward' });
      }
      term.steps.push({ stage: 'Commission', roll: formatCheckRoll(cr), result: cr.success ? 'Commissioned' : 'Not commissioned', detail: 'Soc 8+' });
      commissionResult = cr;
    }
    const advancementDm = term.event?.advancementDm ?? 0;
    const advancement = rollCheck(rng, stats, table.Adv, advancementDm);
    term.Advancement = advancement;
    term.AdvancementRoll = advancement.natural;
    term.A = advancement.success;
    term.steps.push({ stage: 'Advancement', roll: formatCheckRoll(advancement), result: term.A ? 'Advanced' : 'No advancement', detail: `${formatTarget(table.Adv)}${advancementDm ? `, event DM +${advancementDm}` : ''}` });
    term.MustLeave = advancement.natural <= careerTermCount(a.terms, a.currentCareer) + 1 && advancement.natural !== 12;
    term.MustContinue = advancement.natural === 12;
    let autoPromoted = false;
    if (term.event?.automaticPromotion && !term.event?.automaticCommission) {
      term.Rnk = rankForTerm(a.termIndex, a.terms, a.currentCareer, true, a.commissioned || term.Commissioned, term.Rnk);
      const rankReward = rankRoll(rng, stats, a.skills, a.commissioned ? `${a.currentCareer} Officer` : a.currentCareer, a.currentSpec, term.Rnk, a.history);
      if (rankReward) term.steps.push({ stage: 'Automatic Promotion Reward', roll: `Rank ${term.Rnk}`, result: rankReward.applied ? `${rankReward.applied.name} ${rankReward.applied.value}` : 'No reward' });
      autoPromoted = true;
    }
    if (term.A && !autoPromoted) {
      term.Rnk = rankForTerm(a.termIndex, a.terms, a.currentCareer, true, a.commissioned || term.Commissioned, term.Rnk);
      // Auto-pick advancement skill
      const advTables = availableSkillTables(a.currentCareer, a.currentSpec, a.stats, a.commissioned);
      const advTable = advTables[Math.floor(rng() * advTables.length)];
      const advSkill = skillRollOnTable(rng, a.stats, a.skills, a.currentCareer, a.currentSpec, advTable, a.history);
      if (advSkill) {
        term.steps.push({ stage: `Advancement Skill — ${advTable}`, roll: `1d6 = ${advSkill.roll}`, result: advSkill.applied ? `${advSkill.applied.name} ${advSkill.applied.value}` : '' });
      }
    } else {
      term.Rnk = rankForTerm(a.termIndex, a.terms, a.currentCareer, Boolean(autoPromoted), a.commissioned || term.Commissioned, term.Rnk);
    }
    // Rank reward
    if (term.A) {
      const rankReward = rankRoll(rng, a.stats, a.skills, a.commissioned ? `${a.currentCareer} Officer` : a.currentCareer, a.currentSpec, term.Rnk, a.history);
      if (rankReward) term.steps.push({ stage: 'Rank Reward', roll: `Rank ${term.Rnk}`, result: rankReward.applied ? `${rankReward.applied.name} ${rankReward.applied.value}` : 'No reward' });
    }

    finalizeTerm(false);
  }

  function rollSurvival() {
    const a = acc.current;
    const { stats, pending, careers } = a;
    const table = careers[a.currentCareer]?.[a.currentSpec];
    if (!table) return;

    a.currentTerm.SurvivalDm = pending.nextSurvivalDm;
    pending.nextSurvivalDm = 0;
    const survResult = rollCheck(a.rng, stats, table.Surv, a.currentTerm.SurvivalDm);
    a.currentTerm.Survival = survResult;
    a.currentTerm.S = survResult.success;
    a.currentTerm.steps.push({
      stage: 'Survival',
      roll: formatCheckRoll(survResult),
      result: survResult.success ? 'Survived' : 'Mishap',
      detail: `${formatTarget(table.Surv)}${a.currentTerm.SurvivalDm ? `, DM ${a.currentTerm.SurvivalDm >= 0 ? '+' : ''}${a.currentTerm.SurvivalDm}` : ''}`,
    });

    if (!survResult.success) {
      // Mishap
      const mishapRoll = d6(a.rng);
      a.currentTerm.EM = `m[${mishapRoll}]`;
      const rawMishapText = getRawEventText(a.currentCareer, 'mishaps', mishapRoll);
      const mishapChoiceInfo = detectEventChoiceType(rawMishapText);
      if (mishapChoiceInfo) {
        a.pendingMishapRoll = mishapRoll;
        a.pendingMishapSurvResult = survResult;
        setPhase('event-choice');
        setPhaseData({ choiceInfo: mishapChoiceInfo, mishapRoll, rawText: rawMishapText, kind: 'mishap', survResult });
        return;
      }
      applyAndShowMishap(mishapRoll, survResult, {});
    } else {
      a.newCareer = false;
      setPhase('survival');
      setPhaseData({ survResult });
    }
  }

  function handleAfterSurvival() {
    pushHistory();
    // Queue one service skill pick
    const a = acc.current;
    a.pendingSkillPicks = [{ type: 'service' }];
    setPhase('skill-pick');
    setPhaseData({
      context: 'service',
      tables: availableSkillTables(a.currentCareer, a.currentSpec, a.stats, a.commissioned),
    });
  }

  function handleAfterMishap() {
    pushHistory();
    const a = acc.current;
    finalizeTerm(true);
  }

  function handleSkillPick(tableName) {
    pushHistory();
    const a = acc.current;
    const result = skillRollOnTable(a.rng, a.stats, a.skills, a.currentCareer, a.currentSpec, tableName, a.history);
    if (!result) return;
    a.currentTerm.steps.push({
      stage: `${a.pendingSkillPicks[0]?.type === 'advancement' ? 'Advancement Skill' : 'Service Skill'} — ${tableName}`,
      roll: `1d6 = ${result.roll}`,
      result: result.applied ? `${result.applied.name} ${result.applied.value}` : `${result.entry[0]} ${result.entry[1]}`,
      detail: result.applied?.type === 'stat'
        ? `Characteristic increase: ${result.applied.name} is now ${result.applied.value}.`
        : `Skill gained: ${result.applied.name} is now ${result.applied.value}.`,
    });
    a.currentTerm.SR = (a.currentTerm.SR ?? 0) + 1;
    const context = a.pendingSkillPicks[0]?.type ?? 'service';
    a.lastPickType = context;
    a.pendingSkillPicks.shift();
    setPhaseData({ context, tableName, result });
    setPhase('skill-result');
  }

  function handleAfterSkillResult() {
    pushHistory();
    const a = acc.current;
    if (a.pendingSkillPicks.length > 0) {
      // More skill picks needed (event-granted or advancement)
      const nextCtx = a.pendingSkillPicks[0].type;
      setPhase('skill-pick');
      setPhaseData({
        context: nextCtx,
        tables: availableSkillTables(a.currentCareer, a.currentSpec, a.stats, a.commissioned),
      });
      return;
    }
    // Route based on what kind of pick just finished
    const lastType = a.lastPickType ?? 'service';
    if (lastType === 'service') {
      rollEvent();
    } else if (lastType === 'event') {
      rollAdvancement();
    } else {
      // advancement skill done
      applyRankRewardAndContinue();
    }
  }

  function rollEvent() {
    const a = acc.current;
    const eventDice = [d6(a.rng), d6(a.rng)];
    a.currentTerm.EM = `e[${eventDice[0]},${eventDice[1]}]`;
    const eventRoll = eventDice[0] + eventDice[1];
    const rawText = getRawEventText(a.currentCareer, 'events', eventRoll);
    const choiceInfo = detectEventChoiceType(rawText);
    if (choiceInfo) {
      a.pendingEventRoll = eventDice;
      a.pendingEventKind = 'event';
      setPhase('event-choice');
      setPhaseData({ choiceInfo, eventDice, rawText, kind: 'event' });
      return;
    }
    applyAndShowEvent(eventDice, {});
  }

  function applyAndShowEvent(eventDice, choices) {
    const a = acc.current;
    const eventRoll = eventDice[0] + eventDice[1];
    const event = termRecord(resolveCareerEvent(a.rng, eventRoll, a.stats, a.skills, a.currentCareer, a.currentSpec, {
      contacts: a.contacts, enemies: a.enemies, awards: a.awards, lifeEvents: a.lifeEvents,
      injuries: a.injuries, career: a.currentCareer, spec: a.currentSpec,
      skills: a.skills, currentSegment: a.currentSegment, pending: a.pending,
      setCredits: (v) => { a.credits = v; }, creditsRef: () => a.credits,
    }, a.history, choices), a.termIndex, a.currentCareer, a.currentSpec);
    a.currentTerm.event = event;
    a.currentTerm.incidents = [event];
    a.events.push(event);
    a.history.push(` Event: ${event.label}.`);
    a.currentTerm.steps.push({
      stage: 'Event',
      roll: `2d6 = ${eventDice[0]} + ${eventDice[1]} = ${eventDice[0] + eventDice[1]}`,
      result: event.label,
      detail: event.text || event.label,
    });
    if (event.effect === 'career_skill' && !choices.gainOneOf) {
      a.pendingSkillPicks.push({ type: 'event' });
    }
    setPhase('event');
    setPhaseData({ event, eventDice });
  }

  function applyAndShowMishap(mishapRoll, survResult, choices) {
    const a = acc.current;
    const { stats, pending } = a;
    const mishap = termRecord(resolveMishap(a.rng, mishapRoll, stats, {
      contacts: a.contacts, enemies: a.enemies, injuries: a.injuries,
      lifeEvents: a.lifeEvents, career: a.currentCareer, spec: a.currentSpec,
      skills: a.skills, awards: a.awards, currentSegment: a.currentSegment, pending,
      creditsRef: () => a.credits, setCredits: (v) => { a.credits = v; },
    }, choices), a.termIndex, a.currentCareer, a.currentSpec);
    a.currentTerm.mishap = mishap;
    a.currentTerm.incidents = [mishap];
    a.mishaps.push(mishap);
    a.currentTerm.S = Boolean(mishap.continueCareer);
    a.currentTerm.A = false;
    a.newCareer = !a.currentTerm.S;
    a.history.push(` Mishap: ${mishap.label}.`);
    a.currentTerm.steps.push({
      stage: 'Mishap',
      roll: `1d6 = ${mishapRoll}`,
      result: mishap.label,
      detail: mishap.text || mishap.label,
    });
    setPhase('mishap');
    setPhaseData({ survResult, mishap, continueCareer: mishap.continueCareer });
  }

  function handleEventChoice(choices) {
    pushHistory();
    const a = acc.current;
    const { kind } = phaseData;
    if (kind === 'mishap') {
      applyAndShowMishap(a.pendingMishapRoll, a.pendingMishapSurvResult, choices);
    } else {
      applyAndShowEvent(a.pendingEventRoll, choices);
    }
  }

  function handleAfterEvent() {
    pushHistory();
    const a = acc.current;
    if (a.pendingSkillPicks.length > 0) {
      const nextCtx = a.pendingSkillPicks[0].type;
      setPhase('skill-pick');
      setPhaseData({
        context: nextCtx,
        tables: availableSkillTables(a.currentCareer, a.currentSpec, a.stats, a.commissioned),
      });
      return;
    }
    rollAdvancement();
  }

  function rollAdvancement() {
    const a = acc.current;
    const { stats, careers, commissioned } = a;
    const table = careers[a.currentCareer]?.[a.currentSpec];
    if (!table) return;

    // Auto-promotion / commission from event
    let commissionResult = null;
    const term = a.currentTerm;
    if (term.event?.automaticCommission && MILITARY_CAREERS.has(a.currentCareer) && !a.commissioned) {
      a.commissioned = true;
      term.Commission = true;
      term.Commissioned = true;
      term.Rnk = Math.max(term.Rnk ?? 0, 1);
      const rankReward = rankRoll(a.rng, stats, a.skills, `${a.currentCareer} Officer`, a.currentSpec, 1, a.history);
      if (rankReward) {
        term.steps.push({
          stage: 'Automatic Commission Reward',
          roll: `Rank 1`,
          result: rankReward.applied ? `${rankReward.applied.name} ${rankReward.applied.value}` : 'No reward',
        });
      }
      commissionResult = { automatic: true, success: true };
    }

    // Manual commission attempt
    if (!commissionResult && MILITARY_CAREERS.has(a.currentCareer) && !a.commissioned && shouldAttemptCommission(stats, table.Adv)) {
      const { COMMISSION = 8 } = {};
      const cr = rollCheck(a.rng, stats, ['Soc', 8]);
      term.Commission = cr.success;
      term.CommissionRoll = cr.total;
      term.CommissionCheck = cr;
      if (cr.success) {
        a.commissioned = true;
        term.Commissioned = true;
        term.Rnk = Math.max(term.Rnk ?? 0, 1);
        const rankReward = rankRoll(a.rng, stats, a.skills, `${a.currentCareer} Officer`, a.currentSpec, 1, a.history);
        if (rankReward) {
          term.steps.push({
            stage: 'Commission Reward',
            roll: `Rank 1`,
            result: rankReward.applied ? `${rankReward.applied.name} ${rankReward.applied.value}` : 'No reward',
          });
        }
      }
      term.steps.push({
        stage: 'Commission',
        roll: formatCheckRoll(cr),
        result: cr.success ? 'Commissioned' : 'Not commissioned',
        detail: 'Soc 8+',
      });
      commissionResult = cr;
    }

    // Advancement
    const advancementDm = term.event?.advancementDm ?? 0;
    const advancement = rollCheck(a.rng, stats, table.Adv, advancementDm);
    term.Advancement = advancement;
    term.AdvancementRoll = advancement.natural;
    term.A = advancement.success;
    term.steps.push({
      stage: 'Advancement',
      roll: formatCheckRoll(advancement),
      result: term.A ? 'Advanced' : 'No advancement',
      detail: `${formatTarget(table.Adv)}${advancementDm ? `, event DM +${advancementDm}` : ''}`,
    });

    term.MustLeave = advancement.natural <= careerTermCount(a.terms, a.currentCareer) + 1 && advancement.natural !== 12;
    term.MustContinue = advancement.natural === 12;

    // Automatic promotion from event
    let autoPromoted = false;
    if (term.event?.automaticPromotion && !term.event?.automaticCommission) {
      term.Rnk = rankForTerm(a.termIndex, a.terms, a.currentCareer, true, a.commissioned || term.Commissioned, term.Rnk);
      const rankReward = rankRoll(a.rng, stats, a.skills, a.commissioned ? `${a.currentCareer} Officer` : a.currentCareer, a.currentSpec, term.Rnk, a.history);
      if (rankReward) {
        term.steps.push({
          stage: 'Automatic Promotion Reward',
          roll: `Rank ${term.Rnk}`,
          result: rankReward.applied ? `${rankReward.applied.name} ${rankReward.applied.value}` : 'No reward',
        });
      }
      autoPromoted = true;
    }

    if (term.A && !autoPromoted) {
      term.Rnk = rankForTerm(a.termIndex, a.terms, a.currentCareer, true, a.commissioned || term.Commissioned, term.Rnk);
      a.pendingSkillPicks.push({ type: 'advancement' });
    } else {
      term.Rnk = rankForTerm(a.termIndex, a.terms, a.currentCareer, Boolean(autoPromoted), a.commissioned || term.Commissioned, term.Rnk);
    }

    setPhase('advancement');
    setPhaseData({ commissionResult, advancement, advanced: term.A, rank: term.Rnk, mustLeave: term.MustLeave });
  }

  function handleAfterAdvancement() {
    pushHistory();
    const a = acc.current;
    if (a.pendingSkillPicks.length > 0) {
      setPhase('skill-pick');
      setPhaseData({
        context: 'advancement',
        tables: availableSkillTables(a.currentCareer, a.currentSpec, a.stats, a.commissioned),
      });
      return;
    }
    applyRankRewardAndContinue();
  }

  function applyRankRewardAndContinue() {
    pushHistory();
    const a = acc.current;
    const term = a.currentTerm;
    if (term.A) {
      const rankReward = rankRoll(a.rng, a.stats, a.skills, a.commissioned ? `${a.currentCareer} Officer` : a.currentCareer, a.currentSpec, term.Rnk, a.history);
      if (rankReward) {
        term.steps.push({
          stage: 'Rank Reward',
          roll: `Rank ${term.Rnk}`,
          result: rankReward.applied ? `${rankReward.applied.name} ${rankReward.applied.value}` : 'No reward',
        });
      }
    }
    finalizeTerm(false);
  }

  function finalizeTerm(afterMishap) {
    const a = acc.current;
    const term = a.currentTerm;
    const { stats, rng, currentSegment } = a;

    const finalTerm = a.termIndex === a.maxTerms - 1;
    const leavingCareer = afterMishap ? (term.mishap && !term.mishap.continueCareer) : (finalTerm || !term.S || (term.MustLeave && !term.MustContinue));

    // Aging (term >= 4 means termIndex >= 3)
    term.Aging = a.termIndex < 3 ? null : applyAging(rng, stats, a.termIndex + 1, a.debts);
    term.Age = term.Aging ? term.Aging.roll : '-';
    if (term.Aging) a.aging.push(term.Aging);

    if (currentSegment) {
      currentSegment.terms += term.S ? 1 : 0;
      currentSegment.highestRank = Math.max(currentSegment.highestRank, term.Rnk ?? 0);
      currentSegment.leftByMishap = Boolean(term.mishap && !term.mishap.continueCareer);
    }

    a.terms.push(term);
    if (a.stats.Psi !== undefined) a.stats.Psi = Math.max(0, a.stats.Psi - 1);

    if (leavingCareer) {
      const rollsTotal = musterOutRollCount(currentSegment);
      a.musterRollsTotal = rollsTotal;
      a.musterRollsDone = 0;
      a.musterSegment = currentSegment ? { ...currentSegment } : null;
      a.newCareer = true;
      a.commissioned = false;

      if (rollsTotal > 0) {
        a.currentMusterResults = [];
        setPhase('muster');
        setPhaseData({
          rollNum: 1,
          total: rollsTotal,
          career: a.currentCareer,
          rank: term.Rnk ?? 0,
          highRank: (currentSegment?.highestRank ?? 0) >= 5,
          benefitDm: currentSegment?.benefitDm ?? 0,
          aging: term.Aging,
          results: [],
        });
        return;
      }
      // No muster rolls — show aging if any, then continue
      advanceAfterMuster(term.Aging);
    } else {
      a.newCareer = false;
      term.Ben = 0;
      advanceAfterMuster(term.Aging);
    }
  }

  function handleMusterPick(useCash, useDm = true) {
    pushHistory();
    const a = acc.current;
    const { rng, stats, skills, benefits, equipment, musterSegment } = a;
    const segment = musterSegment;
    const rankDm = segment?.highestRank >= 5 ? 1 : 0;
    const eventDm = segment?.benefitDm ?? 0;
    const availableDm = useCash ? 0 : rankDm + eventDm;
    const dm = useDm ? availableDm : 0;
    const natural = d6(rng);
    const roll = Math.min(7, natural + dm);
    if (!useCash && useDm && eventDm > 0) a.musterSegment.benefitDm = 0;
    let result;
    if (useCash) {
      a.cashRolls += 1;
      const amount = choiceCredit(segment?.career ?? a.currentCareer, roll);
      a.credits += amount;
      result = { name: `${amount} Cr.`, type: 'cash' };
      benefits.push({ ...result, source: 'benefit', career: segment?.career ?? a.currentCareer });
    } else {
      const benefit = choiceBenefit(rng, stats, skills, segment?.career ?? a.currentCareer, roll);
      if (benefit) {
        benefit.career = segment?.career ?? a.currentCareer;
        benefits.push(benefit);
        if (benefit.equipment) equipment.push(benefit.equipment);
        result = benefit;
      } else {
        result = { name: 'No benefit', type: 'none' };
      }
    }
    a.currentMusterResults.push(result);
    a.musterRollsDone += 1;
    const done = a.musterRollsDone >= a.musterRollsTotal;

    const lastTerm = a.terms[a.terms.length - 1];
    if (lastTerm) {
      lastTerm.steps.push({
        stage: useCash ? `Cash ${a.musterRollsDone}` : `Benefit ${a.musterRollsDone}`,
        roll: `1d6 ${natural}${dm ? ` +${dm}` : ''} = ${roll}`,
        result: result.name,
      });
    }

    if (done) {
      const aging = a.terms[a.terms.length - 1]?.Aging;
      advanceAfterMuster(aging);
    } else {
      setPhaseData({
        rollNum: a.musterRollsDone + 1,
        total: a.musterRollsTotal,
        career: segment?.career ?? a.currentCareer,
        rank: lastTerm?.Rnk ?? 0,
        highRank: (segment?.highestRank ?? 0) >= 5,
        benefitDm: segment?.benefitDm ?? 0,
        cashRolls: a.cashRolls,
        aging: lastTerm?.Aging,
        results: [...a.currentMusterResults],
      });
    }
  }

  function advanceAfterMuster(aging) {
    const a = acc.current;
    const isLast = a.termIndex >= a.maxTerms - 1;
    a.termIndex += 1;

    if (isLast) {
      startEquipmentPhase();
    } else {
      if (aging) {
        setPhase('aging');
        setPhaseData({ aging, nextTermIndex: a.termIndex });
      } else {
        startTerm();
      }
    }
  }

  function handleAfterAging() {
    pushHistory();
    startTerm();
  }

  function startEquipmentPhase() {
    const a = acc.current;
    const careerPath = summarizeCareerPath(a.terms);
    const suggestions = purchaseCareerKit(a.rng, careerPath, a.homeworld, a.credits, a.equipment, a.skills);
    const kitNames = new Set(suggestions.map((s) => s.name));
    const weapon = purchaseCombatWeapon(a.credits, [...a.equipment, ...suggestions], a.skills);
    const filteredWeapon = weapon && !kitNames.has(weapon.name) ? weapon : null;
    if (suggestions.length === 0 && !filteredWeapon) {
      assembleCharacter();
      return;
    }
    setPhase('equipment');
    setPhaseData({ suggestions, weapon: filteredWeapon, credits: a.credits });
  }

  function handleEquipmentConfirm(items) {
    const a = acc.current;
    for (const item of items) {
      a.credits -= item.cost;
      a.equipment.push(item);
    }
    assembleCharacter();
  }

  function assembleCharacter() {
    const a = acc.current;
    const { rng, stats, skills, terms, benefits, equipment, contacts, enemies, awards, injuries, events, mishaps, lifeEvents, aging, debts, options, homeworld, backgroundSkills, history } = a;

    // Clean up skills (specialty level-0 promotion)
    for (const key of [...Object.keys(skills)]) {
      const match = key.match(/^(.+?)\s*\(/);
      if (!match || skills[key] !== 0) continue;
      const parent = match[1].trim();
      if (skills[parent] === undefined) skills[parent] = 0;
      delete skills[key];
    }
    for (const key of Object.keys(skills)) {
      const match = key.match(/^(.+?)\s*\(/);
      if (match && skills[match[1]] === undefined) skills[match[1]] = 0;
    }

    const age = 18 + terms.length * 4;
    const personality = options.personality ? generatePersonality(rng) : null;
    const careerPath = summarizeCareerPath(terms);
    const finalUpp = formatUpp(stats, options.psi ? stats.Psi : null);
    for (const debt of debts) a.credits -= debt.amount;

    const combat = buildCombatTable(equipment, skills, stats);
    const psionics = buildPsionics(skills, stats, terms, options);
    const spacecraft = generateSpacecraft(rng, careerPath, benefits, equipment);
    const resume = buildResume({ terms, skills, benefits, equipment, contacts, enemies, awards, injuries, events, mishaps, lifeEvents, careerPath });
    const bio = buildCharacterBio({ name: options.name, gender: options.gender || 'neutral', homeworld, backgroundSkills: backgroundSkills.map(([skill]) => skill), careerPath, events, mishaps, lifeEvents });
    const pension = calculatePension(terms);
    const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);
    const careerHistory = terms.map((term) => {
      const nested = [...(term.event?.nested ?? []), ...(term.mishap?.nested ?? [])];
      const termLifeEvents = nested.filter((e) => e.source === 'life_event' || e.source === 'unusual_life_event');
      return {
        term: term.T + 1,
        career: term.Career,
        spec: term.Spec,
        rank: term.Rnk ?? 0,
        title: rankTitle(term.Career, term.Rnk),
        event: term.mishap ? term.mishap.label : (term.event ? term.event.label : null),
        incidentType: term.mishap ? 'Mishap' : (term.event ? 'Event' : null),
        incidentRoll: term.mishap?.roll ?? term.event?.roll ?? null,
        lifeEvents: termLifeEvents,
        survived: Boolean(term.S),
      };
    });

    const character = {
      seed: 'interactive',
      identity: { name: options.name, gender: options.gender || 'neutral', ethnicity: 'traveller' },
      name: options.name,
      gender: options.gender || 'neutral',
      ethnicity: 'traveller',
      campaignMode: options.campaignMode || 'standard',
      homeworld,
      backgroundSkills: backgroundSkills.map(([skill]) => skill),
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
      cash: a.credits,
      credits: a.credits,
      pension,
      totalDebt,
      contacts,
      enemies,
      injuries,
      aging,
      awards,
      events,
      mishaps,
      lifeEvents,
      debts,
      bio,
      resume,
      unresolved: [],
      personality,
      history,
      plainText: '',
    };

    setFinalChar(character);
    setPhase('complete');
    setPhaseData(null);
  }

  if (phase === 'complete' && finalChar) {
    return (
      <div className={bStyles.builderWrap}>
        <div className={bStyles.builderComplete}>
          <div className={bStyles.completeHeader}>
            <p className={styles.kicker}>Character Build Complete</p>
            <h2>{finalChar.name}</h2>
            <p className={bStyles.completeSubtitle}>
              {finalChar.terms.length} term{finalChar.terms.length !== 1 ? 's' : ''} · {finalChar.careerPath.map((c) => c.career).join(', ')}
            </p>
            <div className={bStyles.completeActions}>
              <button className={styles.primaryAction} type="button" onClick={() => onViewCharacter(finalChar)}>
                View Full Character Sheet
              </button>
              <button className={styles.secondaryAction} type="button" onClick={() => { setPhase('setup'); setFinalChar(null); }}>
                Build Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showSidebar = phase !== 'setup' && phase !== 'stats' && acc.current?.stats != null;

  return (
    <div className={bStyles.builderWrap}>
      {phase !== 'setup' && (
        <div className={bStyles.builderProgress}>
          {phaseHistory.current.length > 0 && (
            <button className={bStyles.backBtn} type="button" onClick={handleGoBack}>← Back</button>
          )}
          <ProgressBar phase={phase} acc={acc.current} />
        </div>
      )}
      <div className={bStyles.builderContent}>
        {showSidebar && <CharSheet acc={acc.current} />}
        <div className={bStyles.builderCardArea}>
          {phase === 'setup' && (
            <SetupPhase options={options} setOptions={setOptions} onStart={handleStart} />
          )}
          {phase === 'stats' && rolledStats && (
            <StatsPhase stats={rolledStats} onRerollAll={handleRerollAll} onSwap={handleSwapStats} onConfirm={handleConfirmStats} />
          )}
          {phase === 'background' && phaseData && (
            <BackgroundPhase data={phaseData} onContinue={handleBeginCareers} />
          )}
          {phase === 'career' && phaseData && (
            <CareerPickPhase
              phaseData={phaseData}
              careers={acc.current?.careers ?? {}}
              selectedCareer={selectedCareer}
              selectedSpec={selectedSpec}
              onCareerChange={(c) => { setSelectedCareer(c); setSelectedSpec(''); }}
              onSpecChange={setSelectedSpec}
              onQualify={() => handleQualify(selectedCareer, selectedSpec)}
              onContinuePrevious={() => handleQualify(phaseData.previousCareer, phaseData.previousSpec)}
            />
          )}
          {phase === 'qualify' && phaseData && (
            <QualifyPhase data={phaseData} onContinue={handleAfterQualify} onAutoRoll={autoRollTerm} />
          )}
          {phase === 'survival' && phaseData && (
            <SurvivalPhase data={phaseData} onContinue={handleAfterSurvival} />
          )}
          {phase === 'mishap' && phaseData && (
            <MishapPhase data={phaseData} onContinue={handleAfterMishap} />
          )}
          {phase === 'skill-pick' && phaseData && (
            <SkillPickPhase data={phaseData} onPick={handleSkillPick} />
          )}
          {phase === 'skill-result' && phaseData && (
            <SkillResultPhase data={phaseData} onContinue={handleAfterSkillResult} />
          )}
          {phase === 'event-choice' && phaseData && (
            <EventChoicePhase
              data={phaseData}
              benefitRollsAvailable={musterOutRollCount(acc.current?.currentSegment) + 1}
              currentSkills={acc.current?.skills ?? {}}
              onChoose={handleEventChoice}
            />
          )}
          {phase === 'event' && phaseData && (
            <EventPhase data={phaseData} onContinue={handleAfterEvent} />
          )}
          {phase === 'advancement' && phaseData && (
            <AdvancementPhase data={phaseData} onContinue={handleAfterAdvancement} />
          )}
          {phase === 'muster' && phaseData && (
            <MusterPhase data={phaseData} cashRolls={acc.current?.cashRolls ?? 0} onPick={handleMusterPick} />
          )}
          {phase === 'aging' && phaseData && (
            <AgingPhase data={phaseData} onContinue={handleAfterAging} />
          )}
          {phase === 'equipment' && phaseData && (
            <EquipmentPhase data={phaseData} onConfirm={handleEquipmentConfirm} onReroll={startEquipmentPhase} onSkip={assembleCharacter} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Progress indicator ───────────────────────────────────────────────────────

function ProgressBar({ phase, acc }) {
  if (!acc) return null;
  const termIndex = acc.termIndex;
  const maxTerms = acc.maxTerms;
  const termPhases = ['career', 'qualify', 'survival', 'mishap', 'skill-pick', 'skill-result', 'event-choice', 'event', 'advancement', 'muster', 'aging'];
  const isInTerm = termPhases.includes(phase);
  return (
    <div className={bStyles.progressBar}>
      <span className={!isInTerm && phase === 'stats' ? bStyles.progressActive : bStyles.progressDone}>Stats</span>
      <span className={bStyles.progressSep}>›</span>
      <span className={!isInTerm && phase === 'background' ? bStyles.progressActive : (termIndex > 0 || isInTerm ? bStyles.progressDone : bStyles.progressFuture)}>Background</span>
      {Array.from({ length: maxTerms }, (_, i) => (
        <span key={i} style={{ display: 'contents' }}>
          <span className={bStyles.progressSep}>›</span>
          <span className={
            isInTerm && termIndex === i ? bStyles.progressActive :
            termIndex > i ? bStyles.progressDone : bStyles.progressFuture
          }>Term {i + 1}</span>
        </span>
      ))}
      <span className={bStyles.progressSep}>›</span>
      <span className={phase === 'complete' ? bStyles.progressActive : bStyles.progressFuture}>Done</span>
    </div>
  );
}

// ── Setup phase ──────────────────────────────────────────────────────────────

function SetupPhase({ options, setOptions, onStart }) {
  const set = (patch) => setOptions((prev) => ({ ...prev, ...patch }));
  const setExpansion = (key, val) => set({ expansions: { ...options.expansions, [key]: val } });

  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>Character Build</p>
        <h2>Starting Options</h2>
        <p className={bStyles.phaseDesc}>Set your character's background before rolling dice.</p>
      </div>
      <div className={bStyles.phaseBody}>
        <section className={bStyles.formSection}>
          <p className={bStyles.formSectionLabel}>Identity</p>
          <div className={styles.controlGrid}>
            <label className={styles.field}>
              <span>Name</span>
              <input type="text" value={options.name} placeholder="Leave blank to auto-generate" onChange={(e) => set({ name: e.target.value })} />
            </label>
            <label className={styles.field}>
              <span>Gender</span>
              <select value={options.gender} onChange={(e) => set({ gender: e.target.value })}>
                <option value="">Random</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span>Campaign</span>
              <select value={options.campaignMode} onChange={(e) => set({ campaignMode: e.target.value, homeworld: '' })}>
                {CAMPAIGN_MODES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            {options.campaignMode === 'chthonian'
              ? (
                <label className={styles.field}>
                  <span>Homeworld</span>
                  <select value={options.homeworld} onChange={(e) => set({ homeworld: e.target.value })}>
                    <option value="">Random</option>
                    {WORLDS.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </label>
              ) : (
                <label className={styles.field}>
                  <span>Homeworld</span>
                  <input type="text" value={options.homeworld} placeholder="Auto-generate" onChange={(e) => set({ homeworld: e.target.value })} />
                </label>
              )
            }
          </div>
        </section>
        <section className={bStyles.formSection}>
          <p className={bStyles.formSectionLabel}>Generation</p>
          <div className={styles.controlGrid}>
            <label className={styles.field}>
              <span>Stat method</span>
              <select value={options.method} onChange={(e) => set({ method: e.target.value })}>
                {STAT_METHODS.map((o) => <option key={o.value} value={o.value}>{o.label} — {o.description}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span>Terms</span>
              <input type="number" value={options.terms} min="1" max="8" onChange={(e) => set({ terms: e.target.value })} />
            </label>
            <label className={styles.field}>
              <span>Psi</span>
              <select value={options.psi} onChange={(e) => set({ psi: e.target.value })}>
                {PSI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>
        </section>
        {CAREER_EXPANSIONS.length > 0 && (
          <section className={bStyles.formSection}>
            <p className={bStyles.formSectionLabel}>Career Books</p>
            <div className={bStyles.expansionGrid}>
              {CAREER_EXPANSIONS.map((exp) => (
                <label key={exp.key} className={styles.checkbox}>
                  <input type="checkbox" checked={Boolean(options.expansions[exp.key])} onChange={(e) => setExpansion(exp.key, e.target.checked)} />
                  <span>{exp.label}</span>
                </label>
              ))}
            </div>
          </section>
        )}
      </div>
      <div className={bStyles.phaseFooter}>
        <button className={styles.primaryAction} type="button" onClick={() => onStart(options)}>
          Roll Stats &amp; Begin
        </button>
      </div>
    </div>
  );
}

// ── Stats phase ──────────────────────────────────────────────────────────────

function StatsPhase({ stats, onRerollAll, onSwap, onConfirm }) {
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const upp = formatUpp(stats);
  const avg = (STAT_NAMES.reduce((s, n) => s + (stats[n] ?? 0), 0) / 6).toFixed(1);

  function handleDragStart(e, name) {
    setDragging(name);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, name) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOver(name);
  }

  function handleDrop(e, name) {
    e.preventDefault();
    if (dragging && dragging !== name) onSwap(dragging, name);
    setDragging(null);
    setOver(null);
  }

  function handleDragEnd() {
    setDragging(null);
    setOver(null);
  }

  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>Step 1</p>
        <h2>Characteristic Rolls</h2>
        <p className={bStyles.phaseDesc}>Drag rows to reorder, or reroll all characteristics.</p>
      </div>
      <div className={bStyles.phaseBody}>
        <div className={bStyles.statsGrid}>
          {STAT_NAMES.map((name) => (
            <div
              key={name}
              className={`${bStyles.statRollRow} ${dragging === name ? bStyles.statRollRowDragging : ''} ${over === name && dragging !== name ? bStyles.statRollRowOver : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, name)}
              onDragOver={(e) => handleDragOver(e, name)}
              onDrop={(e) => handleDrop(e, name)}
              onDragEnd={handleDragEnd}
            >
              <span className={bStyles.statDragHandle}>⠿</span>
              <span className={bStyles.statRollName}>{name}</span>
              <span className={bStyles.statRollValue}>{stats[name]?.toString(16).toUpperCase()}</span>
              <span className={bStyles.statRollMod}>{modifier(stats[name] ?? 7) >= 0 ? `+${modifier(stats[name] ?? 7)}` : modifier(stats[name] ?? 7)}</span>
            </div>
          ))}
        </div>
        <div className={bStyles.statSummary}>
          <strong>UPP: {upp}</strong>
          <span>Average: {avg}</span>
        </div>
      </div>
      <div className={bStyles.phaseFooter}>
        <button className={styles.secondaryAction} type="button" onClick={onRerollAll}>↺ Reroll All</button>
        <button className={styles.primaryAction} type="button" onClick={onConfirm}>Confirm Stats</button>
      </div>
    </div>
  );
}

// ── Background phase ─────────────────────────────────────────────────────────

function BackgroundPhase({ data, onContinue }) {
  const { homeworld, backgroundSkills } = data;
  const hw = homeworld;
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>Step 2 — Background &amp; Homeworld</p>
        <h2>{hw.name}</h2>
        <p className={bStyles.phaseDesc}>{hw.upp ? `UPP: ${hw.upp}` : ''}{hw.tradeCodes?.length > 0 ? ` · ${hw.tradeCodes.join(', ')}` : ''}</p>
      </div>
      <div className={bStyles.phaseBody}>
        {hw.summary && <p className={bStyles.hwSummary}>{hw.summary}</p>}
        <div className={bStyles.homeworldGrid}>
          {hw.starport && (
            <div className={bStyles.hwStat}>
              <span className={bStyles.hwLabel}>Starport</span>
              <span className={bStyles.hwValue}>Class {hw.starport}</span>
              {hw.starportDesc && <span className={bStyles.hwDesc}>{hw.starportDesc}</span>}
            </div>
          )}
          {hw.techLevel != null && (
            <div className={bStyles.hwStat}>
              <span className={bStyles.hwLabel}>Tech Level</span>
              <span className={bStyles.hwValue}>TL-{hw.techLevel}</span>
            </div>
          )}
          {hw.atmosphere != null && (
            <div className={bStyles.hwStat}>
              <span className={bStyles.hwLabel}>Atmosphere</span>
              <span className={bStyles.hwValue}>{hw.atmosphere}</span>
              {hw.atmosphereDesc && <span className={bStyles.hwDesc}>{hw.atmosphereDesc}</span>}
            </div>
          )}
          {hw.hydrographics != null && (
            <div className={bStyles.hwStat}>
              <span className={bStyles.hwLabel}>Hydrographics</span>
              <span className={bStyles.hwValue}>{hw.hydrographics}</span>
              {hw.hydroDesc && <span className={bStyles.hwDesc}>{hw.hydroDesc}</span>}
            </div>
          )}
          {hw.population != null && (
            <div className={bStyles.hwStat}>
              <span className={bStyles.hwLabel}>Population</span>
              <span className={bStyles.hwValue}>{hw.population}</span>
              {hw.populationDesc && <span className={bStyles.hwDesc}>{hw.populationDesc}</span>}
            </div>
          )}
          {hw.government != null && (
            <div className={bStyles.hwStat}>
              <span className={bStyles.hwLabel}>Government</span>
              <span className={bStyles.hwValue}>{hw.government}</span>
              {hw.governmentDesc && <span className={bStyles.hwDesc}>{hw.governmentDesc}</span>}
            </div>
          )}
          {hw.law != null && (
            <div className={bStyles.hwStat}>
              <span className={bStyles.hwLabel}>Law Level</span>
              <span className={bStyles.hwValue}>{hw.law}</span>
              {hw.lawDesc && <span className={bStyles.hwDesc}>{hw.lawDesc}</span>}
            </div>
          )}
        </div>
        <div className={bStyles.resultBlock}>
          <p className={bStyles.resultLabel}>Background Skills</p>
          <ul className={bStyles.gainedList}>
            {backgroundSkills.map(([skill, value, source]) => (
              <li key={`${skill}-${source}`}><strong>{skill} {value}</strong> <span>from {source}</span></li>
            ))}
          </ul>
        </div>
      </div>
      <div className={bStyles.phaseFooter}>
        <button className={styles.primaryAction} type="button" onClick={onContinue}>Begin Career</button>
      </div>
    </div>
  );
}

// ── Career pick phase ────────────────────────────────────────────────────────

function CareerPickPhase({ phaseData, careers, selectedCareer, selectedSpec, onCareerChange, onSpecChange, onQualify, onContinuePrevious }) {
  const { termIndex, maxTerms, pending, previousCareer, previousSpec, canContinue, mustContinue } = phaseData;
  const [changingCareer, setChangingCareer] = useState(false);
  const careerList = Object.keys(careers).filter((c) => !c.endsWith('Officer')).sort();
  const specs = selectedCareer ? Object.keys(careers[selectedCareer] ?? {}).sort() : [];
  const forcedCareer = pending?.forceCareer;
  const mustDraft = pending?.forceDraft;
  const showPicker = !canContinue || mustDraft || changingCareer;

  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>Term {termIndex + 1} of {maxTerms}</p>
        <h2>Choose a Career</h2>
        <p className={bStyles.phaseDesc}>Select the career and specialty to attempt this term.</p>
      </div>
      <div className={bStyles.phaseBody}>
        {mustContinue && (
          <div className={bStyles.infoBanner}>
            Advancement roll was 12 — you must continue in {previousCareer} / {previousSpec}.
          </div>
        )}
        {mustDraft && (
          <div className={bStyles.warningBanner}>⚠ You must take the Draft this term. A career will be assigned automatically when you qualify.</div>
        )}
        {forcedCareer && !mustDraft && (
          <div className={bStyles.infoBanner}>You may enter {forcedCareer} without a qualification roll.</div>
        )}
        {canContinue && !mustContinue && !mustDraft && (
          <div className={bStyles.continueBanner}>
            <div>
              <strong>Continue as {previousCareer} / {previousSpec}</strong>
              <p>No qualification roll needed — you are already established in this career.</p>
            </div>
            <div className={bStyles.continueActions}>
              <button className={styles.primaryAction} type="button" onClick={onContinuePrevious}>
                Continue →
              </button>
              <button className={styles.secondaryAction} type="button" onClick={() => { setChangingCareer(true); onCareerChange(''); }}>
                Change Career
              </button>
            </div>
          </div>
        )}
        {showPicker && !mustContinue && (
          <div className={bStyles.careerPickGrid}>
            <label className={styles.field}>
              <span>Career</span>
              <select value={selectedCareer} onChange={(e) => onCareerChange(e.target.value)}>
                <option value="">— Select a career —</option>
                {careerList.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span>Specialty</span>
              <select value={selectedSpec} onChange={(e) => onSpecChange(e.target.value)} disabled={!selectedCareer}>
                <option value="">— Select a specialty —</option>
                {specs.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
        )}
        {selectedCareer && selectedSpec && careers[selectedCareer]?.[selectedSpec] && (
          <QualTarget table={careers[selectedCareer][selectedSpec]} career={selectedCareer} />
        )}
      </div>
      <div className={bStyles.phaseFooter}>
        {mustContinue ? (
          <button className={styles.primaryAction} type="button" onClick={onContinuePrevious}>
            Continue in {previousCareer} →
          </button>
        ) : showPicker ? (
          <button
            className={styles.primaryAction}
            type="button"
            disabled={!selectedCareer || !selectedSpec}
            onClick={onQualify}
          >
            Qualify →
          </button>
        ) : null}
      </div>
    </div>
  );
}

function QualTarget({ table, career }) {
  if (!table?.Qual?.[1]) return <p className={bStyles.qualNote}>No qualification roll needed for {career}.</p>;
  return (
    <p className={bStyles.qualNote}>
      Qualification: <strong>{table.Qual[0]} {table.Qual[1]}+</strong>
    </p>
  );
}

// ── Qualify phase ────────────────────────────────────────────────────────────

function QualifyPhase({ data, onContinue, onAutoRoll }) {
  const { career, spec, qualResult, draftResult, basicTrainingGained } = data;
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>Qualification</p>
        <h2>{draftResult ? 'Failed — Draft / Drift' : (qualResult.success ? 'Qualified!' : 'Failed')}</h2>
      </div>
      <div className={bStyles.phaseBody}>
        <RollResult
          label={`${career} Qualification`}
          roll={formatCheckRoll(qualResult)}
          success={qualResult.success}
          detail={qualResult.reason || `${qualResult.stat} ${qualResult.target}+`}
        />
        {draftResult && (
          <div className={bStyles.resultBlock}>
            <p className={bStyles.resultLabel}>{draftResult.drafted ? 'Draft result' : 'Drifter fallback'}</p>
            <p className={bStyles.resultValue}>{draftResult.career} / {draftResult.spec}</p>
          </div>
        )}
        {basicTrainingGained.length > 0 && (
          <div className={bStyles.resultBlock}>
            <p className={bStyles.resultLabel}>Basic Training</p>
            <ul className={bStyles.gainedList}>
              {basicTrainingGained.map((s) => <li key={s}><strong>{s}</strong></li>)}
            </ul>
          </div>
        )}
      </div>
      <div className={bStyles.phaseFooter}>
        <div className={bStyles.choiceBtnRow}>
          <button className={bStyles.choiceBtnAlt} type="button" onClick={onAutoRoll}>
            Auto-Roll Term
          </button>
          <button className={styles.primaryAction} type="button" onClick={onContinue}>Roll Survival →</button>
        </div>
      </div>
    </div>
  );
}

// ── Survival phase ───────────────────────────────────────────────────────────

function SurvivalPhase({ data, onContinue }) {
  const { survResult } = data;
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>Survival</p>
        <h2>{survResult.success ? 'Survived!' : 'Mishap'}</h2>
      </div>
      <div className={bStyles.phaseBody}>
        <RollResult
          label="Survival roll"
          roll={formatCheckRoll(survResult)}
          success={survResult.success}
          detail={`${survResult.stat} ${survResult.target}+`}
        />
      </div>
      <div className={bStyles.phaseFooter}>
        <button className={styles.primaryAction} type="button" onClick={onContinue}>
          {survResult.success ? 'Roll Service Skill →' : 'See Mishap →'}
        </button>
      </div>
    </div>
  );
}

// ── Mishap phase ─────────────────────────────────────────────────────────────

function MishapPhase({ data, onContinue }) {
  const { mishap, continueCareer } = data;
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>Mishap — 1d6 = {mishap.roll}</p>
        <h2>{mishap.label}</h2>
      </div>
      <div className={bStyles.phaseBody}>
        {mishap.text && <p className={bStyles.eventText}>{mishap.text}</p>}
        {mishap.applied?.length > 0 && (
          <div className={bStyles.resultBlock}>
            <p className={bStyles.resultLabel}>Effects Applied</p>
            <ul className={bStyles.gainedList}>
              {mishap.applied.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        )}
        {continueCareer && <p className={bStyles.infoBanner}>You may continue in your career this term.</p>}
      </div>
      <div className={bStyles.phaseFooter}>
        <button className={styles.primaryAction} type="button" onClick={onContinue}>
          {continueCareer ? 'Continue Term →' : 'Muster Out →'}
        </button>
      </div>
    </div>
  );
}

// ── Skill pick phase ─────────────────────────────────────────────────────────

function SkillPickPhase({ data, onPick }) {
  const { tables, context } = data;
  const labelMap = {
    service: 'Service Skill',
    event: 'Event-Granted Skill',
    advancement: 'Advancement Skill',
  };
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>{labelMap[context] ?? 'Skill Roll'}</p>
        <h2>Choose a Skill Table</h2>
        <p className={bStyles.phaseDesc}>Pick which table to roll on.</p>
      </div>
      <div className={bStyles.phaseBody}>
        <div className={bStyles.tablePickGrid}>
          {tables.map((t) => (
            <button key={t} className={bStyles.tablePickBtn} type="button" onClick={() => onPick(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Skill result phase ───────────────────────────────────────────────────────

function SkillResultPhase({ data, onContinue }) {
  const { context, tableName, result } = data;
  const labelMap = { service: 'Service Skill', event: 'Event Skill', advancement: 'Advancement Skill' };
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>{labelMap[context] ?? 'Skill Roll'} — {tableName}</p>
        <h2>
          {result.applied
            ? `${result.applied.name} ${result.applied.value}`
            : `${result.entry?.[0]} ${result.entry?.[1]}`}
        </h2>
        <p className={bStyles.phaseDesc}>1d6 = {result.roll}</p>
      </div>
      <div className={bStyles.phaseBody}>
        {result.applied && (
          <div className={bStyles.resultBlock}>
            <p className={bStyles.resultLabel}>{result.applied.type === 'stat' ? 'Characteristic increased' : 'Skill gained or improved'}</p>
            <p className={bStyles.resultValue}>{result.applied.name} is now <strong>{result.applied.value}</strong></p>
          </div>
        )}
      </div>
      <div className={bStyles.phaseFooter}>
        <button className={styles.primaryAction} type="button" onClick={onContinue}>Continue →</button>
      </div>
    </div>
  );
}

// ── Event choice phase ───────────────────────────────────────────────────────

function EventChoicePhase({ data, benefitRollsAvailable, currentSkills, onChoose }) {
  const { choiceInfo, rawText, kind, eventDice, mishapRoll } = data;
  const rollLabel = kind === 'mishap'
    ? `Mishap — 1d6 = ${mishapRoll}`
    : `Event — 2d6 = ${eventDice?.[0]} + ${eventDice?.[1]} = ${(eventDice?.[0] ?? 0) + (eventDice?.[1] ?? 0)}`;

  if (choiceInfo.type === 'wager_amount') {
    return <WagerAmountChoice choiceInfo={choiceInfo} rawText={rawText} rollLabel={rollLabel} benefitRollsAvailable={benefitRollsAvailable} onChoose={onChoose} />;
  }
  if (choiceInfo.type === 'wager_optional') {
    return <WagerOptionalChoice rawText={rawText} rollLabel={rollLabel} onChoose={onChoose} />;
  }
  if (choiceInfo.type === 'either_adv') {
    return <EitherAdvChoice choiceInfo={choiceInfo} rawText={rawText} rollLabel={rollLabel} onChoose={onChoose} />;
  }
  if (choiceInfo.type === 'any_skill_increase') {
    return <AnySkillIncreaseChoice rawText={rawText} rollLabel={rollLabel} currentSkills={currentSkills} onChoose={onChoose} />;
  }
  if (choiceInfo.type === 'gain_one_of') {
    return <GainOneOfChoice choiceInfo={choiceInfo} rawText={rawText} rollLabel={rollLabel} onChoose={onChoose} />;
  }
  if (choiceInfo.type === 'accept_refuse') {
    return <AcceptRefuseChoice rawText={rawText} rollLabel={rollLabel} onChoose={onChoose} />;
  }
  return null;
}

function WagerAmountChoice({ choiceInfo, rawText, rollLabel, benefitRollsAvailable, onChoose }) {
  const { skills } = choiceInfo;
  const [wagerAmount, setWagerAmount] = useState(0);
  const [wagerSkill, setWagerSkill] = useState(skills[0]);
  const max = Math.max(0, benefitRollsAvailable);
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>{rollLabel}</p>
        <h2>Gambling Opportunity</h2>
      </div>
      <div className={bStyles.phaseBody}>
        {rawText && <p className={bStyles.eventText}>{rawText}</p>}
        <div className={bStyles.choiceSection}>
          {skills.length > 1 && (
            <div className={bStyles.choiceField}>
              <p className={bStyles.choiceLabel}>Which skill do you use?</p>
              <div className={bStyles.choiceBtnRow}>
                {skills.map((s) => (
                  <button key={s} type="button"
                    className={wagerSkill === s ? bStyles.choiceBtnActive : bStyles.choiceBtn}
                    onClick={() => setWagerSkill(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
          <div className={bStyles.choiceField}>
            <p className={bStyles.choiceLabel}>Benefit rolls to wager (0 = decline): <strong>{wagerAmount}</strong></p>
            <input type="range" min={0} max={max} value={wagerAmount}
              onChange={(e) => setWagerAmount(Number(e.target.value))}
              className={bStyles.wagerSlider} />
            <p className={bStyles.choiceHint}>
              {wagerAmount === 0 ? 'No wager — skip the gamble.' : `Win: +${Math.ceil(wagerAmount / 2)} rolls. Lose: −${wagerAmount} rolls.`}
            </p>
          </div>
        </div>
      </div>
      <div className={bStyles.phaseFooter}>
        <div className={bStyles.choiceBtnRow}>
          <button className={bStyles.choiceBtnAlt} type="button"
            onClick={() => onChoose({ wagerAmount: 0, wagerSkill })}>
            Skip Wager
          </button>
          <button className={styles.primaryAction} type="button"
            disabled={wagerAmount === 0}
            onClick={() => onChoose({ wagerAmount, wagerSkill })}>
            {wagerAmount === 0 ? 'Set amount above →' : `Wager ${wagerAmount} Roll${wagerAmount !== 1 ? 's' : ''} →`}
          </button>
        </div>
      </div>
    </div>
  );
}

function WagerOptionalChoice({ rawText, rollLabel, onChoose }) {
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>{rollLabel}</p>
        <h2>Optional Gamble</h2>
      </div>
      <div className={bStyles.phaseBody}>
        {rawText && <p className={bStyles.eventText}>{rawText}</p>}
        <p className={bStyles.choiceHint}>Win: +1 Benefit roll. Lose: −1 Benefit roll.</p>
      </div>
      <div className={bStyles.phaseFooter}>
        <div className={bStyles.choiceBtnRow}>
          <button className={bStyles.choiceBtnAlt} type="button" onClick={() => onChoose({ wagerOptional: false, wagerAmount: 0 })}>
            Decline
          </button>
          <button className={styles.primaryAction} type="button" onClick={() => onChoose({ wagerOptional: true, wagerAmount: 0 })}>
            Take the Gamble →
          </button>
        </div>
      </div>
    </div>
  );
}

function EitherAdvChoice({ choiceInfo, rawText, rollLabel, onChoose }) {
  const skillLabel = choiceInfo.options.join(' / ');
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>{rollLabel}</p>
        <h2>Skill or Advancement Bonus?</h2>
      </div>
      <div className={bStyles.phaseBody}>
        {rawText && <p className={bStyles.eventText}>{rawText}</p>}
      </div>
      <div className={bStyles.phaseFooter}>
        <div className={bStyles.choiceBtnRow}>
          <button className={bStyles.choiceBtnAlt} type="button" onClick={() => onChoose({ eitherPath: 'dm' })}>
            +4 DM to Advancement
          </button>
          <button className={styles.primaryAction} type="button" onClick={() => onChoose({ eitherPath: 'skill' })}>
            Gain {skillLabel} →
          </button>
        </div>
      </div>
    </div>
  );
}

function AnySkillIncreaseChoice({ rawText, rollLabel, currentSkills, onChoose }) {
  const [picked, setPicked] = useState(null);
  const skillNames = Object.keys(currentSkills).sort();
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>{rollLabel}</p>
        <h2>Increase a Skill</h2>
        <p className={bStyles.phaseDesc}>Choose one of your current skills to increase by one level.</p>
      </div>
      <div className={bStyles.phaseBody}>
        {rawText && <p className={bStyles.eventText}>{rawText}</p>}
        <div className={bStyles.choiceSection}>
          <div className={bStyles.tablePickGrid}>
            {skillNames.map((sk) => (
              <button key={sk} type="button"
                className={picked === sk ? bStyles.choiceBtnActive : bStyles.choiceBtn}
                onClick={() => setPicked(sk)}>
                {sk} {currentSkills[sk]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={bStyles.phaseFooter}>
        <button className={styles.primaryAction} type="button"
          disabled={!picked}
          onClick={() => onChoose({ gainOneOf: picked })}>
          Increase {picked ? `${picked} ${currentSkills[picked]} → ${currentSkills[picked] + 1}` : '…'} →
        </button>
      </div>
    </div>
  );
}

function GainOneOfChoice({ choiceInfo, rawText, rollLabel, onChoose }) {
  const [picked, setPicked] = useState(null);
  const { options } = choiceInfo;
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>{rollLabel}</p>
        <h2>Choose a Skill</h2>
      </div>
      <div className={bStyles.phaseBody}>
        {rawText && <p className={bStyles.eventText}>{rawText}</p>}
        <div className={bStyles.choiceSection}>
          <div className={bStyles.tablePickGrid}>
            {options.map((opt) => (
              <button key={opt} type="button"
                className={picked === opt ? bStyles.choiceBtnActive : bStyles.choiceBtn}
                onClick={() => setPicked(opt)}>{opt}</button>
            ))}
          </div>
        </div>
      </div>
      <div className={bStyles.phaseFooter}>
        <button className={styles.primaryAction} type="button"
          disabled={!picked}
          onClick={() => onChoose({ gainOneOf: picked })}>
          Gain {picked ?? '…'} →
        </button>
      </div>
    </div>
  );
}

function AcceptRefuseChoice({ rawText, rollLabel, onChoose }) {
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>{rollLabel}</p>
        <h2>Accept or Refuse?</h2>
      </div>
      <div className={bStyles.phaseBody}>
        {rawText && <p className={bStyles.eventText}>{rawText}</p>}
      </div>
      <div className={bStyles.phaseFooter}>
        <div className={bStyles.choiceBtnRow}>
          <button className={bStyles.choiceBtnAlt} type="button" onClick={() => onChoose({ acceptRefuse: 'refuse' })}>
            Refuse
          </button>
          <button className={styles.primaryAction} type="button" onClick={() => onChoose({ acceptRefuse: 'accept' })}>
            Accept →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Event phase ──────────────────────────────────────────────────────────────

function EventPhase({ data, onContinue }) {
  const { event, eventDice } = data;
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>Event — 2d6 = {eventDice[0]} + {eventDice[1]} = {eventDice[0] + eventDice[1]}</p>
        <h2>{event.label}</h2>
      </div>
      <div className={bStyles.phaseBody}>
        {event.text && <p className={bStyles.eventText}>{event.text}</p>}
        {event.applied?.length > 0 && (
          <div className={bStyles.resultBlock}>
            <p className={bStyles.resultLabel}>Effects</p>
            <ul className={bStyles.gainedList}>
              {event.applied.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        )}
        {event.effect === 'career_skill' && (
          <p className={bStyles.infoBanner}>This event grants an extra skill roll.</p>
        )}
      </div>
      <div className={bStyles.phaseFooter}>
        <button className={styles.primaryAction} type="button" onClick={onContinue}>
          {event.effect === 'career_skill' ? 'Roll Extra Skill →' : 'Roll Advancement →'}
        </button>
      </div>
    </div>
  );
}

// ── Advancement phase ────────────────────────────────────────────────────────

function AdvancementPhase({ data, onContinue }) {
  const { commissionResult, advancement, advanced, rank, mustLeave } = data;
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>Advancement</p>
        <h2>{advanced ? `Promoted to Rank ${rank}` : 'No advancement'}</h2>
      </div>
      <div className={bStyles.phaseBody}>
        {commissionResult && !commissionResult.automatic && (
          <RollResult
            label="Commission check (Soc 8+)"
            roll={formatCheckRoll(commissionResult)}
            success={commissionResult.success}
            detail="Soc 8+"
          />
        )}
        {commissionResult?.automatic && (
          <div className={bStyles.resultBlock}>
            <p className={bStyles.resultLabel}>Automatic Commission</p>
            <p className={bStyles.resultValue}>Commissioned from event</p>
          </div>
        )}
        <RollResult
          label="Advancement roll"
          roll={formatCheckRoll(advancement)}
          success={advanced}
          detail={`${advancement.stat} ${advancement.target}+`}
        />
        {mustLeave && !advanced && (
          <p className={bStyles.warningBanner}>Low roll — you must leave this career next term.</p>
        )}
      </div>
      <div className={bStyles.phaseFooter}>
        <button className={styles.primaryAction} type="button" onClick={onContinue}>
          {advanced ? 'Choose Advancement Skill →' : 'End Term →'}
        </button>
      </div>
    </div>
  );
}

// ── Muster phase ─────────────────────────────────────────────────────────────

function MusterPhase({ data, cashRolls, onPick }) {
  const { rollNum, total, career, highRank, benefitDm, aging, results = [] } = data;
  const cashMaxed = cashRolls >= 3;
  const totalBenefitDm = (highRank ? 1 : 0) + (benefitDm ?? 0);
  const [useDm, setUseDm] = useState(true);

  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>Mustering Out — {career}</p>
        <h2>Benefit Roll {rollNum} of {total}</h2>
        <p className={bStyles.phaseDesc}>
          {cashMaxed && <span>Cash limit reached (3 rolls max). </span>}
        </p>
      </div>
      <div className={bStyles.phaseBody}>
        {results.length > 0 && (
          <div className={bStyles.resultBlock}>
            <p className={bStyles.resultLabel}>Results so far</p>
            <div className={bStyles.musterResults}>
              {results.map((r, i) => (
                <span key={i} className={bStyles.musterResultChip}>{r.name}</span>
              ))}
            </div>
          </div>
        )}
        {totalBenefitDm > 0 && (
          <label className={bStyles.dmToggle}>
            <input type="checkbox" checked={useDm} onChange={(e) => setUseDm(e.target.checked)} />
            <span>Apply +{totalBenefitDm} DM to Benefits table{highRank ? ' (high rank)' : ''}{benefitDm > 0 ? ` (+${benefitDm} from events)` : ''}</span>
          </label>
        )}
        {aging && (
          <div className={bStyles.resultBlock}>
            <p className={bStyles.resultLabel}>Aging this term</p>
            <p className={bStyles.resultValue}>{aging.reductions.length ? `Reduced: ${aging.reductions.join(', ')}` : 'No aging effect'}</p>
          </div>
        )}
      </div>
      <div className={bStyles.phaseFooter}>
        <div className={bStyles.musterChoices}>
          <button className={styles.primaryAction} type="button" disabled={cashMaxed} onClick={() => onPick(true, false)}>
            Cash Table
          </button>
          <button className={styles.primaryAction} type="button" onClick={() => onPick(false, useDm)}>
            Benefits Table{totalBenefitDm > 0 && useDm ? ` (+${totalBenefitDm})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Aging phase ──────────────────────────────────────────────────────────────

function AgingPhase({ data, onContinue }) {
  const { aging, nextTermIndex } = data;
  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>Aging — Term {nextTermIndex}</p>
        <h2>{aging.reductions.length > 0 ? 'Aging Effects' : 'No Aging Effect'}</h2>
        <p className={bStyles.phaseDesc}>2d6 = {aging.natural}, result {aging.roll > 0 ? '+' : ''}{aging.roll}</p>
      </div>
      <div className={bStyles.phaseBody}>
        {aging.reductions.length > 0 && (
          <div className={bStyles.resultBlock}>
            <p className={bStyles.resultLabel}>Reduced characteristics</p>
            <ul className={bStyles.gainedList}>
              {aging.reductions.map((r) => <li key={r}>{r} reduced by 1</li>)}
            </ul>
          </div>
        )}
        {aging.crisis && (
          <div className={bStyles.warningBanner}>
            Aging crisis! Medical costs {aging.crisis.amount.toLocaleString()} Cr.
          </div>
        )}
      </div>
      <div className={bStyles.phaseFooter}>
        <button className={styles.primaryAction} type="button" onClick={onContinue}>Next Term →</button>
      </div>
    </div>
  );
}

// ── Character sheet sidebar ──────────────────────────────────────────────────

function CharSheet({ acc }) {
  if (!acc?.stats) return null;
  const { stats, skills, terms, benefits, credits, options, homeworld } = acc;
  const upp = formatUpp(stats);
  const skillEntries = Object.entries(skills).filter(([, v]) => v >= 0).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className={bStyles.charSheet}>
      <div className={bStyles.csName}>{options.name || 'Traveller'}</div>
      <div className={bStyles.csUpp}>{upp}</div>
      {homeworld && <div className={bStyles.csHomeworld}>{homeworld.name}</div>}

      {skillEntries.length > 0 && (
        <>
          <p className={bStyles.csSectionLabel}>Skills</p>
          <div className={bStyles.csSkillGrid}>
            {skillEntries.map(([skill, value]) => (
              <span key={skill} className={bStyles.csSkill}>{skill} {value}</span>
            ))}
          </div>
        </>
      )}

      {terms.length > 0 && (
        <>
          <p className={bStyles.csSectionLabel}>Career History</p>
          {terms.map((term, i) => (
            <div key={i} className={bStyles.csTermRow}>
              <span className={bStyles.csTermCareer}>
                {term.Career}{term.Rnk ? ` Rank ${term.Rnk}` : ''}
              </span>
              {term.mishap
                ? <span className={bStyles.csMishap}>✗ {term.mishap.label}</span>
                : term.event && <span className={bStyles.csEvent}>{term.event.label}</span>}
            </div>
          ))}
        </>
      )}

      {benefits.length > 0 && (
        <>
          <p className={bStyles.csSectionLabel}>Benefits</p>
          <div className={bStyles.csBenefitList}>
            {benefits.map((b, i) => (
              <span key={i} className={bStyles.csBenefit}>{b.name}</span>
            ))}
          </div>
        </>
      )}

      {credits > 0 && (
        <div className={bStyles.csCredits}>{credits.toLocaleString()} Cr</div>
      )}
    </div>
  );
}

// ── Equipment phase ──────────────────────────────────────────────────────────

function EquipmentPhase({ data, onConfirm, onReroll, onSkip }) {
  const { suggestions, weapon, credits } = data;
  const [checked, setChecked] = useState(() => {
    const initial = new Set();
    suggestions.forEach((_, i) => initial.add(`kit-${i}`));
    if (weapon) initial.add('weapon');
    return initial;
  });

  function toggle(key) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const selectedItems = [
    ...suggestions.filter((_, i) => checked.has(`kit-${i}`)),
    ...(weapon && checked.has('weapon') ? [weapon] : []),
  ];
  const totalCost = selectedItems.reduce((s, item) => s + (item.cost ?? 0), 0);
  const remaining = credits - totalCost;

  function handleConfirm() {
    onConfirm(selectedItems);
  }

  return (
    <div className={bStyles.phaseCard}>
      <div className={bStyles.phaseHeader}>
        <p className={styles.kicker}>Final Step</p>
        <h2>Equipment</h2>
        <p className={bStyles.phaseDesc}>Suggested purchases based on your career. Uncheck anything you don't want.</p>
      </div>
      <div className={bStyles.phaseBody}>
        <div className={bStyles.equipmentGrid}>
          {suggestions.map((item, i) => (
            <div
              key={i}
              className={`${bStyles.equipmentItem} ${checked.has(`kit-${i}`) ? bStyles.equipmentItemChecked : ''}`}
              onClick={() => toggle(`kit-${i}`)}
              role="checkbox"
              aria-checked={checked.has(`kit-${i}`)}
              tabIndex={0}
              onKeyDown={(e) => e.key === ' ' && toggle(`kit-${i}`)}
            >
              <input type="checkbox" checked={checked.has(`kit-${i}`)} onChange={() => toggle(`kit-${i}`)} tabIndex={-1} />
              <div>
                <div className={bStyles.equipmentItemName}>{item.name}</div>
                {item.tags?.length > 0 && <div className={bStyles.equipmentItemTags}>{item.tags.join(', ')}</div>}
              </div>
              <div className={bStyles.equipmentItemCost}>{(item.cost ?? 0).toLocaleString()} Cr</div>
            </div>
          ))}
          {weapon && (
            <div
              className={`${bStyles.equipmentItem} ${checked.has('weapon') ? bStyles.equipmentItemChecked : ''}`}
              onClick={() => toggle('weapon')}
              role="checkbox"
              aria-checked={checked.has('weapon')}
              tabIndex={0}
              onKeyDown={(e) => e.key === ' ' && toggle('weapon')}
            >
              <input type="checkbox" checked={checked.has('weapon')} onChange={() => toggle('weapon')} tabIndex={-1} />
              <div>
                <div className={bStyles.equipmentItemName}>{weapon.name}</div>
                {weapon.tags?.length > 0 && <div className={bStyles.equipmentItemTags}>{weapon.tags.join(', ')}</div>}
              </div>
              <div className={bStyles.equipmentItemCost}>{(weapon.cost ?? 0).toLocaleString()} Cr</div>
            </div>
          )}
        </div>
        <div className={bStyles.equipmentCredits}>
          <span className={bStyles.equipmentCreditsLabel}>Credits remaining after purchase</span>
          <span className={bStyles.equipmentCreditsValue}>{remaining.toLocaleString()} Cr</span>
        </div>
      </div>
      <div className={bStyles.phaseFooter}>
        <div className={bStyles.equipmentActions}>
          <button className={styles.secondaryAction} type="button" onClick={onReroll}>↺ Reroll Suggestions</button>
          <button className={styles.secondaryAction} type="button" onClick={onSkip}>Skip</button>
          <button className={styles.primaryAction} type="button" onClick={handleConfirm}>
            Purchase Selected
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function RollResult({ label, roll, success, detail }) {
  return (
    <div className={bStyles.rollResult}>
      <div className={bStyles.rollResultHeader}>
        <span className={bStyles.rollResultLabel}>{label}</span>
        <code className={bStyles.rollResultRoll}>{roll}</code>
        <span className={`${bStyles.rollResultOutcome} ${success ? bStyles.rollSuccess : bStyles.rollFailure}`}>
          {success ? '✓ Success' : '✗ Failed'}
        </span>
      </div>
      {detail && <p className={bStyles.rollResultDetail}>{detail}</p>}
    </div>
  );
}
