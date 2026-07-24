import type { Category } from '../types';

// Each category should have exactly 8 answers (descending by points) to
// keep the board layout consistent. Add your own rounds here.
export const rounds: Category[] = [
  {
    name: 'Things You Do Right Before Bed',
    answers: [
      { text: 'Brush your teeth', points: 32 },
      { text: 'Check your phone one last time', points: 24 },
      { text: 'Set an alarm', points: 16 },
      { text: 'Use the bathroom', points: 10 },
      { text: 'Lock the doors', points: 8 },
      { text: 'Turn off the lights', points: 5 },
      { text: 'Say goodnight to someone', points: 3 },
      { text: 'Read a book', points: 2 },
    ],
  },
  {
    name: 'Things People Are Afraid Of',
    answers: [
      { text: 'Spiders', points: 28 },
      { text: 'Heights', points: 22 },
      { text: 'Public speaking', points: 18 },
      { text: 'The dark', points: 12 },
      { text: 'Snakes', points: 9 },
      { text: 'Death', points: 6 },
      { text: 'Clowns', points: 3 },
      { text: 'Needles', points: 2 },
    ],
  },
  {
    name: "Reasons You'd Call In Sick to Work",
    answers: [
      { text: 'Actually sick', points: 30 },
      { text: 'Hungover', points: 20 },
      { text: 'Mental health day', points: 16 },
      { text: 'Overslept', points: 12 },
      { text: 'Family emergency', points: 10 },
      { text: 'Car trouble', points: 6 },
      { text: "Just didn't feel like it", points: 4 },
      { text: "Doctor's appointment", points: 2 },
    ],
  },
  {
    name: 'Things You Find in a Junk Drawer',
    answers: [
      { text: 'Batteries', points: 26 },
      { text: 'Old rubber bands', points: 20 },
      { text: 'Random keys', points: 17 },
      { text: 'Tape or scissors', points: 13 },
      { text: 'Loose change', points: 10 },
      { text: 'Takeout menus', points: 7 },
      { text: 'Dead pens', points: 5 },
      { text: 'A screwdriver', points: 2 },
    ],
  },
  {
    name: 'Things That Get Funnier the More You Say Them',
    answers: [
      { text: 'A silly nickname', points: 27 },
      { text: 'An inside joke', points: 23 },
      { text: 'A weird word', points: 18 },
      { text: 'Your own name', points: 13 },
      { text: 'A funny accent', points: 9 },
      { text: 'A made-up song', points: 5 },
      { text: 'A pun', points: 3 },
      { text: 'A cuss word', points: 2 },
    ],
  },
  {
    name: 'Worst Gifts to Receive',
    answers: [
      { text: 'Socks', points: 29 },
      { text: "A gift card you'll never use", points: 21 },
      { text: 'Fruitcake', points: 17 },
      { text: 'Cheap perfume/cologne', points: 12 },
      { text: "Something re-gifted", points: 9 },
      { text: 'A self-help book', points: 6 },
      { text: 'A calendar', points: 4 },
      { text: 'A tie', points: 2 },
    ],
  },
  {
    name: 'Things You Shout at the TV During a Game',
    answers: [
      { text: '"Come on, ref!"', points: 31 },
      { text: '"Are you kidding me?!"', points: 22 },
      { text: "The player's name", points: 16 },
      { text: '"Pass the ball!"', points: 11 },
      { text: '"Defense!"', points: 9 },
      { text: '"That\'s a foul!"', points: 6 },
      { text: 'Just a scream', points: 3 },
      { text: '"Get in there!"', points: 2 },
    ],
  },
  {
    name: "Signs You're Getting Old",
    answers: [
      { text: 'You go to bed early', points: 25 },
      { text: 'Your back hurts for no reason', points: 21 },
      { text: 'You complain about the music', points: 17 },
      { text: 'You know weather forecasts by feel', points: 13 },
      { text: 'You need reading glasses', points: 10 },
      { text: 'You say "back in my day"', points: 7 },
      { text: 'You get excited about a good deal', points: 5 },
      { text: 'You nap on purpose', points: 2 },
    ],
  },
];
