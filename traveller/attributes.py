#!/usr/bin/python

from collections import defaultdict
from dice import d6, d3, d16


STATS = ("Str", "Dex", "End", "Int", "Edu", "Ins", "Soc", "Pac")


class Stat(int):

    def __new__(cls, method=None, value=None):
        if not value > -1:
            if method == "heroic":
                value = sum(sorted([d6(1) for i in range(3)])[-2:])
            elif method == "superheroic":
                value = d6(2)+3
            elif method == "mediocre":
                value = d3(4)
            elif method == "extreme":
                value = d16(1)-1
            elif method == "alternating":
                value = sum([d for j, d in enumerate(sorted([d6(1)
                             for i in range(4)])) if j % 2 == 1])
            else:
                value = d6(2)
        return super(Stat, cls).__new__(cls, value)

    def __call__(self):
        return self // 3 - 2 if self > 0 else -3

    def __add__(self, n):
        return self.__class__(value=int(self) + n)

    def roll(self, mods=0):
        return (d6(2) + self() + mods)

    def succeed(self, tgt=8, mods=0):
        return self.roll(mods) >= tgt


class Stats(object):

    def __init__(self, upp=None, method=None, animal=False):
        if upp:
            self.Str = Stat(value=int(upp[0], 16))
            self.Dex = Stat(value=int(upp[1], 16))
            self.End = Stat(value=int(upp[2], 16))
            self.Int = Stat(value=int(upp[3], 16))
            self.Edu = Stat(value=int(upp[4], 16))
            self.Soc = Stat(value=int(upp[5], 16))
        else:
            self.Str = Stat(method=method)
            self.Dex = Stat(method=method)
            self.End = Stat(method=method)
            self.Int = Stat(method=method)
            self.Edu = Stat(method=method)
            self.Soc = Stat(method=method)
        if animal:
            self.Ins = self.Edu
            self.Pac = self.Soc
            del self.Edu
            del self.Soc

    def __getitem__(self, stat):
        return self.__dict__[stat]

    def __setitem__(self, k, v):
        self.__dict__[k] = v

    def list(self):
        return [(s, self[s], self[s]())
                for s in STATS if s in self.__dict__]

    def __repr__(self):
        stats = list(zip(*self.list())[1])
        stats.append(sum(stats)/6.0)
        return "UPP: %x%x%x%x%x%x [%.1f]" % tuple(stats)


class SkillSet(defaultdict):

    def __init__(self):
        super(SkillSet, self).__init__(lambda: -3)

    def learn(self, skills):
        if type(skills) is not dict:
            if type(skills) is str:
                skills = [skills]
            skills = {s: 0 for s in skills}
        for skill, value in skills.items():
            if skill in self:
                self[skill] += value
            else:
                self[skill] = value

    def list(self):
        return [(k, v) for k, v in self.iteritems()
                if v >= 0]
