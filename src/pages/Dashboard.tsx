import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, CheckCircle2, Clock, Flame, Plus, BookOpen, Timer, GraduationCap, ArrowRight, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Badge } from '@/components/ui/Badge';
import { PRIORITY_CONFIG, STATUS_CONFIG, formatHours, getGreeting, isToday, daysUntil, relativeDay, EXAM_TYPE_CONFIG } from '@/lib/constants';
import type { Task, Subject, Exam, StudySession } from '@/types';

interface SubjectProgress {
  subject: Subject;
  studiedMinutes: number;
  targetMinutes: number;
}

export function Dashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [weekData, setWeekData] = useState<{ day: string; hours: number }[]>([]);

  const toggleTask = useCallback(async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null } : t));
    await supabase
      .from('tasks')
      .update({ status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null })
      .eq('id', task.id);
  }, []);

  useEffect(() => {
    (async () => {
      const [tasksRes, subjectsRes, examsRes, sessionsRes] = await Promise.all([
        supabase.from('tasks').select('*, subject:subjects(*)').order('due_date', { ascending: true }),
        supabase.from('subjects').select('*').order('created_at', { ascending: true }),
        supabase.from('exams').select('*, subject:subjects(*)').order('exam_date', { ascending: true }),
        supabase.from('study_sessions').select('*'),
      ]);

      const allTasks = tasksRes.data ?? [];
      const allSubjects = subjectsRes.data ?? [];
      const allExams = examsRes.data ?? [];
      const allSessions = sessionsRes.data ?? [];

      setTasks(allTasks);
      setSubjects(allSubjects);
      setExams(allExams);
      setSessions(allSessions);

      // Subject progress
      const progress = allSubjects.map((s) => {
        const studied = allSessions
          .filter((ss) => ss.subject_id === s.id)
          .reduce((sum, ss) => sum + ss.duration_minutes, 0);
        return { subject: s, studiedMinutes: studied, targetMinutes: s.target_hours * 60 };
      });
      setSubjectProgress(progress);

      // Week data (last 7 days)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const weekArr: { day: string; hours: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const mins = allSessions
          .filter((ss) => ss.session_date === dateStr)
          .reduce((sum, ss) => sum + ss.duration_minutes, 0);
        weekArr.push({ day: days[d.getDay()], hours: +(mins / 60).toFixed(1) });
      }
      setWeekData(weekArr);

      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState message="Loading your dashboard..." />;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'completed').length;
  const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  // Study streak
  const studyDates = new Set(sessions.map((s) => s.session_date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    if (studyDates.has(ds)) streak++;
    else if (i > 0) break;
  }

  const todaysTasks = tasks.filter((t) => isToday(t.due_date) && t.status !== 'completed');
  const upcomingExams = exams
    .filter((e) => daysUntil(e.exam_date) >= 0)
    .slice(0, 5);

  const quickActions = [
    { to: '/app/tasks', label: 'Add Task', icon: Plus, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-950/40' },
    { to: '/app/subjects', label: 'Add Subject', icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { to: '/app/sessions', label: 'Start Session', icon: Timer, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { to: '/app/exams', label: 'Add Exam', icon: GraduationCap, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40' },
  ];

  const maxHours = Math.max(...weekData.map((d) => d.hours), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Here's your study overview for today.</p>
        </div>
        <div className="flex items-center gap-2">
          {quickActions.map((a) => (
            <Link key={a.label} to={a.to} className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 transition group">
              <div className={`w-8 h-8 rounded-lg ${a.bg} flex items-center justify-center ${a.color}`}>
                <a.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={totalTasks} icon={<CheckSquare className="h-6 w-6" />} color="text-brand-600 dark:text-brand-400" bg="bg-brand-50 dark:bg-brand-950/40" trend={`${pendingTasks} pending`} />
        <StatCard label="Completed" value={completedTasks} icon={<CheckCircle2 className="h-6 w-6" />} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/40" trend={totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}% done` : 'No tasks yet'} />
        <StatCard label="Study Hours" value={formatHours(totalStudyMinutes)} icon={<Clock className="h-6 w-6" />} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/40" trend={`${sessions.length} sessions`} />
        <StatCard label="Study Streak" value={`${streak} days`} icon={<Flame className="h-6 w-6" />} color="text-orange-600 dark:text-orange-400" bg="bg-orange-50 dark:bg-orange-950/40" trend={streak > 0 ? 'Keep it up!' : 'Start studying'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Today's Tasks</h2>
            <Link to="/app/tasks" className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {todaysTasks.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="h-8 w-8" />} title="No tasks for today" description="You're all caught up. Enjoy your day or add a new task." />
          ) : (
            <div className="space-y-2">
              {todaysTasks.slice(0, 6).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group">
                  <button
                    onClick={() => toggleTask(task)}
                    className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 hover:border-brand-500 transition flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                    {task.subject && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.subject.color }} />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{task.subject.name}</span>
                      </div>
                    )}
                  </div>
                  <Badge className={`${PRIORITY_CONFIG[task.priority].bg} ${PRIORITY_CONFIG[task.priority].color}`} dot={PRIORITY_CONFIG[task.priority].dot}>
                    {PRIORITY_CONFIG[task.priority].label}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming</h2>
            <Link to="/app/exams" className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {upcomingExams.length === 0 ? (
            <EmptyState icon={<Calendar className="h-8 w-8" />} title="No upcoming deadlines" description="Your schedule is clear." />
          ) : (
            <div className="space-y-3">
              {upcomingExams.map((exam) => {
                const days = daysUntil(exam.exam_date);
                const urgent = days <= 3;
                const typeCfg = EXAM_TYPE_CONFIG[exam.type];
                return (
                  <div key={exam.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center ${urgent ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400' : 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'}`}>
                      <span className="text-lg font-extrabold leading-none">{days}</span>
                      <span className="text-[10px] font-semibold uppercase">days</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{exam.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`${typeCfg.bg} ${typeCfg.color}`}>{typeCfg.label}</Badge>
                        {exam.subject && <span className="text-xs text-slate-500 dark:text-slate-400">{exam.subject.name}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Study Progress Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Study Progress — This Week</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">{formatHours(weekData.reduce((s, d) => s + d.hours * 60, 0))} total</span>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(51,102,255,0.05)' }}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
            />
            <Bar dataKey="hours" radius={[8, 8, 0, 0]} maxBarSize={50}>
              {weekData.map((entry, i) => (
                <Cell key={i} fill={entry.hours >= maxHours && entry.hours > 0 ? '#1f47f5' : '#598dff'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Subject Progress */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Subject Progress</h2>
          <Link to="/app/subjects" className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
            Manage <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {subjectProgress.length === 0 ? (
          <EmptyState icon={<BookOpen className="h-8 w-8" />} title="No subjects yet" description="Add subjects to track your study progress." action={<Link to="/app/subjects" className="btn-primary"><Plus className="h-4 w-4" /> Add Subject</Link>} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {subjectProgress.map(({ subject, studiedMinutes, targetMinutes }) => (
              <div key={subject.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{subject.name}</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{formatHours(studiedMinutes)} / {subject.target_hours}h</span>
                </div>
                <ProgressBar value={studiedMinutes} max={targetMinutes} color={subject.color} />
                <p className="text-xs text-slate-400 mt-1.5">
                  {targetMinutes > 0 ? Math.min(100, Math.round((studiedMinutes / targetMinutes) * 100)) : 0}% complete
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
