#!/usr/bin/python

import sys
from random import choice, sample
from collections import Counter
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
        self.history = []
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
        self.benefits = []
        self.credits = 0
        self.proc_cp()
        self.show_cp = show_cp

    def proc_cp(self):
        self.history += ["Starting " + repr(self.stats)]
        for t, term in enumerate(self.cp.terms):
            self.history += ["TERM %d" % t]
            career = term["Career"]
            spec = term["Spec"]
            age = term['Age']
            # Set available skill tables
            tabs = ["PD", "Serv", "Spec", "Spec"]
            if self.stats.Edu >= 8:
                tabs.extend(["Adv"] * 2)
            if career.find("Officer") > -1:
                tabs.extend(["Off"] * 2)
            career = career.replace(" (Officer)", "")
            # Add skills
            if term["Edu"]:
                edu = EDU_SKILLS + [(s, 0) for s in WORLDS[self.homeworld]]
                skills = sample(edu, term["Edu"])
                for skill, n in skills:
                    self.history += [" Learned %s %d from background education." % (skill, n)]
                self.skills.learn(dict(skills))
            if term["BT"]:
                idx = SKILL_TYPES["BT"]
                skills = SKILLS[(career, spec)][idx: idx+6]
                if t > 0:
                    skills = (choice(skills),)
                self.skills.learn(dict(skills))
                for skill, n in skills:
                    self.history += [" Learned %s %d in basic training." % (skill, n)]
            self.skill_roll(career, spec, tabs)
            # Get new rank skills
            try:
                rank_skill = RANKS[term["Career"], spec][term["Rnk"]]
                if term['A'] and rank_skill:
                    attr, n = rank_skill
                    attr = choice(attr.split(" or "))
                    self.rank_roll(attr, n)
            except:
                print term["Career"], spec, term["Rnk"]
                raise
            # TODO: term['EM']
            if term['SR'] > 1:
                self.skill_roll(career, spec, tabs)
            # Misc.
            if term['Ben']:
                if choice((0,1)) == 1:
                    benefit = BENEFITS[career][term['Ben']-1]
                    self.benefits += [benefit]
                    self.history += [" Acquired Benefit: %s." % benefit]
                else:
                    credits = CREDITS[career][term['Ben']-1]
                    self.credits += credits
                    self.history += [" Acquired %d." % credits]
            if age != "-":
                if age < 1:
                    pen = AGING[age]
                    pts = sum(pen)
                    sts = len([p for p in pen if p > 0])
                    self.history += [" Lost %d points in %d stats due to aging." % (pts, sts)]

    def skill_roll(self, career, spec, tabs):
        tab = choice(tabs)
        idx = SKILL_TYPES[tab]
        attr, n = choice(SKILLS[(career, spec)][idx: idx+6])
        attr = choice(attr.split(" or "))
        if attr in STATS:
            self.stats[attr] += 1
            self.history += [" Received +1 %s from the %s table." % (attr, tab)]
        else:
            self.skills[attr] = max(self.skills[attr] + 1, n)
            self.history += [" Learned %s %d from the %s table." % (attr,
                self.skills[attr], tab)] 

    def rank_roll(self, attr, n):
        attr = choice(attr.split(" or "))
        if attr in STATS:
            self.stats[attr] += 1
            self.history += [" Received +1 %s from advancement." % attr] 
        else:
            self.skills[attr] = max(self.skills[attr], n)
            self.history += [" Learned %s %d from advancement." % (attr,
                self.skills[attr])] 

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
        path = Counter([(t["Career"], t["Spec"]) for t in self.cp.terms])
        path = ', '.join("%s (%s) x%d" % (c, s, n) for (c, s), n in path.items())
        o += ['Career Path: ' + path]
        if self.show_cp is True:
            o += [repr(self.cp)]
            o += self.history
        # Skills
        o += ['Skills: ' + ', '.join("%s %d" % (s, v)
                                     for s, v in sorted(self.skills.items()))]
        # Benefits
        benefits = str(self.credits) + " Cr."
        if self.benefits:
            stuff = Counter([b for b in self.benefits])
            stuff = ', '.join("%s x%d" % (b, n) for b, n in stuff.items())
            benefits = ', '.join((stuff, benefits))
        o += ['Benefits: %s' % benefits]
        
        return "\n".join(o).encode('utf8', 'ignore')


if __name__ == "__main__":

    c = Character()
    sys.stdout.write(repr(c)+"\n")
