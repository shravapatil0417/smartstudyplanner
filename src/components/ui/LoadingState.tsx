import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-brand-500 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
      <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
    </div>
  );
}
