#!/usr/bin/python
# -*- coding: utf-8 -*-


STARTING_AGE = 18

STARTING_SKILLS = 3

COMMISSION = 8

FIELDS = ("T", "Career", "Spec", "Q", "S", "A",
          "Edu", "BT", "SR", "Rnk", "EM", "Age", "Ben")

TERM = {f: None for f in FIELDS}

CAREERS = {
    'Agent': {
        'Corporate': {'Surv': ('Int', 5), 'Qual': ('Int', 6), 'Adv': ('Int', 7)},
        'Law Enforcement': {'Surv': ('End', 6), 'Qual': ('Int', 6), 'Adv': ('Int', 6)},
        'Intelligence': {'Surv': ('Int', 7), 'Qual': ('Int', 6), 'Adv': ('Int', 5)}},
    'Merchant': {
        'Free Trader': {'Surv': ('Dex', 6), 'Qual': ('Int', 4), 'Adv': ('Int', 6)},
        'Merchant Marine': {'Surv': ('Edu', 5), 'Qual': ('Int', 4), 'Adv': ('Int', 7)},
        'Broker': {'Surv': ('Edu', 5), 'Qual': ('Int', 4), 'Adv': ('Int', 7)}},
    'Scholar': {
        'Physician': {'Surv': ('Edu', 4), 'Qual': ('Int', 6), 'Adv': ('Edu', 8)},
        'Scientist': {'Surv': ('Edu', 4), 'Qual': ('Int', 6), 'Adv': ('Int', 8)},
        'Field Researcher': {'Surv': ('End', 6), 'Qual': ('Int', 6), 'Adv': ('Int', 6)}},
    'Army': {
        'Cavalry': {'Surv': ('Dex', 7), 'Qual': ('End', 5), 'Adv': ('Int', 5)},
        'Support': {'Surv': ('End', 5), 'Qual': ('End', 5), 'Adv': ('Edu', 7)},
        'Infantry': {'Surv': ('Str', 6), 'Qual': ('End', 5), 'Adv': ('Edu', 6)}},
    'Navy': {
        'Line/Crew': {'Surv': ('Int', 5), 'Qual': ('Int', 6), 'Adv': ('Edu', 7)},
        'Flight': {'Surv': ('Dex', 7), 'Qual': ('Int', 6), 'Adv': ('Edu', 5)},
        'Engineering/Gunnery': {'Surv': ('Int', 6), 'Qual': ('Int', 6), 'Adv': ('Edu', 6)}},
    'Marines': {
        'Star Marines': {'Surv': ('End', 6), 'Qual': ('End', 6), 'Adv': ('Edu', 6)},
        'Support': {'Surv': ('End', 5), 'Qual': ('End', 6), 'Adv': ('Edu', 7)},
        'Ground Assault': {'Surv': ('End', 7), 'Qual': ('End', 6), 'Adv': ('Edu', 5)}},
    'Army Officer': {
        'Cavalry': {'Surv': ('Dex', 7), 'Qual': ('End', 5), 'Adv': ('Int', 5)},
        'Support': {'Surv': ('End', 5), 'Qual': ('End', 5), 'Adv': ('Edu', 7)},
        'Infantry': {'Surv': ('Str', 6), 'Qual': ('End', 5), 'Adv': ('Edu', 6)}},
    'Navy Officer': {
        'Line/Crew': {'Surv': ('Int', 5), 'Qual': ('Int', 6), 'Adv': ('Edu', 7)},
        'Flight': {'Surv': ('Dex', 7), 'Qual': ('Int', 6), 'Adv': ('Edu', 5)},
        'Engineering/Gunnery': {'Surv': ('Int', 6), 'Qual': ('Int', 6), 'Adv': ('Edu', 6)}},
    'Marines Officer': {
        'Star Marines': {'Surv': ('End', 6), 'Qual': ('End', 6), 'Adv': ('Edu', 6)},
        'Support': {'Surv': ('End', 5), 'Qual': ('End', 6), 'Adv': ('Edu', 7)},
        'Ground Assault': {'Surv': ('End', 7), 'Qual': ('End', 6), 'Adv': ('Edu', 5)}},
    'Scout': {
        'Exploration': {'Surv': ('End', 7), 'Qual': ('Int', 5), 'Adv': ('Edu', 7)},
        'Survey': {'Surv': ('End', 6), 'Qual': ('Int', 5), 'Adv': ('Int', 8)},
        'Courier': {'Surv': ('End', 5), 'Qual': ('Int', 5), 'Adv': ('Edu', 9)}},
    'Drifter': {
        'Scavenger': {'Surv': ('Dex', 7), 'Qual': ('End', None), 'Adv': ('End', 7)},
        'Wanderer': {'Surv': ('End', 7), 'Qual': ('End', None), 'Adv': ('Int', 7)},
        'Barbarian': {'Surv': ('End', 7), 'Qual': ('End', None), 'Adv': ('Str', 7)}},
    'Entertainer': {
        'Performer': {'Surv': ('Int', 5), 'Qual': ('Int', 5), 'Adv': ('Dex', 7)},
        'Journalist': {'Surv': ('Edu', 7), 'Qual': ('Int', 5), 'Adv': ('Int', 5)},
        'Artist': {'Surv': ('Soc', 6), 'Qual': ('Int', 5), 'Adv': ('Int', 6)}},
    'Rogue': {
        'Enforcer': {'Surv': ('End', 6), 'Qual': ('Dex', 6), 'Adv': ('Str', 6)},
        'Thief': {'Surv': ('Int', 6), 'Qual': ('Dex', 6), 'Adv': ('Dex', 6)},
        'Pirate': {'Surv': ('Dex', 6), 'Qual': ('Dex', 6), 'Adv': ('Int', 6)}},
    'Citizen': {
        'Worker': {'Surv': ('End', 4), 'Qual': ('Edu', 5), 'Adv': ('Edu', 8)},
        'Colonist': {'Surv': ('Int', 7), 'Qual': ('Edu', 5), 'Adv': ('End', 5)},
        'Corporate': {'Surv': ('Soc', 5), 'Qual': ('Edu', 5), 'Adv': ('Int', 6)}},
    'Nobility': {
        'Administrator': {'Surv': ('Int', 4), 'Qual': ('Soc', 10), 'Adv': ('Edu', 6)},
        'Diplomat': {'Surv': ('Int', 5), 'Qual': ('Soc', 10), 'Adv': ('Soc', 7)},
        'Dilettante': {'Surv': ('Soc', 3), 'Qual': ('Soc', 10), 'Adv': ('Int', 8)}},
    }

PSION = {
    'Psion': {
        'Wild Talent': {'Surv': ('Soc', 6), 'Qual': ('Psi', 6), 'Adv': ('Int', 8)},
        'Adept': {'Surv': ('Edu', 4), 'Qual': ('Psi', 6), 'Adv': ('Edu', 8)},
        'Psi-Warrior': {'Surv': ('Edu', 6), 'Qual': ('Psi', 6), 'Adv': ('End', 6)}}
        }

AGENT = {
    'Law Enforcement': {
        'Patroller': {'Surv': ('Int', 7), 'Qual': ('Int', 5), 'Adv': ('Edu', 7)},
        'Special Operations': {'Surv': ('End', 8), 'Qual': ('Int', 5), 'Adv': ('Int', 6)},
        'Customs': {'Surv': ('Dex', 6), 'Qual': ('Int', 5), 'Adv': ('Edu', 8)}},
    'Investigator': {
        'Private Detective': {'Surv': ('Int', 6), 'Qual': ('Int', 6), 'Adv': ('Soc', 8)},
        'Inspector': {'Surv': ('Edu', 7), 'Qual': ('Int', 6), 'Adv': ('Int', 7)},
        'Undercover Agent': {'Surv': ('Int', 8), 'Qual': ('Int', 6), 'Adv': ('Edu', 6)}},
    'Spy': {
        'Field Agent': {'Surv': ('Edu', 6), 'Qual': ('Int', 7), 'Adv': ('Soc', 8)},
        'Operative': {'Surv': ('Edu', 7), 'Qual': ('Int', 7), 'Adv': ('Int', 7)},
        'Infiltrator': {'Surv': ('Edu', 8), 'Qual': ('Int', 7), 'Adv': ('Int', 6)}},
    'Analyst': {
        'Political Officer': {'Surv': ('Soc', 6), 'Qual': ('Soc', 8), 'Adv': ('Soc', 7)},
        'Technical Expert': {'Surv': ('Int', 7), 'Qual': ('Soc', 8), 'Adv': ('Int', 6)},
        'Handler': {'Surv': ('Int', 7), 'Qual': ('Soc', 8), 'Adv': ('Soc', 7)}},
    'Corporate': {
        'Security': {'Surv': ('Int', 5), 'Qual': ('Int', 6), 'Adv': ('Int', 7)},
        'Espionage': {'Surv': ('Dex', 7), 'Qual': ('Int', 6), 'Adv': ('Int', 6)},
        'Bodyguard': {'Surv': ('End', 7), 'Qual': ('Int', 6), 'Adv': ('Soc', 6)}},
    'Bounty Hunter': {
        'Ship Tracer': {'Surv': ('End', 6), 'Qual': ('Int', 7), 'Adv': ('Soc', 7)},
        'Bondsman': {'Surv': ('End', 7), 'Qual': ('Int', 7), 'Adv': ('Int', 7)},
        'Thieftaker': {'Surv': ('Dex', 7), 'Qual': ('Int', 7), 'Adv': ('Int', 6)}}
    }

