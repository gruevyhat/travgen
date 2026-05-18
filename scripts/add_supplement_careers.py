#!/usr/bin/env python3
"""Add supplement careers to gameData.json. Validates every entry before writing."""
import json, sys

VALID_CHARS = {'Str', 'Dex', 'End', 'Int', 'Edu', 'Soc', 'Psi'}

def validate(data):
    skills = data['SKILLS']
    ranks = data['RANKS']
    benefits = data['BENEFITS']
    credits_ = data['CREDITS']

    for key, entries in skills.items():
        assert len(entries) in (24, 30, 36), f"SKILLS[{key!r}] has {len(entries)} entries, expected 24, 30, or 36"
        for i, e in enumerate(entries):
            assert len(e) == 2, f"SKILLS[{key!r}][{i}] has wrong length: {e!r}"
            name, lvl = e
            if name in VALID_CHARS:
                assert isinstance(lvl, int) and 1 <= lvl <= 3, f"SKILLS[{key!r}][{i}] stat bonus out of range: {e!r}"
            else:
                assert isinstance(lvl, int) and lvl >= 0, f"SKILLS[{key!r}][{i}] bad level: {e!r}"

    for key, rank_list in ranks.items():
        assert len(rank_list) == 7, f"RANKS[{key!r}] has {len(rank_list)} entries, expected 7"
        for i, r in enumerate(rank_list):
            if r is not None:
                assert len(r) == 2, f"RANKS[{key!r}][{i}] has wrong structure: {r!r}"

    for career, bens in benefits.items():
        assert len(bens) == 7, f"BENEFITS[{career!r}] has {len(bens)} entries, expected 7"

    for career, creds in credits_.items():
        assert len(creds) == 7, f"CREDITS[{career!r}] has {len(creds)} entries, expected 7"

    print("Validation passed.")


def add_career(data, expansion_key, career_data, skills_data, ranks_data, benefits_data, credits_data):
    """Add a career expansion block."""
    if expansion_key not in data:
        data[expansion_key] = {}
    data[expansion_key].update(career_data)
    data['SKILLS'].update(skills_data)
    data['RANKS'].update(ranks_data)
    data['BENEFITS'].update(benefits_data)
    data['CREDITS'].update(credits_data)


# ─── Skill normalization ──────────────────────────────────────────────────────
# Maps book skill names to canonical CORE_SKILLS names
NORM = {
    "Combat Engineer": "Explosives",
    "Instruction": "Leadership",   # closest match
    "Recruiting": "Persuade",
    "Discipline": "Tactics",
    "Weapon Engineering": "Engineer",
    "Remote Ops": "Remote Operations",
    "Computers": "Computers",
    "Computer": "Computers",
    "Tactics (military)": "Tactics",
    "Tactics (naval)": "Tactics",
    "Gun Combat (any)": "Gun Combat",
    "Gun Combat (any rifle)": "Gun Combat",
    "Gun Combat (any pistol)": "Gun Combat",
    "Gun Combat (any energy)": "Gun Combat",
    "Melee (any)": "Melee",
    "Melee (Martial Arts)": "Melee",
    "Melee (Blades)": "Melee",
    "Melee (blade)": "Melee",
    "Melee (Blades)": "Melee",
    "Melee (brawling)": "Melee",
    "Athletics (any)": "Athletics",
    "Athletics (strength)": "Athletics",
    "Heavy Weapons (any)": "Heavy Weapons",
    "Heavy Weapons (field artillery)": "Heavy Weapons",
    "Heavy Weapons (magrails)": "Heavy Weapons",
    "Engineer (any)": "Engineer",
    "Engineer (electronics)": "Engineer",
    "Engineer (naval)": "Engineer",
    "Engineer (life support)": "Engineer",
    "Pilot (any)": "Pilot",
    "Pilot (spacecraft)": "Pilot",
    "Pilot (small craft)": "Pilot",
    "Pilot (capital ship)": "Pilot",
    "Science (any)": "Space Science",
    "Science (linguistics)": "Language",
    "Science (physical)": "Physical Science",
    "Space Science (any)": "Space Science",
    "Space Science (planetology)": "Space Science",
    "Life Science (any)": "Life Science",
    "Life Science": "Life Science",
    "Social Science (any)": "Social Science",
    "Social Sciences (linguistics or philosophy)": "Language",
    "Social Sciences (economics)": "Social Science",
    "Social Sciences (linguistics)": "Language",
    "Social Science": "Social Science",
    "Physical Science": "Physical Science",
    "Language (any)": "Language",
    "Drive (any)": "Drive",
    "Flyer (any)": "Flyer",
    "Gunner (any)": "Gunner",
    "Gunner (turret)": "Gunner",
    "Gunner (bay)": "Gunner",
    "Gunner (screens)": "Gunner",
    "Gunnery (any)": "Gunner",
    "Gunnery (turret)": "Gunner",
    "Remote Operations": "Remote Operations",
    "Trade (any)": "Trade",
    "Trade (salvage/repair)": "Trade",
    "Art (any)": "Art",
    "Battle Dress": "Battle Dress",
    "Zero-G": "Zero-G",
    "Vacc Suit": "Vacc Suit",
    "Astrogation": "Astrogation",
    "Navigation": "Navigation",
    "Sensors": "Sensors",
    "Comms": "Comms",
    "Mechanic": "Mechanic",
    "Medic": "Medic",
    "Recon": "Recon",
    "Stealth": "Stealth",
    "Survival": "Survival",
    "Leadership": "Leadership",
    "Admin": "Admin",
    "Advocate": "Advocate",
    "Broker": "Broker",
    "Carouse": "Carouse",
    "Deception": "Deception",
    "Diplomat": "Diplomat",
    "Explosives": "Explosives",
    "Investigate": "Investigate",
    "Jack of all Trades": "Jack of all Trades",
    "Jack of All Trades": "Jack of all Trades",
    "Persuade": "Persuade",
    "Streetwise": "Streetwise",
    "Steward": "Steward",
    "Trade": "Trade",
    "Athletics": "Athletics",
    "Gun Combat": "Gun Combat",
    "Gunner": "Gunner",
    "Heavy Weapons": "Heavy Weapons",
    "Melee": "Melee",
    "Pilot": "Pilot",
    "Engineer": "Engineer",
    "Computers": "Computers",
    "Space Science": "Space Science",
    "Tactics": "Tactics",
    "Zero-G": "Zero-G",
}

