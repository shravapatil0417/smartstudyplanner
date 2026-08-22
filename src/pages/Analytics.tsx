import { useEffect, useState } from 'react';
import { BarChart3, Clock, CheckCircle2, Flame, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { supabase } from '@/lib/supabase';
import { LoadingState } from '@/components/ui/LoadingState';
import { StatCard } from '@/components/StatCard';
import { formatHours } from '@/lib/constants';
import type { StudySession, Subject, Task } from '@/types';

const COLORS = ['#3366ff', '#f3760f', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'];

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    (async () => {
      const [s, sub, t] = await Promise.all([supabase.from('study_sessions').select('*'), supabase.from('subjects').select('*'), supabase.from('tasks').select('*')]);
      setSessions(s.data ?? []); setSubjects(sub.data ?? []); setTasks(t.data ?? []); setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState message="Crunching your study stats..." />;

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const completed = tasks.filter(t => t.status === 'completed').length;
  const subjectData = subjects.map(s => ({ name: s.name, value: sessions.filter(ss => ss.subject_id === s.id).reduce((sum, ss) => sum + ss.duration_minutes, 0) })).filter(s => s.value > 0);
  const general = sessions.filter(s => !s.subject_id).reduce((sum, s) => sum + s.duration_minutes, 0);
  if (general > 0) subjectData.push({ name: 'General', value: general });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekData = Array.from({ length: 7 }, (_, index) => { const d = new Date(); d.setDate(d.getDate() - (6 - index)); const key = d.toISOString().slice(0, 10); return { day: days[d.getDay()], hours: +(sessions.filter(s => s.session_date === key).reduce((sum, s) => sum + s.duration_minutes, 0) / 60).toFixed(1) }; });
  const trendData = Array.from({ length: 14 }, (_, index) => { const d = new Date(); d.setDate(d.getDate() - (13 - index)); const key = d.toISOString().slice(0, 10); return { date: `${d.getMonth() + 1}/${d.getDate()}`, hours: +(sessions.filter(s => s.session_date === key).reduce((sum, s) => sum + s.duration_minutes, 0) / 60).toFixed(1) }; });
  const avgDaily = sessions.length ? totalMinutes / Math.max(1, new Set(sessions.map(s => s.session_date)).size) : 0;
  const mostStudied = subjectData.sort((a, b) => b.value - a.value)[0];

  return <div className="space-y-6 animate-fade-in"><div><h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Analytics</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Understand your habits and make every session count.</p></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><StatCard label="Total study time" value={formatHours(totalMinutes)} icon={<Clock className="h-6 w-6" />} color="text-brand-600 dark:text-brand-400" bg="bg-brand-50 dark:bg-brand-950/40" /><StatCard label="Daily average" value={formatHours(Math.round(avgDaily))} icon={<BarChart3 className="h-6 w-6" />} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/40" /><StatCard label="Tasks completed" value={completed} icon={<CheckCircle2 className="h-6 w-6" />} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/40" /><StatCard label="Top subject" value={mostStudied?.name || '—'} icon={<Trophy className="h-6 w-6" />} color="text-orange-600 dark:text-orange-400" bg="bg-orange-50 dark:bg-orange-950/40" /></div>
    <div className="grid lg:grid-cols-2 gap-6"><div className="card p-6"><h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Weekly study hours</h2><ResponsiveContainer width="100%" height={260}><BarChart data={weekData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} /><Bar dataKey="hours" fill="#3366ff" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="card p-6"><h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Study by subject</h2>{subjectData.length === 0 ? <div className="h-[260px] flex items-center justify-center text-sm text-slate-500">No study data yet.</div> : <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={subjectData} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={65} outerRadius={95} paddingAngle={3}>{subjectData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => `${((value as number) / 60).toFixed(1)}h`} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} /></PieChart></ResponsiveContainer>}</div></div>
    <div className="card p-6"><h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Productivity trend</h2><ResponsiveContainer width="100%" height={260}><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} /><Line type="monotone" dataKey="hours" stroke="#f3760f" strokeWidth={3} dot={{ fill: '#f3760f', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>
    <div className="card p-6"><div className="flex items-center gap-2 mb-5"><Flame className="h-5 w-5 text-orange-500" /><h2 className="text-lg font-bold text-slate-900 dark:text-white">Subject breakdown</h2></div><div className="space-y-4">{subjectData.length === 0 ? <p className="text-sm text-slate-500">Start a study session to see your breakdown.</p> : subjectData.map((s, i) => <div key={s.name}><div className="flex items-center justify-between text-sm mb-1.5"><span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{s.name}</span><span className="text-slate-500">{(s.value / 60).toFixed(1)}h</span></div><div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${totalMinutes ? (s.value / totalMinutes) * 100 : 0}%`, backgroundColor: COLORS[i % COLORS.length] }} /></div></div>)}</div></div>
  </div>;
}
