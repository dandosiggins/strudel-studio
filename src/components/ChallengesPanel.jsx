import { useState } from 'react';

// ── Challenge data ────────────────────────────────────────────────────────────

const BEGINNER = [
  {
    title: 'First Sound',
    goal: 'Make any note play using the piano sound',
    hint: 'Try: note("c3").sound("piano")',
    check: (code) => code.includes('note(') && code.includes('.sound("piano")'),
  },
  {
    title: 'Three Note Sequence',
    goal: 'Play at least 3 different notes in sequence inside note()',
    hint: 'Put multiple notes inside note() separated by spaces — e.g. note("c3 e3 g3")',
    check: (code) => {
      const m = code.match(/note\(["'`]([^"'`]+)["'`]\)/);
      if (!m) return false;
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
        /note\(["'][^"']*[a-g]b?[12]["']/.test(code);
      return hasDrums && hasBass;
    },
  },
];

const INTERMEDIATE = [
  {
    title: 'Alternate Notes',
    goal: 'Use angle brackets < > to alternate between two chords or note groups',
    hint: 'Try note("<c3 e3> <f3 a3>").sound("piano") — the pattern cycles each repetition',
    check: (code) => code.includes('<') && code.includes('>') && code.includes('note('),
  },
  {
    title: 'Sample Variation',
    goal: 'Use :number notation to select different samples from the same bank',
    hint: 'Try sound("bd:0 bd:1 bd:2") — each number picks a different sample variant',
    check: (code) => /[a-z]+:\d/.test(code),
  },
  {
    title: 'Polyrhythm',
    goal: 'Create two patterns of different speeds playing together in a stack()',
    hint: 'Use stack() with .slow() at different values, e.g. .slow(3) on one, .slow(4) on another',
    check: (code) => {
      if (!code.includes('stack(')) return false;
      const slowMatches = [...code.matchAll(/\.slow\((\d+(?:\.\d+)?)\)/g)].map((m) => m[1]);
      return new Set(slowMatches).size >= 2;
    },
  },
  {
    title: 'Scale Mode',
    goal: 'Use .scale() to lock notes to a musical scale',
    hint: 'Try note("0 2 4 7").scale("C:minor") — numbers become scale degrees',
    check: (code) => code.includes('.scale('),
  },
  {
    title: 'Every Transformation',
    goal: 'Use .every() to apply a transformation on a repeating cycle',
    hint: 'Try .every(4, fast(2)) — doubles speed every 4 cycles',
    check: (code) => code.includes('.every('),
  },
  {
    title: 'Stereo Panning',
    goal: 'Pan one sound left and another right using .pan()',
    hint: 'Use .pan(-0.8) for left and .pan(0.8) for right in a stack()',
    check: (code) => {
      const panMatches = [...code.matchAll(/\.pan\(([^)]+)\)/g)].map((m) => parseFloat(m[1]));
      return panMatches.length >= 2 && panMatches.some((v) => v < 0) && panMatches.some((v) => v > 0);
    },
  },
  {
    title: 'Reverse a Pattern',
    goal: 'Reverse the playback order of a pattern using .rev()',
    hint: 'Add .rev() to any pattern — note("c3 e3 g3").sound("piano").rev()',
    check: (code) => code.includes('.rev()'),
  },
  {
    title: 'Delay Effect',
    goal: 'Add a delay/echo effect to a sound',
    hint: 'Use .delay(0.5) — value between 0 and 1 controls feedback depth',
    check: (code) => code.includes('.delay('),
  },
  {
    title: 'Volume Mix',
    goal: 'Use .gain() on at least two separate patterns to balance their volumes',
    hint: 'Add .gain(0.7) to each layer in a stack() — e.g. melody at 0.8, drums at 0.6',
    check: (code) =>
      code.includes('stack(') && (code.match(/\.gain\(/g) || []).length >= 2,
  },
  {
    title: 'Moog Bass Line',
    goal: 'Create a bass line using the moog sound with a low-pass filter',
    hint: 'Try note("c2 g2 f2 g2").sound("moog").gain(0.3).lpf(600).slow(2)',
    check: (code) => code.includes('"moog"') && code.includes('.lpf('),
  },
];

const ADVANCED = [
  {
    title: 'LFO Filter Sweep',
    goal: 'Use sine.range() to slowly sweep a low-pass filter cutoff',
    hint: 'Try .lpf(sine.range(200, 2000).slow(8)) — sine oscillates the cutoff over time',
    check: (code) => code.includes('sine.range(') && code.includes('.lpf('),
  },
  {
    title: 'Euclidean Polyrhythm',
    goal: 'Stack at least two patterns each using .euclid() with different values',
    hint: 'Try stack(sound("bd").euclid(3,8), sound("hh").euclid(5,8))',
    check: (code) => (code.match(/\.euclid\(/g) || []).length >= 2,
  },
  {
    title: 'Randomised Melody',
    goal: 'Use sometimes(), rarely(), or often() to introduce randomness',
    hint: 'Try note("c3 e3 g3").sound("piano").sometimes(rev) — randomly reverses',
    check: (code) =>
      code.includes('sometimes(') || code.includes('rarely(') || code.includes('often('),
  },
  {
    title: 'Chord Progression',
    goal: 'Use alternating chords with < > that change every 4 cycles using .slow()',
    hint: 'Try note("<c3 e3 g3> <f3 a3 c4>").sound("piano").slow(4)',
    check: (code) => {
      if (!code.includes('<') || !code.includes('>')) return false;
      return [...code.matchAll(/\.slow\(\s*(\d+(?:\.\d+)?)\s*\)/g)].some(
        (m) => parseFloat(m[1]) >= 4
      );
    },
  },
  {
    title: 'Full Arrangement',
    goal: 'Build a stack() with at least 4 distinct layers',
    hint: 'Add melody, chords, bass, and drums as separate lines inside stack(...)',
    check: (code) => {
      if (!code.includes('stack(')) return false;
      const stackStart = code.indexOf('stack(') + 6;
      let depth = 0;
      let topCommas = 0;
      for (let i = stackStart; i < code.length; i++) {
        if (code[i] === '(') depth++;
        else if (code[i] === ')') { if (depth === 0) break; depth--; }
        else if (code[i] === ',' && depth === 0) topCommas++;
      }
      return topCommas >= 3;
    },
  },
  {
    title: 'Palindrome Pattern',
    goal: 'Use .palindrome() to make a pattern play forward then backward',
    hint: 'Add .palindrome() to any note sequence — note("c3 e3 g3").sound("piano").palindrome()',
    check: (code) => code.includes('.palindrome()'),
  },
  {
    title: 'Large-Scale Structure',
    goal: 'Use .every(8) or .every(16) to create a transformation that kicks in rarely',
    hint: 'Try .every(8, fast(2)) or .every(16, rev) for big structural changes',
    check: (code) =>
      code.includes('.every(8') || code.includes('.every(16'),
  },
  {
    title: 'Multi-Effect Chain',
    goal: 'Apply at least 3 different effects to a single sound',
    hint: 'Chain .room(), .delay(), .lpf(), .pan(), or .gain() on the same pattern',
    check: (code) => {
      const effects = ['.room(', '.delay(', '.lpf(', '.hpf(', '.pan(', '.gain(', '.crush('];
      return effects.filter((e) => code.includes(e)).length >= 3;
    },
  },
  {
    title: 'Genre Recreation',
    goal: 'Create a pattern that sounds like a recognisable electronic music genre',
    hint: 'Techno: supersaw + bd every beat. House: juno chords + 4-on-floor. Ambient: slow piano + heavy room',
    check: (code) => {
      const hasDrums = /\bbd\b/.test(code) && /\bhh\b/.test(code);
      const hasSynth =
        code.includes('"supersaw"') ||
        code.includes('"juno"') ||
        code.includes('"moog"') ||
        code.includes('"jvbass"') ||
        code.includes('"sawtooth"');
      return hasDrums && hasSynth;
    },
  },
  {
    title: 'Signature Pattern',
    goal: 'Create your most complex original pattern using at least 5 different Strudel features',
    hint: 'Mix: note(), stack(), .slow()/.fast(), effects, .every(), .euclid(), scales, < >, sometimes()…',
    check: (code) => {
      const FEATURES = [
        'note(', '.slow(', '.fast(', '.room(', '.delay(', '.lpf(', '.gain(', '.pan(',
        '.rev()', '.palindrome()', '.every(', '.euclid(', '.scale(', 'sometimes(',
        'sine', '<',
      ];
      return FEATURES.filter((f) => code.includes(f)).length >= 5;
    },
  },
];

const TIERS = [
  { label: 'Beginner', challenges: BEGINNER },
  { label: 'Intermediate', challenges: INTERMEDIATE },
  { label: 'Advanced', challenges: ADVANCED },
];

const STORAGE_KEY = 'strudel-challenges';
const TOTAL = 30;

// ── Helpers for tier-specific colors (complete Tailwind strings only) ─────────

function tierTabActiveClass(ti) {
  if (ti === 0) return 'bg-emerald-800/60 text-emerald-200 border-emerald-700';
  if (ti === 1) return 'bg-sky-800/60 text-sky-200 border-sky-700';
  return 'bg-violet-800/60 text-violet-200 border-violet-700';
}

function navigatorActiveClass(ti) {
  if (ti === 0) return 'bg-amber-800/60 text-amber-200';
  if (ti === 1) return 'bg-sky-700/60 text-sky-200';
  return 'bg-violet-700/60 text-violet-200';
}

function checkBtnClass(ti) {
  if (ti === 0) return 'bg-amber-700 hover:bg-amber-600 active:bg-amber-800 text-white';
  if (ti === 1) return 'bg-sky-700 hover:bg-sky-600 active:bg-sky-800 text-white';
  return 'bg-violet-700 hover:bg-violet-600 active:bg-violet-800 text-white';
}

function tierLabelClass(ti) {
  if (ti === 0) return 'text-amber-600';
  if (ti === 1) return 'text-sky-500';
  return 'text-violet-400';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChallengesPanel({ code }) {
  const [activeTier, setActiveTier] = useState(0);
  const [tierIndices, setTierIndices] = useState([0, 0, 0]);
  const [tierResults, setTierResults] = useState([null, null, null]);
  const [completed, setCompleted] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
    } catch {
      return new Set();
    }
  });

  function tierDoneCount(ti) {
    const start = ti * 10;
    let n = 0;
    for (let i = start; i < start + 10; i++) if (completed.has(i)) n++;
    return n;
  }

  const isIntermediateLocked = tierDoneCount(0) < 7;
  const isAdvancedLocked = tierDoneCount(1) < 7;

  function isTierLocked(ti) {
    if (ti === 1) return isIntermediateLocked;
    if (ti === 2) return isAdvancedLocked;
    return false;
  }

  function goTo(i) {
    setTierIndices((prev) => {
      const next = [...prev];
      next[activeTier] = i;
      return next;
    });
    setTierResults((prev) => {
      const next = [...prev];
      next[activeTier] = null;
      return next;
    });
  }

  function switchTier(ti) {
    if (isTierLocked(ti)) return;
    setActiveTier(ti);
  }

  function handleCheck() {
    const globalIndex = activeTier * 10 + tierIndices[activeTier];
    const passed = TIERS[activeTier].challenges[tierIndices[activeTier]].check(code);
    setTierResults((prev) => {
      const next = [...prev];
      next[activeTier] = passed ? 'pass' : 'fail';
      return next;
    });
    if (passed) {
      setCompleted((prev) => {
        if (prev.has(globalIndex)) return prev;
        const next = new Set([...prev, globalIndex]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
        return next;
      });
    }
  }

  const index = tierIndices[activeTier];
  const result = tierResults[activeTier];
  const globalIndex = activeTier * 10 + index;
  const challenge = TIERS[activeTier].challenges[index];
  const isCompleted = completed.has(globalIndex);
  const showPass = isCompleted || result === 'pass';
  const showFail = !isCompleted && result === 'fail';
  const allDone = completed.size === TOTAL;
  const tierCount = TIERS[activeTier].challenges.length;

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

      {/* Graduate badge */}
      {allDone && (
        <div className="mx-3 mt-2.5 px-3 py-2.5 rounded-lg bg-amber-950/60 border border-amber-700/50 flex items-center gap-2">
          <span className="text-lg leading-none">🎓</span>
          <div>
            <p className="text-xs font-bold text-amber-300">Strudel Graduate!</p>
            <p className="text-xs text-amber-400/70">All 30 challenges complete</p>
          </div>
        </div>
      )}

      {/* Tier tabs */}
      <div className="px-3 pt-2.5 pb-0 flex gap-1.5">
        {TIERS.map((tier, ti) => {
          const locked = isTierLocked(ti);
          const active = ti === activeTier;
          const done = tierDoneCount(ti);
          return (
            <button
              key={tier.label}
              onClick={() => switchTier(ti)}
              disabled={locked}
              title={locked ? `Complete ${ti === 1 ? '7' : '7'} ${ti === 1 ? 'Beginner' : 'Intermediate'} challenges to unlock` : undefined}
              className={`flex-1 py-1.5 rounded-t text-xs font-semibold border-b-2 transition-colors ${
                locked
                  ? 'text-gray-700 border-gray-800 cursor-not-allowed'
                  : active
                  ? tierTabActiveClass(ti)
                  : 'text-gray-500 hover:text-gray-300 border-gray-800 hover:bg-gray-800/50'
              }`}
            >
              {locked ? '🔒 ' : ''}{tier.label}
              {!locked && (
                <span className="ml-1 opacity-60 font-mono text-[10px]">{done}/10</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Challenge navigator */}
      <div className="px-3 py-2 border-b border-gray-800 flex gap-1">
        {TIERS[activeTier].challenges.map((_, i) => {
          const gi = activeTier * 10 + i;
          const done = completed.has(gi);
          const active = i === index;
          return (
            <button
              key={i}
              onClick={() => goTo(i)}
              title={`Challenge ${i + 1}: ${TIERS[activeTier].challenges[i].title}`}
              className={`w-6 h-6 rounded text-xs font-mono flex items-center justify-center transition-colors flex-shrink-0 ${
                done
                  ? active
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800/60'
                  : active
                  ? navigatorActiveClass(activeTier)
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
            <span className={`text-xs font-semibold uppercase tracking-widest ${tierLabelClass(activeTier)}`}>
              {TIERS[activeTier].label} · {index + 1} of {tierCount}
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
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-colors ${checkBtnClass(activeTier)}`}
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
          onClick={() => goTo(Math.min(tierCount - 1, index + 1))}
          disabled={index === tierCount - 1}
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
      <path d="M2.5 0.5 h8 v5.5 q0 3-4 3.5 Q2.5 9 2.5 6 Z" />
      <path d="M2.5 2 H1 a1.2 1.2 0 0 0 0 2.5 h1.5"
        fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10.5 2 h1.5 a1.2 1.2 0 0 1 0 2.5 h-1.5"
        fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="5" y="9.5" width="3" height="1.5" rx="0.5" />
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
