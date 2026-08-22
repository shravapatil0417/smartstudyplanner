import { useEffect, useState, useCallback } from 'react';
import { Layers, Zap, Trash2, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, Eye, EyeOff, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import type { Flashcard, Subject } from '@/types';

type ViewMode = 'list' | 'study';

export function Flashcards() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filterSubject, setFilterSubject] = useState('all');
  const [view, setView] = useState<ViewMode>('list');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Study mode state
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);
  const [studyFinished, setStudyFinished] = useState(false);

  const fetchData = useCallback(async () => {
    const [cardsRes, subjectsRes] = await Promise.all([
      supabase.from('flashcards').select('*, subject:subjects(*)').order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').order('name'),
    ]);
    setFlashcards(cardsRes.data ?? []);
    setSubjects(subjectsRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = filterSubject === 'all'
    ? flashcards
    : flashcards.filter((f) => f.subject_id === filterSubject);

  const startStudy = () => {
    if (filtered.length === 0) return;
    setStudyIndex(0);
    setFlipped(false);
    setKnownCount(0);
    setUnknownCount(0);
    setStudyFinished(false);
    setView('study');
  };

  const nextCard = (known: boolean) => {
    if (known) setKnownCount((c) => c + 1);
    else setUnknownCount((c) => c + 1);

    // Mark as reviewed
    const card = filtered[studyIndex];
    if (card) {
      supabase.from('flashcards').update({ reviewed: true }).eq('id', card.id);
    }

    if (studyIndex + 1 >= filtered.length) {
      setStudyFinished(true);
    } else {
      setStudyIndex((i) => i + 1);
      setFlipped(false);
    }
  };

  const restartStudy = () => {
    setStudyIndex(0);
    setFlipped(false);
    setKnownCount(0);
    setUnknownCount(0);
    setStudyFinished(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('flashcards').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) toast(error.message, 'error');
    else { toast('Flashcard deleted.', 'success'); fetchData(); }
  };

  const deleteAllForSubject = async (subjectId: string) => {
    const { error } = await supabase.from('flashcards').delete().eq('subject_id', subjectId);
    if (error) toast(error.message, 'error');
    else { toast('All flashcards cleared.', 'success'); fetchData(); }
  };

  if (loading) return <LoadingState message="Loading flashcards..." />;

  // Study mode
  if (view === 'study') {
    if (studyFinished) {
      const total = filtered.length;
      const pct = total > 0 ? Math.round((knownCount / total) * 100) : 0;
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="card p-8 sm:p-12 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Study session complete!</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">You went through {total} flashcards.</p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{knownCount}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">Known</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40">
                <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">{unknownCount}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">Need review</p>
              </div>
              <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40">
                <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">{pct}%</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">Accuracy</p>
              </div>
            </div>
            <div className="flex justify-center gap-3 mt-8">
              <Button onClick={restartStudy}><RotateCcw className="h-4 w-4" /> Study again</Button>
              <Button variant="secondary" onClick={() => setView('list')}>Back to list</Button>
            </div>
          </div>
        </div>
      );
    }

    const card = filtered[studyIndex];
    if (!card) return null;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Study Mode</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Card {studyIndex + 1} of {filtered.length}</p>
          </div>
          <Button variant="ghost" onClick={() => setView('list')}>Exit</Button>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-300"
            style={{ width: `${((studyIndex) / filtered.length) * 100}%` }}
          />
        </div>

        {/* Flashcard */}
        <div className="flex justify-center">
          <div
            className="relative w-full max-w-2xl h-80 sm:h-96 cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={() => setFlipped(!flipped)}
          >
            <div
              className="relative w-full h-full transition-transform duration-500"
              style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : '' }}
            >
              {/* Front (Question) */}
              <div
                className="absolute inset-0 card flex flex-col items-center justify-center p-8 text-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {card.subject && (
                  <div className="absolute top-4 left-4">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: card.subject.color }} />
                      {card.subject.name}
                    </span>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">Question</Badge>
                </div>
                <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">{card.question}</p>
                <p className="text-xs text-slate-400 mt-6 flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Click to reveal answer</p>
              </div>
              {/* Back (Answer) */}
              <div
                className="absolute inset-0 card flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-brand-50 to-white dark:from-brand-950/30 dark:to-slate-900"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                {card.subject && (
                  <div className="absolute top-4 left-4">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: card.subject.color }} />
                      {card.subject.name}
                    </span>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">Answer</Badge>
                </div>
                <p className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">{card.answer}</p>
                <p className="text-xs text-slate-400 mt-6 flex items-center gap-1"><EyeOff className="h-3.5 w-3.5" /> Click to flip back</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => nextCard(false)} disabled={!flipped}>
            <ChevronLeft className="h-4 w-4" /> Need review
          </Button>
          <Button variant="secondary" onClick={() => setFlipped(!flipped)}>
            <RotateCcw className="h-4 w-4" /> Flip
          </Button>
          <Button onClick={() => nextCard(true)} disabled={!flipped}>
            Got it <CheckCircle2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // List mode
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Flashcards</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{flashcards.length} cards across {subjects.length} subjects</p>
        </div>
        {flashcards.length > 0 && (
          <Button onClick={startStudy}><Zap className="h-4 w-4" /> Start studying</Button>
        )}
      </div>

      {/* Filter */}
      {subjects.length > 0 && (
        <div className="flex items-center gap-3">
          <Select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="max-w-xs">
            <option value="all">All subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
      )}

      {flashcards.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-8 w-8" />}
          title="No flashcards yet"
          description="Add notes to a subject, then generate flashcards from the Subjects page."
          action={<Link to="/app/subjects" className="btn-primary"><BookOpen className="h-4 w-4" /> Go to Subjects</Link>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Layers className="h-8 w-8" />} title="No cards for this subject" description="Try a different subject filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map((card) => (
            <div key={card.id} className="card p-5 group hover:shadow-glow transition">
              <div className="flex items-start gap-4">
                {card.subject && (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: card.subject.color }}>
                    {card.subject.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {card.subject && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.subject.name}</span>}
                    {card.reviewed && <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" dot="bg-emerald-500">Reviewed</Badge>}
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{card.question}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{card.answer}</p>
                </div>
                <button onClick={() => setDeleteId(card.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {filterSubject !== 'all' && (
            <div className="pt-2">
              <Button variant="danger" onClick={() => deleteAllForSubject(filterSubject)}>Delete all cards for this subject</Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete flashcard?"
        message="This flashcard will be permanently deleted."
        loading={deleting}
      />
    </div>
  );
}