CHTHONIAN_STARS = {
    'Explorer': {
        'Exploration': {'Surv': ('End', 7), 'Qual': ('Int', 5), 'Adv': ('Edu', 7)},
        'Survey': {'Surv': ('End', 6), 'Qual': ('Int', 5), 'Adv': ('Int', 8)}},
    'Scholar': {
        'Physician': {'Surv': ('Edu', 4), 'Qual': ('Int', 6), 'Adv': ('Edu', 8)},
        'Scientist': {'Surv': ('Edu', 4), 'Qual': ('Int', 6), 'Adv': ('Int', 8)},
        'Field Researcher': {'Surv': ('End', 6), 'Qual': ('Int', 6), 'Adv': ('Int', 6)},
        'Occultist': {'Surv': ('Int', 6), 'Qual': ('Int', 6), 'Adv': ('Edu', 6)}},
    'Warden': {
        'Researcher': {'Surv': ('Int', 7), 'Qual': ('Int', 6), 'Adv': ('Int', 5)},
        'Enforcer': {'Surv': ('End', 6), 'Qual': ('Int', 6), 'Adv': ('Int', 5)},
        'Investigator': {'Surv': ('Int', 7), 'Qual': ('Int', 6), 'Adv': ('Int', 6)}},
    'Aristocrat': {
        'Administrator': {'Surv': ('Int', 4), 'Qual': ('Soc', 10), 'Adv': ('Edu', 6)},
        'Diplomat': {'Surv': ('Int', 5), 'Qual': ('Soc', 10), 'Adv': ('Soc', 7)},
        'Dilettante': {'Surv': ('Soc', 3), 'Qual': ('Soc', 10), 'Adv': ('Int', 8)}},
    }

SCOUNDREL = {
#   '': {
#       '': {'Surv': ('', ), 'Qual': ('', ), 'Adv': ('', )},
#       '': {'Surv': ('', ), 'Qual': ('', ), 'Adv': ('', )},
#       '': {'Surv': ('', ), 'Qual': ('', ), 'Adv': ('', )}},
    'Intruder': {
        'Hacker': {'Surv': ('Edu', 6), 'Qual': ('Int', 7), 'Adv': ('Int', 8)},
        'Burglar': {'Surv': ('End', 7), 'Qual': ('Int', 7), 'Adv': ('Dex', 7)},
        'Faceman': {'Surv': ('Edu', 8), 'Qual': ('Int', 7), 'Adv': ('Soc', 6)}},
    'Smuggler': {
        'Blockade Runner': {'Surv': ('Dex', 6), 'Qual': ('Edu', 6), 'Adv': ('Edu', 8)},
        'Bootlegger': {'Surv': ('End', 7), 'Qual': ('Edu', 6), 'Adv': ('Int', 7)},
        'Crew': {'Surv': ('Int', 6), 'Qual': ('Edu', 6), 'Adv': ('Edu', 8)}},
    'Organized Criminal': {
        'Assassin': {'Surv': ('End', 7), 'Qual': ('End', 8), 'Adv': ('Dex', 7)},
        'Enforcer': {'Surv': ('End', 8), 'Qual': ('End', 8), 'Adv': ('Str', 6)},
        'Co-ordinator': {'Surv': ('Edu', 6), 'Qual': ('End', 8), 'Adv': ('Int', 8)}},
    'Pirate': {
        'Corsair': {'Surv': ('Int', 7), 'Qual': ('Int', 7), 'Adv': ('Edu', 7)},
        'Boarder': {'Surv': ('End', 8), 'Qual': ('Int', 7), 'Adv': ('Int', 6)},
        'Jumpcusser': {'Surv': ('Dex', 6), 'Qual': ('Int', 7), 'Adv': ('Int', 8)}},
    'Scavenger': {
        'Wrecker': {'Surv': ('End', 7), 'Qual': ('Int', None), 'Adv': ('Edu', 7)},
        'Salvage Expert': {'Surv': ('Edu', 7), 'Qual': ('Int', None), 'Adv': ('Int', 7)},
        'Tomb Robber': {'Surv': ('End', 7), 'Qual': ('Int', None), 'Adv': ('Dex', 7)}},
    'Wanderer': {
        'Hitchhiker': {'Surv': ('Soc', 7), 'Qual': ('Int', None), 'Adv': ('Edu', 7)},
        'Vagabond': {'Surv': ('End', 7), 'Qual': ('Int', None), 'Adv': ('Int', 7)},
        'Bandit': {'Surv': ('End', 7), 'Qual': ('Int', None), 'Adv': ('Str', 7)}},
    'Barbarian': {
        'Warrior': {'Surv': ('End', 8), 'Qual': ('End', 7), 'Adv': ('Str', 6)},
        'Tribesman': {'Surv': ('End', 6), 'Qual': ('End', 7), 'Adv': ('Int', 8)},
        'Shaman': {'Surv': ('Int', 7), 'Qual': ('End', 7), 'Adv': ('Soc', 7)}},
    }

DILETTANTE = {
    'Adventurer': {
        'Explorer': {'Surv': ('Int', 6), 'Qual': ('End', 6), 'Adv': ('End', 6)},
        'Hunter': {'Surv': ('End', 7), 'Qual': ('End', 6), 'Adv': ('Dex', 5)},
        'Archaeologist': {'Surv': ('Edu', 5), 'Qual': ('End', 6), 'Adv': ('Int', 7)}},
    'Aristocrat': {
        'Courtier': {'Surv': ('Int', 7), 'Qual': ('Soc', 6), 'Adv': ('Soc', 5)},
        'Chevalier': {'Surv': ('Dex', 6), 'Qual': ('Soc', 6), 'Adv': ('Soc', 6)},
        'Paramour': {'Surv': ('Soc', 5), 'Qual': ('Soc', 6), 'Adv': ('End', 7)}},
    'Celebrity': {
        'Actor': {'Surv': ('Soc', 6), 'Qual': ('Soc', 7), 'Adv': ('Int', 6)},
        'Musician': {'Surv': ('Dex', 5), 'Qual': ('Soc', 7), 'Adv': ('Soc', 7)},
        'Luminary': {'Surv': ('Int', 7), 'Qual': ('Soc', 7), 'Adv': ('Edu', 5)}},
    'Competitor': {
        'Sportsman': {'Surv': ('End', 6), 'Qual': ('Int', 6), 'Adv': ('Str', 6)},
        'Athlete': {'Surv': ('Dex', 6), 'Qual': ('Str', 6), 'Adv': ('End', 6)},
        'Gamer': {'Surv': ('Int', 6), 'Qual': ('Int', 6), 'Adv': ('Edu', 6)}},
    'Connoisseur': {
        'Critic': {'Surv': ('Int', 7), 'Qual': ('Edu', 7), 'Adv': ('Edu', 5)},
        'Artisan': {'Surv': ('Dex', 5), 'Qual': ('Edu', 7), 'Adv': ('Soc', 7)},
        'Collector': {'Surv': ('Edu', 6), 'Qual': ('Edu', 7), 'Adv': ('Int', 6)}},
    'Dilettante': {
        'Wastrel': {'Surv': ('End', 5), 'Qual': ('Soc', 7), 'Adv': ('Int', 7)},
        'Socialite': {'Surv': ('Soc', 7), 'Qual': ('Soc', 7), 'Adv': ('End', 5)},
        'Philanthropist': {'Surv': ('Int', 6), 'Qual': ('Soc', 7), 'Adv': ('Soc', 6)}},
    'Humanitarian': {
        'Idealist': {'Surv': ('Soc', 5), 'Qual': ('Int', 6), 'Adv': ('Int', 7)},
        'Raconteur': {'Surv': ('Edu', 6), 'Qual': ('Int', 6), 'Adv': ('Soc', 6)},
        'Investigator': {'Surv': ('Int', 7), 'Qual': ('Int', 6), 'Adv': ('Edu', 5)}},
    }

DRAFT = ["Army", "Navy", "Marines"]

FALLBACK_CAREERS = ["Drifter"] + DRAFT

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

EDU_SKILLS = [("Admin", 0), ("Advocate", 0), ("Art", 0), ("Carouse", 0),
              ("Comms", 0), ("Computers", 0), ("Drive", 0), ("Engineer", 0),
              ("Language", 0), ("Medic", 0), ("Physical Science", 0),
              ("Life Science", 0), ("Social Science", 0),
              ("Space Science", 0), ("Trade", 0)]

SKILL_TYPES = {"BT": 0, "Personal Development": 1, "Service": 2,
               "Specialization": 3, "Advanced Education": 4, "Officer": 5}

