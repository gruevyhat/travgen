import { describe, expect, it } from 'vitest';
import coreRules from '../data/coreRules.json';
import { generateCharacter } from './character.js';

const STRESS_SEEDS = Array.from({ length: 32 }, (_, index) => `stress-${index.toString().padStart(2, '0')}`);
const UNRESOLVED_RULE_TEXT = /Life Event\. Roll|Roll on the Life Events table|page 34|during character creation|\(any\)/i;
const UNRESOLVED_SKILL_NAME = /^(Any\b|Any Skill\b|Any Art\b)|\(any\)/i;

const STRESS_CASES = [
  {
    label: 'standard-short',
    options: { campaignMode: 'standard', terms: 1, expansions: {} },
  },
  {
    label: 'standard-long',
    options: { campaignMode: 'standard', terms: 8, expansions: {} },
  },
  {
    label: 'heroic-psion',
    options: { campaignMode: 'standard', method: 'heroic', psi: 'traditional', terms: 6, expansions: { psion: true } },
  },
  {
    label: 'low-edu-background',
    options: { campaignMode: 'standard', upp: '222202', terms: 4, expansions: {} },
  },
  {
    label: 'high-edu-background',
    options: { campaignMode: 'standard', upp: '7777f7', terms: 4, expansions: {} },
  },
  {
    label: 'all-supplements',
    options: {
      campaignMode: 'standard',
      terms: 8,
      expansions: {
        psion: true,
        dilettante: true,
        agent: true,
        scoundrel: true,
        mercenary: true,
        highGuard: true,
        scoutBook: true,
        merchantPrince: true,
      },
    },
  },
  {
    label: 'chthonian-random',
    options: { campaignMode: 'chthonian', terms: 6, expansions: { chthonianStars: true } },
  },
  {
    label: 'chthonian-mars',
    options: { campaignMode: 'chthonian', homeworld: 'Mars', terms: 6, expansions: { chthonianStars: true } },
  },
  {
    label: 'planned-military',
    options: {
      campaignMode: 'standard',
      terms: 6,
      expansions: { mercenary: true, highGuard: true },
      careerPlan: Array.from({ length: 6 }, () => ({ career: 'Marine', spec: 'Star Marine' })),
    },
  },
  {
    label: 'planned-scholar',
    options: {
      campaignMode: 'standard',
      terms: 6,
      expansions: {},
      careerPlan: Array.from({ length: 6 }, () => ({ career: 'Scholar', spec: 'Scientist' })),
    },
  },
];

function context(label, seed) {
  return `${label} seed=${seed}`;
}

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

function stressCharacters() {
  return STRESS_CASES.flatMap((testCase) => STRESS_SEEDS.map((seed) => ({
    label: testCase.label,
    seed,
    options: { ...testCase.options, seed: `${testCase.label}-${seed}` },
  })));
}

function backgroundAwardLines(character) {
  const firstTerm = character.history.indexOf('TERM 0');
  return character.history
    .slice(0, firstTerm)
    .filter((line) => line.includes(' Learned '));
}

function collectStrings(value, into = []) {
  if (value === null || value === undefined) return into;
  if (typeof value === 'string') {
    into.push(value);
    return into;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, into);
    return into;
  }
  if (typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, into);
  }
  return into;
}

function weaponRule(name) {
  return coreRules.weaponCombat[name] ?? null;
}

function skillBase(skill) {
  return skill?.split(' (')[0] ?? null;
}

function armorSkillBase(name) {
  const item = coreRules.equipment.find((entry) => entry.name === name);
  if (item?.protection === undefined) return null;
  return item.notes?.match(/Requires\s+(.+?)\s+\d+/i)?.[1] ?? 'Armor';
}

function expectedCombatSkill(character, weapon) {
  const rule = weaponRule(weapon);
  if (!rule) return null;
  const primary = rule.skill;
  const base = skillBase(primary);
  if (Object.hasOwn(character.skills, primary)) return { skill: primary, level: character.skills[primary] };
  if (Object.hasOwn(character.skills, base)) return { skill: base, level: character.skills[base] };
  return { skill: primary, level: null };
}

