const SECTIONS = [
  {
    title: 'Notes & Sound',
    items: [
      { code: 'note("c3 e3 g3").sound("piano")', desc: 'chord' },
      { code: 'sound("bd sd hh")', desc: 'drums' },
      { code: 'note("c3").sound("sawtooth").lpf(500)', desc: 'synth + filter' },
      { code: 'note("c3").sound("bass")', desc: 'bass' },
    ],
  },
  {
    title: 'Rhythm & Timing',
    items: [
      { code: '.slow(2)', desc: 'half speed' },
      { code: '.fast(2)', desc: 'double speed' },
      { code: '.every(4, fast(2))', desc: 'every 4 cycles' },
      { code: 'sound("bd*4")', desc: 'repeat 4×' },
      { code: 'sound("bd [sd hh]")', desc: 'sub-divide' },
    ],
  },
  {
    title: 'Effects',
    items: [
      { code: '.room(0.5)', desc: 'reverb' },
      { code: '.delay(0.5)', desc: 'delay' },
      { code: '.gain(0.8)', desc: 'volume' },
      { code: '.lpf(500)', desc: 'low pass filter' },
      { code: '.hpf(200)', desc: 'high pass filter' },
      { code: '.pan(-1)', desc: 'pan left' },
      { code: '.crush(4)', desc: 'bit crush' },
    ],
  },
  {
    title: 'Patterns',
    items: [
      { code: 'stack(a, b)', desc: 'play together' },
      { code: 'cat(a, b)', desc: 'play in sequence' },
      { code: '"<c3 e3> g3"', desc: 'alternate values' },
      { code: '.add(note("<0 2 4>"))', desc: 'transpose pattern' },
      { code: '.jux(rev)', desc: 'stereo mirror' },
    ],
  },
];

export default function CheatSheet({ onInsert }) {
  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800 overflow-y-auto" style={{ width: 280 }}>
      <div className="px-3 py-2 border-b border-gray-800 flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cheat Sheet</span>
        <span className="text-xs text-gray-600 ml-auto">click to insert</span>
      </div>

      <div className="flex flex-col gap-0 py-1">
        {SECTIONS.map(section => (
          <div key={section.title}>
            <div className="px-3 pt-3 pb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </span>
            </div>
            {section.items.map(item => (
              <button
                key={item.code}
                onClick={() => onInsert(item.code)}
                title={`Insert: ${item.code}`}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-800 active:bg-gray-750 group transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <code className="text-xs text-emerald-400 font-mono truncate">
                    {item.code}
                  </code>
                  <span className="text-xs text-gray-600 group-hover:text-gray-500 shrink-0 transition-colors">
                    {item.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
