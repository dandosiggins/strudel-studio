import { useState } from 'react';

// ── Per-genre color helpers (complete Tailwind strings only) ──────────────────

function genreTabActiveClass(gi) {
  if (gi === 0) return 'bg-gray-700/60 text-gray-200 border-gray-600';
  if (gi === 1) return 'bg-amber-800/60 text-amber-200 border-amber-700';
  if (gi === 2) return 'bg-sky-800/60 text-sky-200 border-sky-700';
  if (gi === 3) return 'bg-red-900/60 text-red-200 border-red-800';
  return 'bg-purple-800/60 text-purple-200 border-purple-700';
}

function genreLabelClass(gi) {
  if (gi === 0) return 'text-gray-400';
  if (gi === 1) return 'text-amber-500';
  if (gi === 2) return 'text-sky-400';
  if (gi === 3) return 'text-red-500';
  return 'text-purple-400';
}

function navDotActiveClass(gi) {
  if (gi === 0) return 'bg-gray-600 text-gray-100';
  if (gi === 1) return 'bg-amber-700/70 text-amber-100';
  if (gi === 2) return 'bg-sky-700/70 text-sky-100';
  if (gi === 3) return 'bg-red-800/70 text-red-100';
  return 'bg-purple-700/70 text-purple-100';
}

function loadBtnClass(gi) {
  if (gi === 0) return 'bg-gray-600 hover:bg-gray-500 active:bg-gray-700 text-white';
  if (gi === 1) return 'bg-amber-700 hover:bg-amber-600 active:bg-amber-800 text-white';
  if (gi === 2) return 'bg-sky-700 hover:bg-sky-600 active:bg-sky-800 text-white';
  if (gi === 3) return 'bg-red-800 hover:bg-red-700 active:bg-red-900 text-white';
  return 'bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white';
}

// ── Genre data ────────────────────────────────────────────────────────────────

