import { useEffect, useState, useCallback } from 'react';
import { Plus, BookOpen, Trash2, Edit3, Clock, CheckCircle2, Target, StickyNote, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/context/ToastContext';
import { SUBJECT_COLORS, formatHours } from '@/lib/constants';
import { generateFlashcards } from '@/lib/flashcardGenerator';
import { useNavigate } from 'react-router-dom';
import type { Subject, SubjectWithStats } from '@/types';

const emptyForm = { name: '', description: '', color: SUBJECT_COLORS[0], target_hours: 10, notes: '' };

export function Subjects() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const [notesModalSubject, setNotesModalSubject] = useState<SubjectWithStats | null>(null);
  const [notesText, setNotesText] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    const [subjectsRes, sessionsRes, tasksRes, flashcardsRes] = await Promise.all([
      supabase.from('subjects').select('*').order('created_at', { ascending: false }),
      supabase.from('study_sessions').select('subject_id, duration_minutes'),
      supabase.from('tasks').select('subject_id, status'),
      supabase.from('flashcards').select('subject_id'),
    ]);
    const subs = subjectsRes.data ?? [];
    const sessions = sessionsRes.data ?? [];
    const tasks = tasksRes.data ?? [];
    const flashcards = flashcardsRes.data ?? [];

    const withStats: SubjectWithStats[] = subs.map((s) => {
      const studiedMinutes = sessions.filter((ss) => ss.subject_id === s.id).reduce((sum, ss) => sum + ss.duration_minutes, 0);
      const subjectTasks = tasks.filter((t) => t.subject_id === s.id);
      return {
        ...s,
        studied_minutes: studiedMinutes,
        studied_hours: studiedMinutes / 60,
        progress: s.target_hours > 0 ? Math.min(100, (studiedMinutes / (s.target_hours * 60)) * 100) : 0,
        task_count: subjectTasks.length,
        completed_tasks: subjectTasks.filter((t) => t.status === 'completed').length,
        flashcard_count: flashcards.filter((f) => f.subject_id === s.id).length,
      };
    });
    setSubjects(withStats);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditSubject(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (s: Subject) => {
    setEditSubject(s);
    setForm({ name: s.name, description: s.description ?? '', color: s.color, target_hours: s.target_hours, notes: s.notes ?? '' });
    setModalOpen(true);
  };

  const openNotes = (s: SubjectWithStats) => {
    setNotesModalSubject(s);
    setNotesText(s.notes ?? '');
  };

  const saveNotes = async () => {
    if (!notesModalSubject) return;
    setNotesSaving(true);
    const { error } = await supabase.from('subjects').update({ notes: notesText.trim() || null }).eq('id', notesModalSubject.id);
    setNotesSaving(false);
    if (error) toast(error.message, 'error');
    else { toast('Notes saved.', 'success'); setNotesModalSubject(null); fetchData(); }
  };

  const generateCards = async () => {
    if (!notesModalSubject) return;
    const trimmed = notesText.trim();
    if (!trimmed) {
      toast('Please write some notes first.', 'error');
      return;
    }
    const cards = generateFlashcards(trimmed);
    if (cards.length === 0) {
      toast('No flashcards could be generated. Try formats like "Term: Definition" or "Q: question" then "A: answer".', 'error');
      return;
    }
    setGenerating(true);
    // Save notes first, then insert flashcards
    await supabase.from('subjects').update({ notes: trimmed }).eq('id', notesModalSubject.id);
    const { error } = await supabase.from('flashcards').insert(
      cards.map((c) => ({
        subject_id: notesModalSubject.id,
        question: c.question,
        answer: c.answer,
        source_notes: trimmed,
      }))
    );
    setGenerating(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      toast(`${cards.length} flashcards generated!`, 'success');
      setNotesModalSubject(null);
      fetchData();
      navigate('/app/flashcards');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Please enter a subject name.', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      color: form.color,
      target_hours: form.target_hours,
      notes: form.notes.trim() || null,
    };
    if (editSubject) {
      const { error } = await supabase.from('subjects').update(payload).eq('id', editSubject.id);
      if (error) toast(error.message, 'error');
      else toast('Subject updated.', 'success');
    } else {
      const { error } = await supabase.from('subjects').insert(payload);
      if (error) toast(error.message, 'error');
      else toast('Subject created.', 'success');
    }
    setSaving(false);
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('subjects').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) toast(error.message, 'error');
    else toast('Subject deleted.', 'success');
    fetchData();
  };

  if (loading) return <LoadingState message="Loading subjects..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Subjects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subjects.length} subjects · {formatHours(subjects.reduce((s, sub) => s + sub.studied_minutes, 0))} studied</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Subject</Button>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="No subjects yet"
          description="Add your subjects to start tracking study progress and organizing tasks."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Subject</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <div key={s.id} className="card p-5 hover:shadow-glow transition group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: s.color }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{s.name}</h3>
                    {s.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{s.description}</p>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-500 transition">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Target className="h-3 w-3" /> {formatHours(s.studied_minutes)} / {s.target_hours}h</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.round(s.progress)}%</span>
                  </div>
                  <ProgressBar value={s.studied_minutes} max={s.target_hours * 60} color={s.color} />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {s.task_count} tasks</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {s.completed_tasks} done</span>
                  {s.flashcard_count > 0 && <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> {s.flashcard_count} cards</span>}
                </div>
                <button onClick={() => openNotes(s)} className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <StickyNote className="h-3.5 w-3.5" />
                  {s.notes ? 'Edit notes & generate flashcards' : 'Add notes & generate flashcards'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editSubject ? 'Edit Subject' : 'New Subject'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Subject name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Database Management Systems" required />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional..." />
          <Input label="Target study hours" type="number" min={1} value={form.target_hours} onChange={(e) => setForm({ ...form, target_hours: parseInt(e.target.value) || 1 })} />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-9 h-9 rounded-lg transition ${form.color === c ? 'ring-2 ring-offset-2 ring-brand-500 dark:ring-offset-slate-900 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editSubject ? 'Save changes' : 'Create subject'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete subject?"
        message="This subject and its associated tasks will be affected. Tasks will be unlinked but not deleted. This cannot be undone."
        loading={deleting}
      />

      <Modal open={!!notesModalSubject} onClose={() => setNotesModalSubject(null)} title={`Notes — ${notesModalSubject?.name ?? ''}`} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Study notes</label>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              rows={10}
              placeholder={`Write your subject notes here, then click "Generate Flashcards" to create study cards.\n\nTips for better flashcards:\n• Use "Term: Definition" format\n• Use "Q: question\nA: answer" format\n• Use bullet points with explanations\n• Write one concept per line\n\nExample:\nNormalization: The process of organizing data to reduce redundancy\nACID: Atomicity, Consistency, Isolation, Durability\nQ: What is a primary key?\nA: A unique identifier for each row in a table`}
              className="input-base resize-y font-mono text-sm leading-relaxed"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {notesText.trim() ? `${generateFlashcards(notesText).length} flashcards detected` : 'Start typing to see card count'}
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={saveNotes} loading={notesSaving}>Save notes</Button>
              <Button type="button" onClick={generateCards} loading={generating} disabled={!notesText.trim()}><Zap className="h-4 w-4" /> Generate Flashcards</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