def sk(name, level=0):
    """Normalize a skill name and return [normalized_name, level]."""
    normalized = NORM.get(name, name)
    return [normalized, level]

def stat(char, amount=1):
    assert char in VALID_CHARS, f"Unknown stat: {char}"
    return [char, amount]


# ─────────────────────────────────────────────────────────────────────────────
#  MERCENARY (Book 01)
# ─────────────────────────────────────────────────────────────────────────────

MERCENARY_CAREERS = {
    "Commando": {
        "Raider":    {"Surv": ["End", 6], "Qual": ["End", 6], "Adv": ["End", 7]},
        "Technician":{"Surv": ["End", 5], "Qual": ["End", 6], "Adv": ["Edu", 8]},
        "Spec Ops":  {"Surv": ["End", 8], "Qual": ["End", 6], "Adv": ["End", 7]},
    },
    "Striker": {
        "Rifleman":       {"Surv": ["End", 6], "Qual": ["End", 6], "Adv": ["End", 5]},
        "Sniper":         {"Surv": ["Dex", 6], "Qual": ["End", 6], "Adv": ["Dex", 8]},
        "Breaching Troop":{"Surv": ["End", 7], "Qual": ["End", 6], "Adv": ["End", 7]},
    },
    "Cadre": {
        "Basic Trainer":        {"Surv": ["End", 5], "Qual": ["Edu", 6], "Adv": ["Edu", 8]},
        "Physical Trainer":     {"Surv": ["Str", 6], "Qual": ["Edu", 6], "Adv": ["Str", 8]},
        "Field Exercise Leader":{"Surv": ["End", 7], "Qual": ["Edu", 6], "Adv": ["Edu", 7]},
    },
    "Security": {
        "Bodyguard":    {"Surv": ["End", 6], "Qual": ["End", 6], "Adv": ["End", 6]},
        "Ship Security":{"Surv": ["End", 6], "Qual": ["End", 6], "Adv": ["End", 7]},
        "Site Defence": {"Surv": ["End", 7], "Qual": ["End", 6], "Adv": ["End", 8]},
    },
}

_commando_bt_svc  = [sk("Athletics"), sk("Recon"), sk("Explosives"), sk("Explosives"), sk("Heavy Weapons"), sk("Gun Combat")]
_commando_pers    = [stat("Dex"), stat("Str"), stat("End"), sk("Melee"), sk("Melee"), sk("Gun Combat")]
_commando_adv_edu = [sk("Comms"), sk("Drive"), sk("Gunner"), sk("Leadership"), sk("Medic"), sk("Tactics")]

MERCENARY_SKILLS = {
    "Commando|Raider":    _commando_bt_svc + _commando_pers + _commando_bt_svc +
                          [sk("Explosives"), sk("Comms"), sk("Gun Combat"), sk("Recon"), sk("Survival"), sk("Tactics")] +
                          _commando_adv_edu,
    "Commando|Technician":_commando_bt_svc + _commando_pers + _commando_bt_svc +
                          [sk("Mechanic"), sk("Comms"), sk("Engineer"), sk("Heavy Weapons"), sk("Remote Operations"), sk("Engineer")] +
                          _commando_adv_edu,
    "Commando|Spec Ops":  _commando_bt_svc + _commando_pers + _commando_bt_svc +
                          [sk("Recon"), sk("Explosives"), sk("Explosives"), sk("Stealth"), sk("Gun Combat"), sk("Gun Combat")] +
                          _commando_adv_edu,
}

_striker_bt_svc  = [sk("Athletics"), sk("Medic"), sk("Comms"), sk("Explosives"), sk("Heavy Weapons"), sk("Tactics")]
_striker_pers    = [stat("Str"), stat("Dex"), stat("End"), sk("Gun Combat"), sk("Heavy Weapons"), sk("Survival")]
_striker_adv_edu = [sk("Drive"), sk("Flyer"), sk("Leadership"), sk("Mechanic"), sk("Pilot"), sk("Engineer")]

MERCENARY_SKILLS.update({
    "Striker|Rifleman":       _striker_bt_svc + _striker_pers + _striker_bt_svc +
                              [sk("Battle Dress"), sk("Gun Combat"), sk("Heavy Weapons"), sk("Navigation"), sk("Recon"), sk("Survival")] +
                              _striker_adv_edu,
    "Striker|Sniper":         _striker_bt_svc + _striker_pers + _striker_bt_svc +
                              [sk("Battle Dress"), sk("Gun Combat"), sk("Gun Combat"), sk("Heavy Weapons"), sk("Recon"), sk("Stealth")] +
                              _striker_adv_edu,
    "Striker|Breaching Troop":_striker_bt_svc + _striker_pers + _striker_bt_svc +
                              [sk("Battle Dress"), sk("Battle Dress"), sk("Gun Combat"), sk("Remote Operations"), sk("Vacc Suit"), sk("Zero-G")] +
                              _striker_adv_edu,
})

