import { useMemo, useState } from 'react';
import styles from './App.module.css';
import { generateStats, modifier, PSI_OPTIONS, STAT_METHODS } from './generators/stats.js';
import {
  CAREER_EXPANSIONS,
  ETHNICITIES,
  GENDERS,
  WORLDS,
  careerCatalog,
  formatCharacterText,
  generateCharacter,
} from './generators/character.js';
import {
  BEHAVIOR_OPTIONS,
  ORDER_OPTIONS,
  TERRAIN_OPTIONS,
  formatAnimalText,
  generateAnimal,
} from './generators/animal.js';
import { rollExpression } from './generators/diceExpression.js';

const tabs = ['Character', 'UPP', 'Animal', 'Dice'];
const supplementalTabs = new Set(['UPP', 'Animal', 'Dice']);

function App() {
  const [active, setActive] = useState('Character');
  const [menuOpen, setMenuOpen] = useState(false);
  const [characterControlsOpen, setCharacterControlsOpen] = useState(true);
  const [uppForm, setUppForm] = useState({ method: 'normal', psi: '', seed: '' });
  const [upp, setUpp] = useState(() => generateStats({ method: 'normal' }));
  const [characterForm, setCharacterForm] = useState({
    seed: '', method: 'normal', psi: '', terms: 3, name: '', gender: '',
    ethnicity: '', homeworld: '', upp: '', careerPlan: [], randAge: false,
    personality: false, showHistory: false,
    expansions: { psion: true, chthonianStars: true, dilettante: true, agent: true, scoundrel: true },
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

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <button
          className={styles.menuButton}
          type="button"
          aria-label="Open generator menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
          <span />
        </button>
        <div>
          <p className={styles.eyebrow}>Travgen frontier office</p>
          <h1>{active === 'Character' ? 'Character Generator' : active}</h1>
        </div>
      </header>

      {menuOpen ? (
        <nav className={styles.drawer} aria-label="Generator tools">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={[active === tab ? styles.activeTab : '', supplementalTabs.has(tab) ? styles.utilityTab : ''].filter(Boolean).join(' ')}
              type="button"
              onClick={() => {
                setActive(tab);
                setMenuOpen(false);
              }}
            >
              <strong>{tab}</strong>
              <span>{supplementalTabs.has(tab) ? 'Supplemental utility' : 'Primary generator'}</span>
            </button>
          ))}
        </nav>
      ) : null}

      {active === 'UPP' && (
        <ToolLayout
          title="UPP Generator"
          onSubmit={() => {
            const generated = generateStats(uppForm);
            setUpp(generated);
          }}
          controls={
            <UppForm
              form={uppForm}
              setForm={setUppForm}
            />
          }
          output={<UppOutput result={upp} />}
        />
      )}

      {active === 'Character' && (
        <CharacterLayout
          title="Character Generator"
          controlsOpen={characterControlsOpen}
          setControlsOpen={setCharacterControlsOpen}
          onSubmit={() => {
            const generated = generateCharacter({
              ...characterForm,
              careerPlan: normalizeCareerPlan(characterForm.careerPlan, characterForm.terms),
            });
            setCharacter(generated);
            setCharacterControlsOpen(false);
          }}
          controls={
            <CharacterForm
              form={characterForm}
              setForm={setCharacterForm}
            />
          }
          output={<CharacterOutput character={character} showHistory={characterForm.showHistory} />}
        />
      )}

      {active === 'Animal' && (
        <ToolLayout
          title="Animal Generator"
          onSubmit={() => {
            const generated = generateAnimal(animalForm);
            setAnimal(generated);
          }}
          controls={
            <AnimalForm
              form={animalForm}
              setForm={setAnimalForm}
            />
          }
          output={<AnimalOutput animal={animal} />}
        />
      )}

      {active === 'Dice' && (
        <ToolLayout
          title="Dice Roller"
          onSubmit={() => {
            const rolled = rollExpression(diceForm);
            setDice(rolled);
          }}
          controls={
            <DiceForm
              form={diceForm}
              setForm={setDiceForm}
            />
          }
          output={<DiceOutput dice={dice} />}
        />
      )}

      <section className={styles.actionBar} aria-label="Record actions">
        <button className={styles.secondaryAction} type="button" onClick={downloadMarkdown}>
          Download as Markdown
        </button>
        <button className={styles.secondaryAction} type="button" onClick={copyShareLink}>
          Copy Share Link
        </button>
        {message ? <p className={styles.message}>{message}</p> : null}
      </section>
    </main>
  );
}

