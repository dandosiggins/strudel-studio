import { useState, useEffect, useRef } from 'react';
import Editor from './Editor.jsx';

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

// ── Performance visualizer ─────────────────────────────────────────────────

function usePerformanceCanvas({ canvasRef, edgeRef, getAnalyser, isPlaying }) {
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    return () => ro.disconnect();
  }, [canvasRef]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf;

    function draw() {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const analyser = getAnalyser();

      if (!analyser || !isPlayingRef.current) {
        // Dim centerline pulse when idle
        ctx.fillStyle = 'rgba(52,211,153,0.05)';
        ctx.fillRect(0, h / 2 - 1, w, 2);
        raf = requestAnimationFrame(draw);
        return;
      }

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      // Bass bins 0-7 → screen edge glow
      let bassSum = 0;
      for (let i = 0; i < 8; i++) bassSum += data[i];
      const bass = bassSum / (8 * 255);
      if (edgeRef.current) {
        const r = Math.round(bass * 160);
        const a1 = (bass * 0.28).toFixed(3);
        const a2 = (bass * 0.12).toFixed(3);
        edgeRef.current.style.boxShadow =
          `inset 0 0 ${r}px rgba(52,211,153,${a1}), inset 0 0 ${r * 2}px rgba(16,185,129,${a2})`;
      }

      const cx = w / 2;
      const cy = h / 2;
      const barW = Math.max(2, Math.floor(w / 160));
      const gap = 1;
      const step = barW + gap;
      const numBars = Math.floor(cx / step);
      const usedBins = Math.floor(analyser.frequencyBinCount * 0.7);

      for (let i = 0; i < numBars; i++) {
        const bin = Math.floor((i / numBars) * usedBins);
        const v = data[bin] / 255;
        const halfH = Math.max(1, v * cy * 0.88);
        const alpha = (0.08 + v * 0.92).toFixed(2);
        const green = Math.round(150 + v * 61);

        ctx.shadowColor = `rgba(52,211,153,${(v * 0.85).toFixed(2)})`;
        ctx.shadowBlur = v > 0.15 ? 8 + v * 18 : 0;
        ctx.fillStyle = `rgba(52,${green},99,${alpha})`;

        const rx = cx + i * step;
        const lx = cx - (i + 1) * step;

        // Bars grow from vertical center → both up and down, mirrored left/right
        ctx.fillRect(rx, cy - halfH, barW, halfH * 2);
        ctx.fillRect(lx, cy - halfH, barW, halfH * 2);

        // Bright caps at bar tips
        if (v > 0.2) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(167,243,208,${Math.min(1, v * 1.3).toFixed(2)})`;
          ctx.fillRect(rx, cy - halfH, barW, 2);
          ctx.fillRect(rx, cy + halfH - 2, barW, 2);
          ctx.fillRect(lx, cy - halfH, barW, 2);
          ctx.fillRect(lx, cy + halfH - 2, barW, 2);
        }
      }

      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      if (edgeRef.current) edgeRef.current.style.boxShadow = 'none';
    };
  }, [canvasRef, edgeRef, getAnalyser]);
}

// ── Main component ─────────────────────────────────────────────────────────

export default function PerformanceMode({
  code,
  onCodeChange,
  patternName,
  isPlaying,
  onPlay,
  onStop,
  bpm,
  onBpmChange,
  getAnalyser,
  isRecording,
  isConverting,
  recordingTime,
  samplesLoaded,
  onStartRecording,
  onStopRecording,
  onExit,
}) {
  const canvasRef = useRef(null);
  const edgeRef = useRef(null);
  const [visible, setVisible] = useState(false);
  // Blink state for recording dot
  const [recBlink, setRecBlink] = useState(true);

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 16);
    return () => clearTimeout(t);
  }, []);

  // Recording dot blink
  useEffect(() => {
    if (!isRecording) { setRecBlink(true); return; }
    const id = setInterval(() => setRecBlink(v => !v), 600);
    return () => clearInterval(id);
  }, [isRecording]);

  // Keyboard shortcuts — re-register when deps change so closures stay fresh
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { onExit(); return; }
      if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.target.closest?.('.cm-editor')) return;
        e.preventDefault();
        if (isPlaying) onStop(); else onPlay();
        return;
      }
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
        if (e.target.closest?.('.cm-editor')) return;
        if (isRecording) onStopRecording(); else onStartRecording();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPlaying, isRecording, onPlay, onStop, onStartRecording, onStopRecording, onExit]);

  usePerformanceCanvas({ canvasRef, edgeRef, getAnalyser, isPlaying });

  const playBlocked = !samplesLoaded || isPlaying || isRecording;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.35s ease',
      overflow: 'hidden',
    }}>

      {/* Scanline overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.045) 3px, rgba(0,0,0,0.045) 4px)',
        pointerEvents: 'none',
        zIndex: 10,
      }} />

      {/* Screen edge glow driven by bass */}
      <div ref={edgeRef} style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 11,
        transition: 'box-shadow 0.06s linear',
      }} />

      {/* Top overlay: pattern name + rec timer */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        padding: '14px 22px',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: 13,
          color: 'rgba(156,163,175,0.3)',
          fontFamily: 'monospace',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          {patternName}
        </span>

        {isRecording && (
          <span style={{
            fontSize: 13,
            color: 'rgba(252,165,165,0.85)',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
          }}>
            <span style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: '#f87171',
              boxShadow: '0 0 7px #f87171',
              opacity: recBlink ? 1 : 0.2,
              transition: 'opacity 0.15s',
              display: 'inline-block',
            }} />
            {formatTime(recordingTime)}
          </span>
        )}
      </div>

      {/* Dramatic visualizer — 60% of height */}
      <canvas
        ref={canvasRef}
        style={{ flex: '0 0 60%', width: '100%', display: 'block', background: '#000' }}
      />

      {/* Controls strip */}
      <div style={{
        flexShrink: 0,
        height: 52,
        background: '#060606',
        borderTop: '1px solid #1a1a1a',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex',
        alignItems: 'center',
        padding: '0 18px',
        gap: 8,
        zIndex: 20,
      }}>

        <PerfBtn onClick={onPlay} disabled={playBlocked} title="Play (Space)">
          <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor"><polygon points="2,1 11,6 2,11" /></svg>
          Play
        </PerfBtn>

        <PerfBtn onClick={onStop} disabled={!isPlaying} danger={isPlaying} title="Stop (Space)">
          <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="2" width="8" height="8" /></svg>
          Stop
        </PerfBtn>

        <div style={{ width: 1, height: 22, background: '#1f1f1f', flexShrink: 0 }} />

        {!isRecording ? (
          <PerfBtn onClick={onStartRecording} disabled={isConverting || !samplesLoaded} title="Record (R)">
            <svg width="9" height="9" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4.5" fill="#f87171" /></svg>
            Rec
          </PerfBtn>
        ) : (
          <PerfBtn onClick={onStopRecording} danger title="Stop recording (R)">
            <svg width="9" height="9" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="4.5" fill="#f87171" opacity={recBlink ? 1 : 0.3} />
            </svg>
            Stop Rec
          </PerfBtn>
        )}

        <div style={{ flex: 1 }} />

        <input
          type="range"
          min="60" max="180" step="1"
          value={bpm}
          onChange={e => onBpmChange(Number(e.target.value))}
          style={{ width: 80, accentColor: '#34d399', cursor: 'pointer' }}
        />
        <input
          type="number"
          min="60" max="180"
          value={bpm}
          onChange={e => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n) && n >= 60 && n <= 180) onBpmChange(n);
          }}
          onBlur={e => {
            const n = Math.max(60, Math.min(180, parseInt(e.target.value, 10) || 120));
            onBpmChange(n);
          }}
          style={{
            width: 42,
            background: 'transparent',
            border: '1px solid #222',
            color: '#d1d5db',
            fontSize: 13,
            fontFamily: 'monospace',
            padding: '2px 4px',
            textAlign: 'center',
            borderRadius: 4,
            outline: 'none',
          }}
        />
        <span style={{ fontSize: 11, color: '#374151', fontFamily: 'monospace', userSelect: 'none' }}>BPM</span>

        <div style={{ width: 1, height: 22, background: '#1f1f1f', flexShrink: 0 }} />

        {/* Exit button */}
        <ExitBtn onClick={onExit} title="Exit performance mode (Esc)" />
      </div>

      {/* Editor — remaining 40% minus controls */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', zIndex: 20 }}>
        <Editor code={code} onChange={onCodeChange} isPlaying={isPlaying} />
      </div>
    </div>
  );
}

// ── Small local UI helpers ─────────────────────────────────────────────────

function PerfBtn({ children, onClick, disabled, danger, title }) {
  const [hov, setHov] = useState(false);
  let bg = 'transparent';
  let color = '#6b7280';
  let border = '#1f1f1f';
  if (disabled) { color = '#2d3748'; }
  else if (danger && hov) { bg = '#7f1d1d'; color = '#fca5a5'; border = '#991b1b'; }
  else if (danger) { bg = '#450a0a'; color = '#fca5a5'; border = '#7f1d1d'; }
  else if (hov) { bg = '#111827'; color = '#e5e7eb'; border = '#374151'; }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => !disabled && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        color,
        fontSize: 11,
        fontFamily: 'sans-serif',
        fontWeight: 500,
        padding: '4px 10px',
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        transition: 'background 0.12s, color 0.12s, border-color 0.12s',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function ExitBtn({ onClick, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'transparent',
        border: `1px solid ${hov ? '#374151' : '#1f1f1f'}`,
        color: hov ? '#9ca3af' : '#4b5563',
        fontSize: 11,
        fontFamily: 'sans-serif',
        padding: '4px 10px',
        borderRadius: 4,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        transition: 'color 0.12s, border-color 0.12s',
        flexShrink: 0,
      }}
    >
      {/* Compress/exit icon */}
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round">
        <polyline points="4,1 4,4 1,4" />
        <polyline points="8,1 8,4 11,4" />
        <polyline points="1,8 4,8 4,11" />
        <polyline points="11,8 8,8 8,11" />
      </svg>
      Exit
    </button>
  );
}
