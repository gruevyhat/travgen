#!/usr/bin/python

from random import choice
from collections import defaultdict
from names import NAMES


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


def lc(ethnicity, gender, n=5, min_len=0, max_len=15):
    ethnicity, gender = ethnicity.lower(), gender.lower()
    if ethnicity == "american":
        fullname = ((choice(NAMES.keys()), "family"), (ethnicity, gender))
    else:
        fullname = ((ethnicity, "family"), (ethnicity, gender))
    models = [train(NAMES[eth][nam]) for eth, nam in fullname]
    names = [gen(m, min_len, max_len) for m in models]
    if ethnicity == "russian" and gender == "female":
        names[0] += 'a'
    return ', '.join(names)


if __name__ == "__main__":

    print lc("american", "female")
