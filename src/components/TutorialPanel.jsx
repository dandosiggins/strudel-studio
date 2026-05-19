import { useState } from 'react';

// ── Lesson data ──────────────────────────────────────────────────────────────

const LESSONS = [
  // BASICS (0–7)
  {
    section: 'Basics',
    title: 'Your First Sound',
    concept: 'note() and sound()',
    explanation:
      'note() sets the pitch — c3 is middle C. sound() picks the instrument. Try changing "c3" to "e3" or "g3" to hear different notes.',
    code: 'note("c3").sound("piano")',
  },
  {
    section: 'Basics',
    title: 'Playing Multiple Notes',
    concept: 'Sequences',
    explanation:
      'Space-separated notes play in sequence across one cycle, then loop. This plays a four-note ascending pattern forever.',
    code: 'note("c3 e3 g3 b3").sound("piano")',
  },
  {
    section: 'Basics',
    title: 'Adding Drums',
    concept: 'Drum samples',
    explanation:
      'bd = kick drum, sd = snare, hh = hi-hat. These sample names come from classic Roland drum machines. Try adding "cp" (clap) or "cr" (ride cymbal).',
    code: 'sound("bd sd bd sd")',
  },
  {
    section: 'Basics',
    title: 'Layering with stack()',
    concept: 'Simultaneous patterns',
    explanation:
      'stack() plays multiple patterns at the same time — each runs as its own loop, all perfectly in sync. This is how full tracks are built.',
    code: `stack(
  note("c3 e3 g3").sound("piano"),
  sound("bd sd bd sd")
)`,
  },
  {
    section: 'Basics',
    title: 'Changing Speed',
    concept: 'slow() and fast()',
    explanation:
      'slow(2) plays at half speed, spreading the loop across two cycles. fast(2) doubles the speed. Try .slow(4) for a dreamy, stretched feel.',
    code: 'note("c3 e3 g3 b3").sound("piano").slow(2)',
  },
  {
    section: 'Basics',
    title: 'Adding Effects',
    concept: 'room, delay, lpf',
    explanation:
      'Chain effects with dots. room() adds reverb (0–1), delay() adds echo, lpf() is a low-pass filter that softens bright high frequencies.',
    code: 'note("c3 e3 g3").sound("piano").room(0.8).delay(0.5)',
  },
  {
    section: 'Basics',
    title: 'Mini Notation',
    concept: '<> alternation and * repetition',
    explanation:
      '<c3 e3> alternates between c3 and e3 on each cycle — great for chord changes. * repeats a step: "hh*8" plays hi-hat eight times per cycle.',
    code: 'note("<c3 e3> g3 b3").sound("piano")',
  },
  {
    section: 'Basics',
    title: 'Your First Full Track',
    concept: 'Putting it all together',
    explanation:
      'Melody with chord alternation, a drum loop, hi-hats for texture, and a filtered bass. This is the default pattern — now make it yours.',
    code: `stack(
  note("<c4 eb4> g4 bb4").sound("piano").slow(2).room(0.5),
  sound("bd sd bd sd").gain(0.8),
  sound("hh*8").gain(0.3),
  note("c2 g2").sound("jvbass").slow(4).lpf(400)
)`,
  },

  // RHYTHM (8–9, continues at 13–14, 16)
  {
    section: 'Rhythm',
    title: 'Randomness',
    concept: 'sometimes(), often(), rarely()',
    explanation:
      'sometimes() randomly applies an effect ~50% of cycles. Try often() (~75%) or rarely() (~25%) to dial in how frequently it fires.',
    code: 'note("c3 e3 g3 b3").sound("piano").sometimes(fast(2))',
  },
  {
    section: 'Rhythm',
    title: 'Euclidean Rhythms',
    concept: 'euclid(hits, steps)',
    explanation:
      'euclid(3,8) spreads 3 hits evenly across 8 steps — the mathematical basis of many world music rhythms. Try euclid(5,8) for a clave feel.',
    code: 'sound("bd").euclid(3,8)',
  },

  // MELODY (10–12, continues at 15)
  {
    section: 'Melody',
    title: 'Chord Progressions',
    concept: 'chord names',
    explanation:
      'chord() interprets note names as chord roots and expands them into full chords. Try swapping C, F, G, Am for your own progressions.',
    code: 'chord("<C F G Am>").sound("piano").slow(4)',
  },
  {
    section: 'Melody',
    title: 'Melody with Scales',
    concept: 'scale() degree mapping',
    explanation:
      'scale() maps numbers to notes in a musical scale — 0 is the root, 2 is the third, 4 the fifth. Try "C:major" or "D:dorian".',
    code: 'note("0 2 4 7 9").scale("C:minor").sound("piano")',
  },
  {
    section: 'Melody',
    title: 'Arpeggiators',
    concept: 'arpeggiate chords',
    explanation:
      'arpa() breaks chords into arpeggios automatically, cycling through the individual notes of each chord.',
    code: `chord("<Cmaj7 Fmaj7 G7 Am7>")
  .sound("piano")
  .arpa("<up down>")
  .slow(4)`,
  },

  // RHYTHM continued (13–14)
  {
    section: 'Rhythm',
    title: 'Pattern Transformation',
    concept: 'rev(), palindrome()',
    explanation:
      'rev() plays the pattern backwards. palindrome() plays it forward then backward — great for melodic phrases that resolve back to the start.',
    code: 'note("c3 d3 e3 f3 g3").sound("piano").rev()',
  },
  {
    section: 'Rhythm',
    title: 'Conditional Patterns',
    concept: 'every(), whenmod()',
    explanation:
      'every(4, fn) applies a function once every 4 cycles. whenmod(8,6, fn) applies it on cycle 6 of every group of 8 — for fills and variations.',
    code: 'sound("bd sd bd sd").every(4, fast(2))',
  },

  // MELODY continued (15)
  {
    section: 'Melody',
    title: 'LFO Modulation',
    concept: 'Oscillating effects over time',
    explanation:
      'sine is a slow-moving wave pattern. range(200,2000) maps it to a frequency range. Chaining it into lpf() creates a filter sweep effect.',
    code: `note("c3 e3 g3").sound("sawtooth")
  .lpf(sine.range(200, 2000).slow(4))`,
  },

  // RHYTHM continued (16)
  {
    section: 'Rhythm',
    title: 'Polyrhythm',
    concept: 'Patterns of different lengths',
    explanation:
      'When patterns have different lengths, they drift against each other, creating shifting accents. Here a 3-step hi-hat pattern plays against a 4-step drum loop.',
    code: `stack(
  sound("bd sd bd sd"),
  sound("hh hh hh").slow(1.5)
)`,
  },

  // ADVANCED (17–19)
  {
    section: 'Advanced',
    title: 'Sampling and Slicing',
    concept: 'Sample variants with :n',
    explanation:
      'The :n suffix selects a specific sample from a bank. bd:0, bd:1, bd:2 are different kick drums — same family, different character.',
    code: 'sound("bd:0 bd:1 bd:2 bd:3")',
  },
  {
    section: 'Advanced',
    title: 'Building Tension',
    concept: 'Gradual pattern evolution',
    explanation:
      'Layering the same melody at different speeds creates a slow-building tension — each pass lines up differently. The every(8) drum fill breaks the loop at the right moment.',
    code: `stack(
  note("c3 eb3 g3").sound("piano").slow(2),
  note("c3 eb3 g3 b3").sound("piano").slow(4).room(0.9),
  sound("bd*2 sd").every(8, fast(2))
)`,
  },
  {
    section: 'Advanced',
    title: 'Live Coding Performance',
    concept: 'Performance-ready patterns',
    explanation:
      'A full performance patch: chord melody, kick/snare, panning hi-hats (sine on pan sweeps left-right), and a filtered bass. Tweak values live while it plays.',
    code: `stack(
  chord("<C F G Am>").sound("piano").slow(4).room(0.6),
  sound("bd sd bd sd").gain(0.8),
  sound("hh*8").gain(0.3).pan(sine),
  note("c2 <g2 f2>").sound("jvbass").slow(4).lpf(800)
)`,
  },
];