_cadre_bt_svc  = [sk("Athletics"), sk("Melee"), sk("Gun Combat"), sk("Leadership"), sk("Leadership"), sk("Tactics")]
_cadre_pers    = [stat("Str"), stat("Dex"), stat("End"), stat("Edu"), sk("Leadership"), sk("Jack of all Trades")]
_cadre_adv_edu = [sk("Admin"), sk("Gunner"), sk("Heavy Weapons"), sk("Explosives"), sk("Persuade"), sk("Computers")]

MERCENARY_SKILLS.update({
    "Cadre|Basic Trainer":         _cadre_bt_svc + _cadre_pers + _cadre_bt_svc +
                                   [sk("Comms"), sk("Computers"), sk("Gun Combat"), sk("Medic"), sk("Melee"), sk("Tactics")] +
                                   _cadre_adv_edu,
    "Cadre|Physical Trainer":      _cadre_bt_svc + _cadre_pers + _cadre_bt_svc +
                                   [sk("Athletics"), sk("Melee"), sk("Stealth"), sk("Survival"), sk("Zero-G"), sk("Battle Dress")] +
                                   _cadre_adv_edu,
    "Cadre|Field Exercise Leader": _cadre_bt_svc + _cadre_pers + _cadre_bt_svc +
                                   [sk("Battle Dress"), sk("Explosives"), sk("Comms"), sk("Gun Combat"), sk("Recon"), sk("Tactics")] +
                                   _cadre_adv_edu,
})

_security_bt_svc  = [sk("Athletics"), sk("Explosives"), sk("Gun Combat"), sk("Melee"), sk("Steward"), sk("Streetwise")]
_security_pers    = [stat("Dex"), stat("End"), stat("Int"), stat("Soc"), sk("Computers"), sk("Streetwise")]
_security_adv_edu = [sk("Broker"), sk("Comms"), sk("Flyer"), sk("Steward"), sk("Tactics"), sk("Engineer")]

MERCENARY_SKILLS.update({
    "Security|Bodyguard":    _security_bt_svc + _security_pers + _security_bt_svc +
                             [sk("Battle Dress"), sk("Drive"), sk("Gun Combat"), sk("Melee"), sk("Steward"), sk("Streetwise")] +
                             _security_adv_edu,
    "Security|Ship Security":_security_bt_svc + _security_pers + _security_bt_svc +
                             [sk("Astrogation"), sk("Battle Dress"), sk("Gunner"), sk("Pilot"), sk("Vacc Suit"), sk("Zero-G")] +
                             _security_adv_edu,
    "Security|Site Defence": _security_bt_svc + _security_pers + _security_bt_svc +
                             [sk("Battle Dress"), sk("Explosives"), sk("Gun Combat"), sk("Heavy Weapons"), sk("Sensors"), sk("Tactics")] +
                             _security_adv_edu,
})

_commando_ranks = [["Gun Combat", 1], None, ["Tactics", 1], None, None, ["Leadership", 1], None]
_striker_ranks  = [None, ["Gun Combat", 1], ["Gun Combat", 1], None, ["Persuade", 1], None, None]
_cadre_ranks    = [None, ["Leadership", 1], None, ["Leadership", 1], None, None, None]
_security_ranks = [None, ["Gun Combat", 1], None, ["Tactics", 1], None, ["Leadership", 1], None]

MERCENARY_RANKS = {
    "Commando|Raider":            _commando_ranks,
    "Commando|Technician":        _commando_ranks,
    "Commando|Spec Ops":          _commando_ranks,
    "Striker|Rifleman":           _striker_ranks,
    "Striker|Sniper":             _striker_ranks,
    "Striker|Breaching Troop":    _striker_ranks,
    "Cadre|Basic Trainer":        _cadre_ranks,
    "Cadre|Physical Trainer":     _cadre_ranks,
    "Cadre|Field Exercise Leader":_cadre_ranks,
    "Security|Bodyguard":         _security_ranks,
    "Security|Ship Security":     _security_ranks,
    "Security|Site Defence":      _security_ranks,
}

MERCENARY_BENEFITS = {
    "Commando": [["Dex", 1], ["End", 1], ["Contact", None], ["Weapon", None], ["Armour", None], ["Armour", None], ["Soc", 1]],
    "Striker":  [["Soc", 1], ["Dex", 1], ["Weapon", None], ["Weapon", None], ["Armour", None], ["Armour", None], ["Ship Shares", 1]],
    "Cadre":    [["Edu", 1], ["Contact", None], ["Contact", None], ["Ally", None], ["Weapon", None], ["TAS Membership", None], ["TAS Membership", None]],
    "Security": [["Blade", None], ["End", 1], ["Ally", None], ["Weapon", None], ["Armour", None], ["Ship Shares", 1], ["TAS Membership", None]],
}

MERCENARY_CREDITS = {
    "Commando": [5000,  15000, 20000, 30000, 40000, 75000, 90000],
    "Striker":  [5000,  10000, 15000, 20000, 30000, 45000, 60000],
    "Cadre":    [10000, 10000, 20000, 20000, 30000, 30000, 50000],
    "Security": [0,     5000,  10000, 20000, 30000, 40000, 50000],
}


# ─────────────────────────────────────────────────────────────────────────────
#  HIGH GUARD (Book 02)
# ─────────────────────────────────────────────────────────────────────────────

