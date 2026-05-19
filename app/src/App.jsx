import { useEffect, useMemo, useState } from 'react';
import styles from './App.module.css';
import { titleCase } from './generators/helpers.js';
import { modifier, PSI_OPTIONS, STAT_METHODS } from './generators/stats.js';
import {
  CAREER_EXPANSIONS,
  CAMPAIGN_MODES,
  CORE_SKILLS,
  ETHNICITIES,
  GENDERS,
  WORLDS,
  careerCatalog,
  generateCharacter,
  rankTitle,
} from './generators/character.js';
import coreRulesData from './data/coreRules.json';
import { generateWorld } from './generators/world.js';
import { generateStandaloneSpaceship, STANDALONE_SHIP_TYPES } from './generators/spacecraft.js';
import { generateAdventure } from './generators/adventure.js';
import { CharacterBuilder } from './CharacterBuilder.jsx';

const GENERATORS = ['Character', 'Build', 'Spaceship', 'World', 'Adventure'];

function toolFromUrl() {
  const param = new URLSearchParams(window.location.search).get('tool') ?? '';
  const match = GENERATORS.find((g) => g.toLowerCase() === param.toLowerCase());
  return match ?? 'Character';
}

function toolHref(gen) {
  return `?tool=${gen.toLowerCase()}`;
}

const SKILL_DEFAULT_STAT = {
  Admin: 'Edu', Advocate: 'Edu', Animals: 'Int', Art: 'Dex',
  Astrogation: 'Int', Athletics: 'Str', 'Battle Dress': 'Str',
  Broker: 'Soc', Carouse: 'Soc', Comms: 'Edu', Computers: 'Int',
  Deception: 'Int', Diplomat: 'Soc', Drive: 'Dex', Engineer: 'Edu',
  Explosives: 'Edu', Flyer: 'Dex', Gambler: 'Int', 'Gun Combat': 'Dex',
  Gunner: 'Dex', 'Heavy Weapons': 'Dex', Investigate: 'Int',
  'Jack of all Trades': 'Int', Language: 'Edu', Leadership: 'Soc',
  'Life Science': 'Edu', Mechanic: 'Edu', Medic: 'Edu', Melee: 'Str',
  Navigation: 'Int', Persuade: 'Soc', 'Physical Science': 'Edu',
  Pilot: 'Dex', Profession: 'Edu', Recon: 'Int', 'Remote Operations': 'Dex',
  Seafarer: 'Dex', Sensors: 'Int', 'Social Science': 'Edu',
  'Space Science': 'Edu', Stealth: 'Dex', Steward: 'Soc', Streetwise: 'Soc',
  Survival: 'End', Tactics: 'Int', Trade: 'Edu', 'Vacc Suit': 'Dex',
  'Zero-G': 'Dex',
};

const CORE_STATS = ['Str', 'Dex', 'End', 'Int', 'Edu', 'Soc'];

function roll6() { return Math.floor(Math.random() * 6) + 1; }

function rollDamage(expr) {
  const match = String(expr).match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return { rolls: [], mod: 0, total: 0 };
  const count = Number(match[1]);
  const sides = Number(match[2]);
  const mod = Number(match[3] ?? 0);
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  return { rolls, mod, total: Math.max(0, rolls.reduce((a, b) => a + b, 0) + mod) };
}

function isEditableTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

