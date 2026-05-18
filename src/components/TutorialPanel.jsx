import { useState } from 'react';

const LESSONS = [
  {
    title: 'Your First Sound',
    concept: 'note() and sound()',
    explanation:
      'note() sets the pitch — c3 is middle C. sound() picks the instrument. Try changing "c3" to "e3" or "g3" to hear different notes.',
    code: 'note("c3").sound("piano")',
  },
  {
    title: 'Playing Multiple Notes',
    concept: 'Sequences',
    explanation:
      'Space-separated notes play in sequence across one cycle, then loop. This plays a four-note ascending pattern forever.',
    code: 'note("c3 e3 g3 b3").sound("piano")',
  },
  {
    title: 'Adding Drums',
    concept: 'Drum samples',
    explanation:
      'bd = kick drum, sd = snare, hh = hi-hat. These sample names come from classic Roland drum machines. Try adding "cp" (clap) or "cr" (cymbal ride).',
    code: 'sound("bd sd bd sd")',
  },
  {
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
    title: 'Changing Speed',
    concept: 'slow() and fast()',
    explanation:
      'slow(2) plays at half speed, spreading the loop across two cycles. fast(2) doubles the speed. Try .slow(4) for a dreamy, stretched feel.',
    code: 'note("c3 e3 g3 b3").sound("piano").slow(2)',
  },
  {
    title: 'Adding Effects',
    concept: 'room, delay, lpf',
    explanation:
      'Chain effects with dots. room() adds reverb (0–1), delay() adds echo, lpf() is a low-pass filter that softens bright high frequencies.',
    code: 'note("c3 e3 g3").sound("piano").room(0.8).delay(0.5)',
  },
  {
    title: 'Mini Notation',
    concept: '<> alternation and * repetition',
    explanation:
      '<c3 e3> alternates between c3 and e3 on each cycle — great for chord changes. * repeats a step: "hh*8" plays hi-hat eight times per cycle.',
    code: 'note("<c3 e3> g3 b3").sound("piano")',
  },
  {
    title: 'Your First Full Track',
    concept: 'Putting it all together',
    explanation:
      'Melody with chord alternation, a drum loop, hi-hats for texture, and a Moog bass filtered low. This is the default pattern — now make it yours.',
    code: `stack(
  note("<c4 eb4> g4 bb4").sound("piano").slow(2).room(0.5),
  sound("bd sd bd sd").gain(0.8),
  sound("hh*8").gain(0.3),
  note("c2 g2").sound("moog").slow(4).lpf(400)
)`,
  },
];

const STORAGE_KEY = 'strudel-tutorial-lesson';

export default function TutorialPanel({ onTryCode }) {
  const [index, setIndex] = useState(() => {
    const saved = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
    return isNaN(saved) ? 0 : Math.min(saved, LESSONS.length - 1);
  });
  const [done, setDone] = useState(false);

  function goTo(i) {
    const clamped = Math.max(0, Math.min(i, LESSONS.length - 1));
    setIndex(clamped);
    setDone(false);
    localStorage.setItem(STORAGE_KEY, String(clamped));
  }

  function handleNext() {
    if (index === LESSONS.length - 1) {
      setDone(true);
    } else {
      goTo(index + 1);
    }
  }

  function handlePrev() {
    if (done) {
      setDone(false);
    } else {
      goTo(index - 1);
    }
  }

  const lesson = LESSONS[index];
  const displayNum = index + 1;
  const pct = done ? 100 : Math.round((displayNum / LESSONS.length) * 100);

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800" style={{ width: 300 }}>

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-800 flex items-center gap-2">
        <GradCapIcon className="text-indigo-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-200">Tutorial</span>
        <span className="ml-auto text-xs text-gray-600 font-mono tabular-nums">
          {done ? LESSONS.length : displayNum}&nbsp;/&nbsp;{LESSONS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-gray-800">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {done ? (
        /* Completion screen */
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center">
            <span className="text-3xl">🎉</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100 mb-2">
              You're ready to create!
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              You've learned the fundamentals of Strudel. Experiment — change notes, swap sounds,
              layer patterns, break things, and make something your own.
            </p>
          </div>
          <button
            onClick={() => setDone(false)}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            ← Back to lesson {LESSONS.length}
          </button>
        </div>
      ) : (
        /* Lesson content */
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">

          {/* Title + concept */}
          <div className="px-4 pt-4 pb-3">
            <span className="inline-block text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/70 px-2 py-0.5 rounded-full mb-2.5">
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
              <div className="px-3 py-1 border-b border-gray-800">
                <span className="text-xs text-gray-700 font-mono">strudel</span>
              </div>
              <pre className="px-3 py-3 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre">
                {lesson.code}
              </pre>
            </div>
          </div>

          {/* Try It */}
          <div className="px-4 pb-5">
            <button
              onClick={() => onTryCode(lesson.code)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800 text-white text-xs font-semibold transition-colors"
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
