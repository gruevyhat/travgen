Travgen
=======

**v2.0.0** — A Mongoose Traveller character generator. The primary interface is
a browser app; a legacy Python CLI is deprecated.

**https://gruevyhat.github.io/travgen/**

---

Features
--------

**Character generation**
- Full career system with terms, aging, advancement, and muster-out benefits
- Career planning mode: pin a sequence of careers before rolling
- Psionics (off by default; configurable)
- Personality generation (optional)
- Reproducible results via hex seeds — share or bookmark a character exactly
- Build transcript: every career event, skill gain, and benefit roll logged

**Interactive character sheet**
- Click any skill or attribute to roll a Mongoose Traveller task check (2d6 +
  skill + characteristic DM); unskilled rolls apply −3 DM automatically
- Weapon attack rolls with damage display
- Default characteristic per skill follows RAW (e.g. Pilot → Dex, Persuade → Soc)

**Health tracker**
- Track Str/Dex/End damage across a session
- Damage applied to Endurance first per RAW; remaining to Str/Dex at player choice
- Stat boxes colour amber (wounded) or red (zero)

**Spacecraft**
- Characters who receive a ship benefit display spacecraft details (type, tonnage,
  mortgage, status)

**Other generators**
- UPP generator
- Animal encounter generator (terrain, order, behaviour, sentience)
- Generic dice roller (any expression, e.g. `3d6`, `2d6+3`)

**Expansion careers** (optional, enable per-character)
- Chthonian Stars (with ethnicity support)
- Dilettante, Agent, Scoundrel, Psion

**Save and load**
- Download a character as a Markdown file
- Upload a `.md` file to reload the character by seed
- Shareable URL per character/tool/seed

---

Running locally
---------------

    cd app
    npm install
    npm run dev        # development server
    npm run build      # output to docs/ for GitHub Pages
    npm test           # test suite

---

Legacy Python CLI (deprecated)
-------------------------------

The original command-line generator is no longer maintained. Python 3.11+ required.

    Usage: travgen char [--name NAME] [--homeworld WORLD]
                        [--ethnicity ETHNICITY] [--gender GENDER]
                        [--upp UPP] [--method METHOD] [--psi PSI]
                        [--terms TERMS] [--path PATH]
                        [--rand-age] [--max-careers CAREERS]
                        [--personality] [--random-seed SEED]
                        [--show-hist]
           travgen UPP [--method METHOD] [--psi PSI]

    git clone http://github.org/gruevyhat/travgen.git
    cd travgen
    python setup.py install
    python -m unittest discover -s tests -v

Dependencies: docopt>=0.6.1

---

Changelog
---------

**2.0.0**
- Interactive task check rolls: click any skill, attribute, or weapon
- Health tracker with Mongoose Traveller damage rules
- Markdown upload to reload a character by seed
- Spacecraft section for ship-benefit characters
- Individual benefit roll steps in build transcript
- RAW specialty rules: level-0 specialties collapse to base skill (0)
- Fixed GitHub Pages deployment (asset base path)

**0.1.0**
- React/Vite browser app with full character sheet, build transcripts, health
  tracker, and .md upload
- Completed Python 3 migration and test suite

**0.0.10**
- Psionics support and Core Rules benefit rolls

**0.0.9–0.0.8**
- Career listing, commission failure reporting, personalities, reproducible seeds,
  Chthonian Stars expansion careers, void terrain
