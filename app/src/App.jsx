import { useMemo, useState } from 'react';
import styles from './App.module.css';
import { titleCase } from './generators/helpers.js';
import { generateStats, modifier, PSI_OPTIONS, STAT_METHODS } from './generators/stats.js';
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
import {
  BEHAVIOR_OPTIONS,
  ORDER_OPTIONS,
  TERRAIN_OPTIONS,
  formatAnimalText,
  generateAnimal,
} from './generators/animal.js';
import { rollExpression } from './generators/diceExpression.js';

const tabs = ['Character', 'UPP', 'Animal', 'Dice'];

function App() {
  const [active, setActive] = useState('Character');
  const [menuOpen, setMenuOpen] = useState(false);
  const [uppForm, setUppForm] = useState({ method: 'normal', psi: '', seed: '' });
  const [upp, setUpp] = useState(() => generateStats({ method: 'normal' }));
  const [characterForm, setCharacterForm] = useState({
    seed: '', method: 'normal', psi: '', terms: 3, name: '', gender: '',
    ethnicity: '', homeworld: '', campaignMode: 'standard', upp: '', careerPlan: [], randAge: false,
    personality: true, showHistory: false,
    expansions: { psion: false, chthonianStars: false, dilettante: false, agent: false, scoundrel: false },
  });
  const [character, setCharacter] = useState(() => generateCharacter(characterForm));
  const [animalForm, setAnimalForm] = useState({ seed: '', terrain: '', order: '', behavior: '', sentient: false });
  const [animal, setAnimal] = useState(() => generateAnimal());
  const [diceForm, setDiceForm] = useState({ seed: '', expression: '2d6' });
  const [dice, setDice] = useState(() => rollExpression({ expression: '2d6' }));
  const [message, setMessage] = useState('');

  const markdownText = useMemo(() => {
    if (active === 'UPP') return formatUppText(upp);
    if (active === 'Animal') return formatAnimalText(animal);
    if (active === 'Dice') return formatDiceText(dice);
    return formatCharacterMarkdown(character, characterForm.showHistory);
  }, [active, upp, animal, dice, character, characterForm.showHistory]);

  async function copyShareLink() {
    const seed = active === 'UPP' ? upp.seed : active === 'Animal' ? animal.seed : active === 'Dice' ? dice.seed : character.seed;
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
    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${active.toLowerCase()}-${activeSeed(active, { upp, animal, dice, character })}.md`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage('Markdown downloaded.');
  }

  function closeMenu() { setMenuOpen(false); }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <button
          className={styles.menuButton}
          type="button"
          aria-label="Open controls"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span /><span /><span />
        </button>
        <div>
          <p className={styles.eyebrow}>Travgen frontier office</p>
          <h1>{active === 'Character' ? 'Character Generator' : active}</h1>
        </div>
        <div className={styles.topbarActions}>
          {active === 'Character' && (
            <button
              className={styles.rerollButton}
              type="button"
              onClick={() => setCharacter(generateCharacter({
                ...characterForm,
                seed: '',
                careerPlan: normalizeCareerPlan(characterForm.careerPlan, characterForm.terms),
              }))}
            >
              Reroll
            </button>
          )}
          <button className={styles.secondaryAction} type="button" onClick={downloadMarkdown}>Download as Markdown</button>
          <button className={styles.secondaryAction} type="button" onClick={copyShareLink}>Copy Share Link</button>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className={styles.backdrop} onClick={closeMenu} aria-hidden="true" />
          <aside className={styles.sidebar} aria-label="Generator controls">
            <div className={styles.sidebarHeader}>
              <nav className={styles.toolNav}>
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={active === tab ? styles.activeToolTab : styles.toolTab}
                    onClick={() => setActive(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
              <button type="button" className={styles.sidebarClose} onClick={closeMenu} aria-label="Close">✕</button>
            </div>

            {active === 'Character' && (
              <form
                className={styles.sidebarForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  setCharacter(generateCharacter({
                    ...characterForm,
                    careerPlan: normalizeCareerPlan(characterForm.careerPlan, characterForm.terms),
                  }));
                  closeMenu();
                }}
              >
                <div className={styles.sidebarBody}>
                  <CharacterForm form={characterForm} setForm={setCharacterForm} />
                </div>
                <div className={styles.sidebarFooter}>
                  <button className={styles.primaryAction} type="submit">Generate New Character</button>
                </div>
              </form>
            )}

            {active === 'UPP' && (
              <form
                className={styles.sidebarForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  setUpp(generateStats(uppForm));
                  closeMenu();
                }}
              >
                <div className={styles.sidebarBody}>
                  <UppForm form={uppForm} setForm={setUppForm} />
                </div>
                <div className={styles.sidebarFooter}>
                  <button className={styles.primaryAction} type="submit">Generate New UPP</button>
                </div>
              </form>
            )}

            {active === 'Animal' && (
              <form
                className={styles.sidebarForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  setAnimal(generateAnimal(animalForm));
                  closeMenu();
                }}
              >
                <div className={styles.sidebarBody}>
                  <AnimalForm form={animalForm} setForm={setAnimalForm} />
                </div>
                <div className={styles.sidebarFooter}>
                  <button className={styles.primaryAction} type="submit">Generate New Animal</button>
                </div>
              </form>
            )}

            {active === 'Dice' && (
              <form
                className={styles.sidebarForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  setDice(rollExpression(diceForm));
                  closeMenu();
                }}
              >
                <div className={styles.sidebarBody}>
                  <DiceForm form={diceForm} setForm={setDiceForm} />
                </div>
                <div className={styles.sidebarFooter}>
                  <button className={styles.primaryAction} type="submit">Roll Again</button>
                </div>
              </form>
            )}
          </aside>
        </>
      )}

      <div className={styles.outputArea}>
        {active === 'Character' && (
          <CharacterOutput character={character} showHistory={characterForm.showHistory} />
        )}
        {active === 'UPP' && <UppOutput result={upp} />}
        {active === 'Animal' && <AnimalOutput animal={animal} />}
        {active === 'Dice' && <DiceOutput dice={dice} />}
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

function UppForm({ form, setForm }) {
  return (
    <>
      <Select label="Generation method" value={form.method} onChange={(method) => setForm({ ...form, method })} options={STAT_METHODS.map((o) => [o.value, `${o.label} (${o.description})`])} />
      <Select label="Psionics mode" value={form.psi} onChange={(psi) => setForm({ ...form, psi })} options={PSI_OPTIONS.map((o) => [o.value, o.label])} />
      <Input label="Hex seed" value={form.seed} placeholder="Auto-generate" onChange={(seed) => setForm({ ...form, seed })} />
    </>
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
          <Checkbox label="Personality" checked={form.personality} onChange={(personality) => set({ personality })} />
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

function AnimalForm({ form, setForm }) {
  const set = (patch) => setForm({ ...form, ...patch });
  return (
    <>
      <Select label="Terrain" value={form.terrain} onChange={(terrain) => set({ terrain })} options={[['', 'Random'], ...TERRAIN_OPTIONS.map((v) => [v, v])]} />
      <Select label="Order" value={form.order} onChange={(order) => set({ order })} options={[['', 'Random'], ...ORDER_OPTIONS.map((v) => [v, v])]} />
      <Select label="Behavior" value={form.behavior} onChange={(behavior) => set({ behavior })} options={[['', 'Random'], ...BEHAVIOR_OPTIONS.map((v) => [v, v])]} />
      <Input label="Hex seed" value={form.seed} placeholder="Auto-generate" onChange={(seed) => set({ seed })} />
      <Checkbox label="Sentient" checked={form.sentient} onChange={(sentient) => set({ sentient })} />
    </>
  );
}

function DiceForm({ form, setForm }) {
  return (
    <>
      <Input label="Dice" value={form.expression} placeholder="2d6" onChange={(expression) => setForm({ ...form, expression })} />
      <Input label="Hex seed" value={form.seed} placeholder="Auto-generate" onChange={(seed) => setForm({ ...form, seed })} />
    </>
  );
}

function UppOutput({ result }) {
  return (
    <>
      <ResultHeader label="Generated profile" value={result.upp} seed={result.seed} />
      <StatGrid stats={result.values} psi={result.psi ? result.psiValue : null} />
    </>
  );
}

function CharacterOutput({ character, showHistory }) {
  return (
    <div className={styles.characterSheet}>
      <CharacterHeader character={character} />
      <div className={styles.sheetBody}>
        <SkillsSection skills={character.skills} />
        <CombatTable combat={character.combat} />
        <div className={styles.infoRow}>
          <FinancesSection character={character} />
          <PersonalitySection personality={character.personality} />
          <ArmorSection equipment={character.equipment} />
          <PsionicsSection psionics={character.psionics} />
        </div>
        <PlayAssets character={character} />
        <SpacecraftSection spacecraft={character.spacecraft} />
        <HomeworldSection homeworld={character.homeworld} />
        <CareerSummary history={character.careerHistory} />
      </div>
      {showHistory ? <CareerHistory character={character} /> : null}
    </div>
  );
}

function CharacterHeader({ character }) {
  const roleText = [...character.careerPath].reverse().map((item, index) => {
    const title = item.title ? `${item.title} ` : '';
    const bracket = `[${item.career}/${item.spec}:${item.rank}]`;
    return index === 0 ? `${title}${bracket}` : `fmr. ${title}${bracket}`;
  }).join(', ');
  const statEntries = Object.entries(character.stats)
    .filter(([name]) => ['Str', 'Dex', 'End', 'Int', 'Edu', 'Soc', 'Ins', 'Pac'].includes(name));
  return (
    <header className={styles.characterHeader}>
      <div className={styles.headerTop}>
        <div className={styles.characterTitleBlock}>
          <p className={styles.kicker}>Character record</p>
          <h2>{character.name} <span>[{character.upp}]</span></h2>
          <p className={styles.headerSubtitle}>
            {titleCase(character.gender)} {titleCase(character.ethnicity)}, age {character.age}
            {roleText ? ` · ${roleText}` : ''}
          </p>
        </div>
        <div className={styles.headerMeta}>
          <Metric label="Cash" value={`${character.cash.toLocaleString()} Cr.`} />
          <Metric label="Seed" value={character.seed} mono />
        </div>
      </div>
      <div className={styles.statStrip}>
        {statEntries.map(([name, value]) => (
          <div key={name} className={styles.statBox}>
            <span className={styles.statLabel}>{name}</span>
            <span className={styles.statValue}>{value.toString(16).toUpperCase()}</span>
            <span className={styles.statMod}>{modifier(value) >= 0 ? `+${modifier(value)}` : modifier(value)}</span>
          </div>
        ))}
        {character.psionics && (
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Psi</span>
            <span className={styles.statValue}>{character.psionics.rating.toString(16).toUpperCase()}</span>
            <span className={styles.statMod}>{modifier(character.psionics.rating) >= 0 ? `+${modifier(character.psionics.rating)}` : modifier(character.psionics.rating)}</span>
          </div>
        )}
      </div>
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

function QuickReference({ character }) {
  const weapons = character.combat.map((item) => item.weapon);
  const armor = character.equipment.filter((item) => /armor|armour|vacc suit/i.test(item.name)).map((item) => item.name);

  return (
    <section className={`${styles.sheetPanel} ${styles.overviewPanel}`} aria-label="Quick reference">
      <div className={styles.sectionHeader}>
        <p className={styles.kicker}>Characteristics</p>
        <h3>Stats and Status</h3>
      </div>
      <StatGrid stats={character.stats} />
      <dl className={`${styles.factList} ${styles.statusList}`}>
        <div><dt>Homeworld</dt><dd>{character.homeworld.summary}</dd></div>
        <div><dt>Weapons</dt><dd>{weapons.length ? weapons.join(', ') : 'None'}</dd></div>
        <div><dt>Armor</dt><dd>{armor.length ? armor.join(', ') : 'None'}</dd></div>
      </dl>
    </section>
  );
}

function skillLevel(skills, masterSkill) {
  if (masterSkill in skills) return skills[masterSkill];
  const prefix = `${masterSkill} (`;
  const levels = Object.entries(skills)
    .filter(([name]) => name.startsWith(prefix))
    .map(([, level]) => level);
  return levels.length ? Math.max(...levels) : null;
}

function buildSkillEntries(skills) {
  return CORE_SKILLS.map((base) => {
    const specs = Object.entries(skills)
      .filter(([name]) => name.startsWith(`${base} (`))
      .sort(([a], [b]) => a.localeCompare(b));
    const baseLevel = base in skills ? skills[base] : null;
    const displayLevel = specs.length > 0 ? Math.max(...specs.map(([, v]) => v)) : baseLevel;
    return { base, level: displayLevel, absent: displayLevel === null && specs.length === 0, specs };
  });
}

function SkillsSection({ skills }) {
  const entries = buildSkillEntries(skills);
  return (
    <section className={`${styles.sheetPanel} ${styles.skillsPanel}`} aria-label="Skills">
      <div className={styles.sectionHeader}>
        <p className={styles.kicker}>Skills</p>
        <h3>All Skills</h3>
      </div>
      <div className={styles.skillColumns}>
        {entries.map(({ base, level, absent, specs }) => (
          <div key={base} className={`${styles.skillEntry} ${absent ? styles.skillAbsent : ''}`}>
            <div className={styles.skillRow}>
              <span>{base}</span>
              <strong>{level !== null ? level : '—'}</strong>
            </div>
            {specs.map(([name, specLevel]) => (
              <div key={name} className={styles.skillSpec}>
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

function FinancesSection({ character }) {
  return (
    <section className={`${styles.sheetPanel} ${styles.financePanel}`} aria-label="Finances">
      <div className={styles.sectionHeader}>
        <p className={styles.kicker}>Finances</p>
        <h3>Cash and Obligations</h3>
      </div>
      <div className={styles.financeGrid}>
        <Metric label="Cash on hand" value={`${character.cash.toLocaleString()} Cr.`} />
        {character.pension > 0 ? <Metric label="Pension / month" value={`${character.pension.toLocaleString()} Cr.`} /> : null}
        {character.totalDebt > 0 ? <Metric label="Debt" value={`${character.totalDebt.toLocaleString()} Cr.`} /> : null}
      </div>
    </section>
  );
}

function CareerSummary({ history }) {
  if (!history?.length) return null;
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
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={row.term} className={!row.survived ? styles.mishapRow : ''}>
                <td>{row.term}</td>
                <td>{row.career}</td>
                <td>{row.spec}</td>
                <td>{row.rank}</td>
                <td>{row.title ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BioSection({ bio }) {
  return (
    <section className={`${styles.sheetPanel} ${styles.bioPanel}`} aria-label="Character bio">
      <div>
        <p className={styles.kicker}>Character bio</p>
        <h3>Background and Career</h3>
      </div>
      <div className={styles.bioText}>
        {bio.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </section>
  );
}

function PersonalitySection({ personality }) {
  if (!personality) return null;
  return (
    <section className={`${styles.sheetPanel} ${styles.personalityPanel}`} aria-label="Personality">
      <div>
        <p className={styles.kicker}>Personality</p>
        <h3>Roleplaying Profile</h3>
      </div>
      <div className={styles.personalityGrid}>
        <Metric label="Primary" value={personality.primary} />
        <Metric label="Secondary" value={personality.secondary} />
      </div>
      <p className={styles.compactLine}>{personality.summary}</p>
      <p className={styles.compactLine}>Quirk: {personality.quirk}. Drive: {personality.drive}.</p>
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

function PlayAssets({ character }) {
  const benefits = character.benefits.map((benefit) => benefit.name ?? benefit);
  const injuries = character.injuries.map((injury) => injury.label);
  const equipmentItems = character.equipment.map((item) => {
    const meta = equipmentMeta(item.name);
    return meta?.mass !== undefined ? `${item.name} (${item.source}) — ${meta.mass} kg` : `${item.name} (${item.source})`;
  });
  const totalMass = character.equipment.reduce((sum, item) => {
    const meta = equipmentMeta(item.name);
    return sum + (meta?.mass ?? 0);
  }, 0);
  const equipTitle = equipmentItems.length ? `Equipment — ${totalMass} kg total` : 'Equipment';
  const blocks = [
    { title: equipTitle, items: equipmentItems },
    { title: 'Benefits', items: benefits },
    { title: 'Contacts', items: character.contacts },
    { title: 'Enemies', items: character.enemies },
    { title: 'Injuries', items: injuries },
  ].filter((b) => b.items.length > 0);

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

function ArmorSection({ equipment }) {
  const armorItems = equipment.filter((item) => {
    const meta = equipmentMeta(item.name);
    return meta?.protection !== undefined;
  });
  if (!armorItems.length) return null;
  return (
    <section className={`${styles.sheetPanel} ${styles.armorPanel}`} aria-label="Armor">
      <div className={styles.sectionHeader}>
        <p className={styles.kicker}>Armor</p>
        <h3>Protection</h3>
      </div>
      <div className={styles.armorCards}>
        {armorItems.map((item) => {
          const meta = equipmentMeta(item.name);
          return (
            <div key={`${item.name}-${item.source}`} className={styles.armorCard}>
              <strong>{item.name}</strong>
              <dl className={styles.armorFacts}>
                <div><dt>Protection</dt><dd>{meta?.protection ?? '—'}</dd></div>
                <div><dt>Mass</dt><dd>{meta?.mass ?? '—'} kg</dd></div>
                <div><dt>Source</dt><dd>{item.source}</dd></div>
                {meta?.notes && <div><dt>Notes</dt><dd>{meta.notes}</dd></div>}
              </dl>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CombatTable({ combat }) {
  if (!combat.length) return null;
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
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {combat.map((item) => (
              <tr key={`${item.weapon}-${item.source}`}>
                <td>{item.weapon}</td>
                <td>{signed(item.attackDm)}</td>
                <td>{item.skill}<span>{item.skillLevel === null ? 'Untrained' : `Level ${item.skillLevel}`} / {item.characteristic} {signed(item.characteristicDm)}</span></td>
                <td>{item.damage}</td>
                <td>{item.range}</td>
                <td>{item.traits}</td>
                <td>{coreRulesData.weaponCombat[item.weapon]?.mass ?? '—'}</td>
                <td>{item.source}</td>
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
        <span>Background skills {character.homeworld.backgroundSkills.join(', ')}</span>
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

function AnimalOutput({ animal }) {
  return (
    <>
      <ResultHeader label={animal.name} value={`${animal.behavior} ${animal.order}`} seed={animal.seed} />
      <p className={styles.recordLine}>{animal.terrain}, size {animal.size}, pack size {animal.packSize}</p>
      <StatGrid stats={animal.stats} />
      <p className={styles.recordLine}>Combat: {animal.weapon} ({animal.damage}d6), Armor {animal.armor}, Move {animal.movement}</p>
      <div className={styles.pathList}>{animal.quirks.map((quirk) => <span key={quirk}>{quirk}</span>)}</div>
    </>
  );
}

function DiceOutput({ dice }) {
  return (
    <>
      <ResultHeader label={dice.expression} value={String(dice.total)} seed={dice.seed} />
      <div className={styles.pathList}>{dice.rolls.map((roll, index) => <span key={`${roll}-${index}`}>{roll}</span>)}</div>
    </>
  );
}

function ResultHeader({ label, value, seed, prominent = false }) {
  return (
    <div className={`${styles.resultHeader} ${prominent ? styles.prominentHeader : ''}`}>
      <div>
        <p className={styles.kicker}>{label}</p>
        <p className={styles.upp}>{value}</p>
      </div>
      <p className={styles.seed}>Seed {seed}</p>
    </div>
  );
}

function StatGrid({ stats, psi = null }) {
  const entries = Object.entries(stats).filter(([name]) => ['Str', 'Dex', 'End', 'Int', 'Edu', 'Soc', 'Ins', 'Pac'].includes(name));
  return (
    <dl className={styles.statGrid}>
      {entries.map(([name, value]) => <StatCell key={name} name={name} value={value} />)}
      {psi !== null ? <StatCell name="Psi" value={psi} /> : null}
    </dl>
  );
}

function StatCell({ name, value }) {
  return (
    <div>
      <dt>{name}</dt>
      <dd>{value.toString(16).toUpperCase()}<span>{modifier(value) >= 0 ? `+${modifier(value)}` : modifier(value)}</span></dd>
    </div>
  );
}

function KeyValue({ title, items }) {
  return (
    <div className={styles.keyValue}>
      <p className={styles.kicker}>{title}</p>
      <p>{Object.entries(items).map(([key, value]) => `${key} ${value}`).join(', ')}</p>
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

function formatUppText(result) {
  const stats = Object.entries(result.values).map(([name, value]) => `${name} ${value.toString(16).toUpperCase()} (${modifier(value)})`).join(', ');
  const psi = result.psi ? `\nPsi: ${result.psiValue.toString(16).toUpperCase()} (${modifier(result.psiValue)})` : '';
  return `UPP: ${result.upp}
Method: ${result.method}
Average: ${result.average.toFixed(1)}
Stats: ${stats}${psi}
Seed: ${result.seed}`;
}

function formatDiceText(result) {
  return `Roll: ${result.expression}
Dice: ${result.rolls.join(', ')}
Total: ${result.total}
Seed: ${result.seed}`;
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
  const background = `Background skills: ${character.homeworld.backgroundSkills.join(', ')}`;
  const terms = character.terms.map((term) => {
    const steps = (term.steps ?? []).filter(Boolean).map((step) => {
      const detail = step.detail ? ` ${step.detail}` : '';
      return `  - ${step.stage}: ${step.roll || '-'} -> ${step.result}.${detail}`;
    }).join('\n');
    return `### Term ${term.T + 1}: ${term.Career} / ${term.Spec}\n${steps}`;
  }).join('\n\n');
  return `${start}\n${background}\n\n${terms}`;
}

function activeSeed(active, records) {
  if (active === 'UPP') return records.upp.seed;
  if (active === 'Animal') return records.animal.seed;
  if (active === 'Dice') return records.dice.seed;
  return records.character.seed;
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