SKILLS = {
    # (Career, Spec): (
    #   (Basic Training x6),
    #   (Personal Development x6),
    #   (Service Skills x6),
    #   (Specialist x6),
    #   (Advanced Edu x6),
    #   (Officer Skills x6))

    ("Warden", "Enforcer"): (
        ("Streetwise", 0), ("Drive", 0), ("Investigate", 0), ("Computers", 0), ("Recon", 0), ("Gun Combat", 0),
        ("Gun Combat", 0), ("Dex", 1), ("End", 1), ("Melee", 0), ("Int", 1), ("Athletics", 0),
        ("Streetwise", 0), ("Drive", 0), ("Investigate", 0), ("Computers", 0), ("Recon", 0), ("Gun Combat", 0),
        ("Advocate", 0), ("Melee", 0), ("Gun Combat", 0), ("Recon", 0), ("Stealth", 0), ("Occult", 0),
        ("Advocate", 0), ("Comms", 0), ("Computers", 0), ("Medic", 0), ("Stealth", 0), ("Remote Operations", 0)),
    ("Warden", "Investigator"): (
        ("Streetwise", 0), ("Drive", 0), ("Investigate", 0), ("Computers", 0), ("Recon", 0), ("Gun Combat", 0),
        ("Gun Combat", 0), ("Dex", 1), ("End", 1), ("Melee", 0), ("Int", 1), ("Athletics", 0),
        ("Streetwise", 0), ("Drive", 0), ("Investigate", 0), ("Computers", 0), ("Recon", 0), ("Gun Combat", 0),
        ("Investigate", 0), ("Recon", 0), ("Occult", 0), ("Stealth", 0), ("Persuade", 0), ("Deception", 0),
        ("Advocate", 0), ("Comms", 0), ("Computers", 0), ("Medic", 0), ("Stealth", 0), ("Remote Operations", 0)),
    ("Warden", "Researcher"): (
        ("Streetwise", 0), ("Drive", 0), ("Investigate", 0), ("Computers", 0), ("Recon", 0), ("Gun Combat", 0),
        ("Gun Combat", 0), ("Dex", 1), ("End", 1), ("Melee", 0), ("Int", 1), ("Athletics", 0),
        ("Streetwise", 0), ("Drive", 0), ("Investigate", 0), ("Computers", 0), ("Recon", 0), ("Gun Combat", 0),
        ("Occult", 0), ("Investigate", 0), ("Computers", 0), ("Any Science", 0), ("Jack of all Trades", 0), ("Language", 0),
        ("Advocate", 0), ("Comms", 0), ("Computers", 0), ("Medic", 0), ("Stealth", 0), ("Remote Operations", 0)),
    ("Agent", "Law Enforcement"): (("Streetwise", 0), ("Drive", 0), ("Investigate", 0),
        ("Computers", 0), ("Recon", 0), ("Gun Combat", 0), ("Gun Combat", 0),
        ("Dex", 1), ("End", 1), ("Melee", 0), ("Int", 1),
        ("Athletics", 0), ("Streetwise", 0), ("Drive", 0), ("Investigate", 0),
        ("Computers", 0), ("Recon", 0), ("Gun Combat", 0), ("Investigate", 0),
        ("Recon", 0), ("Streetwise", 0), ("Stealth", 0), ("Melee", 0), ("Advocate", 0),
        ("Advocate", 0), ("Comms", 0), ("Computers", 0), ("Medic", 0), ("Stealth", 0),
        ("Remote Operations", 0)),
    ("Agent", "Intelligence"): (("Streetwise", 0), ("Drive", 0), ("Investigate", 0),
        ("Computers", 0), ("Recon", 0), ("Gun Combat", 0), ("Gun Combat", 0),
        ("Dex", 1), ("End", 1), ("Melee", 0), ("Int", 1),
        ("Athletics", 0), ("Streetwise", 0), ("Drive", 0), ("Investigate", 0),
        ("Computers", 0), ("Recon", 0), ("Gun Combat", 0), ("Investigate", 0),
        ("Recon", 0), ("Comms", 0), ("Stealth", 0), ("Persuade", 0), ("Deception", 0),
        ("Advocate", 0), ("Comms", 0), ("Computers", 0), ("Medic", 0), ("Stealth", 0),
        ("Remote Operations", 0)),
    ("Agent", "Corporate"): (("Streetwise", 0), ("Drive", 0), ("Investigate", 0),
        ("Computers", 0), ("Recon", 0), ("Gun Combat", 0), ("Gun Combat", 0),
        ("Dex", 1), ("End", 1), ("Melee", 0), ("Int", 1),
        ("Athletics", 0), ("Streetwise", 0), ("Drive", 0), ("Investigate", 0),
        ("Computers", 0), ("Recon", 0), ("Gun Combat", 0), ("Investigate", 0),
        ("Computers", 0), ("Stealth", 0), ("Gun Combat", 0), ("Deception", 0),
        ("Streetwise", 0), ("Advocate", 0), ("Comms", 0), ("Computers", 0), ("Medic", 0),
        ("Stealth", 0), ("Remote Operations", 0)),
    ("Army", "Support"): (("Drive", 0), ("Athletics", 0), ("Gun Combat", 0),
        ("Recon", 0), ("Melee", 0), ("Heavy Weapons", 0), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Gambler", 0), ("Medic", 0),
        ("Melee (unarmed)", 0), ("Drive", 0), ("Athletics", 0), ("Gun Combat", 0),
        ("Recon", 0), ("Melee", 0), ("Heavy Weapons", 0), ("Mechanic", 0),
        ("Drive", 0), ("Flyer", 0), ("Explosives", 0), ("Comms", 0), ("Medic", 0),
        ("Comms", 0), ("Sensors", 0), ("Navigation", 0), ("Explosives", 0),
        ("Engineer", 0), ("Survival", 0), ("Tactics (military)", 0), ("Leadership", 0),
        ("Advocate", 0), ("Diplomat", 0), ("Tactics (military)", 0), ("Admin", 0)),
    ("Army", "Infantry"): (("Drive", 0), ("Athletics", 0), ("Gun Combat", 0),
        ("Recon", 0), ("Melee", 0), ("Heavy Weapons", 0), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Gambler", 0), ("Medic", 0),
        ("Melee (unarmed)", 0), ("Drive", 0), ("Athletics", 0), ("Gun Combat", 0), ("Recon", 0),
        ("Melee", 0), ("Heavy Weapons", 0), ("Gun Combat", 0), ("Melee", 0),
        ("Heavy Weapons", 0), ("Stealth", 0), ("Athletics", 0), ("Recon", 0), ("Comms", 0),
        ("Sensors", 0), ("Navigation", 0), ("Explosives", 0), ("Engineer", 0),
        ("Survival", 0), ("Tactics (military)", 0), ("Leadership", 0), ("Advocate", 0),
        ("Diplomat", 0), ("Tactics (military)", 0), ("Admin", 0)),
    ("Army", "Cavalry"): (("Drive", 0), ("Athletics", 0), ("Gun Combat", 0),
        ("Recon", 0), ("Melee", 0), ("Heavy Weapons", 0), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Gambler", 0), ("Medic", 0),
        ("Melee (unarmed)", 0), ("Drive", 0), ("Athletics", 0), ("Gun Combat", 0), ("Recon", 0),
        ("Melee", 0), ("Heavy Weapons", 0), ("Mechanic", 0), ("Drive", 0), ("Flyer", 0),
        ("Recon", 0), ("Gunner", 0), ("Sensors", 0), ("Comms", 0), ("Sensors", 0),
        ("Navigation", 0), ("Explosives", 0), ("Engineer", 0), ("Survival", 0),
        ("Tactics (military)", 0), ("Leadership", 0), ("Advocate", 0), ("Diplomat", 0),
        ("Tactics (military)", 0), ("Admin", 0)),
    ("Citizen", "Corporate"): (("Advocate", 0), ("Admin", 0), ("Broker", 0),
        ("Computers", 0), ("Diplomat", 0), ("Leadership", 0), ("Edu", 1),
        ("Int", 1), ("Carouse", 0), ("Gambler", 0), ("Drive", 0),
        ("Jack of all Trades", 0), ("Drive", 0), ("Flyer", 0), ("Streetwise", 0), ("Melee", 0),
        ("Steward", 0), ("Trade", 0), ("Advocate", 0), ("Admin", 0), ("Broker", 0),
        ("Computers", 0), ("Diplomat", 0), ("Leadership", 0), ("Art", 0),
        ("Advocate", 0), ("Diplomat", 0), ("Language", 0), ("Computers", 0),
        ("Medic", 0)),
    ("Citizen", "Worker"): (("Drive", 0), ("Mechanic", 0), ("Trade", 0),
        ("Engineer", 0), ("Trade", 0), ("Any Science", 0), ("Edu", 1),
        ("Int", 1), ("Carouse", 0), ("Gambler", 0), ("Drive", 0),
        ("Jack of all Trades", 0), ("Drive", 0), ("Flyer", 0), ("Streetwise", 0), ("Melee", 0),
        ("Steward", 0), ("Trade", 0), ("Drive", 0), ("Mechanic", 0), ("Trade", 0),
        ("Engineer", 0), ("Trade", 0), ("Any Science", 0), ("Art", 0),
        ("Advocate", 0), ("Diplomat", 0), ("Language", 0), ("Computers", 0),
        ("Medic", 0)),
    ("Citizen", "Colonist"): (("Animals", 0), ("Athletics", 0),
        ("Jack of all Trades", 0), ("Drive", 0), ("Survival", 0), ("Recon", 0), ("Edu", 1),
        ("Int", 1), ("Carouse", 0), ("Gambler", 0), ("Drive", 0),
        ("Jack of all Trades", 0), ("Drive", 0), ("Flyer", 0), ("Streetwise", 0), ("Melee", 0),
        ("Steward", 0), ("Trade", 0), ("Animals", 0), ("Athletics", 0),
        ("Jack of all Trades", 0), ("Drive", 0), ("Survival", 0), ("Recon", 0), ("Art", 0),
        ("Advocate", 0), ("Diplomat", 0), ("Language", 0), ("Computers", 0), ("Medic", 0)),
    ("Drifter", "Barbarian"): (
        ("Animals", 0), ("Carouse", 0), ("Melee", 0), ("Stealth", 0), ("Seafarer", 0), ("Survival", 0),
        ("Str", 1), ("End", 1), ("Dex", 1), ("Jack of all Trades", 0), ("End", 1), ("Int", 1),
        ("Athletics", 0), ("Melee (unarmed)", 0), ("Recon", 0), ("Streetwise", 0), ("Stealth", 0), ("Survival", 0),
        ("Animals", 0), ("Carouse", 0), ("Melee (blade)", 0), ("Stealth", 0), ("Seafarer", 0), ("Survival", 0)),
    ("Drifter", "Wanderer"): (
        ("Athletics", 0), ("Deception", 0), ("Recon", 0), ("Stealth", 0), ("Streetwise", 0), ("Survival", 0),
        ("Str", 1), ("End", 1), ("Dex", 1), ("Jack of all Trades", 0),("End", 1), ("Int", 1),
        ("Athletics", 0), ("Melee (unarmed)", 0), ("Recon", 0), ("Streetwise", 0), ("Stealth", 0), ("Survival", 0),
        ("Athletics", 0), ("Deception", 0), ("Recon", 0), ("Stealth", 0), ("Streetwise", 0), ("Survival", 0)),
    ("Drifter", "Scavenger"): (
        ("Pilot", 0), ("Mechanic", 0), ("Astrogation", 0), ("Vacc Suit", 0), ("Zero-G", 0), ("Gun Combat", 0),
        ("Str", 1), ("End", 1), ("Dex", 1), ("Jack of all Trades", 0), ("End", 1), ("Int", 1),
        ("Athletics", 0), ("Melee (unarmed)", 0), ("Recon", 0), ("Streetwise", 0), ("Stealth", 0), ("Survival", 0),
        ("Pilot (small craft)", 0), ("Mechanic", 0), ("Astrogation", 0), ("Vacc Suit", 0), ("Zero-G", 0), ("Gun Combat", 0)),
    ("Entertainer", "Artist"): (("Any Art", 0), ("Any Art'", 0), ("Carouse", 0),
        ("Deception", 0), ("Persuade", 0), ("Steward", 0), ("Dex", 1),
        ("Int", 1), ("Soc", 1), ("Edu", 1), ("Carouse", 0),
        ("Stealth", 0), ("Any Art", 0), ("Any Art", 0), ("Carouse", 0), ("Deception", 0),
        ("Persuade", 0), ("Steward", 0), ("Any Art", 0), ("Carouse", 0),
        ("Computers", 0), ("Gambler", 0), ("Persuade", 0), ("Trade", 0),
        ("Advocate", 0), ("Art", 0), ("Deception", 0), ("Any Science", 0),
        ("Streetwise", 0), ("Diplomat", 0)),
    ("Entertainer", "Journalist"): (("Any Art", 0), ("Any Art'", 0), ("Carouse", 0),
        ("Deception", 0), ("Persuade", 0), ("Steward", 0), ("Dex", 1),
        ("Int", 1), ("Soc", 1), ("Edu", 1), ("Carouse", 0),
        ("Stealth", 0), ("Any Art", 0), ("Any Art", 0), ("Carouse", 0), ("Deception", 0),
        ("Persuade", 0), ("Steward", 0), ("Art (writing) or Art (holography)", 0),
        ("Comms", 0), ("Computers", 0), ("Investigate", 0), ("Recon", 0),
        ("Streetwise", 0), ("Advocate", 0), ("Art", 0), ("Deception", 0),
        ("Any Science", 0), ("Streetwise", 0), ("Diplomat", 0)),
    ("Entertainer", "Performer"): (
        ("Any Art", 0), ("Any Art'", 0), ("Carouse", 0), ("Deception", 0), ("Persuade", 0), ("Steward", 0),
        ("Dex", 1), ("Int", 1), ("Soc", 1), ("Edu", 1), ("Carouse", 0), ("Stealth", 0),
        ("Any Art", 0), ("Any Art", 0), ("Carouse", 0), ("Deception", 0), ("Persuade", 0), ("Steward", 0),
        ("Art (acting) or Art (dance) or Art (instrument)", 0),
        ("Athletics (coordination) or Athletics (endurance)", 0),
        ("Carouse", 0), ("Deception", 0), ("Stealth", 0), ("Streetwise", 0),
        ("Advocate", 0), ("Art", 0), ("Deception", 0), ("Any Science", 0), ("Streetwise", 0), ("Diplomat", 0)),
    ("Marines", "Support"): (
        ("Athletics", 0), ("Battle Dress", 0), ("Tactics", 0), ("Heavy Weapons", 0), ("Gun Combat", 0), ("Stealth", 0),
        ("Str", 1), ("Dex", 1), ("End", 1), ("Gambler", 0), ("Melee (unarmed)", 0), ("Melee (armed)", 0),
        ("Athletics", 0), ("Battle Dress", 0), ("Tactics", 0), ("Heavy Weapons", 0), ("Gun Combat", 0), ("Stealth", 0),
        ("Comms", 0), ("Mechanic", 0), ("Drive or Flyer", 0), ("Medic", 0), ("Heavy Weapons", 0), ("Gun Combat", 0),
        ("Medic", 0), ("Survival", 0), ("Explosives", 0), ("Engineer", 0), ("Pilot", 0), ("Medic", 0),
        ("Leadership", 0), ("Tactics", 0), ("Admin", 0), ("Advocate", 0), ("Battle Dress", 0), ("Leadership", 0)),
    ("Marines", "Star Marines"): (("Athletics", 0), ("Battle Dress", 0),
        ("Tactics", 0), ("Heavy Weapons", 0), ("Gun Combat", 0), ("Stealth", 0),
        ("Str", 1), ("Dex", 1), ("End", 1), ("Gambler", 0),
        ("Melee (unarmed)", 0), ("Melee (armed)", 0), ("Athletics", 0), ("Battle Dress", 0),
        ("Tactics", 0), ("Heavy Weapons", 0), ("Gun Combat", 0), ("Stealth", 0),
        ("Battle Dress", 0), ("Zero-G", 0), ("Gunner", 0), ("Melee (blade)", 0),
        ("Sensors", 0), ("Gun Combat", 0), ("Medic", 0), ("Survival", 0),
        ("Explosives", 0), ("Engineer", 0), ("Pilot", 0), ("Medic", 0),
        ("Leadership", 0), ("Tactics", 0), ("Admin", 0), ("Advocate", 0),
        ("Battle Dress", 0), ("Leadership", 0)),
    ("Marines", "Ground Assault"): (("Athletics", 0), ("Battle Dress", 0),
        ("Tactics", 0), ("Heavy Weapons", 0), ("Gun Combat", 0), ("Stealth", 0),
        ("Str", 1), ("Dex", 1), ("End", 1), ("Gambler", 0),
        ("Melee (unarmed)", 0), ("Melee (armed)", 0), ("Athletics", 0), ("Battle Dress", 0),
        ("Tactics", 0), ("Heavy Weapons", 0), ("Gun Combat", 0), ("Stealth", 0),
        ("Battle Dress", 0), ("Heavy Weapons", 0), ("Recon", 0),
        ("Melee (blade)", 0), ("Tactics (military)", 0), ("Gun Combat", 0), ("Medic", 0),
        ("Survival", 0), ("Explosives", 0), ("Engineer", 0), ("Pilot", 0),
        ("Medic", 0), ("Leadership", 0), ("Tactics", 0), ("Admin", 0),
        ("Advocate", 0), ("Battle Dress", 0), ("Leadership", 0)),
    ("Merchant", "Merchant Marine"): (("Drive", 0), ("Vacc Suit", 0), ("Broker", 0),
        ("Steward", 0), ("Comms", 0), ("Persuade", 0), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Int", 1),
        ("Melee (blade)", 0), ("Streetwise", 0), ("Drive", 0), ("Vacc Suit", 0),
        ("Broker", 0), ("Steward", 0), ("Comms", 0), ("Persuade", 0),
        ("Pilot (spacecraft) or Pilot (capital ships)", 0), ("Vacc Suit", 0), ("Zero-G", 0),
        ("Mechanic", 0), ("Engineer", 0), ("Gunner", 0), ("Social Science", 0),
        ("Astrogation", 0), ("Computers", 0), ("Pilot", 0), ("Admin", 0),
        ("Advocate", 0)),
    ("Merchant", "Free Trader"): (("Drive", 0), ("Vacc Suit", 0), ("Broker", 0),
        ("Steward", 0), ("Comms", 0), ("Persuade", 0), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Int", 1),
        ("Melee (blade)", 0), ("Streetwise", 0), ("Drive", 0), ("Vacc Suit", 0),
        ("Broker", 0), ("Steward", 0), ("Comms", 0), ("Persuade", 0),
        ("Pilot (spacecraft)", 0), ("Vacc Suit", 0), ("Zero-G", 0), ("Mechanic", 0),
        ("Engineer", 0), ("Sensors", 0), ("Social Science", 0), ("Astrogation", 0),
        ("Computers", 0), ("Pilot", 0), ("Admin", 0), ("Advocate", 0)),
    ("Merchant", "Broker"): (("Drive", 0), ("Vacc Suit", 0), ("Broker", 0),
        ("Steward", 0), ("Comms", 0), ("Persuade", 0), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Int", 1),
        ("Melee (blade)", 0), ("Streetwise", 0), ("Drive", 0), ("Vacc Suit", 0),
        ("Broker", 0), ("Steward", 0), ("Comms", 0), ("Persuade", 0), ("Admin", 0),
        ("Advocate", 0), ("Broker", 0), ("Streetwise", 0), ("Deception", 0),
        ("Persuade", 0), ("Social Science", 0), ("Astrogation", 0),
        ("Computers", 0), ("Pilot", 0), ("Admin", 0), ("Advocate", 0)),
    ("Navy", "Line/Crew"): (("Pilot", 0), ("Vacc Suit", 0), ("Zero-G", 0),
        ("Gunner", 0), ("Mechanic", 0), ("Gun Combat", 0), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Int", 1), ("Edu", 1),
        ("Soc", 1), ("Pilot", 0), ("Vacc Suit", 0), ("Zero-G", 0), ("Gunner", 0),
        ("Mechanic", 0), ("Gun Combat", 0), ("Comms", 0), ("Mechanic", 0),
        ("Gun Combat", 0), ("Sensors", 0), ("Melee", 0), ("Vacc Suit", 0),
        ("Remote Operations", 0), ("Astrogation", 0), ("Engineer", 0), ("Computers", 0),
        ("Navigation", 0), ("Admin", 0), ("Leadership", 0), ("Tactics (naval)", 0),
        ("Pilot", 0), ("Melee (blade)", 0), ("Admin", 0), ("Tactics (naval)", 0)),
    ("Navy", "Engineering/Gunnery"): (("Pilot", 0), ("Vacc Suit", 0), ("Zero-G", 0),
        ("Gunner", 0), ("Mechanic", 0), ("Gun Combat", 0), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Int", 1), ("Edu", 1),
        ("Soc", 1), ("Pilot", 0), ("Vacc Suit", 0), ("Zero-G", 0), ("Gunner", 0),
        ("Mechanic", 0), ("Gun Combat", 0), ("Engineer", 0), ("Mechanic", 0),
        ("Sensors", 0), ("Engineer", 0), ("Gunner", 0), ("Computers", 0),
        ("Remote Operations", 0), ("Astrogation", 0), ("Engineer", 0), ("Computers", 0),
        ("Navigation", 0), ("Admin", 0), ("Leadership", 0), ("Tactics (naval)", 0),
        ("Pilot", 0), ("Melee (blade)", 0), ("Admin", 0), ("Tactics (naval)", 0)),
    ("Navy", "Flight"): (("Pilot", 0), ("Vacc Suit", 0), ("Zero-G", 0), ("Gunner", 0),
        ("Mechanic", 0), ("Gun Combat", 0), ("Str", 1), ("Dex", 1),
        ("End", 1), ("Int", 1), ("Edu", 1), ("Soc", 1),
        ("Pilot", 0), ("Vacc Suit", 0), ("Zero-G", 0), ("Gunner", 0),
        ("Mechanic", 0), ("Gun Combat", 0), ("Pilot", 0), ("Flyer", 0),
        ("Gunner", 0), ("Pilot (small craft)", 0), ("Astrogation", 0),
        ("Zero-G", 0), ("Remote Operations", 0), ("Astrogation", 0),
        ("Engineer", 0), ("Computers", 0), ("Navigation", 0), ("Admin", 0),
        ("Leadership", 0), ("Tactics (naval)", 0), ("Pilot", 0),
        ("Melee (blade)", 0), ("Admin", 0), ("Tactics (naval)", 0)),
    ("Nobility", "Administrator"): (("Admin", 0), ("Advocate", 0), ("Comms", 0),
        ("Diplomat", 0), ("Investigate", 0), ("Persuade", 0), ("Carouse", 0),
        ("Edu", 1), ("Deception", 0), ("Dex", 1), ("Melee (blade)", 0),
        ("Soc", 1), ("Admin", 0), ("Advocate", 0), ("Comms", 0), ("Diplomat", 0),
        ("Investigate", 0), ("Persuade", 0), ("Admin", 0), ("Advocate", 0),
        ("Broker", 0), ("Diplomat", 0), ("Leadership", 0), ("Persuade", 0),
        ("Admin", 0), ("Advocate", 0), ("Language", 0), ("Leadership", 0),
        ("Diplomat", 0), ("Computers", 0)),
    ("Nobility", "Diplomat"): (("Admin", 0), ("Advocate", 0), ("Comms", 0),
        ("Diplomat", 0), ("Investigate", 0), ("Persuade", 0), ("Carouse", 0),
        ("Edu", 1), ("Deception", 0), ("Dex", 1), ("Melee (blade)", 0),
        ("Soc", 1), ("Admin", 0), ("Advocate", 0), ("Comms", 0), ("Diplomat", 0),
        ("Investigate", 0), ("Persuade", 0), ("Advocate", 0), ("Carouse", 0),
        ("Comms", 0), ("Steward", 0), ("Diplomat", 0), ("Deception", 0),
        ("Admin", 0), ("Advocate", 0), ("Language", 0), ("Leadership", 0),
        ("Diplomat", 0), ("Computers", 0)),
    ("Nobility", "Dilettante"): (("Admin", 0), ("Advocate", 0), ("Comms", 0),
        ("Diplomat", 0), ("Investigate", 0), ("Persuade", 0), ("Carouse", 0),
        ("Edu", 1), ("Deception", 0), ("Dex", 1), ("Melee (blade)", 0),
        ("Soc", 1), ("Admin", 0), ("Advocate", 0), ("Comms", 0), ("Diplomat", 0),
        ("Investigate", 0), ("Persuade", 0), ("Carouse", 0), ("Deception", 0),
        ("Flyer", 0), ("Streetwise", 0), ("Gambler", 0), ("Jack of all Trades", 0),
        ("Admin", 0), ("Advocate", 0), ("Language", 0), ("Leadership", 0),
        ("Diplomat", 0), ("Computers", 0)),
    ("Aristocrat", "Administrator"): (("Admin", 0), ("Advocate", 0), ("Comms", 0),
        ("Diplomat", 0), ("Investigate", 0), ("Persuade", 0), ("Carouse", 0),
        ("Edu", 1), ("Deception", 0), ("Dex", 1), ("Melee (blade)", 0),
        ("Soc", 1), ("Admin", 0), ("Advocate", 0), ("Comms", 0), ("Diplomat", 0),
        ("Investigate", 0), ("Persuade", 0), ("Admin", 0), ("Advocate", 0),
        ("Broker", 0), ("Diplomat", 0), ("Leadership", 0), ("Persuade", 0),
        ("Admin", 0), ("Advocate", 0), ("Language", 0), ("Leadership", 0),
        ("Diplomat", 0), ("Computers", 0)),
    ("Aristocrat", "Diplomat"): (("Admin", 0), ("Advocate", 0), ("Comms", 0),
        ("Diplomat", 0), ("Investigate", 0), ("Persuade", 0), ("Carouse", 0),
        ("Edu", 1), ("Deception", 0), ("Dex", 1), ("Melee (blade)", 0),
        ("Soc", 1), ("Admin", 0), ("Advocate", 0), ("Comms", 0), ("Diplomat", 0),
        ("Investigate", 0), ("Persuade", 0), ("Advocate", 0), ("Carouse", 0),
        ("Comms", 0), ("Steward", 0), ("Diplomat", 0), ("Deception", 0),
        ("Admin", 0), ("Advocate", 0), ("Language", 0), ("Leadership", 0),
        ("Diplomat", 0), ("Computers", 0)),
    ("Aristocrat", "Dilettante"): (("Admin", 0), ("Advocate", 0), ("Comms", 0),
        ("Diplomat", 0), ("Investigate", 0), ("Persuade", 0), ("Carouse", 0),
        ("Edu", 1), ("Deception", 0), ("Dex", 1), ("Melee (blade)", 0),
        ("Soc", 1), ("Admin", 0), ("Advocate", 0), ("Comms", 0), ("Diplomat", 0),
        ("Investigate", 0), ("Persuade", 0), ("Carouse", 0), ("Deception", 0),
        ("Flyer", 0), ("Streetwise", 0), ("Gambler", 0), ("Jack of all Trades", 0),
        ("Admin", 0), ("Advocate", 0), ("Language", 0), ("Leadership", 0),
        ("Diplomat", 0), ("Computers", 0)),
    ("Rogue", "Thief"): (("Deception", 0), ("Recon", 0), ("Athletics", 0),
        ("Gun Combat", 0), ("Stealth", 0), ("Streetwise", 0), ("Carouse", 0), ("Dex", 1),
        ("End", 1), ("Gambler", 0), ("Melee", 0), ("Gun Combat", 0), ("Deception", 0),
        ("Recon", 0), ("Athletics", 0), ("Gun Combat", 0), ("Stealth", 0), ("Streetwise", 0),
        ("Stealth", 0), ("Computers", 0), ("Remote Operations", 0), ("Streetwise", 0),
        ("Deception", 0), ("Athletics (co-ordination)", 0), ("Computers", 0), ("Comms", 0),
        ("Medic", 0), ("Investigate", 0), ("Persuade", 0), ("Advocate", 0)),
    ("Rogue", "Enforcer"): (("Deception", 0), ("Recon", 0), ("Athletics", 0),
        ("Gun Combat", 0), ("Stealth", 0), ("Streetwise", 0), ("Carouse", 0), ("Dex", 1),
        ("End", 1), ("Gambler", 0), ("Melee", 0), ("Gun Combat", 0), ("Deception", 0),
        ("Recon", 0), ("Athletics", 0), ("Gun Combat", 0), ("Stealth", 0), ("Streetwise", 0),
        ("Gun Combat", 0), ("Melee", 0), ("Streetwise", 0), ("Persuade", 0),
        ("Athletics", 0), ("Drive", 0), ("Computers", 0), ("Comms", 0), ("Medic", 0),
        ("Investigate", 0), ("Persuade", 0), ("Advocate", 0)),
    ("Rogue", "Pirate"): (("Deception", 0), ("Recon", 0), ("Athletics", 0),
        ("Gun Combat", 0), ("Stealth", 0), ("Streetwise", 0), ("Carouse", 0), ("Dex", 1),
        ("End", 1), ("Gambler", 0), ("Melee", 0), ("Gun Combat", 0), ("Deception", 0),
        ("Recon", 0), ("Athletics", 0), ("Gun Combat", 0), ("Stealth", 0), ("Streetwise", 0),
        ("Pilot", 0), ("Astrogation", 0), ("Gunner", 0), ("Engineer", 0), ("Vacc Suit", 0),
        ("Melee (blade)", 0), ("Computers", 0), ("Comms", 0), ("Medic", 0),
        ("Investigate", 0), ("Persuade", 0), ("Advocate", 0)),
    ("Scholar", "Field Researcher"): (("Comms", 0), ("Computers", 0), ("Diplomat", 0),
        ("Medic", 0), ("Investigate", 0), ("Any Science", 0), ("Int", 1),
        ("Edu", 1), ("Soc", 1), ("Dex", 1), ("End", 1),
        ("Computers", 0), ("Comms", 0), ("Computers", 0), ("Diplomat", 0),
        ("Medic", 0), ("Investigate", 0), ("Any Science", 0), ("Sensors", 0),
        ("Diplomat", 0), ("Language", 0), ("Survival", 0), ("Investigate", 0),
        ("Any Science", 0), ("Art", 0), ("Advocate", 0), ("Computers", 0), ("Language", 0),
        ("Engineer", 0), ("Any Science", 0)),
    ("Scholar", "Scientist"): (("Comms", 0), ("Computers", 0), ("Diplomat", 0),
        ("Medic", 0), ("Investigate", 0), ("Any Science", 0), ("Int", 1),
        ("Edu", 1), ("Soc", 1), ("Dex", 1), ("End", 1),
        ("Computers", 0), ("Comms", 0), ("Computers", 0), ("Diplomat", 0),
        ("Medic", 0), ("Investigate", 0), ("Any Science", 0), ("Admin", 0),
        ("Engineer", 0), ("Any Science", 0), ("Sensors", 0), ("Computers", 0),
        ("Any Science", 0), ("Art", 0), ("Advocate", 0), ("Computers", 0), ("Language", 0),
        ("Engineer", 0), ("Any Science", 0)),
    ("Scholar", "Physician"): (("Comms", 0), ("Computers", 0), ("Diplomat", 0),
        ("Medic", 0), ("Investigate", 0), ("Any Science", 0), ("Int", 1),
        ("Edu", 1), ("Soc", 1), ("Dex", 1), ("End", 1),
        ("Computers", 0), ("Comms", 0), ("Computers", 0), ("Diplomat", 0),
        ("Medic", 0), ("Investigate", 0), ("Any Science", 0), ("Medic", 0),
        ("Comms", 0), ("Investigate", 0), ("Medic", 0), ("Persuade", 0),
        ("Any Science", 0), ("Art", 0), ("Advocate", 0), ("Computers", 0), ("Language", 0),
        ("Engineer", 0), ("Any Science", 0)),
    ("Scholar", "Occultist"): (("Comms", 0), ("Computers", 0), ("Diplomat", 0),
        ("Medic", 0), ("Investigate", 0), ("Any Science", 0), ("Int", 1),
        ("Edu", 1), ("Soc", 1), ("Dex", 1), ("End", 1),
        ("Computers", 0), ("Comms", 0), ("Computers", 0), ("Diplomat", 0),
        ("Medic", 0), ("Investigate", 0), ("Any Science", 0), ("Investigate", 0),
        ("Occult", 0), ("Any Science", 0), ("Computers", 0), ("Language", 0), ("Occult", 0),
        ("Art", 0), ("Advocate", 0), ("Computers", 0), ("Language", 0),
        ("Engineer", 0), ("Any Science", 0)),
    ("Scout", "Courier"): (("Pilot", 0), ("Survival", 0), ("Mechanic", 0),
        ("Astrogation", 0), ("Comms", 0), ("Gun Combat", 0), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Int", 1), ("Edu", 1),
        ("Jack of all Trades", 0), ("Pilot (spacecraft) or Pilot (small craft)", 0),
        ("Survival", 0), ("Mechanic", 0), ("Astrogation", 0), ("Comms", 0),
        ("Gun Combat", 0), ("Comms", 0), ("Sensors", 0), ("Pilot (spacecraft)", 0),
        ("Vacc Suit", 0), ("Zero-G", 0), ("Astrogation", 0), ("Medic", 0),
        ("Navigation", 0), ("Engineer", 0), ("Computers", 0), ("Space Science", 0),
        ("Jack of all Trades", 0)),
    ("Scout", "Survey"): (("Pilot", 0), ("Survival", 0), ("Mechanic", 0),
        ("Astrogation", 0), ("Comms", 0), ("Gun Combat", 0), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Int", 1), ("Edu", 1),
        ("Jack of all Trades", 0), ("Pilot (spacecraft) or Pilot (small craft)", 0),
        ("Survival", 0), ("Mechanic", 0), ("Astrogation", 0), ("Comms", 0),
        ("Gun Combat", 0), ("Sensors", 0), ("Persuade", 0), ("Pilot (small craft)", 0),
        ("Navigation", 0), ("Diplomat", 0), ("Streetwise", 0), ("Medic", 0),
        ("Navigation", 0), ("Engineer", 0), ("Computers", 0), ("Space Science", 0),
        ("Jack of all Trades", 0)),
    ("Scout", "Exploration"): (("Pilot", 0), ("Survival", 0), ("Mechanic", 0),
        ("Astrogation", 0), ("Comms", 0), ("Gun Combat", 0), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Int", 1), ("Edu", 1),
        ("Jack of all Trades", 0), ("Pilot (spacecraft) or Pilot (small craft)", 0),
        ("Survival", 0), ("Mechanic", 0), ("Astrogation", 0), ("Comms", 0),
        ("Gun Combat", 0), ("Comms", 0), ("Pilot (spacecraft)", 0),
        ("Pilot (small craft)", 0), ("Life Science", 0), ("Stealth", 0), ("Recon", 0),
        ("Medic", 0), ("Navigation", 0), ("Engineer", 0), ("Computers", 0),
        ("Space Science", 0), ("Jack of all Trades", 0)),
    ("Explorer", "Survey"): (("Pilot", 0), ("Survival", 0), ("Mechanic", 0),
        ("Astrogation", 0), ("Comms", 0), ("Gun Combat", 0), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Int", 1), ("Edu", 1),
        ("Jack of all Trades", 0), ("Pilot (spacecraft) or Pilot (small craft)", 0),
        ("Survival", 0), ("Mechanic", 0), ("Astrogation", 0), ("Comms", 0),
        ("Gun Combat", 0), ("Sensors", 0), ("Persuade", 0), ("Pilot (small craft)", 0),
        ("Navigation", 0), ("Diplomat", 0), ("Streetwise", 0), ("Medic", 0),
        ("Navigation", 0), ("Engineer", 0), ("Computers", 0), ("Space Science", 0),
        ("Jack of all Trades", 0)),
    ("Explorer", "Exploration"): (("Pilot", 0), ("Survival", 0), ("Mechanic", 0),
        ("Astrogation", 0), ("Comms", 0), ("Gun Combat", 0), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Int", 1), ("Edu", 1),
        ("Jack of all Trades", 0), ("Pilot (spacecraft) or Pilot (small craft)", 0),
        ("Survival", 0), ("Mechanic", 0), ("Astrogation", 0), ("Comms", 0),
        ("Gun Combat", 0), ("Comms", 0), ("Pilot (spacecraft)", 0),
        ("Pilot (small craft)", 0), ("Life Science", 0), ("Stealth", 0), ("Recon", 0),
        ("Medic", 0), ("Navigation", 0), ("Engineer", 0), ("Computers", 0),
        ("Space Science", 0), ("Jack of all Trades", 0)),
    ("Psion", "Wild Talent"): (("Telepathy", 0), ("Clairvoyance", 0),
        ("Telekinesis", 0), ("Awareness", 0), ("Teleportation", 0),
        ("Any Skill", 0), ("Edu", 1), ("Int", 1), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Psi", 1), ("Telepathy", 0),
        ("Clairvoyance", 0), ("Telekinesis", 0), ("Awareness", 0),
        ("Teleportation", 0), ("Any Skill", 0), ("Telepathy", 0),
        ("Telekinesis", 0), ("Deception", 0), ("Stealth", 0), ("Streetwise", 0),
        ("Melee or Gun Combat", 0), ("Comms", 0), ("Computers", 0), ("Language", 0),
        ("Medic", 0), ("Life Science", 0), ("Space Science", 0)),
    ("Psion", "Adept"): (("Telepathy", 0), ("Clairvoyance", 0), ("Telekinesis", 0),
        ("Awareness", 0), ("Teleportation", 0), ("Any Skill", 0), ("Edu", 1),
        ("Int", 1), ("Str", 1), ("Dex", 1), ("End", 1),
        ("Psi", 1), ("Telepathy", 0), ("Clairvoyance", 0), ("Telekinesis", 0),
        ("Awareness", 0), ("Teleportation", 0), ("Any Skill", 0), ("Telepathy", 0),
        ("Clairvoyance", 0), ("Awareness", 0), ("Medic", 0), ("Persuade", 0),
        ("Social Science", 0), ("Comms", 0), ("Computers", 0), ("Language", 0),
        ("Medic", 0), ("Life Science", 0), ("Space Science", 0)),
    ("Psion", "Psi-Warrior"): (("Telepathy", 0), ("Clairvoyance", 0),
        ("Telekinesis", 0), ("Awareness", 0), ("Teleportation", 0),
        ("Any Skill", 0), ("Edu", 1), ("Int", 1), ("Str", 1),
        ("Dex", 1), ("End", 1), ("Psi", 1), ("Telepathy", 0),
        ("Clairvoyance", 0), ("Telekinesis", 0), ("Awareness", 0),
        ("Teleportation", 0), ("Any Skill", 0), ("Telepathy", 0), ("Awareness", 0),
        ("Teleportation", 0), ("Gun Combat", 0), ("Battle Dress", 0), ("Recon", 0),
        ("Comms", 0), ("Computers", 0), ("Language", 0), ("Medic", 0),
        ("Life Science", 0), ("Space Science", 0)),
}

