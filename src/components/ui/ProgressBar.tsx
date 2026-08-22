interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  className?: string;
}

export function ProgressBar({ value, max, color = '#3366ff', className = '' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
