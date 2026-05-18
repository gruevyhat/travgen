import { describe, expect, it } from 'vitest';
import { formatCharacterText, generateCharacter } from './character.js';

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
    const ALL_WEAPONS = ['Autopistol', 'Blade', 'Carbine', 'Rifle', 'Shotgun', 'Laser Pistol', 'Laser Carbine'];
    expect(withWeapon.combat.some((item) => ALL_WEAPONS.includes(item.weapon))).toBe(true);
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