RANKS = {
    ("Warden", "Enforcer"):
        (None, ("Occult", 1), None, ("Investigate", 1), None, ("Leadership", 1), ("Soc", 1)),
    ("Warden", "Investigator"):
        (None, ("Occult", 1), None, ("Investigate", 1), None, ("Leadership", 1), ("Soc", 1)),
    ("Warden", "Researcher"):
        (None, ("Occult", 1), None, ("Investigate", 1), None, ("Leadership", 1), ("Soc", 1)),
    ("Agent", "Law Enforcement"):
        (None, ("Streetwise", 1), None, None, ("Investigate", 1), ("Admin", 1), ("Soc", 1)),
    ("Agent", "Intelligence"):
        (None, ("Deception", 1), ("Investigate", 1), None, ("Gun Combat", 1), None, None),
    ("Agent", "Corporate"):
        (None, ("Deception", 1), ("Investigate", 1), None, ("Gun Combat", 1), None, None),
    ("Army", "Support"):
        (("Gun Combat (rifle)", 1), ("Recon", 1), None, ("Leadership", 1), None, None, None),
    ("Army", "Infantry"):
        (("Gun Combat (rifle)", 1), ("Recon", 1), None, ("Leadership", 1), None, None, None),
    ("Army", "Cavalry"):
        (("Gun Combat (rifle)", 1), ("Recon", 1), None, ("Leadership", 1), None, None, None),
    ("Citizen", "Corporate"):
        (None, None, ("Admin", 1), None, ("Advocate", 1), None, ("Soc", 1)),
    ("Citizen", "Worker"):
        (None, None, ("Trade", 1), None, ("Mechanic", 1), None, ("Engineer", 1)),
    ("Citizen", "Colonist"):
        (None, None, ("Survival", 1), None, ("Navigation", 1), None, ("Gun Combat", 1)),
    ("Drifter", "Barbarian"):
        (None, ("Survival", 1), ("Melee (blade)", 1), None, ("Leadership", 1), None, None),
    ("Drifter", "Wanderer"):
        (None, ("Streetwise", 1), None, ("Deception", 1), None, None, None),
    ("Drifter", "Scavenger"):
        (None, ("Vacc Suit", 1), None, ("Trade (belter) or Mechanic)", 1), None, None, None),
    ("Entertainer", "Artist"):
        (None, ("Art", 0), None, ("Investigate", 0), None, ("Soc", 1), None),
    ("Entertainer", "Journalist"):
        (None, ("Comms", 0), ("Investigate", 0), None, ("Persuade", 0), None, ("Soc", 1)),
    ("Entertainer", "Performer"):
        (None, ("Dex", 1), None, ("Str", 1), None, ("Soc", 1), None),
    ("Marines", "Support"):
        (("Melee (blade) or Gun Combat", 1), ("Gun Combat", 1), None, ("Leadership", 1), None, ("End", 1), None),
    ("Marines", "Star Marines"):
        (("Melee (blade) or Gun Combat", 1), ("Gun Combat", 1), None, ("Leadership", 1), None, ("End", 1), None),
    ("Marines", "Ground Assault"):
        (("Melee (blade) or Gun Combat", 1), ("Gun Combat", 1), None, ("Leadership", 1), None, ("End", 1), None),
    ("Merchant", "Merchant Marine"):
        (None, ("Mechanic", 1), None, None, ("Pilot", 1), ("Soc", 1), None),
    ("Merchant", "Free Trader"):
        (None, ("Persuade", 1), None, ("Jack of all Trades", 1), None, None, None),
    ("Merchant", "Broker"):
        (None, ("Broker", 1), None, ("Streetwise", 1), None, None, None),
    ("Navy", "Line/Crew"):
        (None, ("Mechanic", 1), ("Vacc Suit", 1), None, ("End", 1), None, None),
    ("Navy", "Engineering/Gunnery"):
        (None, ("Mechanic", 1), ("Vacc Suit", 1), None, ("End", 1), None, None),
    ("Navy", "Flight"):
        (None, ("Mechanic", 1), ("Vacc Suit", 1), None, ("End", 1), None, None),
    ("Aristocrat", "Administrator"):
        (None, ("Admin", 1), None, ("Advocate", 1), None, ("Leadership", 1), None),
    ("Aristocrat", "Diplomat"):
        (None, ("Admin", 1), None, ("Advocate", 1), None, ("Diplomat", 1), None),
    ("Aristocrat", "Dilettante"):
        (None, ("Carouse", 1), None, ("Persuade", 1), None, ("Jack of all Trades", 1), None),
    ("Nobility", "Administrator"):
        (None, ("Admin", 1), None, ("Advocate", 1), None, ("Leadership", 1), None),
    ("Nobility", "Diplomat"):
        (None, ("Admin", 1), None, ("Advocate", 1), None, ("Diplomat", 1), None),
    ("Nobility", "Dilettante"):
        (None, ("Carouse", 1), None, ("Persuade", 1), None, ("Jack of all Trades", 1), None),
    ("Rogue", "Thief"):
        (None, ("Stealth", 1), None, ("Streetwise", 1), None, ("Recon", 1), None),
    ("Rogue", "Enforcer"):
        (None, ("Persuade", 1), None, ("Melee or Gun Combat", 1), None, ("Streetwise", 1), None),
    ("Rogue", "Pirate"):
        (None, ("Pilot or Gunner", 1), None, ("Melee or Gun Combat", 1), None, ("Engineer or Navigation", 1), None),
    ("Scholar", "Field Researcher"):
        (None, ("Social Science", 1), None, ("Investigate", 1), None, ("Computers", 1), None),
    ("Scholar", "Scientist"):
        (None, ("Physical Science", 1), None, ("Investigate", 1), None, ("Computers", 1), None),
    ("Scholar", "Physician"):
        (None, ("Medic", 1), None, ("Life Science", 1), None, ("Social Science", 1), None),
    ("Scholar", "Occultist"):
        (None, ("Occult", 1), None, ("Investigate", 1), None, ("Computers", 1), None),
    ("Scout", "Courier"):
        (None, ("Vacc Suit", 1), None, ("Pilot", 1), None, None, None),
    ("Scout", "Survey"):
        (None, ("Vacc Suit", 1), None, ("Pilot", 1), None, None, None),
    ("Scout", "Exploration"):
        (None, ("Vacc Suit", 1), None, ("Pilot", 1), None, None, None),
    ("Explorer", "Survey"):
        (None, ("Vacc Suit", 1), None, ("Pilot", 1), None, None, None),
    ("Explorer", "Exploration"):
        (None, ("Vacc Suit", 1), None, ("Pilot", 1), None, None, None),
    ("Psion", "Wild Talent"):
        (None, ("Survival or Streetwise", 1), None, ("Deception", 1), None, None, None),
    ("Psion", "Adept"):
        (None, ("Science (psionology)", 1), None, ("Psi", 1), None, None, ("Psi", 1)),
    ("Psion", "Psi-Warrior"):
        (None, ("Gun Combat", 1), ("Leadership", 1), None, None, ("Tactics", 1), None),
    ("Army Officer", "Support"):
        (None, ("Leadership", 1), None, ("Tactics (military)", 1), None, None, ("Soc", 1)),
    ("Army Officer", "Infantry"):
        (None, ("Leadership", 1), None, ("Tactics (military)", 1), None, None, ("Soc", 1)),
    ("Army Officer", "Cavalry"):
        (None, ("Leadership", 1), None, ("Tactics (military)", 1), None, None, ("Soc", 1)),
    ("Marines Officer", "Support"):
        (None, ("Leadership", 1), None, ("Tactics", 1), None, ("Soc", 1), None),
    ("Marines Officer", "Star Marines"):
        (None, ("Leadership", 1), None, ("Tactics", 1), None, ("Soc", 1), None),
    ("Marines Officer", "Ground Assault"):
        (None, ("Leadership", 1), None, ("Tactics", 1), None, ("Soc", 1), None),
    ("Navy Officer", "Line/Crew"):
        (None, ("Melee (blade)", 1), ("Leadership", 1), None, ("Tactics (naval)", 1), ("Soc", 1), ("Soc", 1)),
    ("Navy Officer", "Engineering/Gunnery"):
        (None, ("Melee (blade)", 1), ("Leadership", 1), None, ("Tactics (naval)", 1), ("Soc", 1), ("Soc", 1)),
    ("Navy Officer", "Flight"):
        (None, ("Melee (blade)", 1), ("Leadership", 1), None, ("Tactics (naval)", 1), ("Soc", 1), ("Soc", 1)),
}

