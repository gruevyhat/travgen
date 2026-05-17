import { choice, sample } from './helpers.js';
import { createRng, normalizeSeed } from './random.js';

const PATRONS = [
  'Merchant Factor', 'Imperial Scout', 'Minor Noble', 'Corporate Executive',
  'Intelligence Operative', 'Retired Military Officer', 'Starport Administrator',
  'Planetary Governor', 'Crime Boss', 'Research Scientist', 'Religious Leader',
  'Privateer Captain', 'Diplomat', 'Journalist', 'Salvage Operator',
  'Ship Broker', 'Underworld Fixer', 'Imperial Bureaucrat',
];

const MISSIONS = [
  'retrieve a stolen artifact', 'deliver a sealed package', 'escort a VIP to safety',
  'investigate a disappearance', 'recover a derelict vessel', 'negotiate a trade agreement',
  'infiltrate a rival organization', 'survey an uncharted system', 'break someone out of custody',
  'prevent an assassination', 'smuggle contraband past customs', 'locate a missing person',
  'secure a piece of military hardware', 'establish contact with an alien faction',
  'transport a group of refugees', 'destroy sensitive evidence', 'plant false intelligence',
  'acquire a rare biological specimen', 'broker a peace between factions',
  'sabotage a competitor\'s operation',
];

const LOCATIONS = [
  'a backwater starport', 'a remote frontier outpost', 'a derelict orbital station',
  'a dense urban arcology', 'an asteroid mining colony', 'a high-tech research station',
  'a remote planetary wilderness', 'a corporate headquarters', 'a naval installation',
  'a prison facility', 'a religious compound', 'a black market bazaar',
  'a terraforming station', 'a diplomatic enclave', 'an alien ruin',
  'a gas giant refueling platform', 'a passenger liner', 'an underground bunker',
];

const ANTAGONISTS = [
  'Pirate crew', 'Corporate security forces', 'Imperial agents', 'Criminal syndicate',
  'Rival mercenary team', 'Corrupt local officials', 'Alien faction', 'Rogue AI system',
  'Religious extremists', 'Separatist militia', 'Bounty hunters', 'Navy patrol',
  'Mercantile guild enforcers', 'Psionic cult',
];

const COMPLICATIONS = [
  'The timeline is shorter than initially stated',
  'A trusted contact turns out to be working for the opposition',
  'The target location has been placed under lock-down',
  'Key equipment fails at a critical moment',
  'An unexpected third party has the same objective',
  'Local law enforcement becomes actively involved',
  'The patron\'s true motive becomes apparent mid-mission',
  'A team member has an undisclosed personal history with the antagonist',
  'The original objective turns out to be a decoy',
  'An environmental hazard disrupts the operation',
  'A civilian in the wrong place must be protected or evaded',
  'Communications are jammed at a critical moment',
  'The extraction route has been compromised',
  'Evidence surfaces that the patron is not who they claim to be',
  'Payment is contingent on a secondary condition not mentioned upfront',
];

const REWARDS = [
  'a cash payment on completion', 'free passage out of the system', 'a block of ship shares',
  'a political favor from a powerful figure', 'access to restricted equipment',
  'an intelligence dossier worth more than the fee', 'safe house credentials on three worlds',
  'naval clearance codes for a restricted zone', 'a forgiven debt or legal record',
  'title to a small property on an agricultural world',
];

const TWISTS = [
  'The patron is actually working against the stated client',
  'The objective already exists elsewhere — this one is a copy or a decoy',
  'One of the apparent antagonists is themselves a victim',
  'The real prize is concealed inside the stated one',
  'Someone on the team has been compromised before the job starts',
  'Completing the job will make a new, more dangerous enemy',
  'A previous job resurfaces as an obstacle',
  'The antagonist offers better terms than the patron',
  'The target is sentient and has its own agenda',
  'Success requires breaking a promise the team made elsewhere',
];

export function generateAdventure(options = {}) {
  const seed = normalizeSeed(options.seed);
  const rng = createRng(seed);

  const patron = choice(rng, PATRONS);
  const mission = choice(rng, MISSIONS);
  const location = choice(rng, LOCATIONS);
  const antagonist = choice(rng, ANTAGONISTS);
  const complications = sample(rng, COMPLICATIONS, 2);
  const reward = choice(rng, REWARDS);
  const twist = choice(rng, TWISTS);

  const hook = `${patron} hires the crew to ${mission} at ${location}. ${antagonist} stand in the way.`;

  return {
    seed,
    patron,
    mission,
    location,
    antagonist,
    complications,
    reward,
    twist,
    hook,
  };
}
