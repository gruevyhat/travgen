# Proposal: Convert Travgen to a Stand-Alone GitHub Pages HTML App

## Goal

Convert Travgen from a Python command-line package into a stand-alone browser app that can run from GitHub Pages with no server runtime, database, or external API. The HTML version should preserve the current generated information while presenting it in a cleaner, prettier, more thematic web layout.

## Current State

The existing project is a Python 3.11+ CLI. Core behavior is split across `traveller/character.py`, `traveller/career_path.py`, `traveller/animal.py`, `traveller/attributes.py`, `traveller/dice.py`, and large rule/name tables in `traveller/data.py` and `traveller/names.py`. The `travgen` script exposes four main commands: `char`, `animal`, `UPP`, and `roll`. Tests are written with `unittest` in `tests/test_traveller.py`.

## Proposed Target

Create a React app with Vite. Source files live under `app/`, and production build output is committed under `docs/` so GitHub Pages can publish it directly:

- `app/`: React source, CSS Modules, generator modules, data files, and tests.
- `app/package.json`: npm scripts and dependencies.
- `app/vite.config.js`: Vite configuration with `../docs` as the build output.
- `docs/`: generated GitHub Pages artifact. Treat this directory as generated; edit `app/` and rebuild.

The built app should work from the repository’s GitHub Pages URL. Local development should use the Vite dev server.

## User Interface

Use a Traveller-inspired dossier interface with structured visual sections plus copyable plain text output. Initial navigation should focus on the character workflow, with later room for additional tools.

- UPP: method and psi mode.
- Character: form controls for name, gender, ethnicity, homeworld, UPP, method, psi mode, terms, career path, random age, personality, max careers, seed, history output, expansion toggles, and advanced controls.
- Export/share: copyable output and share-oriented controls.
- Later: Animal and Dice Roller tools.

Remaining CLI tools should eventually expose:

- Animal: terrain, behavior, order, sentient flag, and seed.
- UPP: method and psi mode.
- Dice Roller: dice expression input such as `2d6`.

Generated output should always include the hex seed used. One seed controls the full generated result.

## Migration Approach

Use a hybrid porting approach: directly port core rules and data-heavy logic, but use idiomatic React for UI and presentation. Use npm, React, Vite, CSS Modules, and Vitest.

Approved feature order:

1. Vite/React skeleton.
2. UPP generator.
3. Character generator.
4. Expansion toggles and advanced character controls.
5. Export/share features.
6. First public GitHub Pages version.
7. Animal and Dice Roller after the first public version.

Convert static data with script assistance plus manual review. Use mixed JS and JSON: JSON for plain tables, JS modules for data that needs helpers or non-JSON structures. Include expansion data immediately.

Avoid changing game rules during the port. Any behavior difference should be intentional, documented, and covered by tests.

## Testing Strategy

Use Vitest for generator and component tests. Add Playwright after the first working UI stabilizes. The current Python tests should inspire a smaller JavaScript suite focused on major flows, with character and career generation receiving the most test attention first.

Early regression coverage should include:

- Seeded reproducibility within the HTML app.
- UPP generation.
- Character and career generation.
- Expansion toggles and advanced character controls.
- Key data conversion expectations.

Because browser JavaScript does not expose Python’s `random` implementation, exact Python/JavaScript seeded parity is not required. The app should use a simple deterministic local PRNG and guarantee reproducibility within the HTML app.

## GitHub Pages Deployment

Use GitHub Pages from committed Vite build output in `docs/`. The README should present the HTML app first, the Python CLI second, and link to GitHub Pages documentation instead of duplicating detailed deployment steps.

## Risks and Open Questions

- Data conversion is the largest source of accidental rule changes.
- Career-path generation depends on many nested tables and should be ported with focused tests.
- Python and JavaScript random behavior will differ by design; JavaScript reproducibility is the compatibility target.
- The web version should preserve the same information, but not exact CLI text formatting.

## Deliverables

1. React/Vite source app in `app/`.
2. Generated GitHub Pages build in `docs/`.
3. JavaScript generator modules matching current behavior.
4. Vitest regression tests, with Playwright added after the first working UI.
5. Updated `README.md` with HTML app usage first and Python CLI usage second.
6. Python CLI retained during migration; decide its long-term status after HTML feature parity.

## Implementation Cadence

Use one milestone per pull request or commit. Before moving from one milestone to the next, require passing tests, a successful build, and a manual browser check. The first implementation milestone is the Vite/React skeleton only.