BENEFITS = {
    "Agent": ("Weapon", "Concealed Armor", "Contact", "Scientific Equipment", "Ally", "Ship Shares"),
    "Army": ("Weapon", "Armor", "Combat Gear", "Vehicle", "Ally", "Ship Shares"),
    "Citizen": ("Weapon", "Professional Gear", "Contact", "Vehicle", "Ally", "Ship Shares"),
    "Drifter": ("Contact", "Weapon", "Ally", "Professional Gear", "Scientific Equipment", "Ship Shares"),
    "Entertainer": ("Contact", "Contact", "Professional Gear", "Vehicle", "Ally", "Ship Shares"),
    "Marines": ("Weapon", "Armor", "Combat Gear", "Vehicle", "Ally", "Ship Shares"),
    "Merchant": ("Contact", "Ally", "Vehicle", "Valuable Item", "Expensive Vehicle", "Ship Shares"),
    "Navy": ("Weapon", "Armor", "Combat Gear", "Vehicle", "Ally", "Ship Shares"),
    "Nobility": ("Contact", "Ally", "Vehicle", "Weapon", "Expensive Vehicle", "Ship Shares"),
    "Aristocrat": ("Contact", "Ally", "Vehicle", "Weapon", "Expensive Vehicle", "Ship Shares"),
    "Rogue": ("Contact", "Weapon", "Professional Gear", "Vehicle", "Ally", "Ship Shares"),
    "Scholar": ("Contact", "Professional Gear", "Technical Library", "Vehicle", "Ally", "Ship Shares"),
    "Scout": ("Contact", "Professional Gear", "Weapon", "Vehicle", "Ally", "Ship Shares"),
    "Explorer": ("Contact", "Professional Gear", "Weapon", "Vehicle", "Ally", "Ship Shares"),
    "Psion": ("Contact", "Weapon", "Professional Gear", "Vehicle", "Ally", "Ship Shares"),
    "Warden": ("Weapon", "Concealed Armor", "Contact", "Scientific Equipment", "Ally", "Ship Shares"),
    }

