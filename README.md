Travgen
=======

A toolkit for Mongoose Traveller character generation, originally built for
the Chthonian Stars campaign setting. The primary interface is a browser app;
a legacy Python CLI is also included.

Web App
-------

**https://gruevyhat.github.io/travgen/**

The browser app supports character generation with full build transcripts,
UPP generation, animal generation, and dice rolling. Characters are shareable
via hex seeds that reproduce results exactly. The app runs entirely in the
browser — no server required.

Features:
- Character generation with career planning, expansion career books, and
  optional psionics
- Health tracker (damage tracking, Str/Dex/End, status indicators)
- Upload a previously downloaded `.md` file to reload a character by seed
- Animal and UPP generation, generic dice roller

Run locally:

    cd app
    npm install
    npm run dev

Build (outputs to `docs/` for GitHub Pages):

    cd app
    npm run build

Test suite:

    cd app
    npm test


Legacy Python CLI (deprecated)
-------------------------------

The original Python command-line generator is still present but is no longer
actively maintained. It requires Python 3.11+.

    Usage: travgen char [--name NAME] [--homeworld WORLD]
                        [--ethnicity ETHNICITY] [--gender GENDER]
                        [--upp UPP] [--method METHOD] [--psi PSI]
                        [--terms TERMS] [--path PATH]
                        [--rand-age] [--max-careers CAREERS]
                        [--personality] [--random-seed SEED]
                        [--show-hist]
           travgen UPP [--method METHOD] [--psi PSI]

Install:

    git clone http://github.org/gruevyhat/travgen.git
    cd travgen
    python setup.py install

Run tests:

    python -m unittest discover -s tests -v

Dependencies: docopt>=0.6.1


Changelog
---------

**0.1.0**
- React/Vite browser app with health tracker, .md upload, build transcripts
- Completed Python 3 migration and test suite (34 tests)
- Fixed animal, attributes, career_path, and character generation bugs

**0.0.10**
- Added psionics support and Core Rules benefit rolls

**0.0.9–0.0.8**
- Career listing, commission failure reporting, personalities, reproducible seeds,
  Chthonian Stars expansion careers, void terrain
