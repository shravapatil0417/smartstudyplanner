import { type ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  className?: string;
  dot?: string;
}

export function Badge({ children, className = '', dot }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {children}
    </span>
  );
}
