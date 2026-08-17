// Break-room small-talk for the Planet Express HQ floor.
//
// The scene still calls these "cafeteria" hooks internally, but the visible
// copy is now about crew breaks, Slurm runs, dispatch boards, and ship upkeep.

import type { CharacterName } from './cast';

export type BreakSpot = 'coffee' | 'vending' | 'snack' | 'table';

const pick = <T,>(arr: readonly T[], seed: number): T =>
  arr[((seed % arr.length) + arr.length) % arr.length];

const COFFEE: readonly string[] = [
  'Slurm first. thought second.',
  'is this the emergency dispenser?',
  'one more cup for launch prep',
  'the machine is making science noises',
  'hydration counts as logistics',
  'who labeled this "probably safe"?',
];

const VENDING: readonly string[] = [
  'the snack coil is negotiating',
  'B4 looks structurally suspicious',
  'machine took my dollar and filed it',
  'that counts as lunch, right?',
  'emotional-support packet acquired',
  'gently shaking company property',
];

const SNACK: readonly string[] = [
  'cargo snacks are still snacks',
  'manifest says these are "crew morale"',
  'saving the last packet for future me',
  'this tastes like a risk assessment',
  'briefing calories do not count',
];

const TABLE: readonly string[] = [
  'dispatch board looks spicy today',
  'five quiet minutes before liftoff',
  'the ship is probably fine',
  'do not tell the Professor I am in here',
  'crew meeting or snack meeting?',
  'I needed this break, honestly',
];

const SPOT_POOL: Record<BreakSpot, readonly string[]> = {
  coffee: COFFEE,
  vending: VENDING,
  snack: SNACK,
  table: TABLE,
};

const BY_CHARACTER: Partial<Record<CharacterName, readonly string[]>> = {
  'professor-farnsworth': [
    'good news, everyone. probably.',
    'the engine hummed ominously. excellent.',
    'crew morale is a measurable substance.',
  ],
  leela: [
    'run checklist, then improvise',
    'the route is bad. we leave anyway.',
    'someone please fuel the ship correctly',
  ],
  fry: [
    'future snacks still taste like snacks',
    'I can deliver that. maybe.',
    'is this regular Slurm or important Slurm?',
  ],
  bender: [
    'break time is a civil right',
    'I bent that deadline emotionally',
    'this vending machine respects me',
  ],
  hermes: [
    'forms before liftoff',
    'that manifest needs a stamp',
    'bureaucracy makes the universe go round',
  ],
  amy: [
    'the scanner is only a little sparky',
    'I fixed it. mostly.',
    'interning: still legally vague',
  ],
  zoidberg: [
    'is this food unattended?',
    'hooray, a break for Zoidberg',
    'the crew is medically interesting',
  ],
  scruffy: [
    'Scruffy is on break',
    'ship will hold',
    'mop bucket has seen things',
  ],
};

export function pickSoloLine(character: CharacterName, spot: BreakSpot, seed: number): string {
  const flavour = BY_CHARACTER[character];
  if (flavour && seed % 5 < 3) return pick(flavour, Math.floor(seed / 5));
  return pick(SPOT_POOL[spot], seed);
}

type Exchange = readonly string[];

const EXCHANGES: readonly Exchange[] = [
  ['delivery manifest says "urgent".', 'that means expensive.', 'good enough.'],
  ['is the ship fueled?', 'define fueled.', 'I dislike that answer.'],
  ['who moved the caution cones?', 'they looked decorative.', 'they were load-bearing.'],
  ['the board has six new jobs.', 'that sounds profitable.', 'it sounds loud.'],
  ['did the Professor approve this?', 'he said "interesting".', 'so no.'],
  ['the vending machine blinked at me.', 'blink back.', 'power move.'],
  ['crew meeting in five.', 'is food provided?', 'morale is provided.'],
  ['that crate is ticking.', 'scheduled ticking?', 'checking the manifest.'],
  ['I tightened the bolt.', 'which bolt?', 'the memorable one.'],
  ['we need a plan.', 'we have a ship.', 'that is not a plan.'],
  ['Slurm run?', 'for hydration?', 'for courage.'],
  ['the route crosses a meteor field.', 'again?', 'meteor fields have great availability.'],
  ['who owns this wrench?', 'the wrench owns itself.', 'fair.'],
  ['launch window is open.', 'actual window or schedule window?', 'yes.'],
  ['did anyone read the delivery notes?', 'I skimmed the dangerous words.', 'efficient.'],
  ['status report?', 'green-ish.', 'acceptable-ish.'],
  ['the hangar smells like ozone.', 'that means science happened.', 'or a cable failed.'],
  ['should we tell Farnsworth?', 'after it stops smoking.', 'wise.'],
  ['crew morale is up.', 'how do you know?', 'snacks are down.'],
  ['that console beeped twice.', 'friendly beeps?', 'bureaucratic beeps.'],
];

const KEYED_EXCHANGES: Partial<Record<CharacterName, Exchange>> = {
  'professor-farnsworth': ['good news, everyone.', 'why do I feel nervous?', 'experience.'],
  leela: ['check the route twice.', 'and if it is still bad?', 'we fly better.'],
  fry: ['I found future chips.', 'those are cargo samples.', 'found cargo chips.'],
  bender: ['I improved morale.', 'you stole snacks.', 'morale improved.'],
  hermes: ['file the incident report.', 'incident?', 'pre-filing saves time.'],
  amy: ['the engine is calibrated.', 'why is it sparkling?', 'calibrated sparkle.'],
  zoidberg: ['I can perform the inspection.', 'medical or mechanical?', 'yes.'],
  scruffy: ['Scruffy fixed the leak.', 'what leak?', 'exactly.'],
};

export function pickExchange(speaker: CharacterName, seed: number): Exchange {
  const keyed = KEYED_EXCHANGES[speaker];
  if (keyed && seed % 4 === 0) return keyed;
  return pick(EXCHANGES, seed);
}
