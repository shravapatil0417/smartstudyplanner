import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Sparkles, User, Trash2, Loader2, AlertCircle, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Explain the difference between SQL and NoSQL databases',
  'Create a study plan for my upcoming exams',
  'What are the key concepts in Object-Oriented Programming?',
  'Help me understand Big O notation',
];

export function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkKey = useCallback(async () => {
    const { data } = await supabase.from('user_settings').select('groq_api_key').maybeSingle();
    setHasKey(!!data?.groq_api_key);
  }, []);

  useEffect(() => { checkKey(); }, [checkKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    setError(null);
    setInput('');

    const userMessage: ChatMessage = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/groq-chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.error || `Request failed (${response.status})`;
        setError(errMsg);
        if (errMsg.includes('API key')) setHasKey(false);
        return;
      }

      const assistantMessage: ChatMessage = { role: 'assistant', content: data.reply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError('Failed to connect to the AI service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  // No API key state
  if (hasKey === false) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">AI Study Assistant</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Get instant help with your studies.</p>
        </div>
        <div className="card p-8 sm:p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mx-auto mb-5">
            <KeyRound className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Connect your Groq API key</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
            To use the AI study assistant, you need to add your free Groq API key in Settings.
            It only takes a minute to get one.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link to="/app/settings" className="btn-primary"><KeyRound className="h-4 w-4" /> Go to Settings</Link>
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Get a free key
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">AI Study Assistant</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Groq</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat}><Trash2 className="h-4 w-4" /> Clear</Button>
        )}
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white mb-4">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">How can I help you study?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center max-w-md">
              Ask me anything about your subjects, get explanations, create study plans, or generate study materials.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-8 max-w-2xl w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 transition group"
                >
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-brand-700 dark:group-hover:text-brand-300">{s}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
              }`}>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white flex-shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
              <span className="text-sm text-slate-500">Thinking...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-500 flex-shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              {error.includes('API key') && (
                <Link to="/app/settings" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline mt-1 inline-block">
                  Go to Settings to add your key
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask me anything about your studies..."
            rows={1}
            className="input-base resize-none max-h-32 pr-12"
            style={{ minHeight: '44px' }}
            disabled={loading}
          />
        </div>
        <Button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="flex-shrink-0 h-[44px]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