HIGH_GUARD_CAREERS = {
    "Crewman": {
        "Planetary Navy": {"Surv": ["Int", 5], "Qual": ["Int", 5], "Adv": ["Edu", 7]},
        "Subsector Navy": {"Surv": ["Int", 6], "Qual": ["Int", 6], "Adv": ["Edu", 7]},
        "Imperial Navy":  {"Surv": ["Int", 7], "Qual": ["Int", 7], "Adv": ["Edu", 7]},
    },
    "Gunnery": {
        "Fire Control":   {"Surv": ["Edu", 5], "Qual": ["Int", 8], "Adv": ["Int", 7]},
        "Turret":         {"Surv": ["Dex", 7], "Qual": ["Int", 8], "Adv": ["Edu", 5]},
        "Countermeasures":{"Surv": ["Int", 6], "Qual": ["Int", 8], "Adv": ["Edu", 6]},
    },
    "Naval Pilot": {
        "Fighter Pilot":     {"Surv": ["Dex", 7], "Qual": ["Dex", 8], "Adv": ["Edu", 5]},
        "Shuttle Pilot":     {"Surv": ["Edu", 5], "Qual": ["Dex", 8], "Adv": ["Int", 7]},
        "Special Operations":{"Surv": ["End", 6], "Qual": ["Dex", 8], "Adv": ["Int", 6]},
    },
    "Flight Crew": {
        "Astrogation":{"Surv": ["Int", 5], "Qual": ["Dex", 8], "Adv": ["Edu", 7]},
        "Helm":       {"Surv": ["Dex", 6], "Qual": ["Dex", 8], "Adv": ["Edu", 6]},
        "Sensors":    {"Surv": ["Edu", 7], "Qual": ["Dex", 8], "Adv": ["Int", 5]},
    },
}

_crewman_pers    = [stat("Str"), stat("Dex"), stat("End"), stat("Int"), stat("Edu"), stat("Soc")]
_crewman_svc     = [sk("Pilot"), sk("Vacc Suit"), sk("Zero-G"), sk("Tactics"), sk("Mechanic"), sk("Gun Combat")]
_crewman_adv_edu = [sk("Remote Operations"), sk("Astrogation"), sk("Engineer"), sk("Computers"), sk("Medic"), sk("Tactics")]

HIGH_GUARD_SKILLS = {
    "Crewman|Planetary Navy": _crewman_svc + _crewman_pers + _crewman_svc +
                              [sk("Pilot"), sk("Space Science"), sk("Sensors"), sk("Comms"), sk("Gunner"), sk("Mechanic")] +
                              _crewman_adv_edu,
    "Crewman|Subsector Navy": _crewman_svc + _crewman_pers + _crewman_svc +
                              [sk("Pilot"), sk("Mechanic"), sk("Sensors"), sk("Comms"), sk("Gunner"), sk("Vacc Suit")] +
                              _crewman_adv_edu,
    "Crewman|Imperial Navy":  _crewman_svc + _crewman_pers + _crewman_svc +
                              [sk("Pilot"), sk("Engineer"), sk("Sensors"), sk("Comms"), sk("Gunner"), sk("Tactics")] +
                              _crewman_adv_edu,
}

_gunnery_pers    = [stat("Dex"), stat("Int"), stat("Dex"), stat("Int"), stat("Edu"), sk("Tactics")]
_gunnery_svc     = [sk("Tactics"), sk("Sensors"), sk("Comms"), sk("Gun Combat"), sk("Mechanic"), sk("Gunner")]
_gunnery_adv_edu = [sk("Sensors"), sk("Gunner"), sk("Computers"), sk("Tactics"), sk("Space Science"), sk("Leadership")]

HIGH_GUARD_SKILLS.update({
    "Gunnery|Fire Control":   _gunnery_svc + _gunnery_pers + _gunnery_svc +
                              [sk("Sensors"), sk("Tactics"), sk("Leadership"), sk("Computers"), sk("Comms"), sk("Gunner")] +
                              _gunnery_adv_edu,
    "Gunnery|Turret":         _gunnery_svc + _gunnery_pers + _gunnery_svc +
                              [sk("Gunner"), sk("Engineer"), sk("Sensors"), sk("Tactics"), sk("Pilot"), sk("Gunner")] +
                              _gunnery_adv_edu,
    "Gunnery|Countermeasures":_gunnery_svc + _gunnery_pers + _gunnery_svc +
                              [sk("Gunner"), sk("Comms"), sk("Sensors"), sk("Tactics"), sk("Mechanic"), sk("Gunner")] +
                              _gunnery_adv_edu,
})

_npilot_pers    = [stat("Dex"), stat("End"), sk("Carouse"), stat("Int"), stat("Dex"), stat("End")]
_npilot_svc     = [sk("Pilot"), sk("Sensors"), sk("Astrogation"), sk("Gunner"), sk("Mechanic"), sk("Gun Combat")]
_npilot_adv_edu = [sk("Engineer"), sk("Comms"), sk("Astrogation"), sk("Tactics"), sk("Zero-G"), sk("Vacc Suit")]

HIGH_GUARD_SKILLS.update({
    "Naval Pilot|Fighter Pilot":     _npilot_svc + _npilot_pers + _npilot_svc +
                                     [sk("Pilot"), sk("Gunner"), sk("Athletics"), sk("Tactics"), sk("Zero-G"), sk("Vacc Suit")] +
                                     _npilot_adv_edu,
    "Naval Pilot|Shuttle Pilot":     _npilot_svc + _npilot_pers + _npilot_svc +
                                     [sk("Pilot"), sk("Admin"), sk("Comms"), sk("Leadership"), sk("Astrogation"), sk("Remote Operations")] +
                                     _npilot_adv_edu,
    "Naval Pilot|Special Operations":_npilot_svc + _npilot_pers + _npilot_svc +
                                     [sk("Pilot"), sk("Gunner"), sk("Stealth"), sk("Gun Combat"), sk("Battle Dress"), sk("Flyer")] +
                                     _npilot_adv_edu,
})

