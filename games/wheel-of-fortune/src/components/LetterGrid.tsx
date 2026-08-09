const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS = new Set('AEIOU'.split(''));

interface LetterGridProps {
  guessedLetters: string[];
  /** True while a cash wedge is pending — consonants are tappable. */
  canGuessConsonant: boolean;
  /** True while nothing's pending and the pot affords a vowel. */
  canBuyVowel: boolean;
  onGuessConsonant: (letter: string) => void;
  onBuyVowel: (letter: string) => void;
}

/** A-Z grid. Consonants tappable only with a cash wedge pending; vowels
 * tappable only when nothing's pending and the round pot can afford one;
 * already-guessed letters are disabled either way. */
export function LetterGrid({
  guessedLetters,
  canGuessConsonant,
  canBuyVowel,
  onGuessConsonant,
  onBuyVowel,
}: LetterGridProps) {
  return (
    <div className="wof-letters">
      {ALPHABET.map((letter) => {
        const isVowel = VOWELS.has(letter);
        const guessed = guessedLetters.includes(letter);
        const tappable = !guessed && (isVowel ? canBuyVowel : canGuessConsonant);
        return (
          <button
            key={letter}
            type="button"
            className={`wof-letter${isVowel ? ' wof-letter--vowel' : ''}${guessed ? ' wof-letter--guessed' : ''}`}
            disabled={!tappable}
            onClick={() => (isVowel ? onBuyVowel(letter) : onGuessConsonant(letter))}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}
