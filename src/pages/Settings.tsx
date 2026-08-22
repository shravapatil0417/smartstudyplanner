import { useState, useEffect, useCallback } from 'react';
import { User, LogOut, Moon, Sun, Save, Key, Bot, ExternalLink, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function Settings() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [goal, setGoal] = useState(profile?.study_goal ?? 2);
  const [saving, setSaving] = useState(false);
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));
  const [groqKey, setGroqKey] = useState('');
  const [groqKeySaved, setGroqKeySaved] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('user_settings').select('groq_api_key').maybeSingle();
      if (data?.groq_api_key) {
        setGroqKey(data.groq_api_key);
        setGroqKeySaved(true);
      }
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: name.trim(), study_goal: goal }).eq('user_id', user?.id);
    setSaving(false); if (error) toast(error.message, 'error'); else { toast('Profile updated.', 'success'); refreshProfile(); }
  };

  const saveGroqKey = async () => {
    setSavingKey(true);
    const { error } = await supabase.from('user_settings').upsert({
      user_id: user?.id,
      groq_api_key: groqKey.trim() || null,
    }, { onConflict: 'user_id' });
    setSavingKey(false);
    if (error) toast(error.message, 'error');
    else {
      toast('Groq API key saved.', 'success');
      setGroqKeySaved(!!groqKey.trim());
    }
  };

  const toggleTheme = () => { const next = !dark; setDark(next); document.documentElement.classList.toggle('dark', next); localStorage.setItem('theme', next ? 'dark' : 'light'); };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your profile and preferences.</p>
      </div>

      {/* Profile */}
      <div className="card p-6">
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl font-bold">{name?.charAt(0)?.toUpperCase() || 'U'}</div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile information</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your account details and study preferences.</p>
          </div>
        </div>
        <form onSubmit={save} className="pt-5 space-y-4">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <Input label="Email" value={profile?.email || ''} disabled />
          <Input label="Weekly study goal (hours)" type="number" min={1} value={goal} onChange={(e) => setGoal(parseInt(e.target.value) || 1)} />
          <div className="flex justify-end">
            <Button type="submit" loading={saving}><Save className="h-4 w-4" /> Save changes</Button>
          </div>
        </form>
      </div>

      {/* Groq API Key */}
      <div className="card p-6">
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white">
            <Bot className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Chatbot — Groq API Key</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Connect your Groq API key to power the AI study assistant.</p>
          </div>
          {groqKeySaved && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full">
              <Check className="h-3.5 w-3.5" /> Connected
            </span>
          )}
        </div>
        <div className="pt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Groq API Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                className="input-base pl-10"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              Get your free Groq API key <ExternalLink className="h-3 w-3" />
            </a>
            <Button onClick={saveGroqKey} loading={savingKey} disabled={!groqKey.trim()}>
              <Save className="h-4 w-4" /> Save API key
            </Button>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="card divide-y divide-slate-100 dark:divide-slate-800">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Moon className="h-5 w-5 text-slate-500 dark:hidden" />
              <Sun className="h-5 w-5 text-amber-400 hidden dark:block" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Appearance</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Switch between light and dark mode.</p>
            </div>
          </div>
          <button onClick={toggleTheme} className={`relative w-11 h-6 rounded-full transition ${dark ? 'bg-brand-600' : 'bg-slate-300'}`}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${dark ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center">
              <User className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Account email</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{profile?.email || 'Not available'}</p>
            </div>
          </div>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Sign out</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sign out of your StudyFlow account.</p>
          </div>
          <Button variant="danger" onClick={signOut}><LogOut className="h-4 w-4" /> Sign out</Button>
        </div>
      </div>
    </div>
  );
}