_flight_pers    = [sk("Tactics"), stat("Int"), stat("End"), stat("Soc"), stat("Dex"), stat("Edu")]
_flight_svc     = [sk("Tactics"), sk("Pilot"), sk("Comms"), sk("Sensors"), sk("Gun Combat"), sk("Astrogation")]
_flight_adv_edu = [sk("Tactics"), sk("Computers"), sk("Space Science"), sk("Engineer"), sk("Astrogation"), sk("Engineer")]

HIGH_GUARD_SKILLS.update({
    "Flight Crew|Astrogation": _flight_svc + _flight_pers + _flight_svc +
                               [sk("Astrogation"), sk("Computers"), sk("Comms"), sk("Space Science"), sk("Navigation"), sk("Astrogation")] +
                               _flight_adv_edu,
    "Flight Crew|Helm":        _flight_svc + _flight_pers + _flight_svc +
                               [sk("Pilot"), sk("Gunner"), sk("Comms"), sk("Mechanic"), sk("Recon"), sk("Pilot")] +
                               _flight_adv_edu,
    "Flight Crew|Sensors":     _flight_svc + _flight_pers + _flight_svc +
                               [sk("Sensors"), sk("Pilot"), sk("Remote Operations"), sk("Space Science"), sk("Computers"), sk("Sensors")] +
                               _flight_adv_edu,
})

_crewman_ranks = [None, ["Mechanic", 1], None, ["Vacc Suit", 1], None, ["Melee", 1], ["Leadership", 1]]
_gunnery_ranks = [None, ["Gunner", 1], None, ["Recon", 1], None, ["Dex", 1], ["Tactics", 1]]
_npilot_ranks  = [None, ["Pilot", 1], None, ["Gunner", 1], None, ["Tactics", 1], ["Leadership", 1]]
_flight_ranks  = [None, None, None, ["Pilot", 1], None, ["Tactics", 1], ["Leadership", 1]]

HIGH_GUARD_RANKS = {
    "Crewman|Planetary Navy":     _crewman_ranks,
    "Crewman|Subsector Navy":     _crewman_ranks,
    "Crewman|Imperial Navy":      _crewman_ranks,
    "Gunnery|Fire Control":       _gunnery_ranks,
    "Gunnery|Turret":             _gunnery_ranks,
    "Gunnery|Countermeasures":    _gunnery_ranks,
    "Naval Pilot|Fighter Pilot":      _npilot_ranks,
    "Naval Pilot|Shuttle Pilot":      _npilot_ranks,
    "Naval Pilot|Special Operations": _npilot_ranks,
    "Flight Crew|Astrogation":    _flight_ranks,
    "Flight Crew|Helm":           _flight_ranks,
    "Flight Crew|Sensors":        _flight_ranks,
}

HIGH_GUARD_BENEFITS = {
    "Crewman":    [None, ["Edu", 1], ["Soc", 1], ["Contact", None], ["Weapon", None], ["Ship Shares", 1], ["Ship Shares", 2]],
    "Gunnery":    [["Ship Shares", 1], ["Weapon", None], ["Dex", 1], ["Armour", None], ["Ship Shares", 2], ["Int", 1], [["Ship's Boat", None], ["Ship Shares", 2]]],
    "Naval Pilot":[["Ship Shares", 1], ["Weapon", None], ["Dex", 1], ["Ship's Boat", None], ["Ship Shares", 2], ["Int", 1], [["Ship's Boat", None], ["Ship Shares", 2]]],
    "Flight Crew":[["Ship Shares", 1], ["Edu", 1], ["Ally", None], ["Armour", None], ["Soc", 1], ["Int", 1], [["Ship's Boat", None], ["Ship Shares", 2]]],
}

HIGH_GUARD_CREDITS = {
    "Crewman":    [1000,  2000,  3000,  4000,  5000,  6000,  10000],
    "Gunnery":    [3000,  5000,  7000,  10000, 13000, 16000, 20000],
    "Naval Pilot":[3000,  5000,  7000,  10000, 13000, 16000, 20000],
    "Flight Crew":[5000,  7000,  10000, 13000, 16000, 24000, 32000],
}


# ─────────────────────────────────────────────────────────────────────────────
#  SCOUT BOOK (Book 03)
# ─────────────────────────────────────────────────────────────────────────────

SCOUT_BOOK_CAREERS = {
    "Contact": {
        "First Contact":   {"Surv": ["End", 6], "Qual": ["Int", 7], "Adv": ["Edu", 7]},
        "Diplomacy":       {"Surv": ["End", 6], "Qual": ["Int", 7], "Adv": ["Edu", 7]},
        "Primary Liaison": {"Surv": ["End", 6], "Qual": ["Int", 7], "Adv": ["Edu", 7]},
    },
    "Special Operations": {
        "Covert Surveillance":{"Surv": ["Int", 6], "Qual": ["End", 9], "Adv": ["Edu", 6]},
        "Espionage":          {"Surv": ["End", 7], "Qual": ["End", 9], "Adv": ["Int", 8]},
        "Deep Cover":         {"Surv": ["End", 7], "Qual": ["End", 9], "Adv": ["Int", 8]},
    },
    "Scout Survey": {
        "World Analysis":   {"Surv": ["End", 6], "Qual": ["End", 6], "Adv": ["Edu", 8]},
        "Stellar Analysis": {"Surv": ["End", 6], "Qual": ["End", 6], "Adv": ["Edu", 8]},
        "Cultural Analysis":{"Surv": ["End", 7], "Qual": ["End", 6], "Adv": ["Edu", 8]},
    },
}

