#!/usr/bin/python

from random import choice
from collections import defaultdict
from traveller.names import NAMES, CTHUVIAN


def readdata(fn):
    with open(fn, 'r') as fi:
        lines = [line.strip().decode('utf8')
                 for line in fi.readlines()
                 if not line.startswith("#")]
    return lines


def train(words):
    m = defaultdict(list)
    for w in words:
        w = " " + w + "_"
        if len(w) > 3:
            for c in range(len(w)-2):
                m[w[c:c+2]].append(w[c+2])
    return m


def gen(m, min_len=0, max_len=15):
    name = choice([w for w in m.keys()
                   if w.startswith(" ")])
    while name[-1] != "_":
        name += choice(m[name[-2:]])
    name = name.replace("_", "").strip()
    if not (min_len < len(name) < max_len):
        return gen(m, min_len, max_len)
    else:
        return name


def build_cthuvian_wordlist(N=200):
    W = []
    for n in range(N):
        pfx = [choice((choice(CTHUVIAN["pfx-pro"]), None))]
        pfx += [choice((choice(CTHUVIAN["pfx-neg"]), None))]
        root = [choice((choice(CTHUVIAN["VB"]), None)),
                choice((choice(CTHUVIAN["AA"]), None)),
                choice(CTHUVIAN["NN"]),
                choice((choice(CTHUVIAN["NN"]), None))]
        sfx = [choice((choice(CTHUVIAN["sfx-deriv"]), None))]
        W.append(''.join([w[0] for w in pfx + root + sfx if w]))
    return W


def lc(ethnicity=None, gender=None, cthuvian=False,
       n=5, min_len=2, max_len=15):
    if cthuvian:
        names = build_cthuvian_wordlist()
        models = ((train(names)),)
    else:
        ethnicity, gender = ethnicity.lower(), gender.lower()
        if ethnicity == "american":
            fullname = ((choice(list(NAMES.keys())), "family"),
                        (choice(list(NAMES.keys())), gender))
        else:
            fullname = ((ethnicity, "family"), (ethnicity, gender))
        models = [train(NAMES[eth][nam]) for eth, nam in fullname]
    names = [gen(m, min_len, max_len) for m in models]
    if ethnicity == "russian" and gender == "female":
        names[0] += 'a'
    return ', '.join(names)


if __name__ == "__main__":

    print(lc("american", "female"))
