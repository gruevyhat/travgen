#!/usr/bin/python

from random import sample, choice
from dice import d6


MISSION = {
    'Espionage': {
        'Type': {
            'Legal Action':
                ('Advocate', 'Investigate', 'Persuade', 'Streetwise'),
            'Ongoing Investigation':
                ('Carouse', 'Deception', 'Investigate', 'Recon'),
            'Corporate Action':
                ('Admin', 'Computers', 'Deception', 'Trade'),
            'Political Action':
                ('Admin', 'Carouse', 'Investigate', 'Persuade'),
            'Underworld Action':
                ('Carouse', 'Deception', 'Persuade', 'Streetwise'),
            'Covert Action':
                ('Deception', 'Investigate', 'Recon', 'Stealth'),
            'Destructive Action':
                ('Athletics', 'Explosives', 'Gun Combat', 'Stealth'),
            },
        'Target': {
            'a Location': 0,
            'Public Data': -1,
            'Private Data': 1,
            'a Common Item': -1,
            'a Rare Item': 1,
            'a Person': 0,
            'a V.I.P.': 1,
            },
        'Duration': ('%d * 21', '%d * 14', '%d * 7', '%d * 5',
                     '%d * 3', '%d + 1'),
        'Difficulty': {
            'a Training': (1, -3),
            'a Very Easy': (3, -2),
            'an Easy': (5, -1),
            'a Routine': (7, 0),
            'a Medium': (9, 0),
            'a Challenging': (11, 1),
            'a Difficult': (13, 2),
            'an Arduous': (15, 3),
            },
        'Payout': (
            0,
            d6(1)*100,
            d6(2)*100,
            d6(2)*200,
            d6(2)*300,
            d6(2)*400,
            d6(2)*500,
            d6(3)*500,
            d6(2)*1000,
            d6(2)*1000,
            d6(2)*2000,
            d6(2)*2000,
            d6(2)*5000,
            d6(2)*10000,
            ),
        },
    'Anti-Corporate': {
        'Type': {
            'an Anti-Corporate Mission': {2: 3, 3: 4, 5: 5, 8: 6,
                                          10: 7, 11: 8, 12: 10}
            },
        'Target': {
            'a Facility': 0,
            'Public Research': -1,
            'Private Research': 1,
            'a Common Product': -1,
            'a Rare Product': 1,
            'an Employee': 0,
            'an Executive': 1,
            },
        'Duration': ('%d * 7', '%d * 14', '%d * 3', '%d * 2',
                     '%d * 2', '%d'),
        'Difficulty': {
            'a Simple': (5, -3),
            'a Very Easy': (7, -2),
            'an Easy': (9, -1),
            'a Routine': (10, 0),
            'a Medium': (14, 1),
            'a Challenging': (16, 2),
            'a Difficult': (18, 3),
            'an Arduous': (20, 4),
            },
        'Payout': (
            0,
            d6(1)*200,
            d6(2)*200,
            d6(2)*400,
            d6(2)*600,
            d6(3)*600,
            d6(2)*1000,
            d6(3)*1000,
            d6(3)*2000,
            d6(3)*5000,
            d6(4)*5000,
            d6(2)*10000,
            d6(3)*10000,
            d6(1)*50000,
            ),
        },
    }


def cap(n, b, t):
    n = max(b, n)
    n = min(t, n)
    return n


class Mission(object):

    def __init__(self, character, mission="Espionage", show_hist=False):
        self.hist = []
        self.show_hist = show_hist
        self.char = character
        self.mission = mission if mission else choice(MISSION.keys())
        self.data = MISSION[self.mission]
        self.conduct()

    def __repr__(self):
        D = {"name": "Operative " + self.char.name.split(",")[0],
             "type": self.mtype,
             "target": self.target,
             "interp": " Interplanetary" if self.interplanetary == 2 else "",
             "dur": self.duration,
             "dif": self.difficulty
             }
        o = ["%(name)s conducted %(dif)s%(interp)s %(type)s against %(target)s in %(dur)d days." % D]
        if self.show_hist:
            o += self.hist
        if self.success:
            o += ["The mission was a success. The payout is %d Credits." % self.result]
        else:
            o += ["The mission was a failure. Rolled [%d] on the mishap table." % self.result]
        return "\n".join(o)

    def conduct(self):
        # type
        self.mtype = choice(self.data['Type'].keys())
        if self.mission == "Espionage":
            skills = self.data['Type'][self.mtype]
        elif self.mission == "Anti-corporate":
            skills = sample(self.char.skills.keys(),
                            self.data['Type'][self.mtype])
        # target
        self.target = choice(self.data['Target'].keys())
        t_mod = self.data['Target'][self.target]
        # difficulty
        dif = cap(d6(1) + self.data['Target'][self.target], 0, 7)
        self.difficulty = self.data['Difficulty'].keys()[dif]
        # duration
        self.interplanetary = choice((1, 2))
        days = self.data['Duration'][d6(1)-1] % d6(1)
        self.duration = eval(days) * self.interplanetary
        # Success/Failure
        target, d_mod = self.data['Difficulty'][self.difficulty]
        effect = 0
        for sk in skills:
            effect += self.effect_roll(sk, mod=d_mod)
        self.success = True if effect >= target else False
        self.hist += ["[Achieved effect %d against target %d.]" % (effect, target)]
        # Payout/Mishap
        mods = d_mod + t_mod
        payout = cap(d6(2) + mods, 0, 12)
        if self.success:
            self.result = self.data['Payout'][payout]
        else:
            self.result = cap(d6(2) + mods + min(effect, 0), 0, 11)

    def effect_roll(self, skill, mod):
        skill = skill.split(" (")[0]
        attrs = {
            'Athletics': 'Dex',
            'Gun Combat': 'Dex',
            'Stealth': 'Dex',
            'Admin': 'Soc',
            'Carouse': 'Soc',
            'Persuade': 'Soc',
            'Streetwise': 'Int',
            'Deception': 'Int',
            'Recon': 'Int',
            'Investigate': 'Int',
            'Advocate': 'Edu',
            'Explosives': 'Edu',
            'Computers': 'Edu',
            'Trade': 'Edu',
            }
        s_dm = self.char.skills[skill]
        a_dm = self.char.stats[attrs[skill]]()
        r = d6(2)
        total = r + s_dm + a_dm + mod
        r = (r, skill, s_dm, attrs[skill], a_dm, mod, total)
        if total >= 8:
            self.hist += ["[SUCCESS: %d + %s [%d] + %s [%d] + DM [%d] = %d]" % r]
        else:
            self.hist += ["[FAILURE: %d + %s [%d] + %s [%d] + DM [%d] = %d]" % r]
        return total - 8