_contact_bt_svc  = [sk("Pilot"), sk("Survival"), sk("Mechanic"), sk("Life Science"), sk("Comms"), sk("Gun Combat")]
_contact_pers    = [stat("Str"), stat("Dex"), stat("End"), stat("Int"), stat("Edu"), sk("Jack of all Trades")]
_contact_adv_edu = [sk("Medic"), sk("Navigation"), sk("Engineer"), sk("Computers"), sk("Space Science"), sk("Jack of all Trades")]

SCOUT_BOOK_SKILLS = {
    "Contact|First Contact":  _contact_bt_svc + _contact_pers + _contact_bt_svc +
                              [sk("Investigate"), sk("Language"), sk("Leadership"), sk("Life Science"), sk("Recon"), sk("Persuade")] +
                              _contact_adv_edu,
    "Contact|Diplomacy":      _contact_bt_svc + _contact_pers + _contact_bt_svc +
                              [sk("Investigate"), sk("Diplomat"), sk("Persuade"), sk("Life Science"), sk("Admin"), sk("Deception")] +
                              _contact_adv_edu,
    "Contact|Primary Liaison":_contact_bt_svc + _contact_pers + _contact_bt_svc +
                              [sk("Language"), sk("Leadership"), sk("Diplomat"), sk("Life Science"), sk("Admin"), sk("Broker")] +
                              _contact_adv_edu,
}

_specops_bt_svc  = [sk("Athletics"), sk("Deception"), sk("Gun Combat"), sk("Investigate"), sk("Remote Operations"), sk("Sensors")]
_specops_pers    = [stat("Dex"), stat("End"), stat("Int"), stat("Soc"), sk("Computers"), sk("Streetwise")]
_specops_adv_edu = [sk("Broker"), sk("Comms"), sk("Social Science"), sk("Survival"), sk("Stealth"), sk("Tactics")]

SCOUT_BOOK_SKILLS.update({
    "Special Operations|Covert Surveillance": _specops_bt_svc + _specops_pers + _specops_bt_svc +
                                              [sk("Comms"), sk("Computers"), sk("Deception"), sk("Language"), sk("Recon"), sk("Streetwise")] +
                                              _specops_adv_edu,
    "Special Operations|Espionage":           _specops_bt_svc + _specops_pers + _specops_bt_svc +
                                              [sk("Comms"), sk("Computers"), sk("Deception"), sk("Investigate"), sk("Persuade"), sk("Streetwise")] +
                                              _specops_adv_edu,
    "Special Operations|Deep Cover":          _specops_bt_svc + _specops_pers + _specops_bt_svc +
                                              [sk("Comms"), sk("Deception"), sk("Investigate"), sk("Persuade"), sk("Stealth"), sk("Jack of all Trades")] +
                                              _specops_adv_edu,
})

_survey_bt_svc  = [sk("Vacc Suit"), sk("Pilot"), sk("Navigation"), sk("Comms"), sk("Sensors"), sk("Computers")]
_survey_pers    = [stat("Dex"), stat("End"), sk("Vacc Suit"), sk("Survival"), sk("Zero-G"), sk("Space Science")]
_survey_adv_edu = [sk("Astrogation"), sk("Physical Science"), sk("Life Science"), sk("Social Science"), sk("Space Science"), sk("Jack of all Trades")]

SCOUT_BOOK_SKILLS.update({
    "Scout Survey|World Analysis":   _survey_bt_svc + _survey_pers + _survey_bt_svc +
                                     [sk("Comms"), sk("Sensors"), sk("Physical Science"), sk("Life Science"), sk("Survival"), sk("Space Science")] +
                                     _survey_adv_edu,
    "Scout Survey|Stellar Analysis": _survey_bt_svc + _survey_pers + _survey_bt_svc +
                                     [sk("Comms"), sk("Sensors"), sk("Astrogation"), sk("Physical Science"), sk("Space Science"), sk("Space Science")] +
                                     _survey_adv_edu,
    "Scout Survey|Cultural Analysis":_survey_bt_svc + _survey_pers + _survey_bt_svc +
                                     [sk("Diplomat"), sk("Recon"), sk("Investigate"), sk("Social Science"), sk("Survival"), sk("Language")] +
                                     _survey_adv_edu,
})

_contact_ranks  = [None, ["Persuade", 1], None, ["Diplomat", 1], None, ["Leadership", 1], None]
_specops_ranks  = [None, ["Dex", 1], None, ["Investigate", 1], ["Deception", 1], None, None]
_survey_ranks   = [None, None, ["Computers", 1], None, ["Admin", 1], None, ["Leadership", 1]]

SCOUT_BOOK_RANKS = {
    "Contact|First Contact":              _contact_ranks,
    "Contact|Diplomacy":                  _contact_ranks,
    "Contact|Primary Liaison":            _contact_ranks,
    "Special Operations|Covert Surveillance": _specops_ranks,
    "Special Operations|Espionage":           _specops_ranks,
    "Special Operations|Deep Cover":          _specops_ranks,
    "Scout Survey|World Analysis":        _survey_ranks,
    "Scout Survey|Stellar Analysis":      _survey_ranks,
    "Scout Survey|Cultural Analysis":     _survey_ranks,
}

