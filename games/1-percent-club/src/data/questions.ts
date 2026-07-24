import type { QuestionTier } from '../types';

// Each ladder is a complete 12-question game, ordered by descending "percent"
// (the % of the original 100 pretend contestants who answered correctly).
// Exactly 4 options per tier, correctIndex must point at the right one, and
// each ladder must stay sorted from highest percent to lowest.
//
// `classicLadders` holds every local (offline) ladder. game.ts picks one at
// random by default for a fresh local game, and SetupScreen lets the host
// pick one explicitly instead. Add a new ladder here to grow the pool.

const ladderA: QuestionTier[] = [
  {
    percent: 92,
    prompt: 'Which of these is a primary color?',
    options: ['Green', 'Purple', 'Red', 'Orange'],
    correctIndex: 2,
  },
  {
    percent: 82,
    prompt: 'What is 7 × 8?',
    options: ['54', '56', '58', '64'],
    correctIndex: 1,
  },
  {
    percent: 71,
    prompt: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctIndex: 1,
  },
  {
    percent: 61,
    prompt: "Yesterday, I ___ across the lake. Which word correctly completes the sentence?",
    options: ['Swam', 'Swum', 'Sweamed', 'Swimmed'],
    correctIndex: 0,
  },
  {
    percent: 52,
    prompt: 'A word becomes longer when you add two letters to it, but the word itself means the opposite of long. What is the word?',
    options: ['Short', 'Tall', 'Big', 'Wide'],
    correctIndex: 0,
  },
  {
    percent: 44,
    prompt: 'If a red house is made of red bricks and a blue house is made of blue bricks, what is a greenhouse made of?',
    options: ['Green bricks', 'Glass', 'Wood', 'Concrete'],
    correctIndex: 1,
  },
  {
    percent: 36,
    prompt: 'How many sides does a hexagon have, plus the number of sides a triangle has?',
    options: ['8', '9', '10', '7'],
    correctIndex: 1,
  },
  {
    percent: 28,
    prompt: "Rearrange the letters of 'LISTEN' to form another common English word.",
    options: ['SILENT', 'LOTUS', 'PLANET', 'GARDEN'],
    correctIndex: 0,
  },
  {
    percent: 20,
    prompt: 'What comes next in this sequence: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '36', '44'],
    correctIndex: 1,
  },
  {
    percent: 12,
    prompt: "A man looks at a portrait and says: \"Brothers and sisters I have none, but that man's father is my father's son.\" Who is in the portrait?",
    options: ['His son', 'His father', 'Himself', 'His nephew'],
    correctIndex: 0,
  },
  {
    percent: 6,
    prompt: "Rearrange the letters of 'ELVIS' to name something you might find in a church.",
    options: ['LIVES', 'VEILS', 'LEVIS', 'SLIVE'],
    correctIndex: 1,
  },
  {
    percent: 1,
    prompt: 'I am an odd number. Take away one letter and I become even. What number am I?',
    options: ['Seven', 'Three', 'Five', 'Nine'],
    correctIndex: 0,
  },
];

