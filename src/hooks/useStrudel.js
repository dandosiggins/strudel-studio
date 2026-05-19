import { useState, useRef, useCallback, useEffect } from 'react';
import { webaudioRepl } from '@strudel/webaudio';
import { evalScope } from '@strudel/core';
import { transpiler } from '@strudel/transpiler';
import { getAudioContext, setAudioContext, getSuperdoughAudioController, registerSynthSounds, registerZZFXSounds, samples, soundMap } from 'superdough';

registerSynthSounds();
registerZZFXSounds();

const scopeReady = evalScope(
  import('@strudel/core'),
  import('@strudel/mini'),
  import('@strudel/webaudio'),
  import('@strudel/transpiler'),
);

export default function useStrudel() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [samplesLoaded, setSamplesLoaded] = useState(false);
  const engineRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    // Pass the proxy base URL as the second argument so superdough builds
    // all sample file paths as /api/strudel/... rather than https://strudel.cc/...
    // Both the manifest and every WAV fetch go through the Express proxy,
    // which is server-to-server and has no CORS restriction.
    // Both manifests are served locally; audio loads from GitHub raw (cors: *)
    Promise.all([
      samples('/piano.json'),
      samples('/dirt-samples.json'),
    ])
      .then(() => {
        setSamplesLoaded(true);
        // Pre-warm HTTP cache for common banks so the scheduler's 100ms window
        // doesn't race a cold network fetch on first play.
        const PREFETCH_BANKS = ['piano', 'bd', 'sd', 'hh', 'cp', 'bass', 'gtr', 'juno', 'sitar', 'jvbass', 'bass1', 'pad'];
        const all = soundMap.get();
        for (const name of PREFETCH_BANKS) {
          const bank = all[name]?.data?.samples;
          if (!bank) continue;
          const urls = Array.isArray(bank) ? bank : Object.values(bank).flat();
          urls.forEach(url => {
            if (typeof url === 'string') fetch(url, { mode: 'cors' }).catch(() => {});
          });
        }
      })
      .catch(() => setSamplesLoaded(true));
  }, []);

  const ensureEngine = useCallback(() => {
    if (engineRef.current) return engineRef.current;
    const engine = webaudioRepl({ transpiler });
    engineRef.current = engine;
    return engine;
  }, []);

  const ensureStream = useCallback(() => {
    if (streamRef.current) return streamRef.current;
    const ctx = getAudioContext();
    const controller = getSuperdoughAudioController();
    const mediaDest = ctx.createMediaStreamDestination();
    controller.output.destinationGain.connect(mediaDest);
    streamRef.current = mediaDest.stream;
    return streamRef.current;
  }, []);

  const ensureAnalyser = useCallback(() => {
    if (analyserRef.current) return analyserRef.current;
    const ctx = getAudioContext();
    const controller = getSuperdoughAudioController();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    controller.output.destinationGain.connect(analyser);
    analyserRef.current = analyser;
    return analyser;
  }, []);

  // Create AudioContext with playback latency hint on first call; reuse on subsequent calls.
  const ensureContext = useCallback(async () => {
    await scopeReady;
    const existing = getAudioContext();
    if (!existing || existing.state === 'closed') {
      const newCtx = new AudioContext({ latencyHint: 'playback' });
      newCtx.addEventListener('statechange', () => {
        console.log('[audio] AudioContext statechange →', newCtx.state);
      });
      setAudioContext(newCtx);
      console.log('[audio] AudioContext created — sampleRate:', newCtx.sampleRate,
        '| baseLatency:', newCtx.baseLatency?.toFixed(4) ?? 'n/a', 's',
        '| outputLatency:', newCtx.outputLatency?.toFixed(4) ?? 'n/a', 's');
    }
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
      console.log('[audio] AudioContext resumed — state:', ctx.state);
    }
    return ctx;
  }, []);

  const initAudio = useCallback(async () => {
    await ensureContext();
    ensureStream();
    ensureAnalyser();
  }, [ensureContext, ensureStream, ensureAnalyser]);

  const play = useCallback(async (code) => {
    setError(null);
    try {
      await ensureContext();
      // Ensure previous scheduler is stopped before starting a new evaluate
      const existingScheduler = engineRef.current?.scheduler;
      if (existingScheduler?.started) {
        console.log('[audio] Stopping existing scheduler before new evaluate');
        existingScheduler.stop();
      }
      ensureStream();
      ensureAnalyser();
      const { evaluate } = ensureEngine();
      await evaluate(code);
      setIsPlaying(true);
    } catch (err) {
      setError(err.message ?? String(err));
      setIsPlaying(false);
    }
  }, [ensureContext, ensureEngine, ensureStream, ensureAnalyser]);

  const stop = useCallback(() => {
    engineRef.current?.scheduler?.stop();
    setIsPlaying(false);
  }, []);

  const setCps = useCallback((cps) => {
    engineRef.current?.setCps(cps);
  }, []);

  const getStream = useCallback(() => streamRef.current, []);
  const getAnalyser = useCallback(() => analyserRef.current, []);

  return { play, stop, initAudio, isPlaying, error, samplesLoaded, getStream, getAnalyser, setCps };
}
