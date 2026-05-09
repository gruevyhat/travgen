# Repository Guidelines

## Project Structure & Module Organization

This is a small Python command-line package for generating Traveller RPG characters, animals, UPPs, and dice rolls. Core package code lives in `traveller/`: `character.py`, `career_path.py`, `animal.py`, `attributes.py`, and `dice.py` hold the main behavior, while `data.py` and `names.py` contain large game tables and naming data. The executable CLI script is `travgen`. Tests live in `tests/`, currently centered on `tests/test_traveller.py`. Packaging metadata is in `setup.py`, `setup.cfg`, and `MANIFEST.in`.

## Build, Test, and Development Commands

- `python -m unittest discover -s tests -v`: run the full test suite.
- `./travgen char --random-seed 1234`: run the character generator locally from the checkout.
- `./travgen animal --terrain Desert --behavior Grazer`: exercise animal generation.
- `python setup.py install`: install the package and `travgen` script into the active Python environment.

Use Python 3.11+ as documented in `README.md`. The runtime dependency is `docopt>=0.6.1`; install it in your environment before running the CLI.

## Coding Style & Naming Conventions

Follow the existing Python style: 4-space indentation, standard-library imports before package imports, and concise object-oriented modules. Class names use `CamelCase` (`Character`, `CareerPath`, `SkillSet`); functions, methods, variables, and test methods use `snake_case`. Keep game-table constants uppercase (`CAREERS`, `SKILLS`, `WORLDS`) and prefer explicit imports over wildcard imports. Preserve deterministic behavior in tests by seeding `random` when asserting generated output.

## Testing Guidelines

Tests use `unittest`. Add new regression tests to `tests/test_traveller.py` or split into another `tests/test_*.py` file if a feature grows. Name test methods for the behavior being checked, such as `test_reproducible_with_seed` or `test_stats_rolled_fresh_per_animal`. Run `python -m unittest discover -s tests -v` before submitting changes, especially after editing generation rules or data tables.

## Commit & Pull Request Guidelines

Recent commits use short, imperative or descriptive subject lines, for example `Fix random.sample on set (broken in Python 3.11+)` and `Update README: bump version to 0.1.0...`. Keep commit subjects specific and mention the affected behavior. Pull requests should include a brief summary, test results, and examples of CLI output when user-visible generation changes. Link related issues when available and call out compatibility changes, dependency changes, or altered random-generation behavior.

## Agent-Specific Instructions

Keep edits narrow and avoid reformatting large data tables unless the task requires it. Do not change generated game probabilities without adding or updating tests that describe the intended rule behavior.
