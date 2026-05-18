# Repository Guidelines

## Project Structure & Module Organization

Travgen is now primarily a React/Vite browser app for Traveller RPG generators, with the original Python CLI retained as deprecated legacy code. The web app lives in `app/`: UI code is in `app/src/App.jsx` and `app/src/App.module.css`, generator logic is in `app/src/generators/`, structured rules and name data are in `app/src/data/`, and Vitest tests sit beside the modules as `*.test.js`/`*.test.jsx`. `app/scripts/` contains Python data extraction/export helpers used to maintain JSON data.

The production Vite build writes static GitHub Pages assets to `docs/`; treat files under `docs/` as generated output from `npm run build`. Legacy Python package code remains in `traveller/`, with the executable script `travgen`, tests in `tests/`, and packaging metadata in `setup.py`, `setup.cfg`, and `MANIFEST.in`. `HTML_CONVERSION_PROPOSAL.md` documents the web conversion background.

## Build, Test, and Development Commands

- `cd app && npm install`: install web app dependencies.
- `cd app && npm run dev`: start the Vite development server.
- `cd app && npm test`: run the Vitest suite once.
- `cd app && npm run build`: build the web app into `docs/` for GitHub Pages.
- `cd app && npm run preview`: preview the production build locally.
- `cd app && npm run export-data`: export legacy Python data into web JSON data.
- `python -m unittest discover -s tests -v`: run the legacy Python test suite.
- `./travgen char --random-seed 1234`: smoke-test the deprecated Python character generator.
- `./travgen animal --terrain Desert --behavior Grazer`: smoke-test the deprecated Python animal generator.

Use Python 3.11+ for legacy code and data scripts. The deprecated Python CLI depends on `docopt>=0.6.1`.

## Coding Style & Naming Conventions

For JavaScript, follow the existing ES module style: two-space indentation, single quotes, semicolons, named exports for generator utilities, and `camelCase` functions/variables. React components use `PascalCase`; keep component-local helpers near `App.jsx` unless reusable generator logic belongs in `app/src/generators/`. Prefer deterministic generator APIs that accept explicit seeds and route randomness through `createRng()` from `app/src/generators/random.js`.

For Python, keep the existing style: 4-space indentation, standard-library imports before package imports, concise object-oriented modules, `CamelCase` classes, and `snake_case` functions/methods/tests. Keep large game-table constants uppercase and avoid reformatting data tables unless the task requires it.

## Testing Guidelines

Add web regression tests next to the affected module using Vitest (`describe`, `it`, `expect`) and run `cd app && npm test` before submitting web changes. Test deterministic generation with fixed hex or string seeds, and cover rule/data changes with assertions that describe the intended Traveller behavior.

Add legacy Python tests to `tests/test_traveller.py` or a new `tests/test_*.py` file and run `python -m unittest discover -s tests -v` after touching `traveller/` or `travgen`. When changing user-visible generation output, include smoke examples from the relevant CLI or browser generator where useful.

## Data, Rules, and Generated Output

Do not change generated game probabilities, career tables, equipment rules, or name data without adding/updating tests that pin the intended behavior. Keep `app/src/data/coreRules.json`, `app/src/data/gameData.json`, and `app/src/data/nameData.json` structured as data, not raw source text. If data is regenerated with scripts, review both the source JSON and downstream behavior before committing.

`docs/` should only be updated by `cd app && npm run build`; do not hand-edit bundled asset files. Be cautious with `books/` and local extraction scripts, as they may contain source material or local-only inputs that should not be copied into committed app data.

## Commit & Pull Request Guidelines

Recent commits use short, specific subjects such as `Add spaceship/world/adventure generators, restructure nav and UI` and `Fix horizontal overflow on mobile`. Keep commit subjects imperative or descriptive and mention the affected behavior. Pull requests should include a brief summary, test results (`npm test`, `unittest`, and/or build), and examples/screenshots when UI or generation output changes. Call out compatibility changes, dependency updates, generated `docs/` changes, and altered random-generation behavior.

## Agent-Specific Instructions

Keep edits narrow and preserve the established split between the web app and legacy Python CLI. Do not reformat large data tables or generated bundles. Before changing rules logic, identify whether the behavior is implemented in the web generator, legacy Python generator, or both, and update tests for the affected surface.