// ── Section navigation ────────────────────────────────────────────────────────

const SECTION_TABS = [
  { label: 'Basics',   firstIndex: 0  },
  { label: 'Rhythm',   firstIndex: 8  },
  { label: 'Melody',   firstIndex: 10 },
  { label: 'Advanced', firstIndex: 17 },
];

function sectionTabActiveClass(label) {
  switch (label) {
    case 'Rhythm':   return 'bg-emerald-800/60 text-emerald-200';
    case 'Melody':   return 'bg-violet-800/60 text-violet-200';
    case 'Advanced': return 'bg-amber-800/60 text-amber-200';
    default:         return 'bg-indigo-800/60 text-indigo-200';
  }
}

function conceptTagClass(section) {
  switch (section) {
    case 'Rhythm':   return 'bg-emerald-950 text-emerald-300 border-emerald-800/60';
    case 'Melody':   return 'bg-violet-950 text-violet-300 border-violet-800/60';
    case 'Advanced': return 'bg-amber-950 text-amber-300 border-amber-800/60';
    default:         return 'bg-indigo-950 text-indigo-300 border-indigo-800/60';
  }
}

function sectionLabelClass(section) {
  switch (section) {
    case 'Rhythm':   return 'text-emerald-700';
    case 'Melody':   return 'text-violet-700';
    case 'Advanced': return 'text-amber-700';
    default:         return 'text-indigo-700';
  }
}