const GENRES = [
  {
    label: 'Techno',
    bpm: 130,
    lessons: [
      {
        title: 'The Foundation',
        concept: 'Four-on-the-floor kick',
        explanation: 'Techno starts with a kick on every beat — relentless and driving',
        code: `sound("bd bd bd bd").gain(0.9)`,
      },
      {
        title: 'Add the Snare',
        concept: 'Kick + snare backbone',
        explanation: 'Snare on beats 2 and 4 creates the classic techno backbone',
        code: `stack(
  sound("bd bd bd bd").gain(0.9),
  sound("~ sd ~ sd").gain(0.7)
)`,
      },
      {
        title: 'Hi-hat Grid',
        concept: '16th note hi-hats',
        explanation: '16th note hi-hats add urgency and momentum',
        code: `stack(
  sound("bd bd bd bd").gain(0.9),
  sound("~ sd ~ sd").gain(0.7),
  sound("hh*16").gain(0.3).lpf(8000)
)`,
      },
      {
        title: 'Dark Bassline',
        concept: 'Moog bass locked with kick',
        explanation: 'A repetitive low bassline locks with the kick',
        code: `stack(
  sound("bd bd bd bd").gain(0.9),
  sound("~ sd ~ sd").gain(0.7),
  sound("hh*16").gain(0.3),
  note("c1 ~ c1 ~ eb1 ~ c1 ~").sound("moog").lpf(400).gain(0.8)
)`,
      },
      {
        title: 'Full Techno Track',
        concept: 'Complete arrangement',
        explanation: 'Add a filter-swept supersaw chord for atmosphere — full techno track!',
        code: `stack(
  sound("bd bd bd bd").gain(0.9),
  sound("~ sd ~ sd").gain(0.7),
  sound("hh*16").gain(0.25).lpf(8000),
  note("c1 ~ c1 ~ eb1 ~ c1 ~").sound("moog").lpf(sine.range(200,800).slow(8)).gain(0.8),
  note("<c4 eb4 g4> ~ ~ ~").sound("supersaw").room(0.4).gain(0.5).slow(2)
)`,
      },
    ],
  },

  {
    label: 'Jazz',
    bpm: 90,
    lessons: [
      {
        title: 'Jazz Chord Voicing',
        concept: 'Minor 7th chord',
        explanation: 'Minor 7th chords are the foundation of jazz harmony',
        code: `note("<c4 eb4 g4 bb4>").sound("piano").slow(2)`,
      },
      {
        title: 'Walking Bass',
        concept: 'Bass through chord tones',
        explanation: 'A walking bass moves through chord tones smoothly',
        code: `stack(
  note("<c4 eb4 g4 bb4>").sound("piano").slow(2),
  note("c2 eb2 f2 g2").sound("jvbass").gain(0.7)
)`,
      },
      {
        title: 'Brushed Snare',
        concept: 'Light jazz percussion',
        explanation: 'Light snare with reverb gives a brushed jazz feel',
        code: `stack(
  note("<c4 eb4 g4 bb4>").sound("piano").slow(2),
  note("c2 eb2 f2 g2").sound("jvbass").gain(0.7),
  sound("~ sd ~ sd").gain(0.4).room(0.5)
)`,
      },
      {
        title: 'Swing Hi-hats',
        concept: 'Jazz hi-hat pattern',
        explanation: 'Swing hi-hat pattern gives jazz its characteristic feel',
        code: `stack(
  note("<c4 eb4 g4 bb4>").sound("piano").slow(2),
  note("c2 eb2 f2 g2").sound("jvbass").gain(0.7),
  sound("~ sd ~ sd").gain(0.4).room(0.5),
  sound("hh ~ hh hh ~ hh").gain(0.3)
)`,
      },
      {
        title: 'Full Jazz Trio',
        concept: 'Piano, bass and drums',
        explanation: 'A full jazz trio — piano, bass and drums in conversation',
        code: `stack(
  note("<c4 eb4 g4 bb4> <f4 ab4 c5 eb5>").sound("piano").slow(4).room(0.4),
  note("c2 eb2 f2 g2 ab2 g2 f2 eb2").sound("jvbass").gain(0.7),
  sound("~ sd ~ sd").gain(0.4).room(0.6),
  sound("hh ~ hh hh ~ hh hh ~").gain(0.25)
)`,
      },
    ],
  },

  {
    label: 'Ambient',
    bpm: 70,
    lessons: [
      {
        title: 'Sustained Pad',
        concept: 'Slow notes with heavy reverb',
        explanation: 'Long slow notes with heavy reverb create ambient space',
        code: `note("c3 g3 c4").sound("juno").slow(4).room(0.9)`,
      },
      {
        title: 'Filter Sweep',
        concept: 'LFO on the cutoff',
        explanation: 'A slow filter sweep makes the sound breathe and evolve',
        code: `note("c3 g3 c4").sound("juno").slow(4).room(0.9)
  .lpf(sine.range(400, 2000).slow(16))`,
      },
      {
        title: 'Layered Pads',
        concept: 'Two pads at different speeds',
        explanation: 'Layer two pads at different speeds for depth and movement',
        code: `stack(
  note("c3 g3 c4").sound("juno").slow(4).room(0.9).lpf(sine.range(400,2000).slow(16)),
  note("g3 d4 g4").sound("supersaw").slow(8).room(0.9).gain(0.4)
)`,
      },
      {
        title: 'Sparse Melody',
        concept: 'Floating high notes',
        explanation: 'Sparse high notes float over the pads like raindrops',
        code: `stack(
  note("c3 g3 c4").sound("juno").slow(4).room(0.9),
  note("g3 d4 g4").sound("supersaw").slow(8).room(0.9).gain(0.4),
  note("c5 ~ ~ g4 ~ ~ eb5 ~").sound("piano").room(0.9).gain(0.5).slow(2)
)`,
      },
      {
        title: 'Full Ambient Landscape',
        concept: 'Complete soundscape',
        explanation: 'A full ambient landscape — close your eyes and drift',
        code: `stack(
  note("c3 g3 c4").sound("juno").slow(4).room(0.9).lpf(sine.range(400,2000).slow(16)),
  note("g2 d3 g3").sound("supersaw").slow(8).room(0.9).gain(0.3),
  note("c5 ~ ~ g4 ~ ~ eb5 ~").sound("piano").room(0.9).gain(0.4).slow(2).delay(0.6),
  sound("bd ~ ~ ~ ~ ~ ~ ~").gain(0.3).room(0.8)
)`,
      },
    ],
  },

  {
    label: 'Metal',
    bpm: 160,
    lessons: [
      {
        title: 'Power Chord Riff',
        concept: 'Fast low guitar notes',
        explanation: 'Fast repeated low notes form the basis of metal riffing',
        code: `note("c2 c2 eb2 c2").sound("gtr").gain(0.9).fast(2)`,
      },
      {
        title: 'Double Kick',
        concept: 'Relentless bass drum',
        explanation: 'Double kick drums drive the relentless metal energy',
        code: `stack(
  note("c2 c2 eb2 c2").sound("gtr").gain(0.9).fast(2),
  sound("bd bd bd bd bd bd bd bd").gain(0.9)
)`,
      },
      {
        title: 'Snare on 3',
        concept: 'Heavy off-beat snare',
        explanation: 'Snare on beat 3 creates a heavy, off-kilter feel distinctive to metal',
        code: `stack(
  note("c2 c2 eb2 c2").sound("gtr").gain(0.9).fast(2),
  sound("bd bd bd bd bd bd bd bd").gain(0.9),
  sound("~ ~ sd ~ ~ ~ sd ~").gain(0.8)
)`,
      },
      {
        title: 'Bass Lock',
        concept: 'Guitar and bass in unison',
        explanation: 'Bass locks tightly with the guitar riff — this is the wall of sound',
        code: `stack(
  note("c2 c2 eb2 c2").sound("gtr").gain(0.9).fast(2),
  sound("bd bd bd bd bd bd bd bd").gain(0.9),
  sound("~ ~ sd ~ ~ ~ sd ~").gain(0.8),
  note("c1 c1 eb1 c1").sound("bass1").gain(0.9).lpf(600).fast(2)
)`,
      },
      {
        title: 'Full Metal Track',
        concept: 'Complete arrangement',
        explanation: 'Full metal track — guitar, double kick, snare and locked bass. Heavy!',
        code: `stack(
  note("c2 c2 eb2 c2 ~ ~ bb1 ~").sound("gtr").gain(0.9).fast(2),
  sound("bd bd bd bd bd bd bd bd").gain(0.9),
  sound("~ ~ sd ~ ~ ~ sd ~").gain(0.8),
  sound("hh*16").gain(0.15),
  note("c1 c1 eb1 c1 ~ ~ bb0 ~").sound("bass1").gain(0.85).lpf(600).fast(2)
)`,
      },
    ],
  },

  {
    label: 'House',
    bpm: 125,
    lessons: [
      {
        title: 'Four-on-the-Floor',
        concept: 'Steady kick on every beat',
        explanation: 'House shares the four-on-the-floor kick with techno but at a warmer, soulful tempo',
        code: `sound("bd bd bd bd").gain(0.85)`,
      },
      {
        title: 'Off-beat Hi-hat',
        concept: 'Open hi-hat swing',
        explanation: 'Open hi-hats on the off-beats give house its characteristic swing',
        code: `stack(
  sound("bd bd bd bd").gain(0.85),
  sound("~ hh ~ hh").gain(0.5)
)`,
      },
      {
        title: 'Chord Stabs',
        concept: 'Juno chords on 2 and 4',
        explanation: 'Chord stabs on beats 2 and 4 define house — gospel roots in electronic form',
        code: `stack(
  sound("bd bd bd bd").gain(0.85),
  sound("~ hh ~ hh").gain(0.5),
  note("~ c4 ~ c4").sound("juno").gain(0.7).room(0.3)
)`,
      },
      {
        title: 'Moog Bassline',
        concept: 'Synth bass locked with kick',
        explanation: 'A punchy synth bass locks with the kick — the engine of house music',
        code: `stack(
  sound("bd bd bd bd").gain(0.85),
  sound("~ hh ~ hh").gain(0.5),
  note("~ c4 ~ c4").sound("juno").gain(0.7).room(0.3),
  note("c2 ~ c2 c2 ~ c2 c2 ~").sound("moog").lpf(800).gain(0.8)
)`,
      },
      {
        title: 'Full House Track',
        concept: 'Complete arrangement',
        explanation: 'Full house track — four-to-the-floor, juno chords, claps and a sweeping bass',
        code: `stack(
  sound("bd bd bd bd").gain(0.85),
  sound("~ hh ~ hh").gain(0.5),
  sound("cp ~ ~ cp ~ ~ cp ~").gain(0.4),
  note("<c4 f4> <g4 bb4>").sound("juno").slow(2).room(0.4).gain(0.6),
  note("c2 ~ c2 c2 ~ c2 c2 ~").sound("moog").lpf(sine.range(300,1200).slow(8)).gain(0.8)
)`,
      },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function GenrePanel({ onTryCode }) {
  const [activeGenre, setActiveGenre] = useState(0);
  const [lessonIndices, setLessonIndices] = useState([0, 0, 0, 0, 0]);

  const genre = GENRES[activeGenre];
  const lessonIndex = lessonIndices[activeGenre];
  const lesson = genre.lessons[lessonIndex];
  const total = genre.lessons.length;

  function goToLesson(i) {
    setLessonIndices((prev) => {
      const next = [...prev];
      next[activeGenre] = i;
      return next;
    });
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800" style={{ width: 300 }}>

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-800 flex items-center gap-2 flex-shrink-0">
        <MusicNoteIcon className="text-emerald-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-200">Genre Guides</span>
        <span className="ml-auto text-xs text-gray-600 font-mono tabular-nums">
          ~{genre.bpm} BPM
        </span>
      </div>

      {/* Genre tabs */}
      <div className="px-3 pt-2 pb-0 flex gap-1">
        {GENRES.map((g, gi) => (
          <button
            key={g.label}
            onClick={() => setActiveGenre(gi)}
            className={`flex-1 py-1.5 rounded-t text-xs font-semibold border-b-2 transition-colors truncate ${
              gi === activeGenre
                ? genreTabActiveClass(gi)
                : 'text-gray-600 hover:text-gray-400 border-gray-800 hover:bg-gray-800/40'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Lesson navigator */}
      <div className="px-3 py-2 border-b border-gray-800 flex gap-1">
        {genre.lessons.map((_, i) => (
          <button
            key={i}
            onClick={() => goToLesson(i)}
            title={`Lesson ${i + 1}: ${genre.lessons[i].title}`}
            className={`w-6 h-6 rounded text-xs font-mono flex items-center justify-center transition-colors flex-shrink-0 ${
              i === lessonIndex
                ? navDotActiveClass(activeGenre)
                : 'bg-gray-800 text-gray-600 hover:bg-gray-700 hover:text-gray-400'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Lesson content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-4 pt-4 pb-3">

          {/* Label */}
          <div className="mb-3">
            <span className={`text-xs font-semibold uppercase tracking-widest ${genreLabelClass(activeGenre)}`}>
              {genre.label} · Lesson {lessonIndex + 1} of {total}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-sm font-bold text-gray-100 mb-1 leading-snug">
            {lesson.title}
          </h2>

          {/* Concept */}
          <p className="text-xs text-gray-600 mb-3">{lesson.concept}</p>

          {/* Explanation */}
          <div className="mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <p className="text-xs text-gray-300 leading-relaxed">{lesson.explanation}</p>
          </div>

          {/* Code */}
          <pre className="mb-3 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {lesson.code}
          </pre>

          {/* Load button */}
          <button
            onClick={() => onTryCode(lesson.code)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-colors ${loadBtnClass(activeGenre)}`}
          >
            <LoadIcon />
            Load into Editor
          </button>
        </div>
      </div>

      {/* Prev / Next */}
      <div className="border-t border-gray-800 px-4 py-2.5 flex gap-2">
        <button
          onClick={() => goToLesson(Math.max(0, lessonIndex - 1))}
          disabled={lessonIndex === 0}
          className="flex-1 flex items-center justify-center py-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-500 hover:text-gray-200 text-xs font-medium transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <button
          onClick={() => goToLesson(Math.min(total - 1, lessonIndex + 1))}
          disabled={lessonIndex === total - 1}
          className="flex-1 flex items-center justify-center py-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-500 hover:text-gray-200 text-xs font-medium transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function MusicNoteIcon({ className }) {
  return (
    <svg width="13" height="14" viewBox="0 0 13 14" fill="currentColor" className={className}>
      <path d="M5 10.5 V3 l6 -1.5 v2 L7 4.5 V11 a2 2 0 1 1-2-0.5z" />
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
