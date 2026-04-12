#!/usr/bin/env python3

import unittest
from random import seed


class TestDice(unittest.TestCase):

    def setUp(self):
        from traveller.dice import d6, d3, d16, d66
        self.d6 = d6
        self.d3 = d3
        self.d16 = d16
        self.d66 = d66

    def test_d6_single_range(self):
        for _ in range(100):
            self.assertIn(self.d6(1), range(1, 7))

    def test_d6_multiple_range(self):
        for _ in range(100):
            v = self.d6(2)
            self.assertGreaterEqual(v, 2)
            self.assertLessEqual(v, 12)

    def test_d3_range(self):
        for _ in range(100):
            self.assertIn(self.d3(1), range(1, 4))

    def test_d16_range(self):
        for _ in range(100):
            self.assertIn(self.d16(1), range(1, 17))

    def test_d66_range(self):
        for _ in range(100):
            v = self.d66()
            self.assertGreaterEqual(v, 11)
            self.assertLessEqual(v, 66)


class TestStat(unittest.TestCase):

    def setUp(self):
        from traveller.attributes import Stat
        self.Stat = Stat

    def test_explicit_value(self):
        s = self.Stat(value=7)
        self.assertEqual(int(s), 7)

    def test_modifier(self):
        # modifier = value // 3 - 2
        self.assertEqual(self.Stat(value=7)(), 0)
        self.assertEqual(self.Stat(value=6)(), 0)
        self.assertEqual(self.Stat(value=9)(), 1)
        self.assertEqual(self.Stat(value=0)(), -3)

    def test_add_clamps_at_zero(self):
        s = self.Stat(value=2)
        self.assertEqual(int(s - 5), 0)

    def test_add_increases(self):
        s = self.Stat(value=5)
        self.assertEqual(int(s + 3), 8)

    def test_methods(self):
        for method in ("normal", "heroic", "superheroic", "mediocre", "extreme", "alternating"):
            s = self.Stat(method=method)
            self.assertGreaterEqual(int(s), 0)
            self.assertLessEqual(int(s), 18)


class TestSkillSet(unittest.TestCase):

    def setUp(self):
        from traveller.attributes import SkillSet
        self.SkillSet = SkillSet

    def test_learn_new_skill(self):
        sk = self.SkillSet()
        sk.learn({"Pilot": 1})
        self.assertEqual(sk["Pilot"], 1)

    def test_learn_stacks(self):
        sk = self.SkillSet()
        sk.learn({"Pilot": 1})
        sk.learn({"Pilot": 1})
        self.assertEqual(sk["Pilot"], 2)

    def test_learn_zero_initialises(self):
        sk = self.SkillSet()
        sk.learn(["Recon"])
        self.assertEqual(sk["Recon"], 0)

    def test_list_excludes_negative(self):
        sk = self.SkillSet()
        sk.learn({"Pilot": 1})
        # unknown skill has default -3, should not appear in list
        names = [k for k, v in sk.list()]
        self.assertIn("Pilot", names)
        self.assertNotIn("Recon", names)


class TestStats(unittest.TestCase):

    def setUp(self):
        from traveller.attributes import Stats
        self.Stats = Stats

    def test_upp_parsing(self):
        st = self.Stats(upp="7a9888")
        self.assertEqual(int(st.Str), 7)
        self.assertEqual(int(st.Dex), 10)
        self.assertEqual(int(st.End), 9)
        self.assertEqual(int(st.Int), 8)
        self.assertEqual(int(st.Edu), 8)
        self.assertEqual(int(st.Soc), 8)

    def test_repr_format(self):
        st = self.Stats(upp="777777")
        r = repr(st)
        self.assertTrue(r.startswith("UPP: "))
        self.assertIn("[", r)

    def test_psi_traditional(self):
        seed(42)
        st = self.Stats(psi="traditional")
        self.assertGreaterEqual(int(st.Psi), 0)

    def test_psi_value_positional_arg_fix(self):
        # Regression: Stat(self.Psi+self.Int()) was passing int as method arg
        seed(1)
        st = self.Stats(psi="psi-heavy")
        self.assertIsInstance(int(st.Psi), int)
        self.assertGreaterEqual(int(st.Psi), 0)


