import { useState, useRef } from 'react';

const HISTORY_KEY = 'strudel-ai-history';
const APIKEY_KEY = 'strudel-ai-key';

const SYSTEM_PROMPT = `You are a Strudel live coding music expert.
Generate Strudel pattern code based on the user's description.

Available instruments: piano, bd (kick), sd (snare), hh (hi-hat),
gtr, jvbass, bass1, moog, juno, sitar, supersaw

Available effects: .room() .delay() .lpf() .gain() .pan() .slow() .fast()

Rules:
- Return ONLY valid Strudel code, no explanation
- Always use stack() for multiple layers
- Keep patterns musical and interesting
- Match the mood and style described
- Use appropriate BPM suggestions as comments

Example output for "jazzy piano":
// Try BPM: 90
stack(
  note("<c4 eb4 g4 bb4> <f4 ab4 c5>").sound("piano").slow(2).room(0.6),
  sound("bd sd").gain(0.6),
  sound("hh*8").gain(0.25)
)`;

export default function AIPanel({ onLoadCode }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(APIKEY_KEY) || '');
  const [prompt, setPrompt] = useState('');
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch { return []; }
  });
  const lastPromptRef = useRef('');

  function saveApiKey(key) {
    setApiKey(key);
    localStorage.setItem(APIKEY_KEY, key);
  }

  async function generate(promptText) {
    if (!promptText.trim() || !apiKey.trim()) return;
    setLoading(true);
    setError(null);
    lastPromptRef.current = promptText;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: promptText }],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      const code = data.content?.[0]?.text?.trim() || '';
      setGenerated(code);

      setHistory((prev) => {
        const next = [{ prompt: promptText, code }, ...prev].slice(0, 5);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        return next;
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleGenerate() {
    generate(prompt);
  }

  function handleRegenerate() {
    generate(lastPromptRef.current);
  }

  const canGenerate = !loading && prompt.trim() && apiKey.trim();

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800" style={{ width: 300 }}>

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-800 flex items-center gap-2 flex-shrink-0">
        <SparkleIcon className="text-purple-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-200">AI Assistant</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">

        {/* API Key */}
        <div className="px-4 pt-3 pb-0">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
            Anthropic API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => saveApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-gray-500 placeholder-gray-700"
          />
          <p className="text-xs text-gray-700 mt-1">Stored locally in your browser</p>
        </div>

        {/* Prompt */}
        <div className="px-4 pt-3 pb-0">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
            Describe your pattern
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
            placeholder={"a slow jazzy piano melody with light drums\nheavy techno beat with a dark bassline\nambient pad with reverb that slowly evolves"}
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2.5 py-1.5 resize-none focus:outline-none focus:border-gray-500 placeholder-gray-700 leading-relaxed"
          />
          <p className="text-xs text-gray-700 mt-1">Ctrl+Enter to generate</p>
        </div>

        {/* Generate button */}
        <div className="px-4 pt-3 pb-0">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              canGenerate
                ? 'bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {loading ? <SpinnerIcon /> : <SparkleIcon />}
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-red-950/50 border border-red-900/50">
            <p className="text-xs text-red-400 font-mono break-words">{error}</p>
          </div>
        )}

        {/* Generated output */}
        {generated && !loading && (
          <div className="px-4 pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Generated</span>
              <button
                onClick={handleRegenerate}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                ↻ Regenerate
              </button>
            </div>
            <pre className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {generated}
            </pre>
            <button
              onClick={() => onLoadCode(generated)}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white text-xs font-semibold transition-colors"
            >
              <LoadIcon />
              Load into Editor
            </button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="px-4 pt-3 pb-4 mt-3 border-t border-gray-800">
            <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Recent
            </span>
            <div className="flex flex-col gap-2">
              {history.map((item, i) => (
                <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-400 mb-1.5 leading-snug line-clamp-2">{item.prompt}</p>
                  <button
                    onClick={() => { setGenerated(item.code); onLoadCode(item.code); }}
                    className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors font-medium"
                  >
                    Load →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </div>
  );
}

function SparkleIcon({ className }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
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