function assertNoUnresolvedRuleText(character, testContext) {
  const offenders = collectStrings({
    bio: character.bio,
    history: character.history,
    careerHistory: character.careerHistory,
    terms: character.terms,
    events: character.events,
    mishaps: character.mishaps,
    lifeEvents: character.lifeEvents,
    unresolved: character.unresolved,
  }).filter((text) => UNRESOLVED_RULE_TEXT.test(text));

  assertInvariant(offenders.length === 0, `${testContext}: unresolved rule text: ${offenders.slice(0, 5).join(' | ')}`);
}

function assertBackgroundSkills(character, testContext) {
  const awards = backgroundAwardLines(character);
  assertInvariant(awards.length === character.backgroundSkills.length, `${testContext}: background transcript count mismatch`);
  assertInvariant(character.backgroundSkills.length >= 1 && character.backgroundSkills.length <= 5, `${testContext}: background skill count out of range`);

  for (const skill of character.backgroundSkills) {
    assertInvariant(Object.hasOwn(character.skills, skill), `${testContext}: missing background skill in skills table: ${skill}`);
    assertInvariant(character.skills[skill] >= 0, `${testContext}: invalid background skill level for ${skill}`);
  }
}

function assertTermStructure(character, expectedTerms, testContext) {
  assertInvariant(character.terms.length === expectedTerms, `${testContext}: wrong term count`);
  assertInvariant(character.careerHistory.length === expectedTerms, `${testContext}: wrong career history count`);
  assertInvariant(character.events.length + character.mishaps.length === expectedTerms, `${testContext}: missing event or mishap`);

  for (const [index, term] of character.terms.entries()) {
    const stages = term.steps.map((step) => step.stage);
    assertInvariant(stages.includes('Qualification'), `${testContext}: term ${index + 1} missing qualification`);
    assertInvariant(stages.includes('Survival'), `${testContext}: term ${index + 1} missing survival`);
    assertInvariant(stages.includes('Aging'), `${testContext}: term ${index + 1} missing aging`);
    assertInvariant(stages.some((stage) => stage === 'Event' || stage === 'Mishap'), `${testContext}: term ${index + 1} missing incident`);

    for (const step of term.steps) {
      assertInvariant(step.result, `${testContext}: term ${index + 1} ${step.stage} missing result: ${JSON.stringify(step)}`);
      if (step.stage === 'Event' || step.stage === 'Mishap') {
        assertInvariant(step.detail?.includes('Text:'), `${testContext}: term ${index + 1} ${step.stage} missing text`);
        assertInvariant(step.detail?.includes('Effect:'), `${testContext}: term ${index + 1} ${step.stage} missing effect`);
      }
    }

    const historyRow = character.careerHistory[index];
    assertInvariant(historyRow.career === term.Career, `${testContext}: term ${index + 1} career history mismatch`);
    assertInvariant(historyRow.spec === term.Spec, `${testContext}: term ${index + 1} specialty history mismatch`);
  }
}

function assertLifeEvents(character, testContext) {
  for (const event of character.lifeEvents) {
    assertInvariant(event.term >= 1 && event.term <= character.terms.length, `${testContext}: invalid life event term`);
    assertInvariant(event.career && event.specialty, `${testContext}: life event missing career context`);
    assertInvariant(event.label && !UNRESOLVED_RULE_TEXT.test(event.label), `${testContext}: unresolved life event label`);
    assertInvariant(character.careerHistory[event.term - 1].lifeEvents.includes(event), `${testContext}: life event missing from career history`);
    assertInvariant(character.terms[event.term - 1].lifeEvents.includes(event), `${testContext}: life event missing from term record`);
  }
}

