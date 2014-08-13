#!/usr/bin/python


# UNDER CONSTRUCTION

from attributes import SkillSet, Stats, STATS
from dice import d6, d3, d100, sample1


TERRAIN = {
    # Terrain Type: (DM, Size DM, (1, 2, 3, 4, 5, 6))
    "Clear": (3, 0, (("W", 0), ("W", 0), ("W", 0), ("W", 0), ("W", 2), ("F", -6))),
    "Plain/Prairie": (4, 0, (("W", 0), ("W", 0), ("W", 0), ("W", 2), ("W", 4), ("F", -6))),
    "Desert": (3, -3, (("W", 0), ("W", 0), ("W", 0), ("W", 0), ("F", -4), ("F", -6))),
    "Hills": (0, 0, (("W", 0), ("W", 0), ("W", 0), ("W", 2), ("F", -4), ("F", -6))),
    "Mountain": (0, 0, (("W", 0), ("W", 0), ("W", 0), ("F", -2), ("F", -4), ("F", -6))),
    "Forest": (-4, -4, (("W", 0), ("W", 0), ("W", 0), ("W", 0), ("F", -4), ("F", -6))),
    "Woods": (-2, -1, (("W", 0), ("W", 0), ("W", 0), ("W", 0), ("W", 0), ("F", -6))),
    "Jungle": (-4, -3, (("W", 0), ("W", 0), ("W", 0), ("W", 0), ("W", 2), ("F", -6))),
    "Rainforest": (-2, -2, (("W", 0), ("W", 0), ("W", 0), ("W", 2), ("W", 4), ("F", -6))),
    "Rough": (-3, -3, (("W", 0), ("W", 0), ("W", 0), ("W", 2), ("F", -4), ("F", -6))),
    "Swamp": (-2, 4, (("S", -6), ("A", 2), ("W", 0), ("W", 0), ("F", -4), ("F", -6))),
    "Beach": (3, 2, (("S", 1), ("A", 2), ("W", 0), ("W", 0), ("F", -4), ("F", -6))),
    "Riverbank": (1, 1, (("S", -4), ("A", 0), ("W", 0), ("W", 0), ("W", 0), ("F", -6))),
    "Ocean_Shallows": (4, 1, (("S", 4), ("S", 2), ("S", 0), ("S", 0), ("F", -4), ("F", -6))),
    "Open_Ocean": (4, -4, (("S", 6), ("S", 4), ("S", 2), ("S", 0), ("F", -4), ("F", -6))),
    "Deep_Ocean": (4, 2, (("S", 8), ("S", 6), ("S", 4), ("S", 2), ("S", 0), ("S", -2))),
    }

ANIMAL_TYPES = (
    # 2d6: (Herbivore, Omnivore, Carnivore, Scavenger)
    ("Filter", "Gatherer", "Pouncer", "Carrion-Eater"),
    ("Filter", "Eater", "Siren", "Reducer"),
    ("Intermittent", "Gatherer", "Pouncer", "Hijacker"),
    ("Intermittent", "Eater", "Killer, Brute", "Carrion-Eater"),
    ("Intermittent", "Gatherer", "Trapper", "Intimidator"),
    ("Intermittent", "Hunter", "Pouncer", "Reducer"),
    ("Grazer", "Hunter", "Chaser", "Carrion-Eater"),
    ("Grazer", "Hunter", "Chaser", "Reducer"),
    ("Grazer", "Gatherer", "Chaser", "Hijacker"),
    ("Grazer", "Eater", "Killer, Swift", "Intimidator"),
    ("Grazer", "Hunter", "Chaser", "Reducer"),
    ("Grazer", "Gatherer", "Siren", "Hijacker"),
    ("Grazer", "Gatherer", "Chaser", "Intimidator"),
    )

SIZES = (
    # 2d6: (Weight (kg), Strength, Dexterity, Endurance)
    (1, 1, d6(1), 1),
    (3, 2, d6(1), 2),
    (6, d6(1), d6(2), d6(1)),
    (12, d6(1), d6(2), d6(1)),
    (25, d6(2), d6(3), d6(2)),
    (50, d6(2), d6(4), d6(2)),
    (100, d6(3), d6(3), d6(3)),
    (200, d6(3), d6(3), d6(3)),
    (400, d6(4), d6(2), d6(4)),
    (800, d6(4), d6(2), d6(4)),
    (1600, d6(5), d6(2), d6(5)),
    (3200, d6(6), d6(1), d6(6)),
    (5000, d6(7), d6(1), d6(7)),
    )

WEAPONS = (
    ("None", 0),
    ("Teeth", 0),
    ("Horns", 0),
    ("Hooves", 0),
    ("Hooves_and_Teeth", 0),
    ("Teeth", 0),
    ("Claws", 1),
    ("Stinger", 1),
    ("Thrasher", 1),
    ("Claws_and_Teeth", 2),
    ("Claws", 2),
    ("Teeth", 2),
    ("Thrasher", 2),
    )

