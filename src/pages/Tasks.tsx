import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Search, CheckCircle2, Circle, Clock, Trash2, Edit3, Filter, CheckSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/context/ToastContext';
import { PRIORITY_CONFIG, STATUS_CONFIG, formatMinutes, relativeDay } from '@/lib/constants';
import type { Task, Subject, Priority, TaskStatus } from '@/types';

type FilterType = 'all' | 'pending' | 'in_progress' | 'completed' | 'high';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'high', label: 'High Priority' },
];

const emptyForm = {
  title: '',
  description: '',
  subject_id: '',
  priority: 'medium' as Priority,
  status: 'pending' as TaskStatus,
  due_date: '',
  estimated_minutes: 30,
};

export function Tasks() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    const [tasksRes, subjectsRes] = await Promise.all([
      supabase.from('tasks').select('*, subject:subjects(*)').order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').order('name'),
    ]);
    setTasks(tasksRes.data ?? []);
    setSubjects(subjectsRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'high' && t.priority !== 'high') return false;
      if (filter !== 'all' && filter !== 'high' && t.status !== filter) return false;
      return true;
    });
  }, [tasks, search, filter]);

  const openCreate = () => {
    setEditTask(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description ?? '',
      subject_id: task.subject_id ?? '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date ?? '',
      estimated_minutes: task.estimated_minutes,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('Please enter a task title.', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      subject_id: form.subject_id || null,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
      estimated_minutes: form.estimated_minutes,
      completed_at: form.status === 'completed' ? (editTask?.completed_at ?? new Date().toISOString()) : null,
    };

    if (editTask) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', editTask.id);
      if (error) toast(error.message, 'error');
      else toast('Task updated successfully.', 'success');
    } else {
      const { error } = await supabase.from('tasks').insert(payload);
      if (error) toast(error.message, 'error');
      else toast('Task created successfully.', 'success');
    }
    setSaving(false);
    setModalOpen(false);
    fetchData();
  };

  const toggleStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null } : t));
    await supabase
      .from('tasks')
      .update({ status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null })
      .eq('id', task.id);
    if (newStatus === 'completed') toast('Task completed!', 'success');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('tasks').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) toast(error.message, 'error');
    else toast('Task deleted.', 'success');
    fetchData();
  };

  if (loading) return <LoadingState message="Loading tasks..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{tasks.length} tasks · {tasks.filter(t => t.status === 'completed').length} completed</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Task</Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="input-base pl-10"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                filter === f.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-8 w-8" />}
          title={tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
          description={tasks.length === 0 ? 'Create your first task to get started.' : 'Try adjusting your filters or search.'}
          action={tasks.length === 0 ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Task</Button> : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const isCompleted = task.status === 'completed';
            const prio = PRIORITY_CONFIG[task.priority];
            const status = STATUS_CONFIG[task.status];
            return (
              <div key={task.id} className="card p-4 flex items-center gap-3 hover:shadow-glow transition group">
                <button
                  onClick={() => toggleStatus(task)}
                  className="flex-shrink-0"
                >
                  {isCompleted
                    ? <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    : <Circle className="h-6 w-6 text-slate-300 dark:text-slate-600 hover:text-brand-500 transition" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {task.subject && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.subject.color }} />
                        {task.subject.name}
                      </span>
                    )}
                    {task.due_date && (
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3" /> {relativeDay(task.due_date)}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{formatMinutes(task.estimated_minutes)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={`${prio.bg} ${prio.color}`} dot={prio.dot}>{prio.label}</Badge>
                  {!isCompleted && (
                    <Badge className={`${status.bg} ${status.color}`} dot={status.dot}>{status.label}</Badge>
                  )}
                  <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-500 transition opacity-0 group-hover:opacity-100">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(task.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTask ? 'Edit Task' : 'New Task'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Complete DBMS assignment" required />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Optional details..." />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Subject" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
              <option value="">No subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Due date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            <Input label="Estimated time (min)" type="number" min={5} step={5} value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: parseInt(e.target.value) || 0 })} />
          </div>
          {editTask && (
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </Select>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editTask ? 'Save changes' : 'Create task'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete task?"
        message="This task will be permanently deleted. This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
}