CREDITS = {
    "Agent": (1000, 2000, 5000, 7500, 10000, 25000, 50000),
    "Army": (2000, 5000, 10000, 10000, 10000, 20000, 50000),
    "Citizen": (1000, 5000, 10000, 10000, 10000, 50000, 100000),
    "Drifter": (0, 0, 1000, 2000, 3000, 4000, 8000),
    "Entertainer": (0, 0, 10000, 10000, 40000, 40000, 80000),
    "Marines": (2000, 5000, 5000, 10000, 20000, 30000, 40000),
    "Merchant": (1000, 5000, 10000, 20000, 20000, 40000, 40000),
    "Navy": (1000, 5000, 5000, 10000, 20000, 50000, 50000),
    "Nobility": (10000, 10000, 50000, 50000, 100000, 100000, 200000),
    "Aristocrat": (10000, 10000, 50000, 50000, 100000, 100000, 200000),
    "Rogue": (0, 0, 10000, 10000, 50000, 100000, 100000),
    "Scholar": (5000, 10000, 20000, 30000, 40000, 60000, 100000),
    "Scout": (20000, 20000, 30000, 30000, 50000, 50000, 50000),
    "Explorer": (20000, 20000, 30000, 30000, 50000, 50000, 50000),
    "Psion": (1000, 2000, 4000, 4000, 8000, 8000, 16000),
    "Warden": (1000, 2000, 5000, 7500, 10000, 25000, 50000),
}

