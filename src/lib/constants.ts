import type { Priority, TaskStatus, ExamType } from '@/types';

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  high: { label: 'High', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40', dot: 'bg-red-500' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', dot: 'bg-amber-500' },
  low: { label: 'Low', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', dot: 'bg-emerald-500' },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: 'Pending', color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', dot: 'bg-slate-400' },
  in_progress: { label: 'In Progress', color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-950/40', dot: 'bg-brand-500' },
  completed: { label: 'Completed', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', dot: 'bg-emerald-500' },
};

export const EXAM_TYPE_CONFIG: Record<ExamType, { label: string; color: string; bg: string }> = {
  exam: { label: 'Exam', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40' },
  assignment: { label: 'Assignment', color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-950/40' },
  project: { label: 'Project', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
  submission: { label: 'Submission', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  other: { label: 'Other', color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
};

export const SUBJECT_COLORS = [
  '#3366ff', '#f3760f', '#10b981', '#8b5cf6', '#ec4899',
  '#f59e0b', '#06b6d4', '#ef4444', '#6366f1', '#14b8a6',
];

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatHours(minutes: number): string {
  const h = minutes / 60;
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`;
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function relativeDay(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days} days`;
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return daysUntil(dateStr) === 0;
}

export function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const days = daysUntil(dateStr);
  return days >= 0 && days <= 7;
}
