Travgen 0.1.0
=============

A gamemaster toolkit for the Chthonian Stars, a campaign setting for Mongoose Traveller(c). The script generates random characters complete with name, gender, UPP, ethnicity, planet of origin, skills, and career path. CT and MGT books are still required for generation of events, and the fleshing out of other details. The scripts also provide functionality for animal generation, UPP generation, and generic dice rolling.

Browser App
-----------

Travgen now includes a stand-alone React/Vite browser app. Source files live in
`app/`; generated GitHub Pages files live in `docs/`.

Run locally:

    > cd app
    > npm install
    > npm run dev

Build the GitHub Pages artifact:

    > cd app
    > npm run build

Run the browser app test suite:

    > cd app
    > npm test

The build writes to `docs/`. Treat `docs/` as generated output and edit source
files in `app/`. For repository publishing setup, see the GitHub Pages
documentation.

The browser app currently supports UPP generation, character generation with
advanced controls and expansion toggles, copyable plain-text output, animal
generation, and dice rolling. Hex seeds reproduce results within the browser app;
they are not intended to match Python's random output byte-for-byte.


Usage: Character Generation
---------------------------

The script is run from the command line with the following syntax. All input variables may be stipulated at the command line rather than randomly generated, including career path. The script may also be used to generate UPPs and roll arbitrary sets of dice. 

    Usage: travgen char [--name NAME] [--homeworld WORLD]
                        [--ethnicity ETHNICITY] [--gender GENDER]
                        [--upp UPP] [--method METHOD] [--psi PSI]
                        [--terms TERMS] [--path PATH]
                        [--rand-age] [--max-careers CAREERS]
                        [--personality] [--random-seed SEED]
                        [--show-hist]
           travgen UPP [--method METHOD] [--psi PSI]
    
    Character Generation Options:
      -n --name STR          Character name.
      -w --homeworld STR     Character's world of origin.
      -e --ethnicity STR     Ethnic group and random naming convention;
                               currently supports: American, Arabic, Brazilian,
                               British, Chechen, Chinese, Czech, Danish,
                               Filipino, Finnish, French, German, Greek,
                               Hungary, Irish, Italian, Jamaican, Japanese,
                               Korean, Mongolian, North Indian, Portuguese,
                               Roma, Russian, Senegalese, Sicilian, Spanish,
                               Thai.
      -g --gender STR        Male or female.
      -a --rand-age          Randomize term length (+/-1 year).
      -u --upp HEX           A pre-generated UPP.
      -i --psi STR           Psi attribute enabled for a given campaign type:
                               traditional, psi-heavy, space opera,
                               science fantasy, transcendent.
      -t --terms INT         Number of terms to serve. [default: 3]
      -p --path STR          Colon-delimited career path of the form:
                               "career:spec::career:spec::...".
      -P --personality       Random personality.
      -x --max-careers INT   Maximum number of careers.
      -s --show-hist         Show full career history.

Run without options, the character generator will return a full character, complete with Skills and Benefits. 

    $ travgen char

    Santuniz, Verna
    Female Belter (American), age 30
    UPP: 847679 [6.8]
    Career Path: Drifter (Wanderer) [Rank 2]
    Skills: Art 0, Athletics 2, Carouse 0, Deception 1, Recon 0, Social Science 0, Stealth 0, Streetwise 2, Survival 0
    Benefits: Ally x1
    Random seed: cd515598

Character stats are presented in UPP format, and may be generated with a variety of ways with the `--method` parameter. The number in brackets '[...]' is the average of the attributes. The same methods are available for generating UPPs only with `travgen UPP`.

* normal: 2d6
* heroic: 3d6, drop the lowest
* superheroic: 2d6+3
* mediocre: 4d3
* extreme: 1d16-1
* alternating: 4d6, sorted, drop the 2nd and 4th 

Every character is generated with a random seed that allows one to regenerate the character on the command line with addition options. For example, if one wants to see the character's full generation history, the `--show-hist` option will reproduce the above character will all steps leading to her creation. 

    $ travgen char --random-seed cd515598 --show-hist

The `--show-hist` option returns a narrative description of the steps taken during character generation. Included in the history is a career path table, allowing one to easily scan the pertinent rolls that lead to the generation of the character. The columns of the table are:

* T = The term number.
* Q = Qualified/enlisted successfully?
* S = Survived?
* A = Advanced?
* Edu = Number of starting skills based on homeworld.
* BT = Number of basic training skills.
* SR = Number of skill rolls for the term.
* Rnk = Professional rank.
* EM = Event or Mishap. The numbers in brackets are rolls to be looked up in the core rules.
* Age = Result of rolling 2d6 and subtracting number of completed terms.
* Ben = Benefit roll for the term.

