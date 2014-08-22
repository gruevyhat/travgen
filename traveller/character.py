#!/usr/bin/python

import sys
from random import choice
from dice import d3
from career_path import CareerPath
from attributes import SkillSet, Stats
from lc import lc
from names import NAMES, titlecase


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

WORLDS = {"Mercury": ["Admin", "Vacc Suit"],
          "Venus": ["Admin", "Survival"],
          "Earth": ["Computers", "Streetwise"],
          "Mars": ["Computers", "Survival"],
          "Callisto": ["Vacc Suit", "Zero-G"],
          "Europa": ["Computers", "Life Science", "Space Science"],
          "Ganymede": ["Carouse", "Streetwise"],
          "Enceladus": ["Life Science", "Space Science", "Steward"],
          "Titan": ["Computers", "Streetwise"],
          "Uranus": ["Admin", "Vacc Suit"],
          "Neptune": ["Recon", "Vacc Suit"],
          "Kuiper Belt": ["Recon", "Vacc Suit"]}


class Character(object):

    def __init__(self, name=None, upp=None, homeworld=None,
                 ethnicity=None, gender=None, terms=3, path=None,
                 method=None, rand_age=False):
        self.stats = Stats(upp, method)
        self.skills = SkillSet()
        self.cp = CareerPath(self, terms, path)
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
        o += [repr(self.cp)]
        return "\n".join(o).encode('utf8', 'ignore')


if __name__ == "__main__":

    c = Character()
    sys.stdout.write(repr(c)+"\n")
