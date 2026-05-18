import { useRef, useEffect, useCallback } from 'react';

const H = 80;
const BAR_COUNT = 80;

export default function Visualizer({ isPlaying, getAnalyser }) {
  const canvasRef = useRef(null);
  const ctx2dRef = useRef(null);
  const wRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
    return () => ro.disconnect();
  }, []);

  const drawIdle = useCallback(() => {
    const ctx2d = ctx2dRef.current;
    if (!ctx2d) return;
    const w = wRef.current;
    ctx2d.clearRect(0, 0, w, H);
    const gap = Math.floor(w / BAR_COUNT);
    const barW = Math.max(1, gap - 1);
    ctx2d.fillStyle = 'rgba(16,185,129,0.10)';
    for (let i = 0; i < BAR_COUNT; i++) {
      ctx2d.fillRect(i * gap, H - 2, barW, 2);
    }
  }, []);

  useEffect(() => {
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      if (document.hidden) return;
      const ctx2d = ctx2dRef.current;
      if (!ctx2d) return;

      const analyser = getAnalyser();
      const w = wRef.current;

      if (!analyser) {
        drawIdle();
        return;
      }

      const bufLen = analyser.frequencyBinCount;
      const data = new Uint8Array(bufLen);
      analyser.getByteFrequencyData(data);

      ctx2d.clearRect(0, 0, w, H);

      const gap = Math.floor(w / BAR_COUNT);
      const barW = Math.max(1, gap - 1);

      for (let i = 0; i < BAR_COUNT; i++) {
        // Map to lower 70% of spectrum — upper bins are mostly empty in music
        const bin = Math.floor((i / BAR_COUNT) * bufLen * 0.7);
        const v = data[bin] / 255;
        const barH = Math.max(2, v * H);
        const x = i * gap;
        const y = H - barH;

        // Emerald: dim at rest, bright when loud
        const alpha = 0.12 + v * 0.88;
        const g = Math.floor(150 + v * 61); // 150→211 (emerald range)
        ctx2d.fillStyle = `rgba(16,${g},129,${alpha})`;
        ctx2d.fillRect(x, y, barW, barH);

        // Bright pixel cap on loud bars
        if (v > 0.25) {
          ctx2d.fillStyle = `rgba(110,231,183,${v * 0.9})`;
          ctx2d.fillRect(x, y, barW, 2);
        }
      }
    };

    if (isPlaying) {
      animate();
    } else {
      cancelAnimationFrame(rafRef.current);
      drawIdle();
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, getAnalyser, drawIdle]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: H, display: 'block' }}
    />
  );
}
