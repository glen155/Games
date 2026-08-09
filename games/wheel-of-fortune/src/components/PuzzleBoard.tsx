interface PuzzleBoardProps {
  category: string;
  solution: string;
  guessedLetters: string[];
  /** Show every letter regardless of guesses — used on the round-end/solved
   * screen where the full phrase should be shown. */
  revealAll?: boolean;
}

/** The puzzle board — one tile per letter, grouped by word, blank until
 * guessed (or revealAll). Non-letter characters (spaces, punctuation) are
 * always visible; only A-Z tiles hide their content. Same "public, don't
 * render it until revealed" trust model as every other game's hidden
 * content. */
export function PuzzleBoard({ category, solution, guessedLetters, revealAll = false }: PuzzleBoardProps) {
  const words = solution.split(' ');

  return (
    <div className="wof-board">
      <div className="wof-board-category">{category}</div>
      <div className="wof-board-words">
        {words.map((word, wordIndex) => (
          <div className="wof-board-word" key={`${wordIndex}-${word}`}>
            {word.split('').map((char, charIndex) => {
              const isLetter = /[A-Z]/i.test(char);
              const revealed = revealAll || !isLetter || guessedLetters.includes(char.toUpperCase());
              return (
                <span
                  key={charIndex}
                  className={`wof-tile${isLetter ? '' : ' wof-tile--punct'}${revealed ? ' wof-tile--revealed' : ''}`}
                >
                  {revealed ? char.toUpperCase() : ''}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
