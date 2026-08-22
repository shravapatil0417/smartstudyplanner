import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, CheckSquare, GraduationCap, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingState } from '@/components/ui/LoadingState';
import { Badge } from '@/components/ui/Badge';
import { EXAM_TYPE_CONFIG, STATUS_CONFIG } from '@/lib/constants';
import type { Task, Exam, StudySession } from '@/types';

interface CalendarEvent { id: string; title: string; date: string; kind: 'task' | 'exam' | 'session'; meta?: string; color?: string; }

export function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [tasksRes, examsRes, sessionsRes] = await Promise.all([supabase.from('tasks').select('*, subject:subjects(*)'), supabase.from('exams').select('*, subject:subjects(*)'), supabase.from('study_sessions').select('*')]);
      const taskEvents: CalendarEvent[] = ((tasksRes.data ?? []) as Task[]).filter(t => t.due_date).map(t => ({ id: t.id, title: t.title, date: t.due_date!, kind: 'task', meta: STATUS_CONFIG[t.status].label, color: t.subject?.color }));
      const examEvents: CalendarEvent[] = ((examsRes.data ?? []) as Exam[]).map(e => ({ id: e.id, title: e.title, date: e.exam_date, kind: 'exam', meta: EXAM_TYPE_CONFIG[e.type].label, color: e.subject?.color }));
      const sessionEvents: CalendarEvent[] = ((sessionsRes.data ?? []) as StudySession[]).map(s => ({ id: s.id, title: `${s.duration_minutes}m study session`, date: s.session_date, kind: 'session', meta: 'Study session' }));
      setEvents([...taskEvents, ...examEvents, ...sessionEvents]); setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState message="Loading calendar..." />;

  const year = month.getFullYear(); const monthIndex = month.getMonth(); const firstDay = new Date(year, monthIndex, 1).getDay(); const daysInMonth = new Date(year, monthIndex + 1, 0).getDate(); const today = new Date().toISOString().slice(0, 10);
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);
  const dateKey = (day: number) => `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];
  const goMonth = (delta: number) => setMonth(new Date(year, monthIndex + delta, 1));

  return <div className="space-y-6 animate-fade-in"><div><h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Calendar</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your study life, at a glance.</p></div>
    <div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2 card p-4 sm:p-6"><div className="flex items-center justify-between mb-5"><button onClick={() => goMonth(-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="h-5 w-5 text-slate-500" /></button><h2 className="text-lg font-bold text-slate-900 dark:text-white">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2><button onClick={() => goMonth(1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="h-5 w-5 text-slate-500" /></button></div><div className="grid grid-cols-7 mb-2">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>)}</div><div className="grid grid-cols-7 gap-1">{cells.map((day, i) => { if (!day) return <div key={i} className="min-h-[72px] sm:min-h-[90px]" />; const key = dateKey(day); const dayEvents = events.filter(e => e.date === key); const isToday = key === today; const isSelected = key === selectedDate; return <button key={i} onClick={() => setSelectedDate(key)} className={`min-h-[72px] sm:min-h-[90px] rounded-xl p-1.5 text-left border transition ${isSelected ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'} ${isToday ? 'ring-2 ring-brand-200 dark:ring-brand-800' : ''}`}><span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${isToday ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>{day}</span><div className="mt-1 space-y-0.5">{dayEvents.slice(0, 3).map(e => <div key={e.id} className={`text-[10px] truncate rounded px-1 py-0.5 ${e.kind === 'exam' ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400' : e.kind === 'session' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400'}`}>{e.title}</div>)}{dayEvents.length > 3 && <div className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 3} more</div>}</div></button>; })}</div><div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-brand-500" /> Tasks</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500" /> Deadlines</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Sessions</span></div></div>
      <div className="card p-6 h-fit"><h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}</h2>{selectedDate && selectedEvents.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">Nothing scheduled for this day.</p>}{selectedEvents.map(e => <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 mb-2"><div className={`w-9 h-9 rounded-lg flex items-center justify-center ${e.kind === 'exam' ? 'bg-red-50 dark:bg-red-950/40 text-red-500' : e.kind === 'session' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500' : 'bg-brand-50 dark:bg-brand-950/40 text-brand-500'}`}>{e.kind === 'exam' ? <GraduationCap className="h-4 w-4" /> : e.kind === 'session' ? <Clock className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}</div><div className="min-w-0"><p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{e.title}</p><p className="text-xs text-slate-500 mt-0.5">{e.meta}</p></div></div>)}{!selectedDate && <div className="text-center py-8"><CalendarDays className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" /><p className="text-sm text-slate-500 dark:text-slate-400">Click any date to see its events.</p></div>}</div></div>
  </div>;
}
