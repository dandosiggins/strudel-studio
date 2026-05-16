import { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Editor from './components/Editor.jsx';
import Controls from './components/Controls.jsx';
import useStrudel from './hooks/useStrudel.js';
import useRecorder from './hooks/useRecorder.js';
import usePatterns from './hooks/usePatterns.js';

const DEFAULT_CODE = `stack(
  note("c4 eb4 g4 bb4").sound("triangle").slow(2),
  note("c3 g2 c3 g2").sound("sawtooth").lpf(500).gain(0.4)
)`;

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [patternName, setPatternName] = useState('Untitled');

  const { play, stop, initAudio, isPlaying, error, samplesLoaded, getStream } = useStrudel();
  const { isRecording, isConverting, startRecording, stopRecording, recordingTime } =
    useRecorder(getStream);
  const { patterns, savePattern, deletePattern, renamePattern } = usePatterns();

  function handleLoad(pattern) {
    setCode(pattern.code);
    setPatternName(pattern.name);
  }

  function handleNew() {
    setCode(DEFAULT_CODE);
    setPatternName('Untitled');
  }

  function handleSave(name) {
    savePattern(name, code);
    setPatternName(name);
  }

  async function handleRecordStart() {
    await initAudio();
    startRecording();
    play(code);
  }

  function handleRecordStop() {
    stopRecording();
    stop();
  }

  return (
    <div
        className="bg-gray-950 text-gray-100"
        style={{ height: '100vh', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}
      >
      <Sidebar
        patterns={patterns}
        currentCode={code}
        currentName={patternName}
        onNameChange={setPatternName}
        onSave={handleSave}
        onLoad={handleLoad}
        onDelete={deletePattern}
        onRename={renamePattern}
        onNew={handleNew}
      />

      <main
        className="min-w-0"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
      >
        <div
          className="px-4 py-2 border-b border-gray-800 bg-gray-950 flex items-center justify-between"
          style={{ flexShrink: 0 }}
        >
          <span className="text-xs text-gray-700 font-mono tracking-wide">
            Ctrl+Enter to evaluate · Edit live while playing
          </span>
          {!samplesLoaded && (
            <span className="text-xs text-gray-500 font-mono animate-pulse">
              Loading samples…
            </span>
          )}
        </div>

        <Controls
          isPlaying={isPlaying}
          isRecording={isRecording}
          isConverting={isConverting}
          onPlay={() => play(code)}
          onStop={stop}
          onStartRecording={handleRecordStart}
          onStopRecording={handleRecordStop}
          recordingTime={recordingTime}
          error={error}
        />

        <Editor code={code} onChange={setCode} isPlaying={isPlaying} />
      </main>
    </div>
  );
}
