interface WaitingScreenProps {
  message: string;
  sub?: string;
}

export function WaitingScreen({ message, sub }: WaitingScreenProps) {
  return (
    <div className="mt-player-waiting">
      <p>{message}</p>
      {sub && <p className="mt-player-waiting-sub">{sub}</p>}
    </div>
  );
}
