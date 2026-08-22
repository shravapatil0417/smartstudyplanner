import { type ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  bg: string;
  trend?: string;
}

export function StatCard({ label, value, icon, color, bg, trend }: StatCardProps) {
  return (
    <div className="card p-5 hover:shadow-glow transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{value}</p>
          {trend && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{trend}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
