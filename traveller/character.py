#!/usr/bin/python

import sys
from random import choice
from collections import Counter, OrderedDict
from dice import d3
from career_path import CareerPath
from attributes import SkillSet, Stats
from lc import lc
from names import NAMES, titlecase
from data import *


class Character(object):

    def __init__(self, name=None, upp=None, homeworld=None,
                 ethnicity=None, gender=None, terms=3, path=None,
                 method=None, rand_age=False,
                 show_cp=False, show_hist=False):
        # Game attributes
        self.stats = Stats(upp, method)
        self.skills = SkillSet()
        # Process career path
        if not homeworld:
            self.get_homeworld()
        else:
            self.homeworld = homeworld
        self.cp = CareerPath(self, terms, path)
        self.show_cp = show_cp
        self.show_hist = show_hist
        # Demographics
        self.get_age(rand_age)
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
        if self.show_cp is True:
            o += [repr(self.cp)]
        if self.show_hist is True:
            o += self.cp.history
        # Skills
        o += ['Skills: ' + ', '.join("%s %d" % (s, v)
                                     for s, v in sorted(self.skills.items()))]
        # Benefits
        benefits = str(self.cp.credits) + " Cr."
        if self.cp.benefits:
            stuff = Counter([b for b in self.cp.benefits])
            stuff = ', '.join("%s x%d" % (b, n) for b, n in stuff.items())
            benefits = ', '.join((stuff, benefits))
        o += ['Benefits: %s' % benefits]
        return "\n".join(o).encode('utf8', 'ignore')


if __name__ == "__main__":

    c = Character()
    sys.stdout.write(repr(c)+"\n")