function App() {
  const [active, setActive] = useState(toolFromUrl);
  const [buildKey, setBuildKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [characterForm, setCharacterForm] = useState({
    seed: '', method: 'normal', psi: '', terms: 3, name: '', gender: '',
    ethnicity: '', homeworld: '', campaignMode: 'standard', upp: '', careerPlan: [], randAge: false,
    personality: true, showHistory: false,
    expansions: { psion: false, chthonianStars: false, dilettante: false, agent: false, scoundrel: false, mercenary: false, highGuard: false, scoutBook: false, merchantPrince: false },
  });
  const [character, setCharacter] = useState(() => generateCharacter(characterForm));
  const [spaceshipForm, setSpaceshipForm] = useState({ type: '', seed: '' });
  const [spaceship, setSpaceship] = useState(() => generateStandaloneSpaceship({}));
  const [worldForm, setWorldForm] = useState({ name: '', seed: '' });
  const [world, setWorld] = useState(() => generateWorld({}));
  const [adventureForm, setAdventureForm] = useState({ seed: '' });
  const [adventure, setAdventure] = useState(() => generateAdventure({}));
  const [message, setMessage] = useState('');

  const markdownText = useMemo(() => {
    if (active === 'Build') return '';
    if (active === 'Spaceship') return formatSpaceshipMarkdown(spaceship);
    if (active === 'World') return formatWorldMarkdown(world);
    if (active === 'Adventure') return formatAdventureMarkdown(adventure);
    return formatCharacterMarkdown(character, characterForm.showHistory);
  }, [active, character, characterForm.showHistory, spaceship, world, adventure]);

  async function copyShareLink() {
    let seed;
    if (active === 'Spaceship') seed = spaceship.seed;
    else if (active === 'World') seed = world.seed;
    else if (active === 'Adventure') seed = adventure.seed;
    else seed = character.seed;
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({ tool: active.toLowerCase(), seed }).toString();
    try {
      await navigator.clipboard.writeText(url.toString());
      setMessage('Share link copied.');
    } catch {
      setMessage('Share link copy failed.');
    }
  }

  function downloadMarkdown() {
    let seed;
    if (active === 'Spaceship') seed = spaceship.seed;
    else if (active === 'World') seed = world.seed;
    else if (active === 'Adventure') seed = adventure.seed;
    else seed = character.seed;
    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${active.toLowerCase()}-${seed}.md`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage('Markdown downloaded.');
  }

  function closeMenu() { setMenuOpen(false); }

  function navigate(gen) {
    setActive(gen);
    if (gen === 'Build') setBuildKey((k) => k + 1);
    history.pushState(null, '', toolHref(gen));
    closeMenu();
  }

  useEffect(() => {
    function onPopState() { setActive(toolFromUrl()); }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function reroll() {
    if (active === 'Character') {
      setCharacter(generateCharacter({
        ...characterForm,
        seed: '',
        careerPlan: normalizeCareerPlan(characterForm.careerPlan, characterForm.terms),
      }));
    } else if (active === 'Spaceship') {
      setSpaceship(generateStandaloneSpaceship({ ...spaceshipForm, seed: '' }));
    } else if (active === 'World') {
      setWorld(generateWorld({ ...worldForm, seed: '' }));
    } else if (active === 'Adventure') {
      setAdventure(generateAdventure({ seed: '' }));
    }
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key.toLowerCase() !== 'r') return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      reroll();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, characterForm, spaceshipForm, worldForm, adventureForm]);

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <button
          className={styles.menuButton}
          type="button"
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span /><span /><span />
        </button>
        <div>
          <p className={styles.eyebrow}>Travgen frontier office</p>
          <h1>{active === 'Character' ? 'Character Generator' : active === 'Build' ? 'Character Build' : `${active} Generator`}</h1>
        </div>
        <div className={styles.topbarActions}>
          <button className={styles.iconAction} type="button" onClick={reroll} aria-label="Reroll" aria-keyshortcuts="R" title="Reroll (R)">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10"/>
              <polyline points="23 20 23 14 17 14"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
          </button>
          <button className={styles.iconAction} type="button" onClick={downloadMarkdown} aria-label="Download as Markdown" title="Download as Markdown">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button className={styles.iconAction} type="button" onClick={copyShareLink} aria-label="Copy share link" title="Copy share link">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className={styles.backdrop} onClick={closeMenu} aria-hidden="true" />
          <aside className={styles.sidebar} aria-label="Generator navigation">
            <div className={styles.sidebarHeader}>
              <p className={styles.sidebarTitle}>Travgen</p>
              <button type="button" className={styles.sidebarClose} onClick={closeMenu} aria-label="Close">✕</button>
            </div>
            <nav className={styles.generatorNav}>
              {GENERATORS.map((gen) => (
                <a
                  key={gen}
                  href={toolHref(gen)}
                  className={active === gen ? styles.generatorNavItemActive : styles.generatorNavItem}
                  onClick={(e) => { e.preventDefault(); navigate(gen); }}
                >
                  <span className={styles.generatorNavLabel}>{gen}</span>
                  <span className={styles.generatorNavSub}>{generatorSubtitle(gen)}</span>
                </a>
              ))}
            </nav>
          </aside>
        </>
      )}

      <div className={styles.outputArea}>
        {active === 'Build' && (
          <CharacterBuilder
            key={buildKey}
            onViewCharacter={(char) => {
              setCharacter(char);
              setActive('Character');
            }}
          />
        )}
        {active === 'Character' && (
          <>
            <CharacterControlBar
              form={characterForm}
              setForm={setCharacterForm}
              onGenerate={(form) => {
                setCharacter(generateCharacter({
                  ...form,
                  careerPlan: normalizeCareerPlan(form.careerPlan, form.terms),
                }));
                setMessage('');
              }}
              onUpload={(seed) => {
                const newForm = { ...characterForm, seed };
                setCharacterForm(newForm);
                setCharacter(generateCharacter({
                  ...newForm,
                  careerPlan: normalizeCareerPlan(newForm.careerPlan, newForm.terms),
                }));
              }}
              onMessage={setMessage}
            />
            <CharacterOutput character={character} showHistory={characterForm.showHistory} />
          </>
        )}
        {active === 'Spaceship' && (
          <>
            <SpaceshipControlBar
              form={spaceshipForm}
              setForm={setSpaceshipForm}
              onGenerate={(form) => setSpaceship(generateStandaloneSpaceship(form))}
            />
            <SpaceshipOutput spaceship={spaceship} />
          </>
        )}
        {active === 'World' && (
          <>
            <WorldControlBar
              form={worldForm}
              setForm={setWorldForm}
              onGenerate={(form) => setWorld(generateWorld(form))}
            />
            <WorldOutput world={world} />
          </>
        )}
        {active === 'Adventure' && (
          <>
            <AdventureControlBar
              form={adventureForm}
              setForm={setAdventureForm}
              onGenerate={(form) => setAdventure(generateAdventure(form))}
            />
            <AdventureOutput adventure={adventure} />
          </>
        )}
      </div>

      {(active === 'Character' || message) && (
        <section className={styles.actionBar} aria-label="Record actions">
          {active === 'Character' ? (
            <label className={styles.transcriptToggle}>
              <input
                type="checkbox"
                checked={characterForm.showHistory}
                onChange={(event) => setCharacterForm({ ...characterForm, showHistory: event.target.checked })}
              />
              <span>
                <strong>Build transcript</strong>
                <small>Show term-by-term rolls, table results, and applied effects.</small>
              </span>
            </label>
          ) : null}
          {message ? <p className={styles.message}>{message}</p> : null}
        </section>
      )}
    </main>
  );
}

function generatorSubtitle(gen) {
  if (gen === 'Character') return 'UPP, skills, career history';
  if (gen === 'Build') return 'Step-by-step interactive';
  if (gen === 'Spaceship') return 'Hull, drives, armament';
  if (gen === 'World') return 'UWP, trade codes, environment';
  if (gen === 'Adventure') return 'Patron, mission, twist';
  return '';
}

function CharacterControlBar({ form, setForm, onGenerate, onUpload, onMessage }) {
  return (
    <details className={styles.controlBar}>
      <summary className={styles.controlBarSummary}>
        <span>Build options</span>
        <small>Stats · career · identity</small>
      </summary>
      <form
        className={styles.controlBarForm}
        onSubmit={(e) => {
          e.preventDefault();
          onGenerate(form);
        }}
      >
        <div className={styles.controlBarBody}>
          <CharacterForm form={form} setForm={setForm} />
        </div>
        <div className={styles.controlBarFooter}>
          <button className={styles.primaryAction} type="submit">Generate New Character</button>
          <label className={styles.uploadMdLabel}>
            <span>Upload .md</span>
            <input
              type="file"
              accept=".md,text/markdown"
              className={styles.uploadMdInput}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const text = ev.target.result;
                  const match = text.match(/^[-\s]*Seed:\s*([a-fA-F0-9]+)/m);
                  if (match) {
                    onUpload(match[1]);
                  } else {
                    onMessage('No seed found in uploaded file.');
                  }
                  e.target.value = '';
                };
                reader.readAsText(file);
              }}
            />
          </label>
        </div>
      </form>
    </details>
  );
}

function SpaceshipControlBar({ form, setForm, onGenerate }) {
  const set = (patch) => setForm({ ...form, ...patch });
  return (
    <details className={styles.controlBar}>
      <summary className={styles.controlBarSummary}>
        <span>Ship options</span>
        <small>Type · configuration</small>
      </summary>
      <form className={styles.controlBarForm} onSubmit={(e) => { e.preventDefault(); onGenerate(form); }}>
        <div className={styles.controlBarBody}>
          <div className={styles.controlGrid}>
            <Select
              label="Ship type"
              value={form.type}
              onChange={(type) => set({ type })}
              options={[['', 'Random'], ...STANDALONE_SHIP_TYPES.map((t) => [t, t])]}
            />
            <Input label="Hex seed" value={form.seed} placeholder="Auto-generate" onChange={(seed) => set({ seed })} />
          </div>
        </div>
        <div className={styles.controlBarFooter}>
          <button className={styles.primaryAction} type="submit">Generate New Ship</button>
        </div>
      </form>
    </details>
  );
}

function WorldControlBar({ form, setForm, onGenerate }) {
  const set = (patch) => setForm({ ...form, ...patch });
  return (
    <details className={styles.controlBar}>
      <summary className={styles.controlBarSummary}>
        <span>World options</span>
        <small>Name · seed</small>
      </summary>
      <form className={styles.controlBarForm} onSubmit={(e) => { e.preventDefault(); onGenerate(form); }}>
        <div className={styles.controlBarBody}>
          <div className={styles.controlGrid}>
            <Input label="World name" value={form.name} placeholder="Auto-generate" onChange={(name) => set({ name })} />
            <Input label="Hex seed" value={form.seed} placeholder="Auto-generate" onChange={(seed) => set({ seed })} />
          </div>
        </div>
        <div className={styles.controlBarFooter}>
          <button className={styles.primaryAction} type="submit">Generate New World</button>
        </div>
      </form>
    </details>
  );
}

function AdventureControlBar({ form, setForm, onGenerate }) {
  return (
    <details className={styles.controlBar}>
      <summary className={styles.controlBarSummary}>
        <span>Adventure options</span>
        <small>Seed</small>
      </summary>
      <form className={styles.controlBarForm} onSubmit={(e) => { e.preventDefault(); onGenerate(form); }}>
        <div className={styles.controlBarBody}>
          <div className={styles.controlGrid}>
            <Input label="Hex seed" value={form.seed} placeholder="Auto-generate" onChange={(seed) => setForm({ ...form, seed })} />
          </div>
        </div>
        <div className={styles.controlBarFooter}>
          <button className={styles.primaryAction} type="submit">Generate New Adventure</button>
        </div>
      </form>
    </details>
  );
}

function CharacterForm({ form, setForm }) {
  const set = (patch) => setForm({ ...form, ...patch });
  const catalog = careerCatalog(form.expansions);
  const plan = normalizeCareerPlan(form.careerPlan, form.terms);
  const setPlanTerm = (index, patch) => {
    const next = normalizeCareerPlan(form.careerPlan, form.terms);
    next[index] = { ...next[index], ...patch };
    if (patch.career !== undefined) {
      next[index].spec = '';
    }
    set({ careerPlan: next });
  };

  return (
    <>
      <section className={styles.controlSection}>
        <div className={styles.controlSectionHeader}>
          <p className={styles.kicker}>Identity</p>
          <span>Optional overrides</span>
        </div>
        <div className={styles.controlGrid}>
          <Input label="Name" value={form.name} placeholder="Auto-generate" onChange={(name) => set({ name })} />
          <Select label="Gender" value={form.gender} onChange={(gender) => set({ gender })} options={[['', 'Random'], ...GENDERS.map((v) => [v, v])]} />
          {form.expansions.chthonianStars ? (
            <Select label="Ethnicity" value={form.ethnicity} onChange={(ethnicity) => set({ ethnicity })} options={[['', 'Random'], ...ETHNICITIES.map((v) => [v, v])]} />
          ) : null}
          <Select label="Campaign" value={form.campaignMode} onChange={(campaignMode) => set({ campaignMode, homeworld: '' })} options={CAMPAIGN_MODES.map((o) => [o.value, o.label])} />
          {form.campaignMode === 'chthonian'
            ? <Select label="Homeworld" value={form.homeworld} onChange={(homeworld) => set({ homeworld })} options={[['', 'Random'], ...WORLDS.map((v) => [v, v])]} />
            : <Input label="Homeworld" value={form.homeworld} placeholder="Auto-generate" onChange={(homeworld) => set({ homeworld })} />}
        </div>
      </section>

      <section className={styles.controlSection}>
        <div className={styles.controlSectionHeader}>
          <p className={styles.kicker}>Generation</p>
          <span>Rules and output</span>
        </div>
        <div className={styles.controlGrid}>
          <Select label="Stats" value={form.method} onChange={(method) => set({ method })} options={STAT_METHODS.map((o) => [o.value, o.label])} />
          <Select label="Psi" value={form.psi} onChange={(psi) => set({ psi })} options={PSI_OPTIONS.map((o) => [o.value, o.label])} />
          <Input label="Fixed UPP" value={form.upp} placeholder="Optional, e.g. 777777" onChange={(upp) => set({ upp })} />
          <Input label="Terms" type="number" value={form.terms} onChange={(terms) => set({ terms })} />
          <Input label="Hex seed" value={form.seed} placeholder="Auto-generate" onChange={(seed) => set({ seed })} />
        </div>
        <div className={styles.optionGrid}>
          <Checkbox label="Random age" checked={form.randAge} onChange={(randAge) => set({ randAge })} />
        </div>
      </section>

      <details className={styles.controlDetails}>
        <summary>
          <span>Career plan</span>
          <small>{plan.some((term) => term.career) ? 'Custom path' : 'Automatic path'}</small>
        </summary>
        <div className={styles.careerPlanner}>
          {plan.map((term, index) => {
            const specs = term.career ? catalog[term.career] ?? [] : [];
            return (
              <div className={styles.careerPlanRow} key={`term-${index}`}>
                <span>Term {index + 1}</span>
                <select
                  value={term.career}
                  onChange={(event) => setPlanTerm(index, { career: event.target.value })}
                >
                  <option value="">Auto</option>
                  {Object.keys(catalog).map((career) => (
                    <option key={career} value={career}>{career}</option>
                  ))}
                </select>
                <select
                  value={term.spec}
                  disabled={!term.career}
                  onChange={(event) => setPlanTerm(index, { spec: event.target.value })}
                >
                  <option value="">Any specialty</option>
                  {specs.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </details>

      <section className={styles.controlSection}>
        <div className={styles.controlSectionHeader}>
          <p className={styles.kicker}>Career books</p>
          <span>Optional tables</span>
        </div>
        <div className={styles.expansionGrid}>
          {CAREER_EXPANSIONS.map((expansion) => (
            <Checkbox
              key={expansion.key}
              label={expansion.label}
              checked={Boolean(form.expansions[expansion.key])}
              onChange={(checked) => set({ expansions: { ...form.expansions, [expansion.key]: checked } })}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function SpaceshipOutput({ spaceship }) {
  return (
    <div className={styles.generatorSheet}>
      <div className={styles.sheetHeaderBlock}>
        <div className={styles.sheetHeaderLeft}>
          <p className={styles.kicker}>Spacecraft record</p>
          <h2>{spaceship.name} <span className={styles.shipTypeInline}>({spaceship.type})</span></h2>
          <p className={styles.headerSubtitle}>{spaceship.ownershipType} · {spaceship.condition}</p>
        </div>
        <div className={styles.sheetHeaderRight}>
          <Metric label="Value" value={`${spaceship.costMCr} MCr`} />
          <Metric label="Seed" value={spaceship.seed} mono />
        </div>
      </div>
      <div className={styles.sheetBody}>
        <div className={styles.sheetPanel}>
          <div className={styles.sectionHeader}>
            <p className={styles.kicker}>Specifications</p>
            <h3>Hull &amp; Drives</h3>
          </div>
          <dl className={styles.worldFactList}>
            <div><dt>Hull</dt><dd>{spaceship.hull}T</dd></div>
            <div><dt>Jump</dt><dd>{spaceship.jumpRating ? `J${spaceship.jumpRating}` : 'N/A'}</dd></div>
            <div><dt>Maneuver</dt><dd>{spaceship.maneuverRating}G</dd></div>
            <div><dt>Power Plant</dt><dd>Code {spaceship.powerPlant}</dd></div>
            <div><dt>Fuel</dt><dd>{spaceship.fuelCapacity}T</dd></div>
            <div><dt>Staterooms</dt><dd>{spaceship.staterooms}</dd></div>
            <div><dt>Cargo</dt><dd>{spaceship.cargo}T</dd></div>
            <div><dt>Hardpoints</dt><dd>{spaceship.hardpoints}</dd></div>
            <div><dt>Weapons</dt><dd>{spaceship.weapons}</dd></div>
          </dl>
          {spaceship.notes && <p className={styles.compactLine}>{spaceship.notes}</p>}
        </div>
      </div>
    </div>
  );
}

function WorldOutput({ world }) {
  return (
    <div className={styles.generatorSheet}>
      <div className={styles.sheetHeaderBlock}>
        <div className={styles.sheetHeaderLeft}>
          <p className={styles.kicker}>World profile</p>
          <h2>{world.name} <span className={styles.uppInline}>[{world.upp}]</span></h2>
          <p className={styles.headerSubtitle}>{world.sizeDesc} · {world.starport}</p>
        </div>
        <div className={styles.sheetHeaderRight}>
          <Metric label="Population" value={world.populationDesc} />
          <Metric label="Seed" value={world.seed} mono />
        </div>
      </div>
      <div className={styles.sheetBody}>
        <div className={styles.sheetPanel}>
          <div className={styles.sectionHeader}>
            <p className={styles.kicker}>Profile</p>
            <h3>World Data</h3>
          </div>
          <dl className={styles.worldFactList}>
            <div><dt>Starport</dt><dd>{world.starport} — {world.starportDesc}</dd></div>
            <div><dt>Size</dt><dd>{world.sizeDesc} (size {world.size})</dd></div>
            <div><dt>Atmosphere</dt><dd>{world.atmosphereDesc}</dd></div>
            <div><dt>Hydrographics</dt><dd>{world.hydroDesc} ({world.hydrographics * 10}%)</dd></div>
            <div><dt>Population</dt><dd>{world.populationDesc}</dd></div>
            <div><dt>Government</dt><dd>{world.governmentDesc}</dd></div>
            <div><dt>Law Level</dt><dd>{world.lawDesc} ({world.law})</dd></div>
            <div><dt>Tech Level</dt><dd>TL{world.techLevel}</dd></div>
            <div><dt>Trade Codes</dt><dd>{world.tradeCodes.join(', ')}</dd></div>
            <div><dt>Background Skills</dt><dd>{world.backgroundSkills.join(', ')}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function AdventureOutput({ adventure }) {
  return (
    <div className={styles.generatorSheet}>
      <div className={styles.sheetHeaderBlock}>
        <div className={styles.sheetHeaderLeft}>
          <p className={styles.kicker}>Adventure seed</p>
          <h2>Mission Brief</h2>
          <p className={styles.headerSubtitle}>{adventure.hook}</p>
        </div>
        <div className={styles.sheetHeaderRight}>
          <Metric label="Seed" value={adventure.seed} mono />
        </div>
      </div>
      <div className={styles.sheetBody}>
        <div className={`${styles.sheetPanel} ${styles.adventureMainPanel}`}>
          <div className={styles.sectionHeader}>
            <p className={styles.kicker}>Situation</p>
            <h3>Mission Details</h3>
          </div>
          <dl className={styles.worldFactList}>
            <div><dt>Patron</dt><dd>{adventure.patron}</dd></div>
            <div><dt>Mission</dt><dd style={{ textTransform: 'capitalize' }}>{adventure.mission}</dd></div>
            <div><dt>Location</dt><dd style={{ textTransform: 'capitalize' }}>{adventure.location}</dd></div>
            <div><dt>Opposition</dt><dd>{adventure.antagonist}</dd></div>
            <div><dt>Reward</dt><dd style={{ textTransform: 'capitalize' }}>{adventure.reward}</dd></div>
          </dl>
        </div>
        <div className={styles.sheetPanel}>
          <div className={styles.sectionHeader}>
            <p className={styles.kicker}>Complications</p>
            <h3>Obstacles</h3>
          </div>
          <ul className={styles.cleanList} style={{ marginTop: '10px' }}>
            {adventure.complications.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
        <div className={styles.sheetPanel}>
          <div className={styles.sectionHeader}>
            <p className={styles.kicker}>Twist</p>
            <h3>Hidden Complication</h3>
          </div>
          <p className={styles.compactLine}>{adventure.twist}</p>
        </div>
      </div>
    </div>
  );
}

function CharacterOutput({ character, showHistory }) {
  const [roll, setRoll] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => { setHealth(null); }, [character]);

  const effectiveStats = health
    ? { ...character.stats, Str: health.Str, Dex: health.Dex, End: health.End }
    : character.stats;
  const allStats = { ...effectiveStats, ...(character.psionics ? { Psi: character.psionics.rating } : {}) };

  function makeRoll(patch) {
    const d1 = roll6(), d2 = roll6();
    setRoll({ ...patch, d1, d2, total: d1 + d2 + patch.skillMod + patch.statMod });
  }

  function handleSkillRoll(skillName, skillMod, note = null) {
    const baseSkill = skillName.replace(/\s*\(.*\)/, '').trim();
    const statName = SKILL_DEFAULT_STAT[baseSkill] ?? 'Int';
    const statMod = modifier(allStats[statName] ?? 7);
    makeRoll({ type: 'skill', name: skillName, skillMod, statName, statMod, note });
  }

  function handleStatRoll(statName, statMod) {
    makeRoll({ type: 'stat', name: statName, skillMod: 0, statName, statMod, note: null });
  }

  function handleStatChange(statName) {
    const statMod = modifier(allStats[statName] ?? 7);
    const d1 = roll6(), d2 = roll6();
    setRoll({ ...roll, statName, statMod, d1, d2, total: d1 + d2 + roll.skillMod + statMod });
  }

  function handleWeaponRoll(item) {
    const d1 = roll6(), d2 = roll6();
    setRoll({
      type: 'weapon',
      name: item.weapon,
      attackDm: item.attackDm,
      skill: item.skill,
      skillLevel: item.skillLevel,
      skillDm: item.skillDm,
      note: item.joatNote,
      characteristic: item.characteristic,
      characteristicDm: item.characteristicDm,
      damageExpr: item.damage,
      weaponItem: item,
      d1, d2,
      total: d1 + d2 + item.attackDm,
      damage: rollDamage(item.damage),
    });
  }

  function handleReroll() {
    if (roll.type === 'weapon') {
      handleWeaponRoll(roll.weaponItem);
    } else {
      const d1 = roll6(), d2 = roll6();
      setRoll({ ...roll, d1, d2, total: d1 + d2 + roll.skillMod + roll.statMod });
    }
  }

  function handleHealthChange(newHealth) {
    setHealth(newHealth);
  }

  return (
    <div className={styles.characterSheet}>
      <CharacterHeader character={character} onRoll={handleStatRoll} health={health} onHealthChange={handleHealthChange} />
      <div className={styles.sheetBody}>
        <SkillsSection skills={character.skills} onRoll={handleSkillRoll} />
        <CombatTable combat={character.combat} onRoll={handleWeaponRoll} />
        <div className={styles.infoRow}>
          <PsionicsSection psionics={character.psionics} />
        </div>
        <PlayAssets character={character} />
        <SpacecraftSection spacecraft={character.spacecraft} />
        <HomeworldSection homeworld={character.homeworld} />
        <CareerSummary history={character.careerHistory} />
      </div>
      {showHistory ? <CareerHistory character={character} /> : null}
      {roll && <RollPopup roll={roll} stats={allStats} onStatChange={handleStatChange} onReroll={handleReroll} onClose={() => setRoll(null)} />}
    </div>
  );
}

const PHYSICAL_STATS = ['Str', 'Dex', 'End'];

function healthStatus(health) {
  if (!health) return null;
  const zeros = PHYSICAL_STATS.filter((s) => health[s] === 0).length;
  if (zeros >= 3) return 'Dead';
  if (zeros >= 2) return 'Unconscious';
  if (PHYSICAL_STATS.some((s) => health[s] < (health[`_max${s}`] ?? health[s]))) return 'Wounded';
  return null;
}

function statHealthClass(name, health) {
  if (!health || !PHYSICAL_STATS.includes(name)) return '';
  if (health[name] === 0) return styles.statDamaged0;
  if (health[name] < (health[`_max${name}`] ?? health[name])) return styles.statDamagedAmber;
  return '';
}

function CharacterHeader({ character, onRoll, health, onHealthChange }) {
  const [damageInput, setDamageInput] = useState('');

  const roleText = [...character.careerPath].reverse().map((item, index) => {
    const title = item.title ? `${item.title} ` : '';
    const bracket = `[${item.career}/${item.spec}:${item.rank}]`;
    return index === 0 ? `${title}${bracket}` : `fmr. ${title}${bracket}`;
  }).join(', ');

  const statEntries = Object.entries(character.stats)
    .filter(([name]) => ['Str', 'Dex', 'End', 'Int', 'Edu', 'Soc', 'Ins', 'Pac'].includes(name));

  function toggleHealth() {
    if (health) {
      onHealthChange(null);
    } else {
      onHealthChange({
        Str: character.stats.Str,
        Dex: character.stats.Dex,
        End: character.stats.End,
        _maxStr: character.stats.Str,
        _maxDex: character.stats.Dex,
        _maxEnd: character.stats.End,
      });
    }
  }

  function applyDamage() {
    if (!health) return;
    const amount = Math.max(0, Number.parseInt(damageInput, 10) || 0);
    if (amount === 0) { setDamageInput(''); return; }
    let remaining = amount;
    let newEnd = health.End;
    let newStr = health.Str;
    let newDex = health.Dex;
    const endDmg = Math.min(newEnd, remaining);
    newEnd -= endDmg;
    remaining -= endDmg;
    if (remaining > 0) {
      const strDmg = Math.min(newStr, remaining);
      newStr -= strDmg;
      remaining -= strDmg;
    }
    if (remaining > 0) {
      const dexDmg = Math.min(newDex, remaining);
      newDex -= dexDmg;
    }
    onHealthChange({ ...health, Str: newStr, Dex: newDex, End: newEnd });
    setDamageInput('');
  }

  function adjustStat(statName, delta) {
    if (!health) return;
    const max = health[`_max${statName}`] ?? character.stats[statName];
    const next = Math.max(0, Math.min(max, health[statName] + delta));
    onHealthChange({ ...health, [statName]: next });
  }

  const status = healthStatus(health);

  return (
    <header className={styles.characterHeader}>
      <div className={styles.headerTop}>
        <div className={styles.characterTitleBlock}>
          <p className={styles.kicker}>Character record</p>
          <h2>{character.name} <span>[{character.upp}]</span></h2>
        </div>
        <div className={styles.headerMeta}>
          <Metric label="Cash" value={`${character.cash.toLocaleString()} Cr.`} />
          <Metric label="Seed" value={character.seed} mono />
        </div>
      </div>
      <p className={styles.headerSubtitle}>
        {titleCase(character.gender)} {titleCase(character.ethnicity)}, age {character.age}
        {roleText ? ` · ${roleText}` : ''}
      </p>
      <div className={styles.statStrip}>
        {statEntries.map(([name, value]) => {
          const currentValue = health && PHYSICAL_STATS.includes(name) ? health[name] : value;
          const currentMod = modifier(currentValue);
          const dmgClass = statHealthClass(name, health);
          return (
            <div
              key={name}
              className={`${styles.statBox} ${styles.rollable} ${dmgClass}`}
              role="button"
              tabIndex={0}
              onClick={() => onRoll(name, currentMod)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onRoll(name, currentMod)}
            >
              <span className={styles.statLabel}>{name}</span>
              <span className={styles.statValue}>{value.toString(16).toUpperCase()}</span>
              {health && PHYSICAL_STATS.includes(name) && (
                <span className={styles.statCurrentValue}>{currentValue}/{value}</span>
              )}
              <span className={styles.statMod}>{currentMod >= 0 ? `+${currentMod}` : currentMod}</span>
            </div>
          );
        })}
        {character.psionics && (
          <div className={`${styles.statBox} ${styles.rollable}`} role="button" tabIndex={0} onClick={() => onRoll('Psi', modifier(character.psionics.rating))} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onRoll('Psi', modifier(character.psionics.rating))}>
            <span className={styles.statLabel}>Psi</span>
            <span className={styles.statValue}>{character.psionics.rating.toString(16).toUpperCase()}</span>
            <span className={styles.statMod}>{modifier(character.psionics.rating) >= 0 ? `+${modifier(character.psionics.rating)}` : modifier(character.psionics.rating)}</span>
          </div>
        )}
        <div className={styles.statBoxToggle}>
          <button
            type="button"
            className={health ? styles.healthResetBtn : styles.healthTrackBtn}
            onClick={toggleHealth}
          >
            {health ? 'Reset' : 'Track Health'}
          </button>
        </div>
      </div>
      {health && (
        <div className={styles.healthControls}>
          <div className={styles.healthDamageRow}>
            <input
              type="number"
              className={styles.healthDamageInput}
              min="0"
              placeholder="Damage"
              value={damageInput}
              onChange={(e) => setDamageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyDamage()}
            />
            <button type="button" className={styles.healthApplyBtn} onClick={applyDamage}>Apply</button>
          </div>
          <div className={styles.healthAdjustRow}>
            {PHYSICAL_STATS.map((statName) => (
              <div key={statName} className={styles.healthAdjust}>
                <span>{statName}</span>
                <button type="button" className={styles.healthAdjBtn} onClick={() => adjustStat(statName, 1)}>+1</button>
                <button type="button" className={styles.healthAdjBtn} onClick={() => adjustStat(statName, -1)}>-1</button>
              </div>
            ))}
          </div>
          {status && (
            <div className={`${styles.healthStatus} ${status === 'Dead' ? styles.healthDead : status === 'Unconscious' ? styles.healthUnconscious : styles.healthWounded}`}>
              {status}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function Metric({ label, value, mono = false }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong className={mono ? styles.monoValue : ''}>{value}</strong>
    </div>
  );
}

function buildSkillEntries(skills) {
  const extraBases = Object.keys(skills)
    .map((name) => name.replace(/\s*\(.+\)$/, ''))
    .filter((base) => !CORE_SKILLS.includes(base))
    .sort((a, b) => a.localeCompare(b));
  const bases = [...CORE_SKILLS, ...new Set(extraBases)];
  return bases.map((base) => {
    const specs = Object.entries(skills)
      .filter(([name]) => name.startsWith(`${base} (`))
      .filter(([, level]) => level > 0)
      .sort(([a], [b]) => a.localeCompare(b));
    const baseLevel = base in skills ? skills[base] : specs.length > 0 ? 0 : null;
    return { base, level: baseLevel, absent: baseLevel === null, specs };
  });
}

function SkillsSection({ skills, onRoll }) {
  const entries = buildSkillEntries(skills);
  const joat = skills['Jack of all Trades'] ?? 0;
  const unskilledDm = Math.min(0, -3 + joat);
  const unskilledNote = joat > 0 ? `Jack of all Trades ${joat}` : 'unskilled';
  return (
    <section className={`${styles.sheetPanel} ${styles.skillsPanel}`} aria-label="Skills">
      <div className={styles.sectionHeader}>
        <p className={styles.kicker}>Skills</p>
        <h3>All Skills</h3>
      </div>
      <div className={styles.skillColumns}>
        {entries.map(({ base, level, absent, specs }) => (
          <div key={base} className={`${styles.skillEntry} ${absent ? styles.skillAbsent : ''}`}>
            <div
              className={`${styles.skillRow} ${styles.rollable}`}
              role="button"
              tabIndex={0}
              onClick={() => absent ? onRoll(base, unskilledDm, unskilledNote) : onRoll(base, level)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (absent ? onRoll(base, unskilledDm, unskilledNote) : onRoll(base, level))}
            >
              <span>{base}</span>
              <strong>{level !== null ? level : '—'}</strong>
            </div>
            {specs.map(([name, specLevel]) => (
              <div
                key={name}
                className={`${styles.skillSpec} ${styles.rollable}`}
                role="button"
                tabIndex={0}
                onClick={() => onRoll(name, specLevel)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onRoll(name, specLevel)}
              >
                <span>{name.replace(/^[^(]+\(/, '').replace(/\)$/, '')}</span>
                <strong>{specLevel}</strong>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}


function CareerSummary({ history }) {
  if (!history?.length) return null;
  const showEvents = history.some((row) => row.event || row.lifeEvents?.length);
  return (
    <section className={`${styles.sheetPanel} ${styles.careerSummaryPanel}`} aria-label="Career history">
      <div className={styles.sectionHeader}>
        <p className={styles.kicker}>Career history</p>
        <h3>Service Record</h3>
      </div>
      <div className={styles.historyTableWrap}>
        <table className={styles.historyTable}>
          <thead>
            <tr>
              <th>Term</th>
              <th>Career</th>
              <th>Branch</th>
              <th>Rank</th>
              <th>Title</th>
              {showEvents ? <th>Event/Mishap</th> : null}
            </tr>
          </thead>
          <tbody>
            {history.map((row) => {
              const parts = [];
              const lifeEvents = row.lifeEvents ?? [];
              const isLifeEventTrigger = lifeEvents.length > 0 && /^Life Event\.?\s*$/i.test(row.event?.trim() ?? '');
              if (row.event && !isLifeEventTrigger) parts.push(`${row.incidentType ?? (row.survived ? 'Event' : 'Mishap')}: ${row.event}`);
              for (const le of lifeEvents) parts.push(`Life Event: ${le.label}`);
              return (
                <tr key={row.term} className={!row.survived ? styles.mishapRow : ''}>
                  <td>{row.term}</td>
                  <td>{row.career}</td>
                  <td>{row.spec}</td>
                  <td>{row.rank}</td>
                  <td>{row.title ?? '—'}</td>
                  {showEvents ? <td>{parts.length ? parts.join('; ') : '—'}</td> : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}


function PsionicsSection({ psionics }) {
  if (!psionics) return null;
  return (
    <section className={`${styles.sheetPanel} ${styles.psionicsPanel}`} aria-label="Psionics">
      <div className={styles.sectionHeader}>
        <p className={styles.kicker}>Psionics</p>
        <h3>Powers</h3>
      </div>
      <Metric label="Psi rating" value={String(psionics.rating)} mono />
      <div className={styles.powerList}>
        {psionics.talents.map((talent) => (
          <div key={talent.name}>
            <strong>{talent.name} {talent.level}</strong>
            <span>{talent.powers.join(', ')}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HomeworldSection({ homeworld }) {
  if (!homeworld || homeworld.mode === 'chthonian') return null;
  return (
    <section className={`${styles.sheetPanel} ${styles.homeworldPanel}`} aria-label="Homeworld">
      <div className={styles.sectionHeader}>
        <p className={styles.kicker}>Homeworld</p>
        <h3>{homeworld.name} <span className={styles.uppInline}>[{homeworld.upp}]</span></h3>
      </div>
      <div className={styles.homeworldGrid}>
        <div className={styles.homeworldFacts}>
          <dl className={styles.worldFactList}>
            <div><dt>Starport</dt><dd>{homeworld.starport} — {homeworld.starportDesc}</dd></div>
            <div><dt>Size</dt><dd>{homeworld.sizeDesc} (size {homeworld.size})</dd></div>
            <div><dt>Atmosphere</dt><dd>{homeworld.atmosphereDesc}</dd></div>
            <div><dt>Hydrographics</dt><dd>{homeworld.hydroDesc} ({homeworld.hydrographics * 10}%)</dd></div>
            <div><dt>Population</dt><dd>{homeworld.populationDesc}</dd></div>
            <div><dt>Government</dt><dd>{homeworld.governmentDesc}</dd></div>
            <div><dt>Law Level</dt><dd>{homeworld.lawDesc} ({homeworld.law})</dd></div>
            <div><dt>Tech Level</dt><dd>TL{homeworld.techLevel}</dd></div>
            <div><dt>Trade Codes</dt><dd>{homeworld.tradeCodes.join(', ')}</dd></div>
            <div><dt>Background Skills</dt><dd>{homeworld.backgroundSkills.join(', ')}</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function SpacecraftSection({ spacecraft }) {
  if (!spacecraft) return null;
  return (
    <section className={`${styles.sheetPanel} ${styles.spacecraftPanel}`} aria-label="Spacecraft">
      <div className={styles.sectionHeader}>
        <p className={styles.kicker}>Spacecraft</p>
        <h3>{spacecraft.name} <span className={styles.shipType}>({spacecraft.type})</span></h3>
      </div>
      <p className={styles.compactLine}>{spacecraft.ownershipType} · {spacecraft.condition}</p>
      <div className={styles.spacecraftGrid}>
        <dl className={styles.worldFactList}>
          <div><dt>Hull</dt><dd>{spacecraft.hull}T</dd></div>
          <div><dt>Jump</dt><dd>J{spacecraft.jumpRating || 'N/A'}</dd></div>
          <div><dt>Maneuver</dt><dd>{spacecraft.maneuverRating}G</dd></div>
          <div><dt>Power Plant</dt><dd>Code {spacecraft.powerPlant}</dd></div>
          <div><dt>Fuel</dt><dd>{spacecraft.fuelCapacity}T</dd></div>
          <div><dt>Staterooms</dt><dd>{spacecraft.staterooms}</dd></div>
          <div><dt>Cargo</dt><dd>{spacecraft.cargo}T</dd></div>
          <div><dt>Hardpoints</dt><dd>{spacecraft.hardpoints}</dd></div>
          <div><dt>Weapons</dt><dd>{spacecraft.weapons}</dd></div>
          <div><dt>Value</dt><dd>{spacecraft.costMCr} MCr</dd></div>
        </dl>
      </div>
      {spacecraft.notes && <p className={styles.compactLine}>{spacecraft.notes}</p>}
    </section>
  );
}

function equipmentMeta(name) {
  return coreRulesData.equipment.find((e) => e.name === name);
}

function consolidateCounts(items, getKey) {
  const counts = new Map();
  const order = [];
  for (const item of items) {
    const key = getKey(item);
    if (!counts.has(key)) order.push(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return order.map((item) => ({ item, count: counts.get(getKey(item)) }));
}

function PlayAssets({ character }) {
  const injuries = character.injuries.map((injury) => injury.label);
  const isArmor = (item) => equipmentMeta(item.name)?.protection !== undefined || item.protection !== undefined;

  const nonArmorEquipment = character.equipment.filter((item) => !isArmor(item));
  const consolidatedEquip = consolidateCounts(nonArmorEquipment, (e) => e.name);
  const totalMass = nonArmorEquipment.reduce((sum, item) => sum + (equipmentMeta(item.name)?.mass ?? item.mass ?? 0), 0);
  const equipmentItems = consolidatedEquip.map(({ item, count }) => {
    const meta = equipmentMeta(item.name);
    const label = count > 1 ? `${item.name} (x${count})` : item.name;
    const itemMass = meta?.mass ?? item.mass;
    const mass = itemMass !== undefined ? ` — ${+(itemMass * count).toFixed(2)} kg` : '';
    return `${label}${mass}`;
  });
  const equipTitle = equipmentItems.length ? `Equipment — ${+totalMass.toFixed(2)} kg total` : 'Equipment';

  const armorItems = character.equipment
    .filter(isArmor)
    .map((item) => {
      const meta = equipmentMeta(item.name);
      const protection = meta?.protection ?? item.protection;
      return `${item.name} — Protection ${protection}${meta?.mass !== undefined ? `, ${meta.mass} kg` : ''}`;
    });

  const blocks = [
    { title: equipTitle, items: equipmentItems },
    { title: 'Armor', items: armorItems },
    { title: 'Contacts', items: character.contacts ?? [], always: true },
    { title: 'Enemies', items: character.enemies ?? [], always: true },
    { title: 'Injuries', items: injuries },
  ].filter((b) => b.always || b.items.length > 0);

  if (blocks.length === 0) return null;
  return (
    <section className={`${styles.sheetPanel} ${styles.assetsPanel}`} aria-label="Play assets">
      <div className={styles.sectionHeader}>
        <p className={styles.kicker}>Play assets</p>
        <h3>Gear and Consequences</h3>
      </div>
      <div className={styles.assetGrid}>
        {blocks.map((b) => <AssetBlock key={b.title} title={b.title} items={b.items} />)}
      </div>
    </section>
  );
}

function AssetBlock({ title, items }) {
  return (
    <div className={styles.resumeList}>
      <p className={styles.kicker}>{title}</p>
      {items.length ? (
        <ul className={styles.cleanList}>
          {items.slice(0, 10).map((item, index) => <li key={`${title}-${item}-${index}`}>{item}</li>)}
          {items.length > 10 ? <li>{items.length - 10} more</li> : null}
        </ul>
      ) : <p>None</p>}
    </div>
  );
}


function CombatTable({ combat, onRoll }) {
  if (!combat.length) return null;
  const consolidated = consolidateCounts(combat, (item) => item.weapon);
  return (
    <section className={`${styles.sheetPanel} ${styles.combatPanel}`} aria-label="Weapon combat table">
      <div className={styles.sectionHeader}>
        <p className={styles.kicker}>Combat</p>
        <h3>Owned Weapons</h3>
      </div>
      <div className={styles.historyTableWrap}>
        <table className={styles.historyTable}>
          <thead>
            <tr>
              <th>Weapon</th>
              <th>Attack DM</th>
              <th>Skill</th>
              <th>Damage</th>
              <th>Range</th>
              <th>Traits</th>
              <th>Mass (kg)</th>
            </tr>
          </thead>
          <tbody>
            {consolidated.map(({ item, count }) => (
              <tr key={item.weapon} className={styles.rollable} onClick={() => onRoll(item)}>
                <td>{count > 1 ? `${item.weapon} (x${count})` : item.weapon}</td>
                <td>{signed(item.attackDm)}</td>
                <td>{item.skill}<span>{item.skillLevel === null ? 'Untrained' : `Level ${item.skillLevel}`} / {item.characteristic} {signed(item.characteristicDm)}</span></td>
                <td>{item.damage}</td>
                <td>{item.range}</td>
                <td>{item.traits}</td>
                <td>{coreRulesData.weaponCombat[item.weapon]?.mass ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CareerHistory({ character }) {
  return (
    <section className={`${styles.sheetPanel} ${styles.historyPanel}`} aria-label="Build transcript">
      <div>
        <p className={styles.kicker}>Career history</p>
        <h3>Build Transcript</h3>
      </div>
      <div className={styles.transcriptIntro}>
        <span>Starting UPP {character.history.find((line) => line.includes('Starting UPP'))?.replace('Starting UPP:', '').trim()}</span>
        <span>Background skills {(character.backgroundSkills ?? character.homeworld.backgroundSkills).join(', ')}</span>
      </div>
      <div className={styles.transcriptTerms}>
        {character.terms.map((term) => (
          <article className={styles.transcriptTerm} key={term.T}>
            <div className={styles.transcriptTermHeader}>
              <strong>Term {term.T + 1}</strong>
              <span>{term.Career} / {term.Spec}</span>
              <span>
                Rank {term.Rnk ?? 0}
                {rankTitle(term.Career, term.Rnk) ? ` — ${rankTitle(term.Career, term.Rnk)}` : ''}
              </span>
              {term.mishap ? <span>Mishap: {term.mishap.label}</span> : null}
              {!term.mishap && term.event ? <span>Event: {term.event.label}</span> : null}
            </div>
            <ol className={styles.transcriptSteps}>
              {(term.steps ?? []).filter(Boolean).map((step, index) => (
                <li key={`${term.T}-${step.stage}-${index}`}>
                  <div className={styles.transcriptStepMain}>
                    <span>{step.stage}</span>
                    <code>{step.roll || '-'}</code>
                    <strong>{step.result}</strong>
                  </div>
                  {step.detail ? <p>{step.detail}</p> : null}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}

function RollPopup({ roll, stats, onStatChange, onReroll, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const hit = roll.total >= 8;
  const availableStats = [...CORE_STATS, 'Psi'].filter((s) => s in stats);

  function fmtMod(n) { return n >= 0 ? `+${n}` : `${n}`; }

  const isWeapon = roll.type === 'weapon';

  const attackFormula = isWeapon
    ? `${roll.d1} + ${roll.d2}${roll.attackDm !== 0 ? ` ${fmtMod(roll.attackDm)}` : ''} = `
    : roll.type === 'skill'
      ? `${roll.d1} + ${roll.d2}${roll.skillMod !== 0 ? ` ${fmtMod(roll.skillMod)}` : ''}${roll.statMod !== 0 ? ` ${fmtMod(roll.statMod)}` : ''} (${roll.statName}) = `
      : `${roll.d1} + ${roll.d2}${roll.statMod !== 0 ? ` ${fmtMod(roll.statMod)}` : ''} = `;

  const weaponSkillLabel = roll.skillLevel === null
    ? `(untrained, ${fmtMod(roll.skillDm ?? -3)})`
    : roll.skillLevel;

  return (
    <div className={styles.rollOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Task check result">
      <div className={styles.rollPanel} onClick={(e) => e.stopPropagation()}>
        <p className={styles.kicker}>{isWeapon ? `Attack roll${roll.note ? ` · ${roll.note}` : ''}` : `Task check${roll.note ? ` · ${roll.note}` : ''}`}</p>
        <h3 className={styles.rollName}>{roll.name}</h3>
        <div className={styles.rollDice}>
          <div className={styles.rollDie}>{roll.d1}</div>
          <div className={styles.rollDie}>{roll.d2}</div>
        </div>
        <p className={styles.rollFormula}>{attackFormula}<strong>{roll.total}</strong></p>
        {isWeapon && (
          <p className={styles.rollMeta}>
            {roll.skill} {weaponSkillLabel} · {roll.characteristic} {fmtMod(roll.characteristicDm)}
          </p>
        )}
        {roll.type === 'skill' && (
          <div className={styles.rollStatPicker}>
            {availableStats.map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.rollStatBtn} ${s === roll.statName ? styles.rollStatBtnActive : ''}`}
                onClick={() => onStatChange(s)}
              >
                {s}<span>{fmtMod(modifier(stats[s] ?? 7))}</span>
              </button>
            ))}
          </div>
        )}
        <p className={`${styles.rollOutcome} ${hit ? styles.rollSuccess : styles.rollFailure}`}>
          {hit ? 'Hit' : 'Miss'} · Average (8+)
        </p>
        {isWeapon && roll.damage && (
          <div className={styles.rollDamageRow}>
            <span className={styles.kicker}>Damage</span>
            <span className={styles.rollDamageFormula}>
              {roll.damage.rolls.join(' + ')}
              {roll.damage.mod !== 0 ? ` ${fmtMod(roll.damage.mod)}` : ''}
              {' = '}
              <strong>{roll.damage.total}</strong>
              <span> ({roll.damageExpr})</span>
            </span>
          </div>
        )}
        <div className={styles.rollActions}>
          <button type="button" className={styles.primaryAction} onClick={onReroll}>Reroll</button>
          <button type="button" className={styles.secondaryAction} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => <option key={`${label}-${optionValue}`} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function Input({ label, value, onChange, placeholder = '', type = 'text' }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className={styles.checkbox}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function formatSpaceshipMarkdown(ship) {
  return `# ${ship.name}

- Type: ${ship.type}
- Ownership: ${ship.ownershipType}
- Condition: ${ship.condition}
- Seed: ${ship.seed}

## Specifications

- Hull: ${ship.hull}T
- Jump: ${ship.jumpRating ? `J${ship.jumpRating}` : 'N/A'}
- Maneuver: ${ship.maneuverRating}G
- Power Plant: Code ${ship.powerPlant}
- Fuel: ${ship.fuelCapacity}T
- Staterooms: ${ship.staterooms}
- Cargo: ${ship.cargo}T
- Hardpoints: ${ship.hardpoints}
- Weapons: ${ship.weapons}
- Value: ${ship.costMCr} MCr
${ship.notes ? `\n## Notes\n\n${ship.notes}` : ''}
`;
}

function formatWorldMarkdown(world) {
  return `# ${world.name}

- UWP: ${world.upp}
- Seed: ${world.seed}

## Profile

- Starport: ${world.starport} — ${world.starportDesc}
- Size: ${world.sizeDesc} (size ${world.size})
- Atmosphere: ${world.atmosphereDesc}
- Hydrographics: ${world.hydroDesc} (${world.hydrographics * 10}%)
- Population: ${world.populationDesc}
- Government: ${world.governmentDesc}
- Law Level: ${world.lawDesc} (${world.law})
- Tech Level: TL${world.techLevel}
- Trade Codes: ${world.tradeCodes.join(', ')}
- Background Skills: ${world.backgroundSkills.join(', ')}
`;
}

function formatAdventureMarkdown(adventure) {
  return `# Mission Brief

- Patron: ${adventure.patron}
- Mission: ${adventure.mission}
- Location: ${adventure.location}
- Opposition: ${adventure.antagonist}
- Reward: ${adventure.reward}
- Seed: ${adventure.seed}

## Hook

${adventure.hook}

## Complications

${adventure.complications.map((c) => `- ${c}`).join('\n')}

## Twist

${adventure.twist}
`;
}

function formatCharacterMarkdown(character, showHistory) {
  const skills = Object.entries(character.skills)
    .map(([skill, value]) => `- ${skill} ${value}`)
    .join('\n');
  const benefits = [
    character.cash ? `${character.cash} Cr.` : '',
    ...character.benefits.map((benefit) => benefit.name ?? benefit),
  ].filter(Boolean);
  const equipment = character.equipment.map((item) => `- ${item.name} (${item.source})`).join('\n');
  const combat = character.combat
    .map((item) => `- ${item.weapon}: attack ${signed(item.attackDm)}, ${item.damage}, ${item.range}, ${item.traits}; ${item.skill} ${item.skillLevel === null ? 'untrained' : item.skillLevel}`)
    .join('\n');
  const psionics = character.psionics
    ? `\n\n## Psionics\n\n- Psi rating: ${character.psionics.rating}\n${character.psionics.talents.map((talent) => `- ${talent.name} ${talent.level}: ${talent.powers.join(', ')}`).join('\n')}`
    : '';
  const personality = character.personality
    ? `\n\n## Personality\n\n- Type: ${character.personality.type}\n- Primary: ${character.personality.primary}\n- Secondary: ${character.personality.secondary}\n- Quirk: ${character.personality.quirk}\n- Drive: ${character.personality.drive}`
    : '';
  const spacecraft = character.spacecraft
    ? `\n\n## Spacecraft\n\n- Name: ${character.spacecraft.name} (${character.spacecraft.type})\n- Ownership: ${character.spacecraft.ownershipType}\n- Hull: ${character.spacecraft.hull}T · Jump ${character.spacecraft.jumpRating || 'N/A'} · Maneuver ${character.spacecraft.maneuverRating}G\n- Fuel: ${character.spacecraft.fuelCapacity}T · Staterooms: ${character.spacecraft.staterooms} · Cargo: ${character.spacecraft.cargo}T\n- Weapons: ${character.spacecraft.weapons}\n- Condition: ${character.spacecraft.condition}\n- Value: ${character.spacecraft.costMCr} MCr`
    : '';
  const history = showHistory
    ? `\n\n## Build Transcript\n\n${formatBuildTranscript(character)}`
    : '';

  return `# ${character.name}

- Gender: ${character.gender}
- Ethnicity: ${character.ethnicity}
- Homeworld: ${character.homeworld.summary}
- Age: ${character.age}
- UPP: ${character.upp} [${character.average.toFixed(1)}]
- Seed: ${character.seed}

## Bio

${character.bio}

## Skills

${skills || '- None'}

## Benefits

${benefits.length ? benefits.map((benefit) => `- ${benefit}`).join('\n') : '- None'}

## Equipment

${equipment || '- None'}

## Combat

${combat || '- None'}${spacecraft}${psionics}${personality}${history}
`;
}

function formatBuildTranscript(character) {
  const start = character.history.find((line) => line.includes('Starting UPP'))?.trim() ?? `Starting UPP: ${character.upp}`;
  const background = `Background skills: ${(character.backgroundSkills ?? character.homeworld.backgroundSkills).join(', ')}`;
  const terms = character.terms.map((term) => {
    const incident = term.mishap
      ? `\nIncident: Mishap ${term.mishap.roll}: ${term.mishap.label}`
      : (term.event ? `\nIncident: Event ${term.event.roll}: ${term.event.label}` : '');
    const steps = (term.steps ?? []).filter(Boolean).map((step) => {
      const detail = step.detail ? ` ${step.detail}` : '';
      return `  - ${step.stage}: ${step.roll || '-'} -> ${step.result}.${detail}`;
    }).join('\n');
    return `### Term ${term.T + 1}: ${term.Career} / ${term.Spec}${incident}\n${steps}`;
  }).join('\n\n');
  return `${start}\n${background}\n\n${terms}`;
}

function normalizeCareerPlan(plan = [], terms = 3) {
  const count = Math.max(1, Math.min(8, Number.parseInt(terms, 10) || 3));
  return Array.from({ length: count }, (_, index) => ({
    career: plan[index]?.career ?? '',
    spec: plan[index]?.spec ?? '',
  }));
}

function signed(value) {
  return value >= 0 ? `+${value}` : String(value);
}

export default App;
