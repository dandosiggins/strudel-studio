import { useState } from 'react';

// ── Challenge data ────────────────────────────────────────────────────────────

const CHALLENGES = [
  {
    title: 'First Sound',
    goal: 'Make any note play using the piano sound',
    hint: 'Try: note("c3").sound("piano")',
    check: (code) =>
      code.includes('note(') && code.includes('.sound("piano")'),
  },
  {
    title: 'Three Note Sequence',
    goal: 'Play at least 3 different notes in sequence inside note()',
    hint: 'Put multiple notes inside note() separated by spaces — e.g. note("c3 e3 g3")',
    check: (code) => {
      // Find any note("...") call and count space-separated tokens inside
      const m = code.match(/note\(["'`]([^"'`]+)["'`]\)/);
      if (!m) return false;
      // Strip angle-bracket groups then count tokens
      const inner = m[1].replace(/<[^>]*>/g, (s) => s.split(/\s+/)[0]);
      return inner.trim().split(/\s+/).filter(Boolean).length >= 3;
    },
  },
  {
    title: 'Add a Kick Drum',
    goal: 'Add a kick drum (bd) to your pattern',
    hint: 'Try sound("bd") or add "bd" inside a stack()',
    check: (code) => /\bbd\b/.test(code),
  },
  {
    title: 'Stack Two Patterns',
    goal: 'Use stack() to play two patterns simultaneously',
    hint: 'stack(pattern1, pattern2) — separate each pattern with a comma',
    check: (code) => {
      if (!code.includes('stack(')) return false;
      const afterStack = code.slice(code.indexOf('stack('));
      return afterStack.includes(',');
    },
  },
  {
    title: 'Slow It Down',
    goal: 'Make a pattern play at half speed using .slow(2)',
    hint: 'Add .slow(2) at the end of any pattern',
    check: (code) => /\.slow\(\s*2\s*\)/.test(code),
  },
  {
    title: 'Add Reverb',
    goal: 'Add reverb to any sound',
    hint: 'Use .room() with a value between 0 and 1, e.g. .room(0.5)',
    check: (code) => code.includes('.room('),
  },
  {
    title: 'Full Drum Beat',
    goal: 'Create a pattern that uses kick (bd), snare (sd) and hi-hat (hh)',
    hint: 'bd=kick, sd=snare, hh=hi-hat — use them together in sound() or stack()',
    check: (code) =>
      /\bbd\b/.test(code) && /\bsd\b/.test(code) && /\bhh\b/.test(code),
  },
  {
    title: 'Euclidean Rhythm',
    goal: 'Use euclid() to generate a rhythm pattern',
    hint: 'Try sound("bd").euclid(3,8) — spreads 3 hits evenly across 8 steps',
    check: (code) => code.includes('.euclid('),
  },
  {
    title: 'Modulate a Filter',
    goal: 'Use sine to modulate a filter cutoff over time',
    hint: 'Try .lpf(sine.range(200, 2000).slow(4)) on a synth sound like "sawtooth"',
    check: (code) => code.includes('sine') && code.includes('lpf'),
  },
  {
    title: 'Full Track',
    goal: 'Build a track with melody, bass and drums all inside stack()',
    hint: 'Use piano/moog for melody, bd+sd for drums, and a low note (c2, g2) for bass — all inside stack()',
    check: (code) => {
      if (!code.includes('stack(')) return false;
      if (!code.includes('note(')) return false;
      const hasDrums = /\bbd\b/.test(code) || /\bsd\b/.test(code);
      const hasBass =
        code.includes('"moog"') ||
        code.includes('"bass') ||
        code.includes('"jvbass"') ||
        // note() with a pitch in octave 1 or 2
        /note\(["'][^"']*[a-g]b?[12]["']/.test(code);
      return hasDrums && hasBass;
    },
  },
];

const STORAGE_KEY = 'strudel-challenges';
const TOTAL = CHALLENGES.length;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChallengesPanel({ code }) {
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null); // null | 'pass' | 'fail'
  const [completed, setCompleted] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
    } catch {
      return new Set();
    }
  });

  function goTo(i) {
    setIndex(i);
    setResult(null);
  }

  function handleCheck() {
    const passed = CHALLENGES[index].check(code);
    setResult(passed ? 'pass' : 'fail');
    if (passed) {
      setCompleted((prev) => {
        if (prev.has(index)) return prev;
        const next = new Set([...prev, index]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
        return next;
      });
    }
  }

  const challenge = CHALLENGES[index];
  const isCompleted = completed.has(index);
  // Completed challenges always show success; result state drives live feedback
  const showPass = isCompleted || result === 'pass';
  const showFail = !isCompleted && result === 'fail';

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800" style={{ width: 300 }}>

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-800 flex items-center gap-2">
        <TrophyIcon className="text-amber-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-200">Challenges</span>
        <span className="ml-auto text-xs font-mono text-gray-600 tabular-nums">
          {completed.size}&thinsp;/&thinsp;{TOTAL} done
        </span>
      </div>

      {/* Challenge navigator — 10 × 24px buttons fit exactly in 276px content area */}
      <div className="px-3 py-2 border-b border-gray-800 flex gap-1">
        {CHALLENGES.map((_, i) => {
          const done = completed.has(i);
          const active = i === index;
          return (
            <button
              key={i}
              onClick={() => goTo(i)}
              title={`Challenge ${i + 1}: ${CHALLENGES[i].title}`}
              className={`w-6 h-6 rounded text-xs font-mono flex items-center justify-center transition-colors flex-shrink-0 ${
                done
                  ? active
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800/60'
                  : active
                  ? 'bg-amber-800/60 text-amber-200'
                  : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300'
              }`}
            >
              {done ? '✓' : i + 1}
            </button>
          );
        })}
      </div>

      {/* Challenge content */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <div className="px-4 pt-4 pb-3">

          {/* Label row */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              Challenge {index + 1} of {TOTAL}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-sm font-bold text-gray-100 mb-3 leading-snug">
            {challenge.title}
          </h2>

          {/* Goal */}
          <div className="mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <span className="block text-xs font-semibold uppercase tracking-widest text-gray-600 mb-1.5">
              Goal
            </span>
            <p className="text-xs text-gray-300 leading-relaxed">{challenge.goal}</p>
          </div>

          {/* Feedback */}
          {showPass && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center gap-2.5">
              <span className="text-emerald-400 font-bold text-base leading-none">✓</span>
              <span className="text-xs text-emerald-300 font-semibold">Challenge complete!</span>
            </div>
          )}

          {showFail && (
            <div className="mb-4 p-3 rounded-lg bg-amber-950/50 border border-amber-900/50">
              <p className="text-xs font-semibold text-amber-500 mb-1.5">
                Not quite — here's a hint:
              </p>
              <p className="text-xs text-amber-200/70 leading-relaxed font-mono whitespace-pre-wrap">
                {challenge.hint}
              </p>
            </div>
          )}

          {/* Check button */}
          <button
            onClick={handleCheck}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-600 active:bg-amber-800 text-white text-xs font-semibold transition-colors"
          >
            <CheckIcon />
            Check My Code
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t border-gray-800 px-4 py-2.5 flex gap-2">
        <button
          onClick={() => goTo(Math.max(0, index - 1))}
          disabled={index === 0}
          className="flex-1 flex items-center justify-center py-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-500 hover:text-gray-200 text-xs font-medium transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <button
          onClick={() => goTo(Math.min(TOTAL - 1, index + 1))}
          disabled={index === TOTAL - 1}
          className="flex-1 flex items-center justify-center py-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-500 hover:text-gray-200 text-xs font-medium transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function TrophyIcon({ className }) {
  return (
    <svg width="13" height="14" viewBox="0 0 13 14" fill="currentColor" className={className}>
      {/* Cup body */}
      <path d="M2.5 0.5 h8 v5.5 q0 3-4 3.5 Q2.5 9 2.5 6 Z" />
      {/* Left handle */}
      <path d="M2.5 2 H1 a1.2 1.2 0 0 0 0 2.5 h1.5"
        fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* Right handle */}
      <path d="M10.5 2 h1.5 a1.2 1.2 0 0 1 0 2.5 h-1.5"
        fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* Stem */}
      <rect x="5" y="9.5" width="3" height="1.5" rx="0.5" />
      {/* Base */}
      <rect x="3" y="11" width="7" height="2" rx="0.75" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,6 5,9 10,3" />
    </svg>
  );
}