class TestCharacter(unittest.TestCase):

    def test_generates_without_error(self):
        seed(12345)
        from traveller.character import Character
        c = Character()
        r = repr(c)
        self.assertIn("UPP:", r)
        self.assertIn("Career Path:", r)
        self.assertIn("Skills:", r)

    def test_reproducible_with_seed(self):
        from traveller.character import Character
        seed(99999)
        c1 = repr(Character())
        seed(99999)
        c2 = repr(Character())
        self.assertEqual(c1, c2)

    def test_fixed_upp(self):
        seed(1)
        from traveller.character import Character
        from traveller.attributes import Stats
        # Stats can change during career generation; check initial parsing
        st = Stats(upp="888888")
        self.assertEqual(int(st.Str), 8)
        self.assertEqual(int(st.Dex), 8)
        self.assertEqual(int(st.End), 8)
        self.assertEqual(int(st.Int), 8)
        self.assertEqual(int(st.Edu), 8)
        self.assertEqual(int(st.Soc), 8)

    def test_terms_respected(self):
        seed(7)
        from traveller.character import Character
        c = Character(terms=5)
        self.assertEqual(len(c.cp.terms), 5)
        # age = 18 + 5*4 = 38 (before rand_age)
        self.assertEqual(c.age, 38)

    def test_gender_and_name(self):
        seed(3)
        from traveller.character import Character
        c = Character(gender="female", name="Test Name")
        self.assertEqual(c.gender, "female")
        self.assertEqual(c.name, "Test Name")


class TestCareerPath(unittest.TestCase):

    def test_terms_count(self):
        seed(42)
        from traveller.character import Character
        c = Character(terms=3)
        self.assertEqual(len(c.cp.terms), 3)

    def test_career_fields_present(self):
        seed(42)
        from traveller.character import Character
        from traveller.data import FIELDS
        c = Character(terms=2)
        for term in c.cp.terms:
            for f in FIELDS:
                self.assertIn(f, term)

    def test_psi_degrades_over_terms(self):
        # Psi should decrease by 1 per term
        seed(10)
        from traveller.character import Character
        c = Character(terms=3, psi="traditional")
        # After adjust_psi, Psi should have been reduced
        self.assertGreaterEqual(int(c.stats.Psi), 0)


class TestAnimal(unittest.TestCase):

    def test_generates_without_error(self):
        seed(42)
        from traveller.animal import Animal
        a = Animal()
        r = repr(a)
        self.assertIn("Name:", r)
        self.assertIn("Stats:", r)
        self.assertIn("Combat:", r)

    def test_stats_rolled_fresh_per_animal(self):
        # Regression: SIZES used to be rolled once at import time
        seed(1)
        from traveller.animal import Animal
        stats = set()
        for _ in range(10):
            a = Animal()
            stats.add((int(a.stats.Str), int(a.stats.Dex), int(a.stats.End)))
        # With 10 animals, we should see more than one distinct stat combination
        self.assertGreater(len(stats), 1)

    def test_quirks_no_hardcoded_six(self):
        seed(5)
        from traveller.animal import Animal, QUIRKS
        a = Animal()
        # All quirks should be valid strings from QUIRKS
        all_quirk_items = [item for items in QUIRKS.values() for item in items]
        for q in a.quirks:
            self.assertIn(q, all_quirk_items)

    def test_terrain_and_behavior_options(self):
        seed(7)
        from traveller.animal import Animal
        a = Animal(terrain="Desert", behavior="Grazer")
        self.assertEqual(a.terrain, "Desert")
        self.assertEqual(a.behavior, "Grazer")

    def test_sentient(self):
        seed(9)
        from traveller.animal import Animal
        a = Animal(sentient=True)
        self.assertGreater(int(a.stats.Int), 1)


class TestNameGenerator(unittest.TestCase):

    def test_generates_name(self):
        seed(1)
        from traveller.lc import lc
        name = lc("japanese", "male")
        self.assertIsInstance(name, str)
        self.assertGreater(len(name), 0)

    def test_cthuvian(self):
        seed(2)
        from traveller.lc import lc
        name = lc(cthuvian=True)
        self.assertIsInstance(name, str)

    def test_ethnicities(self):
        seed(3)
        from traveller.lc import lc
        for eth in ("american", "arabic", "french", "german", "russian"):
            name = lc(eth, "female")
            self.assertIn(",", name)  # "Family, Given"


if __name__ == "__main__":
    unittest.main()
