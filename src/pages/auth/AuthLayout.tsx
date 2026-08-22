import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Check } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-300 rounded-full blur-3xl" />
        </div>
        <Link to="/" className="relative flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-white">StudyFlow</span>
        </Link>
        <div className="relative">
          <h2 className="text-4xl font-extrabold text-white leading-tight max-w-md">
            Your study life, beautifully organized.
          </h2>
          <p className="mt-4 text-brand-100 max-w-md">
            Track tasks, manage subjects, log study sessions, and never miss a deadline.
          </p>
          <div className="mt-8 space-y-3">
            {['Smart task management', 'Visual study analytics', 'Exam deadline tracking'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-white">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-brand-200 text-sm">© 2026 StudyFlow</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">StudyFlow</span>
          </Link>
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
