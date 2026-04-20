interface CharCounterProps {
  current: number;
  max: number;
}

export function CharCounter({ current, max }: CharCounterProps) {
  const pct = current / max;
  return (
    <span className={`text-xs tabular-nums ${pct > 0.9 ? "text-destructive" : pct > 0.75 ? "text-warning" : "text-muted-foreground"}`}>
      {current}/{max}
    </span>
  );
}
