import { useEffect, useState, useCallback } from 'react';
import { Play, Pause, Square, Timer, Clock, CalendarDays, TrendingUp, Trash2, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/context/ToastContext';
import { formatMinutes, formatHours } from '@/lib/constants';
import type { StudySession, Subject } from '@/types';

export function Sessions() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    const [subjectsRes, sessionsRes] = await Promise.all([
      supabase.from('subjects').select('*').order('name'),
      supabase.from('study_sessions').select('*, subject:subjects(*)').order('created_at', { ascending: false }).limit(50),
    ]);
    setSubjects(subjectsRes.data ?? []);
    setSessions(sessionsRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const saveSession = async () => {
    const minutes = Math.max(1, Math.round(seconds / 60));
    const { error } = await supabase.from('study_sessions').insert({
      subject_id: subjectId || null,
      duration_minutes: minutes,
      session_date: new Date().toISOString().slice(0, 10),
      notes: notes.trim() || null,
    });
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Study session saved!', 'success');
    setSeconds(0);
    setRunning(false);
    setNotes('');
    fetchData();
  };

  const stopTimer = () => {
    setRunning(false);
    if (seconds >= 30) saveSession();
    else {
      setSeconds(0);
      toast('Session was too short to save.', 'info');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('study_sessions').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) toast(error.message, 'error');
    else toast('Session deleted.', 'success');
    fetchData();
  };

  if (loading) return <LoadingState message="Loading study sessions..." />;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMinutes = sessions.filter((s) => s.session_date === todayStr).reduce((sum, s) => sum + s.duration_minutes, 0);
  const weekMinutes = sessions.filter((s) => {
    const diff = Math.floor((new Date().getTime() - new Date(s.session_date + 'T00:00:00').getTime()) / 86400000);
    return diff >= 0 && diff < 7;
  }).reduce((sum, s) => sum + s.duration_minutes, 0);
  const monthMinutes = sessions.filter((s) => s.session_date.slice(0, 7) === todayStr.slice(0, 7)).reduce((sum, s) => sum + s.duration_minutes, 0);

  const timerDisplay = `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Study Sessions</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Stay focused and build a consistent study habit.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 sm:p-5"><div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium"><Clock className="h-4 w-4 text-brand-500" /> Today</div><p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{formatHours(todayMinutes)}</p></div>
        <div className="card p-4 sm:p-5"><div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium"><TrendingUp className="h-4 w-4 text-emerald-500" /> This week</div><p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{formatHours(weekMinutes)}</p></div>
        <div className="card p-4 sm:p-5"><div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium"><CalendarDays className="h-4 w-4 text-amber-500" /> This month</div><p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{formatHours(monthMinutes)}</p></div>
      </div>

      {/* Timer */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-10 sm:py-14 text-center relative">
          <div className="absolute inset-0 opacity-10"><div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" /></div>
          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 text-white mb-5">
              <Timer className="h-7 w-7" />
            </div>
            <p className="text-brand-100 text-sm font-medium mb-2">{running ? 'Focus mode active' : seconds > 0 ? 'Session paused' : 'Ready when you are'}</p>
            <p className="text-5xl sm:text-7xl font-extrabold tracking-wider text-white tabular-nums">{timerDisplay}</p>
            <div className="mt-8 flex items-center justify-center gap-3">
              {!running ? (
                <Button onClick={() => setRunning(true)} className="bg-white text-brand-700 hover:bg-brand-50 px-6"><Play className="h-4 w-4 fill-current" /> {seconds > 0 ? 'Resume' : 'Start timer'}</Button>
              ) : (
                <Button onClick={() => setRunning(false)} className="bg-white/15 text-white hover:bg-white/25 px-6"><Pause className="h-4 w-4 fill-current" /> Pause</Button>
              )}
              {seconds > 0 && <Button onClick={stopTimer} className="bg-red-500/90 text-white hover:bg-red-500 px-5"><Square className="h-4 w-4 fill-current" /> Stop & Save</Button>}
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-4">
          <Select label="What are you studying?" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">General study</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Textarea label="Session notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} placeholder="What are you working on?" />
        </div>
      </div>

      {/* History */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent sessions</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">{sessions.length} total</span>
        </div>
        {sessions.length === 0 ? (
          <EmptyState icon={<Timer className="h-8 w-8" />} title="No sessions yet" description="Start a timer above to log your first study session." />
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{s.subject?.name || 'General study'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{new Date(s.session_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{s.notes ? ` · ${s.notes}` : ''}</p>
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatMinutes(s.duration_minutes)}</span>
                <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete session?" message="This study session will be permanently deleted." loading={deleting} />
    </div>
  );
}
