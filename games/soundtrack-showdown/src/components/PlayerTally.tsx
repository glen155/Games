interface PlayerTallyProps {
  answered: number;
  total: number;
}

/** Live "how many have answered" readout while a hosted clue is in play. */
export function PlayerTally({ answered, total }: PlayerTallyProps) {
  return (
    <div className="player-tally">
      {total === 0
        ? 'Waiting for players to join…'
        : `${answered} of ${total} player${total === 1 ? '' : 's'} have answered`}
    </div>
  );
}
