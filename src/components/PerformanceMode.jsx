import { useState, useEffect, useRef } from 'react';
import Editor from './Editor.jsx';

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

const VIZ_NAMES = ['Spectrum', 'Waveform', 'Circular', 'Particles', 'Tunnel'];
const FRAME_MS = 1000 / 30;
const VIZ_STORAGE_KEY = 'strudel-viz';
const OFFSCREEN_OK =
  typeof HTMLCanvasElement !== 'undefined' &&
  typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function';

// ── Draw functions ─────────────────────────────────────────────────────────

function drawIdle(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(52,211,153,0.05)';
  ctx.fillRect(0, h / 2 - 1, w, 2);
}

function drawSpectrum(ctx, w, h, data, analyser) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const barW = Math.max(2, Math.floor(w / 160));
  const gap = 1, step = barW + gap;
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
    ctx.fillRect(rx, cy - halfH, barW, halfH * 2);
    ctx.fillRect(lx, cy - halfH, barW, halfH * 2);

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
}

function drawWaveform(ctx, w, h, waveData) {
  ctx.clearRect(0, 0, w, h);
  const cy = h / 2;
  const sliceWidth = w / (waveData.length - 1);

  let sum = 0;
  for (let i = 0; i < waveData.length; i++) sum += Math.abs(waveData[i] - 128);
  const avgAmp = sum / waveData.length / 128;

  ctx.lineWidth = 1.5 + avgAmp * 3;
  ctx.strokeStyle = `rgba(52,211,153,${(0.55 + avgAmp * 0.45).toFixed(2)})`;
  ctx.shadowColor = 'rgba(52,211,153,0.7)';
  ctx.shadowBlur = 6 + avgAmp * 22;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();

  for (let i = 0; i < waveData.length; i++) {
    const v = (waveData[i] - 128) / 128;
    const y = cy + v * cy * 0.8;
    const x = i * sliceWidth;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      const prevX = (i - 1) * sliceWidth;
      const prevV = (waveData[i - 1] - 128) / 128;
      const prevY = cy + prevV * cy * 0.8;
      const cpX = (prevX + x) / 2;
      ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawCircular(ctx, w, h, data, analyser, rotation) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const baseRadius = Math.min(w, h) * 0.22;
  const maxBarLen = Math.min(w, h) * 0.28;
  const usedBins = Math.floor(analyser.frequencyBinCount * 0.7);
  const numBars = 180;

  let bassSum = 0;
  for (let i = 0; i < 8; i++) bassSum += data[i];
  const bass = bassSum / (8 * 255);

  const pulseR = baseRadius * (0.85 + bass * 0.35);
  ctx.beginPath();
  ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(52,211,153,${(0.15 + bass * 0.45).toFixed(2)})`;
  ctx.lineWidth = 1.5 + bass * 3;
  ctx.shadowColor = 'rgba(52,211,153,0.6)';
  ctx.shadowBlur = bass > 0.2 ? 15 + bass * 25 : 5;
  ctx.stroke();
  ctx.shadowBlur = 0;

  for (let i = 0; i < numBars; i++) {
    const bin = Math.floor((i / numBars) * usedBins);
    const v = data[bin] / 255;
    const angle = (i / numBars) * Math.PI * 2 + rotation;
    const barLen = Math.max(1, v * maxBarLen);
    const x1 = cx + Math.cos(angle) * baseRadius;
    const y1 = cy + Math.sin(angle) * baseRadius;
    const x2 = cx + Math.cos(angle) * (baseRadius + barLen);
    const y2 = cy + Math.sin(angle) * (baseRadius + barLen);
    const green = Math.round(150 + v * 61);
    const alpha = 0.15 + v * 0.85;

    ctx.strokeStyle = `rgba(52,${green},99,${alpha.toFixed(2)})`;
    ctx.lineWidth = Math.max(1, 1.5 + v * 2);
    ctx.shadowColor = v > 0.6 ? `rgba(167,243,208,${(v * 0.8).toFixed(2)})` : 'transparent';
    ctx.shadowBlur = v > 0.6 ? v * 15 : 0;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function drawParticles(ctx, w, h, data, particlesRef) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, 0, w, h);

  let overallAmp = 0;
  for (let i = 0; i < data.length; i++) overallAmp += data[i];
  overallAmp /= data.length * 255;

  let bassSum = 0;
  for (let i = 0; i < 8; i++) bassSum += data[i];
  const bass = bassSum / (8 * 255);

  const spawnCount = Math.floor(1 + overallAmp * 12);
  for (let i = 0; i < spawnCount; i++) {
    particlesRef.current.push({
      x: Math.random() * w,
      y: h + Math.random() * 20,
      vx: (Math.random() - 0.5) * 1.5 * (1 + bass * 3),
      vy: -(1 + Math.random() * 3 + overallAmp * 8),
      size: 1.5 + Math.random() * 3 + overallAmp * 6,
      life: 1.0,
      decay: 0.008 + Math.random() * 0.012 + overallAmp * 0.01,
      brightness: overallAmp,
    });
  }

  particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  for (const p of particlesRef.current) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    p.vx *= 0.99;

    const alpha = Math.max(0, p.life * 0.85);
    const whiteness = Math.round(p.brightness * 160);
    const green = Math.min(255, 150 + whiteness);
    const rb = Math.min(255, 20 + whiteness * 2);

    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rb},${green},${rb},${alpha.toFixed(2)})`;
    if (p.brightness > 0.5) {
      ctx.shadowColor = 'rgba(167,243,208,0.6)';
      ctx.shadowBlur = p.size * 3;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawTunnel(ctx, w, h, data, analyser, time) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy) * 1.1;

  let bassSum = 0;
  for (let i = 0; i < 8; i++) bassSum += data[i];
  const bass = bassSum / (8 * 255);

  let highSum = 0;
  const hStart = Math.floor(analyser.frequencyBinCount * 0.5);
  for (let i = hStart; i < analyser.frequencyBinCount; i++) highSum += data[i];
  const high = highSum / ((analyser.frequencyBinCount - hStart) * 255);

  const numRings = 18;
  for (let i = numRings; i >= 0; i--) {
    const norm = ((i / numRings) + (time * 0.0004)) % 1;
    const r = norm * maxR + bass * 40 * (1 - norm);
    const wobbleAmp = high * 25 * (1 - norm * 0.6);
    const alpha = (1 - norm) * 0.5 + 0.05;
    const green = Math.round(130 + bass * 80 * (1 - norm));
    const lineW = Math.max(0.5, 1 + (1 - norm) * 2 + bass * 3 * (1 - norm));

    ctx.lineWidth = lineW;
    ctx.strokeStyle = `rgba(52,${green},99,${alpha.toFixed(2)})`;
    ctx.shadowColor = bass > 0.3 ? `rgba(52,211,153,${Math.min(1, alpha * 1.5).toFixed(2)})` : 'transparent';
    ctx.shadowBlur = bass > 0.3 ? 10 + bass * 20 : 0;

    if (wobbleAmp > 2) {
      const segments = 64;
      ctx.beginPath();
      for (let s = 0; s <= segments; s++) {
        const angle = (s / segments) * Math.PI * 2;
        const wobble = Math.sin(angle * 6 + time * 0.003) * wobbleAmp;
        const rx = cx + Math.cos(angle) * (r + wobble);
        const ry = cy + Math.sin(angle) * (r + wobble);
        s === 0 ? ctx.moveTo(rx, ry) : ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;
}

// ── Canvas hook ────────────────────────────────────────────────────────────

function useWorkerCanvas({ canvasRef, edgeRef, getAnalyser, isPlaying, vizIndexRef, vizEnabledRef }) {
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  const workerRef = useRef(null);
  const freqBufRef = useRef(null);
  const waveBufRef = useRef(null);
  // fallback-only state
  const particlesRef = useRef([]);
  const lastDrawRef = useRef(0);

  // ── Init: transfer canvas to worker, or set up 2D fallback ────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (OFFSCREEN_OK) {
      const worker = new Worker(
        new URL('../workers/vizWorker.js', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;
      const offscreen = canvas.transferControlToOffscreen();
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      worker.postMessage(
        { type: 'init', canvas: offscreen, mode: 'perf', w: rect.width, h: rect.height, dpr },
        [offscreen]
      );
      const ro = new ResizeObserver(() => {
        const r = canvas.getBoundingClientRect();
        workerRef.current?.postMessage({
          type: 'resize', w: r.width, h: r.height, dpr: window.devicePixelRatio || 1,
        });
      });
      ro.observe(canvas);
      return () => {
        ro.disconnect();
        worker.terminate();
        workerRef.current = null;
        if (edgeRef.current) edgeRef.current.style.boxShadow = 'none';
      };
    } else {
      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      };
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      resize();
      return () => {
        ro.disconnect();
        if (edgeRef.current) edgeRef.current.style.boxShadow = 'none';
      };
    }
  }, [canvasRef, edgeRef]);

  // ── Render loop: setInterval → worker, or fallback RAF ────────────────
  useEffect(() => {
    if (OFFSCREEN_OK) {
      const id = setInterval(() => {
        const worker = workerRef.current;
        if (!worker) return;
        const playing = isPlayingRef.current && vizEnabledRef.current;
        const vizIdx = vizIndexRef.current;
        const analyser = getAnalyser();
        if (!playing || !analyser) {
          worker.postMessage({ type: 'draw', isPlaying: false, mode: 'perf', vizIdx });
          if (edgeRef.current) edgeRef.current.style.boxShadow = 'none';
          return;
        }
        const binCount = analyser.frequencyBinCount;
        if (!freqBufRef.current || freqBufRef.current.length !== binCount) {
          freqBufRef.current = new Uint8Array(binCount);
        }
        analyser.getByteFrequencyData(freqBufRef.current);
        // Edge glow stays on main thread — it's a DOM update, not canvas
        let bassSum = 0;
        for (let i = 0; i < 8; i++) bassSum += freqBufRef.current[i];
        const bass = bassSum / (8 * 255);
        if (edgeRef.current) {
          const r = Math.round(bass * 160);
          edgeRef.current.style.boxShadow =
            `inset 0 0 ${r}px rgba(52,211,153,${(bass * 0.28).toFixed(3)}), inset 0 0 ${r * 2}px rgba(16,185,129,${(bass * 0.12).toFixed(3)})`;
        }
        let waveCopy;
        if (vizIdx === 1) {
          const fftSize = analyser.fftSize;
          if (!waveBufRef.current || waveBufRef.current.length !== fftSize) {
            waveBufRef.current = new Uint8Array(fftSize);
          }
          analyser.getByteTimeDomainData(waveBufRef.current);
          waveCopy = waveBufRef.current.slice();
        }
        worker.postMessage({
          type: 'draw', isPlaying: true, mode: 'perf', vizIdx,
          freqData: freqBufRef.current.slice(),
          waveData: waveCopy,
        });
      }, FRAME_MS);
      return () => clearInterval(id);
    } else {
      // Fallback: throttled RAF on main thread
      const canvas = canvasRef.current;
      if (!canvas) return;
      let raf, rotation = 0, time = 0;
      function draw(timestamp) {
        if (document.hidden) { raf = requestAnimationFrame(draw); return; }
        raf = requestAnimationFrame(draw);
        if (timestamp - lastDrawRef.current < FRAME_MS) return;
        lastDrawRef.current = timestamp;
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.width / dpr, h = canvas.height / dpr;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const analyser = getAnalyser();
        const vizIdx = vizIndexRef.current;
        if (!analyser || !isPlayingRef.current || !vizEnabledRef.current) {
          if (vizIdx === 3) particlesRef.current = [];
          drawIdle(ctx, w, h);
          return;
        }
        time++; rotation += 0.005;
        const binCount = analyser.frequencyBinCount;
        if (!freqBufRef.current || freqBufRef.current.length !== binCount) freqBufRef.current = new Uint8Array(binCount);
        analyser.getByteFrequencyData(freqBufRef.current);
        const freqData = freqBufRef.current;
        let bassSum = 0;
        for (let i = 0; i < 8; i++) bassSum += freqData[i];
        const bass = bassSum / (8 * 255);
        if (edgeRef.current) {
          const r = Math.round(bass * 160);
          edgeRef.current.style.boxShadow =
            `inset 0 0 ${r}px rgba(52,211,153,${(bass * 0.28).toFixed(3)}), inset 0 0 ${r * 2}px rgba(16,185,129,${(bass * 0.12).toFixed(3)})`;
        }
        const fftSize = analyser.fftSize;
        if (!waveBufRef.current || waveBufRef.current.length !== fftSize) waveBufRef.current = new Uint8Array(fftSize);
        analyser.getByteTimeDomainData(waveBufRef.current);
        if (vizIdx === 1) drawWaveform(ctx, w, h, waveBufRef.current);
        else if (vizIdx === 2) drawCircular(ctx, w, h, freqData, analyser, rotation);
        else if (vizIdx === 3) drawParticles(ctx, w, h, freqData, particlesRef);
        else if (vizIdx === 4) drawTunnel(ctx, w, h, freqData, analyser, time);
        else drawSpectrum(ctx, w, h, freqData, analyser);
      }
      raf = requestAnimationFrame(draw);
      return () => {
        cancelAnimationFrame(raf);
        if (edgeRef.current) edgeRef.current.style.boxShadow = 'none';
      };
    }
  }, [canvasRef, edgeRef, getAnalyser, vizIndexRef, vizEnabledRef]);
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
  vizEnabled = true,
}) {
  const canvasRef = useRef(null);
  const edgeRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [recBlink, setRecBlink] = useState(true);

  const [vizIndex, setVizIndex] = useState(() =>
    Math.min(4, Math.max(0, parseInt(localStorage.getItem(VIZ_STORAGE_KEY) || '0', 10)))
  );
  const vizIndexRef = useRef(vizIndex);
  const vizEnabledRef = useRef(vizEnabled);
  useEffect(() => { vizEnabledRef.current = vizEnabled; }, [vizEnabled]);
  const [vizLabel, setVizLabel] = useState('');
  const vizLabelTimerRef = useRef(null);

  useEffect(() => { vizIndexRef.current = vizIndex; }, [vizIndex]);
  useEffect(() => () => clearTimeout(vizLabelTimerRef.current), []);

  function cycleViz() {
    setVizIndex(prev => {
      const next = (prev + 1) % VIZ_NAMES.length;
      vizIndexRef.current = next;
      localStorage.setItem(VIZ_STORAGE_KEY, String(next));
      setVizLabel(VIZ_NAMES[next]);
      clearTimeout(vizLabelTimerRef.current);
      vizLabelTimerRef.current = setTimeout(() => setVizLabel(''), 1500);
      return next;
    });
  }

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 16);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isRecording) { setRecBlink(true); return; }
    const id = setInterval(() => setRecBlink(v => !v), 600);
    return () => clearInterval(id);
  }, [isRecording]);

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
        return;
      }
      if ((e.key === 'v' || e.key === 'V') && !e.ctrlKey && !e.metaKey) {
        if (e.target.closest?.('.cm-editor')) return;
        cycleViz();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPlaying, isRecording, onPlay, onStop, onStartRecording, onStopRecording, onExit]);

  useWorkerCanvas({ canvasRef, edgeRef, getAnalyser, isPlaying, vizIndexRef, vizEnabledRef });

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

      {/* Visualizer name flash */}
      {vizLabel && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 30,
          pointerEvents: 'none',
          fontSize: 22,
          fontFamily: 'monospace',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(52,211,153,0.85)',
          textShadow: '0 0 20px rgba(52,211,153,0.5)',
          transition: 'opacity 0.3s',
        }}>
          {vizLabel}
        </div>
      )}

      {/* Visualizer canvas — 60% of height */}
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

        {/* Visualizer cycle button */}
        <PerfBtn onClick={cycleViz} title={`Visualizer: ${VIZ_NAMES[vizIndex]} — cycle (V)`}>
          <VizIcon />
          {VIZ_NAMES[vizIndex]}
        </PerfBtn>

        <div style={{ width: 1, height: 22, background: '#1f1f1f', flexShrink: 0 }} />

        <ExitBtn onClick={onExit} title="Exit performance mode (Esc)" />
      </div>

      {/* Editor — remaining space */}
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

function VizIcon() {
  return (
    <svg width="11" height="9" viewBox="0 0 14 10" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,5 3,2 5,7 7,3 9,6 11,4 13,5" />
    </svg>
  );
}
