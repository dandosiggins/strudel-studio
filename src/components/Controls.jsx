function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Controls({
  isPlaying,
  onPlay,
  onStop,
  isRecording,
  isConverting,
  onStartRecording,
  onStopRecording,
  recordingTime,
  error,
}) {
  return (
    <div className="border-b border-gray-800 bg-gray-900 px-4 py-2 flex flex-col gap-1.5" style={{ flexShrink: 0 }}>
      <div className="flex items-center gap-2 flex-wrap">

        {/* Play — disabled while a recording session owns the scheduler */}
        <button
          onClick={onPlay}
          disabled={isPlaying || isRecording}
          title={isRecording ? 'Stop recording first' : undefined}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            isPlaying || isRecording
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          <PlayIcon /> Play
        </button>

        {/* Stop — red when active, clearly disabled when idle */}
        <button
          onClick={onStop}
          disabled={!isPlaying}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
            isPlaying
              ? 'bg-red-700 hover:bg-red-600 active:bg-red-800 text-white'
              : 'bg-gray-800/50 text-gray-700 border border-gray-800 cursor-not-allowed'
          }`}
        >
          <StopIcon /> Stop
        </button>

        <div className="w-px h-5 bg-gray-700" />

        {/* Record / Stop Rec */}
        {!isRecording ? (
          <button
            onClick={onStartRecording}
            disabled={isConverting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
              isConverting
                ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700'
            }`}
          >
            <RecordDot className={isConverting ? 'text-gray-600' : 'text-red-500'} />
            Record
          </button>
        ) : (
          <button
            onClick={onStopRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-900 hover:bg-red-800 text-white text-sm font-medium transition-colors"
          >
            <RecordDot className="text-red-400 animate-pulse" />
            Stop Rec
          </button>
        )}

        {/* Recording timer — appears outside the button, counts up while recording */}
        {isRecording && (
          <span className="text-sm font-mono tabular-nums text-red-300 min-w-[3.5rem]">
            {formatTime(recordingTime)}
          </span>
        )}

        {isConverting && (
          <span className="text-xs text-yellow-400 font-mono animate-pulse">
            Converting to WAV…
          </span>
        )}

      </div>

      {error && (
        <div className="text-red-400 text-xs font-mono bg-red-950/40 border border-red-900 rounded px-3 py-2 whitespace-pre-wrap">
          {error}
        </div>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
      <polygon points="2,1 11,6 2,11" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
      <rect x="2" y="2" width="8" height="8" />
    </svg>
  );
}

function RecordDot({ className }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" className={className}>
      <circle cx="5" cy="5" r="4.5" fill="currentColor" />
    </svg>
  );
}
