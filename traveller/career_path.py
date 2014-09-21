#!/usr/bin/python

from random import choice, sample
from dice import d6
from attributes import STATS
from data import *


STARTING_SKILLS = 3
COMMISSION = 8
FIELDS = ('T', 'Career', 'Spec', 'Q', 'S', 'A', 'Edu', 'BT', 'SR', 'Rnk', 'EM', 'Age', 'Ben')
TERM = {f:None for f in FIELDS}

def closest_careers(stats, n = None):
    A = []
    for car, d_car in CAREERS.items():
        for spec, d_spec in d_car.items():
            tpls = d_spec.values()
            d = sum((stats[k] - v for k, v in tpls if v))
            A.append((d, car, spec))

    if not n:
        n = len(A)
    return sorted(A, reverse=True)[:n]


class CareerPath(object):

    def __init__(self, character, terms = 3, path = None):
        self.stats = character.stats
        self.skills = character.skills
        self.homeworld = character.homeworld
        self.history = []
        self.benefits = []
        self.credits = 0
        self.closest = closest_careers(self.stats)
        self.new_career = False
        self.attempted = []
        if path and len(path) > terms:
            path = path[:terms]
        self.n = terms
        self.path = path
        self.build_term_table()
        self.generate()

    def __repr__(self):
        P = [FIELDS] + [ [ self.terms[i][f] for f in FIELDS ] for i in range(len(self.terms)) ]
        P = [ [ ('-' if c is None else str(c).replace('True', 'Y').replace('False', 'N')) for c in r ] for r in P ]
        tmpl = ''.join(('%%-%ds' % s for s in [ max((len(z) for z in y)) + 2 for y in zip(*P) ]))
        return '\n'.join((tmpl % tuple(p) for p in P))

    def build_term_table(self):
        self.terms = [ TERM.copy() for i in range(self.n) ]
        for n in range(self.n):
            self.terms[n]['T'] = n

        self.background_skills()
        if self.path:
            for i, (c, s) in enumerate(self.path):
                if i >= len(self.terms):
                    self.terms[i] = TERM.copy()
                if c in CAREERS:
                    self.terms[i]['Career'] = c
                    if s not in CAREERS[c]:
                        s = choice(CAREERS[c].keys())
                    self.terms[i]['Spec'] = s
                else:
                    #print "Can't find career '%s'!" % c
                    self.terms[i]['Career'] = None
                    self.terms[i]['Spec'] = None

    def background_skills(self):
        self.history += ['BACKGROUND']
        self.history += [' Starting ' + repr(self.stats)]
        edu = STARTING_SKILLS + self.stats.Edu()
        for n in range(self.n):
            if n == 0:
                skill_list = set(EDU_SKILLS + [ (s, 0)
                                                for s in WORLDS[self.homeworld] ])
                skills = sample(skill_list, edu)
                for skill, n in skills:
                    self.history += [' Learned %s %d from Education.' % (skill, n)]
                self.skills.learn(dict(skills))
                self.terms[n]['Edu'] = edu
            else:
                self.terms[n]['Edu'] = 0

    def generate(self):
        for n in range(self.n):
            self.history += ['TERM %d' % n]
            self.get_career(n)
            self.get_term(n)
            c = self.terms[n]['Career']
            s = self.terms[n]['Spec']
            if s not in CAREERS[c]:
                self.terms[n]['Spec'] = choice(CAREERS[c].keys())

    def get_career(self, n, fallback = False):
        career = self.terms[n]['Career']
        spec = self.terms[n]['Spec']
        if fallback:
            c = choice(FALLBACK_CAREERS)
            s = choice(CAREERS[c].keys())
        elif career and not self.new_career and career not in self.attempted:
            c, s = career, spec
        elif n > 0 and not self.new_career:
            c = self.terms[n - 1]['Career']
            s = self.terms[n - 1]['Spec']
        else:
            closest = [ cl for cl in self.closest if cl[1] not in self.attempted and not cl[1].endswith('Officer') ][:5]
            if closest:
                _, c, s = choice(closest)
            else:
                c = 'Drifter'
                s = choice(CAREERS[c].keys())
        self.terms[n]['Career'] = c
        self.terms[n]['Spec'] = s
        self.prev = set([ self.terms[i]['Career'] for i in range(n) ])

    def get_term(self, n):
        career = self.terms[n]['Career']
        spec = self.terms[n]['Spec']
        career_table = CAREERS[career][spec]
        self.attempted.append(career)
        self.qualify(n, career, career_table)
        self.basic_training(n)
        self.survive(n, career_table)
        self.skill_roll(career, spec)
        self.events_and_mishaps(n)
        if career in DRAFT and self.stats.Soc() >= 1:
            self.get_commission(n, career)
        else:
            self.advance(n, career_table)
        self.promote(n)
        self.age(n)
        self.muster(n)

    def survive(self, n, career_table):
        self.terms[n]['SR'] = 1
        surv = self.stat_check(career_table, 'Surv')
        if not surv:
            self.new_career = True
            self.terms[n]['A'] = False
        else:
            self.new_career = False
        self.terms[n]['S'] = surv

    def events_and_mishaps(self, n):
        r = (d6(1), d6(1))
        if not self.terms[n]['S']:
            self.terms[n]['EM'] = 'm[%d]' % r[0]
            self.history += [' Experienced a Mishap (Roll=%d).' % r[0]]
        else:
            self.terms[n]['EM'] = 'e[%d,%d]' % r
            self.history += [' Experienced an Event (Roll=%d,%d).' % r]

    def get_commission(self, n, career):
        comm = self.stats.Soc.roll() >= COMMISSION
        if comm:
            self.terms[n]['Career'] = career + ' Officer'
            self.history += [' Received a Commission.']
            self.terms[n]['A'] = True
        else:
            self.terms[n]['A'] = True

    def advance(self, n, career_table):
        adv, adv_roll = self.stat_check(career_table, 'Adv', roll=True)
        if self.terms[n]['S'] and adv:
            self.terms[n]['SR'] += 1
            self.skill_roll(self.terms[n]['Career'], self.terms[n]['Spec'])
        else:
            adv = False
        if adv_roll < len(self.prev):
            self.new_career = True
        self.terms[n]['A'] = adv

    def promote(self, n):
        if n > 0 and self.terms[n]['Career'] == self.terms[n - 1]['Career']:
            rank = self.terms[n - 1]['Rnk']
        else:
            rank = 0
        if self.terms[n]['A'] and rank < 6:
            rank += 1
            self.history += [' Promoted to Rank %d.' % rank]
        self.terms[n]['Rnk'] = rank
        career = self.terms[n]['Career'] #.replace(' Officer', '')
        spec = self.terms[n]['Spec']
        if spec not in CAREERS[career]:
            spec = choice(CAREERS[career].keys())
        rank_skill = RANKS[career, spec][min(rank, 6)]
        if self.terms[n]['A'] and rank_skill:
            attr, n = rank_skill
            attr = choice(attr.split(' or '))
            self.rank_roll(attr, n)

    def qualify(self, n, career, career_table):
        self.history += [' Career: %s (%s).' % (career, self.terms[n]['Spec'])]
        self.attempted.append(career)
        if career_table['Qual'][1] and (n == 0 or self.new_career):
            if career_table['Qual'][1]:
                qualified = True
            if career in ('Nobility', 'Aristocrat'):
                qualified = self.stats.Soc >= career_table['Qual'][1]
            elif career == "Psion":
                qualified = self.stats.Psi >= career_table['Qual'][1]
            else:
                if career in DRAFT:
                    old = -2 * (len(self.terms) >= 4)
                else:
                    old = 0
                prev = -len(self.prev)
                qualified = self.stat_check(career_table, 'Qual', mods=old + prev)
        else:
            qualified = True
        if not qualified:
            self.new_career = True
            self.get_career(n, fallback=True)
            qualified = False
            self.history += [' Failed to qualify. New Career: %s.' % self.terms[n]['Career']]
        self.terms[n]['Q'] = qualified

    def basic_training(self, n):
        if n == 0:
            self.terms[n]['BT'] = 6
        elif self.new_career or self.terms[n]['Career'] != self.terms[n - 1]['Career']:
            self.terms[n]['BT'] = 1
        else:
            self.terms[n]['BT'] = 0
        if self.terms[n]['BT']:
            idx = SKILL_TYPES['BT']
            skills = SKILLS[self.terms[n]['Career'], self.terms[n]['Spec']][idx:idx + 6]
            if n > 0:
                skills = (choice(skills),)
            self.skills.learn(dict(skills))
            for skill, s in skills:
                self.history += [' Learned %s %d in Basic Training.' % (skill, s)]

    def age(self, n):
        age = '-' if n < 3 else d6(2) - n + 1
        if age < 1:
            age = max(-6, age)
            pens = AGING[-age]
            for p, pen in enumerate(pens):
                if pen:
                    if p == 3:
                        a = choice(('Int', 'Edu', 'Soc'))
                    else:
                        a = choice(('Str', 'Dex', 'End'))
                    self.stats[a] -= pen
                    if self.stats[a] < 0:
                        self.stats[a] = Stat(value=0)
                    self.history += [' Lost %d %s due to aging.' % (pen, a)]

        self.terms[n]['Age'] = age

    def muster(self, n):
        ben = d6(1)
        career = self.terms[n]['Career'].replace(' Officer', '')
        self.terms[n]['Ben'] = ben
        if choice((0, 1)) == 1:
            benefit = BENEFITS[career][ben - 1]
            self.benefits += [benefit]
            self.history += [' Acquired Benefit: %s.' % benefit]
        else:
            credits = CREDITS[career][ben - 1]
            self.credits += credits
            self.history += [' Acquired %d.' % credits]

    def stat_check(self, career_table, check, mods=0, roll=None):
        stat, tgt = career_table[check]
        result = self.stats[stat].roll(mods)
        success = result >= tgt
        if roll:
            return (success, result)
        else:
            return success

    def skill_roll(self, career, spec):
        career = career.replace(' Officer', '')
        tabs = ['Personal Development', 'Service', 'Specialization']
        if career != 'Drifter' and self.stats.Edu >= 8:
            tabs.extend(['Advanced Education'] * 1)
        if career.find('Officer') > -1:
            tabs.extend(['Officer'] * 1)
        tab = choice(tabs)
        idx = SKILL_TYPES[tab] * 6
        attr, n = choice(SKILLS[career, spec][idx:idx + 6])
        attr = choice(attr.split(' or '))
        if attr in STATS:
            self.stats[attr] += 1
            self.history += [' Received +1 %s from the %s table.' % (attr, tab)]
        else:
            self.skills[attr] = max(self.skills[attr] + 1, n)
            self.history += [' Learned %s %d from the %s table.' % (attr, self.skills[attr], tab)]

    def rank_roll(self, attr, n):
        attr = choice(attr.split(' or '))
        if attr in STATS:
            self.stats[attr] += 1
            self.history += [' Received +1 %s from advancement.' % attr]
        else:
            self.skills[attr] = max(self.skills[attr], n)
            self.history += [' Learned %s %d from advancement.' % (attr, self.skills[attr])]
