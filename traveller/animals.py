#!/usr/bin/python


# UNDER CONSTRUCTION


from dice import d6


TERRAIN_DM = {
    # Terrain Type: (DM, Size DM, (1, 2, 3, 4, 5, 6))
    "Clear": (3, None, (("W", 0), ("W", 0), ("W", 0), ("W", 0), ("W", 2), ("F", -6))),
    "Plain/Prairie": (4, None, (("W", 0), ("W", 0), ("W", 0), ("W", 2), ("W", 4), ("F", -6))),
    "Desert": (3, -3, (("W", 0), ("W", 0), ("W", 0), ("W", 0), ("F", -4), ("F", -6))),
    "Hills": (None, None, (("W", 0), ("W", 0), ("W", 0), ("W", 2), ("F", -4), ("F", -6))),
    "Mountain": (None, None, (("W", 0), ("W", 0), ("W", 0), ("F", -2), ("F", -4), ("F", -6))),
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

ANIMAL_TYPE = {
    # 2d6: (Herbivore, Omnivore, Carnivore, Scavenger)
    1: ("Filter", "Gatherer", "Pouncer", "Carrion-Eater"),
    2: ("Filter", "Eater", "Siren", "Reducer"),
    3: ("Intermittent", "Gatherer", "Pouncer", "Hijacker"),
    4: ("Intermittent", "Eater", "Killer", "Carrion-Eater"),
    5: ("Intermittent", "Gatherer", "Trapper", "Intimidator"),
    6: ("Intermittent", "Hunter", "Pouncer", "Reducer"),
    7: ("Grazer", "Hunter", "Chaser", "Carrion-Eater"),
    8: ("Grazer", "Hunter", "Chaser", "Reducer"),
    9: ("Grazer", "Gatherer", "Chaser", "Hijacker"),
    10: ("Grazer", "Eater", "Killer", "Intimidator"),
    11: ("Grazer", "Hunter", "Chaser", "Reducer"),
    12: ("Grazer", "Gatherer", "Siren", "Hijacker"),
    13: ("Grazer", "Gatherer", "Chaser", "Intimidator"),
    }

SIZE = {
    # 2d6: (Weight (kg), Strength, Dexterity, Endurance)
    1: (1, 1, d6(1), 1),
    2: (3, 2, d6(1), 2),
    3: (6, d6(1), d6(2), d6(1)),
    4: (12, d6(1), d6(2), d6(1)),
    5: (25, d6(2), d6(3), d6(2)),
    6: (50, d6(2), d6(4), d6(2)),
    7: (100, d6(3), d6(3), d6(3)),
    8: (200, d6(3), d6(3), d6(3)),
    9: (400, d6(4), d6(2), d6(4)),
    10: (800, d6(4), d6(2), d6(4)),
    11: (1600, d6(5), d6(2), d6(5)),
    12: (3200, d6(6), d6(1), d6(6)),
    13: (5000, d6(7), d6(1), d6(7)),
    }

WEAPONS TABLE ARMOUR TABLE
# 2d6 Weapons 2d6 Armour
1 None 0 1 0
2 Teeth 0 2 0
3 Horns 0 3 0
4 Hooves 0 4 1
5 Hooves_and_Teeth 0 5 1
6 Teeth 0 6 2
7 Claws 1 7 2
8 Stinger 1 8 3
9 Thrasher 1 9 3
10 Claws_and_Teeth 2 10 4
11 Claws 2 11 4
12 Teeth 2 12 5
13 Thrasher 2 13 5
