import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Editor from './components/Editor.jsx';
import Controls from './components/Controls.jsx';
import CheatSheet from './components/CheatSheet.jsx';
import TutorialPanel from './components/TutorialPanel.jsx';
import ChallengesPanel from './components/ChallengesPanel.jsx';
import Visualizer from './components/Visualizer.jsx';
import useStrudel from './hooks/useStrudel.js';
import useRecorder from './hooks/useRecorder.js';
import usePatterns from './hooks/usePatterns.js';

const DEFAULT_CODE = `stack(
  note("c4 eb4 g4 bb4").sound("piano").slow(2).room(0.5),
  sound("bd sd bd sd").gain(0.8),
  sound("hh*8").gain(0.4)
)`;

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [patternName, setPatternName] = useState('Untitled');
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const editorViewRef = useRef(null);

  const { play, stop, initAudio, isPlaying, error, samplesLoaded, getStream, getAnalyser, setCps } = useStrudel();
  const [bpm, setBpm] = useState(() => Number(localStorage.getItem('strudel-bpm')) || 120);

  useEffect(() => {
    localStorage.setItem('strudel-bpm', bpm);
    setCps(bpm / 60 / 4);
  }, [bpm, setCps]);
  const { isRecording, isConverting, startRecording, stopRecording, recordingTime } =
    useRecorder(getStream);
  const { patterns, savePattern, deletePattern, renamePattern, importPatterns } = usePatterns();

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

  const insertAtCursor = useCallback((text) => {
    const view = editorViewRef.current;
    if (!view) {
      navigator.clipboard?.writeText(text).catch(() => {});
      return;
    }
    const pos = view.state.selection.main.head;
    view.dispatch({
      changes: { from: pos, insert: text },
      selection: { anchor: pos + text.length },
    });
    view.focus();
  }, []);

  const handlePlay = useCallback(async () => {
    await play(code);
    setCps(bpm / 60 / 4);
  }, [play, setCps, code, bpm]);

  async function handleRecordStart() {
    await initAudio();
    startRecording();
    await play(code);
    setCps(bpm / 60 / 4);
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
        onImport={importPatterns}
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
          samplesLoaded={samplesLoaded}
          onPlay={handlePlay}
          bpm={bpm}
          onBpmChange={setBpm}
          showCheatSheet={showCheatSheet}
          onToggleCheatSheet={() => { setShowCheatSheet(v => !v); setShowTutorial(false); setShowChallenges(false); }}
          showTutorial={showTutorial}
          onToggleTutorial={() => { setShowTutorial(v => !v); setShowCheatSheet(false); setShowChallenges(false); }}
          showChallenges={showChallenges}
          onToggleChallenges={() => { setShowChallenges(v => !v); setShowCheatSheet(false); setShowTutorial(false); }}
          onStop={stop}
          onStartRecording={handleRecordStart}
          onStopRecording={handleRecordStop}
          recordingTime={recordingTime}
          error={error}
        />

        <Visualizer isPlaying={isPlaying} getAnalyser={getAnalyser} />

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <Editor
            code={code}
            onChange={setCode}
            isPlaying={isPlaying}
            onCreateEditor={(view) => { editorViewRef.current = view; }}
          />
          <div style={{
            width: (showCheatSheet || showTutorial || showChallenges) ? 300 : 0,
            transition: 'width 0.2s ease',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {showTutorial
              ? <TutorialPanel onTryCode={setCode} />
              : showChallenges
              ? <ChallengesPanel code={code} />
              : <CheatSheet onInsert={insertAtCursor} />
            }
          </div>
        </div>
      </main>
    </div>
  );
}
