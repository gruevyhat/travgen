Travgen 0.0.3
=============

A (partial) character generation script for Mongoose Traveller. Generate a character with a random name, gender, UPP, ethnicity, planet of origin, and career path. MGT books are still required for generation of skills, events, and the fleshing out of other details. 


Usage
-----

The script is run from the command line with the following syntax. All input variables may be stipulated at the command line rather than randomly generated, including career path. The script may also be used to generate UPPs and roll arbitrary sets of dice. 

    Usage: travgen char [--name STR] [--homeworld STR] [--ethnicity STR]
                        [--gender <Male|Female>] [--upp HEX]
                        [--method <normal|heroic|superherioc>]
                        [--terms INT] [--path STR]
                        [--expansions LIST]
           travgen UPP [--method <normal|heroic|superherioc>]
           travgen roll DICE
           travgen (-h | --help)

    Arguments:
        DICE    Number and sides of dice in '#d#' format, e.g., 2d6.

    Options:
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
        -u --upp HEX           Supply a pre-generated UPP or it will be randomly
                                 generated.
        -m --method STR        If no UPP, method for rolling characteristics:
                                 "normal", "heroic", "superheroic", "mediocre", or
                                 "extreme". [default: normal]
        -t --terms INT         Number of terms to serve. [default: 3]
        -p --path STR          Colon-delimited career path of the form:
                                 "career:spec::career:spec::...".
        -x --expansions LIST   Comma-delimited list of Traveller expansions to
                                 include for career options. Currently supports:
                                 Agent, Dilettante, Scoundrel, and Cthonian Stars.
        -h --help


Character stats are presented in UPP format, and may be generated with a variety of rolling methods. Random names are similar to, but often not exactly the same as, modern names of a random Earth ethnicity. Career path is presented as a table with the following fields.

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


Note that the script does not currently generate skills, events, mishaps, benefits, and aging effects because, frankly, it would be a terrific pain to tabulate all the required career data from the books. >.<  As a result, the Mongoose Traveller Core Rulebook and sundry expansions are required to fully flesh out a character.


Example
-------

In the example below, Fradina Jovina was drafted into the Navy in her first term after failing to qualify for another career. She enjoyed some success, rising to the enlisted rank of Petty Officer 3rd Class before an unfortunate mishap ended her military career. She started over as a colonist to a new world to forget her misadventures.

    $ travgen char --terms 4

    Jovini, Fradina
    Female Callistan (Italian), age 34
    UPP: 57a798
    Career Path:
    T  Career   Spec       Q  S  A  Edu  BT  SR  Rnk  EM      Age  Ben  
    0  Navy     Line-Crew  N  Y  Y  4    6   2   1    e[2,5]  -    2    
    1  Navy     Line-Crew  Y  Y  Y  0    0   2   2    e[1,2]  -    3    
    2  Navy     Line-Crew  Y  N  N  0    0   1   2    m[6]    -    -    
    3  Citizen  Colonist   Y  Y  Y  0    1   2   1    e[6,5]  3    1    


Installation
------------

Standard Python package installation.

    > git clone https://github.org/gruevyhat/travgen.git
    > cd travgen
    > python setup.py install

