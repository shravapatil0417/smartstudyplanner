import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, BookOpen, Timer, Calendar, BarChart3, GraduationCap, Settings, X, Sparkles, Layers, Bot } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/app/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/app/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/app/sessions', label: 'Study Sessions', icon: Timer },
  { to: '/app/calendar', label: 'Calendar', icon: Calendar },
  { to: '/app/exams', label: 'Exams & Deadlines', icon: GraduationCap },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/chat', label: 'AI Assistant', icon: Bot },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { profile } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100 dark:border-slate-800">
          <NavLink to="/app" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">StudyFlow</span>
          </NavLink>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-brand-600 dark:text-brand-400' : ''}`} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-800">
          <NavLink
            to="/app/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`
            }
          >
            <Settings className="h-5 w-5" />
            Settings
          </NavLink>
          <div className="mt-3 px-3 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-sm font-bold flex-shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{profile?.full_name || 'Student'}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{profile?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