function assertCombatAndPurchases(character, testContext) {
  for (const combat of character.combat) {
    assertInvariant(character.equipment.some((item) => item.name === combat.weapon), `${testContext}: combat weapon not owned: ${combat.weapon}`);

    const expected = expectedCombatSkill(character, combat.weapon);
    assertInvariant(expected, `${testContext}: combat table includes non-weapon: ${combat.weapon}`);
    assertInvariant(combat.skill === expected.skill, `${testContext}: ${combat.weapon} uses ${combat.skill}, expected ${expected.skill}`);
    assertInvariant(combat.skillLevel === expected.level, `${testContext}: ${combat.weapon} skill level ${combat.skillLevel}, expected ${expected.level}`);
  }

  const purchasedWeaponBases = character.equipment
    .filter((item) => item.source === 'purchased' && weaponRule(item.name))
    .map((item) => skillBase(weaponRule(item.name).skill));
  assertInvariant(new Set(purchasedWeaponBases).size === purchasedWeaponBases.length, `${testContext}: duplicate purchased weapon skill bases`);

  const purchasedArmorBases = character.equipment
    .filter((item) => item.source === 'purchased')
    .map((item) => armorSkillBase(item.name))
    .filter(Boolean);
  assertInvariant(new Set(purchasedArmorBases).size === purchasedArmorBases.length, `${testContext}: duplicate purchased armor skill bases`);
}

function assertEquipmentAndBenefits(character, testContext) {
  assertInvariant(character.equipment.every((item) => item.name && item.source), `${testContext}: equipment missing name or source`);
  assertInvariant(character.benefits.every((benefit) => benefit.name !== 'Combat Implant'), `${testContext}: unresolved combat implant benefit`);
  assertInvariant(character.benefits.every((benefit) => benefit.name !== 'Scientific Equipment'), `${testContext}: unresolved scientific equipment benefit`);

  for (const benefit of character.benefits.filter((item) => item.type === 'equipment')) {
    assertInvariant(benefit.equipment?.name, `${testContext}: equipment benefit not linked to concrete item: ${JSON.stringify(benefit)}`);
    assertInvariant(character.equipment.some((item) => item.name === benefit.equipment.name), `${testContext}: benefit equipment missing from equipment list: ${benefit.equipment.name}`);
  }
}

function assertSkillTable(character, testContext) {
  const skillNames = Object.keys(character.skills);
  assertInvariant(skillNames.every((skill) => !UNRESOLVED_SKILL_NAME.test(skill)), `${testContext}: unresolved skill entry`);
  assertInvariant(skillNames.every((skill) => Number.isInteger(character.skills[skill]) && character.skills[skill] >= 0), `${testContext}: invalid skill level`);
}

describe('character generator stress suite', () => {
  it('generates broad deterministic samples without defects or unresolved rules', () => {
    for (const sample of stressCharacters()) {
      const testContext = context(sample.label, sample.seed);
      let first;
      let second;
      try {
        first = generateCharacter(sample.options);
        second = generateCharacter(sample.options);
      } catch (error) {
        throw new Error(`${testContext}: generation threw ${error.stack ?? error.message}`);
      }

      expect(first, `${testContext}: deterministic generation`).toEqual(second);
      assertInvariant(first.unresolved.length === 0, `${testContext}: unresolved actions recorded: ${first.unresolved.join(', ')}`);
      assertNoUnresolvedRuleText(first, testContext);
      assertBackgroundSkills(first, testContext);
      assertTermStructure(first, sample.options.terms, testContext);
      assertLifeEvents(first, testContext);
      assertCombatAndPurchases(first, testContext);
      assertEquipmentAndBenefits(first, testContext);
      assertSkillTable(first, testContext);
      assertInvariant(first.age === 18 + (sample.options.terms * 4), `${testContext}: wrong final age`);
      assertInvariant(first.pension >= 0, `${testContext}: negative pension`);
      assertInvariant(first.totalDebt >= 0, `${testContext}: negative debt`);
    }
  });
});
