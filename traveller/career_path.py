#!/usr/bin/python

from random import choice
from dice import d6
from career_data import *


STARTING_SKILLS = 3

COMMISSION = 8

FIELDS = ("T", "Career", "Spec", "Q", "S", "A",
          "Edu", "BT", "SR", "Rnk", "EM", "Age", "Ben")

TERM = {f: None for f in FIELDS}


def closest_careers(stats, n=None):
    # stat_d = {i: j for i, j, k in stats.list()}
    A = []
    for car, d_car in CAREERS.items():
        for spec, d_spec in d_car.items():
            tpls = d_spec.values()
            d = sum((stats[k]-v) for k, v in tpls if v)  # Relevant stats
            # d = sum(stat_d[k]-v for k, v in tpls if v) # All stats
            A.append((d, car, spec))
    if not n:
        n = len(A)
    return sorted(A, reverse=True)[:n]


class CareerPath(object):

    def __init__(self, character, terms=3, path=None):
        self.stats = character.stats
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
        P = [FIELDS] + [[self.terms[i][f] for f in FIELDS]
                        for i in range(len(self.terms))]
        P = [["-" if c is None else str(c).replace("True", "Y").replace("False", "N")
             for c in r] for r in P]
        tmpl = ''.join(("%%-%ds" % s for s in
                        [max(len(z) for z in y)+2 for y in zip(*P)]))
        #return "Career Path:\n" + '\n'.join((tmpl % tuple(p) for p in P))
        return '\n'.join((tmpl % tuple(p) for p in P))

    def build_term_table(self):
        self.terms = [TERM.copy() for i in range(self.n)]
        for n in range(self.n):
            self.terms[n]["T"] = n
        self.background_skills()
        if self.path:
            for i, (c, s) in enumerate(self.path):
                if i >= len(self.terms):
                    self.terms[i] = TERM.copy()
                if c in CAREERS:
                    self.terms[i]["Career"] = c
                    if s not in CAREERS[c]:
                        s = choice(CAREERS[c].keys())
                    self.terms[i]["Spec"] = s
                else:
                    self.terms[i]["Career"] = None
                    self.terms[i]["Spec"] = None

    def background_skills(self):
        edu = STARTING_SKILLS + self.stats.Edu()
        for n in range(self.n):
            self.terms[n]["Edu"] = edu if n == 0 else 0

    def generate(self):
        for n in range(self.n):
            self.get_career(n)
            self.get_term(n)
            c = self.terms[n]["Career"]
            s = self.terms[n]["Spec"]
            if s not in CAREERS[c]:
                self.terms[n]["Spec"] = choice(CAREERS[c].keys())

    def get_career(self, n, fallback=False):
        career = self.terms[n]["Career"]
        spec = self.terms[n]["Spec"]
        if fallback:
            c = choice(FALLBACK_CAREERS)
            s = choice(CAREERS[c].keys())
        elif career and (not self.new_career) and (career not in self.attempted):
            c, s = career, spec
        elif n > 0 and not self.new_career:
            c = self.terms[n-1]["Career"]
            s = self.terms[n-1]["Spec"]
        else:
            closest = [cl for cl in self.closest
                       if (not cl[1] in self.attempted)
                       and (not cl[1].endswith("(Officer)"))][:5]
            _, c, s = choice(closest)
        self.terms[n]["Career"] = c
        self.terms[n]["Spec"] = s
        self.prev = set([self.terms[i]["Career"] for i in range(n)])

    def get_term(self, n):
        career = self.terms[n]["Career"]
        spec = self.terms[n]["Spec"]
        career_table = CAREERS[career][spec]
        self.attempted.append(career)
        # Qualification check
        self.qualify(n, career, career_table)
        # Basic Training
        self.basic_training(n)
        # Survival
        self.survive(n, career_table)
        # Advancement
        if career in DRAFT and self.stats.Soc() >= 1:
            self.get_commission(n, career)
        else:
            self.advance(n, career_table)
        # Rank
        self.promote(n)
        # Clean up
        self.age(n)
        self.benefits(n)

    def survive(self, n, career_table):
        self.terms[n]["SR"] = 1
        surv = self.stat_check(career_table, "Surv")
        if not surv:
            self.new_career = True
            self.terms[n]["EM"] = "m[%d]" % d6(1)
            self.terms[n]["A"] = False
        else:
            self.new_career = False
            self.terms[n]["EM"] = "e[%d,%d]" % (d6(1), d6(1))
        self.terms[n]["S"] = surv

    def get_commission(self, n, career):
        comm = self.stats.Soc.roll() >= COMMISSION
        if comm:
            self.terms[n]['Career'] = career + " (Officer)"
            self.terms[n]["A"] = True
        else:
            self.terms[n]["A"] = True

    def advance(self, n, career_table):
        adv, adv_roll = self.stat_check(career_table, "Adv", roll=True)
        if self.terms[n]['S'] and adv:
            self.terms[n]["SR"] += 1
        else:
            adv = False
        if adv_roll < len(self.prev):
            self.new_career = True
        self.terms[n]["A"] = adv

    def promote(self, n):
        if n > 0 and self.terms[n]["Career"] == self.terms[n-1]["Career"]:
            rank = self.terms[n-1]["Rnk"]
        else:
            rank = 0
        if self.terms[n]['A'] and rank < 6:
            rank += 1
        self.terms[n]["Rnk"] = rank

    def qualify(self, n, career, career_table):
        self.attempted.append(career)
        if career_table['Qual'][1] and (n == 0 or self.new_career):
            if career_table['Qual'][1]:
                qualified = True
            if career in ("Nobility", "Aristocrat"):
                qualified = self.stats.Soc >= career_table['Qual'][1]
            # elif career == "Scholar":
            #     qualified = self.stats.Edu >= 8
            else:
                if career in DRAFT:
                    old = -2 * (len(self.terms) >= 4)
                else:
                    old = 0
                prev = -len(self.prev)
                qualified = self.stat_check(career_table, "Qual",
                                            mods=old+prev)
        else:
            qualified = True
        if not qualified:
            self.new_career = True
            self.get_career(n, fallback=True)
            qualified = False
        self.terms[n]["Q"] = qualified

    def basic_training(self, n):
        if n == 0:
            self.terms[n]["BT"] = 6
        elif self.new_career or (self.terms[n]['Career'] !=
                                 self.terms[n-1]['Career']):
            self.terms[n]["BT"] = 1
        else:
            self.terms[n]["BT"] = 0

    def age(self, n):
        age = "-" if n < 3 else d6(2) - len(self.terms)
        self.terms[n]["Age"] = age

    def benefits(self, n):
        if self.terms[n]["S"]:
            self.terms[n]["Ben"] = d6(1)
        else:
            self.terms[n]["Ben"] = None

    def stat_check(self, career_table, check, mods=0, roll=None):
        stat, tgt = career_table[check]
        result = self.stats[stat].roll(mods)
        success = result >= tgt
        if roll:
            return (success, result)
        else:
            return success