AGING = (
    # inverted
    (1, 0, 0, 0),
    (1, 1, 0, 0),
    (1, 1, 1, 0),
    (2, 1, 1, 0),
    (2, 2, 1, 0),
    (2, 2, 2, 0),
    (2, 2, 2, 1),
)

PERSONALITIES = (
    ('Pessimistic', 'Courage', 'Generous', 'Argumentative', 'Careless',
     'Suspicious', 'Quiet', 'Greedy', 'Opinionated', 'Violent',
     'Uncivilized', 'Capricious', 'Optimistic', 'Exacting', 'Sober',
     'Curious', 'Naive', 'Friendly', 'Arrogant', 'Moody'),
    ('Thoughtless', 'Narrow-minded', 'Retiring', 'Nervous', 'Hot-tempered',
     'Realistic', 'Irreverent', 'Happy', 'No common sense', 'Covetous',
     'Forgiving', 'Overbearing', 'Shy', 'Compassionate', 'Charitable',
     'Cruel', 'Perfectionist', 'Prying', 'Sadistic', 'Spendthrift',
     'Mousy', 'Brave', 'Keen', 'Intellectual', 'Cheerful',
     'Garrulous', 'Boorish', 'Harsh', 'Paranoid', 'Kind-hearted',
     'Mischievous', 'Thrifty', 'Lusty', 'Uncultured', 'Punctual',
     'Depressing', 'Miserly', 'Gloomy', 'Absent-minded', 'Jealous',
     'Dull', 'Blustering', 'Foolhardy', 'Kind', 'Diplomatic',
     'Proud', 'Graceless', 'Scheming', 'Barbaric', 'Practical',
     'Morose', 'Rude', 'Trusting', 'Soft-spoken', 'o',
     'Antagonistic', 'Inquisitive', 'Bigoted', 'Secretive', 'Hick',
     'Reverent', 'Haughty', 'Extravagant', 'Truthful', 'Pleasant',
     'Biased', 'Insensitive', 'Level-headed', 'Fearless', 'Sarcastic',
     'Driven', 'Warlike', 'Laconic', 'Compulsive', 'Craven',
     'Honest', 'Madcap', 'Avaricious', 'Cynical', 'Articulate',
     'Perceptive', 'Elitist', 'Aloof', 'Obsequious', 'Cautious',
     'Innocent', 'Crude', 'Immoral', 'Easy-going', 'Ponderous',
     'Impulsive', 'Hard-hearted', 'Dreamy', 'Hide-bound', 'Stern',
     'Fatalistic', 'Gullible', 'Vengeful', 'Wastrel', 'Irritable'),
    ('Multiple personalities', 'Never throws anything away', 'Narrow-minded', 'Speaks in metaphor', 'Nervous',
     "Gets peoples' names wrong", 'Blinks a lot', 'Has impressive hand', 'Ponderous', 'Runs everywhere',
     'Very short', 'Irreverent', 'Very tall', 'Famous', 'Covetous',
     'Speaks with heavy accent', 'Picks nose', 'Has a tattoo of a grey bird on chest', 'Has an artificial backside', 'Prefers the company of another race',
     'Dull senses', 'Only deals with local people', 'Avoids eye contact', 'Has an artificial calf', 'Obsessively Craven',
     'Plays with hair', 'Very thin', 'Was formerly much richer', 'Dresses wrong for the weather', 'Overbearing',
     'Eats raw meat', 'Compassionate', 'Has a secret fantasy : Spells, baneful', 'Keen',
     'Perfectionist', 'Tells jokes', 'Sadistic', 'Spendthrift', 'Mousy',
     'Exaggerates everything', 'Brave', 'Morose', 'Suffers from a long term illness', 'Very agile',
     'Seems very intelligent', 'Intellectual', 'Cheerful', 'Garrulous', 'Extravagant',
     'Nocturnal', 'Accompanied by Madcap daughter', 'Admires a historical hero', 'Collects lanterns', 'Heavily tattooed',
     'Very fat', 'Paranoid', 'Hair dyed yellow', 'Kind-hearted', 'Mischievous',
     'Thrifty', 'Slobbish', 'Never uses contractions', 'Lusty', 'Teetotal',
     'Uncultured', 'Whittles wood in spare time', 'Keeps hand on weapon', 'Punctual', 'Has startlingly grey hair',
     'Mixes words up', 'Depressing', 'Owns slaves', 'Miserly', 'Coughs a lot',
     'Jealous', 'Dull', 'Has a prominent scar on shin', 'Blustering', 'Foolhardy',
     'Kind', 'Foul smelling', 'Has a phobia of boots', 'Diplomatic', 'Wears a flower in buttonhole or hair',
     'Proud', 'Flatulant', 'Barbaric', 'Wears clothes a size too small', 'Has impressive scalp',
     'Has warts', 'Alcoholic', 'Practical', 'Has a prominent scar on back', 'Obsequious',
     'Has a secret fantasy : Espionage ', 'Recently lost daughter in a tragedy', 'Trusting', 'Has an identical twin',
     'Whispers constantly to self', 'Has wanderlust', 'Antagonistic', 'Inquisitive', 'Bigoted',
     'Talks to inanimate objects', 'Accompanied by Avaricious lover', 'Pale',
     'Reverent', 'Very deep bass voice', 'Haughty', 'Deceitful', 'Boorish', 'Uses foul language',
     'Talks very fast', 'Prudish', 'Cracks knuckles', 'Addicted to a healing herb', 'Truthful',
     'Always accompanied by Soft-spoken lover', 'Driven', 'Biased', 'Was formerly much poorer', 'Gloomy',
     'Rude', 'Constantly turns head as if listening to things', 'Sarcastic', 'Pleasant', 'Close to family',
     'Always scratching', 'Stomps on bugs', 'Warlike', 'Keeps looking over shoulder', 'Talks to animals',
     'Laconic', 'Vegetarian', 'Compulsive', 'Owns a signature item - a distinctive spectacles', 'Craven',
     'Honest', 'Madcap', 'Avaricious', 'Inspires loyalty in others', 'Dances badly',
     'Has many missing teeth', 'Licks lips', 'Slurred speech', 'Physically weak', 'Tanned',
     'Forgiving', 'Beautiful', 'Cynical', 'Older than appears', 'Well known for being skilled at a trade',
     'Foams at the mouth when excited', 'Articulate', 'Perceptive', 'Searching for a long-lost aunt', 'Elitist',
     'Aloof', 'Has a secret fantasy : Cannibalism', 'Repeats self in coversations', 'Very wise', 'Has recently fallen in love',
     'Hair dyed pink', 'Sports enthusiast', 'Frowns all the time', 'Gives people inappropriate nicknames', 'Accompanied by Compulsive grandfather',
     'Only deals with people of same religion', 'Bites nails (or claws)', 'Virgin', 'Innocent', 'Crude',
     'Acts like a character in a Mystery', 'Enjoys watching combat sports', 'Has a prominent scar on eye', 'Uses hands to emphasis speech', 'Suffers from hallucinations',
     'Hypochondriac', 'Whispers when speaking', 'Hot-tempered', 'Impulsive', 'Loves stories',
     'Constantly checking own appearance in mirrors, ponds etc', 'Hard-hearted', 'Dreamy', 'Hide-bound',
     'On the run from criminals', 'Searching for lost map', 'Easy-going', 'Hair dyed silver', 'Irritable',
     'Known by a nickname', 'Sweet tooth', 'Hugs trees', 'Gullible', 'Ugly',
     'Speaks in poetry', 'Searching for lost dagger', 'Very hairy', 'Younger than appears', 'Vengeful',
     'Flirt', 'Realistic', 'Smiles all the time', 'Always chewing', 'Only deals with people of same race',
     'Stern', 'Has visions', 'On the run from the law', 'Once owned slaves'))