const ladderB: QuestionTier[] = [
  {
    percent: 92,
    prompt: 'Which of these is technically a fruit?',
    options: ['Carrot', 'Potato', 'Tomato', 'Broccoli'],
    correctIndex: 2,
  },
  {
    percent: 82,
    prompt: 'What is 9 × 6?',
    options: ['45', '54', '63', '56'],
    correctIndex: 1,
  },
  {
    percent: 71,
    prompt: 'Which is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correctIndex: 3,
  },
  {
    percent: 61,
    prompt: 'By the time we arrived, the movie ___ already started. Which word correctly completes the sentence?',
    options: ['has', 'have', 'had', 'having'],
    correctIndex: 2,
  },
  {
    percent: 52,
    prompt: 'A number that reads the same forwards and backwards is called a ___.',
    options: ['Prime', 'Palindrome', 'Fibonacci', 'Composite'],
    correctIndex: 1,
  },
  {
    percent: 44,
    prompt: 'What is the next number in this sequence: 1, 1, 2, 3, 5, 8, ?',
    options: ['11', '12', '13', '10'],
    correctIndex: 2,
  },
  {
    percent: 36,
    prompt: 'How many minutes are there in exactly two and a half hours?',
    options: ['120', '150', '140', '160'],
    correctIndex: 1,
  },
  {
    percent: 28,
    prompt: 'I have branches, but no fruit, trunk, or leaves. What am I?',
    options: ['A river', 'A bank', 'A tree', 'A road'],
    correctIndex: 1,
  },
  {
    percent: 20,
    prompt: 'The more you take, the more you leave behind. What am I?',
    options: ['Time', 'Memories', 'Footsteps', 'Money'],
    correctIndex: 2,
  },
  {
    percent: 12,
    prompt: 'What has a face and two hands but no arms or legs?',
    options: ['A statue', 'A doll', 'A clock', 'A robot'],
    correctIndex: 2,
  },
  {
    percent: 6,
    prompt: 'What can travel around the world while staying in a corner?',
    options: ['A shadow', 'A stamp', 'A map', 'A compass'],
    correctIndex: 1,
  },
  {
    percent: 1,
    prompt: 'What has keys but no locks, space but no room, and you can enter but not go inside?',
    options: ['A house', 'A piano', 'A keyboard', 'A safe'],
    correctIndex: 2,
  },
];

const ladderC: QuestionTier[] = [
  {
    percent: 92,
    prompt: 'How many days are there in a week?',
    options: ['5', '6', '7', '8'],
    correctIndex: 2,
  },
  {
    percent: 82,
    prompt: 'What is 12 + 15?',
    options: ['25', '26', '27', '28'],
    correctIndex: 2,
  },
  {
    percent: 71,
    prompt: 'Which planet do we live on?',
    options: ['Mars', 'Venus', 'Earth', 'Jupiter'],
    correctIndex: 2,
  },
  {
    percent: 61,
    prompt: 'There ___ three books on the table. Which word correctly completes the sentence?',
    options: ['is', 'was', 'are', 'be'],
    correctIndex: 2,
  },
  {
    percent: 52,
    prompt: 'What do you call a shape with three sides?',
    options: ['Square', 'Pentagon', 'Hexagon', 'Triangle'],
    correctIndex: 3,
  },
  {
    percent: 44,
    prompt: 'What is the next number in this sequence: 3, 6, 9, 12, ?',
    options: ['14', '15', '16', '18'],
    correctIndex: 1,
  },
  {
    percent: 36,
    prompt: 'What gets wetter the more it dries?',
    options: ['A sponge', 'A cloud', 'A towel', 'A river'],
    correctIndex: 2,
  },
  {
    percent: 28,
    prompt: 'What has one eye but cannot see?',
    options: ['A cyclops', 'A needle', 'A potato', 'A storm'],
    correctIndex: 1,
  },
  {
    percent: 20,
    prompt: 'What goes up but never comes down?',
    options: ['A balloon', 'Your age', 'A kite', 'Smoke'],
    correctIndex: 1,
  },
  {
    percent: 12,
    prompt: 'What can you catch but not throw?',
    options: ['A ball', 'A fish', 'A cold', 'A frisbee'],
    correctIndex: 2,
  },
  {
    percent: 6,
    prompt: 'What has a neck but no head?',
    options: ['A bottle', 'A guitar', 'A shirt', 'A giraffe'],
    correctIndex: 0,
  },
  {
    percent: 1,
    prompt: 'The more of this there is, the less you can see. What is it?',
    options: ['Light', 'Fog', 'Darkness', 'Smoke'],
    correctIndex: 2,
  },
];

export interface ClassicLadder {
  name: string;
  description: string;
  tiers: QuestionTier[];
}

export const classicLadders: ClassicLadder[] = [
  {
    name: 'Word & Number Mix',
    description: 'Wordplay, math, and a couple of classic riddles at the top.',
    tiers: ladderA,
  },
  {
    name: 'Riddles & Reasoning',
    description: 'General knowledge that gives way to logic riddles.',
    tiers: ladderB,
  },
  {
    name: 'Quick Trivia',
    description: 'Easy trivia early, brain teasers for the last few rungs.',
    tiers: ladderC,
  },
];

// Kept for any caller that just wants a single default ladder.
export const questions: QuestionTier[] = ladderA;
