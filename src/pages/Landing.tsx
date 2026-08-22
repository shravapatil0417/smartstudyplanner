import { Link } from 'react-router-dom';
import { Sparkles, CheckSquare, BookOpen, Timer, Calendar, BarChart3, GraduationCap, ArrowRight, Check } from 'lucide-react';

const FEATURES = [
  { icon: CheckSquare, title: 'Task Management', desc: 'Create, organize, and track tasks by subject with priorities and due dates.' },
  { icon: BookOpen, title: 'Subject Tracking', desc: 'Organize subjects, set study targets, and monitor your progress at a glance.' },
  { icon: Timer, title: 'Study Timer', desc: 'Track focused study sessions with a built-in timer and detailed notes.' },
  { icon: Calendar, title: 'Smart Calendar', desc: 'View tasks, exams, and study sessions all in one unified calendar.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Visualize your study habits with charts for trends, distribution, and streaks.' },
  { icon: GraduationCap, title: 'Exam Prep', desc: 'Never miss a deadline with upcoming exam and assignment reminders.' },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">StudyFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost">Sign in</Link>
            <Link to="/register" className="btn-primary">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-100/40 dark:bg-brand-950/30 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-900 text-brand-700 dark:text-brand-300 text-sm font-semibold mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            Your all-in-one study companion
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight">
            Plan smarter.{' '}
            <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">Study better.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Manage subjects, tasks, exams, and study sessions from one beautiful dashboard. Built for students who want to stay on top of everything.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-base px-6 py-3">
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-6 py-3">Sign in</Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { label: 'Tasks managed', value: '10k+' },
              { label: 'Study hours', value: '50k+' },
              { label: 'Students', value: '1k+' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Everything you need to ace your semester</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Powerful features designed for student productivity.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-glow transition-shadow duration-300">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="relative rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-12 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl font-extrabold text-white">Ready to take control of your studies?</h2>
            <p className="mt-3 text-brand-100 max-w-lg mx-auto">Join thousands of students using StudyFlow to stay organized and productive.</p>
            <Link to="/register" className="inline-flex mt-8 btn bg-white text-brand-700 hover:bg-brand-50 text-base px-6 py-3">
              Create your free account <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mt-6 flex items-center justify-center gap-6 text-brand-100 text-sm">
              {['No credit card', 'Free forever', 'Setup in minutes'].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4" /> {t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">StudyFlow</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">© 2026 StudyFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
