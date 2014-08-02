#!/usr/bin/python

DRAFT = ["Army", "Navy", "Marines"]

FALLBACK_CAREERS = ["Drifter"] + DRAFT

CAREERS = {
    'Merchants': {
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
        'Line-Crew': {'Surv': ('Int', 5), 'Qual': ('Int', 6), 'Adv': ('Edu', 7)},
        'Flight': {'Surv': ('Dex', 7), 'Qual': ('Int', 6), 'Adv': ('Edu', 5)},
        'Engineering-Gunnery': {'Surv': ('Int', 6), 'Qual': ('Int', 6), 'Adv': ('Edu', 6)}},
    'Marines': {
        'Star Marine': {'Surv': ('End', 6), 'Qual': ('End', 6), 'Adv': ('Edu', 6)},
        'Support': {'Surv': ('End', 5), 'Qual': ('End', 6), 'Adv': ('Edu', 7)},
        'Ground Assault': {'Surv': ('End', 7), 'Qual': ('End', 6), 'Adv': ('Edu', 5)}},
    'Army (Officer)': {
        'Cavalry': {'Surv': ('Dex', 7), 'Qual': ('End', 5), 'Adv': ('Int', 5)},
        'Support': {'Surv': ('End', 5), 'Qual': ('End', 5), 'Adv': ('Edu', 7)},
        'Infantry': {'Surv': ('Str', 6), 'Qual': ('End', 5), 'Adv': ('Edu', 6)}},
    'Navy (Officer)': {
        'Line-Crew': {'Surv': ('Int', 5), 'Qual': ('Int', 6), 'Adv': ('Edu', 7)},
        'Flight': {'Surv': ('Dex', 7), 'Qual': ('Int', 6), 'Adv': ('Edu', 5)},
        'Engineering-Gunnery': {'Surv': ('Int', 6), 'Qual': ('Int', 6), 'Adv': ('Edu', 6)}},
    'Marines (Officer)': {
        'Star Marine': {'Surv': ('End', 6), 'Qual': ('End', 6), 'Adv': ('Edu', 6)},
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
    'Agent': {
        'Intelligence': {'Surv': ('Int', 7), 'Qual': ('Int', 6), 'Adv': ('Int', 5)},
        'Corporate': {'Surv': ('Int', 5), 'Qual': ('Int', 6), 'Adv': ('Int', 7)},
        'Law Enforcement': {'Surv': ('End', 6), 'Qual': ('Int', 6), 'Adv': ('Int', 6)}}
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

CTHONIAN_STARS = {
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

