#!/usr/bin/python

import sys
from random import choice
from collections import Counter, OrderedDict
from dice import d3
from career_path import CareerPath
from attributes import SkillSet, Stats
from lc import lc
from names import NAMES, titlecase
from data import WORLDS, PERSONALITIES, STARTING_AGE, WORLD_ADJ   


class Character(object):

    def __init__(self, name=None, upp=None, homeworld=None,
                 ethnicity=None, gender=None, personality=False,
                 terms=3, path=None, method=None, rand_age=False,
                 show_hist=False, psi=None):
        # Demographics
        if not ethnicity:
            self.get_ethnicity()
        else:
            self.ethnicity = ethnicity
        if not gender:
            self.get_gender()
        else:
            self.gender = gender
        if not name:
            self.get_name()
        else:
            self.name = name
        if personality:
            self.get_personality()
        else:
            self.personality = None
        # Game attributes
        self.stats = Stats(upp=upp, method=method, psi=psi)
        self.skills = SkillSet()
        self.psi = psi
        # Process career path
        if not homeworld:
            self.get_homeworld()
        else:
            self.homeworld = homeworld
        self.cp = CareerPath(self, terms, path)
        self.adjust_psi()
        self.get_age(rand_age)
        self.show_hist = show_hist

    def get_ethnicity(self):
        self.ethnicity = choice(NAMES.keys())

    def get_name(self):
        self.name = lc(self.ethnicity, self.gender)

    def get_gender(self):
        self.gender = choice(["male", "female"])

    def get_homeworld(self):
        self.homeworld = choice(WORLDS.keys())

    def get_age(self, rand):
        nterms = len(self.cp.terms)
        self.age = STARTING_AGE + nterms * 4
        if rand:
            self.age += d3(nterms) - 2 * nterms

    def get_personality(self):
        self.personality = (choice(PERSONALITIES[0]),
                            choice(PERSONALITIES[1]),
                            choice(PERSONALITIES[2]))

    def adjust_psi(self):
        terms = [t["Career"] for t in self.cp.terms]
        if "Psion" in terms:
            pen = terms.index("Psion")
        else:
            pen = len(terms)
        self.stats.Psi -= pen
        if self.stats.Psi < 1:
            self.psi = None

    def __repr__(self):
        o = [self.name]
        if self.homeworld in WORLD_ADJ:
            hw = WORLD_ADJ[self.homeworld]
            eth = " (%s)" % titlecase(self.ethnicity)
        else:
            hw = "denizen of " + self.homeworld
            eth = ""
        hw = WORLD_ADJ.get(self.homeworld, "denizen of " + self.homeworld)
        o += ["%s %s%s, age %d" % (titlecase(self.gender),
                                   hw, eth, self.age)]
        # Stats
        o += [repr(self.stats)]
        # Career Path
        path = OrderedDict([((t["Career"], t["Spec"]), t["Rnk"])
                            for t in self.cp.terms])
        path = ', '.join("%s (%s) [Rank %d]" % (c, s, n)
                         for (c, s), n in path.items())
        o += ['Career Path: ' + path]
        # Skills
        o += ['Skills: ' + ', '.join("%s %d" % (s, v)
                                     for s, v in sorted(self.skills.items()))]
        # Benefits
        if self.cp.benefits:
            prizes = Counter([b for b in self.cp.benefits])
            prizes = ', '.join("%s x%d" % (b, n) for b, n in prizes.items())
        else:
            prizes = None
        cash = str(self.cp.credits) + " Cr." if self.cp.credits else ""
        benefits = ', '.join((b for b in (cash, prizes) if b))
        o += ['Benefits: %s' % benefits]
        # Personality
        if self.personality:
            mb = ''.join((choice("IESNFTJP"[i:i+2]) for i in range(0, 8, 2)))
            o += ["Personality: %%s; %s, %s, %s" % self.personality % mb]
        # History
        if self.show_hist is True:
            o += ["Career History"]
            o += [repr(self.cp)]
            o += self.cp.history
        return "\n".join(o).encode('utf8', 'ignore')


if __name__ == "__main__":

    c = Character()
    sys.stdout.write(repr(c)+"\n")
