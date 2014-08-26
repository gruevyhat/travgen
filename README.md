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
      -u --upp HEX           Supply a pre-generated UPP or it will be randomly
                               generated.
      -m --method STR        If no UPP, method for rolling characteristics:
                               normal, heroic, superheroic, mediocre, or
                               extreme. [default: normal]
      -t --terms INT         Number of terms to serve. [default: 3]
      -p --path STR          Colon-delimited career path of the form:
                               "career:spec::career:spec::...".
      -f --full-path         Show full career path.
      -s --show-hist         Show full career history.

Character stats are presented in UPP format, and may be generated with a variety of rolling methods. Random names are similar to, but often not exactly the same as, modern names of a random Earth ethnicity. The career path may be listed in one (or both) of two ways. The `--show-hist` option returns a narrative description of the steps taken during character generation. The `--full-path` option presents a tabular representation of these steps.

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

In the example below, Fradina Jovina was drafted into the Navy in her first term after failing to qualify for another career. She enjoyed some success, rising to the enlisted rank of Petty Officer 3rd Class before an unfortunate mishap ended her military career. She started over as a colonist to a new world to forget her misadventures.

    $ travgen char --terms 4 --full-path

    Jovini, Fradina
    Female Callistan (Italian), age 34
    UPP: 57a798
    Career Path:
    T  Career   Spec       Q  S  A  Edu  BT  SR  Rnk  EM      Age  Ben  
    0  Navy     Line-Crew  N  Y  Y  4    6   2   1    e[2,5]  -    2    
    1  Navy     Line-Crew  Y  Y  Y  0    0   2   2    e[1,2]  -    3    
    2  Navy     Line-Crew  Y  N  N  0    0   1   2    m[6]    -    -    
    3  Citizen  Colonist   Y  Y  Y  0    1   2   1    e[6,5]  3    1    
    Skills: Admin 0, Carouse 0, Comms 0, Drive 0, Engineer 0, Gun Combat 2, Gunner 0, Mechanic 2, Pilot 0, Vacc Suit 1, Zero-G 0

Note that the script does not currently generate events, mishaps, or pensions. 


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