function loadBtnClass(section) {
  switch (section) {
    case 'Rhythm':   return 'bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800';
    case 'Melody':   return 'bg-violet-700 hover:bg-violet-600 active:bg-violet-800';
    case 'Advanced': return 'bg-amber-700 hover:bg-amber-600 active:bg-amber-800';
    default:         return 'bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800';
  }
}

function progressBarClass(section) {
  switch (section) {
    case 'Rhythm':   return 'bg-emerald-500';
    case 'Melody':   return 'bg-violet-500';
    case 'Advanced': return 'bg-amber-500';
    default:         return 'bg-indigo-500';
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'strudel-tutorial-lesson';
const TOTAL = LESSONS.length;

export default function TutorialPanel({ onTryCode }) {
  const [index, setIndex] = useState(() => {
    const saved = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
    return isNaN(saved) ? 0 : Math.min(saved, TOTAL - 1);
  });
  const [done, setDone] = useState(false);

  function goTo(i) {
    const clamped = Math.max(0, Math.min(i, TOTAL - 1));
    setIndex(clamped);
    setDone(false);
    localStorage.setItem(STORAGE_KEY, String(clamped));
  }

  function handleNext() {
    if (index === TOTAL - 1) setDone(true);
    else goTo(index + 1);
  }

  function handlePrev() {
    if (done) setDone(false);
    else goTo(index - 1);
  }

  const lesson = LESSONS[index];
  const displayNum = index + 1;
  const pct = done ? 100 : Math.round((displayNum / TOTAL) * 100);

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800" style={{ width: 300 }}>

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-800 flex items-center gap-2">
        <GradCapIcon className="text-indigo-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-200">Tutorial</span>
        <span className="ml-auto text-xs text-gray-600 font-mono tabular-nums">
          {done ? TOTAL : displayNum}&thinsp;/&thinsp;{TOTAL}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-gray-800">
        <div
          className={`h-full transition-all duration-300 ${done ? 'bg-indigo-500' : progressBarClass(lesson.section)}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Section tabs */}
      <div className="px-2 pt-1.5 pb-1 border-b border-gray-800 flex gap-1">
        {SECTION_TABS.map(tab => {
          const isActive = !done && lesson.section === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => goTo(tab.firstIndex)}
              title={`Jump to ${tab.label}`}
              className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                isActive
                  ? sectionTabActiveClass(tab.label)
                  : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {done ? (
        /* ── Completion screen ─────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center text-3xl">
            🎉
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100 mb-2">
              You're ready to create!
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              All {TOTAL} lessons done — from your first note to live performance patterns.
              Now experiment, break things, and make music that's yours.
            </p>
          </div>
          <button
            onClick={() => setDone(false)}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            ← Back to lesson {TOTAL}
          </button>
        </div>
      ) : (
        /* ── Lesson content ────────────────────────────────────── */
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">

          {/* Section label + lesson title */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-semibold uppercase tracking-widest ${sectionLabelClass(lesson.section)}`}>
                {lesson.section}
              </span>
            </div>
            <span className={`inline-block text-xs font-mono border px-2 py-0.5 rounded-full mb-2 ${conceptTagClass(lesson.section)}`}>
              {lesson.concept}
            </span>
            <h2 className="text-sm font-bold text-gray-100 leading-snug">{lesson.title}</h2>
          </div>

          {/* Explanation */}
          <div className="px-4 pb-3">
            <p className="text-xs text-gray-400 leading-relaxed">{lesson.explanation}</p>
          </div>

          {/* Code block */}
          <div className="px-4 pb-3">
            <div className="rounded-lg border border-gray-800 overflow-hidden bg-gray-950">
              <div className="px-3 py-1 border-b border-gray-800 flex items-center">
                <span className="text-xs text-gray-700 font-mono">strudel</span>
              </div>
              <pre className="px-3 py-3 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre">
                {lesson.code}
              </pre>
            </div>
          </div>

          {/* Load into editor */}
          <div className="px-4 pb-5">
            <button
              onClick={() => onTryCode(lesson.code)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-xs font-semibold transition-colors ${loadBtnClass(lesson.section)}`}
            >
              <PlayIcon />
              Load into editor
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="border-t border-gray-800 px-4 py-2.5 flex gap-2">
        <button
          onClick={handlePrev}
          disabled={!done && index === 0}
          className="flex-1 flex items-center justify-center py-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-500 hover:text-gray-200 text-xs font-medium transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <button
          onClick={handleNext}
          disabled={done}
          className="flex-1 flex items-center justify-center py-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-500 hover:text-gray-200 text-xs font-medium transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor">
      <polygon points="2,1 11,6 2,11" />
    </svg>
  );
}

function GradCapIcon({ className }) {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor" className={className}>
      <polygon points="7.5,0 15,4 7.5,8 0,4" />
      <path
        d="M3 5.5 L3 9 Q7.5 11.5 12 9 L12 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="15" y1="4" x2="15" y2="8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