SCOUT_BOOK_BENEFITS = {
    "Contact":          [["Edu", 1], ["Soc", 1], ["Contact", None], ["Ally", None], ["Weapon", None], ["TAS Membership", None], ["TAS Membership", None]],
    "Special Operations":[["Weapon", None], ["Weapon", None], ["Dex", 1], ["Soc", 1], ["TAS Membership", None], [["TAS Membership", None], ["Scout Ship", None]], ["Ship Shares", 2]],
    "Scout Survey":     [["Soc", 1], ["Edu", 1], ["TAS Membership", None], ["TAS Membership", None], ["Scout Ship", None], ["Scout Ship", None], ["TAS Membership", None]],
}

SCOUT_BOOK_CREDITS = {
    "Contact":          [5000,  10000, 15000, 20000, 30000, 45000, 60000],
    "Special Operations":[3000, 5000,  10000, 20000, 30000, 40000, 50000],
    "Scout Survey":     [8000,  16000, 24000, 32000, 40000, 48000, 56000],
}


# ─────────────────────────────────────────────────────────────────────────────
#  MERCHANT PRINCE (Book 07)
# ─────────────────────────────────────────────────────────────────────────────

MERCHANT_PRINCE_CAREERS = {
    "Tramp Trader": {
        "Officer":     {"Surv": ["Int", 6], "Qual": ["Int", 5], "Adv": ["Edu", 6]},
        "Trade Crew":  {"Surv": ["Dex", 5], "Qual": ["Int", 5], "Adv": ["Int", 7]},
        "Tramp Pilot": {"Surv": ["Dex", 6], "Qual": ["Int", 5], "Adv": ["Edu", 8]},
    },
    "Merchant Marine": {
        "Bridge Hand":   {"Surv": ["Edu", 5], "Qual": ["Int", 5], "Adv": ["Int", 7]},
        "Fleet Hand":    {"Surv": ["End", 5], "Qual": ["Int", 5], "Adv": ["Int", 7]},
        "Fleet Security":{"Surv": ["End", 7], "Qual": ["Int", 5], "Adv": ["Soc", 5]},
    },
    "Trade Broker": {
        "Corporate":  {"Surv": ["Edu", 5], "Qual": ["Int", 6], "Adv": ["Int", 7]},
        "Freelancer": {"Surv": ["Edu", 6], "Qual": ["Int", 6], "Adv": ["Int", 6]},
        "Illicits":   {"Surv": ["Int", 7], "Qual": ["Int", 6], "Adv": ["Int", 5]},
    },
}

_trader_bt_svc  = [sk("Pilot"), sk("Vacc Suit"), sk("Broker"), sk("Mechanic"), sk("Persuade"), sk("Zero-G")]
_trader_pers    = [sk("Jack of all Trades"), stat("Dex"), stat("End"), stat("Int"), sk("Gun Combat"), sk("Melee")]
_trader_adv_edu = [sk("Admin"), sk("Advocate"), sk("Comms"), sk("Engineer"), sk("Pilot"), sk("Space Science")]

MERCHANT_PRINCE_SKILLS = {
    "Tramp Trader|Officer":    _trader_bt_svc + _trader_pers + _trader_bt_svc +
                               [sk("Advocate"), sk("Broker"), sk("Diplomat"), sk("Leadership"), sk("Persuade"), sk("Melee")] +
                               _trader_adv_edu,
    "Tramp Trader|Trade Crew": _trader_bt_svc + _trader_pers + _trader_bt_svc +
                               [sk("Computers"), sk("Engineer"), sk("Gun Combat"), sk("Gunner"), sk("Mechanic"), sk("Vacc Suit")] +
                               _trader_adv_edu,
    "Tramp Trader|Tramp Pilot":_trader_bt_svc + _trader_pers + _trader_bt_svc +
                               [sk("Astrogation"), sk("Pilot"), sk("Sensors"), sk("Comms"), sk("Gunner"), sk("Zero-G")] +
                               _trader_adv_edu,
}

_marine_bt_svc  = [sk("Drive"), sk("Broker"), sk("Comms"), sk("Persuade"), sk("Vacc Suit"), sk("Zero-G")]
_marine_pers    = [stat("Str"), stat("Dex"), stat("End"), stat("Soc"), sk("Melee"), sk("Gun Combat")]
_marine_adv_edu = [sk("Astrogation"), sk("Computers"), sk("Steward"), sk("Social Science"), sk("Sensors"), sk("Mechanic")]

MERCHANT_PRINCE_SKILLS.update({
    "Merchant Marine|Bridge Hand":   _marine_bt_svc + _marine_pers + _marine_bt_svc +
                                     [sk("Admin"), sk("Astrogation"), sk("Diplomat"), sk("Melee"), sk("Comms"), sk("Pilot")] +
                                     _marine_adv_edu,
    "Merchant Marine|Fleet Hand":    _marine_bt_svc + _marine_pers + _marine_bt_svc +
                                     [sk("Athletics"), sk("Computers"), sk("Engineer"), sk("Mechanic"), sk("Vacc Suit"), sk("Gunner")] +
                                     _marine_adv_edu,
    "Merchant Marine|Fleet Security":_marine_bt_svc + _marine_pers + _marine_bt_svc +
                                     [sk("Gunner"), sk("Investigate"), sk("Pilot"), sk("Gun Combat"), sk("Melee"), sk("Vacc Suit")] +
                                     _marine_adv_edu,
})