function ToolLayout({ title, controls, output, onSubmit }) {
  return (
    <section className={styles.generator} aria-label={title}>
      <form
        className={styles.controls}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div>
          <p className={styles.kicker}>Active module</p>
          <h2>{title}</h2>
        </div>
        {controls}
      </form>
      <section className={styles.output} aria-live="polite">{output}</section>
    </section>
  );
}

function CharacterLayout({ title, controls, output, onSubmit, controlsOpen, setControlsOpen }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <section className={styles.characterWorkspace} aria-label={title}>
      <form
        className={`${styles.characterControls} ${controlsOpen ? '' : styles.collapsedControls}`}
        onSubmit={handleSubmit}
      >
        <div className={styles.controlsHeader}>
          <div>
            <p className={styles.kicker}>Primary generator</p>
            <h2>{title}</h2>
          </div>
          <div className={styles.controlsActions}>
            {!controlsOpen ? (
              <button className={styles.primaryAction} type="submit">
                Generate New Character
              </button>
            ) : null}
            <button
              className={styles.secondaryAction}
              type="button"
              onClick={() => setControlsOpen(!controlsOpen)}
            >
              {controlsOpen ? 'Hide Controls' : 'Edit Controls'}
            </button>
          </div>
        </div>
        {controlsOpen ? controls : null}
      </form>
      <section className={styles.output} aria-live="polite">{output}</section>
    </section>
  );
}

function UppForm({ form, setForm, onSubmit }) {
  return (
    <>
      <Select label="Generation method" value={form.method} onChange={(method) => setForm({ ...form, method })} options={STAT_METHODS.map((o) => [o.value, `${o.label} (${o.description})`])} />
      <Select label="Psionics mode" value={form.psi} onChange={(psi) => setForm({ ...form, psi })} options={PSI_OPTIONS.map((o) => [o.value, o.label])} />
      <Input label="Hex seed" value={form.seed} placeholder="Auto-generate" onChange={(seed) => setForm({ ...form, seed })} />
      <button className={styles.primaryAction} type="submit">Generate New UPP</button>
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
      <Input label="Name" value={form.name} placeholder="Auto-generate" onChange={(name) => set({ name })} />
      <Select label="Gender" value={form.gender} onChange={(gender) => set({ gender })} options={[['', 'Random'], ...GENDERS.map((v) => [v, v])]} />
      <Select label="Ethnicity" value={form.ethnicity} onChange={(ethnicity) => set({ ethnicity })} options={[['', 'Random'], ...ETHNICITIES.map((v) => [v, v])]} />
      <Select label="Homeworld" value={form.homeworld} onChange={(homeworld) => set({ homeworld })} options={[['', 'Random'], ...WORLDS.map((v) => [v, v])]} />
      <Select label="Method" value={form.method} onChange={(method) => set({ method })} options={STAT_METHODS.map((o) => [o.value, o.label])} />
      <Select label="Psi" value={form.psi} onChange={(psi) => set({ psi })} options={PSI_OPTIONS.map((o) => [o.value, o.label])} />
      <Input label="Fixed UPP" value={form.upp} placeholder="Optional, e.g. 777777" onChange={(upp) => set({ upp })} />
      <Input label="Terms" type="number" value={form.terms} onChange={(terms) => set({ terms })} />
      <Input label="Hex seed" value={form.seed} placeholder="Auto-generate" onChange={(seed) => set({ seed })} />
      <Checkbox label="Randomize age" checked={form.randAge} onChange={(randAge) => set({ randAge })} />
      <Checkbox label="Personality" checked={form.personality} onChange={(personality) => set({ personality })} />
      <Checkbox label="Show history" checked={form.showHistory} onChange={(showHistory) => set({ showHistory })} />
      <fieldset className={styles.fieldset}>
        <legend>Career plan</legend>
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
      </fieldset>
      <fieldset className={styles.fieldset}>
        <legend>Expansions</legend>
        {CAREER_EXPANSIONS.map((expansion) => (
          <Checkbox
            key={expansion.key}
            label={expansion.label}
            checked={Boolean(form.expansions[expansion.key])}
            onChange={(checked) => set({ expansions: { ...form.expansions, [expansion.key]: checked } })}
          />
        ))}
      </fieldset>
      <button className={styles.primaryAction} type="submit">Generate New Character</button>
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
      <button className={styles.primaryAction} type="submit">Generate New Animal</button>
    </>
  );
}

