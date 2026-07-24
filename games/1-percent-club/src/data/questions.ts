import type { QuestionTier } from '../types';

// Tiers are ordered by descending "percent" — the % of the original 100
// pretend contestants who answered correctly. Exactly 4 options per tier,
// correctIndex must point at the right one. Add tiers here to extend the
// ladder (keep it sorted from highest percent to lowest).
export const questions: QuestionTier[] = [
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
