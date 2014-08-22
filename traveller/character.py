#!/usr/bin/python

import sys
from random import choice, sample
from dice import d3
from career_path import CareerPath
from attributes import SkillSet, Stats, Stat, STATS
from lc import lc
from names import NAMES, titlecase
from char_data import *


STARTING_AGE = 18

WORLD_ADJ = {'Callisto': 'Callistan',
             'Earth': 'Earther',
             'Enceladus': 'Enceladian',
             'Europa': 'Europan',
             'Ganymede': 'Ganymedan',
             'Kuiper Belt': 'Belter',
             'Mars': 'Martian',
             'Mercury': 'Mercurian',
             'Neptune': 'Neptunian',
             'Titan': 'Titanian',
             'Uranus': 'Uranian',
             'Venus': 'Venusian'}


class Character(object):

    def __init__(self, name=None, upp=None, homeworld=None,
                 ethnicity=None, gender=None, terms=3, path=None,
                 method=None, rand_age=False, show_cp=True):
        # Game attributes
        self.stats = Stats(upp, method)
        self.skills = SkillSet()
        self.cp = CareerPath(self, terms, path)
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
        if not homeworld:
            self.get_homeworld()
        else:
            self.homeworld = homeworld
        # Process career path
        self.proc_cp()
        self.show_cp = show_cp

    def proc_cp(self):
        print self.stats
        for t, term in enumerate(self.cp.terms):
            career = term["Career"]
            spec = term["Spec"]
            # Set available skill tables
            tabs = ["PD", "Serv", "Spec"]
            if self.stats.Edu >= 8:
                tabs.append("Adv")
            if career.find("Officer") > -1:
                tabs.append("Off")
                career = career.replace(" (Officer)", "")
            # Add skills
            if term["Edu"]:
                edu = EDU_SKILLS + [(s, 0) for s in WORLDS[self.homeworld]]
                skills = sample(edu, term["Edu"])
                self.skills.learn(dict(skills))
            if term["BT"]:
                idx = SKILL_TYPES["BT"]
                skills = SKILLS[(career, spec)][idx: idx+6]
                if t > 0:
                    skills = (choice(skills),)
                self.skills.learn(dict(skills))
            self.skill_roll(career, spec, tabs)
            # TODO: term['Rnk']
            # TODO: term['EM']
            if term['SR'] > 1:
                self.skill_roll(career, spec, tabs)
            # TODO: term['Ben']
            # TODO: term['Age']

    def skill_roll(self, career, spec, tabs):
        tab = choice(tabs)
        idx = SKILL_TYPES[tab]
        attr, n = choice(SKILLS[(career, spec)][idx: idx+6])
        if attr in STATS:
            self.stats[attr] += 1
        elif attr in self.skills:
            self.skills[attr] = max(self.skills[attr] + 1, n)
        else:
            self.skills.learn({attr: n})

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
        o += [repr(self.stats)]
        o += ['Skills: ' + ', '.join("%s %d" % (s, v) for s, v in self.skills.items())]
        if self.show_cp is True:
            o += [repr(self.cp)]
        return "\n".join(o).encode('utf8', 'ignore')


if __name__ == "__main__":

    c = Character()
    sys.stdout.write(repr(c)+"\n")
