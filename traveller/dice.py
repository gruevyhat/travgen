#!/usr/bin/python


from random import sample


def sample1(rng):
    return sample(rng,1)[0]


def die(sides):
    R = range(1,sides+1)
    def roll(dice):
        return sum(sample1(R) for i in range(dice))
    return roll

d100 = die(100)
d16 = die(16)
d6 = die(6)
d5 = die(5)
d3 = die(3)

d66 = lambda: (d6(1)*10) + d6(1)
d6_drop1 = lambda N: sum((d5(1) + 1) for n in range(N))


if __name__ == "__main__":

#   D = [d6(2), d6(2), d6(2), d6(2), d6(2), d6(2)]

#   print "UPP: %x%x%x%x%x%x [%d]" % tuple(D+[sum(D)])

    print d6(1), d6(1), d6(1), d6(1), d6(1), d6(1)
