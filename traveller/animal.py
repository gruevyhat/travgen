#!/usr/bin/python


# UNDER CONSTRUCTION

from attributes import SkillSet, Stats
from dice import d6, d3, d100, sample1


TERRAIN_DM = {
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
    "Deep_Ocean": (4, 2, (("S", 8), ("S", 6), ("S", 4), ("S", 2), ("S", -2))),
    }

ANIMAL_TYPE = (
    # 2d6: (Herbivore, Omnivore, Carnivore, Scavenger)
    ("Filter", "Gatherer", "Pouncer", "Carrion-Eater"),
    ("Filter", "Eater", "Siren", "Reducer"),
    ("Intermittent", "Gatherer", "Pouncer", "Hijacker"),
    ("Intermittent", "Eater", "Killer", "Carrion-Eater"),
    ("Intermittent", "Gatherer", "Trapper", "Intimidator"),
    ("Intermittent", "Hunter", "Pouncer", "Reducer"),
    ("Grazer", "Hunter", "Chaser", "Carrion-Eater"),
    ("Grazer", "Hunter", "Chaser", "Reducer"),
    ("Grazer", "Gatherer", "Chaser", "Hijacker"),
    ("Grazer", "Eater", "Killer", "Intimidator"),
    ("Grazer", "Hunter", "Chaser", "Reducer"),
    ("Grazer", "Gatherer", "Siren", "Hijacker"),
    ("Grazer", "Gatherer", "Chaser", "Intimidator"),
    )

SIZE = (
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
    "Carrion-Eater": (("Instinct", 2)),
    "Chaser": (("Dexterity", 4), ("Instinct", 2), ("Pack", 2)),
    "Eater": (("Endurance", 4), ("Pack", 2)),
    "Filter": (("Endurance", 4)),
    "Gatherer": (("Stealth", 0), ("Pack", 2)),
    "Grazer": (("Instinct", 2), ("Pack", 4)),
    "Hunter": (("Survival", 0), ("Instinct", 2)),
    "Hijacker": (("Strength", 2), ("Pack", 2)),
    "Intimidator": (("Persuade", 0)),
    "Killer, Brute": (("Melee", 0), ("Strength", 4), ("Instinct", 4), ("Pack", -2)),
    "Killer, Swift": (("Melee", 0), ("Dexterity", 4), ("Instinct", 4), ("Pack", -2)),
    "Intermittent": (("Pack", 4)),
    "Pouncer": (("Stealth", 0), ("Recon", 0), ("Athletics", 0), ("Dexterity", 4), ("Instinct", 4)),
    "Reducer": (("Pack", 4)),
    "Siren": (("Pack", -4)),
    "Trapper": (("Pack", -2)),
    }


CREATURE = {
    "Scavenger": (11, 0),
    "Omnivore": (38, 4),
    "Herbivore": (83, 8),
    "Carnivore": (100, -6)
    }

#   Base attrib
#   -> Str, Dex, End, Int, Instinct, Pack
#   Base skills
#   -> Survival 0, Athletics 0, Recon 0, Melee (natural weapons) 0
#   Rand Creature type
#   Rand Terrain type
#   -> mvmt d6(1)
#       -> size d6(2) + Terrain + Mvmt
#   Animal type d6(2) + Terrain
#   -> behavior skills
#   -> +d6(1) skills
#   Sample 1d6 (w/repl) quirks


STARTING_SKILLS = {"Survival": 0, "Athletics": 0,
                   "Recon": 0, "Melee (natural weapons)": 0}


class Animal(object):

    def __init__(self):
        self.stats = Stats(animal=True)
        self.skills = SkillSet(STARTING_SKILLS)

    def set_skills(self):
        pass



