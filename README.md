Travgen 0.0.7
=============

A gamemaster toolkit for the Chthonian Stars, a campaign setting for Mongoose Traveller(c). The script generates random characters complete with name, gender, UPP, ethnicity, planet of origin, skills, and career path. CT and MGT books are still required for generation of events, and the fleshing out of other details. The scripts also provide functionality for animal generation, UPP generation, and generic dice rolling.


Usage: Character Generation
---------------------------

The script is run from the command line with the following syntax. All input variables may be stipulated at the command line rather than randomly generated, including career path. The script may also be used to generate UPPs and roll arbitrary sets of dice. 

    Usage: travgen char [--name NAME] [--homeworld WORLD] [--ethnicity ETHNICITY]
                        [--gender GENDER] [--upp UPP] [--method METHOD] [--rand-age]
                        [--terms TERMS] [--path PATH] [--full-path] [--show-hist]
           travgen UPP [--method STR ]

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

Character stats are presented in UPP format, and may be generated with a variety of rolling methods. Random names are similar to, but often not exactly the same as, modern names of a random Earth ethnicity. The `--rand-age` parameter will cause starting ages to fluctuate slightly, for a more 'realistic' starting age. The `--max-careers` option allows one to specify an upper limit on the number of careers that a character goes through, effectively generating a series of characters until one is found that meets the condition. The `--personality` parameter is for comedic value, and provides some random personality quirks, along with a Meyers-Briggs personality profile.

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

Career choices may be prespecified at the command line, with careers and specializations separated by a single colon ":" and terms separated by a double colon "::", as shown below. Note that this does not guarantee that the character will generate with this career path; if the character fails to qualify for a career or has a mishap, random career choice will occur.

    $ travgen char -p "Marines:Star Marine::Warden:Enforcer::Warden:Enforcer"

    Beneš, Hana
    Female Enceladian (Czech), age 30
    UPP: 939aa7 [8.0]
    Career Path: Marines (Star Marines) [Rank 1], Warden (Enforcer) [Rank 2]
    ...

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


Dependencies
------------

docopt>=0.6.1