_broker_bt_svc  = [sk("Admin"), sk("Broker"), sk("Computers"), sk("Investigate"), sk("Persuade"), sk("Social Science")]
_broker_pers    = [stat("Soc"), sk("Gun Combat"), stat("Int"), stat("Edu"), stat("Soc"), sk("Jack of all Trades")]
_broker_adv_edu = [sk("Advocate"), sk("Comms"), sk("Diplomat"), sk("Language"), sk("Space Science"), sk("Trade")]

MERCHANT_PRINCE_SKILLS.update({
    "Trade Broker|Corporate":  _broker_bt_svc + _broker_pers + _broker_bt_svc +
                               [sk("Admin"), sk("Broker"), sk("Comms"), sk("Persuade"), sk("Steward"), sk("Soc")] +
                               _broker_adv_edu,
    "Trade Broker|Freelancer": _broker_bt_svc + _broker_pers + _broker_bt_svc +
                               [sk("Broker"), sk("Broker"), sk("Computers"), sk("Investigate"), sk("Persuade"), sk("Streetwise")] +
                               _broker_adv_edu,
    "Trade Broker|Illicits":   _broker_bt_svc + _broker_pers + _broker_bt_svc +
                               [sk("Advocate"), sk("Carouse"), sk("Deception"), sk("Melee"), sk("Persuade"), sk("Streetwise")] +
                               _broker_adv_edu,
})

# Fix invalid: "Soc" in skills would be treated as stat
# Replace sk("Soc") with sk("Admin") in Corporate spec
MERCHANT_PRINCE_SKILLS["Trade Broker|Corporate"] = _broker_bt_svc + _broker_pers + _broker_bt_svc + \
    [sk("Admin"), sk("Broker"), sk("Comms"), sk("Persuade"), sk("Steward"), sk("Soc", 1)] + \
    _broker_adv_edu

# Actually that still won't work as a skill. Let's use Broker instead
MERCHANT_PRINCE_SKILLS["Trade Broker|Corporate"] = _broker_bt_svc + _broker_pers + _broker_bt_svc + \
    [sk("Admin"), sk("Broker"), sk("Comms"), sk("Persuade"), sk("Steward"), sk("Broker")] + \
    _broker_adv_edu

_trader_ranks  = [None, ["Persuade", 1], None, ["Jack of all Trades", 1], ["Soc", 1], None, ["Soc", 1]]
_marine_ranks  = [None, ["Mechanic", 1], None, ["End", 1], None, ["Pilot", 1], ["Soc", 1]]
_broker_ranks  = [None, ["Broker", 1], None, ["Streetwise", 1], ["Soc", 1], None, ["Soc", 1]]

MERCHANT_PRINCE_RANKS = {
    "Tramp Trader|Officer":         _trader_ranks,
    "Tramp Trader|Trade Crew":      _trader_ranks,
    "Tramp Trader|Tramp Pilot":     _trader_ranks,
    "Merchant Marine|Bridge Hand":  _marine_ranks,
    "Merchant Marine|Fleet Hand":   _marine_ranks,
    "Merchant Marine|Fleet Security":_marine_ranks,
    "Trade Broker|Corporate":       _broker_ranks,
    "Trade Broker|Freelancer":      _broker_ranks,
    "Trade Broker|Illicits":        _broker_ranks,
}

MERCHANT_PRINCE_BENEFITS = {
    "Tramp Trader":  [["Weapon", None], ["Int", 1], ["Soc", 1], ["Ship Shares", 1], [["Ship Shares", 2], ["Ally", None]], ["Free Trader", None], ["Free Trader", None]],
    "Merchant Marine":[["Blade", None], ["Edu", 1], [["Ship Shares", 1], ["Int", 1]], ["Weapon", None], ["Soc", 1], ["TAS Membership", None], [["Ship's Boat", None], ["Free Trader", None]]],
    "Trade Broker":  [["Edu", 1], ["Int", 1], ["Ally", None], ["Ally", None], ["Ship Shares", 1], ["Soc", 1], ["Free Trader", None]],
}

MERCHANT_PRINCE_CREDITS = {
    "Tramp Trader":  [1000,  5000,  10000, 20000, 20000, 40000, 50000],
    "Merchant Marine":[2000, 4000,  6000,  10000, 15000, 25000, 50000],
    "Trade Broker":  [1000,  5000,  10000, 25000, 25000, 50000, 60000],
}


# ─────────────────────────────────────────────────────────────────────────────
#  Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    path = '/Users/gvh/Development/travgen/app/src/data/gameData.json'
    with open(path) as f:
        data = json.load(f)

    # Validate existing data first
    validate(data)

    # Add new expansions
    add_career(data, 'MERCENARY',       MERCENARY_CAREERS,       MERCENARY_SKILLS,       MERCENARY_RANKS,       MERCENARY_BENEFITS,       MERCENARY_CREDITS)
    add_career(data, 'HIGH_GUARD',      HIGH_GUARD_CAREERS,      HIGH_GUARD_SKILLS,      HIGH_GUARD_RANKS,      HIGH_GUARD_BENEFITS,      HIGH_GUARD_CREDITS)
    add_career(data, 'SCOUT_BOOK',      SCOUT_BOOK_CAREERS,      SCOUT_BOOK_SKILLS,      SCOUT_BOOK_RANKS,      SCOUT_BOOK_BENEFITS,      SCOUT_BOOK_CREDITS)
    add_career(data, 'MERCHANT_PRINCE', MERCHANT_PRINCE_CAREERS, MERCHANT_PRINCE_SKILLS, MERCHANT_PRINCE_RANKS, MERCHANT_PRINCE_BENEFITS, MERCHANT_PRINCE_CREDITS)

    # Validate everything again
    validate(data)

    with open(path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Written to {path}")

if __name__ == '__main__':
    main()
