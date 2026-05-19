import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, hoverTooltip } from '@codemirror/view';

// ── Strudel function documentation ───────────────────────────────────────────

const STRUDEL_DOCS = {
  // Sound & Notes
  note:      'Sets the pitch. e.g. note("c3 e3 g3") — use note names or MIDI numbers',
  sound:     'Picks the instrument. e.g. .sound("piano") — try piano, bd, sd, hh, gtr, moog',
  stack:     'Plays multiple patterns simultaneously. e.g. stack(pattern1, pattern2)',
  cat:       'Plays patterns in sequence one after another. e.g. cat(pattern1, pattern2)',
  // Volume & Dynamics
  gain:      'Controls volume. e.g. .gain(0.8) — 0 is silent, 1 is full volume, can go higher',
  // Timing
  slow:      'Slows the pattern down. e.g. .slow(2) plays at half speed',
  fast:      'Speeds the pattern up. e.g. .fast(2) plays at double speed',
  every:     'Applies a function periodically. e.g. .every(4, fast(2)) every 4 cycles',
  // Effects
  room:      'Adds reverb. e.g. .room(0.5) — 0 is dry, 1 is very reverby',
  delay:     'Adds echo. e.g. .delay(0.5) — 0 is no delay, 1 is heavy echo',
  lpf:       'Low pass filter — cuts high frequencies. e.g. .lpf(500) — lower = darker sound',
  hpf:       'High pass filter — cuts low frequencies. e.g. .hpf(200) — higher = thinner sound',
  pan:       'Stereo position. e.g. .pan(-1) far left, .pan(0) center, .pan(1) far right',
  crush:     'Bit crusher distortion. e.g. .crush(4) — lower = more distorted',
  // Pattern Modifiers
  rev:       'Reverses the pattern. e.g. .rev()',
  palindrome: 'Plays pattern forward then backward. e.g. .palindrome()',
  euclid:    'Euclidean rhythm. e.g. .euclid(3,8) — 3 hits spread across 8 steps',
  sometimes: 'Randomly applies effect ~50% of cycles. e.g. .sometimes(fast(2))',
  often:     'Randomly applies effect ~75% of cycles. e.g. .often(rev)',
  rarely:    'Randomly applies effect ~25% of cycles. e.g. .rarely(fast(2))',
  scale:     'Maps numbers to a musical scale. e.g. .scale("C:minor")',
  chord:     'Expands note names into full chords. e.g. note("c3").chord()',
  // Modulation
  sine:      'Sine wave LFO for modulation. e.g. .lpf(sine.range(200, 2000).slow(4))',
  range:     'Sets min/max range for a modulation signal. e.g. sine.range(200, 2000)',
};

// ── Tooltip DOM builder ───────────────────────────────────────────────────────

function makeTooltipDom(name, docStr) {
  // Split "description. e.g. example — note" into parts
  const [beforeEg, afterEg] = docStr.split(' e.g. ');
  const [example, trailing] = afterEg ? afterEg.split(' — ') : [null, null];
  const desc = trailing ? `${beforeEg} — ${trailing}` : beforeEg;

  const wrap = document.createElement('div');
  wrap.style.cssText = [
    'background:#111827',
    'border:1px solid #374151',
    'border-radius:6px',
    'padding:8px 10px',
    'max-width:260px',
    'font-size:12px',
    'line-height:1.45',
    'box-shadow:0 4px 16px rgba(0,0,0,0.6)',
  ].join(';');

  const nameEl = document.createElement('div');
  nameEl.textContent = name;
  nameEl.style.cssText = 'color:#34d399;font-weight:700;font-family:monospace;margin-bottom:4px';
  wrap.appendChild(nameEl);

  const descEl = document.createElement('div');
  descEl.textContent = desc;
  descEl.style.cssText = 'color:#e5e7eb;font-family:sans-serif';
  wrap.appendChild(descEl);

  if (example) {
    const egEl = document.createElement('div');
    egEl.textContent = `e.g. ${example}`;
    egEl.style.cssText = 'color:#6b7280;font-style:italic;font-family:monospace;margin-top:4px';
    wrap.appendChild(egEl);
  }

  return wrap;
}

// ── hoverTooltip extension ────────────────────────────────────────────────────

const strudelHover = hoverTooltip(
  (view, pos) => {
    const word = view.state.wordAt(pos);
    if (!word) return null;
    const name = view.state.sliceDoc(word.from, word.to);
    const doc = STRUDEL_DOCS[name];
    if (!doc) return null;
    return {
      pos: word.from,
      end: word.to,
      above: true,
      create() {
        return { dom: makeTooltipDom(name, doc) };
      },
    };
  },
  { hoverTime: 300 },
);

// Reset CM6 tooltip shell so our inline styles are in full control
const tooltipTheme = EditorView.theme({
  '.cm-tooltip': {
    background: 'transparent !important',
    border: 'none !important',
    boxShadow: 'none !important',
    padding: '0 !important',
  },
});

// ── Editor component ──────────────────────────────────────────────────────────

const fullHeightTheme = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-content': { minHeight: '100%' },
});

export default function Editor({ code, onChange, isPlaying, onCreateEditor }) {
  return (
    <div
      className={isPlaying ? 'editor-playing' : undefined}
      style={{ flex: 1, minWidth: 0, overflow: 'hidden', height: '100%' }}
    >
      <CodeMirror
        value={code}
        onChange={onChange}
        onCreateEditor={onCreateEditor}
        extensions={[javascript(), fullHeightTheme, tooltipTheme, strudelHover]}
        theme={oneDark}
        height="100%"
        style={{ height: '100%', fontSize: '14px' }}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightActiveLine: true,
          highlightSelectionMatches: false,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: false,
          historyKeymap: true,
          foldKeymap: false,
          completionKeymap: false,
          lintKeymap: false,
        }}
      />
    </div>
  );
}
