import type { QuestionTier } from '../types';

// Each ladder is a complete 15-question game, ordered by descending "percent"
// (the % of the original 100 pretend contestants who answered correctly) —
// matching the real show's actual difficulty curve: 90, 80, 70, 60, 50, 45,
// 40, 35, 30, 25, 20, 15, 10, 5, 1. Exactly 4 options per tier, correctIndex
// must point at the right one, and each ladder must stay sorted from highest
// percent to lowest.
//
// Content is themed after the Australian version of the show (Seven
// Network) — Australian geography, culture, slang, and spelling where
// natural, mixed with the logic/wordplay riddles that are the format's real
// backbone in every version. A few tiers are adapted from real Australian
// episode questions (noted inline) where they translate cleanly to this
// game's 4-option multiple-choice format; several real AU questions rely on
// on-screen graphics (clock codes, dartboard diagrams) that don't translate
// and were skipped.
//
// `classicLadders` holds every local (offline) ladder. game.ts picks one at
// random by default for a fresh local game, and SetupScreen lets the host
// pick one explicitly instead. Add a new ladder here to grow the pool.

const ladderA: QuestionTier[] = [
  {
    percent: 90,
    prompt: 'Which of these is an Australian native animal?',
    options: ['Koala', 'Panda', 'Raccoon', 'Hedgehog'],
    correctIndex: 0,
  },
  {
    percent: 80,
    prompt: 'What is 6 × 9?',
    options: ['45', '54', '56', '64'],
    correctIndex: 1,
  },
  {
    percent: 70,
    prompt: 'What do Australians usually call a flip-flop sandal?',
    options: ['Jandals', 'Thongs', 'Slides', 'Clogs'],
    correctIndex: 1,
  },
  {
    percent: 60,
    prompt: 'We ___ heading to the beach this arvo. Which word correctly completes the sentence?',
    options: ['was', 'is', 'are', 'be'],
    correctIndex: 2,
  },
  {
    percent: 50,
    prompt: 'A word becomes longer when you add two letters to it, but the word itself means the opposite of long. What is the word?',
    options: ['Short', 'Tall', 'Big', 'Wide'],
    correctIndex: 0,
  },
  {
    percent: 45,
    prompt: 'If a red house is made of red bricks and a blue house is made of blue bricks, what is a greenhouse made of?',
    options: ['Green bricks', 'Glass', 'Wood', 'Concrete'],
    correctIndex: 1,
  },
  {
    percent: 40,
    prompt: 'How many Australian states are there, plus the mainland territories (the NT and the ACT)?',
    options: ['6', '7', '8', '9'],
    correctIndex: 2,
  },
  {
    percent: 35,
    prompt: "Rearrange the letters of 'LISTEN' to form another common English word.",
    options: ['SILENT', 'LOTUS', 'PLANET', 'GARDEN'],
    correctIndex: 0,
  },
  {
    // Adapted from a real 1% Club Australia question (Season 3): the
    // Matildas score every 6 minutes starting at minute 6, across two
    // 45-minute halves — 7 goals per half, 14 total.
    percent: 30,
    prompt: 'In a Matildas match, their star striker scores a goal 6 minutes into each half, then every 6 minutes after that. Across two 45-minute halves, how many goals does she score?',
    options: ['12', '13', '14', '16'],
    correctIndex: 2,
  },
  {
    percent: 25,
    prompt: 'What comes next in this sequence: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '36', '44'],
    correctIndex: 1,
  },
  {
    percent: 20,
    prompt: "Rearrange the letters of 'ELVIS' to name something you might find in a church.",
    options: ['LIVES', 'VEILS', 'LEVIS', 'SLIVE'],
    correctIndex: 1,
  },
  {
    percent: 15,
    prompt: 'Multiply this number by any other number and the answer is always the same. What is the number?',
    options: ['One', 'Zero', 'Ten', 'Two'],
    correctIndex: 1,
  },
  {
    percent: 10,
    prompt: "Rearrange the letters of 'ASTRONOMER' to name a word for someone who watches the night sky.",
    options: ['MOONSTARER', 'STARGAZER', 'SKYWATCHER', 'NIGHTSEER'],
    correctIndex: 0,
  },
  {
    percent: 5,
    prompt: 'Divide 30 by half, then add 10. What do you get?',
    options: ['25', '40', '60', '70'],
    correctIndex: 3,
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
    percent: 90,
    prompt: 'Which of these is a native Australian bird?',
    options: ['Penguin', 'Kookaburra', 'Peacock', 'Ostrich'],
    correctIndex: 1,
  },
  {
    percent: 80,
    prompt: 'What is 8 × 7?',
    options: ['54', '56', '63', '64'],
    correctIndex: 1,
  },
  {
    percent: 70,
    prompt: "What is Australia's largest state by land area?",
    options: ['New South Wales', 'Queensland', 'Western Australia', 'Victoria'],
    correctIndex: 2,
  },
  {
    percent: 60,
    prompt: 'By the time we got there, the shop ___ already closed. Which word correctly completes the sentence?',
    options: ['has', 'have', 'had', 'having'],
    correctIndex: 2,
  },
  {
    percent: 50,
    prompt: 'A number that reads the same forwards and backwards is called a ___.',
    options: ['Prime', 'Palindrome', 'Fibonacci', 'Composite'],
    correctIndex: 1,
  },
  {
    percent: 45,
    prompt: 'What is the next number in this sequence: 1, 1, 2, 3, 5, 8, ?',
    options: ['11', '12', '13', '10'],
    correctIndex: 2,
  },
  {
    percent: 40,
    prompt: 'How many minutes are there in exactly two and a half hours?',
    options: ['120', '150', '140', '160'],
    correctIndex: 1,
  },
  {
    // A real 1% Club Australia question (Season 3): the classic riddle where
    // the sixth child shares the mother's — and the riddler's — own name.
    percent: 35,
    prompt: "Mary's mother has six children: April, May, June, July, August, and who?",
    options: ['September', 'Rose', 'Autumn', 'Mary'],
    correctIndex: 3,
  },
  {
    percent: 30,
    prompt: 'I have branches, but no fruit, trunk, or leaves. What am I?',
    options: ['A river', 'A bank', 'A tree', 'A road'],
    correctIndex: 1,
  },
  {
    percent: 25,
    prompt: 'What has a face and two hands but no arms or legs?',
    options: ['A statue', 'A doll', 'A clock', 'A robot'],
    correctIndex: 2,
  },
  {
    percent: 20,
    prompt: 'What can travel around the world while staying in a corner?',
    options: ['A shadow', 'A stamp', 'A map', 'A compass'],
    correctIndex: 1,
  },
  {
    percent: 15,
    prompt: 'What has to be broken before you can use it?',
    options: ['A promise', 'An egg', 'A record', 'A seal'],
    correctIndex: 1,
  },
  {
    percent: 10,
    prompt: "The person who makes it, sells it. The person who buys it never uses it. The person who uses it never knows they're using it. What is it?",
    options: ['A coffin', 'A candle', 'A ticket', 'A gift'],
    correctIndex: 0,
  },
  {
    percent: 5,
    prompt: "A father's age is 5 times his son's age. In 6 years, he will be 3 times as old. How old is the son now?",
    options: ['4', '5', '6', '8'],
    correctIndex: 2,
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
    percent: 90,
    prompt: 'What is the capital city of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correctIndex: 2,
  },
  {
    percent: 80,
    prompt: 'What is 12 + 15?',
    options: ['25', '26', '27', '28'],
    correctIndex: 2,
  },
  {
    percent: 70,
    prompt: "What is the large red rock formation in the Northern Territory, one of Australia's most iconic landmarks?",
    options: ['Uluru', 'Kakadu', 'The Kimberley', 'The Blue Mountains'],
    correctIndex: 0,
  },
  {
    percent: 60,
    prompt: 'There ___ three kangaroos in the paddock. Which word correctly completes the sentence?',
    options: ['is', 'was', 'are', 'be'],
    correctIndex: 2,
  },
  {
    percent: 50,
    prompt: 'What do you call a shape with three sides?',
    options: ['Square', 'Pentagon', 'Hexagon', 'Triangle'],
    correctIndex: 3,
  },
  {
    percent: 45,
    prompt: 'What is the next number in this sequence: 3, 6, 9, 12, ?',
    options: ['14', '15', '16', '18'],
    correctIndex: 1,
  },
  {
    percent: 40,
    prompt: 'Which sport is the Melbourne Cup associated with?',
    options: ['Horse racing', 'Cricket', 'Rugby league', 'Sailing'],
    correctIndex: 0,
  },
  {
    percent: 35,
    prompt: 'What has one eye but cannot see?',
    options: ['A cyclops', 'A needle', 'A potato', 'A storm'],
    correctIndex: 1,
  },
  {
    percent: 30,
    prompt: 'What goes up but never comes down?',
    options: ['A balloon', 'Your age', 'A kite', 'Smoke'],
    correctIndex: 1,
  },
  {
    percent: 25,
    prompt: 'What can you catch but not throw?',
    options: ['A ball', 'A fish', 'A cold', 'A frisbee'],
    correctIndex: 2,
  },
  {
    percent: 20,
    prompt: 'What has a neck but no head?',
    options: ['A bottle', 'A guitar', 'A shirt', 'A giraffe'],
    correctIndex: 0,
  },
  {
    percent: 15,
    prompt: 'What English word contains all five vowels — a, e, i, o, u — in order?',
    options: ['Facetious', 'Beautiful', 'Questionable', 'Mysterious'],
    correctIndex: 0,
  },
  {
    percent: 10,
    prompt: 'What is the only number whose name has the same number of letters as its value?',
    options: ['Three', 'Four', 'Five', 'Seven'],
    correctIndex: 1,
  },
  {
    percent: 5,
    prompt: "How many times do a clock's hour and minute hands overlap in a 12-hour period?",
    options: ['10', '11', '12', '24'],
    correctIndex: 1,
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
    description: 'Aussie wordplay, maths, and a couple of classic riddles at the top.',
    tiers: ladderA,
  },
  {
    name: 'Riddles & Reasoning',
    description: 'Australian general knowledge that gives way to logic riddles.',
    tiers: ladderB,
  },
  {
    name: 'Quick Trivia',
    description: 'Easy Aussie trivia early, brain teasers for the last few rungs.',
    tiers: ladderC,
  },
];

// Kept for any caller that just wants a single default ladder.
export const questions: QuestionTier[] = ladderA;