Career choices may be prespecified at the command line, with careers and specializations separated by a single colon ":" and terms separated by a double colon "::", as shown below. Note that this does not guarantee that the character will generate with this career path; if the character fails to qualify for a career or has a mishap, random career choice will occur. Career paths can be partially specified, replacing any career or specialization with "-". The following command will attempt to generate a character with a random first term and second and subsequent terms as a Warden Enforcer.

    $ travgen char -p "-:-::Warden:Enforcer"

    Beneš, Hana
    Female Enceladian (Czech), age 30
    UPP: 939aa7 [8.0]
    Career Path: Marines (Star Marines) [Rank 1], Warden (Enforcer) [Rank 2]
    ...

The remaining options are largely self-explanatory. Random names are similar to, but often not exactly the same as, modern names of a random Earth ethnicity. The `--rand-age` parameter will cause starting ages to fluctuate slightly, for a more 'realistic' starting age. The `--max-careers` option allows one to specify an upper limit on the number of careers that a character goes through, effectively generating a series of characters until one is found that meets the condition. The `--personality` parameter is for comedic value, and provides some random personality quirks, along with a Meyers-Briggs personality profile.

The script does not currently generate the effects of events, mishaps, or pensions. 


Usage: Animal Generation
------------------------

The script also generate random creatures per the rules in the MGT Core Rulebook. 

    Usage: travgen animal [--terrain TERRAIN] [--behavior BEHAVIOR] [--order ORDER]
                          [--sentient]

    Animal Generation Options:
        --terrain TERRAIN     One of: Mountain, Hills, Open Ocean, Clear, Riverbank,
                                Swamp, Deep Ocean, Woods, Plain/Prairie, Forest,
                                Ocean Shallows, Rainforest, Rough, Beach, Desert,
                                Jungle.
        --behavior BEHAVIOR   One of: Intimidator, Siren, Reducer, Trapper,
                                Intermittent, Hijacker, Eater, Pouncer, Hunter,
                                Filter, Grazer, Carrion-Eater, Chaser, Brute Killer,
                                Gatherer, Swift Killer.
        --order ORDER         One of: Scavenger, Omnivore, Herbivore, Carnivore. 
        --sentient            Creature has an intelligence greater than 1.


Usage: Dice Roller
------------------

The script can also be used to generate random numbers from simulated dice of any number of sides.

    Usage: travgen roll DICE

    Dice Roll Arguments:
        DICE    Number and sides of dice in '#d#' format, e.g., 2d6.


Installation
------------

Standard Python package installation.

    > git clone http://github.org/gruevyhat/travgen.git
    > cd travgen
    > python setup.py install

Requires Python 3.11+.


Dependencies
------------

docopt>=0.6.1


Testing
-------

A test suite covering dice, stats, skills, character generation, career paths,
animal generation, and name generation is included.

    > python -m unittest discover -s tests -v


Changelog
---------

**0.1.0**
- Completed Python 3 migration: fixed `iteritems()`, byte-string `.decode()`,
  and `random.sample()` rejecting sets (Python 3.11+)
- Fixed `animal.py`: SIZES table stats were rolled once at import time, causing
  all animals of the same size category to share identical stats within a run;
  now rolled fresh per animal
- Fixed `animal.py`: typo `elf.skills` → `self.skills` in `get_skills()`
- Fixed `animal.py`: `QUIRKS.items()` result is no longer subscripted directly
- Fixed `attributes.py`: `Stat(value=...)` keyword arg was being passed
  positionally as `method`, causing psi-heavy stat to be re-rolled randomly
- Fixed `career_path.py`: `Stat` was not imported, causing `NameError` on aging
  penalties; duplicate `attempted.append()` in `qualify()` removed
- Fixed `character.py`: redundant `hw` reassignment removed
- Fixed `lc.py`: recursive `gen()` replaced with iterative loop to prevent
  stack overflow on tight name-length bounds
- Replaced wildcard `from data import *` in `career_path.py` with explicit
  imports; removed duplicate constant definitions
- Added test suite (34 tests)

**0.0.10**
- Added psionics support (`--psi` option, Psion career)
- Psi strength degrades by 1 per term served before joining the Psion career
- Switched to Core Rules benefit rolls

**0.0.9**
- Added career/specialization listing (`--list`)
- Added commission failure reporting in career history

**0.0.8**
- Added random personalities (`--personality`)
- Added reproducible generation via `--random-seed`
- Added `--max-careers` option
- Added Chthonian Stars expansion careers and skills
- Added void terrain type for animal generation
- Added Cthuvian animal names
