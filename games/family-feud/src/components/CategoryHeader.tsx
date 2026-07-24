interface CategoryHeaderProps {
  name: string;
  roundNumber: number;
  totalRounds: number;
}

export function CategoryHeader({ name, roundNumber, totalRounds }: CategoryHeaderProps) {
  return (
    <div className="board-header">
      <span className="board-round-indicator">
        Round {roundNumber} of {totalRounds}
      </span>
      <h1 className="board-category-name">{name}</h1>
    </div>
  );
}
