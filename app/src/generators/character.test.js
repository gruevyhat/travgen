import { describe, expect, it } from 'vitest';
import coreRules from '../data/coreRules.json';
import { buildCombatTable, choiceBenefit, formatCharacterText, generateCharacter } from './character.js';

function backgroundAwards(character) {
  const end = character.history.indexOf('TERM 0');
  return character.history
    .slice(0, end)
    .filter((line) => line.includes(' Learned '))
    .map((line) => {
      const match = line.match(/ Learned (.+) 0 from (Homeworld|Education)\./);
      return { skill: match?.[1], source: match?.[2], line };
    });
}

function weaponSkillBase(name) {
  return coreRules.weaponCombat[name]?.skill.split(' (')[0] ?? null;
}

function armorSkillBase(name) {
  const item = coreRules.equipment.find((entry) => entry.name === name);
  if (item?.protection === undefined) return null;
  return item.notes?.match(/Requires\s+(.+?)\s+\d+/i)?.[1] ?? 'Armor';
}

describe('character generator', () => {
  it('generates reproducible characters within the web app', () => {
    const options = { seed: 'cd515598', terms: 3, expansions: { chthonianStars: true, psion: true } };

    expect(generateCharacter(options)).toEqual(generateCharacter(options));
  });

  it('respects fixed demographic inputs and term count', () => {
    const character = generateCharacter({
      seed: '1234abcd',
      name: 'Test Name',
      gender: 'female',
      ethnicity: 'american',
      homeworld: 'Mars',
      terms: 4,
    });

    expect(character.name).toBe('Test Name');
    expect(character.gender).toBe('female');
    expect(character.homeworld.name).toBe('Mars');
    expect(character.terms).toHaveLength(4);
  });

  it('returns a structured core character result with no unresolved rules', () => {
    const character = generateCharacter({ seed: 'core1234', terms: 4, campaignMode: 'standard' });

    expect(character.identity.name).toBe(character.name);
    expect(character.homeworld.tradeCodes.length).toBeGreaterThan(0);
    expect(character.homeworld.backgroundSkills.length).toBeGreaterThan(0);
    expect(character.resume.roles).toHaveLength(4);
    expect(character.events.length + character.mishaps.length).toBe(4);
    expect(character.events.every((event) => event.term && event.label)).toBe(true);
    expect(character.mishaps.every((mishap) => mishap.term && mishap.label)).toBe(true);
    expect(character.bio).toContain('trained in');
    expect(character.bio).toContain('Professionally,');
    expect(character.bio).not.toMatch(/\b(event|mishap)\s+\d+:/i);
    expect(character.equipment.every((item) => item.source)).toBe(true);
    expect(character.combat.every((item) => item.weapon && item.damage && Number.isFinite(item.attackDm))).toBe(true);
    expect(character.unresolved).toEqual([]);
  });

  it('adds psionic powers when psionics are enabled', () => {
    const character = generateCharacter({ seed: 'psi1234', terms: 3, psi: 'traditional', expansions: { psion: true } });

    expect(character.psionics).toBeTruthy();
    expect(character.psionics.rating).toBeGreaterThanOrEqual(0);
    expect(character.psionics.powers.length).toBeGreaterThan(0);
  });

  it('builds a structured personality profile', () => {
    const character = generateCharacter({ seed: 'person1234', personality: true });

    expect(character.personality.type).toMatch(/^[IE][SN][FT][JP]$/);
    expect(character.personality.summary).toContain(character.personality.drive);
  });

  it('keeps sampled character bios free of rules-log phrasing', () => {
    const bios = Array.from({ length: 100 }, (_, index) => generateCharacter({
      seed: `bio${index}`,
      terms: 6,
      campaignMode: 'standard',
      personality: true,
      expansions: { psion: true },
    }).bio);

    for (const bio of bios) {
      expect(bio).not.toMatch(/\b(event|mishap)\s+\d+:/i);
      expect(bio).not.toMatch(/during character creation|Life events:|Career path:/i);
      expect(bio).not.toMatch(/\bYou\b|\byou\b/);
    }
  });

  it('uses natural given-name order in biography prose', () => {
    const character = generateCharacter({ seed: 'namebio1234', name: 'Zumwald, Dolf' });

    expect(character.name).toBe('Zumwald, Dolf');
    expect(character.bio).toContain('Dolf Zumwald comes from');
    expect(character.bio).not.toContain('Zumwald, Dolf comes from');
  });

  it('uses last name or pronouns after the first biography sentence', () => {
    const character = generateCharacter({ seed: 'pronoun1234', name: 'Zumwald, Dolf', gender: 'male', terms: 5 });
    const [, ...rest] = character.bio.split(/(?<=\.)\s+/);

    expect(rest.join(' ')).not.toContain('Dolf Zumwald');
    expect(character.bio).toContain('Zumwald served');
  });

  it('supports non-binary character generation and pronouns', () => {
    const character = generateCharacter({ seed: 'enby1234', name: 'River Test', gender: 'non-binary', terms: 3 });

    expect(character.gender).toBe('non-binary');
    expect(character.bio).toMatch(/\bThey trained\b|\bTheir\b|\bthey\b/);
  });

  it('records a build transcript for each career term', () => {
    const character = generateCharacter({ seed: 'transcript1234', terms: 4, campaignMode: 'standard' });

    expect(character.terms.every((term) => term.steps?.length)).toBe(true);
    expect(character.terms[0].steps.map((step) => step.stage)).toContain('Qualification');
    expect(character.terms[0].steps.map((step) => step.stage)).toContain('Survival');
    expect(character.terms.some((term) => term.steps.some((step) => /2d6|1d6|automatic|all service skills/.test(step.roll)))).toBe(true);
    expect(character.terms.every((term) => term.steps.every((step) => step.result))).toBe(true);
  });

  it('includes event and mishap text and effects in the build transcript', () => {
    const characters = Array.from({ length: 80 }, (_, index) => generateCharacter({
      seed: `incident-text${index}`,
      terms: 4,
      campaignMode: 'standard',
      expansions: {},
    }));
    const incidentSteps = characters.flatMap((character) => character.terms
      .flatMap((term) => term.steps.filter((step) => ['Event', 'Mishap'].includes(step.stage))));

    expect(incidentSteps.length).toBeGreaterThan(0);
    expect(incidentSteps.every((step) => step.detail.includes('Text:'))).toBe(true);
    expect(incidentSteps.every((step) => step.detail.includes('Effect:'))).toBe(true);
    expect(incidentSteps.some((step) => step.detail.includes('Applied:'))).toBe(true);
  });

  it('records mishaps in career history and build transcript steps', () => {
    const character = Array.from({ length: 160 }, (_, index) => generateCharacter({
      seed: `history-mishap${index}`,
      terms: 6,
      campaignMode: 'standard',
      expansions: {},
    })).find((generated) => generated.mishaps.length);

    expect(character).toBeTruthy();
    for (const mishap of character.mishaps) {
      const historyRow = character.careerHistory[mishap.term - 1];
      const term = character.terms[mishap.term - 1];
      expect(historyRow.event).toBe(mishap.label);
      expect(historyRow.incidentType).toBe('Mishap');
      expect(historyRow.incidentRoll).toBe(mishap.roll);
      expect(term.steps.some((step) => step.stage === 'Mishap' && step.result === mishap.label)).toBe(true);
    }
  });

  it('makes transcript incidents verbose about applied effects and benefits', () => {
    const character = Array.from({ length: 120 }, (_, index) => generateCharacter({
      seed: `verbose${index}`,
      terms: 6,
      campaignMode: 'standard',
      expansions: {},
    })).find((generated) => generated.terms.some((term) => term.steps.some((step) => /Applied:|Skill added or improved|Characteristic increase/.test(step.detail ?? ''))));

    expect(character).toBeTruthy();
    expect(character.terms.some((term) => term.MusteringOut?.details?.some((detail) => detail.result))).toBe(true);
  });

  it('resolves generic specialty skill awards to concrete specialties', () => {
    const character = Array.from({ length: 160 }, (_, index) => generateCharacter({
      seed: `artist${index}`,
      terms: 8,
      campaignMode: 'standard',
      careerPlan: Array.from({ length: 8 }, () => ({ career: 'Entertainer', spec: 'Artist' })),
      expansions: {},
    })).find((generated) => Object.keys(generated.skills).some((skill) => /^Art \(/.test(skill)));

    expect(character).toBeTruthy();
    expect(Object.keys(character.skills).some((skill) => /^Any\b|\(any\)|Any Art'?/.test(skill))).toBe(false);
    expect(Object.keys(character.skills).some((skill) => /^Art \(/.test(skill))).toBe(true);
  });

  it('builds a combat table for owned weapons', () => {
    const withWeapon = Array.from({ length: 30 }, (_, index) => generateCharacter({
      seed: `weapons${index}`,
      terms: 6,
      campaignMode: 'standard',
      expansions: {},
    })).find((character) => character.combat.length);

    expect(withWeapon).toBeTruthy();
    expect(withWeapon.combat.every((item) => withWeapon.equipment.some((equipment) => equipment.name === item.weapon))).toBe(true);
  });

  it('uses exact weapon specialty before falling back to base combat skill', () => {
    const combat = buildCombatTable(
      [
        { name: 'Rifle', source: 'test' },
        { name: 'Shotgun', source: 'test' },
        { name: 'ACR', source: 'test' },
        { name: 'Revolver', source: 'test' },
      ],
      {
        'Gun Combat': 0,
        'Gun Combat (shotgun)': 1,
        'Gun Combat (energy)': 2,
      },
      { Dex: 7 },
    );

    expect(combat.find((item) => item.weapon === 'Rifle').skill).toBe('Gun Combat');
    expect(combat.find((item) => item.weapon === 'Rifle').skillLevel).toBe(0);
    expect(combat.find((item) => item.weapon === 'Shotgun').skill).toBe('Gun Combat (shotgun)');
    expect(combat.find((item) => item.weapon === 'Shotgun').skillLevel).toBe(1);
    expect(combat.find((item) => item.weapon === 'ACR').skill).toBe('Gun Combat');
    expect(combat.find((item) => item.weapon === 'ACR').skillLevel).toBe(0);
    expect(combat.find((item) => item.weapon === 'Revolver').skill).toBe('Gun Combat');
    expect(combat.find((item) => item.weapon === 'Revolver').skillLevel).toBe(0);
  });

  it('does not use an unrelated specialty for a weapon when no base skill exists', () => {
    const combat = buildCombatTable(
      [
        { name: 'ACR', source: 'test' },
        { name: 'Revolver', source: 'test' },
      ],
      { 'Gun Combat (energy)': 1 },
      { Dex: 5 },
    );

    expect(combat.find((item) => item.weapon === 'ACR').skill).toBe('Gun Combat (slug)');
    expect(combat.find((item) => item.weapon === 'ACR').skillLevel).toBeNull();
    expect(combat.find((item) => item.weapon === 'Revolver').skill).toBe('Gun Combat (slug)');
    expect(combat.find((item) => item.weapon === 'Revolver').skillLevel).toBeNull();
  });

  it('does not auto-buy more than one weapon per combat skill', () => {
    const characters = Array.from({ length: 80 }, (_, index) => generateCharacter({
      seed: `kit-weapons${index}`,
      terms: 6,
      campaignMode: 'standard',
      expansions: {},
    }));

    for (const character of characters) {
      const purchasedWeapons = character.equipment.filter((item) => item.source === 'purchased' && character.combat.some((weapon) => weapon.weapon === item.name));
      const purchasedSkillBases = purchasedWeapons.map((item) => weaponSkillBase(item.name)).filter(Boolean);
      expect(new Set(purchasedSkillBases).size).toBe(purchasedSkillBases.length);
    }
  });

  it('does not auto-buy more than one armor item per armor skill', () => {
    const characters = Array.from({ length: 80 }, (_, index) => generateCharacter({
      seed: `kit-armor${index}`,
      terms: 6,
      campaignMode: 'standard',
      expansions: {},
    }));

    for (const character of characters) {
      const purchasedArmor = character.equipment.filter((item) => item.source === 'purchased' && armorSkillBase(item.name));
      const armorSkillBases = purchasedArmor.map((item) => armorSkillBase(item.name)).filter(Boolean);
      expect(new Set(armorSkillBases).size).toBe(armorSkillBases.length);
    }
  });

  it('randomly resolves combat implant benefits to concrete implants', () => {
    const skills = { Admin: 0, 'Gun Combat': 1 };
    const implants = [0, 0.3, 0.55, 0.8].map((roll) => {
      const stats = { Str: 7, Dex: 7, End: 7, Int: 7 };
      return choiceBenefit(() => roll, stats, skills, 'Agent', 5);
    });

    expect(implants.map((implant) => implant.name)).toEqual([
      'Skill Augmentation (Admin)',
      'Wafer Jack',
      'Subdermal Armour',
      'Characteristic Augmentation (Int +1)',
    ]);
    expect(implants.every((implant) => implant.type === 'equipment')).toBe(true);
    expect(implants.every((implant) => implant.equipment.name === implant.name)).toBe(true);
    expect(implants[2].equipment.protection).toBe(1);
  });

  it('applies characteristic augmentation from combat implant benefits', () => {
    const stats = { Str: 7, Dex: 7, End: 7, Int: 7 };
    const benefit = choiceBenefit(() => 0.75, stats, { Admin: 0 }, 'Agent', 5);

    expect(benefit.name).toBe('Characteristic Augmentation (Int +1)');
    expect(stats.Int).toBe(8);
  });

  it('randomly resolves scientific equipment benefits to concrete equipment', () => {
    const equipment = [0, 0.17, 0.34, 0.5, 0.67, 0.84].map((roll) => choiceBenefit(
      () => roll,
      { Str: 7, Dex: 7, End: 7, Int: 7 },
      { Admin: 0 },
      'Agent',
      1,
    ));

    expect(equipment.map((item) => item.name)).toEqual([
      'Electromagnetic Probe',
      'Densitometer',
      'Bioscanner',
      'NAS',
      'Geiger Counter',
      'Probe Drone',
    ]);
    expect(equipment.every((item) => item.type === 'equipment')).toBe(true);
    expect(equipment.every((item) => item.equipment.name === item.name)).toBe(true);
    expect(equipment.find((item) => item.name === 'Bioscanner').equipment.mass).toBe(3.5);
  });

  it('applies core career timing for aging and mustering out', () => {
    const character = generateCharacter({ seed: 'timing123', terms: 6, campaignMode: 'standard', expansions: {} });
    const musteringRolls = character.terms.reduce((total, term) => total + (term.MusteringOut?.rolls ?? 0), 0);
    const cashRolls = character.benefits.filter((benefit) => benefit.type === 'cash').length;

    expect(character.terms.slice(0, 3).every((term) => term.Aging === null)).toBe(true);
    expect(character.terms.slice(3).every((term) => term.Aging)).toBe(true);
    expect(character.benefits).toHaveLength(musteringRolls);
    expect(cashRolls).toBeLessThanOrEqual(3);
  });

  it('rolls and records injuries required by events and mishaps', () => {
    const injured = Array.from({ length: 120 }, (_, index) => generateCharacter({
      seed: `injury${index}`,
      terms: 6,
      campaignMode: 'standard',
      expansions: {},
    })).find((character) => [...character.events, ...character.mishaps, ...character.lifeEvents]
      .some((item) => item.nested?.some((nested) => nested.source === 'injury' || nested.effect?.includes('injury'))));

    expect(injured).toBeTruthy();
    expect(injured.injuries.length).toBeGreaterThan(0);
    expect(injured.injuries.every((injury) => injury.roll && injury.label && Array.isArray(injury.reductions))).toBe(true);
  });

  it('carries random table effects into character state', () => {
    const affected = Array.from({ length: 120 }, (_, index) => generateCharacter({
      seed: `effects${index}`,
      terms: 6,
      campaignMode: 'standard',
      expansions: {},
    })).find((character) => [...character.events, ...character.mishaps, ...character.lifeEvents]
      .some((item) => item.checks?.length || item.nested?.length || item.advancementDm || item.automaticPromotion));

    expect(affected).toBeTruthy();
    expect(
      affected.contacts.length
      + affected.enemies.length
      + affected.injuries.length
      + affected.awards.length
      + affected.lifeEvents.length,
    ).toBeGreaterThan(0);
  });

  it('records rolled life events on the matching career history term', () => {
    const character = Array.from({ length: 120 }, (_, index) => generateCharacter({
      seed: `life-history${index}`,
      terms: 6,
      campaignMode: 'standard',
      expansions: {},
    })).find((generated) => generated.lifeEvents.length);

    expect(character).toBeTruthy();
    expect(character.lifeEvents.every((event) => event.term && event.career && event.specialty)).toBe(true);
    expect(character.lifeEvents.every((event) => character.careerHistory[event.term - 1].lifeEvents.includes(event))).toBe(true);
  });

  it('replaces life event table instructions with resolved life event results', () => {
    const character = Array.from({ length: 160 }, (_, index) => generateCharacter({
      seed: `resolved-life${index}`,
      terms: 6,
      campaignMode: 'standard',
      expansions: {},
    })).find((generated) => generated.lifeEvents.length);

    expect(character).toBeTruthy();
    const lifeEventTerms = character.terms.filter((term) => term.lifeEvents?.length);
    expect(lifeEventTerms.length).toBeGreaterThan(0);
    for (const term of lifeEventTerms) {
      const incident = term.event ?? term.mishap;
      const incidentStep = term.steps.find((step) => ['Event', 'Mishap'].includes(step.stage));
      expect(incident.label).toMatch(/^Life Event:/);
      expect(incident.label).not.toMatch(/Roll on the Life Events table/i);
      expect(incidentStep.result).toBe(incident.label);
      expect(incidentStep.detail).not.toMatch(/Roll on the Life Events table|page 34/i);
      expect(character.careerHistory[term.T].event).toBe(incident.label);
    }
  });

  it('uses 3 plus Education DM as the background skill budget', () => {
    const character = generateCharacter({ seed: 'home1234', terms: 1, campaignMode: 'chthonian', homeworld: 'Mars', upp: '222292' });
    const awards = backgroundAwards(character);

    expect(awards).toHaveLength(4);
    expect(awards.map((award) => award.skill)).toEqual(character.backgroundSkills);
    expect(awards.slice(0, 2).map((award) => award.skill)).toEqual(['Computers', 'Survival']);
    expect(awards.slice(0, 2).every((award) => award.source === 'Homeworld')).toBe(true);
    expect(awards.slice(2).every((award) => award.source === 'Education')).toBe(true);
  });

  it('caps background skills to the 1 to 5 Education DM range', () => {
    const lowEdu = generateCharacter({ seed: 'lowedu1234', terms: 1, campaignMode: 'chthonian', homeworld: 'Mars', upp: '222202' });
    const highEdu = generateCharacter({ seed: 'highedu1234', terms: 1, campaignMode: 'chthonian', homeworld: 'Mars', upp: '2222f2' });

    expect(backgroundAwards(lowEdu)).toHaveLength(1);
    expect(lowEdu.backgroundSkills).toEqual(['Computers']);
    expect(lowEdu.bio).toContain('trained in Computers before leaving home');
    expect(backgroundAwards(highEdu)).toHaveLength(5);
  });

  it('keeps Chthonian Stars on solar-system homeworlds', () => {
    const character = generateCharacter({ seed: 'cthon1234', campaignMode: 'chthonian', homeworld: 'Mars' });

    expect(character.homeworld.mode).toBe('chthonian');
    expect(character.homeworld.name).toBe('Mars');
    expect(character.homeworld.backgroundSkills).toContain('Survival');
  });

  it('formats a copyable record', () => {
    const text = formatCharacterText(generateCharacter({ seed: 'bead1234' }));

    expect(text).toContain('UPP:');
    expect(text).toContain('Bio:');
    expect(text).toContain('Professionally,');
    expect(text).toContain('Combat:');
    expect(text).toContain('Seed: bead1234');
  });
});
