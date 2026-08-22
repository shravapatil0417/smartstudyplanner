import { useEffect, useState, useCallback } from 'react';
import { Plus, GraduationCap, CalendarDays, MapPin, Clock, Trash2, Edit3, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/context/ToastContext';
import { EXAM_TYPE_CONFIG, daysUntil } from '@/lib/constants';
import type { Exam, Subject, ExamType } from '@/types';

const emptyForm = { title: '', description: '', subject_id: '', exam_date: '', exam_time: '', location: '', type: 'exam' as ExamType };

export function Exams() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    const [examsRes, subjectsRes] = await Promise.all([
      supabase.from('exams').select('*, subject:subjects(*)').order('exam_date', { ascending: true }),
      supabase.from('subjects').select('*').order('name'),
    ]);
    setExams(examsRes.data ?? []);
    setSubjects(subjectsRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditExam(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (e: Exam) => {
    setEditExam(e);
    setForm({ title: e.title, description: e.description ?? '', subject_id: e.subject_id ?? '', exam_date: e.exam_date, exam_time: e.exam_time ?? '', location: e.location ?? '', type: e.type });
    setModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.exam_date) { toast('Please enter a title and date.', 'error'); return; }
    setSaving(true);
    const payload = { title: form.title.trim(), description: form.description.trim() || null, subject_id: form.subject_id || null, exam_date: form.exam_date, exam_time: form.exam_time || null, location: form.location.trim() || null, type: form.type };
    const result = editExam ? await supabase.from('exams').update(payload).eq('id', editExam.id) : await supabase.from('exams').insert(payload);
    if (result.error) toast(result.error.message, 'error'); else toast(editExam ? 'Deadline updated.' : 'Deadline added.', 'success');
    setSaving(false); setModalOpen(false); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('exams').delete().eq('id', deleteId);
    setDeleting(false); setDeleteId(null);
    if (error) toast(error.message, 'error'); else toast('Deadline deleted.', 'success');
    fetchData();
  };

  if (loading) return <LoadingState message="Loading deadlines..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Exams & Deadlines</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Keep every important date on your radar.</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add deadline</Button>
      </div>

      {exams.length === 0 ? <EmptyState icon={<GraduationCap className="h-8 w-8" />} title="No deadlines yet" description="Add exams, assignments, and projects to stay ahead." action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add deadline</Button>} /> : (
        <div className="space-y-3">
          {exams.map((exam) => {
            const days = daysUntil(exam.exam_date); const urgent = days >= 0 && days <= 3; const overdue = days < 0; const type = EXAM_TYPE_CONFIG[exam.type];
            return <div key={exam.id} className={`card p-4 sm:p-5 flex items-center gap-4 group ${urgent ? 'border-red-200 dark:border-red-900/60' : ''}`}>
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${overdue ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : urgent ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400' : 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'}`}>
                <span className="text-xl font-extrabold leading-none">{Math.abs(days)}</span><span className="text-[10px] font-semibold uppercase">{overdue ? 'days ago' : days === 0 ? 'today' : 'days left'}</span>
              </div>
              <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-bold text-slate-900 dark:text-white truncate">{exam.title}</h3><Badge className={`${type.bg} ${type.color}`}>{type.label}</Badge>{urgent && !overdue && <AlertCircle className="h-4 w-4 text-red-500" />}</div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-slate-500 dark:text-slate-400">{exam.subject && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: exam.subject.color }} />{exam.subject.name}</span>}<span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(exam.exam_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>{exam.exam_time && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{exam.exam_time.slice(0, 5)}</span>}{exam.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{exam.location}</span>}</div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition"><button onClick={() => openEdit(exam)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-500"><Edit3 className="h-4 w-4" /></button><button onClick={() => setDeleteId(exam.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></div>
            </div>;
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editExam ? 'Edit deadline' : 'Add deadline'}>
        <form onSubmit={handleSave} className="space-y-4"><Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. DBMS Final Exam" required /><div className="grid grid-cols-2 gap-4"><Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ExamType })}><option value="exam">Exam</option><option value="assignment">Assignment</option><option value="project">Project</option><option value="submission">Submission</option><option value="other">Other</option></Select><Select label="Subject" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}><option value="">No subject</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div><div className="grid grid-cols-2 gap-4"><Input label="Date" type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} required /><Input label="Time" type="time" value={form.exam_time} onChange={(e) => setForm({ ...form, exam_time: e.target.value })} /></div><Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Optional" /><Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional details..." /><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit" loading={saving}>{editExam ? 'Save changes' : 'Add deadline'}</Button></div></form>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete deadline?" message="This deadline will be permanently deleted." loading={deleting} />
    </div>
  );
}
