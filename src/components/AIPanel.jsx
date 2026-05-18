import { useState, useEffect, useRef } from 'react';

export default function AIPanel({ onLoadCode }) {
  const [messages, setMessages] = useState([]); // { role: 'user' | 'assistant', content: string }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      const code = (data.code || '')
        .replace(/^```[\w]*\n?/m, '')
        .replace(/\n?```$/m, '')
        .trim();

      setMessages((prev) => [...prev, { role: 'assistant', content: code }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      send();
    }
  }

  function newConversation() {
    setMessages([]);
    setInput('');
    setError(null);
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800" style={{ width: 300 }}>

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-800 flex items-center gap-2 flex-shrink-0">
        <SparkleIcon className="text-purple-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-200">AI Assistant</span>
        {messages.length > 0 && (
          <button
            onClick={newConversation}
            title="Start a new conversation"
            className="ml-auto text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            New ↺
          </button>
        )}
      </div>

      {/* Chat log */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3 flex flex-col gap-3">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg, i) =>
            msg.role === 'user'
              ? <UserMessage key={i} content={msg.content} />
              : <AIMessage key={i} content={msg.content} onLoad={onLoadCode} />
          )
        )}

        {loading && <LoadingMessage />}

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-950/50 border border-red-900/50">
            <p className="text-xs text-red-400 font-mono break-words">{error}</p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 px-3 py-3 flex-shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={messages.length === 0 ? 'Describe a pattern…' : 'Refine or ask a follow-up…'}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2.5 py-1.5 resize-none focus:outline-none focus:border-gray-600 placeholder-gray-700 leading-relaxed"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-gray-700">Ctrl+Enter to send</span>
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              input.trim() && !loading
                ? 'bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {loading ? <SpinnerIcon /> : <SparkleIcon />}
            {loading ? 'Generating…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-2 py-6 gap-3 flex-1">
      <SparkleIcon className="text-purple-900" size={20} />
      <p className="text-xs text-gray-600 leading-relaxed">
        Describe a pattern to get started, then refine it with follow-ups.
      </p>
      <div className="flex flex-col gap-1.5 w-full text-left mt-1">
        {[
          'a slow jazzy piano melody with light drums',
          'heavy techno beat with a dark bassline',
          'ambient pad with reverb that slowly evolves',
        ].map((ex) => (
          <p key={ex} className="text-xs text-gray-700 italic px-2 py-1.5 bg-gray-800/40 rounded">
            "{ex}"
          </p>
        ))}
      </div>
    </div>
  );
}

function UserMessage({ content }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">You</span>
      <p className="text-xs text-gray-300 leading-relaxed bg-gray-800/50 rounded-lg px-3 py-2">
        {content}
      </p>
    </div>
  );
}

function AIMessage({ content, onLoad }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">AI</span>
      <pre className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
        {content}
      </pre>
      <button
        onClick={() => onLoad(content)}
        className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/50 border border-emerald-800/50 text-emerald-400 hover:text-emerald-300 text-xs font-medium transition-colors"
      >
        <LoadIcon /> Load into Editor
      </button>
    </div>
  );
}

function LoadingMessage() {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">AI</span>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg">
        <SpinnerIcon />
        <span className="text-xs text-gray-600">Generating…</span>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SparkleIcon({ className, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function LoadIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,6 6,2 10,6" />
      <line x1="6" y1="2" x2="6" y2="10" />
    </svg>
  );
}