ARMOR = (0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5)


def damage(x):
    return d6(x//10 + 1)


def encountered(pack):
    size = {0: 1, 1: d3(1), 3: d6(1), 6: d6(2), 9: d6(3), 12: d6(4), 15: d6(5)}
    for s, n in size.items():
        if pack <= s:
            return n


QUIRKS = {
    "Sensory Quirk": ("Sees in infrared",
                      "Multiple eyes ",
                      "Sensitive cilia or hairs",
                      "Echolocation",
                      "Symbiosis with a hunter or pilot animal",
                      "Sensitive sense of smell"),
    "Defence Quirk": ("Armoured shell",
                      "Screeches for aid ",
                      "Reacts to attack with attack",
                      "Camouflage",
                      "Avoids or mitigates attacks ",
                      "Inflates"),
    "Nesting Quirk": ("Digs burrows",
                      "Nests in trees",
                      "Hides stocks of food",
                      "Steals nests",
                      "Builds nests from organic material",
                      "Fortifies nests"),
    "Locomotion Quirk": ("Six limbs",
                         "Gasbags",
                         "Crawls on webbing",
                         "Slime",
                         "Hijacks the bodies of other creatures",
                         "A prehensile body part not normally prehensile"),
    "Reproduction Quirk": ("Lays eggs",
                           "Lays thousands of spawn",
                           "Males gestate young",
                           "Multiple sexes",
                           "Young grow inside adult, released on death",
                           "Can change gender"),
    "Attack Quirk": ("Acid spit",
                     "Strangling tentacles",
                     "Primitive tools",
                     "Spiked tail or bill",
                     "Electricity",
                     "Poison"),
    }

BEHAVIORS = {
    "Carrion-Eater": (("Ins", 2),),
    "Chaser": (("Dex", 4), ("Ins", 2), ("Pac", 2)),
    "Eater": (("End", 4), ("Pac", 2)),
    "Filter": (("End", 4),),
    "Gatherer": (("Stealth", 0), ("Pac", 2)),
    "Grazer": (("Ins", 2), ("Pac", 4)),
    "Hunter": (("Survival", 0), ("Ins", 2)),
    "Hijacker": (("Str", 2), ("Pac", 2)),
    "Intimidator": (("Persuade", 0),),
    "Killer, Brute": (("Melee", 0), ("Str", 4), ("Ins", 4), ("Pac", -2)),
    "Killer, Swift": (("Melee", 0), ("Dex", 4), ("Ins", 4), ("Pac", -2)),
    "Intermittent": (("Pac", 4),),
    "Pouncer": (("Stealth", 0), ("Recon", 0), ("Athletics", 0), ("Dex", 4), ("Ins", 4)),
    "Reducer": (("Pac", 4),),
    "Siren": (("Pac", -4),),
    "Trapper": (("Pac", -2),),
    }


ORDERS = (
    (11, "Scavenger", 0),
    (38, "Omnivore", 4),
    (83, "Herbivore", 8),
    (100, "Carnivore", -6)
    )

STARTING_SKILLS = {"Survival": 0, "Athletics": 0,
                   "Recon": 0, "Melee (natural weapons)": 0}


class Animal(object):

    def __init__(self):
        self.stats = Stats(animal=True)
        self.skills = SkillSet(STARTING_SKILLS)
        self.dms = {"armor": 0,
                    "weapon": 0,
                    "type": 0,
                    "size": 0}
        self.get_creature_type()
        self.get_terrain()
        self.get_behavior()
        self.get_skills()

    def get_creature_type(self):
        r = d100(1)
        for o in ORDERS:
            if r <= o[0]:
                self.order = o[1]
                self.dms["armor"] += o[2]
                self.dms["weapon"] += o[2]

    def get_terrain(self):
        t = sample1(TERRAIN)
        m = d6(1)-1
        self.movement = TERRAIN[t][2][m][0]
        self.dms["type"] += TERRAIN[t][0]
        self.dms["size"] += TERRAIN[t][1] + TERRAIN[t][2][m][1]

    def get_behavior(self):
        r = d6(2) + self.dms["type"]
        r = 13 if r > 13 else r
        r = 1 if r < 1 else r
        orders = {"Herbivore": 0, "Omnivore": 1,
                  "Carnivore": 2, "Scavenger": 3}
        print r, len(ANIMAL_TYPES)
        for a in range(len(ANIMAL_TYPES)):
            if r <= a:
                self.behavior = ANIMAL_TYPES[r][orders[self.order]]

    def get_skills(self):
        print BEHAVIORS[self.behavior]
        for b in BEHAVIORS[self.behavior]:
            attr, n = b
            if attr in STATS:
                self.stats[attr] += n
            else:
                self.skills.learn({attr: n})

#   Animal type d6(2) + Terrain
#   -> behavior skills
#   -> +d6(1) skills
#   Sample 1d6 (w/repl) quirks


if __name__ == "__main__":

    a = Animal()