function DiceForm({ form, setForm }) {
  return (
    <>
      <Input label="Dice" value={form.expression} placeholder="2d6" onChange={(expression) => setForm({ ...form, expression })} />
      <Input label="Hex seed" value={form.seed} placeholder="Auto-generate" onChange={(seed) => setForm({ ...form, seed })} />
      <button className={styles.primaryAction} type="submit">Roll Again</button>
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
    <>
      <ResultHeader label={character.name} value={character.upp} seed={character.seed} />
      <p className={styles.recordLine}>{character.gender} {character.ethnicity}, age {character.age}, homeworld {character.homeworld}</p>
      <div className={styles.pathList}>{character.careerPath.map((item) => <span key={`${item.career}-${item.spec}`}>{item.career} / {item.spec} / Rank {item.rank}</span>)}</div>
      <StatGrid stats={character.stats} />
      <KeyValue title="Skills" items={character.skills} />
      {showHistory ? <CareerHistory character={character} /> : null}
    </>
  );
}

function CareerHistory({ character }) {
  const rows = character.terms;
  const events = character.history.filter((line) => !['BACKGROUND'].includes(line) && !line.startsWith('TERM'));
  return (
    <section className={styles.historyPanel} aria-label="Career history">
      <div>
        <p className={styles.kicker}>Career history</p>
        <h3>Service Ledger</h3>
      </div>
      <div className={styles.historyTableWrap}>
        <table className={styles.historyTable}>
          <thead>
            <tr>
              <th>Term</th>
              <th>Assignment</th>
              <th>Qual</th>
              <th>Surv</th>
              <th>Adv</th>
              <th>Rank</th>
              <th>Event</th>
              <th>Age</th>
              <th>Benefit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((term) => (
              <tr key={term.T}>
                <td>{term.T + 1}</td>
                <td>{term.Career}<span>{term.Spec}</span></td>
                <td>{statusMark(term.Q)}</td>
                <td>{statusMark(term.S)}</td>
                <td>{statusMark(term.A)}</td>
                <td>{term.Rnk}</td>
                <td>{term.EM}</td>
                <td>{term.Age}</td>
                <td>{term.Ben}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ol className={styles.historyEvents}>
        {events.map((line, index) => <li key={`${line}-${index}`}>{line.trim()}</li>)}
      </ol>
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

function ResultHeader({ label, value, seed }) {
  return (
    <div className={styles.resultHeader}>
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
  const careerPath = character.careerPath
    .map((item) => `- ${item.career} (${item.spec}), Rank ${item.rank}`)
    .join('\n');
  const benefits = [
    character.credits ? `${character.credits} Cr.` : '',
    ...character.benefits,
  ].filter(Boolean);
  const history = showHistory
    ? `\n\n## Career History\n\n${formatTerms(character.terms)}\n\n${character.history.map((line) => `- ${line.trim()}`).join('\n')}`
    : '';

  return `# ${character.name}

- Gender: ${character.gender}
- Ethnicity: ${character.ethnicity}
- Homeworld: ${character.homeworld}
- Age: ${character.age}
- UPP: ${character.upp} [${character.average.toFixed(1)}]
- Seed: ${character.seed}

## Career Path

${careerPath}

## Skills

${skills || '- None'}

## Benefits

${benefits.length ? benefits.map((benefit) => `- ${benefit}`).join('\n') : '- None'}${history}
`;
}

function formatTerms(terms) {
  return terms.map((term) => Object.entries(term).map(([key, value]) => `${key}:${value ?? '-'}`).join('  ')).join('\n');
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

function statusMark(value) {
  if (value === true) return 'Y';
  if (value === false) return 'N';
  return '-';
}

export default App;
