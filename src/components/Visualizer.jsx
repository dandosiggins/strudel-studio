import { useRef, useEffect, useCallback } from 'react';

const H = 80;
const FRAME_MS = 1000 / 30;
const OFFSCREEN_OK =
  typeof HTMLCanvasElement !== 'undefined' &&
  typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function';

export default function Visualizer({ isPlaying, getAnalyser, vizEnabled = true }) {
  const canvasRef = useRef(null);
  // Worker path
  const workerRef = useRef(null);
  const intervalRef = useRef(null);
  // Fallback path (no OffscreenCanvas)
  const ctx2dRef = useRef(null);
  const rafRef = useRef(null);
  const wRef = useRef(0);
  const lastDrawRef = useRef(0);
  // Shared
  const freqBufRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const vizEnabledRef = useRef(vizEnabled);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { vizEnabledRef.current = vizEnabled; }, [vizEnabled]);

  // ── Canvas init ────────────────────────────────────────────────────────
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
      const dpr = window.devicePixelRatio || 1;
      worker.postMessage(
        { type: 'init', canvas: offscreen, mode: 'main', w: canvas.clientWidth, h: H, dpr },
        [offscreen]
      );
      const ro = new ResizeObserver(() => {
        if (workerRef.current) {
          workerRef.current.postMessage({
            type: 'resize', w: canvas.clientWidth, h: H, dpr: window.devicePixelRatio || 1,
          });
        }
      });
      ro.observe(canvas);
      return () => {
        ro.disconnect();
        worker.terminate();
        workerRef.current = null;
      };
    } else {
      // Fallback: 2D context on main thread
      const ctx2d = canvas.getContext('2d');
      ctx2dRef.current = ctx2d;
      const dpr = window.devicePixelRatio || 1;
      const resize = () => {
        wRef.current = canvas.clientWidth;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = H * dpr;
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      return () => { ro.disconnect(); ctx2dRef.current = null; };
    }
  }, []);

  // ── Fallback idle draw ─────────────────────────────────────────────────
  const drawFallbackIdle = useCallback(() => {
    const ctx2d = ctx2dRef.current;
    if (!ctx2d) return;
    const w = wRef.current;
    ctx2d.clearRect(0, 0, w, H);
    const gap = Math.floor(w / 80);
    const barW = Math.max(1, gap - 1);
    ctx2d.fillStyle = 'rgba(16,185,129,0.10)';
    for (let i = 0; i < 80; i++) ctx2d.fillRect(i * gap, H - 2, barW, 2);
  }, []);

  // ── Render loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (OFFSCREEN_OK) {
      // setInterval feeds the worker — stays off the hot RAF callback path
      const id = setInterval(() => {
        const worker = workerRef.current;
        if (!worker) return;
        const playing = isPlayingRef.current && vizEnabledRef.current;
        const analyser = getAnalyser();
        if (!playing || !analyser) {
          worker.postMessage({ type: 'draw', isPlaying: false, mode: 'main' });
          return;
        }
        const binCount = analyser.frequencyBinCount;
        if (!freqBufRef.current || freqBufRef.current.length !== binCount) {
          freqBufRef.current = new Uint8Array(binCount);
        }
        analyser.getByteFrequencyData(freqBufRef.current);
        worker.postMessage({
          type: 'draw', isPlaying: true, mode: 'main',
          freqData: freqBufRef.current.slice(),
        });
      }, FRAME_MS);
      intervalRef.current = id;
      return () => clearInterval(id);
    } else {
      // Fallback: throttled RAF on main thread
      const animate = (timestamp) => {
        rafRef.current = requestAnimationFrame(animate);
        if (document.hidden) return;
        if (timestamp - lastDrawRef.current < FRAME_MS) return;
        lastDrawRef.current = timestamp;
        const ctx2d = ctx2dRef.current;
        if (!ctx2d) return;
        const playing = isPlayingRef.current && vizEnabledRef.current;
        const analyser = getAnalyser();
        const w = wRef.current;
        if (!playing || !analyser) { drawFallbackIdle(); return; }
        const bufLen = analyser.frequencyBinCount;
        if (!freqBufRef.current || freqBufRef.current.length !== bufLen) {
          freqBufRef.current = new Uint8Array(bufLen);
        }
        analyser.getByteFrequencyData(freqBufRef.current);
        const data = freqBufRef.current;
        ctx2d.clearRect(0, 0, w, H);
        const gap = Math.floor(w / 80);
        const barW = Math.max(1, gap - 1);
        for (let i = 0; i < 80; i++) {
          const bin = Math.floor((i / 80) * bufLen * 0.7);
          const v = data[bin] / 255;
          const barH = Math.max(2, v * H);
          const x = i * gap, y = H - barH;
          ctx2d.fillStyle = `rgba(16,${Math.floor(150 + v * 61)},129,${0.12 + v * 0.88})`;
          ctx2d.fillRect(x, y, barW, barH);
          if (v > 0.25) {
            ctx2d.fillStyle = `rgba(110,231,183,${v * 0.9})`;
            ctx2d.fillRect(x, y, barW, 2);
          }
        }
      };
      rafRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafRef.current);
    }
  }, [getAnalyser, drawFallbackIdle]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: H, display: 'block' }} />;
}
